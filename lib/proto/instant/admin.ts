/**
 * «Админка» рядом с макетом из бота — готовая панель нашего макета той же
 * сферы, на данных клиента.
 *
 * Владелец, 11.11.2026: «Ты добавляй админки тоже чтобы посмотреть. Также
 * берем готовые админки которые у нас есть а не отрисовываем их заново.
 * Фаршируем мощно (прям чтобы были вау админки под каждую категорию)».
 *
 * Панель и её стили — файлы нашего макета как есть
 * (content/proto-instant/panel-assets.json, пишет
 * scripts/protos/instant/panel-assets.mjs). Шаблон кладёт в неё JSON: имя и
 * знак клиента, его услуги, врачей, адрес; демо-заявки, переписки и числа —
 * с пометкой «демо-данные», как во всех наших админках. Ключи памяти
 * браузера — те же, что у сайта шаблона: запись или бронь с макета клиента
 * приходит в его админку первой строкой. Модели нет.
 *
 *   стоматология, медцентр — панель клиники Nek Dental Studio;
 *   ресторан — панель Agora (вход кодом, брони, заказы, меню и стоп-лист).
 *
 * Сфера без панели — админки нет (`null`), бот кнопку не показывает.
 */
import nek from "@/content/proto-instant/nek-assets.json" with { type: "json" };
import agora from "@/content/proto-instant/agora-assets.json" with { type: "json" };
import panels from "@/content/proto-instant/panel-assets.json" with { type: "json" };
import { mockupTermsUrl } from "@/lib/proto/booking";
import { dentalPalette } from "@/lib/proto/instant/dental";
import { priceNumber, RESTORAN_PHOTOS, restoranPalette, RESTORAN_TIMES } from "@/lib/proto/instant/restoran";
import { esc, imageUrl } from "@/lib/proto/instant/safe";
import { LIMITS, type InstantLocale, type InstantNiche, type InstantSite } from "@/lib/proto/instant/types";
import { PROTO_BASE } from "@/lib/proto/pages";

type Pair = [string, string];
const json = (v: unknown) => JSON.stringify(v).replace(/</g, "\\u003c");

/** Знак клиента для шапки панели: его логотип или первая буква. */
function markOf(site: InstantSite, cls: string): string {
  const logo = imageUrl(site.logo);
  return logo
    ? `<img class="${cls}" src="${esc(logo)}" alt="" referrerpolicy="no-referrer" style="height:36px;width:auto;max-width:120px;object-fit:contain" onerror="this.remove()">`
    : `<span class="${cls}" style="display:inline-grid;place-items:center;width:36px;height:36px;border-radius:10px;background:var(--orchid,var(--a,#333));color:#fff;font-weight:700">${esc(site.name.slice(0, 1).toUpperCase())}</span>`;
}

function page(l: InstantLocale, title: string, desc: string, fonts: string, style: string, body: string): string {
  return `<!doctype html>
<html lang="${l}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta name="robots" content="noindex, nofollow, noarchive">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${fonts}">
<style>${style}</style>
</head>
${body}
</html>`;
}

// ── Панель клиники: Nek Dental Studio ─────────────────────────────────
/** Подписи панели Nek: русские — из её gen.mjs, узбекские — наши. */
const NEK_UI: Record<string, Pair> = {
  title: ["Панель клиники", "Klinika paneli"], demo: ["демо-данные", "demo ma’lumotlar"],
  tab_sum: ["Сводка", "Umumiy"], tab_req: ["Записи", "Yozuvlar"], tab_cal: ["Расписание", "Jadval"], tab_log: ["История", "Tarix"],
  role: ["Роль", "Rol"], r_doc: ["Главный врач", "Bosh shifokor"], r_adm: ["Администратор", "Administrator"],
  week: ["Записи за неделю", "Haftalik yozuvlar"], vs: ["к прошлой неделе", "o‘tgan haftaga nisbatan"], site: ["С сайта", "Saytdan"],
  rev: ["Выручка, неделя", "Tushum, hafta"], revHide: ["видит главный врач", "bosh shifokor ko‘radi"],
  came: ["Визиты состоялись", "Bo‘lib o‘tgan tashriflar"], src: ["Откуда пациенты", "Bemorlar qayerdan"], days14: ["Записи за 14 дней", "14 kunlik yozuvlar"],
  s_site: ["Запись на сайте", "Saytda yozilish"], s_ig: ["Instagram", "Instagram"], s_call: ["Звонок", "Qo‘ng‘iroq"], s_quiz: ["Квиз", "Kviz"], s_trip: ["Приезжие", "Boshqa shahardan"],
  today: ["Сегодня", "Bugun"], attn: ["Требует внимания", "E’tibor talab qiladi"], attn1: ["записей ждут подтверждения", "ta yozuv tasdiqni kutmoqda"],
  fresh: ["с сайта, только что", "saytdan, hozirgina"], who: ["Пациент", "Bemor"], what: ["Услуга", "Xizmat"], when: ["Когда", "Qachon"], stt: ["Статус", "Holat"],
  st_new: ["Новая", "Yangi"], st_ok: ["Подтверждена", "Tasdiqlandi"], st_came: ["Пришёл", "Keldi"], st_no: ["Отменена", "Bekor qilindi"],
  a_ok: ["Подтвердить", "Tasdiqlash"], a_came: ["Пришёл на приём", "Qabulga keldi"], a_no: ["Отменить", "Bekor qilish"],
  note_ok: ["подтвердил запись", "yozuvni tasdiqladi"], note_came: ["отметил визит", "tashrifni belgiladi"], note_no: ["отменил запись", "yozuvni bekor qildi"],
  empty: ["С сайта записей пока нет. Запишитесь на сайте, и запись появится здесь.", "Saytdan hali yozuv yo‘q. Saytda yoziling, yozuv shu yerda paydo bo‘ladi."],
  openSite: ["Открыть сайт", "Saytni ochish"], back: ["Макет", "Maket"], doctor: ["Врач", "Shifokor"], free: ["свободно", "bo‘sh"],
  phone: ["Телефон", "Telefon"], from: ["Источник", "Manba"], hist: ["История", "Tarix"], reset: ["Сбросить демо", "Demoni tozalash"],
  tab_msg: ["Сообщения", "Xabarlar"], tab_con: ["Подключения", "Ulanishlar"], lang: ["Язык", "Til"],
  ch_site: ["Чат сайта", "Sayt chati"], m_ph: ["Ответ пациенту", "Bemorga javob"], m_send: ["Отправить", "Yuborish"],
  m_book: ["Записать на приём", "Qabulga yozish"], m_booked: ["Запись добавлена в «Записи»", "Yozuv «Yozuvlar»ga qo‘shildi"],
  m_demo: ["В макете ответ остаётся здесь. В рабочей панели он уходит в тот же канал.", "Maketda javob shu yerda qoladi. Ishchi panelda u o‘sha kanalga ketadi."],
  m_nowz: ["Wazzup не подключён: подключите его в «Подключениях», и ответы пойдут в WhatsApp, Instagram, Telegram и Viber.", "Wazzup ulanmagan: uni «Ulanishlar»da ulang, javoblar WhatsApp, Instagram, Telegram va Viber’ga boradi."],
  m_pick: ["Выберите переписку слева.", "Chapdan yozishmani tanlang."], m_back: ["Все переписки", "Barcha yozishmalar"],
  m_site0: ["Напишите в чат на сайте, и переписка появится здесь.", "Saytdagi chatga yozing, yozishma shu yerda paydo bo‘ladi."],
  m_bot: ["бот", "bot"], m_wait: ["сообщений ждут ответа", "ta xabar javob kutmoqda"], m_visitor: ["Гость сайта", "Sayt mehmoni"],
  note_msg: ["ответил в", "javob berdi:"], note_book: ["записал из переписки", "yozishmadan yozdi"],
  c_sub: ["Вставьте ключ один раз, дальше всё работает само. Подключения меняет главный врач.", "Kalitni bir marta qo‘ying, keyin hammasi o‘zi ishlaydi. Ulanishlarni bosh shifokor o‘zgartiradi."],
  c_demo: ["В макете ключ остаётся в этом браузере и никуда не уходит.", "Maketda kalit shu brauzerda qoladi va hech qayerga ketmaydi."],
  c_ro: ["Подключения меняет главный врач. Вы видите, что подключено.", "Ulanishlarni bosh shifokor o‘zgartiradi. Siz nima ulanganini ko‘rasiz."],
  c_wz_t: ["Wazzup: WhatsApp, Instagram, Telegram, Viber", "Wazzup: WhatsApp, Instagram, Telegram, Viber"],
  c_wz_e: ["Все чаты пациентов приходят в «Сообщения», ответ уходит в тот же канал.", "Bemorlarning barcha chatlari «Xabarlar»ga keladi, javob o‘sha kanalga ketadi."],
  c_wz_how: ["Wazzup: «Интеграции», затем «API», скопируйте ключ API.", "Wazzup: «Integratsiyalar», keyin «API», API kalitini nusxalang."],
  c_tg_t: ["Telegram-бот администратору", "Administrator uchun Telegram-bot"],
  c_tg_e: ["Новые записи и сообщения приходят в Telegram, отвечать можно прямо там.", "Yangi yozuvlar va xabarlar Telegramga keladi, o‘sha yerda javob berish mumkin."],
  c_tg_how: ["Telegram: @BotFather, затем /newbot, скопируйте токен.", "Telegram: @BotFather, keyin /newbot, tokenni nusxalang."],
  c_crm_t: ["CRM: amoCRM или Bitrix24", "CRM: amoCRM yoki Bitrix24"],
  c_crm_e: ["Каждая запись становится сделкой с контактом пациента, этап возвращается в панель.", "Har bir yozuv bemor kontakti bilan bitimga aylanadi, bosqich panelga qaytadi."],
  c_crm_how: ["amoCRM: «Настройки», «Интеграции», частная интеграция, долгосрочный токен. Bitrix24: «Разработчикам», входящий вебхук, его адрес.", "amoCRM: «Sozlamalar», «Integratsiyalar», shaxsiy integratsiya, uzoq muddatli token. Bitrix24: «Dasturchilarga», kiruvchi vebxuk, uning manzili."],
  c_rem_t: ["Напоминания пациентам", "Bemorlarga eslatmalar"],
  c_rem_e: ["Сообщение в WhatsApp за сутки и за два часа до визита. Работает через Wazzup.", "Tashrifdan bir kun va ikki soat oldin WhatsApp’da xabar. Wazzup orqali ishlaydi."],
  c_key: ["Ключ", "Kalit"], c_save: ["Подключить", "Ulash"], c_off: ["Отключить", "O‘chirish"],
  c_on: ["Подключено · демо", "Ulangan · demo"], c_need: ["Не подключено", "Ulanmagan"],
  c_need_wz: ["Сначала подключите Wazzup.", "Avval Wazzup’ni ulang."], c_turn: ["Включить", "Yoqish"], c_turnoff: ["Выключить", "O‘chirish"],
  c_left: ["Осталось подключить", "Ulash qoldi"], how: ["Где взять", "Qayerdan olish"],
  note_con: ["подключил", "uladi"], note_coff: ["отключил", "o‘chirdi"],
};

const NAMES: Record<InstantLocale, string[]> = {
  ru: ["Азиз", "Мадина", "Тимур", "Камола", "Сардор", "Нигора", "Рустам", "Дилноза", "Бобур", "Лола"],
  uz: ["Aziz", "Madina", "Timur", "Kamola", "Sardor", "Nigora", "Rustam", "Dilnoza", "Bobur", "Lola"],
};
const WD: Record<InstantLocale, string[]> = { ru: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"], uz: ["Ya", "Du", "Se", "Ch", "Pa", "Ju", "Sh"] };

/** Переписки демо: каналы Wazzup, слова пациентов без цен и без чужих фактов. */
function clinicThreads(l: InstantLocale, svc: string[]) {
  const s = (k: number) => svc[k % svc.length];
  const t = (ru: string, uz: string) => (l === "uz" ? uz : ru);
  return [
    { ch: "whatsapp", n: 0, svc: s(0), un: 1, m: [["p", t("Здравствуйте, можно на консультацию на этой неделе?", "Assalomu alaykum, shu hafta konsultatsiyaga kelsam bo‘ladimi?")], ["a", t("Здравствуйте! Свободно в четверг в 14:00 или в пятницу в 12:30.", "Assalomu alaykum! Payshanba 14:00 yoki juma 12:30 bo‘sh.")], ["p", t("Мне подходит четверг.", "Menga payshanba to‘g‘ri keladi.")]] },
    { ch: "instagram", n: 1, svc: s(1), un: 1, m: [["p", t("Сколько длится приём и что взять с собой?", "Qabul qancha davom etadi va o‘zim bilan nima olay?")]] },
    { ch: "telegram", n: 2, svc: s(2), un: 1, m: [["p", t("Приеду из другого города на три дня. Можно спланировать всё заранее?", "Boshqa shahardan uch kunga kelaman. Hammasini oldindan rejalashtirsa bo‘ladimi?")]] },
    { ch: "viber", n: 3, svc: s(3), un: 0, m: [["p", t("Хочу перенести визит на субботу.", "Tashrifni shanbaga ko‘chirmoqchiman.")], ["a", t("Перенесли: суббота, 11:00.", "Ko‘chirdik: shanba, 11:00.")]] },
    { ch: "instagram", n: 4, svc: s(4), un: 0, m: [["p", t("Спасибо, результат очень нравится!", "Rahmat, natija juda yoqdi!")]] },
  ];
}

const DOC_FALLBACK: Record<"stomatologiya" | "medcentr", Pair[]> = {
  stomatologiya: [["Терапевт", "Terapevt"], ["Хирург", "Jarroh"], ["Ортодонт", "Ortodont"], ["Ортопед", "Ortoped"]],
  medcentr: [["Терапевт", "Terapevt"], ["Кардиолог", "Kardiolog"], ["Педиатр", "Pediatr"], ["Гинеколог", "Ginekolog"]],
};

function clinicAdmin(site: InstantSite, niche: "stomatologiya" | "medcentr"): string {
  const l = site.locale;
  const i = l === "uz" ? 1 : 0;
  const t = (p: Pair) => p[i];
  const ui = Object.fromEntries(Object.entries(NEK_UI).map(([k, v]) => [k, v[i]]));
  const services = site.services.slice(0, LIMITS.services);
  // Те же id услуг, что в данных сайта шаблона (dental.ts): записи с сайта сходятся.
  const svc = services.length ? services.map((s, k) => ({ id: `s${k}`, n: s.name })) : [{ id: "s0", n: l === "uz" ? "Qabul" : "Приём" }];
  const docs = site.doctors.length
    ? site.doctors.slice(0, 5).map((d) => ({ n: d.name, r: d.role ?? "" }))
    : DOC_FALLBACK[niche].map((p) => ({ n: t(p), r: "" }));
  const pd = {
    l, ui, name: site.name, mark: markOf(site, "pn-mark"), cur: l === "uz" ? "so‘m" : "сум", k: 2500,
    site: PROTO_BASE, home: PROTO_BASE,
    svc, docs, wd: WD[l], names: NAMES[l], trap: "[[t:0]] [[t:1]]",
    threads: clinicThreads(l, svc.map((s) => s.id)), langs: [],
  };
  const name = esc(site.name);
  const terms = l === "uz" ? ["DevUz Studio maketi, demo ma’lumotlar. Maketdan foydalanib, siz", "maket shartlarini qabul qilasiz"] : ["Макет DevUz Studio, демо-данные. Пользуясь макетом, вы принимаете", "условия макета"];
  return page(
    l,
    `${name} · ${t(NEK_UI.title).toLowerCase()} · ${t(NEK_UI.demo)}`,
    esc(l === "uz" ? "Klinika paneli: saytdan yozuvlar, shifokorlar jadvali, holatlar, tarix va rollar. Demo ma’lumotlar." : "Панель клиники: записи с сайта, расписание по врачам, статусы, история и роли. Демо-данные."),
    "https://fonts.googleapis.com/css2?family=Cormorant:wght@400;700&family=Manrope:wght@400;700&display=swap",
    `${nek.css}:root{${dentalPalette(site.color)}}${panels.nek.css}`,
    `<body class="pn">
<div id="app"></div>
<footer class="pn-foot">${terms[0]} <a href="${esc(mockupTermsUrl(l))}" target="_blank" rel="noopener">${terms[1]}</a>.</footer>
<script type="application/json" id="pn-data">${json(pd)}</script>
<script>
${panels.nek.js}</script>
</body>`,
  );
}

// ── Панель ресторана: Agora ───────────────────────────────────────────
function restoranAdmin(site: InstantSite): string {
  const l = site.locale;
  const i = l === "uz" ? 1 : 0;
  const nm = esc(site.name);
  const ui = Object.fromEntries(Object.entries(panels.agora.ui as Record<string, string[]>).map(([k, v]) => [k, v[i].split("{name}").join(nm)]));
  const services = site.services.slice(0, LIMITS.services);
  const own = site.photos.map(imageUrl).filter((u): u is string => Boolean(u));
  const pd = {
    l, ui, name: site.name, mark: markOf(site, "lg-logo"), sum: l === "uz" ? "so‘m" : "сум",
    site: PROTO_BASE, home: PROTO_BASE, img: "/protos/_niche/restoran",
    // Те же id и категория, что в данных сайта шаблона (restoran.ts): брони и заказы с сайта сходятся.
    menu: services.map((s, k) => [`d${k}`, "m", s.name, priceNumber(s.price), null]),
    cats: [["m", l === "uz" ? "Menyu" : "Меню", "k"]],
    street: site.address ?? site.city ?? "",
    set0: { pause: false, bannerOn: false, banner: "", hours: site.hours ?? "", dlv: { on: false, pick: true, min: 0, free: 0, zones: [] }, book: { from: RESTORAN_TIMES[0], to: RESTORAN_TIMES[RESTORAN_TIMES.length - 1], max: 30, auto: false, pre: true } },
    times: RESTORAN_TIMES,
    names: NAMES[l],
    corp: l === "uz" ? "«[[t:0]] Group» banketi" : "Банкет «[[t:0]] Group»",
    addr: l === "uz" ? "[[t:1]] ko‘chasi, 14" : "ул. [[t:1]], 14",
  };
  const terms = l === "uz" ? ["DevUz Studio maketi, demo ma’lumotlar. Maketdan foydalanib, siz", "maket shartlarini qabul qilasiz"] : ["Макет DevUz Studio, демо-данные. Пользуясь макетом, вы принимаете", "условия макета"];
  return page(
    l,
    `${nm} · ${l === "uz" ? "restoran paneli · demo" : "панель ресторана · демо"}`,
    esc(l === "uz" ? "Restoran paneli: saytdan bronlar va buyurtmalar, stop-list, rollar, tarix, yuklab olish. Demo ma’lumotlar." : "Панель ресторана: брони и заказы с сайта, стоп-лист, роли, история, выгрузки. Демо-данные."),
    "https://fonts.googleapis.com/css2?family=Forum&family=Manrope:wght@400;700&display=swap",
    // Подпись над столбцом графика у края на телефоне вылезает на 4 px: обрезаем, а не двигаем страницу.
    `${agora.css}:root{${restoranPalette(site.color)}}${panels.agora.css}html,body{overflow-x:clip}`,
    `<body class="pn">
<div class="pn-bg" aria-hidden="true"><img src="${esc(own[0] ?? RESTORAN_PHOTOS[0])}" alt="" width="640" height="365" referrerpolicy="no-referrer"></div>
<div id="app"></div>
<footer class="pn-foot">${terms[0]} <a href="${esc(mockupTermsUrl(l))}" target="_blank" rel="noopener">${terms[1]}</a>.</footer>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script type="application/json" id="pn-data">${json(pd)}</script>
<script>
${panels.agora.js}</script>
</body>`,
  );
}

const ADMINS: Partial<Record<InstantNiche, (site: InstantSite) => string>> = {
  stomatologiya: (s) => clinicAdmin(s, "stomatologiya"),
  medcentr: (s) => clinicAdmin(s, "medcentr"),
  restoran: restoranAdmin,
};

/** Админка сферы на данных клиента; у сферы без нашей панели — null. */
export function adminHtml(site: InstantSite): string | null {
  return ADMINS[site.niche]?.(site) ?? null;
}

export function hasAdmin(niche: InstantNiche): boolean {
  return Boolean(ADMINS[niche]);
}
