import React from 'react';
import {
  Bookmark,
  Zap,
  ChevronUp,
  ChevronDown,
  LayoutGrid,
  List,
  Star,
  Crosshair,
  Play,
} from 'lucide-react';
import { CategoryConfig, AppMode, Article, ViewLayoutMode } from '../../types';

interface FilterTabsProps {
  categories: CategoryConfig[];
  categoryCounts: Record<string, number>;
  activeFilter: string;
  radarMatchCount: number;
  radarTermsCount: number;
  savedArticles: Article[];
  showBrief: boolean;
  signalOnly: boolean;
  hiddenFluffCount: number;
  mode: AppMode;
  viewMode: ViewLayoutMode;
  onSetFilter: (filterId: string) => void;
  onToggleBrief: () => void;
  onToggleViewMode: () => void;
  onToggleSignalOnly: () => void;
  onPlaySavedQueue?: () => void;
}

export function FilterTabs({
  categories,
  categoryCounts,
  activeFilter,
  radarMatchCount,
  radarTermsCount,
  savedArticles,
  showBrief,
  signalOnly,
  hiddenFluffCount,
  mode,
  viewMode,
  onSetFilter,
  onToggleBrief,
  onToggleViewMode,
  onToggleSignalOnly,
  onPlaySavedQueue,
}: FilterTabsProps) {
  return (
    <div className="mb-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
      {/* Scrollable / Wrapping Category Pills (1 clean row at 1440px, 2 balanced rows at 1280px) */}
      <div className="relative flex-1 min-w-0">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 sm:pb-0 sm:flex-wrap pr-6 sm:pr-0">
          {categories.map((cat) => {
            const isActive = activeFilter === cat.id;
            const count = categoryCounts[cat.id] ?? 0;

            return (
              <button
                key={cat.id}
                className={`fp shrink-0 cursor-pointer !py-1 !px-1.5 xl:!px-2 !text-[10px] xl:!text-[10.5px] ${isActive ? 'on' : ''}`}
                onClick={() => onSetFilter(cat.id)}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                <span className={`text-[9.5px] font-mono px-1 py-0.5 rounded-full leading-none ${
                  isActive ? 'bg-white/20 text-white' : 'bg-black/5 dark:bg-white/5 text-[var(--ink-muted)]'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}

          {/* MY RADAR Custom Watchlist Pill */}
          <button
            type="button"
            className={`fp shrink-0 cursor-pointer !py-1 !px-1.5 xl:!px-2 !text-[10px] xl:!text-[10.5px] ${
              activeFilter === 'radar'
                ? 'on'
                : radarTermsCount > 0
                  ? 'border-cyan-500/45 text-cyan-500 dark:text-cyan-400 hover:border-cyan-400'
                  : 'border-dashed border-cyan-500/35 text-[var(--ink-muted)] hover:text-cyan-400 hover:border-cyan-400'
            }`}
            onClick={() => onSetFilter(activeFilter === 'radar' ? 'all' : 'radar')}
            title={
              radarTermsCount > 0
                ? `View dispatches matching your ${radarTermsCount} My Radar topics`
                : 'Pin custom coins or keywords to build your My Radar feed'
            }
          >
            <Star className={`w-3 h-3 ${radarTermsCount > 0 ? 'fill-amber-400 text-amber-400' : 'text-cyan-400'}`} />
            <span>RADAR</span>
            <span className={`text-[9.5px] font-mono px-1 py-0.5 rounded-full leading-none ${
              activeFilter === 'radar'
                ? 'bg-white/20 text-white'
                : radarTermsCount > 0
                  ? 'bg-cyan-500/15 text-cyan-500 dark:text-cyan-300'
                  : 'bg-black/5 dark:bg-white/5 text-[var(--ink-muted)]'
            }`}>
              {radarTermsCount > 0 ? radarMatchCount : '+'}
            </span>
          </button>

          {/* SAVED / Read-Later Queue Filter Pill */}
          <button
            className={`fp shrink-0 cursor-pointer !py-1 !px-1.5 xl:!px-2 !text-[10px] xl:!text-[10.5px] ${activeFilter === 'saved' ? 'on' : savedArticles.length > 0 ? 'border-amber-500/40 text-amber-400' : ''}`}
            onClick={() => onSetFilter(activeFilter === 'saved' ? 'all' : 'saved')}
            title="View your saved Read-Later queue"
          >
            <Bookmark className={`w-3 h-3 ${savedArticles.length > 0 ? 'fill-amber-400 text-amber-400' : ''}`} />
            <span>SAVED</span>
            <span className={`text-[9.5px] font-mono px-1 py-0.5 rounded-full leading-none ${
              activeFilter === 'saved' ? 'bg-white/20 text-white' : 'bg-black/5 dark:bg-white/5 text-[var(--ink-muted)]'
            }`}>
              {savedArticles.length}
            </span>
          </button>
        </div>

        {/* Visual scroll fade hint on < sm mobile */}
        <div
          aria-hidden="true"
          className="pointer-events-none sm:hidden absolute top-0 right-0 bottom-1 w-8 bg-gradient-to-l from-[var(--bg)] to-transparent"
        />
      </div>

      {/* Streamlined Utility Controls (No Duplicate Customize Button) */}
      <div className="flex items-center justify-between sm:justify-end gap-1 shrink-0 flex-wrap">
        <div className="flex items-center gap-1">
          {/* Play Saved Queue Button when Saved Tab is Active */}
          {savedArticles.length > 0 && onPlaySavedQueue && activeFilter === 'saved' && (
            <button
              type="button"
              onClick={onPlaySavedQueue}
              className="fp shrink-0 !py-1 !px-2 !text-[10.5px] border-emerald-500/50 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500 hover:text-black flex items-center gap-1 transition-all cursor-pointer font-bold"
              title="Listen to all saved dispatches hands-free in Audio Mini-Player"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>PLAY SAVED</span>
            </button>
          )}

          {/* Anti-Clickbait Signal Filter Toggle */}
          <button
            type="button"
            onClick={onToggleSignalOnly}
            className={`fp shrink-0 !py-1 !px-2 !text-[10.5px] flex items-center gap-1 transition-all cursor-pointer ${
              signalOnly
                ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 shadow-sm'
                : 'text-[var(--ink-muted)] hover:text-[var(--ink)] hover:border-emerald-500/40'
            }`}
            title={
              signalOnly
                ? `Signal Only active (${hiddenFluffCount} clickbait/price-prediction hype headlines hidden). Click to show all.`
                : 'Signal Only: hide speculative price predictions, sponsored hype, and clickbait'
            }
          >
            <Crosshair className={`w-3 h-3 ${signalOnly ? 'text-emerald-400' : ''}`} />
            <span>SIGNAL</span>
            {signalOnly && hiddenFluffCount > 0 && (
              <span className="text-[9.5px] font-mono px-1 py-0.5 rounded-full leading-none bg-emerald-500/20 text-emerald-300">
                -{hiddenFluffCount}
              </span>
            )}
          </button>

          {/* 60-Second Brief Toggle Pill */}
          <button
            onClick={onToggleBrief}
            className={`fp shrink-0 !py-1 !px-2 !text-[10.5px] cursor-pointer ${
              showBrief
                ? mode === 'world'
                  ? 'border-blue-500/50 bg-blue-500/10 text-blue-400'
                  : 'border-amber-500/50 bg-amber-500/10 text-amber-400'
                : ''
            }`}
            title="Toggle 60-Second Executive Brief"
          >
            <Zap className="w-3 h-3" />
            <span>BRIEF</span>
            {showBrief ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Compact Cards vs Wire Switcher */}
        <div className="inline-flex items-center rounded-lg border border-[var(--border)] p-0.5 bg-black/10 dark:bg-white/5 shrink-0">
          <button
            type="button"
            onClick={() => viewMode !== 'grid' && onToggleViewMode()}
            className={`px-1.5 py-1 rounded text-[10px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-[var(--accent)] text-white shadow-sm'
                : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
            }`}
            title="Switch to Card Grid View"
          >
            <LayoutGrid className="w-3 h-3" />
            <span>CARDS</span>
          </button>
          <button
            type="button"
            onClick={() => viewMode !== 'wire' && onToggleViewMode()}
            className={`px-1.5 py-1 rounded text-[10px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer ${
              viewMode === 'wire'
                ? 'bg-[var(--accent)] text-white shadow-sm'
                : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
            }`}
            title="Switch to High-Density Terminal Wire Stream"
          >
            <List className="w-3 h-3" />
            <span>WIRE</span>
          </button>
        </div>
      </div>
    </div>
  );
}
