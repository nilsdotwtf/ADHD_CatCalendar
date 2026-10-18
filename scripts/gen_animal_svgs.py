#!/usr/bin/env python3
"""Bereitet die Anime-Tier-SVGs aus assets/animals/ für die App auf.

Ausgabe: src/data/animalSvgs.ts

Die SVGs sind automatisch vektorisiert (VTracer) und haben je Tier viele
Farbvariablen (--fell, --fell-2, …). Dieses Skript
- entfernt XML-Kopf, Kommentar und Titel,
- rundet Koordinaten auf eine Nachkommastelle (kleinere App),
- "friert" die Augen ein (feste Farben), damit beim Umfärben des Fells die
  Iris nicht mitgefärbt wird,
- speichert Größe, Original-Farben und Augenpositionen (assets/animals/augen.json).

Aufruf: python3 scripts/gen_animal_svgs.py
"""
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / 'assets' / 'animals'
OUT = ROOT / 'src' / 'data' / 'animalSvgs.ts'

FILES = {
    'cat': 'katze',
    'dog': 'hund',
    'rabbit': 'hase',
    'hamster': 'hamster',
    'fox': 'fuchs',
    'giraffe': 'giraffe',
    'cow': 'kuh',
    'penguin': 'pinguin',
    'budgie': 'wellensittich',
    'tiger': 'tiger',
    'raccoon': 'waschbaer',
}

PATH = re.compile(r'<path d="([^"]+)" fill="var\(--([a-z0-9-]+)\)" transform="translate\(([-\d.]+),([-\d.]+)\)"\s*/>')
NUM = re.compile(r'-?\d+(?:\.\d+)?')


def r1(x: float) -> str:
    s = f'{x:.1f}'
    return s[:-2] if s.endswith('.0') else s


def process(species: str, name: str, eyes: list) -> dict:
    s = (SRC / f'{name}.svg').read_text(encoding='utf-8')
    w, h = [float(v) for v in re.search(r'viewBox="0 0 ([\d.]+) ([\d.]+)"', s).groups()]
    style = re.search(r'<svg[^>]*style="([^"]*)"', s).group(1)
    colors = dict(re.findall(r'--([a-z0-9-]+):(#[0-9a-fA-F]{6})', style))

    parts = []
    count = 0
    for m in PATH.finditer(s):
        d, var, tx, ty = m.group(1), m.group(2), float(m.group(3)), float(m.group(4))
        nums = [float(v) for v in NUM.findall(d)]
        xs, ys = nums[0::2], nums[1::2]
        x0, x1, y0, y1 = tx + min(xs), tx + max(xs), ty + min(ys), ty + max(ys)
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        fill = f'var(--{var})'
        for ex, ey, erx, ery in eyes:
            small = (x1 - x0) < erx * 2.6 and (y1 - y0) < ery * 2.6
            inside = ((cx - ex) / (erx * 1.15)) ** 2 + ((cy - ey) / (ery * 1.15)) ** 2 <= 1
            if small and inside:
                fill = colors[var]  # Augen behalten ihre Originalfarbe
        d_short = NUM.sub(lambda n: r1(float(n.group(0))), d)
        parts.append(f'<path d="{d_short}" fill="{fill}" transform="translate({r1(tx)},{r1(ty)})"/>')
        count += 1
    assert count == s.count('<path'), f'{name}: nicht alle Pfade erkannt'
    return {'w': w, 'h': h, 'colors': colors, 'eyes': eyes, 'body': ''.join(parts)}


def main() -> None:
    eyes = json.loads((SRC / 'augen.json').read_text(encoding='utf-8'))
    data = {sp: process(sp, name, eyes[name]) for sp, name in FILES.items()}
    header = (
        '// Automatisch erzeugt aus assets/animals/*.svg mit scripts/gen_animal_svgs.py – nicht von Hand bearbeiten.\n'
        '/* eslint-disable */\n\n'
        'export interface AnimalSvg {\n'
        '  w: number;\n  h: number;\n'
        '  /** Original-Farben der Variablen (--fell, --fell-2, …) */\n  colors: Record<string, string>;\n'
        '  /** Augen: [cx, cy, rx, ry] */\n  eyes: number[][];\n'
        '  body: string;\n}\n\n'
    )
    OUT.write_text(header + 'export const ANIMAL_SVGS: Record<string, AnimalSvg> = ' + json.dumps(data, ensure_ascii=False) + ';\n', encoding='utf-8')
    print(f'{OUT.relative_to(ROOT)}: {len(data)} Tiere, {OUT.stat().st_size // 1024} KB')


if __name__ == '__main__':
    main()
