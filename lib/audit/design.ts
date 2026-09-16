import type { Finding } from "@/lib/audit/checks";
import type { PageProbe } from "@/lib/audit/fetch";

/**
 * Вёрстка, дизайн и следы раннего интернета.
 *
 * Владелец: «аналитика по сайту должна стараться видеть дизайн,
 * адаптивность, в идеале — баги и разного рода приколы из раннего
 * интернета: Узбекистан как рынок — это ранний интернет сейчас».
 *
 * Пикселей у нас нет — есть разметка и собственные стили сайта. Этого
 * достаточно, чтобы отличить сайт, свёрстанный таблицами в 2006-м, от
 * сайта на флексах с правилами под телефон; чтобы найти бегущую строку,
 * счётчик посетителей, «сайт в разработке», заготовки шаблона и подвал с
 * позапрошлым годом; чтобы пересчитать битые картинки и ссылки.
 *
 * Каждая находка — это то, что владелец может открыть и увидеть сам. Ничего
 * «на вкус»: вкус нельзя проверить, а битую картинку — можно.
 */

export type DesignEra = "modern" | "dated" | "ancient" | "unknown";

export type DesignFacts = {
  era: DesignEra;
  mediaQueries: number;
  flexOrGrid: boolean;
  tablesLayout: boolean;
  /** Стили сайта прочитаны — суждение о вёрстке опирается на них. */
  cssRead: boolean;
};

const count = (text: string, re: RegExp) => (text.match(re) ?? []).length;

function visibleText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/\s+/g, " ");
}

function inlineStyles(html: string): string {
  return (html.match(/<style[\s\S]*?<\/style>/gi) ?? []).join("\n");
}

/** Таблицы как каркас страницы, а не как таблица данных внутри текста. */
export function tablesLayout(html: string): boolean {
  const tables = count(html, /<table\b/gi);
  const cells = count(html, /<td\b/gi);
  const divs = count(html, /<div\b/gi);
  return tables >= 2 && cells >= 12 && divs < cells;
}

export function designEra(html: string, css: string, cssRead: boolean): DesignFacts {
  const styles = `${inlineStyles(html)}\n${css}`;
  const mediaQueries = count(styles, /@media\b/gi);
  const flexOrGrid = /display\s*:\s*(flex|grid|inline-flex|inline-grid)\b/i.test(styles);
  const floats = count(styles, /float\s*:\s*(left|right)/gi);
  const tables = tablesLayout(html);
  const fonts = count(html, /<font\b/gi);
  const ancientMarkup = tables || fonts >= 3 || /<frameset\b|<marquee\b|<blink\b/i.test(html);

  let era: DesignEra;
  if (ancientMarkup) era = "ancient";
  else if (!cssRead && !inlineStyles(html).trim()) era = "unknown";
  else if (!flexOrGrid && (floats >= 3 || mediaQueries === 0)) era = "dated";
  else era = "modern";

  return { era, mediaQueries, flexOrGrid, tablesLayout: tables, cssRead };
}

const PLACEHOLDERS =
  /lorem ipsum|ваш текст здесь|текст текст текст|sample text|just another wordpress site|example domain|hello world!?|здесь будет текст|замените этот текст|этот текст является заполнителем/i;

const UNDER_CONSTRUCTION =
  /under construction|coming soon|сайт в разработке|страница в разработке|сайт находится в разработке|сайт временно не работает|скоро открытие|ведутся технические работы|sayt ishlab chiqilmoqda|sayt tayyorlanmoqda|tez kunda/i;

const COUNTERS =
  /liveinternet\.ru|counter\.yadro|top\.mail\.ru\/counter|hotlog\.ru|top100\.rambler|c\.statcounter\.com|extreme-dm\.com|счётчик посещений|счетчик посещений|hit counter/i;

const IE_ONLY =
  /лучше всего просматривать|для просмотра сайта рекомендуется|best viewed (in|with)|optimi[sz]ed for internet explorer|требуется internet explorer/i;

const ANCIENT_SCRIPTS = /jquery[-.]1\.[0-9]|prototype\.js|mootools|scriptaculous|swfobject/i;

export function copyrightYear(text: string): number | null {
  let latest: number | null = null;
  for (const m of text.matchAll(/(?:©|\(c\)|&copy;|copyright)\s*(?:\d{4}\s*[-–—]\s*)?((?:19|20)\d{2})\b/gi)) {
    const year = Number(m[1]);
    if (latest === null || year > latest) latest = year;
  }
  return latest;
}

function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

/**
 * Проверки вёрстки и «раннего интернета». `now` передаётся аргументом:
 * иначе проверка подвала зависела бы от дня запуска и однажды сменила бы
 * вердикт в новогоднюю ночь.
 */
export function designChecks(probe: PageProbe, now: Date): { findings: Finding[]; facts: DesignFacts } {
  const findings: Finding[] = [];
  const add = (f: Finding) => findings.push(f);

  // На странице ошибки вёрстки нет — там текст хостинга. Судить по нему
  // о сайте значит приписать владельцу чужую страницу.
  if (probe.status >= 400) {
    return { findings, facts: { era: "unknown", mediaQueries: 0, flexOrGrid: false, tablesLayout: false, cssRead: false } };
  }

  const html = probe.html;
  const text = visibleText(html);
  const assets = probe.assets;

  const facts = designEra(html, assets?.css ?? "", Boolean(assets && assets.cssCount > 0));
  const hasViewport = /<meta[^>]+name=["']viewport["']/i.test(html);

  if (facts.era === "ancient") {
    add({
      code: "ancient_layout",
      severity: "major",
      title: "Сайт свёрстан по технологиям начала двухтысячных",
      impact:
        "Страница собрана из таблиц и приёмов, которыми пользовались до появления смартфонов. Посетитель этого слова не знает, но видит результат: на телефоне всё разъезжается, а на компьютере сайт выглядит на пятнадцать лет старше сайтов конкурентов — и цену за работу с такого сайта просят меньше.",
      fix: "Собираем сайт заново на современной основе, перенося тексты и структуру: посетитель получает тот же сайт, но открывающийся на любом экране. Для небольшого сайта это две-три недели.",
    });
  } else if (facts.era === "dated") {
    add({
      code: "dated_layout",
      severity: "major",
      title: "Сайт выглядит на несколько лет старше конкурентов",
      impact:
        "Вёрстка сделана приёмами десятилетней давности: блоки не подстраиваются под экран, а расставлены под один размер. На новом телефоне или широком мониторе появляются пустоты и наезды, и первое впечатление — «здесь давно ничего не делали». Первое впечатление и есть то, по чему выбирают, кому позвонить.",
      fix: "Переверстываем страницы на современной основе, оставляя дизайн узнаваемым: те же цвета и логотип, но блоки, которые сами подстраиваются под экран. Одна-две недели.",
    });
  }

  if (hasViewport && facts.cssRead && facts.mediaQueries === 0 && !facts.flexOrGrid) {
    add({
      code: "no_responsive_css",
      severity: "major",
      title: "Мобильная версия объявлена, но не сделана",
      impact:
        "Сайт сообщает телефону, что готов к маленькому экрану, а правил для маленького экрана в нём нет ни одного. В итоге телефон честно показывает страницу в ширину экрана — и всё, что было рассчитано на монитор, сжимается: колонки наползают друг на друга, кнопки уезжают за край. Посетитель с телефона видит именно это.",
      fix: "Пишем правила для телефона и планшета под каждый блок: меню, шапку, карточки, формы. Проверяем на реальных устройствах, а не только в окне браузера. Несколько дней.",
    });
  }

  const viewport = html.match(/<meta[^>]+name=["']viewport["'][^>]*content=["']([^"']*)["']/i)?.[1] ?? "";
  if (/user-scalable\s*=\s*(no|0)|maximum-scale\s*=\s*1(\.0+)?\b/i.test(viewport)) {
    add({
      code: "zoom_locked",
      severity: "minor",
      title: "Сайт запрещает увеличивать текст пальцами",
      impact:
        "Тот, кому мелко, привычно разводит пальцы — и ничего не происходит. Так сайт теряет людей старше сорока и всех, кто читает с телефона на солнце: они не станут искать очки, они закроют вкладку.",
      fix: "Снимаем запрет — это одна строка. Заодно проверяем, что при увеличении ничего не ломается.",
    });
  }

  if (/<frameset\b|<frame\s/i.test(html)) {
    add({
      code: "frames",
      severity: "major",
      title: "Сайт собран из рамок — так делали до 2005 года",
      impact:
        "Страница склеена из нескольких независимых окон. Из-за этого нельзя дать ссылку на конкретный раздел — она всегда открывает главную; кнопка «назад» ведёт себя непредсказуемо; на телефоне рамки не помещаются вовсе, а поиск видит только пустую оболочку и не показывает сайт по запросам.",
      fix: "Переносим содержимое на обычные страницы с нормальными адресами. Для небольшого сайта это неделя.",
    });
  }

  if (/\.swf\b|application\/x-shockwave-flash|swfobject/i.test(html)) {
    add({
      code: "flash",
      severity: "major",
      title: "На сайте используется Flash — он не работает ни в одном браузере с 2021 года",
      impact:
        "На месте ролика, меню или баннера посетитель видит пустой прямоугольник или предупреждение. Если на Flash было что-то важное — каталог, форма, презентация, — этого не видит никто, включая поиск.",
      fix: "Заменяем каждый такой элемент обычной анимацией, видео или картинками — они открываются везде, включая телефоны. От дня до недели, смотря сколько элементов.",
    });
  }

  if (/<marquee\b|<blink\b/i.test(html)) {
    add({
      code: "marquee",
      severity: "minor",
      title: "На странице бегущая строка или мигающий текст",
      impact:
        "Бегущую строку невозможно прочитать до конца, а мигание отвлекает от всего остального. Такие приёмы посетитель помнит по сайтам двухтысячных и переносит это впечатление на компанию.",
      fix: "Убираем движение и ставим текст обычной строкой на видном месте. Если новость важна — делаем аккуратный баннер. Час работы.",
    });
  }

  if (COUNTERS.test(html)) {
    add({
      code: "visitor_counter",
      severity: "minor",
      title: "На сайте виден счётчик посетителей",
      impact:
        "Публичный счётчик рассказывает каждому гостю, сколько людей здесь бывает, — и почти всегда цифра работает против сайта. К тому же такие счётчики родом из эпохи гостевых книг, и посетитель считывает возраст сайта по одному этому значку.",
      fix: "Снимаем счётчик со страницы и ставим нормальную аналитику, которую видите только вы: кто пришёл, откуда, что смотрел. Полчаса.",
    });
  }

  if (UNDER_CONSTRUCTION.test(text)) {
    add({
      code: "under_construction",
      severity: "major",
      title: "На сайте написано, что он в разработке",
      impact:
        "Посетитель, который пришёл по ссылке из поиска или с визитки, узнаёт, что смотреть тут нечего, — и уходит к тому, у кого сайт готов. Заглушка, провисевшая месяцы, читается не как «скоро откроемся», а как «дело не пошло».",
      fix: "Если сайт есть, но заглушку забыли снять, — снимаем. Если сайта нет — собираем рабочую страницу с услугами, ценами и контактами: на неё уже можно вести людей, а остальное достраивается. Неделя-две.",
    });
  }

  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, " ").trim() ?? "";
  if (PLACEHOLDERS.test(text) || /^(untitled|new page|document|index|главная|home|заголовок)$/i.test(title)) {
    add({
      code: "placeholder_text",
      severity: "major",
      title: "На страницах остались заготовки шаблона",
      impact:
        "Где-то на сайте до сих пор стоит текст-заглушка вроде «ваш текст здесь» или безымянный заголовок вкладки. Посетитель понимает, что сайт не доделан, и не верит, что доделают заказ. Поиск же показывает во вкладке ровно то, что там написано, — и это не название компании.",
      fix: "Проходим по всем страницам, заменяем заготовки настоящими текстами и подписываем каждую вкладку названием компании и услуги. День-два.",
    });
  }

  const year = copyrightYear(text);
  if (year !== null && now.getFullYear() - year >= 3) {
    const age = now.getFullYear() - year;
    add({
      code: "stale_copyright",
      severity: "minor",
      title: `В подвале сайта указан ${year} год`,
      impact:
        `Посетитель видит дату ${age} ${plural(age, "год", "года", "лет")} назад и решает, что сайт заброшен, а цены и телефоны на нём — старые. Часть людей на этом месте перестаёт читать и идёт проверять компанию в другом месте.`,
      fix: "Ставим текущий год, который обновляется сам, и заодно проверяем всё остальное в подвале: адрес, телефон, режим работы. Полчаса.",
    });
  }

  if (assets && assets.brokenImages.length) {
    const n = assets.brokenImages.length;
    add({
      code: "broken_images",
      severity: "major",
      title: `${n} ${plural(n, "картинка", "картинки", "картинок")} на главной не ${n === 1 ? "открывается" : "открываются"}`,
      impact:
        `Из первых ${assets.checkedImages} проверенных ${n} на месте картинки показывают пустой квадрат со значком поломки. Это видит каждый посетитель на самом видном месте — на главной, и вывод у него один: за сайтом не следят, значит, и за заказом следить не будут.`,
      fix: "Находим пропавшие файлы или заменяем их новыми, а потом проверяем остальные страницы тем же способом. Пара часов.",
    });
  }

  if (assets && assets.brokenLinks.length) {
    const n = assets.brokenLinks.length;
    add({
      code: "broken_links",
      severity: "major",
      title: `${n} ${plural(n, "ссылка", "ссылки", "ссылок")} с главной ${n === 1 ? "ведёт" : "ведут"} на несуществующие страницы`,
      impact:
        `Из первых ${assets.checkedLinks} проверенных ссылок ${n} ${n === 1 ? "открывает" : "открывают"} страницу ошибки вместо раздела. Посетитель нажимает «Услуги» или «Контакты», получает «страница не найдена» и уходит — до контактов он так и не добрался.`,
      fix: "Проверяем все ссылки на сайте и чиним каждую: возвращаем страницу, перенаправляем на новую или убираем ссылку. Пара часов.",
    });
  }

  if (IE_ONLY.test(text)) {
    add({
      code: "ie_only",
      severity: "minor",
      title: "Сайт просит открыть себя в Internet Explorer",
      impact:
        "Этот браузер закрыт с 2022 года, и просьба открыть в нём сайт читается как табличка «мы отсюда давно ушли». Посетитель, который её видит, уже не ждёт, что остальное будет работать.",
      fix: "Убираем надпись и проверяем сайт в браузерах, которыми пользуются сегодня: Chrome, Safari, телефонные. Час.",
    });
  }

  if (/<bgsound\b|<(audio|video)\b[^>]*\bautoplay\b(?![^>]*\bmuted\b)[^>]*>/i.test(html)) {
    add({
      code: "autoplay_sound",
      severity: "minor",
      title: "При открытии сайта сам включается звук",
      impact:
        "Музыка или ролик со звуком, стартующие без спроса, — одна из немногих вещей, за которые вкладку закрывают в первую же секунду, особенно в офисе или в транспорте. Современные браузеры такой звук ещё и глушат, так что задуманного эффекта всё равно нет.",
      fix: "Убираем автозапуск: звук и видео включаются по нажатию. Полчаса.",
    });
  }

  if (/\bonload\s*=\s*["'][^"']*(alert\(|window\.open\()/i.test(html)) {
    add({
      code: "popup_onload",
      severity: "minor",
      title: "Сайт встречает всплывающим окном",
      impact:
        "Первое, что видит посетитель, — не сайт, а окно, которое надо закрыть. Часть людей закрывает вместе с ним и вкладку; браузеры такие окна к тому же блокируют, и владелец не узнаёт, что его приветствие никто не видит.",
      fix: "Убираем окно; если сообщение важно — ставим его на страницу спокойной полосой, которую можно закрыть. Полчаса.",
    });
  }

  if (ANCIENT_SCRIPTS.test(html)) {
    add({
      code: "ancient_scripts",
      severity: "minor",
      title: "Сайт держится на компонентах десятилетней давности",
      impact:
        "Меню, галереи и формы работают на библиотеках, которые не обновляют много лет. С каждым обновлением телефонов и браузеров что-то из этого перестаёт работать — обычно молча: кнопка не нажимается, форма не отправляется, и никто об этом не сообщает.",
      fix: "Заменяем устаревшие компоненты современными и проверяем каждую кнопку и форму на реальных телефонах. День-два.",
    });
  }

  if (assets && assets.favicon === false) {
    add({
      code: "no_favicon",
      severity: "minor",
      title: "У вкладки сайта нет значка",
      impact:
        "Среди десяти открытых вкладок ваша — единственная с пустым квадратиком, и её первой закрывают, потому что не помнят, чья она. В закладках и на экране телефона сайт тоже выглядит безымянным.",
      fix: "Делаем значок из логотипа во всех нужных размерах — для вкладки, закладок и экрана телефона. Час.",
    });
  }

  return { findings, facts };
}
