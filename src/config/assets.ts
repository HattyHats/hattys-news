import { AssetDefinition, TickerToken, TapeQuote, CommodityItem } from '../types';

export const ASSET_DEFINITIONS: AssetDefinition[] = [
  // Top Cryptocurrencies
  { id: 'BTC', symbol: 'BTC', name: 'Bitcoin', type: 'crypto', regex: /\b(\$?BTC|Bitcoin|Satoshi)\b/i, color: '#f59e0b', marketKey: 'BTC' },
  { id: 'ETH', symbol: 'ETH', name: 'Ethereum', type: 'crypto', regex: /\b(\$?ETH|Ethereum|Ether)\b/i, color: '#6366f1', marketKey: 'ETH' },
  { id: 'SOL', symbol: 'SOL', name: 'Solana', type: 'crypto', regex: /\b(\$?SOL|Solana)\b/i, color: '#a855f7', marketKey: 'SOL' },
  { id: 'XRP', symbol: 'XRP', name: 'XRP', type: 'crypto', regex: /\b(\$?XRP|Ripple)\b/i, color: '#06b6d4', marketKey: 'XRP' },
  { id: 'DOGE', symbol: 'DOGE', name: 'Dogecoin', type: 'crypto', regex: /\b(\$?DOGE|Dogecoin)\b/i, color: '#eab308', marketKey: 'DOGE' },
  { id: 'ADA', symbol: 'ADA', name: 'Cardano', type: 'crypto', regex: /\b(\$?ADA|Cardano)\b/i, color: '#3b82f6', marketKey: 'ADA' },
  { id: 'BNB', symbol: 'BNB', name: 'BNB', type: 'crypto', regex: /\b(\$?BNB|Binance Coin)\b/i, color: '#facc15', marketKey: 'BNB' },
  { id: 'AVAX', symbol: 'AVAX', name: 'Avalanche', type: 'crypto', regex: /\b(\$?AVAX|Avalanche)\b/i, color: '#ef4444', marketKey: 'AVAX' },
  { id: 'LINK', symbol: 'LINK', name: 'Chainlink', type: 'crypto', regex: /(?:\$LINK\b|\bChainlink\b|\bLINK\s+(?:token|price|crypto|etf|oracle)\b)/i, color: '#2563eb', marketKey: 'LINK' },
  { id: 'SUI', symbol: 'SUI', name: 'Sui', type: 'crypto', regex: /\b(\$?SUI|Sui Network)\b/i, color: '#0284c7', marketKey: 'SUI' },
  { id: 'PEPE', symbol: 'PEPE', name: 'Pepe', type: 'crypto', regex: /\b(\$?PEPE|Pepe Coin)\b/i, color: '#22c55e', marketKey: 'PEPE' },
  { id: 'SHIB', symbol: 'SHIB', name: 'Shiba Inu', type: 'crypto', regex: /\b(\$?SHIB|Shiba Inu)\b/i, color: '#f97316', marketKey: 'SHIB' },

  // Key Commodities
  { id: 'GOLD', symbol: 'GOLD', name: 'Gold Spot', type: 'commodity', regex: /\b(Gold|Bullion|XAU)\b/i, color: '#ca8a04', marketKey: 'GOLD' },
  { id: 'SILVER', symbol: 'SILVER', name: 'Silver Spot', type: 'commodity', regex: /\b(Silver|XAG)\b/i, color: '#94a3b8', marketKey: 'SILVER' },
  { id: 'OIL_CRUDE', symbol: 'OIL', name: 'Crude Oil', type: 'commodity', regex: /\b(Crude Oil|Brent|WTI|Petroleum|OPEC)\b/i, color: '#ea580c', marketKey: 'OIL_CRUDE' },
  { id: 'NAT_GAS', symbol: 'NATGAS', name: 'Natural Gas', type: 'commodity', regex: /\b(Natural Gas|NatGas|LNG)\b/i, color: '#0284c7', marketKey: 'NAT_GAS' },
  { id: 'COPPER', symbol: 'COPPER', name: 'Copper', type: 'commodity', regex: /\b(Copper)\b/i, color: '#d97706', marketKey: 'COPPER' },
  { id: 'URANIUM', symbol: 'URANIUM', name: 'Uranium', type: 'commodity', regex: /\b(Uranium)\b/i, color: '#10b981', marketKey: 'URANIUM' },

  // Top Equities & Tech
  { id: 'NVDA', symbol: 'NVDA', name: 'Nvidia', type: 'stock', regex: /\b(\$?NVDA|Nvidia)\b/i, color: '#16a34a', marketKey: 'NVDA' },
  { id: 'AAPL', symbol: 'AAPL', name: 'Apple', type: 'stock', regex: /\b(\$?AAPL|Apple Inc)\b/i, color: '#64748b', marketKey: 'AAPL' },
  { id: 'TSLA', symbol: 'TSLA', name: 'Tesla', type: 'stock', regex: /\b(\$?TSLA|Tesla)\b/i, color: '#e11d48', marketKey: 'TSLA' },
  { id: 'MSFT', symbol: 'MSFT', name: 'Microsoft', type: 'stock', regex: /\b(\$?MSFT|Microsoft)\b/i, color: '#0284c7', marketKey: 'MSFT' },
  { id: 'AMZN', symbol: 'AMZN', name: 'Amazon', type: 'stock', regex: /\b(\$?AMZN|Amazon)\b/i, color: '#f59e0b', marketKey: 'AMZN' },
  { id: 'GOOGL', symbol: 'GOOGL', name: 'Alphabet', type: 'stock', regex: /\b(\$?GOOGL?|Alphabet|Google)\b/i, color: '#dc2626', marketKey: 'GOOGL' },
  { id: 'META', symbol: 'META', name: 'Meta', type: 'stock', regex: /\b(\$?META|Facebook)\b/i, color: '#2563eb', marketKey: 'META' },

  // Major Indices
  { id: 'SPY', symbol: 'S&P 500', name: 'S&P 500', type: 'index', regex: /\b(S&P ?500|SPX|Wall Street)\b/i, color: '#3b82f6', marketKey: 'SPY' },
  { id: 'QQQ', symbol: 'NASDAQ', name: 'Nasdaq 100', type: 'index', regex: /\b(Nasdaq|QQQ)\b/i, color: '#8b5cf6', marketKey: 'QQQ' },
  { id: 'DIA', symbol: 'DOW', name: 'Dow Jones', type: 'index', regex: /\b(Dow Jones|DJIA)\b/i, color: '#059669', marketKey: 'DIA' },
];

export const DEFAULT_TOKENS: Record<string, TickerToken> = {
  'BTC-USD': { symbol: 'BTC', name: 'Bitcoin', price: 91420.50, open24h: 89500.00, change24h: 2.15, flash: null, formatted: '$91,420.50' },
  'ETH-USD': { symbol: 'ETH', name: 'Ethereum', price: 3340.20, open24h: 3280.00, change24h: 1.84, flash: null, formatted: '$3,340.20' },
  'SOL-USD': { symbol: 'SOL', name: 'Solana', price: 102.26, open24h: 102.17, change24h: 0.09, flash: null, formatted: '$102.26' },
  'DOGE-USD': { symbol: 'DOGE', name: 'Dogecoin', price: 0.0778, open24h: 0.0785, change24h: -0.87, flash: null, formatted: '$0.0778' },
  'XRP-USD': { symbol: 'XRP', name: 'XRP', price: 1.3020, open24h: 1.2890, change24h: 1.01, flash: null, formatted: '$1.3020' },
};

export const INITIAL_TAPE_QUOTES: TapeQuote[] = [
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
  { id: 'SILVER', ticker: 'XAG', name: 'Silver Spot', badge: 'AG', color: '#94a3b8', price: 53.95, change24h: -1.92, formatted: '$53.95', url: 'https://finance.yahoo.com/quote/SI=F' },
  { id: 'NVDA', ticker: 'NVDA', name: 'Nvidia Corp', badge: 'AI', color: '#16a34a', price: 210.96, change24h: -0.59, formatted: '$210.96', url: 'https://finance.yahoo.com/quote/NVDA' },
];

export const DEFAULT_COMMODITIES: Record<string, CommodityItem> = {
  OIL_CRUDE: { name: 'Crude Oil', ticker: 'CL=F', symbol: 'WTI', price: 103.27, open24h: 99.45, change24h: 3.82, flash: null, unit: 'USD/bbl', formatted: '$103.27' },
  OIL_BRENT: { name: 'Brent Crude', ticker: 'BZ=F', symbol: 'BRENT', price: 111.70, open24h: 108.65, change24h: 2.80, flash: null, unit: 'USD/bbl', formatted: '$111.70' },
  GOLD: { name: 'Gold Spot', ticker: 'GC=F', symbol: 'GOLD', price: 4007.90, open24h: 4060.20, change24h: -1.29, flash: null, unit: 'USD/oz', formatted: '$4,007.90' },
  SILVER: { name: 'Silver Spot', ticker: 'SI=F', symbol: 'SILVER', price: 53.95, open24h: 55.01, change24h: -1.92, flash: null, unit: 'USD/oz', formatted: '$53.95' },
  NAT_GAS: { name: 'Natural Gas', ticker: 'NG=F', symbol: 'NATGAS', price: 3.05, open24h: 3.16, change24h: -3.36, flash: null, unit: 'USD/MMBtu', formatted: '$3.05' },
  COPPER: { name: 'Copper Spot', ticker: 'HG=F', symbol: 'COPPER', price: 6.51, open24h: 6.40, change24h: 1.72, flash: null, unit: 'USD/lb', formatted: '$6.51' },
  URANIUM: { name: 'Uranium Yellowcake', ticker: 'UX=F', symbol: 'URANIUM', price: 82.50, open24h: 81.50, change24h: 1.23, flash: null, unit: 'USD/lb', formatted: '$82.50' },
};

export const DEFAULT_STOCKS: Record<string, CommodityItem> = {
  SPY: { name: 'S&P 500 ETF', ticker: 'SPY', symbol: 'SPY', price: 759.97, open24h: 763.95, change24h: -0.52, flash: null, unit: 'INDEX', formatted: '$759.97' },
  QQQ: { name: 'NASDAQ 100 ETF', ticker: 'QQQ', symbol: 'QQQ', price: 704.40, open24h: 704.50, change24h: -0.01, flash: null, unit: 'TECH', formatted: '$704.40' },
  DIA: { name: 'Dow Jones ETF', ticker: 'DIA', symbol: 'DIA', price: 521.37, open24h: 527.90, change24h: -1.24, flash: null, unit: 'INDEX', formatted: '$521.37' },
  IWM: { name: 'Russell 2000 ETF', ticker: 'IWM', symbol: 'IWM', price: 241.80, open24h: 240.78, change24h: 0.42, flash: null, unit: 'SMALL', formatted: '$241.80' },
  NVDA: { name: 'Nvidia Corp', ticker: 'NVDA', symbol: 'NVDA', price: 210.96, open24h: 212.21, change24h: -0.59, flash: null, unit: 'EQUITY', formatted: '$210.96' },
  AAPL: { name: 'Apple Inc', ticker: 'AAPL', symbol: 'AAPL', price: 347.73, open24h: 348.22, change24h: -0.14, flash: null, unit: 'EQUITY', formatted: '$347.73' },
  MSFT: { name: 'Microsoft Corp', ticker: 'MSFT', symbol: 'MSFT', price: 468.50, open24h: 465.05, change24h: 0.74, flash: null, unit: 'EQUITY', formatted: '$468.50' },
  AMZN: { name: 'Amazon.com Inc', ticker: 'AMZN', symbol: 'AMZN', price: 229.40, open24h: 226.85, change24h: 1.12, flash: null, unit: 'EQUITY', formatted: '$229.40' },
  GOOGL: { name: 'Alphabet Inc', ticker: 'GOOGL', symbol: 'GOOGL', price: 198.60, open24h: 197.55, change24h: 0.53, flash: null, unit: 'EQUITY', formatted: '$198.60' },
  TSLA: { name: 'Tesla Inc', ticker: 'TSLA', symbol: 'TSLA', price: 372.22, open24h: 374.58, change24h: -0.63, flash: null, unit: 'EQUITY', formatted: '$372.22' },
  META: { name: 'Meta Platforms', ticker: 'META', symbol: 'META', price: 618.30, open24h: 612.72, change24h: 0.91, flash: null, unit: 'EQUITY', formatted: '$618.30' },
};
