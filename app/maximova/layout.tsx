import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { fontVars } from "@/components/clients/maximova/fonts";

/**
 * Сайт Дарьи Максимовой — отдельный сайт, временно живущий на нашем домене.
 *
 * Свои html и body, без шапки, чата и заставки студии: это её сайт, а не
 * наша витрина. Закрыт от индексации, пока живёт здесь: когда он переедет на
 * её домен, копия на devuz.studio отбирала бы у него выдачу. Тот же запрет
 * стоит заголовком X-Robots-Tag в next.config.ts — он действует и там, где
 * мета-тега нет.
 */
export const metadata: Metadata = {
  title: "Дарья Максимова — английский и французский для детей",
  description:
    "Школа английского и французского для детей 5–8 и 8–17 лет. Авторские методики, 2 занятия в неделю по 45 минут.",
  robots: { index: false, follow: false, nocache: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

/**
 * Класс mx-js ставится до первой отрисовки: только с ним блоки прячутся до
 * появления. Без скрипта страница остаётся целой и видимой — анимация
 * появления не имеет права съедать содержимое.
 */
const JS_FLAG = "document.documentElement.classList.add('mx-js')";

export default function MaximovaLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" className={fontVars} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: JS_FLAG }} />
      </head>
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
