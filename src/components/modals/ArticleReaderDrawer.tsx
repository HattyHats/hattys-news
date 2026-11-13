import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ExternalLink,
  Bookmark,
  Share2,
  Check,
  Clock,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  BookOpen,
  Volume2,
  Square,
  Layers,
} from 'lucide-react';
import { Article, AppMode } from '../../types';
import { CardImage } from '../cards/CardImage';
import { CRYPTO_CATEGORIES, WORLD_CATEGORIES } from '../../config/feeds';
import { detectAssetsInArticle, detectStoryImpact, getOutletBadge } from '../../utils/classifier';
import { formatTimeAgo } from '../../utils/formatters';
import {
  createSpeechQueueController,
  loadSavedSpeechRate,
  loadSavedVoiceUri,
  SpeechQueueController,
} from '../../utils/speech';

interface ArticleReaderDrawerProps {
  article: Article | null;
  relatedArticles: Article[];
  mode: AppMode;
  isDark: boolean;
  isSaved: boolean;
  copiedId: string | null;
  marketQuotes: Record<string, { price: number; change24h: number; formatted: string }>;
  articleIndex: number;
  totalCount: number;
  onClose: () => void;
  onPrevArticle: () => void;
  onNextArticle: () => void;
  onSelectArticle: (article: Article) => void;
  onToggleSave: (article: Article) => void;
  onCopyLink: (id: string, link: string) => void;
  onOpenPerspective: (article: Article, related: Article[]) => void;
  onFilterBySymbol: (symbol: string) => void;
}

export function ArticleReaderDrawer({
  article,
  relatedArticles,
  mode,
  isDark,
  isSaved,
  copiedId,
  marketQuotes,
  articleIndex,
  totalCount,
  onClose,
  onPrevArticle,
  onNextArticle,
  onSelectArticle,
  onToggleSave,
  onCopyLink,
  onOpenPerspective,
  onFilterBySymbol,
}: ArticleReaderDrawerProps) {
  const scrollBodyRef = useRef<HTMLDivElement>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const speechControllerRef = useRef<SpeechQueueController | null>(null);

  // Keep latest navigation handlers/indices in a ref so App's 1s countdown re-renders don't rerun effects & abort speech
  const navStateRef = useRef({ articleIndex, totalCount, onClose, onPrevArticle, onNextArticle });
  navStateRef.current = { articleIndex, totalCount, onClose, onPrevArticle, onNextArticle };

  if (!speechControllerRef.current) {
    speechControllerRef.current = createSpeechQueueController({
      getVoiceUri: loadSavedVoiceUri,
      getRate: loadSavedSpeechRate,
      onComplete: () => setIsSpeaking(false),
      onError: (reason) => {
        setIsSpeaking(false);
        setAudioError(`Speech engine issue (${reason}) — try another voice`);
      },
    });
  }

  const stopReadingAloud = () => {
    speechControllerRef.current?.stop();
    setIsSpeaking(false);
  };

  // Scroll lock + Escape / Left-Right navigation (only bound to drawer open/close, never parent callback identity)
  useEffect(() => {
    if (!article) {
      stopReadingAloud();
      setAudioError(null);
      return;
    }

    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const nav = navStateRef.current;
      if (e.key === 'Escape') {
        nav.onClose();
      } else if (e.key === 'ArrowLeft' && nav.articleIndex > 0) {
        nav.onPrevArticle();
      } else if (e.key === 'ArrowRight' && nav.articleIndex >= 0 && nav.articleIndex < nav.totalCount - 1) {
        nav.onNextArticle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
      window.removeEventListener('keydown', handleKeyDown);
      stopReadingAloud();
    };
  }, [Boolean(article)]);

  // Reset scroll position & speech whenever switched to another dispatch
  useEffect(() => {
    stopReadingAloud();
    setAudioError(null);
    if (scrollBodyRef.current) {
      scrollBodyRef.current.scrollTop = 0;
    }
  }, [article?.id]);

  const handleToggleSpeech = () => {
    if (!article) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setAudioError('Text-to-speech is not supported in this browser.');
      return;
    }
    if (isSpeaking) {
      stopReadingAloud();
      return;
    }

    setAudioError(null);
    const bodyText = (article.fullText || article.snippet || '').replace(/\s+/g, ' ').trim();
    const spokenText = `${article.title}. Reported by ${article.src}. ${bodyText}`.slice(0, 3200);
    setIsSpeaking(true);
    speechControllerRef.current?.start([spokenText], 0);
  };

  return (
    <AnimatePresence>
      {article && (() => {
        const cardMode = article.mode || mode;
        const cardCategories = cardMode === 'world' ? WORLD_CATEGORIES : CRYPTO_CATEGORIES;
        const categoryConfig = cardCategories.find(c => c.id === article.primaryCat) || cardCategories[0];
        const badgeClass = categoryConfig.badgeClass || (cardMode === 'world' ? 'badge-world-top' : 'badge-all');
        const outlet = getOutletBadge(article.src);
        const storyImpact = detectStoryImpact(article.title, article.snippet);

        const rawBody = (article.fullText || article.snippet || '').trim();
        const paragraphs = rawBody
          ? rawBody.split(/\n{2,}/).map(p => p.trim()).filter(Boolean)
          : [`Verified wire dispatch from ${article.src}. Open the publisher report below to read the full coverage.`];

        const detectedAssets = detectAssetsInArticle(article.title, rawBody, marketQuotes);
        const canPrev = articleIndex > 0;
        const canNext = articleIndex >= 0 && articleIndex < totalCount - 1;
        const isWireShort = rawBody.length < 240;

        return (
          <div key="reader-drawer-root" className="fixed inset-0 z-[100000] flex justify-end overflow-hidden overscroll-none select-none">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
              onClick={onClose}
            />

            {/* Slide-Over Terminal Reader Panel */}
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 34 }}
              className="relative w-full sm:max-w-2xl h-dvh bg-[var(--surface-solid)] border-l border-[var(--border)] shadow-2xl z-10 flex flex-col text-[var(--ink)] select-text overflow-hidden pt-[env(safe-area-inset-top,0px)]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Sticky Top Utility Bar */}
              <div className="px-3.5 sm:px-5 py-3 border-b border-[var(--border)] bg-[var(--surface-solid)] flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md font-mono text-[10px] font-bold uppercase border ${
                    cardMode === 'world'
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                      : 'bg-red-500/10 text-red-500 border-red-500/30'
                  }`}>
                    <BookOpen className="w-3 h-3 shrink-0" />
                    <span className="hidden xs:inline">TERMINAL READER</span>
                    {articleIndex >= 0 && totalCount > 0 && (
                      <span className="opacity-80">• #{articleIndex + 1}/{totalCount}</span>
                    )}
                  </span>

                  <div className="inline-flex items-center rounded-lg border border-[var(--border)] bg-[var(--bg)] p-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={onPrevArticle}
                      disabled={!canPrev}
                      className="p-1.5 rounded text-[var(--ink)] hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      title="Previous dispatch (Left Arrow)"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={onNextArticle}
                      disabled={!canNext}
                      className="p-1.5 rounded text-[var(--ink)] hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      title="Next dispatch (Right Arrow)"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleToggleSpeech}
                    className={`px-2.5 py-1.5 rounded-lg border font-mono text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isSpeaking
                        ? 'bg-emerald-500 text-black border-emerald-400 shadow-sm'
                        : 'bg-[var(--bg)] border-[var(--border)] text-[var(--ink-muted)] hover:text-[var(--ink)] hover:border-emerald-500/40'
                    }`}
                    title={isSpeaking ? 'Stop audio reader' : 'Read article aloud'}
                  >
                    {isSpeaking ? <Square className="w-3 h-3 fill-current" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-500" />}
                    <span className="hidden sm:inline">{isSpeaking ? 'STOP' : 'LISTEN'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onCopyLink(article.id, article.link)}
                    className="w-8 h-8 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--ink-muted)] hover:text-[var(--ink)] flex items-center justify-center transition-colors cursor-pointer"
                    title="Copy article link"
                  >
                    {copiedId === article.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleSave(article)}
                    className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                      isSaved
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-500 dark:text-amber-400'
                        : 'border-[var(--border)] bg-[var(--bg)] text-[var(--ink-muted)] hover:text-[var(--ink)]'
                    }`}
                    title={isSaved ? 'Remove from Read-Later Queue' : 'Save for Later'}
                  >
                    <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-amber-400' : ''}`} />
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close Reader Drawer"
                    className="w-8 h-8 rounded-lg bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 text-[var(--ink)] border border-[var(--border)] flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {audioError && (
                <div className="px-4 py-1.5 border-b border-amber-500/30 bg-amber-500/10 text-amber-500 text-[11px] font-mono font-bold shrink-0">
                  {audioError}
                </div>
              )}

              {/* Scrollable Editorial Body */}
              <div
                ref={scrollBodyRef}
                className="flex-1 overflow-y-auto overscroll-contain touch-scroll scrollbar-thin px-4 sm:px-7 py-5 space-y-5"
              >
                {/* Cover Image */}
                <div className="relative rounded-2xl overflow-hidden h-48 sm:h-60 border border-[var(--border)] bg-[#0c0c10]">
                  <CardImage article={article} mode={cardMode} />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase backdrop-blur-md ${badgeClass}`}>
                      {categoryConfig.label}
                    </span>
                    {storyImpact && (
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-black tracking-wider uppercase backdrop-blur-md border ${storyImpact.badgeClass}`}>
                        {storyImpact.label}
                      </span>
                    )}
                  </div>
                </div>

                {/* Source & Timestamp Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-[var(--ink-muted)] pb-3 border-b border-[var(--border)]">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base leading-none">{outlet.flag}</span>
                    <span className={`font-bold uppercase tracking-wider truncate ${
                      cardMode === 'world' ? 'text-blue-500 dark:text-blue-400' : 'text-[var(--accent)]'
                    }`}>
                      {outlet.name}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-black/5 dark:bg-white/5 border border-[var(--border)] shrink-0">
                      {outlet.region} DESK
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="flex items-center gap-1" title={article.date.toLocaleString()}>
                      <Clock className="w-3.5 h-3.5 opacity-70" />
                      {formatTimeAgo(article.date)}
                    </span>
                    <span className="opacity-50">•</span>
                    <span>{article.readingMinutes || 1} MIN BRIEF</span>
                  </div>
                </div>

                {/* Article Headline */}
                <h1 className="font-sans font-extrabold text-xl sm:text-2xl lg:text-[26px] leading-snug text-[var(--ink)] tracking-tight">
                  {article.title}
                </h1>

                {/* Detected Live Market Asset Chips */}
                {detectedAssets.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {detectedAssets.map(asset => {
                      const isUp = (asset.change24h ?? 0) >= 0;
                      return (
                        <button
                          key={asset.id}
                          type="button"
                          onClick={() => {
                            onFilterBySymbol(asset.symbol);
                            onClose();
                          }}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer ${
                            isDark
                              ? 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/25 text-white'
                              : 'bg-black/5 hover:bg-black/10 border-black/10 hover:border-black/25 text-slate-800'
                          }`}
                          title={`Filter terminal for ${asset.name} (${asset.symbol})`}
                        >
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: asset.color }} />
                          <span>${asset.symbol}</span>
                          {asset.formatted && <span className="opacity-85 font-normal">{asset.formatted}</span>}
                          {typeof asset.change24h === 'number' && (
                            <span className={`text-[11px] font-bold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {isUp ? '▲' : '▼'}{Math.abs(asset.change24h).toFixed(1)}%
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Cleaned Article Paragraphs */}
                <div className="space-y-4 text-[15px] sm:text-base leading-relaxed font-sans text-[var(--ink)]/90">
                  {paragraphs.map((para, idx) => (
                    <p key={idx}>{para}</p>
                  ))}
                </div>

                {/* RSS Wire Notice when publisher sends brief summary */}
                {isWireShort && (
                  <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-xs text-[var(--ink-muted)] font-mono flex items-start justify-between gap-3">
                    <p className="leading-relaxed">
                      {outlet.name} syndicates a concise wire summary over RSS. Use the button below to read the complete article, embeds, and interactive charts on {outlet.name}.
                    </p>
                  </div>
                )}

                {/* Corroborating Consensus Wires Section */}
                {relatedArticles.length > 0 && (
                  <div className={`p-4 rounded-2xl border ${
                    isDark ? 'bg-emerald-950/15 border-emerald-500/30' : 'bg-emerald-50/70 border-emerald-300'
                  }`}>
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="font-mono text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          CORROBORATED BY {relatedArticles.length + 1} OUTLETS
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onOpenPerspective(article, relatedArticles)}
                        className={`px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 text-white transition-all cursor-pointer ${
                          cardMode === 'world' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-red-600 hover:bg-red-500'
                        }`}
                      >
                        <Layers className="w-3 h-3" />
                        <span>COMPARE SIDE-BY-SIDE ⇄</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {relatedArticles.map(rel => {
                        const relOutlet = getOutletBadge(rel.src);
                        return (
                          <button
                            key={rel.id}
                            type="button"
                            onClick={() => onSelectArticle(rel)}
                            className="w-full text-left p-2.5 rounded-xl bg-[var(--surface-solid)] border border-[var(--border)] hover:border-emerald-500/40 transition-all flex items-start justify-between gap-2.5 cursor-pointer group"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 mb-0.5">
                                <span>{relOutlet.flag}</span>
                                <span>{relOutlet.name.toUpperCase()}</span>
                                <span className="text-[var(--ink-muted)] font-normal">• {formatTimeAgo(rel.date)}</span>
                              </div>
                              <p className="text-xs font-semibold text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors line-clamp-2">
                                {rel.title}
                              </p>
                            </div>
                            <span className="text-[10px] font-mono text-[var(--ink-muted)] group-hover:text-[var(--accent)] shrink-0 mt-1">
                              READ →
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Sticky Bottom CTA Footer */}
              <div className="p-3.5 sm:px-6 sm:py-4 border-t border-[var(--border)] bg-[var(--surface-solid)] shrink-0 pb-[max(0.875rem,env(safe-area-inset-bottom,0px))] flex items-center gap-2.5">
                <a
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rbtn flex-1 py-2.5 sm:py-3 text-xs font-mono font-bold tracking-wider"
                >
                  <span className="truncate">READ FULL COVERAGE ON {outlet.name.toUpperCase()}</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                </a>
              </div>
            </motion.aside>
          </div>
        );
      })()}
    </AnimatePresence>
  );
}
