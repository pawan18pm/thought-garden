import type { Persona } from '@/domain/types';

const BEDS: Record<Persona, string[]> = {
  student: ['Subjects', 'Exams', 'Assignments', 'Skills'],
  jobPrep: ['Interview', 'DSA', 'Resume', 'Portfolio'],
  professional: ['Work', 'Upskilling', 'Side project'],
  builder: ['Ideas to explore', 'Build', 'Learn', 'Launch'],
};

export function suggestedBeds(p: Persona): string[] {
  return [...BEDS[p]];
}

export const PERSONA_LABELS: Record<Persona, string> = {
  student: '🎓 Student',
  jobPrep: '💼 Preparing for a job',
  professional: '🧑‍💻 Working professional',
  builder: '💡 Builder / has ideas',
};
