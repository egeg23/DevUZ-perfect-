import type Anthropic from "@anthropic-ai/sdk";

import type { OutsideTopic } from "@/content/outside-topics";
import { anthropic } from "@/lib/model-road";
import {
  PLATFORM,
  allowedLinks,
  caseFacts,
  outsideProblems,
  topicCases,
  type OutsideText,
  type Platform,
} from "@/lib/outside/posts";

/**
 * Черновик статьи на площадку — модель пишет, код проверяет.
 *
 * Модель — недорогая, как у статей сайта (правило владельца, 04.10.2026:
 * «Не используй сильно дорогую модель»): по готовой теме, готовым фактам и
 * готовому списку ссылок. Своя переменная OUTSIDE_MODEL, иначе та же, что
 * у статей о маркетинге.
 *
 * Четыре попытки: первая пишет, остальные правят прошлый черновик только в
 * том, что не прошло проверку. 07.11.2026 все три первых черновика не
 * вышли: Haiku каждый раз писал заново и приносил новые тире на месте
 * исправленных. Последние две правки — Sonnet (OUTSIDE_FIX_MODEL, иначе
 * RAZBOR_MODEL): по правилу владельца модель поднимают, когда на деле видно,
 * что дешёвая не справляется, — и только на правке, три черновика в неделю.
 */

export const OUTSIDE_MODEL = process.env.OUTSIDE_MODEL || process.env.ARTICLE_MODEL || "claude-haiku-4-5";
export const OUTSIDE_FIX_MODEL = process.env.OUTSIDE_FIX_MODEL || process.env.RAZBOR_MODEL || "claude-sonnet-5-5";

/** Модель попытки: 0 и 1 — недорогая, дальше — та, что правит надёжнее. */
export function modelFor(attempt: number): string {
  return attempt < 2 ? OUTSIDE_MODEL : OUTSIDE_FIX_MODEL;
}

export const ATTEMPTS = 4;

const TOOL = {
  name: "draft",
  description: "Черновик статьи для площадки.",
  input_schema: {
    type: "object",
    properties: {
      title: { type: "string", description: "Заголовок с поисковым запросом." },
      body: {
        type: "string",
        description: "Текст: абзацы через пустую строку, подзаголовки «## », пункты «• », ссылки «[текст](адрес)», жирный «**…**».",
      },
    },
    required: ["title", "body"],
  },
} as const;

const SYSTEM = `Ты пишешь статьи от лица DevUz Studio — веб-студии: сайты, интернет-магазины, приложения, ИИ-менеджеры в чате. В штате разработчики, у студии работы для клиентов из разных стран.

Статья выходит на чужой площадке (vc.ru, Дзен или Tenchat), и её читает владелец бизнеса. Цель — полезный текст, после которого человеку захочется посмотреть наши работы. Это не реклама: пользу видно, продажу нет.

Что нельзя ни при каких условиях:
- Придумывать факты, числа, сроки, цены, проценты, отзывы, имена, клиентов и результаты. О наших работах — только то, что сказано в фактах задания, своими словами. Если в фактах «макет» или «прототип» — так и пиши: «собрали макет», а не «запустили сайт» и не «клиент получил заявки».
- Суммы денег и проценты — нигде.
- Обещать результат: «гарантируем», «в N раз больше».
- Упоминать другие студии и агентства, ставить ссылки на чужие сайты.
- Длинное тире (—, –) и тире дефисом с пробелами. Вместо них — двоеточие, запятая, точка или другая фраза.
- Штампы нейросетей: «не просто …, а …», «погрузитесь в мир», «уникальный», «инновационный», «индивидуальный подход», «на новый уровень», «идеальное решение», «в самом сердце», «ключ к успеху», значки ✨🚀.

Как сдавать — инструментом draft:
- title — заголовок с поисковым запросом из задания, лучше ближе к началу, по-человечески, без кликбейта.
- body — текст. Абзацы через пустую строку. Подзаголовок — строка, которая начинается с «## ». Пункт списка — строка, которая начинается с «• » (не с дефиса). Ссылка — «[текст](адрес)», только на адреса из задания. В тексте ссылки обязательно название: «[DevUz Studio](адрес)», «[кейс SamAuto](адрес)», «[работы DevUz Studio](адрес)»; «[этот проект](адрес)» или поисковая фраза в ссылке не пройдут. Жирный — «**…**», редко.
- Тире: ни «—», ни «–», ни дефиса с пробелами вокруг. «Главная услуга там — All-on-6» пиши «Главная услуга там: All-on-6»; «X — это Y» пиши «X это Y» или «X: Y».
- Первый абзац начинается с мысли, где уже есть поисковый запрос, теми же словами.
- Поисковый запрос стоит в заголовке и в первом абзаце, дальше 1–2 раза, без повторов ради повторов.

Тон: спокойный, конкретный, от первого лица студии («мы»), без восклицательных знаков и канцелярита.`;

export function draftPrompt(
  topic: OutsideTopic,
  platform: Platform,
  {
    related = [],
    notes = [],
    previous = null,
  }: { related?: readonly string[]; notes?: readonly string[]; previous?: OutsideText | null } = {},
): string {
  const spec = PLATFORM[platform];
  const lines = [
    `Площадка: ${spec.name}.`,
    spec.style,
    `Длина текста: от ${spec.target[0]} до ${spec.target[1]} знаков (никогда не меньше ${spec.min} и не больше ${spec.max}). Заголовок: до ${spec.titleMax} знаков.${
      spec.headings[1] ? ` Подзаголовков «## »: от ${spec.headings[0]} до ${spec.headings[1]}.` : " Подзаголовков нет."
    }`,
    "",
    `Тема: ${topic.brief}`,
    `Поисковый запрос: «${topic.query}».`,
  ];
  if (related.length) {
    lines.push(
      "",
      `С этим запросом в России ищут ещё (Вордстат и Google Trends): ${related.map((r) => `«${r}»`).join(", ")}. Возьми 2–3 подходящих по смыслу и вставь естественно. Чужие по теме пропусти.`,
    );
  }
  const cases = topicCases(topic);
  if (cases.length) {
    lines.push("", "Факты о наших работах — единственное, что ты о них знаешь:");
    for (const c of cases) lines.push(...caseFacts(c).map((f) => `- ${f}`));
  } else {
    lines.push("", "Своих работ в этой статье не называй: фактов о них в задании нет. Пиши из опыта и здравого смысла, без статистики.");
  }
  lines.push(
    "",
    `Ссылки — от 1 до ${spec.links}, только эти адреса:`,
    ...allowedLinks(topic).map((l) => `- ${l.url} (${l.about})`),
  );
  if (previous && notes.length) {
    lines.push(
      "",
      "Черновик уже написан, но не прошёл проверку:",
      ...notes.map((n) => `- ${n}`),
      "",
      "Исправь только это, остальное оставь слово в слово. Сдай черновик целиком тем же инструментом.",
      `Заголовок: ${previous.title}`,
      "Текст:",
      previous.body,
    );
  } else if (notes.length) {
    lines.push("", "Прошлая попытка не прошла проверку:", ...notes.map((n) => `- ${n}`), "Напиши заново, исправив это.");
  }
  return lines.join("\n");
}

function parseDraft(input: unknown): OutsideText | null {
  const d = (input ?? {}) as { title?: unknown; body?: unknown };
  if (typeof d.title !== "string" || typeof d.body !== "string") return null;
  const title = d.title.replace(/\s+/g, " ").trim();
  const body = d.body.replace(/\r/g, "").trim();
  return title && body ? { title, body } : null;
}

/** Одна попытка: черновик или претензии к нему. */
async function attempt(
  model: string,
  topic: OutsideTopic,
  platform: Platform,
  related: readonly string[],
  notes: readonly string[],
  previous: OutsideText | null,
): Promise<OutsideText | { problems: string[]; text?: OutsideText }> {
  const message = await anthropic("outside-post").messages.create({
    model,
    max_tokens: 8000,
    system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
    tools: [TOOL as unknown as Anthropic.Tool],
    tool_choice: { type: "tool", name: TOOL.name },
    messages: [{ role: "user", content: draftPrompt(topic, platform, { related, notes, previous }) }],
  });
  if (message.stop_reason === "max_tokens") return { problems: ["Текст обрезан по лимиту длины: пиши короче."] };
  const use = message.content.find((block) => block.type === "tool_use");
  if (!use || use.type !== "tool_use") return { problems: [`Модель не сдала черновик (stop_reason: ${message.stop_reason}).`] };
  const text = parseDraft(use.input);
  if (!text) return { problems: ["Нет заголовка или текста."] };
  const problems = outsideProblems(topic, platform, text);
  return problems.length ? { problems, text } : text;
}

/** Пишет, потом правит прошлый черновик по замечаниям. Строка — почему черновика нет. */
export async function writeDraft(topic: OutsideTopic, platform: Platform, related: readonly string[]): Promise<OutsideText | string> {
  let notes: string[] = [];
  let previous: OutsideText | null = null;
  for (let i = 0; i < ATTEMPTS; i += 1) {
    const result = await attempt(modelFor(i), topic, platform, related, notes, previous);
    if (!("problems" in result)) return result;
    notes = result.problems;
    // Править есть что — только если черновик пришёл; иначе следующий пишет заново.
    if (result.text) previous = result.text;
  }
  return notes.join(" ");
}
