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
  title: { ru: "Холодный поиск", uz: "Sovuq qidiruv", pl: "Zimne wyszukiwanie" },
  done: { ru: "Готово.", uz: "Tayyor.", pl: "Gotowe." },
  failed: { ru: "Не получилось.", uz: "Bo‘lmadi.", pl: "Nie udało się." },
  healthHelp: { ru: "Что значит это состояние", uz: "Bu holat nimani anglatadi", pl: "Co oznacza ten stan" },
  unread: {
    ru: (reading: number, watched: number, unread: number) =>
      `Аккаунт читает ${reading} ${plural("ru", reading, "чат", "чата", "чатов")} из ${watched} заданных: в ${unread} он не состоит или адрес не открылся. Вступать нужно руками — из панели это не делается.`,
    uz: (reading: number, watched: number, unread: number) =>
      `Akkaunt berilgan ${watched} ta chatdan ${reading} tasini o‘qiyapti: ${unread} tasida u a’zo emas yoki manzil ochilmadi. Qo‘shilish qo‘lda qilinadi — paneldan buni qilib bo‘lmaydi.`,
    pl: (reading: number, watched: number, unread: number) =>
      `Konto czyta ${reading} z ${watched} ${plural("pl", watched, "zadanego czatu", "zadanych czatów", "zadanych czatów")}: w ${unread} nie jest członkiem albo adres się nie otworzył. Dołączyć trzeba ręcznie — z panelu się tego nie zrobi.`,
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
    ru: "Скаут жив, но не читает ни одного чата: аккаунт в них не состоит или адреса не открылись. Вступать нужно руками.",
    uz: "Skaut ishlayapti, lekin birorta ham chatni o‘qimayapti: akkaunt ularga a’zo emas yoki manzillar ochilmadi. Qo‘shilish qo‘lda qilinadi.",
    pl: "Skaut działa, ale nie czyta żadnego czatu: konto nie jest w nich członkiem albo adresy się nie otworzyły. Dołączyć trzeba ręcznie.",
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
