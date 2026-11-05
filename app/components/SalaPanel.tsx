"use client";

import { useState } from "react";
import { enLineaDisponible, normalizarCodigo, type Sala } from "../lib/sala";
import { useTextos } from "../lib/i18n";
import styles from "./SalaPanel.module.css";

interface Props {
  sala: Sala | null;
  crear: () => void;
  unirse: (codigo: string) => void;
  salir: () => void;
}

export default function SalaPanel({ sala, crear, unirse, salir }: Props) {
  const t = useTextos();
  const [codigo, setCodigo] = useState("");
  const [aviso, setAviso] = useState("");

  if (!enLineaDisponible) {
    return (
      <div className={styles.sala}>
        <p className={styles.texto}>{t.sinConfigurar}</p>
      </div>
    );
  }

  if (!sala) {
    return (
      <div className={styles.sala}>
        <p className={styles.texto}>
          {t.comoJugarLinea}
        </p>
        <div className={styles.fila}>
          <button type="button" className={styles.principal} onClick={crear}>
            {t.crearSala}
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
              placeholder={t.codigo}
              aria-label={t.codigoSala}
              autoCapitalize="characters"
              autoComplete="off"
              inputMode="text"
            />
            <button type="submit" className={styles.secundario} disabled={codigo.length !== 4}>
              {t.unirse}
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
    const datos = { title: "Conecta Tres", text: t.invitacion, url: enlace };
    try {
      if (navigator.share) await navigator.share(datos);
      else {
        await navigator.clipboard.writeText(enlace);
        setAviso(t.enlaceCopiado);
      }
    } catch {
      /* el usuario canceló o no hay portapapeles */
    }
  }

  return (
    <div className={styles.sala}>
      <div className={styles.fila}>
        <div>
          <small className={styles.etiqueta}>{t.sala}</small>
          <b className={styles.codigo}>{sala.codigo}</b>
        </div>
        <span className={`${styles.conexion} ${styles[sala.conexion]}`}>
          {t.conexion[sala.conexion]}
        </span>
      </div>
      <p className={styles.texto}>
        <b>{t.eresJugador(sala.soy)}</b> {sala.conexion === "esperando" && t.pasaCodigo}
      </p>
      <div className={styles.fila}>
        <button type="button" className={styles.principal} onClick={compartir}>
          {t.compartirEnlace}
        </button>
        <button type="button" className={styles.secundario} onClick={salir}>
          {t.salirSala}
        </button>
      </div>
      {aviso && <p className={styles.texto}>{aviso}</p>}
    </div>
  );
}
