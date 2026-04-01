import { fetchEventsByTag } from '@/lib/api';
import { SportsCategoryPage } from '@/components/SportsCategoryPage';

export default async function SportsPage() {
  const events = await fetchEventsByTag('sports', 40);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <SportsCategoryPage events={events} />
    </div>
  );
}
