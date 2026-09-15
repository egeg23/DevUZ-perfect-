#!/usr/bin/env node
/**
 * Снимок разбираемого сайта — «как есть».
 *
 * Запускается ночной задачей, а не приложением: тащить браузер в боевой
 * образ значило бы утроить его размер ради того, что нужно раз в сутки.
 *
 *   node scripts/razbor-shot.mjs <адрес> <куда класть> [--keep-name]
 *
 * По умолчанию имя компании и логотип закрываются сплошными плашками цвета
 * фона. Не размытием: размытие обратимо, и однажды кто-нибудь восстановит
 * из него имя. Плашка необратима.
 *
 * Снимается первый экран, а не страница целиком. Разбор говорит о том, что
 * видит посетитель за первые секунды; скриншот на восемь тысяч пикселей
 * читателю не помогает, а весит как десять статей.
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";
// playwright-core, а не playwright: у второго postinstall тянет три браузера
// на четыреста мегабайт, и это происходило бы при каждой сборке образа.
// Браузер уже стоит в окружении — нам нужен только способ им управлять.
import { chromium } from "playwright-core";

import { redactions } from "../lib/razbor/anonymize.ts";

/**
 * Где лежит Chromium.
 *
 * Путь с версией в имени меняется при каждом обновлении окружения, поэтому
 * не зашит константой: ищем в каталоге браузеров то, что похоже на сборку.
 * Явный CHROMIUM_PATH перебивает поиск — на случай, когда браузер стоит не
 * там, где мы ждём.
 */
async function chromiumPath() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;

  const root = process.env.PLAYWRIGHT_BROWSERS_PATH || "/opt/pw-browsers";
  if (!existsSync(root)) return undefined;

  const dirs = (await readdir(root, { withFileTypes: true }))
    .filter((d) => d.isDirectory() && d.name.startsWith("chromium-"))
    .map((d) => d.name)
    .sort()
    .reverse();

  for (const dir of dirs) {
    const candidate = path.join(root, dir, "chrome-linux", "chrome");
    if (existsSync(candidate)) return candidate;
  }
  return undefined;
}

/** Размеры, под которые снимаем. Телефон обязателен: там живёт большинство. */
const SHOTS = [
  { name: "desktop", width: 1440, height: 900, mobile: false },
  { name: "mobile", width: 390, height: 844, mobile: true },
];

/**
 * Сколько ждём загрузки.
 *
 * `networkidle` на плохих сайтах не наступает никогда: счётчики, чаты и
 * баннеры держат соединения открытыми. Поэтому ждём `load` и добавляем
 * паузу на шрифты и первую отрисовку — а дальше снимаем что есть. Сайт,
 * который за это время не показал первый экран, и посетителю его не
 * покажет; это само по себе находка.
 */
const LOAD_TIMEOUT_MS = 20_000;
const SETTLE_MS = 1_500;

function usage() {
  console.error("Использование: node scripts/razbor-shot.mjs <адрес> <каталог> [--keep-name]");
  process.exit(2);
}

const [target, outDir, ...flags] = process.argv.slice(2);
if (!target || !outDir) usage();
const keepName = flags.includes("--keep-name");

/**
 * Закрывает имя компании и логотип.
 *
 * Выполняется в странице: только там известно, где что лежит после вёрстки.
 * Возвращает, сколько плашек поставило, — ноль означает, что имя на первом
 * экране не нашлось, и это повод посмотреть снимок глазами.
 */
function redactInPage(words) {
  const COVER = "__devuz_cover";

  /**
   * Сначала все замеры, потом все плашки.
   *
   * Смешивать нельзя: каждая добавленная плашка — узел в body, после
   * которого браузер пересчитывает раскладку, и следующий замер приходит уже
   * по сдвинутой странице. Первая версия так и делала, и плашки ложились
   * рядом с текстом, а не на него.
   */
  const targets = [];

  /**
   * Непрозрачный фон ближайшего предка.
   *
   * Важно именно «непрозрачный». Первая версия брала первый попавшийся цвет
   * и получала что-нибудь вроде rgba(240,240,242,.55) — плашка выходила
   * полупрозрачной, и имя компании читалось сквозь неё. На снимке это
   * выглядело как выцветший текст, а не как затирание, то есть анонимности
   * не было вовсе.
   */
  const bg = (el) => {
    let node = el;
    for (let i = 0; i < 8 && node; i++) {
      const color = getComputedStyle(node).backgroundColor;
      const m = color && color.match(/^rgba?\(([^)]+)\)$/);
      if (m) {
        const parts = m[1].split(",").map((v) => parseFloat(v.trim()));
        const alpha = parts.length > 3 ? parts[3] : 1;
        if (alpha >= 0.99) return `rgb(${parts[0]}, ${parts[1]}, ${parts[2]})`;
      }
      node = node.parentElement;
    }
    // Ни у кого до корня нет сплошного фона — значит страница на белом.
    return "#ffffff";
  };

  // 1. Логотип: картинка или svg в шапке либо в ссылке на главную.
  const header = document.querySelector("header, .header, #header, [role=banner]");
  const logos = new Set();
  for (const root of [header, document.querySelector('a[href="/"], a[href="./"]')]) {
    if (!root) continue;
    for (const el of root.querySelectorAll("img, svg, picture")) logos.add(el);
    if (root.tagName === "IMG" || root.tagName === "SVG") logos.add(root);
  }
  for (const el of logos) {
    const rect = el.getBoundingClientRect();
    // Широкая картинка в шапке — баннер, а не логотип: закрыть её значит
    // закрыть первый экран целиком.
    if (rect.width > window.innerWidth * 0.5) continue;
    targets.push({ rect, color: bg(el) });
  }

  // 2. Имя текстом. По узлам, а не заменой в разметке: замена в innerHTML
  // ломает страницу там, где слово стоит в атрибуте.
  if (words.length) {
    const re = new RegExp(words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"), "i");
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const hits = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!node.nodeValue || !re.test(node.nodeValue)) continue;
      hits.push(node);
    }
    for (const node of hits.slice(0, 40)) {
      const range = document.createRange();
      range.selectNodeContents(node);
      const color = bg(node.parentElement ?? document.body);
      for (const rect of range.getClientRects()) targets.push({ rect, color });
    }
  }

  // 3. И только теперь рисуем. Координаты — документа, а не окна: плашка
  // должна остаться на месте, даже если снимок когда-нибудь станет
  // полностраничным.
  let placed = 0;
  for (const { rect, color } of targets) {
    if (rect.width < 4 || rect.height < 4) continue;
    const box = document.createElement("div");
    box.className = COVER;

    /**
     * Стили задаются с !important поверх полного сброса.
     *
     * Потому что страница стилизует и нашу плашку тоже. На example.com для
     * div задано opacity: .8 — плашка вставала точно на место, но
     * становилась полупрозрачной, и имя читалось сквозь неё. Выглядело это
     * как выцветший текст, то есть как будто затирание сработало наполовину.
     * На чужом сайте таких правил может быть сколько угодно: filter,
     * mix-blend-mode, transform, visibility.
     *
     * `all: initial` сбрасывает всё унаследованное, дальше — только наше и
     * только с !important, чтобы правило страницы с !important не победило.
     */
    box.style.setProperty("all", "initial", "important");
    const rules = {
      position: "absolute",
      left: `${rect.left + window.scrollX}px`,
      top: `${rect.top + window.scrollY}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      "background-color": color,
      "z-index": "2147483647",
      opacity: "1",
      filter: "none",
      "mix-blend-mode": "normal",
      transform: "none",
      display: "block",
      visibility: "visible",
      "pointer-events": "none",
    };
    for (const [name, value] of Object.entries(rules)) {
      box.style.setProperty(name, value, "important");
    }

    // В body, а не в documentElement. Плашка, добавленная в <html> рядом с
    // <body>, рисуется НИЖЕ его содержимого при любом z-index — на снимке
    // это выглядит как подсветка текста, а не как затирание.
    document.body.appendChild(box);
    placed++;
  }

  return placed;
}

const executablePath = await chromiumPath();
if (!executablePath) {
  console.error("Chromium не найден. Укажите CHROMIUM_PATH или PLAYWRIGHT_BROWSERS_PATH.");
  process.exit(3);
}
/**
 * Доверие к перехватывающему прокси среды разработки.
 *
 * В песочнице весь HTTPS идёт через прокси, который переподписывает
 * соединения своим центром сертификации. Системному хранилищу этот центр
 * известен, но Chromium с некоторых версий системное хранилище на Linux не
 * читает — и показывает «Ваше подключение не защищено» вместо сайта.
 *
 * Вместо отключения проверки (после которого разбор снимал бы что угодно
 * под любым сертификатом) закрепляем ровно один открытый ключ — тот самый,
 * что лежит в файле центра. Всё остальное проверяется как обычно.
 *
 * На боевом сервере ни переменной прокси, ни этого файла нет, и вся ветка
 * не выполняется: браузер работает с обычной проверкой.
 */
function devProxyArgs() {
  const proxyServer = process.env.HTTPS_PROXY || process.env.https_proxy;
  const ca = "/root/.ccr/agent-proxy-ca.crt";
  if (!proxyServer || !existsSync(ca)) return null;

  try {
    const spki = execFileSync("bash", [
      "-c",
      `openssl x509 -in ${ca} -pubkey -noout | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | base64`,
    ])
      .toString()
      .trim();
    if (!spki) return null;
    return { server: proxyServer, spki };
  } catch {
    return null;
  }
}

const dev = devProxyArgs();
const browser = await chromium.launch({
  executablePath,
  ...(dev ? { proxy: { server: dev.server }, args: [`--ignore-certificate-errors-spki-list=${dev.spki}`] } : {}),
});
await mkdir(outDir, { recursive: true });

const result = { url: target, title: null, shots: [], covered: 0 };

try {
  for (const shot of SHOTS) {
    const context = await browser.newContext({
      viewport: { width: shot.width, height: shot.height },
      deviceScaleFactor: 2,
      isMobile: shot.mobile,
      hasTouch: shot.mobile,
      // Представляемся честно: разбор — не скрытая слежка, и сайт вправе
      // знать, кто к нему пришёл.
      userAgent: `DevUzRazbor/1.0 (+https://devuz.studio)`,
      locale: "ru-RU",
    });
    const page = await context.newPage();

    try {
      await page.goto(target, { waitUntil: "load", timeout: LOAD_TIMEOUT_MS });
    } catch {
      // Не открылось за отведённое время — снимаем что успело отрисоваться.
      // Пустой экран здесь и есть ответ на вопрос «что видит посетитель».
    }
    await page.waitForTimeout(SETTLE_MS);

    if (!result.title) result.title = await page.title().catch(() => null);
    const words = keepName ? [] : redactions(target, result.title);
    const covered = await page.evaluate(redactInPage, words).catch(() => 0);
    result.covered += covered;

    const file = path.join(outDir, `before-${shot.name}.png`);
    await page.screenshot({ path: file });
    result.shots.push({ size: shot.name, file, width: shot.width, height: shot.height, covered });

    await context.close();
  }
} finally {
  await browser.close();
}

console.log(JSON.stringify(result, null, 2));
