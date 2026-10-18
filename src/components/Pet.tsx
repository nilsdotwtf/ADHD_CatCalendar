import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { consumableInfo } from '../data/items';
import { moodOf, Needs } from '../logic/needs';
import { useStore } from '../store';
import { AnimalArt, Expression, WornClothing } from './AnimalArt';
import { haptic } from './ui';

const native = Platform.OS !== 'web';

export function expressionFor(needs: Needs): Expression {
  const mood = moodOf(needs);
  if (needs.energy < 35 && needs.energy <= Math.min(needs.hunger, needs.fun, needs.clean)) return 'tired';
  if (mood === 'happy') return 'happy';
  if (mood === 'okay') return 'neutral';
  return 'sad';
}

export function useWorn(): { head?: WornClothing; neck?: WornClothing } {
  const clothes = useStore((s) => s.clothes);
  const equipped = useStore((s) => s.equipped);
  const find = (id?: string) => {
    const c = clothes.find((x) => x.id === id);
    return c ? { type: c.type, color: c.color } : undefined;
  };
  return { head: find(equipped.head), neck: find(equipped.neck) };
}

interface Props {
  size?: number;
  expression?: Expression; // überschreibt die Stimmung (z.B. in Minispielen)
  showEffects?: boolean;
  interactive?: boolean;
  dirtOverride?: number;
  messOverride?: number;
}

/** Das Tier des Nutzers – atmet, reagiert auf Antippen und zeigt seinen Zustand. */
export function Pet({ size = 220, expression, showEffects = true, interactive = true, dirtOverride, messOverride }: Props) {
  const species = useStore((s) => s.speciesId);
  const colors = useStore((s) => s.colors);
  const needs = useStore((s) => s.needs);
  const worn = useWorn();
  const [tapped, setTapped] = useState(false);
  const [hearts, setHearts] = useState<number[]>([]);

  const breathe = useRef(new Animated.Value(0)).current;
  const jump = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: native }),
        Animated.timing(breathe, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: native }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [breathe]);

  const onTap = () => {
    if (!interactive) return;
    haptic();
    setTapped(true);
    setHearts((h) => [...h, Date.now()]);
    jump.setValue(0);
    Animated.sequence([
      Animated.timing(jump, { toValue: 1, duration: 160, easing: Easing.out(Easing.quad), useNativeDriver: native }),
      Animated.spring(jump, { toValue: 0, friction: 4, useNativeDriver: native }),
    ]).start(() => setTapped(false));
  };

  const expr: Expression = expression ?? (tapped ? 'love' : expressionFor(needs));
  const dirt = dirtOverride ?? Math.max(0, (45 - needs.clean) / 45);
  // Unter 55% Fellpflege wird das Fell sichtbar struppig
  const mess = messOverride ?? Math.max(0, (55 - needs.clean) / 55);
  const scaleY = breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.025] });
  const translateY = jump.interpolate({ inputRange: [0, 1], outputRange: [0, -22] });

  const food = consumableInfo('food', species).emoji;
  return (
    <View style={{ width: size, height: size * 1.1, alignItems: 'center', justifyContent: 'center' }}>
      {interactive ? (
        <Pressable onPress={onTap}>
          <Animated.View style={{ transform: [{ translateY }, { scaleY }] }}>
            <AnimalArt species={species} colors={colors} expression={expr} dirt={dirt} mess={mess} head={worn.head} neck={worn.neck} size={size} />
          </Animated.View>
        </Pressable>
      ) : (
        <Animated.View pointerEvents="none" style={{ transform: [{ translateY }, { scaleY }] }}>
          <AnimalArt species={species} colors={colors} expression={expr} dirt={dirt} mess={mess} head={worn.head} neck={worn.neck} size={size} />
        </Animated.View>
      )}
      {showEffects && (
        <>
          {needs.hunger < 40 && <Bubble text={food} style={{ top: 0, right: -4 }} />}
          {needs.energy < 35 && <Floaty text="💤" style={{ top: size * 0.08, left: size * 0.02 }} />}
          {needs.fun < 35 && <Floaty text="🌧️" style={{ top: -size * 0.06, left: size * 0.38 }} />}
          {needs.clean < 30 && <Floaty text="🪰" style={{ top: size * 0.5, right: size * 0.02 }} small />}
          {moodOf(needs) === 'happy' && !tapped && <Floaty text="✨" style={{ top: size * 0.05, right: size * 0.08 }} small />}
        </>
      )}
      {hearts.map((k) => (
        <Heart key={k} onDone={() => setHearts((h) => h.filter((x) => x !== k))} />
      ))}
    </View>
  );
}

function Bubble({ text, style }: { text: string; style: object }) {
  return (
    <Floaty
      style={style}
      text={text}
      bubble
    />
  );
}

function Floaty({ text, style, small, bubble }: { text: string; style: object; small?: boolean; bubble?: boolean }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 1200, useNativeDriver: native }),
        Animated.timing(v, { toValue: 0, duration: 1200, useNativeDriver: native }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v]);
  const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });
  return (
    <Animated.View pointerEvents="none" style={[styles.floaty, style, { transform: [{ translateY }] }]}>
      {bubble ? (
        <View style={styles.bubble}>
          <Text style={{ fontSize: 26 }}>{text}</Text>
          <Text style={styles.bubbleQ}>?</Text>
        </View>
      ) : (
        <Text style={{ fontSize: small ? 22 : 32 }}>{text}</Text>
      )}
    </Animated.View>
  );
}

function Heart({ onDone }: { onDone: () => void }) {
  const v = useRef(new Animated.Value(0)).current;
  const x = useRef((Math.random() - 0.5) * 80).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 900, useNativeDriver: native }).start(onDone);
  }, [v, onDone]);
  const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [0, -90] });
  const opacity = v.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] });
  return (
    <Animated.Text pointerEvents="none" style={[styles.heart, { opacity, transform: [{ translateX: x }, { translateY }] }]}>
      💖
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  floaty: { position: 'absolute' },
  bubble: {
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  bubbleQ: { fontSize: 18, fontWeight: '900', color: '#FF7A59', marginLeft: 2 },
  heart: { position: 'absolute', top: '35%', fontSize: 30 },
});
