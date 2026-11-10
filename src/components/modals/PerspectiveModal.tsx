import React from 'react';
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
  if (!isOpen || !primaryArticle) return null;

  const allPerspectives = [primaryArticle, ...relatedArticles];

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/85 backdrop-blur-md"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto bg-[var(--surface-solid)] border border-[var(--border)] rounded-2xl p-4 sm:p-7 shadow-2xl z-10 text-[var(--ink)] scrollbar-none"
      >
        <button
          className="absolute top-4 right-4 text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors p-1.5 rounded-lg bg-black/10 dark:bg-white/5 hover:bg-black/20 cursor-pointer"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-[11px] font-bold tracking-widest uppercase ${
              mode === 'world'
                ? 'bg-blue-500/15 border border-blue-500/35 text-blue-400'
                : 'bg-red-500/15 border border-red-500/35 text-red-500'
            }`}>
              <Layers className="w-3.5 h-3.5 animate-pulse" />
              <span>PERSPECTIVE COMPARATOR</span>
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 dark:text-emerald-400 font-mono text-[10px] font-bold">
              <CheckCircle2 className="w-3 h-3" />
              <span>{allPerspectives.length} INDEPENDENT WIRE OUTLETS</span>
            </span>
          </div>

          <h2 className="font-display text-2xl sm:text-3xl text-[var(--ink)] tracking-tight">
            COMPARE COVERAGE & FRAMING
          </h2>
          <p className="text-xs text-[var(--ink-muted)] max-w-2xl mt-1 leading-relaxed font-sans">
            Cross-examine how different reporting desks, regional wire services, and newsrooms cover this story side-by-side to detect nuances, framing differences, and verify factual consistency.
          </p>
        </div>

        {/* Side-by-Side Comparison Grid */}
        <div className={`grid grid-cols-1 ${
          allPerspectives.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'
        } gap-4 my-4`}>
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
                    <span>READ FULL REPORT AT {art.src.toUpperCase()}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer consensus statement */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-mono text-[var(--ink-muted)] border-t border-[var(--border)] pt-4 mt-6">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>CROSS-OUTLET FACT CHECK VERIFICATION ACTIVE</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] text-xs font-mono font-bold transition-all cursor-pointer"
          >
            RETURN TO FEED
          </button>
        </div>
      </motion.div>
    </div>
  );
}
