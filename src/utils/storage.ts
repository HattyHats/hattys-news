import { Article, AppMode } from '../types';
import { cleanWireTitle, cleanWireSnippet } from './textCleaner';
import { getEditorialPhoto } from '../config/photos';

export function loadCachedArticlesForMode(targetMode: AppMode): Article[] {
  try {
    const cacheKey = targetMode === 'world' ? 'hattys_news_world_cache_v3' : 'hattys_news_crypto_cache_v3';
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((a: any, idx: number) => {
          const title = cleanWireTitle(a.title || '');
          const snippet = cleanWireSnippet(a.snippet || '', title);
          const normId = title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 36) || String(idx);
          return {
            ...a,
            title,
            snippet,
            mode: targetMode,
            id: `${targetMode}-${a.src || 'wire'}-${normId}`,
            img: (a.img && !a.img.startsWith('data:image/svg+xml;utf8')) ? a.img : getEditorialPhoto(a.primaryCat, title, targetMode),
            date: new Date(a.date)
          };
        });
      }
    }
  } catch {}
  return [];
}

export function saveArticlesCache(targetMode: AppMode, articles: Article[]) {
  try {
    const cacheKey = targetMode === 'world' ? 'hattys_news_world_cache_v3' : 'hattys_news_crypto_cache_v3';
    // Strict isolation: only save articles matching targetMode to target cache
    const isolated = articles.filter(a => !a.mode || a.mode === targetMode);
    localStorage.setItem(cacheKey, JSON.stringify(isolated.slice(0, 250)));
  } catch {}
}
