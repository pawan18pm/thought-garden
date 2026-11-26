import { create } from 'zustand';
import type { Persona } from '@/domain/types';
import { suggestedBeds } from '@/domain/personas';
import { nextBedColor } from '@/domain/bedColors';
import { BED_COLOR_ORDER, type BedColorKey } from '@/ui/tokens';

export interface DraftBed {
  key: string;
  name: string;
  color: BedColorKey;
  /** Set once the bed has been created, so a retry skips it. */
  bedId?: string;
}

export const MAX_BEDS = 6;

interface Draft {
  persona: Persona | null;
  beds: DraftBed[];
  firstBedId: string | null;
  /** Every bed id created this session (survives Back and edits). */
  createdIds: string[];
  planted: { bedName: string; text: string } | null;
  setPersona(p: Persona): void;
  rename(key: string, name: string): void;
  recolor(key: string): void;
  remove(key: string): void;
  addNamed(name: string): boolean;
  clear(): void;
  setBedId(key: string, bedId: string): void;
  setFirstBedId(id: string): void;
  setPlanted(p: { bedName: string; text: string }): void;
  reset(): void;
}

let counter = 0;

export const useOnboardingDraft = create<Draft>()((set, get) => ({
  persona: null,
  beds: [],
  firstBedId: null,
  createdIds: [],
  planted: null,
  setPersona: (persona) =>
    set({
      persona,
      beds: suggestedBeds(persona).map((name, i) => ({
        key: `s${i}`,
        name,
        color: BED_COLOR_ORDER[i % BED_COLOR_ORDER.length],
      })),
    }),
  rename: (key, name) => set((s) => ({ beds: s.beds.map((b) => (b.key === key ? { ...b, name } : b)) })),
  recolor: (key) =>
    set((s) => ({
      beds: s.beds.map((b) =>
        b.key === key
          ? { ...b, color: BED_COLOR_ORDER[(BED_COLOR_ORDER.indexOf(b.color) + 1) % BED_COLOR_ORDER.length] }
          : b,
      ),
    })),
  remove: (key) => set((s) => ({ beds: s.beds.filter((b) => b.key !== key) })),
  addNamed: (name) => {
    const n = name.trim();
    const { beds } = get();
    if (!n || beds.length >= MAX_BEDS) return false;
    const color = nextBedColor(beds.map((b) => b.color));
    set({ beds: [...beds, { key: `c${++counter}`, name: n, color }] });
    return true;
  },
  clear: () => set({ beds: [] }),
  setBedId: (key, bedId) =>
    set((s) => ({
      beds: s.beds.map((b) => (b.key === key ? { ...b, bedId } : b)),
      createdIds: s.createdIds.includes(bedId) ? s.createdIds : [...s.createdIds, bedId],
    })),
  setFirstBedId: (firstBedId) => set({ firstBedId }),
  setPlanted: (planted) => set({ planted }),
  reset: () => set({ persona: null, beds: [], firstBedId: null, createdIds: [], planted: null }),
}));
