/* Содержимое сайта, которое клиника правит сама (п. 5 техзадания договора
   № 360): контакты, цены, услуги, акции, врачи, вопросы, отзывы, цифры и
   тексты разделов. Правка хранится в базе отличием от data.mjs макета;
   сайт пересобирает gen.mjs (renderLive) с этими правками, без программиста.
   Здесь — что можно править, проверка и перевод правки в данные для gen. */

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const cut = (s, n) => String(s == null ? "" : s).replace(/[\u0000-\u0008\u000b-\u001f]/g, " ").replace(/[ \t]+/g, " ").trim().slice(0, n);

/* Поля: text — строка, area — абзац, int — целое, bool — галочка,
   lines — список строками, image — фото, file — документ PDF или фото,
   select — выбор из opts. max — длина. */
const F = (k, label, type = "text", max = 120, hint = "", opts) => ({ k, label, type, max, hint, ...(opts ? { opts } : {}) });

/* Блоки страницы по порядку (первый экран с пролётом всегда первым и сюда
   не входит). id — как в gen.mjs (BLOCK_FN), title — как в админке. */
export const BLOCKS = [
  { id: "vs", title: "All-on-6 или All-on-4" }, { id: "price", title: "Цены и подарки" }, { id: "uslugi", title: "Услуги клиники" }, { id: "quiz", title: "Расчёт за минуту" },
  { id: "docs", title: "Врачи" }, { id: "trust", title: "Гарантии и как проходит операция" }, { id: "perks", title: "Сервис" },
  { id: "reviews", title: "Отзывы" }, { id: "rooms", title: "Клиника: фото" }, { id: "faq", title: "Вопросы и ответы" }, { id: "contacts", title: "Как доехать" },
];
const BUILTIN = new Set(BLOCKS.map((b) => b.id));
const CUSTOM_ID = /^c[a-z0-9]{4,12}$/;
const UPLOAD = /^\/uploads\/[a-f0-9]{16,64}\.(jpg|png|webp)$/;
const UPLOAD_DOC = /^\/uploads\/[a-f0-9]{16,64}\.(pdf|jpg|png|webp)$/;

/* Разделы услуг сайта — как CATEGORIES в catalog.mjs (адрес и название);
   совпадение держит tests/syanie-app.test.ts. */
export const CATS = [
  ["implantatsiya-zubov", "Имплантация зубов"], ["protezirovanie-zubov", "Протезирование зубов"], ["khirurgiya", "Хирургия"],
  ["esteticheskaya-stomatologiya", "Эстетическая стоматология"], ["lechenie-zubov", "Лечение зубов"],
  ["professionalnaya-gigiena", "Профессиональная гигиена"], ["diagnostika-zubov", "Диагностика"],
];

export const TEXT_KEYS = {
  hero: "Первый экран", "ch-c1": "Сцена 1: All-on-6", "ch-c2": "Сцена 2: КТ", "ch-c3": "Сцена 3: импланты", "ch-c4": "Сцена 4: имплант", "ch-c5": "Сцена 5: протез",
  vs: "All-on-6 или All-on-4", price: "Цены", quiz: "Расчёт", docs: "Врачи", trust: "Гарантии", tech: "Как проходит операция",
  perks: "Сервис", reviews: "Отзывы", rooms: "Клиника", faq: "Вопросы", contacts: "Как доехать", uslugi: "Услуги клиники",
  /* Первый экран страниц сайта: подзаголовок, заголовок и абзац. */
  "pg-uslugi": "Страница «Услуги»", ...Object.fromEntries(CATS.map(([slug, t]) => ["pg-" + slug, `Страница «${t}»`])),
  "pg-ceny": "Страница «Цены»", "pg-vrachi": "Страница «Врачи»", "pg-o-klinike": "Страница «О клинике»", "pg-otzyvy": "Страница «Отзывы»",
  "pg-akcii": "Страница «Акции»", "pg-kontakty": "Страница «Контакты»", "pg-svedeniya": "Страница «Сведения о клинике»",
};

export const GROUPS = [
  { key: "blocks", title: "Блоки страницы", hint: "Порядок разделов на странице. «Выше» и «Ниже» двигают блок, галочка «Показывать» прячет его с сайта и из меню (сам блок и его тексты остаются, вернуть можно галочкой). «Добавить свой блок»: новый раздел с заголовком, текстом и фото, его можно поставить в любое место.", kind: "blocks", max: 12, photoMax: 8,
    fields: [F("kick", "Подзаголовок", "text", 60, "Например: Новое в клинике"), F("h", "Заголовок", "text", 120), F("text", "Текст", "area", 3000, "Каждая строка станет абзацем. Строки, которые начинаются с «- », станут списком."),
      F("layout", "Как показать фото", "select", 0, "", [["side", "Фото рядом с текстом"], ["grid", "Фото сеткой под текстом"], ["text", "Без фото"]]),
      F("menu", "Пункт в меню сайта", "text", 24, "Пусто: в меню не показывать"), F("book", "Кнопка «Записаться»", "bool"), F("dark", "Тёмный фон", "bool")],
    photo: [F("img", "Фото", "image"), F("alt", "Что на фото", "text", 140, "Подпись для поисковиков и незрячих")] },
  { key: "contacts", title: "Контакты", hint: "Телефон, часы и адрес стоят на всём сайте: в шапке, кнопках звонка, контактах и подвале. WhatsApp и Telegram: пусто, и кнопки нет.", kind: "object",
    fields: [F("phone", "Телефон", "text", 30, "+7 (382) 227-00-77"), F("hours", "Часы работы", "text", 60), F("hoursShort", "Часы коротко (в записи и чате)", "text", 60), F("addr", "Адрес", "text", 120, "Томск, ул. Белинского, 63"), F("near", "Как далеко от центра", "text", 80), F("parking", "Парковка", "text", 100), F("license", "Лицензия", "text", 120), F("whatsapp", "WhatsApp: номер", "text", 20, "79001234567"), F("telegram", "Telegram: ник без @", "text", 40, "Пусто: ссылка на бота клиники, если он подключён")] },
  { key: "prices", title: "Цены All-on-6", hint: "Карточки цен в разделе «Цены». Отмеченная «Чаще выбирают» выделена.", kind: "list", max: 4,
    fields: [F("t", "Название", "text", 60), F("d", "Что входит", "area", 200), F("price", "Цена, ₽", "int"), F("star", "Чаще выбирают", "bool")] },
  { key: "services", title: "Прейскурант", hint: "Услуги и цены на странице «Цены» и на страницах разделов (имплантация, протезирование и др.). Цену пишите так, как её увидит пациент: «4 500 ₽», «от 4 500 ₽», «Бесплатно». Пустая цена на сайте: «уточните у администратора». По правилам платных медицинских услуг (постановление Правительства РФ № 736) цены должны быть на сайте: впишите их.", kind: "list", max: 150,
    fields: [F("cat", "Раздел", "select", 0, "", CATS), F("t", "Услуга", "text", 90), F("d", "Коротко, что это", "area", 240), F("p", "Цена", "text", 40, "от 4 500 ₽")] },
  { key: "gifts", title: "Акции и подарки", hint: "Подарки к лечению в разделе «Цены»: было и цена сейчас.", kind: "list", max: 6,
    head: [F("benefit", "Выгода всего, ₽", "int")],
    fields: [F("t", "Подарок или акция", "text", 60), F("was", "Обычная цена, ₽", "int"), F("sale", "Скидка, а не 0 ₽", "bool")] },
  { key: "doctors", title: "Врачи", hint: "Фото лучше квадратное, JPG или PNG до 3 МБ.", kind: "list", max: 8,
    fields: [F("name", "ФИО", "text", 80), F("role", "Специальность", "text", 120), F("facts", "Факты, по одному в строке", "lines", 400), F("quote", "Цитата", "area", 240), F("img", "Фото", "image"),
      F("edu", "Образование", "area", 600, "Вуз, год окончания, специальность. По правилам платных медуслуг это должно быть на сайте"),
      F("cert", "Квалификация", "area", 400, "Сертификат или аккредитация специалиста, категория"), F("sched", "Приём", "text", 120, "Например: пн, ср, пт 9:00-18:00")] },
  { key: "rooms", title: "Фото клиники", hint: "Раздел «Клиника»: фото интерьера. JPG или PNG до 3 МБ, лучше горизонтальные. Спрятать раздел целиком: «Блоки страницы».", kind: "list", max: 9,
    fields: [F("img", "Фото", "image"), F("alt", "Что на фото", "text", 140, "Подпись для поисковиков и незрячих")] },
  { key: "faq", title: "Вопросы и ответы", hint: "Раздел «Вопросы».", kind: "list", max: 20,
    fields: [F("q", "Вопрос", "text", 160), F("a", "Ответ", "area", 900)] },
  { key: "reviews", title: "Отзывы", hint: "Только настоящие отзывы пациентов, с их согласия.", kind: "list", max: 20,
    head: [F("ratingValue", "Оценка", "text", 6, "5,0"), F("ratingCount", "Отзывов на порталах", "int"), F("ratingRec", "Рекомендуют, %", "int")],
    fields: [F("who", "Имя", "text", 60), F("when", "Когда", "text", 30), F("src", "Где", "text", 40), F("t", "Текст", "area", 900)] },
  { key: "trust", title: "Цифры клиники", hint: "Четыре цифры над гарантиями.", kind: "list", max: 4,
    fields: [F("n", "Цифра", "text", 12), F("t", "Подпись", "text", 60)] },
  { key: "guarantee", title: "Гарантии", hint: "", kind: "list", max: 6, fields: [F("t", "Гарантия", "text", 60), F("d", "Подробно", "text", 120)] },
  { key: "perks", title: "Сервис", hint: "", kind: "list", max: 6, fields: [F("t", "Что делаем", "text", 60), F("d", "Подробно", "text", 120)] },
  { key: "org", title: "Сведения о клинике", hint: "Страница «Сведения о медицинской организации», подвал и тексты о персональных данных. Это требуют правила платных медицинских услуг (постановление Правительства РФ № 736) и закон о персональных данных (152-ФЗ). Пустое поле на сайте не показывается.", kind: "object",
    fields: [F("full", "Полное наименование", "text", 160), F("inn", "ИНН", "text", 12), F("ogrn", "ОГРН", "text", 15), F("reg", "Государственная регистрация", "text", 200, "Дата записи в ЕГРЮЛ и налоговая, которая её внесла"),
      F("addr", "Юридический адрес", "text", 160), F("licNo", "Номер лицензии", "text", 60), F("licDate", "Дата лицензии", "text", 20, "10.12.2025"), F("licBy", "Кем выдана лицензия", "text", 200),
      F("licWorks", "Работы и услуги по лицензии", "area", 2000, "Перечень из выписки реестра лицензий, по одному в строке"), F("chief", "Руководство", "text", 160, "ФИО и должность"),
      F("pgg", "Бесплатная медицинская помощь", "area", 600, "Участвует ли клиника в программе госгарантий и где узнать о бесплатной помощи"),
      F("pdEmail", "Почта для обращений о персональных данных", "text", 80, "Пусто: пациенты пишут письмом на адрес клиники"), F("pdWho", "Ответственный за обработку персональных данных", "text", 120, "ФИО и должность")] },
  { key: "authorities", title: "Контролирующие органы", hint: "Куда пациент может обратиться: страница «Сведения о клинике» и «Контакты».", kind: "list", max: 6,
    fields: [F("t", "Орган", "text", 120), F("addr", "Адрес", "text", 160), F("phone", "Телефон", "text", 120), F("mail", "Почта", "text", 80)] },
  { key: "docs", title: "Документы клиники", hint: "Лицензия, правила внутреннего распорядка, образец договора и другие документы для пациентов: PDF до 10 МБ или фото. Появятся в «Документах» на странице «Сведения о клинике».", kind: "list", max: 20,
    fields: [F("t", "Название документа", "text", 140), F("file", "Файл", "file")] },
  { key: "texts", title: "Тексты разделов", hint: "Подзаголовок, заголовок и абзац каждого раздела главной и первого экрана каждой страницы. Пусто: текст по умолчанию.", kind: "texts" },
];
const BY = Object.fromEntries(GROUPS.map((g) => [g.key, g]));

/* Значения по умолчанию из data.mjs макета, в виде полей админки. */
export function defaultsOf(DATA, texts = {}) {
  const B = DATA.BRAND;
  return {
    contacts: { phone: B.phone, hours: B.hours, hoursShort: B.hoursShort, addr: B.addr, near: B.near, parking: B.parking, license: B.license, whatsapp: "", telegram: "" },
    prices: DATA.PRICES.map((p) => ({ t: p.t, d: p.d, price: p.price, star: !!p.star })),
    services: (DATA.CATALOG || []).map((x) => ({ cat: x.cat, t: x.t, d: x.d || "", p: x.p || "" })),
    org: { ...(DATA.ORG || {}) },
    authorities: (DATA.AUTHORITIES || []).map((a) => ({ t: a.t, addr: a.addr, phone: a.phone, mail: a.mail })),
    docs: [],
    gifts: { benefit: DATA.BENEFIT, items: DATA.GIFTS.map((g) => ({ t: g.t, was: g.was, sale: !!g.sale })) },
    doctors: DATA.DOCTORS.map((d) => ({ name: d.name, role: d.role, facts: d.facts.join("\n"), quote: d.quote, img: d.img, edu: d.edu || "", cert: d.cert || "", sched: d.sched || "" })),
    faq: DATA.FAQ.map((f) => ({ q: f.q, a: f.a })),
    reviews: { ratingValue: DATA.RATING.value, ratingCount: DATA.RATING.count, ratingRec: DATA.RATING.rec, items: DATA.REVIEWS.map((r) => ({ who: r.who, when: r.when, src: r.src, t: r.t })) },
    trust: DATA.TRUST.map((x) => ({ n: x.n, t: x.t })),
    guarantee: DATA.GUARANTEE.map((x) => ({ t: x.t, d: x.d })),
    perks: DATA.PERKS.map((x) => ({ t: x.t, d: x.d })),
    rooms: DATA.ROOMS.map((r) => ({ img: r.img, alt: r.alt })),
    blocks: BLOCKS.map((b) => ({ id: b.id, on: true })),
    texts: Object.fromEntries(Object.keys(TEXT_KEYS).map((k) => [k, { ...(texts[k] || {}) }])),
  };
}

function field(f, v, where) {
  const name = `${where}«${f.label}»`;
  if (f.type === "bool") return !!v;
  if (f.type === "int") {
    const n = Number(String(v ?? "").replace(/[\s ]/g, ""));
    if (!Number.isInteger(n) || n < 0 || n > 100000000) throw new Error(`${name}: целое число рублей`);
    return n;
  }
  if (f.type === "select") { const s = String(v ?? ""); return f.opts.some(([k]) => k === s) ? s : f.opts[0][0]; }
  if (f.type === "file") {
    const s = String(v || "");
    if (s && !UPLOAD_DOC.test(s)) throw new Error(`${name}: загрузите файл заново`);
    return s;
  }
  if (f.type === "image") {
    const s = String(v || "");
    if (s && !/^\/uploads\/[a-f0-9]{16,64}\.(jpg|png|webp)$/.test(s) && !/^[a-z0-9-]{2,40}$/.test(s)) throw new Error(`${name}: загрузите фото заново`);
    return s;
  }
  const s = f.type === "area" || f.type === "lines" ? String(v ?? "").replace(/\r/g, "").split("\n").map((l) => cut(l, f.max)).filter(Boolean).join("\n").slice(0, f.max) : cut(v, f.max);
  if (String(v ?? "").trim().length > f.max * 1.2 + 20) throw new Error(`${name}: не длиннее ${f.max} знаков`);
  return s;
}

/* Проверка правки одной группы. Вернёт чистое значение для базы. */
/* Встроенные блоки, которых нет в сохранённом списке (появились в коде
   позже правки), встают на своё место по умолчанию — за тем, что шёл
   перед ними. Так новый блок сайта не теряется у клиники. */
export function mergeBlocks(list) {
  const out = (Array.isArray(list) ? list : []).filter((b) => b && (BUILTIN.has(b.id) || CUSTOM_ID.test(b.id)));
  BLOCKS.forEach((b, i) => {
    if (out.some((x) => x.id === b.id)) return;
    let at = 0;
    for (let j = i - 1; j >= 0; j--) { const k = out.findIndex((x) => x.id === BLOCKS[j].id); if (k >= 0) { at = k + 1; break; } }
    out.splice(at, 0, { id: b.id, on: true });
  });
  return out;
}

function normBlocks(g, value) {
  const items = Array.isArray(value) ? value : [], seen = new Set();
  let n = 0;
  const out = items.map((it) => {
    const id = String(it?.id || "");
    if (seen.has(id)) throw new Error("Блок в списке дважды: обновите страницу");
    seen.add(id);
    if (BUILTIN.has(id)) return { id, on: it.on !== false };
    if (!CUSTOM_ID.test(id)) throw new Error("Неизвестный блок: обновите страницу");
    if (++n > g.max) throw new Error(`Своих блоков не больше ${g.max}`);
    const where = `Свой блок ${n}, `, o = { id, on: it.on !== false };
    for (const f of g.fields) o[f.k] = field(f, it[f.k], where);
    if (!o.h) throw new Error(`${where}заполните «Заголовок»`);
    const photos = Array.isArray(it.photos) ? it.photos : [];
    if (photos.length > g.photoMax) throw new Error(`${where}фото не больше ${g.photoMax}`);
    o.photos = photos.map((p, j) => ({ img: field(g.photo[0], p?.img, `${where}фото ${j + 1}, `), alt: field(g.photo[1], p?.alt, `${where}фото ${j + 1}, `) })).filter((p) => p.img);
    if (o.photos.some((p) => !UPLOAD.test(p.img))) throw new Error(`${where}загрузите фото заново`);
    return o;
  });
  return mergeBlocks(out);
}

export function normalize(key, value) {
  const g = BY[key];
  if (!g) throw new Error("Нет такого раздела сайта");
  if (g.kind === "blocks") return normBlocks(g, value);
  if (g.kind === "texts") {
    const out = {};
    for (const k of Object.keys(TEXT_KEYS)) {
      const t = (value || {})[k] || {}, o = {};
      for (const part of ["kick", "h", "em", "p"]) { const s = cut(t[part], part === "p" ? 400 : 120); if (s) o[part] = s; }
      if (Object.keys(o).length) out[k] = o;
    }
    return out;
  }
  if (g.kind === "object") {
    const o = {};
    for (const f of g.fields) o[f.k] = field(f, (value || {})[f.k], "");
    if (key === "org") {
      if (o.inn && !/^\d{10}$|^\d{12}$/.test(o.inn)) throw new Error("«ИНН»: 10 цифр у организации, 12 у предпринимателя");
      if (o.ogrn && !/^\d{13}$|^\d{15}$/.test(o.ogrn)) throw new Error("«ОГРН»: 13 цифр, у предпринимателя 15");
      if (o.pdEmail && !/^[^\s@<>"]+@[^\s@<>"]+\.[a-zа-яё]{2,}$/i.test(o.pdEmail)) throw new Error("«Почта для обращений»: адрес вида name@clinic.ru");
      if (!o.full) throw new Error("Заполните «Полное наименование»");
      return o;
    }
    const digits = o.phone.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 15) throw new Error("«Телефон»: от 10 до 15 цифр");
    if (o.whatsapp && !/^\+?\d{10,15}$/.test(o.whatsapp.replace(/[\s()-]/g, ""))) throw new Error("«WhatsApp»: номер цифрами, 10-15 цифр");
    o.whatsapp = o.whatsapp.replace(/\D/g, "");
    o.telegram = o.telegram.replace(/^@|^https?:\/\/t\.me\//, "");
    if (o.telegram && !/^[A-Za-z0-9_]{4,32}$/.test(o.telegram)) throw new Error("«Telegram»: ник латиницей, без @");
    for (const k of ["hours", "addr"]) if (!o[k]) throw new Error(`Заполните «${g.fields.find((f) => f.k === k).label}»`);
    return o;
  }
  const items = Array.isArray(value) ? value : Array.isArray(value?.items) ? value.items : [];
  if (items.length > g.max) throw new Error(`«${g.title}»: не больше ${g.max}`);
  const list = items.map((it, i) => {
    const o = {};
    for (const f of g.fields) o[f.k] = field(f, (it || {})[f.k], `Строка ${i + 1}, `);
    const first = g.fields[0];
    if (!o[first.k]) throw new Error(`Строка ${i + 1}: заполните «${first.label}»`);
    return o;
  });
  if (key === "prices" && !list.length) throw new Error("Нужна хотя бы одна цена");
  if (key === "rooms" && !list.length) throw new Error("Нужно хотя бы одно фото. Спрятать раздел целиком: «Блоки страницы»");
  if (key === "services") list.forEach((x, i) => { if (!x.t) throw new Error(`Строка ${i + 1}: заполните «Услуга»`); });
  if (key === "docs") list.forEach((d, i) => { if (!d.file) throw new Error(`Строка ${i + 1}: загрузите файл`); });
  if (key === "authorities") list.forEach((a, i) => { if (a.mail && !/^[^\s@<>"]+@[^\s@<>"]+\.[a-z]{2,}$/i.test(a.mail)) throw new Error(`Строка ${i + 1}: «Почта» вида name@site.ru`); });
  if (!g.head) return list;
  const out = { items: list };
  for (const f of g.head) out[f.k] = field(f, value?.[f.k], "");
  return out;
}

/* Правки из базы → данные для renderLive. Все строки экранируются здесь:
   gen.mjs вставляет их в разметку как есть. */
/* Врачи макета (data.mjs) до 16.11.2026. Сохранённый список только из них —
   не правка клиники, а прежние врачи по умолчанию (владелец, 16.11.2026:
   «врачи на сайте не актуальны»): на сайте и в админке — врачи catalog.mjs. */
const OLD_DOCTORS = new Set(["Реутов Евгений Александрович", "Савин Тимур Николаевич"]);
export function dropOldDoctors(edits = {}) {
  const list = edits.doctors;
  if (!Array.isArray(list) || !list.length || !list.every((d) => OLD_DOCTORS.has(String(d?.name ?? "").trim()))) return edits;
  const { doctors, ...rest } = edits;
  return rest;
}

export function siteOverrides(edits = {}, defaults, extra = {}) {
  const v = (k) => edits[k] ?? defaults[k];
  const e = (s) => esc(s ?? "");
  const c = v("contacts"), brand = {};
  const digits = c.phone.replace(/\D/g, "");
  Object.assign(brand, {
    phone: e(c.phone), phoneRaw: "+" + (digits.length === 11 && digits[0] === "8" ? "7" + digits.slice(1) : digits),
    hours: e(c.hours), hoursShort: e(c.hoursShort || c.hours), addr: e(c.addr), street: e(c.addr.replace(/^(г\.\s*)?Томск,\s*/i, "")),
    near: e(c.near), parking: e(c.parking), license: e(c.license),
    whatsapp: c.whatsapp, telegram: c.telegram || extra.tgBot || "",
  });
  if (edits.contacts && edits.contacts.addr !== defaults.contacts.addr) {
    const q = encodeURIComponent(c.addr);
    brand.map = `https://yandex.ru/maps/?text=${q}`; brand.route = `https://yandex.ru/maps/?rtext=~${q}&rtt=auto`;
  }
  const data = {};
  if (edits.prices) data.PRICES = v("prices").map((p, i) => ({ id: "p" + i, t: e(p.t), d: e(p.d), price: p.price, star: p.star }));
  if (edits.services) data.CATALOG = v("services").map((x) => ({ cat: x.cat, t: e(x.t), d: e(x.d), p: e(x.p) }));
  if (edits.org) data.ORG = Object.fromEntries(Object.entries(v("org")).map(([k, x]) => [k, e(x)]));
  if (edits.authorities) data.AUTHORITIES = v("authorities").map((a) => ({ t: e(a.t), addr: e(a.addr), phone: e(a.phone), mail: e(a.mail) }));
  if (edits.docs) data.DOCS = v("docs").filter((d) => UPLOAD_DOC.test(d.file)).map((d) => ({ t: e(d.t), file: d.file }));
  if (edits.gifts) { data.GIFTS = v("gifts").items.map((g) => ({ t: e(g.t), was: g.was, sale: g.sale })); data.BENEFIT = v("gifts").benefit; }
  if (edits.doctors) data.DOCTORS = v("doctors").map((d) => ({ name: e(d.name), short: e(d.name), role: e(d.role), facts: d.facts.split("\n").filter(Boolean).map(e), quote: e(d.quote), img: d.img, edu: e(d.edu), cert: e(d.cert), sched: e(d.sched) }));
  if (edits.faq) data.FAQ = v("faq").map((f) => ({ q: e(f.q), a: e(f.a) }));
  if (edits.reviews) { const r = v("reviews"); data.REVIEWS = r.items.map((x) => ({ who: e(x.who), when: e(x.when), src: e(x.src), t: e(x.t) })); data.RATING = { value: e(r.ratingValue), where: "Яндекс Картах", count: r.ratingCount, rec: r.ratingRec }; }
  if (edits.trust) data.TRUST = v("trust").map((x) => ({ n: e(x.n), t: e(x.t) }));
  if (edits.guarantee) data.GUARANTEE = v("guarantee").map((x) => ({ t: e(x.t), d: e(x.d) }));
  if (edits.perks) data.PERKS = v("perks").map((x) => ({ t: e(x.t), d: e(x.d) }));
  if (edits.rooms) data.ROOMS = v("rooms").map((r) => ({ img: r.img, alt: e(r.alt) }));
  /* Раскладка блоков: null — прежний порядок. Свои блоки — экранированные строки. */
  const blocks = edits.blocks ? mergeBlocks(edits.blocks).map((b) => (BUILTIN.has(b.id) ? { id: b.id, on: b.on !== false }
    : { id: b.id, on: b.on !== false, custom: true, kick: e(b.kick), h: e(b.h), text: e(b.text), layout: b.layout, menu: e(b.menu), book: !!b.book, dark: !!b.dark,
      photos: (b.photos || []).filter((p) => UPLOAD.test(p.img)).map((p) => ({ img: p.img, alt: e(p.alt) })) })) : null;
  const texts = {};
  for (const [k, t] of Object.entries(edits.texts || {})) texts[k] = Object.fromEntries(Object.entries(t).map(([p, s]) => [p, e(s)]));
  return { brand, data, texts, blocks };
}
