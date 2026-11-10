import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 4000;
const distPath = path.join(__dirname, "dist");

// Explicit domain allowlist to prevent Server-Side Request Forgery (SSRF)
const ALLOWED_FEED_DOMAINS = [
  'cointelegraph.com', 'coindesk.com', 'decrypt.co', 'theblock.co', 'blockworks.co',
  'bitcoinmagazine.com', 'cryptoslate.com', 'dailycoin.com', 'u.today', 'beincrypto.com',
  'ambcrypto.com', 'thedefiant.io', 'cryptobriefing.com', 'bankless.com', 'crypto.news',
  'cryptopotato.com', 'newsbtc.com', 'bitcoin.com', 'news.google.com', 'bbci.co.uk',
  'dw.com', 'france24.com', 'aljazeera.com', 'theguardian.com', 'cbc.ca', 'npr.org',
  'upi.com', 'un.org', 'abc.net.au', 'channelnewsasia.com', 'africanews.com', 'rte.ie',
  'nasa.gov', 'phys.org', 'arstechnica.com', 'theverge.com'
];

function isAllowedUrl(inputUrl) {
  try {
    const parsed = new URL(inputUrl);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
    const hostname = parsed.hostname.toLowerCase();
    return ALLOWED_FEED_DOMAINS.some(d => hostname === d || hostname.endsWith('.' + d));
  } catch {
    return false;
  }
}

// Zero-dependency XML RSS/Atom Parser
function parseXmlFeed(xmlText) {
  const items = [];
  const itemRegex = /<(?:item|entry)[\s>]([\s\S]*?)<\/(?:item|entry)>/gi;
  let match;

  function getTag(block, tag) {
    const r = new RegExp(`<${tag}(?:\\s+[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i');
    const m = block.match(r);
    if (!m) return '';
    let val = m[1].trim();
    val = val.replace(/^<!\[CDATA\[([\s\S]*?)\]\]>$/i, '$1').trim();
    return val
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'");
  }

  function getAttr(block, tag, attr) {
    const r = new RegExp(`<${tag}[^>]*\\s+${attr}=["']([^"']+)["'][^>]*\\/?>`, 'i');
    const m = block.match(r);
    return m ? m[1] : '';
  }

  while ((match = itemRegex.exec(xmlText)) !== null) {
    const block = match[1];
    const title = getTag(block, 'title');
    let link = getTag(block, 'link');
    if (!link) {
      link = getAttr(block, 'link', 'href');
    }

    const pubDate = getTag(block, 'pubDate') || getTag(block, 'published') || getTag(block, 'updated') || getTag(block, 'dc:date');
    const description = getTag(block, 'description') || getTag(block, 'summary');
    const contentEncoded = getTag(block, 'content:encoded') || getTag(block, 'content');

    const contentSnippet = (description || contentEncoded)
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const enclosureUrl = getAttr(block, 'enclosure', 'url');
    const mediaContentUrl = getAttr(block, 'media:content', 'url');
    const mediaThumbnailUrl = getAttr(block, 'media:thumbnail', 'url');

    const item = {
      title,
      link,
      pubDate,
      isoDate: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      contentSnippet: contentSnippet.slice(0, 300),
      description,
      content: contentEncoded || description,
      contentEncoded,
    };

    if (enclosureUrl) {
      item.enclosure = { url: enclosureUrl };
    }
    if (mediaContentUrl) {
      item['media:content'] = [{ $: { url: mediaContentUrl } }];
    }
    if (mediaThumbnailUrl) {
      item['media:thumbnail'] = { $: { url: mediaThumbnailUrl } };
    }

    items.push(item);
  }

  return { items };
}

// MIME types for static assets
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8'
};

// Cache for market quotes (30-second TTL)
let marketCache = { data: null, timestamp: 0 };
// In-memory cache for RSS feeds (3-minute TTL)
const newsFeedCache = new Map();

async function fetchMarketQuotes() {
  const symbols = [
    'BTC-USD', 'ETH-USD', 'SOL-USD', 'XRP-USD', 'DOGE-USD',
    'BNB-USD', 'ADA-USD', 'AVAX-USD', 'LINK-USD',
    'CL=F', 'BZ=F', 'GC=F', 'SI=F', 'NG=F', 'HG=F',
    'SPY', 'QQQ', 'DIA', 'IWM', 'EWU', 'EWG', 'FEZ', 'EWJ',
    'NVDA', 'AAPL', 'MSFT', 'AMZN', 'GOOGL', 'TSLA', 'META'
  ];

  const results = {};
  await Promise.all(symbols.map(async (sym) => {
    try {
      const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=1d`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      if (!r.ok) return;
      const json = await r.json();
      const meta = json.chart?.result?.[0]?.meta;
      if (meta && meta.regularMarketPrice) {
        const price = meta.regularMarketPrice;
        const prev = meta.chartPreviousClose || meta.previousClose || price;
        const change = prev ? ((price - prev) / prev) * 100 : 0;
        results[sym] = { price, prev, change };
      }
    } catch (e) {}
  }));

  const payload = {
    crypto: {
      BTC: {
        symbol: 'BTC',
        name: 'Bitcoin',
        price: results['BTC-USD']?.price ?? 91420.50,
        change24h: results['BTC-USD']?.change ?? 2.15,
        formatted: `$${(results['BTC-USD']?.price ?? 91420.50).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      },
      ETH: {
        symbol: 'ETH',
        name: 'Ethereum',
        price: results['ETH-USD']?.price ?? 3340.20,
        change24h: results['ETH-USD']?.change ?? 1.84,
        formatted: `$${(results['ETH-USD']?.price ?? 3340.20).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      },
      SOL: {
        symbol: 'SOL',
        name: 'Solana',
        price: results['SOL-USD']?.price ?? 102.26,
        change24h: results['SOL-USD']?.change ?? 0.09,
        formatted: `$${(results['SOL-USD']?.price ?? 102.26).toFixed(2)}`
      },
      XRP: {
        symbol: 'XRP',
        name: 'XRP',
        price: results['XRP-USD']?.price ?? 1.3020,
        change24h: results['XRP-USD']?.change ?? 1.01,
        formatted: `$${(results['XRP-USD']?.price ?? 1.3020).toFixed(4)}`
      },
      DOGE: {
        symbol: 'DOGE',
        name: 'Dogecoin',
        price: results['DOGE-USD']?.price ?? 0.0778,
        change24h: results['DOGE-USD']?.change ?? -0.87,
        formatted: `$${(results['DOGE-USD']?.price ?? 0.0778).toFixed(4)}`
      },
      BNB: {
        symbol: 'BNB',
        name: 'BNB',
        price: results['BNB-USD']?.price ?? 684.20,
        change24h: results['BNB-USD']?.change ?? -1.58,
        formatted: `$${(results['BNB-USD']?.price ?? 684.20).toFixed(2)}`
      },
      ADA: {
        symbol: 'ADA',
        name: 'Cardano',
        price: results['ADA-USD']?.price ?? 0.4210,
        change24h: results['ADA-USD']?.change ?? 0.85,
        formatted: `$${(results['ADA-USD']?.price ?? 0.4210).toFixed(4)}`
      },
      AVAX: {
        symbol: 'AVAX',
        name: 'Avalanche',
        price: results['AVAX-USD']?.price ?? 24.80,
        change24h: results['AVAX-USD']?.change ?? 1.42,
        formatted: `$${(results['AVAX-USD']?.price ?? 24.80).toFixed(2)}`
      },
      LINK: {
        symbol: 'LINK',
        name: 'Chainlink',
        price: results['LINK-USD']?.price ?? 14.65,
        change24h: results['LINK-USD']?.change ?? 2.10,
        formatted: `$${(results['LINK-USD']?.price ?? 14.65).toFixed(2)}`
      }
    },
    commodities: {
      OIL_CRUDE: {
        price: results['CL=F']?.price ?? 103.27,
        change24h: results['CL=F']?.change ?? 3.82,
        formatted: `$${(results['CL=F']?.price ?? 103.27).toFixed(2)}`
      },
      OIL_BRENT: {
        price: results['BZ=F']?.price ?? 111.70,
        change24h: results['BZ=F']?.change ?? 2.80,
        formatted: `$${(results['BZ=F']?.price ?? 111.70).toFixed(2)}`
      },
      GOLD: {
        price: results['GC=F']?.price ?? 4007.90,
        change24h: results['GC=F']?.change ?? -1.29,
        formatted: `$${(results['GC=F']?.price ?? 4007.90).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      },
      SILVER: {
        price: results['SI=F']?.price ?? 53.95,
        change24h: results['SI=F']?.change ?? -1.92,
        formatted: `$${(results['SI=F']?.price ?? 53.95).toFixed(2)}`
      },
      NAT_GAS: {
        price: results['NG=F']?.price ?? 3.05,
        change24h: results['NG=F']?.change ?? -3.36,
        formatted: `$${(results['NG=F']?.price ?? 3.05).toFixed(3)}`
      },
      COPPER: {
        price: results['HG=F']?.price ?? 6.51,
        change24h: results['HG=F']?.change ?? 1.72,
        formatted: `$${(results['HG=F']?.price ?? 6.51).toFixed(3)}`
      }
    },
    stocks: {
      SPY: {
        symbol: 'S&P 500',
        price: results['SPY']?.price ?? 759.97,
        change24h: results['SPY']?.change ?? -0.52,
        formatted: `$${(results['SPY']?.price ?? 759.97).toFixed(2)}`
      },
      QQQ: {
        symbol: 'NASDAQ 100',
        price: results['QQQ']?.price ?? 704.40,
        change24h: results['QQQ']?.change ?? -0.01,
        formatted: `$${(results['QQQ']?.price ?? 704.40).toFixed(2)}`
      },
      DIA: {
        symbol: 'DOW JONES',
        price: results['DIA']?.price ?? 521.37,
        change24h: results['DIA']?.change ?? -1.24,
        formatted: `$${(results['DIA']?.price ?? 521.37).toFixed(2)}`
      },
      IWM: {
        symbol: 'RUSSELL 2000',
        price: results['IWM']?.price ?? 241.80,
        change24h: results['IWM']?.change ?? 0.42,
        formatted: `$${(results['IWM']?.price ?? 241.80).toFixed(2)}`
      },
      EWU: {
        symbol: 'FTSE 100',
        price: results['EWU']?.price ?? 38.45,
        change24h: results['EWU']?.change ?? 0.31,
        formatted: `$${(results['EWU']?.price ?? 38.45).toFixed(2)}`
      },
      EWG: {
        symbol: 'DAX 40',
        price: results['EWG']?.price ?? 35.90,
        change24h: results['EWG']?.change ?? 0.64,
        formatted: `$${(results['EWG']?.price ?? 35.90).toFixed(2)}`
      },
      FEZ: {
        symbol: 'EURO STOXX 50',
        price: results['FEZ']?.price ?? 53.20,
        change24h: results['FEZ']?.change ?? 0.48,
        formatted: `$${(results['FEZ']?.price ?? 53.20).toFixed(2)}`
      },
      EWJ: {
        symbol: 'NIKKEI 225',
        price: results['EWJ']?.price ?? 71.15,
        change24h: results['EWJ']?.change ?? 0.85,
        formatted: `$${(results['EWJ']?.price ?? 71.15).toFixed(2)}`
      },
      NVDA: {
        symbol: 'NVIDIA',
        price: results['NVDA']?.price ?? 210.96,
        change24h: results['NVDA']?.change ?? -0.59,
        formatted: `$${(results['NVDA']?.price ?? 210.96).toFixed(2)}`
      },
      AAPL: {
        symbol: 'APPLE',
        price: results['AAPL']?.price ?? 347.73,
        change24h: results['AAPL']?.change ?? -0.14,
        formatted: `$${(results['AAPL']?.price ?? 347.73).toFixed(2)}`
      },
      MSFT: {
        symbol: 'MICROSOFT',
        price: results['MSFT']?.price ?? 468.50,
        change24h: results['MSFT']?.change ?? 0.74,
        formatted: `$${(results['MSFT']?.price ?? 468.50).toFixed(2)}`
      },
      AMZN: {
        symbol: 'AMAZON',
        price: results['AMZN']?.price ?? 229.40,
        change24h: results['AMZN']?.change ?? 1.12,
        formatted: `$${(results['AMZN']?.price ?? 229.40).toFixed(2)}`
      },
      GOOGL: {
        symbol: 'ALPHABET',
        price: results['GOOGL']?.price ?? 198.60,
        change24h: results['GOOGL']?.change ?? 0.53,
        formatted: `$${(results['GOOGL']?.price ?? 198.60).toFixed(2)}`
      },
      TSLA: {
        symbol: 'TESLA',
        price: results['TSLA']?.price ?? 372.22,
        change24h: results['TSLA']?.change ?? -0.63,
        formatted: `$${(results['TSLA']?.price ?? 372.22).toFixed(2)}`
      },
      META: {
        symbol: 'META',
        price: results['META']?.price ?? 618.30,
        change24h: results['META']?.change ?? 0.91,
        formatted: `$${(results['META']?.price ?? 618.30).toFixed(2)}`
      }
    }
  };

  marketCache = { data: payload, timestamp: Date.now() };
  return payload;
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost:' + PORT}`);
  const pathname = parsedUrl.pathname;

  // Set global CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    res.writeHead(204).end();
    return;
  }

  // API Route: /api/market
  if (pathname === '/api/market') {
    const isBypass = parsedUrl.searchParams.get('nocache') === '1' || !!parsedUrl.searchParams.get('_t');
    const now = Date.now();
    
    try {
      let data;
      if (!isBypass && marketCache.data && (now - marketCache.timestamp < 30000)) {
        data = marketCache.data;
      } else {
        data = await fetchMarketQuotes();
      }

      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': isBypass ? 'no-cache, no-store' : 'public, max-age=30'
      });
      res.end(JSON.stringify(data));
    } catch (err) {
      console.error('Error fetching market quotes:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to fetch market data' }));
    }
    return;
  }

  // API Route: /api/news
  if (pathname === '/api/news') {
    const feedUrl = parsedUrl.searchParams.get('url');
    if (!feedUrl) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'URL query parameter is required' }));
      return;
    }

    if (!isAllowedUrl(feedUrl)) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Target domain not permitted on RSS feed allowlist' }));
      return;
    }

    const isBypass = parsedUrl.searchParams.get('nocache') === '1' || !!parsedUrl.searchParams.get('_t');
    const now = Date.now();
    const cached = newsFeedCache.get(feedUrl);

    if (!isBypass && cached && (now - cached.timestamp < 180000)) {
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=180',
        'X-Cache': 'HIT'
      });
      res.end(cached.body);
      return;
    }

    try {
      const feedRes = await fetch(feedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Referer': 'https://www.google.com/'
        },
        signal: AbortSignal.timeout(6000)
      });

      if (!feedRes.ok) {
        res.writeHead(feedRes.status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Feed responded with status ${feedRes.status}` }));
        return;
      }

      const xmlText = await feedRes.text();
      const parsed = parseXmlFeed(xmlText);
      const bodyStr = JSON.stringify(parsed);

      newsFeedCache.set(feedUrl, { body: bodyStr, timestamp: Date.now() });

      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': isBypass ? 'no-cache, no-store' : 'public, max-age=180',
        'X-Cache': 'MISS'
      });
      res.end(bodyStr);
    } catch (err) {
      console.error(`Error fetching feed from ${feedUrl}:`, err?.message || err);
      // If we have stale cache, serve it on error!
      if (cached) {
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'public, max-age=60',
          'X-Cache': 'STALE-FALLBACK'
        });
        res.end(cached.body);
        return;
      }
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to fetch feed', details: err?.message || String(err) }));
    }
    return;
  }

  // Static File Serving from dist/
  if (fs.existsSync(distPath)) {
    // Sanitize path to prevent directory traversal
    let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
    if (safePath === '/' || safePath === '\\') safePath = 'index.html';
    
    let filePath = path.join(distPath, safePath);

    // If file doesn't exist, fallback to dist/index.html (SPA client routing)
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(distPath, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const isNoCache = filePath.endsWith('index.html') || filePath.endsWith('sw.js') || filePath.endsWith('registerSW.js') || filePath.endsWith('webmanifest');

    const headers = {
      'Content-Type': contentType,
      'Cache-Control': isNoCache ? 'no-cache, no-store, must-revalidate' : 'public, max-age=86400'
    };

    try {
      const content = fs.readFileSync(filePath);
      res.writeHead(200, headers);
      res.end(content);
      return;
    } catch (readErr) {
      console.error('File read error:', readErr);
    }
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`  Hatty's News Terminal Server is LIVE`);
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`  Network: http://0.0.0.0:${PORT}`);
  console.log(`======================================================\n`);
});
