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
 * Кроме одного случая: ProxyAPI отказал сам — закончился баланс (402) или
 * не принят ключ (401, 403). 28 сентября баланс кончился, пока прокси ещё
 * лежал, и модель замолчала совсем; владелец узнал об этом из отчёта смены
 * разборов, а прокси до конца трёх часов даже не пробовали. Теперь отказ
 * шлюза — повод тут же попробовать прокси, пробовать его первым в каждом
 * следующем запросе, пока шлюз не заработает, и сразу написать владельцу.
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

/**
 * ProxyAPI отказал сам: 402 — кончился баланс, 401 и 403 — ключ не принят.
 * Это не ответ модели, а закрытая дверь шлюза: по нему не идут дальше.
 */
export function gatewayRefused(status: number): boolean {
  return status === 401 || status === 402 || status === 403;
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
  onGateway?: (event: GatewayEvent) => void | Promise<void>;
};

/** Что случилось со шлюзом: отказал (и с каким ответом) или снова отвечает. */
export type GatewayEvent =
  | { state: "refused"; status: number; detail: string; proxyAlive: boolean }
  | { state: "ok" };

export function createModelFetch(deps: Deps = {}) {
  const fetchImpl = deps.fetchImpl ?? ((url, init) => fetch(url, init));
  const key = deps.key ?? (() => appSecret("PROXYAPI_KEY"));
  const direct = deps.direct ?? directDispatcher;
  const now = deps.now ?? Date.now;
  const onSwitch = deps.onSwitch ?? announceSwitch;
  const onGateway = deps.onGateway ?? announceGateway;
  const state: RoadState = { road: "proxy", retryAt: 0 };
  /** Шлюз отказал и с тех пор ни разу не ответил по-настоящему. */
  let refused = false;

  function arrive(road: ModelRoad) {
    const changed = state.road !== road;
    state.road = road;
    if (road === "proxyapi") state.retryAt = now() + RETRY_PROXY_MS;
    if (changed) {
      // Смена дороги не должна задерживать ответ клиенту.
      Promise.resolve(onSwitch(road)).catch((error) => console.error("model-road:", error));
    }
  }

  function tell(event: GatewayEvent) {
    Promise.resolve(onGateway(event)).catch((error) => console.error("model-road:", error));
  }

  async function modelFetch(input: string | URL | Request, init: RequestInit = {}): Promise<Response> {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const gatewayKey = await key().catch(() => null);
    const order = planRoads(state, now(), Boolean(gatewayKey));

    let lastError: unknown;
    for (let i = 0; i < order.length; i++) {
      const road = order[i];
      try {
        if (road === "proxy") {
          const response = await fetchImpl(url, init);
          arrive("proxy");
          return response;
        }
        const request = toProxyApi(url, init, gatewayKey!, direct());
        const response = await fetchImpl(request.url, request.init);
        if (!gatewayRefused(response.status)) {
          if (refused) {
            refused = false;
            tell({ state: "ok" });
          }
          arrive("proxyapi");
          return response;
        }

        // Шлюз закрыт. Следующие запросы сначала идут в прокси — вдруг
        // ожил, — а если в этом прокси ещё не пробовали, пробуем сейчас.
        state.retryAt = 0;
        let viaProxy: Response | null = null;
        let proxyError: unknown = null;
        if (!order.slice(0, i).includes("proxy")) {
          try {
            viaProxy = await fetchImpl(url, init);
          } catch (error) {
            if (init.signal?.aborted || !(error instanceof TypeError)) proxyError = error;
          }
        }
        if (!refused) {
          refused = true;
          const detail = (await response.clone().text().catch(() => "")).slice(0, 200);
          console.error(`model-road: ProxyAPI отказал — ${response.status} ${detail}`);
          tell({ state: "refused", status: response.status, detail, proxyAlive: viaProxy !== null });
        }
        if (proxyError) throw proxyError;
        if (viaProxy) {
          arrive("proxy");
          return viaProxy;
        }
        // Прокси тоже лежит — вызывающему честный ответ шлюза.
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

/** Об отказе шлюза напоминаем не чаще раза в сутки: сайт и скаут узнают о нём каждый сам. */
const GATEWAY_ANNOUNCED = "model_gateway";
const GATEWAY_REMIND_MS = 24 * 60 * 60_000;

/**
 * Сказать владельцу, что ProxyAPI отказал или снова отвечает. Сайт и скаут
 * видят отказ каждый сам, а сообщение нужно одно: что уже сказано, помнит база.
 */
async function announceGateway(event: GatewayEvent): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  const { data } = await db.from("stats_snapshots").select("payload, computed_at").eq("key", GATEWAY_ANNOUNCED).maybeSingle();
  const before = (data?.payload as { state?: GatewayEvent["state"] } | null)?.state ?? "ok";
  const saidAt = data?.computed_at ? Date.parse(data.computed_at as string) : 0;
  if (event.state === "ok" && before === "ok") return;
  if (event.state === "refused" && before === "refused" && Date.now() - saidAt < GATEWAY_REMIND_MS) return;
  await db
    .from("stats_snapshots")
    .upsert(
      { key: GATEWAY_ANNOUNCED, payload: { state: event.state }, computed_at: new Date().toISOString() },
      { onConflict: "key" },
    );

  const [{ sendMessage }, { ownerChatIds }] = await Promise.all([
    import("@/lib/qualify/telegram"),
    import("@/lib/qualify/brief"),
  ]);
  const why =
    event.state === "refused"
      ? event.status === 402
        ? "закончился баланс"
        : "не принят ключ"
      : "";
  const text =
    event.state === "refused"
      ? `<b>ProxyAPI отказал: ${why} (${event.status}).</b>\n` +
        (event.proxyAlive
          ? "Сейчас модель работает через прокси, но запаса нет: ляжет прокси — модель замолчит.\n"
          : "Прокси тоже не отвечает, поэтому модель сейчас не работает: ассистент на сайте, " +
            "скаут, касания и разборы стоят.\n") +
        (event.status === 402
          ? "Пополните баланс в кабинете ProxyAPI → «Биллинг». "
          : "Проверьте ключ в кабинете ProxyAPI → «Ключи API». ") +
        "Дальше сервер сам: с каждым запросом он пробует и прокси, и ProxyAPI."
      : "<b>ProxyAPI снова отвечает — модель работает.</b>";
  for (const chat of await ownerChatIds()) await sendMessage(chat, text);
}

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
