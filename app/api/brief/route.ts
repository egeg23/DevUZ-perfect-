import { createHash, timingSafeEqual } from "node:crypto";

import { company } from "@/content/company";
import { detectContactKind } from "@/lib/contact";
import { isLocale, type Locale } from "@/lib/i18n";
import { briefHeading, briefRecipients, briefSummary, type Brief, type BriefAddon } from "@/lib/qualify/brief";
import { newRequestNo } from "@/lib/qualify/engine";
import { createHandoff } from "@/lib/qualify/handoff";
import { scoreLead } from "@/lib/qualify/scoring";
import { saveLead } from "@/lib/qualify/store";
import { sendLead } from "@/lib/qualify/telegram";
import type { NicheTier, QualifyToolInput } from "@/lib/qualify/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Приём брифа с витрины.
 *
 * Клиент на витрине выбрал пакет, включил допники и нажал «отправить бриф».
 * Сервер витрины пересчитал сумму по своему каталогу и прислал её сюда с
 * общим секретом в заголовке. Здесь бриф превращается в лид: строка в базе,
 * уведомление в Telegram — владельцу или всему отделу, смотря по сумме, — и
 * ссылка на бота, по которой ассистент закроет первичку уже в переписке.
 *
 * Квалификации пока нет и выдумывать её нельзя: известны только состав
 * заказа, сумма и контакт. Грейды по неизвестному стоят в худшее, бюджет —
 * единственное, что известно точно, и он выставлен по факту.
 */

const MAX_BODY_BYTES = 64 * 1024;
const MAX_ADDONS = 60;

type Payload = {
  project?: unknown;
  projectLabel?: unknown;
  niche?: unknown;
  nicheTier?: unknown;
  tier?: { id?: unknown; label?: unknown; priceUsd?: unknown };
  addons?: unknown;
  totalUsd?: unknown;
  name?: unknown;
  contact?: unknown;
  comment?: unknown;
  locale?: unknown;
  pageUrl?: unknown;
  shareUrl?: unknown;
};

function authorized(request: Request): boolean {
  const expected = process.env.SHOWCASE_BRIEF_SECRET;
  const provided = request.headers.get("x-brief-secret");
  if (!expected || !provided) return false;
  // Сравнение хэшей, а не строк: время сравнения не должно выдавать, на
  // каком символе секрет разошёлся.
  const a = createHash("sha256").update(expected).digest();
  const b = createHash("sha256").update(provided).digest();
  return timingSafeEqual(a, b);
}

const text = (value: unknown, max = 500): string =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

const usd = (value: unknown): number | null => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= 1_000_000 ? Math.round(n) : null;
};

function parseAddons(raw: unknown): BriefAddon[] | null {
  if (!Array.isArray(raw)) return [];
  const out: BriefAddon[] = [];
  for (const item of raw.slice(0, MAX_ADDONS)) {
    const entry = item as Partial<BriefAddon>;
    const id = text(entry?.id, 60);
    const label = text(entry?.label, 120);
    const priceUsd = usd(entry?.priceUsd);
    if (!id || !label || priceUsd === null) return null;
    out.push({ id, label, priceUsd, included: entry?.included === true });
  }
  return out;
}

export async function POST(request: Request) {
  if (!process.env.SHOWCASE_BRIEF_SECRET) {
    return Response.json({ error: "not_configured" }, { status: 503 });
  }
  if (!authorized(request)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return Response.json({ error: "too_large" }, { status: 413 });
  }

  let body: Payload;
  try {
    body = JSON.parse(raw) as Payload;
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const project = text(body.project, 40);
  const projectLabel = text(body.projectLabel, 120);
  const tier = {
    id: text(body.tier?.id, 40),
    label: text(body.tier?.label, 80),
    priceUsd: usd(body.tier?.priceUsd),
  };
  const addons = parseAddons(body.addons);
  const totalUsd = usd(body.totalUsd);
  const contact = text(body.contact, 200);
  const name = text(body.name, 120);
  const comment = text(body.comment, 1500);

  if (
    !project ||
    !projectLabel ||
    !tier.id ||
    !tier.label ||
    tier.priceUsd === null ||
    !addons ||
    totalUsd === null ||
    !contact
  ) {
    return Response.json({ error: "validation" }, { status: 422 });
  }

  const locale: Locale = isLocale(body.locale as string) ? (body.locale as Locale) : "ru";
  const requestNo = newRequestNo();

  const brief: Brief = {
    project,
    projectLabel,
    tier: { id: tier.id, label: tier.label, priceUsd: tier.priceUsd },
    addons,
    totalUsd,
    pageUrl: text(body.pageUrl, 500) || undefined,
    shareUrl: text(body.shareUrl, 1000) || undefined,
    requestNo,
    name: name || undefined,
    contact,
  };

  const nicheTier = body.nicheTier === 1 || body.nicheTier === 2 || body.nicheTier === 3 ? body.nicheTier : 3;
  const unknown = "не выяснено — бриф с витрины, разговора ещё не было";
  const summary = briefSummary(brief);

  const input: QualifyToolInput = {
    contact_name: name,
    company: "",
    contact_handle: contact,
    contact_kind: detectContactKind(contact),
    niche: text(body.niche, 120) || projectLabel,
    niche_tier: nicheTier as NicheTier,
    expertise: "medium",
    services: ["web-development"],
    // Бюджет известен точно — клиент его сам собрал. Остальное — нет.
    budget: "B2",
    authority: "A3",
    need: "N2",
    timing: "T3",
    intent: "interested",
    summary: {
      client: name || "имя не указано",
      request: comment ? `${summary} Комментарий клиента: ${comment}` : summary,
      niche: text(body.niche, 120) || projectLabel,
      expertise: "витрина собрана нами — задача знакома",
      budget: `$${totalUsd} по конфигуратору витрины`,
      authority: unknown,
      need: "сайт выбран и собран из блоков — задача сформулирована",
      timing: unknown,
    },
    notes:
      "Бриф с конструктора на витрине, а не из чата. Состав и сумма — выше; сроки, контент и ЛПР ещё не выяснены. Если клиент открыл бота, ассистент дописывает первичку в эту же заявку.",
    opening_line: openers[locale](name, tier.label, totalUsd),
    already_told: [
      `Пакет «${tier.label}» — $${tier.priceUsd}`,
      ...addons
        .filter((addon) => !addon.included && addon.priceUsd > 0)
        .map((addon) => `${addon.label} — +$${addon.priceUsd}`),
      `Итого $${totalUsd} — цена с витрины, клиент её видел`,
    ],
    avoid_asking: [`бюджет — $${totalUsd}, собран в конфигураторе`],
  };

  const lead = scoreLead(input, locale);

  let leadId: string | null = null;
  try {
    leadId = await saveLead(lead, [], "showcase", { requestNo });
  } catch (error) {
    console.error("saveLead brief", error);
  }

  const route = await briefRecipients(totalUsd);
  const delivered = await sendLead(lead, leadId ?? "unsaved", requestNo, {
    to: route.chatIds,
    heading: briefHeading(brief, route, "brief"),
  }).catch((error) => {
    console.error("sendLead brief", error);
    return false;
  });

  if (!delivered && !leadId) {
    return Response.json({ error: "delivery_failed" }, { status: 502 });
  }

  // Ссылка на бота: по ней ассистент поднимает бриф и ведёт первичку, а не
  // знакомится заново. Токен одноразовый и живёт час — как у чата с сайта.
  const token = createHandoff({ locale, transcript: [], qualified: false, requestNo, discount: false, brief });

  return Response.json({
    ok: true,
    requestNo,
    botUrl: `https://t.me/${company.telegram}?start=${token}`,
    delivered,
    ownerOnly: route.ownerOnly,
  });
}

/** Первая фраза менеджера — на языке версии витрины, с известным составом. */
const openers: Record<Locale, (name: string, tier: string, total: number) => string> = {
  ru: (name, tier, total) =>
    `Здравствуйте${name ? ", " + name : ""}! Меня зовут [имя], я из студии DevUz — получил ваш бриф с витрины: пакет «${tier}», итого $${total}. Подскажите, когда планируете стартовать и есть ли у вас готовые тексты и фотографии?`,
  en: (name, tier, total) =>
    `Hello${name ? " " + name : ""}! I'm [name] from DevUz Studio — I've got your brief from the showcase: the “${tier}” package, $${total} in total. When would you like to start, and do you already have texts and photos ready?`,
  uz: (name, tier, total) =>
    `Assalomu alaykum${name ? ", " + name : ""}! Men DevUz studiyasidan [ism] — vitrinadan brifingizni oldim: «${tier}» paketi, jami $${total}. Qachon boshlashni rejalashtiryapsiz va tayyor matn hamda suratlar bormi?`,
  zh: (name, tier, total) =>
    `您好${name ? "，" + name : ""}！我是 DevUz Studio 的 [姓名]，已收到您在展示页提交的需求：「${tier}」套餐，合计 $${total}。请问计划何时启动，是否已有现成的文案和图片？`,
};
