import { GridSkeleton } from '@/components/LoadingSkeleton';

export default function CryptoLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="h-8 bg-pm-border rounded w-32" style={{ animation: 'pulse-soft 2s ease-in-out infinite' }} />
        <div className="h-4 bg-pm-border rounded w-52" style={{ animation: 'pulse-soft 2s ease-in-out infinite' }} />
      </div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 bg-pm-card border border-pm-border rounded-xl" style={{ animation: 'pulse-soft 2s ease-in-out infinite' }} />
        ))}
      </div>
      {/* Asset filters */}
      <div className="flex gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-8 w-16 bg-pm-border rounded-full flex-shrink-0" style={{ animation: 'pulse-soft 2s ease-in-out infinite' }} />
        ))}
      </div>
      {/* Featured */}
      <div className="h-48 bg-pm-card border border-pm-border rounded-2xl" style={{ animation: 'pulse-soft 2s ease-in-out infinite' }} />
      <GridSkeleton />
    </div>
  );
}
