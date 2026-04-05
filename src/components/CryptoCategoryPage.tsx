'use client';

import { useMemo, useState } from 'react';
import { useAtomValue } from 'jotai';
import { searchQueryAtom } from '@/atoms/filterAtoms';
import { useHydratePrices } from '@/hooks/useHydratePrices';
import { useWebSocket } from '@/hooks/useWebSocket';
import { FeaturedEventCard } from './FeaturedEventCard';
import { EventCard } from './EventCard';
import { ConnectionBadge } from './ConnectionBadge';
import { Sidebar } from './Sidebar';
import type { SidebarSection } from './Sidebar';
import { formatVolume } from '@/lib/utils';
import type { PolyEvent } from '@/lib/types';

const TIME_FILTERS = [
  { label: '5 Min', key: '5min' },
  { label: '15 Min', key: '15min' },
  { label: '1 Hour', key: '1hr' },
  { label: '4 Hours', key: '4hr' },
  { label: 'Daily', key: 'daily' },
  { label: 'Weekly', key: 'weekly' },
  { label: 'Monthly', key: 'monthly' },
  { label: 'Yearly', key: 'yearly' },
] as const;

const ASSET_ITEMS = [
  { label: 'All', key: 'all', icon: '📊' },
  { label: 'Bitcoin', key: 'btc', icon: '₿' },
  { label: 'Ethereum', key: 'eth', icon: 'Ξ' },
  { label: 'Solana', key: 'sol', icon: '◎' },
  { label: 'XRP', key: 'xrp', icon: '✕' },
  { label: 'Dogecoin', key: 'doge', icon: '🐕' },
  { label: 'BNB', key: 'bnb', icon: '🔶' },
] as const;

const SUBTABS = [
  { label: 'All', key: 'all' },
  { label: 'Up / Down', key: 'updown' },
  { label: 'Above / Below', key: 'abovebelow' },
  { label: 'Price Range', key: 'pricerange' },
  { label: 'Hit Price', key: 'hitprice' },
] as const;

type SubtabKey = (typeof SUBTABS)[number]['key'];

const ASSET_KEYWORDS: Record<string, string[]> = {
  btc: ['bitcoin', 'btc', 'microstrategy'],
  eth: ['ethereum', 'eth'],
  sol: ['solana', 'sol'],
  xrp: ['xrp', 'ripple'],
  doge: ['doge', 'dogecoin'],
  bnb: ['bnb', 'binance'],
};

const SUBTAB_PATTERNS: Record<string, RegExp> = {
  updown: /\b(up|down|higher|lower)\b/i,
  abovebelow: /\b(above|below|over|under)\b/i,
  pricerange: /\b(range|between|price on|price at)\b/i,
  hitprice: /\b(hit|reach|break|cross)\b/i,
};

function matchesAsset(event: PolyEvent, asset: string): boolean {
  if (asset === 'all') return true;
  const keywords = ASSET_KEYWORDS[asset] ?? [];
  const haystack = (event.title + ' ' + event.tags.map((t) => t.label).join(' ')).toLowerCase();
  return keywords.some((kw) => haystack.includes(kw));
}

function matchesSubtab(event: PolyEvent, tab: SubtabKey): boolean {
  if (tab === 'all') return true;
  const pattern = SUBTAB_PATTERNS[tab];
  if (!pattern) return true;
  const haystack = event.title + ' ' + event.markets.map((m) => m.question).join(' ');
  return pattern.test(haystack);
}

interface Props {
  events: PolyEvent[];
}

export function CryptoCategoryPage({ events }: Props) {
  const [activeAsset, setActiveAsset] = useState<string>('all');
  const [activeSubtab, setActiveSubtab] = useState<SubtabKey>('all');
  const searchQuery = useAtomValue(searchQueryAtom);

  const allMarkets = useMemo(() => events.flatMap((e) => e.markets), [events]);
  const allMarketIds = useMemo(() => allMarkets.map((m) => m.id), [allMarkets]);

  useHydratePrices(allMarkets);
  useWebSocket(allMarketIds);

  const assetCounts = useMemo(() => {
    const counts: Record<string, number> = { all: events.length };
    ASSET_ITEMS.forEach(({ key }) => {
      if (key !== 'all') {
        counts[key] = events.filter((e) => matchesAsset(e, key)).length;
      }
    });
    return counts;
  }, [events]);

  const sidebarSections: SidebarSection[] = useMemo(() => [
    {
      items: ASSET_ITEMS
        .filter(({ key }) => key === 'all' || (assetCounts[key] ?? 0) > 0)
        .map(({ key, label, icon }) => ({
          key,
          label,
          icon,
          count: assetCounts[key] ?? 0,
        })),
    },
  ], [assetCounts]);

  const filtered = useMemo(() => {
    let result = events
      .filter((e) => matchesAsset(e, activeAsset))
      .filter((e) => matchesSubtab(e, activeSubtab));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((e) => {
        const haystack = `${e.title} ${e.category} ${e.tags.map(t => t.label).join(' ')} ${e.markets.map(m => m.question).join(' ')}`.toLowerCase();
        return haystack.includes(q);
      });
    }
    return result;
  }, [events, activeAsset, activeSubtab, searchQuery]);

  const featured = filtered[0] ?? null;
  const rest = filtered.slice(1);

  const totalVolume = useMemo(
    () => events.reduce((sum, e) => sum + (Number(e.volume) || 0), 0),
    [events]
  );

  const totalMarkets = useMemo(
    () => events.reduce((sum, e) => sum + e.markets.length, 0),
    [events]
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Sidebar */}
      <Sidebar sections={sidebarSections} activeKey={activeAsset} onSelect={setActiveAsset} />

      {/* Main content */}
      <div className="flex-1 flex flex-col gap-6 min-w-0">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">₿</span>
              <h1 className="text-2xl font-bold text-white">Crypto</h1>
            </div>
            <p className="text-pm-muted text-sm">
              Prediction markets for digital assets
            </p>
          </div>
          <ConnectionBadge />
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-pm-card border border-pm-border rounded-xl px-4 py-3">
            <p className="text-xs text-pm-muted mb-1">Total Volume</p>
            <p className="text-lg font-bold text-white">{formatVolume(totalVolume)}</p>
          </div>
          <div className="bg-pm-card border border-pm-border rounded-xl px-4 py-3">
            <p className="text-xs text-pm-muted mb-1">Open Markets</p>
            <p className="text-lg font-bold text-white">{totalMarkets}</p>
          </div>
          <div className="bg-pm-card border border-pm-border rounded-xl px-4 py-3 hidden sm:block">
            <p className="text-xs text-pm-muted mb-1">Events</p>
            <p className="text-lg font-bold text-white">{events.length}</p>
          </div>
        </div>

        {/* Sub-tabs */}
        <div
          className="flex gap-1 border-b border-pm-border pb-px overflow-x-auto"
          style={{ scrollbarWidth: 'none' }}
        >
          {SUBTABS.map(({ label, key }) => {
            const isActive = activeSubtab === key;
            return (
              <button
                key={key}
                onClick={() => setActiveSubtab(key)}
                className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap cursor-pointer border-b-2 -mb-px ${
                  isActive
                    ? 'text-pm-blue border-pm-blue'
                    : 'text-pm-muted hover:text-pm-text border-transparent'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20 text-pm-muted">
            <p className="text-4xl mb-3">₿</p>
            <p className="text-lg font-medium">No crypto markets found</p>
            <p className="text-sm mt-1">Try a different filter</p>
          </div>
        ) : (
          <>
            {/* Featured hero */}
            {featured && (
              <div>
                <h2 className="text-xs font-semibold text-pm-muted uppercase tracking-wider mb-3">
                  Top Market
                </h2>
                <FeaturedEventCard event={featured} />
              </div>
            )}

            {/* Rest of the grid */}
            {rest.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold text-pm-muted uppercase tracking-wider mb-3">
                  All Markets
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {rest.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
