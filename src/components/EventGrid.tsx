'use client';

import { useMemo, useState } from 'react';
import { useAtomValue } from 'jotai';
import { activeCategoryAtom, searchQueryAtom } from '@/atoms/filterAtoms';
import { CategoryNav } from './CategoryNav';
import { EventCard } from './EventCard';
import { FeaturedEventCard } from './FeaturedEventCard';
import { ConnectionBadge } from './ConnectionBadge';
import { useHydratePrices } from '@/hooks/useHydratePrices';
import { useWebSocket } from '@/hooks/useWebSocket';
import { formatVolume } from '@/lib/utils';
import type { PolyEvent } from '@/lib/types';

const SORT_OPTIONS = [
  { label: 'Volume', key: 'volume' },
  { label: 'Ending Soon', key: 'ending' },
  { label: 'New', key: 'new' },
] as const;

type SortKey = (typeof SORT_OPTIONS)[number]['key'];

function isEventLive(event: PolyEvent): boolean {
  if (!event.endDate) return false;
  const end = new Date(event.endDate).getTime();
  const now = Date.now();
  return now < end && now > end - 86_400_000 * 2;
}

function sortEvents(events: PolyEvent[], sort: SortKey): PolyEvent[] {
  const copy = [...events];
  if (sort === 'volume') return copy.sort((a, b) => (Number(b.volume) || 0) - (Number(a.volume) || 0));
  if (sort === 'ending') {
    return copy.sort((a, b) => {
      const da = a.endDate ? new Date(a.endDate).getTime() : Infinity;
      const db = b.endDate ? new Date(b.endDate).getTime() : Infinity;
      return da - db;
    });
  }
  if (sort === 'new') {
    return copy.sort((a, b) => {
      const da = a.startDate ? new Date(a.startDate).getTime() : 0;
      const db = b.startDate ? new Date(b.startDate).getTime() : 0;
      return db - da;
    });
  }
  return copy;
}

interface Props {
  events: PolyEvent[];
}

export function EventGrid({ events }: Props) {
  const activeCategory = useAtomValue(activeCategoryAtom);
  const searchQuery = useAtomValue(searchQueryAtom);
  const [activeSort, setActiveSort] = useState<SortKey>('volume');
  const [showLiveOnly, setShowLiveOnly] = useState(false);

  const allMarkets = useMemo(
    () => events.flatMap((e) => e.markets),
    [events]
  );
  const allMarketIds = useMemo(() => allMarkets.map((m) => m.id), [allMarkets]);

  useHydratePrices(allMarkets);
  useWebSocket(allMarketIds);

  const availableCategories = useMemo(() => {
    const slugs = new Set<string>();
    events.forEach((e) => {
      if (e.category) slugs.add(e.category.toLowerCase());
      e.tags.forEach((t) => slugs.add(t.slug.toLowerCase()));
    });
    return Array.from(slugs);
  }, [events]);

  const filtered = useMemo(() => {
    let result = events;
    if (activeCategory !== 'all') {
      result = result.filter((e) => {
        const catMatch = e.category?.toLowerCase() === activeCategory;
        const tagMatch = e.tags.some(
          (t) => t.slug.toLowerCase() === activeCategory || t.label.toLowerCase() === activeCategory
        );
        return catMatch || tagMatch;
      });
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((e) => {
        const haystack = `${e.title} ${e.category} ${e.tags.map(t => t.label).join(' ')} ${e.markets.map(m => m.question).join(' ')}`.toLowerCase();
        return haystack.includes(q);
      });
    }
    if (showLiveOnly) {
      result = result.filter(isEventLive);
    }
    return sortEvents(result, activeSort);
  }, [events, activeCategory, searchQuery, activeSort, showLiveOnly]);

  // Hot topics: top categories by total volume
  const hotTopics = useMemo(() => {
    const volByTag = new Map<string, { label: string; volume: number }>();
    events.forEach((e) => {
      const labels = e.tags.map((t) => t.label);
      if (labels.length === 0 && e.category) labels.push(e.category);
      labels.forEach((label) => {
        const existing = volByTag.get(label) ?? { label, volume: 0 };
        existing.volume += Number(e.volume) || 0;
        volByTag.set(label, existing);
      });
    });
    return Array.from(volByTag.values())
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 5);
  }, [events]);

  // Featured event: highest volume from filtered list
  const featured = useMemo(() => {
    if (searchQuery.trim()) return null;
    const sorted = [...events].sort((a, b) => (Number(b.volume) || 0) - (Number(a.volume) || 0));
    return sorted[0] ?? null;
  }, [events, searchQuery]);

  const gridEvents = useMemo(
    () => (featured ? filtered.filter((e) => e.id !== featured.id) : filtered),
    [filtered, featured]
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <CategoryNav availableCategories={availableCategories} />
        <ConnectionBadge />
      </div>

      {/* Featured hero + Hot Topics row */}
      {featured && activeCategory === 'all' && !searchQuery.trim() && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <FeaturedEventCard event={featured} />
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold text-pm-muted uppercase tracking-wider">
              Hot Topics
            </h3>
            <div className="bg-pm-card border border-pm-border rounded-xl divide-y divide-pm-border overflow-hidden flex-1">
              {hotTopics.map((topic, i) => (
                <div key={topic.label} className="flex items-center justify-between px-4 py-3 hover:bg-pm-card-hover transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-pm-muted w-5">{i + 1}</span>
                    <span className="text-sm font-medium text-pm-text">{topic.label}</span>
                  </div>
                  <span className="text-xs text-pm-muted">
                    {formatVolume(topic.volume)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sort bar + Live toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowLiveOnly(!showLiveOnly)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            showLiveOnly
              ? 'bg-pm-red/15 border border-pm-red/30 text-pm-red'
              : 'text-pm-muted hover:text-pm-text'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${showLiveOnly ? 'bg-pm-red animate-pulse' : 'bg-pm-muted/50'}`} />
          Live
        </button>
        <span className="text-pm-border">|</span>
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

      {/* All Markets heading */}
      {featured && activeCategory === 'all' && !searchQuery.trim() && (
        <h2 className="text-xs font-semibold text-pm-muted uppercase tracking-wider">
          All Markets
        </h2>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-pm-muted">
          <p className="text-lg font-medium">No events found</p>
          <p className="text-sm mt-1">Try a different category or search term</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {gridEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
