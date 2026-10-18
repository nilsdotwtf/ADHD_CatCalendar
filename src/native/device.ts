import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { BackHandler, Platform } from 'react-native';

// Geräte-Funktionen für die Expo-App; im Web/Capacitor-Build gilt device.web.ts

export function haptic(kind: 'light' | 'success' | 'heavy' = 'light') {
  if (Platform.OS === 'web') return;
  if (kind === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  else Haptics.impactAsync(kind === 'heavy' ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function readClipboard(): Promise<string> {
  return Clipboard.getStringAsync();
}

/** Android-Zurück-Taste: handler gibt true zurück, wenn er sie verarbeitet hat. Liefert eine Abmelde-Funktion. */
export function onBackButton(handler: () => boolean): () => void {
  if (Platform.OS !== 'android') return () => {};
  const sub = BackHandler.addEventListener('hardwareBackPress', handler);
  return () => sub.remove();
}
