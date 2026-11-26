import { Platform } from 'react-native';

/** Local scheduled notifications don't exist on web: reminders are a phone-app feature. */
export const REMINDERS_SUPPORTED = Platform.OS !== 'web';
