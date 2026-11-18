import React, { useState, useRef, useEffect } from 'react';
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
  Globe,
  Eye,
  Check,
  Layers,
  X,
} from 'lucide-react';
import { CategoryConfig, AppMode, Article, ViewLayoutMode, WorldRegionId } from '../../types';
import { WORLD_REGIONS } from '../../config/feeds';

interface FilterTabsProps {
  categories: CategoryConfig[];
  categoryCounts: Record<string, number>;
  activeFilter: string;
  activeRegion?: WorldRegionId;
  regionCounts?: Record<string, number>;
  radarMatchCount: number;
  radarTermsCount: number;
  savedArticles: Article[];
  showBrief: boolean;
  signalOnly: boolean;
  hiddenFluffCount: number;
  mode: AppMode;
  viewMode: ViewLayoutMode;
  onSetFilter: (filterId: string) => void;
  onSetRegion?: (regionId: WorldRegionId) => void;
  onToggleBrief: () => void;
  onToggleViewMode: () => void;
  onToggleSignalOnly: () => void;
  onPlaySavedQueue?: () => void;
}

export function FilterTabs({
  categories,
  categoryCounts,
  activeFilter,
  activeRegion = 'all',
  regionCounts = {},
  radarMatchCount,
  radarTermsCount,
  savedArticles,
  showBrief,
  signalOnly,
  hiddenFluffCount,
  mode,
  viewMode,
  onSetFilter,
  onSetRegion,
  onToggleBrief,
  onToggleViewMode,
  onToggleSignalOnly,
  onPlaySavedQueue,
}: FilterTabsProps) {
  const [openMenu, setOpenMenu] = useState<'topic' | 'region' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown menus when clicking outside or pressing Escape
  useEffect(() => {
    if (!openMenu) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [openMenu]);

  // Close menus when switching Crypto <-> World mode
  useEffect(() => {
    setOpenMenu(null);
  }, [mode]);

  const activeCategoryObj =
    categories.find((c) => c.id === activeFilter) || categories[0] || { id: 'all', label: 'ALL', icon: '⚡', badgeClass: '' };
  const isTopicFiltered =
    activeFilter !== 'all' && activeFilter !== 'radar' && activeFilter !== 'saved' && activeFilter !== 'new';
  const activeTopicCount = categoryCounts[activeCategoryObj.id] ?? categoryCounts.all ?? 0;

  const activeRegionObj =
    WORLD_REGIONS.find((r) => r.id === activeRegion) || WORLD_REGIONS[0];
  const isRegionFiltered = mode === 'world' && activeRegion !== 'all';
  const isBlindspotActive = mode === 'world' && activeRegion === 'blindspot';
  const activeRegionCount = regionCounts[activeRegionObj.id] ?? regionCounts.all ?? 0;

  return (
    <div
      ref={containerRef}
      className="mb-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-2 relative z-40"
    >
      {/* Left Cluster: Sleek Topic Dropdown + (World Mode) Region Desk Dropdown + Quick Watchlist/Saved Pills */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* 1. TOPIC / CATEGORY DROPDOWN (Crypto & World News) */}
        <div className="relative">
          <button
            id="topic-filter-dropdown"
            type="button"
            onClick={() => setOpenMenu((prev) => (prev === 'topic' ? null : 'topic'))}
            aria-expanded={openMenu === 'topic'}
            aria-haspopup="listbox"
            className={`fp !py-1.5 !px-2.5 !text-[11px] flex items-center gap-1.5 cursor-pointer transition-all ${
              isTopicFiltered
                ? 'on shadow-sm'
                : openMenu === 'topic'
                  ? 'border-[var(--accent)] text-[var(--ink)] bg-[var(--surface-solid)]'
                  : 'bg-[var(--surface-solid)] hover:border-[var(--accent)]/50'
            }`}
            title="Select News Topic / Category"
          >
            <Layers className="w-3.5 h-3.5 opacity-75 shrink-0" />
            <span className="text-[9.5px] font-mono uppercase tracking-wider opacity-70 hidden sm:inline">
              TOPIC:
            </span>
            <span>{activeCategoryObj.icon}</span>
            <span className="font-bold tracking-wide truncate max-w-[115px] sm:max-w-none">
              {activeCategoryObj.label}
            </span>
            <span
              className={`text-[9.5px] font-mono px-1.5 py-0.5 rounded-full leading-none ${
                isTopicFiltered
                  ? 'bg-white/20 text-white'
                  : 'bg-black/10 dark:bg-white/10 text-[var(--ink-muted)]'
              }`}
            >
              {activeTopicCount}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-150 shrink-0 ${
                openMenu === 'topic' ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Topic Dropdown Menu Popover */}
          {openMenu === 'topic' && (
            <div
              role="listbox"
              aria-label="Topic Categories"
              className="absolute left-0 mt-1.5 w-60 rounded-xl border border-[var(--border)] bg-[var(--surface-solid)] shadow-2xl py-1.5 z-70 backdrop-blur-xl"
            >
              <div className="px-3 py-1 border-b border-[var(--border)]/60 flex items-center justify-between text-[9.5px] font-mono font-bold text-[var(--ink-muted)] uppercase tracking-wider">
                <span>{mode === 'world' ? 'GLOBAL WIRE TOPICS' : 'CRYPTO WIRE TOPICS'}</span>
                <span>DISPATCHES</span>
              </div>
              <div className="py-1">
                {categories.map((cat) => {
                  const isSelected = activeFilter === cat.id;
                  const count = categoryCounts[cat.id] ?? 0;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        onSetFilter(cat.id);
                        setOpenMenu(null);
                      }}
                      className={`w-full px-3 py-1.5 text-left font-mono text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                        isSelected
                          ? mode === 'world'
                            ? 'bg-blue-500/15 text-blue-400 font-bold'
                            : 'bg-red-500/15 text-red-400 font-bold'
                          : 'text-[var(--ink)] hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="text-sm shrink-0">{cat.icon}</span>
                        <span className="truncate">{cat.label}</span>
                      </span>
                      <span className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full leading-none ${
                            isSelected
                              ? mode === 'world'
                                ? 'bg-blue-500/25 text-blue-300'
                                : 'bg-red-500/25 text-red-300'
                              : 'bg-black/10 dark:bg-white/10 text-[var(--ink-muted)]'
                          }`}
                        >
                          {count}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 2. REGION DESK DROPDOWN (World News Mode Only) */}
        {mode === 'world' && onSetRegion && (
          <div className="relative">
            <button
              id="region-filter-dropdown"
              type="button"
              onClick={() => setOpenMenu((prev) => (prev === 'region' ? null : 'region'))}
              aria-expanded={openMenu === 'region'}
              aria-haspopup="listbox"
              className={`fp !py-1.5 !px-2.5 !text-[11px] flex items-center gap-1.5 cursor-pointer transition-all ${
                isBlindspotActive
                  ? '!bg-amber-500 !text-black !border-amber-400 font-black shadow-sm'
                  : isRegionFiltered
                    ? 'on shadow-sm'
                    : openMenu === 'region'
                      ? 'border-blue-400 text-[var(--ink)] bg-[var(--surface-solid)]'
                      : 'bg-[var(--surface-solid)] hover:border-blue-500/50'
              }`}
              title="Filter World News by Geographic Region Desk or Global Blindspot"
            >
              {isBlindspotActive ? (
                <Eye className="w-3.5 h-3.5 text-black shrink-0" />
              ) : (
                <Globe className={`w-3.5 h-3.5 shrink-0 ${isRegionFiltered ? 'text-white' : 'text-blue-400'}`} />
              )}
              <span className="text-[9.5px] font-mono uppercase tracking-wider opacity-75 hidden sm:inline">
                REGION:
              </span>
              {!isBlindspotActive && <span>{activeRegionObj.icon}</span>}
              <span className="font-bold tracking-wide truncate max-w-[115px] sm:max-w-none">
                <span className="sm:hidden">{activeRegionObj.shortLabel}</span>
                <span className="hidden sm:inline">{activeRegionObj.label}</span>
              </span>
              <span
                className={`text-[9.5px] font-mono px-1.5 py-0.5 rounded-full leading-none ${
                  isBlindspotActive
                    ? 'bg-black/20 text-black font-black'
                    : isRegionFiltered
                      ? 'bg-white/20 text-white'
                      : 'bg-black/10 dark:bg-white/10 text-[var(--ink-muted)]'
                }`}
              >
                {activeRegionCount}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-150 shrink-0 ${
                  openMenu === 'region' ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Region Desk Dropdown Menu Popover */}
            {openMenu === 'region' && (
              <div
                role="listbox"
                aria-label="World Region Desk"
                className="absolute right-0 sm:left-0 sm:right-auto mt-1.5 w-64 max-w-[calc(100vw-24px)] rounded-xl border border-[var(--border)] bg-[var(--surface-solid)] shadow-2xl py-1.5 z-70 backdrop-blur-xl"
              >
                <div className="px-3 py-1 border-b border-[var(--border)]/60 flex items-center justify-between text-[9.5px] font-mono font-bold text-blue-400 uppercase tracking-wider">
                  <span>🌍 GLOBAL REGION DESK</span>
                  <span>STORIES</span>
                </div>
                <div className="py-1">
                  {WORLD_REGIONS.map((reg) => {
                    const isSelected = activeRegion === reg.id;
                    const isBlindspot = reg.id === 'blindspot';
                    const count = regionCounts[reg.id] ?? 0;

                    return (
                      <React.Fragment key={reg.id}>
                        {isBlindspot && (
                          <div className="my-1 border-t border-[var(--border)]/60" />
                        )}
                        <button
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => {
                            onSetRegion(reg.id);
                            setOpenMenu(null);
                          }}
                          className={`w-full px-3 py-1.5 text-left font-mono text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                            isSelected
                              ? isBlindspot
                                ? 'bg-amber-500/20 text-amber-400 font-bold'
                                : 'bg-blue-500/15 text-blue-400 font-bold'
                              : isBlindspot
                                ? 'text-amber-400 hover:bg-amber-500/10'
                                : 'text-[var(--ink)] hover:bg-black/5 dark:hover:bg-white/5'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              {isBlindspot ? (
                                <Eye className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              ) : (
                                <span className="text-sm shrink-0">{reg.icon}</span>
                              )}
                              <span className="truncate font-bold">{reg.label}</span>
                            </div>
                            {isBlindspot && (
                              <p className="text-[9.5px] text-[var(--ink-muted)] font-sans mt-0.5 pl-5 leading-tight">
                                International stories with zero US domestic media coverage
                              </p>
                            )}
                          </div>
                          <span className="flex items-center gap-1.5 shrink-0">
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-full leading-none ${
                                isSelected
                                  ? isBlindspot
                                    ? 'bg-amber-500/30 text-amber-300 font-bold'
                                    : 'bg-blue-500/25 text-blue-300'
                                  : isBlindspot
                                    ? 'bg-amber-500/15 text-amber-400'
                                    : 'bg-black/10 dark:bg-white/10 text-[var(--ink-muted)]'
                              }`}
                            >
                              {count}
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                          </span>
                        </button>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. MY RADAR Custom Watchlist Pill */}
        <button
          type="button"
          className={`fp shrink-0 cursor-pointer !py-1.5 !px-2 !text-[10.5px] ${
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
          <span
            className={`text-[9.5px] font-mono px-1 py-0.5 rounded-full leading-none ${
              activeFilter === 'radar'
                ? 'bg-white/20 text-white'
                : radarTermsCount > 0
                  ? 'bg-cyan-500/15 text-cyan-500 dark:text-cyan-300'
                  : 'bg-black/5 dark:bg-white/5 text-[var(--ink-muted)]'
            }`}
          >
            {radarTermsCount > 0 ? radarMatchCount : '+'}
          </span>
        </button>

        {/* 4. SAVED / Read-Later Queue Filter Pill */}
        <button
          type="button"
          className={`fp shrink-0 cursor-pointer !py-1.5 !px-2 !text-[10.5px] ${
            activeFilter === 'saved'
              ? 'on'
              : savedArticles.length > 0
                ? 'border-amber-500/40 text-amber-400'
                : ''
          }`}
          onClick={() => onSetFilter(activeFilter === 'saved' ? 'all' : 'saved')}
          title="View your saved Read-Later queue"
        >
          <Bookmark className={`w-3 h-3 ${savedArticles.length > 0 ? 'fill-amber-400 text-amber-400' : ''}`} />
          <span>SAVED</span>
          <span
            className={`text-[9.5px] font-mono px-1 py-0.5 rounded-full leading-none ${
              activeFilter === 'saved'
                ? 'bg-white/20 text-white'
                : 'bg-black/5 dark:bg-white/5 text-[var(--ink-muted)]'
            }`}
          >
            {savedArticles.length}
          </span>
        </button>

        {/* Quick 1-Tap Reset Chip when a Topic or Region filter is active */}
        {(isTopicFiltered || isRegionFiltered) && (
          <button
            type="button"
            onClick={() => {
              onSetFilter('all');
              if (onSetRegion) onSetRegion('all');
            }}
            className="fp shrink-0 cursor-pointer !py-1.5 !px-2 !text-[10px] border-[var(--accent)]/40 text-[var(--ink-muted)] hover:text-[var(--ink)] flex items-center gap-1"
            title="Reset Topic and Region filters back to All"
          >
            <X className="w-3 h-3" />
            <span>RESET</span>
          </button>
        )}
      </div>

      {/* Right Cluster: Streamlined Utility Controls (Signal, 60s Brief, Cards/Wire Switcher) */}
      <div className="flex items-center justify-between sm:justify-end gap-1.5 shrink-0 flex-wrap">
        <div className="flex items-center gap-1.5">
          {/* Play Saved Queue Button when Saved Tab is Active */}
          {savedArticles.length > 0 && onPlaySavedQueue && activeFilter === 'saved' && (
            <button
              type="button"
              onClick={onPlaySavedQueue}
              className="fp shrink-0 !py-1.5 !px-2 !text-[10.5px] border-emerald-500/50 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500 hover:text-black flex items-center gap-1 transition-all cursor-pointer font-bold"
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
            className={`fp shrink-0 !py-1.5 !px-2 !text-[10.5px] flex items-center gap-1 transition-all cursor-pointer ${
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
            type="button"
            onClick={onToggleBrief}
            className={`fp shrink-0 !py-1.5 !px-2 !text-[10.5px] cursor-pointer ${
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
            className={`px-2 py-1 rounded text-[10px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer ${
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
            className={`px-2 py-1 rounded text-[10px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer ${
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
