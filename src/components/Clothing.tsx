import React from 'react';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';
import { ClothingType } from '../data/items';
import { isDark, shade } from './color';

/*
 * Kleidung im Stil der Tier-Illustrationen: weiche braune Kontur, flache
 * Grundfarbe, Schattenfläche, Falten/Nähte und ein kleines Glanzlicht.
 * Alle Teile sind um (0|0) gezeichnet: Hüte sitzen mit der Unterkante auf y≈6,
 * Halsschmuck hängt am Kragenpunkt (0|0).
 */

export interface WornClothing {
  type: ClothingType;
  color: string;
}

type Spot = { x: number; y: number; w: number };

const OUT = '#3a2418';
const LINE = { stroke: OUT, strokeWidth: 2.2, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
const SHINE = { stroke: '#ffffff', strokeOpacity: 0.65, strokeWidth: 2, fill: 'none', strokeLinecap: 'round' as const };

function tones(c: string) {
  return { base: c, dark: shade(c, -0.24), deeper: shade(c, -0.4), light: shade(c, 0.45) };
}

/** Flauschige Kugel (Bommel, Blüten) als gewellter Kreis */
function fluffy(cx: number, cy: number, r: number, lobes = 9) {
  let d = '';
  for (let i = 0; i <= lobes; i++) {
    const a = (i / lobes) * Math.PI * 2;
    const am = ((i - 0.5) / lobes) * Math.PI * 2;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) d += `M${x.toFixed(1)} ${y.toFixed(1)}`;
    else d += ` Q${(cx + Math.cos(am) * r * 1.3).toFixed(1)} ${(cy + Math.sin(am) * r * 1.3).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d + ' Z';
}

function Bow({ c, scale = 1 }: { c: string; scale?: number }) {
  const t = tones(c);
  return (
    <G transform={`scale(${scale})`}>
      <Path d="M-3 4 L-11 19 L-6 17 L-3 21 L1 5 Z" fill={t.dark} {...LINE} />
      <Path d="M3 4 L11 19 L6 17 L3 21 L-1 5 Z" fill={t.dark} {...LINE} />
      <Path d="M0 0 C-6 -11 -21 -17 -25 -8 C-28 -1 -22 9 0 4 Z" fill={t.base} {...LINE} />
      <Path d="M0 0 C6 -11 21 -17 25 -8 C28 -1 22 9 0 4 Z" fill={t.base} {...LINE} />
      <Path d="M-2 3 C-10 6 -18 6 -22 1 C-18 4 -10 3 -2 1 Z" fill={t.dark} />
      <Path d="M2 3 C10 6 18 6 22 1 C18 4 10 3 2 1 Z" fill={t.dark} />
      <Path d="M-5 0 C-10 -4 -15 -6 -19 -4 M5 0 C10 -4 15 -6 19 -4" stroke={t.deeper} strokeWidth={1.4} fill="none" strokeLinecap="round" />
      <Ellipse cx={0} cy={1.5} rx={5} ry={6} fill={t.dark} {...LINE} />
      <Path d="M-19 -9 Q-15 -12 -10 -10" {...SHINE} />
    </G>
  );
}

export function HeadWear({ item, at }: { item: WornClothing; at: Spot }) {
  const k = at.w / 76;
  const t = tones(item.color);
  const tr = `translate(${at.x} ${at.y}) scale(${k})`;
  switch (item.type) {
    case 'bow':
      return (
        <G transform={`translate(${at.x + at.w * 0.3} ${at.y + 10 * k}) scale(${k}) rotate(14)`}>
          <Bow c={item.color} />
        </G>
      );
    case 'crown':
      return (
        <G transform={tr}>
          <Path d="M-24 6 L-27 -16 L-14 -5 L0 -23 L14 -5 L27 -16 L24 6 Q0 10 -24 6 Z" fill={t.base} {...LINE} />
          <Path d="M14 -5 L27 -16 L24 6 Q18 7 12 7.5 Z" fill={t.dark} />
          <Path d="M-24.4 0.5 Q0 5 24.4 0.5 L24 6 Q0 10 -24 6 Z" fill={t.dark} {...LINE} />
          <Circle cx={-27} cy={-16} r={3.2} fill={t.light} {...LINE} />
          <Circle cx={0} cy={-23} r={3.6} fill={t.light} {...LINE} />
          <Circle cx={27} cy={-16} r={3.2} fill={t.light} {...LINE} />
          <Ellipse cx={0} cy={-5} rx={3.6} ry={4.4} fill="#E2566C" {...LINE} />
          <Ellipse cx={-13} cy={2.8} rx={2.5} ry={2.2} fill="#5AA2E6" stroke={OUT} strokeWidth={1.4} />
          <Ellipse cx={13} cy={2.8} rx={2.5} ry={2.2} fill="#5AA2E6" stroke={OUT} strokeWidth={1.4} />
          <Path d="M-20 -6 L-21 -12 M-7 -8 L-2 -15" {...SHINE} />
        </G>
      );
    case 'flowers': {
      const spots: [number, number][] = [[-31, 7], [-16, -2], [0, -5], [16, -2], [31, 7]];
      return (
        <G transform={tr}>
          <Path d="M-40 13 Q0 -17 40 13" stroke={OUT} strokeWidth={5.5} fill="none" strokeLinecap="round" />
          <Path d="M-40 13 Q0 -17 40 13" stroke="#6FA552" strokeWidth={3.2} fill="none" strokeLinecap="round" />
          {[[-24, 4, -40], [-8, -4, -20], [8, -4, 20], [24, 4, 40]].map(([x, y, r], i) => (
            <Ellipse key={i} cx={x} cy={y} rx={5} ry={2.6} fill="#7FB860" transform={`rotate(${r} ${x} ${y})`} stroke={OUT} strokeWidth={1.4} />
          ))}
          {spots.map(([x, y], i) => (
            <G key={i}>
              <Path d={fluffy(x, y, 5.2, 5)} fill={i % 2 ? t.light : t.base} {...LINE} strokeWidth={1.6} />
              <Circle cx={x} cy={y} r={2.4} fill="#FFD166" stroke={OUT} strokeWidth={1.2} />
            </G>
          ))}
        </G>
      );
    }
    case 'headband':
      return (
        <G transform={tr}>
          <Path d="M-40 17 Q0 -21 40 17" stroke={OUT} strokeWidth={9.5} fill="none" strokeLinecap="round" />
          <Path d="M-40 17 Q0 -21 40 17" stroke={t.base} strokeWidth={6.2} fill="none" strokeLinecap="round" />
          <Path d="M-30 6 Q-14 -6 0 -7" {...SHINE} strokeWidth={1.6} />
          <G transform="translate(23 -2)">
            <Bow c={item.color} scale={0.55} />
          </G>
        </G>
      );
    case 'cap':
      return (
        <G transform={tr}>
          <Path d="M-30 8 C-31 -14 -18 -27 0 -27 C18 -27 31 -14 30 8 Q0 13 -30 8 Z" fill={t.base} {...LINE} />
          <Path d="M10 -24.5 C24 -18 30 -6 30 8 Q22 10 14 10.5 C16 -3 15 -14 10 -24.5 Z" fill={t.dark} />
          <Path d="M0 -27 C-4 -14 -4 -2 -3 11 M-17 -21 C-20 -10 -20 -1 -19 10" stroke={t.deeper} strokeWidth={1.3} fill="none" />
          <Path d="M2 7 C18 2 38 2 48 10 C40 16 22 16 2 13 Z" fill={t.deeper} {...LINE} />
          <Circle cx={0} cy={-27} r={3.2} fill={t.dark} {...LINE} />
          <Path d="M-21 -14 Q-15 -21 -7 -23" {...SHINE} />
        </G>
      );
    case 'tophat': {
      const band = isDark(item.color) ? '#C8484F' : '#2E2A2C';
      return (
        <G transform={tr}>
          <Path d="M-36 4 C-36 -2.5 36 -2.5 36 4 C36 10 -36 10 -36 4 Z" fill={t.dark} {...LINE} />
          <Path d="M-21 1 L-23 -40 Q0 -45 23 -40 L21 1 Q0 4 -21 1 Z" fill={t.base} {...LINE} />
          <Path d="M9 -42.5 Q16 -42 23 -40 L21 1 Q15 2 9 2.4 Z" fill={t.dark} />
          <Path d="M-21.6 -10 Q0 -7 21.6 -10 L21 1 Q0 4 -21 1 Z" fill={band} {...LINE} />
          <Path d="M-23 -40 Q0 -36 23 -40" stroke={OUT} strokeWidth={1.4} fill="none" />
          <Path d="M-15 -34 L-14.5 -15" {...SHINE} strokeWidth={3} strokeOpacity={0.45} />
        </G>
      );
    }
    case 'beanie':
      return (
        <G transform={tr}>
          <Path d={fluffy(0, -35, 8, 10)} fill={t.light} {...LINE} />
          <Path d="M-30 6 C-30 -22 -16 -32 0 -32 C16 -32 30 -22 30 6 Z" fill={t.base} {...LINE} />
          <Path d="M12 -29 C24 -22 30 -10 30 6 L16 6 C18 -8 17 -20 12 -29 Z" fill={t.dark} />
          {[-20, -10, 0, 10, 20].map((x) => (
            <Path key={x} d={`M${x} 2 C${x * 0.92} -10 ${x * 0.72} -21 ${x * 0.42} -29`} stroke={t.deeper} strokeWidth={1.2} fill="none" opacity={0.7} />
          ))}
          <Path d="M-33 0 Q0 -6 33 0 L33 12 Q0 18 -33 12 Z" fill={t.dark} {...LINE} />
          {[-26, -18, -10, -2, 6, 14, 22, 30].map((x) => (
            <Path key={x} d={`M${x} ${-1.5 + Math.abs(x) * 0.05} L${x} ${12.5 + (30 - Math.abs(x)) * 0.1}`} stroke={t.deeper} strokeWidth={1.2} opacity={0.6} />
          ))}
          <Path d="M-20 -17 Q-14 -24 -6 -26" {...SHINE} />
        </G>
      );
    default:
      return null;
  }
}

export function NeckWear({ item, at }: { item: WornClothing; at: Spot }) {
  const k = Math.max(0.6, at.w / 60);
  const t = tones(item.color);
  const tr = `translate(${at.x} ${at.y}) scale(${k})`;
  switch (item.type) {
    case 'bowtie':
      return (
        <G transform={tr}>
          <Path d="M-3 -3 C-8 -10 -18 -13 -21 -6 C-23 0 -23 6 -21 9 C-18 14 -8 10 -3 3 Z" fill={t.base} {...LINE} />
          <Path d="M3 -3 C8 -10 18 -13 21 -6 C23 0 23 6 21 9 C18 14 8 10 3 3 Z" fill={t.base} {...LINE} />
          <Path d="M3 2 C8 9 17 12 21 9 C22 6 22.5 3 22.6 0 C16 4 9 3 3 0 Z" fill={t.dark} />
          <Path d="M-4 0 C-10 -3 -15 -3 -19 -1 M-4 1.5 C-10 3 -15 4 -19 4" stroke={t.deeper} strokeWidth={1.3} fill="none" strokeLinecap="round" />
          <Path d="M-4.5 -5.5 Q0 -7 4.5 -5.5 L4.5 5.5 Q0 7 -4.5 5.5 Z" fill={t.dark} {...LINE} />
          <Path d="M-17 -6 Q-13 -9 -8 -7" {...SHINE} />
        </G>
      );
    case 'tie':
      return (
        <G transform={tr}>
          <Path d="M-4.5 6 L4.5 6 L9.5 34 L0 45 L-9.5 34 Z" fill={t.base} {...LINE} />
          <Path d="M1.5 6 L4.5 6 L9.5 34 L0 45 L2.5 33 Z" fill={t.dark} />
          <Path d="M-4.6 13 L5.2 18.5 M-6.6 23.5 L7.4 31.2" stroke={t.deeper} strokeWidth={2.4} strokeLinecap="round" />
          <Path d="M-7 -5 L7 -5 L4.6 6.5 L-4.6 6.5 Z" fill={t.dark} {...LINE} />
          <Path d="M-2.5 10 L-4.5 26" {...SHINE} strokeWidth={1.6} />
        </G>
      );
    case 'necklace': {
      const pearls = Array.from({ length: 9 }, (_, i) => {
        const ang = Math.PI * (0.12 + (0.76 * i) / 8);
        return [Math.cos(ang) * -28, Math.sin(ang) * 10 - 6] as const;
      });
      return (
        <G transform={tr}>
          {pearls.map(([px, py], i) => (
            <G key={i}>
              <Circle cx={px} cy={py} r={4.4} fill={i === 4 ? t.light : t.base} stroke={OUT} strokeWidth={1.4} />
              <Circle cx={px + 1.4} cy={py + 1.4} r={2.2} fill={t.dark} opacity={0.6} />
              <Circle cx={px - 1.3} cy={py - 1.4} r={1.2} fill="#fff" opacity={0.9} />
            </G>
          ))}
        </G>
      );
    }
    default:
      return null;
  }
}

/** Kleidungsstück einzeln (für Auswahl & Schrank) */
export function ClothingIcon({ item, size = 64 }: { item: WornClothing; size?: number }) {
  const neckTypes: ClothingType[] = ['bowtie', 'tie', 'necklace'];
  const isNeck = neckTypes.includes(item.type);
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {isNeck ? (
        <NeckWear item={item} at={{ x: 50, y: item.type === 'tie' ? 26 : 50, w: 96 }} />
      ) : item.type === 'bow' ? (
        <G transform="translate(50 54) scale(1.6)">
          <Bow c={item.color} />
        </G>
      ) : (
        <HeadWear item={item} at={{ x: 50, y: 66, w: 100 }} />
      )}
    </Svg>
  );
}
