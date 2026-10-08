/**
 * Рабочие аккаунты Telegram: несколько отправителей касаний вместо одного.
 *
 * Владелец, 02.10.2026: «У нас дополнительно будет 2 аккаунта, которые я бы
 * хотел подвязать для связи с клиентами».
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { queueView, HOURLY_CAP, MIN_GAP_MS } from "@/lib/admin/outreach";
import { SECTIONS } from "@/lib/admin/roles";
import {
  MAIN_ACCOUNT,
  NEW_ACCOUNT_CAP,
  accountOf,
  canSend,
  hourlyCapacity,
  loginCode,
  loginErrorOf,
  loginPhone,
  maskedPhone,
  online,
  passwordSecret,
  sessionSecret,
} from "@/lib/admin/work-accounts";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const NOW = Date.parse("2026-10-02T12:00:00Z");

test("номер и код — как их набирает человек, в виде, который примет Telegram", () => {
  assert.equal(loginPhone("+998 90 123-45-67"), "+998901234567");
  assert.equal(loginPhone("90 123 45 67"), "+998901234567", "9 цифр — узбекский номер без кода страны");
  assert.equal(loginPhone("48 601 234 567"), "+48601234567");
  assert.equal(loginPhone("123"), null);
  assert.equal(loginCode("12 345"), "12345");
  assert.equal(loginCode("123-456"), "123456");
  assert.equal(loginCode("1234"), null);
  assert.equal(loginCode("abcde"), null);
  assert.equal(maskedPhone("+998901234567"), "+99890•••67");
});

test("чьё письмо: пустое — главного, остальное — свой аккаунт", () => {
  assert.equal(accountOf(null), MAIN_ACCOUNT);
  assert.equal(accountOf(""), MAIN_ACCOUNT);
  assert.equal(accountOf("main"), MAIN_ACCOUNT);
  assert.equal(accountOf("0f8fad5b-d9cb-469f-a165-70867728950e"), "0f8fad5b-d9cb-469f-a165-70867728950e");
  // Секреты в хранилище — с именем аккаунта, но без дефисов.
  assert.equal(sessionSecret("0f8f-ad5b"), "TG_SESSION_0f8fad5b");
  assert.equal(passwordSecret("0f8f-ad5b"), "TG_PASSWORD_0f8fad5b");
});

test("писать может только подключённый и не ограниченный; ёмкость — сумма пределов", () => {
  const active = { status: "active" as const, flood_until: null, hourly_cap: 1 };
  assert.ok(canSend(active, NOW));
  assert.ok(!canSend({ ...active, status: "paused" }, NOW));
  assert.ok(!canSend({ ...active, flood_until: new Date(NOW + 60_000).toISOString() }, NOW));
  assert.ok(canSend({ ...active, flood_until: new Date(NOW - 60_000).toISOString() }, NOW), "ограничение кончилось");
  assert.equal(NEW_ACCOUNT_CAP, 3, "новый аккаунт — три в час, как главный (владелец, 04.10.2026)");

  assert.equal(hourlyCapacity([], NOW), HOURLY_CAP, "без дополнительных — как раньше");
  assert.equal(
    hourlyCapacity([active, { ...active, hourly_cap: 2 }, { ...active, status: "paused" }], NOW),
    HOURLY_CAP + 3,
  );

  assert.ok(online({ seen_at: new Date(NOW - 60_000).toISOString() }, NOW));
  assert.ok(!online({ seen_at: new Date(NOW - 5 * 60_000).toISOString() }, NOW));
  assert.ok(!online({ seen_at: null }, NOW));
});

test("ожидание в очереди считается от общей ёмкости аккаунтов", () => {
  // Час уже занят двумя письмами главного.
  const one = queueView({ ahead: 3, sentLastHour: 2, oldestSentAgoMs: 10 * 60_000 });
  const three = queueView({ ahead: 3, sentLastHour: 2, oldestSentAgoMs: 10 * 60_000, cap: 6 });
  assert.ok(three.waitMs < one.waitMs, "с тремя аккаунтами очередь не стала короче");
  assert.equal(three.waitMs, 3 * MIN_GAP_MS);
});

test("ошибки входа Telegram — кодами", () => {
  assert.equal(loginErrorOf("PHONE_NUMBER_INVALID"), "phone_invalid");
  assert.equal(loginErrorOf("400: PHONE_CODE_INVALID (caused by auth.SignIn)"), "code_invalid");
  assert.equal(loginErrorOf("PHONE_CODE_EXPIRED"), "code_expired");
  assert.equal(loginErrorOf("PASSWORD_HASH_INVALID"), "password_invalid");
  assert.equal(loginErrorOf("FLOOD_WAIT_300"), "flood");
  assert.equal(loginErrorOf("что-то ещё"), "other");
});

test("очередь: письмо берёт один аккаунт, предел и пауза — у каждого свои", () => {
  const queue = read("lib/admin/outreach-queue.ts");
  // Захват — условием в самом update, а не «прочитать и отправить».
  assert.match(queue, /\.update\(\{ dispatch_by: account, dispatch_at: new Date\(now\)\.toISOString\(\) \}\)/);
  assert.match(queue, /if \(\(await sentLastHour\(now, account\)\)\.count >= cap\) return null;/);
  // Последнее письмо — этого аккаунта: пауза между письмами своя.
  assert.match(queue, /const last = \(recent \?\? \[\]\)\.find\(\(row\) => accountOf\(row\.sent_via as string \| null\) === account\);/);
  // Ушло — запомнили, с какого: ответы и правки пойдут с него же.
  assert.match(queue, /sent_via: account,\s*dispatch_by: null,/);
  // Ограничили аккаунт, а писать есть кому — письмо возвращается в очередь.
  assert.match(queue, /if \(isStopError\(why\) && options\.othersAlive\) \{[\s\S]{0,200}dispatch_by: null/);
});

test("ответ и правка — только с того аккаунта, с которого ушло первое письмо", () => {
  const talk = read("lib/admin/outreach-talk-store.ts");
  assert.match(talk, /const owner = accountOf\(p\.sent_via as string \| null\);\s*if \(owner !== account\) \{/);
  // Аккаунт отключили — его переписка уходит человеку, а не висит в очереди.
  assert.match(talk, /if \(account === MAIN_ACCOUNT && !\(await alive\(owner\)\)\) \{\s*await markReplyFailed\(/);
  assert.match(read("lib/admin/outreach-edit.ts"), /if \(p && accountOf\(p\.sent_via\) !== account\) continue;/);

  const runner = read("scout/runner.mjs");
  assert.match(
    runner,
    /function startWorker\(\{ client, Api, NewMessage, key, label, cap, paused, othersAlive, onFlood, afterBanCheck = async \(\) => \{\} \}\)/,
  );
  assert.match(runner, /reply = await nextReply\(key\);/);
  assert.match(runner, /job = await nextEdit\(key\);/);
  assert.match(runner, /await markSent\(job\.id, userId, messageId, key\);/);
  assert.match(runner, /markFailed\(job\.id, why, \{ othersAlive: othersAlive\(key\) \}\)/);
  // Главный — как раньше: читает чаты и пишет.
  assert.match(runner, /key: MAIN_ACCOUNT,[\s\S]{0,120}cap: \(\) => HOURLY_CAP,/);
  assert.match(runner, /const accounts = startAccounts\(\{/);
});

test("вход: сессия и пароль — в хранилище, не в таблице; пароль стирается сразу", () => {
  const migration = read("supabase/migrations/0079_work_accounts.sql");
  assert.match(migration, /alter table public\.tg_accounts enable row level security;/);
  assert.match(migration, /hourly_cap smallint not null default 1/);
  assert.doesNotMatch(migration, /\bsession\s+text\b|\bpassword\s+text\b/, "сессия или пароль в таблице");

  const store = read("lib/admin/work-accounts-store.ts");
  assert.match(store, /if \(!\(await saveAppSecret\(passwordSecret\(id\), password\)\)\) return false;/);
  assert.match(store, /if \(!\(await saveAppSecret\(sessionSecret\(id\), session\)\)\) return false;/);
  // После любого шага пароль стирается — подошёл он или нет.
  assert.match(store, /export async function loginFailed[\s\S]{0,900}await saveAppSecret\(passwordSecret\(id\), null\);/);
  assert.match(store, /export async function loggedIn[\s\S]{0,900}await saveAppSecret\(passwordSecret\(id\), null\);/);

  const accounts = read("scout/accounts.mjs");
  // Код проверяется тем же ключом, которым запрошен: сессия до входа — в хранилище.
  assert.match(accounts, /await codeSent\(job\.id, sent\.phoneCodeHash, client\.session\.save\(\)\);/);
  assert.match(accounts, /const saved = await loginSession\(job\.id\);/);
  assert.match(accounts, /if \(\/SESSION_PASSWORD_NEEDED\/i\.test\(message\)\) \{\s*await needPassword\(job\.id\);/);
  assert.match(accounts, /telegram\.password\.computeCheck\(params, password\)/);
  // Отключили — сеанс в Telegram закрывается, а не просто забывается.
  assert.match(accounts, /await client\.invoke\(new Api\.auth\.LogOut\(\)\);/);
  // Дополнительные аккаунты чатов не читают.
  assert.doesNotMatch(accounts, /openChats|processBatch/);
});

test("раздел «Аккаунты» — владельцу и руководителю", () => {
  // Владелец, 04.10.2026: «дай доступ к разделу „Аккаунты“ Александру».
  const section = SECTIONS.find((s) => s.href === "/admin/accounts");
  assert.ok(section, "раздела нет в меню");
  assert.deepEqual([...section.roles], ["admin", "head"]);
  const actions = read("app/admin/accounts/actions.ts");
  assert.match(actions, /const manage = \(\) => requireRole\("admin", "head"\);/);
  assert.doesNotMatch(actions, /requireAdmin/, "где-то осталась проверка «только владелец»");
  assert.equal((actions.match(/await manage\(\);/g) ?? []).length, 11, "каждое действие проверяет права");
  assert.match(read("app/admin/accounts/page.tsx"), /requireRole\("admin", "head"\)/);
});

test("менеджеры на аккаунте: письма отмеченного — только с его аккаунтов", async () => {
  const { mayTake } = await import("@/lib/admin/work-accounts");
  // Не привязан ни к одному — берёт любой.
  assert.equal(mayTake("main", undefined), true);
  assert.equal(mayTake("acc-1", new Set()), true);
  // Привязан к двум — только они.
  const two = new Set(["main", "acc-2"]);
  assert.equal(mayTake("main", two), true);
  assert.equal(mayTake("acc-2", two), true);
  assert.equal(mayTake("acc-1", two), false);

  const queue = read("lib/admin/outreach-queue.ts");
  assert.match(queue, /if \(by && !mayTake\(account, assigned\.get\(by\)\)\) continue;/);
  // Привязка к отключённому аккаунту письма не держит.
  assert.match(queue, /\.from\("tg_accounts"\)\.select\("id"\)\.neq\("status", "removed"\)/);
  const store = read("lib/admin/work-accounts-store.ts");
  assert.match(store, /await db\.from\("tg_account_staff"\)\.delete\(\)\.eq\("account_key", id\);/);
  assert.match(store, /record\("work_account\.staff"/);
  assert.match(read("app/admin/accounts/page.tsx"), /<StaffForm account=\{MAIN_ACCOUNT\}/);
});


test("в верхнем меню панели открытый раздел подсвечен", async () => {
  // Владелец, 04.10.2026: «когда я нажимаю на пункт в верхнем меню, он не
  // выделен цветом — сделай, чтобы активная вкладка выделялась».
  const { sectionOfHref } = await import("@/lib/admin/help");
  assert.equal(sectionOfHref("/admin/accounts"), "/admin/accounts");
  assert.equal(sectionOfHref("/admin/projects/0f6c7c1e-1111-2222-3333-444455556666"), "/admin/projects");
  assert.equal(sectionOfHref("/admin/leads/42"), "/admin", "карточка лида — раздел «Лиды»");
  const link = read("components/admin/nav-link.tsx");
  assert.match(link, /const active = sectionOfHref\(pathname \?\? ""\) === href;/);
  assert.match(link, /aria-current=\{active \? "page" : undefined\}/);
  assert.match(link, /border-green font-medium text-green/);
  assert.match(read("components/admin/shell.tsx"), /<AdminNavLink key=\{item\.href\} href=\{item\.href\}/);
});
