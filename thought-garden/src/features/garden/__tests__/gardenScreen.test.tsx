import React from 'react';
import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react-native';
import Garden from '../../../app/(tabs)/garden';
import { useActivity } from '../useActivity';

const mockTrack = jest.fn();
jest.mock('@/analytics/analytics', () => ({ track: (...a: unknown[]) => mockTrack(...a) }));

let mockFocusCb: (() => void) | null = null;
jest.mock('expo-router', () => {
  const React = require('react');
  return {
    useRouter: () => ({ push: jest.fn() }),
    useFocusEffect: (cb: () => void) => {
      React.useEffect(() => {
        mockFocusCb = cb;
        cb();
      }, [cb]);
    },
  };
});

const mockWeek = jest.fn();
const mockRange = jest.fn();
const mockRepos = {
  activity: { range: (a: string, b: string) => mockRange(a, b), week: () => mockWeek() },
};
jest.mock('@/store/AppProvider', () => ({ useRepos: () => mockRepos }));

beforeEach(() => {
  mockTrack.mockReset();
  mockRange.mockReset().mockResolvedValue({});
  mockWeek.mockReset().mockResolvedValue({ blooms: 0, waters: 0 });
  mockFocusCb = null;
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
});

describe('Garden screen', () => {
  it('tracks garden_viewed per focus, not per month change, and crosses year boundary', async () => {
    await render(<Garden />);
    expect(mockTrack).toHaveBeenCalledTimes(1);
    expect(mockTrack).toHaveBeenCalledWith('garden_viewed', {});

    const now = new Date();
    const steps = 12 - now.getMonth();
    for (let i = 0; i < steps; i++) await fireEvent.press(screen.getByLabelText('Next month'));
    expect(screen.getByText(`January ${now.getFullYear() + 1}`)).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Previous month'));
    expect(screen.getByText(`December ${now.getFullYear()}`)).toBeTruthy();
    expect(screen.getByText('Garden')).toBeTruthy();
    expect(screen.getByText('Every day you tended, growing.')).toBeTruthy();
    expect(mockTrack).toHaveBeenCalledTimes(1);

    await waitFor(() => expect(mockRange).toHaveBeenCalledWith(`${now.getFullYear()}-12-01`, `${now.getFullYear()}-12-31`));
    const before = mockRange.mock.calls.length;
    await act(async () => mockFocusCb!());
    expect(mockTrack).toHaveBeenCalledTimes(2);
    expect(mockRange.mock.calls.length).toBe(before + 2);
  });
});
