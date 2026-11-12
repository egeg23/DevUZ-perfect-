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
 *   ресторан — панель Agora (вход кодом, брони, заказы, меню и стоп-лист);
 *   турагентство — панель Sunday; учебный центр — панель FinTax;
 *   мебель и интернет-магазин — панель магазина Greenwell; недвижимость — панель Soffice.
 * У этих четырёх своей панели в макете сферы нет — выбор владельца,
 * 11.11.2026: «Да, делай по своей рекомендации».
 *
 * Сфера без панели — админки нет (`null`), бот кнопку не показывает.
 */
import nek from "@/content/proto-instant/nek-assets.json" with { type: "json" };
import agora from "@/content/proto-instant/agora-assets.json" with { type: "json" };
import panels from "@/content/proto-instant/panel-assets.json" with { type: "json" };
import { mockupTermsUrl } from "@/lib/proto/booking";
import { dentalPalette } from "@/lib/proto/instant/dental";
import { priceNumber, RESTORAN_PHOTOS, restoranPalette, RESTORAN_TIMES } from "@/lib/proto/instant/restoran";
import { brandColor, esc, hexToHsl, imageUrl } from "@/lib/proto/instant/safe";
import { TUR_PHOTOS } from "@/lib/proto/instant/tur";
import { MEBEL_PHOTOS } from "@/lib/proto/instant/mebel";
import { MAGAZIN_PHOTOS, shopPrice } from "@/lib/proto/instant/magazin";
import { NEDV_PHOTOS } from "@/lib/proto/instant/nedv";
import { LIMITS, type InstantLocale, type InstantNiche, type InstantSite } from "@/lib/proto/instant/types";
import { PROTO_BASE } from "@/lib/proto/pages";
import { SALON_DEMO_JS, SALON_EXT_JS } from "@/lib/proto/instant/salon-admin";

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

// ── Панель турагентства: Sunday Event Agency ──────────────────────────
/** Подписи Sunday про события и гостей — словами турагентства. Остальные — как у Sunday. */
const TOUR_UI: Record<string, Pair> = {
  in_sub: ["Заявки и расчёты туров с сайта, даты и туристы. Пароля нет: код приходит по SMS.", "Saytdan arizalar va tur hisoblari, sanalar va turistlar. Parol yo‘q: kod SMS bilan keladi."],
  tab_gst: ["Туристы", "Turistlar"],
  r_own_sub: ["Всё: бюджеты, сделки, даты, туристы, история", "Hammasi: byudjetlar, bitimlar, sanalar, turistlar, tarix"],
  r_mgr_sub: ["Заявки, даты и туристы, без денег", "Arizalar, sanalar va turistlar, pulsiz"],
  search_ph: ["Заявка, клиент, турист", "Ariza, mijoz, turist"],
  demo_line: ["Демо-данные: клиенты, бюджеты и даты выдуманы. Заявки с сайта в этом браузере настоящие.", "Demo ma’lumotlar: mijozlar, byudjetlar va sanalar o‘ylab topilgan. Shu brauzerdagi saytdan arizalar haqiqiy."],
  hello_sub: ["Что пришло с сайта, какие даты заняты и кто едет", "Saytdan nima keldi, qaysi sanalar band va kim boradi"],
  busy_sub: ["дней с выездами", "jo‘nash kunlari"],
  k_guests: ["Туристов едет", "Turist boradi"],
  crm_gst: ["ответов туристов,", "turist javoblari,"],
  ch_kind: ["Какие туры", "Qanday turlar"],
  req_sub: ["Расчёты туров, подборы, брони дат и звонки. Статус клиент видит в своей заявке.", "Tur hisoblari, tanlovlar, sana bronlari va qo‘ng‘iroqlar. Holatni mijoz o‘z arizasida ko‘radi."],
  gst_sub: ["Кто едет: сколько человек и какие пожелания.", "Kim boradi: necha kishi va qanday istaklar."],
  ev_date: ["Дата вылета", "Uchish sanasi"],
  guests: ["туристов", "turist"],
  do_sent: ["Расчёт отправлен", "Hisob yuborildi"],
  st_sent: ["Расчёт отправлен", "Hisob yuborildi"],
  k_wedding: ["Пляжный отдых", "Plyaj dam olishi"],
  k_fest: ["Экскурсионный тур", "Ekskursiya turi"],
  k_party: ["Семейный тур", "Oilaviy tur"],
  k_corp: ["Деловая поездка", "Ish safari"],
  k_quiz: ["Подбор тура", "Tur tanlash"],
  k_date: ["Бронь дат", "Sana broni"],
  ex_quiz: ["Подбор: море, двое взрослых и ребёнок", "Tanlov: dengiz, ikki kattalar va bola"],
  ex_diet: ["номер с видом на море", "dengiz manzarali xona"],
  g_diet: ["Пожелания", "Istaklar"],
  g_come: ["Едут", "Boradi"],
  g_yes: ["Едет", "Boradi"],
  g_no: ["Не едут", "Bormaydi"],
};
const MONTHS: Record<InstantLocale, string[]> = {
  ru: ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"],
  uz: ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"],
};
const WD_MON: Record<InstantLocale, string[]> = { ru: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"], uz: ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"] };

/** Цвет клиента поверх розового Sunday: акцент и его тёмный тон. Тёмно-синее стекло остаётся. */
function sundayPalette(color: string | null): string {
  const hex = brandColor(color);
  if (!hex) return "";
  const [h, s0, l0] = hexToHsl(hex);
  const s = Math.min(Math.max(s0, 45), 85);
  const l = Math.min(Math.max(l0, 45), 60);
  return `--a:hsl(${h} ${s}% ${l}%);--a2:hsl(${h} ${s}% ${l - 8}%)`;
}

function tourAdmin(site: InstantSite): string {
  const l = site.locale;
  const i = l === "uz" ? 1 : 0;
  const nm = esc(site.name);
  const base = panels.sunday.ui as Record<string, string[]>;
  const ui = Object.fromEntries(Object.entries(base).map(([k, v]) => [k, (TOUR_UI[k] ?? v)[i].split("{name}").join(nm)]));
  const own = site.photos.map(imageUrl).filter((u): u is string => Boolean(u));
  const pd = {
    l, ui, name: site.name, mark: markOf(site, "lg-logo"), site: PROTO_BASE, home: PROTO_BASE,
    addr: site.address ?? site.city ?? "",
    names: NAMES[l],
    corp: l === "uz" ? ["«[[t:0]]» MChJ", "«[[t:1]] Group»"] : ["ООО «[[t:0]]»", "«[[t:1]] Group»"],
    months: MONTHS[l], wd: WD_MON[l],
    // Туристов в заявке единицы: множитель к числу гостей Sunday.
    gk: 0.03,
  };
  const terms = l === "uz" ? ["DevUz Studio maketi, demo ma’lumotlar. Maketdan foydalanib, siz", "maket shartlarini qabul qilasiz"] : ["Макет DevUz Studio, демо-данные. Пользуясь макетом, вы принимаете", "условия макета"];
  return page(
    l,
    `${nm} · ${l === "uz" ? "turagentlik paneli · demo" : "панель турагентства · демо"}`,
    esc(l === "uz" ? "Turagentlik paneli: saytdan arizalar, band sanalar kalendari, turistlar, tarix va rollar. Demo ma’lumotlar." : "Панель турагентства: заявки с сайта, календарь занятых дат, туристы, история и роли. Демо-данные."),
    "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;700&family=Manrope:wght@400;700&display=swap",
    `${panels.sunday.css}:root{${sundayPalette(site.color)}}html,body{overflow-x:clip}`,
    `<body class="pn">
<div class="pn-bg" aria-hidden="true"><img src="${esc(own[0] ?? TUR_PHOTOS[0])}" width="960" height="537" alt="" referrerpolicy="no-referrer"></div>
<div id="app"></div>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<footer class="pn-foot">${terms[0]} <a href="${esc(mockupTermsUrl(l))}" target="_blank" rel="noopener">${terms[1]}</a>.</footer>
<script type="application/json" id="pn-data">${json(pd)}</script>
<script>
${panels.sunday.js}</script>
</body>`,
  );
}

// ── Панель учебного центра: FinTax ────────────────────────────────────
/** Подписи FinTax про бухгалтерию и налоги — словами учебного центра. Остальные — как у FinTax. */
const EDU_UI: Record<string, Pair> = {
  demoNote: ["Демо-панель макета DevUz Studio: цифры и ученики с пометкой «демо» придуманы для показа, заявки с сайта в этом браузере настоящие.", "DevUz Studio maketining demo paneli: «demo» belgili raqamlar va o‘quvchilar ko‘rsatish uchun o‘ylab topilgan, shu brauzerdagi saytdan arizalar haqiqiy."],
  n_clients: ["Ученики", "O‘quvchilar"], n_tariffs: ["Курсы", "Kurslar"],
  role_head: ["Руководитель центра", "Markaz rahbari"],
  r_owner: ["Всё: заявки, учеников с суммами, выручку в месяц, курсы на сайте, команду и историю.", "Hammasi: arizalar, summalari bilan o‘quvchilar, oylik tushum, saytdagi kurslar, jamoa va tarix."],
  r_head: ["Заявки, учеников, преподавателей и расписание, суммы и курсы на сайте.", "Arizalar, o‘quvchilar, o‘qituvchilar va jadval, summalar va saytdagi kurslar."],
  r_manager: ["Заявки и учеников без денег: не видит выручку и суммы, не правит курсы и команду.", "Arizalar va o‘quvchilar pulsiz: tushum va summalarni ko‘rmaydi, kurslar va jamoani o‘zgartirmaydi."],
  k_client: ["Стали учениками", "O‘quvchi bo‘ldi"], clientsN: ["учеников", "o‘quvchi"],
  pickNote: ["«Подбор курса»: человек сам ответил на вопросы, курс уже в заявке.", "«Kurs tanlash»: odam savollarga o‘zi javob berdi, kurs allaqachon arizada."],
  mix: ["Ученики по курсам", "Kurslar bo‘yicha o‘quvchilar"], soon: ["Занятия на неделе", "Haftadagi darslar"],
  co: ["Ученик", "O‘quvchi"], col_tariff: ["Курс", "Kurs"], col_acc: ["Преподаватель", "O‘qituvchi"], col_co: ["Ученик", "O‘quvchi"],
  col_docs: ["Занятий за месяц", "Oylik darslar"], col_rep: ["Ближайшее", "Eng yaqini"],
  src_pick: ["Подбор курса", "Kurs tanlash"], s_offer: ["Записали на пробное", "Sinov darsiga yozildi"], s_client: ["Ученик", "O‘quvchi"],
  cs_wait: ["Ждём оплату", "To‘lov kutilmoqda"], cs_late: ["Пропускает занятия", "Darslarni qoldiryapti"],
  rep_vat: ["Пробное занятие", "Sinov darsi"], rep_pay: ["Оплата за месяц", "Oylik to‘lov"], rep_fin: ["Итоговый тест", "Yakuniy test"],
  pickH: ["Из подбора курса", "Kurs tanlovidan"], docs: ["Занятий в месяц", "Oyiga darslar"], staffN: ["Человек в группе", "Guruhdagi kishilar"],
  tax: ["Формат", "Format"], tax_usn: ["Группа", "Guruh"], tax_vat: ["Индивидуально", "Yakka tartibda"], ved: ["Онлайн", "Onlayn"],
  pickWhy: ["Человек пришёл с ответами: на звонке не нужно спрашивать уровень заново.", "Odam javoblar bilan keldi: qo‘ng‘iroqda darajani qayta so‘rash shart emas."],
  stNote: ["Статус сразу виден человеку на сайте. «Ученик» добавляет его в «Ученики».", "Holat saytda odamga darhol ko‘rinadi. «O‘quvchi» uni «O‘quvchilar»ga qo‘shadi."],
  clientsHelp: ["Кто ведёт ученика, сколько занятий прошло и что ближайшее.", "O‘quvchini kim olib boradi, nechta dars o‘tdi va eng yaqini nima."],
  noMoney: ["Суммы видят владелец и руководитель центра.", "Summalarni egasi va markaz rahbari ko‘radi."],
  since: ["учится с", "o‘qiydi:"], gotAll: ["Оплата получена", "To‘lov olindi"],
  tariffsHelp: ["Строка цены выходит на сайт: в карточки курсов и в текст заявки.", "Narx qatori saytga chiqadi: kurs kartochkalariga va ariza matniga."],
  tariffsRo: ["Цены курсов меняют владелец и руководитель центра.", "Kurs narxlarini egasi va markaz rahbari o‘zgartiradi."],
  people: ["Команда {name}", "{name} jamoasi"], peopleNote: ["Имена и роли демо: впишете своих преподавателей.", "Ismlar va rollar demo: o‘qituvchilaringizni yozasiz."],
  a_acc: ["назначил преподавателя", "o‘qituvchi tayinladi"], a_docs: ["отметил оплату", "to‘lovni belgiladi"], a_price: ["изменил цену курса", "kurs narxini o‘zgartirdi"],
};
const EDU_KINDS: Record<string, Pair> = { ip: ["Дети", "Bolalar"], opt: ["Подростки", "O‘smirlar"], retail: ["Взрослые", "Kattalar"], serv: ["Студенты", "Talabalar"], prod: ["Компании", "Kompaniyalar"] };
const EDU_TARIFFS: Pair[] = [["Группа", "Guruh"], ["Интенсив", "Intensiv"], ["Индивидуально", "Yakka tartibda"], ["Онлайн", "Onlayn"]];
const EDU_STAFF: Pair[] = [["Малика А.", "Malika A."], ["Бехруз Т.", "Behruz T."], ["Нодира С.", "Nodira S."], ["Отабек Р.", "Otabek R."]];
const EDU_HEADS: Pair[] = [["Вы (владелец)", "Siz (ega)"], ["Шахло К.", "Shahlo K."], ["Жавохир М.", "Javohir M."]];

function eduAdmin(site: InstantSite): string {
  const l = site.locale;
  const i = l === "uz" ? 1 : 0;
  const t = (p: Pair) => p[i];
  const nm = esc(site.name);
  const base = panels.fintax.ui as Record<string, string[]>;
  const ui = Object.fromEntries(Object.entries(base).map(([k, v]) => [k, (EDU_UI[k] ?? v)[i].split("{name}").join(nm)]));
  const services = site.services.slice(0, LIMITS.services);
  // Панель FinTax держит ровно четыре тарифа: курсы клиента, недостающие — форматами занятий.
  const four = [0, 1, 2, 3].map((k) => (services[k] ? { n: services[k].name, p: services[k].price ?? "" } : { n: t(EDU_TARIFFS[k]), p: "" }));
  const pd = {
    lang: l, ui,
    names: NAMES[l].map((x, k) => `${x} ${(l === "uz" ? "ABDEFGHIKL" : "АБВГДЕЖЗИК")[k]}.`),
    staff: EDU_STAFF.map((p, k) => ({ n: t(p), r: services[k]?.name ?? t(EDU_TARIFFS[k]) })),
    heads: EDU_HEADS.map(t),
    // Сколько платят в месяц, млн сум (демо): от группы к индивидуальным.
    tariffs: four.map((x, k) => ({ id: ["ip", "small", "mid", "big"][k], n: x.n, p: x.p, lo: [0.3, 0.5, 0.8, 0.4][k], hi: [0.6, 0.9, 1.6, 0.8][k] })),
    kinds: Object.fromEntries(Object.entries(EDU_KINDS).map(([k, v]) => [k, t(v)])),
    services: services.map((s) => s.name),
    site: PROTO_BASE, prices: PROTO_BASE, tg: site.telegram ? `https://t.me/${esc(site.telegram.replace(/^@/, ""))}` : "",
  };
  const pick = (k: string) => esc(ui[k] ?? k);
  const nav = ["dash", "leads", "clients", "tariffs", "log", "team"];
  const sprite = `<svg width="0" height="0" style="position:absolute" aria-hidden="true">${Object.entries(panels.fintax.sprite as Record<string, string>).map(([k, dd]) => `<symbol id="i-${k}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${dd}</symbol>`).join("")}</svg>`;
  const hex = brandColor(site.color);
  const palette = hex ? (() => { const [h, s0] = hexToHsl(hex); const sat = Math.min(Math.max(s0, 35), 80); return `--teal:hsl(${h} ${sat}% 18%);--teal2:hsl(${h} ${sat}% 34%);--mint:hsl(${h} ${Math.round(sat * 0.5)}% 92%);--deep:hsl(${h} ${sat}% 12%)`; })() : "";
  return page(
    l,
    `${nm} · ${l === "uz" ? "o‘quv markazi paneli · demo" : "панель учебного центра · демо"}`,
    esc(l === "uz" ? "O‘quv markazi paneli: saytdan arizalar, o‘quvchilar, kurslar, jamoa va rollar, tarix. Demo ma’lumotlar." : "Панель учебного центра: заявки с сайта, ученики, курсы, команда и роли, история. Демо-данные."),
    "https://fonts.googleapis.com/css2?family=Golos+Text:wght@400;700&family=Playfair+Display:wght@400;700&display=swap",
    `${panels.fintax.css}:root{${palette}}html,body{overflow-x:clip}.brand .logo img{height:30px;width:auto;max-width:140px;object-fit:contain}`,
    `<body class="panel" data-lang="${l}">
${sprite}
<div class="app">
<div class="nav-back" data-navclose></div>
<aside class="side-nav" aria-label="${pick("sections")}">
<a class="brand" href="${PROTO_BASE}" aria-label="${nm}"><span class="logo">${imageUrl(site.logo) ? `<img src="${esc(imageUrl(site.logo) ?? "")}" alt="" referrerpolicy="no-referrer" onerror="this.remove()">` : nm}</span><small>${pick("panelOf")}</small></a>
<nav class="nav">${nav.map((k) => `<a href="#${k}"><svg class="ic" aria-hidden="true"><use href="#i-${k}"/></svg><span>${pick("n_" + k)}</span>${k === "leads" ? `<i data-cnt hidden>0</i>` : ""}</a>`).join("")}</nav>
<div class="role"><label><span>${pick("viewAs")}</span><select id="role">${["owner", "head", "manager"].map((r) => `<option value="${r}">${pick("role_" + r)}</option>`).join("")}</select></label>
<a class="to-site" href="${PROTO_BASE}"><svg class="ic" aria-hidden="true"><use href="#i-ext"/></svg><span>${pick("toSite")}</span></a></div>
</aside>
<div class="main">
<header class="topbar"><button type="button" class="ib" id="menu-b" aria-label="${pick("menu")}"><svg class="ic" aria-hidden="true"><use href="#i-menu"/></svg></button><b class="tb-t" id="tb-t"></b><span class="sp"></span></header>
<main id="pv" tabindex="-1"></main>
<p class="demo">${pick("demoNote")} <a href="${esc(mockupTermsUrl(l))}" target="_blank" rel="noopener">${pick("terms")}</a></p>
</div></div>
<div id="mdl" hidden></div>
<div id="toast" role="status" aria-live="polite"></div>
<script type="application/json" id="fp-data">${json(pd)}</script>
<script>
${panels.fintax.js}</script>
</body>`,
  );
}

// ── Панель мебели: магазин Greenwell ─────────────────────────────────
/** Подписи Greenwell, которые про их витрину на Uzum, — словами мебельной компании. */
const MEBEL_UI: Record<string, Pair> = {
  rvAvgS: ["по отзывам на сайте", "saytdagi sharhlar bo‘yicha"],
  rvDemo: ["Отзывы демо, кроме тех, что вы оставили на сайте сами: так они будут приходить от покупателей.", "Sharhlar demo, saytda o‘zingiz qoldirganlaridan tashqari: xaridorlardan ular shunday keladi."],
};
/** Изделия без цены на сайте — с демо-ценой в сумах: на ней считаются заказы и прибыль, подписано «демо». */
const MEBEL_DEMO_PRICE = [8_500_000, 6_200_000, 4_800_000, 3_900_000, 12_000_000, 2_700_000, 5_400_000, 7_100_000];
const MEBEL_FALLBACK: Pair[] = [["Кухня на заказ", "Buyurtma oshxona"], ["Шкаф-купе", "Kupe shkaf"], ["Диван", "Divan"], ["Кровать", "Karavot"]];

/** Цена изделия целым числом в сумах — первое число с сайта клиента («от 5 000 000 сум» → 5000000), иначе 0. */
export function sumPrice(price: string | null): number {
  if (!price || /\$|usd|доллар|dollar/i.test(price)) return 0;
  const m = price.replace(/\u00a0/g, " ").match(/\d[\d ]{3,}/);
  const n = m ? Number(m[0].replace(/ /g, "")) : 0;
  return n >= 50_000 ? n : 0;
}

/** Товары магазина без цены числом — с демо-ценой в сумах, подписано «демо». */
const SHOP_DEMO_PRICE = [320_000, 185_000, 540_000, 95_000, 260_000, 410_000, 150_000, 720_000];
const SHOP_FALLBACK: Pair[] = [["Товар", "Mahsulot"], ["Новинка", "Yangilik"], ["Хит продаж", "Xit"], ["Подарочный набор", "Sovg‘a to‘plami"]];

/**
 * Панель магазина Greenwell: у мебели (заказы — замеры и сборка) и у
 * интернет-магазина (заказы — с сайта шаблона, память `ms-demo-1`, товары —
 * те же номера, что у магазина: g0, g1…).
 */
function mebelAdmin(site: InstantSite, kind: "mebel" | "magazin" = "mebel"): string {
  const shop = kind === "magazin";
  const l = site.locale;
  const i = l === "uz" ? 1 : 0;
  const t = (p: Pair) => p[i];
  const nm = esc(site.name);
  const base = panels.greenwell.ui as Record<string, string[]>;
  const ui = Object.fromEntries(Object.entries(base).map(([k, v]) => [k, (MEBEL_UI[k] ?? v)[i].split("{name}").join(nm)]));
  const own = site.photos.map(imageUrl).filter((u): u is string => Boolean(u));
  const items = site.services.length
    ? site.services.slice(0, shop ? 12 : 8).map((x) => ({ n: x.name, p: shop ? shopPrice(x.price) : sumPrice(x.price) }))
    : (shop ? SHOP_FALLBACK : MEBEL_FALLBACK).map((x) => ({ n: t(x), p: 0 }));
  const demoPrice = shop ? SHOP_DEMO_PRICE : MEBEL_DEMO_PRICE;
  const products = items.map((x, k) => ({
    id: `${shop ? "g" : "m"}${k}`, cat: "all", price: x.p || demoPrice[k % demoPrice.length], old: null, count: 1, form: "", rating: 0, reviews: 0,
    orders: `${[60, 45, 38, 30, 22, 18, 14, 10][k] ?? 10}+`, g: 0, c: false, back: 0, n: x.n, s: "", b: [], alt: "", how: "", comp: "", tags: [], rev: [], uzum: "",
  }));
  const stock = shop ? MAGAZIN_PHOTOS : MEBEL_PHOTOS.map((x) => x.replace("-1200", "-900"));
  const ph = Object.fromEntries(products.map((p, k) => [p.id, own[k % Math.max(own.length, 1)] ?? stock[k % stock.length]]));
  const me = l === "uz" ? "Siz (ega)" : "Вы (владелец)";
  const managers = l === "uz" ? ["Dilnoza", "Aziz", "Madina"] : ["Дилноза", "Азиз", "Мадина"];
  const couriers = l === "uz" ? ["Sherzod", "Behzod", "Ulug‘bek", "Jasur"] : ["Шерзод", "Бехзод", "Улугбек", "Жасур"];
  const roles: Record<string, string> = { [me]: l === "uz" ? "Ega" : "Владелец" };
  managers.forEach((m, k) => (roles[m] = [t(["Старший менеджер", "Katta menejer"]), shop ? t(["Заказы", "Buyurtmalar"]) : t(["Замеры и заказы", "O‘lchov va buyurtmalar"]), t(["Отзывы и поддержка", "Sharhlar va qo‘llab-quvvatlash"])][k]));
  couriers.forEach((c) => (roles[c] = shop ? t(["Доставка", "Yetkazish"]) : t(["Доставка и сборка", "Yetkazish va yig‘ish"])));
  const first = products[0]?.id ?? "m0";
  const pd = {
    lang: l, img: "", ph, name: site.name, ui, products,
    cats: [{ id: "all", n: shop ? t(["Товары", "Mahsulotlar"]) : t(["Изделия", "Mahsulotlar"]) }],
    shop: { delivery: shop ? 25_000 : 150_000, freeFrom: shop ? 500_000 : 5_000_000, pointsRate: 0, pointsMaxShare: 0, reviewPts: 0, reviewPhotoPts: 0, welcome: 0, promo: {}, levels: [] },
    nasiya: [{ id: "uzum", n: "Uzum Nasiya", c: "#7000ff", terms: { 3: 0, 6: 8, 12: 16 } }, { id: "alif", n: "Alif Nasiya", c: "#00a651", terms: { 3: 0, 6: 9, 12: 18 } }],
    pays: [{ id: "click", n: "Click" }, { id: "payme", n: "Payme" }, { id: "uzumbank", n: "Uzum Bank" }, { id: "card", n: "Uzcard / Humo" }, { id: "cash", n: t(["Наличными при доставке", "Yetkazishda naqd"]) }, { id: "nasiya", n: t(["Рассрочка", "Muddatli to‘lov"]) }],
    couriers, managers, roles, me,
    sources: [
      { id: "ig", n: "Instagram", w: 38, c: "#c13584", t: "3:20", b: 26 }, { id: "tg", n: "Telegram", w: 21, c: "#229ed9", t: "3:05", b: 24 },
      { id: "google", n: "Google", w: 17, c: "#4285f4", t: "2:40", b: 33 }, { id: "yandex", n: t(["Яндекс", "Yandex"]), w: 8, c: "#fc3f1d", t: "2:10", b: 37 },
      { id: "direct", n: t(["Прямые заходы", "To‘g‘ridan-to‘g‘ri"]), w: 10, c: "#5b6b61", t: "3:50", b: 21 }, { id: "ads", n: t(["Реклама", "Reklama"]), w: 6, c: "#b7862c", t: "1:40", b: 44 },
    ],
    districts: t(["Юнусабад|Мирзо-Улугбек|Чиланзар|Яккасарай|Мирабад|Шайхантахур|Алмазар|Сергели|Яшнабад|Учтепа", "Yunusobod|Mirzo Ulug‘bek|Chilonzor|Yakkasaroy|Mirobod|Shayxontohur|Olmazor|Sergeli|Yashnobod|Uchtepa"]).split("|"),
    clients: NAMES[l].map((n, k) => ({ n: `${n} ${(l === "uz" ? "RKAMXSTDIU" : "РКАМХШТДСУ")[k]}.`, ph: `+998 9${k % 10} *** ${10 + k * 7} ${20 + k * 5}` })),
    costShare: Object.fromEntries(products.map((p, k) => [p.id, [0.46, 0.5, 0.44, 0.52, 0.48, 0.45, 0.5, 0.47][k % 8]])),
    stock: Object.fromEntries(products.map((p, k) => [p.id, [6, 14, 9, 3, 11, 20, 7, 5][k % 8]])),
    logActs: [
      shop
        ? { k: "st", who: "m", v: [t(["Собран", "Yig‘ildi"]), t(["Передан курьеру", "Kuryerga berildi"])] }
        : { k: "st", who: "m", v: [t(["Замер назначен", "O‘lchov belgilandi"]), t(["В производстве", "Ishlab chiqarishda"])] },
      { k: "st", who: "c", v: [shop ? t(["Доставлен", "Yetkazildi"]) : t(["Доставлен и собран", "Yetkazildi va yig‘ildi"])] },
      { k: "cour", who: "m", v: couriers },
      { k: "call", who: "m", v: shop
        ? [t(["подтвердил заказ", "buyurtmani tasdiqladi"]), t(["перенёс доставку на субботу", "yetkazishni shanbaga ko‘chirdi"]), t(["уточнил адрес", "manzilni aniqladi"])]
        : [t(["подтвердил замер", "o‘lchovni tasdiqladi"]), t(["перенёс доставку на субботу", "yetkazishni shanbaga ko‘chirdi"]), t(["уточнил цвет фасадов", "fasad rangini aniqladi"])] },
      { k: "rvok", who: "m", v: products.slice(0, 3).map((p) => p.n) }, { k: "reply", who: "m", v: products.slice(0, 2).map((p) => p.n) },
    ],
    pending: [
      { id: first, a: t(["Камола", "Kamola"]), d: "14.10", r: 5, t: (shop ? t(["Привезли вовремя, всё как на фото.", "O‘z vaqtida olib kelishdi, hammasi suratdagidek."]) : t(["Замерщик приехал вовремя, собрали аккуратно за один день.", "O‘lchovchi o‘z vaqtida keldi, bir kunda ehtiyotkorlik bilan yig‘ishdi."])), o: "Z-10466", photo: 1 },
      { id: products[1]?.id ?? first, a: t(["Рустам", "Rustam"]), d: "14.10", r: 4, t: (shop ? t(["Товар хороший, но доставку перенесли на день.", "Mahsulot yaxshi, lekin yetkazishni bir kunga ko‘chirishdi."]) : t(["Качество хорошее, но доставку перенесли на день.", "Sifat yaxshi, lekin yetkazishni bir kunga ko‘chirishdi."])), o: "Z-10461" },
      { id: products[2]?.id ?? first, a: t(["[[t:0]]", "[[t:0]]"]), d: "13.10", r: 2, t: (shop ? t(["Пришёл не тот размер. Хочу обменять.", "Boshqa o‘lcham keldi. Almashtirmoqchiman."]) : t(["Одна дверца закрывается неровно. Хочу, чтобы мастер приехал и поправил.", "Bitta eshik notekis yopiladi. Usta kelib to‘g‘rilashini xohlayman."])), o: "Z-10455" },
    ],
    replyTpl: shop ? t(["Спасибо за отзыв! Рады, что покупка понравилась.", "Sharh uchun rahmat! Xarid yoqqanidan xursandmiz."]) : t(["Спасибо за отзыв! Рады, что мебель понравилась.", "Sharh uchun rahmat! Mebel yoqqanidan xursandmiz."]),
    cmpReply: shop ? t(["Извините за это. Курьер заберёт товар и привезёт нужный размер.", "Buning uchun uzr. Kuryer mahsulotni olib, kerakli o‘lchamni olib keladi."]) : t(["Извините за это. Мастер приедет завтра и всё поправит бесплатно.", "Buning uchun uzr. Usta ertaga kelib, hammasini bepul to‘g‘rilaydi."]),
    geo: t(["Ташкент|Ташкентская обл.|Самарканд|Фергана|Наманган|Другие", "Toshkent|Toshkent vil.|Samarqand|Farg‘ona|Namangan|Boshqalar"]).split("|").map((n, k) => [n, [58, 14, 8, 7, 5, 8][k]]),
    topPages: [[t(["Главная", "Bosh sahifa"]), 64], [products[0]?.n ?? "", 24], [t(["Каталог", "Katalog"]), 19], [products[1]?.n ?? products[0]?.n ?? "", 12], [shop ? t(["Корзина", "Savat"]) : t(["Заявка на замер", "O‘lchovga ariza"]), 9]],
    searches: products.slice(0, 6).map((p, k) => [p.n.toLowerCase(), [42, 31, 24, 18, 11, 7][k]]),
    // Заказов мебели в день в разы меньше, чем у магазина биодобавок.
    k: shop ? 0.6 : 0.25,
  };
  const ic = (k: string) => `<svg class="ic" aria-hidden="true"><use href="#i-${k}"/></svg>`;
  const nav: [string, string, Pair, string?][] = [
    ["dash", "grid", ["Сводка", "Umumiy"]], ["orders", "box", ["Заказы", "Buyurtmalar"], "orders"], ["reviews", "star", ["Отзывы", "Sharhlar"], "reviews"],
    ["goods", "tag", shop ? ["Товары и прибыль", "Mahsulotlar va foyda"] : ["Изделия и прибыль", "Mahsulotlar va foyda"]], ["logistics", "truck", shop ? ["Доставка", "Yetkazish"] : ["Доставка и сборка", "Yetkazish va yig‘ish"]], ["nasiya", "cal", ["Рассрочка", "Muddatli to‘lov"]],
    ["traffic", "chart", ["Посещаемость", "Tashriflar"]], ["log", "list", ["История менеджеров", "Menejerlar tarixi"]],
  ];
  const sprite = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>${Object.entries(panels.greenwell.icons as Record<string, string>).map(([k, v]) => `<symbol id="i-${k}" viewBox="0 0 24 24" stroke="currentColor">${v}</symbol>`).join("")}</defs></svg>`;
  const logo = imageUrl(site.logo);
  const brand = logo ? `<img class="logo-w" src="${esc(logo)}" alt="${nm}" referrerpolicy="no-referrer" style="height:28px;width:auto;max-width:150px;object-fit:contain">` : `<b class="logo-w" style="font:700 18px/1.2 var(--head);color:#fff">${nm}</b>`;
  const hex = brandColor(site.color);
  const palette = hex ? (() => { const [h, s0] = hexToHsl(hex); const sat = Math.min(Math.max(s0, 35), 80); return `--g:hsl(${h} ${sat}% 28%);--g2:hsl(${h} ${sat}% 20%);--g3:hsl(${h} ${sat}% 36%);--gl:hsl(${h} ${Math.round(sat * 0.5)}% 92%);--gl2:hsl(${h} ${Math.round(sat * 0.4)}% 96%)`; })() : "";
  const terms = l === "uz" ? ["DevUz Studio maketi: panel ma’lumotlari demo.", "Foydalanish shartlari"] : ["Макет DevUz Studio: данные панели демо.", "Условия использования"];
  return page(
    l,
    `${nm} · ${l === "uz" ? "do‘kon paneli · demo" : "панель магазина · демо"}`,
    esc(shop
      ? (l === "uz" ? "Internet-do‘kon paneli: saytdan buyurtmalar tarixi bilan, sharhlar, foyda, yetkazish, muddatli to‘lov, tashriflar. Demo ma’lumotlar." : "Панель интернет-магазина: заказы с сайта с историей, отзывы, прибыль, доставка, рассрочка, посещаемость. Демо-данные.")
      : (l === "uz" ? "Mebel do‘koni paneli: buyurtmalar tarixi bilan, sharhlar, foyda, yetkazish va yig‘ish, muddatli to‘lov, tashriflar. Demo ma’lumotlar." : "Панель мебельного магазина: заказы с историей, отзывы, прибыль, доставка и сборка, рассрочка, посещаемость. Демо-данные.")),
    "https://fonts.googleapis.com/css2?family=Manrope:wght@400;700&family=Montserrat:wght@400;700&display=swap",
    `${panels.greenwell.css}:root{${palette}}`,
    `<body class="panel" data-lang="${l}">
${sprite}
<div class="app">
<div class="nav-back" onclick="document.body.classList.remove('nav-on')"></div>
<aside class="side-nav" aria-label="${l === "uz" ? "Panel bo‘limlari" : "Разделы панели"}">
<div class="brand">${brand}<span><small>${l === "uz" ? "Do‘kon paneli" : "Панель магазина"}</small></span></div>
<nav class="nav">${nav.map(([k, icn, n, c]) => `<a href="#${k}">${ic(icn)}<span>${t(n)}</span>${c ? `<i data-cnt="${c}" hidden>0</i>` : ""}</a>`).join("")}</nav>
<div class="role"><p>${l === "uz" ? "Kim sifatida ko‘rish" : "Смотреть как"}</p><div role="radiogroup"><button type="button" role="radio" data-role="owner" aria-checked="true">${l === "uz" ? "Ega" : "Владелец"}</button><button type="button" role="radio" data-role="mgr" aria-checked="false">${l === "uz" ? "Menejer" : "Менеджер"}</button></div>
<a class="to-shop" href="${PROTO_BASE}">${ic("bag")}<span>${l === "uz" ? "Saytni ochish" : "Открыть сайт"}</span></a></div>
</aside>
<div class="main">
<header class="topbar"><button type="button" class="ib" id="menu-b" aria-label="${l === "uz" ? "Menyu" : "Меню"}">${ic("menu")}</button><span class="sp"></span><span class="me"><span class="av">${l === "uz" ? "S" : "В"}</span></span></header>
<main id="pv"></main>
<p class="demo" style="padding:0 28px 24px">${terms[0]} <a href="${esc(mockupTermsUrl(l))}" target="_blank" rel="noopener">${terms[1]}</a></p>
</div></div>
<div id="side" hidden></div>
<div id="toast" role="status" aria-live="polite"></div>
<script type="application/json" id="gp-data">${json(pd)}</script>
<script>
${shop ? panels.greenwell.js.split("'mb-demo-1'").join("'ms-demo-1'").split("'mb-panel-1'").join("'ms-panel-1'") : panels.greenwell.js}</script>
</body>`,
  );
}

// ── Панель недвижимости: управляющая компания Soffice ────────────────
/** Демо-дома агентства: районы, класс, ставка аренды за м² в месяц. Здания Soffice не берутся. */
const NEDV_DIST: [string, Pair][] = [["yunusabad", ["Юнусабад", "Yunusobod"]], ["mirabad", ["Мирабад", "Mirobod"]], ["chilanzar", ["Чиланзар", "Chilonzor"]], ["mirzo", ["Мирзо-Улугбек", "Mirzo Ulug‘bek"]], ["yakkasaray", ["Яккасарай", "Yakkasaroy"]], ["sergeli", ["Сергели", "Sergeli"]]];
const NEDV_CLS = ["A", "B+", "B", "A+", "B", "B+"];
const NEDV_MARKET: Record<string, number> = { "A+": 190000, A: 150000, "B+": 120000, B: 95000 };
const NEDV_FIRST: Record<InstantLocale, string[]> = {
  ru: ["Алишер", "Нигора", "Сардор", "Камила", "Бобур", "Лола", "Рустам", "Гульноза", "Ильхом", "Севара", "Дмитрий", "Анна"],
  uz: ["Alisher", "Nigora", "Sardor", "Kamila", "Bobur", "Lola", "Rustam", "Gulnoza", "Ilhom", "Sevara", "Dmitriy", "Anna"],
};
const NEDV_LAST: Record<InstantLocale, string[]> = {
  ru: ["Каримов", "Юсупова", "Ахмедов", "Рашидова", "Турсунов", "Саидова", "Комилов", "Ибрагимова"],
  uz: ["Karimov", "Yusupova", "Ahmedov", "Rashidova", "Tursunov", "Saidova", "Komilov", "Ibragimova"],
};
const NEDV_UI: Record<string, Pair> = {
  f_office: ["квартира", "kvartira"], f_cabinet: ["комната", "xona"], f_open: ["коммерческое", "tijorat"],
  objS: ["Дома, этажи и квартиры. Статус и ставка меняются здесь и сразу видны на сайте.", "Uylar, qavatlar va kvartiralar. Holat va stavka shu yerda o‘zgaradi va saytda darhol ko‘rinadi."],
};

function nedvAdmin(site: InstantSite): string {
  const l = site.locale;
  const i = l === "uz" ? 1 : 0;
  const t = (p: Pair) => p[i];
  const nm = esc(site.name);
  const so = panels.soffice as unknown as {
    ui: Record<string, (string | string[])[]>; sprite: Record<string, string>; css: string; js: string;
    units: { n: string; r: number[]; a: number; w: string }[]; inv: unknown[]; team: { id: string; role: string; n: string[] }[];
    tariff: Record<string, number>;
  };
  const sub = (x: string) => x.split("{name}").join(nm).split("{site}").join(l === "uz" ? "sayt" : "сайт");
  const ui = Object.fromEntries(Object.entries(so.ui).map(([k, v]) => {
    const x = NEDV_UI[k] ? NEDV_UI[k][i] : v[i];
    return [k, Array.isArray(x) ? x.map(sub) : sub(x)];
  }));
  const own = site.photos.map(imageUrl).filter((u): u is string => Boolean(u));
  const city = site.city ?? (l === "uz" ? "Toshkent" : "Ташкент");
  const bc = NEDV_DIST.map(([d, dn], k) => ({
    id: `o${k}`, n: l === "uz" ? `${t(dn)}dagi uy ${k + 1}` : `Дом в ${t(dn)} ${k + 1}`.replace("в Юнусабад", "на Юнусабаде").replace("в Мирабад", "на Мирабаде").replace("в Чиланзар", "на Чиланзаре").replace("в Мирзо-Улугбек", "в Мирзо-Улугбеке").replace("в Яккасарай", "в Яккасарае").replace("в Сергели", "в Сергелях"),
    cls: NEDV_CLS[k], d, dn: t(dn), rate: Math.round((NEDV_MARKET[NEDV_CLS[k]] * (0.92 + k * 0.02)) / 1000) * 1000,
    a: l === "uz" ? `${city}, [[t:${k % 2}]] ko‘chasi, ${10 + k * 3}` : `${city}, ул. [[t:${k % 2}]], ${10 + k * 3}`, m: t(dn),
  }));
  // Этажи и занятость — как у Soffice, площадь блоков — втрое меньше: жилой дом, а не бизнес-центр.
  const inv = Object.fromEntries(bc.map((b, k) => { const v = so.inv[k % so.inv.length] as { fl: number; k: number; s: string }; return [b.id, { ...v, k: Math.round(v.k * 35) / 100 }]; }));
  const ph = Object.fromEntries(bc.map((b, k) => [b.id, own[k % Math.max(own.length, 1)] ?? NEDV_PHOTOS[k % NEDV_PHOTOS.length]]));
  const w: Record<string, Pair> = { n: ["на север", "shimolga"], ne: ["на север и восток", "shimol va sharqqa"], s: ["на юг", "janubga"], se: ["на юг и восток", "janub va sharqqa"] };
  const logoUrl = imageUrl(site.logo);
  const logo = logoUrl ? `<img src="${esc(logoUrl)}" alt="${nm}" referrerpolicy="no-referrer" style="height:40px;width:auto;max-width:180px;object-fit:contain">` : `<b style="font-size:22px">${nm}</b>`;
  const pd = {
    lang: l, ui, name: site.name, logo, ph, kp: `${PROTO_BASE}/kp#`,
    bc, inv,
    units: so.units.map((u) => ({ n: u.n, r: u.r, a: u.a, w: t(w[u.w] ?? w.n) })),
    owners: [
      { id: "w1", n: t(["Частные собственники", "Xususiy egalar"]), bcs: ["o0", "o2", "o4"] },
      { id: "w2", n: t(["Застройщик", "Quruvchi"]), bcs: ["o1", "o3"] },
      { id: "w3", n: t(["Инвестор", "Investor"]), bcs: ["o5"] },
    ],
    team: so.team.map((p) => ({ id: p.id, role: p.role, n: p.n[i] })),
    market: NEDV_MARKET, tariff: so.tariff,
    // Арендаторы жилья — люди: имя и фамилия вместо названий компаний Soffice.
    roots: NEDV_FIRST[l], kinds: NEDV_LAST[l],
    first: NEDV_FIRST[l], lastI: (l === "uz" ? "KRMATSYu" : "КРМАТШЮ").split("").filter((c) => c !== "u").map((c) => `${c}.`),
    dist: Object.fromEntries(NEDV_DIST.map(([d, dn]) => [d, t(dn)])),
    site: `${PROTO_BASE}/`,
  };
  const pick = (k: string) => { const v = ui[k]; return esc(Array.isArray(v) ? v.join(" ") : (v ?? k)); };
  const nav = ["dash", "leads", "views", "objects", "leases", "bills", "service", "owners", "demand", "team"];
  const cnt: Record<string, string> = { leads: "leads", bills: "bills", service: "service" };
  const roles = ["owner", "head", "broker", "acc", "ops", "own"];
  const sprite = `<svg width="0" height="0" style="position:absolute" aria-hidden="true">${Object.entries(so.sprite).map(([k, d]) => `<symbol id="i-${k}" viewBox="0 0 24 24">${d}</symbol>`).join("")}</svg>`;
  const hex = brandColor(site.color);
  const palette = hex ? (() => { const [h, s0] = hexToHsl(hex); const sat = Math.min(Math.max(s0, 45), 90); return `--or:hsl(${h} ${sat}% 56%);--or2:hsl(${h} ${sat}% 66%);--or-d:hsl(${h} ${sat}% 36%);--or-bg:hsl(${h} ${sat}% 95%)`; })() : "";
  return page(
    l,
    `${nm} · ${l === "uz" ? "ko‘chmas mulk paneli · demo" : "панель агентства недвижимости · демо"}`,
    esc(l === "uz" ? "Agentlik paneli: arizalar va bitimlar, ko‘rishlar, qavatlari bilan obyektlar, shartnomalar, hisoblar, egalarga hisobot. Demo ma’lumotlar." : "Панель агентства: заявки и сделки, просмотры, объекты с этажами, договоры, счета, отчёт собственнику. Демо-данные."),
    "https://fonts.googleapis.com/css2?family=Manrope:wght@700&family=Onest:wght@400;700&display=swap",
    `${so.css}:root{${palette}}`,
    `<body class="panel" data-lang="${l}">
${sprite}
<div class="app">
<div class="nav-back" data-navclose onclick="document.body.classList.remove('nav-on')"></div>
<aside class="side-nav" aria-label="${l === "uz" ? "Panel bo‘limlari" : "Разделы панели"}">
<a class="brand" href="${PROTO_BASE}" aria-label="${nm}">${logo}<small>${l === "uz" ? "Agentlik paneli" : "Панель агентства"}</small></a>
<nav class="nav">${nav.map((k) => `<a href="#${k}"><svg class="ic" aria-hidden="true"><use href="#i-${k}"/></svg><span>${k === "team" ? (l === "uz" ? "Jamoa va rollar" : "Команда и роли") : pick("n_" + k)}</span>${cnt[k] ? `<i data-cnt="${cnt[k]}" hidden>0</i>` : ""}</a>`).join("")}</nav>
<div class="role"><label><span>${l === "uz" ? "Kim sifatida ko‘rish" : "Смотреть как"}</span><select id="role">${roles.map((r) => `<option value="${r}">${pick("role_" + r)}</option>`).join("")}</select></label>
<label id="own-w" hidden><span>${l === "uz" ? "Ega" : "Собственник"}</span><select id="own">${pd.owners.map((o) => `<option value="${o.id}">${esc(o.n)} (${l === "uz" ? "demo" : "демо"})</option>`).join("")}</select></label>
<a class="to-site" href="${PROTO_BASE}"><svg class="ic" aria-hidden="true"><use href="#i-ext"/></svg><span>${l === "uz" ? "Saytni ochish" : "Открыть сайт"}</span></a></div>
</aside>
<div class="main">
<header class="topbar"><button type="button" class="ib" id="menu-b" aria-label="${l === "uz" ? "Menyu" : "Меню"}"><svg class="ic" aria-hidden="true"><use href="#i-menu"/></svg></button><span class="sp"></span><span class="me"><span class="av" aria-hidden="true">${esc(site.name.slice(0, 1).toUpperCase())}</span><span id="me-n"></span></span></header>
<main id="pv" tabindex="-1"></main>
<p class="demo">${l === "uz" ? "DevUz Studio maketi: panel ma’lumotlari demo." : "Макет DevUz Studio: данные панели демо."} <a href="${esc(mockupTermsUrl(l))}" target="_blank" rel="noopener">${l === "uz" ? "Foydalanish shartlari" : "Условия использования"}</a></p>
</div></div>
<div id="side" hidden></div>
<div id="mdl" hidden></div>
<div id="toast" role="status" aria-live="polite"></div>
<script type="application/json" id="sp-data">${json(pd)}</script>
<script>
${so.js}</script>
</body>`,
  );
}

// ── Админка салона красоты: панель «Сияние Севера» ────────────────────
// Своей панели у салона не было; берём админку нашего сайта клиники
// косметологии: «Сообщения» всех каналов одним окном, «Сайт», подключения.
// Она на русском (подписи зашиты в её скрипт), для узбекского макета тоже.
const SF = (k: string, label: string, type = "text", max = 120, hint = "") => ({ k, label, type, max, hint });

function salonPalette(color: string | null): string {
  const hex = brandColor(color);
  const [h, s0, l0] = hex ? hexToHsl(hex) : [345, 42, 44];
  const s = Math.min(Math.max(s0, 28), 62);
  const l = Math.min(Math.max(l0, 34), 48);
  return `--onyx:hsl(${h} ${s}% ${l}%);--onyx2:hsl(${h} ${Math.min(s + 8, 70)}% ${Math.min(l + 30, 84)}%);--onyx-ink:#fff;--paper:#fbf6f1;--paper2:hsl(${h} 38% 94%);--ink:#2a1f24;--ink2:#35272d;--text:#2e2226;--f-d:'Cormorant Garamond',Georgia,serif;--f-t:'Onest',system-ui,sans-serif`;
}

function salonAdmin(site: InstantSite): string {
  const l = site.locale;
  const services = site.services.slice(0, LIMITS.services);
  const any = "Запись в салон";
  const s = (k: number) => (services.length ? services[k % services.length].name : any);
  const N = NAMES.ru;
  const tel = (k: number) => `+998 9• ••• •• ${String(10 + k * 7).slice(-2)}`;
  const owner = N[5];
  const admin = N[3];
  const masters = site.doctors.slice(0, LIMITS.doctors).map((d) => ({ name: d.name, role: d.role ?? "", img: "" }));
  const pd = {
    v: `${site.name}|${services.length}`, name: site.name, sign: markOf(site, "pn-sign"), site: PROTO_BASE, any,
    trap: "[[t:0]] [[t:1]]",
    roles: { owner: "Владелец", admin: "Администратор" },
    st: { new: "Новая", confirmed: "Подтверждена", came: "Пришёл", canceled: "Отменена" },
    conn: { amo: "amoCRM", tg: "Telegram-бот", wz: "Wazzup" },
    team: [[owner, "owner", "owner"], [admin, "admin", "admin"]],
    bot: "salon_demo_bot",
    thanks: "Спасибо, буду ждать!",
    channels: [{ kind: "instagram", plain: site.instagram ?? "" }, { kind: "whatsapp", plain: "" }, { kind: "telegram", plain: "" }, { kind: "vk", plain: "" }],
    pipes: [{ id: 1, name: "Запись в салон", statuses: [{ id: 11, name: "Новая заявка" }, { id: 12, name: "Подтверждена" }, { id: 13, name: "Пришёл" }] }],
    leads: [
      { name: N[1], phone: tel(1), what: s(0), wish: "Сегодня, вечер", src: "booking", status: "new", ago: 1 },
      { name: N[7], phone: tel(2), what: s(1), wish: "Завтра, утро", src: "wz", status: "new", ago: 3, conv: 1 },
      { name: N[9], phone: tel(3), what: s(2), wish: "Суббота", src: "booking", status: "confirmed", ago: 9, note: "Просила того же мастера, что в прошлый раз." },
      { name: N[0], phone: tel(4), what: s(0), wish: "", src: "tg", status: "confirmed", ago: 26, conv: 4 },
      { name: N[8], phone: tel(5), what: s(3), wish: "Пятница, после работы", src: "chat", status: "came", ago: 52, conv: 5 },
      { name: N[2], phone: tel(6), what: s(1), wish: "", src: "booking", status: "came", ago: 180 },
      { name: N[6], phone: tel(7), what: s(4), wish: "Воскресенье", src: "wz", status: "came", ago: 215 },
      { name: N[4], phone: tel(8), what: s(2), wish: "", src: "booking", status: "canceled", ago: 290, note: "Перенесла на следующий месяц." },
    ],
    // Переписки демо: [кто, текст, часов назад]. Цен и чужих фактов в них нет.
    convs: [
      { name: N[7], kind: "instagram", unread: 2, msgs: [["in", `Здравствуйте! Увидела у вас в профиле работу. Хочу так же: ${s(1)}. Есть время на завтра?`, 3.2], ["in", "Могу утром до работы.", 3]] },
      { name: N[1], kind: "whatsapp", phone: tel(1), unread: 1, msgs: [["in", `Добрый день. Записалась на сайте: ${s(0)}. Подскажите, сколько по времени займёт?`, 1.1]] },
      { name: N[9], kind: "instagram", msgs: [["in", "А можно прийти вдвоём с подругой в одно время?", 8], ["out", "Здравствуйте! Да, поставим вас к двум мастерам рядом. На какой день смотрим?", 7.6], ["in", "На субботу, ближе к обеду.", 7.5], ["out", "Записала на субботу. Напомню накануне.", 7.4]] },
      { name: N[0], kind: "tg", msgs: [["in", `Здравствуйте, нужна запись: ${s(0)}.`, 27], ["out", "Добрый день! Есть окна завтра и в четверг. Когда удобнее?", 26.5], ["in", "В четверг.", 26.2], ["out", "Готово, ждём вас в четверг.", 26]] },
      { name: N[8], kind: "site", msgs: [["in", "Пишу с сайта. У вас есть парковка рядом?", 53], ["out", "Да, можно встать у входа. Записать вас?", 52.5], ["in", "Да, на пятницу после работы.", 52.2], ["out", "Записала. До встречи!", 52]] },
      { name: N[6], kind: "vk", unread: 1, msgs: [["in", `Подскажите, вы работаете в воскресенье? Интересует: ${s(4)}.`, 5]] },
    ],
    posts: [
      { title: `${s(2)}: как подготовиться к визиту`, text: "Пример статьи. Расскажите, что сделать накануне, что взять с собой и чего не делать перед визитом. Такие статьи находят в поиске, а анонс в Telegram и Instagram возвращает тех, кто давно не заходил.", status: "published", ago: 70, ch: { site: true, tg: true, ig: true } },
      { title: "Как сохранить цвет волос после окрашивания", text: "Пример статьи. Коротко и по делу: чем мыть голову в первые дни, как сушить, когда прийти на обновление тона. Допишите свои советы и опубликуйте.", status: "published", ago: 240, ch: { site: true, tg: true, ig: false } },
      { title: "Какое покрытие выбрать для ногтей", text: "Черновик. Сравните покрытия простыми словами: кому что подходит и как за ним ухаживать.", status: "draft", ago: 20, ch: { site: true, tg: false, ig: false } },
    ],
    log: [[1.1, admin, `Заявка от ${N[1]}: «Новая»`], [7.4, admin, `Ответила в Instagram Direct: ${N[9]}`], [26, admin, "Заявка: «Подтверждена»"], [70, owner, "Опубликовала статью"], [96, owner, "Изменила на сайте: «Акции»"], [140, owner, "Подключила: Wazzup"]],
    texts: { hero: "Первый экран", services: "Услуги и цены", lab: "Подбор цвета", book: "Запись" },
    groups: [
      { key: "contacts", title: "Контакты", hint: "Телефон, часы и адрес стоят на всём сайте: в шапке, кнопках, контактах и подвале. Пустое поле: кнопки нет.", kind: "object",
        fields: [SF("phone", "Телефон", "text", 30), SF("hours", "Часы работы", "text", 60), SF("addr", "Адрес", "text", 120), SF("telegram", "Telegram: ник без @", "text", 40), SF("whatsapp", "WhatsApp: номер", "text", 20), SF("instagram", "Instagram: ник без @", "text", 40)] },
      { key: "services", title: "Услуги и цены", hint: "Список в разделе «Услуги и цены». Эти же услуги клиент выбирает в записи.", kind: "list", max: 20, fields: [SF("t", "Услуга", "text", 80), SF("p", "Цена", "text", 40)] },
      { key: "promos", title: "Акции", hint: "Акция встаёт на сайте отдельным блоком и уходит анонсом в мессенджеры. Срок вышел: блок сам пропадает.", kind: "list", max: 6, fields: [SF("t", "Акция", "text", 80), SF("d", "Условия", "area", 240), SF("until", "До какого числа", "text", 30), SF("on", "Показывать на сайте", "bool")] },
      { key: "masters", title: "Мастера", hint: "Фото лучше квадратное, JPG или PNG.", kind: "list", max: 8, fields: [SF("name", "Имя", "text", 80), SF("role", "Специальность", "text", 120), SF("img", "Фото", "image")] },
      { key: "perks", title: "Почему к нам", hint: "", kind: "list", max: 6, fields: [SF("t", "Причина", "text", 120)] },
      { key: "texts", title: "Тексты разделов", hint: "Заголовки и абзацы блоков. Пустое поле: стоит текст по умолчанию.", kind: "texts" },
    ],
    defaults: {
      contacts: { phone: site.phone ?? "", hours: site.hours ?? "", addr: site.address ?? "", telegram: site.telegram ?? "", whatsapp: site.whatsapp ?? "", instagram: site.instagram ?? "" },
      services: services.map((x) => ({ t: x.name, p: x.price ?? "" })),
      promos: [
        { t: "Пример: подарок новым клиентам", d: "Уход для волос в подарок к первой стрижке. Замените на свою акцию.", until: "до конца месяца", on: true },
        { t: "Пример: маникюр и педикюр в один визит", d: "Укрепление ногтей в подарок. Замените на свою акцию.", until: "", on: false },
      ],
      masters,
      perks: site.perks.slice(0, LIMITS.perks).map((t) => ({ t })),
      texts: {
        hero: { kick: site.city ? `Салон красоты · ${site.city}` : "Салон красоты", h: site.name, em: "", p: site.tagline ?? "" },
        services: { kick: "", h: "Услуги и цены", p: "Цены салона. Точную сумму мастер назовёт до начала работы." },
        lab: { kick: "Примерка", h: "Подберите цвет до визита", p: "" },
        book: { kick: "", h: "Запись за минуту", p: "" },
      },
    },
  };
  const name = esc(site.name);
  const terms = l === "uz" ? ["DevUz Studio maketi, demo ma’lumotlar. Maketdan foydalanib, siz", "maket shartlarini qabul qilasiz"] : ["Макет DevUz Studio, демо-данные. Пользуясь макетом, вы принимаете", "условия макета"];
  return page(
    l,
    `${name} · админка · демо`,
    esc("Админка салона: заявки с сайта, сообщения из Instagram Direct, WhatsApp, Telegram и ВКонтакте в одном окне, статьи, акции и управление сайтом. Демо-данные."),
    "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500&family=Onest:wght@400;600;700&display=swap",
    `${panels.syanie.css}:root{${salonPalette(site.color)}}.brand img,.brand .pn-sign{flex:none}.brand span:last-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.pn-demo{display:inline-block;vertical-align:middle;margin-left:8px;padding:3px 10px;border-radius:999px;background:var(--paper2);color:var(--mute);font:600 12px/1.4 var(--f-t);letter-spacing:.02em}.pn-foot{padding:14px 20px 28px;text-align:center;color:var(--mute);font-size:13px}.pn-foot a{color:inherit}`,
    `<body>
<div id="app" aria-live="polite"><p class="boot">Загружаем админку…</p></div>
<div id="toast" class="toast" role="status" hidden></div>
<footer class="pn-foot">${terms[0]} <a href="${esc(mockupTermsUrl(l))}" target="_blank" rel="noopener">${terms[1]}</a>.</footer>
<script type="application/json" id="pn-data">${json(pd)}</script>
<script>
${SALON_DEMO_JS}
${SALON_EXT_JS}
${panels.syanie.js}</script>
</body>`,
  );
}

const ADMINS: Partial<Record<InstantNiche, (site: InstantSite) => string>> = {
  stomatologiya: (s) => clinicAdmin(s, "stomatologiya"),
  medcentr: (s) => clinicAdmin(s, "medcentr"),
  restoran: restoranAdmin,
  turagentstvo: tourAdmin,
  "uchebnyy-centr": eduAdmin,
  mebel: (s) => mebelAdmin(s, "mebel"),
  magazin: (s) => mebelAdmin(s, "magazin"),
  nedvizhimost: nedvAdmin,
  "salon-krasoty": salonAdmin,
};

/** Админка сферы на данных клиента; у сферы без нашей панели — null. */
export function adminHtml(site: InstantSite): string | null {
  return ADMINS[site.niche]?.(site) ?? null;
}

export function hasAdmin(niche: InstantNiche): boolean {
  return Boolean(ADMINS[niche]);
}
