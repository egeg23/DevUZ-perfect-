// Презентация студии «Мы можем всё»: с ней менеджер выходит к любой компании.
//
//   node --import ./tests/alias-hook.mjs --import ./tests/tsx-hook.mjs kp/studio-deck/img.mjs    → img/
//   node --import ./tests/alias-hook.mjs --import ./tests/tsx-hook.mjs kp/studio-deck/build.mjs  → studio-ru.html
//   node kp/studio-deck/pdf.mjs                                                                   → kp/studio-ru.pdf
//
// Владелец, 05.11.2026: «Сделай кп с топовыми компаниями, которым мы делали
// сайты (макеты). Там и Озон аптека, и samauto и Baldinini. Короче сделай в
// красивой стиле нашего дашборда (такие же цвета). Где в 3д, было / стало,
// короче все что может наша студия. А можем мы все, вон, свою операционную
// систему делаем».
//
// Числа не пишутся руками: бренды — content/clients.ts, кейсы и их цифры —
// content/cases.ts, языки сайта — lib/i18n.ts, цены «от» — content/services.ts,
// лесенка — LADDER (lib/admin/mockup-offer.ts), DevUz Box — content/box.ts и
// content/box-copy.ts, контакты — content/company.ts. Сменилось там —
// пересобрать, и презентация не разойдётся с сайтом.
//
// Честно: большинство работ здесь — макеты, собранные под компанию, а не
// запущенные сайты, и подписаны «макет для …». Результатов бизнеса клиентов
// нет: их у нас нет. DevUz Box — план на октябрь 2027 без цен, без названий
// чипов, моделей ИИ и систем внутри (правило промо-страницы /box). Текст без
// длинных тире и штампов ИИ, как в макетах.
import { readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { clientRows, logoBox } from "../../content/clients.ts";
import { cases } from "../../content/cases.ts";
import { services } from "../../content/services.ts";
import { company } from "../../content/company.ts";
import { BOX_NAME, BOX_OS, BOX_LAUNCH, named, boxLayerCount } from "../../content/box.ts";
import { boxCopy } from "../../content/box-copy.ts";
import { locales } from "../../lib/i18n.ts";
import { LADDER } from "../../lib/admin/mockup-offer.ts";

const DIR = path.dirname(new URL(import.meta.url).pathname);
const ROOT = path.resolve(DIR, "../..");
const box = boxCopy.ru;

/* ─── Факты из репозитория ─── */
const brands = clientRows.flat();
const work = cases.filter((c) => !c.demo);
const demos = cases.length - work.length;
const bundles = readdirSync(path.join(ROOT, "content/proto-bundles")).filter((f) => f.endsWith(".json")).length;
const caseOf = (slug) => {
  const c = cases.find((x) => x.slug === slug);
  if (!c) throw new Error(`нет кейса ${slug}`);
  return c;
};
const metric = (slug, i) => caseOf(slug).metrics[i].value;
const samFrames = metric("samauto", 0); // «680 кадров сцены по прокрутке»
const mainPhone = company.phones[0];

const MONTHS_FULL = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
const MONTHS = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
const byMonth = new Map();
for (const c of work) byMonth.set(c.date.slice(0, 7), (byMonth.get(c.date.slice(0, 7)) ?? 0) + 1);
const months = [...byMonth.keys()].sort();
const span = []; // все месяцы подряд, от первой работы до последней, пустые тоже
let [y, m] = months[0].split("-").map(Number);
const [ey, em] = months.at(-1).split("-").map(Number);
while (y < ey || (y === ey && m <= em)) {
  span.push(`${y}-${String(m).padStart(2, "0")}`);
  if (++m > 12) [m, y] = [1, y + 1];
}
const peak = Math.max(...span.map((k) => byMonth.get(k) ?? 0));

/** Русское число: 1 бренд, 2 бренда, 5 брендов. */
const pl = (n, one, few, many) => {
  const a = Math.abs(n) % 100, b = a % 10;
  return a > 10 && a < 20 ? many : b === 1 ? one : b >= 2 && b <= 4 ? few : many;
};
const nb = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const usd = (n) => `${nb(n)} $`;
const weeks = (a, b) => {
  const n = b % 100;
  const w = n % 10 === 1 && n !== 11 ? "неделя" : n % 10 >= 2 && n % 10 <= 4 && (n < 12 || n > 14) ? "недели" : "недель";
  return `${a}-${b} ${w}`;
};
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

/* ─── Значки (как у полосы панели) ─── */
const ICONS = {
  home: '<path d="M3.5 10.5 12 3.5l8.5 7V20a1 1 0 0 1-1 1H15v-6H9v6H4.5a1 1 0 0 1-1-1z"/>',
  grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.6"/>',
  monitor: '<rect x="2.5" y="4" width="19" height="12.5" rx="2"/><path d="M8.5 20.5h7M12 16.5v4"/>',
  cube: '<path d="M12 2.8 20.2 7.3v9.4L12 21.2l-8.2-4.5V7.3z"/><path d="M3.8 7.3 12 11.8l8.2-4.5M12 11.8v9.4"/>',
  spark: '<path d="M12 3.2l1.9 5.1 5.1 1.9-5.1 1.9L12 17.2l-1.9-5.1L5 10.2l5.1-1.9z"/><path d="M18.5 15.2l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
  cpu: '<rect x="6" y="6" width="12" height="12" rx="2.2"/><rect x="9.6" y="9.6" width="4.8" height="4.8" rx="1"/><path d="M9.5 2.5V6M14.5 2.5V6M9.5 18v3.5M14.5 18v3.5M2.5 9.5H6M2.5 14.5H6M18 9.5h3.5M18 14.5h3.5"/>',
  tag: '<path d="M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7l8.3 8.3-8.7 8.7z"/><circle cx="8" cy="8" r="1.6"/>',
  send: '<path d="M21 3 10.2 13.8"/><path d="M21 3 14.6 21l-4.4-7.2L3 9.4z"/>',
  bot: '<rect x="4" y="7.5" width="16" height="12" rx="3"/><path d="M12 3.5v4M8.8 13h.01M15.2 13h.01M9.5 16.5h5"/>',
  shield: '<path d="M12 3 19.5 6v5.6c0 4.4-3.1 7.9-7.5 9.4-4.4-1.5-7.5-5-7.5-9.4V6z"/><path d="m8.8 12.2 2.2 2.2 4.3-4.6"/>',
  users: '<circle cx="9" cy="8.5" r="3.3"/><path d="M3.5 19.5c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5"/><circle cx="17" cy="9.5" r="2.5"/><path d="M16.2 14.6c2.3.2 3.9 1.8 4.3 4.4"/>',
  cart: '<path d="M3 4h2.2l2.3 11h10.8l2-7.5H6.4"/><circle cx="9.5" cy="19.3" r="1.4"/><circle cx="17" cy="19.3" r="1.4"/>',
  doc: '<path d="M6 2.8h8.2L19 7.6V20a1.2 1.2 0 0 1-1.2 1.2H6A1.2 1.2 0 0 1 4.8 20V4A1.2 1.2 0 0 1 6 2.8z"/><path d="M14 2.8V8h5M8.3 12.5h7.4M8.3 16.2h5"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
  arrow: '<path d="M4.5 12h14.5M13.5 6l6 6-6 6"/>',
  wallet: '<rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 9.5h18M16 14.2h2"/>',
  globe: '<circle cx="12" cy="12" r="8.8"/><path d="M3.2 12h17.6M12 3.2c2.4 2.5 3.6 5.4 3.6 8.8s-1.2 6.3-3.6 8.8c-2.4-2.5-3.6-5.4-3.6-8.8S9.6 5.7 12 3.2z"/>',
  phone: '<path d="M6.6 3.5h2.8l1.4 4.2-2 1.4a11.5 11.5 0 0 0 6.1 6.1l1.4-2 4.2 1.4v2.8a1.6 1.6 0 0 1-1.7 1.6C11.5 18.5 5.5 12.5 5 5.2a1.6 1.6 0 0 1 1.6-1.7z"/>',
};
const ic = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><use href="#i-${n}"/></svg>`;
let logoN = 0;
/** Знак DevUz (public/brand/logo-square-alpha.svg) целиком: у каждой копии свои id, иначе маска и градиент теряются. */
const mark = (cls = "") => {
  const n = ++logoN;
  return `<svg class="${cls}" viewBox="-120 -120 240 240"><defs><linearGradient id="dzg${n}" x1="0" y1="-1" x2="1" y2="1"><stop offset="0" stop-color="#5B9BFF"/><stop offset="55%" stop-color="#3B82F6"/><stop offset="100%" stop-color="#22F0A0"/></linearGradient><mask id="dzm${n}"><rect x="-120" y="-120" width="240" height="240" fill="#fff"/><path d="M-22 -34 L-58 0 L-22 34" stroke="#000" stroke-width="15" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 -34 L58 0 L22 34" stroke="#000" stroke-width="15" fill="none" stroke-linecap="round" stroke-linejoin="round"/></mask></defs><path d="M0 -100 L29.29 -70.71 L70.71 -70.71 L70.71 -29.29 L100 0 L70.71 29.29 L70.71 70.71 L29.29 70.71 L0 100 L-29.29 70.71 L-70.71 70.71 L-70.71 29.29 L-100 0 L-70.71 -29.29 L-70.71 -70.71 L-29.29 -70.71 Z" fill="url(#dzg${n})" mask="url(#dzm${n})"/><rect x="-5" y="-27" width="10" height="54" rx="5" fill="#E8B14C"/></svg>`;
};
const DEFS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
${Object.entries(ICONS).map(([k, v]) => `<symbol id="i-${k}" viewBox="0 0 24 24">${v}</symbol>`).join("\n")}
</defs></svg>`;

/* ─── Каркас слайда: полоса значков, подвал ─── */
const CHAPTERS = [
  ["home", "home", "Старт"],
  ["brands", "grid", "Бренды"],
  ["cases", "monitor", "Кейсы"],
  ["motion", "cube", "3D"],
  ["ai", "spark", "ИИ"],
  ["os", "cpu", "Своя ОС"],
  ["price", "tag", "Цены"],
  ["start", "send", "Связь"],
];
const rail = (on) =>
  `<nav class="rail">${mark("mark")}${CHAPTERS.map(
    ([k, i, t]) => `<a class="${k === on ? "on" : ""}">${ic(i)}<span>${t}</span></a>`,
  ).join("")}<div class="gap"></div><span class="dots">···</span></nav>`;

const S = [];
const slide = (cls, chapter, body) => S.push({ cls, chapter, body });
const kick = (t, tone = "") => `<p class="kick ${tone}"><i></i>${t}</p>`;
const li = (a, cls = "") => `<ul class="pts ${cls}">${a.map((x) => `<li>${x}</li>`).join("")}</ul>`;
const img = (n, alt = "") => `<img src="img/${n}" alt="${esc(alt)}">`;
const win = (n, { cls = "", addr = "", alt = "" } = {}) =>
  `<figure class="win ${cls}"><div class="bar"><i></i><i></i><i></i>${addr ? `<span>${addr}</span>` : ""}</div>${img(n, alt)}</figure>`;
const phone = (n, cls = "", alt = "") => `<figure class="phone ${cls}"><div class="clip">${img(n, alt)}</div></figure>`;
const tag = (t, cls = "") => `<p class="tag ${cls}"><i></i>${t}</p>`;
const st = (b, s, cls = "") => `<div class="st ${cls}"><b>${b}</b><span>${s}</span></div>`;

/* 1. Обложка */
slide("cover", "home", `
<div class="bg"></div><div class="fade"></div>
<div class="brand">${mark()}<b>DevUz <em>Studio</em></b></div>
${kick(`Студия из Ташкента · с ${company.foundedYear} года`)}
<h1>Мы можем<br><em>всё.</em></h1>
<p class="lead">Сайты, магазины, 3D-сцены, ИИ-сотрудники, боты, приложения и админки. И свою операционную систему.</p>
<div class="stats">
  ${st(brands.length, `${pl(brands.length, "бренд", "бренда", "брендов")} в «Делали для»`)}
  ${st(work.length, `${pl(work.length, "работа", "работы", "работ")} в кейсах на devuz.studio`)}
  ${st(`12<small>часов</small>`, "на бесплатный макет главной", "hi")}
</div>
${tag("На фоне: макет для SamAuto, машина разбирается по прокрутке", "abs cap")}`);

/* 2. Делали для */
const logoTiles = brands
  .map((c) => {
    const { width } = logoBox(c.ratio);
    return `<div class="lg"><img src="img/logo-${c.slug}.png" alt="${esc(c.name)}" style="width:${Math.round(Math.min(width * 0.86, 172))}px"></div>`;
  })
  .join("");
slide("brands", "brands", `
${kick("Делали для")}
<h2>${brands.length} ${pl(brands.length, "бренд", "бренда", "брендов")}, для которых мы сделали сайт, макет или&nbsp;прототип</h2>
<p class="lead" style="max-width:900px">Макет тоже работа: каждый собран под компанию, на её материалах и данных.</p>
<div class="logos">${logoTiles}<div class="lg you">Следующим может быть ваш</div></div>`);

/* 3. Цифры */
const bars = span
  .map((k) => {
    const v = byMonth.get(k) ?? 0;
    return `<div class="bar ${v === peak ? "top" : ""}"><b>${v}</b><i style="height:${Math.max(3, Math.round((v / peak) * 100))}%"></i></div>`;
  })
  .join("");
const mons = span.map((k) => `<span>${MONTHS[Number(k.slice(5)) - 1]}</span>`).join("");
slide("numbers", "brands", `
${kick("В цифрах")}
<h2>Что уже сделано: только то, что можно проверить</h2>
<div class="nums">
  <div class="grid">
    ${st(brands.length, `${pl(brands.length, "бренд", "бренда", "брендов")} в блоке «Делали для» на сайте`)}
    ${st(work.length, `${pl(work.length, "работа", "работы", "работ")} в кейсах на devuz.studio, плюс ${demos} ${pl(demos, "своё демо", "своих демо", "своих демо")}`)}
    ${st(bundles, `${pl(bundles, "макет собран", "макета собраны", "макетов собраны")} вручную, каждый своим кодом`)}
    ${st(samFrames, "кадров в одной сцене по прокрутке у SamAuto")}
    ${st(locales.length, `${pl(locales.length, "язык", "языка", "языков")} на сайте студии`)}
    ${st(`12<small>ч</small>`, "на бесплатный макет главной", "hi")}
  </div>
  <div class="g chart">
    <div class="hd"><h3>Работы в кейсах по месяцам</h3><span class="pill new">${span[0].slice(0, 4)}</span></div>
    <div class="bars">${bars}</div>
    <div class="mon">${mons}</div>
    <p class="small src">По дате работы в кейсах на devuz.studio, без демо. ${MONTHS_FULL[Number(span.at(-1).slice(5)) - 1]}: ${byMonth.get(span.at(-1))} ${pl(byMonth.get(span.at(-1)), "работа", "работы", "работ")} за месяц.</p>
  </div>
</div>`);

/* 4. SamAuto */
const sam = caseOf("samauto");
slide("sam", "cases", `
<div class="split">
  <div class="txt">
    ${kick("Прототип для SamAuto")}
    <h2>Пикап разбирается на детали прямо по прокрутке</h2>
    <p class="lead">Главная для Самаркандского завода ISUZU и SAZ. С D-MAX слетает покрывало, машина разлетается на детали и собирается, загорается фара, и пикап уезжает в пустыню.</p>
    <div class="minis">
      ${sam.metrics.map((m) => st(m.value, m.label.ru)).join("")}
    </div>
    <div style="margin-top:24px">${li(
      [
        "Телефону своя вертикальная сцена, без прокрутки вбок",
        "Стенд 360°: машину крутят пальцем, цвет и диски меняются плавно",
        "Модели и цифры только с их сайта и открытого API",
        "Кадры и видео лежат только в зашифрованном виде",
      ],
      "sm",
    )}</div>
  </div>
  <div class="pic">
    ${win("sam-hero.jpg", { addr: "devuz.studio/proto · SamAuto", alt: "Первый экран макета SamAuto: D-MAX под покрывалом" })}
    ${phone("sam-m.jpg", "", "Сцена SamAuto на телефоне")}
    ${tag("Открыт без пароля: ролик сцены стоит на главной devuz.studio", "abs t1")}
  </div>
</div>`);

/* 5. SamAuto: кадр за кадром */
const FILM = [
  ["1", "Покрывало слетает"],
  ["2", "D-MAX на подиуме"],
  ["3", "Разлёт на детали"],
  ["4", "Загорается фара"],
  ["5", "Выезд в пустыню"],
  ["6", "Вся техника завода"],
];
slide("sam2", "cases", `
${kick("SamAuto · первый экран")}
<h2>Кадр за кадром: что видит человек, пока листает</h2>
<div class="prog"><div class="ln"><i></i></div>${[0, 20, 40, 60, 80, 100].map((p) => `<span class="${p === 100 ? "end" : ""}" style="left:${p === 0 ? 2 : p === 100 ? 98 : p}%">${p}%</span>`).join("")}</div>
<div class="film">${FILM.map(([n, t]) => `<figure>${img(`sam-f${n}.jpg`, t)}<figcaption><b>0${n}</b>${t}</figcaption></figure>`).join("")}</div>`);

/* 6. Baldinini */
slide("bald", "cases", `
<div class="split">
  <div class="txt">
    ${kick("Макет для Baldinini Tashkent")}
    <h2>Итальянский бутик теперь и&nbsp;в&nbsp;телефоне</h2>
    <p class="lead">Своего сайта у бутика в Tashkent City Mall нет: цену, размер и наличие спрашивают в переписке. Макет: магазин на трёх языках и панель бутика.</p>
    <div style="margin-top:26px">${li([
      `<b>${metric("baldinini", 0)} ${pl(Number(metric("baldinini", 0)), "модель", "модели", "моделей")}</b> из официального каталога FW26/27`,
      "Подсказка размера по таблице бренда и бронь примерки в бутике",
      "Оформление в один экран: Click, Payme, Uzum или картой",
      "Заказ приходит в панель первой строкой, остатки по размерам сразу видны на сайте",
      "Продавец не видит себестоимость и прибыль",
    ])}</div>
  </div>
  <div class="pic">
    ${win("bald-hero.jpg", { cls: "w1", addr: "Baldinini · магазин", alt: "Магазин Baldinini: первый экран" })}
    ${win("bald-panel.jpg", { cls: "w2", addr: "Baldinini · панель бутика", alt: "Панель бутика: сводка денег" })}
    ${phone("bald-m.jpg", "", "Карточка товара на телефоне")}
  </div>
</div>`);

/* 7. Oson Apteka */
const FLY = [
  ["0", "Знак бренда"],
  ["40", "Камера летит"],
  ["75", "Над городом"],
  ["100", "Каждая метка: аптека"],
];
slide("oson", "cases", `
${kick("Макет для Oson Apteka")}
<h2>Камера влетает в знак и выходит над городом аптек</h2>
<div class="fly">${FLY.map(([f, t], i) => `<figure>${img(`oson-fly-${f}.jpg`, t)}<figcaption><span class="pill ${i === 3 ? "new" : "done"}" style="background:rgb(8 12 19 / .85)">${f}% · ${t}</span></figcaption></figure>`).join("")}</div>
<div class="low">
  <div>${li([
    "Справочник лекарств и аптек Узбекистана: покупателю бесплатно, платят аптеки",
    "Поиск по названию и действующему веществу, аналоги рядом",
    "Бронь в аптеке и бот в Telegram, где бронь в один шаг",
    "Свой раздел для аптек: подключение, тарифы, кабинет",
    "Панель броней: статус сразу виден покупателю",
  ])}</div>
  <div class="pic">
    ${win("oson-drug.jpg", { addr: "Oson Apteka · лекарство и аптеки рядом", alt: "Окно лекарства" })}
    ${phone("oson-bot-m.jpg", "p1", "Бот с бронью")}
    ${phone("oson-mine-m.jpg", "p2", "Мои брони")}
  </div>
</div>`);

/* 8. SIA */
const sia = caseOf("sia");
slide("sia", "cases", `
<div class="split">
  <div class="txt">
    ${kick("Макет для архбюро SIA, Москва")}
    <h2>Каждый проект сначала чертёж, а потом рендер</h2>
    <p class="lead">Всё на макете с сайта бюро: ${sia.metrics[0].value} проектов архива с их кодами, услуги, коллектив, выставки.</p>
    <div style="margin-top:26px">${li([
      "Знак SIA из стальных ферм собирается в каркас дома",
      "Пролёт камерой по вилле и сквозь стекло в интерьер",
      "Промо-ролик бюро: смотреть можно, скачать с сайта нельзя",
      "Панель, где бюро ведёт сайт само, стоит на нашем сервере",
    ])}</div>
  </div>
  <div class="pic">
    ${win("sia-bfl.jpg", { cls: "w1", addr: "SIA · пролёт по вилле", alt: "Пролёт камерой: интерьер виллы" })}
    ${win("sia-pp.jpg", { cls: "w2", addr: "SIA · проект", alt: "Чертёж становится рендером" })}
    ${tag("Чертёж стирается в рендер по прокрутке", "abs t2")}
  </div>
</div>`);

/* 9. Сияние Севера */
slide("sy", "cases", `
<div class="split">
  <div class="txt">
    ${kick("Клиника «Сияние Севера», Томск")}
    <h2>Сайт клиники и все мессенджеры в одном окне</h2>
    <p class="lead">Главная услуга: все зубы на шести имплантатах. По прокрутке видно, как встают опоры и садится протез, а записаться можно в два нажатия.</p>
    <p class="small" style="margin:22px 0 10px;color:var(--muted)">«Сообщения» в админке клиники:</p>
    <div class="chips">${["Чат сайта", "Telegram", "Instagram", "WhatsApp", "ВКонтакте", "Авито", "MAX"].map((x) => `<span class="pill work">${x}</span>`).join("")}</div>
    <div style="margin-top:22px">${li(
      [
        "Ответ уходит в тот канал, откуда написал пациент",
        "Статус записи пациент видит у себя на сайте",
        "Цены, услуги, врачей и акции клиника правит сама",
        "Ключи amoCRM и мессенджеров главный врач вводит сам, в базе они зашифрованы",
      ],
      "sm",
    )}</div>
  </div>
  <div class="pic">
    ${win("sy-chat.jpg", { cls: "w1", addr: "Сияние Севера · чат сайта и Telegram администратора", alt: "Чат на сайте и то же сообщение в Telegram администратора" })}
    ${win("sy-panel.jpg", { cls: "w2", addr: "Админка клиники · заявки", alt: "Админка клиники: заявки" })}
    <div class="sts">${caseOf("syanie-severa").metrics.filter((_, i) => i !== 1).map((m) => st(m.value, m.label.ru)).join("")}</div>
  </div>
</div>`);

/* 10. Админки */
const soffice = caseOf("soffice");
slide("admins", "cases", `
${kick("Админки")}
<h2>Админка, где видно деньги, а не только заказы</h2>
<div class="adm">
  <div class="g card">${win("gw-panel.jpg", { addr: "Greenwell · сводка", alt: "Панель Greenwell" })}<h3>Greenwell <span class="pill new" style="vertical-align:3px;margin-left:6px">эталон</span></h3><p>Магазин биодобавок. Выручка, прибыль и маржа к прошлому периоду, рассрочка, скорость доставки, воронка, что заканчивается.</p></div>
  <div class="g card">${win("cargo-plan.jpg", { addr: "Логистика · распределение", alt: "Супер-админка для карго-компании" })}<h3>Логистика <span class="pill work" style="vertical-align:3px;margin-left:6px">супер-админка</span></h3><p>Макет для карго, без бренда клиента. Грузы сами ложатся по машинам по весу, объёму и кузову. Водители на карте, документы для брокера.</p></div>
  <div class="g card">${win("soffice-panel.jpg", { addr: "Soffice · сводка", alt: "Панель Soffice" })}<h3>Soffice</h3><p>${soffice.metrics[0].value} бизнес-центров. ${soffice.metrics[1].value} разделов панели: заявки, объекты, счета, договоры, отчёт владельцу. Статус блока арендатор видит сразу.</p></div>
</div>
<div class="always"><span>В каждой нашей админке:</span>${[
  "Заказ с сайта первой строкой",
  "Статус из панели клиент видит на сайте",
  "Роли: менеджер не видит прибыль",
  "История: кто, что и когда",
  "Цифры к прошлому периоду",
].map((x) => `<span class="pill done">${x}</span>`).join("")}</div>`);

/* 11. Было / стало: снимки до макета */
const to = `<div class="to">${ic("arrow")}</div>`;
const baRow = (name, what, before, beforeCap, after) => `
<div class="r">
  <div class="who"><h3>${name}</h3><p>${what}</p></div>
  <figure>${win(before, { addr: beforeCap.split(",")[0] })}<span class="pill done">Было</span><figcaption>${beforeCap}</figcaption></figure>
  ${to}
  <figure>${win(after, { addr: `макет DevUz для ${name}` })}<span class="pill new">Стало</span><figcaption>Макет DevUz Studio</figcaption></figure>
</div>`;
slide("ba1", "cases", `
${kick("Было / стало")}
<h2>Сайт компании до нас и наш макет</h2>
<div class="ba">
  ${baRow("Optimal Prime", "Бухгалтерский и HR-аутсорсинг с 2008 года. В макете: город с параллаксом, знак из девяти стеклянных плиток, «Рассчитать тариф» главной кнопкой.", "op-before.jpg", "optimal-prime.uz, снимок 3 ноября 2026", "op-after.jpg")}
  ${baRow("SAMIST AUTO", "Площадка техники: 14 машин в 7 разделах. В макете: сцена D-MAX с покрывалом и разлётом, площадка по разделам, вся техника с ценами.", "samist-before.jpg", "samist.autoline.uz, снимок 4 ноября 2026", "samist-after.jpg")}
</div>`);

/* 12. Было / стало: шторки кейсов */
const taken = (slug) => {
  const [y, m] = caseOf(slug).compare.taken.split("-");
  return `${["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"][Number(m) - 1]} ${y}`;
};
const CMP = [
  ["golden-house", "Golden House", "Застройщик, 7 жилых комплексов. Добавили движение, подбор квартиры и ипотеку."],
  ["namuna", "Namuna", "Мебельная фабрика. Было ни одной формы заявки, стал калькулятор на 8 типов мебели."],
  ["foodmaxx", "FOODMAXX", "Производитель консервов. Два варианта сайта на одних данных."],
  ["global-export", "Global Export", "Экспортёр сухофруктов и бобовых. Сайт на 4 языках со своей админкой."],
];
slide("ba2", "cases", `
${kick("Было / стало")}
<h2>Ещё четыре «до и после» из наших кейсов</h2>
<div class="ba4">${CMP.map(
  ([s, n, t]) => `<div class="c"><h3>${n}</h3><p>${t} Снимок «было»: ${caseOf(s).compare.site}, ${taken(s)}.</p>
  <div class="pair"><figure>${img(`cmp-${s}-b.jpg`, `${n}: было`)}<span class="pill done">Было</span></figure><figure>${img(`cmp-${s}-a.jpg`, `${n}: стало`)}<span class="pill new">Стало</span></figure></div></div>`,
).join("")}</div>`);

/* 13. 3D и движение */
const BENTO = [
  ["m-sam.jpg", `SamAuto · <b>${samFrames} кадров</b>: машина разлетается на детали`, "big"],
  ["m-oson.jpg", "Oson Apteka · залёт в знак"],
  ["m-sia.jpg", "SIA · пролёт по вилле"],
  ["m-sy.jpg", "Сияние Севера · имплантаты по прокрутке"],
  ["m-czech.jpg", "CZECHFARM · полёт над буквами знака"],
  ["m-op.jpg", "Optimal Prime · стеклянные плитки знака"],
  ["dz-glass.jpg", "Заставка DevUz · из наброска в телефон"],
  ["m-vt.jpg", "vTashkente · кухня собирается по прокрутке", "right"],
  ["box-cut.jpg", `${BOX_NAME} · разрез на ${boxLayerCount("pro")} слоёв`],
];
slide("motion", "motion", `
${kick("3D и движение")}
<h2>3D, пролёты камерой и сцены по прокрутке</h2>
<div class="bento">${BENTO.map(([f, t, cls = ""]) => `<figure class="${cls}">${img(f, t.replace(/<[^>]+>/g, ""))}<figcaption><span>${t}</span></figcaption></figure>`).join("")}</div>`);

/* 14. ИИ */
const AI = [
  ["bot", "ИИ-менеджер продаж", "Отвечает в Telegram, Instagram и на сайте по вашему прайсу, днём и ночью. Берёт телефон и передаёт заявку менеджеру.", "14 дней бесплатно"],
  ["shield", "Цены только из прайса", "Каждый ответ проверяется до отправки: числа, которого нет в прайсе, покупатель не увидит. Русский и узбекский.", ""],
  ["users", "ИИ-менеджер по блогерам", "Находит блогеров Узбекистана, оценивает аудиторию и готовит первое сообщение. Отправляете вы, в одно касание.", ""],
  ["cart", "Агенты для маркетплейсов", `${metric("seller-ai", 0)} агентов ведут карточки продавца: конкуренты, цены, отзывы, поставки, карточки, реклама.`, "Seller AI"],
  ["doc", "Ответы по документам", "Поиск по договорам и юридическим документам: ответ со ссылкой на конкретный пункт.", ""],
  ["mic", "Голосовое в текст", "Перешлите боту голосовое или аудиозапись: он пришлёт расшифровку. Так работает у нас самих.", ""],
];
slide("aislide", "ai", `
${kick("ИИ")}
<h2>ИИ-сотрудники, которые отвечают клиентам днём и&nbsp;ночью</h2>
<div class="ai">
  <div class="cards">${AI.map(
    ([i, h, p, pl], n) => `<div class="g card"><div class="ic ${n % 2 ? "b" : ""}">${ic(i)}</div><h3>${h}</h3><p>${p}</p>${pl ? `<span class="pill ${n === 0 ? "new" : "work"}">${pl}</span>` : ""}</div>`,
  ).join("")}</div>
  <div class="side">${phone("crm-m.jpg", "", "Переписка: первым пишет ИИ-сотрудник")}${tag("В нашей панели: первым пишет ИИ-сотрудник", "abs")}</div>
</div>`);

/* 15. Своя CRM */
slide("crmslide", "ai", `
<div class="crm">
  <div class="txt">
    ${kick("Для себя")}
    <h2>Свою CRM «DevUz Офис» тоже написали сами</h2>
    <p class="lead" style="font-size:19px">В ней студия работает каждый день. Такую же соберём под ваш отдел продаж.</p>
    <div style="margin-top:24px">${li(
      [
        "<b>«Входящие»:</b> все, кто ждёт ответа, одной очередью, ответ прямо из строки",
        "<b>«Ход сделки»:</b> семь ступеней от «написали» до «оплата» по фактам из базы",
        "<b>Подсказка ответа</b> на возражение: готовый текст, сам не уходит",
        "Задачи с историей, напоминания и бот в Telegram",
        "Приложение на телефоне с пуш-уведомлениями",
        "Три языка панели: русский, узбекский, польский",
      ],
      "sm",
    )}</div>
  </div>
  <div class="pic">
    ${win("crm-inbox.jpg", { addr: "DevUz Офис · Входящие", alt: "Входящие в панели DevUz Офис" })}
    ${tag("Имена клиентов на снимке скрыты", "abs")}
  </div>
</div>`);

/* 16. DevUz Box */
const launch = `${["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"][BOX_LAUNCH.month - 1]} ${BOX_LAUNCH.year}`;
slide("box", "os", `
<div class="badges" style="max-width:660px">${kick("Своя операционная система")}${kick(`Планируется к запуску: ${launch}`, "gold")}${kick(box.hero.plan, "blue")}</div>
<div style="max-width:640px">
  <h2>${BOX_NAME}: ИИ-офис в&nbsp;коробке</h2>
  <p class="lead">${named(box.hero.tagline.replace("ИИ-офис в коробке: свой", "Свой"))}</p>
  <p class="lead" style="margin-top:12px">Ответы клиентам, документы, видео для соцсетей, сайт или бот по описанию словами. Ядро работает внутри коробки.</p>
  <div class="models">${box.models.items.map((m) => `<span>${m.name}</span>`).join("")}</div>
  <p class="small" style="margin-top:12px">${box.models.items.length} ${pl(box.models.items.length, "модель", "модели", "моделей")} под размер офиса. ${box.models.price}.</p>
  <div class="safe">${box.safety.items.slice(0, 3).map((x) => `<div class="g"><b>${x.t}</b><span>${x.d}</span></div>`).join("")}</div>
</div>
<div class="cut">${img("box-cut.jpg", `${BOX_NAME} Про в разрезе`)}</div>
<div class="parts abs">${box.cut.layers.pro.map((l, i) => `<div><b>${i + 1}</b>${l.t}</div>`).join("")}<p class="small" style="margin-top:8px">${box.cut.concept}</p></div>
<div class="road">${box.roadmap.stages
  .map((s, i) => `<div class="s ${i === 0 ? "now" : i === box.roadmap.stages.length - 1 ? "end" : ""}"><div class="w">${i === 0 ? `${box.roadmap.now} · ` : ""}${s.when}</div><div class="t">${named(s.t)}</div></div>`)
  .join("")}</div>`);

/* 17. DevUz OS */
slide("osslide", "os", `
<div class="os">
  <div>
    ${kick(named(box.os.kicker), "blue")}
    <h2 style="font-size:38px">${box.os.title}</h2>
    <div class="pil">${box.os.pillars.map((p) => `<div class="g"><h3>${p.t}</h3><p>${p.d}</p></div>`).join("")}</div>
  </div>
  <div>
    <div class="scr">${["desktop", "studio", "inbox", "code"].map((k, i) => `<figure>${win(`os-${k}.jpg`, { addr: BOX_OS })}<figcaption><b>${box.os.screens[i].t}.</b> ${box.os.screens[i].d}</figcaption></figure>`).join("")}</div>
    <p class="small" style="margin-top:14px">${box.os.concept} ${box.hero.plan}.</p>
  </div>
</div>`);

/* 18. Услуги и цены. Названия — как на сайте, кроме одного: «LLM, RAG» клиенту
   ничего не говорит, на слайде то же словами покупателя. */
const TITLE = { "ai-llm-rag": "ИИ-ассистенты и агенты" };
// Лендинг стоит строкой ниже, от 500 $ (LADDER): в карточке «от 1 000 $» его не называем.
const TAGLINE = { "web-development": "Корпоративные сайты, порталы и каталоги" };
const ladder = [
  [LADDER.fixes.price, `исправим ${LADDER.fixes.count} ошибки на вашем сайте за ${LADDER.fixes.days} дня`],
  [LADDER.card.price, "сайт-визитка"],
  [LADDER.landing.price, "лендинг"],
  [LADDER.corporate.price, "корпоративный сайт"],
];
slide("price", "price", `
${kick("Цены")}
<h2>Сколько стоит: цены «от»</h2>
<div class="svc">${services
  .map((s) => `<div class="g card"><h3>${TITLE[s.slug] ?? s.title.ru}</h3><p>${TAGLINE[s.slug] ?? s.tagline.ru}</p><div></div><div class="pr"><b><small>от</small>${usd(s.priceFromUsd)}</b><span>${weeks(s.weeksFrom, s.weeksTo)}</span></div></div>`)
  .join("")}</div>
<div class="ladder">
  <div class="h"><b>Можно начать с малого</b><span>Оплата частями: половина при старте, половина после запуска</span></div>
  ${ladder.map(([p, t]) => `<div class="s"><b>${usd(p)}</b><span>${t}</span></div>`).join("")}
</div>
<p class="small" style="margin-top:14px">Точную смету и сроки даём после короткого брифа. Цены «от» те же, что на devuz.studio.</p>`);

/* 19. Как начать и контакты */
slide("end", "start", `
<div class="bg"></div><div class="fade"></div>
${kick("Как начать")}
<h2>Сначала макет, потом договор</h2>
<div class="steps">
  <div class="s"><b>1</b><h3>Бесплатный макет главной</h3><p>За 12 часов, на материалах вашей компании. Покажем по видео или вживую за 15 минут.</p></div>
  <div class="s"><b>2</b><h3>Состав и смета</h3><p>Что берёте из макета, то и в смете: у каждого допа своя цена.</p></div>
  <div class="s"><b>3</b><h3>Делаем по макету</h3><p>Сайт, панель, бот, приложение: всё, что выбрали.</p></div>
  <div class="s"><b>4</b><h3>Запуск</h3><p>Подключаем Telegram, оплату и CRM, учим команду.</p></div>
</div>
<div class="pay">${ic("wallet")}<span>Оплата частями: половина при старте, половина после запуска, когда всё работает.</span></div>
<div class="ct">
  <a class="main">${ic("send")}<span>t.me/${company.telegram}<small>Написать в Telegram</small></span></a>
  <a>${ic("globe")}<span>devuz.studio<small>Кейсы и макеты</small></span></a>
  <a>${ic("phone")}<span>${mainPhone.display}<small>${mainPhone.person.ru}, звонок и WhatsApp</small></span></a>
</div>`);

/* ─── Сборка ─── */
const total = S.length;
const html = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>DevUz Studio · мы можем всё</title>
<link rel="stylesheet" href="fonts.css"><link rel="stylesheet" href="deck.css"></head><body>${DEFS}
${S.map(
  (s, i) =>
    `<section class="slide ${s.cls}">${rail(s.chapter)}${s.body}<footer><b>DevUz Studio</b><span class="on"><i></i>devuz.studio</span><span>t.me/${company.telegram}</span><span class="n">${String(i + 1).padStart(2, "0")} <s>/ ${total}</s></span></footer></section>`,
).join("\n")}
</body></html>`;
writeFileSync(path.join(DIR, "studio-ru.html"), html);
console.log(`ok: studio-ru.html, слайдов ${total}`);
