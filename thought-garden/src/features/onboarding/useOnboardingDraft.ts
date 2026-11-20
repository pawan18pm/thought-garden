import { create } from 'zustand';
import type { Persona } from '@/domain/types';
import { suggestedBeds } from '@/domain/personas';

export interface DraftBed {
  key: string;
  name: string;
  selected: boolean;
}

export const MAX_BEDS = 6;

interface Draft {
  persona: Persona | null;
  beds: DraftBed[];
  firstBedId: string | null;
  setPersona(p: Persona): void;
  toggle(key: string): void;
  rename(key: string, name: string): void;
  addCustom(): string;
  setFirstBedId(id: string): void;
  reset(): void;
}

let counter = 0;

export const useOnboardingDraft = create<Draft>()((set) => ({
  persona: null,
  beds: [],
  firstBedId: null,
  setPersona: (persona) =>
    set({
      persona,
      beds: suggestedBeds(persona).map((name, i) => ({ key: `s${i}`, name, selected: true })),
    }),
  toggle: (key) => set((s) => ({ beds: s.beds.map((b) => (b.key === key ? { ...b, selected: !b.selected } : b)) })),
  rename: (key, name) => set((s) => ({ beds: s.beds.map((b) => (b.key === key ? { ...b, name } : b)) })),
  addCustom: () => {
    const key = `c${++counter}`;
    set((s) => ({ beds: [...s.beds, { key, name: 'New bed', selected: true }] }));
    return key;
  },
  setFirstBedId: (firstBedId) => set({ firstBedId }),
  reset: () => set({ persona: null, beds: [], firstBedId: null }),
}));
