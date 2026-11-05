"use client";

import { useState } from "react";
import { enLineaDisponible, normalizarCodigo, type Sala } from "../lib/sala";
import styles from "./SalaPanel.module.css";

interface Props {
  sala: Sala | null;
  crear: () => void;
  unirse: (codigo: string) => void;
  salir: () => void;
}

const TEXTO_CONEXION = {
  conectando: "Conectando…",
  esperando: "Esperando rival",
  listo: "Rival conectado",
  lleno: "Sala llena",
  error: "Sin conexión",
} as const;

export default function SalaPanel({ sala, crear, unirse, salir }: Props) {
  const [codigo, setCodigo] = useState("");
  const [aviso, setAviso] = useState("");

  if (!enLineaDisponible) {
    return (
      <div className={styles.sala}>
        <p className={styles.texto}>El juego en línea no está configurado en este servidor.</p>
      </div>
    );
  }

  if (!sala) {
    return (
      <div className={styles.sala}>
        <p className={styles.texto}>
          📱 Juega desde dos móviles: uno crea la sala y el otro se une con el código.
        </p>
        <div className={styles.fila}>
          <button type="button" className={styles.principal} onClick={crear}>
            Crear sala
          </button>
          <form
            className={styles.unirse}
            onSubmit={(e) => {
              e.preventDefault();
              if (codigo.length === 4) unirse(codigo);
            }}
          >
            <input
              value={codigo}
              onChange={(e) => setCodigo(normalizarCodigo(e.target.value))}
              placeholder="CÓDIGO"
              aria-label="Código de la sala"
              autoCapitalize="characters"
              autoComplete="off"
              inputMode="text"
            />
            <button type="submit" className={styles.secundario} disabled={codigo.length !== 4}>
              Unirse
            </button>
          </form>
        </div>
      </div>
    );
  }

  const enlace =
    typeof window === "undefined"
      ? ""
      : `${window.location.origin}${window.location.pathname}?sala=${sala.codigo}`;

  async function compartir() {
    const datos = { title: "Conecta Tres", text: "¡Juega conmigo a Conecta Tres!", url: enlace };
    try {
      if (navigator.share) await navigator.share(datos);
      else {
        await navigator.clipboard.writeText(enlace);
        setAviso("Enlace copiado ✔");
      }
    } catch {
      /* el usuario canceló o no hay portapapeles */
    }
  }

  return (
    <div className={styles.sala}>
      <div className={styles.fila}>
        <div>
          <small className={styles.etiqueta}>Sala</small>
          <b className={styles.codigo}>{sala.codigo}</b>
        </div>
        <span className={`${styles.conexion} ${styles[sala.conexion]}`}>
          {TEXTO_CONEXION[sala.conexion]}
        </span>
      </div>
      <p className={styles.texto}>
        Eres el <b>Jugador {sala.soy}</b>.{" "}
        {sala.conexion === "esperando" && "Pasa el código o el enlace a tu rival."}
      </p>
      <div className={styles.fila}>
        <button type="button" className={styles.principal} onClick={compartir}>
          Compartir enlace
        </button>
        <button type="button" className={styles.secundario} onClick={salir}>
          Salir de la sala
        </button>
      </div>
      {aviso && <p className={styles.texto}>{aviso}</p>}
    </div>
  );
}
