import { DatabaseSync } from 'node:sqlite';
import type { Db } from '../Db';

export function createNodeDb(): Db {
  const d = new DatabaseSync(':memory:');
  const p = (params?: unknown[]) => (params ?? []) as never[];
  return {
    async exec(sql) {
      d.exec(sql);
    },
    async run(sql, params) {
      d.prepare(sql).run(...p(params));
    },
    async all<T>(sql: string, params?: unknown[]) {
      return d.prepare(sql).all(...p(params)) as T[];
    },
    async first<T>(sql: string, params?: unknown[]) {
      return (d.prepare(sql).get(...p(params)) as T | undefined) ?? null;
    },
  };
}
