import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Ellipse, G, Path, SvgXml } from 'react-native-svg';
import { SpeciesId } from '../data/animals';
import { ANIMAL_COLORS } from '../data/animalColors';
import { ANIMAL_SVGS } from '../data/animalSvgs';
import { HeadWear, NeckWear, WornClothing } from './Clothing';
import { MudSplat } from './Mud';
import { isDark, lineTone, rgbDistance, shiftLike, toHsl } from './color';

/*
 * Die Tiere kommen aus den Anime-SVGs in assets/animals/ (aufbereitet mit
 * scripts/gen_animal_svgs.py). Hier werden die gewählten Farben eingesetzt und
 * Stimmung, Schmutz und Kleidung als Ebenen darübergelegt.
 */

export type { WornClothing } from './Clothing';
export { ClothingIcon } from './Clothing';

export type Expression = 'happy' | 'neutral' | 'sad' | 'tired' | 'eating' | 'love';

interface Props {
  species: SpeciesId;
  colors: string[];
  expression?: Expression;
  dirt?: number; // 0..1
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
  // Umrandungslinien (--l-…) dürfen beim Aufhellen nicht verschwinden
  for (const [name, orig] of Object.entries(src)) out[`l-${name}`] = lineTone(orig, out[name]);
  // Nase: schwarz – außer das Fell drumherum ist dunkel, dann rosa
  const around = cfg.noseAround != null ? (chosen[cfg.noseAround] ?? chosen[0]) : '#f5e6d0';
  out.nose = isDark(around) ? '#EE93A6' : '#2B2330';
  return out;
}

/**
 * Bildausschnitt im App-Seitenverhältnis 200:220 – mit genug Platz über dem Kopf,
 * damit auch ein Zylinder nicht abgeschnitten wird.
 */
function viewBoxFor(w: number, h: number, hatTop: number) {
  const aspect = 200 / 220;
  let vw = w;
  let vh = w / aspect;
  if (vh < h * 1.06) {
    vh = h * 1.06;
    vw = vh * aspect;
  }
  let y = -(vh - h) + h * 0.01;
  if (y > hatTop) {
    vh += y - hatTop;
    y = hatTop;
    vw = vh * aspect;
  }
  const x = -(vw - w) / 2;
  return { str: `${x.toFixed(1)} ${y.toFixed(1)} ${vw.toFixed(1)} ${vh.toFixed(1)}`, x, y, vw, vh };
}

// ---------- Ebenen ----------

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

function Overlay({ g, expression, skin, dirt }: { g: Geo; expression: Expression; skin: [string, string]; dirt: number }) {
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
  if (dirt > 0.05) {
    const spots: [number, number, number][] = [
      [g.cx - g.dist * 0.55, g.ey - g.dist * 0.45, 9],
      [g.cx + g.dist * 0.62, g.ey + g.dist * 0.18, 8],
      [g.cx + g.dist * 0.12, g.ey - g.dist * 0.72, 6],
      [g.cx - g.dist * 0.45, g.ey + g.dist * 1.45, 10],
      [g.cx + g.dist * 0.5, g.ey + g.dist * 1.62, 9],
      [g.cx - g.dist * 0.05, g.ey + g.dist * 1.95, 6],
    ];
    const n = Math.max(1, Math.round(spots.length * Math.min(1, dirt)));
    spots.slice(0, n).forEach(([x, y, r], i) => {
      parts.push(<MudSplat key={`d${i}`} x={x} y={y} r={r * s} seed={i + 1} opacity={0.75 + dirt * 0.25} />);
    });
  }
  return <>{parts}</>;
}

export function AnimalArt({ species, colors, expression = 'neutral', dirt = 0, head, neck, size = 200 }: Props) {
  const src = ANIMAL_SVGS[species];
  const key = colors.join(',');
  const vars = useMemo(() => recolor(species, colors), [species, key]); // eslint-disable-line react-hooks/exhaustive-deps
  const g = useMemo(() => geometry(species), [species]);
  // Platz für den höchsten Hut (Zylinder ≈ 46 Einheiten bei Breite 76)
  const vb = useMemo(() => viewBoxFor(src.w, src.h, g.ey - g.dist * 0.92 - (g.dist * 1.3 * 50) / 76), [src, g]);
  const xml = useMemo(() => {
    const body = src.body.replace(/var\(--([a-z0-9-]+)\)/g, (_, n: string) => vars[n] ?? INK);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.str}">${body}</svg>`;
  }, [src, vars, vb]);
  const cfg = ANIMAL_COLORS[species];
  const skin: [string, string] = [colors[cfg.eyeSkin[0]] ?? colors[0], colors[cfg.eyeSkin[1]] ?? colors[0]];
  const w = size;
  const h = size * 1.1;
  const layer = { position: 'absolute' as const, left: 0, top: 0 };
  const hasOverlay = expression !== 'neutral' || dirt > 0.05 || head || neck;
  const top = { x: g.cx, y: g.ey - g.dist * 0.92, w: g.dist * 1.3 };
  const neckAt = { x: g.cx, y: g.ey + g.dist * 0.82, w: g.dist * 0.9 };

  return (
    <View style={{ width: w, height: h }}>
      <SvgXml xml={xml} width={w} height={h} style={layer} />
      {hasOverlay && (
        <Svg width={w} height={h} viewBox={vb.str} style={layer}>
          <Overlay g={g} expression={expression} skin={skin} dirt={dirt} />
          {neck && <NeckWear item={neck} at={neckAt} />}
          {head && <HeadWear item={head} at={top} />}
        </Svg>
      )}
    </View>
  );
}
