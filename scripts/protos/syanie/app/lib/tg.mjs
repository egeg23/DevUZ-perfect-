/* Telegram-бот клиники: токен от @BotFather. Бот делает две вещи:
   - пациенты пишут ему, переписка падает в «Сообщения» админки;
   - сотрудник, привязавший свой Telegram, получает новые заявки и сообщения
     из всех каналов и отвечает пациенту ответом (Reply) на уведомление.
   Обновления приходят вебхуком с секретом в заголовке
   X-Telegram-Bot-Api-Secret-Token. */

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
    setHook: (url, secret) => call("setWebhook", { url, secret_token: secret, allowed_updates: ["message"], drop_pending_updates: false }),
    dropHook: () => call("deleteWebhook", {}),
    send: (chat, text, extra = {}) => call("sendMessage", { chat_id: chat, text: String(text).slice(0, 4096), disable_web_page_preview: true, ...extra }),
  };
}

/* Что пришло в вебхук: только личные сообщения с текстом или подписью. */
export function tgMessage(update) {
  const m = update && update.message;
  if (!m || !m.chat || m.chat.type !== "private") return null;
  const text = (m.text || m.caption || "").trim();
  const kind = m.text ? "text" : m.photo ? "фото" : m.voice ? "голосовое" : m.video_note ? "кружок" : m.video ? "видео" : m.document ? "файл" : m.sticker ? "стикер" : "сообщение";
  const f = m.from || {};
  return {
    chat: String(m.chat.id), messageId: m.message_id, at: (m.date || 0) * 1000 || Date.now(),
    text: text || `[${kind}]`, name: [f.first_name, f.last_name].filter(Boolean).join(" ") || f.username || "Без имени",
    username: f.username || "", replyTo: m.reply_to_message ? m.reply_to_message.message_id : null,
    start: /^\/start(?:\s+(\S+))?$/.exec(m.text || "")?.[1] ?? (m.text === "/start" ? "" : null),
  };
}
