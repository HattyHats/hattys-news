import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Calendar, Bookmark, Volume2, Pause, Play, Square, Gauge, BookOpen } from 'lucide-react';
import { Article, AppMode } from '../../types';
import { formatTimeAgo } from '../../utils/formatters';
import {
  BRIEF_SPEED_OPTIONS,
  createSpeechQueueController,
  formatVoiceLabel,
  getRankedEnglishVoices,
  loadSavedSpeechRate,
  loadSavedVoiceUri,
  saveSpeechRate,
  saveVoiceUri,
  SpeechQueueController,
} from '../../utils/speech';

interface MorningBriefProps {
  showBrief: boolean;
  morningBriefStories: { article: Article; related: Article[] }[];
  mode: AppMode;
  isDark: boolean;
  filter: string;
  query: string;
  savedIds: Set<string>;
  onToggleBrief: () => void;
  onOpenCatalysts: () => void;
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
  onToggleBrief,
  onOpenCatalysts,
  onToggleSave,
  onOpenPerspective,
  onOpenArticle,
}: MorningBriefProps) {
  // Feature 3 + 6: Realistic Natural Audio Brief Reader with Voice Picker & Speed Control
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isPausedAudio, setIsPausedAudio] = useState(false);
  const [activeSpeakingIdx, setActiveSpeakingIdx] = useState<number | null>(null);
  const [audioNotice, setAudioNotice] = useState<string | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceUri, setSelectedVoiceUri] = useState<string>(() => loadSavedVoiceUri());
  const [playbackRate, setPlaybackRate] = useState<number>(() => loadSavedSpeechRate());

  const selectedVoiceUriRef = useRef(selectedVoiceUri);
  selectedVoiceUriRef.current = selectedVoiceUri;
  const playbackRateRef = useRef(playbackRate);
  playbackRateRef.current = playbackRate;
  const currentStoryIdxRef = useRef<number>(0);
  const controllerRef = useRef<SpeechQueueController | null>(null);

  if (!controllerRef.current) {
    controllerRef.current = createSpeechQueueController({
      getVoiceUri: () => selectedVoiceUriRef.current,
      getRate: () => playbackRateRef.current,
      betweenItemDelayMs: 450,
      onItemStart: (idx) => {
        currentStoryIdxRef.current = idx;
        setActiveSpeakingIdx(idx);
        setAudioNotice(null);
      },
      onComplete: () => {
        setIsPlayingAudio(false);
        setIsPausedAudio(false);
        setActiveSpeakingIdx(null);
      },
      onError: (reason) => {
        setIsPlayingAudio(false);
        setIsPausedAudio(false);
        setActiveSpeakingIdx(null);
        setAudioNotice(`Speech engine issue (${reason}) — try another voice`);
      },
    });
  }

  // Discover ranked English neural / natural voices on mount & when Chrome finishes loading voices
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const loadVoiceList = () => {
      setVoices(getRankedEnglishVoices());
    };

    loadVoiceList();
    const synth = window.speechSynthesis;
    if (typeof synth.addEventListener === 'function') {
      synth.addEventListener('voiceschanged', loadVoiceList);
      return () => {
        synth.removeEventListener('voiceschanged', loadVoiceList);
      };
    }
    synth.onvoiceschanged = loadVoiceList;
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Stop speech cleanly if brief closes, mode changes, or component unmounts
  useEffect(() => {
    return () => {
      controllerRef.current?.stop();
      setIsPlayingAudio(false);
      setIsPausedAudio(false);
      setActiveSpeakingIdx(null);
      setAudioNotice(null);
    };
  }, [mode, showBrief]);

  const handleStopAudio = () => {
    controllerRef.current?.stop();
    setIsPlayingAudio(false);
    setIsPausedAudio(false);
    setActiveSpeakingIdx(null);
    setAudioNotice(null);
  };

  const buildBriefScripts = () => {
    const total = morningBriefStories.length;
    return morningBriefStories.map((item, idx) => {
      const cleanTitle = item.article.title.replace(/[\n\r]+/g, ' ').trim();
      const sourceName = item.article.src;
      if (idx === 0) {
        return `Welcome to Hatty's News sixty-second ${mode === 'world' ? 'world' : 'crypto'} brief. Here are today's top stories. First, ${cleanTitle}. Reported by ${sourceName}.`;
      }
      if (idx === total - 1) {
        return `And finally... ${cleanTitle}. Covered by ${sourceName}. That concludes your sixty-second brief.`;
      }
      const transitions = [
        `Next story... ${cleanTitle}. From ${sourceName}.`,
        `Also developing... ${cleanTitle}. According to ${sourceName}.`,
        `In other news... ${cleanTitle}. Reported by ${sourceName}.`
      ];
      return transitions[(idx - 1) % transitions.length];
    });
  };

  const startBriefSequence = (startIdx: number) => {
    const scripts = buildBriefScripts();
    if (scripts.length === 0) return;
    setAudioNotice(null);
    setIsPlayingAudio(true);
    setIsPausedAudio(false);
    controllerRef.current?.start(scripts, startIdx);
  };

  const handleTogglePlayAudio = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setAudioNotice('Text-to-speech is not supported in this browser.');
      return;
    }

    if (isPlayingAudio) {
      if (isPausedAudio) {
        controllerRef.current?.resume();
        setIsPausedAudio(false);
      } else {
        controllerRef.current?.pause();
        setIsPausedAudio(true);
      }
      return;
    }

    startBriefSequence(0);
  };

  const handleCycleRate = () => {
    const idx = BRIEF_SPEED_OPTIONS.findIndex(r => Math.abs(r - playbackRate) < 0.02);
    const nextRate = BRIEF_SPEED_OPTIONS[(idx + 1) % BRIEF_SPEED_OPTIONS.length];
    setPlaybackRate(nextRate);
    playbackRateRef.current = nextRate;
    saveSpeechRate(nextRate);
    if (isPlayingAudio && !isPausedAudio) {
      startBriefSequence(currentStoryIdxRef.current);
    }
  };

  const handleVoiceChange = (nextUri: string) => {
    setSelectedVoiceUri(nextUri);
    selectedVoiceUriRef.current = nextUri;
    saveVoiceUri(nextUri);
    if (isPlayingAudio && !isPausedAudio) {
      startBriefSequence(currentStoryIdxRef.current);
    }
  };

  return (
    <AnimatePresence initial={false}>
      {showBrief && morningBriefStories.length > 0 && filter !== 'saved' && !query && (
        <motion.section
          initial={{ opacity: 0, height: 0, marginBottom: 0 }}
          animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          <div className={`rounded-2xl border p-4 sm:p-5 relative overflow-hidden ${
            mode === 'world'
              ? isDark
                ? 'bg-gradient-to-br from-blue-950/35 via-[var(--surface-solid)] to-[var(--surface-solid)] border-blue-500/30'
                : 'bg-gradient-to-br from-blue-50 via-white to-white border-blue-300/70 shadow-sm'
              : isDark
                ? 'bg-gradient-to-br from-amber-950/25 via-[var(--surface-solid)] to-[var(--surface-solid)] border-amber-500/30'
                : 'bg-gradient-to-br from-amber-50 via-white to-white border-amber-300/70 shadow-sm'
          }`}>
            <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-[var(--border)] flex-wrap">
              <div className="flex items-center gap-2.5">
                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg border ${
                  mode === 'world'
                    ? 'bg-blue-500/15 border-blue-500/40 text-blue-500 dark:text-blue-400'
                    : 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400'
                }`}>
                  <Zap className="w-4 h-4" />
                </span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-display text-lg sm:text-xl tracking-wide text-[var(--ink)] leading-none">
                      60-SECOND {mode === 'world' ? 'GLOBAL' : 'CRYPTO'} BRIEF
                    </h2>
                    <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${
                      mode === 'world'
                        ? 'bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/30'
                        : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                    }`}>
                      TOP 5 MUST-KNOW
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-[var(--ink-muted)] mt-0.5">
                    Ranked by multi-source wire consensus & breaking velocity
                  </p>
                  {audioNotice && (
                    <p className="text-[11px] font-mono text-amber-500 mt-1 font-bold">
                      {audioNotice}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Feature 3 + 6: Audio Brief Player + Speed + Voice Picker */}
                <div className="inline-flex items-center gap-1 bg-black/10 dark:bg-white/10 p-0.5 rounded-lg border border-[var(--border)] flex-wrap">
                  <button
                    onClick={handleTogglePlayAudio}
                    className={`text-[11px] font-mono px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 font-bold cursor-pointer active:scale-95 ${
                      isPlayingAudio
                        ? 'bg-emerald-500 text-black shadow-sm'
                        : 'text-[var(--ink)] hover:bg-black/10 dark:hover:bg-white/10'
                    }`}
                    title={isPlayingAudio ? (isPausedAudio ? 'Resume Audio Brief' : 'Pause Audio Brief') : 'Listen to 60-Second Audio Brief'}
                  >
                    {isPlayingAudio ? (
                      isPausedAudio ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                    )}
                    <span>{isPlayingAudio ? (isPausedAudio ? 'RESUME' : 'PAUSE') : 'LISTEN'}</span>
                  </button>

                  {isPlayingAudio && (
                    <button
                      onClick={handleStopAudio}
                      className="text-[11px] font-mono p-1 rounded-md text-[var(--ink-muted)] hover:text-red-400 transition-colors cursor-pointer"
                      title="Stop Audio Brief"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleCycleRate}
                    className="px-2 py-1 rounded-md text-[10px] font-mono font-bold text-[var(--ink)] bg-[var(--surface-solid)]/80 hover:bg-[var(--surface-solid)] border border-[var(--border)] flex items-center gap-1 transition-colors cursor-pointer"
                    title="Cycle playback speed (0.9x / 1.0x / 1.15x / 1.3x)"
                  >
                    <Gauge className="w-3 h-3 text-emerald-500" />
                    <span>{playbackRate.toFixed(playbackRate === 1 || playbackRate === 0.9 || playbackRate === 1.3 ? 1 : 2)}x</span>
                  </button>

                  {voices.length > 0 && (
                    <select
                      value={selectedVoiceUri}
                      onChange={(e) => handleVoiceChange(e.target.value)}
                      aria-label="Select narrator voice"
                      title="Select narrator voice for 60s Audio Brief"
                      className="text-[10px] font-mono font-semibold bg-[var(--surface-solid)] text-[var(--ink)] border border-[var(--border)] rounded-md px-1.5 py-1 max-w-[130px] sm:max-w-[165px] truncate outline-none cursor-pointer hover:border-emerald-500/40"
                    >
                      <option value="auto">Auto (Best Natural)</option>
                      {voices.slice(0, 18).map((v) => (
                        <option key={v.voiceURI} value={v.voiceURI}>
                          {formatVoiceLabel(v)}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <button
                  onClick={onOpenCatalysts}
                  className="text-[11px] font-mono px-2.5 py-1 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors flex items-center gap-1.5 font-bold cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">UPCOMING</span> CATALYSTS
                </button>
                <button
                  onClick={onToggleBrief}
                  className="text-[11px] font-mono px-2.5 py-1 rounded-lg border border-[var(--border)] text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors cursor-pointer"
                >
                  HIDE
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {morningBriefStories.map((item, i) => {
                const isSaved = savedIds.has(item.article.id);
                const isSpeakingThis = activeSpeakingIdx === i;

                return (
                  <div
                    key={item.article.id}
                    className={`group relative rounded-xl border p-3 flex flex-col justify-between transition-all ${
                      isSpeakingThis
                        ? 'border-emerald-500 ring-2 ring-emerald-500/40 bg-emerald-500/10 shadow-lg scale-[1.02]'
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
                            title={`Compare coverage across ${item.related.length + 1} independent outlets`}
                          >
                            <span>+{item.related.length} wires</span>
                            <span>⇄</span>
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

                    <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-[var(--border)] text-[10px] font-mono text-[var(--ink-muted)]">
                      <span>{formatTimeAgo(item.article.date)}</span>
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
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
