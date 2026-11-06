import localFont from "next/font/local";

/**
 * Шрифты новой главной («Стекло», владелец, 06.11.2026: «шрифты возьми со
 * второго варианта „Бумага“»): заголовки — Prata, текст — Onest.
 *
 * Отдельным модулем, а не в app/fonts.ts: тот подключён в общий каркас
 * сайта, и всё, что объявлено там, грузилось бы на каждой странице. Эти
 * три файла нужны только главной, пока остальные страницы не переведены
 * на новый вид.
 *
 * Файлы — из google/fonts (лицензия OFL), урезаны так же, как шрифты в
 * app/fonts.ts: латиница с расширениями, кириллица (и украинская),
 * пунктуация, валюты, стрелки; Onest — только толщины 400–600, которые
 * есть в вёрстке. Вышло 60 КБ на оба.
 *
 * У Prata нет польских букв с диакритикой (ą, ł, ż…), и заголовок
 * по-польски собрался бы из двух шрифтов. Для польской версии заголовки —
 * Playfair Display, тоже антиква с контрастным штрихом; без preload: файл
 * качается, только когда на странице есть польский текст. Китайский, как и
 * везде на сайте, рисуют системные шрифты.
 */
export const homeSerif = localFont({
  src: "./fonts/prata.woff2",
  weight: "400",
  variable: "--font-prata",
  display: "swap",
});

export const homeSans = localFont({
  src: "./fonts/onest.woff2",
  weight: "400 600",
  variable: "--font-onest",
  display: "swap",
});

export const homeSerifPl = localFont({
  src: "./fonts/playfair.woff2",
  weight: "400",
  variable: "--font-playfair",
  display: "swap",
  preload: false,
});
