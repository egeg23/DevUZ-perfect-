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

/**
 * «@слово» в тексте страницы, которое не адрес, а код.
 *
 * 24 сентября у svoydom.kz в контактах оказались @click, @mousedown и
 * @dblclick — обработчики событий из разметки Vue и Alpine (`@click="…"`),
 * просочившиеся в видимый текст. Адрес с сайта уходит скауту как «пиши сюда»:
 * первый из них был каналом, а следующим в очереди стоял бы чужой человек
 * с ником @click. Сюда же правила CSS (`@media`, `@import`) — они попадают
 * в текст из встроенных стилей.
 */
const CODE_WORD =
  /^(click|dblclick|mouse\w*|pointer\w*|touch\w*|key(?:up|down|press)|submit|change|input|focus\w*|blur|scroll\w*|resize|load\w*|error|wheel|contextmenu|select|reset|drag\w*|drop|transition\w*|animation\w*|media|import|keyframes|font|supports|charset|layer|container|page|namespace|apply|tailwind|screen|vite|babel)$/i;

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

/**
 * Строки из структурированных данных страницы.
 *
 * На akbar-rich.uz телефон стоял в шапке, и аудит его не нашёл: сервер
 * отдаёт почти пустую оболочку, а номер лежит в разметке для поисковика —
 * `application/ld+json`, — которую разбор выбрасывал вместе со всеми
 * скриптами. Формально верно: это не видимый текст. По сути — мы выкинули
 * самый надёжный источник контактов на современном сайте, потому что
 * компания кладёт туда номер намеренно и в чистом виде.
 *
 * Берём только строковые значения. Числа и идентификаторы не трогаем: в
 * них телефон не отличить от порядкового номера, а выдуманный контакт хуже
 * ненайденного — по нему менеджер пойдёт писать.
 */
function structuredText(html: string): string {
  const out: string[] = [];
  const blocks = html.matchAll(
    /<script\b[^>]*\btype\s*=\s*["'](?:application\/ld\+json|application\/json)["'][^>]*>([\s\S]*?)<\/script>/gi,
  );

  const walk = (node: unknown, depth: number): void => {
    if (depth > 12 || out.length > 4000) return;
    if (typeof node === "string") {
      out.push(node);
      return;
    }
    if (Array.isArray(node)) {
      for (const item of node) walk(item, depth + 1);
      return;
    }
    if (node && typeof node === "object") {
      for (const value of Object.values(node)) walk(value, depth + 1);
    }
  };

  for (const block of blocks) {
    const body = block[1].trim();
    // Полмегабайта json в разметке — обычное дело у SPA, и разбирать его
    // целиком незачем: контакты лежат в начале, рядом с описанием сайта.
    if (!body || body.length > 500_000) continue;
    try {
      walk(JSON.parse(body), 0);
    } catch {
      // Невалидный json внутри страницы — не наша забота: пропускаем блок.
    }
  }

  return out.join("\n");
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

  // Видимый текст и структурированные данные — один поток: и то и другое
  // компания написала о себе сама, разница только в том, кому адресовано.
  const text = `${visibleText(html)}\n${structuredText(html)}`;
  for (const m of text.matchAll(PHONE_IN_TEXT)) {
    const phone = normalizePhone(m[0]);
    if (phone) phones.push(phone);
  }
  for (const m of text.matchAll(/[\w.+-]+@[\w-]+\.[\w.-]{2,}/g)) {
    const mail = m[0].toLowerCase().replace(/[.,;]$/, "");
    if (!BAD_EMAIL.test(mail)) emails.push(mail);
  }
  for (const m of text.matchAll(/(?:^|[\s(])@([a-zA-Z][\w]{3,31})\b/g)) {
    if (!BAD_TELEGRAM.test(m[1]) && !CODE_WORD.test(m[1])) telegram.push(`@${m[1]}`);
  }

  // Мессенджеры, записанные ссылкой, а не кнопкой. В структурированных
  // данных для этого есть штатное поле `sameAs`, и компания складывает туда
  // свои Telegram и Instagram ровно для того, чтобы их прочитали машиной.
  // Разбор по href их не видел: в json нет атрибута href.
  for (const m of text.matchAll(/(?:t\.me|telegram\.me)\/([\w.+]+)/gi)) {
    const handle = m[1].replace(/^\+/, "");
    if (HANDLE.test(handle) && !BAD_TELEGRAM.test(handle)) telegram.push(`@${handle}`);
  }
  for (const m of text.matchAll(/(?:wa\.me\/|api\.whatsapp\.com\/send\?[^\s"']*phone=)(\+?\d{8,15})/gi)) {
    const phone = normalizePhone(m[1]);
    if (phone) whatsapp.push(phone);
  }
  for (const m of text.matchAll(/instagram\.com\/([\w.]+)/gi)) {
    if (HANDLE.test(m[1]) && !BAD_INSTAGRAM.test(m[1])) instagram.push(`@${m[1]}`);
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
/**
 * Маркер контактов в адресе — с начала сегмента пути, а не подстрокой.
 *
 * Подстрока ловила новости: в `kulturnogo-naslediia` прячется `o-nas`, и
 * страницей контактов становилась статья. Сегмент пути — это то, что
 * человек видит в адресной строке как раздел сайта.
 */
const CONTACTS_SEGMENT =
  /(^|\/)(kontakt|contact|aloqa|bogla|bog['’ʻ]?lanish|o-nas|about|haqida|manzil)[^/]*(\/|$)/i;

function looksLikeContactsPath(href: string): boolean {
  try {
    return CONTACTS_SEGMENT.test(new URL(href, "https://site.invalid/").pathname);
  } catch {
    return false;
  }
}

/**
 * Подпись ссылки на контакты — целиком, а не куском.
 *
 * Поиск по куску слова ловил заголовки новостей: «Узбекистан и Дания
 * обсудили развитие бизнес-связей» — это не страница контактов, а статья,
 * и менеджер, нажав «страница контактов», попадал бы на неё. Ссылка на
 * контакты подписана коротко и предсказуемо, поэтому подпись сверяется
 * целиком.
 */
const CONTACTS_LABEL =
  /^(наши\s+)?(контакт[ыаов]?|связаться(\s+с\s+нами)?|как\s+нас\s+найти|о\s+компании|о\s+нас|contacts?|contact\s+us|get\s+in\s+touch|about\s+us|aloqa|bog['’ʻ]?lanish|biz\s+bilan\s+bog['’ʻ]?lanish|manzil|kompaniya\s+haqida|biz\s+haqimizda)$/i;

export function contactsPagePath(html: string): string | null {
  let byLabel: string | null = null;

  for (const m of html.matchAll(/<a\b([^>]*)>([\s\S]{0,200}?)<\/a>/gi)) {
    const href = (m[1].match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i) ?? [])
      .slice(1)
      .find(Boolean);
    if (!href || /^(#|mailto:|tel:|javascript:)/i.test(href)) continue;

    // Адрес надёжнее подписи: /kontakty — это контакты на любом языке.
    if (looksLikeContactsPath(href)) return href;

    const label = m[2].replace(/<[^>]+>/g, " ").replace(/&nbsp;|&#160;/g, " ").trim().replace(/\s+/g, " ");
    if (byLabel === null && label.length <= 40 && CONTACTS_LABEL.test(label)) byLabel = href;
  }

  return byLabel;
}
