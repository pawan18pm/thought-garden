export type DayState = 'empty' | 'planted' | 'watered' | 'bloomed';

export interface DayActivity {
  planted: number;
  watered: number;
  bloomed: number;
}

export function dayState(a: DayActivity): DayState {
  if (a.bloomed > 0) return 'bloomed';
  if (a.watered > 0) return 'watered';
  if (a.planted > 0) return 'planted';
  return 'empty';
}
