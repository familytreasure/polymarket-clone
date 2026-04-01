# Polymarket Clone — Implementation Guide

> **Resumable by any model.** Check off each box as you go. If you pick this up mid-way, scan for the first unchecked box and continue from there. Never re-do a checked step.

---

## Project State

- **Directory**: `/Users/maksym/Documents/WORK/new-project/`
- **Framework**: Next.js 16 (App Router) — already scaffolded
- **Styling**: Tailwind CSS v4 — already installed (configured via CSS, NOT `tailwind.config.ts`)
- **Package manager**: `pnpm`
- **TypeScript**: yes
- **Jotai**: needs to be installed

### Critical: Tailwind v4 Differences
Tailwind v4 does **NOT** use `tailwind.config.ts`. Custom tokens go in `globals.css` using `@theme` blocks. Dark mode uses the `dark` variant with `@variant dark` or `data-theme="dark"` on the html element.

---

## Phase 1 — Setup

- [ ] **1.1 Install Jotai**
  ```bash
  pnpm add jotai
  ```

- [ ] **1.2 Create directory structure**
  ```bash
  mkdir -p src/components src/lib src/atoms src/hooks src/mock
  mkdir -p src/app/event/\[id\]
  ```

---

## Phase 2 — Types & Utilities

- [ ] **2.1 Create `src/lib/types.ts`**
  ```typescript
  export interface MarketRaw {
    id: string;
    conditionId: string;
    question: string;
    outcomes: string;        // stringified JSON: '["Yes","No"]'
    outcomePrices: string;   // stringified JSON: '[0.65,0.35]'
    clobTokenIds: string;    // stringified JSON
    bestBid: number;
    bestAsk: number;
    volume: number;
    liquidity: number;
    negRisk: boolean;
    slug?: string;
  }

  export interface Market {
    id: string;
    conditionId: string;
    question: string;
    outcomes: string[];
    outcomePrices: number[];
    clobTokenIds: string[];
    bestBid: number;
    bestAsk: number;
    volume: number;
    liquidity: number;
    negRisk: boolean;
    slug?: string;
  }

  export interface Tag {
    id: string;
    slug: string;
    label: string;
  }

  export interface EventRaw {
    id: string;
    title: string;
    slug: string;
    category?: string;
    tags: Tag[];
    startDate: string;
    endDate: string;
    volume: number;
    liquidity?: number;
    image?: string;
    markets: MarketRaw[];
  }

  export interface PolyEvent {
    id: string;
    title: string;
    slug: string;
    category: string;
    tags: Tag[];
    startDate: string;
    endDate: string;
    volume: number;
    liquidity: number;
    image?: string;
    markets: Market[];
  }

  export interface PriceUpdate {
    market_id: string;
    price: number;
    timestamp: number;
  }
  ```

- [ ] **2.2 Create `src/lib/constants.ts`**
  ```typescript
  export const GAMMA_API = 'https://gamma-api.polymarket.com';
  export const WS_URL = 'wss://ws-subscriptions-clob.polymarket.com/ws/market';

  export const CATEGORIES = [
    { label: 'All', slug: 'all' },
    { label: 'Crypto', slug: 'crypto' },
    { label: 'Sports', slug: 'sports' },
    { label: 'Politics', slug: 'politics' },
    { label: 'Science', slug: 'science' },
    { label: 'Pop Culture', slug: 'pop-culture' },
    { label: 'Business', slug: 'business' },
  ] as const;
  ```

- [ ] **2.3 Create `src/lib/parse.ts`**
  ```typescript
  import type { EventRaw, MarketRaw, Market, PolyEvent } from './types';

  function safeParseJSON<T>(str: string, fallback: T): T {
    try {
      return JSON.parse(str) as T;
    } catch {
      return fallback;
    }
  }

  export function parseMarket(raw: MarketRaw): Market {
    return {
      id: raw.id,
      conditionId: raw.conditionId,
      question: raw.question,
      outcomes: safeParseJSON<string[]>(raw.outcomes, ['Yes', 'No']),
      outcomePrices: safeParseJSON<number[]>(raw.outcomePrices, [0.5, 0.5]).map(Number),
      clobTokenIds: safeParseJSON<string[]>(raw.clobTokenIds, []),
      bestBid: raw.bestBid ?? 0,
      bestAsk: raw.bestAsk ?? 0,
      volume: raw.volume ?? 0,
      liquidity: raw.liquidity ?? 0,
      negRisk: raw.negRisk ?? false,
      slug: raw.slug,
    };
  }

  export function parseEvent(raw: EventRaw): PolyEvent {
    return {
      id: raw.id,
      title: raw.title,
      slug: raw.slug,
      category: raw.category ?? raw.tags?.[0]?.label ?? 'General',
      tags: raw.tags ?? [],
      startDate: raw.startDate,
      endDate: raw.endDate,
      volume: raw.volume ?? 0,
      liquidity: raw.liquidity ?? 0,
      image: raw.image,
      markets: (raw.markets ?? []).map(parseMarket),
    };
  }
  ```

- [ ] **2.4 Create `src/lib/utils.ts`**
  ```typescript
  export function formatVolume(value: number): string {
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  }

  export function formatPrice(price: number): string {
    return `${Math.round(price * 100)}%`;
  }

  export function formatCents(price: number): string {
    return `${(price * 100).toFixed(0)}¢`;
  }

  export function cn(...classes: (string | undefined | false | null)[]): string {
    return classes.filter(Boolean).join(' ');
  }
  ```

---

## Phase 3 — Mock Data

- [ ] **3.1 Create `src/mock/data.ts`**

  This is the fallback dataset used when the Gamma API is unreachable. Keep prices realistic (sum to ~1.0 per binary market).

  ```typescript
  import type { PolyEvent } from '@/lib/types';

  export const MOCK_EVENTS: PolyEvent[] = [
    {
      id: 'mock-btc-100k',
      title: 'Will Bitcoin reach $100K before July 2025?',
      slug: 'bitcoin-100k-july-2025',
      category: 'Crypto',
      tags: [{ id: '1', slug: 'crypto', label: 'Crypto' }],
      startDate: '2025-01-01T00:00:00Z',
      endDate: '2025-07-01T00:00:00Z',
      volume: 4200000,
      liquidity: 980000,
      markets: [
        {
          id: 'mock-btc-100k-m1',
          conditionId: '0xabc001',
          question: 'Will Bitcoin reach $100K before July 2025?',
          outcomes: ['Yes', 'No'],
          outcomePrices: [0.72, 0.28],
          clobTokenIds: ['t1', 't2'],
          bestBid: 0.71,
          bestAsk: 0.73,
          volume: 4200000,
          liquidity: 980000,
          negRisk: false,
        },
      ],
    },
    {
      id: 'mock-eth-flip',
      title: 'Will Ethereum flip Bitcoin by market cap in 2025?',
      slug: 'eth-flip-btc-2025',
      category: 'Crypto',
      tags: [{ id: '1', slug: 'crypto', label: 'Crypto' }],
      startDate: '2025-01-01T00:00:00Z',
      endDate: '2025-12-31T00:00:00Z',
      volume: 1800000,
      liquidity: 450000,
      markets: [
        {
          id: 'mock-eth-flip-m1',
          conditionId: '0xabc002',
          question: 'Will Ethereum flip Bitcoin by market cap in 2025?',
          outcomes: ['Yes', 'No'],
          outcomePrices: [0.12, 0.88],
          clobTokenIds: ['t3', 't4'],
          bestBid: 0.11,
          bestAsk: 0.13,
          volume: 1800000,
          liquidity: 450000,
          negRisk: false,
        },
      ],
    },
    {
      id: 'mock-fed-cut',
      title: 'Will the Fed cut rates in Q2 2025?',
      slug: 'fed-rate-cut-q2-2025',
      category: 'Politics',
      tags: [{ id: '2', slug: 'politics', label: 'Politics' }],
      startDate: '2025-01-01T00:00:00Z',
      endDate: '2025-06-30T00:00:00Z',
      volume: 3100000,
      liquidity: 720000,
      markets: [
        {
          id: 'mock-fed-cut-m1',
          conditionId: '0xabc003',
          question: 'Will the Fed cut rates in Q2 2025?',
          outcomes: ['Yes', 'No'],
          outcomePrices: [0.45, 0.55],
          clobTokenIds: ['t5', 't6'],
          bestBid: 0.44,
          bestAsk: 0.46,
          volume: 3100000,
          liquidity: 720000,
          negRisk: false,
        },
      ],
    },
    {
      id: 'mock-superbowl',
      title: 'Super Bowl LIX Winner',
      slug: 'super-bowl-lix-winner',
      category: 'Sports',
      tags: [{ id: '3', slug: 'sports', label: 'Sports' }],
      startDate: '2025-01-01T00:00:00Z',
      endDate: '2025-02-09T00:00:00Z',
      volume: 8900000,
      liquidity: 2100000,
      markets: [
        {
          id: 'mock-superbowl-m1',
          conditionId: '0xabc004',
          question: 'Eagles to win Super Bowl LIX?',
          outcomes: ['Yes', 'No'],
          outcomePrices: [0.61, 0.39],
          clobTokenIds: ['t7', 't8'],
          bestBid: 0.60,
          bestAsk: 0.62,
          volume: 4500000,
          liquidity: 1100000,
          negRisk: false,
        },
        {
          id: 'mock-superbowl-m2',
          conditionId: '0xabc005',
          question: 'Chiefs to win Super Bowl LIX?',
          outcomes: ['Yes', 'No'],
          outcomePrices: [0.37, 0.63],
          clobTokenIds: ['t9', 't10'],
          bestBid: 0.36,
          bestAsk: 0.38,
          volume: 4400000,
          liquidity: 1000000,
          negRisk: false,
        },
      ],
    },
    {
      id: 'mock-trump-approve',
      title: "Trump approval rating above 50% in April 2025?",
      slug: 'trump-approval-april-2025',
      category: 'Politics',
      tags: [{ id: '2', slug: 'politics', label: 'Politics' }],
      startDate: '2025-03-01T00:00:00Z',
      endDate: '2025-04-30T00:00:00Z',
      volume: 2700000,
      liquidity: 610000,
      markets: [
        {
          id: 'mock-trump-approve-m1',
          conditionId: '0xabc006',
          question: "Trump approval rating above 50% in April 2025?",
          outcomes: ['Yes', 'No'],
          outcomePrices: [0.33, 0.67],
          clobTokenIds: ['t11', 't12'],
          bestBid: 0.32,
          bestAsk: 0.34,
          volume: 2700000,
          liquidity: 610000,
          negRisk: false,
        },
      ],
    },
    {
      id: 'mock-nba-champ',
      title: '2025 NBA Championship Winner',
      slug: 'nba-championship-2025',
      category: 'Sports',
      tags: [{ id: '3', slug: 'sports', label: 'Sports' }],
      startDate: '2025-01-01T00:00:00Z',
      endDate: '2025-06-25T00:00:00Z',
      volume: 5400000,
      liquidity: 1300000,
      markets: [
        {
          id: 'mock-nba-m1',
          conditionId: '0xabc007',
          question: 'Boston Celtics to win 2025 NBA Championship?',
          outcomes: ['Yes', 'No'],
          outcomePrices: [0.28, 0.72],
          clobTokenIds: ['t13', 't14'],
          bestBid: 0.27,
          bestAsk: 0.29,
          volume: 1800000,
          liquidity: 430000,
          negRisk: false,
        },
        {
          id: 'mock-nba-m2',
          conditionId: '0xabc008',
          question: 'Oklahoma City Thunder to win 2025 NBA Championship?',
          outcomes: ['Yes', 'No'],
          outcomePrices: [0.22, 0.78],
          clobTokenIds: ['t15', 't16'],
          bestBid: 0.21,
          bestAsk: 0.23,
          volume: 1600000,
          liquidity: 390000,
          negRisk: false,
        },
      ],
    },
    {
      id: 'mock-sol-100',
      title: 'Will Solana reach $300 before June 2025?',
      slug: 'solana-300-june-2025',
      category: 'Crypto',
      tags: [{ id: '1', slug: 'crypto', label: 'Crypto' }],
      startDate: '2025-01-01T00:00:00Z',
      endDate: '2025-06-01T00:00:00Z',
      volume: 1100000,
      liquidity: 280000,
      markets: [
        {
          id: 'mock-sol-m1',
          conditionId: '0xabc009',
          question: 'Will Solana reach $300 before June 2025?',
          outcomes: ['Yes', 'No'],
          outcomePrices: [0.54, 0.46],
          clobTokenIds: ['t17', 't18'],
          bestBid: 0.53,
          bestAsk: 0.55,
          volume: 1100000,
          liquidity: 280000,
          negRisk: false,
        },
      ],
    },
    {
      id: 'mock-recession',
      title: 'Will the US enter recession in 2025?',
      slug: 'us-recession-2025',
      category: 'Business',
      tags: [{ id: '4', slug: 'business', label: 'Business' }],
      startDate: '2025-01-01T00:00:00Z',
      endDate: '2025-12-31T00:00:00Z',
      volume: 6200000,
      liquidity: 1500000,
      markets: [
        {
          id: 'mock-recession-m1',
          conditionId: '0xabc010',
          question: 'Will the US enter recession in 2025?',
          outcomes: ['Yes', 'No'],
          outcomePrices: [0.38, 0.62],
          clobTokenIds: ['t19', 't20'],
          bestBid: 0.37,
          bestAsk: 0.39,
          volume: 6200000,
          liquidity: 1500000,
          negRisk: false,
        },
      ],
    },
    {
      id: 'mock-oscar-bp',
      title: '2025 Oscar Best Picture Winner',
      slug: 'oscar-best-picture-2025',
      category: 'Pop Culture',
      tags: [{ id: '5', slug: 'pop-culture', label: 'Pop Culture' }],
      startDate: '2025-01-01T00:00:00Z',
      endDate: '2025-03-02T00:00:00Z',
      volume: 890000,
      liquidity: 210000,
      markets: [
        {
          id: 'mock-oscar-m1',
          conditionId: '0xabc011',
          question: 'Anora to win Best Picture at 2025 Oscars?',
          outcomes: ['Yes', 'No'],
          outcomePrices: [0.48, 0.52],
          clobTokenIds: ['t21', 't22'],
          bestBid: 0.47,
          bestAsk: 0.49,
          volume: 890000,
          liquidity: 210000,
          negRisk: false,
        },
      ],
    },
    {
      id: 'mock-ai-gpt5',
      title: 'Will OpenAI release GPT-5 before July 2025?',
      slug: 'openai-gpt5-july-2025',
      category: 'Science',
      tags: [{ id: '6', slug: 'science', label: 'Science' }],
      startDate: '2025-01-01T00:00:00Z',
      endDate: '2025-07-01T00:00:00Z',
      volume: 2300000,
      liquidity: 560000,
      markets: [
        {
          id: 'mock-gpt5-m1',
          conditionId: '0xabc012',
          question: 'Will OpenAI release GPT-5 before July 2025?',
          outcomes: ['Yes', 'No'],
          outcomePrices: [0.67, 0.33],
          clobTokenIds: ['t23', 't24'],
          bestBid: 0.66,
          bestAsk: 0.68,
          volume: 2300000,
          liquidity: 560000,
          negRisk: false,
        },
      ],
    },
  ];
  ```

---

## Phase 4 — API Layer

- [ ] **4.1 Create `src/lib/api.ts`**
  ```typescript
  import { GAMMA_API } from './constants';
  import { parseEvent } from './parse';
  import type { EventRaw, PolyEvent } from './types';
  import { MOCK_EVENTS } from '@/mock/data';

  export async function fetchEvents(params?: {
    limit?: number;
    offset?: number;
    active?: boolean;
  }): Promise<PolyEvent[]> {
    const sp = new URLSearchParams({ closed: 'false' });
    sp.set('limit', String(params?.limit ?? 50));
    if (params?.offset) sp.set('offset', String(params.offset));
    if (params?.active !== false) sp.set('active', 'true');

    try {
      const res = await fetch(`${GAMMA_API}/events?${sp.toString()}`, {
        next: { revalidate: 60 },
      });
      if (!res.ok) throw new Error(`Gamma API ${res.status}`);
      const raw: EventRaw[] = await res.json();
      return raw
        .filter((e) => e.markets && e.markets.length > 0)
        .map(parseEvent);
    } catch (err) {
      console.warn('Gamma API unavailable, using mock data:', err);
      return MOCK_EVENTS;
    }
  }

  export async function fetchEventById(id: string): Promise<PolyEvent | null> {
    // Try slug-based lookup first, then filter from list
    try {
      const res = await fetch(`${GAMMA_API}/events?id=${id}`, {
        next: { revalidate: 60 },
      });
      if (res.ok) {
        const raw: EventRaw[] = await res.json();
        if (raw.length > 0) return parseEvent(raw[0]);
      }
    } catch {
      // fall through
    }

    // Fallback: check mock data
    return MOCK_EVENTS.find((e) => e.id === id || e.slug === id) ?? null;
  }
  ```

---

## Phase 5 — Jotai Atoms

- [ ] **5.1 Create `src/atoms/priceAtoms.ts`**
  ```typescript
  import { atom } from 'jotai';
  import { atomFamily } from 'jotai/utils';

  // Per-market current prices: [yesPrice, noPrice]
  export const marketPriceFamily = atomFamily(
    (_marketId: string) => atom<number[]>([0.5, 0.5])
  );

  // Per-market previous prices (for detecting change direction)
  export const marketPrevPriceFamily = atomFamily(
    (_marketId: string) => atom<number[]>([0.5, 0.5])
  );

  // Derived: direction of last price move
  export const priceDirectionFamily = atomFamily(
    (marketId: string) =>
      atom<'up' | 'down' | 'none'>((get) => {
        const current = get(marketPriceFamily(marketId));
        const prev = get(marketPrevPriceFamily(marketId));
        if (current[0] > prev[0] + 0.0001) return 'up';
        if (current[0] < prev[0] - 0.0001) return 'down';
        return 'none';
      })
  );
  ```

- [ ] **5.2 Create `src/atoms/filterAtoms.ts`**
  ```typescript
  import { atom } from 'jotai';

  export const activeCategoryAtom = atom<string>('all');
  ```

- [ ] **5.3 Create `src/atoms/connectionAtoms.ts`**
  ```typescript
  import { atom } from 'jotai';

  export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'simulated';

  export const wsStatusAtom = atom<ConnectionStatus>('disconnected');
  ```

---

## Phase 6 — Hooks

- [ ] **6.1 Create `src/hooks/useHydratePrices.ts`**
  ```typescript
  'use client';

  import { useEffect, useRef } from 'react';
  import { useStore } from 'jotai';
  import { marketPriceFamily, marketPrevPriceFamily } from '@/atoms/priceAtoms';
  import type { Market } from '@/lib/types';

  export function useHydratePrices(markets: Market[]) {
    const store = useStore();
    const hydrated = useRef(false);

    useEffect(() => {
      if (hydrated.current) return;
      markets.forEach((m) => {
        const prices = m.outcomePrices.length >= 2
          ? m.outcomePrices
          : [0.5, 0.5];
        store.set(marketPriceFamily(m.id), prices);
        store.set(marketPrevPriceFamily(m.id), prices);
      });
      hydrated.current = true;
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
  }
  ```

- [ ] **6.2 Create `src/hooks/useWebSocket.ts`**
  ```typescript
  'use client';

  import { useEffect } from 'react';
  import { useStore, useSetAtom } from 'jotai';
  import { marketPriceFamily, marketPrevPriceFamily } from '@/atoms/priceAtoms';
  import { wsStatusAtom } from '@/atoms/connectionAtoms';
  import { WS_URL } from '@/lib/constants';

  export function useWebSocket(marketIds: string[]) {
    const store = useStore();
    const setStatus = useSetAtom(wsStatusAtom);

    useEffect(() => {
      if (marketIds.length === 0) return;

      let ws: WebSocket | null = null;
      let retries = 0;
      const MAX_RETRIES = 3;
      let simulationTimer: ReturnType<typeof setInterval> | null = null;
      let abandoned = false;

      function startSimulation() {
        setStatus('simulated');
        simulationTimer = setInterval(() => {
          if (marketIds.length === 0) return;
          const id = marketIds[Math.floor(Math.random() * marketIds.length)];
          const priceAtom = marketPriceFamily(id);
          const prevAtom = marketPrevPriceFamily(id);
          const current = store.get(priceAtom);
          const drift = (Math.random() - 0.5) * 0.025;
          const newYes = Math.max(0.02, Math.min(0.98, current[0] + drift));
          store.set(prevAtom, [...current]);
          store.set(priceAtom, [newYes, 1 - newYes]);
        }, 2000 + Math.random() * 3000);
      }

      function connect() {
        if (abandoned) return;
        setStatus('connecting');
        try {
          ws = new WebSocket(WS_URL);
        } catch {
          retries++;
          if (retries >= MAX_RETRIES) {
            startSimulation();
          } else {
            setTimeout(connect, Math.min(1000 * 2 ** retries, 15000));
          }
          return;
        }

        ws.onopen = () => {
          retries = 0;
          setStatus('connected');
          // Subscribe to each market's order book
          marketIds.forEach((id) => {
            ws?.send(JSON.stringify({
              auth: { apiKey: '' },
              type: 'Market',
              conditions: [id],
            }));
          });
        };

        ws.onmessage = (evt) => {
          try {
            const data = JSON.parse(evt.data as string);
            // Handle price updates — format varies, handle common patterns
            const marketId = data.market_id ?? data.asset_id ?? data.market;
            const rawPrice = data.price ?? data.last_trade_price;
            if (marketId && rawPrice != null) {
              const price = Number(rawPrice);
              if (!isNaN(price) && marketIds.includes(marketId)) {
                const priceAtom = marketPriceFamily(marketId);
                const prevAtom = marketPrevPriceFamily(marketId);
                const current = store.get(priceAtom);
                store.set(prevAtom, [...current]);
                store.set(priceAtom, [price, 1 - price]);
              }
            }
          } catch {
            // ignore malformed messages
          }
        };

        ws.onclose = () => {
          if (abandoned) return;
          retries++;
          if (retries >= MAX_RETRIES) {
            startSimulation();
          } else {
            setTimeout(connect, Math.min(1000 * 2 ** retries, 15000));
          }
        };

        ws.onerror = () => ws?.close();
      }

      connect();

      return () => {
        abandoned = true;
        ws?.close();
        if (simulationTimer) clearInterval(simulationTimer);
        setStatus('disconnected');
      };
    }, [marketIds.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps
  }
  ```

- [ ] **6.3 Create `src/hooks/usePriceAnimation.ts`**
  ```typescript
  'use client';

  import { useState, useEffect } from 'react';
  import { useAtomValue } from 'jotai';
  import { priceDirectionFamily } from '@/atoms/priceAtoms';

  export function usePriceAnimation(marketId: string): string {
    const direction = useAtomValue(priceDirectionFamily(marketId));
    const [flashClass, setFlashClass] = useState('');

    useEffect(() => {
      if (direction === 'none') return;
      const cls = direction === 'up' ? 'flash-green' : 'flash-red';
      setFlashClass(cls);
      const timer = setTimeout(() => setFlashClass(''), 700);
      return () => clearTimeout(timer);
    }, [direction]);

    return flashClass;
  }
  ```

---

## Phase 7 — Global Styles & Layout

- [ ] **7.1 Replace `src/app/globals.css`** with:
  ```css
  @import "tailwindcss";

  @theme {
    --color-pm-blue: #2E5CFF;
    --color-pm-bg: #0D1117;
    --color-pm-card: #161B22;
    --color-pm-card-hover: #1C2333;
    --color-pm-border: #30363D;
    --color-pm-text: #C9D1D9;
    --color-pm-muted: #8B949E;
    --color-pm-green: #3FB68B;
    --color-pm-red: #FF6B6B;

    --font-family-sans: 'Inter', system-ui, sans-serif;

    --animate-flash-green: flash-green 0.65s ease-out forwards;
    --animate-flash-red: flash-red 0.65s ease-out forwards;
    --animate-pulse-soft: pulse-soft 2s ease-in-out infinite;
  }

  @keyframes flash-green {
    0% { background-color: rgba(63, 182, 139, 0.25); }
    100% { background-color: transparent; }
  }

  @keyframes flash-red {
    0% { background-color: rgba(255, 107, 107, 0.25); }
    100% { background-color: transparent; }
  }

  @keyframes pulse-soft {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  html {
    color-scheme: dark;
  }

  body {
    background-color: var(--color-pm-bg);
    color: var(--color-pm-text);
    font-family: var(--font-family-sans);
    -webkit-font-smoothing: antialiased;
  }

  * {
    box-sizing: border-box;
  }

  /* Custom scrollbar */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: var(--color-pm-bg); }
  ::-webkit-scrollbar-thumb { background: var(--color-pm-border); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--color-pm-muted); }

  .flash-green { animation: var(--animate-flash-green); }
  .flash-red { animation: var(--animate-flash-red); }
  ```

  > **Note on Tailwind v4**: custom colors defined in `@theme` become available as utilities automatically, e.g. `bg-pm-bg`, `text-pm-text`, `border-pm-border`. No tailwind.config.ts needed.

- [ ] **7.2 Create `src/components/Providers.tsx`**
  ```tsx
  'use client';

  import { Provider as JotaiProvider } from 'jotai';
  import type { ReactNode } from 'react';

  export function Providers({ children }: { children: ReactNode }) {
    return <JotaiProvider>{children}</JotaiProvider>;
  }
  ```

- [ ] **7.3 Replace `src/app/layout.tsx`**
  ```tsx
  import type { Metadata } from 'next';
  import { Inter } from 'next/font/google';
  import './globals.css';
  import { Providers } from '@/components/Providers';

  const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

  export const metadata: Metadata = {
    title: 'Polymarket',
    description: 'Prediction markets for real-world events',
  };

  export default function RootLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return (
      <html lang="en" className={inter.variable}>
        <body>
          <Providers>
            <div className="min-h-screen flex flex-col">
              <header className="sticky top-0 z-50 border-b border-pm-border bg-pm-bg/95 backdrop-blur-sm">
                <nav className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
                  <a href="/" className="flex items-center gap-2 font-bold text-lg text-white">
                    <span className="text-pm-blue text-2xl">⬡</span>
                    <span>Polymarket</span>
                  </a>
                  <div className="flex items-center gap-3">
                    <button className="text-sm text-pm-muted hover:text-pm-text transition-colors">
                      Log in
                    </button>
                    <button className="text-sm bg-pm-blue hover:bg-pm-blue/90 text-white px-4 py-1.5 rounded-lg font-medium transition-colors">
                      Sign up
                    </button>
                  </div>
                </nav>
              </header>
              <main className="flex-1">{children}</main>
              <footer className="border-t border-pm-border py-6 text-center text-pm-muted text-sm">
                © 2025 Polymarket Clone
              </footer>
            </div>
          </Providers>
        </body>
      </html>
    );
  }
  ```

---

## Phase 8 — Loading Skeletons

- [ ] **8.1 Create `src/components/LoadingSkeleton.tsx`**
  ```tsx
  export function CardSkeleton() {
    return (
      <div className="rounded-xl border border-pm-border bg-pm-card p-5 flex flex-col gap-4 animate-[pulse-soft_2s_ease-in-out_infinite]">
        <div className="h-4 bg-pm-border rounded w-3/4" />
        <div className="h-3 bg-pm-border rounded w-1/2" />
        <div className="h-8 bg-pm-border rounded-lg w-full" />
        <div className="flex justify-between">
          <div className="h-3 bg-pm-border rounded w-1/4" />
          <div className="h-3 bg-pm-border rounded w-1/4" />
        </div>
      </div>
    );
  }

  export function GridSkeleton() {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  export function MarketRowSkeleton() {
    return (
      <div className="border border-pm-border rounded-xl p-5 flex flex-col gap-3 animate-[pulse-soft_2s_ease-in-out_infinite]">
        <div className="h-4 bg-pm-border rounded w-4/5" />
        <div className="h-3 bg-pm-border rounded-full w-full" />
        <div className="flex justify-between">
          <div className="h-8 bg-pm-border rounded-lg w-24" />
          <div className="h-8 bg-pm-border rounded-lg w-24" />
        </div>
      </div>
    );
  }

  export function NavSkeleton() {
    return (
      <div className="flex gap-2 animate-[pulse-soft_2s_ease-in-out_infinite]">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-8 w-20 bg-pm-border rounded-full" />
        ))}
      </div>
    );
  }
  ```

- [ ] **8.2 Create `src/app/loading.tsx`**
  ```tsx
  import { GridSkeleton } from '@/components/LoadingSkeleton';

  export default function HomeLoading() {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 w-20 bg-pm-border rounded-full flex-shrink-0 animate-[pulse-soft_2s_ease-in-out_infinite]" />
          ))}
        </div>
        <GridSkeleton />
      </div>
    );
  }
  ```

- [ ] **8.3 Create `src/app/event/[id]/loading.tsx`**
  ```tsx
  import { MarketRowSkeleton } from '@/components/LoadingSkeleton';

  export default function EventLoading() {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-6">
        <div className="h-8 bg-pm-border rounded w-3/4 animate-[pulse-soft_2s_ease-in-out_infinite]" />
        <div className="h-4 bg-pm-border rounded w-1/4 animate-[pulse-soft_2s_ease-in-out_infinite]" />
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => <MarketRowSkeleton key={i} />)}
        </div>
      </div>
    );
  }
  ```

---

## Phase 9 — Core UI Components

- [ ] **9.1 Create `src/components/ProbabilityBar.tsx`**
  ```tsx
  interface Props {
    prices: number[];
    outcomes: string[];
  }

  export function ProbabilityBar({ prices, outcomes }: Props) {
    const yesPrice = prices[0] ?? 0.5;
    const noPrice = prices[1] ?? 1 - yesPrice;
    const yesLabel = outcomes[0] ?? 'Yes';
    const noLabel = outcomes[1] ?? 'No';

    return (
      <div className="w-full">
        <div className="flex rounded-full overflow-hidden h-2">
          <div
            className="bg-pm-green transition-all duration-500 ease-out"
            style={{ width: `${yesPrice * 100}%` }}
          />
          <div
            className="bg-pm-red transition-all duration-500 ease-out flex-1"
          />
        </div>
        <div className="flex justify-between mt-1.5 text-xs text-pm-muted">
          <span>{yesLabel} {Math.round(yesPrice * 100)}%</span>
          <span>{noLabel} {Math.round(noPrice * 100)}%</span>
        </div>
      </div>
    );
  }
  ```

- [ ] **9.2 Create `src/components/PriceDisplay.tsx`**
  ```tsx
  'use client';

  import { useAtomValue } from 'jotai';
  import { marketPriceFamily } from '@/atoms/priceAtoms';
  import { usePriceAnimation } from '@/hooks/usePriceAnimation';
  import { formatPrice } from '@/lib/utils';

  interface Props {
    marketId: string;
    outcomeIndex?: number;
    className?: string;
    showCents?: boolean;
  }

  export function PriceDisplay({ marketId, outcomeIndex = 0, className = '', showCents }: Props) {
    const prices = useAtomValue(marketPriceFamily(marketId));
    const flashClass = usePriceAnimation(marketId);
    const price = prices[outcomeIndex] ?? 0.5;

    return (
      <span
        className={`tabular-nums rounded px-1 transition-colors duration-150 ${flashClass} ${className}`}
      >
        {showCents ? `${(price * 100).toFixed(0)}¢` : formatPrice(price)}
      </span>
    );
  }
  ```

- [ ] **9.3 Create `src/components/CategoryNav.tsx`**
  ```tsx
  'use client';

  import { useAtom } from 'jotai';
  import { activeCategoryAtom } from '@/atoms/filterAtoms';
  import { CATEGORIES } from '@/lib/constants';

  interface Props {
    availableCategories?: string[];
  }

  export function CategoryNav({ availableCategories }: Props) {
    const [active, setActive] = useAtom(activeCategoryAtom);

    const categories = CATEGORIES.filter((c) => {
      if (c.slug === 'all') return true;
      if (!availableCategories) return true;
      return availableCategories.includes(c.slug);
    });

    return (
      <nav className="flex gap-2 overflow-x-auto pb-1 scrollbar-none" aria-label="Categories">
        {categories.map((cat) => {
          const isActive = active === cat.slug;
          return (
            <button
              key={cat.slug}
              onClick={() => setActive(cat.slug)}
              className={`
                flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200
                ${isActive
                  ? 'bg-pm-blue text-white shadow-[0_0_12px_rgba(46,92,255,0.4)]'
                  : 'bg-pm-card border border-pm-border text-pm-muted hover:text-pm-text hover:border-pm-text/30'
                }
              `}
            >
              {cat.label}
            </button>
          );
        })}
      </nav>
    );
  }
  ```

- [ ] **9.4 Create `src/components/ConnectionBadge.tsx`**
  ```tsx
  'use client';

  import { useAtomValue } from 'jotai';
  import { wsStatusAtom } from '@/atoms/connectionAtoms';

  export function ConnectionBadge() {
    const status = useAtomValue(wsStatusAtom);

    if (status === 'disconnected') return null;

    const config = {
      connecting: { dot: 'bg-yellow-400 animate-pulse', label: 'Connecting…', text: 'text-yellow-400' },
      connected: { dot: 'bg-pm-green', label: 'Live', text: 'text-pm-green' },
      simulated: { dot: 'bg-pm-blue animate-pulse', label: 'Simulated', text: 'text-pm-muted' },
    } as const;

    const c = config[status];
    return (
      <div className={`flex items-center gap-1.5 text-xs ${c.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
        <span>{c.label}</span>
      </div>
    );
  }
  ```

- [ ] **9.5 Create `src/components/EventCard.tsx`**
  ```tsx
  'use client';

  import { memo } from 'react';
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

  function EventCardInner({ event }: Props) {
    const primaryMarket = event.markets[0];
    const prices = useAtomValue(marketPriceFamily(primaryMarket?.id ?? ''));
    const flashClass = usePriceAnimation(primaryMarket?.id ?? '');

    if (!primaryMarket) return null;

    const yesPrice = prices[0] ?? primaryMarket.outcomePrices[0] ?? 0.5;
    const isBullish = yesPrice >= 0.5;

    return (
      <Link
        href={`/event/${event.id}`}
        className="block rounded-xl border border-pm-border bg-pm-card hover:bg-pm-card-hover hover:border-pm-text/20 transition-all duration-200 overflow-hidden group"
      >
        <div className="p-5 flex flex-col gap-4">
          {/* Category tag */}
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs text-pm-muted bg-pm-border/60 px-2 py-0.5 rounded-full">
              {event.category}
            </span>
            {event.endDate && (
              <span className="text-xs text-pm-muted whitespace-nowrap">
                {new Date(event.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-sm font-semibold text-pm-text leading-snug line-clamp-2 group-hover:text-white transition-colors">
            {event.title}
          </h3>

          {/* Probability bar */}
          <ProbabilityBar
            prices={prices}
            outcomes={primaryMarket.outcomes}
          />

          {/* Price + volume row */}
          <div className="flex items-center justify-between pt-1">
            <div className={`flex items-center gap-2 text-sm font-semibold rounded px-1.5 py-0.5 transition-colors ${flashClass}`}>
              <span className={isBullish ? 'text-pm-green' : 'text-pm-red'}>
                {Math.round(yesPrice * 100)}¢
              </span>
              <span className="text-pm-muted text-xs font-normal">
                {primaryMarket.outcomes[0] ?? 'Yes'}
              </span>
            </div>
            <div className="text-xs text-pm-muted">
              Vol: <span className="text-pm-text">{formatVolume(event.volume)}</span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  export const EventCard = memo(EventCardInner);
  ```

- [ ] **9.6 Create `src/components/EventGrid.tsx`**
  ```tsx
  'use client';

  import { useMemo } from 'react';
  import { useAtomValue } from 'jotai';
  import { activeCategoryAtom } from '@/atoms/filterAtoms';
  import { CategoryNav } from './CategoryNav';
  import { EventCard } from './EventCard';
  import { ConnectionBadge } from './ConnectionBadge';
  import { useHydratePrices } from '@/hooks/useHydratePrices';
  import { useWebSocket } from '@/hooks/useWebSocket';
  import type { PolyEvent } from '@/lib/types';

  interface Props {
    events: PolyEvent[];
  }

  export function EventGrid({ events }: Props) {
    const activeCategory = useAtomValue(activeCategoryAtom);

    // Flatten all markets for hydration and WS subscription
    const allMarkets = useMemo(
      () => events.flatMap((e) => e.markets),
      [events]
    );
    const allMarketIds = useMemo(() => allMarkets.map((m) => m.id), [allMarkets]);

    useHydratePrices(allMarkets);
    useWebSocket(allMarketIds);

    // Derive available categories from actual data
    const availableCategories = useMemo(() => {
      const slugs = new Set<string>();
      events.forEach((e) => {
        e.tags.forEach((t) => slugs.add(t.slug.toLowerCase()));
        if (e.category) slugs.add(e.category.toLowerCase());
      });
      return Array.from(slugs);
    }, [events]);

    // Client-side filter
    const filtered = useMemo(() => {
      if (activeCategory === 'all') return events;
      return events.filter((e) => {
        const catMatch = e.category?.toLowerCase() === activeCategory;
        const tagMatch = e.tags.some((t) => t.slug.toLowerCase() === activeCategory);
        return catMatch || tagMatch;
      });
    }, [events, activeCategory]);

    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <CategoryNav availableCategories={availableCategories} />
          <ConnectionBadge />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-pm-muted">
            <p className="text-lg">No events found</p>
            <p className="text-sm mt-1">Try a different category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    );
  }
  ```

---

## Phase 10 — Pages

- [ ] **10.1 Replace `src/app/page.tsx`**
  ```tsx
  import { fetchEvents } from '@/lib/api';
  import { EventGrid } from '@/components/EventGrid';

  export default async function HomePage() {
    const events = await fetchEvents({ limit: 50, active: true });

    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Markets</h1>
          <p className="text-pm-muted text-sm mt-1">
            {events.length} open markets
          </p>
        </div>
        <EventGrid events={events} />
      </div>
    );
  }
  ```

- [ ] **10.2 Create `src/components/MarketRow.tsx`**
  ```tsx
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
                  ${isYes
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

        {/* Stats */}
        <div className="flex gap-4 text-xs text-pm-muted pt-1 border-t border-pm-border">
          <span>Vol: <span className="text-pm-text">{formatVolume(market.volume)}</span></span>
          <span>Liq: <span className="text-pm-text">{formatVolume(market.liquidity)}</span></span>
          {market.bestBid > 0 && (
            <span>
              Spread: <span className="text-pm-text">
                {Math.round((market.bestAsk - market.bestBid) * 100)}¢
              </span>
            </span>
          )}
        </div>
      </div>
    );
  }

  export const MarketRow = memo(MarketRowInner);
  ```

- [ ] **10.3 Create `src/components/EventDetailClient.tsx`**

  This is needed because the detail page needs both hydration and WS hooks (client-side), but the page itself is a server component.

  ```tsx
  'use client';

  import { useHydratePrices } from '@/hooks/useHydratePrices';
  import { useWebSocket } from '@/hooks/useWebSocket';
  import { ConnectionBadge } from './ConnectionBadge';
  import { MarketRow } from './MarketRow';
  import { formatVolume } from '@/lib/utils';
  import type { PolyEvent } from '@/lib/types';

  interface Props {
    event: PolyEvent;
  }

  export function EventDetailClient({ event }: Props) {
    useHydratePrices(event.markets);
    useWebSocket(event.markets.map((m) => m.id));

    return (
      <div className="flex flex-col gap-6">
        {/* Event header */}
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-xl font-bold text-white leading-snug">
              {event.title}
            </h1>
            <ConnectionBadge />
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-pm-muted">
            <span className="bg-pm-border/60 px-2.5 py-0.5 rounded-full text-xs">
              {event.category}
            </span>
            <span>
              Vol: <span className="text-pm-text">{formatVolume(event.volume)}</span>
            </span>
            {event.endDate && (
              <span>
                Ends:{' '}
                <span className="text-pm-text">
                  {new Date(event.endDate).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'short', day: 'numeric',
                  })}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Markets */}
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-pm-muted uppercase tracking-wider">
            Outcomes ({event.markets.length})
          </h2>
          {event.markets.map((market) => (
            <MarketRow key={market.id} market={market} />
          ))}
        </div>
      </div>
    );
  }
  ```

- [ ] **10.4 Create `src/app/event/[id]/page.tsx`**
  ```tsx
  import { notFound } from 'next/navigation';
  import Link from 'next/link';
  import { fetchEventById } from '@/lib/api';
  import { EventDetailClient } from '@/components/EventDetailClient';

  interface Props {
    params: Promise<{ id: string }>;
  }

  export default async function EventPage({ params }: Props) {
    const { id } = await params;
    const event = await fetchEventById(id);

    if (!event) notFound();

    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-pm-muted hover:text-pm-text mb-6 transition-colors"
        >
          ← Back to markets
        </Link>
        <EventDetailClient event={event} />
      </div>
    );
  }
  ```

---

## Phase 11 — Verify & Run

- [ ] **11.1 Check TypeScript compiles**
  ```bash
  pnpm exec tsc --noEmit
  ```
  Fix any errors before proceeding.

- [ ] **11.2 Start dev server**
  ```bash
  pnpm dev
  ```
  Open `http://localhost:3000` and verify:
  - [ ] Homepage loads with event grid (real data or mock fallback)
  - [ ] Category pills filter the grid
  - [ ] Prices update every 2-5 seconds (watch for green/red flashes)
  - [ ] Clicking a card navigates to the detail page
  - [ ] Detail page shows all markets with probability bars
  - [ ] Connection badge shows "Live" or "Simulated"
  - [ ] Loading skeletons appear on hard refresh before content

- [ ] **11.3 Build check**
  ```bash
  pnpm build
  ```
  Should complete with no errors.

---

## Phase 12 — README

- [ ] **12.1 Create `README.md`** with these sections:
  - **Setup** (`pnpm install && pnpm dev`)
  - **Architecture overview** (server fetch → Jotai atoms → WebSocket updates)
  - **Real-time approach** (WebSocket to Polymarket's CLOB WS, simulation fallback)
  - **Known limitations** (no trading, WS may fall back to simulation, auth not implemented)

---

## Known Issues / Edge Cases

| Issue | Handling |
|-------|----------|
| Gamma API down | Falls back to `MOCK_EVENTS` |
| WS requires auth / rejects | Retries 3× then starts price simulation |
| `outcomePrices` is not stringified (some events) | `safeParseJSON` with `[0.5, 0.5]` fallback |
| Event not found by ID | `notFound()` → Next.js 404 page |
| Markets with 0 prices | Initialized to `[0.5, 0.5]` in `useHydratePrices` |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  Server (Next.js)                                           │
│  page.tsx ──fetchEvents()──▶ Gamma API / Mock fallback      │
│                 │                                           │
│                 ▼ props (PolyEvent[])                       │
└─────────────────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  Client (Browser)                                           │
│                                                             │
│  EventGrid / EventDetailClient                              │
│    ├── useHydratePrices() ──▶ marketPriceFamily atoms       │
│    └── useWebSocket()                                       │
│          ├── WSS connection to Polymarket                   │
│          │     onmessage ──▶ update marketPriceFamily atom  │
│          └── simulation fallback (if WS fails)              │
│                setInterval ──▶ drift prices in atoms        │
│                                                             │
│  EventCard / MarketRow / PriceDisplay                       │
│    └── useAtomValue(marketPriceFamily(id))                  │
│          only re-renders if THIS market's atom changed      │
└─────────────────────────────────────────────────────────────┘
```
