import type { MessageProblem } from "@/lib/admin/outreach";
import type { EditError } from "@/lib/admin/outreach-edit-request";
import { mayEditTouch } from "@/lib/admin/outreach-edit-request";
import type { Role } from "@/lib/admin/roles";
import { mayWriteMyself } from "@/lib/admin/write-myself";

/**
 * «✏️ Изменить текст» под карточкой касания в боте студии.
 *
 * Владелец, 16.10.2026: «можем ли мы сделать как в панели, чтобы через бота
 * можно было редактировать текст?» Менеджер читает порцию с телефона, видит
 * неудачную фразу — и раньше шёл в панель только ради неё.
 *
 * Как работает: нажал — бот присылает текущий текст (нажатием копируется) и
 * просит прислать исправленный ответом на это сообщение. Какой карточке
 * ответ, бот знает по номеру сообщения-просьбы (таблица bot_text_edits,
 * живёт сутки). Проверки — те же, что у панели, своих нет:
 *
 * - карточка до отправки (new / contacting) — sendProblems, как у кнопки
 *   «Отправить» в панели: с этим текстом «📤 Отправить через бота» и
 *   отправит, поэтому проверка та же целиком;
 * - письмо в очереди бота (sending) — letterEditProblems, как у
 *   «Исправить» в панели для письма, которое ждёт ответа;
 * - ушло «Здравствуйте» или само письмо (sent) — requestEdit из
 *   outreach-edit-request: тот же путь, что у «Исправить» в панели.
 *
 * Права — как у соседних кнопок: карточка порции — своя (у руководителя и
 * владельца — любая), письмо в очереди — mayWriteMyself, отправленное —
 * mayEditTouch.
 */

/** Кнопки бота — по-русски. */
export const EDIT_BUTTON = "✏️ Изменить текст";

/** `tp:edit:<uuid>` — 44 байта, в предел Telegram (64) влезает. */
export const editCallback = (prospectId: string): string => `tp:edit:${prospectId}`;

/** Сколько живёт просьба: ответ на вчерашнюю бот не примет. */
export const EDIT_TTL_MS = 24 * 3600_000;

/** Что сейчас с касанием — от этого и путь правки, и право. */
export type EditStage = "card" | "queued" | "sent" | "closed";

export function editStage(p: { status: string; message: string | null }): EditStage {
  if (p.status === "new" || p.status === "contacting") return p.message?.trim() ? "card" : "closed";
  if (p.status === "sending") return p.message?.trim() ? "queued" : "closed";
  if (p.status === "sent") return "sent";
  return "closed";
}

/**
 * Можно ли этому человеку править текст этой карточки.
 * `ownsCard` — карточка в его порции или потоке на сегодня (portionSource).
 */
export function mayEditFromBot(
  p: { status: string; message: string | null; claimed_by: string | null; touched_by: string | null; handled_by?: string | null },
  staff: { id: string; role: Role },
  ownsCard: boolean,
): boolean {
  const boss = staff.role === "admin" || staff.role === "head";
  switch (editStage(p)) {
    case "card":
      return boss || ownsCard;
    case "queued":
      return mayWriteMyself(p, staff);
    case "sent":
      return mayEditTouch(p, staff);
    default:
      return false;
  }
}

/** Просьба прислать исправленный текст. */
export function askText(p: { label: string | null; host: string | null; message: string | null }, esc: (s: string) => string): string {
  const title = p.label || p.host || "компания без сайта";
  return [
    `✏️ <b>Текст для «${esc(title)}»</b>`,
    "",
    `<code>${esc((p.message ?? "").trim())}</code>`,
    "",
    "Нажмите на текст — он скопируется. Поправьте и пришлите исправленный <b>ответом на это сообщение</b>. Проверка — та же, что в панели перед отправкой. Просьба действует сутки.",
  ].join("\n");
}

/** Подсказка в поле ввода, пока Telegram ждёт ответа. До 64 знаков. */
export const ASK_PLACEHOLDER = "Исправленный текст письма";

/** Отказы — словами, бот пишет по-русски. */
export const REFUSAL = {
  stale: "Эта просьба устарела — прошло больше суток. Нажмите «✏️ Изменить текст» под карточкой ещё раз.",
  notYours: "Эту правку начинал другой человек — ваш ответ бот не принял.",
  forbidden: "Править этот текст может тот, чья это карточка, руководитель или владелец.",
  gone: "Текст уже не изменить: письмо ушло клиенту или карточку закрыли. Откройте её в панели.",
  empty: "Пришлите текст словами — пустое сообщение не сохранить.",
  same: "Текст тот же, что был, — менять нечего.",
  offline: "Не получилось сохранить — попробуйте через минуту или в панели.",
} as const;

/** Что не так с текстом — теми же словами, что в панели (MessageProblem.text). */
export function problemsReply(problems: readonly MessageProblem[], esc: (s: string) => string): string {
  return [
    "❌ <b>Текст не сохранён</b> — карточка осталась прежней. Что поправить:",
    "",
    ...problems.map((p) => `• ${esc(p.text)}`),
    "",
    "Поправьте и пришлите ещё раз ответом на сообщение с текстом выше.",
  ].join("\n");
}

/** Отказ requestEdit (письмо уже у клиента) — словами. */
export function editErrorReply(reason: EditError): string {
  switch (reason) {
    case "forbidden":
      return REFUSAL.forbidden;
    case "empty":
      return REFUSAL.empty;
    case "same":
      return REFUSAL.same;
    case "too_long":
      return "Текст не помещается в одно сообщение — сократите.";
    case "too_late":
      return "Telegram даёт править сообщение 48 часов после отправки — это время прошло.";
    case "hello":
      return "Приветствие не правится: до ответа клиента ему уходит только оно.";
    case "offline":
      return REFUSAL.offline;
    default:
      return REFUSAL.gone;
  }
}

/** Просьба ещё действует. */
export function askFresh(createdAt: string, now = Date.now()): boolean {
  const at = Date.parse(createdAt);
  return Number.isFinite(at) && now - at <= EDIT_TTL_MS;
}
