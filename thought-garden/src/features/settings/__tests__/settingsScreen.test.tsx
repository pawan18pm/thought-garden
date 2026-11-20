import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import Settings from '@/app/settings';

jest.mock('expo-router', () => ({ Stack: { Screen: () => null } }));
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

const data: Record<string, string> = { reminder_enabled: '1', reminder_time: '21:00' };
const mockRepos = { settings: { get: async (k: string) => data[k] ?? null, set: jest.fn() } };
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
  expect(screen.getByText('Notifications are off for Mindbed. Turn them on in iOS Settings.')).toBeTruthy();
});
