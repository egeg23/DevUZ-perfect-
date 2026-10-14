/**
 * Скан макетов дважды в день: наши ссылки в переписке → «Макеты клиентов».
 *
 * Владелец, 14.10.2026: «Идентифицируй макеты по нашей ссылке, мы же
 * отправляем их вида devuz.studio/proto/*********, пусть бот сканирует 2 раза
 * в день и вносит туда эти данные».
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { OFFER_MS, mockupLinks } from "@/lib/admin/mockup-offer";
import { offerCard } from "@/lib/admin/mockup-offer-bot";
import { FRESH_MS, SCAN_MS, inScan, scanFields, scanKind, scanSlot, scanSummary } from "@/lib/admin/mockup-scan";
import { feedOf, mockupsPulse, type HqMockup } from "@/lib/admin/hq";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const TOKEN = "oLWlBsD_H8BZwo-m2qO60vCSv0TbGMrJBSsru_wHpZM";

test("ссылка на макет: с https и без, с www, с хвостом и со знаком препинания", () => {
  const want = [{ kind: "proto", token: TOKEN }];
  for (const text of [
    `https://devuz.studio/proto/${TOKEN}`,
    `http://www.devuz.studio/proto/${TOKEN}`,
    `www.devuz.studio/proto/${TOKEN}`,
    `devuz.studio/proto/${TOKEN}`,
    `Ваш макет: devuz.studio/proto/${TOKEN}.`,
    `Смотрите (https://devuz.studio/proto/${TOKEN}), пароль 12345`,
    `https://devuz.studio/proto/${TOKEN}/about?utm=tg`,
    `«https://DEVUZ.STUDIO/proto/${TOKEN}»!`,
  ]) {
    assert.deepEqual(mockupLinks(text), want, text);
  }
  assert.deepEqual(mockupLinks("cases.devuz.studio/engelberg/v2, смотрите"), [{ kind: "showcase", path: "engelberg/v2" }]);
  assert.deepEqual(mockupLinks("www.cases.devuz.studio/engelberg."), [{ kind: "showcase", path: "engelberg" }]);
  // Не наш адрес и не макет.
  assert.deepEqual(mockupLinks(`https://mydevuz.studio/proto/${TOKEN}`), []);
  assert.deepEqual(mockupLinks("https://devuz.studio/cases/delta"), [], "кейс на сайте студии — не макет");
});

test("скан — в 09:00 и 15:00 по Ташкенту, слот один на окно", () => {
  // Ташкент = UTC+5.
  assert.equal(scanSlot(new Date("2026-10-14T04:00:00Z")), "2026-10-14@9");
  assert.equal(scanSlot(new Date("2026-10-14T06:59:00Z")), "2026-10-14@9");
  assert.equal(scanSlot(new Date("2026-10-14T07:00:00Z")), null);
  assert.equal(scanSlot(new Date("2026-10-14T10:05:00Z")), "2026-10-14@15");
  assert.equal(scanSlot(new Date("2026-10-14T03:59:00Z")), null);
  assert.equal(scanSlot(new Date("2026-10-14T20:00:00Z")), null);
});

test("старые находки клиенту задним числом не пишут", () => {
  const now = new Date("2026-10-14T05:00:00Z");
  const ago = (ms: number) => new Date(now.getTime() - ms);

  // Больше 48 часов — сразу «закончилась», без строки «акция закончилась».
  assert.equal(scanKind(ago(OFFER_MS + 60_000), now), "expired");
  const old = scanFields(ago(7 * 24 * 3600_000), now);
  assert.deepEqual(old, { source: "scan", quiet: true, status: "expired", expired_noted_at: now.toISOString() });

  // В окне, но давно — идёт, но тихо.
  assert.equal(scanKind(ago(FRESH_MS + 60_000), now), "quiet");
  assert.deepEqual(scanFields(ago(10 * 3600_000), now), { source: "scan", quiet: true, status: "active", expired_noted_at: null });

  // Свежее — как обычная отправка, с условиями клиенту.
  assert.equal(scanKind(ago(30 * 60_000), now), "fresh");
  assert.equal(scanFields(ago(30 * 60_000), now).quiet, false);

  // Окно скана — 14 дней.
  assert.equal(inScan(ago(SCAN_MS - 60_000), now), true);
  assert.equal(inScan(ago(SCAN_MS + 60_000), now), false);
});

test("тихие строки: условия и напоминания клиенту не уходят", () => {
  const run = read("lib/admin/mockup-offer-run.ts");
  // quiet идёт тем же путём, что клиент не из касаний: только карточка команде.
  assert.match(run, /if \(!o\.prospect_id \|\| o\.quiet\) \{/);
  assert.match(run, /quiet/);
  assert.match(run, /Макет найден сканом/);
  const store = read("lib/admin/mockup-offer-store.ts");
  assert.match(store, /\.\.\.\(input\.scan \? scanFields\(at, input\.scan\.now\) : \{\}\)/);
});

test("скан базы: исходящие касаний и переписка лидов, дата — самого сообщения", () => {
  const src = read("lib/admin/mockup-scan-store.ts");
  assert.match(src, /from\("outreach_messages"\)/);
  assert.match(src, /from\("lead_messages"\)/);
  assert.match(src, /new Date\(String\(m\.sent_at\)\)/);
  // Без касания строку держит уникальный индекс по peer: повторный скан не задвоит.
  assert.match(src, /`lead:\$\{/);
  assert.match(src, /claimMockupScan\(DB_SCAN, slot\)/);
  // Без модели.
  assert.doesNotMatch(src, /anthropic|messages\.create/i);
  assert.doesNotMatch(read("lib/admin/mockup-scan.ts"), /anthropic|messages\.create/i);
  const sweep = read("app/api/reminders/sweep/route.ts");
  assert.match(sweep, /await scanDatabase\(new Date\(\)\)/);
  assert.match(sweep, /await noteScanFinds\(new Date\(\)\)/);
});

test("скаут сканирует свои диалоги бережно и с датой сообщения", () => {
  const scout = read("scout/runner.mjs");
  assert.match(scout, /const scanMockups = async/);
  assert.match(scout, /if \(scanning \|\| paused\(\)\) return;/, "ограниченный аккаунт не сканирует");
  assert.match(scout, /claimMockupScan\(key, slot\)/);
  assert.match(scout, /SCAN_PAUSE_MS/);
  assert.match(scout, /\.slice\(0, SCAN_DIALOGS\)/);
  assert.match(scout, /m\?\.out/);
  assert.match(scout, /at: new Date\(Number\(m\.date\) \* 1000\)/);
  assert.match(scout, /scan: \{ now \}/);
});

test("итог скана — только если нашлось; карточка помечена «найдено сканом»", () => {
  assert.equal(scanSummary([]), null);
  const text = scanSummary([
    { client: "Asmo Clinic", mockup_name: "Asmo", status: "active", quiet: true },
    { client: "", mockup_name: "HOP.UZ", status: "expired", quiet: true },
  ]);
  assert.match(text ?? "", /нашлось 2, акция идёт у 1/);
  assert.match(text ?? "", /Asmo Clinic · акция идёт, клиенту не пишем/);
  assert.match(text ?? "", /HOP\.UZ · ушёл больше 48 часов назад/);

  const card = offerCard(
    {
      id: "00000000-0000-0000-0000-000000000001",
      mockup_ref: "p:00000000-0000-0000-0000-000000000002",
      mockup_name: "Asmo",
      mockup_url: "https://devuz.studio/proto/x",
      prospect_id: "00000000-0000-0000-0000-000000000003",
      lead_id: null,
      client: "Asmo Clinic",
      peer: null,
      status: "active",
      sent_at: "2026-10-13T05:00:00Z",
      expires_at: "2026-10-15T05:00:00Z",
      password_at: null,
      source: "scan",
      quiet: true,
    },
    new Date("2026-10-14T05:00:00Z"),
  );
  assert.match(card.text, /найдено сканом/);
  assert.match(card.text, /напоминания клиенту бот не пишет/);
});

test("«Главная» показывает найденное сканом", () => {
  const now = new Date("2026-10-14T10:00:00Z");
  const found: HqMockup = {
    id: "1",
    client: "HOP.UZ",
    mockup_name: "HOP.UZ",
    status: "expired",
    sent_at: "2026-10-07T10:00:00Z",
    expires_at: "2026-10-09T10:00:00Z",
    approved_at: null,
    source: "scan",
    created_at: "2026-10-14T04:10:00Z",
  };
  assert.equal(mockupsPulse([found], now).scanned7, 1);
  const feed = feedOf({ leads: [], events: [], mockups: [found], tasks: [], names: new Map() }, now);
  assert.ok(feed.some((f) => f.kind === "mockupFound" && f.label === "HOP.UZ"));
});
