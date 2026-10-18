#!/usr/bin/env python3
"""Bereitet die Anime-Tier-SVGs aus assets/animals/ für die App auf.

Ausgabe: src/data/animalSvgs.ts

Was passiert:
- Titel/ARIA/Style-Attribut werden entfernt (Farben setzt die App zur Laufzeit).
- Die Nase bekommt die Variable --nose (schwarz, bei dunklem Fell rosa).
- Augen und Mund werden durch Platzhalter ersetzt, damit die App je nach
  Stimmung andere Augen (z.B. geschlossen, müde) und Münder einsetzen kann.
- IDs bekommen den Platzhalter __ID__, damit mehrere Tiere gleichzeitig
  angezeigt werden können.
- Die Katze bekommt Flecken (--patch1/--patch2) für die 3-Farben-Wahl.

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

NOSE = re.compile(r'(<path d="M153 173 Q160 170 167 173 Q165 179 160 180 Q155 179 153 173Z" fill=")var\(--(?:pink|ink)\)')
EYES = re.compile(r'<path d="M98 151 C98 129[\s\S]*?</g>')
MOUTH = re.compile(r'<path d="M160 180 L160 186 Q151 196 145 187 M160 186 Q169 196 175 187"[^>]*/>')
COW_MUZZLE = '<ellipse cx="160" cy="182" rx="30" ry="18" fill="var(--mark)" />'
COW_NOSTRIL = '<ellipse cx="147" cy="180" rx="4.5" ry="3" fill="var(--pink)" stroke="none"/>'

CAT_HEAD_PATCHES = (
    '<g clip-path="url(#__ID__-head)" stroke="none">'
    '<ellipse cx="108" cy="92" rx="52" ry="40" fill="var(--patch1)" transform="rotate(-18 108 92)"/>'
    '<ellipse cx="222" cy="118" rx="38" ry="30" fill="var(--patch2)"/>'
    '</g>'
)
CAT_BODY = '<path d="M112 197 C93 209 89 245 99 270 C105 283 127 284 141 279 L179 279 C194 284 216 283 221 270 C231 245 227 209 208 197 Z" fill="var(--fur)" />'
CAT_BODY_PATCHES = (
    '<clipPath id="__ID__-body"><path d="M112 197 C93 209 89 245 99 270 C105 283 127 284 141 279 L179 279 C194 284 216 283 221 270 C231 245 227 209 208 197 Z"/></clipPath>'
    '<g clip-path="url(#__ID__-body)" stroke="none">'
    '<ellipse cx="208" cy="236" rx="30" ry="26" fill="var(--patch1)"/>'
    '<ellipse cx="108" cy="262" rx="20" ry="16" fill="var(--patch2)"/>'
    '</g>'
)


def process(species: str, name: str) -> dict:
    s = (SRC / f'{name}.svg').read_text(encoding='utf-8')
    style = re.search(r'<svg[^>]*style="([^"]*)"', s).group(1)
    defaults = dict(kv.strip()[2:].split(':') for kv in style.split(';') if kv.strip())
    s = re.sub(r'<title[^>]*>.*?</title>', '', s, flags=re.S)
    s = re.sub(r'<svg[^>]*>', '', s, count=1).replace('</svg>', '')
    s = s.replace(f'{name}-', '__ID__-')

    s, n = NOSE.subn(r'\1var(--nose)', s)
    if species == 'cow':
        assert COW_MUZZLE in s
        s = s.replace(COW_MUZZLE, COW_MUZZLE.replace('var(--mark)', 'var(--nose)'))
        s = s.replace(COW_NOSTRIL, COW_NOSTRIL.replace('var(--pink)', 'var(--nostril)'))

    m = EYES.search(s)
    assert m, f'Augen in {name} nicht gefunden'
    eyes = m.group(0)
    s = s[: m.start()] + '<!--EYES-->' + s[m.end():]

    mouth = ''
    mm = MOUTH.search(s)
    if mm:
        mouth = mm.group(0)
        s = s[: mm.start()] + '<!--MOUTH-->' + s[mm.end():]

    if species == 'cat':
        anchor = '<path d="M139 79 L149 91'
        assert anchor in s and CAT_BODY in s
        s = s.replace(anchor, CAT_HEAD_PATCHES + anchor, 1)
        s = s.replace(CAT_BODY, CAT_BODY + CAT_BODY_PATCHES, 1)

    return {'body': s, 'eyes': eyes, 'mouth': mouth, 'defaults': defaults}


def main() -> None:
    data = {sp: process(sp, name) for sp, name in FILES.items()}
    header = (
        '// Automatisch erzeugt aus assets/animals/*.svg mit scripts/gen_animal_svgs.py – nicht von Hand bearbeiten.\n'
        '/* eslint-disable */\n\n'
        'export interface AnimalSvg {\n  body: string;\n  eyes: string;\n  mouth: string;\n  defaults: Record<string, string>;\n}\n\n'
    )
    OUT.write_text(header + 'export const ANIMAL_SVGS: Record<string, AnimalSvg> = ' + json.dumps(data, ensure_ascii=False, indent=1) + ';\n', encoding='utf-8')
    print(f'{OUT.relative_to(ROOT)}: {len(data)} Tiere')


if __name__ == '__main__':
    main()
