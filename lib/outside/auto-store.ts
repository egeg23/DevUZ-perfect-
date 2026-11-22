import { record } from "@/lib/admin/audit";
import type { Staff } from "@/lib/admin/session";
import { AUTO_PLATFORMS, PLATFORM, type Platform } from "@/lib/outside/posts";
import { POSTIZ_KEY, channelFor, postizChannels, type PostizChannel } from "@/lib/outside/postiz";
import { markAutoFailed, markAutoPublished, mayChoosePublisher, readyPost } from "@/lib/outside/store";
import { opens } from "@/lib/admin/roles";
import { VCRU_LOGIN_KEY, VCRU_REFRESH_KEY, vcruMe, vcruPublish, vcruSignIn } from "@/lib/outside/vcru";
import { TELEGRAPH_KEY } from "@/lib/outside/telegraph";
import { TG_CHANNEL_KEY, channelName, checkChannel } from "@/lib/outside/tgchannel";
import { VK_KEY, checkVk } from "@/lib/outside/vk";
import { appSecret, saveAppSecret } from "@/lib/secrets";
import { serviceClient } from "@/lib/supabase";

/**
 * «Публикуется само» в «Статьях на площадках»: ключ Postiz и что он видит.
 *
 * Ключ вставляют владелец и руководитель (те же, кто выбирает «Кто
 * публикует»). Сначала ключ проверяется у Postiz, и только потом пишется в
 * хранилище секретов; обратно — только «задано / пусто», в журнал — без
 * значения. Итог проверки (какие каналы видны и какие наши площадки
 * подключены) — строкой stats_snapshots, её читают раздел и недельный заход.
 */

export const POSTIZ_CHECK_KEY = "postiz-check";

export type PostizCheck = {
  at: string;
  ok: boolean;
  reason: string | null;
  channels: { name: string; identifier: string }[];
  /** Наши площадки, у которых в Postiz есть включённый канал. */
  ready: Platform[];
};

/** Итог проверки канала Telegram и сообщества ВКонтакте — без ключей, только что видно на экране. */
export type DirectCheck = { at: string; ok: boolean; reason: string | null; name: string | null; url: string | null };

export const DIRECT_CHECK_KEY = { tg: "outside-tg-check", vk: "outside-vk-check", vcru: "outside-vcru-check" } as const;

export type AutoState = {
  postizKey: boolean;
  telegraphKey: boolean;
  check: PostizCheck | null;
  tgChannel: boolean;
  vkKey: boolean;
  tgCheck: DirectCheck | null;
  vkCheck: DirectCheck | null;
  vcruLogin: boolean;
  vcruCheck: DirectCheck | null;
};

export function checkOf(channels: readonly PostizChannel[], now: Date): PostizCheck {
  return {
    at: now.toISOString(),
    ok: true,
    reason: null,
    channels: channels.map((c) => ({ name: c.name, identifier: c.identifier })),
    ready: AUTO_PLATFORMS.filter((p) => PLATFORM[p].postiz && channelFor(channels, p)),
  };
}

async function saveCheck(check: PostizCheck): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  await db.from("stats_snapshots").upsert({ key: POSTIZ_CHECK_KEY, payload: check, computed_at: check.at }, { onConflict: "key" });
}

async function saveDirect(key: string, check: DirectCheck): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  await db.from("stats_snapshots").upsert({ key, payload: check, computed_at: check.at }, { onConflict: "key" });
}

function asDirect(payload: unknown): DirectCheck | null {
  const p = payload as DirectCheck | null;
  return p && typeof p.at === "string" ? p : null;
}

export async function readAuto(): Promise<AutoState> {
  const db = serviceClient();
  const [postiz, telegraph, tg, vk, vcru, rows] = await Promise.all([
    appSecret(POSTIZ_KEY),
    appSecret(TELEGRAPH_KEY),
    appSecret(TG_CHANNEL_KEY),
    appSecret(VK_KEY),
    appSecret(VCRU_LOGIN_KEY),
    db
      ? db.from("stats_snapshots").select("key, payload").in("key", [POSTIZ_CHECK_KEY, DIRECT_CHECK_KEY.tg, DIRECT_CHECK_KEY.vk, DIRECT_CHECK_KEY.vcru])
      : Promise.resolve({ data: null }),
  ]);
  const byKey = new Map(((rows.data ?? []) as { key: string; payload: unknown }[]).map((r) => [r.key, r.payload]));
  const payload = (byKey.get(POSTIZ_CHECK_KEY) ?? null) as PostizCheck | null;
  return {
    postizKey: Boolean(postiz),
    telegraphKey: Boolean(telegraph),
    check: payload && typeof payload.at === "string" ? payload : null,
    tgChannel: Boolean(tg),
    vkKey: Boolean(vk),
    tgCheck: asDirect(byKey.get(DIRECT_CHECK_KEY.tg)),
    vkCheck: asDirect(byKey.get(DIRECT_CHECK_KEY.vk)),
    vcruLogin: Boolean(vcru),
    vcruCheck: asDirect(byKey.get(DIRECT_CHECK_KEY.vcru)),
  };
}

export type SaveResult = "ok" | "bad" | "forbidden" | "failed";

/**
 * «Сохранить и проверить» канал Telegram: пустое поле — проверить уже
 * сохранённый; новый адрес пишется, только если бот студии в нём
 * администратор с правом публикации. Адрес канала публичный, но лежит в
 * хранилище вместе с остальными настройками публикации.
 */
export async function saveTgChannel(staff: Staff, raw: string, ip: string, now = new Date()): Promise<SaveResult> {
  if (!mayChoosePublisher(staff)) return "forbidden";
  const typed = raw.trim();
  const value = typed || (await appSecret(TG_CHANNEL_KEY)) || "";
  if (typed && !channelName(typed)) return "bad";
  const check = value ? await checkChannel(value) : ({ ok: false, reason: "Канал не задан" } as const);
  if (!check.ok) {
    await saveDirect(DIRECT_CHECK_KEY.tg, { at: now.toISOString(), ok: false, reason: check.reason, name: null, url: null });
    return "bad";
  }
  if (typed && !(await saveAppSecret(TG_CHANNEL_KEY, `@${check.name}`))) return "failed";
  await saveDirect(DIRECT_CHECK_KEY.tg, { at: now.toISOString(), ok: true, reason: null, name: check.title, url: `https://t.me/${check.name}` });
  await record("outside.tg_channel_saved", { actorStaffId: staff.id, targetType: "secret", targetId: TG_CHANNEL_KEY, meta: { new_value: Boolean(typed) }, ip });
  return "ok";
}

/** «Сохранить и проверить» ключ сообщества ВКонтакте: пишется, только если ВКонтакте его принял и право «Стена» есть. */
export async function saveVkKey(staff: Staff, raw: string, ip: string, now = new Date()): Promise<SaveResult> {
  if (!mayChoosePublisher(staff)) return "forbidden";
  const typed = raw.trim();
  if (typed && (typed.length > 400 || typed.length < 20 || /\s/.test(typed))) return "bad";
  const token = typed || (await appSecret(VK_KEY)) || "";
  const check = token ? await checkVk(token) : ({ ok: false, reason: "Ключ не задан" } as const);
  if (!check.ok) {
    await saveDirect(DIRECT_CHECK_KEY.vk, { at: now.toISOString(), ok: false, reason: check.reason, name: null, url: null });
    return "bad";
  }
  if (typed && !(await saveAppSecret(VK_KEY, typed))) return "failed";
  await saveDirect(DIRECT_CHECK_KEY.vk, { at: now.toISOString(), ok: true, reason: null, name: check.group.name || check.group.screen, url: `https://vk.com/${check.group.screen}` });
  await record("outside.vk_key_saved", { actorStaffId: staff.id, targetType: "secret", targetId: VK_KEY, meta: { new_key: Boolean(typed) }, ip });
  return "ok";
}

/**
 * «Сохранить и проверить»: пустое поле — проверить уже сохранённый ключ;
 * новый ключ пишется, только если Postiz его принял.
 */
export async function savePostizKey(staff: Staff, raw: string, ip: string, now = new Date()): Promise<"ok" | "bad" | "forbidden" | "failed"> {
  if (!mayChoosePublisher(staff)) return "forbidden";
  const key = raw.trim();
  if (key && (key.length > 300 || /\s/.test(key))) return "bad";
  const channels = await postizChannels(key || undefined);
  if ("error" in channels) {
    await saveCheck({ at: now.toISOString(), ok: false, reason: channels.error, channels: [], ready: [] });
    return "bad";
  }
  if (key && !(await saveAppSecret(POSTIZ_KEY, key))) return "failed";
  const check = checkOf(channels, now);
  await saveCheck(check);
  await record("outside.postiz_key_saved", {
    actorStaffId: staff.id,
    targetType: "secret",
    targetId: POSTIZ_KEY,
    meta: { new_key: Boolean(key), channels: check.channels.length, ready: check.ready },
    ip,
  });
  return "ok";
}

/**
 * «Сохранить и проверить» вход vc.ru: почта и пароль пишутся, только если
 * vc.ru пустил и назвал аккаунт. Пустые поля — проверить сохранённый вход.
 * Ключ обновления после входа — тоже в хранилище (им дальше и входим).
 */
export async function saveVcruLogin(staff: Staff, email: string, password: string, ip: string, now = new Date()): Promise<SaveResult> {
  if (!mayChoosePublisher(staff)) return "forbidden";
  const mail = email.trim();
  const typed = Boolean(mail || password);
  if (typed && (!/^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(mail) || !password || password.length > 200)) return "bad";
  let login: { email: string; password: string } | null = typed ? { email: mail, password } : null;
  if (!login) {
    try {
      const saved = JSON.parse((await appSecret(VCRU_LOGIN_KEY)) ?? "null") as { email?: string; password?: string } | null;
      login = saved?.email && saved.password ? { email: saved.email, password: saved.password } : null;
    } catch {
      login = null;
    }
  }
  const fail = async (reason: string): Promise<SaveResult> => {
    await saveDirect(DIRECT_CHECK_KEY.vcru, { at: now.toISOString(), ok: false, reason, name: null, url: null });
    return "bad";
  };
  if (!login) return fail("Вход не задан");
  const pair = await vcruSignIn(login);
  if ("error" in pair) return fail(pair.error);
  const me = await vcruMe(pair.accessToken);
  if ("error" in me) return fail(me.error);
  if (typed && !(await saveAppSecret(VCRU_LOGIN_KEY, JSON.stringify(login)))) return "failed";
  await saveAppSecret(VCRU_REFRESH_KEY, pair.refreshToken);
  await saveDirect(DIRECT_CHECK_KEY.vcru, { at: now.toISOString(), ok: true, reason: null, name: me.name || `id${me.id}`, url: me.url });
  await record("outside.vcru_saved", { actorStaffId: staff.id, targetType: "secret", targetId: VCRU_LOGIN_KEY, meta: { new_login: typed }, ip });
  return "ok";
}

/**
 * «Опубликовать на vc.ru» у черновика vc.ru в «Ждут публикации»: любой, кому
 * открыт раздел, — как «Опубликовал», только публикует код. Не вышло —
 * причина у черновика, он остаётся ждать.
 */
export async function publishVcruNow(staff: Staff, id: string, ip: string, now = new Date()): Promise<"vcruok" | "vcrubad" | "missing" | "failed"> {
  if (!opens(staff, "/admin/outside")) return "failed";
  const post = await readyPost(id);
  if (!post || post.platform !== "vcru") return "missing";
  const res = await vcruPublish(post.title, post.body, post.platform, post.topic_key);
  if ("error" in res) {
    await markAutoFailed(id, res.error);
    return "vcrubad";
  }
  if (!(await markAutoPublished(id, post.platform, "vcru", res.url, now))) return "failed";
  await record("outside.published", { actorStaffId: staff.id, targetType: "outside_post", targetId: id, meta: { platform: post.platform, topic: post.topic_key, url: res.url, via: "vcru" }, ip });
  return "vcruok";
}
