import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useStore } from '../store';
import { C, R } from '../theme';
import { AnimalArt } from './AnimalArt';
import { expressionFor, useWorn } from './Pet';

/** Kleines Tier mit Sprechblase für Bildschirm-Köpfe – das Tier ist überall dabei. */
export function MiniPet({ text, size = 74 }: { text: string; size?: number }) {
  const species = useStore((s) => s.speciesId);
  const colors = useStore((s) => s.colors);
  const needs = useStore((s) => s.needs);
  const worn = useWorn();
  return (
    <View style={styles.row}>
      <AnimalArt species={species} colors={colors} expression={expressionFor(needs)} size={size} head={worn.head} neck={worn.neck} />
      <View style={styles.bubble}>
        <View style={styles.tail} />
        <Text style={styles.text}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  bubble: { flex: 1, backgroundColor: '#fff', borderRadius: R.m, padding: 12, marginLeft: 10 },
  tail: {
    position: 'absolute',
    left: -8,
    top: '50%',
    marginTop: -8,
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderRightWidth: 10,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: '#fff',
  },
  text: { fontSize: 15, fontWeight: '700', color: C.ink, lineHeight: 20 },
});
