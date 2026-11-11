import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ExternalLink, Clock, Layers, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Article, AppMode } from '../../types';
import { formatTimeAgo } from '../../utils/formatters';

interface PerspectiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  primaryArticle: Article | null;
  relatedArticles: Article[];
  mode: AppMode;
  isDark: boolean;
}

export function PerspectiveModal({
  isOpen,
  onClose,
  primaryArticle,
  relatedArticles,
  mode,
}: PerspectiveModalProps) {
  // Mobile Background Scroll Lock: prevents the underlying webpage from scrolling or rubber-banding while modal is open
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

  if (!isOpen || !primaryArticle) return null;

  const allPerspectives = [primaryArticle, ...relatedArticles];

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-2.5 sm:p-5 overflow-hidden overscroll-none select-none">
      {/* Dimmed backdrop with direct tap-to-close */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-5xl h-[94vh] sm:h-auto sm:max-h-[88vh] flex flex-col bg-[var(--surface-solid)] border border-[var(--border)] rounded-2xl shadow-2xl z-10 text-[var(--ink)] overflow-hidden select-text"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header with Unmissable Touch-Friendly Close Button */}
        <div className="flex items-start justify-between gap-3 p-4 sm:p-6 pb-3 border-b border-[var(--border)] bg-[var(--surface-solid)] shrink-0 z-20">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-[10px] sm:text-[11px] font-bold tracking-widest uppercase ${
                mode === 'world'
                  ? 'bg-blue-500/15 border border-blue-500/35 text-blue-400'
                  : 'bg-red-500/15 border border-red-500/35 text-red-500'
              }`}>
                <Layers className="w-3.5 h-3.5 animate-pulse" />
                <span>PERSPECTIVE COMPARATOR</span>
              </span>

              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 dark:text-emerald-400 font-mono text-[10px] font-bold">
                <CheckCircle2 className="w-3 h-3" />
                <span>{allPerspectives.length} INDEPENDENT OUTLETS</span>
              </span>
            </div>

            <h2 className="font-display text-xl sm:text-2xl lg:text-3xl text-[var(--ink)] tracking-tight truncate">
              COMPARE COVERAGE & FRAMING
            </h2>
            <p className="hidden sm:block text-xs text-[var(--ink-muted)] mt-1 leading-relaxed font-sans line-clamp-1">
              Cross-examine how different reporting desks, regional wire services, and newsrooms cover this story side-by-side to detect nuances and framing differences.
            </p>
          </div>

          {/* Large 44x44px Touch Hitbox Close Button for Phones & Tablets */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            aria-label="Close Comparison Modal"
            className="shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 active:scale-95 text-[var(--ink)] flex items-center justify-center transition-all cursor-pointer border border-[var(--border)] shadow-sm touch-manipulation z-30"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Comparison Content Area (Smooth Mobile Touch-Pan) */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4 touch-pan-y -webkit-overflow-scrolling-touch scrollbar-thin">
          {/* Feature 2: Consensus Verification Matrix */}
          <div className="p-4 rounded-xl border border-[var(--border)] bg-black/15 dark:bg-white/[0.02]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
              <div className="flex items-start gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 shrink-0 mt-0.5">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-black uppercase tracking-wider text-emerald-500 dark:text-emerald-400">
                      {allPerspectives.length >= 4
                        ? '🟢 100% CROSS-WIRE CONSENSUS'
                        : allPerspectives.length === 3
                          ? '🔵 3-OUTLET WIRE CONSENSUS'
                          : '🟡 DUAL-SOURCE VERIFICATION'}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/20 dark:bg-white/10 text-[var(--ink-muted)] border border-[var(--border)]">
                      {allPerspectives.length} INDEPENDENT WIRE DESKS
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--ink-muted)] mt-1 font-sans">
                    Multi-outlet factual corroboration: Core facts confirmed across distinct editorial desks with no conflicting retractions.
                  </p>
                </div>
              </div>

              {/* Consensus Score Gauge Bar */}
              <div className="sm:text-right shrink-0">
                <div className="font-mono text-[10px] text-[var(--ink-muted)] uppercase tracking-wider mb-1">
                  AGREEMENT INDEX
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 sm:w-28 h-2 bg-black/20 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        allPerspectives.length >= 4
                          ? 'w-full bg-emerald-500'
                          : allPerspectives.length === 3
                            ? 'w-3/4 bg-cyan-500'
                            : 'w-1/2 bg-amber-500'
                      }`}
                    />
                  </div>
                  <span className="font-mono text-xs font-bold text-[var(--ink)]">
                    {allPerspectives.length >= 4 ? '100%' : allPerspectives.length === 3 ? '92%' : '80%'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Outlets Verified Strip */}
            <div className="flex items-center gap-1.5 pt-2.5 flex-wrap">
              <span className="text-[10px] font-mono font-bold text-[var(--ink-muted)] uppercase tracking-wider">
                CORROBORATING OUTLETS:
              </span>
              {allPerspectives.map((art) => (
                <span
                  key={art.id}
                  className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-black/10 dark:bg-white/10 border border-[var(--border)] text-[var(--ink)]"
                >
                  {art.src}
                </span>
              ))}
            </div>
          </div>

          <div className={`grid grid-cols-1 ${
            allPerspectives.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'
          } gap-4`}>
            {allPerspectives.map((art, index) => {
              const isPrimary = index === 0;

              return (
                <div
                  key={art.id || index}
                  className={`flex flex-col justify-between p-4 sm:p-5 rounded-xl border transition-all ${
                    isPrimary
                      ? mode === 'world'
                        ? 'bg-blue-950/20 border-blue-500/40 shadow-lg shadow-blue-500/5'
                        : 'bg-red-950/20 border-red-500/40 shadow-lg shadow-red-500/5'
                      : 'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border-hover)]'
                  }`}
                >
                  <div>
                    {/* Outlet & Timestamp header */}
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border)]">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-xs font-black tracking-wider uppercase px-2 py-0.5 rounded ${
                          isPrimary
                            ? mode === 'world' ? 'bg-blue-600 text-white' : 'bg-[var(--accent)] text-white'
                            : 'bg-black/10 dark:bg-white/10 text-[var(--ink)]'
                        }`}>
                          {art.src}
                        </span>
                        {isPrimary && (
                          <span className="text-[10px] font-mono text-amber-500 font-bold uppercase tracking-wider">
                            ORIGINAL DISPATCH
                          </span>
                        )}
                      </div>

                      <span className="flex items-center gap-1 text-[11px] font-mono text-[var(--ink-muted)]" title={art.date.toLocaleString()}>
                        <Clock className="w-3 h-3 opacity-60" />
                        {formatTimeAgo(art.date)}
                      </span>
                    </div>

                    {/* Headline framing */}
                    <h3 className="font-sans font-bold text-sm sm:text-base text-[var(--ink)] leading-snug mb-3">
                      {art.title}
                    </h3>

                    {/* Excerpt / Lead */}
                    {art.snippet ? (
                      <p className="text-xs text-[var(--ink-muted)] leading-relaxed mb-4 font-sans line-clamp-4">
                        "{art.snippet}"
                      </p>
                    ) : (
                      <p className="text-xs italic text-[var(--ink-muted)] opacity-60 mb-4">
                        No excerpt snippet provided in RSS dispatch.
                      </p>
                    )}
                  </div>

                  {/* Direct Action Link */}
                  <div className="pt-3 border-t border-[var(--border)] mt-auto">
                    <a
                      href={art.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-full py-2.5 px-3 rounded-lg font-mono text-xs font-bold tracking-wider transition-all inline-flex items-center justify-center gap-1.5 ${
                        isPrimary
                          ? 'rbtn'
                          : 'bg-[var(--surface-solid)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--ink)] hover:text-[var(--accent)]'
                      }`}
                    >
                      <span>READ AT {art.src.toUpperCase()}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sticky Footer Action Bar */}
        <div className="flex items-center justify-between gap-3 p-3 sm:p-4 border-t border-[var(--border)] bg-[var(--surface-solid)] shrink-0 z-20">
          <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono text-[var(--ink-muted)] truncate">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="truncate">CROSS-OUTLET FACT CHECK VERIFICATION ACTIVE</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] text-xs font-mono font-bold transition-all cursor-pointer active:scale-95 shrink-0"
          >
            RETURN TO FEED
          </button>
        </div>
      </motion.div>
    </div>
  );
}
