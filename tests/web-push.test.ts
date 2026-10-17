/**
 * Панель — приложение на телефоне и пуш (CLAUDE.md, раздел с тем же
 * названием).
 *
 * Владелец, 17.10.2026: «если вынести её иконкой на телефоне на рабочий
 * стол, то уведомления приходят и оно как приложение становится. Если
 * менеджеры заходят с телефона, уведомления по лидам и тд чтобы приходили +
 * я могу делать рассылки». На план ответил: «Делаем».
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { createECDH, randomBytes } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";

import webpush from "web-push";

import {
  APP_CODE_TRIES,
  checkCode,
  codeHash,
  codeMessage,
  isAppStart,
  mintCode,
  normalizeCode,
  requestFromStart,
  requestHash,
  type CodeRow,
} from "@/lib/admin/app-login";
import {
  PUSH_BODY_MAX,
  PUSH_HOME,
  deviceLabel,
  panelPath,
  parseSubscription,
  privateChatId,
  pushHref,
  pushPayload,
  pushText,
  subscriptionGone,
} from "@/lib/admin/push";
import { mirrorToPush, pushInFlight } from "@/lib/admin/push-mirror";
import { deliver, deliverAll, type StoredSubscription } from "@/lib/admin/push-store";
import { PWA_SCOPE, PWA_START, WORKER_SOURCE, manifestOf } from "@/lib/admin/pwa";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const SITE = "https://devuz.studio";

/** Настоящая подписка браузера: ключ P-256 и 16 байт auth — web-push их проверяет. */
function browserSub(id = "s1", endpoint = "https://push.example/send/abc"): StoredSubscription {
  const ecdh = createECDH("prime256v1");
  ecdh.generateKeys();
  return {
    id,
    staffId: "staff-1",
    endpoint,
    keys: { p256dh: ecdh.getPublicKey().toString("base64url"), auth: randomBytes(16).toString("base64url") },
  };
}

// ── Манифест и воркер — только /admin ──────────────────────────────────────

test("манифест: DevUz, весь экран, открывается на «Главной», область — панель", () => {
  const m = manifestOf();
  assert.equal(m.name, "DevUz");
  assert.equal(m.display, "standalone");
  assert.equal(m.start_url, "/admin/hq");
  assert.equal(m.scope, "/admin");
  assert.ok(m.start_url.startsWith(m.scope));
  const sizes = m.icons.map((i) => `${i.sizes}:${i.purpose}`);
  assert.deepEqual(sizes, ["192x192:any", "512x512:any", "512x512:maskable"]);
  for (const icon of m.icons) assert.ok(existsSync(new URL(`../public${icon.src}`, import.meta.url)), icon.src);
  assert.ok(existsSync(new URL("../public/pwa/apple-touch-icon.png", import.meta.url)));
});

test("манифест и воркер отдаются только с /admin/…, с правильным типом", async () => {
  const manifest = await import("@/app/admin/manifest.webmanifest/route");
  const worker = await import("@/app/admin/sw.js/route");
  const m = manifest.GET();
  assert.match(m.headers.get("content-type") ?? "", /application\/manifest\+json/);
  assert.equal(JSON.parse(await m.text()).start_url, PWA_START);
  const w = worker.GET();
  assert.match(w.headers.get("content-type") ?? "", /application\/javascript/);
  assert.equal(w.headers.get("service-worker-allowed"), PWA_SCOPE);
  assert.match(w.headers.get("cache-control") ?? "", /no-cache/);

  // Публичный сайт не устанавливаемый: ни манифеста в корне, ни воркера, ни ссылки.
  for (const name of readdirSync(new URL("../app", import.meta.url))) assert.doesNotMatch(name, /^manifest\./, name);
  for (const name of readdirSync(new URL("../public", import.meta.url))) {
    assert.doesNotMatch(name, /^(sw\.js|service-worker|manifest)/, name);
  }
  assert.doesNotMatch(read("app/layout.tsx"), /manifest/);
  assert.doesNotMatch(read("app/[locale]/layout.tsx"), /manifest|PWA_/);
  assert.match(read("app/admin/layout.tsx"), /manifest: PWA_MANIFEST/);
  assert.match(read("components/admin/app-push.tsx"), /register\("\/admin\/sw\.js", \{ scope: "\/admin"/);
});

test("воркер: показывает пуш и ведёт только внутрь панели, без кэша страниц", () => {
  assert.match(WORKER_SOURCE, /addEventListener\("push"/);
  assert.match(WORKER_SOURCE, /addEventListener\("notificationclick"/);
  assert.match(WORKER_SOURCE, /showNotification/);
  assert.doesNotMatch(WORKER_SOURCE, /addEventListener\("fetch"|caches\./);
  assert.match(WORKER_SOURCE, /const HOME = "\/admin\/hq"/);
  // Код воркера разбирается как JavaScript.
  assert.doesNotThrow(() => new Function(WORKER_SOURCE));
});

// ── Зеркало — только сотрудникам ───────────────────────────────────────────

test("личный чат — только положительный номер; группы и каналы — нет", () => {
  assert.equal(privateChatId(123456), 123456);
  assert.equal(privateChatId("123456"), 123456);
  assert.equal(privateChatId(-1001234567890), null);
  assert.equal(privateChatId("-1001234567890"), null);
  assert.equal(privateChatId("@devuz_channel"), null);
});

test("зеркало: личка сотрудника с подпиской — пуш; группа, чужой чат, ссылка входа — нет", async () => {
  const sent: { subs: readonly StoredSubscription[]; payload: ReturnType<typeof pushPayload> }[] = [];
  let asked = 0;
  const staffSub = browserSub();
  const deps = {
    site: SITE,
    chats: async () => {
      asked += 1;
      return new Map([[111, [staffSub]]]);
    },
    deliver: async (subs: readonly StoredSubscription[], payload: ReturnType<typeof pushPayload>) => {
      sent.push({ subs, payload });
      return { sent: subs.length, gone: 0, failed: 0 };
    },
  };

  mirrorToPush(111, "<b>🔥 Тёплый лид</b>\nМагнат, розница", [[{ text: "Открыть", panel: "/admin/leads/42" }]], {}, deps);
  mirrorToPush(-1001234567890, "<b>Лид в группу</b>", [], {}, deps);
  mirrorToPush(222, "<b>Клиенту или партнёру</b>", [], {}, deps);
  mirrorToPush(111, "Вход в панель\nhttps://devuz.studio/admin/login?t=SECRET", [], {}, deps);
  await pushInFlight();

  assert.equal(sent.length, 1);
  assert.equal(sent[0].subs[0], staffSub);
  assert.deepEqual(sent[0].payload, { title: "🔥 Тёплый лид", body: "Магнат, розница", url: "/admin/leads/42" });
  // Группу даже не сверяли с базой.
  assert.equal(asked, 2);
});

test("зеркало висит у отправки в Telegram и не ждёт пуш", () => {
  const tg = read("lib/qualify/telegram.ts");
  const fn = (name: string) => {
    const start = tg.indexOf(`function ${name}(`);
    assert.ok(start > 0, name);
    const next = tg.indexOf("\nexport ", start + 1);
    return tg.slice(start, next > 0 ? next : undefined);
  };
  for (const name of ["sendMessage", "postRows", "sendPhoto", "sendPhotoFile", "sendKeyboard"]) {
    assert.match(fn(name), /mirrorToPush\(/, `${name} зеркалит`);
  }
  // Рассылка «Пользователям бота», правки отправленного и кнопки — не зеркалятся.
  for (const name of ["sendBroadcastMessage", "editMessage", "setButtons", "editLeadCards", "markBriefHandled"]) {
    assert.doesNotMatch(fn(name), /mirrorToPush/, `${name} не зеркалит`);
  }
  assert.doesNotMatch(tg, /await mirrorToPush/);
  // Рассылка сотрудникам с «Главной» идёт через sendMessage — значит, и пушем.
  assert.match(read("lib/admin/broadcast-store.ts"), /import \{ sendMessage \} from "@\/lib\/qualify\/telegram"/);
  assert.match(read("lib/admin/bot-users-store.ts"), /sendBroadcastMessage/);
  // Код входа в приложение в пуш не уходит.
  assert.match(read("app/api/telegram/webhook/route.ts"), /sendMessage\(chat\.id, codeMessage\(code\), \{ mirror: false \}\)/);
});

test("Telegram не ждёт пуш: зеркало возвращается сразу, зависшая отправка обрезается", async () => {
  let started = 0;
  const hang = {
    chats: async () => new Map([[111, [browserSub()]]]),
    deliver: () => {
      started += 1;
      return new Promise<never>(() => {});
    },
    timeoutMs: 50,
  };
  const t0 = Date.now();
  const back = mirrorToPush(111, "Привет", [], {}, hang);
  assert.equal(back, undefined);
  assert.ok(Date.now() - t0 < 20);
  await pushInFlight();
  assert.equal(started, 1);
  assert.ok(Date.now() - t0 < 1_000);

  // Ошибка зеркала — только в лог, наружу не бросается.
  const errors: unknown[] = [];
  const log = console.error;
  console.error = (...args: unknown[]) => errors.push(args);
  try {
    mirrorToPush(111, "Привет", [], {}, { chats: async () => Promise.reject(new Error("база легла")) });
    await pushInFlight();
  } finally {
    console.error = log;
  }
  assert.equal(errors.length, 1);
});

// ── Текст и адрес нажатия ──────────────────────────────────────────────────

test("заголовок — первая строка без разметки, тело — до 180 знаков чистого текста", () => {
  const text = pushText("<b>Клиент ответил</b>\n\n<i>ООО &laquo;Магнат&raquo;</i> &amp; Ко: &lt;да&gt;\n" + "очень длинно ".repeat(40));
  assert.equal(text.title, "Клиент ответил");
  assert.ok(text.body.startsWith("ООО &laquo;Магнат&raquo; & Ко: <да> · очень длинно"));
  assert.ok(text.body.length <= PUSH_BODY_MAX);
  assert.ok(text.body.endsWith("…"));
  assert.deepEqual(pushText("Одна строка"), { title: "Одна строка", body: "" });
});

test("адрес нажатия: первая кнопка в панель, вход по кнопке — обычный путь, иначе «Главная»", () => {
  const enter = `${SITE}/admin/enter/leads/42`;
  assert.equal(pushHref("x", [[{ text: "Взять", callback_data: "take:1" }, { text: "Карточка", panel: "/admin/leads/42" }]], SITE), "/admin/leads/42");
  assert.equal(pushHref("x", [[{ text: "Открыть", url: enter }]], SITE), "/admin/leads/42");
  assert.equal(panelPath(`${SITE}/admin/enter`, SITE), "/admin");
  assert.equal(pushHref("x", [[{ text: "Сайт", url: "https://example.com/admin/x" }], [{ text: "Задача", url: `${SITE}/admin/tasks/7` }]], SITE), "/admin/tasks/7");
  assert.equal(pushHref(`Карточка: <a href="${SITE}/admin/mockups?p=1">макет</a>`, [], SITE), "/admin/mockups?p=1");
  assert.equal(pushHref(`Вход: ${SITE}/admin/login?t=abc`, [], SITE), PUSH_HOME);
  assert.equal(pushHref("Без ссылок", [], SITE), "/admin/hq");
  assert.equal(pushHref("x", [[{ text: "Публичный", url: `${SITE}/ru/razbor` }]], SITE), "/admin/hq");
  assert.equal(pushPayload("<b>Архив</b>", [], SITE, true).silent, true);
});

// ── Отправка и мёртвые подписки ────────────────────────────────────────────

test("пуш шифруется и подписывается VAPID; 404 и 410 — подписка мертва", async () => {
  const keys = webpush.generateVAPIDKeys();
  const sub = browserSub();
  let seen: { url: string; init: RequestInit } | null = null;
  const ok = await deliver(sub, { title: "T", body: "B", url: "/admin/hq" }, keys, async (url, init) => {
    seen = { url, init };
    return new Response(null, { status: 201 });
  });
  assert.deepEqual(ok, { ok: true, gone: false, status: 201, error: null });
  assert.equal(seen!.url, sub.endpoint);
  const headers = seen!.init.headers as Record<string, string>;
  assert.match(headers.Authorization ?? headers.authorization, /^vapid t=.+, k=/);
  assert.equal(headers["Content-Encoding"], "aes128gcm");
  assert.ok(Number(headers.TTL) > 0);
  // В теле — не открытый текст.
  assert.ok(!Buffer.from(seen!.init.body as Uint8Array).toString().includes("\"title\""));

  assert.equal(subscriptionGone(410), true);
  assert.equal(subscriptionGone(404), true);
  assert.equal(subscriptionGone(500), false);
  assert.equal(subscriptionGone(429), false);
});

test("рассылка по устройствам: мёртвую удаляет, сбой записывает, удачную отмечает", async () => {
  const keys = webpush.generateVAPIDKeys();
  const subs = [browserSub("live", "https://push.example/live"), browserSub("dead", "https://push.example/dead"), browserSub("sick", "https://push.example/sick")];
  const removed: string[] = [];
  const noted: Record<string, boolean> = {};
  const result = await deliverAll(subs, { title: "T", body: "", url: "/admin/hq" }, {
    keys,
    fetchImpl: async (url) =>
      new Response("nope", { status: url.endsWith("/dead") ? 410 : url.endsWith("/sick") ? 500 : 201 }),
    remove: async (id) => {
      removed.push(id);
    },
    note: async (id, r) => {
      noted[id] = r.ok;
    },
  });
  assert.deepEqual(result, { sent: 1, gone: 1, failed: 1 });
  assert.deepEqual(removed, ["dead"]);
  assert.deepEqual(noted, { live: true, sick: false });

  // Ключей нет (хранилище молчит) — никуда не шлём.
  assert.deepEqual(await deliverAll(subs, { title: "T", body: "", url: "/" }, { keys: null }), { sent: 0, gone: 0, failed: 3 });
});

test("подписку принимаем только настоящую: https и ключи браузера", () => {
  const sub = browserSub();
  assert.deepEqual(parseSubscription({ endpoint: sub.endpoint, keys: sub.keys }), { endpoint: sub.endpoint, keys: sub.keys });
  assert.equal(parseSubscription({ endpoint: "http://push.example/x", keys: sub.keys }), null);
  assert.equal(parseSubscription({ endpoint: sub.endpoint, keys: { p256dh: "<script>", auth: sub.keys.auth } }), null);
  assert.equal(parseSubscription(null), null);
  assert.equal(deviceLabel("Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit Safari/604.1", true), "iPhone · app");
  assert.equal(deviceLabel("Mozilla/5.0 (Linux; Android 14) Chrome/130 Mobile Safari/537.36", false), "Android · Chrome");
});

test("ключи VAPID — в хранилище секретов, не в коде и не в логах", () => {
  const store = read("lib/admin/push-store.ts");
  assert.match(store, /readAppSecret\(VAPID_SECRET\)/);
  assert.match(store, /saveAppSecret\(VAPID_SECRET/);
  assert.doesNotMatch(store, /console\.\w+\([^)]*privateKey/);
  assert.doesNotMatch(read("app/admin/push/route.ts"), /privateKey/);
});

// ── Вход кодом в приложении ───────────────────────────────────────────────

test("код входа: 6 цифр, одноразовый, 5 попыток, 5 минут", () => {
  const now = Date.parse("2026-10-17T10:00:00Z");
  const req = requestHash("r".repeat(43));
  const code = mintCode();
  assert.match(code, /^\d{6}$/);
  const row = (patch: Partial<CodeRow> = {}): CodeRow => ({
    staff_id: "staff-1",
    code_hash: codeHash(req, code),
    attempts: 0,
    expires_at: new Date(now + 5 * 60_000).toISOString(),
    used_at: null,
    ...patch,
  });
  assert.equal(checkCode(row(), req, code, now), "ok");
  assert.equal(checkCode(row(), req, code === "000000" ? "000001" : "000000", now), "wrong");
  // Код от другой попытки (чужое приложение) не подходит.
  assert.equal(checkCode(row(), requestHash("x".repeat(43)), code, now), "wrong");
  // Одноразовый: погашенный не подходит.
  assert.equal(checkCode(row({ used_at: new Date(now).toISOString() }), req, code, now), "used");
  // Пять неверных — дальше не помогает и верный.
  assert.equal(checkCode(row({ attempts: APP_CODE_TRIES - 1 }), req, code, now), "ok");
  assert.equal(checkCode(row({ attempts: APP_CODE_TRIES }), req, code, now), "spent");
  // Срок.
  assert.equal(checkCode(row(), req, code, now + 5 * 60_000), "expired");
  // Бот ещё не прислал.
  assert.equal(checkCode(row({ staff_id: null, code_hash: null, expires_at: null }), req, code, now), "none");
  assert.equal(checkCode(null, req, code, now), "none");

  assert.equal(normalizeCode(" 123 456 "), "123456");
  assert.equal(normalizeCode("12345"), null);
  assert.equal(normalizeCode("abcdef"), null);
  assert.match(codeMessage("012345"), /<code>012345<\/code>/);
});

test("ссылка в бота несёт ключ попытки; база хранит только хеши", () => {
  const id = "A".repeat(43);
  assert.equal(requestFromStart(`app-${id}`), id);
  assert.equal(requestFromStart("app-short"), null);
  assert.equal(requestFromStart("login"), null);
  assert.equal(isAppStart("app"), true);
  assert.equal(isAppStart(`app-${id}`), true);
  assert.equal(isAppStart("order_x"), false);
  const store = read("lib/admin/app-login-store.ts");
  assert.match(store, /code_hash: codeHash\(reqHash, code\)/);
  assert.doesNotMatch(store, /code: code|\bcode,\n/);
  // Каждая неудачная попытка — в журнал.
  assert.match(read("app/admin/login/actions.ts"), /record\("login\.failed", \{[\s\S]*via: "app_code"/);
  // Миграция: таблицы и откат.
  const up = read("supabase/migrations/0168_push_subscriptions.sql");
  assert.match(up, /create table if not exists public\.push_subscriptions/);
  assert.match(up, /endpoint text not null unique/);
  assert.match(up, /alter table public\.app_login_codes enable row level security/);
  assert.match(read("supabase/migrations/0168_push_subscriptions.down.sql"), /drop table if exists public\.push_subscriptions/);
});

test("ничего здесь не зовёт модель", () => {
  for (const file of [
    "lib/admin/push.ts",
    "lib/admin/push-store.ts",
    "lib/admin/push-mirror.ts",
    "lib/admin/app-login.ts",
    "lib/admin/app-login-store.ts",
    "app/admin/push/route.ts",
  ]) {
    assert.doesNotMatch(read(file), /@anthropic-ai|messages\.create|@\/lib\/ai\/|MODEL\b/, file);
  }
});
