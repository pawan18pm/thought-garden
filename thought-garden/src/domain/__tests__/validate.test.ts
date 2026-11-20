import { validateThought } from '../validate';

describe('validateThought', () => {
  it('trims', () => expect(validateThought('  hi  ')).toBe('hi'));
  it('rejects empty', () => expect(validateThought('')).toBeNull());
  it('rejects whitespace only', () => expect(validateThought('   \n ')).toBeNull());
  it('accepts 140 chars', () => expect(validateThought('a'.repeat(140))).toBe('a'.repeat(140)));
  it('rejects 141 chars', () => expect(validateThought('a'.repeat(141))).toBeNull());
});
