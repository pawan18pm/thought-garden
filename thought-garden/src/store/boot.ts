import * as Crypto from 'expo-crypto';
import { openExpoDb } from '@/db/expoDb';
import { migrate } from '@/db/schema';
import { createRepos } from '@/db/repos';
import { nowIso } from '@/domain/dates';
import type { Db } from '@/db/Db';
import { initAnalytics, setAnalyticsEnabled, track } from '@/analytics/analytics';
import { initReminders } from '@/notifications/reminders';
import { createGardenStore, type GardenStore, type Repos } from './garden';

export interface Boot {
  store: GardenStore;
  repos: Repos;
  onboardingDone: boolean;
}

export interface BootDeps {
  openDb: () => Promise<Db>;
  newId: () => string;
}

export async function runBoot(deps: BootDeps): Promise<Boot> {
  const db = await deps.openDb();
  await migrate(db);
  const repos = createRepos(db, deps.newId, nowIso);
  await repos.beds.ensureIdeas();
  const store = createGardenStore(repos);
  await store.getState().load();
  initReminders(repos.settings);
  initAnalytics();
  if ((await repos.settings.get('analytics_enabled')) === '0') setAnalyticsEnabled(false);
  track('app_opened', {});
  const onboardingDone = (await repos.settings.get('onboarding_done')) === '1';
  return { store, repos, onboardingDone };
}

let bootPromise: Promise<Boot> | null = null;

/** Boots once per JS runtime; repeat calls (StrictMode, Fast Refresh) share the result. */
export function bootOnce(deps?: BootDeps): Promise<Boot> {
  if (!bootPromise) {
    bootPromise = runBoot(deps ?? { openDb: openExpoDb, newId: () => Crypto.randomUUID() });
    bootPromise.catch(() => {
      bootPromise = null;
    });
  }
  return bootPromise;
}

export function __resetBootForTests(): void {
  bootPromise = null;
}
