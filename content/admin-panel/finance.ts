import { defineDict, plural } from "@/lib/admin/i18n";

/**
 * Раздел «Финансы» (/admin/finance): итоги, по людям, по проектам, выплаты,
 * доли соучредителей, расходы студии.
 *
 * Термины — по content/admin-panel/GLOSSARY.md: начисление — hisoblanma /
 * naliczenie, к выплате — to‘lanadi / do wypłaty, заморожено — muzlatilgan /
 * zamrożone, себестоимость — tannarx / koszt wytworzenia, чистая прибыль —
 * sof foyda / zysk netto, соучредитель — hammuassis / współzałożyciel.
 *
 * Подписи грейда, вида сделки, состояния начисления и категорий расходов —
 * Tr-таблицы в lib/admin/finance.ts (GRADE_TR, KIND_TR, ACCRUAL_TR,
 * EXPENSE_TR): ими пользуются и «Проекты», и «Расходы».
 */
export const financeDict = defineDict({
  title: { ru: "Финансы", uz: "Moliya", pl: "Finanse" },
  introAdmin: {
    ru: "По всей студии. Начисления считаются от чистой прибыли проекта и лежат в заморозке, пока клиент не заплатил целиком.",
    uz: "Butun studiya bo‘yicha. Hisoblanmalar loyihaning sof foydasidan hisoblanadi va mijoz to‘liq to‘lamaguncha muzlatilgan holda turadi.",
    pl: "Dla całego studia. Naliczenia liczą się od zysku netto projektu i są zamrożone, dopóki klient nie zapłaci całości.",
  },
  introHead: {
    ru: "Вы и ваша команда. Начисления считаются от чистой прибыли проекта и лежат в заморозке, пока клиент не заплатил целиком.",
    uz: "Siz va jamoangiz. Hisoblanmalar loyihaning sof foydasidan hisoblanadi va mijoz to‘liq to‘lamaguncha muzlatilgan holda turadi.",
    pl: "Ty i Twój zespół. Naliczenia liczą się od zysku netto projektu i są zamrożone, dopóki klient nie zapłaci całości.",
  },
  introManager: {
    ru: "Ваши проекты и ваш баланс. Начисление считается от чистой прибыли проекта и лежит в заморозке, пока клиент не заплатил целиком.",
    uz: "Loyihalaringiz va balansingiz. Hisoblanma loyihaning sof foydasidan hisoblanadi va mijoz to‘liq to‘lamaguncha muzlatilgan holda turadi.",
    pl: "Twoje projekty i Twoje saldo. Naliczenie liczy się od zysku netto projektu i jest zamrożone, dopóki klient nie zapłaci całości.",
  },
  helpHow: { ru: "Как считается процент", uz: "Foiz qanday hisoblanadi", pl: "Jak liczy się procent" },
  helpFreeze: { ru: "Почему заморожено", uz: "Nega muzlatilgan", pl: "Dlaczego zamrożone" },

  // Ответы действий — `?r=` в адресе, коды из app/admin/finance/actions.ts.
  r_ok: { ru: "Готово.", uz: "Tayyor.", pl: "Gotowe." },
  r_forbidden: {
    ru: "Выплаты записывает только владелец.",
    uz: "To‘lovlarni faqat egasi yozadi.",
    pl: "Wypłaty zapisuje tylko właściciel.",
  },
  r_invalid: {
    ru: "Сумма или дата не разобрались: сумма — целые доллары, дата — как в календаре. Себе выплату не записать.",
    uz: "Summa yoki sana tushunarsiz: summa — butun dollarlarda, sana — kalendardagidek. O‘zingizga to‘lov yozib bo‘lmaydi.",
    pl: "Nie udało się odczytać kwoty lub daty: kwota — w pełnych dolarach, data — jak w kalendarzu. Wypłaty dla siebie zapisać nie można.",
  },
  r_gone: { ru: "Такой записи уже нет.", uz: "Bunday yozuv endi yo‘q.", pl: "Takiego wpisu już nie ma." },
  r_failed: {
    ru: "Не получилось записать. Попробуйте ещё раз.",
    uz: "Yozib bo‘lmadi. Yana bir bor urinib ko‘ring.",
    pl: "Nie udało się zapisać. Spróbuj jeszcze raz.",
  },
  r_offline: { ru: "База недоступна.", uz: "Baza mavjud emas.", pl: "Baza jest niedostępna." },
  offline: {
    ru: "База недоступна — показать нечего.",
    uz: "Baza mavjud emas — ko‘rsatadigan narsa yo‘q.",
    pl: "Baza jest niedostępna — nie ma czego pokazać.",
  },

  // Итоги владельца.
  cardContracted: { ru: "По договорам", uz: "Shartnomalar bo‘yicha", pl: "Z umów" },
  cardContractedNote: {
    ru: (n: number) => `${n} ${plural("ru", n, "проект", "проекта", "проектов")} с деньгами`,
    uz: (n: number) => `pulli loyihalar: ${n} ta`,
    pl: (n: number) => `${n} ${plural("pl", n, "projekt", "projekty", "projektów")} z kwotą`,
  },
  cardPaid: { ru: "Оплачено клиентами", uz: "Mijozlar to‘lagan", pl: "Zapłacone przez klientów" },
  cardProfit: { ru: "Чистая прибыль", uz: "Sof foyda", pl: "Zysk netto" },
  cardProfitNoCost: {
    ru: (n: number) => `у ${n} без себестоимости`,
    uz: (n: number) => `${n} tasida tannarx yo‘q`,
    pl: (n: number) => `${n} bez kosztu wytworzenia`,
  },
  cardProfitFormula: {
    ru: "сумма − налог − себестоимость",
    uz: "summa − soliq − tannarx",
    pl: "kwota − podatek − koszt wytworzenia",
  },
  cardAccrued: { ru: "Начислено команде и партнёрам", uz: "Jamoa va hamkorlarga hisoblangan", pl: "Naliczone zespołowi i partnerom" },
  cardAccruedNote: {
    ru: (partners: string, frozen: string) => `партнёрам ${partners} · заморожено ${frozen}`,
    uz: (partners: string, frozen: string) => `hamkorlarga ${partners} · muzlatilgan ${frozen}`,
    pl: (partners: string, frozen: string) => `partnerom ${partners} · zamrożone ${frozen}`,
  },
  cardOwner: { ru: "Остаётся владельцу", uz: "Egasiga qoladi", pl: "Zostaje właścicielowi" },
  cardOwnerNote: {
    ru: (paidOut: string) => `после налога, себестоимости и всех процентов · выплачено команде ${paidOut}`,
    uz: (paidOut: string) => `soliq, tannarx va barcha foizlardan keyin · jamoaga to‘langan ${paidOut}`,
    pl: (paidOut: string) => `po podatku, koszcie wytworzenia i wszystkich procentach · wypłacono zespołowi ${paidOut}`,
  },

  // Итоги менеджера и руководителя.
  cardEarned: { ru: "Заработано", uz: "Ishlab topilgan", pl: "Zarobione" },
  cardEarnedNote: {
    ru: "по оплаченным целиком проектам",
    uz: "to‘liq to‘langan loyihalar bo‘yicha",
    pl: "z projektów opłaconych w całości",
  },
  cardFrozen: { ru: "Заморожено", uz: "Muzlatilgan", pl: "Zamrożone" },
  cardFrozenNote: {
    ru: "ждёт полной оплаты клиентом",
    uz: "mijozning to‘liq to‘lovini kutmoqda",
    pl: "czeka na pełną płatność klienta",
  },
  cardPaidOut: { ru: "Выплачено", uz: "To‘langan", pl: "Wypłacone" },
  cardDue: { ru: "К выплате", uz: "To‘lanadi", pl: "Do wypłaty" },
  cardDueAhead: { ru: "выплачено вперёд", uz: "oldindan to‘langan", pl: "wypłacone z góry" },

  // По людям.
  colWho: { ru: "Кто", uz: "Kim", pl: "Kto" },
  colGrade: { ru: "Грейд", uz: "Daraja", pl: "Poziom" },
  colProjects: { ru: "Проектов", uz: "Loyihalar", pl: "Projektów" },
  colFrozen: { ru: "Заморожено", uz: "Muzlatilgan", pl: "Zamrożone" },
  colEarned: { ru: "Заработано", uz: "Ishlab topilgan", pl: "Zarobione" },
  colPaidOut: { ru: "Выплачено", uz: "To‘langan", pl: "Wypłacone" },
  colDue: { ru: "К выплате", uz: "To‘lanadi", pl: "Do wypłaty" },
  disabled: { ru: "отключён", uz: "o‘chirilgan", pl: "wyłączony" },
  peopleEmpty: {
    ru: "Пока никого: начисления появятся, когда у проекта будет сумма и ответственный.",
    uz: "Hozircha hech kim yo‘q: loyihada summa va mas’ul paydo bo‘lganda hisoblanmalar chiqadi.",
    pl: "Na razie nikogo: naliczenia pojawią się, gdy projekt będzie miał kwotę i osobę odpowiedzialną.",
  },

  // По проектам.
  byProjects: { ru: "По проектам", uz: "Loyihalar bo‘yicha", pl: "Według projektów" },
  colProject: { ru: "Проект", uz: "Loyiha", pl: "Projekt" },
  colOwner: { ru: "Ведёт", uz: "Olib boradi", pl: "Prowadzi" },
  colKind: { ru: "Вид", uz: "Turi", pl: "Rodzaj" },
  colAmount: { ru: "Сумма", uz: "Summa", pl: "Kwota" },
  colPaid: { ru: "Оплачено", uz: "To‘langan", pl: "Zapłacone" },
  colTax: { ru: "Налог", uz: "Soliq", pl: "Podatek" },
  colCost: { ru: "Себестоимость", uz: "Tannarx", pl: "Koszt wytworzenia" },
  colProfit: { ru: "Прибыль", uz: "Foyda", pl: "Zysk" },
  colAccruals: { ru: "Начисления", uz: "Hisoblanmalar", pl: "Naliczenia" },
  colToOwner: { ru: "Владельцу", uz: "Egasiga", pl: "Dla właściciela" },
  noClient: { ru: "клиент не указан", uz: "mijoz ko‘rsatilmagan", pl: "klient nie podany" },
  cancelled: { ru: "отменён", uz: "bekor qilingan", pl: "anulowany" },
  paidFull: { ru: "целиком", uz: "to‘liq", pl: "w całości" },
  paidPart: { ru: "не целиком", uz: "to‘liq emas", pl: "nie w całości" },
  costMissing: { ru: "не вписана", uz: "kiritilmagan", pl: "nie wpisano" },
  manual: { ru: " (вручную)", uz: " (qo‘lda)", pl: " (ręcznie)" },
  partner: { ru: "партнёр", uz: "hamkor", pl: "partner" },
  notCounted: { ru: "не засчитано", uz: "hisobga olinmagan", pl: "nie zaliczono" },
  projectsEmpty: {
    ru: "Проектов в вашем круге пока нет.",
    uz: "Sizning doirangizda hozircha loyihalar yo‘q.",
    pl: "W Twoim zakresie nie ma jeszcze projektów.",
  },

  // Выплаты.
  payouts: { ru: "Выплаты", uz: "To‘lovlar", pl: "Wypłaty" },
  helpPayouts: { ru: "Кто записывает выплаты", uz: "To‘lovlarni kim yozadi", pl: "Kto zapisuje wypłaty" },
  fieldTo: { ru: "Кому", uz: "Kimga", pl: "Komu" },
  choose: { ru: "выбрать", uz: "tanlang", pl: "wybierz" },
  fieldAmount: { ru: "Сумма, $", uz: "Summa, $", pl: "Kwota, $" },
  fieldDate: { ru: "Дата", uz: "Sana", pl: "Data" },
  fieldNote: { ru: "Заметка", uz: "Izoh", pl: "Notatka" },
  notePlaceholder: { ru: "за август", uz: "avgust uchun", pl: "za sierpień" },
  savePayout: { ru: "Записать выплату", uz: "To‘lovni yozish", pl: "Zapisz wypłatę" },
  colWhen: { ru: "Когда", uz: "Qachon", pl: "Kiedy" },
  colTo: { ru: "Кому", uz: "Kimga", pl: "Komu" },
  colNote: { ru: "Заметка", uz: "Izoh", pl: "Notatka" },
  remove: { ru: "удалить", uz: "o‘chirish", pl: "usuń" },
  payoutsEmpty: { ru: "Выплат пока не было.", uz: "Hozircha to‘lovlar bo‘lmagan.", pl: "Na razie nie było wypłat." },

  // Доли соучредителей.
  founders: { ru: "Доли соучредителей", uz: "Hammuassislar ulushlari", pl: "Udziały współzałożycieli" },
  foundersNote: {
    ru: "Делится то, что уже пришло, за вычетом расходов. Незакрытые сделки показаны отдельно и в делёж не идут: выплатить долю по сделке, которая ещё сорвётся, дороже, чем подождать.",
    uz: "Allaqachon kelgan pul xarajatlar ayirilgandan keyin bo‘linadi. Yopilmagan bitimlar alohida ko‘rsatiladi va bo‘linishga kirmaydi: hali buzilishi mumkin bo‘lgan bitim bo‘yicha ulush to‘lash kutishdan qimmatroq.",
    pl: "Dzieli się to, co już wpłynęło, po odjęciu wydatków. Niezamknięte transakcje są pokazane osobno i nie wchodzą do podziału: wypłata udziału z transakcji, która może jeszcze upaść, kosztuje więcej niż czekanie.",
  },
  poolEarned: { ru: "Пришло студии", uz: "Studiyaga kelgan", pl: "Wpłynęło do studia" },
  poolEarnedNote: {
    ru: "после начислений команде",
    uz: "jamoaga hisoblanmalardan keyin",
    pl: "po naliczeniach dla zespołu",
  },
  poolFrozen: { ru: "Ещё не оплачено", uz: "Hali to‘lanmagan", pl: "Jeszcze nieopłacone" },
  poolFrozenNote: {
    ru: "клиент не заплатил целиком",
    uz: "mijoz to‘liq to‘lamagan",
    pl: "klient nie zapłacił całości",
  },
  poolExpenses: { ru: "Расходы", uz: "Xarajatlar", pl: "Wydatki" },
  poolExpensesNote: {
    ru: "реклама, сервисы, подрядчики",
    uz: "reklama, servislar, pudratchilar",
    pl: "reklama, usługi, podwykonawcy",
  },
  poolShare: { ru: "К делению", uz: "Bo‘linadi", pl: "Do podziału" },
  poolShareNote: {
    ru: "пришло минус расходы",
    uz: "kelgan minus xarajatlar",
    pl: "wpływy minus wydatki",
  },

  // Расходы студии.
  expenses: { ru: "Расходы студии", uz: "Studiya xarajatlari", pl: "Wydatki studia" },
  expensesNote: {
    ru: "Только общие: реклама, сервисы, подрядчики. Себестоимость конкретного проекта вписывается в сам проект — здесь она вычлась бы второй раз.",
    uz: "Faqat umumiylari: reklama, servislar, pudratchilar. Aniq loyihaning tannarxi loyihaning o‘ziga yoziladi — bu yerda u ikkinchi marta ayirilib qolardi.",
    pl: "Tylko ogólne: reklama, usługi, podwykonawcy. Koszt wytworzenia konkretnego projektu wpisuje się w sam projekt — tutaj zostałby odjęty drugi raz.",
  },
  fieldWhat: { ru: "На что", uz: "Nimaga", pl: "Na co" },
  fieldComment: { ru: "Комментарий", uz: "Izoh", pl: "Komentarz" },
  commentPlaceholder: {
    ru: "Instagram, кампания по стоматологиям",
    uz: "Instagram, stomatologiyalar bo‘yicha kampaniya",
    pl: "Instagram, kampania dla gabinetów stomatologicznych",
  },
  saveExpense: { ru: "Записать", uz: "Yozish", pl: "Zapisz" },
  colWhat: { ru: "На что", uz: "Nimaga", pl: "Na co" },
  colHowMuch: { ru: "Сколько", uz: "Qancha", pl: "Ile" },
  colComment: { ru: "Комментарий", uz: "Izoh", pl: "Komentarz" },
  expensesEmpty: {
    ru: "Расходов пока не записано. Пока их нет, доля соучредителя считается от валовой прибыли и выходит завышенной.",
    uz: "Hozircha xarajatlar yozilmagan. Ular yo‘q ekan, hammuassis ulushi yalpi foydadan hisoblanadi va oshirib ko‘rsatiladi.",
    pl: "Nie zapisano jeszcze wydatków. Dopóki ich nie ma, udział współzałożyciela liczy się od zysku brutto i wychodzi zawyżony.",
  },

  // Подвал: ставки и заморозка.
  ratesTitle: { ru: "Ставки.", uz: "Stavkalar.", pl: "Stawki." },
  rates: {
    ru: "Менеджер — 15 % с нового клиента и 5 % с допродажи; начинающий — 10 %, допродажи не начисляются; руководитель — 30 % со своего клиента и 5 % с каждой сделки своих менеджеров. Считается от чистой прибыли: сумма по договору минус налог минус себестоимость разработки. Соучредителю 5 % с команды не идут: он получает долю от всего, что осталось после расходов, и процент со сделки сверх этого был бы теми же деньгами дважды.",
    uz: "Menejer — yangi mijozdan 15 % va qo‘shimcha sotuvdan 5 %; boshlovchi — 10 %, qo‘shimcha sotuvlar hisoblanmaydi; rahbar — o‘z mijozidan 30 % va o‘z menejerlarining har bir bitimidan 5 %. Sof foydadan hisoblanadi: shartnoma summasi minus soliq minus ishlab chiqish tannarxi. Hammuassisga jamoadan 5 % berilmaydi: u xarajatlardan keyin qolgan hamma narsadan ulush oladi, bitimdan qo‘shimcha foiz esa o‘sha pulni ikki marta olish bo‘lardi.",
    pl: "Menedżer — 15 % od nowego klienta i 5 % od dosprzedaży; początkujący — 10 %, dosprzedaże nie są naliczane; kierownik — 30 % od własnego klienta i 5 % od każdej transakcji swoich menedżerów. Liczy się od zysku netto: kwota z umowy minus podatek minus koszt wytworzenia. Współzałożyciel nie dostaje 5 % od zespołu: otrzymuje udział we wszystkim, co zostaje po wydatkach, a procent od transakcji ponad to byłby tymi samymi pieniędzmi dwa razy.",
  },
  freezeTitle: { ru: "Заморозка.", uz: "Muzlatish.", pl: "Zamrożenie." },
  freeze: {
    ru: "Пока клиент не заплатил целиком, начисление видно, но к выплате не идёт. Себестоимость и платежи вписывает владелец после подписания договора — до этого прибыль по проекту считается без неё, и в таблице это помечено.",
    uz: "Mijoz to‘liq to‘lamaguncha hisoblanma ko‘rinadi, lekin to‘lovga o‘tmaydi. Tannarx va to‘lovlarni shartnoma imzolangandan keyin egasi kiritadi — ungacha loyiha foydasi tannarxsiz hisoblanadi va jadvalda bu belgilanadi.",
    pl: "Dopóki klient nie zapłaci całości, naliczenie jest widoczne, ale nie trafia do wypłaty. Koszt wytworzenia i płatności wpisuje właściciel po podpisaniu umowy — do tego czasu zysk z projektu liczy się bez niego, co jest oznaczone w tabeli.",
  },
});
