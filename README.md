# 🐾 Tierchen – ADHS-freundlicher Aufgaben-Begleiter

Eine Handy-App (iOS & Android, gebaut mit Expo / React Native), in der dein eigenes Tier dich durch den Alltag begleitet.
Erledigte Aufgaben bringen Belohnungen, mit denen du dein Tier verwöhnst. Kein Druck, nur kleine Erfolge.

## Funktionen

**Start**
- 10 Tiere: Katze, Hund, Hase, Hamster, Fuchs, Giraffe, Kuh, Pinguin, Wellensittich, Tiger
- Logische Anzahl an Farben pro Tier (z. B. Glückskatze & Wellensittich 3, Giraffe 2), jede Farbwahl mit **10 echten Farben** des Tieres
- Name für das Tier und „Wie möchtest du in der App genannt werden?“

**Startbildschirm**
- Das Tier atmet, reagiert auf Antippen und zeigt seinen Zustand: Hunger 🍗❓, müde 💤, schlechte Laune 🌧️, dreckiges Fell (Flecken & Fliege)
- Vier Bedürfnisse: Hunger, Fellpflege, Energie, Laune
- Keine Aufgaben → das Tier ist zufrieden. Überfällige Aufgaben → die Bedürfnisse sinken nach und nach.
- Mehr als 1 Tag ohne Aufgabe → das Tier langweilt sich (mit Benachrichtigung)

**Aufgaben**
- 15 Vorschläge (Spülmaschine, Wäsche, Staubsaugen, Müll …) oder eigene Aufgabe
- Wiederholung: einmalig, täglich, wöchentlich, monatlich
- Wann: **Heute irgendwann** (Standard, mit Abend-Erinnerung um 19 Uhr), **Ohne Datum**, Jetzt, in 1 / 3 Std, heute Abend, morgen, Wochenende
- Erinnerung: jede halbe Stunde, jede Stunde oder eigene Stunden/Minuten (über 24 Std wird in Tagen angezeigt, z. B. „Alle 1 Tag 2 Std“)
- **Import aus der Notizen-App**: Liste in Apple Notizen / Google Notizen / Samsung Notes kopieren, in der App einfügen, fertig. Checkboxen (`☐`, `- [ ]`), Aufzählungen und Nummerierungen werden erkannt, bereits abgehakte Einträge sind abgewählt.

**Belohnungen**
- Jede erledigte Aufgabe: Konfetti, XP und ein Pflege-Item (Futter, Bürste, Kuschelkissen, Streichel-Herz), passend zum Bedürfnis, das gerade am meisten fehlt
- Items verbrauchen sich beim Benutzen, jedes Item startet ein kurzes Minispiel (5–10 Sekunden, man kann nicht verlieren):
  - 🍗 **Füttern**: Futter antippen, das Tier schnappt es
  - 🪮 **Bürsten**: Schmutz wegwischen
  - 💝 **Streicheln**: mit dem Finger übers Tier streichen
  - 🛏️ **Schlafen**: Schäfchen zählen
- Alle 3 Aufgaben gibt es ein **Bonus-Puzzle** (4 Gleiche in eine Reihe tauschen, mit Tipp-Knopf). Danach suchst du dir aus:
  - **Spielzeug** (Ball, Wollknäuel, Ente, Teddy, Frisbee, Maus) in 10 Farben, mit eigenem Fang-Minispiel
  - **Kleidung**, weiblich (Schleife, Krone, Blumenkranz, Haarreif, Perlenkette) oder männlich (Fliege, Cap, Zylinder, Krawatte, Mütze), in 10 Farben
- Level mit Geschenken, Tages-Serie 🔥, 15 Ziele mit Belohnungen (z. B. goldene Krone nach 15 Aufgaben)

**Benachrichtigungen** (immer mit Tier und deinem Namen)
- Trinken: morgens, mittags, abends (Uhrzeiten einstellbar), „Getrunken!“-Knopf auf dem Startbildschirm
- Aufgaben-Erinnerungen im gewählten Abstand
- Abend-Erinnerung für „Heute irgendwann“-Aufgaben
- Langeweile-Hinweis nach 24 Std ohne Aufgabe

## Auf dem Handy starten

Du brauchst [Node.js](https://nodejs.org) (Version 20 oder neuer) auf dem Computer.

```bash
npm install
npx expo start
```

Dann den QR-Code mit der App **Expo Go** scannen ([iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)).

> **Hinweis zu Benachrichtigungen:** Lokale Erinnerungen funktionieren in Expo Go. Am zuverlässigsten laufen sie aber
> in einer eigenen Installation: `npx eas-cli@latest build --profile development` (oder `npx expo run:android` / `run:ios`).

Browser-Vorschau (ohne Benachrichtigungen): `npx expo start --web`

## Entwicklung

```bash
npm run typecheck   # TypeScript prüfen
```

Aufbau:

```
App.tsx                 Tabs, Overlays, Lebenszyklus (Bedürfnisse, Benachrichtigungen)
src/data/               Tiere & Farben, Items, Aufgaben-Vorschläge, Ziele
src/logic/              Bedürfnisse, Zeit-Hilfen, Benachrichtigungen, Notizen-Import
src/store.ts            App-Zustand (zustand + AsyncStorage, wird lokal gespeichert)
src/components/         Tier-Zeichnungen (SVG), UI-Bausteine, Konfetti
src/screens/            Onboarding, Zuhause, Aufgaben, Ziele, Schrank, Einstellungen
src/overlays/           Aufgaben-Editor, Notizen-Import, Belohnungen, Bonus-Auswahl
src/games/              Minispiele & Bonus-Puzzle
```

Alle Daten bleiben auf dem Gerät, es gibt keinen Server und kein Konto.
