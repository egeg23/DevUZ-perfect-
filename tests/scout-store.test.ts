import assert from "node:assert/strict";
import { test } from "node:test";

import { excerpt, messageLink, processBatch, type ScoutMessage } from "@/lib/scout/store";

/**
 * Ссылка на сообщение — то, ради чего оператор вообще открывает
 * уведомление. Ошибка здесь не видна в тестах логики и обнаруживается
 * только тем, что ссылка ведёт в никуда.
 */
test("ссылка собирается для публичного и для закрытого чата", () => {
  assert.equal(
    messageLink(-1001234567890, 42, "uzdev"),
    "https://t.me/uzdev/42",
    "у чата с адресом ссылка обычная",
  );

  // У закрытого чата адреса нет, и Telegram собирает ссылку из
  // внутреннего номера: -1001234567890 превращается в 1234567890.
  assert.equal(
    messageLink(-1001234567890, 42, null),
    "https://t.me/c/1234567890/42",
    "у закрытого чата — через /c/ и номер без префикса",
  );

  // Личка и обычная группа ссылок такого вида не имеют. Выдумать её
  // хуже, чем сказать «ссылки нет»: оператор пойдёт по ней и не найдёт.
  assert.equal(messageLink(123456, 42, null), null);
  assert.equal(messageLink(-987654, 42, null), null);
});

test("выдержка обрезается по границе и помечается многоточием", () => {
  assert.equal(excerpt("  нужен   сайт\n\nдля аптеки  "), "нужен сайт для аптеки");

  const long = "а".repeat(700);
  const short = excerpt(long, 600);
  assert.equal(short.length, 600);
  assert.ok(short.endsWith("…"));

  assert.equal(excerpt("коротко", 600), "коротко");
});

function message(patch: Partial<ScoutMessage> = {}): ScoutMessage {
  return {
    chatId: -1001234567890,
    chatTitle: "IT Ташкент",
    chatUsername: "ittashkent",
    messageId: 1,
    authorTelegramId: 555,
    authorUsername: "someone",
    text: "Нужен интернет-магазин для сети аптек, кто может взяться?",
    ...patch,
  };
}

/**
 * Главное, что должен показывать проход: сколько отсеялось до модели.
 *
 * Эти числа и есть ответ на вопрос «работает ли скаут». Если отсев
 * пропускает половину чата — правила слабые, если ноль — они не
 * срабатывают вовсе, и второе выглядит точно так же, как «в чате тихо».
 */
test("проход считает, сколько дошло до каждой ступени", async () => {
  const sent: unknown[] = [];

  const run = await processBatch(
    [
      message({ messageId: 1 }),
      message({ messageId: 2, text: "ок" }),
      message({ messageId: 3, text: "Делаем сайты под ключ, портфолио в личке, пишите" }),
      message({ messageId: 4, text: "Всем доброе утро, как настроение у коллег сегодня?" }),
    ],
    async (batch) => {
      sent.push(...batch);
      return batch.map((item) => ({
        key: item.key,
        score: 80,
        category: "магазин",
        rationale: "нужен магазин для аптек",
      }));
    },
  );

  assert.equal(run.seen, 4);
  assert.equal(run.passedPrefilter, 1, "до модели должно дойти одно сообщение из четырёх");
  assert.equal(sent.length, 1, "в модель ушло ровно то, что прошло отсев");
  assert.equal(run.classified, 1);
});

test("пустая пачка не ходит в модель вовсе", async () => {
  let called = false;
  const run = await processBatch([message({ text: "ок" })], async () => {
    called = true;
    return [];
  });

  assert.equal(called, false, "модель вызвана впустую");
  assert.equal(run.passedPrefilter, 0);
  assert.equal(run.classified, 0);
});

/**
 * Ключ из ответа модели сопоставляется с исходным сообщением. Ключ,
 * которого в пачке не было, означал бы сигнал, привязанный к чужому
 * сообщению, — и оператор пошёл бы отвечать не тому человеку.
 */
test("выдуманный моделью ключ ничего не создаёт", async () => {
  const run = await processBatch([message({ messageId: 7 })], async () => [
    { key: "-100999:999", score: 90, category: "сайт", rationale: "выдумка" },
  ]);

  assert.equal(run.passedPrefilter, 1);
  assert.equal(run.classified, 1);
  assert.equal(run.saved, 0, "по чужому ключу ничего сохраняться не должно");
  assert.equal(run.notified, 0);
});
