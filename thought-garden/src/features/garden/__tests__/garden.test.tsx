import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { MonthCalendar } from '../MonthCalendar';
import { WeekStrip } from '../WeekStrip';
import DayDetail from '../../../app/garden/[date]';
import { bedA, ideas, mkPlant } from '../../plant/__fixtures__/fixtures';

jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  return { __esModule: true, default: { View } };
});

const mockParams: { date?: string } = {};
jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useLocalSearchParams: () => mockParams,
  useFocusEffect: () => {},
}));

const mockDetail = jest.fn();
const mockState: { beds: unknown[] } = { beds: [] };
jest.mock('@/store/AppProvider', () => ({
  useGarden: (sel: (s: unknown) => unknown) => sel(mockState),
  useRepos: () => ({ activity: { detail: (k: string) => mockDetail(k) } }),
}));
jest.mock('@/analytics/analytics', () => ({ track: jest.fn() }));

describe('MonthCalendar', () => {
  it('renders 42 cells and marks today selected', async () => {
    const onDayPress = jest.fn();
    await render(
      <MonthCalendar year={2026} month0={10} states={{ '2026-11-18': 'bloomed' }} todayKey="2026-11-20" onDayPress={onDayPress} />,
    );
    expect(screen.getAllByTestId(/^cell-/)).toHaveLength(42);
    expect(screen.getByTestId('day-2026-11-18-bloomed')).toBeTruthy();
    expect(screen.getByLabelText('November 20, empty').props.accessibilityState).toMatchObject({ selected: true });
    await fireEvent.press(screen.getByLabelText('November 18, bloomed'));
    expect(onDayPress).toHaveBeenCalledWith('2026-11-18');
    await fireEvent.press(screen.getByLabelText('November 25, empty'));
    expect(onDayPress).toHaveBeenCalledTimes(1);
  });
});

describe('WeekStrip', () => {
  it('shows copy', async () => {
    await render(<WeekStrip blooms={12} waters={20} />);
    expect(screen.getByText('🌸 12 bloomed · 💧 20 waters this week')).toBeTruthy();
  });
});

describe('Day detail', () => {
  beforeAll(() => {
    mockState.beds = [bedA, ideas];
  });
  beforeEach(() => {
    mockDetail.mockReset();
  });
  it('lists sections and hides empty ones', async () => {
    mockParams.date = '2026-11-18';
    mockDetail.mockResolvedValue({ bloomed: [mkPlant({ id: 'a', text: 'Bloomy' })], watered: [], planted: [mkPlant({ id: 'b', text: 'Planty' })] });
    await render(<DayDetail />);
    expect(await screen.findByText('Bloomy')).toBeTruthy();
    expect(screen.getByText('🌸 Bloomed')).toBeTruthy();
    expect(screen.getByText('🌱 Planted')).toBeTruthy();
    expect(screen.queryByText('💧 Watered')).toBeNull();
  });
  it('gentle empty message', async () => {
    mockParams.date = '2026-11-18';
    mockDetail.mockResolvedValue({ bloomed: [], watered: [], planted: [] });
    await render(<DayDetail />);
    expect(await screen.findByText("Nothing happened this day — that's okay 🌿")).toBeTruthy();
  });
  it('invalid date does not crash', async () => {
    mockParams.date = 'garbage';
    await render(<DayDetail />);
    expect(await screen.findByText("Nothing happened this day — that's okay 🌿")).toBeTruthy();
    expect(mockDetail).not.toHaveBeenCalled();
  });
});
