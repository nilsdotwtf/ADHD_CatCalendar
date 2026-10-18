import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, SvgXml } from 'react-native-svg';
import { SpeciesId } from '../data/animals';
import { ANIMAL_COLORS } from '../data/animalColors';
import { ANIMAL_SVGS } from '../data/animalSvgs';
import { HeadWear, NeckWear, WornClothing } from './Clothing';
import { rgbDistance, shiftLike, toHsl } from './color';

/*
 * Die Tiere kommen aus den Anime-SVGs in assets/animals/ (aufbereitet mit
 * scripts/gen_animal_svgs.py). Hier werden die gewählten Farben eingesetzt und
 * Stimmung, Schmutz, zerzaustes Fell und Kleidung als Ebenen darübergelegt.
 */

export type { WornClothing } from './Clothing';
export { ClothingIcon } from './Clothing';

export type Expression = 'happy' | 'neutral' | 'sad' | 'tired' | 'eating' | 'love';

interface Props {
  species: SpeciesId;
  colors: string[];
  expression?: Expression;
  dirt?: number; // 0..1
  mess?: number; // 0..1 – zerzaustes Fell
  head?: WornClothing;
  neck?: WornClothing;
  size?: number;
}

const INK = '#3a2418';
const KEEP_GROUPS = new Set(['rosa', 'hell', 'akzent']);

/** Neue Werte für alle Farbvariablen eines Tiers */
function recolor(species: SpeciesId, chosen: string[]): Record<string, string> {
  const cfg = ANIMAL_COLORS[species];
  const src = ANIMAL_SVGS[species].colors;
  const groups = new Set(cfg.groups ?? ['fell']);
  const darkBelow = cfg.keepDarkBelow ?? 0.24;
  const keepGray = cfg.keepDarkGray ?? true;
  const out: Record<string, string> = {};
  for (const [name, orig] of Object.entries(src)) {
    out[name] = orig;
    const group = name.replace(/-\d+$/, '');
    if (KEEP_GROUPS.has(group) || !groups.has(group)) continue;
    const [, s, l] = toHsl(orig);
    if (l < darkBelow) continue;
    if (keepGray && l < 0.42 && s < 0.3) continue;
    let best: [number, string] | null = null;
    let bestD = Infinity;
    for (const a of cfg.anchors) {
      const d = rgbDistance(orig, a[1]);
      if (d < bestD) {
        bestD = d;
        best = a;
      }
    }
    if (!best || best[0] < 0 || bestD > 130) continue;
    const target = chosen[best[0]] ?? chosen[0];
    out[name] = shiftLike(target, best[1], orig);
  }
  return out;
}

/** Bildausschnitt im App-Seitenverhältnis 200:220 – mit Platz für Hüte über dem Kopf */
function viewBoxFor(w: number, h: number) {
  const aspect = 200 / 220;
  let vw = w;
  let vh = w / aspect;
  if (vh < h * 1.06) {
    vh = h * 1.06;
    vw = vh * aspect;
  }
  const x = -(vw - w) / 2;
  const y = -(vh - h) + h * 0.01;
  return { str: `${x.toFixed(1)} ${y.toFixed(1)} ${vw.toFixed(1)} ${vh.toFixed(1)}`, x, y, vw, vh };
}

// ---------- Ebenen ----------

const rad = (d: number) => (d * Math.PI) / 180;

function tufts(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, n: number, len: number, seed: number) {
  let d = '';
  const step = (a1 - a0) / n;
  for (let i = 0; i < n; i++) {
    const j = Math.sin((i + 1) * 12.9898 + seed * 78.233) * 0.5 + 0.5;
    const a = a0 + step * (i + 0.5);
    const w = step * 0.5;
    const l = len * (0.7 + j * 0.6);
    const curl = (j - 0.5) * 20;
    const p = (ang: number, extra: number) => [cx + Math.cos(rad(ang)) * (rx + extra), cy + Math.sin(rad(ang)) * (ry + extra)];
    const [x1, y1] = p(a - w, -6);
    const [x2, y2] = p(a + w, -6);
    const [tx, ty] = p(a + curl, l);
    d += `M${x1.toFixed(0)} ${y1.toFixed(0)} L${tx.toFixed(0)} ${ty.toFixed(0)} L${x2.toFixed(0)} ${y2.toFixed(0)} Z `;
  }
  return d;
}

interface Geo {
  cx: number;
  ey: number;
  dist: number; // Augenabstand – Maßstab für alles andere
  eyes: number[][];
}

function geometry(species: SpeciesId): Geo {
  const eyes = ANIMAL_SVGS[species].eyes;
  const [l, r] = eyes;
  return { cx: (l[0] + r[0]) / 2, ey: (l[1] + r[1]) / 2, dist: Math.abs(r[0] - l[0]), eyes };
}

function MessBehind({ g, mess, fur }: { g: Geo; mess: number; fur: string }) {
  const k = Math.min(1, mess);
  const hx = g.cx;
  const hy = g.ey - g.dist * 0.1;
  const hrx = g.dist * 1.0;
  const hry = g.dist * 0.82;
  const by = g.ey + g.dist * 1.55;
  const s = g.dist / 90;
  return (
    <G fill={fur} stroke={INK} strokeWidth={3 * s} strokeLinejoin="round">
      <Path d={tufts(hx, hy, hrx, hry, 205, 335, Math.round(4 + k * 5), (12 + k * 14) * s, 7)} />
      <Path d={tufts(hx, hy, hrx, hry, -5, 25, 2, (9 + k * 9) * s, 3)} />
      <Path d={tufts(hx, hy, hrx, hry, 155, 185, 2, (9 + k * 9) * s, 5)} />
      <Path d={tufts(hx, by, g.dist * 0.95, g.dist * 0.7, -40, 15, Math.round(2 + k * 2), (10 + k * 10) * s, 2)} />
      <Path d={tufts(hx, by, g.dist * 0.95, g.dist * 0.7, 165, 220, Math.round(2 + k * 2), (10 + k * 10) * s, 4)} />
    </G>
  );
}

function Overlay({ g, expression, skin, mess, dirt }: { g: Geo; expression: Expression; skin: [string, string]; mess: number; dirt: number }) {
  const s = g.dist / 90;
  const lw = 4.5 * s;
  const parts: React.ReactNode[] = [];
  const closed = expression === 'love' || expression === 'eating';
  if (closed || expression === 'tired') {
    g.eyes.forEach(([x, y, rx, ry], i) => {
      parts.push(<Ellipse key={`c${i}`} cx={x} cy={y} rx={rx * 1.12} ry={ry * 1.12} fill={skin[i]} />);
      parts.push(
        closed ? (
          <Path key={`a${i}`} d={`M${x - rx} ${y + ry * 0.2} Q${x} ${y - ry * 1.0} ${x + rx} ${y + ry * 0.2}`} stroke={INK} strokeWidth={lw} fill="none" strokeLinecap="round" />
        ) : (
          <G key={`a${i}`}>
            <Path d={`M${x - rx} ${y} Q${x} ${y + ry * 0.55} ${x + rx} ${y}`} stroke={INK} strokeWidth={lw} fill="none" strokeLinecap="round" />
            <Path d={`M${x - rx * 0.6} ${y + ry * 0.55} Q${x} ${y + ry * 0.75} ${x + rx * 0.6} ${y + ry * 0.55}`} stroke={INK} strokeWidth={lw * 0.35} fill="none" opacity={0.5} />
          </G>
        ),
      );
    });
  }
  if (expression === 'love' || expression === 'happy') {
    g.eyes.forEach(([x, y, , ry], i) => {
      const bx = x + (i === 0 ? -1 : 1) * g.dist * 0.08;
      parts.push(<Ellipse key={`b${i}`} cx={bx} cy={y + ry * 1.25} rx={g.dist * 0.13} ry={g.dist * 0.06} fill="#FF7FA0" opacity={expression === 'love' ? 0.55 : 0.3} />);
    });
  }
  if (expression === 'sad') {
    const [[lx, ly, lrx, lry], [rx, ry, rrx, rry]] = g.eyes;
    parts.push(
      <Path
        key="brows"
        d={`M${lx - lrx} ${ly - lry * 1.25} L${lx + lrx * 0.7} ${ly - lry * 1.6} M${rx + rrx} ${ry - rry * 1.25} L${rx - rrx * 0.7} ${ry - rry * 1.6}`}
        stroke={INK}
        strokeWidth={lw * 0.8}
        strokeLinecap="round"
      />,
    );
    parts.push(<Path key="tear" d={`M${rx + rrx * 0.6} ${ry + rry * 0.9} q${8 * s} ${13 * s} 0 ${20 * s} q${-8 * s} ${-7 * s} 0 ${-20 * s} Z`} fill="#74B9FF" />);
  }
  if (expression === 'eating') {
    const my = g.ey + g.dist * 0.6;
    parts.push(<Ellipse key="m" cx={g.cx} cy={my} rx={g.dist * 0.1} ry={g.dist * 0.09} fill="#7E2F3C" stroke={INK} strokeWidth={lw * 0.5} />);
    parts.push(<Ellipse key="t" cx={g.cx} cy={my + g.dist * 0.04} rx={g.dist * 0.055} ry={g.dist * 0.03} fill="#F28B9B" />);
  }
  if (mess > 0.12) {
    const hx = g.cx;
    const top = g.ey - g.dist * 0.85;
    parts.push(
      <Path
        key="strands"
        d={`M${hx - g.dist * 0.45} ${top + g.dist * 0.12} q${6 * s} ${-12 * s} ${14 * s} ${-6 * s} M${hx} ${top} q${-6 * s} ${-12 * s} ${2 * s} ${-16 * s} M${hx + g.dist * 0.42} ${top + g.dist * 0.1} q${8 * s} ${-6 * s} ${6 * s} ${-16 * s}`}
        stroke={INK}
        strokeWidth={2.4 * s}
        fill="none"
        strokeLinecap="round"
        opacity={0.75}
      />,
    );
  }
  if (dirt > 0.05) {
    const spots: [number, number, number][] = [
      [g.cx - g.dist * 0.55, g.ey - g.dist * 0.45, 10],
      [g.cx + g.dist * 0.6, g.ey + g.dist * 0.15, 9],
      [g.cx + g.dist * 0.1, g.ey - g.dist * 0.7, 7],
      [g.cx - g.dist * 0.45, g.ey + g.dist * 1.45, 11],
      [g.cx + g.dist * 0.5, g.ey + g.dist * 1.6, 10],
      [g.cx, g.ey + g.dist * 1.9, 7],
    ];
    const n = Math.max(1, Math.round(spots.length * Math.min(1, dirt)));
    parts.push(
      <G key="dirt" opacity={0.55 + dirt * 0.3}>
        {spots.slice(0, n).map(([x, y, r], i) => (
          <G key={i}>
            <Circle cx={x} cy={y} r={r * s} fill="#7A5A3A" />
            <Circle cx={x + r * s * 0.8} cy={y + r * s * 0.4} r={r * s * 0.55} fill="#7A5A3A" />
            <Circle cx={x - r * s * 0.6} cy={y + r * s * 0.7} r={r * s * 0.35} fill="#7A5A3A" />
          </G>
        ))}
      </G>,
    );
  }
  return <>{parts}</>;
}

export function AnimalArt({ species, colors, expression = 'neutral', dirt = 0, mess = 0, head, neck, size = 200 }: Props) {
  const src = ANIMAL_SVGS[species];
  const key = colors.join(',');
  const vars = useMemo(() => recolor(species, colors), [species, key]); // eslint-disable-line react-hooks/exhaustive-deps
  const vb = useMemo(() => viewBoxFor(src.w, src.h), [src]);
  const xml = useMemo(() => {
    const body = src.body.replace(/var\(--([a-z0-9-]+)\)/g, (_, n: string) => vars[n] ?? INK);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.str}">${body}</svg>`;
  }, [src, vars, vb]);
  const g = useMemo(() => geometry(species), [species]);
  const cfg = ANIMAL_COLORS[species];
  const skin: [string, string] = [colors[cfg.eyeSkin[0]] ?? colors[0], colors[cfg.eyeSkin[1]] ?? colors[0]];
  const w = size;
  const h = size * 1.1;
  const layer = { position: 'absolute' as const, left: 0, top: 0 };
  const hasOverlay = expression !== 'neutral' || dirt > 0.05 || mess > 0.12 || head || neck;
  const top = { x: g.cx, y: g.ey - g.dist * 0.92, w: g.dist * 1.3 };
  const neckAt = { x: g.cx, y: g.ey + g.dist * 0.82, w: g.dist * 0.9 };

  return (
    <View style={{ width: w, height: h }}>
      {mess > 0.12 && (
        <Svg width={w} height={h} viewBox={vb.str} style={layer}>
          <MessBehind g={g} mess={mess} fur={colors[0] ?? '#ccc'} />
        </Svg>
      )}
      <SvgXml xml={xml} width={w} height={h} style={layer} />
      {hasOverlay && (
        <Svg width={w} height={h} viewBox={vb.str} style={layer}>
          <Overlay g={g} expression={expression} skin={skin} mess={mess} dirt={dirt} />
          {neck && <NeckWear item={neck} at={neckAt} />}
          {head && <HeadWear item={head} at={top} />}
        </Svg>
      )}
    </View>
  );
}
