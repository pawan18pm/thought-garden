import { bedColors, BED_COLOR_ORDER, colors, radius } from '../tokens';

describe('tokens', () => {
  it('has bed colors', () => {
    expect(bedColors.blue).toBe('#D6E6FF');
  });
  it('has bed color order', () => {
    expect(BED_COLOR_ORDER).toEqual(['blue', 'orange', 'purple', 'yellow', 'green', 'pink']);
  });
  it('has paper color', () => {
    expect(colors.paper).toBe('#FBF7EF');
  });
  it('has card radius', () => {
    expect(radius.card).toBe(22);
  });
});
