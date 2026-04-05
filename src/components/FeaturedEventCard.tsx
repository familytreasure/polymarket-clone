'use client';

import Link from 'next/link';
import { useAtomValue } from 'jotai';
import { marketPriceFamily } from '@/atoms/priceAtoms';
import { usePriceAnimation } from '@/hooks/usePriceAnimation';
import { ProbabilityBar } from './ProbabilityBar';
import { formatVolume } from '@/lib/utils';
import type { PolyEvent } from '@/lib/types';

interface Props {
  event: PolyEvent;
}

export function FeaturedEventCard({ event }: Props) {
  const primaryMarket = event.markets[0];
  const prices = useAtomValue(marketPriceFamily(primaryMarket?.id ?? ''));
  const flashClass = usePriceAnimation(primaryMarket?.id ?? '');

  if (!primaryMarket) return null;

  const yesPrice = prices[0] ?? primaryMarket.outcomePrices[0] ?? 0.5;
  const noPrice = prices[1] ?? primaryMarket.outcomePrices[1] ?? 0.5;
  const isBullish = yesPrice >= 0.5;

  return (
    <Link
      href={`/event/${event.id}`}
      className="block rounded-2xl border border-pm-border bg-gradient-to-br from-pm-card to-pm-bg hover:border-pm-blue/40 transition-all duration-300 overflow-hidden group"
      style={{ boxShadow: '0 0 40px rgba(46,92,255,0.06)' }}
    >
      <div className="p-4 sm:p-6 flex flex-col gap-4 sm:gap-5">
        {/* Category + date row */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-pm-blue bg-pm-blue/10 border border-pm-blue/20 px-2.5 py-0.5 rounded-full uppercase tracking-wide">
            Featured
          </span>
          {event.endDate && (
            <span className="text-xs text-pm-muted">
              Ends{' '}
              {new Date(event.endDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          )}
        </div>

        {/* Title */}
        <h2 className="text-lg font-bold text-white leading-snug group-hover:text-pm-blue/90 transition-colors line-clamp-2">
          {event.title}
        </h2>

        {/* Big probability display */}
        <div className={`flex items-center gap-3 sm:gap-6 rounded-xl bg-pm-bg/60 px-3 sm:px-4 py-3 border border-pm-border ${flashClass}`}>
          <div className="flex flex-col items-center gap-0.5 shrink-0">
            <span className={`text-2xl sm:text-3xl font-bold tabular-nums ${isBullish ? 'text-pm-green' : 'text-pm-red'}`}>
              {Math.round(yesPrice * 100)}¢
            </span>
            <span className="text-[10px] sm:text-xs text-pm-muted">{primaryMarket.outcomes[0] ?? 'Yes'}</span>
          </div>
          <div className="flex-1 min-w-0">
            <ProbabilityBar prices={prices} outcomes={primaryMarket.outcomes} />
          </div>
          <div className="flex flex-col items-center gap-0.5 shrink-0">
            <span className={`text-2xl sm:text-3xl font-bold tabular-nums ${!isBullish ? 'text-pm-green' : 'text-pm-red'}`}>
              {Math.round(noPrice * 100)}¢
            </span>
            <span className="text-[10px] sm:text-xs text-pm-muted">{primaryMarket.outcomes[1] ?? 'No'}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-sm text-pm-muted">
          <span>
            Vol:{' '}
            <span className="text-pm-text font-medium">{formatVolume(event.volume)}</span>
          </span>
          {event.liquidity > 0 && (
            <span>
              Liq:{' '}
              <span className="text-pm-text font-medium">{formatVolume(event.liquidity)}</span>
            </span>
          )}
          {event.markets.length > 1 && (
            <span className="text-pm-blue">
              +{event.markets.length - 1} more outcomes
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
