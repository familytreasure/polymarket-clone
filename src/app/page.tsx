import { fetchEvents } from '@/lib/api';
import { EventGrid } from '@/components/EventGrid';

export default async function HomePage() {
  const events = await fetchEvents(30);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
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
