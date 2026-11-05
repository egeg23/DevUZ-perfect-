import { defineDict } from "@/lib/admin/i18n";

/**
 * Вкладка «Агентства» (/admin/agencies) — агентства-партнёры студии: 15% с
 * суммы каждого их проекта, тому, кто привёл, — 5% двенадцать месяцев
 * (lib/partners/rules.ts, AGENCY_PERCENT; lib/admin/finance.ts,
 * AGENCY_FINDER_PERCENT). Названия агентств, контакты и имена — данные, не
 * переводятся.
 */
export const agenciesDict = defineDict({
  title: { ru: "Агентства", uz: "Agentliklar", pl: "Agencje" },
  intro: {
    ru: (agency: number, finder: number, months: number) =>
      `Агентство приводит нам заказы своих клиентов и получает ${agency}% с суммы каждого такого проекта, всегда. Кто из команды привёл агентство и завёл его здесь, тому ${finder}% с суммы проектов агентства ${months} месяцев с того дня, как завёл. Обе доли выплачиваются, когда клиент оплатил проект целиком.`,
    uz: (agency: number, finder: number, months: number) =>
      `Agentlik bizga o‘z mijozlarining buyurtmalarini olib keladi va har bir shunday loyiha summasidan doim ${agency}% oladi. Jamoadan kim agentlikni olib kelib, uni shu yerda qo‘shgan bo‘lsa, unga qo‘shilgan kundan boshlab ${months} oy davomida agentlik loyihalari summasidan ${finder}%. Ikkala ulush ham mijoz loyihani to‘liq to‘laganda to‘lanadi.`,
    pl: (agency: number, finder: number, months: number) =>
      `Agencja przyprowadza nam zlecenia swoich klientów i dostaje zawsze ${agency}% od kwoty każdego takiego projektu. Kto z zespołu przyprowadził agencję i dodał ją tutaj, dostaje ${finder}% od kwoty projektów agencji przez ${months} miesięcy od dnia dodania. Obie części są wypłacane, gdy klient zapłacił za projekt w całości.`,
  },
  helpTerms: {
    ru: "Как считаются 15% и 5%",
    uz: "15% va 5% qanday hisoblanadi",
    pl: "Jak liczone są 15% i 5%",
  },
  addTitle: { ru: "Завести агентство", uz: "Agentlik qo‘shish", pl: "Dodaj agencję" },
  addAboutManager: {
    ru: "Привели агентство вы: 5% с суммы его проектов пойдут вам. Контакт обязателен: по нему панель узнаёт заявки агентства с сайта и из бота.",
    uz: "Agentlikni siz olib keldingiz: uning loyihalari summasidan 5% sizga tushadi. Kontakt majburiy: panel agentlikning saytdan va botdan kelgan arizalarini shu orqali taniydi.",
    pl: "To Ty przyprowadziłeś agencję: 5% od kwoty jej projektów trafi do Ciebie. Kontakt jest obowiązkowy: po nim panel rozpoznaje zgłoszenia agencji ze strony i z bota.",
  },
  addAboutDesk: {
    ru: "Выберите, кто привёл агентство: ему пойдут 5% с суммы его проектов. «Никто» — агентство пришло само. Контакт обязателен: по нему панель узнаёт заявки агентства с сайта и из бота.",
    uz: "Agentlikni kim olib kelganini tanlang: uning loyihalari summasidan 5% unga tushadi. «Hech kim» — agentlik o‘zi kelgan. Kontakt majburiy: panel agentlikning saytdan va botdan kelgan arizalarini shu orqali taniydi.",
    pl: "Wybierz, kto przyprowadził agencję: dostanie 5% od kwoty jej projektów. «Nikt» — agencja przyszła sama. Kontakt jest obowiązkowy: po nim panel rozpoznaje zgłoszenia agencji ze strony i z bota.",
  },
  name: { ru: "Название агентства", uz: "Agentlik nomi", pl: "Nazwa agencji" },
  contact: {
    ru: "Как пишет нам: @telegram, телефон или почта",
    uz: "Bizga qanday yozadi: @telegram, telefon yoki pochta",
    pl: "Jak do nas pisze: @telegram, telefon lub e-mail",
  },
  website: { ru: "Сайт", uz: "Sayt", pl: "Strona" },
  note: { ru: "Заметка", uz: "Izoh", pl: "Notatka" },
  optional: { ru: "по желанию", uz: "ixtiyoriy", pl: "opcjonalnie" },
  broughtBy: { ru: "Кто привёл", uz: "Kim olib kelgan", pl: "Kto przyprowadził" },
  nobody: { ru: "Никто, пришло само", uz: "Hech kim, o‘zi kelgan", pl: "Nikt, przyszła sama" },
  add: { ru: "Завести агентство", uz: "Agentlik qo‘shish", pl: "Dodaj agencję" },
  adding: { ru: "Завожу…", uz: "Qo‘shyapman…", pl: "Dodaję…" },
  listAll: { ru: "Все агентства", uz: "Barcha agentliklar", pl: "Wszystkie agencje" },
  listMine: { ru: "Мои агентства", uz: "Mening agentliklarim", pl: "Moje agencje" },
  emptyAll: { ru: "Агентств пока нет.", uz: "Hozircha agentliklar yo‘q.", pl: "Na razie nie ma agencji." },
  emptyMine: {
    ru: "Вы ещё не завели ни одного агентства.",
    uz: "Siz hali birorta agentlik qo‘shmadingiz.",
    pl: "Nie dodano jeszcze żadnej agencji.",
  },
  colAgency: { ru: "Агентство", uz: "Agentlik", pl: "Agencja" },
  colBrought: { ru: "Кто привёл", uz: "Kim olib kelgan", pl: "Kto przyprowadził" },
  colUntil: { ru: "5% до", uz: "5% gacha", pl: "5% do" },
  colProjects: { ru: "Проекты", uz: "Loyihalar", pl: "Projekty" },
  colTurnover: { ru: "Сумма проектов", uz: "Loyihalar summasi", pl: "Kwota projektów" },
  colFinder: { ru: "5% за агентство", uz: "Agentlik uchun 5%", pl: "5% za agencję" },
  colAgencyShare: { ru: "Агентству 15%", uz: "Agentlikka 15%", pl: "Dla agencji 15%" },
  link: { ru: "ссылка для агентства", uz: "agentlik uchun havola", pl: "link dla agencji" },
  blocked: { ru: "заблокировано", uz: "bloklangan", pl: "zablokowana" },
  since: {
    ru: (day: string) => `заведено ${day}`,
    uz: (day: string) => `${day} qo‘shilgan`,
    pl: (day: string) => `dodana ${day}`,
  },
  until: {
    ru: (day: string) => `до ${day}`,
    uz: (day: string) => `${day} gacha`,
    pl: (day: string) => `do ${day}`,
  },
  expired: {
    ru: (day: string) => `срок вышел ${day}`,
    uz: (day: string) => `muddat ${day} tugagan`,
    pl: (day: string) => `termin minął ${day}`,
  },
  inTerm: {
    ru: (n: number) => `в сроке: ${n}`,
    uz: (n: number) => `muddat ichida: ${n}`,
    pl: (n: number) => `w terminie: ${n}`,
  },
  earned: {
    ru: (sum: string) => `${sum} заработано`,
    uz: (sum: string) => `${sum} ishlab topilgan`,
    pl: (sum: string) => `${sum} zarobione`,
  },
  frozen: {
    ru: (sum: string) => `${sum} заморожено`,
    uz: (sum: string) => `${sum} muzlatilgan`,
    pl: (sum: string) => `${sum} zamrożone`,
  },
  save: { ru: "сохранить", uz: "saqlash", pl: "zapisz" },
  resultCreated: {
    ru: "Агентство заведено. Отправьте агентству его ссылку из таблицы, а заявки с его контакта панель узнает сама.",
    uz: "Agentlik qo‘shildi. Agentlikka jadvaldagi havolasini yuboring, uning kontaktidan kelgan arizalarni panel o‘zi taniydi.",
    pl: "Agencja dodana. Wyślij agencji jej link z tabeli, a zgłoszenia z jej kontaktu panel rozpozna sam.",
  },
  resultOk: { ru: "Сохранено.", uz: "Saqlandi.", pl: "Zapisano." },
  resultInvalid: {
    ru: "Нужны название (от двух знаков) и контакт: @telegram, телефон или почта.",
    uz: "Nom (kamida ikki belgi) va kontakt kerak: @telegram, telefon yoki pochta.",
    pl: "Potrzebne są nazwa (co najmniej dwa znaki) i kontakt: @telegram, telefon lub e-mail.",
  },
  resultDuplicate: {
    ru: "Это агентство уже заведено: тот же контакт или название. Если это ошибка, напишите владельцу.",
    uz: "Bu agentlik allaqachon qo‘shilgan: kontakt yoki nom bir xil. Agar bu xato bo‘lsa, egasiga yozing.",
    pl: "Ta agencja jest już dodana: ten sam kontakt lub nazwa. Jeśli to pomyłka, napisz do właściciela.",
  },
  resultStaff: {
    ru: "Такого сотрудника нет среди действующих.",
    uz: "Bunday xodim faol xodimlar orasida yo‘q.",
    pl: "Nie ma takiego pracownika wśród aktywnych.",
  },
  resultForbidden: {
    ru: "Кто привёл, меняет только владелец.",
    uz: "Kim olib kelganini faqat ega o‘zgartiradi.",
    pl: "Kto przyprowadził, zmienia tylko właściciel.",
  },
  resultGone: { ru: "Агентство не нашлось.", uz: "Agentlik topilmadi.", pl: "Nie znaleziono agencji." },
  resultOffline: {
    ru: "База не ответила. Попробуйте через минуту.",
    uz: "Baza javob bermadi. Bir daqiqadan keyin urinib ko‘ring.",
    pl: "Baza nie odpowiedziała. Spróbuj za minutę.",
  },
  resultFailed: {
    ru: "Не вышло сохранить. Попробуйте ещё раз.",
    uz: "Saqlab bo‘lmadi. Yana urinib ko‘ring.",
    pl: "Nie udało się zapisać. Spróbuj jeszcze raz.",
  },
  partnerBadge: { ru: "агентство · 15%", uz: "agentlik · 15%", pl: "agencja · 15%" },
});
