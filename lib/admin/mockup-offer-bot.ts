import {
  DAILY_HOUR,
  DAILY_LATEST_HOUR,
  PROMO,
  offerLine,
  ownPromo,
  ownPromoLine,
  tashkentDay,
  untilText,
  type OwnPromo,
} from "@/lib/admin/mockup-offer";
import { parseMockupRef } from "@/lib/admin/mockups";
import { TASHKENT_OFFSET_MS } from "@/lib/admin/pulse";
import { mockupCode } from "@/lib/admin/mockups-store";
import type { Staff } from "@/lib/admin/session";
import { createTask } from "@/lib/admin/task-store";
import { esc, sendMessage, sendWithRows, type Button } from "@/lib/qualify/telegram";
import { siteUrl } from "@/lib/seo";
import { serviceClient } from "@/lib/supabase";

/**
 * Макеты клиентов в боте — владельцу и руководителю.
 *
 * Владелец, 13.10.2026: «тем кому мы отправили прототип, Александру и мне
 * вывести список в тг боте, с возможностью поменять статус макета на
 * „закрыть паролем“, макет утверждён > передать в работу на Егора».
 *
 * - «Макеты клиентов» или /mockups — список: кому ушёл макет, сколько
 *   осталось по акции (lib/admin/mockup-offer.ts), что с ним;
 * - «🔒 Закрыть паролем» — пароль на сутки, как в разделе «Макеты»: первый
 *   пароль закрывает открытый макет; бот присылает текст для клиента;
 * - «✅ Утверждён → Егору» — напоминания клиенту прекращаются, Егору
 *   ставится задача «Сайт по макету» со ссылками.
 *
 * Тот же список с кнопками приходит, когда макет уходит клиенту, — чтобы
 * знать о нём сразу, а не в 13:00.
 */

export const MOCKUP_CALLBACK = "mo";

/** Кто видит список и жмёт кнопки. */
export const OFFER_ROLES = ["admin", "head"] as const;

export function mockupsCommand(text: string | null | undefined): boolean {
  const plain = (text ?? "")
    .trim()
    .replace(/^[^\p{L}/]+/u, "")
    .trim()
    .toLowerCase();
  if (!plain) return false;
  return plain === "макеты клиентов" || plain.split(/[\s@]/)[0] === "/mockups";
}

export type MockupCallback = { kind: "password" | "approve"; offerId: string };

/** Разбор кнопки. Мусор — null. */
export function parseMockupCallback(parts: readonly string[]): MockupCallback | null {
  if (parts[0] !== MOCKUP_CALLBACK || parts.length !== 3) return null;
  if (!/^[0-9a-f-]{36}$/.test(parts[2])) return null;
  if (parts[1] === "pw") return { kind: "password", offerId: parts[2] };
  if (parts[1] === "ok") return { kind: "approve", offerId: parts[2] };
  return null;
}

export type OfferRow = {
  id: string;
  mockup_ref: string;
  mockup_name: string;
  mockup_url: string;
  prospect_id: string | null;
  lead_id: string | null;
  client: string;
  peer: string | null;
  status: string;
  sent_at: string;
  expires_at: string;
  password_at: string | null;
  /** Найдено сканом (lib/admin/mockup-scan.ts), а не записано в момент отправки. */
  source?: string | null;
  /** Ушёл давно: клиенту бот не пишет ни условий, ни напоминаний. */
  quiet?: boolean | null;
  /** Своя цена акции макета (protos.facts.promo) — её и пишем клиенту. */
  own?: OwnPromo | null;
};

/**
 * Своя цена акции — из фактов прототипа, одним запросом на всю пачку.
 * Читаем при каждом проходе, а не храним в строке акции: поправили цену в
 * макете — следующее напоминание уже с новой.
 */
export async function withOwnPromos<T extends { mockup_ref: string }>(rows: T[]): Promise<(T & { own: OwnPromo | null })[]> {
  const ids = [
    ...new Set(
      rows.map((r) => parseMockupRef(r.mockup_ref)).flatMap((ref) => (ref?.kind === "proto" ? [ref.id] : [])),
    ),
  ];
  const promos = new Map<string, OwnPromo>();
  const db = ids.length ? serviceClient() : null;
  if (db) {
    const { data, error } = await db.from("protos").select("id, facts").in("id", ids);
    if (error) console.error("акция по макету: не прочитал свои цены", error.message);
    for (const row of data ?? []) {
      const own = ownPromo(row.facts);
      if (own) promos.set(`p:${row.id}`, own);
    }
  }
  return rows.map((r) => ({ ...r, own: promos.get(r.mockup_ref) ?? null }));
}

const OFFER_FIELDS =
  "id, mockup_ref, mockup_name, mockup_url, prospect_id, lead_id, client, peer, status, sent_at, expires_at, password_at, source, quiet";

/** Карточка одного макета: текст и кнопки. Утверждённый — без кнопок. */
export function offerCard(o: OfferRow, now: Date): { text: string; rows: Button[][] } {
  const lines = [
    offerLine({ client: esc(o.client), name: esc(o.mockup_name), status: o.status, expiresAt: o.expires_at, sentAt: o.sent_at, now }),
    `Макет: ${esc(o.mockup_name)} · ${esc(o.mockup_url)}`,
    ...(o.own ? [`Своя цена акции: ${esc(ownPromoLine(o.own))}`] : []),
    `Ушёл: ${untilText(o.sent_at)}${o.source === "scan" ? " · 🔎 найдено сканом" : ""}${o.password_at ? " · 🔒 закрыт паролем" : ""}`,
    ...(o.lead_id ? [`Лид: ${siteUrl}/admin/leads/${o.lead_id}`] : []),
    ...(!o.prospect_id
      ? ["Клиент не из касаний — напоминания ему бот не пишет."]
      : o.quiet && o.status === "active"
        ? ["Найден сканом, ушёл давно — напоминания клиенту бот не пишет."]
        : []),
  ];
  const rows: Button[][] =
    o.status === "approved"
      ? []
      : [
          [
            { text: "🔒 Закрыть паролем", callback_data: `${MOCKUP_CALLBACK}:pw:${o.id}` },
            { text: "✅ Утверждён → Егору", callback_data: `${MOCKUP_CALLBACK}:ok:${o.id}` },
          ],
        ];
  return { text: lines.join("\n"), rows };
}

/** Список: идущие акции и закончившиеся за последние 7 дней. */
export async function offerList(now: Date = new Date()): Promise<OfferRow[]> {
  const db = serviceClient();
  if (!db) return [];
  const since = new Date(now.getTime() - 7 * 24 * 3600_000).toISOString();
  const { data } = await db
    .from("mockup_offers")
    .select(OFFER_FIELDS)
    .or(`status.eq.active,sent_at.gte.${since}`)
    .order("sent_at", { ascending: false })
    .limit(15);
  return withOwnPromos((data ?? []) as OfferRow[]);
}

/** Владелец и руководители с Telegram — им и список, и строки об акциях. */
export async function offerReaders(): Promise<{ id: string; chat: number }[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data } = await db
    .from("staff")
    .select("id, telegram_user_id")
    .eq("is_active", true)
    .in("role", [...OFFER_ROLES]);
  return (data ?? [])
    .map((r) => ({ id: String(r.id), chat: Number(r.telegram_user_id) }))
    .filter((r) => Number.isFinite(r.chat) && r.chat !== 0);
}

/** Прислать список в чат. Пусто — так и сказать. */
export async function sendOfferList(chat: number, now: Date = new Date()): Promise<void> {
  const list = await offerList(now);
  if (!list.length) {
    await sendMessage(chat, "🎨 Макеты клиентов: за неделю макеты с рабочих аккаунтов не уходили.");
    return;
  }
  const active = list.filter((o) => o.status === "active" && Date.parse(o.expires_at) > now.getTime()).length;
  await sendMessage(chat, `🎨 <b>Макеты клиентов</b> · акция идёт у ${active} из ${list.length}`);
  for (const o of list) {
    const card = offerCard(o, now);
    if (card.rows.length) await sendWithRows(chat, card.text, card.rows);
    else await sendMessage(chat, card.text);
  }
}

/** Владелец, который берёт сайт в работу: «Егор» среди владельцев, иначе первый владелец. */
async function builder(): Promise<{ id: string; display_name: string } | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db.from("staff").select("id, display_name").eq("is_active", true).eq("role", "admin");
  const owners = (data ?? []).map((r) => ({ id: String(r.id), display_name: String(r.display_name ?? "") }));
  return owners.find((o) => /^егор/i.test(o.display_name)) ?? owners[0] ?? null;
}

export type ButtonResult = { ok: true; reply: string; card: { text: string; rows: Button[][] } | null } | { ok: false; why: string };

/** Нажатие кнопки под макетом. */
export async function actOnOffer(cb: MockupCallback, staff: Staff, now: Date = new Date()): Promise<ButtonResult> {
  if (!(OFFER_ROLES as readonly string[]).includes(staff.role)) return { ok: false, why: "Только владельцу и руководителю" };
  const db = serviceClient();
  if (!db) return { ok: false, why: "База недоступна" };
  const { data } = await db.from("mockup_offers").select(OFFER_FIELDS).eq("id", cb.offerId).maybeSingle();
  const offer = data ? (await withOwnPromos([data as OfferRow]))[0] : null;
  if (!offer) return { ok: false, why: "Макет не найден" };

  if (cb.kind === "password") {
    const code = await mockupCode(offer.mockup_ref, staff, null);
    if (!code.ok) {
      return { ok: false, why: code.reason === "no_lock" ? "Этот проект витрины открыт всем — пароль ему не ставится" : "Пароль не выдался" };
    }
    await db.from("mockup_offers").update({ password_at: now.toISOString() }).eq("id", offer.id);
    const updated = { ...offer, password_at: now.toISOString() };
    return {
      ok: true,
      reply: `🔒 ${code.closedNow ? "Макет закрыт паролем. " : ""}Пароль ${code.code} — до ${code.until}. Текст для клиента:\n\n${esc(code.message)}`,
      card: offerCard(updated, now),
    };
  }

  // Утверждён: напоминания прекращаются, Егору — задача. Условно: второе
  // нажатие (или второй руководитель) вторую задачу не ставит.
  const { data: claimed } = await db
    .from("mockup_offers")
    .update({ status: "approved", approved_at: now.toISOString(), approved_by: staff.id })
    .eq("id", offer.id)
    .neq("status", "approved")
    .select("id");
  if (!claimed?.length) return { ok: true, reply: "Уже утверждён и передан в работу.", card: offerCard({ ...offer, status: "approved" }, now) };

  const who = await builder();
  let taskNote = "задачу поставить не удалось — поставьте руками";
  if (who) {
    const inPromo = Date.parse(offer.expires_at) > now.getTime();
    const task = await createTask(
      {
        title: `Сайт по макету: ${offer.client || offer.mockup_name}`.slice(0, 150),
        body: [
          `Клиент утвердил макет «${offer.mockup_name}».`,
          `Макет: ${offer.mockup_url}`,
          ...(offer.lead_id ? [`Лид и переписка: ${siteUrl}/admin/leads/${offer.lead_id}`] : []),
          inPromo
            ? offer.own
              ? `Утверждён в срок акции (до ${untilText(offer.expires_at)}): ${ownPromoLine(offer.own)}.`
              : `Утверждён в срок акции (до ${untilText(offer.expires_at)}): лендинг по макету с ${PROMO.landing.addons} допами — ${PROMO.landing.price} $, корпоративный сайт — ${PROMO.corporate.price} $.`
            : `Акция закончилась ${untilText(offer.expires_at)} — цены обычные.`,
          `Передал: ${staff.display_name}.`,
        ].join("\n"),
        assigneeId: who.id,
        due: null,
        projectId: null,
      },
      staff,
      "bot",
      now,
    );
    if (task.ok) {
      taskNote = `задача «${task.task.title}» поставлена: ${who.display_name}`;
      await db.from("mockup_offers").update({ task_id: task.task.id }).eq("id", offer.id);
    }
  }
  return {
    ok: true,
    reply: `✅ Макет утверждён, напоминания клиенту остановлены, ${esc(taskNote)}.`,
    card: offerCard({ ...offer, status: "approved" }, now),
  };
}

/**
 * В 13:00 по Ташкенту — тот же список владельцу и руководителю, если хоть у
 * одного клиента акция идёт: в это же время клиенты получают напоминания.
 * Каждому один раз в день (team_news_sent, ключ «mockup-digest:день»).
 */
export async function sendOfferDigest(now: Date = new Date()): Promise<number> {
  const hour = new Date(now.getTime() + TASHKENT_OFFSET_MS).getUTCHours();
  if (hour < DAILY_HOUR || hour >= DAILY_LATEST_HOUR) return 0;
  const db = serviceClient();
  if (!db) return 0;
  const { count } = await db
    .from("mockup_offers")
    .select("id", { count: "exact", head: true })
    .eq("status", "active")
    .gt("expires_at", now.toISOString());
  if (!count) return 0;

  const key = `mockup-digest:${tashkentDay(now.getTime())}`;
  let sent = 0;
  for (const reader of await offerReaders()) {
    const { data: claimed } = await db
      .from("team_news_sent")
      .upsert({ news_id: key, staff_id: reader.id }, { onConflict: "news_id,staff_id", ignoreDuplicates: true })
      .select("staff_id");
    if (!claimed?.length) continue;
    await sendOfferList(reader.chat, now);
    sent += 1;
  }
  return sent;
}
