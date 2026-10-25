import { Handler } from "@netlify/functions";

let marketCache: { data: any; timestamp: number } = { data: null, timestamp: 0 };

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

  const now = Date.now();
  if (marketCache.data && now - marketCache.timestamp < 30000) {
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=30",
      },
      body: JSON.stringify(marketCache.data),
    };
  }

  const symbols = [
    'CL=F', 'BZ=F', 'GC=F', 'SI=F', 'NG=F', 'HG=F',
    'SPY', 'QQQ', 'DIA', 'NVDA', 'AAPL', 'MSFT', 'AMZN', 'GOOGL', 'TSLA', 'META'
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

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=30, s-maxage=30",
      },
      body: JSON.stringify(payload),
    };
  } catch (error: any) {
    console.error("Error in netlify /api/market:", error?.message || error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: "Failed to fetch market data" }),
    };
  }
};
