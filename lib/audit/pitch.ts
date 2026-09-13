import type { AuditReport, Finding, Severity } from "@/lib/audit/checks";

/**
 * Черновик первого касания.
 *
 * Это и есть продукт пакетного аудита. Таблица баллов менеджеру не нужна —
 * ему нужно, что написать конкретному человеку, чтобы тот ответил.
 *
 * Правило, из которого всё остальное следует: сообщение строится вокруг
 * одной проверяемой находки. «Здравствуйте, делаем сайты» — это нулевой
 * уровень. Подставить название компании в шаблон — первый, и он всё ещё
 * шаблон: сказанное подходит тысяче других. Второй уровень начинается там,
 * где в сообщении есть то, что можно пойти и проверить самому: «на телефоне
 * ваш сайт открывается в масштабе рабочего стола», «сервер отвечает за
 * 4.2 секунды».
 *
 * Поэтому у каждой находки свой заход, а не один текст с подстановкой.
 * Разные заходы — это не украшение: человек, которому пишут про сертификат,
 * и человек, у которого сайт вообще не открывается, находятся в разных
 * ситуациях, и одинаковое письмо им обоим читается как рассылка, потому что
 * рассылкой и является.
 *
 * Чего здесь нет намеренно:
 *
 *   — Обещаний про позиции в поиске и про рост продаж на N процентов.
 *     Проверить их нельзя, а первое же такое обещание переводит письмо в
 *     разряд спама в глазах того, кто читал уже двадцать похожих.
 *   — Упоминаний, откуда мы взяли адрес. Мы открыли публичный сайт — это
 *     всё, и именно так и написано. Намёк на то, что мы что-то о человеке
 *     выясняли, убивает разговор быстрее любого неудачного вопроса.
 *   — Давления и срочности. «Осталось два места» на холодном касании
 *     работает против нас.
 *
 * ── Про языки ───────────────────────────────────────────────────────────
 *
 * Два, а не четыре, как у сайта. Черновик — это письмо, которое человек
 * отправит и по которому потом будет вести переписку; язык, на котором
 * студия не может ответить на встречный вопрос, превращает удачное касание
 * в тупик. Узбекский и китайский появятся здесь тогда, когда на них будет
 * кому отвечать, а не когда их станет технически можно сгенерировать.
 *
 * Тип `Record<PitchLocale, …>` у каждого захода выбран не случайно: он
 * требует обе локали и ломает сборку, если новую находку завели только на
 * одном языке. Это тот же приём, что у словарей сайта, и по той же причине —
 * молча пропущенный перевод хуже явной ошибки.
 */

export const pitchLocales = ["ru", "en"] as const;
export type PitchLocale = (typeof pitchLocales)[number];

const RANK: Record<Severity, number> = { critical: 0, major: 1, minor: 2 };

/** Самая сильная находка: по тяжести, а при равенстве — по порядку проверок. */
export function leadFinding(report: AuditReport): Finding | null {
  if (!report.findings.length) return null;
  return [...report.findings].sort((a, b) => RANK[a.severity] - RANK[b.severity])[0];
}

type Opener = (finding: Finding, report: AuditReport) => string;

/**
 * Код ошибки из заголовка находки.
 *
 * В `facts` его нет, а в английском заходе он нужен: «сайт отдаёт ошибку» без
 * номера — это уже не то, что адресат может пойти и проверить. Разбираем свой
 * же сгенерированный заголовок, а не чужой ввод, поэтому regexp здесь
 * достаточно.
 */
function statusCode(finding: Finding): string | null {
  return finding.title.match(/\b([45]\d\d)\b/)?.[1] ?? null;
}

/**
 * Заход под конкретную находку.
 *
 * Ключ — код проверки. Незнакомый код означает, что в аудиторе появилась
 * новая находка, а сюда её не завели.
 */
const OPENER: Record<string, Record<PitchLocale, Opener>> = {
  unreachable: {
    ru: () =>
      "Пробовал открыть ваш сайт — он не отвечает. Если адрес сменился, стоит поправить его там, где он опубликован: сейчас каждый, кто набирает его руками, попадает в пустоту.",
    en: () =>
      "I tried opening your website and it doesn't respond. If the address has changed, it's worth fixing wherever it's published — right now anyone typing it in lands on nothing.",
  },

  http_error: {
    ru: (f) =>
      `Открыл ваш сайт — ${f.title.toLowerCase()}. Тот, кто придёт по ссылке из поиска или с визитки, видит то же самое и уходит.`,
    en: (f) => {
      const code = statusCode(f);
      const what = code ? `it returns a ${code} error` : "it returns an error page";
      return `I opened your website and ${what}. Anyone arriving from search results or a business card sees the same thing and leaves.`;
    },
  },

  no_https: {
    ru: () =>
      "Ваш сайт открывается без шифрования, и браузер помечает его как «Не защищено». Оплату на таком сайте принимать нельзя, а часть людей закрывает страницу, не читая.",
    en: () =>
      "Your website loads without encryption, so browsers label it “Not secure”. You can't take payments on a site like that, and some visitors close the page without reading it.",
  },

  cert_expiring: {
    ru: (_f, r) =>
      r.facts.certDaysLeft !== null && r.facts.certDaysLeft < 0
        ? "У вашего сайта истёк сертификат безопасности. Браузер уже закрывает его предупреждением на весь экран — посетители решают, что вас взломали."
        : `У вашего сайта через ${r.facts.certDaysLeft} дн. истекает сертификат безопасности. Когда это случится, браузер закроет сайт красным предупреждением. Продлевается он бесплатно, но сам себя не продлит.`,
    en: (_f, r) =>
      r.facts.certDaysLeft !== null && r.facts.certDaysLeft < 0
        ? "Your site's security certificate has expired. Browsers already block it behind a full-screen warning, and visitors conclude you've been hacked."
        : `Your site's security certificate expires in ${r.facts.certDaysLeft} days. When it does, browsers will block the site behind a red warning. Renewing is free, but it won't renew itself.`,
  },

  no_viewport: {
    // Без привязки к стране: касания больше не ограничены Узбекистаном, а
    // «с телефона заходит большинство» верно и без географической оговорки.
    ru: () =>
      "Открыл ваш сайт с телефона — страница показывается в масштабе рабочего стола: текст мелкий, кнопки не нажимаются. С телефона сегодня заходит большинство, то есть так его и видит большинство ваших клиентов.",
    en: () =>
      "I opened your website on a phone — the page renders at desktop scale: tiny text, buttons you can't tap. Most people browse on a phone these days, so that's how most of your customers see it.",
  },

  slow: {
    ru: (_f, r) =>
      `Замерил, за сколько отвечает ваш сайт: ${(r.facts.ttfbMs / 1000).toFixed(1)} секунды до первого байта. Всё это время посетитель смотрит на белый экран, и после трёх секунд уходит примерно каждый второй.`,
    en: (_f, r) =>
      `I measured how long your website takes to respond: ${(r.facts.ttfbMs / 1000).toFixed(1)} seconds to the first byte. The visitor stares at a blank screen that whole time, and past three seconds about half of them leave.`,
  },

  no_og: {
    ru: () =>
      "Заметил: когда вашу ссылку пересылают в Telegram или WhatsApp, вместо карточки с картинкой уходит голый адрес. По такой ссылке переходят заметно реже — а пересылают её как раз те, кто вас рекомендует.",
    en: () =>
      "I noticed that when someone forwards your link in a messenger, it goes out as a bare address instead of a card with an image. Links like that get opened noticeably less often — and the people forwarding them are the ones recommending you.",
  },

  no_title: {
    ru: () =>
      "У главной страницы вашего сайта нет заголовка — той строки, которой сайт представлен в Google. Поисковик подставляет вместо неё что придётся, и по названию компании вас находят хуже, чем могли бы.",
    en: () =>
      "Your homepage has no title — the line that represents your site in Google. The search engine substitutes whatever it can find, and people searching for your company name have a harder time finding you than they should.",
  },

  no_description: {
    ru: () =>
      "У вашего сайта нет описания для поисковиков: под ссылкой в Google показывается случайный кусок текста вместо того, чем вы занимаетесь.",
    en: () =>
      "Your website has no meta description: under your link in Google, a random slice of page text shows up instead of what you actually do.",
  },

  no_h1: {
    ru: () =>
      "На главной странице вашего сайта нет главного заголовка — поисковику не за что зацепиться, чтобы понять, о чём вы.",
    en: () =>
      "Your homepage has no main heading, so a search engine has nothing to latch onto to work out what you do.",
  },
};

/**
 * Заход или `null`, если писать нечем.
 *
 * Для русского запасной вариант есть: заголовок и последствие находки уже
 * написаны по-русски в самом аудиторе, они хуже частного захода, но честны —
 * в них всё равно есть проверяемое.
 *
 * Для английского запасного варианта нет намеренно. Подставить русскую
 * строку в английское письмо — это не «лучше, чем ничего», это сообщение,
 * которое адресат не прочитает, отправленное от лица студии, продающей
 * четырёхъязычные сайты. Лучше пустой черновик: по нему видно, что находку
 * не завели, и это чинится за пять минут.
 */
function opener(finding: Finding, report: AuditReport, locale: PitchLocale): string | null {
  const known = OPENER[finding.code]?.[locale];
  if (known) return known(finding, report);
  if (locale === "ru") return `Открыл ваш сайт и заметил: ${finding.title.toLowerCase()}. ${finding.impact}`;
  return null;
}

/**
 * Хвост письма.
 *
 * Различается ровно по одному признаку — есть ли, кроме названной, что-то
 * ещё. Обещать «полный отчёт» там, где нашлась одна мелочь, значит обмануть
 * на первом же сообщении.
 */
const TAIL: Record<PitchLocale, (rest: number) => string> = {
  ru: (rest) => {
    if (rest === 0) return "Починить это — работа на несколько часов. Если интересно, расскажу как.";
    if (rest === 1) return "Там же нашлось ещё одно место, которое стоит поправить. Прислать разбор?";
    return `Кроме этого нашлось ещё ${rest} — прислать разбор целиком?`;
  },
  en: (rest) => {
    if (rest === 0) return "Fixing it is a few hours' work. Happy to explain how, if that's useful.";
    if (rest === 1) return "There's one more spot worth fixing on the same page. Want me to send it over?";
    return `I found ${rest} more besides this one — want the full write-up?`;
  },
};

const HELLO: Record<PitchLocale, (company: string | null) => string> = {
  ru: (company) => (company ? `Здравствуйте! Пишу по сайту ${company}.` : "Здравствуйте!"),
  en: (company) => (company ? `Hello! I'm writing about the ${company} website.` : "Hello!"),
};

const NOTHING_TO_SAY: Record<PitchLocale, string> = {
  ru: "К сайту нет претензий — писать не о чем. Это не повод придумывать повод.",
  en: "Nothing wrong with this site — there's nothing to write about, and that's no reason to invent a reason.",
};

const NO_OPENER: Record<PitchLocale, string> = {
  ru: "Для этой находки нет захода на русском.",
  en: "Нет английского захода для находки «{code}» — черновик не собран. Завести его в OPENER в lib/audit/pitch.ts.",
};

export type Pitch =
  | { ok: true; text: string; finding: Finding }
  /** Писать не о чем — и это тоже результат, а не сбой. */
  | { ok: false; why: string };

/**
 * Собрать черновик.
 *
 * Сайт без единой находки даёт `ok: false`, и это важнее, чем кажется: у
 * такого касания нет содержания, а касание без содержания портит и адресата,
 * и репутацию отправителя. Пустая строка в выгрузке лучше вымученного
 * «здравствуйте, предлагаем услуги».
 *
 * Локаль по умолчанию русская: так вызовы, написанные до появления второго
 * языка, продолжают означать ровно то же, что означали.
 */
export function pitch(
  report: AuditReport,
  company: string | null,
  locale: PitchLocale = "ru",
): Pitch {
  const finding = leadFinding(report);
  if (!finding) return { ok: false, why: NOTHING_TO_SAY[locale] };

  const body = opener(finding, report, locale);
  if (!body) return { ok: false, why: NO_OPENER[locale].replace("{code}", finding.code) };

  return {
    ok: true,
    finding,
    text: [HELLO[locale](company), "", body, "", TAIL[locale](report.findings.length - 1)].join("\n"),
  };
}
