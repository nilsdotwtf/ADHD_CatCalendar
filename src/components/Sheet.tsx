import React, { useEffect, useRef } from 'react';
import { Animated, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUI } from '../store';
import { C } from '../theme';

/** Von unten einfahrendes Menü */
export function Sheet({ title, children, footer }: { title: string; children: React.ReactNode; footer?: React.ReactNode }) {
  const close = useUI((s) => s.close);
  const insets = useSafeAreaInsets();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(v, { toValue: 1, useNativeDriver: Platform.OS !== 'web', bounciness: 4, speed: 16 }).start();
  }, [v]);
  const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [600, 0] });
  return (
    <View style={StyleSheet.absoluteFill}>
      <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: C.overlay }]} onPress={close} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.kav} pointerEvents="box-none">
        <Animated.View style={[styles.sheet, { paddingBottom: insets.bottom + 12, transform: [{ translateY }] }]}>
          <View style={styles.handle} />
          <View style={styles.head}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={close} hitSlop={12} style={styles.x}>
              <Text style={styles.xText}>✕</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 18, paddingTop: 4 }} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
          {footer && <View style={styles.footer}>{footer}</View>}
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  kav: { flex: 1, justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '92%' },
  handle: { width: 44, height: 5, borderRadius: 3, backgroundColor: '#E3D3C3', alignSelf: 'center', marginTop: 8 },
  head: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingTop: 10, paddingBottom: 8 },
  title: { flex: 1, fontSize: 22, fontWeight: '900', color: C.ink },
  x: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#F3E7DA', alignItems: 'center', justifyContent: 'center' },
  xText: { fontSize: 16, fontWeight: '900', color: C.sub },
  footer: { paddingHorizontal: 18, paddingTop: 8 },
});
