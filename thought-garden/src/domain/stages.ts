import type { Plant, Stage } from './types';

export const BLOOM_AT_WATERS = 3;

export function canBloomNow(p: Pick<Plant, 'waterCount' | 'bloomedAt'>): boolean {
  return !p.bloomedAt && p.waterCount >= 1;
}

export function stageOf(p: Pick<Plant, 'waterCount' | 'bloomedAt'>): Stage {
  if (p.bloomedAt) return 'bloom';
  if (p.waterCount <= 0) return 'seed';
  if (p.waterCount === 1) return 'watered';
  return 'growing';
}
