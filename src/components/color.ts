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
