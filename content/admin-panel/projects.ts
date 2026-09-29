import { defineDict, plural, tr, type PanelLocale, type Tr } from "@/lib/admin/i18n";

/**
 * Раздел «Проекты»: список (/admin/projects) и карточка проекта
 * (/admin/projects/[id]) — стадия, смета, деньги, партнёр, данные проекта
 * и блок «Договор».
 *
 * Термины — по content/admin-panel/GLOSSARY.md: проект — «loyiha» /
 * «projekt», договор — «shartnoma» / «umowa», смета — «smeta» /
 * «kosztorys», начисление — «hisoblanma» / «naliczenie», владелец —
 * «egasi» / «właściciel», руководитель — «rahbar» / «kierownik».
 *
 * Названия проектов, клиентов, заметки и имена — данные, не переводятся.
 * Вид сделки, назначение платежа и состояние начисления — из
 * lib/admin/finance.ts (KIND_TR, PURPOSE_TR, ACCRUAL_TR): те же подписи,
 * что и в «Финансах».
 */

/**
 * Стадия проекта — по ключу из lib/admin/projects.ts (ALL_STAGES).
 *
 * Русский `STAGE_LABEL` в lib остаётся для журнала и бота; панель берёт
 * подпись отсюда. Тест panel-i18n-projects сверяет, что ключи совпадают.
 */
export const stageDict = defineDict({
  brief: { ru: "бриф", uz: "brif", pl: "brief" },
  contract: { ru: "договор", uz: "shartnoma", pl: "umowa" },
  design: { ru: "дизайн", uz: "dizayn", pl: "design" },
  build: { ru: "разработка", uz: "ishlab chiqish", pl: "programowanie" },
  review: { ru: "приёмка", uz: "qabul qilish", pl: "odbiór" },
  launch: { ru: "запуск", uz: "ishga tushirish", pl: "uruchomienie" },
  support: { ru: "поддержка", uz: "qo‘llab-quvvatlash", pl: "wsparcie" },
  paused: { ru: "на паузе", uz: "pauzada", pl: "wstrzymany" },
  done: { ru: "закрыт", uz: "yopilgan", pl: "zamknięty" },
  cancelled: { ru: "отменён", uz: "bekor qilingan", pl: "anulowany" },
});

/** Подпись стадии на языке панели; незнакомая стадия — как есть. */
export function stageLabel(stage: string, locale: PanelLocale): string {
  const entry = (stageDict as Record<string, Tr | undefined>)[stage];
  return entry ? tr(entry, locale) : stage;
}

/** Общие подписи списка и карточки. */
const common = {
  offLine: {
    ru: "Стадия вне линии: полосу не рисуем — это не начало и не конец.",
    uz: "Bosqich chiziqdan tashqarida: chiziq chizilmaydi — bu na boshlanish, na oxir.",
    pl: "Etap poza ścieżką: paska nie rysujemy — to ani początek, ani koniec.",
  },
  noTeamAccrual: {
    ru: " — без начислений команде",
    uz: " — jamoaga hisoblanmasiz",
    pl: " — bez naliczeń dla zespołu",
  },
} as const;

/** Список проектов (/admin/projects). */
export const projectsListDict = defineDict({
  title: { ru: "Проекты", uz: "Loyihalar", pl: "Projekty" },
  onlyActive: { ru: "только активные", uz: "faqat faollari", pl: "tylko aktywne" },
  showClosed: { ru: "показать закрытые", uz: "yopilganlarini ko‘rsatish", pl: "pokaż zamknięte" },
  createFailed: {
    ru: "Не получилось — проверьте название.",
    uz: "Bo‘lmadi — nomini tekshiring.",
    pl: "Nie udało się — sprawdź nazwę.",
  },
  today: { ru: "сегодня", uz: "bugun", pl: "dziś" },
  daysOnStage: {
    ru: (n: number) => `${n} дн. на этой стадии`,
    uz: (n: number) => `shu bosqichda ${n} kun`,
    pl: (n: number) => `${n} ${plural("pl", n, "dzień", "dni", "dni")} na tym etapie`,
  },
  ledBy: {
    ru: (name: string) => `ведёт ${name}`,
    uz: (name: string) => `olib boruvchi: ${name}`,
    pl: (name: string) => `prowadzi ${name}`,
  },
  due: {
    ru: (date: string) => `срок ${date}`,
    uz: (date: string) => `muddat ${date}`,
    pl: (date: string) => `termin ${date}`,
  },
  overdue: { ru: " · просрочен", uz: " · muddati o‘tgan", pl: " · po terminie" },
  offLine: {
    ru: (stage: string) => `Вне линии стадий — полосу не рисуем: «${stage}» это не начало и не конец.`,
    uz: (stage: string) => `Bosqichlar chizig‘idan tashqarida — chiziq chizilmaydi: «${stage}» na boshlanish, na oxir.`,
    pl: (stage: string) => `Poza ścieżką etapów — paska nie rysujemy: „${stage}” to ani początek, ani koniec.`,
  },
  emptyAll: { ru: "Проектов пока нет.", uz: "Hozircha loyihalar yo‘q.", pl: "Nie ma jeszcze projektów." },
  emptyActive: { ru: "Активных проектов нет.", uz: "Faol loyihalar yo‘q.", pl: "Brak aktywnych projektów." },
  newProject: { ru: "Новый проект", uz: "Yangi loyiha", pl: "Nowy projekt" },
  ownerAria: { ru: "Ведёт", uz: "Olib boradi", pl: "Prowadzi" },
  ownerPick: {
    ru: "Кто ведёт — ему идёт начисление",
    uz: "Kim olib boradi — hisoblanma unga tushadi",
    pl: "Kto prowadzi — jemu przysługuje naliczenie",
  },
  me: { ru: " (я)", uz: " (men)", pl: " (ja)" },
  noTeamAccrual: common.noTeamAccrual,
  titlePh: { ru: "Название", uz: "Nomi", pl: "Nazwa" },
  clientPh: { ru: "Клиент", uz: "Mijoz", pl: "Klient" },
  amountPh: { ru: "Сумма, $", uz: "Summa, $", pl: "Kwota, $" },
  create: { ru: "Создать", uz: "Yaratish", pl: "Utwórz" },
  footAdmin: {
    ru: "Проект заводит любой сотрудник и ведёт его сам; вы выбираете, кто ведёт. Стадию двигаете вы.",
    uz: "Loyihani istalgan xodim ochadi va o‘zi olib boradi; kim olib borishini siz tanlaysiz. Bosqichni siz o‘zgartirasiz.",
    pl: "Projekt zakłada każdy pracownik i sam go prowadzi; Ty wybierasz, kto prowadzi. Etap zmieniasz Ty.",
  },
  footStaff: {
    ru: "Проект заводит любой сотрудник — и ведёт его сам. Стадию двигает владелец.",
    uz: "Loyihani istalgan xodim ochadi — va o‘zi olib boradi. Bosqichni egasi o‘zgartiradi.",
    pl: "Projekt zakłada każdy pracownik — i sam go prowadzi. Etap zmienia właściciel.",
  },
});

/**
 * Ответ действий карточки: `?r=код` → текст. Коды — из
 * app/admin/projects/actions.ts и app/admin/finance/actions.ts (MoneyResult
 * из lib/admin/ledger.ts, отказ setProjectPartner). Тест
 * panel-i18n-projects сверяет, что каждый код есть здесь.
 */
export const projectResultDict = defineDict({
  ok: { ru: "Готово.", uz: "Tayyor.", pl: "Gotowe." },
  paid: { ru: "Платёж записан.", uz: "To‘lov yozildi.", pl: "Płatność zapisana." },
  forbidden: {
    ru: "Это правит владелец. Сумму и вид меняет ещё тот, кто ведёт проект, — пока по нему нет платежей.",
    uz: "Buni egasi o‘zgartiradi. Summa va turini loyihani olib borayotgan xodim ham o‘zgartira oladi — loyiha bo‘yicha to‘lov bo‘lmaguncha.",
    pl: "To zmienia właściciel. Kwotę i rodzaj może zmienić też osoba prowadząca projekt — dopóki nie ma w nim płatności.",
  },
  invalid: {
    ru: "Сумма, процент или дата не разобрались: целые доллары, целые проценты, дата как в календаре.",
    uz: "Summa, foiz yoki sana tushunarsiz: butun dollar, butun foiz, sana kalendardagidek.",
    pl: "Nie udało się odczytać kwoty, procentu lub daty: pełne dolary, pełne procenty, data jak w kalendarzu.",
  },
  below_floor: {
    ru: "Сумма ниже порога сметы. Порог — это то, под чем проект не окупается; опуститься ниже может только владелец.",
    uz: "Summa smeta chegarasidan past. Chegara — undan pastda loyiha o‘zini oqlamaydi; undan pastga faqat egasi tusha oladi.",
    pl: "Kwota jest poniżej progu kosztorysu. Próg to kwota, poniżej której projekt się nie zwraca; zejść niżej może tylko właściciel.",
  },
  data_forbidden: {
    ru: "«Данные проекта» правит ведущий проекта, его руководитель и владелец. Ведущего меняет только владелец.",
    uz: "«Loyiha ma’lumotlari»ni loyihani olib boruvchi, uning rahbari va egasi o‘zgartiradi. Olib boruvchini faqat egasi almashtiradi.",
    pl: "„Dane projektu” edytuje osoba prowadząca, jej kierownik i właściciel. Osobę prowadzącą zmienia tylko właściciel.",
  },
  gone: { ru: "Такой записи уже нет.", uz: "Bunday yozuv endi yo‘q.", pl: "Tego wpisu już nie ma." },
  failed: { ru: "Не получилось.", uz: "Bo‘lmadi.", pl: "Nie udało się." },
  offline: { ru: "База недоступна.", uz: "Bazaga ulanib bo‘lmadi.", pl: "Baza danych jest niedostępna." },
});

/**
 * Почему партнёрское начисление не засчитано — по `VoidReason` из
 * lib/partners/rules.ts (там русский VOID_TITLE для бота). Владелец может
 * вписать и свою причину — её показываем как есть.
 */
export const partnerVoidDict = defineDict({
  self: { ru: "партнёр привёл сам себя", uz: "hamkor o‘zini o‘zi olib kelgan", pl: "partner polecił sam siebie" },
  existing_client: {
    ru: "клиент уже был у студии до ссылки",
    uz: "mijoz havoladan oldin ham studiyada bo‘lgan",
    pl: "klient był w studiu już przed linkiem",
  },
  blocked: { ru: "партнёр заблокирован", uz: "hamkor bloklangan", pl: "partner zablokowany" },
});

/** Карточка проекта (/admin/projects/[id]). */
export const projectCardDict = defineDict({
  back: { ru: "← к проектам", uz: "← loyihalarga", pl: "← do projektów" },
  noClient: { ru: "клиент не указан", uz: "mijoz ko‘rsatilmagan", pl: "klient nie podany" },
  ledBy: {
    ru: (name: string) => ` · ведёт ${name}`,
    uz: (name: string) => ` · olib boruvchi: ${name}`,
    pl: (name: string) => ` · prowadzi ${name}`,
  },

  // Стадия
  stage: { ru: "Стадия", uz: "Bosqich", pl: "Etap" },
  stageHelp: { ru: "Кто и зачем двигает стадию", uz: "Bosqichni kim va nima uchun o‘zgartiradi", pl: "Kto i po co zmienia etap" },
  sinceToday: { ru: "с сегодняшнего дня", uz: "bugundan", pl: "od dziś" },
  days: {
    ru: (n: number) => `${n} дн.`,
    uz: (n: number) => `${n} kun`,
    pl: (n: number) => `${n} ${plural("pl", n, "dzień", "dni", "dni")}`,
  },
  since: {
    ru: (when: string) => ` · с ${when}`,
    uz: (when: string) => ` · ${when} dan`,
    pl: (when: string) => ` · od ${when}`,
  },
  offLine: common.offLine,
  stageByAdmin: {
    ru: "Стадию двигает админ. Она — обещание клиенту, а не отметка о самочувствии исполнителя.",
    uz: "Bosqichni admin o‘zgartiradi. U — mijozga berilgan va’da, ijrochining kayfiyati haqidagi belgi emas.",
    pl: "Etap zmienia administrator. To obietnica dla klienta, a nie notatka o samopoczuciu wykonawcy.",
  },

  // Смета
  quote: { ru: "Смета", uz: "Smeta", pl: "Kosztorys" },
  noQuote: {
    ru: "Сметы пока нет. Выберите категорию и сохраните — порог, потолок и срок посчитаются сами.",
    uz: "Hozircha smeta yo‘q. Toifani tanlang va saqlang — chegara, yuqori narx va muddat o‘zi hisoblanadi.",
    pl: "Kosztorysu jeszcze nie ma. Wybierz kategorię i zapisz — próg, pułap i termin policzą się same.",
  },
  category: { ru: "Категория", uz: "Toifa", pl: "Kategoria" },
  choose: { ru: "— выберите —", uz: "— tanlang —", pl: "— wybierz —" },
  extrasAfterSave: {
    ru: "После сохранения появятся допы этой категории.",
    uz: "Saqlagandan keyin shu toifaning qo‘shimchalari chiqadi.",
    pl: "Po zapisaniu pojawią się dodatki tej kategorii.",
  },
  promisedWeeks: { ru: "Обещанный срок, недель", uz: "Va’da qilingan muddat, hafta", pl: "Obiecany termin, tygodnie" },
  estimatedWeeks: {
    ru: (low: number, high: number) => `расчётный ${low}–${high}`,
    uz: (low: number, high: number) => `hisobiy ${low}–${high}`,
    pl: (low: number, high: number) => `szacunkowo ${low}–${high}`,
  },
  upTo: {
    ru: (unit: string, max: number) => ` — ${unit}, до ${max}`,
    uz: (unit: string, max: number) => ` — ${unit}, ${max} tagacha`,
    pl: (unit: string, max: number) => ` — ${unit}, do ${max}`,
  },
  saveQuote: { ru: "Сохранить смету", uz: "Smetani saqlash", pl: "Zapisz kosztorys" },
  clearQuote: { ru: "убрать смету", uz: "smetani olib tashlash", pl: "usuń kosztorys" },
  quoteWho: {
    ru: "Смету правит тот, кто ведёт проект, и владелец.",
    uz: "Smetani loyihani olib boruvchi va egasi o‘zgartiradi.",
    pl: "Kosztorys edytuje osoba prowadząca projekt i właściciel.",
  },

  // Деньги
  money: { ru: "Деньги", uz: "Pul", pl: "Pieniądze" },
  moneyHelp: { ru: "Смета, сумма, платежи", uz: "Smeta, summa, to‘lovlar", pl: "Kosztorys, kwota, płatności" },
  dealKind: { ru: "Вид сделки", uz: "Bitim turi", pl: "Rodzaj transakcji" },
  contractAmount: { ru: "Сумма по договору, $", uz: "Shartnoma summasi, $", pl: "Kwota z umowy, $" },
  taxPercent: { ru: "Налог, %", uz: "Soliq, %", pl: "Podatek, %" },
  devCost: { ru: "Себестоимость разработки, $", uz: "Ishlab chiqish tannarxi, $", pl: "Koszt wytworzenia, $" },
  afterContract: { ru: "после договора", uz: "shartnomadan keyin", pl: "po umowie" },
  taxByOwner: {
    ru: "Налог и себестоимость вписывает владелец после подписания договора.",
    uz: "Soliq va tannarxni shartnoma imzolangandan keyin egasi kiritadi.",
    pl: "Podatek i koszt wytworzenia wpisuje właściciel po podpisaniu umowy.",
  },
  save: { ru: "Сохранить", uz: "Saqlash", pl: "Zapisz" },
  paidOwnerOnly: {
    ru: "По проекту уже есть платёж — сумму теперь меняет только владелец.",
    uz: "Loyiha bo‘yicha to‘lov bor — endi summani faqat egasi o‘zgartiradi.",
    pl: "W projekcie jest już płatność — kwotę zmienia teraz tylko właściciel.",
  },
  moneyWho: {
    ru: "Сумму и вид правит владелец и тот, кто ведёт проект.",
    uz: "Summa va turini egasi hamda loyihani olib boruvchi o‘zgartiradi.",
    pl: "Kwotę i rodzaj edytuje właściciel i osoba prowadząca projekt.",
  },
  tax: { ru: "Налог", uz: "Soliq", pl: "Podatek" },
  profit: { ru: "Чистая прибыль", uz: "Sof foyda", pl: "Zysk netto" },
  noCost: { ru: "без себестоимости", uz: "tannarxsiz", pl: "bez kosztu wytworzenia" },
  paid: { ru: "Оплачено", uz: "To‘langan", pl: "Zapłacono" },
  projectCancelled: { ru: "проект отменён", uz: "loyiha bekor qilingan", pl: "projekt anulowany" },
  paidFull: { ru: "целиком", uz: "to‘liq", pl: "w całości" },
  paidOf: {
    ru: (total: string) => `из ${total}`,
    uz: (total: string) => `${total} dan`,
    pl: (total: string) => `z ${total}`,
  },
  ownerLeft: { ru: "Остаётся владельцу", uz: "Egasiga qoladi", pl: "Zostaje właścicielowi" },
  shareHead: { ru: "руководитель", uz: "rahbar", pl: "kierownik" },
  shareLeads: { ru: "ведёт", uz: "olib boradi", pl: "prowadzi" },
  manual: { ru: " · вручную", uz: " · qo‘lda", pl: " · ręcznie" },
  byGradeTail: { ru: " · по грейду", uz: " · daraja bo‘yicha", pl: " · według poziomu" },
  sharePercentAria: { ru: "Процент по этой сделке", uz: "Shu bitim bo‘yicha foiz", pl: "Procent od tej transakcji" },
  setShare: { ru: "задать", uz: "belgilash", pl: "ustaw" },
  byGrade: { ru: "по грейду", uz: "daraja bo‘yicha", pl: "według poziomu" },

  // Партнёр
  partner: { ru: "Партнёр", uz: "Hamkor", pl: "Partner" },
  fromTurnover: { ru: "с оборота", uz: "aylanmadan", pl: "od obrotu" },
  fromProfit: { ru: "от прибыли", uz: "foydadan", pl: "od zysku" },
  byAmount: { ru: " · по сумме проекта", uz: " · loyiha summasi bo‘yicha", pl: " · według kwoty projektu" },
  agency: {
    ru: (name: string) => ` · агентство «${name}»`,
    uz: (name: string) => ` · «${name}» agentligi`,
    pl: (name: string) => ` · agencja „${name}”`,
  },
  notCounted: {
    ru: (why: string) => `не засчитано: ${why}`,
    uz: (why: string) => `hisobga olinmadi: ${why}`,
    pl: (why: string) => `niezaliczone: ${why}`,
  },
  partnerNoAmount: {
    ru: "начисление появится, когда будет сумма",
    uz: "summa kiritilganda hisoblanma paydo bo‘ladi",
    pl: "naliczenie pojawi się, gdy będzie kwota",
  },
  noPartner: {
    ru: "Клиент пришёл без партнёрской ссылки.",
    uz: "Mijoz hamkorlik havolasisiz kelgan.",
    pl: "Klient przyszedł bez linku partnerskiego.",
  },
  broughtBy: { ru: "Кто привёл", uz: "Kim olib keldi", pl: "Kto polecił" },
  withoutPartner: { ru: "без партнёра", uz: "hamkorsiz", pl: "bez partnera" },
  partnerPercent: { ru: "Процент партнёру", uz: "Hamkor foizi", pl: "Procent dla partnera" },
  byTier: { ru: "по ступени", uz: "pog‘ona bo‘yicha", pl: "według progu" },
  agencyOrder: { ru: "Заказ агентства", uz: "Agentlik buyurtmasi", pl: "Zlecenie agencji" },
  notAgency: { ru: "не агентство", uz: "agentlik emas", pl: "nie agencja" },
  voidReason: { ru: "Не засчитывать, причина", uz: "Hisobga olmaslik sababi", pl: "Nie zaliczać, powód" },
  voidEmpty: { ru: "пусто — засчитано", uz: "bo‘sh — hisobga olingan", pl: "puste — zaliczone" },

  // Платежи клиента
  payments: { ru: "Платежи клиента", uz: "Mijoz to‘lovlari", pl: "Płatności klienta" },
  confirmedBy: {
    ru: (name: string) => ` · подтвердил ${name}`,
    uz: (name: string) => ` · tasdiqladi: ${name}`,
    pl: (name: string) => ` · potwierdził(a) ${name}`,
  },
  delete: { ru: "удалить", uz: "o‘chirish", pl: "usuń" },
  noPayments: { ru: "Платежей пока нет.", uz: "Hozircha to‘lovlar yo‘q.", pl: "Nie ma jeszcze płatności." },
  awaitingInvoice: {
    ru: (no: string, amount: string, by: string) =>
      `Счёт № ${no} на ${amount} отмечен оплаченным${by ? ` (${by})` : ""} — платёж ещё не подтверждён.`,
    uz: (no: string, amount: string, by: string) =>
      `${amount} lik № ${no} hisob-faktura to‘langan deb belgilangan${by ? ` (${by})` : ""} — to‘lov hali tasdiqlanmagan.`,
    pl: (no: string, amount: string, by: string) =>
      `Faktura nr ${no} na ${amount} oznaczona jako opłacona${by ? ` (${by})` : ""} — płatność nie jest jeszcze potwierdzona.`,
  },
  confirmInContract: { ru: "Подтвердить в договоре", uz: "Shartnomada tasdiqlash", pl: "Potwierdź w umowie" },
  openContract: { ru: "Открыть договор", uz: "Shartnomani ochish", pl: "Otwórz umowę" },
  amountUsd: { ru: "Сумма, $", uz: "Summa, $", pl: "Kwota, $" },
  date: { ru: "Дата", uz: "Sana", pl: "Data" },
  purpose: { ru: "Назначение", uz: "Maqsad", pl: "Tytuł płatności" },
  note: { ru: "Заметка", uz: "Izoh", pl: "Notatka" },
  recordPayment: { ru: "Записать платёж", uz: "To‘lovni yozish", pl: "Zapisz płatność" },
  paymentsByOwner: {
    ru: "Платежи подтверждает владелец.",
    uz: "To‘lovlarni egasi tasdiqlaydi.",
    pl: "Płatności potwierdza właściciel.",
  },

  // Данные проекта
  data: { ru: "Данные проекта", uz: "Loyiha ma’lumotlari", pl: "Dane projektu" },
  dataHelp: { ru: "Кто может править", uz: "Kim o‘zgartira oladi", pl: "Kto może edytować" },
  ownerLeadsWarn: {
    ru: "Проект ведёте вы — начислений команде по нему нет. Если ведёт сотрудник, выберите его в поле «Ведёт» и сохраните.",
    uz: "Loyihani siz olib boryapsiz — jamoaga bu loyiha bo‘yicha hisoblanma yo‘q. Agar uni xodim olib borsa, «Olib boradi» maydonida uni tanlang va saqlang.",
    pl: "Ten projekt prowadzisz Ty — zespół nie ma z niego naliczeń. Jeśli prowadzi go pracownik, wybierz go w polu „Prowadzi” i zapisz.",
  },
  leads: { ru: "Ведёт", uz: "Olib boradi", pl: "Prowadzi" },
  client: { ru: "Клиент", uz: "Mijoz", pl: "Klient" },
  deadline: { ru: "Срок", uz: "Muddat", pl: "Termin" },
  notes: { ru: "Заметки", uz: "Izohlar", pl: "Notatki" },
  dataWho: {
    ru: "Правит ведущий проекта, его руководитель и владелец.",
    uz: "Loyihani olib boruvchi, uning rahbari va egasi o‘zgartiradi.",
    pl: "Edytuje osoba prowadząca projekt, jej kierownik i właściciel.",
  },
  leadsAccrual: {
    ru: "Ведёт — ему идёт начисление по проекту",
    uz: "Olib boradi — loyiha bo‘yicha hisoblanma unga tushadi",
    pl: "Prowadzi — jemu przysługuje naliczenie z projektu",
  },
  noTeamAccrual: common.noTeamAccrual,
  title: { ru: "Название", uz: "Nomi", pl: "Nazwa" },

  // Договор
  contract: { ru: "Договор", uz: "Shartnoma", pl: "Umowa" },
  howItWorks: { ru: "Как это устроено →", uz: "Bu qanday ishlaydi →", pl: "Jak to działa →" },
  voided: { ru: "Отменены:", uz: "Bekor qilinganlar:", pl: "Anulowane:" },
  contractDate: { ru: "Дата договора", uz: "Shartnoma sanasi", pl: "Data umowy" },
  clientName: { ru: "Заказчик — полное название", uz: "Buyurtmachi — to‘liq nomi", pl: "Zamawiający — pełna nazwa" },
  clientDetails: { ru: "Адрес и контакт заказчика", uz: "Buyurtmachining manzili va kontakti", pl: "Adres i kontakt zamawiającego" },
  clientDetailsPh: {
    ru: "г. Ташкент, ул. …, директор …, почта@…",
    uz: "Toshkent sh., … ko‘chasi, direktor …, pochta@…",
    pl: "Taszkent, ul. …, dyrektor …, e-mail@…",
  },
  clientTaxId: { ru: "ИНН или ПИНФЛ заказчика", uz: "Buyurtmachining STIR yoki JShShIR", pl: "INN lub PINFL zamawiającego" },
  clientBank: { ru: "Банк заказчика", uz: "Buyurtmachining banki", pl: "Bank zamawiającego" },
  clientBankPh: { ru: "АКБ «Капиталбанк», Ташкент", uz: "ATB «Kapitalbank», Toshkent", pl: "ABK „Kapitalbank”, Taszkent" },
  clientAccount: { ru: "Расчётный счёт — 20 цифр", uz: "Hisob raqami — 20 ta raqam", pl: "Numer rachunku — 20 cyfr" },
  clientMfo: { ru: "МФО — код банка, 5 цифр", uz: "MFO — bank kodi, 5 ta raqam", pl: "MFO — kod banku, 5 cyfr" },
  subject: {
    ru: "Предмет договора — что именно делаем",
    uz: "Shartnoma predmeti — aynan nima qilamiz",
    pl: "Przedmiot umowy — co dokładnie robimy",
  },
  stages: {
    ru: "Этапы — доли обязаны давать 100%",
    uz: "Bosqichlar — ulushlar jami 100% bo‘lishi shart",
    pl: "Etapy — udziały muszą dać razem 100%",
  },
  prepare: { ru: "Подготовить договор", uz: "Shartnomani tayyorlash", pl: "Przygotuj umowę" },
  fromLead: { ru: "Лид, из которого вырос проект →", uz: "Loyiha o‘sib chiqqan lid →", pl: "Lead, z którego powstał projekt →" },
  journalNote: {
    ru: "Каждый переход стадии записан в журнал вместе с тем, откуда и куда, и сколько дней проект простоял на предыдущей. По этим строкам потом видно, где производство встаёт, — а это самый полезный вопрос про сроки.",
    uz: "Har bir bosqich o‘zgarishi jurnalga yoziladi: qayerdan qayerga o‘tgani va loyiha oldingi bosqichda necha kun turgani. Shu yozuvlardan keyin ish qayerda to‘xtab qolishi ko‘rinadi — muddatlar haqidagi eng foydali savol shu.",
    pl: "Każda zmiana etapu trafia do dziennika: skąd i dokąd oraz ile dni projekt stał na poprzednim. Z tych wpisów widać potem, gdzie produkcja staje — a to najbardziej przydatne pytanie o terminy.",
  },

  // Почему договор не подготовился (`?contract=код&detail=…`)
  contractForbidden: {
    ru: "Готовить договор этой роли нельзя.",
    uz: "Bu rol shartnoma tayyorlay olmaydi.",
    pl: "Ta rola nie może przygotowywać umów.",
  },
  contractOffline: {
    ru: "База недоступна — попробуйте через минуту.",
    uz: "Bazaga ulanib bo‘lmadi — bir daqiqadan keyin urinib ko‘ring.",
    pl: "Baza danych jest niedostępna — spróbuj za minutę.",
  },
  contractInvalid: {
    ru: (detail: string) => `Договор не подготовлен: ${detail}.`,
    uz: (detail: string) => `Shartnoma tayyorlanmadi: ${detail}.`,
    pl: (detail: string) => `Umowa nie została przygotowana: ${detail}.`,
  },
  contractFailed: {
    ru: "Договор не подготовлен. Проверьте: дата, сумма больше нуля, заказчик и его реквизиты, предмет договора, этапы с долями, которые вместе дают 100%.",
    uz: "Shartnoma tayyorlanmadi. Tekshiring: sana, noldan katta summa, buyurtmachi va uning rekvizitlari, shartnoma predmeti, ulushlari jami 100% bo‘lgan bosqichlar.",
    pl: "Umowa nie została przygotowana. Sprawdź: datę, kwotę większą od zera, zamawiającego i jego dane, przedmiot umowy, etapy z udziałami, które razem dają 100%.",
  },
});

/**
 * Строки сметы (lib/admin/quote.ts): «Что говорить», цены допов, пакет
 * витрины.
 *
 * «Что говорить» — подсказка менеджеру перед звонком: что сказать и почему
 * нельзя ниже порога. Это текст для того, кто сидит в панели, а не
 * готовый документ клиенту, — поэтому он на языке панели: узбекоязычный
 * менеджер и говорит с клиентом своими словами. Суммы — как в калькуляторе
 * сайта, `$1,200`, на всех языках одинаково.
 */
export const quoteTextDict = defineDict({
  talkRange: {
    ru: (title: string, floor: string, ceiling: string) =>
      `Ориентир по «${title}»: ${floor}–${ceiling}. Точную цифру называем после короткого созвона — в неё войдёт то, чего нет ни в одном калькуляторе.`,
    uz: (title: string, floor: string, ceiling: string) =>
      `«${title}» bo‘yicha mo‘ljal: ${floor}–${ceiling}. Aniq raqamni qisqa qo‘ng‘iroqdan keyin aytamiz — unga hech bir kalkulyatorda yo‘q narsalar kiradi.`,
    pl: (title: string, floor: string, ceiling: string) =>
      `Orientacyjnie za „${title}”: ${floor}–${ceiling}. Dokładną kwotę podajemy po krótkiej rozmowie — wejdzie w nią to, czego nie ma w żadnym kalkulatorze.`,
  },
  talkPromised: {
    ru: (weeks: number, rush: boolean, low: number, high: number) =>
      `Срок: ${weeks} ${plural("ru", weeks, "неделя", "недели", "недель")} с даты аванса${rush ? ` — быстрее расчётных ${low}–${high}, поэтому в порог уже включено ускорение (+30%)` : ""}.`,
    uz: (weeks: number, rush: boolean, low: number, high: number) =>
      `Muddat: avans sanasidan ${weeks} hafta${rush ? ` — hisobiy ${low}–${high} haftadan tezroq, shuning uchun chegaraga tezlashtirish allaqachon kiritilgan (+30%)` : ""}.`,
    pl: (weeks: number, rush: boolean, low: number, high: number) =>
      `Termin: ${weeks} ${plural("pl", weeks, "tydzień", "tygodnie", "tygodni")} od daty zaliczki${rush ? ` — szybciej niż szacunkowe ${low}–${high}, dlatego w progu jest już przyspieszenie (+30%)` : ""}.`,
  },
  talkEstimated: {
    ru: (low: number, high: number) =>
      `Срок: ${low}–${high} недель с даты аванса. Дизайн и разработка идут параллельно — это и есть наша скорость.`,
    uz: (low: number, high: number) =>
      `Muddat: avans sanasidan ${low}–${high} hafta. Dizayn va ishlab chiqish parallel boradi — bizning tezligimiz shunda.`,
    pl: (low: number, high: number) =>
      `Termin: ${low}–${high} tygodni od daty zaliczki. Design i programowanie idą równolegle — na tym polega nasza szybkość.`,
  },
  talkFloor: {
    ru: (floor: string) =>
      `Ниже ${floor} не опускаемся: это порог, под которым проект не окупается. Скидку согласует только владелец.`,
    uz: (floor: string) =>
      `${floor} dan pastga tushmaymiz: bu chegara, undan pastda loyiha o‘zini oqlamaydi. Chegirmani faqat egasi kelishadi.`,
    pl: (floor: string) =>
      `Nie schodzimy poniżej ${floor}: to próg, poniżej którego projekt się nie zwraca. Rabat zatwierdza tylko właściciel.`,
  },
  talkSite: {
    ru: (siteLow: string, floor: string) =>
      `На сайте калькулятор показывает «от ${siteLow}» — это округление вниз. Если клиент ссылается на него, объясняем: точная цифра ${floor}, разница — округление, а не наценка.`,
    uz: (siteLow: string, floor: string) =>
      `Saytdagi kalkulyator «${siteLow} dan» deb ko‘rsatadi — bu pastga yaxlitlash. Mijoz shunga tayansa, tushuntiramiz: aniq raqam ${floor}, farq — yaxlitlash, ustama emas.`,
    pl: (siteLow: string, floor: string) =>
      `Kalkulator na stronie pokazuje „od ${siteLow}” — to zaokrąglenie w dół. Jeśli klient się na nie powołuje, wyjaśniamy: dokładna kwota to ${floor}, różnica to zaokrąglenie, a nie narzut.`,
  },
  pctOfTotal: {
    ru: (pct: number) => `+${pct}% к сумме`,
    uz: (pct: number) => `summaga +${pct}%`,
    pl: (pct: number) => `+${pct}% do kwoty`,
  },
  included: { ru: "включено", uz: "kiritilgan", pl: "w cenie" },
  perUnit: {
    ru: (price: string, unit: string) => `${price} за ${unit}`,
    uz: (price: string, unit: string) => `${unit} uchun ${price}`,
    pl: (price: string, unit: string) => `${price} za ${unit}`,
  },
  onRequest: {
    ru: "по запросу — цену называет менеджер",
    uz: "so‘rov bo‘yicha — narxni menejer aytadi",
    pl: "na zapytanie — cenę podaje menedżer",
  },
  perMonth: {
    ru: (price: string) => `${price}/мес`,
    uz: (price: string) => `${price}/oy`,
    pl: (price: string) => `${price}/mies.`,
  },
  tier: {
    ru: (label: string) => `Пакет «${label}»`,
    uz: (label: string) => `«${label}» paketi`,
    pl: (label: string) => `Pakiet „${label}”`,
  },
  fromPrice: {
    ru: (price: string) => `от ${price}`,
    uz: (price: string) => `${price} dan`,
    pl: (price: string) => `od ${price}`,
  },
  briefTotal: {
    ru: (total: string, from: boolean) =>
      `Итог ${from ? "от " : ""}${total} — клиент собрал его сам на витрине и видел цифру. Ниже нельзя, выше — нечестно.`,
    uz: (total: string, from: boolean) =>
      `Jami ${total}${from ? " dan" : ""} — mijoz uni vitrinada o‘zi yig‘gan va raqamni ko‘rgan. Pastroq mumkin emas, yuqoriroq — insofsizlik.`,
    pl: (total: string, from: boolean) =>
      `Razem ${from ? "od " : ""}${total} — klient sam złożył to w witrynie i widział kwotę. Niżej nie można, wyżej byłoby nieuczciwie.`,
  },
  briefWeeks: {
    ru: "Срок называем после созвона: в брифе его нет.",
    uz: "Muddatni qo‘ng‘iroqdan keyin aytamiz: brifda u yo‘q.",
    pl: "Termin podajemy po rozmowie: w briefie go nie ma.",
  },
  briefOnRequest: {
    ru: "Есть позиции «по запросу» — их цену считаем по калькулятору, не ниже его порога.",
    uz: "«So‘rov bo‘yicha» pozitsiyalar bor — ularning narxini kalkulyator bo‘yicha hisoblaymiz, uning chegarasidan past emas.",
    pl: "Są pozycje „na zapytanie” — ich cenę liczymy według kalkulatora, nie niżej niż jego próg.",
  },
});
