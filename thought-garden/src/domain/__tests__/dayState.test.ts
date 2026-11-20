import { dayState } from '@/domain/dayState';

describe('dayState', () => {
  it('maps activity to state with bloomed > watered > planted > empty', () => {
    expect(dayState({ planted: 0, watered: 0, bloomed: 0 })).toBe('empty');
    expect(dayState({ planted: 2, watered: 0, bloomed: 0 })).toBe('planted');
    expect(dayState({ planted: 1, watered: 3, bloomed: 0 })).toBe('watered');
    expect(dayState({ planted: 0, watered: 0, bloomed: 1 })).toBe('bloomed');
    expect(dayState({ planted: 0, watered: 5, bloomed: 1 })).toBe('bloomed');
  });
});
