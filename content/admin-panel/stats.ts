import { defineDict, plural } from "@/lib/admin/i18n";

/**
 * Раздел «Статистика» (/admin/stats).
 *
 * Статусы лидов — statusFilterDict из home.ts, каналы — leadChannelDict из
 * lead-origin.ts: подписи те же, что в списке и на карточке лида.
 */
export const statsDict = defineDict({
  title: { ru: "Статистика", uz: "Statistika", pl: "Statystyki" },
  offline: {
    ru: "База недоступна — это не «лидов нет», а «панель сейчас ничего не видит».",
    uz: "Baza ishlamayapti — bu «lidlar yo‘q» degani emas, «panel hozir hech narsani ko‘rmayapti» degani.",
    pl: "Baza danych jest niedostępna — to nie znaczy «brak leadów», tylko «panel teraz nic nie widzi».",
  },
  truncated: {
    ru: (limit: number) => `В расчёт вошли последние ${limit} лидов — это предел выборки, и числа ниже неполные.`,
    uz: (limit: number) => `Hisobga oxirgi ${limit} ta lid kirdi — bu tanlovning chegarasi, quyidagi raqamlar to‘liq emas.`,
    pl: (limit: number) =>
      `Do obliczeń weszło ostatnich ${limit} ${plural("pl", limit, "lead", "leady", "leadów")} — to limit próby, więc liczby poniżej są niepełne.`,
  },

  // Плитки
  tileTotal: { ru: "всего лидов", uz: "jami lidlar", pl: "leadów łącznie" },
  tileTaken: { ru: "взято в работу", uz: "ishga olingan", pl: "przyjęte do pracy" },
  tileWinRate: { ru: "доля выигранных", uz: "yutilganlar ulushi", pl: "odsetek wygranych" },
  tileWinRateHint: {
    ru: "Считается от закрытых сделок, а не от всех лидов: то, что ещё в работе, не проиграно.",
    uz: "Barcha lidlardan emas, yopilgan bitimlardan hisoblanadi: hali ishda bo‘lgani yutqazilmagan.",
    pl: "Liczone od zamkniętych transakcji, a nie od wszystkich leadów: to, co jest jeszcze w toku, nie jest przegrane.",
  },
  tileMedian: { ru: "медиана до взятия", uz: "olishgacha mediana", pl: "mediana do przejęcia" },
  tileMedianSlow: {
    ru: (n: number) => `Дольше часа разобрали ${n} — за это время лид успевает написать в другое место.`,
    uz: (n: number) => `${n} tasi bir soatdan ko‘proq vaqtda olindi — bu vaqt ichida lid boshqa joyga yozib ulguradi.`,
    pl: (n: number) => `Dłużej niż godzinę czekało ${n} — w tym czasie lead zdąży napisać gdzie indziej.`,
  },
  tileMedianHint: {
    ru: "Медиана, а не среднее: один забытый лид сдвинул бы среднее так, что оно перестало бы описывать обычный день.",
    uz: "O‘rtacha emas, mediana: bitta unutilgan lid o‘rtachani shunchalik siljitardiki, u oddiy kunni tasvirlamay qo‘yardi.",
    pl: "Mediana, a nie średnia: jeden zapomniany lead przesunąłby średnią tak, że przestałaby opisywać zwykły dzień.",
  },

  // Время: «14 мин», «3 ч 20 мин», «2 дн»
  minutes: { ru: (n: number) => `${n} мин`, uz: (n: number) => `${n} daq`, pl: (n: number) => `${n} min` },
  hours: { ru: (n: number) => `${n} ч`, uz: (n: number) => `${n} soat`, pl: (n: number) => `${n} godz.` },
  hoursMinutes: {
    ru: (h: number, m: number) => `${h} ч ${m} мин`,
    uz: (h: number, m: number) => `${h} soat ${m} daq`,
    pl: (h: number, m: number) => `${h} godz. ${m} min`,
  },
  days: {
    ru: (n: number) => `${n} дн`,
    uz: (n: number) => `${n} kun`,
    pl: (n: number) => `${n} ${plural("pl", n, "dzień", "dni", "dni")}`,
  },

  // Блоки
  weekly: { ru: "Приходит по неделям", uz: "Haftalar bo‘yicha kelishi", pl: "Napływ w tygodniach" },
  weeklyNote: { ru: "Неделя считается от понедельника.", uz: "Hafta dushanbadan hisoblanadi.", pl: "Tydzień liczony od poniedziałku." },
  grade: { ru: "Качество лидов", uz: "Lidlar sifati", pl: "Jakość leadów" },
  gradeNote: {
    ru: (avg: number) =>
      `Средний балл — ${avg} из 100. Цвет закреплён за грейдом, но читать его необязательно: рядом стоит буква.`,
    uz: (avg: number) =>
      `O‘rtacha ball — 100 dan ${avg}. Rang baho harfiga biriktirilgan, lekin uni o‘qish shart emas: yonida harf turibdi.`,
    pl: (avg: number) =>
      `Średnia ocena — ${avg} na 100. Kolor jest przypisany do klasy, ale nie trzeba go odczytywać: obok stoi litera.`,
  },
  statuses: { ru: "Статусы", uz: "Holatlar", pl: "Statusy" },
  sources: { ru: "Откуда приходят", uz: "Qayerdan keladi", pl: "Skąd przychodzą" },
  locales: { ru: "Язык обращения", uz: "Murojaat tili", pl: "Język zgłoszenia" },
  services: { ru: "Что спрашивают", uz: "Nima so‘rashadi", pl: "O co pytają" },
  servicesNote: {
    ru: "Один лид может попасть сразу в несколько строк, поэтому сумма больше числа лидов.",
    uz: "Bitta lid bir vaqtning o‘zida bir nechta qatorga tushishi mumkin, shuning uchun yig‘indi lidlar sonidan katta.",
    pl: "Jeden lead może trafić do kilku wierszy naraz, dlatego suma jest większa niż liczba leadów.",
  },
  servicesEmpty: { ru: "Услуги пока не проставлялись.", uz: "Xizmatlar hali belgilanmagan.", pl: "Usługi nie były jeszcze oznaczane." },
  discount: { ru: "Скидка 30%", uz: "30% chegirma", pl: "Rabat 30%" },
  discountNote: {
    ru: "Каждая такая скидка — тридцать процентов от чека. Это про маржу, а не про статистику.",
    uz: "Har bir bunday chegirma — chekning o‘ttiz foizi. Bu statistika haqida emas, marja haqida.",
    pl: "Każdy taki rabat to trzydzieści procent rachunku. To kwestia marży, a nie statystyki.",
  },
  discountShare: {
    ru: (pct: number) => `${pct}% от всех обращений`,
    uz: (pct: number) => `barcha murojaatlarning ${pct}%`,
    pl: (pct: number) => `${pct}% wszystkich zgłoszeń`,
  },
  discountNothing: { ru: "пока не с чем сравнивать", uz: "hozircha solishtiradigan narsa yo‘q", pl: "na razie nie ma z czym porównać" },
  discountSplit: {
    ru: (minute: number, guarantee: number) => `первая минута — ${minute}, гарантия 20 секунд — ${guarantee}`,
    uz: (minute: number, guarantee: number) => `birinchi daqiqa — ${minute}, 20 soniya kafolati — ${guarantee}`,
    pl: (minute: number, guarantee: number) => `pierwsza minuta — ${minute}, gwarancja 20 sekund — ${guarantee}`,
  },

  // По людям
  byTeam: { ru: "По моей команде", uz: "Mening jamoam bo‘yicha", pl: "Mój zespół" },
  byManagers: { ru: "По менеджерам", uz: "Menejerlar bo‘yicha", pl: "Według menedżerów" },
  perStaffNote: {
    ru: "Виден руководителю и админу. Публичный рейтинг рядом с именем коллеги меняет поведение раньше, чем результат: лиды начинают брать по лёгкости, а не по важности.",
    uz: "Rahbar va adminga ko‘rinadi. Hamkasb ismi yonidagi ochiq reyting natijadan oldin xulqni o‘zgartiradi: lidlarni muhimligiga qarab emas, osonligiga qarab ola boshlashadi.",
    pl: "Widzi to kierownik i administrator. Publiczny ranking obok nazwiska kolegi zmienia zachowanie szybciej niż wynik: leady zaczyna się brać według łatwości, a nie ważności.",
  },
  colWho: { ru: "Кто", uz: "Kim", pl: "Kto" },
  colActive: { ru: "В работе", uz: "Ishda", pl: "W toku" },
  colWon: { ru: "Выиграл", uz: "Yutdi", pl: "Wygrane" },
  colLost: { ru: "Проиграл", uz: "Yutqazdi", pl: "Przegrane" },
  colTotal: { ru: "Всего", uz: "Jami", pl: "Łącznie" },
  nobody: { ru: "Пока никто ничего не брал.", uz: "Hozircha hech kim hech narsa olmagan.", pl: "Na razie nikt niczego nie przejął." },
});

/** Язык, на котором лид к нам обратился. Ключ — `leads.locale`. */
export const leadLocaleDict = defineDict({
  ru: { ru: "русский", uz: "rus tili", pl: "rosyjski" },
  en: { ru: "английский", uz: "ingliz tili", pl: "angielski" },
  uz: { ru: "узбекский", uz: "o‘zbek tili", pl: "uzbecki" },
  zh: { ru: "китайский", uz: "xitoy tili", pl: "chiński" },
});

/** Каналы, которых нет у карточки лида. */
export const statsSourceDict = defineDict({
  form: { ru: "форма", uz: "forma", pl: "formularz" },
  audit: { ru: "проверка сайта", uz: "sayt tekshiruvi", pl: "audyt strony" },
});
