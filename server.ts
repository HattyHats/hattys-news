import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import RSSParser from "rss-parser";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const ALLOWED_FEED_DOMAINS = [
  'cointelegraph.com', 'coindesk.com', 'decrypt.co', 'theblock.co', 'blockworks.co',
  'bitcoinmagazine.com', 'cryptoslate.com', 'dailycoin.com', 'u.today', 'beincrypto.com',
  'ambcrypto.com', 'thedefiant.io', 'cryptobriefing.com', 'bankless.com', 'crypto.news',
  'cryptopotato.com', 'newsbtc.com', 'bitcoin.com', 'techcrunch.com', 'news.google.com',
  'bbci.co.uk', 'bbc.co.uk', 'bbc.com', 'dw.com', 'france24.com', 'aljazeera.com',
  'theguardian.com', 'cbc.ca', 'npr.org', 'upi.com', 'un.org', 'abc.net.au',
  'channelnewsasia.com', 'africanews.com', 'rte.ie', 'nasa.gov', 'space.com',
  'phys.org', 'sciencedaily.com', 'arstechnica.com', 'theverge.com', 'reuters.com', 'apnews.com'
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

async function startServer() {
  console.log("Initializing Hatty News Server on port 4000...");
  const app = express();
  const PORT = 4000;

  app.use(cors());
  app.use(express.json());

  // Cache for market quotes (30-second TTL)
  let marketCache = { data: null, timestamp: 0 };

  // API Route for live commodities and stock prices
  app.get("/api/market", async (req, res) => {
    const now = Date.now();
    const isBypass = req.query.nocache === "1" || req.query.nocache === "true" || !!req.query._t;
    if (!isBypass && marketCache.data && (now - marketCache.timestamp < 30000)) {
      res.setHeader("Cache-Control", "public, max-age=30");
      return res.json(marketCache.data);
    }

    const symbols = [
      'BTC-USD', 'ETH-USD', 'SOL-USD', 'XRP-USD', 'DOGE-USD',
      'BNB-USD', 'ADA-USD', 'AVAX-USD', 'LINK-USD',
      'CL=F', 'BZ=F', 'GC=F', 'SI=F', 'NG=F', 'HG=F',
      'SPY', 'QQQ', 'DIA', 'IWM', 'EWU', 'EWG', 'FEZ', 'EWJ',
      'NVDA', 'AAPL', 'MSFT', 'AMZN', 'GOOGL', 'TSLA', 'META'
    ];

    try {
      const results: Record<string, { price: number; prev: number; change: number }> = {};
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
      if (isBypass) {
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
      } else {
        res.setHeader("Cache-Control", "public, max-age=30");
      }
      res.json(payload);
    } catch (err) {
      console.error("Error in /api/market:", err);
      res.status(500).json({ error: "Failed to fetch market data" });
    }
  });

  // API Route for fetching RSS feeds
  app.get("/api/news", async (req, res) => {
    const { url } = req.query;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "URL is required" });
    }

    if (!isAllowedUrl(url)) {
      return res.status(403).json({ error: "Target domain not permitted on RSS feed allowlist" });
    }

    try {
      const feed = await parser.parseURL(url);
      res.setHeader("Cache-Control", "public, max-age=120");
      res.json(feed);
    } catch (error: any) {
      console.error(`Error fetching feed from ${url}:`, error?.message || error);
      res.status(500).json({ error: "Failed to fetch feed", details: error?.message || String(error) });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith("index.html") || filePath.endsWith("sw.js") || filePath.endsWith("registerSW.js") || filePath.endsWith("webmanifest") || filePath.endsWith("sw-notifications.js")) {
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
          res.setHeader("Pragma", "no-cache");
          res.setHeader("Expires", "0");
        }
      }
    }));
    app.get("*", (req, res) => {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
