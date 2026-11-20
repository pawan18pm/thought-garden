/** @jest-environment node */
import { createNodeDb } from './nodeDb';
import { migrate } from '../schema';
import { createRepos } from '../repos';

let n = 0;
let clock = '2026-11-19T10:00:00+05:30';
async function setup() {
  n = 0;
  clock = '2026-11-19T10:00:00+05:30';
  const db = createNodeDb();
  await migrate(db);
  return createRepos(db, () => `id${++n}`, () => clock);
}

describe('repos', () => {
  it('migrate is idempotent', async () => {
    const db = createNodeDb();
    await migrate(db);
    await expect(migrate(db)).resolves.toBeUndefined();
  });

  it('listActive excludes bloomed and deleted, includes waterCount', async () => {
    const r = await setup();
    const bed = await r.beds.create('A');
    const a = await r.plants.create({ text: 'a', bedId: bed.id, priority: null });
    const b = await r.plants.create({ text: 'b', bedId: bed.id, priority: 2 });
    const c = await r.plants.create({ text: 'c', bedId: bed.id, priority: 3 });
    expect(a.waterCount).toBe(0);
    expect(a.bloomedAt).toBeNull();
    await r.plants.bloom(b.id);
    await r.plants.remove(c.id);
    await r.plants.water(a.id);
    const list = await r.plants.listActive();
    expect(list.map((p) => p.id)).toEqual([a.id]);
    expect(list[0].waterCount).toBe(1);
  });

  it('water twice gives waterCount 2', async () => {
    const r = await setup();
    const bed = await r.beds.create('A');
    const a = await r.plants.create({ text: 'a', bedId: bed.id, priority: 1 });
    await r.plants.water(a.id);
    await r.plants.water(a.id);
    expect((await r.plants.listActive())[0].waterCount).toBe(2);
  });

  it('bloom sets bloomedAt and unbloom clears it', async () => {
    const r = await setup();
    const bed = await r.beds.create('A');
    const a = await r.plants.create({ text: 'a', bedId: bed.id, priority: 1 });
    await r.plants.bloom(a.id);
    expect((await r.plants.bloomedOn('2026-11-19')).map((p) => p.id)).toEqual([a.id]);
    expect((await r.plants.bloomedOn('2026-11-19'))[0].bloomedAt).toBe(clock);
    await r.plants.unbloom(a.id);
    expect(await r.plants.bloomedOn('2026-11-19')).toEqual([]);
    expect((await r.plants.listActive())[0].bloomedAt).toBeNull();
  });

  it('ensureIdeas is idempotent', async () => {
    const r = await setup();
    const i1 = await r.beds.ensureIdeas();
    const i2 = await r.beds.ensureIdeas();
    expect(i2.id).toBe(i1.id);
    expect(i1.isIdeas).toBe(true);
    expect(i1.color).toBe('ideas');
    expect((await r.beds.list()).filter((b) => b.isIdeas)).toHaveLength(1);
  });

  it('beds.list orders by position then Ideas last; create assigns colors in order', async () => {
    const r = await setup();
    await r.beds.ensureIdeas();
    const a = await r.beds.create('A');
    const b = await r.beds.create('B');
    expect(a.color).toBe('blue');
    expect(b.color).toBe('orange');
    expect(a.position).toBe(0);
    expect(b.position).toBe(1);
    expect((await r.beds.list()).map((x) => x.name)).toEqual(['A', 'B', 'Ideas']);
    await r.beds.reorder([b.id, a.id]);
    expect((await r.beds.list()).map((x) => x.name)).toEqual(['B', 'A', 'Ideas']);
  });

  it('rename/setColor/setFolded work, no-op on Ideas', async () => {
    const r = await setup();
    const ideas = await r.beds.ensureIdeas();
    const a = await r.beds.create('A');
    await r.beds.rename(a.id, 'Z');
    await r.beds.setColor(a.id, 'orange');
    await r.beds.setFolded(a.id, true);
    await r.beds.rename(ideas.id, 'X');
    await r.beds.setColor(ideas.id, 'blue');
    const list = await r.beds.list();
    expect(list[0]).toMatchObject({ name: 'Z', color: 'orange', folded: true });
    expect(list[1]).toMatchObject({ name: 'Ideas', color: 'ideas' });
  });

  it('removing a bed moves all its plants to Ideas', async () => {
    const r = await setup();
    const b = await r.beds.create('B');
    const p1 = await r.plants.create({ text: '1', bedId: b.id, priority: null });
    const p2 = await r.plants.create({ text: '2', bedId: b.id, priority: null });
    await r.beds.remove(b.id);
    const beds = await r.beds.list();
    expect(beds.map((x) => x.name)).toEqual(['Ideas']);
    const active = await r.plants.listActive();
    expect(active.map((p) => p.id).sort()).toEqual([p1.id, p2.id].sort());
    expect(active.every((p) => p.bedId === beds[0].id)).toBe(true);
  });

  it('removing the Ideas bed throws and changes nothing', async () => {
    const r = await setup();
    const ideas = await r.beds.ensureIdeas();
    await expect(r.beds.remove(ideas.id)).rejects.toThrow();
    expect(await r.beds.list()).toHaveLength(1);
  });

  it('plants.remove hides from listActive, day and detail', async () => {
    const r = await setup();
    const b = await r.beds.create('B');
    const p = await r.plants.create({ text: '1', bedId: b.id, priority: null });
    await r.plants.water(p.id);
    await r.plants.bloom(p.id);
    await r.plants.remove(p.id);
    expect(await r.plants.listActive()).toEqual([]);
    expect(await r.activity.day('2026-11-19')).toEqual({ planted: 0, watered: 0, bloomed: 0 });
    expect(await r.activity.detail('2026-11-19')).toEqual({ bloomed: [], watered: [], planted: [] });
    expect(await r.activity.week('2026-11-16', '2026-11-22')).toEqual({ blooms: 0, waters: 0 });
    expect(await r.activity.month(2026, 10)).toEqual({});
    expect(await r.plants.bloomedOn('2026-11-19')).toEqual([]);
  });

  it('edit patches fields', async () => {
    const r = await setup();
    const b = await r.beds.create('B');
    const b2 = await r.beds.create('C');
    const p = await r.plants.create({ text: '1', bedId: b.id, priority: null });
    await r.plants.edit(p.id, { text: 'x', priority: 3, bedId: b2.id });
    expect((await r.plants.listActive())[0]).toMatchObject({ text: 'x', priority: 3, bedId: b2.id });
  });

  it('local-day boundary at midnight', async () => {
    const r = await setup();
    const b = await r.beds.create('B');
    const p = await r.plants.create({ text: '1', bedId: b.id, priority: null });
    clock = '2026-11-19T23:59:00+05:30';
    await r.plants.water(p.id);
    expect((await r.activity.day('2026-11-19')).watered).toBe(1);
    expect((await r.activity.day('2026-11-20')).watered).toBe(0);
    clock = '2026-11-20T00:00:00+05:30';
    await r.plants.water(p.id);
    expect((await r.activity.day('2026-11-20')).watered).toBe(1);
    expect((await r.activity.day('2026-11-19')).watered).toBe(1);
  });

  it('week counts only in range; month and detail', async () => {
    const r = await setup();
    const b = await r.beds.create('B');
    const p = await r.plants.create({ text: '1', bedId: b.id, priority: null });
    clock = '2026-11-15T10:00:00+05:30';
    await r.plants.water(p.id);
    clock = '2026-11-16T10:00:00+05:30';
    await r.plants.water(p.id);
    await r.plants.water(p.id);
    clock = '2026-11-22T10:00:00+05:30';
    await r.plants.bloom(p.id);
    clock = '2026-11-23T10:00:00+05:30';
    await r.plants.water(p.id);
    expect(await r.activity.week('2026-11-16', '2026-11-22')).toEqual({ blooms: 1, waters: 2 });
    const m = await r.activity.month(2026, 10);
    expect(m['2026-11-16']).toEqual({ planted: 0, watered: 2, bloomed: 0 });
    expect(m['2026-11-19']).toEqual({ planted: 1, watered: 0, bloomed: 0 });
    expect(Object.keys(m).sort()).toEqual(['2026-11-15', '2026-11-16', '2026-11-19', '2026-11-22', '2026-11-23']);
    const d = await r.activity.detail('2026-11-16');
    expect(d.watered).toHaveLength(1);
    expect(d.watered[0].waterCount).toBe(4);
    expect(d.planted).toHaveLength(0);
  });

  it('settings get/set', async () => {
    const r = await setup();
    expect(await r.settings.get('k')).toBeNull();
    await r.settings.set('k', 'v');
    await r.settings.set('k', 'w');
    expect(await r.settings.get('k')).toBe('w');
  });
});
