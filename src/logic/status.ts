import { getSpecies } from '../data/animals';
import { NEEDS } from '../data/items';
import type { Task } from '../store';
import { lowestNeed, moodOf, Needs } from './needs';

/** Ein Satz, was das Tier gerade fühlt – immer freundlich, nie vorwurfsvoll. */
export function statusText(p: {
  petName: string;
  nickname: string;
  speciesId: Parameters<typeof getSpecies>[0];
  needs: Needs;
  tasks: Task[];
  now: number;
}): string {
  const { petName, nickname, needs, tasks, now } = p;
  const overdue = tasks.filter((t) => t.dueAt <= now);
  const mood = moodOf(needs);
  const low = lowestNeed(needs);

  if (mood === 'happy') {
    if (tasks.length === 0) return `${petName} ist rundum zufrieden. Du rockst das, ${nickname}! 😊`;
    if (overdue.length === 0) return `${petName} ist glücklich und freut sich schon auf die nächste Belohnung.`;
    return `${petName} geht's gut – „${overdue[0].title}“ wäre jetzt ein toller Schritt!`;
  }
  const info = NEEDS.find((n) => n.id === low)!;
  const base = info.low.replace('{name}', petName);
  if (overdue.length > 0) {
    return `${base} Erledige „${overdue[0].title}“, dann bekommst du etwas zum Verwöhnen.`;
  }
  return `${base} Nutze ein Pflege-Item unten – oder schaff eine Aufgabe für Nachschub.`;
}
