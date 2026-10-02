/**
 * «Проверить сайт»: открыть чужую страницу, собрать её стили и сверить с
 * отпечатками всех наших прототипов (lib/proto/trace).
 *
 * Стили берутся отовсюду, где они бывают: блоки <style>, атрибуты style и
 * подключённые файлы — свои и чужие (сборщики кладут их на CDN). Адреса
 * проходят ту же проверку, что у аудитора: во внутреннюю сеть не ходим.
 */
import { probe } from "@/lib/audit/fetch";
import { protoStamps, protoViews } from "@/lib/proto/store";
import { matchStamp, signalsOf, type Match } from "@/lib/proto/trace";

/** Сколько файлов стилей читать: на обычном сайте их меньше пяти. */
const MAX_CSS = 12;

export type TraceHit = {
  kind: "proto";
  id: string;
  name: string;
  source: string;
  created_at: string;
  sent_at: string | null;
  opened_at: string | null;
  opens: number;
  match: Match;
  views: { at: string; ip: string | null }[];
};

export type TraceResult =
  | { ok: true; url: string; cssFiles: number; signals: number; hits: TraceHit[]; attributed: string | null }
  | { ok: false; error: string };

export async function traceSite(raw: string): Promise<TraceResult> {
  let page;
  try {
    page = await probe(raw);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
  if (page.status >= 400) return { ok: false, error: `${page.finalUrl} — ${page.status}` };

  const html = page.html;
  const parts: string[] = [];
  for (const m of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) parts.push(m[1]);
  for (const m of html.matchAll(/\sstyle\s*=\s*"([^"]*)"/gi)) parts.push(m[1]);

  const hrefs = [
    ...new Set(
      [...html.matchAll(/<link\b[^>]*>/gi)]
        .map((m) => m[0])
        .filter((tag) => /rel\s*=\s*["']?[^"'>]*stylesheet/i.test(tag))
        .map((tag) => tag.match(/href\s*=\s*["']([^"']+)["']/i)?.[1])
        .filter((href): href is string => Boolean(href))
        .map((href) => {
          try {
            return new URL(href, page.finalUrl).href;
          } catch {
            return null;
          }
        })
        .filter((href): href is string => Boolean(href) && !/fonts\.googleapis\.com/.test(href!)),
    ),
  ].slice(0, MAX_CSS);

  let cssFiles = 0;
  for (const href of hrefs) {
    try {
      const css = await probe(href);
      if (css.status < 400) {
        parts.push(css.html);
        cssFiles += 1;
      }
    } catch {
      // Файл не открылся — сверяем по тому, что есть.
    }
  }

  const found = signalsOf(parts.join("\n"));
  const stamps = await protoStamps();
  const hits: TraceHit[] = [];
  for (const proto of stamps) {
    const match = matchStamp(proto.stamp, found);
    if (match.level === "none") continue;
    hits.push({ kind: "proto", ...proto, match, views: [] });
  }
  hits.sort((a, b) => b.match.matched / b.match.total - a.match.matched / a.match.total);

  // Кому показывали: лучший набор заметно впереди второго. Иначе — «наш», но
  // клиента по отпечатку не различить, и это честнее сказать прямо.
  const [best, second] = hits;
  const share = (h: TraceHit | undefined) => (h ? h.match.matched / h.match.total : 0);
  const attributed =
    best && best.match.level === "strong" && share(best) >= 0.7 && share(best) - share(second) >= 0.25 ? best.id : null;

  for (const hit of hits.slice(0, 5)) hit.views = await protoViews(hit.id, 5);

  return { ok: true, url: page.finalUrl, cssFiles, signals: found.size, hits: hits.slice(0, 10), attributed };
}
