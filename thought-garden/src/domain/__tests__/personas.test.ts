import { suggestedBeds, PERSONA_LABELS } from '@/domain/personas';

describe('personas', () => {
  it('suggests beds per persona', () => {
    expect(suggestedBeds('student')).toEqual(['Subjects', 'Exams', 'Assignments', 'Skills']);
    expect(suggestedBeds('jobPrep')).toEqual(['Interview', 'DSA', 'Resume', 'Portfolio']);
    expect(suggestedBeds('professional')).toEqual(['Work', 'Upskilling', 'Side project']);
    expect(suggestedBeds('builder')).toEqual(['Ideas to explore', 'Build', 'Learn', 'Launch']);
  });
  it('has labels', () => {
    expect(PERSONA_LABELS).toEqual({
      student: '🎓 Student',
      jobPrep: '💼 Preparing for a job',
      professional: '🧑‍💻 Working professional',
      builder: '💡 Builder / has ideas',
    });
  });
});
