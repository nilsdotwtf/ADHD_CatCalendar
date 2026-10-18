import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, Easing, Platform, StyleSheet, View } from 'react-native';

const COLORS = ['#FF7A59', '#FFC93C', '#3CC48A', '#5B8DEF', '#9D7BF5', '#FF6B9A'];

/** Konfetti-Explosion – Dopamin pur 🎉 */
export function Confetti({ count = 40, duration = 1800 }: { count?: number; duration?: number }) {
  const { width, height } = Dimensions.get('window');
  const v = useRef(new Animated.Value(0)).current;
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        key: i,
        x: (Math.random() - 0.5) * width * 1.1,
        y: -Math.random() * height * 0.45 - 60,
        fall: height * (0.35 + Math.random() * 0.45),
        rot: (Math.random() - 0.5) * 720,
        color: COLORS[i % COLORS.length],
        w: 7 + Math.random() * 7,
        h: 10 + Math.random() * 8,
        round: Math.random() < 0.3,
      })),
    [count, width, height],
  );
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration, easing: Easing.out(Easing.quad), useNativeDriver: Platform.OS !== 'web' }).start();
  }, [v, duration]);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p) => {
        const translateX = v.interpolate({ inputRange: [0, 1], outputRange: [0, p.x] });
        const translateY = v.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0, p.y, p.y + p.fall] });
        const rotate = v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.rot}deg`] });
        const opacity = v.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] });
        return (
          <Animated.View
            key={p.key}
            style={{
              position: 'absolute',
              left: width / 2,
              top: height * 0.55,
              width: p.w,
              height: p.round ? p.w : p.h,
              borderRadius: p.round ? p.w / 2 : 2,
              backgroundColor: p.color,
              opacity,
              transform: [{ translateX }, { translateY }, { rotate }],
            }}
          />
        );
      })}
    </View>
  );
}
