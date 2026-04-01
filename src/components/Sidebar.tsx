'use client';

import { cn } from '@/lib/utils';

export interface SidebarItem {
  key: string;
  label: string;
  icon?: string;
  count?: number;
}

export interface SidebarSection {
  title?: string;
  items: SidebarItem[];
}

interface Props {
  sections: SidebarSection[];
  activeKey: string;
  onSelect: (key: string) => void;
}

export function Sidebar({ sections, activeKey, onSelect }: Props) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-48 shrink-0 gap-4 sticky top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto pr-2" style={{ scrollbarWidth: 'none' }}>
        {sections.map((section, si) => (
          <div key={si} className="flex flex-col gap-0.5">
            {section.title && (
              <h3 className="text-[10px] font-semibold text-pm-muted uppercase tracking-wider px-3 py-2">
                {section.title}
              </h3>
            )}
            {section.items.map((item) => {
              const isActive = activeKey === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => onSelect(item.key)}
                  className={cn(
                    'flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 text-left cursor-pointer',
                    isActive
                      ? 'bg-pm-card border border-pm-border text-white'
                      : 'text-pm-muted hover:text-pm-text hover:bg-pm-card/50'
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {item.icon && <span className="text-base shrink-0">{item.icon}</span>}
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.count != null && item.count > 0 && (
                    <span className={cn(
                      'text-xs tabular-nums shrink-0',
                      isActive ? 'text-pm-text' : 'text-pm-muted/60'
                    )}>
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </aside>

      {/* Mobile horizontal strip */}
      <div
        className="flex lg:hidden gap-2 overflow-x-auto pb-1"
        style={{ scrollbarWidth: 'none' }}
      >
        {sections.flatMap((s) => s.items).map((item) => {
          const isActive = activeKey === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onSelect(item.key)}
              className={cn(
                'shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer',
                isActive
                  ? 'bg-pm-blue text-white'
                  : 'bg-pm-card border border-pm-border text-pm-muted hover:text-pm-text hover:border-pm-text/30'
              )}
              style={isActive ? { boxShadow: '0 0 12px rgba(46,92,255,0.35)' } : undefined}
            >
              {item.icon && <span className="text-sm">{item.icon}</span>}
              {item.label}
              {item.count != null && item.count > 0 && (
                <span className={cn(
                  'text-xs rounded-full px-1.5 py-0.5',
                  isActive ? 'bg-white/20' : 'bg-pm-border text-pm-muted'
                )}>
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}
