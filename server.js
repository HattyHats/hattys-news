import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
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

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 4000;

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
      'CL=F', 'BZ=F', 'GC=F', 'SI=F', 'NG=F', 'HG=F',
      'SPY', 'QQQ', 'DIA', 'NVDA', 'AAPL', 'MSFT', 'AMZN', 'GOOGL', 'TSLA', 'META'
    ];

    try {
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
        commodities: {
          OIL_CRUDE: {
            price: results['CL=F']?.price || 103.27,
            change24h: results['CL=F']?.change || 3.82,
            formatted: `$${(results['CL=F']?.price || 103.27).toFixed(2)}`
          },
          OIL_BRENT: {
            price: results['BZ=F']?.price || 111.70,
            change24h: results['BZ=F']?.change || 2.80,
            formatted: `$${(results['BZ=F']?.price || 111.70).toFixed(2)}`
          },
          GOLD: {
            price: results['GC=F']?.price || 4007.90,
            change24h: results['GC=F']?.change || -1.29,
            formatted: `$${(results['GC=F']?.price || 4007.90).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          },
          SILVER: {
            price: results['SI=F']?.price || 53.95,
            change24h: results['SI=F']?.change || -1.92,
            formatted: `$${(results['SI=F']?.price || 53.95).toFixed(2)}`
          },
          NAT_GAS: {
            price: results['NG=F']?.price || 3.05,
            change24h: results['NG=F']?.change || -3.36,
            formatted: `$${(results['NG=F']?.price || 3.05).toFixed(3)}`
          },
          COPPER: {
            price: results['HG=F']?.price || 6.51,
            change24h: results['HG=F']?.change || 1.72,
            formatted: `$${(results['HG=F']?.price || 6.51).toFixed(3)}`
          }
        },
        stocks: {
          SPY: {
            symbol: 'S&P 500',
            price: results['SPY']?.price || 759.97,
            change24h: results['SPY']?.change || -0.52,
            formatted: `$${(results['SPY']?.price || 759.97).toFixed(2)}`
          },
          QQQ: {
            symbol: 'NASDAQ 100',
            price: results['QQQ']?.price || 704.40,
            change24h: results['QQQ']?.change || -0.01,
            formatted: `$${(results['QQQ']?.price || 704.40).toFixed(2)}`
          },
          DIA: {
            symbol: 'DOW JONES',
            price: results['DIA']?.price || 521.37,
            change24h: results['DIA']?.change || -1.24,
            formatted: `$${(results['DIA']?.price || 521.37).toFixed(2)}`
          },
          NVDA: {
            symbol: 'NVIDIA',
            price: results['NVDA']?.price || 210.96,
            change24h: results['NVDA']?.change || -0.59,
            formatted: `$${(results['NVDA']?.price || 210.96).toFixed(2)}`
          },
          AAPL: {
            symbol: 'APPLE',
            price: results['AAPL']?.price || 347.73,
            change24h: results['AAPL']?.change || -0.14,
            formatted: `$${(results['AAPL']?.price || 347.73).toFixed(2)}`
          },
          TSLA: {
            symbol: 'TESLA',
            price: results['TSLA']?.price || 372.22,
            change24h: results['TSLA']?.change || -0.63,
            formatted: `$${(results['TSLA']?.price || 372.22).toFixed(2)}`
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
    const { url, nocache, _t } = req.query;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "URL is required" });
    }

    try {
      const feed = await parser.parseURL(url);
      const isBypass = nocache === "1" || nocache === "true" || !!_t;
      if (isBypass) {
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
      } else {
        res.setHeader("Cache-Control", "public, max-age=120");
      }
      res.json(feed);
    } catch (error) {
      console.error(`Error fetching feed from ${url}:`, error?.message || error);
      res.status(500).json({ error: "Failed to fetch feed", details: error?.message || String(error) });
    }
  });

  // Serve static files from dist with zero-cache for HTML, SW, and manifest
  const distPath = path.join(__dirname, "dist");
  if (fs.existsSync(distPath)) {
    console.log(`Serving pre-built terminal from: ${distPath}`);
    app.use(express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith("index.html") || filePath.endsWith("sw.js") || filePath.endsWith("registerSW.js") || filePath.endsWith("webmanifest")) {
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
  } else {
    app.get("/", (req, res) => {
      res.send("Run 'npm run build' first to generate dist files.");
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✓ Hatty's News Server running at http://localhost:${PORT}`);
  });
}

startServer();
