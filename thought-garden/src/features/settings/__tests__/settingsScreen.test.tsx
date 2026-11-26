import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import Settings from '@/app/settings';

const mockBack = jest.fn();
jest.mock('expo-router', () => ({ Stack: { Screen: () => null }, useRouter: () => ({ back: mockBack }) }));
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
const mockRepos = { settings: { get: async (k: string) => data[k] ?? null, set: jest.fn() }, resetAll: () => mockResetAll() };
jest.mock('@/store/AppProvider', () => ({
  useRepos: () => mockRepos,
  useGarden: (sel: (s: unknown) => unknown) => sel({ setAnalytics: jest.fn() }),
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
  expect(screen.queryByLabelText('Reset')).toBeNull();
  await fireEvent.press(screen.getByLabelText('Reset all data'));
  await fireEvent.press(screen.getByLabelText('Reset'));
  await waitFor(() => expect(mockResetAll).toHaveBeenCalledTimes(1));
});
