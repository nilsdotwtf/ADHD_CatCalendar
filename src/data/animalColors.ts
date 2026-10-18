import { SpeciesId } from './animals';

/**
 * Welche Farbtöne der Tier-SVGs zu welcher Farbwahl gehören.
 *
 * Jede Farbvariable eines Tiers wird dem ähnlichsten "Anker" zugeordnet:
 * - Anker mit slot ≥ 0 werden zur gewählten Farbe dieses Slots verschoben
 *   (Schattierungen bleiben dabei erhalten),
 * - Anker mit slot -1 bleiben unverändert (Rosa, Schnabel, helle Bereiche …).
 * Konturen (sehr dunkel), Augen und die Gruppen rosa/hell/akzent bleiben immer original.
 */
export interface AnimalColorConfig {
  anchors: [number, string][];
  /** Variablengruppen, die umgefärbt werden dürfen (Standard: nur "fell") */
  groups?: string[];
  /** Bis zu dieser Helligkeit bleibt eine Farbe als Kontur unverändert */
  keepDarkBelow?: number;
  /** Dunkle, graue Töne (Fell-Linien) nicht umfärben – aus bei grauen Tieren */
  keepDarkGray?: boolean;
  /** Welche Farbe rund um die Augen liegt (Slot je Auge) – für geschlossene Augen */
  eyeSkin: [number, number];
}

export const ANIMAL_COLORS: Record<SpeciesId, AnimalColorConfig> = {
  cat: {
    anchors: [
      [0, '#f89434'],
      [1, '#d27326'],
      [2, '#924f29'],
      [-1, '#cbb096'],
    ],
    eyeSkin: [0, 0],
  },
  dog: {
    anchors: [
      [0, '#f2a648'],
      [0, '#cf7828'],
      [1, '#fdedd1'],
    ],
    eyeSkin: [0, 0],
  },
  rabbit: {
    anchors: [[0, '#faedd6']],
    eyeSkin: [0, 0],
  },
  hamster: {
    anchors: [
      [0, '#f0b863'],
      [1, '#fbf1da'],
      [-1, '#fbb59e'],
    ],
    eyeSkin: [0, 0],
  },
  fox: {
    anchors: [
      [0, '#e7772c'],
      [0, '#744731'],
      [1, '#feecce'],
    ],
    keepDarkGray: false,
    keepDarkBelow: 0.22,
    eyeSkin: [0, 0],
  },
  giraffe: {
    anchors: [
      [0, '#fdce70'],
      [1, '#ce7726'],
      [1, '#7d4725'],
      [-1, '#feedcd'],
      [-1, '#fdbfa9'],
    ],
    eyeSkin: [0, 0],
  },
  cow: {
    anchors: [
      [0, '#fbedd5'],
      [1, '#ae6b34'],
      [-1, '#f8bea4'],
    ],
    eyeSkin: [0, 1],
  },
  penguin: {
    anchors: [
      [0, '#525157'],
      [1, '#fcf3e1'],
      [-1, '#faa52d'],
    ],
    keepDarkBelow: 0.2,
    keepDarkGray: false,
    eyeSkin: [1, 1],
  },
  budgie: {
    anchors: [
      [0, '#a1cd45'],
      [0, '#7eb33c'],
      [1, '#fbe754'],
      [-1, '#ecb94e'],
      [-1, '#e1a985'],
      [-1, '#b09673'],
    ],
    eyeSkin: [1, 1],
  },
  tiger: {
    anchors: [
      [0, '#f9a02d'],
      [1, '#603e29'],
      [-1, '#fdedd3'],
      [-1, '#f0d8ca'],
    ],
    groups: ['fell', 'kontur'],
    keepDarkBelow: 0.2,
    eyeSkin: [0, 0],
  },
  raccoon: {
    anchors: [
      [0, '#a78771'],
      [1, '#674c3f'],
      [-1, '#f5e0c7'],
      [-1, '#e9cdb4'],
    ],
    keepDarkGray: false,
    keepDarkBelow: 0.22,
    eyeSkin: [1, 1],
  },
};
