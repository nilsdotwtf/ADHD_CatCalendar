import React from 'react';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { ClothingType } from '../data/items';
import { isDark, shade } from './color';

// Kleidungsstücke – werden auf das Tier gesetzt oder einzeln (Schrank, Auswahl) gezeigt.

export interface WornClothing {
  type: ClothingType;
  color: string;
}

type Spot = { x: number; y: number; w: number };

export function HeadWear({ item, at }: { item: WornClothing; at: Spot }) {
  const k = at.w / 76;
  const c = item.color;
  const d = shade(c, -0.3);
  const l = shade(c, 0.45);
  const t = `translate(${at.x} ${at.y}) scale(${k})`;
  switch (item.type) {
    case 'bow':
      return (
        <G transform={`translate(${at.x + at.w * 0.34} ${at.y + 8}) scale(${k}) rotate(15)`}>
          <Path d="M0 0 L-18 -12 Q-22 0 -18 12 Z" fill={c} />
          <Path d="M0 0 L18 -12 Q22 0 18 12 Z" fill={c} />
          <Circle r={5.5} fill={d} />
        </G>
      );
    case 'crown':
      return (
        <G transform={t}>
          <Path d="M-24 6 L-26 -16 L-12 -4 L0 -22 L12 -4 L26 -16 L24 6 Z" fill={c} stroke={d} strokeWidth={2} strokeLinejoin="round" />
          <Circle cx={0} cy={-1} r={3.5} fill="#fff" opacity={0.85} />
          <Circle cx={-14} cy={1} r={2.5} fill="#fff" opacity={0.7} />
          <Circle cx={14} cy={1} r={2.5} fill="#fff" opacity={0.7} />
        </G>
      );
    case 'flowers':
      return (
        <G transform={t}>
          <Path d="M-38 12 Q0 -14 38 12" stroke="#4CAF50" strokeWidth={4} fill="none" />
          {[[-30, 6], [-15, -2], [0, -5], [15, -2], [30, 6]].map(([fx, fy], i) => (
            <G key={i} transform={`translate(${fx} ${fy})`}>
              {[0, 72, 144, 216, 288].map((ang) => (
                <Circle key={ang} cx={Math.cos((ang * Math.PI) / 180) * 5} cy={Math.sin((ang * Math.PI) / 180) * 5} r={4} fill={i % 2 ? l : c} />
              ))}
              <Circle r={3} fill="#FFD54F" />
            </G>
          ))}
        </G>
      );
    case 'headband':
      return (
        <G transform={t}>
          <Path d="M-40 18 Q0 -20 40 18" stroke={c} strokeWidth={7} fill="none" strokeLinecap="round" />
          <G transform="translate(22 -2)">
            <Path d="M0 0 L-10 -7 L-10 7 Z M0 0 L10 -7 L10 7 Z" fill={d} />
            <Circle r={3.5} fill={l} />
          </G>
        </G>
      );
    case 'cap':
      return (
        <G transform={t}>
          <Path d="M-30 8 Q-30 -26 0 -26 Q30 -26 30 8 Z" fill={c} />
          <Path d="M8 4 Q40 0 48 10 Q30 14 4 10 Z" fill={d} />
          <Path d="M0 -26 L0 8" stroke={d} strokeWidth={1.5} opacity={0.5} />
          <Circle cx={0} cy={-26} r={3.5} fill={d} />
        </G>
      );
    case 'tophat': {
      const band = isDark(c) ? '#E04848' : '#27272A';
      return (
        <G transform={t}>
          <Ellipse cx={0} cy={4} rx={36} ry={7} fill={d} />
          <Rect x={-22} y={-40} width={44} height={44} rx={4} fill={c} />
          <Rect x={-22} y={-8} width={44} height={8} fill={band} />
        </G>
      );
    }
    case 'beanie':
      return (
        <G transform={t}>
          <Path d="M-32 8 Q-32 -30 0 -30 Q32 -30 32 8 Z" fill={c} />
          <Rect x={-34} y={-2} width={68} height={13} rx={6} fill={d} />
          <Circle cx={0} cy={-32} r={8} fill={l} />
        </G>
      );
    default:
      return null;
  }
}

export function NeckWear({ item, at }: { item: WornClothing; at: Spot }) {
  const k = Math.max(0.6, at.w / 60);
  const c = item.color;
  const d = shade(c, -0.3);
  const t = `translate(${at.x} ${at.y}) scale(${k})`;
  switch (item.type) {
    case 'bowtie':
      return (
        <G transform={t}>
          <Path d="M0 0 L-18 -11 Q-21 0 -18 11 Z M0 0 L18 -11 Q21 0 18 11 Z" fill={c} />
          <Circle r={5} fill={d} />
        </G>
      );
    case 'tie':
      return (
        <G transform={t}>
          <Path d="M-7 -5 L7 -5 L5 6 L-5 6 Z" fill={d} />
          <Path d="M-5 6 L5 6 L10 34 L0 44 L-10 34 Z" fill={c} />
          <Path d="M-3 16 L6 22 M-6 28 L8 34" stroke={d} strokeWidth={2} opacity={0.5} />
        </G>
      );
    case 'necklace': {
      const pearls = Array.from({ length: 9 }, (_, i) => {
        const ang = Math.PI * (0.12 + (0.76 * i) / 8);
        return [Math.cos(ang) * -28, Math.sin(ang) * 10 - 6] as const;
      });
      return (
        <G transform={t}>
          {pearls.map(([px, py], i) => (
            <G key={i}>
              <Circle cx={px} cy={py} r={4.2} fill={c} />
              <Circle cx={px - 1.3} cy={py - 1.3} r={1.3} fill="#fff" opacity={0.8} />
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
        <NeckWear item={item} at={{ x: 50, y: item.type === 'tie' ? 30 : 50, w: 90 }} />
      ) : (
        <HeadWear item={item} at={{ x: item.type === 'bow' ? 22 : 50, y: 66, w: 100 }} />
      )}
    </Svg>
  );
}
