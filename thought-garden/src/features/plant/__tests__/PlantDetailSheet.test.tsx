import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
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

// Plain Text stand-in so a test can invoke onPress twice inside one act().
jest.mock('@/ui/ChunkyButton', () => {
  const { Text } = require('react-native');
  return {
    ChunkyButton: ({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) => (
      <Text accessibilityLabel={label} accessibilityState={{ disabled: !!disabled }} onPress={disabled ? undefined : onPress}>
        {label}
      </Text>
    ),
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

describe('PlantDetailSheet guards', () => {
  it('two quick Water presses call water once', async () => {
    let release: () => void = () => {};
    fns.water.mockImplementation(() => new Promise<void>((r) => { release = r; }));
    await open();
    const btn = screen.getByLabelText('Water');
    // Both presses land before the first action settles (fireEvent would await the pending handler).
    await act(async () => {
      btn.props.onPress();
      btn.props.onPress();
    });
    expect(fns.water).toHaveBeenCalledTimes(1);
    await act(async () => release());
  });

  it('two quick Bloom presses call bloom once', async () => {
    let release: () => void = () => {};
    fns.bloom.mockImplementation(() => new Promise<void>((r) => { release = r; }));
    await open();
    const btn = screen.getByLabelText('Bloom');
    // Both presses land before the first action settles (fireEvent would await the pending handler).
    await act(async () => {
      btn.props.onPress();
      btn.props.onPress();
    });
    expect(fns.bloom).toHaveBeenCalledTimes(1);
    await act(async () => release());
  });

  it('edit field is clamped to 140 with a counter', async () => {
    await open();
    await fireEvent.press(screen.getByLabelText('Edit text'));
    expect(screen.getByLabelText('Edit thought').props.maxLength).toBe(140);
    expect(screen.getByText('9/140')).toBeTruthy();
  });
});

describe('PlantDetailSheet bloom', () => {
  it('stays open after the store removes the plant, until onClose', async () => {
    jest.useFakeTimers();
    const onClose = jest.fn();
    const view = await render(<PlantDetailSheet plantId="p1" onClose={onClose} />);
    fns.bloom.mockImplementation(async () => {
      state.plants = [];
      await view.rerender(<PlantDetailSheet plantId="p1" onClose={onClose} />);
    });
    await fireEvent.press(screen.getByLabelText('Bloom'));
    expect(screen.getByText('Learn SQL')).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();
    await jest.advanceTimersByTimeAsync(400);
    expect(onClose).toHaveBeenCalled();
    jest.useRealTimers();
  });
});
