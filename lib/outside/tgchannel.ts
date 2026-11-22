import { firstLink, telegramPostHtml, type Platform } from "@/lib/outside/posts";
import { botApiResult, postToChannel } from "@/lib/qualify/telegram";
import { appSecret } from "@/lib/secrets";

/**
 * Telegram-канал студии — бот студии публикует в него сам, без Postiz.
 *
 * Владелец, 22.11.2026: «нам до сих пор очень нужны статьи на внешних
 * источниках, которые бы ты писал сам». Канал заводит человек (у бота нет
 * права создавать каналы) и добавляет бота студии администратором с правом
 * «Публикация сообщений». Адрес канала (@username) лежит в хранилище секретов
 * (`app.OUTSIDE_TG_CHANNEL`): вставляют владелец и руководитель в «Статьях на
 * площадках», пишется только после проверки. Ключ бота — тот же, что у
 * всего бота студии (TELEGRAM_BOT_TOKEN), новых ключей нет.
 */

export const TG_CHANNEL_KEY = "OUTSIDE_TG_CHANNEL";

/** Имя канала без «@»: «@devuz», «t.me/devuz», «https://t.me/devuz» → «devuz». null — не похоже на канал. */
export function channelName(raw: string): string | null {
  const value = raw
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^(www\.)?(t|telegram)\.me\//i, "")
    .replace(/^@/, "")
    .replace(/\/+$/, "");
  return /^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(value) ? value : null;
}

/** Адрес поста в канале. */
export function channelPostUrl(name: string, messageId: number): string {
  return `https://t.me/${name}/${messageId}`;
}

type Chat = { id?: number; type?: string; title?: string; username?: string };
type Member = { status?: string; can_post_messages?: boolean };

export type ChannelCheck = { ok: true; name: string; title: string } | { ok: false; reason: string };

/**
 * Годится ли канал: это канал, у него открытое имя, бот студии в нём
 * администратор с правом публикации. Причина — словами, что сделать.
 */
export function channelVerdict(name: string, chat: Chat | null, member: Member | null): ChannelCheck {
  if (!chat) return { ok: false, reason: "Telegram не нашёл канал: проверьте адрес и что бот студии добавлен в канал" };
  if (chat.type !== "channel") return { ok: false, reason: "Это не канал: нужен именно канал, не группа и не личный чат" };
  if (!chat.username) return { ok: false, reason: "У канала нет открытого адреса (@имя): сделайте канал публичным" };
  if (!member) return { ok: false, reason: "Бот студии не в канале: добавьте его администратором" };
  if (member.status === "creator") return { ok: true, name: chat.username, title: chat.title ?? name };
  if (member.status !== "administrator") return { ok: false, reason: "Бот студии в канале не администратор: сделайте его администратором" };
  if (member.can_post_messages === false) return { ok: false, reason: "У бота нет права «Публикация сообщений»: включите его в правах администратора" };
  return { ok: true, name: chat.username, title: chat.title ?? name };
}

/** Проверка канала через Bot API: getMe → getChat → getChatMember бота. */
export async function checkChannel(raw: string): Promise<ChannelCheck> {
  const name = channelName(raw);
  if (!name) return { ok: false, reason: "Адрес канала: @имя или ссылка t.me/имя" };
  const me = await botApiResult<{ id?: number }>("getMe", {});
  if (!me?.id) return { ok: false, reason: "Бот студии не ответил: попробуйте позже" };
  const chat = await botApiResult<Chat>("getChat", { chat_id: `@${name}` });
  const member = chat ? await botApiResult<Member>("getChatMember", { chat_id: `@${name}`, user_id: me.id }) : null;
  return channelVerdict(name, chat, member);
}

/** Заведён ли канал: адрес в хранилище. */
export async function savedChannel(): Promise<string | null> {
  const raw = await appSecret(TG_CHANNEL_KEY);
  return raw ? channelName(raw) : null;
}

/** Опубликовать пост: адрес поста или почему не вышло. */
export async function channelPublish(title: string, body: string, platform: Platform, topicKey: string): Promise<{ url: string } | { error: string }> {
  const name = await savedChannel();
  if (!name) return { error: "канал Telegram не заведён" };
  const sent = await postToChannel(`@${name}`, telegramPostHtml(title, body, platform, topicKey), firstLink(body, platform, topicKey));
  return "id" in sent ? { url: channelPostUrl(name, sent.id) } : sent;
}
