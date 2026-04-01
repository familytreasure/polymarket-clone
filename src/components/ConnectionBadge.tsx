'use client';

import { useAtomValue } from 'jotai';
import { wsStatusAtom } from '@/atoms/connectionAtoms';

export function ConnectionBadge() {
  const status = useAtomValue(wsStatusAtom);

  if (status === 'disconnected') return null;

  const config = {
    connecting: {
      dot: 'bg-yellow-400',
      dotAnimation: 'animate-pulse',
      label: 'Connecting…',
      textColor: 'text-yellow-400',
    },
    connected: {
      dot: 'bg-pm-green',
      dotAnimation: '',
      label: 'Live',
      textColor: 'text-pm-green',
    },
    simulated: {
      dot: 'bg-pm-blue',
      dotAnimation: 'animate-pulse',
      label: 'Simulated',
      textColor: 'text-pm-muted',
    },
  } as const;

  const c = config[status];

  return (
    <div className={`flex items-center gap-1.5 text-xs ${c.textColor} flex-shrink-0`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} ${c.dotAnimation}`} />
      <span>{c.label}</span>
    </div>
  );
}
