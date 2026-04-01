'use client';

import { useRouter } from 'next/navigation';

export function BackLink() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className="inline-flex items-center gap-1 text-sm text-pm-muted hover:text-pm-text mb-6 transition-colors cursor-pointer"
    >
      ← Back to markets
    </button>
  );
}
