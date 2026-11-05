import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { cabinetCopy } from "@/content/partner-cabinet";
import { deckCopy } from "@/content/partner-decks";
import { getDictionary } from "@/content/dictionaries";
import { partnerCopy } from "@/content/partner-bot";
import { locales } from "@/lib/i18n";
import {
  CHOOSABLE_MODELS,
  CLIENT_CLAIMS,
  NEW_MODEL,
  PARTNER_AGENCIES,
  POOL,
  PROFIT_MODEL,
  withPool,
  type PartnerProject,
} from "@/lib/partners/rules";

/**
 * Партнёрка проще — шаг 2. Владелец, 05.11.2026, на разбор «как мы поймём,
 * что клиент от этого блогера… не хочу делать супер сложную систему»:
 * «Одну ссылку нет, но остальное да, делаем». Остаётся одна модель — с
 * оборота (процент с суммы договора); копилки, закрепления клиентов по ИНН и
 * агентств партнёра в кабинете нет. Данные не удаляются: флаги в rules.ts.
 */

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("одна модель — с оборота; копилки, закреплений и агентств партнёра нет", () => {
  assert.equal(PROFIT_MODEL, false);
  assert.equal(POOL, false);
  assert.equal(CLIENT_CLAIMS, false);
  assert.equal(PARTNER_AGENCIES, false);
  assert.equal(NEW_MODEL, "turnover");
  assert.deepEqual([...CHOOSABLE_MODELS], ["turnover"]);
});

test("копилка выключена: включённый тумблер ставку не поднимает", () => {
  // Расчёт копилки остаётся (applyPool, держат tests/partner-pool.test.ts) —
  // на случай, если владелец её вернёт; в деньги он не идёт.
  const p = (id: string, amount: number): PartnerProject => ({
    id,
    owner_staff_id: null,
    kind: "new",
    amount_usd: amount,
    tax_percent: 0,
    dev_cost_usd: 0,
    stage: "work",
    partner_id: "a",
    partner_percent: null,
    partner_void_reason: null,
    partner_model: "turnover",
  });
  const lines = [
    { project_id: "x", percent: 6, amount_usd: 120, frozen: false, model: "turnover" as const },
    { project_id: "y", percent: 6, amount_usd: 120, frozen: false, model: "turnover" as const },
  ];
  const out = withPool(lines as never, [p("x", 2_000), p("y", 2_000)], { percent_override: null, accumulate: true });
  assert.deepEqual(out, lines);
  assert.match(read("lib/partners/rules.ts"), /return POOL \? applyPool\(accruals, projects, partner\) : accruals;/);
});

test("сервер не даёт вернуть «от прибыли», копилку, ИНН и агентство в обход кабинета", () => {
  const store = read("lib/partners/store.ts");
  const body = (name: string) => {
    const at = store.indexOf(`export async function ${name}(`);
    assert.ok(at > 0, name);
    return store.slice(at, store.indexOf("export async function", at + 10));
  };
  assert.match(body("setPayoutModel"), /if \(!CHOOSABLE_MODELS\.includes\(model\)\) return \{ ok: false, reason: "invalid" \};/);
  assert.match(body("setAccumulate"), /if \(!POOL && on\) return false;/);
  assert.match(body("requestAgency"), /if \(!PARTNER_AGENCIES\) return \{ ok: false, reason: "failed" \};/);
  assert.match(body("requestClient"), /if \(!CLIENT_CLAIMS\) return \{ ok: false, reason: "failed" \};/);
  assert.match(store, /accumulate: POOL && row\.accumulate === true/);
  assert.match(store, /payout_model: NEW_MODEL/);

  const sql = read("supabase/migrations/0179_partner_turnover_only.sql");
  assert.match(sql, /set partner_model = 'profit'\s+where partner_id is not null\s+and partner_model is null/, "деньги по идущему проекту поменяются");
  assert.match(sql, /insert into public\.partner_model_changes/);
  assert.match(sql, /alter column payout_model set default 'turnover'/);
});

test("кабинет, панель и карточка лида прячут выключенное, старое остаётся видно", () => {
  const view = read("components/partners/cabinet-view.tsx");
  assert.match(view, /CHOOSABLE_MODELS\.includes\(m\) \|\| m === partner\.payout_model/);
  assert.match(view, /POOL && partner\.percent_override === null/);
  assert.match(view, /PARTNER_AGENCIES \|\| agencies\.length/);
  assert.match(view, /CLIENT_CLAIMS \|\| clients\.length/);
  const admin = read("app/admin/partners/page.tsx");
  assert.match(admin, /PARTNER_AGENCIES \|\| agencies\.length \?/);
  assert.match(admin, /CLIENT_CLAIMS \|\| clients\.length \?/);
  assert.match(read("app/admin/leads/[id]/page.tsx"), /CLIENT_CLAIMS \|\| lead\.client_inn \?/);
});

test("нигде клиенту и партнёру не обещаем «от прибыли»", () => {
  const PROFIT = /прибыл|прибут|net profit|of profit|foydadan|sof foyda|利润|zysk/i;
  for (const locale of locales) {
    const page = getDictionary(locale).partners;
    assert.doesNotMatch(JSON.stringify(page), PROFIT, `${locale}: страница «Зарабатывай с нами»`);
    const program = deckCopy(locale).program;
    for (const key of ["modelsTitle", "modelsNote", "exampleLead", "exampleNote", "gradesLead"] as const) {
      assert.doesNotMatch(program[key], PROFIT, `${locale}: презентация, ${key}`);
    }
    assert.doesNotMatch(program.gradesNote(26), PROFIT, `${locale}: потолок`);
    assert.doesNotMatch(program.agencyText(15), /кабинет|dashboard|kabinet|后台|panel/i, `${locale}: агентство подключают в кабинете`);
    assert.doesNotMatch(cabinetCopy(locale).modelHints.turnover, /ниже|lower|pastroq|较低|нижч|Niższy/i, `${locale}: «ниже, чем от прибыли»`);
  }
  for (const lang of ["ru", "en", "uk", "pl"] as const) {
    const intro = partnerCopy(lang).intro("https://devuz.studio/?ref=AZIZ", "https://t.me/x?start=ref-AZIZ", "AZIZ");
    assert.doesNotMatch(intro, PROFIT, `${lang}: бот в приветствии предлагает «от прибыли»`);
  }
  assert.doesNotMatch(read("app/[locale]/partners/page.tsx"), /colProfit|tier\.profit/);
  assert.doesNotMatch(read("app/[locale]/partners/deck/program/page.tsx"), /colProfit|tier\.profit|gradeCap\("profit"\)/);
  for (const doc of ["kp/partner-kp.html", "kp/partner-grades.html"]) {
    assert.doesNotMatch(read(doc), /<th class="num">От прибыли<\/th>/, `${doc}: столбец «от прибыли»`);
  }
});
