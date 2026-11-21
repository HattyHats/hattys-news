import { FeedConfig, CategoryConfig, DashboardSettings, WorldRegionConfig, WorldRegionId } from '../types';

export const OTHER_SITES = [
  { name: 'Learn With Hatty', url: 'https://earnwithhatty.com/' },
  { name: 'Token-Tokens', url: 'https://token-tokens.org/' },
  { name: 'HattyFocus', url: 'https://hattyfocus.org/' },
  { name: "Hatty's GIF Maker", url: 'https://hattygifmaker.org/' },
  { name: "Hatty's Universe", url: 'https://hattyuniverse.org/' },
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
  // Core High-Signal Crypto Wires (Always fetched)
  { n: 'CoinTelegraph', u: 'https://cointelegraph.com/rss', defaultCat: 'all', tier: 'core' },
  { n: 'CoinDesk', u: 'https://www.coindesk.com/arc/outboundfeeds/rss/', defaultCat: 'all', tier: 'core' },
  { n: 'Decrypt', u: 'https://decrypt.co/feed', defaultCat: 'all', tier: 'core' },
  { n: 'The Block', u: 'https://www.theblock.co/rss.xml', defaultCat: 'regulation', tier: 'core' },
  { n: 'Blockworks', u: 'https://blockworks.co/feed', defaultCat: 'all', tier: 'core' },
  { n: 'Bitcoin Magazine', u: 'https://bitcoinmagazine.com/feed', defaultCat: 'bitcoin', tier: 'core' },
  { n: 'CryptoSlate', u: 'https://cryptoslate.com/feed/', defaultCat: 'all', tier: 'core' },
  { n: 'The Defiant', u: 'https://thedefiant.io/api/feed', defaultCat: 'defi', tier: 'core' },
  { n: 'BeInCrypto', u: 'https://beincrypto.com/feed/', defaultCat: 'all', tier: 'core' },
  { n: 'Bankless', u: 'https://www.bankless.com/rss/feed', defaultCat: 'defi', tier: 'core' },
  { n: 'DL News', u: 'https://news.google.com/rss/search?q=site:dlnews.com&hl=en-US&gl=US&ceid=US:en', defaultCat: 'defi', tier: 'core' },
  { n: 'CryptoBriefing', u: 'https://cryptobriefing.com/feed/', defaultCat: 'all', tier: 'core' },
  { n: 'Bitcoin.com', u: 'https://news.bitcoin.com/feed/', defaultCat: 'bitcoin', tier: 'core' },
  { n: 'Crypto.News', u: 'https://crypto.news/feed/', defaultCat: 'all', tier: 'core' },
  { n: 'Unchained', u: 'https://unchainedcrypto.com/feed/', defaultCat: 'regulation', tier: 'core' },
  { n: 'Protos', u: 'https://protos.com/feed/', defaultCat: 'regulation', tier: 'core' },

  // Extended Rotating Crypto Pool (Rotated & interleaved on refresh for constant discovery)
  { n: 'DailyCoin', u: 'https://dailycoin.com/feed/', defaultCat: 'all', tier: 'extended' },
  { n: 'U.Today', u: 'https://u.today/rss', defaultCat: 'all', tier: 'extended' },
  { n: 'AMBCrypto', u: 'https://ambcrypto.com/feed/', defaultCat: 'altcoin', tier: 'extended' },
  { n: 'CryptoPotato', u: 'https://cryptopotato.com/feed/', defaultCat: 'all', tier: 'extended' },
  { n: 'NewsBTC', u: 'https://www.newsbtc.com/feed/', defaultCat: 'all', tier: 'extended' },
  { n: 'Bitcoinist', u: 'https://bitcoinist.com/feed/', defaultCat: 'bitcoin', tier: 'extended' },
  { n: 'CoinGape', u: 'https://news.google.com/rss/search?q=site:coingape.com&hl=en-US&gl=US&ceid=US:en', defaultCat: 'altcoin', tier: 'extended' },
  { n: 'TechCrunch Crypto', u: 'https://techcrunch.com/category/cryptocurrency/feed/', defaultCat: 'all', tier: 'extended' }
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

export const WORLD_REGIONS: WorldRegionConfig[] = [
  { id: 'all', label: 'ALL REGIONS', shortLabel: 'ALL', icon: '🌐' },
  { id: 'north-america', label: 'NORTH AMERICA', shortLabel: 'N. AMERICA', icon: '🇺🇸' },
  { id: 'europe', label: 'EUROPE', shortLabel: 'EUROPE', icon: '🇪🇺' },
  { id: 'middle-east', label: 'MIDDLE EAST', shortLabel: 'M. EAST', icon: '🕌' },
  { id: 'asia-pacific', label: 'ASIA-PACIFIC', shortLabel: 'ASIA-PAC', icon: '🌏' },
  { id: 'africa', label: 'AFRICA', shortLabel: 'AFRICA', icon: '🌍' },
  { id: 'latin-america', label: 'LATIN AMERICA', shortLabel: 'LATAM', icon: '🌎' },
  { id: 'global-wires', label: 'GLOBAL WIRES', shortLabel: 'WIRES', icon: '🛰️' },
  { id: 'blindspot', label: 'GLOBAL BLINDSPOT', shortLabel: 'BLINDSPOT', icon: '👁️' },
];

export const WORLD_REGION_RULES: Record<Exclude<WorldRegionId, 'all' | 'global-wires' | 'blindspot'>, RegExp> = {
  'north-america': /\b(u\.s\.|united states|washington|white house|pentagon|wall street|congress|senate|american|canada|canadian|ottawa|toronto|ontario|montreal|vancouver|california|new york|texas|florida|chicago|federal reserve)\b/i,
  'europe': /\b(europe|european|eu\b|brussels|u\.k\.|britain|british|london|england|scotland|ireland|dublin|france|french|paris|germany|german|berlin|italy|italian|rome|spain|spanish|madrid|ukraine|ukrainian|kyiv|russia|russian|moscow|poland|warsaw|nato|switzerland|geneva|sweden|norway|finland|greece|athens|balkans|dutch|netherlands|amsterdam|vatican|ecb)\b/i,
  'middle-east': /\b(middle east|israel|israeli|gaza|palestin\w*|hamas|west bank|jerusalem|tel aviv|iran|iranian|tehran|lebanon|lebanese|beirut|hezbollah|syria|syrian|damascus|saudi|riyadh|uae|dubai|abu dhabi|qatar|doha|yemen|houthi\w*|iraq|baghdad|jordan|amman|egypt|egyptian|cairo|turkey|turkish|ankara|istanbul|red sea|persian gulf|opec)\b/i,
  'asia-pacific': /\b(asia|asian|china|chinese|beijing|shanghai|hong kong|taiwan|taipei|japan|japanese|tokyo|south korea|korean|seoul|north korea|pyongyang|india|indian|new delhi|mumbai|modi|pakistan|islamabad|australia|australian|sydney|melbourne|canberra|singapore|indonesia|jakarta|philippines|manila|vietnam|hanoi|thailand|bangkok|malaysia|myanmar|bangladesh|dhaka|new zealand|auckland|pacific islands|asean)\b/i,
  'africa': /\b(africa|african|nigeria|nigerian|lagos|abuja|kenya|kenyan|nairobi|south africa|johannesburg|cape town|pretoria|ethiopia|addis ababa|sudan|sudanese|khartoum|congo|drc|kinshasa|ghana|accra|senegal|dakar|morocco|rabat|algeria|tunisia|uganda|kampala|tanzania|zimbabwe|zambia|angola|mozambique|somalia|mogadishu|rwanda|kigali|sahel|mali|niger|burkina faso|african union|ecowas)\b/i,
  'latin-america': /\b(latin america|south america|central america|brazil|brazilian|brasilia|sao paulo|rio de janeiro|lula|mexico|mexican|mexico city|argentina|argentine|buenos aires|milei|colombia|bogota|chile|santiago|peru|lima|venezuela|caracas|ecuador|quito|bolivia|uruguay|paraguay|panama|costa rica|guatemala|el salvador|honduras|cuba|havana|haiti|caribbean|mercosur|andes)\b/i,
};

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
  // 1. GLOBAL WIRES & SCIENCE
  { n: 'Reuters', u: 'https://news.google.com/rss/search?q=source:Reuters&hl=en-US&gl=US&ceid=US:en', defaultCat: 'all', region: 'global-wires', tier: 'core' },
  { n: 'Associated Press', u: 'https://news.google.com/rss/search?q=source:%22Associated+Press%22&hl=en-US&gl=US&ceid=US:en', defaultCat: 'all', region: 'global-wires', tier: 'core' },
  { n: 'AFP Global Wire', u: 'https://news.google.com/rss/search?q=source:AFP&hl=en-US&gl=US&ceid=US:en', defaultCat: 'all', region: 'global-wires', tier: 'core' },
  { n: 'UN News', u: 'https://news.un.org/feed/subscribe/en/news/all/rss.xml', defaultCat: 'geopolitics', region: 'global-wires', tier: 'core' },
  { n: 'NASA Space Wire', u: 'https://www.nasa.gov/news-release/feed/', defaultCat: 'space', region: 'global-wires', tier: 'core' },
  { n: 'Space.com', u: 'https://www.space.com/feeds/all', defaultCat: 'space', region: 'global-wires', tier: 'extended' },
  { n: 'Phys.org', u: 'https://phys.org/rss-feed/', defaultCat: 'space', region: 'global-wires', tier: 'extended' },
  { n: 'ScienceDaily', u: 'https://www.sciencedaily.com/rss/all.xml', defaultCat: 'space', region: 'global-wires', tier: 'extended' },

  // 2. NORTH AMERICA (US & Canada)
  { n: 'NPR World', u: 'https://feeds.npr.org/1004/rss.xml', defaultCat: 'all', region: 'north-america', tier: 'core' },
  { n: 'NPR Politics', u: 'https://feeds.npr.org/1014/rss.xml', defaultCat: 'politics', region: 'north-america', tier: 'extended' },
  { n: 'PBS NewsHour', u: 'https://news.google.com/rss/search?q=source:%22PBS+NewsHour%22&hl=en-US&gl=US&ceid=US:en', defaultCat: 'politics', region: 'north-america', tier: 'core' },
  { n: 'CBC World', u: 'https://www.cbc.ca/cmlink/rss-world', defaultCat: 'all', region: 'north-america', tier: 'core' },
  { n: 'UPI World', u: 'https://rss.upi.com/news/world_news.rss', defaultCat: 'all', region: 'north-america', tier: 'extended' },
  { n: 'CNBC World', u: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100727362', defaultCat: 'economy', region: 'north-america', tier: 'core' },
  { n: 'Politico', u: 'https://rss.politico.com/politics-news.xml', defaultCat: 'politics', region: 'north-america', tier: 'extended' },
  { n: 'Ars Technica', u: 'https://feeds.arstechnica.com/arstechnica/index', defaultCat: 'tech', region: 'north-america', tier: 'core' },
  { n: 'The Verge', u: 'https://www.theverge.com/rss/index.xml', defaultCat: 'tech', region: 'north-america', tier: 'extended' },

  // 3. EUROPE (UK, Germany, France, EU, Ireland, Eastern Europe)
  { n: 'BBC World', u: 'https://feeds.bbci.co.uk/news/world/rss.xml', defaultCat: 'all', region: 'europe', tier: 'core' },
  { n: 'BBC Business', u: 'https://feeds.bbci.co.uk/news/business/rss.xml', defaultCat: 'economy', region: 'europe', tier: 'extended' },
  { n: 'BBC Technology', u: 'https://feeds.bbci.co.uk/news/technology/rss.xml', defaultCat: 'tech', region: 'europe', tier: 'extended' },
  { n: 'BBC Science', u: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml', defaultCat: 'environment', region: 'europe', tier: 'extended' },
  { n: 'DW News', u: 'https://rss.dw.com/rdf/rss-en-all', defaultCat: 'all', region: 'europe', tier: 'core' },
  { n: 'France 24', u: 'https://www.france24.com/en/rss', defaultCat: 'all', region: 'europe', tier: 'core' },
  { n: 'The Guardian World', u: 'https://www.theguardian.com/world/rss', defaultCat: 'all', region: 'europe', tier: 'core' },
  { n: 'Euronews', u: 'https://www.euronews.com/rss', defaultCat: 'all', region: 'europe', tier: 'core' },
  { n: 'RTÉ News Ireland', u: 'https://www.rte.ie/news/rss/news-headlines.xml', defaultCat: 'all', region: 'europe', tier: 'extended' },
  { n: 'Kyiv Independent', u: 'https://news.google.com/rss/search?q=site:kyivindependent.com&hl=en-US&gl=US&ceid=US:en', defaultCat: 'geopolitics', region: 'europe', tier: 'extended' },

  // 4. MIDDLE EAST (Qatar, UAE, Pan-MENA, Levant)
  { n: 'Al Jazeera', u: 'https://www.aljazeera.com/xml/rss/all.xml', defaultCat: 'geopolitics', region: 'middle-east', tier: 'core' },
  { n: 'Middle East Eye', u: 'https://www.middleeasteye.net/rss', defaultCat: 'geopolitics', region: 'middle-east', tier: 'core' },
  { n: 'The National UAE', u: 'https://news.google.com/rss/search?q=site:thenationalnews.com&hl=en-US&gl=US&ceid=US:en', defaultCat: 'all', region: 'middle-east', tier: 'extended' },
  { n: 'Times of Israel', u: 'https://news.google.com/rss/search?q=site:timesofisrael.com&hl=en-US&gl=US&ceid=US:en', defaultCat: 'geopolitics', region: 'middle-east', tier: 'extended' },

  // 5. ASIA-PACIFIC (Singapore, Japan, Australia, Hong Kong, India, South Korea)
  { n: 'CNA World', u: 'https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml&category=6311', defaultCat: 'all', region: 'asia-pacific', tier: 'core' },
  { n: 'NHK World', u: 'https://news.google.com/rss/search?q=site:nhk.or.jp/nhkworld&hl=en-US&gl=US&ceid=US:en', defaultCat: 'all', region: 'asia-pacific', tier: 'core' },
  { n: 'ABC News AU', u: 'https://www.abc.net.au/news/feed/51120/rss.xml', defaultCat: 'all', region: 'asia-pacific', tier: 'core' },
  { n: 'South China Morning Post', u: 'https://www.scmp.com/rss/91/feed', defaultCat: 'all', region: 'asia-pacific', tier: 'core' },
  { n: 'The Hindu World', u: 'https://www.thehindu.com/news/international/feeder/default.rss', defaultCat: 'all', region: 'asia-pacific', tier: 'extended' },
  { n: 'The Japan Times', u: 'https://news.google.com/rss/search?q=site:japantimes.co.jp&hl=en-US&gl=US&ceid=US:en', defaultCat: 'all', region: 'asia-pacific', tier: 'extended' },
  { n: 'Korea Herald', u: 'https://news.google.com/rss/search?q=site:koreaherald.com&hl=en-US&gl=US&ceid=US:en', defaultCat: 'all', region: 'asia-pacific', tier: 'extended' },

  // 6. AFRICA (Pan-Africa, South Africa, East & West Africa)
  { n: 'Africanews', u: 'https://www.africanews.com/feed/rss', defaultCat: 'all', region: 'africa', tier: 'core' },
  { n: 'AllAfrica Wire', u: 'https://news.google.com/rss/search?q=site:allafrica.com&hl=en-US&gl=US&ceid=US:en', defaultCat: 'all', region: 'africa', tier: 'core' },
  { n: 'Daily Maverick SA', u: 'https://news.google.com/rss/search?q=site:dailymaverick.co.za&hl=en-US&gl=US&ceid=US:en', defaultCat: 'all', region: 'africa', tier: 'extended' },
  { n: 'Reuters Africa Desk', u: 'https://news.google.com/rss/search?q=(Africa+OR+Nigeria+OR+Kenya+OR+%22South+Africa%22)+source:Reuters&hl=en-US&gl=US&ceid=US:en', defaultCat: 'all', region: 'africa', tier: 'extended' },

  // 7. LATIN AMERICA (South America, Brazil, Argentina, Mexico, Caribbean)
  { n: 'MercoPress LatAm', u: 'https://en.mercopress.com/rss/', defaultCat: 'all', region: 'latin-america', tier: 'core' },
  { n: 'Buenos Aires Times', u: 'https://news.google.com/rss/search?q=site:batimes.com.ar&hl=en-US&gl=US&ceid=US:en', defaultCat: 'all', region: 'latin-america', tier: 'core' },
  { n: 'Reuters LatAm Desk', u: 'https://news.google.com/rss/search?q=(Brazil+OR+Mexico+OR+Argentina+OR+Colombia+OR+Chile)+source:Reuters&hl=en-US&gl=US&ceid=US:en', defaultCat: 'all', region: 'latin-america', tier: 'extended' }
];

export const DEFAULT_DASHBOARD_SETTINGS: DashboardSettings = {
  cryptoCategories: CRYPTO_CATEGORIES.map(c => c.id),
  cryptoHidden: [],
  worldCategories: WORLD_CATEGORIES.map(c => c.id),
  worldHidden: [],
  showAssetTags: true,
  cardDensity: 'comfortable',
  pinnedSources: [],
  mutedSources: [],
  dimReadArticles: true,
};
