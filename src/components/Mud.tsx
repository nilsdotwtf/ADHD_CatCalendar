import React from 'react';
import { Circle, Ellipse, G, Path } from 'react-native-svg';

const MUD = '#7a5234';
const MUD_DARK = '#5b3a22';
const MUD_LIGHT = '#a37a52';

/** Stabile Pseudo-Zufallszahl 0..1 */
function rnd(seed: number, i: number) {
  const v = Math.sin(seed * 91.17 + i * 12.9898) * 43758.5453;
  return v - Math.floor(v);
}

/** Weicher, unregelmäßiger Klecks */
function blobPath(cx: number, cy: number, r: number, seed: number) {
  const n = 9;
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rnd(seed, i + 90) * 0.4;
    const rr = r * (0.72 + rnd(seed, i) * 0.45);
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.9]);
  }
  const mid = (p: [number, number], q: [number, number]) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  const start = mid(pts[n - 1], pts[0]);
  let d = `M${start[0].toFixed(1)} ${start[1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const m = mid(p, pts[(i + 1) % n]);
    d += ` Q${p[0].toFixed(1)} ${p[1].toFixed(1)} ${m[0].toFixed(1)} ${m[1].toFixed(1)}`;
  }
  return d + ' Z';
}

/** Dicker, kurzer Matschfinger vom Klecks nach außen (Spitze kommt als Tropfen dazu) */
function fingerPath(cx: number, cy: number, r: number, angle: number, len: number, tip: number) {
  const ca = Math.cos(angle);
  const sa = Math.sin(angle);
  const spread = 0.42;
  const b1 = [cx + Math.cos(angle - spread) * r * 0.8, cy + Math.sin(angle - spread) * r * 0.8];
  const b2 = [cx + Math.cos(angle + spread) * r * 0.8, cy + Math.sin(angle + spread) * r * 0.8];
  const tx = cx + ca * (r + len);
  const ty = cy + sa * (r + len);
  const t1 = [tx - sa * tip * 0.8, ty + ca * tip * 0.8];
  const t2 = [tx + sa * tip * 0.8, ty - ca * tip * 0.8];
  const f = (v: number) => v.toFixed(1);
  const mx = cx + ca * (r + len * 0.4);
  const my = cy + sa * (r + len * 0.4);
  return `M${f(b1[0])} ${f(b1[1])} Q${f(mx + sa * tip * 0.4)} ${f(my - ca * tip * 0.4)} ${f(t2[0])} ${f(t2[1])} L${f(t1[0])} ${f(t1[1])} Q${f(mx - sa * tip * 0.4)} ${f(my + ca * tip * 0.4)} ${f(b2[0])} ${f(b2[1])} Z`;
}

/** Ein Matschspritzer: unregelmäßiger Klecks mit Matschfingern, Tropfen und feuchtem Glanz. */
export function MudSplat({ x, y, r, seed = 1, opacity = 1 }: { x: number; y: number; r: number; seed?: number; opacity?: number }) {
  const fingers = [0, 1, 2].map((i) => {
    const a = (i / 3) * Math.PI * 2 + rnd(seed, i + 10) * 1.4;
    const len = r * (0.35 + rnd(seed, i + 30) * 0.55);
    const tip = r * (0.24 + rnd(seed, i + 50) * 0.12);
    return { d: fingerPath(x, y, r, a, len, tip), tx: x + Math.cos(a) * (r + len), ty: y + Math.sin(a) * (r + len), tip };
  });
  const drops = [0, 1, 2].map((i) => {
    const a = rnd(seed, i + 60) * Math.PI * 2;
    const dist = r * (1.75 + rnd(seed, i + 70) * 0.7);
    return { x: x + Math.cos(a) * dist, y: y + Math.sin(a) * dist, s: r * (0.13 + rnd(seed, i + 80) * 0.14) };
  });
  const blob = blobPath(x, y, r, seed);
  const sw = Math.max(1.2, r * 0.16);
  // Zwei Durchgänge: erst alles dunkel & etwas dicker (Kontur), dann hell darüber
  const shapes = (fill: string, stroke?: string) => (
    <G fill={fill} stroke={stroke} strokeWidth={stroke ? sw : 0} strokeLinejoin="round">
      {fingers.map((fi, i) => (
        <G key={i}>
          <Path d={fi.d} />
          <Ellipse cx={fi.tx} cy={fi.ty} rx={fi.tip} ry={fi.tip * 0.92} />
        </G>
      ))}
      <Path d={blob} />
      {drops.map((d, i) => (
        <Ellipse key={i} cx={d.x} cy={d.y} rx={d.s} ry={d.s * 0.85} />
      ))}
    </G>
  );
  return (
    <G opacity={opacity}>
      {shapes(MUD_DARK, MUD_DARK)}
      {shapes(MUD)}
      <Path d={blobPath(x + r * 0.15, y + r * 0.18, r * 0.5, seed + 3)} fill={MUD_DARK} opacity={0.35} />
      <Ellipse cx={x - r * 0.3} cy={y - r * 0.3} rx={r * 0.28} ry={r * 0.14} fill={MUD_LIGHT} opacity={0.85} transform={`rotate(-25 ${(x - r * 0.3).toFixed(1)} ${(y - r * 0.3).toFixed(1)})`} />
      <Circle cx={x + r * 0.05} cy={y - r * 0.5} r={r * 0.08} fill={MUD_LIGHT} opacity={0.85} />
    </G>
  );
}
