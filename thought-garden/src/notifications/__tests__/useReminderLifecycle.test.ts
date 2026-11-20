import { act, renderHook } from '@testing-library/react-native';
import { AppState } from 'react-native';
import { useReminderLifecycle } from '../useReminderLifecycle';

const mockTrack = jest.fn();
jest.mock('@/analytics/analytics', () => ({ track: (...a: unknown[]) => mockTrack(...a) }));
const mockResched = jest.fn().mockResolvedValue(undefined);
jest.mock('../reminders', () => ({ rescheduleReminders: () => mockResched() }));
jest.mock('expo-notifications', () => ({
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  getLastNotificationResponseAsync: jest.fn().mockResolvedValue(null),
}));

describe('useReminderLifecycle', () => {
  it('tracks app_opened only after a real background, always reschedules', async () => {
    let handler: (s: string) => void = () => {};
    jest.spyOn(AppState, 'addEventListener').mockImplementation(((_: string, h: (s: string) => void) => {
      handler = h;
      return { remove: jest.fn() };
    }) as never);
    const set = jest.fn().mockResolvedValue(undefined);
    await renderHook(() => useReminderLifecycle({ get: jest.fn(), set }));
    mockTrack.mockClear();
    mockResched.mockClear();

    await act(async () => {
      handler('inactive');
      handler('active'); // permission prompt blip
    });
    expect(mockTrack).not.toHaveBeenCalledWith('app_opened', {});
    expect(mockResched).toHaveBeenCalledTimes(1);

    await act(async () => {
      handler('inactive');
      handler('background');
      handler('inactive');
      handler('active');
    });
    expect(mockTrack).toHaveBeenCalledWith('app_opened', {});
    expect(mockTrack.mock.calls.filter((c) => c[0] === 'app_opened')).toHaveLength(1);
    expect(mockResched).toHaveBeenCalledTimes(2);
    expect(set).toHaveBeenCalledWith('last_opened_date', expect.any(String));
  });
});
