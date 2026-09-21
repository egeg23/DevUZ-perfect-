/**
 * Снимок того места, о котором говорит находка.
 *
 * Правило раздела: разбор показывает ошибку, а не рассказывает о ней. Текст
 * «на сайте не видно телефона» читатель может принять на веру или не
 * принять; первый экран с обведённой шапкой, где телефона нет, спорить не с
 * чем. Отсюда — снимок на каждую находку, которую вообще можно показать.
 *
 * Здесь только правила: какой код что показывает, на каком экране и какой
 * подписью. Сам браузер живёт в `scripts/razbor-shots.mjs` — тянуть
 * playwright в боевой образ ради раза в сутки мы не будем.
 *
 * Чего здесь намеренно нет. Находки вроде «нет карты сайта», «медленно
 * отвечает сервер», «страница закрыта от поисковиков» показать нельзя: они
 * не про то, что видно глазами. Снимок первого экрана рядом с такой находкой
 * был бы картинкой ради картинки — читатель ищет на нём названное, не
 * находит и перестаёт верить остальным снимкам. Пусто — честнее.
 */
import type { RazborLocale } from "@/lib/razbor/model";

/**
 * Как искать элемент в странице.
 *
 * Не CSS-селектор: половину мест селектором не назовёшь. «Картинки, которые
 * не открылись» — это те, у кого `naturalWidth` равен нулю, а «стена текста»
 * — самый длинный абзац на странице; и то и другое известно только браузеру,
 * уже отрисовавшему страницу. Поэтому здесь имя приёма, а сам приём — в
 * скрипте съёмки.
 */
export type EvidenceHunt =
  | "marquee"
  | "counter"
  | "construction"
  | "placeholder"
  | "footer"
  | "broken-img"
  | "img-no-alt"
  | "body-text"
  | "longest-text"
  | "contacts"
  | "popup"
  | "media"
  | "legacy-embed"
  | "ie-note";

export type EvidenceRule = {
  /**
   * `element` — обводим найденное место и снимаем его с запасом вокруг.
   * `screen` — снимаем первый экран целиком: находка об отсутствии, и
   * обводить в ней нечего. Кружок вокруг пустого места — это указание на
   * то, чего нет, и выглядит оно как придирка.
   */
  mode: "element" | "screen";
  /** Чем искать. Только для `element`. */
  hunt?: EvidenceHunt;
  /** Находка про телефон снимается на телефоне, иначе её не видно. */
  screen: "desktop" | "mobile";
  /** Подпись под снимком: на что смотреть. Не пересказ находки. */
  caption: Record<RazborLocale, string>;
};

const RULES: Readonly<Record<string, EvidenceRule>> = {
  /* ── Видно глазами: обводим ─────────────────────────────────────────── */
  marquee: {
    mode: "element",
    hunt: "marquee",
    screen: "desktop",
    caption: { ru: "Бегущая строка на странице", uz: "Sahifadagi yuguruvchi qator" },
  },
  visitor_counter: {
    mode: "element",
    hunt: "counter",
    screen: "desktop",
    caption: { ru: "Счётчик посетителей", uz: "Tashrifchilar hisoblagichi" },
  },
  under_construction: {
    mode: "element",
    hunt: "construction",
    screen: "desktop",
    caption: { ru: "Надпись о том, что сайт в разработке", uz: "Sayt ishlanmoqda degan yozuv" },
  },
  placeholder_text: {
    mode: "element",
    hunt: "placeholder",
    screen: "desktop",
    caption: { ru: "Текст-заготовка из шаблона", uz: "Shablondan qolgan namuna matn" },
  },
  stale_copyright: {
    mode: "element",
    hunt: "footer",
    screen: "desktop",
    caption: { ru: "Год в подвале сайта", uz: "Sayt pastki qismidagi yil" },
  },
  broken_images: {
    mode: "element",
    hunt: "broken-img",
    screen: "desktop",
    caption: { ru: "Место картинки, которая не открылась", uz: "Ochilmagan rasm o'rni" },
  },
  img_no_alt: {
    mode: "element",
    hunt: "img-no-alt",
    screen: "desktop",
    caption: { ru: "Картинка без подписи для поиска", uz: "Qidiruv uchun izohsiz rasm" },
  },
  tiny_text: {
    mode: "element",
    hunt: "body-text",
    screen: "desktop",
    caption: { ru: "Основной текст в натуральном размере", uz: "Asosiy matn haqiqiy o'lchamda" },
  },
  wall_of_text: {
    mode: "element",
    hunt: "longest-text",
    screen: "desktop",
    caption: { ru: "Текст без подзаголовков и списков", uz: "Sarlavhasiz va ro'yxatsiz matn" },
  },
  popup_onload: {
    mode: "element",
    hunt: "popup",
    screen: "desktop",
    caption: { ru: "Окно, которым сайт встречает посетителя", uz: "Saytga kirganda chiqadigan oyna" },
  },
  autoplay_sound: {
    mode: "element",
    hunt: "media",
    screen: "desktop",
    caption: { ru: "Проигрыватель, который включается сам", uz: "O'zi yoqiladigan pleyer" },
  },
  flash: {
    mode: "element",
    hunt: "legacy-embed",
    screen: "desktop",
    caption: { ru: "Место, где стоял Flash", uz: "Flash turgan joy" },
  },
  frames: {
    mode: "element",
    hunt: "legacy-embed",
    screen: "desktop",
    caption: { ru: "Страница, собранная из рамок", uz: "Ramkalardan yig'ilgan sahifa" },
  },
  ie_only: {
    mode: "element",
    hunt: "ie-note",
    screen: "desktop",
    caption: { ru: "Просьба открыть сайт в Internet Explorer", uz: "Saytni Internet Explorer’da ochish iltimosi" },
  },
  phone_not_clickable: {
    mode: "element",
    hunt: "contacts",
    screen: "mobile",
    caption: { ru: "Телефон на сайте — обычный текст, не ссылка", uz: "Saytdagi telefon — oddiy matn, havola emas" },
  },

  /* ── Находки об отсутствии: первый экран целиком ────────────────────── */
  no_phone: {
    mode: "screen",
    screen: "desktop",
    caption: { ru: "Первый экран сайта: телефона на нём нет", uz: "Saytning birinchi ekrani: telefon yo'q" },
  },
  no_messenger: {
    mode: "screen",
    screen: "desktop",
    caption: { ru: "Первый экран: кнопок Telegram и WhatsApp нет", uz: "Birinchi ekran: Telegram va WhatsApp tugmalari yo'q" },
  },
  no_h1: {
    mode: "screen",
    screen: "desktop",
    caption: { ru: "Первый экран: главного заголовка нет", uz: "Birinchi ekran: asosiy sarlavha yo'q" },
  },
  no_prices: {
    mode: "screen",
    screen: "desktop",
    caption: { ru: "Первый экран: цен нет", uz: "Birinchi ekran: narxlar yo'q" },
  },
  no_price_anywhere: {
    mode: "screen",
    screen: "desktop",
    caption: { ru: "Первый экран: цен нет ни здесь, ни на внутренних страницах", uz: "Birinchi ekran: na bu yerda, na ichki sahifalarda narx bor" },
  },
  client_rendered: {
    mode: "screen",
    screen: "desktop",
    caption: { ru: "Что отдаёт сервер до того, как отработают скрипты", uz: "Skriptlar ishlashidan oldin server nima beradi" },
  },
  ancient_layout: {
    mode: "screen",
    screen: "desktop",
    caption: { ru: "Первый экран целиком", uz: "Birinchi ekran to'liq" },
  },
  dated_layout: {
    mode: "screen",
    screen: "desktop",
    caption: { ru: "Первый экран целиком", uz: "Birinchi ekran to'liq" },
  },
  font_zoo: {
    mode: "screen",
    screen: "desktop",
    caption: { ru: "Первый экран: шрифты не собираются в один набор", uz: "Birinchi ekran: shriftlar bir to'plamga yig'ilmaydi" },
  },

  /* ── Телефон: показываем на телефоне ────────────────────────────────── */
  no_viewport: {
    mode: "screen",
    screen: "mobile",
    caption: { ru: "Тот же сайт на экране телефона", uz: "O'sha sayt telefon ekranida" },
  },
  no_responsive_css: {
    mode: "screen",
    screen: "mobile",
    caption: { ru: "Тот же сайт на экране телефона", uz: "O'sha sayt telefon ekranida" },
  },
  zoom_locked: {
    mode: "screen",
    screen: "mobile",
    caption: { ru: "Тот же сайт на экране телефона", uz: "O'sha sayt telefon ekranida" },
  },
  horizontal_scroll: {
    mode: "screen",
    screen: "mobile",
    caption: { ru: "Тот же сайт на экране телефона: страница шире экрана", uz: "O'sha sayt telefonda: sahifa ekrandan keng" },
  },
};

export function evidenceFor(code: string | undefined | null): EvidenceRule | null {
  if (!code) return null;
  return RULES[code] ?? null;
}

/** Какие коды вообще можно показать — для съёмки и для тестов. */
export function shootableCodes(): string[] {
  return Object.keys(RULES).sort();
}

export { RULES as EVIDENCE_RULES };
