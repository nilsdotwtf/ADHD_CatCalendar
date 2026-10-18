import { NeedId, NEEDS } from '../data/items';
import { HOUR } from './time';

export type Needs = Record<NeedId, number>;

export interface TaskLike {
  dueAt: number;
  need: NeedId;
}

// Wie stark offene, überfällige Aufgaben das Tier pro Stunde belasten
const MAIN_DECAY_PER_HOUR = 5;
const SIDE_DECAY_PER_HOUR = 1.5;
const BORED_DECAY_PER_HOUR = 2;
export const BORED_AFTER_MS = 24 * HOUR;

export function clamp(v: number): number {
  return Math.max(0, Math.min(100, v));
}

/**
 * Keine Aufgaben → das Tier bleibt zufrieden.
 * Überfällige Aufgaben → Bedürfnisse sinken, je länger desto mehr.
 * Länger als 24h gar keine Aufgabe → dem Tier wird langweilig.
 */
export function decayNeeds(
  needs: Needs,
  tasks: TaskLike[],
  from: number,
  to: number,
  lastTaskActivity: number,
): Needs {
  if (to <= from) return needs;
  const next = { ...needs };
  for (const t of tasks) {
    const start = Math.max(from, t.dueAt);
    if (start >= to) continue;
    const hours = (to - start) / HOUR;
    for (const n of NEEDS) {
      next[n.id] -= hours * (n.id === t.need ? MAIN_DECAY_PER_HOUR : SIDE_DECAY_PER_HOUR);
    }
  }
  if (tasks.length === 0) {
    const boredStart = Math.max(from, lastTaskActivity + BORED_AFTER_MS);
    if (boredStart < to) {
      const hours = (to - boredStart) / HOUR;
      next.fun -= hours * BORED_DECAY_PER_HOUR;
      next.energy -= hours * 0.5;
    }
  }
  for (const n of NEEDS) next[n.id] = clamp(next[n.id]);
  return next;
}

export type Mood = 'happy' | 'okay' | 'sad' | 'miserable';

export function moodOf(needs: Needs): Mood {
  const min = Math.min(...Object.values(needs));
  if (min >= 65) return 'happy';
  if (min >= 40) return 'okay';
  if (min >= 15) return 'sad';
  return 'miserable';
}

export function lowestNeed(needs: Needs): NeedId {
  let best: NeedId = 'hunger';
  for (const n of NEEDS) if (needs[n.id] < needs[best]) best = n.id;
  return best;
}
