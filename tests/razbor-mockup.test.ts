import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { CITIES, NICHES, cityByKey, nicheByKey } from "@/content/razbor/catalog";
import { fixesFor, mockupHtml } from "@/lib/razbor/mockup";
import type { Finding } from "@/lib/audit/checks";

/**
 * Макет «как сделали бы мы».
 *
 * Он идёт в публичную статью рядом со снимком чужого сайта, поэтому три
 * вещи проверяются жёстко: в нём нет имени разобранной компании, нет
 * выдуманных цифр и он читается на телефоне.
 */

const stom = nicheByKey("stomatologiya");
const tash = cityByKey("tashkent");
assert.ok(stom && tash);

const ru = mockupHtml({ niche: stom, city: tash, locale: "ru", findings: [] });
const uz = mockupHtml({ niche: stom, city: tash, locale: "uz", findings: [] });

test("в макете нейтральное имя, а не чужое", () => {
  assert.ok(ru.includes("Стоматология"), "нет рода занятий в шапке");
  assert.equal(stom.ruMock, "Стоматология");
  // Ни один макет не должен содержать слов, похожих на чужой бренд: у нас
  // их просто неоткуда взять — на вход идут только ниша и город.
  for (const niche of NICHES) {
    assert.ok(niche.ruMock.length > 2, `${niche.key}: нет нейтрального имени`);
    assert.ok(niche.uzMock.length > 2, `${niche.key}: нет узбекского имени`);
  }
});

test("в макете нет выдуманных цифр", () => {
  // «5000 довольных клиентов» и «15 лет на рынке» — утверждения о живой
  // компании, пусть и неназванной. Подтвердить их нечем.
  const claims = /\d[\d\s]*\s*(лет|год|клиент|пациент|проект|%|процент)/i;
  for (const html of [ru, uz]) {
    const match = html.match(claims);
    assert.equal(match, null, `выдуманная цифра в макете: ${match?.[0]}`);
  }
  // Цена — прочерк, а не число: точную сумму называет специалист.
  assert.ok(ru.includes("от <b>—</b>"), "в карточке услуги стоит придуманная цена");
});

test("услуги берутся из каталога ниши", () => {
  for (const service of stom.ruServices) {
    assert.ok(ru.includes(service), `услуга «${service}» не попала в макет`);
  }
  for (const service of stom.uzServices) {
    assert.ok(uz.includes(service), `услуга «${service}» не попала в узбекский макет`);
  }
});

test("заголовок макета — ниша и город", () => {
  assert.ok(ru.includes("Стоматология в Ташкенте"));
  assert.ok(uz.includes("Toshkentda Stomatologiya"));
});

test("оба языка собираются для каждой пары ниша+город", () => {
  for (const niche of NICHES) {
    for (const city of CITIES) {
      for (const locale of ["ru", "uz"] as const) {
        const html = mockupHtml({ niche, city, locale, findings: [] });
        assert.match(html, /<!doctype html>/i, `${niche.key}/${city.key}/${locale}: не собрался`);
        assert.ok(html.includes("<h1>"), `${niche.key}/${city.key}/${locale}: нет h1`);
      }
    }
  }
});

test("подпись «что починили» берётся из кодов находок", () => {
  const finding = (code: string): Finding => ({
    code,
    severity: "critical",
    title: code,
    impact: "…",
    fix: "…",
  });

  const fixes = fixesFor([finding("no_viewport"), finding("slow"), finding("no_viewport")], "ru");
  assert.deepEqual(fixes, ["читается на телефоне", "первый экран сразу"]);
  // Незнакомый код молча пропускается: подпись не должна выдумывать, что
  // макет чинит то, чего разбор не находил.
  assert.deepEqual(fixesFor([finding("никогда-такого-не-было")], "ru"), []);
});

/* ── Проверка разметки ──────────────────────────────────────────────────── */

test("боковые отступы задаются один раз и не затираются", () => {
  const src = readFileSync(new URL("../lib/razbor/mockup.ts", import.meta.url), "utf8");

  // Выстрелило ровно так: .hero задавал `padding: 64px 0 40px`, сокращённая
  // запись обнуляла боковые отступы контейнера, и на телефоне заголовок
  // упирался в край. На десктопе не видно — там поля даёт центрирование.
  assert.match(src, /\.wrap \{[^}]*padding-inline: 24px/);

  const css = src.slice(src.indexOf("<style>"), src.indexOf("</style>"));
  const bad = css.match(/padding:\s*[\d.]+\w*\s+0(\s|;|\})/g);
  assert.equal(
    bad,
    null,
    `сокращённая запись padding с нулём по бокам вернулась: ${bad?.join(", ")}`,
  );
});

test("в макете есть мобильная вёрстка и кнопка на первом экране", () => {
  assert.match(ru, /<meta name="viewport"/, "без viewport макет сам не мобильный");
  assert.match(ru, /@media \(width < 40rem\)/, "нет мобильных правил");
  // Разбор почти всегда находит «нет способа записаться» — макет обязан это
  // чинить, иначе сравнение «было — стало» ничего не показывает.
  const hero = ru.slice(ru.indexOf("<main>"), ru.indexOf("</section>"));
  assert.ok(hero.includes("Записаться"), "на первом экране нет кнопки записи");
});
