import type { AuditReport, Finding, Severity } from "@/lib/audit/checks";
import { company as studio } from "@/content/company";

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
 * ── Как устроено письмо ─────────────────────────────────────────────────
 *
 * Приветствие с именем того, кто пишет, и названием студии — человек должен
 * с первой строки понимать, кто к нему обращается. Заход из трёх
 * предложений: что увидел (и что адресат может проверить сам), чем это
 * оборачивается для его клиентов, и что с этим обычно делается и сколько
 * занимает. Хвост — про остальные находки, если они есть. Подпись.
 *
 * Тон — дружелюбный и деловой. Не «у вас всё плохо», а «заметил, вот что
 * это значит, вот как чинится». Без слов «оптимизация» и «конверсия» там,
 * где можно сказать «люди уходят».
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
 * В `facts` его нет, а в заходе он нужен: «сайт отдаёт ошибку» без номера —
 * это уже не то, что адресат может пойти и проверить. Разбираем свой же
 * сгенерированный заголовок, а не чужой ввод, поэтому regexp здесь
 * достаточно.
 */
function statusCode(finding: Finding): string | null {
  return finding.title.match(/\b([45]\d\d)\b/)?.[1] ?? null;
}

/** Замер в секундах с одним знаком — так он и попадает в письмо. */
const seconds = (report: AuditReport) => (report.facts.ttfbMs / 1000).toFixed(1);

/**
 * Заход под конкретную находку.
 *
 * Ключ — код проверки. Незнакомый код означает, что в аудиторе появилась
 * новая находка, а сюда её не завели.
 */
const OPENER: Record<string, Record<PitchLocale, Opener>> = {
  unreachable: {
    ru: () =>
      "Пробовал открыть ваш сайт — он не отвечает: адрес не открывается ни с компьютера, ни с телефона. Если адрес сменился, стоит поправить его везде, где он опубликован: сейчас каждый, кто набирает его руками или переходит из карт, попадает в пустоту. Если сайт просто упал, это обычно лечится за час-два на стороне хостинга — могу подсказать, куда смотреть.",
    en: () =>
      "I tried opening your website and it doesn't respond — the address won't load from a computer or a phone. If the address has changed, it's worth updating it wherever it's published: right now anyone typing it in or coming from a map listing lands on nothing. If the site simply went down, that's usually an hour or two of work on the hosting side — happy to point you in the right direction.",
  },

  http_error: {
    ru: (f) => {
      const code = statusCode(f);
      const what = code
        ? `вместо страницы показывается ошибка ${code}`
        : "вместо страницы показывается ошибка";
      return `Открыл ваш сайт — ${what}. Тот, кто приходит по ссылке из поиска, из карт или с визитки, видит то же самое и, как правило, идёт к тому, у кого открылось. Чаще всего дело в хостинге или неудачном обновлении, и чинится это за час-два — если нужно, помогу разобраться.`;
    },
    en: (f) => {
      const code = statusCode(f);
      const what = code ? `it shows a ${code} error instead of a page` : "it shows an error instead of a page";
      return `I opened your website and ${what}. Anyone arriving from search results, a map listing or a business card sees the same thing and usually moves on to a site that opens. Most of the time it's the hosting or a failed update, and it takes an hour or two to fix — I can help you work out which.`;
    },
  },

  no_https: {
    ru: () =>
      "Заметил, что ваш сайт открывается без защищённого соединения: браузер пишет рядом с адресом «Не защищено», и часть посетителей закрывает страницу, не читая. Формы и оплату на таком сайте принимать нельзя, а в поиске он стоит ниже похожих сайтов с замочком. Исправляется это за пару часов: сертификат сейчас бесплатный, нужно только правильно его поставить и настроить продление.",
    en: () =>
      "I noticed your website loads without a secure connection: browsers show “Not secure” next to the address, and some visitors close the page without reading it. You can't take payments or form submissions on a site like that, and search engines rank it below similar sites with the padlock. It takes a couple of hours to fix — certificates are free now, they just need to be installed properly and set to renew.",
  },

  cert_expiring: {
    ru: (_f, r) =>
      r.facts.certDaysLeft !== null && r.facts.certDaysLeft < 0
        ? "У вашего сайта истёк сертификат безопасности: браузер уже показывает вместо него красное предупреждение на весь экран. Посетитель не станет разбираться, что это техническая мелочь — он решит, что сайт взломан, и уйдёт. Продление занимает около часа, и можно сразу настроить, чтобы дальше оно происходило само."
        : `У вашего сайта через ${r.facts.certDaysLeft} дн. истекает сертификат безопасности. Когда это случится, браузер закроет сайт красным предупреждением на весь экран, и посетители решат, что вас взломали. Продлевается он бесплатно, но сам себя не продлит: на это нужен час, и заодно можно настроить автопродление, чтобы больше об этом не думать.`,
    en: (_f, r) =>
      r.facts.certDaysLeft !== null && r.facts.certDaysLeft < 0
        ? "Your site's security certificate has expired: browsers already show a full-screen red warning instead of it. Visitors won't stop to work out that it's a technical detail — they'll assume the site has been hacked and leave. Renewing takes about an hour, and it can be set up to renew itself from then on."
        : `Your site's security certificate expires in ${r.facts.certDaysLeft} days. When it does, browsers will block the site behind a full-screen red warning, and visitors will assume you've been hacked. Renewing is free, but it won't renew itself: it takes an hour, and auto-renewal can be set up at the same time so you never have to think about it again.`,
  },

  no_viewport: {
    // Без привязки к стране: касания больше не ограничены Узбекистаном, а
    // «с телефона заходит большинство» верно и без географической оговорки.
    ru: () =>
      "Открыл ваш сайт с телефона — страница показывается в масштабе большого экрана: текст мелкий, кнопки крошечные, чтобы что-то прочитать, приходится растягивать пальцами. Большинство людей сегодня заходит именно с телефона, так что примерно так сайт видит большая часть ваших клиентов — и многие уходят, не дочитав. Мобильная версия для небольшого сайта — это несколько дней работы, и она заметно меняет картину.",
    en: () =>
      "I opened your website on a phone — the page renders at desktop scale: tiny text, buttons too small to tap, pinch-zooming to read anything. Most people browse on a phone these days, so that's roughly how most of your customers see it — and many leave before they get to the point. A mobile version of a small site is a few days' work, and it changes the picture noticeably.",
  },

  slow: {
    ru: (_f, r) =>
      `Замерил, за сколько отвечает ваш сайт: ${seconds(r)} секунды до того, как он вообще начинает открываться. Всё это время посетитель смотрит на белый экран, и после трёх секунд ожидания уходит примерно каждый второй. Обычно причина одна — слабый хостинг или тяжёлые плагины — и убирается за день-два.`,
    en: (_f, r) =>
      `I measured how long your website takes to respond: ${seconds(r)} seconds before it even starts loading. The visitor stares at a blank screen the whole time, and past three seconds about half of them leave. Usually there's a single cause — weak hosting or heavy plugins — and it takes a day or two to remove.`,
  },

  no_og: {
    ru: () =>
      "Заметил: когда вашу ссылку пересылают в Telegram или WhatsApp, вместо карточки с картинкой и названием уходит голый адрес. По такой ссылке переходят заметно реже — а пересылают её как раз те, кто вас рекомендует. Поправить это можно за пару часов: добавить картинку и подпись, которые мессенджеры показывают в карточке.",
    en: () =>
      "I noticed that when someone forwards your link in Telegram or WhatsApp, it goes out as a bare address instead of a card with an image and a title. Links like that get opened noticeably less often — and the people forwarding them are the ones recommending you. It's a couple of hours to fix: add the image and caption that messengers show in the card.",
  },

  no_title: {
    ru: () =>
      "У главной страницы вашего сайта нет заголовка — той синей строки, которой сайт представлен в Google и во вкладке браузера. Поисковик подставляет вместо неё что придётся, и даже по названию компании вас находят хуже, чем могли бы. Написать заголовки для главной и основных страниц — работа на несколько часов.",
    en: () =>
      "Your homepage has no title — the blue line that represents your site in Google and in the browser tab. The search engine substitutes whatever it can find, and even people searching for your company by name have a harder time finding you than they should. Writing titles for the homepage and the main pages is a few hours' work.",
  },

  /* ── Вёрстка и следы раннего интернета ─────────────────────────────── */

  ancient_layout: {
    ru: () =>
      "Открыл ваш сайт и увидел, что он собран по технологиям начала двухтысячных — из таблиц и приёмов, которыми пользовались до появления смартфонов. Посетитель этого не знает, но видит результат: на телефоне всё разъезжается, а рядом с сайтами конкурентов ваш выглядит лет на пятнадцать старше, и цену за работу с такого сайта просят меньше. Такое обычно не чинят, а собирают заново на современной основе, перенося тексты и структуру, — для небольшого сайта это две-три недели.",
    en: () =>
      "I opened your website and saw it's built the way sites were built in the early 2000s — with tables and techniques from before smartphones existed. Visitors don't know the term, but they see the result: on a phone everything falls apart, and next to your competitors' sites yours looks about fifteen years older, which is the kind of site people expect to pay less for. This usually isn't patched but rebuilt on a modern base, carrying over the texts and structure — two to three weeks for a small site.",
  },

  dated_layout: {
    ru: () =>
      "Посмотрел ваш сайт: он свёрстан приёмами примерно десятилетней давности — блоки расставлены под один размер экрана и не подстраиваются под другие. На новом телефоне или широком мониторе появляются пустоты и наезды, и первое впечатление — «здесь давно ничего не делали», а по первому впечатлению и выбирают, кому позвонить. Переверстать страницы на современной основе, оставив дизайн узнаваемым, — одна-две недели.",
    en: () =>
      "I had a look at your website: it's laid out the way sites were built about ten years ago — blocks are placed for one screen size and don't adapt to others. On a new phone or a wide monitor you get gaps and overlaps, and the first impression is “nobody has touched this in a while” — and first impressions are what people use to decide whom to call. Re-laying the pages on a modern base while keeping the design recognisable takes one to two weeks.",
  },

  no_responsive_css: {
    ru: () =>
      "Заметил, что ваш сайт объявляет телефону, что готов к маленькому экрану, а правил для маленького экрана в нём нет ни одного. Телефон честно показывает страницу в ширину экрана, и всё, что было рассчитано на монитор, сжимается: колонки наползают друг на друга, кнопки уезжают за край — это можно проверить, открыв сайт с телефона прямо сейчас. Написать правила под телефон и планшет для каждого блока и проверить на реальных устройствах — несколько дней.",
    en: () =>
      "I noticed your website tells phones it's ready for a small screen, but it contains no rules for a small screen at all. So the phone dutifully fits the page to its width and everything designed for a monitor gets squeezed: columns overlap, buttons slide off the edge — you can check this right now by opening the site on your phone. Writing phone and tablet rules for every block and testing on real devices takes a few days.",
  },

  zoom_locked: {
    ru: () =>
      "Обратил внимание, что на вашем сайте нельзя увеличить текст пальцами — сайт это запрещает. Тот, кому мелко, разводит пальцы, ничего не происходит, и вкладку закрывают: так уходят люди старше сорока и все, кто читает с телефона на солнце. Снимается запрет одной строкой, заодно стоит проверить, что при увеличении ничего не ломается.",
    en: () =>
      "I noticed your website doesn't let people zoom in with their fingers — it's blocked. Anyone who finds the text small pinches to zoom, nothing happens, and they close the tab: that's how you lose people over forty and anyone reading on a phone in sunlight. Lifting the block is a one-line change; while at it, it's worth checking nothing breaks when zoomed.",
  },

  frames: {
    ru: () =>
      "Открыл ваш сайт: он собран из рамок — так делали до 2005 года. Из-за этого нельзя дать ссылку на конкретный раздел (она всегда открывает главную), кнопка «назад» ведёт себя непредсказуемо, на телефоне рамки не помещаются, а поиск видит только пустую оболочку и не показывает сайт по запросам. Перенести содержимое на обычные страницы с нормальными адресами — для небольшого сайта неделя.",
    en: () =>
      "I opened your website: it's built from frames, the way sites were made before 2005. That means you can't link to a specific section (any link opens the home page), the back button behaves unpredictably, frames don't fit on a phone, and search engines see only an empty shell and don't show the site for queries. Moving the content onto regular pages with proper addresses takes about a week for a small site.",
  },

  flash: {
    ru: () =>
      "Заметил, что на вашем сайте используется Flash — он не работает ни в одном браузере с 2021 года. На месте ролика, меню или баннера посетитель видит пустой прямоугольник; если на Flash было что-то важное — каталог, форма, презентация, — этого сейчас не видит никто, включая поиск. Каждый такой элемент заменяется обычной анимацией, видео или картинками, которые открываются везде, включая телефоны, — от дня до недели, смотря сколько их.",
    en: () =>
      "I noticed your website uses Flash — it hasn't worked in any browser since 2021. Where the video, menu or banner should be, visitors see an empty rectangle; if anything important ran on Flash — a catalogue, a form, a presentation — nobody can see it now, search engines included. Each such element gets replaced with regular animation, video or images that open everywhere, phones included — a day to a week depending on how many there are.",
  },

  marquee: {
    ru: () =>
      "Открыл ваш сайт — и первое, что бросилось в глаза, бегущая строка. Её невозможно дочитать до конца, она отвлекает от всего остального, и посетитель помнит такой приём по сайтам двухтысячных, перенося это впечатление на компанию. Убрать движение и поставить текст обычной строкой на видном месте — час работы; если новость важна, можно сделать аккуратный баннер.",
    en: () =>
      "I opened your website and the first thing that caught my eye was the scrolling text. It's impossible to read to the end, it distracts from everything else, and visitors remember this trick from 2000s sites and carry that impression over to the company. Removing the motion and placing the text as a normal line in a visible spot is an hour's work; if the news matters, it can become a neat banner.",
  },

  visitor_counter: {
    ru: () =>
      "Заметил на вашем сайте счётчик посетителей — он виден каждому гостю. Публичная цифра почти всегда работает против сайта, а сам значок родом из эпохи гостевых книг, и возраст сайта посетитель считывает по нему за секунду. Снять счётчик и поставить нормальную аналитику, которую видите только вы, — полчаса.",
    en: () =>
      "I noticed a visitor counter on your website — every guest can see it. A public number almost always works against a site, and the badge itself dates back to the guestbook era, so visitors read the site's age from it in a second. Removing the counter and setting up proper analytics that only you can see takes half an hour.",
  },

  under_construction: {
    ru: () =>
      "Открыл ваш сайт — на нём написано, что он в разработке. Тот, кто приходит по ссылке из поиска или с визитки, узнаёт, что смотреть тут нечего, и идёт к тому, у кого сайт готов; заглушка, провисевшая месяцы, читается не как «скоро откроемся», а как «дело не пошло». Если сайт есть и заглушку забыли снять — это минутное дело; если сайта нет — рабочую страницу с услугами, ценами и контактами можно собрать за неделю-две и уже вести на неё людей.",
    en: () =>
      "I opened your website and it says it's under construction. Anyone arriving from a search result or a business card learns there's nothing to see and goes to whoever's site is ready; a placeholder that's been up for months doesn't read as “opening soon” but as “this didn't work out”. If the site exists and someone forgot to remove the notice, that's a minute's work; if there's no site yet, a working page with services, prices and contacts takes one to two weeks and can start bringing people in right away.",
  },

  placeholder_text: {
    ru: () =>
      "Посмотрел ваш сайт и заметил, что на нём остались заготовки шаблона — текст вроде «ваш текст здесь» или безымянный заголовок вкладки. Посетитель понимает, что сайт не доделан, и не верит, что доделают его заказ; поиск же показывает во вкладке ровно то, что там написано, а это не название компании. Пройти по всем страницам, заменить заготовки настоящими текстами и подписать каждую вкладку — день-два.",
    en: () =>
      "I looked at your website and noticed template leftovers — text like “your text here” or an unnamed tab title. Visitors can tell the site isn't finished and doubt their order will be; search engines show exactly what's written in the tab, and that isn't your company's name. Going through every page, replacing the placeholders with real text and naming every tab takes a day or two.",
  },

  stale_copyright: {
    ru: (f) => {
      const year = f.title.match(/\b(19|20)\d{2}\b/)?.[0];
      return `Открыл ваш сайт и обратил внимание на подвал: там указан ${year ?? "давний"} год. Посетитель видит дату несколько лет назад и решает, что сайт заброшен, а цены и телефоны на нём старые, — часть людей на этом месте перестаёт читать и идёт проверять компанию в другом месте. Поставить год, который обновляется сам, и заодно проверить адрес, телефон и режим работы в подвале — полчаса.`;
    },
    en: (f) => {
      const year = f.title.match(/\b(19|20)\d{2}\b/)?.[0];
      return `I opened your website and noticed the footer: it says ${year ?? "an old year"}. Visitors see a date from several years ago and assume the site is abandoned and the prices and phone numbers are out of date — some stop reading right there and go check the company elsewhere. Setting a year that updates itself, and checking the address, phone and opening hours in the footer while at it, takes half an hour.`;
    },
  },

  broken_images: {
    ru: (f) => {
      const n = f.title.match(/^\d+/)?.[0] ?? "несколько";
      return `Открыл вашу главную — и на ней ${n} картин${n === "1" ? "ка не открывается" : "ок не открываются"}: вместо них пустой квадрат со значком поломки, это видно каждому посетителю на самом видном месте. Вывод у человека один: за сайтом не следят, значит, и за заказом следить не будут. Найти пропавшие файлы или заменить их и проверить остальные страницы тем же способом — пара часов.`;
    },
    en: (f) => {
      const n = f.title.match(/^\d+/)?.[0] ?? "several";
      return `I opened your home page and ${n} image${n === "1" ? " doesn't load" : "s don't load"}: instead there's an empty box with a broken-image icon, visible to every visitor in the most prominent spot. People draw one conclusion — nobody looks after the site, so nobody will look after their order. Finding the missing files or replacing them, then checking the other pages the same way, takes a couple of hours.`;
    },
  },

  broken_links: {
    ru: (f) => {
      const n = f.title.match(/^\d+/)?.[0] ?? "несколько";
      return `Проверил ссылки с вашей главной: ${n} из них вед${n === "1" ? "ёт" : "ут"} на несуществующие страницы. Посетитель нажимает «Услуги» или «Контакты», получает «страница не найдена» и уходит — до контактов он так и не добирается. Проверить все ссылки на сайте и починить каждую — вернуть страницу, перенаправить или убрать ссылку — пара часов.`;
    },
    en: (f) => {
      const n = f.title.match(/^\d+/)?.[0] ?? "several";
      return `I checked the links on your home page: ${n} of them lead${n === "1" ? "s" : ""} to pages that don't exist. A visitor clicks “Services” or “Contacts”, gets “page not found” and leaves — never reaching your contact details. Checking every link on the site and fixing each one — restoring the page, redirecting, or removing the link — takes a couple of hours.`;
    },
  },

  ie_only: {
    ru: () =>
      "Открыл ваш сайт, и он просит открыть себя в Internet Explorer — этот браузер закрыт с 2022 года. Такая просьба читается как табличка «мы отсюда давно ушли», и посетитель уже не ждёт, что остальное будет работать. Убрать надпись и проверить сайт в браузерах, которыми пользуются сегодня, — час.",
    en: () =>
      "I opened your website and it asks to be viewed in Internet Explorer — a browser that was shut down in 2022. A request like that reads as a sign saying “we left long ago”, and visitors stop expecting the rest to work. Removing the notice and checking the site in today's browsers takes an hour.",
  },

  autoplay_sound: {
    ru: () =>
      "Открыл ваш сайт — и он сам включил звук. Музыка или ролик, стартующие без спроса, — одна из немногих вещей, за которые вкладку закрывают в первую же секунду, особенно в офисе или в транспорте; современные браузеры такой звук к тому же глушат, так что задуманного эффекта всё равно нет. Сделать так, чтобы звук и видео включались по нажатию, — полчаса.",
    en: () =>
      "I opened your website and it started playing sound on its own. Music or a video that starts uninvited is one of the few things that make people close a tab within the first second, especially at the office or on a bus; modern browsers mute it anyway, so the intended effect isn't there either. Making sound and video start on click takes half an hour.",
  },

  popup_onload: {
    ru: () =>
      "Открыл ваш сайт — первое, что появилось, всплывающее окно, которое надо закрыть. Часть людей закрывает вместе с ним и вкладку, а браузеры такие окна ещё и блокируют, так что ваше приветствие многие просто не видят. Убрать окно и, если сообщение важно, поставить его на страницу спокойной полосой — полчаса.",
    en: () =>
      "I opened your website and the first thing that appeared was a pop-up window I had to close. Some people close the tab along with it, and browsers block such windows anyway, so many visitors never see your message at all. Removing the pop-up and, if the message matters, placing it on the page as a quiet bar takes half an hour.",
  },

  ancient_scripts: {
    ru: () =>
      "Посмотрел, на чём держится ваш сайт: меню, галереи и формы работают на компонентах десятилетней давности, которые давно не обновляют. С каждым обновлением телефонов и браузеров что-то из этого перестаёт работать — обычно молча: кнопка не нажимается, форма не отправляется, и никто не сообщает об этом владельцу. Заменить устаревшие компоненты и проверить каждую кнопку и форму на реальных телефонах — день-два.",
    en: () =>
      "I looked at what your website runs on: the menu, galleries and forms use components that are about ten years old and no longer maintained. With every phone and browser update something stops working — usually silently: a button doesn't respond, a form doesn't submit, and nobody tells the owner. Replacing the outdated components and testing every button and form on real phones takes a day or two.",
  },

  no_favicon: {
    ru: () =>
      "Мелочь, которую заметил сразу: у вкладки вашего сайта нет значка. Среди десяти открытых вкладок ваша — единственная с пустым квадратиком, и её первой закрывают, потому что не помнят, чья она; в закладках и на экране телефона сайт тоже выглядит безымянным. Сделать значок из логотипа во всех нужных размерах — час.",
    en: () =>
      "A small thing I noticed right away: your website's tab has no icon. Among ten open tabs yours is the only one with an empty square, and it's the first to get closed because nobody remembers whose it is; in bookmarks and on a phone's home screen the site looks nameless too. Making an icon from your logo in all the required sizes takes an hour.",
  },

  no_description: {
    ru: () =>
      "У вашего сайта нет описания для поисковиков: под ссылкой в Google показывается случайный кусок текста вместо короткого объяснения, чем вы занимаетесь. Люди читают эти две строки, прежде чем нажать, и чаще выбирают того, у кого написано понятно. Это правится за час-два — по два предложения на главную и основные страницы.",
    en: () =>
      "Your website has no description for search engines: under your link in Google, a random slice of page text shows up instead of a short line about what you do. People read those two lines before they click, and they tend to pick the one that's clear. It's an hour or two to fix — two sentences for the homepage and each main page.",
  },

  no_h1: {
    ru: () =>
      "На главной странице вашего сайта нет главного заголовка — той строки, по которой посетитель за секунду понимает, куда попал, а поисковик — о чём страница. Без неё и тот и другой гадают. Это самая быстрая правка из возможных: одна фраза на первом экране, что вы делаете и для кого.",
    en: () =>
      "Your homepage has no main heading — the line that tells a visitor within a second where they've landed, and tells a search engine what the page is about. Without it, both are guessing. It's the quickest fix there is: one line at the top saying what you do and for whom.",
  },
};

/**
 * Заход или `null`, если писать нечем.
 *
 * Для русского запасной вариант есть: заголовок, последствие и «что делаем»
 * уже написаны по-русски в самом аудиторе, они хуже частного захода, но
 * честны — в них всё равно есть проверяемое.
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
  if (locale === "ru") {
    return `Открыл ваш сайт и заметил: ${finding.title.toLowerCase()}. ${finding.impact} ${finding.fix}`;
  }
  return null;
}

/**
 * Хвост письма.
 *
 * Различается ровно по одному признаку — есть ли, кроме названной, что-то
 * ещё. Обещать «полный отчёт» там, где нашлась одна мелочь, значит обмануть
 * на первом же сообщении. «Бесплатно и ни к чему не обязывает» — не
 * приём, а правда: разбор уже сделан, и отдать его ничего не стоит.
 */
/** «2 места», «5 мест»: числительное без существительного читается как обрывок. */
function places(n: number): string {
  const tens = n % 100;
  const ones = n % 10;
  if (tens >= 11 && tens <= 14) return `${n} мест`;
  if (ones >= 2 && ones <= 4) return `${n} места`;
  return `${n} мест`;
}

const TAIL: Record<PitchLocale, (rest: number) => string> = {
  ru: (rest) => {
    if (rest === 0) return "Если это для вас актуально — напишите, расскажу подробнее, что и как поправить. Ни к чему не обязывает.";
    if (rest === 1) return "Там же нашлось ещё одно место, которое стоит поправить. Если интересно, пришлю короткий разбор — это бесплатно и ни к чему не обязывает.";
    return `Кроме этого нашлось ещё ${places(rest)}, которые стоит поправить, — могу прислать разбор целиком, это бесплатно и ни к чему не обязывает.`;
  },
  en: (rest) => {
    if (rest === 0) return "If this is relevant to you, write back and I'll explain in more detail what to fix and how. No strings attached.";
    if (rest === 1) return "There's one more spot on the same page worth fixing. If you're interested, I'll send a short write-up — it's free and there's no obligation.";
    return `I found ${rest} more besides this one — I can send the full write-up, it's free and there's no obligation.`;
  },
};

/**
 * Транслитерация имени для подписи в английском письме.
 *
 * Имена сотрудников в базе кириллицей, а письмо иностранному адресату с
 * подписью «Егор» выглядит как письмо, которое собрали, не читая. Правило
 * простое, паспортное; узбекские буквы кириллицы — по латинице узбекского.
 * Что не буква кириллицы, проходит как есть.
 */
const LATIN: Record<string, string> = {
  "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "e", "ж": "zh",
  "з": "z", "и": "i", "й": "y", "к": "k", "л": "l", "м": "m", "н": "n", "о": "o",
  "п": "p", "р": "r", "с": "s", "т": "t", "у": "u", "ф": "f", "х": "kh", "ц": "ts",
  "ч": "ch", "ш": "sh", "щ": "shch", "ъ": "", "ы": "y", "ь": "", "э": "e", "ю": "yu",
  "я": "ya", "ў": "o'", "қ": "q", "ғ": "g'", "ҳ": "h",
};

export function latin(name: string): string {
  let out = "";
  for (const ch of name) {
    const low = ch.toLowerCase();
    const mapped = LATIN[low];
    if (mapped === undefined) {
      out += ch;
    } else if (ch === low) {
      out += mapped;
    } else {
      out += mapped.charAt(0).toUpperCase() + mapped.slice(1);
    }
  }
  return out;
}

/**
 * Приветствие: кто пишет и о чём.
 *
 * Имя отправителя — того менеджера, который нажмёт «скопировать»; студия —
 * из единого источника реквизитов, чтобы название нигде не разъехалось.
 */
const HELLO: Record<PitchLocale, (site: string | null, sender: string | null) => string> = {
  ru: (site, who) => {
    if (who && site) return `Здравствуйте! Меня зовут ${who}, я из ${studio.name}. Пишу по сайту ${site}.`;
    if (who) return `Здравствуйте! Меня зовут ${who}, я из ${studio.name}.`;
    if (site) return `Здравствуйте! Пишу из ${studio.name} по сайту ${site}.`;
    return `Здравствуйте! Пишу из ${studio.name}.`;
  },
  en: (site, who) => {
    const name = who ? latin(who) : null;
    if (name && site) return `Hello! My name is ${name}, I'm with ${studio.name}. I'm writing about the ${site} website.`;
    if (name) return `Hello! My name is ${name}, I'm with ${studio.name}.`;
    if (site) return `Hello! I'm writing from ${studio.name} about the ${site} website.`;
    return `Hello! I'm writing from ${studio.name}.`;
  },
};

const SIGNOFF: Record<PitchLocale, (sender: string | null) => string> = {
  ru: (who) => `С уважением,\n${who ?? studio.name}`,
  en: (who) => `Best regards,\n${who ? latin(who) : studio.name}`,
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
 * Локаль по умолчанию русская, отправитель по умолчанию не назван: так
 * вызовы, написанные до появления второго языка и подписи, продолжают
 * означать ровно то же, что означали, — только письмо подписано студией.
 */
export function pitch(
  report: AuditReport,
  company: string | null,
  locale: PitchLocale = "ru",
  sender: string | null = null,
): Pitch {
  const finding = leadFinding(report);
  if (!finding) return { ok: false, why: NOTHING_TO_SAY[locale] };

  const body = opener(finding, report, locale);
  if (!body) return { ok: false, why: NO_OPENER[locale].replace("{code}", finding.code) };

  const who = sender?.trim() || null;

  return {
    ok: true,
    finding,
    text: [
      HELLO[locale](company, who),
      "",
      body,
      "",
      TAIL[locale](report.findings.length - 1),
      "",
      SIGNOFF[locale](who),
    ].join("\n"),
  };
}
