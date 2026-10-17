/**
 * «Главная» менеджера — пульс его рабочего дня (app/admin/hq).
 *
 * Владелец, 16.10.2026: «Менеджерам тоже теперь админку как у нас, страница
 * „главная“ с пульсом их работы. Добавь туда с кем связаться, кому
 * отправили макет и когда с возможностью быстро поменять статус (выиграл /
 * проиграл / ждем)… подсвечивай анимацией горящие задачи и просрочки».
 *
 * Как и командный центр (lib/admin/hq.ts), здесь только правила над
 * строками из базы — без запросов и без модели. Строки — только этого
 * человека: их отбирает lib/admin/hq-my-store.ts, а «чьё это» для
 * переписки и макетов решают функции ниже (mineReply, mockupOwnerId), и
 * их держит тест (tests/hq-my.test.ts).
 *
 * Время — Ташкент, «сегодня» — с полуночи по Ташкенту.
 */

import { dayStartOf, touchAt, trendOf, type HqProspect, type Trend } from "@/lib/admin/hq";
import { canWait, stale as isStale, idleDays, type IdleLead } from "@/lib/admin/lead-tidy";
import { tallyPortion, type PortionOutcome } from "@/lib/admin/portion";

const DAY_MS = 24 * 3600_000;

/** Клиент открыл прототип не раньше стольких минут назад — «только что», пора писать. */
export const OPENED_HOT_MIN = 60;
/** Сколько строк в одном блоке; дальше — «ещё N» ссылкой в раздел. */
export const MY_LIST_MAX = 12;
/** Клиент ждёт ответа дольше — строка красная. */
export const REPLY_RED_MIN = 60;
/** Предложение тёплого лида: меньше стольких минут до конца — красное. */
export const OFFER_RED_MIN = 10;

/** Полночь завтра по Ташкенту — конец «сегодня». */
export function dayEndOf(now: Date): number {
  return dayStartOf(now) + DAY_MS;
}

const ms = (at: string | null | undefined) => (at ? Date.parse(at) : Number.NaN);

/* ── Входные строки ──────────────────────────────────────────────────── */

/** Лид этого человека «в работе» — с последним движением (lib/admin/lead-tidy-store, loadIdle). */
export type MyLead = IdleLead & {
  /** Канал связи без самого контакта: telegram, phone, email; контакт открывается отдельным действием с журналом. */
  contactKind?: string | null;
};

/** Тёплый лид, предложенный ему очередью: 30 минут на «Взять». */
export type MyOffer = { leadId: string; label: string; expiresAt: string };

/** Входящее клиента, на которое ещё не ответили, — уже решено, что оно этого человека (mineReply). */
export type MyReply = {
  prospectId: string;
  leadId: string | null;
  label: string;
  /** Самое раннее неотвеченное — с него клиент ждёт. */
  since: string;
  /** Куда писать клиенту, если лида нет: @ник или телефон из касания. */
  target: string | null;
};

export type MyTask = {
  id: string;
  title: string;
  body: string;
  status: string;
  due_at: string;
};

/** Касание этого человека (prospects.touched_by) — для «ответили сегодня» и чисел. */
export type MyProspect = HqProspect & { label: string; target: string | null; lead_id: string | null };

/** Макет, отправленный клиенту этого человека, — строка mockup_offers с состоянием прототипа. */
export type MyMockup = {
  id: string;
  ref: string;
  client: string;
  name: string;
  /** Первая отправка ссылки клиенту — с неё идёт акция 48 часов и сутки без пароля. */
  sentAt: string;
  expiresAt: string;
  status: string;
  leadId: string | null;
  prospectId: string | null;
  /** Последнее открытие живым человеком (proto_views); у витрины — null. */
  lastOpenedAt: string | null;
  /** Сколько раз открыт живым человеком (protos.opens). */
  opens: number;
  /** Открыт без пароля до этой минуты; null — закрыт или витрина. */
  openUntil: string | null;
  /** Закрыт паролем с этой минуты. */
  closedAt: string | null;
};

/** Акция 48 часов идёт — как liveOffer на «Главной» команды (lib/admin/hq.ts). */
export function promoLiveOf(m: Pick<MyMockup, "status" | "expiresAt">, now: Date): boolean {
  return m.status === "active" && ms(m.expiresAt) > now.getTime();
}

/* ── Чьё это ─────────────────────────────────────────────────────────── */

/**
 * Переписка этого человека: если есть лид — по хозяину лида (разговор идёт
 * за лидом, lib/admin/talk-follows-lead.ts); лида нет — кто ведёт касание:
 * тот, кто забрал разговор у модели, взял касание или написал его.
 */
export function mineReply(
  input: {
    leadOwner: string | null | undefined;
    hasLead: boolean;
    handled_by?: string | null;
    claimed_by?: string | null;
    touched_by?: string | null;
  },
  me: string,
): boolean {
  if (input.hasLead) return input.leadOwner === me;
  return (input.handled_by ?? input.claimed_by ?? input.touched_by ?? null) === me;
}

/**
 * Ответственный за макет — тем же порядком, что в «Макетах»
 * (lib/admin/mockups.ts, mockupOwner): назначенный руками, хозяин лида,
 * автор касания, кто собрал. Уволенный пропускается — макет переходит к
 * следующему в очереди.
 */
export function mockupOwnerId(
  ids: { set: string | null; lead: string | null; touch: string | null; made: string | null },
  active: ReadonlySet<string>,
): string | null {
  for (const id of [ids.set, ids.lead, ids.touch, ids.made]) if (id && active.has(id)) return id;
  return null;
}

/* ── Где это открыть ─────────────────────────────────────────────────── */

export const myHref = {
  lead: (id: string) => `/admin/leads/${id}`,
  task: (id: string) => `/admin/tasks/${id}`,
  prospect: (id: string) => `/admin/prospect?open=${id}#p-${id}`,
  mockup: (ref: string) => `/admin/mockups#mockup-${ref.replace(/[^a-z0-9-]/gi, "-")}`,
  project: (leadId: string) => `/admin/projects?lead=${leadId}`,
};

/** Лид в задаче «Связаться: …»: ссылка на его карточку в описании (lib/admin/lead-tidy.ts, taskBody). */
export function leadOfTask(t: Pick<MyTask, "body">): string | null {
  return /\/admin\/leads\/([0-9a-f-]{36})/i.exec(t.body ?? "")?.[1] ?? null;
}

/** Задача «Связаться: …» — следующий шаг с клиентом, её ставит «⏳» (taskTitle). */
export function isContactTask(t: Pick<MyTask, "title">): boolean {
  return /^Связаться:/.test(t.title);
}

const OPEN: readonly string[] = ["new", "in_work"];

/** Ссылка «написать в один тап» по цели касания: @ник — Telegram, номер — звонок. */
export function targetUrl(target: string | null | undefined): string | null {
  const t = (target ?? "").trim();
  if (!t) return null;
  const nick = /^(?:@|https?:\/\/t\.me\/)([A-Za-z0-9_]{4,32})$/i.exec(t);
  if (nick) return `https://t.me/${nick[1]}`;
  const digits = t.replace(/[^\d+]/g, "");
  if (/^\+?\d{7,15}$/.test(digits) && /^[\d\s()+-]+$/.test(t)) return `tel:${digits}`;
  return null;
}

/* ── «Горит сейчас» и «Просрочено» ───────────────────────────────────── */

/** У строки с лидом «в работе» — кнопки статуса; без «⏳», если его откладывали трижды. */
export type StatusTarget = { leadId: string; canWait: boolean };

export type Hot =
  | { kind: "offer"; key: string; label: string; until: string; leadId: string; red: boolean; href: string }
  | { kind: "reply"; key: string; label: string; since: string; leadId: string | null; red: boolean; href: string; status: StatusTarget | null }
  | { kind: "opened"; key: string; label: string; at: string; ref: string; red: boolean; href: string; status: StatusTarget | null }
  | { kind: "promo"; key: string; label: string; endsAt: string; ref: string; red: boolean; href: string; status: StatusTarget | null }
  | { kind: "taskToday"; key: string; label: string; due: string; red: boolean; href: string; status: StatusTarget | null };

export type Overdue =
  | { kind: "task"; key: string; label: string; due: string; href: string; status: StatusTarget | null }
  | { kind: "nextStep"; key: string; label: string; since: string; href: string; status: StatusTarget }
  | { kind: "stale"; key: string; label: string; days: number; href: string; status: StatusTarget };

/** Порядок «горит»: сгорит раньше всех — первым. */
export const HOT_RANK: Record<Hot["kind"], number> = { offer: 0, reply: 1, opened: 2, promo: 3, taskToday: 4 };
export const OVERDUE_RANK: Record<Overdue["kind"], number> = { task: 0, nextStep: 1, stale: 2 };

export type MyInput = {
  me: string;
  now: Date;
  leads: readonly MyLead[];
  offers: readonly MyOffer[];
  replies: readonly MyReply[];
  tasks: readonly MyTask[];
  mockups: readonly MyMockup[];
};

function statusOf(leadId: string | null, taken: ReadonlyMap<string, MyLead>): StatusTarget | null {
  const lead = leadId ? taken.get(leadId) : undefined;
  return lead ? { leadId: lead.id, canWait: canWait(lead) } : null;
}

/** День следующего шага настал: срок «⏳» прошёл, а движения по лиду с тех пор не было. */
export function nextStepDue(lead: MyLead, now: Date): boolean {
  if (!lead.snoozedUntil) return false;
  const until = ms(lead.snoozedUntil);
  return until <= now.getTime() && ms(lead.movedAt) < until;
}

/**
 * Что горит прямо сейчас. Только живое: предложение, которое ещё не
 * сгорело, неотвеченный клиент, открытие за последний час, акция, которая
 * кончается сегодня, задача со сроком сегодня (ещё не просроченная).
 */
export function hotOf(input: MyInput): Hot[] {
  const now = input.now.getTime();
  const end = dayEndOf(input.now);
  const taken = new Map(input.leads.map((l) => [l.id, l]));
  const out: Hot[] = [];

  for (const o of input.offers) {
    const left = ms(o.expiresAt) - now;
    if (!(left > 0)) continue;
    out.push({ kind: "offer", key: `offer:${o.leadId}`, label: o.label, until: o.expiresAt, leadId: o.leadId, red: left <= OFFER_RED_MIN * 60_000, href: myHref.lead(o.leadId) });
  }
  for (const r of input.replies) {
    out.push({
      kind: "reply",
      key: `reply:${r.prospectId}`,
      label: r.label,
      since: r.since,
      leadId: r.leadId,
      red: now - ms(r.since) >= REPLY_RED_MIN * 60_000,
      href: r.leadId ? myHref.lead(r.leadId) : myHref.prospect(r.prospectId),
      status: statusOf(r.leadId, taken),
    });
  }
  for (const m of input.mockups) {
    if (m.lastOpenedAt && now - ms(m.lastOpenedAt) <= OPENED_HOT_MIN * 60_000 && ms(m.lastOpenedAt) <= now + 60_000) {
      out.push({
        kind: "opened",
        key: `opened:${m.id}`,
        label: m.client || m.name,
        at: m.lastOpenedAt,
        ref: m.ref,
        red: true,
        href: m.leadId ? myHref.lead(m.leadId) : m.prospectId ? myHref.prospect(m.prospectId) : myHref.mockup(m.ref),
        status: statusOf(m.leadId, taken),
      });
    }
    if (promoLiveOf(m, input.now) && ms(m.expiresAt) < end) {
      out.push({
        kind: "promo",
        key: `promo:${m.id}`,
        label: m.client || m.name,
        endsAt: m.expiresAt,
        ref: m.ref,
        red: ms(m.expiresAt) - now <= 2 * 3600_000,
        href: myHref.mockup(m.ref),
        status: statusOf(m.leadId, taken),
      });
    }
  }
  for (const t of input.tasks) {
    if (!OPEN.includes(t.status)) continue;
    const due = ms(t.due_at);
    if (due >= now && due < end) {
      out.push({ kind: "taskToday", key: `task:${t.id}`, label: t.title, due: t.due_at, red: due - now <= 3600_000, href: myHref.task(t.id), status: statusOf(leadOfTask(t), taken) });
    }
  }

  const when = (h: Hot) => {
    switch (h.kind) {
      case "offer":
        return ms(h.until);
      case "reply":
        return ms(h.since);
      case "opened":
        return -ms(h.at); // свежее открытие — первым
      case "promo":
        return ms(h.endsAt);
      case "taskToday":
        return ms(h.due);
    }
  };
  return out.sort((a, b) => HOT_RANK[a.kind] - HOT_RANK[b.kind] || when(a) - when(b));
}

/**
 * Просрочено: задачи после срока; «⏳ ещё в работе», у которых настал день
 * следующего шага, а движения не было; лиды без движения 7+ дней (как у
 * бота: не отложенные задачей). Лид, у которого уже есть просроченная
 * задача «Связаться», второй строкой не повторяется.
 */
export function overdueOf(input: MyInput): Overdue[] {
  const now = input.now.getTime();
  const taken = new Map(input.leads.map((l) => [l.id, l]));
  const out: Overdue[] = [];
  const covered = new Set<string>();

  for (const t of input.tasks) {
    if (!OPEN.includes(t.status) || !(ms(t.due_at) < now)) continue;
    const leadId = leadOfTask(t);
    if (leadId) covered.add(leadId);
    out.push({ kind: "task", key: `task:${t.id}`, label: t.title, due: t.due_at, href: myHref.task(t.id), status: statusOf(leadId, taken) });
  }
  for (const l of input.leads) {
    if (covered.has(l.id)) continue;
    if (nextStepDue(l, input.now)) {
      out.push({ kind: "nextStep", key: `step:${l.id}`, label: l.label, since: l.snoozedUntil as string, href: myHref.lead(l.id), status: { leadId: l.id, canWait: canWait(l) } });
      continue;
    }
    const snoozed = l.snoozedUntil && ms(l.snoozedUntil) > now;
    if (!snoozed && isStale(l, input.now)) {
      out.push({ kind: "stale", key: `stale:${l.id}`, label: l.label, days: idleDays(l.movedAt, input.now), href: myHref.lead(l.id), status: { leadId: l.id, canWait: canWait(l) } });
    }
  }

  const when = (o: Overdue) => (o.kind === "task" ? ms(o.due) : o.kind === "nextStep" ? ms(o.since) : -o.days);
  return out.sort((a, b) => OVERDUE_RANK[a.kind] - OVERDUE_RANK[b.kind] || when(a) - when(b));
}

/* ── «С кем связаться сегодня» ───────────────────────────────────────── */

export type ContactRow = {
  key: string;
  why: "task" | "nextStep" | "reply";
  label: string;
  leadId: string | null;
  prospectId: string | null;
  /** Канал лида без контакта: сам контакт открывается кнопкой, с записью в журнал. */
  channel: string | null;
  /** Ссылка в один тап по цели касания — когда лида нет. */
  directUrl: string | null;
  href: string;
  at: string;
  status: StatusTarget | null;
};

/**
 * С кем связаться сегодня: задачи «Связаться: …» со сроком до конца дня
 * (и просроченные — их тем более), лиды, у которых сегодня следующий шаг,
 * и клиенты, которые ответили и ждут, или ответили на его касание сегодня.
 * Один клиент — одна строка.
 */
export function contactsOf(input: MyInput & { prospects: readonly MyProspect[] }): ContactRow[] {
  const start = dayStartOf(input.now);
  const end = dayEndOf(input.now);
  const taken = new Map(input.leads.map((l) => [l.id, l]));
  const seen = new Set<string>();
  const out: ContactRow[] = [];
  const add = (row: ContactRow) => {
    const id = row.leadId ? `l:${row.leadId}` : `p:${row.prospectId}`;
    if (seen.has(id)) return;
    seen.add(id);
    out.push(row);
  };

  for (const t of input.tasks) {
    if (!OPEN.includes(t.status) || !isContactTask(t) || !(ms(t.due_at) < end)) continue;
    const leadId = leadOfTask(t);
    const lead = leadId ? taken.get(leadId) : undefined;
    add({
      key: `task:${t.id}`,
      why: "task",
      label: lead?.label ?? t.title.replace(/^Связаться:\s*/, ""),
      leadId,
      prospectId: null,
      channel: lead?.contactKind ?? null,
      directUrl: null,
      href: leadId ? myHref.lead(leadId) : myHref.task(t.id),
      at: t.due_at,
      status: statusOf(leadId, taken),
    });
  }
  for (const l of input.leads) {
    const until = ms(l.snoozedUntil);
    if (!(until >= start && until < end)) continue;
    add({ key: `step:${l.id}`, why: "nextStep", label: l.label, leadId: l.id, prospectId: null, channel: l.contactKind ?? null, directUrl: null, href: myHref.lead(l.id), at: l.snoozedUntil as string, status: statusOf(l.id, taken) });
  }
  for (const r of input.replies) {
    const lead = r.leadId ? taken.get(r.leadId) : undefined;
    add({
      key: `reply:${r.prospectId}`,
      why: "reply",
      label: r.label,
      leadId: r.leadId,
      prospectId: r.prospectId,
      channel: lead?.contactKind ?? null,
      directUrl: r.leadId ? null : targetUrl(r.target),
      href: r.leadId ? myHref.lead(r.leadId) : myHref.prospect(r.prospectId),
      at: r.since,
      status: statusOf(r.leadId, taken),
    });
  }
  for (const p of input.prospects) {
    if (p.touched_by !== input.me || !(ms(p.replied_at) >= start)) continue;
    const lead = p.lead_id ? taken.get(p.lead_id) : undefined;
    add({
      key: `replied:${p.id}`,
      why: "reply",
      label: p.label,
      leadId: p.lead_id,
      prospectId: p.id,
      channel: lead?.contactKind ?? null,
      directUrl: p.lead_id ? null : targetUrl(p.target),
      href: p.lead_id ? myHref.lead(p.lead_id) : myHref.prospect(p.id),
      at: p.replied_at as string,
      status: statusOf(p.lead_id, taken),
    });
  }
  // Сверху — кто ждёт ответа (дольше ждёт — выше), потом ответившие сегодня, задачи, шаги.
  const rank = (r: ContactRow) => (r.key.startsWith("reply:") ? 0 : r.why === "reply" ? 1 : r.why === "task" ? 2 : 3);
  return out.sort((a, b) => rank(a) - rank(b) || ms(a.at) - ms(b.at));
}

/* ── «Мои макеты» ────────────────────────────────────────────────────── */

export type MockupLine = MyMockup & {
  /** Отмечен показ макета клиенту (lib/admin/sales-stages.ts); null — ещё нет. */
  shownAt?: string | null;
  /** Акция 48 часов идёт. */
  promoLive: boolean;
  /** Открыт за последний час — «смотрит прямо сейчас». */
  openedNow: boolean;
  status_: StatusTarget | null;
  href: string;
};

/** Мои макеты: живые акции — первыми, ближе к концу — выше; дальше — свежие отправки. */
export function mockupLines(input: Pick<MyInput, "mockups" | "leads" | "now">): MockupLine[] {
  const now = input.now.getTime();
  const taken = new Map(input.leads.map((l) => [l.id, l]));
  return input.mockups
    .map((m) => {
      const promoLive = promoLiveOf(m, input.now);
      return {
        ...m,
        promoLive,
        openedNow: Boolean(m.lastOpenedAt) && now - ms(m.lastOpenedAt) <= OPENED_HOT_MIN * 60_000,
        status_: statusOf(m.leadId, taken),
        href: m.leadId ? myHref.lead(m.leadId) : myHref.mockup(m.ref),
      };
    })
    .sort((a, b) => Number(b.promoLive) - Number(a.promoLive) || (a.promoLive ? ms(a.expiresAt) - ms(b.expiresAt) : ms(b.sentAt) - ms(a.sentAt)));
}

/* ── «Моя работа» ────────────────────────────────────────────────────── */

export type MyOfferClosed = { outcome: string | null; closed_at: string | null };
export type MyWin = { created_at: string };
export type MyPortionRow = { replaces: string | null; outcome: string | null; source: string | null };

export type MyWork = {
  portionDone: number;
  portionTarget: number;
  touchesToday: number;
  touches7: Trend;
  repliesToday: number;
  replies7: Trend;
  warmTaken7: Trend;
  warmBurned7: Trend;
  burnedToday: number;
  mockups7: Trend;
  won7: Trend;
  inWork: number;
};

export function workOf(
  input: {
    me: string;
    now: Date;
    portion: readonly MyPortionRow[];
    prospects: readonly MyProspect[];
    offersClosed: readonly MyOfferClosed[];
    mockups: readonly Pick<MyMockup, "sentAt">[];
    wins: readonly MyWin[];
    inWork: number;
  },
): MyWork {
  const start = dayStartOf(input.now);
  const tally = tallyPortion(
    input.portion
      .filter((r) => r.source !== "stream")
      .map((r) => ({ replaces: r.replaces, outcome: r.outcome === "expired" ? null : ((r.outcome as PortionOutcome | null) ?? null) })),
  );
  const mine = input.prospects.filter((p) => p.touched_by === input.me);
  const touches = mine.map(touchAt);
  const today = (at: string | null | undefined) => ms(at) >= start && ms(at) <= input.now.getTime();
  return {
    portionDone: tally.done,
    portionTarget: tally.target,
    touchesToday: Math.max(touches.filter(today).length, tally.done),
    touches7: trendOf(touches, input.now),
    repliesToday: mine.filter((p) => today(p.replied_at)).length,
    replies7: trendOf(
      mine.map((p) => p.replied_at),
      input.now,
    ),
    warmTaken7: trendOf(
      input.offersClosed.filter((o) => o.outcome === "taken").map((o) => o.closed_at),
      input.now,
    ),
    warmBurned7: trendOf(
      input.offersClosed.filter((o) => o.outcome === "expired").map((o) => o.closed_at),
      input.now,
    ),
    burnedToday: input.offersClosed.filter((o) => o.outcome === "expired" && today(o.closed_at)).length,
    mockups7: trendOf(
      input.mockups.map((m) => m.sentAt),
      input.now,
    ),
    won7: trendOf(
      input.wins.map((w) => w.created_at),
      input.now,
    ),
    inWork: input.inWork,
  };
}

/** Сколько осталось до момента: часы и минуты (подписи — в словаре). */
export function untilOf(at: string, now: Date): { h: number; m: number } {
  const total = Math.max(0, Math.floor((ms(at) - now.getTime()) / 60_000));
  return { h: Math.floor(total / 60), m: total % 60 };
}

/** Сколько прошло с момента: часы и минуты. */
export function sinceOf(at: string, now: Date): { h: number; m: number } {
  const total = Math.max(0, Math.floor((now.getTime() - ms(at)) / 60_000));
  return { h: Math.floor(total / 60), m: total % 60 };
}
