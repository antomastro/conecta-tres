"use client";

import { useCallback, useEffect, useState } from "react";
import ConectaTres from "./ConectaTres";
import Personalizar from "./Personalizar";
import SalaPanel from "./SalaPanel";
import TresEnLinea, { type Rival } from "./TresEnLinea";
import {
  APARIENCIA_INICIAL,
  cargarApariencia,
  guardarApariencia,
  variables,
  type Apariencia,
} from "../lib/apariencia";
import { codigoNuevo, normalizarCodigo, useSala } from "../lib/sala";
import type { Jugador, Partida } from "../lib/tresEnLinea";
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
  { id: "humano", texto: "2 jugadores · este móvil" },
  { id: "linea", texto: "En línea · 2 móviles" },
];

// Quien crea la sala es el Jugador 1; se recuerda por si recarga la página.
const claveRol = (codigo: string) => `c3sala-${codigo}`;

function ponerSalaEnUrl(codigo: string | null) {
  const url = new URL(window.location.href);
  if (codigo) url.searchParams.set("sala", codigo);
  else url.searchParams.delete("sala");
  window.history.replaceState(null, "", url);
}

export default function Arcade() {
  const [modo, setModo] = useState<Modo>("clasico");
  const [rival, setRival] = useState<Rival>("facil");
  const [sonido, setSonido] = useState(true);
  const [apariencia, setApariencia] = useState<Apariencia>(APARIENCIA_INICIAL);
  const [codigo, setCodigo] = useState<string | null>(null);
  const [soy, setSoy] = useState<Jugador>(1);
  const [inicial, setInicial] = useState<Partida | null>(null);
  const [anunciar, setAnunciar] = useState(false);
  const sala = useSala(codigo, soy);
  const frutas = modo === "frutas";
  const enLinea = rival === "linea" && !frutas;

  // Lo guardado y el enlace con ?sala= solo existen en el navegador: se leen
  // tras montar para que el HTML del servidor y el del cliente coincidan.
  useEffect(() => {
    const t = setTimeout(() => {
      setApariencia(cargarApariencia());
      const deUrl = normalizarCodigo(new URLSearchParams(window.location.search).get("sala") ?? "");
      if (deUrl.length === 4) {
        let rol: Jugador = 2;
        try {
          if (sessionStorage.getItem(claveRol(deUrl)) === "1") rol = 1;
        } catch {
          /* sin almacenamiento disponible */
        }
        setRival("linea");
        setSoy(rol);
        setCodigo(deUrl);
      }
    }, 0);
    return () => clearTimeout(t);
  }, []);

  function cambiarApariencia(a: Apariencia) {
    setApariencia(a);
    guardarApariencia(a);
  }

  function entrar(c: string, rol: Jugador) {
    try {
      if (rol === 1) sessionStorage.setItem(claveRol(c), "1");
    } catch {
      /* sin almacenamiento disponible */
    }
    setInicial(null);
    setAnunciar(false);
    setSoy(rol);
    setCodigo(c);
    ponerSalaEnUrl(c);
  }

  function salir() {
    setCodigo(null);
    setInicial(null);
    setAnunciar(false);
    ponerSalaEnUrl(null);
  }

  function cambiarModo(m: Modo) {
    setModo(m);
    setInicial(null);
    // En línea, quien cambia el modo empieza una partida nueva para los dos.
    setAnunciar(Boolean(sala));
  }

  function cambiarRival(r: Rival) {
    setRival(r);
    if (r !== "linea" && codigo) salir();
  }

  // El rival cambió de modo: lo sigo con su partida.
  const modoRemoto = useCallback((p: Partida) => {
    setInicial(p);
    setAnunciar(false);
    setModo(p.modo);
  }, []);

  return (
    <main className={styles.arcade} style={variables(apariencia)}>
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
            <select value={modo} onChange={(e) => cambiarModo(e.target.value as Modo)}>
              {MODOS.map((m) => (
                <option key={m.id} value={m.id} disabled={m.id === "frutas" && rival === "linea"}>
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
              onChange={(e) => cambiarRival(e.target.value as Rival)}
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

        {enLinea && (
          <SalaPanel
            sala={sala}
            crear={() => entrar(codigoNuevo(), 1)}
            unirse={(c) => entrar(c, 2)}
            salir={salir}
          />
        )}

        <Personalizar
          apariencia={apariencia}
          cambiar={cambiarApariencia}
          conFichas={!frutas}
          titulo1={enLinea ? "Color de tus fichas" : "Color Jugador 1"}
          titulo2={
            enLinea ? "Color del rival" : rival === "humano" ? "Color Jugador 2" : "Color IA"
          }
        />

        {frutas ? (
          <ConectaTres sonido={sonido} />
        ) : enLinea && !sala ? null : (
          // La key reinicia tablero y marcador al cambiar de modo, de rival o de sala.
          <TresEnLinea
            key={`${modo}-${rival}-${codigo ?? ""}`}
            modo={modo}
            rival={rival}
            sonido={sonido}
            apariencia={apariencia}
            sala={enLinea ? sala : null}
            inicial={inicial}
            anunciar={anunciar}
            onModoRemoto={modoRemoto}
          />
        )}
      </section>

      <p className={styles.pie}>
        {enLinea
          ? "Las jugadas viajan en tiempo real entre los dos móviles"
          : "Funciona sin conexión · El sonido se genera en tu navegador"}
      </p>
    </main>
  );
}
