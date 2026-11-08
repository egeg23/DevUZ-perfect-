/**
 * Настройки скаута во вкладке «Скаут» раздела «ИИ-сотрудники».
 *
 * Владелец, 08.11.2026: «Выведи настройки скаута в ИИ сотрудника. Чтобы
 * можно было добавлять, убирать прям там. Поставь отслеживание в
 * автоматическом режиме или по заданным словам».
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { prefilter, wordsFilter } from "@/lib/scout/prefilter";
import { matchedWord, parseWords, settingsOf } from "@/lib/scout/settings";
import { mayTuneScout } from "@/lib/scout/settings-store";

test("слова: по строкам и через запятую, без повторов и мусора", () => {
  assert.deepEqual(parseWords("Сайт, лендинг\nсайт\n\nа\nTelegram  бот; Ёлка"), ["сайт", "лендинг", "telegram бот", "елка"]);
});

test("слово ловится с начала слова и в любом регистре", () => {
  assert.equal(matchedWord("Нужен САЙТА для клиники", ["сайт"]), "сайт");
  assert.equal(matchedWord("Делаю парсайт", ["сайт"]), null);
  assert.equal(matchedWord("ищу telegram   бота", ["telegram бот"]), "telegram бот");
  assert.equal(matchedWord("Sayt kerak", ["sayt"]), "sayt");
});

test("режим «по словам» без слов — снова «автоматически»", () => {
  assert.deepEqual(settingsOf({ mode: "words", words: [] }), { mode: "auto", words: [] });
  assert.deepEqual(settingsOf({ mode: "words", words: ["Сайт"] }), { mode: "words", words: ["сайт"] });
  assert.deepEqual(settingsOf(null), { mode: "auto", words: [] });
});

test("отсев «по словам»: пропускает слово, режет остальное", () => {
  assert.equal(wordsFilter("Кто сделает CRM для склада?", ["crm"]).pass, true);
  assert.equal(wordsFilter("Кто сделает CRM для склада?", ["лендинг"]).reason, "no_word");
  assert.equal(wordsFilter("crm", ["crm"]).reason, "too_short");
});

test("режим меняют владелец и руководитель; скаут берёт режим в processBatch", () => {
  assert.equal(mayTuneScout({ role: "admin" }), true);
  assert.equal(mayTuneScout({ role: "head" }), true);
  assert.equal(mayTuneScout({ role: "manager" }), false);
  const store = readFileSync("lib/scout/store.ts", "utf8");
  assert.match(store, /settings: \(\) => loadScoutSettings\(\)/);
  assert.match(store, /wordsFilter\(message\.text, words\)/);
  const tabs = readFileSync("app/admin/ai-staff/tabs.tsx", "utf8");
  assert.match(tabs, /\/admin\/ai-staff\/scout/);
  const page = readFileSync("app/admin/ai-staff/scout/page.tsx", "utf8");
  assert.match(page, /<ScoutGroups/);
});

// Владелец, 08.11.2026: «То где есть хештеги в тексте — тоже пропускаем, это спам 100%».
test("хэштег — спам в обоих режимах; C#, #1 и якорь ссылки — нет", () => {
  assert.equal(prefilter("Нужен сайт для магазина #сайт #ташкент").reason, "spam");
  assert.equal(prefilter("Ищу разработчика сайта #работа").reason, "spam");
  assert.equal(wordsFilter("Нужен сайт срочно #webdesign", ["сайт"]).reason, "spam");
  assert.equal(prefilter("Нужен сайт на C# и .NET, кто сделает?").pass, true);
  assert.equal(prefilter("Нужен сайт как у #1 в нише, кто сделает?").pass, true);
  assert.equal(prefilter("Нужен сайт как example.com/page#top, кто сделает?").pass, true);
});
