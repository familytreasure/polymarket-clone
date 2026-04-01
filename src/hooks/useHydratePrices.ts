'use client';

import { useEffect, useRef } from 'react';
import { useStore } from 'jotai';
import { marketPriceFamily, marketPrevPriceFamily } from '@/atoms/priceAtoms';
import type { Market } from '@/lib/types';

export function useHydratePrices(markets: Market[]) {
  const store = useStore();
  const hydrated = useRef(false);

  useEffect(() => {
    if (hydrated.current) return;
    markets.forEach((m) => {
      const prices =
        m.outcomePrices.length >= 2 ? m.outcomePrices : [0.5, 0.5];
      store.set(marketPriceFamily(m.id), prices);
      store.set(marketPrevPriceFamily(m.id), prices);
    });
    hydrated.current = true;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
