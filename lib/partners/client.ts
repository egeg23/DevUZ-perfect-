/**
 * Память сайта о том, по чьей ссылке пришёл человек. Только браузер.
 *
 * Код из `?ref=` лежит в localStorage вместе с датой и живёт REF_TTL_DAYS:
 * человек мог открыть ссылку сегодня, а написать через месяц, и партнёр
 * не должен потерять его из-за этого. Первый код побеждает: если пришли по
 * двум ссылкам, засчитывается та, что привела первой. Всё в try/catch —
 * приватное окно или отключённое хранилище не должны ломать чат и форму.
 */

const KEY = "devuz_ref";
const TTL_MS = 90 * 24 * 60 * 60 * 1000;
const CODE_RE = /^[A-Z0-9_-]{3,24}$/;

type Stored = { code: string; at: number };

function read(): Stored | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Stored>;
    if (typeof parsed.code !== "string" || typeof parsed.at !== "number") return null;
    if (!CODE_RE.test(parsed.code)) return null;
    if (Date.now() - parsed.at > TTL_MS) return null;
    return { code: parsed.code, at: parsed.at };
  } catch {
    return null;
  }
}

/** Код партнёра для заявки или null. */
export function readRef(): string | null {
  return read()?.code ?? null;
}

/** Запомнить код из адреса, если ещё не помним другого. Возвращает, что запомнили. */
export function rememberRef(raw: string | null): string | null {
  const code = (raw ?? "").trim().toUpperCase();
  if (!CODE_RE.test(code)) return null;
  const current = read();
  if (current) return current.code;
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ code, at: Date.now() } satisfies Stored));
  } catch {
    // Хранилище недоступно — код проживёт до перезагрузки в памяти вкладки.
  }
  return code;
}
