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

  // «Как это работает — коротко»: схема для команды, со всеми процентами
  // (владелец, 05.11.2026: «на дашборде пишем все»).
  howTitle: { ru: "Как это работает — коротко", uz: "Qanday ishlaydi — qisqacha", pl: "Jak to działa — w skrócie" },
  flow1: { ru: "Агентство приводит клиента", uz: "Agentlik mijoz olib keladi", pl: "Agencja przyprowadza klienta" },
  flow2: { ru: "Студия делает проект", uz: "Studiya loyihani qiladi", pl: "Studio robi projekt" },
  flow3: { ru: "Клиент оплатил проект целиком", uz: "Mijoz loyihani to‘liq to‘ladi", pl: "Klient zapłacił za projekt w całości" },
  whoGets: { ru: "Кто сколько получает с проекта", uz: "Loyihadan kim qancha oladi", pl: "Kto ile dostaje z projektu" },
  getsAgency: {
    ru: (p: number) => `Агентству — ${p}% с суммы проекта. Всегда, без срока.`,
    uz: (p: number) => `Agentlikka — loyiha summasidan ${p}%. Doim, muddatsiz.`,
    pl: (p: number) => `Agencja — ${p}% od kwoty projektu. Zawsze, bez terminu.`,
  },
  getsFinder: {
    ru: (p: number, months: number) => `Тому из команды, кто привёл агентство, — ${p}% с суммы проекта. ${months} месяцев с того дня, как завёл агентство.`,
    uz: (p: number, months: number) => `Jamoadan agentlikni olib kelganga — loyiha summasidan ${p}%. Agentlik qo‘shilgan kundan ${months} oy.`,
    pl: (p: number, months: number) => `Osoba z zespołu, która przyprowadziła agencję — ${p}% od kwoty projektu. Przez ${months} miesięcy od dnia dodania agencji.`,
  },
  getsOwner: {
    ru: "Тому, кто ведёт проект, — его обычный процент от прибыли, как всегда. Ведёт тот же, кто привёл, — получает и то и другое.",
    uz: "Loyihani olib boruvchiga — odatdagidek foydadan o‘z foizi. Olib kelgan odamning o‘zi olib borsa, ikkalasini ham oladi.",
    pl: "Osoba prowadząca projekt — swój zwykły procent od zysku, jak zawsze. Jeśli prowadzi ta sama osoba, która przyprowadziła, dostaje jedno i drugie.",
  },
  exampleTitle: {
    ru: (amount: string) => `Пример: проект на ${amount}`,
    uz: (amount: string) => `Misol: ${amount} lik loyiha`,
    pl: (amount: string) => `Przykład: projekt za ${amount}`,
  },
  exampleAgency: { ru: "агентству", uz: "agentlikka", pl: "agencja" },
  exampleFinder: { ru: "тому, кто привёл", uz: "olib kelganga", pl: "kto przyprowadził" },
  exampleRest: {
    ru: "остальное — студии, из этого ведущему его процент от прибыли",
    uz: "qolgani — studiyaga, undan olib boruvchiga foydadan o‘z foizi",
    pl: "reszta — dla studia, z tego prowadzący dostaje swój procent od zysku",
  },
  deckTitle: { ru: "Презентация для агентства", uz: "Agentlik uchun taqdimot", pl: "Prezentacja dla agencji" },
  deckAbout: {
    ru: "Страница на сайте на шести языках: 15% агентству, три шага, пример и правила, вверху — кнопка PDF. Наших 5% там нет: это внутреннее, агентству его не показываем. Отправьте ссылку или скачайте PDF и пришлите файл.",
    uz: "Saytdagi olti tildagi sahifa: agentlikka 15%, uch qadam, misol va qoidalar, yuqorida — PDF tugmasi. Bizning 5% u yerda yo‘q: bu ichki ma’lumot, agentlikka ko‘rsatmaymiz. Havolani yuboring yoki PDF ni yuklab olib, faylni yuboring.",
    pl: "Strona na stronie internetowej w sześciu językach: 15% dla agencji, trzy kroki, przykład i zasady, u góry — przycisk PDF. Naszych 5% tam nie ma: to sprawa wewnętrzna, agencji tego nie pokazujemy. Wyślij link albo pobierz PDF i prześlij plik.",
  },
  deckOpen: { ru: "Открыть презентацию", uz: "Taqdimotni ochish", pl: "Otwórz prezentację" },
  deckRow: { ru: "презентация", uz: "taqdimot", pl: "prezentacja" },
});
