import { AppMode, Article, DetectedAsset, StoryImpact, OutletMeta, WorldRegionId } from '../types';
import { CRYPTO_CATEGORY_RULES, WORLD_CATEGORY_RULES, WORLD_REGION_RULES } from '../config/feeds';
import { ASSET_DEFINITIONS } from '../config/assets';

export function classifyArticle(
  title: string,
  content: string,
  feedDefaultCat: string,
  mode: AppMode
): { primary: string; matched: string[] } {
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
  const primary = feedDefaultCat !== 'all' ? feedDefaultCat : (matchedList[0] || 'all');
  
  return {
    primary,
    matched: matchedList
  };
}

const CRYPTO_STRICT_RELEVANCE_REGEX =
  /\b(crypto|cryptocurrency|cryptocurrencies|bitcoin|btc|satoshi|sats|ordinals|runes|lightning network|halving|ethereum|eth|ether\b|vitalik|buterin|erc-?20|layer-?\s?[123]|l1\b|l2\b|rollup|rollups|zk-?rollup|zero-?knowledge|arbitrum|optimism|base chain|polygon|matic|steth|eigenlayer|evm\b|eip\b|pectra|solana|sol\b|ripple|xrp|rlusd|cardano|ada\b|doge|dogecoin|shib|shiba inu|avalanche|avax|chainlink|polkadot|near protocol|sui\b|aptos|bnb|binance|coinbase|kraken|bybit|okx|bitfinex|kucoin|bitget|upbit|bithumb|deribit|gemini|mt\.?\s?gox|ftx|alameda|celsius|tether|usdt|usdc|pyusd|fdusd|usds|stusds|usde|ethena|sky protocol|sky co-founder|circle|stablecoin|stablecoins|cbdc|defi|dex\b|cex\b|uniswap|aave|makerdao|curve|lido|pendle|hyperliquid|jupiter|raydium|pancakeswap|pump\.fun|friend\.tech|farcaster|thorchain|synthetix|morpho|maple finance|liquidity pool|yield farming|staking|restaking|tvl|on-?chain|off-?chain|blockchain|blockchains|web3|dapp|dapps|smart contract|smart contracts|token|tokens|tokenized|tokenization|rwa\b|altcoin|altcoins|memecoin|memecoins|meme coin|pepe\b|bonk\b|wif\b|dogwifhat|floki|nft|nfts|opensea|blur\b|pudgy penguins|bored ape|cryptopunk|cryptopunks|metaverse|gamefi|socialfi|depin|airdrop|airdrops|ico\b|ido\b|dao\b|metadao|digital asset|digital assets|virtual asset|crypto mining|bitcoin mining|bitcoin miner|miners|hashrate|hash rate|asic|antminer|bitmain|marathon digital|riot platforms|cleanspark|core scientific|terawulf|hut 8|bitdeer|proof-of-work|proof-of-stake|seed phrase|private key|hardware wallet|crypto wallet|ledger|trezor|coldcard|metamask|phantom|self-custody|cold wallet|hot wallet|shielded address|shielded addresses|multisig|spot etf|bitcoin etf|ethereum etf|crypto etf|ibit|fbtc|gbtc|grayscale|microstrategy|saylor|bitwise|vaneck|21shares|galaxy digital|pantera|paradigm|consensys|chainalysis|zachxbt|arkham|polymarket|gensler|mica\b|fit21|tornado cash|monero|xmr|litecoin|ltc|zcash|zec\b|toncoin|tron|trx|kaspa|cosmos|hedera|hbar|algorand|stellar|xlm|celestia|injective|sei\b|fantom|sonic|mantle|linea|scroll|zksync|starknet|berachain|bittensor|tao\b|coin\s+and\s+crcl|digital\s+gold\s+trades)\b/i;

const NON_CRYPTO_HEADLINE_BLOCK_REGEX =
  /\b(gta\s*6|take-two|1password|neuralink|character\.ai|chatgpt|claude\s+ship|spacex|larry\s+ellison|oracle\s+vote|jensen\s+huang|alice\s+huang|pre-k\s+bill|vibe\s+coding|civ\s+rip-off|death\s+bets|2nm\s+sram|rapidus|prop\s+firm|prop\s+firms)\b/i;

const HEADLINE_CORE_CRYPTO_REGEX =
  /\b(bitcoin|btc|ethereum|eth|crypto|cryptocurrency|blockchain|token|tokens|solana|sol\b|xrp|ripple|defi|web3|nft|nfts|stablecoin|stablecoins|usdt|usdc|coinbase|binance|kraken|altcoin|memecoin|dogecoin|cardano|airdrop|ledger|trezor|coldcard|metamask|polymarket)\b/i;

/**
 * Strict Crypto Relevance Gate:
 * Ensures only genuinely crypto/blockchain/Web3/digital-asset stories appear in Crypto mode,
 * filtering out off-topic general tech, gaming, macro politics, or equity stories syndicated by mixed media feeds.
 */
export function isCryptoRelevantArticle(
  title: string,
  snippet?: string,
  fullText?: string
): boolean {
  const cleanTitle = (title || '').trim();
  if (!cleanTitle) return false;

  // If the headline is explicitly about an off-topic non-crypto subject and has no core crypto term in the headline, reject it
  if (NON_CRYPTO_HEADLINE_BLOCK_REGEX.test(cleanTitle) && !HEADLINE_CORE_CRYPTO_REGEX.test(cleanTitle)) {
    return false;
  }

  const scanText = `${cleanTitle} ${snippet || ''} ${(fullText || '').slice(0, 260)}`;
  return CRYPTO_STRICT_RELEVANCE_REGEX.test(scanText);
}

export function detectAssetsInArticle(
  title: string,
  snippet: string | undefined,
  quotes: Record<string, { price?: number; change24h?: number; formatted?: string }>,
  mode?: AppMode
): DetectedAsset[] {
  const matches: DetectedAsset[] = [];
  const textToScan = `${title} ${snippet || ''}`;
  const seenSymbols = new Set<string>();

  for (const def of ASSET_DEFINITIONS) {
    if (mode === 'crypto' && def.type !== 'crypto') continue;
    if (def.regex.test(textToScan)) {
      if (seenSymbols.has(def.symbol)) continue;
      seenSymbols.add(def.symbol);

      const q = def.marketKey ? quotes[def.marketKey] : quotes[def.id];
      matches.push({
        id: def.id,
        symbol: def.symbol,
        name: def.name,
        type: def.type,
        color: def.color,
        price: q?.price,
        change24h: q?.change24h,
        formatted: q?.formatted,
      });

      if (matches.length >= 3) break;
    }
  }

  return matches;
}

// Feature 4: Macro Story Impact Classifier
export function detectStoryImpact(title: string, snippet?: string): StoryImpact | null {
  const text = `${title} ${snippet || ''}`.toLowerCase();

  if (/\b(breaking|emergency|crisis|historic|landmark|collapse|unprecedented|missile|attack|ceasefire|disaster)\b/i.test(text)) {
    return {
      type: 'BREAKING',
      label: '⚡ BREAKING WIRE',
      badgeClass: 'bg-red-500/15 text-red-500 border-red-500/35'
    };
  }

  if (/\b(sec|cftc|fed|federal reserve|powell|interest rate|rates cut|rate hike|subpoena|lawsuit|gensler|treasury|indictment|bipartisan|sanctions|court|ruling|verdict)\b/i.test(text)) {
    return {
      type: 'POLICY',
      label: '🏛️ MACRO / POLICY',
      badgeClass: 'bg-purple-500/15 text-purple-400 border-purple-500/35'
    };
  }

  if (/\b(all-time high|ath|rally|surges|surged|surging|gains|bull|bullish|skyrockets|soars|inflows|inflow|breakout|expansion|record high)\b/i.test(text)) {
    return {
      type: 'BULLISH',
      label: '📈 BULLISH CATALYST',
      badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/35'
    };
  }

  if (/\b(plunges|plunged|crash|crashes|dump|dumps|bearish|losses|drops|slumps|tumbles|liquidated|liquidation|hack|exploited|drain|outflows)\b/i.test(text)) {
    return {
      type: 'BEARISH',
      label: '📉 BEARISH VOLATILITY',
      badgeClass: 'bg-rose-500/15 text-rose-400 border-rose-500/35'
    };
  }

  return null;
}

// Feature 5: Outlet Country & Wire Desk Badges + World Region Mapping
export function getOutletBadge(src: string): OutletMeta {
  const s = (src || '').toLowerCase();
  if (s.includes('reuters africa')) return { name: 'Reuters Africa', flag: '🌍', region: 'AF', worldRegion: 'africa' };
  if (s.includes('reuters latam')) return { name: 'Reuters LatAm', flag: '🌎', region: 'LATAM', worldRegion: 'latin-america' };
  if (s.includes('reuters')) return { name: 'Reuters', flag: '🌐', region: 'GLOBAL', worldRegion: 'global-wires' };
  if (s.includes('associated press') || s.includes('ap news') || s === 'ap') return { name: 'AP News', flag: '🌐', region: 'GLOBAL', worldRegion: 'global-wires' };
  if (s.includes('afp')) return { name: 'AFP Wire', flag: '🌐', region: 'GLOBAL', worldRegion: 'global-wires' };
  if (s.includes('un news') || s === 'un') return { name: 'UN News', flag: '🇺🇳', region: 'GLOBAL', worldRegion: 'global-wires' };

  // Europe
  if (s.includes('bbc')) return { name: src, flag: '🇬🇧', region: 'UK', worldRegion: 'europe' };
  if (s.includes('guardian')) return { name: 'The Guardian', flag: '🇬🇧', region: 'UK', worldRegion: 'europe' };
  if (s.includes('dw') || s.includes('deutsche')) return { name: 'DW News', flag: '🇩🇪', region: 'DE', worldRegion: 'europe' };
  if (s.includes('france')) return { name: 'France 24', flag: '🇫🇷', region: 'FR', worldRegion: 'europe' };
  if (s.includes('euronews')) return { name: 'Euronews', flag: '🇪🇺', region: 'EU', worldRegion: 'europe' };
  if (s.includes('rté') || s.includes('rte')) return { name: 'RTÉ Ireland', flag: '🇮🇪', region: 'IE', worldRegion: 'europe' };
  if (s.includes('kyiv')) return { name: 'Kyiv Independent', flag: '🇺🇦', region: 'UA', worldRegion: 'europe' };

  // Middle East
  if (s.includes('al jazeera')) return { name: 'Al Jazeera', flag: '🇶🇦', region: 'ME', worldRegion: 'middle-east' };
  if (s.includes('middle east eye')) return { name: 'Middle East Eye', flag: '🕌', region: 'ME', worldRegion: 'middle-east' };
  if (s.includes('national uae') || s.includes('the national')) return { name: 'The National UAE', flag: '🇦🇪', region: 'UAE', worldRegion: 'middle-east' };
  if (s.includes('times of israel')) return { name: 'Times of Israel', flag: '🇮🇱', region: 'IL', worldRegion: 'middle-east' };

  // Asia-Pacific
  if (s.includes('cna') || s.includes('channel news')) return { name: 'CNA', flag: '🇸🇬', region: 'SG', worldRegion: 'asia-pacific' };
  if (s.includes('nhk')) return { name: 'NHK World', flag: '🇯🇵', region: 'JP', worldRegion: 'asia-pacific' };
  if (s.includes('japan times')) return { name: 'Japan Times', flag: '🇯🇵', region: 'JP', worldRegion: 'asia-pacific' };
  if (s.includes('korea herald')) return { name: 'Korea Herald', flag: '🇰🇷', region: 'KR', worldRegion: 'asia-pacific' };
  if (s.includes('south china morning post') || s.includes('scmp')) return { name: 'SCMP', flag: '🇭🇰', region: 'HK', worldRegion: 'asia-pacific' };
  if (s.includes('the hindu')) return { name: 'The Hindu', flag: '🇮🇳', region: 'IN', worldRegion: 'asia-pacific' };
  if (s.includes('abc')) return { name: 'ABC News AU', flag: '🇦🇺', region: 'AU', worldRegion: 'asia-pacific' };

  // Africa
  if (s.includes('africanews')) return { name: 'Africanews', flag: '🌍', region: 'AF', worldRegion: 'africa' };
  if (s.includes('allafrica')) return { name: 'AllAfrica', flag: '🌍', region: 'AF', worldRegion: 'africa' };
  if (s.includes('daily maverick')) return { name: 'Daily Maverick', flag: '🇿🇦', region: 'ZA', worldRegion: 'africa' };

  // Latin America
  if (s.includes('mercopress')) return { name: 'MercoPress', flag: '🌎', region: 'LATAM', worldRegion: 'latin-america' };
  if (s.includes('buenos aires')) return { name: 'BA Times', flag: '🇦🇷', region: 'AR', worldRegion: 'latin-america' };

  // North America
  if (s.includes('cbc')) return { name: 'CBC', flag: '🇨🇦', region: 'CA', worldRegion: 'north-america' };
  if (s.includes('npr')) return { name: src, flag: '🇺🇸', region: 'US', worldRegion: 'north-america' };
  if (s.includes('pbs')) return { name: 'PBS', flag: '🇺🇸', region: 'US', worldRegion: 'north-america' };
  if (s.includes('upi')) return { name: 'UPI', flag: '🇺🇸', region: 'US', worldRegion: 'north-america' };
  if (s.includes('cnbc')) return { name: 'CNBC', flag: '🇺🇸', region: 'US', worldRegion: 'north-america' };
  if (s.includes('politico')) return { name: 'Politico', flag: '🇺🇸', region: 'US', worldRegion: 'north-america' };

  // Science, Space, Flash Wires & Tech
  if (s.includes('usgs')) return { name: 'USGS Seismic', flag: '🌋', region: 'GLOBAL', worldRegion: 'global-wires' };
  if (s.includes('hacker news') || s === 'hn wire') return { name: 'HN Tech Wire', flag: '💻', region: 'TECH', worldRegion: 'north-america' };
  if (s.includes('nasa')) return { name: 'NASA', flag: '🚀', region: 'SPACE', worldRegion: 'global-wires' };
  if (s.includes('space.com')) return { name: 'Space.com', flag: '🌌', region: 'SPACE', worldRegion: 'global-wires' };
  if (s.includes('phys.org')) return { name: 'Phys.org', flag: '🔬', region: 'SCIENCE', worldRegion: 'global-wires' };
  if (s.includes('sciencedaily')) return { name: 'ScienceDaily', flag: '🧪', region: 'SCIENCE', worldRegion: 'global-wires' };
  if (s.includes('ars technica')) return { name: 'Ars Technica', flag: '💻', region: 'US', worldRegion: 'north-america' };
  if (s.includes('verge')) return { name: 'The Verge', flag: '⚡', region: 'US', worldRegion: 'north-america' };
  if (s.includes('techcrunch')) return { name: src, flag: '💻', region: 'TECH' };
  if (s.includes('bitcoin')) return { name: src, flag: '₿', region: 'CRYPTO' };
  return { name: src, flag: '⚡', region: 'CRYPTO' };
}

/**
 * Dual-Signal World Region Classifier:
 * Combines (1) the outlet's geographic desk/headquarters AND (2) geographic entities mentioned in the headline/snippet.
 */
export function detectArticleRegions(
  title: string,
  snippet: string | undefined,
  src: string,
  feedRegion?: WorldRegionId
): WorldRegionId[] {
  const matched = new Set<WorldRegionId>();

  if (feedRegion && feedRegion !== 'all' && feedRegion !== 'blindspot') {
    matched.add(feedRegion);
  }

  const outletMeta = getOutletBadge(src);
  if (outletMeta.worldRegion && outletMeta.worldRegion !== 'all' && outletMeta.worldRegion !== 'blindspot') {
    matched.add(outletMeta.worldRegion);
  }

  const text = `${title} ${snippet || ''}`;
  for (const [regionId, regex] of Object.entries(WORLD_REGION_RULES) as [WorldRegionId, RegExp][]) {
    if (regex.test(text)) {
      matched.add(regionId);
    }
  }

  if (matched.size === 0) {
    matched.add('global-wires');
  }

  return Array.from(matched);
}

/**
 * Global Blindspot Detector:
 * Identifies major international or under-reported regional dispatches (Africa, LatAm, Middle East, Asia-Pacific, Europe)
 * that have zero coverage from US domestic desks in their story cluster.
 */
export function isGlobalBlindspot(article: Article, related: Article[] = []): boolean {
  if (article.mode && article.mode !== 'world') return false;

  const cluster = [article, ...related];
  // Exclude stories reported by US domestic desks
  const hasUsDomesticCoverage = cluster.some(a => getOutletBadge(a.src).region === 'US');
  if (hasUsDomesticCoverage) return false;

  // Exclude stories primarily focused on US domestic politics/institutions
  const text = `${article.title} ${article.snippet || ''}`;
  if (/\b(white house|capitol hill|u\.s\. senate|u\.s\. congress|republican|democrat|gop|wall street|pentagon|american voters)\b/i.test(text)) {
    return false;
  }

  const outlet = getOutletBadge(article.src);
  const articleRegions = article.regions && article.regions.length > 0
    ? article.regions
    : detectArticleRegions(article.title, article.snippet, article.src);

  // 1. Multi-wire international consensus with 0 US coverage
  if (related.length >= 1) {
    return true;
  }

  // 2. Direct regional bureau report from Africa, Latin America, Middle East, or Asia-Pacific
  if (
    outlet.worldRegion === 'africa' ||
    outlet.worldRegion === 'latin-america' ||
    outlet.worldRegion === 'middle-east' ||
    outlet.worldRegion === 'asia-pacific'
  ) {
    return true;
  }

  // 3. Continental European desks (DE, FR, EU, IE, UA) or Global Wire dispatches covering non-US regions
  if (
    ['DE', 'FR', 'EU', 'IE', 'UA'].includes(outlet.region) ||
    articleRegions.some(r => r === 'africa' || r === 'latin-america' || r === 'middle-east' || r === 'asia-pacific')
  ) {
    return true;
  }

  return false;
}
