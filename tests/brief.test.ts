/**
 * Бриф с витрины: маршрутизация по сумме и приём на /api/brief.
 *
 * Правило «дороже порога — только владельцу» — единственное, что отделяет
 * крупный заказ от общего чата, и ломается оно молча: бриф всё равно куда-то
 * приходит. Поэтому проверяется не «отправилось», а «кому».
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { test } from "node:test";

type Call = { method: string; body: Record<string, unknown> };

const calls: Call[] = [];

// Адрес Bot API читается на импорте — заглушка поднимается до загрузки модулей.
const server = createServer((req, res) => {
  let raw = "";
  req.on("data", (chunk) => (raw += chunk));
  req.on("end", () => {
    calls.push({
      method: String(req.url).split("/").pop() ?? "",
      body: raw ? JSON.parse(raw) : {},
    });
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, result: {} }));
  });
});

await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
const { port } = server.address() as { port: number };

process.env.TELEGRAM_API_BASE = `http://127.0.0.1:${port}`;
process.env.TELEGRAM_BOT_TOKEN = "stub-token";
process.env.TELEGRAM_SALES_CHAT_ID = "-1001234567890";
process.env.TELEGRAM_OWNER_CHAT_ID = "216929582";
process.env.SHOWCASE_BRIEF_SECRET = "shared-secret";
process.env.NEXT_PUBLIC_SITE_URL = "https://devuz.example";
delete process.env.BRIEF_OWNER_ONLY_FROM_USD;

const { briefHeading, briefRecipients, briefSummary, briefTotal, ownerOnly, ownerThresholdUsd } =
  await import("@/lib/qualify/brief");
const { claimHandoff } = await import("@/lib/qualify/handoff");
const { POST } = await import("@/app/api/brief/route");

const SALES = "-1001234567890";
const OWNER = "216929582";

function withEnv<T>(patch: Record<string, string | undefined>, body: () => T): T {
  const saved = Object.fromEntries(Object.keys(patch).map((key) => [key, process.env[key]]));
  try {
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    return body();
  } finally {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

function brief(totalUsd: number) {
  return {
    project: "mavera",
    projectLabel: "MAVERA — сайт застройщика",
    tier: { id: "lux", label: "Люкс", priceUsd: 8900 },
    addons: [
      { id: "langs", label: "Три языка", priceUsd: 0, included: true },
      { id: "chess", label: "Шахматка квартир", priceUsd: 1200, included: false },
      { id: "booking", label: "Онлайн-бронирование", priceUsd: 900, included: false },
    ],
    totalUsd,
    shareUrl: "https://globalex.example/mavera/lux?addons=langs,chess,booking",
  };
}

function post(body: unknown, secret: string | null = "shared-secret") {
  return POST(
    new Request("https://devuz.example/api/brief", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(secret ? { "x-brief-secret": secret } : {}),
      },
      body: JSON.stringify(body),
    }),
  );
}

test("порог строгий: ровно десять тысяч ещё падает всем", () => {
  assert.equal(ownerThresholdUsd(), 10_000);
  assert.equal(ownerOnly(10_000), false);
  assert.equal(ownerOnly(10_001), true);
  assert.equal(ownerOnly(9_999), false);

  withEnv({ BRIEF_OWNER_ONLY_FROM_USD: "5000" }, () => {
    assert.equal(ownerOnly(5_001), true);
    assert.equal(ownerOnly(5_000), false);
  });
  // Мусор в переменной не обнуляет порог: иначе всё уходило бы владельцу.
  withEnv({ BRIEF_OWNER_ONLY_FROM_USD: "много" }, () => assert.equal(ownerOnly(9_000), false));
});

test("дешевле порога — в чат продаж, дороже — только владельцу", async () => {
  assert.deepEqual(await briefRecipients(7_000), { chatIds: [SALES], ownerOnly: false, fallback: false });
  assert.deepEqual(await briefRecipients(11_000), { chatIds: [OWNER], ownerOnly: true, fallback: false });

  // Несколько владельцев через запятую — каждому.
  await withEnv({ TELEGRAM_OWNER_CHAT_ID: "1, 2,abc" }, async () => {
    assert.deepEqual((await briefRecipients(11_000)).chatIds, ["1", "2"]);
  });

  // Владелец не настроен: крупный бриф не теряется, а уходит в продажи с пометкой.
  await withEnv({ TELEGRAM_OWNER_CHAT_ID: undefined }, async () => {
    const route = await briefRecipients(11_000);
    assert.deepEqual(route, { chatIds: [SALES], ownerOnly: true, fallback: true });
    assert.match(briefHeading(brief(11_000), route, "brief"), /владельца не настроен/);
  });
});

test("шапка и резюме называют состав и сумму", () => {
  const b = brief(11_000);
  const heading = briefHeading(b, { ownerOnly: true, fallback: false }, "brief");
  assert.match(heading, /Только владельцу/);
  assert.match(heading, /Шахматка квартир/);
  assert.match(heading, /\+\$1 200/);
  assert.doesNotMatch(heading, /Три языка/, "бесплатное из пакета в шапке не нужно");
  assert.match(heading, /href="https:\/\/globalex\.example/);

  const summary = briefSummary(b);
  assert.match(summary, /пакет «Люкс» — \$8 900/);
  assert.match(summary, /В пакете: Три языка/);
  assert.match(summary, /Итого \$11 000/);
});

test("подписка, «от» и «по запросу» не смешиваются с разовой суммой", async () => {
  const b = {
    ...brief(34_900),
    addons: [
      ...brief(0).addons,
      { id: "ai-rag", label: "Свои ИИ-агенты на RAG-базе", priceUsd: 26_000, included: false, from: true },
      { id: "seo-20", label: "SEO-статьи · 20 в месяц", priceUsd: 550, included: false, monthly: true },
      { id: "social", label: "Соцсети: автопостинг", priceUsd: 0, included: false, onRequest: true },
    ],
    monthlyUsd: 550,
    fromPrice: true,
  };
  assert.equal(briefTotal(b), "от $34 900 + $550/мес");

  const heading = briefHeading(b, { ownerOnly: true, fallback: false }, "brief");
  assert.match(heading, /<b>от \$34 900 \+ \$550\/мес<\/b>/);
  assert.match(heading, /➕ Свои ИИ-агенты на RAG-базе — от\$26 000/);
  assert.match(heading, /🔁 SEO-статьи · 20 в месяц — \$550\/мес/);
  assert.match(heading, /❓ Соцсети: автопостинг — по запросу/);

  const summary = briefSummary(b);
  assert.match(summary, /Подписка: SEO-статьи · 20 в месяц \(\$550\/мес\)/);
  assert.match(summary, /По запросу: Соцсети: автопостинг/);
  assert.doesNotMatch(summary, /Соцсети: автопостинг \(/, "«по запросу» не выглядит как допник с ценой");
  assert.match(summary, /Итого от \$34 900 \+ \$550\/мес\./);

  // Через маршрут: сумма для порога — разовая, подписка едет отдельным полем до бота.
  calls.length = 0;
  const response = await post({ ...b, name: "Азиз", contact: "@aziz" });
  assert.equal(response.status, 200);
  const json = (await response.json()) as { ownerOnly: boolean; botUrl: string };
  assert.equal(json.ownerOnly, true, "«от $26 000» входит в разовую сумму целиком");
  const text = String(calls.find((call) => call.method === "sendMessage")?.body.text);
  assert.match(text, /от \$34 900 \+ \$550\/мес/);
  assert.match(text, /подписка/);
  assert.match(text, /по запросу, цену назовёт менеджер/);
  const session = claimHandoff(new URL(json.botUrl).searchParams.get("start") ?? "", 43);
  assert.equal(session?.brief?.monthlyUsd, 550);
  assert.equal(session?.brief?.fromPrice, true);

  // Старая витрина без новых полей принимается как раньше.
  assert.equal((await post({ ...brief(11_000), contact: "@aziz" })).status, 200);
  // Битая подписка — отказ, как и битая цена.
  assert.equal((await post({ ...brief(11_000), contact: "@aziz", monthlyUsd: "много" })).status, 422);
  // Следующие тесты считают вызовы с нуля.
  calls.length = 0;
});

test("без секрета или с чужим — отказ ещё до разбора тела", async () => {
  assert.equal((await post(brief(11_000), null)).status, 403);
  assert.equal((await post(brief(11_000), "wrong")).status, 403);
  await withEnv({ SHOWCASE_BRIEF_SECRET: undefined }, async () => {
    assert.equal((await post(brief(11_000))).status, 503);
  });
  assert.equal(calls.length, 0);
});

test("бриф без контакта или с битой ценой не принимается", async () => {
  assert.equal((await post({ ...brief(11_000), name: "Азиз" })).status, 422);
  assert.equal(
    (await post({ ...brief(11_000), contact: "@aziz", addons: [{ id: "x", label: "y", priceUsd: "дорого" }] }))
      .status,
    422,
  );
  assert.equal(calls.length, 0);
});

test("крупный бриф уходит владельцу и только ему, а клиент получает ссылку на бота", async () => {
  calls.length = 0;
  const response = await post({ ...brief(11_000), name: "Азиз", contact: "@aziz", comment: "нужно к декабрю" });
  assert.equal(response.status, 200);
  const json = (await response.json()) as {
    ok: boolean;
    requestNo: string;
    botUrl: string;
    delivered: boolean;
    ownerOnly: boolean;
  };
  assert.equal(json.ok, true);
  assert.equal(json.delivered, true);
  assert.equal(json.ownerOnly, true);
  assert.match(json.requestNo, /^DZ-\d{4}-[A-Z0-9]{4}$/);
  assert.match(json.botUrl, /^https:\/\/t\.me\/Devuz_studio_bot\?start=ru-[A-Za-z0-9]{18}$/);

  const sent = calls.filter((call) => call.method === "sendMessage");
  assert.equal(sent.length, 1, "одно сообщение — владельцу");
  assert.equal(String(sent[0].body.chat_id), OWNER);
  const text = String(sent[0].body.text);
  assert.match(text, /БРИФ С ВИТРИНЫ/);
  assert.match(text, /Только владельцу/);
  assert.match(text, /Заявка <code>DZ-/);
  assert.match(text, /нужно к декабрю/);
  assert.match(text, /Люкс/);
  // Кнопки «взять / отклонить» под брифом — как у любого лида.
  assert.ok(JSON.stringify(sent[0].body.reply_markup).includes("take:"));

  // По ссылке бот поднимает бриф под тем же номером: первичка допишется в ту же заявку.
  const token = new URL(json.botUrl).searchParams.get("start") ?? "";
  const session = claimHandoff(token, 42);
  assert.ok(session);
  assert.equal(session.qualified, false);
  assert.equal(session.requestNo, json.requestNo);
  assert.equal(session.brief?.requestNo, json.requestNo);
  assert.equal(session.brief?.totalUsd, 11_000);
  assert.equal(session.brief?.name, "Азиз");
});

test("бриф дешевле порога падает в чат продаж", async () => {
  calls.length = 0;
  const response = await post({ ...brief(9_800), contact: "+998 90 123 45 67" });
  assert.equal(response.status, 200);
  const json = (await response.json()) as { ownerOnly: boolean };
  assert.equal(json.ownerOnly, false);

  const sent = calls.filter((call) => call.method === "sendMessage");
  assert.equal(sent.length, 1);
  assert.equal(String(sent[0].body.chat_id), SALES);
  assert.doesNotMatch(String(sent[0].body.text), /Только владельцу/);
});

test.after(() => server.close());
