import { metrika, metrikaCounter, type MetrikaResponse } from "@/lib/analytics/traffic";
import { appSecret } from "@/lib/secrets";
import { serviceClient } from "@/lib/supabase";

/**
 * Снимок поведения посетителей сайта из Яндекс Метрики — раз в сутки, в базу.
 *
 * Владелец, 06.10.2026: «Людей приходит нормально на сайт, но заявок нет
 * почти… посмотреть… почему они уходят… может ты сам самооптимизацию
 * проведешь?». Тепловые карты и Вебвизор Яндекс через API не отдаёт, а
 * отчёты по страницам, устройствам и целям — отдаёт. Снимок кладётся в
 * stats_snapshots (`metrika-ux`): по нему видно, где люди уходят, и по нему
 * же сравнивается «до» и «после» каждой правки сайта — без ключа Метрики в
 * чьих-то руках: токен остаётся на сервере.
 *
 * Окно — 28 дней (четыре полные недели: будни и выходные в одной пропорции).
 * Запросы — по одному: у API ограничение на одновременные.
 */

const KEY = "metrika-ux";
const DAYS = 28;
/** Свежий снимок не пересчитываем: сутки минус запас на неровный шаг свипа. */
const FRESH_MS = 20 * 3600_000;

const VISIT = "ym:s:visits,ym:s:bounceRate,ym:s:avgVisitDurationSeconds,ym:s:pageDepth";

type Row = { name: string; visits: number; bounce: number; seconds: number; depth: number };

function rows(r: MetrikaResponse, names = 1): Row[] {
  return (r.data ?? []).map((row) => ({
    name: row.dimensions
      .slice(0, names)
      .map((d) => String(d.name ?? "—"))
      .join(" · "),
    visits: Math.round(row.metrics[0] ?? 0),
    bounce: Math.round((row.metrics[1] ?? 0) * 10) / 10,
    seconds: Math.round(row.metrics[2] ?? 0),
    depth: Math.round((row.metrics[3] ?? 0) * 100) / 100,
  }));
}

function counts(r: MetrikaResponse, names = 1): { name: string; n: number }[] {
  return (r.data ?? []).map((row) => ({
    name: row.dimensions
      .slice(0, names)
      .map((d) => String(d.name ?? "—"))
      .join(" · "),
    n: Math.round(row.metrics[0] ?? 0),
  }));
}

export type UxSnapshot = {
  from: string;
  to: string;
  totals: { visits: number; users: number; bounce: number; seconds: number; depth: number };
  devices: Row[];
  landing: Row[];
  landingByDevice: Row[];
  exits: { name: string; n: number }[];
  sources: Row[];
  countries: { name: string; n: number }[];
  /** Целевые действия (lib/visit/goal.ts): визиты с параметром goal.<имя>. */
  goals: { name: string; n: number }[];
  goalsByDevice: { name: string; n: number }[];
};

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function buildUxSnapshot(now: Date = new Date()): Promise<UxSnapshot | null> {
  const token = await appSecret("YANDEX_METRIKA_TOKEN");
  if (!token) return null;
  const to = isoDay(new Date(now.getTime() - 24 * 3600_000));
  const from = isoDay(new Date(now.getTime() - DAYS * 24 * 3600_000));
  const base = { ids: metrikaCounter(), date1: from, date2: to, lang: "ru" };
  const ask = (params: Record<string, string>) => metrika(token, { ...base, ...params });

  const totals = await ask({ metrics: `${VISIT},ym:s:users` });
  const devices = await ask({ metrics: VISIT, dimensions: "ym:s:deviceCategory", sort: "-ym:s:visits", limit: "5" });
  const landing = await ask({ metrics: VISIT, dimensions: "ym:s:startURLPath", sort: "-ym:s:visits", limit: "40" });
  const landingByDevice = await ask({
    metrics: VISIT,
    dimensions: "ym:s:startURLPath,ym:s:deviceCategory",
    sort: "-ym:s:visits",
    limit: "40",
  });
  const exits = await ask({ metrics: "ym:s:visits", dimensions: "ym:s:endURLPath", sort: "-ym:s:visits", limit: "25" });
  const sources = await ask({ metrics: VISIT, dimensions: "ym:s:lastTrafficSource", sort: "-ym:s:visits", limit: "10" });
  const countries = await ask({ metrics: "ym:s:visits", dimensions: "ym:s:regionCountry", sort: "-ym:s:visits", limit: "10" });
  const goals = await ask({
    metrics: "ym:s:visits",
    dimensions: "ym:s:paramsLevel1,ym:s:paramsLevel2",
    filters: "ym:s:paramsLevel1=='goal'",
    sort: "-ym:s:visits",
    limit: "30",
  });
  const goalsByDevice = await ask({
    metrics: "ym:s:visits",
    dimensions: "ym:s:paramsLevel2,ym:s:deviceCategory",
    filters: "ym:s:paramsLevel1=='goal'",
    sort: "-ym:s:visits",
    limit: "60",
  });

  const t = totals.totals ?? [];
  return {
    from,
    to,
    totals: {
      visits: Math.round(t[0] ?? 0),
      bounce: Math.round((t[1] ?? 0) * 10) / 10,
      seconds: Math.round(t[2] ?? 0),
      depth: Math.round((t[3] ?? 0) * 100) / 100,
      users: Math.round(t[4] ?? 0),
    },
    devices: rows(devices),
    landing: rows(landing),
    landingByDevice: rows(landingByDevice, 2),
    exits: counts(exits),
    sources: rows(sources),
    countries: counts(countries),
    goals: counts(goals, 2).map((g) => ({ ...g, name: g.name.replace(/^goal · /, "") })),
    goalsByDevice: counts(goalsByDevice, 2),
  };
}

/** Проход свипа: снимок старше суток — пересчитать. Ошибка Метрики свип не роняет. */
export async function refreshUxSnapshot(now: Date = new Date()): Promise<"fresh" | "saved" | "no_key" | "offline"> {
  const db = serviceClient();
  if (!db) return "offline";
  const { data } = await db.from("stats_snapshots").select("computed_at").eq("key", KEY).maybeSingle();
  if (data && now.getTime() - Date.parse(String(data.computed_at)) < FRESH_MS) return "fresh";
  const snapshot = await buildUxSnapshot(now);
  if (!snapshot) return "no_key";
  await db
    .from("stats_snapshots")
    .upsert({ key: KEY, payload: snapshot, computed_at: now.toISOString() }, { onConflict: "key" });
  return "saved";
}
