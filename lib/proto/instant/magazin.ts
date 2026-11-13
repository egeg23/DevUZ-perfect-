/**
 * Шаблон «Интернет-магазин» — магазин нашего макета Greenwell
 * (scripts/protos/greenwell, страница `shop`), переодетый под клиента.
 *
 * Владелец, 12.11.2026: «Мы теряем лидов из-за того, что они нажимают
 * "другая ниша"… выведем больше ниш которые у нас есть, также переодевать
 * просто». Отсюда устройство: стили и скрипт магазина Greenwell — те же
 * файлы (content/proto-instant/greenwell-shop-assets.json, пишет
 * scripts/protos/instant/greenwell-shop-assets.mjs), разметка — та же
 * оболочка (шапка с поиском, нижняя панель, шторки, тосты), экраны — те же:
 * главная, каталог с фильтрами и сортировкой, поиск с подсказками, карточка
 * товара со свайп-галереей, корзина, оформление в один экран (вход по коду,
 * адрес булавкой, слоты, оплата, рассрочка), заказ со статусом, отзыв,
 * кабинет. Заказ пишется в память браузера (`ms-demo-1`), его первой
 * строкой видит панель магазина рядом (lib/proto/instant/admin).
 *
 * Что от Greenwell не берётся, потому что это про них, а не дизайн: знак и
 * имя, банки и их фото, оценки и отзывы с Uzum, состав с этикетки и СЭС,
 * баллы и уровни, промокод, бесплатная доставка от суммы, их ссылки и
 * пункты выдачи. Товары — услуги клиента, цена — только его словами; цены
 * нет — «цена по запросу» и вопрос в чат магазина вместо корзины.
 *
 * Шаблонные слова без цифр: каждое число на странице — из данных клиента
 * (lib/proto/instant/check).
 */
import assets from "@/content/proto-instant/greenwell-shop-assets.json" with { type: "json" };
import panels from "@/content/proto-instant/panel-assets.json" with { type: "json" };
import { dzIntroSolo } from "@/lib/proto/dz-video.mjs";
import { mockupTermsUrl } from "@/lib/proto/booking";
import { PROTO_BASE } from "@/lib/proto/pages";
import { LIMITS, type InstantLocale, type InstantSite, type BaseSite } from "@/lib/proto/instant/types";
import { brandColor, esc, handleOf, hexToHsl, imageUrl, telHref, waHref } from "@/lib/proto/instant/safe";

const IMG = "/protos/_niche/magazin";
/** Нейтральные фото ниши: коробки и пакет, подарочная коробка, товары для дома, посылка. */
export const MAGAZIN_PHOTOS = [1, 2, 3, 4].map((n) => `${IMG}/n${n}-900.webp`);

type Pair = [string, string];
const FONTS = "https://fonts.googleapis.com/css2?family=Manrope:wght@400;700&family=Montserrat:wght@400;700&display=swap";

/**
 * Подписи магазина Greenwell, которые говорят о Greenwell, биодобавках,
 * баллах и Uzum, — своими словами. Остальные подписи — их, как есть.
 */
const UI_OWN: Record<string, Pair> = {
  heroKick: ["Интернет-магазин", "Internet-do‘kon"],
  heroH: ["{name}: закажите онлайн с доставкой", "{name}: onlayn buyurtma, yetkazib berish bilan"],
  hits: ["Товары", "Mahsulotlar"],
  allGoods: ["Все товары", "Barcha mahsulotlar"],
  revOnUzum: ["Отзывы покупателей появятся здесь после первых заказов", "Xaridorlar sharhlari birinchi buyurtmalardan keyin shu yerda chiqadi"],
  revAfter: ["Отзыв можно оставить после получения заказа", "Sharhni buyurtma olingandan keyin qoldirish mumkin"],
  cartEmptyS: ["Загляните в каталог", "Katalogga qarang"],
  free: ["уточнит менеджер", "menejer aytadi"],
  delTomorrow: ["Доставка или самовывоз", "Yetkazib berish yoki olib ketish"],
  delTerms: ["Срок и стоимость доставки уточнит менеджер", "Yetkazish muddati va narxini menejer aytadi"],
  helps: ["Почему у нас", "Nega bizda"],
  compH: ["О товаре", "Mahsulot haqida"],
  compLabel: ["Описание, размеры и характеристики встанут сюда с карточки товара.", "Tavsif, o‘lchamlar va xususiyatlar mahsulot kartochkasidan shu yerga qo‘yiladi."],
  madeH: ["О магазине", "Do‘kon haqida"],
  demoFoot: ["Макет DevUz Studio: заказы и оплата демо, деньги не списываются.", "DevUz Studio maketi: buyurtmalar va to‘lov demo, pul yechilmaydi."],
  trySyn: ["Попробуйте другое слово", "Boshqa so‘z bilan ko‘ring"],
  rateAsk: ["Оцените покупку", "Xaridni baholang"],
  rateAskS: ["Отзыв появится на сайте после проверки магазином.", "Sharh do‘kon tekshiruvidan keyin saytda chiqadi."],
  ratedS: ["Отзыв появится на сайте после проверки.", "Sharh tekshiruvdan keyin saytda chiqadi."],
  addPhotoS: ["Фото товара у вас дома", "Uydagi mahsulot surati"],
  sendRev: ["Отправить отзыв", "Sharh yuborish"],
  revRules: ["Отзыв проверяет магазин: без ссылок и личных данных.", "Sharhni do‘kon tekshiradi: havola va shaxsiy ma’lumotlarsiz."],
  revPh: ["Например: пришло быстро, всё как на фото", "Masalan: tez keldi, hammasi suratdagidek"],
  ptsBurst: ["отзыв на проверке", "sharh tekshiruvda"],
  loginS: ["Заказы и рассрочки в одном месте.", "Buyurtmalar va muddatli to‘lovlar bir joyda."],
  staffS: ["Панель магазина: заказы, отзывы, прибыль", "Do‘kon paneli: buyurtmalar, sharhlar, foyda"],
  eta: ["Скоро будет у вас", "Tez orada sizda bo‘ladi"],
  placed: ["Номер {n}. Статус пришлём в Telegram.", "Raqam {n}. Holatini Telegram orqali yuboramiz."],
  pickupDemo: ["Адрес и часы самовывоза уточнит менеджер.", "Olib ketish manzili va vaqtini menejer aytadi."],
  landmarkPh: ["Например, напротив школы", "Masalan, maktab qarshisida"],
  nasBanH: ["Рассрочка прямо в корзине", "Savatning o‘zida muddatli to‘lov"],
  // Свои: товар без цены и вопрос о нём в чат магазина.
  ask: ["Цена по запросу", "Narxi so‘rov bo‘yicha"],
  askPrice: ["Узнать цену", "Narxni bilish"],
  askText: ["Здравствуйте! Сколько стоит", "Assalomu alaykum! Narxi qancha:"],
  source: ["Данные с сайта", "Ma’lumotlar saytdan:"],
  ordersW: ["", ""],
};

/** Цена числом в сумах — если клиент назвал её числом («от 300 000 сум» → 300000), иначе 0. */
export function shopPrice(price: string | null): number {
  if (!price || /\$|usd|доллар|dollar|€|eur/i.test(price)) return 0;
  const m = price.replace(/ /g, " ").match(/\d[\d ]{3,}/);
  const n = m ? Number(m[0].replace(/ /g, "")) : 0;
  return n >= 1_000 ? n : 0;
}

/** Улицы для булавки адреса — обычные улицы Ташкента; две из них ловушки, при показе это выдуманные слова. */
const STREETS: [string, string, string, string][] = [
  ["ул. [[t:0]]", "[[t:0]] ko‘chasi", "Яккасарайский район", "Yakkasaroy tumani"],
  ["ул. Бабура", "Bobur ko‘chasi", "Яккасарайский район", "Yakkasaroy tumani"],
  ["ул. Афросиаб", "Afrosiyob ko‘chasi", "Мирабадский район", "Mirobod tumani"],
  ["ул. Нукус", "Nukus ko‘chasi", "Мирабадский район", "Mirobod tumani"],
  ["пр. Амира Темура", "Amir Temur shoh ko‘chasi", "Юнусабадский район", "Yunusobod tumani"],
  ["ул. Мустакиллик", "Mustaqillik ko‘chasi", "Мирзо-Улугбекский район", "Mirzo Ulug‘bek tumani"],
  ["ул. [[t:1]]", "[[t:1]] ko‘chasi", "Чиланзарский район", "Chilonzor tumani"],
  ["ул. Бунёдкор", "Bunyodkor shoh ko‘chasi", "Чиланзарский район", "Chilonzor tumani"],
  ["ул. Мукими", "Muqimiy ko‘chasi", "Чиланзарский район", "Chilonzor tumani"],
];

function palette(color: string | null): string {
  const hex = brandColor(color);
  if (!hex) return "";
  const [h, s0] = hexToHsl(hex);
  const sat = Math.min(Math.max(s0, 35), 80);
  return `--g:hsl(${h} ${sat}% 28%);--g2:hsl(${h} ${sat}% 20%);--g3:hsl(${h} ${sat}% 36%);--gl:hsl(${h} ${Math.round(sat * 0.5)}% 92%);--gl2:hsl(${h} ${Math.round(sat * 0.4)}% 96%)`;
}

const json = (v: unknown) => JSON.stringify(v).replace(/</g, "\\u003c");

export function magazinHtml(site: BaseSite): string {
  const l: InstantLocale = site.locale;
  const i = l === "uz" ? 1 : 0;
  const t = (p: Pair) => p[i];
  const name = esc(site.name);
  const tel = telHref(site.phone);
  const wa = waHref(site.whatsapp);
  const tg = handleOf(site.telegram);
  const ig = handleOf(site.instagram);
  const logo = imageUrl(site.logo);
  const own = site.photos.map(imageUrl).filter((u): u is string => Boolean(u)).slice(0, LIMITS.photos);
  const chat = tg ? `https://t.me/${tg}` : wa;

  const shopUi = shopUiOf(l, site.name);

  const items = site.services.slice(0, 12);
  const products = items.map((s, k) => {
    const price = shopPrice(s.price);
    return {
      id: `g${k}`, cat: "goods", price, old: price, ps: s.price ?? "", count: 0, form: "", rating: 0, reviews: 0, orders: "0", g: 0, c: false, back: 0,
      n: s.name, s: "", b: site.perks.slice(0, 4), alt: "", how: "", comp: "", tags: [], rev: [], uzum: "",
    };
  });
  const ph = Object.fromEntries(products.map((p, k) => [p.id, own.length ? own[k % own.length] : MAGAZIN_PHOTOS[k % MAGAZIN_PHOTOS.length]]));

  const markOf = (cls: string, color: string) =>
    logo
      ? `<img class="logo-w ${cls}" src="${esc(logo)}" alt="${name}" referrerpolicy="no-referrer" style="height:32px;width:auto;max-width:150px;object-fit:contain">`
      : `<b class="logo-w ${cls}" style="font:700 18px/1.2 var(--head);color:${color};width:auto;max-width:56vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${name}</b>`;

  const links: [string, string, string][] = [
    ...(tg ? [["tg", `@${tg}`, `https://t.me/${tg}`] as [string, string, string]] : []),
    ...(ig ? [["ig", `@${ig}`, `https://instagram.com/${ig}`] as [string, string, string]] : []),
    ...(wa ? [["phone", "WhatsApp", wa] as [string, string, string]] : []),
    ...(tel ? [["phone", site.phone ?? "", tel] as [string, string, string]] : []),
  ];
  const trustIcons = ["shield", "truck", "check", "star"];
  const trust = site.perks.slice(0, 4).map((p, k) => [trustIcons[k % trustIcons.length], p, ""]);

  const data = {
    lang: l, img: IMG, ph, ui: shopUi, products,
    cats: [{ id: "goods", i: "bag", n: t(["Товары", "Mahsulotlar"]) }],
    pairs: {},
    brand: { name: site.name, tg: tg ?? "", ig: ig ?? "", uzum: "", made: site.about ?? site.tagline ?? "", legalNote: "", dist: [site.address, site.hours].filter(Boolean).join(", ") },
    nasiya: [
      { id: "uzum", n: "Uzum Nasiya", c: "#7000ff", terms: { 3: 0, 6: 8, 12: 16 } },
      { id: "alif", n: "Alif Nasiya", c: "#00a651", terms: { 3: 0, 6: 9, 12: 18 } },
    ],
    pays: [
      { id: "click", n: "Click" }, { id: "payme", n: "Payme" }, { id: "uzumbank", n: "Uzum Bank" }, { id: "card", n: "Uzcard / Humo" },
      { id: "cash", n: t(["Наличными при получении", "Olishda naqd"]) }, { id: "nasiya", n: t(["Рассрочка", "Muddatli to‘lov"]) },
    ],
    shop: { delivery: 0, freeFrom: 0, pointsRate: 0, pointsMaxShare: 0, reviewPts: 0, reviewPhotoPts: 0, welcome: 0, promo: {}, levels: [{ id: "a", from: 0, k: 0, n: "" }] },
    terms: mockupTermsUrl(l), other: PROTO_BASE, panel: `${PROTO_BASE}/admin`, syn: {},
    streets: STREETS.map((s) => ({ n: l === "ru" ? s[0] : s[1], d: l === "ru" ? s[2] : s[3] })),
    popular: products.slice(0, 6).map((p) => p.n),
    quick: t(["Пришло быстро|Хорошая упаковка|Всё как на фото|Беру не первый раз", "Tez keldi|Yaxshi qadoq|Hammasi suratdagidek|Birinchi marta olmayapman"]).split("|"),
    pickups: [{ n: site.name, a: site.address ?? t(["адрес уточнит менеджер", "manzilni menejer aytadi"]), h: site.hours ?? "" }],
    trust, links, chat, tel, source: site.source,
    mark: markOf("dk", "var(--g)"), markW: markOf("", "#fff"),
  };

  const ic = (k: string) => `<svg class="ic" aria-hidden="true"><use href="#i-${k}"/></svg>`;
  const tabs: [string, string, string, Pair][] = [
    ["home", "#/", "home", ["Главная", "Bosh sahifa"]], ["catalog", "#/c/all", "grid", ["Каталог", "Katalog"]], ["cart", "#/cart", "bag", ["Корзина", "Savat"]],
    ["fav", "#/fav", "heart", ["Избранное", "Sevimlilar"]], ["me", "#/me", "user", ["Профиль", "Profil"]],
  ];
  const sprite = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>${Object.entries(panels.greenwell.icons as Record<string, string>)
    .map(([k, v]) => `<symbol id="i-${k}" viewBox="0 0 24 24" stroke="currentColor">${v}</symbol>`)
    .join("")}${assets.city}</defs></svg>`;
  const search = products.slice(0, 2).map((p) => p.n).join(", ");

  return `<!doctype html>
<html lang="${l}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${name} · ${t(["интернет-магазин", "internet-do‘kon"])}</title>
<meta name="description" content="${esc(`${site.name}. ${t(["Каталог, корзина, оформление заказа в один экран, доставка и рассрочка.", "Katalog, savat, bir ekranda buyurtma, yetkazib berish va muddatli to‘lov."])}`)}">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="theme-color" content="#0f1c15">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<style>${assets.css}
:root{${palette(site.color)}}
.pc-im img,.ci-im img,.mini img,.sq-p img,.sq-recent img,.ol-im img,.rvf-h img{object-fit:cover;border-radius:12px;filter:none}
.pc-im img{inset:10px;top:10px;bottom:10px;height:calc(100% - 20px);width:calc(100% - 20px);max-width:none}
.ci-im img{height:84px;width:84px}.mini img{width:44px}.sq-p img{width:56px}.sq-recent img{width:72px}.ol-im img{width:44px}.rvf-h img{width:56px}
.gal-i.front img,.gal-i img{inset:0;height:100%;width:100%;max-width:none;max-height:none;object-fit:cover;filter:none}
.hero-j .j{width:150px;height:190px;object-fit:cover;border-radius:18px;bottom:24px}
.hero-j .j0{width:170px;height:220px}
@media (min-width:768px){.hero-j .j{width:190px;height:240px}.hero-j .j0{width:220px;height:280px}}
.pc-buy .btn-add svg{width:18px;height:18px}
.ms-stock{margin:10px 0 0;font-size:12px;color:var(--mut)}
</style>
</head>
<body class="shop" data-lang="${l}">
${dzIntroSolo(l)}
${sprite}
<a class="skip" href="#view">${t(["К содержанию", "Asosiy qismga"])}</a>
<header class="top" id="top"><p class="demo-strip">${t(["Макет DevUz Studio · данные демо", "DevUz Studio maketi · demo"])} <a href="${esc(mockupTermsUrl(l))}" target="_blank" rel="noopener">${t(["Условия макета", "Maket shartlari"])}</a></p><div class="hd"><div class="hd-in">
<a class="logo" href="#/" aria-label="${name}">${markOf("", "var(--g)")}</a>
<nav class="hd-nav" aria-label="${t(["Разделы", "Bo‘limlar"])}"><a href="#/c/all" data-tab="catalog">${t(["Каталог", "Katalog"])}</a></nav>
<button type="button" class="hd-s" data-search>${ic("search")}<span>${search ? esc(`${t(["Поиск", "Qidiruv"])}: ${search}`) : t(["Поиск", "Qidiruv"])}</span></button>
<div class="hd-act"><a href="#/fav">${ic("heart")}<span>${t(["Избранное", "Sevimlilar"])}</span><b class="bdg" data-badge="fav" hidden></b></a><a href="#/me">${ic("user")}<span>${t(["Профиль", "Profil"])}</span></a><a href="#/cart" class="cart-ic">${ic("bag")}<span>${t(["Корзина", "Savat"])}</span><b class="bdg" data-badge="cart" hidden></b></a></div>
</div></div></header>
<main id="view" tabindex="-1"></main>
<nav class="tabbar" aria-label="${t(["Меню", "Menyu"])}">${tabs.map(([k, u, icn, n]) => `<a href="${u}" data-tab="${k}"${k === "cart" ? ' class="cart-ic"' : ""}>${ic(icn)}<span>${t(n)}</span>${k === "cart" || k === "fav" ? `<b class="bdg" data-badge="${k}" hidden></b>` : ""}</a>`).join("")}</nav>
<div id="search" hidden role="dialog" aria-modal="true" aria-label="${t(["Поиск", "Qidiruv"])}"><div class="sq-top"><form id="sq-form" role="search">${ic("search")}<input id="sq" type="search" enterkeyhint="search" autocomplete="off" placeholder="${t(["Что ищете?", "Nima qidiryapsiz?"])}" aria-label="${t(["Поиск", "Qidiruv"])}"></form><button type="button" class="lnk" id="sq-x">${t(["Отмена", "Bekor"])}</button></div><div id="sq-res"></div></div>
<div id="sheet" hidden></div>
<div id="toast" role="status" aria-live="polite"></div>
<script type="application/json" id="gw-data">${json(data)}</script>
<script>
${assets.js}</script>
</body>
</html>`;
}

/** Подписи магазина: их, кроме тех, что про Greenwell; имя магазина — клиента. */
export function shopUiOf(l: InstantLocale, shopName: string): Record<string, string> {
  const i = l === "uz" ? 1 : 0;
  const base = assets.ui as Record<string, string[]>;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries({ ...base, ...UI_OWN })) out[k] = v[i].split("{name}").join(shopName);
  out.brand = shopName;
  out.tagline = shopName;
  return out;
}
