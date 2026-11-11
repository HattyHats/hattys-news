import { FeedConfig, CategoryConfig, DashboardSettings } from '../types';

export const OTHER_SITES = [
  { name: 'Learn With Hatty', url: 'https://earnwithhatty.com/' },
  { name: 'Token-Tokens', url: 'https://token-tokens.org/' },
  { name: 'Open-Focus', url: 'https://hattyhats.github.io/Open-Focus/' },
  { name: "Hatty's Universe", url: 'https://hatty-universe.netlify.app/' },
  { name: 'QuickPad', url: 'https://www.quickpad.org/' },
  { name: 'Local-Cast', url: 'https://www.local-cast.org/' },
];

/* --- CRYPTO CONFIGURATION --- */
export const CRYPTO_CATEGORIES: CategoryConfig[] = [
  { id: 'all', label: 'ALL', icon: '⚡', badgeClass: 'badge-bitcoin' },
  { id: 'bitcoin', label: 'BITCOIN', icon: '₿', badgeClass: 'badge-bitcoin' },
  { id: 'ethereum', label: 'ETHEREUM', icon: 'Ξ', badgeClass: 'badge-ethereum' },
  { id: 'defi', label: 'DEFI', icon: '🏦', badgeClass: 'badge-defi' },
  { id: 'nft', label: 'NFT/WEB3', icon: '🖼️', badgeClass: 'badge-nft' },
  { id: 'altcoin', label: 'ALTCOINS', icon: '🚀', badgeClass: 'badge-altcoin' },
  { id: 'mining', label: 'MINING', icon: '⛏️', badgeClass: 'badge-mining' },
  { id: 'regulation', label: 'POLICY', icon: '⚖️', badgeClass: 'badge-regulation' }
];

export const CRYPTO_CATEGORY_RULES: Record<string, RegExp> = {
  bitcoin: /\b(bitcoin|btc|satoshi|ordinals|runes|lightning network|halving)\b/i,
  ethereum: /\b(ethereum|eth|vitalik|erc-20|erc20|layer 2|layer2|l2|arbitrum|optimism|base|polygon|steth|eigenlayer|evm|eip)\b/i,
  defi: /\b(defi|decentralized finance|dex|uniswap|aave|makerdao|curve|liquidity|yield|lending|staking|tvl|swap|liquid staking|synthetix|pancakeswap)\b/i,
  nft: /\b(nft|nfts|opensea|blur|metaverse|web3|digital collectible|pfp|airdrop|gamefi|bored ape|cryptopunk)\b/i,
  altcoin: /\b(altcoin|altcoins|solana|sol|ripple|xrp|cardano|ada|doge|dogecoin|shib|shiba|avalanche|avax|chainlink|link|polkadot|dot|near|sui|aptos|bnb|binance coin|ton|tron|trx|pepe|memecoin|meme coin|fantom|kaspa|render)\b/i,
  mining: /\b(mining|miner|miners|hashrate|hash rate|asic|antminer|marathon|riot platforms|clean energy|proof-of-work|pow)\b/i,
  regulation: /\b(sec|cftc|regulation|regulatory|regulator|regulators|lawsuit|court|judge|subpoena|gensler|congress|senate|treasury|irs|tax|doj|sanctions|compliance|ban|legal|investigation|bipartisan|fbi|gop|democrat|white house)\b/i
};

export const CRYPTO_FEEDS: FeedConfig[] = [
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
  { n: 'CryptoPotato', u: 'https://cryptopotato.com/feed/', defaultCat: 'all' },
  { n: 'Bitcoin.com', u: 'https://news.bitcoin.com/feed/', defaultCat: 'bitcoin' },
  { n: 'NewsBTC', u: 'https://www.newsbtc.com/feed/', defaultCat: 'all' },
  { n: 'Crypto.News', u: 'https://crypto.news/feed/', defaultCat: 'all' },
  { n: 'Bankless', u: 'https://www.bankless.com/rss/feed', defaultCat: 'defi' },
  { n: 'TechCrunch Crypto', u: 'https://techcrunch.com/category/cryptocurrency/feed/', defaultCat: 'all' }
];

/* --- UNBIASED WORLD NEWS CONFIGURATION --- */
export const WORLD_CATEGORIES: CategoryConfig[] = [
  { id: 'all', label: 'TOP STORIES', icon: '🌐', badgeClass: 'badge-world-top' },
  { id: 'politics', label: 'POLITICS', icon: '🏛️', badgeClass: 'badge-world-politics' },
  { id: 'geopolitics', label: 'GEOPOLITICS', icon: '⚔️', badgeClass: 'badge-world-geo' },
  { id: 'economy', label: 'ECONOMY', icon: '💼', badgeClass: 'badge-world-economy' },
  { id: 'tech', label: 'TECH & AI', icon: '🔬', badgeClass: 'badge-world-tech' },
  { id: 'environment', label: 'CLIMATE', icon: '🌍', badgeClass: 'badge-world-env' },
  { id: 'health', label: 'HEALTH', icon: '🏥', badgeClass: 'badge-world-health' },
  { id: 'space', label: 'SCIENCE & SPACE', icon: '🛰️', badgeClass: 'badge-world-space' }
];

export const WORLD_CATEGORY_RULES: Record<string, RegExp> = {
  politics: /\b(politics|election|parliament|congress|senate|president|prime minister|biden|trump|kamala|democrat|republican|gop|white house|bill|legislation|vote|voters|supreme court|ballot|governor|cabinet|minister)\b/i,
  geopolitics: /\b(geopolitics|ukraine|russia|putin|zelensky|israel|gaza|middle east|iran|china|taiwan|nato|united nations|un|ceasefire|diplomacy|treaty|sanctions|military|defense|war|conflict|missile|security council|beijing|kyiv)\b/i,
  economy: /\b(economy|economic|inflation|federal reserve|fed|powell|interest rates|jobs|unemployment|gdp|recession|stock market|wall street|central bank|trade|tariffs|treasury|imf|world bank|consumer|market)\b/i,
  tech: /\b(technology|tech|ai|artificial intelligence|openai|google|apple|microsoft|nvidia|semiconductor|chip|robotics|cybersecurity|software|internet|quantum|algorithm)\b/i,
  environment: /\b(climate|environment|wildfire|hurricane|flood|warming|renewable|solar|wind|carbon|emissions|drought|energy transition|biodiversity|cop28|cop29|epa|pollution)\b/i,
  health: /\b(health|medical|medicine|hospital|disease|vaccine|fda|who|cancer|mental health|pandemic|drug|treatment|clinical|healthcare|virus)\b/i,
  space: /\b(space|nasa|spacex|astronomy|telescope|moon|mars|asteroid|satellite|orbit|cosmic|galaxy|physics|discovery|science|james webb)\b/i
};

export const WORLD_FEEDS: FeedConfig[] = [
  { n: 'Reuters', u: 'https://news.google.com/rss/search?q=source:Reuters&hl=en-US&gl=US&ceid=US:en', defaultCat: 'all' },
  { n: 'Associated Press', u: 'https://news.google.com/rss/search?q=source:%22Associated+Press%22&hl=en-US&gl=US&ceid=US:en', defaultCat: 'all' },
  { n: 'BBC World', u: 'https://feeds.bbci.co.uk/news/world/rss.xml', defaultCat: 'all' },
  { n: 'BBC Business', u: 'https://feeds.bbci.co.uk/news/business/rss.xml', defaultCat: 'economy' },
  { n: 'BBC Technology', u: 'https://feeds.bbci.co.uk/news/technology/rss.xml', defaultCat: 'tech' },
  { n: 'BBC Science', u: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml', defaultCat: 'environment' },
  { n: 'DW News', u: 'https://rss.dw.com/rdf/rss-en-all', defaultCat: 'all' },
  { n: 'France 24', u: 'https://www.france24.com/en/rss', defaultCat: 'all' },
  { n: 'Al Jazeera', u: 'https://www.aljazeera.com/xml/rss/all.xml', defaultCat: 'geopolitics' },
  { n: 'The Guardian World', u: 'https://www.theguardian.com/world/rss', defaultCat: 'all' },
  { n: 'CBC World', u: 'https://www.cbc.ca/cmlink/rss-world', defaultCat: 'all' },
  { n: 'NPR World', u: 'https://feeds.npr.org/1004/rss.xml', defaultCat: 'all' },
  { n: 'NPR Politics', u: 'https://feeds.npr.org/1014/rss.xml', defaultCat: 'politics' },
  { n: 'PBS NewsHour', u: 'https://news.google.com/rss/search?q=source:%22PBS+NewsHour%22&hl=en-US&gl=US&ceid=US:en', defaultCat: 'politics' },
  { n: 'UPI World', u: 'https://rss.upi.com/news/world_news.rss', defaultCat: 'all' },
  { n: 'UN News', u: 'https://news.un.org/feed/subscribe/en/news/all/rss.xml', defaultCat: 'geopolitics' },
  { n: 'ABC News AU', u: 'https://www.abc.net.au/news/feed/51120/rss.xml', defaultCat: 'all' },
  { n: 'CNA World', u: 'https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml&category=6311', defaultCat: 'all' },
  { n: 'NHK World', u: 'https://news.google.com/rss/search?q=source:%22NHK+WORLD-JAPAN%22&hl=en-US&gl=US&ceid=US:en', defaultCat: 'all' },
  { n: 'NASA Space Wire', u: 'https://www.nasa.gov/news-release/feed/', defaultCat: 'space' },
  { n: 'Space.com', u: 'https://www.space.com/feeds/all', defaultCat: 'space' },
  { n: 'Phys.org', u: 'https://phys.org/rss-feed/', defaultCat: 'space' },
  { n: 'ScienceDaily', u: 'https://www.sciencedaily.com/rss/all.xml', defaultCat: 'space' },
  { n: 'Ars Technica', u: 'https://feeds.arstechnica.com/arstechnica/index', defaultCat: 'tech' },
  { n: 'The Verge', u: 'https://www.theverge.com/rss/index.xml', defaultCat: 'tech' }
];

export const CRYPTO_SPLASH_HEADLINES = [
  { tag: 'BREAKING', cat: 'BITCOIN', text: 'Bitcoin Hashrate Reaches New All-Time High Amid Global Expansion' },
  { tag: 'MARKET ALERT', cat: 'ETHEREUM', text: 'Ethereum Layer-2 TVL Explodes Past $50B Milestone' },
  { tag: 'REGULATION', cat: 'POLICY', text: 'Global Regulators Form Digital Asset Unified Framework' },
  { tag: 'DEFI DISPATCH', cat: 'DEFI', text: 'Institutional Staking Volumes Surge by 140% in Q3' },
  { tag: 'FLASH INTEL', cat: 'ALTCOINS', text: 'Solana DEX Volume Flips Major CeFi Exchanges in Weekly Stats' },
  { tag: 'TECH INTEL', cat: 'MINING', text: 'Next-Gen 3nm ASIC Miners Enter Commercial Mass Production' },
  { tag: 'MARKET FLASH', cat: 'BITCOIN', text: 'Spot ETF Cumulative Net Inflows Cross Record Frontiers' },
  { tag: 'WEB3 WIRE', cat: 'NFT/WEB3', text: 'Zero-Knowledge Cryptography Integrations Go Mainstream' }
];

export const WORLD_SPLASH_HEADLINES = [
  { tag: 'GLOBAL WIRE', cat: 'DIPLOMACY', text: 'International Delegations Convene on Global Ceasefire Framework' },
  { tag: 'WIRE FLASH', cat: 'ECONOMY', text: 'Global Central Banks Report Synchronized Decline in Core Inflation' },
  { tag: 'FACT-CHECKED', cat: 'SCIENCE', text: 'James Webb Telescope Detects Organic Compounds in Exoplanet Orbit' },
  { tag: 'DISPATCH', cat: 'WORLD', text: 'United Nations High Council Unveils Comprehensive Humanitarian Plan' },
  { tag: 'GLOBAL TECH', cat: 'TECH & AI', text: 'International Standards Body Establishes Open Ethics Framework for AI' },
  { tag: 'WORLD REPORT', cat: 'CLIMATE', text: 'Renewable Power Generation Surpasses Global Coal Capacity in Milestone' }
];

export const DEFAULT_DASHBOARD_SETTINGS: DashboardSettings = {
  cryptoCategories: CRYPTO_CATEGORIES.map(c => c.id),
  cryptoHidden: [],
  worldCategories: WORLD_CATEGORIES.map(c => c.id),
  worldHidden: [],
  showAssetTags: true,
  cardDensity: 'comfortable',
};
