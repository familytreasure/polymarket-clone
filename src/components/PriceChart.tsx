'use client';

import { useEffect, useRef, useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { marketPriceFamily } from '@/atoms/priceAtoms';

interface Props {
  marketId: string;
  basePrice: number;
  height?: number;
}

export function PriceChart({ marketId, basePrice, height = 120 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentPrices = useAtomValue(marketPriceFamily(marketId));
  const historyRef = useRef<number[]>([]);

  // Generate synthetic historical data around the base price
  const syntheticHistory = useMemo(() => {
    const points: number[] = [];
    let price = basePrice;
    for (let i = 0; i < 30; i++) {
      const drift = (Math.random() - 0.5) * 0.04;
      price = Math.max(0.02, Math.min(0.98, price + drift));
      points.push(price);
    }
    points[points.length - 1] = basePrice;
    return points;
  }, [basePrice]);

  useEffect(() => {
    if (historyRef.current.length === 0) {
      historyRef.current = [...syntheticHistory];
    }
    const currentYes = currentPrices[0] ?? basePrice;
    historyRef.current.push(currentYes);
    if (historyRef.current.length > 60) {
      historyRef.current = historyRef.current.slice(-60);
    }
  }, [currentPrices, syntheticHistory, basePrice]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const data = historyRef.current.length > 1 ? historyRef.current : syntheticHistory;
    const padding = { top: 10, bottom: 20, left: 0, right: 40 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    const min = Math.max(0, Math.min(...data) - 0.05);
    const max = Math.min(1, Math.max(...data) + 0.05);
    const range = max - min || 0.1;

    ctx.clearRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = 'rgba(48, 54, 61, 0.5)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();
    }

    // Gradient fill
    const gradient = ctx.createLinearGradient(0, padding.top, 0, h - padding.bottom);
    const lastPrice = data[data.length - 1] ?? basePrice;
    const isUp = lastPrice >= basePrice;
    if (isUp) {
      gradient.addColorStop(0, 'rgba(63, 182, 139, 0.15)');
      gradient.addColorStop(1, 'rgba(63, 182, 139, 0)');
    } else {
      gradient.addColorStop(0, 'rgba(255, 107, 107, 0.15)');
      gradient.addColorStop(1, 'rgba(255, 107, 107, 0)');
    }

    const getX = (i: number) => padding.left + (i / (data.length - 1)) * chartW;
    const getY = (v: number) => padding.top + (1 - (v - min) / range) * chartH;

    // Fill area
    ctx.beginPath();
    ctx.moveTo(getX(0), h - padding.bottom);
    data.forEach((v, i) => ctx.lineTo(getX(i), getY(v)));
    ctx.lineTo(getX(data.length - 1), h - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Price line
    ctx.beginPath();
    data.forEach((v, i) => {
      if (i === 0) ctx.moveTo(getX(i), getY(v));
      else ctx.lineTo(getX(i), getY(v));
    });
    ctx.strokeStyle = isUp ? '#3FB68B' : '#FF6B6B';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Current price dot
    const lastX = getX(data.length - 1);
    const lastY = getY(lastPrice);
    ctx.beginPath();
    ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
    ctx.fillStyle = isUp ? '#3FB68B' : '#FF6B6B';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(lastX, lastY, 7, 0, Math.PI * 2);
    ctx.strokeStyle = isUp ? 'rgba(63,182,139,0.3)' : 'rgba(255,107,107,0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Price labels on right
    ctx.fillStyle = '#8B949E';
    ctx.font = '10px Inter, system-ui, sans-serif';
    ctx.textAlign = 'right';
    const percentages = [min, min + range * 0.5, max];
    percentages.forEach((v) => {
      const y = getY(v);
      ctx.fillText(`${Math.round(v * 100)}%`, w - 2, y + 3);
    });
  }, [currentPrices, syntheticHistory, basePrice, height]);

  return (
    <div className="bg-pm-card border border-pm-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-pm-muted uppercase tracking-wider">
          Price History
        </h3>
        <div className="flex gap-2 text-[10px] text-pm-muted">
          <span className="px-2 py-0.5 rounded bg-pm-border/40 text-pm-text">1D</span>
          <span className="px-2 py-0.5 rounded hover:text-pm-text cursor-pointer transition-colors">1W</span>
          <span className="px-2 py-0.5 rounded hover:text-pm-text cursor-pointer transition-colors">1M</span>
          <span className="px-2 py-0.5 rounded hover:text-pm-text cursor-pointer transition-colors">All</span>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: `${height}px` }}
        className="block"
      />
    </div>
  );
}
