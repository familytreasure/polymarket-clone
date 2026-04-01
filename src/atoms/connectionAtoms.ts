import { atom } from 'jotai';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'simulated';

export const wsStatusAtom = atom<ConnectionStatus>('disconnected');
