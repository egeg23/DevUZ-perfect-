import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dzIntroSolo } from "../../../lib/proto/dz-video.mjs";
import { LANGS, BRAND, WARN, PARTNERS, FAQ, ratesFor, annuity } from "./data.mjs";
import { BASE, ADDONS, OFFER_HOURS, ALL } from "./plan.mjs";
import { PANEL_UI } from "./panel-ui.mjs";

/*
 * Макет агрегатора микрозаймов Узбекистана «Qiyos» (рабочее имя), 18.11.2026.
 * Владелец: «единая страница с подключенными партнерскими программами и
 * вшитыми ссылками… человек вводит сумму и срок, ниже идут предложения…
 * рассчитывается платеж в месяц… Делаем с админкой».
 *
 *   ""    — видео DevUz → залёт в знак по прокрутке (кодом) → выбор «Сайт» /
 *           «Админка» → как проверить → конструктор цены (plan.mjs);
 *   site  — сама страница: сумма и срок, предложения банков с платежом,
 *           переплатой и итогом, сортировка, фильтры, «Получить» по
 *           партнёрской ссылке, предупреждение о рисках (ЗРУ-1187);
 *   panel — админка: партнёры, переходы, выдачи и вознаграждение, роли.
 *
 * Партнёры, ставки, суммы, сроки, лицензии — только с открытых страниц
 * банков (data.mjs, SOURCES.md). Модель макет не вызывает.
 */

const DIR = new URL(".", import.meta.url).pathname;
const IMG = "/protos/qiyos";
const strip = (s) => s.replace(/\/\*(?!~\*\/)[\s\S]*?\*\//g, "");
const CSS = strip(readFileSync(DIR + "site.css", "utf8")).replace(/\n\s*/g, "");
const JS = strip(readFileSync(DIR + "site.js", "utf8")).replace(/\n\s*\n/g, "\n");
const LAND_JS = strip(readFileSync(DIR + "land.js", "utf8")).replace(/\n\s*\n/g, "\n");
const PANEL_JS = strip(readFileSync(DIR + "panel.js", "utf8")).replace(/\n\s*\n/g, "\n");
const PANEL_CSS = strip(readFileSync(DIR + "panel.css", "utf8")).replace(/\n\s*/g, "");
const BASE_URL = "__PROTO_BASE__";
const TERMS = (l) => `https://devuz.studio/${l}/mockup-terms`;
const FONTS = "https://fonts.googleapis.com/css2?family=Onest:wght@400;700&family=Unbounded:wght@400;700&display=swap";
const KEY = { ru: "", uz: "uz" };

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const href = (l, p = "") => BASE_URL + (KEY[l] ? "/" + KEY[l] : "") + "/" + (p ? p : "");
const T = (l) => (ru, uz) => (l === "ru" ? ru : uz);
const fmt = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const usd = (n) => `${fmt(n)} $`;
const words = (txt) => txt.split(" ").map((w) => `<span class="w"><span>${w}</span></span>`).join(" ");
const json = (o) => JSON.stringify(o).replace(/</g, "\\u003c");

const I = (dd) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${dd}</svg>`;
const ICON = {
  arrow: I('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  back: I('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
  close: I('<path d="M6 6l12 12M18 6 6 18"/>'),
  check: I('<path d="m5 12 5 5 9-10"/>'),
  info: I('<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>'),
  warn: I('<path d="M12 3 2 20h20Z"/><path d="M12 10v4M12 17v.01"/>'),
  panel: I('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 9v11"/>'),
  copy: I('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>'),
  tg: I('<path d="M21 4 3 11l6 2 2 6 3-4 5 4Z"/><path d="m9 13 8-6"/>'),
  down: I('<path d="m6 9 6 6 6-6"/>'),
  list: I('<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/>'),
  shield: I('<path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6Z"/><path d="m9 12 2 2 4-4"/>'),
  phone: I('<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>'),
  doc: I('<path d="M7 3h7l5 5v13H7Z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>'),
  card: I('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/>'),
  zero: I('<circle cx="12" cy="12" r="8"/><path d="M8 16 16 8"/>'),
  wifi: I('<path d="M5 12a10 10 0 0 1 14 0M8.5 15.5a5 5 0 0 1 7 0M12 19v.01"/>'),
};
/* Знак Qiyos: монета-кольцо с бегунком ползунка (рабочий знак, кодом). */
const MARK = `<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><circle cx="20" cy="20" r="17" fill="none" stroke="#0a4b43" stroke-width="5"/><path d="M27 27l7 7" stroke="#0a4b43" stroke-width="5" stroke-linecap="round"/><circle cx="20" cy="20" r="6" fill="#f0b429"/></svg>`;
const MARK_W = MARK.replace(/#0a4b43/g, "#fff");
const LOGO = (l, to = "site", white = false) => `<a class="logo" href="${href(l, to)}" aria-label="${BRAND.name}">${white ? MARK_W : MARK}<span>${BRAND.name}</span></a>`;
const termsLine = (l, t) => `${t("Макет DevUz Studio. Пользуясь макетом, вы принимаете", "DevUz Studio maketi. Maketdan foydalanib, siz")} <a href="${TERMS(l)}" target="_blank" rel="noopener">${t("условия макета", "maket shartlarini qabul qilasiz")}</a>${t(".", "")}`;
const P = PARTNERS;

function head(l, title, desc, theme = "#0a4b43") {
  return `<!doctype html>
<html lang="${l}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="${theme}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">`;
}

/* Пример для текста: 10 млн на 12 месяцев у самого дешёвого партнёра. */
function example() {
  const rows = P.filter((p) => (p.min == null || p.min <= 1e7) && (p.max == null || p.max >= 1e7) && p.tmin <= 12 && p.tmax >= 12)
    .map((p) => ({ p, r: ratesFor(p, 12)[0] })).sort((a, b) => a.r - b.r);
  const { p, r } = rows[0];
  const pay = annuity(1e7, r, 12);
  return { p, r, pay, over: pay * 12 - 1e7 };
}

/* ── Сайт ─────────────────────────────────────────────────────────── */
function siteDict(l) {
  const t = T(l);
  return {
    post: l === "uz", sum: t("сум", "so‘m"), mln: t("млн", "mln"), mo: t("мес.", "oy"), fr: t("от", "dan"), upto: t("до", "gacha"), from: t("от", "·"), of: t("из", "/"),
    lic: t("Лицензия ЦБ РУз", "MB litsenziyasi"), rec: t("Рекомендуем", "Tavsiya"), pay: t("Платёж в месяц", "Oylik to‘lov"), rate: t("Ставка, годовых", "Stavka, yillik"),
    over: t("Переплата", "Ortiqcha to‘lov"), tot: t("Итого вернёте", "Jami qaytarasiz"), get: t("Получить", "Olish"), cmp: t("Сравнить", "Solishtirish"), more: t("Подробнее", "Batafsil"),
    demo: t("Демо-ссылка: ведёт на страницу банка с меткой перехода. Настоящую ссылку партнёрки ставят в админке.", "Demo havola: o‘tish belgisi bilan bank sahifasiga olib boradi. Haqiqiy hamkorlik havolasi admin panelda qo‘yiladi."),
    who: t("Кому дают", "Kimga beriladi"), how: t("Как оформить", "Qanday rasmiylashtiriladi"), pledge: t("Обеспечение", "Ta’minot"), lim: t("Сумма и срок у банка", "Bankdagi summa va muddat"),
    psk: t("Полная стоимость кредита (ПСК)", "Kreditning to‘liq qiymati (KTQ)"), pskl: t("в информационном листе банка", "bankning axborot varag‘ida"), org: t("Кредитор", "Kreditor"),
    sched: t("Из чего состоит каждый платёж, по месяцам", "Har bir to‘lov nimadan iborat, oylar bo‘yicha"), int: t("проценты", "foizlar"), body: t("долг", "qarz"),
    b_online: t("онлайн", "onlayn"), b_docs: t("без справок", "ma’lumotnomasiz"), b_card: t("на карту", "kartaga"), b_np: t("без залога", "garovsiz"),
    upto_na: t("верхнюю ставку банк назовёт после скоринга", "yuqori stavkani bank skoringdan keyin aytadi"), att: t("при", "da"), fixed: t("ставка одна, платёж точный", "stavka bitta, to‘lov aniq"),
    byscore: t("сумму определит скоринг", "summani skoring belgilaydi"),
    wmin: t("Сумма у банка от", "Bankda summa"), wmax: t("Сумма у банка до", "Bankda summa gacha:"), wtmin: t("Срок у банка от", "Bankda muddat kamida"), wtmax: t("Срок у банка до", "Bankda muddat ko‘pi bilan"), wstep: t("Срок кратен 3 месяцам: 12, 15 … 36", "Muddat 3 oyga karrali: 12, 15 … 36"),
    none: t("нет подходящих", "mos yo‘q"),
    h_pay: t("Сначала меньший платёж в месяц по нижней ставке банка.", "Avval bankning quyi stavkasi bo‘yicha kichikroq oylik to‘lov."),
    h_over: t("Сначала меньшая переплата в худшем случае: по верхней ставке банка.", "Avval eng yomon holatda kichikroq ortiqcha to‘lov: bankning yuqori stavkasi bo‘yicha."),
    h_easy: t("Сначала проще получить: онлайн, без справок, без залога, на карту. Процент одобрения банки не публикуют.", "Avval olish osonroq: onlayn, ma’lumotnomasiz, garovsiz, kartaga. Ma’qullash foizini banklar e’lon qilmaydi."),
    h_rec: t("Порядок из админки: «рекомендуем» сверху.", "Admin paneldagi tartib: «tavsiya» yuqorida."),
    sent: t("Переход записан: смотрите «Мои заявки» и админку", "O‘tish yozildi: «Arizalarim» va admin panelni ko‘ring"),
    mine: t("Мои заявки", "Arizalarim"), mine0: t("Здесь появятся банки, в которые вы перешли по «Получить».", "Bu yerda «Olish» orqali o‘tgan banklaringiz paydo bo‘ladi."),
    mine1: t("Статус ставит банк, в макете его ставят в админке.", "Holatni bank qo‘yadi, maketda uni admin panelda qo‘yishadi."),
    st: l === "ru" ? ["Переход", "Заявка в банке", "Одобрено", "Выдано", "Отказ"] : ["O‘tish", "Bankda ariza", "Ma’qullandi", "Berildi", "Rad etildi"],
    cmpn: t("Выбрано для сравнения", "Solishtirish uchun tanlandi"), cmp2: t("Отметьте хотя бы два предложения", "Kamida ikkita taklifni belgilang"), cmpt: t("Сравнение:", "Solishtirish:"), why0: t("Подходит", "Mos keladi"),
    warn: WARN[l],
    d0: t("Введите доход в месяц.", "Oylik daromadni kiriting."), d1: t("Можно платить по новым займам в месяц, не больше", "Yangi qarzlar bo‘yicha oyiga to‘lash mumkin, ko‘pi bilan"),
    d2: t("С лучшим предложением", "Eng yaxshi taklif bilan"), d3: t("дохода уйдёт на платежи.", "daromad to‘lovlarga ketadi."), d4: t("Больше половины: банк может отказать.", "Yarmidan ko‘p: bank rad etishi mumkin."),
    n0: t("Напишите Telegram", "Telegramni yozing"), n1: t("Готово: напишем, когда ставка станет ниже", "Tayyor: stavka pasayganda yozamiz"),
  };
}

function header(l, t) {
  const nav = [["offers", t("Займы", "Qarzlar")], ["how", t("Как считаем", "Qanday hisoblaymiz")], ["partners", t("Партнёры", "Hamkorlar")], ["faq", t("Вопросы", "Savollar")]];
  return `<header class="top"><div class="mbar"><a href="${href(l)}">${ICON.back}<span>${t("Макет для Qiyos", "Qiyos uchun maket")}</span></a><a class="mb-adm" href="${href(l, "panel")}">${ICON.panel}<span>${t("Админка", "Admin panel")}</span></a></div><div class="top-in">
${LOGO(l)}
<nav class="nav" aria-label="${t("Разделы", "Bo‘limlar")}">${nav.map(([id, n]) => `<a href="#${id}">${n}</a>`).join("")}</nav>
<div class="langs">${LANGS.map((x) => `<a href="${href(x, "site")}" hreflang="${x}" lang="${x}"${x === l ? ' aria-current="true"' : ""}>${x.toUpperCase()}</a>`).join("")}</div>
<button type="button" class="mine" id="mine">${ICON.list}<span>${t("Мои заявки", "Arizalarim")}</span><i></i></button>
</div></header>`;
}

function hero(l, t) {
  return `<section class="hero" id="top" aria-label="${t("Сравнение микрозаймов", "Mikroqarzlarni solishtirish")}"><div class="coins" aria-hidden="true"></div>
<div class="wrap"><div class="hgrid">
<div>
<p class="kick" style="color:var(--gold)"><i></i>${t("Банки с лицензией ЦБ Узбекистана", "O‘zbekiston MB litsenziyasiga ega banklar")}</p>
<h1>${words(t(`Сравните микрозаймы <em>${P.length}&nbsp;банков</em> за минуту`, `${P.length}&nbsp;ta bankning <em>mikroqarzlarini</em> bir daqiqada solishtiring`))}</h1>
<p class="lead">${t("Выберите сумму и срок: сразу видно платёж в месяц, переплату и сколько вернёте в каждом банке.", "Summa va muddatni tanlang: har bir bankda oylik to‘lov, ortiqcha to‘lov va qancha qaytarishingiz darhol ko‘rinadi.")}</p>
<ul class="facts"><li>${ICON.check}${t("Сравнение бесплатное", "Solishtirish bepul")}</li><li>${ICON.check}${t("Ставки с сайтов банков", "Stavkalar banklar saytidan")}</li><li>${ICON.check}${t("Лицензия на каждой карточке", "Har bir kartochkada litsenziya")}</li></ul>
<div class="flow"><p><span><i style="background:var(--gold)"></i>${t("проценты", "foizlar")}</span><span><i style="background:var(--pr2)"></i>${t("долг", "qarz")}</span><span>${t("переплата в лучшем:", "eng yaxshisida ortiqcha:")} <b id="hover"></b></span></p><div class="bars" id="hbars" aria-hidden="true"></div></div>
</div>
<form class="calc" id="calc" onsubmit="return false" aria-label="${t("Калькулятор займа", "Qarz kalkulyatori")}">
<div class="fld"><div class="fld-h"><label for="rs">${t("Сумма", "Summa")}</label><span class="fld-in"><input id="is" inputmode="numeric" aria-label="${t("Сумма, сум", "Summa, so‘m")}" value="10 000 000"><small>${t("сум", "so‘m")}</small></span></div>
<input type="range" id="rs" min="500000" max="100000000" step="500000" value="10000000"><div class="ticks"><span>${t("500 тыс.", "500 ming")}</span><span>${t("100 млн", "100 mln")}</span></div></div>
<div class="fld"><div class="fld-h"><label for="rn">${t("Срок", "Muddat")}</label><span class="fld-in"><input id="in" inputmode="numeric" aria-label="${t("Срок, месяцев", "Muddat, oy")}" value="12"><small>${t("мес.", "oy")}</small></span></div>
<input type="range" id="rn" min="1" max="60" step="1" value="12"><div class="ticks"><span>${t("1 мес.", "1 oy")}</span><span>${t("60 мес.", "60 oy")}</span></div></div>
<div class="res" aria-live="polite"><div><small>${t("Платёж в месяц от", "Oylik to‘lov")}</small><br><b id="best"></b><br><small id="bestw"></small></div><div class="cnt"><small>${t("Подходят", "Mos keladi")}</small><br><b id="found"></b></div></div>
<a class="btn btn-a" href="#offers">${t("Смотреть предложения", "Takliflarni ko‘rish")}${ICON.arrow}</a>
<p class="mu" style="font-size:14px;margin:12px 0 0">${t("Расчёт предварительный: решение и ставку даёт банк.", "Hisob dastlabki: qaror va stavkani bank beradi.")}</p>
</form>
</div></div>
<div class="warn" role="note">${ICON.warn}<div class="wrap" style="padding:0">${WARN[l]}</div></div>
</section>`;
}

function offers(l, t) {
  const chip = (k, ic, n) => `<button type="button" class="chip" data-f="${k}" aria-pressed="false">${ic}${n}</button>`;
  return `<section class="sec" id="offers"><div class="wrap">
<p class="kick"><i></i>${t("Предложения партнёров", "Hamkorlar takliflari")}</p>
<h2 class="h2">${t("Займы под вашу сумму и срок", "Summa va muddatingizga mos qarzlar")}</h2>
<div class="bar"><div class="seg" role="group" aria-label="${t("Порядок", "Tartib")}"><button type="button" data-sort="pay">${t("Меньше платёж", "Kam to‘lov")}</button><button type="button" data-sort="over">${t("Меньше переплата", "Kam ortiqcha")}</button><button type="button" data-sort="easy">${t("Проще получить", "Olish oson")}</button><button type="button" data-sort="rec">${t("Рекомендуем", "Tavsiya")}</button></div>
<div class="chips">${chip("docs", ICON.doc, t("Без справок", "Ma’lumotnomasiz"))}${chip("card", ICON.card, t("На карту", "Kartaga"))}${chip("online", ICON.wifi, t("Онлайн", "Onlayn"))}${chip("zero", ICON.zero, t("Первый займ 0%", "Birinchi qarz 0%"))}</div></div>
<p class="hint" id="sorth"></p>
<div class="list" id="list"></div>
<div class="empty" id="empty" hidden><p>${t("С такими фильтрами предложений нет. Первый займ под 0% дают онлайн-МКО; когда такой партнёр подключится, его включат в админке.", "Bunday filtrlar bilan taklif yo‘q. Birinchi qarzni 0% bilan onlayn MKTlar beradi; bunday hamkor ulanganda u admin panelda yoqiladi.")}</p><button type="button" class="btn btn-p btn-s" id="reset">${t("Сбросить фильтры", "Filtrlarni tozalash")}</button></div>
<div class="warn-s">${ICON.warn}<span>${WARN[l]} ${t("Расчёт предварительный, по аннуитету без комиссий и страховок банка. Решение, ставку и полную стоимость кредита даёт банк.", "Hisob dastlabki, bank komissiyalari va sug‘urtalarisiz annuitet bo‘yicha. Qaror, stavka va kreditning to‘liq qiymatini bank beradi.")}</span></div>
</div></section>
<div class="cmp" id="cmp" data-addon="compare"><b></b><button type="button" class="btn btn-a btn-s" id="cmpgo">${t("Сравнить", "Solishtirish")}</button></div>`;
}

function how(l, t) {
  const e = example();
  return `<section class="sec dark" id="how"><div class="wrap grid2">
<div><p class="kick"><i></i>${t("Как мы считаем", "Qanday hisoblaymiz")}</p>
<h2 class="h2">${t("Платёж равными частями, как в договоре банка", "To‘lov teng qismlarda, bank shartnomasidagidek")}</h2>
<p class="lead">${t("Микрозаймы в Узбекистане чаще гасят аннуитетом: каждый месяц одна и та же сумма. В начале в ней больше процентов, к концу больше долга.", "O‘zbekistonda mikroqarzlar ko‘pincha annuitet bilan to‘lanadi: har oy bir xil summa. Boshida unda foiz ko‘proq, oxiriga qarz ko‘proq.")}</p>
<ol class="steps"><li>${t("Берём ставку банка для вашего срока. Если банк называет вилку, считаем по нижней и по верхней.", "Muddatingiz uchun bank stavkasini olamiz. Bank oraliq aytsa, quyi va yuqori bo‘yicha hisoblaymiz.")}</li><li>${t("Переплата: все платежи минус сумма займа.", "Ortiqcha to‘lov: barcha to‘lovlar minus qarz summasi.")}</li><li>${t("Комиссии и страховки банка в расчёт не входят: они в полной стоимости кредита в информационном листе банка.", "Bank komissiyalari va sug‘urtalari hisobga kirmaydi: ular bankning axborot varag‘idagi kreditning to‘liq qiymatida.")}</li></ol></div>
<div><div class="formula">${t("Платёж", "To‘lov")} = S × r ÷ (1 − (1 + r)<sup>−n</sup>)<small>${t("S: сумма, r: годовая ставка ÷ 12, n: месяцев", "S: summa, r: yillik stavka ÷ 12, n: oylar")}</small></div>
<div class="panel" style="margin:16px 0 0;color:var(--ink)"><p class="mu" style="margin:0">${t("Пример: 10 млн сум на 12 месяцев", "Misol: 12 oyga 10 mln so‘m")}, ${esc(e.p.bank[l])}, ${String(e.r).replace(".", ",")}%</p><p style="margin:8px 0 0;font-size:22px;font-family:var(--f1)"><b>${fmt(e.pay)} ${t("сум в месяц", "so‘m oyiga")}</b></p><p class="mu" style="margin:4px 0 0">${t("переплата", "ortiqcha to‘lov")} ${fmt(e.over)} ${t("сум", "so‘m")}</p></div></div>
</div></section>`;
}

function blocks(l, t) {
  const qs = [
    [t("Микрозайм 10 млн на год", "Bir yilga 10 mln mikroqarz"), { s: 1e7, n: 12 }],
    [t("Займ без справок", "Ma’lumotnomasiz qarz"), { s: 5e6, n: 12, f: { docs: true } }],
    [t("Онлайн займ на карту", "Kartaga onlayn qarz"), { s: 3e6, n: 6, f: { card: true, online: true } }],
    [t("50 млн на 3 года", "3 yilga 50 mln"), { s: 5e7, n: 36 }],
    [t("Микрозайм 100 млн на 5 лет", "5 yilga 100 mln mikroqarz"), { s: 1e8, n: 60 }],
  ];
  return `<section class="sec" id="dti" data-addon="dti"><div class="wrap grid2">
<div><p class="kick"><i></i>${t("Перед заявкой", "Arizadan oldin")}</p><h2 class="h2">${t("Сколько ещё можно платить в месяц", "Oyiga yana qancha to‘lash mumkin")}</h2>
<p class="lead">${t("Банки смотрят долговую нагрузку: какая часть дохода уходит на платежи. Uzum Bank, например, требует не больше половины. Проверьте себя до заявки, чтобы не собирать отказы в кредитной истории.", "Banklar qarz yukiga qaraydi: daromadning qancha qismi to‘lovlarga ketadi. Masalan, Uzum Bank yarmidan oshmasligini talab qiladi. Kredit tarixida rad javoblarini yig‘maslik uchun arizadan oldin o‘zingizni tekshiring.")}</p></div>
<div class="panel"><label for="dinc"><b>${t("Доход в месяц, сум", "Oylik daromad, so‘m")}</b></label><div class="row" style="margin-top:8px"><input class="inp" id="dinc" type="number" inputmode="numeric" min="0" step="100000" placeholder="8000000"></div>
<label for="dcur" style="display:block;margin:16px 0 0"><b>${t("Платежи по другим займам в месяц, сум", "Boshqa qarzlar bo‘yicha oylik to‘lovlar, so‘m")}</b></label><div class="row" style="margin-top:8px"><input class="inp" id="dcur" type="number" inputmode="numeric" min="0" step="100000" placeholder="0"></div>
<div class="dti-out" id="dout" aria-live="polite"></div></div>
</div></section>
<section class="sec" id="seo" data-addon="seo" style="background:var(--s2)"><div class="wrap">
<p class="kick"><i></i>${t("Частые запросы", "Ko‘p so‘rovlar")}</p><h2 class="h2">${t("Что чаще всего ищут", "Eng ko‘p nima qidiriladi")}</h2>
<p class="lead">${t("У каждого запроса будет своя страница на двух языках. Здесь кнопка сразу ставит сумму, срок и фильтр.", "Har bir so‘rovning ikki tilda o‘z sahifasi bo‘ladi. Bu yerda tugma darhol summa, muddat va filtrni qo‘yadi.")}</p>
<div class="qs">${qs.map(([n, q]) => `<button type="button" data-q='${JSON.stringify(q)}'>${n}</button>`).join("")}</div>
</div></section>
<section class="sec" id="notify" data-addon="notify"><div class="wrap grid2">
<div><p class="kick"><i></i>${t("Подписка", "Obuna")}</p><h2 class="h2">${t("Напишем, когда ставка станет ниже", "Stavka pasayganda yozamiz")}</h2><p class="lead">${t("Партнёр снизил ставку или подключился новый банк: придёт сообщение в Telegram со ссылкой на предложение.", "Hamkor stavkani pasaytirdi yoki yangi bank ulandi: Telegramga taklif havolasi bilan xabar keladi.")}</p></div>
<form class="panel" id="nform"><label for="ntg"><b>Telegram</b></label><div class="row" style="margin-top:8px"><input class="inp" id="ntg" placeholder="@username" autocomplete="off"></div>
<label for="nrate" style="display:block;margin:16px 0 0"><b>${t("Ставка не выше, % годовых", "Stavka yuqori emas, yillik %")}</b></label><div class="row" style="margin-top:8px"><select class="inp" id="nrate">${[24, 26, 28, 30].map((r) => `<option value="${r}">${r}%</option>`).join("")}</select><button class="btn btn-p" type="submit">${t("Подписаться", "Obuna bo‘lish")}</button></div></form>
</div></section>
<section class="sec dark" id="bot" data-addon="bot"><div class="wrap grid2">
<div><p class="kick"><i></i>Telegram</p><h2 class="h2">${t("Подбор займа в боте", "Botda qarz tanlash")}</h2><p class="lead">${t("Сумма и срок в два нажатия, три лучших предложения с платежом и кнопкой «Получить». За три дня до платежа бот напомнит.", "Ikki bosishda summa va muddat, to‘lov va «Olish» tugmasi bilan uchta eng yaxshi taklif. To‘lovdan uch kun oldin bot eslatadi.")}</p></div>
<div class="phone" aria-hidden="true"><div><span class="msg me">${t("10 млн на 12 мес.", "12 oyga 10 mln")}</span><span class="msg">${t("Лучшие три:", "Eng yaxshi uchta:")}<br><b>${esc(example().p.bank[l])}</b>: ${fmt(example().pay)} ${t("сум/мес", "so‘m/oy")}<br><span class="btn btn-a">${t("Получить", "Olish")}</span></span><span class="msg">${t("Напомню о платеже 12-го числа.", "Oyning 12-sanasida to‘lovni eslataman.")}</span></div></div>
</div></section>
<section class="sec" id="pwa" data-addon="pwa"><div class="wrap grid2">
<div><p class="kick"><i></i>${t("На экране телефона", "Telefon ekranida")}</p><h2 class="h2">${t("Сайт как приложение", "Ilova kabi sayt")}</h2><p class="lead">${t("Значок Qiyos на экране телефона без App Store. Последний расчёт открывается и без сети.", "Telefon ekranida App Store’siz Qiyos belgisi. Oxirgi hisob internetsiz ham ochiladi.")}</p></div>
<div class="panel" style="display:flex;gap:16px;align-items:center">${ICON.phone.replace("<svg", '<svg style="width:48px;height:48px;color:var(--pr)"')}<p style="margin:0">${t("Поделиться → «На экран „Домой“»", "Ulashish → «Bosh ekranga»")}</p></div>
</div></section>`;
}

function partners(l, t) {
  const logos = P.map((p) => `<span><img src="${IMG}/logo/${p.logo}" alt="${esc(p.bank[l])}" loading="lazy" width="80" height="36"></span>`).join("");
  return `<section id="partners" aria-label="${t("Партнёры", "Hamkorlar")}"><div class="velo"><div>${logos}${logos.replace(/alt="[^"]*"/g, 'alt=""')}</div></div></section>
<section class="sec"><div class="wrap grid2">
<div><p class="kick"><i></i>${t("Партнёры", "Hamkorlar")}</p><h2 class="h2">${t("Только банки с лицензией ЦБ", "Faqat MB litsenziyasiga ega banklar")}</h2>
<p class="lead">${t("Номер лицензии стоит на каждой карточке. Условия сняты с открытых страниц банков; если банк их поменял, правка в админке меняет страницу сразу.", "Litsenziya raqami har bir kartochkada turibdi. Shartlar banklarning ochiq sahifalaridan olingan; bank ularni o‘zgartirsa, admin paneldagi tuzatish sahifani darhol o‘zgartiradi.")}</p></div>
<div class="panel" id="postback" data-addon="postback"><h3 style="font-size:22px">${t("Банкам и МКО", "Banklar va MKTlarga")}</h3><p class="mu">${t("Подключим вашу партнёрскую программу: переход с меткой, а «заявка, одобрено, выдано» вы присылаете запросом или через сеть, например «[[t:0]] CPA». Вознаграждение считается само.", "Hamkorlik dasturingizni ulaymiz: belgili o‘tish, «ariza, ma’qullandi, berildi»ni esa so‘rov orqali yoki tarmoq orqali yuborasiz, masalan «[[t:0]] CPA». Mukofot o‘zi hisoblanadi.")}</p>
<p class="formula" style="font-size:14px;margin:16px 0 0">GET /pb?sub_id=7001&amp;status=issued&amp;amount=10000000</p>
<a class="btn btn-p" style="margin:16px 0 0" href="${BRAND.tg}" target="_blank" rel="noopener">${ICON.tg}<span>${t("Стать партнёром", "Hamkor bo‘lish")}</span></a></div>
</div></section>
<section class="sec" id="admin" data-addon="admin" style="background:var(--s2)"><div class="wrap grid2">
<div><p class="kick"><i></i>${t("Для команды сервиса", "Servis jamoasi uchun")}</p><h2 class="h2">${t("Админка партнёров и переходов", "Hamkorlar va o‘tishlar admin paneli")}</h2><p class="lead">${t("Скрыть банк, поменять ставку или ссылку, поставить «рекомендуем»: страница меняется сразу. Каждый переход «Получить» с суммой и сроком приходит первой строкой.", "Bankni yashirish, stavka yoki havolani o‘zgartirish, «tavsiya» qo‘yish: sahifa darhol o‘zgaradi. Har bir «Olish» o‘tishi summa va muddat bilan birinchi qatorda keladi.")}</p></div>
<a class="btn btn-p" href="${href(l, "panel")}">${ICON.panel}<span>${t("Открыть админку", "Admin panelni ochish")}</span></a>
</div></section>`;
}

function faq(l, t) {
  return `<section class="sec faq" id="faq"><div class="wrap" style="max-width:880px">
<p class="kick"><i></i>${t("Вопросы", "Savollar")}</p><h2 class="h2">${t("Коротко о главном", "Asosiysi haqida qisqacha")}</h2>
${FAQ[l].map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}
</div></section>`;
}

function footer(l, t, to = "site") {
  return `<footer class="foot"><div class="wrap"><div class="fgrid">
<div>${LOGO(l, to, true)}<p style="margin:16px 0 0">${t("Qiyos не выдаёт займы и не принимает решений по ним. Мы сравниваем открытые условия банков с лицензией ЦБ Республики Узбекистан. Кредитор и условия указаны на каждой карточке.", "Qiyos qarz bermaydi va ular bo‘yicha qaror qabul qilmaydi. Biz O‘zbekiston Respublikasi MB litsenziyasiga ega banklarning ochiq shartlarini solishtiramiz. Kreditor va shartlar har bir kartochkada ko‘rsatilgan.")}</p><p style="margin:12px 0 0;font-weight:700;color:var(--gold)">${WARN[l]}</p></div>
<div><h4>${t("Макет", "Maket")}</h4><a href="${href(l, "site")}">${t("Сайт", "Sayt")}</a><a href="${href(l, "panel")}">${t("Админка", "Admin panel")}</a><a href="${href(l)}#offer">${t("Стоимость", "Narxi")}</a></div>
<div><h4>DevUz Studio</h4><a href="https://devuz.studio" target="_blank" rel="noopener">devuz.studio</a><a href="${BRAND.tg}" target="_blank" rel="noopener">Telegram</a></div>
</div>
<div class="sm"><span>${t("Ставки, суммы, сроки и лицензии: открытые страницы банков на 18.11.2026. Логотипы принадлежат банкам. Переходы, выдачи и вознаграждение в админке: демо.", "Stavkalar, summalar, muddatlar va litsenziyalar: banklarning 18.11.2026 holatidagi ochiq sahifalari. Logotiplar banklarga tegishli. Admin paneldagi o‘tishlar, berilgan qarzlar va mukofot: demo.")}</span><span>${termsLine(l, t)}</span></div>
</div></footer>`;
}

function sitePage(l) {
  const t = T(l);
  const data = {
    t: siteDict(l), img: IMG, smin: 500000, smax: 100000000, down: ICON.down, info: ICON.info,
    p: P.map((p) => ({ id: p.id, logo: p.logo, bank: p.bank[l], legal: p.legal[l], product: p.product[l], lic: p.lic, min: p.min, max: p.max, tmin: p.tmin, tmax: p.tmax, step: p.step || 0, tiers: p.tiers || null, lo: p.lo ?? null, hi: p.hi === undefined ? (p.tiers ? undefined : null) : p.hi, online: p.online, docs: p.docs, card: p.card, zero: p.zero, noPledge: p.noPledge, who: p.who[l], how: p.how[l], pledge: p.pledge[l], src: p.src })),
  };
  return `${head(l, t("Qiyos: сравнить микрозаймы банков Узбекистана", "Qiyos: O‘zbekiston banklari mikroqarzlarini solishtirish"), t("Микрозаймы банков Узбекистана с лицензией ЦБ: платёж в месяц, переплата и итог для вашей суммы и срока.", "MB litsenziyasiga ega O‘zbekiston banklari mikroqarzlari: summa va muddatingiz uchun oylik to‘lov, ortiqcha to‘lov va jami."))}
<style>${CSS}</style>
</head>
<body>
${header(l, t)}
<main>
${hero(l, t)}
${offers(l, t)}
${how(l, t)}
${blocks(l, t)}
${partners(l, t)}
${faq(l, t)}
</main>
${footer(l, t)}
<div class="sheet" id="sheet" role="dialog" aria-modal="true" aria-label="${t("Окно", "Oyna")}"><div><button type="button" class="x" aria-label="${t("Закрыть", "Yopish")}">${ICON.close}</button><div class="sh-b"></div></div></div>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script type="application/json" id="qy-data">${json(data)}</script>
<script>
${JS}</script>
</body>
</html>`;
}

/* ── Первая страница макета ──────────────────────────────────────── */
function offer(l, t) {
  return `<section class="sec" id="offer"><div class="wrap">
<p class="kick"><i></i>${t("Предложение DevUz Studio", "DevUz Studio taklifi")}</p>
<h2 class="h2">${t("Сайт по этому макету", "Shu maket bo‘yicha sayt")}</h2>
<p class="lead">${t(`48 часов с первого открытия макета: сайт ${usd(BASE.promo)} вместо ${usd(BASE.price)}. Допы включаются тумблером, и их блок на сайте тут же появляется или пропадает.`, `Maket birinchi ochilganidan 48 soat: sayt ${usd(BASE.price)} o‘rniga ${usd(BASE.promo)}. Qo‘shimchalar tumbler bilan yoqiladi va ularning bloki saytda darhol paydo bo‘ladi yoki yo‘qoladi.`)}</p>
<div class="cst"><div>
<div class="base"><div class="hd"><b>${esc(BASE[l].t)}</b><span class="pp"><s>${usd(BASE.price)}</s>${usd(BASE.promo)}</span></div><p>${esc(BASE[l].d)}</p></div>
<div class="adds">${ADDONS.map((a) => `<label class="add"><input type="checkbox" data-add="${a.id}" checked><span class="sw" aria-hidden="true"></span><span><b>${esc(a[l].t)}</b>${a.star ? `<span class="star">${t("берут первым", "birinchi oladilar")}</span>` : ""}<p>${esc(a[l].e)}</p><small>${esc(a[l].who)}</small></span><span class="ap">${usd(a.price)}</span></label>`).join("")}</div>
</div>
<aside class="sum" aria-live="polite">
<div class="row"><span>${t("Сайт", "Sayt")}</span><span>${usd(BASE.promo)}</span></div>
<div class="row"><span>${t("Допы", "Qo‘shimchalar")} <span id="addn"></span></span><span id="adds">0 $</span></div>
<div class="tot"><span>${t("Итого", "Jami")}</span><b id="total">${usd(ALL)}</b></div>
<p style="margin:8px 0 0;color:var(--mu);font-size:14px">${t("Цена сайта держится:", "Sayt narxi amal qiladi:")}</p>
<div class="timer"><span><b id="th">48</b><small>${t("часов", "soat")}</small></span><span><b id="tm">00</b><small>${t("минут", "daqiqa")}</small></span><span><b id="ts">00</b><small>${t("секунд", "soniya")}</small></span></div>
<div class="ctrl"><button type="button" class="btn btn-g btn-s" id="allon">${t("Всё из макета", "Maketdagi hammasi")}</button><button type="button" class="btn btn-g btn-s" id="alloff">${t("Только сайт", "Faqat sayt")}</button></div>
<button type="button" class="btn btn-g" id="copy">${ICON.copy}<span>${t("Скопировать состав", "Tarkibni nusxalash")}</span></button>
<a class="btn btn-a" href="${BRAND.tg}" target="_blank" rel="noopener">${ICON.tg}<span>${t("Обсудить с DevUz Studio", "DevUz Studio bilan muhokama qilish")}</span></a>
</aside></div>
</div></section>`;
}

function landPage(l) {
  const t = T(l);
  const e = example();
  const li = (a) => `<ul class="feat">${a.map((x) => `<li>${ICON.check}<span>${x}</span></li>`).join("")}</ul>`;
  const site = [
    t("Сумма и срок ползунками или цифрами", "Summa va muddat slayder yoki raqam bilan"),
    t(`${P.length} банков с лицензией ЦБ: ставки, суммы и сроки с их сайтов`, `MB litsenziyasiga ega ${P.length} ta bank: stavka, summa va muddatlar ularning saytidan`),
    t("Платёж в месяц, переплата и итог в каждом банке", "Har bir bankda oylik to‘lov, ortiqcha to‘lov va jami"),
    t("Сортировка, фильтры «без справок», «на карту», «онлайн»", "Saralash, «ma’lumotnomasiz», «kartaga», «onlayn» filtrlari"),
    t("«Получить»: партнёрская ссылка, переход виден в админке", "«Olish»: hamkorlik havolasi, o‘tish admin panelda ko‘rinadi"),
  ];
  const pan = [
    t("Переход с сайта первой строкой: банк, сумма, срок, платёж", "Saytdan o‘tish birinchi qatorda: bank, summa, muddat, to‘lov"),
    t("Партнёры: скрыть, ставка, суммы, ссылка, «рекомендуем»", "Hamkorlar: yashirish, stavka, summalar, havola, «tavsiya»"),
    t("Выдачи и вознаграждение по банкам, конверсия", "Banklar bo‘yicha berilgan qarzlar va mukofot, konversiya"),
    t("Роли: менеджер не видит выплаты, история действий", "Rollar: menejer to‘lovlarni ko‘rmaydi, harakatlar tarixi"),
  ];
  const steps = [
    t("Откройте сайт, поставьте сумму и срок: карточки банков переедут по новому платежу.", "Saytni oching, summa va muddatni qo‘ying: bank kartochkalari yangi to‘lov bo‘yicha joy almashadi."),
    t("Нажмите «Получить» у любого банка: откроется страница банка с меткой перехода.", "Istalgan bankda «Olish»ni bosing: o‘tish belgisi bilan bank sahifasi ochiladi."),
    t("Откройте админку: переход первой строкой. Поставьте «Выдано», и на сайте в «Мои заявки» появится статус.", "Admin panelni oching: o‘tish birinchi qatorda. «Berildi» qo‘ying, saytda «Arizalarim»da holat paydo bo‘ladi."),
    t("В админке скройте банк или поменяйте ставку: сайт пересчитает сразу.", "Admin panelda bankni yashiring yoki stavkani o‘zgartiring: sayt darhol qayta hisoblaydi."),
  ];
  const ld = { base: BASE.promo, hours: OFFER_HOURS, add: ADDONS.map((a) => ({ id: a.id, p: a.price, t: a[l].t })), t: { copied: t("Состав скопирован", "Tarkib nusxalandi"), tot: t("Итого", "Jami") } };
  return `${head(l, t("Qiyos · макет сайта и админки · DevUz Studio", "Qiyos · sayt va admin panel maketi · DevUz Studio"), t("Макет агрегатора микрозаймов Узбекистана: сайт-сравнение и админка партнёров. Конструктор цены.", "O‘zbekiston mikroqarzlar agregatori maketi: solishtirish sayti va hamkorlar admin paneli. Narx konstruktori."))}
<style>${CSS}</style>
</head>
<body>
${dzIntroSolo(l)}
<header class="top"><div class="top-in">
${LOGO(l, "")}
<nav class="nav" aria-label="${t("Разделы", "Bo‘limlar")}"><a href="#choose">${t("Что посмотреть", "Nimani ko‘rish")}</a><a href="#try">${t("Как проверить", "Qanday tekshirish")}</a><a href="#offer">${t("Стоимость", "Narxi")}</a></nav>
<div class="langs">${LANGS.map((x) => `<a href="${href(x)}" hreflang="${x}" lang="${x}"${x === l ? ' aria-current="true"' : ""}>${x.toUpperCase()}</a>`).join("")}</div>
<a class="btn btn-p btn-s" href="${href(l, "panel")}">${ICON.panel}<span>${t("Админка", "Admin panel")}</span></a>
</div></header>
<main>
<section class="fly" id="fly" aria-label="${t("Залёт в знак Qiyos", "Qiyos belgisiga uchib kirish")}"><div class="fly-st">
<div class="ring" aria-hidden="true"><svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="80" fill="none" stroke="#f0b429" stroke-width="22"/><circle cx="100" cy="100" r="80" fill="none" stroke="#0a4b43" stroke-width="2" stroke-dasharray="2 10"/><circle cx="100" cy="100" r="26" fill="#f0b429"/></svg></div>
<div class="fly-tx"><p class="kick" style="color:var(--gold);justify-content:center"><i></i>${t("Макет DevUz Studio", "DevUz Studio maketi")}</p>
<h1>${t(`Все микрозаймы <em>в&nbsp;одном окне</em>`, `Barcha mikroqarzlar <em>bitta oynada</em>`)}</h1>
<p class="lead">${t("Человек выбирает сумму и срок, а банки-партнёры выстраиваются по платежу. Каждое «Получить» идёт по вашей партнёрской ссылке.", "Odam summa va muddatni tanlaydi, hamkor banklar esa to‘lov bo‘yicha saf tortadi. Har bir «Olish» sizning hamkorlik havolangiz orqali o‘tadi.")}</p></div>
<div class="fly-end"><div class="fly-card"><small>${t("10 млн сум на 12 месяцев, лучший платёж", "12 oyga 10 mln so‘m, eng yaxshi to‘lov")}</small><b>${fmt(e.pay)} ${t("сум", "so‘m")}</b><small>${esc(e.p.bank[l])}, ${String(e.r).replace(".", ",")}% ${t("годовых", "yillik")}</small><a class="btn btn-a" href="${href(l, "site")}">${t("Открыть сайт", "Saytni ochish")}${ICON.arrow}</a></div></div>
<p class="hint-s" aria-hidden="true">${t("Листайте", "Aylantiring")}</p>
</div></section>
<section class="sec" id="choose"><div class="wrap">
<p class="kick"><i></i>${t("Сайт и админка связаны", "Sayt va admin panel bog‘langan")}</p>
<h2 class="h2">${t("Что посмотреть первым", "Avval nimani ko‘rish")}</h2>
<p class="lead">${t(`Это работающий макет на настоящих условиях ${P.length} банков Узбекистана. Сайт, каким его увидит человек, или админка, где команда ведёт партнёров и переходы.`, `Bu O‘zbekistonning ${P.length} ta banki haqiqiy shartlaridagi ishlaydigan maket. Odam ko‘radigan sayt yoki jamoa hamkorlar va o‘tishlarni olib boradigan admin panel.`)}</p>
<div class="choices">
<a class="choice rise" href="${href(l, "site")}"><span class="ch-k">${t("Для заёмщика", "Qarz oluvchi uchun")}</span><b>${t("Сайт-сравнение", "Solishtirish sayti")}</b>${li(site)}<span class="btn btn-a">${t("Открыть сайт", "Saytni ochish")}${ICON.arrow}</span></a>
<a class="choice rise" href="${href(l, "panel")}"><span class="ch-k">${t("Для вас и команды", "Siz va jamoa uchun")}</span><b>${t("Админка партнёров", "Hamkorlar admin paneli")}</b>${li(pan)}<span class="btn btn-p">${t("Открыть админку", "Admin panelni ochish")}${ICON.arrow}</span></a>
</div></div></section>
<section class="sec" id="try" style="background:var(--s2)"><div class="wrap">
<p class="kick"><i></i>${t("Как проверить за минуту", "Bir daqiqada qanday tekshirish")}</p>
<h2 class="h2">${t("Сайт и админка в одном состоянии", "Sayt va admin panel bitta holatda")}</h2>
<ol class="ol">${steps.map((s) => `<li class="rise">${s}</li>`).join("")}</ol>
</div></section>
${offer(l, t)}
</main>
${footer(l, t, "")}
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script type="application/json" id="qy-land">${json(ld)}</script>
<script>
${LAND_JS}</script>
</body>
</html>`;
}

/* ── Админка ─────────────────────────────────────────────────────── */
(function checkDict() {
  const keys = new Set([...PANEL_JS.matchAll(/\bt\('([A-Za-z0-9_]+)'/g)].map((m) => m[1]));
  for (const k of ["tab_", "st_", "role_"]) keys.delete(k);
  for (const k of keys) {
    const v = PANEL_UI[k];
    if (!v || v.length !== 2 || v.some((x) => !x)) throw new Error(`panel: нет подписи «${k}» на двух языках`);
    if (/[А-Яа-яЁё]/.test(v[1])) throw new Error(`panel: кириллица в узбекской подписи «${k}»`);
  }
  if (/[А-Яа-яЁё]/.test(PANEL_JS + PANEL_CSS)) throw new Error("panel: кириллица в коде панели");
})();

function panelPage(l) {
  const t = T(l);
  const ui = Object.fromEntries(Object.entries(PANEL_UI).map(([k, v]) => [k, v[l === "ru" ? 0 : 1]]));
  const pd = {
    l, sum: l === "ru" ? "сум" : "so‘m", site: href(l, "site"), home: href(l), ui, img: IMG,
    p: P.map((p) => ({ id: p.id, logo: p.logo, bank: p.bank[l], lic: p.lic.n, min: p.min, max: p.max, tmin: p.tmin, tmax: p.tmax, lo: ratesFor(p, p.tmin)[0], hi: p.tiers ? p.tiers[p.tiers.length - 1][1] : p.hi, src: p.src })),
  };
  return `${head(l, t("Админка Qiyos · демо", "Qiyos admin paneli · demo"), t("Админка агрегатора: партнёры, переходы, выдачи и вознаграждение, роли и история. Демо-данные.", "Agregator admin paneli: hamkorlar, o‘tishlar, berilgan qarzlar va mukofot, rollar va tarix. Demo ma’lumotlar."), "#071a17")}
<style>${PANEL_CSS}</style>
</head>
<body class="pn">
<div id="app"></div>
<footer class="pn-foot">${t("Макет DevUz Studio, демо-данные. Пользуясь макетом, вы принимаете", "DevUz Studio maketi, demo ma’lumotlar. Maketdan foydalanib, siz")} <a href="${TERMS(l)}" target="_blank" rel="noopener">${t("условия макета", "maket shartlarini qabul qilasiz")}</a>${t(".", "")}</footer>
<script type="application/json" id="pn-data">${json(pd)}</script>
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
    const js = (v.match(/id="qy-data">([\s\S]*?)<\/script>/) || [])[1] || "";
    if (/[А-Яа-яЁё]/.test(js)) throw new Error(`${k}: кириллица в данных узбекской страницы`);
  }
  if (/[—–]/.test(v.replace(/<script[\s\S]*?<\/script>/g, ""))) throw new Error(`${k}: длинное тире на странице`);
  if (/href="#"/.test(v)) throw new Error(`${k}: ссылка в никуда`);
}
mkdirSync(DIR + "out", { recursive: true });
writeFileSync(DIR + "out/pages.json", JSON.stringify(out));

/* Сборка для сервера (lib/proto/bundles): стили и скрипты один раз. */
const parts = { J: `<script>\n${JS}</script>`, C: `<style>${CSS}</style>`, PJ: `<script>\n${PANEL_JS}</script>`, PC: `<style>${PANEL_CSS}</style>`, LJ: `<script>\n${LAND_JS}</script>` };
const pages = {};
for (const [key, html] of Object.entries(out)) {
  let p = html;
  for (const [name, part] of Object.entries(parts)) p = p.split(part).join(`@@${name}@@`);
  pages[key] = p;
}
const bundleDir = new URL("../../../content/proto-bundles/", import.meta.url).pathname;
mkdirSync(bundleDir, { recursive: true });
writeFileSync(bundleDir + "qiyos.json", JSON.stringify({ parts, pages }));
for (const [k, v] of Object.entries(out)) console.log((k || "(ru)").padEnd(10), v.length);
