#!/usr/bin/env node
//
// Сверка запросов страниц услуг по Вордстату — руками, на сервере.
//
//   cd /opt/devuz && set -a && . .env && set +a
//   node --import ./tests/alias-hook.mjs scripts/seo/wordstat-landings.mjs
//
// Правило «Страницы под запросы» (CLAUDE.md): после оплаты Яндекс Облака
// сверить каждый запрос по Вордстату (регион 171) и поправить заголовки.
// Владелец, 15.11.2026: «Сверяем». Для каждой из шести страниц — запрос
// страницы и соседние формулировки на русском, узбекском (латиница и
// кириллица) и английском: сколько раз их набирали за 30 дней и какие фразы
// с ними ищут чаще всего. Ключ не печатается: журнал задачи публичный.
import { appSecret } from "@/lib/secrets";
import { WORDSTAT_UZ, wordstatPhrases, wordstatRequest } from "@/lib/seo/keywords";

// Вордстат не смотрит на предлоги и формы слов: «разработка сайтов в
// Ташкенте» и «разработка сайта ташкент» — одна фраза. Поэтому варианты —
// разными словами, а не формами.
const PAGES = {
  "web-development": [
    "разработка сайтов ташкент", "разработка сайтов", "создание сайтов", "создание сайта ташкент",
    "заказать сайт", "сайт под ключ", "веб студия ташкент", "сделать сайт",
    "sayt yaratish", "sayt qilish", "сайт яратиш", "website development tashkent",
  ],
  "online-store": [
    "интернет магазин ташкент", "создание интернет магазина", "разработка интернет магазина",
    "интернет магазин под ключ", "internet do'kon yaratish", "internet magazin ochish", "интернет дўкон",
  ],
  "mobile-apps": [
    "разработка мобильных приложений", "разработка приложений ташкент", "создание приложения",
    "мобильное приложение", "mobil ilova yaratish", "ilova yaratish", "мобил илова",
  ],
  "telegram-bots": [
    "разработка телеграм ботов", "создание телеграм бота", "телеграм бот", "заказать телеграм бота",
    "бот для бизнеса", "telegram bot yaratish", "bot yaratish", "телеграм бот яратиш",
  ],
  "landing-page": [
    "создание лендинга", "лендинг", "landing page", "одностраничный сайт", "сайт визитка",
    "landing sahifa", "лендинг яратиш",
  ],
  "corporate-website": [
    "корпоративный сайт", "создание корпоративного сайта", "сайт компании", "разработка корпоративного сайта",
    "korporativ sayt", "корпоратив сайт",
  ],
};

const token = await appSecret("WORDSTAT_TOKEN");
if (!token) {
  console.log("Ключа нет: WORDSTAT_TOKEN пуст и в .env, и в хранилище.");
  process.exit(1);
}

const pause = (ms) => new Promise((r) => setTimeout(r, ms));
let asked = 0;
let failed = 0;
for (const [page, phrases] of Object.entries(PAGES)) {
  console.log(`\n=== ${page}`);
  for (const phrase of phrases) {
    const { url, init } = wordstatRequest(token, phrase, WORDSTAT_UZ);
    asked++;
    try {
      const response = await fetch(url, { ...init, signal: AbortSignal.timeout(20_000) });
      const text = await response.text();
      let body = null;
      try { body = JSON.parse(text); } catch {}
      if (!response.ok) {
        failed++;
        const message = String(body?.message ?? text).replaceAll(token, "***").slice(0, 160);
        console.log(`«${phrase}»: ответ ${response.status} — ${message}`);
      } else {
        // Первая строка ответа — сама фраза со всеми её продолжениями.
        const list = wordstatPhrases(body);
        const total = Number(body?.totalCount ?? list[0]?.value ?? 0) || 0;
        console.log(`«${phrase}»: ${total} в месяц`);
        for (const p of list.slice(1, 9)) console.log(`     ${p.phrase} — ${p.value}`);
      }
    } catch (error) {
      failed++;
      console.log(`«${phrase}»: не ответил (${error instanceof Error ? error.message : String(error)})`);
    }
    await pause(400);
  }
}
console.log(`\nИтог: спросили ${asked}, не ответил ${failed}.`);
process.exit(failed === asked ? 1 : 0);
