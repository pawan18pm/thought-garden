import type { Bed, Plant } from './types';

const rank = (p: Plant): number => p.priority ?? 1;

export function sortPlants(plants: Plant[]): Plant[] {
  return [...plants].sort((a, b) => {
    const r = rank(b) - rank(a);
    if (r !== 0) return r;
    return Date.parse(b.createdAt) - Date.parse(a.createdAt);
  });
}

/** User beds by position, the Ideas bed always last. */
export function orderBeds(beds: Bed[]): Bed[] {
  return [...beds].sort((a, b) => Number(a.isIdeas) - Number(b.isIdeas) || a.position - b.position);
}
