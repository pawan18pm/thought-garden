import { reminderDates, reminderLine, REMINDER_LINES } from '@/domain/reminder';

describe('reminderDates', () => {
  it('returns 14 days starting tomorrow', () => {
    const d = reminderDates(new Date(2026, 10, 19, 8, 0), '21:00');
    expect(d).toHaveLength(14);
    expect(d[0]).toEqual(new Date(2026, 10, 20, 21, 0, 0));
    expect(d[13]).toEqual(new Date(2026, 11, 3, 21, 0, 0));
    expect(d.some((x) => x.getDate() === 19 && x.getMonth() === 10)).toBe(false);
  });
  it('still starts tomorrow when now is late', () => {
    expect(reminderDates(new Date(2026, 10, 19, 22, 0), '21:00')[0]).toEqual(new Date(2026, 10, 20, 21, 0, 0));
  });
});
describe('reminderLine', () => {
  it('cycles', () => {
    expect(reminderLine(0)).toBe(REMINDER_LINES[0]);
    expect(reminderLine(REMINDER_LINES.length + 1)).toBe(REMINDER_LINES[1]);
  });
});
