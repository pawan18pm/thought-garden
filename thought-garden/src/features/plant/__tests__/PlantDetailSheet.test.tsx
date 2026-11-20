import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { PlantDetailSheet } from '../PlantDetailSheet';
import { bedA, bedB, ideas, mkPlant } from '../__fixtures__/fixtures';

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

const fns = {
  water: jest.fn(),
  bloom: jest.fn(),
  edit: jest.fn(),
  remove: jest.fn(),
};

beforeEach(() => {
  Object.values(fns).forEach((f) => f.mockReset().mockResolvedValue(undefined));
  Object.assign(state, { beds: [bedA, bedB, ideas], plants: [mkPlant({ waterCount: 2 })], ...fns });
});

const open = (onClose = () => {}) => render(<PlantDetailSheet plantId="p1" onClose={onClose} />);

describe('PlantDetailSheet', () => {
  it('shows water count copy', async () => {
    await open();
    expect(screen.getByText('watered 2 times')).toBeTruthy();
  });

  it('pluralises water count', async () => {
    Object.assign(state, { plants: [mkPlant({ waterCount: 1 })] });
    await open();
    expect(screen.getByText('watered 1 time')).toBeTruthy();
  });

  it('shows not watered yet for 0', async () => {
    Object.assign(state, { plants: [mkPlant({ waterCount: 0 })] });
    await open();
    expect(screen.getByText('not watered yet')).toBeTruthy();
  });

  it('Water calls water(id)', async () => {
    await open();
    await fireEvent.press(screen.getByLabelText('Water'));
    expect(fns.water).toHaveBeenCalledWith('p1');
  });

  it('Bloom calls bloom(id)', async () => {
    await open();
    await fireEvent.press(screen.getByLabelText('Bloom'));
    expect(fns.bloom).toHaveBeenCalledWith('p1');
  });

  it('Delete confirms before remove', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const onClose = jest.fn();
    await open(onClose);
    await fireEvent.press(screen.getByText('Delete'));
    expect(fns.remove).not.toHaveBeenCalled();
    const buttons = alert.mock.calls[0][2]!;
    expect(buttons.map((b) => b.text)).toEqual(['Cancel', 'Delete']);
    await buttons[0].onPress?.();
    expect(fns.remove).not.toHaveBeenCalled();
    await buttons[1].onPress?.();
    expect(fns.remove).toHaveBeenCalledWith('p1');
    expect(onClose).toHaveBeenCalled();
    alert.mockRestore();
  });

  it('saves edited text', async () => {
    await open();
    await fireEvent.press(screen.getByLabelText('Edit text'));
    await fireEvent.changeText(screen.getByLabelText('Edit thought'), 'New text');
    await fireEvent.press(screen.getByLabelText('Save text'));
    expect(fns.edit).toHaveBeenCalledWith('p1', { text: 'New text' });
  });

  it('does not save whitespace text', async () => {
    await open();
    await fireEvent.press(screen.getByLabelText('Edit text'));
    await fireEvent.changeText(screen.getByLabelText('Edit thought'), '   ');
    await fireEvent.press(screen.getByLabelText('Save text'));
    expect(fns.edit).not.toHaveBeenCalled();
  });

  it('changes priority', async () => {
    await open();
    await fireEvent.press(screen.getByText('Change priority'));
    await fireEvent.press(screen.getByLabelText('Set priority ▲'));
    expect(fns.edit).toHaveBeenCalledWith('p1', { priority: 2 });
  });

  it('moves bed', async () => {
    await open();
    await fireEvent.press(screen.getByText('Move bed'));
    await fireEvent.press(screen.getByLabelText('Move to DSA'));
    expect(fns.edit).toHaveBeenCalledWith('p1', { bedId: 'bB' });
  });
});
