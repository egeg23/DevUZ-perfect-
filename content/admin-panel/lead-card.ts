import { PANEL_INTL, defineDict, plural, type PanelLocale } from "@/lib/admin/i18n";

/**
 * Карточка лида (/admin/leads/[id]) и её части: обсуждение, смета,
 * подписи статусов и полей брифа.
 *
 * Термины — по content/admin-panel/GLOSSARY.md: «Взять себе» — «O‘zimga
 * olish» / «Przejmij», контакт клиента — «mijoz kontakti» / «dane
 * kontaktowe» (польское «kontakt» в панели — это касание), переписка —
 * «yozishma» / «korespondencja».
 *
 * Данные из базы (имена, бриф, заметки, переписка, причина, по которой
 * модель отдала разговор) не переводятся: это то, что написали люди и
 * модель, а не подписи панели.
 */

/**
 * Дата и время по Ташкенту, коротко: «18.09, 14:09».
 *
 * Своя, а не `when` из списка лидов: там — русская, здесь — на языке
 * панели. Зона та же и по той же причине: панелью пользуются из Ташкента.
 */
export function cardWhen(iso: string, locale: PanelLocale): string {
  return new Intl.DateTimeFormat(PANEL_INTL[locale], {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tashkent",
  }).format(new Date(iso));
}

/**
 * Ответ действия карточки: `?r=код` в адресе → текст на языке панели.
 *
 * Коды — это `reason` из lib/admin/ownership.ts (OwnershipResult) и
 * lib/admin/transfers.ts (TransferVerdict), плюс свои коды действий:
 * asked / approved / declined. Тест panel-i18n-lead-card сверяет, что
 * каждый код, который может уйти в адрес, здесь есть.
 */
export const leadResultDict = defineDict({
  ok: { ru: "Готово.", uz: "Tayyor.", pl: "Gotowe." },
  taken: {
    ru: "Лида уже взял кто-то другой — обновите страницу.",
    uz: "Bu lidni boshqa xodim allaqachon olgan — sahifani yangilang.",
    pl: "Tego leada przejął już ktoś inny — odśwież stronę.",
  },
  queued: {
    ru: "Не ваша очередь: лид сейчас предложен другому на 30 минут. Не возьмёт — лид уйдёт следующему, и очередь может дойти до вас.",
    uz: "Navbat sizniki emas: lid hozir 30 daqiqaga boshqa xodimga taklif qilingan. U olmasa, lid keyingisiga o‘tadi va navbat sizga ham yetib kelishi mumkin.",
    pl: "To nie Twoja kolej: lead jest teraz zaproponowany komuś innemu na 30 minut. Jeśli go nie weźmie, trafi do kolejnej osoby i kolejka może dojść do Ciebie.",
  },
  share: {
    ru: "Вы уже взяли свою равную долю лидов за месяц. Этот лид пришёл в нерабочее время и достаётся тем, у кого меньше.",
    uz: "Siz oylik teng ulushingizni allaqachon oldingiz. Bu lid ish vaqtidan tashqari kelgan va kamroq lid olganlarga beriladi.",
    pl: "Twoja równa część leadów na ten miesiąc jest już wykorzystana. Ten lead przyszedł poza godzinami pracy i trafia do osób, które mają ich mniej.",
  },
  forbidden: {
    ru: "Лид закреплён не за вами.",
    uz: "Lid sizga biriktirilmagan.",
    pl: "Ten lead nie jest przypisany do Ciebie.",
  },
  gone: { ru: "Лид не найден.", uz: "Lid topilmadi.", pl: "Nie znaleziono leada." },
  offline: { ru: "База недоступна.", uz: "Bazaga ulanib bo‘lmadi.", pl: "Baza danych jest niedostępna." },
  failed: {
    ru: "Не получилось. Попробуйте ещё раз.",
    uz: "Bo‘lmadi. Yana bir bor urinib ko‘ring.",
    pl: "Nie udało się. Spróbuj ponownie.",
  },
  asked: {
    ru: "Просьба отправлена. Лид остаётся у вас, пока её не подтвердят.",
    uz: "So‘rov yuborildi. Tasdiqlanmaguncha lid sizda qoladi.",
    pl: "Prośba wysłana. Lead zostaje u Ciebie, dopóki nie zostanie zatwierdzona.",
  },
  approved: {
    ru: "Передача подтверждена — лид у нового ответственного.",
    uz: "Berish tasdiqlandi — lid endi yangi mas’ulda.",
    pl: "Przekazanie zatwierdzone — lead jest już u nowej osoby odpowiedzialnej.",
  },
  declined: {
    ru: "Передачу отклонили. Лид остаётся у прежнего ответственного.",
    uz: "Berish rad etildi. Lid oldingi mas’ulda qoladi.",
    pl: "Przekazanie odrzucone. Lead zostaje u dotychczasowej osoby odpowiedzialnej.",
  },
  not_mine: {
    ru: "Передать может тот, у кого лид, либо руководитель или владелец.",
    uz: "Lidni o‘sha lid biriktirilgan xodim, rahbar yoki egasi bera oladi.",
    pl: "Przekazać może osoba, która prowadzi leada, albo kierownik lub właściciel.",
  },
  free: {
    ru: "Лид свободен — его берут кнопкой «Взять себе», а не передают.",
    uz: "Lid bo‘sh — uni berishmaydi, «O‘zimga olish» tugmasi bilan olishadi.",
    pl: "Lead jest wolny — nie przekazuje się go, tylko przejmuje przyciskiem „Przejmij”.",
  },
  self: { ru: "Это тот же сотрудник.", uz: "Bu o‘sha xodimning o‘zi.", pl: "To ta sama osoba." },
  pending: {
    ru: "По этому лиду уже ждёт решения другая просьба.",
    uz: "Bu lid bo‘yicha boshqa so‘rov allaqachon qarorni kutmoqda.",
    pl: "Dla tego leada inna prośba czeka już na decyzję.",
  },
});

/** Статус лида — в кнопках статуса и в поле «Статус». */
export const leadStatusDict = defineDict({
  new: { ru: "новый", uz: "yangi", pl: "nowy" },
  taken: { ru: "в работе", uz: "ishda", pl: "w toku" },
  dropped: { ru: "отложен", uz: "qoldirilgan", pl: "odłożony" },
  won: { ru: "выиграли", uz: "yutilgan", pl: "wygrany" },
  lost: { ru: "проиграли", uz: "yutqazilgan", pl: "przegrany" },
});

export const leadPriorityDict = defineDict({
  hot: { ru: "горячий", uz: "issiq", pl: "gorący" },
  warm: { ru: "тёплый", uz: "iliq", pl: "ciepły" },
  nurture: { ru: "дозреет", uz: "pishib yetiladi", pl: "do dojrzenia" },
  archive: { ru: "архив", uz: "arxiv", pl: "archiwum" },
});

/** Бюджет — не сумма, а то, как клиент говорит о деньгах (B1–B3). */
export const leadBudgetDict = defineDict({
  B1: { ru: "назван и утверждён", uz: "aytilgan va tasdiqlangan", pl: "podany i zatwierdzony" },
  B2: { ru: "есть, сравнивает", uz: "bor, solishtirmoqda", pl: "jest, porównuje oferty" },
  B3: { ru: "не назван", uz: "aytilmagan", pl: "nie podany" },
});

export const leadTimingDict = defineDict({
  T1: { ru: "сейчас", uz: "hozir", pl: "teraz" },
  T2: { ru: "в этом квартале", uz: "shu chorakda", pl: "w tym kwartale" },
  T3: { ru: "когда-нибудь", uz: "qachondir", pl: "kiedyś" },
});

export const leadAuthorityDict = defineDict({
  A1: { ru: "решает сам", uz: "o‘zi hal qiladi", pl: "decyduje sam" },
  A2: { ru: "влияет на решение", uz: "qarorga ta’sir qiladi", pl: "wpływa na decyzję" },
  A3: { ru: "передаёт дальше", uz: "yuqoriga yetkazadi", pl: "przekazuje dalej" },
});

export const leadNeedDict = defineDict({
  N1: { ru: "болит сейчас", uz: "muammo hozir dolzarb", pl: "pilna potrzeba" },
  N2: { ru: "понимает задачу", uz: "vazifani tushunadi", pl: "rozumie zadanie" },
  N3: { ru: "присматривается", uz: "hali qarab turibdi", pl: "rozgląda się" },
});

export const leadExpertiseDict = defineDict({
  high: { ru: "разбирается", uz: "yaxshi tushunadi", pl: "zna się" },
  medium: { ru: "средне", uz: "o‘rtacha", pl: "średnio" },
  low: { ru: "не разбирается", uz: "tushunmaydi", pl: "nie zna się" },
});

/** За что клиенту скидка — менеджеру важно: извиняться за ожидание или нет. */
export const leadDiscountDict = defineDict({
  promise: {
    ru: "скидка 30% — не уложились в 20 секунд",
    uz: "30% chegirma — 20 soniyada ulgurmadik",
    pl: "rabat 30% — nie zdążyliśmy w 20 sekund",
  },
  minute: {
    ru: "скидка 30% — написал в первую минуту",
    uz: "30% chegirma — birinchi daqiqada yozgan",
    pl: "rabat 30% — napisał w pierwszej minucie",
  },
});

/** Состояние просьбы о передаче (lib/admin/transfers.ts, TransferStatus). */
export const leadTransferStatusDict = defineDict({
  requested: { ru: "ждёт подтверждения", uz: "tasdiqni kutmoqda", pl: "czeka na zatwierdzenie" },
  approved: { ru: "подтверждена", uz: "tasdiqlandi", pl: "zatwierdzone" },
  declined: { ru: "отклонена", uz: "rad etildi", pl: "odrzucone" },
});

/** Тип контакта клиента (lib/contact.ts, CONTACT_LABEL — русский, для брифа). */
export const leadContactKindDict = defineDict({
  telegram: { ru: "Telegram", uz: "Telegram", pl: "Telegram" },
  phone: { ru: "телефон", uz: "telefon", pl: "telefon" },
  email: { ru: "почта", uz: "e-pochta", pl: "e-mail" },
  none: { ru: "не оставлен", uz: "qoldirilmagan", pl: "nie podano" },
});

/** Почему партнёрскую привязку не засчитали (lib/partners/rules.ts, VoidReason). */
export const leadVoidDict = defineDict({
  self: { ru: "партнёр привёл сам себя", uz: "hamkor o‘zini o‘zi olib kelgan", pl: "partner polecił sam siebie" },
  existing_client: {
    ru: "клиент уже был у студии до ссылки",
    uz: "mijoz havoladan oldin ham studiya mijozi bo‘lgan",
    pl: "klient był już klientem studia przed kliknięciem linku",
  },
  blocked: { ru: "партнёр заблокирован", uz: "hamkor bloklangan", pl: "partner jest zablokowany" },
});

/** Всё остальное на странице карточки — сверху вниз, как на экране. */
export const leadCardDict = defineDict({
  back: { ru: "← к списку", uz: "← ro‘yxatga", pl: "← do listy" },

  // ── Очередь ──
  yourTurn: {
    ru: (until: string) => `⏳ Лид ваш до ${until}. Не возьмёте — он уйдёт следующему по очереди.`,
    uz: (until: string) => `⏳ Lid ${until} gacha sizniki. Olmasangiz — navbatdagi keyingi xodimga o‘tadi.`,
    pl: (until: string) => `⏳ Lead jest Twój do ${until}. Jeśli go nie weźmiesz, trafi do kolejnej osoby w kolejce.`,
  },
  queueHelp: { ru: "Как работает очередь", uz: "Navbat qanday ishlaydi", pl: "Jak działa kolejka" },
  adminQueue: {
    ru: (holder: string, until: string) =>
      `👁 В очереди у ${holder} до ${until}. Вы вне очереди — можете взять сами.`,
    uz: (holder: string, until: string) =>
      `👁 ${holder} navbatida, ${until} gacha. Siz navbatdan tashqaridasiz — o‘zingiz olishingiz mumkin.`,
    pl: (holder: string, until: string) =>
      `👁 W kolejce u ${holder} do ${until}. Jesteś poza kolejką — możesz przejąć go od razu.`,
  },
  someone: { ru: "сотрудника", uz: "xodim", pl: "pracownika" },
  shareBanner: {
    ru: "🌙 Лид пришёл в нерабочее время и делится поровну. Свою долю за месяц вы уже взяли — он для тех, у кого меньше.",
    uz: "🌙 Lid ish vaqtidan tashqari kelgan va teng taqsimlanadi. Oylik ulushingizni allaqachon oldingiz — u kamroq olganlar uchun.",
    pl: "🌙 Lead przyszedł poza godzinami pracy i jest dzielony po równo. Twoja część na ten miesiąc jest już wykorzystana — trafi do osób, które mają mniej.",
  },
  hiddenBanner: {
    ru: "Лид сейчас в очереди у другого сотрудника. Ник клиента скрыт, пока очередь не дойдёт до вас.",
    uz: "Lid hozir boshqa xodimning navbatida. Navbat sizga yetmaguncha mijozning niki yashirilgan.",
    pl: "Lead jest teraz w kolejce u innej osoby. Nick klienta jest ukryty, dopóki kolejka nie dojdzie do Ciebie.",
  },

  // ── Владение ──
  owner: { ru: "Ведёт", uz: "Mas’ul", pl: "Prowadzi" },
  takeHelp: { ru: "Взять, вернуть, отказаться", uz: "Olish, qaytarish, voz kechish", pl: "Przejęcie, zwrot, odrzucenie" },
  nobody: { ru: "никто — лид свободен", uz: "hech kim — lid bo‘sh", pl: "nikt — lead jest wolny" },
  since: {
    ru: (at: string) => `с ${at}`,
    uz: (at: string) => `${at} dan beri`,
    pl: (at: string) => `od ${at}`,
  },
  take: { ru: "Взять себе", uz: "O‘zimga olish", pl: "Przejmij" },
  release: { ru: "Вернуть в очередь", uz: "Navbatga qaytarish", pl: "Zwróć do kolejki" },

  // ── Передача ──
  transfer: { ru: "Передача", uz: "Berish", pl: "Przekazanie" },
  requestedBy: {
    ru: (name: string, at: string) => `попросил ${name} · ${at}`,
    uz: (name: string, at: string) => `so‘radi: ${name} · ${at}`,
    pl: (name: string, at: string) => `prośba od: ${name} · ${at}`,
  },
  approve: { ru: "Подтвердить", uz: "Tasdiqlash", pl: "Zatwierdź" },
  decline: { ru: "Отклонить", uz: "Rad etish", pl: "Odrzuć" },
  waitingDecision: {
    ru: "Ждём решения руководителя или владельца. Пока лид остаётся у прежнего ответственного.",
    uz: "Rahbar yoki egasining qarorini kutyapmiz. Hozircha lid oldingi mas’ulda qoladi.",
    pl: "Czekamy na decyzję kierownika lub właściciela. Do tego czasu lead zostaje u dotychczasowej osoby odpowiedzialnej.",
  },
  handOver: { ru: "Передать", uz: "Berish", pl: "Przekaż" },
  transferHelp: { ru: "Как передать лид", uz: "Lidni qanday berish", pl: "Jak przekazać leada" },
  toWhom: { ru: "кому", uz: "kimga", pl: "komu" },
  whyHandOver: { ru: "почему передаёте", uz: "nega berayapsiz", pl: "dlaczego przekazujesz" },
  askHandOver: { ru: "Попросить передать", uz: "Berishni so‘rash", pl: "Poproś o przekazanie" },
  approvedBy: {
    ru: "подтверждает руководитель или владелец",
    uz: "rahbar yoki egasi tasdiqlaydi",
    pl: "zatwierdza kierownik lub właściciel",
  },

  status: { ru: "Статус", uz: "Holat", pl: "Status" },

  // ── Контакт ──
  contact: { ru: "Контакт клиента", uz: "Mijoz kontakti", pl: "Dane kontaktowe klienta" },
  contactHelp: {
    ru: "Контакт, переписка, обсуждение",
    uz: "Kontakt, yozishma, muhokama",
    pl: "Dane kontaktowe, korespondencja, dyskusja",
  },
  kindUnknown: { ru: "тип не указан", uz: "turi ko‘rsatilmagan", pl: "typ nieznany" },
  viewLogged: { ru: "просмотр записан в журнал", uz: "ko‘rish jurnalga yozildi", pl: "wyświetlenie zapisano w dzienniku" },
  contactNone: { ru: "контакт не оставлен", uz: "kontakt qoldirilmagan", pl: "klient nie zostawił danych kontaktowych" },
  showContact: { ru: "Показать контакт", uz: "Kontaktni ko‘rsatish", pl: "Pokaż dane kontaktowe" },
  lastOpened: {
    ru: (at: string) => `последний раз открывали ${at}`,
    uz: (at: string) => `oxirgi marta ochilgan: ${at}`,
    pl: (at: string) => `ostatnio otwierane: ${at}`,
  },
  neverOpened: { ru: "ещё никто не открывал", uz: "hali hech kim ochmagan", pl: "nikt jeszcze nie otwierał" },
  takeForContact: {
    ru: "Возьмите лида в работу, чтобы увидеть контакт.",
    uz: "Kontaktni ko‘rish uchun lidni ishga oling.",
    pl: "Przejmij leada, aby zobaczyć dane kontaktowe.",
  },
  heldByOther: {
    ru: "Лид закреплён за другим менеджером.",
    uz: "Lid boshqa menejerga biriktirilgan.",
    pl: "Lead jest przypisany do innego menedżera.",
  },

  // ── Первичка по касанию ──
  talk: { ru: "Первичка по касанию", uz: "Aloqa bo‘yicha birlamchi suhbat", pl: "Pierwsza rozmowa po kontakcie" },
  talkHelp: { ru: "Кто отвечает клиенту", uz: "Mijozga kim javob beradi", pl: "Kto odpowiada klientowi" },
  aiAnswers: { ru: "отвечает ИИ", uz: "SI javob beryapti", pl: "odpowiada AI" },
  /** Причина — из базы, как её записала модель или панель, не переводится. */
  youAnswer: {
    ru: (reason: string) => `отвечаете вы${reason ? ` — ${reason}` : ""}`,
    uz: (reason: string) => `siz javob berasiz${reason ? ` — ${reason}` : ""}`,
    pl: (reason: string) => `odpowiadasz Ty${reason ? ` — ${reason}` : ""}`,
  },
  client: { ru: "клиент", uz: "mijoz", pl: "klient" },
  aiForUs: { ru: "ИИ от нашего имени", uz: "SI bizning nomimizdan", pl: "AI w naszym imieniu" },
  you: { ru: "вы", uz: "siz", pl: "Ty" },
  talkEmpty: {
    ru: "Письмо ушло, ответа пока нет. Как ответит — первичку подхватит ИИ, а вы увидите разговор здесь.",
    uz: "Xat yuborildi, hozircha javob yo‘q. Javob kelishi bilan birlamchi suhbatni SI olib boradi, siz esa suhbatni shu yerda ko‘rasiz.",
    pl: "Wiadomość wysłana, odpowiedzi jeszcze nie ma. Gdy klient odpisze, pierwszą rozmowę podejmie AI, a Ty zobaczysz ją tutaj.",
  },
  takeOverTalk: { ru: "Отвечать самому", uz: "O‘zim javob beraman", pl: "Odpowiadam osobiście" },
  aiNote: {
    ru: "ИИ ведёт первичку от имени студии и остановится сам, когда выяснит задачу, бюджет и сроки. Лид ваш в любом случае — он не переназначается.",
    uz: "SI birlamchi suhbatni studiya nomidan olib boradi va vazifa, byudjet hamda muddatlarni aniqlagach o‘zi to‘xtaydi. Lid baribir sizniki — u boshqaga o‘tkazilmaydi.",
    pl: "AI prowadzi pierwszą rozmowę w imieniu studia i sam się zatrzyma, gdy ustali zadanie, budżet i terminy. Lead i tak jest Twój — nie zostanie przepisany.",
  },
  openTelegram: {
    ru: "Открыть переписку в Telegram",
    uz: "Yozishmani Telegramda ochish",
    pl: "Otwórz korespondencję w Telegramie",
  },
  telegramNote: {
    ru: "писать нужно с рабочего аккаунта студии — с него ушло письмо, и для клиента это один собеседник",
    uz: "studiyaning ish akkauntidan yozish kerak — xat undan ketgan, mijoz uchun esa bu bitta suhbatdosh",
    pl: "pisz z firmowego konta studia — z niego wyszła wiadomość, a dla klienta to jeden rozmówca",
  },

  // ── Переписка с клиентом ──
  transcript: { ru: "Переписка с клиентом", uz: "Mijoz bilan yozishma", pl: "Korespondencja z klientem" },
  assistant: { ru: "ассистент", uz: "assistent", pl: "asystent" },
  noTranscript: {
    ru: "Переписки нет — заявка пришла формой, а не из чата.",
    uz: "Yozishma yo‘q — murojaat chatdan emas, formadan kelgan.",
    pl: "Brak korespondencji — zgłoszenie przyszło przez formularz, a nie z czatu.",
  },
  showTranscript: { ru: "Показать переписку", uz: "Yozishmani ko‘rsatish", pl: "Pokaż korespondencję" },
  transcriptHint: {
    ru: "всё, что клиент рассказал о деньгах и сроках",
    uz: "mijoz pul va muddatlar haqida aytgan hamma narsa",
    pl: "wszystko, co klient powiedział o pieniądzach i terminach",
  },
  takeForTranscript: {
    ru: "Возьмите лида в работу, чтобы прочитать переписку.",
    uz: "Yozishmani o‘qish uchun lidni ishga oling.",
    pl: "Przejmij leada, aby przeczytać korespondencję.",
  },

  // ── Напоминания ──
  reminders: { ru: "Напоминания", uz: "Eslatmalar", pl: "Przypomnienia" },
  remindersHelp: { ru: "Как работают напоминания", uz: "Eslatmalar qanday ishlaydi", pl: "Jak działają przypomnienia" },
  autoOff: { ru: "Выключить автонапоминания", uz: "Avtoeslatmalarni o‘chirish", pl: "Wyłącz automatyczne przypomnienia" },
  autoOn: { ru: "Включить автонапоминания", uz: "Avtoeslatmalarni yoqish", pl: "Włącz automatyczne przypomnienia" },
  noNote: { ru: "без пометки", uz: "izohsiz", pl: "bez opisu" },
  auto: { ru: "авто", uz: "avto", pl: "auto" },
  undelivered: {
    ru: (attempts: number) =>
      `не доставлено (${attempts} ${plural("ru", attempts, "попытка", "попытки", "попыток")}) — проверьте, не заблокирован ли бот`,
    uz: (attempts: number) => `yetkazilmadi (${attempts} ta urinish) — bot bloklanmaganini tekshiring`,
    pl: (attempts: number) =>
      `nie dostarczono (${attempts} ${plural("pl", attempts, "próba", "próby", "prób")}) — sprawdź, czy bot nie jest zablokowany`,
  },
  sent: { ru: "отправлено", uz: "yuborildi", pl: "wysłano" },
  overdue: { ru: "просрочено", uz: "muddati o‘tdi", pl: "po terminie" },
  done: { ru: "сделано", uz: "bajarildi", pl: "zrobione" },
  nothingPlanned: { ru: "Ничего не запланировано.", uz: "Hech narsa rejalashtirilmagan.", pl: "Nic nie zaplanowano." },
  remindIn: { ru: "напомнить через", uz: "eslatish:", pl: "przypomnij za" },
  hoursUnit: { ru: "ч.", uz: "soatdan keyin", pl: "godz." },
  remindWhat: { ru: "о чём напомнить", uz: "nima haqida eslatish", pl: "o czym przypomnieć" },
  setting: { ru: "Ставим…", uz: "Qo‘yilmoqda…", pl: "Ustawianie…" },
  set: { ru: "Поставить", uz: "Qo‘yish", pl: "Ustaw" },

  // ── Поля брифа ──
  who: { ru: "Кто", uz: "Kim", pl: "Kto" },
  company: { ru: "Компания", uz: "Kompaniya", pl: "Firma" },
  partner: { ru: "Партнёр", uz: "Hamkor", pl: "Partner" },
  niche: { ru: "Ниша", uz: "Soha", pl: "Branża" },
  services: { ru: "Услуги", uz: "Xizmatlar", pl: "Usługi" },
  budget: { ru: "Бюджет", uz: "Byudjet", pl: "Budżet" },
  timing: { ru: "Сроки", uz: "Muddatlar", pl: "Terminy" },
  authority: { ru: "Решение", uz: "Qaror", pl: "Decyzja" },
  need: { ru: "Потребность", uz: "Ehtiyoj", pl: "Potrzeba" },
  expertise: { ru: "Экспертиза", uz: "Mavzuni bilishi", pl: "Znajomość tematu" },
  priority: { ru: "Приоритет", uz: "Ustuvorlik", pl: "Priorytet" },
  wroteFrom: { ru: "Откуда писал", uz: "Qayerdan yozgan", pl: "Skąd pisał" },
  when: { ru: "Когда", uz: "Qachon", pl: "Kiedy" },
  where: { ru: "Где", uz: "Qayerda", pl: "Gdzie" },
  tgHandle: { ru: "Ник в Telegram", uz: "Telegramdagi nik", pl: "Nick w Telegramie" },
  handleHidden: { ru: "скрыт — лид сейчас не ваш", uz: "yashirilgan — lid hozir sizniki emas", pl: "ukryty — lead nie jest teraz Twój" },

  // ── Партнёр ──
  refDays: {
    ru: (days: number) => `по ссылке за ${days} дн. до заявки`,
    uz: (days: number) => `havola orqali, murojaatdan ${days} kun oldin`,
    pl: (days: number) => `z linku, ${days} ${plural("pl", days, "dzień", "dni", "dni")} przed zgłoszeniem`,
  },
  notCounted: {
    ru: (why: string) => `не засчитано: ${why}`,
    uz: (why: string) => `hisobga olinmadi: ${why}`,
    pl: (why: string) => `nie zaliczono: ${why}`,
  },
  partnerMissing: {
    ru: (code: string) => `код ${code} — партнёр не найден`,
    uz: (code: string) => `kod ${code} — hamkor topilmadi`,
    pl: (code: string) => `kod ${code} — nie znaleziono partnera`,
  },

  brief: { ru: "Бриф", uz: "Brif", pl: "Brief" },
  quote: { ru: "Смета", uz: "Smeta", pl: "Kosztorys" },
  notes: { ru: "Заметки", uz: "Izohlar", pl: "Notatki" },
  footer: {
    ru: "Контакт и переписка открываются кнопкой, а не сразу: полный разговор — самое чувствительное из того, что клиент рассказал о своём бизнесе. Открытие этой карточки, каждое получение контакта и каждое чтение переписки записаны в журнал. Обсуждение видно всей команде — контакт клиента в него лучше не вставлять: закрытость контакта на этом и держится.",
    uz: "Kontakt va yozishma darhol emas, tugma bilan ochiladi: to‘liq suhbat — mijoz o‘z biznesi haqida aytganlarining eng nozik qismi. Bu kartochkaning ochilishi, kontaktni har bir olish va yozishmani har bir o‘qish jurnalga yoziladi. Muhokama butun jamoaga ko‘rinadi — mijoz kontaktini unga yozmagan ma’qul: kontaktning yopiqligi aynan shunga tayanadi.",
    pl: "Dane kontaktowe i korespondencja otwierają się przyciskiem, a nie od razu: pełna rozmowa to najbardziej wrażliwe z tego, co klient powiedział o swojej firmie. Otwarcie tej karty, każde pobranie danych kontaktowych i każde czytanie korespondencji są zapisywane w dzienniku. Dyskusję widzi cały zespół — lepiej nie wklejać do niej danych kontaktowych klienta: na tym opiera się ich poufność.",
  },
});

/** Обсуждение лида (components/admin/lead-thread.tsx). */
export const leadThreadDict = defineDict({
  title: { ru: "Обсуждение", uz: "Muhokama", pl: "Dyskusja" },
  edited: { ru: "· изменено", uz: "· tahrirlangan", pl: "· edytowano" },
  empty: { ru: "Пока пусто.", uz: "Hozircha bo‘sh.", pl: "Na razie pusto." },
  placeholder: {
    ru: "Что известно по этому клиенту",
    uz: "Bu mijoz haqida nima ma’lum",
    pl: "Co wiadomo o tym kliencie",
  },
  sending: { ru: "Отправляем…", uz: "Yuborilmoqda…", pl: "Wysyłanie…" },
  send: { ru: "Отправить", uz: "Yuborish", pl: "Wyślij" },
  visibility: {
    ru: "Видно всей команде. Владельцу лида придёт в Telegram.",
    uz: "Butun jamoaga ko‘rinadi. Lid egasiga Telegramda xabar keladi.",
    pl: "Widzi to cały zespół. Osoba prowadząca leada dostanie powiadomienie w Telegramie.",
  },
});

/** Смета (components/admin/quote-card.tsx). Строки самой сметы — из lib/admin/quote.ts. */
export const quoteCardDict = defineDict({
  weeks: {
    ru: (n: number) => `${n} нед.`,
    uz: (n: number) => `${n} hafta`,
    pl: (n: number) => `${n} tyg.`,
  },
  weeksRange: {
    ru: (low: number, high: number) => `${low}–${high} нед.`,
    uz: (low: number, high: number) => `${low}–${high} hafta`,
    pl: (low: number, high: number) => `${low}–${high} tyg.`,
  },
  afterCall: { ru: "после созвона", uz: "qo‘ng‘iroqdan keyin", pl: "po rozmowie" },
  fromShowcase: {
    ru: "цена с витрины, клиент её видел",
    uz: "narx vitrinadan, mijoz uni ko‘rgan",
    pl: "cena z witryny, klient ją widział",
  },
  fromCalculator: { ru: "по калькулятору сайта", uz: "sayt kalkulyatori bo‘yicha", pl: "wg kalkulatora na stronie" },
  floor: { ru: "не ниже", uz: "kamida", pl: "nie mniej niż" },
  ceiling: { ru: "до", uz: "ko‘pi bilan", pl: "do" },
  rush: { ru: "ускорение", uz: "tezlashtirish", pl: "przyspieszenie" },
  term: { ru: "срок", uz: "muddat", pl: "termin" },
  work: { ru: "Что входит", uz: "Nimalar kiradi", pl: "Co obejmuje" },
  chosen: { ru: "Выбрано", uz: "Tanlangan", pl: "Wybrano" },
  extras: { ru: "Что предложить дополнительно", uz: "Qo‘shimcha nima taklif qilish mumkin", pl: "Co zaproponować dodatkowo" },
  talk: { ru: "Что говорить", uz: "Nima deyish kerak", pl: "Co mówić" },
});

/** Общие кнопки (copy-message.tsx, submit-button.tsx) — подписи по умолчанию. */
export const panelButtonsDict = defineDict({
  copy: { ru: "Скопировать текст", uz: "Matnni nusxalash", pl: "Kopiuj tekst" },
  copied: { ru: "Скопировано", uz: "Nusxalandi", pl: "Skopiowano" },
  saving: { ru: "Сохраняю…", uz: "Saqlanmoqda…", pl: "Zapisywanie…" },
});
