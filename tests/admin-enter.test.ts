/**
 * Вход в панель нажатием кнопки в Telegram.
 *
 * Владелец: «я не могу как владелец перейти из бота без авторизации, можно
 * как-то легче для меня сделать? Или это поломает все?».
 *
 * Легче — можно, и именно здесь проверяется, что «легче» не превратилось в
 * «без проверки». Три вещи держат этот вход: подпись Telegram, её свежесть
 * и то, что адрес назначения собирается из сегментов пути, а не берётся
 * параметром.
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { createHash, createHmac } from "node:crypto";
import { test } from "node:test";

import { checkTelegramAuth, dataCheckString, destinationFrom } from "@/lib/admin/tg-auth";
import { NEXT_COOKIE, returnTo, wantedPath } from "@/lib/admin/return-to";

const TOKEN = "123456:AAH-stub-token";

/** Подписать переход так, как это делает Telegram. */
function signed(fields: Record<string, string>): URLSearchParams {
  const params = new URLSearchParams(fields);
  const secret = createHash("sha256").update(TOKEN).digest();
  const hash = createHmac("sha256", secret).update(dataCheckString(params)).digest("hex");
  params.set("hash", hash);
  return params;
}

const NOW = 1_800_000_000;

function fresh(extra: Record<string, string> = {}) {
  return signed({
    id: "77001",
    first_name: "Егор",
    username: "egeg23",
    auth_date: String(NOW),
    ...extra,
  });
}

test("подписанный Telegram переход принимается", () => {
  const checked = checkTelegramAuth(fresh(), TOKEN, NOW);
  assert.equal(checked.ok, true);
  if (!checked.ok) return;
  assert.equal(checked.auth.id, 77001);
  assert.equal(checked.auth.username, "egeg23");
});

test("чужая подпись не пускает никого", () => {
  const params = fresh();
  params.set("hash", "0".repeat(64));
  assert.deepEqual(checkTelegramAuth(params, TOKEN, NOW), { ok: false, why: "bad_signature" });

  // Тот же набор полей, но подписанный другим ботом.
  const other = new URLSearchParams(fresh());
  const secret = createHash("sha256").update("999:other-bot").digest();
  other.set("hash", createHmac("sha256", secret).update(dataCheckString(other)).digest("hex"));
  assert.deepEqual(checkTelegramAuth(other, TOKEN, NOW), { ok: false, why: "bad_signature" });
});

test("подменённое поле ломает подпись", () => {
  // Ровно та атака, ради которой всё это и считается: подписан один id,
  // в адресе — другой.
  const params = fresh();
  params.set("id", "77002");
  assert.deepEqual(checkTelegramAuth(params, TOKEN, NOW), { ok: false, why: "bad_signature" });
});

test("подпись живёт четверть часа, и не дольше", () => {
  assert.equal(checkTelegramAuth(fresh(), TOKEN, NOW + 14 * 60).ok, true);
  assert.deepEqual(checkTelegramAuth(fresh(), TOKEN, NOW + 16 * 60), { ok: false, why: "stale" });
  // Подписанное «на завтра» — сбитые часы или попытка растянуть окно.
  assert.deepEqual(checkTelegramAuth(fresh(), TOKEN, NOW - 600), { ok: false, why: "stale" });
});

test("адрес без подписи — это просто человек, открывший его руками", () => {
  assert.deepEqual(checkTelegramAuth(new URLSearchParams(), TOKEN, NOW), {
    ok: false,
    why: "absent",
  });
});

test("без токена бота не входит никто", () => {
  assert.deepEqual(checkTelegramAuth(fresh(), undefined, NOW), {
    ok: false,
    why: "bad_signature",
  });
});

test("в подписываемую строку идут все поля Telegram, кроме hash", () => {
  // Список полей не перечисляется вручную: Telegram однажды добавит новое,
  // и захардкоженный список молча перестанет сходиться — вход сломается у
  // всех сразу. Отсюда же запрет на свои параметры в адресе кнопки.
  const params = signed({ id: "1", auth_date: "2", username: "x", photo_url: "http://p/1.jpg" });
  const line = dataCheckString(params);
  assert.equal(line, "auth_date=2\nid=1\nphoto_url=http://p/1.jpg\nusername=x");
  assert.ok(!line.includes("hash="));
});

test("куда вести после входа — собирается из сегментов, а не из параметра", () => {
  assert.equal(destinationFrom(["leads", "8f586a5e-3c0f-4bd2-b5f6-54aadd0e5587"]),
    "/admin/leads/8f586a5e-3c0f-4bd2-b5f6-54aadd0e5587");
  assert.equal(destinationFrom(undefined), "/admin");
  assert.equal(destinationFrom([]), "/admin");

  // Увести на чужой сайт через сегменты нельзя в принципе — но проверка
  // всё равно стоит: сегменты приходят из адреса, то есть от кого угодно.
  assert.equal(destinationFrom(["..", "etc"]), "/admin");
  assert.equal(destinationFrom(["evil.com/x"]), "/admin");
  assert.equal(destinationFrom(["leads", "a b"]), "/admin");
});

test("middleware запоминает, куда человек шёл, и не запоминает лишнего", () => {
  assert.equal(wantedPath("/admin/leads/abc"), "/admin/leads/abc");
  assert.equal(wantedPath("/admin"), null);
  // Иначе вход после входа вёл бы на вход.
  assert.equal(wantedPath("/admin/login"), null);
  assert.equal(wantedPath("/admin/enter/leads/abc"), null);
  assert.equal(wantedPath("/admin/../etc/passwd"), null);
  assert.equal(NEXT_COOKIE, "devuz_admin_next");
});

test("после входа возвращают только на наш же адрес", () => {
  assert.equal(returnTo("/admin/leads/abc"), "/admin/leads/abc");
  assert.equal(returnTo(null), "/admin");
  assert.equal(returnTo(""), "/admin");
  // Кука приходит от браузера, и то, что положили её мы, ничего не
  // доказывает: до возвращения она успевает побывать в чужих руках.
  assert.equal(returnTo("https://evil.example/x"), "/admin");
  assert.equal(returnTo("//evil.example"), "/admin");
  assert.equal(returnTo("/admin/../../etc"), "/admin");
});
