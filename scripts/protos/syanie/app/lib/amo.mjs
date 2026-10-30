/* amoCRM: заявки с сайта и из переписки уходят сделкой с контактом.
   Подключение — поддомен и долгосрочный токен частной интеграции
   (amoCRM → «amoМаркет» → «Создать интеграцию» → «Ключи и доступы»).
   API v4: /api/v4/account, /api/v4/leads/pipelines, /api/v4/leads/complex,
   /api/v4/leads/{id}/notes. */

/* «siyanie», «siyanie.amocrm.ru», «https://siyanie.amocrm.ru/leads» → https://siyanie.amocrm.ru */
export function amoBase(input) {
  const s = String(input || "").trim().toLowerCase().replace(/^https?:\/\//, "").split(/[/?#]/)[0];
  if (!s) return "";
  if (/^[a-z0-9-]+$/.test(s)) return `https://${s}.amocrm.ru`;
  if (/^[a-z0-9-]+\.(amocrm\.(ru|com)|kommo\.com)$/.test(s)) return `https://${s}`;
  return "";
}

const SRC = { booking: "запись с сайта", quiz: "квиз", chat: "чат", tg: "Telegram", wz: "мессенджер" };

/* Тело POST /api/v4/leads/complex для одной заявки. */
export function leadPayload(lead, opt = {}) {
  const contact = { first_name: lead.name || "Без имени" };
  if (lead.phone) contact.custom_fields_values = [{ field_code: "PHONE", values: [{ value: lead.phone, enum_code: "WORK" }] }];
  const one = {
    name: `${lead.what || "Заявка с сайта"}${lead.name ? " · " + lead.name : ""}`.slice(0, 250),
    _embedded: { contacts: [contact], tags: [{ name: "сайт" }, { name: SRC[lead.src] || lead.src }] },
  };
  if (opt.pipeline) one.pipeline_id = Number(opt.pipeline);
  if (opt.status) one.status_id = Number(opt.status);
  return [one];
}

/* Примечание к сделке: что человек оставил на сайте. */
export function leadNote(lead) {
  return [
    `Источник: ${SRC[lead.src] || lead.src}`,
    lead.what && `Что: ${lead.what}`,
    lead.wish && `Удобно: ${lead.wish}`,
    lead.phone && `Телефон: ${lead.phone}`,
    lead.note && `Заметка: ${lead.note}`,
  ].filter(Boolean).join("\n");
}

export function amoClient({ domain, token }, fetchImpl = fetch) {
  const base = amoBase(domain);
  async function call(path, init = {}) {
    if (!base || !token) throw new Error("amoCRM не подключена");
    const r = await fetchImpl(base + path, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers || {}) },
      signal: AbortSignal.timeout(15000),
    });
    const text = await r.text();
    if (r.status === 401) throw new Error("amoCRM не приняла токен (401): проверьте долгосрочный токен");
    if (!r.ok) throw new Error(`amoCRM ответила ${r.status}: ${text.slice(0, 200)}`);
    return text ? JSON.parse(text) : null;
  }
  return {
    base,
    account: () => call("/api/v4/account"),
    async pipelines() {
      const j = await call("/api/v4/leads/pipelines");
      return (j?._embedded?.pipelines || []).map((p) => ({
        id: p.id, name: p.name, main: !!p.is_main,
        /* 142/143 — «успешно» и «закрыто»; type 1 — «Неразобранное»: туда API сделку не кладёт. */
        statuses: (p._embedded?.statuses || []).filter((s) => s.id !== 142 && s.id !== 143 && s.type !== 1).map((s) => ({ id: s.id, name: s.name })),
      }));
    },
    async sendLead(lead, opt) {
      const j = await call("/api/v4/leads/complex", { method: "POST", body: JSON.stringify(leadPayload(lead, opt)) });
      const id = Array.isArray(j) ? j[0]?.id : null;
      if (!id) throw new Error("amoCRM не вернула номер сделки");
      try { await call(`/api/v4/leads/${id}/notes`, { method: "POST", body: JSON.stringify([{ note_type: "common", params: { text: leadNote(lead) } }]) }); } catch { /* сделка есть, примечание не критично */ }
      return id;
    },
  };
}
