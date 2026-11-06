/**
 * «Рынки» — где искать клиентов по странам (content/markets.ts).
 *
 * Владелец, 06.11.2026: «Мы планируем уменьшить усилия на Узбекистан… пойти
 * по снг / сша. Нужно вывести в панели новый раздел для всех: страны… Все со
 * ссылками. В общем сводка для менеджеров, где и как искать клиентов».
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { MARKETS, RESOURCE_KINDS, marketOf, resourcesByKind } from "@/content/markets";
import { SECTIONS, opens } from "@/lib/admin/roles";
import { parseChatInput } from "@/lib/scout/extra-chats";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const CYRILLIC = /[А-Яа-яЁё]/;

test("раздел «Рынки» — всем, вкладкой «Холодных касаний», страницы проверяют доступ", () => {
  const section = SECTIONS.find((s) => s.href === "/admin/markets");
  assert.ok(section);
  assert.equal(section.label.ru, "Рынки");
  assert.equal(section.parent, "/admin/prospect");
  for (const role of ["manager", "head", "admin"] as const) assert.ok(opens({ role }, "/admin/markets"), role);
  assert.match(read("app/admin/markets/page.tsx"), /requireSection\("\/admin\/markets"\)/);
  assert.match(read("app/admin/markets/[slug]/page.tsx"), /requireSection\("\/admin\/markets"\)/);
});

test("СНГ и США — главные рынки, у каждой страны есть с чего начать и площадки", () => {
  const slugs = MARKETS.map((m) => m.slug);
  assert.equal(new Set(slugs).size, slugs.length, "адреса стран не повторяются");
  for (const slug of ["ru", "kz", "us"]) assert.equal(marketOf(slug)?.priority, "high", slug);
  for (const slug of ["kg", "by", "am", "ge", "az", "pl", "eu"]) assert.ok(marketOf(slug), slug);
  assert.equal(marketOf("uz")?.priority, "low", "Узбекистан — по случаю");
  assert.equal(marketOf("nope"), null);
  for (const market of MARKETS) {
    assert.ok(market.tips.length >= 3, `${market.slug}: шаги`);
    assert.ok(market.resources.length >= 10, `${market.slug}: площадок ${market.resources.length}`);
    assert.ok(resourcesByKind(market).length >= 4, `${market.slug}: видов площадок мало`);
  }
});

test("каждая площадка — со ссылкой https, описанием и тем, как там работать, на трёх языках", () => {
  for (const market of MARKETS) {
    const urls = market.resources.map((r) => r.url);
    assert.equal(new Set(urls).size, urls.length, `${market.slug}: ссылка повторяется`);
    const texts = [market.name, market.why, ...market.tips];
    for (const item of market.resources) {
      assert.match(item.url, /^https:\/\/[a-z0-9.-]+\.[a-z]{2,}(\/|$)/i, `${market.slug}: ${item.url}`);
      assert.ok(RESOURCE_KINDS.includes(item.kind), `${item.name}: ${item.kind}`);
      assert.ok(["free", "freemium", "paid"].includes(item.cost), `${item.name}: ${item.cost}`);
      assert.ok(item.name.trim(), `${market.slug}: без названия`);
      texts.push(item.what, item.how);
      // Telegram — адрес группы, его кнопка «Скауту» отдаёт в «Группы для скаута».
      if (item.kind === "telegram") assert.ok(parseChatInput(item.url), `${item.url}: не адрес группы`);
    }
    for (const text of texts) {
      for (const locale of ["ru", "uz", "pl"] as const) assert.ok(text[locale]?.trim(), `${market.slug}: нет ${locale}`);
      assert.doesNotMatch(text.uz, CYRILLIC, `${market.slug}: кириллица в узбекском — ${text.uz}`);
      assert.doesNotMatch(text.pl, CYRILLIC, `${market.slug}: кириллица в польском — ${text.pl}`);
    }
  }
});

test("«Скауту» на странице страны — тем же действием, что «Добавить группу»", () => {
  const page = read("app/admin/markets/[slug]/page.tsx");
  assert.match(page, /addScoutChatAction/);
  assert.match(page, /parseChatInput\(item\.url\)/);
  assert.match(page, /rel="noreferrer"/, "чужая площадка не получает адрес панели");
});
