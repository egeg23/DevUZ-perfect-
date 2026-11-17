import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

/** Страницы бота Claudery (оферта): свои html и body, без шапки и чата студии. */
export const metadata: Metadata = { title: "Claudery", robots: { index: false, follow: false } };
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function ClauderyLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body style={{ margin: 0, background: "#fff", color: "#111", font: "16px/1.6 system-ui, sans-serif" }}>{children}</body>
    </html>
  );
}
