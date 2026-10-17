import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Conecta Tres",
  description: "Juego de conecta tres con frutas, hecho con Next.js",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: extensiones como LanguageTool añaden atributos a <html>
    <html lang="es" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
