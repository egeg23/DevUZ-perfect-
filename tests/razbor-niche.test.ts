import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { NICHES, nicheByKey } from "@/content/razbor/catalog";
import { forbiddenNiche, parseNiche } from "@/lib/razbor/niche-words";

const ROOT = new URL("../", import.meta.url);
const read = (file: string) => readFileSync(new URL(file, ROOT), "utf8");

/**
 * Ниша вне каталога.
 *
 * Каталог — не список тех, кого мы согласны разбирать: аудитор работает по
 * любому сайту. Это материал страницы: без родительного падежа нет ни
 * заголовка, ни адреса. Пока формы лежали только словарём, смена молча
 * выбрасывала каждый сайт, чья ниша в него не попала.
 */

const GOOD = {
  key: "avtoshkola",
  ruGen: "автошколы",
  ruLabel: "автошкола",
  uz: "avtomaktab",
  uzLabel: "avtomaktab",
  ruMock: "Автошкола",
  uzMock: "Avtomaktab",
  ruServices: ["Категория B", "Вождение с инструктором", "Теория онлайн"],
  uzServices: ["B toifa", "Instruktor bilan haydash", "Onlayn nazariya"],
};

test("полная ниша принимается", () => {
  const niche = parseNiche(GOOD);
  assert.ok(niche);
  assert.equal(niche.key, "avtoshkola");
  assert.equal(niche.ruGen, "автошколы");
});

test("ключ приводится к латинице и к виду адреса", () => {
  // Ключ попадает в связку разборов между собой; кириллица или пробел в
  // нём сломают и адрес, и перелинковку.
  const niche = parseNiche({ ...GOOD, key: "Авто Школа!" });
  assert.equal(niche?.key, "avto-shkola");
});

test("неполная ниша не берётся вовсе", () => {
  // Пустой узбекский корень — это адрес /uz/razbor/uchun-sayt-toshkent,
  // то есть страница под запрос, которого никто не набирает.
  assert.equal(parseNiche({ ...GOOD, uz: "" }), null);
  assert.equal(parseNiche({ ...GOOD, ruGen: "" }), null);
  assert.equal(parseNiche({ ...GOOD, ruServices: ["одна"] }), null);
  assert.equal(parseNiche({}), null);
  assert.equal(parseNiche(null), null);
});

test("узбекская версия кириллицей не принимается", () => {
  // Кириллицей узбекский запрос не набирают, и страница под него не
  // найдётся ни по одному написанию.
  assert.equal(parseNiche({ ...GOOD, uzLabel: "автомактаб" }), null);
});

test("запрет на чувствительные ниши переживает то, что их называет модель", () => {
  // Раньше хватало списка ключей: банк или аптеку классификатор просто не
  // узнавал, и до проверки они не доходили. Как только нишу называет
  // модель, это перестаёт быть правдой.
  for (const label of ["микрокредитная организация", "аптека", "ветеринарная клиника", "букмекерская контора"]) {
    assert.equal(parseNiche({ ...GOOD, ruLabel: label }), null, `прошло: ${label}`);
  }

  // Ключ может выглядеть безобидно, а подпись — нет.
  assert.ok(
    forbiddenNiche({ ...GOOD, key: "finansy", ruLabel: "микрофинансовая организация" }),
    "запрет смотрит только на ключ",
  );
  assert.ok(!forbiddenNiche(parseNiche(GOOD)!));
});

test("медицина из каталога закрыта и по словам тоже", () => {
  assert.ok(forbiddenNiche(nicheByKey("stomatologiya")!));
  assert.ok(forbiddenNiche(nicheByKey("medcentr")!));
  assert.ok(!forbiddenNiche(nicheByKey("mebel")!));
});

/* ── Порядок, в котором ниша ищется ─────────────────────────────────────── */

test("сначала каталог, потом прежний разбор, и только потом модель", () => {
  const run = read("lib/razbor/shift-run.ts");
  const catalog = run.indexOf("const fromCatalog = nicheByKey(key);");
  const stored = run.indexOf("const known = await storedNiche(key);");
  const invented = run.indexOf("const made = await inventNiche(site);");

  assert.ok(catalog > 0 && stored > catalog, "прежний разбор ищется раньше каталога");
  assert.ok(invented > stored, "модель зовут раньше, чем смотрят прежние разборы");

  // Второй сайт в той же нише берёт те же слова. Иначе появятся две наши
  // страницы — «сайт для автошколы» и «сайт для автошкол», — между
  // которыми Google не выберет и не покажет ни одну.
  assert.match(run, /const same = await storedNiche\(made\.key\);/);
});

test("формы слова хранятся только у ниш вне каталога", () => {
  // Каталожные лежат в репозитории, и вторая копия в базе однажды с ними
  // разойдётся — причём разойдётся тихо.
  assert.match(read("lib/razbor/shift-run.ts"), /nicheWords: nicheByKey\(niche\.key\) \? null : niche/);
});

test("новую нишу смена называет проверяющему", () => {
  // Формы слова попадают в заголовок и в адрес страницы, а адрес потом не
  // переименовать: он уже в поиске и в карте сайта.
  assert.match(read("lib/razbor/shift-run.ts"), /Ниша «\$\{niche\.ruLabel\}» новая/);
});

test("что узнаёт классификатор, то есть и в каталоге", () => {
  // Так было потеряно всё, что связано с недвижимостью: `nedvizhimost`
  // классификатор узнавал с самого начала, а каталога под этот ключ не
  // существовало — и каждый сайт застройщика уходил в «ниша не
  // определилась».
  const classify = read("lib/razbor/classify.ts");
  const table = classify.slice(classify.indexOf("const WORDS"), classify.indexOf("const MIN_SCORE"));
  const keys = Array.from(table.matchAll(/^ {2}"?([a-z0-9-]+)"?: \[/gm)).map((m) => m[1]);

  assert.ok(keys.length >= 15, "не разобрал таблицу примет — проверка бессмысленна");
  for (const key of keys) {
    assert.ok(nicheByKey(key), `${key}: классификатор его узнаёт, а форм слова нет`);
  }
});

test("ниши каталога не спорят за один запрос", () => {
  // Две наши страницы под один запрос — это случай, когда Google не может
  // выбрать и не показывает ни одну.
  for (const field of ["ruGen", "uz"] as const) {
    const seen = new Map<string, string>();
    for (const niche of NICHES) {
      const word = niche[field].toLowerCase();
      assert.ok(!seen.has(word), `${niche.key} и ${seen.get(word)} делят «${word}»`);
      seen.set(word, niche.key);
    }
  }
});

test("правила ниши не тащат SDK в сборку публичных страниц", () => {
  // `lib/razbor/store.ts` читают страницы раздела. Вопрос модели живёт
  // отдельным файлом ровно поэтому: клиент Anthropic в сборке страницы,
  // которая его никогда не позовёт, — это мегабайты за ничто.
  const words = read("lib/razbor/niche-words.ts");
  assert.ok(!/@anthropic-ai\/sdk/.test(words), "SDK вернулся в правила");
  assert.match(read("lib/razbor/niche-ask.ts"), /@anthropic-ai\/sdk/);
  assert.match(read("lib/razbor/store.ts"), /from "@\/lib\/razbor\/niche-words"/);
  assert.ok(!/niche-ask/.test(read("lib/razbor/store.ts")), "хранилище тянет вызов модели");
});

test("ниша определяется дешёвой моделью, а не той, что пишет статью", () => {
  const ask = read("lib/razbor/niche-ask.ts");
  assert.match(ask, /RAZBOR_NICHE_MODEL \|\| "claude-sonnet-5"/);
  // Переменная должна быть и там, откуда её читает боевой контейнер.
  assert.match(read("docker-compose.yml"), /RAZBOR_NICHE_MODEL/);
  assert.match(read(".env.example"), /RAZBOR_NICHE_MODEL=/);
});
