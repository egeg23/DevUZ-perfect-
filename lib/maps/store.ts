import { auditOne, toProspectRow } from "@/lib/audit/batch";
import { EMPTY_CONTACTS, type Contacts } from "@/lib/audit/contacts";
import { hostOf } from "@/lib/audit/pitch";
import { todayInTashkent } from "@/lib/admin/pulse";
import { tashkentHour } from "@/lib/admin/portion";
import type { Staff } from "@/lib/admin/session";
import { PAGES_PER_RUN, dailyCap, placesConfigured, queriesFor, searchPlaces, type FoundPlace } from "@/lib/maps/places";
import { serviceClient } from "@/lib/supabase";

/**
 * Автопоиск компаний по картам — база и расписание.
 *
 * Поиск и проверка разнесены. Поиск быстрый (секунда на страницу выдачи) и
 * идёт раз в день с 06:00 — до раздачи порций в 07:00. Проверка сайта —
 * секунды на каждый, поэтому идёт понемногу, после ответа свипу, и кладёт
 * готовое в пул касаний, откуда его берёт порция дня.
 */

export const SEARCH_HOUR = 6;
/** Сколько найденных мест проверить за проход свипа: пять сайтов — около сорока секунд. */
export const PROCESS_PER_PASS = 5;

export type Campaign = {
  id: string;
  created_at: string;
  niche: string;
  city: string;
  active: boolean;
  variant: number;
  exhausted: boolean;
  last_run_at: string | null;
  found: number;
  added: number;
};

export async function listCampaigns(): Promise<Campaign[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data } = await db
    .from("maps_campaigns")
    .select("id, created_at, niche, city, active, variant, exhausted, last_run_at, found, added")
    .order("created_at", { ascending: false })
    .limit(100);
  return (data as Campaign[] | null) ?? [];
}

export async function usageToday(now: Date = new Date()): Promise<number> {
  const db = serviceClient();
  if (!db) return 0;
  const { data } = await db.from("maps_usage").select("requests").eq("day", todayInTashkent(now)).maybeSingle();
  return Number(data?.requests ?? 0);
}

/** Ждут проверки — для строки «в очереди на проверку: N». */
export async function pendingPlaces(): Promise<number> {
  const db = serviceClient();
  if (!db) return 0;
  const { count } = await db.from("maps_places").select("place_id", { count: "exact", head: true }).eq("status", "new");
  return count ?? 0;
}

export async function createCampaign(
  niche: string,
  city: string,
  staff: Staff,
): Promise<{ ok: true; id: string } | { ok: false; why: string }> {
  const n = niche.trim().replace(/\s+/g, " ").slice(0, 120);
  const c = city.trim().replace(/\s+/g, " ").slice(0, 80);
  if (n.length < 2 || c.length < 2) return { ok: false, why: "Нужны ниша и город." };
  const db = serviceClient();
  if (!db) return { ok: false, why: "База недоступна." };
  const { data, error } = await db
    .from("maps_campaigns")
    .insert({ niche: n, city: c, created_by: staff.id })
    .select("id")
    .single();
  if (error || !data) return { ok: false, why: "Не получилось сохранить." };
  return { ok: true, id: data.id as string };
}

export async function setCampaignActive(id: string, active: boolean): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  await db.from("maps_campaigns").update({ active }).eq("id", id);
}

/**
 * Взять один запрос из дневного лимита. false — лимит на сегодня исчерпан,
 * и в Google мы не идём: платный запрос дороже, чем день ожидания.
 */
async function spendRequest(now: Date): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const { data, error } = await db.rpc("bump_maps_usage", { p_day: todayInTashkent(now) });
  if (error) {
    console.error("карты: не записал расход", error.message);
    return false;
  }
  return Number(data) <= dailyCap();
}

export type SearchRun = { campaign: string; requests: number; found: number; error?: string };

/**
 * Проход кампании по выдаче: до трёх страниц.
 *
 * Выдача кончилась — следующий вариант запроса (район); кончились варианты —
 * кампания исчерпана, и панель предлагает завести новую нишу.
 */
export async function runSearch(campaign: Campaign, now: Date = new Date()): Promise<SearchRun> {
  const run: SearchRun = { campaign: campaign.id, requests: 0, found: 0 };
  const db = serviceClient();
  if (!db || !placesConfigured() || campaign.exhausted) return run;

  const queries = queriesFor(campaign.niche, campaign.city);
  const { data: state } = await db.from("maps_campaigns").select("variant, page_token").eq("id", campaign.id).maybeSingle();
  let variant = Number(state?.variant ?? campaign.variant);
  let token = (state?.page_token as string | null) ?? null;
  let exhausted = variant >= queries.length;

  for (let page = 0; page < PAGES_PER_RUN && !exhausted; page++) {
    if (!(await spendRequest(now))) break;
    run.requests += 1;
    let result;
    try {
      result = await searchPlaces(queries[variant], token);
    } catch (error) {
      run.error = error instanceof Error ? error.message : String(error);
      break;
    }
    run.found += await savePlaces(campaign.id, result.places);
    if (result.nextPageToken) {
      token = result.nextPageToken;
    } else {
      token = null;
      variant += 1;
      exhausted = variant >= queries.length;
    }
  }

  await db
    .from("maps_campaigns")
    .update({
      variant,
      page_token: token,
      exhausted,
      last_run_at: now.toISOString(),
      found: campaign.found + run.found,
    })
    .eq("id", campaign.id);
  return run;
}

/** Новые места — в очередь на проверку. Уже виденные пропускаются по месту на карте. */
async function savePlaces(campaignId: string, places: readonly FoundPlace[]): Promise<number> {
  const db = serviceClient();
  if (!db || !places.length) return 0;
  const { data, error } = await db
    .from("maps_places")
    .upsert(
      places.map((p) => ({
        place_id: p.placeId,
        campaign_id: campaignId,
        name: p.name,
        website: p.website,
        phone: p.phone,
        address: p.address,
        maps_url: p.mapsUrl,
      })),
      { onConflict: "place_id", ignoreDuplicates: true },
    )
    .select("place_id");
  if (error) {
    console.error("карты: не сохранил выдачу", error.message);
    return 0;
  }
  return (data ?? []).length;
}

/** Раз в день с 06:00 — каждой активной кампании свой проход, пока хватает лимита. */
export async function runDailySearches(now: Date = new Date()): Promise<SearchRun[]> {
  if (!placesConfigured() || tashkentHour(now) < SEARCH_HOUR) return [];
  const today = todayInTashkent(now);
  const due = (await listCampaigns()).filter(
    (c) => c.active && !c.exhausted && (!c.last_run_at || todayInTashkent(new Date(c.last_run_at)) < today),
  );
  const runs: SearchRun[] = [];
  for (const campaign of due) {
    const run = await runSearch(campaign, now);
    runs.push(run);
    if (run.requests === 0) break; // лимит кончился
  }
  return runs;
}

/** Телефон с карт — к контактам с сайта, если его там нет. */
export function withMapsPhone(contacts: Contacts, phone: string | null): Contacts {
  if (!phone || contacts.phones.includes(phone) || contacts.whatsapp.includes(phone)) return contacts;
  return { ...contacts, phones: [...contacts.phones, phone] };
}

type PlaceRow = {
  place_id: string;
  campaign_id: string | null;
  name: string;
  website: string | null;
  phone: string | null;
};

/**
 * Проверить следующие найденные места и положить годное в пул касаний.
 *
 * С сайтом — тот же аудитор, что у ручного прогона: без находок писать не о
 * чем, и компания пропускается. Без сайта — карточка «без сайта» с
 * телефоном с карт: писать ей как раз есть о чём.
 */
export async function processPlaces(now: Date = new Date(), limit = PROCESS_PER_PASS): Promise<number> {
  const db = serviceClient();
  if (!db) return 0;
  const { data } = await db
    .from("maps_places")
    .select("place_id, campaign_id, name, website, phone")
    .eq("status", "new")
    .is("processed_at", null)
    .order("created_at", { ascending: true })
    .limit(limit);

  let added = 0;
  const niches = new Map<string, string>();
  for (const place of (data ?? []) as PlaceRow[]) {
    // Забираем условно: два прохода не проверят одно место дважды.
    const { data: claimed } = await db
      .from("maps_places")
      .update({ processed_at: now.toISOString() })
      .eq("place_id", place.place_id)
      .is("processed_at", null)
      .select("place_id");
    if (!claimed?.length) continue;

    let niche = place.campaign_id ? niches.get(place.campaign_id) : undefined;
    if (place.campaign_id && niche === undefined) {
      const { data: c } = await db.from("maps_campaigns").select("niche").eq("id", place.campaign_id).maybeSingle();
      niche = (c?.niche as string | undefined) ?? "";
      niches.set(place.campaign_id, niche);
    }

    const verdict = await placeToProspect(place, niche || null);
    await db
      .from("maps_places")
      .update({ status: verdict.added ? "added" : "skipped", note: verdict.note })
      .eq("place_id", place.place_id);
    if (verdict.added) {
      added += 1;
      if (place.campaign_id) {
        const { data: c } = await db.from("maps_campaigns").select("added").eq("id", place.campaign_id).maybeSingle();
        await db
          .from("maps_campaigns")
          .update({ added: Number(c?.added ?? 0) + 1 })
          .eq("id", place.campaign_id);
      }
    }
  }
  return added;
}

async function placeToProspect(place: PlaceRow, niche: string | null): Promise<{ added: boolean; note: string }> {
  const db = serviceClient();
  if (!db) return { added: false, note: "база недоступна" };

  const { data: seen } = await db.from("prospects").select("id").eq("place_id", place.place_id).maybeSingle();
  if (seen) return { added: false, note: "уже в касаниях" };

  if (place.website) {
    const host = hostOf(place.website);
    if (!host) return { added: false, note: "адрес сайта не разобран" };
    const { data: sameHost } = await db.from("prospects").select("id").eq("host", host).maybeSingle();
    if (sameHost) return { added: false, note: "сайт уже в касаниях" };

    const row = toProspectRow(await auditOne({ raw: place.website, url: place.website, label: place.name, problem: null }));
    if (!row.findings.length) return { added: false, note: row.note ?? "на сайте не нашлось, о чём написать" };

    const { data, error } = await db
      .from("prospects")
      .upsert(
        {
          url: row.url,
          host,
          label: place.name,
          score: row.score,
          findings: row.findings,
          contacts: withMapsPhone(row.contacts, place.phone),
          draft: row.draft,
          niche,
          place_id: place.place_id,
        },
        { onConflict: "host", ignoreDuplicates: true },
      )
      .select("id");
    if (error) return { added: false, note: `не сохранилось: ${error.message}` };
    return data?.length ? { added: true, note: "сайт проверен, в пуле касаний" } : { added: false, note: "сайт уже в касаниях" };
  }

  if (!place.phone) return { added: false, note: "нет ни сайта, ни телефона" };
  // Компания без сайта: узнать повтор можно только по названию в той же нише.
  const { data: twin } = await db
    .from("prospects")
    .select("id")
    .is("host", null)
    .ilike("label", place.name)
    .limit(1);
  if (twin?.length) return { added: false, note: "уже в касаниях" };

  const { error } = await db.from("prospects").insert({
    url: null,
    host: null,
    label: place.name,
    niche,
    contacts: { ...EMPTY_CONTACTS, phones: [place.phone] },
    place_id: place.place_id,
  });
  if (error) return { added: false, note: `не сохранилось: ${error.message}` };
  return { added: true, note: "без сайта — в пуле касаний" };
}
