#!/usr/bin/env node
//
// Замер: во сколько обходится каждая модель на наших же задачах.
//
// Запускается на сервере, где живёт ключ:
//
//   cd /opt/devuz && set -a && . .env && set +a
//   SCOUT_MODEL=claude-haiku-4-5 ANTHROPIC_MODEL=claude-haiku-4-5 \
//     node --import ./tests/alias-hook.mjs scripts/model-bench.mjs
//
// Одна модель за запуск — намеренно: и скаут, и письма читают модель из
// окружения при загрузке модуля, и подмена на лету мерила бы не то, что
// работает в бою.
//
// В базу не пишет ничего. Читает настоящие сигналы и касания, потому что
// замер на выдуманных данных отвечает на выдуманный вопрос.

import { classify } from "@/lib/scout/classify";
import {
  OUTREACH_SYSTEM,
  OUTREACH_TOOL,
  messageProblems,
  outreachHooks,
  outreachPrompt,
} from "@/lib/admin/outreach";
import { effortFor } from "@/lib/model-limits";
import { serviceClient } from "@/lib/supabase";

const MODEL = process.env.SCOUT_MODEL || process.env.ANTHROPIC_MODEL || "claude-opus-5";
const SAMPLES = Number(process.env.BENCH_SAMPLES || 20);
const LETTERS = Number(process.env.BENCH_LETTERS || 3);

/** Цены за миллион токенов, доллары. Правятся здесь, а не в трёх местах. */
const PRICE = {
  "claude-opus-5": { in: 5, out: 25, cacheRead: 0.5, cacheWrite: 6.25 },
  "claude-sonnet-5": { in: 2, out: 10, cacheRead: 0.2, cacheWrite: 2.5 },
  "claude-haiku-4-5": { in: 1, out: 5, cacheRead: 0.1, cacheWrite: 1.25 },
};

/**
 * Учёт токенов — обёрткой вокруг fetch, а не правкой рабочего кода.
 *
 * Считать то, что посылает сам код, — единственный способ не соврать:
 * промпт, кэш и повторные попытки учитываются ровно так, как в бою.
 */
const usage = { calls: 0, input: 0, output: 0, cacheRead: 0, cacheWrite: 0, ms: [] };
const realFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = typeof input === "string" ? input : input?.url ?? "";
  const started = Date.now();
  const response = await realFetch(input, init);
  if (!url.includes("api.anthropic.com")) return response;

  usage.ms.push(Date.now() - started);
  const copy = response.clone();
  try {
    const body = await copy.json();
    const u = body?.usage ?? {};
    usage.calls += 1;
    usage.input += u.input_tokens ?? 0;
    usage.output += u.output_tokens ?? 0;
    usage.cacheRead += u.cache_read_input_tokens ?? 0;
    usage.cacheWrite += u.cache_creation_input_tokens ?? 0;
  } catch {
    // Потоковый или битый ответ: замер не должен ронять прогон.
  }
  return response;
};

const cost = () => {
  const p = PRICE[MODEL] ?? PRICE["claude-opus-5"];
  return (
    (usage.input * p.in + usage.output * p.out + usage.cacheRead * p.cacheRead + usage.cacheWrite * p.cacheWrite) /
    1_000_000
  );
};

const median = (xs) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

const snapshot = () => ({ ...usage, ms: [...usage.ms] });
const since = (before) => ({
  calls: usage.calls - before.calls,
  input: usage.input - before.input,
  output: usage.output - before.output,
  cacheRead: usage.cacheRead - before.cacheRead,
  cacheWrite: usage.cacheWrite - before.cacheWrite,
  ms: usage.ms.slice(before.ms.length),
});

const priceOf = (part) => {
  const p = PRICE[MODEL] ?? PRICE["claude-opus-5"];
  return (part.input * p.in + part.output * p.out + part.cacheRead * p.cacheRead + part.cacheWrite * p.cacheWrite) / 1_000_000;
};

/**
 * Ложные срабатывания мерить не на чем: в базе лежит только то, что модель
 * пропустила. Поэтому десять сообщений, которые заказом не являются, —
 * вручную, из тех же чатов по смыслу. Дешёвая модель, объявившая заказом
 * вакансию, обошлась бы дороже пропущенного лида: за ней ходит человек.
 */
const NEGATIVES = [
  "Ищу работу фронтендером, React, 3 года опыта, резюме в личке",
  "Кто-нибудь пробовал Next.js 15 в проде? Как вам app router",
  "Продаю курс по таргету, 12 уроков, старт в понедельник",
  "В штат нужен PHP-разработчик, офис в Ташкенте, оклад от 12 млн",
  "Делаю сайты под ключ, портфолио в закрепе, пишите в лс",
  "Подскажите хостинг для небольшого магазина, чтобы недорого",
  "Наша компания открыла новый филиал на Чиланзаре, ждём гостей",
  "Кто знает, где починить макбук в Ташкенте?",
  "Ребята, всем привет! Как дела с заказами в этом сезоне?",
  "Ищу партнёра по маркетингу, у нас агентство наружной рекламы",
];

/**
 * Настоящие заявки — набором, а не из базы.
 *
 * Первый прогон брал сигналы, сохранённые скаутом в бою, и все три модели
 * оценили их в ноль. Это не поломка замера: те сигналы пришли из чата про
 * релокацию, и нынешний промпт отбивает их правильно — до нас из них не
 * дошёл никто. Мерить отбор по набору, который сам себя заявкой не
 * признаёт, нельзя, поэтому ниже десять сообщений, ради которых скаут и
 * работает: человек называет задачу и ищет, кому её отдать.
 */
const POSITIVES = [
  "Нужен сайт для стоматологии в Ташкенте с онлайн-записью. Кто делает, напишите цену и сроки",
  "Ищу разработчика на интернет-магазин на узбекском: оплата Payme, доставка по городу",
  "Кому заказать мобильное приложение для доставки еды? Бюджет до 8000$",
  "Нужен бот в телеграме для приёма заказов, чтобы заявки падали в таблицу. Кто возьмётся?",
  "Посоветуйте студию, которая сделает сайт-каталог стройматериалов с ценами",
  "У нас агентство, перегруз по заказам — ищем субподрядчика на вёрстку и бэкенд, работы много",
  "Kompaniyamiz uchun sayt kerak, kim qiladi? Narxi va muddati qancha?",
  "Нужна автоматизация склада, в таблицах уже путаемся. Ищем, кто сделает",
  "Ищем команду на доработку CRM, ТЗ и бюджет есть, начать хотим в октябре",
  "Сколько стоит лендинг с интеграцией с телеграмом и онлайн-оплатой?",
];

async function scoutTask() {
  const batch = [
    ...POSITIVES.map((text, i) => ({ key: `p${i}`, text, chatTitle: "IT Ташкент" })),
    ...NEGATIVES.map((text, i) => ({ key: `n${i}`, text, chatTitle: "Бизнес Узбекистан" })),
  ];

  const before = snapshot();
  const started = Date.now();
  const verdicts = [];
  for (let i = 0; i < batch.length; i += 20) {
    verdicts.push(...(await classify(batch.slice(i, i + 20))));
  }
  const took = Date.now() - started;

  const MIN = Number(process.env.SCOUT_MIN_SCORE) || 55;
  const said = new Map(verdicts.map((v) => [v.key, v.score]));
  const kept = (key) => (said.get(key) ?? 0) >= MIN;

  if (process.env.BENCH_DEBUG === "1") {
    console.error(`вердиктов вернулось: ${verdicts.length} из ${batch.length}, порог ${MIN}`);
    for (const v of verdicts.slice(0, 4)) console.error(`  ${v.key} → ${v.score} (${v.category})`);
  }

  return {
    задача: "скаут: отбор сигналов",
    модель: MODEL,
    "заявок в наборе": POSITIVES.length,
    "из них поймал": POSITIVES.filter((_, i) => kept(`p${i}`)).length,
    "не заявок в наборе": NEGATIVES.length,
    "из них принял за заявку": NEGATIVES.filter((_, i) => kept(`n${i}`)).length,
    // Ответ, потерявший часть пачки, — это молча потерянные сообщения:
    // буфер их уже отдал и обратно не вернёт.
    "вердиктов вернулось": `${verdicts.length} из ${batch.length}`,
    ...money(since(before), took),
  };
}

async function letterTask() {
  const db = serviceClient();
  if (!db) throw new Error("нет доступа к базе");

  const { data } = await db
    .from("prospects")
    .select("host, label, niche, findings, walked, draft, message")
    .not("message", "is", null)
    .order("created_at", { ascending: false })
    .limit(LETTERS);

  const rows = (data ?? []).filter((r) => Array.isArray(r.findings) && r.findings.length);
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic();

  const before = snapshot();
  const started = Date.now();
  let problems = 0;
  let clean = 0;
  let baselineProblems = 0;

  for (const row of rows) {
    const prompt = outreachPrompt({
      host: row.host,
      label: row.label,
      niche: row.niche,
      findings: row.findings,
      draft: row.draft,
      sender: "Александр",
      walked: row.walked,
      lang: row.walked?.lang ?? "ru",
    });
    const hooks = outreachHooks(row.findings, null);

    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: [{ type: "text", text: OUTREACH_SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: prompt }],
      tools: [OUTREACH_TOOL],
      tool_choice: { type: "tool", name: OUTREACH_TOOL.name },
      ...effortFor(MODEL, "medium"),
    });
    const block = response.content.find((b) => b.type === "tool_use");
    const text = block?.input?.message ?? "";

    const found = messageProblems(String(text), prompt, row.host, hooks);
    problems += found.length;
    if (!found.length) clean += 1;

    // Письмо, которое написал Опус в бою, — той же проверкой. Без этой
    // строки «две претензии» не с чем сравнить.
    baselineProblems += messageProblems(String(row.message ?? ""), prompt, row.host, hooks).length;
  }

  const took = Date.now() - started;
  return {
    задача: "касание: первое письмо",
    модель: MODEL,
    писем: rows.length,
    "без претензий проверки": clean,
    "претензий всего": problems,
    "претензий у боевых писем (Опус)": baselineProblems,
    ...money(since(before), took),
  };
}

function money(part, took) {
  return {
    вызовов: part.calls,
    "токенов на вход": part.input + part.cacheRead + part.cacheWrite,
    "токенов на выход": part.output,
    "цена, $": Number(priceOf(part).toFixed(4)),
    "медиана ответа, с": Number((median(part.ms) / 1000).toFixed(1)),
    "всего, с": Number((took / 1000).toFixed(1)),
  };
}

const task = process.env.BENCH_TASK || "all";
const out = [];
if (task === "all" || task === "scout") out.push(await scoutTask());
if (task === "all" || task === "letter") out.push(await letterTask());

for (const row of out) console.log(JSON.stringify(row));
console.log(JSON.stringify({ итог: MODEL, "всего вызовов": usage.calls, "всего, $": Number(cost().toFixed(4)) }));
