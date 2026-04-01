'use client';

import { useState } from 'react';
import { useAtomValue } from 'jotai';
import { marketPriceFamily } from '@/atoms/priceAtoms';
import { usePriceAnimation } from '@/hooks/usePriceAnimation';
import type { Market } from '@/lib/types';

interface Props {
  market: Market;
}

const QUICK_AMOUNTS = [1, 5, 10, 100] as const;

export function TradeSlip({ market }: Props) {
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [selectedOutcome, setSelectedOutcome] = useState(0);
  const [amount, setAmount] = useState(0);
  const prices = useAtomValue(marketPriceFamily(market.id));
  const flashClass = usePriceAnimation(market.id);

  const yesPrice = prices[0] ?? 0.5;
  const noPrice = prices[1] ?? 0.5;
  const selectedPrice = selectedOutcome === 0 ? yesPrice : noPrice;

  return (
    <div className="bg-pm-card border border-pm-border rounded-xl p-5 flex flex-col gap-4 sticky top-20">
      {/* Market question */}
      <p className="text-sm font-medium text-pm-text leading-snug line-clamp-2">
        {market.question}
      </p>

      {/* Buy / Sell tabs */}
      <div className="flex gap-1 bg-pm-bg rounded-lg p-1">
        <button
          onClick={() => setSide('buy')}
          className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all cursor-pointer ${
            side === 'buy'
              ? 'bg-pm-card text-white shadow-sm'
              : 'text-pm-muted hover:text-pm-text'
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => setSide('sell')}
          className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all cursor-pointer ${
            side === 'sell'
              ? 'bg-pm-card text-white shadow-sm'
              : 'text-pm-muted hover:text-pm-text'
          }`}
        >
          Sell
        </button>
      </div>

      {/* Outcome selector */}
      <div className={`flex gap-2 ${flashClass}`}>
        {market.outcomes.slice(0, 2).map((outcome, i) => {
          const price = i === 0 ? yesPrice : noPrice;
          const isSelected = selectedOutcome === i;
          return (
            <button
              key={outcome}
              onClick={() => setSelectedOutcome(i)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer border-2 ${
                isSelected
                  ? i === 0
                    ? 'border-pm-green bg-pm-green/10 text-pm-green'
                    : 'border-pm-red bg-pm-red/10 text-pm-red'
                  : 'border-pm-border bg-pm-bg text-pm-muted hover:border-pm-text/30'
              }`}
            >
              {outcome} {Math.round(price * 100)}¢
            </button>
          );
        })}
      </div>

      {/* Amount */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm text-pm-muted">Amount</label>
          <span className="text-2xl font-bold text-white tabular-nums">
            ${amount}
          </span>
        </div>
        <div className="flex gap-2">
          {QUICK_AMOUNTS.map((qa) => (
            <button
              key={qa}
              onClick={() => setAmount((prev) => prev + qa)}
              className="flex-1 py-1.5 text-xs font-medium text-pm-muted bg-pm-bg border border-pm-border rounded-lg hover:text-pm-text hover:border-pm-text/30 transition-colors cursor-pointer"
            >
              +${qa}
            </button>
          ))}
          <button
            onClick={() => setAmount(1000)}
            className="px-3 py-1.5 text-xs font-medium text-pm-muted bg-pm-bg border border-pm-border rounded-lg hover:text-pm-text hover:border-pm-text/30 transition-colors cursor-pointer"
          >
            Max
          </button>
        </div>
      </div>

      {/* Trade button */}
      <button
        className={`w-full py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
          amount > 0
            ? 'bg-pm-blue hover:bg-pm-blue/90 text-white shadow-lg shadow-pm-blue/20'
            : 'bg-pm-border text-pm-muted cursor-not-allowed'
        }`}
        disabled={amount === 0}
      >
        Trade
      </button>

      <p className="text-[10px] text-pm-muted text-center">
        By trading, you agree to the{' '}
        <span className="text-pm-blue cursor-pointer hover:underline">Terms of Use</span>.
      </p>
    </div>
  );
}
