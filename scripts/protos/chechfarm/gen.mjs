import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dzIntroSolo } from "../../../lib/proto/dz-video.mjs";
import { LANGS, PILLARS, CHAIN, PARTNER_STEPS, PRODUCT_FIELDS, IR_DOCS } from "./data.mjs";
import { PANEL_UI } from "./panel-ui.mjs";
import { makeBlocks, SCENE_FRAMES } from "./blocks.mjs";
import { makeLaunch } from "./launch.mjs";

/*
 * Макет корпоративного сайта CZECHFARM (фармацевтическая компания) по ТЗ
 * заказчика, 26.10.2026. Семь страниц на трёх языках (ru главный, uz
 * латиницей, en: у компании международные производители и инвесторы) и
 * панель по эталону greenwell.
 *
 *   главная:   видео DevUz → Health. Trust. Value. на стеклянном кадре →
 *              миссия (слова загораются по прокрутке) → формула бренда →
 *              живая цепочка стоимости (импульс по семи узлам) →
 *              аудитории → устройство портфеля → обращение;
 *   about:     миссия, принципы, модель стоимости, факты и команда как
 *              устройство блоков (данные даёт компания);
 *   products:  каталог: поиск, карточка, страница продукта; продукты
 *              появляются из панели, без перечня — устройство;
 *   partners:  роль локального партнёра, шаги сотрудничества, форма;
 *   investors: позиционирование, цепочка, материалы, запрос;
 *   news:      список и страница новости из панели;
 *   contacts:  контакты (после согласования), форма, мои обращения, карта.
 *
 * Факты — только из ТЗ (data.mjs). Сайт и панель связаны памятью браузера:
 * обращения пишет сайт, новости, продукты, статусы и заголовки — панель.
 * Модель макет не вызывает.
 */

const DIR = new URL(".", import.meta.url).pathname;
const IMG = "/protos/chechfarm";
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "");
const CSS = strip(readFileSync(DIR + "site.css", "utf8") + readFileSync(DIR + "premium.css", "utf8") + readFileSync(DIR + "launch.css", "utf8")).replace(/\n\s*/g, "");
const JS = strip(readFileSync(DIR + "site.js", "utf8") + "\n" + readFileSync(DIR + "premium.js", "utf8") + "\n" + readFileSync(DIR + "launch.js", "utf8")).replace(/\n\s*\n/g, "\n");
const BASE_URL = "__PROTO_BASE__";
const TERMS = (l) => `https://devuz.studio/${l}/mockup-terms`;
const FONTS = "https://fonts.googleapis.com/css2?family=Literata:opsz,wght@7..72,400;7..72,700&family=Onest:wght@400;700&display=swap";
const KEY = { ru: "", uz: "uz", en: "en" };
const PAGES = ["", "about", "products", "partners", "investors", "news", "contacts"];

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const href = (l, p = "") => BASE_URL + (KEY[l] ? "/" + KEY[l] : "") + "/" + p;
const keyOf = (l, p) => [KEY[l], p].filter(Boolean).join("/");
const T = (l) => (ru, uz, en) => (l === "ru" ? ru : l === "uz" ? uz : en);
const pad = (n) => String(n).padStart(2, "0");

/* ── Иконки: линейные, одна толщина ─────────────────────────────────── */
const I = (dd) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${dd}</svg>`;
const ICON = {
  arrow: I('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  menu: I('<path d="M4 8h16M4 16h16"/>'),
  close: I('<path d="M6 6l12 12M18 6 6 18"/>'),
  health: I('<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/><path d="M8 12h2l1-2 2 4 1-2h2"/>'),
  trust: I('<path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6Z"/><path d="m9 12 2 2 4-4"/>'),
  value: I('<path d="M6 4h12l3 5-9 11L3 9Z"/><path d="M3 9h18M9 4l3 16 3-16"/>'),
  patients: I('<circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>'),
  doctors: I('<path d="M6 3v6a4 4 0 0 0 8 0V3"/><path d="M10 13v2a5 5 0 0 0 10 0v-2"/><circle cx="20" cy="11" r="2"/>'),
  pharmacies: I('<path d="M4 20V9l8-5 8 5v11Z"/><path d="M12 10v6M9 13h6"/>'),
  makers: I('<path d="M3 20V10l5 3V10l5 3V6l8 4v10Z"/><path d="M3 20h18"/>'),
  investors: I('<path d="M4 20V4M4 20h16"/><path d="m7 15 4-4 3 3 5-6"/>'),
  capsule: I('<rect x="3" y="8" width="18" height="8" rx="4" transform="rotate(-35 12 12)"/><path d="m9.7 8.7 4.6 6.6"/>'),
  search: I('<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.3-4.3"/>'),
  lock: I('<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
  mail: I('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>'),
  phone: I('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>'),
  pin: I('<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  globe: I('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'),
  check: I('<path d="m5 12.5 4.5 4.5L19 7"/>'),
  info: I('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.5"/>'),
  play: I('<path d="M7 4.5v15l12-7.5z"/>'),
  pause: I('<path d="M8 5v14M16 5v14"/>'),
  img: I('<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 8"/>'),
  doc: I('<path d="M7 3h7l4 4v14H7zM14 3v4h4M10 12h5M10 16h5"/>'),
  send: I('<path d="M21 3 3 10l7 3 3 7Z"/><path d="m10 13 4-4"/>'),
  panel: I('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16M3 9h6"/>'),
};

/* Знак: концепт до логотипа компании. Капсула из двух половин (здоровье и
   ценность) и лист в просвете. */
const MARK = `<svg class="mk" viewBox="0 0 40 40" aria-hidden="true" focusable="false"><g transform="rotate(-38 20 20)"><path class="a" d="M20 8h-4.5a8 8 0 0 0 0 16H20Z" transform="translate(0 4)"/><path class="b" d="M20 8h4.5a8 8 0 0 1 0 16H20Z" transform="translate(0 4)"/></g><path class="c" d="M20 14c3 2.5 3.4 6.8.6 11.5-3.3-3-3.8-7.6-.6-11.5Z"/></svg>`;
const LOGO = (l) => `<a class="logo" href="${href(l)}" aria-label="CZECHFARM alliance">${MARK}<span class="word"><b>CZECHFARM</b><small aria-hidden="true">${[..."ALLIANCE"].map((c) => `<i>${c}</i>`).join("")}</small></span></a>`;

const NAV = [
  ["about", ["О компании", "Kompaniya haqida", "About"]],
  ["products", ["Продукты", "Mahsulotlar", "Products"]],
  ["partners", ["Партнёрам", "Hamkorlarga", "Partners"]],
  ["investors", ["Инвесторам", "Investorlarga", "Investors"]],
  ["news", ["Новости", "Yangiliklar", "News"]],
  ["contacts", ["Контакты", "Aloqa", "Contacts"]],
];
const navName = (p, l) => NAV.find((n) => n[0] === p)[1][LANGS.indexOf(l)];
const L3 = (o, l) => o[l];
const PB = makeBlocks({ T, href, ICON, IMG, L3, CHAIN, pad, BASE_URL });
const LB = makeLaunch({ T, href, ICON, pad });

/* ── Шапка, меню, подвал ───────────────────────────────────────────── */
function headerHtml(l, p) {
  const t = T(l);
  const lang = `<div class="lang">${LANGS.map((x) => `<a href="${href(x, p)}" hreflang="${x}"${x === l ? ' aria-current="true"' : ""}>${x.toUpperCase()}</a>`).join("")}</div>`;
  return `<header class="top" id="top"><div class="top-in glass">
${LOGO(l)}
<nav class="nav" aria-label="${t("Разделы", "Bo‘limlar", "Sections")}">${NAV.map(([id, n]) => `<a href="${href(l, id)}"${id === p ? ' aria-current="page"' : ""}>${n[LANGS.indexOf(l)]}</a>`).join("")}</nav>
<div class="top-r">${lang}<a class="btn btn-pri top-cta" href="${href(l, "contacts")}#form">${t("Связаться", "Bog‘lanish", "Get in touch")}</a>
<button type="button" class="ic-btn" id="menu-btn" aria-expanded="false" aria-controls="menu" aria-label="${t("Меню", "Menyu", "Menu")}">${ICON.menu}</button></div>
</div></header>
<div class="menu" id="menu" role="dialog" aria-modal="true" aria-label="${t("Меню", "Menyu", "Menu")}" hidden>
<button type="button" class="ic-btn" data-close aria-label="${t("Закрыть", "Yopish", "Close")}">${ICON.close}</button>
<nav class="mn-list" aria-label="${t("Разделы", "Bo‘limlar", "Sections")}"><a href="${href(l)}"><small>00</small>${t("Главная", "Bosh sahifa", "Home")}</a>${NAV.map(([id, n], i) => `<a href="${href(l, id)}"><small>${pad(i + 1)}</small>${n[LANGS.indexOf(l)]}</a>`).join("")}</nav>
${lang}
<a class="btn btn-gold" href="${href(l, "contacts")}#form">${ICON.send}<span>${t("Связаться с CZECHFARM", "CZECHFARM bilan bog‘lanish", "Contact CZECHFARM")}</span></a>
</div>`;
}

function footHtml(l) {
  const t = T(l);
  return `<footer class="foot"><div class="wrap">
<div class="ft">
<div>${LOGO(l)}<p style="margin-top:16px">Health. Trust. Value.</p><p>${t("Фармацевтическая компания. Здоровье и качество жизни через доступ к современным решениям.", "Farmatsevtika kompaniyasi. Zamonaviy yechimlardan foydalanish orqali salomatlik va hayot sifati.", "A pharmaceutical company. Health and quality of life through access to modern solutions.")}</p></div>
<div><b>${t("Разделы", "Bo‘limlar", "Sections")}</b><ul>${NAV.map(([id, n]) => `<li><a href="${href(l, id)}">${n[LANGS.indexOf(l)]}</a></li>`).join("")}</ul></div>
<div><b>${t("Связь", "Aloqa", "Contact")}</b><ul><li>${t("Телефон, почта и адрес появятся после согласования с компанией", "Telefon, pochta va manzil kompaniya bilan kelishilgach chiqadi", "Phone, email and address will appear once the company confirms them")}</li><li><a href="${href(l, "contacts")}#form">${t("Написать в компанию", "Kompaniyaga yozish", "Write to the company")}</a></li><li><a href="${href(l, "panel")}">${t("Вход для сотрудников", "Xodimlar uchun kirish", "Staff sign-in")}</a></li></ul></div>
</div>
<div class="rights"><p>${t("Это макет DevUz Studio: так может выглядеть сайт CZECHFARM. Тексты собраны по техническому заданию компании. Названий препаратов, производителей, цифр, адресов и контактов на макете нет: их даёт и утверждает компания. Знак: концепт до получения логотипа. Продукты и новости с пометкой «демо» добавлены из демо-панели.", "Bu DevUz Studio maketi: CZECHFARM sayti shunday ko‘rinishi mumkin. Matnlar kompaniyaning texnik topshirig‘i asosida. Maketda dori nomlari, ishlab chiqaruvchilar, raqamlar, manzil va kontaktlar yo‘q: ularni kompaniya beradi va tasdiqlaydi. Belgi: logotip olingunga qadar konsept. «Demo» belgili mahsulot va yangiliklar demo-paneldan qo‘shilgan.", "A DevUz Studio mockup of how the CZECHFARM website could look. Texts follow the company’s brief. There are no product names, manufacturers, figures, addresses or contacts: the company provides and approves them. The mark is a concept until we receive the logo. Products and news marked “demo” come from the demo panel.")}</p>
<p>${t("Макет принадлежит DevUz Studio и используется только по договору.", "Maket DevUz Studio’ga tegishli va faqat shartnoma asosida ishlatiladi.", "The mockup belongs to DevUz Studio and may be used only under contract.")} <a href="${TERMS(l)}">${t("Условия использования макета", "Maketdan foydalanish shartlari", "Mockup terms of use")}</a></p></div>
</div></footer>`;
}

/* ── Цепочка стоимости: две схемы (широкая и вертикальная) ────────────── */
function bez(p0, p1, p2, p3, n = 80) {
  let len = 0, prev = p0;
  for (let i = 1; i <= n; i++) {
    const s = i / n, u = 1 - s;
    const x = u * u * u * p0[0] + 3 * u * u * s * p1[0] + 3 * u * s * s * p2[0] + s * s * s * p3[0];
    const y = u * u * u * p0[1] + 3 * u * u * s * p1[1] + 3 * u * s * s * p2[1] + s * s * s * p3[1];
    len += Math.hypot(x - prev[0], y - prev[1]);
    prev = [x, y];
  }
  return len;
}
function chainSvg(l, wide, id) {
  const N = CHAIN.length;
  const W = wide ? 1100 : 360, H = wide ? 340 : 770;
  const pts = CHAIN.map((_, i) => (wide ? [70 + i * 160, i % 2 ? 230 : 110] : [i % 2 ? 250 : 110, 50 + i * 111]));
  let d = `M${pts[0][0]} ${pts[0][1]}`, len = 0;
  const at = [0];
  for (let i = 1; i < N; i++) {
    const a = pts[i - 1], b = pts[i];
    const c1 = wide ? [a[0] + 80, a[1]] : [a[0], a[1] + 56];
    const c2 = wide ? [b[0] - 80, b[1]] : [b[0], b[1] - 56];
    d += ` C${c1.join(" ")} ${c2.join(" ")} ${b.join(" ")}`;
    len += bez(a, c1, c2, b);
    at.push(+len.toFixed(1));
  }
  const nodes = CHAIN.map((c, i) => {
    const [x, y] = pts[i];
    const name = L3(c, l)[0];
    const ty = wide ? (i % 2 ? y + 52 : y - 40) : y + 6;
    const tx = wide ? x : i % 2 ? x - 34 : x + 34;
    const anchor = wide ? "middle" : i % 2 ? "end" : "start";
    const noY = wide ? (i % 2 ? y + 72 : y - 60) : y - 16;
    return `<g class="ch-n" tabindex="0" role="button" aria-label="${pad(i + 1)}. ${esc(name)}"><circle class="hit" cx="${x}" cy="${y}" r="36"/><circle class="o" cx="${x}" cy="${y}" r="22"/><circle class="i" cx="${x}" cy="${y}" r="7"/><text class="no" x="${tx}" y="${noY}" text-anchor="${anchor}">${pad(i + 1)}</text><text x="${tx}" y="${ty}" text-anchor="${anchor}">${esc(name)}</text></g>`;
  }).join("");
  const L = Math.ceil(len) + 2;
  return `<svg class="ch-svg ${wide ? "ch-h" : "ch-v"}" viewBox="0 0 ${W} ${H}" data-len="${L}" data-at="${JSON.stringify(at)}" role="group" aria-label="${T(l)("Цепочка роста стоимости", "Qiymat o‘sish zanjiri", "Value growth chain")}"><defs><linearGradient id="${id}" x1="0" y1="0" x2="${wide ? 1 : 0}" y2="${wide ? 0 : 1}"><stop offset="0" stop-color="#3fbfae"/><stop offset="1" stop-color="#e5c98f"/></linearGradient></defs><path class="ch-path" d="${d}"/><path class="ch-lit" d="${d}" stroke="url(#${id})" style="stroke-dasharray:${L};stroke-dashoffset:${L}"/>${nodes}<circle class="ch-dot" r="6"/></svg>`;
}
function chainBlock(l, head) {
  const t = T(l);
  return `<section class="sec dark chain-sec" id="model"><div class="wrap">
<div class="sec-h mv mv-up"><p class="kicker">${head.k}</p><h2 class="h2">${head.h}</h2><p class="lead">${head.p}</p></div>
<div class="chain mv mv-scale"><div class="ch-stage">${chainSvg(l, true, `chg-h`)}${chainSvg(l, false, `chg-v`)}</div>
<div class="ch-info"><div class="ch-card glass-d" aria-live="polite"><p class="no"></p><h3></h3><p class="ds"></p></div>
<div class="ch-ctl"><button type="button" data-play aria-pressed="false"></button><span class="ch-bar" aria-hidden="true"><i></i></span><span class="note">${t("Нажмите на любой шаг", "Istalgan qadamni bosing", "Tap any step")}</span></div></div></div>
</div></section>`;
}

/* ── Формы обращений ───────────────────────────────────────────────── */
function fl(l, name, label, o = {}) {
  const t = T(l);
  const req = o.req ? " required" : "";
  const star = o.req ? " *" : "";
  const field = o.area
    ? `<textarea name="${name}" rows="4"${req} placeholder="${esc(o.ph || "")}"></textarea>`
    : o.opts
      ? `<select name="${name}"${req}>${o.opts.map(([v, n]) => `<option value="${esc(v)}">${esc(n)}</option>`).join("")}</select>`
      : `<input name="${name}" type="${o.type || "text"}"${o.auto ? ` autocomplete="${o.auto}"` : ""}${o.mode ? ` inputmode="${o.mode}"` : ""}${req} placeholder="${esc(o.ph || "")}">`;
  return `<label class="fl"><span>${label}${star}</span>${field}<span class="err" aria-live="polite"></span></label>`;
}
const agree = (l) => `<label class="agree"><input type="checkbox" name="agree" required><span>${T(l)("Согласен на обработку моих данных, чтобы компания ответила на обращение. Текст согласия утверждает компания.", "Kompaniya murojaatimga javob berishi uchun ma’lumotlarim qayta ishlanishiga roziman. Rozilik matnini kompaniya tasdiqlaydi.", "I agree to my data being processed so the company can reply. The consent text is approved by the company.")}</span></label>`;
function sentBox(l) {
  const t = T(l);
  return `<div class="sent" hidden tabindex="-1"><span class="chip">${ICON.check}${t("Отправлено", "Yuborildi", "Sent")}</span><h3>${t("Обращение", "Murojaat", "Request")} <span data-no></span> ${t("принято", "qabul qilindi", "received")}</h3><p>${t("Ответит команда CZECHFARM. Статус обращения виден на странице «Контакты».", "CZECHFARM jamoasi javob beradi. Murojaat holati «Aloqa» sahifasida ko‘rinadi.", "The CZECHFARM team will reply. You can see the status on the Contacts page.")}</p><p class="note">${t("Это макет: обращение пришло в демо-панель компании, она открыта в этом же браузере.", "Bu maket: murojaat kompaniyaning demo-paneliga keldi, u shu brauzerda ochiladi.", "This is a mockup: the request went to the company’s demo panel, open in this same browser.")}</p><button type="button" class="btn btn-line" data-again>${t("Написать ещё", "Yana yozish", "Write again")}</button></div>`;
}
const submit = (l, s) => `<button type="submit" class="btn btn-pri">${ICON.send}<span>${s}</span></button>`;
function contactForm(l, title) {
  const t = T(l);
  const tabs = [["partner", t("Запуск бренда", "Brendni ishga tushirish", "Brand launch")], ["pharmacy", t("Аптекам", "Dorixonalarga", "Pharmacies")], ["investor", t("Инвестиции", "Investitsiya", "Investment")], ["other", t("Другое", "Boshqa", "Other")]];
  return `<div class="form-wrap"><form class="form" data-lead="partner" novalidate><h3>${title}</h3>
<div class="tabs" role="group" aria-label="${t("Тема", "Mavzu", "Topic")}">${tabs.map(([k, n], i) => `<button type="button" data-k="${k}" aria-pressed="${i ? "false" : "true"}">${n}</button>`).join("")}</div>
<div class="row2">${fl(l, "name", t("Как к вам обращаться", "Ismingiz", "Your name"), { req: true, auto: "name" })}${fl(l, "org", t("Организация", "Tashkilot", "Organisation"), { auto: "organization" })}</div>
<div class="row2">${fl(l, "email", t("Почта", "Pochta", "Email"), { req: true, type: "email", auto: "email", mode: "email" })}${fl(l, "phone", t("Телефон", "Telefon", "Phone"), { type: "tel", auto: "tel", mode: "tel", ph: "+998" })}</div>
${fl(l, "msg", t("Сообщение", "Xabar", "Message"), { req: true, area: true })}
${agree(l)}${submit(l, t("Отправить", "Yuborish", "Send"))}</form>${sentBox(l)}</div>`;
}

/* ── Шапки подстраниц ──────────────────────────────────────────────── */
function pageHead(l, p, h1, lead, o = {}) {
  const t = T(l);
  return `<section class="ph${o.dark ? " dark" : ""}">${o.img ? `<div class="ph-img" aria-hidden="true"><img src="${IMG}/${o.img}-2000.webp" srcset="${IMG}/${o.img}-1100.webp 1100w, ${IMG}/${o.img}-2000.webp 2000w" sizes="100vw" alt="" fetchpriority="high"></div>` : ""}<div class="wrap">
<p class="crumbs"><a href="${href(l)}">CZECHFARM</a> / ${navName(p, l)}</p>
<h1 class="rise">${h1}</h1><p class="lead rise" style="--d:150ms">${lead}</p>${o.act ? `<div class="hero-act rise" style="--d:260ms;margin-top:28px">${o.act}</div>` : ""}</div></section>`;
}

/* ── Блоки ─────────────────────────────────────────────────────────── */
function missionBlock(l) {
  const t = T(l);
  const text = t("Высшая цель CZECHFARM: улучшать здоровье и качество жизни людей через доступ к современным решениям.", "CZECHFARM oliy maqsadi: zamonaviy yechimlardan foydalanish imkoni orqali odamlarning salomatligi va hayot sifatini yaxshilash.", "CZECHFARM’s highest purpose is to improve people’s health and quality of life through access to modern solutions.");
  const keys = t(["здоровье", "качество", "жизни", "доступ"], ["salomatligi", "hayot", "sifatini", "foydalanish"], ["health", "quality", "life", "access"]);
  const words = text.split(" ").map((w) => `<span class="wd${keys.some((k) => w.toLowerCase().startsWith(k)) ? " k" : ""}">${w}</span>`).join(" ");
  return `<section class="sec mission" id="mission"><div class="wrap"><div class="sec-h"><p class="kicker">${t("Миссия", "Missiya", "Mission")}</p></div><p class="big">${words}</p></div></section>`;
}
function pillarsBlock(l, withHead = true) {
  const t = T(l);
  const mv = ["mv-left", "mv-up", "mv-right"];
  return `<section class="sec" id="formula"><div class="wrap">
${withHead ? `<div class="sec-h mv mv-up"><p class="kicker">${t("Формула бренда", "Brend formulasi", "Brand formula")}</p><h2 class="h2">Health. Trust. <b>Value.</b></h2><p class="lead">${t("Три смысла, на которых стоит компания. Каждый следующий держится на предыдущем.", "Kompaniya tayanadigan uchta ma’no. Har biri oldingisiga tayanadi.", "Three ideas the company stands on. Each one rests on the one before.")}</p></div>` : ""}
<div class="pill3">${PILLARS.map((p, i) => `<article class="pl mv ${mv[i]}" data-k="${p.id}" style="--d:${i * 120}ms"><span class="pl-i">${ICON[p.id]}</span><span class="pl-w">${p.word}</span><h3>${L3(p, l)[0]}</h3><p>${L3(p, l)[1]}</p></article>`).join("")}</div>
</div></section>`;
}
function portfolioTeaser(l) {
  const t = T(l);
  return `<section class="sec" id="portfolio"><div class="wrap pf">
<div class="sec-h mv mv-left" style="margin:0"><p class="kicker">${t("Портфель продуктов", "Mahsulotlar portfeli", "Product portfolio")}</p><h2 class="h2">${t("Каталог, в котором <b>легко найти нужное</b>", "Keraklisini <b>oson topish</b> mumkin bo‘lgan katalog", "A catalogue where <b>the right product is easy to find</b>")}</h2><p class="lead">${t("Перечень продуктов публикуем только после того, как его утвердит компания. Пока здесь устройство карточки: какие поля увидит пациент, врач и аптека.", "Mahsulotlar ro‘yxatini faqat kompaniya tasdiqlagandan keyin e’lon qilamiz. Hozircha bu yerda kartochka tuzilishi: bemor, shifokor va dorixona qaysi maydonlarni ko‘radi.", "We publish the product list only after the company approves it. For now this shows how a product card works: which fields patients, doctors and pharmacies will see.")}</p><a class="link" href="${href(l, "products")}">${t("Открыть каталог", "Katalogni ochish", "Open the catalogue")}${ICON.arrow}</a></div>
<div class="pf-card mv mv-scale"><div class="pf-cap"><span class="pf-ph">${ICON.capsule}</span><div><span class="chip">${t("Устройство карточки", "Kartochka tuzilishi", "Card layout")}</span><p class="note" style="margin-top:6px">${t("Поля согласуем с компанией", "Maydonlarni kompaniya bilan kelishamiz", "Fields to be agreed with the company")}</p></div></div>
<ul class="pf-fields">${PRODUCT_FIELDS.map((f) => `<li><span>${f[l]}</span><span aria-hidden="true"></span></li>`).join("")}</ul></div>
</div></section>`;
}
function ctaEnd(l) {
  const t = T(l);
  return `<section class="sec mint cta-end" id="contact"><div class="wrap">
<div class="sec-h mv mv-left"><p class="kicker">${t("Связаться", "Bog‘lanish", "Get in touch")}</p><h2 class="h2">${t("Расскажите, <b>чем мы можем быть полезны</b>", "<b>Qanday foyda bera olishimizni</b> ayting", "Tell us <b>how we can help</b>")}</h2><p class="lead">${t("Производитель, аптека, врач или инвестор: одна форма, ответ приходит в нужный отдел.", "Ishlab chiqaruvchi, dorixona, shifokor yoki investor: bitta shakl, javob kerakli bo‘limga keladi.", "Manufacturer, pharmacy, doctor or investor: one form, and it reaches the right team.")}</p></div>
<div class="mv mv-right">${contactForm(l, t("Обращение в компанию", "Kompaniyaga murojaat", "Message to the company"))}</div>
</div></section>`;
}

/* ── Страницы ──────────────────────────────────────────────────────── */
function home(l) {
  const t = T(l);
  const hero = PB.heroScene(l, `<div class="hero-in"><div style="display:grid;gap:24px">
<p class="kicker rise">CZECHFARM · Health. Trust. Value.</p>
<h1 aria-label="${t("Ваш фарм-бренд на рынке Узбекистана", "Farm-brendingiz O‘zbekiston bozorida", "Your pharma brand in the Uzbek market")}"><span class="w"><span>${t("Ваш фарм-бренд", "Farm-brendingiz", "Your pharma brand")}</span></span><span class="w"><span>${t("на рынке", "O‘zbekiston", "in the Uzbek")}</span></span><span class="w"><span>${t("Узбекистана.", "bozorida.", "market.")}</span></span></h1>
<p class="lead rise" style="--d:380ms">${t("CZECHFARM запускает фарм-бренды под ключ для тех, кто выходит на рынок Узбекистана: бренд, маркетинг и точки сбыта уже налажены.", "CZECHFARM O‘zbekiston bozoriga chiqayotganlar uchun farm-brendlarni kalit topshirish asosida ishga tushiradi: brend, marketing va sotuv nuqtalari allaqachon yo‘lga qo‘yilgan.", "CZECHFARM launches pharma brands turnkey for companies entering Uzbekistan: brand, marketing and points of sale are already in place.")}</p>
<div class="hero-act rise" style="--d:500ms"><a class="btn btn-pri" id="hero-cta" href="${href(l, "partners")}"><span>${t("Запустить бренд", "Brendni ishga tushirish", "Launch a brand")}</span>${ICON.arrow}</a><a class="link" href="#launch">${t("Пройти путь бренда", "Brend yo‘lini ko‘rish", "Walk the brand’s path")}${ICON.arrow}</a></div></div>
<div class="hero-card glass rise" id="hc" style="--d:650ms"><div class="hc-row" role="group" aria-label="${t("Формула бренда", "Brend formulasi", "Brand formula")}">${PILLARS.map((p, i) => `<button type="button" aria-pressed="${i ? "false" : "true"}">${p.word}</button>`).join("")}</div><p class="hc-txt" aria-live="polite">${L3(PILLARS[0], l)[1]}</p></div>
</div>`);
  return [hero, LB.launchBlock(l), LB.compareBlock(l), missionBlock(l), pillarsBlock(l), chainBlock(l, {
    k: t("Как работает модель CZECHFARM", "CZECHFARM modeli qanday ishlaydi", "How the CZECHFARM model works"),
    h: t("Улучшение здоровья <b>создаёт стоимость</b>", "Salomatlikni yaxshilash <b>qiymat yaratadi</b>", "Better health <b>creates value</b>"),
    p: t("Семь шагов от здоровья человека до роста компании. Импульс идёт по цепочке сам; нажмите на шаг, чтобы прочитать о нём.", "Inson salomatligidan kompaniya o‘sishigacha yetti qadam. Impuls zanjir bo‘ylab o‘zi yuradi; qadam haqida o‘qish uchun uni bosing.", "Seven steps from a person’s health to the company’s growth. The pulse runs on its own; tap a step to read about it."),
  }), PB.audienceSwitch(l), portfolioTeaser(l), ctaEnd(l), PB.priceBlock(l)].join("\n");
}

function about(l) {
  const t = T(l);
  return [pageHead(l, "about", t("Здоровье и качество жизни: <b>с этого всё начинается</b>", "Salomatlik va hayot sifati: <b>hammasi shundan boshlanadi</b>", "Health and quality of life: <b>where it all begins</b>"), t("CZECHFARM связывает людей с современными решениями для здоровья. Ниже: цель, принципы и модель компании.", "CZECHFARM odamlarni salomatlik uchun zamonaviy yechimlar bilan bog‘laydi. Quyida: maqsad, tamoyillar va kompaniya modeli.", "CZECHFARM connects people with modern health solutions. Below: the company’s purpose, principles and model."), { act: `<a class="btn btn-pri" href="${href(l, "contacts")}#form">${t("Связаться", "Bog‘lanish", "Get in touch")}${ICON.arrow}</a>` }),
  `<section class="sec" id="purpose"><div class="wrap split"><div class="sec-h mv mv-left" style="margin:0"><p class="kicker">${t("Цель и миссия", "Maqsad va missiya", "Purpose and mission")}</p><h2 class="h2">${t("Доступ к современным решениям <b>для здоровья</b>", "Salomatlik uchun <b>zamonaviy yechimlardan</b> foydalanish", "Access to modern <b>health solutions</b>")}</h2></div>
<div class="mv mv-right" style="display:grid;gap:20px"><p class="lead">${t("Высшая цель компании: улучшать здоровье и качество жизни людей. Работа CZECHFARM связана с этим напрямую: компания приводит на рынок современные решения и делает их доступными для пациентов, врачей и аптек.", "Kompaniyaning oliy maqsadi: odamlarning salomatligi va hayot sifatini yaxshilash. CZECHFARM ishi bunga bevosita bog‘liq: kompaniya bozorga zamonaviy yechimlarni olib keladi va ularni bemorlar, shifokorlar va dorixonalar uchun ochiq qiladi.", "The company’s highest purpose is to improve people’s health and quality of life. CZECHFARM’s work ties straight into that: it brings modern solutions to the market and makes them available to patients, doctors and pharmacies.")}</p>
<img src="${IMG}/flask-1200.webp" srcset="${IMG}/flask-700.webp 700w, ${IMG}/flask-1200.webp 1200w" sizes="(min-width: 960px) 40vw, 100vw" alt="${t("Стеклянная колба с ростком в воде", "Suvdagi novdali shisha kolba", "A glass flask with a cutting in water")}" loading="lazy" width="1200" height="1490" style="border-radius:var(--r);box-shadow:var(--sh2)"></div></div></section>`,
  pillarsBlock(l),
  chainBlock(l, {
    k: t("Модель создания стоимости", "Qiymat yaratish modeli", "Value creation model"),
    h: t("Продукты, рынок, <b>повторный спрос</b>", "Mahsulotlar, bozor, <b>takroriy talab</b>", "Products, market, <b>repeat demand</b>"),
    p: t("Продукт, которому доверяют, выбирают снова. Повторный спрос даёт денежный поток, а он идёт в новые продукты и масштабирование.", "Ishonchli mahsulot yana tanlanadi. Takroriy talab pul oqimini beradi, u esa yangi mahsulotlar va kengayishga yo‘naltiriladi.", "A trusted product gets chosen again. Repeat demand brings cash flow, which goes into new products and growth."),
  }),
  PB.needsBlock(l)].join("\n");
}

function products(l) {
  const t = T(l);
  return [pageHead(l, "products", t("Портфель <b>продуктов</b>", "Mahsulotlar <b>portfeli</b>", "Product <b>portfolio</b>"), t("Поиск по названию и действующему веществу, карточка с главным и страница продукта с инструкцией. Публикуем только то, что утвердила компания.", "Nomi va ta’sir etuvchi modda bo‘yicha qidiruv, asosiy ma’lumotli kartochka va yo‘riqnomali mahsulot sahifasi. Faqat kompaniya tasdiqlaganini e’lon qilamiz.", "Search by name and active substance, a card with the essentials and a product page with the leaflet. We publish only what the company has approved.")),
  `<section class="sec" style="padding-top:24px" id="catalog-sec"><div class="wrap">
<div class="cat-bar"><label class="search">${ICON.search}<input id="q" type="search" placeholder="${t("Название или действующее вещество", "Nomi yoki ta’sir etuvchi modda", "Name or active substance")}" aria-label="${t("Поиск по каталогу", "Katalog bo‘yicha qidiruv", "Search the catalogue")}"></label>
<select class="flt" aria-label="${t("Направление", "Yo‘nalish", "Area")}"><option>${t("Все направления", "Barcha yo‘nalishlar", "All areas")}</option><option disabled>${t("Направления согласуем с компанией", "Yo‘nalishlar kompaniya bilan kelishiladi", "Areas to be agreed")}</option></select>
<select class="flt" aria-label="${t("Отпуск", "Berilishi", "Prescription")}"><option>${t("По рецепту и без", "Retsept bilan va retseptsiz", "Rx and OTC")}</option></select></div>
<p class="note" id="cat-n" style="margin-bottom:16px"></p>
<div class="grid3" id="catalog" aria-live="polite"></div>
<div class="empty mv mv-up" style="margin-top:24px"><span class="chip">${t("Как это работает", "Bu qanday ishlaydi", "How it works")}</span><p>${t("Компания добавляет продукт в панели: название, вещество, форма выпуска, производитель, направление, инструкция. После публикации карточка появляется здесь сама.", "Kompaniya panelda mahsulot qo‘shadi: nomi, modda, chiqarilish shakli, ishlab chiqaruvchi, yo‘nalish, yo‘riqnoma. E’lon qilingach kartochka bu yerda o‘zi chiqadi.", "The company adds a product in the panel: name, substance, dosage form, manufacturer, area, leaflet. Once published, the card appears here on its own.")}</p>
<div class="hero-act"><button type="button" class="btn btn-line" data-sample-prod>${ICON.doc}<span>${t("Как выглядит страница продукта", "Mahsulot sahifasi qanday ko‘rinadi", "See a product page layout")}</span></button><a class="link" href="${href(l, "panel")}#products">${t("Добавить продукт в панели", "Panelda mahsulot qo‘shish", "Add a product in the panel")}${ICON.arrow}</a></div></div>
<p class="warn" style="margin-top:24px">${ICON.info}<span>${t("Информация о продуктах не заменяет консультацию врача. Перед применением прочитайте инструкцию.", "Mahsulotlar haqidagi ma’lumot shifokor maslahatining o‘rnini bosmaydi. Qo‘llashdan oldin yo‘riqnomani o‘qing.", "Product information does not replace a doctor’s consultation. Read the leaflet before use.")}</span></p>
</div></section>`].join("\n");
}

function partners(l) {
  const t = T(l);
  return [pageHead(l, "partners", t("Запуск фарм-бренда в Узбекистане <b>под ключ</b>", "Farm-brendni O‘zbekistonda <b>kalit topshirish</b> asosida ishga tushirish", "A <b>turnkey</b> pharma brand launch in Uzbekistan"), t("Ваш препарат здесь пока не знают. У CZECHFARM уже налажено всё, что нужно для выхода на рынок: бренд, маркетинг и точки сбыта.", "Doringizni bu yerda hali bilishmaydi. CZECHFARMda bozorga chiqish uchun kerak bo‘lgan hamma narsa yo‘lga qo‘yilgan: brend, marketing va sotuv nuqtalari.", "Nobody here knows your product yet. CZECHFARM already has everything a market entry needs: brand, marketing and points of sale."), { dark: true, img: "globe", act: `<a class="btn btn-gold" href="#form">${t("Обсудить запуск", "Ishga tushirishni muhokama qilish", "Discuss the launch")}${ICON.arrow}</a>` }),
  `<section class="sec" id="role"><div class="wrap split"><div class="sec-h mv mv-left" style="margin:0"><p class="kicker">${t("Что входит в «под ключ»", "«Kalit topshirish»ga nima kiradi", "What turnkey includes")}</p><h2 class="h2">${t("Полный комплект: <b>сбыт, бренд, маркетинг</b>", "To‘liq to‘plam: <b>sotuv, brend, marketing</b>", "The full set: <b>sales, brand, marketing</b>")}</h2></div>
<ul class="ticks mv mv-right">${[
    t("Бренд под местный рынок: имя, упаковка и понятная информация для врачей, аптек и пациентов.", "Mahalliy bozorga mos brend: nom, qadoq va shifokorlar, dorixonalar, bemorlar uchun tushunarli ma’lumot.", "A brand for the local market: name, packaging and clear information for doctors, pharmacies and patients."),
    t("Маркетинг: о бренде узнают те, кто его выбирает и назначает.", "Marketing: brend haqida uni tanlaydigan va tavsiya qiladiganlar bilib oladi.", "Marketing: the people who choose and recommend the product learn the brand."),
    t("Точки сбыта: у CZECHFARM они уже налажены, искать их самому не нужно.", "Sotuv nuqtalari: CZECHFARMda ular allaqachon yo‘lga qo‘yilgan, o‘zingiz qidirishingiz shart emas.", "Points of sale: CZECHFARM already has them in place, so you do not need to find them yourself."),
  ].map((x) => `<li>${ICON.check}<span>${x}</span></li>`).join("")}</ul></div></section>`,
  PB.globeBlock(l),
  `<section class="sec dark" id="steps"><div class="wrap"><div class="sec-h mv mv-up"><p class="kicker">${t("Как идёт запуск", "Ishga tushirish qanday o‘tadi", "How a launch goes")}</p><h2 class="h2">${t("Пять шагов <b>от заявки до запуска</b>", "Arizadan ishga tushirishgacha <b>besh qadam</b>", "Five steps <b>from request to launch</b>")}</h2></div>
<ol class="steps">${PARTNER_STEPS.map((s, i) => `<li class="glass-d mv mv-up" style="--d:${i * 90}ms"><h3>${L3(s, l)[0]}</h3><p>${L3(s, l)[1]}</p></li>`).join("")}</ol></div></section>`,
  `<section class="sec mint" id="form"><div class="wrap split"><div class="sec-h mv mv-left" style="margin:0"><p class="kicker">${t("Заявка на запуск", "Ishga tushirish arizasi", "Launch request")}</p><h2 class="h2">${t("Расскажите, <b>что запускаем</b>", "<b>Nimani ishga tushiramiz</b>, aytib bering", "Tell us <b>what we are launching</b>")}</h2><p class="lead">${t("Название и страну из «Пути вашего бренда» мы уже подставили. Заявка приходит команде запусков CZECHFARM.", "«Brendingiz yo‘li»dagi nom va mamlakatni allaqachon qo‘ydik. Ariza CZECHFARM ishga tushirish jamoasiga keladi.", "We have already filled in the name and country from “Your brand’s path”. The request goes to the CZECHFARM launch team.")}</p></div>
<div class="mv mv-right"><div class="form-wrap"><form class="form" data-lead="partner" novalidate><h3>${t("Заявка производителя", "Ishlab chiqaruvchi arizasi", "Manufacturer request")}</h3>
<div class="row2">${fl(l, "org", t("Компания", "Kompaniya", "Company"), { req: true, auto: "organization" })}${fl(l, "country", t("Страна", "Mamlakat", "Country"), { req: true, auto: "country-name" })}</div>
<div class="row2">${fl(l, "name", t("Контактное лицо", "Mas’ul shaxs", "Contact person"), { req: true, auto: "name" })}${fl(l, "email", t("Почта", "Pochta", "Email"), { req: true, type: "email", auto: "email", mode: "email" })}</div>
${fl(l, "scale", t("Масштаб запуска", "Ishga tushirish ko‘lami", "Launch scale"), { opts: [["10", t("от 10 млн $", "10 mln $ dan", "from 10 m $")], ["25", t("от 25 млн $", "25 mln $ dan", "from 25 m $")], ["talk", t("Обсудим на звонке", "Qo‘ng‘iroqda muhokama qilamiz", "Let’s discuss on a call")]] })}
${fl(l, "msg", t("Препарат и что ждёте от рынка", "Dori va bozordan nima kutasiz", "The product and what you expect from the market"), { req: true, area: true })}
${agree(l)}${submit(l, t("Отправить заявку", "Arizani yuborish", "Send the request"))}</form>${sentBox(l)}</div></div></div></section>`].join("\n");
}

function investors(l) {
  const t = T(l);
  return [pageHead(l, "investors", t("Фармацевтическая платформа, <b>где здоровье создаёт стоимость</b>", "Salomatlik <b>qiymat yaratadigan</b> farmatsevtika platformasi", "A pharmaceutical platform <b>where health creates value</b>"), t("Инвестиционное позиционирование CZECHFARM: улучшение здоровья создаёт устойчивую стоимость.", "CZECHFARM investitsiya pozitsiyasi: salomatlikni yaxshilash barqaror qiymat yaratadi.", "CZECHFARM’s investment positioning: improving health creates sustainable value."), { dark: true, img: "steps", act: `<a class="btn btn-gold" href="#form">${t("Запросить материалы", "Materiallarni so‘rash", "Request materials")}${ICON.arrow}</a>` }),
  `<section class="sec" id="thesis"><div class="wrap"><p class="kicker mv mv-up">${t("Почему это работает", "Nega bu ishlaydi", "Why it works")}</p><p class="quote mv mv-up" style="margin-top:16px;color:var(--ink)">${t("Когда продукт <b style=\"color:var(--teal)\">помогает людям</b>, ему доверяют. Доверие даёт повторный спрос, а повторный спрос <b style=\"color:var(--teal)\">даёт стоимость</b>.", "Mahsulot <b style=\"color:var(--teal)\">odamlarga yordam bersa</b>, unga ishonishadi. Ishonch takroriy talab beradi, takroriy talab esa <b style=\"color:var(--teal)\">qiymat yaratadi</b>.", "When a product <b style=\"color:var(--teal)\">helps people</b>, they trust it. Trust brings repeat demand, and repeat demand <b style=\"color:var(--teal)\">creates value</b>.")}</p></div></section>`,
  chainBlock(l, {
    k: t("Логика роста стоимости", "Qiymat o‘sish mantig‘i", "How value grows"),
    h: t("От здоровья <b>до масштабирования</b>", "Salomatlikdan <b>kengayishgacha</b>", "From health <b>to scale</b>"),
    p: t("Здоровье, доверие, продукты, рынок, продажи, денежный поток, масштабирование. Каждый шаг опирается на предыдущий.", "Salomatlik, ishonch, mahsulotlar, bozor, savdo, pul oqimi, kengayish. Har qadam oldingisiga tayanadi.", "Health, trust, products, market, sales, cash flow, scale. Each step rests on the one before."),
  }),
  PB.blocksStage(l),
  `<section class="sec" id="materials"><div class="wrap"><div class="sec-h mv mv-up"><p class="kicker">${t("Показатели и материалы", "Ko‘rsatkichlar va materiallar", "Figures and materials")}</p><h2 class="h2">${t("Цифры <b>по запросу</b>", "Raqamlar <b>so‘rov bo‘yicha</b>", "Figures <b>on request</b>")}</h2><p class="lead">${t("Показатели компания публикует сама, когда будет готова. До этого материалы выдаются по запросу.", "Ko‘rsatkichlarni kompaniya tayyor bo‘lganda o‘zi e’lon qiladi. Ungacha materiallar so‘rov bo‘yicha beriladi.", "The company publishes its figures itself when ready. Until then, materials are shared on request.")}</p></div>
<div class="docs">${IR_DOCS.map((x, i) => `<div class="doc mv mv-tilt" style="--d:${i * 100}ms"><span class="lock">${ICON.lock}</span><h3>${L3(x, l)[0]}</h3><p class="note">${L3(x, l)[1]}</p><span class="chip">${t("По запросу", "So‘rov bo‘yicha", "On request")}</span></div>`).join("")}</div></div></section>`,
  `<section class="sec mint" id="form"><div class="wrap split"><div class="sec-h mv mv-left" style="margin:0"><p class="kicker">${t("Для инвесторов", "Investorlar uchun", "For investors")}</p><h2 class="h2">${t("Запросить материалы <b>или встречу</b>", "Materiallar <b>yoki uchrashuv</b> so‘rash", "Request materials <b>or a meeting</b>")}</h2></div>
<div class="mv mv-right"><div class="form-wrap"><form class="form" data-lead="investor" novalidate><h3>${t("Запрос инвестора", "Investor so‘rovi", "Investor request")}</h3>
<div class="row2">${fl(l, "name", t("Имя", "Ism", "Name"), { req: true, auto: "name" })}${fl(l, "org", t("Фонд или компания", "Fond yoki kompaniya", "Fund or company"), { auto: "organization" })}</div>
<div class="row2">${fl(l, "email", t("Почта", "Pochta", "Email"), { req: true, type: "email", auto: "email", mode: "email" })}${fl(l, "want", t("Что нужно", "Nima kerak", "What you need"), { opts: [["docs", t("Материалы", "Materiallar", "Materials")], ["meet", t("Встреча", "Uchrashuv", "A meeting")], ["both", t("Материалы и встреча", "Materiallar va uchrashuv", "Both")]] })}</div>
${fl(l, "msg", t("Комментарий", "Izoh", "Comment"), { area: true })}
${agree(l)}${submit(l, t("Отправить запрос", "So‘rovni yuborish", "Send the request"))}</form>${sentBox(l)}</div></div></div></section>`].join("\n");
}

function news(l) {
  const t = T(l);
  return [pageHead(l, "news", t("Новости <b>компании</b>", "Kompaniya <b>yangiliklari</b>", "Company <b>news</b>"), t("Заголовок, дата, изображение и текст. Новости публикует администратор в панели.", "Sarlavha, sana, rasm va matn. Yangiliklarni administrator panelda e’lon qiladi.", "Headline, date, image and text. An administrator publishes news in the panel.")),
  `<section class="sec" style="padding-top:24px"><div class="wrap"><div class="news" id="news-l" aria-live="polite"></div>
<div class="empty" id="news-empty" style="margin-top:24px"><span class="chip">${t("Пока пусто", "Hozircha bo‘sh", "Nothing yet")}</span><p>${t("Здесь будут новости CZECHFARM. Первую публикует администратор в панели, и она появляется на сайте сама.", "Bu yerda CZECHFARM yangiliklari bo‘ladi. Birinchisini administrator panelda e’lon qiladi va u saytda o‘zi chiqadi.", "CZECHFARM news will appear here. An administrator publishes the first one in the panel and it shows up on the site by itself.")}</p><a class="link" href="${href(l, "panel")}#news">${t("Опубликовать в панели", "Panelda e’lon qilish", "Publish in the panel")}${ICON.arrow}</a></div></div></section>`].join("\n");
}

function contacts(l) {
  const t = T(l);
  const ct = (ic, b, s) => `<div class="ct"><span class="i">${ICON[ic]}</span><span><b>${b}</b><span class="note">${s}</span></span></div>`;
  const later = t("после согласования с компанией", "kompaniya bilan kelishilgach", "once the company confirms");
  return [pageHead(l, "contacts", t("Связаться <b>с CZECHFARM</b>", "<b>CZECHFARM</b> bilan bog‘lanish", "Contact <b>CZECHFARM</b>"), t("Одна форма для партнёров, аптек, врачей и инвесторов. Обращение попадает к нужному человеку.", "Hamkorlar, dorixonalar, shifokorlar va investorlar uchun bitta shakl. Murojaat kerakli odamga yetadi.", "One form for partners, pharmacies, doctors and investors. Your message reaches the right person.")),
  `<section class="sec" style="padding-top:24px" id="form"><div class="wrap split">
<div style="display:grid;gap:24px"><div class="cts mv mv-left">${ct("phone", t("Телефон", "Telefon", "Phone"), later)}${ct("mail", t("Почта", "Pochta", "Email"), later)}${ct("pin", t("Адрес офиса", "Ofis manzili", "Office address"), later)}${ct("globe", t("Соцсети", "Ijtimoiy tarmoqlar", "Social media"), later)}</div>
<div class="track" id="track" hidden><p class="kicker">${t("Мои обращения", "Murojaatlarim", "My requests")}</p><div class="track-l"></div><p class="note">${t("Статус ставит компания в своей панели.", "Holatni kompaniya o‘z panelida qo‘yadi.", "The company sets the status in its panel.")}</p></div>
<div class="map mv mv-scale"><svg class="grid" viewBox="0 0 400 250" aria-hidden="true"><g stroke="#e5f4f0" stroke-width=".6" fill="none">${Array.from({ length: 12 }, (_, i) => `<path d="M${i * 36} 0v250"/>`).join("")}${Array.from({ length: 8 }, (_, i) => `<path d="M0 ${i * 36}h400"/>`).join("")}<path d="M0 180C80 150 140 190 220 140S340 90 400 110" stroke-width="2"/></g></svg><p>${ICON.pin}${t("Карта появится, когда компания подтвердит адрес.", "Manzil tasdiqlangach xarita chiqadi.", "The map will appear once the company confirms its address.")}</p></div></div>
<div class="mv mv-right">${contactForm(l, t("Обращение", "Murojaat", "Your message"))}</div>
</div></section>`].join("\n");
}

const BUILD = { "": home, about, products, partners, investors, news, contacts };
const TITLES = {
  "": ["CZECHFARM: Health. Trust. Value. Фармацевтическая компания", "CZECHFARM: Health. Trust. Value. Farmatsevtika kompaniyasi", "CZECHFARM: Health. Trust. Value. Pharmaceutical company"],
  about: ["О компании CZECHFARM: миссия, принципы, модель", "CZECHFARM haqida: missiya, tamoyillar, model", "About CZECHFARM: mission, principles, model"],
  products: ["Портфель продуктов CZECHFARM", "CZECHFARM mahsulotlar portfeli", "CZECHFARM product portfolio"],
  partners: ["Партнёрам: CZECHFARM для международных производителей", "Hamkorlarga: xalqaro ishlab chiqaruvchilar uchun CZECHFARM", "Partners: CZECHFARM for international manufacturers"],
  investors: ["Инвесторам: CZECHFARM, где здоровье создаёт стоимость", "Investorlarga: salomatlik qiymat yaratadigan CZECHFARM", "Investors: CZECHFARM, where health creates value"],
  news: ["Новости CZECHFARM", "CZECHFARM yangiliklari", "CZECHFARM news"],
  contacts: ["Контакты CZECHFARM", "CZECHFARM bilan aloqa", "Contact CZECHFARM"],
};
const DESC = ["CZECHFARM улучшает здоровье и качество жизни людей через доступ к современным решениям. Партнёрам, аптекам, врачам и инвесторам.", "CZECHFARM zamonaviy yechimlar orqali odamlarning salomatligi va hayot sifatini yaxshilaydi. Hamkorlar, dorixonalar, shifokorlar va investorlar uchun.", "CZECHFARM improves people’s health and quality of life through access to modern solutions. For partners, pharmacies, doctors and investors."];

/* ── Данные для скрипта ────────────────────────────────────────────── */
function K(l, p) {
  const t = T(l);
  return {
    lang: l,
    page: p || "home",
    base: BASE_URL,
    img: IMG,
    scene: { n: SCENE_FRAMES },
    aud: PB.audCta(l),
    steps: PARTNER_STEPS.map((x) => x[l]),
    offer: PB.offerData(l),
    launch: LB.launchData(l),
    panel: href(l, "panel"),
    pillars: PILLARS.map((x) => x[l][1]),
    chain: CHAIN.map((c) => c[l]),
    play: t("Пустить импульс", "Impulsni yurgizish", "Play the pulse"),
    pause: t("Пауза", "Pauza", "Pause"),
    icPlay: ICON.play, icPause: ICON.pause, icInfo: ICON.info, icImg: ICON.img,
    kinds: { partner: t("Запуск бренда", "Brendni ishga tushirish", "Brand launch"), pharmacy: t("Аптека", "Dorixona", "Pharmacy"), investor: t("Инвестиции", "Investitsiya", "Investment"), other: t("Другое", "Boshqa", "Other") },
    st: { new: t("Новое", "Yangi", "New"), work: t("В работе", "Ishda", "In progress"), meet: t("Назначена встреча", "Uchrashuv belgilandi", "Meeting set"), done: t("Ответ отправлен", "Javob yuborildi", "Answered") },
    status: t("Статус", "Holat", "Status"),
    err: { need: t("Заполните это поле", "Bu maydonni to‘ldiring", "Please fill this in"), mail: t("Проверьте почту: нужен вид name@company.com", "Pochtani tekshiring: name@company.com ko‘rinishida", "Check the email: it should look like name@company.com"), phone: t("В номере мало цифр", "Raqamda raqamlar kam", "The number is too short"), form: t("Проверьте отмеченные поля", "Belgilangan maydonlarni tekshiring", "Please check the highlighted fields") },
    sending: t("Отправляем", "Yuborilmoqda", "Sending"),
    sentToast: t("Обращение ушло в панель компании.", "Murojaat kompaniya paneliga ketdi.", "The request went to the company panel."),
    toPanel: t("Открыть в панели", "Panelda ochish", "Open in the panel"),
    demo: t("демо", "demo", "demo"),
    sample: t("Образец устройства", "Tuzilish namunasi", "Layout sample"),
    agree: t("согласуем с компанией", "kompaniya bilan kelishiladi", "to be agreed"),
    fields: PRODUCT_FIELDS.map((f) => ({ id: f.id, t: f[l] })),
    catN: t("Найдено: {n}", "Topildi: {n}", "Found: {n}"),
    catEmpty: t("Перечень продуктов ещё не утверждён. Так будет выглядеть каталог:", "Mahsulotlar ro‘yxati hali tasdiqlanmagan. Katalog shunday ko‘rinadi:", "The product list is not approved yet. This is how the catalogue will look:"),
    notFound: t("Ничего не нашлось. Попробуйте другое название.", "Hech narsa topilmadi. Boshqa nom bilan urinib ko‘ring.", "Nothing found. Try another name."),
    prodSample: t("Страница продукта", "Mahsulot sahifasi", "Product page"),
    medNote: t("Информация не заменяет консультацию врача. Медицинские тексты публикуются только после согласования с ответственным в компании.", "Ma’lumot shifokor maslahatining o‘rnini bosmaydi. Tibbiy matnlar faqat kompaniyadagi mas’ul shaxs bilan kelishilgach e’lon qilinadi.", "This information does not replace a doctor’s consultation. Medical texts are published only after approval by the responsible person at the company."),
    newsSample: t("Так будет выглядеть новость", "Yangilik shunday ko‘rinadi", "This is how a news item will look"),
    dateW: t("Дата публикации", "E’lon sanasi", "Publication date"),
    newsParts: [t("Заголовок", "Sarlavha", "Headline"), t("Дата", "Sana", "Date"), t("Изображение", "Rasm", "Image"), t("Текст новости", "Yangilik matni", "Body text")],
  };
}

function ld(l, p) {
  const org = { "@type": "Organization", name: "CZECHFARM", slogan: "Health. Trust. Value.", description: DESC[LANGS.indexOf(l)] };
  return JSON.stringify({ "@context": "https://schema.org", "@graph": [org, { "@type": "WebPage", name: TITLES[p][LANGS.indexOf(l)], inLanguage: l }] }).replace(/</g, "\\u003c");
}

function page(l, p) {
  const t = T(l);
  const isHome = p === "";
  const dz = isHome ? dzIntroSolo(l === "en" ? "ru" : l).replace(">Пропустить<", l === "en" ? ">Skip<" : ">Пропустить<") : "";
  return `<!doctype html>
<html lang="${l}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${TITLES[p][LANGS.indexOf(l)]}</title>
<meta name="description" content="${DESC[LANGS.indexOf(l)]}">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="#f5f3ee">
<meta property="og:title" content="${TITLES[p][LANGS.indexOf(l)]}">
<meta property="og:description" content="${DESC[LANGS.indexOf(l)]}">
<meta property="og:type" content="website">
<link rel="icon" type="image/svg+xml" href="${IMG}/icon.svg">
<link rel="apple-touch-icon" href="${IMG}/apple-180.png">
${isHome ? `<link rel="preload" as="image" href="${IMG}/hero-2400.webp" imagesrcset="${IMG}/hero-900.webp 900w, ${IMG}/hero-1400.webp 1400w, ${IMG}/hero-2400.webp 2400w" imagesizes="100vw" media="(min-width: 900px), (orientation: landscape)">\n<link rel="preload" as="image" href="${IMG}/hero-m-1080.webp" media="(max-width: 899px) and (orientation: portrait)">` : ""}
${LANGS.filter((x) => x !== l).map((x) => `<link rel="alternate" hreflang="${x}" href="${href(x, p)}">`).join("\n")}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<script>(function(){var r=document.documentElement;r.classList.add('js');try{if(matchMedia('(prefers-reduced-motion: reduce)').matches)r.classList.add('rm')}catch(e){}})()</script>
<style>${CSS}</style>
<script type="application/ld+json">${ld(l, p)}</script>
</head>
<body data-lang="${l}" data-page="${p || "home"}">
${dz}
${isHome ? introHtml(l) : ""}
<a class="skip" href="#main">${t("К содержанию", "Asosiy qismga", "Skip to content")}</a>
${headerHtml(l, p)}
<main id="main">
${BUILD[p](l)}
</main>
${footHtml(l)}
<div class="dock glass" id="dock"><a class="btn btn-pri" href="${href(l, "contacts")}#form">${ICON.send}<span>${t("Связаться с CZECHFARM", "CZECHFARM bilan bog‘lanish", "Contact CZECHFARM")}</span></a></div>
<div class="dlg" id="dlg" role="dialog" aria-modal="true" aria-label="${t("Подробно", "Batafsil", "Details")}" hidden><div class="dlg-in"><button type="button" class="ic-btn dlg-x" aria-label="${t("Закрыть", "Yopish", "Close")}">${ICON.close}</button><div class="dlg-b" style="display:grid;gap:18px"></div></div></div>
<p class="toast" id="toast" role="status" hidden></p>
<script type="application/json" id="cf-data">${JSON.stringify(K(l, p)).replace(/</g, "\\u003c")}</script>
<script>
${JS}</script>
</body>
</html>`;
}

/* Заставка CZECHFARM alliance: пролёт над буквами, логотип встаёт в шапку
   (владелец, 27.10.2026). Код — intro/intro.js, собранный в intro3d.js. */
const INTRO_CSS = `.cfi{position:fixed;inset:0;z-index:2147482000;background-color:#071a18;transition:background-color .8s ease}
.cfi canvas{position:absolute;inset:0;width:100%;height:100%;display:block;opacity:0;transition:opacity .7s}
.cfi.on canvas{opacity:1}.cfi.out{background-color:rgb(7 26 24 / 0);pointer-events:none}.cfi.out canvas{opacity:0;transition-duration:.25s}
.cfi-skip{position:absolute;right:16px;bottom:calc(16px + env(safe-area-inset-bottom));min-height:44px;padding:8px 16px;border:1px solid rgb(229 244 240 / .24);border-radius:999px;font:500 12px/1 system-ui,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:rgb(229 244 240 / .78);background:rgb(7 26 24 / .4);cursor:pointer;transition:opacity .3s}
.cfi.out .cfi-skip{opacity:0}
html.cfi .top .logo{opacity:0}html.cfi .rise{opacity:0;transform:translateY(18px)}html.cfi .hs h1 .w>span{transform:translateY(105%)}
.cfi-fly{position:fixed;z-index:2147482001;margin:0;pointer-events:none;color:#f1ece1;transition:opacity .25s,transform 1s cubic-bezier(.65,0,.35,1),color 1s}
.cfi-fly.lnd{color:var(--ink)}`;
const INTRO_JS = `(function(){var o=document.getElementById('cfi'),r=document.documentElement;if(!o)return;
var force=/[?&]intro=1/.test(location.search),seen=false;try{seen=!!sessionStorage.getItem('cf-intro')}catch(e){}
var ok=!r.classList.contains('rm')&&(force||!seen)&&!(navigator.connection&&navigator.connection.saveData);
if(ok){try{var c=document.createElement('canvas'),g=c.getContext('webgl2')||c.getContext('webgl');ok=!!g;var x=g&&g.getExtension('WEBGL_lose_context');if(x)x.loseContext()}catch(e){ok=false}}
if(!ok){o.parentNode.removeChild(o);return}
r.classList.add('cfi');try{sessionStorage.setItem('cf-intro','1')}catch(e){}
window.cfiOff=function(){r.classList.remove('cfi');o.classList.add('out');setTimeout(function(){if(o.parentNode)o.parentNode.removeChild(o)},900)};
var last=Date.now();(function w(){if(window.cfiOn||!o.parentNode)return;if(document.getElementById('dzi'))last=Date.now();if(Date.now()-last>4000){window.cfiOff();return}setTimeout(w,200)})();
})()`;
function introHtml(l) {
  const skip = { ru: "Пропустить", uz: "O‘tkazib yuborish", en: "Skip" }[l];
  return `<div class="cfi" id="cfi" data-env="${IMG}/studio-2048.webp" role="presentation"><canvas></canvas><button type="button" class="cfi-skip">${skip}</button></div>
<style>${INTRO_CSS}</style>
<script>${INTRO_JS}</script>
<script src="${IMG}/intro3d.js" defer></script>`;
}

/* ── Панель ─────────────────────────────────────────────────────────── */
const PANEL_JS = strip(readFileSync(DIR + "panel.js", "utf8")).replace(/\n\s*\n/g, "\n");
const PANEL_CSS = strip(readFileSync(DIR + "panel.css", "utf8")).replace(/\n\s*/g, "");
/* Каждая подпись, которую зовёт panel.js, — на трёх языках, иначе сборка падает. */
(function checkDict() {
  const keys = new Set([...PANEL_JS.matchAll(/\bt\('([A-Za-z0-9_]+)'/g)].map((m) => m[1]));
  for (const k of ["role_", "s_", "k_", "n_", "r_", "sc_"]) keys.delete(k);
  for (const k of keys) {
    const v = PANEL_UI[k];
    if (!v || v.length !== 3 || v.some((x) => !x)) throw new Error(`panel: нет подписи «${k}» на трёх языках`);
    if (/[А-Яа-яЁё]/.test(JSON.stringify([v[1], v[2]]))) throw new Error(`panel: кириллица в узбекской или английской подписи «${k}»`);
  }
  if (/[А-Яа-яЁё]/.test(PANEL_JS + PANEL_CSS)) throw new Error("panel: кириллица в коде панели");
})();
const SP = (dd) => `<path d="${dd}"/>`;
const SPRITE = {
  dash: SP("M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z"), leads: SP("M4 13h4l2 3h4l2-3h4M4 13l2.5-8h11L20 13v6H4z"),
  news: SP("M4 5h13v14H6a2 2 0 0 1-2-2zM17 9h3v8a2 2 0 0 1-2 2M8 9h5M8 13h5"), products: SP("M8.3 15.7a4 4 0 0 1 0-5.7l4-4a4 4 0 0 1 5.7 5.7l-4 4a4 4 0 0 1-5.7 0zM10.3 8l5.7 5.7"),
  seo: SP("M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM20 20l-4.8-4.8"), log: SP("M12 7v5l3 2M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5"),
  team: SP("M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14a5.5 5.5 0 0 1 3.5 6"),
  plus: SP("M12 5v14M5 12h14"), x: SP("M6 6l12 12M18 6 6 18"), menu: SP("M4 7h16M4 12h16M4 17h16"), check: SP("m5 12.5 4.5 4.5L19 7"),
  ext: SP("M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"), mail: SP("M3 5h18v14H3zM3 7l9 6 9-6"), eye: SP("M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z"),
  edit: SP("M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4"), trash: SP("M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"),
};
const sprite = () => `<svg width="0" height="0" style="position:absolute" aria-hidden="true">${Object.entries(SPRITE).map(([k, dd]) => `<symbol id="i-${k}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${dd}</symbol>`).join("")}</svg>`;
const NAMES = {
  ru: ["Алишер К.", "Нигора Р.", "Сардор М.", "Камила А.", "Бобур Т.", "Лола Ш.", "Рустам Ю.", "Севара Х.", "Дмитрий П.", "Анна В.", "Jan N.", "Laura S.", "Marek K.", "Elena D."],
  uz: ["Alisher K.", "Nigora R.", "Sardor M.", "Kamila A.", "Bobur T.", "Lola Sh.", "Rustam Yu.", "Sevara X.", "Dmitriy P.", "Anna V.", "Jan N.", "Laura S.", "Marek K.", "Elena D."],
  en: ["Alisher K.", "Nigora R.", "Sardor M.", "Kamila A.", "Bobur T.", "Lola Sh.", "Rustam Yu.", "Sevara Kh.", "Dmitriy P.", "Anna V.", "Jan N.", "Laura S.", "Marek K.", "Elena D."],
};
function panelData(l) {
  const i = LANGS.indexOf(l);
  return {
    lang: l,
    ui: Object.fromEntries(Object.entries(PANEL_UI).map(([k, v]) => [k, v[i]])),
    names: NAMES[l],
    site: href(l),
    pages: PAGES.map((p) => ({ k: p || "home", n: p ? navName(p, l) : T(l)("Главная", "Bosh sahifa", "Home"), t: TITLES[p][i], d: DESC[i], href: href(l, p) })),
    fields: PRODUCT_FIELDS.map((f) => ({ id: f.id, t: f[l] })),
  };
}
function panelPage(l) {
  const t = T(l);
  const nav = ["dash", "leads", "news", "products", "seo", "log", "team"];
  const pick = (k) => PANEL_UI[k][LANGS.indexOf(l)];
  return `<!doctype html>
<html lang="${l}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${t("Панель CZECHFARM · макет DevUz Studio", "CZECHFARM paneli · DevUz Studio maketi", "CZECHFARM panel · DevUz Studio mockup")}</title>
<meta name="description" content="${t("Панель сайта CZECHFARM: обращения партнёров, аптек и инвесторов, новости, портфель продуктов, заголовки страниц, роли и история действий.", "CZECHFARM sayti paneli: hamkorlar, dorixonalar va investorlar murojaatlari, yangiliklar, mahsulotlar portfeli, sahifa sarlavhalari, rollar va harakatlar tarixi.", "CZECHFARM website panel: partner, pharmacy and investor requests, news, product portfolio, page titles, roles and action history.")}">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="#071a18">
<link rel="icon" type="image/svg+xml" href="${IMG}/icon.svg">
${LANGS.filter((x) => x !== l).map((x) => `<link rel="alternate" hreflang="${x}" href="${href(x, "panel")}">`).join("\n")}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<style>${PANEL_CSS}</style>
</head>
<body class="panel" data-lang="${l}">
${sprite()}
<div class="app">
<div class="nav-back" data-navclose></div>
<aside class="side-nav" aria-label="${pick("sections")}">
<a class="brand" href="${href(l)}" aria-label="CZECHFARM">${MARK}<span><b>CZECHFARM</b><small>${pick("panelOf")}</small></span></a>
<nav class="nav">${nav.map((k) => `<a href="#${k}"><svg class="ic" aria-hidden="true"><use href="#i-${k}"/></svg><span>${pick("n_" + k)}</span>${k === "leads" ? `<i data-cnt hidden>0</i>` : ""}</a>`).join("")}</nav>
<div class="role"><label><span>${pick("viewAs")}</span><select id="role">${["owner", "head", "manager"].map((r) => `<option value="${r}">${pick("role_" + r)}</option>`).join("")}</select></label>
<a class="to-site" href="${href(l)}"><svg class="ic" aria-hidden="true"><use href="#i-ext"/></svg><span>${pick("toSite")}</span></a></div>
</aside>
<div class="main">
<header class="topbar"><button type="button" class="ib" id="menu-b" aria-label="${pick("menu")}"><svg class="ic" aria-hidden="true"><use href="#i-menu"/></svg></button><b class="tb-t" id="tb-t"></b><span class="sp"></span><div class="lang-s">${LANGS.map((x) => `<a href="${href(x, "panel")}" hreflang="${x}"${x === l ? ' aria-current="true"' : ""}>${x.toUpperCase()}</a>`).join("")}</div></header>
<main id="pv" tabindex="-1"></main>
<p class="demo">${pick("demoNote")} <a href="${TERMS(l)}">${pick("terms")}</a></p>
</div></div>
<div id="mdl" hidden></div>
<div id="toast" role="status" aria-live="polite"></div>
<script type="application/json" id="cp-data">${JSON.stringify(panelData(l)).replace(/</g, "\\u003c")}</script>
<script>
${PANEL_JS}</script>
</body>
</html>`;
}

const out = {};
for (const l of LANGS) {
  for (const p of PAGES) out[keyOf(l, p)] = page(l, p);
  out[keyOf(l, "panel")] = panelPage(l);
}
mkdirSync(DIR + "out", { recursive: true });
writeFileSync(DIR + "out/pages.json", JSON.stringify(out));

/* Сборка для сервера (lib/proto/bundles): стили и скрипты один раз, в
   страницах вместо них метка @@имя@@. */
const parts = { S: `<style>${CSS}</style>`, J: `<script>\n${JS}</script>`, K: `<style>${PANEL_CSS}</style>`, Q: `<script>\n${PANEL_JS}</script>` };
const pages = {};
for (const [key, html] of Object.entries(out)) {
  let p = html;
  for (const [name, part] of Object.entries(parts)) p = p.split(part).join(`@@${name}@@`);
  pages[key] = p;
}
const bundleDir = new URL("../../../content/proto-bundles/", import.meta.url).pathname;
mkdirSync(bundleDir, { recursive: true });
writeFileSync(bundleDir + "chechfarm.json", JSON.stringify({ parts, pages }));
for (const [k, v] of Object.entries(out)) console.log((k || "(ru)").padEnd(14), v.length);
