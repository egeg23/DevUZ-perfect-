import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dzIntroSolo } from "../../../lib/proto/dz-video.mjs";
import { F, TAG, MISSION, DIRS, WHO, COURSES, WEBINARS, WHY, TEAM, IMPORTANT, PATH, REVIEWS, FAQ } from "./data.mjs";
import { BASE, ADDONS, OFFER_HOURS, ALL } from "./plan.mjs";
import { PANEL_UI } from "./ui.mjs";

for (const k of Object.keys(PANEL_UI.ru)) if (!(k in PANEL_UI.uz)) throw new Error("panel: нет подписи uz." + k);
const DEMO = { ru: ["[[t:2]]", "Дилноза", "Тимур", "[[t:3]]", "Севара", "Бехзод"], uz: ["[[t:2]]", "Dilnoza", "Temur", "[[t:3]]", "Sevara", "Behzod"] };

/*
 * Макет ASAPHARM Academy (asapharmacademy.uz), 20.11.2026: «Школа
 * регистратора» в Ташкенте, учебный центр по регистрации лекарственных
 * средств. Лендинг на ru и uz и панель заявок (доп):
 *
 *   ""      — лендинг: первый экран с преимуществами и записью на ближайший
 *             поток, «Кому полезно» тремя дверями (Bettr Academy), «Путь
 *             досье» при прокрутке, курсы, подбор курса, вебинары, почему
 *             важно, почему мы стопкой карточек, команда, сертификат,
 *             отзывы, вопросы, заявка, конструктор цены;
 *   panel   — панель: заявки с сайта первой строкой, потоки, вебинары,
 *             роли и история (эталон Greenwell, вид Glassy V2).
 *
 * Факты — data.mjs (только с их сайта), разведка и awwwards —
 * docs/research/asapharm.md. Формы не уходят наружу: заявка ложится в
 * браузер (её видит панель) и открывает Telegram администратора академии
 * с готовым текстом. Модель макет не вызывает.
 */

const DIR = new URL(".", import.meta.url).pathname;
const IMG = "/protos/asapharm";
const strip = (s) => s.replace(/\/\*(?!~\*\/)[\s\S]*?\*\//g, "");
const CSS = strip(readFileSync(DIR + "style.css", "utf8")).replace(/\n\s*/g, "");
const JS = strip(readFileSync(DIR + "site.js", "utf8")).replace(/\n\s*\n/g, "\n");
const PANEL_CSS = strip(readFileSync(DIR + "panel.css", "utf8")).replace(/\n\s*/g, "");
const PANEL_JS = strip(readFileSync(DIR + "panel.js", "utf8")).replace(/\n\s*\n/g, "\n");
const BASE_URL = "__PROTO_BASE__";
const FONTS = "https://fonts.googleapis.com/css2?family=Montserrat:wght@700&family=Manrope:wght@400;700&display=swap";
const KEY = { ru: "", uz: "uz" };
const DEVUZ = "https://t.me/Devuz_studio_bot?start=asapharm";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const href = (l, p = "") => BASE_URL + (KEY[l] ? "/" + KEY[l] : "") + "/" + p;
const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");
const usd = (n) => `${fmt(n)}\u00a0$`;
const MONTHS = { ru: ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"], uz: ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"] };
const day = (l, iso) => { const [, m, d] = iso.split("-").map(Number); return l === "ru" ? `${d} ${MONTHS.ru[m - 1]}` : `${d}-${MONTHS.uz[m - 1]}`; };

const I = (dd) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${dd}</svg>`;
const ICON = {
  arrow: I('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  check: I('<path d="m5 12 5 5 9-10"/>'),
  phone: I('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/>'),
  tg: I('<path d="M21 4 3 11l6 2 2 6 3-4 5 4Z"/><path d="m9 13 8-6"/>'),
  mail: I('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>'),
  pin: I('<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  build: I('<path d="M4 21V5l8-2v18M12 8l8 2v11M3 21h18M7 9h2M7 13h2M7 17h2M15 13h2M15 17h2"/>'),
  badge: I('<rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M8 17c1-2 7-2 8 0"/>'),
  cap: I('<path d="m2 9 10-5 10 5-10 5Z"/><path d="M6 11v5c3 2 9 2 12 0v-5M22 9v6"/>'),
  fresh: I('<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>'),
  formats: I('<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>'),
  anywhere: I('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'),
  team: I('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a5.5 5.5 0 0 1 3.5 6"/>'),
  clock: I('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  cal: I('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
  plus: I('<path d="M12 5v14M5 12h14"/>'),
  search: I('<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>'),
  panel: I('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 9v11"/>'),
  copy: I('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>'),
  play: I('<path d="M8 5v14l11-7z"/>'),
};

/* Знак академии — их PNG (книга и глобус) маской: цвет даёт CSS. */
const MARK = `<span class="mk" aria-hidden="true"></span>`;

function build(l, path) {
  const t = (ru, uz) => (l === "ru" ? ru : uz);
  const other = l === "ru" ? "uz" : "ru";
  const TERMS = `https://devuz.studio/${l}/mockup-terms`;
  const tgText = t("Здравствуйте! Хочу записаться на обучение в ASAPHARM Academy.", "Assalomu alaykum! ASAPHARM Academy’da o‘qishga yozilmoqchiman.");
  const tgUrl = (text) => `https://t.me/${F.tg}?text=${encodeURIComponent(text)}`;
  const btn = (cls, label, attrs = "") => `<a class="btn ${cls}" ${attrs}>${label}</a>`;
  const kick = (s) => `<p class="kick"><i></i>${s}</p>`;
  const tag = (s) => `<span class="tag">DevUz Studio</span>`.replace("DevUz Studio", s);
  const offer = t("Предложение DevUz Studio", "DevUz Studio taklifi");

  /* ── Шапка ── */
  const NAV = [["kursy", t("Курсы", "Kurslar")], ["vebinary", t("Вебинары", "Vebinarlar")], ["komanda", t("Команда", "Jamoa")], ["voprosy", t("Вопросы", "Savollar")]];
  const header = `<header class="top" id="top"><div class="wrap">
<a class="logo" href="${href(l)}" aria-label="${t("ASAPHARM Academy, на главную", "ASAPHARM Academy, bosh sahifaga")}">${MARK}<span><b>ASAPHARM</b><small>Academy</small></span></a>
<nav class="nav" aria-label="${t("Разделы", "Bo‘limlar")}">${NAV.map(([id, n]) => `<a href="#${id}">${n}</a>`).join("")}</nav>
<div class="top-r"><a class="top-tel" href="tel:${F.tel}">${F.phone}</a>
<span class="lang" role="group" aria-label="${t("Язык", "Til")}"><a href="${href("ru", path)}" lang="ru"${l === "ru" ? ' aria-current="true"' : ""}>RU</a><a href="${href("uz", path)}" lang="uz"${l === "uz" ? ' aria-current="true"' : ""}>UZ</a></span>
<a class="btn btn-coral btn-sm" href="#zayavka">${t("Записаться", "Yozilish")}</a></div>
</div></header>`;

  /* ── Первый экран ── */
  const next = COURSES[0];
  const hero = `<section class="hero" id="hero" aria-label="ASAPHARM Academy">
<picture class="hero-bg" aria-hidden="true"><source media="(max-width: 767px)" srcset="${IMG}/hero-m.webp"><source media="(max-width: 1279px)" srcset="${IMG}/hero-960.webp"><img src="${IMG}/hero.webp" alt="" width="1920" height="1072" fetchpriority="high"></picture>
<div class="hero-shade" aria-hidden="true"></div>
<canvas class="mol" id="mol" aria-hidden="true"></canvas>
<div class="wrap hero-in">
<div class="hero-txt">
${kick(t("Школа регистратора · Ташкент", "Registrator maktabi · Toshkent"))}
<h1 class="h1">${t("Освойте регистрацию лекарств: от первого досье до регистрационного удостоверения", "Dori vositalarini ro‘yxatdan o‘tkazishni o‘rganing: birinchi dosyedan ro‘yxatdan o‘tganlik guvohnomasigacha").split(" ").map((w, i) => `<span class="w" style="--i:${i}"><span>${w}</span></span>`).join(" ")}</h1>
<p class="lead">${TAG[l]}.</p>
<ul class="perks">${WHY.slice(0, 3).map((w) => `<li>${ICON.check}<span><b>${w[l].t}</b>${w[l].d.split(":")[0].split(".")[0]}</span></li>`).join("")}</ul>
<div class="cta"><a class="btn btn-coral" href="#zayavka">${t("Записаться на обучение", "O‘qishga yozilish")}${ICON.arrow}</a><a class="btn btn-ghost" href="#kursy">${t("Смотреть курсы", "Kurslarni ko‘rish")}</a></div>
</div>
<aside class="next glass" aria-label="${t("Ближайший поток", "Eng yaqin oqim")}" data-start="${next.start}">
<p class="next-k">${t("Ближайший поток", "Eng yaqin oqim")}</p>
<p class="next-t">${next[l].t}</p>
<p class="next-d">${ICON.cal}${t("Старт", "Start")} ${day(l, next.start)} · ${next.hours} ${t("ак. часа", "akad. soat")} · ${next.months} ${t("месяца", "oy")}</p>
<div class="cd" aria-live="polite"><span><b data-cd="d">0</b><small>${t("дней", "kun")}</small></span><span><b data-cd="h">0</b><small>${t("часов", "soat")}</small></span><span><b data-cd="m">0</b><small>${t("минут", "daqiqa")}</small></span></div>
<p class="cd-past" hidden>${t("Поток уже идёт: администратор запишет на следующий", "Oqim boshlangan: administrator keyingisiga yozadi")}</p>
<a class="btn btn-blue wide" href="#zayavka" data-course="base">${t("Занять место", "Joy band qilish")}</a>
<p class="next-s">${t("Офлайн в Ташкенте или онлайн", "Toshkentda oflayn yoki onlayn")}</p>
</aside>
</div>
</section>
<div class="mq" aria-hidden="true"><div class="mq-row">${[0, 1].map(() => [t("24 академических часа", "24 akademik soat"), t("48 академических часов", "48 akademik soat"), t("2 и 3 месяца", "2 va 3 oy"), t("6 вебинаров в ноябре", "Noyabrda 6 ta vebinar"), t("ВОЗ · ICH · ЕАЭС", "JSST · ICH · YeOII"), t("Офлайн и онлайн", "Oflayn va onlayn"), t("Законодательство РУз 2026", "O‘zR qonunchiligi 2026")].map((s) => `<span>${s}</span>`).join("")).join("")}</div></div>`;

  /* ── Три двери «Кому полезно» ── */
  const who = `<section class="sec" id="komu"><div class="wrap">
<div class="head rv">${kick(t("Кому мы будем полезны", "Kimga foydalimiz"))}<h2 class="h2">${t("С чего начнётся ваш путь в регистрации?", "Ro‘yxatdan o‘tkazishdagi yo‘lingiz nimadan boshlanadi?")}</h2></div>
<div class="doors">${WHO.map((w, i) => `<a class="door rv" style="--d:${i * 90}ms" href="${w.to === "corp" ? "#zayavka" : "#kurs-" + w.to}" data-course="${w.to}"><span class="door-ic">${ICON[w.ic]}</span><h3>${w[l].t}</h3><p>${w[l].d}</p><span class="door-go">${w[l].go}${ICON.arrow}</span></a>`).join("")}</div>
<ol class="dirs rv">${DIRS.map((d, i) => `<li><b>${String(i + 1).padStart(2, "0")}</b>${d[l]}</li>`).join("")}</ol>
</div></section>`;

  /* ── Путь досье (доп) ── */
  const path_ = `<section class="dos" id="dosye" data-addon="dossier" aria-label="${t("Путь досье", "Dosye yo‘li")}">
<div class="dos-pin"><div class="wrap dos-in">
<div class="dos-art" aria-hidden="true">
<div class="dos-desk"></div>
<div class="sheet s1"><i></i><i></i><i></i></div><div class="sheet s2"><i></i><i></i><i></i></div><div class="sheet s3"><i></i><i></i><i></i></div>
<div class="binder"><span>${t("ДОСЬЕ", "DOSYE")}</span><em>CTD</em></div>
<div class="lens"></div>
<div class="stamp">${t("ПРОВЕРЕНО", "TEKSHIRILDI")}</div>
<div class="ru-doc"><b>${t("Регистрационное удостоверение", "Ro‘yxatdan o‘tganlik guvohnomasi")}</b><i></i><i></i><i></i><span class="seal"></span></div>
</div>
<div class="dos-txt">
${kick(t("Путь досье · " + offer, "Dosye yo‘li · " + offer))}
<h2 class="h2">${t("Чему вы научитесь, по шагам регистрации", "Ro‘yxatdan o‘tkazish bosqichlari bo‘yicha nimani o‘rganasiz")}</h2>
${PATH.map((p, i) => `<div class="beat" data-beat="${i}"><p class="beat-n">${p[l].n}</p><h3>${p[l].t}</h3><p>${p[l].d}</p></div>`).join("")}
<div class="dos-bar" aria-hidden="true"><i></i></div>
</div>
</div></div>
</section>`;

  /* ── Курсы ── */
  const courseCard = (c, i) => `<article class="course rv" id="kurs-${c.k}" style="--d:${i * 90}ms">
<div class="course-ph"><img src="${IMG}/${c.img}.webp" alt="${esc(t("Занятие в ASAPHARM Academy", "ASAPHARM Academy’dagi dars"))}" width="700" height="393" loading="lazy"><span class="lvl">${c[l].lvl}</span></div>
<div class="course-b">
<h3>${c[l].t}</h3>
<ul class="meta"><li>${ICON.clock}${c.hours} ${t("академических часов", "akademik soat").replace("часов", c.hours === 24 ? "часа" : "часов")}</li><li>${ICON.cal}${c.months} ${t("месяца обучения", "oy o‘qish")}</li><li>${ICON.check}${t("Старт", "Start")} ${day(l, c.start)} 2026</li></ul>
<p class="for">${c[l].for}</p>
<details class="prog"><summary>${t("Что даст курс", "Kurs nima beradi")}</summary><p>${c[l].d}</p></details>
<div class="course-f"><span class="price">${t("Стоимость уточняйте", "Narxini so‘rang")}</span><a class="btn btn-blue btn-sm" href="#zayavka" data-course="${c.k}">${t("Записаться", "Yozilish")}</a></div>
</div></article>`;
  const online = `<article class="course course-on rv" id="kurs-online" style="--d:180ms">
<div class="course-ph"><img src="${IMG}/online.webp" alt="${esc(t("Онлайн-занятие: ноутбук на рабочем столе", "Onlayn dars: ish stolidagi noutbuk"))}" width="1100" height="821" loading="lazy"><span class="lvl">${t("Онлайн-формат", "Onlayn format")}</span><span class="ai-note">${t("иллюстрация", "illyustratsiya")}</span></div>
<div class="course-b">
<h3>${t("Те же курсы онлайн, плюс вебинары и профессиональные чаты", "Xuddi shu kurslar onlayn, qo‘shimcha vebinarlar va professional chatlar")}</h3>
<ul class="meta"><li>${ICON.anywhere}${t("На работе, дома, в путешествии", "Ishda, uyda, sayohatda")}</li><li>${ICON.play}${t("Вебинары по 2 часа", "2 soatlik vebinarlar")}</li><li>${ICON.team}${t("Профессиональные чаты", "Professional chatlar")}</li></ul>
<p class="for">${t("Тем, кто учится без отрыва от работы", "Ishdan ajralmasdan o‘qiydiganlarga")}</p>
<div class="fmt-sw" role="group" aria-label="${t("Формат", "Format")}"><button type="button" aria-pressed="true" data-fmt="online">${t("Онлайн", "Onlayn")}</button><button type="button" aria-pressed="false" data-fmt="offline">${t("Офлайн", "Oflayn")}</button></div>
<div class="course-f"><span class="price">${t("Стоимость уточняйте", "Narxini so‘rang")}</span><a class="btn btn-blue btn-sm" href="#zayavka" data-course="online">${t("Записаться", "Yozilish")}</a></div>
</div></article>`;
  const courses = `<section class="sec sec-ice" id="kursy"><div class="wrap">
<div class="head rv">${kick(t("Курсы", "Kurslar"))}<h2 class="h2">${t("Базовый, продвинутый и онлайн", "Boshlang‘ich, professional va onlayn")}</h2><p class="sub">${t("Старт потоков 24 и 26 ноября 2026. Офлайн в Ташкенте или онлайн из любого города.", "Oqimlar 2026 yil 24 va 26 noyabrda boshlanadi. Toshkentda oflayn yoki istalgan shahardan onlayn.")}</p></div>
<div class="courses">${COURSES.map(courseCard).join("")}${online}</div>
</div></section>`;

  /* ── Подбор курса (доп) ── */
  const Q = [
    [t("Кто вы?", "Siz kimsiz?"), [["corp", t("Представляю компанию", "Kompaniya vakiliman")], ["staff", t("Работаю в фармкомпании", "Farmkompaniyada ishlayman")], ["grad", t("Выпускник или новичок", "Bitiruvchi yoki yangi boshlovchi")]]],
    [t("Опыт в регистрации?", "Ro‘yxatdan o‘tkazishda tajriba?"), [["0", t("Нет", "Yo‘q")], ["1", t("Немного, помогаю отделу", "Biroz, bo‘limga yordam beraman")], ["2", t("Веду досье сам", "Dosyeni o‘zim yuritaman")]]],
    [t("Как удобнее учиться?", "Qanday o‘qish qulay?"), [["offline", t("Офлайн в Ташкенте", "Toshkentda oflayn")], ["online", t("Онлайн", "Onlayn")], ["any", t("Неважно", "Farqi yo‘q")]]],
  ];
  const quiz = `<section class="sec" id="podbor" data-addon="podbor"><div class="wrap quiz-w">
<div class="head rv">${kick(t("Подбор курса · " + offer, "Kurs tanlash · " + offer))}<h2 class="h2">${t("Три вопроса, и мы подскажем курс", "Uch savol, va kursni tavsiya qilamiz")}</h2></div>
<div class="quiz glass rv" id="quiz">
<div class="q-bar" aria-hidden="true"><i></i></div>
${Q.map(([q, opts], i) => `<fieldset class="q" data-q="${i}"${i ? " hidden" : ""}><legend>${String(i + 1)}/3 · ${q}</legend>${opts.map(([v, s]) => `<button type="button" class="q-o" data-v="${v}">${s}</button>`).join("")}</fieldset>`).join("")}
<div class="q-res" hidden><p class="kick"><i></i>${t("Вам подойдёт", "Sizga mos")}</p><h3 class="q-t"></h3><p class="q-d"></p><div class="cta"><a class="btn btn-coral" href="#zayavka" id="q-go">${t("Записаться с этими ответами", "Shu javoblar bilan yozilish")}</a><button type="button" class="btn btn-line" id="q-re">${t("Пройти заново", "Qaytadan")}</button></div></div>
</div>
</div></section>`;

  /* ── Вебинары (доп) ── */
  const webinars = `<section class="sec sec-ink" id="vebinary" data-addon="webinar"><div class="wrap">
<div class="head rv">${kick(t("Вебинары · ноябрь 2026", "Vebinarlar · 2026 noyabr"))}<h2 class="h2">${t("Шесть тем по два часа, с 15:00 до 17:00", "Ikki soatdan oltita mavzu, 15:00 dan 17:00 gacha")}</h2></div>
<ol class="webs">${WEBINARS.map((w, i) => `<li class="web rv" style="--d:${i * 60}ms" data-at="${w.d}T15:00:00+05:00"><time datetime="${w.d}">${day(l, w.d)}</time><span class="web-t">${w[l]}${w.free ? `<em>${t("бесплатно", "bepul")}</em>` : ""}</span><span class="web-s" data-left></span><a class="btn btn-line btn-sm" href="#zayavka" data-course="web:${i}">${t("Зарегистрироваться", "Ro‘yxatdan o‘tish")}</a></li>`).join("")}</ol>
</div></section>`;

  /* ── Почему важно + почему мы (стопка) ── */
  const why = `<section class="sec" id="pochemu"><div class="wrap why">
<div class="why-l">${kick(t("Почему это важно", "Nega bu muhim"))}<h2 class="h2">${t("Рынок меняется: требования к регистрации растут", "Bozor o‘zgarmoqda: ro‘yxatdan o‘tkazish talablari oshmoqda")}</h2>${IMPORTANT[l].map((p) => `<p class="sub">${p}</p>`).join("")}
<blockquote class="mission"><p>${MISSION[l]}</p><footer><img src="${IMG}/t-mamykin.webp" alt="" width="56" height="56" loading="lazy"><span><b>${TEAM[0][l].n}</b>${TEAM[0][l].r}</span></footer></blockquote></div>
<div class="stack" aria-label="${t("Почему выбирают ASAPHARM Academy", "Nega ASAPHARM Academy’ni tanlashadi")}">${WHY.map((w, i) => `<article class="st" style="--n:${i}"><span class="st-ic">${ICON[w.ic]}</span><p class="st-n">0${i + 1}</p><h3>${w[l].t}</h3><p>${w[l].d}</p></article>`).join("")}</div>
</div></section>`;

  /* ── Команда ── */
  const team = `<section class="sec sec-ice" id="komanda"><div class="wrap">
<div class="head rv">${kick(t("Команда", "Jamoa"))}<h2 class="h2">${t("Учат те, кто сам проводил препараты через регистрацию", "Preparatlarni o‘zi ro‘yxatdan o‘tkazgan mutaxassislar o‘qitadi")}</h2></div>
<div class="team">${TEAM.map((p, i) => `<article class="tm rv" style="--d:${i * 80}ms"><button type="button" class="tm-b" aria-expanded="false" aria-controls="tm-${p.k}"><img src="${IMG}/t-${p.k}.webp" alt="${esc(p[l].n)}" width="600" height="600" loading="lazy"><span class="tm-cap"><b>${p[l].n}</b><small>${p[l].r}</small></span><span class="tm-tags">${p[l].tags.map((s) => `<i>${s}</i>`).join("")}</span><span class="tm-plus" aria-hidden="true">${ICON.plus}</span></button><div class="tm-bio" id="tm-${p.k}" hidden><p>${p[l].b}</p></div></article>`).join("")}</div>
</div></section>`;

  /* ── Сертификат (доп) ── */
  const cert = `<section class="sec" id="sertifikat" data-addon="cert"><div class="wrap cert-w">
<div class="cert-txt rv">${kick(t("Сертификат · " + offer, "Sertifikat · " + offer))}<h2 class="h2">${t("Документ, который проверит любой работодатель", "Har qanday ish beruvchi tekshira oladigan hujjat")}</h2>
<p class="sub">${t("У каждого сертификата свой номер. Работодатель вводит его на сайте и видит, какой курс и когда окончил выпускник.", "Har bir sertifikatning o‘z raqami bor. Ish beruvchi uni saytga kiritadi va bitiruvchi qaysi kursni qachon tugatganini ko‘radi.")}</p>
<form class="chk" id="chk" novalidate><label for="chk-n">${t("Номер сертификата", "Sertifikat raqami")}</label><div class="chk-row"><input id="chk-n" name="n" inputmode="text" autocomplete="off" placeholder="ASA-2026-0417"><button class="btn btn-blue" type="submit">${ICON.search}${t("Проверить", "Tekshirish")}</button></div><p class="chk-r" aria-live="polite"></p><p class="note">${t("В макете знаем только номер образца: ASA-2026-0417.", "Maketda faqat namuna raqamini bilamiz: ASA-2026-0417.")}</p></form></div>
<figure class="cert rv" aria-label="${t("Образец сертификата", "Sertifikat namunasi")}"><div class="cert-in">${MARK}<p class="cert-k">ASAPHARM Academy</p><p class="cert-h">${t("Сертификат", "Sertifikat")}</p><p class="cert-s">${t("подтверждает, что", "tasdiqlaydiki")}</p><p class="cert-n">[[t:0]] [[t:1]]</p><p class="cert-s">${t("окончил(а) курс", "kursni tugatdi")}</p><p class="cert-c">${COURSES[0][l].t}</p><div class="cert-f"><span>№ ASA-2026-0417</span><span>${t("24 академических часа", "24 akademik soat")}</span><span class="seal"></span></div></div><figcaption>${t("Образец оформления. Имя и номер вымышлены.", "Rasmiylashtirish namunasi. Ism va raqam to‘qima.")}</figcaption></figure>
</div></section>`;

  /* ── Отзывы (доп) ── */
  const reviews = `<section class="sec sec-ice" id="otzyvy" data-addon="otzyv"><div class="wrap">
<div class="head rv">${kick(t("Отзывы · " + offer, "Fikrlar · " + offer))}<h2 class="h2">${t("Так здесь будут выглядеть отзывы ваших выпускников", "Bitiruvchilaringiz fikrlari bu yerda shunday ko‘rinadi")}</h2><p class="sub">${t("На сайте академии отзывов пока нет, поэтому ниже примеры. Новый отзыв сначала видит администратор.", "Akademiya saytida hozircha fikrlar yo‘q, shuning uchun quyida namunalar. Yangi fikrni avval administrator ko‘radi.")}</p></div>
</div><div class="rvw" aria-label="${t("Примеры отзывов", "Fikr namunalari")}"><div class="rvw-row">${[0, 1].map((k) => REVIEWS.map((r) => `<figure class="rv-c"${k ? ' aria-hidden="true"' : ""}><blockquote>${r[l].q}</blockquote><figcaption><b>${r[l].who}</b><small>${t("пример отзыва", "fikr namunasi")}</small></figcaption></figure>`).join("")).join("")}</div></div>
</section>`;

  /* ── Вопросы ── */
  const faq = `<section class="sec" id="voprosy"><div class="wrap faq-w">
<div class="head rv">${kick(t("Вопросы", "Savollar"))}<h2 class="h2">${t("Коротко о главном", "Asosiysi qisqacha")}</h2></div>
<div class="faq">${FAQ.map((q, i) => `<details class="fq rv" style="--d:${i * 50}ms"${i === 0 ? " open" : ""}><summary>${q[l][0]}<span aria-hidden="true">${ICON.plus}</span></summary><p>${q[l][1]}</p></details>`).join("")}</div>
</div></section>`;

  /* ── Заявка ── */
  const OPTS = [["base", COURSES[0][l].lvl + ": " + COURSES[0][l].t], ["pro", COURSES[1][l].lvl + ": " + COURSES[1][l].t], ["online", t("Онлайн-формат", "Onlayn format")], ["corp", t("Корпоративное обучение", "Korporativ o‘qitish")], ...WEBINARS.map((w, i) => [`web:${i}`, t("Вебинар ", "Vebinar ") + day(l, w.d) + ": " + w[l]])];
  const form = `<section class="sec sec-blue" id="zayavka"><div class="wrap form-w">
<div class="form-txt">${kick(t("Заявка", "Ariza"))}<h2 class="h2">${t("Получите бесплатную консультацию", "Bepul maslahat oling")}</h2><p class="sub">${t("Отправьте заявку: администратор академии перезвонит, назовёт стоимость и ближайший поток.", "Ariza yuboring: akademiya administratori qo‘ng‘iroq qiladi, narx va eng yaqin oqimni aytadi.")}</p>
<ul class="contacts"><li>${ICON.phone}<a href="tel:${F.tel}">${F.phone}</a></li><li>${ICON.tg}<a href="https://t.me/${F.tg}">Telegram: @${F.tg}</a></li><li>${ICON.mail}<a href="mailto:${F.email}">${F.email}</a></li><li>${ICON.pin}<a href="${F.map}">${F.addr[l]}</a></li></ul>
<div class="my" id="my" hidden><p class="kick"><i></i>${t("Ваша заявка", "Arizangiz")}</p><p class="my-t"></p></div></div>
<form class="frm glass" id="frm" novalidate data-addon-soft="zapis">
<label>${t("Имя", "Ism")}<input name="name" autocomplete="name" required></label>
<label>${t("Телефон", "Telefon")}<input name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+998 __ ___ __ __" required></label>
<label>${t("Что интересует", "Nima qiziqtiradi")}<select name="course">${OPTS.map(([v, s]) => `<option value="${v}">${esc(s)}</option>`).join("")}</select></label>
<fieldset class="seg"><legend>${t("Формат", "Format")}</legend><label><input type="radio" name="fmt" value="offline" checked><span>${t("Офлайн", "Oflayn")}</span></label><label><input type="radio" name="fmt" value="online"><span>${t("Онлайн", "Onlayn")}</span></label></fieldset>
<label>${t("Комментарий", "Izoh")}<textarea name="note" rows="2" placeholder="${esc(t("Например: нас трое из одной компании", "Masalan: bitta kompaniyadan uch kishimiz"))}"></textarea></label>
<input type="hidden" name="quiz">
<button class="btn btn-coral wide" type="submit">${ICON.tg}${t("Отправить заявку", "Ariza yuborish")}</button>
<p class="frm-err" aria-live="polite"></p>
<p class="note">${t("Так заявка придёт администратору академии в Telegram и в панель.", "Ariza shunday qilib akademiya administratoriga Telegramga va panelga keladi.")}</p>
</form>
</div></section>`;

  /* ── Конструктор и акция ── */
  const kd = `<button class="kd-pill" type="button" id="kd-pill" aria-expanded="false" aria-controls="kd"><i aria-hidden="true"></i>${t("Конструктор", "Konstruktor")}<b id="kd-pill-sum"></b></button>
<aside class="kd" id="kd" role="dialog" aria-label="${t("Конструктор сайта", "Sayt konstruktori")}" hidden>
<header class="kd-h"><div><p class="kd-k">${t("Конструктор · предложение DevUz Studio", "Konstruktor · DevUz Studio taklifi")}</p><h2>${t("Что войдёт в новый сайт ASAPHARM Academy", "ASAPHARM Academy’ning yangi saytiga nima kiradi")}</h2><p class="kd-sub">${t("Выключите доп, и его блок пропадёт со страницы. Итог пересчитывается сразу.", "Qo‘shimchani o‘chirsangiz, uning bloki sahifadan yo‘qoladi. Jami darhol qayta hisoblanadi.")}</p></div><button class="kd-x" type="button" id="kd-x" aria-label="${t("Свернуть", "Yopish")}">×</button></header>
<div class="kd-offer" id="kd-offer"><b>${usd(BASE.promo)}</b> <s>${usd(BASE.price)}</s> <span>${t("за лендинг по этому макету", "shu maket bo‘yicha lending uchun")}</span><span class="kd-tm" id="kd-tm"></span></div>
<div class="kd-list">
<div class="kd-row kd-base"><span class="kd-t"><b>${BASE[l].t}</b><small>${BASE[l].d}</small></span><span class="kd-p">${usd(BASE.promo)}</span></div>
${ADDONS.map((a) => `<label class="kd-row"><input type="checkbox" data-k="${a.id}" data-p="${a.price}" checked><span class="sw" aria-hidden="true"></span><span class="kd-t"><b>${a[l].t}${a.star ? `<em>${t("советуем", "tavsiya")}</em>` : ""}</b><small>${a[l].e}</small><small class="who">${a[l].who}</small></span><span class="kd-p">+${usd(a.price)}</span></label>`).join("")}
</div>
<footer class="kd-f">
<div class="kd-line"><span>${t("Лендинг", "Lending")}</span><span>${usd(BASE.promo)}</span></div>
<div class="kd-line"><span>${t("Допы", "Qo‘shimchalar")} · <span id="kd-n"></span></span><span id="kd-add"></span></div>
<div class="kd-line kd-tot"><span>${t("Итого разово", "Jami bir martalik")}</span><b id="kd-sum"></b></div>
<a class="btn btn-coral wide" href="${DEVUZ}">${ICON.tg}${t("Обсудить с DevUz Studio", "DevUz Studio bilan muhokama qilish")}</a>
<div class="kd-btns"><button class="btn btn-line btn-sm" type="button" id="kd-copy">${ICON.copy}${t("Скопировать состав", "Tarkibni nusxalash")}</button><a class="btn btn-line btn-sm" href="${href(l, "panel")}" data-addon="admin">${ICON.panel}${t("Открыть панель", "Panelni ochish")}</a></div>
</footer>
</aside>`;

  const footer = `<footer class="foot"><div class="wrap">
<div class="foot-cols">
<div><a class="logo logo-w" href="${href(l)}">${MARK}<span><b>ASAPHARM</b><small>Academy</small></span></a><p>${TAG[l]}.</p></div>
<div><b>${t("Связь", "Aloqa")}</b><ul><li><a href="tel:${F.tel}">${F.phone}</a></li><li><a href="mailto:${F.email}">${F.email}</a></li><li><a href="https://t.me/${F.tg}">Telegram</a></li><li><a href="${F.map}">${F.addr[l]}</a></li></ul></div>
<div><b>${t("Разделы", "Bo‘limlar")}</b><ul>${NAV.map(([id, n]) => `<li><a href="#${id}">${n}</a></li>`).join("")}<li><a href="${F.oferta}">${t("Договор оферты", "Oferta shartnomasi")}</a></li><li data-addon="admin"><a href="${href(l, "panel")}">${t("Панель академии", "Akademiya paneli")}</a></li></ul></div>
</div>
<div class="rights"><span>${t("Это макет: так может выглядеть новый сайт ASAPHARM Academy. Всё об академии, фото команды и занятий и логотип взяты с asapharmacademy.uz (20.11.2026), узбекский текст: наш перевод. Фото первого экрана и онлайн-формата созданы нейросетью. Блоки с пометкой «Предложение DevUz Studio» придумали мы.", "Bu maket: ASAPHARM Academy’ning yangi sayti shunday ko‘rinishi mumkin. Akademiya haqidagi hamma ma’lumot, jamoa va darslar fotosuratlari hamda logotip asapharmacademy.uz saytidan olingan (20.11.2026), o‘zbekcha matn: bizning tarjimamiz. Birinchi ekran va onlayn format rasmlari neyrotarmoq bilan yaratilgan. «DevUz Studio taklifi» belgisi bor bloklarni biz o‘ylab topdik.")}</span><span>${t("Макет принадлежит DevUz Studio. Использовать его можно только по договору:", "Maket DevUz Studio’ga tegishli. Undan faqat shartnoma bo‘yicha foydalanish mumkin:")} <a href="${TERMS}">${t("условия использования", "foydalanish shartlari")}</a></span></div>
</div></footer>`;

  const dock = `<div class="dock" id="dock"><a class="btn btn-coral wide" href="#zayavka">${t("Записаться на обучение", "O‘qishga yozilish")}</a></div>`;

  /* Строки для скрипта. */
  const L = {
    l, tg: F.tg, base: BASE.promo, was: BASE.price, hours: OFFER_HOURS,
    names: Object.fromEntries(OPTS),
    fmt: { offline: t("Офлайн", "Oflayn"), online: t("Онлайн", "Onlayn") },
    head: tgText, fName: t("Имя", "Ism"), fPhone: t("Телефон", "Telefon"), fCourse: t("Курс", "Kurs"), fFmt: t("Формат", "Format"), fNote: t("Комментарий", "Izoh"), fQuiz: t("Подбор курса", "Kurs tanlash"),
    need: t("Укажите имя и телефон: администратор перезвонит.", "Ism va telefonni kiriting: administrator qo‘ng‘iroq qiladi."),
    sent: t("Текст скопирован. Открываем Telegram администратора: вставьте и отправьте.", "Matn nusxalandi. Administrator Telegrami ochilmoqda: qo‘ying va yuboring."),
    st: { new: t("новая, администратор скоро ответит", "yangi, administrator tez orada javob beradi"), work: t("в работе: администратор связывается с вами", "ishda: administrator siz bilan bog‘lanmoqda"), done: t("записаны на поток", "oqimga yozildingiz"), no: t("отклонена", "rad etildi") },
    myN: t("Заявка №{n}: {s}", "Ariza №{n}: {s}"),
    left: t("через {d} дн.", "{d} kundan keyin"), today: t("сегодня", "bugun"), past: t("прошёл", "o‘tdi"),
    res: {
      base: [COURSES[0][l].t, t("Базовый курс: 24 академических часа, 2 месяца. Подходит без опыта в регистрации.", "Boshlang‘ich kurs: 24 akademik soat, 2 oy. Ro‘yxatdan o‘tkazish tajribasisiz mos.")],
      pro: [COURSES[1][l].t, t("Продвинутый курс: 48 академических часов, 3 месяца. Весь цикл регистрации ЛС и МИ.", "Professional kurs: 48 akademik soat, 3 oy. Dori vositalari va tibbiy buyumlarni ro‘yxatdan o‘tkazishning butun sikli.")],
      corp: [t("Корпоративное обучение", "Korporativ o‘qitish"), t("Программа под отдел вашей компании: администратор согласует курс, формат и даты.", "Kompaniyangiz bo‘limi uchun dastur: administrator kurs, format va sanalarni kelishadi.")],
    },
    online: t(" · онлайн", " · onlayn"),
    certOk: t("Найден: {n}, курс «{c}», 2026 год.", "Topildi: {n}, «{c}» kursi, 2026 yil."), certNo: t("Сертификат с таким номером не найден.", "Bunday raqamli sertifikat topilmadi."), certName: "[[t:0]] [[t:1]]", certCourse: COURSES[0][l].t,
    kitHead: t("Состав нового сайта ASAPHARM Academy из конструктора:", "ASAPHARM Academy yangi sayti konstruktordan:"), kitTot: t("Итого", "Jami"), kitBase: BASE[l].t, copied: t("Скопировано", "Nusxalandi"),
    n: t("{n} шт.", "{n} ta"), offerLeft: t("ещё {h} ч {m} мин", "yana {h} soat {m} daqiqa"), offerEnd: t("срок акции вышел", "aksiya muddati tugadi"),
  };

  const meta = {
    title: path ? t("Панель · ASAPHARM Academy", "Panel · ASAPHARM Academy") : t("ASAPHARM Academy · Школа регистратора лекарственных средств", "ASAPHARM Academy · Dori vositalarini ro‘yxatdan o‘tkazish maktabi"),
    desc: TAG[l],
  };
  const headHtml = `<!doctype html>
<html lang="${l}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<script>(function(){var r=document.documentElement,h=0,w=0;function f(){if(innerWidth===w&&h)return;w=innerWidth;h=innerHeight;r.style.setProperty('--vh1',h/100+'px')}f();addEventListener('resize',f)})()</script>
<title>${esc(meta.title)}</title>
<meta name="description" content="${esc(meta.desc)}">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="#0d1b4f">
<link rel="icon" type="image/png" sizes="192x192" href="${IMG}/icon-192.png">
<link rel="apple-touch-icon" href="${IMG}/apple-180.png">
<link rel="alternate" hreflang="${other}" href="${href(other, path)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">`;

  if (path === "panel") {
    return `${headHtml}
<style>${PANEL_CSS}</style>
</head>
<body class="pn">
${dzIntroSolo(l)}
<script type="application/json" id="pl">${JSON.stringify({ l, img: IMG, site: href(l), other: href(other, "panel"), terms: TERMS, trap: "[[t:2]]", courses: COURSES.map((c) => ({ k: c.k, t: c[l].t, start: c.start, hours: c.hours })), webinars: WEBINARS.map((w) => ({ d: w.d, t: w[l], free: !!w.free })), names: L.names, ui: PANEL_UI[l], demo: DEMO[l] }).replace(/</g, "\\u003c")}</script>
<div id="app"></div>
<script>
${PANEL_JS}</script>
</body>
</html>`;
  }

  return `${headHtml}
<link rel="preload" as="image" href="${IMG}/hero-m.webp" media="(max-width: 767px)">
<link rel="preload" as="image" href="${IMG}/hero.webp" media="(min-width: 1280px)">
<style>${CSS}</style>
<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "EducationalOrganization", name: F.name, url: F.site, telephone: F.tel, email: F.email, address: { "@type": "PostalAddress", streetAddress: "Katta Mirobod, 3/5", addressLocality: "Toshkent", postalCode: "100015", addressCountry: "UZ" } })}</script>
</head>
<body>
${dzIntroSolo(l)}
<a class="skip" href="#main">${t("К содержанию", "Asosiy qismga")}</a>
${header}
<main id="main">
${hero}
${who}
${path_}
${courses}
${quiz}
${webinars}
${why}
${team}
${cert}
${reviews}
${faq}
${form}
</main>
${footer}
${dock}
${kd}
<script type="application/json" id="i18n">${JSON.stringify(L).replace(/</g, "\\u003c")}</script>
<script>
${JS}</script>
</body>
</html>`;
}

const out = {};
for (const l of ["ru", "uz"]) for (const p of ["", "panel"]) out[(KEY[l] ? KEY[l] + (p ? "/" : "") : "") + p] = build(l, p);
mkdirSync(DIR + "out", { recursive: true });
writeFileSync(DIR + "out/pages.json", JSON.stringify(out));

/* Сборка для сервера (lib/proto/bundles): общие стили и скрипт один раз. */
const grab = (html, re) => html.match(re)[0];
const parts = {
  S: grab(out[""], /<style>[\s\S]*?<\/style>/),
  J: grab(out[""], /<script>\n\(function\(\)\{'use strict';[\s\S]*?<\/script>/),
  P: grab(out.panel, /<style>[\s\S]*?<\/style>/),
  Q: grab(out.panel, /<script>\n\(function\(\)\{'use strict';[\s\S]*?<\/script>/),
};
const pages = {};
for (const [key, html] of Object.entries(out)) {
  let page = html;
  for (const [name, part] of Object.entries(parts)) page = page.split(part).join(`@@${name}@@`);
  pages[key] = page;
}
const bundleDir = new URL("../../../content/proto-bundles/", import.meta.url).pathname;
writeFileSync(bundleDir + "asapharm.json", JSON.stringify({ parts, pages }));
for (const [k, v] of Object.entries(out)) console.log((k || "(ru)").padEnd(10), v.length);
console.log("допы", ADDONS.reduce((s, a) => s + a.price, 0), "всё", ALL);
