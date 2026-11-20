// Shared helpers for feature tests (not a test file itself).
import type { Bed, Plant } from '@/domain/types';

export const bedA: Bed = { id: 'bA', name: 'Interview', color: 'blue', position: 0, isIdeas: false, folded: false, createdAt: '2026-01-01T00:00:00Z' };
export const bedB: Bed = { id: 'bB', name: 'DSA', color: 'orange', position: 1, isIdeas: false, folded: false, createdAt: '2026-01-01T00:00:00Z' };
export const ideas: Bed = { id: 'bI', name: 'Ideas', color: 'ideas', position: 2, isIdeas: true, folded: false, createdAt: '2026-01-01T00:00:00Z' };

export const mkPlant = (over: Partial<Plant> = {}): Plant => ({
  id: 'p1',
  bedId: 'bA',
  text: 'Learn SQL',
  priority: null,
  createdAt: '2026-01-01T00:00:00Z',
  bloomedAt: null,
  waterCount: 0,
  ...over,
});
