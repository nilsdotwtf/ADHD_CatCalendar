import { ClothingType, ConsumableId, ToyType } from './items';

export interface GoalStats {
  tasksDone: number;
  drinks: number;
  minigames: number;
  puzzles: number;
  tasksCreated: number;
  recurringCreated: number;
  imported: number;
  bestStreak: number;
  perfectCare: number; // wie oft alle Bedürfnisse gleichzeitig >= 90 waren
}

export interface GoalReward {
  xp: number;
  items?: Partial<Record<ConsumableId, number>>;
  clothing?: { type: ClothingType; color: string };
  toy?: { type: ToyType; color: string };
  puzzles?: number;
}

export interface Goal {
  id: string;
  title: string;
  emoji: string;
  stat: keyof GoalStats;
  target: number;
  reward: GoalReward;
}

export const GOALS: Goal[] = [
  { id: 'first-task', title: 'Erste Aufgabe erledigt', emoji: '🌱', stat: 'tasksDone', target: 1, reward: { xp: 20, items: { food: 2 } } },
  { id: 'plan-3', title: '3 Aufgaben angelegt', emoji: '📝', stat: 'tasksCreated', target: 3, reward: { xp: 15, items: { cuddle: 1 } } },
  { id: 'drink-5', title: '5x getrunken', emoji: '💧', stat: 'drinks', target: 5, reward: { xp: 25, items: { pillow: 1, food: 1 } } },
  { id: 'tasks-5', title: '5 Aufgaben erledigt', emoji: '🔥', stat: 'tasksDone', target: 5, reward: { xp: 40, items: { brush: 2, food: 1 } } },
  { id: 'recurring-1', title: 'Eine Routine erstellt', emoji: '🔁', stat: 'recurringCreated', target: 1, reward: { xp: 20, items: { cuddle: 1 } } },
  { id: 'care-5', title: '5 Pflege-Minispiele', emoji: '🎮', stat: 'minigames', target: 5, reward: { xp: 30, items: { food: 1, brush: 1, pillow: 1, cuddle: 1 } } },
  { id: 'streak-3', title: '3 Tage in Folge aktiv', emoji: '📅', stat: 'bestStreak', target: 3, reward: { xp: 50, puzzles: 1 } },
  { id: 'import-1', title: 'Aufgaben aus Notizen importiert', emoji: '📋', stat: 'imported', target: 1, reward: { xp: 15, items: { food: 1 } } },
  { id: 'perfect-1', title: 'Rundum glücklich (alles ≥ 90%)', emoji: '🌈', stat: 'perfectCare', target: 1, reward: { xp: 40, toy: { type: 'yarn', color: '#E5B53A' } } },
  { id: 'tasks-15', title: '15 Aufgaben erledigt', emoji: '🏅', stat: 'tasksDone', target: 15, reward: { xp: 80, clothing: { type: 'crown', color: '#E5B53A' } } },
  { id: 'drink-25', title: '25x getrunken', emoji: '🌊', stat: 'drinks', target: 25, reward: { xp: 60, clothing: { type: 'bowtie', color: '#3B82F6' } } },
  { id: 'puzzle-3', title: '3 Bonus-Puzzles gelöst', emoji: '🧩', stat: 'puzzles', target: 3, reward: { xp: 60, items: { food: 2, cuddle: 2 } } },
  { id: 'streak-7', title: '7 Tage in Folge aktiv', emoji: '🏆', stat: 'bestStreak', target: 7, reward: { xp: 120, toy: { type: 'ball', color: '#E5B53A' }, puzzles: 1 } },
  { id: 'tasks-50', title: '50 Aufgaben erledigt', emoji: '💎', stat: 'tasksDone', target: 50, reward: { xp: 200, clothing: { type: 'tophat', color: '#E5B53A' } } },
  { id: 'care-30', title: '30 Pflege-Minispiele', emoji: '🥇', stat: 'minigames', target: 30, reward: { xp: 120, toy: { type: 'teddy', color: '#F472B6' } } },
];

export function xpForLevel(level: number): number {
  return 60 + (level - 1) * 30;
}

export function levelFromXp(xp: number): { level: number; into: number; needed: number } {
  let level = 1;
  let rest = xp;
  while (rest >= xpForLevel(level)) {
    rest -= xpForLevel(level);
    level++;
  }
  return { level, into: rest, needed: xpForLevel(level) };
}
