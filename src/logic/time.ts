export type Repeat = 'none' | 'daily' | 'weekly' | 'monthly';

export const REPEAT_LABEL: Record<Repeat, string> = {
  none: 'Einmalig',
  daily: 'Täglich',
  weekly: 'Wöchentlich',
  monthly: 'Monatlich',
};

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/** Formatiert ein Erinnerungsintervall. Alles über 24 Stunden wird in Tagen angezeigt. */
export function formatInterval(minutes: number): string {
  if (minutes < 60) return `${minutes} Min`;
  if (minutes <= 24 * 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const hs = h === 1 ? '1 Stunde' : `${h} Stunden`;
    return m ? `${hs} ${m} Min` : hs;
  }
  const d = Math.floor(minutes / (24 * 60));
  const rest = minutes - d * 24 * 60;
  const h = Math.floor(rest / 60);
  const m = rest % 60;
  let s = d === 1 ? '1 Tag' : `${d} Tage`;
  if (h) s += ` ${h} Std`;
  if (m) s += ` ${m} Min`;
  return s;
}

export function reminderLabel(minutes: number | null): string {
  if (minutes == null) return 'Keine Erinnerung';
  if (minutes === 30) return 'Jede halbe Stunde';
  if (minutes === 60) return 'Jede Stunde';
  return `Alle ${formatInterval(minutes)}`;
}

/** "Ohne Datum": liegt so weit in der Zukunft, dass die Aufgabe nie überfällig wird. */
export const NO_DUE = 8.64e15;
/** Uhrzeit der Abend-Erinnerung für "Heute irgendwann"-Aufgaben */
export const EVENING_REMINDER_HOUR = 19;

export type DueMode = 'time' | 'today' | 'none';

export function endOfDay(t: number): number {
  const d = new Date(t);
  d.setHours(23, 59, 0, 0);
  return d.getTime();
}

export function advanceDue(dueAt: number, repeat: Repeat, now: number): number {
  if (repeat === 'none' || dueAt >= NO_DUE) return dueAt;
  const d = new Date(dueAt);
  do {
    if (repeat === 'daily') d.setDate(d.getDate() + 1);
    else if (repeat === 'weekly') d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
  } while (d.getTime() <= now);
  return d.getTime();
}

export function dayKey(t: number): string {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / DAY);
}

function at(base: Date, dayOffset: number, h: number, m = 0): number {
  const d = new Date(base);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

export interface DueOption {
  key: string;
  label: string;
  mode: DueMode;
  time: (now: number) => number;
}

export const DUE_OPTIONS: DueOption[] = [
  { key: 'today', label: 'Heute irgendwann', mode: 'today', time: (n) => endOfDay(n) },
  { key: 'none', label: 'Ohne Datum', mode: 'none', time: () => NO_DUE },
  { key: 'now', label: 'Jetzt', mode: 'time', time: (n) => n },
  { key: '1h', label: 'In 1 Std', mode: 'time', time: (n) => n + HOUR },
  { key: '3h', label: 'In 3 Std', mode: 'time', time: (n) => n + 3 * HOUR },
  {
    key: 'evening',
    label: 'Heute Abend',
    mode: 'time',
    time: (n) => {
      const t = at(new Date(n), 0, 19);
      return t > n ? t : n + HOUR;
    },
  },
  { key: 'tomorrow-am', label: 'Morgen früh', mode: 'time', time: (n) => at(new Date(n), 1, 9) },
  { key: 'tomorrow-pm', label: 'Morgen Abend', mode: 'time', time: (n) => at(new Date(n), 1, 19) },
  { key: 'weekend', label: 'Am Wochenende', mode: 'time', time: (n) => {
    const d = new Date(n);
    const offset = (6 - d.getDay() + 7) % 7 || 7;
    return at(d, offset, 11);
  } },
];

const WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

export function formatDue(t: number, now: number, mode: DueMode = 'time'): string {
  if (t >= NO_DUE) return 'ohne Datum';
  const diff = t - now;
  const d = new Date(t);
  const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  if (diff < 0) {
    const ago = -diff;
    if (ago < 2 * MIN) return 'jetzt';
    if (ago < HOUR) return `seit ${Math.max(1, Math.round(ago / MIN))} Min fällig`;
    if (ago < DAY) return `seit ${Math.round(ago / HOUR)} Std fällig`;
    return `seit ${Math.round(ago / DAY)} Tag(en) fällig`;
  }
  const dk = daysBetween(dayKey(now), dayKey(t));
  if (mode === 'today') {
    if (dk === 0) return 'heute irgendwann';
    if (dk === 1) return 'morgen irgendwann';
    return `${WEEKDAYS[d.getDay()]} irgendwann`;
  }
  if (diff < HOUR) return `in ${Math.max(1, Math.round(diff / MIN))} Min`;
  if (dk === 0) return `heute ${hm}`;
  if (dk === 1) return `morgen ${hm}`;
  if (dk < 7) return `${WEEKDAYS[d.getDay()]} ${hm}`;
  return `${d.getDate()}.${d.getMonth() + 1}. ${hm}`;
}

export function formatClock(h: number, m: number): string {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export { MIN, HOUR, DAY };
