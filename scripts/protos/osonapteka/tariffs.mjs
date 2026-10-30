// Конструктор тарифов Oson Apteka — для покупателя и для аптеки.
//
// Владелец DevUz, 30.10.2026: «конструктор тарифов, сделай цены по середине
// рынка». Сам справочник для покупателя бесплатный (их слова), платят аптеки.
// Поэтому две вкладки: «Покупателю» — что он может выбрать и за что заплатить
// (бронь, доставка по зонам, срочно, подписка), «Аптеке» — размещение и
// инструменты продвижения. Это ПРЕДЛОЖЕНИЕ DevUz для обсуждения, а не их
// прайс: на сайте так и подписано. Откуда каждая цифра — SOURCES.md.

export const BUYER = {
  bron: 0, // бронь и самовывоз: бесплатно, как у ArzonApteka и tabletki.ua
  hold: 24, // часов держит бронь (tabletki.ua — 24 ч)
  zones: [
    { id: "near", km: 3, price: 9000, ru: "Рядом, до 3 км", uz: "Yaqin, 3 km gacha" }, // PharmaClick: от 8 000 сум по Ташкенту
    { id: "city", km: 10, price: 15000, ru: "По городу, до 10 км", uz: "Shahar bo‘ylab, 10 km gacha" },
    { id: "out", km: 25, price: 25000, ru: "Пригород, до 25 км", uz: "Shahar atrofi, 25 km gacha" },
  ],
  fast: 7000, // срочно за 60 минут (PharmaClick — 55 минут)
  plus: { price: 29000, free: 150000 }, // подписка: бесплатная доставка от 150 000 сум
};

export const PHARMACY = {
  base: { price: 290000, ru: "Размещение аптеки", uz: "Dorixonani joylashtirish" }, // первый месяц бесплатно (их слова)
  opts: [
    { id: "bron", fee: 2, ru: "Онлайн-бронь", uz: "Onlayn bron", per: "pct" }, // 2% с выкупленной брони, как у tabletki.ua
    { id: "top", price: 350000, ru: "Первые в выдаче своего района", uz: "O‘z tumani natijalarida birinchi", per: "mo" },
    { id: "deliv", price: 3000, ru: "Доставка через Oson Apteka", uz: "Oson Apteka orqali yetkazish", per: "order" },
    { id: "banner", price: 900000, ru: "Баннер на главной", uz: "Bosh sahifada banner", per: "mo" }, // у ArzonApteka — от месяца, цена по запросу
    { id: "price", price: 250000, ru: "Oson Price: цены соседей", uz: "Oson Price: qo‘shnilar narxlari", per: "mo" },
  ],
};
