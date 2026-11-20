import * as Notifications from 'expo-notifications';
import { disableReminder, enableReminder, initReminders, rescheduleReminders } from '../reminders';

const mockTrack = jest.fn();
jest.mock('@/analytics/analytics', () => ({ track: (...a: unknown[]) => mockTrack(...a) }));

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  SchedulableTriggerInputTypes: { DATE: 'date' },
}));

const N = Notifications as jest.Mocked<typeof Notifications>;
let store: Record<string, string>;
const settings = {
  get: async (k: string) => store[k] ?? null,
  set: async (k: string, v: string) => {
    store[k] = v;
  },
};
const NOW = new Date(2026, 10, 19, 10, 0, 0);

beforeEach(() => {
  jest.clearAllMocks();
  store = {};
  initReminders(settings);
  N.getPermissionsAsync.mockResolvedValue({ status: 'undetermined' } as never);
  N.requestPermissionsAsync.mockResolvedValue({ status: 'granted' } as never);
  N.scheduleNotificationAsync.mockResolvedValue('id');
  N.cancelAllScheduledNotificationsAsync.mockResolvedValue(undefined);
});

describe('reminders', () => {
  it('invalid time: returns false before asking for permission', async () => {
    await expect(enableReminder('9pm')).resolves.toBe(false);
    expect(N.getPermissionsAsync).not.toHaveBeenCalled();
    expect(N.requestPermissionsAsync).not.toHaveBeenCalled();
    expect(store.reminder_enabled).toBeUndefined();
  });

  it('permission denied: returns false, stores 0, never schedules, tracks denial', async () => {
    N.requestPermissionsAsync.mockResolvedValue({ status: 'denied' } as never);
    await expect(enableReminder('21:00')).resolves.toBe(false);
    expect(store.reminder_enabled).toBe('0');
    expect(N.scheduleNotificationAsync).not.toHaveBeenCalled();
    expect(mockTrack).toHaveBeenCalledWith('reminder_permission_denied', {});
  });

  it('request throwing does not throw out', async () => {
    N.requestPermissionsAsync.mockRejectedValue(new Error('boom'));
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    await expect(enableReminder('21:00')).resolves.toBe(false);
    warn.mockRestore();
    expect(N.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('granted: stores, tracks, schedules 14 starting tomorrow', async () => {
    await expect(enableReminder('21:00')).resolves.toBe(true);
    expect(store).toMatchObject({ reminder_enabled: '1', reminder_time: '21:00' });
    expect(mockTrack).toHaveBeenCalledWith('reminder_enabled', { time: '21:00' });
    expect(N.scheduleNotificationAsync).toHaveBeenCalledTimes(14);
    const today = new Date().toDateString();
    for (const [req] of N.scheduleNotificationAsync.mock.calls) {
      const t = req.trigger as { type: string; date: Date };
      expect(t.type).toBe('date');
      expect(t.date.toDateString()).not.toBe(today);
      expect(req.content.title).toBe('Mindbed');
    }
  });

  it('already granted: does not re-request', async () => {
    N.getPermissionsAsync.mockResolvedValue({ status: 'granted' } as never);
    await enableReminder('08:00');
    expect(N.requestPermissionsAsync).not.toHaveBeenCalled();
    expect(N.scheduleNotificationAsync).toHaveBeenCalledTimes(14);
  });

  it('rescheduleReminders cancels before scheduling', async () => {
    store = { reminder_enabled: '1', reminder_time: '21:00' };
    const order: string[] = [];
    N.cancelAllScheduledNotificationsAsync.mockImplementation(async () => void order.push('cancel'));
    N.scheduleNotificationAsync.mockImplementation(async () => (order.push('schedule'), 'id'));
    await rescheduleReminders(NOW);
    expect(order[0]).toBe('cancel');
    expect(order.filter((o) => o === 'schedule')).toHaveLength(14);
    const first = N.scheduleNotificationAsync.mock.calls[0][0].trigger as { date: Date };
    expect(first.date.getDate()).toBe(20);
    expect(first.date.getHours()).toBe(21);
  });

  it('disabled: cancels and schedules nothing', async () => {
    store = { reminder_enabled: '0', reminder_time: '21:00' };
    await rescheduleReminders(NOW);
    expect(N.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
    expect(N.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('reschedule never throws', async () => {
    store = { reminder_enabled: '1', reminder_time: '21:00' };
    N.scheduleNotificationAsync.mockRejectedValue(new Error('x'));
    const log = jest.spyOn(console, 'warn').mockImplementation(() => {});
    await expect(rescheduleReminders(NOW)).resolves.toBeUndefined();
    log.mockRestore();
  });

  it('disableReminder stores 0, cancels, tracks', async () => {
    await disableReminder();
    expect(store.reminder_enabled).toBe('0');
    expect(N.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
    expect(mockTrack).toHaveBeenCalledWith('reminder_disabled', {});
  });

  it('concurrent reschedules leave exactly 14 pending', async () => {
    store = { reminder_enabled: '1', reminder_time: '21:00' };
    const pending = new Map<string, unknown>();
    const tick = () => new Promise((r) => setTimeout(r, 0));
    N.cancelAllScheduledNotificationsAsync.mockImplementation(async () => {
      await tick();
      pending.clear();
    });
    N.scheduleNotificationAsync.mockImplementation(async (req) => {
      await tick();
      pending.set(req.identifier as string, req);
      return req.identifier as string;
    });
    await Promise.all([rescheduleReminders(NOW), rescheduleReminders(NOW)]);
    expect(pending.size).toBe(14);
    expect(pending.has('reminder-0')).toBe(true);
  });
});
