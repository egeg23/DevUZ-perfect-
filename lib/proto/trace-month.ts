/**
 * Раз в месяц — сайты клиентов, которым мы делали макет: не появилось ли там
 * нашего.
 *
 * Владелец, 30.10.2026: «раз в месяц я хочу чтобы автоматически прогонялся
 * клиент, для которого мы делали макет и у него на сайте обнаружены наши
 * наработки». Проверка — та же «Проверить сайт на наш макет»
 * (lib/proto/trace-store): числа оформления и скриптов, слова-ловушки из
 * демо-данных. Сайт сверяется со всеми нашими макетами, не только со своим:
 * клиент мог взять и чужой.
 *
 * Здесь — правила без базы; очередь, проверка и рассылка — trace-month-store.ts.
 * Модели нет.
 */

/** Сколько сайтов за один проход свипа: у каждого до двадцати файлов. */
export const TRACE_MONTH_BATCH = 3;
/** С этого часа по Ташкенту — проверка и отчёт; до 21:00 (ночью бот молчит). */
export const TRACE_MONTH_HOUR = 11;

export const traceMonthKey = (month: string) => `trace-month:${month}`;

/** «2026-11» из «2026-11-03». */
export const monthOf = (day: string) => day.slice(0, 7);

export type ScanSite = { id: string; name: string; url: string };

/** Свои макеты с сайтом клиента — по одному адресу на сайт. */
export function sitesToScan(
  rows: readonly { id: string; name: string | null; source: string | null; auto?: boolean | null; status?: string | null }[],
): ScanSite[] {
  const seen = new Set<string>();
  const out: ScanSite[] = [];
  for (const row of rows) {
    if (row.auto || row.status === "draft") continue;
    const url = (row.source ?? "").trim();
    if (!/^https?:\/\//i.test(url)) continue;
    let host: string;
    try {
      host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    } catch {
      continue;
    }
    if (!host.includes(".") || /(^|\.)devuz\.studio$/.test(host)) continue;
    if (seen.has(host)) continue;
    seen.add(host);
    out.push({ id: row.id, name: (row.name ?? host).trim() || host, url });
  }
  return out;
}

export type Finding = {
  site: string;
  client: string;
  url: string;
  /** Какой наш макет нашёлся. */
  proto: string;
  /** Это макет, который делали этому же клиенту. */
  own: boolean;
  level: "strong" | "likely";
  matched: number;
  total: number;
  traps: string[];
};

const MONTHS = ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"];

/** Строка отчёта. Тексты уже экранированы. */
export function traceMonthText(
  month: string,
  checked: number,
  findings: readonly Finding[],
  failed: readonly string[],
  panel: (url: string) => string,
): string {
  const [y, m] = month.split("-");
  const head = `🔎 <b>Сайты клиентов · ${MONTHS[Number(m) - 1] ?? m} ${y}</b>`;
  const lines = [head, `Проверено сайтов клиентов, которым делали макет: ${checked}.`];
  if (!findings.length) lines.push("Нашего не нашли.");
  else {
    lines.push("", "⚠️ <b>Нашли наше:</b>");
    for (const f of findings) {
      const what = f.level === "strong" ? "точно наш макет" : "похоже на наш макет";
      const whose = f.own ? "тот, что делали им" : "макет другого клиента";
      const traps = f.traps.length ? `, слова-ловушки: ${f.traps.join(", ")}` : "";
      lines.push(
        `• ${f.client} (${f.site}): ${what} «${f.proto}», ${whose}; совпало ${f.matched} из ${f.total}${traps}. <a href="${panel(f.url)}">Проверка в панели</a>`,
      );
    }
    lines.push("", "Для претензии: откройте проверку в панели, сохраните результат и закажите нотариальный осмотр сайта.");
  }
  if (failed.length) lines.push("", `Не открылись: ${failed.join(", ")}.`);
  return lines.join("\n");
}
