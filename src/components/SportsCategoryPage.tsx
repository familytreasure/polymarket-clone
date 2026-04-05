'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useAtomValue } from 'jotai';
import { marketPriceFamily } from '@/atoms/priceAtoms';
import { searchQueryAtom } from '@/atoms/filterAtoms';
import { useHydratePrices } from '@/hooks/useHydratePrices';
import { useWebSocket } from '@/hooks/useWebSocket';
import { ProbabilityBar } from './ProbabilityBar';
import { ConnectionBadge } from './ConnectionBadge';
import { Sidebar } from './Sidebar';
import type { SidebarSection } from './Sidebar';
import { formatVolume } from '@/lib/utils';
import { usePriceAnimation } from '@/hooks/usePriceAnimation';
import type { PolyEvent } from '@/lib/types';
import { memo } from 'react';

const SPORT_FILTERS = [
  { label: 'Live', key: 'live', icon: '🔴' },
  { label: 'Futures', key: 'futures', icon: '📅' },
] as const;

const ALL_SPORTS = [
  { label: 'All Sports', key: 'all', icon: '🏆' },
  { label: 'NBA', key: 'nba', icon: '🏀' },
  { label: 'NFL', key: 'nfl', icon: '🏈' },
  { label: 'UFC', key: 'ufc', icon: '🥊' },
  { label: 'Soccer', key: 'soccer', icon: '⚽' },
  { label: 'MLB', key: 'mlb', icon: '⚾' },
  { label: 'NHL', key: 'nhl', icon: '🏒' },
  { label: 'Tennis', key: 'tennis', icon: '🎾' },
  { label: 'Cricket', key: 'cricket', icon: '🏏' },
  { label: 'Golf', key: 'golf', icon: '⛳' },
] as const;

type SportKey = string;

const SORT_OPTIONS = [
  { label: 'Volume', key: 'volume' },
  { label: 'Ending Soon', key: 'ending' },
  { label: 'New', key: 'new' },
] as const;

type SortKey = (typeof SORT_OPTIONS)[number]['key'];

const SPORT_KEYWORDS: Record<string, string[]> = {
  nba: ['nba', 'basketball', 'celtics', 'lakers', 'warriors', 'nuggets', 'thunder', 'heat'],
  nfl: ['nfl', 'football', 'super bowl', 'superbowl', 'eagles', 'chiefs', 'cowboys', 'patriots'],
  ufc: ['ufc', 'mma', 'fight', 'boxing'],
  soccer: ['soccer', 'football', 'premier league', 'la liga', 'champions league', 'world cup', 'fifa', 'mls'],
  mlb: ['mlb', 'baseball', 'world series', 'yankees', 'dodgers', 'red sox'],
  nhl: ['nhl', 'hockey', 'stanley cup'],
  tennis: ['tennis', 'wimbledon', 'us open', 'french open', 'australian open', 'atp', 'wta'],
  cricket: ['cricket', 'ipl', 'test match', 'odi', 't20'],
  golf: ['golf', 'pga', 'masters', 'open championship', 'ryder cup'],
};

function matchesSport(event: PolyEvent, sport: SportKey): boolean {
  if (sport === 'all' || sport === 'live' || sport === 'futures') return true;
  const keywords = SPORT_KEYWORDS[sport] ?? [];
  const haystack = (
    event.title + ' ' + event.tags.map((t) => t.label + ' ' + t.slug).join(' ')
  ).toLowerCase();
  return keywords.some((kw) => haystack.includes(kw));
}

function sortEvents(events: PolyEvent[], sort: SortKey): PolyEvent[] {
  const copy = [...events];
  if (sort === 'volume') return copy.sort((a, b) => (Number(b.volume) || 0) - (Number(a.volume) || 0));
  if (sort === 'ending') {
    return copy.sort((a, b) => {
      const dateA = a.endDate ? new Date(a.endDate).getTime() : Infinity;
      const dateB = b.endDate ? new Date(b.endDate).getTime() : Infinity;
      return dateA - dateB;
    });
  }
  if (sort === 'new') {
    return copy.sort((a, b) => {
      const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
      const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
      return dateB - dateA;
    });
  }
  return copy;
}

function isLive(event: PolyEvent): boolean {
  if (!event.endDate) return false;
  const end = new Date(event.endDate).getTime();
  const now = Date.now();
  return now < end && now > end - 86_400_000 * 2;
}

interface SportsCardProps {
  event: PolyEvent;
}

const SportsCard = memo(function SportsCard({ event }: SportsCardProps) {
  const primaryMarket = event.markets[0];
  const prices = useAtomValue(marketPriceFamily(primaryMarket?.id ?? ''));
  const flashClass = usePriceAnimation(primaryMarket?.id ?? '');
  const live = isLive(event);

  if (!primaryMarket) return null;

  const yesPrice = prices[0] ?? 0.5;
  const noPrice = prices[1] ?? 0.5;

  return (
    <Link
      href={`/event/${event.id}`}
      className="block bg-pm-card border border-pm-border rounded-xl hover:bg-pm-card-hover hover:border-pm-text/20 transition-all duration-200 overflow-hidden group"
    >
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {live && (
              <span className="flex items-center gap-1 text-xs font-semibold text-pm-red bg-pm-red/10 border border-pm-red/20 px-1.5 py-0.5 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-pm-red animate-pulse inline-block" />
                LIVE
              </span>
            )}
            <span className="text-xs text-pm-muted">
              {event.tags[0]?.label ?? event.category}
            </span>
          </div>
          {event.endDate && (
            <span className="text-xs text-pm-muted whitespace-nowrap shrink-0">
              {new Date(event.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>

        <p className="text-sm font-semibold text-pm-text leading-snug line-clamp-2 group-hover:text-white transition-colors">
          {event.title}
        </p>

        <div className={`flex gap-2 ${flashClass}`}>
          {primaryMarket.outcomes.slice(0, 2).map((outcome, i) => {
            const price = i === 0 ? yesPrice : noPrice;
            const isYes = i === 0;
            return (
              <div
                key={outcome}
                className={`flex-1 flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold border ${
                  isYes
                    ? 'border-pm-green/20 bg-pm-green/8 text-pm-green'
                    : 'border-pm-red/20 bg-pm-red/8 text-pm-red'
                }`}
              >
                <span className="truncate mr-1">{outcome}</span>
                <span className="tabular-nums shrink-0">{Math.round(price * 100)}¢</span>
              </div>
            );
          })}
        </div>

        <ProbabilityBar prices={prices} outcomes={primaryMarket.outcomes} />

        <div className="text-xs text-pm-muted text-right">
          Vol: <span className="text-pm-text">{formatVolume(event.volume)}</span>
        </div>
      </div>
    </Link>
  );
});

interface Props {
  events: PolyEvent[];
}

export function SportsCategoryPage({ events }: Props) {
  const [activeSport, setActiveSport] = useState<SportKey>('all');
  const [activeSort, setActiveSort] = useState<SortKey>('volume');
  const searchQuery = useAtomValue(searchQueryAtom);

  const allMarkets = useMemo(() => events.flatMap((e) => e.markets), [events]);
  const allMarketIds = useMemo(() => allMarkets.map((m) => m.id), [allMarkets]);

  useHydratePrices(allMarkets);
  useWebSocket(allMarketIds);

  const sportCounts = useMemo(() => {
    const counts: Record<string, number> = { all: events.length };
    ALL_SPORTS.forEach(({ key }) => {
      if (key !== 'all') {
        counts[key] = events.filter((e) => matchesSport(e, key)).length;
      }
    });
    return counts;
  }, [events]);

  const liveCount = useMemo(() => events.filter(isLive).length, [events]);

  const sidebarSections: SidebarSection[] = useMemo(() => [
    {
      items: [
        { key: 'live', label: 'Live', icon: '🔴', count: liveCount },
        { key: 'futures', label: 'Futures', icon: '📅', count: events.length - liveCount },
      ],
    },
    {
      title: 'All Sports',
      items: ALL_SPORTS
        .filter(({ key }) => key === 'all' || (sportCounts[key] ?? 0) > 0)
        .map(({ key, label, icon }) => ({
          key,
          label,
          icon,
          count: sportCounts[key] ?? 0,
        })),
    },
  ], [sportCounts, liveCount, events.length]);

  const filtered = useMemo(() => {
    let base = events;
    if (activeSport === 'live') {
      base = events.filter(isLive);
    } else if (activeSport === 'futures') {
      base = events.filter((e) => !isLive(e));
    } else {
      base = events.filter((e) => matchesSport(e, activeSport));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      base = base.filter((e) => {
        const haystack = `${e.title} ${e.category} ${e.tags.map(t => t.label).join(' ')} ${e.markets.map(m => m.question).join(' ')}`.toLowerCase();
        return haystack.includes(q);
      });
    }
    return sortEvents(base, activeSort);
  }, [events, activeSport, activeSort, searchQuery]);

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Sidebar */}
      <Sidebar sections={sidebarSections} activeKey={activeSport} onSelect={setActiveSport} />

      {/* Main content */}
      <div className="flex-1 flex flex-col gap-6 min-w-0">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🏆</span>
              <h1 className="text-2xl font-bold text-white">Sports</h1>
              {liveCount > 0 && (
                <span className="flex items-center gap-1 text-xs font-semibold text-pm-green bg-pm-green/10 border border-pm-green/20 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-pm-green animate-pulse inline-block" />
                  {liveCount} Live
                </span>
              )}
            </div>
            <p className="text-pm-muted text-sm">
              Prediction markets for sports events
            </p>
          </div>
          <ConnectionBadge />
        </div>

        {/* Sort bar */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-pm-muted">Sort:</span>
          <div className="flex gap-1">
            {SORT_OPTIONS.map(({ label, key }) => (
              <button
                key={key}
                onClick={() => setActiveSort(key)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeSort === key
                    ? 'bg-pm-card border border-pm-border text-pm-text'
                    : 'text-pm-muted hover:text-pm-text'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <span className="ml-auto text-xs text-pm-muted">
            {filtered.length} event{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Event grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-pm-muted">
            <p className="text-4xl mb-3">🏆</p>
            <p className="text-lg font-medium">No sports markets found</p>
            <p className="text-sm mt-1">Try a different sport filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((event) => (
              <SportsCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
