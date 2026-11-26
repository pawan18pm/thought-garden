import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';
import type { Db } from './Db';

/**
 * Web keeps the database in OPFS, which allows one open handle per file. A reload or route change
 * can start the new page before the old page's worker has let go, so retry briefly.
 */
async function openWithRetry(): Promise<SQLite.SQLiteDatabase> {
  const attempts = Platform.OS === 'web' ? 8 : 1;
  for (let i = 1; ; i++) {
    try {
      return await SQLite.openDatabaseAsync('garden.db');
    } catch (e) {
      if (i >= attempts) throw e;
      await new Promise((r) => setTimeout(r, 250 * i));
    }
  }
}

export async function openExpoDb(): Promise<Db> {
  const d = await openWithRetry();
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
