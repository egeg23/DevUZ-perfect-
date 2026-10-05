import type { MessageProblem } from "@/lib/admin/outreach";

/**
 * Отказы кнопок «Касаний» — кодами, а не русским текстом.
 *
 * Панель на трёх языках: действие кладёт в адрес `?e=<код>`, а страница
 * берёт слова из словаря на языке того, кто смотрит
 * (content/admin-panel/prospect.ts). Русская строка `why` в результатах
 * outreach-store остаётся — её показывает бот в Telegram и пишут логи.
 *
 * Текст по совпадению не переводится никогда: код рождается там же, где
 * отказ, и не зависит от того, как отказ сформулирован по-русски.
 */
export const TOUCH_ERRORS = [
  // Почему писать нельзя вовсе (lib/admin/outreach → canContact).
  "no_way",
  "nothing_to_say",
  "already",
  // База и карточка.
  "db",
  "gone",
  "touch_gone",
  // Модель.
  "no_key",
  "no_niche",
  "model_empty",
  // Проверка сайта по факту (lib/audit/verify.ts).
  "not_verified",
  "nothing_confirmed",
  "model_billing",
  "model_auth",
  "model_limit",
  "model_down",
  // Отправка и отметки.
  "problems",
  "queue_failed",
  "already_marked",
  "mark_failed",
  "bot_sent",
  "empty_answer",
  "own_message",
  // «Клиент отказался» / «Игнорирует».
  "unknown_reason",
  "closed_refused",
  "closed_ignored",
  "already_closed",
  "still_queued",
  "not_touched",
  "not_yours",
  // Непредвиденное: дефект показывается как есть — прятать его нельзя.
  "defect",
] as const;

export type TouchError = (typeof TOUCH_ERRORS)[number];

export function isTouchError(value: string): value is TouchError {
  return (TOUCH_ERRORS as readonly string[]).includes(value);
}

/** Что пришло из lib: код, проблемы письма и текст дефекта. */
export type TouchFail = {
  code: TouchError;
  problems?: readonly MessageProblem[];
  /** Текст исключения — только у `defect`. */
  detail?: string;
};

/** Проблема письма в адресе: код и подстановки, без русского текста. */
export type ProblemRef = { code: string; args: (string | number)[] };

/**
 * Значение `?e=` (до encodeURIComponent).
 *
 * `problems:[["short",40],["no_host","mebel.uz"]]` — проверка письма с
 * подстановками; `defect:<текст>` — исключение как есть; иначе — код.
 */
export function touchErrorParam(fail: TouchFail): string {
  if (fail.code === "problems" && fail.problems?.length) {
    return `problems:${JSON.stringify(fail.problems.map((p) => [p.code, ...(p.args ?? [])]))}`;
  }
  if (fail.code === "defect") return `defect:${(fail.detail ?? "").slice(0, 300)}`;
  return fail.code;
}

export type ParsedTouchError = { code: TouchError; problems: ProblemRef[]; detail: string };

/**
 * `?e=` обратно. Чужое и старое (русский текст из прежних ссылок) —
 * дефектом с текстом как есть: лучше показать непонятное, чем ничего.
 */
export function parseTouchError(raw: string | undefined | null): ParsedTouchError | null {
  if (!raw) return null;
  if (isTouchError(raw)) return { code: raw, problems: [], detail: "" };
  if (raw.startsWith("problems:")) {
    try {
      const list = JSON.parse(raw.slice("problems:".length)) as unknown;
      if (Array.isArray(list)) {
        const problems = list
          .filter((p): p is unknown[] => Array.isArray(p) && typeof p[0] === "string")
          .slice(0, 12)
          .map(([code, ...args]) => ({
            code: String(code),
            args: args.filter((a): a is string | number => typeof a === "string" || typeof a === "number"),
          }));
        return { code: "problems", problems, detail: "" };
      }
    } catch {
      // Сломанный JSON — ниже, как дефект.
    }
  }
  const detail = raw.startsWith("defect:") ? raw.slice("defect:".length) : raw;
  return { code: "defect", problems: [], detail: detail.slice(0, 300) };
}
