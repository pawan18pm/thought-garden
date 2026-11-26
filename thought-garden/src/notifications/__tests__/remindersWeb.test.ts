import * as Notifications from 'expo-notifications';
import { disableReminder, enableReminder, initReminders, rescheduleReminders } from '../reminders';

jest.mock('../support', () => ({ REMINDERS_SUPPORTED: false }));
jest.mock('@/analytics/analytics', () => ({ track: jest.fn() }));
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  SchedulableTriggerInputTypes: { DATE: 'date' },
}));

const N = Notifications as jest.Mocked<typeof Notifications>;

test('on web, reminders never touch expo-notifications and stay off', async () => {
  const store: Record<string, string> = {};
  initReminders({ get: async (k) => store[k] ?? null, set: async (k, v) => void (store[k] = v) });
  expect(await enableReminder('21:00')).toBe(false);
  await rescheduleReminders();
  await disableReminder();
  expect(store.reminder_enabled).toBe('0');
  expect(N.setNotificationHandler).not.toHaveBeenCalled();
  expect(N.requestPermissionsAsync).not.toHaveBeenCalled();
  expect(N.scheduleNotificationAsync).not.toHaveBeenCalled();
  expect(N.cancelAllScheduledNotificationsAsync).not.toHaveBeenCalled();
});
