'use client';

import { useState } from 'react';
import { useAtomValue } from 'jotai';
import { marketPriceFamily } from '@/atoms/priceAtoms';
import { useHydratePrices } from '@/hooks/useHydratePrices';
import { useWebSocket } from '@/hooks/useWebSocket';
import { ConnectionBadge } from './ConnectionBadge';
import { MarketRow } from './MarketRow';
import { PriceChart } from './PriceChart';
import { TradeSlip } from './TradeSlip';
import { formatVolume } from '@/lib/utils';
import type { Market, PolyEvent } from '@/lib/types';

interface Props {
  event: PolyEvent;
  relatedEvents?: PolyEvent[];
}

function MobileTradeBar({
  market,
  outcomeIndex,
  onDismiss,
}: {
  market: Market;
  outcomeIndex: number;
  onDismiss: () => void;
}) {
  const [open, setOpen] = useState(false);
  const prices = useAtomValue(marketPriceFamily(market.id));

  const price = prices[outcomeIndex] ?? 0.5;
  const isYes = outcomeIndex === 0;
  const colorClass = isYes ? 'text-pm-green' : 'text-pm-red';
  const outcomeLabel = market.outcomes[outcomeIndex] ?? (isYes ? 'Yes' : 'No');

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />
      )}

      {open && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-pm-bg border-t border-pm-border rounded-t-2xl p-4 pb-[env(safe-area-inset-bottom,16px)] lg:hidden max-h-[85vh] overflow-y-auto">
          <div className="w-10 h-1 bg-pm-border rounded-full mx-auto mb-4" />
          <TradeSlip market={market} />
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-30 bg-pm-bg/95 backdrop-blur-sm border-t border-pm-border px-4 py-3 pb-[env(safe-area-inset-bottom,12px)] lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={onDismiss}
            className="text-pm-muted hover:text-pm-text p-1 -ml-1 transition-colors cursor-pointer"
            aria-label="Dismiss trade bar"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <div className="flex items-center gap-3 min-w-0">
            <span className={`text-lg font-bold tabular-nums ${colorClass}`}>
              {Math.round(price * 100)}¢
            </span>
            <span className="text-xs text-pm-muted truncate">
              {outcomeLabel}
            </span>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="bg-pm-blue hover:bg-pm-blue/90 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer shrink-0"
          >
            Trade
          </button>
        </div>
      </div>
    </>
  );
}

export function EventDetailClient({ event, relatedEvents }: Props) {
  useHydratePrices(event.markets);
  useWebSocket(event.markets.map((m) => m.id));

  const [selectedMarketId, setSelectedMarketId] = useState<string | null>(
    event.markets[0]?.id ?? null,
  );
  const [selectedOutcomeIndex, setSelectedOutcomeIndex] = useState(0);
  const [tradeBarVisible, setTradeBarVisible] = useState(true);

  const selectedMarket =
    event.markets.find((m) => m.id === selectedMarketId) ?? event.markets[0];

  const handleSelectOutcome = (market: Market, outcomeIndex: number) => {
    setSelectedMarketId(market.id);
    setSelectedOutcomeIndex(outcomeIndex);
    setTradeBarVisible(true);
  };

  return (
    <>
      <div className={`flex flex-col lg:flex-row gap-6 lg:pb-0 ${tradeBarVisible ? 'pb-20' : 'pb-4'}`}>
        {/* Main content */}
        <div className="flex-1 flex flex-col gap-6 min-w-0">
          {/* Event header */}
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-lg sm:text-xl font-bold text-white leading-snug">
                {event.title}
              </h1>
              <ConnectionBadge />
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3 text-sm text-pm-muted">
              <span className="bg-pm-border/60 px-2.5 py-0.5 rounded-full text-xs">
                {event.category}
              </span>
              <span>
                Vol: <span className="text-pm-text">{formatVolume(event.volume)}</span>
              </span>
              {event.liquidity > 0 && (
                <span>
                  Liq: <span className="text-pm-text">{formatVolume(event.liquidity)}</span>
                </span>
              )}
              {event.endDate && (
                <span>
                  Ends:{' '}
                  <span className="text-pm-text">
                    {new Date(event.endDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </span>
              )}
            </div>
          </div>

          {/* Price chart */}
          {selectedMarket && (
            <PriceChart
              marketId={selectedMarket.id}
              basePrice={selectedMarket.outcomePrices[0] ?? 0.5}
              height={160}
            />
          )}

          {/* Markets */}
          <div className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold text-pm-muted uppercase tracking-wider">
              Outcomes ({event.markets.length})
            </h2>
            {event.markets.map((market) => (
              <MarketRow
                key={market.id}
                market={market}
                selected={market.id === selectedMarketId}
                selectedOutcome={market.id === selectedMarketId ? selectedOutcomeIndex : undefined}
                onSelectOutcome={handleSelectOutcome}
              />
            ))}
          </div>

          {/* Related events */}
          {relatedEvents && relatedEvents.length > 0 && (
            <div className="flex flex-col gap-3 pt-4 border-t border-pm-border">
              <h2 className="text-xs font-semibold text-pm-muted uppercase tracking-wider">
                Related Markets
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {relatedEvents.slice(0, 4).map((re) => (
                  <a
                    key={re.id}
                    href={`/event/${re.id}`}
                    className="bg-pm-card border border-pm-border rounded-xl p-4 hover:bg-pm-card-hover hover:border-pm-text/20 transition-all"
                  >
                    <span className="text-[10px] text-pm-muted uppercase tracking-wide">
                      {re.category}
                    </span>
                    <p className="text-sm font-medium text-pm-text leading-snug line-clamp-2 mt-1">
                      {re.title}
                    </p>
                    <p className="text-xs text-pm-muted mt-2">
                      Vol: <span className="text-pm-text">{formatVolume(re.volume)}</span>
                    </p>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Trade slip sidebar - desktop only */}
        {selectedMarket && (
          <div className="hidden lg:block w-80 shrink-0">
            <TradeSlip market={selectedMarket} />
          </div>
        )}
      </div>

      {/* Mobile trade bar */}
      {selectedMarket && tradeBarVisible && (
        <MobileTradeBar
          market={selectedMarket}
          outcomeIndex={selectedOutcomeIndex}
          onDismiss={() => setTradeBarVisible(false)}
        />
      )}
    </>
  );
}
