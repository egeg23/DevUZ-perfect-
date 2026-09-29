import { defineDict } from "@/lib/admin/i18n";

/**
 * Раздел «Касания», инструменты: легенда цифр («Как читать цифры»),
 * автопоиск по картам и прогон своего списка сайтов.
 *
 * Термины — по content/admin-panel/GLOSSARY.md. Названия Google-консоли
 * («Places API (New)», «Credentials») не переводятся: человек ищет их
 * глазами в английском интерфейсе Google.
 */
export const touchLegendDict = defineDict({
  summary: { ru: "Как читать цифры", uz: "Raqamlarni qanday o‘qish kerak", pl: "Jak czytać liczby" },
  searchSample: { ru: "поиск 84", uz: "qidiruv 84", pl: "wyszukiwarka 84" },
  seoTitle: { ru: "Видимость в поиске", uz: "Qidiruvda ko‘rinish", pl: "Widoczność w wyszukiwarce" },
  seoBody: {
    ru: ", от 0 до 100: насколько легко найти сайт в Google и Яндексе. Считается по тому, что мешает поиску: нет описания, нет карты сайта, страницы с одинаковыми заголовками.",
    uz: ", 0 dan 100 gacha: saytni Google va Yandex’da topish qanchalik oson. Qidiruvga nima xalaqit berishiga qarab hisoblanadi: tavsif yo‘q, sayt xaritasi yo‘q, sarlavhalari bir xil sahifalar.",
    pl: ", od 0 do 100: jak łatwo znaleźć stronę w Google i Yandexie. Liczone według tego, co przeszkadza wyszukiwarce: brak opisu, brak mapy strony, strony z jednakowymi tytułami.",
  },
  seoGood: { ru: "80 и выше", uz: "80 va undan yuqori", pl: "80 i więcej" },
  seoGoodTail: { ru: " — в порядке,", uz: " — joyida,", pl: " — w porządku," },
  seoMid: { ru: "50–79", uz: "50–79", pl: "50–79" },
  seoMidTail: { ru: " — есть что поправить,", uz: " — tuzatadigan joyi bor,", pl: " — jest co poprawić," },
  seoLow: { ru: "ниже 50", uz: "50 dan past", pl: "poniżej 50" },
  seoLowTail: {
    ru: " — находят плохо, до 10 — сайт закрыт от поиска.",
    uz: " — yomon topiladi, 10 gacha — sayt qidiruvdan yopilgan.",
    pl: " — słabo widoczna, do 10 — strona zamknięta dla wyszukiwarek.",
  },
  lostTitle: { ru: "Сколько обращений теряется", uz: "Qancha murojaat yo‘qotiladi", pl: "Ile zapytań się traci" },
  lostBody: {
    ru: " из каждых ста человек, которые уже открыли сайт и готовы были написать или позвонить: от 24 до 48. Это наша оценка по найденным проблемам (нет цен, телефон не нажимается, с телефона не читается), а не статистика клиента — так и говорите. С поиском не связано: сайт может хорошо находиться и при этом терять людей.",
    uz: " — saytni ochib, yozish yoki qo‘ng‘iroq qilishga tayyor bo‘lgan har yuz kishidan: 24 dan 48 gacha. Bu topilgan muammolar bo‘yicha bizning bahomiz (narxlar yo‘q, telefon bosilmaydi, telefondan o‘qilmaydi), mijozning statistikasi emas — shunday deb ayting. Qidiruvga bog‘liq emas: sayt yaxshi topilib, shu bilan birga odamlarni yo‘qotishi mumkin.",
    pl: " na każde sto osób, które już otworzyły stronę i były gotowe napisać albo zadzwonić: od 24 do 48. To nasza ocena na podstawie znalezionych problemów (brak cen, telefon nie jest klikalny, strona nieczytelna na telefonie), a nie statystyka klienta — tak to mów. Nie ma związku z wyszukiwarką: strona może być dobrze widoczna i mimo to tracić ludzi.",
  },
  scoreTitle: { ru: "Общая оценка сайта", uz: "Saytning umumiy bahosi", pl: "Ogólna ocena strony" },
  scoreBody: {
    ru: ", от 0 до 100: сто минус 25 за каждую критичную находку, 12 за серьёзную и 5 за мелкую.",
    uz: ", 0 dan 100 gacha: yuzdan har bir jiddiy xavfli topilma uchun 25, jiddiysi uchun 12 va maydasi uchun 5 ayriladi.",
    pl: ", od 0 do 100: sto minus 25 za każde krytyczne znalezisko, 12 za poważne i 5 za drobne.",
  },
  scoreYellow: { ru: "Жёлтым", uz: "Sariq rangda", pl: "Na żółto" },
  scoreTail: {
    ru: " — ниже 60. Ноль — сайт не открылся, и оценить его было нечем. Чем ниже оценка, тем больше честных поводов написать.",
    uz: " — 60 dan past. Nol — sayt ochilmadi va baholashga hech narsa bo‘lmadi. Baho qancha past bo‘lsa, yozish uchun halol sabablar shuncha ko‘p.",
    pl: " — poniżej 60. Zero — strona się nie otworzyła i nie było czego ocenić. Im niższa ocena, tym więcej uczciwych powodów, żeby napisać.",
  },
  critical: { ru: "критично", uz: "jiddiy xavfli", pl: "krytyczne" },
  major: { ru: "серьёзно", uz: "jiddiy", pl: "poważne" },
  minor: { ru: "мелочь", uz: "mayda", pl: "drobne" },
  findingsTitle: { ru: "Находки", uz: "Topilmalar", pl: "Znaleziska" },
  findingsBody: {
    ru: " — что не так на сайте. Цвет рамки — насколько это важно. Наведите курсор или откройте карточку: там написано, чем это оборачивается для клиентов и что мы с этим делаем. Начинайте разговор с находки про клиентов и деньги, а не с технической.",
    uz: " — saytda nima noto‘g‘ri. Ramka rangi — bu qanchalik muhimligi. Kursorni olib boring yoki kartochkani oching: u yerda bu mijozlar uchun nimaga olib kelishi va biz bu bilan nima qilishimiz yozilgan. Suhbatni texnik topilmadan emas, mijozlar va pul haqidagi topilmadan boshlang.",
    pl: " — co jest nie tak na stronie. Kolor ramki mówi, jak bardzo to ważne. Najedź kursorem albo otwórz kartę: tam jest napisane, czym to grozi dla klientów i co z tym robimy. Zaczynaj rozmowę od znaleziska o klientach i pieniądzach, a nie od technicznego.",
  },
  queueSample: {
    ru: (cap: number) => `ушло 1 из ${cap} · в очереди 3`,
    uz: (cap: number) => `${cap} tadan 1 tasi ketdi · navbatda 3 ta`,
    pl: (cap: number) => `wysłano 1 z ${cap} · w kolejce 3`,
  },
  queueTitle: { ru: "Очередь рабочего аккаунта.", uz: "Ishchi akkaunt navbati.", pl: "Kolejka konta firmowego." },
  /** `self` — кнопка «Связался сам» на языке панели. */
  queueBody: {
    ru: (cap: number, self: string) =>
      ` Бот пишет с аккаунта студии не больше ${cap} новых компаний в час — иначе Telegram примет это за рассылку и ограничит аккаунт. «В очереди» — сколько сообщений ждут своей минуты. Письма владельца уходят вне очереди. Не хотите ждать — напишите со своего аккаунта и нажмите «${self}».`,
    uz: (cap: number, self: string) =>
      ` Bot studiya akkauntidan soatiga ${cap} tadan ko‘p bo‘lmagan yangi kompaniyaga yozadi — aks holda Telegram buni ommaviy tarqatma deb hisoblab, akkauntni cheklaydi. «Navbatda» — nechta xabar o‘z daqiqasini kutayotgani. Egasining xatlari navbatsiz ketadi. Kutishni xohlamasangiz — o‘z akkauntingizdan yozing va «${self}» tugmasini bosing.`,
    pl: (cap: number, self: string) =>
      ` Bot pisze z konta studia do najwyżej ${cap} nowych firm na godzinę — inaczej Telegram uzna to za masową wysyłkę i ograniczy konto. «W kolejce» — ile wiadomości czeka na swoją minutę. Wiadomości właściciela wychodzą poza kolejką. Nie chcesz czekać — napisz ze swojego konta i kliknij «${self}».`,
  },
  planSample: {
    ru: "осталось 12 — сделано 18 из 30",
    uz: "12 ta qoldi — 30 tadan 18 tasi bajarildi",
    pl: "zostało 12 — zrobione 18 z 30",
  },
  planTitle: { ru: "План касаний на неделю", uz: "Haftalik aloqalar rejasi", pl: "Tygodniowy plan kontaktów" },
  /** `self` — «Связался сам» на языке панели, `botSelf` — «Написал сам» в боте (он русский). */
  planBody: {
    ru: (self: string, botSelf: string) =>
      ` — его ставит руководитель своим людям или владелец. Считаются касания с понедельника: отправленные ботом и отмеченные «${self}» (в Telegram — «${botSelf}»). Порция дня — это план недели, разложенный по дням: сделали порцию — идёте по плану.`,
    uz: (self: string, botSelf: string) =>
      ` — uni rahbar o‘z xodimlariga yoki egasi qo‘yadi. Dushanbadan beri aloqalar hisoblanadi: bot yuborganlari va «${self}» deb belgilanganlari (Telegram’da — «${botSelf}»). Kunlik to‘plam — kunlarga bo‘lingan haftalik reja: to‘plamni bajardingiz — rejaga muvofiq ketyapsiz.`,
    pl: (self: string, botSelf: string) =>
      ` — ustala go kierownik dla swoich ludzi albo właściciel. Liczą się kontakty od poniedziałku: wysłane przez bota i oznaczone «${self}» (w Telegramie — «${botSelf}»). Porcja dnia to plan tygodnia rozłożony na dni: zrobiłeś porcję — idziesz zgodnie z planem.`,
  },
  statusesLead: { ru: "Статусы карточки: ", uz: "Kartochka holatlari: ", pl: "Statusy karty: " },
  statusNew: { ru: " — ещё никто не касался; ", uz: " — hali hech kim aloqa qilmagan; ", pl: " — nikt jeszcze nie pisał; " },
  statusContacting: {
    ru: " — письмо написано, не отправлено; ",
    uz: " — xat yozilgan, yuborilmagan; ",
    pl: " — wiadomość napisana, niewysłana; ",
  },
  statusSending: { ru: " — ждёт своей минуты у бота; ", uz: " — botda o‘z daqiqasini kutmoqda; ", pl: " — czeka na swoją minutę u bota; " },
  statusSent: {
    ru: " — ушло, ждём ответа, через 3 и 7 дней молчания бот сам напомнит о себе; ",
    uz: " — ketdi, javob kutyapmiz, 3 va 7 kun jimlikdan keyin bot o‘zi eslatib qo‘yadi; ",
    pl: " — wysłane, czekamy na odpowiedź, po 3 i 7 dniach ciszy bot sam się przypomni; ",
  },
  statusManual: {
    ru: " — в Telegram не найти, звоните или пишите в WhatsApp; ",
    uz: " — Telegram’da topib bo‘lmaydi, qo‘ng‘iroq qiling yoki WhatsApp’ga yozing; ",
    pl: " — nie da się znaleźć na Telegramie, dzwoń albo pisz na WhatsAppie; ",
  },
  statusFailed: {
    ru: " — бот не смог доставить, откройте карточку; ",
    uz: " — bot yetkaza olmadi, kartochkani oching; ",
    pl: " — bot nie zdołał dostarczyć, otwórz kartę; ",
  },
  statusSkipped: { ru: " — решили не писать.", uz: " — yozmaslikka qaror qilindi.", pl: " — postanowiono nie pisać." },
  helpMore: { ru: "Подробнее в инструкции", uz: "Batafsil qo‘llanmada", pl: "Więcej w instrukcji" },
});

/** Автопоиск компаний по картам (components/admin/maps-campaigns.tsx). */
export const mapsDict = defineDict({
  created: {
    ru: "Кампания заведена, первый поиск уже прошёл — найденное проверяется в фоне.",
    uz: "Kampaniya yaratildi, birinchi qidiruv o‘tdi — topilganlar fonda tekshirilmoqda.",
    pl: "Kampania utworzona, pierwsze wyszukiwanie już przeszło — znalezione firmy są sprawdzane w tle.",
  },
  ran: {
    ru: "Поиск прошёл — найденное проверяется в фоне и появится в пуле через несколько минут.",
    uz: "Qidiruv o‘tdi — topilganlar fonda tekshirilmoqda va bir necha daqiqadan so‘ng umumiy ro‘yxatda paydo bo‘ladi.",
    pl: "Wyszukiwanie przeszło — znalezione firmy są sprawdzane w tle i za kilka minut pojawią się w puli.",
  },
  cap: {
    ru: "Дневной лимит запросов к картам исчерпан — поиск продолжится завтра в 06:00.",
    uz: "Xaritalarga so‘rovlarning kunlik limiti tugadi — qidiruv ertaga 06:00 da davom etadi.",
    pl: "Dzienny limit zapytań do map wyczerpany — wyszukiwanie ruszy jutro o 06:00.",
  },
  failed: {
    ru: "Google Maps не ответил. Проверьте ключ в .env или попробуйте позже.",
    uz: "Google Maps javob bermadi. .env dagi kalitni tekshiring yoki keyinroq urinib ko‘ring.",
    pl: "Google Maps nie odpowiedział. Sprawdź klucz w .env albo spróbuj później.",
  },
  invalid: { ru: "Нужны ниша и город.", uz: "Nisha va shahar kerak.", pl: "Potrzebne są branża i miasto." },
  gone: { ru: "Такой кампании уже нет.", uz: "Bunday kampaniya endi yo‘q.", pl: "Tej kampanii już nie ma." },
  /** `resume` — кнопка «возобновить» на языке панели. */
  exists: {
    ru: (resume: string) => `Такая кампания уже заведена — она в списке ниже. Если на паузе, нажмите «${resume}».`,
    uz: (resume: string) => `Bunday kampaniya allaqachon bor — u pastdagi ro‘yxatda. Pauzada bo‘lsa, «${resume}» tugmasini bosing.`,
    pl: (resume: string) => `Taka kampania już istnieje — jest na liście poniżej. Jeśli jest wstrzymana, kliknij «${resume}».`,
  },
  title: {
    ru: "Автопоиск компаний по картам",
    uz: "Xaritalar bo‘yicha kompaniyalarni avtoqidirish",
    pl: "Autowyszukiwanie firm na mapach",
  },
  help: { ru: "Как работает автопоиск", uz: "Avtoqidiruv qanday ishlaydi", pl: "Jak działa autowyszukiwanie" },
  usage: {
    ru: (used: number, cap: number) => `запросов сегодня: ${used} из ${cap}`,
    uz: (used: number, cap: number) => `bugungi so‘rovlar: ${cap} tadan ${used} tasi`,
    pl: (used: number, cap: number) => `zapytań dziś: ${used} z ${cap}`,
  },
  pending: {
    ru: (n: number) => ` · ждут проверки: ${n}`,
    uz: (n: number) => ` · tekshiruvni kutmoqda: ${n} ta`,
    pl: (n: number) => ` · czeka na sprawdzenie: ${n}`,
  },
  intro: {
    ru: "Ниша и город — система каждое утро в 06:00 ищет компании на Google Maps, проверяет их сайты и кладёт годные в пул касаний, откуда в 07:00 раздаётся порция дня. Компании без сайта попадают туда же с телефоном с карт — им как раз есть что предложить. Для Ташкента поиск идёт и по районам.",
    uz: "Nisha va shahar — tizim har kuni ertalab 06:00 da Google Maps’dan kompaniyalarni qidiradi, ularning saytlarini tekshiradi va mosini aloqalar ro‘yxatiga qo‘shadi, 07:00 da o‘sha yerdan kunlik to‘plam tarqatiladi. Saytsiz kompaniyalar ham xaritadagi telefon raqami bilan o‘sha yerga tushadi — ularga taklif qiladigan narsamiz aynan bor. Toshkent uchun qidiruv tumanlar bo‘yicha ham o‘tadi.",
    pl: "Branża i miasto — system co rano o 06:00 szuka firm w Google Maps, sprawdza ich strony i odpowiednie wrzuca do puli kontaktów, z której o 07:00 rozdawana jest porcja dnia. Firmy bez strony trafiają tam z telefonem z mapy — im akurat jest co zaproponować. W Taszkencie wyszukiwanie idzie też po dzielnicach.",
  },
  notConnected: {
    ru: "Не подключено. Что нужно сделать один раз:",
    uz: "Ulanmagan. Bir marta nima qilish kerak:",
    pl: "Nie podłączono. Co trzeba zrobić jednorazowo:",
  },
  step1Before: { ru: "В ", uz: "", pl: "W " },
  step1After: {
    ru: " — проект (можно тот же, что для Google Analytics) → включите «Places API (New)». Нужна привязанная карта оплаты: без неё Google API не открывает, но первая тысяча запросов в месяц бесплатна.",
    uz: " da — loyiha (Google Analytics uchun ishlatilgani ham bo‘ladi) → «Places API (New)» ni yoqing. To‘lov kartasi ulangan bo‘lishi kerak: usiz Google API ochmaydi, lekin oyiga birinchi ming so‘rov bepul.",
    pl: " — projekt (może być ten sam co dla Google Analytics) → włącz «Places API (New)». Potrzebna jest podpięta karta płatnicza: bez niej Google nie udostępnia API, ale pierwszy tysiąc zapytań miesięcznie jest darmowy.",
  },
  step2: {
    ru: "«APIs & Services» → «Credentials» → «Create credentials» → «API key». В ограничениях ключа выберите только «Places API (New)».",
    uz: "«APIs & Services» → «Credentials» → «Create credentials» → «API key». Kalit cheklovlarida faqat «Places API (New)» ni tanlang.",
    pl: "«APIs & Services» → «Credentials» → «Create credentials» → «API key». W ograniczeniach klucza wybierz tylko «Places API (New)».",
  },
  step3Before: { ru: "На сервере в ", uz: "Serverda ", pl: "Na serwerze w " },
  step3Key: { ru: "GOOGLE_PLACES_API_KEY=ключ", uz: "GOOGLE_PLACES_API_KEY=kalit", pl: "GOOGLE_PLACES_API_KEY=klucz" },
  step3Middle: { ru: ", затем ", uz: " ga yozing, keyin ", pl: ", potem " },
  step3After: { ru: " или следующая выкатка.", uz: " yoki navbatdagi chiqarish.", pl: " albo następne wdrożenie." },
  capNote: {
    ru: (cap: number, month: number) =>
      `Один запрос — до 20 компаний. Потолок — ${cap} запросов в день, это около ${month} в месяц: внутри бесплатной тысячи.`,
    uz: (cap: number, month: number) =>
      `Bitta so‘rov — 20 tagacha kompaniya. Chegara — kuniga ${cap} ta so‘rov, bu oyiga taxminan ${month} ta: bepul ming ichida.`,
    pl: (cap: number, month: number) =>
      `Jedno zapytanie — do 20 firm. Limit — ${cap} zapytań dziennie, to około ${month} miesięcznie: w ramach darmowego tysiąca.`,
  },
  found: {
    ru: (found: number, added: number) => `найдено ${found} · в пуле ${added}`,
    uz: (found: number, added: number) => `topildi ${found} · ro‘yxatda ${added}`,
    pl: (found: number, added: number) => `znaleziono ${found} · w puli ${added}`,
  },
  exhausted: { ru: " · выдача исчерпана", uz: " · natijalar tugadi", pl: " · wyniki wyczerpane" },
  paused: { ru: " · на паузе", uz: " · pauzada", pl: " · wstrzymana" },
  searchNow: { ru: "искать сейчас", uz: "hozir qidirish", pl: "szukaj teraz" },
  pause: { ru: "пауза", uz: "pauza", pl: "wstrzymaj" },
  resume: { ru: "возобновить", uz: "davom ettirish", pl: "wznów" },
  nichePlaceholder: { ru: "Ниша: стоматология", uz: "Nisha: stomatologiya", pl: "Branża: stomatologia" },
  niche: { ru: "Ниша", uz: "Nisha", pl: "Branża" },
  city: { ru: "Город", uz: "Shahar", pl: "Miasto" },
  /**
   * Город по умолчанию — значение поля, по нему и ищут. Любое из трёх
   * узнаётся как Ташкент (lib/maps/places → поиск по районам).
   */
  cityDefault: { ru: "Ташкент", uz: "Toshkent", pl: "Tashkent" },
  searching: { ru: "Ищем…", uz: "Qidirilmoqda…", pl: "Szukamy…" },
  search: { ru: "Искать", uz: "Qidirish", pl: "Szukaj" },
});

/** Прогон своего списка (components/admin/prospect-runner.tsx). */
export const runnerDict = defineDict({
  noSite: { ru: "У компании нет сайта", uz: "Kompaniyaning sayti yo‘q", pl: "Firma nie ma strony" },
  help: { ru: "Как проверить свой список", uz: "O‘z ro‘yxatingizni qanday tekshirish", pl: "Jak sprawdzić własną listę" },
  nicheLabel: {
    ru: "Ниша — от неё будет написано письмо",
    uz: "Nisha — xat shunga qarab yoziladi",
    pl: "Branża — od niej zależy treść wiadomości",
  },
  nichePlaceholder: {
    ru: "барбершоп, доставка еды, стоматология",
    uz: "barbershop, ovqat yetkazib berish, stomatologiya",
    pl: "barber, dostawa jedzenia, stomatologia",
  },
  nicheWord: { ru: "ниша", uz: "nisha", pl: "branża" },
  nicheHint: {
    ru: (niche: string) =>
      `Одна на весь список. Разбирать нечего — письмо строится на том, что человек ищет «${niche} Ташкент» и находит конкурентов.`,
    uz: (niche: string) =>
      `Butun ro‘yxat uchun bitta. Tahlil qiladigan narsa yo‘q — xat odam «${niche} Toshkent» deb qidirib, raqobatchilarni topishiga asoslanadi.`,
    pl: (niche: string) =>
      `Jedna na całą listę. Nie ma czego analizować — wiadomość opiera się na tym, że klient szuka «${niche} Taszkent» i trafia na konkurencję.`,
  },
  namesLabel: {
    ru: "Названия компаний — по одному в строке.",
    uz: "Kompaniya nomlari — har qatorda bittadan.",
    pl: "Nazwy firm — po jednej w wierszu.",
  },
  sitesLabel: {
    ru: "Список сайтов — по одному в строке. Можно с названием компании рядом.",
    uz: "Saytlar ro‘yxati — har qatorda bittadan. Yoniga kompaniya nomini yozsa ham bo‘ladi.",
    pl: "Lista stron — po jednej w wierszu. Można dopisać obok nazwę firmy.",
  },
  namesPlaceholder: {
    ru: "Barber House\nСалон «Ромашка»\nStudio 5",
    uz: "Barber House\n«Lola» go‘zallik saloni\nStudio 5",
    pl: "Barber House\nSalon «Stokrotka»\nStudio 5",
  },
  sitesPlaceholder: {
    ru: "mebel-tashkent.uz\nООО «Ромашка» — romashka.uz\nhttps://example.uz/, Пример",
    uz: "mebel-tashkent.uz\n«Lola» MChJ — lola.uz\nhttps://example.uz/, Namuna",
    pl: "mebel-tashkent.uz\nStokrotka sp. z o.o. — stokrotka.uz\nhttps://example.uz/, Przykład",
  },
  namesCount: { ru: "Компаний в списке: ", uz: "Ro‘yxatdagi kompaniyalar: ", pl: "Firm na liście: " },
  added: { ru: "Добавлено: ", uz: "Qo‘shildi: ", pl: "Dodano: " },
  addedSkipped: {
    ru: (n: number) => ` · пропущено как уже заведённые: ${n}`,
    uz: (n: number) => ` · allaqachon borligi uchun o‘tkazib yuborildi: ${n}`,
    pl: (n: number) => ` · pominięto jako już dodane: ${n}`,
  },
  recognized: { ru: "Распознано адресов: ", uz: "Aniqlangan manzillar: ", pl: "Rozpoznano adresów: " },
  unparsed: {
    ru: (n: number) => ` · не разобрано строк: ${n}`,
    uz: (n: number) => ` · aniqlanmagan qatorlar: ${n}`,
    pl: (n: number) => ` · nierozpoznanych wierszy: ${n}`,
  },
  tookFirst: {
    ru: (n: number) => ` · взял первые ${n}`,
    uz: (n: number) => ` · birinchi ${n} tasi olindi`,
    pl: (n: number) => ` · wzięto pierwsze ${n}`,
  },
  andMore: {
    ru: (n: number) => `…и ещё ${n}`,
    uz: (n: number) => `…va yana ${n} ta`,
    pl: (n: number) => `…i jeszcze ${n}`,
  },
  adding: { ru: "Добавляю…", uz: "Qo‘shilmoqda…", pl: "Dodaję…" },
  add: {
    ru: (n: number) => `Добавить ${n}`,
    uz: (n: number) => `${n} tasini qo‘shish`,
    pl: (n: number) => `Dodaj ${n}`,
  },
  checking: {
    ru: (done: number, total: number) => `Проверяю… ${done} из ${total}`,
    uz: (done: number, total: number) => `Tekshirilmoqda… ${total} tadan ${done} tasi`,
    pl: (done: number, total: number) => `Sprawdzam… ${done} z ${total}`,
  },
  check: {
    ru: (n: number) => `Проверить ${n}`,
    uz: (n: number) => `${n} tasini tekshirish`,
    pl: (n: number) => `Sprawdź ${n}`,
  },
  letterLang: { ru: "Язык письма", uz: "Xat tili", pl: "Język wiadomości" },
  langRu: { ru: "русский", uz: "ruscha", pl: "rosyjski" },
  langEn: { ru: "английский", uz: "inglizcha", pl: "angielski" },
  exportCsv: { ru: "Выгрузить CSV", uz: "CSV yuklab olish", pl: "Pobierz CSV" },
  saveFailed: {
    ru: "Результаты не сохранились — выгрузите их в файл, иначе они пропадут при обновлении.",
    uz: "Natijalar saqlanmadi — ularni faylga yuklab oling, aks holda sahifa yangilanganda yo‘qoladi.",
    pl: "Wyniki się nie zapisały — pobierz je do pliku, inaczej znikną po odświeżeniu.",
  },
  worth: { ru: "есть о чём написать: ", uz: "yozishga arziydi: ", pl: "jest o czym pisać: " },
  worthOf: {
    ru: (n: number) => ` из ${n}`,
    uz: (n: number) => ` / ${n}`,
    pl: (n: number) => ` z ${n}`,
  },
  whatWeDo: { ru: "Что делаем:", uz: "Nima qilamiz:", pl: "Co robimy:" },
  whereToWrite: { ru: "Куда написать", uz: "Qayerga yozish", pl: "Gdzie napisać" },
  contactsPage: { ru: "страница контактов", uz: "kontaktlar sahifasi", pl: "strona kontaktowa" },
  noContacts: {
    ru: "Контактов на сайте не нашлось — ни телефона, ни почты, ни мессенджера. Для владельца это отдельная беда, а для нас — повод написать через форму на сайте.",
    uz: "Saytda kontaktlar topilmadi — na telefon, na pochta, na messenjer. Sayt egasi uchun bu alohida muammo, biz uchun esa saytdagi forma orqali yozishga sabab.",
    pl: "Na stronie nie znaleziono kontaktów — ani telefonu, ani e-maila, ani komunikatora. Dla właściciela to osobny problem, a dla nas pretekst, żeby napisać przez formularz na stronie.",
  },
  copied: { ru: "Скопировано", uz: "Nusxalandi", pl: "Skopiowano" },
  copyDraft: { ru: "Скопировать черновик", uz: "Qoralamani nusxalash", pl: "Kopiuj szkic" },
  chunkFailed: {
    ru: "проверка сорвалась — попробуйте эти адреса ещё раз",
    uz: "tekshiruv uzilib qoldi — bu manzillarni yana bir bor sinab ko‘ring",
    pl: "sprawdzanie się nie powiodło — spróbuj tych adresów jeszcze raz",
  },
  // Заголовки столбцов CSV
  csvLine: { ru: "Строка", uz: "Qator", pl: "Wiersz" },
  csvUrl: { ru: "Адрес", uz: "Manzil", pl: "Adres" },
  csvCompany: { ru: "Компания", uz: "Kompaniya", pl: "Firma" },
  csvScore: { ru: "Балл", uz: "Ball", pl: "Wynik" },
  csvPhones: { ru: "Телефоны", uz: "Telefonlar", pl: "Telefony" },
  csvEmail: { ru: "Почта", uz: "Pochta", pl: "E-mail" },
  csvFindings: { ru: "Находки", uz: "Topilmalar", pl: "Znaleziska" },
  csvDraft: { ru: "Черновик", uz: "Qoralama", pl: "Szkic" },
  csvNote: { ru: "Примечание", uz: "Izoh", pl: "Uwagi" },
});
