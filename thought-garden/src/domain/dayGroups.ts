import type { Plant } from '@/domain/types';

export interface DayActivity {
  bloomed: Plant[];
  watered: Plant[];
  planted: Plant[];
}

// Each plant appears once, in its furthest group (bloomed > watered > planted).
// Order within a group follows the input; duplicates within a group are dropped.
export function groupDay(d: DayActivity): DayActivity {
  const claimed = new Set<string>();
  const take = (list: Plant[]): Plant[] => {
    const out: Plant[] = [];
    for (const p of list) {
      if (claimed.has(p.id)) continue;
      claimed.add(p.id);
      out.push(p);
    }
    return out;
  };
  const bloomed = take(d.bloomed);
  const watered = take(d.watered);
  const planted = take(d.planted);
  return { bloomed, watered, planted };
}
