import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { X, Calendar, Clock, Copy, Check, Radio } from 'lucide-react';
import { AppMode } from '../../types';
import { getUpcomingCatalysts, formatExactCountdown } from '../../utils/formatters';

export function CatalystCalendarModal({
  isOpen,
  onClose,
  activeMode
}: {
  isOpen: boolean;
  onClose: () => void;
  activeMode: AppMode;
}) {
  const [catFilter, setCatFilter] = useState<'all' | 'macro' | 'crypto' | 'earnings' | 'geopolitics'>('all');
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const events = useMemo(() => getUpcomingCatalysts(), []);

  // Lock background webpage scroll while modal is active
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalTouchAction = document.body.style.touchAction;
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.touchAction = originalTouchAction;
      };
    }
  }, [isOpen]);

  // High-precision 1-second live countdown ticker
  useEffect(() => {
    if (!isOpen) return;
    setNowMs(Date.now());
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredEvents = events.filter(e => catFilter === 'all' || e.category === catFilter);

  const handleCopyIntel = (ev: typeof events[0]) => {
    const countdown = formatExactCountdown(ev.date, nowMs);
    const text = `[HATTY'S NEWS CATALYST INTEL]\nEvent: ${ev.title}\nCategory: ${ev.categoryLabel}\nDate: ${ev.date.toUTCString()}\nCountdown: ${countdown.formatted}\nImpact: ${ev.impact}\nConsensus: ${ev.consensus || 'N/A'}\nNotes: ${ev.impactNote}`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
      }
      setCopiedId(ev.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-2.5 sm:p-5 overflow-hidden overscroll-none select-none">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        className="relative w-full max-w-2xl h-[92vh] sm:h-auto sm:max-h-[88vh] flex flex-col bg-[var(--surface-solid)] border border-[var(--border)] rounded-2xl shadow-2xl z-10 text-[var(--ink)] overflow-hidden select-text"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header with Unmissable Touch-Friendly Close Button */}
        <div className="p-4 sm:p-6 pb-3 border-b border-[var(--border)] bg-[var(--surface-solid)] flex items-start justify-between gap-3 shrink-0 z-20">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className={`w-4 h-4 ${activeMode === 'world' ? 'text-blue-400' : 'text-[var(--accent)]'}`} />
              <span className="font-mono text-[10px] sm:text-[11px] font-bold tracking-widest uppercase text-[var(--ink-muted)]">
                MARKET VOLATILITY RADAR // LIVE COUNTDOWNS
              </span>
            </div>
            <h2 className="font-display text-xl sm:text-2xl text-[var(--ink)] tracking-wide truncate">
              ECONOMIC & CRYPTO CATALYSTS
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Catalyst Calendar"
            className="shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 active:scale-95 text-[var(--ink)] flex items-center justify-center transition-all cursor-pointer border border-[var(--border)] shadow-sm touch-manipulation z-30"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Filter Pills Bar */}
        <div className="px-4 py-2 border-b border-[var(--border)] bg-[var(--bg)] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {[
            { id: 'all', label: 'ALL CATALYSTS' },
            { id: 'macro', label: '🏛️ MACRO & FED' },
            { id: 'crypto', label: '⚡ CRYPTO & ETFs' },
            { id: 'earnings', label: '🔬 TECH & AI' },
            { id: 'geopolitics', label: '🌐 GEOPOLITICS' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setCatFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg font-mono text-[11px] font-bold shrink-0 border transition-all cursor-pointer ${
                catFilter === tab.id
                  ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-sm'
                  : 'bg-[var(--surface-solid)] text-[var(--ink-muted)] border-[var(--border)] hover:text-[var(--ink)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable Events List (Smooth Mobile Touch-Pan) */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-3.5 touch-pan-y -webkit-overflow-scrolling-touch scrollbar-thin">
          {filteredEvents.map(ev => {
            const countdown = formatExactCountdown(ev.date, nowMs);
            return (
              <div
                key={ev.id}
                className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)] hover:border-[var(--accent)]/50 transition-all flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                        ev.impact === 'HIGH'
                          ? 'bg-red-500/15 text-red-500 dark:text-red-400 border-red-500/30'
                          : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                      }`}>
                        {ev.impact === 'HIGH' ? '🔴 HIGH IMPACT' : '🟡 MED IMPACT'}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-black/5 dark:bg-white/5 border border-[var(--border)] text-[var(--ink-muted)]">
                        {ev.categoryLabel}
                      </span>
                      {ev.consensus && (
                        <span className="text-[10px] font-mono text-emerald-500 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          {ev.consensus}
                        </span>
                      )}
                    </div>

                    {/* Live Second-by-Second Digital Ticker Clock */}
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--surface-solid)] border border-[var(--border)] font-mono text-xs font-bold text-[var(--accent)] shadow-sm">
                      <Clock className="w-3.5 h-3.5 animate-pulse text-[var(--accent)]" />
                      <span>{countdown.formatted}</span>
                    </div>
                  </div>

                  <h3 className="font-sans font-bold text-sm sm:text-base text-[var(--ink)] mb-1 leading-snug">
                    {ev.title}
                  </h3>
                  <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
                    {ev.impactNote}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-[var(--border)] text-[11px] font-mono text-[var(--ink-muted)] flex-wrap gap-2">
                  <span>
                    {ev.date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} • {ev.date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                  </span>

                  <button
                    onClick={() => handleCopyIntel(ev)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--surface-solid)] border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] text-xs font-mono transition-all cursor-pointer active:scale-95"
                    title="Copy event intel to clipboard"
                  >
                    {copiedId === ev.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">COPIED</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 opacity-60" />
                        <span>COPY INTEL</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sticky Footer Action Bar */}
        <div className="flex items-center justify-between gap-3 p-3 sm:p-4 border-t border-[var(--border)] bg-[var(--surface-solid)] shrink-0 z-20 text-[10px] sm:text-[11px] font-mono text-[var(--ink-muted)]">
          <div className="flex items-center gap-1.5 text-emerald-500 dark:text-emerald-400 font-bold">
            <Radio className="w-3 h-3 animate-ping" />
            <span>REAL-TIME VOLATILITY RADAR SYNCED</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] text-xs font-mono font-bold transition-all cursor-pointer active:scale-95"
          >
            RETURN TO FEED
          </button>
        </div>
      </motion.div>
    </div>
  );
}
