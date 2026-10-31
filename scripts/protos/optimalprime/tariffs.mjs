// Конструктор тарифов Optimal Prime — то, что выбирает и за что платит их
// клиент: налоговый режим, банковские операции в сумах и в валюте,
// сотрудники, бухгалтерские операции, счета-фактуры, письма, мониторинг
// рисков, отчётность, разовые услуги.
//
// Цены — ИХ, с optimal-prime.uz (31.10.2026), построчно. Из их трёх пакетов
// видна цена за единицу, и она совпадает в разных пакетах:
//   банк в сумах  500 000 / 10 = 2 000 000 / 40 = 50 000 за операцию;
//   учёт          1 000 000 / 20 = 3 500 000 / 70 = 50 000 за операцию;
//   кадры         2 000 000 / 10 = 200 000 за сотрудника, до 3 — 500 000;
//   валюта        500 000 / 4 = 125 000 за операцию.
// Ползунок между и за их порогами — по этой же цене за единицу. Это наш
// пересчёт, а не их прайс: на сайте под итогом их же слова «Цены указаны
// ориентировочно. Точная стоимость рассчитывается индивидуально».
// При значениях по умолчанию итог ровно их: Light 3 000 000, УСН
// 12 500 000, ОСН 15 500 000 (держит tests/proto-bundles.test.ts).
// Сверка с рынком — SOURCES.md.

export const UNIT = { bank: 50000, acc: 50000, emp: 200000, empMin: 500000, empMinN: 3, fx: 125000 };

export const REGIMES = [
  { id: "light", ru: ["Light", "ИП и микро-бизнес"], uz: ["Light", "YaTT va mikro-biznes"],
    def: { bank: 10, emp: 3, acc: 20, fx: 0 },
    fixed: [
      { id: "einv", price: 500000, ru: "Электронные счета-фактуры (базовый пакет)", uz: "Elektron hisob-fakturalar (asosiy)" },
      { id: "rep", price: 500000, ru: "Ежемесячная налоговая отчётность", uz: "Oylik soliq hisoboti" },
    ], opt: [] },
  { id: "usn", ru: ["УСН", "Упрощённая система"], uz: ["STS", "Soddalashtirilgan tizim"],
    def: { bank: 40, emp: 10, acc: 70, fx: 0 },
    fixed: [
      { id: "einv", price: 1500000, ru: "Электронные счета-фактуры и уполномочия", uz: "Elektron hisob-fakturalar va vakolatlar" },
      { id: "rep", price: 2500000, ru: "Ежемесячная налоговая отчётность и статистика", uz: "Oylik soliq hisoboti va statistika" },
    ],
    opt: [{ id: "letters", price: 1000000, on: true, ru: "Письма в налоговые органы", uz: "Soliq organlariga xatlar" }] },
  { id: "osn", ru: ["ОСН", "Общая система"], uz: ["UTS", "Umumiy tizim"], popular: true,
    def: { bank: 40, emp: 10, acc: 70, fx: 4 },
    fixed: [
      { id: "einv", price: 1500000, ru: "Электронные счета-фактуры и уполномочия", uz: "Elektron hisob-fakturalar va vakolatlar" },
      { id: "rep", price: 4000000, ru: "Расширенная ежемесячная отчётность", uz: "Kengaytirilgan oylik hisobot" },
    ],
    opt: [
      { id: "risk", price: 1000000, on: true, ru: "Мониторинг и анализ рисков", uz: "Xavflarni monitoring va tahlil qilish" },
      { id: "letters", price: 1000000, on: true, ru: "Письма в налоговые органы", uz: "Soliq organlariga xatlar" },
    ] },
];

/* Их «Дополнительные услуги» — разово, цены с сайта. */
export const ONCE = [
  { id: "reg", price: 13000000, from: true, ru: "Регистрация предприятия", uz: "Korxonani ro‘yxatdan o‘tkazish" },
  { id: "charter", price: 10000000, from: true, ru: "Изменения в устав", uz: "Ustavga o‘zgartirishlar" },
  { id: "permit", price: 2500000, ru: "Разрешение на работу", uz: "Ishlash uchun ruxsatnoma" },
  { id: "eds", price: 300000, ru: "Электронная подпись (ЭЦП)", uz: "Elektron raqamli imzo (ERI)" },
  { id: "eeisvo", price: 2500000, ru: "Регистрация валютного контракта в ЕЭИСВО", uz: "Valyuta shartnomasini EEAXATda ro‘yxatdan o‘tkazish" },
  { id: "inv", price: 500000, ru: "Регистрация спецификации и инвойса по услугам", uz: "Xizmatlar bo‘yicha spetsifikatsiya va invoysni ro‘yxatdan o‘tkazish" },
  { id: "audit", price: 2000000, from: true, ru: "Первичная оценка (1 час)", uz: "Dastlabki baholash (1 soat)" },
  { id: "consult", price: 700000, ru: "Консультация (30 мин)", uz: "Konsultatsiya (30 daqiqa)" },
  { id: "policy", price: 200000, from: true, ru: "Разработка учётной политики", uz: "Hisob siyosatini ishlab chiqish" },
];

/** Сумма в месяц по режиму и ползункам — тем же правилом, что в site.js. */
export function monthly(regime, v, opts) {
  const r = REGIMES.find((x) => x.id === regime);
  const emp = v.emp <= UNIT.empMinN ? UNIT.empMin : v.emp * UNIT.emp;
  let s = v.bank * UNIT.bank + emp + v.acc * UNIT.acc + v.fx * UNIT.fx;
  for (const f of r.fixed) s += f.price;
  for (const o of r.opt) if (opts ? opts[o.id] !== false : o.on) s += o.price;
  return s;
}
