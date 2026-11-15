import { AppMode } from '../types';

export interface DailyStreakState {
  count: number;
  bestStreak: number;
  lastDate: string; // YYYY-MM-DD in local time
  caughtUpToday: boolean;
}

const STREAK_STORAGE_KEY = 'hattys_daily_streak_v1';

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function loadAndSyncDailyStreak(): DailyStreakState {
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();

  try {
    const raw = localStorage.getItem(STREAK_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<DailyStreakState>;
      const prevCount = typeof parsed.count === 'number' && parsed.count >= 1 ? parsed.count : 1;
      const prevBest = typeof parsed.bestStreak === 'number' && parsed.bestStreak >= prevCount ? parsed.bestStreak : prevCount;
      const prevDate = parsed.lastDate || '';

      if (prevDate === today) {
        return {
          count: prevCount,
          bestStreak: prevBest,
          lastDate: today,
          caughtUpToday: Boolean(parsed.caughtUpToday),
        };
      }

      if (prevDate === yesterday) {
        const nextCount = prevCount + 1;
        const nextBest = Math.max(prevBest, nextCount);
        const updated: DailyStreakState = {
          count: nextCount,
          bestStreak: nextBest,
          lastDate: today,
          caughtUpToday: false,
        };
        localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      }
    }
  } catch {}

  const initial: DailyStreakState = {
    count: 1,
    bestStreak: 1,
    lastDate: today,
    caughtUpToday: false,
  };
  try {
    localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(initial));
  } catch {}
  return initial;
}

export function markDailyStreakCaughtUp(): DailyStreakState {
  const current = loadAndSyncDailyStreak();
  if (current.caughtUpToday) return current;
  const updated: DailyStreakState = {
    ...current,
    caughtUpToday: true,
    bestStreak: Math.max(current.bestStreak, current.count),
  };
  try {
    localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(updated));
  } catch {}
  return updated;
}

export function loadLastCaughtUpTimestamp(mode: AppMode): number {
  const now = Date.now();
  const defaultWindow = now - 2 * 3600 * 1000; // Default 2 hours ago
  try {
    const caughtUpKey = `hattys_caught_up_ts_${mode}`;
    const savedCaughtUp = localStorage.getItem(caughtUpKey);
    if (savedCaughtUp) {
      const parsed = parseInt(savedCaughtUp, 10);
      if (!isNaN(parsed) && parsed > 0) {
        // Keep within a sensible 24h window so returning after a week doesn't mark 200 items as new
        return Math.max(parsed, now - 24 * 3600 * 1000);
      }
    }

    const visitKey = `hattys_last_visit_${mode}`;
    const prevVisit = localStorage.getItem(visitKey);
    if (prevVisit) {
      const parsed = parseInt(prevVisit, 10);
      if (!isNaN(parsed) && now - parsed >= 5 * 60 * 1000) {
        return Math.max(parsed, now - 24 * 3600 * 1000);
      }
    }
  } catch {}
  return defaultWindow;
}

export function saveCaughtUpTimestamp(mode: AppMode, timestamp: number = Date.now()): void {
  try {
    localStorage.setItem(`hattys_caught_up_ts_${mode}`, String(timestamp));
    localStorage.setItem(`hattys_last_visit_${mode}`, String(timestamp));
  } catch {}
}
