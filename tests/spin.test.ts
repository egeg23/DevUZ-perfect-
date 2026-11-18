/**
 * SPIN в касаниях — вопросы по ступеням, половина разговоров ИИ, кнопки
 * менеджера.
 *
 * Владелец, 18.11.2026: «Есть методология продаж spin - внедри ее в наши
 * касания».
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { jargonWords } from "@/lib/admin/outreach";
import { talkNote } from "@/lib/admin/outreach-talk";
import { CIRCLE_NICHES } from "@/lib/admin/sales-after-reply";
import {
  SPIN,
  SPIN_MIN,
  SPIN_STAGES,
  spinHalf,
  spinNote,
  spinOn,
  spinQuestion,
  spinStep,
  spinVerdict,
} from "@/lib/admin/spin";
import { leadCardDict } from "@/content/admin-panel/lead-card";
import { aiMarkers, LONG_DASH, SPACED_HYPHEN } from "@/lib/proto/plain-text";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("вопросы SPIN — словами покупателя, без жаргона, тире, штампов и чисел; узбекские латиницей", () => {
  for (const niche of CIRCLE_NICHES) {
    for (const hasSite of [true, false]) {
      for (const lang of ["ru", "uz"] as const) {
        for (const stage of SPIN_STAGES) {
          const q = spinQuestion(stage, { lang, niche, hasSite });
          assert.ok(q.endsWith("?"), `${niche}/${stage}/${lang}: не вопрос: ${q}`);
          assert.deepEqual(jargonWords(q), [], `жаргон: ${q}`);
          assert.ok(!LONG_DASH.test(q) && !SPACED_HYPHEN.test(q), `тире: ${q}`);
          assert.deepEqual(aiMarkers(q), [], `штамп: ${q}`);
          assert.ok(!/\d/.test(q), `число в вопросе: ${q}`);
          assert.ok(q.length <= 200, `длинно: ${q}`);
          if (lang === "uz") assert.ok(!/[А-Яа-яЁё]/.test(q), `кириллица в узбекском: ${q}`);
        }
      }
    }
  }
  // Ниша меняет слова: у стоматологии — пациенты, у ресторана — гости.
  assert.match(spinQuestion("situation", { lang: "ru", niche: "stomatologiya", hasSite: true }), /пациенты/);
  assert.match(spinQuestion("situation", { lang: "ru", niche: "restoran", hasSite: true }), /гости/);
  // Без сайта не спрашиваем про сайт.
  assert.doesNotMatch(spinQuestion("problem", { lang: "ru", niche: "general", hasSite: false }), /сайт/);
});

test("ступени по порядку: ситуация, проблема, последствия, польза, дальше только «+»", () => {
  assert.deepEqual([0, 1, 2, 3, 4, 9].map(spinStep), ["situation", "problem", "implication", "need", "offer", "offer"]);
  assert.equal(spinStep(-1), "situation");
});

test("половина A/B — по номеру касания: стабильно и примерно поровну", () => {
  const ids = Array.from({ length: 2000 }, (_, i) => `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`);
  const on = ids.filter(spinHalf).length;
  assert.ok(on > 850 && on < 1150, `перекос: ${on} из 2000`);
  for (const id of ids.slice(0, 50)) assert.equal(spinHalf(id), spinHalf(id));
  assert.equal(spinOn(ids.find(spinHalf)!, false), false, "выключенный SPIN не включается половиной");
  assert.equal(SPIN, true);
});

test("заметка модели: со SPIN — ступень и пример вопроса, без SPIN — как было", () => {
  const base = {
    host: "clinic.uz",
    label: null,
    findings: [{ title: "Нет кнопки записи", impact: "пациенты уходят" }],
    firstMessage: "",
    managerName: "Дина",
    repliesSoFar: 2,
    untilMockup: true,
  };
  const plain = talkNote(base);
  assert.doesNotMatch(plain, /SPIN/);
  assert.match(plain, /Каждый ответ кончается одним шагом/);

  const ctx = { lang: "ru", niche: "stomatologiya", hasSite: true } as const;
  const spin = talkNote({ ...base, spin: ctx });
  assert.match(spin, /### Как вести разговор — SPIN/);
  assert.match(spin, /ступень «последствия»/);
  assert.ok(spin.includes(spinQuestion("implication", ctx)), "пример вопроса — из банка");
  assert.doesNotMatch(spin, /Каждый ответ кончается одним шагом:/);

  // Ступени пройдены — только «+».
  const done = spinNote({ repliesSoFar: 5, ctx, goal: "mockup" });
  assert.match(done, /вопросы позади/);
  assert.match(done, /отправьте «\+»/);

  // Касание менеджера (не до макета) — к созвону.
  const call = talkNote({ ...base, untilMockup: false, repliesSoFar: 3, spin: ctx });
  assert.match(call, /ступень «польза»/);
  assert.match(call, /созвона/);
});

test("переписка модели получает SPIN у половины касаний, на языке клиента и словами ниши", () => {
  const run = read("lib/admin/outreach-talk-run.ts");
  assert.match(run, /spin: spinOn\(inbound\.prospectId\)/);
  assert.ok(run.indexOf("const locale = talkLang(thread)") < run.indexOf("const note = talkNote("), "заметка — после языка");
});

test("кнопки «Вопросы SPIN» у менеджера — для всех, подписи на трёх языках", () => {
  const store = read("lib/admin/outreach-talk-store.ts");
  assert.match(store, /for \(const stage of SPIN_STAGES\) quick\.push\(\{ kind: `spin_\$\{stage\}`/);
  for (const stage of SPIN_STAGES) {
    const label = (leadCardDict as unknown as Record<string, { ru: string; uz: string; pl: string }>)[`quick_spin_${stage}`];
    assert.ok(label?.ru && label.uz && label.pl, `нет подписи quick_spin_${stage}`);
  }
  assert.match(read("components/admin/lead-timeline.tsx"), /data-spin-questions/);
});

test("A/B «SPIN в переписке»: рано до 30 разговоров на половину, потом по доле «+»", () => {
  const c = (spin: boolean, talks: number, plus: number) => ({ spin, talks, plus, mockup: 0 });
  assert.deepEqual(spinVerdict(c(true, 10, 5), c(false, 40, 1)), { kind: "early", need: SPIN_MIN - 10 });
  const lead = spinVerdict(c(true, 60, 20), c(false, 60, 4));
  assert.equal(lead.kind, "leader");
  assert.equal(lead.kind === "leader" && lead.spin, true);
  assert.deepEqual(spinVerdict(c(true, 60, 6), c(false, 60, 6)), { kind: "even" });
  assert.match(read("app/admin/prospect/texts/page.tsx"), /id="spin-ab"/);
});
