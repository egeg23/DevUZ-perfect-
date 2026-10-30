/* Содержимое сайта, которое клиника правит сама (п. 5 техзадания договора
   № 360): контакты, цены, услуги, акции, врачи, вопросы, отзывы, цифры и
   тексты разделов. Правка хранится в базе отличием от data.mjs макета;
   сайт пересобирает gen.mjs (renderLive) с этими правками, без программиста.
   Здесь — что можно править, проверка и перевод правки в данные для gen. */

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const cut = (s, n) => String(s == null ? "" : s).replace(/[\u0000-\u0008\u000b-\u001f]/g, " ").replace(/[ \t]+/g, " ").trim().slice(0, n);

/* Поля: text — строка, area — абзац, int — целое, bool — галочка,
   lines — список строками, image — фото. max — длина. */
const F = (k, label, type = "text", max = 120, hint = "") => ({ k, label, type, max, hint });

export const TEXT_KEYS = {
  hero: "Первый экран", "ch-c1": "Сцена 1: All-on-6", "ch-c2": "Сцена 2: КТ", "ch-c3": "Сцена 3: импланты", "ch-c4": "Сцена 4: имплант", "ch-c5": "Сцена 5: протез",
  vs: "All-on-6 или All-on-4", price: "Цены", quiz: "Расчёт", docs: "Врачи", trust: "Гарантии", tech: "Как проходит операция",
  perks: "Сервис", reviews: "Отзывы", rooms: "Клиника", faq: "Вопросы", contacts: "Как доехать",
};

export const GROUPS = [
  { key: "contacts", title: "Контакты", hint: "Телефон, часы и адрес стоят на всём сайте: в шапке, кнопках звонка, контактах и подвале. WhatsApp и Telegram: пусто, и кнопки нет.", kind: "object",
    fields: [F("phone", "Телефон", "text", 30, "+7 (382) 227-00-77"), F("hours", "Часы работы", "text", 60), F("hoursShort", "Часы коротко (в записи и чате)", "text", 60), F("addr", "Адрес", "text", 120, "Томск, ул. Белинского, 63"), F("near", "Как далеко от центра", "text", 80), F("parking", "Парковка", "text", 100), F("license", "Лицензия", "text", 120), F("whatsapp", "WhatsApp: номер", "text", 20, "79001234567"), F("telegram", "Telegram: ник без @", "text", 40, "Пусто: ссылка на бота клиники, если он подключён")] },
  { key: "prices", title: "Цены All-on-6", hint: "Карточки цен в разделе «Цены». Отмеченная «Чаще выбирают» выделена.", kind: "list", max: 4,
    fields: [F("t", "Название", "text", 60), F("d", "Что входит", "area", 200), F("price", "Цена, ₽", "int"), F("star", "Чаще выбирают", "bool")] },
  { key: "services", title: "Услуги и цены", hint: "Перечень услуг клиники под ценами All-on-6. Эти же услуги пациент выбирает в записи на приём.", kind: "list", max: 40,
    fields: [F("t", "Услуга", "text", 80), F("p", "Цена", "text", 40, "от 4 500 ₽")] },
  { key: "gifts", title: "Акции и подарки", hint: "Подарки к лечению в разделе «Цены»: было и цена сейчас.", kind: "list", max: 6,
    head: [F("benefit", "Выгода всего, ₽", "int")],
    fields: [F("t", "Подарок или акция", "text", 60), F("was", "Обычная цена, ₽", "int"), F("sale", "Скидка, а не 0 ₽", "bool")] },
  { key: "doctors", title: "Врачи", hint: "Фото лучше квадратное, JPG или PNG до 3 МБ.", kind: "list", max: 8,
    fields: [F("name", "ФИО", "text", 80), F("role", "Специальность", "text", 120), F("facts", "Факты, по одному в строке", "lines", 400), F("quote", "Цитата", "area", 240), F("img", "Фото", "image")] },
  { key: "faq", title: "Вопросы и ответы", hint: "Раздел «Вопросы».", kind: "list", max: 20,
    fields: [F("q", "Вопрос", "text", 160), F("a", "Ответ", "area", 900)] },
  { key: "reviews", title: "Отзывы", hint: "Только настоящие отзывы пациентов, с их согласия.", kind: "list", max: 20,
    head: [F("ratingValue", "Оценка", "text", 6, "5,0"), F("ratingCount", "Отзывов на порталах", "int"), F("ratingRec", "Рекомендуют, %", "int")],
    fields: [F("who", "Имя", "text", 60), F("when", "Когда", "text", 30), F("src", "Где", "text", 40), F("t", "Текст", "area", 900)] },
  { key: "trust", title: "Цифры клиники", hint: "Четыре цифры над гарантиями.", kind: "list", max: 4,
    fields: [F("n", "Цифра", "text", 12), F("t", "Подпись", "text", 60)] },
  { key: "guarantee", title: "Гарантии", hint: "", kind: "list", max: 6, fields: [F("t", "Гарантия", "text", 60), F("d", "Подробно", "text", 120)] },
  { key: "perks", title: "Сервис", hint: "", kind: "list", max: 6, fields: [F("t", "Что делаем", "text", 60), F("d", "Подробно", "text", 120)] },
  { key: "texts", title: "Тексты разделов", hint: "Подзаголовок, заголовок и абзац каждого раздела. Пусто: текст по умолчанию.", kind: "texts" },
];
const BY = Object.fromEntries(GROUPS.map((g) => [g.key, g]));

/* Значения по умолчанию из data.mjs макета, в виде полей админки. */
export function defaultsOf(DATA, texts = {}) {
  const B = DATA.BRAND;
  return {
    contacts: { phone: B.phone, hours: B.hours, hoursShort: B.hoursShort, addr: B.addr, near: B.near, parking: B.parking, license: B.license, whatsapp: "", telegram: "" },
    prices: DATA.PRICES.map((p) => ({ t: p.t, d: p.d, price: p.price, star: !!p.star })),
    services: [],
    gifts: { benefit: DATA.BENEFIT, items: DATA.GIFTS.map((g) => ({ t: g.t, was: g.was, sale: !!g.sale })) },
    doctors: DATA.DOCTORS.map((d) => ({ name: d.name, role: d.role, facts: d.facts.join("\n"), quote: d.quote, img: d.img })),
    faq: DATA.FAQ.map((f) => ({ q: f.q, a: f.a })),
    reviews: { ratingValue: DATA.RATING.value, ratingCount: DATA.RATING.count, ratingRec: DATA.RATING.rec, items: DATA.REVIEWS.map((r) => ({ who: r.who, when: r.when, src: r.src, t: r.t })) },
    trust: DATA.TRUST.map((x) => ({ n: x.n, t: x.t })),
    guarantee: DATA.GUARANTEE.map((x) => ({ t: x.t, d: x.d })),
    perks: DATA.PERKS.map((x) => ({ t: x.t, d: x.d })),
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
export function normalize(key, value) {
  const g = BY[key];
  if (!g) throw new Error("Нет такого раздела сайта");
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
  if (!g.head) return list;
  const out = { items: list };
  for (const f of g.head) out[f.k] = field(f, value?.[f.k], "");
  return out;
}

/* Правки из базы → данные для renderLive. Все строки экранируются здесь:
   gen.mjs вставляет их в разметку как есть. */
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
  if (edits.services) data.SERVICES = v("services").map((x) => ({ t: e(x.t), p: e(x.p) }));
  if (edits.gifts) { data.GIFTS = v("gifts").items.map((g) => ({ t: e(g.t), was: g.was, sale: g.sale })); data.BENEFIT = v("gifts").benefit; }
  if (edits.doctors) data.DOCTORS = v("doctors").map((d) => ({ name: e(d.name), short: e(d.name), role: e(d.role), facts: d.facts.split("\n").filter(Boolean).map(e), quote: e(d.quote), img: d.img }));
  if (edits.faq) data.FAQ = v("faq").map((f) => ({ q: e(f.q), a: e(f.a) }));
  if (edits.reviews) { const r = v("reviews"); data.REVIEWS = r.items.map((x) => ({ who: e(x.who), when: e(x.when), src: e(x.src), t: e(x.t) })); data.RATING = { value: e(r.ratingValue), where: "Яндекс Картах", count: r.ratingCount, rec: r.ratingRec }; }
  if (edits.trust) data.TRUST = v("trust").map((x) => ({ n: e(x.n), t: e(x.t) }));
  if (edits.guarantee) data.GUARANTEE = v("guarantee").map((x) => ({ t: e(x.t), d: e(x.d) }));
  if (edits.perks) data.PERKS = v("perks").map((x) => ({ t: e(x.t), d: e(x.d) }));
  const texts = {};
  for (const [k, t] of Object.entries(edits.texts || {})) texts[k] = Object.fromEntries(Object.entries(t).map(([p, s]) => [p, e(s)]));
  return { brand, data, texts };
}
