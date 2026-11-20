import { useEffect } from 'react';
import { AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import { dayKey } from '@/domain/dates';
import { track } from '@/analytics/analytics';
import { rescheduleReminders, type SettingsStore } from './reminders';

/** Keeps the rolling reminder window fresh and records reminder taps. Mount once, after boot. */
export function useReminderLifecycle(settings: SettingsStore): void {
  useEffect(() => {
    const touch = async () => {
      try {
        await settings.set('last_opened_date', dayKey(new Date()));
      } catch (e) {
        console.warn('last_opened_date save failed', e);
      }
      await rescheduleReminders();
    };
    // Cold start: boot already tracked app_opened.
    void touch();

    let prev = AppState.currentState;
    const appSub = AppState.addEventListener('change', (next) => {
      if ((prev === 'background' || prev === 'inactive') && next === 'active') {
        track('app_opened', {});
        void touch();
      }
      prev = next;
    });

    const respSub = Notifications.addNotificationResponseReceivedListener(() => track('reminder_opened', {}));
    Notifications.getLastNotificationResponseAsync()
      .then((r) => {
        if (r) track('reminder_opened', {});
      })
      .catch(() => {});

    return () => {
      appSub.remove();
      respSub.remove();
    };
  }, [settings]);
}
