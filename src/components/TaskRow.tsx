import React, { useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { formatDue, REPEAT_LABEL } from '../logic/time';
import { Task, useStore, useUI } from '../store';
import { C, R, shadow } from '../theme';
import { haptic } from './ui';

export function completeWithReward(task: Task) {
  const result = useStore.getState().completeTask(task.id);
  if (!result) return;
  haptic('success');
  useUI.getState().open({ kind: 'reward', result, taskTitle: task.title });
}

export function TaskRow({ task, now }: { task: Task; now: number }) {
  const ui = useUI();
  const overdue = task.dueAt <= now;
  const pop = useRef(new Animated.Value(1)).current;

  const onCheck = () => {
    Animated.sequence([
      Animated.timing(pop, { toValue: 1.3, duration: 120, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(pop, { toValue: 1, duration: 120, useNativeDriver: Platform.OS !== 'web' }),
    ]).start(() => completeWithReward(task));
  };

  return (
    <Pressable onPress={() => ui.open({ kind: 'taskEditor', taskId: task.id })} style={[styles.row, overdue && styles.rowOverdue]}>
      <Text style={styles.emoji}>{task.emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.title} numberOfLines={2}>
          {task.title}
        </Text>
        <View style={styles.meta}>
          <Text style={[styles.due, overdue && { color: C.primaryDark }]}>{formatDue(task.dueAt, now, task.dueMode)}</Text>
          {task.repeat !== 'none' && <Text style={styles.tag}>🔁 {REPEAT_LABEL[task.repeat]}</Text>}
          {task.reminderMinutes != null && <Text style={styles.tag}>🔔</Text>}
        </View>
      </View>
      <Pressable onPress={onCheck} hitSlop={10}>
        <Animated.View style={[styles.check, { transform: [{ scale: pop }] }]}>
          <Text style={styles.checkText}>✓</Text>
        </Animated.View>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: R.m,
    padding: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadow,
  },
  rowOverdue: { borderColor: '#FFC4B0', backgroundColor: '#FFF8F4' },
  emoji: { fontSize: 30, marginRight: 12 },
  title: { fontSize: 17, fontWeight: '800', color: C.ink },
  meta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 3, gap: 8 },
  due: { fontSize: 13, color: C.sub, fontWeight: '700' },
  tag: { fontSize: 12, color: C.sub, fontWeight: '700' },
  check: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 3,
    borderColor: C.green,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFFBF5',
  },
  checkText: { fontSize: 22, fontWeight: '900', color: C.green },
});
