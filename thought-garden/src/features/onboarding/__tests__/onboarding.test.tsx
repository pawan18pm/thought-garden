import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { useOnboardingDraft } from '../useOnboardingDraft';
import { useOnboardingState } from '@/store/onboardingState';
import Persona from '@/app/onboarding/persona';
import Beds from '@/app/onboarding/beds';
import FirstPlant from '@/app/onboarding/first-plant';
import Reminder from '@/app/onboarding/reminder';
import Welcome from '@/app/onboarding/welcome';

const mockRouter = { push: jest.fn(), replace: jest.fn() };
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  Stack: () => null,
}));
jest.mock('@react-native-community/datetimepicker', () => () => null);
jest.mock('@/ui/useReducedMotion', () => ({ useReducedMotion: () => true }));
const mockEnable = jest.fn();
jest.mock('@/notifications/reminders', () => ({ enableReminder: (...a: unknown[]) => mockEnable(...a) }));
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
const renameBed = jest.fn();
const recolorBed = jest.fn();
const removeBed = jest.fn();
const plantsInBed = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  useOnboardingDraft.getState().reset();
  useOnboardingState.setState({ done: false });
  let n = 0;
  addBed.mockImplementation(async (name: string, color: string) => {
    const bed = { id: `b${++n}`, name, color, isIdeas: false };
    (mockState.beds as unknown[]).push({ ...bed });
    return bed;
  });
  plantsInBed.mockReturnValue([]);
  plant.mockImplementation(async (text: string, bedId: string) => ({ id: 'p1', text, bedId }));
  water.mockResolvedValue(undefined);
  Object.keys(mockState).forEach((k) => delete mockState[k]);
  Object.assign(mockState, { addBed, plant, water, renameBed, recolorBed, removeBed, plantsInBed, beds: [{ id: 'ideas', name: 'Ideas', isIdeas: true }] });
});

const continueBtn = () => screen.getByLabelText(/^Continue with/);

describe('onboarding', () => {
  it('welcome shows the approved copy and starts the garden', async () => {
    await render(<Welcome />);
    expect(screen.getByText('Your best ideas deserve to grow.')).toBeTruthy();
    expect(
      screen.getByText('Every day you think of things to learn, build or try. Most of them get lost in notes, tabs and chats.'),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "Thought Garden gives each one a home. Plant it in a bed, water it when you make progress, and watch it bloom when it's done.",
      ),
    ).toBeTruthy();
    expect(screen.getByText('Small steps. Real progress.')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Start my garden'));
    expect(mockRouter.push).toHaveBeenCalledWith('/onboarding/persona');
  });

  it('persona jobPrep shows its suggested chips', async () => {
    await render(<Persona />);
    await fireEvent.press(screen.getByLabelText('A new job'));
    await render(<Beds />);
    expect(screen.getAllByLabelText('Bed name').map((i) => i.props.value)).toEqual(['Interview', 'DSA', 'Resume', 'Portfolio']);
  });

  it('other persona starts with no beds and Continue is disabled', async () => {
    useOnboardingDraft.getState().setPersona('other');
    expect(useOnboardingDraft.getState().beds).toEqual([]);
    await render(<Beds />);
    expect(screen.getByText('Start with one bed for each kind of thought. Name them your way.')).toBeTruthy();
    const btn = screen.getByLabelText('Add at least one bed');
    expect(btn.props.accessibilityState.disabled).toBe(true);
  });

  it('adds beds via the field and via an idea chip, capped at 6', async () => {
    useOnboardingDraft.getState().setPersona('other');
    await render(<Beds />);
    await fireEvent.changeText(screen.getByLabelText('New bed name'), 'Garage');
    await fireEvent.press(screen.getByLabelText('Add'));
    await fireEvent.press(screen.getByLabelText('Add Health'));
    expect(useOnboardingDraft.getState().beds.map((b) => b.name)).toEqual(['Garage', 'Health']);
    expect(screen.getByLabelText('Continue with 2 beds').props.accessibilityState.disabled).toBe(false);
    expect(screen.queryByLabelText('Add Health')).toBeNull();
    const d = useOnboardingDraft.getState();
    expect(d.addNamed('   ')).toBe(false);
    for (const n of ['a', 'b', 'c', 'd']) expect(d.addNamed(n)).toBe(true);
    expect(d.addNamed('g')).toBe(false);
  });

  it('Clear all empties the draft; Skip with no beds creates My thoughts', async () => {
    useOnboardingDraft.getState().setPersona('jobPrep');
    await render(<Beds />);
    await fireEvent.press(screen.getByLabelText('Clear all and start blank'));
    expect(useOnboardingDraft.getState().beds).toEqual([]);
    await fireEvent.press(screen.getByLabelText('Skip'));
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith('/onboarding/first-plant'));
    expect(addBed).toHaveBeenCalledTimes(1);
    expect(addBed.mock.calls[0][0]).toBe('My thoughts');
  });

  it('Skip keeps the current draft', async () => {
    useOnboardingDraft.getState().setPersona('jobPrep');
    await render(<Beds />);
    await fireEvent.press(screen.getByLabelText('Skip'));
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith('/onboarding/first-plant'));
    expect(addBed.mock.calls.map((c) => c[0])).toEqual(['Interview', 'DSA', 'Resume', 'Portfolio']);
  });

  it('created beds pass their colour; recolor and remove work', async () => {
    useOnboardingDraft.getState().setPersona('jobPrep');
    await render(<Beds />);
    await fireEvent.press(screen.getByLabelText('Remove DSA'));
    await fireEvent.press(screen.getByLabelText('Change color of Interview'));
    await fireEvent.press(screen.getByLabelText('Continue with 3 beds'));
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith('/onboarding/first-plant'));
    expect(addBed.mock.calls).toEqual([
      ['Interview', 'orange'],
      ['Resume', 'purple'],
      ['Portfolio', 'yellow'],
    ]);
  });

  it('renamed bed is created with the new name, then goes to first plant', async () => {
    useOnboardingDraft.getState().setPersona('jobPrep');
    await render(<Beds />);
    await fireEvent.changeText(screen.getAllByLabelText('Bed name')[0], 'Interviews');
    await fireEvent.press(continueBtn());
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith('/onboarding/first-plant'));
    expect(addBed.mock.calls.map((c) => c[0])).toEqual(['Interviews', 'DSA', 'Resume', 'Portfolio']);
    expect(mockSettingsSet).toHaveBeenCalledWith('persona', 'jobPrep');
    expect(useOnboardingDraft.getState().firstBedId).toBe('b1');
  });

  it('retry after a partial failure does not duplicate beds', async () => {
    const err = jest.spyOn(console, 'error').mockImplementation(() => {});
    useOnboardingDraft.getState().setPersona('jobPrep');
    let n = 0;
    addBed.mockImplementation(async (name: string) => {
      n += 1;
      if (n === 2) throw new Error('boom');
      return { id: `b${n}`, name };
    });
    await render(<Beds />);
    await fireEvent.press(continueBtn());
    await waitFor(() => expect(err).toHaveBeenCalled());
    expect(mockRouter.push).not.toHaveBeenCalled();
    await fireEvent.press(continueBtn());
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith('/onboarding/first-plant'));
    expect(addBed.mock.calls.map((c) => c[0])).toEqual(['Interview', 'DSA', 'DSA', 'Resume', 'Portfolio']); // DSA: one failed attempt, one retry; Interview not repeated
    expect(useOnboardingDraft.getState().firstBedId).toBe('b1');
    err.mockRestore();
  });

  it('Continue reuses existing user beds instead of recreating them', async () => {
    mockState.beds = [
      { id: 'ideas', name: 'Ideas', isIdeas: true },
      { id: 'u1', name: 'Interview', isIdeas: false },
    ];
    useOnboardingDraft.getState().setPersona('jobPrep');
    await render(<Beds />);
    await fireEvent.press(continueBtn());
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith('/onboarding/first-plant'));
    expect(addBed).not.toHaveBeenCalled();
    expect(useOnboardingDraft.getState().firstBedId).toBe('u1');
  });

  const twoBeds = () => {
    useOnboardingDraft.setState({
      persona: 'jobPrep',
      firstBedId: 'b1',
      beds: [
        { key: 'a', name: 'Interview', color: 'blue', bedId: 'b1' },
        { key: 'c', name: 'DSA', color: 'orange', bedId: 'b2' },
      ],
    });
    mockState.beds = [
      { id: 'ideas', name: 'Ideas', isIdeas: true, color: 'ideas' },
      { id: 'b1', name: 'Interview', isIdeas: false, color: 'blue' },
      { id: 'b2', name: 'DSA', isIdeas: false, color: 'orange' },
    ];
  };

  it('first plant marks onboarding done right after planting', async () => {
    twoBeds();
    await render(<FirstPlant />);
    await fireEvent.changeText(screen.getByLabelText('Your first thought'), 'Something');
    await fireEvent.press(screen.getByLabelText('Plant it in Interview'));
    await waitFor(() => expect(mockSettingsSet).toHaveBeenCalledWith('onboarding_done', '1'));
    expect(useOnboardingState.getState().done).toBe(true);
  });

  it('first plant lists only created beds, disabled until typed, plants in chosen bed', async () => {
    twoBeds();
    await render(<FirstPlant />);
    expect(screen.getByLabelText('Interview')).toBeTruthy();
    expect(screen.getByLabelText('DSA')).toBeTruthy();
    expect(screen.queryByLabelText('Ideas')).toBeNull();
    expect(screen.getByLabelText('Plant it in Interview').props.accessibilityState.disabled).toBe(true);
    await fireEvent.press(screen.getByLabelText('DSA'));
    await fireEvent.changeText(screen.getByLabelText('Your first thought'), 'Practice two-pointer problems');
    await fireEvent.press(screen.getByLabelText('Plant it in DSA'));
    await waitFor(() => expect(plant).toHaveBeenCalled());
    expect(water).not.toHaveBeenCalled();
    expect(plant).toHaveBeenCalledWith('Practice two-pointer problems', 'b2', null, 'onboarding');
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith('/onboarding/reminder'));
    expect(useOnboardingDraft.getState().planted).toEqual({ bedName: 'DSA', text: 'Practice two-pointer problems' });
  });

  it('Back then Continue again works and reconciles edits (rename, recolor, remove, add)', async () => {
    useOnboardingDraft.getState().setPersona('jobPrep');
    await render(<Beds />);
    await fireEvent.press(continueBtn());
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledTimes(1));
    expect(addBed).toHaveBeenCalledTimes(4);
    // user goes Back and edits
    await fireEvent.changeText(screen.getAllByLabelText('Bed name')[0], 'Interviews');
    await fireEvent.press(screen.getByLabelText('Change color of DSA'));
    await fireEvent.press(screen.getByLabelText('Remove Portfolio'));
    await fireEvent.changeText(screen.getByLabelText('New bed name'), 'Garage');
    await fireEvent.press(screen.getByLabelText('Add'));
    await fireEvent.press(screen.getByLabelText('Continue with 4 beds'));
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledTimes(2));
    expect(addBed).toHaveBeenCalledTimes(5);
    expect(addBed.mock.calls[4][0]).toBe('Garage');
    expect(renameBed).toHaveBeenCalledWith('b1', 'Interviews');
    expect(recolorBed).toHaveBeenCalledWith('b2', 'purple');
    expect(removeBed).toHaveBeenCalledWith('b4');
    expect(useOnboardingDraft.getState().firstBedId).toBe('b1');
  });

  it('clear all then a new bed after Back replaces the created beds', async () => {
    useOnboardingDraft.getState().setPersona('student');
    await render(<Beds />);
    await fireEvent.press(screen.getByLabelText(/^Continue with/));
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledTimes(1));
    await fireEvent.press(screen.getByLabelText('Clear all and start blank'));
    await fireEvent.changeText(screen.getByLabelText('New bed name'), 'Solo');
    await fireEvent.press(screen.getByLabelText('Add'));
    await fireEvent.press(screen.getByLabelText('Continue with 1 bed'));
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledTimes(2));
    expect(addBed.mock.calls.map((c) => c[0])).toEqual(['Subjects', 'Exams', 'Assignments', 'Skills', 'Solo']);
    expect(removeBed.mock.calls.map((c) => c[0])).toEqual(['b1', 'b2', 'b3', 'b4']);
    expect(useOnboardingDraft.getState().firstBedId).toBe('b5');
  });

  it('keeps a dropped bed that already holds a thought', async () => {
    useOnboardingDraft.getState().setPersona('jobPrep');
    await render(<Beds />);
    await fireEvent.press(continueBtn());
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledTimes(1));
    plantsInBed.mockImplementation((id: string) => (id === 'b2' ? [{ id: 'p' }] : []));
    await fireEvent.press(screen.getByLabelText('Remove DSA'));
    await fireEvent.press(screen.getByLabelText(/^Continue with/));
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledTimes(2));
    expect(removeBed).not.toHaveBeenCalled();
  });

  it('Skip drops blank names and falls back to My thoughts', async () => {
    useOnboardingDraft.getState().setPersona('jobPrep');
    await render(<Beds />);
    for (const i of [0, 1, 2, 3]) await fireEvent.changeText(screen.getAllByLabelText('Bed name')[i], '  ');
    await fireEvent.press(screen.getByLabelText('Skip'));
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalled());
    expect(addBed.mock.calls.map((c) => c[0])).toEqual(['My thoughts']);
  });

  it('first plant has no Back button once planted', async () => {
    twoBeds();
    await render(<FirstPlant />);
    expect(screen.getByLabelText('Back')).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText('Your first thought'), 'Hi');
    await fireEvent.press(screen.getByLabelText('Plant it in Interview'));
    await waitFor(() => expect(screen.queryByLabelText('Back')).toBeNull());
  });

  it('builder card subtitle matches its suggested beds', async () => {
    await render(<Persona />);
    expect(screen.getByText('Ideas to explore · Build · Learn · Launch')).toBeTruthy();
  });

  it('Not now finishes onboarding', async () => {
    useOnboardingDraft.setState({ persona: 'jobPrep', beds: [{ key: 'a', name: 'A', color: 'blue' }] });
    await render(<Reminder />);
    await fireEvent.press(screen.getByLabelText('Not now'));
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)/plant'));
    expect(mockSettingsSet).toHaveBeenCalledWith('reminder_enabled', '0');
    expect(mockSettingsSet).toHaveBeenCalledWith('onboarding_done', '1');
    expect(track).toHaveBeenCalledWith('onboarding_completed', { persona: 'jobPrep', beds_count: 1 });
    expect(useOnboardingState.getState().done).toBe(true);
  });

  it('Yes enables the reminder with the chosen time', async () => {
    mockEnable.mockResolvedValue(true);
    useOnboardingDraft.setState({ persona: 'student' });
    await render(<Reminder />);
    expect(screen.getByLabelText('Yes, nudge me').props.accessibilityState.disabled).toBe(false);
    expect(screen.getByLabelText('Evening 9:00').props.accessibilityState.selected).toBe(true);
    await fireEvent.press(screen.getByLabelText('Yes, nudge me'));
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)/plant'));
    expect(mockEnable).toHaveBeenCalledWith('21:00');
    expect(mockSettingsSet).toHaveBeenCalledWith('onboarding_done', '1');
  });

  it('Yes with permission denied still finishes onboarding', async () => {
    mockEnable.mockResolvedValue(false);
    useOnboardingDraft.setState({ persona: 'student' });
    await render(<Reminder />);
    await fireEvent.press(screen.getByLabelText('Morning 8:00'));
    await fireEvent.press(screen.getByLabelText('Yes, nudge me'));
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)/plant'));
    expect(mockSettingsSet).toHaveBeenCalledWith('onboarding_done', '1');
  });
});
