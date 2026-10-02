import { wants } from "@/lib/admin/notify-prefs";
import { QUEUE_ROLES } from "@/lib/admin/lead-queue";
import { canContact, routeFor, whatsappLink } from "@/lib/admin/outreach";
import { prepareOutreach, prospectsByIds, type Prospect } from "@/lib/admin/outreach-store";
import {
  ASSIGN_HOUR,
  DELIVER_HOUR,
  DELIVER_LATEST_HOUR,
  REPORT_HOUR,
  BOT_BUTTON,
  distribute,
  isWorkday,
  outcomeOf,
  quotaOf,
  replacementsDue,
  byTouches,
  reportLine,
  reportTotal,
  tallyPortion,
  tashkentHour,
  textDue,
  touchesText,
  type PersonReport,
} from "@/lib/admin/portion";
import { CLOSE_REASONS, CLOSE_TEXT, closeCallback } from "@/lib/admin/touch-close";
import { todayInTashkent } from "@/lib/admin/pulse";
import { staffById } from "@/lib/admin/session";
import { touchesOnDay, touchProgressFor } from "@/lib/admin/touch-store";
import { esc, sendMessage, sendWithRows, type Button } from "@/lib/qualify/telegram";
import { serviceClient } from "@/lib/supabase";
import { isModelTroubleSays } from "@/lib/model-trouble";

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
 *
 * Весь день — замены: на каждую «Не подходит» человеку сразу выдаётся
 * новая компания из пула, с готовым письмом и карточкой в Telegram (см.
 * topUpPortion). Цель дня — касания, а не нажатия.
 *
 * В той же таблице живёт поток «Получать лиды» (source = 'stream',
 * lib/admin/stream-store): он сверх порции, и всё, что считает порцию, —
 * цель, замены, утренняя выдача, — берёт только строки source = 'portion'.
 * Вечерний возврат в пул и кнопки бота общие для обоих.
 */

type Person = { id: string; name: string; chat: number | null; head: string | null; role: string; off: string[] };

async function team(): Promise<Person[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data } = await db
    .from("staff")
    .select("id, display_name, telegram_user_id, head_staff_id, role, notify_off")
    .eq("is_active", true)
    .in("role", [...QUEUE_ROLES]);
  return (data ?? []).map((r) => ({
    id: r.id as string,
    name: r.display_name as string,
    chat: Number(r.telegram_user_id) || null,
    head: (r.head_staff_id as string | null) ?? null,
    role: r.role as string,
    off: (r.notify_off as string[] | null) ?? [],
  }));
}

export async function dayRow(day: string): Promise<{ assigned_at: string | null; reported_at: string | null } | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db.from("touch_portion_days").select("assigned_at, reported_at").eq("day", day).maybeSingle();
  return (data as { assigned_at: string | null; reported_at: string | null } | null) ?? null;
}

/**
 * Пул: новые, ничьи, с кем есть как связаться. Худшие сайты — первыми:
 * чем больше находок, тем честнее повод написать.
 */
export async function pool(limit: number, exclude: ReadonlySet<string> = new Set()): Promise<string[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data } = await db
    .from("prospects")
    .select("id, host, findings, contacts, status")
    .eq("status", "new")
    .is("claimed_by", null)
    .order("score", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true })
    .limit(limit * 3 + exclude.size);
  return (data ?? [])
    // Уже в чьей-то сегодняшней порции: письмо ещё не готово, и компания
    // числится ничьей, но выдать её второму — значит написать дважды.
    .filter((row) => !exclude.has(row.id as string))
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
 *
 * Кроме отказа самой модели: кончились деньги, не принят ключ, частота,
 * поставщик лежит. 1 октября так ушла без текстов вся утренняя порция.
 * Это не письмо, а состояние, и запрос, отвергнутый на входе, ничего не
 * стоит, — поэтому отметка «готовлю» снимается, и следующий проход
 * пробует снова. Карточка, ушедшая за это время без текста, получит его
 * отдельным сообщением (deliverTexts).
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
  if (!result.ok) {
    console.error("порция: не подготовил письмо", waiting.prospect_id, result.why || result.reason);
    await releaseOnModelTrouble(waiting.id as string, result.why);
    return false;
  }
  await deliverTexts(new Date(), waiting.staff_id as string);
  return true;
}

/**
 * Модель отказала сама — письмо возвращается в очередь подготовки: свип
 * попробует снова следующим проходом. Любой другой промах остаётся
 * промахом — см. prepareNextPortion.
 */
export async function releaseOnModelTrouble(rowId: string, why: string): Promise<void> {
  if (!isModelTroubleSays(why)) return;
  const db = serviceClient();
  if (!db) return;
  await db.from("touch_portions").update({ preparing_at: null }).eq("id", rowId);
}

/** Карточки ушли без текста — текст дошлёт deliverTexts, когда модель его напишет. */
export async function markBare(ids: readonly string[], now: Date): Promise<void> {
  const db = serviceClient();
  if (!db || !ids.length) return;
  await db.from("touch_portions").update({ bare_at: now.toISOString() }).in("id", [...ids]);
}

/**
 * Дослать текст к карточкам, которые ушли без него.
 *
 * Карточка без текста — не ошибка менеджера и не повод идти в панель: он
 * получил компанию, а письмо к ней модель допишет позже (отказала —
 * prepareNextPortion повторит). Как только письмо есть, карточка приходит
 * ещё раз — целиком, с текстом и кнопкой отправки. Тронул компанию раньше
 * (написал сам, «Не подходит», забрал другой) — досылать нечего, отметка
 * просто снимается.
 *
 * Отметка снимается до сообщения и условно: свип и подготовка письма зовут
 * досылку одновременно. Не дошло — отметка возвращается.
 */
export async function deliverTexts(now: Date = new Date(), staffId?: string): Promise<number> {
  if (!isWorkday(now) || tashkentHour(now) >= REPORT_HOUR) return 0;
  const db = serviceClient();
  if (!db) return 0;
  const day = todayInTashkent(now);

  let query = db
    .from("touch_portions")
    .select("id, staff_id, prospect_id, source")
    .eq("day", day)
    .is("outcome", null)
    .not("bare_at", "is", null);
  if (staffId) query = query.eq("staff_id", staffId);
  const { data } = await query;
  if (!data?.length) return 0;

  const byId = new Map((await prospectsByIds(data.map((r) => r.prospect_id as string))).map((p) => [p.id, p]));
  const people = new Map((await team()).map((p) => [p.id, p]));

  let sent = 0;
  for (const row of data) {
    const owner = row.staff_id as string;
    const p = byId.get(row.prospect_id as string);
    const due = p ? textDue(p, owner, day) : "drop";
    if (due === "wait") continue;
    const { data: claimed } = await db
      .from("touch_portions")
      .update({ bare_at: null })
      .eq("id", row.id as string)
      .not("bare_at", "is", null)
      .select("id");
    if (!claimed?.length || due === "drop" || !p) continue;

    const person = people.get(owner);
    if (!person?.chat) continue;
    const stream = row.source === "stream";
    if (!stream && !wants(person.off, "portion")) continue;
    const ok = await sendWithRows(
      person.chat,
      [
        "✍️ <b>Текст готов.</b> Эта компания приходила без него — вот карточка целиком.",
        "",
        itemText(p, stream ? "▶️ Поток" : "Порция"),
      ].join("\n"),
      itemButtons(p),
    );
    if (ok) sent += 1;
    else await markBare([row.id as string], now);
  }
  return sent;
}

/** Готов ли текст: письмо написано или его и не будет (карточку уже тронули). */
export function ready(p: Prospect | undefined): boolean {
  return !p || Boolean(p.message) || (p.status !== "new" && p.status !== "contacting");
}

export const titleOf = (p: Prospect) => p.label || p.host || "Компания без сайта";

/** Карточка компании в Telegram. `heading` — «2/5» в утренней порции или «🔁 Замена». */
export function itemText(p: Prospect, heading: string): string {
  const route = routeFor(p.contacts);
  const lines = [`<b>${heading} · ${esc(titleOf(p))}</b>${p.host ? ` — ${esc(p.host)}` : " — без сайта"}`];
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
      : "Текст ещё готовится — пришлю его сюда отдельным сообщением. Не хотите ждать — откройте карточку в панели и нажмите «Связаться».",
  );
  return lines.join("\n");
}

export function itemButtons(p: Prospect): Button[][] {
  const route = routeFor(p.contacts);
  const first: Button[] = [];
  if (p.message && route && route.kind !== "manual") {
    first.push({ text: `📤 ${BOT_BUTTON.send}`, callback_data: `tp:send:${p.id}` });
  }
  if (p.message && route && route.kind !== "handle") {
    first.push({ text: "WhatsApp ↗", url: whatsappLink(route.target, p.message) });
  }
  return [
    ...(first.length ? [first] : []),
    [
      { text: `✋ ${BOT_BUTTON.self}`, callback_data: `tp:self:${p.id}` },
      { text: `✖ ${BOT_BUTTON.skip}`, callback_data: `tp:skip:${p.id}` },
    ],
    [{ text: "Открыть в панели", panel: `/admin/prospect?open=${p.id}#p-${p.id}` }],
  ];
}

/**
 * Кнопки после касания: надпись о том, что сделано, и «Клиент отказался» /
 * «Игнорирует» — закрыть касание можно прямо из той же карточки, когда
 * станет ясно, чем кончилось (lib/admin/touch-close).
 */
export function closeRows(prospectId: string, label: string): Button[][] {
  return [
    [{ text: label, callback_data: "noop" }],
    CLOSE_REASONS.map((reason) => ({ text: CLOSE_TEXT[reason].button, callback_data: closeCallback(reason, prospectId) })),
  ];
}

export type DayRow = {
  id: string;
  staff_id: string;
  prospect_id: string;
  /** portion — порция дня и её замены, stream — поток «Получать лиды». */
  source: "portion" | "stream";
  replaces: string | null;
  delivered_at: string | null;
  created_at: string;
  /** Строку уже закрыли: вечерний отчёт или отключение сотрудника. */
  closed: boolean;
};

export async function rowsOfDay(day: string, staffId?: string): Promise<DayRow[]> {
  const db = serviceClient();
  if (!db) return [];
  let query = db
    .from("touch_portions")
    .select("id, staff_id, prospect_id, source, replaces, delivered_at, created_at, outcome")
    .eq("day", day);
  if (staffId) query = query.eq("staff_id", staffId);
  const { data } = await query;
  return (data ?? []).map((r) => ({
    id: r.id as string,
    staff_id: r.staff_id as string,
    prospect_id: r.prospect_id as string,
    source: r.source === "stream" ? "stream" : "portion",
    replaces: (r.replaces as string | null) ?? null,
    delivered_at: (r.delivered_at as string | null) ?? null,
    created_at: r.created_at as string,
    closed: r.outcome !== null,
  }));
}

/**
 * Забрать строки под отправку: отметка «выдано» ставится до сообщения и
 * условно. Свип и кнопка «Не подходит» зовут выдачу одновременно — без
 * этого одна карточка пришла бы дважды.
 */
export async function claimDelivery(ids: readonly string[], now: Date): Promise<Set<string>> {
  const db = serviceClient();
  if (!db || !ids.length) return new Set();
  const { data } = await db
    .from("touch_portions")
    .update({ delivered_at: now.toISOString() })
    .in("id", [...ids])
    .is("delivered_at", null)
    .select("id");
  return new Set((data ?? []).map((r) => r.id as string));
}

/** Замена уходит, как только готов текст, но не ждёт его дольше пятнадцати минут. */
const REPLACE_WAIT_MS = 15 * 60_000;

/**
 * В личку. Утренняя порция — с 09:00, когда тексты готовы (в 10:00 — как
 * есть). Замены после неё — по одной, как только готов текст.
 *
 * `staffId` — выдать только одному: так кнопка «Не подходит» присылает
 * замену сразу, не дожидаясь свипа.
 */
export async function deliverPortions(now: Date = new Date(), staffId?: string): Promise<number> {
  const hour = tashkentHour(now);
  if (!isWorkday(now) || hour < DELIVER_HOUR) return 0;
  const db = serviceClient();
  if (!db) return 0;
  const day = todayInTashkent(now);

  // Поток выдаёт свои карточки сам (stream-store) — здесь только порция.
  const all = (await rowsOfDay(day, staffId)).filter((r) => !r.closed && r.source === "portion");
  const pending = all.filter((r) => !r.delivered_at);
  if (!pending.length) return 0;

  const byId = new Map((await prospectsByIds(all.map((r) => r.prospect_id))).map((p) => [p.id, p]));
  const people = new Map((await team()).map((p) => [p.id, p]));
  const plans = await touchProgressFor([...people.keys()], now);

  let delivered = 0;
  for (const owner of new Set(pending.map((r) => r.staff_id))) {
    const person = people.get(owner);
    if (!person?.chat) continue;
    const mine = pending.filter((r) => r.staff_id === owner);
    // Галочка «Порция касаний на день» снята: порция остаётся в «Касаниях»,
    // а в Telegram не идёт. Отмечаем выданной, чтобы не пытаться снова
    // каждые пять минут до вечера.
    if (!wants(person.off, "portion")) {
      await claimDelivery(
        mine.map((r) => r.id),
        now,
      );
      continue;
    }

    const morningSent = all.some((r) => r.staff_id === owner && !r.replaces && r.delivered_at);
    if (!morningSent) {
      // Утро: всё одним пакетом — вместе с заменами, выданными до 09:00.
      const allReady = mine.every((r) => ready(byId.get(r.prospect_id)));
      if (!allReady && hour < DELIVER_LATEST_HOUR) continue;
      const claimed = await claimDelivery(
        mine.map((r) => r.id),
        now,
      );
      // Уже сделанное и «Не подходит», нажатое в панели до 09:00, в пакет не идёт.
      const batch = mine
        .filter((r) => claimed.has(r.id))
        .map((r) => ({ row: r, p: byId.get(r.prospect_id) }))
        .filter((x): x is { row: DayRow; p: Prospect } => Boolean(x.p) && outcomeOf(x.p!, owner, day) === null);
      const items = batch.map((x) => x.p);
      if (!items.length) continue;
      // Без текста в 10:00 уходит то, что модель не написала, — чаще всего
      // потому, что она не отвечала. Текст дойдёт отдельным сообщением.
      const bare = batch.filter((x) => !x.p.message).map((x) => x.row.id);
      const target = all.filter((r) => r.staff_id === owner && !r.replaces).length;
      const plan = plans.get(owner);
      await sendMessage(
        person.chat,
        [
          `<b>Порция на сегодня: ${target}</b>`,
          plan?.plan ? `План недели: ${plan.done} из ${plan.plan}.` : "",
          `Нужно ${touchesText(target)}: «Отправить через бота» или «Написал сам». «Не подходит» в счёт не идёт — на её место сразу придёт замена.`,
          bare.length === items.length
            ? "Тексты ещё пишутся — каждый пришлю отдельным сообщением, как только будет готов. Компании уже ваши: можно начинать и без них."
            : bare.length
              ? "Тексты готовы не ко всем — нажмите на текст, он скопируется. Недостающие пришлю отдельными сообщениями."
              : "Тексты готовы — нажмите на текст, он скопируется.",
          "Что не сделаете до 18:00, вернётся в общий пул.",
        ]
          .filter(Boolean)
          .join("\n"),
      );
      for (const [i, p] of items.entries()) {
        await sendWithRows(person.chat, itemText(p, `${i + 1}/${items.length}`), itemButtons(p));
      }
      await markBare(bare, now);
      delivered += items.length;
      continue;
    }

    // Утро пришло — значит, это замены: по одной, как только готов текст.
    for (const row of mine) {
      const p = byId.get(row.prospect_id);
      const waited = now.getTime() - Date.parse(row.created_at) >= REPLACE_WAIT_MS;
      if (!ready(p) && !waited) continue;
      if (!(await claimDelivery([row.id], now)).size) continue;
      if (!p || outcomeOf(p, owner, day) !== null) continue;
      const instead = all.find((r) => r.id === row.replaces);
      const old = instead ? byId.get(instead.prospect_id) : undefined;
      await sendWithRows(
        person.chat,
        [`🔁 Вместо «${esc(old ? titleOf(old) : "не подошедшей")}» — она в счёт порции.`, "", itemText(p, "Замена")].join("\n"),
        itemButtons(p),
      );
      if (!p.message) await markBare([row.id], now);
      delivered += 1;
    }
  }
  return delivered;
}

export type TopUp = {
  /** Выданные замены: строка порции и компания. */
  made: { rowId: string; prospectId: string }[];
  /** Замены кончились: лимит на день (lib/admin/portion → replaceLimit). */
  limit: boolean;
  /** В пуле не нашлось компании. */
  empty: boolean;
};

/**
 * Выдать замены за «Не подходит» — по одной на каждую пропущенную, у
 * которой замены ещё нет, в пределах лимита.
 *
 * Считает по самим компаниям (outcomeOf), а не по нажатой кнопке: «Не
 * подходит» можно нажать в Telegram, а «не пишем» — в панели, и замена
 * положена за обе. Вызывается сразу после нажатия и ещё раз каждым проходом
 * свипа — на случай, если сразу не вышло (пул был пуст, упал запрос).
 */
export async function topUpPortion(staffId: string, now: Date = new Date()): Promise<TopUp> {
  const none: TopUp = { made: [], limit: false, empty: false };
  // После 18:00 порция закрыта, и выдавать в неё нечего.
  if (!isWorkday(now) || tashkentHour(now) >= REPORT_HOUR) return none;
  const db = serviceClient();
  if (!db) return none;
  const day = todayInTashkent(now);
  const mark = await dayRow(day);
  if (!mark?.assigned_at || mark.reported_at) return none;

  // Из пула не берём ничего, что уже выдано сегодня, — ни в порцию, ни в
  // поток; а считаем замены только по порции: «Не подходит» в потоке
  // замены не даёт, там следующая компания приходит и так.
  const everyone = await rowsOfDay(day);
  const rows = everyone.filter((r) => r.staff_id === staffId && !r.closed && r.source === "portion");
  if (!rows.length) return none;
  const prospects = new Map((await prospectsByIds(rows.map((r) => r.prospect_id))).map((p) => [p.id, p]));
  const outcomes = rows.map((r) => {
    const p = prospects.get(r.prospect_id);
    return { ...r, outcome: p ? outcomeOf(p, staffId, day) : null };
  });
  const tally = tallyPortion(outcomes);
  const due = replacementsDue(tally);
  const limit = due < tally.skipped - tally.replaced;
  if (!due) return { ...none, limit };

  const replacedIds = new Set(rows.map((r) => r.replaces).filter(Boolean));
  const waiting = outcomes.filter((r) => r.outcome === "skipped" && !replacedIds.has(r.id)).slice(0, due);
  const candidates = await pool(due + 3, new Set(everyone.map((r) => r.prospect_id)));

  const made: TopUp["made"] = [];
  for (const skipped of waiting) {
    let placed = false;
    while (!placed && candidates.length) {
      const prospectId = candidates.shift()!;
      const { data, error } = await db
        .from("touch_portions")
        .insert({ day, staff_id: staffId, prospect_id: prospectId, replaces: skipped.id })
        .select("id")
        .maybeSingle();
      if (data) {
        made.push({ rowId: data.id as string, prospectId });
        placed = true;
      } else if (error?.message.includes("touch_portions_replaces_key")) {
        // Эту «Не подходит» уже заменил параллельный вызов — второй не нужен.
        placed = true;
      } else if (error && !error.message.includes("touch_portions_day_prospect_id_key")) {
        console.error("порция: не выдал замену", error.message);
        return { made, limit, empty: false };
      }
      // Иначе компанию только что выдали кому-то ещё — берём следующую.
    }
    if (!placed) return { made, limit, empty: true };
  }
  return { made, limit, empty: false };
}

/** Замены всем, кому положены, — из свипа, раз в пять минут. */
export async function topUpPortions(now: Date = new Date()): Promise<number> {
  if (!isWorkday(now) || tashkentHour(now) >= REPORT_HOUR) return 0;
  const day = todayInTashkent(now);
  const rows = (await rowsOfDay(day)).filter((r) => !r.closed && r.source === "portion");
  const prospects = new Map((await prospectsByIds(rows.map((r) => r.prospect_id))).map((p) => [p.id, p]));
  let made = 0;
  for (const staffId of new Set(rows.map((r) => r.staff_id))) {
    const mine = rows
      .filter((r) => r.staff_id === staffId)
      .map((r) => {
        const p = prospects.get(r.prospect_id);
        return { replaces: r.replaces, outcome: p ? outcomeOf(p, staffId, day) : null };
      });
    if (!replacementsDue(tallyPortion(mine))) continue;
    made += (await topUpPortion(staffId, now)).made.length;
  }
  return made;
}

/**
 * Замена сразу после «Не подходит»: письмо — тут же, карточка — в личку.
 *
 * Тяжёлое — обход сайта и модель, до минуты, — поэтому зовётся после
 * ответа на нажатие. Письмо забирается той же условной отметкой, что и у
 * свипа, а карточка уходит той же выдачей: что сорвётся здесь, подберёт
 * следующий проход свипа.
 */
export async function deliverReplacement(rowId: string, now: Date = new Date()): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  const { data: claimed } = await db
    .from("touch_portions")
    .update({ preparing_at: now.toISOString() })
    .eq("id", rowId)
    .is("preparing_at", null)
    .select("staff_id, prospect_id");
  const row = claimed?.[0];
  if (row) {
    const staff = await staffById(row.staff_id as string);
    if (staff) {
      const result = await prepareOutreach(row.prospect_id as string, staff);
      if (!result.ok) {
        console.error("порция: не подготовил замену", row.prospect_id, result.why || result.reason);
        await releaseOnModelTrouble(rowId, result.why);
      }
    }
  }
  const { data: owner } = await db.from("touch_portions").select("staff_id").eq("id", rowId).maybeSingle();
  if (owner) await deliverPortions(new Date(), owner.staff_id as string);
}

/** Чья сегодня в порции эта компания — для «не пишем» в панели: замена положена хозяину порции. */
export async function portionOwner(prospectId: string, now: Date = new Date()): Promise<string | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db
    .from("touch_portions")
    .select("staff_id")
    .eq("day", todayInTashkent(now))
    .eq("prospect_id", prospectId)
    .maybeSingle();
  return (data?.staff_id as string | undefined) ?? null;
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

  // Пустой день порции — не повод молчать: касания из панели и потока
  // отчёт показывает и тогда.
  const { data: rows } = await db
    .from("touch_portions")
    .select("id, staff_id, prospect_id, outcome, replaces, source")
    .eq("day", day);
  const data = rows ?? [];

  const prospects = new Map((await prospectsByIds(data.map((r) => r.prospect_id as string))).map((p) => [p.id, p]));
  const people = await team();
  // Итог по человеку — по всем его строкам сразу: цель — утренняя раздача,
  // сделано — только касания, «Не подходит» — отдельно (lib/admin/portion).
  const byPerson = new Map<string, { replaces: string | null; outcome: ReturnType<typeof outcomeOf> }[]>();
  // Поток — отдельно: сколько касаний сверх порции.
  const streamDone = new Map<string, number>();

  for (const row of data) {
    const staffId = row.staff_id as string;
    const person = people.find((p) => p.id === staffId);
    if (!person) continue;
    const p = prospects.get(row.prospect_id as string);
    const outcome = p ? outcomeOf(p, staffId, day) : null;
    if (row.source === "stream") {
      if (outcome === "sent" || outcome === "self") streamDone.set(staffId, (streamDone.get(staffId) ?? 0) + 1);
    } else {
      byPerson.set(staffId, [...(byPerson.get(staffId) ?? []), { replaces: (row.replaces as string | null) ?? null, outcome }]);
    }

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

  // В отчёте — вся команда: и тот, у кого не было ни порции, ни потока, —
  // ноль касаний за день тоже ответ.
  const touches = await touchesOnDay(
    people.map((p) => p.id),
    day,
  );
  const reports: PersonReport[] = people
    .map((person) => {
      const t = tallyPortion(byPerson.get(person.id) ?? []);
      return {
        name: person.name,
        target: t.target,
        done: t.done,
        skipped: t.skipped,
        short: t.short,
        stream: streamDone.get(person.id) ?? 0,
        touches: touches.get(person.id) ?? 0,
      };
    })
    .sort(byTouches);
  if (!reports.length) return 0;

  const text = [
    `<b>Касания за день · ${day.split("-").reverse().join(".")}</b>`,
    "",
    ...reports.map(reportLine),
    "",
    reportTotal(reports),
    "",
    "Касания — все, кому человек написал за день («Отправить» или «Написал сам»): из порции, потока и панели. Порция — сколько из утренней раздачи; «Не подходит» не в счёт, за неё выдаётся замена. «Поток» — касания по кнопке «Получать лиды». Несделанное вернулось в общий пул.",
  ].join("\n");

  // Руководителям — тот же отчёт, что владельцу: вся команда. Владелец,
  // 01.10: «руководителям в телеграм должно приходить как и мне».
  const { data: owners } = await db
    .from("staff")
    .select("telegram_user_id, notify_off")
    .eq("role", "admin")
    .eq("is_active", true);
  const readers = [
    ...people.filter((p) => p.role === "head").map((p) => ({ chat: p.chat, off: p.off })),
    ...(owners ?? []).map((o) => ({ chat: Number(o.telegram_user_id) || null, off: (o.notify_off as string[] | null) ?? [] })),
  ];
  for (const reader of readers) {
    if (!reader.chat || !wants(reader.off, "reports")) continue;
    if (!(await sendMessage(reader.chat, text))) console.error("порция: отчёт не дошёл", reader.chat);
  }
  return reports.length;
}

/**
 * Компания из порции; `replacement` — выдана вместо «Не подходит» и в цель
 * дня не входит; `stream` — пришла потоком «Получать лиды», сверх порции.
 */
export type PortionItem = Prospect & { replacement: boolean; stream: boolean };

/** Порция человека на сегодня — для блока в «Касаниях», в порядке выдачи. */
export async function portionOf(staffId: string, now: Date = new Date()): Promise<PortionItem[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data } = await db
    .from("touch_portions")
    .select("prospect_id, replaces, source, created_at")
    .eq("day", todayInTashkent(now))
    .eq("staff_id", staffId)
    .order("created_at", { ascending: true });
  const rows = data ?? [];
  const byId = new Map((await prospectsByIds(rows.map((r) => r.prospect_id as string))).map((p) => [p.id, p]));
  return rows.flatMap((r) => {
    const p = byId.get(r.prospect_id as string);
    return p ? [{ ...p, replacement: Boolean(r.replaces), stream: r.source === "stream" }] : [];
  });
}

/**
 * Чья сегодня эта компания у этого человека: из порции, из потока — или
 * ничья (null). Для кнопок бота: чужая и вчерашняя ничего не делают.
 */
export async function portionSource(
  staffId: string,
  prospectId: string,
  now: Date = new Date(),
): Promise<"portion" | "stream" | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db
    .from("touch_portions")
    .select("source")
    .eq("day", todayInTashkent(now))
    .eq("staff_id", staffId)
    .eq("prospect_id", prospectId)
    .maybeSingle();
  if (!data) return null;
  return data.source === "stream" ? "stream" : "portion";
}

/**
 * Весь день порции из одного прохода свипа. Тяжёлая подготовка писем сюда
 * не входит — её свип зовёт после ответа, см. preparePortionsInBackground.
 */
export async function runPortions(now: Date = new Date()): Promise<{
  assigned: PortionAssign | null;
  replaced: number;
  delivered: number;
  texted: number;
  reported: number;
}> {
  const assigned = await assignPortions(now);
  // Замены за «Не подходит», которые не выдались сразу: пул был пуст, упал
  // запрос, «не пишем» нажали в панели, пока свип спал.
  const replaced = await topUpPortions(now);
  const delivered = await deliverPortions(now);
  // Тексты к карточкам, ушедшим без них, — до отчёта: в 18:00 строки
  // закрываются, и досылать станет нечего.
  const texted = await deliverTexts(now);
  const reported = await reportPortions(now);
  return { assigned, replaced, delivered, texted, reported };
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
