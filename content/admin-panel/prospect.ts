import { defineDict, plural } from "@/lib/admin/i18n";

/**
 * Раздел «Касания» (/admin/prospect): страница, порция дня, поток и список
 * «Разобранные сайты». Легенда цифр, автопоиск и прогон списка — в
 * prospect-tools.ts.
 *
 * Термины — по content/admin-panel/GLOSSARY.md: касание — aloqa / kontakt,
 * порция дня — kunlik to‘plam / porcja dnia, поток — oqim / strumień.
 *
 * Чего здесь нет и не будет: текста писем клиенту (он на языке клиента) и
 * кнопок бота — бот пока русский, и их названия подставляются строками из
 * lib (BOT_BUTTON, STREAM_ON), а не переводятся.
 */
export const prospectPageDict = defineDict({
  title: { ru: "Холодные касания", uz: "Sovuq aloqalar", pl: "Zimne kontakty" },
  intro: {
    ru: "Тот же аудитор, что на публичной странице, но по списку. На выходе не баллы, а черновик первого сообщения по каждому сайту — построенный вокруг одной находки, которую адресат может пойти и проверить сам.",
    uz: "Ochiq sahifadagi auditorning o‘zi, faqat ro‘yxat bo‘yicha ishlaydi. Natijada ball emas, har bir sayt uchun birinchi xabar qoralamasi chiqadi — u bitta topilma atrofida qurilgan, uni adresat o‘zi borib tekshira oladi.",
    pl: "Ten sam audytor co na stronie publicznej, tylko dla całej listy. Na wyjściu nie ma punktów, jest szkic pierwszej wiadomości do każdej strony — zbudowany wokół jednego znaleziska, które adresat może sam sprawdzić.",
  },

  // Порция дня
  portionHead: {
    ru: (done: number, target: number) => `Ваша порция на сегодня: сделано ${done} из ${target}`,
    uz: (done: number, target: number) => `Bugungi kunlik to‘plamingiz: ${target} tadan ${done} tasi bajarildi`,
    pl: (done: number, target: number) => `Twoja porcja dnia: zrobione ${done} z ${target}`,
  },
  portionHelp: { ru: "Как работает порция дня", uz: "Kunlik to‘plam qanday ishlaydi", pl: "Jak działa porcja dnia" },
  noSiteCompany: { ru: "Компания без сайта", uz: "Saytsiz kompaniya", pl: "Firma bez strony" },
  replacement: { ru: "замена", uz: "almashtiruv", pl: "zamiana" },
  stateSkipped: { ru: "не подошла", uz: "mos kelmadi", pl: "nie pasuje" },
  stateDone: { ru: "сделано", uz: "bajarildi", pl: "zrobione" },
  stateReady: { ru: "текст готов", uz: "matn tayyor", pl: "tekst gotowy" },
  statePreparing: { ru: "текст готовится", uz: "matn tayyorlanmoqda", pl: "tekst w przygotowaniu" },
  /** `skip` — кнопка бота «Не подходит», как её видно в Telegram. */
  portionRules: {
    ru: (limit: number, skip: string) =>
      `В счёт идут «Отправить» и «Связался сам». «${skip}» не в счёт — вместо неё сразу выдаётся замена, до ${limit} в день.`,
    uz: (limit: number, skip: string) =>
      `Hisobga «Yuborish» va «O‘zim bog‘landim» kiradi. Botdagi «${skip}» hisobga kirmaydi — uning o‘rniga darhol almashtiruv beriladi, kuniga ${limit} tagacha.`,
    pl: (limit: number, skip: string) =>
      `Liczą się «Wyślij» i «Skontaktowano samodzielnie». «${skip}» w bocie się nie liczy — w zamian od razu przychodzi zamiana, do ${limit} dziennie.`,
  },
  portionShort: {
    ru: (n: number) => ` Без замены: ${n} — в пуле пусто или замены на сегодня кончились.`,
    uz: (n: number) => ` Almashtiruvsiz: ${n} ta — umumiy ro‘yxat bo‘sh yoki bugungi almashtiruvlar tugadi.`,
    pl: (n: number) => ` Bez zamiany: ${n} — pula jest pusta albo zamiany na dziś się skończyły.`,
  },
  portionReturn: {
    ru: "Что не сделано до 18:00, вернётся в общий пул.",
    uz: "18:00 gacha bajarilmagani umumiy ro‘yxatga qaytadi.",
    pl: "Co nie zostanie zrobione do 18:00, wróci do wspólnej puli.",
  },

  // Поток «Получать лиды»
  streamHead: {
    ru: (state: string, n: number) => `Поток лидов: ${state} · сегодня касаний ${n}`,
    uz: (state: string, n: number) => `Lidlar oqimi: ${state} · bugun aloqalar: ${n}`,
    pl: (state: string, n: number) => `Strumień leadów: ${state} · dziś kontaktów: ${n}`,
  },
  streamOn: { ru: "включён", uz: "yoqilgan", pl: "włączony" },
  streamOff: { ru: "выключен", uz: "o‘chirilgan", pl: "wyłączony" },
  streamHelp: { ru: "Как работает поток", uz: "Oqim qanday ishlaydi", pl: "Jak działa strumień" },
  /** `on` / `off` — кнопки бота, как их видно в Telegram. */
  streamNote: {
    ru: (on: string, off: string, buffer: number) =>
      `Включается и выключается в Telegram: кнопка «${on}» / «${off}» внизу чата с ботом или команда /leads. Компании приходят по одной, неразобранных — не больше ${buffer}; по будням с 9:00 до 18:00, после порции. Поток — сверх порции и в её счёт не идёт; несделанное в 18:00 вернётся в пул.`,
    uz: (on: string, off: string, buffer: number) =>
      `Telegram’da yoqiladi va o‘chiriladi: bot chatining pastidagi «${on}» / «${off}» tugmasi yoki /leads buyrug‘i. Kompaniyalar bittadan keladi, ko‘rib chiqilmaganlari ${buffer} tadan oshmaydi; ish kunlari 9:00 dan 18:00 gacha, kunlik to‘plamdan keyin. Oqim kunlik to‘plamdan tashqari, uning hisobiga kirmaydi; 18:00 gacha bajarilmagani umumiy ro‘yxatga qaytadi.`,
    pl: (on: string, off: string, buffer: number) =>
      `Włącza się i wyłącza w Telegramie: przycisk «${on}» / «${off}» na dole czatu z botem albo komenda /leads. Firmy przychodzą pojedynczo, nieobsłużonych jest najwyżej ${buffer}; w dni robocze od 9:00 do 18:00, po porcji dnia. Strumień jest ponad porcję i nie wlicza się do niej; czego nie zrobiono do 18:00, wraca do puli.`,
  },

  // Подвал страницы
  footListTitle: { ru: "Список приносите вы.", uz: "Ro‘yxatni siz olib kelasiz.", pl: "Listę przynosicie wy." },
  footList: {
    ru: "Инструмент не обходит чужие каталоги и не выгружает базы: он открывает публичный сайт компании ровно так же, как его открывает любой посетитель. Там, где начинается выгрузка чужих баз, начинаются правила, которые мы не проверяли.",
    uz: "Vosita begona kataloglarni aylanib chiqmaydi va bazalarni yuklab olmaydi: u kompaniyaning ochiq saytini har qanday tashrif buyuruvchi kabi ochadi. Begona bazalarni yuklab olish boshlangan joyda biz tekshirmagan qoidalar boshlanadi.",
    pl: "Narzędzie nie przeszukuje cudzych katalogów i nie pobiera baz: otwiera publiczną stronę firmy dokładnie tak, jak otwiera ją każdy odwiedzający. Tam, gdzie zaczyna się pobieranie cudzych baz, zaczynają się przepisy, których nie sprawdzaliśmy.",
  },
  footEmptyTitle: {
    ru: "Пустая строка вместо черновика — это результат.",
    uz: "Qoralama o‘rnida bo‘sh qator — bu ham natija.",
    pl: "Pusty wiersz zamiast szkicu — to też wynik.",
  },
  footEmpty: {
    ru: "Если к сайту нет претензий, писать не о чем, и придумывать повод не надо: касание без содержания портит и адресата, и того, кто пишет.",
    uz: "Saytga e’tiroz bo‘lmasa, yozadigan narsa yo‘q va bahona o‘ylab topish shart emas: mazmunsiz aloqa adresatni ham, yozayotganni ham buzadi.",
    pl: "Jeśli do strony nie ma zastrzeżeń, nie ma o czym pisać i nie trzeba wymyślać pretekstu: kontakt bez treści psuje i adresata, i piszącego.",
  },
  footFewerTitle: {
    ru: "Находок стало меньше, и это к лучшему.",
    uz: "Topilmalar kamaydi va bu yaxshi.",
    pl: "Znalezisk jest mniej i to dobrze.",
  },
  footFewer: {
    ru: "Аудитор читает то, что отдал сервер. Если сайт собирается уже в браузере — а так устроена половина новых сайтов, — по проводу приходит пустая заготовка, и «нет телефона» означало бы только то, что мы его не увидели. Такие претензии больше не выписываются: вместо них одна проверяемая — сколько слов получил поисковик. Владелец проверяет её за минуту, открыв просмотр кода своей страницы.",
    uz: "Auditor server bergan narsani o‘qiydi. Agar sayt brauzerning o‘zida yig‘ilsa — yangi saytlarning yarmi shunday ishlaydi, — bo‘sh shablon keladi va «telefon yo‘q» degani faqat biz uni ko‘rmaganimizni bildirardi. Bunday e’tirozlar endi yozilmaydi: ularning o‘rniga bitta tekshirsa bo‘ladigani — qidiruv tizimi nechta so‘z olgani. Sayt egasi buni o‘z sahifasining kodini ochib, bir daqiqada tekshiradi.",
    pl: "Audytor czyta to, co oddał serwer. Jeśli strona składa się dopiero w przeglądarce — a tak działa połowa nowych stron — przychodzi pusty szablon i „brak telefonu” znaczyłby tylko tyle, że go nie zobaczyliśmy. Takich zastrzeżeń już nie wypisujemy: zamiast nich jest jedno sprawdzalne — ile słów dostała wyszukiwarka. Właściciel sprawdzi to w minutę, otwierając podgląd kodu swojej strony.",
  },
  footDraftTitle: {
    ru: "Черновик — это черновик.",
    uz: "Qoralama — bu qoralama.",
    pl: "Szkic to tylko szkic.",
  },
  footDraft: {
    ru: (cap: number) =>
      `Прочитайте его перед отправкой и поправьте под человека. За один прогон — не больше ${cap} адресов; внутри прогона сайты проверяются по одному, чтобы не стучаться к десятку сразу.`,
    uz: (cap: number) =>
      `Yuborishdan oldin uni o‘qib chiqing va odamga moslab tuzating. Bir tekshiruvda — ${cap} tadan ko‘p bo‘lmagan manzil; tekshiruv ichida saytlar bittadan tekshiriladi, bir vaqtda o‘ntasiga murojaat qilmaslik uchun.`,
    pl: (cap: number) =>
      `Przeczytaj go przed wysłaniem i dopasuj do człowieka. W jednym przebiegu — najwyżej ${cap} adresów; w trakcie strony sprawdzane są po kolei, żeby nie pukać do dziesięciu naraz.`,
  },
});

/** Статус карточки — подпись рядом с адресом сайта. */
export const prospectStatusDict = defineDict({
  new: { ru: "не писали", uz: "yozilmagan", pl: "bez kontaktu" },
  contacting: { ru: "сообщение готово", uz: "xabar tayyor", pl: "wiadomość gotowa" },
  sending: { ru: "в очереди на отправку", uz: "yuborish navbatida", pl: "w kolejce do wysłania" },
  sent: { ru: "отправлено", uz: "yuborildi", pl: "wysłano" },
  failed: { ru: "не ушло", uz: "yuborilmadi", pl: "nie wysłano" },
  skipped: { ru: "пропущен", uz: "o‘tkazib yuborilgan", pl: "pominięto" },
  manual: { ru: "писать руками", uz: "qo‘lda yozish", pl: "napisz ręcznie" },
});

/** «Клиент отказался» / «Игнорирует»: кнопка (со значком, как в боте) и подпись на карточке. */
export const closeButtonDict = defineDict({
  refused: { ru: "🙅 Клиент отказался", uz: "🙅 Mijoz rad etdi", pl: "🙅 Klient odmówił" },
  ignored: { ru: "🔇 Игнорирует", uz: "🔇 Javob bermayapti", pl: "🔇 Ignoruje" },
});

export const closeLabelDict = defineDict({
  refused: { ru: "клиент отказался", uz: "mijoz rad etdi", pl: "klient odmówił" },
  ignored: { ru: "игнорирует", uz: "javob bermayapti", pl: "ignoruje" },
});

/** Почему писать нельзя (lib/admin/outreach → canContact). */
export const reasonDict = defineDict({
  no_way: {
    ru: "Ни телеграма, ни телефона — связаться нечем. Остаётся почта, и её мы отсюда не шлём.",
    uz: "Na Telegram, na telefon bor — bog‘lanishning iloji yo‘q. Faqat pochta qoladi, uni esa bu yerdan yubormaymiz.",
    pl: "Ani Telegrama, ani telefonu — nie ma jak się skontaktować. Zostaje e-mail, a tego stąd nie wysyłamy.",
  },
  nothing_to_say: {
    ru: "К сайту нет претензий: писать не о чем, и придумывать повод не надо.",
    uz: "Saytga e’tiroz yo‘q: yozadigan narsa yo‘q, bahona o‘ylab topish shart emas.",
    pl: "Do strony nie ma zastrzeżeń: nie ma o czym pisać i nie trzeba wymyślać pretekstu.",
  },
  already: {
    ru: "Этому сайту уже писали. Второе касание — это рассылка.",
    uz: "Bu saytga allaqachon yozilgan. Ikkinchi aloqa — bu ommaviy tarqatma.",
    pl: "Do tej strony już pisaliśmy. Drugi kontakt to już masowa wysyłka.",
  },
});

/** Куда пойдёт письмо (lib/admin/outreach → routeFor). */
export const routeDict = defineDict({
  handle: {
    ru: "Пишем в телеграм по адресу с сайта.",
    uz: "Saytdagi manzil bo‘yicha Telegram’ga yozamiz.",
    pl: "Piszemy na Telegramie na adres ze strony.",
  },
  phone: {
    ru: "Телеграма на сайте нет. Скаут добавит номер в контакты — телеграм часто находит по нему аккаунт — и напишет туда. Не найдёт: карточка вернётся к вам, писать придётся руками.",
    uz: "Saytda Telegram yo‘q. Skaut raqamni kontaktlarga qo‘shadi — Telegram ko‘pincha u orqali akkauntni topadi — va o‘sha yerga yozadi. Topmasa, kartochka sizga qaytadi va qo‘lda yozishga to‘g‘ri keladi.",
    pl: "Na stronie nie ma Telegrama. Skaut doda numer do kontaktów — Telegram często znajduje po nim konto — i tam napisze. Jeśli nie znajdzie, karta wróci do ciebie i trzeba będzie napisać ręcznie.",
  },
  manual: {
    ru: "Автономно писать некуда: телеграма нет. Позвоните или напишите в WhatsApp, а потом отметьте это здесь — дальше переписку подхватит модель.",
    uz: "Avtomatik yozadigan joy yo‘q: Telegram yo‘q. Qo‘ng‘iroq qiling yoki WhatsApp’ga yozing, keyin buni shu yerda belgilang — yozishmani keyin SI davom ettiradi.",
    pl: "Nie ma dokąd pisać automatycznie: brak Telegrama. Zadzwoń albo napisz na WhatsAppie, a potem zaznacz to tutaj — dalej korespondencję przejmie AI.",
  },
});

/** Подсказка у балла видимости в поиске (lib/audit/seo → grade). */
export const seoGradeDict = defineDict({
  good: { ru: "Для поиска всё в порядке", uz: "Qidiruv uchun hammasi joyida", pl: "Dla wyszukiwarki wszystko w porządku" },
  fixable: { ru: "Есть что поправить", uz: "Tuzatadigan joyi bor", pl: "Jest co poprawić" },
  poor: { ru: "В поиске вас находят плохо", uz: "Qidiruvda yomon topiladi", pl: "Słabo widoczna w wyszukiwarce" },
  blocked: { ru: "Сайта в поиске нет", uz: "Sayt qidiruvda yo‘q", pl: "Strony nie ma w wyszukiwarce" },
});

/**
 * Отказы кнопок — по кодам из lib/admin/touch-errors.ts. Причины «писать
 * нельзя» (no_way, nothing_to_say, already) — в reasonDict.
 */
export const touchErrorDict = defineDict({
  db: { ru: "База недоступна.", uz: "Baza mavjud emas.", pl: "Baza danych jest niedostępna." },
  gone: {
    ru: "Такого сайта в списке уже нет.",
    uz: "Bunday sayt ro‘yxatda endi yo‘q.",
    pl: "Tej strony nie ma już na liście.",
  },
  touch_gone: { ru: "Такого касания уже нет.", uz: "Bunday aloqa endi yo‘q.", pl: "Tego kontaktu już nie ma." },
  no_key: {
    ru: "Нет ключа модели — сообщение некому написать.",
    uz: "SI kaliti yo‘q — xabarni yozadigan hech kim yo‘q.",
    pl: "Brak klucza AI — nie ma komu napisać wiadomości.",
  },
  no_niche: {
    ru: "Не записана ниша — писать не от чего.",
    uz: "Nisha yozilmagan — nimadan kelib chiqib yozishga asos yo‘q.",
    pl: "Nie wpisano branży — nie ma od czego zacząć wiadomości.",
  },
  not_verified: {
    ru: "Не получилось перепроверить сайт по факту: второй раз он не открылся. Без проверки письмо не пишется — попробуйте через несколько минут.",
    uz: "Saytni fakt bo‘yicha qayta tekshirib bo‘lmadi: ikkinchi marta ochilmadi. Tekshiruvsiz xat yozilmaydi — bir necha daqiqadan keyin urinib ko‘ring.",
    pl: "Nie udało się sprawdzić strony na faktach: za drugim razem się nie otworzyła. Bez sprawdzenia wiadomość nie powstaje — spróbuj za kilka minut.",
  },
  nothing_confirmed: {
    ru: "Проверка по факту не подтвердила ни одной находки — писать владельцу не о чем.",
    uz: "Fakt bo‘yicha tekshiruv birorta ham topilmani tasdiqlamadi — egasiga yozadigan narsa yo‘q.",
    pl: "Sprawdzenie na faktach nie potwierdziło żadnego znaleziska — nie ma o czym pisać do właściciela.",
  },
  model_empty: {
    ru: "Модель не вернула сообщение.",
    uz: "SI xabar qaytarmadi.",
    pl: "AI nie zwróciło wiadomości.",
  },
  model_billing: {
    ru: "На ключе модели кончились деньги. Пополните баланс в Anthropic Console — всё заработает само, выкатывать ничего не нужно.",
    uz: "SI kalitida pul tugadi. Anthropic Console’da balansni to‘ldiring — hammasi o‘zi ishlab ketadi, hech narsani qayta chiqarish shart emas.",
    pl: "Na kluczu AI skończyły się środki. Doładuj saldo w Anthropic Console — wszystko zadziała samo, nic nie trzeba wdrażać.",
  },
  model_auth: {
    ru: "Ключ модели не принят. Проверьте ANTHROPIC_API_KEY на сервере.",
    uz: "SI kaliti qabul qilinmadi. Serverdagi ANTHROPIC_API_KEY ni tekshiring.",
    pl: "Klucz AI został odrzucony. Sprawdź ANTHROPIC_API_KEY na serwerze.",
  },
  model_limit: {
    ru: "Модель отказывает по частоте запросов. Подождите минуту и повторите.",
    uz: "SI so‘rovlar juda tez-tezligi sababli rad etmoqda. Bir daqiqa kutib, qayta urinib ko‘ring.",
    pl: "AI odrzuca zapytania z powodu limitu częstotliwości. Odczekaj minutę i spróbuj ponownie.",
  },
  model_down: {
    ru: "Модель временно недоступна — это на стороне поставщика. Повторите через несколько минут.",
    uz: "SI vaqtincha ishlamayapti — bu yetkazib beruvchi tomonida. Bir necha daqiqadan keyin qayta urinib ko‘ring.",
    pl: "AI jest chwilowo niedostępne — to po stronie dostawcy. Spróbuj ponownie za kilka minut.",
  },
  problems: {
    ru: "Проверка не пропустила текст.",
    uz: "Tekshiruv matnni o‘tkazmadi.",
    pl: "Kontrola nie przepuściła tekstu.",
  },
  queue_failed: {
    ru: "Не получилось поставить в очередь.",
    uz: "Navbatga qo‘yib bo‘lmadi.",
    pl: "Nie udało się dodać do kolejki.",
  },
  already_marked: {
    ru: "По этой карточке касание уже отмечено.",
    uz: "Bu kartochka bo‘yicha aloqa allaqachon belgilangan.",
    pl: "Kontakt dla tej karty jest już oznaczony.",
  },
  mark_failed: { ru: "Не получилось отметить.", uz: "Belgilab bo‘lmadi.", pl: "Nie udało się oznaczyć." },
  bot_sent: {
    ru: "Бот уже отправил это письмо — отмечать не нужно.",
    uz: "Bot bu xatni allaqachon yuborgan — belgilash shart emas.",
    pl: "Bot już wysłał tę wiadomość — nie trzeba jej oznaczać.",
  },
  empty_answer: {
    ru: "Пустой ответ записывать нечего.",
    uz: "Bo‘sh javobni yozib qo‘yib bo‘lmaydi.",
    pl: "Pustej odpowiedzi nie ma co zapisywać.",
  },
  own_message: {
    ru: "Это наше же сообщение. Вставьте то, что ответил клиент.",
    uz: "Bu o‘zimizning xabarimiz. Mijoz nima deb javob berganini qo‘ying.",
    pl: "To nasza własna wiadomość. Wklej to, co odpisał klient.",
  },
  unknown_reason: { ru: "Неизвестная причина.", uz: "Noma’lum sabab.", pl: "Nieznany powód." },
  closed_refused: {
    ru: "Уже отмечено: клиент отказался.",
    uz: "Allaqachon belgilangan: mijoz rad etdi.",
    pl: "Już oznaczono: klient odmówił.",
  },
  closed_ignored: {
    ru: "Уже отмечено: игнорирует.",
    uz: "Allaqachon belgilangan: javob bermayapti.",
    pl: "Już oznaczono: ignoruje.",
  },
  already_closed: { ru: "Уже отмечено.", uz: "Allaqachon belgilangan.", pl: "Już oznaczono." },
  still_queued: {
    ru: "Письмо ещё в очереди бота — отметьте, когда оно уйдёт.",
    uz: "Xat hali bot navbatida — u ketgach belgilang.",
    pl: "Wiadomość jest jeszcze w kolejce bota — oznacz, gdy wyjdzie.",
  },
  not_touched: {
    ru: "Сначала отметьте касание: «Связался сам» или «Отправить».",
    uz: "Avval aloqani belgilang: «O‘zim bog‘landim» yoki «Yuborish».",
    pl: "Najpierw oznacz kontakt: «Skontaktowano samodzielnie» albo «Wyślij».",
  },
  not_yours: {
    ru: "Это касание ведёт другой сотрудник.",
    uz: "Bu aloqani boshqa xodim olib boryapti.",
    pl: "Ten kontakt prowadzi inny pracownik.",
  },
  defect: {
    ru: "Что-то сломалось. Текст ошибки — для того, кто чинит:",
    uz: "Nimadir buzildi. Xato matni — tuzatadigan odam uchun:",
    pl: "Coś się zepsuło. Treść błędu — dla tego, kto naprawia:",
  },
});

/**
 * Что не даёт отправить письмо — по коду проблемы из messageProblems /
 * nositeProblems. Числа и имена приходят в `args` (lib/admin/outreach).
 * Цитаты вроде «в топ» — это слова в письме клиенту, а не в панели.
 */
export const problemDict = defineDict({
  short: {
    ru: (min: number) => `Сообщение короче ${min} слов — в нём не поместится ни находка, ни её последствие.`,
    uz: (min: number) => `Xabar ${min} so‘zdan qisqa — unga na topilma, na uning oqibati sig‘adi.`,
    pl: (min: number) => `Wiadomość ma mniej niż ${min} słów — nie zmieści się w niej ani znalezisko, ani jego skutek.`,
  },
  long: {
    ru: (max: number) => `Сообщение длиннее ${max} слов — на телефоне такое не читают.`,
    uz: (max: number) => `Xabar ${max} so‘zdan uzun — telefonda bunday matnni o‘qishmaydi.`,
    pl: (max: number) => `Wiadomość ma ponad ${max} słów — na telefonie nikt tego nie czyta.`,
  },
  no_host: {
    ru: (host: string) => `В сообщении нет домена ${host} — адресат не поймёт, что письмо про его сайт.`,
    uz: (host: string) => `Xabarda ${host} domeni yo‘q — adresat xat uning sayti haqida ekanini tushunmaydi.`,
    pl: (host: string) => `W wiadomości nie ma domeny ${host} — adresat nie zrozumie, że chodzi o jego stronę.`,
  },
  no_us: {
    ru: "В сообщении нет devuz.studio — непонятно, кто пишет.",
    uz: "Xabarda devuz.studio yo‘q — kim yozayotgani tushunarsiz.",
    pl: "W wiadomości nie ma devuz.studio — nie wiadomo, kto pisze.",
  },
  invented: {
    ru: (numbers: string) => `Числа, которых нет в анализе: ${numbers}. Проверьте или уберите.`,
    uz: (numbers: string) => `Tahlilda yo‘q raqamlar: ${numbers}. Tekshiring yoki olib tashlang.`,
    pl: (numbers: string) => `Liczby, których nie ma w analizie: ${numbers}. Sprawdź albo usuń.`,
  },
  foreign_script: {
    ru: (chars: string) => `В сообщении есть знаки чужого письма: ${chars}. Уберите их — это сбой модели, а не текст.`,
    uz: (chars: string) => `Xabarda begona yozuv belgilari bor: ${chars}. Ularni olib tashlang — bu SI xatosi, matn emas.`,
    pl: (chars: string) => `W wiadomości są znaki obcego pisma: ${chars}. Usuń je — to błąd AI, a nie tekst.`,
  },
  jargon: {
    ru: (words: string) =>
      `В письме технические слова: ${words}. Владелец бизнеса их не знает — скажите то же самое тем, что видит и делает его покупатель.`,
    uz: (words: string) =>
      `Xatda texnik so‘zlar bor: ${words}. Biznes egasi ularni bilmaydi — xuddi shuni uning xaridori ko‘radigan va qiladigan narsa orqali ayting.`,
    pl: (words: string) =>
      `W wiadomości są słowa techniczne: ${words}. Właściciel firmy ich nie zna — powiedz to samo przez to, co widzi i robi jego klient.`,
  },
  not_checked: {
    ru: "Сайт не перепроверен по факту перед этим письмом — нажмите «Связаться», чтобы проверить его заново и написать письмо по тому, что есть сейчас.",
    uz: "Sayt bu xatdan oldin fakt bo‘yicha qayta tekshirilmagan — uni qaytadan tekshirib, hozirgi holat bo‘yicha xat yozish uchun «Bog‘lanish» tugmasini bosing.",
    pl: "Strona nie została sprawdzona na faktach przed tą wiadomością — kliknij «Skontaktuj się», żeby sprawdzić ją od nowa i napisać wiadomość według tego, co jest teraz.",
  },
  greets_sender: {
    ru: (name: string) =>
      `Письмо здоровается с клиентом именем «${name}» — так зовут того, кто пишет, а имени клиента мы не знаем. Поздоровайтесь без имени.`,
    uz: (name: string) =>
      `Xat mijoz bilan «${name}» ismi bilan salomlashadi — bu yozayotgan odamning ismi, mijozning ismini esa bilmaymiz. Ismsiz salomlashing.`,
    pl: (name: string) =>
      `Wiadomość wita klienta imieniem «${name}» — tak ma na imię nadawca, a imienia klienta nie znamy. Przywitaj się bez imienia.`,
  },
  banned: {
    ru: "В сообщении есть обещание или знак, которых в первом касании быть не должно: «в топ», «гарантируем», любые проценты, «комплексный подход», эмодзи.",
    uz: "Xabarda birinchi aloqada bo‘lmasligi kerak bo‘lgan va’da yoki belgi bor: «top»ga chiqarish, «kafolat», har qanday foizlar, «kompleks yondashuv», emoji.",
    pl: "W wiadomości jest obietnica albo znak, których w pierwszym kontakcie być nie może: «do topu», «gwarantujemy», jakiekolwiek procenty, «kompleksowe podejście», emoji.",
  },
  no_seo_score: {
    ru: (score: number) =>
      `В сообщении не назван балл видимости в поиске (${score} из 100) — а это первое, за что цепляется взгляд.`,
    uz: (score: number) =>
      `Xabarda qidiruvdagi ko‘rinish bali (100 dan ${score}) aytilmagan — ko‘z birinchi bo‘lib aynan shunga tushadi.`,
    pl: (score: number) =>
      `W wiadomości nie podano wyniku widoczności w wyszukiwarce (${score} na 100) — a to pierwsze, na czym zatrzymuje się wzrok.`,
  },
  no_loss: {
    ru: (from: number, to: number) =>
      `В сообщении не сказано, сколько обращений это стоит (${from}–${to} из ста). Без этого письмо читается как список придирок.`,
    uz: (from: number, to: number) =>
      `Xabarda bu qancha murojaatga tushishi aytilmagan (yuztadan ${from}–${to}). Busiz xat mayda-chuyda e’tirozlar ro‘yxatiday o‘qiladi.`,
    pl: (from: number, to: number) =>
      `W wiadomości nie napisano, ile zapytań to kosztuje (${from}–${to} na sto). Bez tego wiadomość brzmi jak lista czepialstw.`,
  },
  foreign_reference: {
    ru: (names: string) =>
      `В сообщении назван наш проект не из его ниши: ${names}. «Делали в вашей нише» про чужую нишу адресат проверяет одним переходом по ссылке — и на этом письмо заканчивается.`,
    uz: (names: string) =>
      `Xabarda uning nishasiga tegishli bo‘lmagan loyihamiz tilga olingan: ${names}. Begona nisha haqidagi «sizning nishangizda qilganmiz»ni adresat bitta havola orqali tekshiradi — va xat shu bilan tugaydi.`,
    pl: (names: string) =>
      `W wiadomości wymieniono nasz projekt z innej branży: ${names}. «Robiliśmy w waszej branży» o cudzej branży adresat sprawdzi jednym kliknięciem — i na tym wiadomość się kończy.`,
  },
  no_reference: {
    ru: (name: string) =>
      `В сообщении не назван «${name}» — наш проект в его же нише. Это самая сильная строка письма: её адресат проверяет за десять секунд, и после неё разговор идёт иначе.`,
    uz: (name: string) =>
      `Xabarda «${name}» — uning o‘z nishasidagi loyihamiz — aytilmagan. Bu xatning eng kuchli qatori: adresat uni o‘n soniyada tekshiradi va undan keyin suhbat boshqacha ketadi.`,
    pl: (name: string) =>
      `W wiadomości nie wymieniono «${name}» — naszego projektu z tej samej branży. To najmocniejsze zdanie wiadomości: adresat sprawdzi je w dziesięć sekund i potem rozmowa idzie inaczej.`,
  },
  no_proto_link: {
    ru: (url: string) =>
      `В сообщении нет ссылки на уже собранный прототип (${url}) — а это то, что адресат откроет первым.`,
    uz: (url: string) => `Xabarda allaqachon yig‘ilgan prototipga havola yo‘q (${url}) — adresat birinchi shuni ochadi.`,
    pl: (url: string) =>
      `W wiadomości nie ma linku do już zbudowanego prototypu (${url}) — a to adresat otworzy jako pierwsze.`,
  },
  no_prototype: {
    ru: (hours: number) =>
      `В сообщении нет предложения собрать прототип сайта за ${hours} часов — а это то, на что адресату проще всего ответить «да».`,
    uz: (hours: number) =>
      `Xabarda ${hours} soatda sayt prototipini yig‘ib berish taklifi yo‘q — adresat aynan shunga eng oson «ha» deydi.`,
    pl: (hours: number) =>
      `W wiadomości nie ma propozycji zbudowania prototypu strony w ${hours} godzin — a na to adresatowi najłatwiej odpowiedzieć «tak».`,
  },
  unknown: {
    ru: "Проверка нашла в тексте то, что не даёт его отправить.",
    uz: "Tekshiruv matnda uni yuborishga to‘sqinlik qiladigan narsani topdi.",
    pl: "Kontrola znalazła w tekście coś, co blokuje wysyłkę.",
  },
});

/** «Разобранные сайты» — список карточек (components/admin/outreach-list.tsx). */
export const outreachListDict = defineDict({
  heading: { ru: "Разобранные сайты", uz: "Tahlil qilingan saytlar", pl: "Przeanalizowane strony" },
  helpSend: { ru: "Как написать компании", uz: "Kompaniyaga qanday yozish kerak", pl: "Jak napisać do firmy" },
  helpQueue: { ru: "Почему три в час", uz: "Nega soatiga uchta", pl: "Dlaczego trzy na godzinę" },
  hourLine: {
    ru: (count: number, cap: number) => `За последний час ушло ${count} из ${cap}`,
    uz: (count: number, cap: number) => `Oxirgi soatda ${cap} tadan ${count} tasi ketdi`,
    pl: (count: number, cap: number) => `W ostatniej godzinie wysłano ${count} z ${cap}`,
  },
  inQueue: {
    ru: (n: number) => ` · в очереди ${n}`,
    uz: (n: number) => ` · navbatda ${n} ta`,
    pl: (n: number) => ` · w kolejce ${n}`,
  },
  queueWaits: { ru: " — ждут своей очереди", uz: " — o‘z navbatini kutmoqda", pl: " — czekają na swoją kolej" },
  intro: {
    ru: "Пишут рабочие аккаунты студии, а не бот: с каждого — не больше трёх первых писем в час и только с 07:30 до 20:30 по Ташкенту, пауза между сообщениями и одно касание на сайт. Главным аккаунтом скаут ещё и читает чаты, и ограничение за рассылку выключило бы оба канала сразу. Ждать очередь не обязательно — сообщение можно отправить со своего аккаунта, тогда и ответ придёт вам лично.",
    uz: "Bot emas, studiyaning ishchi akkauntlari yozadi: har biridan soatiga uchtadan ko‘p bo‘lmagan birinchi xat va faqat Toshkent vaqti bilan 07:30 dan 20:30 gacha, xabarlar orasida pauza va har bir saytga bitta aloqa. Skaut chatlarni ham asosiy akkaunt orqali o‘qiydi, ommaviy tarqatma uchun cheklov ikkala kanalni birdaniga o‘chirib qo‘yardi. Navbatni kutish shart emas — xabarni o‘z akkauntingizdan yuborsangiz bo‘ladi, shunda javob ham shaxsan sizga keladi.",
    pl: "Piszą konta firmowe studia, a nie bot: z każdego najwyżej trzy pierwsze wiadomości na godzinę i tylko od 07:30 do 20:30 czasu taszkenckiego, przerwa między wiadomościami i jeden kontakt na stronę. Kontem głównym skaut dodatkowo czyta czaty, więc blokada za masową wysyłkę wyłączyłaby oba kanały naraz. Nie trzeba czekać w kolejce — wiadomość możesz wysłać ze swojego konta, wtedy odpowiedź też przyjdzie do ciebie.",
  },
  sentNotice: {
    ru: "Сообщение в очереди. Уйдёт с рабочего аккаунта в ближайшие минуты, лид уже закреплён за вами.",
    uz: "Xabar navbatda. Yaqin daqiqalarda ishchi akkauntdan ketadi, lid allaqachon sizga biriktirildi.",
    pl: "Wiadomość jest w kolejce. Wyjdzie z konta firmowego w ciągu kilku minut, lead jest już przypisany do ciebie.",
  },
  noSite: { ru: "без сайта", uz: "saytsiz", pl: "bez strony" },
  search: {
    ru: (score: number) => `поиск ${score}`,
    uz: (score: number) => `qidiruv ${score}`,
    pl: (score: number) => `wyszukiwarka ${score}`,
  },
  lostTitle: {
    ru: "Теряется обращений из каждых ста",
    uz: "Har yuztadan yo‘qotiladigan murojaatlar",
    pl: "Tyle zapytań na sto się traci",
  },
  scoreTitle: { ru: "Общая оценка", uz: "Umumiy baho", pl: "Ocena ogólna" },
  whatWeDo: { ru: "Что делаем:", uz: "Nima qilamiz:", pl: "Co robimy:" },
  contacts: { ru: "Контакты: ", uz: "Kontaktlar: ", pl: "Kontakty: " },
  leadLink: { ru: "Лид по этому сайту →", uz: "Shu sayt bo‘yicha lid →", pl: "Lead dla tej strony →" },
  checkedAt: {
    ru: (when: string) => `Сайт перепроверен по факту перед письмом: ${when}`,
    uz: (when: string) => `Sayt xatdan oldin fakt bo‘yicha qayta tekshirildi: ${when}`,
    pl: (when: string) => `Strona sprawdzona na faktach przed wiadomością: ${when}`,
  },
  checkHelp: {
    ru: "Как работает проверка по факту",
    uz: "Fakt bo‘yicha tekshiruv qanday ishlaydi",
    pl: "Jak działa sprawdzenie na faktach",
  },
  checkDropped: {
    ru: "Не подтвердилось и в письмо не пошло:",
    uz: "Tasdiqlanmadi va xatga kirmadi:",
    pl: "Nie potwierdziło się i nie trafiło do wiadomości:",
  },
  protoReady: {
    ru: "Прототип собран заранее →",
    uz: "Prototip oldindan yig‘ilgan →",
    pl: "Prototyp zbudowany z wyprzedzeniem →",
  },
  protoOpened: {
    ru: (n: number, at: string) => `клиент открыл ${n} ${plural("ru", n, "раз", "раза", "раз")}, впервые — ${at}`,
    uz: (n: number, at: string) => `mijoz ${n} marta ochdi, birinchi marta — ${at}`,
    pl: (n: number, at: string) => `klient otworzył ${n} ${plural("pl", n, "raz", "razy", "razy")}, pierwszy raz — ${at}`,
  },
  protoNotOpened: { ru: "клиент ещё не открывал", uz: "mijoz hali ochmagan", pl: "klient jeszcze nie otworzył" },
  protoNotBuilt: {
    ru: "Прототип заранее не собран: ",
    uz: "Prototip oldindan yig‘ilmadi: ",
    pl: "Prototyp nie został zbudowany z wyprzedzeniem: ",
  },
  manualNext: {
    ru: (target: string) => `Дальше руками: ${target}`,
    uz: (target: string) => `Keyingisi qo‘lda: ${target}`,
    pl: (target: string) => `Dalej ręcznie: ${target}`,
  },
  whatsappDraft: {
    ru: "Открыть WhatsApp с готовым текстом",
    uz: "WhatsApp’ni tayyor matn bilan ochish",
    pl: "Otwórz WhatsApp z gotowym tekstem",
  },
  call: { ru: "Позвонить", uz: "Qo‘ng‘iroq qilish", pl: "Zadzwoń" },
  copyText: { ru: "Скопировать текст", uz: "Matnni nusxalash", pl: "Kopiuj tekst" },
  notePlaceholderManual: {
    ru: "чем написали — WhatsApp, звонок",
    uz: "qanday yozdingiz — WhatsApp, qo‘ng‘iroq",
    pl: "jak napisano — WhatsApp, telefon",
  },
  marking: { ru: "Отмечаем…", uz: "Belgilanmoqda…", pl: "Oznaczamy…" },
  selfContacted: { ru: "Связался сам", uz: "O‘zim bog‘landim", pl: "Skontaktowano samodzielnie" },
  contactedByHand: { ru: "Связались руками", uz: "Qo‘lda bog‘lanildi", pl: "Kontakt ręczny" },
  modelReplied: {
    ru: "Модель написала ответ — отправьте его тем же путём.",
    uz: "SI javob yozdi — uni o‘sha yo‘l bilan yuboring.",
    pl: "AI napisało odpowiedź — wyślij ją tą samą drogą.",
  },
  copyReply: { ru: "Скопировать ответ", uz: "Javobni nusxalash", pl: "Kopiuj odpowiedź" },
  whatsappReply: {
    ru: "Открыть WhatsApp с ответом",
    uz: "WhatsApp’ni javob bilan ochish",
    pl: "Otwórz WhatsApp z odpowiedzią",
  },
  clientAnswerLabel: {
    ru: "Что ответил клиент — перенесите сюда, дальше ведёт модель",
    uz: "Mijoz nima deb javob berdi — shu yerga ko‘chiring, keyin SI olib boradi",
    pl: "Co odpisał klient — przenieś tutaj, dalej prowadzi AI",
  },
  recording: { ru: "Записываем…", uz: "Yozib qo‘yilmoqda…", pl: "Zapisujemy…" },
  recordAnswer: { ru: "Записать ответ", uz: "Javobni yozib qo‘yish", pl: "Zapisz odpowiedź" },
  ownerQueue: {
    ru: (wait: string) => `Письмо владельца — вне очереди, с рабочего аккаунта — ${wait}`,
    uz: (wait: string) => `Egasining xati — navbatsiz, ishchi akkauntdan — ${wait}`,
    pl: (wait: string) => `Wiadomość właściciela — poza kolejką, z konta firmowego — ${wait}`,
  },
  inQueueWait: {
    ru: (wait: string) => `В очереди на отправку с рабочего аккаунта — ${wait}`,
    uz: (wait: string) => `Ishchi akkauntdan yuborish navbatida — ${wait}`,
    pl: (wait: string) => `W kolejce do wysłania z konta firmowego — ${wait}`,
  },
  ahead: {
    ru: (n: number) => `, перед ним ${n}`,
    uz: (n: number) => `, undan oldin ${n} ta`,
    pl: (n: number) => `, przed nią ${n}`,
  },
  waitSoon: { ru: "вот-вот", uz: "hademay", pl: "za chwilę" },
  waitMinutes: {
    ru: (n: number) => `примерно через ${n} мин.`,
    uz: (n: number) => `taxminan ${n} daqiqadan keyin`,
    pl: (n: number) => `za około ${n} min`,
  },
  waitHours: {
    ru: (n: number) => `примерно через ${n} ${plural("ru", n, "час", "часа", "часов")}`,
    uz: (n: number) => `taxminan ${n} soatdan keyin`,
    pl: (n: number) => `za około ${n} ${plural("pl", n, "godzinę", "godziny", "godzin")}`,
  },
  /** `self` — кнопка «Связался сам» на языке панели. */
  noNeedToWait: {
    ru: (self: string) =>
      `Ждать не обязательно: откройте переписку со своего аккаунта, отправьте этот же текст и нажмите «${self}» ниже — бот тогда свою копию не отправит. Ответ придёт вам лично, и лид уже ваш.`,
    uz: (self: string) =>
      `Kutish shart emas: o‘z akkauntingizdan yozishmani oching, shu matnni yuboring va pastdagi «${self}» tugmasini bosing — shunda bot o‘z nusxasini yubormaydi. Javob shaxsan sizga keladi, lid esa allaqachon sizniki.`,
    pl: (self: string) =>
      `Nie trzeba czekać: otwórz rozmowę ze swojego konta, wyślij ten sam tekst i kliknij «${self}» poniżej — wtedy bot nie wyśle swojej kopii. Odpowiedź przyjdzie do ciebie, a lead już jest twój.`,
  },
  openInTelegram: {
    ru: (target: string) => `Открыть ${target} в Telegram`,
    uz: (target: string) => `${target} ni Telegram’da ochish`,
    pl: (target: string) => `Otwórz ${target} w Telegramie`,
  },
  preparing: {
    ru: "Читаем сайт — это до минуты…",
    uz: "Saytni o‘qiyapmiz — bir daqiqagacha…",
    pl: "Czytamy stronę — to potrwa do minuty…",
  },
  contact: { ru: "Связаться", uz: "Bog‘lanish", pl: "Skontaktuj się" },
  firstMessageLabel: {
    ru: "Первое сообщение — правьте перед отправкой",
    uz: "Birinchi xabar — yuborishdan oldin tahrirlang",
    pl: "Pierwsza wiadomość — popraw przed wysłaniem",
  },
  sending: { ru: "Отправляем…", uz: "Yuborilmoqda…", pl: "Wysyłamy…" },
  takeIntoWork: { ru: "Взять в работу", uz: "Ishga olish", pl: "Weź do realizacji" },
  sendTo: {
    ru: (target: string) => `Отправить в ${target}`,
    uz: (target: string) => `Yuborish: ${target}`,
    pl: (target: string) => `Wyślij do ${target}`,
  },
  leadWillBeYours: {
    ru: "Лид закрепится за вами, как только нажмёте.",
    uz: "Bosishingiz bilan lid sizga biriktiriladi.",
    pl: "Lead zostanie przypisany do ciebie, gdy tylko klikniesz.",
  },
  notSent: { ru: "Не отправлено:", uz: "Yuborilmadi:", pl: "Nie wysłano:" },
  fixAndRetry: {
    ru: "Поправьте текст выше и нажмите ещё раз.",
    uz: "Yuqoridagi matnni tuzating va yana bosing.",
    pl: "Popraw tekst powyżej i kliknij jeszcze raz.",
  },
  willRefuse: {
    ru: "Это письмо отправка не пропустит:",
    uz: "Bu xatni yuborish o‘tkazmaydi:",
    pl: "Tej wiadomości wysyłka nie przepuści:",
  },
  willRefuseHint: {
    ru: "Поправьте текст выше — проверка пересчитается после отправки.",
    uz: "Yuqoridagi matnni tuzating — tekshiruv yuborilgandan keyin qayta hisoblanadi.",
    pl: "Popraw tekst powyżej — kontrola przeliczy się po wysłaniu.",
  },
  notePlaceholderMessage: {
    ru: "чем написали — свой Telegram, звонок",
    uz: "qanday yozdingiz — o‘z Telegram’ingiz, qo‘ng‘iroq",
    pl: "jak napisano — własny Telegram, telefon",
  },
  notePlaceholderEmpty: { ru: "что написали", uz: "nima yozdingiz", pl: "co napisano" },
  selfHint: {
    ru: "Если писали со своего аккаунта — отметьте, иначе касание не засчитается.",
    uz: "Agar o‘z akkauntingizdan yozgan bo‘lsangiz — belgilang, aks holda aloqa hisobga olinmaydi.",
    pl: "Jeśli pisano z własnego konta — zaznacz to, inaczej kontakt się nie policzy.",
  },
  sentToQueue: { ru: "Отправлено в очередь", uz: "Navbatga yuborildi", pl: "Dodano do kolejki" },
  sent: { ru: "Отправлено", uz: "Yuborildi", pl: "Wysłano" },
  contacted: { ru: "Связались", uz: "Bog‘lanildi", pl: "Kontakt nawiązany" },
  delivered: {
    ru: (at: string) => `Сообщение нашлось в переписке с нашего аккаунта — ${at}.`,
    uz: (at: string) => `Xabar akkauntimiz yozishmasida topildi — ${at}.`,
    pl: (at: string) => `Wiadomość znalazła się w rozmowie z naszego konta — ${at}.`,
  },
  notDeliveredYet: {
    ru: "Доставку ещё не подтверждали: скаут перечитывает переписку сразу после отправки.",
    uz: "Yetkazilgani hali tasdiqlanmagan: skaut yuborgandan so‘ng darhol yozishmani qayta o‘qiydi.",
    pl: "Dostarczenia jeszcze nie potwierdzono: skaut czyta rozmowę ponownie zaraz po wysłaniu.",
  },
  queuedNote: {
    ru: "Сообщение поставлено в очередь на отправку с рабочего аккаунта. Как только уйдёт, здесь появится подтверждение с временем.",
    uz: "Xabar ishchi akkauntdan yuborish navbatiga qo‘yildi. Ketishi bilan bu yerda vaqti ko‘rsatilgan tasdiq paydo bo‘ladi.",
    pl: "Wiadomość czeka w kolejce do wysłania z konta firmowego. Gdy tylko wyjdzie, pojawi się tu potwierdzenie z godziną.",
  },
  closedNote: {
    ru: "Касание закрыто: бот не дожимает, модель не отвечает, лид — «проиграли». Напишет клиент сам — бот позовёт того, кто вёл.",
    uz: "Aloqa yopildi: bot eslatma yubormaydi, SI javob bermaydi, lid — «yutqazilgan». Mijoz o‘zi yozsa — bot uni olib borgan xodimni chaqiradi.",
    pl: "Kontakt zamknięty: bot nie przypomina, AI nie odpowiada, lead — «przegrany». Jeśli klient sam napisze, bot zawoła tego, kto prowadził.",
  },
  closing: { ru: "Закрываем…", uz: "Yopilmoqda…", pl: "Zamykamy…" },
  helpClose: { ru: "Что будет после нажатия", uz: "Bosgandan keyin nima bo‘ladi", pl: "Co się stanie po kliknięciu" },
  skipPlaceholder: { ru: "почему не пишем", uz: "nega yozmaymiz", pl: "dlaczego nie piszemy" },
  skip: { ru: "не пишем", uz: "yozmaymiz", pl: "nie piszemy" },
  showMore: {
    ru: (n: number) => `Показать ещё ${n}`,
    uz: (n: number) => `Yana ${n} tasini ko‘rsatish`,
    pl: (n: number) => `Pokaż jeszcze ${n}`,
  },
  hiddenMore: {
    ru: (n: number) => `скрыто ещё ${n}: нетронутые, пропущенные и отправленные раньше недели`,
    uz: (n: number) => `yana ${n} tasi yashirilgan: tegilmaganlar, o‘tkazib yuborilganlar va bir haftadan oldin yuborilganlar`,
    pl: (n: number) => `ukryto jeszcze ${n}: nieruszone, pominięte i wysłane ponad tydzień temu`,
  },
  helpList: { ru: "Что показано в списке", uz: "Ro‘yxatda nima ko‘rsatilgan", pl: "Co widać na liście" },
});

/**
 * Почему прототип заранее не собрался (lib/proto/auto, AutoNote). Письмо в
 * этом случае прежнее — обещает собрать за 12 часов.
 */
export const protoNoteDict = defineDict({
  niche: {
    ru: "такую нишу сборщик пока не умеет — письмо обещает собрать за 12 часов",
    uz: "bunday sohani yig‘uvchi hozircha bilmaydi — xat 12 soatda yig‘ib berishni va’da qiladi",
    pl: "tej branży budowniczy jeszcze nie obsługuje — wiadomość obiecuje zbudować w 12 godzin",
  },
  collect: {
    ru: "сайт не открылся сборщику",
    uz: "sayt yig‘uvchiga ochilmadi",
    pl: "strona nie otworzyła się budowniczemu",
  },
  services: {
    ru: "на сайте не нашлось трёх услуг, написанных словами",
    uz: "saytda so‘z bilan yozilgan uchta xizmat topilmadi",
    pl: "na stronie nie znaleziono trzech usług zapisanych słowami",
  },
  name: {
    ru: "на сайте не нашлось названия компании",
    uz: "saytda kompaniya nomi topilmadi",
    pl: "na stronie nie znaleziono nazwy firmy",
  },
  missing: {
    ru: "на сайте нет телеграма, ватсапа или телефона для кнопки записи",
    uz: "saytda yozilish tugmasi uchun Telegram, WhatsApp yoki telefon yo‘q",
    pl: "na stronie nie ma Telegrama, WhatsAppa ani telefonu do przycisku zapisu",
  },
  draft: {
    ru: "страница не прошла проверку и наружу не ушла",
    uz: "sahifa tekshiruvdan o‘tmadi va tashqariga chiqmadi",
    pl: "strona nie przeszła kontroli i nie wyszła na zewnątrz",
  },
  model: {
    ru: "модель не разобрала сайт",
    uz: "model saytni tahlil qila olmadi",
    pl: "model nie przeanalizował strony",
  },
  failed: {
    ru: "не сохранился",
    uz: "saqlanmadi",
    pl: "nie zapisał się",
  },
});

/**
 * Блок «Автопрогон касаний» вверху раздела — владельцу и руководителю
 * (lib/admin/autopilot.ts). Название ниши подставляется уже на языке панели.
 */
export const autopilotDict = defineDict({
  head: {
    ru: "Автопрогон касаний · любые ниши",
    uz: "Avtomatik aloqalar · istalgan nishalar",
    pl: "Automatyczne kontakty · dowolne nisze",
  },
  help: { ru: "Как работает автопрогон", uz: "Avtomatik aloqalar qanday ishlaydi", pl: "Jak działają automatyczne kontakty" },
  on: { ru: "работает", uz: "ishlayapti", pl: "działa" },
  off: { ru: "остановлен", uz: "to‘xtatilgan", pl: "zatrzymane" },
  today: {
    ru: (sent: number, target: number, waiting: number) =>
      `Сегодня ушло в Telegram: ${sent} из ${target}${waiting ? ` · ждут отправки: ${waiting}` : ""}`,
    uz: (sent: number, target: number, waiting: number) =>
      `Bugun Telegram’ga ketdi: ${target} tadan ${sent} ta${waiting ? ` · yuborishni kutmoqda: ${waiting} ta` : ""}`,
    pl: (sent: number, target: number, waiting: number) =>
      `Dziś wysłano w Telegramie: ${sent} z ${target}${waiting ? ` · czeka na wysłanie: ${waiting}` : ""}`,
  },
  byAccount: {
    ru: (list: string) => `По аккаунтам: ${list}`,
    uz: (list: string) => `Akkauntlar bo‘yicha: ${list}`,
    pl: (list: string) => `Według kont: ${list}`,
  },
  mainAccount: { ru: "главный", uz: "asosiy", pl: "główne" },
  replies: {
    ru: (replies: number, taken: number) => `Ответили сегодня: ${replies} · взяли в работу: ${taken}`,
    uz: (replies: number, taken: number) => `Bugun javob berdi: ${replies} ta · ishga olindi: ${taken} ta`,
    pl: (replies: number, taken: number) => `Odpowiedzieli dziś: ${replies} · wzięte do pracy: ${taken}`,
  },
  dropped: {
    ru: (manual: number, dropped: number) =>
      `Не нашлись в Telegram: ${manual} · не написали — проверка по факту ничего не подтвердила: ${dropped}`,
    uz: (manual: number, dropped: number) =>
      `Telegram’da topilmadi: ${manual} ta · yozilmadi — haqiqiy tekshiruv hech narsani tasdiqlamadi: ${dropped} ta`,
    pl: (manual: number, dropped: number) =>
      `Nie znaleziono w Telegramie: ${manual} · nie napisano — sprawdzenie na żywo niczego nie potwierdziło: ${dropped}`,
  },
  week: {
    ru: (sent: number, replies: number) => `С начала недели: ${sent} ${plural("ru", sent, "письмо", "письма", "писем")}, ${replies} ${plural("ru", replies, "ответ", "ответа", "ответов")}`,
    uz: (sent: number, replies: number) => `Hafta boshidan: ${sent} ta xabar, ${replies} ta javob`,
    pl: (sent: number, replies: number) => `Od początku tygodnia: ${sent} ${plural("pl", sent, "wiadomość", "wiadomości", "wiadomości")}, ${replies} ${plural("pl", replies, "odpowiedź", "odpowiedzi", "odpowiedzi")}`,
  },
  /** Поиск лидов через Firecrawl за сегодня: кредиты из дневного лимита и что они дали. */
  search: {
    ru: (credits: number, cap: string, found: number, tried: number, queued: number) =>
      `Поиск лидов (Firecrawl) сегодня: ${credits} из ${cap} кредитов · Telegram или мобильный нашёлся у ${found} из ${tried} · новых сайтов на проверку: ${queued}`,
    uz: (credits: number, cap: string, found: number, tried: number, queued: number) =>
      `Lidlarni qidirish (Firecrawl) bugun: ${cap} kreditdan ${credits} ta · Telegram yoki mobil raqam ${tried} tadan ${found} tasida topildi · tekshiruvga yangi saytlar: ${queued} ta`,
    pl: (credits: number, cap: string, found: number, tried: number, queued: number) =>
      `Wyszukiwanie leadów (Firecrawl) dziś: ${credits} z ${cap} kredytów · Telegram lub komórka znalezione u ${found} z ${tried} · nowych stron do sprawdzenia: ${queued}`,
  },
  /** `mark` — шапка карточки лида в боте; бот пишет по-русски, поэтому строкой из lib. */
  note: {
    ru: (mark: string) =>
      `Пишет сам с 07:00 до 17:30, письма уходят с рабочих аккаунтов в пределе «три в час» на аккаунт. Ответ клиента сразу уходит менеджерам в Telegram по очереди лидов с шапкой «${mark}».`,
    uz: (mark: string) =>
      `07:00 dan 17:30 gacha o‘zi yozadi, xabarlar ishchi akkauntlardan har bir akkauntga «soatiga uchta» chegarasida ketadi. Mijozning javobi darhol menejerlarga Telegram’da lidlar navbati bo‘yicha «${mark}» sarlavhasi bilan boradi.`,
    pl: (mark: string) =>
      `Pisze samo od 07:00 do 17:30, wiadomości wychodzą z kont roboczych w limicie „trzy na godzinę” na konto. Odpowiedź klienta od razu trafia do menedżerów w Telegramie przez kolejkę leadów z nagłówkiem «${mark}».`,
  },
  stop: { ru: "Остановить автопрогон", uz: "Avtomatik aloqalarni to‘xtatish", pl: "Zatrzymaj automatyczne kontakty" },
  start: { ru: "Запустить автопрогон", uz: "Avtomatik aloqalarni ishga tushirish", pl: "Uruchom automatyczne kontakty" },
  ownerOnly: {
    ru: "Остановить и запустить автопрогон может владелец.",
    uz: "Avtomatik aloqalarni egasi to‘xtatadi va ishga tushiradi.",
    pl: "Zatrzymać i uruchomić automatyczne kontakty może właściciel.",
  },
  /** Подпись на карточке касания вместо имени менеджера. */
  owner: { ru: "автопрогон", uz: "avtomatik aloqa", pl: "automatyczny kontakt" },
});
