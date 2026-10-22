#!/usr/bin/env node
//
// Claude против Qwen на одних разговорах и одних проверках (lib/llm/compare.ts).
//
// Запускается там же, где замер моделей, — на сервере с ключами, по кнопке
// «Сравнение Claude и Qwen» (.github/workflows/llm-compare.yml), или руками:
//
//   cd /opt/devuz && set -a && . .env && set +a
//   node --import ./tests/alias-hook.mjs scripts/llm-compare.mjs [набор] [повторов] [модели]
//
// набор — all, talk (наша переписка до макета) или saas (ИИ-менеджер
// клиента); повторов — сколько раз прогнать каждый разговор (модель
// отвечает по-разному, один прогон — не цифра); модели — Claude через
// запятую, тогда меряются они друг против друга, без Qwen. Qwen берётся из QWEN_BASE_URL,
// QWEN_MODEL, QWEN_API_KEY, QWEN_EXTRA (.env или хранилище). В базу не пишет,
// разговоры выдуманные: в публичный журнал задачи не попадает ничего чужого.
//
// Стоит денег: печатает, сколько потратил каждый.

import Anthropic from "@anthropic-ai/sdk";

import { modelFor, usageCostUsd } from "@/lib/ai-staff/plans";
import { SAAS_CASES, TALK_CASES, runCase, summarize } from "@/lib/llm/compare";
import { qwenConfig, qwenFetch, qwenFor } from "@/lib/llm/route";
import { anthropic } from "@/lib/model-road";

const SET = process.argv[2] || process.env.COMPARE_SET || "all";
const REPEAT = Math.max(1, Math.min(5, Number(process.argv[3] || process.env.COMPARE_REPEAT || 1)));

const cases = [...(SET === "saas" ? [] : TALK_CASES), ...(SET === "talk" ? [] : SAAS_CASES)];

/** Цена за миллион токенов по имени модели — та же таблица, что у себестоимости в панели. */
function priceOf(model) {
  const row = { input_tokens: 1_000_000, output_tokens: 0, cache_write_tokens: 0, cache_read_tokens: 0, model };
  return {
    input: usageCostUsd([row]),
    output: usageCostUsd([{ ...row, input_tokens: 0, output_tokens: 1_000_000 }]),
  };
}

// Сторона Claude не должна сама уйти в Qwen по QWEN_SITES — иначе сравнение
// сравнит Qwen с Qwen.
const CLAUDE_SITE = "llm-compare-claude";
if (await qwenFor(CLAUDE_SITE)) {
  console.error(`QWEN_SITES забирает «${CLAUDE_SITE}» — уберите из списка, иначе сравнивать не с чем.`);
  process.exit(1);
}
const claude = anthropic(CLAUDE_SITE);
const providers = [
  {
    label: "Claude",
    call: (p) => claude.beta.messages.create(p),
    // Как в бою: переписка касаний — модель первички (Opus), кабинет — Sonnet.
    modelFor: (c) => (c.kind === "talk" ? process.env.ANTHROPIC_MODEL || "claude-opus-5" : modelFor("standard")),
  },
];
// Claude против Claude: «claude-haiku-4-5,claude-sonnet-5» — каждая модель
// отвечает на все разговоры сама (владелец, 22.10.2026: «пока оставим haiku
// или sonnet», Qwen — на своём компьютере позже). Пусто — как в бою.
const MODELS = (process.argv[4] || process.env.COMPARE_MODELS || "")
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);
if (MODELS.length) {
  providers.length = 0;
  for (const model of MODELS) providers.push({ label: model, call: (p) => claude.beta.messages.create(p), modelFor: () => model });
}
const qwen = MODELS.length ? null : await qwenConfig();
if (qwen) {
  const client = new Anthropic({ apiKey: "qwen", fetch: qwenFetch(qwen) });
  providers.push({ label: `Qwen (${qwen.model})`, call: (p) => client.beta.messages.create(p), modelFor: () => qwen.model });
} else {
  console.log("Qwen не настроен (нет QWEN_BASE_URL или QWEN_MODEL) — меряю только Claude.\n");
}

const pct = (a, b) => (b ? `${Math.round((a / b) * 100)}%` : "—");
const summaries = [];
for (const provider of providers) {
  const results = [];
  for (let round = 0; round < REPEAT; round++) {
    for (const c of cases) {
      const r = await runCase(c, provider.call, provider.modelFor(c));
      results.push(r);
      const mark = r.problems.length ? `✗ ${r.problems.join(",")}` : "✓";
      console.log(`[${provider.label}] ${mark} ${r.id}${r.objection ? ` (${r.objection})` : ""} · ${r.ms} мс\n   ${(r.error ?? r.reply).replace(/\s+/g, " ").slice(0, 300)}`);
    }
  }
  // Себестоимость считается по модели каждого ответа: у Claude их две.
  const cost = results.reduce((s, r) => {
    const p = priceOf(r.model);
    return s + (r.input * p.input + r.output * p.output) / 1_000_000;
  }, 0);
  summaries.push({ ...summarize(provider.label, results, { input: 0, output: 0 }), costUsd: cost });
}

console.log("\n══════ Итог ══════");
const groups = [...new Set(summaries.flatMap((s) => Object.keys(s.byGroup)))].sort();
console.log(`| | ${summaries.map((s) => s.label).join(" | ")} |`);
console.log(`|---|${summaries.map(() => "---").join("|")}|`);
console.log(`| Прошло проверку | ${summaries.map((s) => `${s.passed}/${s.cases} (${pct(s.passed, s.cases)})`).join(" | ")} |`);
for (const g of groups) {
  console.log(`| ${g} | ${summaries.map((s) => (s.byGroup[g] ? `${s.byGroup[g].passed}/${s.byGroup[g].cases}` : "—")).join(" | ")} |`);
}
const codes = [...new Set(summaries.flatMap((s) => Object.keys(s.byProblem)))].sort();
for (const code of codes) console.log(`| ✗ ${code} | ${summaries.map((s) => s.byProblem[code] ?? 0).join(" | ")} |`);
console.log(`| Медиана ответа | ${summaries.map((s) => `${(s.medianMs / 1000).toFixed(1)} с`).join(" | ")} |`);
console.log(`| Токены вход / выход | ${summaries.map((s) => `${s.input} / ${s.output}`).join(" | ")} |`);
console.log(`| Потрачено | ${summaries.map((s) => `$${s.costUsd.toFixed(3)}`).join(" | ")} |`);
console.log(`| На один ответ | ${summaries.map((s) => `$${(s.costUsd / Math.max(1, s.cases)).toFixed(4)}`).join(" | ")} |`);
console.log("\nУзбекский читать глазами: проверка ловит кириллицу и чужой язык, а не грамматику.");
