'use client';

import { memo } from 'react';
import { useAtomValue } from 'jotai';
import { marketPriceFamily } from '@/atoms/priceAtoms';
import { PriceDisplay } from './PriceDisplay';
import { ProbabilityBar } from './ProbabilityBar';
import { formatVolume } from '@/lib/utils';
import type { Market } from '@/lib/types';

interface Props {
  market: Market;
}

function MarketRowInner({ market }: Props) {
  const prices = useAtomValue(marketPriceFamily(market.id));
  const yesPrice = prices[0] ?? 0.5;
  const noPrice = prices[1] ?? 0.5;

  return (
    <div className="border border-pm-border rounded-xl p-5 flex flex-col gap-4 bg-pm-card hover:bg-pm-card-hover transition-colors">
      {/* Question */}
      <p className="text-sm font-medium text-pm-text leading-snug">
        {market.question}
      </p>

      {/* Probability bar */}
      <ProbabilityBar prices={prices} outcomes={market.outcomes} />

      {/* Outcome buttons */}
      <div className="flex gap-3">
        {market.outcomes.map((outcome, i) => {
          const price = i === 0 ? yesPrice : noPrice;
          const isYes = i === 0;
          return (
            <button
              key={outcome}
              className={`
                flex-1 flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-semibold
                border transition-all duration-200 cursor-default
                ${
                  isYes
                    ? 'border-pm-green/30 bg-pm-green/10 text-pm-green hover:bg-pm-green/20'
                    : 'border-pm-red/30 bg-pm-red/10 text-pm-red hover:bg-pm-red/20'
                }
              `}
            >
              <span>{outcome}</span>
              <PriceDisplay
                marketId={market.id}
                outcomeIndex={i}
                showCents
                className={`text-base ${isYes ? 'text-pm-green' : 'text-pm-red'}`}
              />
            </button>
          );
        })}
      </div>

      {/* Stats row */}
      <div className="flex flex-wrap gap-4 text-xs text-pm-muted pt-1 border-t border-pm-border">
        <span>
          Vol: <span className="text-pm-text">{formatVolume(market.volume)}</span>
        </span>
        <span>
          Liq: <span className="text-pm-text">{formatVolume(market.liquidity)}</span>
        </span>
        {market.spread != null && market.spread > 0 && (
          <span>
            Spread:{' '}
            <span className="text-pm-text">
              {Math.round(market.spread * 100)}¢
            </span>
          </span>
        )}
      </div>
    </div>
  );
}

export const MarketRow = memo(MarketRowInner);
