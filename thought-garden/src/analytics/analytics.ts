import PostHog from 'posthog-react-native';
import type { EventMap } from './events';

export interface AnalyticsClient {
  capture(name: string, props?: Record<string, unknown>): unknown;
  optIn(): unknown;
  optOut(): unknown;
}

const noopClient: AnalyticsClient = { capture() {}, optIn() {}, optOut() {} };

let client: AnalyticsClient = noopClient;
let initialised = false;

/** Keeps PostHog silent except for events sent through track(). */
export const POSTHOG_OPTIONS = {
  host: 'https://us.i.posthog.com',
  captureAppLifecycleEvents: false,
  preloadFeatureFlags: false,
  disableRemoteConfig: true,
  disableSurveys: true,
  personProfiles: 'never',
} as const;

export function initAnalytics(): void {
  if (initialised) return;
  initialised = true;
  const key = process.env.EXPO_PUBLIC_POSTHOG_KEY;
  if (!key) return;
  try {
    client = new PostHog(key, { ...POSTHOG_OPTIONS }) as unknown as AnalyticsClient;
  } catch (e) {
    console.warn('Analytics init failed', e);
    client = noopClient;
  }
}

export function track<K extends keyof EventMap>(name: K, props: EventMap[K]): void {
  try {
    client.capture(name, props as Record<string, unknown>);
  } catch {
    // analytics must never break the app
  }
}

export function setAnalyticsEnabled(on: boolean): void {
  try {
    if (on) client.optIn();
    else client.optOut();
  } catch {
    // ignore
  }
}

export function __setClientForTests(c: AnalyticsClient | null): void {
  client = c ?? noopClient;
  initialised = false;
}
