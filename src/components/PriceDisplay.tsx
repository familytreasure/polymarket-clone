'use client';

import { useAtomValue } from 'jotai';
import { marketPriceFamily } from '@/atoms/priceAtoms';
import { usePriceAnimation } from '@/hooks/usePriceAnimation';

interface Props {
  marketId: string;
  outcomeIndex?: number;
  className?: string;
  showCents?: boolean;
}

export function PriceDisplay({
  marketId,
  outcomeIndex = 0,
  className = '',
  showCents,
}: Props) {
  const prices = useAtomValue(marketPriceFamily(marketId));
  const flashClass = usePriceAnimation(marketId);
  const price = prices[outcomeIndex] ?? 0.5;

  const formatted = showCents
    ? `${(price * 100).toFixed(0)}¢`
    : `${Math.round(price * 100)}%`;

  return (
    <span
      className={`tabular-nums rounded px-1 transition-colors duration-150 ${flashClass} ${className}`}
    >
      {formatted}
    </span>
  );
}
