/**
 * Сколько байт и запросов отдаёт нам база — по таблицам и выборкам.
 *
 * Supabase Free даёт 5 ГБ трафика из базы в месяц. 22.10.2026 за 17 дней
 * ушло 6,69 ГБ (по 400–650 МБ в день), а журнал запросов — 4,78 ГБ при
 * 1 ГБ: «с 21 ноября проекты ограничат, если останетесь сверх лимита».
 * Сама база весит 72 МБ, то есть трафик — это одни и те же строки,
 * прочитанные снова и снова. Какие именно — по коду не угадать: здесь
 * счёт по факту.
 *
 * Каждый ответ базы ложится в счёт процесса: метод, таблица и что
 * выбирали (`select`), сколько раз и сколько байт. Байты — по
 * content-length, то есть сколько ушло по сети; заголовка нет — длина
 * тела после распаковки, это верхняя граница. Раз в 15 минут счёт за день
 * уходит одной строкой в stats_snapshots (`egress-tally:<день>:<процесс>`),
 * мимо самого счёта. Клиентских данных в нём нет: только имена таблиц,
 * колонок и числа.
 */

/** Сколько выборок хранить в строке: остальное — в «прочее». */
export const TALLY_TOP = 60;

/** Как часто сбрасывать счёт в базу. */
export const TALLY_FLUSH_MS = 15 * 60_000;

/**
 * Ключ счёта по адресу запроса: «GET prospects id,host,findings».
 *
 * @param {string} url
 * @param {string} [method]
 */
export function tallyKey(url, method = "GET") {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return `${method} ?`;
  }
  const parts = parsed.pathname.split("/").filter(Boolean);
  // /rest/v1/<таблица>, /rest/v1/rpc/<функция>, /storage/v1/object/<корзина>/…
  if (parts[0] === "rest") {
    const name = parts[2] === "rpc" ? `rpc/${parts[3] ?? ""}` : (parts[2] ?? "");
    const select = (parsed.searchParams.get("select") ?? "").replace(/\s+/g, "").slice(0, 120);
    return `${method} ${name}${select ? ` ${select}` : ""}`;
  }
  if (parts[0] === "storage") return `${method} storage/${parts[3] ?? ""}`;
  return `${method} ${parts[0] ?? ""}`;
}

/** @typedef {{ n: number, bytes: number }} Row */

/**
 * Счёт одного процесса. Отдельной функцией — чтобы тест считал свой, не
 * трогая общий.
 *
 * @param {{ now?: () => number }} [deps]
 */
export function createTally(deps = {}) {
  const now = deps.now ?? (() => Date.now());
  /** @type {Map<string, Row>} */
  const rows = new Map();
  let day = new Date(now()).toISOString().slice(0, 10);

  /** @param {string} key @param {number} bytes */
  function add(key, bytes) {
    const today = new Date(now()).toISOString().slice(0, 10);
    // Счёт — за день: в полночь по UTC строка начинается заново.
    if (today !== day) {
      rows.clear();
      day = today;
    }
    const row = rows.get(key) ?? { n: 0, bytes: 0 };
    row.n += 1;
    row.bytes += Math.max(0, Math.round(bytes) || 0);
    rows.set(key, row);
  }

  /** Строка для базы: самые тяжёлые выборки, остальное одной суммой. */
  function snapshot() {
    const all = [...rows.entries()].sort((a, b) => b[1].bytes - a[1].bytes);
    const top = all.slice(0, TALLY_TOP);
    const rest = all.slice(TALLY_TOP).reduce((s, [, r]) => ({ n: s.n + r.n, bytes: s.bytes + r.bytes }), { n: 0, bytes: 0 });
    const total = all.reduce((s, [, r]) => ({ n: s.n + r.n, bytes: s.bytes + r.bytes }), { n: 0, bytes: 0 });
    return {
      day,
      total,
      top: top.map(([key, r]) => ({ key, ...r })),
      ...(rest.n ? { rest } : {}),
    };
  }

  return { add, snapshot, day: () => day };
}

/**
 * Сколько байт в ответе: content-length, а нет его — длина тела копии.
 *
 * @param {Response} response
 * @returns {Promise<number>}
 */
export async function responseBytes(response) {
  const length = Number(response.headers.get("content-length"));
  if (Number.isFinite(length) && length >= 0 && response.headers.has("content-length")) return length;
  try {
    const body = await response.clone().arrayBuffer();
    return body.byteLength;
  } catch {
    return 0;
  }
}

/** Имя процесса для ключа строки: сайт, скаут, боты. */
export function processName(env = process.env, argv = process.argv) {
  if (env.DEVUZ_PROC) return env.DEVUZ_PROC;
  const script = String(argv[1] ?? "").split("/").filter(Boolean);
  return script.slice(-2).join("/") || "node";
}
