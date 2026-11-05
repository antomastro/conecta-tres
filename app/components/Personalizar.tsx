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
import { useTextos } from "../lib/i18n";
import styles from "./Personalizar.module.css";

interface Props {
  apariencia: Apariencia;
  cambiar: (a: Apariencia) => void;
  // En el modo frutas solo tiene sentido elegir el tablero.
  conFichas: boolean;
  titulo1: string;
  titulo2: string;
}

export default function Personalizar({ apariencia: a, cambiar, conFichas, titulo1, titulo2 }: Props) {
  const t = useTextos();

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
              title={c.id === elOtro ? t.usadoPorOtro(t.colores[c.id]) : t.colores[c.id]}
              aria-label={t.colores[c.id]}
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
      <summary>{t.personalizar}</summary>
      <div className={styles.contenido}>
        {conFichas && (
          <label className={styles.grupo}>
            <span>{t.formaFichas}</span>
            <select
              value={a.forma}
              onChange={(e) => cambiar({ ...a, forma: e.target.value as Forma })}
            >
              {FORMAS.map((f) => (
                <option key={f.id} value={f.id}>
                  {t.formas[f.id]}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className={styles.grupo}>
          <span>{t.estiloTablero}</span>
          <select
            value={a.tablero}
            onChange={(e) => cambiar({ ...a, tablero: e.target.value as TableroId })}
          >
            {TABLEROS.map((tb) => (
              <option key={tb.id} value={tb.id}>
                {t.tableros[tb.id]}
              </option>
            ))}
          </select>
        </label>
        {conFichas && paleta("color1", titulo1)}
        {conFichas && paleta("color2", titulo2)}
      </div>
    </details>
  );
}
