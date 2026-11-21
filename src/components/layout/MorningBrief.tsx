import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Zap,
  Bookmark,
  Volume2,
  Pause,
  Play,
  Square,
  Gauge,
  BookOpen,
  Target,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Article, AppMode } from '../../types';
import { formatTimeAgo } from '../../utils/formatters';
import { getBrokeFirstInfo } from '../../utils/clustering';
import { AudioTrack, TerminalAudioPlayer } from '../../hooks/useTerminalAudioPlayer';
import { DailyCallStats } from '../../utils/dailyCall';

interface MorningBriefProps {
  showBrief: boolean;
  morningBriefStories: { article: Article; related: Article[] }[];
  mode: AppMode;
  isDark: boolean;
  filter: string;
  query: string;
  savedIds: Set<string>;
  audioPlayer: TerminalAudioPlayer;
  dailyCallStats: DailyCallStats;
  callAssetQuote: { price: number; change24h: number; formatted: string } | undefined;
  isCallAssetLive: boolean;
  onSubmitDailyCall: (direction: 'up' | 'down') => void;
  onToggleBrief: () => void;
  onToggleSave: (article: Article) => void;
  onOpenPerspective: (article: Article, related: Article[]) => void;
  onOpenArticle: (article: Article) => void;
}

export function MorningBrief({
  showBrief,
  morningBriefStories,
  mode,
  isDark,
  filter,
  query,
  savedIds,
  audioPlayer,
  dailyCallStats,
  callAssetQuote,
  isCallAssetLive,
  onSubmitDailyCall,
  onToggleBrief,
  onToggleSave,
  onOpenPerspective,
  onOpenArticle,
}: MorningBriefProps) {
  const briefQueueLabel = `60S ${mode === 'world' ? 'GLOBAL' : 'CRYPTO'} BRIEF`;
  const isPlayingBrief = audioPlayer.isActive && audioPlayer.sourceLabel === briefQueueLabel;
  const activeBriefTrackId = isPlayingBrief ? audioPlayer.activeTrack?.id : null;

  const buildBriefTracks = (): AudioTrack[] => {
    const total = morningBriefStories.length;
    return morningBriefStories.map((item, idx) => {
      const cleanTitle = item.article.title.replace(/[\n\r]+/g, ' ').trim();
      const sourceName = item.article.src;
      let spokenText = '';
      if (idx === 0) {
        spokenText = `Welcome to Hatty's News sixty-second ${mode === 'world' ? 'world' : 'crypto'} brief. Here are today's top stories. First, ${cleanTitle}. Reported by ${sourceName}.`;
      } else if (idx === total - 1) {
        spokenText = `And finally... ${cleanTitle}. Covered by ${sourceName}. That concludes your sixty-second brief.`;
      } else {
        const transitions = [
          `Next story... ${cleanTitle}. From ${sourceName}.`,
          `Also developing... ${cleanTitle}. According to ${sourceName}.`,
          `In other news... ${cleanTitle}. Reported by ${sourceName}.`,
        ];
        spokenText = transitions[(idx - 1) % transitions.length];
      }

      return {
        id: item.article.id,
        title: cleanTitle,
        src: sourceName,
        spokenText,
        article: item.article,
      };
    });
  };

  const handleTogglePlayBrief = () => {
    if (isPlayingBrief) {
      audioPlayer.togglePlayPause();
      return;
    }
    const tracks = buildBriefTracks();
    if (tracks.length > 0) {
      audioPlayer.playQueue(tracks, 0, briefQueueLabel);
    }
  };

  const callSymbol = mode === 'world' ? 'SPY' : 'BTC';
  const callDisplayName = mode === 'world' ? 'S&P 500 (SPY)' : 'Bitcoin (BTC)';
  const { todayCall, lastResolvedCall, wins, losses, totalResolved, winRatePct } = dailyCallStats;

  const unrealizedPct =
    todayCall && callAssetQuote?.price
      ? ((callAssetQuote.price - todayCall.entryPrice) / todayCall.entryPrice) * 100
      : null;

  const callOnTrack =
    todayCall && unrealizedPct !== null
      ? (todayCall.direction === 'up' && unrealizedPct > 0) ||
        (todayCall.direction === 'down' && unrealizedPct < 0)
      : null;

  return (
    <AnimatePresence initial={false}>
      {showBrief && morningBriefStories.length > 0 && filter !== 'saved' && filter !== 'history' && filter !== 'radar' && !query && (
        <motion.section
          initial={{ opacity: 0, height: 0, marginBottom: 0 }}
          animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          <div className={`rounded-2xl border p-3.5 sm:p-4 relative overflow-hidden ${
            mode === 'world'
              ? isDark
                ? 'bg-gradient-to-br from-blue-950/30 via-[var(--surface-solid)] to-[var(--surface-solid)] border-blue-500/25'
                : 'bg-gradient-to-br from-blue-50 via-white to-white border-blue-300/70 shadow-sm'
              : isDark
                ? 'bg-gradient-to-br from-amber-950/20 via-[var(--surface-solid)] to-[var(--surface-solid)] border-amber-500/25'
                : 'bg-gradient-to-br from-amber-50 via-white to-white border-amber-300/70 shadow-sm'
          }`}>
            {/* Minimal Clean Brief Header */}
            <div className="flex items-center justify-between gap-2 pb-2.5 mb-3 border-b border-[var(--border)] flex-wrap">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg border shrink-0 ${
                  mode === 'world'
                    ? 'bg-blue-500/15 border-blue-500/35 text-blue-500 dark:text-blue-400'
                    : 'bg-amber-500/15 border-amber-500/35 text-amber-600 dark:text-amber-400'
                }`}>
                  <Zap className="w-3.5 h-3.5" />
                </span>
                <h2 className="font-display text-base sm:text-lg tracking-wide text-[var(--ink)] leading-none truncate">
                  60-SECOND {mode === 'world' ? 'GLOBAL' : 'CRYPTO'} BRIEF
                </h2>
                {audioPlayer.audioNotice && (
                  <span className="text-[10px] font-mono text-amber-500 font-bold truncate">
                    • {audioPlayer.audioNotice}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Clean Listen Button (Speed appears only while playing; Voice lives inside Customize) */}
                <button
                  type="button"
                  onClick={handleTogglePlayBrief}
                  className={`text-[11px] font-mono px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 font-bold cursor-pointer active:scale-95 ${
                    isPlayingBrief
                      ? 'bg-emerald-500 text-black border-emerald-400 shadow-sm'
                      : 'bg-[var(--bg)] border-[var(--border)] text-[var(--ink)] hover:border-emerald-500/50'
                  }`}
                  title={isPlayingBrief ? (audioPlayer.isPaused ? 'Resume Audio Brief' : 'Pause Audio Brief') : 'Listen to 60-Second Audio Brief (adjust voice inside Customize)'}
                >
                  {isPlayingBrief ? (
                    audioPlayer.isPaused ? <Play className="w-3 h-3 fill-current" /> : <Pause className="w-3 h-3 fill-current" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                  )}
                  <span>{isPlayingBrief ? (audioPlayer.isPaused ? 'RESUME' : 'PAUSE') : 'LISTEN'}</span>
                </button>

                {isPlayingBrief && (
                  <>
                    <button
                      type="button"
                      onClick={audioPlayer.cycleRate}
                      className="px-2 py-1 rounded-lg text-[10px] font-mono font-bold text-[var(--ink)] bg-[var(--bg)] border border-[var(--border)] flex items-center gap-1 transition-colors cursor-pointer"
                      title="Cycle playback speed"
                    >
                      <Gauge className="w-3 h-3 text-emerald-500" />
                      <span>
                        {audioPlayer.playbackRate.toFixed(
                          audioPlayer.playbackRate === 1 || audioPlayer.playbackRate === 0.9 || audioPlayer.playbackRate === 1.3 ? 1 : 2
                        )}x
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={audioPlayer.stop}
                      className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--ink-muted)] hover:text-red-400 transition-colors cursor-pointer"
                      title="Stop Audio Brief"
                    >
                      <Square className="w-3 h-3 fill-current" />
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={onToggleBrief}
                  className="text-[11px] font-mono px-2.5 py-1 rounded-lg border border-[var(--border)] text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors cursor-pointer"
                >
                  HIDE
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              {morningBriefStories.map((item, i) => {
                const isSaved = savedIds.has(item.article.id);
                const isSpeakingThis = activeBriefTrackId === item.article.id;
                const brokeFirst = getBrokeFirstInfo(item.article, item.related);

                return (
                  <div
                    key={item.article.id}
                    className={`group relative rounded-xl border p-3 flex flex-col justify-between transition-all ${
                      isSpeakingThis
                        ? 'border-emerald-500 ring-2 ring-emerald-500/40 bg-emerald-500/10 shadow-lg scale-[1.01]'
                        : `border-[var(--border)] hover:border-[var(--accent)]/50 ${
                            isDark ? 'bg-black/25 hover:bg-black/40' : 'bg-white/90 hover:bg-white shadow-sm'
                          }`
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1.5 mb-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`text-[10px] font-mono font-black px-1.5 py-0.5 rounded ${
                            mode === 'world'
                              ? 'bg-blue-500/20 text-blue-600 dark:text-blue-300'
                              : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                          }`}>
                            0{i + 1}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-[var(--ink-muted)] truncate">
                            {item.article.src}
                          </span>
                        </div>
                        {item.related.length > 0 && (
                          <button
                            onClick={() => onOpenPerspective(item.article, item.related)}
                            className="shrink-0 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors cursor-pointer flex items-center gap-0.5"
                            title={`Compare coverage across ${item.related.length + 1} independent outlets${brokeFirst ? ` • First reported by ${brokeFirst.outlet}` : ''}`}
                          >
                            <span>+{item.related.length} wires</span>
                          </button>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => onOpenArticle(item.article)}
                        className="text-left text-xs font-bold text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors line-clamp-3 leading-snug block w-full cursor-pointer"
                      >
                        {item.article.title}
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--border)] text-[10px] font-mono text-[var(--ink-muted)]">
                      <div className="flex items-center gap-1.5 min-w-0 truncate">
                        <span className="shrink-0">{formatTimeAgo(item.article.date)}</span>
                        {brokeFirst && (
                          <span
                            className="inline-flex items-center gap-0.5 text-[8.5px] font-black text-amber-500 dark:text-amber-400 truncate"
                            title={`First reported by ${brokeFirst.outlet}`}
                          >
                            <span>• ⚡ {brokeFirst.isCurrentArticle ? 'BROKE 1ST' : `1ST: ${brokeFirst.outlet}`}</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onToggleSave(item.article)}
                          className={`p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer ${
                            isSaved ? 'text-amber-500 dark:text-amber-400' : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
                          }`}
                          title={isSaved ? 'Remove from Saved' : 'Save for Later'}
                        >
                          <Bookmark className={`w-3 h-3 ${isSaved ? 'fill-amber-400' : ''}`} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenArticle(item.article)}
                          className="text-[var(--accent)] hover:underline inline-flex items-center gap-1 font-bold cursor-pointer"
                        >
                          <BookOpen className="w-2.5 h-2.5" />
                          <span>READ</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Subtle Single-Line Daily 24h Call Strip */}
            <div className="mt-3 pt-2.5 border-t border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400">
                  <Target className="w-3.5 h-3.5" />
                  <span>24H {callSymbol} CALL:</span>
                </span>

                {todayCall ? (
                  <div className="flex items-center gap-2 flex-wrap text-[11px]">
                    <span className={`font-bold flex items-center gap-1 ${
                      todayCall.direction === 'up' ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {todayCall.direction === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      <span>
                        {todayCall.direction === 'up' ? 'Higher' : 'Lower'} from $
                        {todayCall.entryPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </span>

                    {unrealizedPct !== null && (
                      <span className={`font-bold ${
                        callOnTrack === true ? 'text-emerald-400' : callOnTrack === false ? 'text-rose-400' : 'text-[var(--ink-muted)]'
                      }`}>
                        ({unrealizedPct >= 0 ? '+' : ''}{unrealizedPct.toFixed(2)}% live)
                      </span>
                    )}

                    <span className="text-[10px] text-[var(--ink-muted)] hidden md:inline">
                      • Scores tomorrow
                    </span>
                  </div>
                ) : (
                  <span className="text-[11px] text-[var(--ink-muted)] font-sans">
                    Will <strong className="font-mono text-[var(--ink)]">{callDisplayName}</strong> close higher or lower tomorrow?
                    {callAssetQuote ? ` (${callAssetQuote.formatted})` : ''}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap shrink-0">
                {lastResolvedCall && (
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                    lastResolvedCall.status === 'won' ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {lastResolvedCall.status === 'won' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    <span>Last {lastResolvedCall.assetSymbol}: {lastResolvedCall.status === 'won' ? 'Won' : 'Missed'}</span>
                  </span>
                )}

                {totalResolved > 0 && winRatePct !== null && (
                  <span
                    className="text-[10px] font-bold text-amber-400"
                    title={`All-Time Call Accuracy: ${wins}W - ${losses}L`}
                  >
                    • Win Rate {winRatePct}% ({wins}/{totalResolved})
                  </span>
                )}

                {!todayCall && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={!isCallAssetLive}
                      onClick={() => onSubmitDailyCall('up')}
                      className="px-2.5 py-1 rounded-md bg-emerald-500/15 hover:bg-emerald-500 text-emerald-400 hover:text-black border border-emerald-500/40 font-mono text-[10px] font-black flex items-center gap-1 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <TrendingUp className="w-3 h-3" />
                      <span>▲ HIGHER</span>
                    </button>
                    <button
                      type="button"
                      disabled={!isCallAssetLive}
                      onClick={() => onSubmitDailyCall('down')}
                      className="px-2.5 py-1 rounded-md bg-rose-500/15 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/40 font-mono text-[10px] font-black flex items-center gap-1 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <TrendingDown className="w-3 h-3" />
                      <span>▼ LOWER</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
