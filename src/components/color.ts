function toRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
}

/** amount > 0 hellt auf, < 0 dunkelt ab (-1..1) */
export function shade(hex: string, amount: number): string {
  const [r, g, b] = toRgb(hex);
  if (amount >= 0) return toHex(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount);
  return toHex(r * (1 + amount), g * (1 + amount), b * (1 + amount));
}

export function isDark(hex: string): boolean {
  const [r, g, b] = toRgb(hex);
  return 0.299 * r + 0.587 * g + 0.114 * b < 110;
}

export function rgbDistance(a: string, b: string): number {
  const [r1, g1, b1] = toRgb(a);
  const [r2, g2, b2] = toRgb(b);
  // gewichtete Distanz (grob wahrnehmungsnah)
  return Math.sqrt(2 * (r1 - r2) ** 2 + 4 * (g1 - g2) ** 2 + 3 * (b1 - b2) ** 2) / 3;
}

export function toHsl(hex: string): [number, number, number] {
  const [r, g, b] = toRgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}

export function fromHsl(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(1, s));
  l = Math.max(0, Math.min(1, l));
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return toHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}

/**
 * Überträgt den Abstand "variant ← anchor" auf eine neue Zielfarbe:
 * Schatten bleiben Schatten, Lichter bleiben Lichter – nur in der neuen Farbe.
 */
export function shiftLike(target: string, anchor: string, variant: string): string {
  const [th, ts, tl] = toHsl(target);
  const [ah, as, al] = toHsl(anchor);
  const [vh, vs, vl] = toHsl(variant);
  let dh = vh - ah;
  if (dh > 180) dh -= 360;
  if (dh < -180) dh += 360;
  // Bei fast grauen Zielfarben keine Farbstiche dazudichten
  const sat = ts < 0.08 ? ts : ts + (vs - as) * Math.min(1, ts / Math.max(as, 0.01));
  // Helligkeitsabstand an den Spielraum der Zielfarbe anpassen
  const dl = vl - al;
  const room = dl < 0 ? tl / Math.max(al, 0.05) : (1 - tl) / Math.max(1 - al, 0.05);
  return fromHsl(th + dh, sat, tl + dl * Math.min(1.4, Math.max(0.35, room)));
}
