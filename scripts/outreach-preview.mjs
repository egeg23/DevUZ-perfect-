#!/usr/bin/env node
/**
 * Первое касание целиком, от адреса до готового письма.
 *
 *   node --import ./tests/alias-hook.mjs scripts/outreach-preview.mjs https://site.uz/ Александр
 *
 * Нужен потому, что описание работы и работа — разные вещи. Владелец смотрит
 * на панель и видит прежний текст; ответить на это можно только одним —
 * показать письмо, которое выйдет на самом деле, со всеми проверками.
 *
 * Тот же путь, что у кнопки «Связаться»: аудит, промпт, модель, вторая
 * попытка, если крючки не прозвучали, и машинная проверка в конце. Ничего не
 * имитируется — при `--dry` модель не зовётся, и видно только промпт.
 */
import Anthropic from "@anthropic-ai/sdk";
import { auditOne, toProspectRow } from "@/lib/audit/batch";
import { OUTREACH_SYSTEM, OUTREACH_TOOL, messageProblems, outreachHooks, outreachPrompt } from "@/lib/admin/outreach";
import { seoReport } from "@/lib/audit/seo";

const url = process.argv[2];
const sender = process.argv[3] ?? "Александр";
const row = toProspectRow(await auditOne({ raw: url, url, label: null, problem: null }));
const host = new URL(url).hostname.replace(/^www\./, "");
const seo = seoReport({ findings: row.findings });
const hooks = outreachHooks(row.findings);

const prompt = outreachPrompt({ host, label: row.label, niche: null, findings: row.findings, draft: null, sender });

const write = async (notes) => {
  const r = await new Anthropic().beta.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-opus-5",
    max_tokens: 1024,
    system: [{ type: "text", text: OUTREACH_SYSTEM, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: notes ? `${prompt}\n\nПредыдущая попытка не прошла проверку: ${notes}\nНапиши заново, исправив это.` : prompt }],
    tools: [OUTREACH_TOOL],
    tool_choice: { type: "tool", name: OUTREACH_TOOL.name },
    output_config: { effort: "medium" },
  });
  const b = r.content.find((x) => x.type === "tool_use");
  return b?.input?.message?.trim() ?? null;
};

if (process.argv.includes("--dry")) {
  console.log(prompt);
  process.exit(0);
}

let msg = await write(null);
let problems = messageProblems(msg, prompt, host, hooks);
const retried = problems.length > 0;
if (retried) msg = (await write(problems.map((p) => p.text).join(" "))) ?? msg;
problems = messageProblems(msg, prompt, host, hooks);

console.log("═".repeat(72));
console.log(`${host}   поиск ${seo.measured ? seo.score : "—"}/100   теряется ${hooks.lost ? `${hooks.lost[0]}–${hooks.lost[1]}` : "—"} из 100`);
console.log(`показываем: ${seo.shown.map((p) => p.title).join(" · ") || "—"}${seo.hidden ? `   (+${seo.hidden} на разбор)` : ""}`);
console.log("═".repeat(72));
console.log(msg);
console.log("─".repeat(72));
console.log(retried ? "модель переписала со второй попытки" : "прошло с первой");
console.log(problems.length ? `НЕ ПРОЙДЕНО: ${problems.map((p) => p.code).join(", ")}` : "проверка чистая — можно отправлять");
