import React, { useId, useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Circle, G, Path, SvgXml } from 'react-native-svg';
import { SpeciesId } from '../data/animals';
import { ANIMAL_SVGS } from '../data/animalSvgs';
import { HeadWear, NeckWear, WornClothing } from './Clothing';
import { isDark, shade } from './color';

/*
 * Die Tiere kommen aus den Anime-SVGs in assets/animals/ (aufbereitet mit
 * scripts/gen_animal_svgs.py). Hier werden nur die Farben eingesetzt, Augen & Mund
 * je nach Stimmung getauscht und Schmutz, zerzaustes Fell und Kleidung als
 * Ebenen darübergelegt.
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

// Etwas Platz über dem Kopf für Hüte (Vorlage ist 320×320)
const VIEWBOX = '0 -32 320 352';
const INK = '#302a30';

/** Nasen sind schwarz – außer das Fell drumherum ist dunkel, dann rosa */
function noseColor(around: string, pink = '#EE93A6') {
  return isDark(around) ? pink : '#2B2330';
}

/** Ordnet die gewählten Farben den Farbvariablen der Vorlage zu */
function svgColors(species: SpeciesId, c0: string, c1: string, c2: string): Record<string, string> {
  const v: Record<string, string> = { ...ANIMAL_SVGS[species].defaults };
  v.fur = c0;
  switch (species) {
    case 'cat':
      v.patch1 = c1;
      v.patch2 = c2;
      v.cream = shade(c0, 0.55);
      break;
    case 'dog':
    case 'rabbit':
    case 'hamster':
    case 'fox':
    case 'penguin':
      v.cream = c1;
      v.mark = shade(c0, isDark(c0) ? 0.2 : -0.3);
      break;
    case 'giraffe':
    case 'cow':
      v.mark = c1;
      v.cream = shade(c0, 0.55);
      break;
    case 'budgie':
      v.cream = c1;
      v.mark = c2;
      break;
    case 'tiger':
    case 'raccoon':
      v.mark = c1;
      break;
  }
  const aroundNose = species === 'cat' || species === 'rabbit' || species === 'giraffe' ? c0 : v.cream;
  v.nose = species === 'cow' ? noseColor(c0, '#F2B8B5') : noseColor(aroundNose);
  v.nostril = isDark(v.nose) ? '#EEB0B3' : '#B5726F';
  return v;
}

// ---------- Augen & Mund je nach Stimmung (Koordinaten der Vorlage) ----------

const mirror = (inner: string) => `${inner}<g transform="translate(320 0) scale(-1 1)">${inner}</g>`;

const CLOSED_EYES = mirror('<path d="M100 153 Q119 127 138 153" fill="none" stroke="var(--ink)" stroke-width="5" stroke-linecap="round"/>');
const TIRED_EYES = mirror(
  '<path d="M100 146 Q119 161 138 146" fill="none" stroke="var(--ink)" stroke-width="4.5" stroke-linecap="round"/>' +
    '<path d="M106 157 Q119 165 132 157" fill="none" stroke="var(--ink)" stroke-width="1.6" opacity=".45"/>',
);
const SAD_EXTRA =
  mirror('<path d="M100 119 L131 111" fill="none" stroke="var(--ink)" stroke-width="3.5" stroke-linecap="round"/>') +
  '<path d="M214 168 q7 11 0 17 q-7 -6 0 -17Z" fill="#74B9FF" stroke="none"/>';
const LOVE_BLUSH = mirror('<ellipse cx="101" cy="173" rx="13" ry="6.5" fill="var(--pink)" stroke="none" opacity=".85"/>');

const MOUTHS: Partial<Record<Expression, string>> = {
  happy: '<path d="M160 180 L160 186 Q149 199 140 186 M160 186 Q171 199 180 186" fill="none" stroke="var(--ink)" stroke-width="2.3" stroke-linecap="round"/>',
  love: '<path d="M160 180 L160 186 Q149 199 140 186 M160 186 Q171 199 180 186" fill="none" stroke="var(--ink)" stroke-width="2.3" stroke-linecap="round"/>',
  eating:
    '<path d="M160 180 L160 184" stroke="var(--ink)" stroke-width="2"/><ellipse cx="160" cy="192" rx="10" ry="9" fill="#7E2F3C" stroke="var(--ink)" stroke-width="2"/>' +
    '<ellipse cx="160" cy="196" rx="5.5" ry="3.5" fill="#F28B9B" stroke="none"/>',
  tired: '<path d="M160 180 L160 184" stroke="var(--ink)" stroke-width="2"/><ellipse cx="160" cy="190" rx="4.5" ry="5.5" fill="#7E2F3C" stroke="var(--ink)" stroke-width="1.6"/>',
  sad: '<path d="M160 180 L160 185 M149 196 Q160 186 171 196" fill="none" stroke="var(--ink)" stroke-width="2.2" stroke-linecap="round"/>',
};

function buildXml(species: SpeciesId, colors: Record<string, string>, expression: Expression, rid: string): string {
  const src = ANIMAL_SVGS[species];
  let eyes = src.eyes;
  if (expression === 'love' || expression === 'eating') eyes = CLOSED_EYES + (expression === 'love' ? LOVE_BLUSH : '');
  else if (expression === 'tired') eyes = TIRED_EYES;
  else if (expression === 'sad') eyes = src.eyes + SAD_EXTRA;
  const mouth = src.mouth ? (MOUTHS[expression] ?? src.mouth) : '';
  const body = src.body.replace('<!--EYES-->', eyes).replace('<!--MOUTH-->', mouth).replace(/__ID__/g, `a${rid}`);
  const filled = body.replace(/var\(--([a-z0-9]+)\)/g, (_, name: string) => colors[name] ?? INK);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VIEWBOX}">${filled}</svg>`;
}

// ---------- Ebenen: zerzaustes Fell, Schmutz ----------

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
    const [x1, y1] = p(a - w, -4);
    const [x2, y2] = p(a + w, -4);
    const [tx, ty] = p(a + curl, l);
    d += `M${x1.toFixed(0)} ${y1.toFixed(0)} L${tx.toFixed(0)} ${ty.toFixed(0)} L${x2.toFixed(0)} ${y2.toFixed(0)} Z `;
  }
  return d;
}

// Kopf/Körper grob als Ellipsen (für Haarbüschel & Schmutz)
const HEAD = { cx: 160, cy: 140, rx: 84, ry: 68 };
const BODY = { cx: 160, cy: 245, rx: 60, ry: 38 };

function MessBehind({ mess, fur }: { mess: number; fur: string }) {
  if (mess <= 0.12) return null;
  const k = Math.min(1, mess);
  return (
    <G fill={fur} stroke={INK} strokeWidth={2.8} strokeLinejoin="round">
      <Path d={tufts(HEAD.cx, HEAD.cy, HEAD.rx, HEAD.ry, 205, 335, Math.round(4 + k * 5), 10 + k * 12, 7)} />
      <Path d={tufts(HEAD.cx, HEAD.cy, HEAD.rx, HEAD.ry, -10, 25, 2, 8 + k * 8, 3)} />
      <Path d={tufts(HEAD.cx, HEAD.cy, HEAD.rx, HEAD.ry, 155, 190, 2, 8 + k * 8, 5)} />
      <Path d={tufts(BODY.cx, BODY.cy, BODY.rx, BODY.ry, -40, 15, Math.round(2 + k * 2), 8 + k * 9, 2)} />
      <Path d={tufts(BODY.cx, BODY.cy, BODY.rx, BODY.ry, 165, 220, Math.round(2 + k * 2), 8 + k * 9, 4)} />
    </G>
  );
}

function MessFront({ mess }: { mess: number }) {
  if (mess <= 0.12) return null;
  const strands = ['M118 92 q6 -12 14 -6', 'M160 82 q-6 -12 2 -16', 'M200 90 q8 -6 6 -16', 'M92 150 q-10 2 -12 -8', 'M228 152 q10 0 11 -9'];
  return (
    <Path
      d={strands.slice(0, 2 + Math.round(Math.min(1, mess) * 3)).join(' ')}
      stroke={INK}
      strokeWidth={2.2}
      fill="none"
      strokeLinecap="round"
      opacity={0.7}
    />
  );
}

function Dirt({ amount }: { amount: number }) {
  const spots: [number, number, number][] = [
    [118, 104, 9],
    [208, 122, 8],
    [150, 92, 6],
    [128, 246, 10],
    [196, 256, 9],
    [160, 272, 6],
  ];
  const n = Math.max(1, Math.round(spots.length * Math.min(1, amount)));
  return (
    <G opacity={0.55 + amount * 0.3}>
      {spots.slice(0, n).map(([x, y, r], i) => (
        <G key={i}>
          <Circle cx={x} cy={y} r={r} fill="#7A5A3A" />
          <Circle cx={x + r * 0.8} cy={y + r * 0.4} r={r * 0.55} fill="#7A5A3A" />
          <Circle cx={x - r * 0.6} cy={y + r * 0.7} r={r * 0.35} fill="#7A5A3A" />
        </G>
      ))}
    </G>
  );
}

// Wo Hut & Halsschmuck sitzen (Vorlagen-Koordinaten)
const TOP = { x: 160, y: 78, w: 118 };
const NECK = { x: 160, y: 207, w: 78 };

export function AnimalArt({ species, colors, expression = 'neutral', dirt = 0, mess = 0, head, neck, size = 200 }: Props) {
  const rid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const c0 = colors[0] ?? '#ccc';
  const c1 = colors[1] ?? c0;
  const c2 = colors[2] ?? c1;
  const vars = useMemo(() => svgColors(species, c0, c1, c2), [species, c0, c1, c2]);
  const xml = useMemo(() => buildXml(species, vars, expression, rid), [species, vars, expression, rid]);
  const w = size;
  const h = size * 1.1;
  const layer = { position: 'absolute' as const, left: 0, top: 0 };

  return (
    <View style={{ width: w, height: h }}>
      {mess > 0.12 && (
        <Svg width={w} height={h} viewBox={VIEWBOX} style={layer}>
          <MessBehind mess={mess} fur={vars.fur} />
        </Svg>
      )}
      <SvgXml xml={xml} width={w} height={h} style={layer} />
      {(dirt > 0.05 || mess > 0.12 || head || neck) && (
        <Svg width={w} height={h} viewBox={VIEWBOX} style={layer}>
          <MessFront mess={mess} />
          {dirt > 0.05 && <Dirt amount={dirt} />}
          {neck && <NeckWear item={neck} at={NECK} />}
          {head && <HeadWear item={head} at={TOP} />}
        </Svg>
      )}
    </View>
  );
}
