import { defineDict, plural } from "@/lib/admin/i18n";

/**
 * Раздел «Трафик» (/admin/traffic): Метрика и Google Analytics.
 *
 * В строках — простая разметка, которую рисует components/admin/traffic-panel:
 * `код` — моноширинным, **жирный**, [текст](адрес) — внешней ссылкой.
 * Названия кнопок в Google Cloud и Яндексе — как их показывает сам сервис:
 * у Google — по-английски на всех языках (там они такие у всех), у Яндекса
 * в русском тексте — по-русски, в узбекском и польском — английским
 * интерфейсом Яндекса.
 */
export const trafficDict = defineDict({
  title: { ru: "Трафик сайта", uz: "Sayt trafigi", pl: "Ruch na stronie" },
  intro: {
    ru: (days: number) => `Последние ${days} дней, стрелки — против ${days} дней до них. Обновляется раз в 10 минут.`,
    uz: (days: number) => `Oxirgi ${days} kun, strelkalar — undan oldingi ${days} kunga nisbatan. Har 10 daqiqada yangilanadi.`,
    pl: (days: number) =>
      `Ostatnie ${days} ${plural("pl", days, "dzień", "dni", "dni")}, strzałki — w porównaniu z ${days} ${plural("pl", days, "dniem", "dniami", "dniami")} wcześniej. Odświeża się co 10 minut.`,
  },
  helpOwner: { ru: "Откуда цифры и как подключить", uz: "Raqamlar qayerdan va qanday ulash", pl: "Skąd liczby i jak podłączyć" },
  helpHead: { ru: "Откуда цифры", uz: "Raqamlar qayerdan", pl: "Skąd liczby" },
  period: {
    ru: (days: number) => `${days} дней`,
    uz: (days: number) => `${days} kun`,
    pl: (days: number) => `${days} ${plural("pl", days, "dzień", "dni", "dni")}`,
  },
  metrika: { ru: "Яндекс Метрика", uz: "Yandex Metrika", pl: "Yandex Metryka" },

  // Цифры
  visits: { ru: "визитов", uz: "tashriflar", pl: "wizyty" },
  users: { ru: "посетителей", uz: "tashrif buyuruvchilar", pl: "użytkownicy" },
  pageviews: { ru: "просмотров", uz: "ko‘rishlar", pl: "odsłony" },
  bounce: { ru: "отказов", uz: "rad etishlar", pl: "odrzucenia" },
  avgVisit: { ru: "ср. визит", uz: "o‘rtacha tashrif", pl: "śr. wizyta" },
  deltaNew: { ru: "новое", uz: "yangi", pl: "nowe" },
  dailyLabel: { ru: "Визиты по дням", uz: "Kunlar bo‘yicha tashriflar", pl: "Wizyty dziennie" },
  dailyTip: {
    ru: (date: string, visits: number, users: number) => `${date}: ${visits} визитов, ${users} посетителей`,
    uz: (date: string, visits: number, users: number) => `${date}: ${visits} ta tashrif, ${users} ta tashrif buyuruvchi`,
    pl: (date: string, visits: number, users: number) => `${date}: wizyty ${visits}, użytkownicy ${users}`,
  },
  sources: { ru: "Откуда приходят", uz: "Qayerdan keladi", pl: "Skąd przychodzą" },
  pages: { ru: "Страницы входа", uz: "Kirish sahifalari", pl: "Strony wejścia" },

  // Не подключено
  ownerConnects: {
    ru: "Не подключено. Подключает владелец — если цифры нужны, скажите ему.",
    uz: "Ulanmagan. Egasi ulaydi — raqamlar kerak bo‘lsa, unga ayting.",
    pl: "Nie podłączono. Podłącza właściciel — jeśli potrzebujesz liczb, powiedz mu.",
  },
  setupTitle: {
    ru: "Не подключено. Что нужно сделать один раз:",
    uz: "Ulanmagan. Bir marta nima qilish kerak:",
    pl: "Nie podłączono. Co trzeba zrobić jednorazowo:",
  },
  noDetail: { ru: "без описания", uz: "tavsifsiz", pl: "bez opisu" },
  /** `detail` — ответ сервиса как есть. */
  failedOwner: {
    ru: (detail: string) =>
      `Не ответил: ${detail}. Попробуйте обновить страницу через минуту; если повторяется — проверьте ключ в .env.`,
    uz: (detail: string) =>
      `Javob bermadi: ${detail}. Bir daqiqadan keyin sahifani yangilab ko‘ring; takrorlansa — .env dagi kalitni tekshiring.`,
    pl: (detail: string) =>
      `Brak odpowiedzi: ${detail}. Odśwież stronę za minutę; jeśli się powtarza — sprawdź klucz w .env.`,
  },
  failedHead: {
    ru: (detail: string) =>
      `Не ответил: ${detail}. Попробуйте обновить страницу через минуту; если повторяется — скажите владельцу.`,
    uz: (detail: string) =>
      `Javob bermadi: ${detail}. Bir daqiqadan keyin sahifani yangilab ko‘ring; takrorlansa — egasiga ayting.`,
    pl: (detail: string) =>
      `Brak odpowiedzi: ${detail}. Odśwież stronę za minutę; jeśli się powtarza — powiedz właścicielowi.`,
  },

  // Метрика: подключение
  ymStep1: {
    ru: "На `oauth.yandex.ru` — «Создать приложение», платформа «Веб-сервисы», Redirect URI `https://oauth.yandex.ru/verification_code`, доступ «Яндекс.Метрика: получение статистики».",
    uz: "`oauth.yandex.ru` saytida — «Create app», platforma «Web services», Redirect URI `https://oauth.yandex.ru/verification_code`, ruxsat «Yandex.Metrica: reading statistics».",
    pl: "Na `oauth.yandex.ru` — «Create app», platforma «Web services», Redirect URI `https://oauth.yandex.ru/verification_code`, uprawnienie «Yandex.Metrica: reading statistics».",
  },
  ymStep2: {
    ru: "Под аккаунтом, у которого есть доступ к счётчику 112925960, откройте `https://oauth.yandex.ru/authorize?response_type=token&client_id=<ClientID приложения>` и скопируйте токен.",
    uz: "112925960 hisoblagichiga kirish huquqi bor akkaunt ostida `https://oauth.yandex.ru/authorize?response_type=token&client_id=<ilova ClientID si>` ni oching va tokenni nusxalang.",
    pl: "Na koncie z dostępem do licznika 112925960 otwórz `https://oauth.yandex.ru/authorize?response_type=token&client_id=<ClientID aplikacji>` i skopiuj token.",
  },
  ymStep3: {
    ru: "На сервере в `/opt/devuz/.env` добавьте строку `YANDEX_METRIKA_TOKEN=токен` и выполните там же `docker compose up -d` — или просто дождитесь следующей выкатки.",
    uz: "Serverda `/opt/devuz/.env` fayliga `YANDEX_METRIKA_TOKEN=token` qatorini qo‘shing va o‘sha yerda `docker compose up -d` ni bajaring — yoki shunchaki keyingi chiqarishni kuting.",
    pl: "Na serwerze w `/opt/devuz/.env` dodaj wiersz `YANDEX_METRIKA_TOKEN=token` i wykonaj tam `docker compose up -d` — albo po prostu poczekaj na następne wdrożenie.",
  },

  // Google Analytics: подключение
  gaStep1: {
    ru: "Откройте [console.cloud.google.com](https://console.cloud.google.com/apis/library), вверху выберите тот же проект, что у ключа карт. В «APIs & Services» → «Library» найдите и включите кнопкой «Enable» два API: **Google Analytics Data API** (по нему идут цифры) и **Google Analytics Admin API** (по нему панель сама найдёт ресурс сайта).",
    uz: "[console.cloud.google.com](https://console.cloud.google.com/apis/library) ni oching, yuqorida xarita kaliti turgan loyihani tanlang. «APIs & Services» → «Library» bo‘limida ikkita API ni topib, «Enable» tugmasi bilan yoqing: **Google Analytics Data API** (raqamlar shu orqali keladi) va **Google Analytics Admin API** (shu orqali panel sayt resursini o‘zi topadi).",
    pl: "Otwórz [console.cloud.google.com](https://console.cloud.google.com/apis/library), u góry wybierz ten sam projekt, co przy kluczu map. W «APIs & Services» → «Library» znajdź i włącz przyciskiem «Enable» dwa API: **Google Analytics Data API** (przez nie idą liczby) i **Google Analytics Admin API** (przez nie panel sam znajdzie usługę strony).",
  },
  gaStep2: {
    ru: "«Google Auth Platform» (в старом меню — «APIs & Services» → «OAuth consent screen») → «Get started»: имя приложения — например «DevUz панель», почта — ваша, Audience — **External** → «Create».",
    uz: "«Google Auth Platform» (eski menyuda — «APIs & Services» → «OAuth consent screen») → «Get started»: ilova nomi — masalan «DevUz panel», pochta — sizniki, Audience — **External** → «Create».",
    pl: "«Google Auth Platform» (w starym menu — «APIs & Services» → «OAuth consent screen») → «Get started»: nazwa aplikacji — np. «DevUz panel», e-mail — Twój, Audience — **External** → «Create».",
  },
  gaStep3: {
    ru: "Там же «Audience» → **«Publish app»** → «Confirm». Без этого приложение остаётся в режиме «Testing», и Google выключает вход через 7 дней. Проверка Google не нужна: при входе он предупредит «Google hasn’t verified this app» — нажмите «Advanced» → «Go to … (unsafe)». Это ваше приложение, и просит оно только чтение статистики.",
    uz: "O‘sha yerda «Audience» → **«Publish app»** → «Confirm». Busiz ilova «Testing» rejimida qoladi va Google kirishni 7 kundan keyin o‘chiradi. Google tekshiruvi kerak emas: kirishda u «Google hasn’t verified this app» deb ogohlantiradi — «Advanced» → «Go to … (unsafe)» ni bosing. Bu sizning ilovangiz va u faqat statistikani o‘qishni so‘raydi.",
    pl: "Tam też «Audience» → **«Publish app»** → «Confirm». Bez tego aplikacja zostaje w trybie «Testing», a Google wyłącza logowanie po 7 dniach. Weryfikacja Google nie jest potrzebna: przy logowaniu pojawi się ostrzeżenie «Google hasn’t verified this app» — kliknij «Advanced» → «Go to … (unsafe)». To Twoja aplikacja i prosi tylko o odczyt statystyk.",
  },
  gaStep4: {
    ru: (redirect: string) =>
      `«Clients» → «Create client» → тип **Web application**. В «Authorized redirect URIs» → «Add URI» вставьте ровно \`${redirect}\` → «Create».`,
    uz: (redirect: string) =>
      `«Clients» → «Create client» → turi **Web application**. «Authorized redirect URIs» → «Add URI» ga aynan \`${redirect}\` ni qo‘ying → «Create».`,
    pl: (redirect: string) =>
      `«Clients» → «Create client» → typ **Web application**. W «Authorized redirect URIs» → «Add URI» wklej dokładnie \`${redirect}\` → «Create».`,
  },
  gaStep5: {
    ru: "Google покажет Client ID и Client secret. Скопируйте оба сразу — секрет он потом не показывает, — вставьте ниже и нажмите «Сохранить и войти через Google». Входите аккаунтом, у которого есть доступ к Google Analytics сайта, и не снимайте галочку «See and download your Google Analytics data».",
    uz: "Google Client ID va Client secret ni ko‘rsatadi. Ikkalasini darhol nusxalang — sekretni u keyin ko‘rsatmaydi —, quyiga qo‘ying va «Saqlash va Google orqali kirish» ni bosing. Sayt Google Analytics iga kirish huquqi bor akkaunt bilan kiring va «See and download your Google Analytics data» belgisini olib tashlamang.",
    pl: "Google pokaże Client ID i Client secret. Skopiuj oba od razu — sekretu potem już nie pokaże — wklej poniżej i kliknij «Zapisz i zaloguj przez Google». Zaloguj się kontem z dostępem do Google Analytics strony i nie odznaczaj «See and download your Google Analytics data».",
  },

  // Кнопки и поля входа
  signIn: { ru: "Войти через Google", uz: "Google orqali kirish", pl: "Zaloguj przez Google" },
  signInAgain: { ru: "Войти заново", uz: "Qayta kirish", pl: "Zaloguj ponownie" },
  signInAgainLink: { ru: "войти заново", uz: "qayta kirish", pl: "zaloguj ponownie" },
  openingGoogle: { ru: "Открываем Google…", uz: "Google ochilmoqda…", pl: "Otwieramy Google…" },
  saving: { ru: "Сохраняем…", uz: "Saqlanmoqda…", pl: "Zapisywanie…" },
  saveAndSignIn: { ru: "Сохранить и войти через Google", uz: "Saqlash va Google orqali kirish", pl: "Zapisz i zaloguj przez Google" },
  propertyPlaceholder: { ru: "Номер ресурса: 512345678", uz: "Resurs raqami: 512345678", pl: "Numer usługi: 512345678" },
  propertyAria: { ru: "Номер ресурса Google Analytics", uz: "Google Analytics resurs raqami", pl: "Numer usługi Google Analytics" },
  saveProperty: { ru: "Сохранить номер", uz: "Raqamni saqlash", pl: "Zapisz numer" },

  // Ответы входа через Google
  connected: {
    ru: (property: string) => `Google подключён, статистика берётся из ресурса ${property}.`,
    uz: (property: string) => `Google ulandi, statistika ${property} resursidan olinadi.`,
    pl: (property: string) => `Google podłączony, statystyki pochodzą z usługi ${property}.`,
  },
  site: { ru: "сайта", uz: "sayt", pl: "strony" },
  propertySaved: { ru: "Номер ресурса сохранён.", uz: "Resurs raqami saqlandi.", pl: "Numer usługi zapisany." },
  denied: {
    ru: "Вход отменён на экране Google — ничего не сохранено.",
    uz: "Kirish Google ekranida bekor qilindi — hech narsa saqlanmadi.",
    pl: "Logowanie anulowano na ekranie Google — nic nie zapisano.",
  },
  state: {
    ru: "Вход не прошёл проверку: он был начат слишком давно, в другом окне или на другом адресе панели. Нажмите «Войти через Google» ещё раз.",
    uz: "Kirish tekshiruvdan o‘tmadi: u juda oldin, boshqa oynada yoki panelning boshqa manzilida boshlangan. «Google orqali kirish» ni yana bir bor bosing.",
    pl: "Logowanie nie przeszło weryfikacji: zaczęto je zbyt dawno, w innym oknie albo pod innym adresem panelu. Kliknij «Zaloguj przez Google» jeszcze raz.",
  },
  client: {
    ru: "Нет Client ID и секрета — вставьте их ниже.",
    uz: "Client ID va sekret yo‘q — ularni quyiga qo‘ying.",
    pl: "Brak Client ID i sekretu — wklej je poniżej.",
  },
  clientBad: {
    ru: "Client ID выглядит как `1234567890-abc….apps.googleusercontent.com`, а секрет обычно начинается с `GOCSPX-`. Проверьте, что скопировали обе строки целиком, без пробелов.",
    uz: "Client ID `1234567890-abc….apps.googleusercontent.com` ko‘rinishida bo‘ladi, sekret esa odatda `GOCSPX-` bilan boshlanadi. Ikkala qatorni to‘liq, bo‘shliqlarsiz nusxalaganingizni tekshiring.",
    pl: "Client ID wygląda jak `1234567890-abc….apps.googleusercontent.com`, a sekret zwykle zaczyna się od `GOCSPX-`. Sprawdź, czy skopiowano oba ciągi w całości, bez spacji.",
  },
  saveFailed: {
    ru: "Не удалось сохранить в хранилище секретов. Попробуйте ещё раз через минуту.",
    uz: "Sekretlar omboriga saqlab bo‘lmadi. Bir daqiqadan keyin yana urinib ko‘ring.",
    pl: "Nie udało się zapisać w magazynie sekretów. Spróbuj ponownie za minutę.",
  },
  /** `detail` — ответ Google или пустая строка. */
  exchange: {
    ru: (detail: string, redirect: string) =>
      `Google не выдал доступ${detail ? `: ${detail}` : ""}. Частые причины: адрес возврата в клиенте не совпадает до символа с \`${redirect}\`, или секрет скопирован не полностью.`,
    uz: (detail: string, redirect: string) =>
      `Google kirish huquqini bermadi${detail ? `: ${detail}` : ""}. Ko‘p uchraydigan sabablar: klientdagi qaytish manzili \`${redirect}\` bilan belgigacha mos kelmaydi yoki sekret to‘liq nusxalanmagan.`,
    pl: (detail: string, redirect: string) =>
      `Google nie przyznał dostępu${detail ? `: ${detail}` : ""}. Częste przyczyny: adres powrotu w kliencie nie zgadza się co do znaku z \`${redirect}\` albo sekret nie został skopiowany w całości.`,
  },
  scope: {
    ru: "Вход прошёл, но без права читать статистику: на экране Google была снята галочка «See and download your Google Analytics data». Войдите ещё раз и оставьте её.",
    uz: "Kirish amalga oshdi, lekin statistikani o‘qish huquqisiz: Google ekranida «See and download your Google Analytics data» belgisi olib tashlangan. Yana kiring va uni qoldiring.",
    pl: "Logowanie się udało, ale bez prawa do odczytu statystyk: na ekranie Google odznaczono «See and download your Google Analytics data». Zaloguj się ponownie i zostaw to zaznaczone.",
  },
  noRefresh: {
    ru: "Google не выдал постоянный доступ. Откройте [myaccount.google.com/permissions](https://myaccount.google.com/permissions), удалите там это приложение и войдите ещё раз.",
    uz: "Google doimiy kirish huquqini bermadi. [myaccount.google.com/permissions](https://myaccount.google.com/permissions) ni oching, u yerda bu ilovani o‘chiring va yana kiring.",
    pl: "Google nie przyznał stałego dostępu. Otwórz [myaccount.google.com/permissions](https://myaccount.google.com/permissions), usuń tam tę aplikację i zaloguj się ponownie.",
  },
  /** `checked` — сколько ресурсов проверено, или пустая строка. */
  noProperty: {
    ru: (measurement: string, checked: string) =>
      `Вход сохранён, но у этого аккаунта Google нет ресурса Analytics со счётчиком сайта \`${measurement}\`${checked ? ` (проверено ресурсов: ${checked})` : ""}. Войдите аккаунтом, у которого есть доступ к статистике сайта, или впишите номер ресурса ниже.`,
    uz: (measurement: string, checked: string) =>
      `Kirish saqlandi, lekin bu Google akkauntida sayt hisoblagichi \`${measurement}\` bilan Analytics resursi yo‘q${checked ? ` (tekshirilgan resurslar: ${checked})` : ""}. Sayt statistikasiga kirish huquqi bor akkaunt bilan kiring yoki resurs raqamini quyida yozing.`,
    pl: (measurement: string, checked: string) =>
      `Logowanie zapisane, ale to konto Google nie ma usługi Analytics z licznikiem strony \`${measurement}\`${checked ? ` (sprawdzono usług: ${checked})` : ""}. Zaloguj się kontem z dostępem do statystyk strony albo wpisz numer usługi poniżej.`,
  },
  /** `link` — адрес, где включается API. */
  adminApi: {
    ru: (link: string) =>
      `Вход сохранён, но найти ресурс сам не получилось: в проекте Google Cloud не включён «Google Analytics Admin API». [Включите его](${link}) (кнопка «Enable»), подождите минуту и нажмите «Войти заново» — или впишите номер ресурса ниже.`,
    uz: (link: string) =>
      `Kirish saqlandi, lekin resursni o‘zi topa olmadi: Google Cloud loyihasida «Google Analytics Admin API» yoqilmagan. [Uni yoqing](${link}) («Enable» tugmasi), bir daqiqa kuting va «Qayta kirish» ni bosing — yoki resurs raqamini quyida yozing.`,
    pl: (link: string) =>
      `Logowanie zapisane, ale nie udało się samodzielnie znaleźć usługi: w projekcie Google Cloud nie włączono «Google Analytics Admin API». [Włącz je](${link}) (przycisk «Enable»), poczekaj minutę i kliknij «Zaloguj ponownie» — albo wpisz numer usługi poniżej.`,
  },
  adminApiOther: {
    ru: (detail: string) =>
      `Вход сохранён, но найти ресурс сам не получилось${detail ? `: ${detail}` : ""}. Впишите номер ресурса ниже или нажмите «Войти заново».`,
    uz: (detail: string) =>
      `Kirish saqlandi, lekin resursni o‘zi topa olmadi${detail ? `: ${detail}` : ""}. Resurs raqamini quyida yozing yoki «Qayta kirish» ni bosing.`,
    pl: (detail: string) =>
      `Logowanie zapisane, ale nie udało się samodzielnie znaleźć usługi${detail ? `: ${detail}` : ""}. Wpisz numer usługi poniżej albo kliknij «Zaloguj ponownie».`,
  },
  propertyBad: {
    ru: "Номер ресурса — только цифры, например `512345678`. Это не `G-…`: он в Google Analytics → «Администратор» → «Сведения о ресурсе».",
    uz: "Resurs raqami — faqat raqamlar, masalan `512345678`. Bu `G-…` emas: u Google Analytics → «Admin» → «Property details» bo‘limida.",
    pl: "Numer usługi to same cyfry, np. `512345678`. To nie jest `G-…`: znajdziesz go w Google Analytics → «Administracja» → «Szczegóły usługi».",
  },

  // Откуда идёт статистика GA
  gaProperty: {
    ru: (property: string) => `Ресурс Google Analytics ${property}`,
    uz: (property: string) => `Google Analytics resursi ${property}`,
    pl: (property: string) => `Usługa Google Analytics ${property}`,
  },
  viaService: {
    ru: (property: string) => `Через ключ сервисного аккаунта · ресурс ${property}`,
    uz: (property: string) => `Servis akkaunti kaliti orqali · resurs ${property}`,
    pl: (property: string) => `Przez klucz konta usługi · usługa ${property}`,
  },
  viaGoogle: { ru: "Через вход Google", uz: "Google orqali kirish bilan", pl: "Przez logowanie Google" },
  resource: {
    ru: (property: string) => `ресурс ${property}`,
    uz: (property: string) => `resurs ${property}`,
    pl: (property: string) => `usługa ${property}`,
  },

  // Что с GA сейчас
  reauthHead: {
    ru: "Google перестал пускать по входу владельца, поэтому цифр нет. Скажите владельцу — ему нужно войти заново, это минута.",
    uz: "Google egasining kirishi bo‘yicha ruxsat bermay qo‘ydi, shuning uchun raqamlar yo‘q. Egasiga ayting — u qayta kirishi kerak, bu bir daqiqa.",
    pl: "Google przestał wpuszczać przez logowanie właściciela, dlatego nie ma liczb. Powiedz właścicielowi — musi zalogować się ponownie, to minuta.",
  },
  reauthOwner: {
    ru: "Google больше не пускает по сохранённому входу: доступ отозван, сменён пароль, или приложение в Google Cloud не опубликовано (в режиме «Testing» вход живёт 7 дней — нажмите там «Publish app»). Войдите ещё раз — это минута.",
    uz: "Google saqlangan kirish bo‘yicha endi ruxsat bermayapti: kirish huquqi bekor qilingan, parol almashtirilgan yoki Google Cloud dagi ilova e’lon qilinmagan («Testing» rejimida kirish 7 kun yashaydi — u yerda «Publish app» ni bosing). Yana kiring — bu bir daqiqa.",
    pl: "Google nie wpuszcza już przez zapisane logowanie: dostęp cofnięto, zmieniono hasło albo aplikacja w Google Cloud nie jest opublikowana (w trybie «Testing» logowanie działa 7 dni — kliknij tam «Publish app»). Zaloguj się ponownie — to minuta.",
  },
  enableApi: {
    ru: (link: string) =>
      `Google не отдаёт цифры: в проекте Google Cloud не включён нужный API (обычно «Google Analytics Data API»). [Включите его](${link}) (кнопка «Enable»), подождите пару минут и обновите страницу.`,
    uz: (link: string) =>
      `Google raqamlarni bermayapti: Google Cloud loyihasida kerakli API yoqilmagan (odatda «Google Analytics Data API»). [Uni yoqing](${link}) («Enable» tugmasi), bir-ikki daqiqa kuting va sahifani yangilang.`,
    pl: (link: string) =>
      `Google nie udostępnia liczb: w projekcie Google Cloud nie włączono potrzebnego API (zwykle «Google Analytics Data API»). [Włącz je](${link}) (przycisk «Enable»), poczekaj parę minut i odśwież stronę.`,
  },
  gaFailed: {
    ru: (detail: string, property: string) =>
      `Не ответил: ${detail}. Попробуйте обновить страницу через минуту. Если Google пишет про права (permission) — войдите аккаунтом, у которого есть доступ к ресурсу ${property}.`,
    uz: (detail: string, property: string) =>
      `Javob bermadi: ${detail}. Bir daqiqadan keyin sahifani yangilab ko‘ring. Agar Google huquqlar (permission) haqida yozsa — ${property} resursiga kirish huquqi bor akkaunt bilan kiring.`,
    pl: (detail: string, property: string) =>
      `Brak odpowiedzi: ${detail}. Odśwież stronę za minutę. Jeśli Google pisze o uprawnieniach (permission) — zaloguj się kontem z dostępem do usługi ${property}.`,
  },
  needProperty: {
    ru: "Вход есть, не хватает номера ресурса Google Analytics. Его можно найти в Google Analytics → «Администратор» → «Сведения о ресурсе» (только цифры, не `G-…`) и вписать сюда:",
    uz: "Kirish bor, Google Analytics resurs raqami yetishmayapti. Uni Google Analytics → «Admin» → «Property details» bo‘limida topish mumkin (faqat raqamlar, `G-…` emas) va shu yerga yozing:",
    pl: "Logowanie jest, brakuje numeru usługi Google Analytics. Znajdziesz go w Google Analytics → «Administracja» → «Szczegóły usługi» (same cyfry, nie `G-…`) i wpisz tutaj:",
  },
  orEnableAdmin: {
    ru: "Или включите в Google Cloud «Google Analytics Admin API» и войдите заново — панель найдёт номер сама.",
    uz: "Yoki Google Cloud da «Google Analytics Admin API» ni yoqing va qayta kiring — panel raqamni o‘zi topadi.",
    pl: "Albo włącz w Google Cloud «Google Analytics Admin API» i zaloguj się ponownie — panel sam znajdzie numer.",
  },
  clientSaved: {
    ru: "Client ID сохранён. Осталось войти: нажмите кнопку и войдите аккаунтом Google, у которого есть доступ к Google Analytics сайта. Номер ресурса панель найдёт сама.",
    uz: "Client ID saqlandi. Kirish qoldi: tugmani bosing va sayt Google Analytics iga kirish huquqi bor Google akkaunti bilan kiring. Resurs raqamini panel o‘zi topadi.",
    pl: "Client ID zapisany. Zostało się zalogować: kliknij przycisk i zaloguj się kontem Google z dostępem do Google Analytics strony. Numer usługi panel znajdzie sam.",
  },
  replaceClient: { ru: "Заменить Client ID и секрет", uz: "Client ID va sekretni almashtirish", pl: "Zmień Client ID i sekret" },
});
