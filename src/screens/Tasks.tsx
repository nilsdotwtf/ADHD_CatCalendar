import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MiniPet } from '../components/MiniPet';
import { Pet } from '../components/Pet';
import { TaskRow } from '../components/TaskRow';
import { Button, Card, H1, H2, Sub } from '../components/ui';
import { dayKey, NO_DUE } from '../logic/time';
import { useStore, useUI } from '../store';
import { C } from '../theme';

export function Tasks() {
  const insets = useSafeAreaInsets();
  const tasks = useStore((s) => s.tasks);
  const petName = useStore((s) => s.petName);
  const nickname = useStore((s) => s.nickname);
  const ui = useUI();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  const sorted = [...tasks].sort((a, b) => a.dueAt - b.dueAt);
  const due = sorted.filter((t) => t.dueAt <= now);
  const upcoming = sorted.filter((t) => t.dueAt > now && t.dueAt < NO_DUE);
  const today = upcoming.filter((t) => dayKey(t.dueAt) === dayKey(now));
  const later = upcoming.filter((t) => dayKey(t.dueAt) !== dayKey(now));
  const undated = sorted.filter((t) => t.dueAt >= NO_DUE);

  const speech =
    tasks.length === 0
      ? `Nichts zu tun! Ich bin happy, ${nickname}. 😊`
      : due.length === 0
        ? `Alles im Plan! Nichts ist überfällig. 🌟`
        : due.length === 1
          ? `Nur eine Sache – du schaffst das, ${nickname}!`
          : `Fang mit der kleinsten an – jede bringt eine Belohnung! 🎁`;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingTop: insets.top + 12, paddingBottom: 120 }}>
      <H1 style={{ marginBottom: 12 }}>Aufgaben</H1>
      <MiniPet text={speech} />
      <View style={styles.buttons}>
        <Button title="Neue Aufgabe" icon="➕" style={{ flex: 1 }} onPress={() => ui.open({ kind: 'taskPicker' })} />
        <Button title="Notizen" icon="📋" color={C.blue} style={{ marginLeft: 10 }} onPress={() => ui.open({ kind: 'import' })} />
      </View>

      {tasks.length === 0 && (
        <Card style={{ alignItems: 'center', marginTop: 10 }}>
          <Pet size={160} interactive={false} showEffects={false} expression="happy" />
          <H2>Alles erledigt! 🎉</H2>
          <Sub style={{ textAlign: 'center', marginTop: 6 }}>
            {petName} ist zufrieden. Leg eine Aufgabe an, wenn du magst – jede erledigte bringt Futter & Co.
          </Sub>
        </Card>
      )}

      {due.length > 0 && (
        <>
          <Text style={styles.section}>⚡ Jetzt dran ({due.length})</Text>
          {due.map((t) => (
            <TaskRow key={t.id} task={t} now={now} />
          ))}
        </>
      )}
      {today.length > 0 && (
        <>
          <Text style={styles.section}>☀️ Heute ({today.length})</Text>
          {today.map((t) => (
            <TaskRow key={t.id} task={t} now={now} />
          ))}
        </>
      )}
      {later.length > 0 && (
        <>
          <Text style={styles.section}>🗓️ Später ({later.length})</Text>
          {later.map((t) => (
            <TaskRow key={t.id} task={t} now={now} />
          ))}
        </>
      )}
      {undated.length > 0 && (
        <>
          <Text style={styles.section}>🌿 Ohne Datum ({undated.length})</Text>
          {undated.map((t) => (
            <TaskRow key={t.id} task={t} now={now} />
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  buttons: { flexDirection: 'row', marginBottom: 8 },
  section: { fontSize: 16, fontWeight: '900', color: C.sub, marginTop: 18, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
});
