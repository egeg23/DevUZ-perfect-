import type Anthropic from "@anthropic-ai/sdk";

import { inventedNumbers } from "@/lib/ai-staff/checks";
import { IMPORT_MODEL, usageSite } from "@/lib/ai-staff/plans";
import { KNOWLEDGE_KINDS, isKnowledgeKind, type KnowledgeItem } from "@/lib/ai-staff/prompt";
import { crawl, decodeEntities, probe } from "@/lib/audit/fetch";
import { visibleText } from "@/lib/audit/visible";
import { anthropic } from "@/lib/model-road";
import { effortFor } from "@/lib/model-limits";

/**
 * База знаний с сайта клиента — «обучение за минуты», как у Chatbase и Fin.
 *
 * Сайт открывает тот же обход, что и аудит студии (lib/audit/fetch.ts):
 * своя дорога мимо прокси, проверка адреса на каждом редиректе (чужой сайт
 * не уведёт сервер во внутреннюю сеть), потолки по времени и размеру.
 * Главная и до четырёх страниц с ценами, услугами, доставкой, контактами.
 *
 * Раскладывает текст недорогая модель (Haiku): работа — разложить, а не
 * написать. И проверка та же, что у ответов покупателю: пункт с числом,
 * которого нет на сайте, выбрасывается — цена в базе знаний должна быть
 * ценой с сайта, а не догадкой.
 *
 * Запускается только нажатием клиента в кабинете: на боевом сервере это
 * несколько запросов страниц и один вызов модели, не обход по расписанию.
 */

const WANTED = /price|prais|narx|цен|прайс|услуг|xizmat|servic|catalog|каталог|katalog|deliver|достав|yetkaz|contact|контакт|aloqa|about|о-нас|o-nas|biz-haqimizda|kompaniya|компани|faq|вопрос|savol|oplat|оплат|tolov/i;

export function pickPages(links: readonly string[]): string[] {
  return links.filter((href) => WANTED.test(decodeURIComponent(href))).slice(0, 4);
}

/** Видимый текст страницы без лишних пробелов. */
export function pageText(html: string): string {
  return decodeEntities(visibleText(html)).replace(/[ \t ]+/g, " ").replace(/\s*\n\s*/g, "\n").replace(/\n{2,}/g, "\n").trim();
}

const MAX_SOURCE_CHARS = 40_000;

export async function readSite(url: string): Promise<{ text: string; pages: string[] }> {
  const home = await probe(url);
  if (home.status >= 400) throw new Error(`site_status_${home.status}`);
  const more = await crawl(home, pickPages);
  const pages = [{ url: home.finalUrl, html: home.html }, ...more.pages.filter((p) => p.status < 400)];
  const parts: string[] = [];
  let size = 0;
  for (const page of pages) {
    const text = pageText(page.html).slice(0, 15_000);
    if (!text) continue;
    parts.push(`### ${page.url}\n${text}`);
    size += text.length;
    if (size > MAX_SOURCE_CHARS) break;
  }
  return { text: parts.join("\n\n").slice(0, MAX_SOURCE_CHARS), pages: pages.map((p) => p.url) };
}

const TOOL = {
  name: "save_knowledge",
  description: "Сохранить базу знаний компании, разложенную по пунктам.",
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["company", "niche", "items"],
    properties: {
      company: { type: "string", description: "Название компании, как на сайте." },
      niche: { type: "string", description: "Чем занимается, 2-5 слов по-русски." },
      items: {
        type: "array",
        maxItems: 40,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["kind", "title", "body"],
          properties: {
            kind: { type: "string", enum: KNOWLEDGE_KINDS },
            title: { type: "string" },
            body: { type: "string" },
          },
        },
      },
    },
  },
} as const;

const SYSTEM = `Ты раскладываешь текст сайта компании в базу знаний для её ИИ-продавца. Продавец будет отвечать покупателям только по этой базе, поэтому:
- Переноси только факты, которые есть в тексте: товары и услуги, цены, акции, часы работы, адреса, телефоны, доставку, оплату, гарантию, частые вопросы.
- Цены, телефоны, адреса и часы переписывай ровно как на сайте, символ в символ. Не считай, не округляй, не добавляй валюту, если её нет.
- Не придумывай ничего, чего нет в тексте. Нет цен на сайте — не будет пункта с ценами.
- Меню сайта, cookie, копирайты, отзывы и рекламные лозунги не переноси.
- Пиши на языке сайта. Каждый пункт: короткий заголовок и текст до 600 знаков.
Вызови save_knowledge один раз со всеми пунктами.`;

export type ImportResult = { company: string; niche: string; items: KnowledgeItem[]; dropped: number; pages: string[] };

export async function importSite(
  tenantId: string,
  url: string,
  deps: { call?: (p: Anthropic.Beta.MessageCreateParamsNonStreaming) => Promise<Anthropic.Beta.BetaMessage>; read?: typeof readSite } = {},
): Promise<ImportResult> {
  const site = await (deps.read ?? readSite)(url);
  if (site.text.length < 80) throw new Error("site_empty");
  const call = deps.call ?? ((p) => anthropic(usageSite(tenantId)).beta.messages.create(p));
  const response = await call({
    model: IMPORT_MODEL,
    max_tokens: 8000,
    system: SYSTEM,
    tools: [TOOL as unknown as Anthropic.Beta.BetaToolUnion],
    tool_choice: { type: "tool", name: TOOL.name },
    messages: [{ role: "user", content: `Текст сайта ${url}:\n\n${site.text}` }],
    ...effortFor(IMPORT_MODEL, "low"),
  });
  const block = response.content.find((b) => b.type === "tool_use");
  const input = (block && block.type === "tool_use" ? block.input : {}) as { company?: unknown; niche?: unknown; items?: unknown };
  const raw = Array.isArray(input.items) ? input.items : [];
  const items: KnowledgeItem[] = [];
  let dropped = 0;
  for (const item of raw as Array<Record<string, unknown>>) {
    const kind = isKnowledgeKind(item?.kind) ? item.kind : "other";
    const title = typeof item?.title === "string" ? item.title.trim().slice(0, 200) : "";
    const body = typeof item?.body === "string" ? item.body.trim().slice(0, 2000) : "";
    if (!title && !body) continue;
    // Число, которого на сайте нет, — догадка модели. В базу его не пускаем.
    if (inventedNumbers(`${title}\n${body}`, site.text).length) {
      dropped++;
      continue;
    }
    items.push({ kind, title, body });
  }
  return {
    company: typeof input.company === "string" ? input.company.trim().slice(0, 120) : "",
    niche: typeof input.niche === "string" ? input.niche.trim().slice(0, 120) : "",
    items,
    dropped,
    pages: site.pages,
  };
}
