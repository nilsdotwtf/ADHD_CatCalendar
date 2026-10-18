import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Confetti } from '../components/Confetti';
import { haptic, ProgressBar } from '../components/ui';
import { useUI } from '../store';
import { C, R } from '../theme';

interface Props {
  title: string;
  hint: string;
  progress: number; // 0..1
  done: boolean;
  doneText: string;
  onFinish: () => void; // wird nach der Erfolgsanimation aufgerufen
  bg?: string;
  dark?: boolean;
  children: React.ReactNode;
}

/** Rahmen für alle Mini-Spiele: kurz, ohne Verlieren, mit großem Erfolgsmoment. */
export function GameShell({ title, hint, progress, done, doneText, onFinish, bg = '#FFF1E2', dark, children }: Props) {
  const insets = useSafeAreaInsets();
  const close = useUI((s) => s.close);

  useEffect(() => {
    if (!done) return;
    haptic('success');
    const t = setTimeout(onFinish, 1600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  const ink = dark ? '#fff' : C.ink;
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: bg, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 12 }]}>
      <View style={styles.top}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: ink }]}>{title}</Text>
          <Text style={[styles.hint, { color: dark ? '#D6D9F5' : C.sub }]}>{hint}</Text>
        </View>
        {!done && (
          <Pressable onPress={close} hitSlop={12} style={styles.x}>
            <Text style={styles.xText}>✕</Text>
          </Pressable>
        )}
      </View>
      <View style={{ paddingHorizontal: 16, marginBottom: 6 }}>
        <ProgressBar value={progress} color={C.green} height={14} bg={dark ? '#ffffff30' : '#F3E7DA'} />
      </View>
      <View style={{ flex: 1 }}>{children}</View>
      {done && (
        <>
          <View pointerEvents="none" style={styles.doneWrap}>
            <View style={styles.done}>
              <Text style={styles.doneText}>{doneText}</Text>
            </View>
          </View>
          <Confetti count={30} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 10 },
  title: { fontSize: 26, fontWeight: '900' },
  hint: { fontSize: 15, fontWeight: '700', marginTop: 2 },
  x: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#0000001A', alignItems: 'center', justifyContent: 'center' },
  xText: { fontSize: 17, fontWeight: '900', color: C.sub },
  doneWrap: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  done: { backgroundColor: '#fff', borderRadius: R.xl, paddingHorizontal: 26, paddingVertical: 18 },
  doneText: { fontSize: 26, fontWeight: '900', color: C.green, textAlign: 'center' },
});
