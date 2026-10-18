import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Clipboard } from '@capacitor/clipboard';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

// Geräte-Funktionen für den Web-Build: in der Android-App (Capacitor) nativ, im Browser über Web-APIs

export function haptic(kind: 'light' | 'success' | 'heavy' = 'light') {
  if (!Capacitor.isNativePlatform()) return;
  if (kind === 'success') Haptics.notification({ type: NotificationType.Success }).catch(() => {});
  else Haptics.impact({ style: kind === 'heavy' ? ImpactStyle.Heavy : ImpactStyle.Light }).catch(() => {});
}

export async function readClipboard(): Promise<string> {
  if (Capacitor.isNativePlatform()) {
    const { value } = await Clipboard.read();
    return value ?? '';
  }
  return navigator.clipboard.readText();
}

/** Android-Zurück-Taste: handler gibt true zurück, wenn er sie verarbeitet hat. Sonst geht die App in den Hintergrund. */
export function onBackButton(handler: () => boolean): () => void {
  if (Capacitor.getPlatform() !== 'android') return () => {};
  const sub = App.addListener('backButton', () => {
    if (!handler()) App.minimizeApp();
  });
  return () => {
    sub.then((h) => h.remove());
  };
}
