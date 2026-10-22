/**
 * Слой моделей под Qwen: перевод запроса Claude в OpenAI-совместимый API и
 * обратно, выбор по меткам мест, сравнение на наших проверках.
 * docs/ai-staff/qwen.md.
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import Anthropic from "@anthropic-ai/sdk";

import { usageCostUsd } from "@/lib/ai-staff/plans";
import { commonProblems, runCase, summarize, TALK_CASES, SAAS_CASES, talkProblems } from "@/lib/llm/compare";
import { fromOpenAiResponse, toOpenAiRequest, withoutThinking } from "@/lib/llm/openai-compat";
import { qwenFor, qwenFetch, routesToQwen, type QwenConfig } from "@/lib/llm/route";

const config: QwenConfig = { baseUrl: "http://gpu:8000/v1", apiKey: "k", model: "qwen3-32b", extra: { chat_template_kwargs: { enable_thinking: false } } };

/** Поддельный провайдер: запоминает запрос, отвечает заданным сообщением. */
function fakeProvider(message: Record<string, unknown>, finish = "stop") {
  const seen: { url: string; body: Record<string, unknown>; auth: string | null }[] = [];
  const fetchImpl = async (url: string, init?: RequestInit) => {
    seen.push({ url, body: JSON.parse(String(init?.body)), auth: new Headers(init?.headers).get("authorization") });
    return new Response(
      JSON.stringify({ id: "c1", model: "qwen3-32b", choices: [{ message, finish_reason: finish }], usage: { prompt_tokens: 120, completion_tokens: 30 } }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  };
  return { seen, client: new Anthropic({ apiKey: "x", fetch: qwenFetch(config, fetchImpl) }) };
}

const TOOL = { name: "hand_off", description: "Передать заявку", input_schema: { type: "object", properties: { phone: { type: "string" } } } };

test("запрос Claude → OpenAI: система первым, инструменты, кэш и effort отброшены", () => {
  const body = toOpenAiRequest(
    {
      model: "claude-opus-5",
      max_tokens: 500,
      system: [{ type: "text", text: "Ты менеджер", cache_control: { type: "ephemeral" } }],
      tools: [TOOL, { type: "web_search_20250305", name: "web_search" }],
      output_config: { effort: "low" },
      messages: [
        { role: "user", content: "Цена?" },
        { role: "assistant", content: [{ type: "text", text: "Сейчас" }, { type: "tool_use", id: "t1", name: "hand_off", input: { phone: "1" } }] },
        { role: "user", content: [{ type: "tool_result", tool_use_id: "t1", content: "ok" }, { type: "text", text: "Спасибо" }] },
      ],
    },
    "qwen3-32b",
    config.extra,
  );
  assert.equal(body.model, "qwen3-32b");
  assert.equal(body.max_tokens, 500);
  assert.deepEqual((body.messages as unknown[])[0], { role: "system", content: "Ты менеджер" });
  const msgs = body.messages as Array<Record<string, unknown>>;
  assert.equal(msgs[2].role, "assistant");
  assert.equal((msgs[2].tool_calls as Array<{ function: { arguments: string } }>)[0].function.arguments, '{"phone":"1"}');
  assert.deepEqual(msgs[3], { role: "tool", tool_call_id: "t1", content: "ok" });
  assert.deepEqual(msgs[4], { role: "user", content: "Спасибо" });
  // Серверный инструмент Claude у Qwen не существует — не переводится.
  assert.equal((body.tools as unknown[]).length, 1);
  assert.equal("output_config" in body, false);
  assert.deepEqual(body.chat_template_kwargs, { enable_thinking: false });
});

test("ответ OpenAI → Claude: текст без рассуждения, инструмент, остановка, токены", () => {
  assert.equal(withoutThinking("<think>считаю</think>\nКухня от 4 500 000 сум"), "Кухня от 4 500 000 сум");
  const m = fromOpenAiResponse(
    {
      model: "qwen3-32b",
      choices: [{ finish_reason: "tool_calls", message: { content: "Передаю", tool_calls: [{ id: "c", function: { name: "hand_off", arguments: '{"phone":"+998"}' } }] } }],
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    },
    "qwen3-32b",
  );
  assert.equal(m.stop_reason, "tool_use");
  assert.deepEqual(m.content, [{ type: "text", text: "Передаю" }, { type: "tool_use", id: "c", name: "hand_off", input: { phone: "+998" } }]);
  assert.deepEqual(m.usage, { input_tokens: 10, output_tokens: 5, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 });
  // Сломанный JSON аргументов — пустой ввод, а не падение.
  const broken = fromOpenAiResponse({ choices: [{ message: { tool_calls: [{ function: { name: "x", arguments: "{" } }] } }] }, "q");
  assert.deepEqual((broken.content as Array<{ input: unknown }>)[0].input, {});
});

test("SDK Anthropic ходит в Qwen: create и stream, ключ Bearer, адрес /chat/completions", async () => {
  const { seen, client } = fakeProvider({ content: "Здравствуйте, кухня от 4 500 000 сум" });
  const res = await client.beta.messages.create({ model: "claude-sonnet-5", max_tokens: 100, messages: [{ role: "user", content: "Цена?" }] });
  assert.equal(seen[0].url, "http://gpu:8000/v1/chat/completions");
  assert.equal(seen[0].auth, "Bearer k");
  assert.equal(res.model, "qwen3-32b");
  assert.equal((res.content[0] as { text: string }).text, "Здравствуйте, кухня от 4 500 000 сум");
  assert.equal(res.usage.input_tokens, 120);

  // Чат на сайте и первичка ходят потоком с инструментом.
  const tooled = fakeProvider({ content: "", tool_calls: [{ id: "t", function: { name: "hand_off", arguments: '{"phone":"+998901112233"}' } }] }, "tool_calls");
  const stream = tooled.client.beta.messages.stream({ model: "claude-opus-5", max_tokens: 100, tools: [TOOL as never], messages: [{ role: "user", content: "+998901112233" }] });
  const final = await stream.finalMessage();
  assert.equal(final.stop_reason, "tool_use");
  assert.deepEqual((final.content[0] as { input: unknown }).input, { phone: "+998901112233" });
  assert.equal(final.usage.output_tokens, 30);
  assert.equal(tooled.seen[0].body.stream, false);
});

test("ошибка провайдера — ошибка SDK с кодом, а не тишина", async () => {
  const client = new Anthropic({
    apiKey: "x",
    maxRetries: 0,
    fetch: qwenFetch(config, async () => new Response("overloaded", { status: 503 })),
  });
  await assert.rejects(client.messages.create({ model: "m", max_tokens: 10, messages: [{ role: "user", content: "a" }] }), (e: unknown) => (e as { status?: number }).status === 503);
});

test("выбор модели: пусто — Claude везде; живой разговор — только с QWEN_LIVE=1", async () => {
  assert.equal(routesToQwen("saas-1", "", false), false);
  assert.equal(routesToQwen("saas-1", "saas-*", false), true);
  assert.equal(routesToQwen("outreach-letter", "saas-*, outreach-letter", false), true);
  assert.equal(routesToQwen("outreach-letterx", "outreach-letter", false), false);
  // Opus в живом разговоре — решение владельца от 10.10.2026.
  assert.equal(routesToQwen("qualify-outreach", "qualify-*", false), false);
  assert.equal(routesToQwen("qualify-outreach", "*", false), false);
  assert.equal(routesToQwen("qualify-outreach", "qualify-*", true), true);

  const secrets = (map: Record<string, string>) => async (name: string) => map[name] ?? null;
  assert.equal(await qwenFor("saas-1", secrets({ QWEN_SITES: "saas-*" })), null, "без адреса и модели — Claude");
  const routed = await qwenFor("saas-1", secrets({ QWEN_SITES: "saas-*", QWEN_BASE_URL: "http://gpu/v1/", QWEN_MODEL: "qwen3-32b", QWEN_EXTRA: "{bad" }));
  assert.deepEqual(routed, { baseUrl: "http://gpu/v1", apiKey: null, model: "qwen3-32b", extra: {} });
});

test("себестоимость знает Qwen", () => {
  const row = { model: "qwen3-32b", input_tokens: 1_000_000, output_tokens: 0, cache_write_tokens: 0, cache_read_tokens: 0 };
  assert.ok(usageCostUsd([row]) < 1, "Qwen не считается по цене Sonnet");
});

test("сравнение: наши проверки ловят тире, штампы, кириллицу в узбекском, робота", () => {
  assert.deepEqual(commonProblems("Сделаем макет за 12 часов.", "ru"), []);
  assert.ok(commonProblems("Сделаем макет — бесплатно", "ru").includes("dash"));
  assert.ok(commonProblems("Saytingiz uchun maket tayyorlaymiz, погонный", "uz").includes("uz_cyrillic"));
  assert.ok(commonProblems("We will build it", "ru").includes("wrong_lang"));
  const c = TALK_CASES.find((x) => x.id === "ru-free")!;
  const ok = talkProblems(c, "Подвоха нет: макет бесплатный, так мы показываем, как работаем. Если интересно, отправьте «+».", "m");
  assert.deepEqual(ok.problems, []);
  const robot = talkProblems(c, "Отлично! Вот что мы сделаем:\n- макет\n- SEO-оптимизация", "m");
  assert.ok(robot.problems.includes("list"));
  assert.ok(robot.problems.includes("jargon"));
});

test("сравнение: прогон разговора на поддельной модели и итог", async () => {
  const reply = (text: string): Anthropic.Beta.BetaMessage =>
    ({ id: "m", type: "message", role: "assistant", model: "fake", content: [{ type: "text", text }], stop_reason: "end_turn", stop_sequence: null, usage: { input_tokens: 100, output_tokens: 20 } }) as unknown as Anthropic.Beta.BetaMessage;
  const talk = await runCase(TALK_CASES.find((x) => x.id === "uz-free")!, async () => reply("Ha, maket bepul. Qiziq bo‘lsa, «+» yuboring."), "fake");
  assert.deepEqual(talk.problems, []);
  assert.equal(talk.objection, "free");
  const saas = await runCase(SAAS_CASES.find((x) => x.id === "s-ru-price")!, async () => reply("Кухня из ЛДСП от 4 500 000 сум за погонный метр."), "fake");
  assert.deepEqual(saas.problems, []);
  assert.equal(saas.input, 100);
  const failed = await runCase(TALK_CASES[0], async () => {
    throw new Error("сеть");
  }, "fake");
  assert.deepEqual(failed.problems, ["error"]);
  const s = summarize("x", [talk, saas, failed], { input: 1, output: 1 });
  assert.equal(s.passed, 2);
  assert.equal(s.byProblem.error, 1);
  assert.equal(s.byGroup["talk-uz"].passed, 1);
});
