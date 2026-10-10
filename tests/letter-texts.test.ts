/**
 * Тексты писем касания и A/B (lib/admin/letter-texts.ts).
 *
 * Владелец, 10.10.2026: менеджеры сами вписывают текст, который уходит с
 * рабочих аккаунтов; два текста — A/B по ответам и конверсиям; в автопрогоне
 * заходы из курсов продаж; находка — тезисами: что он теряет и что компании
 * из его ниши мы это уже сделали.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  AUTO_ARMS,
  LETTER_TEXTS,
  MIN_SENT,
  candidates,
  chanceBetter,
  letterProblems,
  pickVariant,
  renderLetter,
  textProblems,
  theses,
  unknownPlaceholders,
  verdict,
  type StoredText,
} from "@/lib/admin/letter-texts";
import { letterSentAt } from "@/lib/admin/letter-texts-store";
import { sendProblems } from "@/lib/admin/outreach-store";
import type { Finding } from "@/lib/audit/checks";

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

const finding = (code: string, title: string, impact = "Клиент уходит."): Finding =>
  ({ code, severity: "major", title, impact, fix: "Чиним." }) as Finding;

const MOBILE = finding("no_viewport", "Сайт не приспособлен к телефонам", "На телефоне страница открывается в масштабе большого экрана. Большинство уходит.");
const PHONE = finding("phone_not_clickable", "Телефон на сайте нельзя нажать с телефона");
const DOWN = { ...finding("unreachable", "Сайт не отвечает"), severity: "critical" } as Finding;
const PRICES = finding("no_prices", "Нигде не указаны цены");
const REF = { name: "MAVERA", url: "https://devuz.studio/cases/mavera", niche: "застройщик" };

test("тезисы: что не так, что он теряет и проект из его ниши — без балла видимости", () => {
  const list = theses([MOBILE, PHONE], REF);
  assert.match(list[0], /^• Сайт не приспособлен к телефонам: покупатели с телефона уходят, не дочитав\.$/);
  assert.ok(list.some((l) => /теряете (от \d+ до \d+|около \d+) обращений из каждых 100/.test(l)), "нет тезиса о потерях");
  assert.match(list[list.length - 1], /^• Для «MAVERA» \(застройщик\) мы это уже сделали, посмотрите: https:\/\/devuz\.studio\/cases\/mavera$/);
  assert.ok(!list.join(" ").includes("из 100 —"), "балл видимости вернулся");
  assert.ok(list.length <= 3);

  // Проекта в его нише нет — тезиса «уже сделали» нет: выдумкой его не заменяем.
  assert.ok(!theses([MOBILE], null).some((l) => l.includes("уже сделали")));
  // Сайт лежит — без чисел, но с тем, что он теряет.
  assert.deepEqual(theses([DOWN, MOBILE], null), [
    "• Сайт не открывается: клиенты попадают в никуда и уходят к тем, у кого открылось.",
    "• Пока это так, вы теряете каждого, кто зашёл на сайт.",
  ]);
  // Цен в касании нет (NOT_IN_OUTREACH) — и тезиса о них тоже.
  assert.deepEqual(theses([PRICES], null), []);
});

test("подстановки по-русски и латиницей; опечатка не уходит клиенту", () => {
  // «Кто пишет»: у автопрогона имя — сама студия, и дважды её не называем.
  assert.equal(renderLetter("{кто}.", { host: "a.uz", label: null, sender: "Мадина", theses: [] }), "Это Мадина из студии DevUz (devuz.studio).");
  assert.equal(renderLetter("{kim}.", { host: "a.uz", label: null, sender: "DevUz Studio", theses: [] }), "Это студия DevUz (devuz.studio).");
  // Технический заголовок отчёта — словами покупателя, иначе проверка письмо не пропустит.
  const e404 = { ...finding("http_error", "Сайт отвечает ошибкой 404"), severity: "critical" } as Finding;
  assert.match(theses([e404], null)[0], /^• Вместо сайта открывается страница с ошибкой:/);
  // Потери «1–3 из 100» не убеждают — такого тезиса нет.
  const weak = finding("no_favicon", "У вкладки сайта нет значка");
  assert.ok(!theses([weak], null).some((l) => l.includes("обращений")));
  const ctx = { host: "mebel.uz", label: null, sender: "Мадина", theses: ["• Тезис."] };
  assert.equal(
    renderLetter("{имя} ({ism}), {сайт}/{sayt}, {компания}:\n{тезисы}\n{prototip}", ctx),
    "Мадина (Мадина), mebel.uz/mebel.uz, mebel.uz:\n• Тезис.\nЗа 12 часов бесплатно соберём прототип вашего нового сайта: откроете с телефона и посмотрите вживую.",
  );
  assert.deepEqual(unknownPlaceholders("{тезисы} {сайтт} {Сайт}"), ["сайтт"]);
});

test("заходы автопрогона проходят проверку перед отправкой — с проектом и без", () => {
  for (const reference of [REF, null]) {
    for (const findings of [[MOBILE, PHONE], [DOWN], [PHONE]]) {
      const points = theses(findings, reference);
      for (const arm of AUTO_ARMS) {
        if (arm.needsReference && !reference) continue;
        const ctx = { host: "mebel.uz", label: "Мебель", sender: "DevUz Studio", theses: points };
        const letter = renderLetter(arm.body, ctx);
        assert.deepEqual(letterProblems(letter, { ...ctx, reference: reference?.name ?? null }), [], `${arm.key}: ${letter}`);
        assert.ok(letter.split(/\s+/).length <= 90, `${arm.key} длинный`);
        assert.doesNotMatch(letter, /—|–\s|\s-\s/, `${arm.key}: длинное тире в тексте захода`);
      }
    }
  }
});

test("свой текст: без тезисов, с приветствием, со своими числами и жаргоном — не сохраняется", () => {
  const codes = (t: string) => textProblems(t, "Мадина").map((p) => p.code);
  assert.deepEqual(codes("Мадина, DevUz Studio. Посмотрели {сайт}:\n{тезисы}\n{прототип} Собрать?"), []);
  assert.ok(codes("Мадина, DevUz. Посмотрели {сайт}, есть что улучшить. Собрать прототип?").includes("no_theses"));
  assert.ok(codes("Здравствуйте! {тезисы} {прототип}").includes("greeting"));
  assert.ok(codes("Посмотрели {сайт}: {тезисы} Сделаем за 3 дня, хотите?").includes("invented"));
  assert.ok(codes("Посмотрели {сайт}, у вас слабый сервер: {тезисы} Собрать?").includes("jargon"));
  assert.ok(codes("Посмотрели {сайтт}: {тезисы} Собрать прототип?").includes("unknown_placeholder"));
  assert.ok(codes("Выведем {сайт} в топ: {тезисы} Собрать?").includes("banned"));
});

test("кому какой текст: свои → общие → заходы; «Свои в нише» только с проектом", () => {
  const text = (id: string, owner: string | null, slot: "a" | "b"): StoredText => ({ id, owner, slot, body: "{тезисы}", body_uz: null });
  const own = [text("1", "m", "a"), text("2", "m", "b")];
  const common = [text("3", null, "a")];
  assert.deepEqual(candidates({ autopilot: false, own, common, hasReference: true }).map((v) => v.id), ["text:1", "text:2"]);
  assert.deepEqual(candidates({ autopilot: false, own: [], common, hasReference: true }).map((v) => v.id), ["text:3"]);
  assert.deepEqual(candidates({ autopilot: false, own: [], common: [], hasReference: false }).map((v) => v.id), ["auto:pain", "auto:question"]);
  // Автопрогон пишет своими заходами, а не текстами менеджеров.
  assert.deepEqual(candidates({ autopilot: true, own, common, hasReference: true }).map((v) => v.id), ["auto:pain", "auto:question", "auto:rival"]);

  const list = candidates({ autopilot: false, own, common: [], hasReference: false });
  assert.equal(pickVariant(list, () => 0)?.id, "text:1");
  assert.equal(pickVariant(list, () => 0.99)?.id, "text:2");
  assert.equal(pickVariant([], () => 0), null);
});

test("A/B: рано судить, пока мало писем; лидер — только с уверенностью", () => {
  const arm = (id: string, sent: number, replied: number) => ({ id, sent, replied, wanted: 0, deals: 0 });
  assert.deepEqual(verdict([arm("a", MIN_SENT - 1, 5), arm("b", 40, 30)]), { kind: "early" });
  assert.deepEqual(verdict([arm("a", 40, 10), arm("b", 40, 11)]), { kind: "even" });
  const v = verdict([arm("a", 60, 6), arm("b", 60, 24)]);
  assert.equal(v.kind, "leader");
  assert.equal(v.kind === "leader" ? v.id : "", "b");
  assert.ok(chanceBetter(arm("a", 60, 6), arm("b", 60, 24)) > 0.99);
  assert.ok(Math.abs(chanceBetter(arm("a", 30, 10), arm("b", 30, 10)) - 0.5) < 0.01);
});

test("письмо ушло: через бота — после ответа на «Здравствуйте», кружок не в счёт; вручную — по отметке", () => {
  const pitch = "2026-10-11T08:00:00Z";
  const msg = (kind: string, at: string) => ({ direction: "out", kind, status: "sent", created_at: at, sent_at: at });
  const bot = { target_kind: "phone", status: "sent", pitch_at: pitch, touched_at: "2026-10-11T07:00:00Z" };
  assert.equal(letterSentAt(bot, [msg("text", "2026-10-11T08:03:00Z")]), Date.parse("2026-10-11T08:03:00Z"));
  assert.equal(letterSentAt(bot, [msg("circle", "2026-10-11T08:02:00Z")]), null, "кружок засчитан письмом");
  assert.equal(letterSentAt({ ...bot, pitch_at: null }, [msg("text", "2026-10-11T06:00:00Z")]), null, "«Здравствуйте» засчитано письмом");
  const manual = { target_kind: "manual", status: "sent", pitch_at: null, touched_at: "2026-10-11T09:00:00Z" };
  assert.equal(letterSentAt(manual, []), Date.parse("2026-10-11T09:00:00Z"));
  assert.equal(letterSentAt({ ...manual, status: "manual" }, []), null);
});

test("перед отправкой письмо по тексту проверяется своими правилами, а не баллом и потерями", () => {
  const points = theses([MOBILE, PHONE], null);
  const message = renderLetter(AUTO_ARMS[0].body, { host: "mebel.uz", label: null, sender: "Мадина", theses: points });
  const prospect = {
    host: "mebel.uz",
    label: null,
    niche: null,
    findings: [MOBILE, PHONE],
    draft: null,
    walked: null,
    message,
    proto_url: null,
    checked_at: new Date().toISOString(),
  };
  assert.deepEqual(sendProblems({ ...prospect, letter_variant: "auto:pain" }, "Мадина"), []);
  // Тот же текст как письмо модели — отбили бы за балл и потери: правила разные.
  assert.ok(sendProblems({ ...prospect, letter_variant: null }, "Мадина").length > 0);
  // Старая проверка по факту — не уходит и по тексту.
  const stale = { ...prospect, checked_at: "2026-01-01T00:00:00Z", letter_variant: "auto:pain" };
  assert.deepEqual(sendProblems(stale, "Мадина").map((p) => p.code), ["not_checked"]);
});

test("письмо больше не пишет модель: подготовка и письмо после ответа идут по тексту", () => {
  assert.equal(LETTER_TEXTS, true);
  const store = read("lib/admin/outreach-store.ts");
  assert.equal(store.match(/LETTER_TEXTS\s*\n?\s*\? await letterFromText\(/g)?.length, 2, "prepareOutreach и writeLetterLater");
  assert.match(store, /letter_variant: composed\.variant/);
  assert.match(store, /if \(prospect\.letter_variant\) \{/);
  // Сайт не по-русски — письмо на его языке, как раньше.
  assert.match(store, /translateLetter\(russian, input\.lang, input\.host\)/);

  const page = read("app/admin/prospect/texts/page.tsx");
  assert.match(page, /helpAnchor\("\/admin\/prospect", "texts"\)/);
  assert.match(read("app/admin/prospect/page.tsx"), /href="\/admin\/prospect\/texts"/);
  const actions = read("app/admin/prospect/texts/actions.ts");
  assert.match(actions, /requireRole\("admin", "head"\)/, "общие тексты правит кто угодно");
  assert.match(actions, /textProblems\(body, staff\.display_name\)/, "текст сохраняется без проверки");
});
