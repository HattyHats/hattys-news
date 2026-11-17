import { AppMode } from '../types';

export interface DailyCallRecord {
  id: string; // `${mode}-${dateStr}`
  mode: AppMode;
  assetSymbol: 'BTC' | 'SPY';
  dateStr: string; // YYYY-MM-DD local time
  direction: 'up' | 'down';
  entryPrice: number;
  createdAt: number;
  status: 'pending' | 'won' | 'lost';
  exitPrice?: number;
  resolvedAt?: number;
}

export interface DailyCallStats {
  todayCall: DailyCallRecord | null;
  lastResolvedCall: DailyCallRecord | null;
  wins: number;
  losses: number;
  totalResolved: number;
  winRatePct: number | null;
}

const DAILY_CALLS_STORAGE_KEY = 'hattys_daily_calls_v1';

export function getLocalDateStr(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function loadDailyCalls(): DailyCallRecord[] {
  try {
    const raw = localStorage.getItem(DAILY_CALLS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (c: any) =>
            c &&
            typeof c.id === 'string' &&
            (c.mode === 'crypto' || c.mode === 'world') &&
            typeof c.entryPrice === 'number' &&
            c.entryPrice > 0
        );
      }
    }
  } catch {}
  return [];
}

function saveDailyCalls(calls: DailyCallRecord[]): DailyCallRecord[] {
  const trimmed = [...calls]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 90);
  try {
    localStorage.setItem(DAILY_CALLS_STORAGE_KEY, JSON.stringify(trimmed));
  } catch {}
  return trimmed;
}

/**
 * Resolves any overdue ('pending') calls from a previous calendar day (or >20h old)
 * once real live market quotes have arrived for that asset.
 */
export function resolveDueDailyCalls(
  calls: DailyCallRecord[],
  quotes: Record<string, { price: number; change24h: number; formatted: string }>,
  liveSymbols: Set<string>
): { calls: DailyCallRecord[]; changed: boolean } {
  const today = getLocalDateStr();
  const now = Date.now();
  let changed = false;

  const updated = calls.map(call => {
    if (call.status !== 'pending') return call;

    const isDue = call.dateStr < today || now - call.createdAt >= 20 * 3600 * 1000;
    if (!isDue) return call;
    if (!liveSymbols.has(call.assetSymbol)) return call;

    const livePrice = quotes[call.assetSymbol]?.price;
    if (!livePrice || livePrice <= 0 || livePrice === call.entryPrice) {
      return call;
    }

    const won =
      (call.direction === 'up' && livePrice > call.entryPrice) ||
      (call.direction === 'down' && livePrice < call.entryPrice);

    changed = true;
    return {
      ...call,
      status: won ? ('won' as const) : ('lost' as const),
      exitPrice: livePrice,
      resolvedAt: now,
    };
  });

  if (changed) {
    return { calls: saveDailyCalls(updated), changed: true };
  }
  return { calls, changed: false };
}

export function submitDailyCall(
  existingCalls: DailyCallRecord[],
  mode: AppMode,
  direction: 'up' | 'down',
  entryPrice: number
): DailyCallRecord[] {
  if (!entryPrice || entryPrice <= 0) return existingCalls;
  const today = getLocalDateStr();
  const id = `${mode}-${today}`;
  const assetSymbol: 'BTC' | 'SPY' = mode === 'world' ? 'SPY' : 'BTC';

  // One locked call per mode per day
  if (existingCalls.some(c => c.id === id)) {
    return existingCalls;
  }

  const record: DailyCallRecord = {
    id,
    mode,
    assetSymbol,
    dateStr: today,
    direction,
    entryPrice,
    createdAt: Date.now(),
    status: 'pending',
  };

  return saveDailyCalls([record, ...existingCalls]);
}

export function computeDailyCallStats(calls: DailyCallRecord[], mode: AppMode): DailyCallStats {
  const today = getLocalDateStr();
  const todayCall = calls.find(c => c.mode === mode && c.dateStr === today) || null;

  const resolvedAll = calls.filter(c => c.status === 'won' || c.status === 'lost');
  const wins = resolvedAll.filter(c => c.status === 'won').length;
  const losses = resolvedAll.filter(c => c.status === 'lost').length;
  const totalResolved = wins + losses;
  const winRatePct = totalResolved > 0 ? Math.round((wins / totalResolved) * 100) : null;

  const lastResolvedCall =
    calls
      .filter(c => c.mode === mode && (c.status === 'won' || c.status === 'lost'))
      .sort((a, b) => (b.resolvedAt || b.createdAt) - (a.resolvedAt || a.createdAt))[0] || null;

  return {
    todayCall,
    lastResolvedCall,
    wins,
    losses,
    totalResolved,
    winRatePct,
  };
}
