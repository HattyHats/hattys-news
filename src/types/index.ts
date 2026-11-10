export type AppMode = 'crypto' | 'world';

export interface Article {
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

export interface FearGreedData {
  value: string;
  value_classification: string;
  timestamp: string;
  previous_value?: string;
}

export interface FeedConfig {
  n: string;
  u: string;
  defaultCat: string;
}

export interface DetectedAsset {
  id: string;
  symbol: string;
  name: string;
  type: 'crypto' | 'commodity' | 'stock' | 'index';
  color: string;
  price?: number;
  change24h?: number;
  formatted?: string;
}

export interface AssetDefinition {
  id: string;
  symbol: string;
  name: string;
  type: 'crypto' | 'commodity' | 'stock' | 'index';
  regex: RegExp;
  color: string;
  marketKey?: string;
}

export interface DashboardSettings {
  cryptoCategories: string[];
  cryptoHidden: string[];
  worldCategories: string[];
  worldHidden: string[];
  showAssetTags: boolean;
  cardDensity: 'comfortable' | 'compact';
}

export interface TickerToken {
  symbol: string;
  name: string;
  price: number;
  open24h: number;
  change24h: number;
  flash: 'up' | 'down' | null;
  formatted: string;
}

export interface CommodityItem {
  name: string;
  ticker: string;
  symbol: string;
  price: number;
  open24h: number;
  change24h: number;
  flash: 'up' | 'down' | null;
  unit: string;
  formatted: string;
}

export interface TapeQuote {
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

export interface CatalystEvent {
  id: string;
  title: string;
  category: 'macro' | 'crypto' | 'earnings' | 'geopolitics';
  categoryLabel: string;
  date: Date;
  impact: 'HIGH' | 'MEDIUM';
  impactNote: string;
  consensus?: string;
}

export interface CategoryConfig {
  id: string;
  label: string;
  icon: string;
  badgeClass: string;
}
