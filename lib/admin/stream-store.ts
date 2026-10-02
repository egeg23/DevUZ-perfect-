import { record } from "@/lib/admin/audit";
import { inQueue } from "@/lib/admin/lead-queue";
import { prepareOutreach, prospectById, prospectsByIds, type Prospect } from "@/lib/admin/outreach-store";
import {
  claimDelivery,
  dayRow,
  itemButtons,
  itemText,
  markBare,
  pool,
  ready,
  releaseOnModelTrouble,
  rowsOfDay,
  type DayRow,
} from "@/lib/admin/portion-store";
import { todayInTashkent } from "@/lib/admin/pulse";
import { staffById, type Staff } from "@/lib/admin/session";
import { STREAM_BUFFER, STREAM_OFF, STREAM_ON, streamHours, streamNeed, streamWaiting } from "@/lib/admin/stream";
import { sendKeyboard, sendMessage, sendWithRows, type Button } from "@/lib/qualify/telegram";
import { serviceClient } from "@/lib/supabase";

/**
 * Поток «Получать лиды» — база и Telegram. Правила — в lib/admin/stream.
 *
 * Включается кнопкой внизу чата с ботом (или /leads) и живёт строкой в
 * lead_streams, пока человек не нажмёт «⏸ Не получать лиды». Компании
 * пишутся строками touch_portions с source = 'stream': так они не уходят
 * второму человеку, их кнопки в боте работают как у порции, а в 18:00
 * несделанное возвращается в пул тем же вечерним проходом.
 *
 * Доливают поток двое: кнопка в боте — сразу после нажатия, чтобы
 * следующая компания пришла, пока человек ещё в чате, — и свип раз в пять
 * минут (для действий из панели и для тех, кому пул был пуст).
 */

/** Кнопка под карточкой потока — выключить, не ища клавиатуру внизу. */
export const STREAM_STOP_ROW: Button[] = [{ text: STREAM_OFF, callback_data: "ls:off" }];

/** Сколько ждать чужой подготовки письма, прежде чем отдать карточку без текста. */
const PREPARE_WAIT_MS = 15 * 60_000;
/** Замок подачи старше — брошен (упал процесс): берём заново. */
const LOCK_STALE_MS = 10 * 60_000;

export type StreamState = { on: boolean; since: string | null };

export async function streamState(staffId: string): Promise<StreamState> {
  const db = serviceClient();
  if (!db) return { on: false, since: null };
  const { data } = await db.from("lead_streams").select("started_at").eq("staff_id", staffId).maybeSingle();
  return { on: Boolean(data), since: (data?.started_at as string | undefined) ?? null };
}

export type StreamSwitch = { ok: true; changed: boolean } | { ok: false; why: "role" | "offline" };

/**
 * Включить или выключить. Поток — для тех, кто получает порцию:
 * менеджеров и руководителей. Владелец порции не получает, и его строки
 * вечерний отчёт не закрыл бы — компании остались бы висеть за ним.
 */
export async function setStream(staff: Staff, on: boolean): Promise<StreamSwitch> {
  if (!inQueue(staff.role)) return { ok: false, why: "role" };
  const db = serviceClient();
  if (!db) return { ok: false, why: "offline" };

  let changed: boolean;
  if (on) {
    const { data } = await db
      .from("lead_streams")
      .upsert({ staff_id: staff.id }, { onConflict: "staff_id", ignoreDuplicates: true })
      .select("staff_id");
    changed = Boolean(data?.length);
  } else {
    const { data } = await db.from("lead_streams").delete().eq("staff_id", staff.id).select("staff_id");
    changed = Boolean(data?.length);
  }
  if (changed) await record(on ? "stream.on" : "stream.off", { actorStaffId: staff.id, meta: { via: "telegram" } });
  return { ok: true, changed };
}

/** Текст и клавиатура после включения. */
export function streamOnText(now: Date): string {
  return [
    "<b>Поток включён</b>",
    "",
    `Компании из общего пула будут приходить сюда по одной — с готовым текстом и теми же кнопками, что в порции дня. Без лимита: разобрали — пришла следующая. Неразобранных у вас одновременно не больше ${STREAM_BUFFER}.`,
    "Работает по будням с 9:00 до 18:00, после утренней порции; что не разберёте до 18:00, вернётся в общий пул. Поток — сверх порции и в её счёт не идёт.",
    ...(streamHours(now) ? [] : ["Сейчас нерабочее время — первые компании придут в 9:00 в рабочий день."]),
    `Остановить — кнопка «${STREAM_OFF}» внизу чата или /leads.`,
  ].join("\n");
}

export const STREAM_OFF_TEXT = [
  "<b>Поток выключен</b>",
  "",
  "Новые компании больше не придут. Те, что уже у вас, остаются до 18:00 — потом вернутся в общий пул.",
  `Включить снова — «${STREAM_ON}» внизу чата или /leads.`,
].join("\n");

/** Ответ человеку с нужной кнопкой внизу чата. */
export async function answerStream(chat: number, on: boolean, now: Date = new Date()): Promise<void> {
  await sendKeyboard(chat, on ? streamOnText(now) : STREAM_OFF_TEXT, [[on ? STREAM_OFF : STREAM_ON]]);
}

type Person = { id: string; chat: number };

async function person(staffId: string): Promise<(Person & { staff: Staff }) | null> {
  const staff = await staffById(staffId);
  if (!staff || !inQueue(staff.role)) return null;
  const chat = Number(staff.telegram_user_id);
  if (!Number.isFinite(chat) || chat === 0) return null;
  return { id: staff.id, chat, staff };
}

/**
 * Долить поток человеку до STREAM_BUFFER и выдать готовые карточки.
 *
 * Возвращает, сколько карточек ушло. Замок в lead_streams.feeding_at не
 * даёт кнопке и свипу налить одновременно — иначе у человека оказалось бы
 * шесть неразобранных вместо трёх.
 */
export async function feedStream(staffId: string, now: Date = new Date()): Promise<number> {
  if (!streamHours(now)) return 0;
  const db = serviceClient();
  if (!db) return 0;
  const day = todayInTashkent(now);
  // Порции сегодня не раздавали или вечер уже подведён — строки потока
  // некому было бы вернуть в пул.
  const mark = await dayRow(day);
  if (!mark?.assigned_at || mark.reported_at) return 0;

  const stale = new Date(now.getTime() - LOCK_STALE_MS).toISOString();
  const { data: locked } = await db
    .from("lead_streams")
    .update({ feeding_at: now.toISOString() })
    .eq("staff_id", staffId)
    .or(`feeding_at.is.null,feeding_at.lt."${stale}"`)
    .select("empty_told_at");
  if (!locked?.length) return 0;

  try {
    const who = await person(staffId);
    if (!who) {
      // Отключили, сменили роль, отвязали Telegram — поток больше некуда лить.
      await db.from("lead_streams").delete().eq("staff_id", staffId);
      return 0;
    }

    const everyone = await rowsOfDay(day);
    const mine = everyone.filter((r) => r.staff_id === staffId && !r.closed);
    // Сначала — утренняя порция: пока она не пришла, поток ждёт, чтобы
    // карточки потока не легли в личку раньше порции.
    if (mine.some((r) => r.source === "portion" && !r.replaces && !r.delivered_at)) return 0;

    let rows = mine.filter((r) => r.source === "stream");
    let byId = new Map((await prospectsByIds(rows.map((r) => r.prospect_id))).map((p) => [p.id, p]));
    const waiting = rows.filter((r) => {
      const p = byId.get(r.prospect_id);
      return p ? streamWaiting(p, staffId, day) : false;
    });

    const need = streamNeed(waiting.length);
    if (need > 0) {
      const added = await addFromPool(staffId, day, need, new Set(everyone.map((r) => r.prospect_id)));
      if (added.length) {
        rows = [...rows, ...added];
        byId = new Map((await prospectsByIds(rows.map((r) => r.prospect_id))).map((p) => [p.id, p]));
      } else if (!waiting.length) {
        await tellEmpty(staffId, who.chat, day, (locked[0].empty_told_at as string | null) ?? null);
      }
    }

    return await deliver(who, rows, byId, day);
  } finally {
    await db.from("lead_streams").update({ feeding_at: null }).eq("staff_id", staffId);
  }
}

/** Взять из пула `need` компаний строками потока. Занятые параллельно — пропускаются. */
async function addFromPool(staffId: string, day: string, need: number, exclude: Set<string>): Promise<DayRow[]> {
  const db = serviceClient();
  if (!db) return [];
  const candidates = await pool(need + 3, exclude);
  const added: DayRow[] = [];
  for (const prospectId of candidates) {
    if (added.length >= need) break;
    const { data, error } = await db
      .from("touch_portions")
      .insert({ day, staff_id: staffId, prospect_id: prospectId, source: "stream" })
      .select("id, created_at")
      .maybeSingle();
    if (data) {
      added.push({
        id: data.id as string,
        staff_id: staffId,
        prospect_id: prospectId,
        source: "stream",
        replaces: null,
        delivered_at: null,
        created_at: data.created_at as string,
        closed: false,
      });
    } else if (error && !error.message.includes("touch_portions_day_prospect_id_key")) {
      console.error("поток: не выдал компанию", error.message);
      break;
    }
    // Иначе компанию только что выдали кому-то ещё — берём следующую.
  }
  return added;
}

/**
 * Карточки — по одной: готовые сразу, остальные — как только модель
 * напишет письмо (до минуты на компанию). Человек видит первую, пока
 * пишутся следующие.
 */
async function deliver(
  who: Person & { staff: Staff },
  rows: DayRow[],
  byId: Map<string, Prospect>,
  day: string,
): Promise<number> {
  const db = serviceClient();
  if (!db) return 0;
  const pending = rows
    .filter((r) => !r.delivered_at)
    .sort((a, b) => Number(ready(byId.get(b.prospect_id))) - Number(ready(byId.get(a.prospect_id))));

  let sent = 0;
  for (const row of pending) {
    let p = byId.get(row.prospect_id);
    if (!p) continue;
    if (!streamWaiting(p, who.id, day)) {
      // Компанию уже тронули — из панели или её забрал другой. Карточка не нужна.
      await claimDelivery([row.id], new Date());
      continue;
    }
    if (!ready(p)) {
      const { data: claimed } = await db
        .from("touch_portions")
        .update({ preparing_at: new Date().toISOString() })
        .eq("id", row.id)
        .is("preparing_at", null)
        .select("id");
      if (claimed?.length) {
        const result = await prepareOutreach(p.id, who.staff);
        if (!result.ok) {
          console.error("поток: не подготовил письмо", p.id, result.why || result.reason);
          // Модель отказала — свип допишет письмо, когда она вернётся.
          await releaseOnModelTrouble(row.id, result.why);
        }
        p = (await prospectById(p.id)) ?? p;
      } else if (Date.now() - Date.parse(row.created_at) < PREPARE_WAIT_MS) {
        // Письмо пишет свип — подождём его, заберём следующим проходом.
        continue;
      }
    }
    if (!(await claimDelivery([row.id], new Date())).size) continue;
    await sendWithRows(who.chat, itemText(p, "▶️ Поток"), [...itemButtons(p), STREAM_STOP_ROW]);
    // Ушла без текста — текст дошлёт свип (portion-store → deliverTexts).
    if (!p.message) await markBare([row.id], new Date());
    sent += 1;
  }
  return sent;
}

/** «В пуле пусто» — раз в день, а не каждые пять минут. */
async function tellEmpty(staffId: string, chat: number, day: string, toldAt: string | null): Promise<void> {
  if (toldAt && todayInTashkent(new Date(toldAt)) === day) return;
  const db = serviceClient();
  if (!db) return;
  await db.from("lead_streams").update({ empty_told_at: new Date().toISOString() }).eq("staff_id", staffId);
  await sendMessage(
    chat,
    "В общем пуле сейчас нет компаний с контактами — поток ждёт. Как только появятся новые (автопоиск по картам проверяет найденное каждые несколько минут), пришлю сам.",
  );
}

/** Долить всем, у кого поток включён, — из свипа, после ответа таймеру. */
export async function feedStreams(now: Date = new Date()): Promise<number> {
  if (!streamHours(now)) return 0;
  const db = serviceClient();
  if (!db) return 0;
  const { data } = await db.from("lead_streams").select("staff_id").order("started_at", { ascending: true });
  let sent = 0;
  for (const row of data ?? []) {
    sent += await feedStream(row.staff_id as string, new Date()).catch((error) => {
      console.error("поток:", error);
      return 0;
    });
  }
  return sent;
}

/**
 * Действие в панели по компании из потока — долить следующую сразу, не
 * дожидаясь свипа. Не из потока или поток выключен — ничего.
 */
export async function nudgeStream(prospectId: string, now: Date = new Date()): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  const { data } = await db
    .from("touch_portions")
    .select("staff_id")
    .eq("day", todayInTashkent(now))
    .eq("prospect_id", prospectId)
    .eq("source", "stream")
    .maybeSingle();
  if (data?.staff_id) await feedStream(data.staff_id as string, now);
}
