/**
 * Ограничения рабочих аккаунтов Telegram: проверка каждый час и оповещение
 * всей команды.
 *
 * Владелец, 07.10.2026: «Проводи проверку каждый час на предмет бана с
 * уведомлением от бота всем. Это значит, что пока действует бан, сообщения
 * уходить не будут и надо писать с личного аккаунта или с другого рабочего».
 *
 * Раньше об ограничении узнавали только по отказу на отправке (PEER_FLOOD) —
 * и узнавал о нём только скаут: аккаунт молча вставал на сутки, письма
 * менеджеров копились в очереди, а сами менеджеры видели «в очереди» и
 * ждали. Теперь каждый аккаунт раз в час спрашивает @SpamBot — службу
 * Telegram, которая отвечает, ограничен ли аккаунт и до какого времени, — а
 * свип пишет всей команде, когда ограничение появилось, продлилось и снято.
 *
 * Здесь — чистая часть: разбор ответа @SpamBot, кому и что писать. База —
 * в account-ban-store, вопрос к @SpamBot — в скауте (scout/runner.mjs).
 */

/** Как часто каждый аккаунт спрашивает @SpamBot. */
export const BAN_CHECK_MS = 60 * 60_000;

/** Сколько ждать ответа @SpamBot, прежде чем считать проверку несостоявшейся. */
export const BAN_REPLY_WAIT_MS = 20_000;

/** Ограничение без срока или по отказу на отправке — сутки, как FLOOD_PAUSE_MS. */
export const BAN_DEFAULT_MS = 24 * 60 * 60_000;

/** Строка проверки в stats_snapshots — своя у каждого аккаунта. */
export const banKey = (account: string) => `tg-ban:${account}`;

/** Что уже сказано команде: аккаунт → до какого времени (мс). */
export const BAN_NOTIFIED_KEY = "tg-ban-notified";

export type BanVerdict = {
  limited: boolean;
  /** До какого времени (мс), если @SpamBot его назвал. */
  until: number | null;
};

const FREE =
  /no limits|free as a bird|not limited|никаких ограничений|ограничений нет|не ограничен|свобод[еуыа]|cheklov(?:lar)? yo['‘’ʻ]?q|cheklanmagan/i;
const LIMITED = /limit|restrict|ограничен|заблокир|spam|спам|cheklang/i;

const MONTHS_EN = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const MONTHS_RU = ["янв", "фев", "мар", "апр", "ма", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

/** Дата освобождения из ответа @SpamBot — он пишет её в UTC. */
function releaseDate(text: string): number | null {
  const en = /(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{4}),?\s+(\d{1,2}):(\d{2})/i.exec(text);
  if (en) return Date.UTC(Number(en[3]), MONTHS_EN.indexOf(en[2].toLowerCase()), Number(en[1]), Number(en[4]), Number(en[5]));
  // «October 8, 2026 at 08:07»
  const us = /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4}),?\s+(?:at\s+)?(\d{1,2}):(\d{2})/i.exec(text);
  if (us) return Date.UTC(Number(us[3]), MONTHS_EN.indexOf(us[1].toLowerCase()), Number(us[2]), Number(us[4]), Number(us[5]));
  // «8 окт. 2026 г., 08:07», «8 октября 2026 года в 8:07»
  const ru = /(\d{1,2})\s+(янв|фев|мар|апр|ма[йя]|июн|июл|авг|сен|окт|ноя|дек)[а-я]*\.?\s+(\d{4})(?:\s*(?:года|г\.?))?,?\s*(?:в\s*)?(\d{1,2}):(\d{2})/i.exec(text);
  if (ru) {
    const month = MONTHS_RU.indexOf(ru[2].toLowerCase().startsWith("ма") ? "ма" : ru[2].toLowerCase());
    return Date.UTC(Number(ru[3]), month, Number(ru[1]), Number(ru[4]), Number(ru[5]));
  }
  return null;
}

/**
 * Что ответил @SpamBot. null — ответ не разобран: тогда не делаем ничего,
 * ни «снято», ни «ограничен» — ошибка разбора не должна ни будить команду,
 * ни выпускать письма с ограниченного аккаунта.
 */
export function spamBotVerdict(text: string, now: number): BanVerdict | null {
  if (FREE.test(text)) return { limited: false, until: null };
  if (!LIMITED.test(text)) return null;
  const until = releaseDate(text);
  return { limited: true, until: until !== null && until > now ? until : null };
}

/* ── Оповещение команды ───────────────────────────────────────────────── */

export type Ban = {
  key: string;
  /** Как аккаунт называется в панели. */
  label: string;
  /** До какого времени (мс). */
  until: number;
  /** Сколько писем очереди могут уйти только с этого аккаунта. */
  stuck: number;
  /** Чьи письма уходят только с него — им писать с личного или другого рабочего. */
  people: string[];
};

export type BanNotice = { kind: "new" | "longer" | "lifted"; key: string; text: string };

const TASHKENT_SHIFT_MS = 5 * 60 * 60_000;

/** «08.10 13:07» по Ташкенту. */
export function tashkentStamp(at: number): string {
  const d = new Date(at + TASHKENT_SHIFT_MS);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getUTCDate())}.${pad(d.getUTCMonth() + 1)} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

function banText(ban: Ban, longer: boolean, esc: (s: string) => string): string {
  const head = longer
    ? `⛔️ <b>Ограничение продлено: рабочий аккаунт «${esc(ban.label)}» — до ${tashkentStamp(ban.until)} по Ташкенту.</b>`
    : `⛔️ <b>Telegram ограничил рабочий аккаунт «${esc(ban.label)}» — до ${tashkentStamp(ban.until)} по Ташкенту.</b>`;
  const lines = [
    head,
    "",
    "Пока ограничение действует, первые сообщения новым клиентам с этого аккаунта не уходят. Переписка с теми, кто уже ответил, идёт как обычно.",
  ];
  if (ban.stuck) lines.push(`В очереди ждут ${ban.stuck} — уйти они могут только с него.`);
  if (ban.people.length) lines.push(`Касается: ${ban.people.map(esc).join(", ")} — ваши письма уходят только с этого аккаунта.`);
  lines.push(
    "",
    "<b>Что делать:</b> пишите клиентам с личного аккаунта или с другого рабочего и нажимайте «Связался сам» в карточке касания — тогда бот свою копию не отправит. Как только ограничение снимут, бот напишет.",
  );
  return lines.join("\n");
}

/**
 * Что сказать команде: новое ограничение, продление (срок, который мы уже
 * назвали, прошёл, а аккаунт всё стоит) и снятие. Продление, которое пришло
 * раньше названного срока, не повторяется: @SpamBot каждый час уточняет дату,
 * и писать всей команде каждый час — это шум, после которого бот перестают
 * читать.
 */
export function banNotices(input: {
  bans: readonly Ban[];
  /** Что уже сказано: аккаунт → названный срок (мс). */
  told: Readonly<Record<string, number>>;
  /** Как называются аккаунты — для «снято»: снятого в bans уже нет. */
  labels: Readonly<Record<string, string>>;
  now: number;
  esc: (s: string) => string;
}): { notices: BanNotice[]; told: Record<string, number> } {
  const { bans, told, labels, now, esc } = input;
  const notices: BanNotice[] = [];
  const next: Record<string, number> = {};

  for (const ban of bans) {
    const before = told[ban.key];
    if (before === undefined) {
      notices.push({ kind: "new", key: ban.key, text: banText(ban, false, esc) });
      next[ban.key] = ban.until;
    } else if (before <= now && ban.until > before) {
      notices.push({ kind: "longer", key: ban.key, text: banText(ban, true, esc) });
      next[ban.key] = ban.until;
    } else {
      next[ban.key] = before;
    }
  }

  for (const key of Object.keys(told)) {
    if (bans.some((ban) => ban.key === key)) continue;
    const label = labels[key] ?? key;
    notices.push({
      kind: "lifted",
      key,
      text: `✅ <b>Рабочий аккаунт «${esc(label)}» снова пишет</b> — ограничение Telegram снято. Письма из очереди пойдут с него сами.`,
    });
  }
  return { notices, told: next };
}
