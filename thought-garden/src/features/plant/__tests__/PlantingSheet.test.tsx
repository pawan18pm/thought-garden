import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { PlantingSheet } from '../PlantingSheet';
import { bedA, bedB, ideas } from '../__fixtures__/fixtures';

jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: { View },
    useSharedValue: (v: number) => ({ value: v }),
    useAnimatedStyle: (fn: () => object) => fn(),
    withTiming: (v: unknown) => v,
    withSequence: (...v: unknown[]) => v[v.length - 1],
  };
});

const state: Record<string, unknown> = {};
jest.mock('@/store/AppProvider', () => ({
  useGarden: (sel: (s: unknown) => unknown) => sel(state),
}));

const plant = jest.fn();
const toggleFold = jest.fn();

beforeEach(() => {
  plant.mockReset().mockResolvedValue({ id: 'new', bedId: 'bA' });
  toggleFold.mockReset();
  Object.assign(state, { beds: [bedA, bedB, ideas], lastBedId: null, plant, toggleFold });
});

const input = () => screen.getByLabelText('Thought');
const planter = () => screen.getByLabelText('Plant it');

describe('PlantingSheet', () => {
  it('autofocuses the text input', async () => {
    await render(<PlantingSheet visible onClose={() => {}} />);
    expect(input().props.autoFocus).toBe(true);
  });

  it('disables Plant it for whitespace and for 141 chars', async () => {
    await render(<PlantingSheet visible onClose={() => {}} />);
    await fireEvent.changeText(input(), '   ');
    expect(planter().props.accessibilityState.disabled).toBe(true);
    await fireEvent.changeText(input(), 'x'.repeat(141));
    expect(planter().props.accessibilityState.disabled).toBe(true);
    await fireEvent.changeText(input(), 'x'.repeat(140));
    expect(planter().props.accessibilityState.disabled).toBe(false);
  });

  it('plants with defaults from the fab', async () => {
    const onClose = jest.fn();
    await render(<PlantingSheet visible onClose={onClose} />);
    await fireEvent.changeText(input(), 'Learn SQL');
    await fireEvent.press(planter());
    expect(plant).toHaveBeenCalledTimes(1);
    expect(plant).toHaveBeenCalledWith('Learn SQL', undefined, null, 'fab');
    expect(onClose).toHaveBeenCalled();
  });

  it('passes bed_plus source and initial bed when opened from a bed', async () => {
    await render(<PlantingSheet visible initialBedId="bB" onClose={() => {}} />);
    await fireEvent.changeText(input(), 'Trees');
    await fireEvent.press(planter());
    expect(plant).toHaveBeenCalledWith('Trees', 'bB', null, 'bed_plus');
  });

  it('ignores a second press while the first is pending', async () => {
    plant.mockReturnValue(new Promise(() => {}));
    await render(<PlantingSheet visible onClose={() => {}} />);
    await fireEvent.changeText(input(), 'Learn SQL');
    await fireEvent.press(planter());
    await fireEvent.press(planter());
    await fireEvent(input(), 'submitEditing');
    expect(plant).toHaveBeenCalledTimes(1);
  });

  it('passes the chosen priority and bed', async () => {
    await render(<PlantingSheet visible onClose={() => {}} />);
    await fireEvent.changeText(input(), 'Mock interview');
    await fireEvent.press(screen.getByLabelText('Priority ▲▲'));
    await fireEvent.press(screen.getByLabelText('Bed DSA'));
    await fireEvent.press(planter());
    expect(plant).toHaveBeenCalledWith('Mock interview', 'bB', 3, 'fab');
  });

  it('maps the – chip to Low (1) and tapping again deselects', async () => {
    await render(<PlantingSheet visible onClose={() => {}} />);
    await fireEvent.changeText(input(), 'Low one');
    await fireEvent.press(screen.getByLabelText('Priority –'));
    await fireEvent.press(planter());
    expect(plant).toHaveBeenLastCalledWith('Low one', undefined, 1, 'fab');
    await fireEvent.changeText(input(), 'None again');
    await fireEvent.press(screen.getByLabelText('Priority –')); // still selected: deselects
    await fireEvent.press(planter());
    expect(plant).toHaveBeenLastCalledWith('None again', undefined, null, 'fab');
  });

  it('unfolds a folded target bed after planting', async () => {
    Object.assign(state, { beds: [{ ...bedA, folded: true }, bedB, ideas] });
    await render(<PlantingSheet visible initialBedId="bA" onClose={() => {}} />);
    await fireEvent.changeText(input(), 'Hello');
    await fireEvent.press(planter());
    expect(toggleFold).toHaveBeenCalledWith('bA');
  });
});
