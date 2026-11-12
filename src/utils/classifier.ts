import { AppMode, DetectedAsset, StoryImpact, OutletMeta } from '../types';
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

// Feature 4: Macro Story Impact Classifier
export function detectStoryImpact(title: string, snippet?: string): StoryImpact | null {
  const text = `${title} ${snippet || ''}`.toLowerCase();

  if (/\b(breaking|emergency|crisis|historic|landmark|collapse|unprecedented|missile|attack|ceasefire|disaster)\b/i.test(text)) {
    return {
      type: 'BREAKING',
      label: '⚡ BREAKING WIRE',
      badgeClass: 'bg-red-500/15 text-red-500 border-red-500/35'
    };
  }

  if (/\b(sec|cftc|fed|federal reserve|powell|interest rate|rates cut|rate hike|subpoena|lawsuit|gensler|treasury|indictment|bipartisan|sanctions|court|ruling|verdict)\b/i.test(text)) {
    return {
      type: 'POLICY',
      label: '🏛️ MACRO / POLICY',
      badgeClass: 'bg-purple-500/15 text-purple-400 border-purple-500/35'
    };
  }

  if (/\b(all-time high|ath|rally|surges|surged|surging|gains|bull|bullish|skyrockets|soars|inflows|inflow|breakout|expansion|record high)\b/i.test(text)) {
    return {
      type: 'BULLISH',
      label: '📈 BULLISH CATALYST',
      badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/35'
    };
  }

  if (/\b(plunges|plunged|crash|crashes|dump|dumps|bearish|losses|drops|slumps|tumbles|liquidated|liquidation|hack|exploited|drain|outflows)\b/i.test(text)) {
    return {
      type: 'BEARISH',
      label: '📉 BEARISH VOLATILITY',
      badgeClass: 'bg-rose-500/15 text-rose-400 border-rose-500/35'
    };
  }

  return null;
}

// Feature 5: Outlet Country & Wire Desk Badges
export function getOutletBadge(src: string): OutletMeta {
  const s = (src || '').toLowerCase();
  if (s.includes('reuters')) return { name: 'Reuters', flag: '🌐', region: 'GLOBAL' };
  if (s.includes('associated press') || s.includes('ap news') || s === 'ap') return { name: 'AP News', flag: '🇺🇸', region: 'US' };
  if (s.includes('bbc')) return { name: src, flag: '🇬🇧', region: 'UK' };
  if (s.includes('npr')) return { name: src, flag: '🇺🇸', region: 'US' };
  if (s.includes('pbs')) return { name: 'PBS', flag: '🇺🇸', region: 'US' };
  if (s.includes('dw') || s.includes('deutsche')) return { name: 'DW News', flag: '🇩🇪', region: 'DE' };
  if (s.includes('france')) return { name: 'France 24', flag: '🇫🇷', region: 'FR' };
  if (s.includes('al jazeera')) return { name: 'Al Jazeera', flag: '🇶🇦', region: 'ME' };
  if (s.includes('cbc')) return { name: 'CBC', flag: '🇨🇦', region: 'CA' };
  if (s.includes('abc')) return { name: 'ABC News', flag: '🇦🇺', region: 'AU' };
  if (s.includes('cna') || s.includes('channel news')) return { name: 'CNA', flag: '🇸🇬', region: 'SG' };
  if (s.includes('nhk')) return { name: 'NHK World', flag: '🇯🇵', region: 'JP' };
  if (s.includes('un news') || s === 'un') return { name: 'UN News', flag: '🇺🇳', region: 'GLOBAL' };
  if (s.includes('upi')) return { name: 'UPI', flag: '🇺🇸', region: 'US' };
  if (s.includes('nasa')) return { name: 'NASA', flag: '🚀', region: 'SPACE' };
  if (s.includes('space.com')) return { name: 'Space.com', flag: '🌌', region: 'SPACE' };
  if (s.includes('phys.org')) return { name: 'Phys.org', flag: '🔬', region: 'SCIENCE' };
  if (s.includes('sciencedaily')) return { name: 'ScienceDaily', flag: '🧪', region: 'SCIENCE' };
  if (s.includes('ars technica')) return { name: 'Ars Technica', flag: '💻', region: 'TECH' };
  if (s.includes('verge')) return { name: 'The Verge', flag: '⚡', region: 'TECH' };
  if (s.includes('bitcoin')) return { name: src, flag: '₿', region: 'CRYPTO' };
  return { name: src, flag: '⚡', region: 'CRYPTO' };
}
