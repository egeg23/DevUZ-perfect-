/**
 * Месячная проверка сайтов клиентов (lib/proto/trace-month.ts): очередь в
 * `stats_snapshots` (`trace-month:<месяц>`), по TRACE_MONTH_BATCH сайтов за
 * проход свипа, отчёт владельцу и руководителю под «Отчётами», раз в месяц
 * (`trace-month:<месяц>` в team_news_sent). С 11:00 до 21:00 по Ташкенту:
 * ночью бот молчит, а сайты клиентов днём отвечают лучше.
 */
import { wants } from "@/lib/admin/notify-prefs";
import { tashkentHour } from "@/lib/admin/portion";
import { todayInTashkent } from "@/lib/admin/pulse";
import { QUIET_FROM_HOUR } from "@/lib/admin/tasks";
import {
  TRACE_MONTH_BATCH,
  TRACE_MONTH_HOUR,
  monthOf,
  sitesToScan,
  traceMonthKey,
  traceMonthText,
  type Finding,
  type ScanSite,
} from "@/lib/proto/trace-month";
import { traceSite } from "@/lib/proto/trace-store";
import { esc, sendMessage } from "@/lib/qualify/telegram";
import { serviceClient } from "@/lib/supabase";

type Progress = { queue: ScanSite[]; checked: number; findings: Finding[]; failed: string[] };

const panelCheck = (url: string) => `https://devuz.studio/admin/proto?check=${encodeURIComponent(url)}`;

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return url;
  }
};

export async function runTraceMonth(now: Date = new Date()): Promise<number> {
  const hour = tashkentHour(now);
  if (hour < TRACE_MONTH_HOUR || hour >= QUIET_FROM_HOUR) return 0;
  const db = serviceClient();
  if (!db) return 0;
  const month = monthOf(todayInTashkent(now));
  const key = traceMonthKey(month);

  const { data: snap } = await db.from("stats_snapshots").select("payload").eq("key", key).maybeSingle();
  let progress = snap?.payload as Progress | null;
  if (!progress) {
    const { data: rows } = await db
      .from("protos")
      .select("id, name, source, auto, status")
      .not("stamp", "is", null)
      .order("created_at", { ascending: false })
      .limit(1000);
    progress = { queue: sitesToScan(rows ?? []), checked: 0, findings: [], failed: [] };
  }

  const batch = progress.queue.splice(0, TRACE_MONTH_BATCH);
  for (const site of batch) {
    const result = await traceSite(site.url, { views: false }).catch(() => null);
    if (!result?.ok) {
      progress.failed.push(hostOf(site.url));
      continue;
    }
    progress.checked += 1;
    for (const hit of result.hits) {
      if (hit.match.level === "none") continue;
      progress.findings.push({
        site: hostOf(site.url),
        client: site.name,
        url: site.url,
        proto: hit.name,
        own: hit.id === site.id || hostOf(hit.source) === hostOf(site.url),
        level: hit.match.level,
        matched: hit.match.matched,
        total: hit.match.total,
        traps: hit.match.traps,
      });
    }
  }

  if (!snap || batch.length) {
    await db
      .from("stats_snapshots")
      .upsert({ key, payload: progress, computed_at: now.toISOString() }, { onConflict: "key" });
  }
  if (progress.queue.length) return 0;

  const { data: readers } = await db
    .from("staff")
    .select("id, telegram_user_id, notify_off")
    .eq("is_active", true)
    .in("role", ["admin", "head"]);
  const due = (readers ?? []).filter(
    (r) => Number(r.telegram_user_id) && wants((r.notify_off as string[] | null) ?? [], "reports"),
  );
  const text = traceMonthText(
    month,
    progress.checked,
    progress.findings.map((f) => ({
      ...f,
      client: esc(f.client),
      site: esc(f.site),
      proto: esc(f.proto),
      traps: f.traps.map(esc),
    })),
    progress.failed.map(esc),
    panelCheck,
  );
  let sent = 0;
  for (const reader of due) {
    const { data: claimed } = await db
      .from("team_news_sent")
      .upsert({ news_id: key, staff_id: reader.id }, { onConflict: "news_id,staff_id", ignoreDuplicates: true })
      .select("staff_id");
    if (!claimed?.length) continue;
    if (await sendMessage(Number(reader.telegram_user_id), text)) sent += 1;
    else await db.from("team_news_sent").delete().eq("news_id", key).eq("staff_id", reader.id);
  }
  return sent;
}
