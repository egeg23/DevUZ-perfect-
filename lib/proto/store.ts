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
import { withBase } from "@/lib/proto/pages";
import { STAMP_VERSION, newSeed, stampHtml, stampPages, type Stamp } from "@/lib/proto/stamp";
import { mockupTermsUrl } from "@/lib/proto/booking";
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
      // Отпечаток — у каждого прототипа свой (lib/proto/stamp): правило
      // владельца для всех макетов, CLAUDE.md «Макеты и прототипы».
      ...(() => {
        const stamped = stampHtml(build.html, newSeed());
        return { html: stamped.html, stamp: stamped.stamp };
      })(),
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
 *
 * `path` — страница внутри прототипа из нескольких страниц (lib/proto/pages);
 * пустой — главная. Страницы, которой нет, — нет и ответа: 404, как на
 * чужой токен.
 */
export async function protoPage(token: string, path = ""): Promise<{ html: string; id: string } | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db
    .from("protos")
    .select("id, html, pages, status, stamp, facts")
    .eq("token", token)
    .maybeSingle();
  if (!data) return null;
  // Черновик наружу не отдаётся: это страница, не прошедшая проверку.
  if (data.status === "draft") return null;
  const id = String(data.id);
  let html = String(data.html);
  let pages = (data.pages ?? {}) as Record<string, string>;
  const stamp = data.stamp as Stamp | null;
  if (!stamp || stamp.v < STAMP_VERSION) {
    const upgraded = await upgradeProto(id, html, data.facts as ProtoFacts, stamp, pages);
    if (upgraded) ({ html, pages } = upgraded);
  }
  const page = path ? pages[path] : html;
  return typeof page === "string" ? { html: withBase(page, token), id } : null;
}

/**
 * Прототип, собранный до отпечатков и до ссылки на условия, — перерисовать.
 *
 * Правило владельца — для всех макетов, сделанных раньше тоже. Страница
 * собирается заново из тех же фактов: то, что клиенту отправили, по
 * содержанию не меняется, добавляются подвал с условиями и отпечаток. Не
 * собралась (проверка с тех пор стала строже) — старая страница остаётся,
 * к ней дописывается строка про условия и ставится отпечаток.
 *
 * Условие в update — тот же отпечаток, что прочитали: открыли дважды в одну
 * секунду — перерисует один, второй отдаст уже записанное.
 */
export async function upgradeProto(
  id: string,
  html: string,
  facts: ProtoFacts,
  stamp: Stamp | null,
  pages: Readonly<Record<string, string>> = {},
): Promise<{ html: string; pages: Record<string, string> } | null> {
  const db = serviceClient();
  if (!db) return null;
  const build = buildProto(facts);
  let base = build && !build.missing.length && !build.problems.length && build.html ? build.html : html;
  if (!base.includes("mockup-terms")) {
    const locale = facts?.locale === "uz" ? "uz" : "ru";
    const line =
      locale === "uz"
        ? "Prototip DevUz Studio’ga tegishli. Undan faqat shartnoma asosida foydalanish mumkin —"
        : "Прототип принадлежит DevUz Studio. Использовать его можно только по договору —";
    const link = locale === "uz" ? "foydalanish shartlari" : "условия использования";
    base = base.replace(
      /<\/footer>/,
      `<span>${line} <a href="${mockupTermsUrl(locale)}">${link}</a></span></footer>`,
    );
  }
  // Остальные страницы прототипа — тем же зерном, что и главная.
  const stamped = stampPages(base, pages, newSeed());
  const query = db.from("protos").update({ html: stamped.html, pages: stamped.pages, stamp: stamped.stamp }).eq("id", id);
  const { data } = await (stamp ? query.eq("stamp->>seed", stamp.seed) : query.is("stamp", null)).select("html");
  if (data?.length) return { html: stamped.html, pages: stamped.pages };
  const { data: fresh } = await db.from("protos").select("html, pages").eq("id", id).maybeSingle();
  return fresh ? { html: String(fresh.html), pages: (fresh.pages ?? {}) as Record<string, string> } : null;
}

/** Перерисовать все старые прототипы — пачкой, из панели. */
export async function upgradeAllProtos(limit = 50): Promise<number> {
  const db = serviceClient();
  if (!db) return 0;
  const { data } = await db.from("protos").select("id, html, facts, stamp, pages").is("stamp", null).limit(limit);
  let done = 0;
  for (const row of data ?? []) {
    if (await upgradeProto(String(row.id), String(row.html), row.facts as ProtoFacts, null, row.pages ?? {})) done += 1;
  }
  return done;
}

/**
 * Журнал показа: открытие живым человеком — время, адрес, браузер, откуда
 * пришёл. Доказательство того, что клиент видел макет (условия, раздел 5).
 */
export async function logView(
  id: string,
  input: { ip: string | null; userAgent: string | null; referer: string | null; path?: string },
): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  await db.from("proto_views").insert({
    proto_id: id,
    ip: input.ip?.slice(0, 64) ?? null,
    user_agent: input.userAgent?.slice(0, 400) ?? null,
    referer: input.referer?.slice(0, 400) ?? null,
    // Какая страница прототипа: пусто — главная.
    path: input.path || null,
  });
}

/** Отпечатки всех прототипов — для «Проверить сайт». */
export async function protoStamps(): Promise<
  { id: string; name: string; source: string; created_at: string; sent_at: string | null; opened_at: string | null; opens: number; stamp: Stamp }[]
> {
  const db = serviceClient();
  if (!db) return [];
  const { data } = await db
    .from("protos")
    .select("id, name, source, created_at, sent_at, opened_at, opens, stamp")
    .not("stamp", "is", null)
    .order("created_at", { ascending: false })
    .limit(1000);
  return (data ?? []).map((row) => ({
    id: String(row.id),
    name: String(row.name),
    source: String(row.source),
    created_at: String(row.created_at),
    sent_at: (row.sent_at as string | null) ?? null,
    opened_at: (row.opened_at as string | null) ?? null,
    opens: Number(row.opens ?? 0),
    stamp: row.stamp as Stamp,
  }));
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

/** Последние открытия прототипа из журнала показа. */
export async function protoViews(id: string, limit = 5): Promise<{ at: string; ip: string | null }[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data } = await db
    .from("proto_views")
    .select("at, ip")
    .eq("proto_id", id)
    .order("at", { ascending: false })
    .limit(limit);
  return (data ?? []).map((row) => ({ at: String(row.at), ip: (row.ip as string | null) ?? null }));
}
