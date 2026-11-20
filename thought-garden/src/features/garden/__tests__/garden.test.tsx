import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { MonthCalendar } from '../MonthCalendar';
import { WeekCard } from '../WeekCard';
import DayDetail from '../../../app/garden/[date]';
import { bedA, ideas, mkPlant } from '../../plant/__fixtures__/fixtures';

jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  return { __esModule: true, default: { View } };
});

const mockParams: { date?: string } = {};
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ back: mockBack }),
  useLocalSearchParams: () => mockParams,
  useFocusEffect: () => {},
}));

jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));

const mockDetail = jest.fn();
const mockState: { beds: unknown[] } = { beds: [] };
jest.mock('@/store/AppProvider', () => ({
  useGarden: (sel: (s: unknown) => unknown) => sel(mockState),
  useRepos: () => ({ activity: { detail: (k: string) => mockDetail(k) } }),
}));
jest.mock('@/analytics/analytics', () => ({ track: jest.fn() }));

describe('MonthCalendar', () => {
  const base = { year: 2026, month0: 10, todayKey: '2026-11-20', onShift: () => {} };
  it('renders 42 cells, flower art, today selected, ignores future, shows legend', async () => {
    const onDayPress = jest.fn();
    await render(
      <MonthCalendar {...base} cells={{ '2026-11-18': { state: 'bloomed', flower: '#F2A36B' } }} onDayPress={onDayPress} />,
    );
    expect(screen.getAllByTestId(/^cell-/)).toHaveLength(42);
    expect(screen.getByTestId('day-2026-11-18-bloomed')).toBeTruthy();
    expect(screen.getByLabelText('November 20, empty').props.accessibilityState).toMatchObject({ selected: true });
    await fireEvent.press(screen.getByLabelText('November 18, bloomed'));
    expect(onDayPress).toHaveBeenCalledWith('2026-11-18');
    await fireEvent.press(screen.getByLabelText('November 25, empty'));
    expect(onDayPress).toHaveBeenCalledTimes(1);
    for (const t of ['Nothing', 'Planted', 'Watered', 'Bloomed']) expect(screen.getByText(t)).toBeTruthy();
    expect(screen.getByText('November 2026')).toBeTruthy();
  });
  it('arrows call onShift', async () => {
    const onShift = jest.fn();
    await render(<MonthCalendar {...base} onShift={onShift} cells={{}} onDayPress={() => {}} />);
    await fireEvent.press(screen.getByLabelText('Previous month'));
    await fireEvent.press(screen.getByLabelText('Next month'));
    expect(onShift).toHaveBeenNthCalledWith(1, -1);
    expect(onShift).toHaveBeenNthCalledWith(2, 1);
  });
});

describe('WeekCard', () => {
  it('shows copy and 7 tiles Mon-Sun; press calls onDayPress, future disabled', async () => {
    const onDayPress = jest.fn();
    await render(
      <WeekCard
        blooms={5}
        waters={12}
        todayKey="2026-11-20"
        cells={{ '2026-11-16': { state: 'bloomed', flower: '#7FA8E8' } }}
        onDayPress={onDayPress}
      />,
    );
    expect(screen.getByText('5 bloomed · 12 waters')).toBeTruthy();
    expect(screen.getAllByTestId(/^week-/)).toHaveLength(7);
    expect(screen.getByTestId('week-2026-11-16')).toBeTruthy();
    expect(screen.getByTestId('week-2026-11-22')).toBeTruthy();
    expect(within(screen.getByTestId('week-2026-11-16')).getByTestId('day-2026-11-16-bloomed')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('week-2026-11-16'));
    expect(onDayPress).toHaveBeenCalledWith('2026-11-16');
    await fireEvent.press(screen.getByTestId('week-2026-11-22'));
    expect(onDayPress).toHaveBeenCalledTimes(1);
  });
});

describe('Day detail', () => {
  beforeAll(() => {
    mockState.beds = [bedA, ideas];
  });
  beforeEach(() => {
    mockDetail.mockReset();
    mockBack.mockReset();
  });
  it('title, summary, section order, bed tag', async () => {
    mockParams.date = '2026-11-18';
    mockDetail.mockResolvedValue({
      bloomed: [mkPlant({ id: 'a', text: 'Bloomy' }), mkPlant({ id: 'c', text: 'Ideay', bedId: 'bI' })],
      watered: [mkPlant({ id: 'b', text: 'Watery' })],
      planted: [],
    });
    await render(<DayDetail />);
    expect(await screen.findByText('Bloomy')).toBeTruthy();
    expect(screen.getByText('Wed, 18 Nov')).toBeTruthy();
    expect(screen.getByText('2 bloomed · 1 watered')).toBeTruthy();
    expect(screen.getAllByText('Interview')).toHaveLength(2);
    expect(screen.getByText('Ideas')).toBeTruthy();
    expect(screen.queryByText('Planted')).toBeNull();
    const titles = screen.getAllByTestId(/^section-/).map((n) => n.props.testID);
    expect(titles).toEqual(['section-bloomed', 'section-watered']);
  });
  it('gentle empty message', async () => {
    mockParams.date = '2026-11-18';
    mockDetail.mockResolvedValue({ bloomed: [], watered: [], planted: [] });
    await render(<DayDetail />);
    expect(await screen.findByText("Nothing happened this day. That's okay.")).toBeTruthy();
  });
  it('back pill calls router.back', async () => {
    mockParams.date = '2026-11-18';
    mockDetail.mockResolvedValue({ bloomed: [], watered: [], planted: [] });
    await render(<DayDetail />);
    await fireEvent.press(screen.getByLabelText('Back to Garden'));
    expect(mockBack).toHaveBeenCalled();
    expect(screen.getByText('‹ Garden')).toBeTruthy();
  });
  it('invalid date does not crash', async () => {
    mockParams.date = 'garbage';
    await render(<DayDetail />);
    expect(await screen.findByText("Nothing happened this day. That's okay.")).toBeTruthy();
    expect(mockDetail).not.toHaveBeenCalled();
  });
});
