"use client";

import {
  COLORES,
  FORMAS,
  TABLEROS,
  type Apariencia,
  type ColorId,
  type Forma,
  type TableroId,
} from "../lib/apariencia";
import styles from "./Personalizar.module.css";

interface Props {
  apariencia: Apariencia;
  cambiar: (a: Apariencia) => void;
  // En el modo frutas solo tiene sentido elegir el tablero.
  conFichas: boolean;
  nombreJ2: string;
}

export default function Personalizar({ apariencia: a, cambiar, conFichas, nombreJ2 }: Props) {
  function paleta(jugador: "color1" | "color2", titulo: string) {
    const elOtro = jugador === "color1" ? a.color2 : a.color1;
    return (
      <fieldset className={styles.grupo}>
        <legend>{titulo}</legend>
        <div className={styles.colores}>
          {COLORES.map((c) => (
            <button
              key={c.id}
              type="button"
              title={c.id === elOtro ? `${c.nombre} (lo usa el otro jugador)` : c.nombre}
              aria-label={c.nombre}
              aria-pressed={a[jugador] === c.id}
              disabled={c.id === elOtro}
              className={styles.muestra}
              style={{ background: c.hex }}
              onClick={() => cambiar({ ...a, [jugador]: c.id as ColorId })}
            />
          ))}
        </div>
      </fieldset>
    );
  }

  return (
    <details className={styles.personalizar}>
      <summary>🎨 Personalizar fichas y tablero</summary>
      <div className={styles.contenido}>
        {conFichas && (
          <label className={styles.grupo}>
            <span>Forma de las fichas</span>
            <select
              value={a.forma}
              onChange={(e) => cambiar({ ...a, forma: e.target.value as Forma })}
            >
              {FORMAS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nombre}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className={styles.grupo}>
          <span>Estilo de tablero</span>
          <select
            value={a.tablero}
            onChange={(e) => cambiar({ ...a, tablero: e.target.value as TableroId })}
          >
            {TABLEROS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </select>
        </label>
        {conFichas && paleta("color1", "Color Jugador 1")}
        {conFichas && paleta("color2", `Color ${nombreJ2}`)}
      </div>
    </details>
  );
}
