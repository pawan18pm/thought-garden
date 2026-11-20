import { bloomLine } from '../bloomCopy';

describe('bloomLine', () => {
  it('singular', () => expect(bloomLine(1)).toBe('1 thought bloomed. Nice start.'));
  it('two and three', () => {
    expect(bloomLine(2)).toBe('2 thoughts bloomed. Nice work.');
    expect(bloomLine(3)).toBe('3 thoughts bloomed. Nice work.');
  });
  it('four+', () => expect(bloomLine(4)).toBe("4 thoughts bloomed. You're on a roll!"));
});
