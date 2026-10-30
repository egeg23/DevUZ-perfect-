/* Wazzup: Instagram, WhatsApp, Telegram-аккаунт, ВКонтакте, Авито, MAX,
   Viber одним ключом API (Wazzup → «Интеграции» → «API»). Документация
   API v3: GET /v3/channels, PATCH /v3/webhooks (тестовый POST {test: true}),
   POST /v3/message {channelId, chatType, chatId, text}. Входящие приходят
   вебхуком {messages: [...]}: у Wazzup подписи нет, поэтому адрес вебхука
   содержит секрет. */

const API = "https://api.wazzup24.com/v3";

export const WZ_KINDS = {
  whatsapp: "WhatsApp", whatsgroup: "WhatsApp", instagram: "Instagram", telegram: "Telegram",
  telegroup: "Telegram", vk: "ВКонтакте", avito: "Авито", max: "MAX", maxgroup: "MAX", viber: "Viber",
};

export function wzClient(key, fetchImpl = fetch) {
  async function call(method, path, body) {
    if (!key) throw new Error("Wazzup не подключён");
    const r = await fetchImpl(API + path, {
      method, headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(15000),
    });
    const text = await r.text();
    if (r.status === 401 || r.status === 403) throw new Error("Wazzup не принял ключ API");
    if (!r.ok) throw new Error(`Wazzup ответил ${r.status}: ${text.slice(0, 200)}`);
    return text ? JSON.parse(text) : null;
  }
  return {
    async channels() {
      const j = await call("GET", "/channels");
      return (Array.isArray(j) ? j : []).map((c) => ({ id: c.channelId, kind: c.transport, plain: c.plainId || "", state: c.state || "" }));
    },
    setHook: (url) => call("PATCH", "/webhooks", { webhooksUri: url, subscriptions: { messagesAndStatuses: true, contactsAndDealsCreation: false } }),
    send: (channelId, chatType, chatId, text) => call("POST", "/message", { channelId, chatType, chatId, text: String(text).slice(0, chatType === "whatsapp" ? 10000 : 1000) }),
  };
}

/* Разбор вебхука: только сообщения, статусы и тест пропускаем. */
export function wzMessages(body) {
  const list = body && Array.isArray(body.messages) ? body.messages : [];
  return list.filter((m) => m && m.channelId && m.chatType && m.chatId).map((m) => ({
    id: String(m.messageId || ""), channel: m.channelId, kind: m.chatType, chat: String(m.chatId),
    at: Date.parse(m.dateTime) || Date.now(), out: !!m.isEcho,
    text: (m.text || "").trim() || (m.contentUri ? `[${m.type === "image" ? "фото" : m.type === "audio" ? "голосовое" : m.type === "video" ? "видео" : "файл"}] ${m.contentUri}` : `[${m.type || "сообщение"}]`),
    name: (m.contact && m.contact.name) || m.authorName || "",
    phone: m.chatType === "whatsapp" || m.chatType === "viber" ? String(m.chatId) : "",
  }));
}
