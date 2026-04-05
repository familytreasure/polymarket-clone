import { notFound } from 'next/navigation';
import { fetchEventById, fetchEvents } from '@/lib/api';
import { EventDetailClient } from '@/components/EventDetailClient';
import { BackLink } from '@/components/BackLink';
import { MOCK_EVENTS } from '@/mock/data';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const apiEvents = await fetchEvents(50).catch(() => []);
  const allIds = new Set([
    ...MOCK_EVENTS.map((e) => e.id),
    ...MOCK_EVENTS.map((e) => e.slug),
    ...apiEvents.map((e) => e.id),
    ...apiEvents.map((e) => e.slug),
  ]);
  return Array.from(allIds).map((id) => ({ id }));
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
