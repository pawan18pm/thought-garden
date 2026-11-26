import { addDays, format, formatISO } from 'date-fns';

export function dayKey(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

export function nowIso(): string {
  return formatISO(new Date());
}

export function monthGrid(year: number, month0: number): (string | null)[] {
  const first = new Date(year, month0, 1);
  const lead = (first.getDay() + 6) % 7;
  const days = new Date(year, month0 + 1, 0).getDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < 42; i++) {
    const n = i - lead;
    cells.push(n >= 0 && n < days ? dayKey(addDays(first, n)) : null);
  }
  return cells;
}
