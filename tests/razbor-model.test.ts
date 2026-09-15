import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import type { AuditReport, Finding } from "@/lib/audit/checks";
import { CITIES, NICHES, cityByKey, nicheByKey } from "@/content/razbor/catalog";
import {
  MAX_FINDINGS,
  MIN_FINDINGS,
  labelFor,
  pickFindings,
  queryFor,
  slugFor,
  slugify,
  worthWriting,
} from "@/lib/razbor/model";

/**
 * Правила разбора.
 *
 * Их применяет ночная задача: она сама находит сайт, сама решает, писать ли
 * про него, и сама публикует. Человека, который заметил бы ошибку до
 * публикации, в этой цепочке нет — поэтому правила и закрыты тестами
 * целиком.
 */

const finding = (severity: Finding["severity"], code: string): Finding => ({
  code,
  severity,
  title: code,
  impact: "…",
  fix: "…",
});

const report = (findings: Finding[], facts?: Partial<AuditReport["facts"]>): AuditReport => ({
  url: "https://example.uz",
  score: 50,
  findings,
  facts: {
    https: true,
    ttfbMs: 400,
    platform: null,
    isShop: false,
    certDaysLeft: 90,
    ...facts,
  },
});

/* ── Адреса ─────────────────────────────────────────────────────────────── */

test("адрес страницы — латиница, дефисы, без апострофов", () => {
  assert.equal(slugify("сайт для стоматологии Ташкент"), "sayt-dlya-stomatologii-tashkent");
  // Узбекский апостроф в ссылке превращается в %27 — убираем совсем.
  assert.equal(slugify("internet do'kon yaratish"), "internet-dokon-yaratish");
  assert.equal(slugify("  Фергана / Farg'ona  "), "fergana-fargona");
  assert.ok(!slugify("O'sh").includes("'"));
});

test("адрес не содержит ни даты, ни номера", () => {
  const stom = nicheByKey("stomatologiya");
  const tash = cityByKey("tashkent");
  assert.ok(stom && tash);
  assert.equal(slugFor(stom, tash, "ru"), "sayt-dlya-stomatologii-tashkent");
  assert.equal(slugFor(stom, tash, "uz"), "stomatologiya-uchun-sayt-toshkent");
});

test("каждая пара ниша+город даёт свой адрес и свой запрос", () => {
  const slugs = new Set<string>();
  const queries = new Set<string>();

  for (const niche of NICHES) {
    for (const city of CITIES) {
      for (const locale of ["ru", "uz"] as const) {
        const slug = slugFor(niche, city, locale);
        const query = queryFor(niche, city, locale);

        assert.match(slug, /^[a-z0-9]+(-[a-z0-9]+)*$/, `плохой адрес: ${slug}`);
        assert.ok(!slugs.has(slug), `адрес повторился: ${slug}`);
        // Две страницы под один запрос — это когда Google не может выбрать
        // и не показывает ни одну.
        assert.ok(!queries.has(query), `запрос повторился: ${query}`);

        slugs.add(slug);
        queries.add(query);
      }
    }
  }

  assert.equal(slugs.size, NICHES.length * CITIES.length * 2);
});

test("в запросе есть и ниша, и город", () => {
  const avto = nicheByKey("avtoservis");
  const almaty = cityByKey("almaty");
  assert.ok(avto && almaty);

  assert.equal(queryFor(avto, almaty, "ru"), "сайт для автосервиса в Алматы");
  assert.equal(queryFor(avto, almaty, "uz"), "avtoservis uchun sayt Olmaotada");
});

/* ── Анонимность ────────────────────────────────────────────────────────── */

test("подпись называет категорию, а не компанию", () => {
  const shop = nicheByKey("internet-magazin");
  const tash = cityByKey("tashkent");
  assert.ok(shop && tash);

  assert.equal(
    labelFor(shop, tash, report([]).facts, "ru"),
    "интернет-магазин в Ташкенте",
  );
  // Платформа делает подпись конкретной, не выдавая владельца.
  assert.equal(
    labelFor(shop, tash, report([], { platform: "WordPress" }).facts, "ru"),
    "интернет-магазин в Ташкенте, сайт на WordPress",
  );
  assert.equal(
    labelFor(shop, tash, report([], { platform: "WordPress" }).facts, "uz"),
    "Toshkentda internet do'kon, sayt WordPress asosida",
  );
});

/* ── Стоит ли писать ────────────────────────────────────────────────────── */

test("про мёртвый сайт разбор не пишем", () => {
  assert.deepEqual(worthWriting(report([finding("critical", "unreachable")])), {
    ok: false,
    why: "unreachable",
  });
  assert.deepEqual(
    worthWriting(
      report([finding("critical", "http_error"), finding("major", "a"), finding("major", "b")]),
    ),
    { ok: false, why: "unreachable" },
  );
});

test("две находки — это придирка, а не разбор", () => {
  const verdict = worthWriting(report([finding("critical", "a"), finding("major", "b")]));
  assert.deepEqual(verdict, { ok: false, why: "thin" });
});

test("нормальный сайт не ругаем", () => {
  // Три мелочи — сайт живой и приличный. Выдуманная проблема видна читателю
  // сразу и бьёт по доверию ко всем остальным разборам.
  const verdict = worthWriting(
    report([finding("minor", "a"), finding("minor", "b"), finding("minor", "c")]),
  );
  assert.deepEqual(verdict, { ok: false, why: "too_good" });

  // Одного серьёзного достаточно.
  assert.deepEqual(
    worthWriting(report([finding("critical", "a"), finding("minor", "b"), finding("minor", "c")])),
    { ok: true },
  );
  // Двух заметных — тоже.
  assert.deepEqual(
    worthWriting(report([finding("major", "a"), finding("major", "b"), finding("minor", "c")])),
    { ok: true },
  );
});

/* ── Отбор находок ──────────────────────────────────────────────────────── */

test("сначала серьёзное, потом остальное", () => {
  const picked = pickFindings(
    report([
      finding("minor", "m1"),
      finding("major", "j1"),
      finding("critical", "c1"),
      finding("minor", "m2"),
      finding("critical", "c2"),
    ]),
  );

  assert.deepEqual(
    picked.map((f) => f.code),
    ["c1", "c2", "j1", "m1", "m2"],
  );
});

test("критичные не обрезаются пределом", () => {
  const many = Array.from({ length: MAX_FINDINGS + 3 }, (_, i) => finding("critical", `c${i}`));
  const picked = pickFindings(report([...many, finding("minor", "m")]));

  assert.equal(picked.length, many.length, "критичную находку обрезали ради ровного числа");
  assert.ok(!picked.some((f) => f.code === "m"), "мелочь пролезла сверх предела");
});

test("предел держится, когда критичного мало", () => {
  const rest = Array.from({ length: 20 }, (_, i) => finding("major", `j${i}`));
  const picked = pickFindings(report([finding("critical", "c"), ...rest]));

  assert.equal(picked.length, MAX_FINDINGS);
  assert.equal(picked[0]?.code, "c");
});

test("пороги не разъезжаются между собой", () => {
  assert.ok(MIN_FINDINGS < MAX_FINDINGS);
});

/* ── Проверка исходников ────────────────────────────────────────────────── */

test("адрес разобранного сайта в таблице служебный", () => {
  const sql = readFileSync(new URL("../supabase/migrations/0021_razbors.sql", import.meta.url), "utf8");

  // Один сайт разбираем один раз: без этого ночная задача вернётся к нему
  // через неделю и напишет второй разбор — то есть сама себе конкурента.
  assert.match(sql, /create unique index[^;]*razbors_source_key/);
  // Один запрос — одна страница, и это ограничение базы, а не кода.
  assert.match(sql, /create unique index[^;]*razbors_query_ru_key/);
  assert.match(sql, /create unique index[^;]*razbors_query_uz_key/);
  assert.match(sql, /alter table public\.razbors enable row level security/);
});
