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

## Si no abre

1. Comprueba las versiones en la terminal: `node -v` (necesita 20.9 o superior) y `pnpm -v`.
2. Si no tienes pnpm: `npm install -g pnpm`
3. Ejecuta `pnpm install` y después `pnpm dev`, **dentro de la carpeta del proyecto** (`cd conecta-tres`).
4. Abre http://localhost:3000 en el navegador y deja la terminal abierta mientras juegas.
5. Si el puerto 3000 está ocupado: `pnpm dev -p 3001` y abre http://localhost:3001

Node.js: https://nodejs.org/es

## Estructura

- `app/components/ConectaTres.tsx`: lógica y vista del juego
- `app/components/ConectaTres.module.css`: estilos del juego
- `app/globals.css`: colores (modo claro y oscuro)

## Más información

- Next.js: https://nextjs.org/docs
- pnpm: https://pnpm.io/es/
