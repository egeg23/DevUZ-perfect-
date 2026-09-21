#!/usr/bin/env node
/**
 * Съёмка разборов: общий вид и место под каждую находку.
 *
 *   cd /opt/devuz && set -a && . .env && set +a
 *   node --import ./tests/alias-hook.mjs scripts/razbor-shots.mjs [--limit 3] [--id UUID]
 *
 * Зачем отдельным проходом, а не в ночной смене. Смена живёт внутри
 * приложения, а приложению браузер не нужен ни для чего больше: класть его в
 * боевой образ значит утроить образ ради того, что случается раз в сутки.
 *
 * Что снимается:
 *
 *   before-desktop / before-mobile — первый экран живого сайта. Имя и
 *   логотип затёрты плашками до записи файла.
 *
 *   f-<код>.png — место, о котором говорит находка, с красной рамкой
 *   вокруг. Это и есть разница между разбором и списком придирок: «телефон
 *   на сайте нельзя нажать с телефона» — утверждение, тот же текст со
 *   снимком шапки, где номер обведён, — доказательство.
 *
 *   after-desktop / after-mobile — наш макет «как сделали бы мы»,
 *   собранный из тех же находок и снятый тем же браузером.
 *
 * Находки, которые показать нельзя — карта сайта, время ответа сервера,
 * запрет в robots.txt, — остаются без снимка, и это осознанно. Картинка,
 * на которой читатель ищет названное и не находит, обесценивает и те
 * снимки, где всё честно.
 */
import { existsSync } from "node:fs";
import { readdir, writeFile, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

import { createClient } from "@supabase/supabase-js";
import { chromium } from "playwright-core";

import { cityByKey, nicheByKey } from "@/content/razbor/catalog";
import { redactions } from "@/lib/razbor/anonymize";
import { evidenceFor } from "@/lib/razbor/evidence";
import { huntInPage, redactInPage } from "@/lib/razbor/in-page";
import { mockupHtml } from "@/lib/razbor/mockup";

const BUCKET = "razbor";
const LOAD_TIMEOUT_MS = 20_000;
const SETTLE_MS = 1_500;
const SCALE = 2;

const SCREENS = {
  desktop: { width: 1440, height: 900, mobile: false },
  mobile: { width: 390, height: 844, mobile: true },
};

/* ── Разбор аргументов ──────────────────────────────────────────────────── */

const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const at = argv.indexOf(`--${name}`);
  return at >= 0 && argv[at + 1] ? argv[at + 1] : fallback;
};
const only = flag("id", null);
const limit = Math.max(1, Number(flag("limit", 3)) || 3);
const force = argv.includes("--force");

/* ── База ───────────────────────────────────────────────────────────────── */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Нет доступа к базе: задайте NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(2);
}
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

/* ── Браузер ────────────────────────────────────────────────────────────── */

/**
 * Где лежит Chromium.
 *
 * Путь с версией в имени меняется при каждом обновлении окружения, поэтому
 * не зашит константой. Явный CHROMIUM_PATH перебивает поиск.
 */
async function chromiumPath() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;

  const roots = [
    process.env.PLAYWRIGHT_BROWSERS_PATH,
    "/opt/pw-browsers",
    path.join(process.env.HOME || "/root", ".cache/ms-playwright"),
  ].filter(Boolean);

  for (const root of roots) {
    if (!existsSync(root)) continue;
    const dirs = (await readdir(root, { withFileTypes: true }))
      .filter((d) => d.isDirectory() && d.name.startsWith("chromium"))
      .map((d) => d.name)
      // Полная сборка вперёд лёгкой оболочки. Рядом с `chromium-1243`
      // playwright кладёт `chromium_headless_shell-1243`, и простая
      // сортировка ставит оболочку первой: подчёркивание больше дефиса.
      // Снимать она умеет, но это урезанный браузер, и разбор на нём
      // отличался бы от того, что видит посетитель.
      .sort((a, b) => {
        const full = (name) => (name.startsWith("chromium-") ? 0 : 1);
        return full(a) - full(b) || b.localeCompare(a);
      });
    for (const dir of dirs) {
      for (const tail of [["chrome-linux", "chrome"], ["chrome-linux", "headless_shell"]]) {
        const candidate = path.join(root, dir, ...tail);
        if (existsSync(candidate)) return candidate;
      }
    }
  }

  // Системный браузер — последняя попытка. На сервере, где playwright
  // ничего не скачивал, он вполне может оказаться единственным.
  for (const candidate of ["/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/google-chrome"]) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

/**
 * Доверие к перехватывающему прокси среды разработки.
 *
 * В песочнице весь HTTPS идёт через прокси, который переподписывает
 * соединения своим центром сертификации. Вместо отключения проверки
 * закрепляем ровно один открытый ключ — тот самый, что лежит в файле
 * центра. На боевом сервере ни переменной, ни файла нет, и ветка не
 * выполняется.
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
    return spki ? { server: proxyServer, spki } : null;
  } catch {
    return null;
  }
}

/* ── Работа ─────────────────────────────────────────────────────────────── */

/** Какие разборы снимать: сначала те, что ждут проверки. */
async function pick() {
  const columns =
    "id, status, category, city, source_url, article_ru, shot_before, shot_after, shot_findings";

  if (only) {
    const { data } = await db.from("razbors").select(columns).eq("id", only).maybeSingle();
    return data ? [data] : [];
  }

  const { data, error } = await db
    .from("razbors")
    .select(columns)
    .in("status", ["review", "draft", "published"])
    .order("created_at", { ascending: false })
    .limit(60);
  if (error) throw new Error(`не прочитал разборы: ${error.message}`);

  const order = { review: 0, draft: 1, published: 2 };
  return (data ?? [])
    .filter((row) => force || !row.shot_before || !row.shot_after || !row.shot_findings)
    .sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9))
    .slice(0, limit);
}

/** Коды находок статьи, для которых снимок вообще бывает. */
function plan(article) {
  const out = [];
  const seen = new Set();
  for (const finding of article?.findings ?? []) {
    const code = String(finding?.code ?? "");
    if (!code || seen.has(code)) continue;
    const rule = evidenceFor(code);
    if (!rule) continue;
    seen.add(code);
    out.push({ code, rule });
  }
  return out;
}

async function upload(id, name, body) {
  const at = `${id}/${name}`;
  const { error } = await db.storage.from(BUCKET).upload(at, body, {
    upsert: true,
    contentType: "image/png",
  });
  if (error) throw new Error(`не залил ${name}: ${error.message}`);
  return at;
}

/**
 * Полоса вокруг найденного места.
 *
 * Во всю ширину экрана, а не по краям элемента: вырез ровно по рамке
 * показывает кнопку без страницы вокруг, и читателю негде понять, где он
 * это увидит. Высота ограничена — вырез в пол-экрана перестаёт указывать на
 * что-то конкретное.
 */
function band(rect, screen) {
  const pad = 48;
  const minHeight = 160;
  const maxHeight = Math.min(560, screen.height);

  const height = Math.min(maxHeight, Math.max(minHeight, rect.height + pad * 2));
  const y = Math.max(0, Math.min(rect.y + rect.height / 2 - height / 2, screen.height - height));

  return { x: 0, y, width: screen.width, height };
}

async function shootSite(browser, row, wanted) {
  const shots = {};
  const findings = {};
  const target = String(row.source_url);

  for (const name of ["desktop", "mobile"]) {
    const screen = SCREENS[name];
    const elements = wanted.filter((w) => w.rule.mode === "element" && w.rule.screen === name);
    const screenshots = wanted.filter((w) => w.rule.mode === "screen" && w.rule.screen === name);

    const context = await browser.newContext({
      viewport: { width: screen.width, height: screen.height },
      deviceScaleFactor: SCALE,
      isMobile: screen.mobile,
      hasTouch: screen.mobile,
      // Представляемся честно: разбор — не скрытая слежка, и сайт вправе
      // знать, кто к нему пришёл.
      userAgent: "DevUzRazbor/1.0 (+https://devuz.studio)",
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

    const title = await page.title().catch(() => null);
    const covered = await page.evaluate(redactInPage, redactions(target, title)).catch(() => 0);

    // Общий снимок первого экрана. Он же идёт под находки об отсутствии:
    // «первый экран, телефона на нём нет» — это буквально он, и второй
    // такой же файл был бы лишним килобайтом у каждого читателя.
    const whole = await page.screenshot();
    const at = await upload(row.id, `before-${name}.png`, whole);
    shots[name] = { path: at, width: screen.width * SCALE, height: screen.height * SCALE, covered };
    for (const { code } of screenshots) {
      findings[code] = { path: at, width: screen.width * SCALE, height: screen.height * SCALE };
    }

    for (const { code, rule } of elements) {
      // Рамка от прошлой находки убирается: две рамки на одном снимке
      // означают два разных «смотрите сюда» под одной подписью.
      await page.evaluate(() => {
        for (const node of document.querySelectorAll(".__devuz_mark")) node.remove();
      });

      const rect = await page.evaluate(huntInPage, rule.hunt).catch(() => null);
      if (!rect) continue;

      const clip = band(rect, screen);
      const cut = await page.screenshot({ clip });
      findings[code] = {
        path: await upload(row.id, `f-${code}.png`, cut),
        width: Math.round(clip.width * SCALE),
        height: Math.round(clip.height * SCALE),
      };
    }

    await context.close();
  }

  return { shots, findings };
}

/**
 * Макет «как сделали бы мы».
 *
 * Собирается из наших же находок и снимается тем же браузером в тех же
 * размерах: сравнение «было — стало» честно только тогда, когда оба снимка
 * сделаны одинаково.
 */
async function shootMockup(browser, row) {
  const niche = nicheByKey(String(row.category));
  const city = cityByKey(String(row.city));
  if (!niche || !city) return {};

  const dir = await mkdtemp(path.join(tmpdir(), "razbor-mock-"));
  const file = path.join(dir, "mock.html");
  // Макет собирается из ниши и города — ровно как в scripts/razbor-mock.mjs.
  // Находки он пока не читает, и подсовывать ему их огрызки только ради
  // непустого поля значило бы соврать о том, что он их учитывает.
  await writeFile(file, mockupHtml({ niche, city, locale: "ru", findings: [] }), "utf8");

  const out = {};
  for (const name of ["desktop", "mobile"]) {
    const screen = SCREENS[name];
    const context = await browser.newContext({
      viewport: { width: screen.width, height: screen.height },
      deviceScaleFactor: SCALE,
      isMobile: screen.mobile,
      hasTouch: screen.mobile,
      locale: "ru-RU",
    });
    const page = await context.newPage();
    await page.goto(`file://${file}`, { waitUntil: "load" });
    // Шрифты системные, сеть не задействована — ждать нечего, кроме первой
    // отрисовки.
    await page.waitForTimeout(250);
    out[name] = await upload(row.id, `after-${name}.png`, await page.screenshot());
    await context.close();
  }
  return out;
}

/* ── Запуск ─────────────────────────────────────────────────────────────── */

const executablePath = await chromiumPath();
if (!executablePath) {
  console.error(
    "Chromium не найден. Поставьте его (npx playwright install chromium) или укажите CHROMIUM_PATH.",
  );
  process.exit(3);
}

const rows = await pick();
if (!rows.length) {
  console.log(JSON.stringify({ снято: 0, заметка: "нечего снимать — у всех разборов снимки есть" }, null, 2));
  process.exit(0);
}

const dev = devProxyArgs();
const browser = await chromium.launch({
  executablePath,
  ...(dev ? { proxy: { server: dev.server }, args: [`--ignore-certificate-errors-spki-list=${dev.spki}`] } : {}),
});

const done = [];
try {
  for (const row of rows) {
    const article = row.article_ru;
    const wanted = plan(article);
    try {
      const { shots, findings } = await shootSite(browser, row, wanted);
      const after = await shootMockup(browser, row);

      const { error } = await db
        .from("razbors")
        .update({
          shot_before: shots.desktop?.path ?? null,
          shot_before_mobile: shots.mobile?.path ?? null,
          shot_after: after.desktop ?? null,
          shot_after_mobile: after.mobile ?? null,
          shot_findings: findings,
          shot_taken_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      if (error) throw new Error(`не записал пути: ${error.message}`);

      done.push({
        id: row.id,
        сайт: row.source_url,
        статус: row.status,
        плашек: (shots.desktop?.covered ?? 0) + (shots.mobile?.covered ?? 0),
        находокСоСнимком: Object.keys(findings).length,
        находокВсего: (article?.findings ?? []).length,
      });
    } catch (error) {
      done.push({ id: row.id, сайт: row.source_url, сбой: String(error?.message ?? error) });
    }
  }
} finally {
  await browser.close();
}

// Ноль плашек — повод посмотреть снимок глазами: имя компании на первом
// экране не нашлось, а оно там почти всегда есть.
console.log(JSON.stringify({ снято: done.length, разборы: done }, null, 2));
