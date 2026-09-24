/**
 * Минута на скидку — сторона браузера. Сервер — в lib/qualify/minute.ts.
 *
 * Окно запрашивается у сервера один раз, при первом заходе, и живёт в
 * localStorage: перезагрузка страницы, переход между страницами и вторая
 * вкладка видят одну и ту же минуту, а не запускают новую. После неё в
 * хранилище остаётся либо закрепление скидки (если человек успел), либо
 * вышедшее окно — и минута больше не предлагается.
 *
 * Хранилище недоступно (редкий приватный режим) — минуты нет вовсе: без
 * памяти каждая перезагрузка начинала бы её заново.
 *
 * Состояние общее для кнопки чата, окна чата и секции контактов — отсюда
 * маленький стор с подпиской, а не useState в каждом.
 */

export type MinuteState =
  | { phase: "off" }
  | { phase: "running"; token: string; from: number; until: number }
  | { phase: "claimed"; claim: string }
  | { phase: "over" };

type Stored = { token?: unknown; from?: unknown; until?: unknown; claim?: unknown };

export const MINUTE_STORAGE_KEY = "devuz_minute";
const OFF: MinuteState = { phase: "off" };

let state: MinuteState = OFF;
let started = false;
let expiry: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

function emit(next: MinuteState): void {
  state = next;
  if (expiry) clearTimeout(expiry);
  expiry = undefined;
  if (next.phase === "running") {
    expiry = setTimeout(() => emit({ phase: "over" }), Math.max(0, next.until - Date.now()));
  }
  for (const listener of listeners) listener();
}

function read(): Stored | null {
  try {
    const raw = window.localStorage.getItem(MINUTE_STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Stored) : {};
  } catch {
    return null;
  }
}

function write(value: Stored): boolean {
  try {
    window.localStorage.setItem(MINUTE_STORAGE_KEY, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/** Что лежит в хранилище, в виде состояния. `off` — ничего ещё не было. */
export function stateFromStored(stored: Stored, now: number): MinuteState {
  if (typeof stored.claim === "string" && stored.claim) return { phase: "claimed", claim: stored.claim };
  if (typeof stored.token === "string" && typeof stored.until === "number") {
    if (now >= stored.until) return { phase: "over" };
    const from = typeof stored.from === "number" ? stored.from : stored.until - 60_000;
    return { phase: "running", token: stored.token, from, until: stored.until };
  }
  return OFF;
}

async function openWindow(): Promise<void> {
  try {
    const response = await fetch("/api/minute", { method: "POST" });
    if (!response.ok) return;
    const data = (await response.json()) as { token?: unknown; seconds?: unknown };
    if (typeof data.token !== "string" || typeof data.seconds !== "number" || data.seconds <= 0) return;
    // Отсчёт — от ответа сервера: время, пока шёл запрос, у человека не отнимаем.
    const from = Date.now();
    const until = from + data.seconds * 1000;
    // Пока шёл запрос, другая вкладка могла успеть первой — её минута и есть наша.
    const again = read();
    if (again && stateFromStored(again, Date.now()).phase !== "off") {
      emit(stateFromStored(again, Date.now()));
      return;
    }
    if (!write({ token: data.token, from, until })) return;
    emit({ phase: "running", token: data.token, from, until });
  } catch {
    // Нет сети или сервер молчит — минуты не будет, гарантия двадцати секунд остаётся.
  }
}

/**
 * Запустить минуту, если человек здесь впервые. Вызывается из кнопки чата,
 * которая стоит в раскладке каждой страницы; повторные вызовы ничего не делают.
 */
export function startMinute(): void {
  if (started || typeof window === "undefined") return;
  started = true;

  const stored = read();
  if (stored === null) return;

  // Другая вкладка открыла минуту или закрепила скидку — видим это и здесь.
  window.addEventListener("storage", (event) => {
    if (event.key !== MINUTE_STORAGE_KEY) return;
    const next = read();
    if (next) emit(stateFromStored(next, Date.now()));
  });

  const known = stateFromStored(stored, Date.now());
  if (known.phase !== "off") {
    emit(known);
    return;
  }

  // Минута начинается, когда страницу видно: вкладка, открытая в фоне,
  // не должна сжечь её, пока человек читает другое.
  if (document.visibilityState === "visible") {
    void openWindow();
    return;
  }
  const onVisible = () => {
    if (document.visibilityState !== "visible") return;
    document.removeEventListener("visibilitychange", onVisible);
    void openWindow();
  };
  document.addEventListener("visibilitychange", onVisible);
}

/** Сервер закрепил скидку — запоминаем навсегда для этого браузера. */
export function keepClaim(claim: string): void {
  const stored = (typeof window !== "undefined" && read()) || {};
  write({ ...stored, claim });
  emit({ phase: "claimed", claim });
}

export function subscribeMinute(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function minuteSnapshot(): MinuteState {
  return state;
}

export function serverMinuteSnapshot(): MinuteState {
  return OFF;
}

/** Что добавить к запросу чата: окно, пока идёт минута, или закрепление. */
export function minuteFields(current: MinuteState): { minute?: string; claim?: string } {
  if (current.phase === "running") return { minute: current.token };
  if (current.phase === "claimed") return { claim: current.claim };
  return {};
}

/** Ссылка на бота с окном: `?start=mn_…_ru`. Язык — чтобы бот ответил на языке сайта. */
export function telegramMinuteUrl(base: string, token: string, locale: string): string {
  return `${base}?start=${token}_${locale}`;
}

/** Секунды — в «0:47». */
export function clock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}
