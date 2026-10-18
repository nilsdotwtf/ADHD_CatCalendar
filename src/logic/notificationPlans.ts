import { getSpecies } from '../data/animals';
import { useStore } from '../store';
import { BORED_AFTER_MS } from './needs';
import { EVENING_REMINDER_HOUR, HOUR, MIN, NO_DUE } from './time';

// iOS erlaubt max. 64 geplante Benachrichtigungen – wir bleiben darunter.
export const MAX_SCHEDULED = 60;
const REMINDERS_PER_TASK = 6;

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export interface Planned {
  date: Date | null; // null = täglich (daily)
  daily?: { hour: number; minute: number };
  title: string;
  body: string;
}

/** Alle Benachrichtigungen, die gerade geplant sein sollten (gemeinsam für Expo und Capacitor). */
export function buildPlans(): Planned[] {
  const s = useStore.getState();
  const sp = getSpecies(s.speciesId);
  const pet = s.petName || sp.name;
  const me = s.nickname;
  const now = Date.now();
  const plans: Planned[] = [];

  // 1) Trink-Erinnerungen: morgens, mittags, abends
  const drinkTexts = [
    `${sp.emoji} ${pet} hat sich gerade ein Schlückchen gegönnt – du auch, ${me}?`,
    `${sp.emoji} Zeit für ein Glas Wasser! ${pet} prostet dir zu 💧`,
    `${sp.emoji} ${pet} erinnert dich: Trinken nicht vergessen, ${me}!`,
  ];
  s.drinkTimes.forEach((d, i) => {
    plans.push({
      date: null,
      daily: { hour: d.hour, minute: d.minute },
      title: `💧 ${d.label}: Trinken!`,
      body: drinkTexts[i % drinkTexts.length],
    });
  });

  // 2) Langeweile: über einen Tag keine Aufgabe
  if (s.tasks.length === 0) {
    let at = s.lastTaskActivity + BORED_AFTER_MS;
    if (at < now + 5 * MIN) at = now + 3 * HOUR;
    plans.push({
      date: new Date(at),
      title: `${sp.emoji} ${pet} langweilt sich…`,
      body: `Schon lange keine Aufgabe mehr da. ${pet} hat Hunger auf ein kleines Erfolgserlebnis – leg was an!`,
    });
    plans.push({
      date: new Date(at + 24 * HOUR),
      title: `${sp.emoji} ${pet} vermisst dich, ${me}!`,
      body: `Eine winzige Aufgabe reicht schon, damit ${pet} wieder strahlt ✨`,
    });
  }

  // 3) Abend-Erinnerung für "Heute irgendwann"-Aufgaben
  const sorted = [...s.tasks].sort((a, b) => a.dueAt - b.dueAt);
  const eveningByDay = new Map<number, string[]>();
  for (const t of sorted) {
    if (t.dueMode !== 'today') continue;
    const evening = new Date(t.dueAt);
    evening.setHours(EVENING_REMINDER_HOUR, 0, 0, 0);
    let at = evening.getTime();
    // Erst nach 19 Uhr angelegt? Dann um 21 Uhr erinnern.
    if (at < now + MIN) at += 2 * HOUR;
    if (at < now + MIN || at > t.dueAt) continue;
    eveningByDay.set(at, [...(eveningByDay.get(at) ?? []), t.title]);
  }
  for (const [at, titles] of eveningByDay) {
    plans.push({
      date: new Date(at),
      title: `${sp.emoji} Du wolltest heute noch…`,
      body:
        titles.length === 1
          ? `„${titles[0]}“ erledigen. ${pet} glaubt an dich, ${me}! 💪`
          : `${titles.length} Sachen erledigen: ${titles.slice(0, 3).join(', ')}${titles.length > 3 ? ' …' : ''}. ${pet} hilft dir! 💪`,
    });
  }

  // 4) Aufgaben-Erinnerungen (Start ab Fälligkeit, im gewählten Abstand)
  const taskPlans: Planned[] = [];
  for (const t of sorted) {
    if (t.reminderMinutes == null) continue;
    if (t.reminderMinutes === 0) {
      // Einmal genau zur gewählten Uhrzeit
      if (t.dueAt > now + MIN && t.dueAt < NO_DUE) {
        taskPlans.push({
          date: new Date(t.dueAt),
          title: `${t.emoji} ${t.title}`,
          body: `${sp.emoji} Jetzt ist es so weit, ${me}! ${pet} freut sich schon auf die Belohnung 🎁`,
        });
      }
      continue;
    }
    const interval = t.reminderMinutes * MIN;
    // Ohne Datum: ab Erstellung erinnern; "Heute irgendwann": ab jetzt bis Tagesende
    const start = t.dueAt >= NO_DUE ? t.createdAt : t.dueMode === 'today' ? Math.min(t.createdAt, t.dueAt) : t.dueAt;
    let first = start;
    if (first < now + MIN) {
      // schon fällig: nächster Termin im Raster
      const passed = Math.ceil((now + MIN - start) / interval);
      first = start + passed * interval;
    }
    for (let k = 0; k < REMINDERS_PER_TASK; k++) {
      const when = first + k * interval;
      const late = when > start + interval && when > t.dueAt;
      taskPlans.push({
        date: new Date(when),
        title: `${t.emoji} ${t.title}`,
        body: late
          ? pick([
              `${sp.emoji} ${pet} wird langsam unruhig… Schaffst du das jetzt, ${me}?`,
              `${sp.emoji} ${pet} wartet schon sehnsüchtig auf die Belohnung!`,
              `${sp.emoji} Nur noch diese eine Sache – ${pet} glaubt an dich! 💪`,
            ])
          : pick([
              `${sp.emoji} ${pet} sagt: Jetzt ist ein guter Moment!`,
              `${sp.emoji} Erledige es und ${pet} bekommt eine Belohnung 🎁`,
              `${sp.emoji} Los geht's, ${me}! ${pet} feuert dich an.`,
            ]),
      });
    }
  }
  taskPlans.sort((a, b) => a.date!.getTime() - b.date!.getTime());
  plans.push(...taskPlans.slice(0, MAX_SCHEDULED - plans.length));

  return plans;
}

export function testMessage(): { title: string; body: string } {
  const s = useStore.getState();
  const sp = getSpecies(s.speciesId);
  return { title: `${sp.emoji} Hallo ${s.nickname}!`, body: `${s.petName} sagt Hi – so sehen Erinnerungen aus.` };
}
