/**
 * Своё «Здравствуйте» (lib/admin/hello-text.ts).
 *
 * Владелец, 12.10.2026, «Оптимизация скрипта, чтобы манагеры редачили
 * касания»: руководитель и владелец меняют первое сообщение касания. Правило
 * 07.10.2026 при этом остаётся: первым уходит только приветствие — поэтому
 * свой текст обязан остаться приветствием.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { HELLO_TEXT, helloFor, letterLang, replyLang } from "@/lib/admin/hello-first";
import { HELLO_KEY, HELLO_MAX_WORDS, effectiveHello, helloProblems } from "@/lib/admin/hello-text";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const codes = (text: string, lang: "ru" | "uz") => helloProblems(text, lang).map((p) => p.code);

test("приветствие проходит: короткое, начинается с приветствия, без ссылок и цифр", () => {
  for (const ok of ["Здравствуйте", "Добрый день!", "Здравствуйте! Это Анвар из студии?", "Приветствую", "Добрый вечер, удобно написать?"]) {
    assert.deepEqual(codes(ok, "ru"), [], ok);
  }
  for (const ok of ["Assalomu alaykum", "Salom!", "Xayrli kun", "Assalomu alaykum! Yozsam bo‘ladimi?"]) {
    assert.deepEqual(codes(ok, "uz"), [], ok);
  }
  // Пустое — не ошибка: значит «вернуть обычное».
  assert.deepEqual(codes("", "ru"), []);
  assert.deepEqual(codes("   ", "uz"), []);
});

test("приветствие не превращается в письмо: длина, ссылка, цифры, жаргон, эмодзи", () => {
  const long = "Здравствуйте, мы посмотрели ваш сайт и нашли там много интересного для вас";
  assert.ok(long.split(/\s+/).length > HELLO_MAX_WORDS);
  assert.ok(codes(long, "ru").includes("hello_long"));
  assert.ok(codes("Здравствуйте, devuz.studio", "ru").includes("hello_link"));
  assert.ok(codes("Здравствуйте, https://t.me/devuz", "ru").includes("hello_link"));
  assert.ok(codes("Здравствуйте, @devuz_sales", "ru").includes("hello_link"));
  assert.ok(codes("Здравствуйте! Сайт за 500$", "ru").includes("hello_digits"));
  assert.ok(codes("Здравствуйте, у вас сервер упал", "ru").includes("hello_jargon"));
  assert.ok(codes("Здравствуйте 👋", "ru").includes("hello_banned"));
  // Не приветствие — первым ушло бы предложение.
  assert.ok(codes("Делаем сайты недорого", "ru").includes("hello_not_greeting"));
  assert.ok(codes("Привезём вам сайт", "ru").includes("hello_not_greeting"), "«Привезём» — не «Привет»");
  assert.ok(codes("Saytlar qilamiz", "uz").includes("hello_not_greeting"));
});

test("русское — кириллицей, узбекское — латиницей", () => {
  assert.ok(codes("Assalomu alaykum", "ru").includes("hello_script"));
  assert.ok(codes("Здравствуйте, hello", "ru").includes("hello_script"));
  assert.ok(codes("Ассалому алайкум", "uz").includes("hello_script"));
  assert.ok(codes("Salom, привет", "uz").includes("hello_script"));
});

test("действует своё, если оно есть и проходит проверку; иначе обычное", () => {
  assert.deepEqual(effectiveHello(null), HELLO_TEXT);
  assert.deepEqual(effectiveHello({ ru: null, uz: null }), HELLO_TEXT);
  assert.deepEqual(effectiveHello({ ru: "  ", uz: "" }), HELLO_TEXT);
  const own = effectiveHello({ ru: "Добрый день!", uz: "Salom!" });
  assert.equal(own.ru, "Добрый день!");
  assert.equal(own.uz, "Salom!");
  assert.equal(own.en, HELLO_TEXT.en);
  // Сохранённое когда-то и не проходящее нынешнюю проверку — не уходит.
  assert.equal(effectiveHello({ ru: "Сайт за 500$ — пишите!", uz: "Salom" }).ru, HELLO_TEXT.ru);
});

test("своё приветствие уходит на языке письма, а язык ответа от него не зависит", () => {
  const own = effectiveHello({ ru: "Добрый день!", uz: "Salom!" });
  assert.equal(helloFor("Пишу из DevUz Studio — открыл ваш сайт almazmed.uz.", null, own), "Добрый день!");
  assert.equal(helloFor("Men DevUz Studio’danman", "uz", own), "Salom!");
  // Без своего — как раньше.
  assert.equal(helloFor("Пишу из DevUz Studio — открыл ваш сайт almazmed.uz."), HELLO_TEXT.ru);
  // «Ответ без слов — на языке приветствия»: язык берётся от письма.
  const lang = letterLang("Men DevUz Studio’danman", "uz");
  assert.equal(replyLang("+", lang), "uz");
  assert.equal(replyLang("👍", letterLang("Пишу из DevUz Studio — открыл ваш сайт almazmed.uz.")), "ru");
});

test("приветствие из базы — в очереди скаута, в ленте и в карточке порции", () => {
  const queue = read("lib/admin/outreach-queue.ts");
  assert.match(queue, /const hellos = await helloTexts\(\);/);
  assert.match(queue, /toQueued\(row as Record<string, unknown>, hellos\)/);
  // В ленту — ровно то, что ушло.
  assert.match(read("scout/runner.mjs"), /await markSent\(job\.id, userId, messageId, key, job\.hello\);/);
  assert.match(read("lib/admin/portion-store.ts"), /helloFor\(p\.message, p\.walked\?\.lang, hellos\)/);
  // База молчит — обычное приветствие, касание не встаёт.
  const store = read("lib/admin/hello-text-store.ts");
  assert.match(store, /catch \{\s*return HELLO_TEXT;/);
  assert.match(store, new RegExp(`from\\("stats_snapshots"\\)`));
  assert.equal(HELLO_KEY, "hello-text");
});

test("менять приветствие — только руководитель и владелец, с проверкой и в журнал", () => {
  const actions = read("app/admin/prospect/texts/actions.ts");
  const save = actions.slice(actions.indexOf("export async function saveHelloAction"));
  assert.match(save, /requireRole\("admin", "head"\)/);
  assert.match(save, /helloProblems\(ru, "ru"\), \.\.\.helloProblems\(uz, "uz"\)/);
  assert.match(save, /record\("hello_text\.saved"/);
  const page = read("app/admin/prospect/texts/page.tsx");
  assert.match(page, /\{lead \? \(\s*<form action=\{saveHelloAction\}/);
  assert.match(page, /helpAnchor\("\/admin\/prospect", "hello-text"\)/);
  assert.match(read("CLAUDE.md"), /Текст приветствия меняют руководитель и владелец/);
});
