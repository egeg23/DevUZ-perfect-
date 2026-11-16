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
//
// Второй набор — «tomsk» (аргумент скрипта): страницы сайта клиники «Сияние
// Севера», регион Вордстата 67 — Томск. Владелец, 16.11.2026: «проработай СЕО
// запросы, собери по Томску через вордстат наш, топовые запросы и адаптируй
// вау СЕО КАЖДОЙ СТРАНИЦЫ». Слова города во фразе нет: регион уже Томск, а
// «томск» в фразе оставил бы только запросы, где город набран словом.
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

/* Страницы сайта клиники (scripts/protos/syanie/pages.mjs) — регион 67, Томск. */
const TOMSK = 67;
const TOMSK_PAGES = {
  "главная (All-on-6, All-on-4)": [
    "all on 6", "all on 4", "имплантация all on 6", "имплантация all on 4", "зубы за один день",
    "несъемный протез на имплантах", "протез на имплантах", "имплантация при полном отсутствии зубов",
  ],
  "implantatsiya-zubov": [
    "имплантация зубов", "имплант зуба", "установка импланта", "одномоментная имплантация",
    "стоимость имплантации", "имплантация под ключ", "костная пластика", "синус лифтинг",
  ],
  "protezirovanie-zubov": [
    "протезирование зубов", "коронка на зуб", "коронка из циркония", "металлокерамика",
    "коронка на имплант", "съемный протез", "бюгельный протез", "мост на зубы",
  ],
  "khirurgiya": [
    "удаление зуба", "удаление зуба мудрости", "киста зуба", "резекция верхушки корня", "хирург стоматолог",
  ],
  "esteticheskaya-stomatologiya": [
    "виниры", "отбеливание зубов", "художественная реставрация зубов", "эстетическая стоматология", "люминиры",
  ],
  "lechenie-zubov": [
    "лечение зубов", "лечение кариеса", "лечение каналов", "пульпит", "пломба на зуб", "лечение зубов под микроскопом",
  ],
  "professionalnaya-gigiena": [
    "чистка зубов", "профессиональная чистка зубов", "air flow", "удаление зубного камня", "гигиена полости рта",
  ],
  "diagnostika-zubov": [
    "кт зубов", "кт челюсти", "ортопантомограмма", "снимок зуба", "панорамный снимок зубов",
  ],
  "ceny, akcii": [
    "стоматология цены", "прайс стоматология", "стоматология акции", "бесплатная консультация стоматолога",
  ],
  "vrachi": [
    "стоматолог", "стоматолог ортопед", "имплантолог", "хороший стоматолог",
  ],
  "o-klinike, otzyvy, kontakty": [
    "стоматология", "стоматологическая клиника", "стоматология отзывы", "сияние севера",
  ],
};
const SETS = {
  landings: { pages: PAGES, region: WORDSTAT_UZ, top: 8 },
  tomsk: { pages: TOMSK_PAGES, region: TOMSK, top: 12 },
};
const set = SETS[process.argv[2] || "landings"];
if (!set) {
  console.log(`Набор «${process.argv[2]}» не знаю: ${Object.keys(SETS).join(", ")}.`);
  process.exit(1);
}
console.log(`Набор «${process.argv[2] || "landings"}», регион Вордстата ${set.region}.`);

const token = await appSecret("WORDSTAT_TOKEN");
if (!token) {
  console.log("Ключа нет: WORDSTAT_TOKEN пуст и в .env, и в хранилище.");
  process.exit(1);
}

const pause = (ms) => new Promise((r) => setTimeout(r, ms));
let asked = 0;
let failed = 0;
for (const [page, phrases] of Object.entries(set.pages)) {
  console.log(`\n=== ${page}`);
  for (const phrase of phrases) {
    const { url, init } = wordstatRequest(token, phrase, set.region);
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
        for (const p of list.slice(1, set.top + 1)) console.log(`     ${p.phrase} — ${p.value}`);
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
