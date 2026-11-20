/** @jest-environment node */
import { createNodeDb } from '@/db/__tests__/nodeDb';
import { __setClientForTests } from '@/analytics/analytics';
import { __resetBootForTests, bootOnce } from '../boot';

jest.mock('expo-crypto', () => ({ randomUUID: () => 'x' }));
jest.mock('@/db/expoDb', () => ({ openExpoDb: jest.fn() }));

describe('bootOnce', () => {
  afterEach(() => {
    __resetBootForTests();
    __setClientForTests(null);
  });

  it('runs side effects once for concurrent calls', async () => {
    const capture = jest.fn();
    __setClientForTests({ capture, optIn: jest.fn(), optOut: jest.fn() });
    let n = 0;
    const openDb = jest.fn(async () => createNodeDb());
    const deps = { openDb, newId: () => `id${++n}` };
    const [a, b] = await Promise.all([bootOnce(deps), bootOnce(deps)]);
    expect(a).toBe(b);
    expect(openDb).toHaveBeenCalledTimes(1);
    expect(a.store.getState().beds.filter((x) => x.isIdeas)).toHaveLength(1);
    expect(capture.mock.calls.filter((c) => c[0] === 'app_opened')).toHaveLength(1);
  });
});
