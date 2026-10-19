import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import RSSParser from 'rss-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    timeout: 10000,
  });

  return {
    name: 'api-news-server',
    configureServer(server: any) {
      server.middlewares.use('/api/news', async (req: any, res: any) => {
        try {
          const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost:4000'}`);
          const feedUrl = urlObj.searchParams.get('url');

          if (!feedUrl) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'URL is required' }));
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
        manifest: {
          name: "Hatty's News Terminal",
          short_name: 'HattyNews',
          description: 'A premium Crypto and Technology news platform.',
          theme_color: '#030303',
          background_color: '#030303',
          display: 'standalone',
          icons: [
            {
              src: '/favicon.ico',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: '/favicon.ico',
              sizes: '512x512',
              type: 'image/png'
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
