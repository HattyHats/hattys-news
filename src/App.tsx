/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Sun, Moon, RefreshCw, Menu, ExternalLink, Gauge, X, 
  Share2, Check, ArrowRight, Zap, TrendingUp, TrendingDown,
  Layers, ShieldAlert, Radio, Clock, Globe, ShieldCheck,
  Download, Smartphone, Sparkles
} from 'lucide-react';

export type AppMode = 'crypto' | 'world';

interface Article {
  id: string;
  title: string;
  link: string;
  img: string;
  date: Date;
  src: string;
  primaryCat: string;
  matchedCategories: string[];
  snippet?: string;
  mode: AppMode;
}

interface FearGreedData {
  value: string;
  value_classification: string;
  timestamp: string;
  previous_value?: string;
}

interface FeedConfig {
  n: string;
  u: string;
  defaultCat: string;
}

const OTHER_SITES = [
  { name: 'Learn With Hatty', url: 'https://earnwithhatty.com/' },
  { name: 'Token-Tokens', url: 'https://hattyhats.github.io/token-tokens/' },
  { name: 'Open-Focus', url: 'https://hattyhats.github.io/Open-Focus/' },
  { name: "Hatty's Universe", url: 'https://hatty-universe.netlify.app/' },
  { name: 'QuickPad', url: 'https://www.quickpad.org/' },
  { name: 'Local-Cast', url: 'https://www.local-cast.org/' },
];

/* --- CRYPTO CONFIGURATION --- */
const CRYPTO_CATEGORIES = [
  { id: 'all', label: 'ALL', icon: '⚡', badgeClass: 'badge-bitcoin' },
  { id: 'bitcoin', label: 'BITCOIN', icon: '₿', badgeClass: 'badge-bitcoin' },
  { id: 'ethereum', label: 'ETHEREUM', icon: 'Ξ', badgeClass: 'badge-ethereum' },
  { id: 'defi', label: 'DEFI', icon: '🏦', badgeClass: 'badge-defi' },
  { id: 'nft', label: 'NFT/WEB3', icon: '🖼️', badgeClass: 'badge-nft' },
  { id: 'altcoin', label: 'ALTCOINS', icon: '🚀', badgeClass: 'badge-altcoin' },
  { id: 'mining', label: 'MINING', icon: '⛏️', badgeClass: 'badge-mining' },
  { id: 'regulation', label: 'POLICY', icon: '⚖️', badgeClass: 'badge-regulation' }
];

const CRYPTO_CATEGORY_RULES: Record<string, RegExp> = {
  bitcoin: /\b(bitcoin|btc|satoshi|ordinals|runes|lightning network|halving)\b/i,
  ethereum: /\b(ethereum|eth|vitalik|erc-20|erc20|layer 2|layer2|l2|arbitrum|optimism|base|polygon|steth|eigenlayer|evm|eip)\b/i,
  defi: /\b(defi|decentralized finance|dex|uniswap|aave|makerdao|curve|liquidity|yield|lending|staking|tvl|swap|liquid staking|synthetix|pancakeswap)\b/i,
  nft: /\b(nft|nfts|opensea|blur|metaverse|web3|digital collectible|pfp|airdrop|gamefi|bored ape|cryptopunk)\b/i,
  altcoin: /\b(altcoin|altcoins|solana|sol|ripple|xrp|cardano|ada|doge|dogecoin|shib|shiba|avalanche|avax|chainlink|link|polkadot|dot|near|sui|aptos|bnb|binance coin|ton|tron|trx|pepe|memecoin|meme coin|fantom|kaspa|render)\b/i,
  mining: /\b(mining|miner|miners|hashrate|hash rate|asic|antminer|marathon|riot platforms|clean energy|proof-of-work|pow)\b/i,
  regulation: /\b(sec|cftc|regulation|regulatory|regulator|regulators|lawsuit|court|judge|subpoena|gensler|congress|senate|treasury|irs|tax|doj|sanctions|compliance|ban|legal|investigation|bipartisan|fbi|gop|democrat|white house)\b/i
};

const CRYPTO_FEEDS: FeedConfig[] = [
  { n: 'CoinTelegraph', u: 'https://cointelegraph.com/rss', defaultCat: 'all' },
  { n: 'CoinDesk', u: 'https://www.coindesk.com/arc/outboundfeeds/rss/', defaultCat: 'all' },
  { n: 'Decrypt', u: 'https://decrypt.co/feed', defaultCat: 'all' },
  { n: 'The Block', u: 'https://www.theblock.co/rss.xml', defaultCat: 'regulation' },
  { n: 'Blockworks', u: 'https://blockworks.co/feed', defaultCat: 'all' },
  { n: 'Crypto.News', u: 'https://crypto.news/feed/', defaultCat: 'all' },
  { n: 'CryptoPotato', u: 'https://cryptopotato.com/feed/', defaultCat: 'all' },
  { n: 'CoinTelegraph Bitcoin', u: 'https://cointelegraph.com/rss/tag/bitcoin', defaultCat: 'bitcoin' },
  { n: 'NewsBTC', u: 'https://newsbtc.com/feed/', defaultCat: 'bitcoin' },
  { n: 'Bitcoin.com', u: 'https://news.bitcoin.com/feed/', defaultCat: 'bitcoin' },
  { n: 'CoinTelegraph Ethereum', u: 'https://cointelegraph.com/rss/tag/ethereum', defaultCat: 'ethereum' },
  { n: 'CoinTelegraph DeFi', u: 'https://cointelegraph.com/rss/tag/defi', defaultCat: 'defi' },
  { n: 'CoinTelegraph Altcoins', u: 'https://cointelegraph.com/rss/tag/altcoins', defaultCat: 'altcoin' },
  { n: 'CoinTelegraph Policy', u: 'https://cointelegraph.com/rss/tag/regulation', defaultCat: 'regulation' },
  { n: 'CoinTelegraph NFT', u: 'https://cointelegraph.com/rss/tag/nft', defaultCat: 'nft' },
  { n: 'CoinTelegraph Mining', u: 'https://cointelegraph.com/rss/tag/mining', defaultCat: 'mining' }
];

/* --- UNBIASED WORLD NEWS CONFIGURATION --- */
const WORLD_CATEGORIES = [
  { id: 'all', label: 'TOP STORIES', icon: '🌐', badgeClass: 'badge-world-top' },
  { id: 'politics', label: 'POLITICS', icon: '🏛️', badgeClass: 'badge-world-politics' },
  { id: 'geopolitics', label: 'GEOPOLITICS', icon: '⚔️', badgeClass: 'badge-world-geo' },
  { id: 'economy', label: 'ECONOMY', icon: '💼', badgeClass: 'badge-world-economy' },
  { id: 'tech', label: 'TECH & AI', icon: '🔬', badgeClass: 'badge-world-tech' },
  { id: 'environment', label: 'CLIMATE', icon: '🌍', badgeClass: 'badge-world-env' },
  { id: 'health', label: 'HEALTH', icon: '🏥', badgeClass: 'badge-world-health' },
  { id: 'space', label: 'SCIENCE & SPACE', icon: '🛰️', badgeClass: 'badge-world-space' }
];

const WORLD_CATEGORY_RULES: Record<string, RegExp> = {
  politics: /\b(politics|election|parliament|congress|senate|president|prime minister|biden|trump|kamala|democrat|republican|gop|white house|bill|legislation|vote|voters|supreme court|ballot|governor|cabinet|minister)\b/i,
  geopolitics: /\b(geopolitics|ukraine|russia|putin|zelensky|israel|gaza|middle east|iran|china|taiwan|nato|united nations|un|ceasefire|diplomacy|treaty|sanctions|military|defense|war|conflict|missile|security council|beijing|kyiv)\b/i,
  economy: /\b(economy|economic|inflation|federal reserve|fed|powell|interest rates|jobs|unemployment|gdp|recession|stock market|wall street|central bank|trade|tariffs|treasury|imf|world bank|consumer|market)\b/i,
  tech: /\b(technology|tech|ai|artificial intelligence|openai|google|apple|microsoft|nvidia|semiconductor|chip|robotics|cybersecurity|software|internet|quantum|algorithm)\b/i,
  environment: /\b(climate|environment|wildfire|hurricane|flood|warming|renewable|solar|wind|carbon|emissions|drought|energy transition|biodiversity|cop28|cop29|epa|pollution)\b/i,
  health: /\b(health|medical|medicine|hospital|disease|vaccine|fda|who|cancer|mental health|pandemic|drug|treatment|clinical|healthcare|virus)\b/i,
  space: /\b(space|nasa|spacex|astronomy|telescope|moon|mars|asteroid|satellite|orbit|cosmic|galaxy|physics|discovery|science|james webb)\b/i
};

// Verified Low-Bias, Factual Wire Services & Public Broadcasters
const WORLD_FEEDS: FeedConfig[] = [
  { n: 'Reuters', u: 'https://news.google.com/rss/search?q=source:Reuters&hl=en-US&gl=US&ceid=US:en', defaultCat: 'all' },
  { n: 'Associated Press', u: 'https://news.google.com/rss/search?q=source:%22Associated+Press%22&hl=en-US&gl=US&ceid=US:en', defaultCat: 'all' },
  { n: 'BBC World', u: 'https://feeds.bbci.co.uk/news/world/rss.xml', defaultCat: 'all' },
  { n: 'BBC Business', u: 'https://feeds.bbci.co.uk/news/business/rss.xml', defaultCat: 'economy' },
  { n: 'BBC Technology', u: 'https://feeds.bbci.co.uk/news/technology/rss.xml', defaultCat: 'tech' },
  { n: 'DW News', u: 'https://rss.dw.com/rdf/rss-en-all', defaultCat: 'all' },
  { n: 'France 24', u: 'https://www.france24.com/en/rss', defaultCat: 'all' },
  { n: 'Al Jazeera', u: 'https://www.aljazeera.com/xml/rss/all.xml', defaultCat: 'geopolitics' },
  { n: 'PBS NewsHour', u: 'https://www.pbs.org/newshour/feeds/rss/headlines', defaultCat: 'politics' },
  { n: 'NPR World', u: 'https://feeds.npr.org/1004/rss.xml', defaultCat: 'all' },
  { n: 'AP Politics', u: 'https://news.google.com/rss/search?q=source:%22Associated+Press%22+politics&hl=en-US&gl=US&ceid=US:en', defaultCat: 'politics' },
  { n: 'Reuters Economy', u: 'https://news.google.com/rss/search?q=source:Reuters+economy+OR+markets&hl=en-US&gl=US&ceid=US:en', defaultCat: 'economy' }
];

const CRYPTO_SPLASH_HEADLINES = [
  { tag: 'BREAKING', cat: 'BITCOIN', text: 'Bitcoin Hashrate Reaches New All-Time High Amid Global Expansion' },
  { tag: 'MARKET ALERT', cat: 'ETHEREUM', text: 'Ethereum Layer-2 TVL Explodes Past $50B Milestone' },
  { tag: 'REGULATION', cat: 'POLICY', text: 'Global Regulators Form Digital Asset Unified Framework' },
  { tag: 'DEFI DISPATCH', cat: 'DEFI', text: 'Institutional Staking Volumes Surge by 140% in Q3' },
  { tag: 'FLASH INTEL', cat: 'ALTCOINS', text: 'Solana DEX Volume Flips Major CeFi Exchanges in Weekly Stats' },
  { tag: 'TECH INTEL', cat: 'MINING', text: 'Next-Gen 3nm ASIC Miners Enter Commercial Mass Production' },
  { tag: 'MARKET FLASH', cat: 'BITCOIN', text: 'Spot ETF Cumulative Net Inflows Cross Record Frontiers' },
  { tag: 'WEB3 WIRE', cat: 'NFT/WEB3', text: 'Zero-Knowledge Cryptography Integrations Go Mainstream' }
];

const WORLD_SPLASH_HEADLINES = [
  { tag: 'GLOBAL WIRE', cat: 'DIPLOMACY', text: 'International Delegations Convene on Global Ceasefire Framework' },
  { tag: 'WIRE FLASH', cat: 'ECONOMY', text: 'Global Central Banks Report Synchronized Decline in Core Inflation' },
  { tag: 'FACT-CHECKED', cat: 'SCIENCE', text: 'James Webb Telescope Detects Organic Compounds in Exoplanet Orbit' },
  { tag: 'DISPATCH', cat: 'WORLD', text: 'United Nations High Council Unveils Comprehensive Humanitarian Plan' },
  { tag: 'GLOBAL TECH', cat: 'TECH & AI', text: 'International Standards Body Establishes Open Ethics Framework for AI' },
  { tag: 'WORLD REPORT', cat: 'CLIMATE', text: 'Renewable Power Generation Surpasses Global Coal Capacity in Milestone' }
];

// Curated, High-Resolution Editorial Photography Pools (Fast, Verified Unsplash CDN)
const WORLD_EDITORIAL_PHOTOS: Record<string, string[]> = {
  all: [
    'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80',
  ],
  politics: [
    'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=800&q=80',
  ],
  geopolitics: [
    'https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=800&q=80',
  ],
  economy: [
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=800&q=80',
  ],
  tech: [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80',
  ],
  environment: [
    'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80',
  ],
  health: [
    'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=800&q=80',
  ],
  space: [
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=800&q=80',
  ],
};

const CRYPTO_EDITORIAL_PHOTOS: Record<string, string[]> = {
  all: [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1516245834210-c4c142787335?auto=format&fit=crop&w=800&q=80',
  ],
  bitcoin: [
    'https://images.unsplash.com/photo-1516245834210-c4c142787335?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
  ],
  ethereum: [
    'https://images.unsplash.com/photo-1622979135240-caa6648190b6?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=800&q=80',
  ],
  defi: [
    'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1639762681057-408e52192e55?auto=format&fit=crop&w=800&q=80',
  ],
  nft: [
    'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=800&q=80',
  ],
  altcoin: [
    'https://images.unsplash.com/photo-1621504450181-5d356f61d307?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1605792657660-596af9009e82?auto=format&fit=crop&w=800&q=80',
  ],
  mining: [
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80',
  ],
  regulation: [
    'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1479142506502-19b3a3b7ff33?auto=format&fit=crop&w=800&q=80',
  ],
};

// Deterministic editorial photo picker using title hash
function getEditorialPhoto(category: string, title: string, mode: AppMode): string {
  const cat = (category || 'all').toLowerCase();
  const pool = mode === 'world' 
    ? (WORLD_EDITORIAL_PHOTOS[cat] || WORLD_EDITORIAL_PHOTOS['all'])
    : (CRYPTO_EDITORIAL_PHOTOS[cat] || CRYPTO_EDITORIAL_PHOTOS['all']);
  
  let hash = 0;
  const safeStr = title || category || 'news';
  for (let i = 0; i < safeStr.length; i++) {
    hash = (hash << 5) - hash + safeStr.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % pool.length;
  return pool[index];
}

// Resilient Inline Native DOM/CSS/SVG Banner (Guaranteed Zero Broken Images)
function ThemedCardBanner({
  category,
  title,
  mode,
  source,
}: {
  category: string;
  title: string;
  mode: AppMode;
  source: string;
}) {
  const cat = (category || '').toLowerCase();
  let color1 = mode === 'world' ? '#2563eb' : '#dc2626';
  let color2 = mode === 'world' ? '#1e3a8a' : '#7f1d1d';
  let symbol = mode === 'world' ? '🌐' : '⚡';
  let label = mode === 'world' ? 'WORLD NEWS WIRE' : 'HATTY NEWS TERMINAL';

  if (mode === 'world') {
    if (cat.includes('politics')) {
      color1 = '#8b5cf6'; color2 = '#2e1065'; symbol = '🏛️'; label = 'POLITICS & DIPLOMACY';
    } else if (cat.includes('geopolitics')) {
      color1 = '#f59e0b'; color2 = '#78350f'; symbol = '⚔️'; label = 'GEOPOLITICAL WIRE';
    } else if (cat.includes('economy')) {
      color1 = '#10b981'; color2 = '#064e3b'; symbol = '💼'; label = 'GLOBAL ECONOMY';
    } else if (cat.includes('tech')) {
      color1 = '#06b6d4'; color2 = '#164e63'; symbol = '🔬'; label = 'TECH & AI DISPATCH';
    } else if (cat.includes('env') || cat.includes('climate')) {
      color1 = '#14b8a6'; color2 = '#134e4a'; symbol = '🌍'; label = 'CLIMATE & EARTH';
    } else if (cat.includes('health')) {
      color1 = '#f43f5e'; color2 = '#881337'; symbol = '🏥'; label = 'GLOBAL HEALTH';
    } else if (cat.includes('space')) {
      color1 = '#a855f7'; color2 = '#3b0764'; symbol = '🛰️'; label = 'SCIENCE & SPACE';
    }
  } else {
    if (cat.includes('bitcoin')) {
      color1 = '#f7931a'; color2 = '#78350f'; symbol = '₿'; label = 'BITCOIN DISPATCH';
    } else if (cat.includes('ethereum')) {
      color1 = '#627eea'; color2 = '#1e1b4b'; symbol = 'Ξ'; label = 'ETHEREUM INTEL';
    } else if (cat.includes('defi')) {
      color1 = '#10b981'; color2 = '#064e3b'; symbol = '🏦'; label = 'DEFI PROTOCOL';
    } else if (cat.includes('nft')) {
      color1 = '#a855f7'; color2 = '#4c1d95'; symbol = '🖼️'; label = 'WEB3 & DIGITAL ASSETS';
    } else if (cat.includes('altcoin')) {
      color1 = '#ec4899'; color2 = '#831843'; symbol = '🚀'; label = 'ALTCOIN DYNAMICS';
    } else if (cat.includes('mining')) {
      color1 = '#f97316'; color2 = '#7c2d12'; symbol = '⛏️'; label = 'MINING & INFRASTRUCTURE';
    } else if (cat.includes('regulation') || cat.includes('policy')) {
      color1 = '#ef4444'; color2 = '#450a0a'; symbol = '⚖️'; label = 'GLOBAL POLICY & LAW';
    }
  }

  return (
    <div 
      className="w-full h-[180px] relative overflow-hidden flex flex-col justify-between p-4 select-none"
      style={{
        background: `linear-gradient(135deg, #09090d 0%, ${color2} 100%)`
      }}
    >
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.2) 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }}
      />
      <div 
        className="absolute -top-10 -right-10 w-36 h-36 rounded-full blur-3xl opacity-30 pointer-events-none"
        style={{ backgroundColor: color1 }}
      />
      <div 
        className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full blur-2xl opacity-20 pointer-events-none"
        style={{ backgroundColor: color1 }}
      />

      <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: color1 }} />
          <span className="text-[10px] font-mono font-bold tracking-wider uppercase" style={{ color: color1 }}>
            {label}
          </span>
        </div>
        <span className="text-xl leading-none">{symbol}</span>
      </div>

      <div className="relative z-10 my-auto py-1">
        <p className="text-white font-sans font-extrabold text-sm line-clamp-2 leading-snug drop-shadow-md">
          {title}
        </p>
      </div>

      <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-2 text-[9px] font-mono text-gray-400">
        <span className="uppercase tracking-wider">{source}</span>
        <span className="font-bold tracking-widest text-white/70">HATTY'S NEWS</span>
      </div>
    </div>
  );
}

// Resilient Card Thumbnail Component: Falls back to editorial photo, then native DOM banner with no broken images
function CardImage({
  article,
  mode,
}: {
  article: Article;
  mode: AppMode;
}) {
  const [imgSrc, setImgSrc] = useState<string>(() => {
    if (article.img && !article.img.startsWith('data:image/svg+xml;utf8')) {
      return article.img;
    }
    return getEditorialPhoto(article.primaryCat, article.title, mode);
  });
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (article.img && !article.img.startsWith('data:image/svg+xml;utf8')) {
      setImgSrc(article.img);
      setHasError(false);
    } else {
      setImgSrc(getEditorialPhoto(article.primaryCat, article.title, mode));
      setHasError(false);
    }
  }, [article.img, article.primaryCat, article.title, mode]);

  const handleError = () => {
    const fallbackPhoto = getEditorialPhoto(article.primaryCat, article.title, mode);
    if (imgSrc !== fallbackPhoto) {
      setImgSrc(fallbackPhoto);
    } else {
      setHasError(true);
    }
  };

  if (hasError) {
    return (
      <ThemedCardBanner
        category={article.primaryCat}
        title={article.title}
        mode={mode}
        source={article.src}
      />
    );
  }

  return (
    <img
      src={imgSrc}
      alt=""
      className="ci"
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={handleError}
    />
  );
}

// Multi-tag classification function for both modes
function classifyArticle(title: string, content: string, feedDefaultCat: string, mode: AppMode): { primary: string; matched: string[] } {
  const text = `${title} ${content}`.toLowerCase();
  const matched = new Set<string>();

  if (feedDefaultCat && feedDefaultCat !== 'all') {
    matched.add(feedDefaultCat);
  }

  const rules = mode === 'world' ? WORLD_CATEGORY_RULES : CRYPTO_CATEGORY_RULES;

  for (const [cat, regex] of Object.entries(rules)) {
    if (regex.test(text)) {
      matched.add(cat);
    }
  }

  const matchedList = Array.from(matched);
  let primary = feedDefaultCat !== 'all' ? feedDefaultCat : (matchedList[0] || 'all');
  
  return {
    primary,
    matched: matchedList
  };
}

// 3D Flying Articles Component
function FlyingArticles({ liveArticles, mode }: { liveArticles: Article[]; mode: AppMode }) {
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    const headlines = liveArticles.length > 0 
      ? liveArticles.slice(0, 16).map(a => ({
          tag: mode === 'world' ? 'WIRE REPORT' : 'LIVE REPORT',
          cat: a.primaryCat.toUpperCase(),
          text: a.title
        }))
      : (mode === 'world' ? WORLD_SPLASH_HEADLINES : CRYPTO_SPLASH_HEADLINES);

    const items = Array.from({ length: 22 }).map((_, i) => {
      const headline = headlines[i % headlines.length];
      const startAngle = (Math.PI * 2 * i) / 22;
      const radius = 25 + Math.random() * 45;
      
      return {
        id: i,
        headline,
        startX: 50 + Math.cos(startAngle) * (radius * 0.15),
        startY: 50 + Math.sin(startAngle) * (radius * 0.15),
        endX: 50 + Math.cos(startAngle) * radius * 1.8,
        endY: 50 + Math.sin(startAngle) * radius * 1.8,
        rotX: (Math.random() - 0.5) * 35,
        rotY: (Math.random() - 0.5) * 35,
        rotZ: (Math.random() - 0.5) * 20,
        delay: (i * 0.22) % 3.5,
        duration: 2.2 + (Math.random() * 0.8),
      };
    });
    setParticles(items);
  }, [liveArticles, mode]);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none perspective-stage">
      <div className="absolute inset-x-0 bottom-[-20%] h-[70%] cyber-grid opacity-30" />
      
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{
            opacity: 0,
            scale: 0.08,
            left: `${p.startX}%`,
            top: `${p.startY}%`,
            transform: `translate3d(-50%, -50%, -1400px) rotateX(${p.rotX}deg) rotateY(${p.rotY}deg) rotateZ(${p.rotZ}deg)`,
          }}
          animate={{
            opacity: [0, 0.2, 0.95, 0.85, 0],
            scale: [0.08, 0.25, 0.9, 1.8, 2.6],
            left: [`${p.startX}%`, `${p.startX * 0.7 + p.endX * 0.3}%`, `${p.endX}%`],
            top: [`${p.startY}%`, `${p.startY * 0.7 + p.endY * 0.3}%`, `${p.endY}%`],
            transform: [
              `translate3d(-50%, -50%, -1400px) rotateX(${p.rotX}deg) rotateY(${p.rotY}deg) rotateZ(${p.rotZ}deg)`,
              `translate3d(-50%, -50%, -600px) rotateX(${p.rotX * 0.7}deg) rotateY(${p.rotY * 0.7}deg) rotateZ(${p.rotZ * 0.7}deg)`,
              `translate3d(-50%, -50%, 500px) rotateX(${p.rotX * 1.2}deg) rotateY(${p.rotY * 1.2}deg) rotateZ(${p.rotZ * 1.2}deg)`
            ],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: [0.15, 0.0, 0.2, 1],
          }}
          style={{
            position: 'absolute',
            transformStyle: 'preserve-3d',
            willChange: 'transform, opacity',
          }}
          className={`w-[280px] sm:w-[340px] bg-[rgba(14,14,18,0.92)] border border-[rgba(255,255,255,0.18)] p-4 rounded-xl backdrop-blur-md shadow-[0_15px_50px_rgba(0,0,0,0.8),0_0_30px_${mode === 'world' ? 'rgba(37,99,235,0.25)' : 'rgba(220,38,38,0.25)'}] flex flex-col gap-2 preserve-3d`}
        >
          <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.12)] pb-2">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${mode === 'world' ? 'bg-blue-500 animate-ping' : 'bg-[var(--red)] animate-ping'}`} />
              <span className={`text-[9px] font-mono font-bold tracking-wider ${mode === 'world' ? 'text-blue-400' : 'text-[var(--red-b)]'} uppercase`}>
                {p.headline.tag}
              </span>
            </div>
            <span className="text-[8px] font-mono text-gray-400 border border-[rgba(255,255,255,0.15)] px-1.5 py-0.5 rounded">
              {p.headline.cat}
            </span>
          </div>

          <div className="text-white font-sans font-bold text-xs sm:text-sm line-clamp-2 leading-snug drop-shadow-sm">
            {p.headline.text}
          </div>

          <div className="space-y-1 mt-1 opacity-60">
            <div className="w-full h-1 bg-white/20 rounded-full" />
            <div className="w-4/5 h-1 bg-white/15 rounded-full" />
            <div className="w-3/5 h-1 bg-white/10 rounded-full" />
          </div>

          <div className="flex items-center justify-between text-[7px] font-mono text-gray-500 pt-1 border-t border-white/5">
            <span>{mode === 'world' ? 'GLOBAL WIRE // #0' : 'CRYPTO TERMINAL // #0'}{p.id + 10}</span>
            <span>VERIFIED FACTUAL ✓</span>
          </div>
        </motion.div>
      ))}

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(3,3,3,0.85)_80%,#030303_100%)] z-10 pointer-events-none" />
    </div>
  );
}

/* --- LIVE COINBASE TRADING TICKER (CRYPTO MODE) --- */
interface TickerToken {
  symbol: string;
  name: string;
  price: number;
  open24h: number;
  change24h: number;
  flash: 'up' | 'down' | null;
  formatted: string;
}

const DEFAULT_TOKENS: Record<string, TickerToken> = {
  'BTC-USD': { symbol: 'BTC', name: 'Bitcoin', price: 82300, open24h: 81400, change24h: 1.1, flash: null, formatted: '$82,300.00' },
  'ETH-USD': { symbol: 'ETH', name: 'Ethereum', price: 2415, open24h: 2400, change24h: 0.62, flash: null, formatted: '$2,415.00' },
  'SOL-USD': { symbol: 'SOL', name: 'Solana', price: 104.2, open24h: 103.5, change24h: 0.67, flash: null, formatted: '$104.20' },
  'DOGE-USD': { symbol: 'DOGE', name: 'Dogecoin', price: 0.079, open24h: 0.078, change24h: 1.28, flash: null, formatted: '$0.0790' },
  'XRP-USD': { symbol: 'XRP', name: 'XRP', price: 0.54, open24h: 0.542, change24h: -0.37, flash: null, formatted: '$0.5400' },
};

function LiveTicker() {
  const [tokens, setTokens] = useState<Record<string, TickerToken>>(DEFAULT_TOKENS);
  const [isConnected, setIsConnected] = useState(false);
  const tokensRef = useRef(tokens);
  tokensRef.current = tokens;

  useEffect(() => {
    const fetchInitial = async () => {
      const productIds = ['BTC-USD', 'ETH-USD', 'SOL-USD', 'DOGE-USD', 'XRP-USD'];
      productIds.forEach(async (id) => {
        try {
          const res = await fetch(`https://api.exchange.coinbase.com/products/${id}/ticker`);
          if (!res.ok) return;
          const data = await res.json();
          if (data && data.price) {
            const rawPrice = parseFloat(data.price);
            const open = parseFloat(data.open_24h) || rawPrice;
            const change = open ? ((rawPrice - open) / open) * 100 : 0;
            const sym = id.split('-')[0];
            const formatted = rawPrice >= 1000 
              ? `$${rawPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : rawPrice >= 1 
              ? `$${rawPrice.toFixed(2)}`
              : `$${rawPrice.toFixed(4)}`;

            setTokens(prev => ({
              ...prev,
              [id]: {
                symbol: sym,
                name: id,
                price: rawPrice,
                open24h: open,
                change24h: change,
                flash: null,
                formatted
              }
            }));
          }
        } catch {}
      });
    };
    fetchInitial();
  }, []);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connect = () => {
      try {
        ws = new WebSocket('wss://ws-feed.exchange.coinbase.com');

        ws.onopen = () => {
          setIsConnected(true);
          ws?.send(JSON.stringify({
            type: 'subscribe',
            product_ids: ['BTC-USD', 'ETH-USD', 'SOL-USD', 'DOGE-USD', 'XRP-USD'],
            channels: ['ticker']
          }));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'ticker' && data.product_id && data.price) {
              const productId = data.product_id;
              const rawPrice = parseFloat(data.price);
              const open = parseFloat(data.open_24h) || rawPrice;
              const change = open ? ((rawPrice - open) / open) * 100 : 0;
              const sym = productId.split('-')[0];
              const prev = tokensRef.current[productId];
              const prevPrice = prev ? prev.price : rawPrice;
              const flash = rawPrice > prevPrice ? 'up' : rawPrice < prevPrice ? 'down' : null;

              const formatted = rawPrice >= 1000 
                ? `$${rawPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : rawPrice >= 1 
                ? `$${rawPrice.toFixed(2)}`
                : `$${rawPrice.toFixed(4)}`;

              setTokens(cur => ({
                ...cur,
                [productId]: {
                  symbol: sym,
                  name: productId,
                  price: rawPrice,
                  open24h: open,
                  change24h: change,
                  flash,
                  formatted
                }
              }));

              if (flash) {
                setTimeout(() => {
                  setTokens(cur => {
                    if (!cur[productId] || cur[productId].flash === null) return cur;
                    return {
                      ...cur,
                      [productId]: {
                        ...cur[productId],
                        flash: null
                      }
                    };
                  });
                }, 450);
              }
            }
          } catch {}
        };

        ws.onclose = () => {
          setIsConnected(false);
          reconnectTimeout = setTimeout(connect, 3000);
        };

        ws.onerror = () => {
          ws?.close();
        };
      } catch {
        reconnectTimeout = setTimeout(connect, 3000);
      }
    };

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, []);

  return (
    <div className="w-full flex items-center justify-between gap-3 overflow-x-auto scrollbar-none py-1">
      <div className="flex items-center gap-2 px-2.5 py-1 bg-red-500/10 border border-red-500/20 rounded-lg shrink-0">
        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
        <span className="text-[10px] font-mono font-bold tracking-wider text-[var(--red)] uppercase hidden sm:inline">
          {isConnected ? 'LIVE COINBASE STREAM (TICK-BY-TICK)' : 'CONNECTING TO STREAM...'}
        </span>
        <span className="text-[10px] font-mono font-bold tracking-wider text-[var(--red)] uppercase sm:hidden">
          LIVE
        </span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {(Object.values(tokens) as TickerToken[]).map((token) => (
          <div
            key={token.symbol}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-xs transition-all duration-200 shrink-0 ${
              token.flash === 'up'
                ? 'bg-emerald-500/25 border-emerald-500/60 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)] scale-[1.02]'
                : token.flash === 'down'
                ? 'bg-rose-500/25 border-rose-500/60 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.4)] scale-[1.02]'
                : 'bg-[var(--surface-solid)] border-[var(--border)] text-[var(--ink)] hover:border-[var(--accent)] shadow-sm'
            }`}
          >
            <span className="font-bold text-[var(--ink-muted)] text-[11px]">{token.symbol}</span>
            <span className="font-semibold text-[var(--ink)] tracking-tight">{token.formatted}</span>
            <span className={`text-[10px] font-bold flex items-center gap-0.5 ${
              token.change24h >= 0 ? 'text-emerald-500 dark:text-green-400' : 'text-rose-500 dark:text-red-400'
            }`}>
              {token.change24h >= 0 ? '▲' : '▼'}{Math.abs(token.change24h).toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* --- UNBIASED WORLD NEWS WIRE STRIP (WORLD MODE) --- */
function WorldNewsTicker({ articles }: { articles: Article[] }) {
  const [headlineIndex, setHeadlineIndex] = useState(0);

  const topHeadlines = useMemo(() => {
    return articles.slice(0, 10).map(a => a.title);
  }, [articles]);

  useEffect(() => {
    if (topHeadlines.length === 0) return;
    const interval = setInterval(() => {
      setHeadlineIndex((prev) => (prev + 1) % topHeadlines.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [topHeadlines]);

  return (
    <div className="w-full flex items-center justify-between gap-3 overflow-x-auto scrollbar-none py-1 font-mono text-xs">
      <div className="flex items-center gap-2 px-2.5 py-1 bg-blue-500/15 border border-blue-500/30 rounded-lg shrink-0">
        <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
        <span className="text-[10px] font-bold tracking-wider text-blue-600 dark:text-blue-300 uppercase flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-blue-500" />
          FACT-CHECKED UNBIASED WIRE
        </span>
      </div>

      <div className="flex-1 flex items-center gap-2 px-3 py-1 bg-[var(--surface-solid)] border border-[var(--border)] rounded-lg text-xs truncate max-w-2xl shadow-sm">
        <span className="text-amber-500 dark:text-amber-400 font-bold shrink-0 text-[11px]">WIRE FLASH:</span>
        <span className="text-[var(--ink)] truncate font-sans">
          {topHeadlines[headlineIndex] || 'Connecting to Reuters, Associated Press, BBC, DW wire services...'}
        </span>
      </div>

      <div className="hidden lg:flex items-center gap-2 text-[10px] text-gray-400 shrink-0">
        <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-emerald-400">REUTERS</span>
        <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-emerald-400">AP NEWS</span>
        <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-emerald-400">BBC</span>
        <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-emerald-400">DW</span>
        <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-emerald-400">PBS</span>
      </div>
    </div>
  );
}

/* --- AADS AD UNIT 2459130 --- */
function AadsAdUnit() {
  return (
    <div className="w-full my-5 flex flex-col items-center justify-center">
      {/* BEGIN AADS AD UNIT 2459130 */}
      <div id="frame" className="w-full relative" style={{ margin: 'auto', zIndex: 20 }}>
        <iframe
          data-aa="2459130"
          src="//acceptable.a-ads.com/2459130/?size=Adaptive"
          className="w-full sm:w-[70%] mx-auto block overflow-hidden"
          style={{ border: 0, padding: 0, height: 'auto', minHeight: '90px' }}
          title="AADS Adaptive Advertisement"
        />
        <div className="w-full sm:w-[70%] mx-auto relative flex justify-center sm:justify-start">
          <a
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              fontSize: '13px',
              color: '#263238',
              padding: '4px 10px',
              background: '#F8F8F9',
              textDecoration: 'none',
              borderRadius: '0 0 4px 4px',
            }}
            id="frame-link"
            href="https://aads.com/campaigns/new/?source_id=2459130&source_type=ad_unit&partner=2459130"
          >
            Advertise here
          </a>
        </div>
      </div>
      {/* END AADS AD UNIT 2459130 */}
    </div>
  );
}

export default function App() {
  const [mode, setMode] = useState<AppMode>('crypto');
  const [articles, setArticles] = useState<Article[]>([]);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [fearGreed, setFearGreed] = useState<FearGreedData | null>(null);
  const [showFearGreed, setShowFearGreed] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [splashProgress, setSplashProgress] = useState(0);

  // PWA Standalone App State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  // Detect PWA installation status and beforeinstallprompt event
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    if (isStandalone) {
      setIsInstalled(true);
    }

    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      try {
        const choice = await deferredPrompt.userChoice;
        if (choice && choice.outcome === 'accepted') {
          setIsInstalled(true);
        }
      } catch {}
      setDeferredPrompt(null);
    } else {
      setShowInstallModal(true);
    }
  };

  // Apply world-mode class to document.body for CSS theme transformation
  useEffect(() => {
    if (mode === 'world') {
      document.body.classList.add('world-mode');
    } else {
      document.body.classList.remove('world-mode');
    }
  }, [mode]);

  // Load cached articles on mount for instant zero-lag rendering
  useEffect(() => {
    try {
      const cacheKey = mode === 'world' ? 'hattys_news_world_cache_v3' : 'hattys_news_crypto_cache_v3';
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const restored = parsed.map((a: any) => ({
            ...a,
            img: (a.img && !a.img.startsWith('data:image/svg+xml;utf8')) ? a.img : getEditorialPhoto(a.primaryCat, a.title, mode),
            date: new Date(a.date)
          }));
          setArticles(restored);
          setLoading(false);
        }
      }
    } catch {
      // Ignore cache parse error
    }
  }, [mode]);

  // Animate splash screen loading bar
  useEffect(() => {
    if (!showSplash) return;
    const interval = setInterval(() => {
      setSplashProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 4;
      });
    }, 90);

    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3200);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [showSplash]);

  // Keyboard shortcut to skip splash
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (showSplash && (e.key === ' ' || e.key === 'Escape' || e.key === 'Enter')) {
        setShowSplash(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showSplash]);

  // Fetch individual feed
  const fetchFeed = async (feed: FeedConfig, targetMode: AppMode): Promise<Article[]> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(`/api/news?url=${encodeURIComponent(feed.u)}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) return [];
      const data = await response.json();
      if (!data.items || !Array.isArray(data.items)) return [];

      return data.items.map((i: any, idx: number) => {
        let img = '';
        
        if (i.enclosure?.url) {
          img = i.enclosure.url;
        } else if (i['media:content']) {
          const media = i['media:content'];
          img = Array.isArray(media) ? (media[0]?.$?.url || media[0]?.url) : (media?.$?.url || media?.url);
        } else if (i['media:thumbnail']) {
          img = i['media:thumbnail']?.$?.url || i['media:thumbnail']?.url;
        } else {
          const content = i.contentEncoded || i.content || i.description || '';
          const match = content.match(/<img[^>]+src=["']([^"']+)["']/i);
          if (match && match[1]) {
            const candidate = match[1].trim();
            if (!candidate.includes('feedburner') && !candidate.includes('pixel') && !candidate.includes('spacer') && !candidate.endsWith('.gif')) {
              img = candidate;
            }
          }
        }

        if (img && img.startsWith('http://')) {
          img = img.replace(/^http:\/\//i, 'https://');
        }

        const title = i.title ? i.title.trim() : (targetMode === 'world' ? 'World Wire Update' : 'Crypto Market Update');
        const snippet = (i.contentSnippet || i.description || '')
          .replace(/<[^>]*>/g, '')
          .slice(0, 140)
          .trim();

        const { primary, matched } = classifyArticle(title, snippet, feed.defaultCat, targetMode);

        if (!img) {
          img = getEditorialPhoto(primary, title, targetMode);
        }

        return {
          id: `${targetMode}-${feed.n}-${idx}-${encodeURIComponent(title.slice(0, 20))}`,
          title,
          link: i.link || '#',
          img,
          date: new Date(i.pubDate || i.isoDate || Date.now()),
          src: feed.n,
          primaryCat: primary,
          matchedCategories: matched,
          snippet,
          mode: targetMode
        };
      });
    } catch {
      return [];
    }
  };

  // Aggregator with progressive merging and deduplication
  const loadNews = useCallback(async () => {
    setLoading(true);
    const activeFeeds = mode === 'world' ? WORLD_FEEDS : CRYPTO_FEEDS;
    
    try {
      const results = await Promise.all(activeFeeds.map(f => fetchFeed(f, mode)));
      const rawArticles = results.flat();

      const seen = new Set<string>();
      const deduped: Article[] = [];

      for (const a of rawArticles) {
        const normKey = a.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 45);
        if (!seen.has(normKey)) {
          seen.add(normKey);
          deduped.push(a);
        }
      }

      deduped.sort((a, b) => b.date.getTime() - a.date.getTime());

      if (deduped.length > 0) {
        setArticles(deduped);
        try {
          const cacheKey = mode === 'world' ? 'hattys_news_world_cache_v3' : 'hattys_news_crypto_cache_v3';
          localStorage.setItem(cacheKey, JSON.stringify(deduped.slice(0, 150)));
        } catch {}
      }
    } catch (err) {
      console.error('Failed to aggregate feeds', err);
    } finally {
      setLoading(false);
    }
  }, [mode]);

  const fetchFearGreed = async () => {
    try {
      const res = await fetch(`https://api.alternative.me/fng/?limit=2&t=${Date.now()}`);
      const data = await res.json();
      if (data.data && data.data.length > 0) {
        const current = data.data[0];
        if (data.data[1]) {
          current.previous_value = data.data[1].value;
        }
        setFearGreed(current);
      }
    } catch (e) {
      console.error('Failed to fetch Fear & Greed Index', e);
    }
  };

  useEffect(() => {
    loadNews();
    if (mode === 'crypto') {
      fetchFearGreed();
    }
  }, [loadNews, mode]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [isDark]);

  // Switch between Crypto and World News modes
  const handleModeSwitch = (newMode: AppMode) => {
    if (newMode === mode) return;
    setMode(newMode);
    setFilter('all');
    setQuery('');
  };

  // Active categories list based on current mode
  const activeCategories = mode === 'world' ? WORLD_CATEGORIES : CRYPTO_CATEGORIES;

  // Real-time category article counters
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: articles.length };
    activeCategories.forEach(cat => {
      if (cat.id === 'all') return;
      counts[cat.id] = articles.filter(a => 
        a.matchedCategories.includes(cat.id) || a.primaryCat === cat.id
      ).length;
    });
    return counts;
  }, [articles, activeCategories]);

  // Filtered articles list
  const filtered = useMemo(() => {
    return articles.filter(a => {
      const matchCat = filter === 'all' || a.matchedCategories.includes(filter) || a.primaryCat === filter;
      const q = query.toLowerCase();
      const matchQuery = !q || a.title.toLowerCase().includes(q) || a.src.toLowerCase().includes(q) || (a.snippet && a.snippet.toLowerCase().includes(q));
      return matchCat && matchQuery;
    });
  }, [articles, filter, query]);

  // Copy share link helper
  const handleCopyLink = (id: string, link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // LiveCoinWatch bottom widget
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://www.livecoinwatch.com/static/lcw-widget.js';
    script.defer = true;
    document.body.appendChild(script);
    return () => {
      try {
        document.body.removeChild(script);
      } catch {}
    };
  }, []);

  return (
    <div className="min-h-screen text-[var(--ink)]">
      {/* 3D Splash Screen */}
      <AnimatePresence>
        {showSplash && (
          <motion.div
            id="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-0 z-[99999] bg-[#030303] flex flex-col items-center justify-center overflow-hidden cursor-pointer"
            onClick={() => setShowSplash(false)}
          >
            <FlyingArticles liveArticles={articles} mode={mode} />

            <div className="relative z-30 flex flex-col items-center px-4 max-w-xl text-center pointer-events-auto">
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex items-center gap-2 px-3 py-1 bg-[rgba(220,38,38,0.15)] border border-[rgba(220,38,38,0.4)] rounded-full mb-4 backdrop-blur-md shadow-[0_0_15px_rgba(220,38,38,0.3)]"
              >
                <span className="w-2 h-2 rounded-full bg-[var(--red)] animate-ping" />
                <span className="text-[10px] font-mono tracking-widest text-white uppercase font-bold">
                  SATELLITE INTEL STREAM // LIVE
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, scale: 0.9, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="font-display text-[clamp(3.2rem,11vw,7.5rem)] text-white tracking-wider leading-none drop-shadow-[0_0_40px_rgba(220,38,38,0.9)] select-none"
              >
                HATTY'S NEWS
              </motion.h1>

              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="font-mono text-xs sm:text-sm text-[rgba(255,255,255,0.7)] tracking-[6px] sm:tracking-[8px] uppercase mt-2 select-none"
              >
                GLOBAL & CRYPTO INTELLIGENCE TERMINAL
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, width: "0%" }}
                animate={{ opacity: 1, width: "100%" }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="w-full max-w-xs mt-8 space-y-2"
              >
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden border border-white/10">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-[var(--red)] via-[var(--red-b)] to-white rounded-full shadow-[0_0_10px_var(--red)]"
                    style={{ width: `${splashProgress}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[9px] font-mono text-gray-400">
                  <span>CONNECTING TO GLOBAL SYNDICATE...</span>
                  <span className="text-[var(--red-b)] font-bold">{splashProgress}%</span>
                </div>
              </motion.div>

              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSplash(false);
                }}
                className="mt-6 px-6 py-2.5 bg-gradient-to-r from-[var(--red)] to-[#991b1b] hover:from-[var(--red-b)] hover:to-[var(--red)] text-white text-xs font-mono font-bold rounded-lg border border-red-500/50 shadow-[0_0_25px_rgba(220,38,38,0.4)] flex items-center gap-2 group transition-all"
              >
                <span>ENTER TERMINAL</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </motion.button>
              
              <div className="text-[10px] font-mono text-gray-500 mt-2">
                Click anywhere or press Space to skip
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fear & Greed Index Modal */}
      <AnimatePresence>
        {showFearGreed && (
          <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => setShowFearGreed(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-[var(--surface-solid)] border border-[var(--border)] rounded-2xl p-6 shadow-2xl z-10 text-[var(--ink)]"
            >
              <button 
                className="absolute top-4 right-4 text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors p-1"
                onClick={() => setShowFearGreed(false)}
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center">
                <div className="cs mb-1">MARKET SENTIMENT MONITOR</div>
                <h2 className="font-display text-4xl text-[var(--ink)] mb-6">FEAR & GREED INDEX</h2>
                
                {fearGreed ? (
                  <div className="space-y-6">
                    <div className="relative inline-flex items-center justify-center">
                      <svg width="200" height="110" viewBox="0 0 200 110" className="overflow-visible">
                        <path 
                          d="M 20 100 A 80 80 0 0 1 180 100" 
                          fill="none" 
                          stroke={isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)"} 
                          strokeWidth="16" 
                          strokeLinecap="round" 
                        />
                        <path 
                          d="M 20 100 A 80 80 0 0 1 180 100" 
                          fill="none" 
                          stroke="url(#fgGradient)" 
                          strokeWidth="16" 
                          strokeLinecap="round"
                          strokeDasharray="251.2"
                          strokeDashoffset={251.2 - (251.2 * parseInt(fearGreed.value)) / 100}
                          className="transition-all duration-1000 ease-out"
                        />
                        <defs>
                          <linearGradient id="fgGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#ef4444" />
                            <stop offset="35%" stopColor="#eab308" />
                            <stop offset="65%" stopColor="#84cc16" />
                            <stop offset="100%" stopColor="#22c55e" />
                          </linearGradient>
                        </defs>
                        <g transform={`rotate(${((parseInt(fearGreed.value) / 100) * 180) - 90}, 100, 100)`} className="transition-transform duration-1000">
                          <line x1="100" y1="100" x2="100" y2="35" stroke={isDark ? "#ffffff" : "#0f172a"} strokeWidth="3.5" strokeLinecap="round" />
                          <circle cx="100" cy="100" r="6" fill={isDark ? "#ffffff" : "#0f172a"} />
                        </g>
                      </svg>

                      <div className="absolute bottom-[-10px] flex flex-col items-center">
                        <div className={`text-5xl font-bold font-mono text-[var(--ink)] ${isDark ? 'drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]' : ''}`}>
                          {fearGreed.value}
                        </div>
                      </div>
                    </div>
                    
                    <div 
                      className="text-2xl font-bold uppercase tracking-widest mt-2" 
                      style={{ 
                        color: 
                          parseInt(fearGreed.value) > 75 ? '#22c55e' : 
                          parseInt(fearGreed.value) > 50 ? '#84cc16' : 
                          parseInt(fearGreed.value) > 25 ? '#eab308' : '#ef4444'
                      }}
                    >
                      {fearGreed.value_classification}
                    </div>

                    {fearGreed.previous_value && (
                      <div className="flex items-center justify-center gap-6 text-xs font-mono py-2.5 px-4 bg-[var(--bg)] rounded-xl border border-[var(--border)]">
                        <div className="flex flex-col items-center">
                          <span className="text-[var(--ink-muted)]">YESTERDAY</span>
                          <span className="text-[var(--ink)] font-bold text-sm">{fearGreed.previous_value}</span>
                        </div>
                        <div className="h-6 w-px bg-[var(--border)]" />
                        <div className="flex flex-col items-center">
                          <span className="text-[var(--ink-muted)]">24H TREND</span>
                          <span className={`font-bold flex items-center gap-1 text-sm ${
                            parseInt(fearGreed.value) >= parseInt(fearGreed.previous_value) ? 'text-emerald-500' : 'text-rose-500'
                          }`}>
                            {parseInt(fearGreed.value) >= parseInt(fearGreed.previous_value) ? (
                              <><TrendingUp className="w-3.5 h-3.5" /> UP</>
                            ) : (
                              <><TrendingDown className="w-3.5 h-3.5" /> DOWN</>
                            )}
                          </span>
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-[var(--ink-muted)] leading-relaxed text-left bg-[var(--bg)] p-4 rounded-xl border border-[var(--border)]">
                      The market sentiment monitor tracks fear and greed dynamics across institutional and retail markets. Extreme fear can indicate undervaluation, while extreme greed can indicate market overextension.
                    </p>
                    
                    <div className="flex justify-between items-center text-[10px] font-mono text-[var(--ink-muted)] border-t border-[var(--border)] pt-3">
                      <div>Updated: {new Date(parseInt(fearGreed.timestamp) * 1000).toLocaleDateString()}</div>
                      <a 
                        href="https://alternative.me/crypto/fear-and-greed-index/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[var(--accent)] hover:underline flex items-center gap-1 font-semibold"
                      >
                        Alternative.me <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
                    <span className="font-mono text-xs text-[var(--ink-muted)]">SYNCING SENTIMENT DATA...</span>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PWA / App Installation Modal */}
      <AnimatePresence>
        {showInstallModal && (
          <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => setShowInstallModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-[var(--surface-solid)] border border-[var(--border)] rounded-2xl p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto text-[var(--ink)]"
            >
              <button 
                className="absolute top-4 right-4 text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors p-1"
                onClick={() => setShowInstallModal(false)}
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center">
                <div className="relative inline-block mb-3">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-red-600 to-blue-600 blur-lg opacity-60" />
                  <img 
                    src="/favicon.svg" 
                    alt="Hatty's News Logo" 
                    className="relative w-16 h-16 rounded-2xl border border-white/20 shadow-xl mx-auto" 
                  />
                </div>

                <div className="cs mb-1">STANDALONE WEB APP</div>
                <h2 className="font-display text-3xl sm:text-4xl text-[var(--ink)] mb-2">INSTALL HATTY'S NEWS</h2>
                <p className="text-xs text-[var(--ink-muted)] mb-5">
                  Save Hatty's News directly to your Home Screen or Desktop for instant, full-screen offline-ready access.
                </p>

                {isIOS ? (
                  /* iOS Safari Instructions */
                  <div className="text-left space-y-3 bg-[var(--bg)] p-4 rounded-xl border border-[var(--border)] text-xs font-mono text-[var(--ink)]">
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-500 font-bold flex items-center justify-center shrink-0">1</span>
                      <div>
                        Tap the <strong className="text-[var(--ink)]">Share</strong> button <Share2 className="w-3.5 h-3.5 inline text-blue-500 mx-1" /> at the bottom of Safari.
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-500 font-bold flex items-center justify-center shrink-0">2</span>
                      <div>
                        Scroll down and tap <strong className="text-[var(--ink)]">"Add to Home Screen"</strong> <span className="text-amber-500">📲</span>.
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-500 font-bold flex items-center justify-center shrink-0">3</span>
                      <div>
                        Tap <strong className="text-[var(--ink)]">"Add"</strong> in the top right. Hatty's News will now open as a standalone app!
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Android / Desktop Chrome & Edge Instructions */
                  <div className="space-y-4">
                    <div className="text-left space-y-2.5 bg-[var(--bg)] p-4 rounded-xl border border-[var(--border)] text-xs font-mono text-[var(--ink-muted)]">
                      <div className="flex items-center gap-2 text-[var(--ink)] font-bold">
                        <Smartphone className="w-4 h-4 text-emerald-500" />
                        <span>FAST 1-CLICK INSTALLATION</span>
                      </div>
                      <p className="text-[11px] text-[var(--ink-muted)]">
                        Click the install button below or select <strong className="text-[var(--ink)]">"Install Hatty's News"</strong> from your browser menu.
                      </p>
                    </div>

                    <button
                      onClick={async () => {
                        if (deferredPrompt) {
                          deferredPrompt.prompt();
                          const choice = await deferredPrompt.userChoice;
                          if (choice?.outcome === 'accepted') {
                            setIsInstalled(true);
                            setShowInstallModal(false);
                          }
                          setDeferredPrompt(null);
                        } else {
                          setShowInstallModal(false);
                        }
                      }}
                      className="w-full py-3 bg-gradient-to-r from-red-600 via-purple-600 to-blue-600 text-white font-mono font-bold text-xs rounded-xl shadow-[0_0_25px_rgba(220,38,38,0.4)] hover:opacity-95 transition-all flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4 text-white" />
                      <span>{deferredPrompt ? 'INSTALL APP NOW' : 'GOT IT'}</span>
                    </button>
                  </div>
                )}

                <div className="flex justify-between items-center text-[10px] font-mono text-[var(--ink-muted)] border-t border-[var(--border)] pt-4 mt-5">
                  <span>FREE // NO APP STORE NEEDED</span>
                  <span className="text-emerald-500 font-bold">PWA READY ✓</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Top Header */}
      <header id="hdr" className="sticky top-0 z-80 bg-[var(--surface)] backdrop-blur-xl border-b border-[var(--border)] shadow-md">
        <div className="max-w-[1440px] mx-auto px-3 py-2 sm:px-6 sm:py-3">
          {/* Mobile Layout (< md) */}
          <div className="flex flex-col gap-2.5 md:hidden">
            {/* Mobile Row 1: Brand & Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setFilter('all'); setQuery(''); }}>
                <div className="relative group shrink-0">
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-600 to-blue-600 blur-sm opacity-50" />
                  <img 
                    src="/favicon.svg" 
                    alt="Hatty's News Logo" 
                    className="relative w-8 h-8 rounded-xl border border-white/20 shadow-md" 
                  />
                </div>
                <span className="logo text-2xl font-display tracking-wide">HATTY'S NEWS</span>
              </div>

              {/* Mobile Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                {!isInstalled && (
                  <button 
                    onClick={handleInstallClick}
                    className="ibtn w-8 h-8 p-0 flex items-center justify-center font-mono text-xs text-[var(--accent)] bg-[var(--surface-solid)] border border-[var(--border)]" 
                    title="Install App"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                )}

                {mode === 'crypto' && (
                  <button 
                    className="ibtn w-8 h-8 p-0 flex items-center justify-center font-mono text-xs shrink-0" 
                    onClick={() => setShowFearGreed(true)}
                    title="Fear & Greed Index"
                  >
                    <Gauge className="w-4 h-4 text-[var(--accent)]" />
                  </button>
                )}

                <button 
                  className="ibtn w-8 h-8 p-0 flex items-center justify-center shrink-0" 
                  onClick={() => setIsDark(!isDark)}
                  title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                  {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                </button>

                <button 
                  className="ibtn w-8 h-8 p-0 flex items-center justify-center shrink-0" 
                  onClick={loadNews}
                  title={`Refresh All ${mode === 'world' ? 'World' : 'Crypto'} Feeds`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[var(--accent)]' : ''}`} />
                </button>
                
                <div className="relative">
                  <button 
                    className="ibtn w-8 h-8 p-0 flex items-center justify-center shrink-0" 
                    onClick={() => setShowMenu(!showMenu)}
                    title="Hatty's Ecosystem"
                  >
                    <Menu className="w-3.5 h-3.5" />
                  </button>
                  <AnimatePresence>
                    {showMenu && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          className="absolute right-0 mt-2 w-64 bg-[var(--surface-solid)] border border-[var(--border)] rounded-xl shadow-2xl z-50 overflow-hidden text-[var(--ink)]"
                        >
                          <div className="p-3 text-[10px] font-mono text-[var(--ink-muted)] uppercase border-b border-[var(--border)] bg-[var(--bg)] flex items-center justify-between">
                            <span>Hatty's Network</span>
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          </div>

                          <div className="p-2 border-b border-[var(--border)] bg-black/5 dark:bg-white/5">
                            <button
                              onClick={() => {
                                setShowMenu(false);
                                handleInstallClick();
                              }}
                              className="w-full flex items-center justify-between px-3 py-2 text-xs font-mono font-bold text-white bg-gradient-to-r from-red-600 via-purple-600 to-blue-600 rounded-lg shadow-md hover:opacity-95 transition-opacity"
                            >
                              <span className="flex items-center gap-2">
                                <Download className="w-3.5 h-3.5" />
                                <span>{isInstalled ? 'APP INSTALLED ✓' : 'INSTALL APP'}</span>
                              </span>
                              <span className="text-[10px] opacity-80">{isInstalled ? 'READY' : 'FREE'}</span>
                            </button>
                          </div>

                          <div className="py-1">
                            {OTHER_SITES.map((site) => (
                              <a
                                key={site.url}
                                href={site.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between px-4 py-2.5 text-xs text-[var(--ink)] hover:bg-[var(--accent)] hover:text-white transition-colors group"
                                onClick={() => setShowMenu(false)}
                              >
                                <span className="font-medium">{site.name}</span>
                                <ExternalLink className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
                              </a>
                            ))}
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Mobile Row 2: Mode Switcher (50/50 Thumb Toggle) */}
            <div className="flex items-center p-1 bg-[var(--surface-solid)] border border-[var(--border)] rounded-xl backdrop-blur-md">
              <button
                onClick={() => handleModeSwitch('crypto')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all duration-300 ${
                  mode === 'crypto'
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]'
                    : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
                }`}
              >
                <span>⚡</span>
                <span>CRYPTO</span>
              </button>
              <button
                onClick={() => handleModeSwitch('world')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all duration-300 ${
                  mode === 'world'
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]'
                    : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
                }`}
              >
                <span>🌐</span>
                <span>WORLD NEWS</span>
              </button>
            </div>

            {/* Mobile Row 3: Search Bar */}
            <div className="w-full relative">
              <input
                type="text"
                placeholder={mode === 'world' ? "Search Reuters, AP, BBC, DW wire..." : "Search Blockchain, Assets, Feeds..."}
                className="w-full bg-[var(--surface-solid)] border border-[var(--border)] focus:border-[var(--accent)] text-[var(--ink)] text-xs rounded-xl py-2 pl-9 pr-8 outline-none font-sans placeholder:text-[var(--ink-muted)] transition-all"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-muted)]" />
              {query && (
                <button 
                  onClick={() => setQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--ink-muted)] hover:text-[var(--ink)]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Desktop Layout (>= md) */}
          <div className="hidden md:flex items-center gap-3 lg:gap-4">
            {/* Logo with Mode Badge */}
            <div className="flex items-center gap-2.5 cursor-pointer shrink-0" onClick={() => { setFilter('all'); setQuery(''); }}>
              <div className="relative group shrink-0">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-600 to-blue-600 blur-sm opacity-50 group-hover:opacity-100 transition-opacity" />
                <img 
                  src="/favicon.svg" 
                  alt="Hatty's News Logo" 
                  className="relative w-9 h-9 rounded-xl border border-white/20 shadow-md group-hover:scale-105 transition-transform" 
                />
              </div>
              <span className="logo text-3xl font-display">HATTY'S NEWS</span>
              <span className={`hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono font-bold border transition-colors ${
                mode === 'world' 
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' 
                  : 'bg-red-500/10 text-red-500 border-red-500/20'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${mode === 'world' ? 'bg-blue-400' : 'bg-red-500'}`} />
                {mode === 'world' ? 'WORLD WIRE' : 'CRYPTO TERMINAL'}
              </span>
            </div>

            {/* Mode Switcher Buttons */}
            <div className="flex items-center p-1 bg-[var(--surface-solid)] border border-[var(--border)] rounded-full backdrop-blur-md shrink-0">
              <button
                onClick={() => handleModeSwitch('crypto')}
                className={`px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 transition-all duration-300 ${
                  mode === 'crypto'
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)] scale-100'
                    : 'text-[var(--ink-muted)] hover:text-[var(--ink)] scale-95'
                }`}
              >
                <span>⚡</span>
                <span>CRYPTO</span>
              </button>
              <button
                onClick={() => handleModeSwitch('world')}
                className={`px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 transition-all duration-300 ${
                  mode === 'world'
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)] scale-100'
                    : 'text-[var(--ink-muted)] hover:text-[var(--ink)] scale-95'
                }`}
              >
                <span>🌐</span>
                <span>WORLD NEWS</span>
              </button>
            </div>

            {/* Search Box */}
            <div className="flex-1 min-w-[200px] relative">
              <input
                type="text"
                placeholder={mode === 'world' ? "Search Reuters, Associated Press, BBC, DW, Global Wire..." : "Search Blockchain Intelligence, Assets, Feeds..."}
                className="w-full bg-[var(--surface-solid)] border border-[var(--border)] focus:border-[var(--accent)] text-[var(--ink)] text-xs sm:text-sm rounded-xl py-2 pl-9 pr-8 outline-none font-sans placeholder:text-[var(--ink-muted)] transition-all"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-muted)]" />
              {query && (
                <button 
                  onClick={() => setQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--ink-muted)] hover:text-[var(--ink)]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Desktop Action Buttons */}
            <div className="flex items-center gap-2 shrink-0 ml-auto">
              {!isInstalled && (
                <button 
                  onClick={handleInstallClick}
                  className="ibtn w-auto px-2.5 sm:px-3 flex items-center gap-1.5 font-mono text-xs text-[var(--ink)] bg-gradient-to-r from-red-600/15 via-purple-600/15 to-blue-600/15 hover:from-red-600/30 hover:to-blue-600/30 border border-[var(--border)] shadow-sm shrink-0" 
                  title="Install Hatty's News App"
                >
                  <Download className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span className="hidden sm:inline font-bold">INSTALL APP</span>
                </button>
              )}

              {mode === 'crypto' && (
                <button 
                  className="ibtn w-auto px-3 flex items-center gap-1.5 font-mono text-xs shrink-0" 
                  onClick={() => setShowFearGreed(true)}
                  title="Fear & Greed Index"
                >
                  <Gauge className="w-4 h-4 text-[var(--accent)]" />
                  {fearGreed && (
                    <span className="hidden sm:inline font-bold" style={{ 
                      color: parseInt(fearGreed.value) > 50 ? '#22c55e' : '#ef4444' 
                    }}>
                      {fearGreed.value} {fearGreed.value_classification.split(' ')[0]}
                    </span>
                  )}
                </button>
              )}

              <button 
                className="ibtn shrink-0" 
                onClick={() => setIsDark(!isDark)}
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              <button 
                className="ibtn shrink-0" 
                onClick={loadNews}
                title={`Refresh All ${mode === 'world' ? 'World' : 'Crypto'} Feeds`}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[var(--accent)]' : ''}`} />
              </button>
              
              <div className="relative">
                <button 
                  className="ibtn shrink-0" 
                  onClick={() => setShowMenu(!showMenu)}
                  title="Hatty's Ecosystem"
                >
                  <Menu className="w-4 h-4" />
                </button>
                <AnimatePresence>
                  {showMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-64 bg-[var(--surface-solid)] border border-[var(--border)] rounded-xl shadow-2xl z-50 overflow-hidden text-[var(--ink)]"
                      >
                        <div className="p-3 text-[10px] font-mono text-[var(--ink-muted)] uppercase border-b border-[var(--border)] bg-[var(--bg)] flex items-center justify-between">
                          <span>Hatty's Network</span>
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        </div>

                        <div className="p-2 border-b border-[var(--border)] bg-black/5 dark:bg-white/5">
                          <button
                            onClick={() => {
                              setShowMenu(false);
                              handleInstallClick();
                            }}
                            className="w-full flex items-center justify-between px-3 py-2 text-xs font-mono font-bold text-white bg-gradient-to-r from-red-600 via-purple-600 to-blue-600 rounded-lg shadow-md hover:opacity-95 transition-opacity"
                          >
                            <span className="flex items-center gap-2">
                              <Download className="w-3.5 h-3.5" />
                              <span>{isInstalled ? 'APP INSTALLED ✓' : 'INSTALL APP'}</span>
                            </span>
                            <span className="text-[10px] opacity-80">{isInstalled ? 'READY' : 'FREE'}</span>
                          </button>
                        </div>

                        <div className="py-1">
                          {OTHER_SITES.map((site) => (
                            <a
                              key={site.url}
                              href={site.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between px-4 py-2.5 text-xs text-[var(--ink)] hover:bg-[var(--accent)] hover:text-white transition-colors group"
                              onClick={() => setShowMenu(false)}
                            >
                              <span className="font-medium">{site.name}</span>
                              <ExternalLink className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
                            </a>
                          ))}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Dedicated Top Ticker Strip (Mode-Specific) */}
      <div className="border-b border-[var(--border)] py-1.5 px-3 sm:px-4 shadow-sm bg-[var(--surface-solid)] transition-colors duration-300">
        <div className="max-w-[1440px] mx-auto">
          {mode === 'crypto' ? (
            <LiveTicker />
          ) : (
            <WorldNewsTicker articles={articles} />
          )}
        </div>
      </div>

      {/* Main Terminal Feed */}
      <main className="max-w-[1440px] mx-auto my-6 px-4">
        {/* Navigation Category Filters - Horizontal scroll on mobile, wrap on desktop */}
        <div className="mb-6">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 md:flex-wrap w-full">
            {activeCategories.map(cat => {
              const count = categoryCounts[cat.id] ?? 0;
              const isActive = filter === cat.id;
              
              return (
                <button
                  key={cat.id}
                  className={`fp shrink-0 ${isActive ? 'on' : ''}`}
                  onClick={() => setFilter(cat.id)}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-black/5 dark:bg-white/5 text-[var(--ink-muted)]'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Status subheader */}
        <div className="flex items-center justify-between text-xs font-mono text-[var(--ink-muted)] mb-4 px-1 flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span>SHOWING: <strong className="text-[var(--ink)]">{filtered.length}</strong> {mode === 'world' ? 'GLOBAL DISPATCHES' : 'CRYPTO DISPATCHES'}</span>
            {filter !== 'all' && (
              <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                mode === 'world' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : 'bg-red-500/10 text-red-500 border-red-500/20'
              }`}>
                FILTER: {filter}
              </span>
            )}
            {query && (
              <span className="px-2 py-0.5 rounded bg-[var(--surface-solid)] border border-[var(--border)] text-[var(--ink)] text-[10px]">
                SEARCH: "{query}"
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Radio className={`w-3.5 h-3.5 animate-pulse ${mode === 'world' ? 'text-blue-400' : 'text-[var(--red)]'}`} />
            <span>{mode === 'world' ? 'VERIFIED NON-PARTISAN WIRE SERVICES' : 'ENCRYPTED RSS FEED PROTOCOL'}</span>
          </div>
        </div>

        {/* AADS Adaptive Ad Banner */}
        <AadsAdUnit />

        {/* Loading Skeleton state */}
        {loading && articles.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card h-[360px] skeleton-shimmer">
                <div className="w-full h-[180px] bg-white/5" />
                <div className="p-4 space-y-3">
                  <div className="w-24 h-3 bg-white/10 rounded" />
                  <div className="w-full h-4 bg-white/10 rounded" />
                  <div className="w-3/4 h-4 bg-white/10 rounded" />
                  <div className="w-28 h-7 bg-white/10 rounded mt-6" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center p-16 border border-dashed border-[var(--border)] rounded-2xl bg-[var(--surface)] my-8">
            <ShieldAlert className="w-12 h-12 text-[var(--accent)] mx-auto mb-3 opacity-80" />
            <h2 className="font-display text-[var(--accent)] text-3xl">NO MATCHING DISPATCHES</h2>
            <p className="text-[var(--ink-muted)] max-w-md mx-auto my-3 text-sm">
              No reports match your current category or search criteria. Try choosing another filter or resetting your search.
            </p>
            <div className="flex gap-3 justify-center mt-5">
              <button 
                onClick={() => { setFilter('all'); setQuery(''); }} 
                className="rbtn"
              >
                RESET FILTER
              </button>
              <button 
                onClick={loadNews} 
                className="fp"
              >
                RE-SYNC FEEDS
              </button>
            </div>
          </div>
        ) : (
          /* Article Grid */
          <div id="grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((a, idx) => {
              const categoryConfig = activeCategories.find(c => c.id === a.primaryCat) || activeCategories[0];
              const badgeClass = categoryConfig.badgeClass || (mode === 'world' ? 'badge-world-top' : 'badge-all');

              return (
                <motion.article
                  key={a.id || idx}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: Math.min(idx * 0.03, 0.6), ease: "easeOut" }}
                  className="card group"
                >
                  <div className="relative overflow-hidden w-full h-[180px] bg-[#0c0c10]">
                    <CardImage article={a} mode={mode} />
                    
                    {/* Category Overlay Badge */}
                    <div className="absolute top-2.5 left-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase backdrop-blur-md ${badgeClass}`}>
                        {categoryConfig.label}
                      </span>
                    </div>

                    {/* Mode tag indicator on top right */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                      <button 
                        onClick={() => handleCopyLink(a.id, a.link)}
                        className="w-7 h-7 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md text-gray-300 hover:text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                        title="Copy Article Link"
                      >
                        {copiedId === a.id ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Share2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="cb">
                    <div className="flex items-center justify-between text-[11px] font-mono text-[var(--ink-muted)] mb-1.5">
                      <span className={`font-bold tracking-wide ${mode === 'world' ? 'text-blue-400' : 'text-[var(--accent)]'}`}>
                        {a.src}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 opacity-60" />
                        {a.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <h2 className="ct text-[var(--ink)] hover:text-[var(--accent)] transition-colors" title={a.title}>
                      <a href={a.link} target="_blank" rel="noopener noreferrer">
                        {a.title}
                      </a>
                    </h2>

                    {a.snippet && (
                      <p className="text-xs text-[var(--ink-muted)] line-clamp-2 mb-3 leading-relaxed">
                        {a.snippet}
                      </p>
                    )}

                    <div className="flex-1 min-h-[0.5rem]"></div>

                    <div className="flex items-center justify-between pt-2 border-t border-[var(--border)] mt-auto">
                      <a 
                        href={a.link} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="rbtn flex-1"
                      >
                        <span>READ FULL REPORT</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </main>

      {/* Bottom LiveCoinWatch Marquee Ticker */}
      <div id="tickers" className="fixed bottom-0 left-0 right-0 z-90 bg-[#060608] border-t border-[var(--border)] shadow-2xl pb-[env(safe-area-inset-bottom,0px)]">
        <div 
          className="livecoinwatch-widget-5" 
          lcw-base="USD" 
          lcw-color-tx="#abb8c3" 
          lcw-marquee-1="coins" 
          lcw-marquee-2="movers" 
          lcw-marquee-items="15"
        ></div>
      </div>
    </div>
  );
}
