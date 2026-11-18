import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import RSSParser from 'rss-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ALLOWED_FEED_DOMAINS = [
  'cointelegraph.com', 'coindesk.com', 'decrypt.co', 'theblock.co', 'blockworks.co',
  'bitcoinmagazine.com', 'cryptoslate.com', 'dailycoin.com', 'u.today', 'beincrypto.com',
  'ambcrypto.com', 'thedefiant.io', 'cryptobriefing.com', 'bankless.com', 'crypto.news',
  'cryptopotato.com', 'newsbtc.com', 'bitcoin.com', 'techcrunch.com', 'protos.com',
  'bitcoinist.com', 'unchainedcrypto.com', 'news.google.com',
  'bbci.co.uk', 'bbc.co.uk', 'bbc.com', 'dw.com', 'france24.com', 'aljazeera.com',
  'theguardian.com', 'cbc.ca', 'npr.org', 'upi.com', 'un.org', 'abc.net.au',
  'channelnewsasia.com', 'africanews.com', 'rte.ie', 'euronews.com', 'scmp.com',
  'middleeasteye.net', 'mercopress.com', 'thehindu.com', 'cnbc.com', 'politico.com',
  'nasa.gov', 'space.com', 'phys.org', 'sciencedaily.com', 'arstechnica.com',
  'theverge.com', 'reuters.com', 'apnews.com'
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

function apiNewsPlugin() {
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
      'Referer': 'https://www.google.com/',
    },
    timeout: 6500,
  });

  return {
    name: 'api-news-server',
    configureServer(server: any) {
      server.middlewares.use('/api/news', async (req: any, res: any) => {
        try {
          const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost:4000'}`);
          const rawUrlsParam = urlObj.searchParams.get('urls');

          if (rawUrlsParam) {
            const parsed = JSON.parse(rawUrlsParam);
            const urlsList = Array.isArray(parsed)
              ? parsed.filter((u: any) => typeof u === 'string' && isAllowedUrl(u)).slice(0, 10)
              : [];
            const results: Record<string, { items: any[] }> = {};
            await Promise.allSettled(
              urlsList.map(async (u: string) => {
                try {
                  const feed = await parser.parseURL(u);
                  results[u] = { items: Array.isArray(feed.items) ? feed.items.slice(0, 18) : [] };
                } catch {
                  results[u] = { items: [] };
                }
              })
            );
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({ batch: true, results }));
            return;
          }

          const feedUrl = urlObj.searchParams.get('url');

          if (!feedUrl) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'URL is required' }));
            return;
          }

          if (!isAllowedUrl(feedUrl)) {
            res.statusCode = 403;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Target domain not permitted on RSS feed allowlist' }));
            return;
          }

          const feed = await parser.parseURL(feedUrl);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Cache-Control', 'public, max-age=120');
          res.end(JSON.stringify(feed));
        } catch (error: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify({ error: 'Failed to fetch feed', details: error?.message || String(error) }));
        }
      });
    }
  };
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      apiNewsPlugin(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png', 'sw-notifications.js'],
        workbox: {
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          globPatterns: ['**/*.{js,css,ico,png,svg,webmanifest}'],
          navigateFallback: null,
          runtimeCaching: [
            {
              // Navigation requests (opening the web app, Chrome app, or website)
              // NetworkFirst without precached index.html ensures online users always get newest deploys immediately!
              urlPattern: ({ request }) => request.mode === 'navigate',
              handler: 'NetworkFirst',
              options: {
                cacheName: 'hatty-html-cache-v3',
                networkTimeoutSeconds: 2.5,
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 24 * 60 * 60,
                },
              },
            },
            {
              // Live APIs: Always fetch from network
              urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
              handler: 'NetworkOnly',
            },
          ],
          importScripts: ['sw-notifications.js']
        },
        manifest: {
          name: "Hatty's News — Global & Crypto Terminal",
          short_name: "Hatty's News",
          description: "Real-time Crypto Intelligence & Verified World News Terminal.",
          theme_color: '#030303',
          background_color: '#030303',
          display: 'standalone',
          orientation: 'any',
          start_url: '/',
          scope: '/',
          categories: ['news', 'finance', 'business'],
          icons: [
            {
              src: '/favicon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any'
            },
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ]
        }
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 4000,
      strictPort: false,
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
