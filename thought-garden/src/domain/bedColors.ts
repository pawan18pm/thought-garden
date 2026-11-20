import { BED_COLOR_ORDER, type BedColorKey } from '@/ui/tokens';

export function nextBedColor(used: BedColorKey[]): BedColorKey {
  const free = BED_COLOR_ORDER.find((c) => !used.includes(c));
  return free ?? BED_COLOR_ORDER[used.length % BED_COLOR_ORDER.length];
}
