import type { Persona, Priority } from '@/domain/types';

type NoProps = Record<string, never>;

/** Event property types hold only numbers, booleans and fixed enums: never free text. */
export type EventMap = {
  onboarding_step_viewed: { step: 'welcome' | 'persona' | 'beds' | 'first_plant' | 'reminder' };
  onboarding_completed: { persona: Persona; beds_count: number };
  app_opened: NoProps;
  plant_created: {
    has_priority: boolean;
    priority: Priority;
    bed_is_ideas: boolean;
    source: 'fab' | 'bed_plus' | 'onboarding';
  };
  plant_watered: { water_count: number };
  plant_bloomed: { water_count: number; age_days: number };
  bloom_undone: NoProps;
  plant_deleted: NoProps;
  bed_created: NoProps;
  bed_deleted: NoProps;
  garden_viewed: NoProps;
  day_opened: NoProps;
  reminder_enabled: { time: `${number}:${number}` };
  reminder_disabled: NoProps;
  reminder_permission_denied: NoProps;
  reminder_opened: NoProps;
};
