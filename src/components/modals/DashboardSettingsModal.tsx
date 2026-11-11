import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, SlidersHorizontal, ArrowUp, ArrowDown, Eye, EyeOff, RotateCcw, Check } from 'lucide-react';
import { AppMode, DashboardSettings } from '../../types';
import { CRYPTO_CATEGORIES, WORLD_CATEGORIES } from '../../config/feeds';

export interface DashboardSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: AppMode;
  settings: DashboardSettings;
  onUpdateSettings: (newSettings: DashboardSettings) => void;
  categoryCounts: Record<string, number>;
}

export function DashboardSettingsModal({
  isOpen,
  onClose,
  mode,
  settings,
  onUpdateSettings,
  categoryCounts
}: DashboardSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<AppMode>(mode);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(mode);
      const originalOverflow = document.body.style.overflow;
      const originalTouchAction = document.body.style.touchAction;
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.touchAction = originalTouchAction;
      };
    }
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const isCrypto = activeTab === 'crypto';
  const baseCategories = isCrypto ? CRYPTO_CATEGORIES : WORLD_CATEGORIES;
  const orderedIds = isCrypto ? settings.cryptoCategories : settings.worldCategories;
  const hiddenSet = new Set(isCrypto ? settings.cryptoHidden : settings.worldHidden);

  const categoriesInOrder = [...baseCategories].sort((a, b) => {
    if (a.id === 'all') return -1;
    if (b.id === 'all') return 1;
    const idxA = orderedIds.indexOf(a.id);
    const idxB = orderedIds.indexOf(b.id);
    if (idxA === -1 && idxB === -1) return 0;
    if (idxA === -1) return 1;
    if (idxB === -1) return -1;
    return idxA - idxB;
  });

  const handleMove = (id: string, direction: 'up' | 'down') => {
    const currentList = [...orderedIds];
    const idx = currentList.indexOf(id);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= currentList.length) return;
    if (currentList[targetIdx] === 'all' && direction === 'up') return;

    const [moved] = currentList.splice(idx, 1);
    currentList.splice(targetIdx, 0, moved);

    if (isCrypto) {
      onUpdateSettings({ ...settings, cryptoCategories: currentList });
    } else {
      onUpdateSettings({ ...settings, worldCategories: currentList });
    }
  };

  const handleToggleVisibility = (id: string) => {
    if (id === 'all') return;
    const currentHidden = isCrypto ? [...settings.cryptoHidden] : [...settings.worldHidden];
    const exists = currentHidden.includes(id);
    const updatedHidden = exists
      ? currentHidden.filter(x => x !== id)
      : [...currentHidden, id];

    if (isCrypto) {
      onUpdateSettings({ ...settings, cryptoHidden: updatedHidden });
    } else {
      onUpdateSettings({ ...settings, worldHidden: updatedHidden });
    }
  };

  const handleResetDefaults = () => {
    onUpdateSettings({
      ...settings,
      cryptoCategories: CRYPTO_CATEGORIES.map(c => c.id),
      cryptoHidden: [],
      worldCategories: WORLD_CATEGORIES.map(c => c.id),
      worldHidden: [],
      showAssetTags: true,
      cardDensity: 'comfortable',
    });
  };

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-3 sm:p-4 overflow-hidden overscroll-none select-none">
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md cursor-pointer" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        className="relative w-full max-w-lg bg-[var(--surface-solid)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh] select-text"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="p-2 rounded-xl bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-[var(--accent)] shrink-0">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-display tracking-wide text-[var(--ink)] truncate">
                PERSONALIZED DASHBOARD
              </h2>
              <p className="text-[10px] sm:text-[11px] font-mono text-[var(--ink-muted)] truncate">
                CUSTOMIZE FEED CATEGORIES, LIVE TAGGING & DISPLAY
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Dashboard Settings"
            className="shrink-0 w-10 h-10 rounded-xl bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 active:scale-95 text-[var(--ink)] flex items-center justify-center transition-all cursor-pointer border border-[var(--border)] shadow-sm touch-manipulation z-30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto overscroll-contain space-y-5 flex-1 touch-pan-y scrollbar-thin">
          {/* Mode Tabs */}
          <div className="flex items-center p-1 bg-[var(--bg)] border border-[var(--border)] rounded-xl">
            <button
              onClick={() => setActiveTab('crypto')}
              className={`flex-1 py-1.5 sm:py-2 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'crypto'
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md'
                  : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
              }`}
            >
              <span>⚡</span>
              <span>CRYPTO CATEGORIES</span>
            </button>
            <button
              onClick={() => setActiveTab('world')}
              className={`flex-1 py-1.5 sm:py-2 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'world'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
                  : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
              }`}
            >
              <span>🌐</span>
              <span>WORLD WIRE CATEGORIES</span>
            </button>
          </div>

          {/* Section: Category Visibility & Order */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-mono font-bold text-[var(--ink)] uppercase flex items-center gap-1.5">
                <span>FEED CATEGORY PILLS & REORDER</span>
              </label>
              <span className="text-[10px] font-mono text-[var(--ink-muted)]">
                USE ARROWS TO REORDER
              </span>
            </div>

            <div className="space-y-1.5 bg-[var(--bg)] p-2 rounded-xl border border-[var(--border)] max-h-56 overflow-y-auto">
              {categoriesInOrder.map((cat, idx) => {
                const isHidden = hiddenSet.has(cat.id);
                const isAll = cat.id === 'all';
                const count = categoryCounts[cat.id] ?? 0;

                return (
                  <div
                    key={cat.id}
                    className={`flex items-center justify-between p-2 rounded-lg border text-xs font-mono transition-all ${
                      isHidden
                        ? 'opacity-50 bg-black/5 dark:bg-white/5 border-transparent'
                        : 'bg-[var(--surface-solid)] border-[var(--border)] shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{cat.icon}</span>
                      <span className="font-bold text-[var(--ink)]">{cat.label}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/10 text-[var(--ink-muted)]">
                        {count}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {!isAll && (
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => handleMove(cat.id, 'up')}
                            disabled={idx <= 1}
                            className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 text-[var(--ink-muted)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMove(cat.id, 'down')}
                            disabled={idx === categoriesInOrder.length - 1}
                            className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 text-[var(--ink-muted)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {isAll ? (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          LOCKED
                        </span>
                      ) : (
                        <button
                          onClick={() => handleToggleVisibility(cat.id)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors flex items-center gap-1 cursor-pointer ${
                            isHidden
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                          }`}
                        >
                          {isHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          <span>{isHidden ? 'HIDDEN' : 'SHOWN'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Live Asset Mention Tagging Toggle */}
          <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm">🏷️</span>
                <span className="text-xs font-mono font-bold text-[var(--ink)]">
                  LIVE ASSET MENTION TAGGING
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  LIVE
                </span>
              </div>
              <p className="text-[11px] text-[var(--ink-muted)] mt-1 leading-snug">
                Detects $BTC, $ETH, $NVDA, Gold, and Oil mentions in headlines with real-time price & 24h change chips. 1-click filters all matching articles.
              </p>
            </div>
            <button
              onClick={() => onUpdateSettings({ ...settings, showAssetTags: !settings.showAssetTags })}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold border shrink-0 transition-all cursor-pointer ${
                settings.showAssetTags
                  ? 'bg-emerald-500 text-black border-emerald-400 shadow-md shadow-emerald-500/20'
                  : 'bg-black/10 dark:bg-white/10 text-[var(--ink-muted)] border-[var(--border)]'
              }`}
            >
              {settings.showAssetTags ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>

          {/* Section: Card Density */}
          <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm">📐</span>
                <span className="text-xs font-mono font-bold text-[var(--ink)]">
                  CARD STREAM DENSITY
                </span>
              </div>
              <p className="text-[11px] text-[var(--ink-muted)] mt-1">
                Standard gives full editorial presentation; Compact provides high-density market terminal layout.
              </p>
            </div>
            <div className="flex items-center gap-1 bg-[var(--surface-solid)] p-1 rounded-lg border border-[var(--border)] shrink-0 font-mono text-[10px]">
              <button
                onClick={() => onUpdateSettings({ ...settings, cardDensity: 'comfortable' })}
                className={`px-2 py-1 rounded font-bold transition-all cursor-pointer ${
                  settings.cardDensity === 'comfortable'
                    ? 'bg-[var(--accent)] text-white shadow-sm'
                    : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
                }`}
              >
                STANDARD
              </button>
              <button
                onClick={() => onUpdateSettings({ ...settings, cardDensity: 'compact' })}
                className={`px-2 py-1 rounded font-bold transition-all cursor-pointer ${
                  settings.cardDensity === 'compact'
                    ? 'bg-[var(--accent)] text-white shadow-sm'
                    : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
                }`}
              >
                COMPACT
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3">
          <button
            onClick={handleResetDefaults}
            className="px-3 py-2 rounded-xl text-xs font-mono text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Restore all default categories and order"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RESET DEFAULTS</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-mono font-bold text-white bg-gradient-to-r from-red-600 to-blue-600 hover:opacity-95 shadow-lg flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>APPLY & CLOSE</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
