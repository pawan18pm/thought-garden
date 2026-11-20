import { greetingFor } from '@/domain/greeting';

describe('greetingFor', () => {
  it.each([
    [5, 'Good morning'], [11, 'Good morning'],
    [12, 'Good afternoon'], [16, 'Good afternoon'],
    [17, 'Good evening'], [20, 'Good evening'],
    [21, 'Good night'], [0, 'Good night'], [4, 'Good night'],
  ])('hour %i -> %s', (h, s) => {
    expect(greetingFor(h)).toBe(s);
  });
});
