import { candidates } from "@/lib/admin/autopilot-store";
import {
  CREDITS_PER_PASS,
  LOW_POOL,
  SEARCH_COST,
  SEARCH_FROM_HOUR,
  SEARCH_LIMIT,
  SEARCH_TO_HOUR,
  companySite,
  nextJob,
  nextQuery,
  nicheOfQuery,
  reachable,
} from "@/lib/admin/lead-search";
import { TASHKENT_OFFSET_MS, tashkentMidnight, todayInTashkent } from "@/lib/admin/pulse";
import { contactsFrom, extractContacts, mergeContacts } from "@/lib/audit/contacts";
import { hostOf } from "@/lib/audit/pitch";
import { dailyAllowance, firecrawlBalance, firecrawlKey, firecrawlPage, firecrawlSearch, spentCredits } from "@/lib/firecrawl";
import { serviceClient } from "@/lib/supabase";

/**
 * Поиск лидов через Firecrawl — база и вызовы. Что и почему — в
 * lib/admin/lead-search.ts, дневной лимит — в lib/firecrawl.ts.
 */

type Db = NonNullable<ReturnType<typeof serviceClient>>;

export type LeadSearchRun = {
  skipped?: "offline" | "no_key" | "hours" | "no_balance" | "limit";
  credits: number;
  found: number;
  errors: string[];
};

function tashkentHour(now: Date): number {
  return new Date(now.getTime() + TASHKENT_OFFSET_MS).getUTCHours();
}

async function usedSince(db: Db, since: Date): Promise<number> {
  const { data } = await db.from("firecrawl_usage").select("credits").gte("at", since.toISOString());
  return (data ?? []).reduce((sum, r) => sum + Number(r.credits ?? 0), 0);
}

async function record(
  db: Db,
  row: { kind: "search" | "contacts"; credits: number; target: string; found: number; note?: string | null },
): Promise<void> {
  const { error } = await db.from("firecrawl_usage").insert({ ...row, note: row.note?.slice(0, 300) ?? null });
  if (error) console.error("firecrawl: расход не записался —", error.message);
  spentCredits(row.credits);
}

type Card = { id: string; url: string; host: string; contacts: unknown; findings: unknown };

/**
 * Карточки пула, которым автопрогону писать некуда: сайт есть, писать о
 * чём есть, а ни @адреса, ни мобильного номера нет. Свежие — первыми: их
 * только что принесли карты. Домен, который Firecrawl уже открывал, второй
 * раз не открываем.
 */
async function enrichable(db: Db, limit: number): Promise<Card[]> {
  const { data } = await db
    .from("prospects")
    .select("id, url, host, contacts, findings")
    .eq("status", "new")
    .is("claimed_by", null)
    .is("autopilot_at", null)
    .not("host", "is", null)
    .not("url", "is", null)
    .order("created_at", { ascending: false })
    .limit(400);
  const cards = ((data ?? []) as Card[]).filter(
    (c) => Array.isArray(c.findings) && c.findings.length > 0 && !reachable(contactsFrom(c.contacts)),
  );
  if (!cards.length) return [];
  const { data: tried } = await db
    .from("firecrawl_usage")
    .select("target")
    .eq("kind", "contacts")
    .in(
      "target",
      cards.map((c) => c.host),
    );
  const done = new Set((tried ?? []).map((r) => String(r.target)));
  return cards.filter((c) => !done.has(c.host)).slice(0, limit);
}

/** Открыть сайт настоящим браузером и дописать контакты, которых наш обход не увидел. */
async function enrich(db: Db, card: Card): Promise<{ credits: number; found: number }> {
  try {
    const page = await firecrawlPage(card.url);
    if (!page) return { credits: 0, found: 0 };
    const before = contactsFrom(card.contacts);
    const after = mergeContacts(before, extractContacts(page.html), before.contactsUrl);
    const gained = !reachable(before) && reachable(after);
    if (gained) {
      await db.from("prospects").update({ contacts: after }).eq("id", card.id).eq("status", "new").is("claimed_by", null);
    }
    await record(db, { kind: "contacts", credits: page.credits, target: card.host, found: gained ? 1 : 0 });
    return { credits: page.credits, found: gained ? 1 : 0 };
  } catch (error) {
    // Сайт не открылся и у Firecrawl — кредит он, скорее всего, списал. Домен
    // помечаем попробованным: второй раз за ним не пойдём.
    const why = error instanceof Error ? error.message : String(error);
    await record(db, { kind: "contacts", credits: 1, target: card.host, found: 0, note: why });
    throw error;
  }
}

/** Кампания с карт той же ниши — у найденного будет ниша, как у находок с карт. */
async function campaignFor(db: Db, niche: string | null): Promise<string | null> {
  if (!niche) return null;
  const { data } = await db.from("maps_campaigns").select("id, niche, city");
  const same = (data ?? []).filter((c) => String(c.niche).toLowerCase() === niche.toLowerCase());
  return String((same.find((c) => /ташкент/i.test(String(c.city))) ?? same[0])?.id ?? "") || null;
}

/**
 * Поиск новых компаний: следующий запрос по кругу (ниша × город). Сайты
 * компаний, которых ещё нет ни в пуле, ни в очереди, уходят в очередь
 * проверки находок с карт (maps_places) — дальше тем же путём: аудит сайта,
 * находки, пул касаний.
 */
async function search(db: Db, now: Date): Promise<{ credits: number; found: number }> {
  const { data: past } = await db
    .from("firecrawl_usage")
    .select("target, at")
    .eq("kind", "search")
    .gte("at", new Date(now.getTime() - 60 * 24 * 3600_000).toISOString());
  const lastUsed = new Map<string, number>();
  for (const r of past ?? []) lastUsed.set(String(r.target), Math.max(lastUsed.get(String(r.target)) ?? 0, Date.parse(String(r.at))));
  const query = nextQuery(lastUsed);
  if (!query) return { credits: 0, found: 0 };

  let result;
  try {
    result = await firecrawlSearch(query, SEARCH_LIMIT);
  } catch (error) {
    const why = error instanceof Error ? error.message : String(error);
    await record(db, { kind: "search", credits: 0, target: query, found: 0, note: why });
    throw error;
  }
  if (!result) return { credits: 0, found: 0 };

  const sites = new Map<string, { site: string; title: string }>();
  for (const r of result.results) {
    const site = companySite(r);
    const host = site ? hostOf(site) : null;
    if (site && host && !sites.has(host)) sites.set(host, { site, title: r.title });
  }
  const hosts = [...sites.keys()];
  const [{ data: inPool }, { data: queued }] = hosts.length
    ? await Promise.all([
        db.from("prospects").select("host").in("host", hosts),
        db.from("maps_places").select("place_id").in("place_id", hosts.map((h) => `fc:${h}`)),
      ])
    : [{ data: [] }, { data: [] }];
  const seen = new Set([
    ...(inPool ?? []).map((r) => String(r.host)),
    ...(queued ?? []).map((r) => String(r.place_id).replace(/^fc:/, "")),
  ]);
  const fresh = hosts.filter((h) => !seen.has(h));

  const campaign = await campaignFor(db, nicheOfQuery(query));
  let found = 0;
  if (fresh.length) {
    const { data: inserted, error } = await db
      .from("maps_places")
      .upsert(
        fresh.map((h) => ({
          place_id: `fc:${h}`,
          campaign_id: campaign,
          name: (sites.get(h)!.title || h).slice(0, 200),
          website: sites.get(h)!.site,
          phone: null,
        })),
        { onConflict: "place_id", ignoreDuplicates: true },
      )
      .select("place_id");
    if (error) console.error("firecrawl: найденное не встало в очередь —", error.message);
    found = inserted?.length ?? 0;
  }
  await record(db, { kind: "search", credits: result.credits, target: query, found });
  return { credits: result.credits, found };
}

/**
 * Проход свипа: потратить до CREDITS_PER_PASS кредитов из дневного лимита —
 * на поиск новых компаний или на контакты тех, кому писать некуда
 * (lib/admin/lead-search.ts → nextJob).
 */
export async function leadSearchPass(now: Date = new Date()): Promise<LeadSearchRun> {
  const run: LeadSearchRun = { credits: 0, found: 0, errors: [] };
  const db = serviceClient();
  if (!db) return { ...run, skipped: "offline" };
  if (!(await firecrawlKey())) return { ...run, skipped: "no_key" };
  const hour = tashkentHour(now);
  if (hour < SEARCH_FROM_HOUR || hour >= SEARCH_TO_HOUR) return { ...run, skipped: "hours" };

  const balance = await firecrawlBalance(now.getTime());
  if (!balance) return { ...run, skipped: "no_balance" };
  const dayStart = tashkentMidnight(todayInTashkent(now)).getTime();
  const usedToday = await usedSince(db, new Date(dayStart));
  const cap = dailyAllowance({ ...balance, usedToday, dayStart });
  const budget = cap - usedToday;
  if (budget <= 0) return { ...run, skipped: "limit" };

  // Годных в пуле много — дописываем контакты; мало — ищем новые компании.
  // Тянется только когда есть что тратить: после лимита проход выходит выше.
  const pool = (await candidates(LOW_POOL, now)).length;
  let cards = await enrichable(db, CREDITS_PER_PASS);
  let left = Math.min(budget, CREDITS_PER_PASS);
  while (left > 0) {
    const job = nextJob({ left: budget - run.credits, reachable: pool, enrichable: cards.length });
    if (!job) break;
    // Поиск стоит два кредита: начатый проход им не добираем.
    if (job === "search" && left < SEARCH_COST && run.credits > 0) break;
    try {
      const done = job === "search" ? await search(db, now) : await enrich(db, cards[0]);
      if (job === "contacts") cards = cards.slice(1);
      if (!done.credits) break;
      run.credits += done.credits;
      run.found += done.found;
      left -= done.credits;
    } catch (error) {
      run.errors.push(error instanceof Error ? error.message : String(error));
      break;
    }
  }
  return run;
}
