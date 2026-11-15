import { defineDict } from "@/lib/admin/i18n";

/**
 * «Реклама» (/admin/ads): ключи приложения Google и планировщик ключевых
 * слов (lib/seo/keyword-planner.ts). Владелец, 07.11.2026: «Подключаем,
 * аккаунт гугл адс у меня есть».
 */
export const adsGoogleDict = defineDict({
  keysTitle: { ru: "Ключи приложения Google", uz: "Google ilovasi kalitlari", pl: "Klucze aplikacji Google" },
  keysHint: {
    ru: "Client ID и секрет OAuth-клиента из Google Cloud. С ними кнопка «Подключить» у кабинета Google ведёт на вход Google. Вставляет владелец; обратно ключи не показываются, только «задано» или «пусто».",
    uz: "Google Cloud’dagi OAuth-mijozning Client ID va siri. Ular bilan Google kabinetidagi «Ulash» tugmasi Google’ga kirishga olib boradi. Egasi kiritadi; kalitlar qaytib ko‘rsatilmaydi, faqat «berilgan» yoki «bo‘sh».",
    pl: "Client ID i sekret klienta OAuth z Google Cloud. Dzięki nim przycisk „Połącz” przy koncie Google prowadzi do logowania Google. Wkleja właściciel; klucze nie są pokazywane z powrotem, tylko „ustawiono” albo „puste”.",
  },
  // Шаги — словами, «Шаг 1 — …», без цепочек стрелок (владелец, 12.11.2026,
  // про Instagram: «перепиши инструкцию прям по шагам без >»; 15.11.2026:
  // «Давай гугл эдс сделаем чтобы вытягивать инфу с гугл по запросам»).
  // Названия Google Cloud — английские, как на экране Google.
  stepsTitle: { ru: "Как подключить — по шагам", uz: "Qanday ulash — qadamma-qadam", pl: "Jak podłączyć — krok po kroku" },
  stepNo: {
    ru: (n: number) => `Шаг ${n} —`,
    uz: (n: number) => `${n}-qadam —`,
    pl: (n: number) => `Krok ${n} —`,
  },
  g1: {
    ru: "Откройте Google Cloud (ссылка ниже) тем аккаунтом Google, у которого есть доступ к вашему кабинету Google Ads. Вверху нажмите выбор проекта, потом «New project», имя — DevUz. Пробный бесплатный период Cloud не подходит: проект либо без платёжного аккаунта, либо с обычным платным.",
    uz: "Google Cloud’ni (havola pastda) Google Ads kabinetingizga kirish huquqi bor Google akkaunti bilan oching. Tepada loyiha tanlovini, keyin «New project» ni bosing, nomi — DevUz. Cloud’ning bepul sinov davri to‘g‘ri kelmaydi: loyiha yo to‘lov akkauntisiz, yo oddiy pullik akkaunt bilan bo‘lsin.",
    pl: "Otwórz Google Cloud (link poniżej) kontem Google, które ma dostęp do Twojego konta Google Ads. Na górze kliknij wybór projektu, potem „New project”, nazwa — DevUz. Darmowy okres próbny Cloud się nie nadaje: projekt bez konta rozliczeniowego albo ze zwykłym płatnym.",
  },
  g2: {
    ru: "Слева откройте «APIs & Services», потом «Library». Найдите «Google Ads API» и нажмите «Enable».",
    uz: "Chapda «APIs & Services», keyin «Library» ni oching. «Google Ads API» ni toping va «Enable» ni bosing.",
    pl: "Po lewej otwórz „APIs & Services”, potem „Library”. Znajdź „Google Ads API” i kliknij „Enable”.",
  },
  g3: {
    ru: "Откройте «Google Auth Platform» (раньше называлась «OAuth consent screen»). Тип — External. В «Branding»: название DevUz Studio, почта, логотип, сайт https://devuz.studio, политика https://devuz.studio/ru/privacy, домен devuz.studio, потом «Verify branding». В «Audience» нажмите «Publish app», чтобы статус стал In production.",
    uz: "«Google Auth Platform» ni oching (avval «OAuth consent screen» deb atalardi). Turi — External. «Branding» da: nomi DevUz Studio, pochta, logotip, sayt https://devuz.studio, siyosat https://devuz.studio/ru/privacy, domen devuz.studio, keyin «Verify branding». «Audience» da holat In production bo‘lishi uchun «Publish app» ni bosing.",
    pl: "Otwórz „Google Auth Platform” (wcześniej „OAuth consent screen”). Typ — External. W „Branding”: nazwa DevUz Studio, e-mail, logo, strona https://devuz.studio, polityka https://devuz.studio/ru/privacy, domena devuz.studio, potem „Verify branding”. W „Audience” kliknij „Publish app”, żeby status był In production.",
  },
  g4: {
    ru: "Там же откройте «Clients» и нажмите «Create client», тип Web application. В «Authorized redirect URIs» вставьте адрес возврата из этого блока (кнопка «Скопировать» ниже) и нажмите «Create».",
    uz: "U yerda «Clients» ni oching va «Create client» ni bosing, turi Web application. «Authorized redirect URIs» ga shu blokdagi qaytish manzilini qo‘ying (pastdagi «Nusxa olish» tugmasi) va «Create» ni bosing.",
    pl: "Tam otwórz „Clients” i kliknij „Create client”, typ Web application. W „Authorized redirect URIs” wklej adres powrotu z tego bloku (przycisk „Kopiuj” poniżej) i kliknij „Create”.",
  },
  g5: {
    ru: "Google покажет Client ID и Client secret. Вставьте их в поля ниже и нажмите «Сохранить». Ключи уходят в хранилище, в чат их не присылайте.",
    uz: "Google Client ID va Client secret ni ko‘rsatadi. Ularni pastdagi maydonlarga qo‘ying va «Saqlash» ni bosing. Kalitlar xavfsiz omborga tushadi, ularni chatga yubormang.",
    pl: "Google pokaże Client ID i Client secret. Wklej je w pola poniżej i kliknij „Zapisz”. Klucze trafiają do sejfu, nie wysyłaj ich na czacie.",
  },
  g6: {
    ru: "В Google Cloud откройте «Google Ads API», потом «Overview», нажмите «Upgrade access level» и «Apply for access»: сначала Explorer, потом Basic. Планировщик Google открывает только с Basic. После проверки бренда Basic обычно дают за минуты.",
    uz: "Google Cloud’da «Google Ads API», keyin «Overview» ni oching, «Upgrade access level» va «Apply for access» ni bosing: avval Explorer, keyin Basic. Rejalashtiruvchini Google faqat Basic dan ochadi. Brend tekshiruvidan keyin Basic odatda bir necha daqiqada beriladi.",
    pl: "W Google Cloud otwórz „Google Ads API”, potem „Overview”, kliknij „Upgrade access level” i „Apply for access”: najpierw Explorer, potem Basic. Planer Google udostępnia dopiero od Basic. Po weryfikacji marki Basic zwykle przyznawany jest w kilka minut.",
  },
  g7: {
    ru: "Здесь, в «Рекламе», слева заведите кабинет, добавьте рекламный кабинет Google с номером из 10 цифр (он вверху ads.google.com) и нажмите у него «Подключить». Войдите тем же аккаунтом Google.",
    uz: "Shu yerda, «Reklama» bo‘limida, chapda kabinet yarating, 10 raqamli raqam bilan Google reklama kabinetini qo‘shing (u ads.google.com tepasida) va undagi «Ulash» ni bosing. O‘sha Google akkaunti bilan kiring.",
    pl: "Tutaj, w sekcji „Reklamy”, po lewej załóż przestrzeń, dodaj konto reklamowe Google z numerem z 10 cyfr (jest na górze ads.google.com) i kliknij przy nim „Połącz”. Zaloguj się tym samym kontem Google.",
  },
  g8: {
    ru: "В блоке «Планировщик ключевых слов» нажмите «Проверить». Должно ответить «работает» и показать, что в Узбекистане ищут чаще всего. С этого момента каждая статья получает поиски Google сама.",
    uz: "«Kalit so‘zlar rejalashtiruvchisi» blokida «Tekshirish» ni bosing. «ishlaydi» deb javob berishi va O‘zbekistonda eng ko‘p nima qidirilishini ko‘rsatishi kerak. Shundan boshlab har bir maqola Google qidiruvlarini o‘zi oladi.",
    pl: "W bloku „Planer słów kluczowych” kliknij „Sprawdź”. Powinno odpowiedzieć „działa” i pokazać, co w Uzbekistanie wyszukuje się najczęściej. Od tej chwili każdy artykuł sam dostaje wyszukiwania Google.",
  },
  consoleLink: { ru: "Открыть Google Cloud", uz: "Google Cloud’ni ochish", pl: "Otwórz Google Cloud" },
  clientId: { ru: "Client ID", uz: "Client ID", pl: "Client ID" },
  clientSecret: { ru: "Client secret", uz: "Client secret", pl: "Client secret" },
  isSet: { ru: "задано", uz: "berilgan", pl: "ustawiono" },
  isEmpty: { ru: "пусто", uz: "bo‘sh", pl: "puste" },
  save: { ru: "Сохранить", uz: "Saqlash", pl: "Zapisz" },
  redirect: {
    ru: "Адрес возврата для OAuth-клиента (Authorized redirect URI):",
    uz: "OAuth-mijoz uchun qaytish manzili (Authorized redirect URI):",
    pl: "Adres powrotu dla klienta OAuth (Authorized redirect URI):",
  },
  copy: { ru: "Скопировать", uz: "Nusxa olish", pl: "Kopiuj" },
  copied: { ru: "Скопировано", uz: "Nusxa olindi", pl: "Skopiowano" },
  plannerTitle: { ru: "Планировщик ключевых слов", uz: "Kalit so‘zlar rejalashtiruvchisi", pl: "Planer słów kluczowych" },
  plannerHint: {
    ru: "Сколько раз в месяц ищут фразу в Google: для каждой статьи сайта — по Узбекистану, для статей на площадках — по России. Берётся из подключённого кабинета Google Ads. Google открывает его с уровня доступа Basic у проекта Google Cloud.",
    uz: "Iborani Google’da oyiga necha marta qidirishadi: sayt maqolalari uchun — O‘zbekiston bo‘yicha, platformalardagi maqolalar uchun — Rossiya bo‘yicha. Ulangan Google Ads kabinetidan olinadi. Google uni Google Cloud loyihasining Basic kirish darajasidan ochadi.",
    pl: "Ile razy w miesiącu fraza jest wyszukiwana w Google: dla każdego artykułu strony — w Uzbekistanie, dla artykułów na platformach — w Rosji. Dane z podłączonego konta Google Ads. Google udostępnia go od poziomu dostępu Basic w projekcie Google Cloud.",
  },
  account: { ru: "Кабинет", uz: "Kabinet", pl: "Konto" },
  accountAuto: {
    ru: "Не выбран: если подключён один, берётся он",
    uz: "Tanlanmagan: bittasi ulangan bo‘lsa, o‘sha olinadi",
    pl: "Nie wybrano: jeśli podłączone jest jedno, bierze się je",
  },
  noAccounts: {
    ru: "Подключённых кабинетов Google нет. Заведите кабинет (слева), добавьте рекламный кабинет Google с номером из 10 цифр и нажмите у него «Подключить».",
    uz: "Ulangan Google kabinetlari yo‘q. Kabinet yarating (chapda), 10 raqamli raqam bilan Google reklama kabinetini qo‘shing va undagi «Ulash»ni bosing.",
    pl: "Brak podłączonych kont Google. Załóż przestrzeń (po lewej), dodaj konto reklamowe Google z numerem z 10 cyfr i kliknij przy nim „Połącz”.",
  },
  check: { ru: "Проверить", uz: "Tekshirish", pl: "Sprawdź" },
  lastCheck: {
    ru: (at: string) => `Проверка ${at}:`,
    uz: (at: string) => `Tekshiruv ${at}:`,
    pl: (at: string) => `Sprawdzenie ${at}:`,
  },
  top: { ru: "Чаще всего ищут:", uz: "Eng ko‘p qidirilgan:", pl: "Najczęściej wyszukiwane:" },
  r_keys_saved: { ru: "Ключи сохранены.", uz: "Kalitlar saqlandi.", pl: "Klucze zapisane." },
  r_keys_bad: {
    ru: "Не похоже на ключи Google: Client ID кончается на .apps.googleusercontent.com, секрет — строка из букв и цифр. Ничего не сохранено.",
    uz: "Google kalitlariga o‘xshamaydi: Client ID .apps.googleusercontent.com bilan tugaydi, sir — harf va raqamlardan iborat qator. Hech narsa saqlanmadi.",
    pl: "To nie wygląda na klucze Google: Client ID kończy się na .apps.googleusercontent.com, sekret to ciąg liter i cyfr. Nic nie zapisano.",
  },
  r_forbidden: { ru: "Это может только владелец или руководитель.", uz: "Buni faqat egasi yoki rahbar qila oladi.", pl: "To może tylko właściciel albo kierownik." },
  r_planner_set: { ru: "Кабинет для планировщика выбран.", uz: "Rejalashtiruvchi uchun kabinet tanlandi.", pl: "Konto dla planera wybrane." },
  r_planner_bad: { ru: "Такого кабинета Google нет.", uz: "Bunday Google kabineti yo‘q.", pl: "Nie ma takiego konta Google." },
  r_failed: { ru: "Не получилось. Попробуйте ещё раз.", uz: "Bo‘lmadi. Yana urinib ko‘ring.", pl: "Nie udało się. Spróbuj jeszcze raz." },
  r_checked: { ru: "Проверка готова — итог ниже.", uz: "Tekshiruv tayyor — natija pastda.", pl: "Sprawdzenie gotowe — wynik poniżej." },
});
