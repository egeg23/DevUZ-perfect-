import { issueLogin } from "@/lib/ai-staff/auth";
import { TAKE_PREFIX } from "@/lib/ai-staff/notify";
import { handleIncoming, humanReplied } from "@/lib/ai-staff/service";
import * as store from "@/lib/ai-staff/store";
import { esc, sendHtml, sendText, tg, typing, type InlineButton } from "@/lib/ai-staff/telegram";
import { siteUrl } from "@/lib/seo";

/**
 * Бот сервиса ИИ-сотрудников (не бот студии — у него свой токен,
 * AI_STAFF_BOT_TOKEN, и свой вебхук). Три работы:
 *
 * 1. Вход и регистрация владельцев и менеджеров клиента: /start → ссылка в
 *    кабинет; /start join_<код> → менеджер в команде клиента.
 * 2. Telegram Business: владелец подключил бота в настройках Telegram —
 *    приходят business_connection и business_message; ИИ отвечает от его
 *    имени. Сообщение самого владельца — перехват разговора человеком.
 * 3. Заявки людям клиента и кнопка «Беру» под ними.
 *
 * Бот первым не пишет никому из покупателей: на business_message он только
 * отвечает, и Telegram сам пускает его лишь в чаты, где покупатель писал
 * за последние 24 часа.
 */

type User = { id: number; is_bot?: boolean; first_name?: string; last_name?: string; username?: string; language_code?: string };
type Chat = { id: number; type: string };
type Message = {
  message_id: number;
  chat: Chat;
  from?: User;
  text?: string;
  caption?: string;
  date?: number;
  business_connection_id?: string;
  sender_business_bot?: User;
  voice?: unknown;
  audio?: unknown;
  video_note?: unknown;
  video?: unknown;
  photo?: unknown;
  document?: unknown;
  sticker?: unknown;
};
type BusinessConnection = {
  id: string;
  user: User;
  user_chat_id: number;
  is_enabled: boolean;
  can_reply?: boolean;
  rights?: { can_reply?: boolean };
};

export type BotUpdate = {
  update_id?: number;
  message?: Message;
  callback_query?: { id: string; from: User; data?: string; message?: { message_id: number; chat: Chat; text?: string } };
  business_connection?: BusinessConnection;
  business_message?: Message;
};

export function person(user: User): store.TgPerson {
  return {
    id: user.id,
    name: [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username || String(user.id),
    username: user.username ?? null,
  };
}

const uz = (user?: User) => user?.language_code === "uz";

/** Покупатель прислал не текст: модели нечего отдать (legal.md: голос и фото не храним). */
export function isMedia(message: Message): boolean {
  return Boolean(message.voice || message.audio || message.video_note || message.video || message.photo || message.document || message.sticker);
}

export function messageText(message: Message): string {
  return (message.text ?? message.caption ?? "").trim();
}

async function loginButton(user: User, label: string): Promise<InlineButton[][]> {
  const login = await issueLogin(person(user));
  return [[{ text: label, url: `${siteUrl}/cabinet/enter/${login}` }]];
}

async function onPrivate(token: string, message: Message): Promise<void> {
  const user = message.from;
  if (!user || user.is_bot) return;
  const text = messageText(message);
  const inUz = uz(user);

  const join = /^\/start\s+join_([a-f0-9]{16,64})$/.exec(text);
  if (join) {
    const tenant = await store.tenantByInvite(join[1]);
    if (!tenant) {
      await sendHtml(token, message.chat.id, inUz ? "Taklif havolasi eskirgan. Rahbaringizdan yangisini so'rang." : "Ссылка-приглашение устарела. Попросите у руководителя новую.");
      return;
    }
    await store.addMember(tenant.id, person(user));
    await sendHtml(
      token,
      message.chat.id,
      inUz
        ? `Siz «${esc(tenant.name)}» jamoasiga qo'shildingiz. Sun'iy intellekt topshirgan arizalar shu yerga keladi.`
        : `Вы в команде «${esc(tenant.name)}». Заявки, которые передаёт ИИ-сотрудник, будут приходить сюда.`,
      await loginButton(user, inUz ? "Kabinetni ochish" : "Открыть кабинет"),
    );
    return;
  }

  if (/^\/(start|login|kabinet|cabinet)\b/.test(text) || !text.startsWith("/")) {
    const memberships = await store.membershipsOf(user.id);
    const has = memberships.length > 0;
    const intro = has
      ? inUz
        ? "Kabinetga kirish havolasi 15 daqiqa amal qiladi."
        : "Ссылка для входа в кабинет действует 15 минут."
      : inUz
        ? "<b>Sun'iy intellekt sotuvchi</b> mijozlaringizga Telegram va saytda 24/7 javob beradi, narxlaringiz bo'yicha, va arizani menejeringizga topshiradi.\n\nKabinet yarating: 10 daqiqada sozlanadi, 14 kun bepul."
        : "<b>ИИ-менеджер продаж</b> отвечает вашим покупателям в Telegram и на сайте круглосуточно, по вашему прайсу, и передаёт заявку вашему менеджеру.\n\nСоздайте кабинет: настройка за 10 минут, 14 дней бесплатно.";
    await sendHtml(
      token,
      message.chat.id,
      intro,
      await loginButton(user, has ? (inUz ? "Kabinetni ochish" : "Открыть кабинет") : inUz ? "Kabinet yaratish" : "Создать кабинет"),
    );
  }
}

async function onCallback(token: string, query: NonNullable<BotUpdate["callback_query"]>): Promise<void> {
  const data = query.data ?? "";
  const answer = (text: string) => tg(token, "answerCallbackQuery", { callback_query_id: query.id, text });
  if (!data.startsWith(TAKE_PREFIX)) return void (await answer(""));
  const leadId = data.slice(TAKE_PREFIX.length);
  // Заявку ищем только в кабинетах того, кто нажал: чужую кнопка не найдёт.
  for (const m of await store.membershipsOf(query.from.id)) {
    const lead = await store.leadById(m.tenant_id, leadId);
    if (!lead) continue;
    if (lead.status !== "new") {
      await answer(`Заявку уже взял ${lead.taken_by ?? "коллега"}`);
      return;
    }
    const who = person(query.from).name;
    await store.setLeadStatus(m.tenant_id, lead.id, "taken", who);
    await answer("Заявка ваша");
    if (query.message) {
      await tg(token, "editMessageReplyMarkup", {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
        reply_markup: { inline_keyboard: [[{ text: `✋ Взял: ${who}`, url: `${siteUrl}/cabinet/leads` }]] },
      });
    }
    return;
  }
  await answer("Заявка не найдена");
}

async function onConnection(token: string, connection: BusinessConnection): Promise<void> {
  const owner = connection.user;
  const canReply = connection.rights?.can_reply ?? connection.can_reply ?? false;
  const memberships = (await store.membershipsOf(owner.id)).filter((m) => m.role === "owner");
  const inUz = uz(owner);
  if (!memberships.length) {
    await sendHtml(
      token,
      connection.user_chat_id,
      inUz
        ? "Bot ulandi, lekin sizda hali kabinet yo'q. Kabinet yarating, keyin sun'iy intellekt mijozlaringizga javob bera boshlaydi."
        : "Бот подключён, но кабинета у вас ещё нет. Создайте кабинет, и ИИ начнёт отвечать вашим покупателям.",
      await loginButton(owner, inUz ? "Kabinet yaratish" : "Создать кабинет"),
    );
    return;
  }
  const tenant = memberships[0].tenant;
  await store.saveBusinessChannel(tenant.id, {
    connectionId: connection.id,
    ownerUserId: owner.id,
    title: person(owner).name,
    canReply,
    enabled: connection.is_enabled,
  });
  const text = !connection.is_enabled
    ? "ИИ-сотрудник отключён от вашего Telegram и больше не отвечает покупателям."
    : canReply
      ? `Готово: ИИ-сотрудник «${esc(tenant.name)}» отвечает покупателям в вашем Telegram. Напишете в чат сами, и ИИ замолчит в этом чате на 12 часов.`
      : "Бот подключён, но без права отвечать. В настройках Telegram → «Чат-боты» включите «Отвечать на сообщения».";
  await sendHtml(token, connection.user_chat_id, text);
}

async function onBusinessMessage(token: string, message: Message): Promise<void> {
  if (message.chat.type !== "private" || !message.business_connection_id) return;
  if (message.sender_business_bot) return; // наш собственный ответ
  const channel = await store.channelByExternal("tg_business", message.business_connection_id);
  if (!channel || channel.status !== "active" || !channel.can_reply) return;
  const from = message.from;
  if (!from || from.is_bot) return;
  const chatKey = String(message.chat.id);
  const text = messageText(message);

  if (from.id === channel.owner_user_id) {
    if (text) await humanReplied({ tenantId: channel.tenant_id, chatKey, channel, text });
    return;
  }

  await typing(token, message.chat.id, message.business_connection_id);
  const outcome = await handleIncoming({
    tenantId: channel.tenant_id,
    channel,
    kind: "tg_business",
    chatKey,
    text,
    media: isMedia(message),
    customer: { name: person(from).name, handle: from.username ? `@${from.username}` : null },
    sentAt: message.date ? new Date(message.date * 1000) : undefined,
  });
  const reply = outcome.kind === "reply" ? outcome.text : outcome.kind === "stopped" ? outcome.text : null;
  if (reply) await sendText(token, message.chat.id, reply, { businessConnectionId: message.business_connection_id });
}

export async function handleServiceUpdate(token: string, update: BotUpdate): Promise<void> {
  if (update.business_connection) return onConnection(token, update.business_connection);
  if (update.business_message) return onBusinessMessage(token, update.business_message);
  if (update.callback_query) return onCallback(token, update.callback_query);
  if (update.message && update.message.chat.type === "private") return onPrivate(token, update.message);
}

/** Сообщение покупателя боту клиента. Отвечает ИИ тем же ботом. */
export async function handleClientBotUpdate(token: string, channel: store.Channel, update: BotUpdate): Promise<void> {
  const message = update.message;
  if (!message || message.chat.type !== "private" || !message.from || message.from.is_bot) return;
  let text = messageText(message);
  // /start — покупатель открыл бота: это приветствие, а не команда модели.
  if (/^\/start\b/.test(text)) text = uz(message.from) ? "Assalomu alaykum" : "Здравствуйте";
  await typing(token, message.chat.id);
  const outcome = await handleIncoming({
    tenantId: channel.tenant_id,
    channel,
    kind: "tg_bot",
    chatKey: String(message.chat.id),
    text,
    media: isMedia(message),
    customer: { name: person(message.from).name, handle: message.from.username ? `@${message.from.username}` : null },
    sentAt: message.date ? new Date(message.date * 1000) : undefined,
  });
  const reply = outcome.kind === "reply" ? outcome.text : outcome.kind === "stopped" ? outcome.text : null;
  if (reply) await sendText(token, message.chat.id, reply);
}

/** Запомненные update_id: Telegram повторяет обновление, если ответ задержался. */
const seen = new Map<string, number>();
export function firstTime(scope: string, updateId: number | undefined, now = Date.now()): boolean {
  if (updateId === undefined) return true;
  const key = `${scope}:${updateId}`;
  if (seen.has(key)) return false;
  seen.set(key, now);
  if (seen.size > 5000) for (const [k, at] of seen) if (now - at > 3_600_000) seen.delete(k);
  return true;
}
