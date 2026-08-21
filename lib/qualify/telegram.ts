import { priorityBadge } from "@/lib/qualify/scoring";
import type { ChatMessage, ContactKind, ScoredLead } from "@/lib/qualify/types";
import { localeLabel } from "@/lib/i18n";

const API = "https://api.telegram.org/bot";

/** Экранирование под parse_mode: HTML — иначе имя с «<» ломает всё сообщение. */
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Определяет тип контакта по тому, как он записан.
 *
 * Модель присылает свою классификацию, но полагаться только на неё нельзя:
 * ошибка здесь превращает рабочую ссылку в мёртвую, а менеджер в этот момент
 * уже нажал «Взять в работу» и ждёт, что чат откроется.
 */
export function detectContactKind(handle: string): ContactKind {
  const value = handle.trim();
  if (!value) return "none";
  if (value.includes("@") && value.includes(".") && !value.startsWith("@")) return "email";
  if (/t\.me\//i.test(value) || value.startsWith("@")) return "telegram";
  // Телефон: достаточно цифр и нет букв. Скобки, дефисы и пробелы обычны.
  const digits = value.replace(/\D/g, "");
  if (digits.length >= 7 && !/[a-zA-Zа-яА-Я]/.test(value)) return "phone";
  return "telegram";
}

/**
 * Превращает контакт в ссылку, по которой открывается диалог в один тап.
 *
 * Это не украшение. Менеджер читает карточку с телефона: скопировать ник,
 * открыть поиск, вставить, найти — четыре действия, на каждом из которых
 * лид может подождать ещё пять минут.
 */
function contactLink(lead: ScoredLead): { label: string; url: string | null } {
  const raw = lead.contact_handle.trim();
  if (!raw) return { label: "контакт не оставлен", url: null };

  const kind = lead.contact_kind && lead.contact_kind !== "none"
    ? lead.contact_kind
    : detectContactKind(raw);

  if (kind === "telegram") {
    const username = raw.replace(/^https?:\/\/t\.me\//i, "").replace(/^@/, "").trim();
    return { label: `@${username}`, url: `https://t.me/${encodeURIComponent(username)}` };
  }
  if (kind === "phone") {
    const digits = raw.replace(/[^\d+]/g, "");
    return { label: raw, url: `tel:${digits}` };
  }
  if (kind === "email") {
    return { label: raw, url: `mailto:${raw}` };
  }
  return { label: raw, url: null };
}

function block(title: string, lines: string[]): string | null {
  const body = lines.filter((l) => l && l.trim()).map((l) => `• ${esc(l)}`);
  return body.length ? `\n<b>${title}</b>\n${body.join("\n")}` : null;
}

/** Telegram отклоняет сообщения длиннее 4096 символов. */
const TELEGRAM_LIMIT = 4096;

/**
 * Обрезает по границе строки, не разрывая HTML-тег.
 *
 * Оборванный посередине тег Telegram не принимает целиком — то есть попытка
 * сэкономить символы обернулась бы недоставленным лидом. Режем по последнему
 * переводу строки: разметка в брифе не пересекает строки, поэтому такой рез
 * всегда оставляет валидный HTML.
 */
function clampHtml(text: string, limit = TELEGRAM_LIMIT): string {
  if (text.length <= limit) return text;
  const notice = "\n\n<i>…бриф сокращён, полная версия — в базе лидов</i>";
  const cut = text.slice(0, limit - notice.length);
  const boundary = cut.lastIndexOf("\n");
  return (boundary > 0 ? cut.slice(0, boundary) : cut) + notice;
}

/**
 * Бриф по лиду для отдела продаж.
 *
 * Порядок продиктован тем, как его читают: менеджер открывает уведомление на
 * телефоне и должен за несколько секунд понять, кому писать, чего человек
 * хочет и с какой фразы начать. Поэтому контакт и суть запроса идут первыми,
 * заготовка сообщения — сразу следом, а формальная квалификация уходит вниз:
 * она нужна руководителю для отчёта, а не продавцу перед первым сообщением.
 */
export function formatLeadBrief(lead: ScoredLead): string {
  const contact = contactLink(lead);
  const who = [lead.contact_name, lead.company].filter(Boolean).map(esc).join(" · ");

  const parts: string[] = [
    `${priorityBadge(lead)}  ·  <b>${lead.grade}</b>  ·  ${lead.score}/100`,
    "",
    `👤 ${who || "имя не названо"}`,
    contact.url
      ? `💬 <a href="${contact.url}">Написать: ${esc(contact.label)}</a>`
      : `💬 ${esc(contact.label)}`,
    `🌐 Диалог шёл на: ${localeLabel[lead.locale]}`,
    "",
    `<b>ЧТО ХОЧЕТ</b>`,
    esc(lead.summary.request || "не сформулировано"),
  ];

  if (lead.opening_line?.trim()) {
    // Отдельным блоком с моноширинным начертанием: в Telegram такой текст
    // копируется одним нажатием, и менеджеру остаётся только отправить.
    parts.push("", "<b>С ЧЕГО НАЧАТЬ</b>", `<code>${esc(lead.opening_line.trim())}</code>`);
  }

  const told = block("УЖЕ СКАЗАНО КЛИЕНТУ — не противоречить", lead.already_told ?? []);
  if (told) parts.push(told);
  const avoid = block("НЕ ПЕРЕСПРАШИВАТЬ", lead.avoid_asking ?? []);
  if (avoid) parts.push(avoid);

  if (lead.notes?.trim()) {
    parts.push("", `<b>НА ЧТО ОБРАТИТЬ ВНИМАНИЕ</b>`, esc(lead.notes.trim()));
  }

  const s = lead.summary;
  parts.push(
    "",
    "<b>КВАЛИФИКАЦИЯ</b>",
    `<b>Ниша:</b> ${esc(s.niche)}`,
    `<b>Экспертность:</b> ${esc(s.expertise)}`,
    `<b>Бюджет:</b> ${esc(s.budget)}`,
    `<b>ЛПР:</b> ${esc(s.authority)}`,
    `<b>Потребность:</b> ${esc(s.need)}`,
    `<b>Срочность:</b> ${esc(s.timing)}`,
    "",
    `<code>ICP: Tier ${lead.niche_tier} · ${lead.expertise}   BANT: ${lead.budget} · ${lead.authority} · ${lead.need} · ${lead.timing}</code>`,
  );

  return clampHtml(parts.join("\n"));
}

/** Расшифровка диалога отдельным сообщением — на случай, если нужен контекст. */
export function formatTranscript(messages: ChatMessage[]): string {
  const body = messages
    .map((m) => `${m.role === "user" ? "👤" : "🤖"} ${esc(m.content)}`)
    .join("\n\n");
  return `<b>Полная переписка</b>\n\n${body}`;
}

async function call(method: string, payload: unknown): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return false;

  try {
    const response = await fetch(`${API}${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      console.error("telegram", method, response.status, await response.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error("telegram", method, error);
    return false;
  }
}

export async function sendMessage(chatId: number | string, text: string): Promise<boolean> {
  return call("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
  });
}

/**
 * Отправляет бриф в чат отдела продаж.
 *
 * Возвращает false, а не бросает: если Telegram недоступен, посетитель не
 * должен увидеть ошибку — лид уже сохранён в базе, и менеджер его не потеряет.
 */
export async function sendLead(
  lead: ScoredLead,
  transcript: ChatMessage[],
  leadId: string,
): Promise<boolean> {
  const chatId = process.env.TELEGRAM_SALES_CHAT_ID;
  if (!chatId) return false;

  // Архивным лидам уведомление приходит беззвучно: горячие теряются в потоке
  // отказов, если каждый отказ тоже звенит.
  const silent = lead.priority === "nurture" || lead.priority === "archive";

  const sent = await call("sendMessage", {
    chat_id: chatId,
    text: formatLeadBrief(lead),
    parse_mode: "HTML",
    disable_notification: silent,
    link_preview_options: { is_disabled: true },
    reply_markup: {
      inline_keyboard: [
        [
          { text: "✅ Взять в работу", callback_data: `take:${leadId}` },
          { text: "🗄 Отклонить", callback_data: `drop:${leadId}` },
        ],
      ],
    },
  });

  if (sent && transcript.length) {
    // Telegram режет сообщения на 4096 символах. Обрезаем сами и говорим об
    // этом прямо: молча оборванная переписка выглядит как потерянные данные.
    const full = formatTranscript(transcript);
    const text =
      full.length > 3900 ? `${full.slice(0, 3900)}\n\n<i>…переписка обрезана</i>` : full;

    await call("sendMessage", {
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_notification: true,
      link_preview_options: { is_disabled: true },
    });
  }

  return sent;
}

export async function answerCallback(id: string, text: string): Promise<void> {
  await call("answerCallbackQuery", { callback_query_id: id, text });
}

/**
 * Отмечает бриф как разобранный, переписывая только кнопки под ним.
 *
 * Соблазн был дописать статус в текст через editMessageText, но Telegram
 * отдаёт в колбэке `message.text` уже без разметки: ссылка на контакт,
 * жирные заголовки и блок с заготовкой фразы превратились бы в плоский
 * текст — то есть кнопка «Взять в работу» ломала бы ровно тот бриф, ради
 * которого её нажали. Правка клавиатуры оставляет сообщение нетронутым.
 */
export async function markBriefHandled(
  chatId: number | string,
  messageId: number,
  status: string,
): Promise<void> {
  await call("editMessageReplyMarkup", {
    chat_id: chatId,
    message_id: messageId,
    reply_markup: { inline_keyboard: [[{ text: status, callback_data: "noop" }]] },
  });
}
