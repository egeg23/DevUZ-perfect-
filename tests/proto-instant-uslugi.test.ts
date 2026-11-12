import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { test } from "node:test";

import { visibleText } from "@/lib/proto/check";
import { buildInstant } from "@/lib/proto/instant/build";
import { offerAddons, OFFER_ADDONS_MAX } from "@/lib/proto/instant/offer";
import { instantReady, type InstantSite } from "@/lib/proto/instant/types";
import { siteFromAnswers } from "@/lib/proto/instant/read";
import { USLUGI_PHOTOS } from "@/lib/proto/instant/uslugi";
import { fintaxAssets } from "../scripts/protos/instant/fintax-assets.mjs";
import ftFile from "@/content/proto-instant/fintax-assets.json" with { type: "json" };
import { EXAMPLE_USLUGI, EXAMPLE_USLUGI_UZ } from "../scripts/protos/instant/preview-data.mjs";

/**
 * «Услуги для бизнеса» — шаблон из нашего макета FinTax и универсальный
 * макет для «Другого» (владелец, 12.11.2026: «Мы теряем лидов из-за того,
 * что они нажимают "другая ниша"… выведем больше ниш которые у нас есть,
 * также переодевать просто»).
 */
const SEED = "0".repeat(32);
const site = EXAMPLE_USLUGI as InstantSite;

test("услуги: пример собирается без замечаний на двух языках, защита та же", () => {
  for (const s of [site, EXAMPLE_USLUGI_UZ as InstantSite]) {
    const { html, problems, stamp, pages } = buildInstant(s, SEED);
    assert.deepEqual(problems, []);
    assert.ok(html.includes("Мастер Плюс") && html.includes('id="order"') && html.includes('id="uslugi"') && html.includes('id="zayavka"'));
    assert.ok(html.includes(`/${s.locale}/mockup-terms`) && html.includes('class="dz-vid"'));
    assert.ok(stamp.signals.some((x) => x.startsWith("js:")), "метка числа скрипта");
    assert.ok(stamp.signals.filter((x) => x.startsWith("text:")).length >= 4, "две ловушки");
    assert.ok(pages.admin, "админка FinTax рядом");
  }
});

test("услуги: наш макет FinTax, снимок свежий, без их имени, тарифов и цифр", () => {
  assert.deepEqual(ftFile, fintaxAssets(), "node scripts/protos/instant/fintax-assets.mjs");
  const { html } = buildInstant(site, SEED);
  assert.ok(!/fintax|кушбеги|1 500 000|100 компаний/i.test(html), "ничего про FinTax");
  assert.ok(!/\d+\s?%/.test(visibleText(html)), "процентов FinTax на странице нет");
  assert.ok(!html.includes('class="pk" data-picker') && !html.includes('class="desk" data-desk'), "подбора тарифа и стола бухгалтера нет");
  assert.ok(html.includes("'fe-leads-1'"), "заявка ложится туда же, откуда читает панель FinTax");
});

test("услуги: универсальный: шаблон сам не говорит о бухгалтерии и налогах", () => {
  const sphere = /бухгалт|налог|отчётност|buxgalter|soliq|hisobot/i;
  for (const s of [site, EXAMPLE_USLUGI_UZ as InstantSite]) {
    const b = buildInstant(s, SEED);
    assert.ok(!sphere.test(b.html), "сайт");
    assert.ok(!sphere.test(b.pages.admin ?? ""), "админка");
  }
});

test("услуги: нет команды, «почему мы», чата и адреса — без блоков, связь звонком", () => {
  const bare = buildInstant({ ...site, doctors: [], perks: [], telegram: null, whatsapp: null, address: null, about: null, tagline: null }, SEED);
  assert.deepEqual(bare.problems, []);
  assert.ok(!bare.html.includes('id="team"') && !bare.html.includes('href="https://t.me/') && !bare.html.includes('href="https://wa.me/'), "чата нет: и ссылок в чат нет");
  assert.ok(bare.html.includes("tel:+998712000007"));
  const none = buildInstant({ ...site, services: [] }, SEED);
  assert.deepEqual(none.problems, []);
  assert.ok(!none.html.includes('id="uslugi"'), "без услуг нет схемы");
});

test("услуги: из ответов в боте («Ремонт стиральных машин») собирается без замечаний", () => {
  const s = siteFromAnswers({ niche: "uslugi", locale: "ru", name: "Мастер Плюс", phone: "+998 90 111 22 33", address: "", services: "Диагностика\nЗамена насоса - 250 000 сум", source: "ответы в Telegram" } as never);
  assert.deepEqual(buildInstant(s, SEED).problems, []);
});

test("услуги: допы общих наших планов, не дороже предела; фото лежат в репозитории", () => {
  assert.ok(instantReady("uslugi"));
  const add = offerAddons("uslugi");
  assert.ok(add.length >= 4 && add.reduce((n, a) => n + a.price, 0) <= OFFER_ADDONS_MAX);
  for (const p of [...USLUGI_PHOTOS, "/protos/_niche/uslugi/hero-m-1080.webp", "/protos/_niche/uslugi/band-1100.webp"]) assert.ok(existsSync(`public${p}`), p);
});
