import { useCallback, useEffect, useRef, useState } from 'react';
import { dayState, type DayActivity, type DayState } from '@/domain/dayState';
import { groupDay, type DayActivity as DayPlants } from '@/domain/dayGroups';
import { useRepos } from '@/store/AppProvider';
import { flowerColors, type BedColorKey } from '@/ui/tokens';

export interface DayCell {
  state: DayState;
  flower?: string;
  /** Watered days with two or more waterings show the taller plant. */
  growing?: boolean;
}

export interface MonthSummary {
  bloomed: number;
  watered: number;
  planted: number;
}

type Raw = Record<string, DayActivity & { bloomColor?: BedColorKey | 'ideas' }>;

const EMPTY_SUMMARY: MonthSummary = { bloomed: 0, watered: 0, planted: 0 };

function toCells(raw: Raw): Record<string, DayCell> {
  const out: Record<string, DayCell> = {};
  for (const [k, a] of Object.entries(raw)) {
    const state = dayState(a);
    if (state === 'bloomed') out[k] = { state, flower: flowerColors[a.bloomColor ?? 'pink'] };
    else if (state === 'watered') out[k] = { state, growing: a.watered >= 2 };
    else out[k] = { state };
  }
  return out;
}

const pad = (n: number) => String(n).padStart(2, '0');

export function monthBounds(year: number, month0: number): { startKey: string; endKey: string } {
  const last = new Date(year, month0 + 1, 0).getDate();
  return { startKey: `${year}-${pad(month0 + 1)}-01`, endKey: `${year}-${pad(month0 + 1)}-${pad(last)}` };
}

export function useActivity(year: number, month0: number) {
  const { activity } = useRepos();
  const [cells, setCells] = useState<Record<string, DayCell>>({});
  const [summary, setSummary] = useState<MonthSummary>(EMPTY_SUMMARY);
  const latest = useRef({ year, month0 });
  latest.current = { year, month0 };
  const reqId = useRef(0);

  /** Loads the CURRENT month; results of superseded requests are discarded. */
  const reload = useCallback(async () => {
    const id = ++reqId.current;
    const { startKey, endKey } = monthBounds(latest.current.year, latest.current.month0);
    try {
      const [raw, plants] = await Promise.all([activity.range(startKey, endKey), activity.detailRange(startKey, endKey)]);
      if (id !== reqId.current) return;
      const g = groupDay(plants);
      setCells(toCells(raw));
      setSummary({ bloomed: g.bloomed.length, watered: g.watered.length, planted: g.planted.length });
    } catch (e) {
      console.error('Failed to load garden activity', e);
    }
  }, [activity]);

  // Month change (and first mount): drop the previous month's tiles, then load.
  useEffect(() => {
    setCells({});
    setSummary(EMPTY_SUMMARY);
    void reload();
  }, [year, month0, reload]);

  return { cells, summary, reload };
}

/**
 * One day's thoughts, each in its furthest group. While switching between days the
 * previously loaded day stays in `loaded` until the new one arrives, so the dropdown
 * doesn't collapse and re-open. Closing (key = null) clears it.
 */
export function useDayDetail(key: string | null) {
  const { activity } = useRepos();
  const [loaded, setLoaded] = useState<{ key: string; groups: DayPlants } | null>(null);
  const latest = useRef(key);
  latest.current = key;
  const reqId = useRef(0);

  const reload = useCallback(async () => {
    const id = ++reqId.current;
    const k = latest.current;
    if (!k) {
      setLoaded(null);
      return;
    }
    try {
      const d = await activity.detail(k);
      if (id !== reqId.current) return;
      setLoaded({ key: k, groups: groupDay(d) });
    } catch (e) {
      console.error('Failed to load day detail', e);
    }
  }, [activity]);

  useEffect(() => {
    void reload();
  }, [key, reload]);

  return { loaded: key ? loaded : null, reload };
}
