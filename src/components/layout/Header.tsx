import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Sun, Moon, RefreshCw, Menu, ExternalLink, Gauge, X, 
  Clock, Download, Calendar, SlidersHorizontal, Bell, BellRing
} from 'lucide-react';
import { AppMode, FearGreedData } from '../../types';
import { OTHER_SITES } from '../../config/feeds';

interface HeaderProps {
  mode: AppMode;
  query: string;
  loading: boolean;
  isDark: boolean;
  isInstalled: boolean;
  notificationsEnabled: boolean;
  fearGreed: FearGreedData | null;
  onSetQuery: (q: string) => void;
  onSetFilter: (f: string) => void;
  onModeSwitch: (m: AppMode) => void;
  onToggleDark: () => void;
  onManualRefresh: () => void;
  onInstallClick: () => void;
  onOpenFearGreed: () => void;
  onOpenDoomsday: () => void;
  onOpenCatalysts: () => void;
  onOpenDashboard: () => void;
  onOpenNotifications: () => void;
}

export function Header({
  mode,
  query,
  loading,
  isDark,
  isInstalled,
  notificationsEnabled,
  fearGreed,
  onSetQuery,
  onSetFilter,
  onModeSwitch,
  onToggleDark,
  onManualRefresh,
  onInstallClick,
  onOpenFearGreed,
  onOpenDoomsday,
  onOpenCatalysts,
  onOpenDashboard,
  onOpenNotifications,
}: HeaderProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header 
      id="hdr" 
      className="relative z-30 border-b border-[var(--border)]/60 bg-[var(--surface-solid)]"
    >
      <div className="max-w-[1440px] mx-auto px-2.5 py-2 sm:px-4 sm:py-2.5">
        {/* Mobile & Tablet Layout (< lg) */}
        <div className="flex flex-col gap-2 lg:hidden">
          {/* Mobile Row 1: Brand & Actions */}
          <div className="relative z-30 flex items-center justify-between gap-1 w-full">
            <div 
              className="flex items-center gap-1.5 cursor-pointer shrink-0" 
              onClick={() => { onSetFilter('all'); onSetQuery(''); }}
            >
              <div className="relative group shrink-0">
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-red-600 to-blue-600 blur-sm opacity-50" />
                <img 
                  src="/favicon.svg" 
                  alt="Hatty's News Logo" 
                  className="relative w-6 h-6 sm:w-7 sm:h-7 rounded-lg border border-white/20 shadow-md" 
                />
              </div>
              <span className="logo text-lg sm:text-xl font-display tracking-tight whitespace-nowrap">HATTY'S NEWS</span>
            </div>

            {/* Mobile Action Buttons */}
            <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
              {!isInstalled && (
                <button 
                  onClick={onInstallClick}
                  className="ibtn w-7 h-7 sm:w-8 sm:h-8 p-0 flex items-center justify-center font-mono text-xs text-[var(--accent)] bg-[var(--surface-solid)] border border-[var(--border)] cursor-pointer" 
                  title="Install App"
                >
                  <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
              )}

              {mode === 'crypto' ? (
                <button 
                  className="ibtn w-7 h-7 sm:w-8 sm:h-8 p-0 flex items-center justify-center font-mono text-xs shrink-0 cursor-pointer" 
                  onClick={onOpenFearGreed}
                  title="Fear & Greed Index"
                >
                  <Gauge className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[var(--accent)]" />
                </button>
              ) : (
                <button 
                  className="ibtn w-7 h-7 sm:w-8 sm:h-8 p-0 flex items-center justify-center font-mono text-xs shrink-0 bg-red-500/10 text-red-500 border border-red-500/30 shadow-[0_0_8px_rgba(239,68,68,0.25)] cursor-pointer" 
                  onClick={onOpenDoomsday}
                  title="Doomsday Clock: 90 Seconds to Midnight"
                >
                  <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-500 animate-pulse" />
                </button>
              )}

              <button
                className="ibtn w-7 h-7 sm:w-8 sm:h-8 p-0 flex items-center justify-center shrink-0 cursor-pointer"
                onClick={onOpenCatalysts}
                title="Economic & Crypto Catalyst Calendar"
              >
                <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
              </button>

              <button
                className="ibtn w-7 h-7 sm:w-8 sm:h-8 p-0 flex items-center justify-center shrink-0 cursor-pointer"
                onClick={onOpenDashboard}
                title="Personalized Feed Dashboard & Settings"
              >
                <SlidersHorizontal className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[var(--accent)]" />
              </button>

              <button
                className={`ibtn w-7 h-7 sm:w-8 sm:h-8 p-0 flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                  notificationsEnabled
                    ? 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                    : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
                }`}
                onClick={onOpenNotifications}
                title={notificationsEnabled ? "Breaking News Alerts: Active" : "Enable Breaking News Notifications"}
              >
                {notificationsEnabled ? (
                  <BellRing className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-500 dark:text-emerald-400 animate-bounce" />
                ) : (
                  <Bell className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                )}
              </button>

              <button 
                className="ibtn w-7 h-7 sm:w-8 sm:h-8 p-0 flex items-center justify-center shrink-0 cursor-pointer" 
                onClick={onToggleDark}
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDark ? <Sun className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <Moon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
              </button>

              <button 
                className="ibtn w-7 h-7 sm:w-8 sm:h-8 p-0 flex items-center justify-center shrink-0 cursor-pointer" 
                onClick={onManualRefresh}
                title={`Refresh All ${mode === 'world' ? 'World' : 'Crypto'} Feeds Now`}
              >
                <RefreshCw className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${loading ? 'animate-spin text-[var(--accent)]' : ''}`} />
              </button>
              
              <div className="relative">
                <button 
                  className="ibtn w-7 h-7 sm:w-8 sm:h-8 p-0 flex items-center justify-center shrink-0 cursor-pointer" 
                  onClick={() => setShowMenu(!showMenu)}
                  title="Hatty's Ecosystem"
                >
                  <Menu className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
                <AnimatePresence>
                  {showMenu && (
                    <>
                      <div className="fixed inset-0 z-[90]" onClick={() => setShowMenu(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-64 bg-[var(--surface-solid)] border border-[var(--border)] rounded-xl shadow-2xl z-[100] overflow-hidden text-[var(--ink)]"
                      >
                        <div className="p-3 text-[10px] font-mono text-[var(--ink-muted)] uppercase border-b border-[var(--border)] bg-[var(--bg)] flex items-center justify-between">
                          <span>Hatty's Network</span>
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        </div>

                        <div className="p-2 border-b border-[var(--border)] bg-black/5 dark:bg-white/5 space-y-1.5">
                          <button
                            onClick={() => {
                              setShowMenu(false);
                              onOpenDashboard();
                            }}
                            className="w-full flex items-center justify-between px-3 py-2 text-xs font-mono font-bold text-[var(--ink)] bg-[var(--surface-solid)] border border-[var(--border)] rounded-lg hover:border-[var(--accent)] transition-colors cursor-pointer"
                          >
                            <span className="flex items-center gap-2">
                              <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--accent)]" />
                              <span>CUSTOMIZE FEED</span>
                            </span>
                            <span className="text-[10px] text-[var(--ink-muted)]">SETTINGS</span>
                          </button>

                          <button
                            onClick={() => {
                              setShowMenu(false);
                              onInstallClick();
                            }}
                            className="w-full flex items-center justify-between px-3 py-2 text-xs font-mono font-bold text-white bg-gradient-to-r from-red-600 via-purple-600 to-blue-600 rounded-lg shadow-md hover:opacity-95 transition-opacity cursor-pointer"
                          >
                            <span className="flex items-center gap-2">
                              <Download className="w-3.5 h-3.5" />
                              <span>{isInstalled ? 'APP INSTALLED ✓' : 'INSTALL APP'}</span>
                            </span>
                            <span className="text-[10px] opacity-80">{isInstalled ? 'READY' : 'FREE'}</span>
                          </button>
                        </div>

                        <div className="py-1">
                          {OTHER_SITES.map((site) => (
                            <a
                              key={site.url}
                              href={site.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between px-4 py-2.5 text-xs text-[var(--ink)] hover:bg-[var(--accent)] hover:text-white transition-colors group"
                              onClick={() => setShowMenu(false)}
                            >
                              <span className="font-medium">{site.name}</span>
                              <ExternalLink className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
                            </a>
                          ))}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Row 2: Mode Switcher & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
            <div className="flex items-center p-1 bg-[var(--bg2)] border border-[var(--border)] rounded-xl shadow-sm sm:w-auto shrink-0">
              <button
                onClick={() => onModeSwitch('crypto')}
                className={`flex-1 sm:flex-initial sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                  mode === 'crypto'
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]'
                    : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
                }`}
              >
                <span>⚡</span>
                <span>CRYPTO</span>
              </button>
              <button
                onClick={() => onModeSwitch('world')}
                className={`flex-1 sm:flex-initial sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                  mode === 'world'
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]'
                    : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
                }`}
              >
                <span>🌐</span>
                <span>WORLD NEWS</span>
              </button>
            </div>

            {/* Search Bar */}
            <div className="flex-1 w-full relative">
              <input
                type="text"
                placeholder={mode === 'world' ? "Search Reuters, AP, BBC, DW wire..." : "Search Blockchain, Assets, Feeds..."}
                className="w-full bg-[var(--surface-solid)] border border-[var(--border)] focus:border-[var(--accent)] text-[var(--ink)] text-xs rounded-xl py-1.5 pl-8 pr-7 outline-none font-sans placeholder:text-[var(--ink-muted)] transition-all"
                value={query}
                onChange={(e) => onSetQuery(e.target.value)}
              />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--ink-muted)]" />
              {query && (
                <button 
                  onClick={() => onSetQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--ink-muted)] hover:text-[var(--ink)] cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Layout (>= lg) */}
        <div className="hidden lg:flex items-center gap-1.5 lg:gap-2 xl:gap-3 w-full">
          {/* Logo with Mode Badge */}
          <div 
            className="flex items-center gap-1.5 lg:gap-2 cursor-pointer shrink-0" 
            onClick={() => { onSetFilter('all'); onSetQuery(''); }}
          >
            <div className="relative group shrink-0">
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-red-600 to-blue-600 blur-sm opacity-50 group-hover:opacity-100 transition-opacity" />
              <img 
                src="/favicon.svg" 
                alt="Hatty's News Logo" 
                className="relative w-7 h-7 rounded-lg border border-white/20 shadow-md group-hover:scale-105 transition-transform" 
              />
            </div>
            <span className="logo text-lg lg:text-xl font-display tracking-tight shrink-0 whitespace-nowrap">HATTY'S NEWS</span>
            <span className={`hidden 2xl:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border transition-colors ${
              mode === 'world' 
                ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' 
                : 'bg-red-500/10 text-red-500 border-red-500/20'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${mode === 'world' ? 'bg-blue-400' : 'bg-red-500'}`} />
              {mode === 'world' ? 'WORLD WIRE' : 'CRYPTO'}
            </span>
          </div>

          {/* Mode Switcher Buttons */}
          <div className="flex items-center p-0.5 bg-[var(--bg2)] border border-[var(--border)] rounded-full shrink-0">
            <button
              onClick={() => onModeSwitch('crypto')}
              className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1 transition-all duration-200 cursor-pointer ${
                mode === 'crypto'
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-[0_0_12px_rgba(220,38,38,0.4)] scale-100'
                  : 'text-[var(--ink-muted)] hover:text-[var(--ink)] scale-95'
              }`}
            >
              <span>⚡</span>
              <span>CRYPTO</span>
            </button>
            <button
              onClick={() => onModeSwitch('world')}
              className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1 transition-all duration-200 cursor-pointer ${
                mode === 'world'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.4)] scale-100'
                  : 'text-[var(--ink-muted)] hover:text-[var(--ink)] scale-95'
              }`}
            >
              <span>🌐</span>
              <span>WORLD<span className="hidden 2xl:inline"> NEWS</span></span>
            </button>
          </div>

          {/* Search Box */}
          <div className="flex-1 min-w-[90px] max-w-[150px] xl:max-w-[190px] 2xl:max-w-[260px] relative">
            <input
              type="text"
              placeholder={mode === 'world' ? "Search world..." : "Search crypto..."}
              className="w-full bg-[var(--surface-solid)] border border-[var(--border)] focus:border-[var(--accent)] text-[var(--ink)] text-xs rounded-xl py-1.5 pl-8 pr-7 outline-none font-sans placeholder:text-[var(--ink-muted)] transition-all"
              value={query}
              onChange={(e) => onSetQuery(e.target.value)}
            />
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--ink-muted)]" />
            {query && (
              <button 
                onClick={() => onSetQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--ink-muted)] hover:text-[var(--ink)] cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Desktop Action Buttons */}
          <div className="flex items-center gap-1 lg:gap-1.5 shrink-0 ml-auto">
            {!isInstalled && (
              <button 
                onClick={onInstallClick}
                className="ibtn w-8 h-8 p-0 2xl:w-auto 2xl:px-2.5 2xl:py-1 flex items-center justify-center gap-1 font-mono text-[11px] text-[var(--ink)] bg-gradient-to-r from-red-600/15 via-purple-600/15 to-blue-600/15 hover:from-red-600/30 hover:to-blue-600/30 border border-[var(--border)] shadow-sm shrink-0 cursor-pointer" 
                title="Install Hatty's News App"
              >
                <Download className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                <span className="hidden 2xl:inline font-bold">INSTALL</span>
              </button>
            )}

            {mode === 'crypto' ? (
              <button 
                className="ibtn w-auto px-2 py-1 flex items-center gap-1 font-mono text-[11px] shrink-0 cursor-pointer" 
                onClick={onOpenFearGreed}
                title="Fear & Greed Index"
              >
                <Gauge className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                {fearGreed && (
                  <span className="font-bold text-[11px]" style={{ 
                    color: parseInt(fearGreed.value) > 50 ? '#22c55e' : '#ef4444' 
                  }}>
                    {fearGreed.value}
                    <span className="hidden 2xl:inline ml-1 font-normal text-[10px] opacity-80">
                      {fearGreed.value_classification.split(' ')[0]}
                    </span>
                  </span>
                )}
              </button>
            ) : (
              <button 
                className="ibtn w-auto px-2 py-1 flex items-center gap-1 font-mono text-[11px] shrink-0 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 shadow-[0_0_8px_rgba(239,68,68,0.2)] transition-all cursor-pointer" 
                onClick={onOpenDoomsday}
                title="Doomsday Clock: 90 Seconds to Midnight"
              >
                <Clock className="w-3.5 h-3.5 text-red-500 animate-pulse shrink-0" />
                <span className="font-bold tracking-tight text-[11px] text-red-500">
                  90s<span className="hidden 2xl:inline ml-1 font-normal text-[10px]">MIDNIGHT</span>
                </span>
              </button>
            )}

            <button
              className="ibtn w-8 h-8 p-0 2xl:w-auto 2xl:px-2.5 2xl:py-1 flex items-center justify-center gap-1 font-mono text-[11px] shrink-0 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-all cursor-pointer"
              onClick={onOpenCatalysts}
              title="Economic & Crypto Catalyst Calendar"
            >
              <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="hidden 2xl:inline font-bold tracking-tight">CATALYSTS</span>
            </button>

            <button
              className="ibtn w-8 h-8 p-0 2xl:w-auto 2xl:px-2.5 2xl:py-1 flex items-center justify-center gap-1 font-mono text-[11px] shrink-0 bg-[var(--surface-solid)] hover:border-[var(--accent)] transition-all cursor-pointer"
              onClick={onOpenDashboard}
              title="Personalized Feed Dashboard & Settings"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
              <span className="hidden 2xl:inline font-bold tracking-tight">CUSTOMIZE</span>
            </button>

            <button
              className={`ibtn w-8 h-8 p-0 2xl:w-auto 2xl:px-2.5 2xl:py-1 flex items-center justify-center gap-1 font-mono text-[11px] shrink-0 transition-all cursor-pointer ${
                notificationsEnabled
                  ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-500 dark:text-emerald-400 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                  : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
              }`}
              onClick={onOpenNotifications}
              title={notificationsEnabled ? "Breaking News Alerts: Active" : "Enable Breaking News Notifications"}
            >
              {notificationsEnabled ? (
                <BellRing className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 animate-bounce shrink-0" />
              ) : (
                <Bell className="w-3.5 h-3.5 shrink-0" />
              )}
              <span className="hidden 2xl:inline font-bold tracking-tight">
                {notificationsEnabled ? 'ALERTS ON' : 'ALERTS'}
              </span>
            </button>

            <button 
              className="ibtn w-8 h-8 p-0 flex items-center justify-center shrink-0 cursor-pointer" 
              onClick={onToggleDark}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            <button 
              className="ibtn w-8 h-8 p-0 flex items-center justify-center shrink-0 cursor-pointer" 
              onClick={onManualRefresh}
              title={`Refresh All ${mode === 'world' ? 'World' : 'Crypto'} Feeds Now`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[var(--accent)]' : ''}`} />
            </button>
            
            <div className="relative">
              <button 
                className="ibtn w-8 h-8 p-0 flex items-center justify-center shrink-0 cursor-pointer" 
                onClick={() => setShowMenu(!showMenu)}
                title="Hatty's Ecosystem"
              >
                <Menu className="w-3.5 h-3.5" />
              </button>
              <AnimatePresence>
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-[90]" onClick={() => setShowMenu(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-64 bg-[var(--surface-solid)] border border-[var(--border)] rounded-xl shadow-2xl z-[100] overflow-hidden text-[var(--ink)]"
                    >
                      <div className="p-3 text-[10px] font-mono text-[var(--ink-muted)] uppercase border-b border-[var(--border)] bg-[var(--bg)] flex items-center justify-between">
                        <span>Hatty's Network</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      </div>

                      <div className="p-2 border-b border-[var(--border)] bg-black/5 dark:bg-white/5 space-y-1.5">
                        <button
                          onClick={() => {
                            setShowMenu(false);
                            onOpenDashboard();
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 text-xs font-mono font-bold text-[var(--ink)] bg-[var(--surface-solid)] border border-[var(--border)] rounded-lg hover:border-[var(--accent)] transition-colors cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--accent)]" />
                            <span>CUSTOMIZE FEED</span>
                          </span>
                          <span className="text-[10px] text-[var(--ink-muted)]">SETTINGS</span>
                        </button>

                        <button
                          onClick={() => {
                            setShowMenu(false);
                            onInstallClick();
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 text-xs font-mono font-bold text-white bg-gradient-to-r from-red-600 via-purple-600 to-blue-600 rounded-lg shadow-md hover:opacity-95 transition-opacity cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            <Download className="w-3.5 h-3.5" />
                            <span>{isInstalled ? 'APP INSTALLED ✓' : 'INSTALL APP'}</span>
                          </span>
                          <span className="text-[10px] opacity-80">{isInstalled ? 'READY' : 'FREE'}</span>
                        </button>
                      </div>

                      <div className="py-1">
                        {OTHER_SITES.map((site) => (
                          <a
                            key={site.url}
                            href={site.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between px-4 py-2.5 text-xs text-[var(--ink)] hover:bg-[var(--accent)] hover:text-white transition-colors group"
                            onClick={() => setShowMenu(false)}
                          >
                            <span className="font-medium">{site.name}</span>
                            <ExternalLink className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
                          </a>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
