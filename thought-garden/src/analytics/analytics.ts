import PostHog from 'posthog-react-native';
import type { EventMap } from './events';

export interface AnalyticsClient {
  capture(name: string, props?: Record<string, unknown>): unknown;
  optIn(): unknown;
  optOut(): unknown;
}

const noopClient: AnalyticsClient = { capture() {}, optIn() {}, optOut() {} };

let client: AnalyticsClient = noopClient;

export function initAnalytics(): void {
  const key = process.env.EXPO_PUBLIC_POSTHOG_KEY;
  if (!key) {
    client = noopClient;
    return;
  }
  try {
    client = new PostHog(key, { host: 'https://us.i.posthog.com' }) as unknown as AnalyticsClient;
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
}
