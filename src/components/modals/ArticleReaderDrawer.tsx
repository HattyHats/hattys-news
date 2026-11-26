import React, { useEffect, useMemo, useRef } from 'react';
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
  BookOpen,
  Volume2,
  Square,
  Layers,
  Camera,
  TrendingUp,
  TrendingDown,
  GitCommitHorizontal,
  Eye,
  Zap,
} from 'lucide-react';
import { Article, AppMode } from '../../types';
import { CardImage } from '../cards/CardImage';
import { CRYPTO_CATEGORIES, WORLD_CATEGORIES } from '../../config/feeds';
import { detectAssetsInArticle, detectStoryImpact, getOutletBadge, isGlobalBlindspot } from '../../utils/classifier';
import { buildArticleTakeaways } from '../../utils/clustering';
import { formatTimeAgo } from '../../utils/formatters';
import { TerminalAudioPlayer } from '../../hooks/useTerminalAudioPlayer';
import { computeStoryPulse, PulseVote } from '../../utils/communityPulse';
import { buildStoryTimeline } from '../../utils/storyTimeline';

interface ArticleReaderDrawerProps {
  article: Article | null;
  relatedArticles: Article[];
  allModeArticles?: Article[];
  mode: AppMode;
  isDark: boolean;
  isSaved: boolean;
  copiedId: string | null;
  marketQuotes: Record<string, { price: number; change24h: number; formatted: string }>;
  articleIndex: number;
  totalCount: number;
  userVote: PulseVote | null;
  audioPlayer: TerminalAudioPlayer;
  onVotePulse: (articleId: string, vote: PulseVote) => void;
  onOpenSnapshot: (article: Article) => void;
  onClose: () => void;
  onPrevArticle: () => void;
  onNextArticle: () => void;
  onSelectArticle: (article: Article) => void;
  onToggleSave: (article: Article) => void;
  onCopyLink: (id: string, link: string) => void;
  onOpenPerspective: (article: Article, related: Article[], initialTab?: 'compare' | 'timeline') => void;
  onFilterBySymbol: (symbol: string) => void;
}

export function ArticleReaderDrawer({
  article,
  relatedArticles,
  allModeArticles = [],
  mode,
  isDark,
  isSaved,
  copiedId,
  marketQuotes,
  articleIndex,
  totalCount,
  userVote,
  audioPlayer,
  onVotePulse,
  onOpenSnapshot,
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

  const isSpeaking = Boolean(
    article && audioPlayer.isActive && audioPlayer.activeTrack?.id === article.id
  );

  // Keep latest navigation handlers/indices in a ref so 1s timers don't rebind listener
  const navStateRef = useRef({ articleIndex, totalCount, onClose, onPrevArticle, onNextArticle });
  navStateRef.current = { articleIndex, totalCount, onClose, onPrevArticle, onNextArticle };

  const handleToggleSpeech = () => {
    if (!article) return;
    if (isSpeaking) {
      audioPlayer.stop();
      return;
    }
    const bodyText = (article.fullText || article.snippet || '').replace(/\s+/g, ' ').trim();
    const spokenText = `${article.title}. Reported by ${article.src}. ${bodyText}`.slice(0, 3200);
    audioPlayer.playQueue(
      [
        {
          id: article.id,
          title: article.title,
          src: article.src,
          spokenText,
          article,
        },
      ],
      0,
      'READER DISPATCH'
    );
  };

  const speechToggleRef = useRef(handleToggleSpeech);
  speechToggleRef.current = handleToggleSpeech;

  // Scroll lock + Escape / Left-Right navigation + custom speech toggle event (keeps audio playing when drawer closes!)
  useEffect(() => {
    if (!article) return;

    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

      const nav = navStateRef.current;
      if (e.key === 'Escape') {
        nav.onClose();
      } else if (e.key === 'ArrowLeft' && nav.articleIndex > 0) {
        nav.onPrevArticle();
      } else if (e.key === 'ArrowRight' && nav.articleIndex >= 0 && nav.articleIndex < nav.totalCount - 1) {
        nav.onNextArticle();
      }
    };

    const handleCustomSpeechEvent = () => {
      speechToggleRef.current();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('hattys-toggle-reader-speech', handleCustomSpeechEvent);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('hattys-toggle-reader-speech', handleCustomSpeechEvent);
    };
  }, [Boolean(article)]);

  // Reset scroll position whenever switched to another dispatch
  useEffect(() => {
    if (scrollBodyRef.current) {
      scrollBodyRef.current.scrollTop = 0;
    }
  }, [article?.id]);

  const timelineNodes = useMemo(() => {
    if (!article) return [];
    return buildStoryTimeline(article, relatedArticles, allModeArticles);
  }, [article, relatedArticles, allModeArticles]);

  return (
    <AnimatePresence>
      {article && (() => {
        const cardMode = article.mode || mode;
        const cardCategories = cardMode === 'world' ? WORLD_CATEGORIES : CRYPTO_CATEGORIES;
        const categoryConfig = cardCategories.find(c => c.id === article.primaryCat) || cardCategories[0];
        const badgeClass = categoryConfig.badgeClass || (cardMode === 'world' ? 'badge-world-top' : 'badge-all');
        const outlet = getOutletBadge(article.src);
        const storyImpact = detectStoryImpact(article.title, article.snippet);
        const blindspot = cardMode === 'world' && isGlobalBlindspot(article, relatedArticles);
        const pulse = computeStoryPulse(article, cardMode, userVote, relatedArticles.length);

        const rawBody = (article.fullText || article.snippet || '').trim();
        const paragraphs = rawBody
          ? rawBody.split(/\n{2,}/).map(p => p.trim()).filter(Boolean)
          : [`Verified wire dispatch from ${article.src}. Open the publisher report below to read the full coverage.`];

        const detectedAssets = detectAssetsInArticle(article.title, rawBody, marketQuotes, cardMode);
        const takeaways = buildArticleTakeaways(article, relatedArticles, cardMode, marketQuotes);
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
                    title={isSpeaking ? 'Stop audio reader (L)' : 'Read article aloud (L)'}
                  >
                    {isSpeaking ? <Square className="w-3 h-3 fill-current" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-500" />}
                    <span className="hidden sm:inline">{isSpeaking ? 'STOP' : 'LISTEN'}</span>
                  </button>

                  {/* Feature 5: One-Click Terminal Snapshot Card Button */}
                  <button
                    type="button"
                    onClick={() => onOpenSnapshot(article)}
                    className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--ink-muted)] hover:text-[var(--ink)] hover:border-[var(--accent)]/50 font-mono text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Generate HD Terminal Snapshot Share Card (P)"
                  >
                    <Camera className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span className="hidden sm:inline">SNAPSHOT</span>
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
                    title={isSaved ? 'Remove from Read-Later Queue (S)' : 'Save for Later (S)'}
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

              {audioPlayer.audioNotice && (
                <div className="px-4 py-1.5 border-b border-amber-500/30 bg-amber-500/10 text-amber-500 text-[11px] font-mono font-bold shrink-0">
                  {audioPlayer.audioNotice}
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
                    {blindspot && (
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded bg-amber-500/15 text-amber-500 dark:text-amber-300 border border-amber-500/35 shrink-0"
                        title="Global Blindspot: International dispatch with zero US domestic media coverage"
                      >
                        <Eye className="w-3 h-3" />
                        <span>BLINDSPOT</span>
                      </span>
                    )}
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

                {/* Feature 2: 10-Second Key Takeaways Executive Summary Box */}
                {takeaways.length > 0 && (
                  <div
                    className={`p-3.5 sm:p-4 rounded-xl border ${
                      cardMode === 'world'
                        ? isDark
                          ? 'bg-blue-950/20 border-blue-500/35'
                          : 'bg-blue-50/80 border-blue-300/80'
                        : isDark
                          ? 'bg-amber-950/20 border-amber-500/35'
                          : 'bg-amber-50/80 border-amber-300/80'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[10.5px] font-mono font-black uppercase tracking-wider ${
                          cardMode === 'world'
                            ? 'text-blue-500 dark:text-blue-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        <span>10-SECOND KEY TAKEAWAYS</span>
                      </span>
                      <span className="text-[9.5px] font-mono font-bold text-[var(--ink-muted)] uppercase">
                        INSTANT BRIEF
                      </span>
                    </div>
                    <ul className="space-y-1.5 text-xs sm:text-[13px] font-sans text-[var(--ink)]/90 leading-relaxed">
                      {takeaways.map((bullet, bIdx) => (
                        <li key={bIdx} className="flex items-start gap-2">
                          <span
                            className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                              cardMode === 'world' ? 'bg-blue-400' : 'bg-amber-400'
                            }`}
                          />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

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

                {/* Feature 3: Interactive Community Sentiment Pulse Bar */}
                <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] space-y-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[10px] font-mono font-black uppercase tracking-wider text-[var(--ink-muted)]">
                      COMMUNITY SENTIMENT PULSE • {pulse.totalVotes} VOTES
                    </span>
                    {pulse.userVote && (
                      <span className="text-[10px] font-mono font-bold text-emerald-400">
                        ✓ YOUR VOTE RECORDED
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => onVotePulse(article.id, 'up')}
                      className={`py-2 px-3 rounded-lg border font-mono text-xs font-bold flex items-center justify-between gap-2 transition-all cursor-pointer ${
                        pulse.userVote === 'up'
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-sm'
                          : 'bg-[var(--surface-solid)] border-[var(--border)] hover:border-emerald-500/50 text-[var(--ink)]'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{pulse.upLabel}</span>
                      </span>
                      <span className="text-emerald-400 font-black">{pulse.upPct}%</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onVotePulse(article.id, 'down')}
                      className={`py-2 px-3 rounded-lg border font-mono text-xs font-bold flex items-center justify-between gap-2 transition-all cursor-pointer ${
                        pulse.userVote === 'down'
                          ? 'bg-rose-500/20 border-rose-500 text-rose-400 shadow-sm'
                          : 'bg-[var(--surface-solid)] border-[var(--border)] hover:border-rose-500/50 text-[var(--ink)]'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                        <span>{pulse.downLabel}</span>
                      </span>
                      <span className="text-rose-400 font-black">{pulse.downPct}%</span>
                    </button>
                  </div>

                  {/* Dual Split Meter */}
                  <div className="w-full h-1.5 rounded-full bg-rose-500/35 overflow-hidden flex">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${pulse.upPct}%` }}
                    />
                  </div>
                </div>

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

                {/* Feature 4: Developing Story Timeline & Multi-Outlet Corroboration */}
                {timelineNodes.length > 1 && (
                  <div className={`p-4 rounded-2xl border ${
                    isDark ? 'bg-emerald-950/15 border-emerald-500/30' : 'bg-emerald-50/70 border-emerald-300'
                  }`}>
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-3.5">
                      <div className="flex items-center gap-2">
                        <GitCommitHorizontal className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="font-mono text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          DEVELOPING STORY TIMELINE ({timelineNodes.length} DISPATCHES)
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {relatedArticles.length > 0 && (
                          <button
                            type="button"
                            onClick={() => onOpenPerspective(article, relatedArticles, 'compare')}
                            className="px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 bg-[var(--surface-solid)] border border-[var(--border)] hover:border-emerald-500/50 text-[var(--ink)] transition-all cursor-pointer"
                          >
                            <Layers className="w-3 h-3 text-emerald-500" />
                            <span>COMPARE ⇄</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onOpenPerspective(
                            article,
                            relatedArticles.length > 0
                              ? relatedArticles
                              : timelineNodes.filter(n => !n.isCurrent).map(n => n.article),
                            'timeline'
                          )}
                          className={`px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 text-white transition-all cursor-pointer ${
                            cardMode === 'world' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-red-600 hover:bg-red-500'
                          }`}
                        >
                          <GitCommitHorizontal className="w-3 h-3" />
                          <span>FULL TIMELINE</span>
                        </button>
                      </div>
                    </div>

                    <div className="relative pl-4 space-y-2.5 before:content-[''] before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-0.5 before:bg-emerald-500/35">
                      {timelineNodes.map(node => {
                        const relOutlet = getOutletBadge(node.article.src);
                        return (
                          <button
                            key={node.article.id}
                            type="button"
                            onClick={() => onSelectArticle(node.article)}
                            className={`relative w-full text-left p-2.5 rounded-xl border transition-all flex items-start justify-between gap-2.5 cursor-pointer group ${
                              node.isCurrent
                                ? 'bg-emerald-500/10 border-emerald-500/50'
                                : 'bg-[var(--surface-solid)] border-[var(--border)] hover:border-emerald-500/40'
                            }`}
                          >
                            <span
                              className={`absolute -left-[15px] top-3.5 w-2.5 h-2.5 rounded-full border border-[var(--surface-solid)] ${
                                node.isOrigin
                                  ? 'bg-emerald-400'
                                  : node.isLatest
                                    ? 'bg-[var(--accent)]'
                                    : 'bg-amber-400'
                              }`}
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 mb-0.5">
                                <span className="px-1.5 py-0.2 rounded bg-black/10 dark:bg-white/10 text-[9px] uppercase">
                                  {node.stageLabel}
                                </span>
                                {node.deltaFromPrev && (
                                  <span className="text-[9px] text-[var(--ink-muted)] font-normal">
                                    ({node.deltaFromPrev})
                                  </span>
                                )}
                                <span>•</span>
                                <span>{relOutlet.flag}</span>
                                <span>{relOutlet.name.toUpperCase()}</span>
                                <span className="text-[var(--ink-muted)] font-normal">• {formatTimeAgo(node.article.date)}</span>
                              </div>
                              <p className="text-xs font-semibold text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors line-clamp-2">
                                {node.article.title}
                              </p>
                            </div>
                            <span className="text-[10px] font-mono text-[var(--ink-muted)] group-hover:text-[var(--accent)] shrink-0 mt-1">
                              {node.isCurrent ? 'ACTIVE' : 'VIEW →'}
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
                <button
                  type="button"
                  onClick={() => onOpenSnapshot(article)}
                  className="px-3.5 py-2.5 sm:py-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] hover:border-[var(--accent)] text-xs font-mono font-bold text-[var(--ink)] flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                  title="Generate Shareable Snapshot Card"
                >
                  <Camera className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span className="hidden xs:inline">SHARE CARD</span>
                </button>
              </div>
            </motion.aside>
          </div>
        );
      })()}
    </AnimatePresence>
  );
}
