import { defineDict, plural } from "@/lib/admin/i18n";

/**
 * «Главная» (/admin/hq) — командный центр владельца и руководителя: пульс
 * компании, «Требует внимания», люди.
 *
 * Термины — по content/admin-panel/GLOSSARY.md. Узбекский — латиницей,
 * польский — как в польских CRM. Числа со словами — функциями: склонение
 * по-русски и по-польски своё, по-узбекски слово после числа не меняется.
 */

const ru = (n: number, one: string, few: string, many: string) => `${n} ${plural("ru", n, one, few, many)}`;
const pl = (n: number, one: string, few: string, many: string) => `${n} ${plural("pl", n, one, few, many)}`;

export const hqDict = defineDict({
  title: { ru: "Главная", uz: "Bosh sahifa", pl: "Pulpit" },
  hello: {
    ru: (name: string) => `Здравствуйте, ${name}`,
    uz: (name: string) => `Assalomu alaykum, ${name}`,
    pl: (name: string) => `Dzień dobry, ${name}`,
  },
  lead: {
    ru: "Пульс компании за сегодня и за 7 дней. Каждое число открывает то, что за ним стоит.",
    uz: "Kompaniyaning bugungi va 7 kunlik holati. Har bir raqam bosilsa, uning tafsilotlari ochiladi.",
    pl: "Puls firmy: dziś i ostatnie 7 dni. Każda liczba otwiera szczegóły.",
  },
  updated: {
    ru: (at: string) => `обновлено в ${at}`,
    uz: (at: string) => `${at} da yangilandi`,
    pl: (at: string) => `odświeżono o ${at}`,
  },
  offline: {
    ru: "База не отвечает — числа на экране неполные. Обновите страницу через минуту.",
    uz: "Baza javob bermayapti — ekrandagi raqamlar to‘liq emas. Bir daqiqadan keyin sahifani yangilang.",
    pl: "Baza nie odpowiada — liczby na ekranie są niepełne. Odśwież stronę za minutę.",
  },

  // Сравнение с прошлым периодом.
  vsPrev: {
    ru: (d: string) => `${d} к прошлым 7 дням`,
    uz: (d: string) => `oldingi 7 kunga nisbatan ${d}`,
    pl: (d: string) => `${d} wobec poprzednich 7 dni`,
  },
  same: { ru: "как в прошлые 7 дней", uz: "oldingi 7 kundagidek", pl: "tak jak w poprzednich 7 dniach" },
  today: { ru: "сегодня", uz: "bugun", pl: "dziś" },
  week: { ru: "за 7 дней", uz: "7 kunda", pl: "w 7 dni" },

  // Лиды.
  leadsTitle: { ru: "Лиды", uz: "Lidlar", pl: "Leady" },
  leadsInWork: { ru: "в работе", uz: "ishda", pl: "w toku" },
  leadsNewToday: { ru: "новых сегодня", uz: "bugun yangi", pl: "nowe dziś" },
  leadsNew7: { ru: "новых за 7 дней", uz: "7 kunda yangi", pl: "nowe w 7 dni" },
  leadsOffered: { ru: "тёплые: предлагаются сейчас", uz: "issiq: hozir taklif qilinmoqda", pl: "ciepłe: oferowane teraz" },
  leadsUnowned: { ru: "тёплые без хозяина", uz: "egasiz issiq lidlar", pl: "ciepłe bez opiekuna" },
  leadsWon: { ru: "выиграли за 7 дней", uz: "7 kunda yutildi", pl: "wygrane w 7 dni" },
  leadsLost: { ru: "проиграли за 7 дней", uz: "7 kunda yutqazildi", pl: "przegrane w 7 dni" },

  // Касания.
  touchesTitle: { ru: "Касания", uz: "Aloqalar", pl: "Kontakty" },
  touchesOf: {
    ru: (norm: number) => `из ${norm} по норме дня`,
    uz: (norm: number) => `kunlik me’yor ${norm} dan`,
    pl: (norm: number) => `z ${norm} wg normy dnia`,
  },
  touchesNoNorm: { ru: "нормы на сегодня нет", uz: "bugun me’yor yo‘q", pl: "brak normy na dziś" },
  touchesPortion: {
    ru: (done: number, target: number) => `порции людей: ${done} из ${target}`,
    uz: (done: number, target: number) => `xodimlar porsiyasi: ${target} dan ${done}`,
    pl: (done: number, target: number) => `porcje ludzi: ${done} z ${target}`,
  },
  touchesAutopilot: {
    ru: (sent: number, target: number) => `автопрогон: ${sent} из ${target}`,
    uz: (sent: number, target: number) => `avtoyurish: ${target} dan ${sent}`,
    pl: (sent: number, target: number) => `autopilot: ${sent} z ${target}`,
  },
  touchesAutopilotOff: { ru: "автопрогон выключен", uz: "avtoyurish o‘chirilgan", pl: "autopilot wyłączony" },
  touchesReplies: { ru: "ответили сегодня", uz: "bugun javob berdi", pl: "odpowiedzi dziś" },
  touches7: { ru: "касаний за 7 дней", uz: "7 kunda aloqalar", pl: "kontakty w 7 dni" },
  replies7: { ru: "ответов за 7 дней", uz: "7 kunda javoblar", pl: "odpowiedzi w 7 dni" },

  // Макеты.
  mockupsTitle: { ru: "Макеты", uz: "Maketlar", pl: "Makiety" },
  mockupsWaiting: { ru: "у клиента, ждём ответа", uz: "mijozda, javob kutilmoqda", pl: "u klienta, czekamy na odpowiedź" },
  mockupsSent7: { ru: "отправлено за 7 дней", uz: "7 kunda yuborildi", pl: "wysłane w 7 dni" },
  mockupsApproved7: { ru: "утверждено за 7 дней", uz: "7 kunda tasdiqlandi", pl: "zatwierdzone w 7 dni" },
  mockupsSoonest: {
    ru: (client: string, left: string) => `ближе всех к концу акции: ${client} — ${left}`,
    uz: (client: string, left: string) => `aksiya tugashiga eng yaqini: ${client} — ${left}`,
    pl: (client: string, left: string) => `najbliżej końca promocji: ${client} — ${left}`,
  },
  mockupsNone: {
    ru: "акций 48 часов сейчас нет",
    uz: "hozir 48 soatlik aksiyalar yo‘q",
    pl: "brak trwających promocji 48 h",
  },
  left: {
    ru: (h: number, m: number) => (h ? `${h} ч ${m} мин` : `${m} мин`),
    uz: (h: number, m: number) => (h ? `${h} soat ${m} daq` : `${m} daq`),
    pl: (h: number, m: number) => (h ? `${h} godz. ${m} min` : `${m} min`),
  },

  // Задачи.
  tasksTitle: { ru: "Задачи", uz: "Vazifalar", pl: "Zadania" },
  tasksOpen: { ru: "открытых", uz: "ochiq", pl: "otwarte" },
  tasksOverdue: { ru: "просрочено", uz: "muddati o‘tgan", pl: "po terminie" },
  tasksDone7: { ru: "сделано за 7 дней", uz: "7 kunda bajarildi", pl: "zrobione w 7 dni" },

  // Деньги — только владельцу.
  moneyTitle: { ru: "Деньги", uz: "Pul", pl: "Finanse" },
  moneyWeek: { ru: "поступило за 7 дней", uz: "7 kunda tushdi", pl: "wpłynęło w 7 dni" },
  moneyMonth: { ru: "с начала месяца", uz: "oy boshidan", pl: "od początku miesiąca" },
  moneyContracts: { ru: "договоров ждут подписи", uz: "imzo kutayotgan shartnomalar", pl: "umowy czekające na podpis" },

  // «Требует внимания».
  attentionTitle: { ru: "Требует внимания", uz: "E’tibor talab qiladi", pl: "Wymaga uwagi" },
  attentionCalm: {
    ru: "Всё спокойно: аварий нет, тёплые лиды при деле, просроченных задач нет.",
    uz: "Hammasi joyida: nosozlik yo‘q, issiq lidlar egali, muddati o‘tgan vazifa yo‘q.",
    pl: "Spokojnie: brak awarii, ciepłe leady mają opiekunów, brak zadań po terminie.",
  },
  attSweep: {
    ru: (m: number | null) =>
      m === null ? "Свип ни разу не отработал — напоминания и рассылки не уходят" : `Свип молчит ${m} мин — напоминания и рассылки не уходят`,
    uz: (m: number | null) =>
      m === null ? "Svip hali bir marta ham ishlamadi — eslatmalar va xabarlar ketmayapti" : `Svip ${m} daqiqadan beri jim — eslatmalar va xabarlar ketmayapti`,
    pl: (m: number | null) =>
      m === null ? "Sweep jeszcze ani razu nie zadziałał — przypomnienia i wysyłki nie wychodzą" : `Sweep milczy od ${m} min — przypomnienia i wysyłki nie wychodzą`,
  },
  attAutopilot: {
    ru: (e: string) => `Сбой автопрогона сегодня: ${e}`,
    uz: (e: string) => `Bugun avtoyurishda nosozlik: ${e}`,
    pl: (e: string) => `Awaria autopilota dziś: ${e}`,
  },
  attModel: {
    ru: (e: string) => `Сбой модели: ${e}`,
    uz: (e: string) => `Model nosozligi: ${e}`,
    pl: (e: string) => `Awaria modelu: ${e}`,
  },
  attBan: {
    ru: (account: string, until: string) => `Telegram ограничил «${account}» до ${until} — с него сообщения не уходят`,
    uz: (account: string, until: string) => `Telegram «${account}» akkauntini ${until} gacha cheklagan — undan xabar ketmaydi`,
    pl: (account: string, until: string) => `Telegram ograniczył „${account}” do ${until} — z tego konta wiadomości nie wychodzą`,
  },
  attCircle: {
    ru: (lang: string, accounts: string) => `Нет ${lang === "uz" ? "узбекского" : "русского"} кружка в «Избранном»: ${accounts}`,
    uz: (lang: string, accounts: string) => `«Saqlanganlar»da ${lang === "uz" ? "o‘zbekcha" : "ruscha"} dumaloq video yo‘q: ${accounts}`,
    pl: (lang: string, accounts: string) => `Brak ${lang === "uz" ? "uzbeckiego" : "rosyjskiego"} kółka w „Zapisanych”: ${accounts}`,
  },
  attCircleFallback: {
    ru: (n: number) => `Сегодня ${ru(n, "раз", "раза", "раз")} вместо кружка ушло письмо — кружка не было`,
    uz: (n: number) => `Bugun ${n} marta dumaloq video o‘rniga xat ketdi — video yo‘q edi`,
    pl: (n: number) => `Dziś ${pl(n, "raz", "razy", "razy")} zamiast kółka poszedł list — kółka nie było`,
  },
  attUnowned: {
    ru: (n: number, first: string) => `${ru(n, "тёплый лид", "тёплых лида", "тёплых лидов")} без хозяина — первый: ${first}`,
    uz: (n: number, first: string) => `${n} ta issiq lid egasiz — birinchisi: ${first}`,
    pl: (n: number, first: string) => `${pl(n, "ciepły lead", "ciepłe leady", "ciepłych leadów")} bez opiekuna — pierwszy: ${first}`,
  },
  attBurned: {
    ru: (n: number) => `Сегодня ${ru(n, "предложение", "предложения", "предложений")} тёплых лидов сгорело`,
    uz: (n: number) => `Bugun issiq lidlarning ${n} ta taklifi kuyib ketdi`,
    pl: (n: number) => `Dziś przepadło ${pl(n, "oferta", "oferty", "ofert")} ciepłych leadów`,
  },
  attOverdue: {
    ru: (n: number) => `${ru(n, "задача просрочена", "задачи просрочены", "задач просрочено")}`,
    uz: (n: number) => `${n} ta vazifaning muddati o‘tgan`,
    pl: (n: number) => `${pl(n, "zadanie po terminie", "zadania po terminie", "zadań po terminie")}`,
  },
  attStale: {
    ru: (n: number) => `${ru(n, "лид", "лида", "лидов")} «в работе» без движения 7+ дней`,
    uz: (n: number) => `${n} ta «ishda» lid 7+ kundan beri harakatsiz`,
    pl: (n: number) => `${pl(n, "lead", "leady", "leadów")} „w toku” bez ruchu od 7+ dni`,
  },
  attTransfers: {
    ru: (n: number) => `${ru(n, "просьба", "просьбы", "просьб")} передать лида ждут решения`,
    uz: (n: number) => `Lidni o‘tkazish bo‘yicha ${n} ta so‘rov qaror kutmoqda`,
    pl: (n: number) => `${pl(n, "prośba", "prośby", "próśb")} o przekazanie leada czeka na decyzję`,
  },
  attContracts: {
    ru: (n: number) => `${ru(n, "договор ждёт", "договора ждут", "договоров ждут")} подписи`,
    uz: (n: number) => `${n} ta shartnoma imzo kutmoqda`,
    pl: (n: number) => `${pl(n, "umowa czeka", "umowy czekają", "umów czeka")} na podpis`,
  },
  attEnding: {
    ru: (n: number) => `У ${ru(n, "акции", "акций", "акций")} 48 часов осталось меньше 6 часов`,
    uz: (n: number) => `${n} ta 48 soatlik aksiyaning tugashiga 6 soatdan kam qoldi`,
    pl: (n: number) => `Kończy się ${pl(n, "promocja", "promocje", "promocji")} 48 h: zostało mniej niż 6 godzin`,
  },
  mainAccount: { ru: "Главный аккаунт", uz: "Asosiy akkaunt", pl: "Konto główne" },
  attFirecrawl: {
    ru: (n: number) => `Firecrawl: осталось ${n} кредитов — поиск компаний скоро встанет`,
    uz: (n: number) => `Firecrawl: ${n} kredit qoldi — kompaniyalarni qidirish tez orada to‘xtaydi`,
    pl: (n: number) => `Firecrawl: zostało ${n} kredytów — wyszukiwanie firm wkrótce stanie`,
  },

  // Люди.
  peopleTitle: { ru: "Люди сегодня", uz: "Bugun jamoa", pl: "Zespół dziś" },
  peopleNone: {
    ru: "В команде пока нет менеджеров и руководителей.",
    uz: "Jamoada hali menejer va rahbarlar yo‘q.",
    pl: "W zespole nie ma jeszcze menedżerów ani kierowników.",
  },
  online: { ru: "в сети", uz: "onlayn", pl: "online" },
  seenAt: { ru: (at: string) => `был в ${at}`, uz: (at: string) => `${at} da bo‘lgan`, pl: (at: string) => `był o ${at}` },
  notToday: { ru: "сегодня не заходил", uz: "bugun kirmagan", pl: "dziś nie zaglądał" },
  firstAt: {
    ru: (at: string, minutes: string) => `зашёл в ${at} · в панели ${minutes}`,
    uz: (at: string, minutes: string) => `${at} da kirdi · panelda ${minutes}`,
    pl: (at: string, minutes: string) => `wszedł o ${at} · w panelu ${minutes}`,
  },
  minutes: {
    ru: (m: number) => (m >= 60 ? `${Math.floor(m / 60)} ч ${m % 60} мин` : `${m} мин`),
    uz: (m: number) => (m >= 60 ? `${Math.floor(m / 60)} soat ${m % 60} daq` : `${m} daq`),
    pl: (m: number) => (m >= 60 ? `${Math.floor(m / 60)} godz. ${m % 60} min` : `${m} min`),
  },
  statTouches: { ru: "касаний", uz: "aloqa", pl: "kontakty" },
  statPortion: {
    ru: (done: number, target: number) => `порция ${done}/${target}`,
    uz: (done: number, target: number) => `porsiya ${done}/${target}`,
    pl: (done: number, target: number) => `porcja ${done}/${target}`,
  },
  statNoPortion: { ru: "без порции", uz: "porsiyasiz", pl: "bez porcji" },
  statInWork: { ru: "лидов в работе", uz: "ishdagi lid", pl: "leady w toku" },
  statTasks: { ru: "задач", uz: "vazifa", pl: "zadania" },
  flagBurned: {
    ru: (n: number) => `сгорело ${n}`,
    uz: (n: number) => `${n} ta kuydi`,
    pl: (n: number) => `przepadło ${n}`,
  },
  flagStale: {
    ru: (n: number) => `без движения ${n}`,
    uz: (n: number) => `${n} ta harakatsiz`,
    pl: (n: number) => `bez ruchu ${n}`,
  },
  flagOverdue: {
    ru: (n: number) => `просрочено ${n}`,
    uz: (n: number) => `${n} ta muddati o‘tgan`,
    pl: (n: number) => `po terminie ${n}`,
  },
  moodDone: { ru: "порция сделана", uz: "porsiya bajarildi", pl: "porcja zrobiona" },
  moodIdle: { ru: "сегодня тихо", uz: "bugun jim", pl: "dziś cisza" },
  moreAbout: { ru: "Подробнее", uz: "Batafsil", pl: "Szczegóły" },
  openLeads: { ru: "Открыть его лиды", uz: "Uning lidlarini ochish", pl: "Otwórz jego leady" },
  giveTask: { ru: "Поставить задачу", uz: "Vazifa qo‘yish", pl: "Zleć zadanie" },
  detailTouches: {
    ru: (n: number) => `Касаний сегодня: ${n}`,
    uz: (n: number) => `Bugungi aloqalar: ${n}`,
    pl: (n: number) => `Kontakty dziś: ${n}`,
  },
  detailOpenTasks: {
    ru: (open: number, overdue: number) => `Открытых задач: ${open}${overdue ? `, просрочено ${overdue}` : ""}`,
    uz: (open: number, overdue: number) => `Ochiq vazifalar: ${open}${overdue ? `, muddati o‘tgan ${overdue}` : ""}`,
    pl: (open: number, overdue: number) => `Otwarte zadania: ${open}${overdue ? `, po terminie ${overdue}` : ""}`,
  },
  detailBurned: {
    ru: (n: number) => `Сгоревших предложений тёплых лидов сегодня: ${n}`,
    uz: (n: number) => `Bugun kuyib ketgan issiq lid takliflari: ${n}`,
    pl: (n: number) => `Przepadłe dziś oferty ciepłych leadów: ${n}`,
  },
  detailStale: {
    ru: (n: number) => `Лидов «в работе» без движения 7+ дней: ${n}`,
    uz: (n: number) => `7+ kun harakatsiz «ishda» lidlar: ${n}`,
    pl: (n: number) => `Leady „w toku” bez ruchu 7+ dni: ${n}`,
  },
  // Лента за сутки.
  feedTitle: { ru: "Лента за сутки", uz: "So‘nggi sutka", pl: "Ostatnia doba" },
  feedNone: {
    ru: "За сутки ничего нового: ни лидов, ни макетов, ни закрытых задач.",
    uz: "Bir sutkada yangilik yo‘q: lid ham, maket ham, yopilgan vazifa ham.",
    pl: "W ciągu doby nic nowego: ani leadów, ani makiet, ani zamkniętych zadań.",
  },
  feedLead: { ru: (x: string) => `Новый лид: ${x}`, uz: (x: string) => `Yangi lid: ${x}`, pl: (x: string) => `Nowy lead: ${x}` },
  feedWon: {
    ru: (x: string, who: string) => `Выиграли: ${x}${who ? ` · ${who}` : ""}`,
    uz: (x: string, who: string) => `Yutildi: ${x}${who ? ` · ${who}` : ""}`,
    pl: (x: string, who: string) => `Wygrany: ${x}${who ? ` · ${who}` : ""}`,
  },
  feedLost: {
    ru: (x: string, who: string) => `Проиграли: ${x}${who ? ` · ${who}` : ""}`,
    uz: (x: string, who: string) => `Yutqazildi: ${x}${who ? ` · ${who}` : ""}`,
    pl: (x: string, who: string) => `Przegrany: ${x}${who ? ` · ${who}` : ""}`,
  },
  feedMockupSent: { ru: (x: string) => `Макет ушёл: ${x}`, uz: (x: string) => `Maket yuborildi: ${x}`, pl: (x: string) => `Makieta wysłana: ${x}` },
  feedMockupApproved: {
    ru: (x: string) => `Макет утверждён: ${x}`,
    uz: (x: string) => `Maket tasdiqlandi: ${x}`,
    pl: (x: string) => `Makieta zatwierdzona: ${x}`,
  },
  feedTaskDone: {
    ru: (x: string, who: string) => `Задача сделана: ${x}${who ? ` · ${who}` : ""}`,
    uz: (x: string, who: string) => `Vazifa bajarildi: ${x}${who ? ` · ${who}` : ""}`,
    pl: (x: string, who: string) => `Zadanie zrobione: ${x}${who ? ` · ${who}` : ""}`,
  },
});
