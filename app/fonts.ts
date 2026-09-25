import localFont from "next/font/local";

/**
 * Шрифты сайта и панели — из репозитория, а не с Google при сборке.
 *
 * 25 сентября выкатка дважды подряд упала на `next build`: сервер не
 * достучался до fonts.googleapis.com, и из-за трёх шрифтов на сайт не выехал
 * ни один коммит. Сборке, от которой зависит всё, не нужна сеть к чужому
 * сервису ради файлов, которые не меняются годами.
 *
 * Файлы — вариативные версии из google/fonts (лицензия OFL), урезанные до
 * латиницы с расширениями, кириллицы и знаков, которые встречаются в текстах
 * сайта: русский, узбекский (oʻ, g‘) и английский. У Inter закреплён
 * оптический размер 14 — ровно то, что раньше отдавал Google. Китайский
 * текст, как и прежде, рисуют системные шрифты.
 */
export const display = localFont({
  src: "./fonts/unbounded.woff2",
  weight: "200 900",
  variable: "--font-unbounded",
  display: "swap",
});

export const sans = localFont({
  src: "./fonts/inter.woff2",
  weight: "100 900",
  variable: "--font-inter",
  display: "swap",
});

export const mono = localFont({
  src: "./fonts/jetbrains-mono.woff2",
  weight: "100 800",
  variable: "--font-jetbrains",
  display: "swap",
});
