#!/usr/bin/env node
// Одна команда, чтобы понять, где мы находимся. Без зависимостей: смена
// начинается до `npm install`, а иногда и вместо него.
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = dirname(fileURLToPath(import.meta.url));
const read = (f) => readFileSync(join(DIR, f), "utf8");

const s = JSON.parse(read("STATE.json"));
const { goalUsd, budgetUsd, startDate, endDate } = s.experiment;

// День считаем от даты старта, а не от количества смен: смен за день может
// быть несколько, а календарь у эксперимента один.
const DAY = 86_400_000;
const today = new Date(new Date().toISOString().slice(0, 10));
const day = Math.floor((today - new Date(startDate)) / DAY) + 1;
const left = Math.max(0, Math.floor((new Date(endDate) - today) / DAY));
const total = Math.round((new Date(endDate) - new Date(startDate)) / DAY) + 1;

// Реестр — источник истины по деньгам. Цифры в STATE.json могут отстать от
// него на одну незаписанную смену, поэтому сверяем и жалуемся при расхождении.
const rows = read("LEDGER.csv").trim().split("\n").slice(1).filter(Boolean)
  .map((line) => {
    const cells = line.match(/("([^"]|"")*"|[^,]*)/g).filter((_, i) => i % 2 === 0);
    const [date, direction, amountUsd, category, counterparty, note] = cells
      .map((c) => c.replace(/^"|"$/g, "").replace(/""/g, '"'));
    return { date, direction, amount: Number(amountUsd), category, counterparty, note };
  });

const sum = (pred) => rows.filter(pred).reduce((a, r) => a + r.amount, 0);
const spent = sum((r) => r.direction === "out");
const earned = sum((r) => r.direction === "in" && r.category !== "seed");
const bar = (v, max, w = 28) => {
  const n = Math.min(w, Math.round((Math.max(0, v) / max) * w));
  return "█".repeat(n) + "·".repeat(w - n);
};
const money = (v) => `$${v.toFixed(2)}`;

console.log(`\n  ЭКСПЕРИМЕНТ 300 → 2000     день ${day} из ${total}, осталось ${left}\n`);
console.log(`  Цель     ${bar(earned, goalUsd)}  ${money(earned)} / ${money(goalUsd)}`);
console.log(`  Бюджет   ${bar(budgetUsd - spent, budgetUsd)}  ${money(budgetUsd - spent)} осталось из ${money(budgetUsd)}`);

if (s.revenue.committedUsd > earned) {
  console.log(`\n  Обещано, но не получено: ${money(s.revenue.committedUsd - earned)}`);
}
for (const [k, v] of Object.entries({ spentUsd: spent, receivedUsd: earned })) {
  if (Math.abs(s.budget[k] ?? s.revenue[k] ?? 0) - Math.abs(v) > 0.005) {
    console.log(`  ! STATE.json.${k} разошёлся с реестром — доверять реестру`);
  }
}

console.log("\n  КАНАЛЫ");
for (const [name, c] of Object.entries(s.channels)) {
  const detail = Object.entries(c)
    .filter(([k, v]) => typeof v === "number" && v > 0)
    .map(([k, v]) => `${k}=${v}`).join(" ");
  console.log(`  · ${name.padEnd(9)} ${c.status.padEnd(12)} ${detail || "—"}`);
  if (c.blocker) console.log(`      упёрлось: ${c.blocker}`);
}

if (s.pipeline.length) {
  console.log("\n  ВОРОНКА");
  for (const p of s.pipeline) {
    console.log(`  · ${(p.company ?? "?").padEnd(24)} ${(p.stage ?? "?").padEnd(14)} ${p.valueUsd ? money(p.valueUsd) : ""}`);
  }
} else {
  console.log("\n  ВОРОНКА пуста");
}

const open = s.blockers?.filter((b) => !b.resolved) ?? [];
if (open.length) {
  console.log("\n  МЕШАЕТ");
  for (const b of open) console.log(`  · [${b.owner}] ${b.what}`);
}

if (s.nextActions?.length) {
  console.log("\n  ДАЛЬШЕ");
  s.nextActions.forEach((a, i) => console.log(`  ${i + 1}. ${a}`));
}

// Очередь человека протухает: если она висит непрочитанной, канал стоит.
try {
  const q = read("HUMAN_QUEUE.md");
  const pending = (q.match(/^- \[ \]/gm) ?? []).length;
  console.log(`\n  ОЧЕРЕДЬ ЧЕЛОВЕКА: ${pending} ${pending ? "— напомнить, если висит вторую смену" : "(пусто)"}`);
} catch { /* очереди ещё нет */ }

const entries = readdirSync(join(DIR, "journal")).filter((f) => f.endsWith(".md")).sort();
console.log(`  ЖУРНАЛ: ${entries.length ? `последняя запись ${entries.at(-1)}` : "пуст"}\n`);
