'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { label: 'Trending', href: '/' },
  { label: 'Sports', href: '/sports' },
  { label: 'Crypto', href: '/crypto' },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <div
      className="flex items-center gap-0.5 overflow-x-auto shrink-0"
      style={{ scrollbarWidth: 'none' }}
    >
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === '/'
            ? pathname === '/' || pathname === ''
            : pathname.startsWith(item.href.split('?')[0]) && item.href !== '/';
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              isActive
                ? 'text-white bg-pm-card border border-pm-border'
                : 'text-pm-muted hover:text-pm-text'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
