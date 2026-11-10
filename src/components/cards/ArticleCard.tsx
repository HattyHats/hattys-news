import React, { memo } from 'react';
import { motion } from 'motion/react';
import { Clock, Bookmark, Share2, Check, ExternalLink, Zap, Layers } from 'lucide-react';
import { Article, AppMode, DashboardSettings } from '../../types';
import { CardImage } from './CardImage';
import { detectAssetsInArticle } from '../../utils/classifier';
import { formatTimeAgo } from '../../utils/formatters';
import { CRYPTO_CATEGORIES, WORLD_CATEGORIES } from '../../config/feeds';

interface ArticleCardProps {
  article: Article;
  mode: AppMode;
  idx: number;
  isDark: boolean;
  isSaved: boolean;
  isNew: boolean;
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

  return (
    <motion.article
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(idx * 0.03, 0.6), ease: "easeOut" }}
      className="card group"
    >
      <div className={`relative overflow-hidden w-full ${dashboardSettings.cardDensity === 'compact' ? 'h-[140px]' : 'h-[180px]'} bg-[#0c0c10]`}>
        <CardImage article={article} mode={cardMode} />
        
        {/* Category + NEW Overlay Badges */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase backdrop-blur-md ${badgeClass}`}>
            {categoryConfig.label}
          </span>
          {isNew && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-black tracking-wider uppercase bg-emerald-500 text-black shadow-lg shadow-emerald-500/30 flex items-center gap-0.5">
              <Zap className="w-2.5 h-2.5 fill-black" />
              NEW
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
        <div className="flex items-center justify-between text-[11px] font-mono text-[var(--ink-muted)] mb-1.5">
          <span className={`font-bold tracking-wide ${cardMode === 'world' ? 'text-blue-500 dark:text-blue-400' : 'text-[var(--accent)]'}`}>
            {article.src}
          </span>
          <span className="flex items-center gap-1" title={article.date.toLocaleString()}>
            <Clock className="w-3 h-3 opacity-60" />
            {formatTimeAgo(article.date)}
          </span>
        </div>

        <h2 className="ct text-[var(--ink)] hover:text-[var(--accent)] transition-colors" title={article.title}>
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
              <div className="flex items-center gap-1.5 flex-wrap my-2">
                {detected.map(asset => {
                  const isUp = (asset.change24h ?? 0) >= 0;
                  return (
                    <button
                      key={asset.id}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onSetQuery(prev => prev.toLowerCase() === asset.symbol.toLowerCase() ? '' : asset.symbol);
                      }}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border transition-all cursor-pointer ${
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

        {article.snippet && (
          <p className="text-xs text-[var(--ink-muted)] line-clamp-2 mb-3 leading-relaxed">
            {article.snippet}
          </p>
        )}

        {/* Feature: Multi-Source Story Clustering + Side-by-Side Perspective Trigger */}
        {relatedSources.length > 0 && (
          <div className={`mb-3 p-2.5 rounded-lg border border-[var(--border)] ${
            isDark ? 'bg-white/[0.03]' : 'bg-slate-50'
          }`}>
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-[var(--ink-muted)] flex items-center gap-1">
                <Layers className="w-2.5 h-2.5 text-[var(--accent)]" />
                <span>ALSO COVERED BY ({relatedSources.length}):</span>
              </div>

              {/* Side-by-Side Perspective Comparator Button */}
              <button
                onClick={() => onOpenPerspective(article, relatedSources)}
                className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded transition-all cursor-pointer flex items-center gap-1 ${
                  cardMode === 'world'
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-500/20'
                    : 'bg-red-600 hover:bg-red-500 text-white shadow-sm shadow-red-500/20'
                }`}
                title="Compare coverage and headline framing across outlets side-by-side"
              >
                <span>COMPARE PERSPECTIVES</span>
                <span className="font-sans text-[10px]">⇄</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {relatedSources.map(rel => (
                <a
                  key={rel.id}
                  href={rel.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border transition-colors inline-flex items-center gap-1 ${
                    cardMode === 'world'
                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/25 hover:bg-blue-500/20'
                      : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25 hover:bg-amber-500/20'
                  }`}
                  title={rel.title}
                >
                  <span>{rel.src}</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 min-h-[0.5rem]"></div>

        <div className="flex items-center gap-2 pt-2 border-t border-[var(--border)] mt-auto">
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
