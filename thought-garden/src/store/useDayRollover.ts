import { useEffect } from 'react';
import { AppState } from 'react-native';
import { dayKey } from '@/domain/dates';
import type { GardenStore } from './garden';

/** Reloads the store when the app returns to the foreground on a different local day than the last refresh. */
export function useDayRollover(store: GardenStore): void {
  useEffect(() => {
    let lastDay = dayKey(new Date());
    const sub = AppState.addEventListener('change', (next) => {
      if (next !== 'active') return;
      const today = dayKey(new Date());
      if (today === lastDay) return;
      lastDay = today;
      void store.getState().load().catch((e) => console.warn('day rollover reload failed', e));
    });
    return () => sub.remove();
  }, [store]);
}
