import { record } from "@/lib/admin/audit";
import {
  AUTOPILOT_NICHES,
  DAILY_TARGET,
  inNiche,
  nextNiche,
  nicheByKey,
  prepareWindow,
  REPORT_SPAN_MS,
  reportDue,
  reportText,
  toPrepare,
  weekOf,
  type AutopilotNiche,
  type DayStats,
} from "@/lib/admin/autopilot";
import { canContact, routeFor } from "@/lib/admin/outreach";
import { AUTOPILOT, prepareOutreach, queueOutreach, type Prospect } from "@/lib/admin/outreach-store";
import { tashkentMidnight, todayInTashkent } from "@/lib/admin/pulse";
import type { Staff } from "@/lib/admin/session";
import { MAIN_ACCOUNT, accountOf } from "@/lib/admin/work-accounts";
import { esc, sendMessage } from "@/lib/qualify/telegram";
import { serviceClient } from "@/lib/supabase";

/**
 * Автопрогон касаний — база, свип и отчёт. Правила — в lib/admin/autopilot.
 */

type Db = NonNullable<ReturnType<typeof serviceClient>>;

export type AutopilotSettings = { enabled: boolean; target: number };

export async function autopilotSettings(): Promise<AutopilotSettings> {
  const db = serviceClient();
  if (!db) return { enabled: false, target: DAILY_TARGET };
  const { data } = await db.from("autopilot_settings").select("enabled, daily_target").eq("id", true).maybeSingle();
  // Строки нет (миграция ещё не дошла) — автопрогон молчит: включённым его
  // делает строка, которую кладёт миграция, а не отсутствие строки.
  if (!data) return { enabled: false, target: DAILY_TARGET };
  return { enabled: Boolean(data.enabled), target: Number(data.daily_target ?? DAILY_TARGET) };
}

/** Включить или выключить. Только владелец — проверка в действии панели. */
export async function setAutopilot(enabled: boolean, staff: Staff, ip: string): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const { error } = await db
    .from("autopilot_settings")
    .upsert({ id: true, enabled, updated_at: new Date().toISOString(), updated_by: staff.id }, { onConflict: "id" });
  if (error) return false;
  await record(enabled ? "autopilot.on" : "autopilot.off", { actorStaffId: staff.id, ip });
  return true;
}

export type WeekNiche = { week: string; niche: AutopilotNiche; next: AutopilotNiche };

/**
 * Ниша этой недели. Первый проход новой недели заводит её строку —
 * следующую нишу по кругу — и включает кампании автопоиска этой ниши и
 * следующей: пул следующей недели набирается, пока идёт эта.
 */
export async function weekNiche(now: Date = new Date()): Promise<WeekNiche | null> {
  const db = serviceClient();
  if (!db) return null;
  const week = weekOf(now);

  const { data: rows } = await db.from("autopilot_weeks").select("week, niche").order("week", { ascending: false }).limit(2);
  const current = (rows ?? []).find((r) => r.week === week);
  if (current) {
    const niche = nicheByKey(current.niche as string) ?? AUTOPILOT_NICHES[0];
    return { week, niche, next: nextNiche(niche.key) };
  }

  const previous = (rows ?? []).find((r) => String(r.week) < week);
  const niche = nextNiche((previous?.niche as string | undefined) ?? null);
  const { data: inserted, error } = await db
    .from("autopilot_weeks")
    .upsert({ week, niche: niche.key }, { onConflict: "week", ignoreDuplicates: true })
    .select("niche");
  if (error) {
    console.error("автопрогон: не записал нишу недели", error.message);
    return null;
  }
  // Строку завёл соседний проход свипа — берём его выбор.
  if (!inserted?.length) {
    const { data: theirs } = await db.from("autopilot_weeks").select("niche").eq("week", week).maybeSingle();
    const chosen = nicheByKey(theirs?.niche as string | undefined) ?? niche;
    return { week, niche: chosen, next: nextNiche(chosen.key) };
  }

  const next = nextNiche(niche.key);
  await ensureCampaign(db, niche);
  await ensureCampaign(db, next);
  return { week, niche, next };
}

/** Ниша недели для панели — без записи: строку недели заводит свип. */
export async function peekWeek(now: Date = new Date()): Promise<WeekNiche | null> {
  const db = serviceClient();
  if (!db) return null;
  const week = weekOf(now);
  const { data: rows } = await db.from("autopilot_weeks").select("week, niche").order("week", { ascending: false }).limit(2);
  const current = (rows ?? []).find((r) => r.week === week);
  const niche = current
    ? (nicheByKey(current.niche as string) ?? AUTOPILOT_NICHES[0])
    : nextNiche(((rows ?? []).find((r) => String(r.week) < week)?.niche as string | undefined) ?? null);
  return { week, niche, next: nextNiche(niche.key) };
}

/** Кампания автопоиска ниши — заведена и включена. Исчерпанную не трогаем. */
async function ensureCampaign(db: Db, niche: AutopilotNiche): Promise<void> {
  const { data } = await db.from("maps_campaigns").select("id, niche, city, active");
  const same = (data ?? []).find(
    (c) => String(c.niche).toLowerCase() === niche.maps.toLowerCase() && /ташкент/i.test(String(c.city)),
  );
  if (same) {
    if (!same.active) await db.from("maps_campaigns").update({ active: true }).eq("id", same.id);
    return;
  }
  const { error } = await db.from("maps_campaigns").insert({ niche: niche.maps, city: "Ташкент" });
  if (error) console.error("автопрогон: не завёл кампанию", niche.maps, error.message);
}

const POOL_COLUMNS = "id, host, findings, contacts, score, niche";

type PoolRow = Pick<Prospect, "id" | "host" | "findings" | "contacts" | "score" | "niche">;

/**
 * Кому писать: свободные карточки ниши недели, до которых дотянется
 * Telegram, — по @адресу или по мобильному номеру. Городской номер — только
 * звонок, а автопрогон пишет.
 *
 * Сначала — те, у кого на сайте есть @адрес Telegram: письмо точно дойдёт.
 * Потом — с сайтом, по номеру. Потом — без сайта. Внутри — худший сайт
 * первым, как в порции дня.
 *
 * В нише кончились годные — добираем из общего пула: норма в двадцать
 * писем — день, а не «пока в нише есть».
 */
export async function candidates(niche: AutopilotNiche, limit: number, now: Date = new Date()): Promise<string[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data: portion } = await db.from("touch_portions").select("prospect_id").eq("day", todayInTashkent(now));
  const busy = new Set((portion ?? []).map((r) => String(r.prospect_id)));

  const free = () =>
    db
      .from("prospects")
      .select(POOL_COLUMNS)
      .eq("status", "new")
      .is("claimed_by", null)
      .is("autopilot_at", null)
      .order("score", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true });

  const { data: own } = await free()
    .or(niche.match.map((m) => `niche.ilike."${m.replace(/"/g, "")}"`).join(","))
    .limit(300);
  const picked = rank(((own ?? []) as PoolRow[]).filter((r) => inNiche(niche, r.niche)), busy);
  if (picked.length >= limit) return picked.slice(0, limit);

  const { data: rest } = await free().not("host", "is", null).limit(300);
  const more = rank((rest ?? []) as PoolRow[], busy).filter((id) => !picked.includes(id));
  return [...picked, ...more].slice(0, limit);
}

/** Годные — по порядку: @адрес, сайт, без сайта; внутри — как пришли (худший сайт первым). */
export function rank(rows: readonly PoolRow[], busy: ReadonlySet<string> = new Set()): string[] {
  const weight = (row: PoolRow): number | null => {
    if (busy.has(row.id)) return null;
    const route = row.contacts ? routeFor(row.contacts) : null;
    if (!route || route.kind === "manual") return null;
    if (row.host && canContact({ contacts: row.contacts, findings: row.findings ?? [], status: "new" }) !== "ok") return null;
    return route.kind === "handle" ? 0 : row.host ? 1 : 2;
  };
  return rows
    .map((row, at) => ({ row, at, w: weight(row) }))
    .filter((x): x is { row: PoolRow; at: number; w: number } => x.w !== null)
    .sort((a, b) => a.w - b.w || a.at - b.at)
    .map((x) => x.row.id);
}

/** Подготовка письма — до пары минут; карточка, взятая раньше и не дошедшая до очереди, брошена. */
const PREPARE_STALE_MS = 30 * 60_000;

/**
 * Сколько автопрогона сегодня: ушло, ждёт отправки (и готовится прямо
 * сейчас — соседним проходом свипа), взято в работу.
 */
async function today(db: Db, now: Date): Promise<{ sent: number; inFlight: number; attempts: number }> {
  const start = tashkentMidnight(todayInTashkent(now)).toISOString();
  const [sent, queued, preparing, attempts] = await Promise.all([
    db
      .from("prospects")
      .select("id", { count: "exact", head: true })
      .not("autopilot_at", "is", null)
      .eq("status", "sent")
      .gte("sent_at", start),
    db.from("prospects").select("id", { count: "exact", head: true }).not("autopilot_at", "is", null).eq("status", "sending"),
    // Проход свипа идёт до нескольких минут: соседний, начавшись раньше,
    // ещё пишет свои письма — их тоже считаем, иначе оба подготовят лишнее.
    db
      .from("prospects")
      .select("id", { count: "exact", head: true })
      .gte("autopilot_at", new Date(now.getTime() - PREPARE_STALE_MS).toISOString())
      .in("status", ["new", "contacting"])
      .is("claimed_by", null)
      .is("autopilot_note", null),
    db.from("prospects").select("id", { count: "exact", head: true }).gte("autopilot_at", start),
  ]);
  return {
    sent: sent.count ?? 0,
    inFlight: (queued.count ?? 0) + (preparing.count ?? 0),
    attempts: attempts.count ?? 0,
  };
}

/**
 * Карточки, которые автопрогон взял и бросил: процесс упал посреди
 * подготовки. Без этого они навсегда выпали бы и из автопрогона, и из
 * порции дня — отметка есть, а письма нет.
 */
async function releaseStale(db: Db, now: Date): Promise<void> {
  await db
    .from("prospects")
    .update({ autopilot_at: null, status: "new", message: null })
    .lt("autopilot_at", new Date(now.getTime() - PREPARE_STALE_MS).toISOString())
    .in("status", ["new", "contacting"])
    .is("claimed_by", null)
    .is("autopilot_note", null);
}

/** Отказы модели и базы — не про карточку: её не помечаем, и проход останавливается. */
const PASSING = new Set(["db", "no_key", "model_empty", "defect"]);
const passing = (code: string) => PASSING.has(code) || code.startsWith("model_");

export type AutopilotRun = {
  skipped?: "off" | "hours" | "offline" | "no_key" | "full";
  niche?: string;
  queued: number;
  dropped: string[];
  errors: string[];
};

/**
 * Проход свипа: подготовить и поставить в очередь недостающие до нормы
 * письма — не больше двух за раз (lib/admin/autopilot → toPrepare).
 */
export async function runAutopilot(now: Date = new Date()): Promise<AutopilotRun> {
  const run: AutopilotRun = { queued: 0, dropped: [], errors: [] };
  const db = serviceClient();
  if (!db) return { ...run, skipped: "offline" };

  const settings = await autopilotSettings();
  if (!settings.enabled) return { ...run, skipped: "off" };
  // Ниша заводится и вне часов отправки: в понедельник в 00:05 панель уже
  // показывает новую неделю, а кампании автопоиска успевают к 06:00.
  const week = await weekNiche(now);
  if (!week) return { ...run, skipped: "offline" };
  run.niche = week.niche.key;
  if (!prepareWindow(now)) return { ...run, skipped: "hours" };
  if (!process.env.ANTHROPIC_API_KEY) return { ...run, skipped: "no_key" };

  await releaseStale(db, now);
  let need = toPrepare({ ...(await today(db, now)), target: settings.target });
  if (!need) return { ...run, skipped: "full" };

  for (const id of await candidates(week.niche, need * 3, now)) {
    if (need <= 0) break;
    // Взять условно: соседний проход свипа или менеджер, нажавший
    // «Связаться» в эту секунду, ту же карточку не получат.
    const { data: claimed } = await db
      .from("prospects")
      .update({ autopilot_at: new Date().toISOString(), autopilot_note: null })
      .eq("id", id)
      .eq("status", "new")
      .is("claimed_by", null)
      .is("autopilot_at", null)
      .select("id");
    if (!claimed?.length) continue;
    need -= 1;

    const prepared = await prepareOutreach(id, AUTOPILOT).catch((error: unknown) => ({
      ok: false as const,
      why: error instanceof Error ? error.message : String(error),
      code: "defect" as const,
    }));
    if (!prepared.ok) {
      if (prepared.code === "gone") {
        // Карточку, пока писали, взял менеджер — она его, и в цифры
        // автопрогона она не идёт.
        await forget(db, id);
        continue;
      }
      if (passing(prepared.code)) {
        // Не про карточку — модель или база. Карточку отпускаем как была и
        // ждём следующего прохода: иначе один сбой модели пометил бы
        // негодными все карточки, которые автопрогон успел бы взять за день.
        await release(db, id, null);
        run.errors.push(`${prepared.code}: ${prepared.why}`.slice(0, 300));
        break;
      }
      await release(db, id, prepared.why || prepared.code);
      run.dropped.push(`${id}: ${prepared.code}`);
      continue;
    }

    const queued = await queueOutreach(id, prepared.message, AUTOPILOT, "autopilot");
    if (!queued.ok && queued.code === "queue_failed") {
      // Не поставилось: карточку взял менеджер или база отказала. Первое —
      // карточка его; второе — попробуем другую в следующий проход.
      const { data: row } = await db.from("prospects").select("claimed_by").eq("id", id).maybeSingle();
      if (row?.claimed_by) await forget(db, id);
      else await release(db, id, null);
      continue;
    }
    if (!queued.ok) {
      await release(db, id, `письмо не прошло проверку перед отправкой: ${queued.why}`.slice(0, 500));
      run.dropped.push(`${id}: ${queued.code}`);
      continue;
    }
    run.queued += 1;
  }
  return run;
}

/**
 * Вернуть карточку в общий пул.
 *
 * С пометкой — автопрогон к ней больше не вернётся (в пул порции и потока
 * она возвращается: человек может написать сам, по-другому или позвонить).
 * Без пометки — сбой был не про неё, и её можно взять снова.
 */
async function release(db: Db, id: string, note: string | null): Promise<void> {
  await db
    .from("prospects")
    .update({
      status: "new",
      claimed_by: null,
      // Письмо подписано «DevUz Studio» и человеку не подходит: «Связаться»
      // напишет своё, от его имени.
      message: null,
      autopilot_note: note ? note.slice(0, 500) : null,
      ...(note ? {} : { autopilot_at: null }),
    })
    .eq("id", id)
    .in("status", ["new", "contacting"])
    .is("claimed_by", null);
}

/** Карточка ушла человеку посреди подготовки: снять с неё отметку автопрогона. */
async function forget(db: Db, id: string): Promise<void> {
  await db.from("prospects").update({ autopilot_at: null, autopilot_note: null }).eq("id", id).not("claimed_by", "is", null);
}

/* ── Цифры: панель и отчёт ─────────────────────────────────────────────── */

type StatRow = {
  host: string | null;
  label: string | null;
  status: string;
  sent_at: string | null;
  sent_via: string | null;
  autopilot_at: string | null;
  autopilot_note: string | null;
  autopilot_replied_at: string | null;
  lead_id: string | null;
};

/** Подписи дополнительных аккаунтов — как названы в «Аккаунтах». Главный подписывает тот, кто показывает. */
async function accountNames(db: Db): Promise<Map<string, string>> {
  const { data } = await db.from("tg_accounts").select("id, label, tg_name");
  const out = new Map<string, string>();
  for (const row of data ?? []) out.set(String(row.id), String(row.tg_name || row.label || row.id));
  return out;
}

/**
 * Цифры автопрогона: панель — с полуночи («сегодня»), отчёт в 18:00 — за
 * сутки до него (REPORT_SPAN_MS), чтобы вечерние и ночные ответы не
 * выпадали ни из одного отчёта.
 */
export async function dayStats(now: Date = new Date(), since?: Date): Promise<DayStats | null> {
  const db = serviceClient();
  if (!db) return null;
  const day = todayInTashkent(now);
  const start = (since ?? tashkentMidnight(day)).getTime();
  const week = weekOf(now);
  const weekStart = tashkentMidnight(week).getTime();
  const from = new Date(Math.min(start, weekStart)).toISOString();

  const [settings, niche, names, { data }] = await Promise.all([
    autopilotSettings(),
    db.from("autopilot_weeks").select("niche").eq("week", week).maybeSingle(),
    accountNames(db),
    db
      .from("prospects")
      .select("host, label, status, sent_at, sent_via, autopilot_at, autopilot_note, autopilot_replied_at, lead_id")
      .not("autopilot_at", "is", null)
      .or(`autopilot_at.gte."${from}",sent_at.gte."${from}",autopilot_replied_at.gte."${from}",status.eq.sending`)
      .limit(2000),
  ]);
  const rows = (data ?? []) as StatRow[];
  const at = (v: string | null) => (v ? Date.parse(v) : Number.NaN);
  const inSpan = (v: string | null) => at(v) >= start;
  const inWeek = (v: string | null) => at(v) >= weekStart;

  const sent = rows.filter((r) => r.status === "sent" && inSpan(r.sent_at));
  const byAccount = new Map<string, number>();
  for (const r of sent) {
    const key = accountOf(r.sent_via);
    byAccount.set(key, (byAccount.get(key) ?? 0) + 1);
  }
  const replied = rows
    .filter((r) => inSpan(r.autopilot_replied_at))
    .sort((a, b) => at(a.autopilot_replied_at) - at(b.autopilot_replied_at));

  // Кто взял лид — по нику, как в карточке лида («ведёт»).
  const leadIds = replied.map((r) => r.lead_id).filter((id): id is string => Boolean(id));
  const { data: leads } = leadIds.length
    ? await db.from("leads").select("id, assigned_staff_id, assigned_to").in("id", leadIds)
    : { data: [] };
  const takenBy = new Map<string, string>();
  for (const l of leads ?? []) {
    if (l.assigned_staff_id) takenBy.set(String(l.id), String(l.assigned_to || "сотрудник"));
  }

  return {
    day,
    niche: nicheByKey(niche.data?.niche as string | undefined)?.label ?? null,
    target: settings.target,
    enabled: settings.enabled,
    sent: sent.length,
    byAccount: [...byAccount.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([key, n]) => ({ name: key === MAIN_ACCOUNT ? null : (names.get(key) ?? key), n })),
    inFlight: rows.filter((r) => r.status === "sending").length,
    attempts: rows.filter((r) => inSpan(r.autopilot_at)).length,
    manual: rows.filter((r) => r.status === "manual" && inSpan(r.autopilot_at)).length,
    dropped: rows.filter((r) => r.autopilot_note && inSpan(r.autopilot_at)).length,
    replies: replied.length,
    taken: replied.filter((r) => r.lead_id && takenBy.has(r.lead_id)).length,
    refused: replied.filter((r) => !r.lead_id).length,
    weekSent: rows.filter((r) => r.status === "sent" && inWeek(r.sent_at)).length,
    weekReplies: rows.filter((r) => inWeek(r.autopilot_replied_at)).length,
    replied: replied.map((r) => ({
      who: r.host ?? r.label ?? "компания без сайта",
      takenBy: r.lead_id ? (takenBy.get(r.lead_id) ?? null) : null,
      refused: !r.lead_id,
    })),
  };
}

const REPORT_JOB = "autopilot-report";

/**
 * Отчёт в конце рабочего дня — в 18:00, владельцу и руководителю, один раз
 * (daily_claims): сколько написали, сколько ответили и кто взял. Автопрогон
 * выключен и за сутки ничего не было — молчим.
 */
export async function sendAutopilotReport(now: Date = new Date()): Promise<number> {
  if (!reportDue(now)) return 0;
  const db = serviceClient();
  if (!db) return 0;
  // Уже ушёл — не считаем цифры заново каждые пять минут до полуночи.
  const day = todayInTashkent(now);
  const { data: done } = await db.from("daily_claims").select("job").eq("job", REPORT_JOB).eq("day", day).maybeSingle();
  if (done) return 0;

  const stats = await dayStats(now, new Date(now.getTime() - REPORT_SPAN_MS));
  if (!stats || (!stats.enabled && !stats.attempts && !stats.replies)) return 0;

  // Отметка — условно: два прохода свипа не пришлют отчёт дважды.
  const { data: claimed } = await db
    .from("daily_claims")
    .upsert({ job: REPORT_JOB, day }, { onConflict: "job,day", ignoreDuplicates: true })
    .select("job");
  if (!claimed?.length) return 0;

  const { data: people } = await db
    .from("staff")
    .select("telegram_user_id")
    .eq("is_active", true)
    .in("role", ["admin", "head"]);
  const text = reportText(stats, esc);
  let sent = 0;
  for (const p of people ?? []) {
    const chat = Number(p.telegram_user_id);
    if (Number.isFinite(chat) && chat !== 0 && (await sendMessage(chat, text))) sent += 1;
  }
  return sent;
}
