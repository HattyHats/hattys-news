import React, { memo } from 'react';
import { motion } from 'motion/react';
import { Clock, Bookmark, Share2, Check, ExternalLink, Zap, Layers, ShieldCheck, Flame } from 'lucide-react';
import { Article, AppMode, DashboardSettings } from '../../types';
import { CardImage } from './CardImage';
import { detectAssetsInArticle, detectStoryImpact, getOutletBadge } from '../../utils/classifier';
import { formatTimeAgo } from '../../utils/formatters';
import { CRYPTO_CATEGORIES, WORLD_CATEGORIES } from '../../config/feeds';

interface ArticleCardProps {
  article: Article;
  mode: AppMode;
  idx: number;
  isDark: boolean;
  isSaved: boolean;
  isNew: boolean;
  isHero?: boolean;
  copiedId: string | null;
  dashboardSettings: DashboardSettings;
  marketQuotes: Record<string, { price: number; change24h: number; formatted: string }>;
  relatedSources: Article[];
  searchQuery: string;
  onToggleSave: (article: Article) => void;
  onCopyLink: (id: string, link: string) => void;
  onSetQuery: (q: string | ((prev: string) => string)) => void;
  onOpenPerspective: (article: Article, related: Article[]) => void;
}

export const ArticleCard = memo(function ArticleCard({
  article,
  mode,
  idx,
  isDark,
  isSaved,
  isNew,
  isHero = false,
  copiedId,
  dashboardSettings,
  marketQuotes,
  relatedSources,
  searchQuery,
  onToggleSave,
  onCopyLink,
  onSetQuery,
  onOpenPerspective,
}: ArticleCardProps) {
  const cardMode = article.mode || mode;
  const cardCategories = cardMode === 'world' ? WORLD_CATEGORIES : CRYPTO_CATEGORIES;
  const categoryConfig = cardCategories.find(c => c.id === article.primaryCat) || cardCategories[0];
  const badgeClass = categoryConfig.badgeClass || (cardMode === 'world' ? 'badge-world-top' : 'badge-all');

  // Feature 4: Story Impact Classification
  const storyImpact = detectStoryImpact(article.title, article.snippet);

  // Feature 5: Outlet Country & Wire Desk Metas
  const outlet = getOutletBadge(article.src);

  return (
    <motion.article
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(idx * 0.03, 0.6), ease: "easeOut" }}
      className={`card group ${isHero ? 'lg:col-span-2 sm:col-span-2 shadow-2xl border-[var(--accent)]/35' : 'col-span-1'}`}
    >
      <div className={`relative overflow-hidden w-full ${isHero ? 'h-[240px] sm:h-[280px]' : dashboardSettings.cardDensity === 'compact' ? 'h-[140px]' : 'h-[180px]'} bg-[#0c0c10]`}>
        <CardImage article={article} mode={cardMode} />
        
        {/* Category + Hero + NEW Overlay Badges */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
          {isHero && (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black tracking-wider uppercase bg-[var(--accent)] text-white shadow-lg flex items-center gap-1">
              <Flame className="w-3 h-3 fill-white" />
              LEAD DISPATCH
            </span>
          )}
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase backdrop-blur-md ${badgeClass}`}>
            {categoryConfig.label}
          </span>
          {isNew && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-black tracking-wider uppercase bg-emerald-500 text-black shadow-lg shadow-emerald-500/30 flex items-center gap-0.5">
              <Zap className="w-2.5 h-2.5 fill-black" />
              NEW
            </span>
          )}
          {storyImpact && (
            <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-black tracking-wider uppercase backdrop-blur-md border ${storyImpact.badgeClass}`}>
              {storyImpact.label}
            </span>
          )}
        </div>

        {/* Top-right Action Buttons (Bookmark & Copy Link) */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
          <button
            onClick={() => onToggleSave(article)}
            className={`w-7 h-7 rounded-full backdrop-blur-md flex items-center justify-center transition-all cursor-pointer ${
              isSaved
                ? 'bg-amber-500 text-black opacity-100 shadow-lg shadow-amber-500/30'
                : 'bg-black/60 hover:bg-black/90 text-gray-300 hover:text-white opacity-90 sm:opacity-0 sm:group-hover:opacity-100'
            }`}
            title={isSaved ? 'Remove from Read-Later Queue' : 'Save to Read-Later Queue'}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-black' : ''}`} />
          </button>
          <button 
            onClick={() => onCopyLink(article.id, article.link)}
            className="w-7 h-7 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md text-gray-300 hover:text-white flex items-center justify-center transition-all opacity-90 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
            title="Copy Article Link"
          >
            {copiedId === article.id ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Share2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <div className="cb">
        {/* Source & Date line with Feature 5: Regional Flag Badge */}
        <div className="flex items-center justify-between text-[11px] font-mono text-[var(--ink-muted)] mb-1.5">
          <span className={`font-bold tracking-wide flex items-center gap-1.5 ${cardMode === 'world' ? 'text-blue-500 dark:text-blue-400' : 'text-[var(--accent)]'}`}>
            <span className="text-xs" title={`${outlet.region} Wire Desk`}>{outlet.flag}</span>
            <span className="truncate">{outlet.name.toUpperCase()}</span>
          </span>
          <span className="flex items-center gap-1 shrink-0" title={article.date.toLocaleString()}>
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
          <a href={article.link} target="_blank" rel="noopener noreferrer">
            {article.title}
          </a>
        </h2>

        {/* Live Asset Mention Tagging */}
        {dashboardSettings.showAssetTags && (
          (() => {
            const detected = detectAssetsInArticle(article.title, article.snippet, marketQuotes);
            if (detected.length === 0) return null;
            return (
              <div className="flex items-center gap-1.5 flex-nowrap overflow-hidden mb-2">
                {detected.slice(0, 3).map(asset => {
                  const isUp = (asset.change24h ?? 0) >= 0;
                  return (
                    <button
                      key={asset.id}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onSetQuery(prev => prev.toLowerCase() === asset.symbol.toLowerCase() ? '' : asset.symbol);
                      }}
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border transition-all cursor-pointer shrink-0 ${
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
            );
          })()
        )}

        {/* Normalized Snippet with 2-line clamp & balanced height */}
        <p className="text-xs text-[var(--ink-muted)] line-clamp-2 min-h-[2.4rem] mb-2.5 leading-relaxed">
          {article.snippet || `Verified intelligence report dispatch from ${article.src}. Tap below to read the complete wire coverage.`}
        </p>

        {/* Feature 2: Harmonized Consensus & Wire Verification Bar (Equalized Height) */}
        {relatedSources.length > 0 ? (
          <div className={`p-2 rounded-lg border mb-3 transition-all ${
            isDark ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-emerald-50/80 border-emerald-300'
          }`}>
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="text-[10px] font-mono font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider truncate">
                  {relatedSources.length >= 3 ? '100% CONSENSUS' : `${relatedSources.length + 1}-OUTLET CONSENSUS`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onOpenPerspective(article, relatedSources)}
                className={`shrink-0 text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded transition-all cursor-pointer flex items-center gap-1 active:scale-95 touch-manipulation ${
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
            <div className="flex items-center gap-1 mt-1 text-[9px] font-mono text-[var(--ink-muted)] truncate">
              <span className="opacity-70">ALSO ON:</span>
              <span className="font-bold text-[var(--ink)] truncate">
                {relatedSources.map(r => r.src).slice(0, 3).join(', ')}
                {relatedSources.length > 3 ? ` +${relatedSources.length - 3}` : ''}
              </span>
            </div>
          </div>
        ) : (
          <div className="p-2 rounded-lg border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.015] mb-3">
            <div className="flex items-center justify-between gap-1.5 text-[10px] font-mono text-[var(--ink-muted)]">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/40 shrink-0" />
                <span className="font-bold uppercase tracking-wider truncate text-[9px]">
                  PRIMARY WIRE DISPATCH
                </span>
              </div>
              <span className="text-[9px] opacity-60 font-semibold shrink-0 uppercase">
                VERIFIED DESK
              </span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-[9px] font-mono text-[var(--ink-muted)] opacity-60 truncate">
              <span className="truncate">EXCLUSIVE REPORTING VIA {article.src.toUpperCase()}</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 pt-2.5 border-t border-[var(--border)] mt-auto">
          <a 
            href={article.link} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="rbtn flex-1"
          >
            <span>READ FULL REPORT</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={() => onToggleSave(article)}
            className={`px-2.5 py-2 rounded-lg border transition-colors flex items-center justify-center cursor-pointer ${
              isSaved
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-500 dark:text-amber-400'
                : 'border-[var(--border)] text-[var(--ink-muted)] hover:text-[var(--ink)] hover:border-[var(--accent)]/40'
            }`}
            title={isSaved ? 'Saved in Read-Later Queue' : 'Save for Later'}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-amber-400' : ''}`} />
          </button>
        </div>
      </div>
    </motion.article>
  );
});
