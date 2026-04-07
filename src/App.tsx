/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Sun, Moon, RefreshCw } from 'lucide-react';

interface Article {
  title: string;
  link: string;
  img: string;
  date: Date;
  src: string;
  cat: string;
}

const FEEDS = [
  { n: 'CoinTelegraph', u: 'https://cointelegraph.com/rss', c: 'all' },
  { n: 'CoinDesk', u: 'https://www.coindesk.com/arc/outboundfeeds/rss/', c: 'all' },
  { n: 'Bitcoin Magazine', u: 'https://bitcoinmagazine.com/feed', c: 'bitcoin' },
  { n: 'Decrypt', u: 'https://decrypt.co/feed', c: 'nft' },
  { n: 'CryptoSlate', u: 'https://news.google.com/rss/search?q=site:cryptoslate.com', c: 'altcoin' },
  { n: 'The Block', u: 'https://www.theblock.co/rss.xml', c: 'regulation' },
  { n: 'Mining News', u: 'https://news.google.com/rss/search?q=crypto+mining', c: 'mining' },
  { n: 'Whale Alerts', u: 'https://news.google.com/rss/search?q=crypto+whale+transfer', c: 'whales' }
];

export default function App() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  const fetchFeed = async (feed: typeof FEEDS[0]): Promise<Article[]> => {
    try {
      const response = await fetch(`/api/news?url=${encodeURIComponent(feed.u)}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();

      return data.items.map((i: any) => ({
        title: i.title,
        link: i.link,
        img: i.enclosure?.url || i.content || 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=500',
        date: new Date(i.pubDate || i.isoDate),
        src: feed.n,
        cat: feed.c
      }));
    } catch (e) {
      console.error("Fetch failed for", feed.n, e);
      return [];
    }
  };

  const loadNews = useCallback(async () => {
    setLoading(true);
    const results = await Promise.all(FEEDS.map(f => fetchFeed(f)));
    const allArticles = results.flat().sort((a, b) => b.date.getTime() - a.date.getTime());
    setArticles(allArticles);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadNews();
    const timer = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(timer);
  }, [loadNews]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [isDark]);

  const filtered = articles.filter(a => {
    const matchCat = filter === 'all' || a.cat === filter || a.title.toLowerCase().includes(filter);
    const matchQuery = a.title.toLowerCase().includes(query.toLowerCase());
    return matchCat && matchQuery;
  });

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://www.livecoinwatch.com/static/lcw-widget.js';
    script.defer = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="min-h-screen">
      <AnimatePresence>
        {showSplash && (
          <motion.div
            id="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="fixed inset-0 z-[99999] bg-black flex flex-col items-center justify-center"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.5 }}
              className="font-display text-[clamp(2.5rem,10vw,7rem)] text-white drop-shadow-[0_0_30px_#dc2626]"
            >
              HATTY'S NEWS
            </motion.div>
            <div className="font-mono text-[rgba(255,255,255,0.4)] tracking-[4px] mt-[10px]">
              CRYPTO TERMINAL
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header id="hdr" className="sticky top-0 z-80 bg-[rgba(5,5,5,0.8)] backdrop-blur-[12px] border-b border-[var(--border)]">
        <div className="max-w-[1400px] mx-auto p-[0.6rem_1rem] flex items-center gap-4">
          <div className="logo text-2xl">HATTY'S NEWS</div>
          <div className="flex-1 relative">
            <input
              type="search"
              placeholder="Search Blockchain..."
              className="fp w-full text-left cursor-text pl-8"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-muted)]" />
          </div>
          <button className="ibtn" onClick={() => setIsDark(!isDark)}>
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button className="ibtn" onClick={loadNews}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto my-6 px-4">
        <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-none">
          {[
            { id: 'all', label: '⚡ ALL' },
            { id: 'bitcoin', label: '₿ BITCOIN' },
            { id: 'ethereum', label: 'Ξ ETHEREUM' },
            { id: 'defi', label: '🏦 DEFI' },
            { id: 'nft', label: '🖼️ NFT/WEB3' },
            { id: 'altcoin', label: '🚀 ALTCOINS' },
            { id: 'mining', label: '⛏️ MINING' },
            { id: 'regulation', label: '⚖️ POLICY' }
          ].map(cat => (
            <button
              key={cat.id}
              className={`fp ${filter === cat.id ? 'on' : ''}`}
              onClick={() => setFilter(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {loading && articles.length === 0 ? (
          <div className="flex justify-center p-20">
            <div className="w-[30px] h-[30px] border-3 border-[var(--border)] border-t-[var(--red)] rounded-full animate-spin"></div>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center p-16 border border-dashed border-[var(--red)] rounded-xl">
            <h2 className="font-display text-[var(--red)] text-3xl">TERMINAL OFFLINE</h2>
            <p className="text-[var(--ink-muted)] my-4">No news found. Check your connection or try again.</p>
            <button onClick={loadNews} className="rbtn">REBOOT SYSTEM</button>
          </div>
        ) : (
          <div id="grid" className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-[1.2rem]">
            {filtered.map((a, idx) => (
              <motion.article
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="card"
              >
                <img
                  src={a.img}
                  className="ci"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=500';
                  }}
                />
                <div className="cb">
                  <div className="cs">{a.src} • {a.date.toLocaleDateString()}</div>
                  <h2 className="ct">{a.title}</h2>
                  <div className="flex-1"></div>
                  <a href={a.link} target="_blank" rel="noopener noreferrer" className="rbtn text-center">
                    READ FULL REPORT
                  </a>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </main>

      <div id="tickers" className="fixed bottom-0 left-0 right-0 z-90 bg-[#080808] border-t border-[#222]">
        <div 
          className="livecoinwatch-widget-5" 
          lcw-base="USD" 
          lcw-color-tx="#abb8c3" 
          lcw-marquee-1="coins" 
          lcw-marquee-2="movers" 
          lcw-marquee-items="10"
        ></div>
      </div>
    </div>
  );
}

