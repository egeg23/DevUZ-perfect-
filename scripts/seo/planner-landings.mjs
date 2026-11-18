#!/usr/bin/env node
//
// Сверка запросов страниц услуг по планировщику ключевых слов Google Ads —
// руками, на сервере (кнопка «Вордстат — проверить ключ» → planner).
//
//   cd /opt/devuz && set -a && . .env && set +a
//   node --import ./tests/alias-hook.mjs scripts/seo/planner-landings.mjs
//
// Правило «Страницы под запросы» (CLAUDE.md): «Следующая сверка — по
// планировщику Google Ads, когда он подключится». Подключён 18.11.2026.
// Для каждой из шести страниц — несколько формулировок на русском,
// узбекском (латиница и кириллица) и английском: сколько раз в месяц их
// ищут в Google по Узбекистану и какие соседние фразы ищут чаще всего.
// Ключи и вход в журнал не печатаются: журнал задачи публичный.
import { GEO } from "@/lib/seo/keyword-planner";
import { plannerIdeas } from "@/lib/seo/keyword-planner-store";

const PAGES = {
  "web-development": ["разработка сайтов", "создание сайтов", "заказать сайт", "sayt yaratish", "website development"],
  "online-store": ["создание интернет магазина", "интернет магазин под ключ", "internet do'kon yaratish", "online store development"],
  "mobile-apps": ["разработка мобильных приложений", "создание приложения", "mobil ilova yaratish", "mobile app development"],
  "telegram-bots": ["создание телеграм бота", "заказать телеграм бота", "telegram bot yaratish", "telegram bot development"],
  "landing-page": ["создание лендинга", "сайт визитка", "landing page"],
  "corporate-website": ["корпоративный сайт", "создание корпоративного сайта", "korporativ sayt"],
};

const TOP = 12;
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
let asked = 0;
let failed = 0;
console.log(`Планировщик Google Ads, Узбекистан (${GEO.UZ}), поиски в месяц.`);
for (const [page, seeds] of Object.entries(PAGES)) {
  console.log(`\n=== ${page}`);
  for (const seed of seeds) {
    asked++;
    const res = await plannerIdeas(seed, GEO.UZ);
    if (!res.ok) {
      failed++;
      console.log(`«${seed}»: ${res.reason}`);
    } else {
      const own = res.phrases.find((p) => p.phrase.toLowerCase() === seed.toLowerCase());
      console.log(`«${seed}»: ${own ? own.value : "—"} в месяц`);
      for (const p of res.phrases.filter((p) => p !== own).slice(0, TOP)) console.log(`     ${p.phrase} — ${p.value}`);
    }
    // Планировщик держит около одного запроса в секунду на кабинет.
    await pause(1500);
  }
}
console.log(`\nСпросили ${asked}, не ответили ${failed}.`);
process.exit(failed === asked ? 1 : 0);
