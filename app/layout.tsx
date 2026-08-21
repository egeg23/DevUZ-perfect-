import type { ReactNode } from "react";

import "./globals.css";

/**
 * Корневой layout существует только для того, чтобы Next получил свой
 * обязательный html/body. Всё языкозависимое — атрибут lang, шапка, футер,
 * разметка — живёт в app/[locale]/layout.tsx, где известна локаль.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children as ReactNode;
}
