import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ClothingIcon } from '../components/AnimalArt';
import { Pet } from '../components/Pet';
import { ToyArt } from '../components/ToyArt';
import { Button, Card, H1, H2, haptic, Sub } from '../components/ui';
import { CONSUMABLES, consumableInfo, clothingInfo, ClothingSlot, TOYS } from '../data/items';
import { toyReady, useStore, useUI } from '../store';
import { C, R } from '../theme';

export function Wardrobe() {
  const insets = useSafeAreaInsets();
  const s = useStore();
  const ui = useUI();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  const slotItems = (slot: ClothingSlot) => s.clothes.filter((c) => clothingInfo(c.type).slot === slot);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingTop: insets.top + 12, paddingBottom: 120 }}>
      <H1 style={{ marginBottom: 6 }}>Schrank</H1>
      <Card style={{ alignItems: 'center' }}>
        <Pet size={190} />
        <Sub style={{ textAlign: 'center' }}>Tipp ein Teil an zum An- oder Ausziehen.</Sub>
      </Card>

      {(['head', 'neck'] as ClothingSlot[]).map((slot) => {
        const items = slotItems(slot);
        return (
          <View key={slot}>
            <H2 style={styles.section}>{slot === 'head' ? '🎩 Kopf' : '🎀 Hals'}</H2>
            {items.length === 0 ? (
              <Sub>Noch nichts hier – schaff 3 Aufgaben und hol dir im Bonus-Puzzle etwas Schickes!</Sub>
            ) : (
              <View style={styles.grid}>
                {items.map((c) => {
                  const on = s.equipped[slot] === c.id;
                  return (
                    <Pressable
                      key={c.id}
                      onPress={() => {
                        haptic();
                        s.equip(slot, on ? null : c.id);
                      }}
                      style={[styles.tile, on && styles.tileOn]}
                    >
                      <ClothingIcon item={c} size={56} />
                      <Text style={styles.tileText}>{clothingInfo(c.type).name}</Text>
                      {on && <Text style={styles.onBadge}>an</Text>}
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        );
      })}

      <H2 style={styles.section}>🎾 Spielzeug</H2>
      {s.toys.length === 0 ? (
        <Sub>Spielzeug gibt's als Bonus nach 3 erledigten Aufgaben.</Sub>
      ) : (
        <View style={styles.grid}>
          {s.toys.map((t) => {
            const ready = toyReady(t, now);
            return (
              <Pressable
                key={t.id}
                onPress={() => (ready ? ui.open({ kind: 'toy', toyId: t.id }) : ui.showToast(`${s.petName} braucht kurz Pause vom Spielen 😴`))}
                style={[styles.tile, !ready && { opacity: 0.5 }]}
              >
                <ToyArt type={t.type} color={t.color} size={56} />
                <Text style={styles.tileText}>{TOYS.find((x) => x.type === t.type)?.name}</Text>
                <Text style={styles.play}>{ready ? 'Spielen' : 'Pause'}</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <H2 style={styles.section}>🎒 Vorrat</H2>
      <View style={styles.grid}>
        {CONSUMABLES.map((id) => {
          const info = consumableInfo(id, s.speciesId);
          return (
            <View key={id} style={styles.tile}>
              <Text style={{ fontSize: 34 }}>{info.emoji}</Text>
              <Text style={styles.tileText}>
                {s.inventory[id]}× {info.name}
              </Text>
            </View>
          );
        })}
      </View>
      {s.puzzlesAvailable > 0 && (
        <Button title="Bonus-Puzzle spielen" icon="🧩" color={C.yellow} textColor={C.ink} onPress={() => ui.open({ kind: 'puzzle' })} style={{ marginTop: 12 }} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 20, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: '30.5%', backgroundColor: '#fff', borderRadius: R.m, alignItems: 'center', paddingVertical: 10, borderWidth: 3, borderColor: 'transparent' },
  tileOn: { borderColor: C.green, backgroundColor: '#EFFBF5' },
  tileText: { fontSize: 12, fontWeight: '800', color: C.ink, marginTop: 4, textAlign: 'center' },
  onBadge: { position: 'absolute', top: 4, right: 6, fontSize: 11, fontWeight: '900', color: C.green },
  play: { fontSize: 11, fontWeight: '900', color: C.primary, marginTop: 2 },
});
