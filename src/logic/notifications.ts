import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useStore } from '../store';
import { buildPlans, testMessage } from './notificationPlans';

// Variante für die Expo-App; im Web/Capacitor-Build gilt notifications.web.ts
const CHANNEL = 'tierchen';

export const notificationsSupported = Platform.OS !== 'web';

if (notificationsSupported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!notificationsSupported) return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: 'Erinnerungen von deinem Tier',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 120, 200],
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const res = await Notifications.requestPermissionsAsync();
  return res.granted;
}

/**
 * Plant alle Benachrichtigungen neu. Wird nach jeder Änderung (debounced) und beim
 * Öffnen der App aufgerufen, damit immer der aktuelle Stand verschickt wird.
 */
export async function syncNotifications(): Promise<void> {
  if (!notificationsSupported) return;
  const s = useStore.getState();
  if (!s.onboarded || !s.notificationsEnabled) {
    await Notifications.cancelAllScheduledNotificationsAsync();
    return;
  }
  const perm = await Notifications.getPermissionsAsync();
  if (!perm.granted) return;
  const plans = buildPlans();

  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const p of plans) {
    const trigger: Notifications.NotificationTriggerInput = p.daily
      ? { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: p.daily.hour, minute: p.daily.minute, channelId: CHANNEL }
      : { type: Notifications.SchedulableTriggerInputTypes.DATE, date: p.date!, channelId: CHANNEL };
    try {
      await Notifications.scheduleNotificationAsync({ content: { title: p.title, body: p.body }, trigger });
    } catch (e) {
      console.warn('Benachrichtigung konnte nicht geplant werden', e);
    }
  }
}

export async function sendTestNotification(): Promise<void> {
  if (!notificationsSupported) return;
  await Notifications.scheduleNotificationAsync({
    content: testMessage(),
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 3, channelId: CHANNEL },
  });
}
