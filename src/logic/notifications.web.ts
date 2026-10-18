import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { useStore } from '../store';
import { buildPlans, testMessage } from './notificationPlans';

// Variante für den Web-Build: in der Android-App (Capacitor) echte Erinnerungen, im Browser keine
const CHANNEL = 'tierchen';

export const notificationsSupported = Capacitor.isNativePlatform();

let channelReady = false;
async function ensureChannel() {
  if (channelReady || Capacitor.getPlatform() !== 'android') return;
  await LocalNotifications.createChannel({
    id: CHANNEL,
    name: 'Erinnerungen von deinem Tier',
    importance: 4,
    vibration: true,
  });
  channelReady = true;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!notificationsSupported) return false;
  await ensureChannel();
  const current = await LocalNotifications.checkPermissions();
  if (current.display === 'granted') return true;
  const res = await LocalNotifications.requestPermissions();
  return res.display === 'granted';
}

async function cancelAll() {
  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length > 0) {
    await LocalNotifications.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) });
  }
}

/**
 * Plant alle Benachrichtigungen neu. Wird nach jeder Änderung (debounced) und beim
 * Öffnen der App aufgerufen, damit immer der aktuelle Stand verschickt wird.
 */
export async function syncNotifications(): Promise<void> {
  if (!notificationsSupported) return;
  const s = useStore.getState();
  if (!s.onboarded || !s.notificationsEnabled) {
    await cancelAll();
    return;
  }
  const perm = await LocalNotifications.checkPermissions();
  if (perm.display !== 'granted') return;
  await ensureChannel();
  const plans = buildPlans();

  await cancelAll();
  try {
    await LocalNotifications.schedule({
      notifications: plans.map((p, i) => ({
        id: i + 1,
        title: p.title,
        body: p.body,
        channelId: CHANNEL,
        schedule: p.daily ? { on: { hour: p.daily.hour, minute: p.daily.minute }, allowWhileIdle: true } : { at: p.date!, allowWhileIdle: true },
      })),
    });
  } catch (e) {
    console.warn('Benachrichtigungen konnten nicht geplant werden', e);
  }
}

export async function sendTestNotification(): Promise<void> {
  if (!notificationsSupported) return;
  await ensureChannel();
  await LocalNotifications.schedule({
    notifications: [{ id: 9999, ...testMessage(), channelId: CHANNEL, schedule: { at: new Date(Date.now() + 3000), allowWhileIdle: true } }],
  });
}
