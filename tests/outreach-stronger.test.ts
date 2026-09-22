/**
 * Сильнее первое письмо и дожим.
 *
 * Разбор заглохших переписок: письма открывались технической мелочью
 * («ссылка без карточки»), модель обещала «подготовлю и пришлю» — и не
 * присылал никто, а промолчавшим второго сообщения не уходило вовсе.
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { OUTREACH_SYSTEM, leadFindings, outreachPrompt } from "@/lib/admin/outreach";
import {
  FOLLOWUP_SYSTEM,
  fallbackFollowup,
  followupDue,
  followupProblems,
  followupPrompt,
  followupWindow,
} from "@/lib/admin/outreach-followup";
import { talkNote } from "@/lib/admin/outreach-talk";
import type { Finding } from "@/lib/audit/checks";

const ROOT = new URL("../", import.meta.url);
const read = (file: string) => readFileSync(new URL(file, ROOT), "utf8");

const f = (code: string, title: string): Finding => ({
  code,
  severity: "major",
  title,
  impact: `из-за «${title}» клиенты уходят`,
  fix: "",
});

const og = f("no_og", "Ссылка пересылается без карточки");
const desc = f("no_description", "Нет описания страницы для поиска");
const prices = f("no_prices", "На сайте нет цен");
const mobile = f("no_viewport", "С телефона сайт открывается в масштабе монитора");

test("первыми — находки про клиентов и деньги, техническое — никогда", () => {
  assert.deepEqual(leadFindings([og, desc, prices, mobile]).map((x) => x.code), ["no_viewport", "no_prices"]);
  assert.deepEqual(leadFindings([og, desc]), []);
});

test("письмо открывается деньгами, а не превью ссылки", () => {
  const prompt = outreachPrompt({
    host: "gh.uz",
    label: "GH",
    niche: null,
    findings: [og, desc, prices],
    draft: null,
    sender: "Данил",
  });
  const at = (s: string) => prompt.indexOf(s);
  assert.ok(at(prices.title) > 0, "находки про цены нет в задании");
  assert.ok(at(prices.title) < at(og.title) || at(og.title) < 0, "техническое стоит раньше денег");
  assert.match(prompt, /про его клиентов и деньги: открывай письмо ими/);
  assert.match(OUTREACH_SYSTEM, /Открывай находкой про клиентов и деньги/);
  assert.match(OUTREACH_SYSTEM, /Не обещай ничего прислать позже/);
});

test("переписка: следующий шаг, без обещаний прислать, контакт того, кто решает", () => {
  const note = talkNote({
    host: "gh.uz",
    label: null,
    findings: [prices],
    firstMessage: "Здравствуйте…",
    managerName: "Данил",
    repliesSoFar: 1,
  });
  assert.match(note, /одним конкретным следующим шагом/);
  assert.match(note, /Не обещай ничего прислать/);
  assert.match(note, /прямой контакт того, кто решает/);
});

const sent = (patch: Partial<Parameters<typeof followupDue>[0]> = {}) => ({
  status: "sent",
  replied_at: null,
  ai_handling: true,
  sent_at: "2026-09-17T08:00:00Z",
  followups: 0,
  target_kind: "handle",
  last_followup_at: null,
  ...patch,
});
const day = (d: number) => new Date(Date.parse("2026-09-17T08:00:00Z") + d * 24 * 3600_000);

test("дожим: на третий день второе, на седьмой — третье, дальше тишина", () => {
  assert.equal(followupDue(sent(), day(2)), null);
  assert.equal(followupDue(sent(), day(3)), 1);
  assert.equal(followupDue(sent({ followups: 1, last_followup_at: day(3).toISOString() }), day(7)), 2);
  assert.equal(followupDue(sent({ followups: 2 }), day(20)), null, "третьего дожима нет");
});

test("дожим не шлётся ответившим, переданным человеку, ручным и давним", () => {
  assert.equal(followupDue(sent({ replied_at: day(1).toISOString() }), day(5)), null);
  assert.equal(followupDue(sent({ ai_handling: false }), day(5)), null);
  assert.equal(followupDue(sent({ target_kind: "manual" }), day(5)), null);
  assert.equal(followupDue(sent({ status: "manual" }), day(5)), null);
  assert.equal(followupDue(sent(), day(31)), null, "месячной давности — уже не дожим");
  // Давнее касание: первый дожим сегодня — второй не завтра, а через три дня.
  assert.equal(followupDue(sent({ followups: 1, last_followup_at: day(8).toISOString() }), day(9)), null);
  assert.equal(followupDue(sent({ followups: 1, last_followup_at: day(8).toISOString() }), day(11)), 2);
});

test("только в рабочее время по Ташкенту", () => {
  assert.equal(followupWindow(new Date("2026-09-23T06:00:00Z")), true, "среда 11:00");
  assert.equal(followupWindow(new Date("2026-09-23T03:00:00Z")), false, "среда 08:00");
  assert.equal(followupWindow(new Date("2026-09-23T13:00:00Z")), false, "среда 18:00");
  assert.equal(followupWindow(new Date("2026-09-26T06:00:00Z")), false, "суббота");
});

test("текст дожима проверяется, запасной — от «мы»", () => {
  const prompt = followupPrompt({ host: "gh.uz", label: null, firstMessage: "…58 из 100…", findings: [prices], n: 1, sender: "Мадина" });
  assert.deepEqual(followupProblems("Добрый день. На сайте нет цен, и первый вопрос клиента остаётся без ответа. Актуально для вас?", prompt), []);
  assert.ok(followupProblems("Коротко: теряете 73% клиентов. Актуально?", prompt).some((p) => p.startsWith("числа")));
  assert.ok(followupProblems("Добрый день! Актуально ли для вас, что сайт без цен теряет клиентов?", prompt).includes("восклицательный знак"));

  for (const n of [1, 2] as const) {
    const text = fallbackFollowup(n, "gh.uz", "Мадина");
    assert.ok(!/\bя\s+писал/i.test(text), "запасной текст в мужском роде от первого лица");
    assert.deepEqual(followupProblems(text, followupPrompt({ host: "gh.uz", label: null, firstMessage: "", findings: [], n, sender: "Мадина" })), []);
  }
  assert.match(FOLLOWUP_SYSTEM, /Не обещай ничего прислать/);
});

test("дожим ставится в очередь бота один раз и после ответа свипу", () => {
  const code = read("lib/admin/outreach-followup.ts");
  assert.match(code, /update\(\{ followups: n, last_followup_at: now\.toISOString\(\) \}\)[\s\S]{0,60}\.eq\("followups", n - 1\)/);
  assert.match(code, /status: "queued"/);
  assert.match(code, /!p\.target\) continue;/, "дожим без адреса повиснет в очереди");
  assert.match(read("app/api/reminders/sweep/route.ts"), /await runFollowups\(new Date\(\)\)/);
  assert.match(read("supabase/migrations/0052_outreach_followups.sql"), /add column if not exists followups smallint not null default 0/);
});
