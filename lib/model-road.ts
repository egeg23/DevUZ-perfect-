import Anthropic from "@anthropic-ai/sdk";

import { directDispatcher } from "@/lib/egress.mjs";
import { appSecret } from "@/lib/secrets";
import { serviceClient } from "@/lib/supabase";

/**
 * Дорога к модели: прокси или ProxyAPI.
 *
 * Сервер стоит в России, и Anthropic отвечает ему 403 — поэтому к модели
 * ходим через прокси (HTTPS_PROXY, proxy6). 25–26 сентября у proxy6 лёг
 * зарубежный дата-центр: прокси был оплачен ещё на 24 дня, но не отвечал
 * ни из России, ни из США. Сутки молчали ассистент на сайте, разбор чатов
 * скаутом, ответы на касания и разборы переписок.
 *
 * Запасная дорога — ProxyAPI (api.proxyapi.ru/anthropic): российский шлюз к
 * тому же Claude, доступный с сервера напрямую. В seller-ai он давно
 * работает основным, ключ берётся оттуда же (PROXYAPI_KEY в хранилище).
 *
 * Правило владельца: «как только прокси вернётся — возвращаем его без моей
 * команды; случится снова — снова на ProxyAPI». Поэтому:
 *
 * - основная дорога — прокси, как было;
 * - прокси оборвался на сетевом уровне — этот же запрос тут же уходит через
 *   ProxyAPI, и дальше ходим через него;
 * - раз в три часа следующий запрос снова пробует прокси; ответил — мы на
 *   прокси, нет — ещё три часа на ProxyAPI;
 * - о каждой смене дороги владелец узнаёт одним сообщением в Telegram.
 *
 * Ответ с ошибкой (400, 429, 529) — это рабочая дорога: повтор через шлюз
 * его не исправит, а деньги спишет дважды. Переключает только обрыв сети.
 *
 * Всё это — в fetch, который получает SDK: вызывающему коду менять нечего,
 * ни в стриминге чата, ни в беттах, ни в повторах самого SDK.
 */

export const PROXYAPI_BASE = "https://api.proxyapi.ru/anthropic";

/** Сколько ходим через ProxyAPI, прежде чем снова попробовать прокси. */
export const RETRY_PROXY_MS = 3 * 60 * 60_000;

export type ModelRoad = "proxy" | "proxyapi";

export type RoadState = {
  road: ModelRoad;
  /** Когда снова пробовать прокси, если сейчас мы на ProxyAPI. */
  retryAt: number;
};

/** По каким дорогам и в каком порядке идёт следующий запрос. */
export function planRoads(state: RoadState, now: number, hasKey: boolean): ModelRoad[] {
  if (!hasKey) return ["proxy"];
  if (state.road === "proxyapi" && now < state.retryAt) return ["proxyapi"];
  return ["proxy", "proxyapi"];
}

/** Тот же запрос — к ProxyAPI: другой адрес, ключ шлюза вместо ключа Anthropic, мимо прокси. */
export function toProxyApi(
  url: string,
  init: RequestInit,
  key: string,
  dispatcher: unknown,
): { url: string; init: RequestInit & { dispatcher?: unknown } } {
  const target = new URL(url);
  const headers = new Headers(init.headers);
  // ProxyAPI принимает ключ как Bearer, а не x-api-key; ключ Anthropic ему
  // ни к чему — и уходить на чужой сервер ему незачем.
  headers.delete("x-api-key");
  headers.set("authorization", `Bearer ${key}`);
  return {
    url: `${PROXYAPI_BASE}${target.pathname}${target.search}`,
    init: { ...init, headers, ...(dispatcher ? { dispatcher } : {}) },
  };
}

type Deps = {
  fetchImpl?: (url: string, init?: RequestInit & { dispatcher?: unknown }) => Promise<Response>;
  key?: () => Promise<string | null>;
  direct?: () => unknown;
  now?: () => number;
  onSwitch?: (to: ModelRoad) => void | Promise<void>;
};

export function createModelFetch(deps: Deps = {}) {
  const fetchImpl = deps.fetchImpl ?? ((url, init) => fetch(url, init));
  const key = deps.key ?? (() => appSecret("PROXYAPI_KEY"));
  const direct = deps.direct ?? directDispatcher;
  const now = deps.now ?? Date.now;
  const onSwitch = deps.onSwitch ?? announceSwitch;
  const state: RoadState = { road: "proxy", retryAt: 0 };

  function arrive(road: ModelRoad) {
    const changed = state.road !== road;
    state.road = road;
    if (road === "proxyapi") state.retryAt = now() + RETRY_PROXY_MS;
    if (changed) {
      // Смена дороги не должна задерживать ответ клиенту.
      Promise.resolve(onSwitch(road)).catch((error) => console.error("model-road:", error));
    }
  }

  async function modelFetch(input: string | URL | Request, init: RequestInit = {}): Promise<Response> {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const gatewayKey = await key().catch(() => null);
    const order = planRoads(state, now(), Boolean(gatewayKey));

    let lastError: unknown;
    for (const road of order) {
      try {
        if (road === "proxy") {
          const response = await fetchImpl(url, init);
          arrive("proxy");
          return response;
        }
        const request = toProxyApi(url, init, gatewayKey!, direct());
        const response = await fetchImpl(request.url, request.init);
        arrive("proxyapi");
        return response;
      } catch (error) {
        lastError = error;
        // Вызывающий сам оборвал запрос: посетитель закрыл чат, вышло время
        // SDK. Дорога тут ни при чём — ни повтора, ни смены дороги: иначе
        // закрытое окно чата уводило бы модель на ProxyAPI на три часа.
        if (init.signal?.aborted) throw error;
        // Не сеть — не дорога виновата.
        if (!(error instanceof TypeError)) throw error;
        if (road === "proxy") console.error("model-road: прокси не ответил —", (error as Error).message);
      }
    }
    throw lastError;
  }

  return { modelFetch, state: () => ({ ...state }) };
}

/**
 * Сообщить владельцу о смене дороги — один раз на смену, хотя дорогу
 * меняют и сайт, и скаут, каждый в своём процессе: какая дорога последней
 * объявлена, помнит база.
 */
async function announceSwitch(to: ModelRoad): Promise<void> {
  console.error(to === "proxyapi" ? "model-road: прокси не отвечает — иду через ProxyAPI" : "model-road: прокси вернулся");

  const db = serviceClient();
  if (!db) return;
  const { data } = await db.from("stats_snapshots").select("payload").eq("key", ANNOUNCED).maybeSingle();
  const before = (data?.payload as { road?: ModelRoad } | null)?.road ?? "proxy";
  if (before === to) return;
  await db
    .from("stats_snapshots")
    .upsert({ key: ANNOUNCED, payload: { road: to }, computed_at: new Date().toISOString() }, { onConflict: "key" });

  // Лениво: telegram и список владельцев сами тянут модули, которые
  // создают клиента модели, — прямой импорт замкнул бы круг.
  const [{ sendMessage }, { ownerChatIds }] = await Promise.all([
    import("@/lib/qualify/telegram"),
    import("@/lib/qualify/brief"),
  ]);
  const text =
    to === "proxyapi"
      ? "<b>Прокси не отвечает — модель переключена на ProxyAPI.</b>\n" +
        "Ассистент на сайте, скаут и касания работают дальше. Раз в три часа сервер " +
        "пробует прокси и сам вернётся на него, когда тот оживёт. Запросы через ProxyAPI " +
        "списываются с его баланса в рублях."
      : "<b>Прокси снова отвечает — модель вернулась на него.</b>\nProxyAPI больше не расходуется.";
  for (const chat of await ownerChatIds()) await sendMessage(chat, text);
}

const ANNOUNCED = "model_road";

const shared = createModelFetch();

/** По какой дороге сейчас ходит модель — для /api/health. */
export const currentModelRoad = shared.state;

/** fetch с дорогами — для пробы модели в /api/health, которая ходит без SDK. */
export const modelFetch = shared.modelFetch;

/**
 * Клиент модели. Вместо `new Anthropic()` везде: тот же клиент, но с
 * запасной дорогой через ProxyAPI.
 */
export function anthropic(options: ConstructorParameters<typeof Anthropic>[0] = {}): Anthropic {
  return new Anthropic({ ...options, fetch: shared.modelFetch });
}
