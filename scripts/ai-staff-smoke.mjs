// Смоук Telegram Business у ИИ-сотрудника: путь, по которому идут сообщения
// покупателей владельцу кабинета, без живого второго аккаунта.
//
// Шлёт на боевой адрес бота сервиса (/api/ai-staff/tg/<секрет>) те же
// обновления, что присылает Telegram: подключение бизнес-аккаунта, вопрос
// покупателя, контакт, «Беру» на карточке заявки, ответ владельца. Ответ
// ИИ в Telegram не уходит (подключение выдуманное), всё видно в базе.
//
// Запускать только на своём тестовом кабинете: карточка заявки придёт в
// Telegram людям этого кабинета, а владелец получит «Готово: ИИ-сотрудник…».
//
// Запуск:
//   AI_STAFF_WEBHOOK_SECRET=… node scripts/ai-staff-smoke.mjs <telegram id владельца> [адрес]
// С NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY скрипт сам проверит
// базу и уберёт за собой канал, разговор и заявку. Тратит два ответа Sonnet.

const SECRET = process.env.AI_STAFF_WEBHOOK_SECRET;
const OWNER_ID = Number(process.argv[2]);
const BASE = process.argv[3] ?? "https://devuz.studio";
if (!SECRET || !OWNER_ID) {
  console.error("Нужны AI_STAFF_WEBHOOK_SECRET и telegram id владельца кабинета");
  process.exit(2);
}

const DB = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const rest = async (path, init = {}) => {
  const r = await fetch(`${DB}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: KEY, authorization: `Bearer ${KEY}`, "content-type": "application/json", prefer: "return=representation", ...init.headers },
  });
  return r.ok ? r.json() : Promise.reject(new Error(`${path}: ${r.status} ${await r.text()}`));
};

const CONN = `smoke-${Date.now()}`;
const OWNER = { id: OWNER_ID, is_bot: false, first_name: "Смоук-владелец", language_code: "ru" };
const BUYER = { id: 990_000_000 + Math.floor(Math.random() * 1e6), is_bot: false, first_name: "Смоук", last_name: "Покупатель", language_code: "ru" };
let updateId = 990_000_000 + Math.floor(Math.random() * 1e6);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function send(update) {
  const r = await fetch(`${BASE}/api/ai-staff/tg/${SECRET}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-telegram-bot-api-secret-token": SECRET },
    body: JSON.stringify({ update_id: updateId++, ...update }),
  });
  if (!r.ok) throw new Error(`бот ответил ${r.status}: секрет не тот или сервис выключен`);
}
const say = (from, text) =>
  send({ business_message: { message_id: updateId, date: Math.floor(Date.now() / 1000), chat: { id: BUYER.id, type: "private" }, from, text, business_connection_id: CONN } });

const failures = [];
const expect = (ok, what) => {
  console.log(`${ok ? "✓" : "✗"} ${what}`);
  if (!ok) failures.push(what);
};

await send({ business_connection: { id: CONN, user: OWNER, user_chat_id: OWNER.id, is_enabled: true, rights: { can_reply: true } } });
await sleep(3000);
await say(BUYER, "Здравствуйте, сколько у вас стоит основная услуга?");
await sleep(25000);
await say(BUYER, "Меня зовут Смоук, телефон +998 90 000 00 01, перезвоните, пожалуйста");
await sleep(30000);

if (!DB || !KEY) {
  console.log(`Отправлено. Проверьте базу: ai_channels.external_id = '${CONN}', разговор tg_business с chat_key '${BUYER.id}'.`);
  process.exit(0);
}

const [channel] = await rest(`ai_channels?external_id=eq.${CONN}&select=id,tenant_id,status,can_reply`);
expect(Boolean(channel?.can_reply), "подключение бизнес-аккаунта записано, право отвечать есть");
if (!channel) process.exit(1);
const convOf = async () =>
  (await rest(`ai_conversations?tenant_id=eq.${channel.tenant_id}&kind=eq.tg_business&chat_key=eq.${BUYER.id}&select=id,mode,human_until,ai_replies,lead_id,messages`))[0];
let conv = await convOf();
expect((conv?.ai_replies ?? 0) >= 2, "ИИ ответил на оба сообщения");
expect(/ИИ-помощник/.test(conv?.messages?.[1]?.text ?? ""), "первое сообщение говорит, что отвечает ИИ");
expect(Boolean(conv?.lead_id), "заявка создана");

if (conv?.lead_id) {
  const [lead] = await rest(`ai_leads?id=eq.${conv.lead_id}&tenant_id=eq.${channel.tenant_id}&select=status,delivered,request_no`);
  expect(Boolean(lead?.delivered), `заявка ${lead?.request_no ?? ""} доставлена людям кабинета в Telegram`);
  if (lead?.status === "new") {
    await send({ callback_query: { id: "smoke", from: OWNER, data: `ail:take:${conv.lead_id}` } });
    await sleep(4000);
  }
  const [taken] = await rest(`ai_leads?id=eq.${conv.lead_id}&tenant_id=eq.${channel.tenant_id}&select=status`);
  expect(taken?.status === "taken", "«Беру» закрепляет заявку");
}

await say(OWNER, "Это менеджер, перезвоню через пять минут");
await sleep(4000);
await say(BUYER, "Хорошо, жду");
await sleep(15000);
conv = await convOf();
expect(conv?.mode === "human" && new Date(conv.human_until) > new Date(), "после ответа владельца ИИ молчит в чате");
expect((conv?.ai_replies ?? 0) === 2, "на сообщение после перехвата ИИ не ответил");

// Уборка: смоук не должен остаться в кабинете и в отчёте дня.
if (conv?.lead_id) await rest(`ai_leads?id=eq.${conv.lead_id}&tenant_id=eq.${channel.tenant_id}`, { method: "DELETE" });
if (conv) await rest(`ai_conversations?id=eq.${conv.id}&tenant_id=eq.${channel.tenant_id}`, { method: "DELETE" });
await rest(`ai_channels?id=eq.${channel.id}&tenant_id=eq.${channel.tenant_id}`, { method: "DELETE" });

console.log(failures.length ? `\nНе прошло: ${failures.length}` : "\nСмоук прошёл");
process.exit(failures.length ? 1 : 0);
