import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { DEFAULT_COLOR_INDEX, getSpecies, SpeciesId } from './data/animals';
import { GOALS, GoalStats, levelFromXp } from './data/goals';
import {
  ClothingSlot,
  ClothingType,
  clothingInfo,
  ConsumableId,
  consumableInfo,
  NEED_BY_ID,
  NeedId,
  OwnedClothing,
  OwnedToy,
  TOY_COOLDOWN_MS,
  ToyType,
} from './data/items';
import { clamp, decayNeeds, lowestNeed, Needs } from './logic/needs';
import { advanceDue, dayKey, daysBetween, DueMode, Repeat } from './logic/time';

export interface Task {
  id: string;
  title: string;
  emoji: string;
  need: NeedId;
  repeat: Repeat;
  reminderMinutes: number | null;
  dueAt: number;
  dueMode?: DueMode; // fehlt bei alten Aufgaben = 'time'
  createdAt: number;
  doneCount: number;
}

export type TaskInput = Omit<Task, 'id' | 'createdAt' | 'doneCount'>;

export interface DrinkTime {
  label: string;
  hour: number;
  minute: number;
}

export interface CompletionResult {
  item: ConsumableId;
  xp: number;
  bonusProgress: number; // 0..3 nach dieser Aufgabe
  bonusUnlocked: boolean;
  levelUp: number | null;
  streak: number;
  doneToday: number; // wie viele Aufgaben heute schon geschafft sind
}

export interface LevelUpReward {
  level: number;
  items: Partial<Record<ConsumableId, number>>;
  puzzle: boolean;
}

interface State {
  hydrated: boolean;
  onboarded: boolean;
  speciesId: SpeciesId;
  colors: string[];
  petName: string;
  nickname: string;

  needs: Needs;
  lastTick: number;
  lastTaskActivity: number;
  wasPerfect: boolean;

  tasks: Task[];
  inventory: Record<ConsumableId, number>;
  toys: OwnedToy[];
  clothes: OwnedClothing[];
  equipped: Partial<Record<ClothingSlot, string>>;

  xp: number;
  bonusProgress: number;
  puzzlesAvailable: number;
  stats: GoalStats;
  streak: number;
  lastActiveDay: string | null;
  drinksToday: { day: string; count: number };
  doneToday: { day: string; items: { title: string; emoji: string }[] };
  drinkTimes: DrinkTime[];
  goalsClaimed: string[];
  notificationsEnabled: boolean;
  pendingLevelUps: LevelUpReward[];
}

interface Actions {
  finishOnboarding(p: { speciesId: SpeciesId; colors: string[]; petName: string; nickname: string }): void;
  tick(now?: number): void;
  addTask(t: TaskInput): void;
  addTasks(ts: TaskInput[], imported?: boolean): void;
  updateTask(id: string, patch: Partial<TaskInput>): void;
  deleteTask(id: string): void;
  completeTask(id: string): CompletionResult | null;
  consumeItem(id: ConsumableId): void;
  playToy(toyId: string): void;
  drink(): number;
  solvePuzzle(): void;
  grantToy(type: ToyType, color: string): void;
  grantClothing(type: ClothingType, color: string): void;
  equip(slot: ClothingSlot, id: string | null): void;
  claimGoal(goalId: string): void;
  popLevelUp(): void;
  setDrinkTime(index: number, hour: number, minute: number): void;
  setNames(petName: string, nickname: string): void;
  setColors(colors: string[]): void;
  setNotificationsEnabled(v: boolean): void;
  resetAll(): void;
}

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

const emptyStats: GoalStats = {
  tasksDone: 0,
  drinks: 0,
  minigames: 0,
  puzzles: 0,
  tasksCreated: 0,
  recurringCreated: 0,
  imported: 0,
  bestStreak: 0,
  perfectCare: 0,
};

function initialState(): State {
  const now = Date.now();
  return {
    hydrated: true,
    onboarded: false,
    speciesId: 'cat',
    colors: DEFAULT_COLOR_INDEX.cat.map((i, s) => getSpecies('cat').slots[s].options[i].hex),
    petName: '',
    nickname: '',
    // Startwerte: gut gelaunt, aber mit etwas Platz zum Verwöhnen
    needs: { hunger: 65, clean: 75, energy: 85, fun: 70 },
    lastTick: now,
    lastTaskActivity: now,
    wasPerfect: false,
    tasks: [],
    // Kein Starterpaket: Bedürfnisse lassen sich erst nach der ersten erledigten Aufgabe decken
    inventory: { food: 0, brush: 0, pillow: 0, cuddle: 0 },
    toys: [],
    clothes: [],
    equipped: {},
    xp: 0,
    bonusProgress: 0,
    puzzlesAvailable: 0,
    stats: { ...emptyStats },
    streak: 0,
    lastActiveDay: null,
    drinksToday: { day: dayKey(now), count: 0 },
    doneToday: { day: dayKey(now), items: [] },
    drinkTimes: [
      { label: 'Morgens', hour: 8, minute: 30 },
      { label: 'Mittags', hour: 12, minute: 30 },
      { label: 'Abends', hour: 18, minute: 30 },
    ],
    goalsClaimed: [],
    notificationsEnabled: false,
    pendingLevelUps: [],
  };
}

function levelUpReward(level: number): LevelUpReward {
  const items: Partial<Record<ConsumableId, number>> = { food: 1, cuddle: 1 };
  if (level % 2 === 0) items.brush = 1;
  if (level % 2 === 1) items.pillow = 1;
  return { level, items, puzzle: level % 3 === 0 };
}

function addItems(
  inv: Record<ConsumableId, number>,
  items: Partial<Record<ConsumableId, number>> | undefined,
): Record<ConsumableId, number> {
  if (!items) return inv;
  const next = { ...inv };
  for (const k of Object.keys(items) as ConsumableId[]) next[k] += items[k] ?? 0;
  return next;
}

export const useStore = create<State & Actions>()(
  persist(
    (set, get) => {
      /** Fügt XP hinzu und sammelt Level-ups (mit Belohnung). */
      const withXp = (s: State, amount: number): Partial<State> => {
        const before = levelFromXp(s.xp).level;
        const xp = s.xp + amount;
        const after = levelFromXp(xp).level;
        if (after <= before) return { xp };
        const ups: LevelUpReward[] = [];
        let inventory = s.inventory;
        let puzzles = s.puzzlesAvailable;
        for (let l = before + 1; l <= after; l++) {
          const r = levelUpReward(l);
          ups.push(r);
          inventory = addItems(inventory, r.items);
          if (r.puzzle) puzzles++;
        }
        return { xp, inventory, puzzlesAvailable: puzzles, pendingLevelUps: [...s.pendingLevelUps, ...ups] };
      };

      /** Täglicher Streak: zählt Tage, an denen man etwas Gutes getan hat. */
      const withStreak = (s: State, now: number): Partial<State> => {
        const today = dayKey(now);
        if (s.lastActiveDay === today) return {};
        const gap = s.lastActiveDay ? daysBetween(s.lastActiveDay, today) : 99;
        const streak = gap === 1 ? s.streak + 1 : 1;
        return { streak, lastActiveDay: today, stats: { ...s.stats, bestStreak: Math.max(s.stats.bestStreak, streak) } };
      };

      const checkPerfect = (s: State, needs: Needs): Partial<State> => {
        const perfect = Object.values(needs).every((v) => v >= 90);
        if (perfect && !s.wasPerfect) {
          return { wasPerfect: true, stats: { ...s.stats, perfectCare: s.stats.perfectCare + 1 } };
        }
        return { wasPerfect: perfect };
      };

      return {
        ...initialState(),
        hydrated: false,

        finishOnboarding: ({ speciesId, colors, petName, nickname }) => {
          const now = Date.now();
          set({ onboarded: true, speciesId, colors, petName, nickname, lastTick: now, lastTaskActivity: now });
        },

        tick: (now = Date.now()) => {
          const s = get();
          if (!s.onboarded) return;
          const needs = decayNeeds(s.needs, s.tasks, s.lastTick, now, s.lastTaskActivity);
          const today = dayKey(now);
          set({
            needs,
            lastTick: now,
            drinksToday: s.drinksToday.day === today ? s.drinksToday : { day: today, count: 0 },
            doneToday: s.doneToday.day === today ? s.doneToday : { day: today, items: [] },
            ...(s.lastActiveDay && daysBetween(s.lastActiveDay, today) > 1 ? { streak: 0 } : {}),
          });
        },

        addTask: (t) => get().addTasks([t]),

        addTasks: (ts, imported = false) => {
          const s = get();
          const now = Date.now();
          const created: Task[] = ts.map((t) => ({ ...t, id: uid(), createdAt: now, doneCount: 0 }));
          set({
            tasks: [...s.tasks, ...created],
            lastTaskActivity: now,
            stats: {
              ...s.stats,
              tasksCreated: s.stats.tasksCreated + created.length,
              recurringCreated: s.stats.recurringCreated + created.filter((t) => t.repeat !== 'none').length,
              imported: s.stats.imported + (imported ? created.length : 0),
            },
          });
        },

        updateTask: (id, patch) => {
          const s = get();
          const recurringNow = patch.repeat && patch.repeat !== 'none';
          const wasRecurring = s.tasks.find((t) => t.id === id)?.repeat !== 'none';
          set({
            tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
            stats:
              recurringNow && !wasRecurring
                ? { ...s.stats, recurringCreated: s.stats.recurringCreated + 1 }
                : s.stats,
          });
        },

        deleteTask: (id) => {
          const s = get();
          set({ tasks: s.tasks.filter((t) => t.id !== id), lastTaskActivity: Date.now() });
        },

        completeTask: (id) => {
          get().tick();
          const s = get();
          const task = s.tasks.find((t) => t.id === id);
          if (!task) return null;
          const now = Date.now();

          // Belohnung: das Item für das Bedürfnis, das gerade am meisten fehlt
          const low = lowestNeed(s.needs);
          const need = s.needs[low] < 80 ? low : task.need;
          const item = NEED_BY_ID[need].item;

          let bonusProgress = s.bonusProgress + 1;
          let puzzlesAvailable = s.puzzlesAvailable;
          const bonusUnlocked = bonusProgress >= 3;
          if (bonusUnlocked) {
            bonusProgress = 0;
            puzzlesAvailable++;
          }

          const tasks =
            task.repeat === 'none'
              ? s.tasks.filter((t) => t.id !== id)
              : s.tasks.map((t) =>
                  t.id === id ? { ...t, dueAt: advanceDue(t.dueAt, t.repeat, now), doneCount: t.doneCount + 1 } : t,
                );

          const streakPatch = withStreak(s, now);
          const streak = streakPatch.streak ?? s.streak;
          const xpGain = 20 + Math.min(streak, 5) * 2;
          const today = dayKey(now);
          const doneItems = [...(s.doneToday.day === today ? s.doneToday.items : []), { title: task.title, emoji: task.emoji }];
          const base: State = {
            ...s,
            ...streakPatch,
            tasks,
            doneToday: { day: today, items: doneItems },
            inventory: { ...s.inventory, [item]: s.inventory[item] + 1 },
            bonusProgress,
            puzzlesAvailable,
            lastTaskActivity: now,
            stats: { ...(streakPatch.stats ?? s.stats), tasksDone: s.stats.tasksDone + 1 },
          };
          const xpPatch = withXp(base, xpGain);
          set({ ...base, ...xpPatch });
          const levelUp = levelFromXp(base.xp + xpGain).level > levelFromXp(s.xp).level ? levelFromXp(base.xp + xpGain).level : null;
          return { item, xp: xpGain, bonusProgress: bonusUnlocked ? 3 : bonusProgress, bonusUnlocked, levelUp, streak, doneToday: doneItems.length };
        },

        consumeItem: (id) => {
          const s = get();
          if (s.inventory[id] <= 0) return;
          const info = consumableInfo(id, s.speciesId);
          const needs = { ...s.needs, [info.need]: clamp(s.needs[info.need] + info.boost) };
          const base: State = {
            ...s,
            needs,
            inventory: { ...s.inventory, [id]: s.inventory[id] - 1 },
            stats: { ...s.stats, minigames: s.stats.minigames + 1 },
          };
          const perfect = checkPerfect(base, needs);
          const merged = { ...base, ...perfect, stats: perfect.stats ?? base.stats };
          set({ ...merged, ...withXp(merged, 5) });
        },

        playToy: (toyId) => {
          const s = get();
          const now = Date.now();
          const needs = { ...s.needs, fun: clamp(s.needs.fun + 25), energy: clamp(s.needs.energy - 3) };
          const base: State = {
            ...s,
            needs,
            toys: s.toys.map((t) => (t.id === toyId ? { ...t, lastPlayed: now } : t)),
            stats: { ...s.stats, minigames: s.stats.minigames + 1 },
          };
          const perfect = checkPerfect(base, needs);
          const merged = { ...base, ...perfect, stats: perfect.stats ?? base.stats };
          set({ ...merged, ...withXp(merged, 5) });
        },

        drink: () => {
          const s = get();
          const now = Date.now();
          const today = dayKey(now);
          const count = (s.drinksToday.day === today ? s.drinksToday.count : 0) + 1;
          const streakPatch = withStreak(s, now);
          const base: State = {
            ...s,
            ...streakPatch,
            needs: { ...s.needs, fun: clamp(s.needs.fun + 3) },
            drinksToday: { day: today, count },
            stats: { ...(streakPatch.stats ?? s.stats), drinks: s.stats.drinks + 1 },
          };
          set({ ...base, ...withXp(base, 5) });
          return count;
        },

        solvePuzzle: () => {
          const s = get();
          const base: State = {
            ...s,
            puzzlesAvailable: Math.max(0, s.puzzlesAvailable - 1),
            stats: { ...s.stats, puzzles: s.stats.puzzles + 1 },
          };
          set({ ...base, ...withXp(base, 15) });
        },

        grantToy: (type, color) => {
          set({ toys: [...get().toys, { id: uid(), type, color, lastPlayed: 0 }] });
        },

        grantClothing: (type, color) => {
          const s = get();
          const id = uid();
          const slot = clothingInfo(type).slot;
          // Neues Kleidungsstück direkt anziehen – sofort sichtbar = sofortige Belohnung
          set({ clothes: [...s.clothes, { id, type, color }], equipped: { ...s.equipped, [slot]: id } });
        },

        equip: (slot, id) => {
          const equipped = { ...get().equipped };
          if (id) equipped[slot] = id;
          else delete equipped[slot];
          set({ equipped });
        },

        claimGoal: (goalId) => {
          const s = get();
          const goal = GOALS.find((g) => g.id === goalId);
          if (!goal || s.goalsClaimed.includes(goalId)) return;
          if (s.stats[goal.stat] < goal.target) return;
          const r = goal.reward;
          const base: State = {
            ...s,
            goalsClaimed: [...s.goalsClaimed, goalId],
            inventory: addItems(s.inventory, r.items),
            puzzlesAvailable: s.puzzlesAvailable + (r.puzzles ?? 0),
            toys: r.toy ? [...s.toys, { id: uid(), type: r.toy.type, color: r.toy.color, lastPlayed: 0 }] : s.toys,
            clothes: r.clothing ? [...s.clothes, { id: uid(), type: r.clothing.type, color: r.clothing.color }] : s.clothes,
          };
          set({ ...base, ...withXp(base, r.xp) });
        },

        popLevelUp: () => set({ pendingLevelUps: get().pendingLevelUps.slice(1) }),

        setDrinkTime: (index, hour, minute) => {
          set({ drinkTimes: get().drinkTimes.map((d, i) => (i === index ? { ...d, hour, minute } : d)) });
        },

        setNames: (petName, nickname) => set({ petName, nickname }),
        setColors: (colors) => set({ colors }),
        setNotificationsEnabled: (v) => set({ notificationsEnabled: v }),

        resetAll: () => set({ ...initialState() }),
      };
    },
    {
      name: 'tierchen-state-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ hydrated: _h, ...rest }) => rest,
      onRehydrateStorage: () => () => {
        useStore.setState({ hydrated: true });
      },
    },
  ),
);

export function toyReady(toy: OwnedToy, now: number): boolean {
  return now - toy.lastPlayed >= TOY_COOLDOWN_MS;
}

// ---------- Flüchtiger UI-Zustand (nicht gespeichert) ----------

export type Overlay =
  | { kind: 'game'; item: ConsumableId }
  | { kind: 'toy'; toyId: string }
  | { kind: 'puzzle' }
  | { kind: 'bonus' }
  | { kind: 'taskEditor'; taskId?: string; preset?: { title: string; emoji: string; need: NeedId } }
  | { kind: 'taskPicker' }
  | { kind: 'import' }
  | { kind: 'reward'; result: CompletionResult; taskTitle: string };

export type Tab = 'home' | 'tasks' | 'goals' | 'wardrobe' | 'settings';
/** Welcher Tag in der Aufgabenliste gezeigt wird: 0 = heute, 1 = morgen … oder alle */
export type TaskView = number | 'all';

interface UIState {
  tab: Tab;
  overlays: Overlay[];
  toast: { text: string; key: number } | null;
  taskView: TaskView;
  setTab(t: Tab): void;
  setTaskView(v: TaskView): void;
  open(o: Overlay): void;
  replace(o: Overlay): void;
  close(): void;
  showToast(text: string): void;
}

export const useUI = create<UIState>()((set, get) => ({
  tab: 'home',
  overlays: [],
  toast: null,
  taskView: 0,
  setTab: (tab) => set({ tab }),
  setTaskView: (taskView) => set({ taskView }),
  open: (o) => set({ overlays: [...get().overlays, o] }),
  replace: (o) => set({ overlays: [...get().overlays.slice(0, -1), o] }),
  close: () => set({ overlays: get().overlays.slice(0, -1) }),
  showToast: (text) => set({ toast: { text, key: Date.now() } }),
}));
