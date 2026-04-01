'use client';

import { useAtom } from 'jotai';
import { activeCategoryAtom } from '@/atoms/filterAtoms';
import { CATEGORIES } from '@/lib/constants';

interface Props {
  availableCategories?: string[];
}

export function CategoryNav({ availableCategories }: Props) {
  const [active, setActive] = useAtom(activeCategoryAtom);

  const categories = CATEGORIES.filter((c) => {
    if (c.slug === 'all') return true;
    if (!availableCategories) return true;
    return availableCategories.some(
      (a) => a.toLowerCase() === c.slug.toLowerCase()
    );
  });

  return (
    <nav
      className="flex gap-2 overflow-x-auto pb-1"
      style={{ scrollbarWidth: 'none' }}
      aria-label="Categories"
    >
      {categories.map((cat) => {
        const isActive = active === cat.slug;
        return (
          <button
            key={cat.slug}
            onClick={() => setActive(cat.slug)}
            className={`
              flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer
              ${
                isActive
                  ? 'bg-pm-blue text-white'
                  : 'bg-pm-card border border-pm-border text-pm-muted hover:text-pm-text hover:border-pm-text/30'
              }
            `}
            style={
              isActive
                ? { boxShadow: '0 0 12px rgba(46,92,255,0.35)' }
                : undefined
            }
          >
            {cat.label}
          </button>
        );
      })}
    </nav>
  );
}
