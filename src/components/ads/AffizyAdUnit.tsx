import React, { useRef, useState, useEffect, useMemo } from 'react';

export interface AffizyAdUnitProps {
  zoneId?: string;
  bannerSize?: string;
  maxWidth?: string;
  noCardWrapper?: boolean;
}

export function AffizyAdUnit({
  zoneId = '1007',
  bannerSize = '480x320',
  maxWidth = 'max-w-[540px]',
  noCardWrapper = false,
}: AffizyAdUnitProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const [scale, setScale] = useState(1);

  const { naturalWidth, naturalHeight } = useMemo(() => {
    const match = /^(\d+)\s*x\s*(\d+)$/i.exec(bannerSize.trim());
    return {
      naturalWidth: match ? parseInt(match[1], 10) : 300,
      naturalHeight: match ? parseInt(match[2], 10) : 250,
    };
  }, [bannerSize]);

  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;

    const updateScale = () => {
      const available = el.clientWidth;
      if (available > 0 && naturalWidth > 0) {
        setScale(available < naturalWidth ? Math.max(0.25, available / naturalWidth) : 1);
      }
    };

    updateScale();
    if (typeof ResizeObserver === 'undefined') return;

    const ro = new ResizeObserver(updateScale);
    ro.observe(el);
    return () => ro.disconnect();
  }, [naturalWidth]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';

    // Create target div matching Affizy specification:
    // <div class="affizy-ad" data-zone="..."></div>
    const adDiv = document.createElement('div');
    adDiv.className = 'affizy-ad';
    adDiv.setAttribute('data-zone', zoneId);
    container.appendChild(adDiv);

    // Watch if Affizy successfully renders an ad inside adDiv
    const observer = new MutationObserver(() => {
      const isVisible = adDiv.style.display !== 'none' && adDiv.children.length > 0;
      setAdLoaded(isVisible);
    });
    observer.observe(adDiv, { attributes: true, attributeFilter: ['style'], childList: true });

    // Inject the delivery script dynamically so it discovers the adDiv on mount
    const script = document.createElement('script');
    script.src = 'https://affizy.network/delivery.js';
    script.async = true;
    container.appendChild(script);

    return () => {
      observer.disconnect();
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [zoneId]);

  const scaledHeight = adLoaded ? Math.round(naturalHeight * scale) : undefined;

  const renderResponsiveAdSlot = (idleMinHeightClass: string) => (
    <div
      ref={outerRef}
      className={`w-full overflow-hidden flex items-center justify-center ${adLoaded ? '' : idleMinHeightClass}`}
      style={scaledHeight ? { height: `${scaledHeight}px` } : undefined}
    >
      <div
        ref={containerRef}
        className="flex items-center justify-center origin-top"
        style={
          scale < 1 && adLoaded
            ? {
                width: `${naturalWidth}px`,
                transform: `scale(${scale})`,
                transformOrigin: 'top center',
              }
            : { width: '100%' }
        }
      />
    </div>
  );

  const renderPendingBar = () => (
    <div className="w-full py-2 px-2.5 sm:px-3 flex flex-wrap items-center justify-between gap-2 text-[10px] sm:text-[11px] font-mono text-[var(--ink-muted)]">
      <span className="flex items-center gap-2 min-w-0">
        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0" />
        <span className="truncate">AFFIZY NETWORK • ZONE {zoneId} ({bannerSize})</span>
      </span>
      <span className="text-[9px] sm:text-[10px] text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 shrink-0">
        PENDING REVIEW
      </span>
    </div>
  );

  if (noCardWrapper) {
    return (
      <div className="w-full flex flex-col items-center justify-center">
        {renderResponsiveAdSlot('min-h-[200px] sm:min-h-[250px]')}
        {!adLoaded && renderPendingBar()}
      </div>
    );
  }

  return (
    <div className="w-full my-3 flex flex-col items-center justify-center">
      <div className={`w-full ${maxWidth} relative mx-auto`} style={{ zIndex: 20 }}>
        <div className="rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--surface-solid)] shadow-sm p-1.5 sm:p-2 flex flex-col items-center justify-center">
          {renderResponsiveAdSlot('min-h-[48px]')}
          {!adLoaded && renderPendingBar()}
        </div>
      </div>
    </div>
  );
}
