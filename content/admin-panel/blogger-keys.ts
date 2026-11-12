import { defineDict } from "@/lib/admin/i18n";

/**
 * Блок «Подключения Instagram» и «Кому открыт раздел» во вкладке «Блогеры»
 * (components/admin/blogger-keys.tsx). Владелец, 06.11.2026: «Добавить поля,
 * что куда вписать с инструкцией понятной, откуда что взять и вставить, что
 * бы работало». Названия экранов Meta в узбекском и польском — английские:
 * у кабинета разработчика Meta нет узбекского, а польский у владельца не
 * стоит; в русском — как в русском кабинете, с английским в скобках.
 */
export const bloggerKeysDict = defineDict({
  title: { ru: "Подключения Instagram", uz: "Instagram ulanishlari", pl: "Połączenia z Instagramem" },
  lead: {
    ru: "Сюда вставляются ключи от Meta (это компания Facebook и Instagram). С ними агент видит точные цифры блогеров и сам отвечает им в Direct. Ключи уходят в хранилище секретов и обратно не показываются — только «задано» или «пусто». Пустое поле при сохранении ключ не меняет.",
    uz: "Bu yerga Meta kalitlari kiritiladi (Meta — Facebook va Instagram kompaniyasi). Ular bilan agent blogerlarning aniq raqamlarini ko‘radi va Directda ularga o‘zi javob beradi. Kalitlar sirlar omboriga ketadi va qaytib ko‘rsatilmaydi — faqat «kiritilgan» yoki «bo‘sh». Saqlashda bo‘sh maydon kalitni o‘zgartirmaydi.",
    pl: "Tu wkleja się klucze od Meta (firma od Facebooka i Instagrama). Z nimi agent widzi dokładne liczby blogerów i sam odpowiada im w Direct. Klucze trafiają do magazynu sekretów i nie są pokazywane z powrotem — tylko „ustawiono” albo „puste”. Puste pole przy zapisie nie zmienia klucza.",
  },
  set: { ru: "задано", uz: "kiritilgan", pl: "ustawiono" },
  empty: { ru: "пусто", uz: "bo‘sh", pl: "puste" },
  inEnv: {
    ru: "задано в .env сервера — оно главнее, поле здесь его не заменит",
    uz: "server .env faylida kiritilgan — u ustun, bu yerdagi maydon uni almashtirmaydi",
    pl: "ustawiono w .env serwera — ma pierwszeństwo, pole tutaj go nie zastąpi",
  },
  howTo: { ru: "Где взять — по шагам", uz: "Qayerdan olish — qadamma-qadam", pl: "Skąd wziąć — krok po kroku" },
  copy: { ru: "Скопировать", uz: "Nusxalash", pl: "Kopiuj" },

  partA: { ru: "1. Цифры чужих профилей", uz: "1. Boshqa profillar raqamlari", pl: "1. Liczby cudzych profili" },
  partAWhy: {
    ru: "Без этого агент знает о блогере только число подписчиков из поиска. С этим — точные подписчики, лайки и комментарии последних постов и как часто он пишет.",
    uz: "Busiz agent bloger haqida faqat qidiruvdagi obunachilar sonini biladi. Bu bilan — aniq obunachilar, oxirgi postlardagi layk va izohlar hamda qanchalik tez-tez yozishi.",
    pl: "Bez tego agent zna o blogerze tylko liczbę obserwujących z wyszukiwarki. Z tym — dokładnych obserwujących, polubienia i komentarze ostatnich postów i jak często publikuje.",
  },
  fbToken: { ru: "Токен Facebook (начинается с EA…)", uz: "Facebook tokeni (EA… bilan boshlanadi)", pl: "Token Facebooka (zaczyna się od EA…)" },
  igUserId: {
    ru: "Номер Instagram-аккаунта студии — можно не заполнять, найдём сами",
    uz: "Studiya Instagram akkaunti raqami — to‘ldirmasangiz ham bo‘ladi, o‘zimiz topamiz",
    pl: "Numer konta Instagram studia — można zostawić puste, znajdziemy sami",
  },
  // Шаги — словами, «Шаг 1 — …», без цепочек «→» (владелец, 12.11.2026:
  // «перепиши инструкцию прям по шагам без >»). Названия — как в русском
  // кабинете Meta на 12.11.2026, в узбекском и польском — английские.
  stepNo: {
    ru: (n: number) => `Шаг ${n} —`,
    uz: (n: number) => `${n}-qadam —`,
    pl: (n: number) => `Krok ${n} —`,
  },
  a1: {
    ru: "Instagram студии должен быть профессиональным и связан со страницей студии на Facebook. Сделать профессиональным: в приложении Instagram откройте «Настройки и действия», потом «Тип аккаунта и инструменты» и нажмите «Переключиться на профессиональный аккаунт». Связать со страницей: откройте Meta Business Suite (ссылка ниже), там «Настройки», раздел «Аккаунты Instagram», кнопка «Подключить».",
    uz: "Studiya Instagrami professional bo‘lishi va studiyaning Facebook sahifasiga bog‘langan bo‘lishi kerak. Professional qilish: Instagram ilovasida «Settings and activity» ni oching, keyin «Account type and tools» va «Switch to professional account» ni bosing. Sahifaga bog‘lash: Meta Business Suite’ni oching (havola pastda), u yerda «Settings», «Instagram accounts» bo‘limi, «Connect» tugmasi.",
    pl: "Instagram studia musi być kontem profesjonalnym i być połączony ze stroną studia na Facebooku. Przełączenie: w aplikacji Instagram otwórz „Settings and activity”, potem „Account type and tools” i kliknij „Switch to professional account”. Połączenie ze stroną: otwórz Meta Business Suite (link poniżej), tam „Settings”, sekcja „Instagram accounts”, przycisk „Connect”.",
  },
  a2: {
    ru: "Откройте кабинет разработчика Meta (ссылка ниже) с того Facebook, который управляет страницей студии, и выберите приложение студии («Devuz inst»). Новое приложение создавать не нужно: оно одно и для цифр, и для Direct.",
    uz: "Meta dasturchi kabinetini (havola pastda) studiya sahifasini boshqaradigan Facebook bilan oching va studiya ilovasini tanlang («Devuz inst»). Yangi ilova yaratish shart emas: raqamlar uchun ham, Direct uchun ham u bitta.",
    pl: "Otwórz panel deweloperski Meta (link poniżej) na tym Facebooku, który zarządza stroną studia, i wybierz aplikację studia („Devuz inst”). Nowej aplikacji nie trzeba tworzyć: jest jedna i do liczb, i do Direct.",
  },
  a3: {
    ru: "Откройте Graph API Explorer (ссылка ниже). Справа в поле «Приложение Meta» выберите приложение студии, в поле «Пользователь или страница» выберите «Маркер доступа пользователя». В поле «Разрешения» добавьте все права из строки ниже. Нажмите «Сгенерировать маркер доступа» (Generate Access Token), войдите и отметьте страницу студии и её Instagram.",
    uz: "Graph API Explorer’ni oching (havola pastda). O‘ngda «Meta App» maydonida studiya ilovasini, «User or Page» maydonida «User Token» ni tanlang. «Permissions» maydoniga pastdagi qatordagi barcha huquqlarni qo‘shing. «Generate Access Token» ni bosing, kiring va studiya sahifasi hamda uning Instagramini belgilang.",
    pl: "Otwórz Graph API Explorer (link poniżej). Po prawej w polu „Meta App” wybierz aplikację studia, w polu „User or Page” wybierz „User Token”. W polu „Permissions” dodaj wszystkie uprawnienia z wiersza poniżej. Kliknij „Generate Access Token”, zaloguj się i zaznacz stronę studia i jej Instagram.",
  },
  a4: {
    ru: "Этот токен живёт всего час. Скопируйте его, откройте «Отладчик маркеров доступа» (ссылка ниже), вставьте токен и нажмите «Отладка». Внизу нажмите «Продлить маркер доступа» (Extend Access Token): появится новый токен на 60 дней. Именно его вставьте в поле «Токен Facebook». Часовой токен проверка не примет и напишет «короткий токен».",
    uz: "Bu token atigi bir soat yashaydi. Uni nusxalang, «Access Token Debugger» ni oching (havola pastda), tokenni qo‘ying va «Debug» ni bosing. Pastda «Extend Access Token» ni bosing: 60 kunlik yangi token chiqadi. Aynan uni «Facebook tokeni» maydoniga qo‘ying. Bir soatlik tokenni tekshiruv qabul qilmaydi va «qisqa token» deb yozadi.",
    pl: "Ten token żyje tylko godzinę. Skopiuj go, otwórz „Access Token Debugger” (link poniżej), wklej token i kliknij „Debug”. Na dole kliknij „Extend Access Token”: pojawi się nowy token na 60 dni. Właśnie jego wklej w pole „Token Facebooka”. Tokenu godzinnego sprawdzenie nie przyjmie i napisze „krótki token”.",
  },
  a5: {
    ru: "Нажмите «Сохранить и проверить». Номер Instagram-аккаунта можно не заполнять: сервер найдёт его по токену сам и проверит, что цифры чужого профиля приходят.",
    uz: "«Saqlash va tekshirish» ni bosing. Instagram akkaunti raqamini to‘ldirmasangiz ham bo‘ladi: server uni token orqali o‘zi topadi va boshqa profil raqamlari kelayotganini tekshiradi.",
    pl: "Kliknij „Zapisz i sprawdź”. Numeru konta Instagram można nie wpisywać: serwer sam znajdzie go po tokenie i sprawdzi, czy przychodzą liczby cudzego profilu.",
  },
  a6: {
    ru: "Через 60 дней токен кончится. За неделю до этого здесь появится жёлтая строка «пора продлить»: повторите шаги 3, 4 и 5.",
    uz: "60 kundan keyin token tugaydi. Undan bir hafta oldin bu yerda sariq «uzaytirish vaqti» qatori chiqadi: 3, 4 va 5-qadamlarni takrorlang.",
    pl: "Po 60 dniach token wygaśnie. Tydzień wcześniej pojawi się tu żółty wiersz „czas przedłużyć”: powtórz kroki 3, 4 i 5.",
  },
  scopesLine: { ru: "Права для шага 3:", uz: "3-qadam uchun huquqlar:", pl: "Uprawnienia do kroku 3:" },

  partB: { ru: "2. Ответы блогерам в Direct", uz: "2. Directda blogerlarga javoblar", pl: "2. Odpowiedzi blogerom w Direct" },
  partBWhy: {
    ru: "Без этого на ответ блогера в Direct отвечает человек с телефона. С этим — агент сам, от имени Instagram студии. Это же приложение подключает Instagram клиентам сервиса.",
    uz: "Busiz Directdagi bloger javobiga telefondan odam javob beradi. Bu bilan — agent o‘zi, studiya Instagrami nomidan. Shu ilova xizmat mijozlariga ham Instagramni ulaydi.",
    pl: "Bez tego na odpowiedź blogera w Direct odpowiada człowiek z telefonu. Z tym — agent sam, w imieniu Instagrama studia. Ta sama aplikacja podłącza Instagram klientom usługi.",
  },
  appId: { ru: "ID приложения Instagram", uz: "Instagram ilovasi ID", pl: "ID aplikacji Instagram" },
  appSecret: { ru: "Секрет приложения Instagram", uz: "Instagram ilovasi siri", pl: "Sekret aplikacji Instagram" },
  verify: { ru: "Проверочный токен вебхука — создаётся сам", uz: "Vebhuk tekshiruv tokeni — o‘zi yaratiladi", pl: "Token weryfikacyjny webhooka — tworzy się sam" },
  verifyLater: {
    ru: "появится после первого «Сохранить и проверить»",
    uz: "birinchi «Saqlash va tekshirish» dan keyin chiqadi",
    pl: "pojawi się po pierwszym „Zapisz i sprawdź”",
  },
  webhookUrl: { ru: "Адрес вебхука", uz: "Vebhuk manzili", pl: "Adres webhooka" },
  redirectUrls: { ru: "Адреса возврата", uz: "Qaytish manzillari", pl: "Adresy powrotu" },
  b1: {
    ru: "Откройте кабинет разработчика Meta (ссылка ниже) и выберите приложение студии («Devuz inst»). Слева нажмите «Сценарии использования».",
    uz: "Meta dasturchi kabinetini oching (havola pastda) va studiya ilovasini tanlang («Devuz inst»). Chapda «Use cases» ni bosing.",
    pl: "Otwórz panel deweloperski Meta (link poniżej) i wybierz aplikację studia („Devuz inst”). Po lewej kliknij „Use cases”.",
  },
  b2: {
    ru: "Найдите сценарий «Управление сообщениями и контентом в Instagram» и нажмите «Настроить». Если его нет в списке, нажмите вверху «Добавить сценарии использования» и выберите его. Внутри откройте пункт «Настройка API со входом через Instagram». Не путайте с «входом через Facebook»: нам нужен вход через Instagram.",
    uz: "«Manage messaging & content on Instagram» ssenariysini toping va «Customize» ni bosing. Ro‘yxatda bo‘lmasa, tepada «Add use cases» ni bosing va uni tanlang. Ichida «API setup with Instagram login» bandini oching. «Facebook login» bilan adashtirmang: bizga Instagram orqali kirish kerak.",
    pl: "Znajdź przypadek „Manage messaging & content on Instagram” i kliknij „Customize”. Jeśli go nie ma na liście, kliknij u góry „Add use cases” i wybierz go. W środku otwórz punkt „API setup with Instagram login”. Nie myl z „Facebook login”: potrzebne jest logowanie przez Instagram.",
  },
  b3: {
    ru: "Вверху этой страницы — «ID приложения Instagram» и «Секрет приложения Instagram» (нажмите «Показать»). Скопируйте оба в поля внизу этого блока. Внимание: это не тот номер, что в шапке приложения и в «Настройки приложения», «Основное». У Instagram номер свой. Если вставить общий номер приложения, при подключении Instagram пишет «Недействительный запрос».",
    uz: "Bu sahifa tepasida «Instagram app ID» va «Instagram app secret» bor («Show» ni bosing). Ikkalasini shu blok pastidagi maydonlarga nusxalang. Diqqat: bu ilova sarlavhasidagi va «App settings», «Basic» dagi raqam emas. Instagramning raqami alohida. Ilovaning umumiy raqamini qo‘ysangiz, ulashda Instagram «Invalid request» deb yozadi.",
    pl: "Na górze tej strony są „Instagram app ID” i „Instagram app secret” (kliknij „Show”). Skopiuj oba w pola na dole tego bloku. Uwaga: to nie jest numer z nagłówka aplikacji ani z „App settings”, „Basic”. Instagram ma własny numer. Jeśli wkleisz ogólny numer aplikacji, przy podłączaniu Instagram napisze „Invalid request”.",
  },
  b4: {
    ru: "На этой же странице, в разделе «Создайте маркеры доступа», нажмите «Добавить аккаунт» и войдите в Instagram студии. Так он становится тестировщиком приложения. Пока приложение не опубликовано, работать с ним могут только тестировщики.",
    uz: "Shu sahifaning «Generate access tokens» bo‘limida «Add account» ni bosing va studiya Instagramiga kiring. Shunday qilib u ilova testeriga aylanadi. Ilova nashr qilinmaguncha u bilan faqat testerlar ishlay oladi.",
    pl: "Na tej samej stronie, w sekcji „Generate access tokens”, kliknij „Add account” i zaloguj się na Instagram studia. Tak staje się on testerem aplikacji. Dopóki aplikacja nie jest opublikowana, mogą z nią pracować tylko testerzy.",
  },
  b5: {
    ru: "Ниже, в разделе «Настройте веб-хуки», в поле «URL обратного вызова» вставьте адрес вебхука ниже, а в поле «Подтверждение маркера» — проверочный токен ниже. Нажмите «Проверить и сохранить». Потом в списке полей включите подписку у messages.",
    uz: "Pastroqda, «Configure webhooks» bo‘limida «Callback URL» maydoniga pastdagi vebhuk manzilini, «Verify token» maydoniga esa pastdagi tekshiruv tokenini qo‘ying. «Verify and save» ni bosing. Keyin maydonlar ro‘yxatida messages uchun obunani yoqing.",
    pl: "Niżej, w sekcji „Configure webhooks”, w pole „Callback URL” wklej adres webhooka poniżej, a w pole „Verify token” token weryfikacyjny poniżej. Kliknij „Verify and save”. Potem na liście pól włącz subskrypcję przy messages.",
  },
  b6: {
    ru: "Ещё ниже, в разделе «Настройте вход в Instagram для бизнеса», нажмите «Настройки бизнес-входа». В поле «URI перенаправления OAuth» добавьте оба адреса возврата ниже, каждый отдельной строкой, и нажмите «Сохранить».",
    uz: "Yana pastroqda, «Set up Instagram business login» bo‘limida «Business login settings» ni bosing. «OAuth redirect URIs» maydoniga pastdagi ikkala qaytish manzilini, har birini alohida qatorda qo‘shing va «Save» ni bosing.",
    pl: "Jeszcze niżej, w sekcji „Set up Instagram business login”, kliknij „Business login settings”. W polu „OAuth redirect URIs” dodaj oba adresy powrotu poniżej, każdy w osobnym wierszu, i kliknij „Save”.",
  },
  b7: {
    ru: "Проверьте, что Instagram студии принял роль. Слева откройте «Роли в приложении», потом «Роли», вкладку «Тестировщики Instagram»: там должен быть ник студии. Если рядом написано «Ожидает», откройте Instagram на компьютере, зайдите в «Настройки», раздел «Приложения и сайты», вкладку «Приглашения тестировщика» и нажмите «Принять».",
    uz: "Studiya Instagrami rolni qabul qilganini tekshiring. Chapda «App roles» ni, keyin «Roles» ni va «Instagram Testers» vkladkasini oching: u yerda studiya niki bo‘lishi kerak. Yonida «Pending» yozilgan bo‘lsa, Instagramni kompyuterda oching, «Settings», «Apps and websites» bo‘limi, «Tester invites» vkladkasiga kiring va «Accept» ni bosing.",
    pl: "Sprawdź, czy Instagram studia przyjął rolę. Po lewej otwórz „App roles”, potem „Roles”, kartę „Instagram Testers”: musi tam być nick studia. Jeśli obok jest „Pending”, otwórz Instagram na komputerze, wejdź w „Settings”, sekcję „Apps and websites”, kartę „Tester invites” i kliknij „Accept”.",
  },
  b8: {
    ru: "Вернитесь сюда и нажмите «Сохранить и проверить». Потом нажмите «Подключить Instagram студии» вверху вкладки и войдите аккаунтом студии. В строке «Переписка в Direct» появится «подключено». Проверить ответы можно уже сейчас: добавьте ещё один свой Instagram тестировщиком (как в шаге 7) и напишите с него студии.",
    uz: "Bu yerga qayting va «Saqlash va tekshirish» ni bosing. Keyin vkladka tepasidagi «Studiya Instagramini ulash» ni bosing va studiya akkaunti bilan kiring. «Direct yozishmasi» qatorida «ulangan» chiqadi. Javoblarni hozirning o‘zida tekshirish mumkin: yana bitta o‘z Instagramingizni tester qilib qo‘shing (7-qadamdagidek) va undan studiyaga yozing.",
    pl: "Wróć tutaj i kliknij „Zapisz i sprawdź”. Potem kliknij „Podłącz Instagram studia” na górze karty i zaloguj się kontem studia. W wierszu „Rozmowy w Direct” pojawi się „podłączone”. Odpowiedzi można sprawdzić już teraz: dodaj jeszcze jeden swój Instagram jako testera (jak w kroku 7) i napisz z niego do studia.",
  },
  b9: {
    ru: "Почему агент пока не отвечает всем: у приложения статус «Не опубликовано», и Meta присылает нам сообщения только от тестировщиков. Чтобы приходили сообщения от всех блогеров, приложение публикуют. Путь к этому — список «Требования к приложению и его настройка» на «Панели» приложения, его проходят сверху вниз. Пункт «Проверьте требования к тестированию и выполните их» — это и есть «тесты»: Meta хочет видеть, что приложение недавно хотя бы раз успешно обратилось к Instagram по каждому разрешению. Отдельно ничего делать не нужно: шаг 8 и «Сохранить и проверить» делают такие обращения сами. Зелёная галочка у пункта значит, что он выполнен.",
    uz: "Nega agent hozircha hammaga javob bermaydi: ilovaning holati «Unpublished», va Meta bizga xabarlarni faqat testerlardan yuboradi. Barcha blogerlardan xabar kelishi uchun ilova nashr qilinadi. Bunga yo‘l — ilova «Dashboard» idagi talablar ro‘yxati, u yuqoridan pastga bajariladi. Testlash talablarini tekshirish bandi — bu o‘sha «testlar»: Meta ilova yaqinda har bir ruxsat bo‘yicha Instagramga kamida bir marta muvaffaqiyatli murojaat qilganini ko‘rmoqchi. Alohida hech narsa qilish shart emas: 8-qadam va «Saqlash va tekshirish» bunday murojaatlarni o‘zi qiladi. Band yonidagi yashil belgi u bajarilganini bildiradi.",
    pl: "Dlaczego agent jeszcze nie odpowiada wszystkim: aplikacja ma status „Unpublished”, a Meta przysyła nam wiadomości tylko od testerów. Żeby przychodziły wiadomości od wszystkich blogerów, aplikację się publikuje. Droga do tego to lista wymagań na „Dashboard” aplikacji, przechodzi się ją od góry do dołu. Punkt o wymaganiach testowych to właśnie te „testy”: Meta chce zobaczyć, że aplikacja niedawno choć raz udanie odwołała się do Instagrama przy każdym uprawnieniu. Osobno nic nie trzeba robić: krok 8 i „Zapisz i sprawdź” robią takie odwołania same. Zielony znacznik przy punkcie oznacza, że jest zrobiony.",
  },
  b10: {
    ru: "Пункт «Подтверждение компании»: выберите бизнес-портфолио студии и подтвердите, что компания настоящая. Meta попросит название и адрес точно как в документах ИП, сам документ (свидетельство о регистрации или выписку), сайт devuz.studio и телефон или почту для кода. Проверка идёт от пары дней до пары недель. Без неё опубликовать приложение нельзя.",
    uz: "«Business verification» bandi: studiyaning biznes portfoliosini tanlang va kompaniya haqiqiy ekanini tasdiqlang. Meta YaTT hujjatlaridagidek aniq nom va manzilni, hujjatning o‘zini (ro‘yxatdan o‘tganlik guvohnomasi yoki ko‘chirma), devuz.studio saytini va kod uchun telefon yoki pochtani so‘raydi. Tekshiruv bir necha kundan bir necha haftagacha davom etadi. Usiz ilovani nashr qilib bo‘lmaydi.",
    pl: "Punkt „Business verification”: wybierz portfolio biznesowe studia i potwierdź, że firma jest prawdziwa. Meta poprosi o nazwę i adres dokładnie jak w dokumentach działalności, sam dokument (zaświadczenie o rejestracji lub wypis), stronę devuz.studio i telefon albo e-mail do kodu. Sprawdzenie trwa od kilku dni do kilku tygodni. Bez niego nie da się opublikować aplikacji.",
  },
  b11: {
    ru: "Пункт «Проверка приложения»: попросите расширенный доступ к instagram_business_basic и instagram_business_manage_messages (Human Agent добавится сам). Meta попросит значок 1024×1024, ссылку на политику конфиденциальности (devuz.studio/ru/privacy), категорию и почту. Ещё нужна инструкция проверяющему на английском (как войти и где кнопка подключения) и на каждое разрешение короткая запись экрана с английским интерфейсом: вход через Instagram и ответ агента в Direct. Вход в панель для проверяющего заведёт разработчик. Ответ обычно приходит за несколько дней. Отказали — в письме причина: её исправляют и отправляют снова.",
    uz: "«App Review» bandi: instagram_business_basic va instagram_business_manage_messages uchun kengaytirilgan kirishni so‘rang (Human Agent o‘zi qo‘shiladi). Meta 1024×1024 belgini, maxfiylik siyosati havolasini (devuz.studio/uz/privacy), toifani va pochtani so‘raydi. Yana tekshiruvchi uchun ingliz tilida yo‘riqnoma (qanday kirish va ulash tugmasi qayerda) va har bir ruxsat uchun ingliz interfeysli qisqa ekran yozuvi kerak: Instagram orqali kirish va agentning Directdagi javobi. Tekshiruvchi uchun panelga kirishni dasturchi ochib beradi. Javob odatda bir necha kunda keladi. Rad etishsa, xatda sababi bo‘ladi: uni tuzatib qayta yuborishadi.",
    pl: "Punkt „App Review”: poproś o rozszerzony dostęp do instagram_business_basic i instagram_business_manage_messages (Human Agent doda się sam). Meta poprosi o ikonę 1024×1024, link do polityki prywatności (devuz.studio/pl/privacy), kategorię i e-mail. Potrzebna jest też instrukcja dla sprawdzającego po angielsku (jak się zalogować i gdzie jest przycisk podłączenia) i do każdego uprawnienia krótkie nagranie ekranu z angielskim interfejsem: logowanie przez Instagram i odpowiedź agenta w Direct. Logowanie do panelu dla sprawdzającego założy programista. Odpowiedź zwykle przychodzi w kilka dni. Odmowa — w e-mailu jest powód: poprawia się go i wysyła ponownie.",
  },
  b12: {
    ru: "Последний пункт — «Убедитесь, что все требования выполнены, а затем опубликуйте приложение». Слева нажмите «Опубликовать». Статус сменится на «Опубликовано», и агент начнёт отвечать всем блогерам, а Instagram клиентов сервиса будет подключаться без приглашений тестировщика. Цифрам чужих профилей (часть 1) публикация не нужна.",
    uz: "Oxirgi band — barcha talablar bajarilganini tekshirib, ilovani nashr qilish. Chapda «Publish» ni bosing. Holat «Published» ga o‘zgaradi, agent barcha blogerlarga javob bera boshlaydi, xizmat mijozlarining Instagrami esa tester taklifisiz ulanadi. Boshqa profillar raqamlari (1-qism) uchun nashr shart emas.",
    pl: "Ostatni punkt — sprawdzić, czy wszystkie wymagania są spełnione, i opublikować aplikację. Po lewej kliknij „Publish”. Status zmieni się na „Published”, agent zacznie odpowiadać wszystkim blogerom, a Instagram klientów usługi będzie się podłączał bez zaproszeń testera. Liczbom cudzych profili (część 1) publikacja nie jest potrzebna.",
  },

  save: { ru: "Сохранить и проверить", uz: "Saqlash va tekshirish", pl: "Zapisz i sprawdź" },
  saving: { ru: "Проверяю у Meta…", uz: "Metada tekshiryapman…", pl: "Sprawdzam w Meta…" },
  checkAgain: { ru: "Проверить ещё раз", uz: "Yana tekshirish", pl: "Sprawdź ponownie" },
  checkedOk: {
    ru: (when: string, who: string) => `Проверено ${when}: работает, аккаунт студии ${who}, цифры чужих профилей приходят.`,
    uz: (when: string, who: string) => `${when} tekshirildi: ishlayapti, studiya akkaunti ${who}, boshqa profillar raqamlari kelyapti.`,
    pl: (when: string, who: string) => `Sprawdzono ${when}: działa, konto studia ${who}, liczby cudzych profili przychodzą.`,
  },
  tokenUntil: {
    ru: (date: string) => `Токен действует до ${date}.`,
    uz: (date: string) => `Token ${date} gacha amal qiladi.`,
    pl: (date: string) => `Token ważny do ${date}.`,
  },
  tokenSoon: {
    ru: (date: string) => `Токен кончится ${date} — пора продлить: повторите шаги 3 и 4.`,
    uz: (date: string) => `Token ${date} da tugaydi — uzaytirish vaqti: 3 va 4-qadamlarni takrorlang.`,
    pl: (date: string) => `Token wygaśnie ${date} — czas przedłużyć: powtórz kroki 3 i 4.`,
  },
  checkedFail: {
    ru: (when: string) => `Проверено ${when}: не работает.`,
    uz: (when: string) => `${when} tekshirildi: ishlamayapti.`,
    pl: (when: string) => `Sprawdzono ${when}: nie działa.`,
  },
  why_no_token: { ru: "Нет токена Facebook — вставьте его в поле.", uz: "Facebook tokeni yo‘q — uni maydonga qo‘ying.", pl: "Brak tokena Facebooka — wklej go w pole." },
  why_token: {
    ru: "Meta не принимает токен: он неверный или кончился. Получите новый (шаги 3 и 4).",
    uz: "Meta tokenni qabul qilmayapti: u noto‘g‘ri yoki tugagan. Yangisini oling (3 va 4-qadamlar).",
    pl: "Meta nie przyjmuje tokena: jest błędny albo wygasł. Zdobądź nowy (kroki 3 i 4).",
  },
  why_short: {
    ru: "Это короткий токен на час. Продлите его до 60 дней (шаг 4) и вставьте новый.",
    uz: "Bu bir soatlik qisqa token. Uni 60 kungacha uzaytiring (4-qadam) va yangisini qo‘ying.",
    pl: "To krótki token na godzinę. Przedłuż go do 60 dni (krok 4) i wklej nowy.",
  },
  why_scopes: {
    ru: "У токена не хватает прав. Получите его заново со всеми правами из шага 3.",
    uz: "Tokenda huquqlar yetishmayapti. Uni 3-qadamdagi barcha huquqlar bilan qaytadan oling.",
    pl: "Tokenowi brakuje uprawnień. Zdobądź go ponownie ze wszystkimi uprawnieniami z kroku 3.",
  },
  why_no_ig: {
    ru: "К страницам этого токена не привязан профессиональный Instagram. Проверьте шаг 1 и что при входе в шаге 3 отмечены страница и Instagram.",
    uz: "Bu token sahifalariga professional Instagram bog‘lanmagan. 1-qadamni va 3-qadamda kirishda sahifa hamda Instagram belgilanganini tekshiring.",
    pl: "Do stron tego tokena nie jest podłączony profesjonalny Instagram. Sprawdź krok 1 i czy przy logowaniu w kroku 3 zaznaczono stronę i Instagram.",
  },
  why_id: {
    ru: "Номер Instagram-аккаунта не подходит к токену, а по страницам токена другой не нашёлся. Проверьте шаг 1.",
    uz: "Instagram akkaunti raqami tokenga mos kelmayapti, token sahifalarida boshqasi topilmadi. 1-qadamni tekshiring.",
    pl: "Numer konta Instagram nie pasuje do tokena, a na stronach tokena nie znalazł się inny. Sprawdź krok 1.",
  },
  why_discovery: {
    ru: "Свой аккаунт отвечает, а цифры чужих профилей — нет. Обычно не хватает права instagram_manage_insights или ads_read: получите токен заново (шаги 3 и 4).",
    uz: "O‘z akkauntimiz javob beryapti, boshqa profillar raqamlari esa yo‘q. Odatda instagram_manage_insights yoki ads_read huquqi yetishmaydi: tokenni qaytadan oling (3 va 4-qadamlar).",
    pl: "Własne konto odpowiada, a liczby cudzych profili nie. Zwykle brakuje uprawnienia instagram_manage_insights lub ads_read: zdobądź token ponownie (kroki 3 i 4).",
  },
  why_network: { ru: "Meta не ответила. Попробуйте «Проверить ещё раз» через минуту.", uz: "Meta javob bermadi. Bir daqiqadan keyin «Yana tekshirish» ni bosing.", pl: "Meta nie odpowiedziała. Spróbuj „Sprawdź ponownie” za minutę." },
  why_other: { ru: "Meta ответила ошибкой. Попробуйте ещё раз или напишите разработчику.", uz: "Meta xato bilan javob berdi. Yana urinib ko‘ring yoki dasturchiga yozing.", pl: "Meta odpowiedziała błędem. Spróbuj ponownie albo napisz do programisty." },
  missing: {
    ru: (list: string) => `Не хватает: ${list}.`,
    uz: (list: string) => `Yetishmayapti: ${list}.`,
    pl: (list: string) => `Brakuje: ${list}.`,
  },

  // Итог нажатия (?k=…).
  r_ok: { ru: "Сохранено и проверено: работает.", uz: "Saqlandi va tekshirildi: ishlayapti.", pl: "Zapisano i sprawdzono: działa." },
  r_check: { ru: "Сохранено, но проверка не прошла — причина ниже.", uz: "Saqlandi, lekin tekshiruvdan o‘tmadi — sababi pastda.", pl: "Zapisano, ale sprawdzenie nie przeszło — powód poniżej." },
  r_saved: { ru: "Ключи сохранены.", uz: "Kalitlar saqlandi.", pl: "Klucze zapisane." },
  r_same: { ru: "Поля пустые — ничего не поменялось.", uz: "Maydonlar bo‘sh — hech narsa o‘zgarmadi.", pl: "Pola puste — nic się nie zmieniło." },
  r_failed: { ru: "Хранилище не приняло ключ. Попробуйте ещё раз.", uz: "Ombor kalitni qabul qilmadi. Yana urinib ko‘ring.", pl: "Magazyn nie przyjął klucza. Spróbuj ponownie." },
  r_bad: {
    ru: (field: string) => `Не похоже на нужный ключ: «${field}». Ничего не сохранено — проверьте, что скопировали целиком.`,
    uz: (field: string) => `Kerakli kalitga o‘xshamaydi: «${field}». Hech narsa saqlanmadi — to‘liq nusxalaganingizni tekshiring.`,
    pl: (field: string) => `Nie wygląda na właściwy klucz: „${field}”. Nic nie zapisano — sprawdź, czy skopiowano całość.`,
  },
  r_igToken: {
    ru: "Это токен Instagram (IG…), а нужен токен Facebook (EA…) из Graph API Explorer — шаги 3 и 4.",
    uz: "Bu Instagram tokeni (IG…), kerakli esa Graph API Explorer’dan Facebook tokeni (EA…) — 3 va 4-qadamlar.",
    pl: "To token Instagrama (IG…), a potrzebny jest token Facebooka (EA…) z Graph API Explorer — kroki 3 i 4.",
  },
  r_access: { ru: "Доступ сохранён.", uz: "Kirish saqlandi.", pl: "Dostęp zapisany." },
  r_access_failed: { ru: "Не всем удалось поменять доступ. Попробуйте ещё раз.", uz: "Hammaga kirishni o‘zgartirib bo‘lmadi. Yana urinib ko‘ring.", pl: "Nie wszystkim udało się zmienić dostęp. Spróbuj ponownie." },

  accessTitle: { ru: "Кому открыт раздел", uz: "Bo‘lim kimga ochiq", pl: "Komu otwarty jest dział" },
  accessLead: {
    ru: "По умолчанию — вам и руководителю. Отметьте менеджеров, которым открыть вкладку «Блогеры»: они отправляют первые сообщения и отмечают ответы, а ключи, настройки агента и заведение партнёра видят только вы и руководитель. Это та же галочка, что в «Команда» → «Разделы».",
    uz: "Odatiy holatda — sizga va rahbarga. «Blogerlar» vkladkasini ochmoqchi bo‘lgan menejerlarni belgilang: ular birinchi xabarlarni yuboradi va javoblarni belgilaydi, kalitlar, agent sozlamalari va hamkor qo‘shishni faqat siz va rahbar ko‘rasiz. Bu «Jamoa» → «Bo‘limlar» dagi o‘sha belgi.",
    pl: "Domyślnie — tobie i kierownikowi. Zaznacz menedżerów, którym otworzyć kartę „Blogerzy”: wysyłają pierwsze wiadomości i oznaczają odpowiedzi, a klucze, ustawienia agenta i dodanie partnera widzisz tylko ty i kierownik. To ten sam znacznik co w „Zespół” → „Działy”.",
  },
  accessYou: { ru: "Вы — всегда", uz: "Siz — har doim", pl: "Ty — zawsze" },
  roleHead: { ru: "руководитель", uz: "rahbar", pl: "kierownik" },
  roleManager: { ru: "менеджер", uz: "menejer", pl: "menedżer" },
  accessSave: { ru: "Сохранить доступ", uz: "Kirishni saqlash", pl: "Zapisz dostęp" },
  accessNone: { ru: "В команде пока нет менеджеров.", uz: "Jamoada hozircha menejerlar yo‘q.", pl: "W zespole nie ma jeszcze menedżerów." },
});
