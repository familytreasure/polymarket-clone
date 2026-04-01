'use client';

import { useState, useEffect } from 'react';
import { useAtomValue } from 'jotai';
import { priceDirectionFamily } from '@/atoms/priceAtoms';

export function usePriceAnimation(marketId: string): string {
  const direction = useAtomValue(priceDirectionFamily(marketId));
  const [flashClass, setFlashClass] = useState('');

  useEffect(() => {
    if (direction === 'none') return;
    const cls = direction === 'up' ? 'flash-green' : 'flash-red';
    setFlashClass(cls);
    const timer = setTimeout(() => setFlashClass(''), 700);
    return () => clearTimeout(timer);
  }, [direction]);

  return flashClass;
}
