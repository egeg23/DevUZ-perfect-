import type { MarketingTopic } from "@/content/marketing-topics";
import type { ArticleLocale, ArticleText } from "@/lib/marketing/articles-store";

/**
 * Проверка статьи кодом — до публикации, без человека.
 *
 * Статья выходит сама, поэтому всё, за что студии было бы стыдно, ловится
 * здесь: придуманная цифра, чужое имя, русский текст на узбекской странице,
 * огрызок вместо статьи. Провал возвращается модели её же словами — одна
 * повторная попытка, и если опять не вышло, статьи в этот раз не будет.
 *
 * Числа. В кейсе каждое число должно стоять в фактах темы (или в её
 * заголовке): «около 12 000 заказов» — можно, «продажи выросли в 3 раза» —
 * нет, такого факта у нас нет. В ошибках и нишах фактов нет вовсе, и
 * пропускаются только мелкие числа из советов («3–5 креативов», «за
 * 15 минут»): ни процентов, ни сумм, ни годов.
 */

export type CheckProblem = { locale: ArticleLocale | "both"; text: string };

const CYRILLIC = /[Ѐ-ӿ]/;
const MONEY = /(\$\s*\d|\d\s*(\$|€|₽|сум|so[‘'’`ʻ]?m|руб|доллар|dollar|млн\s*(сум|so)|mln\s*so))/i;
const FORBIDDEN = [/the\s+agency/i, /https?:\/\//i, /www\./i];

/** Числа текста как строки цифр: «12 000» → «12000», «1,5» → «15». */
export function numbersIn(text: string): string[] {
  return (text.match(/\d(?:[\d   ,.]*\d)?/g) ?? []).map((n) => n.replace(/\D/g, ""));
}

function allText(article: ArticleText): string {
  return [article.title, article.description, ...article.paragraphs, ...article.tips].join("\n");
}

function length(what: string, value: string, min: number, max: number): string | null {
  const n = value.length;
  if (n < min) return `${what} слишком короткий (${n} знаков, нужно от ${min})`;
  if (n > max) return `${what} слишком длинный (${n} знаков, нужно до ${max})`;
  return null;
}

export function checkArticle(topic: MarketingTopic, locale: ArticleLocale, article: ArticleText): CheckProblem[] {
  const problems: string[] = [];
  const text = allText(article);
  const body = article.paragraphs.join("\n");

  for (const p of [
    length("Заголовок", article.title, 25, 110),
    length("Описание", article.description, 70, 200),
    length("Текст статьи", body, 900, 4200),
  ]) {
    if (p) problems.push(p);
  }
  if (article.paragraphs.length < 3 || article.paragraphs.length > 8) {
    problems.push(`Абзацев ${article.paragraphs.length}, нужно от 3 до 8.`);
  }
  if (article.tips.length < 3 || article.tips.length > 5) {
    problems.push(`Советов ${article.tips.length}, нужно от 3 до 5.`);
  }
  if (article.tips.some((tip) => tip.length > 260)) problems.push("Совет длиннее 260 знаков.");

  if (locale === "uz" && CYRILLIC.test(text)) {
    problems.push("В узбекском тексте есть кириллица — только латиница.");
  }
  if (locale === "ru" && !CYRILLIC.test(article.title)) {
    problems.push("Русский заголовок без русских слов.");
  }
  for (const pattern of FORBIDDEN) {
    if (pattern.test(text)) problems.push(`Недопустимое в тексте: ${pattern.source}.`);
  }

  if (topic.kind === "case") {
    const allowed = new Set(numbersIn([topic.brief, ...(topic.facts ?? [])].join("\n")));
    const extra = [...new Set(numbersIn(text))].filter((n) => !allowed.has(n));
    if (extra.length) {
      problems.push(`Числа, которых нет в фактах темы: ${extra.join(", ")}. Пиши только числа из фактов.`);
    }
  } else {
    if (text.includes("%")) problems.push("Проценты запрещены: фактов и исследований у темы нет.");
    if (MONEY.test(text)) problems.push("Суммы денег запрещены.");
    const big = numbersIn(text).filter((n) => n.length >= 3);
    if (big.length) problems.push(`Большие числа и годы запрещены: ${[...new Set(big)].join(", ")}.`);
  }

  return problems.map((t) => ({ locale, text: t }));
}
