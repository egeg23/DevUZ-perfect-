/**
 * Контакты с разбираемого сайта — чтобы менеджеру было куда написать.
 *
 * Владелец: «по тем сайтам, которые попадают туда, сразу вытягивая
 * контакты: тел, телеграм, почта, всё что можешь — и отражай в результатах
 * анализа, чтобы менеджеры связались».
 *
 * Берём только то, что компания сама опубликовала у себя на сайте на
 * видном месте: ссылки `tel:`, `mailto:`, кнопки мессенджеров, номер в
 * шапке. Это ровно те контакты, по которым к ней и так пишут клиенты, —
 * никакой выгрузки баз и обхода каталогов.
 *
 * Номер из текста берётся осторожнее ссылки: в тексте страницы хватает
 * чисел, похожих на телефон, — цены, годы, артикулы. Поэтому из текста
 * принимается только то, что записано как узбекский номер или в
 * международном формате со скобками и разделителями.
 */

export type Contacts = {
  phones: string[];
  emails: string[];
  telegram: string[];
  whatsapp: string[];
  instagram: string[];
  /** Адрес страницы контактов, если её удалось найти и прочитать. */
  contactsUrl: string | null;
};

export const EMPTY_CONTACTS: Contacts = {
  phones: [],
  emails: [],
  telegram: [],
  whatsapp: [],
  instagram: [],
  contactsUrl: null,
};

const LIMIT = 5;

const uniq = (values: string[]): string[] => [...new Set(values)].slice(0, LIMIT);

/**
 * Номер в единый вид: только цифры и плюс.
 *
 * Узбекские девять цифр без кода страны дописываются до +998: на сайте в
 * Ташкенте «90 123-45-67» — это именно узбекский номер, и менеджеру
 * набирать его без кода неоткуда.
 */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "");
  const bare = digits.replace(/^\+/, "");
  if (!/^\d+$/.test(bare)) return null;
  if (bare.length === 9 && /^(9|3|7|6|5|8)/.test(bare)) return `+998${bare}`;
  if (bare.length === 12 && bare.startsWith("998")) return `+${bare}`;
  if (bare.length >= 10 && bare.length <= 15) return `+${bare}`;
  return null;
}

/** Телефон, записанный человеком: с плюсом, скобками или дефисами. */
const PHONE_IN_TEXT =
  /(?:\+?998[\s\-()]*\d[\d\s\-()]{7,12})|(?:\+\d{1,3}[\s\-()]*\d[\d\s\-()]{7,13})|(?:\(\d{2,4}\)[\s\-]*\d[\d\s\-]{5,10})/g;

const BAD_EMAIL = /@(example|sentry|w3|schema|googleapis|gstatic|jquery|bootstrapcdn)\.|\.(png|jpe?g|gif|svg|webp|css|js)$/i;

const BAD_TELEGRAM = /^(share|joinchat|proxy|socks|s|c|addstickers|iv)$/i;
const BAD_INSTAGRAM = /^(p|reel|reels|explore|stories|tv|accounts|about|developer|legal)$/i;

const HANDLE = /^[a-zA-Z][\w.]{2,31}$/;

function hrefs(html: string): string[] {
  const out: string[] = [];
  for (const m of html.matchAll(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi)) {
    out.push((m[1] ?? m[2] ?? m[3] ?? "").trim());
  }
  return out;
}

function visibleText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ");
}

/** Контакты с одной страницы. Порядок сохраняется: первым — то, что выше. */
export function extractContacts(html: string): Contacts {
  const phones: string[] = [];
  const emails: string[] = [];
  const telegram: string[] = [];
  const whatsapp: string[] = [];
  const instagram: string[] = [];

  for (const raw of hrefs(html)) {
    const href = raw.replace(/&amp;/g, "&");
    const lower = href.toLowerCase();

    if (lower.startsWith("tel:")) {
      const phone = normalizePhone(decodeURIComponent(href.slice(4)));
      if (phone) phones.push(phone);
      continue;
    }
    if (lower.startsWith("mailto:")) {
      const mail = decodeURIComponent(href.slice(7)).split("?")[0].trim().toLowerCase();
      if (mail.includes("@") && !BAD_EMAIL.test(mail)) emails.push(mail);
      continue;
    }

    // Кнопка WhatsApp — это тоже телефон, и чаще всего тот же самый.
    const wa = lower.match(/(?:wa\.me|api\.whatsapp\.com\/send|web\.whatsapp\.com\/send)[/?][^"'\s]*/);
    if (wa) {
      const number = href.match(/(?:wa\.me\/|phone=)(\+?\d[\d]{7,15})/i)?.[1];
      const phone = number ? normalizePhone(number) : null;
      if (phone) whatsapp.push(phone);
      continue;
    }

    const tg = lower.match(/(?:t\.me|telegram\.me)\/([\w.+]+)/);
    if (tg) {
      const handle = tg[1].replace(/^\+/, "");
      if (HANDLE.test(handle) && !BAD_TELEGRAM.test(handle)) telegram.push(`@${handle}`);
      continue;
    }

    const ig = lower.match(/instagram\.com\/([\w.]+)/);
    if (ig && HANDLE.test(ig[1]) && !BAD_INSTAGRAM.test(ig[1])) instagram.push(`@${ig[1]}`);
  }

  const text = visibleText(html);
  for (const m of text.matchAll(PHONE_IN_TEXT)) {
    const phone = normalizePhone(m[0]);
    if (phone) phones.push(phone);
  }
  for (const m of text.matchAll(/[\w.+-]+@[\w-]+\.[\w.-]{2,}/g)) {
    const mail = m[0].toLowerCase().replace(/[.,;]$/, "");
    if (!BAD_EMAIL.test(mail)) emails.push(mail);
  }
  for (const m of text.matchAll(/(?:^|[\s(])@([a-zA-Z][\w]{3,31})\b/g)) {
    if (!BAD_TELEGRAM.test(m[1])) telegram.push(`@${m[1]}`);
  }

  return {
    phones: uniq(phones),
    emails: uniq(emails),
    telegram: uniq(telegram),
    whatsapp: uniq(whatsapp),
    instagram: uniq(instagram),
    contactsUrl: null,
  };
}

/** Слить контакты с главной и со страницы контактов. Главная — первой. */
export function mergeContacts(main: Contacts, extra: Contacts, contactsUrl: string | null): Contacts {
  return {
    phones: uniq([...main.phones, ...extra.phones]),
    emails: uniq([...main.emails, ...extra.emails]),
    telegram: uniq([...main.telegram, ...extra.telegram]),
    whatsapp: uniq([...main.whatsapp, ...extra.whatsapp]),
    instagram: uniq([...main.instagram, ...extra.instagram]),
    contactsUrl,
  };
}

export function hasAnyContact(c: Contacts): boolean {
  return Boolean(c.phones.length || c.emails.length || c.telegram.length || c.whatsapp.length || c.instagram.length);
}

/** Одной строкой для таблицы и выгрузки. */
export function contactsLine(c: Contacts): string {
  return [
    ...c.phones,
    ...c.whatsapp.filter((w) => !c.phones.includes(w)).map((w) => `${w} (WhatsApp)`),
    ...c.telegram,
    ...c.emails,
    ...c.instagram.map((i) => `${i} (Instagram)`),
  ].join(" · ");
}

/**
 * Ссылка на страницу контактов — по адресу и по подписи ссылки.
 *
 * Нужна потому, что на главной часто висит только одна кнопка «Контакты», а
 * почта и второй номер лежат уже там. Берём первую подходящую своего же
 * хоста: ходить по всем ссылкам ради контактов — это уже обход сайта.
 */
const CONTACTS_HINT = /kontakt|contact|aloqa|bogla|svyaz|about|o-nas|about-us|haqida/i;

export function contactsPagePath(html: string): string | null {
  for (const m of html.matchAll(/<a\b([^>]*)>([\s\S]{0,200}?)<\/a>/gi)) {
    const attrs = m[1];
    const label = m[2].replace(/<[^>]+>/g, " ");
    const href = (attrs.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i) ?? [])
      .slice(1)
      .find(Boolean);
    if (!href || /^(#|mailto:|tel:|javascript:)/i.test(href)) continue;
    if (CONTACTS_HINT.test(href) || /контакт|contact|aloqa|боглан|связ/i.test(label)) return href;
  }
  return null;
}
