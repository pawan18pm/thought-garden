import type { Plant, Stage } from './types';

export function stageOf(p: Pick<Plant, 'waterCount' | 'bloomedAt'>): Stage {
  if (p.bloomedAt) return 'bloom';
  if (p.waterCount <= 0) return 'seed';
  if (p.waterCount === 1) return 'watered';
  return 'growing';
}
