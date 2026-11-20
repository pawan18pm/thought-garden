/** @jest-environment node */
import { createNodeDb } from '@/db/__tests__/nodeDb';
import { migrate } from '@/db/schema';
import { createRepos } from '@/db/repos';
import { __setClientForTests } from '@/analytics/analytics';
import { createGardenStore } from '../garden';

let captures: { name: string; props: unknown }[];

async function setup() {
  captures = [];
  __setClientForTests({
    capture: (name: string, props?: unknown) => captures.push({ name, props }),
    optIn: jest.fn(),
    optOut: jest.fn(),
  });
  let n = 0;
  const db = createNodeDb();
  await migrate(db);
  const repos = createRepos(db, () => `id${++n}`, () => new Date().toISOString());
  const ideas = await repos.beds.ensureIdeas();
  const store = createGardenStore(repos);
  await store.getState().load();
  return { store, repos, ideas };
}

describe('garden store', () => {
  afterEach(() => __setClientForTests(null));

  it('rejects empty text', async () => {
    const { store } = await setup();
    expect(await store.getState().plant('   ')).toBeNull();
    expect(store.getState().plants).toHaveLength(0);
  });

  it('defaults to Ideas, then follows lastBedId', async () => {
    const { store, ideas } = await setup();
    const a = await store.getState().addBed('A');
    const p1 = await store.getState().plant('Learn SQL');
    expect(p1?.bedId).toBe(ideas.id);
    await store.getState().plant('x', a.id);
    const p2 = await store.getState().plant('y');
    expect(p2?.bedId).toBe(a.id);
    expect(store.getState().plantsInBed(a.id)).toHaveLength(2);
  });

  it('bloom and unbloom move plants between lists', async () => {
    const { store } = await setup();
    const p = (await store.getState().plant('t'))!;
    await store.getState().bloom(p.id);
    expect(store.getState().plants).toHaveLength(0);
    expect(store.getState().bloomedToday.map((x) => x.id)).toEqual([p.id]);
    await store.getState().unbloom(p.id);
    expect(store.getState().plants).toHaveLength(1);
    expect(store.getState().bloomedToday).toHaveLength(0);
  });

  it('removeBed re-homes plants into Ideas', async () => {
    const { store, ideas } = await setup();
    const a = await store.getState().addBed('A');
    await store.getState().plant('x', a.id);
    await store.getState().removeBed(a.id);
    expect(store.getState().beds.find((b) => b.id === a.id)).toBeUndefined();
    expect(store.getState().plants[0].bedId).toBe(ideas.id);
  });

  it('setAnalytics persists the setting', async () => {
    const { store, repos } = await setup();
    await store.getState().setAnalytics(false);
    expect(await repos.settings.get('analytics_enabled')).toBe('0');
  });

  it('never sends thought text or bed names', async () => {
    const { store } = await setup();
    const a = await store.getState().addBed('SecretBedName');
    const p = (await store.getState().plant('Secret thought', a.id, 3))!;
    await store.getState().water(p.id);
    await store.getState().bloom(p.id);
    await store.getState().remove(p.id);
    const all = JSON.stringify(captures);
    expect(all).not.toContain('Secret thought');
    expect(all).not.toContain('SecretBedName');
    expect(captures.map((c) => c.name)).toEqual(
      expect.arrayContaining(['plant_created', 'plant_watered', 'plant_bloomed', 'bed_created', 'plant_deleted']),
    );
  });
});
