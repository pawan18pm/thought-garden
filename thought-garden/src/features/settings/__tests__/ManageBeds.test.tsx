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
  });
});

describe('ManageBeds', () => {
  it('lists Ideas locked with no actions; Up on first bed is disabled', async () => {
    await render(<ManageBeds />);
    expect(screen.getByText('Always here')).toBeTruthy();
    expect(screen.queryByLabelText('Delete Ideas')).toBeNull();
    expect(screen.queryByLabelText('Move Ideas up')).toBeNull();
    expect(screen.getByLabelText('Move Alpha up').props.accessibilityState.disabled).toBe(true);
    expect(screen.getByLabelText('Move Alpha down').props.accessibilityState.disabled).toBe(false);
    expect(screen.getByLabelText('Move Beta down').props.accessibilityState.disabled).toBe(true);
  });

  it('Down reorders', async () => {
    await render(<ManageBeds />);
    await fireEvent.press(screen.getByLabelText('Move Alpha down'));
    expect(reorderBeds).toHaveBeenCalledWith(['b', 'a']);
  });

  it('delete asks for confirmation before removeBed', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    await render(<ManageBeds />);
    await fireEvent.press(screen.getByLabelText('Delete Alpha'));
    expect(removeBed).not.toHaveBeenCalled();
    expect(alert).toHaveBeenCalledWith('Delete Alpha?', 'Its plants will move to Ideas', expect.any(Array));
    const buttons = alert.mock.calls[0][2]!;
    expect(buttons.map((b) => b.text)).toEqual(['Cancel', 'Delete']);
    buttons[1].onPress!();
    await waitFor(() => expect(removeBed).toHaveBeenCalledWith('a'));
    alert.mockRestore();
  });

  it('adds a trimmed bed', async () => {
    addBed.mockResolvedValue({});
    await render(<ManageBeds />);
    await fireEvent.changeText(screen.getByLabelText('New bed name'), '  Garden  ');
    await fireEvent.press(screen.getByLabelText('Add bed'));
    await waitFor(() => expect(addBed).toHaveBeenCalledWith('Garden'));
  });
});
