'use client';

import { memo } from 'react';
import Link from 'next/link';
import { useAtomValue } from 'jotai';
import { marketPriceFamily } from '@/atoms/priceAtoms';
import { usePriceAnimation } from '@/hooks/usePriceAnimation';
import { ProbabilityBar } from './ProbabilityBar';
import { formatVolume } from '@/lib/utils';
import type { PolyEvent, Market } from '@/lib/types';

interface OutcomeRowProps {
  market: Market;
}

const OutcomeRow = memo(function OutcomeRow({ market }: OutcomeRowProps) {
  const prices = useAtomValue(marketPriceFamily(market.id));
  const flashClass = usePriceAnimation(market.id);
  const yesPrice = prices[0] ?? 0.5;
  const noPrice = prices[1] ?? 0.5;

  return (
    <div className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-pm-bg/40 ${flashClass}`}>
      <span className="text-xs text-pm-text truncate flex-1 min-w-0">
        {market.question}
      </span>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-xs font-semibold text-pm-green tabular-nums">
          {Math.round(yesPrice * 100)}%
        </span>
        <span className="text-[10px] text-pm-muted">Yes</span>
        <span className="text-[10px] text-pm-muted mx-0.5">/</span>
        <span className="text-xs font-semibold text-pm-red tabular-nums">
          {Math.round(noPrice * 100)}%
        </span>
        <span className="text-[10px] text-pm-muted">No</span>
      </div>
    </div>
  );
});

interface Props {
  event: PolyEvent;
}

function isEventLive(event: PolyEvent): boolean {
  if (!event.endDate) return false;
  const end = new Date(event.endDate).getTime();
  const now = Date.now();
  return now < end && now > end - 86_400_000 * 2;
}

function EventCardInner({ event }: Props) {
  const primaryMarket = event.markets[0];
  const prices = useAtomValue(marketPriceFamily(primaryMarket?.id ?? ''));
  const flashClass = usePriceAnimation(primaryMarket?.id ?? '');
  const hasMultipleMarkets = event.markets.length > 1;
  const live = isEventLive(event);

  if (!primaryMarket) return null;

  const yesPrice = prices[0] ?? primaryMarket.outcomePrices[0] ?? 0.5;
  const isBullish = yesPrice >= 0.5;

  return (
    <Link
      href={`/event/${event.id}`}
      className="block rounded-xl border border-pm-border bg-pm-card hover:bg-pm-card-hover hover:border-pm-text/20 transition-all duration-200 overflow-hidden group"
    >
      <div className="p-5 flex flex-col gap-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {live && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-pm-red bg-pm-red/10 border border-pm-red/20 px-1.5 py-0.5 rounded uppercase tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-pm-red animate-pulse inline-block" />
                Live
              </span>
            )}
            <span className="text-xs text-pm-muted bg-pm-border/60 px-2 py-0.5 rounded-full">
              {event.category}
            </span>
          </div>
          {event.endDate && (
            <span className="text-xs text-pm-muted whitespace-nowrap">
              {new Date(event.endDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-pm-text leading-snug line-clamp-2 group-hover:text-white transition-colors">
          {event.title}
        </h3>

        {hasMultipleMarkets ? (
          <>
            {/* Multi-outcome rows */}
            <div className="flex flex-col gap-1.5">
              {event.markets.slice(0, 3).map((market) => (
                <OutcomeRow key={market.id} market={market} />
              ))}
              {event.markets.length > 3 && (
                <span className="text-xs text-pm-blue pl-2.5">
                  +{event.markets.length - 3} more outcomes
                </span>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Single market: probability bar */}
            <ProbabilityBar prices={prices} outcomes={primaryMarket.outcomes} />
            {/* Price + volume */}
            <div className="flex items-center justify-between pt-1">
              <div
                className={`flex items-center gap-2 text-sm font-semibold rounded px-1.5 py-0.5 transition-colors ${flashClass}`}
              >
                <span className={isBullish ? 'text-pm-green' : 'text-pm-red'}>
                  {Math.round(yesPrice * 100)}¢
                </span>
                <span className="text-pm-muted text-xs font-normal">
                  {primaryMarket.outcomes[0] ?? 'Yes'}
                </span>
              </div>
            </div>
          </>
        )}

        {/* Volume - always shown */}
        <div className="flex items-center justify-between text-xs text-pm-muted pt-1 border-t border-pm-border/50">
          <span>
            Vol: <span className="text-pm-text">{formatVolume(event.volume)}</span>
          </span>
          {hasMultipleMarkets && (
            <span>{event.markets.length} markets</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export const EventCard = memo(EventCardInner);
