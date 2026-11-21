import { Article, AppMode, TrendingTopic } from '../types';
import { getPublisherRoot, extractHeadlineKeywords } from './textCleaner';
import { getOutletBadge, detectAssetsInArticle, detectStoryImpact, isGlobalBlindspot } from './classifier';
import { WORLD_REGIONS, CRYPTO_CATEGORIES, WORLD_CATEGORIES } from '../config/feeds';

export interface BrokeFirstInfo {
  outlet: string;
  src: string;
  date: Date;
  leadMinutes: number;
  isCurrentArticle: boolean;
}

export function getBrokeFirstInfo(article: Article, related: Article[]): BrokeFirstInfo | null {
  if (!related || related.length === 0) return null;
  const all = [article, ...related].filter(a => a && a.date instanceof Date && !isNaN(a.date.getTime()));
  if (all.length < 2) return null;

  const sorted = [...all].sort((a, b) => a.date.getTime() - b.date.getTime());
  const earliest = sorted[0];
  const second = sorted[1];
  const leadMinutes = Math.max(0, Math.round((second.date.getTime() - earliest.date.getTime()) / 60000));
  const badge = getOutletBadge(earliest.src);

  return {
    outlet: badge.name || earliest.src,
    src: earliest.src,
    date: earliest.date,
    leadMinutes,
    isCurrentArticle: earliest.id === article.id,
  };
}

/**
 * Freshness-Bracketed Round-Robin Publisher Diversity Interleaver:
 * Prevents high-volume wires from flooding the top of the feed, prioritizes user-pinned outlets,
 * and rotates publisher queue order within each recency bracket on refresh so every visit surfaces new sources.
 */
export function interleaveArticlesByDiversity(
  articles: Article[],
  pinnedSources: string[] = [],
  rotationSeed = 0
): Article[] {
  if (articles.length <= 2) return articles;

  const pinnedSet = new Set(pinnedSources.map(s => s.toLowerCase()));
  const now = Date.now();
  // 5 freshness brackets in milliseconds: 0-50m, 50m-2.5h, 2.5h-6h, 6h-18h, 18h+
  const bracketLimits = [50 * 60 * 1000, 150 * 60 * 1000, 6 * 3600 * 1000, 18 * 3600 * 1000, Infinity];
  const brackets: Article[][] = [[], [], [], [], []];

  const sortedByTime = [...articles].sort((a, b) => b.date.getTime() - a.date.getTime());

  for (const art of sortedByTime) {
    const age = Math.max(0, now - art.date.getTime());
    let bIdx = bracketLimits.findIndex(limit => age <= limit);
    if (bIdx === -1) bIdx = brackets.length - 1;
    brackets[bIdx].push(art);
  }

  const result: Article[] = [];

  brackets.forEach((bucket, bIdx) => {
    if (bucket.length === 0) return;

    const pinnedInBucket: Article[] = [];
    const regularInBucket: Article[] = [];

    for (const art of bucket) {
      if (pinnedSet.has(art.src.toLowerCase())) {
        pinnedInBucket.push(art);
      } else {
        regularInBucket.push(art);
      }
    }

    // Add pinned articles first in chronological order
    result.push(...pinnedInBucket);

    // Group remaining by publisher root for round-robin diversity
    const pubQueues = new Map<string, Article[]>();
    for (const art of regularInBucket) {
      const root = getPublisherRoot(art.src);
      let q = pubQueues.get(root);
      if (!q) {
        q = [];
        pubQueues.set(root, q);
      }
      q.push(art);
    }

    let queueList = Array.from(pubQueues.values());
    if (queueList.length > 1 && rotationSeed > 0) {
      const shift = (rotationSeed + bIdx) % queueList.length;
      queueList = [...queueList.slice(shift), ...queueList.slice(0, shift)];
    }

    let added = true;
    while (added) {
      added = false;
      for (const q of queueList) {
        const nextArt = q.shift();
        if (nextArt) {
          result.push(nextArt);
          added = true;
        }
      }
    }
  });

  return result;
}

export function computeArticleClusters(articles: Article[]): Map<string, Article[]> {
  const map = new Map<string, Article[]>();
  const tokenized = articles.map(a => ({
    article: a,
    pubRoot: getPublisherRoot(a.src),
    tokens: new Set(extractHeadlineKeywords(a.title)),
    time: a.date.getTime()
  }));

  for (let i = 0; i < tokenized.length; i++) {
    const itemA = tokenized[i];
    if (itemA.tokens.size < 2) continue;
    const related: Article[] = [];
    const seenPublishers = new Set<string>([itemA.pubRoot]);

    for (let j = 0; j < tokenized.length; j++) {
      if (i === j) continue;
      const itemB = tokenized[j];
      if (seenPublishers.has(itemB.pubRoot)) continue;
      if (Math.abs(itemA.time - itemB.time) > 48 * 3600 * 1000) continue;

      let shared = 0;
      for (const tok of itemA.tokens) {
        if (itemB.tokens.has(tok)) shared++;
      }

      if (shared >= 2) {
        seenPublishers.add(itemB.pubRoot);
        related.push(itemB.article);
        if (related.length >= 4) break;
      }
    }

    if (related.length > 0) {
      map.set(itemA.article.id, related);
    }
  }

  return map;
}

const CURATED_TRENDING_ENTITIES: Record<AppMode, { label: string; term: string; regex: RegExp }[]> = {
  crypto: [
    { label: 'Bitcoin', term: 'Bitcoin', regex: /\b(bitcoin|btc)\b/i },
    { label: 'Ethereum', term: 'Ethereum', regex: /\b(ethereum|eth)\b/i },
    { label: 'Solana', term: 'Solana', regex: /\b(solana|sol)\b/i },
    { label: 'XRP', term: 'XRP', regex: /\b(xrp|ripple)\b/i },
    { label: 'Spot ETF', term: 'ETF', regex: /\b(etf|etfs|blackrock|ibit)\b/i },
    { label: 'SEC / Policy', term: 'SEC', regex: /\b(sec|cftc|regulation|lawsuit|congress)\b/i },
    { label: 'DeFi', term: 'DeFi', regex: /\b(defi|uniswap|aave|staking|tvl|yield)\b/i },
    { label: 'Stablecoins', term: 'Stablecoin', regex: /\b(stablecoin|stablecoins|usdt|tether|usdc|circle)\b/i },
    { label: 'AI & Crypto', term: 'AI', regex: /\b(ai|artificial intelligence|agent|gpu)\b/i },
    { label: 'Mining', term: 'Mining', regex: /\b(mining|miner|miners|hashrate)\b/i },
    { label: 'Cardano', term: 'Cardano', regex: /\b(cardano|ada)\b/i },
    { label: 'Dogecoin', term: 'Dogecoin', regex: /\b(dogecoin|doge)\b/i },
  ],
  world: [
    { label: 'AI & Chips', term: 'AI', regex: /\b(ai|artificial intelligence|openai|nvidia|chip|semiconductor)\b/i },
    { label: 'Tariffs & Trade', term: 'Tariffs', regex: /\b(tariff|tariffs|trade war|exports|imports|sanctions)\b/i },
    { label: 'Ukraine / Russia', term: 'Ukraine', regex: /\b(ukraine|ukrainian|kyiv|russia|moscow|zelensky|putin)\b/i },
    { label: 'Middle East', term: 'Gaza', regex: /\b(gaza|israel|iran|lebanon|ceasefire|tehran|jerusalem)\b/i },
    { label: 'Fed & Rates', term: 'Fed', regex: /\b(federal reserve|fed\b|interest rate|inflation|powell|central bank)\b/i },
    { label: 'China', term: 'China', regex: /\b(china|chinese|beijing|taiwan)\b/i },
    { label: 'Energy & Oil', term: 'Oil', regex: /\b(oil|crude|opec|energy|natural gas|solar|nuclear)\b/i },
    { label: 'European Union', term: 'Europe', regex: /\b(european union|\beu\b|brussels|nato|germany|france|uk)\b/i },
    { label: 'Space & NASA', term: 'Space', regex: /\b(nasa|space|spacex|orbit|satellite|moon|mars|telescope)\b/i },
    { label: 'United Nations', term: 'UN', regex: /\b(united nations|\bun\b|security council)\b/i },
    { label: 'Climate', term: 'Climate', regex: /\b(climate|earthquake|wildfire|hurricane|emissions|flood)\b/i },
    { label: 'India', term: 'India', regex: /\b(india|indian|new delhi|mumbai)\b/i },
  ],
};

/**
 * Feature 1: Live "Trending Right Now" Topic Detector
 * Scans the active feed pool to identify the top 5 topics spiking across multiple independent publishers right now.
 */
export function extractTrendingTopics(
  articles: Article[],
  mode: AppMode,
  maxTopics = 5
): TrendingTopic[] {
  if (!articles || articles.length === 0) return [];

  const definitions = CURATED_TRENDING_ENTITIES[mode];
  const scored: TrendingTopic[] = [];

  for (const def of definitions) {
    let count = 0;
    const pubs = new Set<string>();
    for (const art of articles) {
      const text = `${art.title} ${art.snippet || ''}`;
      if (def.regex.test(text)) {
        count++;
        pubs.add(getPublisherRoot(art.src));
      }
    }
    if (count >= 3 && pubs.size >= 2) {
      scored.push({
        term: def.term,
        label: def.label,
        count,
        pubCount: pubs.size,
      });
    }
  }

  scored.sort((a, b) => b.count - a.count || b.pubCount - a.pubCount);
  return scored.slice(0, maxTopics);
}

/**
 * Feature 2: "10-Second Key Takeaways" Bullet Generator for the Terminal Reader Drawer
 */
export function buildArticleTakeaways(
  article: Article,
  related: Article[],
  mode: AppMode,
  marketQuotes: Record<string, { price: number; change24h: number; formatted: string }>
): string[] {
  const cardMode = article.mode || mode;
  const outlet = getOutletBadge(article.src);
  const brokeFirst = getBrokeFirstInfo(article, related);
  const impact = detectStoryImpact(article.title, article.snippet);
  const detectedAssets = detectAssetsInArticle(article.title, article.snippet || article.fullText, marketQuotes);
  const blindspot = cardMode === 'world' && isGlobalBlindspot(article, related);

  const takeaways: string[] = [];

  // Bullet 1: Core Lead Fact
  const rawLead = (article.snippet || article.fullText || '').replace(/\s+/g, ' ').trim();
  const firstSentenceMatch = rawLead.match(/^(.{35,200}?[.!?])(?:\s|$)/);
  if (firstSentenceMatch && firstSentenceMatch[1]) {
    takeaways.push(firstSentenceMatch[1].trim());
  } else if (rawLead.length >= 35) {
    takeaways.push(rawLead.length > 180 ? `${rawLead.slice(0, 177).trim()}...` : rawLead);
  } else {
    takeaways.push(`${outlet.name} reports: "${article.title}".`);
  }

  // Bullet 2: Sector, Regional Scope & Market Assets
  const cats = cardMode === 'world' ? WORLD_CATEGORIES : CRYPTO_CATEGORIES;
  const catLabel = cats.find(c => c.id === article.primaryCat)?.label || article.primaryCat.toUpperCase();
  const regionLabels =
    cardMode === 'world' && article.regions && article.regions.length > 0
      ? article.regions
          .map(rid => WORLD_REGIONS.find(r => r.id === rid)?.label)
          .filter(Boolean)
          .slice(0, 2)
      : [];

  let scopeBullet = `Classified under ${catLabel}`;
  if (regionLabels.length > 0) {
    scopeBullet += ` (${regionLabels.join(' • ')})`;
  }
  if (impact) {
    scopeBullet += ` • Signal: ${impact.label.replace(/^[^\w]+/, '').trim()}`;
  }
  if (detectedAssets.length > 0) {
    const assetSummary = detectedAssets
      .slice(0, 3)
      .map(a => {
        const chg = typeof a.change24h === 'number' ? ` (${a.change24h >= 0 ? '+' : ''}${a.change24h.toFixed(1)}%)` : '';
        return `$${a.symbol}${a.formatted ? ` ${a.formatted}` : ''}${chg}`;
      })
      .join(', ');
    scopeBullet += ` • Active tickers: ${assetSummary}.`;
  } else {
    scopeBullet += ` • Dispatched via ${outlet.flag} ${outlet.name} (${outlet.region} Desk).`;
  }
  takeaways.push(scopeBullet);

  // Bullet 3: Multi-Wire Corroboration, "Broke First", & Blindspot Context
  if (related.length > 0) {
    const otherNames = related.map(r => getOutletBadge(r.src).name).slice(0, 3).join(', ');
    const brokeNote = brokeFirst
      ? brokeFirst.isCurrentArticle
        ? `${outlet.name} broke this story first`
        : `First reported by ${brokeFirst.outlet}${brokeFirst.leadMinutes > 0 ? ` (${brokeFirst.leadMinutes}m ahead)` : ''}`
      : 'Multi-wire consensus';
    takeaways.push(
      `Corroborated across ${related.length + 1} independent wires (including ${otherNames}) • ${brokeNote}.${
        blindspot ? ' Flagged as a Global Blindspot (0 US domestic media coverage).' : ''
      }`
    );
  } else if (blindspot) {
    takeaways.push(
      `Global Blindspot dispatch from ${outlet.name} (${outlet.region} Desk) covering international developments with little or no mainstream US coverage.`
    );
  } else {
    takeaways.push(
      `Direct wire dispatch from ${outlet.name} • Live cross-checking active across ${cardMode === 'world' ? '45+ global' : '24+ crypto'} news desks.`
    );
  }

  return takeaways;
}
