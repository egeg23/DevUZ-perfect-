#!/usr/bin/env node
//
// Сверка запросов страниц услуг по языку страницы — руками, на сервере
// (кнопка «Вордстат — проверить ключ» → planner).
//
//   cd /opt/devuz && set -a && . .env && set +a
//   node --import ./tests/alias-hook.mjs scripts/seo/planner-landings.mjs [язык]
//
// Правило «Страницы под запросы» (CLAUDE.md): «Следующая сверка — по
// планировщику Google Ads, когда он подключится». Подключён 18.11.2026, и в
// тот же день владелец: «Должно быть универсальная адаптация СЕО как для
// Узбекистана, так и для России и снг… статьи на разных языках должны
// затрагивать те регионы, на языке которого написаны». Поэтому фразы каждой
// страницы — на её языке и без города, а регион — тот, где на этом языке
// ищут (REGION_BY_LOCALE): русская — Россия, Узбекистан и СНГ вместе,
// узбекская — Узбекистан, английская — США, Великобритания и Канада,
// польская — Польша, украинская — Украина, китайская — Тайвань, Гонконг и
// Сингапур. Где ищут и в Яндексе, рядом — показы Вордстата.
// Ключи и вход в журнал не печатаются: журнал задачи публичный.
import { refusedGeos } from "@/lib/seo/keyword-planner";
import { plannerIdeas } from "@/lib/seo/keyword-planner-store";
import { REGION_BY_LOCALE, wordstatTop } from "@/lib/seo/keywords";

const PAGES = {
  "web-development": {
    ru: ["разработка сайтов", "создание сайтов", "заказать сайт"],
    uz: ["sayt yaratish", "sayt qilish"],
    en: ["website development", "web design agency"],
    pl: ["tworzenie stron internetowych", "strony internetowe"],
    uk: ["розробка сайтів", "створення сайтів"],
    zh: ["網站開發", "网站开发"],
  },
  "online-store": {
    ru: ["создание интернет магазина", "интернет магазин под ключ"],
    uz: ["internet do'kon yaratish", "internet magazin ochish"],
    en: ["ecommerce website development", "online store development"],
    pl: ["tworzenie sklepu internetowego", "sklep internetowy"],
    uk: ["створення інтернет магазину", "розробка інтернет магазину"],
    zh: ["網店開發", "网店开发"],
  },
  "mobile-apps": {
    ru: ["разработка мобильных приложений", "создание приложения"],
    uz: ["mobil ilova yaratish", "ilova yaratish"],
    en: ["mobile app development", "app development company"],
    pl: ["tworzenie aplikacji mobilnych", "aplikacje mobilne"],
    uk: ["розробка мобільних додатків", "створення мобільного застосунку"],
    zh: ["手機應用開發", "手机应用开发"],
  },
  "telegram-bots": {
    ru: ["создание телеграм бота", "разработка телеграм ботов", "заказать телеграм бота"],
    uz: ["telegram bot yaratish", "bot yaratish"],
    en: ["telegram bot development", "chatbot development"],
    pl: ["bot telegram", "tworzenie chatbota"],
    uk: ["створення телеграм бота", "розробка телеграм ботів"],
    zh: ["Telegram 機器人開發", "聊天机器人开发"],
  },
  "landing-page": {
    ru: ["создание лендинга", "лендинг под ключ", "сайт визитка"],
    uz: ["landing sahifa", "landing page yaratish"],
    en: ["landing page design", "landing page development"],
    pl: ["tworzenie landing page", "landing page"],
    uk: ["створення лендингу", "лендінг під ключ"],
    zh: ["落地頁製作", "落地页制作"],
  },
  "corporate-website": {
    ru: ["корпоративный сайт", "создание корпоративного сайта", "сайт компании"],
    uz: ["korporativ sayt", "kompaniya sayti"],
    en: ["corporate website design", "business website development"],
    pl: ["strona firmowa", "tworzenie strony firmowej"],
    uk: ["корпоративний сайт", "створення корпоративного сайту"],
    zh: ["企業網站建設", "企业网站建设"],
  },
};

const only = process.argv[2];
const locales = Object.keys(REGION_BY_LOCALE).filter((l) => !only || l === only);
if (!locales.length) {
  console.log(`Языка «${only}» нет: ${Object.keys(REGION_BY_LOCALE).join(", ")}.`);
  process.exit(1);
}

const TOP = 8;
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
let asked = 0;
let failed = 0;
for (const locale of locales) {
  const region = REGION_BY_LOCALE[locale];
  console.log(`\n\n######## ${locale} — ${region.where} (поиски Google в месяц${region.wordstat ? "; «Яндекс» — показы Вордстата за 30 дней" : ""})`);
  for (const [page, seeds] of Object.entries(PAGES)) {
    console.log(`\n=== ${page}`);
    for (const seed of seeds[locale] ?? []) {
      asked++;
      const res = await plannerIdeas(seed, region.geo);
      let yandex = "";
      if (region.wordstat) {
        const w = await wordstatTop(seed, region.wordstat);
        yandex = w.ok ? `, Яндекс ${w.phrases[0]?.value ?? "—"}` : `, Яндекс: ${w.reason}`;
      }
      if (!res.ok) {
        failed++;
        console.log(`«${seed}»: ${res.reason}${yandex}`);
      } else {
        const own = res.phrases.find((p) => p.phrase.toLowerCase() === seed.toLowerCase());
        console.log(`«${seed}»: Google ${own ? own.value : "—"}${yandex}`);
        for (const p of res.phrases.filter((p) => p !== own).slice(0, TOP)) console.log(`     ${p.phrase} — ${p.value}`);
      }
      // Планировщик держит около одного запроса в секунду на кабинет.
      await pause(1500);
    }
  }
}
const refused = refusedGeos();
if (refused.length) console.log(`\nПланировщик не принял страны: ${refused.join(", ")} — их убрали из запроса.`);
console.log(`\nСпросили ${asked}, планировщик не ответил на ${failed}.`);
process.exit(failed === asked ? 1 : 0);
