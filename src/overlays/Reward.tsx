import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import { Confetti } from '../components/Confetti';
import { Pet } from '../components/Pet';
import { Button, haptic } from '../components/ui';
import { consumableInfo, ConsumableId } from '../data/items';
import { BREAK_AFTER, breakLine, motivationLine } from '../data/motivation';
import { CompletionResult, LevelUpReward, useStore, useUI } from '../store';
import { C, R } from '../theme';

const PRAISE = [
  'Geschafft! 🎉',
  'Mega gemacht! 🌟',
  'Wow, erledigt! 💪',
  'Du bist spitze! 🏆',
  'Yesss! ✨',
  'Stark! 🔥',
];

function usePop() {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(v, { toValue: 1, friction: 5, tension: 120, useNativeDriver: Platform.OS !== 'web' }).start();
  }, [v]);
  return v;
}

export function Reward({ result, taskTitle }: { result: CompletionResult; taskTitle: string }) {
  const species = useStore((s) => s.speciesId);
  const petName = useStore((s) => s.petName);
  const nickname = useStore((s) => s.nickname);
  const ui = useUI();
  const pop = usePop();
  const info = consumableInfo(result.item, species);
  const praise = useRef(PRAISE[Math.floor(Math.random() * PRAISE.length)]).current;
  const line = useRef(motivationLine(nickname, petName)).current;
  const askBreak = result.doneToday > BREAK_AFTER;
  useEffect(() => haptic('success'), []);

  const scale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });
  return (
    <View style={styles.backdrop}>
      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
        <Text style={styles.title}>{praise}</Text>
        <Text style={styles.task} numberOfLines={2}>
          „{taskTitle}“
        </Text>
        <View style={styles.quote}>
          <Text style={styles.quoteText}>{line}</Text>
        </View>
        <Pet size={askBreak ? 90 : 120} expression="love" showEffects={false} interactive={false} />
        {askBreak && (
          <View style={styles.breakBox}>
            <Text style={styles.breakText}>{breakLine(result.doneToday, nickname, petName)}</Text>
          </View>
        )}
        <View style={styles.loot}>
          <Text style={{ fontSize: 46 }}>{info.emoji}</Text>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={styles.lootTitle}>+1 {info.name}</Text>
            <Text style={styles.lootSub}>damit kannst du {petName} verwöhnen</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <Text style={styles.xp}>+{result.xp} XP</Text>
          {result.streak > 1 && <Text style={styles.streak}>🔥 {result.streak} Tage</Text>}
        </View>
        <View style={styles.stars}>
          {[0, 1, 2].map((i) => (
            <Text key={i} style={[styles.star, i >= result.bonusProgress && { opacity: 0.2 }]}>
              ⭐
            </Text>
          ))}
          <Text style={styles.starHint}>
            {result.bonusUnlocked ? 'Bonus freigeschaltet!' : `${3 - result.bonusProgress} bis zum Bonus`}
          </Text>
        </View>

        {askBreak ? (
          <>
            <Button
              title="Ja, Pause machen"
              icon="☕"
              color={C.green}
              onPress={() => {
                ui.close();
                ui.showToast(`Gute Entscheidung! ${petName} macht mit dir Pause. 😌`);
              }}
              style={styles.btn}
            />
            {result.bonusUnlocked && (
              <Button title="Erst noch das Bonus-Puzzle" icon="🧩" small outline color={C.primary} onPress={() => ui.replace({ kind: 'puzzle' })} style={[styles.btn, { marginTop: 8 }]} />
            )}
          </>
        ) : result.bonusUnlocked ? (
          <Button title="Bonus-Puzzle spielen!" icon="🧩" color={C.yellow} textColor={C.ink} onPress={() => ui.replace({ kind: 'puzzle' })} style={styles.btn} />
        ) : (
          <Button title={`Gleich ${info.action.toLowerCase()}`} icon={info.emoji} onPress={() => ui.replace({ kind: 'game', item: result.item as ConsumableId })} style={styles.btn} />
        )}
        <Button title={askBreak ? 'Nein, ich mach weiter 💪' : 'Weiter'} outline color={C.sub} onPress={ui.close} style={[styles.btn, { marginTop: 8 }]} small />
      </Animated.View>
      <Confetti />
    </View>
  );
}

export function LevelUp({ reward }: { reward: LevelUpReward }) {
  const species = useStore((s) => s.speciesId);
  const popLevelUp = useStore((s) => s.popLevelUp);
  const pop = usePop();
  useEffect(() => haptic('success'), []);
  const scale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });
  return (
    <View style={styles.backdrop}>
      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
        <Text style={{ fontSize: 60 }}>🆙</Text>
        <Text style={styles.title}>Level {reward.level}!</Text>
        <Text style={styles.task}>Du levelst auf! Hier ist dein Geschenk:</Text>
        <View style={styles.giftRow}>
          {(Object.keys(reward.items) as ConsumableId[]).map((k) => (
            <View key={k} style={styles.gift}>
              <Text style={{ fontSize: 34 }}>{consumableInfo(k, species).emoji}</Text>
              <Text style={styles.giftText}>+{reward.items[k]}</Text>
            </View>
          ))}
          {reward.puzzle && (
            <View style={styles.gift}>
              <Text style={{ fontSize: 34 }}>🧩</Text>
              <Text style={styles.giftText}>Puzzle</Text>
            </View>
          )}
        </View>
        <Button title="Juhu!" icon="🎉" onPress={popLevelUp} style={styles.btn} />
      </Animated.View>
      <Confetti count={60} />
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: C.overlay, alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: C.bg, borderRadius: R.xl, padding: 22, alignItems: 'center', width: '100%', maxWidth: 420 },
  title: { fontSize: 30, fontWeight: '900', color: C.ink, textAlign: 'center' },
  task: { fontSize: 15, color: C.sub, fontWeight: '700', textAlign: 'center', marginTop: 4 },
  quote: { backgroundColor: '#fff', borderRadius: R.m, padding: 12, marginTop: 10, alignSelf: 'stretch' },
  quoteText: { fontSize: 16, fontWeight: '800', color: C.ink, textAlign: 'center', lineHeight: 22 },
  breakBox: { backgroundColor: '#E6F7EE', borderRadius: R.m, padding: 12, alignSelf: 'stretch', marginBottom: 6 },
  breakText: { fontSize: 15, fontWeight: '800', color: '#1F7A52', textAlign: 'center', lineHeight: 21 },
  loot: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: R.m, padding: 12, alignSelf: 'stretch', marginTop: 4 },
  lootTitle: { fontSize: 20, fontWeight: '900', color: C.ink },
  lootSub: { fontSize: 13, color: C.sub, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  xp: { fontSize: 18, fontWeight: '900', color: C.purple, backgroundColor: '#F1EBFF', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, overflow: 'hidden' },
  streak: { fontSize: 18, fontWeight: '900', color: C.primaryDark, backgroundColor: '#FFE3D6', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, overflow: 'hidden' },
  stars: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  star: { fontSize: 28, marginHorizontal: 2 },
  starHint: { marginLeft: 8, fontWeight: '800', color: C.sub },
  btn: { alignSelf: 'stretch', marginTop: 16 },
  giftRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 14 },
  gift: { backgroundColor: '#fff', borderRadius: R.m, padding: 10, margin: 5, alignItems: 'center', minWidth: 70 },
  giftText: { fontWeight: '900', color: C.ink, marginTop: 2 },
});
