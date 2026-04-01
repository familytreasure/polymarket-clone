import { MarketRowSkeleton } from '@/components/LoadingSkeleton';

export default function EventLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-6">
      <div className="h-4 bg-pm-border rounded w-24" style={{ animation: 'pulse-soft 2s ease-in-out infinite' }} />
      <div className="flex flex-col gap-2">
        <div className="h-7 bg-pm-border rounded w-3/4" style={{ animation: 'pulse-soft 2s ease-in-out infinite' }} />
        <div className="h-7 bg-pm-border rounded w-1/2" style={{ animation: 'pulse-soft 2s ease-in-out infinite' }} />
      </div>
      <div className="flex gap-3">
        <div className="h-5 bg-pm-border rounded-full w-16" style={{ animation: 'pulse-soft 2s ease-in-out infinite' }} />
        <div className="h-5 bg-pm-border rounded w-20" style={{ animation: 'pulse-soft 2s ease-in-out infinite' }} />
      </div>
      <div className="flex flex-col gap-4 mt-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <MarketRowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
