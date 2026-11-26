import { AppMode, Article } from '../types';
import { getEditorialPhoto } from '../config/photos';
import { classifyArticle, detectArticleRegions, isCryptoRelevantArticle } from './classifier';
import { cleanWireTitle, safeParseDate } from './textCleaner';

const CRYPTO_KEYWORDS_REGEX =
  /\b(bitcoin|btc|ethereum|eth|crypto|cryptocurrency|blockchain|web3|defi|stablecoin|solana|token|mining|coinbase|binance|vitalik|zk|smart contract)\b/i;

/**
 * Zero-Credit Browser-Direct Live USGS Earthquake & Geological Flash Wire (World News Mode).
 * Connects directly from the visitor's browser to earthquake.usgs.gov (CORS *) — 0 Netlify Function credits used.
 */
export async function fetchUsgsEarthquakeWire(): Promise<Article[]> {
  try {
    const res = await fetch(
      'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson',
      { signal: AbortSignal.timeout(5500) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const features = Array.isArray(data?.features) ? data.features : [];

    // Filter for significant seismic events (M4.9+) and sort by magnitude / recency
    const significant = features
      .filter((f: any) => typeof f?.properties?.mag === 'number' && f.properties.mag >= 4.9)
      .slice(0, 6);

    return significant.map((f: any, idx: number) => {
      const props = f.properties || {};
      const geom = f.geometry || {};
      const coords = Array.isArray(geom.coordinates) ? geom.coordinates : [];
      const mag = Number(props.mag || 5.0).toFixed(1);
      const place = String(props.place || 'Global Seismic Zone').trim();
      const depthKm = typeof coords[2] === 'number' ? Math.round(coords[2]) : null;
      const tsunami = props.tsunami === 1;
      const isMajor = Number(props.mag) >= 5.8;

      const title = cleanWireTitle(
        `${isMajor ? 'Breaking: ' : ''}M${mag} Earthquake Strikes ${place}`
      );
      const snippet = `USGS seismic sensors recorded a magnitude ${mag} earthquake centered ${place}${
        depthKm !== null ? ` at a depth of ${depthKm} km` : ''
      }.${tsunami ? ' Tsunami watch advisory flagged by USGS.' : ' No immediate tsunami advisory reported.'}`;

      const fullText = `${snippet}\n\nEvent Coordinates: ${
        typeof coords[1] === 'number' && typeof coords[0] === 'number'
          ? `${coords[1].toFixed(2)}°, ${coords[0].toFixed(2)}°`
          : 'Global Telemetry Network'
      }\nStatus: Verified by the U.S. Geological Survey (USGS) National Earthquake Information Center.`;

      const regions = detectArticleRegions(title, snippet, 'USGS Seismic Wire', 'global-wires');

      return {
        id: `world-USGS-${f.id || idx}`,
        title,
        link: props.url || 'https://earthquake.usgs.gov/earthquakes/map/',
        img: getEditorialPhoto('environment', title, 'world'),
        date: safeParseDate(props.time),
        src: 'USGS Seismic Wire',
        primaryCat: 'environment',
        matchedCategories: ['environment', 'geopolitics'],
        regions,
        snippet,
        fullText,
        readingMinutes: 1,
        mode: 'world',
      };
    });
  } catch {
    return [];
  }
}

/**
 * Zero-Credit Browser-Direct Hacker News Front-Page Tech, AI & Crypto Flash Wire.
 * Connects directly from the visitor's browser to hn.algolia.com (CORS *) — 0 Netlify Function credits used.
 */
export async function fetchHackerNewsFlashWire(targetMode: AppMode): Promise<Article[]> {
  try {
    const queryUrl =
      targetMode === 'crypto'
        ? 'https://hn.algolia.com/api/v1/search_by_date?query=bitcoin%20OR%20ethereum%20OR%20crypto%20OR%20blockchain&tags=story&numericFilters=points>20&hitsPerPage=8'
        : 'https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=12';

    const res = await fetch(queryUrl, { signal: AbortSignal.timeout(5500) });
    if (!res.ok) return [];
    const data = await res.json();
    const hits = Array.isArray(data?.hits) ? data.hits : [];

    const filteredHits = hits
      .filter((h: any) => {
        if (!h?.title || !h?.url) return false;
        if (targetMode === 'crypto') {
          return CRYPTO_KEYWORDS_REGEX.test(String(h.title)) && isCryptoRelevantArticle(String(h.title), '');
        }
        return true;
      })
      .slice(0, 6);

    return filteredHits.map((h: any, idx: number) => {
      const title = cleanWireTitle(String(h.title));
      const points = Number(h.points || 0);
      const comments = Number(h.num_comments || 0);
      let domainHost = 'news.ycombinator.com';
      try {
        domainHost = new URL(h.url).hostname.replace(/^www\./, '');
      } catch {}

      const snippet = `HN Tech Wire dispatch (${points} community points • ${comments} discussion threads via ${domainHost}).`;
      const defaultCat = targetMode === 'world' ? 'tech' : 'all';
      const { primary, matched } = classifyArticle(title, snippet, defaultCat, targetMode);
      const regions =
        targetMode === 'world'
          ? detectArticleRegions(title, snippet, 'Hacker News Wire', 'north-america')
          : undefined;

      return {
        id: `${targetMode}-HN-${h.objectID || idx}`,
        title,
        link: h.url,
        img: getEditorialPhoto(primary, title, targetMode),
        date: safeParseDate(h.created_at),
        src: 'Hacker News Wire',
        primaryCat: primary,
        matchedCategories: matched,
        regions,
        snippet,
        fullText: `${title}\n\n${snippet}\n\nOriginal Source Domain: ${domainHost}\nHacker News Discussion ID: ${h.objectID || 'live'}`,
        readingMinutes: 1,
        mode: targetMode,
      };
    });
  } catch {
    return [];
  }
}
