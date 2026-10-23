import { defineDict, plural } from "@/lib/admin/i18n";

/**
 * «Главная»: быстрая задача и рассылка в бот команде
 * (components/admin/hq-task.tsx, components/admin/hq-broadcast.tsx).
 * Сообщение в самом Telegram — по-русски, как весь бот.
 */

const ru = (n: number, one: string, few: string, many: string) => `${n} ${plural("ru", n, one, few, many)}`;
const pl = (n: number, one: string, few: string, many: string) => `${n} ${plural("pl", n, one, few, many)}`;

export const hqTaskDict = defineDict({
  title: { ru: "Быстрая задача", uz: "Tezkor vazifa", pl: "Szybkie zadanie" },
  who: { ru: "Кому", uz: "Kimga", pl: "Komu" },
  whoHint: {
    ru: "Можно нескольких — каждому придёт своя задача.",
    uz: "Bir nechta kishini tanlash mumkin — har biriga o‘z vazifasi keladi.",
    pl: "Możesz wybrać kilka osób — każda dostanie własne zadanie.",
  },
  what: { ru: "Что сделать", uz: "Nima qilish kerak", pl: "Co zrobić" },
  whatPlaceholder: {
    ru: "Например: позвонить «Самса Хаус» до обеда",
    uz: "Masalan: tushlikkacha «Somsa Xaus»ga qo‘ng‘iroq qilish",
    pl: "Na przykład: zadzwonić do klienta przed obiadem",
  },
  due: { ru: "Срок", uz: "Muddat", pl: "Termin" },
  dueToday: { ru: "сегодня до 18:00", uz: "bugun 18:00 gacha", pl: "dziś do 18:00" },
  dueTomorrow: { ru: "завтра", uz: "ertaga", pl: "jutro" },
  dueCustom: { ru: "своя дата", uz: "boshqa sana", pl: "własna data" },
  submit: { ru: "Поставить задачу", uz: "Vazifa qo‘yish", pl: "Zleć zadanie" },
  sending: { ru: "Ставлю…", uz: "Qo‘yilmoqda…", pl: "Zlecam…" },
  done: {
    ru: (n: number) => `Готово: ${ru(n, "задача", "задачи", "задач")}. Бот уже написал исполнителям.`,
    uz: (n: number) => `Tayyor: ${n} ta vazifa. Bot ijrochilarga yozdi.`,
    pl: (n: number) => `Gotowe: ${pl(n, "zadanie", "zadania", "zadań")}. Bot już napisał do wykonawców.`,
  },
  doneLater: {
    ru: (n: number) => `Готово: ${ru(n, "задача", "задачи", "задач")}. Сейчас ночь — бот напишет исполнителям в 07:00.`,
    uz: (n: number) => `Tayyor: ${n} ta vazifa. Hozir tun — bot ijrochilarga 07:00 da yozadi.`,
    pl: (n: number) => `Gotowe: ${pl(n, "zadanie", "zadania", "zadań")}. Jest noc — bot napisze do wykonawców o 07:00.`,
  },
  errAssignee: { ru: "Выберите, кому задача.", uz: "Vazifa kimga ekanini tanlang.", pl: "Wybierz, komu zlecasz zadanie." },
  errTitle: { ru: "Напишите, что сделать (до 200 знаков).", uz: "Nima qilish kerakligini yozing (200 belgigacha).", pl: "Napisz, co zrobić (do 200 znaków)." },
  errPast: {
    ru: "Срок уже прошёл — после 18:00 выберите «завтра» или свою дату.",
    uz: "Muddat o‘tib ketgan — 18:00 dan keyin «ertaga» yoki boshqa sanani tanlang.",
    pl: "Termin już minął — po 18:00 wybierz „jutro” albo własną datę.",
  },
  errFar: { ru: "Срок дальше года — проверьте дату.", uz: "Muddat bir yildan uzoq — sanani tekshiring.", pl: "Termin dalej niż za rok — sprawdź datę." },
  errFailed: { ru: "Не записалось — попробуйте ещё раз.", uz: "Saqlanmadi — qayta urinib ko‘ring.", pl: "Nie zapisano — spróbuj ponownie." },
  errForbidden: { ru: "Нет доступа.", uz: "Ruxsat yo‘q.", pl: "Brak dostępu." },
  errMockup: {
    ru: "Ответьте на «Заказ макета»: да или нет.",
    uz: "«Maket buyurtmasi» ga javob bering: ha yoki yo‘q.",
    pl: "Odpowiedz na «Zlecenie makiety»: tak lub nie.",
  },
  errMockupClient: {
    ru: "Выберите клиента заказа из поиска.",
    uz: "Buyurtma mijozini qidiruvdan tanlang.",
    pl: "Wybierz klienta zlecenia z wyszukiwania.",
  },
  errMockupSite: { ru: "Укажите сайт клиента.", uz: "Mijoz saytini ko‘rsating.", pl: "Podaj stronę klienta." },
});

export const broadcastDict = defineDict({
  title: { ru: "Рассылка в бот команде", uz: "Jamoaga botda xabar", pl: "Wiadomość do zespołu przez bota" },
  intro: {
    ru: "Сообщение придёт каждому в Telegram от бота студии — например, «созвон в 15:00».",
    uz: "Xabar har kimga studiya botidan Telegramda keladi — masalan, «15:00 da qo‘ng‘iroq».",
    pl: "Wiadomość przyjdzie każdemu w Telegramie od bota studia — na przykład „spotkanie o 15:00”.",
  },
  text: { ru: "Текст", uz: "Matn", pl: "Treść" },
  textPlaceholder: {
    ru: "Созвон в 15:00 по ссылке …",
    uz: "15:00 da qo‘ng‘iroq, havola …",
    pl: "Spotkanie o 15:00, link …",
  },
  audience: { ru: "Кому", uz: "Kimga", pl: "Do kogo" },
  audAll: { ru: "Всем", uz: "Hammaga", pl: "Wszystkim" },
  audRoles: { ru: "По ролям", uz: "Rollar bo‘yicha", pl: "Według ról" },
  audPick: { ru: "Выбрать людей", uz: "Odamlarni tanlash", pl: "Wybierz osoby" },
  roleAdmin: { ru: "владелец", uz: "egasi", pl: "właściciel" },
  roleHead: { ru: "руководители", uz: "rahbarlar", pl: "kierownicy" },
  roleManager: { ru: "менеджеры", uz: "menejerlar", pl: "menedżerowie" },
  when: { ru: "Когда", uz: "Qachon", pl: "Kiedy" },
  whenNow: { ru: "Сейчас", uz: "Hozir", pl: "Teraz" },
  whenAt: { ru: "В назначенное время", uz: "Belgilangan vaqtda", pl: "O wybranej godzinie" },
  whenHint: {
    ru: "Время — ташкентское. Уходит ближайшим проходом бота, в пределах 5 минут: созвон в 15:00 — ставьте 14:50.",
    uz: "Vaqt — Toshkent vaqti. Botning eng yaqin aylanishida, 5 daqiqa ichida ketadi: 15:00 dagi qo‘ng‘iroq uchun 14:50 ni qo‘ying.",
    pl: "Czas taszkencki. Wychodzi przy najbliższym przebiegu bota, w ciągu 5 minut: spotkanie o 15:00 — ustaw 14:50.",
  },
  night: { ru: "Отправить и ночью", uz: "Tunda ham yuborish", pl: "Wyślij także w nocy" },
  nightHint: {
    ru: "С 23:00 до 07:00 бот молчит: без галочки ночное сообщение уйдёт в 07:00.",
    uz: "23:00 dan 07:00 gacha bot jim: belgisiz tungi xabar 07:00 da ketadi.",
    pl: "Od 23:00 do 07:00 bot milczy: bez zaznaczenia nocna wiadomość wyjdzie o 07:00.",
  },
  preview: { ru: "Предпросмотр", uz: "Oldindan ko‘rish", pl: "Podgląd" },
  previewTitle: { ru: "Так увидят в Telegram", uz: "Telegramda shunday ko‘rinadi", pl: "Tak to zobaczą w Telegramie" },
  willGet: {
    ru: (n: number) => `Получат: ${ru(n, "человек", "человека", "человек")}`,
    uz: (n: number) => `Oladi: ${n} kishi`,
    pl: (n: number) => `Otrzyma: ${pl(n, "osoba", "osoby", "osób")}`,
  },
  noTelegram: {
    ru: (names: string) => `Без Telegram, не получат: ${names}`,
    uz: (names: string) => `Telegrami yo‘q, olmaydi: ${names}`,
    pl: (names: string) => `Bez Telegramu, nie otrzymają: ${names}`,
  },
  notYou: {
    ru: "Вам самому сообщение не придёт — вы его автор.",
    uz: "O‘zingizga xabar kelmaydi — siz uning muallifisiz.",
    pl: "Ty nie dostaniesz wiadomości — jesteś jej autorem.",
  },
  sendNow: {
    ru: (n: number) => `Отправить ${ru(n, "человеку", "людям", "людям")}`,
    uz: (n: number) => `${n} kishiga yuborish`,
    pl: (n: number) => `Wyślij do ${pl(n, "osoby", "osób", "osób")}`,
  },
  schedule: {
    ru: (at: string) => `Запланировать на ${at}`,
    uz: (at: string) => `${at} ga rejalashtirish`,
    pl: (at: string) => `Zaplanuj na ${at}`,
  },
  back: { ru: "Изменить", uz: "O‘zgartirish", pl: "Zmień" },
  sending: { ru: "Отправляю…", uz: "Yuborilmoqda…", pl: "Wysyłam…" },
  sent: {
    ru: (n: number) => `Ушло: ${ru(n, "человек", "человека", "человек")} получат сообщение в ближайшие секунды.`,
    uz: (n: number) => `Ketdi: ${n} kishi xabarni bir necha soniyada oladi.`,
    pl: (n: number) => `Wysłane: ${pl(n, "osoba", "osoby", "osób")} dostanie wiadomość za kilka sekund.`,
  },
  scheduled: {
    ru: (n: number) => `Запланировано: уйдёт ${ru(n, "человеку", "людям", "людям")} в назначенное время.`,
    uz: (n: number) => `Rejalashtirildi: belgilangan vaqtda ${n} kishiga ketadi.`,
    pl: (n: number) => `Zaplanowane: wyjdzie do ${pl(n, "osoby", "osób", "osób")} o wybranej godzinie.`,
  },
  nightSaved: {
    ru: (n: number) => `Сейчас ночь — уйдёт ${ru(n, "человеку", "людям", "людям")} в 07:00.`,
    uz: (n: number) => `Hozir tun — 07:00 da ${n} kishiga ketadi.`,
    pl: (n: number) => `Jest noc — wyjdzie do ${pl(n, "osoby", "osób", "osób")} o 07:00.`,
  },
  errEmpty: { ru: "Напишите текст.", uz: "Matnni yozing.", pl: "Napisz treść." },
  errLong: { ru: "Длиннее 2000 знаков — сократите.", uz: "2000 belgidan uzun — qisqartiring.", pl: "Dłuższe niż 2000 znaków — skróć." },
  errAudience: { ru: "Выберите, кому.", uz: "Kimga ekanini tanlang.", pl: "Wybierz, do kogo." },
  errWhen: { ru: "Проверьте время.", uz: "Vaqtni tekshiring.", pl: "Sprawdź godzinę." },
  errPast: { ru: "Это время уже прошло.", uz: "Bu vaqt o‘tib ketgan.", pl: "Ta godzina już minęła." },
  errFar: { ru: "Дальше недели вперёд — проверьте дату.", uz: "Bir haftadan uzoq — sanani tekshiring.", pl: "Dalej niż tydzień — sprawdź datę." },
  errNobody: {
    ru: "Некому отправить: ни у кого из выбранных нет Telegram.",
    uz: "Yuboradigan odam yo‘q: tanlanganlarning hech birida Telegram yo‘q.",
    pl: "Nie ma do kogo wysłać: nikt z wybranych nie ma Telegramu.",
  },
  errChanged: {
    ru: "Состав команды изменился — откройте предпросмотр ещё раз.",
    uz: "Jamoa tarkibi o‘zgardi — oldindan ko‘rishni qayta oching.",
    pl: "Skład zespołu się zmienił — otwórz podgląd jeszcze raz.",
  },
  errFailed: { ru: "Не записалось — попробуйте ещё раз.", uz: "Saqlanmadi — qayta urinib ko‘ring.", pl: "Nie zapisano — spróbuj ponownie." },
  errForbidden: { ru: "Рассылать могут владелец и руководитель.", uz: "Faqat egasi va rahbar yubora oladi.", pl: "Wysyłać mogą właściciel i kierownik." },

  // История.
  historyTitle: { ru: "Последние рассылки", uz: "Oxirgi xabarlar", pl: "Ostatnie wysyłki" },
  historyNone: { ru: "Рассылок ещё не было.", uz: "Hali xabar yuborilmagan.", pl: "Nie było jeszcze wysyłek." },
  historyLine: {
    ru: (who: string, to: string, delivered: number, total: number) => `${who} → ${to} · дошло ${delivered} из ${total}`,
    uz: (who: string, to: string, delivered: number, total: number) => `${who} → ${to} · ${total} dan ${delivered} ga yetdi`,
    pl: (who: string, to: string, delivered: number, total: number) => `${who} → ${to} · dotarło ${delivered} z ${total}`,
  },
  toAll: { ru: "всем", uz: "hammaga", pl: "wszystkim" },
  toPicked: { ru: "выбранным", uz: "tanlanganlarga", pl: "wybranym" },
  stScheduled: { ru: (at: string) => `запланировано на ${at}`, uz: (at: string) => `${at} ga rejalashtirilgan`, pl: (at: string) => `zaplanowane na ${at}` },
  stNight: { ru: "ждёт 07:00", uz: "07:00 ni kutmoqda", pl: "czeka do 07:00" },
  stSending: { ru: "уходит", uz: "ketmoqda", pl: "w trakcie" },
  stDone: { ru: "ушло", uz: "ketdi", pl: "wysłane" },
  stCancelled: { ru: "отменено", uz: "bekor qilindi", pl: "anulowane" },
  cancel: { ru: "Отменить", uz: "Bekor qilish", pl: "Anuluj" },
  // Два вида получателей (владелец, 13.10.2026: «раздели их»).
  tabStaff: { ru: "Сотрудникам", uz: "Xodimlarga", pl: "Pracownikom" },
  tabUsers: { ru: "Пользователям бота", uz: "Bot foydalanuvchilariga", pl: "Użytkownikom bota" },
  usersIntro: {
    ru: "Тем, кто сам писал боту студии: клиенты и лиды из чата, партнёры, покупатели. Сотрудников здесь нет. Уходит ровно ваш текст, без подписи.",
    uz: "Studiya botiga o‘zi yozganlarga: chatdagi mijozlar va lidlar, hamkorlar, xaridorlar. Bu yerda xodimlar yo‘q. Aynan sizning matningiz imzosiz ketadi.",
    pl: "Do osób, które same pisały do bota studia: klienci i leady z czatu, partnerzy, kupujący. Pracowników tu nie ma. Wychodzi dokładnie Twój tekst, bez podpisu.",
  },
  segment: { ru: "Кому из пользователей", uz: "Qaysi foydalanuvchilarga", pl: "Do których użytkowników" },
  segAll: { ru: "Всем", uz: "Hammaga", pl: "Wszystkim" },
  segPartners: { ru: "Партнёрам", uz: "Hamkorlarga", pl: "Partnerom" },
  segBuyers: { ru: "Покупателям магазина", uz: "Do‘kon xaridorlariga", pl: "Kupującym w sklepie" },
  segClients: { ru: "Клиентам и лидам", uz: "Mijozlar va lidlarga", pl: "Klientom i leadom" },
  willGetUsers: {
    ru: (n: number) => `Получат: ${ru(n, "пользователь", "пользователя", "пользователей")} бота`,
    uz: (n: number) => `Oladi: ${n} ta bot foydalanuvchisi`,
    pl: (n: number) => `Otrzyma: ${pl(n, "użytkownik", "użytkowników", "użytkowników")} bota`,
  },
  usersNote: {
    ru: "Шлём только тем, кто сам начинал разговор с ботом. Кто заблокировал бота — не получит и будет отмечен. Уходит порциями, не быстрее 25 сообщений в секунду.",
    uz: "Faqat bot bilan o‘zi suhbat boshlaganlarga yuboramiz. Botni bloklaganlar olmaydi va belgilanadi. Porsiyalab, soniyasiga 25 tadan tez emas ketadi.",
    pl: "Wysyłamy tylko do osób, które same zaczęły rozmowę z botem. Kto zablokował bota — nie dostanie i zostanie oznaczony. Wychodzi porcjami, nie szybciej niż 25 wiadomości na sekundę.",
  },
  noModel: {
    ru: "Рассылка не зависит от ИИ: свой текст уходит через бот напрямую, даже если модель недоступна.",
    uz: "Xabar yuborish SIga bog‘liq emas: matningiz bot orqali to‘g‘ridan-to‘g‘ri ketadi, model ishlamasa ham.",
    pl: "Wysyłka nie zależy od AI: Twój tekst idzie przez bota bezpośrednio, nawet gdy model jest niedostępny.",
  },
  usersHistoryLine: {
    ru: (who: string, sent: number, failed: number, blocked: number, total: number) =>
      `${who} · из ${total}: дошло ${sent}, не дошло ${failed}, заблокировали бота ${blocked}`,
    uz: (who: string, sent: number, failed: number, blocked: number, total: number) =>
      `${who} · ${total} dan: yetdi ${sent}, yetmadi ${failed}, botni blokladi ${blocked}`,
    pl: (who: string, sent: number, failed: number, blocked: number, total: number) =>
      `${who} · z ${total}: dotarło ${sent}, nie dotarło ${failed}, zablokowało bota ${blocked}`,
  },
  usersNone: { ru: "Пока никто не писал боту.", uz: "Hali hech kim botga yozmagan.", pl: "Nikt jeszcze nie pisał do bota." },
  repeat: { ru: "Повторить", uz: "Takrorlash", pl: "Powtórz" },
  repeatNote: {
    ru: "Текст и получатели — как в прошлый раз. Проверьте и откройте предпросмотр.",
    uz: "Matn va oluvchilar — o‘tgan safargidek. Tekshirib, oldindan ko‘rishni oching.",
    pl: "Treść i odbiorcy jak poprzednio. Sprawdź i otwórz podgląd.",
  },
});
