import type { PanelLocale } from "@/lib/admin/i18n";
import { quotaOf, tashkentHour } from "@/lib/admin/portion";

/**
 * Сигнал о молчании: день идёт, а человека нет — ни касаний, ни панели, ни
 * действий.
 *
 * Владелец, 13.10.2026, «Делаем». За 14 дней пятеро из одиннадцати не
 * сделали ни одного касания, хотя порцию им выдавали каждый день; один за
 * две недели был в панели один день. Вечерний отчёт в 18:00 говорит об этом,
 * когда день уже прошёл, — а поправить его можно только днём.
 *
 * - В 12:00 по Ташкенту, по рабочим дням, — самому человеку: по-человечески,
 *   про порцию дня и со ссылкой на «Касания».
 * - В 15:00, если так ничего и не сделано, — строка руководителям и
 *   владельцу: кто молчит.
 *
 * Каждому один раз в день (team_news_sent). Здесь — чистые правила и
 * тексты; база и Telegram — lib/admin/silence-store.ts.
 */

export const NUDGE_HOUR = 12;
export const ALERT_HOUR = 15;
/** Позже — уже вечерний отчёт в 18:00, он скажет то же самое. */
export const SILENCE_LATEST_HOUR = 18;

export type SilenceStep = "nudge" | "alert";

/**
 * Что пора делать в этот час. С 12:00 до 15:00 — напоминание; с 15:00 до
 * 18:00 — строка руководителям. Напоминание, не дошедшее до 15:00 (молчал
 * сервер или Telegram), уже не шлётся: к этому времени о человеке узнает
 * руководитель.
 */
export function silenceStep(hour: number): SilenceStep | null {
  if (hour >= NUDGE_HOUR && hour < ALERT_HOUR) return "nudge";
  if (hour >= ALERT_HOUR && hour < SILENCE_LATEST_HOUR) return "alert";
  return null;
}

export function silenceStepAt(now: Date): SilenceStep | null {
  return silenceStep(tashkentHour(now));
}

export type DayActivity = {
  /** Касаний за сегодня — все: порция, поток, панель. */
  touches: number;
  /** Просмотров разделов панели за сегодня. */
  views: number;
  /** Активных минут в панели за сегодня. */
  minutes: number;
  /** Действий в журнале за сегодня, кроме входов (login.*). */
  actions: number;
};

/** Молчит: ни одного касания, захода в панель и действия. */
export function silent(a: DayActivity): boolean {
  return a.touches === 0 && a.views === 0 && a.minutes === 0 && a.actions === 0;
}

/**
 * Не на работе — по тому, что уже есть в «Команде»: отдельного «отпуска» у
 * сотрудника нет.
 *
 * - План касаний 0 — касаний ему не нужно, порции нет; напоминать про
 *   порцию незачем.
 * - Снята галочка «Новые заявки по очереди» — так руководитель выводит
 *   человека из работы на время отпуска или больничного (так и написано в
 *   инструкции к «Команде»).
 */
export function away(touchPlan: number | null, queueOn: boolean): boolean {
  return quotaOf(touchPlan) === 0 || !queueOn;
}

/** Отметка «уже писали сегодня» в team_news_sent. */
export function silenceKey(step: SilenceStep, day: string): string {
  return `silence-${step}:${day}`;
}

/** Ссылка в сообщении — в «Касания», где лежит порция дня. */
export const NUDGE_PANEL = "/admin/prospect";

const NUDGE: Record<PanelLocale, { hello: string; bare: string; body: string; button: string }> = {
  ru: {
    hello: "{name}, добрый день!",
    bare: "Добрый день!",
    body:
      "Уже полдень, а касаний сегодня ещё не было. Порция дня ждёт в «Касаниях»: тексты готовы, на каждую компанию — пара минут. Если сегодня не получается — напишите руководителю, чтобы он знал.",
    button: "Открыть порцию дня",
  },
  uz: {
    hello: "{name}, xayrli kun!",
    bare: "Xayrli kun!",
    body:
      "Tush bo‘ldi, bugun hali birorta aloqa yo‘q. Kunlik to‘plam «Aloqalar»da kutyapti: matnlar tayyor, har bir kompaniyaga bir-ikki daqiqa. Bugun ulgurmasangiz, rahbarga yozing, u bilib tursin.",
    button: "Kunlik to‘plamni ochish",
  },
  pl: {
    hello: "{name}, dzień dobry!",
    bare: "Dzień dobry!",
    body:
      "Jest już południe, a dziś nie było jeszcze żadnego kontaktu. Porcja dnia czeka w «Kontaktach»: teksty są gotowe, na każdą firmę wystarczy kilka minut. Jeśli dziś się nie da, napisz do kierownika, żeby wiedział.",
    button: "Otwórz porcję dnia",
  },
};

/** Напоминание человеку. Имя приходит уже экранированным — сообщение с разметкой. */
export function nudgeText(name: string | null, locale: PanelLocale): string {
  const t = NUDGE[locale] ?? NUDGE.ru;
  const hello = name ? t.hello.replace("{name}", name) : t.bare;
  return `🕛 ${hello} ${t.body}`;
}

export function nudgeButton(locale: PanelLocale): string {
  return (NUDGE[locale] ?? NUDGE.ru).button;
}

/**
 * Строка руководителям и владельцу. Имена уже экранированы. Пусто — писать
 * нечего. Бот команде пишет по-русски, как и вечерний отчёт.
 */
export function alertText(names: readonly string[]): string | null {
  if (!names.length) return null;
  const list = [...names].sort((a, b) => a.localeCompare(b, "ru")).join(", ");
  const who = names.length === 1 ? "молчит" : "молчат";
  return `🔕 К 15:00 ${who}: ${list} — ни одного касания, ни захода в панель, ни действия в боте. Стоит позвонить и узнать, что случилось.`;
}
