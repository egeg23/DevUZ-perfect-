import { normalizePhone } from "@/lib/audit/contacts";

/**
 * Поиск компаний на Google Maps — Places API (New), Text Search.
 *
 * Сайт и телефон отдаёт только уровень Enterprise: у Google на нём тысяча
 * бесплатных запросов в месяц, дальше $35 за тысячу. Один запрос — до
 * двадцати компаний, то есть бесплатно это до двадцати тысяч компаний в
 * месяц; потолок в день (MAPS_DAILY_REQUESTS) держит нас внутри тысячи.
 *
 * Ключ — только на сервере: GOOGLE_PLACES_API_KEY.
 */

const ENDPOINT = "https://places.googleapis.com/v1/places:searchText";
const FIELDS = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.websiteUri",
  "places.nationalPhoneNumber",
  "places.internationalPhoneNumber",
  "places.googleMapsUri",
  "places.businessStatus",
  "nextPageToken",
].join(",");

/** Запросов к API в день. 25 × 30 = 750 в месяц — внутри бесплатной тысячи. */
export function dailyCap(): number {
  const raw = Number(process.env.MAPS_DAILY_REQUESTS);
  return Number.isFinite(raw) && raw >= 1 && raw <= 500 ? Math.floor(raw) : 25;
}

/** Страниц выдачи на кампанию за проход: 3 × 20 = 60 — столько Google и отдаёт на один запрос. */
export const PAGES_PER_RUN = 3;

/**
 * Районы Ташкента — продолжение поиска, когда «ниша Ташкент» исчерпана.
 *
 * Google на один запрос отдаёт не больше шестидесяти компаний. Стоматологий
 * в Ташкенте сотни, и без районов кампания кончалась бы в первый же день.
 */
const TASHKENT_DISTRICTS = [
  "Юнусабадский район",
  "Мирзо-Улугбекский район",
  "Чиланзарский район",
  "Яккасарайский район",
  "Мирабадский район",
  "Шайхантахурский район",
  "Алмазарский район",
  "Сергелийский район",
  "Учтепинский район",
  "Яшнабадский район",
  "Бектемирский район",
  "Янгихаётский район",
];

/** Варианты запроса кампании: сначала весь город, потом — по районам, если они известны. */
export function queriesFor(niche: string, city: string): string[] {
  const base = `${niche.trim()} ${city.trim()}`;
  const isTashkent = /ташкент|tashkent|toshkent/i.test(city);
  return isTashkent ? [base, ...TASHKENT_DISTRICTS.map((d) => `${niche.trim()} ${d} ${city.trim()}`)] : [base];
}

export type FoundPlace = {
  placeId: string;
  name: string;
  website: string | null;
  phone: string | null;
  address: string | null;
  mapsUrl: string | null;
};

type ApiPlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  websiteUri?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  googleMapsUri?: string;
  businessStatus?: string;
};

/**
 * Ответ карт → наши места.
 *
 * Закрытые насовсем и временно — мимо: писать им про сайт незачем. Сайтом
 * не считаются соцсети и мессенджеры: инстаграм в поле «сайт» — это как раз
 * компания без сайта, и писать ей надо именно об этом.
 */
export function placesFrom(body: { places?: ApiPlace[] }): FoundPlace[] {
  return (body.places ?? [])
    .filter((p) => p.id && p.displayName?.text)
    .filter((p) => !p.businessStatus || p.businessStatus === "OPERATIONAL")
    .map((p) => ({
      placeId: p.id!,
      name: p.displayName!.text!.trim().slice(0, 200),
      website: siteOf(p.websiteUri),
      phone: normalizePhone(p.internationalPhoneNumber ?? p.nationalPhoneNumber ?? "") ?? null,
      address: p.formattedAddress?.slice(0, 300) ?? null,
      mapsUrl: p.googleMapsUri ?? null,
    }));
}

const NOT_A_SITE = /(^|\.)(instagram\.com|facebook\.com|t\.me|telegram\.me|wa\.me|whatsapp\.com|linktr\.ee|taplink\.cc|vk\.com|ok\.ru|youtube\.com|tiktok\.com|google\.com|goo\.gl|business\.site)$/i;

export function siteOf(uri: string | undefined): string | null {
  if (!uri) return null;
  try {
    const url = new URL(uri);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    const host = url.hostname.replace(/^www\./, "");
    if (NOT_A_SITE.test(host)) return null;
    return `${url.protocol}//${url.hostname}${url.pathname === "/" ? "" : url.pathname}`.replace(/\/$/, "");
  } catch {
    return null;
  }
}

export type SearchPage = { places: FoundPlace[]; nextPageToken: string | null };

export function placesConfigured(): boolean {
  return Boolean(process.env.GOOGLE_PLACES_API_KEY?.trim());
}

export async function searchPlaces(query: string, pageToken: string | null): Promise<SearchPage> {
  const key = process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (!key) throw new Error("GOOGLE_PLACES_API_KEY не задан");

  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": FIELDS,
    },
    body: JSON.stringify({
      textQuery: query,
      languageCode: "ru",
      regionCode: "UZ",
      pageSize: 20,
      ...(pageToken ? { pageToken } : {}),
    }),
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  });
  const body = (await response.json().catch(() => ({}))) as {
    places?: ApiPlace[];
    nextPageToken?: string;
    error?: { message?: string };
  };
  if (!response.ok) throw new Error(`Google Maps ${response.status}: ${body.error?.message ?? "без описания"}`);
  return { places: placesFrom(body), nextPageToken: body.nextPageToken ?? null };
}
