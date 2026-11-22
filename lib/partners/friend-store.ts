import { company } from "@/content/company";
import { friendCopy } from "@/content/friend-bot";
import { record } from "@/lib/admin/audit";
import { NO_ORDER } from "@/lib/admin/mockup-order";
import { wants } from "@/lib/admin/notify-prefs";
import type { Staff } from "@/lib/admin/session";
import { createTask } from "@/lib/admin/task-store";
import { messageWindow } from "@/lib/admin/tasks";
import {
  FRIEND_GIFT_USD,
  FRIEND_MIN_USD,
  friendStateOf,
  friendStats,
  giftNewsKey,
  type FriendPayment,
  type FriendProject,
  type FriendStats,
} from "@/lib/partners/friend";
import { botLink, promoOf, shortUrl } from "@/lib/partners/rules";
import { defaultSlugs, leadCounts, notifyPartner, type Partner } from "@/lib/partners/store";
import { botLangOf } from "@/lib/proto/instant/store";
import { esc, sendMessage } from "@/lib/qualify/telegram";
import { siteUrl } from "@/lib/seo";
import { serviceClient } from "@/lib/supabase";

/**
 * «Приведи друга — сайт бесплатно»: база (lib/partners/friend.ts — правила).
 *
 * Прогресс участника считается на лету из его заявок и проектов, как
 * начисления партнёров; хранится только отметка «о подарке уже сказали» —
 * `friend-gift:<проект>` в team_news_sent.
 */

const FRIEND_COLUMNS =
  "id, created_at, telegram_user_id, username, name, code, promo, requisites, status, percent_override, note, payout_model, model_changed_at, accumulate, kind, contact, website, brought_by, brought_at";

/** Все участники программы — для вкладки «Друзья» и раздачи подарков. */
export async function listFriends(): Promise<Partner[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data, error } = await db
    .from("partners")
    .select(FRIEND_COLUMNS)
    .eq("kind", "friend")
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) {
    console.error("друзья: не прочитал участников", error.message);
    return [];
  }
  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    return {
      id: String(r.id),
      created_at: String(r.created_at),
      telegram_user_id: r.telegram_user_id === null ? null : Number(r.telegram_user_id),
      username: (r.username as string | null) ?? null,
      name: String(r.name ?? ""),
      code: String(r.code ?? ""),
      promo: (r.promo as string | null) ?? null,
      requisites: null,
      status: r.status === "blocked" ? "blocked" : "active",
      percent_override: null,
      note: (r.note as string | null) ?? null,
      payout_model: "turnover",
      model_changed_at: null,
      accumulate: false,
      kind: "friend",
      contact: null,
      website: null,
      brought_by: null,
      brought_at: null,
    } satisfies Partner;
  });
}

type FriendData = { projects: FriendProject[]; payments: FriendPayment[] };

async function friendData(ids: readonly string[]): Promise<FriendData> {
  const db = serviceClient();
  if (!db || !ids.length) return { projects: [], payments: [] };
  const { data } = await db
    .from("projects")
    .select("id, partner_id, amount_usd, stage, partner_void_reason, title, client, created_at")
    .in("partner_id", [...ids])
    .limit(5000);
  const projects: FriendProject[] = (data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    return {
      id: String(r.id),
      partner_id: r.partner_id ? String(r.partner_id) : null,
      amount_usd: r.amount_usd === null || r.amount_usd === undefined ? null : Number(r.amount_usd),
      stage: String(r.stage ?? ""),
      partner_void_reason: (r.partner_void_reason as string | null) ?? null,
      title: (r.title as string | null) ?? null,
      client: (r.client as string | null) ?? null,
      created_at: (r.created_at as string | null) ?? null,
    };
  });
  if (!projects.length) return { projects, payments: [] };
  const { data: pays } = await db
    .from("project_payments")
    .select("project_id, amount_usd")
    .in("project_id", projects.map((p) => p.id))
    .limit(5000);
  const payments = (pays ?? []).map((r) => ({ project_id: String(r.project_id), amount_usd: Number(r.amount_usd) || 0 }));
  return { projects, payments };
}

/** Прогресс каждого участника: пришли, заказали, оплатили (= сайтов заработано). */
export async function friendProgress(friends: readonly Partner[]): Promise<Map<string, FriendStats>> {
  const ids = friends.map((f) => f.id);
  const [came, data] = await Promise.all([leadCounts(ids), friendData(ids)]);
  const out = new Map<string, FriendStats>();
  for (const id of ids) {
    out.set(
      id,
      friendStats(
        id,
        came.get(id) ?? 0,
        data.projects.filter((p) => p.partner_id === id),
        data.payments,
      ),
    );
  }
  return out;
}

/** Ссылки участника: короткая на сайт и на бота, слово. */
export async function friendLinks(partner: Partner): Promise<{ link: string; bot: string; word: string }> {
  const word = promoOf(partner);
  const slug = (await defaultSlugs([partner.id])).get(partner.id);
  return {
    link: slug ? shortUrl(siteUrl, slug) : `${siteUrl}/?ref=${partner.code}`,
    bot: botLink(company.telegram, word),
    word,
  };
}

/** Сказать участнику, что по его ссылке пришёл друг: на языке, который он выбрал в боте. */
export async function tellFriendCame(partner: Partner, who: string | null): Promise<void> {
  if (!partner.telegram_user_id) return;
  const lang = await botLangOf(partner.telegram_user_id).catch(() => null);
  await notifyPartner(partner, friendCopy(lang).came(who));
}

/* ── Подарок: друг оплатил ─────────────────────────────────────────────── */

/** Не больше стольких подарков за проход свипа: остальные — в следующий. */
const GIFTS_PER_PASS = 10;

type Reader = { id: string; telegram_user_id: number; notify_off: string[] | null; role: string; display_name: string; username: string | null };

/**
 * Друг оплатил проект от цены лендинга целиком — пригласившему заработан
 * сайт. Раз на проект (`friend-gift:<проект>`): владельцу и руководителю
 * строка в боте под «Отчётами», задача «Подарочный сайт для …» тому, кто вёл
 * лид пригласившего (нет такого — владельцу), и сообщение самому
 * пригласившему. Ночью (21:00–08:00) не идёт ничего: утром — по порядку.
 */
export async function deliverFriendGifts(now: Date = new Date()): Promise<number> {
  if (!messageWindow(now)) return 0;
  const db = serviceClient();
  if (!db) return 0;
  const friends = (await listFriends()).filter((f) => f.status === "active");
  if (!friends.length) return 0;
  const { projects, payments } = await friendData(friends.map((f) => f.id));
  const earned = projects.filter((p) => {
    const friend = friends.find((f) => f.id === p.partner_id);
    return friend && friendStateOf(p, friend.id, payments) === "earned";
  });
  if (!earned.length) return 0;

  const keys = earned.map((p) => giftNewsKey(p.id));
  const { data: done } = await db.from("team_news_sent").select("news_id").in("news_id", keys);
  const told = new Set((done ?? []).map((r) => String(r.news_id)));
  const due = earned.filter((p) => !told.has(giftNewsKey(p.id))).slice(0, GIFTS_PER_PASS);
  if (!due.length) return 0;

  const { data: staffRows } = await db
    .from("staff")
    .select("id, telegram_user_id, notify_off, role, display_name, username")
    .eq("is_active", true)
    .in("role", ["admin", "head"]);
  const readers = (staffRows ?? []) as Reader[];
  const owner = readers.find((r) => r.role === "admin");
  if (!owner) return 0;

  let sent = 0;
  for (const project of due) {
    const friend = friends.find((f) => f.id === project.partner_id);
    if (!friend) continue;
    // Отметка — до сообщений: второй проход свипа того же подарка не повторит.
    const { data: claimed } = await db
      .from("team_news_sent")
      .upsert({ news_id: giftNewsKey(project.id), staff_id: owner.id }, { onConflict: "news_id,staff_id", ignoreDuplicates: true })
      .select("staff_id");
    if (!claimed?.length) continue;

    const who = friend.username ? `${friend.name} (@${friend.username})` : friend.name;
    const friendClient = project.client?.trim() || project.title?.trim() || "клиент";
    const assignee = (await inviterOwner(friend)) ?? owner.id;
    const actor: Staff = {
      id: owner.id,
      telegram_user_id: Number(owner.telegram_user_id),
      username: owner.username,
      display_name: owner.display_name,
      role: "admin",
      panel_locale: "ru",
    };
    const task = await createTask(
      {
        title: `Подарочный сайт для ${who}`.slice(0, 150),
        body: [
          `Программа «Приведи друга»: друг ${friend.name} заказал и оплатил целиком «${friendClient}» (${project.amount_usd ?? 0} $).`,
          `Пригласившему — лендинг по нашему макету бесплатно, без допов (как акция ${FRIEND_MIN_USD} $), или ${FRIEND_GIFT_USD} $ в зачёт его собственного заказа, если он уже клиент.`,
          "Это подарок, не сделка: в грейд и премию не идёт.",
          friend.username ? `Написать: https://t.me/${friend.username}` : `Telegram id: ${friend.telegram_user_id ?? "нет"}`,
          `Проект друга: ${siteUrl}/admin/projects/${project.id}`,
        ].join("\n"),
        assigneeId: assignee,
        due: null,
        projectId: null,
        order: { ...NO_ORDER, mockup: false },
      },
      actor,
      "bot",
      now,
    );

    const line = [
      "🎁 <b>Друг оплатил — подарочный сайт</b>",
      `Пригласил: ${esc(who)}`,
      `Друг: «${esc(friendClient)}», ${project.amount_usd ?? 0} $, оплачено целиком`,
      `Подарок: лендинг по макету или ${FRIEND_GIFT_USD} $ в зачёт его заказа`,
      task.ok ? `Задача: ${esc(task.task.title)}` : "Задача не поставилась — поставьте руками.",
      `${siteUrl}/admin/friends`,
    ].join("\n");
    for (const reader of readers) {
      if (!Number(reader.telegram_user_id) || !wants(reader.notify_off ?? [], "reports")) continue;
      await sendMessage(Number(reader.telegram_user_id), line);
    }
    if (friend.telegram_user_id) {
      const lang = await botLangOf(friend.telegram_user_id).catch(() => null);
      await notifyPartner(friend, friendCopy(lang).earned(FRIEND_GIFT_USD));
    }
    await record("partner.friend_gift", {
      targetType: "partner",
      targetId: friend.id,
      meta: { project: project.id, amount_usd: project.amount_usd, task: task.ok ? task.task.id : null, assignee },
    });
    sent += 1;
  }
  return sent;
}

/**
 * Кто вёл лид самого пригласившего: последний его лид с хозяином — по нику
 * в Telegram. Нет — null, задачу получит владелец.
 */
async function inviterOwner(friend: Partner): Promise<string | null> {
  const db = serviceClient();
  if (!db || !friend.username) return null;
  const name = friend.username.replace(/[%_,()]/g, "");
  const { data } = await db
    .from("leads")
    .select("assigned_staff_id, created_at")
    .or(`tg_username.ilike.${name},contact_handle.ilike.@${name}`)
    .not("assigned_staff_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1);
  const id = data?.[0]?.assigned_staff_id;
  if (!id) return null;
  const { data: person } = await db.from("staff").select("id").eq("id", id).eq("is_active", true).maybeSingle();
  return person ? String(person.id) : null;
}
