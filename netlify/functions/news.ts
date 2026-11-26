import { Handler } from "@netlify/functions";
import RSSParser from "rss-parser";

const parser = new RSSParser({
  customFields: {
    item: [
      ['media:content', 'media:content', { keepArray: true }],
      ['media:thumbnail', 'media:thumbnail'],
      ['content:encoded', 'contentEncoded'],
    ],
  },
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Referer': 'https://www.google.com/',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'cross-site',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
  },
  timeout: 6500,
});

// Explicit domain allowlist to prevent Server-Side Request Forgery (SSRF)
const ALLOWED_FEED_DOMAINS = [
  'cointelegraph.com',
  'coindesk.com',
  'decrypt.co',
  'theblock.co',
  'blockworks.co',
  'bitcoinmagazine.com',
  'cryptoslate.com',
  'dailycoin.com',
  'u.today',
  'beincrypto.com',
  'ambcrypto.com',
  'thedefiant.io',
  'cryptobriefing.com',
  'bankless.com',
  'crypto.news',
  'cryptopotato.com',
  'newsbtc.com',
  'bitcoin.com',
  'techcrunch.com',
  'protos.com',
  'bitcoinist.com',
  'unchainedcrypto.com',
  'news.google.com',
  'bbci.co.uk',
  'bbc.co.uk',
  'bbc.com',
  'dw.com',
  'france24.com',
  'aljazeera.com',
  'theguardian.com',
  'cbc.ca',
  'npr.org',
  'upi.com',
  'un.org',
  'abc.net.au',
  'channelnewsasia.com',
  'africanews.com',
  'rte.ie',
  'euronews.com',
  'scmp.com',
  'middleeasteye.net',
  'mercopress.com',
  'thehindu.com',
  'cnbc.com',
  'politico.com',
  'nasa.gov',
  'space.com',
  'phys.org',
  'sciencedaily.com',
  'arstechnica.com',
  'theverge.com',
  'reuters.com',
  'apnews.com'
];

function isAllowedUrl(inputUrl: string): boolean {
  try {
    const parsed = new URL(inputUrl);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
    const hostname = parsed.hostname.toLowerCase();
    return ALLOWED_FEED_DOMAINS.some(d => hostname === d || hostname.endsWith('.' + d));
  } catch {
    return false;
  }
}

// In-memory cache for warm Lambda executions (3-minute TTL)
const lambdaFeedCache = new Map<string, { body: string; parsed: any; timestamp: number }>();

async function fetchOrGetCachedFeed(targetUrl: string, nocache: boolean): Promise<{ parsed: any; body: string; hit: boolean }> {
  const now = Date.now();
  const cached = lambdaFeedCache.get(targetUrl);
  // Even on manual refresh (nocache), reuse cache if under 35s old to avoid redundant upstream XML fetches
  const ttl = nocache ? 35000 : 180000;
  if (cached && now - cached.timestamp < ttl) {
    return { parsed: cached.parsed, body: cached.body, hit: true };
  }

  try {
    const feed = await parser.parseURL(targetUrl);
    const trimmed = {
      ...feed,
      items: Array.isArray(feed.items) ? feed.items.slice(0, 22) : [],
    };
    const bodyStr = JSON.stringify(trimmed);
    if (lambdaFeedCache.size >= 160 && !lambdaFeedCache.has(targetUrl)) {
      const oldestKey = lambdaFeedCache.keys().next().value;
      if (oldestKey) lambdaFeedCache.delete(oldestKey);
    }
    lambdaFeedCache.set(targetUrl, { body: bodyStr, parsed: trimmed, timestamp: Date.now() });
    return { parsed: trimmed, body: bodyStr, hit: false };
  } catch (err) {
    if (cached) {
      return { parsed: cached.parsed, body: cached.body, hit: true };
    }
    throw err;
  }
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      },
      body: "",
    };
  }

  const nocache =
    event.queryStringParameters?.nocache === "1" ||
    event.queryStringParameters?.nocache === "true" ||
    !!event.queryStringParameters?._t;

  // Batched Multi-Feed Endpoint: ?urls=["https://...","https://..."] (reduces Netlify Function calls by ~80%)
  const rawUrlsParam = event.queryStringParameters?.urls;
  if (rawUrlsParam) {
    let urlsList: string[] = [];
    try {
      const parsed = JSON.parse(rawUrlsParam);
      if (Array.isArray(parsed)) {
        urlsList = parsed.filter((u): u is string => typeof u === "string" && isAllowedUrl(u)).slice(0, 10);
      }
    } catch {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: "Invalid urls batch parameter" }),
      };
    }

    const results: Record<string, { items: any[] }> = {};
    await Promise.allSettled(
      urlsList.map(async (u) => {
        try {
          const { parsed } = await fetchOrGetCachedFeed(u, nocache);
          results[u] = { items: Array.isArray(parsed?.items) ? parsed.items : [] };
        } catch {
          results[u] = { items: [] };
        }
      })
    );

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": nocache
          ? "no-store, no-cache, must-revalidate, proxy-revalidate"
          : "public, max-age=180, s-maxage=180",
      },
      body: JSON.stringify({ batch: true, results }),
    };
  }

  const url = event.queryStringParameters?.url;
  if (!url) {
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: "URL parameter is required" }),
    };
  }

  if (!isAllowedUrl(url)) {
    return {
      statusCode: 403,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: "Target domain not permitted on RSS feed allowlist" }),
    };
  }

  try {
    const { body, hit } = await fetchOrGetCachedFeed(url, nocache);
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": nocache
          ? "no-store, no-cache, must-revalidate, proxy-revalidate"
          : "public, max-age=180, s-maxage=180",
        "X-Cache": hit ? "HIT" : "MISS",
        ...(nocache ? { "Pragma": "no-cache", "Expires": "0" } : {})
      },
      body,
    };
  } catch (error: any) {
    console.error(`Error fetching feed from ${url}:`, error?.message || error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: "Failed to fetch feed", details: error?.message || String(error) }),
    };
  }
};
