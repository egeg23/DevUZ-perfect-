import localFont from "next/font/local";

/**
 * Гарнитуры сайта Дарьи — свои, из этой папки, и обязательно с кириллицей.
 *
 * Файлы — вариативные версии из google/fonts (лицензия OFL), урезанные до
 * латиницы, кириллицы и знаков препинания и до весов 400–700: двух весов
 * странице хватает, остальное — лишние килобайты на телефоне.
 * Грузятся из репозитория, а не с Google при сборке: сборке не нужна сеть.
 */

/** «Кино»: книжная антиква для заголовков. */
export const cormorant = localFont({
  src: [
    { path: "./fonts/cormorant.woff2", style: "normal", weight: "400 700" },
    { path: "./fonts/cormorant-italic.woff2", style: "italic", weight: "400 700" },
  ],
  variable: "--mx-cormorant",
  display: "swap",
});

/** Текст «Кино» и заголовки «Стекла»: гротеск с ровным ритмом. */
export const manrope = localFont({
  src: "./fonts/manrope.woff2",
  weight: "400 700",
  variable: "--mx-manrope",
  display: "swap",
});

/** «Две страны»: тёплая антиква, как в детской книге. */
export const lora = localFont({
  src: [
    { path: "./fonts/lora.woff2", style: "normal", weight: "400 700" },
    { path: "./fonts/lora-italic.woff2", style: "italic", weight: "400 700" },
  ],
  variable: "--mx-lora",
  display: "swap",
});

/** Текст «Стекла» и «Двух стран». */
export const golos = localFont({
  src: "./fonts/golos.woff2",
  weight: "400 700",
  variable: "--mx-golos",
  display: "swap",
});

export const fontVars = [cormorant.variable, manrope.variable, lora.variable, golos.variable].join(" ");
