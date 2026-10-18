import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, LayoutChangeEvent, PanResponder, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg from 'react-native-svg';
import { MudSplat } from '../components/Mud';
import { Pet } from '../components/Pet';
import { ToyArt } from '../components/ToyArt';
import { haptic } from '../components/ui';
import { consumableInfo, ConsumableId, NEED_BY_ID } from '../data/items';
import { useStore, useUI } from '../store';
import { GameShell } from './GameShell';

const native = Platform.OS !== 'web';

function useArea() {
  const [area, setArea] = useState({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) => setArea({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });
  return { area, onLayout };
}

/**
 * Wisch-Geste über eine Fläche. Rechnet mit pageX/pageY minus Position der Fläche,
 * damit es egal ist, welches Kind-Element unter dem Finger liegt.
 */
function useSwipe(handlers: { start?: (x: number, y: number) => void; move: (x: number, y: number) => void; end?: () => void }) {
  const ref = useRef<React.ComponentRef<typeof View>>(null);
  const origin = useRef({ x: 0, y: 0 });
  const h = useRef(handlers);
  h.current = handlers;
  const measure = () => ref.current?.measureInWindow((x, y) => (origin.current = { x, y }));
  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
        onPanResponderGrant: (e) => {
          measure();
          const x = e.nativeEvent.pageX - origin.current.x;
          const y = e.nativeEvent.pageY - origin.current.y;
          (h.current.start ?? h.current.move)(x, y);
        },
        onPanResponderMove: (e) => h.current.move(e.nativeEvent.pageX - origin.current.x, e.nativeEvent.pageY - origin.current.y),
        onPanResponderRelease: () => h.current.end?.(),
        onPanResponderTerminate: () => h.current.end?.(),
      }),
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );
  return { ref, panHandlers: pan.panHandlers, measure };
}

function useFinish(item: ConsumableId) {
  const consume = useStore((s) => s.consumeItem);
  const close = useUI((s) => s.close);
  return () => {
    consume(item);
    close();
  };
}

export function CareGame({ item }: { item: ConsumableId }) {
  switch (item) {
    case 'food':
      return <FeedGame />;
    case 'brush':
      return <BrushGame />;
    case 'cuddle':
      return <CuddleGame />;
    case 'pillow':
      return <SleepGame />;
  }
}

// ---------------- Füttern: Leckerlis antippen ----------------
const FEED_GOAL = 5;

function FeedGame() {
  const species = useStore((s) => s.speciesId);
  const petName = useStore((s) => s.petName);
  const info = consumableInfo('food', species);
  const finish = useFinish('food');
  const { area, onLayout } = useArea();
  const [count, setCount] = useState(0);
  const [chewing, setChewing] = useState(false);
  const pos = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const scale = useRef(new Animated.Value(1)).current;
  const flying = useRef(false);
  const petSize = Math.min(area.w * 0.62, 240);

  const spawn = () => {
    if (!area.w) return;
    const x = 30 + Math.random() * Math.max(10, area.w - 110);
    const y = 20 + Math.random() * Math.max(10, area.h - petSize * 1.1 - 120);
    pos.setValue({ x, y });
    scale.setValue(0);
    Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: false }).start();
    flying.current = false;
  };

  useEffect(spawn, [area.w]); // eslint-disable-line react-hooks/exhaustive-deps

  const onTap = () => {
    if (flying.current || count >= FEED_GOAL) return;
    flying.current = true;
    haptic();
    const target = { x: area.w / 2 - 28, y: area.h - petSize * 0.62 };
    Animated.parallel([
      Animated.timing(pos, { toValue: target, duration: 320, easing: Easing.in(Easing.quad), useNativeDriver: false }),
      Animated.timing(scale, { toValue: 0.4, duration: 320, useNativeDriver: false }),
    ]).start(() => {
      setChewing(true);
      setTimeout(() => setChewing(false), 380);
      const n = count + 1;
      setCount(n);
      if (n < FEED_GOAL) spawn();
    });
  };

  const done = count >= FEED_GOAL;
  return (
    <GameShell
      title={`${info.emoji} Füttern`}
      hint={`Tipp das Futter an – ${petName} schnappt es sich!`}
      progress={count / FEED_GOAL}
      done={done}
      doneText={`Mampf! 😋\n+${info.boost} ${NEED_BY_ID.hunger.label}`}
      onFinish={finish}
    >
      <View style={{ flex: 1 }} onLayout={onLayout}>
        {!done && area.w > 0 && (
          <Animated.View style={[styles.abs, { left: pos.x, top: pos.y, transform: [{ scale }] }]}>
            <Pressable onPress={onTap} hitSlop={20}>
              <Text style={{ fontSize: 56 }}>{info.emoji}</Text>
            </Pressable>
          </Animated.View>
        )}
        <View style={styles.petBottom} pointerEvents="none">
          <Pet size={petSize || 200} expression={chewing ? 'eating' : done ? 'love' : 'happy'} showEffects={false} interactive={false} />
        </View>
        <Text style={styles.counter}>
          {count}/{FEED_GOAL}
        </Text>
      </View>
    </GameShell>
  );
}

// ---------------- Bürsten: Schmutz wegwischen ----------------
// Lage der Matschspritzer im Bild (Anteile von Breite/Höhe) – Augen bleiben frei
const DIRT_SPOTS = [
  [0.3, 0.26], [0.7, 0.28], [0.42, 0.62], [0.63, 0.7], [0.5, 0.86], [0.27, 0.52], [0.74, 0.55],
];

// Sauberkeit pro gewischtem Pixel über einem Fleck – ≈ 330 px Wischen je Fleck
const BRUSH_PER_PX = 0.3;

function BrushGame() {
  const petName = useStore((s) => s.petName);
  const finish = useFinish('brush');
  const { area, onLayout } = useArea();
  const [hp, setHp] = useState<number[]>(DIRT_SPOTS.map(() => 100));
  const [finger, setFinger] = useState<{ x: number; y: number } | null>(null);
  const size = Math.min(area.w * 0.85, 300);
  const box = { left: (area.w - size) / 2, top: (area.h - size * 1.1) / 2 };
  const spots = DIRT_SPOTS.map(([fx, fy]) => ({ x: box.left + fx * size, y: box.top + fy * size * 1.1 }));
  const spotsRef = useRef(spots);
  spotsRef.current = spots;

  // Nur Wischen putzt: Schaden = zurückgelegte Strecke über dem Fleck (Antippen allein reicht nicht)
  const last = useRef<{ x: number; y: number } | null>(null);
  const scrub = (x: number, y: number) => {
    setFinger({ x, y });
    const prevPos = last.current;
    last.current = { x, y };
    if (!prevPos) return;
    const moved = Math.min(Math.hypot(x - prevPos.x, y - prevPos.y), 40);
    if (moved < 1) return;
    setHp((prev) => {
      let changed = false;
      const next = prev.map((v, i) => {
        if (v <= 0) return v;
        const s = spotsRef.current[i];
        if (Math.hypot(s.x - x, s.y - y) < 45) {
          changed = true;
          const nv = v - moved * BRUSH_PER_PX;
          if (nv <= 0) haptic();
          return nv;
        }
        return v;
      });
      return changed ? next : prev;
    });
  };

  const swipe = useSwipe({
    start: (x, y) => {
      last.current = { x, y };
      setFinger({ x, y });
    },
    move: scrub,
    end: () => {
      last.current = null;
      setFinger(null);
    },
  });

  const cleaned = hp.filter((v) => v <= 0).length;
  const done = cleaned === hp.length;
  return (
    <GameShell
      title="🪮 Bürsten"
      hint={`Wisch mit dem Finger über ${petName}, bis alles glänzt!`}
      progress={cleaned / hp.length}
      done={done}
      doneText={`Blitzblank! ✨\n+35 ${NEED_BY_ID.clean.label}`}
      onFinish={finish}
      bg="#E8F7FF"
    >
      <View
        ref={swipe.ref}
        style={{ flex: 1 }}
        onLayout={(e) => {
          onLayout(e);
          swipe.measure();
        }}
        {...swipe.panHandlers}
      >
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {area.w > 0 && (
            <View style={[styles.abs, { left: box.left, top: box.top }]}>
              <Pet size={size} dirtOverride={0} expression={done ? 'love' : finger ? 'happy' : 'neutral'} showEffects={false} interactive={false} />
            </View>
          )}
          {area.w > 0 && (
            <Svg width={area.w} height={area.h} style={StyleSheet.absoluteFill}>
              {spots.map((s, i) =>
                hp[i] > 0 ? (
                  <MudSplat key={i} x={s.x} y={s.y} r={6 + (hp[i] / 100) * 6} seed={i + 1} opacity={0.35 + (hp[i] / 100) * 0.65} />
                ) : null,
              )}
            </Svg>
          )}
          {area.w > 0 &&
            spots.map((s, i) =>
              hp[i] <= 0 ? (
                <Text key={i} style={[styles.abs, { left: s.x - 14, top: s.y - 16, fontSize: 24 }]}>
                  ✨
                </Text>
              ) : null,
            )}
          {finger && <Text style={[styles.abs, { left: finger.x - 24, top: finger.y - 40, fontSize: 44 }]}>🪮</Text>}
        </View>
      </View>
    </GameShell>
  );
}

// ---------------- Streicheln: über das Tier streichen ----------------
// Gestreichelte Strecke in Pixeln, bis das Tier zufrieden ist (≈ 12× über das Tier)
const CUDDLE_DISTANCE = 3600;

function CuddleGame() {
  const petName = useStore((s) => s.petName);
  const finish = useFinish('cuddle');
  const { area, onLayout } = useArea();
  const [dist, setDist] = useState(0);
  const [touching, setTouching] = useState(false);
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>([]);
  const last = useRef<{ x: number; y: number } | null>(null);
  const sinceHeart = useRef(0);
  const size = Math.min(area.w * 0.85, 300);

  const move = (x: number, y: number) => {
    if (last.current) {
      const d = Math.min(Math.hypot(x - last.current.x, y - last.current.y), 40);
      if (d > 0.5) {
        setDist((v) => Math.min(CUDDLE_DISTANCE, v + d));
        sinceHeart.current += d;
        if (sinceHeart.current > 70) {
          sinceHeart.current = 0;
          haptic();
          const id = Date.now() + Math.random();
          setHearts((h) => [...h.slice(-10), { id, x, y }]);
        }
      }
    }
    last.current = { x, y };
  };

  const swipe = useSwipe({
    start: (x, y) => {
      setTouching(true);
      last.current = { x, y };
    },
    move,
    end: () => {
      setTouching(false);
      last.current = null;
    },
  });

  const done = dist >= CUDDLE_DISTANCE;
  return (
    <GameShell
      title="💝 Streicheln"
      hint={`Streichel ${petName} mit dem Finger – hin und her!`}
      progress={dist / CUDDLE_DISTANCE}
      done={done}
      doneText={`Sooo schön… 💕\n+30 ${NEED_BY_ID.fun.label}`}
      onFinish={finish}
      bg="#FFEAF1"
    >
      <View
        ref={swipe.ref}
        style={{ flex: 1 }}
        onLayout={(e) => {
          onLayout(e);
          swipe.measure();
        }}
        {...swipe.panHandlers}
      >
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
          {area.w > 0 && <Pet size={size} expression={touching || done ? 'love' : 'happy'} showEffects={false} interactive={false} />}
          {hearts.map((h) => (
            <FloatUp key={h.id} x={h.x} y={h.y} text="💖" />
          ))}
        </View>
      </View>
    </GameShell>
  );
}

function FloatUp({ x, y, text }: { x: number; y: number; text: string }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 900, useNativeDriver: native }).start();
  }, [v]);
  const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [0, -80] });
  const opacity = v.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] });
  return <Animated.Text style={[styles.abs, { left: x - 16, top: y - 30, fontSize: 30, opacity, transform: [{ translateY }] }]}>{text}</Animated.Text>;
}

// ---------------- Schlafen: Schäfchen zählen ----------------
const SHEEP_GOAL = 5;

function SleepGame() {
  const petName = useStore((s) => s.petName);
  const finish = useFinish('pillow');
  const { area, onLayout } = useArea();
  const [count, setCount] = useState(0);
  const [sheepKey, setSheepKey] = useState(0);
  const done = count >= SHEEP_GOAL;
  const size = Math.min(area.w * 0.6, 230);

  return (
    <GameShell
      title="🛏️ Schlafenszeit"
      hint={`Zähl Schäfchen: tipp sie an, damit ${petName} einschläft.`}
      progress={count / SHEEP_GOAL}
      done={done}
      doneText={`Gut geschlafen! 😴\n+35 ${NEED_BY_ID.energy.label}`}
      onFinish={finish}
      bg="#1E2347"
      dark
    >
      <View style={{ flex: 1 }} onLayout={onLayout}>
        {['⭐', '✨', '⭐', '✨', '⭐'].map((s, i) => (
          <Text key={i} style={[styles.abs, { left: `${10 + i * 19}%`, top: 20 + (i % 2) * 40, fontSize: 18, opacity: 0.8 }]}>
            {s}
          </Text>
        ))}
        <Text style={[styles.abs, { right: 24, top: 10, fontSize: 48 }]}>🌙</Text>
        {area.w > 0 && !done && (
          <Sheep
            key={sheepKey}
            width={area.w}
            y={area.h * 0.28}
            onTap={() => {
              haptic();
              setCount((c) => c + 1);
              setTimeout(() => setSheepKey((k) => k + 1), 250);
            }}
            onMiss={() => setSheepKey((k) => k + 1)}
          />
        )}
        <Text style={[styles.abs, { left: area.w / 2 - 22, top: area.h * 0.28 + 30, fontSize: 40 }]}>🪵</Text>
        <View style={styles.petBottom} pointerEvents="none">
          <Pet size={size || 200} expression={done || count >= 3 ? 'tired' : 'neutral'} showEffects={false} interactive={false} />
          {count > 0 && <Text style={styles.zzz}>{'💤'.repeat(Math.min(count, 3))}</Text>}
        </View>
        <Text style={[styles.counter, { color: '#fff' }]}>
          🐑 {count}/{SHEEP_GOAL}
        </Text>
      </View>
    </GameShell>
  );
}

function Sheep({ width, y, onTap, onMiss }: { width: number; y: number; onTap: () => void; onMiss: () => void }) {
  const v = useRef(new Animated.Value(0)).current;
  const out = useRef(new Animated.Value(0)).current;
  const tapped = useRef(false);
  useEffect(() => {
    const anim = Animated.timing(v, { toValue: 1, duration: 3600, easing: Easing.linear, useNativeDriver: false });
    anim.start(({ finished }) => {
      if (finished && !tapped.current) onMiss();
    });
    return () => anim.stop();
  }, [v]); // eslint-disable-line react-hooks/exhaustive-deps
  const left = v.interpolate({ inputRange: [0, 1], outputRange: [-70, width + 10] });
  const hop = v.interpolate({
    inputRange: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
    outputRange: [0, -10, 0, -10, -50, -60, -10, 0, -10, 0, -10],
  });
  const flyY = out.interpolate({ inputRange: [0, 1], outputRange: [0, -120] });
  const opacity = out.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  return (
    <Animated.View style={[styles.abs, { left, top: y, opacity, transform: [{ translateY: Animated.add(hop, flyY) }] }]}>
      <Pressable
        hitSlop={24}
        onPress={() => {
          if (tapped.current) return;
          tapped.current = true;
          v.stopAnimation();
          Animated.timing(out, { toValue: 1, duration: 300, useNativeDriver: false }).start();
          onTap();
        }}
      >
        <Text style={{ fontSize: 58 }}>🐑</Text>
      </Pressable>
    </Animated.View>
  );
}

// ---------------- Spielzeug: das hüpfende Spielzeug fangen ----------------
const TOY_GOAL = 5;

export function ToyGame({ toyId }: { toyId: string }) {
  const toy = useStore((s) => s.toys.find((t) => t.id === toyId));
  const petName = useStore((s) => s.petName);
  const playToy = useStore((s) => s.playToy);
  const close = useUI((s) => s.close);
  const { area, onLayout } = useArea();
  const [count, setCount] = useState(0);
  const pos = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const petSize = Math.min(area.w * 0.5, 200);

  const hopTo = () => {
    if (!area.w) return;
    Animated.spring(pos, {
      toValue: { x: 20 + Math.random() * (area.w - 110), y: 10 + Math.random() * Math.max(10, area.h - petSize * 1.1 - 100) },
      friction: 5,
      useNativeDriver: false,
    }).start();
  };

  useEffect(() => {
    if (!area.w || count >= TOY_GOAL) return;
    hopTo();
    const t = setInterval(hopTo, 1300);
    return () => clearInterval(t);
  }, [area.w, count]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!toy) return null;
  const done = count >= TOY_GOAL;
  return (
    <GameShell
      title="🎾 Spielzeit"
      hint={`Fang das Spielzeug für ${petName} – tipp es an!`}
      progress={count / TOY_GOAL}
      done={done}
      doneText={"Hat Spaß gemacht! 🤩\n+25 Laune"}
      onFinish={() => {
        playToy(toyId);
        close();
      }}
      bg="#EEFBEF"
    >
      <View style={{ flex: 1 }} onLayout={onLayout}>
        {!done && area.w > 0 && (
          <Animated.View style={[styles.abs, { left: pos.x, top: pos.y }]}>
            <Pressable
              hitSlop={16}
              onPress={() => {
                haptic();
                setCount((c) => c + 1);
              }}
            >
              <ToyArt type={toy.type} color={toy.color} size={78} />
            </Pressable>
          </Animated.View>
        )}
        <View style={styles.petBottom} pointerEvents="none">
          <Pet size={petSize || 180} expression={done ? 'love' : 'happy'} showEffects={false} interactive={false} />
        </View>
        <Text style={styles.counter}>
          {count}/{TOY_GOAL}
        </Text>
      </View>
    </GameShell>
  );
}

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
  petBottom: { position: 'absolute', bottom: 10, left: 0, right: 0, alignItems: 'center' },
  counter: { position: 'absolute', bottom: 8, right: 18, fontSize: 22, fontWeight: '900', color: '#2B2330' },
  zzz: { position: 'absolute', top: 0, right: '22%', fontSize: 26 },
});
