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
import { matchStamp, scriptSignalsOf, signalsOf, type Match } from "@/lib/proto/trace";

/** Сколько файлов стилей читать: на обычном сайте их меньше пяти. */
const MAX_CSS = 12;
/** Сколько файлов скриптов: свои, не счётчики и не виджеты. */
const MAX_JS = 8;

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
  | {
      ok: true;
      url: string;
      cssFiles: number;
      jsFiles: number;
      signals: number;
      hits: TraceHit[];
      attributed: string | null;
    }
  | { ok: false; error: string };

/** Чужие скрипты, в которых нашего быть не может: счётчики, чаты, карты. */
const FOREIGN_JS =
  /googletagmanager|google-analytics|gstatic|mc\.yandex|yandex\.ru\/(?:metrika|map)|api-maps|facebook\.net|jivo|bitrix24|tawk|cdn\.jsdelivr|unpkg|cdnjs|recaptcha/i;

export async function traceSite(raw: string, opts: { views?: boolean } = {}): Promise<TraceResult> {
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

  // Скрипты: встроенные и свои файлы — для чисел, которые сдвигает
  // отпечаток, и для слов-ловушек в демо-данных.
  const scripts: string[] = [];
  for (const m of html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)) scripts.push(m[1]);
  const srcs = [
    ...new Set(
      [...html.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi)]
        .map((m) => {
          try {
            return new URL(m[1], page.finalUrl).href;
          } catch {
            return null;
          }
        })
        .filter((src): src is string => Boolean(src) && !FOREIGN_JS.test(src!)),
    ),
  ].slice(0, MAX_JS);
  let jsFiles = 0;
  for (const src of srcs) {
    try {
      const js = await probe(src);
      if (js.status < 400) {
        scripts.push(js.html);
        jsFiles += 1;
      }
    } catch {
      // Не открылся — сверяем по остальному.
    }
  }

  const found = signalsOf(parts.join("\n"));
  for (const signal of scriptSignalsOf(scripts.join("\n"))) found.add(signal);
  const text = `${html}\n${scripts.join("\n")}`;
  const stamps = await protoStamps();
  const hits: TraceHit[] = [];
  for (const proto of stamps) {
    const match = matchStamp(proto.stamp, found, text);
    if (match.level === "none") continue;
    hits.push({ kind: "proto", ...proto, match, views: [] });
  }
  hits.sort((a, b) => b.match.matched / Math.max(1, b.match.total) - a.match.matched / Math.max(1, a.match.total));

  // Кому показывали: лучший набор заметно впереди второго. Иначе — «наш», но
  // клиента по отпечатку не различить, и это честнее сказать прямо.
  // Слова-ловушки свои у каждого клиента: два слова одного макета и ни
  // одного у второго — клиент назван, сколько бы чисел ни совпало.
  const words = (h: TraceHit | undefined) => h?.match.traps.length ?? 0;
  hits.sort((a, b) => words(b) - words(a));
  const [best, second] = hits;
  const share = (h: TraceHit | undefined) => (h ? h.match.matched / Math.max(1, h.match.total) : 0);
  const attributed =
    best && best.match.level === "strong" && words(best) >= 2 && words(second) === 0
      ? best.id
      : best && best.match.level === "strong" && share(best) >= 0.7 && share(best) - share(second) >= 0.25
        ? best.id
        : null;

  if (opts.views !== false) for (const hit of hits.slice(0, 5)) hit.views = await protoViews(hit.id, 5);

  return { ok: true, url: page.finalUrl, cssFiles, jsFiles, signals: found.size, hits: hits.slice(0, 10), attributed };
}
