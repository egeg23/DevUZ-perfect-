/**
 * Что уходит в общий чат отдела продаж, а что — нет.
 *
 * Это не проверка формата, а проверка границы. Панель прячет контакт за
 * отдельным действием с записью в журнал и не кладёт стенограмму даже в
 * выборку — но всё это бессмысленно, пока бот сам рассылает и то и другое
 * в чат, который читают все и который нельзя ни отозвать, ни проверить.
 * Поэтому проверяется не форматирование, а сетевой вызов: что именно
 * сервер отправил в Bot API.
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { test } from "node:test";

import { scoreLead } from "@/lib/qualify/scoring";
import type { ChatMessage, QualifyToolInput } from "@/lib/qualify/types";

type Call = { method: string; body: Record<string, unknown> };

const calls: Call[] = [];

// Адрес Bot API и адрес сайта читаются модулями на импорте, поэтому
// заглушка поднимается и прописывается в окружение до того, как модуль
// вообще будет загружен. Отсюда динамический импорт ниже.
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
process.env.NEXT_PUBLIC_SITE_URL = "https://devuz.example";

const { formatLeadBrief, sendLead } = await import("@/lib/qualify/telegram");

const HANDLE = "@azizk_direct";

function lead() {
  const input: QualifyToolInput = {
    contact_name: "Азиз Каримов",
    company: "Магнат",
    contact_handle: HANDLE,
    contact_kind: "telegram",
    niche: "сеть магазинов",
    niche_tier: 1,
    expertise: "high",
    services: ["ecommerce"],
    budget: "B1",
    authority: "A1",
    need: "N1",
    timing: "T1",
    intent: "interested",
    summary: {
      client: "Азиз Каримов, «Магнат»",
      request: "интернет-магазин на 5000 позиций",
      niche: "розница",
      expertise: "высокая",
      budget: "от 20 000 $",
      authority: "владелец",
      need: "срочно",
      timing: "этот месяц",
    },
    notes: "прошлый подрядчик сорвал сроки",
    opening_line: "Азиз, здравствуйте — по магазину на 5000 позиций",
    already_told: ["назвали срок 6-8 недель"],
    avoid_asking: ["про бюджет — уже назван"],
  };
  return scoreLead(input, "ru");
}

const TRANSCRIPT: ChatMessage[] = [
  { role: "user", content: "у нас оборот 400 миллионов сум, прошлый подрядчик всё завалил" },
  { role: "assistant", content: "расскажите про сроки" },
];

test("в брифе нет самого контакта — только канал связи", () => {
  const brief = formatLeadBrief(lead(), "DZ-0904-K4M7", "https://devuz.example/admin/leads/abc");

  assert.ok(!brief.includes(HANDLE), "ник клиента попал в бриф");
  assert.ok(!brief.includes("azizk_direct"), "ник клиента попал в бриф в другом виде");
  // Канал остаётся: менеджеру нужно знать, писать или звонить, и это
  // единственная часть контакта, по которой человека нельзя найти.
  assert.match(brief, /Telegram/);
  assert.match(brief, /контакт открывается в карточке/);
});

test("бриф ведёт в карточку, а без карточки — не врёт ссылкой", () => {
  const url = "https://devuz.example/admin/leads/abc";
  assert.ok(formatLeadBrief(lead(), undefined, url).includes(url));

  // Лид не записался в базу — ссылке вести некуда, и её быть не должно.
  const orphan = formatLeadBrief(lead(), undefined, null);
  assert.ok(!orphan.includes("/admin/leads/"), "ссылка на несуществующую карточку");
});

test("в чат уходит одно сообщение, и стенограммы в нём нет", async () => {
  calls.length = 0;
  const ok = await sendLead(lead(), "abc123", "DZ-0904-K4M7");
  assert.equal(ok, true);

  const messages = calls.filter((c) => c.method === "sendMessage");
  // Раньше их было два: бриф и следом вся переписка целиком.
  assert.equal(messages.length, 1, `сообщений отправлено ${messages.length}`);

  const text = String(messages[0].body.text);
  assert.ok(!text.includes(HANDLE), "контакт ушёл в общий чат");
  for (const line of TRANSCRIPT) {
    assert.ok(!text.includes(line.content), "кусок переписки ушёл в общий чат");
  }
  assert.ok(text.includes("https://devuz.example/admin/leads/abc123"), "нет ссылки на карточку");
});

test("несохранённый лид всё равно доходит до отдела продаж", async () => {
  calls.length = 0;
  // База могла быть недоступна. Бриф важнее ссылки: без него лид теряется
  // совсем, а без ссылки менеджер просто ищет карточку руками.
  assert.equal(await sendLead(lead(), "unsaved"), true);
  assert.equal(calls.filter((c) => c.method === "sendMessage").length, 1);
});

test.after(() => server.close());
