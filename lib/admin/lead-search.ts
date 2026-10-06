import { AUTOPILOT_NICHES } from "@/lib/admin/autopilot";
import { routeFor } from "@/lib/admin/outreach";
import type { Contacts } from "@/lib/audit/contacts";

/**
 * Поиск лидов для автопрогона касаний через Firecrawl — чистая часть: что
 * искать, что считать сайтом компании, на что тратить дневной лимит. База и
 * вызовы — в lead-search-store.
 *
 * Владелец, 06.10.2026: «Нам главное не 20 попыток связаться, а не
 * останавливать поиск, пока 20 сообщений не будут отправлены… Любые ниши».
 *
 * Новые компании и так каждый день приходят с Google Карт (около сотни в
 * день, бесплатно), поэтому Firecrawl тратится там, где карты и наш обход не
 * справляются:
 *
 * 1. Компании в пуле, которым писать некуда: на сайте ни @адреса Telegram,
 *    ни мобильного номера — только городской или ничего. Firecrawl
 *    открывает их сайт настоящим браузером: у сайтов на конструкторах
 *    контакты часто появляются только после загрузки, и наш обход их не
 *    видит. Нашёлся @адрес или мобильный — компания уходит в автопрогон.
 * 2. Когда годных в пуле мало (`LOW_POOL`) или дописывать некому — поиск
 *    новых компаний: ниша × город, по кругу. Найденные сайты идут в ту же
 *    очередь проверки, что находки с карт (maps_places), и дальше тем же
 *    путём: аудит сайта, находки, пул.
 */

/** Города поиска: Ташкент — первым, дальше крупные областные центры. */
export const SEARCH_CITIES = ["Ташкент", "Самарканд", "Бухара", "Наманган", "Андижан", "Фергана", "Нукус", "Карши"] as const;

/** Годных компаний в пуле меньше этого — сперва ищем новые: это три-четыре дня работы автопрогона. */
export const LOW_POOL = 100;

/** Результатов на один поиск; Firecrawl списывает за него 2 кредита. */
export const SEARCH_LIMIT = 10;
export const SEARCH_COST = 2;

/** Кредитов за проход свипа — так дневной лимит расходится по дню, а не в первые минуты. */
export const CREDITS_PER_PASS = 2;

/** Когда тратить: с 07:00 до 20:00 по Ташкенту — найденное успевает пройти проверку до утра. */
export const SEARCH_FROM_HOUR = 7;
export const SEARCH_TO_HOUR = 20;

/** Все запросы поиска по порядку: ниша за нишей, Ташкент — первым. */
export function searchQueries(): string[] {
  const out: string[] = [];
  for (const city of SEARCH_CITIES) {
    for (const niche of AUTOPILOT_NICHES) out.push(`${niche.maps.toLowerCase()} ${city}`);
  }
  return out;
}

/**
 * Следующий запрос: тот, что ещё не задавали, а если заданы все — тот, что
 * задавали давнее всех. `lastUsed` — запрос → когда задан (мс).
 */
export function nextQuery(lastUsed: ReadonlyMap<string, number>, all: readonly string[] = searchQueries()): string | null {
  let best: string | null = null;
  let bestAt = Number.POSITIVE_INFINITY;
  for (const q of all) {
    const at = lastUsed.get(q) ?? Number.NEGATIVE_INFINITY;
    if (at < bestAt) {
      best = q;
      bestAt = at;
    }
  }
  return best;
}

/** Ниша запроса — по названию кампании с карт: «стоматология Самарканд» → «стоматология». */
export function nicheOfQuery(query: string): string | null {
  const q = query.toLowerCase();
  return AUTOPILOT_NICHES.find((n) => q.startsWith(`${n.maps.toLowerCase()} `))?.maps ?? null;
}

/**
 * Не сайт компании: соцсети, каталоги, доски объявлений, карты, новости,
 * госсайты. Письмо туда не напишешь, а каталог на сто клиник — это не
 * клиника.
 */
const NOT_A_COMPANY =
  /(^|\.)(instagram\.com|facebook\.com|t\.me|telegram\.me|wa\.me|whatsapp\.com|linktr\.ee|taplink\.(cc|ws|at)|vk\.com|ok\.ru|youtube\.com|tiktok\.com|google\.[a-z.]+|goo\.gl|business\.site|2gis\.[a-z.]+|yandex\.[a-z.]+|olx\.uz|hh\.uz|wikipedia\.org|med24\.uz|32top\.uz|clinics\.uz|glotr\.uz|all\.biz|infoline\.uz|kompass\.com|uybor\.uz|spr\.uz|goldenpages\.uz|yellowpages\.uz|orginfo\.uz|zoon\.ru|tripadvisor\.[a-z.]+|kun\.uz|gazeta\.uz|daryo\.uz|spot\.uz|uzdaily\.uz|podrobno\.uz|repost\.uz|afisha\.uz|lex\.uz|my\.gov\.uz|gov\.uz|edu\.uz|uz\.linkedin\.com|linkedin\.com|reddit\.com|pinterest\.com)$/i;

/** Узбекистан в тексте выдачи — для сайтов не в зоне .uz. */
const ABOUT_UZ = /ташкент|tashkent|toshkent|узбекистан|uzbekistan|o[‘'`ʻ]?zbekiston|самарканд|samarqand|бухар|buxoro|наманган|андижан|фергана|farg[‘'`ʻ]?ona|нукус|карши|qarshi/i;

/**
 * Сайт компании из выдачи — корень сайта, или null, если это не сайт
 * компании в Узбекистане. Сайт не в зоне .uz проходит, только если в
 * заголовке или описании назван Узбекистан или его город: иначе по запросу
 * «стоматология Ташкент» придут московские клиники.
 */
export function companySite(found: { url: string; title: string; description: string }): string | null {
  let url: URL;
  try {
    url = new URL(found.url);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  const host = url.hostname.replace(/^www\./i, "").toLowerCase();
  if (!host.includes(".") || NOT_A_COMPANY.test(host)) return null;
  if (!host.endsWith(".uz") && !ABOUT_UZ.test(`${found.title} ${found.description}`)) return null;
  return `${url.protocol}//${url.hostname}`;
}

/** Путь до Telegram есть: @адрес или мобильный номер (городской — только звонок). */
export function reachable(contacts: Contacts): boolean {
  const route = routeFor(contacts);
  return Boolean(route && route.kind !== "manual");
}

/** Что делать этим проходом: искать новые компании, дописывать контакты или ничего. */
export function nextJob(input: { left: number; reachable: number; enrichable: number }): "search" | "contacts" | null {
  if (input.left <= 0) return null;
  if (input.reachable < LOW_POOL && input.left >= SEARCH_COST) return "search";
  if (input.enrichable > 0) return "contacts";
  // Дописывать некому — лимит дня не пропадает: ищем новые компании.
  return input.left >= SEARCH_COST ? "search" : null;
}
