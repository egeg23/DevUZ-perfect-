/**
 * Прототипы в базе: сборка, ссылка и отметка о том, что её открыли.
 *
 * Готовая страница кладётся целиком (см. комментарий в 0033). Здесь важно
 * второе следствие того же решения: пересобрать прототип — это не «показать
 * по-новому», а записать новый html поверх старого. Пока мы этого не сделали,
 * человек по своей ссылке видит ровно то, что ему отправили.
 */
import { record } from "@/lib/admin/audit";
import type { Staff } from "@/lib/admin/session";
import { newAccessToken } from "@/lib/store/access";
import type { ProtoProblem } from "@/lib/proto/check";
import { missingParts, type ProtoFacts } from "@/lib/proto/facts";
import { buildProto } from "@/lib/proto/render";
import { siteUrl } from "@/lib/seo";
import { serviceClient } from "@/lib/supabase";

export type ProtoStatus = "draft" | "ready" | "sent";

export type Proto = {
  id: string;
  token: string;
  prospect_id: string | null;
  niche: string;
  locale: "ru" | "uz";
  name: string;
  source: string;
  facts: ProtoFacts;
  problems: ProtoProblem[];
  status: ProtoStatus;
  created_at: string;
  sent_at: string | null;
  opened_at: string | null;
  opens: number;
  /** Собран сам, для касания (lib/proto/auto), а не менеджером в панели. */
  auto: boolean;
};

const COLUMNS =
  "id, token, prospect_id, niche, locale, name, source, facts, problems, status, created_at, sent_at, opened_at, opens, auto";

function shape(row: Record<string, unknown>): Proto {
  return {
    id: String(row.id),
    token: String(row.token),
    prospect_id: (row.prospect_id as string | null) ?? null,
    niche: String(row.niche),
    locale: row.locale === "uz" ? "uz" : "ru",
    name: String(row.name),
    source: String(row.source),
    facts: row.facts as ProtoFacts,
    problems: Array.isArray(row.problems) ? (row.problems as ProtoProblem[]) : [],
    status: (row.status as ProtoStatus) ?? "draft",
    created_at: String(row.created_at),
    sent_at: (row.sent_at as string | null) ?? null,
    opened_at: (row.opened_at as string | null) ?? null,
    opens: Number(row.opens ?? 0),
    auto: row.auto === true,
  };
}

/** Публичная ссылка на прототип — та, что уходит клиенту. */
export function protoUrl(token: string): string {
  return `${siteUrl}/proto/${token}`;
}

export type SaveResult =
  | { ok: true; proto: Proto; problems: ProtoProblem[] }
  | { ok: false; why: SaveFailure; detail?: string };

/**
 * Почему не собралось — кодом: текст на языке панели подбирает страница
 * (content/admin-panel/proto.ts). В `detail` — данные: ключ ниши, коды
 * недостающего через запятую (MissingPart), ответ базы.
 */
export type SaveFailure = "niche" | "missing" | "offline" | "failed";

/**
 * Собрать прототип и положить в базу.
 *
 * Прототип с непустым списком претензий всё равно сохраняется — со статусом
 * `draft`. Смотреть на брак полезнее, чем на сообщение об ошибке: половина
 * проблем видна глазом за секунду. Наружу такой прототип не уходит: ссылку
 * отдаёт `markSent`, и она требует `ready`.
 */
export async function saveProto(input: {
  facts: ProtoFacts;
  prospectId?: string | null;
  by?: Staff | null;
  /** Собран сам, для касания. */
  auto?: boolean;
}): Promise<SaveResult> {
  const build = buildProto(input.facts);
  if (!build) return { ok: false, why: "niche", detail: input.facts.niche };
  if (build.missing.length) return { ok: false, why: "missing", detail: missingParts(input.facts).join(",") };

  const db = serviceClient();
  if (!db) return { ok: false, why: "offline" };

  const { data, error } = await db
    .from("protos")
    .insert({
      token: newAccessToken(),
      prospect_id: input.prospectId ?? null,
      niche: input.facts.niche,
      locale: input.facts.locale,
      name: input.facts.name,
      source: input.facts.source,
      facts: input.facts,
      html: build.html,
      problems: build.problems,
      status: build.problems.length ? "draft" : "ready",
      created_by: input.by?.id ?? null,
      auto: input.auto ?? false,
    })
    .select(COLUMNS)
    .single();

  if (error || !data) return { ok: false, why: "failed", detail: error?.message };

  const proto = shape(data as Record<string, unknown>);
  await record("proto.build", {
    actorStaffId: input.by?.id ?? null,
    targetType: "proto",
    targetId: proto.id,
    meta: { name: proto.name, niche: proto.niche, problems: build.problems.length, auto: proto.auto },
  });
  return { ok: true, proto, problems: build.problems };
}

export async function protosList(limit = 50): Promise<Proto[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data } = await db.from("protos").select(COLUMNS).order("created_at", { ascending: false }).limit(limit);
  return (data ?? []).map((row) => shape(row as Record<string, unknown>));
}

export async function protoById(id: string): Promise<Proto | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db.from("protos").select(COLUMNS).eq("id", id).maybeSingle();
  return data ? shape(data as Record<string, unknown>) : null;
}

/**
 * Страница по токену — то, что видит владелец бизнеса.
 *
 * Возвращается сам html, а не запись: маршруту больше ничего не нужно, а
 * тащить в него факты и претензии значит однажды показать их наружу.
 */
export async function protoPage(token: string): Promise<{ html: string; id: string } | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db.from("protos").select("id, html, status").eq("token", token).maybeSingle();
  if (!data) return null;
  // Черновик наружу не отдаётся: это страница, не прошедшая проверку.
  if (data.status === "draft") return null;
  return { html: String(data.html), id: String(data.id) };
}

/**
 * Отметить, что ссылку открыли, и узнать, первое ли это открытие.
 *
 * Первое — повод позвать того, кто ведёт касание (lib/proto/opened):
 * владелец бизнеса прямо сейчас смотрит на свой новый сайт.
 */
export async function markOpened(
  id: string,
): Promise<{ first: boolean; prospectId: string | null; name: string } | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data, error } = await db.rpc("proto_seen", { proto: id });
  const row = Array.isArray(data) ? data[0] : data;
  if (error || !row) {
    // Старая база без proto_seen: счётчик всё равно должен расти.
    if (error) await db.rpc("proto_opened", { proto: id });
    return null;
  }
  return {
    first: row.first_open === true,
    prospectId: (row.prospect_id as string | null) ?? null,
    name: String(row.name ?? ""),
  };
}

/**
 * Касание с прототипом ушло — прототип считается отправленным.
 *
 * Зовёт очередь касаний при отметке «отправлено»: ссылка ушла вместе с
 * письмом, и по `sent_at` прототипа видно, когда клиент мог её открыть.
 */
export async function markAutoSent(prospectId: string): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  await db
    .from("protos")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("prospect_id", prospectId)
    .eq("auto", true)
    .eq("status", "ready");
}

/** Прототип ушёл клиенту. Ссылку возвращает тот, кто отправляет. */
export async function markSent(id: string, by: Staff | null): Promise<string | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db
    .from("protos")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "ready")
    .select("token")
    .maybeSingle();
  if (!data) return null;
  await record("proto.sent", { actorStaffId: by?.id ?? null, targetType: "proto", targetId: id });
  return String(data.token);
}
