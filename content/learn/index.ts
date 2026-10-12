import type { PanelLocale } from "@/lib/admin/i18n";

import { ru } from "@/content/learn/ru";
import { uz } from "@/content/learn/uz";
import { pl } from "@/content/learn/pl";

/**
 * Раздел «Обучение»: курсы по продажам и тест по панели.
 *
 * Владелец, 12.10.2026: «Добавить курсы по продажам и тестирование по
 * знаниям дашборда». Курсы — про наш настоящий процесс: касание в два шага,
 * кружок, «+», возражения, заходы писем, тёплые лиды. Тест по панели собран
 * из инструкции (content/admin-help-*): каждый вопрос ведёт в свой пункт,
 * и неверный ответ показывает ссылку туда.
 *
 * Устройство: здесь — порядок и ключи (что за курс, какие уроки, какой
 * вопрос к какому уроку или пункту инструкции); текст — в ru.ts, uz.ts и
 * pl.ts, по тем же ключам. Тест (tests/learn.test.ts) сверяет, что у трёх
 * языков одинаковый набор уроков, абзацев, вопросов и вариантов.
 *
 * **Первый вариант ответа в тексте — всегда верный.** На экране варианты
 * перемешаны (lib/learn/grade.ts, `optionOrder`), а проверка на сервере
 * сравнивает выбранный номер с нулём. Так ключ ответов не может разойтись
 * между языками: его просто нет.
 */

export const COURSE_KEYS = ["hello", "circle", "plus", "objections", "letters", "warm"] as const;
export type CourseKey = (typeof COURSE_KEYS)[number];

/** Тест по панели хранится в результатах под этим ключом. */
export const PANEL_QUIZ = "panel";
export type LearnKey = CourseKey | typeof PANEL_QUIZ;

export function isLearnKey(value: unknown): value is LearnKey {
  return value === PANEL_QUIZ || (COURSE_KEYS as readonly unknown[]).includes(value);
}

/** Ключ захода автопрогона (AUTO_ARMS в lib/admin/letter-texts.ts): урок показывает его настоящий текст. */
export type ArmKey = "pain" | "question" | "rival";

export type CourseMeta = {
  key: CourseKey;
  lessons: readonly { id: string; arm?: ArmKey }[];
  /** Вопрос и урок, к которому он отсылает при ошибке. */
  quiz: readonly { id: string; lesson: string }[];
};

export const COURSES: readonly CourseMeta[] = [
  {
    key: "hello",
    lessons: [{ id: "why" }, { id: "how" }, { id: "after" }, { id: "dont" }],
    quiz: [
      { id: "first", lesson: "how" },
      { id: "spam", lesson: "why" },
      { id: "silent", lesson: "after" },
      { id: "who", lesson: "after" },
      { id: "call", lesson: "after" },
      { id: "count", lesson: "how" },
    ],
  },
  {
    key: "circle",
    lessons: [{ id: "what" }, { id: "lang" }, { id: "fail" }, { id: "record" }],
    quiz: [
      { id: "offer", lesson: "what" },
      { id: "uz", lesson: "lang" },
      { id: "other", lesson: "lang" },
      { id: "forbidden", lesson: "fail" },
      { id: "letter", lesson: "what" },
      { id: "upload", lesson: "fail" },
    ],
  },
  {
    key: "plus",
    lessons: [{ id: "yes" }, { id: "after" }, { id: "terms" }, { id: "deadline" }],
    quiz: [
      { id: "go", lesson: "yes" },
      { id: "agree", lesson: "terms" },
      { id: "minutes", lesson: "after" },
      { id: "hours", lesson: "deadline" },
      { id: "question", lesson: "yes" },
      { id: "refuse", lesson: "terms" },
    ],
  },
  {
    key: "objections",
    lessons: [{ id: "rules" }, { id: "price" }, { id: "site" }, { id: "stop" }],
    quiz: [
      { id: "price", lesson: "price" },
      { id: "stop", lesson: "stop" },
      { id: "kp", lesson: "stop" },
      { id: "site", lesson: "site" },
      { id: "jargon", lesson: "rules" },
      { id: "call", lesson: "stop" },
    ],
  },
  {
    key: "letters",
    lessons: [{ id: "texts" }, { id: "pas", arm: "pain" }, { id: "spin", arm: "question" }, { id: "rival", arm: "rival" }, { id: "ab" }],
    quiz: [
      { id: "pas", lesson: "pas" },
      { id: "rival", lesson: "rival" },
      { id: "words", lesson: "texts" },
      { id: "numbers", lesson: "texts" },
      { id: "ab", lesson: "ab" },
      { id: "spin", lesson: "spin" },
    ],
  },
  {
    key: "warm",
    lessons: [{ id: "queue" }, { id: "take" }, { id: "speed" }, { id: "handover" }],
    quiz: [
      { id: "day", lesson: "queue" },
      { id: "missed", lesson: "queue" },
      { id: "contact", lesson: "take" },
      { id: "transfer", lesson: "handover" },
      { id: "account", lesson: "speed" },
      { id: "release", lesson: "take" },
    ],
  },
];

/**
 * Тест по панели: вопрос → пункт инструкции (раздел + якорь пункта).
 * Человек видит только вопросы о разделах, которые ему открыты (`opens`), а
 * вопрос о пункте не для всех ролей — только тем, кому пункт виден (`roles`).
 */
export type PanelQuestionMeta = {
  id: string;
  href: string;
  item: string;
  roles?: readonly ("admin" | "head" | "manager")[];
};

export const PANEL_QUESTIONS: readonly PanelQuestionMeta[] = [
  { id: "lead-queue", href: "/admin", item: "queue" },
  { id: "lead-reject", href: "/admin", item: "take" },
  { id: "lead-contact", href: "/admin", item: "card" },
  { id: "lead-reminder", href: "/admin", item: "reminders" },
  { id: "lead-transfer", href: "/admin", item: "transfer" },
  { id: "lead-urgent", href: "/admin", item: "urgent" },
  { id: "portion", href: "/admin/prospect", item: "portion" },
  { id: "hello-count", href: "/admin/prospect", item: "hello" },
  { id: "fact-check", href: "/admin/prospect", item: "fact-check" },
  { id: "account-queue", href: "/admin/prospect", item: "queue" },
  { id: "self", href: "/admin/prospect", item: "self" },
  { id: "ignore", href: "/admin/prospect", item: "close" },
  { id: "followups", href: "/admin/prospect", item: "followups" },
  { id: "texts", href: "/admin/prospect", item: "texts" },
  { id: "reply-myself", href: "/admin/prospect", item: "replies" },
  { id: "autopilot", href: "/admin/prospect", item: "autopilot", roles: ["admin", "head"] },
  { id: "mockup-password", href: "/admin/mockups", item: "password" },
  { id: "mockup-closed", href: "/admin/mockups", item: "closed" },
  { id: "project-lead", href: "/admin/projects", item: "create" },
  { id: "project-stage", href: "/admin/projects", item: "stages" },
  { id: "finance-base", href: "/admin/finance", item: "how" },
  { id: "finance-frozen", href: "/admin/finance", item: "freeze" },
  { id: "stats-lost", href: "/admin/stats", item: "tiles" },
  { id: "scout-strong", href: "/admin/scout", item: "strong" },
  { id: "orders-flow", href: "/admin/orders", item: "flow" },
  { id: "help-language", href: "/admin/help", item: "language" },
  { id: "team-plan", href: "/admin/team", item: "plan" },
  { id: "partner-count", href: "/admin/partners", item: "count" },
  { id: "partner-payout", href: "/admin/partners", item: "payout" },
  { id: "accounts-circle", href: "/admin/accounts", item: "circle" },
];

/* ── Текст ───────────────────────────────────────────────────────────────── */

/** Вопрос: первый вариант — верный (см. выше), `why` — объяснение после ошибки. */
export type QuestionCopy = { q: string; options: readonly string[]; why: string };

export type CourseCopy = {
  title: string;
  /** Одна-две фразы под названием в списке курсов. */
  summary: string;
  lessons: Readonly<Record<string, { title: string; paras: readonly string[] }>>;
  quiz: Readonly<Record<string, QuestionCopy>>;
};

export type LearnCopy = {
  courses: Readonly<Record<CourseKey, CourseCopy>>;
  panel: {
    title: string;
    summary: string;
    questions: Readonly<Record<string, QuestionCopy>>;
  };
};

const COPY: Record<PanelLocale, LearnCopy> = { ru, uz, pl };

export function learnCopy(locale: PanelLocale): LearnCopy {
  return COPY[locale] ?? ru;
}

export function courseMeta(key: string): CourseMeta | null {
  return COURSES.find((c) => c.key === key) ?? null;
}
