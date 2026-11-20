import { create } from 'zustand';

interface OnboardingState {
  /** null until boot has told us; seeded once from settings, updated when onboarding finishes. */
  done: boolean | null;
  setDone(done: boolean): void;
  seed(done: boolean): void;
}

export const useOnboardingState = create<OnboardingState>()((set, get) => ({
  done: null,
  setDone: (done) => set({ done }),
  seed: (done) => {
    if (get().done === null) set({ done });
  },
}));
