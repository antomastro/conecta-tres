# 🍓 Conecta Tres

Juego de conecta tres con frutas, hecho con [Next.js](https://nextjs.org) (App Router) y TypeScript.

## Cómo se juega

Toca una fruta y luego una vecina para intercambiarlas. Si forman 3 o más iguales en fila o columna, desaparecen y suman puntos. Tienes 20 movimientos y los combos en cadena dan más puntos. El récord se guarda en tu navegador.

## Uso (solo pnpm)

```bash
pnpm install
pnpm dev      # http://localhost:3000
pnpm build
pnpm start
```

## Estructura

- `app/components/ConectaTres.tsx`: lógica y vista del juego
- `app/components/ConectaTres.module.css`: estilos del juego
- `app/globals.css`: colores (modo claro y oscuro)

## Más información

- Next.js: https://nextjs.org/docs
- pnpm: https://pnpm.io/es/
