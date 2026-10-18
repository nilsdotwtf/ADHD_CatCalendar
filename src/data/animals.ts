// Tierarten mit ihren einfärbbaren Bereichen.
// Jede Farbwahl bietet genau 10 Farben, die das echte Tier auch haben kann.

export type SpeciesId =
  | 'cat'
  | 'dog'
  | 'rabbit'
  | 'hamster'
  | 'fox'
  | 'giraffe'
  | 'cow'
  | 'penguin'
  | 'budgie'
  | 'tiger'
  | 'raccoon';

export interface ColorOption {
  name: string;
  hex: string;
}

export interface ColorSlot {
  label: string;
  options: ColorOption[]; // immer 10
}

export interface Species {
  id: SpeciesId;
  name: string; // "Katze"
  article: 'die' | 'der' | 'das';
  emoji: string;
  description: string;
  slots: ColorSlot[];
  defaultNames: string[];
}

const catColors: ColorOption[] = [
  { name: 'Weiß', hex: '#FAF7F2' },
  { name: 'Schwarz', hex: '#2B2A2E' },
  { name: 'Rot / Orange', hex: '#E08A3C' },
  { name: 'Creme', hex: '#F1D9B0' },
  { name: 'Blaugrau', hex: '#8C94A3' },
  { name: 'Schokobraun', hex: '#6B4430' },
  { name: 'Zimt', hex: '#A8673F' },
  { name: 'Lilac', hex: '#C2B3B8' },
  { name: 'Silber', hex: '#C9CCD1' },
  { name: 'Fawn', hex: '#CDAE91' },
];

export const SPECIES: Species[] = [
  {
    id: 'cat',
    name: 'Katze',
    article: 'die',
    emoji: '🐱',
    description: 'Flauschige Katze mit 3 Farben',
    slots: [
      { label: 'Fell', options: catColors },
      { label: 'Flecken', options: catColors },
      { label: 'Streifen', options: catColors },
    ],
    defaultNames: ['Mimi', 'Luna', 'Felix', 'Minka', 'Tiger', 'Pünktchen'],
  },
  {
    id: 'dog',
    name: 'Hund',
    article: 'der',
    emoji: '🐶',
    description: 'Treuer Kumpel mit Fell & Flecken',
    slots: [
      {
        label: 'Fell',
        options: [
          { name: 'Schwarz', hex: '#2A2826' },
          { name: 'Weiß', hex: '#F8F5EF' },
          { name: 'Braun', hex: '#7A4E2D' },
          { name: 'Gold', hex: '#D9A35B' },
          { name: 'Creme', hex: '#EEDCBA' },
          { name: 'Grau', hex: '#8E8E8E' },
          { name: 'Rot', hex: '#B5552B' },
          { name: 'Schoko', hex: '#5A3825' },
          { name: 'Blue Merle', hex: '#9AA3AD' },
          { name: 'Sand', hex: '#D2B48C' },
        ],
      },
      {
        label: 'Brust & Schnauze',
        options: [
          { name: 'Weiß', hex: '#F8F5EF' },
          { name: 'Schwarz', hex: '#2A2826' },
          { name: 'Braun', hex: '#7A4E2D' },
          { name: 'Lohfarben', hex: '#C68642' },
          { name: 'Creme', hex: '#EEDCBA' },
          { name: 'Grau', hex: '#8E8E8E' },
          { name: 'Rot', hex: '#B5552B' },
          { name: 'Schoko', hex: '#5A3825' },
          { name: 'Gold', hex: '#D9A35B' },
          { name: 'Leberbraun', hex: '#6E3B2A' },
        ],
      },
    ],
    defaultNames: ['Bello', 'Sammy', 'Lucky', 'Bruno', 'Nala', 'Keks'],
  },
  {
    id: 'rabbit',
    name: 'Hase',
    article: 'der',
    emoji: '🐰',
    description: 'Flauschiger Hoppler in einer Farbe',
    slots: [
      {
        label: 'Fell',
        options: [
          { name: 'Weiß', hex: '#FBF8F3' },
          { name: 'Wildfarben', hex: '#9C7A5B' },
          { name: 'Grau', hex: '#A3A3A3' },
          { name: 'Schwarz', hex: '#2E2C2C' },
          { name: 'Braun', hex: '#7B5236' },
          { name: 'Creme', hex: '#EEDFC4' },
          { name: 'Orange', hex: '#D98E4A' },
          { name: 'Blaugrau', hex: '#7F8796' },
          { name: 'Schoko', hex: '#5C3B2A' },
          { name: 'Lilac', hex: '#BBAEB4' },
        ],
      },
    ],
    defaultNames: ['Hoppel', 'Stups', 'Mümmel', 'Flocke', 'Möhre', 'Lotte'],
  },
  {
    id: 'hamster',
    name: 'Hamster',
    article: 'der',
    emoji: '🐹',
    description: 'Kleiner Pausbacken-Freund',
    slots: [
      {
        label: 'Fell',
        options: [
          { name: 'Goldbraun', hex: '#D69A57' },
          { name: 'Zimt', hex: '#C47F45' },
          { name: 'Creme', hex: '#EFD9B4' },
          { name: 'Grau (Russisch)', hex: '#9C9A97' },
          { name: 'Schwarz', hex: '#33302E' },
          { name: 'Sepia', hex: '#8E6B4E' },
          { name: 'Perlweiß', hex: '#F2EEE6' },
          { name: 'Saphir', hex: '#A2A8B4' },
          { name: 'Rost', hex: '#B4643A' },
          { name: 'Hellbeige', hex: '#E3C9A0' },
        ],
      },
      {
        label: 'Bauch',
        options: [
          { name: 'Weiß', hex: '#FBF9F5' },
          { name: 'Creme', hex: '#F2E3C8' },
          { name: 'Hellgrau', hex: '#D6D4D0' },
          { name: 'Beige', hex: '#E7D3B3' },
          { name: 'Perlweiß', hex: '#F2EEE6' },
          { name: 'Elfenbein', hex: '#F6EEDC' },
          { name: 'Hellgold', hex: '#EDCF9C' },
          { name: 'Sandgrau', hex: '#C9BFB0' },
          { name: 'Silber', hex: '#CDD0D4' },
          { name: 'Zimt', hex: '#C47F45' },
        ],
      },
    ],
    defaultNames: ['Krümel', 'Nugget', 'Hamtaro', 'Erdnuss', 'Bohne', 'Pummel'],
  },
  {
    id: 'fox',
    name: 'Fuchs',
    article: 'der',
    emoji: '🦊',
    description: 'Schlauer Rotschopf',
    slots: [
      {
        label: 'Fell',
        options: [
          { name: 'Rotfuchs', hex: '#D9652B' },
          { name: 'Orange', hex: '#E98A3A' },
          { name: 'Kreuzfuchs', hex: '#9B5A33' },
          { name: 'Silberfuchs', hex: '#7D8088' },
          { name: 'Schwarz', hex: '#2D2B2B' },
          { name: 'Polarweiß', hex: '#F5F5F2' },
          { name: 'Blaufuchs', hex: '#8A8F98' },
          { name: 'Fennek-Sand', hex: '#E2C08D' },
          { name: 'Platin', hex: '#CFCAC2' },
          { name: 'Goldrot', hex: '#C9772F' },
        ],
      },
      {
        label: 'Brust & Schwanzspitze',
        options: [
          { name: 'Weiß', hex: '#FBFAF7' },
          { name: 'Creme', hex: '#F2E4C9' },
          { name: 'Hellgrau', hex: '#D3D3D0' },
          { name: 'Silber', hex: '#C4C6CA' },
          { name: 'Rahmweiß', hex: '#FFF4E2' },
          { name: 'Sand', hex: '#E2C08D' },
          { name: 'Elfenbein', hex: '#F6EEDC' },
          { name: 'Hellbeige', hex: '#EBDDC4' },
          { name: 'Beige', hex: '#E5D1B0' },
          { name: 'Perlgrau', hex: '#B9B8B4' },
        ],
      },
    ],
    defaultNames: ['Foxy', 'Rusty', 'Ronja', 'Fiete', 'Flinki', 'Zimt'],
  },
  {
    id: 'giraffe',
    name: 'Giraffe',
    article: 'die',
    emoji: '🦒',
    description: 'Langhals mit 2 Farben',
    slots: [
      {
        label: 'Grundfarbe',
        options: [
          { name: 'Creme', hex: '#F3E3C3' },
          { name: 'Hellbeige', hex: '#EBD6AE' },
          { name: 'Sandgelb', hex: '#E9CF8F' },
          { name: 'Goldgelb', hex: '#E6BE6A' },
          { name: 'Ocker', hex: '#D9A653' },
          { name: 'Weizen', hex: '#F0DCA8' },
          { name: 'Elfenbein', hex: '#F7EEDB' },
          { name: 'Hellocker', hex: '#E3B977' },
          { name: 'Butter', hex: '#F3DE9F' },
          { name: 'Honig', hex: '#D9AE5F' },
        ],
      },
      {
        label: 'Flecken',
        options: [
          { name: 'Hellbraun', hex: '#B07A45' },
          { name: 'Kastanie', hex: '#8C4F2B' },
          { name: 'Dunkelbraun', hex: '#5E3720' },
          { name: 'Rotbraun', hex: '#9E4E2C' },
          { name: 'Schokobraun', hex: '#4D2E1D' },
          { name: 'Orangebraun', hex: '#BF6D35' },
          { name: 'Zimt', hex: '#A8673F' },
          { name: 'Mahagoni', hex: '#73372A' },
          { name: 'Karamell', hex: '#C08A4E' },
          { name: 'Fast Schwarz', hex: '#3A2418' },
        ],
      },
    ],
    defaultNames: ['Gina', 'Stelzi', 'Hali', 'Zuri', 'Kito', 'Melman'],
  },
  {
    id: 'cow',
    name: 'Kuh',
    article: 'die',
    emoji: '🐮',
    description: 'Gemütliche Muh-Freundin',
    slots: [
      {
        label: 'Grundfarbe',
        options: [
          { name: 'Weiß', hex: '#FAF8F4' },
          { name: 'Creme', hex: '#F0E1C6' },
          { name: 'Hellbraun', hex: '#B9875A' },
          { name: 'Rotbraun', hex: '#9B4B2B' },
          { name: 'Schwarz', hex: '#2B2928' },
          { name: 'Grau', hex: '#9C9A98' },
          { name: 'Falb', hex: '#D2B183' },
          { name: 'Dunkelbraun', hex: '#5A3826' },
          { name: 'Beige', hex: '#E3CFAE' },
          { name: 'Rot', hex: '#A8432A' },
        ],
      },
      {
        label: 'Flecken',
        options: [
          { name: 'Schwarz', hex: '#2B2928' },
          { name: 'Braun', hex: '#7A4A2E' },
          { name: 'Rotbraun', hex: '#9B4B2B' },
          { name: 'Weiß', hex: '#FAF8F4' },
          { name: 'Dunkelbraun', hex: '#5A3826' },
          { name: 'Grau', hex: '#9C9A98' },
          { name: 'Creme', hex: '#F0E1C6' },
          { name: 'Rot', hex: '#A8432A' },
          { name: 'Falb', hex: '#D2B183' },
          { name: 'Schoko', hex: '#4A2E20' },
        ],
      },
    ],
    defaultNames: ['Berta', 'Elsa', 'Muhli', 'Lieselotte', 'Milka', 'Paula'],
  },
  {
    id: 'penguin',
    name: 'Pinguin',
    article: 'der',
    emoji: '🐧',
    description: 'Watschelnder Frackträger',
    slots: [
      {
        label: 'Rücken',
        options: [
          { name: 'Schwarz', hex: '#22252B' },
          { name: 'Blauschwarz', hex: '#1F2A3A' },
          { name: 'Schiefergrau', hex: '#4B5563' },
          { name: 'Dunkelblau', hex: '#27375A' },
          { name: 'Zwergpinguin-Blau', hex: '#5878A0' },
          { name: 'Graublau', hex: '#6B7A8F' },
          { name: 'Anthrazit', hex: '#353A40' },
          { name: 'Küken-Grau', hex: '#8E9298' },
          { name: 'Braungrau (Küken)', hex: '#7A6E66' },
          { name: 'Dunkelgrau', hex: '#3F4247' },
        ],
      },
      {
        label: 'Bauch',
        options: [
          { name: 'Weiß', hex: '#FBFBFA' },
          { name: 'Cremeweiß', hex: '#F6F0E2' },
          { name: 'Hellgrau', hex: '#DADCDF' },
          { name: 'Silberweiß', hex: '#E9ECEF' },
          { name: 'Elfenbein', hex: '#F7F1E1' },
          { name: 'Perlgrau', hex: '#CDD1D6' },
          { name: 'Zartgelb (Kaiser)', hex: '#F6E7B8' },
          { name: 'Schneeweiß', hex: '#FFFFFF' },
          { name: 'Küken-Hellgrau', hex: '#C3C6CA' },
          { name: 'Hellbeige', hex: '#EDE3D0' },
        ],
      },
    ],
    defaultNames: ['Pingu', 'Frosty', 'Tux', 'Pebbles', 'Watschel', 'Kiki'],
  },
  {
    id: 'budgie',
    name: 'Wellensittich',
    article: 'der',
    emoji: '🦜',
    description: 'Bunter Vogel mit 2 Farben',
    slots: [
      {
        label: 'Körper',
        options: [
          { name: 'Grün', hex: '#6CC24A' },
          { name: 'Hellgrün', hex: '#A4D65E' },
          { name: 'Himmelblau', hex: '#5DADE2' },
          { name: 'Kobalt', hex: '#3A6FC4' },
          { name: 'Violett', hex: '#8E6CC4' },
          { name: 'Grau', hex: '#9A9EA5' },
          { name: 'Gelb (Lutino)', hex: '#F4D03F' },
          { name: 'Weiß (Albino)', hex: '#F7F7F5' },
          { name: 'Türkis', hex: '#48C9B0' },
          { name: 'Olivgrün', hex: '#7D8F3A' },
        ],
      },
      {
        label: 'Kopf',
        options: [
          { name: 'Gelb', hex: '#F7DC6F' },
          { name: 'Weiß', hex: '#F7F7F5' },
          { name: 'Zitronengelb', hex: '#F4E04D' },
          { name: 'Cremegelb', hex: '#F3E5AB' },
          { name: 'Hellgrau', hex: '#D5D8DC' },
          { name: 'Hellblau', hex: '#AED6F1' },
          { name: 'Goldgelb', hex: '#EBC14A' },
          { name: 'Elfenbein', hex: '#F4EEDB' },
          { name: 'Lime', hex: '#D4E86A' },
          { name: 'Silberweiß', hex: '#E5E8EB' },
        ],
      },
    ],
    defaultNames: ['Piepsi', 'Bubi', 'Hansi', 'Kiwi', 'Coco', 'Rio'],
  },
  {
    id: 'tiger',
    name: 'Tiger',
    article: 'der',
    emoji: '🐯',
    description: 'Gestreifte Großkatze',
    slots: [
      {
        label: 'Fell',
        options: [
          { name: 'Orange', hex: '#E8862E' },
          { name: 'Rotorange (Sumatra)', hex: '#D46A23' },
          { name: 'Gold (Golden Tabby)', hex: '#E9B65C' },
          { name: 'Weiß (Weißer Tiger)', hex: '#F4F1EA' },
          { name: 'Hellorange (Sibirisch)', hex: '#EFA153' },
          { name: 'Amber', hex: '#DB8B3A' },
          { name: 'Rostorange', hex: '#C9652A' },
          { name: 'Ocker', hex: '#D9A050' },
          { name: 'Creme', hex: '#F0DEB9' },
          { name: 'Erdbeerblond', hex: '#E8B07A' },
        ],
      },
      {
        label: 'Streifen',
        options: [
          { name: 'Schwarz', hex: '#1F1D1C' },
          { name: 'Dunkelbraun', hex: '#4A2E1E' },
          { name: 'Braun', hex: '#6E4428' },
          { name: 'Rotbraun', hex: '#8A4A28' },
          { name: 'Zimt', hex: '#A8673F' },
          { name: 'Grauschwarz', hex: '#3B3A3A' },
          { name: 'Hellbraun', hex: '#9C6B42' },
          { name: 'Schoko', hex: '#4D3020' },
          { name: 'Karamell', hex: '#B9793F' },
          { name: 'Schiefer', hex: '#55575C' },
        ],
      },
    ],
    defaultNames: ['Shir Khan', 'Raja', 'Tigra', 'Leo', 'Simba', 'Kira'],
  },
];

SPECIES.push({
  id: 'raccoon',
  name: 'Waschbär',
  article: 'der',
  emoji: '🦝',
  description: 'Kleiner Bandit mit Maske',
  slots: [
    {
      label: 'Fell',
      options: [
        { name: 'Grau', hex: '#A0A3A9' },
        { name: 'Silbergrau', hex: '#B8BBC0' },
        { name: 'Braungrau', hex: '#9A8F86' },
        { name: 'Dunkelgrau', hex: '#77797F' },
        { name: 'Hellgrau', hex: '#C9CBCE' },
        { name: 'Zimt', hex: '#B08A6A' },
        { name: 'Blond', hex: '#D2BC97' },
        { name: 'Schwarzgrau', hex: '#5E6066' },
        { name: 'Albino-Weiß', hex: '#EEEAE4' },
        { name: 'Rötlichgrau', hex: '#A88E82' },
      ],
    },
    {
      label: 'Maske & Ringe',
      options: [
        { name: 'Schwarz', hex: '#2E2C30' },
        { name: 'Dunkelgrau', hex: '#4D505A' },
        { name: 'Anthrazit', hex: '#3C3E44' },
        { name: 'Dunkelbraun', hex: '#4E3B30' },
        { name: 'Schwarzbraun', hex: '#3A2E28' },
        { name: 'Grau', hex: '#6E7178' },
        { name: 'Braun', hex: '#6B5242' },
        { name: 'Zimtbraun', hex: '#8A6448' },
        { name: 'Hellbraun', hex: '#A88B6E' },
        { name: 'Hellgrau (Albino)', hex: '#B9B6B2' },
      ],
    },
  ],
  defaultNames: ['Rocky', 'Bandit', 'Ringo', 'Mo', 'Wuschel', 'Flecki'],
});

export function getSpecies(id: SpeciesId): Species {
  return SPECIES.find((s) => s.id === id) ?? SPECIES[0];
}

// Standardfarben je Tier (Index pro Slot), damit die Vorschau direkt hübsch aussieht.
export const DEFAULT_COLOR_INDEX: Record<SpeciesId, number[]> = {
  cat: [2, 6, 5],
  dog: [3, 0],
  rabbit: [0],
  hamster: [0, 0],
  fox: [0, 0],
  giraffe: [2, 1],
  cow: [0, 1],
  penguin: [6, 0],
  budgie: [0, 0],
  tiger: [0, 0],
  raccoon: [0, 1],
};
