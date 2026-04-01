import type { EventRaw, MarketRaw, Market, PolyEvent } from './types';

/**
 * The Gamma API is inconsistent: some fields arrive as proper arrays,
 * others as stringified JSON strings. Handle both formats defensively.
 */
function toArray<T>(value: unknown, fallback: T[]): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed as T[];
    } catch {
      // ignore
    }
  }
  return fallback;
}

export function parseMarket(raw: MarketRaw): Market {
  const outcomes = toArray<string>(raw.outcomes, ['Yes', 'No']);

  // outcomePrices: may be string[] like ["0.65","0.35"] or stringified JSON
  const rawPrices = toArray<string | number>(raw.outcomePrices, []);
  const outcomePrices = rawPrices.map(Number).filter((n) => !isNaN(n));

  const prices: number[] =
    outcomePrices.length >= 2
      ? outcomePrices
      : outcomePrices.length === 1
        ? [outcomePrices[0], 1 - outcomePrices[0]]
        : [0.5, 0.5];

  const clobTokenIds = toArray<string>(raw.clobTokenIds, []);

  return {
    id: raw.id,
    conditionId: raw.conditionId,
    question: raw.question,
    outcomes,
    outcomePrices: prices,
    clobTokenIds,
    bestAsk: raw.bestAsk ?? 0,
    volume: raw.volumeNum ?? (Number(raw.volume) || 0),
    liquidity: raw.liquidity ?? 0,
    negRisk: raw.negRisk ?? false,
    slug: raw.slug,
    image: raw.image ?? raw.icon,
    lastTradePrice: raw.lastTradePrice,
    spread: raw.spread,
    oneDayPriceChange: raw.oneDayPriceChange,
  };
}

export function parseEvent(raw: EventRaw): PolyEvent {
  const category = raw.tags?.[0]?.label ?? 'General';

  const volume =
    raw.volume ??
    (raw.markets ?? []).reduce((sum, m) => sum + (Number(m.volume) || 0), 0);

  return {
    id: raw.id,
    title: raw.title,
    slug: raw.slug,
    category,
    tags: raw.tags ?? [],
    startDate: raw.startDate ?? '',
    endDate: raw.endDate ?? '',
    volume,
    liquidity: raw.liquidity ?? raw.liquidityClob ?? 0,
    image: raw.image ?? raw.icon,
    markets: (raw.markets ?? []).map(parseMarket),
  };
}
