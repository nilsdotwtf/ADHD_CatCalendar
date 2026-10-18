import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pet } from '../components/Pet';
import { TaskRow } from '../components/TaskRow';
import { ToyArt } from '../components/ToyArt';
import { Bounce, Button, Card, H2, haptic, ProgressBar, Sub } from '../components/ui';
import { getSpecies } from '../data/animals';
import { levelFromXp } from '../data/goals';
import { CONSUMABLES, consumableInfo, NEEDS, TOYS } from '../data/items';
import { statusText } from '../logic/status';
import { tasksForView } from '../logic/taskDays';
import { dayKey } from '../logic/time';
import { toyReady, useStore, useUI } from '../store';
import { C, R } from '../theme';

export function Home() {
  const insets = useSafeAreaInsets();
  const s = useStore();
  const ui = useUI();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  const sp = getSpecies(s.speciesId);
  const lvl = levelFromXp(s.xp);
  const todayTasks = tasksForView(s.tasks, 0, now);
  const upcoming = todayTasks.slice(0, 3);
  const doneCount = s.doneToday.day === dayKey(now) ? s.doneToday.items.length : 0;
  const status = statusText({ ...s, tasks: todayTasks, now, doneToday: doneCount });

  const onItem = (id: (typeof CONSUMABLES)[number]) => {
    const info = consumableInfo(id, s.speciesId);
    if (s.inventory[id] <= 0) {
      ui.showToast(`Kein ${info.name} mehr – erledige eine Aufgabe, dann gibt's Nachschub! 💪`);
      return;
    }
    if (s.needs[info.need] >= 100) {
      ui.showToast(`${s.petName} ist da gerade wunschlos glücklich 💯`);
      return;
    }
    ui.open({ kind: 'game', item: id });
  };

  const onDrink = () => {
    haptic('success');
    const n = s.drink();
    const msgs = [
      `💧 Prost! ${s.petName} trinkt mit.`,
      `💧 Super, ${s.nickname}! Schon ${n} heute.`,
      `💧 Hydriert & glücklich – ${s.petName} ist stolz!`,
    ];
    ui.showToast(msgs[n % msgs.length]);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingTop: insets.top + 12, paddingBottom: 120 }}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.hello}>Hallo {s.nickname}! 👋</Text>
          <View style={styles.levelRow}>
            <Text style={styles.level}>Level {lvl.level}</Text>
            <View style={{ flex: 1, marginHorizontal: 8 }}>
              <ProgressBar value={lvl.into / lvl.needed} color={C.purple} height={10} />
            </View>
            <Text style={styles.xp}>
              {lvl.into}/{lvl.needed} XP
            </Text>
          </View>
        </View>
        <View style={styles.streak}>
          <Text style={{ fontSize: 22 }}>🔥</Text>
          <Text style={styles.streakNum}>{s.streak}</Text>
        </View>
      </View>

      <Card style={styles.petCard}>
        <Text style={styles.petName}>
          {sp.emoji} {s.petName}
        </Text>
        <Pet size={230} />
        <View style={styles.speech}>
          <Text style={styles.speechText}>{status}</Text>
        </View>
        <View style={styles.needs}>
          {NEEDS.map((n) => (
            <View key={n.id} style={styles.need}>
              <Text style={styles.needLabel}>
                {n.emoji} {n.label}
              </Text>
              <ProgressBar value={s.needs[n.id] / 100} color={s.needs[n.id] < 30 ? C.red : n.color} />
            </View>
          ))}
        </View>
      </Card>

      <H2 style={styles.section}>Verwöhnen</H2>
      <View style={styles.items}>
        {CONSUMABLES.map((id) => {
          const info = consumableInfo(id, s.speciesId);
          const count = s.inventory[id];
          const urgent = count > 0 && s.needs[info.need] < 50;
          return (
            <Pressable key={id} onPress={() => onItem(id)} style={[styles.item, count === 0 && { opacity: 0.45 }]}>
              <Bounce active={urgent}>
                <Text style={{ fontSize: 34 }}>{info.emoji}</Text>
              </Bounce>
              <Text style={styles.itemName}>{info.action}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{count}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {s.toys.length > 0 && (
        <>
          <H2 style={styles.section}>Spielzeug</H2>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {s.toys.map((t) => {
              const ready = toyReady(t, now);
              return (
                <Pressable
                  key={t.id}
                  onPress={() =>
                    ready
                      ? ui.open({ kind: 'toy', toyId: t.id })
                      : ui.showToast(`${s.petName} ruht sich noch vom letzten Spiel aus 😴`)
                  }
                  style={[styles.toy, !ready && { opacity: 0.45 }]}
                >
                  <ToyArt type={t.type} color={t.color} size={50} />
                  <Text style={styles.itemName}>{TOYS.find((x) => x.type === t.type)?.name}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </>
      )}

      <Card style={{ marginTop: 16, backgroundColor: s.puzzlesAvailable > 0 ? '#FFF3C4' : '#fff' }}>
        {s.puzzlesAvailable > 0 ? (
          <>
            <Bounce>
              <Text style={styles.bonusTitle}>🎁 Bonus-Puzzle bereit{s.puzzlesAvailable > 1 ? ` (${s.puzzlesAvailable})` : ''}!</Text>
            </Bounce>
            <Sub style={{ marginBottom: 10 }}>Löse es und such dir ein Spielzeug oder ein Outfit aus.</Sub>
            <Button title="Puzzle spielen" icon="🧩" color={C.yellow} textColor={C.ink} onPress={() => ui.open({ kind: 'puzzle' })} />
          </>
        ) : (
          <>
            <Text style={styles.bonusTitle}>🎁 Bonus-Belohnung</Text>
            <Sub>Noch {3 - s.bonusProgress} Aufgabe{3 - s.bonusProgress === 1 ? '' : 'n'} bis zum Bonus-Puzzle!</Sub>
            <View style={styles.bonusDots}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={[styles.bonusDot, i < s.bonusProgress && styles.bonusDotOn]}>
                  <Text style={{ fontSize: 18 }}>{i < s.bonusProgress ? '⭐' : ''}</Text>
                </View>
              ))}
              <Text style={{ fontSize: 28, marginLeft: 6 }}>🎁</Text>
            </View>
          </>
        )}
      </Card>

      <Card style={[styles.drink]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.bonusTitle}>💧 Trinken</Text>
          <Sub>
            Heute: {s.drinksToday.count} {s.drinksToday.count === 1 ? 'Glas' : 'Gläser'}{' '}
            {'💧'.repeat(Math.min(s.drinksToday.count, 8))}
          </Sub>
        </View>
        <Button title="Getrunken!" small color={C.blue} onPress={onDrink} />
      </Card>

      <View style={styles.tasksHead}>
        <H2>Heute{doneCount ? ` · ${doneCount} geschafft ✅` : ''}</H2>
        <Pressable
          onPress={() => {
            ui.setTaskView(0);
            ui.setTab('tasks');
          }}
        >
          <Text style={styles.link}>Alle ›</Text>
        </Pressable>
      </View>
      {upcoming.length === 0 ? (
        <Card>
          <Sub>
            {doneCount
              ? `Alles für heute geschafft! ${s.petName} ist mega stolz auf dich. 🎉`
              : `Gerade keine Aufgaben – ${s.petName} ist zufrieden. Lust auf eine kleine Sache?`}
          </Sub>
          {s.tasks.length > 0 && (
            <Button
              title="Für morgen vorarbeiten"
              icon="⏭️"
              small
              color={C.purple}
              style={{ marginTop: 10 }}
              onPress={() => {
                ui.setTaskView(1);
                ui.setTab('tasks');
              }}
            />
          )}
        </Card>
      ) : (
        upcoming.map((t) => <TaskRow key={t.id} task={t} now={now} />)
      )}
      <Button title="Aufgabe hinzufügen" icon="➕" style={{ marginTop: 12 }} onPress={() => ui.open({ kind: 'taskPicker' })} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  hello: { fontSize: 24, fontWeight: '900', color: C.ink },
  levelRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  level: { fontWeight: '900', color: C.purple },
  xp: { fontSize: 12, color: C.sub, fontWeight: '700' },
  streak: { alignItems: 'center', backgroundColor: '#FFE3D6', borderRadius: R.m, paddingHorizontal: 12, paddingVertical: 6, marginLeft: 12 },
  streakNum: { fontWeight: '900', color: C.primaryDark },
  petCard: { alignItems: 'center', paddingTop: 12 },
  petName: { fontSize: 22, fontWeight: '900', color: C.ink },
  speech: { backgroundColor: '#FFF1E6', borderRadius: R.m, padding: 12, marginTop: 4, alignSelf: 'stretch' },
  speechText: { fontSize: 15, color: C.ink, fontWeight: '600', textAlign: 'center', lineHeight: 21 },
  needs: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignSelf: 'stretch', marginTop: 12 },
  need: { width: '48%', marginBottom: 10 },
  needLabel: { fontSize: 13, fontWeight: '800', color: C.sub, marginBottom: 4 },
  section: { marginTop: 20, marginBottom: 10 },
  items: { flexDirection: 'row', justifyContent: 'space-between' },
  item: { width: '23%', backgroundColor: '#fff', borderRadius: R.m, alignItems: 'center', paddingVertical: 12 },
  itemName: { fontSize: 12, fontWeight: '800', color: C.ink, marginTop: 4 },
  badge: { position: 'absolute', top: 6, right: 6, backgroundColor: C.primary, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  badgeText: { color: '#fff', fontWeight: '900', fontSize: 12 },
  toy: { backgroundColor: '#fff', borderRadius: R.m, alignItems: 'center', padding: 10, marginRight: 10, width: 90 },
  bonusTitle: { fontSize: 18, fontWeight: '900', color: C.ink, marginBottom: 4 },
  bonusDots: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  bonusDot: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3E7DA', marginRight: 8, alignItems: 'center', justifyContent: 'center' },
  bonusDotOn: { backgroundColor: '#FFE58A' },
  drink: { marginTop: 16, flexDirection: 'row', alignItems: 'center' },
  tasksHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 22, marginBottom: 10 },
  link: { color: C.primary, fontWeight: '800', fontSize: 16 },
});
