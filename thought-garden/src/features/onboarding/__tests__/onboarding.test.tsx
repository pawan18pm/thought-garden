import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { useOnboardingDraft } from '../useOnboardingDraft';
import { useOnboardingState } from '@/store/onboardingState';
import Persona from '@/app/onboarding/persona';
import Beds from '@/app/onboarding/beds';
import FirstPlant from '@/app/onboarding/first-plant';
import Reminder from '@/app/onboarding/reminder';

const mockRouter = { push: jest.fn(), replace: jest.fn() };
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  Stack: () => null,
}));
jest.mock('@react-native-community/datetimepicker', () => () => null);
jest.mock('@/ui/useReducedMotion', () => ({ useReducedMotion: () => true }));
jest.mock('@/analytics/analytics', () => ({ track: jest.fn() }));

const mockState: Record<string, unknown> = {};
const mockSettingsSet = jest.fn();
jest.mock('@/store/AppProvider', () => ({
  useGarden: (sel: (s: unknown) => unknown) => sel(mockState),
  useRepos: () => ({ settings: { set: mockSettingsSet } }),
}));

const { track } = jest.requireMock('@/analytics/analytics') as { track: jest.Mock };

const addBed = jest.fn();
const plant = jest.fn();
const water = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  useOnboardingDraft.getState().reset();
  useOnboardingState.setState({ done: false });
  let n = 0;
  addBed.mockImplementation(async (name: string) => ({ id: `b${++n}`, name }));
  plant.mockImplementation(async (text: string, bedId: string) => ({ id: 'p1', text, bedId }));
  water.mockResolvedValue(undefined);
  Object.keys(mockState).forEach((k) => delete mockState[k]);
  Object.assign(mockState, { addBed, plant, water, beds: [{ id: 'ideas', name: 'Ideas', isIdeas: true }, { id: 'b1', name: 'Interview', isIdeas: false }] });
});

const continueBtn = () => screen.getByLabelText('Continue');

describe('onboarding', () => {
  it('persona jobPrep shows its suggested chips', async () => {
    await render(<Persona />);
    await fireEvent.press(screen.getByLabelText('💼 Preparing for a job'));
    await render(<Beds />);
    for (const n of ['Interview', 'DSA', 'Resume', 'Portfolio']) expect(screen.getByLabelText(n)).toBeTruthy();
  });

  it('Continue disabled with 0 selected and with 7', async () => {
    useOnboardingDraft.getState().setPersona('builder');
    await render(<Beds />);
    expect(continueBtn().props.accessibilityState.disabled).toBe(false);
    for (const n of ['Ideas to explore', 'Build', 'Learn', 'Launch']) await fireEvent.press(screen.getByLabelText(n));
    expect(continueBtn().props.accessibilityState.disabled).toBe(true);
    for (const n of ['Ideas to explore', 'Build', 'Learn', 'Launch']) await fireEvent.press(screen.getByLabelText(n));
    for (let i = 0; i < 3; i++) await fireEvent.press(screen.getByLabelText('Add bed'));
    expect(useOnboardingDraft.getState().beds.filter((b) => b.selected)).toHaveLength(7);
    expect(continueBtn().props.accessibilityState.disabled).toBe(true);
  });

  it('renamed bed is created with the new name, then goes to first plant', async () => {
    useOnboardingDraft.getState().setPersona('jobPrep');
    await render(<Beds />);
    await fireEvent.press(screen.getByLabelText('Rename Interview'));
    await fireEvent.changeText(screen.getByLabelText('Bed name'), 'Interviews');
    await fireEvent(screen.getByLabelText('Bed name'), 'submitEditing');
    await fireEvent.press(continueBtn());
    await fireEvent.press(continueBtn());
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith('/onboarding/first-plant'));
    expect(addBed.mock.calls.map((c) => c[0])).toEqual(['Interviews', 'DSA', 'Resume', 'Portfolio']);
    expect(mockSettingsSet).toHaveBeenCalledWith('persona', 'jobPrep');
    expect(useOnboardingDraft.getState().firstBedId).toBe('b1');
  });

  it('first plant preselects first kept bed and auto-waters', async () => {
    useOnboardingDraft.setState({ persona: 'jobPrep', firstBedId: 'b1' });
    await render(<FirstPlant />);
    expect(screen.getByText('Interview')).toBeTruthy();
    expect(screen.queryByText('Ideas')).toBeNull();
    expect(screen.getByLabelText('Plant it').props.accessibilityState.disabled).toBe(true);
    await fireEvent.changeText(screen.getByLabelText('Your first thought'), 'Practice two-pointer problems');
    await fireEvent.press(screen.getByLabelText('Plant it'));
    await waitFor(() => expect(water).toHaveBeenCalledWith('p1'));
    expect(plant).toHaveBeenCalledWith('Practice two-pointer problems', 'b1', null, 'onboarding');
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith('/onboarding/reminder'));
  });

  it('Not now finishes onboarding', async () => {
    useOnboardingDraft.setState({ persona: 'jobPrep', beds: [{ key: 'a', name: 'A', selected: true }] });
    await render(<Reminder />);
    await fireEvent.press(screen.getByLabelText('Not now'));
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)/plant'));
    expect(mockSettingsSet).toHaveBeenCalledWith('reminder_enabled', '0');
    expect(mockSettingsSet).toHaveBeenCalledWith('onboarding_done', '1');
    expect(track).toHaveBeenCalledWith('onboarding_completed', { persona: 'jobPrep', beds_count: 1 });
    expect(useOnboardingState.getState().done).toBe(true);
  });

  it('Yes saves the chosen time', async () => {
    useOnboardingDraft.setState({ persona: 'student' });
    await render(<Reminder />);
    expect(screen.getByLabelText('Yes, remind me').props.accessibilityState.disabled).toBe(true);
    await fireEvent.press(screen.getByLabelText('Evening 9:00'));
    await fireEvent.press(screen.getByLabelText('Yes, remind me'));
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)/plant'));
    expect(mockSettingsSet).toHaveBeenCalledWith('reminder_enabled', '1');
    expect(mockSettingsSet).toHaveBeenCalledWith('reminder_time', '21:00');
    expect(track).toHaveBeenCalledWith('reminder_enabled', { time: '21:00' });
  });
});
