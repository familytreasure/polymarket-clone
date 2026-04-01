# Polymarket Clone

A Next.js application replicating the core Polymarket prediction market experience with live price updates, category filtering, and a dark-themed UI.

## Prerequisites

- **Node.js** ≥ 18 (tested on 20+)
- **pnpm** — install with `npm install -g pnpm` if needed

## Setup

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
pnpm build   # production build
pnpm start   # serve production build
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Homepage — events grid with category pills, sorting, search, featured hero card |
| `/crypto` | Dedicated crypto page — asset filters (BTC, ETH, SOL…), market-type subtabs, stats |
| `/sports` | Dedicated sports page — league filters (NBA, NFL, NHL…), live/futures toggle, sort |
| `/event/[id]` | Event detail — price chart, all market outcomes, trade slip sidebar, related markets |

## Architecture Overview

```
Server (page.tsx)
  └── fetchEvents() → Gamma API (30s cache via unstable_cache) → mock fallback
        └── passes PolyEvent[] as props to client component

Client (EventGrid / EventDetailClient)
  ├── useHydratePrices()  — writes server prices into Jotai atoms on mount
  ├── useWebSocket()      — connects to Polymarket WS, updates atoms on message
  │                         falls back to price simulation if WS fails
  └── renders EventCard / MarketRow
        └── each reads its own marketPriceFamily(id) atom
              → only that component re-renders on price update
```

**Key files:**

| File | Purpose |
|------|---------|
| `src/lib/api.ts` | Server-side fetch with `unstable_cache` (30s TTL) and mock fallback |
| `src/lib/parse.ts` | Normalizes Gamma API quirks (stringified JSON arrays, missing fields) |
| `src/atoms/priceAtoms.ts` | Jotai `atomFamily` — one atom per market ID |
| `src/hooks/useWebSocket.ts` | WebSocket lifecycle + simulation fallback |
| `src/hooks/useHydratePrices.ts` | Seeds price atoms from server-fetched data |
| `src/components/EventGrid.tsx` | Home page client orchestrator: hydration + WS + filtering |
| `src/components/CryptoCategoryPage.tsx` | Crypto page with asset filters and subtabs |
| `src/components/SportsCategoryPage.tsx` | Sports page with league filters and live/futures toggle |
| `src/components/EventDetailClient.tsx` | Detail page: chart, outcomes, trade slip, related markets |

## Real-Time Approach

1. **WebSocket** — connects to `wss://ws-subscriptions-clob.polymarket.com/ws/market`
2. On each price message, the corresponding `marketPriceFamily(id)` atom is updated
3. Only components subscribed to that specific atom re-render (O(1) per update)
4. `usePriceAnimation` detects direction changes and applies a brief green/red flash

**Simulation fallback**: if the WebSocket fails 3 times (e.g. requires auth in certain regions), a `setInterval` randomly drifts prices by ±1.25% every 2–5 seconds. The connection badge shows "Live" vs "Simulated" so the state is always visible.

## Offline Resilience

The app works fully without access to the Polymarket API:

- **Data** — falls back to 32 built-in mock events across Crypto (10), Sports (9), Politics (4), Business (3), Pop Culture (3), and Science (3)
- **Prices** — simulation mode activates automatically, updating prices in real time
- **All pages** — `/`, `/crypto`, `/sports`, and `/event/[id]` work with mock data

## Performance

- **Atomic state** — Jotai `atomFamily` ensures a price update only re-renders the affected card, not the entire grid
- **Memoization** — `EventCard`, `MarketRow`, and `OutcomeRow` are wrapped in `React.memo`; derived data uses `useMemo`
- **Server caching** — `unstable_cache` with 30s revalidation avoids redundant API calls
- **No full-tree re-renders** — price updates flow through atoms, bypassing React's prop-diffing tree

## Known Limitations

- **No trading** — Buy/Sell buttons are visual only (no wallet integration)
- **WebSocket auth** — The Polymarket WS endpoint may require API credentials in some regions; simulation mode activates automatically
- **Gamma API TLS** — In some network environments (e.g. ISP DNS hijacking), the Gamma API is unreachable; the app falls back to built-in mock data
- **No user accounts** — Login/Sign up buttons are non-functional
- **Event images** — Not displayed (Gamma API sometimes omits image URLs)
