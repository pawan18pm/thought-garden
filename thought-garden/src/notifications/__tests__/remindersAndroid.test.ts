import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { enableReminder, initReminders } from '../reminders';

jest.mock('@/analytics/analytics', () => ({ track: jest.fn() }));

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  SchedulableTriggerInputTypes: { DATE: 'date' },
  AndroidImportance: { DEFAULT: 5 },
}));

const N = Notifications as jest.Mocked<typeof Notifications>;
const store: Record<string, string> = {};

beforeEach(() => {
  jest.clearAllMocks();
  jest.replaceProperty(Platform, 'OS', 'android');
  initReminders({
    get: async (k) => store[k] ?? null,
    set: async (k, v) => {
      store[k] = v;
    },
  });
  N.getPermissionsAsync.mockResolvedValue({ status: 'undetermined' } as never);
  N.requestPermissionsAsync.mockResolvedValue({ status: 'granted' } as never);
});

afterEach(() => jest.restoreAllMocks());

it('Android: creates the channel before asking permission and schedules into it', async () => {
  await expect(enableReminder('21:00')).resolves.toBe(true);
  expect(N.setNotificationChannelAsync).toHaveBeenCalledWith('reminders', expect.objectContaining({ name: 'Daily reminder' }));
  expect(N.setNotificationChannelAsync.mock.invocationCallOrder[0]).toBeLessThan(
    N.requestPermissionsAsync.mock.invocationCallOrder[0],
  );
  expect(N.scheduleNotificationAsync.mock.calls[0][0].trigger).toMatchObject({ channelId: 'reminders' });
});
