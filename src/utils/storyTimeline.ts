import { Article } from '../types';
import { extractHeadlineKeywords } from './textCleaner';

export interface TimelineNode {
  article: Article;
  stageLabel: string;
  deltaFromPrev: string | null;
  utcTimeStr: string;
  isOrigin: boolean;
  isLatest: boolean;
  isCurrent: boolean;
}

function formatDeltaMs(ms: number): string {
  const totalMins = Math.max(1, Math.round(ms / 60000));
  if (totalMins < 60) {
    return `+${totalMins}m later`;
  }
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hours < 24) {
    return mins > 0 ? `+${hours}h ${mins}m later` : `+${hours}h later`;
  }
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return remHours > 0 ? `+${days}d ${remHours}h later` : `+${days}d later`;
}

function formatUtcClock(date: Date): string {
  try {
    return date.toISOString().slice(11, 16) + ' UTC';
  } catch {
    return 'LIVE UTC';
  }
}

/**
 * Builds a chronological developing-story timeline from:
 * 1) Direct cross-outlet cluster matches (`directRelated`)
 * 2) Broader topic/entity thread matches across `allModeArticles` (when available)
 */
export function buildStoryTimeline(
  currentArticle: Article,
  directRelated: Article[],
  allModeArticles: Article[] = []
): TimelineNode[] {
  const seenIds = new Set<string>([currentArticle.id]);
  const seenLinks = new Set<string>([currentArticle.link]);
  const candidates: Article[] = [currentArticle];

  for (const rel of directRelated) {
    if (!seenIds.has(rel.id) && !seenLinks.has(rel.link)) {
      seenIds.add(rel.id);
      seenLinks.add(rel.link);
      candidates.push(rel);
    }
  }

  // If we have fewer than 5 timeline items, find broader narrative thread dispatches sharing >= 2 key tokens
  if (candidates.length < 5 && allModeArticles.length > 0) {
    const targetTokens = extractHeadlineKeywords(currentArticle.title);
    if (targetTokens.length >= 2) {
      const targetSet = new Set(targetTokens);
      const scored: { article: Article; overlap: number }[] = [];

      for (const candidate of allModeArticles) {
        if (seenIds.has(candidate.id) || seenLinks.has(candidate.link)) continue;
        // Within 48 hours of currentArticle
        const timeDiff = Math.abs(candidate.date.getTime() - currentArticle.date.getTime());
        if (timeDiff > 48 * 3600 * 1000) continue;

        const candTokens = extractHeadlineKeywords(candidate.title);
        let overlap = 0;
        for (const t of candTokens) {
          if (targetSet.has(t)) overlap++;
        }

        if (overlap >= 2) {
          scored.push({ article: candidate, overlap });
        }
      }

      scored.sort((a, b) => b.overlap - a.overlap || b.article.date.getTime() - a.article.date.getTime());
      for (const item of scored) {
        if (candidates.length >= 6) break;
        seenIds.add(item.article.id);
        seenLinks.add(item.article.link);
        candidates.push(item.article);
      }
    }
  }

  // Sort chronologically: oldest (origin) -> newest (latest)
  const chronological = [...candidates].sort((a, b) => a.date.getTime() - b.date.getTime());

  return chronological.map((art, idx) => {
    const isOrigin = idx === 0;
    const isLatest = idx === chronological.length - 1 && chronological.length > 1;
    const prevDate = idx > 0 ? chronological[idx - 1].date : null;
    const deltaMs = prevDate ? Math.max(0, art.date.getTime() - prevDate.getTime()) : 0;

    let stageLabel = 'DEVELOPING UPDATE';
    if (isOrigin && chronological.length > 1) {
      stageLabel = 'INITIAL WIRE BREAK';
    } else if (isLatest) {
      stageLabel = 'LATEST DISPATCH';
    } else if (chronological.length === 1) {
      stageLabel = 'PRIMARY DISPATCH';
    }

    return {
      article: art,
      stageLabel,
      deltaFromPrev: prevDate ? formatDeltaMs(deltaMs) : null,
      utcTimeStr: formatUtcClock(art.date),
      isOrigin,
      isLatest,
      isCurrent: art.id === currentArticle.id,
    };
  });
}
