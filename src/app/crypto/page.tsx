import { fetchEventsByTag } from '@/lib/api';
import { CryptoCategoryPage } from '@/components/CryptoCategoryPage';

export default async function CryptoPage() {
  const events = await fetchEventsByTag('crypto', 40);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <CryptoCategoryPage events={events} />
    </div>
  );
}
