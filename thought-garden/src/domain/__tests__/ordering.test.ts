import { sortPlants } from '../ordering';
import type { Plant, Priority } from '../types';

const mk = (id: string, priority: Priority, createdAt: string): Plant => ({
  id, bedId: 'b', text: id, priority, createdAt, bloomedAt: null, waterCount: 0,
});

describe('sortPlants', () => {
  const input = [
    mk('a', null, '2026-11-01T00:00:00Z'),
    mk('b', 3, '2026-11-02T00:00:00Z'),
    mk('c', 1, '2026-11-03T00:00:00Z'),
    mk('d', 2, '2026-11-04T00:00:00Z'),
    mk('e', 3, '2026-11-05T00:00:00Z'),
  ];

  it('orders High, Medium, then Low/null, newest first within a rank', () => {
    expect(sortPlants(input).map((p) => p.id)).toEqual(['e', 'b', 'd', 'c', 'a']);
  });

  it('does not mutate input and returns a new array', () => {
    const copy = [...input];
    const out = sortPlants(input);
    expect(out).not.toBe(input);
    expect(input).toEqual(copy);
  });
});
