import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import Settings from '@/app/settings';
import { useOnboardingState } from '@/store/onboardingState';
import { useOnboardingDraft } from '@/features/onboarding/useOnboardingDraft';
import { __setClientForTests } from '@/analytics/analytics';

const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockNav: string[] = [];
const mockDismissAll = jest.fn(() => mockNav.push('dismissAll'));
jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({
    back: mockBack,
    replace: (...a: unknown[]) => {
      mockNav.push('replace');
      mockReplace(...a);
    },
    canDismiss: () => true,
    dismissAll: mockDismissAll,
  }),
}));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 47, bottom: 0, left: 0, right: 0 }) }));
jest.mock('expo-constants', () => ({ __esModule: true, default: { expoConfig: { version: '1.0.0' } } }));
jest.mock('@/features/settings/ManageBeds', () => ({ ManageBeds: () => null }));
jest.mock('@/ui/tokens', () => jest.requireActual('@/ui/tokens'));

let mockOnChange: ((e: unknown, d?: Date) => void) | undefined;
jest.mock('@react-native-community/datetimepicker', () => (props: { onChange: (e: unknown, d?: Date) => void }) => {
  mockOnChange = props.onChange;
  return null;
});

const mockGetPerm = jest.fn();
jest.mock('expo-notifications', () => ({ getPermissionsAsync: () => mockGetPerm() }));
const mockEnable = jest.fn();
jest.mock('@/notifications/reminders', () => ({
  enableReminder: (...a: unknown[]) => mockEnable(...a),
  disableReminder: jest.fn(),
}));

const data: Record<string, string> = { reminder_enabled: '1', reminder_time: '21:00', persona: 'professional' };
const mockResetAll = jest.fn();
const mockEnsureIdeas = jest.fn();
const mockLoad = jest.fn();
const mockRepos = { settings: { get: async (k: string) => data[k] ?? null, set: jest.fn() }, beds: { ensureIdeas: () => mockEnsureIdeas() }, resetAll: () => mockResetAll() };
jest.mock('@/store/AppProvider', () => ({
  useRepos: () => mockRepos,
  useGarden: (sel: (s: unknown) => unknown) => sel({ setAnalytics: jest.fn(), load: () => mockLoad() }),
}));

it('changing time while permission was revoked turns the switch off and shows the banner', async () => {
  mockGetPerm.mockResolvedValue({ status: 'granted' });
  await render(<Settings />);
  await waitFor(() => expect(screen.getByLabelText('Remind me daily').props.value).toBe(true));
  mockEnable.mockResolvedValue(false);
  mockGetPerm.mockResolvedValue({ status: 'denied' });
  await act(async () => {
    mockOnChange!({}, new Date(2026, 0, 1, 7, 30));
  });
  await waitFor(() => expect(screen.getByLabelText('Remind me daily').props.value).toBe(false));
  expect(mockEnable).toHaveBeenCalledWith('07:30');
  expect(screen.getByText('Notifications are off for Thought Garden. Turn them on in iOS Settings.')).toBeTruthy();
});

it('shows the v6 layout: back, title, persona label, privacy, about with version', async () => {
  mockGetPerm.mockResolvedValue({ status: 'granted' });
  await render(<Settings />);
  expect(screen.getByText('Settings')).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('Back'));
  expect(mockBack).toHaveBeenCalled();
  await waitFor(() => expect(screen.getByText(/My work/)).toBeTruthy());
  expect(screen.getByText('Privacy')).toBeTruthy();
  expect(screen.getByText('About & feedback')).toBeTruthy();
  expect(screen.getByText('Thought Garden v1.0.0')).toBeTruthy();
  expect(screen.getByText('Morning 8:00')).toBeTruthy();
  expect(screen.getByText('Evening 9:00')).toBeTruthy();
});

it('Reset asks to confirm before wiping', async () => {
  mockGetPerm.mockResolvedValue({ status: 'granted' });
  await render(<Settings />);
  await fireEvent.press(screen.getByLabelText('Reset all data'));
  expect(mockResetAll).not.toHaveBeenCalled();
  expect(screen.getByText("Delete every bed, thought and bloom? This can't be undone.")).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('Keep my garden'));
  expect(screen.queryByLabelText('Reset all data and delete everything')).toBeNull();
  await fireEvent.press(screen.getByLabelText('Reset all data'));
  useOnboardingState.getState().setDone(true);
  useOnboardingDraft.getState().setPersona('professional');
  const optIn = jest.fn();
  __setClientForTests({ capture: jest.fn(), optIn, optOut: jest.fn() });
  mockNav.length = 0;
  await fireEvent.press(screen.getByLabelText('Reset all data and delete everything'));
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/onboarding/welcome'));
  // Tabs are dismissed before Welcome replaces them, so back can't reach an empty garden.
  expect(mockNav).toEqual(['dismissAll', 'replace']);
  // The analytics client is re-synced to the default (on), matching the toggle after the wipe.
  expect(optIn).toHaveBeenCalled();
  __setClientForTests(null);
  expect(mockResetAll).toHaveBeenCalledTimes(1);
  expect(mockEnsureIdeas).toHaveBeenCalled();
  expect(mockLoad).toHaveBeenCalled();
  expect(useOnboardingState.getState().done).toBe(false);
  expect(useOnboardingDraft.getState().persona).toBeNull();
});

it('Reset failure keeps the user on Settings and shows an error', async () => {
  mockGetPerm.mockResolvedValue({ status: 'granted' });
  mockReplace.mockClear();
  mockResetAll.mockRejectedValueOnce(new Error('boom'));
  await render(<Settings />);
  await fireEvent.press(screen.getByLabelText('Reset all data'));
  await fireEvent.press(screen.getByLabelText('Reset all data and delete everything'));
  await waitFor(() => expect(screen.getByText("Couldn't reset. Try again.")).toBeTruthy());
  expect(mockReplace).not.toHaveBeenCalled();
});

it('Reset still goes to onboarding if the store reload throws after the wipe', async () => {
  mockGetPerm.mockResolvedValue({ status: 'granted' });
  mockReplace.mockClear();
  mockLoad.mockRejectedValueOnce(new Error('reload'));
  useOnboardingState.getState().setDone(true);
  await render(<Settings />);
  await fireEvent.press(screen.getByLabelText('Reset all data'));
  await fireEvent.press(screen.getByLabelText('Reset all data and delete everything'));
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/onboarding/welcome'));
  expect(useOnboardingState.getState().done).toBe(false);
});

it('About & feedback is info only: version, no chevron, not a button', async () => {
  mockGetPerm.mockResolvedValue({ status: 'granted' });
  await render(<Settings />);
  expect(screen.getByText('v1.0.0')).toBeTruthy();
  expect(screen.queryByText('v1.0.0 ›')).toBeNull();
  expect(screen.queryByRole('button', { name: 'About & feedback' })).toBeNull();
});

it('top padding follows the safe area', async () => {
  mockGetPerm.mockResolvedValue({ status: 'granted' });
  await render(<Settings />);
  const scroll = screen.getByTestId('settings-scroll');
  const style = require('react-native').StyleSheet.flatten(scroll.props.contentContainerStyle);
  expect(style.paddingTop).toBe(55);
});
