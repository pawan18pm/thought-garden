export const MAX_THOUGHT_LENGTH = 140;

export function validateThought(raw: string): string | null {
  const t = raw.trim();
  if (t.length === 0 || t.length > MAX_THOUGHT_LENGTH) return null;
  return t;
}
