/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Sun, Moon, RefreshCw, Menu, ExternalLink, Gauge, X } from 'lucide-react';

interface Article {
  title: string;
  link: string;
  img: string;
  date: Date;
  src: string;
  cat: string;
}

interface FearGreedData {
  value: string;
  value_classification: string;
  timestamp: string;
}

const OTHER_SITES = [
  { name: 'Learn With Hatty', url: 'https://earnwithhatty.com/' },
  { name: 'Token-Tokens', url: 'https://hattyhats.github.io/token-tokens/' },
  { name: 'Open-Focus', url: 'https://hattyhats.github.io/Open-Focus/' },
  { name: 'Hatty\'s Universe', url: 'https://hatty-universe.netlify.app/' },
];

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
  const [showMenu, setShowMenu] = useState(false);
  const [fearGreed, setFearGreed] = useState<FearGreedData | null>(null);
  const [showFearGreed, setShowFearGreed] = useState(false);

  const fetchFeed = async (feed: typeof FEEDS[0]): Promise<Article[]> => {
    try {
      const response = await fetch(`/api/news?url=${encodeURIComponent(feed.u)}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();

      return data.items.map((i: any) => {
        // Advanced Image Extraction
        let img = 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=500';
        
        if (i.enclosure?.url) {
          img = i.enclosure.url;
        } else if (i['media:content']) {
          const media = i['media:content'];
          img = Array.isArray(media) ? (media[0]?.$.url || media[0].url) : (media.$.url || media.url);
        } else if (i['media:thumbnail']) {
          img = i['media:thumbnail']?.$.url || i['media:thumbnail']?.url;
        } else {
          const content = i.contentEncoded || i.content || i.description || '';
          const match = content.match(/<img[^>]+src="([^">]+)"/);
          if (match) img = match[1];
          else img = `https://picsum.photos/seed/${encodeURIComponent(i.title.slice(0, 10))}/800/450`;
        }

        return {
          title: i.title,
          link: i.link,
          img,
          date: new Date(i.pubDate || i.isoDate),
          src: feed.n,
          cat: feed.c
        };
      });
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

  const fetchFearGreed = async () => {
    try {
      const res = await fetch(`https://api.alternative.me/fng/?t=${Date.now()}`);
      const data = await res.json();
      if (data.data && data.data.length > 0) {
        setFearGreed(data.data[0]);
      }
    } catch (e) {
      console.error("Failed to fetch Fear & Greed Index", e);
    }
  };

  useEffect(() => {
    loadNews();
    fetchFearGreed();
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
            className="fixed inset-0 z-[99999] bg-black flex flex-col items-center justify-center overflow-hidden"
          >
            {/* Background GIF */}
            <div className="absolute inset-0 z-0 opacity-40">
              <img 
                src="/newsworld.gif" 
                alt="Background" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.5 }}
              className="relative z-10 font-display text-[clamp(2.5rem,10vw,7rem)] text-white drop-shadow-[0_0_30px_#dc2626]"
            >
              HATTY'S NEWS
            </motion.div>
            <div className="relative z-10 font-mono text-[rgba(255,255,255,0.4)] tracking-[4px] mt-[10px]">
              CRYPTO TERMINAL
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFearGreed && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowFearGreed(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 shadow-2xl"
            >
              <button 
                className="absolute top-4 right-4 text-[var(--ink-muted)] hover:text-white"
                onClick={() => setShowFearGreed(false)}
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center">
                <div className="cs mb-2">Market Sentiment</div>
                <h2 className="font-display text-4xl text-white mb-6">FEAR & GREED INDEX</h2>
                
                {fearGreed ? (
                  <div className="space-y-6">
                    <div className="relative inline-flex items-center justify-center">
                      <div className="text-6xl font-bold text-[var(--red)] drop-shadow-[0_0_15px_rgba(220,38,38,0.4)]">
                        {fearGreed.value}
                      </div>
                    </div>
                    
                    <div className="text-2xl font-bold uppercase tracking-widest" style={{ color: 
                      parseInt(fearGreed.value) > 75 ? '#22c55e' : 
                      parseInt(fearGreed.value) > 50 ? '#84cc16' : 
                      parseInt(fearGreed.value) > 25 ? '#eab308' : '#ef4444'
                    }}>
                      {fearGreed.value_classification}
                    </div>

                    <p className="text-sm text-[var(--ink-muted)] leading-relaxed text-left bg-[var(--bg)] p-4 rounded-lg border border-[var(--border)]">
                      The Fear & Greed Index is a tool used to gauge the emotions of the market. 
                      <strong> Fear</strong> (0-49) suggests investors are worried, which could be a buying opportunity. 
                      <strong> Greed</strong> (51-100) suggests the market is due for a correction as investors get too greedy.
                    </p>
                    
                    <div className="text-[10px] font-mono text-[var(--ink-muted)]">
                      Last Updated: {new Date(parseInt(fearGreed.timestamp) * 1000).toLocaleString()}
                    </div>
                  </div>
                ) : (
                  <div className="py-10 animate-pulse text-[var(--ink-muted)] font-mono">LOADING DATA...</div>
                )}
              </div>
            </motion.div>
          </div>
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
          
          <button className="ibtn" onClick={() => setShowFearGreed(true)}>
            <Gauge className="w-4 h-4" />
          </button>

          <button className="ibtn" onClick={loadNews}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          <div className="relative">
            <button className="ibtn" onClick={() => setShowMenu(!showMenu)}>
              <Menu className="w-4 h-4" />
            </button>
            <AnimatePresence>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-56 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-2xl z-20 overflow-hidden"
                  >
                    <div className="p-3 text-[10px] font-mono text-[var(--ink-muted)] uppercase border-b border-[var(--border)] bg-[var(--bg)]">
                      Hatty's Network
                    </div>
                    <div className="py-1">
                      {OTHER_SITES.map((site) => (
                        <a
                          key={site.url}
                          href={site.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between px-4 py-3 text-xs hover:bg-[var(--red)] hover:text-white transition-colors group"
                          onClick={() => setShowMenu(false)}
                        >
                          <span>{site.name}</span>
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
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

