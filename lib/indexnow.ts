/**
 * IndexNow — «мы обновились, приходите».
 *
 * Протокол поддерживают Bing, Яндекс, Seznam и Naver. Google его не
 * поддерживает и прямо об этом говорит: там единственный канал —
 * sitemap.xml и обычный обход. Поэтому пинг не заменяет карту сайта, а
 * дополняет её на том рынке, где Яндекс даёт заметную часть трафика.
 *
 * Модуль только собирает и проверяет тело запроса. Отправка — в
 * `scripts/indexnow-ping.mjs`: так правила, которые легко нарушить,
 * проверяются тестами, а не «на живом домене».
 */

/** Адрес приёмника. Любой участник раздаёт пинг остальным. */
export const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

/** Ограничение протокола на один запрос. */
export const MAX_URLS = 10_000;

export type IndexNowPayload = {
  host: string;
  key: string;
  keyLocation: string;
  urlList: string[];
};

/**
 * Ключ: 8–128 символов из латиницы, цифр и дефиса.
 *
 * Проверяем до отправки, потому что ответ на плохой ключ — 403, и отличить
 * его от «домен не подтверждён» по коду нельзя.
 */
export function isValidKey(key: string): boolean {
  return /^[a-zA-Z0-9-]{8,128}$/.test(key);
}

/** Хост из адреса сайта, без порта и завершающей точки. */
function hostOf(url: string): string {
  return new URL(url).hostname.replace(/\.$/, "");
}

/**
 * Собирает тело запроса и попутно отбраковывает всё, из-за чего приёмник
 * ответит 422 без объяснения.
 *
 * Главное правило протокола: каждый адрес из списка должен лежать на том же
 * хосте, что и `host`. Один чужой адрес отменяет весь запрос целиком, а не
 * только себя, — поэтому чужие не выкидываются молча, а роняют сборку с
 * именем виновника.
 */
export function buildPayload(input: {
  key: string;
  siteUrl: string;
  urls: readonly string[];
}): IndexNowPayload {
  const key = input.key.trim();
  if (!isValidKey(key)) {
    throw new Error("INDEXNOW_KEY: нужно 8–128 символов из латиницы, цифр и дефиса");
  }

  const host = hostOf(input.siteUrl);
  const seen = new Set<string>();
  const urlList: string[] = [];

  for (const raw of input.urls) {
    const url = raw.trim();
    if (!url) continue;

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new Error(`Не адрес: ${url}`);
    }
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      throw new Error(`Не тот протокол: ${url}`);
    }
    if (hostOf(url) !== host) {
      throw new Error(`Чужой хост: ${url} — ожидался ${host}`);
    }

    // Повторы в одном запросе не ускоряют обход, зато приближают 429.
    if (seen.has(parsed.href)) continue;
    seen.add(parsed.href);
    urlList.push(parsed.href);
  }

  if (urlList.length === 0) throw new Error("Пустой список адресов");
  if (urlList.length > MAX_URLS) {
    throw new Error(`Больше ${MAX_URLS} адресов за раз протокол не принимает`);
  }

  return {
    host,
    key,
    // Ключ лежит в корне — так его отдаёт rewrite из next.config.ts.
    keyLocation: `${input.siteUrl.replace(/\/+$/, "")}/${key}.txt`,
    urlList,
  };
}

/** Ровно то от разбора, что нужно для адреса. */
export type RazborRef = { locale: string; slug: string; publishedAt: string };

export type PingVerdict = {
  /** Пинг принят: повторять не нужно. */
  ok: boolean;
  /** Повтор имеет смысл: сеть, перегрузка, лимит. */
  retry: boolean;
  text: string;
};

/**
 * Что означает код ответа.
 *
 * 202 — «ключ ещё проверяем». Это успех: адреса приняты, а проверка ключа
 * идёт своим чередом. Считать его ошибкой значит слать один и тот же список
 * каждый день и упереться в 429.
 */
export function verdictFor(status: number): PingVerdict {
  if (status === 200) return { ok: true, retry: false, text: "принято" };
  if (status === 202) {
    return { ok: true, retry: false, text: "принято, ключ проверяется" };
  }
  if (status === 400) {
    return { ok: false, retry: false, text: "400: неверный формат запроса" };
  }
  if (status === 403) {
    return { ok: false, retry: false, text: "403: ключ не найден по keyLocation" };
  }
  if (status === 422) {
    return { ok: false, retry: false, text: "422: адреса не с того хоста или ключ не тот" };
  }
  if (status === 429) return { ok: false, retry: true, text: "429: слишком часто" };
  if (status >= 500) return { ok: false, retry: true, text: `${status}: сбой на стороне приёмника` };
  return { ok: false, retry: false, text: `неожиданный ответ ${status}` };
}

/**
 * Что пингуем после выкатки: разделы плюс свежие разборы.
 *
 * Список разборов приходит аргументом, а не импортом. Модуль зовут и из
 * приложения, и из `node --experimental-strip-types`, а псевдоним `@/`
 * работает только в первом случае: любой импорт контента отсюда ломал бы
 * скрипт. Заодно функция остаётся чистой.
 *
 * Разделы идут в список всегда. Робот, узнавший про новую статью, но не про
 * обновившийся список, придёт на статью и не увидит, откуда на неё
 * ссылаются, — а внутренняя ссылка здесь единственная.
 *
 * Свежих берём немного: пинг ускоряет обход, а не заменяет его, и слать один
 * и тот же список целиком каждый день значит упереться в 429.
 */
export function freshRazborUrls(
  siteUrl: string,
  input: { locales: readonly string[]; items: readonly RazborRef[] },
  limit = 6,
): string[] {
  const base = siteUrl.replace(/\/+$/, "");
  const fresh = [...input.items]
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))
    .slice(0, Math.max(0, limit))
    .map((item) => `${base}/${item.locale}/razbor/${item.slug}`);
  return [...input.locales.map((l) => `${base}/${l}/razbor`), ...fresh];
}

export type PingReport = PingVerdict & { status: number | null; urls: number };

/**
 * Отправляет пинг с повторами там, где повтор имеет смысл.
 *
 * Сеть, 429 и пятисотки повторяются; 400, 403 и 422 — нет: это ошибка в
 * запросе, и второй такой же получит тот же ответ.
 */
export async function sendPing(
  payload: IndexNowPayload,
  options: { attempts?: number; sleep?: (ms: number) => Promise<void> } = {},
): Promise<PingReport> {
  const attempts = options.attempts ?? 3;
  const sleep =
    options.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));

  let last: PingReport = {
    ok: false,
    retry: true,
    text: "ни одной попытки",
    status: null,
    urls: payload.urlList.length,
  };

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await fetch(INDEXNOW_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(20_000),
      });
      last = { ...verdictFor(response.status), status: response.status, urls: payload.urlList.length };
    } catch (error) {
      const text = error instanceof Error ? error.message : String(error);
      last = { ok: false, retry: true, text: `сеть: ${text}`, status: null, urls: payload.urlList.length };
    }

    if (last.ok || !last.retry || attempt === attempts) return last;
    await sleep(2000 * 2 ** (attempt - 1));
  }

  return last;
}
