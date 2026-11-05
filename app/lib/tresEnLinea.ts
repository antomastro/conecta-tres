// Lógica pura de los modos "tres en línea": sin React, para poder probarla aparte.

export type Ficha = 0 | 1 | 2; // 0 = casilla vacía
export type Jugador = 1 | 2;
export type ModoTablero = "clasico" | "gravedad";
export type Dificultad = "facil" | "dificil";

export interface Config {
  filas: number;
  cols: number;
  gravedad: boolean;
}

export const CONFIGS: Record<ModoTablero, Config> = {
  clasico: { filas: 3, cols: 3, gravedad: false },
  gravedad: { filas: 4, cols: 5, gravedad: true },
};

export const EN_LINEA = 3;

export type Resultado =
  | { ganador: Jugador; linea: number[] }
  | { ganador: 0; linea: [] } // empate
  | null; // la partida sigue

export const otro = (j: Jugador): Jugador => (j === 1 ? 2 : 1);

export function tableroVacio(cfg: Config): Ficha[] {
  return Array<Ficha>(cfg.filas * cfg.cols).fill(0);
}

// Casilla donde queda la ficha al tocar `i` (en gravedad cae al fondo de la columna).
// Devuelve -1 si no se puede jugar ahí.
export function destino(t: Ficha[], cfg: Config, i: number): number {
  if (!cfg.gravedad) return t[i] === 0 ? i : -1;
  const c = i % cfg.cols;
  for (let r = cfg.filas - 1; r >= 0; r--) {
    const k = r * cfg.cols + c;
    if (t[k] === 0) return k;
  }
  return -1;
}

export function movimientos(t: Ficha[], cfg: Config): number[] {
  if (!cfg.gravedad) return t.flatMap((v, i) => (v === 0 ? [i] : []));
  const res: number[] = [];
  for (let c = 0; c < cfg.cols; c++) {
    const d = destino(t, cfg, c);
    if (d >= 0) res.push(d);
  }
  return res;
}

const cacheLineas = new Map<string, number[][]>();

// Todas las ventanas de 3 casillas seguidas: horizontales, verticales y diagonales.
export function lineas(cfg: Config): number[][] {
  const clave = `${cfg.filas}x${cfg.cols}`;
  const guardadas = cacheLineas.get(clave);
  if (guardadas) return guardadas;
  const res: number[][] = [];
  const dirs = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];
  for (let r = 0; r < cfg.filas; r++) {
    for (let c = 0; c < cfg.cols; c++) {
      for (const [dr, dc] of dirs) {
        const linea: number[] = [];
        for (let k = 0; k < EN_LINEA; k++) {
          const rr = r + dr * k;
          const cc = c + dc * k;
          if (rr < 0 || rr >= cfg.filas || cc < 0 || cc >= cfg.cols) break;
          linea.push(rr * cfg.cols + cc);
        }
        if (linea.length === EN_LINEA) res.push(linea);
      }
    }
  }
  cacheLineas.set(clave, res);
  return res;
}

export function resultado(t: Ficha[], cfg: Config): Resultado {
  for (const linea of lineas(cfg)) {
    const v = t[linea[0]];
    if (v !== 0 && linea.every((i) => t[i] === v)) return { ganador: v, linea };
  }
  if (t.every((v) => v !== 0)) return { ganador: 0, linea: [] };
  return null;
}

export function jugar(t: Ficha[], i: number, j: Jugador): Ficha[] {
  const nt = [...t];
  nt[i] = j;
  return nt;
}

// --- IA ---

const aleatorio = <T,>(xs: T[]): T => xs[Math.floor(Math.random() * xs.length)];

// Primero las casillas centrales: así la poda alfa-beta corta antes.
function ordenar(movs: number[], cfg: Config): number[] {
  const cr = (cfg.filas - 1) / 2;
  const cc = (cfg.cols - 1) / 2;
  const dist = (i: number) =>
    Math.abs(Math.floor(i / cfg.cols) - cr) + Math.abs((i % cfg.cols) - cc);
  return movs
    .map((m) => ({ m, d: dist(m) + Math.random() * 0.1 }))
    .sort((a, b) => a.d - b.d)
    .map((x) => x.m);
}

// Valora el tablero para `turno`: líneas abiertas con 2 fichas pesan mucho.
function heuristica(t: Ficha[], cfg: Config, turno: Jugador): number {
  let total = 0;
  for (const linea of lineas(cfg)) {
    let mias = 0;
    let suyas = 0;
    for (const i of linea) {
      if (t[i] === turno) mias++;
      else if (t[i] !== 0) suyas++;
    }
    if (suyas === 0 && mias > 0) total += mias === 2 ? 10 : 1;
    else if (mias === 0 && suyas > 0) total -= suyas === 2 ? 10 : 1;
  }
  return total;
}

const GANA = 1000;

function negamax(
  t: Ficha[],
  cfg: Config,
  turno: Jugador,
  prof: number,
  profMax: number,
  alfa: number,
  beta: number,
): number {
  const r = resultado(t, cfg);
  if (r) {
    if (r.ganador === 0) return 0;
    // Ganar antes (o perder más tarde) vale más.
    return r.ganador === turno ? GANA - prof : -(GANA - prof);
  }
  if (prof >= profMax) return heuristica(t, cfg, turno);
  let mejor = -Infinity;
  for (const m of ordenar(movimientos(t, cfg), cfg)) {
    const v = -negamax(jugar(t, m, turno), cfg, otro(turno), prof + 1, profMax, -beta, -alfa);
    if (v > mejor) mejor = v;
    if (v > alfa) alfa = v;
    if (alfa >= beta) break;
  }
  return mejor;
}

export function movimientoIA(t: Ficha[], cfg: Config, yo: Jugador, dif: Dificultad): number {
  const movs = movimientos(t, cfg);
  if (movs.length === 0) return -1;

  if (dif === "facil") {
    // Casi siempre juega al azar; a veces aprovecha una victoria o tapa la tuya.
    if (Math.random() < 0.5) {
      const gana = movs.find((m) => resultado(jugar(t, m, yo), cfg)?.ganador === yo);
      if (gana !== undefined) return gana;
    }
    if (Math.random() < 0.3) {
      const rival = otro(yo);
      const tapa = movs.find((m) => resultado(jugar(t, m, rival), cfg)?.ganador === rival);
      if (tapa !== undefined) return tapa;
    }
    return aleatorio(movs);
  }

  // Difícil: el 3×3 se calcula entero; el 5×4 mira 7 jugadas por delante.
  const profMax = t.length <= 9 ? 9 : 7;
  let mejor = movs[0];
  let mejorValor = -Infinity;
  for (const m of ordenar(movs, cfg)) {
    const v = -negamax(jugar(t, m, yo), cfg, otro(yo), 1, profMax, -Infinity, -mejorValor);
    if (v > mejorValor) {
      mejorValor = v;
      mejor = m;
    }
  }
  return mejor;
}
