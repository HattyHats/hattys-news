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
  Download, Smartphone, Sparkles, AlertTriangle,
  Bookmark, Calendar, ChevronDown, ChevronUp, Flame
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
  { n: 'Bitcoin Magazine', u: 'https://bitcoinmagazine.com/feed', defaultCat: 'bitcoin' },
  { n: 'CryptoSlate', u: 'https://cryptoslate.com/feed/', defaultCat: 'all' },
  { n: 'DailyCoin', u: 'https://dailycoin.com/feed/', defaultCat: 'all' },
  { n: 'U.Today', u: 'https://u.today/rss', defaultCat: 'all' },
  { n: 'BeInCrypto', u: 'https://beincrypto.com/feed/', defaultCat: 'all' },
  { n: 'AMBCrypto', u: 'https://ambcrypto.com/feed/', defaultCat: 'altcoin' },
  { n: 'The Defiant', u: 'https://thedefiant.io/api/feed', defaultCat: 'defi' },
  { n: 'CryptoBriefing', u: 'https://cryptobriefing.com/feed/', defaultCat: 'all' },
  { n: 'Bankless', u: 'https://www.bankless.com/rss/feed', defaultCat: 'defi' },
  { n: 'Crypto.News', u: 'https://crypto.news/feed/', defaultCat: 'all' },
  { n: 'CryptoPotato', u: 'https://cryptopotato.com/feed/', defaultCat: 'all' },
  { n: 'NewsBTC', u: 'https://newsbtc.com/feed/', defaultCat: 'bitcoin' },
  { n: 'Bitcoin.com', u: 'https://news.bitcoin.com/feed/', defaultCat: 'bitcoin' },
  { n: 'CoinTelegraph Bitcoin', u: 'https://cointelegraph.com/rss/tag/bitcoin', defaultCat: 'bitcoin' },
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

// Verified Low-Bias, 100% Free Public Broadcasters, Wire Services & Global Outlets
const WORLD_FEEDS: FeedConfig[] = [
  { n: 'Reuters', u: 'https://news.google.com/rss/search?q=source:Reuters&hl=en-US&gl=US&ceid=US:en', defaultCat: 'all' },
  { n: 'Associated Press', u: 'https://news.google.com/rss/search?q=source:%22Associated+Press%22&hl=en-US&gl=US&ceid=US:en', defaultCat: 'all' },
  { n: 'BBC World', u: 'https://feeds.bbci.co.uk/news/world/rss.xml', defaultCat: 'all' },
  { n: 'BBC Business', u: 'https://feeds.bbci.co.uk/news/business/rss.xml', defaultCat: 'economy' },
  { n: 'BBC Technology', u: 'https://feeds.bbci.co.uk/news/technology/rss.xml', defaultCat: 'tech' },
  { n: 'DW News', u: 'https://rss.dw.com/rdf/rss-en-all', defaultCat: 'all' },
  { n: 'France 24', u: 'https://www.france24.com/en/rss', defaultCat: 'all' },
  { n: 'Al Jazeera', u: 'https://www.aljazeera.com/xml/rss/all.xml', defaultCat: 'geopolitics' },
  { n: 'The Guardian World', u: 'https://www.theguardian.com/world/rss', defaultCat: 'all' },
  { n: 'CBC World', u: 'https://www.cbc.ca/cmlink/rss-world', defaultCat: 'all' },
  { n: 'NPR World', u: 'https://feeds.npr.org/1004/rss.xml', defaultCat: 'all' },
  { n: 'NPR News', u: 'https://feeds.npr.org/1001/rss.xml', defaultCat: 'all' },
  { n: 'PBS NewsHour', u: 'https://news.google.com/rss/search?q=source:%22PBS+NewsHour%22&hl=en-US&gl=US&ceid=US:en', defaultCat: 'politics' },
  { n: 'UPI World', u: 'https://rss.upi.com/news/world_news.rss', defaultCat: 'all' },
  { n: 'UPI Top Stories', u: 'https://rss.upi.com/news/top_news.rss', defaultCat: 'all' },
  { n: 'UN News', u: 'https://news.un.org/feed/subscribe/en/news/all/rss.xml', defaultCat: 'geopolitics' },
  { n: 'ABC News AU', u: 'https://www.abc.net.au/news/feed/51120/rss.xml', defaultCat: 'all' },
  { n: 'CNA Asia', u: 'https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml&category=6511', defaultCat: 'all' },
  { n: 'CNA World', u: 'https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml&category=6311', defaultCat: 'all' },
  { n: 'NHK World', u: 'https://news.google.com/rss/search?q=source:%22NHK+WORLD-JAPAN%22&hl=en-US&gl=US&ceid=US:en', defaultCat: 'all' },
  { n: 'Africanews', u: 'https://www.africanews.com/feed/', defaultCat: 'all' },
  { n: 'RTE News Ireland', u: 'https://www.rte.ie/rss/news.xml', defaultCat: 'all' },
  { n: 'AP Politics', u: 'https://news.google.com/rss/search?q=source:%22Associated+Press%22+politics&hl=en-US&gl=US&ceid=US:en', defaultCat: 'politics' },
  { n: 'Reuters Economy', u: 'https://news.google.com/rss/search?q=source:Reuters+economy+OR+markets&hl=en-US&gl=US&ceid=US:en', defaultCat: 'economy' },
  { n: 'NASA Space Wire', u: 'https://www.nasa.gov/news-release/feed/', defaultCat: 'space' },
  { n: 'Phys.org', u: 'https://phys.org/rss-feed/', defaultCat: 'space' },
  { n: 'Ars Technica', u: 'https://feeds.arstechnica.com/arstechnica/index', defaultCat: 'tech' },
  { n: 'The Verge', u: 'https://www.theverge.com/rss/index.xml', defaultCat: 'tech' }
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
  'BTC-USD': { symbol: 'BTC', name: 'Bitcoin', price: 80726.00, open24h: 80695.00, change24h: 0.04, flash: null, formatted: '$80,726.00' },
  'ETH-USD': { symbol: 'ETH', name: 'Ethereum', price: 2356.13, open24h: 2372.20, change24h: -0.68, flash: null, formatted: '$2,356.13' },
  'SOL-USD': { symbol: 'SOL', name: 'Solana', price: 102.26, open24h: 102.17, change24h: 0.09, flash: null, formatted: '$102.26' },
  'DOGE-USD': { symbol: 'DOGE', name: 'Dogecoin', price: 0.0778, open24h: 0.0785, change24h: -0.87, flash: null, formatted: '$0.0778' },
  'XRP-USD': { symbol: 'XRP', name: 'XRP', price: 1.3020, open24h: 1.2890, change24h: 1.01, flash: null, formatted: '$1.3020' },
};

function LiveTicker() {
  const [tokens, setTokens] = useState<Record<string, TickerToken>>(DEFAULT_TOKENS);
  const [isConnected, setIsConnected] = useState(false);
  const tokensRef = useRef(tokens);
  tokensRef.current = tokens;

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const cgRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,dogecoin,ripple&vs_currencies=usd&include_24hr_change=true');
        if (cgRes.ok) {
          const cg = await cgRes.json();
          const map: Record<string, { price: number; change: number }> = {
            'BTC-USD': { price: cg.bitcoin?.usd, change: cg.bitcoin?.usd_24h_change || 0 },
            'ETH-USD': { price: cg.ethereum?.usd, change: cg.ethereum?.usd_24h_change || 0 },
            'SOL-USD': { price: cg.solana?.usd, change: cg.solana?.usd_24h_change || 0 },
            'DOGE-USD': { price: cg.dogecoin?.usd, change: cg.dogecoin?.usd_24h_change || 0 },
            'XRP-USD': { price: cg.ripple?.usd, change: cg.ripple?.usd_24h_change || 0 },
          };

          setTokens(prev => {
            const next = { ...prev };
            for (const [id, val] of Object.entries(map)) {
              if (val.price && next[id]) {
                const rawPrice = val.price;
                const formatted = rawPrice >= 1000
                  ? `$${rawPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : rawPrice >= 1 ? `$${rawPrice.toFixed(2)}` : `$${rawPrice.toFixed(4)}`;
                next[id] = {
                  ...next[id],
                  price: rawPrice,
                  change24h: val.change,
                  formatted
                };
              }
            }
            return next;
          });
        }
      } catch {}

      const productIds = ['BTC-USD', 'ETH-USD', 'SOL-USD', 'DOGE-USD', 'XRP-USD'];
      productIds.forEach(async (id) => {
        try {
          const res = await fetch(`https://api.exchange.coinbase.com/products/${id}/ticker`);
          if (!res.ok) return;
          const data = await res.json();
          if (data && data.price) {
            const rawPrice = parseFloat(data.price);
            setTokens(prev => {
              const current = prev[id];
              if (!current) return prev;
              const open = parseFloat(data.open_24h) || current.open24h || rawPrice;
              const change = open ? ((rawPrice - open) / open) * 100 : current.change24h;
              const formatted = rawPrice >= 1000 
                ? `$${rawPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : rawPrice >= 1 ? `$${rawPrice.toFixed(2)}` : `$${rawPrice.toFixed(4)}`;
              return {
                ...prev,
                [id]: {
                  ...current,
                  price: rawPrice,
                  open24h: open,
                  change24h: change,
                  formatted
                }
              };
            });
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
    <div className="w-full flex items-center justify-between gap-2 overflow-x-auto scrollbar-none py-1">
      <div className="flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 bg-red-500/10 border border-red-500/20 rounded-lg shrink-0">
        <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'} shrink-0`} />
        <span className="text-[10px] font-mono font-bold tracking-wider text-[var(--red)] uppercase hidden sm:inline">
          {isConnected ? 'CRYPTO STREAM' : 'CONNECTING...'}
        </span>
        <span className="text-[10px] font-mono font-bold tracking-wider text-[var(--red)] uppercase sm:hidden">
          LIVE
        </span>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {(Object.values(tokens) as TickerToken[]).map((token) => (
          <div
            key={token.symbol}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono text-xs transition-all duration-200 shrink-0 ${
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
    <div className="w-full my-3 flex flex-col items-center justify-center">
      {/* BEGIN AADS AD UNIT 2459130 */}
      <div id="frame" className="w-full max-w-[468px] relative mx-auto" style={{ zIndex: 20 }}>
        <div className="rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--surface-solid)] shadow-sm">
          <iframe
            data-aa="2459130"
            src="//acceptable.a-ads.com/2459130/?size=Adaptive"
            style={{ border: 0, padding: 0, width: '100%', height: 'auto', minHeight: '60px', overflow: 'hidden', display: 'block', margin: 'auto' }}
            title="AADS Adaptive Advertisement"
          />
          <div className="w-full relative flex justify-end px-2.5 py-1 bg-[var(--surface-solid)] border-t border-[var(--border)]">
            <a
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                fontSize: '11px',
                color: 'var(--ink-muted)',
                textDecoration: 'none',
                fontFamily: 'monospace',
                fontWeight: '600',
              }}
              id="frame-link"
              href="https://aads.com/campaigns/new/?source_id=2459130&source_type=ad_unit&partner=2459130"
            >
              Advertise here
            </a>
          </div>
        </div>
      </div>
      {/* END AADS AD UNIT 2459130 */}
    </div>
  );
}

/* --- GLOBAL STOCK MARKET TICKER TAPE (WORLD MODE) --- */
interface TapeQuote {
  id: string;
  ticker: string;
  name: string;
  badge: string;
  color: string;
  price: number;
  change24h: number;
  formatted: string;
  url: string;
}

const INITIAL_TAPE_QUOTES: TapeQuote[] = [
  { id: 'SPY', ticker: 'SPY', name: 'S&P 500', badge: '500', color: '#2563eb', price: 759.97, change24h: -0.52, formatted: '$759.97', url: 'https://finance.yahoo.com/quote/SPY' },
  { id: 'QQQ', ticker: 'QQQ', name: 'NASDAQ 100', badge: '100', color: '#0891b2', price: 704.40, change24h: -0.01, formatted: '$704.40', url: 'https://finance.yahoo.com/quote/QQQ' },
  { id: 'DIA', ticker: 'DIA', name: 'Dow Jones', badge: '30', color: '#4f46e5', price: 521.37, change24h: -1.24, formatted: '$521.37', url: 'https://finance.yahoo.com/quote/DIA' },
  { id: 'IWM', ticker: 'IWM', name: 'Russell 2000', badge: '2K', color: '#7c3aed', price: 241.80, change24h: 0.42, formatted: '$241.80', url: 'https://finance.yahoo.com/quote/IWM' },
  { id: 'EWU', ticker: 'EWU', name: 'FTSE 100', badge: 'UK', color: '#0284c7', price: 38.45, change24h: 0.31, formatted: '$38.45', url: 'https://finance.yahoo.com/quote/EWU' },
  { id: 'EWG', ticker: 'EWG', name: 'DAX 40', badge: 'DE', color: '#d97706', price: 35.90, change24h: 0.64, formatted: '$35.90', url: 'https://finance.yahoo.com/quote/EWG' },
  { id: 'FEZ', ticker: 'FEZ', name: 'EURO STOXX 50', badge: 'EU', color: '#1d4ed8', price: 53.20, change24h: 0.48, formatted: '$53.20', url: 'https://finance.yahoo.com/quote/FEZ' },
  { id: 'EWJ', ticker: 'EWJ', name: 'Nikkei 225', badge: 'JP', color: '#dc2626', price: 71.15, change24h: 0.85, formatted: '$71.15', url: 'https://finance.yahoo.com/quote/EWJ' },
  { id: 'OIL_CRUDE', ticker: 'WTI', name: 'Crude Oil', badge: 'OIL', color: '#ea580c', price: 103.27, change24h: 3.82, formatted: '$103.27', url: 'https://finance.yahoo.com/quote/CL=F' },
  { id: 'GOLD', ticker: 'XAU', name: 'Gold Spot', badge: 'AU', color: '#ca8a04', price: 4007.90, change24h: -1.29, formatted: '$4,007.90', url: 'https://finance.yahoo.com/quote/GC=F' },
  { id: 'NVDA', ticker: 'NVDA', name: 'NVIDIA', badge: 'NV', color: '#16a34a', price: 210.96, change24h: -0.59, formatted: '$210.96', url: 'https://finance.yahoo.com/quote/NVDA' },
  { id: 'AAPL', ticker: 'AAPL', name: 'Apple', badge: 'AP', color: '#475569', price: 347.73, change24h: -0.14, formatted: '$347.73', url: 'https://finance.yahoo.com/quote/AAPL' },
  { id: 'MSFT', ticker: 'MSFT', name: 'Microsoft', badge: 'MS', color: '#0284c7', price: 468.50, change24h: 0.74, formatted: '$468.50', url: 'https://finance.yahoo.com/quote/MSFT' },
  { id: 'AMZN', ticker: 'AMZN', name: 'Amazon', badge: 'AZ', color: '#f59e0b', price: 229.40, change24h: 1.12, formatted: '$229.40', url: 'https://finance.yahoo.com/quote/AMZN' },
  { id: 'GOOGL', ticker: 'GOOGL', name: 'Alphabet', badge: 'GO', color: '#dc2626', price: 198.60, change24h: 0.53, formatted: '$198.60', url: 'https://finance.yahoo.com/quote/GOOGL' },
  { id: 'TSLA', ticker: 'TSLA', name: 'Tesla', badge: 'TS', color: '#e11d48', price: 372.22, change24h: -0.63, formatted: '$372.22', url: 'https://finance.yahoo.com/quote/TSLA' },
  { id: 'META', ticker: 'META', name: 'Meta', badge: 'MT', color: '#2563eb', price: 618.30, change24h: 0.91, formatted: '$618.30', url: 'https://finance.yahoo.com/quote/META' }
];

function StockTickerTape({ isDark }: { isDark: boolean }) {
  const [quotes, setQuotes] = useState<TapeQuote[]>(INITIAL_TAPE_QUOTES);

  useEffect(() => {
    let isMounted = true;
    const syncQuotes = async (force = false) => {
      try {
        const bust = force ? `?_t=${Date.now()}&nocache=1` : '';
        const res = await fetch(`/api/market${bust}`, {
          cache: force ? 'no-store' : 'default'
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!data || !isMounted) return;

        setQuotes(prev =>
          prev.map(item => {
            const stockMatch = data.stocks?.[item.id];
            const commMatch = data.commodities?.[item.id];
            const match = stockMatch || commMatch;
            if (!match) return item;
            return {
              ...item,
              price: match.price ?? item.price,
              change24h: match.change24h ?? item.change24h,
              formatted: match.formatted ?? item.formatted
            };
          })
        );
      } catch {}
    };

    syncQuotes();
    const interval = setInterval(() => syncQuotes(false), 30000);
    const handleRefresh = () => syncQuotes(true);
    window.addEventListener('refresh-market-data', handleRefresh);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('refresh-market-data', handleRefresh);
    };
  }, []);

  const renderStrip = (copyKey: string) => (
    <div key={copyKey} className="flex items-center shrink-0">
      {quotes.map((q) => {
        const isUp = q.change24h >= 0;
        return (
          <a
            key={`${copyKey}-${q.id}`}
            href={q.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2.5 px-5 h-[48px] border-r transition-colors whitespace-nowrap select-none ${
              isDark
                ? 'border-white/10 hover:bg-white/5 text-slate-100'
                : 'border-slate-200 hover:bg-slate-100 text-slate-900'
            }`}
          >
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-mono font-bold text-white shrink-0 shadow-sm"
              style={{ backgroundColor: q.color }}
            >
              {q.badge}
            </span>
            <span className="font-sans font-bold text-xs tracking-tight">
              {q.name}
            </span>
            <span className={`font-mono text-[11px] font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              {q.formatted}
            </span>
            <span
              className={`font-mono text-[11px] font-bold flex items-center gap-0.5 ${
                isUp ? 'text-emerald-400' : 'text-rose-500'
              }`}
            >
              <span>{isUp ? '▲' : '▼'}</span>
              <span>{isUp ? '+' : ''}{q.change24h.toFixed(2)}%</span>
            </span>
          </a>
        );
      })}
    </div>
  );

  return (
    <div
      className="w-full h-[48px] overflow-hidden flex items-center relative"
      style={{ minHeight: '48px', height: '48px' }}
    >
      <div className="stock-marquee-track">
        {renderStrip('copy-a')}
        {renderStrip('copy-b')}
      </div>
    </div>
  );
}


/* --- COMMODITIES & STOCKS LIVE SPOT TICKER (WORLD MODE) --- */
interface CommodityItem {
  symbol: string;
  name: string;
  price: number;
  open24h: number;
  change24h: number;
  unit: string;
  formatted: string;
  flash: 'up' | 'down' | null;
}

const DEFAULT_COMMODITIES: Record<string, CommodityItem> = {
  'OIL_CRUDE': {
    symbol: 'CRUDE OIL',
    name: 'WTI Crude Oil',
    price: 103.27,
    open24h: 99.47,
    change24h: 3.82,
    unit: '',
    formatted: '$103.27',
    flash: null,
  },
  'OIL_BRENT': {
    symbol: 'BRENT',
    name: 'Brent Crude Oil',
    price: 111.70,
    open24h: 108.66,
    change24h: 2.80,
    unit: '',
    formatted: '$111.70',
    flash: null,
  },
  'GOLD': {
    symbol: 'GOLD',
    name: 'Gold Spot',
    price: 4007.90,
    open24h: 4060.40,
    change24h: -1.29,
    unit: '',
    formatted: '$4,007.90',
    flash: null,
  },
  'SILVER': {
    symbol: 'SILVER',
    name: 'Silver Spot',
    price: 53.95,
    open24h: 55.01,
    change24h: -1.92,
    unit: '',
    formatted: '$53.95',
    flash: null,
  },
  'NAT_GAS': {
    symbol: 'NAT GAS',
    name: 'Henry Hub Natural Gas',
    price: 3.05,
    open24h: 3.16,
    change24h: -3.36,
    unit: '',
    formatted: '$3.05',
    flash: null,
  },
  'COPPER': {
    symbol: 'COPPER',
    name: 'COMEX Copper',
    price: 6.51,
    open24h: 6.40,
    change24h: 1.72,
    unit: '',
    formatted: '$6.51',
    flash: null,
  },
};

const DEFAULT_STOCKS: Record<string, CommodityItem> = {
  'SPY': {
    symbol: 'S&P 500',
    name: 'SPDR S&P 500',
    price: 759.97,
    open24h: 763.96,
    change24h: -0.52,
    unit: '',
    formatted: '$759.97',
    flash: null,
  },
  'QQQ': {
    symbol: 'NASDAQ 100',
    name: 'Invesco QQQ',
    price: 704.40,
    open24h: 704.47,
    change24h: -0.01,
    unit: '',
    formatted: '$704.40',
    flash: null,
  },
  'DIA': {
    symbol: 'DOW JONES',
    name: 'SPDR Dow Jones',
    price: 521.37,
    open24h: 527.89,
    change24h: -1.24,
    unit: '',
    formatted: '$521.37',
    flash: null,
  },
  'NVDA': {
    symbol: 'NVIDIA',
    name: 'NVIDIA Corp',
    price: 210.96,
    open24h: 212.21,
    change24h: -0.59,
    unit: '',
    formatted: '$210.96',
    flash: null,
  },
  'AAPL': {
    symbol: 'APPLE',
    name: 'Apple Inc',
    price: 347.73,
    open24h: 348.22,
    change24h: -0.14,
    unit: '',
    formatted: '$347.73',
    flash: null,
  },
  'TSLA': {
    symbol: 'TESLA',
    name: 'Tesla Inc',
    price: 372.22,
    open24h: 374.58,
    change24h: -0.63,
    unit: '',
    formatted: '$372.22',
    flash: null,
  },
};

function CommoditiesTicker() {
  const [tickerView, setTickerView] = useState<'commodities' | 'stocks'>('commodities');
  const [commodities, setCommodities] = useState<Record<string, CommodityItem>>(DEFAULT_COMMODITIES);
  const [stocks, setStocks] = useState<Record<string, CommodityItem>>(DEFAULT_STOCKS);

  // Sync real-time commodities and stock quotes from /api/market
  useEffect(() => {
    let isMounted = true;
    const fetchMarket = async (force = false) => {
      try {
        const bust = force ? `?_t=${Date.now()}&nocache=1` : '';
        const res = await fetch(`/api/market${bust}`, {
          cache: force ? 'no-store' : 'default'
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data && isMounted) {
          if (data.commodities) {
            setCommodities(prev => {
              const updated = { ...prev };
              for (const [k, v] of Object.entries(data.commodities as Record<string, any>)) {
                if (updated[k]) {
                  updated[k] = {
                    ...updated[k],
                    price: v.price,
                    change24h: v.change24h,
                    formatted: v.formatted
                  };
                }
              }
              return updated;
            });
          }
          if (data.stocks) {
            setStocks(prev => {
              const updated = { ...prev };
              for (const [k, v] of Object.entries(data.stocks as Record<string, any>)) {
                if (updated[k]) {
                  updated[k] = {
                    ...updated[k],
                    price: v.price,
                    change24h: v.change24h,
                    formatted: v.formatted
                  };
                }
              }
              return updated;
            });
          }
        }
      } catch {}
    };

    fetchMarket();
    const pollInterval = setInterval(fetchMarket, 30000);
    const handleRefresh = () => fetchMarket(true);
    window.addEventListener('refresh-market-data', handleRefresh);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      window.removeEventListener('refresh-market-data', handleRefresh);
    };
  }, []);

  // Micro-tick simulation loop: continuous real-time market movements with green/red flashes
  useEffect(() => {
    const cKeys = Object.keys(DEFAULT_COMMODITIES);
    const sKeys = Object.keys(DEFAULT_STOCKS);

    const interval = setInterval(() => {
      // Tick Commodities
      const targetC = cKeys[Math.floor(Math.random() * cKeys.length)];
      setCommodities(prev => {
        const item = prev[targetC];
        if (!item) return prev;
        const deltaPct = (Math.random() - 0.48) * 0.0015;
        const newPrice = Math.max(0.01, item.price * (1 + deltaPct));
        const flash: 'up' | 'down' = newPrice >= item.price ? 'up' : 'down';
        const newChange = item.change24h + (deltaPct * 100);

        let formatted = '';
        if (item.symbol === 'GOLD') {
          formatted = `$${newPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        } else if (item.symbol === 'NAT GAS' || item.symbol === 'COPPER') {
          formatted = `$${newPrice.toFixed(3)}`;
        } else {
          formatted = `$${newPrice.toFixed(2)}`;
        }

        return {
          ...prev,
          [targetC]: { ...item, price: newPrice, change24h: newChange, formatted, flash }
        };
      });

      // Tick Stocks
      const targetS = sKeys[Math.floor(Math.random() * sKeys.length)];
      setStocks(prev => {
        const item = prev[targetS];
        if (!item) return prev;
        const deltaPct = (Math.random() - 0.48) * 0.0012;
        const newPrice = Math.max(0.01, item.price * (1 + deltaPct));
        const flash: 'up' | 'down' = newPrice >= item.price ? 'up' : 'down';
        const newChange = item.change24h + (deltaPct * 100);
        const formatted = `$${newPrice.toFixed(2)}`;

        return {
          ...prev,
          [targetS]: { ...item, price: newPrice, change24h: newChange, formatted, flash }
        };
      });

      setTimeout(() => {
        setCommodities(prev => {
          if (!prev[targetC] || prev[targetC].flash === null) return prev;
          return { ...prev, [targetC]: { ...prev[targetC], flash: null } };
        });
        setStocks(prev => {
          if (!prev[targetS] || prev[targetS].flash === null) return prev;
          return { ...prev, [targetS]: { ...prev[targetS], flash: null } };
        });
      }, 450);
    }, 2400);

    return () => clearInterval(interval);
  }, []);

  const activeItems = tickerView === 'commodities' 
    ? (Object.values(commodities) as CommodityItem[])
    : (Object.values(stocks) as CommodityItem[]);

  return (
    <div className="w-full flex items-center justify-between gap-2 overflow-x-auto scrollbar-none py-1">
      {/* Switcher Badge: Toggle Between Commodities and Stocks */}
      <div className="flex items-center gap-1 bg-black/20 p-0.5 rounded-lg border border-[var(--border)] shrink-0 font-mono text-[10px]">
        <button
          onClick={() => setTickerView('commodities')}
          className={`px-2 py-0.5 rounded font-bold transition-all flex items-center gap-1.5 ${
            tickerView === 'commodities'
              ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40 shadow-sm'
              : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
          }`}
          title="Show Live Commodities & Energy"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${tickerView === 'commodities' ? 'bg-amber-500 animate-ping' : 'bg-gray-400'} shrink-0`} />
          COMMODITIES
        </button>
        <button
          onClick={() => setTickerView('stocks')}
          className={`px-2 py-0.5 rounded font-bold transition-all flex items-center gap-1.5 ${
            tickerView === 'stocks'
              ? 'bg-blue-500/20 text-blue-500 border border-blue-500/40 shadow-sm'
              : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
          }`}
          title="Show Live Stocks & Indices"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${tickerView === 'stocks' ? 'bg-blue-500 animate-ping' : 'bg-gray-400'} shrink-0`} />
          STOCKS
        </button>
      </div>

      {/* Stream of Live Assets with Flash Indicators */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {activeItems.map((item) => (
          <div
            key={item.symbol}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono text-xs transition-all duration-200 shrink-0 ${
              item.flash === 'up'
                ? 'bg-emerald-500/25 border-emerald-500/60 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)] scale-[1.02]'
                : item.flash === 'down'
                ? 'bg-rose-500/25 border-rose-500/60 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.4)] scale-[1.02]'
                : 'bg-[var(--surface-solid)] border-[var(--border)] text-[var(--ink)] hover:border-[var(--accent)] shadow-sm'
            }`}
          >
            <span className="font-bold text-[var(--ink-muted)] text-[11px]">{item.symbol}</span>
            <span className="font-semibold text-[var(--ink)] tracking-tight">{item.formatted}</span>
            <span className={`text-[10px] font-bold flex items-center gap-0.5 ${
              item.change24h >= 0 ? 'text-emerald-500 dark:text-green-400' : 'text-rose-500 dark:text-red-400'
            }`}>
              {item.change24h >= 0 ? '▲' : '▼'}{Math.abs(item.change24h).toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* --- DOOMSDAY CLOCK MODAL (WORLD MODE SENTIMENT) --- */
interface DoomsdayModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

function DoomsdayModal({ isOpen, onClose, isDark }: DoomsdayModalProps) {
  if (!isOpen) return null;

  const threats = [
    {
      category: 'NUCLEAR ARSENALS',
      level: 'CRITICAL',
      color: '#ef4444',
      desc: 'War in Ukraine, erosion of bilateral arms control treaties (New START), North Korean ballistic tests, and modernization of atomic arsenals.'
    },
    {
      category: 'CLIMATE DISRUPTION',
      level: 'SEVERE',
      color: '#f97316',
      desc: 'Record-shattering surface & ocean temperatures, extreme weather disruptions, and lagging global emission reduction targets.'
    },
    {
      category: 'AI & AUTONOMOUS WEAPONS',
      level: 'HIGH',
      color: '#eab308',
      desc: 'Militarized AI decision systems, deepfake-driven cognitive warfare, and synthetic biology design automation without oversight.'
    },
    {
      category: 'BIOSECURITY RISKS',
      level: 'ELEVATED',
      color: '#a855f7',
      desc: 'High-containment pathogen research, gain-of-function experiments, and rapid synthesis of engineered biological agents.'
    }
  ];

  const timeline = [
    { year: '1947', setting: '7 MIN', desc: 'Clock created at 7 minutes to midnight by Manhattan Project scientists.' },
    { year: '1953', setting: '2 MIN', desc: 'US and USSR test thermonuclear H-bombs.' },
    { year: '1991', setting: '17 MIN', desc: 'Cold War ends; START I treaty signed (humanity’s safest benchmark).' },
    { year: '2020', setting: '100 SEC', desc: 'First time set within the two-minute threshold.' },
    { year: 'PRESENT', setting: '90 SEC', desc: 'Closest to global catastrophe in human history.' },
  ];

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-[var(--surface-solid)] border border-red-500/30 rounded-2xl p-5 sm:p-7 shadow-2xl z-10 text-[var(--ink)] scrollbar-none"
      >
        <button 
          className="absolute top-4 right-4 text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors p-1"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-500 font-mono text-[11px] font-bold tracking-widest uppercase mb-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            GLOBAL EXISTENTIAL RISK MONITOR
          </div>
          <h2 className="font-display text-3xl sm:text-4xl text-[var(--ink)] mb-1">THE DOOMSDAY CLOCK</h2>
          <div className="font-mono text-xs text-[var(--ink-muted)] tracking-wider uppercase mb-5">
            BULLETIN OF THE ATOMIC SCIENTISTS
          </div>

          {/* Clock Visual Representation */}
          <div className="relative inline-flex items-center justify-center my-2">
            <svg width="220" height="220" viewBox="0 0 240 240" className="overflow-visible">
              <defs>
                <radialGradient id="dangerGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="metalRim" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={isDark ? "#334155" : "#cbd5e1"} />
                  <stop offset="100%" stopColor={isDark ? "#0f172a" : "#64748b"} />
                </linearGradient>
              </defs>

              {/* Glowing Aura */}
              <circle cx="120" cy="120" r="115" fill="url(#dangerGlow)" />

              {/* Outer Bezel */}
              <circle cx="120" cy="120" r="105" fill={isDark ? "#0a0c10" : "#ffffff"} stroke="url(#metalRim)" strokeWidth="8" />
              <circle cx="120" cy="120" r="97" fill="none" stroke={isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"} strokeWidth="1.5" />

              {/* 11:00 to 12:00 General Warning Sector */}
              <path
                d="M 120 120 L 71.5 36 A 97 97 0 0 1 120 23 Z"
                fill="rgba(239, 68, 68, 0.12)"
              />
              {/* Critical 90 Seconds to Midnight Danger Wedge (11:58:30 to 12:00:00) */}
              <path
                d="M 120 120 L 104.83 24.19 A 97 97 0 0 1 120 23 Z"
                fill="#ef4444"
                className="animate-pulse"
              />

              {/* Hour & Minute Tick Marks */}
              {[...Array(12)].map((_, i) => {
                const angle = (i * 30) * (Math.PI / 180);
                const x1 = 120 + 84 * Math.sin(angle);
                const y1 = 120 - 84 * Math.cos(angle);
                const x2 = 120 + 94 * Math.sin(angle);
                const y2 = 120 - 94 * Math.cos(angle);
                const isCrit = i === 11 || i === 0;
                return (
                  <line 
                    key={i} 
                    x1={x1} 
                    y1={y1} 
                    x2={x2} 
                    y2={y2} 
                    stroke={isCrit ? "#ef4444" : isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"} 
                    strokeWidth={isCrit ? "3" : "1.5"} 
                  />
                );
              })}

              {/* Roman Numerals */}
              <text x="120" y="48" fill="#ef4444" fontSize="13" fontFamily="sans-serif" fontWeight="900" textAnchor="middle">XII</text>
              <text x="70" y="58" fill={isDark ? "#94a3b8" : "#475569"} fontSize="11" fontFamily="sans-serif" fontWeight="700" textAnchor="middle">XI</text>
              <text x="48" y="125" fill={isDark ? "#64748b" : "#94a3b8"} fontSize="10" fontFamily="sans-serif" fontWeight="600" textAnchor="middle">IX</text>
              <text x="192" y="125" fill={isDark ? "#64748b" : "#94a3b8"} fontSize="10" fontFamily="sans-serif" fontWeight="600" textAnchor="middle">III</text>

              {/* Hour Hand (Pointing towards 12, at ~11:58) */}
              <line x1="120" y1="120" x2="119.35" y2="70" stroke={isDark ? "#ffffff" : "#0f172a"} strokeWidth="5" strokeLinecap="round" />

              {/* Minute Hand (Pointing at 11:58:30 = 9 degrees before midnight) */}
              <line x1="120" y1="120" x2="108.27" y2="45.9" stroke="#ef4444" strokeWidth="3.5" strokeLinecap="round" />

              {/* Second Hand with Counterweight */}
              <line x1="120" y1="135" x2="106" y2="30" stroke="#f87171" strokeWidth="1.5" />
              <circle cx="106" cy="30" r="2.5" fill="#ef4444" />

              {/* Center Hub */}
              <circle cx="120" cy="120" r="7" fill={isDark ? "#ffffff" : "#0f172a"} />
              <circle cx="120" cy="120" r="3.5" fill="#ef4444" />
            </svg>
          </div>

          {/* Primary Readout */}
          <div className="flex flex-col items-center mt-2 mb-5">
            <div className="flex items-baseline gap-2 font-mono">
              <span className="text-5xl sm:text-6xl font-black text-red-500 tracking-tight drop-shadow-[0_0_20px_rgba(239,68,68,0.4)]">
                90 SECONDS
              </span>
            </div>
            <span className="text-xs sm:text-sm font-mono font-bold tracking-widest text-[var(--ink-muted)] uppercase mt-0.5">
              TO MIDNIGHT
            </span>

            <div className="mt-3 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-500 font-mono text-xs font-bold uppercase tracking-wider">
              STATUS: HISTORIC MAXIMUM PERIL
            </div>
          </div>

          {/* Core Threat Factors Grid */}
          <div className="text-left mb-6">
            <div className="text-[11px] font-mono font-bold uppercase text-[var(--ink-muted)] tracking-wider mb-2.5">
              PRIMARY THREAT DRIVERS (BULLETIN MATRIX)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {threats.map((t) => (
                <div key={t.category} className="p-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs font-bold text-[var(--ink)]">{t.category}</span>
                    <span 
                      className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border"
                      style={{ color: t.color, borderColor: `${t.color}40`, backgroundColor: `${t.color}15` }}
                    >
                      {t.level}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--ink-muted)] leading-relaxed">
                    {t.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Historical Timeline */}
          <div className="text-left mb-6">
            <div className="text-[11px] font-mono font-bold uppercase text-[var(--ink-muted)] tracking-wider mb-2.5">
              HISTORICAL BENCHMARKS
            </div>
            <div className="space-y-1.5 font-mono text-xs bg-[var(--bg)] p-3.5 rounded-xl border border-[var(--border)]">
              {timeline.map((item, idx) => (
                <div key={idx} className="flex items-start justify-between py-1 border-b border-[var(--border)] last:border-none">
                  <span className="font-bold text-[var(--ink)] shrink-0 w-20">{item.year}:</span>
                  <span className={`font-bold shrink-0 w-24 text-right mr-3 ${item.year === 'PRESENT' ? 'text-red-500' : 'text-[var(--accent)]'}`}>
                    {item.setting}
                  </span>
                  <span className="text-[11px] text-[var(--ink-muted)] text-left flex-1 font-sans">
                    {item.desc}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer & Source Link */}
          <div className="flex justify-between items-center text-[10px] font-mono text-[var(--ink-muted)] border-t border-[var(--border)] pt-3">
            <div>Setting: 90s (Science and Security Board)</div>
            <a 
              href="https://thebulletin.org/doomsday-clock/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-red-500 hover:underline flex items-center gap-1 font-semibold"
            >
              TheBulletin.org <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* --- MULTI-SOURCE CLUSTERING & TIME HELPERS --- */
const STOP_WORDS = new Set([
  'that', 'with', 'from', 'this', 'have', 'will', 'after', 'over', 'more', 'into',
  'says', 'amid', 'what', 'when', 'where', 'news', 'report', 'update', 'live', 'today',
  'year', 'week', 'month', 'time', 'first', 'new', 'could', 'would', 'should', 'about',
  'their', 'there', 'they', 'been', 'were', 'which', 'while', 'under', 'between', 'before',
  'market', 'markets', 'world', 'global', 'crypto', 'price', 'prices', 'watch', 'breaking',
  'analysis', 'heres', 'why', 'how', 'most', 'some', 'other', 'than', 'then', 'only', 'also'
]);

function getPublisherRoot(src: string): string {
  const s = (src || '').toLowerCase();
  if (s.startsWith('cointelegraph')) return 'cointelegraph';
  if (s.startsWith('bbc')) return 'bbc';
  if (s.startsWith('npr')) return 'npr';
  if (s.startsWith('upi')) return 'upi';
  if (s.startsWith('cna')) return 'cna';
  if (s.startsWith('reuters')) return 'reuters';
  if (s.includes('associated press') || s.startsWith('ap ')) return 'ap';
  return s;
}

function cleanWireTitle(rawTitle: string): string {
  return rawTitle
    .replace(/\s+-\s+(Reuters|Associated Press|AP News|PBS|PBS NewsHour|NHK WORLD-JAPAN|NHK World|BBC News|Al Jazeera|The Guardian|DW|France 24|NPR|UPI\.com|CBC\.ca|ABC News)$/i, '')
    .replace(/^NEWSLETTER:\s*/i, '')
    .trim();
}

function cleanWireSnippet(rawSnippet: string, cleanedTitle: string): string {
  const decoded = rawSnippet
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();

  if (!decoded) return '';
  const normSnippet = decoded.toLowerCase().replace(/[^a-z0-9]/g, '');
  const normTitle = cleanedTitle.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (normTitle && normSnippet.startsWith(normTitle.slice(0, Math.min(35, normTitle.length)))) {
    return '';
  }
  return decoded.slice(0, 150).trim();
}

function extractHeadlineKeywords(title: string): string[] {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 4 && !STOP_WORDS.has(w));
}

function computeArticleClusters(articles: Article[]): Map<string, Article[]> {
  const map = new Map<string, Article[]>();
  const tokenized = articles.map(a => ({
    article: a,
    pubRoot: getPublisherRoot(a.src),
    tokens: new Set(extractHeadlineKeywords(a.title)),
    time: a.date.getTime()
  }));

  for (let i = 0; i < tokenized.length; i++) {
    const itemA = tokenized[i];
    if (itemA.tokens.size < 2) continue;
    const related: Article[] = [];
    const seenPublishers = new Set<string>([itemA.pubRoot]);

    for (let j = 0; j < tokenized.length; j++) {
      if (i === j) continue;
      const itemB = tokenized[j];
      if (seenPublishers.has(itemB.pubRoot)) continue;
      if (Math.abs(itemA.time - itemB.time) > 48 * 3600 * 1000) continue;

      let shared = 0;
      for (const tok of itemA.tokens) {
        if (itemB.tokens.has(tok)) shared++;
      }

      if (shared >= 2) {
        seenPublishers.add(itemB.pubRoot);
        related.push(itemB.article);
        if (related.length >= 4) break;
      }
    }

    if (related.length > 0) {
      map.set(itemA.article.id, related);
    }
  }

  return map;
}

function formatTimeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0 || isNaN(diffMs)) return 'Just now';
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/* --- LIVE ECONOMIC & CRYPTO CATALYST CALENDAR MODAL --- */
interface CatalystEvent {
  id: string;
  title: string;
  category: 'macro' | 'crypto' | 'earnings' | 'geopolitics';
  categoryLabel: string;
  date: Date;
  impact: 'HIGH' | 'MEDIUM';
  impactNote: string;
  consensus?: string;
}

function getUpcomingCatalysts(): CatalystEvent[] {
  const now = new Date();
  const d = (daysAhead: number, hourUtc = 13, minUtc = 30) => {
    const target = new Date(now.getTime() + daysAhead * 86400 * 1000);
    target.setUTCHours(hourUtc, minUtc, 0, 0);
    return target;
  };

  return [
    {
      id: 'cat-cpi',
      title: 'U.S. CPI Inflation Report (YoY & Core MoM)',
      category: 'macro',
      categoryLabel: 'MACRO / FED',
      date: d(2, 13, 30),
      impact: 'HIGH',
      impactNote: 'Primary inflation gauge driving Federal Reserve rate cut expectations, USD strength, and risk-asset volatility across stocks & Bitcoin.',
      consensus: 'Core CPI Est: 0.2% MoM'
    },
    {
      id: 'cat-etf-flows',
      title: 'SEC Digital Asset ETF Options & Institutional Flow Settlement',
      category: 'crypto',
      categoryLabel: 'CRYPTO & ETF',
      date: d(3, 20, 0),
      impact: 'HIGH',
      impactNote: 'Weekly institutional Spot BTC & ETH ETF net flow rebalancing and SEC regulatory filing review window.',
      consensus: 'Institutional Desk Rebalance'
    },
    {
      id: 'cat-jobless',
      title: 'U.S. Initial Jobless Claims & Labor Market Pulse',
      category: 'macro',
      categoryLabel: 'MACRO / FED',
      date: d(4, 13, 30),
      impact: 'MEDIUM',
      impactNote: 'High-frequency indicator of U.S. labor market cooling or resilience ahead of the next FOMC decision.',
      consensus: 'Est: 218K Claims'
    },
    {
      id: 'cat-unlocks',
      title: 'Major Layer-1 & DeFi Ecosystem Token Unlocks ($340M+)',
      category: 'crypto',
      categoryLabel: 'CRYPTO & ETF',
      date: d(5, 12, 0),
      impact: 'MEDIUM',
      impactNote: 'Scheduled cliff and linear vesting unlocks across major altcoin protocols; closely watched for spot liquidity absorption.',
      consensus: '$340M+ Combined Cliff'
    },
    {
      id: 'cat-fomc',
      title: 'Federal Reserve FOMC Minutes & Chair Powell Policy Remarks',
      category: 'macro',
      categoryLabel: 'MACRO / FED',
      date: d(7, 19, 0),
      impact: 'HIGH',
      impactNote: 'Detailed breakdown of Federal Open Market Committee rate trajectory, balance sheet QT pace, and liquidity outlook.',
      consensus: 'Hawkish / Neutral Watch'
    },
    {
      id: 'cat-nvda-ai',
      title: 'Big Tech & AI Semiconductor Earnings / Guidance Window',
      category: 'earnings',
      categoryLabel: 'TECH & EARNINGS',
      date: d(9, 21, 0),
      impact: 'HIGH',
      impactNote: 'Hyperscaler AI capex and data-center GPU demand guidance — key driver for NASDAQ 100, S&P 500, and AI-crypto tokens.',
      consensus: 'Post-Market Bell (4:00 PM EST)'
    },
    {
      id: 'cat-eth-upgrade',
      title: 'Ethereum Core Dev Call & Pectra / L2 Scaling Milestone',
      category: 'crypto',
      categoryLabel: 'CRYPTO & ETF',
      date: d(11, 14, 0),
      impact: 'MEDIUM',
      impactNote: 'Execution & consensus layer client specification freeze for blob throughput expansion and L2 fee reduction.',
      consensus: 'AllCoreDevs Execution'
    },
    {
      id: 'cat-g7-energy',
      title: 'G7 & OPEC+ Global Energy, Trade & Geopolitical Ministerial',
      category: 'geopolitics',
      categoryLabel: 'GEOPOLITICS',
      date: d(14, 10, 0),
      impact: 'HIGH',
      impactNote: 'Crude oil production quotas, global shipping corridor security, and strategic mineral supply chain policy.',
      consensus: 'Vienna / Brussels Wire'
    }
  ];
}

function formatCountdown(targetDate: Date, nowMs = Date.now()): string {
  const diff = targetDate.getTime() - nowMs;
  if (diff <= 0) return 'LIVE NOW';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (days === 0) return `IN ${hours}h ${mins}m`;
  return `IN ${days}d ${hours}h`;
}

function CatalystCalendarModal({ isOpen, onClose, activeMode }: { isOpen: boolean; onClose: () => void; activeMode: AppMode }) {
  const [catFilter, setCatFilter] = useState<'all' | 'macro' | 'crypto' | 'earnings' | 'geopolitics'>('all');
  const [nowMs, setNowMs] = useState(() => Date.now());
  const events = useMemo(() => getUpcomingCatalysts(), []);

  useEffect(() => {
    if (!isOpen) return;
    setNowMs(Date.now());
    const timer = setInterval(() => setNowMs(Date.now()), 30000);
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredEvents = events.filter(e => catFilter === 'all' || e.category === catFilter);

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-3 sm:p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        className="relative w-full max-w-2xl bg-[var(--surface-solid)] border border-[var(--border)] rounded-2xl p-5 sm:p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto text-[var(--ink)]"
      >
        <button
          className="absolute top-4 right-4 text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors p-1"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <Calendar className={`w-4 h-4 ${activeMode === 'world' ? 'text-blue-400' : 'text-[var(--accent)]'}`} />
          <span className="font-mono text-[11px] font-bold tracking-widest uppercase text-[var(--ink-muted)]">
            MARKET VOLATILITY RADAR // UPCOMING CATALYSTS
          </span>
        </div>
        <h2 className="font-display text-3xl sm:text-4xl text-[var(--ink)] tracking-wide mb-4">
          ECONOMIC & CRYPTO CATALYST CALENDAR
        </h2>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 mb-4 border-b border-[var(--border)]">
          {[
            { id: 'all', label: 'ALL CATALYSTS' },
            { id: 'macro', label: '🏛️ MACRO & FED' },
            { id: 'crypto', label: '⚡ CRYPTO & ETFs' },
            { id: 'earnings', label: '🔬 TECH & AI' },
            { id: 'geopolitics', label: '🌐 GEOPOLITICS' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setCatFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg font-mono text-[11px] font-bold shrink-0 border transition-all ${
                catFilter === tab.id
                  ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-sm'
                  : 'bg-[var(--bg)] text-[var(--ink-muted)] border-[var(--border)] hover:text-[var(--ink)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Events List */}
        <div className="space-y-3">
          {filteredEvents.map(ev => (
            <div
              key={ev.id}
              className="p-3.5 sm:p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)] hover:border-[var(--accent)]/50 transition-all"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                    ev.impact === 'HIGH'
                      ? 'bg-red-500/15 text-red-500 dark:text-red-400 border-red-500/30'
                      : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                  }`}>
                    {ev.impact === 'HIGH' ? '🔴 HIGH IMPACT' : '🟡 MED IMPACT'}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-black/5 dark:bg-white/5 border border-[var(--border)] text-[var(--ink-muted)]">
                    {ev.categoryLabel}
                  </span>
                  {ev.consensus && (
                    <span className="text-[10px] font-mono text-[var(--ink-muted)]">
                      • {ev.consensus}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="text-[var(--ink-muted)]">
                    {ev.date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} • {ev.date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold text-[10px]">
                    {formatCountdown(ev.date, nowMs)}
                  </span>
                </div>
              </div>

              <h3 className="font-sans font-bold text-sm sm:text-base text-[var(--ink)] mb-1">
                {ev.title}
              </h3>
              <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
                {ev.impactNote}
              </p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-[var(--ink-muted)] border-t border-[var(--border)] pt-3 mt-5">
          <span>SCHEDULED MACRO & ON-CHAIN DESK</span>
          <span className="text-emerald-500 dark:text-emerald-400 font-bold">● REAL-TIME COUNTDOWN SYNC</span>
        </div>
      </motion.div>
    </div>
  );
}

function loadCachedArticlesForMode(targetMode: AppMode): Article[] {
  try {
    const cacheKey = targetMode === 'world' ? 'hattys_news_world_cache_v3' : 'hattys_news_crypto_cache_v3';
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((a: any, idx: number) => {
          const title = cleanWireTitle(a.title || '');
          const snippet = cleanWireSnippet(a.snippet || '', title);
          const normId = title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 36) || String(idx);
          return {
            ...a,
            title,
            snippet,
            id: `${targetMode}-${a.src || 'wire'}-${normId}`,
            img: (a.img && !a.img.startsWith('data:image/svg+xml;utf8')) ? a.img : getEditorialPhoto(a.primaryCat, title, targetMode),
            date: new Date(a.date)
          };
        });
      }
    }
  } catch {}
  return [];
}

export default function App() {
  const [mode, setMode] = useState<AppMode>('crypto');
  const [articles, setArticles] = useState<Article[]>(() => loadCachedArticlesForMode('crypto'));
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState<boolean>(() => loadCachedArticlesForMode('crypto').length === 0);
  const [isDark, setIsDark] = useState(true);
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    try {
      if (sessionStorage.getItem('hattys_splash_seen') === '1') {
        return false;
      }
      sessionStorage.setItem('hattys_splash_seen', '1');
      return true;
    } catch {
      return true;
    }
  });
  const [showMenu, setShowMenu] = useState(false);
  const [fearGreed, setFearGreed] = useState<FearGreedData | null>(null);
  const [showFearGreed, setShowFearGreed] = useState(false);
  const [showDoomsday, setShowDoomsday] = useState(false);
  const [showCatalysts, setShowCatalysts] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [splashProgress, setSplashProgress] = useState(0);
  const fetchSeqRef = useRef(0);

  // 60-Second Morning Brief state (expanded by default, persisted)
  const [showBrief, setShowBrief] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hattys_brief_collapsed') !== '1';
    } catch {
      return true;
    }
  });

  const toggleBrief = () => {
    setShowBrief(prev => {
      const next = !prev;
      try {
        localStorage.setItem('hattys_brief_collapsed', next ? '0' : '1');
      } catch {}
      return next;
    });
  };

  // Saved / Read-Later Queue (persisted in localStorage)
  const [savedArticles, setSavedArticles] = useState<Article[]>(() => {
    try {
      const raw = localStorage.getItem('hattys_saved_articles_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.map((a: any) => ({ ...a, date: new Date(a.date) }));
        }
      }
    } catch {}
    return [];
  });

  const savedIds = useMemo(() => new Set(savedArticles.map(a => a.id)), [savedArticles]);

  const toggleSaveArticle = useCallback((article: Article) => {
    setSavedArticles(prev => {
      const exists = prev.some(item => item.id === article.id);
      const updated = exists ? prev.filter(item => item.id !== article.id) : [article, ...prev];
      try {
        localStorage.setItem('hattys_saved_articles_v1', JSON.stringify(updated.slice(0, 100)));
      } catch {}
      return updated;
    });
  }, []);

  // Track Last Visit Timestamp per Mode for "NEW" Story Badges
  const [lastVisitTime, setLastVisitTime] = useState<number>(() => Date.now() - 3 * 3600 * 1000);

  useEffect(() => {
    try {
      const visitKey = `hattys_last_visit_${mode}`;
      const prev = localStorage.getItem(visitKey);
      const now = Date.now();
      if (prev) {
        const parsed = parseInt(prev, 10);
        // If last visit was < 5 mins ago (same session), use 2 hours ago so NEW badges remain meaningful
        const threshold = now - parsed < 5 * 60 * 1000 ? now - 2 * 3600 * 1000 : parsed;
        setLastVisitTime(threshold);
      } else {
        setLastVisitTime(now - 3 * 3600 * 1000);
      }
      localStorage.setItem(visitKey, String(now));
    } catch {}
  }, [mode]);

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
      document.body.classList.add('pwa-installed');
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
      document.body.classList.add('pwa-installed');
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

  // Load cached articles on mode switch for instant zero-lag rendering
  useEffect(() => {
    const restored = loadCachedArticlesForMode(mode);
    if (restored.length > 0) {
      setArticles(restored);
      setLoading(false);
    }
  }, [mode]);

  // Animate splash screen loading bar (snappy & streamlined)
  useEffect(() => {
    if (!showSplash) return;
    const interval = setInterval(() => {
      setSplashProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 45);

    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1050);

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
  const fetchFeed = async (feed: FeedConfig, targetMode: AppMode, forceRefresh = false): Promise<Article[]> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);

    try {
      const cacheBust = forceRefresh ? `&_t=${Date.now()}&nocache=1` : '';
      const response = await fetch(`/api/news?url=${encodeURIComponent(feed.u)}${cacheBust}`, {
        signal: controller.signal,
        cache: forceRefresh ? 'no-store' : 'default'
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

        const rawTitle = i.title ? i.title.trim() : (targetMode === 'world' ? 'World Wire Update' : 'Crypto Market Update');
        const title = cleanWireTitle(rawTitle);
        const snippet = cleanWireSnippet(i.contentSnippet || i.description || '', title);

        const { primary, matched } = classifyArticle(title, snippet, feed.defaultCat, targetMode);

        if (!img) {
          img = getEditorialPhoto(primary, title, targetMode);
        }

        const normId = title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 36) || String(idx);

        return {
          id: `${targetMode}-${feed.n}-${normId}`,
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

  // State for manual refresh notifications
  const [refreshToast, setRefreshToast] = useState<{ message: string; active: boolean } | null>(null);

  // Aggregator with progressive merging, race-condition guard, and deduplication
  const loadNews = useCallback(async (force = false) => {
    const reqId = ++fetchSeqRef.current;
    const targetMode = mode;
    setLoading(true);
    const activeFeeds = targetMode === 'world' ? WORLD_FEEDS : CRYPTO_FEEDS;
    
    try {
      const results = await Promise.allSettled(activeFeeds.map(f => fetchFeed(f, targetMode, force)));
      if (reqId !== fetchSeqRef.current) return;

      const rawArticles = results
        .filter((r): r is PromiseFulfilledResult<Article[]> => r.status === 'fulfilled')
        .flatMap(r => r.value);

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

      if (deduped.length > 0 && reqId === fetchSeqRef.current) {
        setArticles(deduped);
        try {
          const cacheKey = targetMode === 'world' ? 'hattys_news_world_cache_v3' : 'hattys_news_crypto_cache_v3';
          localStorage.setItem(cacheKey, JSON.stringify(deduped.slice(0, 250)));
        } catch {}
      }
    } catch (err) {
      console.error('Failed to aggregate feeds', err);
    } finally {
      if (reqId === fetchSeqRef.current) {
        setLoading(false);
      }
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

  // Explicit user-triggered refresh
  const handleManualRefresh = async () => {
    if (loading) return;
    setRefreshToast({ message: `Fetching latest ${mode === 'world' ? 'world wire' : 'crypto'} dispatches...`, active: true });
    try {
      if (mode === 'world') {
        window.dispatchEvent(new CustomEvent('refresh-market-data'));
      } else {
        fetchFearGreed();
      }
      await loadNews(true);
      setRefreshToast({ message: `Feed updated with latest ${mode === 'world' ? 'global' : 'crypto'} dispatches`, active: false });
      setTimeout(() => {
        setRefreshToast(null);
      }, 2500);
    } catch {
      setRefreshToast(null);
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
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#030303');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#f8fafc');
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

  // Multi-Source Story Clustering Map (id -> related Articles from other outlets)
  const articleClusters = useMemo(() => computeArticleClusters(articles), [articles]);

  // Count of new stories since last visit
  const newArticlesCount = useMemo(() => {
    return articles.filter(a => a.date.getTime() > lastVisitTime).length;
  }, [articles, lastVisitTime]);

  // 60-Second Morning Brief: Top 5 distinct stories ranked by Multi-Source Coverage + Recency
  const morningBriefStories = useMemo(() => {
    if (articles.length === 0) return [];
    const now = Date.now();
    const scored = articles.slice(0, 80).map(a => {
      const relatedCount = articleClusters.get(a.id)?.length || 0;
      const hoursOld = Math.max(0, (now - a.date.getTime()) / (3600 * 1000));
      const recencyScore = Math.max(0, 24 - hoursOld);
      const score = relatedCount * 10 + recencyScore;
      return { article: a, related: articleClusters.get(a.id) || [], score };
    });
    scored.sort((x, y) => y.score - x.score);

    const picked: { article: Article; related: Article[] }[] = [];
    const usedIds = new Set<string>();
    const usedPubRoots = new Set<string>();

    for (const item of scored) {
      if (usedIds.has(item.article.id)) continue;
      const clusterOverlap = item.related.some(r => usedIds.has(r.id));
      if (clusterOverlap) continue;
      const pubRoot = getPublisherRoot(item.article.src);
      if (usedPubRoots.has(pubRoot) && picked.length < 4 && scored.length > 10) continue;

      usedIds.add(item.article.id);
      item.related.forEach(r => usedIds.add(r.id));
      usedPubRoots.add(pubRoot);
      picked.push({ article: item.article, related: item.related });
      if (picked.length >= 5) break;
    }

    return picked;
  }, [articles, articleClusters]);

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

  // Filtered articles list (supports 'saved' and 'new' filters in addition to categories)
  const filtered = useMemo(() => {
    const baseList = filter === 'saved' ? savedArticles : articles;
    return baseList.filter(a => {
      const matchCat =
        filter === 'all' ||
        filter === 'saved' ||
        (filter === 'new' ? a.date.getTime() > lastVisitTime : (a.matchedCategories.includes(filter) || a.primaryCat === filter));
      const q = query.toLowerCase();
      const matchQuery = !q || a.title.toLowerCase().includes(q) || a.src.toLowerCase().includes(q) || (a.snippet && a.snippet.toLowerCase().includes(q));
      return matchCat && matchQuery;
    });
  }, [articles, savedArticles, filter, query, lastVisitTime]);

  // Copy share link helper with safe fallback
  const handleCopyLink = (id: string, link: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(link).catch(() => {});
      } else {
        const el = document.createElement('textarea');
        el.value = link;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
    } catch {}
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
            exit={{ opacity: 0, scale: 1.03 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
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
                    {/* Gauge Visualization (Needle Sweeps Cleanly - No Text Overlap) */}
                    <div className="relative inline-flex items-center justify-center pt-2">
                      <svg width="240" height="130" viewBox="0 0 240 130" className="overflow-visible">
                        {/* Background Track */}
                        <path 
                          d="M 35 115 A 85 85 0 0 1 205 115" 
                          fill="none" 
                          stroke={isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)"} 
                          strokeWidth="14" 
                          strokeLinecap="round" 
                        />
                        {/* Colored Sentiment Arc */}
                        <path 
                          d="M 35 115 A 85 85 0 0 1 205 115" 
                          fill="none" 
                          stroke="url(#fgGradient)" 
                          strokeWidth="14" 
                          strokeLinecap="round" 
                          strokeDasharray="267"
                          strokeDashoffset={267 - (267 * Math.min(Math.max(parseInt(fearGreed.value, 10) || 50, 0), 100)) / 100}
                          className="transition-all duration-1000 ease-out"
                        />
                        {/* Tick Labels */}
                        <text x="22" y="122" fill="#ef4444" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="end">0</text>
                        <text x="120" y="18" fill="#eab308" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">50</text>
                        <text x="218" y="122" fill="#22c55e" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="start">100</text>

                        <defs>
                          <linearGradient id="fgGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#ef4444" />
                            <stop offset="35%" stopColor="#eab308" />
                            <stop offset="65%" stopColor="#84cc16" />
                            <stop offset="100%" stopColor="#22c55e" />
                          </linearGradient>
                        </defs>

                        {/* Sweeping Indicator Needle & Pivot Hub */}
                        <g transform={`rotate(${(((parseInt(fearGreed.value, 10) || 50) / 100) * 180) - 90}, 120, 115)`} className="transition-transform duration-1000 ease-out">
                          <line x1="120" y1="115" x2="120" y2="42" stroke={isDark ? "#ffffff" : "#0f172a"} strokeWidth="3.5" strokeLinecap="round" />
                          <circle cx="120" cy="115" r="7" fill={isDark ? "#ffffff" : "#0f172a"} />
                          <circle cx="120" cy="115" r="3" fill={
                            parseInt(fearGreed.value, 10) > 75 ? '#22c55e' : 
                            parseInt(fearGreed.value, 10) > 50 ? '#84cc16' : 
                            parseInt(fearGreed.value, 10) > 25 ? '#eab308' : '#ef4444'
                          } />
                        </g>
                      </svg>
                    </div>

                    {/* Clean Dedicated Readout Below the Gauge (Unobstructed) */}
                    <div className="flex flex-col items-center">
                      <div className="flex items-baseline gap-1.5 font-mono">
                        <span 
                          className="text-5xl sm:text-6xl font-black tracking-tight"
                          style={{ 
                            color: 
                              parseInt(fearGreed.value, 10) > 75 ? '#22c55e' : 
                              parseInt(fearGreed.value, 10) > 50 ? '#84cc16' : 
                              parseInt(fearGreed.value, 10) > 25 ? '#eab308' : '#ef4444'
                          }}
                        >
                          {fearGreed.value}
                        </span>
                        <span className="text-sm font-mono font-bold text-[var(--ink-muted)]">/ 100</span>
                      </div>

                      <div 
                        className="text-base sm:text-lg font-bold uppercase tracking-widest mt-1.5 px-4 py-1 rounded-full border shadow-sm font-mono" 
                        style={{ 
                          color: 
                            parseInt(fearGreed.value, 10) > 75 ? '#22c55e' : 
                            parseInt(fearGreed.value, 10) > 50 ? '#84cc16' : 
                            parseInt(fearGreed.value, 10) > 25 ? '#eab308' : '#ef4444',
                          backgroundColor: `${
                            parseInt(fearGreed.value, 10) > 75 ? '#22c55e' : 
                            parseInt(fearGreed.value, 10) > 50 ? '#84cc16' : 
                            parseInt(fearGreed.value, 10) > 25 ? '#eab308' : '#ef4444'
                          }15`,
                          borderColor: `${
                            parseInt(fearGreed.value, 10) > 75 ? '#22c55e' : 
                            parseInt(fearGreed.value, 10) > 50 ? '#84cc16' : 
                            parseInt(fearGreed.value, 10) > 25 ? '#eab308' : '#ef4444'
                          }40`
                        }}
                      >
                        {fearGreed.value_classification}
                      </div>
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

      {/* Doomsday Clock Modal (World Mode) */}
      <AnimatePresence>
        {showDoomsday && (
          <DoomsdayModal 
            isOpen={showDoomsday} 
            onClose={() => setShowDoomsday(false)} 
            isDark={isDark} 
          />
        )}
      </AnimatePresence>

      {/* Economic & Crypto Catalyst Calendar Modal */}
      <AnimatePresence>
        {showCatalysts && (
          <CatalystCalendarModal
            isOpen={showCatalysts}
            onClose={() => setShowCatalysts(false)}
            activeMode={mode}
          />
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
      <header 
        id="hdr" 
        className="sticky top-0 z-80 bg-[var(--surface)] backdrop-blur-xl border-b border-[var(--border)] shadow-md transition-all duration-300"
        style={{
          paddingTop: isInstalled ? 'max(env(safe-area-inset-top, 0px), 24px)' : 'env(safe-area-inset-top, 0px)',
          paddingLeft: 'env(safe-area-inset-left, 0px)',
          paddingRight: 'env(safe-area-inset-right, 0px)',
        }}
      >
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

                {mode === 'crypto' ? (
                  <button 
                    className="ibtn w-8 h-8 p-0 flex items-center justify-center font-mono text-xs shrink-0" 
                    onClick={() => setShowFearGreed(true)}
                    title="Fear & Greed Index"
                  >
                    <Gauge className="w-4 h-4 text-[var(--accent)]" />
                  </button>
                ) : (
                  <button 
                    className="ibtn w-8 h-8 p-0 flex items-center justify-center font-mono text-xs shrink-0 bg-red-500/10 text-red-500 border border-red-500/30 shadow-[0_0_8px_rgba(239,68,68,0.25)]" 
                    onClick={() => setShowDoomsday(true)}
                    title="Doomsday Clock: 90 Seconds to Midnight"
                  >
                    <Clock className="w-4 h-4 text-red-500 animate-pulse" />
                  </button>
                )}

                <button
                  className="ibtn w-8 h-8 p-0 flex items-center justify-center shrink-0"
                  onClick={() => setShowCatalysts(true)}
                  title="Economic & Crypto Catalyst Calendar"
                >
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                </button>

                <button 
                  className="ibtn w-8 h-8 p-0 flex items-center justify-center shrink-0" 
                  onClick={() => setIsDark(!isDark)}
                  title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                  {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                </button>

                <button 
                  className="ibtn w-8 h-8 p-0 flex items-center justify-center shrink-0" 
                  onClick={handleManualRefresh}
                  title={`Refresh All ${mode === 'world' ? 'World' : 'Crypto'} Feeds Now`}
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
            <div className="flex items-center p-1 bg-[var(--surface-solid)] border border-[var(--border)] rounded-xl backdrop-blur-md shadow-sm">
              <button
                onClick={() => handleModeSwitch('crypto')}
                className={`flex-1 py-2 sm:py-2.5 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all duration-300 ${
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
                className={`flex-1 py-2 sm:py-2.5 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all duration-300 ${
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

              {mode === 'crypto' ? (
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
              ) : (
                <button 
                  className="ibtn w-auto px-3 flex items-center gap-1.5 font-mono text-xs shrink-0 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)] transition-all" 
                  onClick={() => setShowDoomsday(true)}
                  title="Doomsday Clock: 90 Seconds to Midnight"
                >
                  <Clock className="w-4 h-4 text-red-500 animate-pulse" />
                  <span className="hidden sm:inline font-bold tracking-tight text-red-500">
                    90s TO MIDNIGHT
                  </span>
                </button>
              )}

              <button
                className="ibtn w-auto px-2.5 sm:px-3 flex items-center gap-1.5 font-mono text-xs shrink-0 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-all"
                onClick={() => setShowCatalysts(true)}
                title="Economic & Crypto Catalyst Calendar"
              >
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden lg:inline font-bold tracking-tight">CATALYSTS</span>
              </button>

              <button 
                className="ibtn shrink-0" 
                onClick={() => setIsDark(!isDark)}
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              <button 
                className="ibtn shrink-0" 
                onClick={handleManualRefresh}
                title={`Refresh All ${mode === 'world' ? 'World' : 'Crypto'} Feeds Now`}
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
            <CommoditiesTicker />
          )}
        </div>
      </div>

      {/* Floating Refresh Status Toast */}
      <AnimatePresence>
        {refreshToast && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="fixed top-20 right-4 z-50 pointer-events-none"
          >
            <div className={`px-4 py-2 rounded-xl border shadow-2xl backdrop-blur-md font-mono text-xs flex items-center gap-2.5 ${
              refreshToast.active
                ? 'bg-[var(--surface-solid)]/95 border-[var(--accent)] text-[var(--ink)]'
                : 'bg-[var(--surface-solid)]/95 border-emerald-500 text-emerald-400'
            }`}>
              <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${refreshToast.active ? 'animate-spin text-[var(--accent)]' : 'text-emerald-400'}`} />
              <span>{refreshToast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Terminal Feed */}
      <main className="max-w-[1440px] mx-auto my-6 px-4">
        {/* Navigation Category Filters - Horizontal scroll on mobile, wrap on desktop */}
        <div className="mb-5">
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

            {/* NEW Since Last Visit Filter Pill */}
            {newArticlesCount > 0 && (
              <button
                className={`fp shrink-0 ${filter === 'new' ? 'on' : 'border-emerald-500/40 text-emerald-400 hover:border-emerald-400'}`}
                onClick={() => setFilter(filter === 'new' ? 'all' : 'new')}
                title="Show stories published since your last visit"
              >
                <Flame className="w-3.5 h-3.5 text-emerald-400" />
                <span>NEW</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  filter === 'new' ? 'bg-white/20 text-white' : 'bg-emerald-500/20 text-emerald-300'
                }`}>
                  {newArticlesCount}
                </span>
              </button>
            )}

            {/* SAVED / Read-Later Queue Filter Pill */}
            <button
              className={`fp shrink-0 ${filter === 'saved' ? 'on' : savedArticles.length > 0 ? 'border-amber-500/40 text-amber-400' : ''}`}
              onClick={() => setFilter(filter === 'saved' ? 'all' : 'saved')}
              title="View your saved Read-Later queue"
            >
              <Bookmark className={`w-3.5 h-3.5 ${savedArticles.length > 0 ? 'fill-amber-400 text-amber-400' : ''}`} />
              <span>SAVED</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                filter === 'saved' ? 'bg-white/20 text-white' : 'bg-black/5 dark:bg-white/5 text-[var(--ink-muted)]'
              }`}>
                {savedArticles.length}
              </span>
            </button>

            {/* 60-Second Morning Brief Toggle Pill */}
            <button
              onClick={toggleBrief}
              className={`fp shrink-0 ml-auto ${
                showBrief
                  ? mode === 'world'
                    ? 'border-blue-500/50 bg-blue-500/10 text-blue-400'
                    : 'border-amber-500/50 bg-amber-500/10 text-amber-400'
                  : ''
              }`}
              title="Toggle 60-Second Executive Brief"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>60S BRIEF</span>
              {showBrief ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Feature 1: 60-Second Morning Brief (Top 5 Must-Know Stories) */}
        <AnimatePresence initial={false}>
          {showBrief && morningBriefStories.length > 0 && filter !== 'saved' && !query && (
            <motion.section
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className={`rounded-2xl border p-4 sm:p-5 relative overflow-hidden ${
                mode === 'world'
                  ? isDark
                    ? 'bg-gradient-to-br from-blue-950/35 via-[var(--surface-solid)] to-[var(--surface-solid)] border-blue-500/30'
                    : 'bg-gradient-to-br from-blue-50 via-white to-white border-blue-300/70 shadow-sm'
                  : isDark
                    ? 'bg-gradient-to-br from-amber-950/25 via-[var(--surface-solid)] to-[var(--surface-solid)] border-amber-500/30'
                    : 'bg-gradient-to-br from-amber-50 via-white to-white border-amber-300/70 shadow-sm'
              }`}>
                <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-[var(--border)] flex-wrap">
                  <div className="flex items-center gap-2.5">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg border ${
                      mode === 'world'
                        ? 'bg-blue-500/15 border-blue-500/40 text-blue-500 dark:text-blue-400'
                        : 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400'
                    }`}>
                      <Zap className="w-4 h-4" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-display text-lg sm:text-xl tracking-wide text-[var(--ink)] leading-none">
                          60-SECOND {mode === 'world' ? 'GLOBAL' : 'CRYPTO'} BRIEF
                        </h2>
                        <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${
                          mode === 'world'
                            ? 'bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/30'
                            : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                        }`}>
                          TOP 5 MUST-KNOW
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-[var(--ink-muted)] mt-0.5">
                        Ranked by multi-source wire consensus & breaking velocity
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowCatalysts(true)}
                      className="text-[11px] font-mono px-2.5 py-1 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors flex items-center gap-1.5 font-bold"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>UPCOMING CATALYSTS</span>
                    </button>
                    <button
                      onClick={toggleBrief}
                      className="text-[11px] font-mono px-2.5 py-1 rounded-lg border border-[var(--border)] text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors"
                    >
                      HIDE
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  {morningBriefStories.map((item, i) => {
                    const isSaved = savedIds.has(item.article.id);
                    return (
                      <div
                        key={item.article.id}
                        className={`group relative rounded-xl border border-[var(--border)] p-3 flex flex-col justify-between transition-all hover:border-[var(--accent)]/50 ${
                          isDark ? 'bg-black/25 hover:bg-black/40' : 'bg-white/90 hover:bg-white shadow-sm'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1.5 mb-1.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className={`text-[10px] font-mono font-black px-1.5 py-0.5 rounded ${
                                mode === 'world'
                                  ? 'bg-blue-500/20 text-blue-600 dark:text-blue-300'
                                  : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                              }`}>
                                0{i + 1}
                              </span>
                              <span className="text-[10px] font-mono font-bold text-[var(--ink-muted)] truncate">
                                {item.article.src}
                              </span>
                            </div>
                            {item.related.length > 0 && (
                              <span className="shrink-0 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30" title={`Covered by ${item.related.length + 1} outlets`}>
                                +{item.related.length} wires
                              </span>
                            )}
                          </div>
                          <a
                            href={item.article.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors line-clamp-3 leading-snug block"
                          >
                            {item.article.title}
                          </a>
                        </div>

                        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-[var(--border)] text-[10px] font-mono text-[var(--ink-muted)]">
                          <span>{formatTimeAgo(item.article.date)}</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => toggleSaveArticle(item.article)}
                              className={`p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${
                                isSaved ? 'text-amber-500 dark:text-amber-400' : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
                              }`}
                              title={isSaved ? 'Remove from Saved' : 'Save for Later'}
                            >
                              <Bookmark className={`w-3 h-3 ${isSaved ? 'fill-amber-400' : ''}`} />
                            </button>
                            <a
                              href={item.article.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[var(--accent)] hover:underline inline-flex items-center gap-0.5 font-bold"
                            >
                              READ <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Status subheader */}
        <div className="flex items-center justify-between text-xs font-mono text-[var(--ink-muted)] mb-4 px-1 flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span>SHOWING: <strong className="text-[var(--ink)]">{filtered.length}</strong> {filter === 'saved' ? 'SAVED DISPATCHES' : mode === 'world' ? 'GLOBAL DISPATCHES' : 'CRYPTO DISPATCHES'}</span>
            {refreshToast && (
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono border ${
                refreshToast.active 
                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/30 animate-pulse' 
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${refreshToast.active ? 'bg-amber-500 animate-ping' : 'bg-emerald-400'}`} />
                {refreshToast.message}
              </span>
            )}
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
            <h2 className="font-display text-[var(--accent)] text-3xl">
              {filter === 'saved' ? 'NO SAVED STORIES YET' : 'NO MATCHING DISPATCHES'}
            </h2>
            <p className="text-[var(--ink-muted)] max-w-md mx-auto my-3 text-sm">
              {filter === 'saved'
                ? 'Tap the bookmark icon on any dispatch to save it to your personal Read-Later queue.'
                : 'No reports match your current category or search criteria. Try choosing another filter or resetting your search.'}
            </p>
            <div className="flex gap-3 justify-center mt-5">
              <button 
                onClick={() => { setFilter('all'); setQuery(''); }} 
                className="rbtn"
              >
                RESET FILTER
              </button>
              <button 
                onClick={() => handleManualRefresh()} 
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
              const cardMode = a.mode || mode;
              const cardCategories = cardMode === 'world' ? WORLD_CATEGORIES : CRYPTO_CATEGORIES;
              const categoryConfig = cardCategories.find(c => c.id === a.primaryCat) || cardCategories[0];
              const badgeClass = categoryConfig.badgeClass || (cardMode === 'world' ? 'badge-world-top' : 'badge-all');
              const isNew = a.date.getTime() > lastVisitTime;
              const isSaved = savedIds.has(a.id);
              const relatedSources = articleClusters.get(a.id) || [];

              return (
                <motion.article
                  key={a.id || idx}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: Math.min(idx * 0.03, 0.6), ease: "easeOut" }}
                  className="card group"
                >
                  <div className="relative overflow-hidden w-full h-[180px] bg-[#0c0c10]">
                    <CardImage article={a} mode={cardMode} />
                    
                    {/* Category + NEW Overlay Badges */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase backdrop-blur-md ${badgeClass}`}>
                        {categoryConfig.label}
                      </span>
                      {isNew && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-black tracking-wider uppercase bg-emerald-500 text-black shadow-lg shadow-emerald-500/30 flex items-center gap-0.5">
                          <Zap className="w-2.5 h-2.5 fill-black" />
                          NEW
                        </span>
                      )}
                    </div>

                    {/* Top-right Action Buttons (Bookmark & Copy Link) */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                      <button
                        onClick={() => toggleSaveArticle(a)}
                        className={`w-7 h-7 rounded-full backdrop-blur-md flex items-center justify-center transition-all ${
                          isSaved
                            ? 'bg-amber-500 text-black opacity-100 shadow-lg shadow-amber-500/30'
                            : 'bg-black/60 hover:bg-black/90 text-gray-300 hover:text-white opacity-90 sm:opacity-0 sm:group-hover:opacity-100'
                        }`}
                        title={isSaved ? 'Remove from Read-Later Queue' : 'Save to Read-Later Queue'}
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-black' : ''}`} />
                      </button>
                      <button 
                        onClick={() => handleCopyLink(a.id, a.link)}
                        className="w-7 h-7 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md text-gray-300 hover:text-white flex items-center justify-center transition-all opacity-90 sm:opacity-0 sm:group-hover:opacity-100"
                        title="Copy Article Link"
                      >
                        {copiedId === a.id ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Share2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="cb">
                    <div className="flex items-center justify-between text-[11px] font-mono text-[var(--ink-muted)] mb-1.5">
                      <span className={`font-bold tracking-wide ${cardMode === 'world' ? 'text-blue-500 dark:text-blue-400' : 'text-[var(--accent)]'}`}>
                        {a.src}
                      </span>
                      <span className="flex items-center gap-1" title={a.date.toLocaleString()}>
                        <Clock className="w-3 h-3 opacity-60" />
                        {formatTimeAgo(a.date)}
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

                    {/* Feature 3: Multi-Source Story Clustering ("Also Covered By...") */}
                    {relatedSources.length > 0 && (
                      <div className={`mb-3 p-2 rounded-lg border border-[var(--border)] ${
                        isDark ? 'bg-white/[0.03]' : 'bg-slate-50'
                      }`}>
                        <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-[var(--ink-muted)] mb-1 flex items-center gap-1">
                          <Layers className="w-2.5 h-2.5 text-[var(--accent)]" />
                          <span>ALSO COVERED BY ({relatedSources.length}):</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {relatedSources.map(rel => (
                            <a
                              key={rel.id}
                              href={rel.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border transition-colors inline-flex items-center gap-1 ${
                                cardMode === 'world'
                                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/25 hover:bg-blue-500/20'
                                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25 hover:bg-amber-500/20'
                              }`}
                              title={rel.title}
                            >
                              <span>{rel.src}</span>
                              <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex-1 min-h-[0.5rem]"></div>

                    <div className="flex items-center gap-2 pt-2 border-t border-[var(--border)] mt-auto">
                      <a 
                        href={a.link} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="rbtn flex-1"
                      >
                        <span>READ FULL REPORT</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <button
                        onClick={() => toggleSaveArticle(a)}
                        className={`px-2.5 py-2 rounded-lg border transition-colors flex items-center justify-center ${
                          isSaved
                            ? 'bg-amber-500/15 border-amber-500/40 text-amber-500 dark:text-amber-400'
                            : 'border-[var(--border)] text-[var(--ink-muted)] hover:text-[var(--ink)] hover:border-[var(--accent)]/40'
                        }`}
                        title={isSaved ? 'Saved in Read-Later Queue' : 'Save for Later'}
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-amber-400' : ''}`} />
                      </button>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </main>

      {/* Bottom Fixed Ticker Strip: LiveCoinWatch in Crypto Mode, Global Stock Tape in World Mode */}
      <div 
        id="tickers" 
        className={`fixed bottom-0 left-0 right-0 z-90 border-t border-[var(--border)] shadow-2xl pb-[env(safe-area-inset-bottom,0px)] transition-colors duration-300 ${
          isDark || mode === 'crypto' ? 'bg-[#060608]' : 'bg-[#ffffff]'
        }`}
      >
        {/* Crypto Mode: LiveCoinWatch Crypto Marquee */}
        <div className={mode === 'crypto' ? 'block' : 'hidden'}>
          <div 
            className="livecoinwatch-widget-5" 
            lcw-base="USD" 
            lcw-color-tx="#abb8c3" 
            lcw-marquee-1="coins" 
            lcw-marquee-2="movers" 
            lcw-marquee-items="15"
          ></div>
        </div>

        {/* World News Mode: Global Stock Market & Indices Ticker */}
        <div className={mode === 'world' ? 'block' : 'hidden'}>
          <StockTickerTape isDark={isDark} />
        </div>
      </div>
    </div>
  );
}
