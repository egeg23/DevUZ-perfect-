import {
  askCoach,
  dailyDue,
  dailyPrompt,
  parseReview,
  snapshotOf,
  weeklyDue,
  weeklyPrompt,
  type CompanySnapshot,
  type PersonSnapshot,
  type ReviewBody,
  type ReviewKind,
} from "@/lib/admin/coach";
import { accrualsOf, balanceOf, earnersOf } from "@/lib/admin/finance";
import { loadLedger, sharesOf } from "@/lib/admin/ledger";
import {
  expectedPayments,
  lastMonths,
  monthlyCash,
  periodStart,
  planFact,
  previousPeriodStart,
  pulseOf,
  stuckLeads,
  todayInTashkent,
  windowOf,
} from "@/lib/admin/pulse";
import { loadPlans, loadPulseRows, pendingContracts } from "@/lib/admin/pulse-store";
import { ROLE_TITLE, type Role } from "@/lib/admin/roles";
import { DEFAULT_DEADLINES, upcoming } from "@/lib/admin/tax-calendar";
import { esc, sendMessage } from "@/lib/qualify/telegram";
import { siteUrl } from "@/lib/seo";
import { serviceClient } from "@/lib/supabase";

/**
 * Хранение и запуск рекомендаций.
 *
 * Запускается из свипа каждые пять минут, но делает что-то только когда
 * пора: в понедельник утром — недельные каждому менеджеру и руководителю,
 * каждое утро — дневная владельцу и руководителям. Повторно за тот же
 * период не собирает: одна рекомендация на человека на неделю, одна на
 * день. `force` снимает и время, и это правило — для кнопки владельца
 * «собрать сейчас», когда ждать понедельника незачем.
 */

export type Review = {
  id: string;
  staff_id: string;
  kind: ReviewKind;
  period_start: string;
  body: ReviewBody;
  created_at: string;
};

function shape(row: Record<string, unknown>): Review | null {
  const body = parseReview(row.body);
  if (!body) return null;
  return {
    id: String(row.id),
    staff_id: String(row.staff_id),
    kind: row.kind === "daily" ? "daily" : "weekly",
    period_start: String(row.period_start),
    body,
    created_at: String(row.created_at),
  };
}

/** Последние рекомендации людей одного вида — по одной на человека. */
export async function latestReviews(staffIds: readonly string[], kind: ReviewKind): Promise<Map<string, Review>> {
  const db = serviceClient();
  const out = new Map<string, Review>();
  if (!db || !staffIds.length) return out;
  const { data } = await db
    .from("reviews")
    .select("id, staff_id, kind, period_start, body, created_at")
    .eq("kind", kind)
    .in("staff_id", [...staffIds])
    .order("period_start", { ascending: false })
    .limit(staffIds.length * 3);
  for (const row of data ?? []) {
    const review = shape(row as Record<string, unknown>);
    if (review && !out.has(review.staff_id)) out.set(review.staff_id, review);
  }
  return out;
}

async function saveReview(staffId: string, kind: ReviewKind, periodStart: string, body: ReviewBody, metrics: unknown): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const { error } = await db
    .from("reviews")
    .upsert({ staff_id: staffId, kind, period_start: periodStart, body, metrics }, { onConflict: "staff_id,kind,period_start" });
  if (error) console.error("coach: не сохранил рекомендацию", error.message);
  return !error;
}

export type CoachRun = { weekly: number; daily: number; skipped: number; errors: string[] };

/**
 * Собрать рекомендации, которым пора.
 *
 * Возвращает, сколько собрано и что не вышло: свип пишет это в ответ, и по
 * нему видно, работает ли модель, — молчаливый пропуск был бы неотличим
 * от «ещё не понедельник».
 */
export async function runCoach(now: Date, opts: { force?: boolean; only?: readonly string[] } = {}): Promise<CoachRun> {
  const run: CoachRun = { weekly: 0, daily: 0, skipped: 0, errors: [] };
  const wantWeekly = opts.force || weeklyDue(now);
  const wantDaily = opts.force || dailyDue(now);
  if (!wantWeekly && !wantDaily) return run;

  const db = serviceClient();
  if (!db) return { ...run, errors: ["база недоступна"] };

  const today = todayInTashkent(now);
  const weekStart = periodStart("week", now);
  const monthStart = periodStart("month", now);
  const week = windowOf("week", weekStart);
  const prev = windowOf("week", previousPeriodStart("week", weekStart));
  const month = windowOf("month", monthStart);

  // Сначала — кому вообще нужно. Свип ходит каждые пять минут, и после
  // семи утра «пора» верно весь день; тянуть лиды, платежи и журнал ради
  // того, чтобы обнаружить, что всё уже собрано, — это сотни лишних
  // запросов в сутки.
  const { data: staffRows } = await db.from("staff").select("id, role, display_name, telegram_user_id").eq("is_active", true);
  const active = (staffRows ?? []).filter((r) => !opts.only || opts.only.includes(String(r.id)));
  const weeklyIds = active.filter((r) => r.role !== "admin").map((r) => String(r.id));
  const dailyIds = active.filter((r) => r.role === "admin" || r.role === "head").map((r) => String(r.id));
  const [weeklyHad, dailyHad] = await Promise.all([
    wantWeekly ? latestReviews(weeklyIds, "weekly") : Promise.resolve(new Map<string, Review>()),
    wantDaily ? latestReviews(dailyIds, "daily") : Promise.resolve(new Map<string, Review>()),
  ]);
  const needWeekly = wantWeekly && (opts.force || weeklyIds.some((id) => weeklyHad.get(id)?.period_start !== weekStart));
  const needDaily = wantDaily && (opts.force || dailyIds.some((id) => dailyHad.get(id)?.period_start !== today));
  if (!needWeekly && !needDaily) {
    run.skipped = (wantWeekly ? weeklyIds.length : 0) + (wantDaily ? dailyIds.length : 0);
    return run;
  }

  const [rows, ledger, contracts] = await Promise.all([loadPulseRows(now), loadLedger("all"), pendingContracts()]);
  if (rows.offline || ledger.offline) return { ...run, errors: ["строки пульса не собрались"] };

  const people = ledger.people.filter((p) => p.is_active && (!opts.only || opts.only.includes(p.id)));
  const earners = earnersOf(ledger.people);
  const accruals = ledger.projects.flatMap((p) => accrualsOf(p, ledger.payments, earners, sharesOf(p.id, ledger.shares)));
  const plans = await loadPlans(
    [
      { period: "week", period_start: weekStart },
      { period: "month", period_start: monthStart },
    ],
    people.map((p) => p.id),
  );

  const snapshot = (id: string, role: Role, name: string): PersonSnapshot => {
    const w = pulseOf(id, rows, week, now);
    return {
      staffId: id,
      name,
      role: ROLE_TITLE[role],
      week: snapshotOf(w),
      prev: snapshotOf(pulseOf(id, rows, prev, now)),
      month: snapshotOf(pulseOf(id, rows, month, now)),
      plans: plans
        .filter((p) => p.staff_id === id)
        .map((p) => {
          const pf = planFact(p, p.period === "week" ? w : pulseOf(id, rows, month, now));
          return { period: pf.period, metric: pf.metric, target: pf.target, fact: pf.fact, percent: pf.percent };
        }),
      due: balanceOf(id, accruals, ledger.payouts).due,
    };
  };

  const team = people.filter((p) => p.role !== "admin").map((p) => snapshot(p.id, p.role, p.display_name));
  const staffTelegram = new Map<string, number | null>(
    active.map((r) => [String(r.id), (r.telegram_user_id as number | null) ?? null]),
  );

  const notify = async (staffId: string, text: string) => {
    const chat = staffTelegram.get(staffId);
    if (chat) await sendMessage(chat, text);
  };

  /* ── Недельные: менеджерам и руководителям ─────────────────────────── */
  if (needWeekly) {
    const existing = weeklyHad;
    for (const person of team) {
      const had = existing.get(person.staffId);
      if (had && had.period_start === weekStart && !opts.force) {
        run.skipped += 1;
        continue;
      }
      const previous = had && had.period_start !== weekStart ? had.body : null;
      const result = await askCoach("weekly", weeklyPrompt(person, previous, weekStart));
      if (!result.ok) {
        run.errors.push(`${person.name}: ${result.why}`);
        continue;
      }
      if (await saveReview(person.staffId, "weekly", weekStart, result.review, person)) {
        run.weekly += 1;
        await notify(
          person.staffId,
          `<b>Рекомендации на неделю</b>\n${esc(result.review.headline)}\n\nПолностью — на главной панели: ${siteUrl}/admin`,
        );
      }
    }
  }

  /* ── Дневные: владельцу и руководителям ────────────────────────────── */
  if (needDaily) {
    const readers = people.filter((p) => p.role === "admin" || p.role === "head");
    const existing = dailyHad;
    const cash = monthlyCash(rows.payments, rows.expenses, lastMonths(now, 1))[0];
    const company: CompanySnapshot = {
      month: { revenue: cash?.revenue ?? 0, expenses: cash?.expenses ?? 0 },
      expected: expectedPayments(rows.projects, rows.payments).reduce((s, r) => s + r.remaining, 0),
      pendingContracts: contracts.length,
      stuck: stuckLeads(rows.leads, rows.events, rows.messages, now).length,
      taxesSoon: upcoming(DEFAULT_DEADLINES, today).map((t) => `${t.title} — через ${t.daysLeft} дн.`),
    };
    for (const reader of readers) {
      const had = existing.get(reader.id);
      if (had && had.period_start === today && !opts.force) {
        run.skipped += 1;
        continue;
      }
      const previous = had && had.period_start !== today ? had.body : null;
      const result = await askCoach("daily", dailyPrompt(company, team, previous, today));
      if (!result.ok) {
        run.errors.push(`${reader.display_name}: ${result.why}`);
        continue;
      }
      if (await saveReview(reader.id, "daily", today, result.review, { company, team: team.map((t) => t.staffId) })) {
        run.daily += 1;
        await notify(reader.id, `<b>На сегодня</b>\n${esc(result.review.headline)}\n\nПодробно — на главной панели: ${siteUrl}/admin`);
      }
    }
  }

  return run;
}
