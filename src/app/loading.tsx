import { GridSkeleton } from '@/components/LoadingSkeleton';

export default function HomeLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="h-7 bg-pm-border rounded w-24 mb-2" style={{ animation: 'pulse-soft 2s ease-in-out infinite' }} />
        <div className="h-4 bg-pm-border rounded w-32" style={{ animation: 'pulse-soft 2s ease-in-out infinite' }} />
      </div>
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-8 w-20 bg-pm-border rounded-full flex-shrink-0"
            style={{ animation: 'pulse-soft 2s ease-in-out infinite' }}
          />
        ))}
      </div>
      <GridSkeleton />
    </div>
  );
}
