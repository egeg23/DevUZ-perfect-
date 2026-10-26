/**
 * Sonnet 5.5 и принудительный инструмент.
 *
 * Владелец, 26.10.2026: «Переключи модель на sonnet 5.5, там где она у нас
 * используется в проекте». Sonnet 5.5 на `tool_choice` «tool» и «any»
 * отвечает 400, а так зовут почти все узлы на Соннете: письма касаний,
 * отбор скаута, разборы, подсказки менеджеру, разбор резюме. Без
 * переделки запроса переключение уронило бы их все разом — молча, строкой
 * «модель не вернула …» в логе.
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import Anthropic from "@anthropic-ai/sdk";

import { calledTool, nudgedBody, rejectsForcedTool, softenToolChoice } from "@/lib/model-limits";
import { softToolChoice } from "@/lib/model-road";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const TOOL = { name: "razbor", description: "Статья", input_schema: { type: "object", properties: { text: { type: "string" } } } };

test("принуждение снимается только у моделей, которые его не принимают", () => {
  for (const model of ["claude-sonnet-5-5", "anthropic.claude-sonnet-5-5", "claude-opus-5-5", "claude-fable-5-1", "claude-mythos-5-1"]) {
    assert.equal(rejectsForcedTool(model), true, model);
  }
  for (const model of ["claude-sonnet-5", "claude-opus-5", "claude-haiku-4-5", "claude-haiku-4-5-20251001", "claude-fable-5", "qwen3-32b"]) {
    assert.equal(rejectsForcedTool(model), false, model);
  }

  const body = { model: "claude-sonnet-5", tool_choice: { type: "tool", name: "razbor" }, tools: [TOOL] };
  assert.equal(softenToolChoice(body), null, "Sonnet 5 принуждение принимает — запрос как есть");
  assert.equal(softenToolChoice({ model: "claude-sonnet-5-5", tools: [TOOL] }), null, "без принуждения — как есть");
  assert.equal(softenToolChoice({ model: "claude-sonnet-5-5", tool_choice: { type: "auto" } }), null);
});

test("«tool» → «auto», строка в системе, Sonnet 5.5 без размышлений", () => {
  const cached = { type: "text", text: "Ты пишешь разбор.", cache_control: { type: "ephemeral" } };
  const soft = softenToolChoice({
    model: "claude-sonnet-5-5",
    max_tokens: 100,
    system: [cached],
    tools: [TOOL],
    tool_choice: { type: "tool", name: "razbor" },
    messages: [{ role: "user", content: "Аудит" }],
  });
  assert.ok(soft);
  assert.deepEqual(soft.want, { name: "razbor" });
  assert.deepEqual(soft.body.tool_choice, { type: "auto" });
  const system = soft.body.system as Array<{ text: string }>;
  assert.equal(system[0], cached, "кэш системы не трогаем — строка встаёт после него");
  assert.match(system[1].text, /инструмента razbor/);
  // Принудительный вызов шёл без размышлений: под это считали max_tokens.
  assert.deepEqual(soft.body.thinking, { type: "between_tools" });

  // Строка-система и «any» тоже.
  const any = softenToolChoice({ model: "claude-sonnet-5-5", system: "Скаут", tool_choice: { type: "any", disable_parallel_tool_use: true } });
  assert.ok(any);
  assert.deepEqual(any.want, { name: null });
  assert.deepEqual(any.body.tool_choice, { type: "auto", disable_parallel_tool_use: true });
  assert.deepEqual((any.body.system as Array<{ text: string }>)[0], { type: "text", text: "Скаут" });

  // Свой thinking и xhigh — не трогаем: between_tools там 400.
  const own = softenToolChoice({ model: "claude-sonnet-5-5", thinking: { type: "adaptive" }, tool_choice: { type: "tool", name: "x" } });
  assert.deepEqual(own?.body.thinking, { type: "adaptive" });
  const deep = softenToolChoice({ model: "claude-sonnet-5-5", output_config: { effort: "xhigh" }, tool_choice: { type: "tool", name: "x" } });
  assert.equal(deep?.body.thinking, undefined);
  // between_tools есть только у Sonnet 5.5: Opus 5.5 ответил бы 400.
  const opus = softenToolChoice({ model: "claude-opus-5-5", tool_choice: { type: "tool", name: "x" } });
  assert.equal(opus?.body.thinking, undefined);
});

test("повтор с замечанием: ответ текстом в историю, чужой инструмент — нет", () => {
  const want = { name: "razbor" };
  assert.equal(calledTool({ content: [{ type: "text", text: "…" }, { type: "tool_use", name: "razbor" }] }, want), true);
  assert.equal(calledTool({ content: [{ type: "tool_use", name: "other" }] }, want), false);
  assert.equal(calledTool({ content: [{ type: "tool_use", name: "other" }] }, { name: null }), true);

  const body = { model: "claude-sonnet-5-5", messages: [{ role: "user", content: "Аудит" }] };
  const text = nudgedBody(body, { content: [{ type: "text", text: "Вот статья" }] }, want);
  const messages = text.messages as Array<{ role: string; content: unknown }>;
  assert.equal(messages.length, 3);
  assert.equal(messages[1].role, "assistant");
  assert.equal(messages[2].role, "user");
  assert.match(String(messages[2].content), /инструмента razbor/);

  // tool_use без tool_result — 400, пустой ответ — тоже: только замечание.
  assert.equal((nudgedBody(body, { content: [{ type: "tool_use", name: "other", id: "t", input: {} }] }, want).messages as unknown[]).length, 2);
  assert.equal((nudgedBody(body, { content: [] }, want).messages as unknown[]).length, 2);
});

type Call = { body: Record<string, unknown> };

function fakeModel(replies: Array<Record<string, unknown>>) {
  const calls: Call[] = [];
  const fetcher = async (_input: string | URL | Request, init: RequestInit = {}) => {
    calls.push({ body: JSON.parse(String(init.body)) });
    const reply = replies[Math.min(calls.length - 1, replies.length - 1)];
    return new Response(JSON.stringify(reply), {
      status: 200,
      headers: { "content-type": "application/json", "content-length": "999", "content-encoding": "gzip" },
    });
  };
  return { calls, fetcher };
}

const message = (content: unknown[], stop = "end_turn") => ({
  id: "m",
  type: "message",
  role: "assistant",
  model: "claude-sonnet-5-5",
  content,
  stop_reason: stop,
  stop_sequence: null,
  usage: { input_tokens: 1, output_tokens: 1 },
});

test("SDK как в бою: Sonnet 5.5 без 400, текстом — один повтор, вызов — сразу", async () => {
  const ask = (client: Anthropic) =>
    client.beta.messages.create({
      model: "claude-sonnet-5-5",
      max_tokens: 100,
      tools: [TOOL as unknown as Anthropic.Beta.BetaToolUnion],
      tool_choice: { type: "tool", name: "razbor" },
      messages: [{ role: "user", content: "Аудит" }],
    });

  const call = message([{ type: "tool_use", id: "t", name: "razbor", input: { text: "Статья" } }], "tool_use");
  const direct = fakeModel([call]);
  const ok = await ask(new Anthropic({ apiKey: "k", fetch: softToolChoice(direct.fetcher) }));
  assert.equal(direct.calls.length, 1);
  assert.deepEqual(direct.calls[0].body.tool_choice, { type: "auto" }, "принуждение до модели не дошло");
  assert.equal(ok.content[0].type, "tool_use", "ответ прочитан, хоть заголовки длины и сжатия от другого тела");

  const chatty = fakeModel([message([{ type: "text", text: "Сейчас напишу" }]), call]);
  const again = await ask(new Anthropic({ apiKey: "k", fetch: softToolChoice(chatty.fetcher) }));
  assert.equal(chatty.calls.length, 2, "ответил текстом — повтор");
  assert.equal((chatty.calls[1].body.messages as unknown[]).length, 3);
  assert.equal(again.content[0].type, "tool_use");

  const stubborn = fakeModel([message([{ type: "text", text: "Не буду" }])]);
  const last = await ask(new Anthropic({ apiKey: "k", fetch: softToolChoice(stubborn.fetcher) }));
  assert.equal(stubborn.calls.length, 2, "повтор один, не больше");
  assert.equal(last.content[0].type, "text", "узел сам решает, что делать без вызова");

  const refused = fakeModel([message([], "refusal")]);
  await ask(new Anthropic({ apiKey: "k", fetch: softToolChoice(refused.fetcher) }));
  assert.equal(refused.calls.length, 1, "отказ не повторяем");

  const old = fakeModel([call]);
  await new Anthropic({ apiKey: "k", fetch: softToolChoice(old.fetcher) }).beta.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 100,
    tools: [TOOL as unknown as Anthropic.Beta.BetaToolUnion],
    tool_choice: { type: "tool", name: "razbor" },
    messages: [{ role: "user", content: "Аудит" }],
  });
  assert.deepEqual(old.calls[0].body.tool_choice, { type: "tool", name: "razbor" }, "Sonnet 5 — как было");
});

test("узлы на Соннете — на Sonnet 5.5, и переделка стоит на общей дороге", () => {
  const nodes = [
    "lib/hiring/store.ts",
    "lib/admin/letter-translate.ts",
    "lib/admin/coach.ts",
    "lib/admin/outreach-store.ts",
    "lib/admin/outreach-followup.ts",
    "lib/proto/auto.ts",
    "lib/scout/classify.ts",
    "lib/scout/promote.ts",
    "lib/ai-staff/plans.ts",
    "lib/razbor/foreign-run.ts",
    "lib/razbor/shift-run.ts",
    "lib/razbor/tender-run.ts",
  ];
  for (const file of nodes) {
    const source = read(file);
    assert.match(source, /"claude-sonnet-5-5"/, `${file}: не Sonnet 5.5`);
    assert.doesNotMatch(source, /"claude-sonnet-5"/, `${file}: остался Sonnet 5`);
  }
  const road = read("lib/model-road.ts");
  assert.match(road, /softToolChoice\(once\)/, "клиент anthropic() без переделки запроса");
});
