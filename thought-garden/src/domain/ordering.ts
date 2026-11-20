import type { Plant } from './types';

const rank = (p: Plant): number => p.priority ?? 1;

export function sortPlants(plants: Plant[]): Plant[] {
  return [...plants].sort((a, b) => {
    const r = rank(b) - rank(a);
    if (r !== 0) return r;
    return Date.parse(b.createdAt) - Date.parse(a.createdAt);
  });
}
