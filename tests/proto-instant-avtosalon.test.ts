import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { test } from "node:test";

import { buildInstant } from "@/lib/proto/instant/build";
import { tailsIn } from "@/lib/proto/instant/check";
import { AVTOSALON_PHOTOS, carPrice } from "@/lib/proto/instant/avtosalon";
import { hasAdmin } from "@/lib/proto/instant/admin";
import { offerAddons } from "@/lib/proto/instant/offer";
import { instantReady, type InstantSite } from "@/lib/proto/instant/types";
import { samistAssets } from "../scripts/protos/instant/samist-assets.mjs";
import smFile from "@/content/proto-instant/samist-assets.json" with { type: "json" };

/**
 * «Автосалон» в «Макете в боте» (владелец, 12.11.2026: «выведем больше ниш
 * которые у нас есть, также переодевать»): страница сайта нашего макета SAMIST
 * AUTO на данных клиента, без их машин, цен, знака и адреса.
 */

const SEED = "1".repeat(32);
/** Выдуманный автосалон: реальных клиентов в репозиторий не кладём. */
const AVTO: InstantSite = {
  niche: "avtosalon",
  locale: "ru",
  name: "Мотор Сити",
  tagline: "Новые машины с гарантией",
  about: "Автосалон на Сергели: новые кроссоверы и седаны, кредит через банки-партнёры, обмен старой машины.",
  city: "Ташкент",
  color: "#1f6fd1",
  logo: null,
  services: [
    { name: "Кроссовер Nova X5, 2025", price: "315 000 000 сум" },
    { name: "Седан Nova S3, 2025", price: "245 000 000 сум" },
    { name: "Пикап Nova Trail, 2024", price: "от 410 000 000 сум" },
    { name: "Минивэн Nova Family", price: null },
    { name: "Электромобиль Nova E", price: "$29 900" },
  ],
  doctors: [],
  perks: ["Кредит и лизинг через банки", "Трейд-ин в день обращения", "Тест-драйв без записи в выходные"],
  phone: "+998 71 200 00 00",
  telegram: "motor_city_demo",
  whatsapp: null,
  instagram: "motor_city_demo",
  address: "Ташкент, Сергели, ул. Примерная, 1",
  hours: "Пн-Вс 9:00-20:00",
  photos: [],
  source: "пример, выдуманный автосалон",
};

test("автосалон: пример собирается без замечаний на двух языках, защита та же", () => {
  for (const locale of ["ru", "uz"] as const) {
    const { html, problems, stamp } = buildInstant({ ...AVTO, locale }, SEED);
    assert.deepEqual(problems, [], locale);
    assert.ok(html.includes("Мотор Сити") && html.includes('id="lineup"') && html.includes('id="trade"') && html.includes('id="drive"'));
    assert.ok(html.includes(`/${locale}/mockup-terms`) && html.includes('class="dz-vid"'));
    assert.ok(stamp.signals.some((s) => s.startsWith("js:")), "метка числа скрипта SAMIST");
    assert.ok(stamp.signals.filter((s) => s.startsWith("text:")).length >= 4, "две ловушки");
  }
});

test("автосалон: стили и скрипт нашего макета SAMIST AUTO, свежие, без SAMIST, их машин и площадки", () => {
  assert.deepEqual(smFile, samistAssets(), "node scripts/protos/instant/samist-assets.mjs");
  const { html, pages } = buildInstant(AVTO, SEED);
  assert.ok(html.includes(smFile.css.slice(0, 200)), "стили SAMIST на странице");
  for (const s of ["SAMIST", "SIA AUTO", "autoline", "Isuzu", "ISUZU", "D-MAX", "FAW", "/protos/samist", "/protos/samauto", "'sm-", "120А", 'class="dmx']) {
    assert.ok(!html.includes(s), s);
    assert.ok(!(pages.admin ?? "").includes(s), `админка: ${s}`);
  }
  assert.deepEqual(tailsIn(html), []);
  assert.ok(buildInstant({ ...AVTO, about: "Как в SAMIST AUTO на кольцевой" }, SEED).problems.some((p) => p.code === "tail"), "SAMIST — хвост");
});

test("автосалон: в кредит — только цена числом в сумах, остальное словами клиента", () => {
  assert.equal(carPrice("315 000 000 сум"), 315_000_000);
  assert.equal(carPrice("245000000"), 245_000_000);
  for (const p of ["от 410 000 000 сум", "$29 900", "450 млн", "300-350 000 000", null, "по запросу", "45 000 сум"]) assert.equal(carPrice(p), 0, String(p));
  const { html } = buildInstant(AVTO, SEED);
  assert.ok(html.includes('id="credit"') && /<option value="c0">[^<]*315 000 000 сум/.test(html), "кредит по машинам с ценой в сумах");
  assert.ok(!/<option value="c2">[^<]*· от 410/.test(html.slice(html.indexOf('id="cr-m"'), html.indexOf('id="cr-dp"'))), "«от …» в кредит не идёт");
  const noPrice = buildInstant({ ...AVTO, services: AVTO.services.map((s) => ({ ...s, price: null })) }, SEED);
  assert.deepEqual(noPrice.problems, []);
  assert.ok(!noPrice.html.includes('id="credit"'), "нет цен в сумах — нет кредита");
});

test("автосалон: нет машин и связи — без блоков машин, тест-драйва и ссылок", () => {
  const bare = buildInstant({ ...AVTO, services: [], about: null, perks: [], address: null, hours: null, phone: null, instagram: null }, SEED);
  assert.deepEqual(bare.problems, []);
  for (const id of ['id="lineup"', 'id="credit"', 'id="drive"', 'id="scn"', 'id="about"']) assert.ok(!bare.html.includes(id), id);
  assert.ok(bare.html.includes('id="trade"') && bare.html.includes('id="ct-f"'), "трейд-ин и «Перезвоним» есть всегда");
  assert.ok(!bare.html.includes("tel:"), "нет телефона — нет звонка");
});

test("автосалон: нейтральные фото ниши, админка SAMIST и допы из их плана", () => {
  assert.ok(instantReady("avtosalon"));
  for (const photo of AVTOSALON_PHOTOS) {
    assert.ok(existsSync(`public${photo}`), photo);
    assert.ok(existsSync(`public${photo.replace("-1200", "-900")}`), photo);
  }
  assert.ok(hasAdmin("avtosalon"));
  for (const locale of ["ru", "uz"] as const) {
    const a = buildInstant({ ...AVTO, locale }, SEED).pages.admin!;
    assert.ok(a.includes(`/${locale}/mockup-terms`) && a.includes('id="pn-data"') && a.includes("Мотор Сити"));
    assert.ok(a.includes("'as-req-1'"), "ключи — как у сайта: заявка с макета приходит в админку");
    assert.ok(!/\[\[t:\d+\]\]/.test(a) && !/<script[^>]+src=/.test(a));
    assert.deepEqual(tailsIn(a), []);
  }
  const ids = offerAddons("avtosalon").map((a) => a.id);
  assert.ok(ids.length >= 4 && ids.every((id) => id.startsWith("samist-")), ids.join(", "));
});
