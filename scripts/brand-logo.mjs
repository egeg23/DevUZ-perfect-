/**
 * Квадратный знак DevUz для рекламных кабинетов.
 *
 * Google Ads просит логотип 1:1 отдельным файлом: минимум 128×128,
 * рекомендуемый размер 1200×1200, до 5120 КБ, PNG / JPG / статичный GIF.
 * Показывается он то квадратом со скруглением, то обрезанным в круг —
 * какой вариант достанется объявлению, рекламодатель не выбирает.
 *
 * Отсюда поле: viewBox 240 при радиусе звезды 100 — знак занимает 83 %
 * ширины. В круге (вписанный радиус 120) лучи не доходят до среза, в
 * квадрате не упираются в край. У аватара Telegram поле теснее (89 %):
 * там знак всегда круглый и всегда мелкий, здесь — не всегда.
 *
 * Геометрия одна на все выходы, поэтому живёт здесь, а не в четырёх
 * файлах: звезда повторяется в components/brand/logo.tsx и в аватаре
 * Telegram, и третья ручная копия рано или поздно разошлась бы с ними.
 *
 *   node scripts/brand-logo.mjs
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "brand");

/** Восьмиконечная звезда «Руб-эль-Хизб» — два квадрата, повёрнутых на 45°. */
const STAR =
  "M0 -100 L29.29 -70.71 L70.71 -70.71 L70.71 -29.29 L100 0 L70.71 29.29 " +
  "L70.71 70.71 L29.29 70.71 L0 100 L-29.29 70.71 L-70.71 70.71 L-70.71 29.29 " +
  "L-100 0 L-70.71 -29.29 L-70.71 -70.71 L-29.29 -70.71 Z";

const INK = "#05070B";
const HALF = 120;

/**
 * @param {{ size: number, background: boolean }} opts
 *   `background: false` — прозрачный фон. Он нужен не всем площадкам, но
 *   там, где макет светлый, чернильный квадрат выглядит наклейкой. Прорези
 *   `<` и `>` в негативе на белом читаются: градиент звезды от белого далеко.
 */
function svg({ size, background }) {
  const plate = background
    ? `
  <rect x="${-HALF}" y="${-HALF}" width="${HALF * 2}" height="${HALF * 2}" fill="${INK}"/>
  <rect x="${-HALF}" y="${-HALF}" width="${HALF * 2}" height="${HALF * 2}" fill="url(#glow)"/>
`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-HALF} ${-HALF} ${HALF * 2} ${HALF * 2}" width="${size}" height="${size}">
  <!-- Сгенерировано scripts/brand-logo.mjs. Правки — там. -->
  <defs>
    <linearGradient id="mark" x1="0" y1="-1" x2="1" y2="1">
      <stop offset="0" stop-color="#5B9BFF"/>
      <stop offset="55%" stop-color="#3B82F6"/>
      <stop offset="100%" stop-color="#22F0A0"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="44%" r="60%">
      <stop offset="0" stop-color="#13304E" stop-opacity="0.9"/>
      <stop offset="1" stop-color="${INK}" stop-opacity="0"/>
    </radialGradient>
    <mask id="cut">
      <rect x="${-HALF}" y="${-HALF}" width="${HALF * 2}" height="${HALF * 2}" fill="#fff"/>
      <path d="M-22 -34 L-58 0 L-22 34" stroke="#000" stroke-width="15" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M22 -34 L58 0 L22 34" stroke="#000" stroke-width="15" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </mask>
  </defs>
${plate}
  <path d="${STAR}" fill="url(#mark)" mask="url(#cut)"/>
  <rect x="-5" y="-27" width="10" height="54" rx="5" fill="#E8B14C"/>
</svg>
`;
}

const outputs = [
  { file: "logo-square.svg", background: true, size: 1024 },
  { file: "logo-square-alpha.svg", background: false, size: 1024 },
  { file: "logo-square-1200.png", background: true, size: 1200 },
  { file: "logo-square-1200-alpha.png", background: false, size: 1200 },
];

for (const { file, background, size } of outputs) {
  const source = svg({ size, background });
  const target = path.join(OUT, file);

  if (file.endsWith(".svg")) {
    await writeFile(target, source);
  } else {
    // Плотность 72 при width/height в пикселях даёт растр ровно нужного
    // размера: увеличивать готовый растр под 1200 — значит везти в рекламу
    // мыло вместо векторной звезды.
    //
    // Непрозрачный вариант сводим на чернила и выбрасываем альфа-канал:
    // площадки делят логотипы на «сплошной фон» и «прозрачный», и пустой
    // альфа-канал в первом ставит файл между этими двумя.
    const png = sharp(Buffer.from(source), { density: 72 });
    await (background ? png.flatten({ background: INK }) : png)
      .png({ compressionLevel: 9 })
      .toFile(target);
  }

  console.log(file);
}
