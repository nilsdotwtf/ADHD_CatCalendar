import React, { useId } from 'react';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Path, Rect } from 'react-native-svg';
import { SpeciesId } from '../data/animals';
import { HeadWear, NeckWear, WornClothing } from './Clothing';
import { isDark, shade } from './color';

/*
 * Anime-/Chibi-Tiere im Stil der Vorlage: Halbprofil, großer Kopf mit Wangenfell,
 * sitzender Körper mit Brustfell, dicke dunkle Kontur und harte Cel-Schatten.
 *
 * Alle Pfade sind in "Vorlagen-Koordinaten" (ca. 750×1000 px) gezeichnet und werden
 * per Transform in die 200×220-Ansicht skaliert. So lassen sich die Formen direkt
 * nach dem Referenzbild ausrichten.
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

const INK = '#2B2330';
const OUTLINE = '#2E2430';
const PINK = '#F2A5B4';
const NOSE_PINK = '#EE93A6';
const WHITE_FUR = '#FBF8F2';
const OUTLINE_W = 15;
const TO_VIEW = 'translate(-15 -31) scale(0.3)';

type El = [number, number, number, number];

/** Nasen sind schwarz – außer das Fell drumherum ist dunkel, dann rosa */
function noseColor(around: string, pink = NOSE_PINK) {
  return isDark(around) ? pink : '#2B2330';
}

function cel(c: string) {
  const dark = isDark(c);
  return {
    sh: shade(c, dark ? 0.12 : -0.1), // Schattenfläche
    sh2: shade(c, dark ? 0.25 : -0.3), // Fellstriche
    hl: shade(c, dark ? 0.3 : 0.5), // Glanz
  };
}

const rad = (d: number) => (d * Math.PI) / 180;

/** Spitze Fellbüschel entlang einer Ellipse (für zerzaustes Fell) */
function tuftPath([cx, cy, rx, ry]: El, a0: number, a1: number, n: number, len: number, seed = 0): string {
  let d = '';
  const step = (a1 - a0) / n;
  const f = (v: number) => v.toFixed(0);
  for (let i = 0; i < n; i++) {
    const j = Math.sin((i + 1) * 12.9898 + seed * 78.233) * 0.5 + 0.5;
    const a = a0 + step * (i + 0.5);
    const w = step * 0.5;
    const l = len * (0.7 + j * 0.6);
    const curl = (j - 0.5) * 18;
    const p = (ang: number, extra: number) => [cx + Math.cos(rad(ang)) * (rx * 0.93 + extra), cy + Math.sin(rad(ang)) * (ry * 0.93 + extra)];
    const [x1, y1] = p(a - w, 0);
    const [x2, y2] = p(a + w, 0);
    const [tx, ty] = p(a + curl, l);
    d += `M${f(x1)} ${f(y1)} L${f(tx)} ${f(ty)} L${f(x2)} ${f(y2)} Z `;
  }
  return d;
}

// ---------------------------------------------------------------- Grundformen (Vierbeiner, nach der Vorlage)

const HEAD =
  'M140 342 C165 290 232 262 300 262 C362 262 400 272 424 292 C470 330 510 380 518 428 L536 442 L514 452 L530 472 L506 476 L518 498 L494 496 ' +
  'C478 540 438 566 378 574 C300 584 228 576 182 556 L164 566 L172 546 L146 552 L158 532 L126 534 L140 518 L106 514 L124 498 L94 494 C100 440 116 386 140 342 Z';
const BODY =
  'M200 552 C176 580 168 612 177 642 C184 672 204 700 228 716 C238 736 236 760 248 776 C262 792 312 792 326 774 C332 792 352 806 386 804 ' +
  'C420 804 436 792 433 772 C470 780 538 786 562 772 C580 758 576 738 566 726 C600 702 612 642 600 590 C590 546 562 520 528 504 Z';
const CHEST_TUFTS = 'M186 592 L156 602 L182 616 Z M178 626 L150 642 L180 650 Z M186 662 L162 686 L194 684 Z M212 694 L196 720 L226 710 Z';
const HEAD_EL: El = [305, 420, 210, 158];
const BODY_EL: El = [395, 660, 205, 140];

interface EyeSpec {
  x: number;
  y: number;
  rx: number;
  ry: number;
  out: 1 | -1; // Außenseite (für den Lidschwung)
}

const EYES: EyeSpec[] = [
  { x: 172, y: 470, rx: 30, ry: 37, out: -1 },
  { x: 345, y: 478, rx: 40, ry: 42, out: 1 },
];

interface FaceSpec {
  eyes: EyeSpec[];
  mouth?: [number, number];
  blush: [number, number][];
}

interface Piece {
  shape: React.ReactNode; // Silhouette – wird umrandet und als Maske genutzt (nur einfache Formen)
  detail?: React.ReactNode; // auf die Silhouette zugeschnitten
  over?: React.ReactNode; // darüber, nicht zugeschnitten
}

interface Spot {
  x: number;
  y: number;
  w: number;
}

interface Art {
  pieces: Piece[];
  face: FaceSpec;
  iris: string;
  faceBg: string;
  top: Spot;
  neck: Spot;
  head: El;
  body?: El;
  headDy?: number; // Giraffe: Kopf sitzt höher
}

const whiskers = (light: boolean) => (
  <Path
    d="M128 466 L70 446 M128 482 L66 494 M402 490 L486 468 M402 512 L480 520"
    stroke={light ? '#F4ECF1' : INK}
    strokeWidth={3.2}
    strokeOpacity={light ? 0.75 : 0.65}
    strokeLinecap="round"
  />
);

const smallNose = (c: string) => <Path d="M230 494 L250 494 Q250 500 240 508 Q230 500 230 494 Z" fill={c} />;

function headCel(c: string) {
  const { sh, hl } = cel(c);
  return (
    <>
      <Path d="M478 330 C530 390 540 470 500 520 C470 560 420 576 380 580 L560 600 L580 300 Z" fill={sh} />
      <Ellipse cx={182} cy={330} rx={14} ry={8} fill={hl} transform="rotate(-32 182 330)" />
      <Ellipse cx={196} cy={402} rx={11} ry={8} fill={hl} />
      <Ellipse cx={312} cy={412} rx={15} ry={10} fill={hl} />
      <Circle cx={148} cy={506} r={4.5} fill={hl} />
      <Circle cx={352} cy={530} r={4.5} fill={hl} />
      <Circle cx={364} cy={522} r={3} fill={hl} />
    </>
  );
}

function bodyCel(c: string) {
  const { sh, sh2, hl } = cel(c);
  return (
    <>
      {/* Schatten unter dem Kopf, am Hinterbein und am Bauch */}
      <Path d="M170 556 C250 606 430 608 548 556 L548 480 L170 480 Z" fill={sh} />
      <Path d="M450 776 C455 716 506 680 604 668 L640 668 L640 830 L450 830 Z" fill={sh} />
      <Path d="M228 716 C280 742 300 748 330 748 L330 830 L220 830 Z" fill={sh} />
      {/* Brustfell */}
      <Path d="M204 610 L216 634 L226 616" stroke={sh2} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.6} />
      <Ellipse cx={540} cy={612} rx={12} ry={7} fill={hl} transform="rotate(-50 540 612)" />
    </>
  );
}

function legLines(pawColor: string) {
  const line = isDark(pawColor) ? shade(pawColor, 0.4) : shade(pawColor, -0.45);
  return (
    <>
      <Path d="M326 774 C330 744 336 722 344 704" stroke={OUTLINE} strokeWidth={6} fill="none" strokeLinecap="round" />
      <Path d="M433 772 C440 734 466 706 504 690" stroke={OUTLINE} strokeWidth={6} fill="none" strokeLinecap="round" />
      <Path d="M282 772 l3 14 M305 774 l2 14 M374 790 l1 13 M398 790 l1 13 M518 770 l2 12 M540 770 l1 12" stroke={line} strokeWidth={4} strokeLinecap="round" />
    </>
  );
}

/** Pfoten in anderer Farbe (weiße Söckchen, dunkle Fuchsbeine, Hufe …) */
const pawPatch = (c: string) => (
  <>
    <Path d="M236 740 C240 760 244 772 250 778 C266 794 312 792 326 774 C330 760 332 748 330 736 C300 744 262 742 236 740 Z" fill={c} />
    <Path d="M336 752 C336 790 352 806 386 804 C420 804 436 792 433 772 C434 760 434 752 432 744 C400 756 366 758 336 752 Z" fill={c} />
    <Path d="M452 760 C470 780 538 786 562 772 C580 758 576 738 566 726 C530 740 490 752 452 760 Z" fill={c} />
  </>
);

const messHead = (mess: number, fill: string) =>
  mess > 0.12 ? <Path d={tuftPath(HEAD_EL, 205, 335, Math.round(5 + mess * 5), 26 + mess * 30, 7)} fill={fill} /> : null;
const messBody = (mess: number, fill: string) =>
  mess > 0.12 ? (
    <>
      <Path d={tuftPath(BODY_EL, -40, 20, Math.round(2 + mess * 3), 20 + mess * 24, 3)} fill={fill} />
      <Path d={tuftPath(BODY_EL, 150, 200, Math.round(2 + mess * 2), 20 + mess * 22, 5)} fill={fill} />
    </>
  ) : null;

const CAT_TAIL = 'M562 708 C592 690 612 640 602 566 C596 506 600 452 626 436 C656 420 692 452 690 524 C688 604 662 682 602 724 Z';
const EAR_L = 'M136 350 L148 188 C158 180 178 196 250 268 Z';
const EAR_R = 'M338 294 C410 252 478 226 518 214 C530 234 528 330 506 414 Z';
const EAR_R_PINK = 'M462 262 C490 244 506 238 510 246 C510 300 504 352 492 396 C484 344 474 302 456 276 Z';

const QUAD_TOP: Spot = { x: 300, y: 270, w: 250 };
const QUAD_NECK: Spot = { x: 330, y: 582, w: 200 };
const QUAD_FACE: FaceSpec = { eyes: EYES, mouth: [240, 520], blush: [[150, 520], [382, 532]] };

interface QuadOpts {
  c0: string;
  mess: number;
  ears?: React.ReactNode; // Silhouette der Ohren (hinter dem Kopf)
  earsOver?: React.ReactNode;
  tail?: Piece;
  headDetail?: React.ReactNode;
  headOver?: React.ReactNode;
  bodyDetail?: React.ReactNode;
  front?: Piece; // z.B. Schlappohren
  pawColor?: string;
  skipHead?: boolean;
}

function quadruped(o: QuadOpts): Piece[] {
  const pieces: Piece[] = [];
  if (o.tail) pieces.push(o.tail);
  pieces.push({
    shape: (
      <>
        <Path d={CHEST_TUFTS} fill={o.c0} />
        {messBody(o.mess, o.c0)}
        <Path d={BODY} fill={o.c0} />
      </>
    ),
    detail: (
      <>
        {o.bodyDetail}
        {o.pawColor && pawPatch(o.pawColor)}
        {bodyCel(o.c0)}
      </>
    ),
    over: legLines(o.pawColor ?? o.c0),
  });
  if (!o.skipHead) {
    pieces.push({
      shape: (
        <>
          {o.ears}
          {messHead(o.mess, o.c0)}
          <Path d={HEAD} fill={o.c0} />
        </>
      ),
      detail: (
        <>
          {o.headDetail}
          {headCel(o.c0)}
        </>
      ),
      over: (
        <>
          {o.earsOver}
          {o.headOver}
        </>
      ),
    });
  }
  if (o.front) pieces.push(o.front);
  return pieces;
}

function buildArt(species: SpeciesId, c0: string, c1: string, c2: string, mess: number): Art {
  const base = { face: QUAD_FACE, top: QUAD_TOP, neck: QUAD_NECK, head: HEAD_EL, body: BODY_EL };
  switch (species) {
    case 'cat': {
      const { sh, sh2 } = cel(c0);
      return {
        ...base,
        iris: '#3E7A5A',
        faceBg: c0,
        pieces: quadruped({
          c0,
          mess,
          ears: (
            <>
              <Path d={EAR_L} fill={c0} />
              <Path d={EAR_R} fill={c0} />
            </>
          ),
          earsOver: (
            <>
              <Path d={EAR_R_PINK} fill={PINK} />
              <Path d="M470 382 L452 344 M484 374 L472 334" stroke={WHITE_FUR} strokeWidth={4} strokeLinecap="round" opacity={0.8} />
            </>
          ),
          tail: {
            shape: <Path d={CAT_TAIL} fill={c0} />,
            detail: (
              <>
                <Path d="M594 540 C626 554 664 554 696 536 M590 614 C622 630 660 628 692 606" stroke={sh2} strokeWidth={22} fill="none" />
                <Path d="M640 420 C680 440 700 480 696 520 L720 520 L720 400 Z" fill={sh} />
              </>
            ),
          },
          headDetail: (
            <>
              <Ellipse cx={205} cy={330} rx={120} ry={85} fill={c1} transform="rotate(-15 205 330)" />
              <Ellipse cx={448} cy={352} rx={86} ry={70} fill={c2} />
            </>
          ),
          bodyDetail: (
            <>
              <Ellipse cx={490} cy={650} rx={95} ry={72} fill={c1} />
              <Ellipse cx={262} cy={712} rx={62} ry={46} fill={c2} />
            </>
          ),
          headOver: (
            <>
              {smallNose(noseColor(c0))}
              {whiskers(isDark(c0))}
            </>
          ),
        }),
      };
    }
    case 'tiger': {
      return {
        ...base,
        iris: '#C08A2C',
        faceBg: WHITE_FUR,
        pieces: quadruped({
          c0,
          mess,
          ears: (
            <>
              <Circle cx={184} cy={286} r={58} fill={c0} />
              <Circle cx={462} cy={296} r={62} fill={c0} />
            </>
          ),
          earsOver: (
            <>
              <Circle cx={186} cy={290} r={28} fill={WHITE_FUR} />
              <Circle cx={462} cy={300} r={30} fill={WHITE_FUR} />
            </>
          ),
          tail: {
            shape: <Path d={CAT_TAIL} fill={c0} />,
            detail: <Path d="M596 520 C626 532 664 532 696 516 M590 590 C622 604 660 602 692 584 M594 660 C620 668 650 664 676 650" stroke={c1} strokeWidth={16} fill="none" />,
          },
          headDetail: (
            <>
              <Ellipse cx={252} cy={530} rx={96} ry={54} fill={WHITE_FUR} />
              <Ellipse cx={170} cy={415} rx={26} ry={12} fill={WHITE_FUR} />
              <Ellipse cx={330} cy={418} rx={30} ry={13} fill={WHITE_FUR} />
              <Path d="M296 268 L282 330 L312 330 Z" fill={c1} />
              <Path d="M246 284 L258 336 M352 284 L338 336 M104 420 L162 438 M100 462 L154 468 M522 430 L464 450 M516 474 L462 482" stroke={c1} strokeWidth={14} strokeLinecap="round" />
            </>
          ),
          bodyDetail: (
            <>
              <Ellipse cx={300} cy={720} rx={110} ry={70} fill={WHITE_FUR} />
              <Path d="M196 600 Q238 630 214 680 M560 590 Q510 620 528 680 M470 560 Q490 600 470 630 M600 680 Q560 700 572 740" stroke={c1} strokeWidth={16} fill="none" strokeLinecap="round" />
            </>
          ),
          headOver: (
            <>
              {smallNose(noseColor(WHITE_FUR))}
              {whiskers(false)}
            </>
          ),
        }),
      };
    }
    case 'dog': {
      const ear = shade(c0, isDark(c0) ? 0.15 : -0.22);
      const muzzle = shade(c1, 0.12);
      return {
        ...base,
        iris: '#5C3A22',
        faceBg: muzzle,
        pieces: quadruped({
          c0,
          mess,
          pawColor: c1,
          tail: { shape: <Path d="M556 640 C600 620 642 578 642 518 C642 492 614 488 608 512 C602 560 584 590 546 610 Z" fill={c0} /> },
          headDetail: (
            <>
              <Ellipse cx={352} cy={462} rx={84} ry={72} fill={c1} />
              <Ellipse cx={246} cy={522} rx={80} ry={54} fill={muzzle} />
            </>
          ),
          bodyDetail: <Ellipse cx={290} cy={680} rx={100} ry={90} fill={c1} />,
          headOver: (
            <>
              <Ellipse cx={244} cy={496} rx={22} ry={15} fill={noseColor(muzzle)} />
              <Ellipse cx={238} cy={491} rx={7} ry={4} fill="#ffffff" opacity={0.5} />
            </>
          ),
          front: {
            // Schlappohren
            shape: (
              <>
                <Path d="M156 320 C108 352 92 440 118 506 C140 530 176 508 182 474 C192 420 196 366 186 326 Z" fill={ear} />
                <Path d="M424 292 C486 312 534 380 530 456 C528 498 500 508 484 486 C468 444 456 380 418 320 Z" fill={ear} />
              </>
            ),
            detail: <Path d="M140 360 C126 400 124 440 132 480" stroke={shade(ear, 0.25)} strokeWidth={10} fill="none" strokeLinecap="round" />,
          },
        }),
      };
    }
    case 'rabbit': {
      return {
        ...base,
        top: { x: 290, y: 280, w: 220 },
        iris: '#5A3A2E',
        faceBg: c0,
        pieces: quadruped({
          c0,
          mess,
          ears: (
            <>
              <Ellipse cx={210} cy={222} rx={38} ry={98} fill={c0} transform="rotate(-14 210 222)" />
              <Ellipse cx={334} cy={214} rx={40} ry={98} fill={c0} transform="rotate(14 334 214)" />
            </>
          ),
          earsOver: (
            <>
              <Ellipse cx={212} cy={232} rx={17} ry={72} fill={PINK} transform="rotate(-14 212 232)" />
              <Ellipse cx={334} cy={224} rx={18} ry={72} fill={PINK} transform="rotate(14 334 224)" />
            </>
          ),
          tail: { shape: <Circle cx={598} cy={700} r={54} fill={shade(c0, 0.55)} /> },
          headDetail: (
            <>
              <Ellipse cx={340} cy={210} rx={50} ry={110} fill={c1} transform="rotate(14 334 214)" />
              <Ellipse cx={170} cy={468} rx={62} ry={54} fill={c1} />
            </>
          ),
          bodyDetail: <Ellipse cx={500} cy={660} rx={86} ry={72} fill={c1} />,
          headOver: (
            <>
              {smallNose(noseColor(c0))}
              <Rect x={228} y={528} width={13} height={20} rx={3} fill="#fff" stroke={OUTLINE} strokeWidth={3} />
              <Rect x={241} y={528} width={13} height={20} rx={3} fill="#fff" stroke={OUTLINE} strokeWidth={3} />
              {whiskers(isDark(c0))}
            </>
          ),
        }),
      };
    }
    case 'hamster': {
      return {
        ...base,
        top: { x: 300, y: 278, w: 240 },
        iris: '#2E2328',
        faceBg: c1,
        pieces: quadruped({
          c0,
          mess,
          pawColor: PINK,
          ears: (
            <>
              <Circle cx={196} cy={290} r={44} fill={c0} />
              <Circle cx={418} cy={292} r={48} fill={c0} />
            </>
          ),
          earsOver: (
            <>
              <Circle cx={198} cy={294} r={22} fill={PINK} />
              <Circle cx={418} cy={296} r={24} fill={PINK} />
            </>
          ),
          headDetail: (
            <>
              <Ellipse cx={150} cy={508} rx={78} ry={56} fill={c1} />
              <Ellipse cx={426} cy={520} rx={84} ry={58} fill={c1} />
              <Ellipse cx={250} cy={530} rx={66} ry={40} fill={c1} />
            </>
          ),
          bodyDetail: <Ellipse cx={340} cy={700} rx={150} ry={96} fill={c1} />,
          headOver: (
            <>
              <Ellipse cx={240} cy={500} rx={12} ry={8} fill={noseColor(c1)} />
              {whiskers(isDark(c1))}
            </>
          ),
        }),
      };
    }
    case 'fox': {
      const dark = '#3A2E2A';
      return {
        ...base,
        iris: '#A8682A',
        faceBg: c1,
        pieces: quadruped({
          c0,
          mess,
          pawColor: dark,
          ears: (
            <>
              <Path d="M130 356 L134 156 C150 146 174 166 258 268 Z" fill={c0} />
              <Path d="M334 292 C410 240 488 198 534 182 C546 208 534 332 506 416 Z" fill={c0} />
            </>
          ),
          earsOver: <Path d="M456 262 C492 236 516 226 522 232 C524 296 512 352 496 398 C486 344 474 300 450 274 Z" fill={c1} />,
          tail: {
            shape: <Path d="M546 724 C622 734 704 684 708 560 C711 480 684 428 640 418 C600 438 612 520 602 580 C592 640 572 680 540 692 Z" fill={c0} />,
            detail: <Ellipse cx={652} cy={436} rx={68} ry={50} fill={c1} />,
          },
          headDetail: (
            <>
              <Path d="M134 156 L132 226 L184 206 Z M534 182 L500 204 L528 250 Z" fill={dark} />
              <Path d="M92 494 C150 610 390 612 506 486 C424 530 320 542 240 532 C170 522 118 504 92 494 Z" fill={c1} />
            </>
          ),
          bodyDetail: <Ellipse cx={262} cy={650} rx={78} ry={96} fill={c1} />,
          headOver: smallNose(noseColor(c1)),
        }),
      };
    }
    case 'cow': {
      const muzzle = noseColor(c0, '#F2B8B5');
      const nostril = isDark(c0) ? '#B5726F' : '#6E6268';
      return {
        ...base,
        face: { eyes: EYES, mouth: [252, 566], blush: [[146, 516], [384, 528]] },
        iris: '#3D2C25',
        faceBg: muzzle,
        pieces: quadruped({
          c0,
          mess,
          pawColor: '#5A4A40',
          ears: (
            <>
              <Path d="M214 282 C186 242 192 204 214 188 C222 220 236 246 260 268 Z" fill="#F3E8CF" />
              <Path d="M372 274 C392 232 412 210 436 204 C432 236 416 262 398 288 Z" fill="#F3E8CF" />
              <Ellipse cx={112} cy={384} rx={60} ry={24} fill={c0} transform="rotate(-24 112 384)" />
              <Ellipse cx={506} cy={392} rx={62} ry={26} fill={c0} transform="rotate(24 506 392)" />
            </>
          ),
          earsOver: (
            <>
              <Ellipse cx={116} cy={384} rx={34} ry={11} fill={PINK} transform="rotate(-24 116 384)" />
              <Ellipse cx={502} cy={392} rx={36} ry={12} fill={PINK} transform="rotate(24 502 392)" />
            </>
          ),
          tail: {
            shape: (
              <>
                <Path d="M586 690 C628 690 642 740 632 790" stroke={c0} strokeWidth={14} fill="none" />
                <Ellipse cx={632} cy={802} rx={18} ry={24} fill={c1} />
              </>
            ),
          },
          headDetail: (
            <>
              <Ellipse cx={190} cy={350} rx={82} ry={66} fill={c1} transform="rotate(-20 190 350)" />
              <Ellipse cx={420} cy={320} rx={52} ry={38} fill={c1} />
            </>
          ),
          bodyDetail: (
            <>
              <Ellipse cx={500} cy={640} rx={80} ry={60} fill={c1} />
              <Ellipse cx={260} cy={700} rx={56} ry={60} fill={c1} />
            </>
          ),
          headOver: (
            <>
              <Ellipse cx={256} cy={534} rx={100} ry={54} fill={muzzle} stroke={OUTLINE} strokeWidth={6} />
              <Ellipse cx={218} cy={528} rx={13} ry={10} fill={nostril} />
              <Ellipse cx={294} cy={528} rx={13} ry={10} fill={nostril} />
            </>
          ),
        }),
      };
    }
    case 'giraffe': {
      const dy = -110;
      const t = `translate(0 ${dy})`;
      const snout = shade(c0, 0.3);
      const spot = ([x, y, w, h, r]: number[], i: number) => (
        <Rect key={i} x={x - w / 2} y={y - h / 2} width={w} height={h} rx={10} fill={c1} transform={`rotate(${r} ${x} ${y})`} />
      );
      const bodySpots = [
        [230, 640, 40, 34, 8], [300, 620, 38, 34, -6], [390, 640, 40, 34, 4], [480, 620, 38, 32, -10],
        [540, 690, 34, 30, 6], [260, 720, 36, 28, 0], [420, 720, 40, 30, 6],
      ];
      const neckSpots = [[330, 500, 34, 30, 10], [372, 470, 28, 32, -8], [318, 450, 30, 26, 6], [380, 540, 30, 28, 4]];
      const pieces = quadruped({
        c0,
        mess,
        pawColor: '#4A3426',
        skipHead: true,
        tail: {
          shape: (
            <>
              <Path d="M580 700 C620 710 640 750 640 790" stroke={c0} strokeWidth={12} fill="none" />
              <Ellipse cx={640} cy={800} rx={16} ry={22} fill={c1} />
            </>
          ),
        },
        bodyDetail: bodySpots.map(spot),
      });
      const neck: Piece = {
        shape: <Path d="M298 604 C306 540 310 480 302 424 L394 424 C392 484 402 548 426 604 Z" fill={c0} />,
        detail: (
          <>
            {neckSpots.map(spot)}
            <Path d="M372 424 C376 500 388 560 410 604 L470 604 L470 424 Z" fill={cel(c0).sh} />
          </>
        ),
      };
      const head: Piece = {
        shape: (
          <>
            <Rect x={226} y={238} width={20} height={44} rx={8} fill={c0} transform={t} />
            <Rect x={336} y={232} width={20} height={44} rx={8} fill={c0} transform={t} />
            <Circle cx={236} cy={238} r={17} fill={c1} transform={t} />
            <Circle cx={346} cy={232} r={17} fill={c1} transform={t} />
            <Ellipse cx={126} cy={360} rx={58} ry={22} fill={c0} transform={`${t} rotate(-22 126 360)`} />
            <Ellipse cx={486} cy={366} rx={60} ry={24} fill={c0} transform={`${t} rotate(22 486 366)`} />
            {mess > 0.12 && <Path d={tuftPath(HEAD_EL, 210, 330, 5, 20 + mess * 20, 7)} fill={c0} transform={t} />}
            <Path d={HEAD} fill={c0} transform={t} />
          </>
        ),
        detail: (
          <G transform={t}>
            <Ellipse cx={200} cy={330} rx={24} ry={20} fill={c1} />
            <Ellipse cx={410} cy={320} rx={22} ry={18} fill={c1} />
            <Ellipse cx={252} cy={526} rx={104} ry={54} fill={snout} />
            {headCel(c0)}
          </G>
        ),
        over: (
          <G transform={t}>
            <Ellipse cx={130} cy={360} rx={30} ry={9} fill={PINK} transform="rotate(-22 130 360)" />
            <Ellipse cx={482} cy={366} rx={32} ry={10} fill={PINK} transform="rotate(22 482 366)" />
            <Ellipse cx={222} cy={512} rx={8} ry={6} fill={INK} />
            <Ellipse cx={282} cy={512} rx={8} ry={6} fill={INK} />
          </G>
        ),
      };
      return {
        ...base,
        face: { eyes: EYES, mouth: [252, 548], blush: [[146, 516], [384, 528]] },
        iris: '#4A3426',
        faceBg: snout,
        headDy: dy,
        top: { x: 296, y: 268, w: 230 },
        neck: { x: 350, y: 470, w: 130 },
        pieces: [...pieces, neck, head],
      };
    }
    case 'penguin': {
      const { sh, hl } = cel(c0);
      const b: El = [380, 515, 225, 290];
      return {
        iris: '#2E2A33',
        faceBg: c1,
        face: {
          eyes: [
            { x: 320, y: 392, rx: 32, ry: 38, out: -1 },
            { x: 440, y: 392, rx: 32, ry: 38, out: 1 },
          ],
          blush: [[282, 440], [478, 440]],
        },
        top: { x: 380, y: 236, w: 250 },
        neck: { x: 380, y: 530, w: 190 },
        head: [380, 380, 200, 150],
        body: b,
        pieces: [
          {
            shape: (
              <>
                <Ellipse cx={318} cy={802} rx={52} ry={18} fill="#F39C38" />
                <Ellipse cx={444} cy={802} rx={52} ry={18} fill="#F39C38" />
              </>
            ),
          },
          {
            shape: (
              <>
                <Path d="M168 470 C116 522 96 606 116 668 C152 646 178 594 186 530 Z" fill={c0} />
                <Path d="M592 470 C644 522 664 606 644 668 C608 646 582 594 574 530 Z" fill={c0} />
                {mess > 0.12 && <Path d={tuftPath(b, 210, 330, 6, 18 + mess * 20, 4)} fill={c0} />}
                <Path d="M380 222 C522 222 604 370 608 540 C614 712 532 806 380 806 C228 806 146 712 152 540 C156 370 238 222 380 222 Z" fill={c0} />
              </>
            ),
            detail: (
              <>
                <Path d="M380 420 C474 420 544 520 544 640 C544 742 472 792 380 792 C288 792 216 742 216 640 C216 520 286 420 380 420 Z" fill={c1} />
                <Path d="M380 334 C340 272 248 290 252 382 C256 452 330 476 380 444 C430 476 504 452 508 382 C512 290 420 272 380 334 Z" fill={c1} />
                <Path d="M556 380 C628 500 632 700 520 800 L660 800 L660 360 Z" fill={sh} />
                <Ellipse cx={286} cy={288} rx={24} ry={12} fill={hl} transform="rotate(-28 286 288)" />
                <Circle cx={328} cy={266} r={6} fill={hl} />
              </>
            ),
            over: <Path d="M350 444 L410 444 L380 482 Z" fill="#F39C38" stroke={OUTLINE} strokeWidth={6} strokeLinejoin="round" />,
          },
        ],
      };
    }
    case 'budgie': {
      const waves = (x0: number, y0: number, rows: number, cols: number) =>
        Array.from({ length: rows }, (_, i) => {
          let d = `M${x0} ${y0 + i * 26}`;
          for (let k = 0; k < cols; k++) d += ' q18 16 36 0';
          return d;
        }).join(' ');
      const h: El = [380, 360, 168, 152];
      const b: El = [380, 630, 175, 185];
      return {
        iris: '#2E2A33',
        faceBg: c1,
        face: {
          eyes: [
            { x: 312, y: 364, rx: 30, ry: 36, out: -1 },
            { x: 448, y: 364, rx: 30, ry: 36, out: 1 },
          ],
          blush: [[276, 410], [484, 410]],
        },
        top: { x: 380, y: 222, w: 240 },
        neck: { x: 380, y: 508, w: 150 },
        head: h,
        body: b,
        pieces: [
          { shape: <Path d="M338 740 L356 836 L404 836 L422 740 Z" fill={shade(c0, -0.25)} /> },
          {
            shape: (
              <>
                {mess > 0.12 && <Path d={tuftPath(b, -40, 220, 8, 18 + mess * 20, 2)} fill={c0} />}
                <Ellipse cx={380} cy={630} rx={175} ry={185} fill={c0} />
              </>
            ),
            detail: <Path d="M500 520 C580 600 580 720 480 800 L600 800 L600 500 Z" fill={cel(c0).sh} />,
            over: <Path d="M338 812 L326 834 M356 812 L356 838 M422 812 L434 834 M404 812 L404 838" stroke="#9AA0A6" strokeWidth={9} strokeLinecap="round" />,
          },
          {
            shape: (
              <>
                <Path d="M232 470 C168 544 168 704 250 784 C292 722 302 584 282 482 Z" fill={c1} />
                <Path d="M528 470 C592 544 592 704 510 784 C468 722 458 584 478 482 Z" fill={c1} />
              </>
            ),
            detail: <Path d={`${waves(160, 490, 12, 4)} ${waves(450, 490, 12, 4)}`} stroke={c2} strokeWidth={8} fill="none" />,
          },
          {
            shape: (
              <>
                {mess > 0.12 && <Path d={tuftPath(h, 200, 340, 7, 20 + mess * 22, 9)} fill={c1} />}
                <Ellipse cx={380} cy={360} rx={168} ry={152} fill={c1} />
              </>
            ),
            detail: (
              <>
                <Path d={waves(222, 236, 2, 9)} stroke={c2} strokeWidth={7} fill="none" />
                <Path d="M500 260 C560 330 560 430 500 500 L600 500 L600 240 Z" fill={cel(c1).sh} />
                <Ellipse cx={300} cy={262} rx={20} ry={10} fill={cel(c1).hl} transform="rotate(-25 300 262)" />
              </>
            ),
            over: (
              <>
                <Ellipse cx={246} cy={436} rx={22} ry={28} fill="#7B68C8" />
                <Ellipse cx={514} cy={436} rx={22} ry={28} fill="#7B68C8" />
                <Circle cx={326} cy={494} r={13} fill={c2} />
                <Circle cx={380} cy={504} r={13} fill={c2} />
                <Circle cx={434} cy={494} r={13} fill={c2} />
                <Ellipse cx={380} cy={410} rx={28} ry={15} fill="#7FA7D9" />
                <Path d="M352 420 Q380 488 408 420 Z" fill="#E8C98E" stroke={OUTLINE} strokeWidth={6} strokeLinejoin="round" />
              </>
            ),
          },
        ],
      };
    }
  }
}

export function AnimalArt({ species, colors, expression = 'neutral', dirt = 0, mess = 0, head, neck, size = 200 }: Props) {
  const rid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const c0 = colors[0] ?? '#ccc';
  const c1 = colors[1] ?? c0;
  const c2 = colors[2] ?? c1;
  const art = buildArt(species, c0, c1, c2, mess);
  const ink = isDark(art.faceBg) ? '#F4ECF1' : INK;
  const dy = art.headDy ?? 0;

  return (
    <Svg width={size} height={size * 1.1} viewBox="0 0 200 220">
      <G transform={TO_VIEW}>
        <Ellipse cx={400} cy={808} rx={250} ry={22} fill="#000" opacity={0.08} />
        {art.pieces.map((p, i) => (
          <G key={i}>
            <Defs>
              <ClipPath id={`p${rid}${i}`}>{p.shape}</ClipPath>
            </Defs>
            {/* Kontur: Teil dick in dunkel, darüber normal – bleibt nur außen sichtbar */}
            <G stroke={OUTLINE} strokeWidth={OUTLINE_W} strokeLinejoin="round" strokeLinecap="round">
              {p.shape}
            </G>
            {p.shape}
            {p.detail && <G clipPath={`url(#p${rid}${i})`}>{p.detail}</G>}
            {p.over}
          </G>
        ))}
        {dirt > 0.05 && <Dirt amount={dirt} head={art.head} body={art.body} dy={dy} />}
        <G transform={`translate(0 ${dy})`}>
          <AnimeFace face={art.face} expression={expression} iris={art.iris} ink={ink} beak={species === 'penguin' || species === 'budgie'} />
        </G>
        {neck && <NeckWear item={neck} at={art.neck} />}
        {head && <HeadWear item={head} at={{ ...art.top, y: art.top.y + dy }} />}
      </G>
    </Svg>
  );
}

function Dirt({ amount, head: [hx, hy, hrx, hry], body, dy }: { amount: number; head: El; body?: El; dy: number }) {
  const spots: [number, number, number][] = [
    [hx - hrx * 0.45, hy - hry * 0.45 + dy, 22],
    [hx + hrx * 0.5, hy + dy, 18],
    [hx + hrx * 0.05, hy - hry * 0.75 + dy, 15],
  ];
  if (body) {
    const [bx, by, brx, bry] = body;
    spots.push([bx - brx * 0.55, by + bry * 0.2, 24], [bx + brx * 0.5, by - bry * 0.05, 22], [bx, by + bry * 0.55, 16]);
  }
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

/** Anime-Augen mit großem Glanzpunkt und kräftigem Lidstrich */
function AnimeFace({ face, expression, iris, ink, beak }: { face: FaceSpec; expression: Expression; iris: string; ink: string; beak: boolean }) {
  const closed = expression === 'love' || expression === 'eating';
  const lid = ink === INK ? OUTLINE : ink;
  const eyes = face.eyes.map((e, i) => {
    const { x, y, rx, ry, out } = e;
    const lw = rx * 0.3;
    if (closed) {
      return (
        <Path key={i} d={`M${x - rx} ${y + ry * 0.15} Q${x} ${y - ry * 0.9} ${x + rx} ${y + ry * 0.15}`} stroke={lid} strokeWidth={lw} fill="none" strokeLinecap="round" />
      );
    }
    if (expression === 'tired') {
      return (
        <G key={i}>
          <Path d={`M${x - rx} ${y} Q${x} ${y + ry * 0.55} ${x + rx} ${y}`} stroke={lid} strokeWidth={lw} fill="none" strokeLinecap="round" />
          <Path d={`M${x - rx * 0.7} ${y + ry * 0.55} Q${x} ${y + ry * 0.8} ${x + rx * 0.7} ${y + ry * 0.55}`} stroke={lid} strokeWidth={lw * 0.4} fill="none" opacity={0.5} />
        </G>
      );
    }
    return (
      <G key={i}>
        <Ellipse cx={x} cy={y} rx={rx} ry={ry} fill={INK} />
        <Ellipse cx={x} cy={y + ry * 0.16} rx={rx * 0.8} ry={ry * 0.74} fill={iris} />
        <Ellipse cx={x} cy={y + ry * 0.22} rx={rx * 0.44} ry={ry * 0.46} fill="#120E15" />
        <Ellipse cx={x - out * rx * 0.1} cy={y + ry * 0.62} rx={rx * 0.5} ry={ry * 0.14} fill={shade(iris, 0.45)} opacity={0.75} />
        <Circle cx={x - rx * 0.34} cy={y - ry * 0.34} r={rx * 0.38} fill="#fff" />
        <Circle cx={x + rx * 0.36} cy={y + ry * 0.34} r={rx * 0.15} fill="#fff" />
        <Path
          d={`M${x - out * rx * 1.02} ${y - ry * 0.2} Q${x - out * rx * 0.15} ${y - ry * 1.38} ${x + out * rx * 1.05} ${y - ry * 0.38} L${x + out * rx * 1.38} ${y - ry * 0.72}`}
          stroke={lid}
          strokeWidth={lw}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {expression === 'sad' && (
          <>
            <Path d={`M${x - out * rx * 0.9} ${y - ry * 1.2} L${x + out * rx * 0.6} ${y - ry * 1.5}`} stroke={lid} strokeWidth={lw * 0.6} strokeLinecap="round" />
            {out === 1 && <Path d={`M${x + rx * 0.5} ${y + ry * 0.95} q10 18 0 26 q-10 -8 0 -26 Z`} fill="#74B9FF" />}
          </>
        )}
      </G>
    );
  });

  const blush = expression === 'happy' || expression === 'love' || expression === 'eating';
  let mouth: React.ReactNode = null;
  if (!beak && face.mouth) {
    const [mx, my] = face.mouth;
    const sw = 5.5;
    if (expression === 'eating') {
      mouth = (
        <G>
          <Ellipse cx={mx} cy={my + 10} rx={20} ry={18} fill="#7E2F3C" stroke={ink} strokeWidth={4} />
          <Ellipse cx={mx} cy={my + 18} rx={11} ry={7} fill="#F28B9B" />
        </G>
      );
    } else if (expression === 'tired') {
      mouth = <Ellipse cx={mx} cy={my + 8} rx={9} ry={11} fill="#7E2F3C" stroke={ink} strokeWidth={3} />;
    } else if (expression === 'sad') {
      mouth = <Path d={`M${mx - 18} ${my + 14} Q${mx} ${my - 2} ${mx + 18} ${my + 14}`} stroke={ink} strokeWidth={sw} fill="none" strokeLinecap="round" />;
    } else if (expression === 'happy' || expression === 'love') {
      mouth = (
        <Path
          d={`M${mx - 22} ${my - 4} Q${mx - 11} ${my + 14} ${mx} ${my} Q${mx + 11} ${my + 14} ${mx + 22} ${my - 4}`}
          stroke={ink}
          strokeWidth={sw}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    } else {
      mouth = (
        <Path
          d={`M${mx - 18} ${my - 3} Q${mx - 9} ${my + 10} ${mx} ${my} Q${mx + 9} ${my + 10} ${mx + 18} ${my - 3}`}
          stroke={ink}
          strokeWidth={sw}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    }
  }

  return (
    <G>
      {eyes}
      {blush &&
        face.blush.map(([bx, by], i) => (
          <G key={i}>
            <Ellipse cx={bx} cy={by} rx={26} ry={13} fill="#FF7FA0" opacity={0.42} />
            <Path d={`M${bx - 12} ${by + 4} l6 -9 M${bx - 2} ${by + 4} l6 -9 M${bx + 8} ${by + 4} l6 -9`} stroke="#fff" strokeWidth={2.5} opacity={0.7} strokeLinecap="round" />
          </G>
        ))}
      {mouth}
    </G>
  );
}
