import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { BloomedTodayCard } from '../BloomedTodayCard';
import { bedA, ideas, mkPlant } from '../__fixtures__/fixtures';

jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: { View },
    useSharedValue: (v: unknown) => ({ value: v }),
    useAnimatedStyle: () => ({}),
    withSequence: (...a: unknown[]) => a[a.length - 1],
    withTiming: (v: unknown) => v,
    withSpring: (v: unknown) => v,
  };
});

describe('BloomedTodayCard', () => {
  it('renders compact empty state', async () => {
    await render(<BloomedTodayCard plants={[]} beds={[bedA]} onUndo={() => {}} />);
    expect(screen.getByText('Your first bloom today is one tap away 🌱')).toBeTruthy();
    expect(screen.queryByTestId('bloom-badge')).toBeNull();
  });

  it('renders flowers, badge, copy and undo', async () => {
    const onUndo = jest.fn();
    const spy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const plants = [
      mkPlant({ id: 'a', text: 'One' }),
      mkPlant({ id: 'b', text: 'Two' }),
      mkPlant({ id: 'c', text: 'Three' }),
    ];
    await render(<BloomedTodayCard plants={plants} beds={[bedA]} onUndo={onUndo} />);
    expect(screen.getByText('Bloomed today')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText(/3 thoughts bloomed. Nice work./)).toBeTruthy();
    expect(screen.getByText(/Tap one to undo\./)).toBeTruthy();
    expect(screen.getAllByLabelText(/^Bloomed: /)).toHaveLength(3);
    await fireEvent.press(screen.getByLabelText('Bloomed: Two'));
    expect(spy).toHaveBeenCalled();
    const buttons = spy.mock.calls[0][2]!;
    buttons.find((b) => b.text === 'Undo bloom')!.onPress!();
    expect(onUndo).toHaveBeenCalledWith('b');
    spy.mockRestore();
  });

  it('handles an Ideas-bed plant', async () => {
    await render(
      <BloomedTodayCard plants={[mkPlant({ id: 'i', bedId: 'bI', text: 'Idea' })]} beds={[bedA, ideas]} onUndo={() => {}} />,
    );
    expect(screen.getByLabelText('Bloomed: Idea')).toBeTruthy();
  });
});
