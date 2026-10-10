import { defineDict, plural } from "@/lib/admin/i18n";

/**
 * Автопилот рекламы: раздел «Реклама» в панели (/admin/ads) и кабинет
 * агентства (/ads). Один словарь на оба места: кабинет читает русский и
 * узбекский, панель — все три языка.
 *
 * Слова — как говорит маркетолог, а не как пишет API: «цена заявки», а не
 * CPA; «минус-слова», а не negative keywords.
 */
export const adsDict = defineDict({
  title: { ru: "Автопилот рекламы", uz: "Reklama avtopiloti", pl: "Autopilot reklam" },
  intro: {
    ru: "Google Ads и Яндекс Директ: минус-слова, перераспределение бюджета и тесты объявлений. По умолчанию автопилот только предлагает, а решаете вы.",
    uz: "Google Ads va Yandex Direct: minus-so‘zlar, byudjetni qayta taqsimlash va e’lonlar testi. Odatiy holatda avtopilot faqat taklif qiladi, qarorni siz qabul qilasiz.",
    pl: "Google Ads i Yandex Direct: wykluczające słowa kluczowe, przesuwanie budżetu i testy reklam. Domyślnie autopilot tylko proponuje, a decyzja należy do Ciebie.",
  },
  offline: {
    ru: "База не отвечает — данные не загрузились.",
    uz: "Baza javob bermayapti — ma’lumotlar yuklanmadi.",
    pl: "Baza nie odpowiada — dane się nie wczytały.",
  },
  flagOff: {
    ru: "Фоновые проходы выключены (ADS_AUTOPILOT). Кнопка «Обновить сейчас» работает.",
    uz: "Fon rejimidagi yurishlar o‘chirilgan (ADS_AUTOPILOT). «Hozir yangilash» tugmasi ishlaydi.",
    pl: "Przebiegi w tle są wyłączone (ADS_AUTOPILOT). Przycisk «Odśwież teraz» działa.",
  },

  /* ── Кабинеты (агентства) ─────────────────────────────────────────── */
  workspacesTitle: { ru: "Кабинеты", uz: "Kabinetlar", pl: "Konta klientów" },
  workspacesEmpty: {
    ru: "Кабинетов пока нет. Заведите первый — для студии или агентства-партнёра.",
    uz: "Hozircha kabinetlar yo‘q. Birinchisini oching — studiya yoki hamkor agentlik uchun.",
    pl: "Nie ma jeszcze kont. Utwórz pierwsze — dla studia albo agencji partnerskiej.",
  },
  newWorkspace: { ru: "Новый кабинет", uz: "Yangi kabinet", pl: "Nowe konto" },
  wsName: { ru: "Название", uz: "Nomi", pl: "Nazwa" },
  wsKind: { ru: "Кто это", uz: "Kim", pl: "Kto to" },
  kindStudio: { ru: "студия", uz: "studiya", pl: "studio" },
  kindAgency: { ru: "агентство", uz: "agentlik", pl: "agencja" },
  kindBusiness: { ru: "бизнес", uz: "biznes", pl: "firma" },
  wsLocale: { ru: "Язык кабинета и бота", uz: "Kabinet va bot tili", pl: "Język konta i bota" },
  create: { ru: "Создать", uz: "Yaratish", pl: "Utwórz" },
  open: { ru: "Открыть", uz: "Ochish", pl: "Otwórz" },
  people: { ru: "Люди", uz: "Odamlar", pl: "Osoby" },
  peopleNote: {
    ru: "Входят в кабинет через бота студии и получают уведомления. Нужен числовой Telegram id.",
    uz: "Kabinetga studiya boti orqali kiradi va bildirishnomalar oladi. Raqamli Telegram id kerak.",
    pl: "Logują się przez bota studia i dostają powiadomienia. Potrzebny liczbowy Telegram id.",
  },
  memberId: { ru: "Telegram id", uz: "Telegram id", pl: "Telegram id" },
  memberName: { ru: "Имя", uz: "Ism", pl: "Imię" },
  addMember: { ru: "Добавить", uz: "Qo‘shish", pl: "Dodaj" },
  removeMember: { ru: "Убрать", uz: "Olib tashlash", pl: "Usuń" },
  noPeople: { ru: "Пока никого.", uz: "Hozircha hech kim yo‘q.", pl: "Na razie nikogo." },

  /* ── Рекламные кабинеты ────────────────────────────────────────────── */
  accountsTitle: { ru: "Рекламные кабинеты", uz: "Reklama kabinetlari", pl: "Konta reklamowe" },
  accountsEmpty: {
    ru: "Ни одного рекламного кабинета. Добавьте Яндекс Директ, Google Ads или заглушку для обкатки.",
    uz: "Birorta reklama kabineti yo‘q. Yandex Direct, Google Ads yoki sinov uchun namuna qo‘shing.",
    pl: "Brak kont reklamowych. Dodaj Yandex Direct, Google Ads albo atrapę do testów.",
  },
  addAccount: { ru: "Добавить рекламный кабинет", uz: "Reklama kabinetini qo‘shish", pl: "Dodaj konto reklamowe" },
  platform: { ru: "Площадка", uz: "Platforma", pl: "Platforma" },
  platformYandex: { ru: "Яндекс Директ", uz: "Yandex Direct", pl: "Yandex Direct" },
  platformGoogle: { ru: "Google Ads", uz: "Google Ads", pl: "Google Ads" },
  platformStub: { ru: "Заглушка (обкатка)", uz: "Namuna (sinov)", pl: "Atrapa (testy)" },
  accName: { ru: "Как называть", uz: "Qanday atash", pl: "Nazwa" },
  externalId: {
    ru: "Логин клиента в Директе или номер аккаунта Google",
    uz: "Direct’dagi mijoz logini yoki Google akkaunt raqami",
    pl: "Login klienta w Direct albo numer konta Google",
  },
  externalIdNote: {
    ru: "Директ: логин клиента нужен агентству, своему кабинету — можно пусто. Google: номер вида 123-456-7890.",
    uz: "Direct: mijoz logini agentlikka kerak, o‘z kabinetingiz uchun bo‘sh qoldirsa bo‘ladi. Google: 123-456-7890 ko‘rinishidagi raqam.",
    pl: "Direct: login klienta jest potrzebny agencji, dla własnego konta może być pusty. Google: numer w formacie 123-456-7890.",
  },
  currency: { ru: "Валюта", uz: "Valyuta", pl: "Waluta" },
  sandbox: { ru: "Песочница Директа", uz: "Direct qum qutisi (sandbox)", pl: "Piaskownica Direct" },
  add: { ru: "Добавить", uz: "Qo‘shish", pl: "Dodaj" },
  waiting: {
    ru: (n: number) => `ждут решения: ${n}`,
    uz: (n: number) => `qaror kutmoqda: ${n}`,
    pl: (n: number) => `czeka na decyzję: ${n}`,
  },

  /* ── Состояние кабинета ────────────────────────────────────────────── */
  back: { ru: "← К списку", uz: "← Ro‘yxatga", pl: "← Do listy" },
  statusNew: { ru: "ещё не обновлялся", uz: "hali yangilanmagan", pl: "jeszcze nie odświeżane" },
  statusOk: { ru: "работает", uz: "ishlayapti", pl: "działa" },
  statusError: { ru: "ошибка", uz: "xato", pl: "błąd" },
  statusDisconnected: { ru: "не подключён", uz: "ulanmagan", pl: "niepodłączone" },
  lastSync: {
    ru: (when: string) => `Обновлён: ${when}`,
    uz: (when: string) => `Yangilangan: ${when}`,
    pl: (when: string) => `Odświeżone: ${when}`,
  },
  syncNow: { ru: "Обновить сейчас", uz: "Hozir yangilash", pl: "Odśwież teraz" },
  syncNote: {
    ru: "Заберёт отчёты за 30 дней и напишет предложения. Обычно 1–2 минуты; результат придёт и в Telegram.",
    uz: "30 kunlik hisobotlarni olib, takliflar yozadi. Odatda 1–2 daqiqa; natija Telegram’ga ham keladi.",
    pl: "Pobierze raporty z 30 dni i napisze propozycje. Zwykle 1–2 minuty; wynik przyjdzie też na Telegram.",
  },
  simulate: { ru: "Прокрутить 7 дней", uz: "7 kunni o‘tkazish", pl: "Przewiń 7 dni" },
  connectTitle: { ru: "Подключение", uz: "Ulanish", pl: "Połączenie" },
  connect: { ru: "Подключить", uz: "Ulash", pl: "Połącz" },
  reconnect: { ru: "Подключить заново", uz: "Qayta ulash", pl: "Połącz ponownie" },
  disconnect: { ru: "Отключить доступ", uz: "Ruxsatni o‘chirish", pl: "Odłącz dostęp" },
  connected: {
    ru: "Доступ к кабинету есть. Ключ хранится зашифрованным, его не видит никто, включая студию.",
    uz: "Kabinetga ruxsat bor. Kalit shifrlangan holda saqlanadi, uni hech kim, studiya ham ko‘rmaydi.",
    pl: "Dostęp do konta jest. Klucz jest przechowywany w postaci zaszyfrowanej, nikt go nie widzi, łącznie ze studiem.",
  },
  notConnected: {
    ru: "Доступа нет. «Подключить» откроет страницу Яндекса или Google: войдите в аккаунт с рекламой и разрешите доступ.",
    uz: "Ruxsat yo‘q. «Ulash» Yandex yoki Google sahifasini ochadi: reklama akkauntiga kiring va ruxsat bering.",
    pl: "Brak dostępu. «Połącz» otworzy stronę Yandex lub Google: zaloguj się na konto z reklamami i zezwól na dostęp.",
  },
  stubNote: {
    ru: "Заглушка: учебный центр в Ташкенте с реалистичными данными. Всё меняется по-настоящему, но только здесь, ни одного рекламного кабинета это не касается.",
    uz: "Namuna: Toshkentdagi o‘quv markazi, haqiqatga yaqin ma’lumotlar bilan. Hammasi haqiqatan o‘zgaradi, lekin faqat shu yerda, hech qaysi reklama kabinetiga tegmaydi.",
    pl: "Atrapa: ośrodek szkoleniowy w Taszkencie z realistycznymi danymi. Wszystko zmienia się naprawdę, ale tylko tutaj, żadne konto reklamowe nie jest dotknięte.",
  },

  /* ── Тревоги ───────────────────────────────────────────────────────── */
  alertsTitle: { ru: "Тревоги", uz: "Ogohlantirishlar", pl: "Alarmy" },
  alertsNote: {
    ru: "Проверяются раз в сутки по вчерашнему дню. Каждая приходит в Telegram один раз и пропадает сама, когда причины больше нет.",
    uz: "Kuniga bir marta kechagi kun bo‘yicha tekshiriladi. Har biri Telegram’ga bir marta keladi va sababi yo‘qolganda o‘zi yo‘qoladi.",
    pl: "Sprawdzane raz na dobę za wczorajszy dzień. Każdy przychodzi na Telegram raz i znika sam, gdy przyczyna ustąpi.",
  },

  /* ── Режим и лимиты ────────────────────────────────────────────────── */
  settingsTitle: { ru: "Режим и лимиты", uz: "Rejim va limitlar", pl: "Tryb i limity" },
  mode: { ru: "Режим", uz: "Rejim", pl: "Tryb" },
  modeSuggest: {
    ru: "Предлагаю — вы подтверждаете",
    uz: "Taklif qilaman — siz tasdiqlaysiz",
    pl: "Proponuję — Ty zatwierdzasz",
  },
  modeAuto: {
    ru: "Сам, в пределах лимитов",
    uz: "O‘zim, limitlar doirasida",
    pl: "Sam, w granicach limitów",
  },
  maxShift: {
    ru: "Сдвиг бюджета кампании за раз, % (не больше 30)",
    uz: "Kampaniya byudjetini bir martada siljitish, % (30 dan oshmaydi)",
    pl: "Przesunięcie budżetu kampanii naraz, % (maks. 30)",
  },
  maxActions: {
    ru: "Изменений автопилота в сутки, не больше",
    uz: "Avtopilotning bir kunlik o‘zgarishlari, ko‘pi bilan",
    pl: "Zmian autopilota na dobę, maksymalnie",
  },
  wasteCost: {
    ru: "Деньги без заявки, после которых слово — в минус (0 — по цене заявки)",
    uz: "Arizasiz sarflangan pul, undan keyin so‘z minusga o‘tadi (0 — ariza narxi bo‘yicha)",
    pl: "Wydatek bez zgłoszenia, po którym słowo idzie do wykluczeń (0 — według kosztu zgłoszenia)",
  },
  wasteClicks: { ru: "И не меньше кликов", uz: "Va kamida kliklar", pl: "I co najmniej kliknięć" },
  targetCpa: {
    ru: "Своя цена заявки (пусто — средняя по кабинету)",
    uz: "O‘z ariza narxingiz (bo‘sh — kabinet bo‘yicha o‘rtacha)",
    pl: "Własny koszt zgłoszenia (puste — średnia z konta)",
  },
  protectedWords: {
    ru: "Слова, которые нельзя делать минусом (через запятую): бренд, город, услуга",
    uz: "Minus qilib bo‘lmaydigan so‘zlar (vergul bilan): brend, shahar, xizmat",
    pl: "Słowa, których nie wolno wykluczać (po przecinku): marka, miasto, usługa",
  },
  business: {
    ru: "Что за бизнес — одной-двумя фразами (помогает отличать мусорные запросы)",
    uz: "Qanday biznes — bir-ikki jumlada (keraksiz so‘rovlarni ajratishga yordam beradi)",
    pl: "Jaka to firma — jednym-dwoma zdaniami (pomaga odróżnić śmieciowe zapytania)",
  },
  save: { ru: "Сохранить", uz: "Saqlash", pl: "Zapisz" },
  stopOn: { ru: "Стоп-кран: остановить все изменения", uz: "Stop-kran: barcha o‘zgarishlarni to‘xtatish", pl: "Hamulec: zatrzymaj wszystkie zmiany" },
  stopOff: { ru: "Снять стоп-кран", uz: "Stop-kranni olib tashlash", pl: "Zwolnij hamulec" },
  stopped: {
    ru: "Нажат стоп-кран: автопилот ничего не меняет, кнопка «Принять» тоже не применит. Откатить сделанное можно.",
    uz: "Stop-kran bosilgan: avtopilot hech narsani o‘zgartirmaydi, «Qabul qilish» tugmasi ham qo‘llamaydi. Qilinganni qaytarish mumkin.",
    pl: "Hamulec włączony: autopilot niczego nie zmienia, przycisk «Akceptuj» też nie zastosuje zmian. Cofnąć zrobione można.",
  },
  guards: {
    ru: "Всегда, в любом режиме: общий бюджет не растёт, кампании на обучении не трогаем, минус-слово не задевает ваши ключи, ничего не удаляется.",
    uz: "Har doim, istalgan rejimda: umumiy byudjet oshmaydi, o‘qitilayotgan kampaniyalarga tegilmaydi, minus-so‘z kalit so‘zlaringizga tegmaydi, hech narsa o‘chirilmaydi.",
    pl: "Zawsze, w każdym trybie: łączny budżet nie rośnie, kampanii w trakcie nauki nie ruszamy, wykluczenie nie uderza w Twoje słowa kluczowe, nic nie jest usuwane.",
  },

  /* ── Предложения ───────────────────────────────────────────────────── */
  proposalsTitle: { ru: "Предложения", uz: "Takliflar", pl: "Propozycje" },
  proposalsEmpty: {
    ru: "Сейчас предложений нет. Они появляются после обновления, раз в сутки.",
    uz: "Hozir takliflar yo‘q. Ular yangilanishdan keyin, kuniga bir marta paydo bo‘ladi.",
    pl: "Teraz nie ma propozycji. Pojawiają się po odświeżeniu, raz na dobę.",
  },
  accept: { ru: "Принять", uz: "Qabul qilish", pl: "Akceptuj" },
  reject: { ru: "Отклонить", uz: "Rad etish", pl: "Odrzuć" },
  lastRefusal: {
    ru: (reason: string) => `В прошлый раз не применилось: ${reason}`,
    uz: (reason: string) => `O‘tgan safar qo‘llanmadi: ${reason}`,
    pl: (reason: string) => `Poprzednio nie zastosowano: ${reason}`,
  },
  kindNegatives: { ru: "минус-слова", uz: "minus-so‘zlar", pl: "wykluczenia" },
  kindBudget: { ru: "бюджет", uz: "byudjet", pl: "budżet" },
  kindTest: { ru: "тест объявлений", uz: "e’lonlar testi", pl: "test reklam" },
  kindWinner: { ru: "итог теста", uz: "test natijasi", pl: "wynik testu" },
  testsTitle: { ru: "Идут тесты объявлений", uz: "E’lonlar testlari davom etmoqda", pl: "Trwające testy reklam" },
  testLine: {
    ru: (days: number) => `идёт ${days} ${plural("ru", days, "день", "дня", "дней")}`,
    uz: (days: number) => `${days} kundan beri davom etmoqda`,
    pl: (days: number) => `trwa ${days} ${plural("pl", days, "dzień", "dni", "dni")}`,
  },

  /* ── Журнал ────────────────────────────────────────────────────────── */
  journalTitle: { ru: "Журнал", uz: "Jurnal", pl: "Dziennik" },
  journalEmpty: { ru: "Изменений ещё не было.", uz: "Hali o‘zgarishlar bo‘lmagan.", pl: "Jeszcze nie było zmian." },
  autoBadge: { ru: "сам", uz: "o‘zi", pl: "sam" },
  rollback: { ru: "Откатить", uz: "Qaytarish", pl: "Cofnij" },
  rolledBack: { ru: "откачено", uz: "qaytarilgan", pl: "cofnięte" },
  rollbackBadge: { ru: "откат", uz: "qaytarish", pl: "cofnięcie" },

  /* ── Неделя ────────────────────────────────────────────────────────── */
  weekTitle: { ru: "За 7 дней", uz: "7 kun ichida", pl: "Z 7 dni" },
  weekApplied: { ru: "изменений применено", uz: "o‘zgarish qo‘llandi", pl: "zastosowanych zmian" },
  weekSaved: { ru: "в месяц больше не уходит на мусорные запросы", uz: "oyiga endi keraksiz so‘rovlarga ketmaydi", pl: "miesięcznie nie idzie już na śmieciowe zapytania" },
  weekWaiting: { ru: "ждут решения", uz: "qaror kutmoqda", pl: "czeka na decyzję" },
  sendReport: { ru: "Прислать отчёт недели в Telegram", uz: "Hafta hisobotini Telegram’ga yuborish", pl: "Wyślij raport tygodnia na Telegram" },

  /* ── Итоги действий ────────────────────────────────────────────────── */
  r_saved: { ru: "Сохранено.", uz: "Saqlandi.", pl: "Zapisano." },
  r_applied: { ru: "Применено. Запись — в журнале, откатить можно одной кнопкой.", uz: "Qo‘llandi. Yozuv jurnalda, bir tugma bilan qaytarish mumkin.", pl: "Zastosowano. Wpis jest w dzienniku, cofnąć można jednym przyciskiem." },
  r_refused: { ru: "Не применено:", uz: "Qo‘llanmadi:", pl: "Nie zastosowano:" },
  r_rejected: { ru: "Отклонено.", uz: "Rad etildi.", pl: "Odrzucono." },
  r_rolled: { ru: "Откачено.", uz: "Qaytarildi.", pl: "Cofnięto." },
  r_sync: { ru: "Обновление запущено — через пару минут обновите страницу.", uz: "Yangilash boshlandi — bir-ikki daqiqadan keyin sahifani yangilang.", pl: "Odświeżanie uruchomione — za kilka minut odśwież stronę." },
  r_report: { ru: "Отчёт отправлен в Telegram.", uz: "Hisobot Telegram’ga yuborildi.", pl: "Raport wysłany na Telegram." },
  r_oauth_ok: { ru: "Кабинет подключён.", uz: "Kabinet ulandi.", pl: "Konto podłączone." },
  r_oauth_off: {
    ru: "Подключение ещё не настроено студией: нет ключей приложения Яндекса или Google.",
    uz: "Ulanish hali studiya tomonidan sozlanmagan: Yandex yoki Google ilova kalitlari yo‘q.",
    pl: "Połączenie nie jest jeszcze skonfigurowane przez studio: brak kluczy aplikacji Yandex lub Google.",
  },
  r_oauth_denied: { ru: "Доступ не дали.", uz: "Ruxsat berilmadi.", pl: "Nie udzielono dostępu." },
  r_oauth_failed: { ru: "Подключить не вышло — попробуйте ещё раз.", uz: "Ulab bo‘lmadi — yana urinib ko‘ring.", pl: "Nie udało się połączyć — spróbuj ponownie." },
  r_error: { ru: "Не вышло — попробуйте ещё раз.", uz: "Bo‘lmadi — yana urinib ko‘ring.", pl: "Nie wyszło — spróbuj ponownie." },

  /* ── Вход в кабинет агентства ──────────────────────────────────────── */
  signInTitle: { ru: "Вход в кабинет", uz: "Kabinetga kirish", pl: "Logowanie do konta" },
  signInLead: {
    ru: "Кабинет открывается через Telegram: бот студии пришлёт ссылку для входа. Пускает только тех, кого добавили в кабинет.",
    uz: "Kabinet Telegram orqali ochiladi: studiya boti kirish havolasini yuboradi. Faqat kabinetga qo‘shilganlar kira oladi.",
    pl: "Konto otwiera się przez Telegram: bot studia wyśle link do logowania. Wpuszcza tylko dodane osoby.",
  },
  signIn: { ru: "Войти через Telegram", uz: "Telegram orqali kirish", pl: "Zaloguj przez Telegram" },
  expired: {
    ru: "Ссылка устарела или уже использована. Получите новую — одно нажатие.",
    uz: "Havola eskirgan yoki ishlatilgan. Yangisini oling — bitta bosish.",
    pl: "Link wygasł lub został użyty. Pobierz nowy — jedno kliknięcie.",
  },
  signOut: { ru: "Выйти", uz: "Chiqish", pl: "Wyloguj" },
});
