import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Sheet } from '../components/Sheet';
import { Button, Chip, haptic, Sub } from '../components/ui';
import { NeedId } from '../data/items';
import { EMOJI_CHOICES, guessTaskMeta } from '../data/tasks';
import {
  dayKey,
  daysBetween,
  DUE_OPTIONS,
  endOfDay,
  EVENING_REMINDER_HOUR,
  formatClock,
  formatDue,
  formatInterval,
  Repeat,
  REPEAT_LABEL,
  WEEKDAYS_LONG,
} from '../logic/time';
import { useStore, useUI } from '../store';
import { C, R } from '../theme';

type ReminderMode = 'none' | 'once' | '30' | '60' | 'custom';

const QUICK_TIMES: [number, number][] = [
  [8, 0],
  [10, 0],
  [12, 0],
  [15, 0],
  [18, 0],
  [20, 0],
];

/** Startwerte für "Tag & Uhrzeit": vorhandene Zeit oder die nächste volle Stunde */
function initialPick(existingDue: number | undefined, mode: string | undefined) {
  const now = Date.now();
  if (existingDue && mode !== 'none' && existingDue < 8.64e15) {
    const d = new Date(existingDue);
    const day = Math.max(0, Math.min(6, daysBetween(dayKey(now), dayKey(existingDue))));
    return { day, h: mode === 'today' ? 18 : d.getHours(), m: mode === 'today' ? 0 : d.getMinutes(), anytime: mode === 'today' };
  }
  const d = new Date(now + 60 * 60 * 1000);
  if (d.getHours() >= 22 || d.getHours() < 7) return { day: 1, h: 9, m: 0, anytime: false };
  return { day: 0, h: d.getHours(), m: 0, anytime: false };
}

export function TaskEditor({ taskId, preset }: { taskId?: string; preset?: { title: string; emoji: string; need: NeedId } }) {
  const existing = useStore((s) => s.tasks.find((t) => t.id === taskId));
  const addTask = useStore((s) => s.addTask);
  const updateTask = useStore((s) => s.updateTask);
  const deleteTask = useStore((s) => s.deleteTask);
  const petName = useStore((s) => s.petName);
  const ui = useUI();

  const [title, setTitle] = useState(existing?.title ?? preset?.title ?? '');
  const [emoji, setEmoji] = useState(existing?.emoji ?? preset?.emoji ?? '');
  const [repeat, setRepeat] = useState<Repeat>(existing?.repeat ?? 'none');
  // Neue Aufgaben: standardmäßig "Heute irgendwann" – kein Zeitdruck, abends kommt eine Erinnerung
  const [dueKey, setDueKey] = useState<string | null>(() => {
    if (!existing) return 'today';
    if (existing.dueMode === 'none') return 'none';
    const isToday = dayKey(existing.dueAt) === dayKey(Date.now());
    if (existing.dueMode === 'today' && isToday) return 'today';
    return 'custom';
  });
  const [pick, setPick] = useState(() => initialPick(existing?.dueAt, existing?.dueMode));
  const initialRem = existing?.reminderMinutes ?? null;
  const [mode, setMode] = useState<ReminderMode>(
    initialRem == null ? 'none' : initialRem === 0 ? 'once' : initialRem === 30 ? '30' : initialRem === 60 ? '60' : 'custom',
  );
  const [hours, setHours] = useState(initialRem && mode === 'custom' ? Math.floor(initialRem / 60) : 2);
  const [minutes, setMinutes] = useState(initialRem && mode === 'custom' ? initialRem % 60 : 0);

  const customTotal = Math.max(5, hours * 60 + minutes);
  const reminderMinutes = mode === 'none' ? null : mode === 'once' ? 0 : mode === '30' ? 30 : mode === '60' ? 60 : customTotal;
  const autoEmoji = guessTaskMeta(title).emoji;
  const shownEmoji = emoji || autoEmoji;

  const save = () => {
    const t = title.trim();
    if (!t) {
      ui.showToast('Gib der Aufgabe noch einen Namen ✏️');
      return;
    }
    const now = Date.now();
    const meta = guessTaskMeta(t);
    const need = preset?.need ?? existing?.need ?? meta.need;
    let dueAt: number;
    let dueMode: 'time' | 'today' | 'none';
    if (dueKey === 'custom') {
      const d = new Date(now);
      d.setDate(d.getDate() + pick.day);
      d.setHours(pick.h, pick.m, 0, 0);
      dueAt = pick.anytime ? endOfDay(d.getTime()) : d.getTime();
      dueMode = pick.anytime ? 'today' : 'time';
    } else {
      const opt = dueKey ? DUE_OPTIONS.find((d) => d.key === dueKey)! : null;
      // Unveränderte "Heute irgendwann"-Aufgabe behält ihren Tag
      const keepDay = existing && opt?.mode === 'today' && existing.dueMode === 'today';
      dueAt = opt && !keepDay ? opt.time(now) : existing!.dueAt;
      dueMode = opt ? opt.mode : (existing?.dueMode ?? 'time');
    }
    if (existing) {
      updateTask(existing.id, { title: t, emoji: shownEmoji, need, repeat, reminderMinutes, dueAt, dueMode });
      ui.showToast('Gespeichert ✅');
    } else {
      addTask({ title: t, emoji: shownEmoji, need, repeat, reminderMinutes, dueAt, dueMode });
      ui.showToast(`${petName} freut sich schon auf die Belohnung! 🎁`);
    }
    haptic('success');
    ui.close();
  };

  const step = (setter: (fn: (v: number) => number) => void, delta: number, min: number, max: number) => () => {
    haptic();
    setter((v) => Math.max(min, Math.min(max, v + delta)));
  };

  return (
    <Sheet
      title={existing ? 'Aufgabe bearbeiten' : 'Neue Aufgabe'}
      footer={
        <View style={{ flexDirection: 'row' }}>
          {existing && (
            <Button
              title="Löschen"
              outline
              color={C.red}
              style={{ marginRight: 10 }}
              onPress={() => {
                deleteTask(existing.id);
                ui.close();
              }}
            />
          )}
          <Button title={existing ? 'Speichern' : 'Aufgabe anlegen'} icon="✨" style={{ flex: 1 }} onPress={save} />
        </View>
      }
    >
      <View style={styles.titleRow}>
        <Text style={styles.bigEmoji}>{shownEmoji}</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Was möchtest du erledigen?"
          placeholderTextColor="#C9BBAE"
          style={styles.input}
          autoFocus={!existing && !preset}
          maxLength={80}
        />
      </View>
      <View style={styles.emojiRow}>
        {EMOJI_CHOICES.map((e) => (
          <Pressable key={e} onPress={() => setEmoji(e)} style={[styles.emojiBtn, shownEmoji === e && styles.emojiSel]}>
            <Text style={{ fontSize: 22 }}>{e}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>🔁 Wiederholen?</Text>
      <View style={styles.chips}>
        {(Object.keys(REPEAT_LABEL) as Repeat[]).map((r) => (
          <Chip key={r} label={r === 'none' ? 'Nein' : REPEAT_LABEL[r]} active={repeat === r} onPress={() => setRepeat(r)} />
        ))}
      </View>

      <Text style={styles.label}>📅 Wann?</Text>
      {existing && dueKey == null && <Sub style={{ marginBottom: 8 }}>Aktuell: {formatDue(existing.dueAt, Date.now(), existing.dueMode)}</Sub>}
      <View style={styles.chips}>
        {DUE_OPTIONS.map((d) => (
          <Chip key={d.key} label={d.label} active={dueKey === d.key} onPress={() => setDueKey(d.key)} color={C.blue} />
        ))}
        <Chip label="🕐 Tag & Uhrzeit wählen…" active={dueKey === 'custom'} onPress={() => setDueKey('custom')} color={C.blue} />
      </View>
      {dueKey === 'custom' && <DayTimePicker pick={pick} onChange={setPick} />}
      {dueKey === 'today' && (
        <Sub>
          🌙 Kein fester Zeitpunkt – {petName} erinnert dich um {EVENING_REMINDER_HOUR}:00 Uhr, falls du es noch nicht erledigt hast.
        </Sub>
      )}
      {dueKey === 'none' && <Sub>Ohne Datum wird die Aufgabe nie überfällig – erledige sie, wann es passt.</Sub>}

      <Text style={styles.label}>🔔 Erinnern?</Text>
      <View style={styles.chips}>
        <Chip label="Nein" active={mode === 'none'} onPress={() => setMode('none')} color={C.purple} />
        {dueKey !== 'none' && !(dueKey === 'today' || (dueKey === 'custom' && pick.anytime)) && (
          <Chip label="Einmal zur Uhrzeit" active={mode === 'once'} onPress={() => setMode('once')} color={C.purple} />
        )}
        <Chip label="Jede halbe Stunde" active={mode === '30'} onPress={() => setMode('30')} color={C.purple} />
        <Chip label="Jede Stunde" active={mode === '60'} onPress={() => setMode('60')} color={C.purple} />
        <Chip label="Eigene Zeit…" active={mode === 'custom'} onPress={() => setMode('custom')} color={C.purple} />
      </View>
      {mode === 'custom' && (
        <View style={styles.custom}>
          <View style={styles.stepRow}>
            <Stepper label="Stunden" value={hours} onMinus={step(setHours, -1, 0, 999)} onPlus={step(setHours, 1, 0, 999)} onChange={(v) => setHours(Math.min(999, v))} />
            <Stepper label="Minuten" value={minutes} onMinus={step(setMinutes, -5, 0, 55)} onPlus={step(setMinutes, 5, 0, 55)} onChange={(v) => setMinutes(Math.min(59, v))} />
          </View>
          <View style={styles.chips}>
            {[
              ['2 Std', 120],
              ['4 Std', 240],
              ['1 Tag', 1440],
              ['2 Tage', 2880],
              ['1 Woche', 10080],
            ].map(([l, m]) => (
              <Chip
                key={l as string}
                label={l as string}
                active={customTotal === m}
                color={C.purple}
                onPress={() => {
                  setHours(Math.floor((m as number) / 60));
                  setMinutes((m as number) % 60);
                }}
              />
            ))}
          </View>
          <Text style={styles.result}>⏰ Alle {formatInterval(customTotal)}</Text>
        </View>
      )}
      {mode === 'once' && <Sub style={{ marginTop: 6 }}>⏰ {petName} meldet sich genau zur gewählten Uhrzeit.</Sub>}
      {mode !== 'none' && mode !== 'once' && (
        <Sub style={{ marginTop: 6 }}>
          {petName} erinnert dich ab der Fälligkeit, bis die Aufgabe erledigt ist.
        </Sub>
      )}
    </Sheet>
  );
}

type Pick = { day: number; h: number; m: number; anytime: boolean };

/** Tag (heute … in 6 Tagen) und Uhrzeit (Stunden & Minuten) wählen */
function DayTimePicker({ pick, onChange }: { pick: Pick; onChange: (p: Pick) => void }) {
  const set = (patch: Partial<Pick>) => {
    haptic();
    onChange({ ...pick, ...patch });
  };
  const now = Date.now();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    return { i, label: i === 0 ? 'Heute' : i === 1 ? 'Morgen' : `${WEEKDAYS_LONG[d.getDay()].slice(0, 2)} ${d.getDate()}.` };
  });
  const shiftMinutes = (delta: number) => {
    const total = (pick.h * 60 + pick.m + delta + 24 * 60) % (24 * 60);
    set({ h: Math.floor(total / 60), m: total % 60, anytime: false });
  };
  const inPast = (() => {
    if (pick.anytime || pick.day > 0) return false;
    const d = new Date(now);
    d.setHours(pick.h, pick.m, 0, 0);
    return d.getTime() < now;
  })();
  return (
    <View style={styles.picker}>
      <Text style={styles.pickLabel}>Tag</Text>
      <View style={styles.chips}>
        {days.map((d) => (
          <Chip key={d.i} label={d.label} active={pick.day === d.i} onPress={() => set({ day: d.i })} color={C.blue} />
        ))}
      </View>
      <Text style={styles.pickLabel}>Uhrzeit</Text>
      <View style={styles.clockRow}>
        <View style={styles.clockCol}>
          <Pressable onPress={() => shiftMinutes(60)} style={styles.clockBtn}>
            <Text style={styles.clockBtnText}>▲</Text>
          </Pressable>
          <Text style={[styles.clockNum, pick.anytime && styles.clockOff]}>{String(pick.h).padStart(2, '0')}</Text>
          <Pressable onPress={() => shiftMinutes(-60)} style={styles.clockBtn}>
            <Text style={styles.clockBtnText}>▼</Text>
          </Pressable>
        </View>
        <Text style={[styles.clockNum, pick.anytime && styles.clockOff]}>:</Text>
        <View style={styles.clockCol}>
          <Pressable onPress={() => shiftMinutes(5)} style={styles.clockBtn}>
            <Text style={styles.clockBtnText}>▲</Text>
          </Pressable>
          <Text style={[styles.clockNum, pick.anytime && styles.clockOff]}>{String(pick.m).padStart(2, '0')}</Text>
          <Pressable onPress={() => shiftMinutes(-5)} style={styles.clockBtn}>
            <Text style={styles.clockBtnText}>▼</Text>
          </Pressable>
        </View>
      </View>
      <View style={styles.chips}>
        {QUICK_TIMES.map(([h, m]) => (
          <Chip
            key={h}
            label={formatClock(h, m)}
            active={!pick.anytime && pick.h === h && pick.m === m}
            onPress={() => set({ h, m, anytime: false })}
            color={C.blue}
          />
        ))}
        <Chip label="Irgendwann am Tag" active={pick.anytime} onPress={() => set({ anytime: !pick.anytime })} color={C.green} />
      </View>
      {inPast && <Sub>Diese Uhrzeit ist heute schon vorbei – die Aufgabe ist dann sofort dran.</Sub>}
    </View>
  );
}

function Stepper({
  label,
  value,
  onMinus,
  onPlus,
  onChange,
}: {
  label: string;
  value: number;
  onMinus: () => void;
  onPlus: () => void;
  onChange: (v: number) => void;
}) {
  return (
    <View style={styles.stepper}>
      <Text style={styles.stepLabel}>{label}</Text>
      <View style={styles.stepInner}>
        <Pressable onPress={onMinus} style={styles.stepBtn}>
          <Text style={styles.stepBtnText}>−</Text>
        </Pressable>
        <TextInput
          value={String(value)}
          onChangeText={(t) => onChange(parseInt(t.replace(/\D/g, '') || '0', 10))}
          keyboardType="number-pad"
          style={styles.stepValue}
          maxLength={3}
        />
        <Pressable onPress={onPlus} style={styles.stepBtn}>
          <Text style={styles.stepBtnText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  bigEmoji: { fontSize: 40, marginRight: 10 },
  input: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#fff',
    borderRadius: R.m,
    fontSize: 18,
    fontWeight: '700',
    padding: 14,
    color: C.ink,
    borderWidth: 2,
    borderColor: C.line,
  },
  emojiRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  emojiBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12, margin: 2 },
  emojiSel: { backgroundColor: '#FFE3D6' },
  label: { fontSize: 17, fontWeight: '900', color: C.ink, marginTop: 18, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
  custom: { backgroundColor: '#F4EEFF', borderRadius: R.m, padding: 12, marginTop: 4 },
  stepRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  stepper: { width: '48%' },
  stepLabel: { fontSize: 13, fontWeight: '800', color: C.sub, marginBottom: 4 },
  stepInner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: R.m },
  stepBtn: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
  stepBtnText: { fontSize: 24, fontWeight: '900', color: C.purple },
  stepValue: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '900', color: C.ink, paddingVertical: 8, minWidth: 30 },
  picker: { backgroundColor: '#EAF1FF', borderRadius: R.m, padding: 12, marginTop: 4 },
  pickLabel: { fontSize: 13, fontWeight: '800', color: C.sub, marginBottom: 6 },
  clockRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  clockCol: { alignItems: 'center', marginHorizontal: 8 },
  clockBtn: { width: 54, height: 34, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  clockBtnText: { fontSize: 16, color: C.blue, fontWeight: '900' },
  clockNum: { fontSize: 40, fontWeight: '900', color: C.ink, marginVertical: 4, fontVariant: ['tabular-nums'] },
  clockOff: { opacity: 0.3 },
  result: { fontSize: 18, fontWeight: '900', color: C.purple, textAlign: 'center', marginTop: 4 },
});
