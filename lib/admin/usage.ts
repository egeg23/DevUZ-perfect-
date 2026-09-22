import type { AuditAction } from "@/lib/admin/audit";
import { TASHKENT_OFFSET_MS } from "@/lib/admin/pulse";
import { SECTIONS, type Role } from "@/lib/admin/roles";

/**
 * Чем команда пользуется в панели — тихий кастдев для владельца.
 *
 * Владелец: «хочу видеть, чем менеджеры и руководители пользуются чаще
 * всего из нашего функционала — какие функции реально нужны, а какие шум».
 *
 * Две половины ответа из двух источников. Просмотры разделов — отдельный
 * счётчик (panel_usage): журнал не знает, что человек открыл «Статистику» и
 * ушёл. Действия — из журнала: он уже знает каждое нажатие, в том числе в
 * боте, и считать их второй раз незачем.
 *
 * Здесь чистая арифметика: строки приходят аргументом, «сейчас» тоже.
 * Владелец в счёт не входит — он смотрит на команду, а не на себя.
 */

export type Tracked = { href: string; label: string; roles: readonly Role[] };

/**
 * Что считается разделом: всё меню плюс карточка лида.
 *
 * Карточка — отдельной строкой: это не пункт меню, но именно в ней идёт
 * работа с лидом, и «на главную зашли, а в карточку нет» — ответ сам по себе.
 */
export const TRACKED: readonly Tracked[] = [
  ...SECTIONS.map((s) => (s.href === "/admin" ? { ...s, label: "Главная и лиды" } : s)),
  { href: "/admin/leads", label: "Карточка лида", roles: ["admin", "head", "manager"] },
];

const TRACKED_HREFS = new Set(TRACKED.map((t) => t.href));

/**
 * Путь страницы → раздел, или null.
 *
 * Подразделы сворачиваются в раздел: /admin/projects/123 — это «Проекты».
 * Незнакомое не пишется вовсе: вход, выход и опечатки в адресе засоряли бы
 * таблицу строками, которых нет в меню.
 */
export function sectionOf(path: string): string | null {
  const clean = path.split(/[?#]/)[0].replace(/\/+$/, "");
  if (clean === "/admin") return "/admin";
  const match = /^\/admin\/([a-z-]+)(?:\/|$)/.exec(clean);
  if (!match) return null;
  const href = `/admin/${match[1]}`;
  return TRACKED_HREFS.has(href) ? href : null;
}

export type Feature = {
  key: string;
  label: string;
  actions: readonly AuditAction[];
  /** Кому функция вообще доступна. Не задано — менеджерам и руководителям. */
  roles?: readonly Role[];
};

/**
 * Функции — это действия из журнала, сложенные по смыслу.
 *
 * «Взял» и «отпустил» — одна функция: вопрос не в том, сколько раз нажали
 * каждую кнопку, а нужна ли человеку сама возможность. Служебные записи —
 * входы, отправка напоминаний таймером, скачивания покупателей — сюда не
 * попадают: это не выбор сотрудника.
 */
export const FEATURES: readonly Feature[] = [
  { key: "lead-open", label: "Открыть карточку лида", actions: ["lead.viewed"] },
  { key: "lead-take", label: "Взять или отпустить лида", actions: ["lead.taken", "lead.released"] },
  { key: "lead-status", label: "Сменить статус лида", actions: ["lead.status_changed"] },
  { key: "lead-contact", label: "Открыть контакт клиента", actions: ["lead.contact_revealed"] },
  { key: "lead-transcript", label: "Прочитать переписку клиента с ботом", actions: ["lead.transcript_viewed"] },
  { key: "lead-note", label: "Заметки в карточке лида", actions: ["message.posted"] },
  {
    key: "reminders",
    label: "Напоминания",
    actions: ["reminder.created", "reminder.done", "lead.auto_reminder_toggled"],
  },
  {
    key: "transfer",
    label: "Передача лида коллеге",
    actions: ["lead.transfer_requested", "lead.transfer_decided", "lead.transferred"],
  },
  { key: "prospect-audit", label: "Касания: проверить сайт", actions: ["prospect.audited"] },
  { key: "prospect-send", label: "Касания: отправить через бота", actions: ["prospect.queued"] },
  { key: "prospect-self", label: "Касания: «связался сам»", actions: ["prospect.manual_sent"] },
  {
    key: "prospect-reply",
    label: "Касания: ответить вручную или перехватить у модели",
    actions: ["prospect.manual_reply", "prospect.taken_over"],
  },
  { key: "scout", label: "Поиск: разобрать сигнал из чатов", actions: ["signal.status_changed"] },
  {
    key: "projects",
    label: "Проекты: завести и вести",
    actions: ["project.created", "project.updated", "project.stage_changed", "project.quote_set"],
  },
  {
    key: "payments",
    label: "Оплаты по проектам",
    actions: ["project.payment_added", "project.payment_removed", "project.money_set"],
  },
  {
    key: "contracts",
    label: "Договоры и счета",
    actions: ["contract.link_issued", "invoice.issued", "invoice.paid"],
  },
  {
    key: "orders",
    label: "Заявки на покупку",
    actions: [
      "order.status_changed",
      "order.invoiced",
      "order.paid",
      "order.delivered",
      "order.cancelled",
      "order.reopened",
      "order.amount_set",
      "order.link_reissued",
      "order.nudged",
    ],
  },
  { key: "plans", label: "Планы на неделю и месяц", actions: ["plan.set", "plan.removed"] },
  { key: "touch-plan", label: "План касаний сотрудникам", actions: ["staff.touch_plan_set"], roles: ["head"] },
  {
    key: "candidates",
    label: "Кандидаты: разбор резюме",
    actions: ["candidate.reviewed", "candidate.dropped"],
    roles: ["head"],
  },
  {
    key: "team",
    label: "Команда: завести и закрепить менеджера",
    actions: ["staff.invited", "staff.head_changed"],
    roles: ["head"],
  },
  { key: "expenses", label: "Расходы", actions: ["expense.added", "expense.removed"], roles: ["head"] },
];

const TEAM_ROLES: readonly Role[] = ["head", "manager"];

/** Что значит цифра — словами, а не только процентом. */
export type Verdict = "core" | "some" | "unused";

export const VERDICT_TITLE: Record<Verdict, string> = {
  core: "ядро",
  some: "у единиц",
  unused: "никто — шум?",
};

/**
 * Ядро — пользуется хотя бы половина тех, кому это доступно. Никто — тот
 * самый кандидат в шум. Всё между — «у единиц»: функция нужна кому-то одному,
 * и это вопрос не к функции, а к тому, знают ли о ней остальные.
 */
export function verdictOf(people: number, eligible: number): Verdict {
  if (people <= 0) return "unused";
  if (eligible > 0 && people * 2 >= eligible) return "core";
  return "some";
}

export type Person = { id: string; name: string; role: Role };
export type ViewRow = {
  day: string;
  staff_id: string;
  section: string;
  views: number;
  /** Когда был последний просмотр этого раздела в этот день. */
  last_at?: string | null;
};
export type ActionRow = { action: string; actor: string; at: string; via: string | null };

export type SectionUsage = {
  href: string;
  label: string;
  views: number;
  people: number;
  eligible: number;
  days: number;
  prevViews: number;
  verdict: Verdict;
};

export type FeatureUsage = {
  key: string;
  label: string;
  count: number;
  people: number;
  eligible: number;
  viaBot: number;
  prevCount: number;
  last: string | null;
  verdict: Verdict;
};

export type PersonUsage = {
  id: string;
  name: string;
  role: Role;
  logins: number;
  views: number;
  actions: number;
  activeDays: number;
  top: string[];
  lastSeen: string | null;
};

export type UsageReport = {
  team: number;
  active: number;
  views: number;
  actions: number;
  sections: SectionUsage[];
  features: FeatureUsage[];
  persons: PersonUsage[];
};

/** День по Ташкенту из метки времени — те же сутки, что у счётчика просмотров. */
function tashkentDay(at: string): string {
  return new Date(Date.parse(at) + TASHKENT_OFFSET_MS).toISOString().slice(0, 10);
}

const FEATURE_OF = new Map<string, Feature>(FEATURES.flatMap((f) => f.actions.map((a) => [a, f] as const)));
const LABEL_OF = new Map(TRACKED.map((t) => [t.href, t.label]));

/**
 * Отчёт за период и сравнение с предыдущим таким же.
 *
 * Разделы и функции, которыми не пользовался никто, в отчёте есть — с
 * нулём. Ради них он и строится: «никто не открывал» не видно в таблице,
 * где есть только то, что открывали.
 */
export function usageReport(input: {
  people: readonly Person[];
  views: readonly ViewRow[];
  prevViews: readonly ViewRow[];
  actions: readonly ActionRow[];
  prevActions: readonly ActionRow[];
}): UsageReport {
  const team = input.people.filter((p) => TEAM_ROLES.includes(p.role));
  const ids = new Set(team.map((p) => p.id));
  const eligibleFor = (roles: readonly Role[]) => team.filter((p) => roles.includes(p.role)).length;

  const views = input.views.filter((v) => ids.has(v.staff_id));
  const prevViews = input.prevViews.filter((v) => ids.has(v.staff_id));
  const actions = input.actions.filter((a) => ids.has(a.actor));
  const prevActions = input.prevActions.filter((a) => ids.has(a.actor));

  const sections: SectionUsage[] = TRACKED.filter((t) => t.roles.some((r) => TEAM_ROLES.includes(r)))
    .map((t) => {
      const rows = views.filter((v) => v.section === t.href);
      const eligible = eligibleFor(t.roles);
      const people = new Set(rows.map((r) => r.staff_id)).size;
      return {
        href: t.href,
        label: t.label,
        views: rows.reduce((sum, r) => sum + r.views, 0),
        people,
        eligible,
        days: new Set(rows.map((r) => r.day)).size,
        prevViews: prevViews.filter((v) => v.section === t.href).reduce((sum, r) => sum + r.views, 0),
        verdict: verdictOf(people, eligible),
      };
    })
    .sort((a, b) => b.people - a.people || b.views - a.views);

  const features: FeatureUsage[] = FEATURES.map((f) => {
    const rows = actions.filter((a) => FEATURE_OF.get(a.action) === f);
    const eligible = eligibleFor(f.roles ?? TEAM_ROLES);
    const people = new Set(rows.map((r) => r.actor)).size;
    return {
      key: f.key,
      label: f.label,
      count: rows.length,
      people,
      eligible,
      viaBot: rows.filter((r) => r.via === "telegram").length,
      prevCount: prevActions.filter((a) => FEATURE_OF.get(a.action) === f).length,
      last: rows.reduce<string | null>((max, r) => (max === null || r.at > max ? r.at : max), null),
      verdict: verdictOf(people, eligible),
    };
  }).sort((a, b) => b.people - a.people || b.count - a.count);

  const persons: PersonUsage[] = team
    .map((p) => {
      const mine = views.filter((v) => v.staff_id === p.id);
      const acts = actions.filter((a) => a.actor === p.id);
      const bySection = new Map<string, number>();
      for (const v of mine) bySection.set(v.section, (bySection.get(v.section) ?? 0) + v.views);
      const days = new Set([...mine.map((v) => v.day), ...acts.map((a) => tashkentDay(a.at))]);
      return {
        id: p.id,
        name: p.name,
        role: p.role,
        logins: acts.filter((a) => a.action === "login.succeeded").length,
        views: mine.reduce((sum, v) => sum + v.views, 0),
        actions: acts.filter((a) => FEATURE_OF.has(a.action)).length,
        activeDays: days.size,
        top: [...bySection.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([href]) => LABEL_OF.get(href) ?? href),
        lastSeen: [...acts.map((a) => a.at), ...mine.map((v) => v.last_at ?? null)].reduce<string | null>(
          (max, at) => (at && (max === null || at > max) ? at : max),
          null,
        ),
      };
    })
    .sort((a, b) => b.views + b.actions - (a.views + a.actions));

  return {
    team: team.length,
    active: persons.filter((p) => p.views > 0 || p.actions > 0 || p.logins > 0).length,
    views: views.reduce((sum, v) => sum + v.views, 0),
    actions: actions.filter((a) => FEATURE_OF.has(a.action)).length,
    sections,
    features,
    persons,
  };
}

/** Период отчёта: сколько дней назад. Из адреса — только эти три. */
export const USAGE_PERIODS = [7, 30, 90] as const;
export type UsagePeriod = (typeof USAGE_PERIODS)[number];

export function periodOf(raw: string | undefined): UsagePeriod {
  const n = Number(raw);
  return (USAGE_PERIODS as readonly number[]).includes(n) ? (n as UsagePeriod) : 30;
}
