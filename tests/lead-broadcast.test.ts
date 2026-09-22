/**
 * Карточка нового лида уходит всей команде, а не в один чат.
 *
 * Владелец: «остальным сотрудникам не приходят уведомления о новых лидах, а
 * мне приходят». Так и было: адрес назначения один, из
 * TELEGRAM_SALES_CHAT_ID, и у студии без общей группы это личный чат
 * владельца. Менеджер узнавал о лиде пересказом — то есть на час позже.
 *
 * Проверяется сетевой вызов, а не формат: важно, что именно сервер отправил
 * в Bot API и сколько раз.
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { test } from "node:test";

import { scoreLead } from "@/lib/qualify/scoring";
import type { QualifyToolInput } from "@/lib/qualify/types";

type Call = { method: string; body: Record<string, unknown> };
const calls: Call[] = [];

/** Кому Bot API отказывает: так он отвечает про того, кто боту не писал. */
let unreachable: string | null = null;

const server = createServer((req, res) => {
  let raw = "";
  req.on("data", (chunk) => (raw += chunk));
  req.on("end", () => {
    const body = raw ? JSON.parse(raw) : {};
    calls.push({ method: String(req.url).split("/").pop() ?? "", body });

    if (unreachable && String(body.chat_id) === unreachable) {
      res.writeHead(403, { "content-type": "application/json" });
      res.end(
        JSON.stringify({
          ok: false,
          error_code: 403,
          description: "Forbidden: bot can't initiate conversation with a user",
        }),
      );
      return;
    }
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

const { sendLead } = await import("@/lib/qualify/telegram");
const { salesRecipients } = await import("@/lib/qualify/brief");

function lead() {
  const input: QualifyToolInput = {
    contact_name: "Азиз Каримов",
    company: "Магнат",
    contact_handle: "@azizk_direct",
    contact_kind: "telegram",
    niche: "розница",
    niche_tier: 1,
    expertise: "high",
    services: ["ecommerce"],
    budget: "B2",
    authority: "A1",
    need: "N1",
    timing: "T1",
    intent: "interested",
    summary: {
      client: "Азиз Каримов",
      request: "магазин",
      niche: "розница",
      expertise: "высокая",
      budget: "до 20 000 $",
      authority: "владелец",
      need: "срочно",
      timing: "этот месяц",
    },
    notes: "",
    opening_line: "Азиз, здравствуйте — по магазину",
    already_told: [],
    avoid_asking: [],
  };
  return scoreLead(input, "ru");
}

test("карточка уходит каждому адресату по разу", async () => {
  calls.length = 0;
  unreachable = null;

  const team = ["-1001234567890", "111", "222"];
  assert.equal(await sendLead(lead(), "abc", "DZ-1", { to: team }), true);

  const sent = calls.filter((c) => c.method === "sendMessage");
  assert.deepEqual(
    sent.map((c) => String(c.body.chat_id)),
    team,
    "кого-то пропустили или написали дважды",
  );
});

test("сотрудник, не писавший боту, не ломает доставку остальным", async () => {
  calls.length = 0;
  // Bot API не даёт написать первым, и обойти это нечем: такой сотрудник
  // просто не получит. Остальные обязаны получить.
  unreachable = "111";

  assert.equal(await sendLead(lead(), "abc", "DZ-1", { to: ["111", "222"] }), true);

  const sent = calls.filter((c) => c.method === "sendMessage");
  // Ровно два вызова: недоступный чат не должен вызывать повтор с запасной
  // кнопкой — иначе первый же такой сотрудник переводил бы кнопку входа в
  // запасной режим для всех и до перезапуска.
  assert.equal(sent.length, 2, `вызовов ${sent.length}, а адресата два`);
  assert.deepEqual(sent.map((c) => String(c.body.chat_id)), ["111", "222"]);
});

test("без базы адрес остаётся тем же, что и был", async () => {
  // Сервисного ключа в тестах нет, значит команду прочитать неоткуда —
  // и уведомление обязано уйти туда, куда уходило всегда, а не никуда.
  assert.deepEqual(await salesRecipients(), ["-1001234567890"]);
});

test("крупный заказ по-прежнему только владельцу", async () => {
  const { readFileSync } = await import("node:fs");
  const brief = readFileSync(new URL("../lib/qualify/brief.ts", import.meta.url), "utf8");

  // Рассылка команде добавлена в ветку обычных заказов. Ветка «дороже
  // порога» осталась прежней: бриф на $12 000 не должен уезжать всем.
  const route = brief.slice(brief.indexOf("export async function briefRecipients"));
  const wide = route.indexOf("salesRecipients()");
  const owner = route.indexOf("ownerChatIds()");
  assert.ok(wide > 0 && owner > wide, "рассылка команде попала в ветку крупных заказов");
  assert.match(route, /if \(owners\.length\) return \{ chatIds: owners/);
});

test.after(() => server.close());
