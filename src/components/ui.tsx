import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef } from 'react';
import { Animated, Platform, Pressable, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { C, R, shadow } from '../theme';

export function haptic(kind: 'light' | 'success' | 'heavy' = 'light') {
  if (Platform.OS === 'web') return;
  if (kind === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  else Haptics.impactAsync(kind === 'heavy' ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

interface BtnProps {
  title: string;
  onPress?: () => void;
  color?: string;
  textColor?: string;
  disabled?: boolean;
  small?: boolean;
  outline?: boolean;
  style?: StyleProp<ViewStyle>;
  icon?: string;
}

export function Button({ title, onPress, color = C.primary, textColor = '#fff', disabled, small, outline, style, icon }: BtnProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (v: number) => Animated.spring(scale, { toValue: v, useNativeDriver: Platform.OS !== 'web', speed: 40, bounciness: 8 }).start();
  return (
    <Pressable
      disabled={disabled}
      onPressIn={() => to(0.94)}
      onPressOut={() => to(1)}
      onPress={() => {
        haptic();
        onPress?.();
      }}
      style={style}
    >
      <Animated.View
        style={[
          styles.btn,
          small && styles.btnSmall,
          outline ? { backgroundColor: 'transparent', borderWidth: 2, borderColor: color } : { backgroundColor: color },
          disabled && { opacity: 0.4 },
          { transform: [{ scale }] },
        ]}
      >
        <Text style={[styles.btnText, small && { fontSize: 15 }, { color: outline ? color : textColor }]}>
          {icon ? `${icon}  ` : ''}
          {title}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Chip({
  label,
  active,
  onPress,
  color = C.primary,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  color?: string;
}) {
  return (
    <Pressable
      onPress={() => {
        haptic();
        onPress?.();
      }}
      style={[styles.chip, active && { backgroundColor: color, borderColor: color }]}
    >
      <Text style={[styles.chipText, active && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

export function ProgressBar({ value, color = C.primary, height = 12, bg = '#F3E7DA' }: { value: number; color?: string; height?: number; bg?: string }) {
  const anim = useRef(new Animated.Value(value)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: value, duration: 450, useNativeDriver: false }).start();
  }, [value, anim]);
  const width = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'], extrapolate: 'clamp' });
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: bg, overflow: 'hidden' }}>
      <Animated.View style={{ width, height, borderRadius: height / 2, backgroundColor: color }} />
    </View>
  );
}

export function H1({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.h1, style]}>{children}</Text>;
}

export function H2({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.h2, style]}>{children}</Text>;
}

export function Sub({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.sub, style]}>{children}</Text>;
}

/** Sanftes Hüpfen, um Aufmerksamkeit zu lenken */
export function Bounce({ children, active = true, style }: { children: React.ReactNode; active?: boolean; style?: StyleProp<ViewStyle> }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 500, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(v, { toValue: 0, duration: 500, useNativeDriver: Platform.OS !== 'web' }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, v]);
  const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [0, -5] });
  return <Animated.View style={[style, { transform: [{ translateY }] }]}>{children}</Animated.View>;
}

export const styles = StyleSheet.create({
  btn: {
    paddingVertical: 15,
    paddingHorizontal: 22,
    borderRadius: R.l,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  btnSmall: { paddingVertical: 9, paddingHorizontal: 14, borderRadius: R.m },
  btnText: { fontSize: 17, fontWeight: '800', letterSpacing: 0.2 },
  card: { backgroundColor: C.card, borderRadius: R.l, padding: 16, ...shadow },
  chip: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: C.line,
    backgroundColor: '#fff',
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: { fontSize: 15, fontWeight: '700', color: C.ink },
  h1: { fontSize: 28, fontWeight: '900', color: C.ink },
  h2: { fontSize: 19, fontWeight: '800', color: C.ink },
  sub: { fontSize: 15, color: C.sub, lineHeight: 21 },
});
