import { AppMode, Article } from '../types';
import { ASSET_DEFINITIONS } from '../config/assets';

const RADAR_STORAGE_PREFIX = 'hattys_radar_terms_v1_';

export const CRYPTO_RADAR_SUGGESTIONS = [
  'BTC',
  'ETH',
  'SOL',
  'NEAR',
  'ADA',
  'XRP',
  'ETF',
  'SEC',
  'DeFi',
  'AI',
];

export const WORLD_RADAR_SUGGESTIONS = [
  'Oil',
  'Gold',
  'Fed',
  'Tariffs',
  'AI',
  'NVDA',
  'SPY',
  'China',
  'Ukraine',
  'Space',
];

export function loadRadarTerms(mode: AppMode): string[] {
  try {
    const raw = localStorage.getItem(`${RADAR_STORAGE_PREFIX}${mode}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
          .slice(0, 12);
      }
    }
  } catch {}
  return [];
}

export function saveRadarTerms(mode: AppMode, terms: string[]): string[] {
  const cleaned: string[] = [];
  const seen = new Set<string>();
  for (const t of terms) {
    const trimmed = t.trim().slice(0, 30);
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    cleaned.push(trimmed);
    if (cleaned.length >= 12) break;
  }
  try {
    localStorage.setItem(`${RADAR_STORAGE_PREFIX}${mode}`, JSON.stringify(cleaned));
  } catch {}
  return cleaned;
}

export function matchesSingleRadarTerm(article: Article, rawTerm: string): boolean {
  const q = rawTerm.trim().toLowerCase();
  if (!q) return false;
  const cleanQ = q.replace(/^\$/, '').trim();
  if (!cleanQ) return false;

  const assetDef = ASSET_DEFINITIONS.find(
    d =>
      d.symbol.toLowerCase() === cleanQ ||
      d.id.toLowerCase() === cleanQ ||
      d.name.toLowerCase() === cleanQ
  );

  if (assetDef && assetDef.regex.test(`${article.title} ${article.snippet || ''}`)) {
    return true;
  }

  return (
    article.title.toLowerCase().includes(cleanQ) ||
    article.src.toLowerCase().includes(cleanQ) ||
    Boolean(article.snippet && article.snippet.toLowerCase().includes(cleanQ)) ||
    Boolean(article.fullText && article.fullText.toLowerCase().includes(cleanQ))
  );
}

export function matchesAnyRadarTerm(article: Article, terms: string[]): boolean {
  if (!terms || terms.length === 0) return false;
  return terms.some(term => matchesSingleRadarTerm(article, term));
}
