import React, { memo, useMemo } from 'react';
import {
  Clock,
  Bookmark,
  Share2,
  Check,
  ExternalLink,
  ShieldCheck,
  Flame,
  BookOpen,
  Camera,
  TrendingUp,
  TrendingDown,
  GitCommitHorizontal,
} from 'lucide-react';
import { Article, AppMode, DashboardSettings } from '../../types';
import { CardImage } from './CardImage';
import { detectAssetsInArticle, detectStoryImpact, getOutletBadge } from '../../utils/classifier';
import { formatTimeAgo } from '../../utils/formatters';
import { CRYPTO_CATEGORIES, WORLD_CATEGORIES } from '../../config/feeds';
import { computeStoryPulse, PulseVote } from '../../utils/communityPulse';

interface ArticleCardProps {
  article: Article;
  mode: AppMode;
  idx: number;
  isDark: boolean;
  isSaved: boolean;
  isNew: boolean;
  isHero?: boolean;
  isFocused?: boolean;
  copiedId: string | null;
  dashboardSettings: DashboardSettings;
  marketQuotes: Record<string, { price: number; change24h: number; formatted: string }>;
  relatedSources: Article[];
  searchQuery: string;
  userVote: PulseVote | null;
  onVotePulse: (articleId: string, vote: PulseVote) => void;
  onOpenSnapshot: (article: Article) => void;
  onToggleSave: (article: Article) => void;
  onCopyLink: (id: string, link: string) => void;
  onSetQuery: (q: string | ((prev: string) => string)) => void;
  onOpenPerspective: (article: Article, related: Article[], initialTab?: 'compare' | 'timeline') => void;
  onOpenArticle: (article: Article) => void;
}

export const ArticleCard = memo(function ArticleCard({
  article,
  mode,
  idx,
  isDark,
  isSaved,
  isNew,
  isHero = false,
  isFocused = false,
  copiedId,
  dashboardSettings,
  marketQuotes,
  relatedSources,
  searchQuery,
  userVote,
  onVotePulse,
  onOpenSnapshot,
  onToggleSave,
  onCopyLink,
  onSetQuery,
  onOpenPerspective,
  onOpenArticle,
}: ArticleCardProps) {
  const cardMode = article.mode || mode;
  const cardCategories = cardMode === 'world' ? WORLD_CATEGORIES : CRYPTO_CATEGORIES;
  const categoryConfig = cardCategories.find(c => c.id === article.primaryCat) || cardCategories[0];
  const badgeClass = categoryConfig.badgeClass || (cardMode === 'world' ? 'badge-world-top' : 'badge-all');

  // Feature 4: Story Impact Classification
  const storyImpact = useMemo(() => detectStoryImpact(article.title, article.snippet), [article.title, article.snippet]);

  // Feature 5: Outlet Country & Wire Desk Metas
  const outlet = useMemo(() => getOutletBadge(article.src), [article.src]);

  // Detected financial asset tags (only re-runs when article or quotes update)
  const detectedAssets = useMemo(
    () => (dashboardSettings.showAssetTags ? detectAssetsInArticle(article.title, article.snippet, marketQuotes) : []),
    [dashboardSettings.showAssetTags, article.title, article.snippet, marketQuotes]
  );

  // Feature 3: Community Sentiment Pulse
  const pulse = useMemo(
    () => computeStoryPulse(article, cardMode, userVote, relatedSources.length),
    [article, cardMode, userVote, relatedSources.length]
  );

  return (
    <article
      data-article-idx={idx}
      className={`card group transition-all ${
        isHero ? 'lg:col-span-2 sm:col-span-2 shadow-2xl border-[var(--accent)]/35' : 'col-span-1'
      } ${
        isFocused
          ? 'ring-2 ring-[var(--accent)] border-[var(--accent)] shadow-[0_0_24px_rgba(239,68,68,0.22)]'
          : ''
      }`}
    >
      <div
        onClick={() => onOpenArticle(article)}
        className={`relative overflow-hidden w-full cursor-pointer ${isHero ? 'h-[240px] sm:h-[280px]' : dashboardSettings.cardDensity === 'compact' ? 'h-[140px]' : 'h-[180px]'} bg-[#0c0c10]`}
      >
        <CardImage article={article} mode={cardMode} priority={idx < 4} />
        
        {/* Category + Hero Overlay Badges (Single Clean Row) */}
        <div className="absolute top-2.5 left-2.5 right-20 flex items-center gap-1.5 flex-nowrap overflow-hidden pointer-events-none">
          {isHero && (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black tracking-wider uppercase bg-[var(--accent)] text-white shadow-lg flex items-center gap-1 shrink-0">
              <Flame className="w-3 h-3 fill-white" />
              LEAD
            </span>
          )}
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase bg-black/80 shrink-0 ${badgeClass}`}>
            {categoryConfig.label}
          </span>
          {storyImpact && (
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-black tracking-wider uppercase bg-black/80 border truncate ${storyImpact.badgeClass}`}>
              {storyImpact.label}
            </span>
          )}
          {isFocused && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-black tracking-wider uppercase bg-[var(--accent)] text-white shadow-md shrink-0">
              ⏎ READ
            </span>
          )}
        </div>

        {/* Top-right Action Buttons (Bookmark & Copy Link) */}
        <div
          className="absolute top-2.5 right-2.5 flex items-center gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => onToggleSave(article)}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-opacity cursor-pointer ${
              isSaved
                ? 'bg-amber-500 text-black opacity-100 shadow-lg shadow-amber-500/30'
                : 'bg-black/80 hover:bg-black text-gray-200 hover:text-white opacity-90 sm:opacity-0 sm:group-hover:opacity-100'
            }`}
            title={isSaved ? 'Remove from Read-Later Queue' : 'Save to Read-Later Queue'}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-black' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => onCopyLink(article.id, article.link)}
            className="w-7 h-7 rounded-full bg-black/80 hover:bg-black text-gray-200 hover:text-white flex items-center justify-center transition-opacity opacity-90 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
            title="Copy Article Link"
          >
            {copiedId === article.id ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Share2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <div className="cb">
        <div>
          {/* Source & Date line with Feature 5: Regional Flag Badge */}
          <div className="flex items-center justify-between text-[11px] font-mono text-[var(--ink-muted)] mb-1.5">
            <span className={`font-bold tracking-wide flex items-center gap-1.5 min-w-0 ${cardMode === 'world' ? 'text-blue-500 dark:text-blue-400' : 'text-[var(--accent)]'}`}>
              <span className="text-xs shrink-0" title={`${outlet.region} Wire Desk`}>{outlet.flag}</span>
              <span className="truncate">{outlet.name.toUpperCase()}</span>
            </span>
            <span className="flex items-center gap-1 shrink-0 ml-2" title={article.date.toLocaleString()}>
              {isNew && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" title="New since last check-in" />}
              <Clock className="w-3 h-3 opacity-60" />
              {formatTimeAgo(article.date)}
            </span>
          </div>

          {/* Headline */}
          <h2 
            className={`ct text-[var(--ink)] hover:text-[var(--accent)] transition-colors leading-snug font-bold ${
              isHero ? 'text-base sm:text-xl font-display line-clamp-2 min-h-[3.2rem] mb-2' : 'line-clamp-2 min-h-[2.85rem] mb-2'
            }`} 
            title={article.title}
          >
            <button
              type="button"
              onClick={() => onOpenArticle(article)}
              className="text-left hover:underline decoration-1 underline-offset-2 cursor-pointer"
            >
              {article.title}
            </button>
          </h2>

          {/* Live Asset Mention Tagging */}
          {detectedAssets.length > 0 && (
            <div className="flex items-center gap-1.5 flex-nowrap overflow-hidden mb-2">
              {detectedAssets.slice(0, 3).map(asset => {
                const isUp = (asset.change24h ?? 0) >= 0;
                return (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onSetQuery(prev => prev.toLowerCase() === asset.symbol.toLowerCase() ? '' : asset.symbol);
                    }}
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border transition-colors cursor-pointer shrink-0 ${
                      searchQuery.toLowerCase() === asset.symbol.toLowerCase()
                        ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-sm'
                        : isDark 
                          ? 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/25 text-white' 
                          : 'bg-black/5 hover:bg-black/10 border-black/10 hover:border-black/25 text-slate-800'
                    }`}
                    title={`Click to filter stories for ${asset.name} (${asset.symbol})`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: asset.color }} />
                    <span>${asset.symbol}</span>
                    {asset.formatted && (
                      <span className="opacity-80 font-normal">{asset.formatted}</span>
                    )}
                    {typeof asset.change24h === 'number' && (
                      <span className={`text-[9px] font-bold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isUp ? '▲' : '▼'}{Math.abs(asset.change24h).toFixed(1)}%
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Normalized Snippet with 2-line clamp & balanced height */}
          <p className="text-xs text-[var(--ink-muted)] line-clamp-2 min-h-[2.4rem] mb-2.5 leading-relaxed">
            {article.snippet || `Verified intelligence report dispatch from ${article.src}. Tap below to read the complete wire coverage.`}
          </p>
        </div>

        <div className="mt-auto">
          {/* Multi-Outlet Consensus & Timeline Bar (only shown when verified across multiple outlets) */}
          {relatedSources.length > 0 && (
            <div className={`p-2 rounded-lg border mb-2 transition-all ${
              isDark ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-emerald-50/80 border-emerald-300'
            }`}>
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="text-[10px] font-mono font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider truncate">
                    {relatedSources.length + 1} WIRES
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => onOpenPerspective(article, relatedSources, 'timeline')}
                    className="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/15 dark:bg-white/10 hover:bg-black/25 dark:hover:bg-white/20 text-[var(--ink)] transition-all cursor-pointer flex items-center gap-0.5"
                    title="View chronological Developing Story Timeline"
                  >
                    <GitCommitHorizontal className="w-2.5 h-2.5 text-emerald-400" />
                    <span>TIMELINE</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenPerspective(article, relatedSources, 'compare')}
                    className={`text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded transition-all cursor-pointer flex items-center gap-0.5 active:scale-95 touch-manipulation ${
                      cardMode === 'world'
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-500/20'
                        : 'bg-red-600 hover:bg-red-500 text-white shadow-sm shadow-red-500/20'
                    }`}
                    title="Compare coverage and headline framing across outlets side-by-side"
                  >
                    <span>COMPARE</span>
                    <span className="font-sans text-[10px]">⇄</span>
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-1 mt-1 text-[9px] font-mono text-[var(--ink-muted)] truncate">
                <span className="opacity-70">ALSO ON:</span>
                <span className="font-bold text-[var(--ink)] truncate">
                  {relatedSources.map(r => r.src).slice(0, 3).join(', ')}
                  {relatedSources.length > 3 ? ` +${relatedSources.length - 3}` : ''}
                </span>
              </div>
            </div>
          )}

          {/* Slim 1-Line Community Sentiment Pulse Bar */}
          <div className="mb-2 pt-1.5">
            <div className="flex items-center justify-between gap-2 text-[10px] font-mono mb-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onVotePulse(article.id, 'up');
                }}
                className={`inline-flex items-center gap-1 font-bold transition-colors cursor-pointer ${
                  pulse.userVote === 'up'
                    ? 'text-emerald-400 underline'
                    : 'text-emerald-500/85 hover:text-emerald-400'
                }`}
                title={`Vote ${pulse.upLabel} (${pulse.upVotes} votes)`}
              >
                <TrendingUp className="w-3 h-3" />
                <span>{pulse.upShortLabel} {pulse.upPct}%</span>
              </button>

              <span className="text-[9px] text-[var(--ink-muted)] opacity-60">
                {pulse.totalVotes} VOTES
              </span>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onVotePulse(article.id, 'down');
                }}
                className={`inline-flex items-center gap-1 font-bold transition-colors cursor-pointer ${
                  pulse.userVote === 'down'
                    ? 'text-rose-400 underline'
                    : 'text-rose-500/85 hover:text-rose-400'
                }`}
                title={`Vote ${pulse.downLabel} (${pulse.downVotes} votes)`}
              >
                <span>{pulse.downPct}% {pulse.downShortLabel}</span>
                <TrendingDown className="w-3 h-3" />
              </button>
            </div>
            <div className="w-full h-1 rounded-full bg-rose-500/30 overflow-hidden flex">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${pulse.upPct}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 pt-2.5 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={() => onOpenArticle(article)}
              className="rbtn flex-1 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>READ DISPATCH</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenSnapshot(article)}
              className="px-2.5 py-2 rounded-lg border border-[var(--border)] text-[var(--ink-muted)] hover:text-[var(--ink)] hover:border-[var(--accent)]/40 transition-colors flex items-center justify-center cursor-pointer"
              title="Generate Shareable Terminal Snapshot Card (P)"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-2 rounded-lg border border-[var(--border)] text-[var(--ink-muted)] hover:text-[var(--ink)] hover:border-[var(--accent)]/40 transition-colors flex items-center justify-center"
              title={`Open original article on ${outlet.name}`}
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </article>
  );
});
