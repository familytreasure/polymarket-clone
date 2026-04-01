import { GridSkeleton } from '@/components/LoadingSkeleton';

export default function SportsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="h-8 bg-pm-border rounded w-32" style={{ animation: 'pulse-soft 2s ease-in-out infinite' }} />
        <div className="h-4 bg-pm-border rounded w-52" style={{ animation: 'pulse-soft 2s ease-in-out infinite' }} />
      </div>
      {/* Sport filters */}
      <div className="flex gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-8 w-20 bg-pm-border rounded-full flex-shrink-0" style={{ animation: 'pulse-soft 2s ease-in-out infinite' }} />
        ))}
      </div>
      {/* Sort bar */}
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-6 w-20 bg-pm-border rounded-lg" style={{ animation: 'pulse-soft 2s ease-in-out infinite' }} />
        ))}
      </div>
      <GridSkeleton />
    </div>
  );
}
