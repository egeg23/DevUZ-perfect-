/**
 * Чистка скаута: шум не копится в ленте, шумные чаты не едят модель,
 * сильные сигналы сразу уходят менеджерам.
 *
 * Владелец: «проблема с лидами». На деле из 197 сигналов 159 были нулями из
 * одного чата про релокацию, а из девяти сильных ответили на один.
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { fallbackReply, leadFromSignal, serviceOf, type SignalRow } from "@/lib/scout/promote";
import { scoreLead } from "@/lib/qualify/scoring";
import {
  MUTE_MIN_SIGNALS,
  STRONG_SCORE,
  isNoise,
  noisyChats,
  processBatch,
  type ScoutIo,
  type ScoutMessage,
} from "@/lib/scout/store";

const ROOT = new URL("../", import.meta.url);
const read = (file: string) => readFileSync(new URL(file, ROOT), "utf8");

function message(patch: Partial<ScoutMessage> = {}): ScoutMessage {
  return {
    chatId: -100111,
    chatTitle: "IT Ташкент",
    chatUsername: "ittashkent",
    messageId: 1,
    authorTelegramId: 555,
    authorUsername: "someone",
    text: "Нужен интернет-магазин для сети аптек, кто может взяться?",
    ...patch,
  };
}

test("шум сохраняется разобранным, субподряд — никогда", () => {
  assert.equal(isNoise(0, "другое"), true);
  assert.equal(isNoise(19, "сайт"), true);
  assert.equal(isNoise(20, "сайт"), false);
  // Субподряд с низким баллом — не шум: у такого заказчика уже есть деньги.
  assert.equal(isNoise(5, "субподряд"), false);
  assert.match(read("lib/scout/store.ts"), /status: input\.rehearsal \|\| isNoise\(input\.score, input\.category\) \? "ignored" : "new"/);
});

test("шумный чат: много разобранного и ни одного похожего на запрос", () => {
  const rows = (chat: number, n: number, score: number, status = "ignored") =>
    Array.from({ length: n }, () => ({ chat_id: chat, score, status }));

  const muted = noisyChats([
    ...rows(1, MUTE_MIN_SIGNALS, 0), // релокация: сплошные нули
    ...rows(2, MUTE_MIN_SIGNALS - 1, 0), // мало данных — не судим
    ...rows(3, MUTE_MIN_SIGNALS, 0),
    ...rows(3, 1, 85, "new"), // был один настоящий запрос — чат живой
    ...rows(4, MUTE_MIN_SIGNALS, 10),
    ...rows(4, 1, 10, "answered"), // из чата уже был ответ — не глушим
  ]);
  assert.deepEqual([...muted], [1]);
});

test("сообщения заглушённого чата не доходят до модели", async () => {
  let sentToModel = 0;
  const io: ScoutIo = {
    save: async () => ({ outcome: "duplicate" }),
    notify: async () => "skipped",
    markSent: async () => undefined,
    markFailed: async () => undefined,
    muted: async () => new Set([-100999]),
  };
  const run = await processBatch(
    [message({ chatId: -100999, messageId: 1 }), message({ chatId: -100111, messageId: 2 })],
    async (batch) => {
      sentToModel += batch.length;
      return batch.map((b) => ({ key: b.key, score: 80, category: "магазин", rationale: "нужен магазин" }));
    },
    { io },
  );
  assert.equal(sentToModel, 1, "сообщение из шумного чата ушло в модель");
  assert.equal(run.dropped.noisy_chat, 1);
});

test("сильный сигнал становится лидом с готовым первым сообщением", () => {
  const signal: SignalRow = {
    id: "s1",
    chat_title: "Предприниматели",
    message_link: "https://t.me/biz/123",
    author_username: "aziz_k",
    excerpt: "Нужна автоматизация склада и CRM для 4 филиалов, бюджет есть",
    score: 90,
    category: "автоматизация",
    rationale: "описана задача и бюджет",
  };
  const input = leadFromSignal(signal, "Азиз, здравствуйте! Увидел ваше сообщение…");
  assert.equal(input.contact_handle, "@aziz_k");
  assert.equal(input.contact_kind, "telegram");
  assert.deepEqual(input.services, ["integrations-automation"]);
  assert.equal(input.opening_line, "Азиз, здравствуйте! Увидел ваше сообщение…");
  assert.match(input.notes, /https:\/\/t\.me\/biz\/123/);

  // Без username — не телеграм-контакт, а ссылка на сам пост.
  const anon = leadFromSignal({ ...signal, author_username: null }, "текст");
  assert.equal(anon.contact_kind, "none");
  assert.equal(anon.contact_handle, "https://t.me/biz/123");
  assert.match(anon.notes, /ответить можно только в самом чате/);

  // Лид из сигнала не должен попадать в архив: человек ищет исполнителя сейчас.
  const scored = scoreLead(input, "ru");
  assert.notEqual(scored.priority, "archive", `приоритет ${scored.priority}`);
});

test("услуга по категории и запасной ответ", () => {
  assert.equal(serviceOf("приложение"), "mobile-apps");
  assert.equal(serviceOf("магазин"), "marketplace-delivery");
  assert.equal(serviceOf("сайт"), "web-development");
  assert.equal(serviceOf("бот"), "integrations-automation");
  const text = fallbackReply({ chat_title: "IT Ташкент", category: "сайт" });
  assert.match(text, /IT Ташкент/);
  assert.ok(text.includes("?"), "в запасном ответе нет вопроса");
});

test("сильный сигнал идёт через очередь лидов и не делается лидом дважды", () => {
  const promote = read("lib/scout/promote.ts");
  assert.match(promote, /\.gte\("score", STRONG_SCORE\)/);
  // Забирается условным обновлением.
  assert.match(promote, /update\(\{ status: "converted" \}\)[\s\S]{0,120}\.eq\("status", "new"\)[\s\S]{0,60}\.is\("lead_id", null\)/);
  assert.match(promote, /await routeNewLead\(/);
  assert.match(promote, /saveLead\(lead, \[\], "scout"/);
  assert.match(read("app/api/reminders/sweep/route.ts"), /await promoteStrongSignals\(new Date\(\)\)/);
  assert.equal(STRONG_SCORE, 70);
});

test("журнал скаута знает причины отсева", () => {
  // Раньше runner обращался к DROP_LABEL, которого в нём не было: строка
  // статистики падала на каждой пачке, где что-то отсеялось.
  const runner = read("scout/runner.mjs");
  assert.match(runner, /import \{ DROP_LABEL \} from "@\/lib\/scout\/digest"/);
  assert.match(read("lib/scout/digest.ts"), /noisy_chat: "шумный чат"/);
});

test("каждый источник лида из кода пропускает проверка в базе", () => {
  // Проверка в базе пускала только chat и form, а бот, витрина и касания
  // писали свои источники — и лиды молча не сохранялись.
  const sql = read("supabase/migrations/0048_lead_sources.sql");
  const allowed = new Set([...sql.matchAll(/'([a-z]+)'/g)].map((m) => m[1]));
  const used = new Set<string>();
  const files = [
    "app/api/brief/route.ts",
    "app/api/lead/route.ts",
    "app/api/chat/route.ts",
    "app/api/telegram/webhook/route.ts",
    "lib/admin/outreach-store.ts",
    "lib/admin/outreach-talk-run.ts",
    "lib/scout/promote.ts",
  ];
  for (const file of files) {
    const code = read(file);
    for (const m of code.matchAll(/saveLead\([^,]+,[^,]+,\s*"([a-z]+)"/g)) used.add(m[1]);
    for (const m of code.matchAll(/^\s*source: "([a-z]+)",/gm)) used.add(m[1]);
  }
  assert.ok(used.size >= 5, `источников найдено ${used.size}`);
  for (const source of used) assert.ok(allowed.has(source), `источник «${source}» база не пропустит`);
});
