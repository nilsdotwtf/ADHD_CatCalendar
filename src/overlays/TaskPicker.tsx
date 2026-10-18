import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Sheet } from '../components/Sheet';
import { haptic, Sub } from '../components/ui';
import { TASK_SUGGESTIONS } from '../data/tasks';
import { useUI } from '../store';
import { C, R, shadow } from '../theme';

export function TaskPicker() {
  const replace = useUI((s) => s.replace);
  return (
    <Sheet title="Was steht an?">
      <Pressable
        onPress={() => {
          haptic();
          replace({ kind: 'taskEditor' });
        }}
        style={[styles.tile, styles.custom]}
      >
        <Text style={styles.emoji}>✏️</Text>
        <Text style={[styles.label, { color: '#fff' }]}>Eigene Aufgabe erstellen</Text>
      </Pressable>
      <Pressable
        onPress={() => {
          haptic();
          replace({ kind: 'import' });
        }}
        style={[styles.tile, styles.importTile]}
      >
        <Text style={styles.emoji}>📋</Text>
        <Text style={[styles.label, { color: '#fff' }]}>Aus Notizen-App importieren</Text>
      </Pressable>
      <Sub style={{ marginVertical: 10 }}>Oder tipp einen Vorschlag an:</Sub>
      <View style={styles.grid}>
        {TASK_SUGGESTIONS.map((s) => (
          <Pressable
            key={s.title}
            onPress={() => {
              haptic();
              replace({ kind: 'taskEditor', preset: { title: s.title, emoji: s.emoji, need: s.need } });
            }}
            style={[styles.tile, styles.half]}
          >
            <Text style={styles.emoji}>{s.emoji}</Text>
            <Text style={styles.label} numberOfLines={2}>
              {s.title}
            </Text>
          </Pressable>
        ))}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  tile: {
    backgroundColor: '#fff',
    borderRadius: R.m,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadow,
  },
  half: { width: '48.5%', minHeight: 64 },
  custom: { backgroundColor: C.primary },
  importTile: { backgroundColor: C.blue },
  emoji: { fontSize: 26, marginRight: 10 },
  label: { flex: 1, fontSize: 15, fontWeight: '800', color: C.ink },
});
