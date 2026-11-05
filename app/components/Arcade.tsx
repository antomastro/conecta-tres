"use client";

import { useState } from "react";
import ConectaTres from "./ConectaTres";
import TresEnLinea, { type Rival } from "./TresEnLinea";
import styles from "./Arcade.module.css";

type Modo = "clasico" | "gravedad" | "frutas";

const MODOS: { id: Modo; texto: string }[] = [
  { id: "clasico", texto: "Modo Clásico · 3 × 3" },
  { id: "gravedad", texto: "Modo Gravedad · 5 × 4" },
  { id: "frutas", texto: "Modo Frutas · combina 3" },
];

const RIVALES: { id: Rival; texto: string }[] = [
  { id: "facil", texto: "IA · fácil" },
  { id: "dificil", texto: "IA · difícil" },
  { id: "humano", texto: "2 jugadores" },
];

export default function Arcade() {
  const [modo, setModo] = useState<Modo>("clasico");
  const [rival, setRival] = useState<Rival>("facil");
  const [sonido, setSonido] = useState(true);
  const frutas = modo === "frutas";

  return (
    <main className={styles.arcade}>
      <header className={styles.cabecera}>
        <p className={styles.antetitulo}>Arcade · Estrategia</p>
        <h1>
          Conecta <span>Tres</span>
        </h1>
        <p className={styles.lema}>Tres fichas en línea. Una partida puede cambiarlo todo.</p>
      </header>

      <section className={styles.panel}>
        <div className={styles.opciones}>
          <label>
            <span>Modo de tablero</span>
            <select value={modo} onChange={(e) => setModo(e.target.value as Modo)}>
              {MODOS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.texto}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Rival</span>
            <select
              value={frutas ? "solo" : rival}
              disabled={frutas}
              onChange={(e) => setRival(e.target.value as Rival)}
            >
              {frutas ? (
                <option value="solo">Solitario</option>
              ) : (
                RIVALES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.texto}
                  </option>
                ))
              )}
            </select>
          </label>
          <button
            type="button"
            className={styles.sonido}
            onClick={() => setSonido((s) => !s)}
            aria-pressed={sonido}
          >
            {sonido ? "🔊 Sonido: sí" : "🔇 Sonido: no"}
          </button>
        </div>

        {frutas ? (
          <ConectaTres sonido={sonido} />
        ) : (
          // La key reinicia tablero y marcador al cambiar de modo o de rival.
          <TresEnLinea key={`${modo}-${rival}`} modo={modo} rival={rival} sonido={sonido} />
        )}
      </section>

      <p className={styles.pie}>Funciona sin conexión · El sonido se genera en tu navegador</p>
    </main>
  );
}
