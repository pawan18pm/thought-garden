import { useCallback, useEffect, useRef, useState } from 'react';
import { dayState, type DayActivity, type DayState } from '@/domain/dayState';
import { weekRange } from '@/domain/dates';
import { useRepos } from '@/store/AppProvider';

export function useActivity(year: number, month0: number) {
  const { activity } = useRepos();
  const [states, setStates] = useState<Record<string, DayState>>({});
  const [week, setWeek] = useState({ blooms: 0, waters: 0 });
  const latest = useRef({ year, month0 });
  latest.current = { year, month0 };
  const reqId = useRef(0);

  /** Loads the CURRENT month + week; results of superseded requests are discarded. */
  const reload = useCallback(async () => {
    const id = ++reqId.current;
    const { year: y, month0: m0 } = latest.current;
    try {
      const { startKey, endKey } = weekRange(new Date());
      const [m, w] = await Promise.all([activity.month(y, m0), activity.week(startKey, endKey)]);
      if (id !== reqId.current) return;
      const next: Record<string, DayState> = {};
      for (const [k, a] of Object.entries(m as Record<string, DayActivity>)) next[k] = dayState(a);
      setStates(next);
      setWeek(w);
    } catch (e) {
      console.error('Failed to load garden activity', e);
    }
  }, [activity]);

  // Month change (and first mount): drop the previous month's icons, then load.
  useEffect(() => {
    setStates({});
    void reload();
  }, [year, month0, reload]);

  return { states, week, reload };
}
