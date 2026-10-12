import { COURSES, PANEL_QUIZ, learnCopy, type LearnKey } from "@/content/learn";
import { esc, type Button } from "@/lib/qualify/telegram";
import { isRight, learnKey, optionOrder, type Question } from "@/lib/learn/quiz";
import { PASS_PERCENT, percentOf } from "@/lib/learn/rules";

/**
 * «Обучение» в Telegram-боте студии: те же курсы и тесты, что в панели.
 *
 * Владелец, 12.10.2026: «Тесты делаем интерактивные с возможностью пройти
 * в телеграм боте». Бот пишет по-русски, пока не научен языку панели
 * (CLAUDE.md), — поэтому и вопросы здесь русские.
 *
 * Состояния в базе нет: ответы едут в самой кнопке. `lr:a:<тест>:<цифры>` —
 * номер выбранного варианта (как в тексте, верный — 0) по каждому вопросу
 * от первого до текущего. Тридцать вопросов теста по панели — 30 цифр, с
 * запасом под предел Telegram в 64 байта. После нажатия кнопки под вопросом
 * снимаются, и ответ не засчитать дважды.
 *
 * Здесь только чистые функции; поход в базу и в Telegram — в обработчике
 * webhook (app/api/telegram/webhook/route.ts).
 */

export const LEARN_CALLBACK = "lr";

/** /learn, «Обучение», «🎓 Обучение» — открыть список тестов. */
export function learnCommand(text: string | null | undefined): boolean {
  const plain = (text ?? "")
    .trim()
    .replace(/^[^\p{L}/]+/u, "")
    .trim()
    .toLowerCase();
  if (!plain) return false;
  return plain === "обучение" || plain.split(/[\s@]/)[0] === "/learn";
}

export type LearnCallback = { kind: "start"; key: LearnKey } | { kind: "answer"; key: LearnKey; answers: number[] };

/** Разбор кнопки. Мусор — null: кнопку можно подделать, а Telegram — нет. */
export function parseLearnCallback(parts: readonly string[]): LearnCallback | null {
  if (parts[0] !== LEARN_CALLBACK) return null;
  const key = learnKey(parts[2]);
  if (!key) return null;
  if (parts[1] === "s" && parts.length === 3) return { kind: "start", key };
  if (parts[1] === "a" && parts.length === 4 && /^\d{1,40}$/.test(parts[3])) {
    return { kind: "answer", key, answers: [...parts[3]].map(Number) };
  }
  return null;
}

/** Ответы из кнопки сходятся с вопросами: не больше вопросов, номера в пределах вариантов. */
export function answersFit(questions: readonly Question[], answers: readonly number[]): boolean {
  if (!answers.length || answers.length > questions.length) return false;
  return answers.every((a, i) => a < questions[i].copy.options.length);
}

const ru = () => learnCopy("ru");

export const LEARN_OFF_TEXT = "Обучение пока не включено. Когда его включат, команда /learn откроет курсы и тесты.";
export const LEARN_STALE_TEXT = "Этот вопрос уже не тот — откройте /learn и начните тест заново.";

/** Список тестов: курсы по продажам и тест по панели. */
export function menuMessage(siteUrl: string): { text: string; rows: Button[][] } {
  const copy = ru();
  const rows: Button[][] = COURSES.map((c) => [{ text: copy.courses[c.key].title, callback_data: `${LEARN_CALLBACK}:s:${c.key}` }]);
  rows.push([{ text: copy.panel.title, callback_data: `${LEARN_CALLBACK}:s:${PANEL_QUIZ}` }]);
  const text = [
    "<b>🎓 Обучение</b>",
    "",
    `Выберите тест. Сдано — от ${PASS_PERCENT}% верных ответов, засчитывается лучший результат. Уроки к курсам — в панели: ${esc(`${siteUrl}/admin/learn`)}`,
  ].join("\n");
  return { text, rows };
}

export function testTitle(key: LearnKey): string {
  const copy = ru();
  return key === PANEL_QUIZ ? copy.panel.title : copy.courses[key].title;
}

/** Вопрос номер `index` (с нуля): текст с вариантами и кнопки с их номерами. */
export function questionMessage(
  key: LearnKey,
  questions: readonly Question[],
  index: number,
  answers: readonly number[],
): { text: string; rows: Button[][] } {
  const q = questions[index];
  const order = optionOrder(q.id, q.copy.options.length);
  const lines = order.map((orig, shown) => `${shown + 1}) ${esc(q.copy.options[orig])}`);
  const done = answers.join("");
  const text = [
    `<b>${esc(testTitle(key))}</b> · вопрос ${index + 1} из ${questions.length}`,
    "",
    `<b>${esc(q.copy.q)}</b>`,
    "",
    ...lines,
  ].join("\n");
  const rows: Button[][] = [
    order.map((orig, shown) => ({ text: String(shown + 1), callback_data: `${LEARN_CALLBACK}:a:${key}:${done}${orig}` })),
  ];
  return { text, rows };
}

/** Что написать под отвеченным вопросом: верно, или верный ответ, почему и куда читать. */
export function feedbackText(q: Question, chosen: number, siteUrl: string): string {
  if (isRight(chosen)) return `✅ Верно. ${esc(q.copy.why)}`;
  const lines = [`❌ Неверно. Верный ответ: ${esc(q.copy.options[0])}`, esc(q.copy.why)];
  if (q.anchor) lines.push(`Прочитать: ${esc(`${siteUrl}/admin/help#${q.anchor}`)}`);
  return lines.join("\n");
}

/** Итог теста. */
export function resultText(score: number, total: number, passed: boolean, saved: boolean): string {
  const head = `<b>Результат: ${score} из ${total} (${percentOf(score, total)}%)</b>`;
  const verdict = passed
    ? "Тест сдан."
    : `Тест не сдан: нужно от ${PASS_PERCENT}% верных ответов. Перечитайте уроки в панели и пройдите ещё раз — /learn.`;
  const note = saved ? "" : "\nРезультат не сохранился — база не ответила. Пройдите тест ещё раз чуть позже.";
  return `${head}\n${verdict}${note}`;
}

/** Ответы из кнопки — в то, что пишется в базу: id вопроса → номер варианта. */
export function answersById(questions: readonly Question[], answers: readonly number[]): Record<string, number> {
  const out: Record<string, number> = {};
  answers.forEach((a, i) => {
    if (questions[i]) out[questions[i].id] = a;
  });
  return out;
}
