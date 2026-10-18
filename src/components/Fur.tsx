import React from 'react';
import { Circle, Ellipse, G, Path } from 'react-native-svg';
import { SpeciesId } from '../data/animals';
import { shade } from './color';

type El = [number, number, number, number]; // cx, cy, rx, ry

interface FurCfg {
  head: El;
  body?: El;
  /** Wangen-Büschel: Winkelbereiche in Grad (0 = rechts, 90 = unten) */
  cheeks?: [number, number][];
  cheekLen?: number;
  /** Farbe der Wangen: Index in colors oder feste Farbe */
  cheekColor?: number | string;
  /** Brustfell-Zickzack (x, y, Breite) */
  chest?: [number, number, number];
  chestColor?: number;
  /** Stirn-Büschel, das immer da ist (z.B. Kuh) */
  crest?: boolean;
  short?: boolean;
}

const CFG: Record<SpeciesId, FurCfg> = {
  cat: { head: [100, 88, 48, 48], body: [100, 168, 46, 38], cheeks: [[8, 42], [138, 172]], chest: [100, 130, 30] },
  tiger: { head: [100, 88, 48, 48], body: [100, 168, 46, 38], cheeks: [[8, 42], [138, 172]], cheekColor: '#FBF7EF', chest: [100, 130, 30] },
  dog: { head: [100, 88, 46, 46], body: [100, 168, 46, 38], cheeks: [[20, 50], [130, 160]], cheekLen: 7, chest: [100, 132, 28], chestColor: 1 },
  rabbit: { head: [100, 92, 44, 44], body: [100, 170, 44, 38], cheeks: [[10, 45], [135, 170]], chest: [100, 136, 26] },
  hamster: { head: [100, 140, 64, 66], cheeks: [[-15, 25], [155, 195]], cheekLen: 10, chest: [100, 150, 34], chestColor: 1 },
  fox: { head: [100, 86, 44, 44], body: [100, 170, 42, 36], cheeks: [[5, 50], [130, 175]], cheekLen: 13, cheekColor: 1, chest: [100, 136, 22], chestColor: 1 },
  giraffe: { head: [100, 60, 30, 26], body: [100, 178, 44, 26], short: true },
  cow: { head: [100, 84, 44, 40], body: [100, 170, 46, 36], crest: true, short: true },
  penguin: { head: [100, 120, 56, 88], short: true },
  budgie: { head: [100, 84, 36, 36], body: [100, 150, 42, 50], chest: [100, 128, 26], chestColor: 0 },
};

const rad = (d: number) => (d * Math.PI) / 180;

/** Pfad aus spitzen, leicht geschwungenen Fellbüscheln entlang einer Ellipse */
function tuftPath([cx, cy, rx, ry]: El, a0: number, a1: number, n: number, len: number, seed = 0): string {
  let d = '';
  const step = (a1 - a0) / n;
  for (let i = 0; i < n; i++) {
    const jitter = Math.sin((i + 1) * 12.9898 + seed * 78.233) * 0.5 + 0.5; // 0..1, stabil
    const a = a0 + step * (i + 0.5);
    const w = step * 0.55;
    const l = len * (0.75 + jitter * 0.5);
    const curl = (jitter - 0.5) * 14;
    const p = (ang: number, extra: number) => {
      const r = rad(ang);
      return [cx + Math.cos(r) * (rx * 0.94 + extra), cy + Math.sin(r) * (ry * 0.94 + extra)];
    };
    const [x1, y1] = p(a - w, 0);
    const [x2, y2] = p(a + w, 0);
    const [tx, ty] = p(a + curl, l);
    const [c1x, c1y] = p(a - w * 0.3, l * 0.45);
    const [c2x, c2y] = p(a + w * 0.4, l * 0.35);
    d += `M${x1.toFixed(1)} ${y1.toFixed(1)} Q${c1x.toFixed(1)} ${c1y.toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)} Q${c2x.toFixed(1)} ${c2y.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)} Z `;
  }
  return d;
}

function pickColor(colors: string[], c: number | string | undefined, fallback: string) {
  if (typeof c === 'string') return c;
  if (typeof c === 'number') return colors[c] ?? fallback;
  return fallback;
}

/**
 * Büschel, die über die Silhouette hinausragen (werden mit umrandet).
 * mess 0..1: wie zerzaust das Fell ist (dreckig = struppig).
 */
export function FurBack({ species, colors, mess }: { species: SpeciesId; colors: string[]; mess: number }) {
  const cfg = CFG[species];
  const c0 = colors[0];
  const parts: React.ReactNode[] = [];
  const len = cfg.cheekLen ?? 9;
  cfg.cheeks?.forEach(([a0, a1], i) => {
    parts.push(<Path key={`ch${i}`} d={tuftPath(cfg.head, a0, a1, 3, len, i)} fill={pickColor(colors, cfg.cheekColor, c0)} />);
  });
  if (cfg.crest) parts.push(<Path key="crest" d={tuftPath(cfg.head, 252, 288, 3, 9, 3)} fill={c0} />);
  if (mess > 0.12) {
    const k = Math.min(1, mess);
    const short = cfg.short ? 0.6 : 1;
    const n = Math.round(4 + k * 5);
    parts.push(<Path key="mh" d={tuftPath(cfg.head, 195, 345, n, (8 + k * 9) * short, 7)} fill={c0} />);
    if (cfg.body) {
      parts.push(<Path key="mb1" d={tuftPath(cfg.body, -45, 35, Math.round(2 + k * 3), (7 + k * 7) * short, 2)} fill={c0} />);
      parts.push(<Path key="mb2" d={tuftPath(cfg.body, 145, 225, Math.round(2 + k * 3), (7 + k * 7) * short, 5)} fill={c0} />);
    } else {
      parts.push(<Path key="mb" d={tuftPath(cfg.head, 20, 160, Math.round(3 + k * 3), (7 + k * 6) * short, 9)} fill={c0} />);
    }
  }
  return <G>{parts}</G>;
}

/** Fell-Details auf dem Tier: Brust-Zickzack, Glanzpunkte und – wenn struppig – wirre Haare */
export function FurFront({ species, colors, mess }: { species: SpeciesId; colors: string[]; mess: number }) {
  const cfg = CFG[species];
  const c0 = colors[0];
  const [hx, hy, hrx, hry] = cfg.head;
  const parts: React.ReactNode[] = [];
  if (cfg.chest) {
    // weiches Fell-Lätzchen mit Zacken nach unten
    const [x, y, w] = cfg.chest;
    const base = pickColor(colors, cfg.chestColor, c0);
    const teeth = 5;
    const sw = w / teeth;
    let d = `M${x - w / 2} ${y + 2} Q${x} ${y - 6} ${x + w / 2} ${y + 2}`;
    for (let i = teeth - 1; i >= 0; i--) {
      const tipX = x - w / 2 + sw * (i + 0.5);
      d += ` L${tipX.toFixed(1)} ${y + (i % 2 ? 9 : 12)} L${(x - w / 2 + sw * i).toFixed(1)} ${y + 4}`;
    }
    d += ' Z';
    parts.push(
      <Path key="chest" d={d} fill={shade(base, 0.18)} stroke={shade(base, -0.25)} strokeWidth={1.2} strokeOpacity={0.45} strokeLinejoin="round" />,
    );
  }
  // Glanzpunkte wie bei Plüsch-Figuren
  if (species !== 'penguin') {
    parts.push(
      <G key="shine" fill="#fff" opacity={0.45}>
        <Ellipse cx={hx - hrx * 0.38} cy={hy - hry * 0.62} rx={hrx * 0.11} ry={hry * 0.075} transform={`rotate(-25 ${hx - hrx * 0.38} ${hy - hry * 0.62})`} />
        <Circle cx={hx - hrx * 0.12} cy={hy - hry * 0.75} r={hrx * 0.05} />
      </G>,
    );
  } else {
    parts.push(
      <G key="shine" fill="#fff" opacity={0.35}>
        <Ellipse cx={78} cy={70} rx={6} ry={4} transform="rotate(-25 78 70)" />
        <Circle cx={90} cy={62} r={2.5} />
      </G>,
    );
  }
  if (mess > 0.12) {
    const col = shade(c0, -0.35);
    const k = Math.min(1, mess);
    const strands = [
      `M${hx - hrx * 0.5} ${hy - hry * 0.7} q4 -10 10 -6`,
      `M${hx + hrx * 0.1} ${hy - hry * 0.85} q-6 -8 -1 -13`,
      `M${hx + hrx * 0.45} ${hy - hry * 0.65} q6 -4 4 -12`,
      `M${hx - hrx * 0.7} ${hy + hry * 0.1} q-8 2 -10 -6`,
      `M${hx + hrx * 0.72} ${hy + hry * 0.15} q8 0 9 -8`,
    ];
    parts.push(
      <Path
        key="strands"
        d={strands.slice(0, 2 + Math.round(k * 3)).join(' ')}
        stroke={col}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
        opacity={0.75}
      />,
    );
  }
  return <G>{parts}</G>;
}

export const IRIS: Record<SpeciesId, string> = {
  cat: '#3E7A5A',
  tiger: '#B8862A',
  fox: '#A8682A',
  dog: '#5C3A22',
  rabbit: '#5A3A2E',
  hamster: '#2E2328',
  giraffe: '#4A3426',
  cow: '#3D2C25',
  penguin: '#2E2A33',
  budgie: '#2E2A33',
};
