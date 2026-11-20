import type { Db } from './Db';

export async function migrate(db: Db): Promise<void> {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS beds (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      position INTEGER NOT NULL,
      is_ideas INTEGER NOT NULL DEFAULT 0,
      folded INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS plants (
      id TEXT PRIMARY KEY NOT NULL,
      bed_id TEXT NOT NULL REFERENCES beds(id),
      text TEXT NOT NULL,
      priority INTEGER,
      created_at TEXT NOT NULL,
      bloomed_at TEXT,
      deleted_at TEXT
    );
    CREATE TABLE IF NOT EXISTS waterings (
      id TEXT PRIMARY KEY NOT NULL,
      plant_id TEXT NOT NULL REFERENCES plants(id),
      watered_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_plants_bed_id ON plants(bed_id);
    CREATE INDEX IF NOT EXISTS idx_waterings_plant_id ON waterings(plant_id);
  `);
}
