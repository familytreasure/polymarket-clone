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
        marketIds.forEach((id) => {
          ws?.send(
            JSON.stringify({
              auth: { apiKey: '' },
              type: 'Market',
              conditions: [id],
            })
          );
        });
      };

      ws.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data as string);
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
