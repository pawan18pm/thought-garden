import type { BedColorKey } from '@/ui/tokens';

export type Priority = 1 | 2 | 3 | null;
export type Stage = 'seed' | 'watered' | 'growing' | 'bloom';
export type Persona = 'student' | 'jobPrep' | 'professional' | 'builder';

export interface Bed {
  id: string;
  name: string;
  color: BedColorKey | 'ideas';
  position: number;
  isIdeas: boolean;
  folded: boolean;
  createdAt: string;
}

export interface Plant {
  id: string;
  bedId: string;
  text: string;
  priority: Priority;
  createdAt: string;
  bloomedAt: string | null;
  waterCount: number;
}
