import { createStore } from 'zustand/vanilla';
import { differenceInCalendarDays } from 'date-fns';
import type { createRepos } from '@/db/repos';
import type { Bed, Plant, Priority } from '@/domain/types';
import type { BedColorKey } from '@/ui/tokens';
import { sortPlants } from '@/domain/ordering';
import { cleanBedName, validateThought } from '@/domain/validate';
import { BLOOM_AT_WATERS, canBloomNow } from '@/domain/stages';
import { dayKey } from '@/domain/dates';
import { setAnalyticsEnabled, track } from '@/analytics/analytics';

export type Repos = ReturnType<typeof createRepos>;
export type PlantSource = 'fab' | 'bed_plus' | 'onboarding';

export interface GardenState {
  beds: Bed[];
  plants: Plant[];
  bloomedToday: Plant[];
  lastBedId: string | null;
  ready: boolean;
  load(): Promise<void>;
  plant(text: string, bedId?: string, priority?: Priority, source?: PlantSource): Promise<Plant | null>;
  water(id: string): Promise<void>;
  bloom(id: string): Promise<void>;
  unbloom(id: string): Promise<void>;
  edit(id: string, patch: Partial<Pick<Plant, 'text' | 'priority' | 'bedId'>>): Promise<void>;
  remove(id: string): Promise<void>;
  addBed(name: string, color?: BedColorKey): Promise<Bed>;
  renameBed(id: string, name: string): Promise<void>;
  recolorBed(id: string, color: BedColorKey): Promise<void>;
  toggleFold(id: string): Promise<void>;
  reorderBeds(ids: string[]): Promise<void>;
  removeBed(id: string, opts?: { moveTo?: string; deleteThoughts?: boolean }): Promise<void>;
  setAnalytics(on: boolean): Promise<void>;
  plantsInBed(bedId: string): Plant[];
}

export function createGardenStore(repos: Repos) {
  return createStore<GardenState>()((set, get) => {
    const refresh = async () => {
      const [beds, plants, bloomedToday] = await Promise.all([
        repos.beds.list(),
        repos.plants.listActive(),
        repos.plants.bloomedOn(dayKey(new Date())),
      ]);
      set({ beds, plants, bloomedToday, ready: true });
    };

    const refreshBeds = async () => {
      set({ beds: await repos.beds.list() });
    };

    const watering = new Set<string>();

    return {
      beds: [],
      plants: [],
      bloomedToday: [],
      lastBedId: null,
      ready: false,
      load: refresh,

      async plant(text, bedId, priority = null, source = 'fab') {
        const clean = validateThought(text);
        if (clean === null) return null;
        const ideas = get().beds.find((b) => b.isIdeas) ?? (await repos.beds.ensureIdeas());
        const target = bedId ?? get().lastBedId ?? ideas.id;
        const created = await repos.plants.create({ text: clean, bedId: target, priority });
        if (bedId) set({ lastBedId: bedId });
        await refresh();
        track('plant_created', {
          has_priority: priority !== null,
          priority,
          bed_is_ideas: target === ideas.id,
          source,
        });
        return created;
      },

      async water(id) {
        if (watering.has(id)) return;
        const p = get().plants.find((x) => x.id === id);
        if (!p || p.bloomedAt) return;
        watering.add(id);
        try {
          await repos.plants.water(id);
          const count = p.waterCount + 1;
          const auto = count >= BLOOM_AT_WATERS;
          if (auto) await repos.plants.bloom(id);
          await refresh();
          track('plant_watered', { water_count: count });
          if (auto) {
            track('plant_bloomed', {
              water_count: count,
              age_days: Math.max(0, differenceInCalendarDays(new Date(), new Date(p.createdAt))),
              auto: true,
            });
          }
        } finally {
          watering.delete(id);
        }
      },

      async bloom(id) {
        // Same rule as the UI: only an active plant watered at least once can bloom early.
        if (watering.has(id)) return;
        const p = get().plants.find((x) => x.id === id);
        if (!p || !canBloomNow(p)) return;
        watering.add(id);
        try {
          await repos.plants.bloom(id);
          await refresh();
          track('plant_bloomed', {
            water_count: p.waterCount,
            age_days: Math.max(0, differenceInCalendarDays(new Date(), new Date(p.createdAt))),
          });
        } finally {
          watering.delete(id);
        }
      },

      async unbloom(id) {
        if (!get().bloomedToday.some((x) => x.id === id)) return;
        await repos.plants.unbloom(id);
        await refresh();
        track('bloom_undone', {});
      },

      async edit(id, patch) {
        await repos.plants.edit(id, patch);
        await refresh();
      },

      async remove(id) {
        await repos.plants.remove(id);
        await refresh();
        track('plant_deleted', {});
      },

      // Bed-only writes reload just the beds: plants and today's blooms can't change,
      // and the plants query (with its per-row watering count) is the costly part of a full refresh.
      async addBed(name, color) {
        const bed = await repos.beds.create(cleanBedName(name) ?? 'New bed', color);
        await refreshBeds();
        track('bed_created', {});
        return bed;
      },

      async renameBed(id, name) {
        const clean = cleanBedName(name);
        if (!clean) return;
        await repos.beds.rename(id, clean);
        await refreshBeds();
      },

      async recolorBed(id, color) {
        await repos.beds.setColor(id, color);
        await refreshBeds();
      },

      async toggleFold(id) {
        const b = get().beds.find((x) => x.id === id);
        if (!b) return;
        await repos.beds.setFolded(id, !b.folded);
        await refresh();
      },

      async reorderBeds(ids) {
        await repos.beds.reorder(ids);
        await refresh();
      },

      async removeBed(id, opts) {
        const bed = get().beds.find((b) => b.id === id);
        if (!bed || bed.isIdeas) return;
        if (get().beds.filter((b) => !b.isIdeas).length <= 1) return;
        const inBed = get().plants.filter((p) => p.bedId === id);
        if (opts?.moveTo) {
          for (const p of inBed) await repos.plants.edit(p.id, { bedId: opts.moveTo });
        } else if (opts?.deleteThoughts) {
          // "Delete bed and its thoughts": bloomed thoughts in the bed go too, not just growing ones.
          await repos.plants.removeInBed(id);
        }
        await repos.beds.remove(id);
        if (get().lastBedId === id) set({ lastBedId: null });
        await refresh();
        track('bed_deleted', {});
      },

      async setAnalytics(on) {
        setAnalyticsEnabled(on);
        await repos.settings.set('analytics_enabled', on ? '1' : '0');
      },

      plantsInBed: (bedId) => sortPlants(get().plants.filter((p) => p.bedId === bedId)),
    };
  });
}

export type GardenStore = ReturnType<typeof createGardenStore>;
