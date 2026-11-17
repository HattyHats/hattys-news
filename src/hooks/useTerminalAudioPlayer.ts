import { useCallback, useEffect, useRef, useState } from 'react';
import { Article } from '../types';
import {
  BRIEF_SPEED_OPTIONS,
  createSpeechQueueController,
  getRankedEnglishVoices,
  loadSavedSpeechRate,
  loadSavedVoiceUri,
  saveSpeechRate,
  saveVoiceUri,
  SpeechQueueController,
} from '../utils/speech';

export interface AudioTrack {
  id: string;
  title: string;
  src: string;
  spokenText: string;
  article?: Article;
}

export interface TerminalAudioPlayer {
  tracks: AudioTrack[];
  activeIndex: number | null;
  activeTrack: AudioTrack | null;
  sourceLabel: string;
  isActive: boolean;
  isPaused: boolean;
  playbackRate: number;
  selectedVoiceUri: string;
  voices: SpeechSynthesisVoice[];
  audioNotice: string | null;
  playQueue: (newTracks: AudioTrack[], startIndex?: number, label?: string) => void;
  togglePlayPause: () => void;
  skipNext: () => void;
  skipPrev: () => void;
  stop: () => void;
  cycleRate: () => void;
  setVoiceUri: (uri: string) => void;
}

export function useTerminalAudioPlayer(): TerminalAudioPlayer {
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [sourceLabel, setSourceLabel] = useState<string>('AUDIO BRIEF');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [audioNotice, setAudioNotice] = useState<string | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceUri, setSelectedVoiceUri] = useState<string>(() => loadSavedVoiceUri());
  const [playbackRate, setPlaybackRate] = useState<number>(() => loadSavedSpeechRate());

  const tracksRef = useRef<AudioTrack[]>(tracks);
  tracksRef.current = tracks;
  const activeIndexRef = useRef<number | null>(activeIndex);
  activeIndexRef.current = activeIndex;
  const selectedVoiceUriRef = useRef<string>(selectedVoiceUri);
  selectedVoiceUriRef.current = selectedVoiceUri;
  const playbackRateRef = useRef<number>(playbackRate);
  playbackRateRef.current = playbackRate;
  const controllerRef = useRef<SpeechQueueController | null>(null);

  if (!controllerRef.current) {
    controllerRef.current = createSpeechQueueController({
      getVoiceUri: () => selectedVoiceUriRef.current,
      getRate: () => playbackRateRef.current,
      betweenItemDelayMs: 420,
      onItemStart: (idx) => {
        activeIndexRef.current = idx;
        setActiveIndex(idx);
        setIsPaused(false);
        setAudioNotice(null);
      },
      onComplete: () => {
        activeIndexRef.current = null;
        setActiveIndex(null);
        setIsPaused(false);
      },
      onError: (reason) => {
        activeIndexRef.current = null;
        setActiveIndex(null);
        setIsPaused(false);
        setAudioNotice(`Speech engine issue (${reason}) — try another voice`);
      },
    });
  }

  // Discover system English voices on mount and when loaded async
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

  // Ensure speech stops when page unmounts
  useEffect(() => {
    return () => {
      controllerRef.current?.stop();
    };
  }, []);

  const stop = useCallback(() => {
    controllerRef.current?.stop();
    activeIndexRef.current = null;
    setActiveIndex(null);
    setIsPaused(false);
    setAudioNotice(null);
  }, []);

  const playQueue = useCallback((newTracks: AudioTrack[], startIndex = 0, label = 'AUDIO BRIEF') => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setAudioNotice('Text-to-speech is not supported in this browser.');
      return;
    }
    if (!newTracks || newTracks.length === 0) return;
    const clampedIdx = Math.max(0, Math.min(startIndex, newTracks.length - 1));
    tracksRef.current = newTracks;
    activeIndexRef.current = clampedIdx;
    setTracks(newTracks);
    setActiveIndex(clampedIdx);
    setSourceLabel(label);
    setIsPaused(false);
    setAudioNotice(null);
    controllerRef.current?.start(
      newTracks.map(t => t.spokenText),
      clampedIdx
    );
  }, []);

  const togglePlayPause = useCallback(() => {
    if (activeIndexRef.current === null || tracksRef.current.length === 0) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    setIsPaused(prev => {
      const nextPaused = !prev;
      if (nextPaused) {
        controllerRef.current?.pause();
      } else {
        // Call resume; if synthesis had dropped speaking state (some browsers), restart active track cleanly
        const synth = window.speechSynthesis;
        if (!synth.speaking && !synth.pending) {
          controllerRef.current?.start(
            tracksRef.current.map(t => t.spokenText),
            activeIndexRef.current ?? 0
          );
        } else {
          controllerRef.current?.resume();
        }
      }
      return nextPaused;
    });
  }, []);

  const skipNext = useCallback(() => {
    const cur = activeIndexRef.current;
    const list = tracksRef.current;
    if (cur === null || list.length === 0) return;
    if (cur + 1 >= list.length) {
      stop();
      return;
    }
    const nextIdx = cur + 1;
    activeIndexRef.current = nextIdx;
    setActiveIndex(nextIdx);
    setIsPaused(false);
    controllerRef.current?.start(
      list.map(t => t.spokenText),
      nextIdx
    );
  }, [stop]);

  const skipPrev = useCallback(() => {
    const cur = activeIndexRef.current;
    const list = tracksRef.current;
    if (cur === null || list.length === 0) return;
    const prevIdx = Math.max(0, cur - 1);
    activeIndexRef.current = prevIdx;
    setActiveIndex(prevIdx);
    setIsPaused(false);
    controllerRef.current?.start(
      list.map(t => t.spokenText),
      prevIdx
    );
  }, []);

  const cycleRate = useCallback(() => {
    setPlaybackRate(prev => {
      const idx = BRIEF_SPEED_OPTIONS.findIndex(r => Math.abs(r - prev) < 0.02);
      const nextRate = BRIEF_SPEED_OPTIONS[(idx + 1) % BRIEF_SPEED_OPTIONS.length];
      playbackRateRef.current = nextRate;
      saveSpeechRate(nextRate);

      if (activeIndexRef.current !== null && tracksRef.current.length > 0 && !isPaused) {
        controllerRef.current?.start(
          tracksRef.current.map(t => t.spokenText),
          activeIndexRef.current
        );
      }
      return nextRate;
    });
  }, [isPaused]);

  const setVoiceUri = useCallback((nextUri: string) => {
    setSelectedVoiceUri(nextUri);
    selectedVoiceUriRef.current = nextUri;
    saveVoiceUri(nextUri);

    if (activeIndexRef.current !== null && tracksRef.current.length > 0 && !isPaused) {
      controllerRef.current?.start(
        tracksRef.current.map(t => t.spokenText),
        activeIndexRef.current
      );
    }
  }, [isPaused]);

  const activeTrack =
    activeIndex !== null && activeIndex >= 0 && activeIndex < tracks.length
      ? tracks[activeIndex]
      : null;

  return {
    tracks,
    activeIndex,
    activeTrack,
    sourceLabel,
    isActive: activeTrack !== null,
    isPaused,
    playbackRate,
    selectedVoiceUri,
    voices,
    audioNotice,
    playQueue,
    togglePlayPause,
    skipNext,
    skipPrev,
    stop,
    cycleRate,
    setVoiceUri,
  };
}
