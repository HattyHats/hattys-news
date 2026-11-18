import { memo, useRef, useState, useEffect, useMemo } from 'react';

let affizyScanTimer: number | null = null;

/** Coalesce Affizy delivery.js execution across concurrent zone mounts so it runs once per batch instead of once per component mount. */
function scheduleAffizyScan() {
  if (typeof window === 'undefined') return;
  if (affizyScanTimer !== null) {
    window.clearTimeout(affizyScanTimer);
  }
  affizyScanTimer = window.setTimeout(() => {
    affizyScanTimer = null;
    const pending = document.querySelector('.affizy-ad[data-zone]:not([data-affizy-loaded])');
    if (!pending) return;

    const script = document.createElement('script');
    script.src = 'https://affizy.network/delivery.js';
    script.async = true;
    const cleanup = () => {
      try {
        script.remove();
      } catch {}
    };
    script.onload = cleanup;
    script.onerror = cleanup;
    document.body.appendChild(script);
  }, 180);
}

export interface AffizyAdUnitProps {
  zoneId?: string;
  bannerSize?: string;
  maxWidth?: string;
  noCardWrapper?: boolean;
}

function detectCreativeSize(
  adDiv: HTMLElement,
  fallbackW: number,
  fallbackH: number
): { w: number; h: number } {
  const candidates = Array.from(adDiv.querySelectorAll('iframe, img, a, div')) as HTMLElement[];
  for (const el of candidates) {
    const attrW = parseInt(el.getAttribute('width') || '', 10);
    const attrH = parseInt(el.getAttribute('height') || '', 10);
    if (!isNaN(attrW) && !isNaN(attrH) && attrW >= 120 && attrH >= 40) {
      return { w: attrW, h: attrH };
    }
    if (el instanceof HTMLImageElement && el.naturalWidth >= 120 && el.naturalHeight >= 40) {
      return { w: el.naturalWidth, h: el.naturalHeight };
    }
    if (el.offsetWidth >= 120 && el.offsetHeight >= 40) {
      return { w: el.offsetWidth, h: el.offsetHeight };
    }
  }
  return { w: fallbackW, h: fallbackH };
}

export const AffizyAdUnit = memo(function AffizyAdUnit({
  zoneId = '1007',
  bannerSize = '480x320',
  maxWidth = 'max-w-[540px]',
  noCardWrapper = false,
}: AffizyAdUnitProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const [availableWidth, setAvailableWidth] = useState(0);

  const defaultDims = useMemo(() => {
    const match = /^(\d+)\s*x\s*(\d+)$/i.exec(bannerSize.trim());
    return {
      w: match ? parseInt(match[1], 10) : 300,
      h: match ? parseInt(match[2], 10) : 250,
    };
  }, [bannerSize]);

  const [creativeDims, setCreativeDims] = useState<{ w: number; h: number }>(defaultDims);

  useEffect(() => {
    setCreativeDims(defaultDims);
  }, [defaultDims]);

  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;

    const updateWidth = () => {
      const w = el.clientWidth;
      if (w > 0) {
        setAvailableWidth(prev => (prev !== w ? w : prev));
      }
    };

    updateWidth();
    if (typeof ResizeObserver === 'undefined') return;

    const ro = new ResizeObserver(updateWidth);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';
    setAdLoaded(false);
    setCreativeDims(defaultDims);

    // Create target div matching Affizy specification:
    // <div class="affizy-ad" data-zone="..."></div>
    const adDiv = document.createElement('div');
    adDiv.className = 'affizy-ad';
    adDiv.setAttribute('data-zone', zoneId);
    container.appendChild(adDiv);

    const inspectRenderedAd = () => {
      const isVisible = adDiv.style.display !== 'none' && adDiv.children.length > 0;
      setAdLoaded(isVisible);
      if (isVisible) {
        const measured = detectCreativeSize(adDiv, defaultDims.w, defaultDims.h);
        setCreativeDims(prev => (prev.w === measured.w && prev.h === measured.h ? prev : measured));

        const imgEl = adDiv.querySelector('img');
        if (imgEl && !imgEl.complete) {
          imgEl.addEventListener(
            'load',
            () => {
              const postLoad = detectCreativeSize(adDiv, defaultDims.w, defaultDims.h);
              setCreativeDims(prev => (prev.w === postLoad.w && prev.h === postLoad.h ? prev : postLoad));
            },
            { once: true }
          );
        }
      }
    };

    const observer = new MutationObserver(inspectRenderedAd);
    observer.observe(adDiv, {
      attributes: true,
      attributeFilter: ['style'],
      childList: true,
      subtree: true,
    });

    scheduleAffizyScan();

    return () => {
      observer.disconnect();
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [zoneId, defaultDims]);

  const scale =
    availableWidth > 0 && creativeDims.w > 0 && availableWidth < creativeDims.w
      ? Math.max(0.25, availableWidth / creativeDims.w)
      : 1;

  const isScaledDown = adLoaded && scale < 1;
  const scaledHeight = isScaledDown ? Math.round(creativeDims.h * scale) : undefined;

  const renderResponsiveAdSlot = (idleMinHeightClass: string) => (
    <div
      ref={outerRef}
      className={`w-full relative overflow-hidden ${adLoaded ? '' : `flex items-center justify-center ${idleMinHeightClass}`}`}
      style={scaledHeight ? { height: `${scaledHeight}px` } : undefined}
    >
      <div
        ref={containerRef}
        className={isScaledDown ? 'absolute top-0 left-1/2 flex items-start justify-center' : 'w-full flex items-center justify-center'}
        style={
          isScaledDown
            ? {
                width: `${creativeDims.w}px`,
                height: `${creativeDims.h}px`,
                transformOrigin: 'top center',
                transform: `translateX(-50%) scale(${scale})`,
              }
            : undefined
        }
      />
    </div>
  );

  const renderPendingBar = () => (
    <div className="w-full py-2 px-2.5 sm:px-3 flex flex-wrap items-center justify-between gap-2 text-[10px] sm:text-[11px] font-mono text-[var(--ink-muted)]">
      <span className="flex items-center gap-2 min-w-0">
        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
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
        <div className="rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--surface-solid)] shadow-sm p-1 sm:p-2 flex flex-col items-center justify-center">
          {renderResponsiveAdSlot('min-h-[48px]')}
          {!adLoaded && renderPendingBar()}
        </div>
      </div>
    </div>
  );
});
