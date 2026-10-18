# Anime-Tiere – neuer Zeichenentwurf

Elf frontale Tierfiguren, als SVG-Pfade aus einem neu generierten Illustrationsentwurf vektorisiert. Keine eingebetteten Pixelbilder. Die früheren App-Zeichnungen wurden nicht als Vorlage verwendet.

Die Einzeldateien haben transparente Hintergründe. Die Übersicht dient zum Vergleichen.

## Farben ändern
Die CSS-Variablen stehen direkt im style-Attribut am Anfang jeder SVG. Alle vorhandenen Farbtöne sind getrennt änderbar. Nummerierte Varianten erhalten Schatten und kleinere Farbunterschiede; die automatisch vergebenen Rollennamen sind Orientierungshilfen. farben.json enthält alle Werte je Tier.

Bei inline eingebettetem SVG:
```js
svg.style.setProperty('--fell', '#d99b65');
```
Für einen vollständigen Fellwechsel auch die betreffenden nummerierten Fell- und Schattentöne anpassen. Bei Einbettung als img die Werte im SVG-Quelltext ändern.

Hinweis: Die Pfade sind automatisch vektorisiert. Die Zeichnungen sind keine von Hand strukturierten Animations-Rigs; einzelne Körperteile sind nicht als Gelenkgruppen angelegt.
