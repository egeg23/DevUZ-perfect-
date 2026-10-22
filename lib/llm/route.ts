import { appSecret } from "@/lib/secrets";

import { anthropicError, fromOpenAiResponse, sseFromMessage, toOpenAiRequest } from "@/lib/llm/openai-compat";

/**
 * Какой модели отдать вызов: Claude (как всегда) или Qwen.
 *
 * Задание владельца 22.10.2026: слой моделей под Qwen рядом с Claude, выбор
 * без выкатки. Всё в хранилище секретов или в .env (`appSecret`: .env
 * важнее, ответ хранилища помнится 10 минут), по меткам мест, по которым и
 * так пишется `model_usage`:
 *
 * - `QWEN_BASE_URL` — адрес OpenAI-совместимого API, до `/v1` включительно
 *   (vLLM: `http://<сервер>:8000/v1`, Ollama: `http://<сервер>:11434/v1`,
 *   облако: адрес провайдера);
 * - `QWEN_API_KEY` — ключ, если провайдер его просит;
 * - `QWEN_MODEL` — имя модели у провайдера;
 * - `QWEN_EXTRA` — JSON с полями провайдера сверх стандарта (выключить
 *   рассуждение Qwen3 и т. п.);
 * - `QWEN_SITES` — метки мест через запятую, `*` в конце — по началу:
 *   `eval-*`, `saas-*`. Пусто — Qwen не зовётся нигде, всё на Claude.
 *
 * Живой разговор с клиентом (`qualify-*`: чат на сайте, бот, переписка
 * касаний) — Opus по решению владельца от 10.10.2026. Туда Qwen не идёт,
 * даже если метка попала в `QWEN_SITES`, пока нет `QWEN_LIVE=1`, а его
 * ставят только по слову владельца после сравнения (docs/ai-staff/qwen.md).
 */

export type QwenConfig = {
  baseUrl: string;
  apiKey: string | null;
  model: string;
  extra: Record<string, unknown>;
};

/** Метки живого разговора с клиентом: Opus, пока владелец не решит иначе. */
export const LIVE_TALK_PREFIXES = ["qualify-"] as const;

export function isLiveTalk(site: string): boolean {
  return LIVE_TALK_PREFIXES.some((p) => site.startsWith(p));
}

/** Попадает ли метка в список `QWEN_SITES`. */
export function siteMatches(site: string, list: string): boolean {
  return list
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .some((rule) => (rule.endsWith("*") ? site.startsWith(rule.slice(0, -1)) : site === rule));
}

export function routesToQwen(site: string, sites: string, live: boolean): boolean {
  if (!siteMatches(site, sites)) return false;
  return live || !isLiveTalk(site);
}

function parseExtra(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    const value = JSON.parse(raw);
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch {
    console.error("llm: QWEN_EXTRA — не JSON, пропускаю");
    return {};
  }
}

/** Настройка Qwen из хранилища; без адреса или модели — null. */
export async function qwenConfig(secret: (name: string) => Promise<string | null> = appSecret): Promise<QwenConfig | null> {
  const [baseUrl, model, apiKey, extra] = await Promise.all([
    secret("QWEN_BASE_URL"),
    secret("QWEN_MODEL"),
    secret("QWEN_API_KEY"),
    secret("QWEN_EXTRA"),
  ]);
  if (!baseUrl || !model) return null;
  return { baseUrl: baseUrl.replace(/\/+$/, ""), model, apiKey, extra: parseExtra(extra) };
}

/** Настройка Qwen для этого места — или null, если место идёт к Claude. */
/**
 * Список мест помнится минуту, и ответ «хранилище молчит» тоже: этот вопрос
 * стоит перед каждым вызовом модели, в том числе в чате на сайте, и сбой
 * базы не должен добавлять ожидание к каждому ответу.
 */
const ROUTE_TTL_MS = 60_000;
let routeMemo: { at: number; sites: string | null; live: boolean } | null = null;

export async function qwenFor(site: string, secret: (name: string) => Promise<string | null> = appSecret, now = Date.now()): Promise<QwenConfig | null> {
  const fresh = secret === appSecret && routeMemo && now - routeMemo.at < ROUTE_TTL_MS ? routeMemo : null;
  const memo = fresh ?? {
    at: now,
    sites: await secret("QWEN_SITES").catch(() => null),
    live: (await secret("QWEN_LIVE").catch(() => null)) === "1",
  };
  if (secret === appSecret) routeMemo = memo;
  const { sites, live } = memo;
  if (!sites) return null;
  if (!routesToQwen(site, sites, live)) return null;
  return qwenConfig(secret).catch(() => null);
}

type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

/**
 * fetch для SDK Anthropic, который на деле ходит в OpenAI-совместимый API.
 * Переводится только `POST /v1/messages`; остальное (подсчёт токенов,
 * пакеты) у Qwen нет — честный отказ.
 */
export function qwenFetch(config: QwenConfig, fetchImpl: FetchLike = (url, init) => fetch(url, init)) {
  return async (input: string | URL | Request, init: RequestInit = {}): Promise<Response> => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const json = (body: unknown, status: number, headers: Record<string, string> = {}) =>
      new Response(typeof body === "string" ? body : JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json", ...headers },
      });
    if (!/\/v1\/messages$/.test(new URL(url).pathname) || (init.method ?? "GET").toUpperCase() !== "POST") {
      return json(anthropicError(404, "у Qwen есть только /v1/messages"), 404);
    }
    const body = JSON.parse(typeof init.body === "string" ? init.body : "{}") as Record<string, unknown>;
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (config.apiKey) headers.authorization = `Bearer ${config.apiKey}`;
    const response = await fetchImpl(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify(toOpenAiRequest(body, config.model, config.extra)),
      signal: init.signal,
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      return json(anthropicError(response.status, detail), response.status);
    }
    const message = fromOpenAiResponse((await response.json()) as Record<string, unknown>, config.model);
    if (body.stream) {
      return new Response(sseFromMessage(message), { status: 200, headers: { "content-type": "text/event-stream" } });
    }
    return json(message, 200);
  };
}
