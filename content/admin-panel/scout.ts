import { defineDict, plural } from "@/lib/admin/i18n";

/**
 * Раздел «Поиск» (/admin/scout): сигналы скаута из публичных чатов.
 *
 * Сами сигналы (выдержка, пояснение модели, название чата) — данные и не
 * переводятся. Состояние скаута (`scoutHealthDict`) пишет и бот в утренней
 * сводке — там по-русски: lib/scout/health.ts зовёт его с языком "ru" по
 * умолчанию.
 */
export const scoutDict = defineDict({
  title: { ru: "Сигналы скаута", uz: "Skaut signallari", pl: "Sygnały skauta" },
  done: { ru: "Готово.", uz: "Tayyor.", pl: "Gotowe." },
  failed: { ru: "Не получилось.", uz: "Bo‘lmadi.", pl: "Nie udało się." },
  healthHelp: { ru: "Что значит это состояние", uz: "Bu holat nimani anglatadi", pl: "Co oznacza ten stan" },
  unread: {
    ru: (reading: number, watched: number, unread: number) =>
      `Аккаунт читает ${reading} ${plural("ru", reading, "чат", "чата", "чатов")} из ${watched} заданных: в ${unread} он не состоит или адрес не открылся. В группы из списка «Группы для скаута» он вступит сам, по очереди; в остальные — руками с аккаунта скаута.`,
    uz: (reading: number, watched: number, unread: number) =>
      `Akkaunt berilgan ${watched} ta chatdan ${reading} tasini o‘qiyapti: ${unread} tasida u a’zo emas yoki manzil ochilmadi. «Skaut uchun guruhlar» ro‘yxatidagi guruhlarga u o‘zi navbat bilan qo‘shiladi; qolganlariga — skaut akkauntidan qo‘lda.`,
    pl: (reading: number, watched: number, unread: number) =>
      `Konto czyta ${reading} z ${watched} ${plural("pl", watched, "zadanego czatu", "zadanych czatów", "zadanych czatów")}: w ${unread} nie jest członkiem albo adres się nie otworzył. Do grup z listy «Grupy dla skauta» dołączy sam, po kolei; do pozostałych — ręcznie z konta skauta.`,
  },
  unreadList: { ru: "Не читаются:", uz: "O‘qilmayapti:", pl: "Nieczytane:" },
  howItWorks: { ru: "Как работает скаут", uz: "Skaut qanday ishlaydi", pl: "Jak działa skaut" },
  whatToDo: { ru: "Что делать с сигналом", uz: "Signal bilan nima qilish kerak", pl: "Co zrobić z sygnałem" },

  // Плитки
  tileSignals: { ru: "сигналов", uz: "signallar", pl: "sygnałów" },
  tileFresh: { ru: "не открывали", uz: "ochilmagan", pl: "nieotwarte" },
  tileConverted: { ru: "пришли сами", uz: "o‘zlari kelgan", pl: "przyszli sami" },
  tileConversion: { ru: "доходят до нас", uz: "bizgacha yetib keladi", pl: "docierają do nas" },
  tileConversionHint: {
    ru: "Считается от отработанных. Сигнал, который никто не открывал, говорит о нехватке рук, а не о качестве отбора.",
    uz: "Ishlov berilganlardan hisoblanadi. Hech kim ochmagan signal tanlov sifati haqida emas, qo‘l yetishmasligi haqida gapiradi.",
    pl: "Liczone od obsłużonych. Sygnał, którego nikt nie otworzył, mówi o braku rąk do pracy, a nie o jakości selekcji.",
  },

  all: { ru: "все", uz: "barchasi", pl: "wszystkie" },

  // Сигнал
  noCategory: { ru: "без категории", uz: "toifasiz", pl: "bez kategorii" },
  keptWithLead: { ru: "хранится как часть лида", uz: "lidning bir qismi sifatida saqlanadi", pl: "przechowywany jako część leada" },
  erasedIn: {
    ru: (days: number) => `сотрётся через ${days} дн.`,
    uz: (days: number) => `${days} kundan keyin o‘chiriladi`,
    pl: (days: number) => `zostanie usunięty za ${days} ${plural("pl", days, "dzień", "dni", "dni")}`,
  },
  noUsername: { ru: "без username", uz: "username yo‘q", pl: "bez username" },
  openMessage: { ru: "открыть сообщение →", uz: "xabarni ochish →", pl: "otwórz wiadomość →" },
  noLink: {
    ru: "ссылки нет — закрытый чат без адреса",
    uz: "havola yo‘q — manzilsiz yopiq chat",
    pl: "brak linku — zamknięty czat bez adresu",
  },
  becameLead: { ru: "стал лидом →", uz: "lidga aylandi →", pl: "został leadem →" },
  convertedChip: { ru: "пришёл сам", uz: "o‘zi keldi", pl: "przyszedł sam" },
  empty: { ru: "Сигналов нет.", uz: "Signallar yo‘q.", pl: "Brak sygnałów." },
  foot: {
    ru: "Отвечать нужно руками и в том же публичном чате — сервис в чаты не пишет ни строкой. «Пришёл сам» проставляется автоматически, когда человек напишет нашему боту: только тогда сигнал перестаёт стираться по сроку и становится частью истории сделки.",
    uz: "Javobni qo‘lda va o‘sha ochiq chatning o‘zida yozish kerak — servis chatlarga bitta satr ham yozmaydi. «O‘zi keldi» odam botimizga yozganda avtomatik qo‘yiladi: faqat shunda signal muddat bo‘yicha o‘chirilmaydi va bitim tarixining bir qismiga aylanadi.",
    pl: "Odpowiadać trzeba ręcznie i na tym samym publicznym czacie — serwis nie pisze na czatach ani słowa. «Przyszedł sam» ustawia się automatycznie, gdy człowiek napisze do naszego bota: dopiero wtedy sygnał przestaje być usuwany po terminie i staje się częścią historii transakcji.",
  },
});

/**
 * «Группы для скаута» — на той же странице (владелец, 06.11.2026: «добавлять
 * группы для отслеживания всем… В день самостоятельно не более 10 подписок
 * на группы с интервалом 1-2 часа»). Названия групп и ошибки Telegram —
 * данные, не переводятся.
 */
export const scoutGroupsDict = defineDict({
  title: { ru: "Группы для скаута", uz: "Skaut uchun guruhlar", pl: "Grupy dla skauta" },
  lead: {
    ru: "Добавьте группу или канал в Telegram, где ищут исполнителей. Скаут вступит в неё сам — не больше 10 в день, с паузой час-два и только днём, — и начнёт читать.",
    uz: "Telegramda ijrochi qidiradigan guruh yoki kanalni qo‘shing. Skaut unga o‘zi qo‘shiladi — kuniga 10 tadan ko‘p emas, bir-ikki soat oraliq bilan va faqat kunduzi — va o‘qishni boshlaydi.",
    pl: "Dodaj grupę lub kanał w Telegramie, gdzie szuka się wykonawców. Skaut sam do niej dołączy — nie więcej niż 10 dziennie, z przerwą godzinę-dwie i tylko w dzień — i zacznie czytać.",
  },
  today: {
    ru: (tried: number, cap: number) => `Сегодня попыток вступить: ${tried} из ${cap}.`,
    uz: (tried: number, cap: number) => `Bugun qo‘shilishga urinishlar: ${cap} tadan ${tried} ta.`,
    pl: (tried: number, cap: number) => `Dziś prób dołączenia: ${tried} z ${cap}.`,
  },
  next: {
    ru: (at: string) => `Следующее вступление — не раньше ${at}.`,
    uz: (at: string) => `Keyingi qo‘shilish — ${at} dan oldin emas.`,
    pl: (at: string) => `Następne dołączenie — nie wcześniej niż ${at}.`,
  },
  nextNow: {
    ru: "Следующее вступление — в ближайшие 10 минут.",
    uz: "Keyingi qo‘shilish — yaqin 10 daqiqada.",
    pl: "Następne dołączenie — w ciągu najbliższych 10 minut.",
  },
  tomorrow: {
    ru: "Сегодня скаут больше не вступает — продолжит завтра с 08:00 по Ташкенту.",
    uz: "Bugun skaut boshqa qo‘shilmaydi — ertaga Toshkent vaqti bilan 08:00 dan davom etadi.",
    pl: "Dziś skaut już nie dołącza — kontynuuje jutro od 08:00 czasu Taszkentu.",
  },
  paused: {
    ru: (at: string) => `Telegram попросил подождать: вступления на паузе до ${at}.`,
    uz: (at: string) => `Telegram kutishni so‘radi: qo‘shilishlar ${at} gacha to‘xtatilgan.`,
    pl: (at: string) => `Telegram poprosił o przerwę: dołączanie wstrzymane do ${at}.`,
  },
  queue: {
    ru: (n: number) => `В очереди на вступление: ${n}.`,
    uz: (n: number) => `Qo‘shilish navbatida: ${n} ta.`,
    pl: (n: number) => `W kolejce do dołączenia: ${n}.`,
  },
  addLabel: { ru: "Адрес группы или ссылка-приглашение", uz: "Guruh manzili yoki taklif havolasi", pl: "Adres grupy lub link z zaproszeniem" },
  addPlaceholder: { ru: "@group, t.me/group или t.me/+…", uz: "@group, t.me/group yoki t.me/+…", pl: "@group, t.me/group lub t.me/+…" },
  noteLabel: { ru: "Заметка — необязательно", uz: "Izoh — ixtiyoriy", pl: "Notatka — opcjonalnie" },
  notePlaceholder: { ru: "страна, о чём группа", uz: "mamlakat, guruh nima haqida", pl: "kraj, o czym jest grupa" },
  add: { ru: "Добавить группу", uz: "Guruh qo‘shish", pl: "Dodaj grupę" },
  adding: { ru: "Добавляю…", uz: "Qo‘shilmoqda…", pl: "Dodaję…" },
  added: {
    ru: "Группа добавлена — скаут вступит в неё в свою очередь.",
    uz: "Guruh qo‘shildi — skaut navbati kelganda unga qo‘shiladi.",
    pl: "Grupa dodana — skaut dołączy do niej, gdy przyjdzie jej kolej.",
  },
  bad: {
    ru: "Это не адрес группы. Нужен @адрес, t.me/адрес или ссылка t.me/+…; бота и личный аккаунт скаут не читает.",
    uz: "Bu guruh manzili emas. @manzil, t.me/manzil yoki t.me/+… havolasi kerak; skaut bot va shaxsiy akkauntni o‘qimaydi.",
    pl: "To nie jest adres grupy. Potrzebny @adres, t.me/adres albo link t.me/+…; bota i konta prywatnego skaut nie czyta.",
  },
  exists: { ru: "Эта группа уже в списке.", uz: "Bu guruh allaqachon ro‘yxatda.", pl: "Ta grupa jest już na liście." },
  failed: { ru: "Не получилось — попробуйте ещё раз.", uz: "Bo‘lmadi — yana urinib ko‘ring.", pl: "Nie udało się — spróbuj jeszcze raz." },
  removed: { ru: "Группа убрана из списка.", uz: "Guruh ro‘yxatdan olib tashlandi.", pl: "Grupa usunięta z listy." },
  notRemoved: {
    ru: "Убрать не получилось: убирает тот, кто добавил, руководитель или владелец.",
    uz: "Olib tashlab bo‘lmadi: uni qo‘shgan odam, rahbar yoki egasi olib tashlaydi.",
    pl: "Nie udało się usunąć: usuwa ten, kto dodał, kierownik albo właściciel.",
  },
  remove: { ru: "Убрать", uz: "Olib tashlash", pl: "Usuń" },
  colGroup: { ru: "Группа", uz: "Guruh", pl: "Grupa" },
  colStatus: { ru: "Состояние", uz: "Holati", pl: "Stan" },
  colAdded: { ru: "Кто добавил", uz: "Kim qo‘shgan", pl: "Kto dodał" },
  viaScout: { ru: "вступил скаут", uz: "skaut qo‘shildi", pl: "dołączył skaut" },
  viaManual: { ru: "вступили руками", uz: "qo‘lda qo‘shilingan", pl: "dołączono ręcznie" },
  fromList: { ru: "из первого списка", uz: "birinchi ro‘yxatdan", pl: "z pierwszej listy" },
  all: {
    ru: (n: number) => `Все группы (${n})`,
    uz: (n: number) => `Barcha guruhlar (${n})`,
    pl: (n: number) => `Wszystkie grupy (${n})`,
  },
  empty: { ru: "Групп пока нет — добавьте первую.", uz: "Hozircha guruhlar yo‘q — birinchisini qo‘shing.", pl: "Na razie brak grup — dodaj pierwszą." },
  noDb: {
    ru: "Список групп не загрузился — база не ответила.",
    uz: "Guruhlar ro‘yxati yuklanmadi — baza javob bermadi.",
    pl: "Lista grup się nie wczytała — baza nie odpowiedziała.",
  },
});

/** Состояние группы. Ключ — `scout_chats.status`. */
export const scoutChatStatusDict = defineDict({
  pending: { ru: "ждёт вступления", uz: "qo‘shilishni kutmoqda", pl: "czeka na dołączenie" },
  joined: { ru: "читаем", uz: "o‘qiyapmiz", pl: "czytamy" },
  request: { ru: "заявка у админа", uz: "ariza adminda", pl: "prośba u admina" },
  error: { ru: "не вступить", uz: "qo‘shilib bo‘lmaydi", pl: "nie da się dołączyć" },
});

/** Статус сигнала. Ключ — `scout_signals.status`. */
export const signalStatusDict = defineDict({
  new: { ru: "новые", uz: "yangi", pl: "nowe" },
  answered: { ru: "ответили", uz: "javob berildi", pl: "odpowiedziano" },
  ignored: { ru: "мимо", uz: "mos emas", pl: "pominięte" },
  converted: { ru: "пришёл сам", uz: "o‘zi keldi", pl: "przyszedł sam" },
});

/**
 * Состояние скаута одной фразой — для панели и для утренней сводки бота.
 * Русский текст — тот же, что был в lib/scout/health.ts: его читает бот.
 */
export const scoutHealthDict = defineDict({
  never: {
    ru: "Скаут ни разу не отчитывался. Либо не запускался, либо запущен без доступа к базе.",
    uz: "Skaut hali bir marta ham hisobot bermagan. Yo ishga tushmagan, yo bazaga kirishsiz ishga tushirilgan.",
    pl: "Skaut ani razu się nie zgłosił. Albo nie był uruchomiony, albo działa bez dostępu do bazy danych.",
  },
  stale: {
    ru: (minutes: number) => `Скаут молчит ${minutes} мин. Процесс упал или остановлен — проверьте systemd.`,
    uz: (minutes: number) => `Skaut ${minutes} daqiqadan beri jim. Jarayon yiqilgan yoki to‘xtatilgan — systemd ni tekshiring.`,
    pl: (minutes: number) => `Skaut milczy od ${minutes} min. Proces padł albo został zatrzymany — sprawdź systemd.`,
  },
  noChats: {
    ru: "Скаут жив, но не читает ни одного чата: аккаунт в них не состоит или адреса не открылись. В группы из «Сигналов скаута» он вступит сам, по очереди; в остальные — руками.",
    uz: "Skaut ishlayapti, lekin birorta ham chatni o‘qimayapti: akkaunt ularga a’zo emas yoki manzillar ochilmadi. «Skaut signallari»dagi guruhlarga u o‘zi navbat bilan qo‘shiladi; qolganlariga — qo‘lda.",
    pl: "Skaut działa, ale nie czyta żadnego czatu: konto nie jest w nich członkiem albo adresy się nie otworzyły. Do grup z «Sygnałów skauta» dołączy sam, po kolei; do pozostałych — ręcznie.",
  },
  modelDown: {
    ru: (passed: number) =>
      `Отсев пропустил ${passed}, а разобрано 0. Модель недоступна: кончились деньги на ключе, ключа нет вовсе либо скаут запущен без NODE_OPTIONS=--use-env-proxy.`,
    uz: (passed: number) =>
      `Filtr ${passed} tasini o‘tkazdi, tahlil qilingani esa 0. Model ishlamayapti: kalitdagi pul tugagan, kalit umuman yo‘q yoki skaut NODE_OPTIONS=--use-env-proxy siz ishga tushirilgan.`,
    pl: (passed: number) =>
      `Filtr przepuścił ${passed}, a przeanalizowano 0. Model jest niedostępny: skończyły się środki na kluczu, klucza nie ma wcale albo skaut działa bez NODE_OPTIONS=--use-env-proxy.`,
  },
  noMessages: {
    ru: (reading: number) => `Скаут читает ${reading} чат(ов), но не видел ещё ни одного сообщения.`,
    uz: (reading: number) => `Skaut ${reading} ta chatni o‘qiyapti, lekin hali birorta ham xabar ko‘rmagan.`,
    pl: (reading: number) =>
      `Skaut czyta ${reading} ${plural("pl", reading, "czat", "czaty", "czatów")}, ale nie widział jeszcze żadnej wiadomości.`,
  },
  quiet: {
    ru: (seen: number, passed: number) =>
      `Механизм цел: увидел ${seen}, до модели дошло ${passed}. Запросов на разработку пока не было — это тишина в чатах, а не поломка.`,
    uz: (seen: number, passed: number) =>
      `Mexanizm butun: ${seen} ta ko‘rdi, modelga ${passed} tasi yetib bordi. Ishlab chiqish so‘rovlari hali bo‘lmagan — bu chatlardagi sukunat, buzilish emas.`,
    pl: (seen: number, passed: number) =>
      `Mechanizm jest sprawny: zobaczył ${seen}, do modelu dotarło ${passed}. Zapytań o development jeszcze nie było — to cisza na czatach, a nie awaria.`,
  },
  ok: {
    ru: (seen: number, passed: number, saved: number, notified: number) =>
      `Увидел ${seen}, до модели дошло ${passed}, сохранено ${saved}, отправлено ${notified}.`,
    uz: (seen: number, passed: number, saved: number, notified: number) =>
      `${seen} ta ko‘rdi, modelga ${passed} tasi yetib bordi, ${saved} tasi saqlandi, ${notified} tasi yuborildi.`,
    pl: (seen: number, passed: number, saved: number, notified: number) =>
      `Zobaczył ${seen}, do modelu dotarło ${passed}, zapisano ${saved}, wysłano ${notified}.`,
  },
});
