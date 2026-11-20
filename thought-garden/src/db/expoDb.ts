import * as SQLite from 'expo-sqlite';
import type { Db } from './Db';

export async function openExpoDb(): Promise<Db> {
  const d = await SQLite.openDatabaseAsync('garden.db');
  await d.execAsync('PRAGMA journal_mode = WAL;');
  return {
    exec: (sql) => d.execAsync(sql),
    async run(sql, params) {
      await d.runAsync(sql, (params ?? []) as SQLite.SQLiteBindParams);
    },
    all: <T>(sql: string, params?: unknown[]) =>
      d.getAllAsync<T>(sql, (params ?? []) as SQLite.SQLiteBindParams),
    async first<T>(sql: string, params?: unknown[]) {
      const row = await d.getFirstAsync<T>(sql, (params ?? []) as SQLite.SQLiteBindParams);
      return row ?? null;
    },
  };
}
