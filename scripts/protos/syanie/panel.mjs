import * as D from "./data.mjs";
import { ADDONS } from "./plan.mjs";

/*
 * Панель клиники «Сияние Севера» (`panel`): то, что клиника получает с допом
 * «Админка: запись и напоминания через Telegram» и «Связь с amoCRM».
 * По эталону greenwell: сводка, заявки с сайта первой строкой и статус,
 * который видит пациент на сайте; расписание двух врачей; напоминания в
 * Telegram; чаты сайта; amoCRM через их REST API v4 (сделка с контактом
 * одним запросом leads/complex, обратно вебхук смены этапа); история
 * действий; роли «Главный врач» и «Администратор» (администратор денег не
 * видит). Общее состояние с сайтом и чатом — store.js (window.SY). Цифры
 * демо из одного зерна в panel.js. Модель панель не вызывает, в amoCRM из
 * макета ничего не уходит.
 */

const FONTS = "https://fonts.googleapis.com/css2?family=Noto+Serif+Display:ital,wght@0,400;1,400&family=Geologica:wght@400;700&display=swap";
const BASEP = "__PROTO_BASE__";

/* Значки панели: свои, чтобы не зависеть от набора сайта. */
const S = 'fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"';
const I = {
  home: `<path d="M4 11.5 12 5l8 6.5V20h-5v-5h-6v5H4z" ${S}/>`,
  inbox: `<path d="M4 13.5 6.5 5h11l2.5 8.5V19H4z" ${S}/><path d="M4 13.5h4.5l1 2h5l1-2H20" ${S}/>`,
  cal: `<rect x="4" y="5.5" width="16" height="14.5" rx="2.5" ${S}/><path d="M4 10h16M9 3.5v4M15 3.5v4" ${S}/>`,
  bell: `<path d="M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 2H5z" ${S}/><path d="M10 20.5a2.2 2.2 0 0 0 4 0" ${S}/>`,
  chat: `<path d="M4 5.5h16v11H9l-5 3.5z" ${S}/><path d="M8 10h8M8 13h5" ${S}/>`,
  link: `<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" ${S}/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" ${S}/>`,
  list: `<path d="M9 6.5h11M9 12h11M9 17.5h11" ${S}/><circle cx="5" cy="6.5" r="1" ${S}/><circle cx="5" cy="12" r="1" ${S}/><circle cx="5" cy="17.5" r="1" ${S}/>`,
  more: `<circle cx="6" cy="12" r="1.3" ${S}/><circle cx="12" cy="12" r="1.3" ${S}/><circle cx="18" cy="12" r="1.3" ${S}/>`,
  back: `<path d="M19 12H5M11 6l-6 6 6 6" ${S}/>`,
  out: `<path d="M14 4.5h5.5V10M19.5 4.5 11 13M17 14v5.5H4.5V7H10" ${S}/>`,
  check: `<path d="m5 12.5 4.5 4.5L19 7.5" ${S}/>`,
  x: `<path d="M6 6l12 12M18 6 6 18" ${S}/>`,
  send: `<path d="M20 4 3.5 11l6 2.5 2.5 6z" ${S}/><path d="m9.5 13.5 4-4" ${S}/>`,
  phone: `<path d="M5 4.5h3.5l1.5 4-2 1.3a10 10 0 0 0 6.2 6.2l1.3-2 4 1.5V19a1.5 1.5 0 0 1-1.6 1.5A15.5 15.5 0 0 1 3.5 6.1 1.5 1.5 0 0 1 5 4.5z" ${S}/>`,
  sync: `<path d="M4.5 12a7.5 7.5 0 0 1 13-5.1L20 9.5M20 4.5v5h-5M19.5 12a7.5 7.5 0 0 1-13 5.1L4 14.5M4 19.5v-5h5" ${S}/>`,
  user: `<circle cx="12" cy="8.5" r="3.8" ${S}/><path d="M4.5 20c1.3-3.8 4-5.6 7.5-5.6s6.2 1.8 7.5 5.6" ${S}/>`,
  spark: `<path d="M12 3.5c.8 4.2 2.3 5.7 6.5 6.5-4.2.8-5.7 2.3-6.5 6.5-.8-4.2-2.3-5.7-6.5-6.5 4.2-.8 5.7-2.3 6.5-6.5z" ${S}/>`,
  warn: `<path d="M12 4 21 19.5H3z" ${S}/><path d="M12 10v4.5M12 17.2v.3" ${S}/>`,
};
const sprite = () => `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>${Object.entries(I)
  .map(([k, v]) => `<symbol id="p-${k}" viewBox="0 0 24 24" stroke="currentColor">${v}</symbol>`)
  .join("")}</defs></svg>`;
const pic = (k) => `<svg class="ic" aria-hidden="true"><use href="#p-${k}"/></svg>`;

/* Разделы: адрес (#…), подпись, значок. На телефоне внизу первые четыре и «Ещё». */
const TABS = [
  ["svodka", "Сводка", "home"],
  ["zayavki", "Заявки", "inbox"],
  ["raspisanie", "Расписание", "cal"],
  ["amo", "amoCRM", "link"],
  ["chaty", "Чаты", "chat"],
  ["napominaniya", "Напоминания", "bell"],
  ["istoriya", "История", "list"],
];

function panelData(B) {
  const admin = ADDONS.find((a) => a.id === "admin"), crm = ADDONS.find((a) => a.id === "crm");
  return {
    brand: { name: B.name, phone: B.phone, addr: B.addr, street: B.street, open: B.open, close: B.close, hours: B.hours, site: B.site },
    /* Подпись в расписании: главному врачу — «Главный врач, стоматолог-ортопед», остальным — последняя часть («хирург-имплантолог»). */
    doctors: D.DOCTORS.map((d) => { const r = d.role.split(", "); return { id: d.id, name: d.name, short: d.short, role: /^Главный врач/.test(d.role) ? r.slice(0, 2).join(", ") : r[r.length - 1] }; }),
    prices: D.PRICES.map((p) => ({ id: p.id, t: p.t, price: p.price })),
    addons: { admin: admin && admin.price, crm: crm && crm.price },
  };
}

function panelPage({ B, IMG, TERMS, json, logo }) {
  const tabs = (cls) => TABS.map(([id, t, k]) => `<a class="${cls}" href="#${id}" data-tab="${id}">${pic(k)}<span>${t}</span><b class="nb" data-nb="${id}" hidden></b></a>`).join("");
  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Панель клиники · «${B.name}» · макет DevUz Studio</title>
<meta name="description" content="Панель клиники «${B.name}»: заявки с сайта, расписание врачей, напоминания пациентам в Telegram, чаты и связь с amoCRM. Демо-версия.">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="#0d0e0f">
<link rel="icon" type="image/png" sizes="192x192" href="${IMG}/icon-192.png">
<link rel="apple-touch-icon" href="${IMG}/apple-180.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
@@PS@@
</head>
<body class="pn">
${sprite()}
<a class="skip" href="#pn-main">К содержанию</a>
<header class="pn-top">
<a class="pn-logo" href="${BASEP}" aria-label="Сайт клиники «${B.name}»">${logo()}</a>
<span class="pn-name">Панель клиники</span>
<span class="demo" title="Все цифры и пациенты в панели придуманы для показа">демо-данные</span>
<div class="role" role="radiogroup" aria-label="Кто смотрит">
<button type="button" role="radio" data-role="owner" aria-checked="true">Главный врач</button><button type="button" role="radio" data-role="admin" aria-checked="false">Администратор</button>
</div>
<a class="pn-site" href="${BASEP}">${pic("out")}<span>Сайт клиники</span></a>
</header>
<nav class="side" aria-label="Разделы панели">${tabs("tab")}</nav>
<main class="pn-main" id="pn-main" tabindex="-1"><div id="view" aria-live="polite"></div>
<footer class="pn-foot"><span>Это макет панели для «${B.name}». Пациенты, телефоны и цифры придуманы для показа, цены клиники с её сайта.</span><a href="${TERMS}">Условия использования макета</a><a href="https://devuz.studio">DevUz Studio</a></footer>
</main>
<nav class="dock" aria-label="Разделы панели">${TABS.slice(0, 4).map(([id, t, k]) => `<a class="dk" href="#${id}" data-tab="${id}">${pic(k)}<span>${t}</span><b class="nb" data-nb="${id}" hidden></b></a>`).join("")}<button type="button" class="dk" id="dk-more" aria-expanded="false" aria-controls="more">${pic("more")}<span>Ещё</span><b class="nb" data-nb="more" hidden></b></button></nav>
<div class="more" id="more" hidden><div class="more-in" role="menu" aria-label="Ещё разделы">${TABS.slice(4).map(([id, t, k]) => `<a class="mi" role="menuitem" href="#${id}" data-tab="${id}">${pic(k)}<span>${t}</span><b class="nb" data-nb="${id}" hidden></b></a>`).join("")}</div></div>
<div class="toast" id="toast" role="status" aria-live="polite" hidden></div>
<script type="application/json" id="sy-panel">${json(panelData(B))}</script>
@@PJ@@
</body>
</html>`;
}

export function pages(ctx) {
  return { panel: panelPage(ctx) };
}

export function parts({ read, min, strip }) {
  /* Цвета и шрифты — те же токены, что у сайта: берём блок :root из site.css,
     чтобы смена палитры сайта сразу была и в панели. */
  const root = (read("site.css").match(/:root\{[\s\S]*?\}/) || [""])[0];
  return {
    PS: `<style>${min(root + "\n" + read("panel.css"))}</style>`,
    PJ: `<script>\n${strip(read("store.js") + read("panel.js"))}</script>`,
  };
}
