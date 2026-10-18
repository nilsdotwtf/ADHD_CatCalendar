import React, { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MiniPet } from '../components/MiniPet';
import { Button, Card, H1, H2, haptic, Sub } from '../components/ui';
import { getSpecies } from '../data/animals';
import { notificationsSupported, requestNotificationPermission, sendTestNotification } from '../logic/notifications';
import { formatClock } from '../logic/time';
import { useStore, useUI } from '../store';
import { C, R } from '../theme';

export function Settings() {
  const insets = useSafeAreaInsets();
  const s = useStore();
  const ui = useUI();
  const sp = getSpecies(s.speciesId);
  const [petName, setPetName] = useState(s.petName);
  const [nickname, setNickname] = useState(s.nickname);

  const toggleNotifications = async (v: boolean) => {
    if (v) {
      const ok = await requestNotificationPermission();
      if (!ok) {
        ui.showToast('Benachrichtigungen sind in den Handy-Einstellungen blockiert.');
        return;
      }
    }
    s.setNotificationsEnabled(v);
  };

  const shiftTime = (i: number, delta: number) => {
    haptic();
    const d = s.drinkTimes[i];
    let total = (d.hour * 60 + d.minute + delta + 24 * 60) % (24 * 60);
    s.setDrinkTime(i, Math.floor(total / 60), total % 60);
  };

  const reset = () => {
    const doIt = () => {
      s.resetAll();
      ui.setTab('home');
    };
    if (Platform.OS === 'web') {
      if (globalThis.confirm?.('Wirklich alles zurücksetzen? Dein Tier und alle Aufgaben gehen verloren.')) doIt();
      return;
    }
    Alert.alert('Wirklich neu anfangen?', 'Dein Tier, alle Aufgaben und Belohnungen gehen verloren.', [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Zurücksetzen', style: 'destructive', onPress: doIt },
    ]);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingTop: insets.top + 12, paddingBottom: 120 }}>
      <H1 style={{ marginBottom: 12 }}>Einstellungen</H1>
      <MiniPet text={`Hier kannst du alles anpassen, ${s.nickname}.`} />

      <Card>
        <H2>Namen</H2>
        <Text style={styles.label}>
          Name {sp.article === 'der' ? 'deines' : 'deiner'} {sp.name}
        </Text>
        <TextInput value={petName} onChangeText={setPetName} style={styles.input} maxLength={20} />
        <Text style={styles.label}>Wie möchtest du in der App genannt werden?</Text>
        <TextInput value={nickname} onChangeText={setNickname} style={styles.input} maxLength={24} />
        <Button
          title="Speichern"
          small
          style={{ marginTop: 12 }}
          disabled={!petName.trim() || !nickname.trim()}
          onPress={() => {
            s.setNames(petName.trim(), nickname.trim());
            ui.showToast('Gespeichert ✅');
          }}
        />
      </Card>

      <Card style={{ marginTop: 14 }}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <H2>🔔 Benachrichtigungen</H2>
            <Sub>{notificationsSupported ? 'Trinken, Aufgaben & wenn sich dein Tier langweilt' : 'Nur in der Handy-App verfügbar'}</Sub>
          </View>
          <Switch value={s.notificationsEnabled} onValueChange={toggleNotifications} disabled={!notificationsSupported} trackColor={{ true: C.green }} />
        </View>
        {s.notificationsEnabled && (
          <Button title="Test-Benachrichtigung" small outline color={C.blue} style={{ marginTop: 10 }} onPress={() => sendTestNotification()} />
        )}
      </Card>

      <Card style={{ marginTop: 14 }}>
        <H2>💧 Trink-Erinnerungen</H2>
        <Sub>Tippe auf − / + um die Uhrzeit in 15-Minuten-Schritten zu ändern.</Sub>
        {s.drinkTimes.map((d, i) => (
          <View key={d.label} style={styles.timeRow}>
            <Text style={styles.timeLabel}>{d.label}</Text>
            <Pressable onPress={() => shiftTime(i, -15)} style={styles.stepBtn}>
              <Text style={styles.stepText}>−</Text>
            </Pressable>
            <Text style={styles.time}>{formatClock(d.hour, d.minute)}</Text>
            <Pressable onPress={() => shiftTime(i, 15)} style={styles.stepBtn}>
              <Text style={styles.stepText}>+</Text>
            </Pressable>
          </View>
        ))}
      </Card>

      <Card style={{ marginTop: 14 }}>
        <H2>Neu anfangen</H2>
        <Sub style={{ marginBottom: 10 }}>Neues Tier wählen – alle Daten werden gelöscht.</Sub>
        <Button title="Alles zurücksetzen" small outline color={C.red} onPress={reset} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 14, fontWeight: '800', color: C.sub, marginTop: 12, marginBottom: 6 },
  input: { backgroundColor: C.bg, borderRadius: R.m, padding: 12, fontSize: 17, fontWeight: '700', color: C.ink },
  row: { flexDirection: 'row', alignItems: 'center' },
  timeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  timeLabel: { flex: 1, fontSize: 16, fontWeight: '800', color: C.ink },
  stepBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EAF1FF', alignItems: 'center', justifyContent: 'center' },
  stepText: { fontSize: 22, fontWeight: '900', color: C.blue },
  time: { fontSize: 20, fontWeight: '900', color: C.ink, width: 76, textAlign: 'center' },
});
