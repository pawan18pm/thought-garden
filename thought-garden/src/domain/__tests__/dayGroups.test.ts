import { groupDay } from '@/domain/dayGroups';
import type { Plant } from '@/domain/types';

const plant = (id: string): Plant => ({
  id,
  bedId: 'b1',
  text: `thought ${id}`,
  priority: null,
  createdAt: '2026-11-26T10:00:00.000Z',
  bloomedAt: null,
  waterCount: 0,
});

describe('groupDay', () => {
  it('plant in all three lists appears only in bloomed', () => {
    const p = plant('a');
    const g = groupDay({ bloomed: [p], watered: [p], planted: [p] });
    expect(g.bloomed.map((x) => x.id)).toEqual(['a']);
    expect(g.watered).toEqual([]);
    expect(g.planted).toEqual([]);
  });

  it('watered-and-planted appears only in watered', () => {
    const p = plant('a');
    const g = groupDay({ bloomed: [], watered: [p], planted: [p] });
    expect(g.bloomed).toEqual([]);
    expect(g.watered.map((x) => x.id)).toEqual(['a']);
    expect(g.planted).toEqual([]);
  });

  it('no duplicates within a group', () => {
    const p = plant('a');
    const g = groupDay({ bloomed: [p, p], watered: [], planted: [plant('b'), plant('b')] });
    expect(g.bloomed.map((x) => x.id)).toEqual(['a']);
    expect(g.planted.map((x) => x.id)).toEqual(['b']);
  });

  it('preserves order within a group', () => {
    const g = groupDay({
      bloomed: [],
      watered: [plant('c'), plant('a'), plant('b')],
      planted: [],
    });
    expect(g.watered.map((x) => x.id)).toEqual(['c', 'a', 'b']);
  });

  it('empty input → empty groups', () => {
    expect(groupDay({ bloomed: [], watered: [], planted: [] })).toEqual({
      bloomed: [],
      watered: [],
      planted: [],
    });
  });
});
