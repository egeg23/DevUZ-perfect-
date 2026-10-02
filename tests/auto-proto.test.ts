/**
 * Прототип заранее — для касания, без человека.
 *
 * Владелец, 02.10.2026: «Давай пункт 1, максимально автоматизируй его» —
 * компаниям из пула касаний с худшими сайтами заранее собирать прототипы и
 * отправлять в касании ссылку вместо обещания.
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { PROTO_NICHES, protoNicheFor } from "@/content/proto/models";
import { messageProblems, outreachHooks, outreachPrompt, OUTREACH_SYSTEM } from "@/lib/admin/outreach";
import { HANDOVER_TEXT } from "@/lib/admin/outreach-talk";
import type { Finding } from "@/lib/audit/checks";
import { AUTO_NOTES, isAutoNote } from "@/lib/proto/auto-note";
import { pageText, servicesPagePath } from "@/lib/proto/collect";
import { fromPanel, isPreviewFetch, openedText } from "@/lib/proto/opened";
import { buildProto } from "@/lib/proto/render";
import { emptyFacts } from "@/lib/proto/facts";
import { AUTO_SERVICES_MAX, autoName, verifiedServices } from "@/lib/proto/services";
import { protoNoteDict } from "@/content/admin-panel/prospect";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("ниша касания — в нишу прототипа: и с карт по-русски, и слагом разбора", () => {
  assert.equal(protoNicheFor("стоматология")?.key, "stomatologiya");
  assert.equal(protoNicheFor("stomatologiya")?.key, "stomatologiya");
  assert.equal(protoNicheFor("Учебный центр")?.key, "uchebnyy-centr");
  assert.equal(protoNicheFor("uchebnyy-centr")?.key, "uchebnyy-centr");
  assert.equal(protoNicheFor("medcentr")?.key, "medcentr");
  assert.equal(protoNicheFor("avtoservis")?.key, "avtoservis");
  assert.equal(protoNicheFor("salon-krasoty")?.key, "salon-krasoty");
  // Застройщику страница записи — чужой бизнес: не собираем.
  assert.equal(protoNicheFor("застройщик"), null);
  assert.equal(protoNicheFor("nedvizhimost"), null);
  assert.equal(protoNicheFor(null), null);
  assert.equal(protoNicheFor(""), null);
});

test("новые ниши собираются и проходят проверку, в стоматологию приходят, а не приезжают", () => {
  for (const key of ["stomatologiya", "uchebnyy-centr", "medcentr"]) {
    assert.ok(PROTO_NICHES.some((n) => n.key === key), `нет ниши ${key}`);
    const build = buildProto({
      ...emptyFacts("Smile Dent", key, "smile.uz"),
      services: [{ name: "Лечение кариеса" }, { name: "Имплантация" }, { name: "Отбеливание" }],
      telegram: "@smile_dent",
    });
    assert.ok(build && !build.missing.length, `${key}: не собралась`);
    assert.deepEqual(build.problems, [], `${key}: ${build.problems.map((p) => p.text).join("; ")}`);
    assert.match(build.html, /Приходите к назначенному времени/);
  }
  const tyres = buildProto({
    ...emptyFacts("Tirex", "shinomontazh", "tirex.uz"),
    services: [{ name: "Балансировка" }, { name: "Ремонт проколов" }, { name: "Хранение шин" }],
    telegram: "@tirex",
  });
  assert.match(tyres!.html, /Приезжаете к назначенному времени/);
});

const PAGE = `Стоматология «Smile Dent» в Ташкенте
Наши услуги
Лечение кариеса — от 150 000 сум
Имплантация зубов
Профессиональная гигиена
Отбеливание ZOOM
Записаться
Опытные врачи`;

test("услуга попадает в прототип, только если стоит на его сайте дословно", () => {
  const services = verifiedServices(
    [
      { name: "Лечение кариеса", price: "от 150 000 сум" },
      { name: "Имплантация зубов", price: "от 3 000 000 сум" }, // цены на сайте нет
      { name: "Профессиональная  гигиена", price: null }, // лишний пробел — не повод выбросить
      { name: "Виниры", price: null }, // у всех в нише есть, у него — нет
      { name: "Отбеливание Zoom", price: null }, // регистр не важен
      { name: "Записаться", price: null }, // призыв, не услуга
      { name: "лечение кариеса", price: null }, // повтор
      { name: 42, price: null },
    ],
    PAGE,
  );
  assert.deepEqual(services, [
    { name: "Лечение кариеса", price: "от 150 000 сум" },
    { name: "Имплантация зубов", price: null },
    { name: "Профессиональная гигиена", price: null },
    { name: "Отбеливание Zoom", price: null },
  ]);
  const many = Array.from({ length: 20 }, (_, i) => ({ name: `Услуга номер ${i + 1}`, price: null }));
  const page = many.map((s) => s.name).join("\n");
  assert.equal(verifiedServices(many, page).length, AUTO_SERVICES_MAX);
});

test("название: с карт, потом то, что нашла модель на странице, потом вкладка — но не «Главная»", () => {
  assert.equal(autoName({ label: "Smile Dent", model: "Другое", title: "Главная", page: PAGE }), "Smile Dent");
  assert.equal(autoName({ label: null, model: "Smile Dent", title: "Главная", page: PAGE }), "Smile Dent");
  assert.equal(autoName({ label: null, model: "Выдуманное имя", title: "Главная - Smile", page: PAGE }), null);
  assert.equal(autoName({ label: null, model: null, title: "Smile Dent | Стоматология", page: PAGE }), "Smile Dent");
});

test("текст страницы — без скриптов и разметки; страница услуг — своя и по названию", () => {
  const html = `<html><head><style>.a{}</style><script>var x = "Имплантация";</script></head>
    <body><nav><a href="/">Главная</a><a href="/uslugi/">Услуги</a><a href="https://other.uz/services">Чужие</a></nav>
    <h2>Лечение&nbsp;кариеса</h2><p>от 150&#160;000 сум</p></body></html>`;
  const text = pageText(html);
  assert.ok(!text.includes("var x"), "скрипт попал в текст");
  assert.match(text, /Лечение кариеса/);
  assert.equal(servicesPagePath(html, new URL("https://smile.uz/")), "https://smile.uz/uslugi/");
  assert.equal(servicesPagePath('<a href="/kursy">Kurslar</a>', new URL("https://edu.uz/")), "https://edu.uz/kursy");
  assert.equal(servicesPagePath('<a href="https://other.uz/uslugi">Услуги</a>', new URL("https://smile.uz/")), null);
});

const f = (code: string, title: string): Finding => ({ code, severity: "major", title, impact: "клиенты уходят", fix: "" });
const findings = [f("no_viewport", "С телефона сайт открывается в масштабе монитора"), f("no_prices", "На сайте нет цен")];
const URL_ = "https://devuz.studio/proto/0f8fad5bd9cb469fa16570867728950e";

test("прототип собран — письмо даёт ссылку вместо обещания, и проверка её требует", () => {
  const prompt = outreachPrompt({ host: "smile.uz", label: null, niche: null, findings, draft: null, sender: "Данил", prototype: URL_ });
  assert.ok(prompt.includes(`Прототип уже собран: ${URL_}`));
  assert.ok(!/за 12 часов соберём прототип/.test(prompt), "обещание осталось рядом с готовой ссылкой");
  assert.match(OUTREACH_SYSTEM, /ссылка на уже собранный прототип/);

  const hooks = { ...outreachHooks([], null, URL_), seo: null, lost: null };
  const body =
    "Здравствуйте! Это Данил из devuz.studio, открыл ваш сайт smile.uz. С телефона он открывается в масштабе монитора, а цен нет ни на одной странице — человек уходит туда, где проще. Мы уже собрали прототип вашего нового сайта — откройте с телефона:";
  const codes = (m: string) => messageProblems(m, prompt, "smile.uz", hooks).map((p) => p.code);
  assert.ok(codes(body).includes("no_proto_link"), "письмо без ссылки ушло бы");
  assert.ok(!codes(body).includes("no_prototype"), "с готовой ссылкой «12 часов» не нужны");
  assert.deepEqual(codes(`${body}\n${URL_}\nКак вам такой вариант?`), []);
  // Потерянная буква в токене — 404 у клиента.
  assert.ok(codes(`${body}\n${URL_.slice(0, -1)}\nКак вам?`).includes("no_proto_link"));
});

test("без прототипа письмо прежнее — «соберём за 12 часов»", () => {
  const prompt = outreachPrompt({ host: "smile.uz", label: null, niche: null, findings, draft: null, sender: "Данил" });
  assert.match(prompt, /за 12 часов соберём прототип/);
  assert.equal(outreachHooks([]).prototype, null);
});

test("подготовка письма собирает прототип заранее и кладёт ссылку в письмо и в проверку", () => {
  const store = read("lib/admin/outreach-store.ts");
  assert.match(store, /const proto = await autoPrototype\(\{\s*prospect,\s*siteNiche: niche,[\s\S]{0,80}\}\)\.catch\(/);
  assert.match(store, /walked: deep\.walked,\s*prototype,/);
  assert.match(store, /outreachHooks\(findings, reference\?\.name \?\? null, prototype\)/);
  // Проверка перед отправкой пересобирает то же самое.
  assert.match(store, /prototype: prospect\.proto_url,/);

  const auto = read("lib/proto/auto.ts");
  // Одна попытка на касание — отметка условная, до обхода.
  assert.match(auto, /\.update\(\{ proto_tried_at: new Date\(\)\.toISOString\(\) \}\)\s*\.eq\("id", prospect\.id\)\s*\.is\("proto_tried_at", null\)/);
  // Отказ модели возвращает попытку.
  assert.match(auto, /if \(modelTrouble\(error\)\) \{[\s\S]{0,200}proto_tried_at: null/);
  // Наружу — только прошедший проверку.
  assert.match(auto, /if \(saved\.problems\.length\) return done\("draft"\);/);
  assert.match(auto, /auto: true,/);

  // Ушло письмо — ушёл и прототип; скауту — без сборки страниц.
  const queue = read("lib/admin/outreach-queue.ts");
  assert.match(queue, /\.from\("protos"\)\s*\.update\(\{ status: "sent"/);
  assert.ok(!/from "@\/lib\/proto\//.test(queue), "очередь скаута тянет сборку прототипов");

  const migration = read("supabase/migrations/0078_auto_prototypes.sql");
  assert.match(migration, /add column if not exists proto_url text/);
  assert.match(migration, /grant execute on function public\.proto_seen\(uuid\) to service_role/);
});

test("открытие: превью мессенджера и свои из панели не считаются, о первом — строка автору", () => {
  assert.ok(isPreviewFetch("TelegramBot (like TwitterBot)"));
  assert.ok(isPreviewFetch("WhatsApp/2.23.20.0 A"));
  assert.ok(isPreviewFetch("facebookexternalhit/1.1"));
  assert.ok(isPreviewFetch(""));
  assert.ok(isPreviewFetch(null));
  assert.ok(
    !isPreviewFetch(
      "Mozilla/5.0 (Linux; Android 13; CUBOT X30) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36 Telegram-Android/10.2",
    ),
    "живой телефон принят за бота",
  );
  assert.ok(!isPreviewFetch("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1"));

  assert.ok(fromPanel("a=1; devuz_admin=xyz", "devuz_admin"));
  assert.ok(!fromPanel("a=1; not_devuz_admin=xyz", "devuz_admin"));
  assert.ok(!fromPanel(null, "devuz_admin"));

  assert.match(openedText("Smile Dent"), /Клиент открыл прототип «Smile Dent»/);

  const route = read("app/proto/[token]/route.ts");
  assert.match(route, /!isPreviewFetch\(request\.headers\.get\("user-agent"\)\) && !fromPanel\(/);
  assert.match(route, /if \(seen\?\.first && seen\.prospectId\) await tellManager\(seen\.prospectId, openedText\(seen\.name\)\)/);
});

test("ответ про прототип из письма — человеку, а не «нужен прототип» всей команде", () => {
  assert.match(HANDOVER_TEXT.proto_ready, /прототип, который ушёл в письме/);
  const talk = read("lib/admin/outreach-talk-store.ts");
  assert.match(talk, /const verdict = read === "proto" && prospect\.proto_url \? "proto_ready" : read;/);
  assert.match(talk, /closed_reason, proto_url"\)/);
});

test("почему не собрался — словами на трёх языках, для каждого кода", () => {
  for (const code of AUTO_NOTES) {
    assert.ok(isAutoNote(code));
    for (const locale of ["ru", "uz", "pl"] as const) assert.ok(protoNoteDict[code][locale].length > 5, `${code}/${locale}`);
  }
  assert.ok(!isAutoNote("tried"));
});
