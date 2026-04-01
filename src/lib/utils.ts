export function formatVolume(raw: unknown): string {
  const value = Number(raw);
  if (!isFinite(value) || value === 0) return '$0';
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
