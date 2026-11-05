// Opciones visuales que cada jugador puede elegir: forma y color de las fichas, y estilo de tablero.

import type { CSSProperties } from "react";

export const FORMAS = [
  { id: "circulo", nombre: "Círculo" },
  { id: "cuadrado", nombre: "Cuadrado" },
  { id: "rombo", nombre: "Rombo" },
  { id: "hexagono", nombre: "Hexágono" },
  { id: "estrella", nombre: "Estrella" },
] as const;

export const COLORES = [
  { id: "cian", nombre: "Cian", hex: "#22d3ee" },
  { id: "rosa", nombre: "Rosa", hex: "#f472b6" },
  { id: "verde", nombre: "Verde", hex: "#4ade80" },
  { id: "ambar", nombre: "Ámbar", hex: "#fbbf24" },
  { id: "violeta", nombre: "Violeta", hex: "#a78bfa" },
  { id: "rojo", nombre: "Rojo", hex: "#f87171" },
  { id: "blanco", nombre: "Blanco", hex: "#e5e7eb" },
] as const;

export const TABLEROS = [
  { id: "noche", nombre: "Noche", fondo: "#141d33", borde: "#25324f", hueco: "#0a1020", hover: "#131d36", redondos: false },
  { id: "clasico", nombre: "Clásico azul", fondo: "#1d4ed8", borde: "#3b82f6", hueco: "#0b1430", hover: "#14214d", redondos: true },
  { id: "madera", nombre: "Madera", fondo: "#7c4a21", borde: "#a0652f", hueco: "#3b2410", hover: "#4a2e15", redondos: false },
  { id: "oceano", nombre: "Océano", fondo: "#0f766e", borde: "#14b8a6", hueco: "#042f2e", hover: "#0a3d3b", redondos: true },
  { id: "neon", nombre: "Neón violeta", fondo: "#2e1065", borde: "#7c3aed", hueco: "#12052e", hover: "#1e0b45", redondos: false },
] as const;

export type Forma = (typeof FORMAS)[number]["id"];
export type ColorId = (typeof COLORES)[number]["id"];
export type TableroId = (typeof TABLEROS)[number]["id"];

export interface Apariencia {
  forma: Forma;
  color1: ColorId;
  color2: ColorId;
  tablero: TableroId;
}

export const APARIENCIA_INICIAL: Apariencia = {
  forma: "circulo",
  color1: "cian",
  color2: "rosa",
  tablero: "noche",
};

const CLAVE = "c3apariencia";

export const color = (id: ColorId) => COLORES.find((c) => c.id === id) ?? COLORES[0];
export const tablero = (id: TableroId) => TABLEROS.find((t) => t.id === id) ?? TABLEROS[0];

// Variables CSS que heredan los tableros y las fichas.
export function variables(a: Apariencia): CSSProperties {
  const t = tablero(a.tablero);
  return {
    "--c1": color(a.color1).hex,
    "--c2": color(a.color2).hex,
    "--tablero-fondo": t.fondo,
    "--tablero-borde": t.borde,
    "--hueco": t.hueco,
    "--hueco-hover": t.hover,
  } as CSSProperties;
}

export function cargarApariencia(): Apariencia {
  try {
    const guardada = JSON.parse(localStorage.getItem(CLAVE) ?? "null") as Partial<Apariencia> | null;
    if (!guardada) return APARIENCIA_INICIAL;
    const a = { ...APARIENCIA_INICIAL, ...guardada };
    // Descarta valores que ya no existan o colores repetidos.
    const valida =
      FORMAS.some((f) => f.id === a.forma) &&
      COLORES.some((c) => c.id === a.color1) &&
      COLORES.some((c) => c.id === a.color2) &&
      TABLEROS.some((t) => t.id === a.tablero) &&
      a.color1 !== a.color2;
    return valida ? a : APARIENCIA_INICIAL;
  } catch {
    return APARIENCIA_INICIAL;
  }
}

export function guardarApariencia(a: Apariencia) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(a));
  } catch {
    /* sin almacenamiento disponible */
  }
}
