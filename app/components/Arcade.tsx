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
import {
  IDIOMAS,
  TextosContext,
  guardarIdioma,
  idiomaInicial,
  textosDe,
  type Idioma,
} from "../lib/i18n";
import type { Jugador, Partida } from "../lib/tresEnLinea";
import styles from "./Arcade.module.css";

type Modo = "clasico" | "gravedad" | "frutas";

const MODOS: Modo[] = ["clasico", "gravedad", "frutas"];
const RIVALES: Rival[] = ["facil", "dificil", "humano", "linea"];

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
  const [idioma, setIdioma] = useState<Idioma>("es");
  const t = textosDe(idioma);
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
      setIdioma(idiomaInicial());
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

  // Así lectores de pantalla y traductores del navegador saben el idioma.
  useEffect(() => {
    document.documentElement.lang = idioma;
  }, [idioma]);

  function cambiarIdioma(id: Idioma) {
    setIdioma(id);
    guardarIdioma(id);
  }

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
    <TextosContext.Provider value={t}>
    <main className={styles.arcade} style={variables(apariencia)}>
      <header className={styles.cabecera}>
        <p className={styles.antetitulo}>{t.antetitulo}</p>
        <h1>
          Conecta <span>Tres</span>
        </h1>
        <p className={styles.lema}>{t.lema}</p>
      </header>

      <section className={styles.panel}>
        <div className={styles.opciones}>
          <label>
            <span>{t.modoTablero}</span>
            <select value={modo} onChange={(e) => cambiarModo(e.target.value as Modo)}>
              {MODOS.map((m) => (
                <option key={m} value={m} disabled={m === "frutas" && rival === "linea"}>
                  {t.modos[m]}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>{t.rival}</span>
            <select
              value={frutas ? "solo" : rival}
              disabled={frutas}
              onChange={(e) => cambiarRival(e.target.value as Rival)}
            >
              {frutas ? (
                <option value="solo">{t.solitario}</option>
              ) : (
                RIVALES.map((r) => (
                  <option key={r} value={r}>
                    {t.rivales[r]}
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
            {sonido ? t.sonidoSi : t.sonidoNo}
          </button>
          <label className={styles.idioma}>
            <span>🌐 {t.idioma}</span>
            <select value={idioma} onChange={(e) => cambiarIdioma(e.target.value as Idioma)}>
              {IDIOMAS.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.nombre}
                </option>
              ))}
            </select>
          </label>
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
          titulo1={enLinea ? t.colorTuyas : t.colorJ1}
          titulo2={enLinea ? t.colorRival : rival === "humano" ? t.colorJ2 : t.colorIA}
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
        {enLinea ? t.pieLinea : t.pieLocal}
      </p>
    </main>
    </TextosContext.Provider>
  );
}
