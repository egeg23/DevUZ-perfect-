import { PROTOTYPE_HOURS } from "@/lib/admin/outreach";

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
