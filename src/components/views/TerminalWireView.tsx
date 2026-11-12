import React, { memo } from 'react';
import { motion } from 'motion/react';
import { ExternalLink, Bookmark, Share2, Check, ShieldCheck, Zap, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { Article, AppMode, DashboardSettings } from '../../types';
import { formatTimeAgo } from '../../utils/formatters';
import { detectStoryImpact, getOutletBadge, detectAssetsInArticle } from '../../utils/classifier';
import { AffizyAdUnit } from '../ads/AffizyAdUnit';

interface TerminalWireViewProps {
  articles: Article[];
  mode: AppMode;
  isDark: boolean;
  savedIds: Set<string>;
  copiedId: string | null;
  articleClusters: Map<string, Article[]>;
  dashboardSettings: DashboardSettings;
  marketQuotes: Record<string, { price: number; change24h: number; formatted: string }>;
  onToggleSave: (article: Article) => void;
  onCopyLink: (id: string, link: string) => void;
  onOpenPerspective: (article: Article, related: Article[]) => void;
  onSetQuery: (q: string | ((prev: string) => string)) => void;
}

export const TerminalWireView = memo(function TerminalWireView({
  articles,
  mode,
  isDark,
  savedIds,
  copiedId,
  articleClusters,
  dashboardSettings,
  marketQuotes,
  onToggleSave,
  onCopyLink,
  onOpenPerspective,
  onSetQuery,
}: TerminalWireViewProps) {
  return (
    <div className="w-full rounded-2xl border border-[var(--border)] overflow-hidden bg-[var(--surface-solid)] shadow-xl mb-8">
      {/* Terminal View Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-black/40 dark:bg-black/60 border-b border-[var(--border)] font-mono text-[11px] text-[var(--ink-muted)] font-bold tracking-wider uppercase">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-[var(--ink)]">TERMINAL LIVE WIRE STREAM</span>
          <span className="opacity-60 hidden sm:inline">• HIGH-FREQUENCY DISPATCH FEED</span>
        </div>
        <div className="flex items-center gap-4 text-[10px]">
          <span className="hidden md:inline">CORROBORATION</span>
          <span>DISPATCH</span>
        </div>
      </div>

      {/* Wire Dispatch Rows */}
      <div className="divide-y divide-[var(--border)]">
        {(() => {
          const wireAdIndex = articles.length >= 8 ? 7 : articles.length > 0 ? articles.length - 1 : -1;

          return articles.map((art, idx) => {
            const isSaved = savedIds.has(art.id);
            const related = articleClusters.get(art.id) || [];
            const impact = detectStoryImpact(art.title, art.snippet);
            const outlet = getOutletBadge(art.src);
            const detectedAssets = dashboardSettings.showAssetTags
              ? detectAssetsInArticle(art.title, art.snippet, marketQuotes)
              : [];

            return (
              <React.Fragment key={art.id || idx}>
                <div 
                  className={`group px-3 sm:px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-2.5 transition-colors ${
                    isDark ? 'hover:bg-white/[0.025]' : 'hover:bg-slate-50/80'
                  }`}
                >
                {/* Left Meta & Headline Block */}
                <div className="flex-1 min-w-0 flex items-start gap-2.5 sm:gap-3.5">
                  {/* Time & Index */}
                  <div className="shrink-0 flex md:flex-col items-center md:items-start gap-1.5 md:gap-0.5 text-[10px] font-mono text-[var(--ink-muted)] pt-0.5 min-w-[55px]">
                    <span className="font-bold text-[var(--ink)]">
                      {formatTimeAgo(art.date)}
                    </span>
                    <span className="text-[9px] opacity-60">#{String(idx + 1).padStart(2, '0')}</span>
                  </div>

                  {/* Headline & Badges */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      {/* Outlet Flag & Name */}
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-black/10 dark:bg-white/10 text-[var(--ink)] border border-[var(--border)]">
                        <span>{outlet.flag}</span>
                        <span className="truncate">{outlet.name}</span>
                      </span>

                      {/* Primary Category Pill */}
                      <span className="text-[9px] font-mono uppercase font-bold px-1.5 py-0.2 rounded bg-black/5 dark:bg-white/5 text-[var(--ink-muted)] border border-[var(--border)]">
                        {art.primaryCat}
                      </span>

                      {/* Story Impact Badge */}
                      {impact && (
                        <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded border ${impact.badgeClass}`}>
                          {impact.label}
                        </span>
                      )}

                      {/* Financial Asset Mentions */}
                      {detectedAssets.slice(0, 2).map(ast => (
                        <button
                          key={ast.id}
                          onClick={() => onSetQuery(ast.symbol)}
                          className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/30 hover:bg-[var(--accent)]/20 transition-colors cursor-pointer"
                          title={`Filter for ${ast.symbol}`}
                        >
                          ${ast.symbol} {ast.formatted}
                        </button>
                      ))}
                    </div>

                    {/* Headline Text */}
                    <a
                      href={art.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-sans font-bold text-sm sm:text-[15px] text-[var(--ink)] hover:text-[var(--accent)] transition-colors leading-snug line-clamp-2"
                      title={art.title}
                    >
                      {art.title}
                    </a>
                  </div>
                </div>

                {/* Right Consensus & Quick Actions Block */}
                <div className="shrink-0 flex items-center justify-between md:justify-end gap-2 pt-1 md:pt-0 border-t md:border-t-0 border-[var(--border)]/50">
                  {/* Consensus Corroboration Badge */}
                  {related.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => onOpenPerspective(art, related)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono font-bold bg-emerald-500/15 border border-emerald-500/35 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 transition-all cursor-pointer"
                      title={`Compare ${related.length + 1} independent newsroom reports`}
                    >
                      <ShieldCheck className="w-3 h-3 text-emerald-500" />
                      <span>{related.length >= 3 ? '100% CONSENSUS' : `${related.length + 1} WIRES`}</span>
                      <span className="font-sans text-[10px]">⇄</span>
                    </button>
                  ) : (
                    <span className="text-[9px] font-mono text-[var(--ink-muted)] opacity-50 hidden lg:inline">
                      1 WIRE DESK
                    </span>
                  )}

                  {/* Bookmark Button */}
                  <button
                    onClick={() => onToggleSave(art)}
                    className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                      isSaved
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-500 dark:text-amber-400'
                        : 'border-[var(--border)] text-[var(--ink-muted)] hover:text-[var(--ink)]'
                    }`}
                    title={isSaved ? 'Remove from Read-Later Queue' : 'Save for Later'}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-amber-400' : ''}`} />
                  </button>

                  {/* Share Link Button */}
                  <button
                    onClick={() => onCopyLink(art.id, art.link)}
                    className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors cursor-pointer"
                    title="Copy Article Link"
                  >
                    {copiedId === art.id ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Share2 className="w-3.5 h-3.5" />}
                  </button>

                  {/* Read Article Link */}
                  <a
                    href={art.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rbtn px-2.5 py-1 text-[10px] rounded-md"
                  >
                    <span>OPEN</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>

              {/* In-Feed Sponsored Unit (Affizy Zone 1015) */}
              {idx === wireAdIndex && (
                <div className="py-4 px-3 bg-black/20 flex flex-col items-center justify-center">
                  <div className="text-[10px] font-mono text-[var(--ink-muted)] mb-1 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    <span>SPONSORED WIRE INTEL</span>
                  </div>
                  <AffizyAdUnit zoneId="1015" bannerSize="300x250" maxWidth="max-w-[360px]" />
                </div>
              )}
            </React.Fragment>
          );
        });
      })()}
      </div>
    </div>
  );
});
