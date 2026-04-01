import { atom } from 'jotai';

export const activeCategoryAtom = atom<string>('all');
export const searchQueryAtom = atom<string>('');
