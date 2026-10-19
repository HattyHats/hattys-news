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

  // API Route for fetching RSS feeds
  app.get("/api/news", async (req, res) => {
    const { url } = req.query;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "URL is required" });
    }

    try {
      const feed = await parser.parseURL(url);
      res.setHeader("Cache-Control", "public, max-age=120");
      res.json(feed);
    } catch (error) {
      console.error(`Error fetching feed from ${url}:`, error?.message || error);
      res.status(500).json({ error: "Failed to fetch feed", details: error?.message || String(error) });
    }
  });

  // Serve static files from dist
  const distPath = path.join(__dirname, "dist");
  if (fs.existsSync(distPath)) {
    console.log(`Serving pre-built terminal from: ${distPath}`);
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
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
