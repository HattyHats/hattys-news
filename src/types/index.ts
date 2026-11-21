export type AppMode = 'crypto' | 'world';
export type ViewLayoutMode = 'grid' | 'wire';

export type WorldRegionId =
  | 'all'
  | 'north-america'
  | 'europe'
  | 'middle-east'
  | 'asia-pacific'
  | 'africa'
  | 'latin-america'
  | 'global-wires'
  | 'blindspot';

export interface WorldRegionConfig {
  id: WorldRegionId;
  label: string;
  shortLabel: string;
  icon: string;
}

export interface StoryImpact {
  type: 'BULLISH' | 'BEARISH' | 'POLICY' | 'BREAKING';
  label: string;
  badgeClass: string;
}

export interface OutletMeta {
  name: string;
  flag: string;
  region: string;
  worldRegion?: WorldRegionId;
}

export interface Article {
  id: string;
  title: string;
  link: string;
  img: string;
  date: Date;
  src: string;
  primaryCat: string;
  matchedCategories: string[];
  regions?: WorldRegionId[];
  snippet?: string;
  fullText?: string;
  readingMinutes?: number;
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
  region?: WorldRegionId;
  tier?: 'core' | 'extended';
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

export interface TrendingTopic {
  term: string;
  label: string;
  count: number;
  pubCount: number;
}

export interface DashboardSettings {
  cryptoCategories: string[];
  cryptoHidden: string[];
  worldCategories: string[];
  worldHidden: string[];
  showAssetTags: boolean;
  cardDensity: 'comfortable' | 'compact';
  pinnedSources: string[];
  mutedSources: string[];
  dimReadArticles?: boolean;
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
