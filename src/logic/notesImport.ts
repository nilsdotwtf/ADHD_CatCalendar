export interface ParsedLine {
  title: string;
  done: boolean;
}

// Erkennt Checklisten aus Apple Notizen, Google Notizen (Keep), Samsung Notes & Co.
// Beispiele: "- [ ] Wäsche", "☐ Wäsche", "✓ Müll", "• Einkaufen", "1. Bad putzen", "* Kochen"
const DONE_MARKERS = /^(\[[xX✓✔]\]|☑|✅|✓|✔|☒)\s*/;
const OPEN_MARKERS = /^(\[\s?\]|☐|⬜|◻|○|◯|□|▢)\s*/;
const BULLETS = /^([-*•·–—▪︎▫︎◦‣⁃]+|\d+[.)]|[a-zA-Z][.)])\s+/;

export function parseNotes(text: string): ParsedLine[] {
  const seen = new Set<string>();
  const out: ParsedLine[] = [];
  for (const raw of text.split(/\r?\n/)) {
    let line = raw.trim();
    if (!line) continue;
    let done = false;
    // Bullet vor Checkbox ("- [ ] ...") erlauben
    line = line.replace(BULLETS, '');
    if (DONE_MARKERS.test(line)) {
      done = true;
      line = line.replace(DONE_MARKERS, '');
    } else {
      line = line.replace(OPEN_MARKERS, '');
    }
    line = line.replace(BULLETS, '').replace(/\s+/g, ' ').trim();
    // Überschriften wie "Einkaufsliste:" oder "# To do" überspringen
    if (/^#+\s/.test(line)) continue;
    if (line.endsWith(':') && line.split(' ').length <= 3) continue;
    if (line.length < 2) continue;
    if (line.length > 80) line = line.slice(0, 80).trim() + '…';
    const key = line.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ title: line, done });
  }
  return out;
}
