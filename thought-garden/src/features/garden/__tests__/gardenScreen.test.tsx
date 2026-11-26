import React from 'react';
import { act, fireEvent, render, renderHook, screen, waitFor, within } from '@testing-library/react-native';
import Garden from '../../../app/(tabs)/garden';
import { useActivity } from '../useActivity';
import { bedA, bedB, ideas, mkPlant } from '../../plant/__fixtures__/fixtures';

const mockTrack = jest.fn();
jest.mock('@/analytics/analytics', () => ({ track: (...a: unknown[]) => mockTrack(...a) }));

jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));

let mockFocusCb: (() => void) | null = null;
const mockPush = jest.fn();
jest.mock('expo-router', () => {
  const React = require('react');
  return {
    useRouter: () => ({ push: mockPush }),
    useFocusEffect: (cb: () => void) => {
      React.useEffect(() => {
        mockFocusCb = cb;
        cb();
      }, [cb]);
    },
  };
});

const mockRange = jest.fn();
const mockDetailRange = jest.fn();
const mockDetail = jest.fn();
const mockRepos = {
  activity: {
    range: (a: string, b: string) => mockRange(a, b),
    detailRange: (a: string, b: string) => mockDetailRange(a, b),
    detail: (k: string) => mockDetail(k),
  },
};
const mockState: { plants: unknown[]; beds: unknown[] } = { plants: [], beds: [] };
jest.mock('@/store/AppProvider', () => ({
  useRepos: () => mockRepos,
  useGarden: (sel: (s: unknown) => unknown) => sel(mockState),
}));

const empty = { bloomed: [], watered: [], planted: [] };

beforeAll(() => {
  // Fake only the clock: Thursday 26 November 2026, midday.
  jest.useFakeTimers({
    now: new Date(2026, 10, 26, 12),
    doNotFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'setImmediate', 'clearImmediate', 'nextTick', 'queueMicrotask'],
  });
});
afterAll(() => jest.useRealTimers());

// Warm-up: the first render of the screen pays for loading its modules (calendar, SVG art).
// Doing it once here keeps that cost out of the first test's time budget, so results don't
// depend on how loaded the machine is.
beforeAll(async () => {
  mockRange.mockResolvedValue({});
  mockDetailRange.mockResolvedValue(empty);
  mockDetail.mockResolvedValue(empty);
  mockState.beds = [bedA, bedB, ideas];
  const view = await render(<Garden />);
  await screen.findByText('Today · Thursday, 26 November');
  await view.unmount();
}, 30000);

beforeEach(() => {
  mockTrack.mockReset();
  mockPush.mockReset();
  mockRange.mockReset().mockResolvedValue({});
  mockDetailRange.mockReset().mockResolvedValue(empty);
  mockDetail.mockReset().mockResolvedValue(empty);
  mockFocusCb = null;
  mockState.plants = [];
  mockState.beds = [bedA, bedB, ideas];
});

describe('useActivity', () => {
  it('latest month wins when loads resolve out of order', async () => {
    const resolvers: Record<number, (v: unknown) => void> = {};
    mockRange.mockImplementation((a: string) =>
      /^2026-0[12]-01$/.test(a) ? new Promise((r) => (resolvers[Number(a.slice(5, 7)) - 1] = r)) : Promise.resolve({}),
    );
    const { result, rerender } = await renderHook(({ m }: { m: number }) => useActivity(2026, m), { initialProps: { m: 0 } });
    await rerender({ m: 1 });
    await act(async () => resolvers[1]({ '2026-02-03': { planted: 0, watered: 0, bloomed: 1, bloomColor: 'blue' } }));
    await act(async () => resolvers[0]({ '2026-01-05': { planted: 1, watered: 0, bloomed: 0 } }));
    expect(result.current.cells).toEqual({ '2026-02-03': { state: 'bloomed', flower: '#7FA8E8' } });
  });

  it('watered days with two or more waterings grow taller', async () => {
    mockRange.mockResolvedValue({
      '2026-11-03': { planted: 0, watered: 1, bloomed: 0 },
      '2026-11-04': { planted: 0, watered: 2, bloomed: 0 },
    });
    const { result } = await renderHook(() => useActivity(2026, 10));
    await waitFor(() => expect(result.current.cells['2026-11-04']).toEqual({ state: 'watered', growing: true }));
    expect(result.current.cells['2026-11-03']).toEqual({ state: 'watered', growing: false });
  });
});

describe('Garden screen', () => {
  it('tracks garden_viewed per focus, not per month change, and crosses year boundary', async () => {
    await render(<Garden />);
    expect(mockTrack).toHaveBeenCalledTimes(1);
    expect(mockTrack).toHaveBeenCalledWith('garden_viewed', {});

    await fireEvent.press(screen.getByLabelText('Next month'));
    await fireEvent.press(screen.getByLabelText('Next month'));
    expect(screen.getByText('January 2027')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Previous month'));
    expect(screen.getByText('December 2026')).toBeTruthy();
    expect(screen.getByText('Garden')).toBeTruthy();
    expect(mockTrack).toHaveBeenCalledTimes(1);

    await waitFor(() => expect(mockRange).toHaveBeenCalledWith('2026-12-01', '2026-12-31'));
    expect(mockDetailRange).toHaveBeenCalledWith('2026-12-01', '2026-12-31');
    const before = mockRange.mock.calls.length;
    const detailBefore = mockDetail.mock.calls.length;
    await act(async () => mockFocusCb!());
    expect(mockTrack).toHaveBeenCalledTimes(2);
    expect(mockRange.mock.calls.length).toBe(before + 1);
    expect(mockDetail.mock.calls.length).toBe(detailBefore + 1);
  });

  it('month bloom badge counts each plant once', async () => {
    const a = mkPlant({ id: 'a', bloomedAt: '2026-11-18T10:00:00Z', waterCount: 3 });
    const b = mkPlant({ id: 'b', waterCount: 1 });
    const c = mkPlant({ id: 'c' });
    mockDetailRange.mockResolvedValue({ bloomed: [a], watered: [a, b], planted: [a, b, c] });
    mockRange.mockResolvedValue({
      '2026-11-10': { planted: 3, watered: 0, bloomed: 0 },
      '2026-11-18': { planted: 0, watered: 2, bloomed: 1, bloomColor: 'orange' },
    });
    await render(<Garden />);
    expect(await screen.findByLabelText('1 bloom this month')).toBeTruthy();
    expect(screen.queryByText(/tended|blooming/)).toBeNull();
    expect(mockDetailRange).toHaveBeenCalledWith('2026-11-01', '2026-11-30');
  });

  it('today is open by default; tapping a past day shows its grouped dropdown; tapping again closes', async () => {
    const a = mkPlant({ id: 'a', text: 'Bloomy', bedId: 'bB', bloomedAt: '2026-11-18T10:00:00Z', waterCount: 3 });
    const b = mkPlant({ id: 'b', text: 'Watery', waterCount: 1 });
    mockDetail.mockImplementation((k: string) =>
      Promise.resolve(k === '2026-11-18' ? { bloomed: [a], watered: [a, b], planted: [a] } : empty),
    );
    mockRange.mockResolvedValue({ '2026-11-18': { planted: 1, watered: 2, bloomed: 1, bloomColor: 'orange' } });
    await render(<Garden />);
    expect(await screen.findByText('Today · Thursday, 26 November')).toBeTruthy();
    expect(screen.getByText('Nothing yet today. Plant or water something.')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('November 18, bloomed'));
    expect(await screen.findByText('Wednesday, 18 November')).toBeTruthy();
    expect(screen.queryByText('Today · Thursday, 26 November')).toBeNull();
    expect(mockTrack).toHaveBeenCalledWith('day_opened', {});
    const region = screen.getByLabelText('Wednesday, 18 November');
    expect(within(region).getByText('Bloomed (1)')).toBeTruthy();
    expect(within(region).getByText('Watered (1)')).toBeTruthy();
    expect(within(region).queryByText(/^Planted \(/)).toBeNull();

    await fireEvent.press(screen.getByLabelText('November 18, bloomed'));
    expect(screen.queryByText('Wednesday, 18 November')).toBeNull();
  });

  it('switching days keeps the previous day showing until the new one loads', async () => {
    const a = mkPlant({ id: 'a', text: 'Bloomy', bloomedAt: '2026-11-18T10:00:00Z', waterCount: 3 });
    let resolve10: (v: unknown) => void = () => {};
    mockDetail.mockImplementation((k: string) => {
      if (k === '2026-11-18') return Promise.resolve({ bloomed: [a], watered: [], planted: [] });
      if (k === '2026-11-10') return new Promise((r) => (resolve10 = r));
      return Promise.resolve(empty);
    });
    await render(<Garden />);
    await screen.findByText('Today · Thursday, 26 November');
    await fireEvent.press(screen.getByLabelText('November 18'));
    expect(await screen.findByText('Wednesday, 18 November')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('November 10'));
    // Still loading Nov 10: Nov 18 stays on screen instead of the dropdown collapsing.
    expect(screen.getByText('Wednesday, 18 November')).toBeTruthy();
    expect(screen.getByText('Bloomy')).toBeTruthy();

    await act(async () => resolve10({ bloomed: [], watered: [], planted: [] }));
    expect(screen.getByText('Tuesday, 10 November')).toBeTruthy();
    expect(screen.queryByText('Wednesday, 18 November')).toBeNull();
    expect(screen.getByText("Nothing happened this day. That's okay.")).toBeTruthy();

    // Closing then reopening a day doesn't flash the old one.
    await fireEvent.press(screen.getByLabelText('Close day'));
    expect(screen.queryByText('Tuesday, 10 November')).toBeNull();
  });

  it('future tiles are not pressable', async () => {
    await render(<Garden />);
    await screen.findByText('Today · Thursday, 26 November');
    await fireEvent.press(screen.getByTestId('cell-2026-11-27'));
    expect(mockDetail).not.toHaveBeenCalledWith('2026-11-27');
    expect(screen.getByText('Today · Thursday, 26 November')).toBeTruthy();
  });

  it('next up card counts thirsty and ready plants and opens the Plant tab', async () => {
    mockState.plants = [mkPlant({ id: 'x', waterCount: 0 }), mkPlant({ id: 'y', waterCount: 2 })];
    await render(<Garden />);
    await fireEvent.press(screen.getByText('Next up: 1 thought is thirsty'));
    expect(mockPush).toHaveBeenCalledWith('/(tabs)/plant');
  });

  it('settings gear opens settings', async () => {
    await render(<Garden />);
    await fireEvent.press(screen.getByLabelText('Settings'));
    expect(mockPush).toHaveBeenCalledWith('/settings');
  });
});
