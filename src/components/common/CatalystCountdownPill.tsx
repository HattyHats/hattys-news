import React, { memo, useEffect, useState } from 'react';
import { AppMode } from '../../types';
import { formatExactCountdown } from '../../utils/formatters';

interface CatalystCountdownPillProps {
  title: string;
  targetDate: Date;
  mode: AppMode;
  onOpenCatalysts: () => void;
}

/** Isolates the 1-second catalyst countdown tick from the root App tree. */
export const CatalystCountdownPill = memo(function CatalystCountdownPill({
  title,
  targetDate,
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

  const countdown = formatExactCountdown(targetDate, nowMs);

  return (
    <button
      type="button"
      onClick={onOpenCatalysts}
      className="hidden lg:inline-flex shrink-0 items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--surface-solid)] border border-[var(--border)] hover:border-[var(--accent)] text-xs font-mono transition-colors cursor-pointer shadow-sm group text-left touch-manipulation my-0.5 active:scale-95"
      title="View full Macro Catalyst Calendar and exact ticking countdowns"
    >
      <span className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-amber-500" />
        <span className={`text-[10px] font-black uppercase tracking-wider ${mode === 'world' ? 'text-blue-500 dark:text-blue-400' : 'text-[var(--accent)]'}`}>
          NEXT CATALYST:
        </span>
      </span>
      <span className="font-bold text-[var(--ink)] truncate max-w-[160px] xl:max-w-[220px]">
        {title}
      </span>
      <span className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 font-bold text-xs text-amber-500 dark:text-amber-400 font-mono tracking-wider">
        {countdown.formatted}
      </span>
      <span className="text-[10px] text-[var(--ink-muted)] group-hover:text-[var(--accent)] hidden xl:inline">
        [VIEW CALENDAR →]
      </span>
    </button>
  );
});
