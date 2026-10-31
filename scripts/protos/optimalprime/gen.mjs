import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dzIntroSolo } from "../../../lib/proto/dz-video.mjs";
import { LANGS, COMPANY, SERVICES, WHY, GAINS, SECRET, INDUSTRIES, STEPS, CLIENTS, CLIENTS_UZ, KINDS } from "./data.mjs";
import { BASE, ADDONS, OFFER_HOURS, ALL } from "./plan.mjs";
import { REGIMES, ONCE, UNIT, monthly } from "./tariffs.mjs";
import { PANEL_UI } from "./panel-ui.mjs";

/*
 * Макет Optimal Prime (optimal-prime.uz), 31.10.2026: бухгалтерский и
 * HR-аутсорсинг в Ташкенте с 2008 года. Страницы на ru и uz:
 *
 *   ""    — видео DevUz → залёт камерой в их знак по прокрутке (кадры
 *           Higgsfield шифром, scene.py) → выбор «Сайт» / «Админка» → как
 *           проверить → конструктор «Предложение DevUz Studio» (plan.mjs);
 *   site  — первый экран со стеклом и параллаксом плиток, бегущая строка,
 *           услуги вкладками, тайна зарплат, «почему мы», конструктор тарифа
 *           по их ценам (tariffs.mjs), отрасли, шесть шагов по прокрутке,
 *           допы, клиенты бегущей строкой, связь в Telegram;
 *   panel — панель заявок и клиентов по эталону Greenwell.
 *
 * Услуги, цены, клиенты, шаги, контакты — только с их сайта (data.mjs).
 * Клиенты в панели и кабинете — демо и подписаны «демо». Формы ничего не
 * отправляют наружу: заявка ложится в браузер (её видит панель) и
 * открывает их Telegram с готовым текстом. Модель макет не вызывает.
 */

const DIR = new URL(".", import.meta.url).pathname;
const IMG = "/protos/optimalprime";
// Комментарии уходят, метка числа `/*~*/` остаётся: её снимает отпечаток при показе.
const strip = (s) => s.replace(/\/\*(?!~\*\/)[\s\S]*?\*\//g, "");
const CSS = strip(readFileSync(DIR + "site.css", "utf8")).replace(/\n\s*/g, "");
const JS = strip(readFileSync(DIR + "site.js", "utf8")).replace(/\n\s*\n/g, "\n");
const LAND_JS = strip(readFileSync(DIR + "land.js", "utf8")).replace(/\n\s*\n/g, "\n");
const PANEL_JS = strip(readFileSync(DIR + "panel.js", "utf8")).replace(/\n\s*\n/g, "\n");
const PANEL_CSS = strip(readFileSync(DIR + "panel.css", "utf8")).replace(/\n\s*/g, "");
const BASE_URL = "__PROTO_BASE__";
const TERMS = (l) => `https://devuz.studio/${l}/mockup-terms`;
const FONTS = "https://fonts.googleapis.com/css2?family=Literata:opsz,wght@7..72,400;7..72,700&family=Onest:wght@400;700&display=swap";
const KEY = { ru: "", uz: "uz" };
const DEVUZ = "https://t.me/Devuz_studio_bot?start=optimalprime";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const href = (l, p = "") => BASE_URL + (KEY[l] ? "/" + KEY[l] : "") + "/" + (p ? p : "");
const T = (l) => (ru, uz) => (l === "ru" ? ru : uz);
const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");
const sum = (n, l) => `${fmt(n)}\u00a0${l === "ru" ? "сум" : "so‘m"}`;
const usd = (n) => `${fmt(n)}\u00a0$`;
const words = (txt) => txt.split(" ").map((w) => `<span class="w"><span>${w}</span></span>`).join(" ");
const tg = (text) => `https://t.me/${COMPANY.tg}?text=${encodeURIComponent(text)}`;

const I = (dd) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${dd}</svg>`;
const ICON = {
  arrow: I('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  back: I('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
  close: I('<path d="M6 6l12 12M18 6 6 18"/>'),
  check: I('<path d="m5 12 5 5 9-10"/>'),
  phone: I('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/>'),
  tg: I('<path d="M21 4 3 11l6 2 2 6 3-4 5 4Z"/><path d="m9 13 8-6"/>'),
  panel: I('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 9v11"/>'),
  copy: I('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>'),
  calc: I('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/>'),
  lock: I('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
  ledger: I('<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3Z"/><path d="M5 17a3 3 0 0 1 3-3h11M9 8h6"/>'),
  tax: I('<path d="M7 3h7l5 5v13H7Z"/><path d="M14 3v5h5M10 17l6-6M10.5 11.5h.01M15.5 16.5h.01"/>'),
  people: I('<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0M16 4a3 3 0 0 1 0 6M21 20a6 6 0 0 0-4-5.6"/>'),
  globe: I('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'),
  doc: I('<path d="M7 3h7l5 5v13H7Z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>'),
  up: I('<path d="M12 16V4M6 10l6-6 6 6M4 20h16"/>'),
  pin: I('<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  mail: I('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>'),
  clock: I('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  bag: I('<path d="M5 8h14l-1 12H6Z"/><path d="M9 8a3 3 0 0 1 6 0"/>'),
  bld: I('<path d="M4 21V6l8-3v18M12 21h8V10l-8-3M8 9h.01M8 13h.01M8 17h.01M16 13h.01M16 17h.01"/>'),
};
const IND_ICON = ["bld", "panel", "calc", "bag", "globe", "doc", "people", "pin", "globe", "ledger"];
/* Знак Optimal Prime — их logo-mark.svg: девять плиток 3×3, синие и золотые. */
const MARK = `<svg viewBox="0 0 260 260" width="30" height="30" aria-hidden="true" focusable="false"><rect width="80" height="80" rx="6" fill="#0F1F3D"/><rect x="90" width="80" height="80" rx="6" fill="#0F1F3D" opacity=".85"/><rect x="180" width="80" height="80" rx="6" fill="#1B3A5C" opacity=".7"/><rect y="90" width="80" height="80" rx="6" fill="#0F1F3D" opacity=".85"/><rect x="90" y="90" width="80" height="80" rx="6" fill="#1B3A5C"/><rect x="180" y="90" width="80" height="80" rx="6" fill="#C8963E" opacity=".7"/><rect y="180" width="80" height="80" rx="6" fill="#1B3A5C" opacity=".7"/><rect x="90" y="180" width="80" height="80" rx="6" fill="#C8963E" opacity=".7"/><rect x="180" y="180" width="80" height="80" rx="6" fill="#C8963E"/></svg>`;
const LOGO = (l, to = "site") => `<a class="logo" href="${href(l, to)}" aria-label="Optimal Prime">${MARK}<span>OPTIMAL <i>PRIME</i></span></a>`;

/* ── Части страницы ───────────────────────────────────────────────── */
function head(l, title, desc) {
  return `<!doctype html>
<html lang="${l}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="#0f1f3d">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">`;
}

function header(l, t) {
  const nav = [["services", t("Услуги", "Xizmatlar")], ["tarif", t("Тарифы", "Tariflar")], ["industries", t("Отрасли", "Sohalar")], ["how", t("Как работаем", "Ish tartibi")], ["contact", t("Контакты", "Aloqa")]];
  return `<header class="top"><div class="mbar"><a href="${href(l)}">${ICON.back}<span>${t("Макет для Optimal Prime", "Optimal Prime uchun maket")}</span></a><a class="mb-adm" href="${href(l, "panel")}">${ICON.panel}<span>${t("Админка", "Admin panel")}</span>${ICON.arrow}</a></div><div class="top-in glass">
${LOGO(l)}
<nav class="nav" aria-label="${t("Разделы", "Bo‘limlar")}">${nav.map(([id, n]) => `<a href="#${id}">${n}</a>`).join("")}</nav>
<button type="button" class="mine" id="mine">${ICON.doc}<span>${t("Моя заявка", "Arizam")}</span></button>
<div class="langs">${LANGS.map((x) => `<a href="${href(x, "site")}" hreflang="${x}" lang="${x}"${x === l ? ' aria-current="true"' : ""}>${x.toUpperCase()}</a>`).join("")}</div>
<a class="btn btn-n btn-s tel" href="tel:${COMPANY.tel}">${ICON.phone}<span>${COMPANY.phones[0]}</span></a>
</div></header>`;
}

/* Плитки знака на разной глубине: параллакс первого экрана. Кодом. */
function tiles() {
  const g = [[0, 0, "n", .02], [1, 0, "n", .06], [2, 0, "n", .1], [0, 1, "n", .05], [1, 1, "n", .12], [2, 1, "g", .16], [0, 2, "n", .08], [1, 2, "g", .18], [2, 2, "g", .24]];
  return `<div class="tiles" aria-hidden="true">${g.map(([x, y, c, k]) => `<i class="${c}" style="left:${x * 35}%;top:${y * 35}%" data-par="${k}"></i>`).join("")}</div>`;
}

function hero(l, t) {
  const text = t("Здравствуйте! Хочу обсудить бухгалтерское сопровождение.", "Assalomu alaykum! Buxgalteriya xizmatini muhokama qilmoqchiman.");
  return `<section class="hero" id="top" aria-label="Optimal Prime">
<div class="hero-bg"><div class="ph" data-par="0.18"><picture><source media="(max-width: 899px)" srcset="${IMG}/city-9.webp"><img src="${IMG}/city-1920.webp" srcset="${IMG}/city-1280.webp 1280w, ${IMG}/city-1920.webp 1920w" sizes="100vw" width="1920" height="1080" alt="" fetchpriority="high"></picture></div></div>
${tiles()}
<div class="wrap"><div class="hero-in">
<p class="kick rise"><i></i>${t("Бухгалтерский и HR-аутсорсинг", "Buxgalteriya va HR autsorsing")}</p>
<h1>${words(t("Передайте бизнес-функции <em>профессионалам</em>", "Biznes funksiyalarini <em>mutaxassislarga</em> ishoning"))}</h1>
<p class="hsub rise">${t("ООО «Optimal Prime» ведёт бухгалтерский, налоговый и кадровый учёт, а вы занимаетесь развитием бизнеса.", "«Optimal Prime» MChJ buxgalteriya, soliq va kadrlar hisobini yuritadi, siz esa biznesni rivojlantirasiz.")}</p>
<div class="hero-act rise"><a class="btn btn-a" href="#tarif">${ICON.calc}<span>${t("Рассчитать тариф", "Tarifni hisoblash")}</span></a><a class="btn btn-g" href="${tg(text)}" target="_blank" rel="noopener">${ICON.tg}<span>${t("Написать в Telegram", "Telegramda yozish")}</span></a></div>
<div class="hstat glass glass-d rise"><b>${COMPANY.years}</b><span>${t("лет на рынке,<br>с 2008 года в Ташкенте", "yil bozorda,<br>2008 yildan Toshkentda")}</span></div>
</div></div></section>`;
}

function velo(l) {
  const a = SERVICES.map((s) => s[l][0]);
  const b = SERVICES.flatMap((s) => s[l][1]).slice(0, 8);
  const row = (x, c) => `<div class="row${c}" aria-hidden="true">${[0, 1, 2].map(() => x.map((s) => `<span>${esc(s)}</span>`).join("")).join("")}</div>`;
  return `<div class="velo">${row(a, "")}${row(b, " rev")}</div>`;
}

function services(l, t) {
  return `<section class="sec cvn" id="services"><div class="wrap">
<p class="kick rise"><i></i>${t("Наши услуги", "Xizmatlarimiz")}</p>
<h2 class="h2 rise">${t("Чем мы <b>можем помочь</b>", "Qanday <b>yordam bera olamiz</b>")}</h2>
<p class="lead rise">${t("Мы берём на себя финансовую рутину, чтобы вы сосредоточились на развитии бизнеса.", "Moliyaviy ishlarni o‘z zimmamizga olamiz, siz esa biznesni rivojlantirasiz.")}</p>
<div class="svc"><div class="svc-tabs slide" role="tablist">${SERVICES.map((s, i) => `<button type="button" role="tab" id="sv-${s.id}" aria-controls="svc-${s.id}" aria-selected="${i === 0}" data-svc="${s.id}"><i>0${i + 1}</i>${ICON[s.icon]}<span>${esc(s[l][0])}</span></button>`).join("")}</div>
<div>${SERVICES.map((s, i) => `<div class="svc-p${i === 0 ? " on" : ""}" id="svc-${s.id}" role="tabpanel" aria-labelledby="sv-${s.id}"><h3>${esc(s[l][0])}</h3><ul>${s[l][1].map((x) => `<li>${ICON.check}<span>${esc(x)}</span></li>`).join("")}</ul><a class="btn btn-n" href="${tg(t(`Здравствуйте! Интересует: ${s.ru[0]}.`, `Assalomu alaykum! Qiziqtiradi: ${s.uz[0]}.`))}" target="_blank" rel="noopener">${ICON.tg}<span>${t("Спросить про это", "Bu haqda so‘rash")}</span></a></div>`).join("")}</div></div>
</div></section>`;
}

function secret(l, t) {
  const rows = l === "ru" ? ["Директор", "Главный инженер", "Менеджер по продажам", "Бухгалтер", "Логист"] : ["Direktor", "Bosh muhandis", "Savdo menejeri", "Buxgalter", "Logist"];
  const pay = [24, 18, 9, 8, 7];
  return `<section class="sec dark cvn" id="secret"><div class="wrap secret">
<div><p class="kick rise"><i></i>${t("Конфиденциальность", "Maxfiylik")}</p>
<h2 class="h2 rise">${esc(SECRET[l][0]).replace(/(никто|hech kim)/, "<b>$1</b>")}</h2>
<p class="lead rise">${esc(SECRET[l][1])}</p></div>
<div class="payroll glass glass-d tilt" id="payroll"><div class="who" role="group" aria-label="${t("Кто смотрит", "Kim ko‘rmoqda")}"><button type="button" data-who="in" aria-pressed="true">${t("Видит сотрудник", "Xodim ko‘radi")}</button><button type="button" data-who="out" aria-pressed="false">${t("Видит Optimal Prime", "Optimal Prime ko‘radi")}</button></div>
${rows.map((r, i) => `<div class="pr"><span>${r}</span><b>${pay[i]}\u00a0000\u00a0000</b></div>`).join("")}
<p class="lock">${ICON.lock}<span>${t("Ведомость в макете: демо-суммы. Внутри компании расчёт зарплаты никто не видит.", "Maketdagi qaydnoma: demo summalar. Kompaniya ichida ish haqi hisobini hech kim ko‘rmaydi.")}</span></p></div>
</div></section>`;
}

function why(l, t) {
  return `<section class="sec" id="why"><div class="wrap">
<p class="kick rise"><i></i>${t("Почему мы", "Nega biz")}</p>
<h2 class="h2 rise">${t("Преимущества работы <b>с Optimal Prime</b>", "Optimal Prime bilan <b>ishlash afzalliklari</b>")}</h2>
<div class="why">${WHY.map((w, i) => `<div class="flip" style="transition-delay:${i * 90}ms"><i>0${i + 1}</i><b>${esc(w[l][0])}</b><p>${esc(w[l][1])}</p></div>`).join("")}</div>
<div class="gains">${GAINS.map((g) => `<div class="rise"><b>${esc(g[l][0])}</b><p>${esc(g[l][1])}</p></div>`).join("")}</div>
</div></section>`;
}

function tarif(l, t) {
  const rng = (id, label, sub, min, max, step) => `<div class="rng"><label for="s-${id}"><span>${label}<small>${sub}</small></span><b id="v-${id}"></b></label><input type="range" id="s-${id}" min="${min}" max="${max}" step="${step}"><span class="ex" id="x-${id}"></span></div>`;
  return `<section class="sec cvn" id="tarif" style="background:var(--s2)"><div class="wrap">
<p class="kick rise"><i></i>${t("Тарифы", "Tariflar")}</p>
<h2 class="h2 rise">${t("Соберите тариф <b>под свой объём</b>", "Tarifni <b>hajmingizga moslang</b>")}</h2>
<p class="lead rise">${t("Выберите налоговый режим и подвиньте ползунки: сумма считается по нашим ценам за операцию и сотрудника. Прозрачные цены без скрытых платежей.", "Soliq rejimini tanlang va slayderlarni suring: summa operatsiya va xodim uchun narxlarimiz bo‘yicha hisoblanadi. Shaffof narxlar, yashirin to‘lovsiz.")}</p>
<div class="rgtabs rise" role="group" aria-label="${t("Налоговый режим", "Soliq rejimi")}"><span class="pill" aria-hidden="true"></span>${REGIMES.map((r, i) => `<button type="button" data-rg="${r.id}" aria-pressed="${r.id === "osn"}">${esc(r[l][0])}<small>${esc(r[l][1])}</small></button>${r.popular ? `<span class="hot">${t("Популярный", "Mashhur")}</span>` : ""}`).join("")}</div>
<div class="tf"><div class="tfl">
${rng("bank", t("Банковские платежи в сумах", "So‘mdagi bank to‘lovlari"), t(`${fmt(UNIT.bank)} сум за операцию`, `operatsiya uchun ${fmt(UNIT.bank)} so‘m`), 5, 150, 5)}
${rng("acc", t("Бухгалтерские операции", "Buxgalteriya operatsiyalari"), t(`${fmt(UNIT.acc)} сум за операцию`, `operatsiya uchun ${fmt(UNIT.acc)} so‘m`), 10, 250, 5)}
${rng("emp", t("Сотрудники: кадры и зарплата", "Xodimlar: kadrlar va ish haqi"), t(`до 3: ${fmt(UNIT.empMin)} сум, дальше ${fmt(UNIT.emp)} за человека`, `3 tagacha: ${fmt(UNIT.empMin)} so‘m, keyin har biriga ${fmt(UNIT.emp)}`), 1, 60, 1)}
${rng("fx", t("Банковские платежи в валюте", "Valyutadagi bank to‘lovlari"), t(`${fmt(UNIT.fx)} сум за операцию`, `operatsiya uchun ${fmt(UNIT.fx)} so‘m`), 0, 30, 1)}
<div id="rgfix"></div>
<details class="once"><summary><span>${t("Разовые услуги", "Bir martalik xizmatlar")}</span><span class="mu">${t("по нашему прайсу", "narxlarimiz bo‘yicha")}</span></summary><div class="og">
${ONCE.map((o) => `<label class="opt"><input type="checkbox" data-once="${o.id}"><span class="sw"></span><span class="ot"><b>${esc(o[l])}</b></span><span class="op">${o.from ? t("от ", "") : ""}${sum(o.price, l)}${o.from && l === "uz" ? "dan" : ""}</span></label>`).join("")}
</div></details>
</div>
<aside class="tsum glass" aria-live="polite"><h3 id="trg"></h3><div id="tsum"></div>
<div class="vs" id="tvs" data-addon="staff"></div>
<button type="button" class="btn btn-a" id="tsend">${ICON.tg}<span>${t("Отправить расчёт", "Hisobni yuborish")}</span></button>
<p>${t("* Цены указаны ориентировочно. Точная стоимость рассчитывается индивидуально, после встречи и аудита.", "* Narxlar taxminiy. Aniq narx uchrashuv va auditdan keyin individual hisoblanadi.")}</p></aside></div>
</div></section>`;
}

function industries(l, t) {
  return `<section class="sec dark" id="industries"><div class="wrap">
<p class="kick rise"><i></i>${t("Отрасли", "Sohalar")}</p>
<h2 class="h2 rise">${t("Аутсорсинг <b>для любой сферы</b>", "Har qanday soha <b>uchun autsorsing</b>")}</h2>
<p class="lead rise">${t("За 18 лет работы мы накопили опыт в самых разных отраслях: от производства до IT.", "18 yillik ish davomida ishlab chiqarishdan IT gacha turli sohalarda tajriba to‘pladik.")}</p>
<div class="inds">${INDUSTRIES[l].map((x, i) => `<div class="pop" style="transition-delay:${i * 50}ms">${ICON[IND_ICON[i]]}<span>${esc(x)}</span></div>`).join("")}</div>
</div></section>`;
}

function how(l, t) {
  return `<section class="sec cvn" id="how"><div class="wrap">
<p class="kick rise"><i></i>${t("Схема работы", "Ish tartibi")}</p>
<h2 class="h2 rise">${t("Как начать <b>сотрудничество</b>", "Hamkorlikni <b>qanday boshlash</b>")}</h2>
<div class="steps" id="steps"><span class="line" aria-hidden="true"><i></i></span>${STEPS.map((s, i) => `<div class="step"><i>${i + 1}</i><div><b>${esc(s[l][0])}</b><p>${esc(s[l][1])}</p></div></div>`).join("")}</div>
</div></section>`;
}

/* ── Допы: у каждого свой блок, тумблер конструктора его прячет. ─── */
function addonBlocks(l, t) {
  const tag = t("Доп", "Qo‘shimcha");
  const sec = (id, inner, style = "") => `<section class="sec add-block" id="${id}" data-addon="${id}" data-tag="${tag}"${style}>${inner}</section>`;
  const staff = sec("staff", `<div class="wrap">
<p class="kick rise"><i></i>${t("Сравните сами", "O‘zingiz solishtiring")}</p>
<h2 class="h2 rise">${t("Бухгалтер в штате <b>или мы</b>", "Shtatdagi buxgalter <b>yoki biz</b>")}</h2>
<p class="lead rise">${t("Впишите, сколько получает ваш бухгалтер. Сайт добавит налог на фонд оплаты и рабочее место, а рядом поставит тариф из конструктора.", "Buxgalteringiz qancha olishini yozing. Sayt ish haqi fondiga soliq va ish joyini qo‘shadi, yoniga konstruktordagi tarifni qo‘yadi.")}</p>
<div class="vsgrid"><div class="tfl">
<div class="rng"><label for="st-sal"><span>${t("Зарплата бухгалтера на руки", "Buxgalterning qo‘lga oladigan maoshi")}</span><b id="st-salv"></b></label><input type="range" id="st-sal" min="3000000" max="25000000" step="500000" value="9000000"></div>
<div class="rng"><label for="st-tax"><span>${t("Налоги на зарплату, %", "Ish haqiga soliqlar, %")}<small>${t("социальный налог 12% и НДФЛ, меняется", "ijtimoiy soliq 12% va JShDS, o‘zgaradi")}</small></span><b id="st-taxv"></b></label><input type="range" id="st-tax" min="0" max="40" step="1" value="24"></div>
<div class="rng"><label for="st-pl"><span>${t("Рабочее место, программа, ЭЦП в месяц", "Ish joyi, dastur, ERI oyiga")}</span><b id="st-plv"></b></label><input type="range" id="st-pl" min="0" max="6000000" step="250000" value="1500000"></div>
</div>
<div class="bars stack"><div class="bar"><small><span>${t("Бухгалтер в штате", "Shtatdagi buxgalter")}</span><b id="bin"></b></small><div><i id="bini"></i></div></div><div class="bar us"><small><span>${t("Optimal Prime, тариф из конструктора", "Optimal Prime, konstruktordagi tarif")}</span><b id="bus"></b></small><div><i id="busi"></i></div></div>
<p class="mu" style="margin:0;font-size:14px">${t("Отпуск и больничный штатного бухгалтера учёт не останавливают: замену даём мы.", "Shtatdagi buxgalterning ta’tili va kasalligi hisobni to‘xtatmaydi: almashtirishni biz beramiz.")}</p></div></div>
</div>`);
  const cab = sec("cab", `<div class="wrap two"><div>
<p class="kick rise"><i></i>${t("Кабинет клиента", "Mijoz kabineti")}</p>
<h2 class="h2 rise">${t("Отчёты, сроки и документы <b>в одном окне</b>", "Hisobotlar, muddatlar va hujjatlar <b>bitta oynada</b>")}</h2>
<p class="lead rise">${t("Директор видит, что сдано и что в работе, ближайшие сроки и счета. Вопрос «а что с отчётом?» больше не нужен.", "Direktor nima topshirilgani va nima ishda ekanini, yaqin muddatlar va hisoblarni ko‘radi. «Hisobot nima bo‘ldi?» degan savol endi kerak emas.")}</p></div>
<div class="cab tilt"><div class="cab-h">${MARK}<b>«[[t:0]] Group» · ${t("демо", "demo")}</b><small>${t("бухгалтер: Dilnoza", "buxgalter: Dilnoza")}</small></div>
<div class="cab-t" role="group">${[["rep", t("Отчёты", "Hisobotlar")], ["docs", t("Документы", "Hujjatlar")], ["bills", t("Счета", "Hisoblar")]].map(([k, n], i) => `<button type="button" data-cab="${k}" aria-pressed="${i === 0}">${n}</button>`).join("")}</div>
<div class="cab-b" id="cabb"></div>
<div id="upload" data-addon="upload" style="padding:0 20px 20px"><label class="drop">${ICON.up}<b>${t("Первичка с телефона", "Telefondan birlamchi hujjatlar")}</b><span>${t("Сфотографируйте счёт или накладную. В макете файл никуда не уходит.", "Hisob yoki yuk xatini suratga oling. Maketda fayl hech qayerga ketmaydi.")}</span><input type="file" id="upf" accept="image/*,.pdf" capture="environment"></label></div>
</div></div>`);
  const remind = sec("remind", `<div class="wrap two"><div>
<p class="kick rise"><i></i>${t("Налоговый календарь", "Soliq kalendari")}</p>
<h2 class="h2 rise">${t("Сроки придут <b>в Telegram</b>", "Muddatlar <b>Telegramga</b> keladi")}</h2>
<p class="lead rise">${t("За три дня и в день срока клиент получает сообщение: что подготовить и что оплатить. По его режиму налогов.", "Uch kun oldin va muddat kuni mijoz xabar oladi: nima tayyorlash va nima to‘lash kerak. Soliq rejimiga qarab.")}</p>
<div class="hero-act rise"><a class="btn btn-n" href="https://t.me/${COMPANY.tg}" target="_blank" rel="noopener">${ICON.tg}<span>${t("Включить напоминания", "Eslatmalarni yoqish")}</span></a></div></div>
<div><div class="rgtabs" id="calrg" role="group" style="margin-top:0"><span class="pill" aria-hidden="true"></span>${REGIMES.map((r) => `<button type="button" data-crg="${r.id}" aria-pressed="${r.id === "osn"}">${esc(r[l][0])}</button>`).join("")}</div>
<div class="cal" id="calv"></div><p class="mu" style="font-size:14px">${t("Даты в макете: демо-расписание. Настоящий календарь собирается по Налоговому кодексу.", "Maketdagi sanalar: demo jadval. Haqiqiy kalendar Soliq kodeksi bo‘yicha tuziladi.")}</p></div>
</div>`, ' style="background:var(--s2)"');
  const check = sec("check", `<div class="wrap two"><div>
<p class="kick rise"><i></i>${t("Проверка учёта", "Hisobni tekshirish")}</p>
<h2 class="h2 rise">${t("Где учёт может подвести, <b>за 2 минуты</b>", "Hisob qayerda pand berishi mumkin, <b>2 daqiqada</b>")}</h2>
<p class="lead rise">${t("Семь вопросов «да или нет». В конце список рисков простыми словами и запись на первичную оценку.", "«Ha yoki yo‘q» yetti savol. Oxirida xavflar ro‘yxati oddiy so‘zlar bilan va dastlabki baholashga yozilish.")}</p></div>
<div class="quiz pop" id="quiz"></div></div>`);
  const bot = sec("bot", `<div class="wrap two"><div>
<p class="kick rise"><i></i>${t("Бот в Telegram", "Telegramdagi bot")}</p>
<h2 class="h2 rise">${t("Расчёт тарифа <b>прямо в Telegram</b>", "Tarif hisobi <b>to‘g‘ridan-to‘g‘ri Telegramda</b>")}</h2>
<p class="lead rise">${t("Те же вопросы, что в конструкторе. Бот считает сумму и передаёт заявку менеджеру.", "Konstruktordagi savollar. Bot summani hisoblaydi va arizani menejerga beradi.")}</p></div>
<div class="chat" aria-label="${t("Пример переписки с ботом", "Bot bilan yozishma namunasi")}"><p class="bt">${t("Какой у вас налоговый режим?", "Soliq rejimingiz qanday?")}</p><p class="me">${t("УСН", "STS")}</p><p class="bt">${t("Сколько сотрудников и платежей в месяц?", "Oyiga nechta xodim va to‘lov?")}</p><p class="me">${t("8 сотрудников, 30 платежей", "8 xodim, 30 to‘lov")}</p><p class="bt">${t(`Ориентировочно ${fmt(monthly("usn", { bank: 30, emp: 8, acc: 70, fx: 0 }))} сум в месяц. Передал менеджеру, он позвонит для встречи.`, `Taxminan oyiga ${fmt(monthly("usn", { bank: 30, emp: 8, acc: 70, fx: 0 }))} so‘m. Menejerga uzatdim, uchrashuv uchun qo‘ng‘iroq qiladi.`)}</p></div></div>`, ' style="background:var(--s2)"');
  const kbTopics = l === "ru"
    ? [["ВЭД", "Как зарегистрировать валютный контракт в ЕЭИСВО", "Что подготовить, сколько это занимает и где чаще всего ошибаются."], ["Налоги", "УСН или общая система: что выгоднее в 2026 году", "Как считать, когда переход обязателен и что меняется в отчётности."], ["Кадры", "Расчёт зарплаты: что проверить перед выплатой", "Табель, приказы, налоги с зарплаты и сроки их оплаты."], ["Учёт", "Первичные документы: какие хранить и сколько", "Счета, накладные, акты: что нужно бухгалтеру каждый месяц."], ["Аутсорсинг", "Бухгалтерский аутсорсинг в Ташкенте: как выбрать", "Договор, ответственность, кто ведёт ваш учёт и как его сменить."], ["Отчётность", "Электронные счета-фактуры и уполномочия", "Как работает обмен и что делать, если контрагент не принял."]]
    : [["TIF", "Valyuta shartnomasini EEAXATda qanday ro‘yxatdan o‘tkazish", "Nima tayyorlash, qancha vaqt oladi va ko‘pincha qayerda xato qilinadi."], ["Soliqlar", "STS yoki umumiy tizim: 2026 yilda qaysi foydaliroq", "Qanday hisoblash, o‘tish qachon majburiy va hisobotda nima o‘zgaradi."], ["Kadrlar", "Ish haqi hisobi: to‘lovdan oldin nimani tekshirish", "Tabel, buyruqlar, ish haqidan soliqlar va ularni to‘lash muddatlari."], ["Hisob", "Birlamchi hujjatlar: qaysilarini va qancha saqlash", "Hisoblar, yuk xatlari, dalolatnomalar: buxgalterga har oy nima kerak."], ["Autsorsing", "Toshkentda buxgalteriya autsorsingi: qanday tanlash", "Shartnoma, javobgarlik, hisobingizni kim yuritadi va uni qanday almashtirish."], ["Hisobot", "Elektron hisob-fakturalar va vakolatlar", "Almashinuv qanday ishlaydi va kontragent qabul qilmasa nima qilish kerak."]];
  const kb = sec("kb", `<div class="wrap">
<p class="kick rise"><i></i>${t("Полезное", "Foydali")}</p>
<h2 class="h2 rise">${t("Страницы под запросы <b>и статьи</b>", "So‘rovlar uchun sahifalar <b>va maqolalar</b>")}</h2>
<p class="lead rise">${t("Шесть тем, которые клиенты ищут в Google и Яндексе. В макете: заголовки и о чём статья.", "Mijozlar Google va Yandexda qidiradigan oltita mavzu. Maketda: sarlavhalar va maqola nima haqida.")}</p>
<div class="kb">${kbTopics.map(([k, h, p], i) => `<article class="rise" style="transition-delay:${i * 70}ms"><small>${k}</small><h3>${h}</h3><p>${p}</p></article>`).join("")}</div></div>`);
  const admin = sec("admin", `<div class="wrap two"><div>
<p class="kick rise"><i></i>${t("Панель", "Panel")}</p>
<h2 class="h2 rise">${t("Заявки и клиенты <b>в одной панели</b>", "Arizalar va mijozlar <b>bitta panelda</b>")}</h2>
<p class="lead rise">${t("Расчёт из конструктора приходит в панель первой строкой. Менеджер ставит «Встреча», и клиент сразу видит это на сайте в «Моя заявка».", "Konstruktordagi hisob panelga birinchi qatorda keladi. Menejer «Uchrashuv» qo‘yadi, mijoz buni darhol saytda «Arizam»da ko‘radi.")}</p>
<div class="hero-act rise"><a class="btn btn-n" href="${href(l, "panel")}">${ICON.panel}<span>${t("Открыть панель", "Panelni ochish")}</span></a></div></div>
<div class="cards3" style="grid-template-columns:1fr 1fr">${[[t("Заявки с сайта", "Saytdan arizalar"), t("с расчётом тарифа", "tarif hisobi bilan")], [t("Клиенты", "Mijozlar"), t("режим, бухгалтер, первичка", "rejim, buxgalter, birlamchi")], [t("Сроки отчётов", "Hisobot muddatlari"), t("на неделю вперёд", "bir hafta oldinga")], [t("Роли и история", "Rollar va tarix"), t("менеджер не видит выручку", "menejer tushumni ko‘rmaydi")]].map(([b, p]) => `<div class="fc pop"><b>${b}</b><p>${p}</p></div>`).join("")}</div>
</div>`, ' style="background:var(--s2)"');
  return { staff, cab, remind, check, bot, kb, admin };
}

function clients(l, t) {
  const list = l === "ru" ? CLIENTS : CLIENTS_UZ;
  const row = (x, rev) => `<div class="row" data-rev="${rev}">${[0, 1, 2].map(() => x.map((s) => `<span>${esc(s)}</span>`).join("")).join("")}</div>`;
  return `<section class="sec" id="clients"><div class="wrap">
<p class="kick rise"><i></i>${t("Наши клиенты", "Mijozlarimiz")}</p>
<h2 class="h2 rise">${t("Нам <b>доверяют</b>", "Bizga <b>ishonishadi</b>")}</h2></div>
<div class="cls" aria-label="${t("Клиенты Optimal Prime", "Optimal Prime mijozlari")}">${row(list, 0)}${row(list.slice(5).concat(list.slice(0, 5)), 1)}</div>
</section>`;
}

function contact(l, t) {
  return `<section class="sec dark cvn" id="contact"><div class="wrap contact">
<div><p class="kick rise"><i></i>${t("Свяжитесь с нами", "Biz bilan bog‘laning")}</p>
<h2 class="h2 rise">${t("Обсудим <b>партнёрство?</b>", "Hamkorlikni <b>muhokama qilamizmi?</b>")}</h2>
<p class="lead rise">${t("Предлагаем обсудить сотрудничество на короткой предварительной 15-минутной встрече. Оставьте заявку: мы перезвоним и выберем удобное время.", "Hamkorlikni qisqa dastlabki 15 daqiqalik uchrashuvda muhokama qilishni taklif qilamiz. Arizangizni qoldiring: biz qo‘ng‘iroq qilamiz va qulay vaqtni tanlaymiz.")}</p>
<div class="cinfo rise" style="margin-top:32px">
${COMPANY.phones.map((p) => `<a href="tel:${p.replace(/\s/g, "")}">${ICON.phone}<span>${p}</span></a>`).join("")}
<a href="mailto:${COMPANY.mail}">${ICON.mail}<span>${COMPANY.mail}</span></a>
<p>${ICON.pin}<span>${esc(COMPANY.addr[l])}<small>${esc(COMPANY.hours[l])}</small></span></p></div></div>
<form class="cform" id="cf" novalidate>
<label class="fld" style="color:var(--tx)"><span>${t("Компания", "Kompaniya")}</span><input id="cco" autocomplete="organization" required></label>
<label class="fld" style="color:var(--tx)"><span>${t("Телефон", "Telefon")}</span><input id="cph" type="tel" autocomplete="tel" inputmode="tel" placeholder="+998" required></label>
<div class="fld" style="color:var(--tx)"><span>${t("Тип услуги", "Xizmat turi")}</span><div class="kinds">${KINDS[l].map((k, i) => `<label><input type="radio" name="kind" value="${esc(k)}"${i === 0 ? " checked" : ""}><span>${esc(k)}</span></label>`).join("")}</div></div>
<p class="err" id="cerr" role="alert"></p>
<button type="submit" class="btn btn-a" id="cgo">${ICON.tg}<span>${t("Отправить заявку", "Ariza yuborish")}</span></button>
<p class="mu" style="margin:0;font-size:14px;color:var(--mu)">${t("Откроется Telegram с готовым текстом. В макете заявка ещё ложится в панель.", "Tayyor matn bilan Telegram ochiladi. Maketda ariza panelga ham tushadi.")}</p>
</form></div></section>`;
}

function footer(l, t) {
  return `<footer class="foot"><div class="wrap"><div class="fgrid">
<div>${LOGO(l)}<p style="margin-top:16px;font-size:14px">${esc(COMPANY.slogan[l])}</p><a href="tel:${COMPANY.tel}" style="font:700 18px/1.3 var(--hd);color:#fff">${COMPANY.phones[0]}</a></div>
<div><h4>${t("Услуги", "Xizmatlar")}</h4>${SERVICES.map((s) => `<a href="#services">${esc(s[l][0])}</a>`).join("")}</div>
<div><h4>${t("Навигация", "Navigatsiya")}</h4><a href="#tarif">${t("Тарифы", "Tariflar")}</a><a href="#how">${t("Как работаем", "Ish tartibi")}</a><a href="#contact">${t("Контакты", "Aloqa")}</a></div>
<div><h4>${t("Мы на связи", "Aloqadamiz")}</h4><a href="https://t.me/${COMPANY.tg}" target="_blank" rel="noopener">Telegram</a><a href="mailto:${COMPANY.mail}">${COMPANY.mail}</a><a href="${COMPANY.site}" target="_blank" rel="noopener">optimal-prime.uz</a></div>
</div>
<div class="sm"><span>© 2026 ${esc(COMPANY.legal[l])}</span><span>${t("Макет DevUz Studio. Пользуясь макетом, вы принимаете", "DevUz Studio maketi. Maketdan foydalanib, siz")} <a href="${TERMS(l)}" target="_blank" rel="noopener">${t("условия макета", "maket shartlarini qabul qilasiz")}</a>${t(".", "")}</span></div>
</div></footer>`;
}

/* Данные для site.js. */
function data(l, t) {
  return {
    l, tg: COMPANY.tg, unit: UNIT,
    rg: REGIMES.map((r) => ({ id: r.id, n: r[l][0], d: r[l][1], def: r.def, fixed: r.fixed.map((f) => ({ id: f.id, p: f.price, n: f[l] })), opt: r.opt.map((o) => ({ id: o.id, p: o.price, on: o.on, n: o[l] })) })),
    once: ONCE.map((o) => ({ id: o.id, p: o.price, from: !!o.from, n: o[l] })),
    t: {
      sum: l === "ru" ? "сум" : "so‘m", month: t("в месяц", "oyiga"), once: t("разово", "bir martalik"), from: t("от", "dan"),
      bank: t("Банк в сумах", "So‘mda bank"), acc: t("Бухгалтерский учёт", "Buxgalteriya hisobi"), emp: t("Кадры и зарплата", "Kadrlar va ish haqi"), fx: t("Банк в валюте", "Valyutada bank"),
      ops: t("операций", "operatsiya"), ppl: t("сотрудников", "xodim"), up: t("до", "gacha"),
      ex: t("ориентировочно: точная цена после аудита", "taxminan: aniq narx auditdan keyin"),
      reg: t("Режим", "Rejim"), tot: t("Итого в месяц", "Oyiga jami"), plusOnce: t("И разово", "Va bir martalik"),
      vs: t("Штатный бухгалтер с налогами и местом", "Soliq va joy bilan shtat buxgalteri"), vsLess: t("экономия в месяц", "oyiga tejash"), vsMore: t("дороже штата на", "shtatdan qimmatroq"),
      hello: t("Здравствуйте! Посчитал тариф на сайте:", "Assalomu alaykum! Saytda tarifni hisobladim:"),
      req: t("Здравствуйте! Хочу обсудить сотрудничество.", "Assalomu alaykum! Hamkorlikni muhokama qilmoqchiman."),
      co: t("Компания", "Kompaniya"), ph: t("Телефон", "Telefon"), kind: t("Тип услуги", "Xizmat turi"),
      need: t("Напишите компанию и телефон", "Kompaniya va telefonni yozing"),
      sent: t("Заявка в панели. Открываем Telegram", "Ariza panelda. Telegram ochilmoqda"),
      mine: t("Моя заявка", "Arizam"), no: t("Заявка", "Ariza"), mineHint: t("Это макет: статус меняется в панели, и вы видите его здесь.", "Bu maket: holat panelda o‘zgaradi va siz uni shu yerda ko‘rasiz."), panel: t("Открыть панель", "Panelni ochish"), panelUrl: href(l, "panel"),
      st: [t("Новая", "Yangi"), t("Встреча", "Uchrashuv"), t("Расчёт отправлен", "Hisob yuborildi"), t("Договор", "Shartnoma"), t("Отказ", "Rad etildi")],
      close: t("Закрыть", "Yopish"), demo: t("демо", "demo"),
      cab: {
        rep: l === "ru" ? [["НДС за месяц", "сдан", "ok"], ["Налог на прибыль, квартал", "в работе", "w"], ["Статистика, форма 1-КБ", "сдан", "ok"], ["Зарплатная ведомость", "готова к выплате", "ok"]] : [["Oylik QQS", "topshirildi", "ok"], ["Foyda solig‘i, chorak", "ishda", "w"], ["Statistika, 1-KB shakli", "topshirildi", "ok"], ["Ish haqi qaydnomasi", "to‘lovga tayyor", "ok"]],
        docs: l === "ru" ? [["Накладные за октябрь", "ждём 3 шт.", "w"], ["Договор с «[[t:1]] Logistic»", "получен", "ok"], ["Акт сверки с банком", "получен", "ok"]] : [["Oktyabr yuk xatlari", "3 ta kutilmoqda", "w"], ["«[[t:1]] Logistic» bilan shartnoma", "olindi", "ok"], ["Bank bilan solishtirish dalolatnomasi", "olindi", "ok"]],
        bills: l === "ru" ? [["Счёт за октябрь", "оплачен", "ok"], ["Счёт за ноябрь", "к оплате", "w"], ["Акт выполненных работ", "подписан", "ok"]] : [["Oktyabr hisobi", "to‘langan", "ok"], ["Noyabr hisobi", "to‘lanishi kerak", "w"], ["Bajarilgan ishlar dalolatnomasi", "imzolangan", "ok"]],
      },
      up: t("Файл в папке месяца · демо: никуда не отправлен", "Fayl oy papkasida · demo: hech qayerga yuborilmadi"),
      cal: {
        light: l === "ru" ? [["10", "ноя", "Налог с оборота", "расчёт и оплата"], ["15", "ноя", "НДФЛ и социальный налог", "за октябрь"], ["25", "ноя", "Статистика", "если вы в выборке"]] : [["10", "noy", "Aylanmadan soliq", "hisob va to‘lov"], ["15", "noy", "JShDS va ijtimoiy soliq", "oktyabr uchun"], ["25", "noy", "Statistika", "agar tanlovda bo‘lsangiz"]],
        usn: l === "ru" ? [["10", "ноя", "Налог с оборота", "расчёт и оплата"], ["15", "ноя", "НДФЛ и социальный налог", "за октябрь"], ["20", "ноя", "Электронные счета-фактуры", "сверка за месяц"], ["25", "ноя", "Статистика", "ежемесячная"]] : [["10", "noy", "Aylanmadan soliq", "hisob va to‘lov"], ["15", "noy", "JShDS va ijtimoiy soliq", "oktyabr uchun"], ["20", "noy", "Elektron hisob-fakturalar", "oylik solishtirish"], ["25", "noy", "Statistika", "oylik"]],
        osn: l === "ru" ? [["15", "ноя", "НДФЛ и социальный налог", "за октябрь"], ["20", "ноя", "НДС", "расчёт за октябрь"], ["20", "ноя", "Налог на прибыль", "авансовый платёж"], ["25", "ноя", "Статистика", "ежемесячная"], ["30", "ноя", "ЕЭИСВО", "валютные контракты"]] : [["15", "noy", "JShDS va ijtimoiy soliq", "oktyabr uchun"], ["20", "noy", "QQS", "oktyabr hisobi"], ["20", "noy", "Foyda solig‘i", "avans to‘lovi"], ["25", "noy", "Statistika", "oylik"], ["30", "noy", "EEAXAT", "valyuta shartnomalari"]],
      },
      quiz: {
        q: l === "ru" ? ["Бухгалтер у вас один и его некому заменить?", "Сверки с контрагентами делаете реже раза в квартал?", "Первичка приходит бухгалтеру позже конца месяца?", "Есть валютные контракты, а ЕЭИСВО ведёт кто придётся?", "Зарплаты знает больше двух человек в компании?", "Были письма или вопросы из налоговой за последний год?", "Учётной политики нет или её не обновляли больше года?"] : ["Buxgalteringiz bitta va uni almashtiradigan yo‘qmi?", "Kontragentlar bilan solishtirish choragiga bir martadan kam qilinadimi?", "Birlamchi hujjatlar buxgalterga oy oxiridan keyin keladimi?", "Valyuta shartnomalari bor, EEAXATni esa kim bo‘lsa yuritadimi?", "Maoshlarni kompaniyada ikki kishidan ko‘p biladimi?", "Oxirgi yilda soliqdan xat yoki savol bo‘lganmi?", "Hisob siyosati yo‘qmi yoki bir yildan ko‘p yangilanmaganmi?"],
        r: l === "ru" ? ["Учёт встанет, если бухгалтер заболеет или уйдёт.", "Расхождения с контрагентами всплывут поздно, при проверке.", "Отчёт сдаётся по неполным данным, потом его правят.", "Валютный контракт без учёта в ЕЭИСВО: риск штрафа и задержки платежей.", "Новость о прибавке разойдётся, и поднимать придётся всем.", "Налоговая уже смотрит внимательнее: ответы лучше готовить с экспертом.", "Без учётной политики спорные операции трактуются не в вашу пользу."] : ["Buxgalter kasal bo‘lsa yoki ketsa, hisob to‘xtaydi.", "Kontragentlar bilan farqlar kech, tekshiruvda chiqadi.", "Hisobot to‘liq bo‘lmagan ma’lumot bilan topshiriladi, keyin tuzatiladi.", "EEAXATda hisobsiz valyuta shartnomasi: jarima va to‘lov kechikishi xavfi.", "Oshirish haqidagi xabar tarqaladi va hammaga oshirishga to‘g‘ri keladi.", "Soliq idorasi allaqachon diqqat bilan qaramoqda: javoblarni mutaxassis bilan tayyorlagan ma’qul.", "Hisob siyosatisiz bahsli operatsiyalar sizning foydangizga talqin qilinmaydi."],
        yes: t("Да", "Ha"), no: t("Нет", "Yo‘q"), of: t("из", "/"), res: t("Что стоит проверить", "Nimani tekshirish kerak"), ok: t("Серьёзных рисков по ответам не видно. Первичная оценка покажет детали.", "Javoblar bo‘yicha jiddiy xavf ko‘rinmaydi. Dastlabki baholash tafsilotlarni ko‘rsatadi."), book: t("Записаться на первичную оценку", "Dastlabki baholashga yozilish"), again: t("Пройти ещё раз", "Qayta o‘tish"), ql: t("Вопрос", "Savol"),
        msg: t("Здравствуйте! Прошёл проверку учёта на сайте, хочу записаться на первичную оценку.", "Assalomu alaykum! Saytda hisobni tekshirdim, dastlabki baholashga yozilmoqchiman."),
      },
    },
  };
}

function sitePage(l) {
  const t = T(l);
  const A = addonBlocks(l, t);
  const title = t("Optimal Prime · бухгалтерский и HR-аутсорсинг в Ташкенте с 2008 года", "Optimal Prime · Toshkentda buxgalteriya va HR autsorsing, 2008 yildan");
  const desc = t("Ведём бухгалтерский, налоговый и кадровый учёт, ВЭД и ЕЭИСВО. Конструктор тарифа по режиму налогов, расчёт за минуту, встреча за 15 минут.", "Buxgalteriya, soliq va kadrlar hisobi, TIF va EEAXAT. Soliq rejimi bo‘yicha tarif konstruktori, bir daqiqada hisob, 15 daqiqalik uchrashuv.");
  return `${head(l, title, desc)}
<style>${CSS}</style>
</head>
<body>
<a class="vh" href="#tarif">${t("К расчёту тарифа", "Tarif hisobiga o‘tish")}</a>
${header(l, t)}
<main>
${hero(l, t)}
${velo(l)}
${services(l, t)}
${secret(l, t)}
${why(l, t)}
${A.staff}
${tarif(l, t)}
${industries(l, t)}
${how(l, t)}
${A.cab}
${A.remind}
${A.check}
${A.bot}
${A.kb}
${A.admin}
${clients(l, t)}
${contact(l, t)}
</main>
${footer(l, t)}
<a class="cfgb glass" href="${href(l)}#offer">${t("Конструктор", "Konstruktor")}</a>
<div class="dock glass hide" id="dock"><a class="btn btn-a" href="#tarif">${ICON.calc}<span>${t("Тариф", "Tarif")}</span></a><a class="btn btn-n" href="https://t.me/${COMPANY.tg}" target="_blank" rel="noopener">${ICON.tg}<span>Telegram</span></a></div>
<div class="sheet" id="sheet" role="dialog" aria-modal="true" aria-labelledby="shh"><div class="sh" data-close></div><div class="box"><div class="bh"><b id="shh"></b><button type="button" class="x" data-close aria-label="${t("Закрыть", "Yopish")}">${ICON.close}</button></div><div class="bb" id="shb"></div></div></div>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script type="application/json" id="op-data">${JSON.stringify(data(l, t)).replace(/</g, "\\u003c")}</script>
<script>
${JS}</script>
</body>
</html>`;
}

/* ── Первая страница: залёт в бренд, выбор, конструктор DevUz ─────── */
function offer(l, t) {
  return `<section class="sec offer" id="offer"><div class="wrap">
<p class="kick"><i></i>${t("Предложение DevUz Studio", "DevUz Studio taklifi")}</p>
<h2 class="h2">${t("Сайт <b>по этому макету</b>", "Shu maket <b>bo‘yicha sayt</b>")}</h2>
<p class="lead">${t(`48 часов с первого открытия макета: сайт ${usd(BASE.promo)} вместо ${usd(BASE.price)}. Допы включаются тумблером, и их блок на сайте тут же появляется или пропадает.`, `Maket birinchi ochilganidan 48 soat: sayt ${usd(BASE.price)} o‘rniga ${usd(BASE.promo)}. Qo‘shimchalar tumbler bilan yoqiladi va ularning bloki saytda darhol paydo bo‘ladi yoki yo‘qoladi.`)}</p>
<div class="cst"><div>
<div class="base"><div class="hd"><b>${esc(BASE[l].t)}</b><span class="pp"><s>${usd(BASE.price)}</s>${usd(BASE.promo)}</span></div><p>${esc(BASE[l].d)}</p></div>
<div class="adds">${ADDONS.map((a) => `<label class="add"><input type="checkbox" data-add="${a.id}" checked><span class="sw" aria-hidden="true"></span><span><b>${esc(a[l].t)}</b>${a.star ? `<span class="star">${t("берут первым", "birinchi oladilar")}</span>` : ""}<p>${esc(a[l].e)}</p><small>${esc(a[l].who)}</small></span><span class="ap">${usd(a.price)}</span></label>`).join("")}</div>
</div>
<aside class="sum glass" aria-live="polite">
<div class="row"><span>${t("Сайт", "Sayt")}</span><span>${usd(BASE.promo)}</span></div>
<div class="row"><span>${t("Допы", "Qo‘shimchalar")} <span id="addn"></span></span><span id="adds">0 $</span></div>
<div class="tot"><span>${t("Итого", "Jami")}</span><b id="total">${usd(ALL)}</b></div>
<p style="margin:16px 0 0;color:var(--mu);font-size:14px">${t("Цена сайта держится:", "Sayt narxi amal qiladi:")}</p>
<div class="timer" id="timer"><span><b id="th">48</b><small>${t("часов", "soat")}</small></span><span><b id="tm">00</b><small>${t("минут", "daqiqa")}</small></span><span><b id="ts">00</b><small>${t("секунд", "soniya")}</small></span></div>
<div class="ctrl"><button type="button" class="btn btn-g btn-s" id="allon">${t("Всё из макета", "Maketdagi hammasi")}</button><button type="button" class="btn btn-g btn-s" id="alloff">${t("Только сайт", "Faqat sayt")}</button></div>
<button type="button" class="btn btn-g" id="copy">${ICON.copy}<span>${t("Скопировать состав", "Tarkibni nusxalash")}</span></button>
<a class="btn btn-a" href="${DEVUZ}" target="_blank" rel="noopener">${ICON.tg}<span>${t("Обсудить с DevUz Studio", "DevUz Studio bilan muhokama qilish")}</span></a>
</aside></div>
</div></section>`;
}

function landPage(l) {
  const t = T(l);
  const site = [
    t("Залёт в ваш знак, стекло и параллакс на первом экране", "Belgingizga uchib kirish, birinchi ekranda shisha va parallaks"),
    t("Конструктор тарифа по вашим ценам: Light, УСН, ОСН и ползунки", "Narxlaringiz bo‘yicha tarif konstruktori: Light, STS, UTS va slayderlar"),
    t("Тайна зарплат: ваш главный довод, показан ведомостью", "Maosh siri: asosiy dalilingiz qaydnoma bilan ko‘rsatilgan"),
    t("Услуги вкладками, отрасли, шесть шагов по прокрутке", "Xizmatlar tablar bilan, sohalar, aylantirishda olti qadam"),
    t("Кабинет клиента, налоговый календарь, проверка учёта", "Mijoz kabineti, soliq kalendari, hisobni tekshirish"),
  ];
  const pan = [
    t("Расчёт с сайта первой строкой, статус виден клиенту", "Saytdan hisob birinchi qatorda, holati mijozga ko‘rinadi"),
    t("Заявки к прошлым 30 дням, откуда пришли, путь до договора", "Arizalar oldingi 30 kunga, qayerdan kelgani, shartnomagacha yo‘l"),
    t("Клиенты: режим, бухгалтер, первичка, ближайший отчёт", "Mijozlar: rejim, buxgalter, birlamchi, yaqin hisobot"),
    t("Сроки отчётов на неделю вперёд", "Bir hafta oldinga hisobot muddatlari"),
    t("Роли: менеджер не видит выручку, история действий", "Rollar: menejer tushumni ko‘rmaydi, harakatlar tarixi"),
  ];
  const li = (a) => `<ul class="feat">${a.map((x) => `<li>${ICON.check}<span>${x}</span></li>`).join("")}</ul>`;
  const steps = [
    t("Откройте сайт, в «Тарифах» выберите УСН и подвиньте «Сотрудники» до 15.", "Saytni oching, «Tariflar»da STSni tanlang va «Xodimlar»ni 15 gacha suring."),
    t("Нажмите «Отправить расчёт»: откроется Telegram с текстом, а заявка ляжет в панель.", "«Hisobni yuborish»ni bosing: matn bilan Telegram ochiladi, ariza esa panelga tushadi."),
    t("Откройте админку: расчёт первой строкой. Поставьте «Встреча», и сайт покажет это в «Моя заявка».", "Admin panelni oching: hisob birinchi qatorda. «Uchrashuv» qo‘ying, sayt buni «Arizam»da ko‘rsatadi."),
  ];
  const ld = { base: BASE.promo, root: BASE_URL, hours: OFFER_HOURS, img: IMG, n: 60, add: ADDONS.map((a) => ({ id: a.id, p: a.price, t: a[l].t })), t: { copied: t("Состав скопирован", "Tarkib nusxalandi"), tot: t("Итого", "Jami") } };
  return `${head(l, t("Optimal Prime · макет сайта и панели · DevUz Studio", "Optimal Prime · sayt va panel maketi · DevUz Studio"), t("Макет для Optimal Prime: новый сайт с конструктором тарифа и панель заявок и клиентов. Конструктор цены.", "Optimal Prime uchun maket: tarif konstruktorli yangi sayt va arizalar va mijozlar paneli. Narx konstruktori."))}
<link rel="preload" as="image" href="${IMG}/poster-9.webp" media="(max-width: 899px)">
<link rel="preload" as="image" href="${IMG}/poster-16-2880.webp" media="(min-width: 900px)">
<style>${CSS}</style>
</head>
<body>
${dzIntroSolo(l)}
<header class="top on-dark"><div class="top-in glass">
${LOGO(l, "")}
<nav class="nav" aria-label="${t("Разделы", "Bo‘limlar")}"><a href="#choose">${t("Что посмотреть", "Nimani ko‘rish")}</a><a href="#try">${t("Как проверить", "Qanday tekshirish")}</a><a href="#offer">${t("Стоимость", "Narxi")}</a></nav>
<div class="langs">${LANGS.map((x) => `<a href="${href(x)}" hreflang="${x}" lang="${x}"${x === l ? ' aria-current="true"' : ""}>${x.toUpperCase()}</a>`).join("")}</div>
<a class="btn btn-g btn-s adm" href="${href(l, "site")}">${t("Сайт", "Sayt")}</a>
<a class="btn btn-n btn-s" aria-label="${t("Админка", "Admin panel")}" href="${href(l, "panel")}">${ICON.panel}<span class="hide-s">${t("Админка", "Admin panel")}</span></a>
</div></header>
<main>
<section class="hs" id="fly" aria-label="${t("Залёт в бренд Optimal Prime", "Optimal Prime brendiga uchib kirish")}"><div class="hs-st">
<picture><source media="(max-width: 899px)" srcset="${IMG}/poster-9.webp"><img class="hs-a" src="${IMG}/poster-16-1920.webp" srcset="${IMG}/poster-16-1920.webp 1920w, ${IMG}/poster-16-2880.webp 2880w" sizes="100vw" width="1920" height="1080" alt="${t("Знак Optimal Prime: девять плиток, синее стекло и золото", "Optimal Prime belgisi: to‘qqiz plitka, ko‘k shisha va oltin")}" fetchpriority="high"></picture>
<canvas aria-hidden="true"></canvas>
<div class="wrap hs-tx"><p class="kick"><i></i>${t("Макет DevUz Studio для Optimal Prime", "Optimal Prime uchun DevUz Studio maketi")}</p>
<h1>${words(t("Баланс в финансах, <em>рост в&nbsp;бизнесе</em>", "Moliyada muvozanat, <em>biznesda o‘sish</em>"))}</h1>
<p class="lead">${t("Камера входит в ваш знак через щель света между плитками и выходит над деловым Ташкентом, где учёт ведёте вы.", "Kamera plitkalar orasidagi yorug‘lik orqali belgingizga kiradi va siz hisob yuritadigan ishbilarmon Toshkent ustidan chiqadi.")}</p></div>
<div class="hs-p2"><div class="hs-card glass glass-d"><b>${t("18 лет · с 2008 года", "18 yil · 2008 yildan")}</b><span>${t("Бухгалтерский, налоговый и кадровый учёт, ВЭД и ЕЭИСВО", "Buxgalteriya, soliq va kadrlar hisobi, TIF va EEAXAT")}</span></div><a class="btn btn-a" href="#choose">${t("Смотреть макет", "Maketni ko‘rish")}${ICON.arrow}</a></div>
<div class="hs-load" id="hs-load" aria-hidden="true"><span id="hs-n">0</span>%<i id="hs-b"></i></div>
<div class="hs-hint" aria-hidden="true"><span>${t("Листайте", "Aylantiring")}</span><i></i></div>
</div></section>
<section class="sec" id="choose"><div class="wrap">
<p class="kick rise"><i></i>${t("Сайт и панель на ваших данных", "Ma’lumotlaringizdagi sayt va panel")}</p>
<h2 class="h2 rise">${t("Что посмотреть <b>первым</b>", "Avval <b>nimani ko‘rish</b>")}</h2>
<p class="lead rise">${t("Это работающий макет на ваших услугах, ценах и клиентах с optimal-prime.uz. Сайт, каким его увидит директор компании, или панель, где команда ведёт заявки и клиентов.", "Bu optimal-prime.uz’dagi xizmatlar, narxlar va mijozlaringizdagi ishlaydigan maket. Kompaniya direktori ko‘radigan sayt yoki jamoa arizalar va mijozlarni olib boradigan panel.")}</p>
<div class="choices">
<a class="choice rise" href="${href(l, "site")}"><span class="ch-k">${t("Для ваших клиентов", "Mijozlaringiz uchun")}</span><b>${t("Сайт", "Sayt")}</b>
<span class="ch-pic"><img src="${IMG}/city-1280.webp" width="1280" height="720" alt="${t("Деловой квартал Ташкента в сумерках", "Toshkentning ishbilarmonlik kvartali shom paytida")}" loading="lazy"></span>
${li(site)}<span class="btn btn-g">${t("Открыть сайт", "Saytni ochish")}${ICON.arrow}</span></a>
<a class="choice rise" href="${href(l, "panel")}"><span class="ch-k">${t("Для вас и команды", "Siz va jamoa uchun")}</span><b>${t("Админка заявок и клиентов", "Arizalar va mijozlar admin paneli")}</b>
<span class="ch-pic"><span class="browser"><span class="bh"><i></i><i></i><i></i></span><span class="bb"><span class="kpi"><small>${t("Заявки, 30 дней · демо", "Arizalar, 30 kun · demo")}</small><b>46</b></span><span class="kpi"><small>${t("Расчёт с сайта", "Saytdan hisob")}</small><b>№3001</b></span><span class="kpi w"><small>${t("Заявки по дням · демо", "Kunlar bo‘yicha arizalar · demo")}</small><span class="spark" id="lspark"></span></span></span></span></span>
${li(pan)}<span class="btn btn-n">${t("Открыть админку", "Admin panelni ochish")}${ICON.arrow}</span></a>
</div>
</div></section>
<section class="sec" id="try" style="background:var(--s2)"><div class="wrap">
<p class="kick rise"><i></i>${t("Как проверить за минуту", "Bir daqiqada qanday tekshirish")}</p>
<h2 class="h2 rise">${t("Сайт и панель <b>связаны</b>", "Sayt va panel <b>bog‘langan</b>")}</h2>
<ol class="ol">${steps.map((s) => `<li class="rise">${s}</li>`).join("")}</ol>
<div class="hero-act rise"><a class="btn btn-a" href="${href(l, "site")}#tarif">${t("Начать с тарифа", "Tarifdan boshlash")}${ICON.arrow}</a></div>
</div></section>
${offer(l, t)}
</main>
<footer class="foot"><div class="wrap"><div class="fgrid">
<div>${LOGO(l, "")}<p style="margin-top:16px;font-size:14px">${t("Услуги, цены, шаги, клиенты и контакты: optimal-prime.uz. Клиенты, заявки и цифры в панели и кабинете: демо. Кадры залёта: Higgsfield, по вашему знаку.", "Xizmatlar, narxlar, qadamlar, mijozlar va kontaktlar: optimal-prime.uz. Panel va kabinetdagi mijozlar, arizalar va raqamlar: demo. Uchib kirish kadrlari: Higgsfield, belgingiz asosida.")}</p></div>
<div><h4>${t("Макет", "Maket")}</h4><a href="${href(l, "site")}">${t("Сайт", "Sayt")}</a><a href="${href(l, "panel")}">${t("Админка", "Admin panel")}</a><a href="#offer">${t("Стоимость", "Narxi")}</a></div>
<div><h4>DevUz Studio</h4><a href="https://devuz.studio" target="_blank" rel="noopener">devuz.studio</a><a href="${DEVUZ}" target="_blank" rel="noopener">Telegram</a></div>
<div><h4>Optimal Prime</h4><a href="tel:${COMPANY.tel}">${COMPANY.phones[0]}</a><a href="${COMPANY.site}" target="_blank" rel="noopener">optimal-prime.uz</a></div>
</div>
<div class="sm"><span>${t("Макет DevUz Studio. Пользуясь макетом, вы принимаете", "DevUz Studio maketi. Maketdan foydalanib, siz")} <a href="${TERMS(l)}" target="_blank" rel="noopener">${t("условия макета", "maket shartlarini qabul qilasiz")}</a>${t(".", "")}</span></div>
</div></footer>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script type="application/json" id="op-land">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>
<script>
${LAND_JS}</script>
</body>
</html>`;
}

/* ── Панель (по эталону Greenwell) ─────────────────────────────────── */
(function checkDict() {
  const keys = new Set([...PANEL_JS.matchAll(/\bt\('([A-Za-z0-9_]+)'/g)].map((m) => m[1]));
  for (const k of ["tab_", "st_"]) keys.delete(k);
  for (const k of keys) {
    const v = PANEL_UI[k];
    if (!v || v.length !== 2 || v.some((x) => !x)) throw new Error(`panel: нет подписи «${k}» на двух языках`);
    if (/[А-Яа-яЁё]/.test(v[1])) throw new Error(`panel: кириллица в узбекской подписи «${k}»`);
  }
  for (const k of ["tab_sum", "tab_req", "tab_cl", "tab_cal", "tab_log", "st_0", "st_1", "st_2", "st_3", "st_4"]) if (!PANEL_UI[k]) throw new Error(`panel: нет подписи «${k}»`);
  if (/[А-Яа-яЁё]/.test(PANEL_JS + PANEL_CSS)) throw new Error("panel: кириллица в коде панели");
})();

function panelPage(l) {
  const t = T(l);
  const ui = Object.fromEntries(Object.entries(PANEL_UI).map(([k, v]) => [k, v[l === "ru" ? 0 : 1]]));
  const pd = {
    l, sum: l === "ru" ? "сум" : "so‘m", site: href(l, "site"), home: href(l), ui, mark: MARK, kinds: KINDS[l],
    rg: REGIMES.map((r) => ({ id: r.id, n: r[l][0], def: monthly(r.id, r.def) })),
  };
  return `${head(l, t("Панель Optimal Prime · демо", "Optimal Prime paneli · demo"), t("Панель Optimal Prime: заявки с сайта и расчёты тарифа, клиенты, сроки отчётов, история и роли. Демо-данные.", "Optimal Prime paneli: saytdan arizalar va tarif hisoblari, mijozlar, hisobot muddatlari, tarix va rollar. Demo ma’lumotlar."))}
<style>${CSS}${PANEL_CSS}</style>
</head>
<body class="pn">
<div id="app"></div>
<footer class="pn-foot">${t("Макет DevUz Studio, демо-данные. Пользуясь макетом, вы принимаете", "DevUz Studio maketi, demo ma’lumotlar. Maketdan foydalanib, siz")} <a href="${TERMS(l)}" target="_blank" rel="noopener">${t("условия макета", "maket shartlarini qabul qilasiz")}</a>${t(".", "")}</footer>
<script type="application/json" id="pn-data">${JSON.stringify(pd).replace(/</g, "\\u003c")}</script>
<script>
${PANEL_JS}</script>
</body>
</html>`;
}

const out = {};
for (const l of LANGS) {
  out[KEY[l]] = landPage(l);
  out[(KEY[l] ? KEY[l] + "/" : "") + "site"] = sitePage(l);
  out[(KEY[l] ? KEY[l] + "/" : "") + "panel"] = panelPage(l);
}
for (const [k, v] of Object.entries(out)) {
  const lang = k.startsWith("uz") ? "uz" : "ru";
  if (lang === "uz") {
    const vis = v.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style>[\s\S]*?<\/style>/g, "");
    const m = vis.match(/[^\s<>"]*[А-Яа-яЁё][^\s<>"]*/g);
    if (m) throw new Error(`${k}: кириллица на узбекской странице: ${[...new Set(m)].slice(0, 12).join(" ")}`);
    const js = (v.match(/<script type="application\/json"[\s\S]*?<\/script>/g) || []).join("");
    const mj = js.match(/[^\s<>"]*[А-Яа-яЁё][^\s<>"]*/g);
    if (mj) throw new Error(`${k}: кириллица в данных узбекской страницы: ${[...new Set(mj)].slice(0, 12).join(" ")}`);
  }
  if (/[\u2014\u2013]/.test(v.replace(/<script[\s\S]*?<\/script>/g, ""))) throw new Error(`${k}: длинное тире на странице`);
}
mkdirSync(DIR + "out", { recursive: true });
writeFileSync(DIR + "out/pages.json", JSON.stringify(out));

/* Сборка для сервера (lib/proto/bundles): стили и скрипты один раз. */
const parts = { J: `<script>\n${JS}</script>`, C: `<style>${CSS}</style>`, PJ: `<script>\n${PANEL_JS}</script>`, LJ: `<script>\n${LAND_JS}</script>` };
const pages = {};
for (const [key, html] of Object.entries(out)) {
  let p = html;
  for (const [name, part] of Object.entries(parts)) p = p.split(part).join(`@@${name}@@`);
  pages[key] = p;
}
const bundleDir = new URL("../../../content/proto-bundles/", import.meta.url).pathname;
mkdirSync(bundleDir, { recursive: true });
writeFileSync(bundleDir + "optimalprime.json", JSON.stringify({ parts, pages }));
for (const [k, v] of Object.entries(out)) console.log((k || "(ru)").padEnd(10), v.length);
