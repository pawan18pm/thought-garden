import { AppState } from 'react-native';
import { renderHook } from '@testing-library/react-native';
import { useDayRollover } from '../useDayRollover';

describe('useDayRollover', () => {
  let handler: (s: string) => void;
  const remove = jest.fn();

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 10, 20, 23, 0, 0));
    remove.mockClear();
    jest.spyOn(AppState, 'addEventListener').mockImplementation(((_t: string, h: (s: string) => void) => {
      handler = h;
      return { remove };
    }) as never);
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  const makeStore = () => ({ getState: () => ({ load: jest.fn().mockResolvedValue(undefined) }) });

  it('loads once when the day changed before returning to active', async () => {
    const store = makeStore();
    const load = store.getState().load;
    store.getState = () => ({ load });
    await renderHook(() => useDayRollover(store as never));
    jest.setSystemTime(new Date(2026, 10, 21, 7, 0, 0));
    handler('active');
    expect(load).toHaveBeenCalledTimes(1);
    handler('background');
    handler('active');
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('does not load when the day is unchanged', async () => {
    const load = jest.fn().mockResolvedValue(undefined);
    await renderHook(() => useDayRollover({ getState: () => ({ load }) } as never));
    jest.setSystemTime(new Date(2026, 10, 20, 23, 50, 0));
    handler('active');
    expect(load).not.toHaveBeenCalled();
  });

  it('ignores non-active states and removes the subscription on unmount', async () => {
    const load = jest.fn().mockResolvedValue(undefined);
    const { unmount } = await renderHook(() => useDayRollover({ getState: () => ({ load }) } as never));
    jest.setSystemTime(new Date(2026, 10, 21, 7, 0, 0));
    handler('background');
    expect(load).not.toHaveBeenCalled();
    await unmount();
    expect(remove).toHaveBeenCalledTimes(1);
  });
});
