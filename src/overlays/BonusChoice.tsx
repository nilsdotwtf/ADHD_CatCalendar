import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimalArt, ClothingIcon } from '../components/AnimalArt';
import { Confetti } from '../components/Confetti';
import { useWorn } from '../components/Pet';
import { ToyArt } from '../components/ToyArt';
import { Button, Chip, H1, haptic, Sub } from '../components/ui';
import { CLOTHES, ClothingStyle, ClothingType, ITEM_COLORS, TOYS, ToyType } from '../data/items';
import { useStore, useUI } from '../store';
import { C, R, shadow } from '../theme';

type Kind = 'toy' | 'clothing';

export function BonusChoice() {
  const insets = useSafeAreaInsets();
  const s = useStore();
  const ui = useUI();
  const worn = useWorn();
  const [kind, setKind] = useState<Kind | null>(null);
  const [style, setStyle] = useState<ClothingStyle>('female');
  const [toy, setToy] = useState<ToyType>('ball');
  const [cloth, setCloth] = useState<ClothingType>('bow');
  const [color, setColor] = useState(ITEM_COLORS[0].hex);

  const clothes = CLOTHES.filter((c) => c.style === style);
  const clothInfo = CLOTHES.find((c) => c.type === cloth)!;

  const take = () => {
    haptic('success');
    if (kind === 'toy') {
      s.grantToy(toy, color);
      ui.showToast(`Neues Spielzeug! ${s.petName} will sofort spielen 🤩`);
    } else {
      s.grantClothing(cloth, color);
      ui.showToast(`${s.petName} sieht umwerfend aus! 😍`);
    }
    ui.close();
  };

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#FFF7D6' }]}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 30 }}>
        <H1 style={{ textAlign: 'center' }}>🎁 Deine Bonus-Belohnung!</H1>

        {kind === null && (
          <>
            <Sub style={{ textAlign: 'center', marginVertical: 10 }}>Was möchtest du für {s.petName}?</Sub>
            <View style={styles.choiceRow}>
              <Pressable style={styles.choice} onPress={() => setKind('toy')}>
                <ToyArt type="ball" color="#3B82F6" size={90} />
                <Text style={styles.choiceText}>Spielzeug</Text>
                <Sub style={{ textAlign: 'center' }}>Für Spielzeit & gute Laune</Sub>
              </Pressable>
              <Pressable
                style={styles.choice}
                onPress={() => {
                  setKind('clothing');
                  setCloth('bow');
                }}
              >
                <ClothingIcon item={{ type: 'tophat', color: '#A855F7' }} size={90} />
                <Text style={styles.choiceText}>Kleidung</Text>
                <Sub style={{ textAlign: 'center' }}>Zum Anziehen & Stylen</Sub>
              </Pressable>
            </View>
          </>
        )}

        {kind === 'toy' && (
          <>
            <View style={styles.preview}>
              <ToyArt type={toy} color={color} size={150} />
            </View>
            <Text style={styles.label}>Welches Spielzeug?</Text>
            <View style={styles.grid}>
              {TOYS.map((t) => (
                <Pressable key={t.type} onPress={() => setToy(t.type)} style={[styles.tile, toy === t.type && styles.tileSel]}>
                  <ToyArt type={t.type} color={color} size={52} />
                  <Text style={styles.tileText}>{t.name}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {kind === 'clothing' && (
          <>
            <View style={styles.preview}>
              <AnimalArt
                species={s.speciesId}
                colors={s.colors}
                expression="happy"
                size={190}
                head={clothInfo.slot === 'head' ? { type: cloth, color } : worn.head}
                neck={clothInfo.slot === 'neck' ? { type: cloth, color } : worn.neck}
              />
            </View>
            <Text style={styles.label}>Stil</Text>
            <View style={styles.chips}>
              <Chip
                label="👗 Weiblich"
                active={style === 'female'}
                color={C.pink}
                onPress={() => {
                  setStyle('female');
                  setCloth('bow');
                }}
              />
              <Chip
                label="👔 Männlich"
                active={style === 'male'}
                color={C.blue}
                onPress={() => {
                  setStyle('male');
                  setCloth('bowtie');
                }}
              />
            </View>
            <Text style={styles.label}>Was anziehen?</Text>
            <View style={styles.grid}>
              {clothes.map((c) => (
                <Pressable key={c.type} onPress={() => setCloth(c.type)} style={[styles.tile, cloth === c.type && styles.tileSel]}>
                  <ClothingIcon item={{ type: c.type, color }} size={52} />
                  <Text style={styles.tileText}>{c.name}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {kind !== null && (
          <>
            <Text style={styles.label}>Farbe</Text>
            <View style={styles.colors}>
              {ITEM_COLORS.map((c) => (
                <Pressable key={c.hex} onPress={() => setColor(c.hex)} style={styles.colorWrap}>
                  <View style={[styles.color, { backgroundColor: c.hex }, color === c.hex && styles.colorSel]} />
                  <Text style={styles.colorName}>{c.name}</Text>
                </Pressable>
              ))}
            </View>
            <Button title={kind === 'toy' ? 'Das nehm ich!' : 'Anziehen!'} icon="✨" onPress={take} style={{ marginTop: 18 }} />
            <Button title="Zurück" outline color={C.sub} small onPress={() => setKind(null)} style={{ marginTop: 10 }} />
          </>
        )}
      </ScrollView>
      <Confetti count={50} />
    </View>
  );
}

const styles = StyleSheet.create({
  choiceRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  choice: { width: '48%', backgroundColor: '#fff', borderRadius: R.l, padding: 14, alignItems: 'center', ...shadow },
  choiceText: { fontSize: 19, fontWeight: '900', color: C.ink, marginTop: 6 },
  preview: { alignItems: 'center', backgroundColor: '#fff', borderRadius: R.l, padding: 10, marginVertical: 12 },
  label: { fontSize: 17, fontWeight: '900', color: C.ink, marginTop: 12, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: '2.75%' },
  tile: { width: '31.5%', backgroundColor: '#fff', borderRadius: R.m, alignItems: 'center', paddingVertical: 8, marginBottom: 8, borderWidth: 3, borderColor: 'transparent' },
  tileSel: { borderColor: C.primary, backgroundColor: '#FFF1EA' },
  tileText: { fontSize: 12, fontWeight: '800', color: C.ink, marginTop: 2 },
  colors: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  colorWrap: { width: '19%', alignItems: 'center', marginBottom: 10 },
  color: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: '#0001' },
  colorSel: { borderWidth: 4, borderColor: C.ink, transform: [{ scale: 1.1 }] },
  colorName: { fontSize: 11, color: C.sub, fontWeight: '700', marginTop: 3 },
});
