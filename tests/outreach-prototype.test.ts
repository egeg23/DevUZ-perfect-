/**
 * Первое письмо касания: прототип за 12 часов, разбор глубже, текст короче.
 *
 * Владелец, 02.10.2026:
 *  1) «добавь информацию, что мы сделаем прототип сайта за 12 часов, чтобы
 *     нагляднее показать и пощупать руками. Сейчас мы об этом не пишем»;
 *  2) «анализ сайта в касании должен быть чуть глубже»;
 *  3) «текст сократи, а то много воды и кажется, что это автоматическая
 *     рассылка».
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import type { Finding } from "@/lib/audit/checks";
import { proof } from "@/content/company";
import {
  OUTREACH_SYSTEM,
  PROTOTYPE_HOURS,
  mentionsPrototype,
  messageProblems,
  outreachPrompt,
} from "@/lib/admin/outreach";
import { NOSITE_SYSTEM, nositePrompt, nositeProblems } from "@/lib/admin/outreach-nosite";
import { HANDOVER_TEXT, readInbound } from "@/lib/admin/outreach-talk";

const f = (code: string, title: string): Finding => ({ code, severity: "major", title, impact: "клиенты уходят", fix: "" });

const findings = [
  f("no_viewport", "С телефона сайт открывается в масштабе монитора"),
  f("no_prices", "На сайте нет цен"),
  f("phone_not_clickable", "Телефон на сайте не нажимается"),
  f("no_messenger", "Нет кнопки Telegram или WhatsApp"),
  f("no_og", "Ссылка пересылается без карточки"),
];

const prompt = outreachPrompt({ host: "mebel.uz", label: null, niche: null, findings, draft: null, sender: "Данил" });

test("прототип за 12 часов — в задании, в правилах и в проверке", () => {
  assert.equal(PROTOTYPE_HOURS, 12);
  assert.match(prompt, /за 12 часов соберём прототип/);
  assert.match(OUTREACH_SYSTEM, /за 12 часов соберём прототип/);
  assert.match(OUTREACH_SYSTEM, /собрать ли ему такой прототип/);

  const body = "Здравствуйте! Это Данил из devuz.studio, открыл ваш сайт mebel.uz. С телефона он открывается в масштабе монитора, цен нет ни на одной странице, а телефон не нажимается — человек уходит к тем, у кого проще. Ничего страшного, это поправимо.";
  const codes = (m: string) => messageProblems(m, prompt, "mebel.uz").map((p) => p.code);
  assert.ok(codes(body).includes("no_prototype"), "письмо без прототипа ушло бы");
  assert.ok(!codes(`${body} За 12 часов соберём прототип нового сайта — откроете с телефона. Собрать?`).includes("no_prototype"));
  assert.deepEqual(codes(`${body} За 12 часов соберём прототип нового сайта — откроете с телефона. Собрать?`), []);
});

test("«12 часов» узнаётся на всех языках письма, но не в чужом числе", () => {
  assert.ok(mentionsPrototype("Соберём прототип за 12 часов."));
  assert.ok(mentionsPrototype("за 12-часовой срок"));
  assert.ok(mentionsPrototype("12 soat ichida yangi sayt prototipini yig‘ib beramiz."));
  assert.ok(mentionsPrototype("We can build a prototype in 12 hours."));
  assert.ok(!mentionsPrototype("Видимость 112 из 100, 12 страниц."));
  assert.ok(!mentionsPrototype("Через 120 часов."));
});

test("разбор глубже: до четырёх находок про клиентов и место на сайте у каждой", () => {
  for (const finding of findings.slice(0, 4)) assert.ok(prompt.includes(finding.title), finding.title);
  assert.match(prompt, /Первые четыре — про его клиентов и деньги: открывай письмо ими/);
  // Письмо после «Здравствуйте» короткое (lib/admin/hello-first.ts): одна-две находки.
  assert.match(prompt, /Назови одну-две находки, каждую — с местом на сайте/);
  assert.match(OUTREACH_SYSTEM, /Глубже, а не длиннее/);
});

test("вода убрана: ни масштаба студии, ни среднего роста, ни «до и после»", () => {
  assert.doesNotMatch(prompt, /разработчиков в штате|Средний рост лидогенерации|до работ и после/);
  assert.doesNotMatch(OUTREACH_SYSTEM, /Масштаб студии и средний рост назвать можно/);
  assert.match(OUTREACH_SYSTEM, /Не рассказывай о студии/);
  assert.match(OUTREACH_SYSTEM, /от 45 до 70 слов/);

  // «30 разработчиков» больше не разрешено заданием — это выдумка письма.
  const withScale = `Здравствуйте! Это Данил из devuz.studio про сайт mebel.uz. У нас ${proof.staff} разработчиков и ${proof.projects} проектов. С телефона сайт открывается в масштабе монитора, цен нет, телефон не нажимается. За 12 часов соберём прототип. Собрать?`;
  assert.ok(messageProblems(withScale, prompt, "mebel.uz").some((p) => p.code === "invented"));

  const long = Array.from({ length: 160 }, () => "слово").join(" ");
  assert.ok(messageProblems(`mebel.uz devuz.studio 12 часов ${long}`, prompt, "mebel.uz").some((p) => p.code === "long"));
});

test("компания без сайта: тоже прототип за 12 часов и тоже без воды", () => {
  const p = nositePrompt({ label: "Barber", niche: "барбершоп", sender: "Егор" });
  assert.match(p, /за 12 часов соберём прототип/);
  assert.doesNotMatch(p, /разработчиков в штате|Средний рост/);
  assert.match(NOSITE_SYSTEM, /Предложи прототип/);
  assert.match(NOSITE_SYSTEM, /от 45 до 70 слов/);
  const body = "Здравствуйте! Это Егор из devuz.studio. Вы барбершоп, а сайта нет — тот, кто ищет барбершоп в Ташкенте, попадает к конкурентам. Проверьте поиск сами, это минута. Аккаунт в соцсети можно потерять, и поиск его не читает.";
  assert.ok(nositeProblems(body, p).some((x) => x.code === "no_prototype"));
  assert.deepEqual(nositeProblems(`${body} За 12 часов соберём прототип сайта под ваши услуги. Собрать?`, p), []);
});

test("«да, соберите» уходит человеку, а не модели", () => {
  for (const text of [
    "Да, соберите прототип",
    "Давайте, интересно посмотреть на прототип",
    "Пришлите прототип, посмотрим",
    "Ha, prototip yig‘ib bering",
    "Yes, please make the prototype",
    "Соберите, пожалуйста",
  ]) {
    assert.equal(readInbound(text), "proto", text);
  }
  assert.equal(readInbound("Не интересно, прототип не нужен"), "stop", "отказ сильнее слова «прототип»");
  assert.equal(readInbound("Позвоните мне насчёт прототипа"), "human");
  assert.match(HANDOVER_TEXT.proto, /12 часов/);
});
