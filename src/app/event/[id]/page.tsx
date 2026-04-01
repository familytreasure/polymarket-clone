import { notFound } from 'next/navigation';
import { fetchEventById, fetchEvents } from '@/lib/api';
import { EventDetailClient } from '@/components/EventDetailClient';
import { BackLink } from '@/components/BackLink';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EventPage({ params }: Props) {
  const { id } = await params;
  const [event, allEvents] = await Promise.all([
    fetchEventById(id),
    fetchEvents(20),
  ]);

  if (!event) notFound();

  const related = allEvents
    .filter((e) => e.id !== event.id)
    .filter((e) =>
      e.category?.toLowerCase() === event.category?.toLowerCase() ||
      e.tags.some((t) => event.tags.some((et) => et.slug === t.slug))
    )
    .slice(0, 4);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <BackLink />
      <EventDetailClient event={event} relatedEvents={related} />
    </div>
  );
}
