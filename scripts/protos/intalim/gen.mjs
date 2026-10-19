import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import * as D from "./data.mjs";
import { dzIntroSolo } from "../../../lib/proto/dz-video.mjs";

/*
 * Прототип IntalimStudents: приложение ученика автошколы в экране айфона.
 * Как играбельные кейсы студии: на ПК айфон по центру во весь рост, по бокам
 * подсказки; на телефоне приложение на весь экран. Внутри всё нажимается.
 *
 * Две страницы: русская (главная) и узбекская (`uz`, латиница). В каждую
 * кладутся тексты только её языка. Стили и скрипт общие, в странице вместо
 * них @@S@@ и @@J@@. Ссылки через __PROTO_BASE__, отпечаток ставится при
 * показе зерном из protos.stamp (lib/proto/bundles).
 */

const DIR = new URL(".", import.meta.url).pathname;
const CSS = readFileSync(DIR + "style.css", "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\n\s*/g, "");
const JS = readFileSync(DIR + "app.js", "utf8");
const BASE = "__PROTO_BASE__";
const TERMS = (l) => `https://devuz.studio/${l}/mockup-terms`;
/* БРВ с 01.09.2026: 440 000 сум (Указ УП-115 от 23.06.2026), docs/clients/intalim/research.md. */
const BRV = 440000;

/* Пара [ru, uz] → строка нужного языка, рекурсивно. */
function pick(v, l) {
  if (Array.isArray(v)) return v.map((x) => pick(x, l));
  if (v && typeof v === "object") {
    if (v.__l) return v[l];
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, pick(x, l)]));
  }
  return v;
}

/* Линейные иконки 24×24, штрих цветом текста. */
const S = 'fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"';
const I = {
  home: `<path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z" ${S}/>`,
  book: `<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v15H5.5A1.5 1.5 0 0 0 4 20.5zM20 5.5A1.5 1.5 0 0 0 18.5 4H13v15h5.5a1.5 1.5 0 0 1 1.5 1.5z" ${S}/>`,
  test: `<rect x="5" y="3.5" width="14" height="17" rx="2.5" ${S}/><path d="M9 8.5h6M9 12h6M9 15.5h3" ${S}/>`,
  cal: `<rect x="4" y="5" width="16" height="15" rx="3" ${S}/><path d="M4 10h16M9 3v4M15 3v4" ${S}/>`,
  user: `<circle cx="12" cy="8.5" r="3.8" ${S}/><path d="M4.5 20c1.4-3.6 4.2-5.5 7.5-5.5s6.1 1.9 7.5 5.5" ${S}/>`,
  road: `<path d="M8 3 4 21M16 3l4 18M12 4v3M12 11v3M12 18v2" ${S}/>`,
  sign: `<path d="M12 3 21 19H3z" ${S}/><path d="M12 9.5v4M12 16.5v.01" ${S}/>`,
  shield: `<path d="M12 3 19 6v5.5c0 4.5-3 8-7 9.5-4-1.5-7-5-7-9.5V6z" ${S}/><path d="m9 12 2 2 4-4" ${S}/>`,
  aid: `<rect x="3.5" y="6.5" width="17" height="13" rx="2.5" ${S}/><path d="M9 6.5V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v1.5M12 10v6M9 13h6" ${S}/>`,
  car: `<path d="M5 16v-4l2-5h10l2 5v4M3.5 16h17v2.5H3.5zM5 12h14" ${S}/><circle cx="7.5" cy="14" r=".8" fill="currentColor"/><circle cx="16.5" cy="14" r=".8" fill="currentColor"/>`,
  law: `<path d="M12 4v16M7 20h10M5 7h14M7 7l-3 6a3 3 0 0 0 6 0zM17 7l-3 6a3 3 0 0 0 6 0z" ${S}/>`,
  heart: `<path d="M12 20s-7.5-4.5-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.5-7.5 10-7.5 10z" ${S}/>`,
  bell: `<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0" ${S}/>`,
  chev: `<path d="m9 5 7 7-7 7" ${S}/>`,
  back: `<path d="m15 5-7 7 7 7" ${S}/>`,
  search: `<circle cx="11" cy="11" r="6.5" ${S}/><path d="m20 20-4.2-4.2" ${S}/>`,
  pin: `<path d="M6.5 4h11v16.5L12 16.8l-5.5 3.7z" ${S}/>`,
  pinf: `<path d="M6.5 4h11v16.5L12 16.8l-5.5 3.7z" fill="currentColor" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/>`,
  clock: `<circle cx="12" cy="12" r="8" ${S}/><path d="M12 7.5V12l3 2" ${S}/>`,
  star: `<path d="m12 3.8 2.5 5.2 5.7.7-4.2 3.9 1.1 5.6L12 16.4l-5.1 2.8 1.1-5.6-4.2-3.9 5.7-.7z" ${S}/>`,
  bolt: `<path d="M13 3 5 13.5h6L10 21l8-10.5h-6z" ${S}/>`,
  spark: `<path d="M12 3c.8 4.3 2.7 6.2 7 7-4.3.8-6.2 2.7-7 7-.8-4.3-2.7-6.2-7-7 4.3-.8 6.2-2.7 7-7zM19 16c.3 1.5 1 2.2 2.5 2.5-1.5.3-2.2 1-2.5 2.5-.3-1.5-1-2.2-2.5-2.5 1.5-.3 2.2-1 2.5-2.5z" ${S}/>`,
  x: `<path d="M6 6l12 12M18 6 6 18" ${S}/>`,
  info: `<circle cx="12" cy="12" r="8.5" ${S}/><path d="M12 11v5.5M12 7.8v.01" ${S}/>`,
  chart: `<path d="M5 20V11M10 20V5M15 20v-6M20 20V9" ${S}/>`,
  users: `<circle cx="9" cy="8.5" r="3.3" ${S}/><path d="M3 19.5c1-3.2 3.3-5 6-5s5 1.8 6 5M15.5 5.3a3.3 3.3 0 0 1 0 6.4M17.5 14.6c1.8.6 3 2.3 3.5 4.9" ${S}/>`,
  moon: `<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5 8 8 0 1 0 19.5 14.5z" ${S}/>`,
  globe: `<circle cx="12" cy="12" r="8.5" ${S}/><path d="M3.5 12h17M12 3.5c2.3 2.4 3.5 5.2 3.5 8.5s-1.2 6.1-3.5 8.5c-2.3-2.4-3.5-5.2-3.5-8.5s1.2-6.1 3.5-8.5z" ${S}/>`,
  lock: `<rect x="5" y="10.5" width="14" height="10" rx="2.5" ${S}/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" ${S}/>`,
  help: `<circle cx="12" cy="12" r="8.5" ${S}/><path d="M9.6 9.5a2.5 2.5 0 0 1 4.8 1c0 1.7-2.4 2-2.4 3.5M12 17v.01" ${S}/>`,
  chat: `<path d="M5 5h14a1 1 0 0 1 1 1v9.5a1 1 0 0 1-1 1H10l-4.5 3.5v-3.5H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" ${S}/>`,
  logout: `<path d="M14 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 16l-4-4 4-4M6 12h9" ${S}/>`,
  check: `<path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`,
  play: `<path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/>`,
  refresh: `<path d="M19.5 12A7.5 7.5 0 1 1 17 6.4M19.5 4v4.5H15" ${S}/>`,
  shuffle: `<path d="M4 7h3.5c4.5 0 4.5 10 9 10H20M4 17h3.5c1.3 0 2.2-.8 3-2M14 9c.8-1.2 1.7-2 3-2H20M17.5 4.5 20 7l-2.5 2.5M17.5 14.5 20 17l-2.5 2.5" ${S}/>`,
  list: `<path d="M9 6.5h11M9 12h11M9 17.5h11M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01" ${S}/>`,
  plus: `<path d="M12 5v14M5 12h14" ${S}/>`,
  steer: `<circle cx="12" cy="12" r="8.5" ${S}/><circle cx="12" cy="12" r="2" ${S}/><path d="M3.8 10.5c3 .2 5.6 1 6.6 1.6M20.2 10.5c-3 .2-5.6 1-6.6 1.6M12 14v6.5" ${S}/>`,
  flag: `<path d="M5.5 21V4M5.5 4.5h12l-2.5 4 2.5 4h-12" ${S}/>`,
  target: `<circle cx="12" cy="12" r="8.5" ${S}/><circle cx="12" cy="12" r="4.5" ${S}/><circle cx="12" cy="12" r="1" fill="currentColor"/>`,
  geo: `<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" ${S}/><circle cx="12" cy="10" r="2.3" ${S}/>`,
  doc: `<path d="M7 3.5h7l4 4v13H7a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1z" ${S}/><path d="M14 3.5V8h4M9.5 12.5h5M9.5 16h5" ${S}/>`,
};
const SPRITE = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><linearGradient id="gr-ring" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2f6bf0"/><stop offset="1" stop-color="#1fc2ad"/></linearGradient>${Object.entries(I)
  .map(([k, v]) => `<symbol id="i-${k}" viewBox="0 0 24 24">${v}</symbol>`)
  .join("")}</defs></svg>`;

/* Значок приложения: синий квадрат, белые «it», бирюзовая полоска над ними. */
const LOGO = (cls) => `<svg class="${cls}" viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100" rx="24" fill="#1d4fd1"/><rect x="24" y="22" width="40" height="7" rx="3.5" fill="#22c3ad"/><text x="47" y="74" text-anchor="middle" font-family="Onest,Arial,sans-serif" font-weight="800" font-size="50" fill="#fff" letter-spacing="-2">it</text></svg>`;

const STATUS = `<div class="status" aria-hidden="true"><span>9:41</span><span><svg viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg><svg viewBox="0 0 16 12" fill="currentColor"><path d="M8 2.3c2.3 0 4.4.9 6 2.4l1.3-1.4A10.4 10.4 0 0 0 8 .4 10.4 10.4 0 0 0 .7 3.3L2 4.7a8.6 8.6 0 0 1 6-2.4Zm0 3.6c1.3 0 2.5.5 3.4 1.4l1.3-1.4A6.6 6.6 0 0 0 8 4a6.6 6.6 0 0 0-4.7 1.9l1.3 1.4C5.5 6.4 6.7 5.9 8 5.9Zm0 3.6c.4 0 .8.2 1.1.4L8 11.6 6.9 9.9c.3-.2.7-.4 1.1-.4Z"/></svg><svg viewBox="0 0 27 13"><rect x=".5" y=".5" width="23" height="12" rx="3.6" fill="none" stroke="currentColor" stroke-opacity=".4"/><rect x="2" y="2" width="20" height="9" rx="2.2" fill="currentColor"/><path d="M25 4.4v4.2c.8-.3 1.4-1.1 1.4-2.1s-.6-1.8-1.4-2.1Z" fill="currentColor" fill-opacity=".45"/></svg></span></div>`;

function page(l) {
  const t = (ru, uz) => (l === "ru" ? ru : uz);
  const ui = pick(D.UI, l);
  const data = {
    lang: l, ui, terms: TERMS(l), brv: BRV, ruUrl: BASE, uzUrl: BASE + "/uz",
    me: (({ short, shortUz, drivingLeft, ...m }) => ({ ...m, ini: l === "ru" ? short : shortUz, left: drivingLeft }))(pick(D.ME, l)),
    instructors: pick(D.INSTRUCTORS, l).map(({ ini, iniUz, ...x }) => ({ ...x, ini: l === "ru" ? ini : iniUz })),
    places: pick(D.PLACES, l), subjects: pick(D.SUBJECTS, l), questions: pick(D.QUESTIONS, l),
    signGroups: pick(D.SIGN_GROUPS, l), signs: pick(D.SIGNS, l), fines: pick(D.FINES, l), exercises: pick(D.EXERCISES, l),
    chat: pick(D.CHAT, l), mates: pick(D.MATES, l), badges: pick(D.BADGES, l), ...pick(D.DATES, l),
  };
  const missing = [...new Set([...JS.matchAll(/\bU\.(\w+)/g)].map((m) => m[1]))].filter((k) => !(k in ui));
  if (missing.length) throw new Error(`нет подписей: ${missing.join(", ")}`);
  const jump = [
    ["home", t("Главная", "Asosiy")], ["exam", t("Экзамен как в ГАИ", "Imtihon")], ["lessons", t("Уроки", "Darslar")],
    ["signs", t("Знаки и игра", "Belgilar va o‘yin")], ["schedule", t("Расписание", "Jadval")], ["book", t("Запись на вождение", "Haydashga yozilish")],
    ["fines", t("Штрафы", "Jarimalar")], ["forecast", t("Прогноз экзамена", "Imtihon prognozi")], ["helper", t("ИИ-помощник", "AI yordamchi")], ["profile", t("Профиль и тёмная тема", "Profil va tungi rejim")],
  ];
  const diff = [
    [t("Один язык на экране", "Ekranda bitta til"), t("Русский или узбекский латиницей, без смешения алфавитов.", "Rus yoki o‘zbek lotin yozuvida, alifbolar aralashmaydi.")],
    [t("Главная ведёт ученика", "Asosiy sahifa o‘quvchini yo‘naltiradi"), t("Следующее занятие, готовность и что делать дальше.", "Keyingi mashg‘ulot, tayyorlik va keyin nima qilish kerak.")],
    [t("Экзамен как настоящий", "Imtihon haqiqiydek"), t("20 вопросов, таймер, 2 ошибки, разбор каждого ответа.", "20 savol, taymer, 2 xato, har bir javob tahlili.")],
    [t("Мотивация", "Motivatsiya"), t("Серия дней, цель дня, уровни, рейтинг группы.", "Kunlar seriyasi, kunlik maqsad, darajalar, guruh reytingi.")],
    [t("Штрафы с суммами", "Summali jarimalar"), t("Что нарушил, сколько стоит и как этого избежать.", "Nima buzildi, qancha turadi va qanday saqlanish.")],
  ];
  const tabs = [["home", "home", ui.tabHome], ["lessons", "book", ui.tabLessons], ["tests", "test", ui.tabTests], ["schedule", "cal", ui.tabSchedule], ["profile", "user", ui.tabProfile]];
  const ic = (k) => `<svg class="ic" aria-hidden="true"><use href="#i-${k}"/></svg>`;
  return `<!doctype html><html lang="${l}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,viewport-fit=cover,user-scalable=no"><meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#eef2f8"><title>${t("IntalimStudents · прототип нового приложения", "IntalimStudents · yangi ilova prototipi")}</title><meta name="description" content="${t("Прототип приложения для учеников автошколы: занятия, уроки, тесты как в ГАИ, знаки, штрафы.", "Avtomaktab o‘quvchilari uchun ilova prototipi: mashg‘ulotlar, darslar, imtihon testlari, belgilar, jarimalar.")}"><link rel="preload" href="/protos/intalim/onest-${l === "ru" ? "cyr" : "latx"}.woff2" as="font" type="font/woff2" crossorigin>@@S@@</head><body>
${dzIntroSolo(l)}
<div class="stage"><div class="road" aria-hidden="true"></div>
<aside class="side l">
<div class="brand-row">${LOGO("logo")}<div><b>IntalimStudents</b><small>${t("прототип новой версии", "yangi versiya prototipi")}</small></div></div>
<h1>${t("Приложение, которое ведёт ученика до прав", "O‘quvchini guvohnomagacha olib boradigan ilova")}</h1>
<p>${t("Прототип от DevUz Studio. Всё нажимается: пройдите экзамен, запишитесь на вождение, угадайте знаки. Данные демонстрационные, ученик и инструкторы выдуманы.", "DevUz Studio prototipi. Hammasi bosiladi: imtihondan o‘ting, haydashga yoziling, belgilarni toping. Ma’lumotlar namunaviy, o‘quvchi va instruktorlar to‘qib chiqarilgan.")}</p>
<div class="jump">${jump.map(([k, n]) => `<button data-jump="${k}">${n}</button>`).join("")}</div>
<p class="qr-hint">${t("На телефоне эта же ссылка откроет приложение на весь экран.", "Telefonda shu havola ilovani to‘liq ekranda ochadi.")}</p>
</aside>
<div class="iphone-wrap"><div class="iphone">
<span class="btn-side l" style="top:18%;height:4.5%" aria-hidden="true"></span><span class="btn-side l" style="top:26%;height:8.5%" aria-hidden="true"></span><span class="btn-side l" style="top:36.5%;height:8.5%" aria-hidden="true"></span><span class="btn-side r" style="top:29%;height:13%" aria-hidden="true"></span>
<div class="bezel"><div class="screen" id="screen" data-theme="light">
<div class="app" id="app">
<div class="top-pad"></div>
<div class="views" id="views"><noscript><p style="padding:24px">${t("Для прототипа нужен JavaScript.", "Prototip uchun JavaScript kerak.")}</p></noscript></div>
<nav class="tabs" id="tabs">${tabs.map(([k, i, n]) => `<button data-tab="${k}">${ic(i)}<span>${n}</span>${k === "tests" ? '<span class="dot num" style="display:none"></span>' : ""}</button>`).join("")}</nav>
<canvas class="fx" id="fx" aria-hidden="true"></canvas>
<div class="toast" id="toast" role="status"></div>
<div class="splash" id="splash" aria-hidden="true">${LOGO("")}<b>IntalimStudents</b><small>${t("прототип · DevUz Studio", "prototip · DevUz Studio")}</small></div>
</div>
${STATUS}<span class="island" aria-hidden="true"></span><span class="home-bar" aria-hidden="true"></span><span class="glare" aria-hidden="true"></span>
</div></div></div></div>
<aside class="side r">
<b style="font-size:17px">${t("Что изменилось", "Nima o‘zgardi")}</b>
<ul class="diff">${diff.map(([a, b], i) => `<li><i>${i + 1}</i><div><b>${a}</b>${b}</div></li>`).join("")}</ul>
<p class="legal">${t("Прототип принадлежит DevUz Studio.", "Prototip DevUz Studio’ga tegishli.")} <a href="${TERMS(l)}" target="_blank" rel="noopener">${t("Условия использования макета", "Maketdan foydalanish shartlari")}</a></p>
</aside>
</div>
${SPRITE}
<script>window.IT=${JSON.stringify(data).replace(/</g, "\\u003c")};</script>
@@J@@
</body></html>`;
}

const out = { "": page("ru"), uz: page("uz") };
const parts = { S: `<style>${CSS}</style>`, J: `<script>\n${JS}\n</script>` };

mkdirSync(DIR + "out", { recursive: true });
writeFileSync(DIR + "out/pages.json", JSON.stringify(Object.fromEntries(Object.entries(out).map(([k, v]) => [k, Object.entries(parts).reduce((p, [n, part]) => p.split(`@@${n}@@`).join(part), v)]))));
const bundleDir = new URL("../../../content/proto-bundles/", import.meta.url).pathname;
writeFileSync(bundleDir + "intalim.json", JSON.stringify({ parts, pages: out }));
for (const [k, v] of Object.entries(out)) console.log((k || "(ru)").padEnd(6), Object.entries(parts).reduce((p, [n, part]) => p.split(`@@${n}@@`).join(part), v).length);
