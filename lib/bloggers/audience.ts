import type Anthropic from "@anthropic-ai/sdk";

import { BLOGGER_SITE } from "@/lib/bloggers/judge";
import { anthropic } from "@/lib/model-road";
import { effortFor } from "@/lib/model-limits";

/**
 * Аудитория блогера по скриншотам его статистики Instagram: города, возраст,
 * охваты. Видит их только сам блогер, поэтому агент просит прислать.
 *
 * Читает картинки недорогая модель с картинками (BLOGGER_VISION_MODEL, по
 * умолчанию Haiku) — переписать цифры со скриншота, а не рассуждать.
 * Владелец: «не используй сильно дорогую модель». Не справится — поднять
 * переменной до Sonnet, код не трогая. Балл считает код (`audienceScore`).
 *
 * Сами скриншоты не храним: в базе остаётся только вывод (bloggers.audience).
 */

export const VISION_MODEL = process.env.BLOGGER_VISION_MODEL || "claude-haiku-4-5";
/** Больше — не картинка статистики, а что-то другое; и модель такое не примет. */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_IMAGES = 4;

export type Image = { mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif"; data: string };

export type Audience = {
  readable: boolean;
  uzbekistanShare: number | null;
  tashkentShare: number | null;
  topCities: { city: string; share: number }[];
  age25to44Share: number | null;
  femaleShare: number | null;
  reach30d: number | null;
  followers: number | null;
  notes: string;
};

const share = { type: ["number", "null"], minimum: 0, maximum: 100 } as const;

const TOOL = {
  name: "record_stats",
  description: "Записать цифры со скриншотов статистики Instagram.",
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["readable", "uzbekistan_share", "tashkent_share", "top_cities", "age_25_44_share", "female_share", "reach_30d", "followers", "notes"],
    properties: {
      readable: { type: "boolean", description: "На картинках правда статистика аккаунта Instagram и цифры читаются." },
      uzbekistan_share: { ...share, description: "Доля аудитории из Узбекистана, %. Нет на скриншоте — null." },
      tashkent_share: { ...share, description: "Доля из Ташкента, %. Нет — null." },
      top_cities: {
        type: "array",
        maxItems: 5,
        items: { type: "object", additionalProperties: false, required: ["city", "share"], properties: { city: { type: "string" }, share: { type: "number" } } },
      },
      age_25_44_share: { ...share, description: "Сумма долей возрастов 25-34 и 35-44, %. Нет — null." },
      female_share: { ...share, description: "Доля женщин, %. Нет — null." },
      reach_30d: { type: ["integer", "null"], description: "Охваченные аккаунты за 30 дней (или за период на скриншоте). Нет — null." },
      followers: { type: ["integer", "null"], description: "Подписчики на скриншоте. Нет — null." },
      notes: { type: "string", description: "Одна фраза по-русски: что видно и за какой период." },
    },
  },
} as const;

const SYSTEM = `Тебе присылают скриншоты статистики Instagram блогера (раздел «Статистика» / «Аудитория» / «Охват»). Перепиши цифры, которые на них видны, в record_stats.
- Только то, что написано на картинках. Не считай и не угадывай: нет цифры — null.
- Доли — в процентах, как на экране. Тысячи («12,4 тыс.», «12.4K») переводи в целые числа.
- Если на картинках не статистика Instagram или цифры не читаются — readable: false.`;

const num = (v: unknown, max = Number.POSITIVE_INFINITY) => (typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= max ? v : null);

export function audienceFrom(input: Record<string, unknown>): Audience {
  const cities = Array.isArray(input.top_cities) ? (input.top_cities as Array<Record<string, unknown>>) : [];
  return {
    readable: input.readable === true,
    uzbekistanShare: num(input.uzbekistan_share, 100),
    tashkentShare: num(input.tashkent_share, 100),
    topCities: cities
      .map((c) => ({ city: String(c?.city ?? "").trim().slice(0, 40), share: num(c?.share, 100) ?? 0 }))
      .filter((c) => c.city)
      .slice(0, 5),
    age25to44Share: num(input.age_25_44_share, 100),
    femaleShare: num(input.female_share, 100),
    reach30d: num(input.reach_30d) === null ? null : Math.round(Number(input.reach_30d)),
    followers: num(input.followers) === null ? null : Math.round(Number(input.followers)),
    notes: typeof input.notes === "string" ? input.notes.trim().slice(0, 300) : "",
  };
}

/** Узбекистан: доля из страны или, если её нет, сумма узбекских городов. */
const UZ_CITIES = /ташкент|toshkent|tashkent|самарканд|samarqand|samarkand|бухар|buxoro|bukhara|андижан|andijon|наманган|namangan|фергана|farg|ferg|нукус|nukus|карши|qarshi|навои|navoiy|джизак|jizzax|термез|termiz|ургенч|urganch|чирчик|chirchiq/i;

export function uzbekShare(a: Audience): number | null {
  if (a.uzbekistanShare !== null) return a.uzbekistanShare;
  const cities = a.topCities.filter((c) => UZ_CITIES.test(c.city));
  return cities.length ? Math.min(100, cities.reduce((s, c) => s + c.share, 0)) : null;
}

/**
 * Балл аудитории 0–100: откуда (40), возраст покупателей сайтов 25–44 (30),
 * охват к подписчикам (30) — живые ли подписчики. Не читается — null.
 */
export function audienceScore(a: Audience, knownFollowers: number | null): { score: number | null; notes: string[] } {
  if (!a.readable) return { score: null, notes: ["скриншоты не читаются или это не статистика"] };
  const notes: string[] = [];
  let score = 0;

  const uz = uzbekShare(a);
  if (uz === null) {
    score += 15;
    notes.push("откуда аудитория — не видно");
  } else {
    score += uz >= 70 ? 40 : uz >= 50 ? 30 : uz >= 30 ? 15 : 0;
    notes.push(`из Узбекистана ${Math.round(uz)}%`);
  }

  const age = a.age25to44Share;
  if (age === null) {
    score += 12;
    notes.push("возраст не виден");
  } else {
    score += age >= 50 ? 30 : age >= 35 ? 20 : age >= 20 ? 10 : 3;
    notes.push(`25–44 лет ${Math.round(age)}%`);
  }

  const followers = a.followers ?? knownFollowers;
  if (a.reach30d === null || !followers) {
    score += 12;
    notes.push("охват не виден");
  } else {
    const ratio = a.reach30d / followers;
    score += ratio >= 0.5 ? 30 : ratio >= 0.25 ? 22 : ratio >= 0.1 ? 12 : 4;
    notes.push(`охват за период — ${Math.round(ratio * 100)}% от подписчиков`);
  }
  return { score: Math.max(0, Math.min(100, score)), notes };
}

export async function readStats(
  images: readonly Image[],
  call: (p: Anthropic.Beta.MessageCreateParamsNonStreaming) => Promise<Anthropic.Beta.BetaMessage> = (p) =>
    anthropic(BLOGGER_SITE).beta.messages.create(p),
): Promise<Audience> {
  const content: Anthropic.Beta.BetaContentBlockParam[] = [
    ...images.slice(0, MAX_IMAGES).map((img) => ({ type: "image" as const, source: { type: "base64" as const, media_type: img.mediaType, data: img.data } })),
    { type: "text", text: "Скриншоты статистики блогера." },
  ];
  const response = await call({
    model: VISION_MODEL,
    max_tokens: 800,
    system: SYSTEM,
    tools: [TOOL as unknown as Anthropic.Beta.BetaToolUnion],
    tool_choice: { type: "tool", name: TOOL.name },
    messages: [{ role: "user", content }],
    ...effortFor(VISION_MODEL, "low"),
  });
  const block = response.content.find((b) => b.type === "tool_use");
  return audienceFrom((block && block.type === "tool_use" ? block.input : {}) as Record<string, unknown>);
}

/** Тип картинки по первым байтам: заголовок ответа CDN бывает любым. */
export function imageType(bytes: Uint8Array): Image["mediaType"] | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50) return "image/png";
  if (bytes[0] === 0x47 && bytes[1] === 0x49) return "image/gif";
  if (bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return "image/webp";
  return null;
}

/** Скачать картинку из вложения Direct (ссылка CDN Instagram живёт недолго — сразу). */
export async function fetchImage(url: string, fetchImpl: typeof fetch = fetch): Promise<Image | null> {
  try {
    if (!/^https:\/\//.test(url)) return null;
    const response = await fetchImpl(url, { signal: AbortSignal.timeout(20_000), cache: "no-store" });
    if (!response.ok) return null;
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.length > MAX_IMAGE_BYTES) return null;
    const mediaType = imageType(bytes);
    return mediaType ? { mediaType, data: Buffer.from(bytes).toString("base64") } : null;
  } catch {
    return null;
  }
}
