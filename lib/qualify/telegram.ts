import { priorityBadge } from "@/lib/qualify/scoring";
import type { ChatMessage, ContactKind, ScoredLead } from "@/lib/qualify/types";
import { localeLabel } from "@/lib/i18n";

/**
 * Адрес Bot API.
 *
 * Вынесен в переменную окружения ради проверок: поведение бота — что именно
 * он отвечает случайному человеку и что показывает только отделу продаж —
 * иначе не проверить, не написав ему руками. Подменяется на локальный
 * заглушечный сервер в тестах, в проде остаётся адрес по умолчанию.
 */
// `||`, а не `??`: docker-compose передаёт незаданную переменную пустой
// строкой, а пустая строка — не адрес, и `??` её бы пропустил.
const API = `${process.env.TELEGRAM_API_BASE || "https://api.telegram.org"}/bot`;

/**
 * Экранирование под parse_mode: HTML.
 *
 * Кавычка здесь не для красоты: значение попадает и в текст, и в атрибут
 * href. Без неё контакт вида `"Иван" <ivan@mail.ru>` — а это ровно то, что
 * вставляется копированием из почтового клиента — закрывает атрибут раньше
 * времени, Telegram отклоняет сообщение целиком, и лид не доходит вообще.
 */
export function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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
/**
 * Что считается допустимым значением для ссылки.
 *
 * Проверяем по белому списку, а не чистим по чёрному. Контакт пишет
 * посетитель, то есть это недоверенный ввод, попадающий прямо в атрибут
 * href: попытка «вырезать опасное» рано или поздно пропустит форму, о
 * которой мы не подумали. Не прошло проверку — ссылки просто не будет,
 * контакт покажется текстом, и менеджер скопирует его руками.
 */
const TELEGRAM_USERNAME = /^[A-Za-z0-9_]{4,32}$/;
const PHONE_E164 = /^\+?\d{7,15}$/;
const EMAIL = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/;

function contactLink(lead: ScoredLead): { label: string; url: string | null } {
  const raw = lead.contact_handle.trim();
  if (!raw) return { label: "контакт не оставлен", url: null };

  // Определяем по самой строке, а не по тому, что назвала модель. Она
  // ошибается: в живом диалоге ник @bird_dasha был помечен как почта. Разбор
  // строки детерминирован и опирается на то, что человек реально написал,
  // поэтому именно он и решает. Значение от модели остаётся запасным — на
  // случай, когда разбор ничего не распознал.
  const detected = detectContactKind(raw);
  const kind = detected !== "none"
    ? detected
    : (lead.contact_kind && lead.contact_kind !== "none" ? lead.contact_kind : "none");

  if (kind === "telegram") {
    const username = raw.replace(/^https?:\/\/t\.me\//i, "").replace(/^@/, "").trim();
    return TELEGRAM_USERNAME.test(username)
      ? { label: `@${username}`, url: `https://t.me/${username}` }
      : { label: raw, url: null };
  }

  if (kind === "phone") {
    const digits = raw.replace(/[^\d+]/g, "");
    return PHONE_E164.test(digits) ? { label: raw, url: `tel:${digits}` } : { label: raw, url: null };
  }

  if (kind === "email") {
    return EMAIL.test(raw) ? { label: raw, url: `mailto:${raw}` } : { label: raw, url: null };
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
export function formatLeadBrief(lead: ScoredLead, requestNo?: string): string {
  const contact = contactLink(lead);
  const who = [lead.contact_name, lead.company].filter(Boolean).map(esc).join(" · ");

  const parts: string[] = [
    `${priorityBadge(lead)}  ·  <b>${lead.grade}</b>  ·  ${lead.score}/100`,
    // Номер заявки клиент уже услышал в чате. Он же в шапке брифа: когда
    // человек напишет «я по заявке DZ-0821-K4M7», менеджер должен найти её
    // поиском по чату, а не листать ленту.
    ...(requestNo ? [`🧾 Заявка <code>${esc(requestNo)}</code>`] : []),
    "",
    `👤 ${who || "имя не названо"}`,
    contact.url
      // esc() и здесь, поверх проверки по белому списку: два независимых
      // барьера вместо одного, который однажды окажется дырявым.
      ? `💬 <a href="${esc(contact.url)}">Написать: ${esc(contact.label)}</a>`
      : `💬 <code>${esc(contact.label)}</code>`,
    // Это язык версии сайта, а не обязательно язык переписки: человек мог
    // открыть русскую страницу и писать по-узбекски. Формулировка честная,
    // чтобы менеджер не начал отвечать не на том языке, решив, что здесь
    // указан язык разговора.
    `🌐 Язык сайта: ${localeLabel[lead.locale]} · отвечайте на языке заготовки ниже`,
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
  requestNo?: string,
): Promise<boolean> {
  const chatId = process.env.TELEGRAM_SALES_CHAT_ID;
  if (!chatId) return false;

  // Архивным лидам уведомление приходит беззвучно: горячие теряются в потоке
  // отказов, если каждый отказ тоже звенит.
  const silent = lead.priority === "nurture" || lead.priority === "archive";

  const sent = await call("sendMessage", {
    chat_id: chatId,
    text: formatLeadBrief(lead, requestNo),
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

/**
 * Ответ ассистента клиенту в Telegram.
 *
 * Текст пишет модель, то есть в нём может оказаться что угодно — от угловых
 * скобок в имени тега до амперсанда в названии компании. При parse_mode HTML
 * Telegram отклоняет всё сообщение целиком, а не портит разметку: без
 * экранирования клиент получил бы молчание вместо ответа.
 *
 * Длинные ответы режутся по границе абзаца и уходят несколькими сообщениями:
 * обрезать реплику менеджера на полуслове хуже, чем прислать две.
 */
export async function sendPlain(chatId: number | string, text: string): Promise<boolean> {
  const chunks = splitForTelegram(text.trim());
  let ok = true;
  for (const chunk of chunks) {
    ok = (await sendMessage(chatId, esc(chunk))) && ok;
  }
  return ok;
}

function splitForTelegram(text: string, limit = 3500): string[] {
  if (text.length <= limit) return [text];

  const chunks: string[] = [];
  let rest = text;
  while (rest.length > limit) {
    const window = rest.slice(0, limit);
    // Ищем границу по абзацу, затем по предложению, и только потом рвём как
    // есть: у модели реплики короткие, так что до последнего варианта дело
    // доходить не должно.
    const cut =
      Math.max(window.lastIndexOf("\n\n"), window.lastIndexOf("\n")) > limit * 0.4
        ? Math.max(window.lastIndexOf("\n\n"), window.lastIndexOf("\n"))
        : window.lastIndexOf(". ") > limit * 0.4
          ? window.lastIndexOf(". ") + 1
          : limit;
    chunks.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) chunks.push(rest);
  return chunks;
}

/**
 * «Печатает…» в шапке чата.
 *
 * Telegram гасит индикатор через пять секунд, поэтому для долгого ответа его
 * приходится повторять. Без него пауза в несколько секунд читается как
 * «бот не работает», и человек пишет второе сообщение поверх первого.
 */
export function typingIndicator(chatId: number | string): () => void {
  const ping = () => void call("sendChatAction", { chat_id: chatId, action: "typing" });
  ping();
  const timer = setInterval(ping, 4000);
  return () => clearInterval(timer);
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
