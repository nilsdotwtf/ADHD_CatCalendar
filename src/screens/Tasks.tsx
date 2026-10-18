import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MiniPet } from '../components/MiniPet';
import { Pet } from '../components/Pet';
import { TaskRow } from '../components/TaskRow';
import { Button, Card, H1, H2, haptic, Sub } from '../components/ui';
import { dayStart, tasksForView } from '../logic/taskDays';
import { dayKey, endOfDay, NO_DUE, WEEKDAYS_LONG } from '../logic/time';
import { TaskView, useStore, useUI } from '../store';
import { C, R } from '../theme';

const DAYS_AHEAD = 7;

function viewLabel(view: TaskView, now: number): string {
  if (view === 'all') return 'Alle';
  if (view === 0) return 'Heute';
  if (view === 1) return 'Morgen';
  const d = new Date(dayStart(now, view));
  return `${WEEKDAYS_LONG[d.getDay()].slice(0, 2)} ${d.getDate()}.`;
}

export function Tasks() {
  const insets = useSafeAreaInsets();
  const tasks = useStore((s) => s.tasks);
  const petName = useStore((s) => s.petName);
  const nickname = useStore((s) => s.nickname);
  const doneToday = useStore((s) => s.doneToday);
  const ui = useUI();
  const view = ui.taskView;
  const [now, setNow] = useState(Date.now());
  const [showDone, setShowDone] = useState(false);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  const list = tasksForView(tasks, view, now);
  const doneItems = doneToday.day === dayKey(now) ? doneToday.items : [];
  const todayCount = tasksForView(tasks, 0, now).length;

  const speech = (() => {
    if (view !== 0) {
      return list.length
        ? `Vorarbeiten? Stark, ${nickname}! Jede Aufgabe bringt dir jetzt schon Belohnungen. 💪`
        : `Für ${viewLabel(view, now)} steht noch nichts an.`;
    }
    if (doneItems.length > 6) return `Schon ${doneItems.length} geschafft heute! Ich bin so stolz auf dich – gönn dir auch mal eine Pause. ☕`;
    if (list.length === 0 && doneItems.length > 0) return `Alles für heute geschafft! Du bist großartig, ${nickname}. 🎉`;
    if (list.length === 0) return `Nichts zu tun! Ich bin happy, ${nickname}. 😊`;
    const overdue = list.filter((t) => t.dueAt <= now).length;
    if (overdue === 0) return `Alles im Plan! Nichts ist überfällig. 🌟`;
    if (overdue === 1) return `Nur eine Sache – du schaffst das, ${nickname}!`;
    return `Fang mit der kleinsten an – jede bringt eine Belohnung! 🎁`;
  })();

  const select = (v: TaskView) => {
    haptic();
    ui.setTaskView(v);
  };

  // Abschnitte für die Heute-Ansicht
  const due = list.filter((t) => t.dueAt <= now);
  const laterToday = list.filter((t) => t.dueAt > now && t.dueAt <= endOfDay(now));
  const undated = list.filter((t) => t.dueAt >= NO_DUE);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingTop: insets.top + 12, paddingBottom: 120 }}>
      <H1 style={{ marginBottom: 12 }}>Aufgaben</H1>
      <MiniPet text={speech} />
      <View style={styles.buttons}>
        <Button title="Neue Aufgabe" icon="➕" style={{ flex: 1 }} onPress={() => ui.open({ kind: 'taskPicker' })} />
        <Button title="Notizen" icon="📋" color={C.blue} style={{ marginLeft: 10 }} onPress={() => ui.open({ kind: 'import' })} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayStrip} contentContainerStyle={{ paddingRight: 8 }}>
        {[...Array.from({ length: DAYS_AHEAD }, (_, i) => i as TaskView), 'all' as TaskView].map((v) => {
          const count = tasksForView(tasks, v, now).length;
          const active = view === v;
          return (
            <Pressable key={String(v)} onPress={() => select(v)} style={[styles.day, active && styles.dayActive]}>
              <Text style={[styles.dayText, active && { color: '#fff' }]}>{viewLabel(v, now)}</Text>
              <Text style={[styles.dayCount, active && { color: '#fff' }]}>{count}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {view === 0 ? (
        <>
          {list.length === 0 && (
            <Card style={{ alignItems: 'center', marginTop: 6 }}>
              <Pet size={150} interactive={false} showEffects={false} expression="happy" />
              <H2>{doneItems.length ? 'Alles für heute geschafft! 🎉' : 'Heute ist nichts geplant'}</H2>
              <Sub style={{ textAlign: 'center', marginTop: 6, marginBottom: 12 }}>
                {petName} ist zufrieden. Lust, schon für morgen vorzuarbeiten?
              </Sub>
              <Button title="Morgen vorarbeiten" icon="⏭️" small color={C.purple} onPress={() => select(1)} />
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
          {laterToday.length > 0 && (
            <>
              <Text style={styles.section}>☀️ Später heute ({laterToday.length})</Text>
              {laterToday.map((t) => (
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
          {list.length > 0 && todayCount > 0 && (
            <Pressable onPress={() => select(1)} style={styles.ahead}>
              <Text style={styles.aheadText}>⏭️ Zum nächsten Tag springen & vorarbeiten</Text>
            </Pressable>
          )}
        </>
      ) : (
        <>
          {list.length === 0 ? (
            <Card style={{ marginTop: 6 }}>
              <Sub>
                Für {viewLabel(view, now)} ist nichts geplant.{' '}
                {view !== 'all' && 'Leg was an – oder genieß den freien Tag. 🌴'}
              </Sub>
            </Card>
          ) : (
            list.map((t) => <TaskRow key={t.id} task={t} now={now} />)
          )}
          <Pressable onPress={() => select(0)} style={styles.ahead}>
            <Text style={styles.aheadText}>↩︎ Zurück zu heute</Text>
          </Pressable>
        </>
      )}

      {doneItems.length > 0 && (
        <Card style={{ marginTop: 18, backgroundColor: '#EFFBF5' }}>
          <Pressable onPress={() => setShowDone((v) => !v)} style={styles.doneHead}>
            <Text style={styles.doneTitle}>✅ Heute geschafft: {doneItems.length}</Text>
            <Text style={styles.doneToggle}>{showDone ? 'ausblenden' : 'anzeigen'}</Text>
          </Pressable>
          {showDone &&
            doneItems.map((d, i) => (
              <Text key={i} style={styles.doneItem}>
                {d.emoji} {d.title}
              </Text>
            ))}
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  buttons: { flexDirection: 'row', marginBottom: 8 },
  dayStrip: { marginTop: 8, marginBottom: 4, marginHorizontal: -16, paddingLeft: 16 },
  day: {
    minWidth: 64,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: R.m,
    backgroundColor: '#fff',
    marginRight: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: C.line,
  },
  dayActive: { backgroundColor: C.primary, borderColor: C.primary },
  dayText: { fontSize: 14, fontWeight: '900', color: C.ink },
  dayCount: { fontSize: 12, fontWeight: '800', color: C.sub, marginTop: 1 },
  section: { fontSize: 16, fontWeight: '900', color: C.sub, marginTop: 18, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  ahead: { alignSelf: 'center', marginTop: 14, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 999, backgroundColor: '#F1EBFF' },
  aheadText: { color: C.purple, fontWeight: '900', fontSize: 15 },
  doneHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  doneTitle: { fontSize: 16, fontWeight: '900', color: C.green },
  doneToggle: { fontSize: 13, fontWeight: '800', color: C.sub },
  doneItem: { fontSize: 15, color: C.sub, fontWeight: '700', marginTop: 8, textDecorationLine: 'line-through' },
});
