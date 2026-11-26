import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ManageBeds } from '../ManageBeds';

const mockState: Record<string, unknown> = {};
jest.mock('@/store/AppProvider', () => ({
  useGarden: (sel: (s: unknown) => unknown) => sel(mockState),
}));

const removeBed = jest.fn();
const reorderBeds = jest.fn();
const renameBed = jest.fn();
const addBed = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  Object.assign(mockState, {
    beds: [
      { id: 'a', name: 'Alpha', color: 'blue', isIdeas: false },
      { id: 'b', name: 'Beta', color: 'orange', isIdeas: false },
      { id: 'i', name: 'Ideas', color: 'ideas', isIdeas: true },
    ],
    removeBed,
    reorderBeds,
    renameBed,
    recolorBed: jest.fn(),
    addBed,
    plants: [],
  });
});

const recolorBed = jest.fn();

describe('ManageBeds', () => {
  it('shows the bed count, thought counts and no Ideas bed; Up on first bed is disabled', async () => {
    mockState.recolorBed = recolorBed;
    mockState.plants = [
      { id: 'p1', bedId: 'a', bloomedAt: null },
      { id: 'p2', bedId: 'a', bloomedAt: null },
      { id: 'p3', bedId: 'b', bloomedAt: null },
    ];
    await render(<ManageBeds />);
    expect(screen.getByText('Manage beds')).toBeTruthy();
    expect(screen.getByText('2 of 6')).toBeTruthy();
    expect(screen.getByText('2 thoughts')).toBeTruthy();
    expect(screen.getByText('1 thought')).toBeTruthy();
    expect(screen.queryByLabelText('Move Ideas up')).toBeNull();
    expect(screen.queryByText('Ideas')).toBeNull();
    expect(screen.getByLabelText('Move Alpha up').props.accessibilityState.disabled).toBe(true);
    expect(screen.getByLabelText('Move Beta up').props.accessibilityState.disabled).toBe(false);
  });

  it('Up reorders', async () => {
    await render(<ManageBeds />);
    await fireEvent.press(screen.getByLabelText('Move Beta up'));
    expect(reorderBeds).toHaveBeenCalledWith(['b', 'a']);
  });

  it('colour dot press recolors to the next colour in order (wrapping)', async () => {
    mockState.recolorBed = recolorBed;
    await render(<ManageBeds />);
    await fireEvent.press(screen.getByLabelText('Change color of Alpha'));
    expect(recolorBed).toHaveBeenCalledWith('a', 'orange');
    await fireEvent.press(screen.getByLabelText('Change color of Beta'));
    expect(recolorBed).toHaveBeenCalledWith('b', 'purple');
  });

  it('saves a rename once on blur + submit, and re-syncs when the bed name changes', async () => {
    const view = await render(<ManageBeds />);
    const input = screen.getByLabelText('Rename Alpha');
    await fireEvent.changeText(input, '  Alpha 2 ');
    await fireEvent(input, 'submitEditing');
    await fireEvent(input, 'blur');
    expect(renameBed).toHaveBeenCalledTimes(1);
    expect(renameBed).toHaveBeenCalledWith('a', 'Alpha 2');

    (mockState.beds as { id: string; name: string }[])[0] = { id: 'a', name: 'Renamed elsewhere', color: 'blue', isIdeas: false } as never;
    await view.rerender(<ManageBeds />);
    expect(screen.getByLabelText('Rename Renamed elsewhere').props.value).toBe('Renamed elsewhere');
  });
});
