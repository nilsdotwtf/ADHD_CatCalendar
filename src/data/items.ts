import { SpeciesId } from './animals';

export type NeedId = 'hunger' | 'clean' | 'energy' | 'fun';
export type ConsumableId = 'food' | 'brush' | 'pillow' | 'cuddle';

export interface NeedInfo {
  id: NeedId;
  label: string;
  emoji: string;
  color: string;
  item: ConsumableId;
  low: string; // Text, wenn das Bedürfnis niedrig ist ({name} wird ersetzt)
}

export const NEEDS: NeedInfo[] = [
  { id: 'hunger', label: 'Hunger', emoji: '🍽️', color: '#FF9F43', item: 'food', low: '{name} hat Hunger!' },
  { id: 'clean', label: 'Fellpflege', emoji: '🫧', color: '#4FC3F7', item: 'brush', low: '{name}s Fell ist ganz dreckig.' },
  { id: 'energy', label: 'Energie', emoji: '⚡', color: '#B388FF', item: 'pillow', low: '{name} ist todmüde.' },
  { id: 'fun', label: 'Laune', emoji: '💖', color: '#FF6B9A', item: 'cuddle', low: '{name} langweilt sich.' },
];

export const NEED_BY_ID: Record<NeedId, NeedInfo> = Object.fromEntries(NEEDS.map((n) => [n.id, n])) as Record<
  NeedId,
  NeedInfo
>;

export interface ConsumableInfo {
  id: ConsumableId;
  need: NeedId;
  name: string;
  emoji: string;
  action: string; // Button-Text
  boost: number;
}

const FOOD_EMOJI: Record<SpeciesId, string> = {
  cat: '🐟',
  dog: '🦴',
  rabbit: '🥕',
  hamster: '🌻',
  fox: '🍗',
  giraffe: '🌿',
  cow: '🌾',
  penguin: '🐟',
  budgie: '🌾',
  tiger: '🍖',
  raccoon: '🍎',
};

export function consumableInfo(id: ConsumableId, species: SpeciesId): ConsumableInfo {
  switch (id) {
    case 'food':
      return { id, need: 'hunger', name: 'Futter', emoji: FOOD_EMOJI[species], action: 'Füttern', boost: 30 };
    case 'brush':
      return { id, need: 'clean', name: 'Bürste', emoji: '🪮', action: 'Bürsten', boost: 35 };
    case 'pillow':
      return { id, need: 'energy', name: 'Kuschelkissen', emoji: '🛏️', action: 'Schlafen', boost: 35 };
    case 'cuddle':
      return { id, need: 'fun', name: 'Streichel-Herz', emoji: '💝', action: 'Streicheln', boost: 30 };
  }
}

export const CONSUMABLES: ConsumableId[] = ['food', 'brush', 'pillow', 'cuddle'];

// ---------- Bonus-Gegenstände ----------

export type ToyType = 'ball' | 'yarn' | 'duck' | 'teddy' | 'frisbee' | 'mouse';
export const TOYS: { type: ToyType; name: string }[] = [
  { type: 'ball', name: 'Ball' },
  { type: 'yarn', name: 'Wollknäuel' },
  { type: 'duck', name: 'Quietscheente' },
  { type: 'teddy', name: 'Teddy' },
  { type: 'frisbee', name: 'Frisbee' },
  { type: 'mouse', name: 'Spielmaus' },
];

export type ClothingType =
  | 'bow'
  | 'crown'
  | 'flowers'
  | 'headband'
  | 'necklace'
  | 'bowtie'
  | 'cap'
  | 'tophat'
  | 'tie'
  | 'beanie';
export type ClothingSlot = 'head' | 'neck';
export type ClothingStyle = 'female' | 'male';

export const CLOTHES: { type: ClothingType; name: string; slot: ClothingSlot; style: ClothingStyle }[] = [
  { type: 'bow', name: 'Schleife', slot: 'head', style: 'female' },
  { type: 'crown', name: 'Krone', slot: 'head', style: 'female' },
  { type: 'flowers', name: 'Blumenkranz', slot: 'head', style: 'female' },
  { type: 'headband', name: 'Haarreif', slot: 'head', style: 'female' },
  { type: 'necklace', name: 'Perlenkette', slot: 'neck', style: 'female' },
  { type: 'bowtie', name: 'Fliege', slot: 'neck', style: 'male' },
  { type: 'cap', name: 'Basecap', slot: 'head', style: 'male' },
  { type: 'tophat', name: 'Zylinder', slot: 'head', style: 'male' },
  { type: 'tie', name: 'Krawatte', slot: 'neck', style: 'male' },
  { type: 'beanie', name: 'Mütze', slot: 'head', style: 'male' },
];

export function clothingInfo(type: ClothingType) {
  return CLOTHES.find((c) => c.type === type)!;
}

export const ITEM_COLORS: ColorOptionLite[] = [
  { name: 'Rot', hex: '#EF4444' },
  { name: 'Rosa', hex: '#F472B6' },
  { name: 'Orange', hex: '#FB923C' },
  { name: 'Gelb', hex: '#FACC15' },
  { name: 'Grün', hex: '#22C55E' },
  { name: 'Türkis', hex: '#14B8A6' },
  { name: 'Blau', hex: '#3B82F6' },
  { name: 'Lila', hex: '#A855F7' },
  { name: 'Schwarz', hex: '#27272A' },
  { name: 'Gold', hex: '#E5B53A' },
];

interface ColorOptionLite {
  name: string;
  hex: string;
}

export interface OwnedToy {
  id: string;
  type: ToyType;
  color: string;
  lastPlayed: number;
}

export interface OwnedClothing {
  id: string;
  type: ClothingType;
  color: string;
}

export const TOY_COOLDOWN_MS = 60 * 60 * 1000; // 1 Stunde
