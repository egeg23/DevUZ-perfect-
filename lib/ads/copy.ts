import type { AdCopy, Platform } from "@/lib/ads/types";
import { aiMarkers, dashSpots } from "@/lib/proto/plain-text";

/**
 * Проверка текста объявления — до того, как он уйдёт в кабинет.
 *
 * Три вещи, и все — кодом, а не просьбой к модели:
 * - длина: площадка отклонит лишний знак, и тест не начнётся;
 * - тире и штампы ИИ — те же, что в макетах (lib/proto/plain-text.ts):
 *   владелец бизнеса узнаёт текст модели за секунду, покупатель тоже;
 * - запрещённые обещания: «гарантия», «100%», «лучший», «№1» и прочее, за
 *   что модерация Директа и Google отклоняет объявление (превосходная
 *   степень без подтверждения, обещание результата лечения, «бесплатно»,
 *   которого нет в предложении).
 */

/** Директ, текстово-графическое объявление: заголовок 56, второй 30, текст 81. */
export const YANDEX_LIMITS = { headlines: [56, 30], description: 81 };
/** Google, адаптивное объявление: заголовки по 30 (3–15 штук), описания по 90 (2–4). */
export const GOOGLE_LIMITS = { headline: 30, description: 90, minHeadlines: 3, maxHeadlines: 15, minDescriptions: 2, maxDescriptions: 4 };

export const FORBIDDEN_PROMISES: readonly { re: RegExp; say: string }[] = [
  { re: /гаранти\p{L}*|kafolat\p{L}*/iu, say: "гарантия" },
  { re: /100\s?%/u, say: "«100%»" },
  { re: /лучш\p{L}*|самы\p{L}*\s+(?:дешев|лучш|надёжн|надежн)|eng\s+yaxshi/iu, say: "превосходная степень" },
  { re: /№\s?1|номер\s+один|#1\b|1-?о?е?\s+место/iu, say: "«№1»" },
  { re: /вылеч\p{L}*|излеч\p{L}*|davola(?:ymiz|nadi)/iu, say: "обещание вылечить" },
  { re: /бесплатн\p{L}*|bepul/iu, say: "«бесплатно»" },
  { re: /[!]{2,}|[A-ZА-ЯЁ]{6,}/u, say: "крик: «!!» или слово заглавными" },
];

export type CopyProblem = { field: string; text: string };

export function copyProblems(copy: AdCopy, platform: Platform, allowFree = false): CopyProblem[] {
  const out: CopyProblem[] = [];
  const all = [...copy.headlines, ...copy.descriptions];

  if (platform === "google") {
    if (copy.headlines.length < GOOGLE_LIMITS.minHeadlines || copy.headlines.length > GOOGLE_LIMITS.maxHeadlines) {
      out.push({ field: "headlines", text: `Заголовков ${copy.headlines.length}, нужно от 3 до 15.` });
    }
    if (copy.descriptions.length < GOOGLE_LIMITS.minDescriptions || copy.descriptions.length > GOOGLE_LIMITS.maxDescriptions) {
      out.push({ field: "descriptions", text: `Описаний ${copy.descriptions.length}, нужно от 2 до 4.` });
    }
    copy.headlines.forEach((h, i) => {
      if (h.length > GOOGLE_LIMITS.headline) out.push({ field: `headline${i + 1}`, text: `Заголовок ${i + 1}: ${h.length} знаков, можно 30.` });
    });
    copy.descriptions.forEach((d, i) => {
      if (d.length > GOOGLE_LIMITS.description) out.push({ field: `description${i + 1}`, text: `Описание ${i + 1}: ${d.length} знаков, можно 90.` });
    });
  } else {
    if (copy.headlines.length !== 2 || copy.descriptions.length !== 1) {
      out.push({ field: "shape", text: "В Директе — два заголовка и один текст." });
    }
    copy.headlines.forEach((h, i) => {
      const max = YANDEX_LIMITS.headlines[i] ?? 0;
      if (h.length > max) out.push({ field: `headline${i + 1}`, text: `Заголовок ${i + 1}: ${h.length} знаков, можно ${max}.` });
    });
    copy.descriptions.forEach((d) => {
      if (d.length > YANDEX_LIMITS.description) out.push({ field: "description", text: `Текст: ${d.length} знаков, можно 81.` });
    });
  }

  if (all.some((s) => !s.trim())) out.push({ field: "empty", text: "Пустая строка в объявлении." });
  if (!/^https:\/\//.test(copy.url)) out.push({ field: "url", text: "Ссылка должна начинаться с https://." });

  const text = all.join("\n");
  const dashes = dashSpots(text);
  if (dashes.length) out.push({ field: "dash", text: `Длинное тире: ${dashes.map((s) => `«${s}»`).join(", ")}.` });
  for (const say of aiMarkers(text)) out.push({ field: "ai", text: `Штамп ИИ: ${say}.` });
  for (const rule of FORBIDDEN_PROMISES) {
    if (allowFree && rule.say === "«бесплатно»") continue;
    if (rule.re.test(text)) out.push({ field: "promise", text: `Запрещённое обещание: ${rule.say}.` });
  }
  return out;
}
