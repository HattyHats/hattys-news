import { AppMode, Article } from '../types';

export type PulseVote = 'up' | 'down';

export interface StoryPulseData {
  upVotes: number;
  downVotes: number;
  totalVotes: number;
  upPct: number;
  downPct: number;
  userVote: PulseVote | null;
  upLabel: string;
  downLabel: string;
  upShortLabel: string;
  downShortLabel: string;
  dominantSentiment: 'up' | 'down' | 'neutral';
}

const PULSE_STORAGE_KEY = 'hattys_community_votes_v1';

const POSITIVE_CRYPTO_REGEX = /\b(surge|surges|soar|soars|rally|rallies|bull|bullish|approve|approved|approval|etf|adopt|adoption|launch|launches|record|high|ath|inflow|inflows|partnership|upgrade|breakthrough|milestone|accumulate|accumulates|buy|buys|treasury|gain|gains|jump|jumps|win|wins|dismissed)\b/i;
const NEGATIVE_CRYPTO_REGEX = /\b(hack|hacked|exploit|exploited|crash|crashes|plunge|plunges|dump|bear|bearish|lawsuit|sue|sued|charges|charged|ban|bans|banned|outflow|outflows|liquidate|liquidated|liquidation|scam|fraud|drain|drained|phishing|arrest|arrested|investigation|probe|delay|delays|reject|rejected|slump|drop|drops)\b/i;

const HIGH_IMPACT_WORLD_REGEX = /\b(breaking|urgent|emergency|earthquake|tsunami|missile|strike|ceasefire|treaty|summit|sanctions|tariff|tariffs|fed|interest rate|inflation|cpi|gdp|election|parliament|supreme court|nato|pentagon|un security|nuclear|breakthrough|discovery|nasa|pandemic|outbreak|crisis|invasion|mobilization)\b/i;

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function loadUserPulseVotes(): Record<string, PulseVote> {
  try {
    const raw = localStorage.getItem(PULSE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch {}
  return {};
}

export function saveUserPulseVote(articleId: string, vote: PulseVote | null, currentMap: Record<string, PulseVote>): Record<string, PulseVote> {
  const next = { ...currentMap };
  if (vote === null) {
    delete next[articleId];
  } else {
    next[articleId] = vote;
  }
  try {
    // Keep most recent 300 votes so localStorage stays compact
    const keys = Object.keys(next);
    if (keys.length > 300) {
      delete next[keys[0]];
    }
    localStorage.setItem(PULSE_STORAGE_KEY, JSON.stringify(next));
  } catch {}
  return next;
}

export function computeStoryPulse(
  article: Pick<Article, 'id' | 'title' | 'snippet' | 'mode'>,
  fallbackMode: AppMode,
  userVote: PulseVote | null,
  clusterBonus: number = 0
): StoryPulseData {
  const effectiveMode = article.mode || fallbackMode;
  const text = `${article.title} ${article.snippet || ''}`;
  const hash = hashString(article.id || article.title);

  // Base total votes between 22 and 96, plus extra engagement for multi-outlet stories
  const baseTotal = 22 + (hash % 75) + clusterBonus * 19;

  let baseUpRatio = 0.52 + ((hash % 29) - 14) / 100; // 0.38 to 0.66 baseline

  if (effectiveMode === 'crypto') {
    const posMatches = (text.match(new RegExp(POSITIVE_CRYPTO_REGEX.source, 'gi')) || []).length;
    const negMatches = (text.match(new RegExp(NEGATIVE_CRYPTO_REGEX.source, 'gi')) || []).length;

    if (posMatches > negMatches) {
      baseUpRatio = Math.min(0.88, 0.66 + (posMatches * 0.06) + ((hash % 11) / 100));
    } else if (negMatches > posMatches) {
      baseUpRatio = Math.max(0.14, 0.34 - (negMatches * 0.06) - ((hash % 11) / 100));
    }
  } else {
    const impactMatches = (text.match(new RegExp(HIGH_IMPACT_WORLD_REGEX.source, 'gi')) || []).length;
    if (impactMatches > 0) {
      baseUpRatio = Math.min(0.91, 0.70 + (impactMatches * 0.05) + ((hash % 10) / 100));
    } else {
      baseUpRatio = 0.56 + ((hash % 21) / 100); // 56% - 76% High Impact
    }
  }

  let upVotes = Math.max(1, Math.round(baseTotal * baseUpRatio));
  let downVotes = Math.max(1, baseTotal - upVotes);

  if (userVote === 'up') {
    upVotes += 1;
  } else if (userVote === 'down') {
    downVotes += 1;
  }

  const totalVotes = upVotes + downVotes;
  const upPct = Math.round((upVotes / totalVotes) * 100);
  const downPct = 100 - upPct;

  const dominantSentiment: 'up' | 'down' | 'neutral' =
    upPct >= 58 ? 'up' : downPct >= 58 ? 'down' : 'neutral';

  return {
    upVotes,
    downVotes,
    totalVotes,
    upPct,
    downPct,
    userVote,
    upLabel: effectiveMode === 'world' ? 'HIGH IMPACT' : 'BULLISH',
    downLabel: effectiveMode === 'world' ? 'OVERHYPED' : 'BEARISH',
    upShortLabel: effectiveMode === 'world' ? 'IMPACT' : 'BULL',
    downShortLabel: effectiveMode === 'world' ? 'NOISE' : 'BEAR',
    dominantSentiment,
  };
}
