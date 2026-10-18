import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Confetti } from '../components/Confetti';
import { MiniPet } from '../components/MiniPet';
import { Bounce, Button, Card, H1, haptic, ProgressBar } from '../components/ui';
import { Goal, GOALS, GoalReward, levelFromXp } from '../data/goals';
import { clothingInfo, consumableInfo, ConsumableId, TOYS } from '../data/items';
import { useStore, useUI } from '../store';
import { C, R } from '../theme';

function rewardText(r: GoalReward, species: Parameters<typeof consumableInfo>[1]): string {
  const parts: string[] = [`${r.xp} XP`];
  if (r.items) {
    for (const k of Object.keys(r.items) as ConsumableId[]) parts.push(`${r.items[k]}× ${consumableInfo(k, species).emoji}`);
  }
  if (r.puzzles) parts.push(`${r.puzzles}× 🧩`);
  if (r.toy) parts.push(`🎾 ${TOYS.find((t) => t.type === r.toy!.type)?.name}`);
  if (r.clothing) parts.push(`👑 ${clothingInfo(r.clothing.type).name}`);
  return parts.join(' · ');
}

export function Goals() {
  const insets = useSafeAreaInsets();
  const s = useStore();
  const ui = useUI();
  const [boom, setBoom] = useState(0);
  const lvl = levelFromXp(s.xp);

  const state = (g: Goal) => (s.goalsClaimed.includes(g.id) ? 2 : s.stats[g.stat] >= g.target ? 0 : 1);
  const sorted = [...GOALS].sort((a, b) => state(a) - state(b));
  const ready = sorted.filter((g) => state(g) === 0).length;
  const doneCount = s.goalsClaimed.length;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingTop: insets.top + 12, paddingBottom: 120 }}>
        <H1 style={{ marginBottom: 12 }}>Ziele</H1>
        <MiniPet
          text={
            ready > 0
              ? `${ready} Belohnung${ready === 1 ? '' : 'en'} wartet auf dich! Hol sie dir! 🎁`
              : `Jedes Ziel bringt tolle Sachen. ${doneCount}/${GOALS.length} geschafft!`
          }
        />
        <Card style={styles.level}>
          <Text style={styles.levelBig}>Level {lvl.level}</Text>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <ProgressBar value={lvl.into / lvl.needed} color={C.purple} />
            <Text style={styles.levelSub}>
              Noch {lvl.needed - lvl.into} XP bis Level {lvl.level + 1} – jedes Level bringt Geschenke!
            </Text>
          </View>
        </Card>
        <View style={styles.statsRow}>
          <Stat emoji="✅" value={s.stats.tasksDone} label="erledigt" />
          <Stat emoji="💧" value={s.stats.drinks} label="getrunken" />
          <Stat emoji="🔥" value={s.stats.bestStreak} label="Rekord-Serie" />
          <Stat emoji="🧩" value={s.stats.puzzles} label="Puzzles" />
        </View>

        {sorted.map((g) => {
          const st = state(g);
          const progress = Math.min(1, s.stats[g.stat] / g.target);
          return (
            <Card key={g.id} style={[styles.goal, st === 0 && styles.goalReady, st === 2 && { opacity: 0.6 }]}>
              <Text style={styles.goalEmoji}>{st === 2 ? '✅' : g.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.goalTitle}>{g.title}</Text>
                <Text style={styles.goalReward}>🎁 {rewardText(g.reward, s.speciesId)}</Text>
                {st === 1 && (
                  <View style={{ marginTop: 6 }}>
                    <ProgressBar value={progress} color={C.green} height={9} />
                    <Text style={styles.goalProgress}>
                      {Math.min(s.stats[g.stat], g.target)}/{g.target}
                    </Text>
                  </View>
                )}
              </View>
              {st === 0 && (
                <Bounce>
                  <Button
                    title="Holen!"
                    small
                    color={C.yellow}
                    textColor={C.ink}
                    onPress={() => {
                      haptic('success');
                      s.claimGoal(g.id);
                      setBoom((b) => b + 1);
                      ui.showToast(`Ziel geschafft: ${g.title} 🎉`);
                    }}
                  />
                </Bounce>
              )}
            </Card>
          );
        })}
      </ScrollView>
      {boom > 0 && <Confetti key={boom} />}
    </View>
  );
}

function Stat({ emoji, value, label }: { emoji: string; value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={{ fontSize: 22 }}>{emoji}</Text>
      <Text style={styles.statVal}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  level: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  levelBig: { fontSize: 24, fontWeight: '900', color: C.purple },
  levelSub: { fontSize: 13, color: C.sub, fontWeight: '600', marginTop: 6 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  stat: { width: '23.5%', backgroundColor: '#fff', borderRadius: R.m, alignItems: 'center', paddingVertical: 10 },
  statVal: { fontSize: 20, fontWeight: '900', color: C.ink },
  statLabel: { fontSize: 11, color: C.sub, fontWeight: '700', textAlign: 'center' },
  goal: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, padding: 14 },
  goalReady: { backgroundColor: '#FFF6D1', borderWidth: 2, borderColor: C.yellow },
  goalEmoji: { fontSize: 32, marginRight: 12 },
  goalTitle: { fontSize: 16, fontWeight: '900', color: C.ink },
  goalReward: { fontSize: 13, color: C.sub, fontWeight: '700', marginTop: 2 },
  goalProgress: { fontSize: 12, color: C.sub, fontWeight: '800', marginTop: 3 },
});
