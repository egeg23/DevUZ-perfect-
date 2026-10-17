import { defineDict } from "@/lib/admin/i18n";

/**
 * Уровни (lib/admin/levels.ts) и грейд по сделкам месяца
 * (lib/admin/grade-month.ts) на «Главной». Узбекский — латиницей, польский —
 * как в польских CRM.
 */

export const levelsDict = defineDict({
  myTitle: { ru: "Мой рост", uz: "Mening o‘sishim", pl: "Mój rozwój" },
  level: {
    ru: (n: number) => `Уровень ${n}`,
    uz: (n: number) => `${n}-daraja`,
    pl: (n: number) => `Poziom ${n}`,
  },
  levelShort: {
    ru: (n: number) => `ур. ${n}`,
    uz: (n: number) => `${n}-dar.`,
    pl: (n: number) => `poz. ${n}`,
  },
  toNext: {
    ru: (xp: number, n: number) => `ещё ${xp} очков до уровня ${n}`,
    uz: (xp: number, n: number) => `${n}-darajagacha yana ${xp} ball`,
    pl: (xp: number, n: number) => `jeszcze ${xp} pkt do poziomu ${n}`,
  },
  total: {
    ru: (xp: number) => `${xp} очков всего`,
    uz: (xp: number) => `jami ${xp} ball`,
    pl: (xp: number) => `${xp} pkt łącznie`,
  },
  week: {
    ru: (xp: number) => `+${xp} за 7 дней`,
    uz: (xp: number) => `7 kunda +${xp}`,
    pl: (xp: number) => `+${xp} w 7 dni`,
  },
  pending: {
    ru: "Очки считаются раз в час — первый счёт скоро появится.",
    uz: "Ballar soatiga bir marta hisoblanadi — birinchi hisob tez orada chiqadi.",
    pl: "Punkty liczą się raz na godzinę — pierwszy wynik pojawi się wkrótce.",
  },
  howTitle: { ru: "За что очки", uz: "Ballar nima uchun", pl: "Za co punkty" },
  xp_touch: { ru: "касание", uz: "aloqa", pl: "kontakt" },
  xp_reply: { ru: "ответ на ваше касание", uz: "aloqangizga javob", pl: "odpowiedź na Twój kontakt" },
  xp_interest: { ru: "интерес клиента", uz: "mijoz qiziqishi", pl: "zainteresowanie klienta" },
  xp_mockup: { ru: "макет ушёл", uz: "maket yuborildi", pl: "makieta wysłana" },
  xp_shown: { ru: "показ макета", uz: "maketni ko‘rsatish", pl: "pokaz makiety" },
  xp_priced: { ru: "цена названа", uz: "narx aytildi", pl: "cena podana" },
  xp_paid: { ru: "сделка с оплатой", uz: "to‘lovli bitim", pl: "transakcja z płatnością" },
  xp_panel: { ru: "15 минут работы в панели (до 8 в день)", uz: "panelda 15 daqiqa ish (kuniga 8 tagacha)", pl: "15 minut pracy w panelu (do 8 dziennie)" },
  xp_order: {
    ru: "смена статуса лида, сделанная задача, ответ боту (до 20 очков в день)",
    uz: "lid holatini o‘zgartirish, bajarilgan vazifa, botga javob (kuniga 20 ballgacha)",
    pl: "zmiana statusu leada, wykonane zadanie, odpowiedź botowi (do 20 pkt dziennie)",
  },
  xpLine: {
    ru: (what: string, pts: number, n: number) => `${what}: +${pts} · у вас ${n}`,
    uz: (what: string, pts: number, n: number) => `${what}: +${pts} · sizda ${n}`,
    pl: (what: string, pts: number, n: number) => `${what}: +${pts} · u Ciebie ${n}`,
  },

  // Звания.
  t_novice: { ru: "Новичок", uz: "Yangi boshlovchi", pl: "Nowicjusz" },
  t_scout: { ru: "Разведчик", uz: "Razvedkachi", pl: "Zwiadowca" },
  t_tracker: { ru: "Следопыт", uz: "Iz quvuvchi", pl: "Tropiciel" },
  t_hunter: { ru: "Охотник", uz: "Ovchi", pl: "Łowca" },
  t_negotiator: { ru: "Переговорщик", uz: "Muzokarachi", pl: "Negocjator" },
  t_closer: { ru: "Закрыватель сделок", uz: "Bitim yopuvchi", pl: "Finalizator" },
  t_dealmaster: { ru: "Мастер сделок", uz: "Bitimlar ustasi", pl: "Mistrz transakcji" },
  t_veteran: { ru: "Ветеран", uz: "Faxriy", pl: "Weteran" },
  t_champion: { ru: "Чемпион", uz: "Chempion", pl: "Czempion" },
  t_legend: { ru: "Легенда", uz: "Afsona", pl: "Legenda" },

  // Грейд по сделкам месяца.
  gradeTitle: { ru: "Грейд за сделки", uz: "Bitimlar bo‘yicha grade", pl: "Grade za transakcje" },
  deals: {
    ru: (n: number, target: number) => `Сделок в этом месяце: ${n} из ${target}`,
    uz: (n: number, target: number) => `Shu oydagi bitimlar: ${target} tadan ${n}`,
    pl: (n: number, target: number) => `Transakcje w tym miesiącu: ${n} z ${target}`,
  },
  rateNow: {
    ru: (p: number) => `Сейчас ваш процент с нового клиента — ${p}%`,
    uz: (p: number) => `Hozir yangi mijozdan foizingiz — ${p}%`,
    pl: (p: number) => `Teraz Twój procent od nowego klienta — ${p}%`,
  },
  rateOld: {
    ru: "До 1 ноября процент — как раньше, по вашему грейду в «Команде».",
    uz: "1-noyabrgacha foiz — avvalgidek, «Jamoa»dagi gradingiz bo‘yicha.",
    pl: "Do 1 listopada procent jak dotąd — według Twojego grade w „Zespole”.",
  },
  personRateOld: {
    ru: "до 1 ноября — процент по грейду",
    uz: "1-noyabrgacha — grade bo‘yicha foiz",
    pl: "do 1 listopada — procent wg grade",
  },
  personRate: {
    ru: (p: number) => `процент сейчас ${p}%`,
    uz: (p: number) => `hozirgi foiz ${p}%`,
    pl: (p: number) => `procent teraz ${p}%`,
  },
  rateNext: {
    ru: (p: number) => `В следующем месяце будет ${p}%`,
    uz: (p: number) => `Keyingi oyda ${p}% bo‘ladi`,
    pl: (p: number) => `W przyszłym miesiącu będzie ${p}%`,
  },
  toBoost: {
    ru: (n: number) => `ещё ${n} — и в следующем месяце 15% вместо 10%`,
    uz: (n: number) => `yana ${n} ta — keyingi oyda 10% o‘rniga 15%`,
    pl: (n: number) => `jeszcze ${n} — a w przyszłym miesiącu 15% zamiast 10%`,
  },
  bonusNow: {
    ru: (usd: number) => `Премия за этот месяц: $${usd}`,
    uz: (usd: number) => `Shu oy uchun mukofot: $${usd}`,
    pl: (usd: number) => `Premia za ten miesiąc: $${usd}`,
  },
  bonusNext: {
    ru: (n: number) => `ещё ${n} — премия $200 сверх процента`,
    uz: (n: number) => `yana ${n} ta — foizdan tashqari $200 mukofot`,
    pl: (n: number) => `jeszcze ${n} — premia $200 ponad procent`,
  },
  bonusFrom: {
    ru: "Премия $200 за каждые 3 сделки месяца — со сделок с 1 ноября.",
    uz: "Oyning har 3 ta bitimi uchun $200 mukofot — 1-noyabrdan boshlab bitimlar uchun.",
    pl: "Premia $200 za każde 3 transakcje miesiąca — od transakcji od 1 listopada.",
  },
  dealHint: {
    ru: "Сделка — ваш проект, по которому пришла первая оплата.",
    uz: "Bitim — birinchi to‘lov kelgan loyihangiz.",
    pl: "Transakcja — Twój projekt, za który wpłynęła pierwsza płatność.",
  },
  personDeals: {
    ru: (n: number, target: number) => `сделки ${n}/${target}`,
    uz: (n: number, target: number) => `bitimlar ${n}/${target}`,
    pl: (n: number, target: number) => `transakcje ${n}/${target}`,
  },
});
