import {
  COURSES,
  PANEL_QUESTIONS,
  PANEL_QUIZ,
  isLearnKey,
  learnCopy,
  type LearnKey,
  type QuestionCopy,
} from "@/content/learn";
import { helpAnchor } from "@/lib/admin/help";
import type { PanelLocale } from "@/lib/admin/i18n";
import { opens, type Viewer } from "@/lib/admin/roles";
import { isPassed } from "@/lib/learn/rules";

/**
 * Вопросы и проверка ответов — одно и то же для панели и для бота.
 *
 * Чистые функции, без базы: так их проверяет тест, а бот и панель не могут
 * разойтись в том, что считать верным. Верный вариант — всегда первый в
 * тексте (content/learn/index.ts), на экране и в боте варианты перемешаны
 * `optionOrder`.
 */

/** Вопрос, каким его видит конкретный человек. */
export type Question = {
  id: string;
  copy: QuestionCopy;
  /** Курс: урок, к которому отсылает ошибка. */
  lesson?: string;
  /** Тест по панели: пункт инструкции (якорь из helpAnchor). */
  anchor?: string;
};

/**
 * Вопросы теста для этого человека. Курс — всем одинаковый; тест по панели —
 * только о разделах, которые ему открыты, и о пунктах, которые видит его роль.
 */
export function questionsFor(key: LearnKey, viewer: Viewer, locale: PanelLocale): Question[] {
  const copy = learnCopy(locale);
  if (key === PANEL_QUIZ) {
    return PANEL_QUESTIONS.filter((q) => opens(viewer, q.href) && (!q.roles || q.roles.includes(viewer.role))).map((q) => ({
      id: q.id,
      copy: copy.panel.questions[q.id],
      anchor: helpAnchor(q.href, q.item),
    }));
  }
  const course = COURSES.find((c) => c.key === key);
  if (!course) return [];
  return course.quiz.map((q) => ({ id: q.id, copy: copy.courses[course.key].quiz[q.id], lesson: q.lesson }));
}

/** FNV-1a — короткий детерминированный хеш строки. */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/**
 * В каком порядке показывать варианты: перестановка номеров 0..n-1.
 *
 * Детерминированная по id вопроса — сервер и браузер рисуют одно и то же
 * (иначе React ругался бы на расхождение разметки), — но верный ответ не
 * стоит всегда первым. `salt` — номер попытки: пересдача не учит позицию.
 */
export function optionOrder(id: string, n: number, salt = 0): number[] {
  const order = Array.from({ length: n }, (_, i) => i);
  let seed = hash(`${id}:${salt}`) || 1;
  for (let i = n - 1; i > 0; i--) {
    seed = Math.imul(seed ^ (seed >>> 15), 0x2c1b3c6d) >>> 0;
    seed = (seed ^ (seed >>> 12)) >>> 0;
    const j = seed % (i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

/** Верен ли ответ: номер варианта в тексте, верный — 0. */
export const isRight = (chosen: number): boolean => chosen === 0;

export type Graded = {
  score: number;
  total: number;
  passed: boolean;
  /** Ответы, которые засчитаны: id вопроса → номер варианта в тексте. */
  answers: Record<string, number>;
  wrong: string[];
};

/**
 * Проверка всех ответов. Неотвеченный вопрос — неверный: тест не сдают,
 * пропустив трудное. Мусор (не число, чужой вопрос, номер вне вариантов)
 * отбрасывается.
 */
export function grade(questions: readonly Question[], raw: unknown, percent?: number): Graded {
  const given = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const answers: Record<string, number> = {};
  const wrong: string[] = [];
  let score = 0;
  for (const q of questions) {
    const value = given[q.id];
    const chosen = typeof value === "number" && Number.isInteger(value) && value >= 0 && value < q.copy.options.length ? value : null;
    if (chosen !== null) answers[q.id] = chosen;
    if (chosen !== null && isRight(chosen)) score += 1;
    else wrong.push(q.id);
  }
  const total = questions.length;
  return { score, total, passed: isPassed(score, total, percent), answers, wrong };
}

/** Ключ из адреса или формы — только известный. */
export function learnKey(value: unknown): LearnKey | null {
  return isLearnKey(value) ? value : null;
}
