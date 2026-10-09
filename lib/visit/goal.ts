/**
 * Целевые действия посетителя — в Метрику и Google Analytics.
 *
 * Владелец, 06.10.2026: «Людей приходит нормально на сайт, но заявок нет
 * почти… Ты можешь посмотреть… почему они уходят». До этого Метрика видела
 * только просмотры: кто открыл чат, нажал «Рассчитать проект» или телефон и
 * дошёл ли до заявки — не знал никто, и спросить отчёт «где теряются люди»
 * было не у кого.
 *
 * В Метрику уходит дважды:
 * - `reachGoal` — цель «JavaScript-событие» с этим именем. Цель видна в
 *   отчётах и в фильтре Вебвизора, когда её заводят в настройках счётчика
 *   (Цели → JavaScript-событие → идентификатор ниже);
 * - `params` — параметр визита `goal.<имя>`. Он виден в API без всякой
 *   настройки: по нему ежедневный снимок (lib/analytics/ux-snapshot.ts)
 *   считает воронку.
 *
 * Только браузер; без счётчика (локально, заблокирован) — молча ничего.
 */

export const GOALS = {
  /** Кнопка первого экрана «Рассчитать проект» и другие кнопки, ведущие к заявке. */
  cta_contact: "Кнопка к заявке",
  /** «Смотреть кейсы» на первом экране. */
  cta_cases: "Кнопка к кейсам",
  /** Открыл чат с менеджером. */
  chat_open: "Открыл чат",
  /** Написал первое сообщение в чат. */
  chat_message: "Написал в чат",
  /** Чат собрал заявку (первичка закрыта). */
  chat_qualified: "Заявка из чата",
  /** Отправил форму заявки. */
  lead_form: "Отправил форму",
  /** Нажал на номер телефона. */
  contact_tel: "Нажал телефон",
  /** Нажал на ссылку Telegram. */
  contact_tg: "Нажал Telegram",
  /** Нажал на ссылку WhatsApp. */
  contact_wa: "Нажал WhatsApp",
  /** Начал партию в игре на странице кейса (components/cases/playable-phone.tsx). */
  playable_start: "Начал игру в кейсе",
  /** Нажал в игре кнопку рекламы («Скачать», «Забрать скидку»). */
  playable_cta: "Нажал кнопку в игре",
} as const;

export type Goal = keyof typeof GOALS;

type Analytics = Window & {
  ym?: (id: number, action: string, ...rest: unknown[]) => void;
  gtag?: (...args: unknown[]) => void;
};

/** Номер счётчика — тот же, что у тега на странице (components/layout/analytics.tsx). */
function counter(): number | null {
  const raw = (process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID || "").trim();
  return /^\d+$/.test(raw) ? Number(raw) : null;
}

export function goal(name: Goal): void {
  try {
    const w = window as Analytics;
    const id = counter();
    if (id && w.ym) {
      w.ym(id, "reachGoal", name);
      w.ym(id, "params", { goal: { [name]: 1 } });
    }
    w.gtag?.("event", name);
  } catch {
    // Аналитика не имеет права ломать сайт.
  }
}

/** Цель по ссылке или по `data-goal`: телефон, Telegram, WhatsApp или размеченная кнопка. */
export function goalOf(href: string | null | undefined, marked?: string | null): Goal | null {
  if (marked && marked in GOALS) return marked as Goal;
  const h = (href ?? "").trim();
  if (h.startsWith("tel:")) return "contact_tel";
  if (/^https?:\/\/(t\.me|telegram\.me)\//i.test(h) || h.startsWith("tg:")) return "contact_tg";
  if (/^https?:\/\/(wa\.me|api\.whatsapp\.com)\//i.test(h)) return "contact_wa";
  return null;
}

/**
 * Цель по клику — для одного слушателя на всю страницу
 * (components/layout/metrika-hits.tsx): размечать руками каждую из десятков
 * ссылок «позвонить» незачем.
 */
export function goalOfClick(target: EventTarget | null): Goal | null {
  if (typeof Element === "undefined" || !(target instanceof Element)) return null;
  return goalOf(target.closest("a")?.getAttribute("href"), target.closest("[data-goal]")?.getAttribute("data-goal"));
}
