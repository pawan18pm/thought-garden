export const MAX_THOUGHT_LENGTH = 140;
/** One bed-name limit everywhere: onboarding, Edit beds, Manage beds and the store. */
export const MAX_BED_NAME = 30;

/** Trimmed and clamped bed name, or null when blank. */
export function cleanBedName(raw: string): string | null {
  const t = raw.trim().slice(0, MAX_BED_NAME).trim();
  return t.length > 0 ? t : null;
}

export function validateThought(raw: string): string | null {
  const t = raw.trim();
  if (t.length === 0 || t.length > MAX_THOUGHT_LENGTH) return null;
  return t;
}
