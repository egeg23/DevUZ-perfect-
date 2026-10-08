/**
 * Кружок для касаний — пересылкой боту (lib/admin/circle-bot.ts) и строка в
 * отчёте в 18:00, если кружка нет.
 *
 * 08.10.2026 кружок не ушёл ни одному из ответивших: его не загрузили, в
 * «Избранном» аккаунтов было пусто, и об этом никто не знал.
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { changesCircle, circleBotReply, circleFromMessage, saveCircleFromBot } from "@/lib/admin/circle-bot";
import { reportText, type DayStats } from "@/lib/admin/autopilot";
import { NO_CIRCLE } from "@/lib/admin/hello-first";
import type { Staff } from "@/lib/admin/session";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const owner = { id: "s1", role: "admin", display_name: "Егор" } as Staff;

test("кружок и квадратное видео из сообщения; текст — не кружок", () => {
  assert.deepEqual(circleFromMessage({ video_note: { file_id: "A", length: 384, duration: 41, file_size: 6_000_000 } }), {
    fileId: "A",
    mime: "video/mp4",
    width: 384,
    height: 384,
    duration: 41,
    bytes: 6_000_000,
  });
  const video = circleFromMessage({ video: { file_id: "B", width: 720, height: 720, duration: 30, mime_type: "video/mp4" } });
  assert.equal(video?.width, 720);
  assert.equal(circleFromMessage({}), null);
  assert.equal(circleFromMessage(undefined), null);
});

test("менять кружок — владелец и руководитель, как в «Аккаунтах»", () => {
  assert.equal(changesCircle({ role: "admin" }), true);
  assert.equal(changesCircle({ role: "head" }), true);
  assert.equal(changesCircle({ role: "manager" }), false);
});

test("негодное видео отклоняется до скачивания", async () => {
  const base = { fileId: "X", mime: "video/mp4", bytes: 1_000_000 };
  assert.deepEqual(await saveCircleFromBot({ ...base, width: 1280, height: 720, duration: 20 }, owner), { ok: false, reason: "shape" });
  assert.deepEqual(await saveCircleFromBot({ ...base, width: 640, height: 640, duration: 90 }, owner), { ok: false, reason: "long" });
  assert.deepEqual(
    await saveCircleFromBot({ ...base, width: 640, height: 640, duration: 30, bytes: 30 * 1024 * 1024 }, owner),
    { ok: false, reason: "bot_limit" },
  );
});

test("ответ бота: что дальше при удаче и понятная причина при отказе", () => {
  assert.match(circleBotReply({ ok: true }), /«Избранное» всех рабочих аккаунтов/);
  for (const reason of ["type", "size", "meta", "long", "short", "shape", "bot_limit", "download", "save"] as const) {
    const text = circleBotReply({ ok: false, reason });
    assert.ok(!text.includes("undefined"), reason);
    assert.match(text, /«Аккаунты» → «Кружок для касаний»/);
  }
});

test("бот принимает кружок только от сотрудника в личке; незнакомца ведёт дальше", () => {
  const route = read("app/api/telegram/webhook/route.ts");
  assert.match(route, /chat\.type === "private" && circleFromMessage\(update\.message\)/);
  const handler = route.slice(route.indexOf("async function handleCircleUpload"));
  assert.match(handler, /if \(!staff\) return false;/);
  assert.ok(handler.indexOf("changesCircle(staff)") < handler.indexOf("saveCircleFromBot("), "права проверяются до сохранения");
});

test("отчёт в 18:00 говорит, что кружка нет и вместо него ушли письма", () => {
  const stats: DayStats = {
    day: "2026-10-08",
    target: 20,
    enabled: true,
    sent: 20,
    byAccount: [],
    inFlight: 0,
    attempts: 20,
    manual: 0,
    dropped: 0,
    replies: 3,
    taken: 0,
    refused: 0,
    weekSent: 60,
    weekReplies: 9,
    replied: [],
  };
  assert.doesNotMatch(reportText(stats, (t) => t), /Кружок не ушёл/);
  const text = reportText({ ...stats, circleMissing: 16 }, (t) => t);
  assert.match(text, /🎥 Кружок не ушёл 16 раз/);
  assert.match(text, /Перешлите кружок боту/);
  // Счёт — по тексту отказа, который пишет отправка (NO_CIRCLE).
  assert.ok(NO_CIRCLE.includes("нет кружка"));
  assert.match(read("lib/admin/autopilot-store.ts"), /\.ilike\("failure", "%нет кружка%"\)/);
});
