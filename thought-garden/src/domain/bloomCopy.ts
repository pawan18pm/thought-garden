export function bloomLine(n: number): string {
  if (n === 1) return '1 thought bloomed. Nice start.';
  if (n <= 3) return `${n} thoughts bloomed. Nice work.`;
  return `${n} thoughts bloomed. You're on a roll!`;
}
