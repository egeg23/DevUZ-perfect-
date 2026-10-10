import { findSelfTalk } from "@/lib/qualify/self-talk";

/**
 * Проверка ответа ИИ перед отправкой покупателю.
 *
 * Самый дорогой промах ИИ-продавца — выдуманная цена: покупатель придёт с
 * ней в магазин, и спорить будет уже человек клиента. Поэтому каждое число
 * в ответе должно быть в базе знаний клиента или в словах самого
 * покупателя. Тот же приём держит письма касаний студии
 * (inventedNumbers в lib/admin/outreach.ts); здесь своя версия — цены
 * пишут то «150 000», то «150000», то «150.000», и сравнивать их надо как
 * одно число.
 *
 * Вторая проверка — имя поставщика модели и оправдания за «чужую»
 * начинку: та же, что у ассистента студии (lib/qualify/self-talk.ts).
 */

/** Сколько знаков ответа: в мессенджере длинное не читают. */
export const MAX_REPLY_CHARS = 1200;

/** Число без разделителей тысяч и с точкой вместо запятой: «150 000» → «150000». */
function numbersIn(text: string): string[] {
  const found = text.match(/\d{1,3}(?:[   .,]\d{3})+(?![\d])|\d+(?:[.,]\d+)?/g) ?? [];
  return found.map((raw) => {
    if (/^\d{1,3}(?:[   .,]\d{3})+$/.test(raw)) return raw.replace(/[   .,]/g, "");
    return raw.replace(",", ".");
  });
}

/**
 * Мелкие числа без денег и процентов — «2 варианта», «через 5 минут» — не
 * факт о компании, и требовать их в базе значит отбивать обычную речь.
 * Но «5%» и «10 сум» — уже обещание, оно проверяется как любое.
 */
const MONEY_AFTER = /^\s*(?:%|сум|so['‘ʻ’]?m|sum|\$|usd|у\.?е|долл|тыс|ming|mln|млн)/i;

/** Телефон целиком: «+998 90 123-45-67» и «+998901234567» — один номер. */
const PHONE = /\+?\d[\d\s()-]{6,}\d/g;
const digits = (text: string) => text.replace(/\D/g, "");

export function inventedNumbers(reply: string, facts: string): string[] {
  const allowed = new Set(numbersIn(facts));
  // Телефон из базы, записанный в ответе иначе, — тот же телефон: убираем
  // его до разбора на числа. Чужой телефон остаётся и попадётся ниже.
  const phones = new Set((facts.match(PHONE) ?? []).map((p) => digits(p).slice(-9)).filter((d) => d.length >= 7));
  reply = reply.replace(PHONE, (m) => (phones.has(digits(m).slice(-9)) ? " " : m));
  const out: string[] = [];
  const re = /\d{1,3}(?:[   .,]\d{3})+(?![\d])|\d+(?:[.,]\d+)?/g;
  for (const match of reply.matchAll(re)) {
    const raw = match[0];
    const [norm] = numbersIn(raw);
    if (allowed.has(norm)) continue;
    const after = reply.slice((match.index ?? 0) + raw.length, (match.index ?? 0) + raw.length + 8);
    const small = Number(norm) <= 10 && !norm.includes(".");
    if (small && !MONEY_AFTER.test(after)) continue;
    out.push(raw);
  }
  return [...new Set(out)];
}

export type ReplyProblem = { code: "empty" | "invented" | "self_talk"; text: string };

export function replyProblems(reply: string, facts: string): ReplyProblem[] {
  const body = reply.trim();
  if (!body) return [{ code: "empty", text: "пустой ответ" }];
  const problems: ReplyProblem[] = [];
  const invented = inventedNumbers(body, facts);
  if (invented.length) {
    problems.push({
      code: "invented",
      text: `в ответе числа, которых нет ни в базе знаний, ни в словах покупателя: ${invented.join(", ")}`,
    });
  }
  const self = findSelfTalk(body);
  if (self) problems.push({ code: "self_talk", text: `о себе лишнее (${self.what})` });
  return problems;
}

/**
 * Причесать ответ под мессенджер: без разметки, которую Telegram покажет
 * звёздочками, и без длинных тире — по ним владелец бизнеса за секунду
 * узнаёт текст модели (то же правило, что для макетов студии).
 */
export function tidyReply(reply: string): string {
  let text = reply
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\s+[—–]\s+/g, ", ")
    .replace(/[—–]/g, "-")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (text.length > MAX_REPLY_CHARS) {
    const cut = text.slice(0, MAX_REPLY_CHARS);
    const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "), cut.lastIndexOf("\n"));
    text = (end > MAX_REPLY_CHARS / 2 ? cut.slice(0, end + 1) : cut).trim();
  }
  return text;
}
