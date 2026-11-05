"use client";

// Salas en línea: dos móviles se conectan a un canal de Supabase Realtime
// con el mismo código y se envían el estado de la partida (Broadcast).
// Presence indica si el rival sigue conectado. No se guarda nada en la base de datos.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient, type RealtimeChannel, type SupabaseClient } from "@supabase/supabase-js";
import type { Jugador, Partida } from "./tresEnLinea";

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const CLAVE = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const enLineaDisponible = Boolean(SUPA_URL && CLAVE);

let cliente: SupabaseClient | null = null;
function supabase() {
  cliente ??= createClient(SUPA_URL!, CLAVE!);
  return cliente;
}

// Sin letras ni números que se confundan (0/O, 1/I/L).
const LETRAS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function codigoNuevo(): string {
  return Array.from({ length: 4 }, () => LETRAS[Math.floor(Math.random() * LETRAS.length)]).join("");
}

export function normalizarCodigo(texto: string): string {
  return texto
    .toUpperCase()
    .split("")
    .filter((c) => LETRAS.includes(c))
    .join("")
    .slice(0, 4);
}

export interface MensajeEstado {
  partida: Partida;
  de: Jugador;
}

export type EstadoConexion = "conectando" | "esperando" | "listo" | "lleno" | "error";

export interface Sala {
  codigo: string;
  soy: Jugador;
  conexion: EstadoConexion;
  enviar: (m: MensajeEstado) => void;
  escuchar: (fn: (m: MensajeEstado) => void) => () => void;
}

interface Presente {
  id: string;
  soy: Jugador;
  desde: number;
}

export function useSala(codigo: string | null, soy: Jugador): Sala | null {
  const [conexion, setConexion] = useState<EstadoConexion>("conectando");
  const canal = useRef<RealtimeChannel | null>(null);
  const oyentes = useRef(new Set<(m: MensajeEstado) => void>());

  useEffect(() => {
    if (!codigo || !enLineaDisponible) return;
    const yo: Presente = { id: crypto.randomUUID(), soy, desde: Date.now() };
    const c = supabase().channel(`conecta-tres:${codigo}`, {
      config: { broadcast: { self: false }, presence: { key: yo.id } },
    });
    canal.current = c;

    c.on("broadcast", { event: "estado" }, ({ payload }) => {
      oyentes.current.forEach((fn) => fn(payload as MensajeEstado));
    });

    c.on("presence", { event: "sync" }, () => {
      const otros = Object.values(c.presenceState<Presente>())
        .flat()
        .filter((p) => p.id !== yo.id);
      // Si ya había alguien con mi mismo papel desde antes, la sala está llena.
      if (otros.some((p) => p.soy === soy && p.desde < yo.desde)) setConexion("lleno");
      else setConexion(otros.some((p) => p.soy !== soy) ? "listo" : "esperando");
    });

    c.subscribe((estado) => {
      if (estado === "SUBSCRIBED") void c.track(yo);
      else if (estado === "CHANNEL_ERROR" || estado === "TIMED_OUT") setConexion("error");
    });

    return () => {
      canal.current = null;
      void supabase().removeChannel(c);
      setConexion("conectando");
    };
  }, [codigo, soy]);

  const enviar = useCallback((m: MensajeEstado) => {
    void canal.current?.send({ type: "broadcast", event: "estado", payload: m });
  }, []);

  const escuchar = useCallback((fn: (m: MensajeEstado) => void) => {
    oyentes.current.add(fn);
    return () => {
      oyentes.current.delete(fn);
    };
  }, []);

  return useMemo(
    () =>
      codigo
        ? { codigo, soy, conexion: enLineaDisponible ? conexion : "error", enviar, escuchar }
        : null,
    [codigo, soy, conexion, enviar, escuchar],
  );
}
