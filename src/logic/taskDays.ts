import type { Task, TaskView } from '../store';
import { dayKey, endOfDay, NO_DUE } from './time';

/** Startzeit des Tages `offset` Tage ab heute */
export function dayStart(now: number, offset: number): number {
  const d = new Date(now);
  d.setDate(d.getDate() + offset);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * Aufgaben für eine Tagesansicht.
 * Heute: alles Überfällige, alles von heute und Aufgaben ohne Datum.
 * Andere Tage: nur was an dem Tag fällig ist – erledigte Wiederholungen
 * rutschen dadurch aus "Heute" raus, bis sie wieder dran sind.
 */
export function tasksForView(tasks: Task[], view: TaskView, now: number): Task[] {
  const sorted = [...tasks].sort((a, b) => a.dueAt - b.dueAt);
  if (view === 'all') return sorted;
  if (view === 0) return sorted.filter((t) => t.dueAt <= endOfDay(now) || t.dueAt >= NO_DUE);
  const key = dayKey(dayStart(now, view));
  return sorted.filter((t) => t.dueAt < NO_DUE && dayKey(t.dueAt) === key);
}
