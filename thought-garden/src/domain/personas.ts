import type { Persona } from '@/domain/types';

const BEDS: Record<Persona, string[]> = {
  student: ['Subjects', 'Exams', 'Assignments', 'Skills'],
  jobPrep: ['Interview', 'DSA', 'Resume', 'Portfolio'],
  professional: ['Work', 'Upskilling', 'Side project'],
  builder: ['Ideas to explore', 'Build', 'Learn', 'Launch'],
  other: [],
};

export function suggestedBeds(p: Persona): string[] {
  return [...BEDS[p]];
}

export const PERSONA_LABELS: Record<Persona, string> = {
  student: 'Studies',
  jobPrep: 'A new job',
  professional: 'My work',
  builder: 'My own ideas',
  other: 'Something else',
};
