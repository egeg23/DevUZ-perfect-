import { QUEUE_ROLES } from "@/lib/admin/lead-queue";
import { canContact, routeFor, whatsappLink } from "@/lib/admin/outreach";
import { prepareOutreach, prospectsByIds, type Prospect } from "@/lib/admin/outreach-store";
import {
  ASSIGN_HOUR,
  DELIVER_HOUR,
  DELIVER_LATEST_HOUR,
  REPORT_HOUR,
  distribute,
  isWorkday,
  outcomeOf,
  quotaOf,
  reportLine,
  tashkentHour,
  type PersonReport,
} from "@/lib/admin/portion";
import { todayInTashkent } from "@/lib/admin/pulse";
import { staffById } from "@/lib/admin/session";
import { touchProgressFor } from "@/lib/admin/touch-store";
import { esc, sendMessage, sendWithRows, type Button } from "@/lib/qualify/telegram";
import { serviceClient } from "@/lib/supabase";

/**
 * Порция дня — база, Telegram и расписание. Правила — в lib/admin/portion.
 *
 * Весь день — из свипа, раз в пять минут, и каждый шаг сам решает, пора ли:
 *   07:00  раздача — каждому поровну из пула касаний;
 *   фоном  тексты — по одному за проход, после ответа свипу (`after`);
 *   09:00  в личку — порция с готовыми текстами и кнопками (к 10:00 — как есть);
 *   18:00  отчёт — руководителю по его людям, владельцу по всем;
 *          несделанное — обратно в пул, письмо стирается: оно подписано
 *          именем того, кому было выдано.
 */

type Person = { id: string; name: string; chat: number | null; head: string | null; role: string };

async function team(): Promise<Person[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data } = await db
    .from("staff")
    .select("id, display_name, telegram_user_id, head_staff_id, role")
    .eq("is_active", true)
    .in("role", [...QUEUE_ROLES]);
  return (data ?? []).map((r) => ({
    id: r.id as string,
    name: r.display_name as string,
    chat: Number(r.telegram_user_id) || null,
    head: (r.head_staff_id as string | null) ?? null,
    role: r.role as string,
  }));
}

async function dayRow(day: string): Promise<{ assigned_at: string | null; reported_at: string | null } | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db.from("touch_portion_days").select("assigned_at, reported_at").eq("day", day).maybeSingle();
  return (data as { assigned_at: string | null; reported_at: string | null } | null) ?? null;
}

/**
 * Пул: новые, ничьи, с кем есть как связаться. Худшие сайты — первыми:
 * чем больше находок, тем честнее повод написать.
 */
async function pool(limit: number): Promise<string[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data } = await db
    .from("prospects")
    .select("id, host, findings, contacts, status")
    .eq("status", "new")
    .is("claimed_by", null)
    .order("score", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true })
    .limit(limit * 3);
  return (data ?? [])
    .filter((row) => {
      const contacts = row.contacts as Prospect["contacts"];
      const findings = (row.findings as Prospect["findings"]) ?? [];
      if (!row.host) return Boolean(contacts && routeFor(contacts));
      return canContact({ contacts, findings, status: "new" }) === "ok";
    })
    .map((row) => row.id as string)
    .slice(0, limit);
}

export type PortionAssign = { people: number; items: number };

/** Раздача. Раз в день, по рабочим дням, с 07:00. */
export async function assignPortions(now: Date = new Date()): Promise<PortionAssign | null> {
  if (!isWorkday(now) || tashkentHour(now) < ASSIGN_HOUR) return null;
  const db = serviceClient();
  if (!db) return null;
  const day = todayInTashkent(now);
  if ((await dayRow(day))?.assigned_at) return null;

  // Отметку ставим первой и условно: два прохода свипа не раздадут дважды.
  const { data: marked } = await db
    .from("touch_portion_days")
    .upsert({ day, assigned_at: now.toISOString() }, { onConflict: "day", ignoreDuplicates: true })
    .select("day");
  if (!marked?.length) {
    const { data: again } = await db
      .from("touch_portion_days")
      .update({ assigned_at: now.toISOString() })
      .eq("day", day)
      .is("assigned_at", null)
      .select("day");
    if (!again?.length) return null;
  }

  const people = (await team()).filter((p) => p.chat);
  const plans = await touchProgressFor(people.map((p) => p.id), now);
  const quotas = people
    .map((p) => ({ id: p.id, quota: quotaOf(plans.get(p.id)?.plan ?? null) }))
    .filter((p) => p.quota > 0);
  const total = quotas.reduce((sum, p) => sum + p.quota, 0);
  if (!total) return { people: 0, items: 0 };

  const split = distribute(quotas, await pool(total));
  const rows = [...split.entries()].flatMap(([staffId, ids]) =>
    ids.map((prospectId) => ({ day, staff_id: staffId, prospect_id: prospectId })),
  );
  if (rows.length) {
    const { error } = await db.from("touch_portions").insert(rows);
    if (error) {
      console.error("порция: не записал раздачу", error.message);
      return { people: 0, items: 0 };
    }
  }
  return { people: [...split.values()].filter((ids) => ids.length).length, items: rows.length };
}

/**
 * Подготовить следующее письмо из сегодняшних порций.
 *
 * Тяжёлое — обход сайта и модель, до минуты, — поэтому зовётся из `after`
 * свипа, по нескольку за проход. Отметка «готовлю» не даёт второму проходу
 * взяться за то же. Второй попытки нет намеренно: письмо, которое не
 * сложилось с первого раза, не сложится и с десятого, а платить за каждую
 * попытку пришлось бы каждые пять минут. Такая позиция уходит без текста —
 * менеджер нажмёт «Связаться» в панели сам.
 */
export async function prepareNextPortion(now: Date = new Date()): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const day = todayInTashkent(now);

  const { data } = await db
    .from("touch_portions")
    .select("id, staff_id, prospect_id")
    .eq("day", day)
    .is("outcome", null)
    .is("preparing_at", null)
    .order("created_at", { ascending: true })
    .limit(20);

  const prospects = await prospectsByIds((data ?? []).map((r) => r.prospect_id as string));
  const waiting = (data ?? []).find((row) => {
    const p = prospects.find((x) => x.id === row.prospect_id);
    return p && !p.message && p.status === "new";
  });
  if (!waiting) {
    // Тем, у кого текст уже есть или карточку тронули, готовить нечего —
    // отмечаем, чтобы не перебирать их каждый проход.
    const done = (data ?? []).map((r) => r.id as string);
    if (done.length) await db.from("touch_portions").update({ preparing_at: now.toISOString() }).in("id", done);
    return false;
  }

  const { data: claimed } = await db
    .from("touch_portions")
    .update({ preparing_at: now.toISOString() })
    .eq("id", waiting.id as string)
    .is("preparing_at", null)
    .select("id");
  if (!claimed?.length) return false;

  const staff = await staffById(waiting.staff_id as string);
  if (!staff) return false;
  const result = await prepareOutreach(waiting.prospect_id as string, staff);
  if (!result.ok) console.error("порция: не подготовил письмо", waiting.prospect_id, result.why || result.reason);
  return result.ok;
}

/** Готов ли текст: письмо написано или его и не будет (карточку уже тронули). */
function ready(p: Prospect | undefined): boolean {
  return !p || Boolean(p.message) || (p.status !== "new" && p.status !== "contacting");
}

function itemText(p: Prospect, n: number, total: number): string {
  const route = routeFor(p.contacts);
  const title = p.label || p.host || "Компания без сайта";
  const lines = [`<b>${n}/${total} · ${esc(title)}</b>${p.host ? ` — ${esc(p.host)}` : " — без сайта"}`];
  if (route) {
    lines.push(
      route.kind === "handle"
        ? `Кому: ${esc(route.target)} в Telegram`
        : route.kind === "phone"
          ? `Кому: ${esc(route.target)} — бот поищет в Telegram, не найдёт — WhatsApp или звонок`
          : `Кому: ${esc(route.target)} — только звонок или WhatsApp`,
    );
  }
  const found = p.findings.slice(0, 2).map((f) => f.title).filter(Boolean);
  if (found.length) lines.push(`Зацепка: <i>${esc(found.join("; "))}</i>`);
  lines.push(
    "",
    p.message
      ? `<code>${esc(p.message)}</code>`
      : "Текст ещё готовится — откройте карточку в панели и нажмите «Связаться».",
  );
  return lines.join("\n");
}

function itemButtons(p: Prospect): Button[][] {
  const route = routeFor(p.contacts);
  const first: Button[] = [];
  if (p.message && route && route.kind !== "manual") {
    first.push({ text: "📤 Отправить через бота", callback_data: `tp:send:${p.id}` });
  }
  if (p.message && route && route.kind !== "handle") {
    first.push({ text: "WhatsApp ↗", url: whatsappLink(route.target, p.message) });
  }
  return [
    ...(first.length ? [first] : []),
    [
      { text: "✋ Написал сам", callback_data: `tp:self:${p.id}` },
      { text: "✖ Не подходит", callback_data: `tp:skip:${p.id}` },
    ],
    [{ text: "Открыть в панели", panel: `/admin/prospect?open=${p.id}#p-${p.id}` }],
  ];
}

/** В личку. С 09:00, когда тексты готовы; в 10:00 — как есть. */
export async function deliverPortions(now: Date = new Date()): Promise<number> {
  const hour = tashkentHour(now);
  if (!isWorkday(now) || hour < DELIVER_HOUR) return 0;
  const db = serviceClient();
  if (!db) return 0;
  const day = todayInTashkent(now);

  const { data } = await db
    .from("touch_portions")
    .select("id, staff_id, prospect_id")
    .eq("day", day)
    .is("delivered_at", null)
    .is("outcome", null);
  if (!data?.length) return 0;

  const prospects = await prospectsByIds(data.map((r) => r.prospect_id as string));
  const byId = new Map(prospects.map((p) => [p.id, p]));
  const people = new Map((await team()).map((p) => [p.id, p]));
  const plans = await touchProgressFor([...people.keys()], now);

  let delivered = 0;
  const byStaff = new Map<string, typeof data>();
  for (const row of data) byStaff.set(row.staff_id as string, [...(byStaff.get(row.staff_id as string) ?? []), row]);

  for (const [staffId, rows] of byStaff) {
    const person = people.get(staffId);
    if (!person?.chat) continue;
    const allReady = rows.every((r) => ready(byId.get(r.prospect_id as string)));
    if (!allReady && hour < DELIVER_LATEST_HOUR) continue;

    const items = rows.map((r) => byId.get(r.prospect_id as string)).filter((p): p is Prospect => Boolean(p));
    const plan = plans.get(staffId);
    await sendMessage(
      person.chat,
      [
        `<b>Порция на сегодня: ${items.length}</b>`,
        plan?.plan ? `План недели: ${plan.done} из ${plan.plan}.` : "",
        "Тексты готовы — нажмите на текст, он скопируется. Или «Отправить через бота».",
        "Что не сделаете до 18:00, вернётся в общий пул.",
      ]
        .filter(Boolean)
        .join("\n"),
    );
    for (const [i, p] of items.entries()) {
      await sendWithRows(person.chat, itemText(p, i + 1, items.length), itemButtons(p));
    }
    await db
      .from("touch_portions")
      .update({ delivered_at: now.toISOString() })
      .in(
        "id",
        rows.map((r) => r.id as string),
      );
    delivered += items.length;
  }
  return delivered;
}

/**
 * Вечер: итоги и возврат несделанного.
 *
 * Итог считается по самим касаниям (lib/admin/portion → outcomeOf), так что
 * сделанное из панели засчитывается наравне с кнопкой в Telegram.
 */
export async function reportPortions(now: Date = new Date()): Promise<number> {
  if (!isWorkday(now) || tashkentHour(now) < REPORT_HOUR) return 0;
  const db = serviceClient();
  if (!db) return 0;
  const day = todayInTashkent(now);
  const mark = await dayRow(day);
  if (!mark?.assigned_at || mark.reported_at) return 0;

  const { data: claimed } = await db
    .from("touch_portion_days")
    .update({ reported_at: now.toISOString() })
    .eq("day", day)
    .is("reported_at", null)
    .select("day");
  if (!claimed?.length) return 0;

  const { data } = await db.from("touch_portions").select("id, staff_id, prospect_id, outcome").eq("day", day);
  if (!data?.length) return 0;

  const prospects = new Map((await prospectsByIds(data.map((r) => r.prospect_id as string))).map((p) => [p.id, p]));
  const people = await team();
  const reports = new Map<string, PersonReport>();

  for (const row of data) {
    const staffId = row.staff_id as string;
    const person = people.find((p) => p.id === staffId);
    if (!person) continue;
    const p = prospects.get(row.prospect_id as string);
    const outcome = p ? outcomeOf(p, staffId, day) : null;
    const r = reports.get(staffId) ?? { name: person.name, total: 0, done: 0, skipped: 0 };
    r.total += 1;
    if (outcome === "sent" || outcome === "self") r.done += 1;
    if (outcome === "skipped") r.skipped += 1;
    reports.set(staffId, r);

    await db
      .from("touch_portions")
      .update({ outcome: outcome ?? "expired", closed_at: now.toISOString() })
      .eq("id", row.id as string);

    // Несделанное — в пул. Письмо стирается: оно подписано именем того,
    // кому было выдано, а завтра компания может достаться другому.
    if (!outcome && p && (p.status === "new" || p.status === "contacting") && (!p.claimed_by || p.claimed_by === staffId)) {
      await db
        .from("prospects")
        .update({ status: "new", claimed_by: null, claimed_at: null, message: null })
        .eq("id", p.id)
        .in("status", ["new", "contacting"]);
    }
  }

  const lines = (ids: string[]) =>
    ids
      .map((id) => reports.get(id))
      .filter((r): r is PersonReport => Boolean(r))
      .map(reportLine);
  const header = `<b>Порция дня · ${day.split("-").reverse().join(".")}</b>`;
  const footer = "Несделанное вернулось в общий пул.";

  // Руководителю — его люди и он сам; владельцу — все.
  for (const head of people.filter((p) => p.role === "head" && p.chat)) {
    const ids = [head.id, ...people.filter((p) => p.head === head.id).map((p) => p.id)];
    const text = lines(ids);
    if (text.length) await sendMessage(head.chat!, [header, "", ...text, "", footer].join("\n"));
  }
  const { data: owners } = await db.from("staff").select("telegram_user_id").eq("role", "admin").eq("is_active", true);
  const all = lines([...reports.keys()]);
  for (const owner of owners ?? []) {
    const chat = Number(owner.telegram_user_id);
    if (chat && all.length) await sendMessage(chat, [header, "", ...all, "", footer].join("\n"));
  }
  return reports.size;
}

/** Порция человека на сегодня — для блока в «Касаниях». */
export async function portionOf(staffId: string, now: Date = new Date()): Promise<Prospect[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data } = await db
    .from("touch_portions")
    .select("prospect_id")
    .eq("day", todayInTashkent(now))
    .eq("staff_id", staffId);
  return prospectsByIds((data ?? []).map((r) => r.prospect_id as string));
}

/** Принадлежит ли компания сегодняшней порции этого человека — для кнопок бота. */
export async function inPortion(staffId: string, prospectId: string, now: Date = new Date()): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const { data } = await db
    .from("touch_portions")
    .select("id")
    .eq("day", todayInTashkent(now))
    .eq("staff_id", staffId)
    .eq("prospect_id", prospectId)
    .maybeSingle();
  return Boolean(data);
}

/**
 * Весь день порции из одного прохода свипа. Тяжёлая подготовка писем сюда
 * не входит — её свип зовёт после ответа, см. preparePortionsInBackground.
 */
export async function runPortions(now: Date = new Date()): Promise<{
  assigned: PortionAssign | null;
  delivered: number;
  reported: number;
}> {
  const assigned = await assignPortions(now);
  const delivered = await deliverPortions(now);
  const reported = await reportPortions(now);
  return { assigned, delivered, reported };
}

/** Несколько писем подряд, пока укладываемся в четыре минуты — до следующего прохода. */
export async function preparePortionsInBackground(started: Date = new Date()): Promise<number> {
  if (!isWorkday(started)) return 0;
  let made = 0;
  for (let i = 0; i < 3; i++) {
    if (Date.now() - started.getTime() > 4 * 60_000) break;
    if (!(await prepareNextPortion(new Date()))) break;
    made += 1;
  }
  return made;
}
