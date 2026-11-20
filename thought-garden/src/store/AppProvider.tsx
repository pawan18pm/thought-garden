import { createContext, useContext, type ReactNode } from 'react';
import { useStore } from 'zustand';
import type { GardenState, GardenStore, Repos } from './garden';

interface AppContextValue {
  store: GardenStore;
  repos: Repos;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ store, repos, children }: AppContextValue & { children: ReactNode }) {
  return <AppContext.Provider value={{ store, repos }}>{children}</AppContext.Provider>;
}

function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useGarden must be used inside AppProvider');
  return ctx;
}

export function useGarden<T>(selector: (s: GardenState) => T): T {
  return useStore(useApp().store, selector);
}

export function useRepos(): Repos {
  return useApp().repos;
}
