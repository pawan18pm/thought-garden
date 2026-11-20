import { nextBedColor } from '@/domain/bedColors';

describe('nextBedColor', () => {
  it('picks first unused', () => {
    expect(nextBedColor([])).toBe('blue');
    expect(nextBedColor(['blue'])).toBe('orange');
    expect(nextBedColor(['blue', 'purple'])).toBe('orange');
  });
  it('cycles by count when all used', () => {
    expect(nextBedColor(['blue', 'orange', 'purple', 'yellow', 'green', 'pink'])).toBe('blue');
  });
});
