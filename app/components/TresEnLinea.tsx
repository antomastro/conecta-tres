"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import {
  CONFIGS,
  conJugada,
  destino,
  marcadorACero,
  masNueva,
  movimientoIA,
  otro,
  partidaNueva,
  resultado,
  siguientePartida,
  type Dificultad,
  type Jugador,
  type ModoTablero,
  type Partida,
} from "../lib/tresEnLinea";
import { sonar, type Efecto } from "../lib/sonido";
import { color, tablero as estiloTablero, type Apariencia } from "../lib/apariencia";
import type { Sala } from "../lib/sala";
import styles from "./TresEnLinea.module.css";

export type Rival = "humano" | Dificultad | "linea";

interface Props {
  modo: ModoTablero;
  rival: Rival;
  sonido: boolean;
  apariencia: Apariencia;
  // Solo en línea:
  sala?: Sala | null;
  inicial?: Partida | null; // estado recibido del rival al cambiar de modo
  anunciar?: boolean; // este móvil cambió el modo: empieza una época nueva
  onModoRemoto?: (p: Partida) => void;
}

const RETARDO_IA = 450;

export default function TresEnLinea({
  modo,
  rival,
  sonido,
  apariencia,
  sala = null,
  inicial = null,
  anunciar = false,
  onModoRemoto,
}: Props) {
  const enLinea = rival === "linea";
  const contraIA = rival === "facil" || rival === "dificil";
  const soy: Jugador = sala?.soy ?? 1;
  const conectado = sala?.conexion === "listo";

  const [p, setP] = useState<Partida>(() =>
    inicial && inicial.modo === modo
      ? inicial
      : partidaNueva(modo, anunciar ? Date.now() : 0),
  );
  // Copia siempre actualizada para los mensajes que llegan por la red.
  const actual = useRef(p);
  // Tras pasar al modo del rival, esta pantalla ya no debe contestar mensajes.
  const retirada = useRef(false);

  const cfg = CONFIGS[p.modo];
  const res = resultado(p.tablero, cfg);
  const turnoIA = contraIA && p.turno === 2 && !res;
  const puedoJugar = !res && !turnoIA && (!enLinea || (conectado && p.turno === soy));

  const nombre = (j: Jugador) =>
    enLinea ? (j === soy ? "Tú" : "Rival") : j === 1 ? "Jugador 1" : contraIA ? "IA" : "Jugador 2";
  // En línea, "color 1" son siempre tus fichas y "color 2" las del rival.
  const usaColor1 = (j: Jugador) => (enLinea ? j === soy : j === 1);
  const claseFicha = (j: Jugador) => (usaColor1(j) ? styles.j1 : styles.j2);
  const nombreColor = (j: Jugador) =>
    color(usaColor1(j) ? apariencia.color1 : apariencia.color2).nombre;

  const sonidoTras = useCallback(
    (sig: Partida, autor: Jugador) => {
      if (!sonido) return;
      const r = resultado(sig.tablero, CONFIGS[sig.modo]);
      const mia = enLinea ? autor === soy : autor === 1;
      let e: Efecto;
      if (!r) e = mia ? "ficha" : "rival";
      else if (r.ganador === 0) e = "empate";
      else {
        const pierdo = enLinea ? r.ganador !== soy : contraIA && r.ganador === 2;
        e = pierdo ? "derrota" : "victoria";
      }
      sonar(e);
    },
    [sonido, enLinea, soy, contraIA],
  );

  const aplicar = useCallback(
    (sig: Partida) => {
      actual.current = sig;
      setP(sig);
      if (sala && conectado) sala.enviar({ partida: sig, de: soy });
    },
    [sala, conectado, soy],
  );

  const colocar = useCallback(
    (casilla: number, j: Jugador) => {
      const sig = conJugada(actual.current, casilla, j);
      aplicar(sig);
      sonidoTras(sig, j);
    },
    [aplicar, sonidoTras],
  );

  // Turno de la IA: piensa un momento y juega.
  useEffect(() => {
    if (!turnoIA) return;
    const t = setTimeout(() => {
      const m = movimientoIA(actual.current.tablero, cfg, 2, rival as Dificultad);
      if (m >= 0) colocar(m, 2);
    }, RETARDO_IA);
    return () => clearTimeout(t);
  }, [turnoIA, cfg, rival, colocar]);

  // En línea: al conectar el rival, le mando mi partida; la versión más alta gana.
  useEffect(() => {
    if (!sala || sala.conexion !== "listo") return;
    sala.enviar({ partida: actual.current, de: soy });
  }, [sala, soy]);

  // En línea: partidas que llegan del otro móvil.
  useEffect(() => {
    if (!sala) return;
    return sala.escuchar((m) => {
      if (retirada.current) return;
      const mia = actual.current;
      const otra = m.partida;
      const empate = !masNueva(otra, mia) && !masNueva(mia, otra);
      // Si empatan, manda la partida del Jugador 1.
      const acepto = masNueva(otra, mia) || (empate && m.de === 1 && soy === 2);
      if (!acepto) {
        // El rival tiene una partida más vieja: le mando la mía.
        if (!empate || soy === 1) sala.enviar({ partida: mia, de: soy });
        return;
      }
      if (otra.modo !== mia.modo) {
        retirada.current = true;
        onModoRemoto?.(otra);
        return;
      }
      const fichas = (x: Partida) => x.tablero.filter((v) => v !== 0).length;
      actual.current = otra;
      setP(otra);
      if (fichas(otra) > fichas(mia) && otra.ultima >= 0) sonidoTras(otra, otro(soy));
    });
  }, [sala, soy, onModoRemoto, sonidoTras]);

  function tocar(i: number) {
    if (!puedoJugar) return;
    const d = destino(p.tablero, cfg, i);
    if (d >= 0) colocar(d, p.turno);
  }

  let estado: string;
  if (enLinea && sala?.conexion === "conectando") estado = "Conectando con la sala…";
  else if (enLinea && sala?.conexion === "esperando") estado = "Esperando a tu rival…";
  else if (enLinea && sala?.conexion === "lleno") estado = "Esta sala ya tiene dos jugadores";
  else if (enLinea && sala?.conexion === "error") estado = "No se pudo conectar a la sala";
  else if (res?.ganador === 0) estado = "¡Empate!";
  else if (res && enLinea) estado = res.ganador === soy ? "¡Ganaste! 🎉" : "Ganó tu rival";
  else if (res) estado = `¡Gana ${nombre(res.ganador)}! 🎉`;
  else if (turnoIA) estado = "La IA está pensando…";
  else if (enLinea) estado = p.turno === soy ? "Tu turno" : "Turno del rival…";
  else estado = `Turno de ${nombre(p.turno)}`;

  const ganadoras = new Set(res?.linea ?? []);
  const verTurno = !res && (!enLinea || conectado);

  return (
    <div className={styles.juego}>
      <div className={styles.estado} aria-live="polite">
        {verTurno && <span className={`${styles.punto} ${claseFicha(p.turno)}`} />}
        {estado}
      </div>

      <div
        className={`${styles.tablero} ${cfg.gravedad ? styles.gravedad : ""}`}
        data-forma={apariencia.forma}
        data-huecos={estiloTablero(apariencia.tablero).redondos ? "redondos" : undefined}
        style={{ gridTemplateColumns: `repeat(${cfg.cols}, 1fr)` }}
      >
        {p.tablero.map((v, i) => {
          const fila = Math.floor(i / cfg.cols);
          return (
            <button
              key={i}
              type="button"
              className={`${styles.casilla} ${ganadoras.has(i) ? styles.ganadora : ""}`}
              onClick={() => tocar(i)}
              disabled={!puedoJugar}
              aria-label={`Fila ${fila + 1}, columna ${(i % cfg.cols) + 1}${
                v ? `: ${nombre(v as Jugador)}` : ""
              }`}
            >
              {v !== 0 && (
                <span
                  className={`${styles.ficha} ${claseFicha(v as Jugador)} ${
                    i === p.ultima ? (cfg.gravedad ? styles.cae : styles.aparece) : ""
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
        {([1, 2] as Jugador[]).map((j) => (
          <div
            key={j}
            className={
              verTurno && p.turno === j ? (usaColor1(j) ? styles.activo1 : styles.activo2) : ""
            }
          >
            <small>
              {nombre(j)} · {nombreColor(j)}
            </small>
            <b className={usaColor1(j) ? styles.texto1 : styles.texto2}>
              {j === 1 ? p.marcador.j1 : p.marcador.j2}
            </b>
          </div>
        ))}
        <div>
          <small>Empates</small>
          <b className={styles.textoAmbar}>{p.marcador.empates}</b>
        </div>
      </div>

      <div className={styles.acciones}>
        <button
          type="button"
          className={styles.principal}
          onClick={() => aplicar(siguientePartida(actual.current))}
        >
          ↻ Nueva partida
        </button>
        <button
          type="button"
          className={styles.secundario}
          onClick={() => aplicar(marcadorACero(actual.current))}
        >
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
