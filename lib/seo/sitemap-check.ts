import { siteUrl } from "@/lib/seo";

/**
 * Есть ли только что вышедшие страницы в живой карте сайта.
 *
 * Владелец, 19.10.2026: «После публикации надо всегда убеждаться, что в
 * сайтмап обновление сделано». Карта собирается из базы на каждый запрос
 * (`app/sitemap.ts`, force-dynamic), и в коде страница попадает в неё сама.
 * Проверяем не код, а то, что получит поисковик: тот же адрес
 * `/sitemap.xml`, что читает Google, без обходных параметров — если карту
 * где-то закэшируют, проверка это и покажет.
 *
 * Чужих адресов здесь нет: адрес — наш, из `siteUrl`, поэтому обычный
 * `fetch`, а не защищённый `lib/audit/fetch.ts`.
 */

/** Сколько раз смотреть и с какой паузой: страница могла не успеть. */
export const SITEMAP_TRIES = 3;
export const SITEMAP_GAP_MS = 20_000;

/** Адреса из `<loc>`. */
export function sitemapLocs(xml: string): Set<string> {
  const out = new Set<string>();
  for (const match of xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)) out.add(match[1]);
  return out;
}

/** Каких путей (`/ru/razbor/…`) нет в карте. */
export function missingIn(xml: string, paths: readonly string[]): string[] {
  const locs = sitemapLocs(xml);
  return paths.filter((path) => !locs.has(siteUrl + path));
}

export type SitemapCheck =
  | { ok: true; checked: number }
  | { ok: false; missing: string[] }
  | { ok: null; why: string };

/**
 * Проверить живую карту. Не нашлось — ещё две попытки с паузой: вывод
 * «страницы нет» после одного взгляда спутал бы задержку с поломкой.
 */
export async function checkSitemap(
  paths: readonly string[],
  tries = SITEMAP_TRIES,
  gapMs = SITEMAP_GAP_MS,
): Promise<SitemapCheck> {
  if (!paths.length) return { ok: true, checked: 0 };
  let missing: string[] = [...paths];
  let why = "";
  for (let attempt = 0; attempt < tries; attempt++) {
    if (attempt) await new Promise((resolve) => setTimeout(resolve, gapMs));
    try {
      const response = await fetch(`${siteUrl}/sitemap.xml`, {
        headers: { "user-agent": "devuz-sitemap-check-bot", "cache-control": "no-cache" },
        signal: AbortSignal.timeout(15_000),
        cache: "no-store",
      });
      if (!response.ok) {
        why = `карта ответила ${response.status}`;
        continue;
      }
      missing = missingIn(await response.text(), paths);
      why = "";
      if (!missing.length) return { ok: true, checked: paths.length };
    } catch (error) {
      why = error instanceof Error ? error.message : String(error);
    }
  }
  return why ? { ok: null, why } : { ok: false, missing };
}

/** Строка для отчёта в Telegram. */
export function sitemapLine(check: SitemapCheck): string {
  if (check.ok === true) return `Карта сайта: все ${check.checked} адресов на месте.`;
  if (check.ok === false) return `⚠️ В карте сайта нет: ${check.missing.map((p) => siteUrl + p).join(" ")}.`;
  return `⚠️ Карту сайта проверить не удалось: ${check.why}.`;
}
