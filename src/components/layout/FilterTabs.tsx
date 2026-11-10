import React from 'react';
import { Flame, Bookmark, SlidersHorizontal, Zap, ChevronUp, ChevronDown } from 'lucide-react';
import { CategoryConfig, AppMode, Article } from '../../types';

interface FilterTabsProps {
  categories: CategoryConfig[];
  categoryCounts: Record<string, number>;
  activeFilter: string;
  newArticlesCount: number;
  savedArticles: Article[];
  showBrief: boolean;
  mode: AppMode;
  onSetFilter: (filterId: string) => void;
  onOpenDashboard: () => void;
  onToggleBrief: () => void;
}

export function FilterTabs({
  categories,
  categoryCounts,
  activeFilter,
  newArticlesCount,
  savedArticles,
  showBrief,
  mode,
  onSetFilter,
  onOpenDashboard,
  onToggleBrief,
}: FilterTabsProps) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0 sm:flex-wrap">
        {categories.map((cat) => {
          const isActive = activeFilter === cat.id;
          const count = categoryCounts[cat.id] ?? 0;

          return (
            <button
              key={cat.id}
              className={`fp shrink-0 cursor-pointer ${isActive ? 'on' : ''}`}
              onClick={() => onSetFilter(cat.id)}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                isActive ? 'bg-white/20 text-white' : 'bg-black/5 dark:bg-white/5 text-[var(--ink-muted)]'
              }`}>
                {count}
              </span>
            </button>
          );
        })}

        {/* NEW Since Last Visit Filter Pill */}
        {newArticlesCount > 0 && (
          <button
            className={`fp shrink-0 cursor-pointer ${activeFilter === 'new' ? 'on' : 'border-emerald-500/40 text-emerald-400 hover:border-emerald-400'}`}
            onClick={() => onSetFilter(activeFilter === 'new' ? 'all' : 'new')}
            title="Show stories published since your last visit"
          >
            <Flame className="w-3.5 h-3.5 text-emerald-400" />
            <span>NEW</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
              activeFilter === 'new' ? 'bg-white/20 text-white' : 'bg-emerald-500/20 text-emerald-300'
            }`}>
              {newArticlesCount}
            </span>
          </button>
        )}

        {/* SAVED / Read-Later Queue Filter Pill */}
        <button
          className={`fp shrink-0 cursor-pointer ${activeFilter === 'saved' ? 'on' : savedArticles.length > 0 ? 'border-amber-500/40 text-amber-400' : ''}`}
          onClick={() => onSetFilter(activeFilter === 'saved' ? 'all' : 'saved')}
          title="View your saved Read-Later queue"
        >
          <Bookmark className={`w-3.5 h-3.5 ${savedArticles.length > 0 ? 'fill-amber-400 text-amber-400' : ''}`} />
          <span>SAVED</span>
          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
            activeFilter === 'saved' ? 'bg-white/20 text-white' : 'bg-black/5 dark:bg-white/5 text-[var(--ink-muted)]'
          }`}>
            {savedArticles.length}
          </span>
        </button>

        {/* Dashboard Customize Categories Pill */}
        <button
          onClick={onOpenDashboard}
          className="fp shrink-0 border-dashed border-[var(--border)] hover:border-[var(--accent)] text-[var(--ink-muted)] hover:text-[var(--ink)] flex items-center gap-1.5 transition-all cursor-pointer"
          title="Personalize Feed Categories, Live Asset Tags & Density"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span>CUSTOMIZE</span>
        </button>

        {/* 60-Second Morning Brief Toggle Pill */}
        <button
          onClick={onToggleBrief}
          className={`fp shrink-0 ml-auto cursor-pointer ${
            showBrief
              ? mode === 'world'
                ? 'border-blue-500/50 bg-blue-500/10 text-blue-400'
                : 'border-amber-500/50 bg-amber-500/10 text-amber-400'
              : ''
          }`}
          title="Toggle 60-Second Executive Brief"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>60S BRIEF</span>
          {showBrief ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}
