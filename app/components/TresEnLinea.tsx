"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import {
  CONFIGS,
  destino,
  jugar,
  movimientoIA,
  otro,
  resultado,
  tableroVacio,
  type Dificultad,
  type Jugador,
  type ModoTablero,
} from "../lib/tresEnLinea";
import { sonar } from "../lib/sonido";
import { color, tablero as estiloTablero, type Apariencia } from "../lib/apariencia";
import styles from "./TresEnLinea.module.css";

export type Rival = "humano" | Dificultad;

interface Props {
  modo: ModoTablero;
  rival: Rival;
  sonido: boolean;
  apariencia: Apariencia;
}

const RETARDO_IA = 450;

export default function TresEnLinea({ modo, rival, sonido, apariencia }: Props) {
  const cfg = CONFIGS[modo];
  const contraIA = rival !== "humano";
  const nombre = (j: Jugador) =>
    j === 1 ? "Jugador 1" : contraIA ? "IA" : "Jugador 2";

  const [tablero, setTablero] = useState(() => tableroVacio(cfg));
  const [turno, setTurno] = useState<Jugador>(1);
  // Quien empieza se alterna en cada partida para que sea justo.
  const [empieza, setEmpieza] = useState<Jugador>(1);
  const [ultima, setUltima] = useState(-1);
  const [marcador, setMarcador] = useState({ j1: 0, j2: 0, empates: 0 });

  const res = resultado(tablero, cfg);
  const turnoIA = contraIA && turno === 2 && !res;

  const efecto = useCallback(
    (e: Parameters<typeof sonar>[0]) => {
      if (sonido) sonar(e);
    },
    [sonido],
  );

  const colocar = useCallback(
    (casilla: number, j: Jugador) => {
      const nt = jugar(tablero, casilla, j);
      setTablero(nt);
      setUltima(casilla);
      const r = resultado(nt, cfg);
      if (!r) {
        setTurno(otro(j));
        efecto(j === 1 ? "ficha" : "rival");
        return;
      }
      if (r.ganador === 0) {
        setMarcador((m) => ({ ...m, empates: m.empates + 1 }));
        efecto("empate");
      } else {
        setMarcador((m) =>
          r.ganador === 1 ? { ...m, j1: m.j1 + 1 } : { ...m, j2: m.j2 + 1 },
        );
        efecto(contraIA && r.ganador === 2 ? "derrota" : "victoria");
      }
    },
    [tablero, cfg, efecto, contraIA],
  );

  // Turno de la IA: piensa un momento y juega.
  useEffect(() => {
    if (!turnoIA) return;
    const t = setTimeout(() => {
      const m = movimientoIA(tablero, cfg, 2, rival as Dificultad);
      if (m >= 0) colocar(m, 2);
    }, RETARDO_IA);
    return () => clearTimeout(t);
  }, [turnoIA, tablero, cfg, rival, colocar]);

  function tocar(i: number) {
    if (res || turnoIA) return;
    const d = destino(tablero, cfg, i);
    if (d >= 0) colocar(d, turno);
  }

  function nuevaPartida() {
    const siguiente = otro(empieza);
    setEmpieza(siguiente);
    setTurno(siguiente);
    setTablero(tableroVacio(cfg));
    setUltima(-1);
  }

  function reiniciarMarcador() {
    setMarcador({ j1: 0, j2: 0, empates: 0 });
    setEmpieza(1);
    setTurno(1);
    setTablero(tableroVacio(cfg));
    setUltima(-1);
  }

  let estado: string;
  if (res?.ganador === 0) estado = "¡Empate!";
  else if (res) estado = `¡Gana ${nombre(res.ganador)}! 🎉`;
  else if (turnoIA) estado = "La IA está pensando…";
  else estado = `Turno de ${nombre(turno)}`;

  const enLinea = new Set(res?.linea ?? []);

  return (
    <div className={styles.juego}>
      <div className={styles.estado} aria-live="polite">
        {!res && (
          <span
            className={`${styles.punto} ${turno === 1 ? styles.j1 : styles.j2}`}
          />
        )}
        {estado}
      </div>

      <div
        className={`${styles.tablero} ${cfg.gravedad ? styles.gravedad : ""}`}
        data-forma={apariencia.forma}
        data-huecos={estiloTablero(apariencia.tablero).redondos ? "redondos" : undefined}
        style={{ gridTemplateColumns: `repeat(${cfg.cols}, 1fr)` }}
      >
        {tablero.map((v, i) => {
          const fila = Math.floor(i / cfg.cols);
          return (
            <button
              key={i}
              type="button"
              className={`${styles.casilla} ${enLinea.has(i) ? styles.ganadora : ""}`}
              onClick={() => tocar(i)}
              disabled={!!res || turnoIA}
              aria-label={`Fila ${fila + 1}, columna ${(i % cfg.cols) + 1}${
                v ? `: ${nombre(v as Jugador)}` : ""
              }`}
            >
              {v !== 0 && (
                <span
                  className={`${styles.ficha} ${v === 1 ? styles.j1 : styles.j2} ${
                    i === ultima ? (cfg.gravedad ? styles.cae : styles.aparece) : ""
                  }`}
                  style={
                    cfg.gravedad ? ({ "--filas": fila + 1 } as CSSProperties) : undefined
                  }
                />
              )}
            </button>
          );
        })}
      </div>

      <div className={styles.marcador}>
        <div className={turno === 1 && !res ? styles.activo1 : ""}>
          <small>Jugador 1 · {color(apariencia.color1).nombre}</small>
          <b className={styles.texto1}>{marcador.j1}</b>
        </div>
        <div className={turno === 2 && !res ? styles.activo2 : ""}>
          <small>
            {nombre(2)} · {color(apariencia.color2).nombre}
          </small>
          <b className={styles.texto2}>{marcador.j2}</b>
        </div>
        <div>
          <small>Empates</small>
          <b className={styles.textoAmbar}>{marcador.empates}</b>
        </div>
      </div>

      <div className={styles.acciones}>
        <button type="button" className={styles.principal} onClick={nuevaPartida}>
          ↻ Nueva partida
        </button>
        <button type="button" className={styles.secundario} onClick={reiniciarMarcador}>
          Reiniciar marcador
        </button>
      </div>

      <p className={styles.ayuda}>
        {cfg.gravedad
          ? "💡 Modo Gravedad (5×4): toca una columna y la ficha cae hasta el fondo. ¡Alinea 3!"
          : "💡 Modo Clásico (3×3): toca cualquier casilla libre. ¡Alinea 3 en horizontal, vertical o diagonal!"}
      </p>
    </div>
  );
}
