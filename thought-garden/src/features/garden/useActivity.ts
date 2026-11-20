import { useCallback, useState } from 'react';
import { dayState, type DayActivity, type DayState } from '@/domain/dayState';
import { weekRange } from '@/domain/dates';
import { useRepos } from '@/store/AppProvider';

export function useActivity(year: number, month0: number) {
  const { activity } = useRepos();
  const [states, setStates] = useState<Record<string, DayState>>({});
  const [week, setWeek] = useState({ blooms: 0, waters: 0 });

  const reload = useCallback(async () => {
    try {
      const { startKey, endKey } = weekRange(new Date());
      const [m, w] = await Promise.all([activity.month(year, month0), activity.week(startKey, endKey)]);
      const next: Record<string, DayState> = {};
      for (const [k, a] of Object.entries(m as Record<string, DayActivity>)) next[k] = dayState(a);
      setStates(next);
      setWeek(w);
    } catch (e) {
      console.error('Failed to load garden activity', e);
    }
  }, [activity, year, month0]);

  return { states, week, reload };
}
