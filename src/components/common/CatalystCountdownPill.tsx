import React, { memo, useEffect, useState } from 'react';
import { AppMode, CatalystEvent } from '../../types';
import { formatExactCountdown } from '../../utils/formatters';

interface CatalystCountdownPillProps {
  catalyst: CatalystEvent;
  mode: AppMode;
  onOpenCatalysts: () => void;
}

/** Isolates the 1-second catalyst countdown tick from the root App tree. */
export const CatalystCountdownPill = memo(function CatalystCountdownPill({
  catalyst,
  mode,
  onOpenCatalysts,
}: CatalystCountdownPillProps) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const tick = () => {
      if (typeof document === 'undefined' || !document.hidden) {
        setNowMs(Date.now());
      }
    };
    const timer = window.setInterval(tick, 1000);
    const onVisibility = () => {
      if (!document.hidden) setNowMs(Date.now());
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const countdown = formatExactCountdown(catalyst.date, nowMs);
  const accentText = mode === 'world' ? 'text-blue-500 dark:text-blue-400' : 'text-[var(--accent)]';
  const eventWhen = catalyst.date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div className="relative hidden md:inline-flex shrink-0 group my-0.5">
      <button
        type="button"
        onClick={onOpenCatalysts}
        aria-label={`Next Catalyst: ${catalyst.title} in ${countdown.formatted}. Open Macro Catalyst Calendar`}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--surface-solid)] border border-[var(--border)] group-hover:border-[var(--accent)] text-xs font-mono transition-colors cursor-pointer shadow-sm touch-manipulation active:scale-95"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
        <span className={`text-[10px] font-black uppercase tracking-wider ${accentText}`}>
          Next Catalyst
        </span>
        <span className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 font-bold text-[11px] text-amber-500 dark:text-amber-400 font-mono tracking-tight">
          {countdown.formatted}
        </span>
      </button>

      {/* Hover / Focus Popover Card */}
      <div
        role="tooltip"
        className="absolute right-0 top-full pt-1.5 w-72 sm:w-80 z-50 opacity-0 invisible pointer-events-none translate-y-1 group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible group-hover:translate-y-0 group-focus-within:translate-y-0 transition-all duration-150"
      >
        <div className="rounded-xl bg-[var(--surface-solid)] border border-[var(--border)] shadow-2xl p-3 text-left">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${
                  catalyst.impact === 'HIGH'
                    ? 'bg-red-500/15 text-red-500 dark:text-red-400 border-red-500/30'
                    : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                }`}
              >
                {catalyst.impact} IMPACT
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-black/5 dark:bg-white/5 border border-[var(--border)] text-[var(--ink-muted)]">
                {catalyst.categoryLabel}
              </span>
            </div>
            <span className="text-[10px] font-mono text-[var(--ink-muted)] shrink-0">
              {eventWhen}
            </span>
          </div>

          <p className="font-sans font-bold text-xs text-[var(--ink)] leading-snug mb-1">
            {catalyst.title}
          </p>
          <p className="text-[11px] text-[var(--ink-muted)] leading-relaxed line-clamp-3">
            {catalyst.impactNote}
          </p>

          <div className="mt-2 pt-2 border-t border-[var(--border)] flex items-center justify-between gap-2 text-[10px] font-mono">
            {catalyst.consensus ? (
              <span className="text-emerald-500 dark:text-emerald-400 font-bold truncate">
                {catalyst.consensus}
              </span>
            ) : (
              <span />
            )}
            <span className={`${accentText} font-bold shrink-0`}>
              Click for calendar →
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});
