import { esc, sendMessage } from "@/lib/qualify/telegram";
import { serviceClient } from "@/lib/supabase";

/**
 * Видимый сигнал о том, что свип напоминаний жив.
 *
 * Без него механизм ломается молча. Не доехала переменная окружения, упал
 * прокси, сменился секрет — напоминания просто перестают приходить, и
 * узнают об этом по остывшему лиду через неделю. Тишина неотличима от
 * «напоминать было нечего», и это худшее свойство, какое может быть у
 * механизма, который существует ради того, чтобы о лиде не забыли.
 *
 * Границы честности. Эта запись ловит «свип запустился и не смог», но не
 * ловит «свип не запустился вовсе»: код, который не выполняется, не может
 * о себе сообщить. Второй случай закрывает last_ok_at — по нему панель
 * показывает, когда свип отработал в последний раз, и протухшее значение
 * видно глазом.
 */

const KEY = "sweep_health";

/** Три неудачи подряд — это пятнадцать минут по таймеру в пять минут. */
const ALERT_AFTER = 3;

export type SweepHealth = {
  last_ok_at: string | null;
  consecutive_failures: number;
  /** Об аварии уже сообщили — второй раз не пишем до восстановления. */
  alerted: boolean;
  last_error: string | null;
};

const EMPTY: SweepHealth = {
  last_ok_at: null,
  consecutive_failures: 0,
  alerted: false,
  last_error: null,
};

/**
 * Что записать и о чём сообщить. Вынесено из работы с базой намеренно.
 *
 * Правило «сообщить один раз за аварию и один раз о восстановлении»
 * состоит из трёх состояний и четырёх переходов, и ошибка в нём не видна
 * ни в типах, ни на глаз: она проявляется дежурному в три часа ночи —
 * либо двенадцатью сообщениями в час, либо тишиной вместо тревоги. Здесь
 * это чистая функция, и её поведение проверяется тестом целиком.
 */
export function transition(
  before: SweepHealth | null,
  outcome: { ok: true; at: string } | { ok: false; reason: string },
): { next: SweepHealth; announce: "broken" | "recovered" | null } {
  const prev = before ?? EMPTY;

  if (outcome.ok) {
    return {
      next: { last_ok_at: outcome.at, consecutive_failures: 0, alerted: false, last_error: null },
      // О восстановлении говорим, только если об аварии успели сказать.
      // Иначе первый же одиночный сбой давал бы «снова работает» о том,
      // что и не переставало.
      announce: prev.alerted ? "recovered" : null,
    };
  }

  const failures = prev.consecutive_failures + 1;
  const shouldAlert = failures >= ALERT_AFTER && !prev.alerted;

  return {
    next: {
      last_ok_at: prev.last_ok_at,
      consecutive_failures: failures,
      alerted: prev.alerted || shouldAlert,
      last_error: outcome.reason.slice(0, 200),
    },
    announce: shouldAlert ? "broken" : null,
  };
}

export async function readHealth(): Promise<SweepHealth | null> {
  const db = serviceClient();
  if (!db) return null;

  const { data } = await db
    .from("stats_snapshots")
    .select("payload")
    .eq("key", KEY)
    .maybeSingle();

  if (!data) return null;
  return { ...EMPTY, ...((data.payload as Partial<SweepHealth>) ?? {}) };
}

async function write(payload: SweepHealth): Promise<void> {
  const db = serviceClient();
  if (!db) return;

  const { error } = await db
    .from("stats_snapshots")
    .upsert(
      { key: KEY, payload, computed_at: new Date().toISOString() },
      { onConflict: "key" },
    );

  if (error) console.error("sweep_health", error.message);
}

/**
 * Проход удался.
 *
 * Если до этого была авария, о которой сообщили, — говорим и о
 * восстановлении. Одно сообщение, но без него владелец знает только то,
 * что что-то сломалось, и не знает, что чинить больше нечего.
 */
export async function recordSuccess(): Promise<void> {
  const before = await readHealth();
  const { next, announce: what } = transition(before, { ok: true, at: new Date().toISOString() });

  await write(next);
  if (what === "recovered") {
    await announce(
      `<b>Напоминания снова доставляются.</b>\nПерерыв длился с ${when(before?.last_ok_at ?? null)}.`,
    );
  }
}

/**
 * Проход не удался.
 *
 * Сообщение уходит один раз за аварию, а не на каждый неудачный проход:
 * иначе поломка прокси превращается в двенадцать сообщений в час, и их
 * начинают игнорировать вместе с настоящими напоминаниями.
 */
export async function recordFailure(reason: string): Promise<void> {
  const before = await readHealth();
  const { next, announce: what } = transition(before, { ok: false, reason });

  await write(next);

  if (what === "broken") {
    await announce(
      [
        "<b>Напоминания не доставляются.</b>",
        `Последний удачный проход: ${when(next.last_ok_at)}.`,
        `Причина: <code>${esc(reason.slice(0, 200))}</code>`,
        "",
        "Повторять это сообщение не будем — напишем, когда заработает.",
      ].join("\n"),
    );
  }
}

function when(iso: string | null): string {
  if (!iso) return "неизвестно (свип ни разу не отрабатывал успешно)";
  return new Date(iso).toLocaleString("ru-RU", { timeZone: "Asia/Tashkent" });
}

async function announce(text: string): Promise<void> {
  const chatId = process.env.TELEGRAM_SALES_CHAT_ID;
  if (!chatId) return;
  await sendMessage(chatId, text);
}
