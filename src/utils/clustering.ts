import { Article } from '../types';
import { getPublisherRoot, extractHeadlineKeywords } from './textCleaner';

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
