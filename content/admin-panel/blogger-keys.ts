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
  a1: {
    ru: "Instagram студии должен быть профессиональным (бизнес или автор) и привязан к странице Facebook студии. В приложении Instagram: «Настройки» → «Тип аккаунта и инструменты» → «Переключиться на профессиональный аккаунт». Привязать: Meta Business Suite → «Настройки» → «Аккаунты Instagram» → «Подключить».",
    uz: "Studiya Instagrami professional (biznes yoki muallif) bo‘lishi va studiyaning Facebook sahifasiga bog‘langan bo‘lishi kerak. Instagram ilovasida: «Settings» → «Account type and tools» → «Switch to professional account». Bog‘lash: Meta Business Suite → «Settings» → «Instagram accounts» → «Connect».",
    pl: "Instagram studia musi być kontem profesjonalnym (firma lub twórca) i być połączony ze stroną studia na Facebooku. W aplikacji Instagram: „Settings” → „Account type and tools” → „Switch to professional account”. Połączenie: Meta Business Suite → „Settings” → „Instagram accounts” → „Connect”.",
  },
  a2: {
    ru: "Откройте кабинет разработчика Meta (ссылка ниже) тем Facebook, который управляет страницей студии. «Создать приложение» (Create app), тип «Бизнес» — или откройте уже созданное приложение для Instagram: оно одно на всё.",
    uz: "Meta dasturchi kabinetini (havola pastda) studiya sahifasini boshqaradigan Facebook bilan oching. «Create app», turi «Business» — yoki Instagram uchun yaratilgan ilovani oching: u hammasi uchun bitta.",
    pl: "Otwórz panel deweloperski Meta (link poniżej) na tym Facebooku, który zarządza stroną studia. „Create app”, typ „Business” — albo otwórz już utworzoną aplikację do Instagrama: jest jedna na wszystko.",
  },
  a3: {
    ru: "Откройте Graph API Explorer (ссылка ниже). Справа: «Приложение Meta» — ваше приложение, «Пользователь или страница» — «Маркер доступа пользователя». В «Разрешения» добавьте все права из строки ниже, нажмите «Сгенерировать маркер доступа» (Generate Access Token), войдите и отметьте страницу студии и её Instagram.",
    uz: "Graph API Explorer’ni oching (havola pastda). O‘ngda: «Meta App» — sizning ilovangiz, «User or Page» — «User Token». «Permissions» ga pastdagi qatordagi barcha huquqlarni qo‘shing, «Generate Access Token» ni bosing, kiring va studiya sahifasi hamda uning Instagramini belgilang.",
    pl: "Otwórz Graph API Explorer (link poniżej). Po prawej: „Meta App” — twoja aplikacja, „User or Page” — „User Token”. W „Permissions” dodaj wszystkie uprawnienia z wiersza poniżej, kliknij „Generate Access Token”, zaloguj się i zaznacz stronę studia i jej Instagram.",
  },
  a4: {
    ru: "Этот токен живёт час. Скопируйте его, откройте «Отладчик маркеров доступа» (ссылка ниже), вставьте, нажмите «Отладка», а внизу — «Продлить маркер доступа» (Extend Access Token). Появится новый токен на 60 дней — его вставьте в поле «Токен Facebook».",
    uz: "Bu token bir soat yashaydi. Uni nusxalang, «Access Token Debugger» ni oching (havola pastda), qo‘ying, «Debug» ni bosing, pastda esa — «Extend Access Token». 60 kunlik yangi token chiqadi — uni «Facebook tokeni» maydoniga qo‘ying.",
    pl: "Ten token żyje godzinę. Skopiuj go, otwórz „Access Token Debugger” (link poniżej), wklej, kliknij „Debug”, a na dole — „Extend Access Token”. Pojawi się nowy token na 60 dni — wklej go w pole „Token Facebooka”.",
  },
  a5: {
    ru: "Номер Instagram-аккаунта можно не заполнять: после «Сохранить и проверить» сервер найдёт его по токену сам и проверит, что цифры чужого профиля приходят.",
    uz: "Instagram akkaunti raqamini to‘ldirmasangiz ham bo‘ladi: «Saqlash va tekshirish» dan keyin server uni token orqali o‘zi topadi va boshqa profil raqamlari kelayotganini tekshiradi.",
    pl: "Numeru konta Instagram można nie wpisywać: po „Zapisz i sprawdź” serwer sam znajdzie go po tokenie i sprawdzi, czy przychodzą liczby cudzego profilu.",
  },
  a6: {
    ru: "Через 60 дней токен кончится. За неделю до этого здесь появится жёлтая строка «пора продлить» — повторите шаги 3 и 4.",
    uz: "60 kundan keyin token tugaydi. Undan bir hafta oldin bu yerda sariq «uzaytirish vaqti» qatori chiqadi — 3 va 4-qadamlarni takrorlang.",
    pl: "Po 60 dniach token wygaśnie. Tydzień wcześniej pojawi się tu żółty wiersz „czas przedłużyć” — powtórz kroki 3 i 4.",
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
    ru: "В том же приложении на developers.facebook.com: «Варианты использования» (Use cases) → «Управление сообщениями и контентом в Instagram» → «Настройка API со входом через Instagram» (API setup with Instagram login). Нет такого варианта — «Добавить вариант использования».",
    uz: "Developers.facebook.com dagi o‘sha ilovada: «Use cases» → «Manage messaging & content on Instagram» → «API setup with Instagram login». Bunday variant bo‘lmasa — «Add use case».",
    pl: "W tej samej aplikacji na developers.facebook.com: „Use cases” → „Manage messaging & content on Instagram” → „API setup with Instagram login”. Nie ma takiej opcji — „Add use case”.",
  },
  b2: {
    ru: "Вверху страницы — «ID приложения Instagram» и «Секрет приложения Instagram» (кнопка «Показать»). Скопируйте оба в поля ниже. Это не «ID приложения» из «Настройки → Основное»: у Instagram они свои.",
    uz: "Sahifa tepasida — «Instagram app ID» va «Instagram app secret» («Show» tugmasi). Ikkalasini pastdagi maydonlarga nusxalang. Bu «Settings → Basic» dagi «App ID» emas: Instagramniki alohida.",
    pl: "Na górze strony — „Instagram app ID” i „Instagram app secret” (przycisk „Show”). Skopiuj oba w pola poniżej. To nie „App ID” z „Settings → Basic”: Instagram ma własne.",
  },
  b3: {
    ru: "Там же, «Настройте веб-хуки» (Configure webhooks): «URL обратного вызова» — адрес вебхука ниже, «Подтверждение маркера» — проверочный токен ниже. «Проверить и сохранить», потом у поля messages — «Подписаться».",
    uz: "O‘sha yerda, «Configure webhooks»: «Callback URL» — pastdagi vebhuk manzili, «Verify token» — pastdagi tekshiruv tokeni. «Verify and save», keyin messages maydonida — «Subscribe».",
    pl: "Tam samo, „Configure webhooks”: „Callback URL” — adres webhooka poniżej, „Verify token” — token weryfikacyjny poniżej. „Verify and save”, potem przy polu messages — „Subscribe”.",
  },
  b4: {
    ru: "Ниже, «Настройте вход через Instagram для бизнеса» → «Настройки бизнес-входа» (Business login settings) → «URI перенаправления OAuth»: добавьте оба адреса возврата ниже и сохраните.",
    uz: "Pastroqda, «Set up Instagram business login» → «Business login settings» → «OAuth redirect URIs»: pastdagi ikkala qaytish manzilini qo‘shing va saqlang.",
    pl: "Niżej, „Set up Instagram business login” → „Business login settings” → „OAuth redirect URIs”: dodaj oba adresy powrotu poniżej i zapisz.",
  },
  b5: {
    ru: "«Роли приложения» → «Роли» → «Тестировщики Instagram»: добавьте Instagram студии. Потом в Instagram в браузере: «Настройки» → «Приложения и сайты» → «Приглашения тестировщика» → «Принять». Пока Meta не проверила приложение, оно работает только с такими аккаунтами.",
    uz: "«App roles» → «Roles» → «Instagram Testers»: studiya Instagramini qo‘shing. Keyin brauzerdagi Instagramda: «Settings» → «Apps and websites» → «Tester invites» → «Accept». Meta ilovani tekshirmaguncha u faqat shunday akkauntlar bilan ishlaydi.",
    pl: "„App roles” → „Roles” → „Instagram Testers”: dodaj Instagram studia. Potem w Instagramie w przeglądarce: „Settings” → „Apps and websites” → „Tester invites” → „Accept”. Dopóki Meta nie sprawdzi aplikacji, działa ona tylko z takimi kontami.",
  },
  b6: {
    ru: "Сохраните здесь и нажмите «Подключить Instagram студии» вверху вкладки — войдите аккаунтом студии. В строке «Переписка в Direct» появится «подключено». Чтобы агент отвечал всем блогерам, а не только тестировщикам, Meta должна одобрить приложение: «Проверка приложения» → разрешение instagram_business_manage_messages. Цифрам чужих профилей (часть 1) это не нужно.",
    uz: "Bu yerda saqlang va vkladka tepasidagi «Studiya Instagramini ulash» ni bosing — studiya akkaunti bilan kiring. «Direct yozishmasi» qatorida «ulangan» chiqadi. Agent faqat testerlarga emas, barcha blogerlarga javob berishi uchun Meta ilovani tasdiqlashi kerak: «App Review» → instagram_business_manage_messages ruxsati. Boshqa profillar raqamlari (1-qism) uchun bu shart emas.",
    pl: "Zapisz tutaj i kliknij „Podłącz Instagram studia” na górze karty — zaloguj się kontem studia. W wierszu „Rozmowy w Direct” pojawi się „podłączone”. Żeby agent odpowiadał wszystkim blogerom, a nie tylko testerom, Meta musi zatwierdzić aplikację: „App Review” → uprawnienie instagram_business_manage_messages. Liczbom cudzych profili (część 1) to niepotrzebne.",
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
