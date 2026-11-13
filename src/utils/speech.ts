export const BRIEF_SPEED_OPTIONS = [0.9, 1.0, 1.15, 1.3] as const;

const VOICE_STORAGE_KEY = 'hattys_brief_voice_uri_v1';
const RATE_STORAGE_KEY = 'hattys_brief_rate_v1';

// Track voices that fail synthesis in the current browser session so auto-fallback skips them
const failedVoiceUris = new Set<string>();

function scoreVoice(v: SpeechSynthesisVoice): number {
  let score = 0;
  const name = v.name || '';
  const lang = (v.lang || '').toLowerCase();

  if (!lang.startsWith('en')) return -100;
  if (failedVoiceUris.has(v.voiceURI)) return -90;

  // Exclude robotic/novelty macOS voices and unstable Siri aliases in Auto mode
  if (/compact|espeak|eloquence|albert|bad news|bahh|bells|boing|bubbles|cellos|deranged|good news|hysterical|jester|organ|superstar|trinoids|whisper|wobble|zarvox|eddy|flo|grandma|grandpa|reed|rocko|sandy|shelley/i.test(name)) {
    return -80;
  }
  if (/siri/i.test(name)) {
    score -= 30;
  }

  // Prefer reliable local OS voices first in Auto mode so Chrome offline/privacy extensions don't error
  if (v.localService) score += 45;

  // Neural / Natural / Enhanced desktop voices
  if (/natural|enhanced|premium|neural/i.test(name)) score += 90;

  // High-clarity named voices
  if (/ava|allison|samantha|daniel|karen|serena|jenny|aria|moira|tessa|alex/i.test(name)) score += 60;

  // Google cloud voices work great when network permits, fallback handles if blocked
  if (/google (us|uk)/i.test(name)) score += 35;

  if (/en[-_]us|en[-_]gb/i.test(lang)) score += 15;
  if (v.default) score += 10;

  return score;
}

export function getRankedEnglishVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  const voices = window.speechSynthesis.getVoices() || [];
  if (voices.length === 0) return [];

  const english = voices.filter(v => (v.lang || '').toLowerCase().startsWith('en'));
  const pool = english.length > 0 ? english : voices;

  return [...pool].sort((a, b) => scoreVoice(b) - scoreVoice(a));
}

export function formatVoiceLabel(v: SpeechSynthesisVoice): string {
  return (v.name || 'System Voice')
    .replace(/^Microsoft\s+/i, '')
    .replace(/^Google\s+/i, 'Google ')
    .replace(/\s+Online\s*\(Natural\)/i, ' (Natural)')
    .replace(/\s*-\s*English.*$/i, '')
    .replace(/\s*\(English[^)]*\)/gi, '')
    .trim();
}

export function resolveSelectedVoice(savedVoiceUri?: string): SpeechSynthesisVoice | null {
  const ranked = getRankedEnglishVoices();
  if (ranked.length === 0) return null;

  if (savedVoiceUri && savedVoiceUri !== 'auto') {
    const match = ranked.find(v => v.voiceURI === savedVoiceUri || v.name === savedVoiceUri);
    if (match && !failedVoiceUris.has(match.voiceURI)) return match;
  }

  // Never pick a negatively scored novelty voice as Auto default
  const safe = ranked.find(v => scoreVoice(v) > 0);
  return safe || ranked[0] || null;
}

export function splitSpeechChunks(text: string, maxLen = 210): string[] {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return [];

  const sentences = cleaned.match(/[^.!?]+[.!?]*/g) || [cleaned];
  const chunks: string[] = [];
  let current = '';

  for (const raw of sentences) {
    const piece = raw.trim();
    if (!piece) continue;
    if (piece.length > maxLen) {
      if (current) {
        chunks.push(current);
        current = '';
      }
      const words = piece.split(' ');
      let sub = '';
      for (const w of words) {
        if (sub.length + w.length + 1 <= maxLen) {
          sub = sub ? `${sub} ${w}` : w;
        } else {
          if (sub) chunks.push(sub);
          sub = w;
        }
      }
      if (sub) chunks.push(sub);
    } else if (current.length + piece.length + 1 <= maxLen) {
      current = current ? `${current} ${piece}` : piece;
    } else {
      if (current) chunks.push(current);
      current = piece;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

export interface SpeechQueueCallbacks {
  getVoiceUri?: () => string;
  getRate?: () => number;
  betweenItemDelayMs?: number;
  onItemStart?: (itemIndex: number) => void;
  onComplete?: () => void;
  onError?: (reason: string) => void;
}

export interface SpeechQueueController {
  start: (items: string[], startIndex?: number) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
}

// Chrome-safe queued speech engine with GC retention, cancel-yield, and automatic fallback to OS default voice
export function createSpeechQueueController(callbacks: SpeechQueueCallbacks): SpeechQueueController {
  let sessionId = 0;
  let activeUtterance: SpeechSynthesisUtterance | null = null;
  let pauseTimer: number | null = null;
  let cancelTimer: number | null = null;

  const clearTimers = () => {
    if (pauseTimer !== null) {
      window.clearTimeout(pauseTimer);
      pauseTimer = null;
    }
    if (cancelTimer !== null) {
      window.clearTimeout(cancelTimer);
      cancelTimer = null;
    }
  };

  const stop = () => {
    sessionId += 1;
    clearTimers();
    activeUtterance = null;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        if (window.speechSynthesis.speaking || window.speechSynthesis.pending || window.speechSynthesis.paused) {
          window.speechSynthesis.cancel();
        }
      } catch {}
    }
  };

  const pause = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.pause();
      } catch {}
    }
  };

  const resume = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.resume();
      } catch {}
    }
  };

  const start = (items: string[], startIndex = 0) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || items.length === 0) {
      callbacks.onError?.('Speech synthesis is unavailable in this browser.');
      return;
    }

    sessionId += 1;
    const mySession = sessionId;
    clearTimers();
    activeUtterance = null;

    const synth = window.speechSynthesis;
    const needsCancel = synth.speaking || synth.pending;

    const speakSegment = (
      itemIdx: number,
      subChunkIdx: number,
      itemChunks: string[],
      forceDefaultVoice: boolean,
      hasAnnouncedItem = false,
    ) => {
      if (mySession !== sessionId) return;

      if (itemIdx >= items.length) {
        activeUtterance = null;
        callbacks.onComplete?.();
        return;
      }

      if (subChunkIdx === 0 && !hasAnnouncedItem) {
        callbacks.onItemStart?.(itemIdx);
      }

      if (subChunkIdx >= itemChunks.length) {
        const delay = callbacks.betweenItemDelayMs ?? 0;
        if (delay > 0 && itemIdx + 1 < items.length) {
          pauseTimer = window.setTimeout(() => {
            pauseTimer = null;
            if (mySession !== sessionId) return;
            const nextChunks = splitSpeechChunks(items[itemIdx + 1]);
            speakSegment(itemIdx + 1, 0, nextChunks, forceDefaultVoice);
          }, delay);
        } else if (itemIdx + 1 < items.length) {
          const nextChunks = splitSpeechChunks(items[itemIdx + 1]);
          speakSegment(itemIdx + 1, 0, nextChunks, forceDefaultVoice);
        } else {
          activeUtterance = null;
          callbacks.onComplete?.();
        }
        return;
      }

      const text = itemChunks[subChunkIdx];
      const utterance = new SpeechSynthesisUtterance(text);
      activeUtterance = utterance; // Keep strong reference to prevent Chromium/WebKit GC

      const rate = callbacks.getRate?.() ?? 1.0;
      utterance.rate = Math.min(1.6, Math.max(0.7, rate));
      utterance.pitch = 1.02;

      const selectedVoice = forceDefaultVoice ? null : resolveSelectedVoice(callbacks.getVoiceUri?.());
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        if (selectedVoice.lang) {
          utterance.lang = selectedVoice.lang;
        }
      } else {
        utterance.lang = 'en-US';
      }

      utterance.onend = () => {
        if (mySession !== sessionId || utterance !== activeUtterance) return;
        speakSegment(itemIdx, subChunkIdx + 1, itemChunks, forceDefaultVoice, true);
      };

      utterance.onerror = (ev: SpeechSynthesisErrorEvent) => {
        if (mySession !== sessionId || utterance !== activeUtterance) return;
        const errType = ev?.error || '';
        if (errType === 'canceled' || errType === 'interrupted') {
          return;
        }

        // If a specific selected/auto voice failed, blacklist it for this session and fall back to OS default voice
        if (!forceDefaultVoice && selectedVoice) {
          failedVoiceUris.add(selectedVoice.voiceURI);
          speakSegment(itemIdx, subChunkIdx, itemChunks, true, true);
          return;
        }

        activeUtterance = null;
        callbacks.onError?.(errType || 'synthesis-failed');
      };

      try {
        if (synth.paused) {
          synth.resume();
        }
        synth.speak(utterance);
      } catch {
        if (!forceDefaultVoice && selectedVoice) {
          failedVoiceUris.add(selectedVoice.voiceURI);
          speakSegment(itemIdx, subChunkIdx, itemChunks, true, true);
        } else {
          activeUtterance = null;
          callbacks.onError?.('playback-blocked');
        }
      }
    };

    const launch = () => {
      if (mySession !== sessionId) return;
      const firstChunks = splitSpeechChunks(items[startIndex]);
      if (firstChunks.length === 0) {
        callbacks.onComplete?.();
        return;
      }
      speakSegment(startIndex, 0, firstChunks, false);
    };

    if (needsCancel) {
      // Only cancel when actually speaking/pending, and wait briefly so Chromium doesn't abort the new utterance
      try {
        synth.cancel();
      } catch {}
      cancelTimer = window.setTimeout(() => {
        cancelTimer = null;
        launch();
      }, 75);
    } else {
      // Synchronous call preserves user gesture activation on Safari / Chrome iOS & Desktop
      launch();
    }
  };

  return { start, stop, pause, resume };
}

export function loadSavedVoiceUri(): string {
  try {
    return localStorage.getItem(VOICE_STORAGE_KEY) || 'auto';
  } catch {
    return 'auto';
  }
}

export function saveVoiceUri(voiceUri: string): void {
  try {
    localStorage.setItem(VOICE_STORAGE_KEY, voiceUri);
  } catch {}
}

export function loadSavedSpeechRate(): number {
  try {
    const raw = parseFloat(localStorage.getItem(RATE_STORAGE_KEY) || '');
    if (!isNaN(raw) && raw >= 0.75 && raw <= 1.6) return raw;
  } catch {}
  return 1.0;
}

export function saveSpeechRate(rate: number): void {
  try {
    localStorage.setItem(RATE_STORAGE_KEY, String(rate));
  } catch {}
}
