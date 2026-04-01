import { atom } from 'jotai';
import { atomFamily } from 'jotai-family';

// Per-market current prices: [yesPrice, noPrice]
export const marketPriceFamily = atomFamily(
  (_marketId: string) => atom<number[]>([0.5, 0.5])
);

// Per-market previous prices (for detecting change direction)
export const marketPrevPriceFamily = atomFamily(
  (_marketId: string) => atom<number[]>([0.5, 0.5])
);

// Derived: direction of last price move
export const priceDirectionFamily = atomFamily(
  (marketId: string) =>
    atom<'up' | 'down' | 'none'>((get) => {
      const current = get(marketPriceFamily(marketId));
      const prev = get(marketPrevPriceFamily(marketId));
      if (current[0] > prev[0] + 0.0001) return 'up';
      if (current[0] < prev[0] - 0.0001) return 'down';
      return 'none';
    })
);
