/**
 * Модель с OpenAI-совместимым API (Qwen на своём сервере через vLLM или
 * Ollama, Qwen по API у облачного провайдера) под видом Claude.
 *
 * Весь код студии зовёт модель через SDK Anthropic (`anthropic(site)` в
 * lib/model-road.ts): `messages.create`, `messages.stream`, инструменты
 * (передача заявки, первичка). Переписывать полсотни мест под второй SDK —
 * второй путь, который разойдётся с первым. Поэтому перевод стоит в fetch,
 * как и дорога к модели: SDK шлёт запрос Anthropic, здесь он становится
 * запросом /chat/completions, а ответ — снова ответом Anthropic. Вызывающему
 * коду менять нечего, учёт расхода (`model_usage`) читает тот же ответ.
 *
 * Поток: модель зовётся без потока, а SDK получает готовый ответ потоком
 * событий Anthropic. Для касаний и кабинета клиента это то же самое (ответ
 * уходит целиком), для чата на сайте — текст появится сразу весь, а не по
 * словам. Перевод потока — следующий шаг, если Qwen пройдёт сравнение.
 *
 * Что Claude умеет, а здесь отбрасывается: кэш промпта, `effort`, запасная
 * модель, бетты. Ни сети, ни базы — только перевод; сеть — в lib/llm/route.ts.
 */

type Json = Record<string, unknown>;

/** Блок содержимого Anthropic, только то, что шлёт наш код. */
type Block =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: unknown }
  | { type: "tool_result"; tool_use_id: string; content?: unknown; is_error?: boolean }
  | { type: string; [key: string]: unknown };

type AnthropicMessage = { role: "user" | "assistant"; content: string | Block[] };

export type OpenAiMessage =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: OpenAiToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };

type OpenAiToolCall = { id: string; type: "function"; function: { name: string; arguments: string } };

function textOf(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .filter((b): b is { type: "text"; text: string } => Boolean(b) && (b as Json).type === "text")
    .map((b) => b.text)
    .join("\n\n");
}

/** Сообщения Anthropic → сообщения OpenAI. Системный промпт — первым сообщением. */
export function toOpenAiMessages(system: unknown, messages: readonly AnthropicMessage[]): OpenAiMessage[] {
  const out: OpenAiMessage[] = [];
  const sys = textOf(system);
  if (sys) out.push({ role: "system", content: sys });
  for (const m of messages) {
    if (typeof m.content === "string") {
      out.push({ role: m.role, content: m.content } as OpenAiMessage);
      continue;
    }
    if (m.role === "assistant") {
      const calls: OpenAiToolCall[] = m.content
        .filter((b): b is Extract<Block, { type: "tool_use" }> => b.type === "tool_use")
        .map((b) => ({ id: String(b.id), type: "function", function: { name: String(b.name), arguments: JSON.stringify(b.input ?? {}) } }));
      const text = textOf(m.content);
      out.push({ role: "assistant", content: text || null, ...(calls.length ? { tool_calls: calls } : {}) });
      continue;
    }
    // Ответ инструмента у OpenAI — отдельное сообщение `tool`, и оно идёт
    // раньше текста пользователя из того же хода.
    for (const b of m.content) {
      if (b.type !== "tool_result") continue;
      const r = b as Extract<Block, { type: "tool_result" }>;
      out.push({ role: "tool", tool_call_id: String(r.tool_use_id), content: textOf(r.content) || (r.is_error ? "error" : "ok") });
    }
    const text = textOf(m.content);
    if (text) out.push({ role: "user", content: text });
  }
  return out;
}

/** Инструменты Anthropic → функции OpenAI. Серверные инструменты (веб-поиск) не переводятся. */
export function toOpenAiTools(tools: unknown): Json[] | undefined {
  if (!Array.isArray(tools)) return undefined;
  const out = tools
    .filter((t): t is Json => Boolean(t) && typeof (t as Json).input_schema === "object")
    .map((t) => ({
      type: "function",
      function: { name: t.name, description: t.description ?? "", parameters: t.input_schema },
    }));
  return out.length ? out : undefined;
}

function toolChoice(choice: unknown): unknown {
  if (!choice || typeof choice !== "object") return undefined;
  const c = choice as Json;
  if (c.type === "auto") return "auto";
  if (c.type === "any") return "required";
  if (c.type === "none") return "none";
  if (c.type === "tool") return { type: "function", function: { name: c.name } };
  return undefined;
}

/**
 * Тело запроса Anthropic → тело /chat/completions.
 *
 * `extra` — поля провайдера сверх стандарта: у Qwen3 рассуждение выключается
 * по-разному (vLLM — `chat_template_kwargs.enable_thinking`, DashScope —
 * `enable_thinking`), поэтому их задаёт настройка, а не код.
 */
export function toOpenAiRequest(body: Json, model: string, extra: Json = {}): Json {
  const tools = toOpenAiTools(body.tools);
  const choice = tools ? toolChoice(body.tool_choice) : undefined;
  return {
    model,
    messages: toOpenAiMessages(body.system, (body.messages ?? []) as AnthropicMessage[]),
    max_tokens: typeof body.max_tokens === "number" ? body.max_tokens : 1024,
    ...(typeof body.temperature === "number" ? { temperature: body.temperature } : {}),
    ...(Array.isArray(body.stop_sequences) && body.stop_sequences.length ? { stop: body.stop_sequences } : {}),
    ...(tools ? { tools } : {}),
    ...(choice ? { tool_choice: choice } : {}),
    stream: false,
    ...extra,
  };
}

/** Рассуждение Qwen3, если провайдер его не выключил, — не для покупателя. */
export function withoutThinking(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/g, "").replace(/^[\s\S]*?<\/think>/, "").trim();
}

const STOP: Record<string, string> = {
  stop: "end_turn",
  length: "max_tokens",
  tool_calls: "tool_use",
  function_call: "tool_use",
  content_filter: "refusal",
};

function parseArgs(raw: unknown): unknown {
  if (typeof raw !== "string") return raw ?? {};
  try {
    return JSON.parse(raw);
  } catch {
    // Модель прислала сломанный JSON: пустой ввод, а разбор инструмента
    // у вызывающего кода сам решит, что заявки нет.
    return {};
  }
}

/** Ответ /chat/completions → сообщение Anthropic. */
export function fromOpenAiResponse(body: Json, model: string): Json {
  const choice = ((body.choices as Json[] | undefined) ?? [])[0] ?? {};
  const message = (choice.message ?? {}) as Json;
  const content: Json[] = [];
  const text = withoutThinking(typeof message.content === "string" ? message.content : "");
  if (text) content.push({ type: "text", text });
  const calls = Array.isArray(message.tool_calls) ? (message.tool_calls as Json[]) : [];
  calls.forEach((call, i) => {
    const fn = (call.function ?? {}) as Json;
    content.push({ type: "tool_use", id: String(call.id ?? `toolu_q${i}`), name: String(fn.name ?? ""), input: parseArgs(fn.arguments) });
  });
  const usage = (body.usage ?? {}) as Json;
  const finish = String(choice.finish_reason ?? "stop");
  return {
    id: String(body.id ?? `msg_q${Date.now()}`),
    type: "message",
    role: "assistant",
    // Модель, которая ответила, а не та, что просили: по ней model_usage и
    // себестоимость отличают Qwen от Claude.
    model: typeof body.model === "string" && body.model ? body.model : model,
    content,
    stop_reason: calls.length ? "tool_use" : (STOP[finish] ?? "end_turn"),
    stop_sequence: null,
    usage: {
      input_tokens: Number(usage.prompt_tokens) || 0,
      output_tokens: Number(usage.completion_tokens) || 0,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 0,
    },
  };
}

/** Готовое сообщение Anthropic — потоком событий, как его ждёт `messages.stream`. */
export function sseFromMessage(message: Json): string {
  const events: Json[] = [];
  const blocks = (message.content ?? []) as Json[];
  const usage = (message.usage ?? {}) as Json;
  events.push({
    type: "message_start",
    message: { ...message, content: [], stop_reason: null, usage: { ...usage, output_tokens: 0 } },
  });
  blocks.forEach((block, index) => {
    if (block.type === "text") {
      events.push({ type: "content_block_start", index, content_block: { type: "text", text: "" } });
      events.push({ type: "content_block_delta", index, delta: { type: "text_delta", text: block.text } });
    } else {
      events.push({ type: "content_block_start", index, content_block: { ...block, input: {} } });
      events.push({ type: "content_block_delta", index, delta: { type: "input_json_delta", partial_json: JSON.stringify(block.input ?? {}) } });
    }
    events.push({ type: "content_block_stop", index });
  });
  events.push({
    type: "message_delta",
    delta: { stop_reason: message.stop_reason, stop_sequence: null },
    usage: { output_tokens: usage.output_tokens ?? 0 },
  });
  events.push({ type: "message_stop" });
  return events.map((e) => `event: ${e.type}\ndata: ${JSON.stringify(e)}\n\n`).join("");
}

/** Ошибка провайдера — в виде ошибки Anthropic, чтобы SDK показал её как обычно. */
export function anthropicError(status: number, detail: string): Json {
  const type = status === 429 ? "rate_limit_error" : status === 401 || status === 403 ? "authentication_error" : status >= 500 ? "api_error" : "invalid_request_error";
  return { type: "error", error: { type, message: `openai-compat ${status}: ${detail.slice(0, 300)}` } };
}
