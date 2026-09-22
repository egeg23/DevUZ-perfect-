import { channelLabel, contactLink } from "@/lib/contact";
import { originLines, usernameOf, type LeadOrigin } from "@/lib/qualify/origin";
import { priorityBadge } from "@/lib/qualify/scoring";
import type { ScoredLead } from "@/lib/qualify/types";
import { localeLabel } from "@/lib/i18n";
import { noticesOf, rememberNotices, type Notice } from "@/lib/qualify/notices";
import { siteUrl } from "@/lib/seo";

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

/** Ник в Telegram из оставленного контакта — или null, если контакт другой. */
function tgFromContact(lead: {
  contact_handle?: string | null;
  contact_kind?: string | null;
}): string | null {
  const view = contactLink({ contact_handle: lead.contact_handle, contact_kind: lead.contact_kind });
  return view.label.startsWith("@") ? view.label.slice(1) : null;
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
 * телефоне и должен за несколько секунд понять, стоит ли браться, чего человек
 * хочет и с какой фразы начать. Поэтому канал связи и суть запроса идут
 * первыми, заготовка сообщения — сразу следом, а формальная квалификация
 * уходит вниз: она нужна руководителю для отчёта, а не продавцу перед первым
 * сообщением.
 *
 * Самого контакта и переписки в брифе нет — они за ссылкой на карточку,
 * где их открытие остаётся в журнале. См. комментарий у строки канала.
 */
export function formatLeadBrief(
  lead: ScoredLead,
  requestNo?: string,
  cardUrl?: string | null,
  /** Готовый HTML над брифом: сумма заказа с витрины и кому он адресован. */
  heading?: string,
  /**
   * Откуда, когда и с какой страницы писал человек.
   *
   * Отдельным аргументом, а не полем лида: это факты канала, а не выводы
   * модели. Ник, страницу и время знает тот, кто принял разговор, — и
   * ошибиться в них невозможно, в отличие от всего, что заполняет модель.
   */
  origin?: LeadOrigin & { at?: string | number | Date },
): string {
  const who = [lead.contact_name, lead.company].filter(Boolean).map(esc).join(" · ");

  // Ник берётся сначала от канала (его прислал Telegram), потом — из
  // контакта, если человек назвал его сам. Разбор строки, а не поле от
  // модели: см. contactLink.
  const place: LeadOrigin = { ...origin, tgUsername: origin?.tgUsername ?? tgFromContact(lead) };
  const handle = usernameOf(place);

  const parts: string[] = [
    ...(heading ? [heading, ""] : []),
    `${priorityBadge(lead)}  ·  <b>${lead.grade}</b>  ·  ${lead.score}/100`,
    // Номер заявки клиент уже услышал в чате. Он же в шапке брифа: когда
    // человек напишет «я по заявке DZ-0821-K4M7», менеджер должен найти её
    // поиском по чату, а не листать ленту.
    ...(requestNo ? [`🧾 Заявка <code>${esc(requestNo)}</code>`] : []),
    "",
    `👤 ${who || "имя не названо"}`,
    // Канал — да, сам контакт — нет. Общий чат отдела продаж читают все, кто
    // в нём состоит, и читают навсегда: Telegram помнит историю, а вышедший
    // из компании человек уносит её в своём клиенте. Раскрытие контакта
    // должно оставлять след с именем и временем, а в чате следа не остаётся.
    // Поэтому здесь только то, что менеджеру нужно для решения, — писать
    // или звонить, — а ник и номер лежат в карточке за кнопкой.
    // Ник — да, телефон и почта — по-прежнему нет.
    //
    // Владелец: «указывай юзернейм, если он есть». Это осознанное
    // послабление к правилу «контакт только в карточке», а не отмена
    // правила: ник в Telegram человек и так показывает каждому, кому
    // пишет, а номер телефона — нет. Всё остальное открывается в
    // карточке, где остаётся след, кто и когда его посмотрел.
    `💬 ${esc(channelLabel(lead))}${handle ? ` · ${esc(handle)}` : ""} · контакт открывается в карточке`,
    // Когда, откуда и где — три вопроса владельца одной строкой каждый.
    ...originLines(place, origin?.at ?? Date.now()).map((line, i) => `${i === 0 ? "🕒" : "📍"} ${esc(line)}`),
    // Это язык версии сайта, а не обязательно язык переписки: человек мог
    // открыть русскую страницу и писать по-узбекски. Формулировка честная,
    // чтобы менеджер не начал отвечать не на том языке, решив, что здесь
    // указан язык разговора.
    `🌐 Язык сайта: ${localeLabel[lead.locale]} · отвечайте на языке заготовки ниже`,
    ...(cardUrl
      ? ["", `🔗 <a href="${esc(cardUrl)}">Карточка: контакт и переписка</a>`]
      : []),
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

/**
 * Сколько ждём ответа Bot API на один вызов.
 *
 * Без предела зависший вызов держал бы работу после ответа Telegram столько,
 * сколько живёт TCP-соединение через прокси, — минуты. Ссылка входа,
 * которую сотрудник ждёт прямо сейчас, столько ждать не может: лучше
 * оборвать и повторить один раз, чем молчать.
 */
const CALL_TIMEOUT_MS = 15_000;

/**
 * Ответ Bot API так, как он нужен вызывающему: дошло или нет, и если нет —
 * что именно сказал Telegram.
 *
 * Описание нужно ровно одному месту — кнопке входа в панель: отличить
 * «домен бота не привязан» от «сеть моргнула» можно только по тексту
 * ошибки, а не по факту неудачи. `description` пуст, когда ответа не было
 * вовсе (таймаут, прокси, оборванное соединение).
 */
type CallResult = {
  ok: boolean;
  description: string | null;
  /**
   * Номер отправленного сообщения, если это была отправка.
   *
   * Нужен карточке лида: она уходит всей команде, и чтобы после взятия
   * переписать кнопки у всех, надо знать, где лежит каждая копия.
   */
  messageId: number | null;
};

async function callRaw(method: string, payload: unknown): Promise<CallResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { ok: false, description: null, messageId: null };

  // Вторая попытка — только если первая оборвалась, не получив ответа:
  // сеть, прокси, таймаут. Ответ с ошибкой от Telegram не повторяем — он
  // будет тем же.
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await fetch(`${API}${token}/${method}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(CALL_TIMEOUT_MS),
      });
      if (!response.ok) {
        const body = await response.text();
        console.error("telegram", method, response.status, body);
        return { ok: false, description: body, messageId: null };
      }
      // Тело читаем только ради номера сообщения: не разобралось — отправка
      // от этого не перестала быть удачной.
      const data = (await response.json().catch(() => null)) as { result?: { message_id?: unknown } } | null;
      const id = data?.result?.message_id;
      return { ok: true, description: null, messageId: typeof id === "number" ? id : null };
    } catch (error) {
      console.error("telegram", method, `попытка ${attempt}`, error);
      if (attempt === 2) return { ok: false, description: null, messageId: null };
      await new Promise((resolve) => setTimeout(resolve, 1_000));
    }
  }
  return { ok: false, description: null, messageId: null };
}

async function call(method: string, payload: unknown): Promise<boolean> {
  return (await callRaw(method, payload)).ok;
}

/** Команда для меню бота: имя без слэша и короткое описание. */
export type BotCommand = { command: string; description: string };

/**
 * Меню команд. Без scope — для всех личек, с scope { type: "chat", chat_id }
 * — только для одного чата: так сотрудники видят /login, а клиенты нет.
 */
export async function setMyCommands(
  commands: BotCommand[],
  options: { scope?: { type: "chat"; chat_id: number }; language_code?: string } = {},
): Promise<boolean> {
  return call("setMyCommands", { commands, ...options });
}

export async function deleteMyCommands(scope: { type: "chat"; chat_id: number }): Promise<boolean> {
  return call("deleteMyCommands", { scope });
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
 * Кнопка под сообщением: ссылка, действие с полезной нагрузкой — или вход
 * в панель.
 *
 * `panel` — это путь внутри панели, а не готовый адрес: во что он
 * превратится, решается в момент отправки. Подробности — у `panelRow`.
 */
export type Button = { text: string } & (
  | { url: string }
  | { callback_data: string }
  | { panel: string }
);

/**
 * Работает ли кнопка входа: null — ещё не пробовали, false — Telegram её
 * не принимает.
 *
 * Кнопку login_url Bot API принимает только у бота, которому в BotFather
 * привязан домен (/setdomain). Пока это не сделано, сообщение с такой
 * кнопкой отклоняется **целиком** — то есть бриф по лиду не дошёл бы
 * вовсе. Ради удобства входа терять лиды нельзя, поэтому отказ
 * обрабатывается: кнопка превращается в обычную ссылку, сообщение уходит
 * повторно, а сюда записывается «больше не пробовать».
 *
 * Память живёт до перезапуска процесса. Так и задумано: домен привяжут —
 * ближайшая выкатка включит кнопки обратно сама, без переменных окружения
 * и без похода в код.
 */
let loginButtonWorks: boolean | null = null;

/** Адрес, по которому Telegram подпишет вход и приведёт человека. */
export function enterUrl(path: string): string {
  const clean = path.replace(/^\/admin\/?/, "").replace(/^\/+/, "");
  return clean ? `${siteUrl}/admin/enter/${clean}` : `${siteUrl}/admin/enter`;
}

/**
 * Превратить кнопки в то, что понимает Bot API.
 *
 * `login_url` — если домен привязан: Telegram спросит подтверждение один
 * раз на домен и дальше будет открывать панель сразу, дописав к адресу
 * подписанное «кто нажал». Иначе — обычная ссылка на ту же страницу: она
 * приведёт на вход, как и раньше, но ничего не сломает.
 */
function forTelegram(rows: Button[][]): unknown[][] {
  const login = loginButtonWorks !== false;
  return rows.map((row) =>
    row.map((button) =>
      "panel" in button
        ? login
          ? { text: button.text, login_url: { url: enterUrl(button.panel) } }
          : { text: button.text, url: `${siteUrl}${button.panel}` }
        : button,
    ),
  );
}

/** Есть ли в раскладке кнопка входа — значит, есть чем деградировать. */
function hasPanel(rows: Button[][]): boolean {
  return rows.some((row) => row.some((button) => "panel" in button));
}

/** Отказ Telegram про сам чат, а не про содержимое сообщения. */
function chatUnreachable(description: string): boolean {
  return /can't initiate conversation|chat not found|bot was blocked|user is deactivated|bot can't send messages|have no rights/i.test(
    description,
  );
}

/**
 * Отправить сообщение с кнопками, переживая непривязанный домен.
 *
 * Повтор без кнопки делается только тогда, когда Telegram **ответил**
 * ошибкой. Оборванное соединение оставляет `loginButtonWorks` как есть:
 * иначе одна моргнувшая сеть выключала бы вход по кнопке до следующей
 * выкатки.
 *
 * Возвращает номер сообщения: `null` — не дошло, `0` — дошло, но Telegram
 * номер не назвал. Отличать эти два случая нужно карточке лида: дошедшая
 * копия без номера — это всё ещё доставленный лид.
 */
async function postRows(
  chatId: number | string,
  text: string,
  rows: Button[][],
  extra: Record<string, unknown> = {},
): Promise<number | null> {
  const payload = () => ({
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
    reply_markup: { inline_keyboard: forTelegram(rows) },
    ...extra,
  });

  const first = await callRaw("sendMessage", payload());
  if (first.ok) {
    if (loginButtonWorks === null && hasPanel(rows)) loginButtonWorks = true;
    return first.messageId ?? 0;
  }
  if (loginButtonWorks === false || !hasPanel(rows) || !first.description) return null;

  /**
   * Недоступный чат — это не сломанная кнопка.
   *
   * Стало важным, когда карточка лида поехала не в один чат, а всей команде:
   * тому, кто боту ни разу не писал, Bot API отказывает всегда, и без этой
   * проверки первый же такой сотрудник навсегда переводил кнопку входа в
   * запасной режим — для всех и до перезапуска, — а в лог ложилась неправда
   * про непривязанный домен.
   */
  if (chatUnreachable(first.description)) return null;

  loginButtonWorks = false;
  console.error(
    "telegram: кнопку входа не приняли — привяжите домен боту (BotFather → /setdomain → devuz.studio). Отправляю обычной ссылкой.",
  );
  const second = await callRaw("sendMessage", payload());
  return second.ok ? (second.messageId ?? 0) : null;
}

/** Сообщение с несколькими рядами кнопок — например, позиция порции дня. */
export async function sendWithRows(
  chatId: number | string,
  text: string,
  rows: Button[][],
  extra: Record<string, unknown> = {},
): Promise<boolean> {
  return (await postRows(chatId, text, rows, extra)) !== null;
}

/**
 * То же сообщение, но с рядом кнопок.
 *
 * Ради напоминаний: разбирать их человек должен там, где он их читает.
 * Напоминание без кнопок означает «открой панель, найди лид, нажми
 * готово» — три действия вместо одного, и после третьего раза их
 * перестают делать вовсе.
 */
export async function sendWithButtons(
  chatId: number | string,
  text: string,
  buttons: Button[],
): Promise<boolean> {
  return sendWithRows(chatId, text, [buttons]);
}

/**
 * Отправляет бриф в чат отдела продаж.
 *
 * Возвращает false, а не бросает: если Telegram недоступен, посетитель не
 * должен увидеть ошибку — лид уже сохранён в базе, и менеджер его не потеряет.
 *
 * `to` переопределяет адресатов: бриф с витрины дороже порога уходит только
 * владельцу, а не в общий чат (см. lib/qualify/brief.ts). Несколько чатов —
 * несколько сообщений; доставлено, если дошло хотя бы одно.
 */
export async function sendLead(
  lead: ScoredLead,
  leadId: string,
  requestNo?: string,
  options: {
    to?: Array<string | number>;
    heading?: string;
    origin?: LeadOrigin & { at?: string | number | Date };
  } = {},
): Promise<boolean> {
  const targets = options.to?.length
    ? options.to.map(String)
    : [process.env.TELEGRAM_SALES_CHAT_ID].filter((value): value is string => Boolean(value));
  if (!targets.length) return false;

  // "unsaved" приходит, когда лид не записался в базу: ссылка на карточку
  // тогда ведёт в никуда, и честнее её не давать вовсе.
  const cardUrl = leadId && leadId !== "unsaved" ? `${siteUrl}/admin/leads/${leadId}` : null;

  // Архивным лидам уведомление приходит беззвучно: горячие теряются в потоке
  // отказов, если каждый отказ тоже звенит.
  const silent = lead.priority === "nurture" || lead.priority === "archive";

  const text = formatLeadBrief(lead, requestNo, cardUrl, options.heading, options.origin);

  const rows = leadRows(leadId, Boolean(cardUrl));

  /**
   * Всем сразу, а не по очереди.
   *
   * Пока адресат был один, разницы не было. Теперь их по числу команды — и
   * разговор с клиентом ждёт доставки, прежде чем бот скажет «передал
   * менеджеру». По очереди это секунда-три в обычный день и минуты, если
   * Telegram подвис: каждый вызов ждёт до пятнадцати секунд и повторяется.
   *
   * Общее у отправок одно — флаг кнопки входа, — и гонка за ним безвредна:
   * он решает только, как собрать кнопку, а каждая отправка при отказе
   * кнопки сама повторяется в запасном виде.
   */
  const results = await Promise.all(
    targets.map((chatId) => postRows(chatId, text, rows, { disable_notification: silent })),
  );
  const sent = results.some((id) => id !== null);

  // Где легли копии — чтобы потом, когда лид возьмут, погасить кнопки у
  // всех, а не только у нажавшего. Копии без номера запомнить нечем: это
  // доставленный лид, но его кнопки погаснут только у того, кто нажмёт.
  if (cardUrl) {
    await rememberNotices(
      leadId,
      targets.flatMap((chatId, i) => {
        const id = results[i];
        return id ? [{ chatId: String(chatId), messageId: id }] : [];
      }),
    );
  }

  // Стенограмма вторым сообщением сюда больше не уходит. Она читается в
  // карточке, где видно, кто её открывал: переписка — это всё, что человек
  // рассказал о своих деньгах, сроках и недовольстве прошлым подрядчиком,
  // и место такому тексту не в чате, откуда его нельзя ни отозвать, ни
  // потом узнать, кто его прочитал. Аргумент «нужен контекст» закрывается
  // ссылкой на карточку в самом брифе.
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
 * Кнопки под карточкой лида.
 *
 * Первый ряд — вход в карточку одним нажатием. Ссылка на карточку в тексте
 * остаётся: у того, кто уже сидит в панели, она открывается сразу. А у того,
 * кто читает уведомление с телефона, браузер внутри Telegram держит свои
 * куки отдельно, и обычная ссылка всегда приводила его на страницу входа.
 * Эта кнопка — тот же вход, но Telegram подтверждает, кто нажал, сам: см.
 * app/admin/enter.
 *
 * Отдельной функцией, потому что собирают её двое: отправка карточки и
 * возврат кнопок, когда лида отпустили обратно.
 */
function leadRows(leadId: string, withCard: boolean): Button[][] {
  return [
    ...(withCard ? [[{ text: "🔓 Открыть карточку", panel: `/admin/leads/${leadId}` }]] : []),
    [
      { text: "✅ Взять в работу", callback_data: `take:${leadId}` },
      { text: "🗄 Отклонить", callback_data: `drop:${leadId}` },
    ],
  ];
}

/**
 * Надпись вместо кнопок, когда лид разобран.
 *
 * Одна на Telegram и на панель: лида берут и там и там, и две разные
 * формулировки одного и того же события на соседних копиях карточки читались
 * бы как два разных события.
 */
export function handledLabel(
  action: "take" | "drop",
  staff: { username: string | null; display_name: string },
): string {
  const who = staff.username ? `@${staff.username}` : staff.display_name;
  return action === "take" ? `✅ В работе у ${who}` : `🗄 Отклонён — ${who}`;
}

/**
 * Переписать кнопки у всех копий карточки лида.
 *
 * Карточка уходит всей команде, каждому в личку. Раньше надпись «В работе у
 * …» появлялась только у того, кто нажал: остальные видели живые кнопки у
 * уже занятого лида и узнавали, что он занят, только нажав — а иногда уже
 * начав писать клиенту.
 *
 * `status` — что написать вместо кнопок; `null` — вернуть кнопки обратно:
 * лида отпустили, и он снова свободен.
 *
 * `except` — копия, которую уже переписал сам колбэк нажатия. Править её
 * второй раз тем же текстом Telegram не даёт: отвечает «сообщение не
 * изменилось», и в лог ложилась бы ошибка на каждое взятие.
 *
 * Правки идут разом, как и отправка, и ни одна не роняет остальные: копию
 * могли удалить, чат — закрыть, и это не повод оставлять живые кнопки у
 * всех прочих.
 */
export async function markLeadCards(
  leadId: string,
  status: string | null,
  except?: { chatId: number | string; messageId: number },
): Promise<void> {
  await editLeadCards(await noticesOf(leadId), leadId, status, except);
}

/** То же, но по уже известным копиям — без похода в базу. */
export async function editLeadCards(
  notices: readonly Notice[],
  leadId: string,
  status: string | null,
  except?: { chatId: number | string; messageId: number },
): Promise<void> {
  const keyboard = status
    ? [[{ text: status, callback_data: "noop" }]]
    : forTelegram(leadRows(leadId, true));

  await Promise.all(
    notices
      .filter((n) => !(except && n.chatId === String(except.chatId) && n.messageId === except.messageId))
      .map((n) =>
        call("editMessageReplyMarkup", {
          chat_id: n.chatId,
          message_id: n.messageId,
          reply_markup: { inline_keyboard: keyboard },
        }),
      ),
  );
}

/**
 * Забрать карточки лидов из лички отключённого сотрудника.
 *
 * Удалить бот может только своё сообщение не старше 48 часов — так устроен
 * Telegram. У более старых снимаются кнопки: текст остаётся, но ни взять, ни
 * открыть по нему ничего уже нельзя. Возвращает, сколько удалено совсем.
 *
 * Пачками по двадцать: у уволенного могут лежать сотни карточек, и разом они
 * упёрлись бы в ограничение Telegram на частоту запросов.
 */
export async function withdrawCards(notices: readonly Notice[]): Promise<number> {
  let deleted = 0;
  for (let i = 0; i < notices.length; i += 20) {
    const batch = notices.slice(i, i + 20);
    const results = await Promise.all(
      batch.map(async (n) => {
        if (await call("deleteMessage", { chat_id: n.chatId, message_id: n.messageId })) return true;
        await call("editMessageReplyMarkup", {
          chat_id: n.chatId,
          message_id: n.messageId,
          reply_markup: { inline_keyboard: [] },
        });
        return false;
      }),
    );
    deleted += results.filter(Boolean).length;
  }
  return deleted;
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
