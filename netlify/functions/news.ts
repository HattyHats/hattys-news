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
  timeout: 15000,
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
  'news.google.com',
  'bbci.co.uk',
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
  'nasa.gov',
  'phys.org',
  'arstechnica.com',
  'theverge.com'
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
const lambdaFeedCache = new Map<string, { body: string; timestamp: number }>();

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

  const url = event.queryStringParameters?.url;
  const nocache = event.queryStringParameters?.nocache === "1" || event.queryStringParameters?.nocache === "true" || !!event.queryStringParameters?._t;

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

  const now = Date.now();
  const cached = lambdaFeedCache.get(url);
  if (!nocache && cached && (now - cached.timestamp < 180000)) {
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=180, s-maxage=180",
        "X-Cache": "HIT"
      },
      body: cached.body,
    };
  }

  try {
    const feed = await parser.parseURL(url);
    const bodyStr = JSON.stringify(feed);
    lambdaFeedCache.set(url, { body: bodyStr, timestamp: Date.now() });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": nocache
          ? "no-store, no-cache, must-revalidate, proxy-revalidate"
          : "public, max-age=180, s-maxage=180",
        "X-Cache": "MISS",
        ...(nocache ? { "Pragma": "no-cache", "Expires": "0" } : {})
      },
      body: bodyStr,
    };
  } catch (error: any) {
    console.error(`Error fetching feed from ${url}:`, error?.message || error);
    if (cached) {
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=60",
          "X-Cache": "STALE-FALLBACK"
        },
        body: cached.body,
      };
    }
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
