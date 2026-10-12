import type { PanelLocale } from "@/lib/admin/i18n";
import { tashkentHour } from "@/lib/admin/portion";
import { tashkentDate } from "@/lib/admin/pulse";
import type { Role } from "@/lib/admin/roles";

/**
 * «Доброе утро» сотрудникам — каждый день в 09:00 по Ташкенту, каждому по
 * имени.
 *
 * Владелец, 13.10.2026: «Каждое утро в 09:00 бот должен желать хорошего дня
 * сотрудникам поименно». Сотрудники — менеджеры и руководитель; владельцу
 * не пишем. Каждый день, выходные тоже: «каждое утро». Тексты — готовые, без
 * модели: короткое пожелание не стоит вызова. На языке панели человека —
 * узбекоговорящему по-узбекски теплее, чем по-русски.
 *
 * Отправка — lib/admin/morning-store.ts, галочка «Доброе утро в 09:00» — в
 * «Команде» (lib/admin/notify-prefs.ts).
 */

export const MORNING_HOUR = 9;
/**
 * До какого часа досылать. Сервер или Telegram молчали в 09:00 — пожелание
 * уйдёт, как только связь вернётся, но не позже полудня: «доброе утро» в
 * два часа дня звучит как издёвка.
 */
export const MORNING_LATEST_HOUR = 12;

export const MORNING_ROLES: readonly Role[] = ["head", "manager"];

export function morningWindow(now: Date): boolean {
  const hour = tashkentHour(now);
  return hour >= MORNING_HOUR && hour < MORNING_LATEST_HOUR;
}

/** Имя для обращения: первое слово из «Как зовут» в «Команде». */
export function firstName(displayName: string | null | undefined): string | null {
  const word = (displayName ?? "").trim().split(/\s+/)[0];
  return word ? word : null;
}

type Texts = {
  /** Понедельник, пятница, суббота, воскресенье — свои слова. */
  monday: string;
  friday: string;
  saturday: string;
  sunday: string;
  /** Вторник–четверг — по кругу, чтобы не повторялось изо дня в день. */
  rest: readonly string[];
  /** Обращение без имени: в «Команде» имя не заполнено. */
  hello: string;
};

/** {name} — место для имени вместе с приветствием. */
const TEXTS: Record<PanelLocale, Texts> = {
  ru: {
    monday: "{hello} Новая неделя — хорошего старта и удачных касаний ☀️",
    friday: "{hello} Пятница — пусть день будет лёгким, а выходные спокойными ☀️",
    saturday: "{hello} Хорошей субботы ☀️",
    sunday: "{hello} Хорошего воскресенья и отдыха ☀️",
    rest: [
      "{hello} Хорошего дня и тёплых клиентов ☀️",
      "{hello} Пусть сегодня ответят те, кому вы писали вчера. Хорошего дня!",
      "{hello} Хорошего дня — и пусть сегодня будет хотя бы одно «да» ☕",
      "{hello} Хорошего дня и лёгких разговоров с клиентами.",
    ],
    hello: "Доброе утро, {name}!",
  },
  uz: {
    monday: "{hello} Yangi haftaga omad tilaymiz ☀️",
    friday: "{hello} Bugun juma, kuningiz yengil o‘tsin ☀️",
    saturday: "{hello} Shanba kuningiz yaxshi o‘tsin ☀️",
    sunday: "{hello} Yakshanba kuningiz yaxshi o‘tsin, yaxshi dam oling ☀️",
    rest: [
      "{hello} Kuningiz xayrli o‘tsin ☀️",
      "{hello} Bugun mijozlar bilan omad tilaymiz.",
      "{hello} Yaxshi kun tilaymiz ☕",
    ],
    hello: "Xayrli tong, {name}!",
  },
  pl: {
    monday: "{hello} Udanego startu w nowym tygodniu ☀️",
    friday: "{hello} Piątek, niech dzień będzie lekki, a weekend spokojny ☀️",
    saturday: "{hello} Miłej soboty ☀️",
    sunday: "{hello} Miłej niedzieli i odpoczynku ☀️",
    rest: [
      "{hello} Miłego dnia ☀️",
      "{hello} Udanych rozmów z klientami.",
      "{hello} Dobrego dnia ☕",
    ],
    hello: "Dzień dobry, {name}!",
  },
};

/** Без имени — просто приветствие, без запятой в пустоту. */
const BARE_HELLO: Record<PanelLocale, string> = { ru: "Доброе утро!", uz: "Xayrli tong!", pl: "Dzień dobry!" };

/**
 * Текст пожелания. Имя приходит уже готовым к вставке в HTML — экранирует
 * вызывающий (сообщения бота идут с разметкой).
 */
export function morningGreeting(name: string | null, locale: PanelLocale, now: Date): string {
  const texts = TEXTS[locale] ?? TEXTS.ru;
  const hello = name ? texts.hello.replace("{name}", name) : BARE_HELLO[locale] ?? BARE_HELLO.ru;
  const { year, month, day, weekday } = tashkentDate(now);
  const body =
    weekday === 1
      ? texts.monday
      : weekday === 5
        ? texts.friday
        : weekday === 6
          ? texts.saturday
          : weekday === 7
            ? texts.sunday
            : texts.rest[Math.floor(Date.UTC(year, month - 1, day) / 86_400_000) % texts.rest.length];
  return body.replace("{hello}", hello);
}

/** Отметка «уже пожелали сегодня» — одна строка на человека и день. */
export function morningKey(now: Date): string {
  const { year, month, day } = tashkentDate(now);
  return `morning:${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
