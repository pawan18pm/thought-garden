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

  it('plants into the given bed, or Ideas when none is given', async () => {
    const { store, ideas } = await setup();
    const a = await store.getState().addBed('A');
    const p1 = await store.getState().plant('Learn SQL');
    expect(p1?.bedId).toBe(ideas.id);
    const p2 = await store.getState().plant('x', a.id);
    expect(p2?.bedId).toBe(a.id);
    expect(store.getState().plantsInBed(a.id)).toHaveLength(1);
  });

  it('bloom and unbloom move plants between lists', async () => {
    const { store } = await setup();
    const p = (await store.getState().plant('t'))!;
    await store.getState().water(p.id);
    await store.getState().bloom(p.id);
    expect(store.getState().plants).toHaveLength(0);
    expect(store.getState().bloomedToday.map((x) => x.id)).toEqual([p.id]);
    await store.getState().unbloom(p.id);
    expect(store.getState().plants).toHaveLength(1);
    expect(store.getState().bloomedToday).toHaveLength(0);
  });

  it('bloom refuses an unwatered plant', async () => {
    const { store } = await setup();
    const p = (await store.getState().plant('t'))!;
    await store.getState().bloom(p.id);
    expect(store.getState().plants.map((x) => x.id)).toEqual([p.id]);
    expect(store.getState().bloomedToday).toHaveLength(0);
    expect(captures.filter((c) => c.name === 'plant_bloomed')).toHaveLength(0);
  });

  it('bloom on an already bloomed plant does nothing', async () => {
    const { store } = await setup();
    const p = (await store.getState().plant('t'))!;
    await store.getState().water(p.id);
    await store.getState().bloom(p.id);
    await store.getState().bloom(p.id);
    expect(captures.filter((c) => c.name === 'plant_bloomed')).toHaveLength(1);
    expect(store.getState().bloomedToday).toHaveLength(1);
  });

  it('concurrent bloom blooms once', async () => {
    const { store } = await setup();
    const p = (await store.getState().plant('t'))!;
    await store.getState().water(p.id);
    await Promise.all([store.getState().bloom(p.id), store.getState().bloom(p.id)]);
    expect(captures.filter((c) => c.name === 'plant_bloomed')).toHaveLength(1);
  });

  it('removeBed re-homes plants into Ideas', async () => {
    const { store, ideas } = await setup();
    const a = await store.getState().addBed('A');
    await store.getState().addBed('B');
    await store.getState().plant('x', a.id);
    await store.getState().removeBed(a.id);
    expect(store.getState().beds.find((b) => b.id === a.id)).toBeUndefined();
    expect(store.getState().plants[0].bedId).toBe(ideas.id);
  });

  it('third water auto-blooms', async () => {
    const { store, repos } = await setup();
    const p = (await store.getState().plant('t'))!;
    await repos.plants.water(p.id);
    await repos.plants.water(p.id);
    await store.getState().load();
    await store.getState().water(p.id);
    expect(store.getState().plants).toHaveLength(0);
    const b = store.getState().bloomedToday[0];
    expect(b.id).toBe(p.id);
    expect(b.bloomedAt).toBeTruthy();
    expect(b.waterCount).toBe(3);
    expect(captures.find((c) => c.name === 'plant_bloomed')?.props).toMatchObject({ auto: true });
  });

  it('concurrent water blooms once', async () => {
    const { store, repos } = await setup();
    const p = (await store.getState().plant('t'))!;
    await repos.plants.water(p.id);
    await repos.plants.water(p.id);
    await store.getState().load();
    await Promise.all([store.getState().water(p.id), store.getState().water(p.id)]);
    expect(captures.filter((c) => c.name === 'plant_bloomed')).toHaveLength(1);
    expect(store.getState().bloomedToday).toHaveLength(1);
    expect(store.getState().bloomedToday[0].waterCount).toBe(3);
  });

  it('removeBed refuses last bed', async () => {
    const { store } = await setup();
    const a = await store.getState().addBed('A');
    await store.getState().removeBed(a.id);
    expect(store.getState().beds.find((b) => b.id === a.id)).toBeDefined();
  });

  it('removeBed moveTo keeps thoughts', async () => {
    const { store } = await setup();
    const a = await store.getState().addBed('A');
    const b = await store.getState().addBed('B');
    await store.getState().plant('x', a.id);
    await store.getState().removeBed(a.id, { moveTo: b.id });
    expect(store.getState().beds.find((x) => x.id === a.id)).toBeUndefined();
    expect(store.getState().plantsInBed(b.id)).toHaveLength(1);
  });

  it('removeBed deleteThoughts removes plants', async () => {
    const { store } = await setup();
    const a = await store.getState().addBed('A');
    await store.getState().addBed('B');
    await store.getState().plant('x', a.id);
    await store.getState().removeBed(a.id, { deleteThoughts: true });
    expect(store.getState().plants).toHaveLength(0);
    expect(store.getState().beds.find((x) => x.id === a.id)).toBeUndefined();
  });

  it('removeBed deleteThoughts also deletes bloomed thoughts in that bed', async () => {
    const { store, repos } = await setup();
    const a = await store.getState().addBed('A');
    await store.getState().addBed('B');
    const p = (await store.getState().plant('done', a.id))!;
    await store.getState().water(p.id);
    await store.getState().bloom(p.id);
    expect(store.getState().bloomedToday).toHaveLength(1);
    await store.getState().removeBed(a.id, { deleteThoughts: true });
    expect(store.getState().bloomedToday).toHaveLength(0);
    expect((await repos.activity.detailRange('0000-01-01', '9999-12-31')).bloomed).toHaveLength(0);
  });

  it('bed names are clamped to 30 characters and blank renames ignored', async () => {
    const { store } = await setup();
    const a = await store.getState().addBed('x'.repeat(40));
    expect(store.getState().beds.find((b) => b.id === a.id)?.name).toBe('x'.repeat(30));
    await store.getState().renameBed(a.id, '   ');
    expect(store.getState().beds.find((b) => b.id === a.id)?.name).toBe('x'.repeat(30));
    await store.getState().renameBed(a.id, 'y'.repeat(35));
    expect(store.getState().beds.find((b) => b.id === a.id)?.name).toBe('y'.repeat(30));
  });

  it('addBed with colour stores it', async () => {
    const { store } = await setup();
    const a = await store.getState().addBed('A', 'pink');
    expect(a.color).toBe('pink');
    expect(store.getState().beds.find((b) => b.id === a.id)?.color).toBe('pink');
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
