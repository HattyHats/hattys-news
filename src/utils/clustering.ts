import { Article } from '../types';
import { getPublisherRoot, extractHeadlineKeywords } from './textCleaner';
import { getOutletBadge } from './classifier';

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
