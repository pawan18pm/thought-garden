/** @jest-environment node */
import { __setClientForTests, initAnalytics, setAnalyticsEnabled, track } from '../analytics';

function fake() {
  return { capture: jest.fn(), optIn: jest.fn(), optOut: jest.fn() };
}

describe('analytics', () => {
  afterEach(() => __setClientForTests(null));

  it('track forwards name and props to capture', () => {
    const c = fake();
    __setClientForTests(c);
    track('plant_watered', { water_count: 2 });
    expect(c.capture).toHaveBeenCalledWith('plant_watered', { water_count: 2 });
  });

  it('with no key, initAnalytics + track do not throw', () => {
    const saved = process.env.EXPO_PUBLIC_POSTHOG_KEY;
    delete process.env.EXPO_PUBLIC_POSTHOG_KEY;
    expect(() => {
      initAnalytics();
      track('app_opened', {});
    }).not.toThrow();
    if (saved !== undefined) process.env.EXPO_PUBLIC_POSTHOG_KEY = saved;
  });

  it('setAnalyticsEnabled toggles optOut/optIn', () => {
    const c = fake();
    __setClientForTests(c);
    setAnalyticsEnabled(false);
    expect(c.optOut).toHaveBeenCalled();
    setAnalyticsEnabled(true);
    expect(c.optIn).toHaveBeenCalled();
  });
});
