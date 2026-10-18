# 🐾 Tierchen – ADHS-freundlicher Aufgaben-Begleiter

Eine Handy-App (iOS & Android, gebaut mit Expo / React Native), in der dein eigenes Tier dich durch den Alltag begleitet.
Erledigte Aufgaben bringen Belohnungen, mit denen du dein Tier verwöhnst. Kein Druck, nur kleine Erfolge.

## Funktionen

**Start**
- 11 Tiere: Katze, Hund, Hase, Hamster, Fuchs, Giraffe, Kuh, Pinguin, Wellensittich, Tiger, Waschbär
- Logische Anzahl an Farben pro Tier (z. B. Katze 3: Fell, Flecken, Streifen · Giraffe 2 · Hase 1), jede Farbwahl mit **10 echten Farben** des Tieres
- Name für das Tier und „Wie möchtest du in der App genannt werden?“

**Startbildschirm**
- Flauschige Anime-Tiere (SVG-Illustrationen in `assets/animals/`); die gewählten Farben werden inklusive aller Schattierungen umgefärbt, Gesichtsausdrücke, Matschspritzer und Kleidung (im selben Zeichenstil) kommen als Ebenen darüber
- Das Tier atmet, reagiert auf Antippen und zeigt seinen Zustand: Hunger 🍗❓, müde 💤, schlechte Laune 🌧️, dreckiges Fell (Matschspritzer und Fliege – beim Bürsten wischst du sie weg)
- Vier Bedürfnisse: Hunger, Fellpflege, Energie, Laune
- Keine Aufgaben → das Tier ist zufrieden. Überfällige Aufgaben → die Bedürfnisse sinken nach und nach.
- Mehr als 1 Tag ohne Aufgabe → das Tier langweilt sich (mit Benachrichtigung)

**Aufgaben**
- 15 Vorschläge (Spülmaschine, Wäsche, Staubsaugen, Müll …) oder eigene Aufgabe
- Wiederholung: einmalig, täglich, wöchentlich, monatlich
- Wann: **Heute irgendwann** (Standard, mit Abend-Erinnerung um 19 Uhr), **Ohne Datum**, Jetzt, in 1 / 3 Std, heute Abend, morgen, Wochenende – oder **Tag & Uhrzeit frei wählen** (Stunden und Minuten, auch „irgendwann am Tag“)
- Erinnerung: einmal zur Uhrzeit, jede halbe Stunde, jede Stunde oder eigene Stunden/Minuten (über 24 Std wird in Tagen angezeigt, z. B. „Alle 1 Tag 2 Std“)
- **Tagesansicht**: Erledigte Aufgaben verschwinden aus „Heute“, Wiederholungen tauchen erst an ihrem nächsten Tag wieder auf. Über die Tagesleiste springst du zu morgen & den nächsten Tagen und kannst **vorarbeiten**. „✅ Heute geschafft“ zählt mit.
- **Import aus der Notizen-App**: Liste in Apple Notizen / Google Notizen / Samsung Notes kopieren, in der App einfügen, fertig. Checkboxen (`☐`, `- [ ]`), Aufzählungen und Nummerierungen werden erkannt, bereits abgehakte Einträge sind abgewählt.

**Belohnungen**
- Jede erledigte Aufgabe: Konfetti, ein **motivierender Spruch**, XP und ein Pflege-Item (Futter, Bürste, Kuschelkissen, Streichel-Herz), passend zum Bedürfnis, das gerade am meisten fehlt. Es gibt kein Starterpaket – Verwöhnen geht erst nach der ersten erledigten Aufgabe
- Items verbrauchen sich beim Benutzen, jedes Item startet ein kurzes Minispiel (5–10 Sekunden, man kann nicht verlieren):
  - 🍗 **Füttern**: Futter antippen, das Tier schnappt es
  - 🪮 **Bürsten**: Schmutz wegwischen (nur Wischen zählt, Antippen putzt nicht)
  - 💝 **Streicheln**: mit dem Finger übers Tier streichen
  - 🛏️ **Schlafen**: Schäfchen zählen
- Alle 3 Aufgaben gibt es ein **Bonus-Puzzle** (4 Gleiche in eine Reihe tauschen, mit Tipp-Knopf). Danach suchst du dir aus:
  - **Spielzeug** (Ball, Wollknäuel, Ente, Teddy, Frisbee, Maus) in 10 Farben, mit eigenem Fang-Minispiel
  - **Kleidung**, weiblich (Schleife, Krone, Blumenkranz, Haarreif, Perlenkette) oder männlich (Fliege, Cap, Zylinder, Krawatte, Mütze), in 10 Farben
- Level mit Geschenken, Tages-Serie 🔥, 15 Ziele mit Belohnungen (z. B. goldene Krone nach 15 Aufgaben)
- Ab der 7. erledigten Aufgabe am Tag ist das Tier stolz auf dich und fragt, ob du nicht lieber eine **Pause** machen willst – damit du dich nicht übernimmst

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

## Änderungsverlauf

- **Tierchen 1.0** – 10 Tiere mit echten Farben, Aufgaben mit Wiederholung & Erinnerungen, Notizen-Import, Pflege-Minispiele, Bonus-Puzzle mit Spielzeug & Kleidung, Level, Ziele, Trink-Erinnerungen
- **„Heute irgendwann“ & „Ohne Datum“** – Aufgaben ohne feste Uhrzeit mit Abend-Erinnerung
- **Tagesansicht & Vorarbeiten** – Erledigtes verschwindet, Sprung zu den nächsten Tagen, freie Wahl von Tag & Uhrzeit
- **Motivation & Pausen** – Spruch nach jeder Aufgabe, Pausen-Vorschlag ab der 7. Aufgabe am Tag
- **Neuer Zeichenstil** – plüschiger Chibi-Look mit Kontur, Fellbüscheln, Schattierung und großen Augen; zerzaustes Fell bei wenig Pflege
- **Anime-Neuzeichnung** – alle 10 Tiere komplett neu mit Kurvenpfaden nach Referenzbild gezeichnet (Halbprofil, Cel-Shading)
- **Neue Tier-Grafiken** – die gelieferten Anime-SVGs ersetzen die selbst gezeichneten Tiere; Waschbär als 11. Tier
- **Finale Tier-Illustrationen** – flauschige, vektorisierte Anime-Tiere; Farbwahl färbt Fell samt Schattierungen um (Zuordnung in `src/data/animalColors.ts`)
- **Bürsten & Streicheln dauern länger** – jeder Fleck braucht etwa 4× drüberwischen (vorher gut 1×), Streicheln etwa 18 Striche statt 7
- **Bürsten nur durch Wischen** – Matschflecken verschwinden je nach gewischter Strecke, Antippen allein reicht nicht; Tierauswahl ohne Farbanzahl
- **Kein Starterpaket** – zu Beginn sind keine Pflege-Items da; die Bedürfnisse lassen sich erst nach einer erledigten Aufgabe decken (Hinweis unter „Verwöhnen“)
- **Umfärben überarbeitet** – Umrandungen bleiben auch bei sehr hellen Farben sichtbar (dünne Linien werden beim Generieren erkannt), Waschbär-Maske/Beine/Schwanzringe färben sich ohne Pünktchen mit, Nase immer schwarz bzw. rosa bei dunklem Fell, Fuchs-Brust nur noch in hellen Tönen
- **Kleidung & Matsch im Tier-Stil** – Hüte und Halsschmuck neu gezeichnet (braune Kontur, Schatten, Glanz), Dreck als Matschspritzer, zerzaustes Fell entfernt

## Entwicklung

```bash
npm run typecheck   # TypeScript prüfen
```

Aufbau:

```
App.tsx                 Tabs, Overlays, Lebenszyklus (Bedürfnisse, Benachrichtigungen)
src/data/               Tiere & Farben, Items, Aufgaben-Vorschläge, Ziele
src/logic/              Bedürfnisse, Zeit-Hilfen, Tagesansicht, Benachrichtigungen, Notizen-Import
src/store.ts            App-Zustand (zustand + AsyncStorage, wird lokal gespeichert)
assets/animals/         Tier-SVGs (Quelle) + augen.json (Augenpositionen) – nach Änderungen `python3 scripts/gen_animal_svgs.py` ausführen
src/data/animalColors.ts welche Farbtöne zu welcher Farbwahl gehören
src/data/animalSvgs.ts  daraus erzeugt (nicht von Hand bearbeiten)
src/components/         Tier-Anzeige (AnimalArt.tsx), Kleidung (Clothing.tsx), UI-Bausteine, Konfetti
src/screens/            Onboarding, Zuhause, Aufgaben, Ziele, Schrank, Einstellungen
src/overlays/           Aufgaben-Editor, Notizen-Import, Belohnungen, Bonus-Auswahl
src/games/              Minispiele & Bonus-Puzzle
```

Alle Daten bleiben auf dem Gerät, es gibt keinen Server und kein Konto.
