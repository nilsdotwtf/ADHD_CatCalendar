// Belohnende Sprüche nach jeder erledigten Aufgabe. {me} = Spitzname, {pet} = Tiername
const LINES = [
  'Jeder kleine Schritt zählt – und du hast gerade einen gemacht, {me}!',
  '{pet} ist so stolz auf dich! Weiter so!',
  'Erledigt ist besser als perfekt. Und du hast es erledigt! ✨',
  'Dein Zukunfts-Ich sagt Danke, {me}!',
  'Schau mal, wie {pet} strahlt – das warst du!',
  'Du hast angefangen. Das ist oft der schwerste Teil. 💪',
  'Boom! Wieder eine Sache weniger im Kopf.',
  'Du bist produktiver, als du denkst, {me}.',
  'Das hast du richtig gut gemacht. Ehrlich!',
  'Kleine Siege sind auch Siege. 🏆',
  '{pet} macht gerade einen Freudentanz für dich!',
  'Dein Gehirn hat gerade Dopamin verdient – genieß es! 🎉',
  'Wow, {me}! Du bist heute echt dran.',
  'So fühlt sich Fortschritt an. 🚀',
  'Nicht aufgeschoben, sondern geschafft. Stark!',
  'Du hältst dein Leben am Laufen – das ist eine Leistung!',
  '{pet} sagt: „Du bist der/die Beste!“ 💖',
  'Ein Haken mehr. Ein Grund mehr, stolz zu sein.',
  'Du kannst das. Du hast es gerade bewiesen!',
  'Gut gemacht! Gönn dir kurz einen Moment zum Freuen.',
];

export function motivationLine(me: string, pet: string): string {
  const l = LINES[Math.floor(Math.random() * LINES.length)];
  return l.replace(/\{me\}/g, me).replace(/\{pet\}/g, pet);
}

/** Ab der 7. Aufgabe am Tag fragt das Tier nach einer Pause */
export const BREAK_AFTER = 6;

export function breakLine(count: number, me: string, pet: string): string {
  const lines = [
    `Wow, ${me} – schon ${count} Aufgaben heute! Ich bin richtig stolz auf dich. Magst du nicht lieber eine kleine Pause machen? ☕`,
    `${count} Aufgaben! Du hast heute so viel geschafft. Übernimm dich nicht – ${pet} würde jetzt gern mit dir kuscheln. 💛`,
    `Hey ${me}, ${count} erledigt! Das reicht locker für heute. Trink was, atme durch, du hast es dir verdient. 🌿`,
  ];
  return lines[count % lines.length];
}
