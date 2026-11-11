import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ExternalLink, TrendingUp, TrendingDown } from 'lucide-react';
import { FearGreedData } from '../../types';

interface FearGreedModalProps {
  isOpen: boolean;
  onClose: () => void;
  fearGreed: FearGreedData | null;
  isDark: boolean;
}

export function FearGreedModal({
  isOpen,
  onClose,
  fearGreed,
  isDark,
}: FearGreedModalProps) {
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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100000] flex items-center justify-center p-3 sm:p-4 overflow-hidden overscroll-none select-none">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md max-h-[92vh] overflow-y-auto overscroll-contain bg-[var(--surface-solid)] border border-[var(--border)] rounded-2xl p-5 sm:p-6 shadow-2xl z-10 text-[var(--ink)] select-text touch-pan-y"
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            type="button"
            onClick={onClose}
            aria-label="Close Fear & Greed Modal"
            className="absolute top-3.5 right-3.5 w-10 h-10 rounded-xl bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 active:scale-95 text-[var(--ink)] flex items-center justify-center transition-all cursor-pointer border border-[var(--border)] shadow-sm touch-manipulation z-30"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center">
            <div className="cs mb-1">MARKET SENTIMENT MONITOR</div>
            <h2 className="font-display text-4xl text-[var(--ink)] mb-6">FEAR & GREED INDEX</h2>
            
            {fearGreed ? (
              <div className="space-y-6">
                {/* Gauge Visualization (Needle Sweeps Cleanly - No Text Overlap) */}
                <div className="relative inline-flex items-center justify-center pt-2">
                  <svg width="240" height="130" viewBox="0 0 240 130" className="overflow-visible">
                    {/* Background Track */}
                    <path 
                      d="M 35 115 A 85 85 0 0 1 205 115" 
                      fill="none" 
                      stroke={isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)"} 
                      strokeWidth="14" 
                      strokeLinecap="round" 
                    />
                    {/* Colored Sentiment Arc */}
                    <path 
                      d="M 35 115 A 85 85 0 0 1 205 115" 
                      fill="none" 
                      stroke="url(#fgGradient)" 
                      strokeWidth="14" 
                      strokeLinecap="round" 
                      strokeDasharray="267"
                      strokeDashoffset={267 - (267 * Math.min(Math.max(parseInt(fearGreed.value, 10) || 50, 0), 100)) / 100}
                      className="transition-all duration-1000 ease-out"
                    />
                    {/* Tick Labels */}
                    <text x="22" y="122" fill="#ef4444" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="end">0</text>
                    <text x="120" y="18" fill="#eab308" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">50</text>
                    <text x="218" y="122" fill="#22c55e" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="start">100</text>

                    <defs>
                      <linearGradient id="fgGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="35%" stopColor="#eab308" />
                        <stop offset="65%" stopColor="#84cc16" />
                        <stop offset="100%" stopColor="#22c55e" />
                      </linearGradient>
                    </defs>

                    {/* Sweeping Indicator Needle & Pivot Hub */}
                    <g transform={`rotate(${(((parseInt(fearGreed.value, 10) || 50) / 100) * 180) - 90}, 120, 115)`} className="transition-transform duration-1000 ease-out">
                      <line x1="120" y1="115" x2="120" y2="42" stroke={isDark ? "#ffffff" : "#0f172a"} strokeWidth="3.5" strokeLinecap="round" />
                      <circle cx="120" cy="115" r="7" fill={isDark ? "#ffffff" : "#0f172a"} />
                      <circle cx="120" cy="115" r="3" fill={
                        parseInt(fearGreed.value, 10) > 75 ? '#22c55e' : 
                        parseInt(fearGreed.value, 10) > 50 ? '#84cc16' : 
                        parseInt(fearGreed.value, 10) > 25 ? '#eab308' : '#ef4444'
                      } />
                    </g>
                  </svg>
                </div>

                {/* Clean Dedicated Readout Below the Gauge (Unobstructed) */}
                <div className="flex flex-col items-center">
                  <div className="flex items-baseline gap-1.5 font-mono">
                    <span 
                      className="text-5xl sm:text-6xl font-black tracking-tight"
                      style={{ 
                        color: 
                          parseInt(fearGreed.value, 10) > 75 ? '#22c55e' : 
                          parseInt(fearGreed.value, 10) > 50 ? '#84cc16' : 
                          parseInt(fearGreed.value, 10) > 25 ? '#eab308' : '#ef4444'
                      }}
                    >
                      {fearGreed.value}
                    </span>
                    <span className="text-sm font-mono font-bold text-[var(--ink-muted)]">/ 100</span>
                  </div>

                  <div 
                    className="text-base sm:text-lg font-bold uppercase tracking-widest mt-1.5 px-4 py-1 rounded-full border shadow-sm font-mono" 
                    style={{ 
                      color: 
                        parseInt(fearGreed.value, 10) > 75 ? '#22c55e' : 
                        parseInt(fearGreed.value, 10) > 50 ? '#84cc16' : 
                        parseInt(fearGreed.value, 10) > 25 ? '#eab308' : '#ef4444',
                      backgroundColor: `${
                        parseInt(fearGreed.value, 10) > 75 ? '#22c55e' : 
                        parseInt(fearGreed.value, 10) > 50 ? '#84cc16' : 
                        parseInt(fearGreed.value, 10) > 25 ? '#eab308' : '#ef4444'
                      }15`,
                      borderColor: `${
                        parseInt(fearGreed.value, 10) > 75 ? '#22c55e' : 
                        parseInt(fearGreed.value, 10) > 50 ? '#84cc16' : 
                        parseInt(fearGreed.value, 10) > 25 ? '#eab308' : '#ef4444'
                      }40`
                    }}
                  >
                    {fearGreed.value_classification}
                  </div>
                </div>

                {fearGreed.previous_value && (
                  <div className="flex items-center justify-center gap-6 text-xs font-mono py-2.5 px-4 bg-[var(--bg)] rounded-xl border border-[var(--border)]">
                    <div className="flex flex-col items-center">
                      <span className="text-[var(--ink-muted)]">YESTERDAY</span>
                      <span className="text-[var(--ink)] font-bold text-sm">{fearGreed.previous_value}</span>
                    </div>
                    <div className="h-6 w-px bg-[var(--border)]" />
                    <div className="flex flex-col items-center">
                      <span className="text-[var(--ink-muted)]">24H TREND</span>
                      <span className={`font-bold flex items-center gap-1 text-sm ${
                        parseInt(fearGreed.value) >= parseInt(fearGreed.previous_value) ? 'text-emerald-500' : 'text-rose-500'
                      }`}>
                        {parseInt(fearGreed.value) >= parseInt(fearGreed.previous_value) ? (
                          <><TrendingUp className="w-3.5 h-3.5" /> UP</>
                        ) : (
                          <><TrendingDown className="w-3.5 h-3.5" /> DOWN</>
                        )}
                      </span>
                    </div>
                  </div>
                )}

                <p className="text-xs text-[var(--ink-muted)] leading-relaxed text-left bg-[var(--bg)] p-4 rounded-xl border border-[var(--border)]">
                  The market sentiment monitor tracks fear and greed dynamics across institutional and retail markets. Extreme fear can indicate undervaluation, while extreme greed can indicate market overextension.
                </p>
                
                <div className="flex justify-between items-center text-[10px] font-mono text-[var(--ink-muted)] border-t border-[var(--border)] pt-3">
                  <div>Updated: {new Date(parseInt(fearGreed.timestamp) * 1000).toLocaleDateString()}</div>
                  <a 
                    href="https://alternative.me/crypto/fear-and-greed-index/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[var(--accent)] hover:underline flex items-center gap-1 font-semibold"
                  >
                    Alternative.me <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
                <span className="font-mono text-xs text-[var(--ink-muted)]">SYNCING SENTIMENT DATA...</span>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
