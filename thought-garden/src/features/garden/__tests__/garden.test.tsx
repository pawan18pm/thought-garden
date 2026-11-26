import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { MonthCalendar } from '../MonthCalendar';
import { MonthCard, monthLine } from '../MonthCard';
import { DayDropdown } from '../DayDropdown';
import { NextUpCard, nextUpTitle } from '../NextUpCard';
import { bedA, bedB, ideas, mkPlant } from '../../plant/__fixtures__/fixtures';

const mockArt = jest.fn();
jest.mock('@/ui/PlantArt', () => ({ PlantArt: (p: unknown) => { mockArt(p); return null; } }));

const textOf = (id: string) =>
  within(screen.getByTestId(id))
    .getAllByText(/.+/)
    .map((n) => n.props.children)
    .join(' ');

describe('MonthCalendar', () => {
  const base = { year: 2026, month0: 10, todayKey: '2026-11-26', selectedKey: null as string | null };

  beforeEach(() => mockArt.mockClear());

  it('renders one tile per day, legend, and future tiles are not pressable', async () => {
    const onDayPress = jest.fn();
    await render(<MonthCalendar {...base} cells={{}} onDayPress={onDayPress} />);
    expect(screen.getAllByTestId(/^cell-2026-/)).toHaveLength(30);
    for (const t of ['Rest day', 'Planted', 'Watered', 'Bloomed']) expect(screen.getByText(t)).toBeTruthy();

    const future = screen.getByTestId('cell-2026-11-27');
    expect(future.props.accessibilityRole).not.toBe('button');
    await fireEvent.press(future);
    expect(onDayPress).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByLabelText('November 20'));
    expect(onDayPress).toHaveBeenCalledWith('2026-11-20');
  });

  it('active day art: seed / sprout / growing / flower with sparkle on bloom days', async () => {
    await render(
      <MonthCalendar
        {...base}
        cells={{
          '2026-11-02': { state: 'planted' },
          '2026-11-03': { state: 'watered' },
          '2026-11-04': { state: 'watered', growing: true },
          '2026-11-05': { state: 'bloomed', flower: '#F2A36B' },
        }}
        onDayPress={() => {}}
      />,
    );
    const stages = mockArt.mock.calls.map(([p]) => p as { stage: string; size: number; flowerColor?: string });
    const tileArt = stages.filter((p) => p.size === 30);
    expect(tileArt.map((p) => p.stage)).toEqual(['seed', 'watered', 'growing', 'bloom']);
    expect(tileArt[3].flowerColor).toBe('#F2A36B');
    for (const [p] of mockArt.mock.calls) expect(p).toMatchObject({ soil: false });
    expect(screen.getByTestId('sparkle-2026-11-05')).toBeTruthy();
    expect(screen.queryByTestId('sparkle-2026-11-04')).toBeNull();
    expect(screen.getByLabelText('November 5, bloomed')).toBeTruthy();
    expect(screen.getByLabelText('November 26, today')).toBeTruthy();
  });

  it('selected tile reports expanded', async () => {
    await render(<MonthCalendar {...base} selectedKey="2026-11-20" cells={{}} onDayPress={() => {}} />);
    expect(screen.getByLabelText('November 20').props.accessibilityState).toMatchObject({ expanded: true });
    expect(screen.getByLabelText('November 21').props.accessibilityState).toMatchObject({ expanded: false });
  });
});

describe('MonthCard', () => {
  const cal = { year: 2026, month0: 10, todayKey: '2026-11-26', selectedKey: null, cells: {}, onDayPress: () => {} };

  it('chips, title and arrows', async () => {
    const onShift = jest.fn();
    await render(<MonthCard {...cal} period="current" onShift={onShift} summary={{ bloomed: 2, watered: 3, planted: 4 }} daysTended={5} />);
    expect(screen.getByText('November 2026')).toBeTruthy();
    expect(screen.getByText('2 bloomed')).toBeTruthy();
    expect(screen.getByText('3 watered')).toBeTruthy();
    expect(screen.getByText('4 planted')).toBeTruthy();
    expect(screen.getByText('Your garden is blooming. 5 days tended this month.')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Previous month'));
    await fireEvent.press(screen.getByLabelText('Next month'));
    expect(onShift).toHaveBeenNthCalledWith(1, -1);
    expect(onShift).toHaveBeenNthCalledWith(2, 1);
  });

  it('month line copy', () => {
    expect(monthLine({ bloomed: 1, watered: 0, planted: 0 }, 1)).toBe('Your garden is blooming. 1 day tended this month.');
    expect(monthLine({ bloomed: 0, watered: 1, planted: 2 }, 2)).toBe('Nice start. 2 days tended this month.');
    expect(monthLine({ bloomed: 0, watered: 0, planted: 0 }, 0)).toBe('Your garden starts today. Plant something.');
    expect(monthLine({ bloomed: 0, watered: 0, planted: 0 }, 0, 'current')).toBe('Your garden starts today. Plant something.');
    expect(monthLine({ bloomed: 0, watered: 0, planted: 0 }, 0, 'past')).toBe('A quiet month.');
    expect(monthLine({ bloomed: 0, watered: 0, planted: 0 }, 0, 'future')).toBe('Still to come.');
    expect(monthLine({ bloomed: 0, watered: 1, planted: 0 }, 1, 'past')).toBe('Nice start. 1 day tended this month.');
  });

  it('chip and legend art is drawn without its own soil mound', async () => {
    mockArt.mockClear();
    await render(<MonthCard {...cal} period="past" onShift={() => {}} summary={{ bloomed: 0, watered: 0, planted: 0 }} daysTended={0} />);
    expect(screen.getByText('A quiet month.')).toBeTruthy();
    expect(mockArt.mock.calls.length).toBeGreaterThan(0);
    for (const [p] of mockArt.mock.calls) expect(p).toMatchObject({ soil: false });
  });
});

describe('NextUpCard', () => {
  it('copy for thirsty / ready / none', () => {
    expect(nextUpTitle(1, 0)).toBe('Next up: 1 thought is thirsty');
    expect(nextUpTitle(3, 2)).toBe('Next up: 3 thoughts are thirsty');
    expect(nextUpTitle(0, 2)).toBe('Next up: 2 ready to bloom');
    expect(nextUpTitle(0, 0)).toBe('Next up: plant a new thought');
  });

  it('renders sub and calls onPress', async () => {
    const onPress = jest.fn();
    await render(<NextUpCard thirsty={0} ready={1} onPress={onPress} />);
    expect(screen.getByText('Next up: 1 ready to bloom')).toBeTruthy();
    expect(screen.getByText('Go to the Plant tab')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalled();
  });
});

describe('DayDropdown', () => {
  const beds = [bedA, bedB, ideas];
  const groups = {
    bloomed: [mkPlant({ id: 'a', text: 'Bloomy', bedId: 'bB', bloomedAt: '2026-11-18T10:00:00Z', waterCount: 3 })],
    watered: [mkPlant({ id: 'b', text: 'Watery', waterCount: 1 }), mkPlant({ id: 'c', text: 'Tall', waterCount: 2 })],
    planted: [],
  };

  beforeEach(() => mockArt.mockClear());

  it('title, count tiles, non-empty sections with art and bed tags', async () => {
    const onClose = jest.fn();
    await render(<DayDropdown dateKey="2026-11-18" todayKey="2026-11-26" groups={groups} beds={beds} onClose={onClose} />);
    expect(screen.getByText('Wednesday, 18 November')).toBeTruthy();
    expect(textOf('count-planted')).toBe('0 planted');
    expect(textOf('count-watered')).toBe('2 watered');
    expect(textOf('count-bloomed')).toBe('1 bloomed');
    expect(screen.getByText('Bloomed (1)')).toBeTruthy();
    expect(screen.getByText('Watered (2)')).toBeTruthy();
    expect(screen.queryByText(/^Planted \(/)).toBeNull();
    expect(screen.getByText('Bloomy')).toBeTruthy();
    expect(screen.getByText('DSA')).toBeTruthy();
    expect(screen.getAllByText('Interview')).toHaveLength(2);
    const art = mockArt.mock.calls.map(([p]) => p as { stage: string; size: number; flowerColor?: string });
    expect(art.map((p) => p.stage)).toEqual(['bloom', 'watered', 'growing']);
    expect(art[0]).toMatchObject({ size: 32, flowerColor: '#F2A36B', soil: false });
    for (const p of art) expect(p).toMatchObject({ soil: false });
    await fireEvent.press(screen.getByLabelText('Close day'));
    expect(onClose).toHaveBeenCalled();
  });

  it('today title prefix and quiet day text', async () => {
    await render(
      <DayDropdown
        dateKey="2026-11-26"
        todayKey="2026-11-26"
        groups={{ bloomed: [], watered: [], planted: [] }}
        beds={beds}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText('Today · Thursday, 26 November')).toBeTruthy();
    expect(screen.getByText('Nothing yet today. Plant or water something.')).toBeTruthy();
    expect(screen.queryByText("Nothing happened this day. That's okay.")).toBeNull();
    expect(screen.queryByTestId('count-planted')).toBeNull();
  });

  it('quiet past day text', async () => {
    await render(
      <DayDropdown
        dateKey="2026-11-20"
        todayKey="2026-11-26"
        groups={{ bloomed: [], watered: [], planted: [] }}
        beds={beds}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText("Nothing happened this day. That's okay.")).toBeTruthy();
    expect(screen.queryByText('Nothing yet today. Plant or water something.')).toBeNull();
  });
});
