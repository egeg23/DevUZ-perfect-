/**
 * DevUz Box: хиро на главной и промо-страница /box (владелец, 02.11.2026).
 *
 * Что держит: страница есть на каждом языке сайта и в карте сайта, кнопка с
 * главной ведёт на неё, «октябрь 2027» на месте, цен нет, тексты без длинных
 * тире и штампов ИИ, картинки сцены лежат в public/box и не тяжёлые, заявка с
 * листа ожидания помечена источником box. Промо, а не страница для
 * инвестора (владелец, 02.11.2026): названий моделей ИИ, чипов и систем в
 * текстах нет, четырнадцать направлений и раздел системы с экранами на месте.
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import sitemap from "@/app/sitemap";
import { leadChannelDict } from "@/content/admin-panel/lead-origin";
import { BOX_CUTS, BOX_NAME, BOX_OS, BOX_OS_SCREENS, BOX_PATH, BOX_SHOTS, boxLayerCount, named } from "@/content/box";
import { boxCopy } from "@/content/box-copy";
import { getDictionary } from "@/content/dictionaries";
import { INBOUND_SOURCES } from "@/lib/admin/sales-stages";
import { locales, type Locale } from "@/lib/i18n";
import { aiMarkers, LONG_DASH } from "@/lib/proto/plain-text";
import { FORM_SOURCES, formSource } from "@/lib/qualify/form-sources";

const read = (path: string) => readFileSync(path, "utf8");

type Tree = string | number | boolean | Tree[] | { [k: string]: Tree };

/** Ключи, длины массивов и типы значений: одинаковые у двух деревьев, строки не пустые. */
function sameShape(a: Tree, b: Tree, path: string, problems: string[]) {
  if (typeof a !== typeof b) return void problems.push(`${path}: тип ${typeof b} вместо ${typeof a}`);
  if (typeof a === "string") {
    if (!(b as string).trim()) problems.push(`${path}: пусто`);
    return;
  }
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return void problems.push(`${path}: длина массива`);
    a.forEach((x, i) => sameShape(x, (b as Tree[])[i], `${path}[${i}]`, problems));
    return;
  }
  if (a && typeof a === "object") {
    const ka = Object.keys(a).sort().join(",");
    const kb = Object.keys(b as object).sort().join(",");
    if (ka !== kb) return void problems.push(`${path}: ключи ${kb} вместо ${ka}`);
    for (const k of Object.keys(a)) sameShape((a as Record<string, Tree>)[k], (b as Record<string, Tree>)[k], `${path}.${k}`, problems);
  }
}

function strings(tree: Tree, out: string[] = []): string[] {
  if (typeof tree === "string") out.push(tree);
  else if (Array.isArray(tree)) tree.forEach((x) => strings(x, out));
  else if (tree && typeof tree === "object") Object.values(tree).forEach((x) => strings(x, out));
  return out;
}

const LAUNCH: Record<Locale, RegExp> = {
  ru: /октябрь 2027/i,
  en: /October 2027/,
  uz: /2027-yil oktyabr/,
  zh: /2027 年 10 月/,
  uk: /жовтень 2027/i,
  pl: /październik 2027/i,
};

test("DevUz Box: словарь на шести языках одной формы, «октябрь 2027» на месте, имя в одном месте", () => {
  const ru = getDictionary("ru").box;
  assert.equal(ru, boxCopy.ru);
  for (const locale of locales) {
    const copy = getDictionary(locale).box;
    const problems: string[] = [];
    sameShape(ru as unknown as Tree, copy as unknown as Tree, locale, problems);
    assert.deepEqual(problems, [], `словарь box ${locale}`);
    assert.match(copy.hero.badge, LAUNCH[locale], `${locale}: плашка запуска`);
    assert.match(copy.promo.launch, LAUNCH[locale], `${locale}: запуск на промо`);
    assert.match(copy.roadmap.stages.at(-1)!.when, /2027/, `${locale}: последний этап роадмапа`);
    assert.match(copy.seo.title, /2027/, `${locale}: заголовок страницы`);
    // Имя в текстах только через {name}: переименовать можно одной строкой в content/box.ts.
    for (const s of strings(copy as unknown as Tree)) assert.doesNotMatch(s, /DevUz (Box|OS)/, `${locale}: имя записано руками: «${s.slice(0, 50)}»`);
    assert.equal(named("{name} Pro"), `${BOX_NAME} Pro`);
    assert.equal(named("на {os}"), `на ${BOX_OS}`);
    assert.match(copy.os.kicker, /\{os\}/, `${locale}: имя системы в подзаголовке через {os}`);
    if (locale !== "ru") assert.notEqual(copy.promo.title, ru.promo.title, `${locale}: промо не переведено`);
  }
});

test("DevUz Box: тексты без длинных тире, штампов ИИ и цен; узбекский и польский без кириллицы", () => {
  for (const locale of locales) {
    const all = strings(getDictionary(locale).box as unknown as Tree);
    for (const s of all) {
      assert.doesNotMatch(s, LONG_DASH, `${locale}: длинное тире в «${s.slice(0, 60)}»`);
      assert.doesNotMatch(s, /\$\s?\d|\d\s?\$|€|сум\b|so‘m\b/i, `${locale}: цена в «${s.slice(0, 60)}»`);
      if (locale === "uz" || locale === "pl" || locale === "en") assert.doesNotMatch(s, /[А-Яа-яЁё]/, `${locale}: кириллица в «${s.slice(0, 60)}»`);
    }
    const found = aiMarkers(all.join("\n"));
    assert.deepEqual(found, [], `${locale}: штампы ИИ`);
  }
});

test("DevUz Box: промо без названий моделей ИИ, чипов и систем; четырнадцать направлений, четыре дела системы и её экраны на месте", () => {
  // Владелец, 02.11.2026: «Про Qwen и тд не упоминай, это промо страница а не
  // страница для инвестора. Лучше общие термины „свое ядро“ и тд».
  const INSIDER = /\b(Qwen|gpt-oss|GPT|Llama|Mistral|DeepSeek|Whisper|Ryzen|Radeon|NVIDIA|GB10|Debian|Ubuntu|Linux|Docker|vLLM|Ollama|Strix)\b/i;
  for (const locale of locales) {
    const copy = getDictionary(locale).box;
    for (const s of strings(copy as unknown as Tree)) assert.doesNotMatch(s, INSIDER, `${locale}: внутренняя кухня в «${s.slice(0, 60)}»`);
    assert.equal(copy.scenarios.items.length, 14, `${locale}: направлений`);
    assert.equal(copy.os.pillars.length, 4, `${locale}: четыре дела системы`);
    assert.equal(copy.os.screens.length, BOX_OS_SCREENS.length, `${locale}: подписи экранов`);
    assert.equal(copy.models.items.length, 4, `${locale}: четыре модели`);
    for (const item of copy.models.items) for (const row of Object.keys(copy.models.rows)) assert.ok((item as Record<string, string>)[row], `${locale}: ${item.name} без «${row}»`);
  }
  const page = read("app/[locale]/box/page.tsx");
  assert.doesNotMatch(page, INSIDER, "внутренняя кухня в разметке промо");
  assert.match(page, /BOX_OS_SCREENS\.map/);
  assert.match(page, /copy\.os\.pillars\.map/);
  assert.match(page, /named\(copy\.os\.kicker\)/);
  assert.match(read("components/box/roadmap.tsx"), /named\(stage\.t\)/, "этап роадмапа с {os} подставляется");
  for (const key of BOX_OS_SCREENS) {
    for (const [suffix, limit] of [["", 90_000], ["-s", 40_000]] as const) {
      const path = join("public/box", `os-${key}${suffix}.webp`);
      assert.ok(existsSync(path), `нет ${path}`);
      assert.ok(statSync(path).size <= limit, `${path} тяжелее ${limit / 1000} КБ`);
    }
  }
});

test("DevUz Box: подписей столько, сколько слоёв в кадре, и все картинки сцены на месте", () => {
  const ru = boxCopy.ru;
  for (const model of ["lite", "pro", "jarvis"] as const) {
    assert.equal(ru.cut.layers[model].length, boxLayerCount(model), `${model}: подписи и слои`);
    const rows = BOX_CUTS[model].rows;
    for (let i = 1; i < rows.length; i++) assert.ok(rows[i][0] >= rows[i - 1][0], `${model}: слои сверху вниз`);
    for (let i = 1; i <= rows.length; i++) {
      for (const [suffix, limit] of [["", 60_000], ["-s", 20_000]] as const) {
        const path = join("public/box", `${model}-l${i}${suffix}.webp`);
        assert.ok(existsSync(path), `нет ${path}`);
        assert.ok(statSync(path).size <= limit, `${path} тяжелее ${limit / 1000} КБ`);
      }
    }
    assert.ok(existsSync(join("public/box", `${model}.webp`)) && existsSync(join("public/box", `${model}-s.webp`)), `${model}: нет собранной коробки`);
    assert.ok(statSync(join("public/box", `${model}.webp`)).size <= 120_000, `${model}.webp тяжелее 120 КБ`);
    assert.ok(BOX_SHOTS[model].w > 0 && BOX_SHOTS[model].h > 0);
  }
  for (const file of ["trio.webp", "trio-s.webp", "og.jpg"]) assert.ok(existsSync(join("public/box", file)), `нет ${file}`);
  assert.ok(statSync("public/box/trio.webp").size <= 160_000, "trio.webp тяжелее 160 КБ");
});

test("DevUz Box: хиро сразу за «Делали для», кнопка ведёт на /box, страница с метаданными и в карте сайта", async () => {
  const home = read("app/[locale]/page.tsx");
  assert.match(home, /<CompileScene[^>]*\/>\s*<ClientsSection[^>]*\/>\s*(?:\{\/\*[^]*?\*\/\}\s*)?<BoxHero/, "BoxHero не сразу за ClientsSection");
  const hero = read("components/sections/box-hero.tsx");
  assert.match(hero, /localeHref\(locale, BOX_PATH\)/);
  assert.match(hero, /copy\.button/);
  assert.match(hero, /useScrollProgress/);
  assert.match(hero, /reduced \? 1 : progress/, "при prefers-reduced-motion сцена должна стоять собранной");

  const page = read("app/[locale]/box/page.tsx");
  assert.match(page, /buildMetadata\(\{[^]*?path: BOX_PATH/);
  assert.match(page, /<BoxCutaway/);
  assert.match(page, /<BoxRoadmap/);
  assert.match(page, /<BoxWaitlist/);
  assert.match(page, /faqSchema\(copy\.faq\.items\.map/, "вопросы в разметке schema.org с подставленными именами");
  assert.equal(BOX_PATH, "box");

  assert.match(read("app/sitemap.ts"), /\{ path: BOX_PATH,/);
  const map = await sitemap();
  for (const locale of locales) {
    assert.ok(map.some((entry) => entry.url.endsWith(`/${locale}/${BOX_PATH}`)), `${locale}/${BOX_PATH} нет в карте сайта`);
  }
});

test("DevUz Box: сцена двигает только transform и opacity, слои грузятся лениво", () => {
  const scene = read("components/box/scene.tsx");
  assert.match(scene, /translate3d\(/);
  assert.doesNotMatch(scene, /style=\{\{[^}]*\b(left|top|width|height):\s*`\$\{t[xy]/, "позиционирование слоёв по прокрутке через left/top");
  assert.match(scene, /loading="lazy"/);
  assert.match(scene, /srcSet=\{`\$\{BOX_IMG\}\/\$\{model\}-l\$\{i \+ 1\}-s\.webp 520w/);
  const css = read("app/globals.css");
  assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{[^}]*\.box-sweep-idle/);
});

test("DevUz Box: заявка с листа ожидания идёт тем же путём, что форма, с источником box", () => {
  assert.ok((FORM_SOURCES as readonly string[]).includes("box"));
  assert.equal(formSource("box"), "box");
  assert.equal(formSource("outreach"), "form", "чужой источник не пускаем");
  assert.equal(formSource(undefined), "form");
  const form = read("components/box/waitlist.tsx");
  assert.match(form, /fetch\("\/api\/lead"/);
  assert.match(form, /source: "box"/);
  assert.match(form, /name="website"/, "приманка для ботов, как у обычной формы");
  const route = read("app/api/lead/route.ts");
  assert.match(route, /formSource\(body\.source\)/);
  assert.match(route, /saveLead\(lead, \[\], source,/);
  assert.match(route, /origin: \{ \.\.\.origin, source \}/);
  assert.ok(leadChannelDict.box.ru.includes("DevUz Box") && leadChannelDict.box.uz && leadChannelDict.box.pl, "канал box в карточке лида");
  assert.ok(INBOUND_SOURCES.includes("box"), "лист ожидания: это ответ и интерес, как форма");
});
