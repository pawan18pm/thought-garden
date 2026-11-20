import * as Notifications from 'expo-notifications';
import { reminderDates, reminderLine } from '@/domain/reminder';
import { track } from '@/analytics/analytics';

export interface SettingsStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
}

const DEFAULT_TIME = '21:00';
let settings: SettingsStore | null = null;

/** Called once from boot: gives this module settings access and sets the foreground handler. */
export function initReminders(s: SettingsStore): void {
  settings = s;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

function store(): SettingsStore {
  if (!settings) throw new Error('initReminders has not been called');
  return settings;
}

export async function enableReminder(time: string): Promise<boolean> {
  try {
    const s = store();
    let status = (await Notifications.getPermissionsAsync()).status;
    if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
    if (status !== 'granted') {
      await s.set('reminder_enabled', '0');
      track('reminder_permission_denied', {});
      return false;
    }
    if (!/^\d{2}:\d{2}$/.test(time)) throw new Error(`Invalid reminder time: ${time}`);
    await s.set('reminder_enabled', '1');
    await s.set('reminder_time', time);
    track('reminder_enabled', { time: time as `${number}:${number}` });
    await rescheduleReminders();
    return true;
  } catch (e) {
    console.warn('enableReminder failed', e);
    return false;
  }
}

export async function disableReminder(): Promise<void> {
  try {
    await store().set('reminder_enabled', '0');
    await Notifications.cancelAllScheduledNotificationsAsync();
    track('reminder_disabled', {});
  } catch (e) {
    console.warn('disableReminder failed', e);
  }
}

let chain: Promise<void> = Promise.resolve();

/** Rolling window: cancel everything, then schedule the next 14 days (starting tomorrow). Calls are serialized. */
export function rescheduleReminders(now: Date = new Date()): Promise<void> {
  const run = chain.then(() => doReschedule(now));
  chain = run.catch(() => {});
  return run;
}

async function doReschedule(now: Date): Promise<void> {
  try {
    const s = store();
    await Notifications.cancelAllScheduledNotificationsAsync();
    if ((await s.get('reminder_enabled')) !== '1') return;
    const time = (await s.get('reminder_time')) ?? DEFAULT_TIME;
    const dates = reminderDates(now, time);
    for (let i = 0; i < dates.length; i++) {
      await Notifications.scheduleNotificationAsync({
        identifier: `reminder-${i}`,
        content: { title: 'Mindbed', body: reminderLine(i) },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: dates[i] },
      });
    }
  } catch (e) {
    console.warn('rescheduleReminders failed', e);
  }
}
