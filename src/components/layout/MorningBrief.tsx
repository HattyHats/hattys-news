import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Calendar, Bookmark, ExternalLink } from 'lucide-react';
import { Article, AppMode } from '../../types';
import { formatTimeAgo } from '../../utils/formatters';

interface MorningBriefProps {
  showBrief: boolean;
  morningBriefStories: { article: Article; related: Article[] }[];
  mode: AppMode;
  isDark: boolean;
  filter: string;
  query: string;
  savedIds: Set<string>;
  onToggleBrief: () => void;
  onOpenCatalysts: () => void;
  onToggleSave: (article: Article) => void;
  onOpenPerspective: (article: Article, related: Article[]) => void;
}

export function MorningBrief({
  showBrief,
  morningBriefStories,
  mode,
  isDark,
  filter,
  query,
  savedIds,
  onToggleBrief,
  onOpenCatalysts,
  onToggleSave,
  onOpenPerspective,
}: MorningBriefProps) {
  return (
    <AnimatePresence initial={false}>
      {showBrief && morningBriefStories.length > 0 && filter !== 'saved' && !query && (
        <motion.section
          initial={{ opacity: 0, height: 0, marginBottom: 0 }}
          animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          <div className={`rounded-2xl border p-4 sm:p-5 relative overflow-hidden ${
            mode === 'world'
              ? isDark
                ? 'bg-gradient-to-br from-blue-950/35 via-[var(--surface-solid)] to-[var(--surface-solid)] border-blue-500/30'
                : 'bg-gradient-to-br from-blue-50 via-white to-white border-blue-300/70 shadow-sm'
              : isDark
                ? 'bg-gradient-to-br from-amber-950/25 via-[var(--surface-solid)] to-[var(--surface-solid)] border-amber-500/30'
                : 'bg-gradient-to-br from-amber-50 via-white to-white border-amber-300/70 shadow-sm'
          }`}>
            <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-[var(--border)] flex-wrap">
              <div className="flex items-center gap-2.5">
                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg border ${
                  mode === 'world'
                    ? 'bg-blue-500/15 border-blue-500/40 text-blue-500 dark:text-blue-400'
                    : 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400'
                }`}>
                  <Zap className="w-4 h-4" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-lg sm:text-xl tracking-wide text-[var(--ink)] leading-none">
                      60-SECOND {mode === 'world' ? 'GLOBAL' : 'CRYPTO'} BRIEF
                    </h2>
                    <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${
                      mode === 'world'
                        ? 'bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/30'
                        : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                    }`}>
                      TOP 5 MUST-KNOW
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-[var(--ink-muted)] mt-0.5">
                    Ranked by multi-source wire consensus & breaking velocity
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenCatalysts}
                  className="text-[11px] font-mono px-2.5 py-1 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors flex items-center gap-1.5 font-bold cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>UPCOMING CATALYSTS</span>
                </button>
                <button
                  onClick={onToggleBrief}
                  className="text-[11px] font-mono px-2.5 py-1 rounded-lg border border-[var(--border)] text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors cursor-pointer"
                >
                  HIDE
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {morningBriefStories.map((item, i) => {
                const isSaved = savedIds.has(item.article.id);
                return (
                  <div
                    key={item.article.id}
                    className={`group relative rounded-xl border border-[var(--border)] p-3 flex flex-col justify-between transition-all hover:border-[var(--accent)]/50 ${
                      isDark ? 'bg-black/25 hover:bg-black/40' : 'bg-white/90 hover:bg-white shadow-sm'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1.5 mb-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`text-[10px] font-mono font-black px-1.5 py-0.5 rounded ${
                            mode === 'world'
                              ? 'bg-blue-500/20 text-blue-600 dark:text-blue-300'
                              : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                          }`}>
                            0{i + 1}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-[var(--ink-muted)] truncate">
                            {item.article.src}
                          </span>
                        </div>
                        {item.related.length > 0 && (
                          <button
                            onClick={() => onOpenPerspective(item.article, item.related)}
                            className="shrink-0 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors cursor-pointer flex items-center gap-0.5"
                            title={`Compare coverage across ${item.related.length + 1} independent outlets`}
                          >
                            <span>+{item.related.length} wires</span>
                            <span>⇄</span>
                          </button>
                        )}
                      </div>
                      <a
                        href={item.article.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors line-clamp-3 leading-snug block"
                      >
                        {item.article.title}
                      </a>
                    </div>

                    <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-[var(--border)] text-[10px] font-mono text-[var(--ink-muted)]">
                      <span>{formatTimeAgo(item.article.date)}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onToggleSave(item.article)}
                          className={`p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer ${
                            isSaved ? 'text-amber-500 dark:text-amber-400' : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
                          }`}
                          title={isSaved ? 'Remove from Saved' : 'Save for Later'}
                        >
                          <Bookmark className={`w-3 h-3 ${isSaved ? 'fill-amber-400' : ''}`} />
                        </button>
                        <a
                          href={item.article.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--accent)] hover:underline inline-flex items-center gap-0.5 font-bold"
                        >
                          READ <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
