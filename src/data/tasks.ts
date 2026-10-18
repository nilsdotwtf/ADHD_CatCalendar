import { NeedId } from './items';

export interface TaskSuggestion {
  title: string;
  emoji: string;
  need: NeedId;
  keywords: string[];
}

// 15 Vorschläge aus dem Haushalt & Alltag
export const TASK_SUGGESTIONS: TaskSuggestion[] = [
  { title: 'Spülmaschine ausräumen', emoji: '🍽️', need: 'hunger', keywords: ['spülmaschine', 'geschirrspüler'] },
  { title: 'Wäsche waschen', emoji: '🧺', need: 'clean', keywords: ['wäsche', 'waschen', 'waschmaschine'] },
  { title: 'Wäsche aufhängen', emoji: '👕', need: 'clean', keywords: ['aufhängen', 'trockner', 'falten'] },
  { title: 'Staubsaugen', emoji: '🧹', need: 'clean', keywords: ['saugen', 'staub', 'fegen', 'wischen'] },
  { title: 'Müll rausbringen', emoji: '🗑️', need: 'clean', keywords: ['müll', 'abfall', 'altglas', 'pfand'] },
  { title: 'Abwaschen', emoji: '🧽', need: 'hunger', keywords: ['abwasch', 'spülen', 'geschirr'] },
  { title: 'Einkaufen', emoji: '🛒', need: 'hunger', keywords: ['einkauf', 'supermarkt', 'kaufen', 'besorgen'] },
  { title: 'Kochen', emoji: '🍳', need: 'hunger', keywords: ['kochen', 'essen', 'mittag', 'abendessen', 'backen'] },
  { title: 'Bett frisch beziehen', emoji: '🛏️', need: 'energy', keywords: ['bett', 'beziehen', 'bettwäsche'] },
  { title: 'Bad putzen', emoji: '🚿', need: 'clean', keywords: ['bad', 'klo', 'toilette', 'dusche', 'putzen'] },
  { title: 'Pflanzen gießen', emoji: '🪴', need: 'fun', keywords: ['pflanze', 'gießen', 'blumen'] },
  { title: '10 Minuten aufräumen', emoji: '📦', need: 'fun', keywords: ['aufräumen', 'ordnung', 'sortieren'] },
  { title: 'Post & Papierkram', emoji: '📬', need: 'energy', keywords: ['post', 'brief', 'papier', 'rechnung', 'formular', 'steuer'] },
  { title: 'Kühlschrank auswischen', emoji: '🧊', need: 'hunger', keywords: ['kühlschrank'] },
  { title: 'Kurz an die frische Luft', emoji: '🚶', need: 'fun', keywords: ['spazieren', 'laufen', 'luft', 'sport', 'gassi'] },
];

const EXTRA_EMOJI: [string[], string][] = [
  [['arzt', 'termin', 'zahnarzt'], '🩺'],
  [['anruf', 'anrufen', 'telefon'], '📞'],
  [['mail', 'e-mail', 'email'], '📧'],
  [['medikament', 'tablette'], '💊'],
  [['geburtstag', 'geschenk'], '🎁'],
  [['lernen', 'lesen', 'buch'], '📚'],
  [['auto', 'tanken'], '🚗'],
  [['bezahlen', 'überweisen', 'bank'], '💶'],
  [['fenster'], '🪟'],
  [['katze', 'hund', 'tier', 'füttern'], '🐾'],
];

const NEED_ROTATION: NeedId[] = ['hunger', 'clean', 'energy', 'fun'];

/** Errät ein passendes Emoji & Bedürfnis für eine freie Aufgabe. */
export function guessTaskMeta(title: string): { emoji: string; need: NeedId } {
  const t = title.toLowerCase();
  for (const s of TASK_SUGGESTIONS) {
    if (s.keywords.some((k) => t.includes(k))) return { emoji: s.emoji, need: s.need };
  }
  let hash = 0;
  for (let i = 0; i < t.length; i++) hash = (hash * 31 + t.charCodeAt(i)) >>> 0;
  const need = NEED_ROTATION[hash % NEED_ROTATION.length];
  for (const [keys, emoji] of EXTRA_EMOJI) {
    if (keys.some((k) => t.includes(k))) return { emoji, need };
  }
  return { emoji: '⭐', need };
}

export const EMOJI_CHOICES = [
  '⭐', '🧹', '🧺', '🍽️', '🛒', '🍳', '🗑️', '🚿', '🛏️', '🪴', '📬', '📞', '💊', '📚', '💶', '🚗', '🎁', '🐾', '💪', '🧘',
];
