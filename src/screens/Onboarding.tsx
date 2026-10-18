import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimalArt } from '../components/AnimalArt';
import { Bounce, Button, H1, haptic, Sub } from '../components/ui';
import { DEFAULT_COLOR_INDEX, getSpecies, SPECIES, SpeciesId } from '../data/animals';
import { notificationsSupported, requestNotificationPermission } from '../logic/notifications';
import { useStore } from '../store';
import { C, R, shadow } from '../theme';

const PLURAL_DAT: Record<SpeciesId, string> = {
  cat: 'Katzen',
  dog: 'Hunden',
  rabbit: 'Hasen',
  hamster: 'Hamstern',
  fox: 'Füchsen',
  giraffe: 'Giraffen',
  cow: 'Kühen',
  penguin: 'Pinguinen',
  budgie: 'Wellensittichen',
  tiger: 'Tigern',
};

type Step = 'welcome' | 'species' | 'colors' | 'petName' | 'nickname' | 'notify';
const ORDER: Step[] = ['welcome', 'species', 'colors', 'petName', 'nickname', 'notify'];

export function Onboarding() {
  const insets = useSafeAreaInsets();
  const finish = useStore((s) => s.finishOnboarding);
  const setNotificationsEnabled = useStore((s) => s.setNotificationsEnabled);
  const [step, setStep] = useState<Step>('welcome');
  const [speciesId, setSpeciesId] = useState<SpeciesId>('cat');
  const [colorIdx, setColorIdx] = useState<number[]>(DEFAULT_COLOR_INDEX.cat);
  const [activeSlot, setActiveSlot] = useState(0);
  const [petName, setPetName] = useState('');
  const [nickname, setNickname] = useState('');

  const sp = getSpecies(speciesId);
  const colors = sp.slots.map((slot, i) => slot.options[colorIdx[i] ?? 0].hex);
  const idx = ORDER.indexOf(step);
  const next = () => setStep(ORDER[Math.min(ORDER.length - 1, idx + 1)]);
  const back = () => setStep(ORDER[Math.max(0, idx - 1)]);

  const chooseSpecies = (id: SpeciesId) => {
    haptic();
    setSpeciesId(id);
    setColorIdx(DEFAULT_COLOR_INDEX[id]);
    setActiveSlot(0);
    setPetName('');
  };

  const complete = async (askPermission: boolean) => {
    let granted = false;
    if (askPermission) granted = await requestNotificationPermission();
    setNotificationsEnabled(granted);
    finish({ speciesId, colors, petName: petName.trim() || sp.defaultNames[0], nickname: nickname.trim() || 'Champion' });
  };

  const preview = (size: number, expression: 'happy' | 'neutral' = 'happy') => (
    <Bounce>
      <AnimalArt species={speciesId} colors={colors} expression={expression} size={size} />
    </Bounce>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.wrap, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        {idx > 0 && (
          <View style={styles.topRow}>
            <Pressable onPress={back} hitSlop={12}>
              <Text style={styles.back}>‹ Zurück</Text>
            </Pressable>
            <View style={styles.dots}>
              {ORDER.slice(1).map((s, i) => (
                <View key={s} style={[styles.dot, i < idx && { backgroundColor: C.primary, width: 18 }]} />
              ))}
            </View>
          </View>
        )}

        {step === 'welcome' && (
          <View style={styles.center}>
            <Text style={styles.bigEmoji}>🐾</Text>
            <H1 style={{ textAlign: 'center' }}>Willkommen bei Tierchen!</H1>
            <Sub style={{ textAlign: 'center', marginTop: 10 }}>
              Dein Tier hilft dir, Aufgaben zu schaffen. Jede erledigte Aufgabe bringt Belohnungen – und dein Tier wird
              glücklich. Kein Druck, nur kleine Erfolge. ✨
            </Sub>
            <View style={{ height: 30 }} />
            <Button title="Los geht's!" icon="🚀" onPress={next} />
          </View>
        )}

        {step === 'species' && (
          <>
            <H1>Wähle dein Tier</H1>
            <Sub>Keine Sorge, alle sind süß. 😊</Sub>
            <View style={styles.grid}>
              {SPECIES.map((s) => {
                const cols = s.slots.map((slot, i) => slot.options[DEFAULT_COLOR_INDEX[s.id][i]].hex);
                const active = s.id === speciesId;
                return (
                  <Pressable key={s.id} onPress={() => chooseSpecies(s.id)} style={[styles.speciesCard, active && styles.speciesActive]}>
                    <AnimalArt species={s.id} colors={cols} expression={active ? 'happy' : 'neutral'} size={92} />
                    <Text style={styles.speciesName}>{s.name}</Text>
                    <Text style={styles.speciesInfo}>{s.slots.length} Farben</Text>
                  </Pressable>
                );
              })}
            </View>
            <Button title={`${sp.name} nehmen`} icon={sp.emoji} onPress={next} />
          </>
        )}

        {step === 'colors' && (
          <>
            <H1>Farben für {sp.article === 'der' ? 'deinen' : 'deine'} {sp.name}</H1>
            <Sub>Alles echte Farben, die es bei {PLURAL_DAT[speciesId]} wirklich gibt.</Sub>
            <View style={styles.center}>{preview(210)}</View>
            <View style={styles.slotTabs}>
              {sp.slots.map((slot, i) => (
                <Pressable key={slot.label} onPress={() => setActiveSlot(i)} style={[styles.slotTab, activeSlot === i && styles.slotTabActive]}>
                  <View style={[styles.slotDot, { backgroundColor: colors[i] }]} />
                  <Text style={[styles.slotText, activeSlot === i && { color: '#fff' }]}>{slot.label}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.swatches}>
              {sp.slots[activeSlot].options.map((o, oi) => {
                const sel = colorIdx[activeSlot] === oi;
                return (
                  <Pressable
                    key={o.name + oi}
                    onPress={() => {
                      haptic();
                      setColorIdx((ci) => ci.map((v, i) => (i === activeSlot ? oi : v)));
                    }}
                    style={styles.swatchWrap}
                  >
                    <View style={[styles.swatch, { backgroundColor: o.hex }, sel && styles.swatchSel]} />
                    <Text style={styles.swatchName} numberOfLines={2}>
                      {o.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Button
              title={activeSlot < sp.slots.length - 1 ? `Weiter: ${sp.slots[activeSlot + 1].label}` : 'Sieht toll aus!'}
              onPress={() => (activeSlot < sp.slots.length - 1 ? setActiveSlot(activeSlot + 1) : next())}
            />
          </>
        )}

        {step === 'petName' && (
          <>
            <View style={styles.center}>{preview(170)}</View>
            <H1>Wie soll {sp.article === 'der' ? 'dein' : 'deine'} {sp.name} heißen?</H1>
            <TextInput
              value={petName}
              onChangeText={setPetName}
              placeholder={sp.defaultNames[0]}
              placeholderTextColor="#C9BBAE"
              style={styles.input}
              maxLength={20}
              autoFocus
              returnKeyType="next"
              onSubmitEditing={next}
            />
            <View style={styles.nameChips}>
              {sp.defaultNames.map((n) => (
                <Pressable key={n} onPress={() => setPetName(n)} style={styles.nameChip}>
                  <Text style={styles.nameChipText}>{n}</Text>
                </Pressable>
              ))}
            </View>
            <Button title="Weiter" onPress={next} />
          </>
        )}

        {step === 'nickname' && (
          <>
            <View style={styles.center}>{preview(150)}</View>
            <H1>Wie möchtest du in der App genannt werden?</H1>
            <Sub>{petName.trim() || sp.defaultNames[0]} wird dich so ansprechen. Spitzname, Fantasiename – alles erlaubt!</Sub>
            <TextInput
              value={nickname}
              onChangeText={setNickname}
              placeholder="z.B. Chef, Sonnenschein, Kapitän …"
              placeholderTextColor="#C9BBAE"
              style={styles.input}
              maxLength={24}
              autoFocus
              returnKeyType="next"
              onSubmitEditing={next}
            />
            <View style={styles.nameChips}>
              {['Chef', 'Sonnenschein', 'Kapitän', 'Superheld:in', 'Boss'].map((n) => (
                <Pressable key={n} onPress={() => setNickname(n)} style={styles.nameChip}>
                  <Text style={styles.nameChipText}>{n}</Text>
                </Pressable>
              ))}
            </View>
            <Button title="Weiter" onPress={next} />
          </>
        )}

        {step === 'notify' && (
          <View style={styles.center}>
            {preview(170)}
            <H1 style={{ textAlign: 'center' }}>Darf {petName.trim() || sp.defaultNames[0]} dich erinnern?</H1>
            <Sub style={{ textAlign: 'center', marginTop: 8 }}>
              💧 Morgens, mittags & abends ans Trinken{'\n'}⏰ An deine Aufgaben (so oft du willst){'\n'}🥺 Wenn{' '}
              {petName.trim() || sp.defaultNames[0]} sich langweilt
            </Sub>
            <View style={{ height: 24 }} />
            {notificationsSupported ? (
              <>
                <Button title="Ja, gerne!" icon="🔔" onPress={() => complete(true)} style={{ alignSelf: 'stretch' }} />
                <View style={{ height: 12 }} />
                <Button title="Später" outline color={C.sub} onPress={() => complete(false)} style={{ alignSelf: 'stretch' }} />
              </>
            ) : (
              <>
                <Sub style={{ textAlign: 'center', marginBottom: 12 }}>
                  (In der Browser-Vorschau gibt es keine Benachrichtigungen – auf dem Handy schon.)
                </Sub>
                <Button title="Fertig!" icon="🎉" onPress={() => complete(false)} style={{ alignSelf: 'stretch' }} />
              </>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 20, flexGrow: 1 },
  center: { alignItems: 'center', justifyContent: 'center', marginVertical: 10 },
  bigEmoji: { fontSize: 84, marginTop: 60, marginBottom: 16 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  back: { fontSize: 17, color: C.sub, fontWeight: '700' },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.line },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginVertical: 16 },
  speciesCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: R.l,
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: 'transparent',
    ...shadow,
  },
  speciesActive: { borderColor: C.primary, backgroundColor: '#FFF1EA' },
  speciesName: { fontSize: 17, fontWeight: '800', color: C.ink, marginTop: 2 },
  speciesInfo: { fontSize: 13, color: C.sub },
  slotTabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  slotTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 999,
    borderWidth: 2,
    borderColor: C.line,
  },
  slotTabActive: { backgroundColor: C.primary, borderColor: C.primary },
  slotDot: { width: 18, height: 18, borderRadius: 9, marginRight: 6, borderWidth: 1.5, borderColor: '#0002' },
  slotText: { fontWeight: '800', color: C.ink },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 18 },
  swatchWrap: { width: '19%', alignItems: 'center', marginBottom: 10 },
  swatch: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: '#0001' },
  swatchSel: { borderWidth: 4, borderColor: C.primary, transform: [{ scale: 1.08 }] },
  swatchName: { fontSize: 11, color: C.sub, textAlign: 'center', marginTop: 4, fontWeight: '600' },
  input: {
    backgroundColor: '#fff',
    borderRadius: R.m,
    fontSize: 22,
    fontWeight: '700',
    padding: 16,
    marginTop: 16,
    color: C.ink,
    borderWidth: 2,
    borderColor: C.line,
  },
  nameChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 14 },
  nameChip: { backgroundColor: '#FFE8DC', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999 },
  nameChipText: { color: C.primaryDark, fontWeight: '800' },
});
