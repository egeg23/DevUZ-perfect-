import { defineDict } from "@/lib/admin/i18n";

/**
 * «Статьи на площадках» (/admin/outside): черновики для vc.ru, Дзена и
 * Tenchat и то, что публикуется само (Telegraph, ВКонтакте, Telegram-канал).
 * Тексты самих статей — русские данные и не переводятся.
 */
export const outsideDict = defineDict({
  title: { ru: "Статьи на площадках", uz: "Platformalardagi maqolalar", pl: "Artykuły na platformach" },
  lead: {
    ru: "Раз в неделю здесь появляется по черновику для vc.ru, Дзена и Tenchat. Публиковать программой эти площадки не дают, поэтому публикует человек: «Скопировать», вставить в редактор площадки, опубликовать и вставить сюда ссылку на статью. Telegraph, ВКонтакте и Telegram-канал публикуются сами, их статьи сразу попадают в «Опубликованные».",
    uz: "Har hafta bu yerda vc.ru, Dzen va Tenchat uchun bittadan qoralama paydo bo‘ladi. Bu platformalar dastur orqali e’lon qilishga ruxsat bermaydi, shuning uchun odam e’lon qiladi: «Nusxa olish», platforma muharririga qo‘yish, e’lon qilish va maqola havolasini shu yerga qo‘yish. Telegraph, VKontakte va Telegram-kanal o‘zi e’lon qilinadi, ularning maqolalari darhol «E’lon qilinganlar»ga tushadi.",
    pl: "Raz w tygodniu pojawia się tu po jednym szkicu dla vc.ru, Dzen i Tenchat. Te platformy nie pozwalają publikować programem, więc publikuje człowiek: „Kopiuj”, wkleić do edytora platformy, opublikować i wkleić tu link do artykułu. Telegraph, VKontakte i kanał Telegram publikują się same, ich artykuły od razu trafiają do „Opublikowane”.",
  },
  off: {
    ru: "Раздел ещё не включён: в базе нет таблицы статей. Скажите владельцу.",
    uz: "Bo‘lim hali yoqilmagan: bazada maqolalar jadvali yo‘q. Egasiga ayting.",
    pl: "Dział nie jest jeszcze włączony: w bazie nie ma tabeli artykułów. Powiedz właścicielowi.",
  },
  publisherTitle: { ru: "Кто публикует", uz: "Kim e’lon qiladi", pl: "Kto publikuje" },
  publisherHint: {
    ru: "Ему бот присылает карточку, когда черновики готовы. Не выбран — владельцу и руководителю. В списке — те, кому открыт этот раздел.",
    uz: "Qoralamalar tayyor bo‘lganda bot unga kartochka yuboradi. Tanlanmagan bo‘lsa — egasi va rahbarga. Ro‘yxatda — shu bo‘lim ochiq bo‘lganlar.",
    pl: "To jemu bot wysyła kartę, gdy szkice są gotowe. Nikt nie wybrany — właścicielowi i kierownikowi. Na liście są ci, którzy mają dostęp do tego działu.",
  },
  publisherNone: { ru: "Владелец и руководитель", uz: "Egasi va rahbar", pl: "Właściciel i kierownik" },
  save: { ru: "Сохранить", uz: "Saqlash", pl: "Zapisz" },
  readyTitle: { ru: "Ждут публикации", uz: "E’lon qilinishini kutmoqda", pl: "Czekają na publikację" },
  readyEmpty: {
    ru: "Черновиков нет. Новые появляются раз в неделю, днём по Ташкенту: площадке — когда опубликован или пропущен прошлый.",
    uz: "Qoralamalar yo‘q. Yangilari haftada bir marta, Toshkent vaqti bilan kunduzi chiqadi: platformaga — avvalgisi e’lon qilinganda yoki o‘tkazib yuborilganda.",
    pl: "Brak szkiców. Nowe pojawiają się raz w tygodniu, w dzień czasu Taszkentu: platforma dostaje nowy, gdy poprzedni jest opublikowany albo pominięty.",
  },
  query: {
    ru: (q: string) => `Запрос: «${q}»`,
    uz: (q: string) => `So‘rov: «${q}»`,
    pl: (q: string) => `Zapytanie: «${q}»`,
  },
  made: {
    ru: (date: string) => `Готов ${date}`,
    uz: (date: string) => `Tayyor: ${date}`,
    pl: (date: string) => `Gotowy ${date}`,
  },
  openPlatform: {
    ru: (name: string) => `Открыть ${name}`,
    uz: (name: string) => `${name}ni ochish`,
    pl: (name: string) => `Otwórz ${name}`,
  },
  copy: { ru: "Скопировать", uz: "Nusxa olish", pl: "Kopiuj" },
  copyPlain: { ru: "Скопировать без оформления", uz: "Bezaksiz nusxa olish", pl: "Kopiuj bez formatowania" },
  copyTitle: { ru: "Скопировать заголовок", uz: "Sarlavhadan nusxa olish", pl: "Kopiuj tytuł" },
  copied: { ru: "Скопировано", uz: "Nusxa olindi", pl: "Skopiowano" },
  showText: { ru: "Показать текст", uz: "Matnni ko‘rsatish", pl: "Pokaż tekst" },
  urlLabel: { ru: "Ссылка на опубликованную статью", uz: "E’lon qilingan maqola havolasi", pl: "Link do opublikowanego artykułu" },
  publish: { ru: "Опубликовал", uz: "E’lon qildim", pl: "Opublikowałem" },
  skip: { ru: "Пропустить", uz: "O‘tkazib yuborish", pl: "Pomiń" },
  publishedTitle: { ru: "Опубликованные", uz: "E’lon qilinganlar", pl: "Opublikowane" },
  publishedEmpty: { ru: "Пока ничего не опубликовано.", uz: "Hozircha hech narsa e’lon qilinmagan.", pl: "Na razie nic nie opublikowano." },
  publishedBy: {
    ru: (who: string, date: string) => `${who}, ${date}`,
    uz: (who: string, date: string) => `${who}, ${date}`,
    pl: (who: string, date: string) => `${who}, ${date}`,
  },
  linkFollow: {
    ru: "ссылка на нас на месте и передаёт вес в поиске",
    uz: "bizga havola joyida va qidiruvda vazn beradi",
    pl: "link do nas jest na miejscu i przekazuje moc w wyszukiwarce",
  },
  linkNofollow: {
    ru: "ссылка на месте, но площадка пометила её nofollow: вес в поиске не передаёт, люди по ней переходят",
    uz: "havola joyida, lekin platforma uni nofollow deb belgilagan: qidiruvda vazn bermaydi, odamlar u orqali o‘tadi",
    pl: "link jest na miejscu, ale platforma oznaczyła go nofollow: nie przekazuje mocy w wyszukiwarce, ludzie z niego przechodzą",
  },
  linkMissing: {
    ru: "ссылки на нас на странице не нашли: её убрали или площадка показывает статью только после входа",
    uz: "sahifada bizga havola topilmadi: uni olib tashlashgan yoki platforma maqolani faqat kirgandan keyin ko‘rsatadi",
    pl: "nie znaleźliśmy linku do nas na stronie: usunięto go albo platforma pokazuje artykuł dopiero po zalogowaniu",
  },
  linkUnreachable: {
    ru: "страница не открылась для проверки: статью удалили или площадка не пускает проверку",
    uz: "sahifa tekshiruv uchun ochilmadi: maqola o‘chirilgan yoki platforma tekshiruvni kiritmaydi",
    pl: "strona nie otworzyła się do sprawdzenia: artykuł usunięto albo platforma nie wpuszcza sprawdzania",
  },
  linkUnchecked: {
    ru: "ещё не проверяли: проверка идёт сама через 10 минут после «Опубликовал», потом раз в неделю",
    uz: "hali tekshirilmagan: tekshiruv «E’lon qildim»dan 10 daqiqa o‘tib o‘zi boshlanadi, keyin haftada bir marta",
    pl: "jeszcze nie sprawdzano: sprawdzenie rusza samo 10 minut po „Opublikowałem”, potem raz w tygodniu",
  },
  count30: {
    ru: (n: number) => `Опубликовано за 30 дней: ${n}`,
    uz: (n: number) => `30 kunda e’lon qilingan: ${n}`,
    pl: (n: number) => `Opublikowano w 30 dni: ${n}`,
  },
  skippedCount: {
    ru: (n: number) => `Пропущено всего: ${n}`,
    uz: (n: number) => `Jami o‘tkazib yuborilgan: ${n}`,
    pl: (n: number) => `Pominięto łącznie: ${n}`,
  },
  autoTitle: { ru: "Публикуется само", uz: "O‘zi e’lon qilinadi", pl: "Publikuje się samo" },
  autoLead: {
    ru: "Telegraph, Telegram-канал и ВКонтакте получают свою статью по понедельникам, средам и пятницам и публикуются без человека: у них есть официальный способ публиковать программой. Telegram-канал публикует бот студии, ВКонтакте — ключ сообщества; Postiz — запасной путь, если их не завели. Не вышло — черновик появится выше, в «Ждут публикации», с причиной.",
    uz: "Telegraph, Telegram-kanal va VKontakte dushanba, chorshanba va juma kunlari o‘z maqolasini oladi va odamsiz e’lon qilinadi: ularda dastur orqali e’lon qilishning rasmiy yo‘li bor. Telegram-kanalga studiya boti, VKontaktega hamjamiyat kaliti e’lon qiladi; Postiz — ular ulanmagan bo‘lsa, zaxira yo‘l. Chiqmasa, qoralama yuqorida, «E’lon qilinishini kutmoqda»da sababi bilan paydo bo‘ladi.",
    pl: "Telegraph, kanał Telegram i VKontakte dostają swój artykuł w poniedziałki, środy i piątki i publikują się bez człowieka: mają oficjalny sposób publikowania programem. Na kanale Telegram publikuje bot studia, na VKontakte klucz społeczności; Postiz to zapasowa droga, jeśli ich nie podłączono. Jeśli się nie uda, szkic pojawi się wyżej, w „Czekają na publikację”, z powodem.",
  },
  telegraph: {
    ru: (ready: boolean) => `Telegraph: публикуется сам, регистрация не нужна. Аккаунт студии: ${ready ? "заведён" : "заведётся с первой статьёй"}.`,
    uz: (ready: boolean) => `Telegraph: o‘zi e’lon qilinadi, ro‘yxatdan o‘tish shart emas. Studiya akkaunti: ${ready ? "ochilgan" : "birinchi maqola bilan ochiladi"}.`,
    pl: (ready: boolean) => `Telegraph: publikuje się sam, rejestracja nie jest potrzebna. Konto studia: ${ready ? "założone" : "założy się przy pierwszym artykule"}.`,
  },
  postizKey: { ru: "Ключ API Postiz", uz: "Postiz API kaliti", pl: "Klucz API Postiz" },
  tgTitle: { ru: "Канал Telegram", uz: "Telegram kanal", pl: "Kanał Telegram" },
  tgPlaceholder: {
    ru: "@имя канала. Пусто — проверить сохранённый",
    uz: "@kanal nomi. Bo‘sh — saqlanganini tekshirish",
    pl: "@nazwa kanału. Puste — sprawdzić zapisany",
  },
  tgSteps: {
    ru: "В Telegram: «Новый канал», назовите его, например, «DevUz Studio».\nТип канала — «Публичный», придумайте адрес: t.me/имя. Его и вставьте сюда.\nВ канале: «Управление каналом» → «Администраторы» → «Добавить администратора», найдите бота студии @Devuz_studio_bot и включите «Публикация сообщений».\nВернитесь сюда, вставьте @имя и нажмите «Сохранить и проверить»: бот проверит, что он администратор.",
    uz: "Telegramda: «Yangi kanal», nom bering, masalan, «DevUz Studio».\nKanal turi — «Ommaviy», manzil o‘ylab toping: t.me/nom. Shuni bu yerga qo‘ying.\nKanalda: «Kanalni boshqarish» → «Administratorlar» → «Administrator qo‘shish», studiya boti @Devuz_studio_bot ni toping va «Xabarlarni e’lon qilish»ni yoqing.\nBu yerga qayting, @nomni qo‘ying va «Saqlash va tekshirish»ni bosing: bot o‘zi administrator ekanini tekshiradi.",
    pl: "W Telegramie: „Nowy kanał”, nazwij go np. „DevUz Studio”.\nTyp kanału: „Publiczny”, wymyśl adres t.me/nazwa. Ten adres wklej tutaj.\nW kanale: „Zarządzaj kanałem” → „Administratorzy” → „Dodaj administratora”, znajdź bota studia @Devuz_studio_bot i włącz „Publikowanie wiadomości”.\nWróć tutaj, wklej @nazwa i naciśnij „Zapisz i sprawdź”: bot sprawdzi, że jest administratorem.",
  },
  vcruTitle: { ru: "Вход vc.ru", uz: "vc.ru kirishi", pl: "Logowanie vc.ru" },
  vcruEmail: { ru: "Почта аккаунта студии на vc.ru", uz: "Studiyaning vc.ru akkaunt pochtasi", pl: "E-mail konta studia na vc.ru" },
  vcruPassword: { ru: "Пароль. Пусто — проверить сохранённый", uz: "Parol. Bo‘sh — saqlanganini tekshirish", pl: "Hasło. Puste — sprawdzić zapisane" },
  vcruSteps: {
    ru: "Зарегистрируйте аккаунт студии на vc.ru почтой и паролем (не через Яндекс или VK: так у аккаунта есть пароль).\nОформите профиль: имя DevUz Studio, аватар, описание и ссылка на сайт.\nВставьте сюда почту и пароль и нажмите «Сохранить и проверить»: панель войдёт и покажет имя аккаунта. Пароль уходит в хранилище секретов, на экране его больше нет.\nДальше статья для vc.ru выходит сама раз в неделю, а у черновика vc.ru в «Ждут публикации» появится кнопка «Опубликовать на vc.ru».",
    uz: "vc.ru’da studiya akkauntini pochta va parol bilan ro‘yxatdan o‘tkazing (Yandex yoki VK orqali emas: shunda akkauntda parol bo‘ladi).\nProfilni to‘ldiring: DevUz Studio nomi, avatar, tavsif va sayt havolasi.\nPochta va parolni shu yerga qo‘ying va «Saqlash va tekshirish»ni bosing: panel kirib, akkaunt nomini ko‘rsatadi. Parol sirlar omboriga ketadi, ekranda boshqa ko‘rinmaydi.\nKeyin vc.ru uchun maqola haftada bir marta o‘zi chiqadi, «E’lon qilinishini kutmoqda»dagi vc.ru qoralamasida «vc.ru’da e’lon qilish» tugmasi paydo bo‘ladi.",
    pl: "Załóż konto studia na vc.ru e-mailem i hasłem (nie przez Yandex ani VK: wtedy konto ma hasło).\nUzupełnij profil: nazwa DevUz Studio, awatar, opis i link do strony.\nWklej tu e-mail i hasło i kliknij „Zapisz i sprawdź”: panel zaloguje się i pokaże nazwę konta. Hasło trafia do sejfu sekretów, na ekranie go już nie ma.\nPotem artykuł na vc.ru wychodzi sam raz w tygodniu, a przy szkicu vc.ru w „Czekają na publikację” pojawi się przycisk „Opublikuj na vc.ru”.",
  },
  vcruPublish: { ru: "Опубликовать на vc.ru", uz: "vc.ru’da e’lon qilish", pl: "Opublikuj na vc.ru" },
  vkTitle: { ru: "Ключ сообщества ВКонтакте", uz: "VKontakte hamjamiyat kaliti", pl: "Klucz społeczności VKontakte" },
  vkSteps: {
    ru: "ВКонтакте: «Сообщества» → «Создать сообщество», тип — «Бизнес» или «Тематическое», название — «DevUz Studio».\nВ сообществе: «Управление» → «Работа с API» → «Ключи доступа» → «Создать ключ».\nОтметьте право «Доступ к стене сообщества» (стена) и создайте ключ, ВКонтакте попросит подтвердить кодом.\nСкопируйте ключ, вставьте сюда и нажмите «Сохранить и проверить». Ключ уходит в хранилище секретов, на экране его больше нет.",
    uz: "VKontakte: «Hamjamiyatlar» → «Hamjamiyat yaratish», turi — «Biznes» yoki «Mavzuli», nomi — «DevUz Studio».\nHamjamiyatda: «Boshqaruv» → «API bilan ishlash» → «Kirish kalitlari» → «Kalit yaratish».\n«Hamjamiyat devoriga kirish» (devor) huquqini belgilang va kalit yarating, VKontakte kod bilan tasdiqlashni so‘raydi.\nKalitni nusxalang, shu yerga qo‘ying va «Saqlash va tekshirish»ni bosing. Kalit sirlar omboriga ketadi, ekranda boshqa ko‘rinmaydi.",
    pl: "VKontakte: „Społeczności” → „Utwórz społeczność”, typ „Biznes” albo „Tematyczna”, nazwa „DevUz Studio”.\nW społeczności: „Zarządzanie” → „Praca z API” → „Klucze dostępu” → „Utwórz klucz”.\nZaznacz prawo „Dostęp do ściany społeczności” (ściana) i utwórz klucz, VKontakte poprosi o potwierdzenie kodem.\nSkopiuj klucz, wklej tutaj i naciśnij „Zapisz i sprawdź”. Klucz trafia do sejfu sekretów, na ekranie go już nie ma.",
  },
  directOk: {
    ru: (name: string, date: string) => `Проверено ${date}: «${name}», публикуется само.`,
    uz: (name: string, date: string) => `${date} tekshirildi: «${name}», o‘zi e’lon qilinadi.`,
    pl: (name: string, date: string) => `Sprawdzono ${date}: „${name}”, publikuje się samo.`,
  },
  directFail: {
    ru: (reason: string, date: string) => `Проверка ${date} не прошла: ${reason}. Ничего не сохранено.`,
    uz: (reason: string, date: string) => `${date} tekshiruv o‘tmadi: ${reason}. Hech narsa saqlanmadi.`,
    pl: (reason: string, date: string) => `Sprawdzenie ${date} nie przeszło: ${reason}. Nic nie zapisano.`,
  },
  postizSpare: {
    ru: "Postiz — запасной путь: нужен, только если канал или сообщество выше не заведены.",
    uz: "Postiz — zaxira yo‘l: faqat yuqoridagi kanal yoki hamjamiyat ulanmagan bo‘lsa kerak.",
    pl: "Postiz to zapasowa droga: potrzebny tylko, jeśli kanał albo społeczność wyżej nie są podłączone.",
  },
  keySet: { ru: "задано", uz: "kiritilgan", pl: "ustawiony" },
  keyEmpty: { ru: "пусто", uz: "bo‘sh", pl: "pusty" },
  keyPlaceholder: {
    ru: "Новый ключ. Пусто — проверить сохранённый",
    uz: "Yangi kalit. Bo‘sh — saqlanganini tekshirish",
    pl: "Nowy klucz. Puste — sprawdzić zapisany",
  },
  saveCheck: { ru: "Сохранить и проверить", uz: "Saqlash va tekshirish", pl: "Zapisz i sprawdź" },
  postizHow: {
    ru: "Ключ: Postiz → Settings → Developers → Public API. Каналы ВКонтакте и Telegram подключаются там же, кнопкой «Add Channel», входом в аккаунт площадки. Ключ хранится в хранилище секретов, обратно показываем только «задано» или «пусто».",
    uz: "Kalit: Postiz → Settings → Developers → Public API. VKontakte va Telegram kanallari o‘sha yerda «Add Channel» tugmasi bilan, platforma akkauntiga kirib ulanadi. Kalit sirlar omborida saqlanadi, qaytib faqat «kiritilgan» yoki «bo‘sh» ko‘rsatiladi.",
    pl: "Klucz: Postiz → Settings → Developers → Public API. Kanały VKontakte i Telegram podłącza się tam przyciskiem „Add Channel”, logując się na konto platformy. Klucz leży w sejfie sekretów, z powrotem pokazujemy tylko „ustawiony” albo „pusty”.",
  },
  openPostiz: { ru: "Открыть Postiz", uz: "Postizni ochish", pl: "Otwórz Postiz" },
  checkOk: {
    ru: (n: number, ours: string, date: string) => `Проверено ${date}: каналов в Postiz ${n}${ours ? `, публикуются сами: ${ours}` : ", но ВКонтакте и Telegram среди них нет: подключите их в Postiz"}.`,
    uz: (n: number, ours: string, date: string) => `${date} tekshirildi: Postizda kanallar ${n}${ours ? `, o‘zi e’lon qilinadi: ${ours}` : ", lekin ular orasida VKontakte va Telegram yo‘q: ularni Postizda ulang"}.`,
    pl: (n: number, ours: string, date: string) => `Sprawdzono ${date}: kanałów w Postiz ${n}${ours ? `, publikują się same: ${ours}` : ", ale nie ma wśród nich VKontakte i Telegram: podłącz je w Postiz"}.`,
  },
  checkFail: {
    ru: (reason: string, date: string) => `Проверка ${date} не прошла: ${reason}. Ключ не сохранён.`,
    uz: (reason: string, date: string) => `${date} tekshiruv o‘tmadi: ${reason}. Kalit saqlanmadi.`,
    pl: (reason: string, date: string) => `Sprawdzenie ${date} nie przeszło: ${reason}. Klucz nie został zapisany.`,
  },
  autoFailed: {
    ru: (reason: string) => `Сама не вышла: ${reason}. Опубликуйте руками, как обычно.`,
    uz: (reason: string) => `O‘zi chiqmadi: ${reason}. Odatdagidek qo‘lda e’lon qiling.`,
    pl: (reason: string) => `Nie wyszło samo: ${reason}. Opublikuj ręcznie, jak zwykle.`,
  },
  sentLine: {
    ru: (date: string) => `отдана в Postiz ${date}: ссылка появится здесь, когда пост выйдет`,
    uz: (date: string) => `${date} Postizga berildi: post chiqqanda havola shu yerda paydo bo‘ladi`,
    pl: (date: string) => `przekazany do Postiz ${date}: link pojawi się tu, gdy post wyjdzie`,
  },
  publishedAuto: {
    ru: (date: string) => `вышла сама, ${date}`,
    uz: (date: string) => `o‘zi chiqdi, ${date}`,
    pl: (date: string) => `wyszedł sam, ${date}`,
  },
  r_keyok: { ru: "Ключ Postiz проверен.", uz: "Postiz kaliti tekshirildi.", pl: "Klucz Postiz sprawdzony." },
  r_keybad: {
    ru: "Postiz не принял ключ или не ответил: ниже написано почему. Сохранённый ключ не менялся.",
    uz: "Postiz kalitni qabul qilmadi yoki javob bermadi: sababi pastda yozilgan. Saqlangan kalit o‘zgarmadi.",
    pl: "Postiz nie przyjął klucza albo nie odpowiedział: niżej jest napisane dlaczego. Zapisany klucz się nie zmienił.",
  },
  r_tgok: { ru: "Канал Telegram проверен: статьи пойдут туда сами.", uz: "Telegram kanal tekshirildi: maqolalar u yerga o‘zi boradi.", pl: "Kanał Telegram sprawdzony: artykuły będą tam trafiać same." },
  r_tgbad: {
    ru: "Канал не прошёл проверку: ниже написано почему. Сохранённый адрес не менялся.",
    uz: "Kanal tekshiruvdan o‘tmadi: sababi pastda yozilgan. Saqlangan manzil o‘zgarmadi.",
    pl: "Kanał nie przeszedł sprawdzenia: niżej jest napisane dlaczego. Zapisany adres się nie zmienił.",
  },
  r_vkok: { ru: "Ключ ВКонтакте проверен: посты пойдут на стену сообщества сами.", uz: "VKontakte kaliti tekshirildi: postlar hamjamiyat devoriga o‘zi boradi.", pl: "Klucz VKontakte sprawdzony: posty będą trafiać na ścianę społeczności same." },
  r_vkbad: {
    ru: "ВКонтакте не принял ключ: ниже написано почему. Сохранённый ключ не менялся.",
    uz: "VKontakte kalitni qabul qilmadi: sababi pastda yozilgan. Saqlangan kalit o‘zgarmadi.",
    pl: "VKontakte nie przyjął klucza: niżej jest napisane dlaczego. Zapisany klucz się nie zmienił.",
  },
  r_vcruok: { ru: "Статья вышла на vc.ru: она уже в «Опубликованных».", uz: "Maqola vc.ru’da chiqdi: u allaqachon «E’lon qilinganlar»da.", pl: "Artykuł wyszedł na vc.ru: jest już w „Opublikowane”." },
  r_vcrubad: {
    ru: "vc.ru не опубликовал: причина — у черновика. Его можно опубликовать руками, как раньше.",
    uz: "vc.ru e’lon qilmadi: sababi qoralamada. Uni avvalgidek qo‘lda e’lon qilish mumkin.",
    pl: "vc.ru nie opublikował: powód jest przy szkicu. Można go opublikować ręcznie, jak wcześniej.",
  },
  r_vcruloginok: { ru: "Вход vc.ru проверен: статьи пойдут туда сами.", uz: "vc.ru kirishi tekshirildi: maqolalar u yerga o‘zi boradi.", pl: "Logowanie vc.ru sprawdzone: artykuły będą tam trafiać same." },
  r_vcruloginbad: {
    ru: "vc.ru не пустил: ниже написано почему. Сохранённый вход не менялся.",
    uz: "vc.ru kiritmadi: sababi pastda yozilgan. Saqlangan kirish o‘zgarmadi.",
    pl: "vc.ru nie wpuścił: niżej jest napisane dlaczego. Zapisane logowanie się nie zmieniło.",
  },
  r_ok: { ru: "Готово.", uz: "Tayyor.", pl: "Gotowe." },
  r_bad: {
    ru: "Ссылка не с этой площадки или не https. Скопируйте адрес статьи из строки браузера.",
    uz: "Havola bu platformadan emas yoki https emas. Maqola manzilini brauzer qatoridan nusxa oling.",
    pl: "Link nie jest z tej platformy albo nie jest https. Skopiuj adres artykułu z paska przeglądarki.",
  },
  r_missing: {
    ru: "Этот черновик уже опубликован или пропущен.",
    uz: "Bu qoralama allaqachon e’lon qilingan yoki o‘tkazib yuborilgan.",
    pl: "Ten szkic jest już opublikowany albo pominięty.",
  },
  r_failed: { ru: "Не получилось. Попробуйте ещё раз.", uz: "Bo‘lmadi. Yana urinib ko‘ring.", pl: "Nie udało się. Spróbuj jeszcze raz." },
  r_forbidden: {
    ru: "Кто публикует, выбирают владелец и руководитель.",
    uz: "Kim e’lon qilishini egasi va rahbar tanlaydi.",
    pl: "Kto publikuje, wybierają właściciel i kierownik.",
  },
});

/** Названия площадок на языке панели. */
export const platformDict = defineDict({
  vcru: { ru: "vc.ru", uz: "vc.ru", pl: "vc.ru" },
  dzen: { ru: "Дзен", uz: "Dzen", pl: "Dzen" },
  tenchat: { ru: "Tenchat", uz: "Tenchat", pl: "Tenchat" },
  telegraph: { ru: "Telegraph", uz: "Telegraph", pl: "Telegraph" },
  vk: { ru: "ВКонтакте", uz: "VKontakte", pl: "VKontakte" },
  telegram: { ru: "Telegram-канал", uz: "Telegram-kanal", pl: "Kanał Telegram" },
});
