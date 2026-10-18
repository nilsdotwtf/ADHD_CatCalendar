#!/usr/bin/env python3
"""Bereitet die Anime-Tier-SVGs aus assets/animals/ für die App auf.

Ausgabe: src/data/animalSvgs.ts

Die SVGs sind automatisch vektorisiert (VTracer) und haben je Tier viele
Farbvariablen (--fell, --fell-2, …). Dieses Skript
- entfernt XML-Kopf, Kommentar und Titel,
- rundet Koordinaten auf eine Nachkommastelle (kleinere App),
- "friert" die Augen ein (feste Farben), damit beim Umfärben des Fells die
  Iris nicht mitgefärbt wird,
- markiert dünne, dunkle Umrandungslinien (--l-<var>), damit sie beim Umfärben
  dunkel bleiben – sonst verschwinden sie bei sehr hellen Farben,
- markiert die Nase (--nose), damit sie immer schwarz bzw. bei dunklem Fell
  rosa ist,
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


# Tiere mit Schnabel bzw. großer rosa Schnauze behalten ihre Nase
NO_NOSE = {'penguin', 'budgie', 'cow', 'giraffe'}


def lightness(hex_color: str) -> float:
    r, g, b = (int(hex_color[i:i + 2], 16) / 255 for i in (1, 3, 5))
    return (max(r, g, b) + min(r, g, b)) / 2


def polys(d: str) -> list:
    out, cur = [], []
    for seg in re.findall(r'[MLCZ][^MLCZ]*', d):
        n = [float(v) for v in NUM.findall(seg[1:])]
        if seg[0] == 'M':
            if cur:
                out.append(cur)
            cur = [(n[0], n[1])]
        elif seg[0] == 'L':
            cur += [(n[i], n[i + 1]) for i in range(0, len(n), 2)]
        elif seg[0] == 'C':
            cur += [(n[i + 4], n[i + 5]) for i in range(0, len(n), 6)]
    if cur:
        out.append(cur)
    return out


def area(p: list) -> float:
    return abs(sum(p[i][0] * p[i - 1][1] - p[i - 1][0] * p[i][1] for i in range(len(p)))) / 2


def perimeter(p: list) -> float:
    return sum(((p[i][0] - p[i - 1][0]) ** 2 + (p[i][1] - p[i - 1][1]) ** 2) ** 0.5 for i in range(len(p)))


def is_line(d: str, dist: float) -> bool:
    """Dünn und langgezogen = Umrandung (kleine, runde Tupfer zählen nicht)."""
    ps = polys(d)
    if not ps:
        return False
    a = max(0.0, area(ps[0]) - sum(area(q) for q in ps[1:]))
    per = sum(perimeter(q) for q in ps)
    if per <= 0:
        return False
    thick = 2 * a / per
    length = per / 2
    return thick < dist * LINE_THICK and length > thick * 6


# Linienstärke relativ zum Augenabstand, bis zu der ein Pfad als Umrandung gilt
LINE_THICK = 0.05
LINE_MAX_L = 0.45


def process(species: str, name: str, eyes: list) -> dict:
    s = (SRC / f'{name}.svg').read_text(encoding='utf-8')
    w, h = [float(v) for v in re.search(r'viewBox="0 0 ([\d.]+) ([\d.]+)"', s).groups()]
    style = re.search(r'<svg[^>]*style="([^"]*)"', s).group(1)
    colors = dict(re.findall(r'--([a-z0-9-]+):(#[0-9a-fA-F]{6})', style))

    (lx, ly, _, _), (rx, ry, _, _) = eyes
    dist = abs(rx - lx)
    ncx, ney = (lx + rx) / 2, (ly + ry) / 2
    parts = []
    count = 0
    for m in PATH.finditer(s):
        d, var, tx, ty = m.group(1), m.group(2), float(m.group(3)), float(m.group(4))
        nums = [float(v) for v in NUM.findall(d)]
        xs, ys = nums[0::2], nums[1::2]
        x0, x1, y0, y1 = tx + min(xs), tx + max(xs), ty + min(ys), ty + max(ys)
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        fill = f'var(--{var})'
        if lightness(colors[var]) < LINE_MAX_L and is_line(d, dist):
            fill = f'var(--l-{var})'
        for ex, ey, erx, ery in eyes:
            small = (x1 - x0) < erx * 2.6 and (y1 - y0) < ery * 2.6
            inside = ((cx - ex) / (erx * 1.15)) ** 2 + ((cy - ey) / (ery * 1.15)) ** 2 <= 1
            if small and inside:
                fill = colors[var]  # Augen behalten ihre Originalfarbe
        # Nase: mittig, 15–31 % des Augenabstands unter den Augen (darunter folgt der Mund)
        rel_y = (cy - ney) / dist
        in_nose = abs(cx - ncx) < dist * 0.1 and 0.15 < rel_y < 0.31 and (x1 - x0) < dist * 0.3 and (y1 - y0) < dist * 0.2
        if species not in NO_NOSE and in_nose and (lightness(colors[var]) < 0.45 or var.startswith('rosa')):
            fill = 'var(--nose)'
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
