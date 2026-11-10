import { AppMode, DetectedAsset } from '../types';
import { CRYPTO_CATEGORY_RULES, WORLD_CATEGORY_RULES } from '../config/feeds';
import { ASSET_DEFINITIONS } from '../config/assets';

export function classifyArticle(
  title: string,
  content: string,
  feedDefaultCat: string,
  mode: AppMode
): { primary: string; matched: string[] } {
  const text = `${title} ${content}`.toLowerCase();
  const matched = new Set<string>();

  if (feedDefaultCat && feedDefaultCat !== 'all') {
    matched.add(feedDefaultCat);
  }

  const rules = mode === 'world' ? WORLD_CATEGORY_RULES : CRYPTO_CATEGORY_RULES;

  for (const [cat, regex] of Object.entries(rules)) {
    if (regex.test(text)) {
      matched.add(cat);
    }
  }

  const matchedList = Array.from(matched);
  const primary = feedDefaultCat !== 'all' ? feedDefaultCat : (matchedList[0] || 'all');
  
  return {
    primary,
    matched: matchedList
  };
}

export function detectAssetsInArticle(
  title: string,
  snippet: string | undefined,
  quotes: Record<string, { price?: number; change24h?: number; formatted?: string }>
): DetectedAsset[] {
  const matches: DetectedAsset[] = [];
  const textToScan = `${title} ${snippet || ''}`;
  const seenSymbols = new Set<string>();

  for (const def of ASSET_DEFINITIONS) {
    if (def.regex.test(textToScan)) {
      if (seenSymbols.has(def.symbol)) continue;
      seenSymbols.add(def.symbol);

      const q = def.marketKey ? quotes[def.marketKey] : quotes[def.id];
      matches.push({
        id: def.id,
        symbol: def.symbol,
        name: def.name,
        type: def.type,
        color: def.color,
        price: q?.price,
        change24h: q?.change24h,
        formatted: q?.formatted,
      });

      if (matches.length >= 3) break;
    }
  }

  return matches;
}
