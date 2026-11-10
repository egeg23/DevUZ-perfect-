/* CRM компании: amoCRM или Bitrix24, какая подключена в «Подключениях».
   Обращение уходит сделкой (amoCRM) или лидом (Bitrix24): тема, страница,
   контакт, текст.
   - amoCRM: поддомен и долгосрочный токен частной интеграции
     (amoCRM → «amoМаркет» → «Создать интеграцию» → «Ключи и доступы»).
   - Bitrix24: адрес входящего вебхука с правом crm
     (Bitrix24 → «Разработчикам» → «Другое» → «Входящий вебхук»). */

export const KIND_NAME = { partner: "Запуск бренда", pharmacy: "Аптека", investor: "Инвестиции", other: "Другое", launch: "Путь бренда", bot: "Telegram-бот" };

export function leadTitle(l) {
  return `${KIND_NAME[l.kind] || l.kind}: ${l.org || l.name || "без имени"} (${l.no})`.slice(0, 250);
}

export function leadText(l) {
  let extra = {};
  try { extra = JSON.parse(l.extra || "{}"); } catch { /* пусто */ }
  return [
    `Обращение ${l.no} с сайта CZECHFARM`,
    `Тема: ${KIND_NAME[l.kind] || l.kind}`,
    l.page && `Страница: ${l.page} (${l.lang})`,
    l.name && `Имя: ${l.name}`,
    l.org && `Организация: ${l.org}`,
    l.country && `Страна: ${l.country}`,
    l.email && `Почта: ${l.email}`,
    l.phone && `Телефон: ${l.phone}`,
    ...Object.entries(extra).map(([k, v]) => `${k}: ${v}`),
    l.msg && `Сообщение: ${l.msg}`,
  ].filter(Boolean).join("\n");
}

/* «czechfarm», «czechfarm.amocrm.ru», «https://czechfarm.amocrm.ru/leads» → https://czechfarm.amocrm.ru */
export function amoBase(input) {
  const s = String(input || "").trim().toLowerCase().replace(/^https?:\/\//, "").split(/[/?#]/)[0];
  if (!s) return "";
  if (/^[a-z0-9-]+$/.test(s)) return `https://${s}.amocrm.ru`;
  if (/^[a-z0-9-]+\.(amocrm\.(ru|com)|kommo\.com)$/.test(s)) return `https://${s}`;
  return "";
}

/* Входящий вебхук Bitrix24: https://<портал>/rest/<id>/<ключ>/ — только https и только этот вид. */
export function b24Base(input) {
  const m = /^https:\/\/([a-z0-9.-]+)\/rest\/(\d+)\/([a-z0-9]+)\/?(?:[a-z.]+(?:\.json)?)?$/i.exec(String(input || "").trim());
  return m ? `https://${m[1].toLowerCase()}/rest/${m[2]}/${m[3]}/` : "";
}

export function amoPayload(l) {
  const contact = { first_name: l.name || l.org || "Без имени", custom_fields_values: [] };
  if (l.phone) contact.custom_fields_values.push({ field_code: "PHONE", values: [{ value: l.phone, enum_code: "WORK" }] });
  if (l.email) contact.custom_fields_values.push({ field_code: "EMAIL", values: [{ value: l.email, enum_code: "WORK" }] });
  if (!contact.custom_fields_values.length) delete contact.custom_fields_values;
  return [{ name: leadTitle(l), _embedded: { contacts: [contact], tags: [{ name: "сайт" }, { name: KIND_NAME[l.kind] || l.kind }] } }];
}

export function b24Payload(l) {
  const f = { TITLE: leadTitle(l), NAME: l.name || "", COMPANY_TITLE: l.org || "", COMMENTS: leadText(l).replace(/\n/g, "<br>"), SOURCE_ID: "WEB", SOURCE_DESCRIPTION: "Сайт CZECHFARM" };
  if (l.phone) f.PHONE = [{ VALUE: l.phone, VALUE_TYPE: "WORK" }];
  if (l.email) f.EMAIL = [{ VALUE: l.email, VALUE_TYPE: "WORK" }];
  return { fields: f, params: { REGISTER_SONET_EVENT: "Y" } };
}

async function jsonCall(fetchImpl, url, init, name) {
  const r = await fetchImpl(url, { ...init, signal: AbortSignal.timeout(15000) });
  const text = await r.text();
  if (r.status === 401 || r.status === 403) throw new Error(`${name} не приняла ключ (${r.status}): проверьте его в «Подключениях»`);
  if (!r.ok) throw new Error(`${name} ответила ${r.status}: ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : null;
}

export function crmClient(cfg, fetchImpl = fetch) {
  if (cfg.kind === "amo") {
    const base = amoBase(cfg.domain);
    const call = (path, init = {}) => {
      if (!base || !cfg.token) throw new Error("amoCRM не подключена");
      return jsonCall(fetchImpl, base + path, { ...init, headers: { Authorization: `Bearer ${cfg.token}`, "Content-Type": "application/json" } }, "amoCRM");
    };
    return {
      name: "amoCRM",
      async check() { const a = await call("/api/v4/account"); return a?.name || base; },
      async send(l) {
        const j = await call("/api/v4/leads/complex", { method: "POST", body: JSON.stringify(amoPayload(l)) });
        const id = Array.isArray(j) ? j[0]?.id : null;
        if (!id) throw new Error("amoCRM не вернула номер сделки");
        try { await call(`/api/v4/leads/${id}/notes`, { method: "POST", body: JSON.stringify([{ note_type: "common", params: { text: leadText(l) } }]) }); } catch { /* сделка есть */ }
        return String(id);
      },
    };
  }
  if (cfg.kind === "b24") {
    const base = b24Base(cfg.hook);
    const call = (method, body) => {
      if (!base) throw new Error("Bitrix24 не подключён");
      return jsonCall(fetchImpl, base + method + ".json", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body || {}) }, "Bitrix24");
    };
    return {
      name: "Bitrix24",
      async check() { const j = await call("crm.lead.fields", {}); if (!j || !j.result) throw new Error("Bitrix24 не дал доступ к CRM: у вебхука нужно право «CRM»"); return base.split("/")[2]; },
      async send(l) { const j = await call("crm.lead.add", b24Payload(l)); if (!j || !j.result) throw new Error("Bitrix24 не вернул номер лида"); return String(j.result); },
    };
  }
  return null;
}
