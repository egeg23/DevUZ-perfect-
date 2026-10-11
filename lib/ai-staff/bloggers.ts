import { usageSite } from "@/lib/ai-staff/plans";
import * as store from "@/lib/ai-staff/store";
import { discover } from "@/lib/bloggers/discovery";
import { judgeBlogger } from "@/lib/bloggers/judge";
import { anthropic } from "@/lib/model-road";
import { candidatesFrom, contactsFromBio, normalizeHandle, scoreBlogger } from "@/lib/bloggers/rules";
import { firecrawlUsedToday, recordFirecrawl, dayStart } from "@/lib/bloggers/store";
import { dailyAllowance, firecrawlBalance, firecrawlSearch } from "@/lib/firecrawl";
import { serviceClient } from "@/lib/supabase";

/**
 * ИИ-менеджер по блогерам — роль `bloggers` сервиса ИИ-сотрудников.
 *
 * Тот же агент, что внутренний сотрудник студии «Блогеры»
 * (docs/ai-staff/bloggers.md), только для бренда клиента: ищет блогеров,
 * оценивает аудиторию под его покупателей и готовит первое сообщение с его
 * предложением. Отправляет человек клиента в Direct в одно касание: писать
 * первым в Instagram официальный API не даёт, а входить в чужой аккаунт
 * посторонней программой мы не будем.
 *
 * Расход: оценка — недорогая модель с меткой клиента (`saas-<id>` в
 * model_usage); поиск — Firecrawl студии, поэтому не чаще раза в день на
 * клиента и только из остатка общего дневного лимита.
 */

export type Brief = {
  /** Что продаёт бренд, своими словами клиента. */
  brand: string;
  /** Кто его покупатели: город, возраст, интересы. */
  audience: string;
  /** Что бренд предлагает блогерам: бартер, оплата, процент. */
  offer: string;
  minFollowers: number;
  maxFollowers: number;
};

export const DEFAULT_BRIEF: Brief = { brand: "", audience: "", offer: "", minFollowers: 1_000, maxFollowers: 1_000_000 };

/** Оценок блогеров в месяц на клиента: каждая — вызов модели за наш счёт. */
export const BLOGGERS_PER_MONTH = 100;
/** Поисков в день на клиента. */
export const SEARCHES_PER_DAY = 1;
/** Сколько найденных оценить сразу после поиска. */
export const ASSESS_AFTER_SEARCH = 5;
/** Проходной балл для клиента — мягче, чем у студии: решает человек клиента. */
export const MIN_SCORE = 50;

export function briefFrom(raw: Record<string, unknown> | null): Brief {
  const v = raw ?? {};
  const text = (k: string) => (typeof v[k] === "string" ? String(v[k]).trim().slice(0, 600) : "");
  const n = (k: keyof Brief, min: number, max: number) => {
    const x = Math.round(Number(v[k]));
    return Number.isFinite(x) && x > 0 ? Math.max(min, Math.min(max, x)) : (DEFAULT_BRIEF[k] as number);
  };
  const minFollowers = n("minFollowers", 100, 10_000_000);
  return { brand: text("brand"), audience: text("audience"), offer: text("offer"), minFollowers, maxFollowers: Math.max(minFollowers, n("maxFollowers", 1_000, 50_000_000)) };
}

/**
 * Первое сообщение блогеру от бренда. Шаблоном, без модели: в нём только
 * слова клиента — что он продаёт и что предлагает, — и ни одного числа,
 * которого клиент сам не написал.
 */
export function tenantPitch(input: { company: string; brief: Brief; name: string; lang: "ru" | "uz" }): string {
  const name = input.name.trim().split(/\s+/)[0] || "";
  const brand = input.brief.brand.replace(/[.\s]+$/, "");
  const offer = input.brief.offer.replace(/\s+$/, "");
  if (input.lang === "uz") {
    return [
      `Assalomu alaykum${name ? `, ${name}` : ""}! ${input.company} dan yozyapmiz${brand ? `: ${brand}` : ""}.`,
      offer ? `Sizga hamkorlikni taklif qilmoqchimiz: ${offer}` : "Sizga hamkorlikni taklif qilmoqchimiz.",
      "Gaplashib ko‘ramizmi?",
    ].join("\n\n");
  }
  return [
    `Здравствуйте${name ? `, ${name}` : ""}! Пишем от ${input.company}${brand ? `: ${brand}` : ""}.`,
    offer ? `Хотим предложить сотрудничество: ${offer}` : "Хотим предложить сотрудничество.",
    "Интересно обсудить?",
  ].join("\n\n");
}

/** Оценить одного блогера под бренд клиента. */
export async function assessForTenant(tenant: store.Tenant, blogger: store.TenantBlogger, brief: Brief): Promise<void> {
  const found = await discover(blogger.handle);
  const p = found.ok ? found.profile : null;
  const bio = p?.bio || blogger.bio;
  const contacts = contactsFromBio(bio);
  const judgement = await judgeBlogger(
    { handle: blogger.handle, name: p?.name || blogger.name, bio, captions: p?.captions ?? [], brand: { brand: brief.brand, audience: brief.audience } },
    (params) => anthropic(usageSite(tenant.id)).beta.messages.create(params),
  );
  const followers = p?.followers ?? blogger.followers;
  const scored = scoreBlogger(
    {
      followers,
      following: p?.following ?? blogger.following,
      engagement: p?.engagement ?? blogger.engagement,
      postsPerWeek: p?.postsPerWeek ?? blogger.posts_per_week,
      lastPostAt: p?.lastPostAt ?? null,
      uzbekistan: judgement.uzbekistan,
      lang: judgement.lang,
      fit: judgement.fit,
    },
    { minFollowers: brief.minFollowers, maxFollowers: brief.maxFollowers, minScore: MIN_SCORE },
  );
  const name = p?.name || blogger.name;
  await store.updateTenantBlogger(tenant.id, blogger.id, {
    name,
    bio,
    followers,
    following: p?.following ?? blogger.following,
    engagement: p?.engagement ?? blogger.engagement,
    posts_per_week: p?.postsPerWeek ?? blogger.posts_per_week,
    last_post_at: p?.lastPostAt ? new Date(p.lastPostAt).toISOString() : blogger.last_post_at,
    topics: judgement.topics,
    lang: judgement.lang,
    city: judgement.city || null,
    fit: judgement.fit,
    why: judgement.why || null,
    telegram: blogger.telegram ?? contacts.telegram,
    email: blogger.email ?? contacts.email,
    score: scored.score,
    score_notes: scored.notes.join("; ") || null,
    status: blogger.status === "new" ? (scored.pass ? "ready" : "skipped") : blogger.status,
    pitch: tenantPitch({ company: tenant.name, brief, name, lang: judgement.lang === "uz" ? "uz" : tenant.locale }),
  });
}

/** Месяц клиента — с первого числа по Ташкенту, как его диалоги. */
function monthStartOf(now: Date): Date {
  const t = new Date(now.getTime() + 5 * 3600_000);
  return new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), 1) - 5 * 3600_000);
}

export async function assessLeft(tenantId: string, now = new Date()): Promise<number> {
  return Math.max(0, BLOGGERS_PER_MONTH - (await store.tenantBloggersSince(tenantId, monthStartOf(now))));
}

const searchTarget = (tenantId: string, query: string) => `saas:${tenantId}:${query}`.slice(0, 200);

/** Сколько поисков клиент уже сделал сегодня. */
export async function searchesToday(tenantId: string, now = new Date()): Promise<number> {
  const db = serviceClient();
  if (!db) return SEARCHES_PER_DAY;
  const { count } = await db
    .from("firecrawl_usage")
    .select("id", { count: "exact", head: true })
    .eq("kind", "bloggers")
    .like("target", `saas:${tenantId}:%`)
    .gte("at", dayStart(now).toISOString());
  return count ?? 0;
}

export type SearchResult = { ok: true; added: number; assessed: number } | { ok: false; reason: "limit" | "no_budget" | "failed" | "empty" };

/** Поиск блогеров под бренд клиента: один в день, из остатка дневного лимита Firecrawl студии. */
export async function searchForTenant(tenant: store.Tenant, query: string, brief: Brief, now = new Date()): Promise<SearchResult> {
  const q = query.trim().slice(0, 120);
  if (!q) return { ok: false, reason: "empty" };
  if ((await searchesToday(tenant.id, now)) >= SEARCHES_PER_DAY) return { ok: false, reason: "limit" };
  const balance = await firecrawlBalance(now.getTime());
  if (!balance) return { ok: false, reason: "no_budget" };
  const used = await firecrawlUsedToday(now);
  if (dailyAllowance({ ...balance, usedToday: used.all, dayStart: dayStart(now).getTime() }) - used.all < 2) return { ok: false, reason: "no_budget" };
  const found = await firecrawlSearch(/instagram/i.test(q) ? q : `site:instagram.com ${q}`, 10).catch(() => null);
  if (!found) return { ok: false, reason: "failed" };
  const candidates = candidatesFrom(found.results);
  const added = await store.addTenantBloggers(
    tenant.id,
    candidates.map((c) => ({
      handle: c.handle,
      name: c.metrics?.name ?? "",
      bio: c.bio,
      followers: c.metrics?.followers ?? null,
      following: c.metrics?.following ?? null,
      source: "search" as const,
    })),
  );
  await recordFirecrawl(null, { credits: found.credits, target: searchTarget(tenant.id, q), found: added.length });
  let assessed = 0;
  const left = await assessLeft(tenant.id, now);
  for (const b of added.slice(0, Math.min(ASSESS_AFTER_SEARCH, left))) {
    await assessForTenant(tenant, b, brief).then(() => assessed++).catch((error) => console.error("ai-staff, блогеры: оценка —", (error as Error).message));
  }
  return { ok: true, added: added.length, assessed };
}
