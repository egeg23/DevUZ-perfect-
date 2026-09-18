import type { RouteKind } from "@/lib/admin/outreach";

/**
 * Кто на том конце: человек, бот или канал.
 *
 * Отдельным файлом и без единого обращения к сети намеренно. Спросить у
 * телеграма может только скаут — сессия живёт там, — но решение «писать или
 * не писать» разбирать по ответу MTProto прямо в цикле отправки значит
 * никогда его не проверить: чтобы прогнать такую ветку тестом, пришлось бы
 * поднимать телеграм. Здесь ответ уже получен и разбирается как обычный
 * объект, а скаут только приносит его и исполняет приговор.
 *
 * Зачем это вообще нужно: первые полсотни касаний ушли в каналы и ботов.
 * Отличить их по адресу нельзя — @muradbuildings и @ivan выглядят одинаково,
 * а разница в том, что первому написать физически невозможно. Знает об этом
 * только телеграм, и спросить его надо до отправки, а не узнать из ошибки.
 */

export type Unreachable = "bot" | "channel" | "not_found";

export type PeerVerdict = { ok: true; userId: string } | { ok: false; why: Unreachable };

/** Ответ contacts.resolveUsername, каким его отдаёт библиотека. */
type Resolved = {
  peer?: { className?: string } | null;
  users?: readonly { id?: unknown; bot?: boolean; deleted?: boolean }[];
} | null;

/** Ответ contacts.importContacts. */
type Imported = {
  imported?: readonly { userId?: unknown }[];
  users?: readonly { id?: unknown; bot?: boolean; deleted?: boolean }[];
} | null;

/**
 * Приговор по @адресу.
 *
 * `PeerUser` — единственный вид, которому можно написать в личку. Всё
 * остальное — `PeerChannel` и `PeerChat` — это канал или группа: телеграм
 * ответит на такую отправку CHAT_WRITE_FORBIDDEN, и до появления этой
 * проверки именно так девять касаний из четырнадцати и заканчивались.
 */
export function verdictForHandle(resolved: Resolved): PeerVerdict {
  const peer = resolved?.peer;
  if (!peer?.className) return { ok: false, why: "not_found" };
  if (peer.className !== "PeerUser") return { ok: false, why: "channel" };

  const user = resolved?.users?.[0];
  if (!user || user.id === undefined || user.id === null) return { ok: false, why: "not_found" };
  if (user.bot) return { ok: false, why: "bot" };
  // Удалённый аккаунт формально существует и даже принимает сообщения —
  // просто их никто никогда не прочитает.
  if (user.deleted) return { ok: false, why: "not_found" };

  return { ok: true, userId: String(user.id) };
}

/**
 * Приговор по номеру.
 *
 * `imported` пуст — значит на этот номер аккаунта нет: телеграм ищет по
 * своей базе и молча возвращает пустоту, когда не нашёл. Это не ошибка, а
 * ответ, и он означает «дальше руками».
 */
export function verdictForPhone(imported: Imported): PeerVerdict {
  const first = imported?.imported?.[0];
  const users = imported?.users ?? [];
  const id = first?.userId ?? users[0]?.id;
  if (id === undefined || id === null) return { ok: false, why: "not_found" };

  const user = users.find((u) => String(u.id) === String(id)) ?? users[0];
  if (user?.bot) return { ok: false, why: "bot" };
  if (user?.deleted) return { ok: false, why: "not_found" };

  return { ok: true, userId: String(id) };
}

/**
 * Почему не вышло — так, как это прочитает менеджер в карточке.
 *
 * Текст зависит от маршрута: «не нашёлся» по адресу и «не нашёлся» по номеру
 * — разные новости. В первом случае адрес на сайте устарел, во втором номер
 * просто не привязан к телеграму, и это самый обычный случай.
 */
export function unreachableText(why: Unreachable, kind: RouteKind): string {
  if (why === "bot") return "По этому адресу отвечает бот, а не человек. Ему писать незачем.";
  if (why === "channel") return "Это канал или группа — в них нельзя написать в личку.";
  return kind === "phone"
    ? "На этот номер телеграма нет. Остаётся WhatsApp или звонок."
    : "Телеграм не нашёл такой аккаунт: адрес на сайте устарел.";
}
