import { suggestedBeds, PERSONA_LABELS } from '@/domain/personas';

describe('personas', () => {
  it('suggests beds per persona', () => {
    expect(suggestedBeds('student')).toEqual(['Subjects', 'Exams', 'Assignments', 'Skills']);
    expect(suggestedBeds('jobPrep')).toEqual(['Interview', 'DSA', 'Resume', 'Portfolio']);
    expect(suggestedBeds('professional')).toEqual(['Work', 'Upskilling', 'Side project']);
    expect(suggestedBeds('builder')).toEqual(['Ideas to explore', 'Build', 'Learn', 'Launch']);
  });
  it('other has no suggestions', () => {
    expect(suggestedBeds('other')).toEqual([]);
  });
  it('has labels', () => {
    expect(PERSONA_LABELS).toEqual({
      student: 'Studies',
      jobPrep: 'A new job',
      professional: 'My work',
      builder: 'My own ideas',
      other: 'Something else',
    });
  });
});
