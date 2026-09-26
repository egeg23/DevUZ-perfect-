/**
 * Две дороги наружу: через прокси и напрямую.
 *
 * Сервер стоит в России. Anthropic отсюда отвечает 403, поэтому весь выход
 * наружу когда-то пустили через прокси (NODE_OPTIONS=--use-env-proxy). А до
 * Telegram отсюда дорога то есть, то нет: в сентябре напрямую соединения
 * висели, и через прокси пошло всё — и бот, и скаут.
 *
 * 25–26 сентября прокси умер целиком: порт не отвечает. Бот сутки не видел
 * ни одной команды, не прислал ни ссылки на вход в панель, ни лида, ни
 * напоминания — хотя напрямую api.telegram.org в это время отвечал за
 * десятую долю секунды. Одна дорога — одна точка отказа.
 *
 * Поэтому для хостов, до которых можно доехать и так и так (Telegram,
 * Метрика), запрос идёт по той дороге, что сработала последней; оборвался
 * на сетевом уровне — тут же повторяется по другой, и дальше ходим по ней.
 * Ответ с любым HTTP-кодом — это дорога, которая работает: ошибку Telegram
 * вторая дорога не исправит.
 *
 * Для Anthropic это не годится: напрямую он ответит 403 — «успешно» с
 * точки зрения сети, и мы бы навсегда застряли на дороге, где модели нет.
 * Поэтому модель ходит как раньше, только через прокси.
 *
 * Прямая дорога — второй экземпляр того же EnvHttpProxyAgent, которым Node
 * по флагу --use-env-proxy обслуживает fetch, с noProxy: "*". Класс берём у
 * глобального диспетчера по общему для всех копий undici ключу — так fetch
 * и диспетчер гарантированно из одной версии, без отдельного пакета. Флага
 * нет или прокси не задан — дорога одна, и fetch идёт как обычно.
 */

const GLOBAL_DISPATCHER = Symbol.for("undici.globalDispatcher.1");

/** @typedef {"proxy" | "direct"} Road */

/** Задан ли прокси — то есть есть ли вообще вторая дорога. */
export function proxyConfigured(env = process.env) {
  return Boolean(env.HTTPS_PROXY || env.https_proxy || env.HTTP_PROXY || env.http_proxy);
}

/** @type {unknown} undefined — ещё не искали, null — взять неоткуда. */
let directAgent;

/** Диспетчер без прокси или null, если fetch и так идёт напрямую. */
export function directDispatcher() {
  if (directAgent !== undefined) return directAgent;
  const current = /** @type {Record<symbol, unknown>} */ (/** @type {unknown} */ (globalThis))[GLOBAL_DISPATCHER];
  const Agent = current && typeof current === "object" ? current.constructor : null;
  directAgent =
    typeof Agent === "function" && Agent.name === "EnvHttpProxyAgent"
      ? new /** @type {new (o: object) => unknown} */ (Agent)({ noProxy: "*" })
      : null;
  return directAgent;
}

/**
 * Оборвалось до ответа: сеть, прокси, таймаут соединения. fetch сообщает
 * это одним TypeError («fetch failed») — в отличие от ответа с ошибкой,
 * который приходит обычным Response.
 */
function brokenRoad(error) {
  return error instanceof TypeError;
}

/**
 * Собрать fetch с двумя дорогами. Зависимости — параметрами, чтобы тест
 * мог подставить свои дороги, не поднимая прокси.
 *
 * @param {{
 *   fetchImpl?: (url: string, init?: RequestInit & { dispatcher?: unknown }) => Promise<Response>,
 *   direct?: () => unknown,
 *   proxied?: () => boolean,
 *   log?: (line: string) => void,
 * }} [deps]
 */
export function createRoads(deps = {}) {
  const fetchImpl = deps.fetchImpl ?? ((url, init) => fetch(url, init));
  const direct = deps.direct ?? directDispatcher;
  const proxied = deps.proxied ?? (() => proxyConfigured());
  const log = deps.log ?? ((line) => console.error(line));
  /** @type {Map<string, Road>} */
  const preferred = new Map();

  /**
   * @param {string} url
   * @param {RequestInit} [init]
   * @returns {Promise<Response>}
   */
  async function roadFetch(url, init = {}) {
    const agent = proxied() ? direct() : null;
    if (!agent) return fetchImpl(url, init);

    const host = new URL(url).host;
    const first = preferred.get(host) ?? "proxy";
    /** @type {Road[]} */
    const order = first === "proxy" ? ["proxy", "direct"] : ["direct", "proxy"];

    let lastError;
    for (const road of order) {
      try {
        const response = await fetchImpl(url, road === "direct" ? { ...init, dispatcher: agent } : init);
        if (road !== first) {
          preferred.set(host, road);
          log(`egress: ${host} — ${road === "direct" ? "через прокси не отвечает, иду напрямую" : "напрямую не отвечает, иду через прокси"}`);
        }
        return response;
      } catch (error) {
        lastError = error;
        // Вызывающий сам оборвал запрос (или вышло его время) — бюджета на
        // вторую дорогу нет. Но эта дорога не ответила вовремя: следующий
        // запрос к хосту пойдёт по другой.
        if (init.signal?.aborted) {
          preferred.set(host, road === "proxy" ? "direct" : "proxy");
          throw error;
        }
        if (!brokenRoad(error)) throw error;
      }
    }
    throw lastError;
  }

  /** По какой дороге сейчас ходим — для /api/health. */
  function roads() {
    return Object.fromEntries(preferred);
  }

  return { roadFetch, roads };
}

/**
 * WebSocket мимо прокси — для скаута.
 *
 * Скаут ходит в дата-центр Telegram своим протоколом, и из России голый TCP
 * до дата-центра закрыт (26 сентября: «Connection to 149.154.167.51:443
 * timed out»), а WebSocket по 443 — тот же путь, каким ходит Telegram Web, —
 * открыт. Но встроенный WebSocket в Node, как и fetch, идёт через
 * глобальный диспетчер, то есть через прокси из .env: умер прокси — умер и
 * он. Этот класс подставляет прямую дорогу.
 *
 * Прокси не задан — отдаём обычный WebSocket: он и так идёт напрямую.
 *
 * @returns {typeof WebSocket}
 */
export function directWebSocket() {
  const dispatcher = proxyConfigured() ? directDispatcher() : null;
  if (!dispatcher) return WebSocket;
  return class DirectWebSocket extends WebSocket {
    /**
     * @param {string | URL} url
     * @param {string | string[]} [protocols]
     */
    constructor(url, protocols) {
      // Второй аргумент-объект с dispatcher — расширение undici, на
      // котором построен WebSocket в Node.
      super(url, /** @type {any} */ ({ protocols, dispatcher }));
    }
  };
}

const shared = createRoads();

/** fetch к хостам, до которых можно доехать и через прокси, и напрямую. */
export const roadFetch = shared.roadFetch;

/** Хост → дорога, по которой к нему ходили последний раз (пусто — через прокси). */
export const currentRoads = shared.roads;
