import type { ContactKind } from "@/lib/qualify/types";

/**
 * Как выглядит контакт клиента и во что он разворачивается.
 *
 * Модуль отдельный, а не часть lib/qualify/telegram.ts, где эти функции жили
 * раньше, потому что вместе с Э2 сменился их адресат. Бриф в общем чате
 * контакта больше не показывает — ссылку «написать в один тап» открывает
 * карточка в панели, после раскрытия с записью в журнал. Оставлять разбор
 * контакта в модуле про Bot API значило бы, что страница панели импортирует
 * телеграм-код ради функции, к Telegram отношения не имеющей.
 */

/** Подписи типов контакта. Одно место на панель и на бриф. */
export const CONTACT_LABEL: Record<string, string> = {
  telegram: "Telegram",
  phone: "телефон",
  email: "почта",
  none: "не оставлен",
};

/**
 * Определяет тип контакта по тому, как он записан.
 *
 * Модель присылает свою классификацию, но полагаться только на неё нельзя:
 * ошибка здесь превращает рабочую ссылку в мёртвую, а менеджер в этот момент
 * уже нажал «Показать контакт» и ждёт, что чат откроется.
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

export type ContactView = { label: string; url: string | null };

/**
 * Превращает контакт в ссылку, по которой открывается диалог в один тап.
 *
 * Это не украшение. Менеджер читает карточку с телефона: скопировать ник,
 * открыть поиск, вставить, найти — четыре действия, на каждом из которых
 * лид может подождать ещё пять минут.
 */
export function contactLink(source: {
  contact_handle?: string | null;
  contact_kind?: ContactKind | string | null;
}): ContactView {
  const raw = (source.contact_handle ?? "").trim();
  if (!raw) return { label: "контакт не оставлен", url: null };

  // Определяем по самой строке, а не по тому, что назвала модель. Она
  // ошибается: в живом диалоге ник @bird_dasha был помечен как почта. Разбор
  // строки детерминирован и опирается на то, что человек реально написал,
  // поэтому именно он и решает. Значение от модели остаётся запасным — на
  // случай, когда разбор ничего не распознал.
  const detected = detectContactKind(raw);
  const declared = source.contact_kind;
  const kind =
    detected !== "none"
      ? detected
      : declared && declared !== "none"
        ? declared
        : "none";

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

/**
 * Канал, по которому с человеком свяжутся, — без самого контакта.
 *
 * Ровно та часть, которую можно показать общему чату: менеджер понимает,
 * писать ему в Telegram или звонить, но не получает ни ника, ни номера.
 */
export function channelLabel(source: {
  contact_handle?: string | null;
  contact_kind?: ContactKind | string | null;
}): string {
  const raw = (source.contact_handle ?? "").trim();
  if (!raw) return CONTACT_LABEL.none;
  const detected = detectContactKind(raw);
  const kind = detected !== "none" ? detected : (source.contact_kind || "none");
  return CONTACT_LABEL[String(kind)] ?? String(kind);
}
