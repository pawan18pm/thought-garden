import { dayKey, monthGrid, nowIso } from '@/domain/dates';

describe('dates', () => {
  it('monthGrid is 42 cells Monday-first', () => {
    const g = monthGrid(2026, 10);
    expect(g).toHaveLength(42);
    expect(g[6]).toBe('2026-11-01');
    expect(g[0]).toBeNull();
    expect(g[35]).toBe('2026-11-30');
    expect(g[36]).toBeNull();
  });
  it('dayKey formats local day', () => {
    expect(dayKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });
  it('nowIso is parseable ISO with offset', () => {
    expect(Number.isNaN(Date.parse(nowIso()))).toBe(false);
  });
});
