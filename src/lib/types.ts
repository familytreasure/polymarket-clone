export interface MarketRaw {
  id: string;
  conditionId: string;
  question: string;
  outcomes: string[];          // actual array: ["Yes", "No"]
  outcomePrices: string[];     // actual array of strings: ["0.65", "0.35"]
  clobTokenIds: string[];      // actual array of token ID strings
  bestAsk: number;
  volume: string;              // string: "17976157.529867"
  volumeNum?: number;
  liquidity: number;
  negRisk: boolean;
  slug?: string;
  image?: string;
  icon?: string;
  lastTradePrice?: number;
  spread?: number;
  oneDayPriceChange?: number;
  active?: boolean;
  closed?: boolean;
  groupItemTitle?: string;
}

export interface Market {
  id: string;
  conditionId: string;
  question: string;
  outcomes: string[];
  outcomePrices: number[];     // parsed to numbers
  clobTokenIds: string[];
  bestAsk: number;
  volume: number;
  liquidity: number;
  negRisk: boolean;
  slug?: string;
  image?: string;
  lastTradePrice?: number;
  spread?: number;
  oneDayPriceChange?: number;
}

export interface Tag {
  id: string;
  slug: string;
  label: string;
}

export interface EventRaw {
  id: string;
  title: string;
  slug: string;
  tags: Tag[];
  startDate?: string;
  endDate?: string;
  volume?: number;
  liquidity?: number;
  liquidityClob?: number;
  image?: string;
  icon?: string;
  active?: boolean;
  closed?: boolean;
  volume24hr?: number;
  openInterest?: number;
  markets: MarketRaw[];
}

export interface PolyEvent {
  id: string;
  title: string;
  slug: string;
  category: string;
  tags: Tag[];
  startDate: string;
  endDate: string;
  volume: number;
  liquidity: number;
  image?: string;
  markets: Market[];
}

export interface PriceUpdate {
  market_id: string;
  price: number;
  timestamp: number;
}
