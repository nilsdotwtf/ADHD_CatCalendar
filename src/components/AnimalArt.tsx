import React, { useId } from 'react';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Line, Path, Rect } from 'react-native-svg';
import { SpeciesId } from '../data/animals';
import { ClothingType } from '../data/items';
import { isDark, shade } from './color';
import { FurBack, FurBase, FurFront, FurShade, IRIS, Paws } from './Fur';

export type Expression = 'happy' | 'neutral' | 'sad' | 'tired' | 'eating' | 'love';

export interface WornClothing {
  type: ClothingType;
  color: string;
}

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

interface Anchor {
  face: { x: number; y: number; dx: number; mouthY: number; k: number; beak?: boolean };
  top: { x: number; y: number; w: number };
  neck: { x: number; y: number; w: number };
}

const INK = '#2B2330';
const PINK = '#F4A7B9';
const OUTLINE = '#3B2F38';

const ANCHORS: Record<SpeciesId, Anchor> = {
  cat: { face: { x: 100, y: 88, dx: 18, mouthY: 106, k: 1 }, top: { x: 100, y: 44, w: 78 }, neck: { x: 100, y: 132, w: 60 } },
  dog: { face: { x: 100, y: 84, dx: 18, mouthY: 112, k: 1 }, top: { x: 100, y: 46, w: 76 }, neck: { x: 100, y: 132, w: 60 } },
  rabbit: { face: { x: 100, y: 90, dx: 17, mouthY: 106, k: 0.95 }, top: { x: 100, y: 54, w: 64 }, neck: { x: 100, y: 134, w: 56 } },
  hamster: { face: { x: 100, y: 108, dx: 20, mouthY: 128, k: 1 }, top: { x: 100, y: 80, w: 76 }, neck: { x: 100, y: 146, w: 56 } },
  fox: { face: { x: 100, y: 84, dx: 18, mouthY: 110, k: 1 }, top: { x: 100, y: 46, w: 72 }, neck: { x: 100, y: 130, w: 56 } },
  giraffe: { face: { x: 100, y: 58, dx: 14, mouthY: 86, k: 0.75 }, top: { x: 100, y: 38, w: 54 }, neck: { x: 100, y: 102, w: 30 } },
  cow: { face: { x: 100, y: 80, dx: 18, mouthY: 122, k: 1 }, top: { x: 100, y: 48, w: 70 }, neck: { x: 100, y: 130, w: 60 } },
  penguin: { face: { x: 100, y: 94, dx: 13, mouthY: 118, k: 0.9, beak: true }, top: { x: 100, y: 72, w: 70 }, neck: { x: 100, y: 124, w: 52 } },
  budgie: { face: { x: 100, y: 80, dx: 15, mouthY: 108, k: 0.9, beak: true }, top: { x: 100, y: 52, w: 62 }, neck: { x: 100, y: 120, w: 42 } },
  tiger: { face: { x: 100, y: 88, dx: 18, mouthY: 112, k: 1 }, top: { x: 100, y: 44, w: 78 }, neck: { x: 100, y: 132, w: 60 } },
};

export function AnimalArt({ species, colors, expression = 'neutral', dirt = 0, mess = 0, head, neck, size = 200 }: Props) {
  const rid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const c0 = colors[0] ?? '#ccc';
  const c1 = colors[1] ?? c0;
  const c2 = colors[2] ?? c1;
  const a = ANCHORS[species];
  const clip = `url(#body${rid})`;

  let back: React.ReactNode = null;
  let main: React.ReactNode = null;
  let clipShapes: React.ReactNode = null;
  let front: React.ReactNode = null; // nach dem Gesicht (z.B. Schlappohren)

  switch (species) {
    case 'cat': {
      clipShapes = (
        <>
          <Circle cx={100} cy={88} r={48} />
          <Ellipse cx={100} cy={168} rx={46} ry={38} />
          <Path d="M56 72 L62 26 L96 50 Z" />
          <Path d="M144 72 L138 26 L104 50 Z" />
        </>
      );
      back = (
        <Path d="M138 186 C178 188 190 150 174 124 C169 116 160 119 163 128 C172 152 160 170 132 170 Z" fill={c0} />
      );
      main = (
        <>
          <Ellipse cx={100} cy={168} rx={46} ry={38} fill={c0} />
          <Path d="M56 72 L62 26 L96 50 Z" fill={c0} />
          <Path d="M144 72 L138 26 L104 50 Z" fill={c0} />
          <Circle cx={100} cy={88} r={48} fill={c0} />
          <G clipPath={clip}>
            <Ellipse cx={64} cy={60} rx={30} ry={26} fill={c1} />
            <Ellipse cx={134} cy={178} rx={28} ry={22} fill={c1} />
            <Ellipse cx={140} cy={72} rx={20} ry={18} fill={c2} />
            <Ellipse cx={72} cy={170} rx={22} ry={17} fill={c2} />
          </G>
          <Path d="M65 60 L67 36 L86 51 Z" fill={PINK} opacity={0.8} />
          <Path d="M135 60 L133 36 L114 51 Z" fill={PINK} opacity={0.8} />
          <Ellipse cx={82} cy={203} rx={13} ry={8} fill={c0} />
          <Ellipse cx={118} cy={203} rx={13} ry={8} fill={c0} />
          <Path d="M95 99 L105 99 L100 105 Z" fill="#E88A9A" />
          <Whiskers y={104} />
        </>
      );
      break;
    }
    case 'tiger': {
      const muzzle = '#FBF7EF';
      clipShapes = (
        <>
          <Circle cx={100} cy={88} r={48} />
          <Ellipse cx={100} cy={168} rx={46} ry={38} />
        </>
      );
      back = (
        <>
          <Path d="M138 186 C178 188 190 150 174 124 C169 116 160 119 163 128 C172 152 160 170 132 170 Z" fill={c0} />
          <Path d="M168 150 L182 146 M176 132 L188 132 M160 170 L170 178" stroke={c1} strokeWidth={4} strokeLinecap="round" />
        </>
      );
      main = (
        <>
          <Circle cx={62} cy={50} r={16} fill={c0} />
          <Circle cx={138} cy={50} r={16} fill={c0} />
          <Circle cx={62} cy={52} r={8} fill={muzzle} />
          <Circle cx={138} cy={52} r={8} fill={muzzle} />
          <Ellipse cx={100} cy={168} rx={46} ry={38} fill={c0} />
          <Circle cx={100} cy={88} r={48} fill={c0} />
          <G clipPath={clip}>
            <Ellipse cx={100} cy={178} rx={24} ry={22} fill={muzzle} />
            <Path d="M100 42 L95 60 L105 60 Z" fill={c1} />
            <Path d="M84 46 L88 62 M116 46 L112 62" stroke={c1} strokeWidth={4} strokeLinecap="round" />
            <Path d="M52 80 L70 86 M52 94 L68 96 M148 80 L130 86 M148 94 L132 96" stroke={c1} strokeWidth={4} strokeLinecap="round" />
            <Path d="M58 150 Q72 158 66 176 M142 150 Q128 158 134 176 M64 186 Q76 192 74 204 M136 186 Q124 192 126 204" stroke={c1} strokeWidth={5} strokeLinecap="round" fill="none" />
            <Path d="M100 132 L94 146 M100 132 L106 146" stroke={c1} strokeWidth={4} strokeLinecap="round" />
          </G>
          <Ellipse cx={80} cy={74} rx={7} ry={4} fill={muzzle} />
          <Ellipse cx={120} cy={74} rx={7} ry={4} fill={muzzle} />
          <Ellipse cx={100} cy={106} rx={26} ry={16} fill={muzzle} />
          <Ellipse cx={82} cy={203} rx={13} ry={8} fill={c0} />
          <Ellipse cx={118} cy={203} rx={13} ry={8} fill={c0} />
          <Path d="M94 98 L106 98 L100 105 Z" fill="#C46A6A" />
          <Whiskers y={106} />
        </>
      );
      break;
    }
    case 'dog': {
      const ear = shade(c0, -0.18);
      clipShapes = (
        <>
          <Circle cx={100} cy={88} r={46} />
          <Ellipse cx={100} cy={168} rx={46} ry={38} />
        </>
      );
      back = <Path d="M140 170 Q174 150 166 118" stroke={c0} strokeWidth={13} strokeLinecap="round" fill="none" />;
      main = (
        <>
          <Ellipse cx={100} cy={168} rx={46} ry={38} fill={c0} />
          <Circle cx={100} cy={88} r={46} fill={c0} />
          <G clipPath={clip}>
            <Ellipse cx={121} cy={80} rx={21} ry={19} fill={c1} />
            <Ellipse cx={100} cy={182} rx={26} ry={24} fill={c1} />
            <Ellipse cx={66} cy={156} rx={18} ry={14} fill={c1} />
          </G>
          <Ellipse cx={100} cy={107} rx={24} ry={17} fill={shade(c1, 0.15)} />
          <Ellipse cx={82} cy={203} rx={13} ry={8} fill={c1} />
          <Ellipse cx={118} cy={203} rx={13} ry={8} fill={c1} />
          <Ellipse cx={100} cy={100} rx={8} ry={6} fill={INK} />
        </>
      );
      front = (
        <>
          <Ellipse cx={56} cy={88} rx={14} ry={30} fill={ear} transform="rotate(16 56 88)" />
          <Ellipse cx={144} cy={88} rx={14} ry={30} fill={ear} transform="rotate(-16 144 88)" />
        </>
      );
      break;
    }
    case 'rabbit': {
      clipShapes = (
        <>
          <Circle cx={100} cy={92} r={44} />
          <Ellipse cx={100} cy={170} rx={44} ry={38} />
          <Ellipse cx={121} cy={34} rx={13} ry={36} transform="rotate(8 121 34)" />
        </>
      );
      back = <Circle cx={144} cy={184} r={13} fill={shade(c0, 0.6)} />;
      main = (
        <>
          <Ellipse cx={79} cy={34} rx={13} ry={36} fill={c0} transform="rotate(-8 79 34)" />
          <Ellipse cx={121} cy={34} rx={13} ry={36} fill={c0} transform="rotate(8 121 34)" />
          <Ellipse cx={100} cy={170} rx={44} ry={38} fill={c0} />
          <Circle cx={100} cy={92} r={44} fill={c0} />
          <G clipPath={clip}>
            <Ellipse cx={121} cy={30} rx={16} ry={40} fill={c1} transform="rotate(8 121 34)" />
            <Ellipse cx={80} cy={86} rx={19} ry={16} fill={c1} />
            <Ellipse cx={128} cy={176} rx={22} ry={19} fill={c1} />
          </G>
          <Ellipse cx={79} cy={38} rx={6} ry={25} fill={PINK} opacity={0.8} transform="rotate(-8 79 34)" />
          <Ellipse cx={121} cy={38} rx={6} ry={25} fill={PINK} opacity={0.8} transform="rotate(8 121 34)" />
          <Ellipse cx={80} cy={204} rx={15} ry={8} fill={c0} />
          <Ellipse cx={120} cy={204} rx={15} ry={8} fill={c0} />
          <Path d="M96 100 L104 100 L100 104 Z" fill="#E88A9A" />
          <Rect x={95.5} y={111} width={4.5} height={7} rx={1} fill="#fff" stroke="#ddd" strokeWidth={0.8} />
          <Rect x={100} y={111} width={4.5} height={7} rx={1} fill="#fff" stroke="#ddd" strokeWidth={0.8} />
          <Whiskers y={104} />
        </>
      );
      break;
    }
    case 'hamster': {
      clipShapes = <Ellipse cx={100} cy={140} rx={64} ry={66} />;
      main = (
        <>
          <Circle cx={63} cy={80} r={13} fill={c0} />
          <Circle cx={137} cy={80} r={13} fill={c0} />
          <Circle cx={63} cy={80} r={7} fill={PINK} />
          <Circle cx={137} cy={80} r={7} fill={PINK} />
          <Ellipse cx={100} cy={140} rx={64} ry={66} fill={c0} />
          <G clipPath={clip}>
            <Ellipse cx={100} cy={176} rx={44} ry={44} fill={c1} />
            <Ellipse cx={100} cy={128} rx={26} ry={16} fill={c1} />
          </G>
          <Ellipse cx={64} cy={124} rx={19} ry={15} fill={shade(c1, 0.25)} />
          <Ellipse cx={136} cy={124} rx={19} ry={15} fill={shade(c1, 0.25)} />
          <Ellipse cx={82} cy={160} rx={7} ry={5} fill={PINK} />
          <Ellipse cx={118} cy={160} rx={7} ry={5} fill={PINK} />
          <Ellipse cx={78} cy={204} rx={13} ry={6} fill={PINK} />
          <Ellipse cx={122} cy={204} rx={13} ry={6} fill={PINK} />
          <Ellipse cx={100} cy={120} rx={4.5} ry={3.2} fill="#E88A9A" />
          <Whiskers y={122} short />
        </>
      );
      break;
    }
    case 'fox': {
      const dark = '#3A2E2A';
      clipShapes = (
        <>
          <Circle cx={100} cy={86} r={44} />
          <Ellipse cx={100} cy={170} rx={42} ry={36} />
        </>
      );
      back = (
        <>
          <Defs>
            <ClipPath id={`tail${rid}`}>
              <Path d="M132 188 C192 194 198 130 168 110 C160 140 150 160 128 166 Z" />
            </ClipPath>
          </Defs>
          <Path d="M132 188 C192 194 198 130 168 110 C160 140 150 160 128 166 Z" fill={c0} />
          <G clipPath={`url(#tail${rid})`}>
            <Circle cx={172} cy={112} r={20} fill={c1} />
          </G>
        </>
      );
      main = (
        <>
          <Path d="M54 72 L58 18 L94 46 Z" fill={c0} />
          <Path d="M146 72 L142 18 L106 46 Z" fill={c0} />
          <Path d="M58 18 L56 36 L70 30 Z" fill={dark} />
          <Path d="M142 18 L144 36 L130 30 Z" fill={dark} />
          <Path d="M63 60 L63 34 L84 48 Z" fill={c1} />
          <Path d="M137 60 L137 34 L116 48 Z" fill={c1} />
          <Ellipse cx={100} cy={170} rx={42} ry={36} fill={c0} />
          <Circle cx={100} cy={86} r={44} fill={c0} />
          <G clipPath={clip}>
            <Path d="M52 88 Q66 128 100 124 Q134 128 148 88 Q122 106 100 102 Q78 106 52 88 Z" fill={c1} />
            <Ellipse cx={100} cy={160} rx={20} ry={26} fill={c1} />
          </G>
          <Ellipse cx={84} cy={203} rx={11} ry={8} fill={dark} />
          <Ellipse cx={116} cy={203} rx={11} ry={8} fill={dark} />
          <Ellipse cx={100} cy={103} rx={6.5} ry={4.5} fill={INK} />
        </>
      );
      break;
    }
    case 'giraffe': {
      const spots: [number, number, number, number, number][] = [
        [92, 86, 11, 12, 10], [104, 100, 9, 12, -8], [90, 118, 11, 12, 6], [103, 136, 10, 12, -4], [92, 152, 9, 9, 8],
        [66, 166, 14, 12, 8], [86, 160, 14, 13, -6], [109, 162, 13, 12, 4], [127, 168, 12, 12, -10], [77, 182, 13, 10, 0],
        [99, 180, 14, 11, 6], [120, 184, 12, 10, -4], [80, 46, 9, 8, 0], [112, 44, 9, 8, 0],
      ];
      clipShapes = (
        <>
          <Ellipse cx={100} cy={178} rx={44} ry={26} />
          <Path d="M86 168 L89 70 L111 70 L114 168 Z" />
          <Ellipse cx={100} cy={60} rx={30} ry={26} />
        </>
      );
      back = (
        <>
          <Line x1={142} y1={176} x2={156} y2={198} stroke={c0} strokeWidth={4} />
          <Circle cx={156} cy={200} r={5} fill={c1} />
          <Rect x={72} y={180} width={12} height={30} rx={5} fill={c0} />
          <Rect x={116} y={180} width={12} height={30} rx={5} fill={c0} />
          <Rect x={72} y={204} width={12} height={8} rx={3} fill="#3B2A20" />
          <Rect x={116} y={204} width={12} height={8} rx={3} fill="#3B2A20" />
        </>
      );
      main = (
        <>
          <Ellipse cx={100} cy={178} rx={44} ry={26} fill={c0} />
          <Path d="M86 168 L89 70 L111 70 L114 168 Z" fill={c0} />
          <Rect x={84} y={20} width={5} height={20} rx={2} fill={c0} />
          <Rect x={111} y={20} width={5} height={20} rx={2} fill={c0} />
          <Circle cx={86.5} cy={20} r={5} fill={c1} />
          <Circle cx={113.5} cy={20} r={5} fill={c1} />
          <Ellipse cx={66} cy={48} rx={13} ry={6} fill={c0} transform="rotate(-20 66 48)" />
          <Ellipse cx={134} cy={48} rx={13} ry={6} fill={c0} transform="rotate(20 134 48)" />
          <Ellipse cx={100} cy={60} rx={30} ry={26} fill={c0} />
          <G clipPath={clip}>
            {spots.map(([x, y, w, h, r], i) => (
              <Rect key={i} x={x - w / 2} y={y - h / 2} width={w} height={h} rx={3.5} fill={c1} transform={`rotate(${r} ${x} ${y})`} />
            ))}
          </G>
          <Ellipse cx={100} cy={76} rx={22} ry={13} fill={shade(c0, 0.3)} />
          <Ellipse cx={93} cy={75} rx={2} ry={1.5} fill={INK} />
          <Ellipse cx={107} cy={75} rx={2} ry={1.5} fill={INK} />
        </>
      );
      break;
    }
    case 'cow': {
      clipShapes = (
        <>
          <Ellipse cx={100} cy={84} rx={44} ry={40} />
          <Ellipse cx={100} cy={170} rx={46} ry={36} />
        </>
      );
      back = (
        <>
          <Path d="M142 168 Q166 170 162 194" stroke={c0} strokeWidth={5} fill="none" />
          <Ellipse cx={162} cy={198} rx={5} ry={7} fill={shade(c1, -0.1)} />
        </>
      );
      main = (
        <>
          <Path d="M66 54 Q52 38 62 26 Q64 42 76 48 Z" fill="#F3E8CF" />
          <Path d="M134 54 Q148 38 138 26 Q136 42 124 48 Z" fill="#F3E8CF" />
          <Ellipse cx={52} cy={74} rx={17} ry={8} fill={c0} transform="rotate(-20 52 74)" />
          <Ellipse cx={148} cy={74} rx={17} ry={8} fill={c0} transform="rotate(20 148 74)" />
          <Ellipse cx={53} cy={74} rx={9} ry={4} fill={PINK} transform="rotate(-20 53 74)" />
          <Ellipse cx={147} cy={74} rx={9} ry={4} fill={PINK} transform="rotate(20 147 74)" />
          <Ellipse cx={100} cy={170} rx={46} ry={36} fill={c0} />
          <Ellipse cx={100} cy={84} rx={44} ry={40} fill={c0} />
          <G clipPath={clip}>
            <Ellipse cx={70} cy={68} rx={22} ry={18} fill={c1} />
            <Ellipse cx={122} cy={50} rx={14} ry={10} fill={c1} />
            <Ellipse cx={134} cy={172} rx={24} ry={18} fill={c1} />
            <Ellipse cx={74} cy={176} rx={16} ry={20} fill={c1} />
          </G>
          <Ellipse cx={100} cy={110} rx={28} ry={17} fill="#F2B8B5" />
          <Ellipse cx={90} cy={110} rx={4} ry={3} fill="#B5726F" />
          <Ellipse cx={110} cy={110} rx={4} ry={3} fill="#B5726F" />
          <Ellipse cx={82} cy={204} rx={13} ry={7} fill={shade(c0, -0.35)} />
          <Ellipse cx={118} cy={204} rx={13} ry={7} fill={shade(c0, -0.35)} />
        </>
      );
      break;
    }
    case 'penguin': {
      main = (
        <>
          <Ellipse cx={84} cy={206} rx={14} ry={6} fill="#F39C38" />
          <Ellipse cx={116} cy={206} rx={14} ry={6} fill="#F39C38" />
          <Ellipse cx={48} cy={142} rx={11} ry={30} fill={c0} transform="rotate(20 48 142)" />
          <Ellipse cx={152} cy={142} rx={11} ry={30} fill={c0} transform="rotate(-20 152 142)" />
          <Ellipse cx={100} cy={138} rx={56} ry={70} fill={c0} />
          <Ellipse cx={100} cy={158} rx={40} ry={48} fill={c1} />
          <Ellipse cx={87} cy={98} rx={18} ry={19} fill={c1} />
          <Ellipse cx={113} cy={98} rx={18} ry={19} fill={c1} />
          <Path d="M91 106 L109 106 L100 117 Z" fill="#F39C38" />
        </>
      );
      clipShapes = <Ellipse cx={100} cy={138} rx={56} ry={70} />;
      break;
    }
    case 'budgie': {
      const waves = (ox: number) => (
        <Path
          d={`M${ox - 12} 132 q6 5 12 0 q6 5 12 0 M${ox - 12} 142 q6 5 12 0 q6 5 12 0 M${ox - 12} 152 q6 5 12 0 q6 5 12 0 M${ox - 10} 162 q5 5 10 0 q5 5 10 0`}
          stroke={c2}
          strokeWidth={2.5}
          fill="none"
        />
      );
      clipShapes = <Circle cx={100} cy={84} r={36} />;
      back = (
        <>
          <Path d="M90 186 L96 218 L104 218 L110 186 Z" fill={shade(c0, -0.25)} />
          <Path d="M86 198 L82 204 M92 198 L92 206 M114 198 L118 204 M108 198 L108 206" stroke="#9AA0A6" strokeWidth={3} strokeLinecap="round" />
        </>
      );
      main = (
        <>
          <Ellipse cx={100} cy={150} rx={42} ry={50} fill={c0} />
          <Ellipse cx={66} cy={150} rx={17} ry={34} fill={c1} transform="rotate(12 66 150)" />
          <Ellipse cx={134} cy={150} rx={17} ry={34} fill={c1} transform="rotate(-12 134 150)" />
          {waves(66)}
          {waves(134)}
          <Circle cx={100} cy={84} r={36} fill={c1} />
          <G clipPath={clip}>
            <Path d="M70 58 q5 -4 10 0 M84 52 q5 -4 10 0 M106 52 q5 -4 10 0 M120 58 q5 -4 10 0" stroke={c2} strokeWidth={2} fill="none" />
          </G>
          <Ellipse cx={70} cy={98} rx={5.5} ry={7} fill="#7B68C8" />
          <Ellipse cx={130} cy={98} rx={5.5} ry={7} fill="#7B68C8" />
          <Circle cx={86} cy={112} r={3.2} fill={c2} />
          <Circle cx={100} cy={115} r={3.2} fill={c2} />
          <Circle cx={114} cy={112} r={3.2} fill={c2} />
          <Ellipse cx={100} cy={90} rx={7} ry={4} fill="#7FA7D9" />
          <Path d="M93 93 Q100 110 107 93 Z" fill="#E8C98E" stroke="#C9A66B" strokeWidth={1} />
        </>
      );
      break;
    }
  }

  const fur = (
    <>
      <FurBase species={species} colors={[c0, c1, c2]} />
      <FurBack species={species} colors={[c0, c1, c2]} mess={mess} />
    </>
  );
  return (
    <Svg width={size} height={size * 1.1} viewBox="0 0 200 220">
      <Defs>
        <ClipPath id={`body${rid}`}>{clipShapes}</ClipPath>
      </Defs>
      <Ellipse cx={100} cy={212} rx={60} ry={7} fill="#000" opacity={0.08} />
      {/* Kontur: alles einmal dick in dunkel, darüber normal – bleibt nur außen sichtbar */}
      <G stroke={OUTLINE} strokeWidth={6} strokeLinejoin="round" strokeLinecap="round">
        {fur}
        {back}
        {main}
      </G>
      {fur}
      {back}
      {main}
      <FurShade species={species} colors={[c0, c1, c2]} clip={clip} rid={rid} />
      <Paws species={species} colors={[c0, c1, c2]} />
      <FurFront species={species} colors={[c0, c1, c2]} mess={mess} />
      {dirt > 0.05 && <Dirt amount={dirt} species={species} />}
      <Face anchor={a.face} expression={expression} iris={IRIS[species]} />
      {front && (
        <>
          <G stroke={OUTLINE} strokeWidth={5} strokeLinejoin="round">
            {front}
          </G>
          {front}
        </>
      )}
      {neck && <NeckWear item={neck} at={a.neck} />}
      {head && <HeadWear item={head} at={a.top} />}
    </Svg>
  );
}

function Whiskers({ y, short }: { y: number; short?: boolean }) {
  const l = short ? 16 : 26;
  return (
    <G stroke={INK} strokeOpacity={0.35} strokeWidth={1.4} strokeLinecap="round">
      <Line x1={78} y1={y} x2={78 - l} y2={y - 4} />
      <Line x1={78} y1={y + 4} x2={78 - l} y2={y + 6} />
      <Line x1={122} y1={y} x2={122 + l} y2={y - 4} />
      <Line x1={122} y1={y + 4} x2={122 + l} y2={y + 6} />
    </G>
  );
}

function Dirt({ amount, species }: { amount: number; species: SpeciesId }) {
  const spots: [number, number, number][] =
    species === 'giraffe'
      ? [[96, 120, 6], [76, 174, 7], [118, 176, 6], [104, 50, 5]]
      : [[70, 70, 7], [130, 100, 6], [80, 160, 8], [124, 176, 7], [100, 190, 5], [112, 60, 5]];
  const n = Math.max(1, Math.round(spots.length * Math.min(1, amount)));
  return (
    <G opacity={0.55 + amount * 0.3}>
      {spots.slice(0, n).map(([x, y, r], i) => (
        <G key={i}>
          <Circle cx={x} cy={y} r={r} fill="#7A5A3A" />
          <Circle cx={x + r * 0.8} cy={y + r * 0.4} r={r * 0.55} fill="#7A5A3A" />
        </G>
      ))}
    </G>
  );
}

function Face({ anchor, expression, iris }: { anchor: Anchor['face']; expression: Expression; iris: string }) {
  const { x, y, dx, mouthY, k, beak } = anchor;
  const lx = x - dx;
  const rx = x + dx;
  const sw = 3 * k;
  const eyes = (() => {
    switch (expression) {
      case 'eating':
      case 'love':
        return (
          <G stroke={INK} strokeWidth={sw} strokeLinecap="round" fill="none">
            <Path d={`M${lx - 6 * k} ${y + 2 * k} Q${lx} ${y - 7 * k} ${lx + 6 * k} ${y + 2 * k}`} />
            <Path d={`M${rx - 6 * k} ${y + 2 * k} Q${rx} ${y - 7 * k} ${rx + 6 * k} ${y + 2 * k}`} />
          </G>
        );
      case 'tired':
        return (
          <G stroke={INK} strokeWidth={sw} strokeLinecap="round" fill="none">
            <Path d={`M${lx - 6 * k} ${y} Q${lx} ${y + 4 * k} ${lx + 6 * k} ${y}`} />
            <Path d={`M${rx - 6 * k} ${y} Q${rx} ${y + 4 * k} ${rx + 6 * k} ${y}`} />
          </G>
        );
      default:
        return (
          <G>
            {[lx, rx].map((ex) => (
              <G key={ex}>
                {/* große, glänzende Kulleraugen */}
                <Ellipse cx={ex} cy={y} rx={9 * k} ry={10.8 * k} fill={INK} />
                <Ellipse cx={ex} cy={y + 2.6 * k} rx={6.9 * k} ry={7.8 * k} fill={iris} />
                <Ellipse cx={ex} cy={y + 3.1 * k} rx={3.7 * k} ry={4.6 * k} fill="#141017" />
                <Circle cx={ex - 3.3 * k} cy={y - 4.3 * k} r={3.4 * k} fill="#fff" />
                <Circle cx={ex + 3.2 * k} cy={y + 4.8 * k} r={1.7 * k} fill="#fff" opacity={0.85} />
                <Path
                  d={`M${ex - 10 * k} ${y - 4.5 * k} Q${ex} ${y - 15 * k} ${ex + 10 * k} ${y - 5 * k}`}
                  stroke={INK}
                  strokeWidth={2.8 * k}
                  fill="none"
                  strokeLinecap="round"
                />
              </G>
            ))}
            {expression === 'sad' && (
              <G>
                <Path
                  d={`M${lx - 7 * k} ${y - 10 * k} L${lx + 5 * k} ${y - 13 * k} M${rx + 7 * k} ${y - 10 * k} L${rx - 5 * k} ${y - 13 * k}`}
                  stroke={INK}
                  strokeWidth={2.2 * k}
                  strokeLinecap="round"
                />
                <Path d={`M${rx + 3 * k} ${y + 8 * k} q3 6 0 8 q-3 -2 0 -8 Z`} fill="#74B9FF" />
              </G>
            )}
          </G>
        );
    }
  })();

  let mouth: React.ReactNode = null;
  if (!beak) {
    const m = mouthY;
    if (expression === 'eating') {
      mouth = (
        <G>
          <Ellipse cx={x} cy={m + 3 * k} rx={7 * k} ry={6 * k} fill="#8E3B46" />
          <Ellipse cx={x} cy={m + 6 * k} rx={4 * k} ry={2.5 * k} fill="#F28B9B" />
        </G>
      );
    } else if (expression === 'tired') {
      mouth = <Ellipse cx={x} cy={m + 3 * k} rx={3.5 * k} ry={4 * k} fill="#8E3B46" />;
    } else if (expression === 'sad') {
      mouth = <Path d={`M${x - 7 * k} ${m + 6 * k} Q${x} ${m - 1 * k} ${x + 7 * k} ${m + 6 * k}`} stroke={INK} strokeWidth={sw * 0.8} fill="none" strokeLinecap="round" />;
    } else if (expression === 'happy' || expression === 'love') {
      mouth = (
        <Path
          d={`M${x - 8 * k} ${m} Q${x - 4 * k} ${m + 7 * k} ${x} ${m + 1 * k} Q${x + 4 * k} ${m + 7 * k} ${x + 8 * k} ${m}`}
          stroke={INK}
          strokeWidth={sw * 0.8}
          fill="none"
          strokeLinecap="round"
        />
      );
    } else {
      mouth = (
        <Path
          d={`M${x - 6 * k} ${m + 1 * k} Q${x - 3 * k} ${m + 4 * k} ${x} ${m + 1 * k} Q${x + 3 * k} ${m + 4 * k} ${x + 6 * k} ${m + 1 * k}`}
          stroke={INK}
          strokeWidth={sw * 0.7}
          fill="none"
          strokeLinecap="round"
        />
      );
    }
  }

  const blush = expression === 'happy' || expression === 'love' || expression === 'eating';
  return (
    <G>
      {eyes}
      {blush && (
        <G opacity={expression === 'love' ? 0.7 : 0.45}>
          <Ellipse cx={lx - 6 * k} cy={y + 12 * k} rx={7 * k} ry={4 * k} fill="#FF7FA0" />
          <Ellipse cx={rx + 6 * k} cy={y + 12 * k} rx={7 * k} ry={4 * k} fill="#FF7FA0" />
        </G>
      )}
      {mouth}
    </G>
  );
}

function HeadWear({ item, at }: { item: WornClothing; at: Anchor['top'] }) {
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

function NeckWear({ item, at }: { item: WornClothing; at: Anchor['neck'] }) {
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
