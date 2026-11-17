import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, SkipBack, SkipForward, Square, Volume2, Gauge, BookOpen, X } from 'lucide-react';
import { Article, AppMode } from '../../types';
import { TerminalAudioPlayer } from '../../hooks/useTerminalAudioPlayer';

interface AudioMiniPlayerProps {
  player: TerminalAudioPlayer;
  mode: AppMode;
  onOpenArticle: (article: Article) => void;
}

export function AudioMiniPlayer({ player, mode, onOpenArticle }: AudioMiniPlayerProps) {
  const {
    tracks,
    activeIndex,
    activeTrack,
    sourceLabel,
    isActive,
    isPaused,
    playbackRate,
    togglePlayPause,
    skipNext,
    skipPrev,
    stop,
    cycleRate,
  } = player;

  return (
    <AnimatePresence>
      {isActive && activeTrack && activeIndex !== null && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.97 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-[calc(58px+env(safe-area-inset-bottom,0px))] left-2.5 right-2.5 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-full sm:max-w-2xl z-[95]"
        >
          <div className={`rounded-2xl border px-3 sm:px-4 py-2.5 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-2.5 sm:gap-3 ${
            mode === 'world'
              ? 'bg-[var(--surface-solid)]/95 border-blue-500/45 shadow-blue-950/30'
              : 'bg-[var(--surface-solid)]/95 border-emerald-500/45 shadow-black/50'
          }`}>
            {/* Left Live Equalizer + Current Track */}
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl border flex items-center justify-center shrink-0 ${
                isPaused
                  ? 'bg-black/15 dark:bg-white/10 border-[var(--border)] text-[var(--ink-muted)]'
                  : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
              }`}>
                <Volume2 className={`w-4 h-4 ${!isPaused ? 'animate-pulse' : ''}`} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-mono font-black uppercase tracking-wider">
                  <span className="text-emerald-400 truncate">{sourceLabel}</span>
                  <span className="text-[var(--ink-muted)] shrink-0">
                    • {activeIndex + 1}/{tracks.length}
                  </span>
                  <span className="hidden xs:inline text-[var(--ink-muted)] truncate">
                    • {activeTrack.src}
                  </span>
                </div>

                {activeTrack.article ? (
                  <button
                    type="button"
                    onClick={() => activeTrack.article && onOpenArticle(activeTrack.article)}
                    className="text-left font-sans font-bold text-xs sm:text-[13px] text-[var(--ink)] hover:text-[var(--accent)] transition-colors truncate block w-full cursor-pointer"
                    title="Open currently playing dispatch in Reader"
                  >
                    {activeTrack.title}
                  </button>
                ) : (
                  <p className="font-sans font-bold text-xs sm:text-[13px] text-[var(--ink)] truncate">
                    {activeTrack.title}
                  </p>
                )}
              </div>
            </div>

            {/* Right Playback Controls */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {tracks.length > 1 && (
                <button
                  type="button"
                  onClick={skipPrev}
                  disabled={activeIndex <= 0}
                  className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--ink)] hover:border-[var(--accent)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="Previous Story"
                  aria-label="Previous Story"
                >
                  <SkipBack className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={togglePlayPause}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-mono text-[10px] font-black flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                title={isPaused ? 'Resume Playback' : 'Pause Playback'}
                aria-label={isPaused ? 'Resume Playback' : 'Pause Playback'}
              >
                {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
                <span className="hidden sm:inline">{isPaused ? 'PLAY' : 'PAUSE'}</span>
              </button>

              {tracks.length > 1 && (
                <button
                  type="button"
                  onClick={skipNext}
                  className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--ink)] hover:border-[var(--accent)] transition-colors cursor-pointer"
                  title="Skip to Next Story"
                  aria-label="Skip to Next Story"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={cycleRate}
                className="hidden xs:inline-flex px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--ink)] hover:border-emerald-500/40 font-mono text-[10px] font-bold items-center gap-1 transition-colors cursor-pointer"
                title="Cycle Speed"
              >
                <Gauge className="w-3 h-3 text-emerald-400" />
                <span>{playbackRate.toFixed(playbackRate === 1 || playbackRate === 0.9 || playbackRate === 1.3 ? 1 : 2)}x</span>
              </button>

              {activeTrack.article && (
                <button
                  type="button"
                  onClick={() => activeTrack.article && onOpenArticle(activeTrack.article)}
                  className="hidden sm:inline-flex p-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--ink-muted)] hover:text-[var(--ink)] hover:border-[var(--accent)] transition-colors cursor-pointer"
                  title="Open Article in Reader Drawer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={stop}
                className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--ink-muted)] hover:text-rose-400 hover:border-rose-500/40 transition-colors cursor-pointer"
                title="Stop & Close Audio Player"
                aria-label="Stop Audio Player"
              >
                <span className="sr-only">Stop</span>
                <X className="w-3.5 h-3.5 sm:hidden" />
                <Square className="w-3 h-3 fill-current hidden sm:inline" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
