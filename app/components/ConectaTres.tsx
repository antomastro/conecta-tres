"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./ConectaTres.module.css";

const N = 8;
const TILES = ["🍎", "🍋", "🍇", "🍓", "🍊", "🥝"];
const INITIAL_MOVES = 20;
const BEST_KEY = "c3best";

type Board = (number | null)[];

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const rnd = () => Math.floor(Math.random() * TILES.length);

function newBoard(): Board {
  const b: Board = [];
  for (let i = 0; i < N * N; i++) {
    const r = Math.floor(i / N);
    const c = i % N;
    let v: number;
    do {
      v = rnd();
    } while (
      (c > 1 && b[i - 1] === v && b[i - 2] === v) ||
      (r > 1 && b[i - N] === v && b[i - 2 * N] === v)
    );
    b.push(v);
  }
  return b;
}

function findMatches(b: Board): Set<number> {
  const s = new Set<number>();
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const i = r * N + c;
      const v = b[i];
      if (v == null) continue;
      if (c <= N - 3 && b[i + 1] === v && b[i + 2] === v) {
        s.add(i);
        s.add(i + 1);
        s.add(i + 2);
      }
      if (r <= N - 3 && b[i + N] === v && b[i + 2 * N] === v) {
        s.add(i);
        s.add(i + N);
        s.add(i + 2 * N);
      }
    }
  }
  return s;
}

function applyGravity(b: Board): Board {
  const nb = [...b];
  for (let c = 0; c < N; c++) {
    const col: number[] = [];
    for (let r = N - 1; r >= 0; r--) {
      const v = nb[r * N + c];
      if (v != null) col.push(v);
    }
    for (let r = N - 1, k = 0; r >= 0; r--, k++) {
      nb[r * N + c] = k < col.length ? col[k] : rnd();
    }
  }
  return nb;
}

const isAdjacent = (a: number, c: number) =>
  Math.abs(Math.floor(a / N) - Math.floor(c / N)) +
    Math.abs((a % N) - (c % N)) ===
  1;

const INTRO = "Toca una fruta y luego una vecina para intercambiarlas.";

export default function ConectaTres() {
  // El tablero se crea en el cliente (useEffect) para evitar diferencias
  // entre servidor y navegador por el uso de números aleatorios.
  const [board, setBoard] = useState<Board>([]);
  const [selected, setSelected] = useState(-1);
  const [clearing, setClearing] = useState<Set<number>>(new Set());
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(INITIAL_MOVES);
  const [best, setBest] = useState(0);
  const [message, setMessage] = useState(INTRO);
  const busy = useRef(false);
  const over = useRef(false);

  const reset = useCallback(() => {
    setBoard(newBoard());
    setSelected(-1);
    setClearing(new Set());
    setScore(0);
    setMoves(INITIAL_MOVES);
    setMessage(INTRO);
    try {
      setBest(Number(localStorage.getItem(BEST_KEY)) || 0);
    } catch {
      /* sin almacenamiento disponible */
    }
    busy.current = false;
    over.current = false;
  }, []);

  useEffect(() => {
    // Se difiere un instante: el tablero aleatorio solo existe en el cliente.
    const t = setTimeout(reset, 0);
    return () => clearTimeout(t);
  }, [reset]);

  async function resolveBoard(start: Board): Promise<number> {
    let b = start;
    let combo = 1;
    let gained = 0;
    let m: Set<number>;
    while ((m = findMatches(b)).size) {
      setClearing(m);
      await sleep(250);
      const points = m.size * 10 * combo;
      gained += points;
      combo++;
      b = [...b];
      m.forEach((i) => (b[i] = null));
      setClearing(new Set());
      b = applyGravity(b);
      setBoard(b);
      setScore((s) => s + points);
      await sleep(200);
    }
    setMessage(combo > 2 ? `¡Combo x${combo - 1}! 🎉` : "");
    return gained;
  }

  async function trySwap(a: number, c: number) {
    busy.current = true;
    const swapped = [...board];
    [swapped[a], swapped[c]] = [swapped[c], swapped[a]];
    setSelected(-1);
    setBoard(swapped);
    await sleep(150);

    if (!findMatches(swapped).size) {
      setBoard(board);
      setMessage("Ese movimiento no conecta tres.");
      busy.current = false;
      return;
    }

    const remaining = moves - 1;
    setMoves(remaining);
    const gained = await resolveBoard(swapped);

    const total = score + gained;
    if (total > best) {
      setBest(total);
      try {
        localStorage.setItem(BEST_KEY, String(total));
      } catch {
        /* sin almacenamiento disponible */
      }
    }
    if (remaining <= 0) {
      over.current = true;
      setMessage(`¡Fin del juego! Puntos: ${total} 🏆`);
    }
    busy.current = false;
  }

  function handleTile(i: number) {
    if (busy.current || over.current) return;
    if (selected < 0) setSelected(i);
    else if (selected === i) setSelected(-1);
    else if (isAdjacent(selected, i)) void trySwap(selected, i);
    else setSelected(i);
  }

  return (
    <main className={styles.wrap}>
      <h1>🍓 Conecta Tres</h1>
      <div className={styles.hud}>
        <div>
          Puntos<b>{score}</b>
        </div>
        <div>
          Movimientos<b>{moves}</b>
        </div>
        <div>
          Récord<b>{best}</b>
        </div>
      </div>
      <div className={styles.grid}>
        {board.map((v, i) => (
          <button
            key={i}
            type="button"
            aria-label={v == null ? "vacío" : `casilla ${i + 1}`}
            className={`${styles.tile} ${i === selected ? styles.sel : ""} ${
              clearing.has(i) ? styles.pop : ""
            }`}
            onClick={() => handleTile(i)}
          >
            {v == null ? "" : TILES[v]}
          </button>
        ))}
      </div>
      <p className={styles.msg} aria-live="polite">
        {message}
      </p>
      <button type="button" className={styles.new} onClick={reset}>
        Nuevo juego
      </button>
    </main>
  );
}
