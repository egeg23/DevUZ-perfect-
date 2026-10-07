import { HOUR_MS, MAX_GAP_MS, MIN_GAP_MS, sendWindowOpen, untilSendWindow } from "@/lib/admin/outreach";
import { mayTake } from "@/lib/admin/work-accounts";
import { WRITE_MYSELF_BUTTON } from "@/lib/admin/write-myself";

/**
 * Когда примерно уйдёт письмо из очереди — часы, а не «через сколько».
 *
 * Владелец, 07.10.2026: «Менеджеры должны видеть примерное время отправки
 * сообщений из очереди, а то переживают, что сообщения не уйдут».
 *
 * Прежняя оценка (queueView) делила очередь на общий предел всех аккаунтов,
 * как будто любое письмо может уйти с любого. Это не так, и именно там она
 * врала больше всего:
 * - письмо менеджера уходит только с его аккаунтов (mayTake) — а их
 *   аккаунт Telegram мог ограничить на сутки, и тогда «примерно через
 *   20 минут» висело с утра до вечера;
 * - после 20:30 очередь стоит до утра, а «через 5 часов» в 19:00 читалось
 *   как «ночью»;
 * - письма владельца идут вперёд.
 *
 * Поэтому здесь очередь проигрывается так же, как её разбирает скаут
 * (lib/admin/outreach-queue.ts → nextQueued): каждый аккаунт по своему
 * пределу, со своей паузой и своими уже ушедшими за час письмами, в окне
 * 07:30–20:30; письмо берёт тот аккаунт, у которого раньше освободилось
 * место и которому его можно брать. Пауза — середина 8–20 минут: скаут
 * берёт её случайной, и точнее «примерно» не скажешь.
 */

/** Пауза между первыми письмами одного аккаунта — середина разброса. */
export const TYPICAL_GAP_MS = Math.round((MIN_GAP_MS + MAX_GAP_MS) / 2);

export type EtaAccount = {
  key: string;
  /** Первых писем в час. */
  cap: number;
  /** До какого момента Telegram ограничил аккаунт (мс); null — может писать. */
  until: number | null;
  /** Когда ушли его первые письма за последний час (мс). */
  sent: number[];
  /** Его последнее первое письмо (мс) — от него считается пауза. */
  lastAt: number | null;
};

export type EtaJob = {
  id: string;
  /** Письмо владельца: вне очереди, мимо предела и паузы (OWNER_FLOOR_MS). */
  owner: boolean;
  /** Аккаунты, на которых работает автор; пусто — любой (mayTake). */
  accounts: ReadonlySet<string> | undefined;
};

export type Eta = {
  /** Когда примерно уйдёт (мс); null — ни один аккаунт его не возьмёт. */
  at: number | null;
  /** Сколько писем очереди уйдёт раньше этого. */
  ahead: number;
  /**
   * Все аккаунты, с которых это письмо может уйти, Telegram ограничил — до
   * этого момента (мс). Тогда письмо ждёт не очередь, а аккаунт, и менеджеру
   * говорится именно это.
   */
  heldUntil: number | null;
};

/** Сколько шагов искать ближайшую минуту, когда аккаунт может писать. */
const MAX_STEPS = 64;

/** Когда этот аккаунт сможет отправить следующее первое письмо, не раньше `from`. */
function earliest(account: EtaAccount, from: number, owner: boolean, ownerFloorMs: number): number {
  let t = Math.max(from, account.until ?? 0);
  for (let step = 0; step < MAX_STEPS; step++) {
    if (!sendWindowOpen(t)) {
      t += untilSendWindow(t);
      continue;
    }
    const gap = owner ? ownerFloorMs : TYPICAL_GAP_MS;
    if (account.lastAt !== null && t < account.lastAt + gap) {
      t = account.lastAt + gap;
      continue;
    }
    if (!owner) {
      // Предел — по факту отправки за час, как в sentLastHour.
      const inHour = account.sent.filter((at) => at > t - HOUR_MS && at <= t).sort((a, b) => a - b);
      if (inHour.length >= account.cap) {
        t = inHour[inHour.length - account.cap] + HOUR_MS;
        continue;
      }
    }
    return t;
  }
  return t;
}

/**
 * Проиграть очередь: кто когда уйдёт.
 *
 * `jobs` — в порядке очереди (claimed_at); письма владельца поднимаются
 * вперёд здесь же. `accounts` — только те, что могут писать сейчас или
 * после ограничения: выключенный аккаунт письма не возьмёт никогда.
 */
export function queueEtas(input: {
  jobs: readonly EtaJob[];
  accounts: readonly EtaAccount[];
  now: number;
  /** Пауза для письма владельца — OWNER_FLOOR_MS из outreach-queue. */
  ownerFloorMs: number;
}): Map<string, Eta> {
  const { now, ownerFloorMs } = input;
  const accounts = input.accounts.map((a) => ({ ...a, sent: [...a.sent] }));
  const pending = [...input.jobs.filter((j) => j.owner), ...input.jobs.filter((j) => !j.owner)];
  const out = new Map<string, Eta>();

  // Ждёт ли письмо ограниченный аккаунт: все, кому его можно брать, стоят.
  const heldUntil = (job: EtaJob): number | null => {
    const allowed = accounts.filter((a) => mayTake(a.key, job.accounts));
    if (!allowed.length || allowed.some((a) => !a.until || a.until <= now)) return null;
    return Math.min(...allowed.map((a) => a.until as number));
  };

  let ahead = 0;
  while (pending.length) {
    let best: { account: (typeof accounts)[number]; index: number; at: number } | null = null;
    for (const account of accounts) {
      // Аккаунт берёт первое письмо, которое ему можно брать (nextQueued).
      const index = pending.findIndex((job) => mayTake(account.key, job.accounts));
      if (index < 0) continue;
      const at = earliest(account, now, pending[index].owner, ownerFloorMs);
      if (!best || at < best.at) best = { account, index, at };
    }
    if (!best) break;

    const [job] = pending.splice(best.index, 1);
    out.set(job.id, { at: best.at, ahead, heldUntil: heldUntil(job) });
    best.account.sent.push(best.at);
    best.account.lastAt = best.at;
    ahead += 1;
  }

  // Остались те, кого не возьмёт ни один аккаунт: автор привязан только к
  // выключенным.
  for (const job of pending) out.set(job.id, { at: null, ahead, heldUntil: null });
  return out;
}

/* ── Часы по Ташкенту ─────────────────────────────────────────────────── */

const TASHKENT_SHIFT_MS = 5 * HOUR_MS;
const DAY_MS = 24 * HOUR_MS;
/** Точнее пяти минут оценка не бывает — и показывать её точнее незачем. */
const ROUND_MS = 5 * 60_000;

export type EtaClock = {
  /** Сегодня, завтра или позже — по календарю Ташкента. */
  day: "soon" | "today" | "tomorrow" | "later";
  /** «14:20» — округлено до пяти минут. */
  time: string;
  /** «08.10» — для «позже». */
  date: string;
};

/** Время отправки так, как его скажет человек: «сегодня в 14:20», «завтра в 08:10». */
export function etaClock(at: number, now: number): EtaClock {
  const rounded = Math.ceil(at / ROUND_MS) * ROUND_MS;
  const local = new Date(rounded + TASHKENT_SHIFT_MS);
  const time = `${String(local.getUTCHours()).padStart(2, "0")}:${String(local.getUTCMinutes()).padStart(2, "0")}`;
  const date = `${String(local.getUTCDate()).padStart(2, "0")}.${String(local.getUTCMonth() + 1).padStart(2, "0")}`;
  if (at - now <= 3 * 60_000) return { day: "soon", time, date };
  const dayOf = (ms: number) => Math.floor((ms + TASHKENT_SHIFT_MS) / DAY_MS);
  const days = dayOf(rounded) - dayOf(now);
  return { day: days <= 0 ? "today" : days === 1 ? "tomorrow" : "later", time, date };
}

/** То же по-русски — для бота: он пишет по-русски, пока не пишет на языке панели. */
export function etaText(at: number, now: number): string {
  const c = etaClock(at, now);
  if (c.day === "soon") return "в ближайшие минуты";
  if (c.day === "today") return `сегодня около ${c.time}`;
  if (c.day === "tomorrow") return `завтра около ${c.time}`;
  return `${c.date} около ${c.time}`;
}

/** «до 08.10 13:07» — до какого времени ограничен аккаунт, по Ташкенту. */
export function untilText(at: number): string {
  const local = new Date(at + TASHKENT_SHIFT_MS);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(local.getUTCDate())}.${pad(local.getUTCMonth() + 1)} ${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}`;
}

/**
 * Что сказать в боте после «📤 Отправить через бота»: надпись под карточкой
 * и, когда письмо ждёт не очередь, а аккаунт, — отдельное сообщение. Под
 * карточкой оно бы не поместилось, а всплывающая подсказка Telegram гаснет
 * через пару секунд — ровно та тишина, из-за которой менеджеры и решали,
 * что письмо потерялось.
 */
export function botQueueNote(eta: Eta | undefined, now: number): { label: string; note: string | null } {
  if (!eta) return { label: "📤 В очереди бота", note: null };
  if (eta.at === null) {
    return {
      label: "📤 В очереди · ждёт аккаунт",
      note:
        "⚠️ Это письмо сейчас не возьмёт ни один рабочий аккаунт: вы отмечены только на выключенных. " +
        `Нажмите «${WRITE_MYSELF_BUTTON}» под карточкой и напишите клиенту сами — или попросите руководителя добавить вас на работающий аккаунт.`,
    };
  }
  const when = etaText(eta.at, now);
  const label = `📤 В очереди · уйдёт ${when}`;
  if (eta.heldUntil === null) return { label, note: null };
  return {
    label,
    note:
      `⏳ Рабочий аккаунт, с которого уходят ваши письма, Telegram ограничил до ${untilText(eta.heldUntil)} по Ташкенту — ` +
      `письмо уйдёт ${when}. Не хотите ждать — нажмите «${WRITE_MYSELF_BUTTON}» под карточкой: бот письмо не отправит, а пришлёт его текст, чтобы вы написали клиенту сами.`,
  };
}
