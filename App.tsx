import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, AppState, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CareGame, ToyGame } from './src/games/CareGames';
import { Puzzle } from './src/games/Puzzle';
import { syncNotifications } from './src/logic/notifications';
import { onBackButton } from './src/native/device';
import { BonusChoice } from './src/overlays/BonusChoice';
import { NotesImport } from './src/overlays/NotesImport';
import { LevelUp, Reward } from './src/overlays/Reward';
import { TaskEditor } from './src/overlays/TaskEditor';
import { TaskPicker } from './src/overlays/TaskPicker';
import { Goals } from './src/screens/Goals';
import { Home } from './src/screens/Home';
import { Onboarding } from './src/screens/Onboarding';
import { Settings } from './src/screens/Settings';
import { Tasks } from './src/screens/Tasks';
import { Wardrobe } from './src/screens/Wardrobe';
import { GOALS } from './src/data/goals';
import { Overlay, Tab, useStore, useUI } from './src/store';
import { C } from './src/theme';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Root />
    </SafeAreaProvider>
  );
}

function Root() {
  const hydrated = useStore((s) => s.hydrated);
  const onboarded = useStore((s) => s.onboarded);
  if (!hydrated) {
    return (
      <View style={[styles.fill, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={C.primary} size="large" />
      </View>
    );
  }
  return onboarded ? <Main /> : <Onboarding />;
}

function useLifecycle() {
  useEffect(() => {
    const store = useStore;
    store.getState().tick();
    syncNotifications();
    const interval = setInterval(() => store.getState().tick(), 30000);
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') {
        store.getState().tick();
        syncNotifications();
      }
    });
    // Benachrichtigungen neu planen, wenn sich etwas Relevantes ändert (gebündelt)
    let timer: ReturnType<typeof setTimeout> | null = null;
    const unsub = store.subscribe((s, prev) => {
      if (
        s.tasks !== prev.tasks ||
        s.drinkTimes !== prev.drinkTimes ||
        s.notificationsEnabled !== prev.notificationsEnabled ||
        s.petName !== prev.petName ||
        s.nickname !== prev.nickname
      ) {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => syncNotifications(), 800);
      }
    });
    return () => {
      clearInterval(interval);
      sub.remove();
      unsub();
      if (timer) clearTimeout(timer);
    };
  }, []);
}

function Main() {
  useLifecycle();
  const tab = useUI((s) => s.tab);
  const overlays = useUI((s) => s.overlays);
  const levelUps = useStore((s) => s.pendingLevelUps);

  // Android-Zurück-Taste: erst Overlays schließen, dann zur Startseite
  useEffect(
    () =>
      onBackButton(() => {
        const ui = useUI.getState();
        if (ui.overlays.length) {
          ui.close();
          return true;
        }
        if (ui.tab !== 'home') {
          ui.setTab('home');
          return true;
        }
        return false;
      }),
    [],
  );

  const top = overlays[overlays.length - 1];
  return (
    <View style={styles.fill}>
      <View style={styles.fill}>
        {tab === 'home' && <Home />}
        {tab === 'tasks' && <Tasks />}
        {tab === 'goals' && <Goals />}
        {tab === 'wardrobe' && <Wardrobe />}
        {tab === 'settings' && <Settings />}
      </View>
      <TabBar />
      {top && <OverlayView key={overlays.length + top.kind} overlay={top} />}
      {!top && levelUps.length > 0 && <LevelUp key={levelUps[0].level} reward={levelUps[0]} />}
      <Toast />
    </View>
  );
}

function OverlayView({ overlay }: { overlay: Overlay }) {
  switch (overlay.kind) {
    case 'game':
      return <CareGame item={overlay.item} />;
    case 'toy':
      return <ToyGame toyId={overlay.toyId} />;
    case 'puzzle':
      return <Puzzle />;
    case 'bonus':
      return <BonusChoice />;
    case 'taskEditor':
      return <TaskEditor taskId={overlay.taskId} preset={overlay.preset} />;
    case 'taskPicker':
      return <TaskPicker />;
    case 'import':
      return <NotesImport />;
    case 'reward':
      return <Reward result={overlay.result} taskTitle={overlay.taskTitle} />;
  }
}

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'home', icon: '🏠', label: 'Zuhause' },
  { id: 'tasks', icon: '✅', label: 'Aufgaben' },
  { id: 'goals', icon: '🏆', label: 'Ziele' },
  { id: 'wardrobe', icon: '👗', label: 'Schrank' },
  { id: 'settings', icon: '⚙️', label: 'Mehr' },
];

function TabBar() {
  const insets = useSafeAreaInsets();
  const tab = useUI((s) => s.tab);
  const setTab = useUI((s) => s.setTab);
  const dueCount = useStore((s) => s.tasks.filter((t) => t.dueAt <= Date.now()).length);
  const goalsReady = useStore((s) => GOALS.filter((g) => !s.goalsClaimed.includes(g.id) && s.stats[g.stat] >= g.target).length);
  const badges: Partial<Record<Tab, number>> = { tasks: dueCount, goals: goalsReady };
  return (
    <View style={[styles.tabbar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {TABS.map((t) => {
        const active = tab === t.id;
        const badge = badges[t.id];
        return (
          <Pressable key={t.id} onPress={() => setTab(t.id)} style={styles.tab}>
            <View style={[styles.tabIconWrap, active && styles.tabActive]}>
              <Text style={{ fontSize: 22 }}>{t.icon}</Text>
              {!!badge && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{badge}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.tabLabel, active && { color: C.primary }]}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Toast() {
  const toast = useUI((s) => s.toast);
  const insets = useSafeAreaInsets();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!toast) return;
    v.setValue(0);
    Animated.sequence([
      Animated.spring(v, { toValue: 1, useNativeDriver: Platform.OS !== 'web', friction: 6 }),
      Animated.delay(2200),
      Animated.timing(v, { toValue: 0, duration: 250, useNativeDriver: Platform.OS !== 'web' }),
    ]).start();
  }, [toast, v]);
  if (!toast) return null;
  const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [-120, 0] });
  return (
    <Animated.View pointerEvents="none" style={[styles.toast, { top: insets.top + 10, opacity: v, transform: [{ translateY }] }]}>
      <Text style={styles.toastText}>{toast.text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: C.bg },
  tabbar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    shadowColor: '#7A4A20',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  tab: { flex: 1, alignItems: 'center' },
  tabIconWrap: { width: 48, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  tabActive: { backgroundColor: '#FFE3D6' },
  tabLabel: { fontSize: 11, fontWeight: '800', color: C.sub, marginTop: 2 },
  tabBadge: { position: 'absolute', top: -2, right: 0, backgroundColor: C.red, borderRadius: 9, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  tabBadgeText: { color: '#fff', fontSize: 11, fontWeight: '900' },
  toast: { position: 'absolute', left: 16, right: 16, backgroundColor: C.ink, borderRadius: 18, padding: 14 },
  toastText: { color: '#fff', fontSize: 15, fontWeight: '700', textAlign: 'center' },
});
