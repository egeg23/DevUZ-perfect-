/* Telegram-бот CZECHFARM: токен от @BotFather. Две роли у одного бота:
   - сотрудник, привязавший Telegram в панели, получает каждое обращение с
     кнопкой «Взял», а ответ (Reply) на уведомление уходит клиенту в бот;
   - клиент пишет боту: бот отвечает на частые вопросы из панели, остальное
     становится обращением в панели.
   Обновления приходят вебхуком с секретом в X-Telegram-Bot-Api-Secret-Token. */

export function tgClient(token, fetchImpl = fetch) {
  async function call(method, body) {
    if (!token) throw new Error("Telegram-бот не подключён");
    const r = await fetchImpl(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body || {}),
      signal: AbortSignal.timeout(15000),
    });
    const j = await r.json().catch(() => ({}));
    if (!j.ok) throw new Error(r.status === 401 || r.status === 404 ? "Telegram не принял токен бота" : `Telegram: ${j.description || r.status}`);
    return j.result;
  }
  return {
    me: () => call("getMe"),
    setHook: (url, secret) => call("setWebhook", { url, secret_token: secret, allowed_updates: ["message", "callback_query"], drop_pending_updates: false }),
    dropHook: () => call("deleteWebhook", {}),
    photo: (chat, photo, caption = "", extra = {}) => call("sendPhoto", { chat_id: chat, photo, caption: String(caption).slice(0, 1024), ...extra }),
    send: (chat, text, extra = {}) => call("sendMessage", { chat_id: chat, text: String(text).slice(0, 4096), disable_web_page_preview: true, ...extra }),
    edit: (chat, messageId, text, extra = {}) => call("editMessageText", { chat_id: chat, message_id: messageId, text: String(text).slice(0, 4096), disable_web_page_preview: true, ...extra }),
    answer: (id, text) => call("answerCallbackQuery", { callback_query_id: id, text: String(text || "").slice(0, 190) }),
    commands: (list) => call("setMyCommands", { commands: list }),
  };
}

/* Что пришло в вебхук: личное сообщение или нажатие кнопки. */
export function tgUpdate(update) {
  const cb = update && update.callback_query;
  if (cb && cb.message) {
    const f = cb.from || {};
    return { kind: "button", id: cb.id, chat: String(cb.message.chat.id), messageId: cb.message.message_id, data: String(cb.data || ""), name: [f.first_name, f.last_name].filter(Boolean).join(" ") || f.username || "" };
  }
  const m = update && update.message;
  if (!m || !m.chat || m.chat.type !== "private") return null;
  const text = (m.text || m.caption || "").trim();
  const what = m.text ? "text" : m.photo ? "фото" : m.voice ? "голосовое" : m.video_note ? "кружок" : m.video ? "видео" : m.document ? "файл" : m.sticker ? "стикер" : "сообщение";
  const f = m.from || {};
  return {
    kind: "message", chat: String(m.chat.id), messageId: m.message_id, at: (m.date || 0) * 1000 || Date.now(),
    text: text || `[${what}]`, name: [f.first_name, f.last_name].filter(Boolean).join(" ") || f.username || "Без имени",
    photo: m.photo && m.photo.length ? m.photo[m.photo.length - 1].file_id : "",
    username: f.username || "", lang: String(f.language_code || "").slice(0, 2), replyTo: m.reply_to_message ? m.reply_to_message.message_id : null,
    start: /^\/start(?:\s+(\S+))?$/.exec(m.text || "")?.[1] ?? (m.text === "/start" ? "" : null),
  };
}

/* Частый вопрос, на который похоже сообщение клиента: по словам вопроса из
   панели, не короче 4 букв. Без модели: ответ — ровно текст из панели. */
export function faqMatch(text, faq) {
  const words = (s) => String(s).toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter((w) => w.length >= 4);
  const got = new Set(words(text).map((w) => w.slice(0, 5)));
  let best = null, score = 0;
  for (const f of faq) {
    const ws = [...new Set(words(f.q).map((w) => w.slice(0, 5)))];
    if (!ws.length) continue;
    const hit = ws.filter((w) => got.has(w)).length / ws.length;
    if (hit > score) { score = hit; best = f; }
  }
  return score >= 0.5 ? best : null;
}
