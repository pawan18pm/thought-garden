export const REMINDER_LINES: string[] = [
  "Your garden's waiting. Anything to water today? 🌙",
  'A quick look at your garden? Even one drop counts 💧',
  'Got a thought on your mind? Plant it before it slips away 🌱',
];

export function reminderLine(index: number): string {
  return REMINDER_LINES[index % REMINDER_LINES.length];
}

/** `days` consecutive local dates starting tomorrow (never today) at `time` ('HH:mm'). */
export function reminderDates(now: Date, time: string, days = 14): Date[] {
  const [h, m] = time.split(':').map(Number);
  return Array.from({ length: days }, (_, i) =>
    new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1 + i, h, m, 0, 0),
  );
}
