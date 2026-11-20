import type { Bed, Plant, Priority } from '@/domain/types';
import type { DayActivity } from '@/domain/dayState';
import { nextBedColor } from '@/domain/bedColors';
import type { BedColorKey } from '@/ui/tokens';
import type { Db } from './Db';

interface BedRow {
  id: string;
  name: string;
  color: string;
  position: number;
  is_ideas: number;
  folded: number;
  created_at: string;
}

interface PlantRow {
  id: string;
  bed_id: string;
  text: string;
  priority: number | null;
  created_at: string;
  bloomed_at: string | null;
  water_count: number;
}

const toBed = (r: BedRow): Bed => ({
  id: r.id,
  name: r.name,
  color: r.color as Bed['color'],
  position: r.position,
  isIdeas: r.is_ideas === 1,
  folded: r.folded === 1,
  createdAt: r.created_at,
});

const toPlant = (r: PlantRow): Plant => ({
  id: r.id,
  bedId: r.bed_id,
  text: r.text,
  priority: r.priority as Priority,
  createdAt: r.created_at,
  bloomedAt: r.bloomed_at,
  waterCount: r.water_count,
});

const PLANT_SELECT = `
  SELECT p.id, p.bed_id, p.text, p.priority, p.created_at, p.bloomed_at,
    (SELECT COUNT(*) FROM waterings w WHERE w.plant_id = p.id) AS water_count
  FROM plants p`;

export function createRepos(db: Db, newId: () => string, now: () => string) {
  const plantsWhere = async (where: string, params: unknown[] = []): Promise<Plant[]> =>
    (await db.all<PlantRow>(`${PLANT_SELECT} WHERE p.deleted_at IS NULL AND ${where} ORDER BY p.created_at DESC`, params)).map(toPlant);

  const countOf = async (sql: string, params: unknown[]): Promise<number> =>
    (await db.first<{ c: number }>(sql, params))?.c ?? 0;

  const beds = {
    async list(): Promise<Bed[]> {
      const rows = await db.all<BedRow>('SELECT * FROM beds ORDER BY is_ideas ASC, position ASC');
      return rows.map(toBed);
    },
    async create(name: string): Promise<Bed> {
      const user = await db.all<BedRow>('SELECT * FROM beds WHERE is_ideas = 0');
      const position = user.length ? Math.max(...user.map((b) => b.position)) + 1 : 0;
      const color = nextBedColor(user.map((b) => b.color as BedColorKey));
      const bed: Bed = { id: newId(), name, color, position, isIdeas: false, folded: false, createdAt: now() };
      await db.run(
        'INSERT INTO beds (id, name, color, position, is_ideas, folded, created_at) VALUES (?, ?, ?, ?, 0, 0, ?)',
        [bed.id, name, color, position, bed.createdAt],
      );
      return bed;
    },
    async ensureIdeas(): Promise<Bed> {
      const row = await db.first<BedRow>('SELECT * FROM beds WHERE is_ideas = 1');
      if (row) return toBed(row);
      const bed: Bed = { id: newId(), name: 'Ideas', color: 'ideas', position: 0, isIdeas: true, folded: false, createdAt: now() };
      await db.run(
        "INSERT INTO beds (id, name, color, position, is_ideas, folded, created_at) VALUES (?, 'Ideas', 'ideas', 0, 1, 0, ?)",
        [bed.id, bed.createdAt],
      );
      return bed;
    },
    async rename(id: string, name: string): Promise<void> {
      await db.run('UPDATE beds SET name = ? WHERE id = ? AND is_ideas = 0', [name, id]);
    },
    async setColor(id: string, color: BedColorKey): Promise<void> {
      await db.run('UPDATE beds SET color = ? WHERE id = ? AND is_ideas = 0', [color, id]);
    },
    async setFolded(id: string, folded: boolean): Promise<void> {
      await db.run('UPDATE beds SET folded = ? WHERE id = ?', [folded ? 1 : 0, id]);
    },
    async reorder(ids: string[]): Promise<void> {
      for (let i = 0; i < ids.length; i++) {
        await db.run('UPDATE beds SET position = ? WHERE id = ? AND is_ideas = 0', [i, ids[i]]);
      }
    },
    async remove(id: string): Promise<void> {
      const row = await db.first<BedRow>('SELECT * FROM beds WHERE id = ?', [id]);
      if (!row) return;
      if (row.is_ideas === 1) throw new Error('The Ideas bed cannot be deleted');
      const ideas = await beds.ensureIdeas();
      await db.exec('BEGIN');
      try {
        await db.run('UPDATE plants SET bed_id = ? WHERE bed_id = ?', [ideas.id, id]);
        await db.run('DELETE FROM beds WHERE id = ?', [id]);
        await db.exec('COMMIT');
      } catch (e) {
        await db.exec('ROLLBACK');
        throw e;
      }
    },
  };

  const plants = {
    listActive: (): Promise<Plant[]> => plantsWhere('p.bloomed_at IS NULL'),
    async create(input: { text: string; bedId: string; priority: Priority }): Promise<Plant> {
      const plant: Plant = {
        id: newId(),
        bedId: input.bedId,
        text: input.text,
        priority: input.priority,
        createdAt: now(),
        bloomedAt: null,
        waterCount: 0,
      };
      await db.run(
        'INSERT INTO plants (id, bed_id, text, priority, created_at) VALUES (?, ?, ?, ?, ?)',
        [plant.id, plant.bedId, plant.text, plant.priority, plant.createdAt],
      );
      return plant;
    },
    async water(id: string): Promise<void> {
      await db.run('INSERT INTO waterings (id, plant_id, watered_at) VALUES (?, ?, ?)', [newId(), id, now()]);
    },
    async bloom(id: string): Promise<void> {
      await db.run('UPDATE plants SET bloomed_at = ? WHERE id = ?', [now(), id]);
    },
    async unbloom(id: string): Promise<void> {
      await db.run('UPDATE plants SET bloomed_at = NULL WHERE id = ?', [id]);
    },
    async edit(id: string, patch: Partial<Pick<Plant, 'text' | 'priority' | 'bedId'>>): Promise<void> {
      const sets: string[] = [];
      const params: unknown[] = [];
      if (patch.text !== undefined) { sets.push('text = ?'); params.push(patch.text); }
      if (patch.priority !== undefined) { sets.push('priority = ?'); params.push(patch.priority); }
      if (patch.bedId !== undefined) { sets.push('bed_id = ?'); params.push(patch.bedId); }
      if (!sets.length) return;
      await db.run(`UPDATE plants SET ${sets.join(', ')} WHERE id = ?`, [...params, id]);
    },
    async remove(id: string): Promise<void> {
      await db.run('UPDATE plants SET deleted_at = ? WHERE id = ?', [now(), id]);
    },
    bloomedOn: (key: string): Promise<Plant[]> =>
      plantsWhere('substr(p.bloomed_at, 1, 10) = ?', [key]),
  };

  const activity = {
    async day(key: string): Promise<DayActivity> {
      return {
        planted: await countOf('SELECT COUNT(*) AS c FROM plants WHERE deleted_at IS NULL AND substr(created_at, 1, 10) = ?', [key]),
        watered: await countOf(
          'SELECT COUNT(*) AS c FROM waterings w JOIN plants p ON p.id = w.plant_id WHERE p.deleted_at IS NULL AND substr(w.watered_at, 1, 10) = ?',
          [key],
        ),
        bloomed: await countOf('SELECT COUNT(*) AS c FROM plants WHERE deleted_at IS NULL AND substr(bloomed_at, 1, 10) = ?', [key]),
      };
    },
    async month(year: number, month0: number): Promise<Record<string, DayActivity>> {
      const prefix = `${year}-${String(month0 + 1).padStart(2, '0')}-`;
      const like = `${prefix}%`;
      const out: Record<string, DayActivity> = {};
      const bump = (rows: { d: string; c: number }[], field: keyof DayActivity) => {
        for (const r of rows) {
          out[r.d] ??= { planted: 0, watered: 0, bloomed: 0 };
          out[r.d][field] = r.c;
        }
      };
      bump(
        await db.all('SELECT substr(created_at, 1, 10) AS d, COUNT(*) AS c FROM plants WHERE deleted_at IS NULL AND created_at LIKE ? GROUP BY d', [like]),
        'planted',
      );
      bump(
        await db.all(
          'SELECT substr(w.watered_at, 1, 10) AS d, COUNT(*) AS c FROM waterings w JOIN plants p ON p.id = w.plant_id WHERE p.deleted_at IS NULL AND w.watered_at LIKE ? GROUP BY d',
          [like],
        ),
        'watered',
      );
      bump(
        await db.all('SELECT substr(bloomed_at, 1, 10) AS d, COUNT(*) AS c FROM plants WHERE deleted_at IS NULL AND bloomed_at LIKE ? GROUP BY d', [like]),
        'bloomed',
      );
      return out;
    },
    async week(startKey: string, endKey: string): Promise<{ blooms: number; waters: number }> {
      return {
        blooms: await countOf(
          'SELECT COUNT(*) AS c FROM plants WHERE deleted_at IS NULL AND bloomed_at IS NOT NULL AND substr(bloomed_at, 1, 10) BETWEEN ? AND ?',
          [startKey, endKey],
        ),
        waters: await countOf(
          'SELECT COUNT(*) AS c FROM waterings w JOIN plants p ON p.id = w.plant_id WHERE p.deleted_at IS NULL AND substr(w.watered_at, 1, 10) BETWEEN ? AND ?',
          [startKey, endKey],
        ),
      };
    },
    async detail(key: string): Promise<{ bloomed: Plant[]; watered: Plant[]; planted: Plant[] }> {
      return {
        bloomed: await plantsWhere('substr(p.bloomed_at, 1, 10) = ?', [key]),
        watered: await plantsWhere(
          'p.id IN (SELECT plant_id FROM waterings WHERE substr(watered_at, 1, 10) = ?)',
          [key],
        ),
        planted: await plantsWhere('substr(p.created_at, 1, 10) = ?', [key]),
      };
    },
  };

  const settings = {
    async get(key: string): Promise<string | null> {
      return (await db.first<{ value: string }>('SELECT value FROM settings WHERE key = ?', [key]))?.value ?? null;
    },
    async set(key: string, value: string): Promise<void> {
      await db.run(
        'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
        [key, value],
      );
    },
  };

  /** Dev-only: wipes every table. */
  async function resetAll(): Promise<void> {
    for (const t of ['waterings', 'plants', 'beds', 'settings']) await db.run(`DELETE FROM ${t}`);
  }

  return { beds, plants, activity, settings, resetAll };
}
