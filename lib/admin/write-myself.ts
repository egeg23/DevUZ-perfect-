import { whatsappLink } from "@/lib/admin/outreach";
import type { Role } from "@/lib/admin/roles";

/**
 * «Напишу сам — не отправлять»: снять письмо с очереди рабочего аккаунта и
 * написать клиенту самому.
 *
 * Владелец, 07.10.2026: «есть n-ое количество людей, которым бот должен
 * отправить письмо, но я хочу отправить им сам, — как отменить отправку
 * ботом?» — и на предложение кнопки: «добавь эту кнопку».
 *
 * Раньше снять письмо с очереди можно было только в панели и только по
 * одному — «Связался сам» в карточке. В Telegram после «📤 Отправить через
 * бота» такой кнопки не было вовсе, а когда Telegram ограничивает рабочий
 * аккаунт на сутки, в очереди за ним стоит десяток писем, и каждое —
 * отдельное нажатие.
 *
 * Действие — то же, что «Связался сам» (markSelfContacted): письмо не
 * уходит, карточка становится «отправлено» по ручному маршруту, касание
 * записывается на того, кто нажал, — писать клиенту будет он.
 */

/** Кнопка под карточкой в очереди. Бот пишет по-русски. */
export const WRITE_MYSELF_BUTTON = "✋ Напишу сам — не отправлять";

/** Что встаёт на месте кнопки, когда письмо снято. */
export const WRITE_MYSELF_DONE = "✋ Снято с очереди · пишете сами";

/** Пометка в карточке: откуда отметка «связался сам». */
export const WRITE_MYSELF_NOTE = "Напишу сам — снято с очереди бота";

/** `tp:own:<id>` — 43 байта, в предел Telegram (64) влезает. */
export const writeMyselfCallback = (prospectId: string): string => `tp:own:${prospectId}`;

/** Сколько писем панель снимает одним нажатием — с запасом на всю очередь. */
export const WRITE_MYSELF_MAX = 100;

/** id формы в панели: галочки стоят в карточках, а кнопка — над списком. */
export const WRITE_MYSELF_FORM = "write-myself";

/**
 * Кто может снять письмо с очереди. Менеджер — только своё: чужое письмо,
 * снятое им, стало бы его касанием, а коллега так и не узнал бы, что
 * клиенту написал кто-то другой. Руководитель и владелец — любое, в том
 * числе письмо автопрогона: оно ничьё, пока клиент не ответил, и забрать
 * его себе — их решение, а не «кто первый нажал».
 */
export function mayWriteMyself(
  p: { status: string; claimed_by: string | null },
  staff: { id: string; role: Role },
): boolean {
  if (p.status !== "sending") return false;
  if (staff.role === "admin" || staff.role === "head") return true;
  return p.claimed_by === staff.id;
}

/**
 * Что бот пишет после нажатия: кому писать и текст, который нажатием
 * копируется. Без него человек искал бы письмо в карточке выше — а на
 * телефоне это лишняя прокрутка, и ровно на ней письма и не отправляют.
 */
export function writeMyselfNote(
  p: { target: string | null; target_kind?: string | null; message: string | null },
  esc: (s: string) => string,
): string {
  const lines = ["✋ <b>Бот это письмо не отправит.</b> Напишите клиенту сами — со своего аккаунта, в WhatsApp или позвоните."];
  if (p.target) lines.push("", `Кому: ${esc(p.target)}`);
  if (p.message?.trim()) lines.push("", `<code>${esc(p.message.trim())}</code>`, "", "Нажмите на текст — он скопируется.");
  lines.push(
    "",
    "Касание засчитано вам. Ответ клиента придёт вам лично: перенесите его в карточку в панели — поле «Что ответил клиент», и модель подскажет, что ответить.",
  );
  return lines.join("\n");
}

/** Ссылка, по которой открыть переписку с готовым текстом: Telegram по @адресу, WhatsApp по номеру. */
export function writeMyselfLink(p: { target: string | null; message: string | null }): { text: string; url: string } | null {
  const target = p.target?.trim();
  if (!target) return null;
  if (target.startsWith("@")) return { text: `Открыть ${target} в Telegram ↗`, url: `https://t.me/${target.slice(1)}` };
  if (/^\+?\d[\d\s()-]{6,}$/.test(target)) return { text: "WhatsApp с готовым текстом ↗", url: whatsappLink(target, p.message ?? "") };
  return null;
}
