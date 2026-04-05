'use client';

import { useAtom } from 'jotai';
import { searchQueryAtom } from '@/atoms/filterAtoms';
import { useRef, useState, useEffect, useCallback } from 'react';

export function SearchBar() {
  const [query, setQuery] = useAtom(searchQueryAtom);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === '/' && !focused && document.activeElement?.tagName !== 'INPUT') {
      e.preventDefault();
      inputRef.current?.focus();
    }
    if (e.key === 'Escape' && focused) {
      inputRef.current?.blur();
    }
  }, [focused]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className={`relative flex items-center w-full md:flex-1 md:max-w-md transition-all duration-200 ${focused ? 'md:max-w-lg' : ''}`}>
      <svg
        className="absolute left-3 w-4 h-4 text-pm-muted pointer-events-none"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Search polymarkets..."
        className="w-full h-9 pl-9 pr-8 rounded-lg bg-pm-card border border-pm-border text-sm text-pm-text placeholder:text-pm-muted/60 focus:outline-none focus:border-pm-blue/50 focus:ring-1 focus:ring-pm-blue/20 transition-all"
      />
      {query ? (
        <button
          onClick={() => setQuery('')}
          className="absolute right-2 w-5 h-5 flex items-center justify-center rounded text-pm-muted hover:text-pm-text transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      ) : (
        <kbd className="absolute right-2 text-[10px] text-pm-muted/50 bg-pm-border/40 px-1.5 py-0.5 rounded font-mono">
          /
        </kbd>
      )}
    </div>
  );
}
