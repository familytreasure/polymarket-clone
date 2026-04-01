import { unstable_cache } from 'next/cache';
import { GAMMA_API } from './constants';
import { parseEvent } from './parse';
import type { EventRaw, PolyEvent } from './types';
import { MOCK_EVENTS } from '@/mock/data';

// ─── raw fetchers (uncached) ──────────────────────────────────────────────────

async function _fetchEvents(limit: number): Promise<PolyEvent[]> {
  const sp = new URLSearchParams({ closed: 'false', active: 'true' });
  sp.set('limit', String(limit));
  try {
    const res = await fetch(`${GAMMA_API}/events?${sp.toString()}`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`Gamma API ${res.status}`);
    const raw: EventRaw[] = await res.json();
    return raw.filter((e) => e.markets?.length > 0).map(parseEvent);
  } catch (err) {
    console.warn('fetchEvents failed, using mock:', err);
    return MOCK_EVENTS;
  }
}

async function _fetchEventsByTag(tagSlug: string, limit: number): Promise<PolyEvent[]> {
  const sp = new URLSearchParams({ closed: 'false', active: 'true' });
  sp.set('limit', String(limit));
  sp.set('tag_slug', tagSlug);

  const mockFallback = MOCK_EVENTS.filter(
    (e) =>
      e.tags.some((t) => t.slug.toLowerCase() === tagSlug) ||
      e.category.toLowerCase() === tagSlug
  );

  try {
    const res = await fetch(`${GAMMA_API}/events?${sp.toString()}`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`Gamma API ${res.status}`);
    const raw: EventRaw[] = await res.json();
    const parsed = raw.filter((e) => e.markets?.length > 0).map(parseEvent);
    return parsed.length > 0 ? parsed : mockFallback;
  } catch {
    return mockFallback;
  }
}

async function _fetchEventById(id: string): Promise<PolyEvent | null> {
  // Single request: try id= and slug= as separate query values in one call
  // The API supports ?id= for UUID-style IDs
  const param = id.startsWith('0x') || /^\d+$/.test(id) ? 'id' : 'slug';
  try {
    const res = await fetch(`${GAMMA_API}/events?${param}=${encodeURIComponent(id)}`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const raw: EventRaw[] = await res.json();
      if (raw.length > 0) return parseEvent(raw[0]);
    }
  } catch {
    // fall through
  }

  // If slug param didn't work, try id param as fallback (one more attempt)
  if (param === 'slug') {
    try {
      const res = await fetch(`${GAMMA_API}/events?id=${encodeURIComponent(id)}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const raw: EventRaw[] = await res.json();
        if (raw.length > 0) return parseEvent(raw[0]);
      }
    } catch {
      // fall through
    }
  }

  return MOCK_EVENTS.find((e) => e.id === id || e.slug === id) ?? null;
}

// ─── cached exports (30s TTL) ─────────────────────────────────────────────────
// unstable_cache stores the *parsed* PolyEvent[] — far smaller than the 4MB raw
// response, so it fits comfortably in Next.js's data cache.

export const fetchEvents = unstable_cache(
  (limit = 30) => _fetchEvents(limit),
  ['events'],
  { revalidate: 30 }
);

export const fetchEventsByTag = unstable_cache(
  (tagSlug: string, limit = 40) => _fetchEventsByTag(tagSlug, limit),
  ['events-by-tag'],
  { revalidate: 30 }
);

export const fetchEventById = unstable_cache(
  (id: string) => _fetchEventById(id),
  ['event-by-id'],
  { revalidate: 30 }
);
