import React, { memo } from 'react';
import {
  ExternalLink,
  Bookmark,
  Share2,
  Check,
  ShieldCheck,
  BookOpen,
  Camera,
  TrendingUp,
  TrendingDown,
  GitCommitHorizontal,
} from 'lucide-react';
import { Article, AppMode, DashboardSettings } from '../../types';
import { formatTimeAgo } from '../../utils/formatters';
import { detectStoryImpact, getOutletBadge, detectAssetsInArticle } from '../../utils/classifier';
import { AffizyAdUnit } from '../ads/AffizyAdUnit';
import { computeStoryPulse, PulseVote } from '../../utils/communityPulse';

const EMPTY_RELATED: Article[] = [];

interface TerminalWireViewProps {
  articles: Article[];
  mode: AppMode;
  isDark: boolean;
  savedIds: Set<string>;
  copiedId: string | null;
  focusedIdx: number | null;
  pulseVotes: Record<string, PulseVote>;
  articleClusters: Map<string, Article[]>;
  dashboardSettings: DashboardSettings;
  marketQuotes: Record<string, { price: number; change24h: number; formatted: string }>;
  onVotePulse: (articleId: string, vote: PulseVote) => void;
  onOpenSnapshot: (article: Article) => void;
  onToggleSave: (article: Article) => void;
  onCopyLink: (id: string, link: string) => void;
  onOpenPerspective: (article: Article, related: Article[], initialTab?: 'compare' | 'timeline') => void;
  onOpenArticle: (article: Article) => void;
  onSetQuery: (q: string | ((prev: string) => string)) => void;
}

export const TerminalWireView = memo(function TerminalWireView({
  articles,
  mode,
  isDark,
  savedIds,
  copiedId,
  focusedIdx,
  pulseVotes,
  articleClusters,
  dashboardSettings,
  marketQuotes,
  onVotePulse,
  onOpenSnapshot,
  onToggleSave,
  onCopyLink,
  onOpenPerspective,
  onOpenArticle,
  onSetQuery,
}: TerminalWireViewProps) {
  return (
    <div className="w-full rounded-2xl border border-[var(--border)] overflow-hidden bg-[var(--surface-solid)] shadow-xl mb-8">
      {/* Terminal View Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-black/40 dark:bg-black/60 border-b border-[var(--border)] font-mono text-[11px] text-[var(--ink-muted)] font-bold tracking-wider uppercase">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-[var(--ink)]">TERMINAL LIVE WIRE STREAM</span>
          <span className="opacity-60 hidden sm:inline">• HIGH-FREQUENCY DISPATCH FEED</span>
        </div>
        <div className="flex items-center gap-4 text-[10px]">
          <span className="hidden md:inline">PULSE & CONSENSUS</span>
          <span>DISPATCH</span>
        </div>
      </div>

      {/* Wire Dispatch Rows */}
      <div className="divide-y divide-[var(--border)]">
        {(() => {
          const wireAdIndex = articles.length >= 8 ? 7 : articles.length > 0 ? articles.length - 1 : -1;

          return articles.map((art, idx) => {
            const isSaved = savedIds.has(art.id);
            const isFocused = focusedIdx === idx;
            const related = articleClusters.get(art.id) || EMPTY_RELATED;
            const impact = detectStoryImpact(art.title, art.snippet);
            const outlet = getOutletBadge(art.src);
            const detectedAssets = dashboardSettings.showAssetTags
              ? detectAssetsInArticle(art.title, art.snippet, marketQuotes)
              : [];
            const pulse = computeStoryPulse(art, mode, pulseVotes[art.id] || null, related.length);

            return (
              <React.Fragment key={art.id || idx}>
                <div
                  data-article-idx={idx}
                  className={`group px-3 sm:px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-2.5 transition-colors ${
                    isFocused
                      ? 'bg-[var(--accent)]/10 ring-1 ring-inset ring-[var(--accent)]'
                      : isDark
                        ? 'hover:bg-white/[0.025]'
                        : 'hover:bg-slate-50/80'
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
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] leading-none font-mono font-bold bg-black/10 dark:bg-white/10 text-[var(--ink)] border border-[var(--border)]">
                          <span>{outlet.flag}</span>
                          <span className="truncate">{outlet.name}</span>
                        </span>

                        {/* Primary Category Pill */}
                        <span className="text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded leading-none bg-black/5 dark:bg-white/5 text-[var(--ink-muted)] border border-[var(--border)]">
                          {art.primaryCat}
                        </span>

                        {/* Story Impact Badge */}
                        {impact && (
                          <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded leading-none border ${impact.badgeClass}`}>
                            {impact.label}
                          </span>
                        )}

                        {/* Financial Asset Mentions */}
                        {detectedAssets.slice(0, 2).map(ast => (
                          <button
                            key={ast.id}
                            type="button"
                            onClick={() => onSetQuery(ast.symbol)}
                            className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded leading-none bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/30 hover:bg-[var(--accent)]/20 transition-colors cursor-pointer"
                            title={`Filter for ${ast.symbol}`}
                          >
                            ${ast.symbol} {ast.formatted}
                          </button>
                        ))}
                      </div>

                      {/* Headline Text */}
                      <button
                        type="button"
                        onClick={() => onOpenArticle(art)}
                        className="text-left font-sans font-bold text-sm sm:text-[15px] text-[var(--ink)] hover:text-[var(--accent)] transition-colors leading-snug line-clamp-2 cursor-pointer"
                        title={art.title}
                      >
                        {art.title}
                      </button>
                    </div>
                  </div>

                  {/* Right Pulse, Consensus & Quick Actions Block */}
                  <div className="shrink-0 flex items-center justify-between md:justify-end gap-1.5 pt-1 md:pt-0 border-t md:border-t-0 border-[var(--border)]/50 flex-wrap">
                    {/* Community Pulse Quick Vote */}
                    <div className="inline-flex items-center rounded-md border border-[var(--border)] bg-black/10 dark:bg-white/5 p-0.5 text-[10px] font-mono">
                      <button
                        type="button"
                        onClick={() => onVotePulse(art.id, 'up')}
                        className={`px-1.5 py-0.5 rounded flex items-center gap-0.5 font-bold cursor-pointer transition-colors ${
                          pulse.userVote === 'up'
                            ? 'bg-emerald-500/25 text-emerald-400'
                            : 'text-emerald-500 dark:text-emerald-400 hover:bg-emerald-500/10'
                        }`}
                        title={`Vote ${pulse.upLabel}`}
                      >
                        <TrendingUp className="w-2.5 h-2.5" />
                        <span>{pulse.upPct}%</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onVotePulse(art.id, 'down')}
                        className={`px-1.5 py-0.5 rounded flex items-center gap-0.5 font-bold cursor-pointer transition-colors ${
                          pulse.userVote === 'down'
                            ? 'bg-rose-500/25 text-rose-400'
                            : 'text-rose-500 dark:text-rose-400 hover:bg-rose-500/10'
                        }`}
                        title={`Vote ${pulse.downLabel}`}
                      >
                        <span>{pulse.downPct}%</span>
                        <TrendingDown className="w-2.5 h-2.5" />
                      </button>
                    </div>

                    {/* Consensus & Timeline Badge */}
                    {related.length > 0 && (
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onOpenPerspective(art, related, 'timeline')}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono font-bold bg-emerald-500/15 border border-emerald-500/35 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 transition-all cursor-pointer"
                          title="Open Developing Story Timeline"
                        >
                          <GitCommitHorizontal className="w-3 h-3 text-emerald-500" />
                          <span>{related.length + 1} WIRES</span>
                        </button>
                      </div>
                    )}

                    {/* Snapshot Card Button */}
                    <button
                      type="button"
                      onClick={() => onOpenSnapshot(art)}
                      className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors cursor-pointer"
                      title="Generate Shareable Snapshot Card (P)"
                    >
                      <Camera className="w-3.5 h-3.5 text-[var(--accent)]" />
                    </button>

                    {/* Bookmark Button */}
                    <button
                      type="button"
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
                      type="button"
                      onClick={() => onCopyLink(art.id, art.link)}
                      className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors cursor-pointer"
                      title="Copy Article Link"
                    >
                      {copiedId === art.id ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Share2 className="w-3.5 h-3.5" />}
                    </button>

                    {/* Read In-Terminal Drawer Button */}
                    <button
                      type="button"
                      onClick={() => onOpenArticle(art)}
                      className="rbtn px-2.5 py-1 text-[10px] rounded-md cursor-pointer"
                    >
                      <BookOpen className="w-3 h-3" />
                      <span>READ</span>
                    </button>

                    {/* Open External Source */}
                    <a
                      href={art.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors"
                      title={`Open original source on ${outlet.name}`}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
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
