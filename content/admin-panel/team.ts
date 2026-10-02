import { defineDict } from "@/lib/admin/i18n";

/**
 * Раздел «Команда» (/admin/team): состав, роли, руководитель, грейд и
 * ставка, план касаний, уведомления бота (галочки), отключение и
 * приглашение.
 *
 * Термины — по content/admin-panel/GLOSSARY.md: руководитель — rahbar /
 * kierownik, грейд — daraja / poziom, ставка — stavka / stawka,
 * уведомления — bildirishnomalar / powiadomienia, отключить — o‘chirish /
 * wyłącz.
 *
 * Названия галочек уведомлений — в lib/admin/notify-prefs.ts (NOTICES),
 * названия ролей — ROLE_TITLE_TR в lib/admin/roles.ts, грейдов — GRADE_TR в
 * lib/admin/finance.ts. Бот пишет по-русски и берёт оттуда русскую строку.
 */
export const teamDict = defineDict({
  title: { ru: "Команда", uz: "Jamoa", pl: "Zespół" },
  intro: {
    ru: "Вход в панель — по числовому id в Telegram. Пароля нет: username человек меняет за секунду, id — никогда.",
    uz: "Panelga kirish — Telegram’dagi raqamli id orqali. Parol yo‘q: username’ni odam bir soniyada o‘zgartiradi, id esa hech qachon o‘zgarmaydi.",
    pl: "Logowanie do panelu — po numerycznym id w Telegramie. Hasła nie ma: username można zmienić w sekundę, id — nigdy.",
  },
  headIntro: {
    ru: "Вы заводите менеджеров и высылаете им приглашения. Заведённый вами менеджер сразу ваш, а ничьего можно взять к себе кнопкой в колонке «Руководитель» — после этого вы отвечаете за его показатели и план/факт и ставите ему план касаний. Менеджеров вы можете отключить и выбрать, какие сообщения бота им приходят (себе — тоже). Открепить менеджера, менять роль, грейд и ставку может только владелец.",
    uz: "Siz menejerlarni qo‘shasiz va ularga taklif yuborasiz. Siz qo‘shgan menejer darhol sizniki bo‘ladi, hech kimga biriktirilmaganini esa «Rahbar» ustunidagi tugma bilan o‘zingizga olishingiz mumkin — shundan keyin uning ko‘rsatkichlari va reja/fakti uchun siz javob berasiz va unga aloqalar rejasini qo‘yasiz. Menejerlarni o‘chirishingiz va ularga botdan qaysi xabarlar kelishini tanlashingiz mumkin (o‘zingizga ham). Menejerni ajratish, rolini, darajasini va stavkasini o‘zgartirish faqat egasining qo‘lida.",
    pl: "Dodajesz menedżerów i wysyłasz im zaproszenia. Dodany przez Ciebie menedżer od razu jest Twój, a nieprzypisanego możesz przejąć przyciskiem w kolumnie «Kierownik» — od tej chwili odpowiadasz za jego wyniki i plan/wykonanie oraz ustalasz mu plan kontaktów. Menedżerów możesz wyłączyć i wybrać, jakie wiadomości bota do nich trafiają (do Ciebie też). Odpiąć menedżera, zmienić rolę, poziom i stawkę może tylko właściciel.",
  },

  // Ответы действий — `?r=` в адресе, коды из app/admin/team/actions.ts.
  r_ok: { ru: "Готово.", uz: "Tayyor.", pl: "Gotowe." },
  r_menu_ok: {
    ru: "Меню команд бота обновлено: клиенты видят /ref и /payout, сотрудники — ещё и /login.",
    uz: "Bot buyruqlari menyusi yangilandi: mijozlar /ref va /payout’ni, xodimlar yana /login’ni ham ko‘radi.",
    pl: "Menu komend bota zaktualizowane: klienci widzą /ref i /payout, pracownicy — także /login.",
  },
  r_menu_failed: {
    ru: "Меню бота не обновилось — Telegram не ответил. Попробуйте ещё раз.",
    uz: "Bot menyusi yangilanmadi — Telegram javob bermadi. Yana bir bor urinib ko‘ring.",
    pl: "Menu bota się nie zaktualizowało — Telegram nie odpowiedział. Spróbuj jeszcze raz.",
  },
  r_reactivated: {
    ru: "Сотрудник включён обратно — это его прежняя запись со всей историей.",
    uz: "Xodim qayta yoqildi — bu uning butun tarixi saqlangan avvalgi yozuvi.",
    pl: "Pracownik włączony ponownie — to jego dawny wpis z całą historią.",
  },
  r_notices: {
    ru: "Сохранено: бот будет присылать только то, что отмечено галочками.",
    uz: "Saqlandi: bot faqat belgilangan narsalarni yuboradi.",
    pl: "Zapisano: bot będzie wysyłał tylko to, co zaznaczone.",
  },
  r_claimed: {
    ru: "Менеджер закреплён за вами: его статистика и план/факт теперь в вашей команде, план касаний ставите вы.",
    uz: "Menejer sizga biriktirildi: uning statistikasi va reja/fakti endi jamoangizda, aloqalar rejasini siz qo‘yasiz.",
    pl: "Menedżer jest przypisany do Ciebie: jego statystyki i plan/wykonanie są teraz w Twoim zespole, plan kontaktów ustalasz Ty.",
  },
  r_has_head: {
    ru: "У этого менеджера уже есть руководитель. Переназначить или открепить может только владелец.",
    uz: "Bu menejerning rahbari allaqachon bor. Qayta biriktirish yoki ajratish faqat egasining qo‘lida.",
    pl: "Ten menedżer ma już kierownika. Zmienić lub odpiąć go może tylko właściciel.",
  },
  r_exists: {
    ru: "Такой Telegram id уже заведён и работает.",
    uz: "Bunday Telegram id allaqachon qo‘shilgan va ishlayapti.",
    pl: "Takie id Telegrama jest już dodane i aktywne.",
  },
  r_invalid: {
    ru: "Нужны числовой Telegram id и имя.",
    uz: "Raqamli Telegram id va ism kerak.",
    pl: "Potrzebne są numeryczne id Telegrama i imię.",
  },
  r_rate_invalid: {
    ru: "Ставка — целое число процентов от 0 до 100. Пустое поле — ставка по грейду.",
    uz: "Stavka — 0 dan 100 gacha butun foiz. Bo‘sh maydon — daraja bo‘yicha stavka.",
    pl: "Stawka to liczba całkowita procentów od 0 do 100. Puste pole — stawka według poziomu.",
  },
  r_plan_nan: {
    ru: "План — это число касаний в неделю.",
    uz: "Reja — bu haftasiga aloqalar soni.",
    pl: "Plan to liczba kontaktów na tydzień.",
  },
  r_plan_big: {
    ru: (max: number) => `Больше ${max} в неделю — это не план, а описка.`,
    uz: (max: number) => `Haftasiga ${max} tadan ko‘pi — bu reja emas, xato yozilgan.`,
    pl: (max: number) => `Więcej niż ${max} tygodniowo to nie plan, tylko literówka.`,
  },
  r_self: {
    ru: "Себя отключить или разжаловать нельзя — вернуться в панель будет некому.",
    uz: "O‘zingizni o‘chirib yoki lavozimdan tushirib bo‘lmaydi — panelga qaytadigan odam qolmaydi.",
    pl: "Nie możesz wyłączyć ani zdegradować siebie — nie będzie miał kto wrócić do panelu.",
  },
  r_last_admin: {
    ru: "Это последний админ. Сначала назначьте второго.",
    uz: "Bu oxirgi admin. Avval ikkinchisini tayinlang.",
    pl: "To ostatni admin. Najpierw wyznacz drugiego.",
  },
  r_owner: {
    ru: "Это владелец панели: его роль и руководитель через панель не меняются.",
    uz: "Bu panel egasi: uning roli va rahbari panel orqali o‘zgarmaydi.",
    pl: "To właściciel panelu: jego roli ani kierownika nie zmienia się przez panel.",
  },
  r_not_head: {
    ru: "Руководителем можно назначить только активного сотрудника с ролью «руководитель».",
    uz: "Rahbar qilib faqat «rahbar» roli bor faol xodimni tayinlash mumkin.",
    pl: "Kierownikiem można wyznaczyć tylko aktywnego pracownika z rolą «kierownik».",
  },
  r_forbidden: {
    ru: "Это вам недоступно. Руководитель проектов заводит и отключает только менеджеров и выбирает уведомления только им и себе. Остальное — владелец.",
    uz: "Bu sizga mavjud emas. Loyiha rahbari faqat menejerlarni qo‘shadi va o‘chiradi, bildirishnomalarni ham faqat ularga va o‘ziga tanlaydi. Qolgani — egasining ishi.",
    pl: "To nie jest dla Ciebie dostępne. Kierownik projektów dodaje i wyłącza tylko menedżerów i wybiera powiadomienia tylko im i sobie. Resztą zajmuje się właściciel.",
  },
  r_gone: {
    ru: "Такого сотрудника уже нет.",
    uz: "Bunday xodim endi yo‘q.",
    pl: "Takiego pracownika już nie ma.",
  },
  r_offline: { ru: "База недоступна.", uz: "Baza mavjud emas.", pl: "Baza jest niedostępna." },
  r_failed: { ru: "Не получилось.", uz: "Bo‘lmadi.", pl: "Nie udało się." },

  // Что стало с приглашением — `?i=`.
  i_sent: {
    ru: "Приглашение отправлено в Telegram — там написано, как войти.",
    uz: "Taklif Telegram’ga yuborildi — u yerda qanday kirish yozilgan.",
    pl: "Zaproszenie wysłane w Telegramie — jest tam opisane, jak się zalogować.",
  },
  /** `resend` — кнопка в строке сотрудника, как она названа на экране. */
  i_blocked: {
    ru: (resend: string) =>
      `Приглашение не доставлено: бот не может написать первым тому, кто ему ещё не писал. Попросите человека открыть бота и нажать «Старт», затем нажмите «${resend}» в его строке.`,
    uz: (resend: string) =>
      `Taklif yetkazilmadi: bot unga hali yozmagan odamga birinchi bo‘lib yoza olmaydi. Odamdan botni ochib «Start» tugmasini bosishini so‘rang, keyin uning qatoridagi «${resend}» tugmasini bosing.`,
    pl: (resend: string) =>
      `Zaproszenie nie dotarło: bot nie może napisać pierwszy do kogoś, kto jeszcze do niego nie pisał. Poproś tę osobę, by otworzyła bota i nacisnęła «Start», a potem naciśnij «${resend}» w jej wierszu.`,
  },
  i_no_bot: {
    ru: "Бот не настроен — приглашение отправить нечем.",
    uz: "Bot sozlanmagan — taklifni yuboradigan narsa yo‘q.",
    pl: "Bot nie jest skonfigurowany — nie ma czym wysłać zaproszenia.",
  },

  // Итог отключения и снятия с должности.
  offboarded: {
    ru: (summary: string) => `Доступ закрыт, сессии оборваны. ${summary}`,
    uz: (summary: string) => `Kirish yopildi, sessiyalar uzildi. ${summary}`,
    pl: (summary: string) => `Dostęp zamknięty, sesje przerwane. ${summary}`,
  },
  detached: {
    ru: (n: number) =>
      `Бывший руководитель больше не ведёт команду: откреплено менеджеров — ${n}. Закрепите их за другим руководителем.`,
    uz: (n: number) =>
      `Sobiq rahbar endi jamoani boshqarmaydi: ajratilgan menejerlar — ${n}. Ularni boshqa rahbarga biriktiring.`,
    pl: (n: number) =>
      `Były kierownik nie prowadzi już zespołu: odpięci menedżerowie — ${n}. Przypisz ich do innego kierownika.`,
  },

  refreshMenu: {
    ru: "обновить меню команд бота",
    uz: "bot buyruqlari menyusini yangilash",
    pl: "odśwież menu komend bota",
  },

  // Таблица «Кто работает».
  colWho: { ru: "Кто", uz: "Kim", pl: "Kto" },
  colTelegram: { ru: "Telegram", uz: "Telegram", pl: "Telegram" },
  colRole: { ru: "Роль", uz: "Rol", pl: "Rola" },
  colHead: { ru: "Руководитель", uz: "Rahbar", pl: "Kierownik" },
  colGrade: { ru: "Грейд и ставка", uz: "Daraja va stavka", pl: "Poziom i stawka" },
  colPlan: { ru: "План касаний", uz: "Aloqalar rejasi", pl: "Plan kontaktów" },
  colSince: { ru: "С какого дня", uz: "Qaysi kundan", pl: "Od kiedy" },
  helpHead: { ru: "Руководитель и команда", uz: "Rahbar va jamoa", pl: "Kierownik i zespół" },
  helpGrade: { ru: "Что меняет грейд", uz: "Daraja nimani o‘zgartiradi", pl: "Co zmienia poziom" },
  helpPlan: { ru: "Как работает план касаний", uz: "Aloqalar rejasi qanday ishlaydi", pl: "Jak działa plan kontaktów" },
  itsYou: { ru: "это вы", uz: "bu siz", pl: "to Ty" },
  makeManager: { ru: "сделать менеджером", uz: "menejer qilish", pl: "zmień na menedżera" },
  makeHead: { ru: "сделать руководителем", uz: "rahbar qilish", pl: "zmień na kierownika" },
  you: { ru: "вы", uz: "siz", pl: "Ty" },
  ownerDetaches: { ru: "открепляет владелец", uz: "egasi ajratadi", pl: "odpina właściciel" },
  noHead: { ru: "без руководителя", uz: "rahbarsiz", pl: "bez kierownika" },
  claim: { ru: "взять к себе", uz: "o‘zimga olish", pl: "przejmij" },
  save: { ru: "сохранить", uz: "saqlash", pl: "zapisz" },
  byGrade: { ru: "по грейду", uz: "daraja bo‘yicha", pl: "wg poziomu" },
  rateAria: { ru: "Персональная ставка, %", uz: "Shaxsiy stavka, %", pl: "Stawka indywidualna, %" },
  noPlan: { ru: "без плана", uz: "rejasiz", pl: "bez planu" },
  planAria: { ru: "Касаний в неделю", uz: "Haftasiga aloqalar", pl: "Kontaktów na tydzień" },
  perWeek: { ru: "в неделю", uz: "haftasiga", pl: "na tydzień" },
  planPerWeek: {
    ru: (n: number) => `${n} в неделю`,
    uz: (n: number) => `haftasiga ${n} ta`,
    pl: (n: number) => `${n} na tydzień`,
  },
  resend: { ru: "отправить приглашение", uz: "taklif yuborish", pl: "wyślij zaproszenie" },
  empty: {
    ru: "Пусто — а значит, и эту страницу открыть было некому. База недоступна?",
    uz: "Bo‘sh — demak, bu sahifani ochadigan odam ham yo‘q edi. Baza mavjud emasmi?",
    pl: "Pusto — a więc nie miał kto otworzyć tej strony. Baza niedostępna?",
  },

  // Отключённые.
  goneTitle: { ru: "Отключённые", uz: "O‘chirilganlar", pl: "Wyłączeni" },
  goneNote: {
    ru: "Не удалены намеренно: за ними остаются лиды, сообщения и записи журнала, и обнулять авторство задним числом нельзя.",
    uz: "Ataylab o‘chirib tashlanmagan: ularning ortida lidlar, xabarlar va jurnal yozuvlari qoladi, mualliflikni orqaga qarab bekor qilib bo‘lmaydi.",
    pl: "Celowo nieusunięci: zostają przy nich leady, wiadomości i wpisy w dzienniku, a autorstwa nie można wymazać wstecz.",
  },
  disabledOn: {
    ru: (date: string) => `отключён ${date}`,
    uz: (date: string) => `${date} da o‘chirilgan`,
    pl: (date: string) => `wyłączony ${date}`,
  },
  goneReturn: {
    ru: "Чтобы вернуть человека — заведите его снова по тому же Telegram id: включится прежняя запись, а не новая.",
    uz: "Odamni qaytarish uchun uni o‘sha Telegram id bilan qayta qo‘shing: yangi emas, avvalgi yozuv yoqiladi.",
    pl: "Aby przywrócić osobę, dodaj ją ponownie z tym samym id Telegrama: włączy się dawny wpis, a nie nowy.",
  },

  // Завести сотрудника.
  inviteTitle: { ru: "Завести сотрудника", uz: "Xodim qo‘shish", pl: "Dodaj pracownika" },
  inviteHelp: { ru: "Как завести сотрудника", uz: "Xodimni qanday qo‘shish kerak", pl: "Jak dodać pracownika" },
  inviteNote: {
    ru: "Числовой id человек узнаёт у любого бота вроде @userinfobot и присылает вам. По username завести нельзя: освободившийся ник займёт кто угодно.",
    uz: "Raqamli id’ni odam @userinfobot kabi istalgan botdan bilib oladi va sizga yuboradi. Username bo‘yicha qo‘shib bo‘lmaydi: bo‘shagan nikni istalgan kishi egallashi mumkin.",
    pl: "Numeryczne id można sprawdzić w dowolnym bocie, np. @userinfobot, i przesłać Tobie. Po username dodać się nie da: zwolnioną nazwę może zająć ktokolwiek.",
  },
  inviteNoteHead: {
    ru: " Заведённый вами менеджер сразу закрепляется за вами.",
    uz: " Siz qo‘shgan menejer darhol sizga biriktiriladi.",
    pl: " Dodany przez Ciebie menedżer od razu jest przypisany do Ciebie.",
  },
  fieldTelegramId: { ru: "Telegram id", uz: "Telegram id", pl: "Id Telegrama" },
  fieldName: { ru: "Имя в панели", uz: "Paneldagi ism", pl: "Imię w panelu" },
  fieldNamePlaceholder: { ru: "Иван", uz: "Aziz", pl: "Jan" },
  fieldUsername: { ru: "Username", uz: "Username", pl: "Username" },
  optional: { ru: "(не обязателен)", uz: "(majburiy emas)", pl: "(opcjonalnie)" },
  fieldRole: { ru: "Роль", uz: "Rol", pl: "Rola" },
  inviteSubmit: { ru: "Завести", uz: "Qo‘shish", pl: "Dodaj" },

  // Уведомления.
  notices: {
    ru: (summary: string) => `Уведомления · ${summary}`,
    uz: (summary: string) => `Bildirishnomalar · ${summary}`,
    pl: (summary: string) => `Powiadomienia · ${summary}`,
  },
  noticesFor: {
    ru: (name: string) => `Что бот присылает «${name}»:`,
    uz: (name: string) => `Bot «${name}» ga nimalarni yuboradi:`,
    pl: (name: string) => `Co bot wysyła do «${name}»:`,
  },
  noticesHelp: { ru: "Как работают уведомления", uz: "Bildirishnomalar qanday ishlaydi", pl: "Jak działają powiadomienia" },
  withoutTick: {
    ru: (what: string) => `Без галочки: ${what}.`,
    uz: (what: string) => `Belgisiz: ${what}.`,
    pl: (what: string) => `Bez zaznaczenia: ${what}.`,
  },
  noticesAlways: {
    ru: "Приглашение, смена роли и руководителя, просьба подтвердить передачу приходят всегда — без них действие не состоится.",
    uz: "Taklif, rol va rahbar o‘zgarishi, lidni berishni tasdiqlash so‘rovi har doim keladi — ularsiz amal bajarilmaydi.",
    pl: "Zaproszenie, zmiana roli i kierownika oraz prośba o potwierdzenie przekazania przychodzą zawsze — bez nich akcja się nie odbędzie.",
  },
  noticesSave: { ru: "Сохранить", uz: "Saqlash", pl: "Zapisz" },
  offAllOn: { ru: "приходит всё", uz: "hammasi keladi", pl: "przychodzi wszystko" },
  offAllOff: { ru: "всё выключено", uz: "hammasi o‘chirilgan", pl: "wszystko wyłączone" },
  offSome: {
    ru: (n: number, of: number) => `выключено: ${n} из ${of}`,
    uz: (n: number, of: number) => `o‘chirilgan: ${of} tadan ${n} tasi`,
    pl: (n: number, of: number) => `wyłączone: ${n} z ${of}`,
  },

  // Отключение.
  disable: { ru: "Отключить", uz: "O‘chirish", pl: "Wyłącz" },
  disableWhat: {
    ru: (name: string) => `Что произойдёт с «${name}»:`,
    uz: (name: string) => `«${name}» bilan nima bo‘ladi:`,
    pl: (name: string) => `Co się stanie z «${name}»:`,
  },
  disableHelp: { ru: "Подробно об отключении", uz: "O‘chirish haqida batafsil", pl: "Szczegóły wyłączenia" },
  dSessions: {
    ru: "Сессии оборвутся сразу, ссылки входа перестанут работать, кнопки бота — тоже.",
    uz: "Sessiyalar darhol uziladi, kirish havolalari ishlamay qoladi, bot tugmalari ham.",
    pl: "Sesje zostaną od razu przerwane, linki logowania przestaną działać, przyciski bota też.",
  },
  dNoLeads: {
    ru: "Новые лиды ему больше не придут — ни в очередь, ни рассылкой.",
    uz: "Unga endi yangi lidlar kelmaydi — na navbat orqali, na tarqatma orqali.",
    pl: "Nowe leady nie będą już do niego trafiać — ani z kolejki, ani z rozsyłki.",
  },
  // Рисуется с выделенной серединой: dRequeuePre, <b>dRequeueBold</b>, dRequeuePost.
  dRequeuePre: { ru: "Лиды в работе ", uz: "Ishdagi lidlar ", pl: "Leady w toku " },
  dRequeueBold: { ru: "вернутся в очередь", uz: "navbatga qaytadi", pl: "wrócą do kolejki" },
  dRequeuePost: {
    ru: " и уйдут другим по обычным правилам. Его очередь на лид передастся следующему сразу.",
    uz: " va odatiy qoidalar bo‘yicha boshqalarga o‘tadi. Uning lid navbati darhol keyingisiga o‘tadi.",
    pl: " i trafią do innych na zwykłych zasadach. Jego kolejka na lead od razu przejdzie na następną osobę.",
  },
  dTalks: {
    ru: "Идущие переписки из касаний перейдут его руководителю, а если его нет — вам. Неотправленные касания вернутся в общий пул.",
    uz: "Aloqalardagi davom etayotgan yozishmalar uning rahbariga, rahbari bo‘lmasa — sizga o‘tadi. Yuborilmagan aloqalar umumiy ro‘yxatga qaytadi.",
    pl: "Trwające korespondencje z kontaktów przejdą do jego kierownika, a jeśli go nie ma — do Ciebie. Niewysłane kontakty wrócą do wspólnej puli.",
  },
  dReminders: {
    ru: "Напоминания и просьбы о передаче лидов закроются.",
    uz: "Eslatmalar va lidni berish so‘rovlari yopiladi.",
    pl: "Przypomnienia i prośby o przekazanie leadów zostaną zamknięte.",
  },
  dTeam: {
    ru: "Если он руководитель — его менеджеры станут ничьими.",
    uz: "Agar u rahbar bo‘lsa — uning menejerlari hech kimga biriktirilmagan bo‘lib qoladi.",
    pl: "Jeśli jest kierownikiem — jego menedżerowie zostaną bez kierownika.",
  },
  dCards: {
    ru: "Карточки лидов из его Telegram удалятся (за последние 48 часов — так позволяет Telegram), у более старых пропадут кнопки.",
    uz: "Uning Telegram’idagi lid kartochkalari o‘chiriladi (oxirgi 48 soatdagilari — Telegram shunga ruxsat beradi), eskiroqlarida tugmalar yo‘qoladi.",
    pl: "Karty leadów z jego Telegrama zostaną usunięte (z ostatnich 48 godzin — tyle pozwala Telegram), w starszych znikną przyciski.",
  },
  dHistory: {
    ru: "История остаётся: закрытые лиды, проекты, начисления и журнал — за ним, авторство не стирается.",
    uz: "Tarix qoladi: yopilgan lidlar, loyihalar, hisoblanmalar va jurnal — uning nomida, mualliflik o‘chmaydi.",
    pl: "Historia zostaje: zamknięte leady, projekty, naliczenia i dziennik — przy nim, autorstwo nie jest wymazywane.",
  },
  // Между dManualPre и dManualPost жирным — ник или имя.
  dManualPre: {
    ru: "Этого система сделать не может: удалите ",
    uz: "Buni tizim qila olmaydi: ",
    pl: "Tego system nie zrobi: usuń ręcznie ",
  },
  dManualPost: {
    ru: " руками из общих мест в Telegram — канала сигналов «Поиска» и общего чата отдела продаж, если он есть. Бот не может выгнать человека из канала, а оттуда он продолжит видеть сигналы и лиды.",
    uz: " — uni Telegram’dagi umumiy joylardan qo‘lda o‘chiring: «Qidiruv» signallari kanalidan va, agar bo‘lsa, sotuv bo‘limining umumiy chatidan. Bot odamni kanaldan chiqarib yubora olmaydi, u yerdan esa u signallar va lidlarni ko‘rishda davom etadi.",
    pl: " ze wspólnych miejsc w Telegramie — kanału sygnałów «Wyszukiwania» i wspólnego czatu działu sprzedaży, jeśli jest. Bot nie może wyrzucić nikogo z kanału, a stamtąd ta osoba nadal będzie widzieć sygnały i leady.",
  },
  disableConfirm: { ru: "Понятно, отключить", uz: "Tushunarli, o‘chirish", pl: "Rozumiem, wyłącz" },
});

/**
 * Итог отключения по пунктам — строка на «Команде» после «Понятно,
 * отключить». Собирает её `offboardingSummary` (lib/admin/offboarding.ts).
 * Только то, что было: «вернули 0 лидов» — не новость, а шум.
 */
export const offboardingDict = defineDict({
  leads: {
    ru: (n: number) => `лидов в работе вернулось в очередь — ${n}`,
    uz: (n: number) => `navbatga qaytgan ishdagi lidlar — ${n}`,
    pl: (n: number) => `leady w toku wróciły do kolejki — ${n}`,
  },
  talks: {
    ru: (n: number) => `переписок из касаний передано — ${n}`,
    uz: (n: number) => `berilgan aloqa yozishmalari — ${n}`,
    pl: (n: number) => `przekazane korespondencje z kontaktów — ${n}`,
  },
  pool: {
    ru: (n: number) => `неотправленных касаний вернулось в общий пул — ${n}`,
    uz: (n: number) => `umumiy ro‘yxatga qaytgan yuborilmagan aloqalar — ${n}`,
    pl: (n: number) => `niewysłane kontakty wróciły do wspólnej puli — ${n}`,
  },
  team: {
    ru: (n: number) => `менеджеров откреплено от него как от руководителя — ${n}`,
    uz: (n: number) => `undan rahbar sifatida ajratilgan menejerlar — ${n}`,
    pl: (n: number) => `menedżerowie odpięci od niego jako kierownika — ${n}`,
  },
  reminders: {
    ru: (n: number) => `напоминаний снято — ${n}`,
    uz: (n: number) => `bekor qilingan eslatmalar — ${n}`,
    pl: (n: number) => `anulowane przypomnienia — ${n}`,
  },
  transfers: {
    ru: (n: number) => `просьб о передаче лида закрыто — ${n}`,
    uz: (n: number) => `yopilgan lidni berish so‘rovlari — ${n}`,
    pl: (n: number) => `zamknięte prośby o przekazanie leada — ${n}`,
  },
  cards: {
    ru: (n: number) => `карточек лидов убрано из его Telegram — ${n}`,
    uz: (n: number) => `uning Telegram’idan olib tashlangan lid kartochkalari — ${n}`,
    pl: (n: number) => `karty leadów usunięte z jego Telegrama — ${n}`,
  },
  nothing: {
    ru: "Незакрытых дел за ним не было.",
    uz: "Uning ortida yopilmagan ishlar yo‘q edi.",
    pl: "Nie miał żadnych niezamkniętych spraw.",
  },
});
