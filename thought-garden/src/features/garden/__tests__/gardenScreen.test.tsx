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

const mockMonth = jest.fn();
const mockWeek = jest.fn();
const mockRepos = { activity: { month: (y: number, m: number) => mockMonth(y, m), week: () => mockWeek() } };
jest.mock('@/store/AppProvider', () => ({ useRepos: () => mockRepos }));

beforeEach(() => {
  mockTrack.mockReset();
  mockMonth.mockReset().mockResolvedValue({});
  mockWeek.mockReset().mockResolvedValue({ blooms: 0, waters: 0 });
  mockFocusCb = null;
});

describe('useActivity', () => {
  it('latest month wins when loads resolve out of order', async () => {
    const resolvers: Record<number, (v: unknown) => void> = {};
    mockMonth.mockImplementation((_y: number, m: number) => new Promise((r) => (resolvers[m] = r)));
    const { result, rerender } = await renderHook(({ m }: { m: number }) => useActivity(2026, m), { initialProps: { m: 0 } });
    await rerender({ m: 1 });
    await act(async () => resolvers[1]({ '2026-02-03': { planted: 0, watered: 0, bloomed: 1 } }));
    await act(async () => resolvers[0]({ '2026-01-05': { planted: 1, watered: 0, bloomed: 0 } }));
    expect(result.current.states).toEqual({ '2026-02-03': 'bloomed' });
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
    expect(mockTrack).toHaveBeenCalledTimes(1);

    await waitFor(() => expect(mockMonth).toHaveBeenLastCalledWith(now.getFullYear(), 11));
    const before = mockMonth.mock.calls.length;
    await act(async () => mockFocusCb!());
    expect(mockTrack).toHaveBeenCalledTimes(2);
    expect(mockMonth.mock.calls.length).toBe(before + 1);
  });
});
