export function CardSkeleton() {
  return (
    <div
      className="rounded-xl border border-pm-border bg-pm-card p-5 flex flex-col gap-4"
      style={{ animation: 'pulse-soft 2s ease-in-out infinite' }}
    >
      <div className="flex items-start justify-between">
        <div className="h-5 bg-pm-border rounded-full w-16" />
        <div className="h-4 bg-pm-border rounded w-12" />
      </div>
      <div className="flex flex-col gap-2">
        <div className="h-4 bg-pm-border rounded w-full" />
        <div className="h-4 bg-pm-border rounded w-4/5" />
      </div>
      <div className="h-2 bg-pm-border rounded-full w-full" />
      <div className="flex justify-between items-center">
        <div className="h-6 bg-pm-border rounded w-16" />
        <div className="h-4 bg-pm-border rounded w-20" />
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
    <div
      className="border border-pm-border rounded-xl p-5 flex flex-col gap-3"
      style={{ animation: 'pulse-soft 2s ease-in-out infinite' }}
    >
      <div className="h-4 bg-pm-border rounded w-4/5" />
      <div className="h-2 bg-pm-border rounded-full w-full" />
      <div className="flex gap-3">
        <div className="h-10 bg-pm-border rounded-lg flex-1" />
        <div className="h-10 bg-pm-border rounded-lg flex-1" />
      </div>
      <div className="flex gap-4 pt-1 border-t border-pm-border">
        <div className="h-3 bg-pm-border rounded w-16" />
        <div className="h-3 bg-pm-border rounded w-16" />
      </div>
    </div>
  );
}
