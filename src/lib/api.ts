import { GAMMA_API } from './constants';
import { parseEvent } from './parse';
import type { EventRaw, PolyEvent } from './types';
import { MOCK_EVENTS } from '@/mock/data';

export async function fetchEvents(limit: number = 30): Promise<PolyEvent[]> {
  const sp = new URLSearchParams({ closed: 'false', active: 'true' });
  sp.set('limit', String(limit));
  try {
    const res = await fetch(`${GAMMA_API}/events?${sp.toString()}`);
    if (!res.ok) throw new Error(`Gamma API ${res.status}`);
    const raw: EventRaw[] = await res.json();
    return raw.filter((e) => e.markets?.length > 0).map(parseEvent);
  } catch (err) {
    console.warn('fetchEvents failed, using mock:', err);
    return MOCK_EVENTS;
  }
}

export async function fetchEventsByTag(tagSlug: string, limit: number = 40): Promise<PolyEvent[]> {
  const sp = new URLSearchParams({ closed: 'false', active: 'true' });
  sp.set('limit', String(limit));
  sp.set('tag_slug', tagSlug);

  const mockFallback = MOCK_EVENTS.filter(
    (e) =>
      e.tags.some((t) => t.slug.toLowerCase() === tagSlug) ||
      e.category.toLowerCase() === tagSlug
  );

  try {
    const res = await fetch(`${GAMMA_API}/events?${sp.toString()}`);
    if (!res.ok) throw new Error(`Gamma API ${res.status}`);
    const raw: EventRaw[] = await res.json();
    const parsed = raw.filter((e) => e.markets?.length > 0).map(parseEvent);
    return parsed.length > 0 ? parsed : mockFallback;
  } catch {
    return mockFallback;
  }
}

export async function fetchEventById(id: string): Promise<PolyEvent | null> {
  const param = id.startsWith('0x') || /^\d+$/.test(id) ? 'id' : 'slug';
  try {
    const res = await fetch(`${GAMMA_API}/events?${param}=${encodeURIComponent(id)}`);
    if (res.ok) {
      const raw: EventRaw[] = await res.json();
      if (raw.length > 0) return parseEvent(raw[0]);
    }
  } catch {
    // fall through
  }

  if (param === 'slug') {
    try {
      const res = await fetch(`${GAMMA_API}/events?id=${encodeURIComponent(id)}`);
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
