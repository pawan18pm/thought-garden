import { orderBeds, sortPlants } from '../ordering';
import type { Bed, Plant, Priority } from '../types';

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

describe('orderBeds', () => {
  const bed = (id: string, position: number, isIdeas = false): Bed => ({
    id, name: id, color: isIdeas ? 'ideas' : 'blue', position, isIdeas, folded: false, createdAt: '2026-01-01T00:00:00Z',
  });
  it('sorts user beds by position with Ideas last, without mutating', () => {
    const input = [bed('ideas', 0, true), bed('c', 2), bed('a', 0), bed('b', 1)];
    expect(orderBeds(input).map((b) => b.id)).toEqual(['a', 'b', 'c', 'ideas']);
    expect(input[0].id).toBe('ideas');
  });
});
