import React from 'react';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';
import { ToyType } from '../data/items';
import { shade } from './color';

export function ToyArt({ type, color, size = 56 }: { type: ToyType; color: string; size?: number }) {
  const d = shade(color, -0.3);
  const l = shade(color, 0.5);
  let body: React.ReactNode;
  switch (type) {
    case 'ball':
      body = (
        <G>
          <Circle cx={50} cy={50} r={34} fill={color} />
          <Path d="M18 40 Q50 58 82 40" stroke="#fff" strokeWidth={7} fill="none" />
          <Path d="M20 62 Q50 78 80 62" stroke={d} strokeWidth={4} fill="none" opacity={0.5} />
          <Circle cx={38} cy={30} r={7} fill="#fff" opacity={0.45} />
        </G>
      );
      break;
    case 'yarn':
      body = (
        <G>
          <Circle cx={50} cy={50} r={32} fill={color} />
          <Path d="M24 34 Q50 50 76 30 M20 52 Q50 66 80 48 M28 70 Q52 78 74 66 M40 20 Q30 50 44 80 M60 20 Q72 50 58 80" stroke={d} strokeWidth={3} fill="none" />
          <Path d="M78 64 Q92 74 86 90" stroke={color} strokeWidth={4} fill="none" strokeLinecap="round" />
        </G>
      );
      break;
    case 'duck':
      body = (
        <G>
          <Ellipse cx={52} cy={64} rx={32} ry={22} fill={color} />
          <Circle cx={36} cy={38} r={18} fill={color} />
          <Path d="M18 38 L6 42 L18 46 Z" fill="#FB8C00" />
          <Circle cx={32} cy={34} r={3} fill="#222" />
          <Path d="M50 60 Q64 52 76 62" stroke={d} strokeWidth={3} fill="none" />
        </G>
      );
      break;
    case 'teddy':
      body = (
        <G>
          <Circle cx={30} cy={22} r={10} fill={color} />
          <Circle cx={70} cy={22} r={10} fill={color} />
          <Ellipse cx={50} cy={72} rx={26} ry={22} fill={color} />
          <Circle cx={50} cy={38} r={22} fill={color} />
          <Ellipse cx={50} cy={46} rx={9} ry={7} fill={l} />
          <Circle cx={42} cy={34} r={3} fill="#222" />
          <Circle cx={58} cy={34} r={3} fill="#222" />
          <Ellipse cx={50} cy={44} rx={3.5} ry={2.5} fill="#222" />
          <Ellipse cx={50} cy={74} rx={13} ry={11} fill={l} />
        </G>
      );
      break;
    case 'frisbee':
      body = (
        <G>
          <Ellipse cx={50} cy={56} rx={40} ry={16} fill={d} />
          <Ellipse cx={50} cy={50} rx={40} ry={16} fill={color} />
          <Ellipse cx={50} cy={48} rx={24} ry={8} fill={l} opacity={0.6} />
        </G>
      );
      break;
    case 'mouse':
      body = (
        <G>
          <Path d="M82 66 Q96 70 94 86" stroke={d} strokeWidth={3} fill="none" />
          <Ellipse cx={52} cy={62} rx={32} ry={20} fill={color} />
          <Circle cx={28} cy={42} r={10} fill={color} />
          <Circle cx={28} cy={42} r={5} fill={l} />
          <Circle cx={24} cy={60} r={3} fill="#222" />
          <Circle cx={18} cy={66} r={3} fill="#F48FB1" />
        </G>
      );
      break;
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {body}
    </Svg>
  );
}
