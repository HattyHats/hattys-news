import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { X, Calendar } from 'lucide-react';
import { AppMode } from '../../types';
import { getUpcomingCatalysts, formatCountdown } from '../../utils/formatters';

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
  const events = useMemo(() => getUpcomingCatalysts(), []);

  useEffect(() => {
    if (!isOpen) return;
    setNowMs(Date.now());
    const timer = setInterval(() => setNowMs(Date.now()), 30000);
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredEvents = events.filter(e => catFilter === 'all' || e.category === catFilter);

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-3 sm:p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        className="relative w-full max-w-2xl bg-[var(--surface-solid)] border border-[var(--border)] rounded-2xl p-5 sm:p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto text-[var(--ink)]"
      >
        <button
          className="absolute top-4 right-4 text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors p-1 cursor-pointer"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <Calendar className={`w-4 h-4 ${activeMode === 'world' ? 'text-blue-400' : 'text-[var(--accent)]'}`} />
          <span className="font-mono text-[11px] font-bold tracking-widest uppercase text-[var(--ink-muted)]">
            MARKET VOLATILITY RADAR // UPCOMING CATALYSTS
          </span>
        </div>
        <h2 className="font-display text-3xl sm:text-4xl text-[var(--ink)] tracking-wide mb-4">
          ECONOMIC & CRYPTO CATALYST CALENDAR
        </h2>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 mb-4 border-b border-[var(--border)]">
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
                  : 'bg-[var(--bg)] text-[var(--ink-muted)] border-[var(--border)] hover:text-[var(--ink)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Events List */}
        <div className="space-y-3">
          {filteredEvents.map(ev => (
            <div
              key={ev.id}
              className="p-3.5 sm:p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)] hover:border-[var(--accent)]/50 transition-all"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
                <div className="flex items-center gap-2 flex-wrap">
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
                    <span className="text-[10px] font-mono text-[var(--ink-muted)]">
                      • {ev.consensus}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="text-[var(--ink-muted)]">
                    {ev.date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} • {ev.date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold text-[10px]">
                    {formatCountdown(ev.date, nowMs)}
                  </span>
                </div>
              </div>

              <h3 className="font-sans font-bold text-sm sm:text-base text-[var(--ink)] mb-1">
                {ev.title}
              </h3>
              <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
                {ev.impactNote}
              </p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-[var(--ink-muted)] border-t border-[var(--border)] pt-3 mt-5">
          <span>SCHEDULED MACRO & ON-CHAIN DESK</span>
          <span className="text-emerald-500 dark:text-emerald-400 font-bold">● REAL-TIME COUNTDOWN SYNC</span>
        </div>
      </motion.div>
    </div>
  );
}
