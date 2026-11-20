import { useCallback, useEffect, useRef, useState } from 'react';
import { dayState, type DayActivity, type DayState } from '@/domain/dayState';
import { weekRange } from '@/domain/dates';
import { useRepos } from '@/store/AppProvider';
import { flowerColors, type BedColorKey } from '@/ui/tokens';

export interface DayCell {
  state: DayState;
  flower?: string;
}

type Raw = Record<string, DayActivity & { bloomColor?: BedColorKey | 'ideas' }>;

function toCells(raw: Raw): Record<string, DayCell> {
  const out: Record<string, DayCell> = {};
  for (const [k, a] of Object.entries(raw)) {
    const state = dayState(a);
    out[k] = state === 'bloomed' ? { state, flower: flowerColors[a.bloomColor ?? 'pink'] } : { state };
  }
  return out;
}

export function useActivity(year: number, month0: number) {
  const { activity } = useRepos();
  const [cells, setCells] = useState<Record<string, DayCell>>({});
  const [weekCells, setWeekCells] = useState<Record<string, DayCell>>({});
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
      const pad = (n: number) => String(n).padStart(2, '0');
      const last = new Date(y, m0 + 1, 0).getDate();
      const [m, wc, w] = await Promise.all([
        activity.range(`${y}-${pad(m0 + 1)}-01`, `${y}-${pad(m0 + 1)}-${pad(last)}`),
        activity.range(startKey, endKey),
        activity.week(startKey, endKey),
      ]);
      if (id !== reqId.current) return;
      setCells(toCells(m));
      setWeekCells(toCells(wc));
      setWeek(w);
    } catch (e) {
      console.error('Failed to load garden activity', e);
    }
  }, [activity]);

  // Month change (and first mount): drop the previous month's tiles, then load.
  useEffect(() => {
    setCells({});
    void reload();
  }, [year, month0, reload]);

  return { cells, weekCells, week, reload };
}
