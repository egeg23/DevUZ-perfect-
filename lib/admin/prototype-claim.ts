import { MOCKUP_TERMS_PATH } from "@/content/mockup-terms";
import { PROTOTYPE_HOURS } from "@/lib/admin/outreach";
import { siteUrl } from "@/lib/seo";

/**
 * «Хотят прототип» — кто первый взял, того и лид. Чистая часть: тексты,
 * кнопка, сроки. База — в prototype-claim-store.
 *
 * Владелец, 02.10.2026: «Прототипы собираем мы в ручном режиме. После
 * подтверждения, что надо прототип, — сразу уведомление всем в телеграм, и
 * кто успеет взять — того и лид».
 *
 * Первое письмо касания обещает прототип за 12 часов (PROTOTYPE_HOURS).
 * Клиент ответил «да» — отсчёт пошёл.
 *
 * Владелец, там же: «оставь зазор 30 минут, чтобы лид, который попросил
 * прототип, сначала падал тому, кто его нажал. Не успел за полчаса — падает
 * в общую очередь с пометкой: нужен прототип, бери срочно». Поэтому два
 * шага: сначала автору касания (PROTO_FIRST_MINUTES), потом — всем.
 */

export const PROTO_CALLBACK = "pt";

/** Сколько минут прототип только у автора касания. */
export const PROTO_FIRST_MINUTES = 30;
export const PROTO_BUTTON = "🛠 Беру прототип";

/** `pt:<prospectId>` — 39 байт, в предел Telegram (64) влезает с запасом. */
export function protoCallback(prospectId: string): string {
  return `${PROTO_CALLBACK}:${prospectId}`;
}

/** К какому часу обещан прототип: от минуты, когда его взяли. */
export function protoDeadline(takenAt: Date): Date {
  return new Date(takenAt.getTime() + PROTOTYPE_HOURS * 3600_000);
}

const clock = new Intl.DateTimeFormat("ru-RU", {
  timeZone: "Asia/Tashkent",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

/** «03.10, 06:15» — по Ташкенту. */
export function tashkentClock(at: Date): string {
  return clock.format(at);
}

/** Слова клиента в уведомлении — коротко и без разметки: их пишет посторонний. */
export function clientWords(text: string, max = 300): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
}

/**
 * Клиенту — сразу после его «да»: макет готовим, вот условия.
 *
 * Владелец, 03.10.2026: «После подтверждения клиентом согласия на получение
 * макета высылаем ссылку на условие, которое акцептируется автоматически.
 * Ссылка не требует явного согласия, но предоставляется для ознакомления».
 *
 * Поэтому здесь нет вопроса «согласны?» — только то, что макет даётся на
 * этих условиях, и где их прочитать. Принимаются они действиями клиента
 * после этого сообщения (раздел 5 условий): ответ о проекте, получение или
 * открытие макета. Срок в часах не называем — его обещало первое письмо, и
 * второе обещание с другой цифрой клиенту ни к чему.
 *
 * Язык — по словам клиента: условия есть на всех трёх.
 */
export function protoTermsText(lang: "ru" | "uz" | "en"): string {
  const url = `${siteUrl}/${lang}/${MOCKUP_TERMS_PATH}`;
  switch (lang) {
    case "uz":
      return `Qabul qilindi — siz uchun bepul maket tayyorlayapmiz. Tayyor bo'lishi bilan havolasini yuboramiz.\n\nMaket DevUz Studio shartlari asosida taqdim etiladi, ular bilan tanishib chiqing: ${url}`;
    case "en":
      return `Noted — we are preparing a free mock-up for you and will send the link as soon as it is ready.\n\nThe mock-up is provided under DevUz Studio terms, please read them here: ${url}`;
    default:
      return `Принято — готовим для вас бесплатный макет. Пришлём ссылку, как только он будет готов.\n\nМакет предоставляется на условиях DevUz Studio, ознакомьтесь с ними: ${url}`;
  }
}

/** Строка команде: клиенту уже ответили и дали условия — повторять не надо. */
export const PROTO_TERMS_NOTE =
  "Клиенту сам ушёл ответ «готовим макет» со ссылкой на условия предоставления макета — повторять её не нужно. Если переписка идёт не в Telegram, этот ответ ждёт в карточке касания: отправьте его сами.";

/** Пора ли отдавать прототип всем: автор касания не взял за отведённые минуты. */
export function protoBroadcastDue(requestedAt: Date, now: Date): boolean {
  return now.getTime() - requestedAt.getTime() >= PROTO_FIRST_MINUTES * 60_000;
}

/**
 * Первый шаг — автору касания. `esc` — экранирование HTML из бота: слова
 * клиента и адрес сайта приходят снаружи.
 */
export function protoFirstText(
  input: { host: string; words: string; requestedAt: Date },
  esc: (s: string) => string,
): string {
  const until = new Date(input.requestedAt.getTime() + PROTO_FIRST_MINUTES * 60_000);
  return [
    `🛠 <b>Хотят прототип · ${esc(input.host)}</b>`,
    "",
    `Клиент: «${esc(clientWords(input.words))}»`,
    "",
    `Это ваш клиент — первые ${PROTO_FIRST_MINUTES} минут прототип только у вас: нажмите «${PROTO_BUTTON}». Не возьмёте до ${tashkentClock(until)} — он уйдёт всей команде, и лид получит тот, кто нажмёт первым. Собрать и прислать ссылку — за ${PROTOTYPE_HOURS} часов с момента, как взяли.`,
    "",
    PROTO_TERMS_NOTE,
  ].join("\n");
}

/** Второй шаг — всей команде, через полчаса. */
export function protoAnnounceText(input: { host: string; words: string }, esc: (s: string) => string): string {
  return [
    `🔥 <b>Нужен прототип — бери срочно · ${esc(input.host)}</b>`,
    "",
    `Клиент: «${esc(clientWords(input.words))}»`,
    "",
    `Автор касания не взял за ${PROTO_FIRST_MINUTES} минут. В письме обещали прототип за ${PROTOTYPE_HOURS} часов — отсчёт с той минуты, как его возьмут. Кто первым нажмёт «${PROTO_BUTTON}», того и лид: переписка и клиент переходят к тому, кто нажал.`,
    "",
    PROTO_TERMS_NOTE,
  ].join("\n");
}

/** Надпись вместо кнопки у всех копий, когда прототип взяли. */
export function protoTakenLabel(who: { username: string | null; display_name: string }): string {
  return `🛠 Прототип взят — ${who.username ? `@${who.username}` : who.display_name}`;
}

/** Тому, кто взял: что делать и к какому часу. */
export function protoTakerText(input: { host: string; deadline: Date }, esc: (s: string) => string): string {
  return [
    `🛠 <b>Прототип ваш · ${esc(input.host)}</b>`,
    "",
    `Лид и переписка теперь за вами. Соберите прототип и пришлите клиенту ссылку до <b>${tashkentClock(input.deadline)}</b> по Ташкенту — ${PROTOTYPE_HOURS} часов, как обещали в письме. Напоминание о сроке уже стоит.`,
  ].join("\n");
}

/** Автору касания, если прототип взял другой. */
export function protoMovedText(input: { host: string; who: string }, esc: (s: string) => string): string {
  return `Прототип по ${esc(input.host)} взяли: лид и переписка теперь у ${esc(input.who)}. Касание у вас засчитано.`;
}
