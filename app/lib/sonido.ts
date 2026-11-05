// Efectos de sonido generados con Web Audio: no hace falta descargar archivos.

export type Efecto = "ficha" | "rival" | "victoria" | "derrota" | "empate" | "combo";

const NOTAS: Record<Efecto, number[]> = {
  ficha: [523],
  rival: [392],
  victoria: [523, 659, 784, 1047],
  derrota: [392, 330, 262],
  empate: [440, 440],
  combo: [659, 880],
};

let ctx: AudioContext | null = null;

export function sonar(efecto: Efecto) {
  try {
    ctx ??= new AudioContext();
    const ahora = ctx.currentTime;
    NOTAS[efecto].forEach((freq, k) => {
      const osc = ctx!.createOscillator();
      const vol = ctx!.createGain();
      const t0 = ahora + k * 0.11;
      osc.type = "triangle";
      osc.frequency.value = freq;
      vol.gain.setValueAtTime(0.15, t0);
      vol.gain.exponentialRampToValueAtTime(0.001, t0 + 0.18);
      osc.connect(vol).connect(ctx!.destination);
      osc.start(t0);
      osc.stop(t0 + 0.2);
    });
  } catch {
    /* navegador sin Web Audio */
  }
}
