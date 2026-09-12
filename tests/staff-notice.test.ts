/**
 * Приглашение сотруднику.
 *
 * Проверяется не «функция не упала», а две вещи, из-за которых её и писали.
 * Первая: человек получает инструкцию, что делать дальше, а не название
 * роли из базы. Вторая важнее — недоставленное приглашение отличается от
 * доставленного. Telegram запрещает боту писать первым тому, кто ему не
 * писал, значит отказ здесь обычное дело; принять его за успех — значит
 * завести человека, который никогда не узнает, что его завели.
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { test } from "node:test";

type Call = { method: string; body: Record<string, unknown> };

const calls: Call[] = [];
/** Чем заглушка отвечает на следующий вызов. Меняется тестами. */
let allow = true;

// Адрес Bot API читается модулем на импорте, поэтому заглушка поднимается и
// прописывается в окружение до того, как модуль будет загружен. Отсюда
// динамический импорт ниже — тот же приём, что в tests/lead-privacy.test.ts.
const server = createServer((req, res) => {
  let raw = "";
  req.on("data", (chunk) => (raw += chunk));
  req.on("end", () => {
    calls.push({ method: String(req.url).split("/").pop() ?? "", body: raw ? JSON.parse(raw) : {} });
    if (allow) {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true, result: {} }));
      return;
    }
    res.writeHead(403, { "content-type": "application/json" });
    res.end(
      JSON.stringify({
        ok: false,
        error_code: 403,
        description: "Forbidden: bot can't initiate conversation with a user",
      }),
    );
  });
});

await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
const { port } = server.address() as { port: number };

process.env.TELEGRAM_API_BASE = `http://127.0.0.1:${port}`;
process.env.TELEGRAM_BOT_TOKEN = "stub-token";
process.env.NEXT_PUBLIC_SITE_URL = "https://devuz.example";

const { notifyInvitedStaff, notifyRoleChange } = await import("@/lib/admin/staff-notice");

function last(): Record<string, unknown> {
  return calls[calls.length - 1].body;
}

test("приглашение объясняет, что человек может и как войти", async () => {
  allow = true;
  const outcome = await notifyInvitedStaff({
    telegramId: 218374425,
    role: "manager",
    invitedBy: "Егор Максимов",
    returning: false,
  });

  assert.equal(outcome, "sent");

  const body = last();
  assert.equal(body.chat_id, 218374425);
  const text = String(body.text);

  // Название роли из базы человеку ничего не говорит — нужны слова.
  assert.ok(!text.includes("manager"), "в сообщение утекло внутреннее имя роли");
  assert.ok(text.includes("менеджер"), "роль не названа по-человечески");
  assert.ok(text.includes("Егор Максимов"), "не сказано, кто добавил");

  // Единственное, ради чего сообщение и шлётся: человек должен понять,
  // что делать дальше.
  assert.ok(text.includes("/login"), "не сказано, как войти");
  assert.ok(body.reply_markup, "нет кнопки в панель");
});

test("администратору перечислено то, чего нет у менеджера", async () => {
  allow = true;
  await notifyInvitedStaff({ telegramId: 1, role: "admin", invitedBy: "Егор", returning: false });

  const text = String(last().text);
  assert.ok(text.includes("администратор"));
  assert.ok(text.includes("журнал"), "админу не сказано про журнал действий");
  assert.ok(!/\badmin\b/.test(text), "в сообщение утекло внутреннее имя роли");
});

test("вернувшемуся не пишут «вас добавили»", async () => {
  allow = true;
  await notifyInvitedStaff({ telegramId: 1, role: "manager", invitedBy: "Егор", returning: true });
  assert.ok(String(last().text).includes("восстановлен"), "вернувшемуся сказано как новому");
});

test("о смене роли сообщают отдельно от приглашения", async () => {
  allow = true;
  const outcome = await notifyRoleChange({ telegramId: 1, role: "admin", changedBy: "Егор" });
  assert.equal(outcome, "sent");

  const text = String(last().text);
  // Человек уже в панели: «вас добавили» было бы неправдой.
  assert.ok(!text.includes("Вас добавили"), "смена роли выдана за добавление");
  assert.ok(text.includes("изменилась роль"));
  assert.ok(text.includes("администратор"));
});

test("отказ Telegram не выдаётся за доставку", async () => {
  // Бот не может написать первым тому, кто ему не писал — обычное дело при
  // заведении сотрудника, а не сбой. Считать это успехом значит завести
  // человека, который об этом не узнает.
  allow = false;
  const outcome = await notifyInvitedStaff({
    telegramId: 218374425,
    role: "manager",
    invitedBy: "Егор",
    returning: false,
  });
  assert.equal(outcome, "blocked");
  allow = true;
});

test("без токена бота приглашение не выдумывается", async () => {
  const saved = process.env.TELEGRAM_BOT_TOKEN;
  delete process.env.TELEGRAM_BOT_TOKEN;
  try {
    const outcome = await notifyInvitedStaff({
      telegramId: 1,
      role: "manager",
      invitedBy: "Егор",
      returning: false,
    });
    assert.equal(outcome, "no_bot", "отсутствие бота не должно выглядеть как отправка");
  } finally {
    process.env.TELEGRAM_BOT_TOKEN = saved;
  }
});

test("сервер заглушки закрывается", () => {
  server.close();
});
