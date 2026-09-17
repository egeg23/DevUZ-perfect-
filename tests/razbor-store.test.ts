import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { lostBand, sourceHash, toItem } from "@/lib/razbor/store";

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

const ARTICLE = {
  title: "Мебельный магазин теряет заявки на телефоне",
  description: "Разбор сайта мебельного магазина в Ташкенте",
  label: "мебельный магазин в Ташкенте, около 300 товаров",
  query: "сайт мебельного магазина ташкент",
  intro: ["Первый абзац.", "Второй абзац."],
  findings: [{ title: "Вёрстка съезжает", impact: "Половина уходит", fix: "Переверстать, два дня" }],
  outcome: ["Заявки перестанут теряться"],
  price: "от $1500, 3–6 недель",
};

const ROW = {
  category: "mebel",
  city: "tashkent",
  country: "UZ",
  published_at: "2026-09-18T06:00:00Z",
  created_at: "2026-09-17T06:00:00Z",
  shot_taken_at: "2026-09-17T05:00:00Z",
  shot_before: "a.png",
  shot_before_mobile: "b.png",
  shot_after: "c.png",
  shot_after_mobile: "d.png",
  slug_ru: "mebel-tashkent",
  slug_uz: "mebel-toshkent",
  article_ru: ARTICLE,
  article_uz: { ...ARTICLE, query: "mebel do'kon sayti toshkent" },
  lost_per_100: [4, 9],
};

test("строка базы разворачивается в две страницы, а не в перевод одной", () => {
  const ru = toItem(ROW, "ru");
  const uz = toItem(ROW, "uz");
  assert.ok(ru && uz);

  assert.equal(ru.slug, "mebel-tashkent");
  assert.equal(uz.slug, "mebel-toshkent");
  // hreflang: каждая знает про вторую.
  assert.deepEqual(ru.alt, { locale: "uz", slug: "mebel-toshkent" });
  assert.deepEqual(uz.alt, { locale: "ru", slug: "mebel-tashkent" });
  // Запросы разные — это и есть смысл двух страниц.
  assert.notEqual(ru.query, uz.query);

  assert.equal(ru.publishedAt, "2026-09-18");
  assert.deepEqual(ru.lostPer100, [4, 9]);
  assert.equal(ru.findings[0].fix, "Переверстать, два дня");
});

test("строка без статьи на этом языке страницей не становится", () => {
  // Половина разбора под hreflang ведёт на несуществующую вторую страницу.
  assert.equal(toItem({ ...ROW, article_uz: null }, "uz"), null);
  assert.equal(toItem({ ...ROW, slug_ru: "" }, "ru"), null);
});

test("полоса потерь — пара чисел или ничего", () => {
  assert.deepEqual(lostBand([4, 9]), [4, 9]);
  // Испорченная запись не «почти пара»: показать из неё половину значило бы
  // поставить на страницу цифру, которой никто не считал.
  assert.equal(lostBand([4]), null);
  assert.equal(lostBand([4, 9, 12]), null);
  assert.equal(lostBand(["мало", "много"]), null);
  assert.equal(lostBand(null), null);
  assert.equal(lostBand("4-9"), null);
});

test("один сайт разбираем один раз: отпечаток не зависит от написания адреса", () => {
  const a = sourceHash("https://Mebel.uz/");
  assert.equal(a, sourceHash("http://mebel.uz"));
  assert.equal(a, sourceHash("  mebel.uz  "));
  assert.notEqual(a, sourceHash("mebel.uz/catalog"));
  assert.match(a, /^[0-9a-f]{64}$/);
});

test("адрес разобранного сайта наружу не уходит", () => {
  // Служебное поле: без него не перепроверить разбор, но на публичной
  // странице оно называет компанию, которую мы обещали не называть.
  for (const file of [
    "app/[locale]/razbor/page.tsx",
    "app/[locale]/razbor/[slug]/page.tsx",
    "lib/razbor/store.ts",
  ]) {
    const code = read(file);
    if (file.startsWith("app/")) {
      assert.doesNotMatch(code, /source_url|sourceUrl/, file);
    }
  }
  // Публичная выборка не тянет адрес из базы вовсе.
  const store = read("lib/razbor/store.ts");
  const columns = store.slice(store.indexOf("const COLUMNS"), store.indexOf("const COLUMNS") + 400);
  assert.doesNotMatch(columns, /source_url|source_hash/, "публичный запрос тянет служебный адрес");
});

test("публикуется только пара статей целиком", () => {
  const store = read("lib/razbor/store.ts");
  assert.match(store, /if \(!data\.article_ru \|\| !data\.article_uz\) \{/);
  assert.match(store, /публиковать половину нельзя/);
});

test("публикует и отклоняет только владелец, и это проверяется в действии", () => {
  const actions = read("app/admin/razbor/actions.ts");
  // Не «кнопку не видно», а право: видимость правом не является.
  assert.match(actions, /if \(staff\.role !== "admin"\) redirect\("\/admin"\)/);
  assert.match(actions, /await owner\(\)/);
  assert.match(actions, /record\("razbor\.published"/);
  assert.match(actions, /record\("razbor\.rejected"/);
});

test("отказ хранится с причиной, иначе смена вернётся к этому сайту снова", () => {
  const store = read("lib/razbor/store.ts");
  assert.match(store, /notes: reason\.slice\(0, 2000\) \|\| "без причины"/);
  // Отклонённые считаются разобранными: иначе ночная задача будет
  // приносить один и тот же сайт каждую ночь.
  assert.match(store, /export async function coveredHashes/);
  assert.doesNotMatch(
    store.slice(store.indexOf("coveredHashes"), store.indexOf("coveredHashes") + 400),
    /\.eq\("status"/,
    "отклонённые не попадают в список уже разобранных",
  );
});

test("карта сайта и IndexNow видят то, что опубликовала смена", () => {
  // Раздел наполняется без выкатки. Карта сайта, собранная из файла, не
  // узнала бы о новой странице до следующего деплоя — то есть страница,
  // ради которой раздел и написан, осталась бы невидимой для поиска.
  assert.match(read("app/sitemap.ts"), /listRazbors\(locale\)/);
  assert.match(read("app/api/indexnow/route.ts"), /listRazbors\(locale\)/);
});
