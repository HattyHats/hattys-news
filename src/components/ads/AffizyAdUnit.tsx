import React, { useRef, useState, useEffect } from 'react';

export interface AffizyAdUnitProps {
  zoneId?: string;
  bannerSize?: string;
  maxWidth?: string;
}

export function AffizyAdUnit({
  zoneId = '1007',
  bannerSize = '480x320',
  maxWidth = 'max-w-[540px]',
}: AffizyAdUnitProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [adLoaded, setAdLoaded] = useState(false);

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

  return (
    <div className="w-full my-3 flex flex-col items-center justify-center">
      <div className={`w-full ${maxWidth} relative mx-auto`} style={{ zIndex: 20 }}>
        <div className="rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--surface-solid)] shadow-sm p-1.5 sm:p-2 flex flex-col items-center justify-center">
          <div ref={containerRef} className="w-full flex items-center justify-center overflow-hidden min-h-[50px]" />
          
          {!adLoaded && (
            <div className="w-full py-2 px-3 flex items-center justify-between text-[11px] font-mono text-[var(--ink-muted)]">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span>AFFIZY NETWORK • ZONE {zoneId} ({bannerSize})</span>
              </span>
              <span className="text-[10px] text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                PENDING REVIEW
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
