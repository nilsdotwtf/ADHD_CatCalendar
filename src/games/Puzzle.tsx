import React, { useMemo, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, haptic } from '../components/ui';
import { useStore, useUI } from '../store';
import { C, R } from '../theme';
import { GameShell } from './GameShell';

const N = 4;
const TILES = ['🧸', '🎀', '⚽', '🧶'];

type Board = number[];

function lineAt(b: Board): number[] | null {
  for (let r = 0; r < N; r++) {
    const row = [0, 1, 2, 3].map((c) => r * N + c);
    if (row.every((i) => b[i] === b[row[0]])) return row;
  }
  for (let c = 0; c < N; c++) {
    const col = [0, 1, 2, 3].map((r) => r * N + c);
    if (col.every((i) => b[i] === b[col[0]])) return col;
  }
  return null;
}

function neighbors(i: number): number[] {
  const r = Math.floor(i / N);
  const c = i % N;
  const out: number[] = [];
  if (r > 0) out.push(i - N);
  if (r < N - 1) out.push(i + N);
  if (c > 0) out.push(i - 1);
  if (c < N - 1) out.push(i + 1);
  return out;
}

function swap(b: Board, a: number, c: number): Board {
  const n = [...b];
  [n[a], n[c]] = [n[c], n[a]];
  return n;
}

/** Startet bei einem gelösten Brett und mischt nur ein paar Züge – kurz & machbar. */
function makeBoard(): Board {
  for (;;) {
    let b: Board = Array.from({ length: N * N }, (_, i) => Math.floor(i / N));
    for (let k = 0; k < 5; k++) {
      const a = Math.floor(Math.random() * N * N);
      const ns = neighbors(a);
      b = swap(b, a, ns[Math.floor(Math.random() * ns.length)]);
    }
    // genau 2 Züge entfernt: nicht geschenkt, aber schnell machbar
    if (!lineAt(b) && !oneMove(b) && findHint(b)) return b;
  }
}

function allSwaps(): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < N * N; i++) for (const j of neighbors(i)) if (j > i) out.push([i, j]);
  return out;
}
const SWAPS = allSwaps();

function oneMove(b: Board): [number, number] | null {
  return SWAPS.find(([i, j]) => lineAt(swap(b, i, j))) ?? null;
}

/** Nächster sinnvoller Zug (Lösung in höchstens 2 Zügen) */
function findHint(b: Board): [number, number] | null {
  return oneMove(b) ?? SWAPS.find(([i, j]) => oneMove(swap(b, i, j))) ?? null;
}

export function Puzzle() {
  const solvePuzzle = useStore((s) => s.solvePuzzle);
  const replace = useUI((s) => s.replace);
  const [board, setBoard] = useState<Board>(makeBoard);
  const [sel, setSel] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [hint, setHint] = useState<[number, number] | null>(null);
  const win = useMemo(() => lineAt(board), [board]);
  const pulse = useRef(new Animated.Value(1)).current;

  const tap = (i: number) => {
    if (win) return;
    haptic();
    setHint(null);
    if (sel === null) return setSel(i);
    if (sel === i) return setSel(null);
    if (!neighbors(sel).includes(i)) return setSel(i);
    const next = swap(board, sel, i);
    setBoard(next);
    setSel(null);
    setMoves((m) => m + 1);
    if (lineAt(next)) {
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.15, duration: 150, useNativeDriver: Platform.OS !== 'web' }),
        Animated.spring(pulse, { toValue: 1, friction: 3, useNativeDriver: Platform.OS !== 'web' }),
      ]).start();
    }
  };

  return (
    <GameShell
      title="🧩 Bonus-Puzzle"
      hint="Tausche benachbarte Felder, bis 4 Gleiche in einer Reihe oder Spalte stehen!"
      progress={win ? 1 : Math.min(0.85, moves * 0.18)}
      done={!!win}
      doneText={"Gelöst! 🎁\nSuch dir deine Belohnung aus"}
      onFinish={() => {
        solvePuzzle();
        replace({ kind: 'bonus' });
      }}
      bg="#FFF7D6"
    >
      <View style={styles.wrap}>
        <Animated.View style={[styles.grid, { transform: [{ scale: pulse }] }]}>
          {board.map((t, i) => {
            const selected = sel === i;
            const canSwap = sel !== null && neighbors(sel).includes(i);
            const inWin = win?.includes(i);
            const hinted = hint?.includes(i);
            return (
              <Pressable
                key={i}
                onPress={() => tap(i)}
                style={[styles.cell, canSwap && styles.cellCan, selected && styles.cellSel, hinted && styles.cellHint, inWin && styles.cellWin]}
              >
                <Text style={styles.tile}>{TILES[t]}</Text>
              </Pressable>
            );
          })}
        </Animated.View>
        <Text style={styles.moves}>Züge: {moves}</Text>
        {!win && (
          <Button title="Tipp anzeigen" icon="💡" small outline color={C.primary} onPress={() => {
              const h = findHint(board);
              // Zu weit verschoben? Dann einfach frisch mischen – kein Frust.
              if (h) setHint(h);
              else {
                setBoard(makeBoard());
                setSel(null);
              }
            }} style={{ marginTop: 10 }} />
        )}
      </View>
    </GameShell>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  grid: { width: '100%', maxWidth: 360, aspectRatio: 1, flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#FFE9A8', borderRadius: R.l, padding: 6 },
  cell: {
    width: '25%',
    height: '25%',
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  cellCan: { backgroundColor: '#FFF5D1' },
  cellSel: { backgroundColor: '#fff', borderColor: C.primary },
  cellHint: { borderColor: C.purple, backgroundColor: '#F1EBFF' },
  cellWin: { backgroundColor: '#C9F2DD', borderColor: C.green },
  tile: { fontSize: 40 },
  moves: { marginTop: 14, fontSize: 16, fontWeight: '800', color: C.sub },
});
