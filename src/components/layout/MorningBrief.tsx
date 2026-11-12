import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Calendar, Bookmark, ExternalLink, Volume2, VolumeX, Pause, Play, Square } from 'lucide-react';
import { Article, AppMode } from '../../types';
import { formatTimeAgo } from '../../utils/formatters';

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
}

// Helper to select the highest-quality natural human voice (Neural, Enhanced, Siri, Google)
function getBestNaturalVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // 1. Natural / Enhanced / Neural English voices (macOS Enhanced, iOS Siri, Edge Natural)
  const premium = voices.filter(v =>
    v.lang.startsWith('en') && /natural|enhanced|premium|neural|siri/i.test(v.name)
  );
  if (premium.length > 0) {
    const favorite = premium.find(v => /ava|samantha|jenny|aria|karen|allison|serena|daniel/i.test(v.name));
    return favorite || premium[0];
  }

  // 2. High-quality human voices from Apple, Google, Microsoft
  const branded = voices.filter(v =>
    v.lang.startsWith('en') && (
      /google (us|uk)|samantha|karen|jenny|aria|moira|tessa|daniel|alex/i.test(v.name)
    )
  );
  if (branded.length > 0) {
    const favorite = branded.find(v => /google us|samantha|jenny|karen|aria/i.test(v.name));
    return favorite || branded[0];
  }

  // 3. Fallback to US or UK English voice
  const english = voices.filter(v => v.lang.startsWith('en'));
  if (english.length > 0) {
    const enUS = english.find(v => v.lang.includes('US') || v.lang.includes('GB'));
    return enUS || english[0];
  }

  return voices[0] || null;
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
}: MorningBriefProps) {
  // Feature 3: Realistic Natural Audio Brief Reader
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isPausedAudio, setIsPausedAudio] = useState(false);
  const [activeSpeakingIdx, setActiveSpeakingIdx] = useState<number | null>(null);
  const [activeVoiceName, setActiveVoiceName] = useState<string>('');
  const bestVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  // Discover and cache the best neural / natural voice on mount
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const loadVoice = () => {
      const voice = getBestNaturalVoice();
      bestVoiceRef.current = voice;
      if (voice) {
        setActiveVoiceName(voice.name.replace(/Microsoft |Google |Apple /i, ''));
      }
    };

    loadVoice();
    window.speechSynthesis.onvoiceschanged = loadVoice;
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Stop speech if brief is closed, mode changes, or component unmounts
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [mode, showBrief]);

  const handleStopAudio = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
    setIsPausedAudio(false);
    setActiveSpeakingIdx(null);
  };

  const handleTogglePlayAudio = () => {
    if (!('speechSynthesis' in window)) {
      alert("Text-to-speech is not supported by your current browser.");
      return;
    }

    if (isPlayingAudio) {
      if (isPausedAudio) {
        window.speechSynthesis.resume();
        setIsPausedAudio(false);
      } else {
        window.speechSynthesis.pause();
        setIsPausedAudio(true);
      }
      return;
    }

    // Start fresh natural audio brief sequence
    window.speechSynthesis.cancel();
    setIsPlayingAudio(true);
    setIsPausedAudio(false);

    // Refresh voice reference in case voices loaded late
    if (!bestVoiceRef.current) {
      bestVoiceRef.current = getBestNaturalVoice();
    }

    const playNextStory = (idx: number) => {
      if (idx >= morningBriefStories.length) {
        setIsPlayingAudio(false);
        setIsPausedAudio(false);
        setActiveSpeakingIdx(null);
        return;
      }

      setActiveSpeakingIdx(idx);
      const item = morningBriefStories[idx];
      const total = morningBriefStories.length;
      const cleanTitle = item.article.title.replace(/[\n\r]+/g, ' ').trim();
      const sourceName = item.article.src;

      // Realistic, human-sounding newscaster phrasing with natural pauses
      let script = '';
      if (idx === 0) {
        script = `Welcome to Hatty's News sixty-second ${mode === 'world' ? 'world' : 'crypto'} brief. Here are today's top stories. First, ${cleanTitle}. Reported by ${sourceName}.`;
      } else if (idx === total - 1) {
        script = `And finally... ${cleanTitle}. Covered by ${sourceName}. That concludes your sixty-second brief.`;
      } else {
        const transitions = [
          `Next story... ${cleanTitle}. From ${sourceName}.`,
          `Also developing... ${cleanTitle}. According to ${sourceName}.`,
          `In other news... ${cleanTitle}. Reported by ${sourceName}.`
        ];
        script = transitions[(idx - 1) % transitions.length];
      }

      const utterance = new SpeechSynthesisUtterance(script);
      if (bestVoiceRef.current) {
        utterance.voice = bestVoiceRef.current;
      }
      // Fine-tuned human inflection: relaxed broadcast pace & warm pitch
      utterance.rate = 0.98;
      utterance.pitch = 1.04;

      utterance.onend = () => {
        setTimeout(() => {
          playNextStory(idx + 1);
        }, 550); // Natural breath pause between dispatches
      };

      utterance.onerror = () => {
        handleStopAudio();
      };

      window.speechSynthesis.speak(utterance);
    };

    playNextStory(0);
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
                  <div className="flex items-center gap-2">
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
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Feature 3: Audio Brief Player Button */}
                <div className="inline-flex items-center gap-1 bg-black/10 dark:bg-white/10 p-0.5 rounded-lg border border-[var(--border)]">
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

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
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
                      <a
                        href={item.article.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors line-clamp-3 leading-snug block"
                      >
                        {item.article.title}
                      </a>
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
                        <a
                          href={item.article.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--accent)] hover:underline inline-flex items-center gap-0.5 font-bold"
                        >
                          READ <ExternalLink className="w-2.5 h-2.5" />
                        </a>
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
