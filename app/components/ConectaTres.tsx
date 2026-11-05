"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { sonar } from "../lib/sonido";
import { useTextos, type Textos } from "../lib/i18n";
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

// Se guarda qué mensaje mostrar, no el texto, para que cambie con el idioma.
type Mensaje =
  | { tipo: "intro" }
  | { tipo: "ninguno" }
  | { tipo: "noConecta" }
  | { tipo: "combo"; n: number }
  | { tipo: "fin"; puntos: number };

const INTRO: Mensaje = { tipo: "intro" };

function textoMensaje(m: Mensaje, t: Textos): string {
  switch (m.tipo) {
    case "intro":
      return t.introFrutas;
    case "noConecta":
      return t.noConecta;
    case "combo":
      return t.combo(m.n);
    case "fin":
      return t.finJuego(m.puntos);
    default:
      return "";
  }
}

export default function ConectaTres({ sonido }: { sonido: boolean }) {
  const t = useTextos();
  // El tablero se crea en el cliente (useEffect) para evitar diferencias
  // entre servidor y navegador por el uso de números aleatorios.
  const [board, setBoard] = useState<Board>([]);
  const [selected, setSelected] = useState(-1);
  const [clearing, setClearing] = useState<Set<number>>(new Set());
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(INITIAL_MOVES);
  const [best, setBest] = useState(0);
  const [message, setMessage] = useState<Mensaje>(INTRO);
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
    const id = setTimeout(reset, 0);
    return () => clearTimeout(id);
  }, [reset]);

  async function resolveBoard(start: Board): Promise<number> {
    let b = start;
    let combo = 1;
    let gained = 0;
    let m: Set<number>;
    while ((m = findMatches(b)).size) {
      setClearing(m);
      if (sonido) sonar(combo > 1 ? "combo" : "ficha");
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
    setMessage(combo > 2 ? { tipo: "combo", n: combo - 1 } : { tipo: "ninguno" });
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
      setMessage({ tipo: "noConecta" });
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
      setMessage({ tipo: "fin", puntos: total });
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
    <div className={styles.wrap}>
      <div className={styles.hud}>
        <div>
          {t.puntos}
          <b>{score}</b>
        </div>
        <div>
          {t.movimientos}
          <b>{moves}</b>
        </div>
        <div>
          {t.record}
          <b>{best}</b>
        </div>
      </div>
      <div className={styles.grid}>
        {board.map((v, i) => (
          <button
            key={i}
            type="button"
            aria-label={v == null ? t.vacio : t.casillaN(i + 1)}
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
        {textoMensaje(message, t)}
      </p>
      <button type="button" className={styles.new} onClick={reset}>
        {t.nuevoJuego}
      </button>
    </div>
  );
}
