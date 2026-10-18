import * as Clipboard from 'expo-clipboard';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Sheet } from '../components/Sheet';
import { Button, Chip, haptic, Sub } from '../components/ui';
import { guessTaskMeta } from '../data/tasks';
import { parseNotes } from '../logic/notesImport';
import { DUE_OPTIONS, Repeat, REPEAT_LABEL } from '../logic/time';
import { useStore, useUI } from '../store';
import { C, R } from '../theme';

export function NotesImport() {
  const addTasks = useStore((s) => s.addTasks);
  const petName = useStore((s) => s.petName);
  const ui = useUI();
  const [text, setText] = useState('');
  const [skip, setSkip] = useState<Record<string, boolean>>({});
  const [dueKey, setDueKey] = useState('today');
  const [repeat, setRepeat] = useState<Repeat>('none');

  const parsed = useMemo(() => parseNotes(text), [text]);
  // Bereits abgehakte Einträge standardmäßig nicht übernehmen
  const isSelected = (title: string, done: boolean) => (title in skip ? !skip[title] : !done);
  const selected = parsed.filter((p) => isSelected(p.title, p.done));

  const paste = async () => {
    try {
      const clip = await Clipboard.getStringAsync();
      if (!clip.trim()) {
        ui.showToast('Die Zwischenablage ist leer – kopier zuerst deine Liste 📋');
        return;
      }
      setText((t) => (t ? t + '\n' : '') + clip);
      setSkip({});
      haptic('success');
    } catch {
      ui.showToast('Einfügen ging nicht – füge den Text einfach unten ins Feld ein.');
    }
  };

  const doImport = () => {
    if (selected.length === 0) return;
    const now = Date.now();
    const opt = DUE_OPTIONS.find((d) => d.key === dueKey)!;
    const dueAt = opt.time(now);
    addTasks(
      selected.map((p) => {
        const meta = guessTaskMeta(p.title);
        return { title: p.title, emoji: meta.emoji, need: meta.need, repeat, reminderMinutes: null, dueAt, dueMode: opt.mode };
      }),
      true,
    );
    haptic('success');
    ui.showToast(`${selected.length} Aufgaben importiert! ${petName} ist beeindruckt 🤩`);
    ui.close();
  };

  return (
    <Sheet
      title="Aus Notizen importieren"
      footer={
        <Button
          title={selected.length ? `${selected.length} Aufgabe${selected.length === 1 ? '' : 'n'} übernehmen` : 'Erst Text einfügen'}
          icon="📥"
          disabled={selected.length === 0}
          onPress={doImport}
        />
      }
    >
      <View style={styles.howto}>
        <Text style={styles.howtoTitle}>So geht's (3 Schritte):</Text>
        <Text style={styles.howtoText}>1. Öffne deine Notizen-App (Apple Notizen, Google Notizen, Samsung Notes …)</Text>
        <Text style={styles.howtoText}>2. Markiere deine Liste und tippe auf „Kopieren“</Text>
        <Text style={styles.howtoText}>3. Komm zurück und tippe hier auf „Einfügen“</Text>
      </View>
      <Button title="Aus Zwischenablage einfügen" icon="📋" color={C.blue} onPress={paste} />
      <TextInput
        value={text}
        onChangeText={(t) => {
          setText(t);
          setSkip({});
        }}
        multiline
        placeholder={'…oder hier eintippen/einfügen, eine Aufgabe pro Zeile:\n- Wäsche waschen\n☐ Steuer machen\n• Oma anrufen'}
        placeholderTextColor="#C9BBAE"
        style={styles.textarea}
        textAlignVertical="top"
      />

      {parsed.length > 0 && (
        <>
          <Text style={styles.label}>Gefunden: {parsed.length} – tippe an, was du übernehmen willst</Text>
          {parsed.map((p) => {
            const on = isSelected(p.title, p.done);
            const meta = guessTaskMeta(p.title);
            return (
              <Pressable
                key={p.title}
                onPress={() => {
                  haptic();
                  setSkip((s) => ({ ...s, [p.title]: on }));
                }}
                style={[styles.item, !on && { opacity: 0.45 }]}
              >
                <View style={[styles.box, on && styles.boxOn]}>{on && <Text style={styles.boxCheck}>✓</Text>}</View>
                <Text style={{ fontSize: 22, marginRight: 8 }}>{meta.emoji}</Text>
                <Text style={[styles.itemText, p.done && { textDecorationLine: 'line-through' }]} numberOfLines={2}>
                  {p.title}
                </Text>
              </Pressable>
            );
          })}

          <Text style={styles.label}>📅 Fällig</Text>
          <View style={styles.chips}>
            {DUE_OPTIONS.map((d) => (
              <Chip key={d.key} label={d.label} active={dueKey === d.key} onPress={() => setDueKey(d.key)} color={C.blue} />
            ))}
          </View>
          <Text style={styles.label}>🔁 Wiederholen</Text>
          <View style={styles.chips}>
            {(Object.keys(REPEAT_LABEL) as Repeat[]).map((r) => (
              <Chip key={r} label={r === 'none' ? 'Nein' : REPEAT_LABEL[r]} active={repeat === r} onPress={() => setRepeat(r)} />
            ))}
          </View>
          <Sub>Erinnerungen & Details kannst du danach pro Aufgabe einstellen.</Sub>
        </>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  howto: { backgroundColor: '#EAF1FF', borderRadius: R.m, padding: 12, marginBottom: 12 },
  howtoTitle: { fontWeight: '900', color: C.ink, marginBottom: 4 },
  howtoText: { color: C.ink, fontSize: 14, lineHeight: 20 },
  textarea: {
    backgroundColor: '#fff',
    borderRadius: R.m,
    minHeight: 110,
    padding: 12,
    fontSize: 16,
    color: C.ink,
    marginTop: 12,
    borderWidth: 2,
    borderColor: C.line,
  },
  label: { fontSize: 16, fontWeight: '900', color: C.ink, marginTop: 16, marginBottom: 8 },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: R.m, padding: 10, marginBottom: 6 },
  box: { width: 26, height: 26, borderRadius: 8, borderWidth: 2.5, borderColor: C.line, marginRight: 10, alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: C.green, borderColor: C.green },
  boxCheck: { color: '#fff', fontWeight: '900' },
  itemText: { flex: 1, fontSize: 16, fontWeight: '700', color: C.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
});
