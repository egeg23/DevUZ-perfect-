import type { HelpCopy } from "./admin-help";

/**
 * Инструкция по-узбекски, латиницей.
 *
 * Перевод admin-help-ru.ts абзац в абзац: те же пункты, роли и число
 * абзацев — это сверяет тест. Названия кнопок, блоков и статусов остаются
 * по-русски в «ёлочках»: панель русская, и человек ищет их глазами на
 * экране. Всё остальное — по-узбекски, с ‘ в o‘/g‘ и ’ в тутук белгиси.
 */

const BOT_URL = "https://t.me/Devuz_studio_bot";
/** Канал закрытый, публичного имени у него нет — только ссылка-приглашение. */
const SCOUT_URL = "https://t.me/+puC_Ns-kCbQ5NzJi";

export const uz: HelpCopy = {
  title: "Yo‘riqnoma",
  lead: "Panel qanday tuzilgani va undan qanday foydalanish — bo‘limlar bo‘yicha, oddiy so‘zlar bilan. Bu yerda faqat sizga ochiq narsalar yozilgan. Istalgan bo‘limdan bu yerga sahifa tepasidagi «Как пользоваться разделом» tugmasi olib keladi, bloklar yonidagi «?» esa kerakli bandni ochadi.",
  contentsTitle: "Mundarija",
  sectionsTitle: "Bo‘limlar",
  openSection: "bo‘limni ochish",
  viewAs: "Kim sifatida ko‘rsatish:",
  roleNames: { admin: "egasi", head: "rahbar", manager: "menejer" },
  ownerOnly: "Faqat egasi ko‘radi",

  sections: {
    /* ── Лиды ─────────────────────────────────────────────────────────── */
    "/admin": {
      what: "Panelning bosh sahifasi va mijozlarning barcha murojaatlari: saytdagi chat, forma, Telegram-bot, vitrina, «Поиск» va sizning aloqalaringizdan. Bu yerda kim yozgani, unga nima kerakligi, qanchalik shoshilinchligi va u bilan kim ishlayotgani ko‘rinadi. Lid bilan har bir harakat — olish, kontaktni ochish, holatni o‘zgartirish — jurnalga ism va vaqt bilan yoziladi.",
      items: [
        {
          id: "home",
          title: "Bosh sahifada nima bor",
          body: {
            manager: [
              "Tepada — plitkalar: **«к выплате»** — qancha ishlab topganingiz va hali olmaganingiz (pastda mayda harf bilan — mijoz qolganini to‘lashini qanchasi kutayotgani), **«лидов в работе»**, **«срочно связаться»** va loyihalaringiz bo‘yicha **«поступлений за месяц»**.",
              "Agar rahbar sizga aloqalar rejasini qo‘ygan bo‘lsa, plitkalar ustida shunday qator chiqadi: «До плана осталось 12 — сделано 18 из 30 за эту неделю». Batafsil — [aloqalar rejasi](#prospect-plan) bandida.",
              "Pastroqda: [«Срочно связаться»](#leads-urgent) — uzoq vaqt harakatsiz turgan lidlaringiz; «Рекомендации на неделю» — nimani yaxshilash kerak ([tavsiyalar](#leads-coach) bandiga qarang); [«План и факт»](#leads-plan-fact) — sizga qo‘yilgan maqsadlar; eng pastda esa — [lidlar ro‘yxati](#leads-list).",
            ],
            head: [
              "Birinchi bo‘lib — **«Ждут вашего решения»**: menejerlarning lidni hamkasbga berish haqidagi so‘rovlari. Buni siz yoki egasi hal qiladi — batafsil [lidni berish](#leads-transfer) bandida.",
              "Plitkalar sizni va jamoangizni birga hisoblaydi: **«к выплате»** — faqat sizning balansingiz, **«лидов в работе у команды»**, **«срочно связаться»**, **«поступлений за неделю»**.",
              "Keyin: «На сегодня» — lidlaringiz bo‘yicha ertalabki maslahatlar, siz va jamoa bo‘yicha ismlar bilan [«Срочно связаться»](#leads-urgent), [«Команда за эту неделю»](#leads-team-week), jamoaga va sizga tavsiyalar, «Лучшие за неделю», [«План и факт»](#leads-plan-fact) va [lidlar ro‘yxati](#leads-list).",
              "Jamoa — bu [«Команда»](/admin/team) bo‘limida sizga biriktirilgan menejerlar. Jamoa bo‘lmaguncha, bosh sahifada uning bloklari chiqmaydi.",
            ],
            admin: [
              "Sizda bosh sahifa varaqlarga bo‘lingan — bitta uzun lentani aylantirib o‘tirmaslik uchun. Varaq manzilda saqlanadi, uni xatcho‘plarga qo‘yib qo‘ysa bo‘ladi.",
              "**«Сегодня»** — kunni nimadan boshlash: «Ждут вашего решения» (lidni berish so‘rovlari), imzoga kelgan shartnomalar, pul plitkalari, «На сегодня» maslahatlari («собрать заново» tugmasi modelga bitta so‘rov sarflaydi), butun studiya bo‘yicha «Срочно связаться» va ikki haftalik soliq muddatlari.",
              "**«Лиды»** — barcha filtrlari bilan [lidlar ro‘yxati](#leads-list). Varaqdagi tilla rangli raqam — hozir nechta lid bo‘shligi.",
              "**«Деньги»** — «Касса по месяцам» (yarim yillik tushum va xarajatlar, har oy ostida — farqi) va «Ожидаем оплат»: faol loyihalar bo‘yicha yana qancha to‘lanishi kerak.",
              "**«Команда»** — [haftalik jadval](#leads-team-week), eng yaxshilar, har biriga tavsiyalar va [«План и факт»](#leads-plan-fact) — u yerda maqsadlarni qo‘yasiz va o‘zgartirasiz.",
              "Metrika va Google Analytics bo‘yicha saytga tashriflar — varaq emas, alohida [Trafik](/admin/traffic) bo‘limi: uni siz va rahbarlar ko‘rasiz. Varaqqa eski xatcho‘plar ham o‘sha yerga olib boradi.",
            ],
          },
        },
        {
          id: "queue",
          title: "Lid odamga qanday yetib boradi: navbat",
          body: {
            manager: [
              "Lidlar navbat bilan tarqatiladi, tezroq bosganga emas. Oldin bitta chaqqon odam hammasini olib ketardi, sovuq aloqalarga esa hech kimda vaqt qolmasdi.",
              "**Kunduzi, Toshkent vaqti bilan 08:00 dan 18:00 gacha** (dam olish kunlari ham), yangi lid bitta odamga taklif qilinadi — shu oyda «oldi + o‘tkazib yubordi» soni eng kam bo‘lganiga. Sizga Telegramda kartochka keladi: «⏳ Лид ваш на 30 минут — до 14:30». Qolganlar uni ko‘rmaydi va ololmaydi.",
              "30 daqiqada olmadingiz — lid navbatdagi odamga o‘tadi, sizga esa «⌛ 30 минут на лид вышли» keladi. O‘tkazib yuborish olingan imkoniyat sifatida hisoblanadi: aks holda ta’tildagi odam navbatda doim birinchi turardi va har bir lid uni yarim soat kutardi.",
              "Agar lidni butun aylana davomida hech kim olmasa, u hammaga ochiladi: «🔓 Никто из очереди не взял — лид открыт всем. Берёт первый, кто нажмёт».",
              "**Kechasi, 18:00 dan 08:00 gacha**, yarim soat qoidasi ishlamaydi — lid darhol navbatdagi hammaga ochiq. Lekin oyiga teng ulushdan ko‘p olib bo‘lmaydi: ulushingizni olib bo‘lgan bo‘lsangiz, «🌙 …Свою долю за месяц вы уже взяли — он для тех, у кого меньше» yozuvini ko‘rasiz. Aks holda kechasi lidlarni yana uxlamay o‘tirgan odam olib ketardi.",
              "Lid boshqa odamning navbatida turganda, kartochkada mijozning niki yashirin — «скрыт — лид сейчас не ваш». O‘zingizning [aloqalaringizdan](/admin/prospect) kelgan lidlar navbatga tushmaydi: ular darhol sizniki.",
            ],
            head: [
              "Siz navbatda menejerlar bilan teng turasiz — qoidalar bir xil. Lidlar navbat bilan tarqatiladi, tezroq bosganga emas.",
              "**Kunduzi, Toshkent vaqti bilan 08:00 dan 18:00 gacha** (dam olish kunlari ham), yangi lid bitta odamga taklif qilinadi — shu oyda «oldi + o‘tkazib yubordi» soni eng kam bo‘lganiga. U Telegramda «⏳ Лид ваш на 30 минут» xabarini oladi. Qolganlar bu kartochkani ko‘rmaydi.",
              "30 daqiqada olmadi — lid navbatdagi odamga o‘tadi. O‘tkazib yuborish olingan imkoniyat sifatida hisoblanadi. Aylana davomida hech kim olmasa, lid hammaga ochiladi: birinchi bosgan oladi.",
              "**Kechasi, 18:00 dan 08:00 gacha**, lid darhol navbatdagi hammaga ochiq, lekin har kim oyiga teng ulushdan ko‘p ololmaydi.",
              "Lid bo‘sh turganda uning kontakti va yozishmasini siz ham ocholmaysiz — avval «Взять себе». Mijozning niki navbati kelmagan hammadan yashirin. Aks holda navbatni bitta tugma bilan aylanib o‘tish mumkin bo‘lardi.",
              "Navbatda faqat Telegrami ulangan odamlar turadi: usiz odamga lid uniki ekanini aytib bo‘lmaydi.",
            ],
            admin: [
              "Siz **navbatdan tashqaridasiz**: istalgan bo‘sh lidni istalgan paytda olishingiz mumkin, tungi ulush cheklovi sizga ta’sir qilmaydi. Navbatda Telegrami ulangan menejerlar va rahbarlar turadi.",
              "Kunduzi (Toshkent vaqti bilan 08:00–18:00, har kuni) lid bitta odamga 30 daqiqaga taklif qilinadi — oy davomida «oldi + o‘tkazib yubordi» soni eng kam bo‘lganiga. Sizga va sotuv chatiga nusxa keladi: «👁 В очереди у @ник до 14:30. Вы вне очереди — можете взять сами». Lid kartochkasida ham u hozir kimdaligini ko‘rasiz; boshqalarga bu ism ko‘rsatilmaydi — tortishuv boshlanmasin.",
              "30 daqiqada olmadi — navbatdagiga; aylana tugadi — lid hammaga ochiq. Agar siz hozir kimgadir taklif qilingan lidni olsangiz, uning taklifi yopiladi va unga o‘tkazib yuborish deb hisoblanmaydi.",
              "Kechasi (18:00–08:00) lid darhol hammaga ochiq, lekin har kim oyiga teng ulushdan ko‘p olmaydi: «oy boshidan olinganlar ÷ navbatdagi odamlar soni», yuqoriga yaxlitlanadi.",
              "Navbatni chetlab o‘tadi: aloqalardan kelgan lidlar (darhol yozgan odamga biriktiriladi) va vitrinadan kelgan $10 000 dan qimmat buyurtmalar — ular faqat sizga keladi.",
            ],
          },
        },
        {
          id: "take",
          title: "Lidni olish va undan voz kechish",
          body: [
            "Lidni kartochkadagi **«Взять себе»** tugmasi bilan yoki to‘g‘ridan-to‘g‘ri Telegramda kartochka ostidagi **«✅ Взять в работу»** tugmasi bilan olasiz. Shundan keyin lid sizniki: holati «в работе», 4 soatdan keyin «Взят в работу — что дальше?» avtoeslatmasi keladi, kartochka kelgan hammada esa u «✅ В работе у @ник» ga almashadi.",
            "Ikki kishi bir vaqtda bossa, lid bittasiga tushadi, ikkinchisi «Лида уже взял кто-то другой» yozuvini ko‘radi. Hozir navbat sizniki bo‘lmasa — «Не ваша очередь: лид сейчас предложен другому». Aynan kimga — ataylab aytilmaydi.",
            "Telegramdagi **«🗄 Отклонить»** — bu «mijoz bizga kerak emas» degan qaror. Lid avval bosgan odamga biriktiriladi, keyin «отложен» holatini oladi: rad etishning muallifi bo‘lishi kerak, jurnalda kim qaror qilgani ko‘rinadi.",
            "Oldingiz, lekin olib borolmaysiz — kartochkada **«Вернуть в очередь»** tugmasini bosing. Lid yana bo‘sh bo‘ladi va hammaga ochiladi, u bo‘yicha avtoeslatmalaringiz bekor qilinadi. U navbat aylanasini qaytadan boshlamaydi: har bir odamga yarim soatdan — allaqachon ish boshlangan lid uchun juda uzoq.",
          ],
        },
        {
          id: "list",
          title: "Lidlar ro‘yxati: filtrlar va ustunlar",
          body: {
            manager: [
              "Siz **bo‘sh lidlarni va o‘zingiznikini** ko‘rasiz. Hamkasb olgan lid sizga na ro‘yxatda, na to‘g‘ridan-to‘g‘ri havola orqali ko‘rsatiladi — egasi shunday qaror qilgan. Shuning uchun sizdagi «всего» plitkasi — bo‘shlar va sizniki birgalikda.",
              "Tepadagi filtrlar: «все лиды / свободные / мои», ustuvorlik va holat. Ro‘yxatda har sahifada 50 ta lid.",
              "**«Когда»** — Toshkent vaqti. **«Бюджет»** — summa emas, mijoz pul haqida qanday gapirayotgani: «назван и утверждён», «есть, сравнивает» yoki «не назван». Formadan va aloqalardan kelgan murojaatlarda byudjet deyarli doim «не назван» — pul haqida gap hali bo‘lmagan.",
              "**«Балл»** — lidning 0 dan 100 gacha bahosi va harf: A — 75 dan, B — 55 dan, C — 35 dan, D — undan past. **«Приоритет»**: «горячий» — A baho yoki mijoz tirik odam so‘ragan; «тёплый» — B; «дозреет» — qolganlari; «архив» — mijoz rad etgan.",
              "Ro‘yxatda kontaktlar ataylab yo‘q: kontakt [kartochkada](#leads-card) ochiladi va har bir ochilish yozib qo‘yiladi.",
            ],
            head: [
              "Siz **studiyaning barcha lidlarini** ko‘rasiz — bo‘shlarini, o‘zingiznikini va boshqalarnikini. Filtrlar: «все лиды / свободные / мои», ustuvorlik va holat; har sahifada 50 ta.",
              "**«Бюджет»** — summa emas, mijoz pul haqida qanday gapirayotgani: «назван и утверждён», «есть, сравнивает» yoki «не назван». **«Балл»** — 0 dan 100 gacha baho va harf: A — 75 dan, B — 55 dan, C — 35 dan, D — undan past. **«Приоритет»**: «горячий» — A yoki tirik odam so‘ragan, «тёплый» — B, «дозреет» — qolganlari, «архив» — rad etgan.",
              "Holat ostida lidni olib borayotgan odamning niki ko‘rinadi. Ro‘yxatda kontaktlar yo‘q — ular [kartochkada](#leads-card) ochiladi va jurnalga yoziladi.",
            ],
            admin: [
              "Ro‘yxat — «Лиды» varag‘ida. Siz barcha lidlarni ko‘rasiz. Filtrlar: «все лиды / свободные / мои», ustuvorlik va holat; har sahifada 50 ta.",
              "**«Бюджет»** — summa emas, mijoz pul haqida qanday gapirayotgani («назван и утверждён», «есть, сравнивает», «не назван»). **«Балл»**: A — 75 dan, B — 55 dan, C — 35 dan, D — undan past. **«Приоритет»**: «горячий» — A yoki odam so‘ragan, «тёплый» — B, «дозреет» — qolganlari, «архив» — rad etgan.",
              "Ro‘yxatda kontaktlar ataylab yo‘q: aks holda «kontaktlarni kim ko‘rgan» degani «panelni ochgan hamma» degani bo‘lardi. Kartochkada kontaktning har bir ochilishi — [jurnalda](/admin/audit) bitta qator.",
            ],
          },
        },
        {
          id: "card",
          title: "Lid kartochkasi",
          body: {
            manager: [
              "Ro‘yxatdan, «Срочно связаться» blokidan va Telegramdagi «🔓 Открыть карточку» tugmasi bilan ochiladi — bu tugma panelga o‘zi kiritadi. Har bir ochilish yozib qo‘yiladi.",
              "**«Ведёт»** — lid kimga biriktirilgan. Shu yerda [«Взять себе» va «Вернуть в очередь»](#leads-take) hamda [«Попросить передать»](#leads-transfer) tugmalari bor.",
              "**«Статус»** — «новый», «в работе», «отложен», «выиграли», «проиграли». Har bir suhbatdan keyin o‘zgartiring: [statistika](/admin/stats) va «Срочно связаться» holatlar bo‘yicha hisoblanadi. «Выиграли», «проиграли» va «отложен» avtoeslatmalarni bekor qiladi. «Новый» faqat bo‘sh lidda bor: sizning lidingizda u yo‘q, lidni qo‘yib yuborish — «Вернуть в очередь».",
              "**«Контакт клиента»** → «Показать контакт». Faqat olingan lid bo‘yicha ochiladi: avval «Взять себе». Har bir ochilish jurnalga tushadi, shuning uchun yozmoqchi bo‘lganingizda oching.",
              "**«Переписка с клиентом»** → «Показать переписку»: mijoz saytdagi yoki botdagi assistentga vazifa, pul va muddatlar haqida aytgan hamma narsa. Bu ham faqat olgandan keyin ochiladi va bu ham yoziladi. Formadan kelgan murojaatlarda yozishma yo‘q.",
              "**«Обсуждение»** — mijoz haqida butun jamoa uchun izohlar; lidni olib borayotgan odamga Telegramda xabar keladi. Mijoz kontaktini u yerga yozmang. Pastroqda — brif, saytdan kelgan smeta va izohlar. Aloqalardan kelgan lidlar haqida — [aloqa bo‘yicha birlamchi suhbat](#prospect-replies) bandi.",
            ],
            head: [
              "Siz istalgan kartochkani ochasiz. Har bir ochilish yozib qo‘yiladi.",
              "**«Ведёт»**: bo‘sh lid uchun [«Взять себе»](#leads-take), olingan har qanday lid uchun «Вернуть в очередь» va [«Передать»](#leads-transfer) — siz bergan lid darhol o‘tadi, tasdiqsiz.",
              "**«Статус»** istalgan lidda o‘zgartiriladi: «новый», «в работе», «отложен», «выиграли», «проиграли». «Выиграли», «проиграли» va «отложен» avtoeslatmalarni bekor qiladi. «Новый» — faqat bo‘sh lidda; biriktirilgan lidda u yo‘q, lidni «Вернуть в очередь» bo‘shatadi.",
              "**«Показать контакт»** va **«Показать переписку»** olingan har qanday lid bo‘yicha ishlaydi. Bo‘sh lid bo‘yicha — faqat «Взять себе» bosilgandan keyin: siz navbatda hamma bilan teng turasiz. Har bir ochilish jurnalga tushadi.",
              "**«Обсуждение»** — butun jamoa uchun izohlar, lidni olib borayotgan odamga ular Telegramda keladi. Pastroqda — brif, smeta va izohlar.",
            ],
            admin: [
              "Siz istalgan kartochkani ochasiz va hamma narsani qila olasiz: olish, navbatga qaytarish, berish, holatni o‘zgartirish, kontakt va yozishmani ochish — bo‘sh lidda ham, olmasdan oldin. Har bir harakat jurnalga ismingiz bilan tushadi.",
              "Bo‘sh lidda tepada u hozir kimning navbatida turgani ko‘rinadi: «👁 В очереди у … до 14:30». Boshqalarga bu ism ko‘rsatilmaydi.",
              "**«Статус»**: «выиграли», «проиграли» va «отложен» avtoeslatmalarni bekor qiladi; «новый» faqat bo‘sh lidda bor, biriktirilganda yo‘q — lidni «Вернуть в очередь» bo‘shatadi.",
              "**«Обсуждение»** butun jamoaga ko‘rinadi, lidni olib borayotgan odamga Telegramda keladi. Pastroqda — brif, smeta va assistent izohlari.",
            ],
          },
        },
        {
          id: "reminders",
          title: "Eslatmalar",
          body: {
            manager: [
              "Eslatmalar — sizning xotirangiz: ular Telegramda botdan keladi, darhol **«Открыть»**, **«+2 часа»** va **«Готово»** tugmalari bilan.",
              "**Avtoeslatma** lidni olganingizdan 4 soat keyin o‘zi qo‘yiladi: «Взят в работу — что дальше?». Bir sutkadan keyin emas — ertalab kelib, kechgacha tegilmagan lid allaqachon sovib qolgan. Kartochkadagi «Выключить автонапоминания» tugmasi bilan o‘chiriladi; qo‘lda qo‘ygan eslatmalaringiz esa qoladi.",
              "**O‘z eslatmangiz**: «Напоминания» blokida — «напомнить через 24 ч.» (0,5 soat va undan ko‘p bo‘lishi mumkin), «о чём напомнить» izohi va «Поставить».",
              "Ro‘yxatdagi holatlar: «отправлено», «просрочено» (vaqt o‘tdi, bot hali urinib ko‘ryapti) va «не доставлено» — besh urinishdan keyin. Bu bot sizga yozolmayotganini bildiradi: uni bloklamaganingizni tekshiring va botda «Старт» tugmasini bosing.",
              "Bajardingizmi — kartochkada «сделано» yoki Telegramda «Готово» tugmasini bosing. Faqat o‘z eslatmangizni yopish mumkin.",
            ],
            head: [
              "Eslatmalar Telegramda **«Открыть»**, **«+2 часа»** va **«Готово»** tugmalari bilan keladi.",
              "**Avtoeslatma** — lid olingandan 4 soat keyin. Kartochkada o‘chiriladi, qo‘lda qo‘yilganlari esa qoladi.",
              "**O‘z eslatmangiz**: «напомнить через N ч.», izoh va «Поставить». Siz istalgan lid bo‘yicha, jumladan jamoa lidlari bo‘yicha ham eslatma qo‘yishingiz va yopishingiz mumkin.",
              "Besh urinishdan keyingi «Не доставлено» — bot odamga yozolmayotganini bildiradi: u botni bloklamaganini tekshirib ko‘rsin.",
            ],
            admin: [
              "Eslatmalar Telegramda «Открыть», «+2 часа» va «Готово» tugmalari bilan keladi. Ularni svip yuboradi — jadval bo‘yicha har besh daqiqada bir marta ishga tushadigan jarayon. Agar u yarim soatdan ko‘p ishlamagan bo‘lsa, hammada bosh sahifada qizil [«Напоминания не доставляются»](#leads-banner) ogohlantirishi chiqadi.",
              "Avtoeslatma — lid olingandan 4 soat keyin; qo‘lda — «напомнить через N ч.» va «Поставить». Siz istalgan lid bo‘yicha eslatma qo‘yasiz va yopasiz.",
              "Besh urinishdan keyingi «Не доставлено» — bot odamga yozolmayapti: bot bloklangan yoki odam bir marta ham «Старт» tugmasini bosmagan.",
            ],
          },
        },
        {
          id: "transfer",
          title: "Lidni hamkasbga berish",
          body: {
            manager: [
              "Lidni uddalay olmayapsiz yoki mijoz hamkasbingizga ko‘proq mos — kartochkadagi «Передать» ro‘yxatida kimga ekanini tanlang, sababini yozing, keyin **«Попросить передать»** tugmasini bosing.",
              "Rahbaringiz yoki egasi so‘rovni tasdiqlamaguncha lid sizda qoladi: ularga Telegramda «Подтвердить» va «Отклонить» tugmalari bilan xabar boradi — ular panelsiz, shu yerning o‘zida hal qilishadi. Qaror kutilayotganda lid ikki odam o‘rtasida osilib qolmaydi.",
              "Tasdiqlashdi — lid hamkasbda, unga xabar va 4 soatdan keyin yangi eslatma keladi. Rad etishdi — sizga «Передачу не подтвердили. Лид остаётся у вас» keladi.",
              "Bo‘sh lid berilmaydi — uni «Взять себе» tugmasi bilan olishadi.",
            ],
            head: [
              "Sizning tugmangiz — **«Передать»**: lid tanlangan odamga darhol o‘tadi, unga «…передал вам лид. Он уже ваш» xabari keladi.",
              "Jamoangiz menejerlarining so‘rovlari («Попросить передать») sizga Telegramda **«✅ Подтвердить»** va **«✖ Отклонить»** tugmalari bilan keladi — xabarning o‘zida hal qiling; avval ko‘rmoqchi bo‘lsangiz, «Открыть лид» kartochkaga olib boradi. Xuddi shu so‘rovlar bosh sahifadagi «Ждут вашего решения» blokida va lid kartochkasida ham bor. Kimdir bittasi hal qilsa — qolganlarda tugmalar «Подтвердил …» yoki «Отклонил …» ga almashadi. Studiyadagi istalgan so‘rovni hal qila olasiz, faqat o‘z jamoangiznikini emas.",
              "Tasdiqlangan lidga 4 soatdan keyin yangi eslatma qo‘yiladi. Oldingi mas’ulning eski eslatmalari o‘zi yopilmaydi — kerak bo‘lsa, ularni yoping.",
            ],
            admin: [
              "Sizning tugmangiz — **«Передать»**: lid darhol o‘tadi. Menejerlarning so‘rovlari sizga Telegramda **«✅ Подтвердить»** va **«✖ Отклонить»** tugmalari bilan keladi — xabarning o‘zida hal qilasiz, — shuningdek «Сегодня» varag‘idagi «Ждут вашего решения» blokiga va lid kartochkasiga. Ularni rahbar ham hal qila oladi: u o‘z jamoasining so‘rovlarini xuddi shu tugmalar bilan oladi. Kim birinchi hal qilsa — qolganlarda tugmalar natijaga almashadi va hal qilingan so‘rovni qayta bosib bo‘lmaydi.",
              "Bu sizning qoidangiz bo‘yicha shunday qilingan: lid rahbar yoki sizning tasdig‘ingiz bilan beriladi va qaror chiqquncha oldingi mas’ulda qoladi.",
            ],
          },
        },
        {
          id: "urgent",
          title: "«Срочно связаться»",
          body: [
            "Bu yerda «в работе» holatidagi, juda uzoq harakatsiz turgan lidlar: «горячий» — 2 kun va undan ko‘p, «тёплый» — 3, «дозреет» — 5, «архив» — 14.",
            "Harakat — bu panelda lid bilan har qanday ish (hatto kartochkani ochish ham) yoki «Обсуждение» blokidagi xabar. Shuning uchun lid bilan shug‘ullanishingiz bilan u ro‘yxatdan chiqadi. Lekin halolroq yo‘li — qadam qo‘yish: mijozga yozish, holatni o‘zgartirish, eslatma qo‘yish.",
            "Tepada — eng eskilari. Bo‘sh bo‘lsa — «Все лиды в работе двигались недавно».",
          ],
        },
        {
          id: "plan-fact",
          title: "«План и факт»",
          body: {
            manager: [
              "Sizga hafta yoki oyga qo‘yilgan maqsadlar: **«поступления, $»** (loyihalaringiz bo‘yicha mijozlardan kelgan pul), **«выигранных лидов»** va **«первых контактов»** — «Показать контакт» tugmasini necha marta bosganingiz.",
              "Chiziq qancha bajarilganini ko‘rsatadi: 100% dan — yashil, 50% dan past — tilla rang. Hafta Toshkent vaqti bilan dushanbadan hisoblanadi.",
              "Rejani rahbar yoki egasi qo‘yadi — odam o‘ziga o‘zi reja qo‘ymaydi.",
            ],
            head: [
              "Hafta yoki oyga maqsadlar: «поступления, $», «выигранных лидов», «первых контактов» («Показать контакт» bosilishlari).",
              "Siz menejeringizga **yangi reja qo‘yishingiz** mumkin: «Кому», «Период», «Показатель», «Цель» va «Поставить план». Qo‘yilgan rejani o‘zgartirish va olib tashlashni faqat egasi qila oladi, o‘ziga esa hech kim reja qo‘ymaydi.",
              "Chiziq: 100% dan — yashil, 50% dan past — tilla rang.",
            ],
            admin: [
              "«Команда» varag‘ida. Siz istalgan odamga reja qo‘yasiz, yana «изменить» va «снять» bilan istalgan rejani o‘zgartira va olib tashlay olasiz. Rahbar faqat o‘z menejeriga reja qo‘sha oladi — siz shunday qaror qilgansiz.",
              "Ko‘rsatkichlar: «поступления, $», «выигранных лидов», «первых контактов» (bu «Показать контакт» bosilishlari). Davrlar: dushanbadan boshlanadigan joriy hafta va joriy oy.",
            ],
          },
        },
        {
          id: "coach",
          title: "Tavsiyalar",
          body: {
            manager: [
              "**«Рекомендации на неделю»** har dushanba Toshkent vaqti bilan 06:00 dan boshlab o‘tgan haftadagi raqamlaringiz bo‘yicha tuziladi: «Прошлый период», «На что смотреть», «Что делать», «Чему научиться», «Что хорошо».",
              "Bu baho emas, maslahat. Bir haftadan keyin — yangi o‘lchov va yangi reja.",
            ],
            head: [
              "**«На сегодня»** — har kuni ertalab 07:00 dan: bugun lidlaringiz va jamoa lidlari bo‘yicha nima qilish kerak.",
              "**«Рекомендации на неделю»** — har dushanba 06:00 dan, sizga va jamoadagi har bir kishiga. Jamoaga tavsiyalar sizga «Рекомендации команде на неделю» blokida ko‘rinadi — ularni yig‘ilishda muhokama qilish qulay.",
            ],
            admin: [
              "Haftalik tavsiyalar har dushanba 06:00 dan sizdan boshqa hamma uchun tuziladi; «На сегодня» — har kuni ertalab 07:00 dan siz va rahbarlar uchun.",
              "«собрать заново» tugmasi faqat sizda bor: har bir yig‘ish — modelga so‘rovlar, ya’ni pul.",
            ],
          },
        },
        {
          id: "team-week",
          title: "«Команда за эту неделю»",
          roles: ["head", "admin"],
          body: {
            head: [
              "Siz va jamoangiz bo‘yicha jadval, strelka — o‘tgan haftaga nisbatan.",
              "**«В работе»** — «в работе» holatidagi lidlar. **«Срочно»** — ulardan nechtasi [uzoq vaqt harakatsiz](#leads-urgent). **«Касаний»** — odamning hafta davomida lidlar bilan barcha harakatlari: kartochkani, kontaktni ochdi, eslatma, holat, muhokamadagi xabar. Bu lidlar bilan ish, sovuq aloqalar emas. **«Контактов»** — «Показать контакт» bosilishlari. **«Выиграно»**, **«Поступления»** — hafta davomida uning loyihalari bo‘yicha kelgan pul. **«План касаний»** — sovuq aloqalar siz [«Команда»](/admin/team) bo‘limida qo‘yadigan rejaga nisbatan.",
              "«Лучшие за неделю» jamoada ikki va undan ko‘p odam bo‘lganda chiqadi.",
            ],
            admin: [
              "Sizdan boshqa hamma bo‘yicha jadval; strelka — o‘tgan haftaga nisbatan.",
              "**«Касаний»** — odamning hafta davomida lidlar bilan barcha harakatlari (ochdi, kontakt, eslatma, holat, muhokama), sovuq aloqalar emas; sovuq aloqalar — **«План касаний»** ustunida. **«Контактов»** — «Показать контакт» bosilishlari. **«К выплате»** ustunini faqat siz ko‘rasiz.",
            ],
          },
        },
        {
          id: "banner",
          title: "Qizil ogohlantirish «Напоминания не доставляются»",
          body: {
            manager: [
              "Agar eslatmalarni yarim soatdan ko‘p hech kim yubormagan bo‘lsa, bosh sahifa tepasida chiqadi. Darhol egasiga ayting: u turganda lidlaringiz bo‘yicha eslatmalar kelmaydi — ularni kartochkalarda o‘zingiz tekshiring.",
            ],
            head: [
              "Svip — jadval bo‘yicha har besh daqiqada bir marta ishga tushadigan jarayon — yarim soatdan ko‘p ishlamagan bo‘lsa chiqadi. U turganda eslatmalar hech kimga kelmaydi. Egasiga ayting.",
            ],
            admin: [
              "Svip — serverda har besh daqiqada bir marta ishga tushadigan taymer: u eslatmalarni yuboradi, lidlar navbatini suradi, kunlik to‘plamlarni tarqatadi. 30 daqiqadan ko‘p muvaffaqiyatli ishga tushmagan bo‘lsa, ogohlantirish chiqadi.",
              "Nimani tekshirish kerak: serverda `systemctl status devuz-reminders.timer` va `.env` faylidagi `REMINDER_SWEEP_SECRET`. Tez ko‘rik — GitHub → Actions → «Осмотр связи с сервером».",
            ],
          },
        },
      ],
    },

    /* ── Заявки ───────────────────────────────────────────────────────── */
    "/admin/orders": {
      what: "Saytdagi do‘kondan tayyor mahsulotlarga buyurtmalar — mijozlar loyihalari emas. Xaridor rekvizitlari bilan buyurtma qoldiradi, biz hisob chiqaramiz, u naqd pulsiz to‘laydi va fayllarni oladi. Barcha xodimlar barcha buyurtmalarni ko‘radi va istalganini olib bora oladi; kim oxirgi bosgan bo‘lsa, o‘sha «ведёт».",
      items: [
        {
          id: "flow",
          title: "Buyurtma yo‘li",
          body: [
            "«новая» → «счёт выставлен» → «оплачена» → «передан». Yoki «отменена». Tepadagi filtrlar — shu holatlar bo‘yicha.",
            "Xaridor kontakti darhol ko‘rinadi: hisob chiqarilishi uchun rekvizitlarni o‘zi qoldirgan. Kontakt yonidagi «бот привязан» xaridor botimizni ulaganini bildiradi — hisob va to‘lov haqidagi bildirishnomalar unga o‘sha yerga boradi.",
            "Buyurtma qotib qolsa, Telegramga eslatma keladi: 2 kun hisobsiz, hisob 14 va 30 kun to‘lanmagan, to‘langan, lekin beriladigan fayl yo‘q.",
          ],
        },
        {
          id: "invoice",
          title: "Summa va hisob",
          body: [
            "Ba’zi mahsulotlarning narxi — oraliq, va buyurtma summasiz keladi. Uni «сумма, $» maydoniga yozing va **«проставить»** tugmasini bosing. Hisobdan keyin summani o‘zgartirib bo‘lmaydi.",
            "**«выставить счёт»** — summa kerak. Hisob raqami o‘zi beriladi; qayta bosish raqamni o‘zgartirmaydi. Xaridor hisobni o‘z buyurtmasi sahifasida ko‘radi (havolani u buyurtma berayotganda olgan), bot ulangan bo‘lsa — yana xabar ham oladi. Xabarda to‘lov havolasi ataylab yo‘q: hisobdagi rekvizitlar bo‘yicha to‘lashadi.",
            "Tepada «Банковские реквизиты не настроены» turgan bo‘lsa — hisob chiqadi, lekin xaridor qayerga to‘lashni ko‘rmaydi. Egasiga ayting.",
          ],
        },
        {
          id: "paid",
          title: "To‘lov va fayllarni berish",
          body: [
            "Pul hisob raqamga tushdi — **«строка выписки»** maydoniga bank ko‘chirmasidagi qatorni yozing va **«оплата получена»** tugmasini bosing. Qatorsiz bo‘lmaydi: aks holda bir oydan keyin to‘lov bo‘lganini isbotlab bo‘lmaydi.",
            "Shu daqiqadan xaridorga fayllar ochiladi — agar egasi ularni «Релизы» bo‘limiga joylagan bo‘lsa. Yuklab olish — jami 20 tagacha va kuniga 10 tagacha, o‘sha faylni 10 daqiqa ichida qayta yuklash hisoblanmaydi.",
            "Birinchi yuklab olish o‘zi «передан» qo‘yadi. **«код передан»** tugmasi — boshqacha berganingizda, masalan, repozitoriyga kirish huquqi bilan. To‘lovdan oldin u ishlamaydi: kodni berish — bekor qilib bo‘lmaydigan yagona qadam.",
          ],
        },
        {
          id: "access",
          title: "Havolalar, kirish va bekor qilish",
          body: [
            "**«перевыпустить ссылку»** — buyurtma sahifasiga yangi havola, eskisi ishlamay qoladi. Yangisi bir marta ko‘rsatiladi — uni darhol xaridorga yuboring.",
            "**«отозвать доступ к файлам»** yuklab olishni butunlay yopadi: berilgan havolalar ishlamay qoladi, buyurtma sahifasida esa tugma o‘rniga xaridor «Доступ к файлам закрыт» deb ko‘radi. Sahifa va hisob saqlanadi — u o‘z hujjatlarini yo‘qotmaydi. Buyurtmada «Доступ: закрыт с …» paydo bo‘ladi. **«вернуть доступ к файлам»** yuklab olishni qayta ochadi, lekin eski havolalar o‘lik qoladi — shuning uchun havola sizib chiqqan bo‘lsa, «отозвать», keyin «вернуть» tugmasini bosing: sizib chiqqani o‘chadi, xaridor esa o‘z sahifasidan yangisini yuklab oladi.",
            "**«отменить»** — xaridorga bildirishnoma boradi. **«вернуть в работу»** holatni tanlab emas, sanalar bo‘yicha tiklaydi: hisob chiqarilgan bo‘lsa — «счёт выставлен» qaytadi.",
          ],
        },
      ],
    },

    /* ── Поиск ────────────────────────────────────────────────────────── */
    "/admin/scout": {
      what: "Skaut-robot kechayu kunduz Telegramdagi ochiq chatlarni o‘qiydi va hozir dasturchi qidirayotgan odamlarni topadi. Kuchli topilmalarni o‘zi lidga aylantiradi, qolganlarini «Devuz Scout» kanaliga yuboradi. Bu yerda u nima topgani va ishlayotgani ko‘rinadi.",
      items: [
        {
          id: "how",
          title: "Bu qanday ishlaydi",
          body: [
            "Skaut chatlarni studiyaning ishchi akkauntidan o‘qiydi. Har bir xabar saralashdan o‘tadi, qolganini model o‘qiydi va 0 dan 100 gacha baho hamda toifa qo‘yadi.",
            "**20 dan past** — darhol «мимо», lentada xalaqit bermaydi. **60 dan** — Telegramdagi «Devuz Scout» kanaliga keladi. **70 dan** — kuchli signal: bir-ikki daqiqadan keyin svip undan tayyor birinchi xabar bilan lid ochadi va [lidlar navbati](#leads-queue) bo‘yicha yuboradi. «субподряд» toifasi har qanday bahoda kanalga ketadi.",
            "Har kuni ertalab 09:00 dan keyin o‘sha kanalga «☀️ Скаут за сутки» xulosasi keladi: robot ishlayaptimi va nima topdi.",
          ],
        },
        {
          id: "strong",
          title: "Kuchli signal (70+) — o‘zingiz yozmang",
          body: [
            "Kanalda bunday signalning oxirgi qatori: «Сильный сигнал: через пару минут он уйдёт менеджерам очередью лидов с готовым ответом — сами не пишите». Bu muhim: odamga ikki kishi yozsa, biz spamga o‘xshab qolamiz.",
            "Lid navbati kelgan odamga keladi. Uning izohlarida nima qilish kerakligi yozilgan: bunday postlar bir necha soat yashaydi, shaxsiy xabarga hozir yozing. Muallifning username’i bo‘lmasa — faqat chatning o‘zida javob berish mumkin.",
          ],
        },
        {
          id: "signals",
          title: "Oddiy signal — nima qilish kerak",
          body: [
            "70 dan past signallarni sizdan boshqa hech kim ko‘rib chiqmaydi. Mos kelsa — tez, qo‘lda va o‘z akkauntingizdan javob bering: o‘sha chatda yoki muallifga shaxsiy xabarda. Servis chatlarga bir qator ham yozmaydi.",
            "Keyin signal kartochkasida belgilang: **«ответили»** yoki **«мимо»**. «Пришёл сам» avtomatik qo‘yiladi — odam botimizga yozganda yoki signal lidga aylanganda.",
            "Plitkalar: «сигналов» — jami, «не открывали» — qaror kutayotganlar, «пришли сами», «доходят до нас» — ko‘rib chiqilganlarning qancha qismi bizgacha yetib kelgani. Signal lidning bir qismiga aylanmasa, 90 kun saqlanadi.",
          ],
        },
        {
          id: "health",
          title: "Skaut ishlayaptimi",
          body: {
            manager: [
              "Tepadagi tilla rangli ogohlantirish — nimadir noto‘g‘ri: skaut jim, birorta chatni o‘qimayapti yoki model ishlamayapti. «Аккаунт читает 12 чатов из 29» ogohlantirishi — chatlarning bir qismi o‘qilmayapti. Ikkala holatda ham egasiga ayting: bu paneldan tuzatilmaydi.",
            ],
            head: [
              "Tepadagi tilla rangli ogohlantirish — nosozlik: «Скаут молчит N мин.» (jarayon to‘xtagan), «не читает ни одного чата» yoki «Модель недоступна». «Не читаются» ro‘yxati bilan «Аккаунт читает X чатов из Y» — ishchi akkaunt bu chatlarga qo‘shilmagan. Egasi tuzatadi.",
            ],
            admin: [
              "«Скаут молчит N мин.» — serverdagi jarayon yiqilgan yoki to‘xtatilgan: `systemctl status devuz-scout`. «Модель недоступна» — kalitda yoki undagi pulda muammo.",
              "«Аккаунт читает X чатов из Y» va «Не читаются» ro‘yxati — ishchi akkaunt bu chatlarga qo‘shilmagan yoki manzil ochilmagan. Ishchi akkauntdan qo‘lda qo‘shilish kerak: paneldan bu qilinmaydi.",
              "«Механизм цел: … запросов пока не было» — bu chatlardagi jimlik, nosozlik emas.",
            ],
          },
        },
      ],
    },

    /* ── Касания ──────────────────────────────────────────────────────── */
    "/admin/prospect": {
      what: "Sovuq aloqalar: kompaniyalarni topamiz, saytlarini tekshiramiz, model esa odam o‘zi tekshira oladigan bitta haqiqiy muammo atrofida birinchi xabarni yozadi. Studiyaning ishchi akkaunti yuboradi, mijoz javoblarini model olib boradi, odam kerak bo‘lganda esa yozgan odamni chaqiradi. Aloqadan kelgan lid darhol sizniki, navbatsiz.",
      items: [
        {
          id: "portion",
          title: "Kunlik to‘plam",
          body: {
            manager: [
              "Ish kunlari soat 07:00 da tizim umumiy zaxiradagi kompaniyalarni teng tarqatadi — aylana bo‘yicha bittadan. Sizga qanchasi: haftalik aloqalar rejasi 5 ga bo‘linadi (kuniga 2 dan 15 gacha). Reja bo‘lmasa — kuniga 5 ta.",
              "09:00 ga kelib xatlar tayyor bo‘ladi va to‘plam sizga Telegramda keladi: har bir kompaniyada — kimga yozish, gapni nimadan boshlash va matn (matnni bossangiz — nusxalanadi). Tugmalar: **«📤 Отправить через бота»**, **«WhatsApp ↗»**, **«✋ Написал сам»**, **«✖ Не подходит»** va **«Открыть в панели»**.",
              "Xuddi shu to‘plam — bo‘lim tepasida, «Ваша порция на сегодня: сделано 2 из 6» blokida, «текст готов», «сделано», «не подошла» holatlari bilan.",
              "**18:00 da** bajarilmagani umumiy zaxiraga qaytadi, xat esa o‘chiriladi — u sizning ismingiz bilan imzolangan. Rahbar va egasi hisobot oladi: kim qanchasini bajargan.",
              "«Отправить» va «Написал сам» / «Связался сам» bajarilgan deb hisoblanadi — Telegramdan ham, paneldan ham bir xil. «Не подходит» — bu «сделано» emas, lekin ishni qilmaslik ham emas.",
            ],
            head: [
              "Siz ham to‘plam olasiz: ish kunlari soat 07:00 da zaxiradagi kompaniyalar navbatdagi hammaga — sizga va menejerlarga teng tarqatiladi. Hajmi — haftalik reja ÷ 5 (2 dan 15 gacha), reja bo‘lmasa — 5.",
              "09:00 da to‘plam Telegramga tayyor matnlar va «📤 Отправить через бота», «WhatsApp ↗», «✋ Написал сам», «✖ Не подходит», «Открыть в панели» tugmalari bilan keladi. Bo‘limda u «Ваша порция на сегодня» blokida turadi.",
              "18:00 da bajarilmagani zaxiraga qaytadi, sizga esa o‘zingiz va jamoangiz bo‘yicha hisobot keladi: «Имя — 3 из 5, не подошло 1». ⚠️ — hech narsa bajarilmagan, ✅ — to‘plam yopilgan.",
              "Zaxirani [xaritalar bo‘yicha avtoqidiruv](#prospect-maps) va saytlarni qo‘lda tekshirish to‘ldiradi. Zaxira bo‘sh — to‘plamlar ham bo‘sh.",
            ],
            admin: [
              "Siz to‘plam olmaysiz. Ish kunlari soat 07:00 da zaxiradagi kompaniyalar menejerlar va rahbarlarga teng tarqatiladi: haftalik reja ÷ 5 (2 dan 15 gacha), reja bo‘lmasa — 5. Avval — bahosi eng yomon saytlar.",
              "Xatlar fonda tayyorlanadi, 09:00 ga kelib to‘plam odamlarga Telegramda ketadi (matnlarning bir qismi tayyor bo‘lmasa ham, 10:00 dan kechikmay). 18:00 da bajarilmagani zaxiraga qaytadi, sizga esa hamma bo‘yicha hisobot keladi.",
              "Zaxirani [xaritalar bo‘yicha avtoqidiruv](#prospect-maps) va qo‘lda tekshiruvlar to‘ldiradi. Hisobotda bo‘sh to‘plamlar ko‘rinsa — zaxirada kompaniyalar tugagan: yangi kampaniya oching.",
            ],
          },
        },
        {
          id: "plan",
          title: "Haftalik aloqalar rejasi",
          body: {
            manager: [
              "Rejani rahbaringiz yoki egasi qo‘yadi — odam o‘ziga reja qo‘ymaydi. U bo‘lim tepasida va bosh sahifada qator bo‘lib ko‘rinadi: «До плана осталось 12 — сделано 18 из 30 за эту неделю».",
              "Dushanbadan (Toshkent vaqti bilan 00:00) beri siz yozgan kompaniyalar hisoblanadi: «Отправить» tugmasini bosgansiz yoki «Связался сам» deb belgilagansiz. Bitta kompaniya — bitta aloqa. Bot xati ketmagan bo‘lsa («не ушло»), aloqa hisobga olinmaydi.",
              "«Связаться» — hali aloqa emas: bu faqat xatni tayyorlash.",
            ],
            head: [
              "Menejerlaringizga rejani [«Команда»](/admin/team) bo‘limida, «План касаний» ustunida qo‘yasiz: haftasiga son va «сохранить». Bo‘sh maydon — «без плана», bu 0 bilan bir xil emas: 0 bo‘lsa, to‘plam umuman bo‘lmaydi. 500 dan ko‘p emas.",
              "Odam dushanbadan beri yozgan kompaniyalar hisoblanadi: «Отправить» yoki «Связался сам»; ketmagan xatlar hisoblanmaydi.",
              "Sizning o‘z rejangizni egasi qo‘yadi.",
            ],
            admin: [
              "Reja [«Команда»](/admin/team) bo‘limida, «План касаний» ustunida qo‘yiladi: siz — istalgan odamga, rahbar — faqat o‘z odamlariga. Bo‘sh maydon — «без плана» (kuniga 5 tadan to‘plam), 0 — reja ham, to‘plam ham yo‘q.",
              "Odam dushanbadan beri yozgan kompaniyalar hisoblanadi: «Отправить» yoki «Связался сам»; ketmagan xatlar hisoblanmaydi.",
            ],
          },
        },
        {
          id: "send",
          title: "Kompaniyaga yozish: «Связаться» va «Отправить»",
          body: [
            "Sayt kartochkasida **«Связаться»** tugmasini bosing: panel saytni qaytadan ko‘rib chiqadi (bir daqiqagacha) va xat yozadi. Bu hali aloqa hisoblanmaydi.",
            "Xatni o‘qing va odamga moslab tuzating. Keyin **«Отправить в @адрес»** — xat ishchi akkaunt navbatiga turadi. Shu daqiqadan lid ochilgan va sizga biriktirilgan, aloqa esa hisobga olingan.",
            "Yuborishdan oldin panel xatni tekshiradi va nima noto‘g‘riligini yozadi: 40–200 so‘z; sayt manzili va devuz.studio bor; tekshiruvda yo‘q raqamlar yo‘q; «в топ», «гарантирую», «первое место», foizlar va emodzilar yo‘q; qidiruvda ko‘rinish va yo‘qotishlar, agar bo‘lsa, aytilgan.",
            "Har qanday xodim istalgan kartochkani tayyorlab, yubora oladi — kartochka bosgan odamga biriktiriladi. Shuning uchun [kunlik to‘plamdan](#prospect-portion) boshlang: u yerda kompaniyalar allaqachon bo‘lingan.",
          ],
        },
        {
          id: "queue",
          title: "Ishchi akkaunt navbati: soatiga ikki xat",
          body: [
            "Yangi kompaniyaga birinchi xatni ishchi akkaunt soatiga ikkitadan ko‘p emas va 8–20 daqiqa tanaffus bilan yuboradi. Aks holda Telegram bizni ommaviy tarqatma deb hisoblab, akkauntni cheklaydi — skaut esa chatlarni aynan shu akkaunt bilan o‘qiydi, va biz ikkala kanalni birdan yo‘qotardik.",
            "Ro‘yxat ustida: «За последний час ушло 1 из 2 · в очереди 3». Navbatdagi kartochkada — taxminan necha daqiqadan keyin ketishi.",
            "Kutish shart emas: yozishmani o‘z akkauntingizdan oching, o‘sha matnni yuboring va **«Связался сам»** tugmasini bosing — bot o‘z nusxasini endi yubormaydi, mijoz javobi esa shaxsan sizga keladi.",
          ],
        },
        {
          id: "self",
          title: "«Связался сам» (Telegramda — «Написал сам»)",
          body: [
            "O‘zingiz yozganingiz yoki qo‘ng‘iroq qilganingizda bosing — o‘z akkauntingizdan, WhatsApp orqali, telefonda. Maydonga qisqacha: nima orqali va qanday («shaxsiy Telegram», «qo‘ng‘iroq»).",
            "Nima bo‘ladi: aloqa sizga hisoblanadi, sizga lid ochiladi, kartochka «отправлено» bo‘ladi va ikkinchi hamkasb o‘sha odamga endi yozmaydi. Belgisiz bularning hech biri yo‘q: panel uchun siz hech kimga yozmagansiz.",
            "«Связался сам» bosilgandan keyin yozishma siz orqali boradi: bot qayta yozmaydi va javoblarni ko‘rmaydi. Mijoz javobini kartochkaga ko‘chirish mumkin — [qo‘lda yozish](#prospect-manual) bandi.",
          ],
        },
        {
          id: "manual",
          title: "«Писать руками»: Telegramsiz telefon",
          body: [
            "Kompaniyada statsionar raqam bo‘lsa yoki skaut uni Telegramda topmagan bo‘lsa, kartochka «писать руками» bo‘ladi, Telegramga esa «Кому: … — только звонок или WhatsApp» keladi.",
            "Tugmalar: **«Открыть WhatsApp с готовым текстом»**, **«Позвонить»**, **«Скопировать текст»**. Yozdingiz yoki qo‘ng‘iroq qildingiz — **«Связался сам»** deb belgilang.",
            "Mijoz WhatsApp’da javob berdi — uning javobini «Что ответил клиент» maydoniga qo‘ying va **«Записать ответ»** tugmasini bosing. Model keyingi javobni yozadi, u kartochkada «Скопировать ответ» va «Открыть WhatsApp с ответом» tugmalari bilan chiqadi. O‘zimizning xatimizni u yerga qo‘yib bo‘lmaydi — panel buni sezadi.",
            "Yozmaydigan bo‘lsangiz — sababi bilan «не пишем».",
          ],
        },
        {
          id: "replies",
          title: "Mijoz javob berdi: kim javob beradi",
          body: [
            "Ishchi akkaunt xatlariga model javob beradi — bir necha daqiqadan keyin, darhol emas (darhol javob robotga o‘xshaydi), studiya nomidan, «biz» deb. Uning har bir javobi bitta aniq qadam bilan tugaydi; biror narsa yuborishni va’da qilish unga taqiqlangan.",
            "Model **sizni chaqiradi**, agar mijoz: rad etsa («yozmang», «qiziq emas»); odam yoki qo‘ng‘iroq so‘rasa; **tahlil, tijoriy taklif, smeta yoki fayl yuborishni so‘rasa** — unda o‘sha kuniyoq o‘zingiz yuboring; qisqa va tushunarsiz javob bersa. Yana — suhbat 12 replikadan beri davom etib, kelishuvga kelmasa yoki uning javobi tekshiruvdan o‘tmasa.",
            "Chaqirdi — sizga Telegramda sabab, mijoz so‘zlari va lid havolasi bilan «Касание · сайт» keladi. Lid kartochkasida «Первичка по касанию» bloki: «отвечает ИИ» yoki «отвечаете вы — причина». **«Отвечать самому»** tugmasi suhbatni istalgan paytda modeldan olib qo‘yadi: keyin model jim turadi, mijozning har bir yangi xabari esa sizga Telegramda keladi — «Клиент написал — отвечаете вы», lid havolasi bilan. Tugmani bosgan odamga keladi, hatto u rahbar yoki ega bo‘lsa ham. Lid har holda sizniki.",
            "Model vazifa, byudjet va muddatlarni aniqlab olgach, xayrlashadi, sizga esa «Первичка по касанию · сайт» brifi keladi. Keyingi suhbat sizniki.",
            "⚠️ O‘zingiz javob berayotgan bo‘lsangiz, mijozning yangi oddiy xabarlari Telegramda sizga kelmaydi — yozishmaga o‘zingiz qarab turing.",
          ],
        },
        {
          id: "followups",
          title: "Qayta yozish: mijoz jim bo‘lsa",
          body: [
            "Ishchi akkaunt xatiga javob berilmasa, bot o‘zi 3 kundan keyin ikkinchi xabarni (boshqa topilma va «Siz uchun dolzarbmi?» savoli), 7 kundan keyin esa uchinchi, oxirgisini yozadi — suhbatni xushmuomalalik bilan yopadi. Undan keyin yozmaymiz.",
            "Faqat ish kunlari Toshkent vaqti bilan 10:00 dan 17:00 gacha: notanish studiyadan soat 23:00 da kelgan xabar — shikoyat qilishga sabab. Bir oydan eski aloqalarga qayta yozilmaydi.",
            "Qayta yozish faqat bot orqali ketgan xatlar uchun ishlaydi. «Связался сам» bosilgandan keyin va qo‘lda yoziladigan kartochkalarda o‘zingizni eslatib turish — sizning ishingiz.",
          ],
        },
        {
          id: "numbers",
          title: "Kartochkadagi raqamlarni qanday o‘qish",
          body: [
            "**«поиск 84»** — saytni Google va Yandexda topish qanchalik oson, 0 dan 100 gacha. 80 va undan yuqori — joyida, 50–79 — tuzatadigan joyi bor, 50 dan past — yomon topiladi, 10 gacha — sayt qidiruvdan yopilgan.",
            "**«−24…48»** — saytni allaqachon ochgan va yozish yoki qo‘ng‘iroq qilishga tayyor bo‘lgan har yuz kishidan nechta murojaat yo‘qolishi. Bu topilgan muammolar bo‘yicha bizning bahomiz (narxlar yo‘q, telefon bosilmaydi, telefondan o‘qilmaydi), mijozning statistikasi emas — shunday deb ayting. Qidiruvga aloqasi yo‘q.",
            "**Oxirgi raqam** — umumiy baho: yuzdan har bir o‘ta jiddiy topilma uchun 25, jiddiy uchun 12 va mayda uchun 5 ayriladi. 60 dan past — sariq, 0 — sayt ochilmagan.",
            "**Topilma belgilari**: qizil ramka — o‘ta jiddiy, tilla rang — jiddiy, kulrang — mayda. Suhbatni texnik topilmadan emas, mijozlar va pul haqidagi topilmadan boshlang.",
            "**Holatlar**: «не писали», «сообщение готово», «в очереди на отправку», «отправлено», «писать руками», «не ушло» (bot yetkazmadi — kartochkani oching), «пропущен». Xuddi shu narsa — ro‘yxat ustidagi yig‘ilgan «Как читать цифры» blokida.",
          ],
        },
        {
          id: "own-list",
          title: "O‘z saytlar ro‘yxatingizni tekshirish",
          body: [
            "Tepadagi blok: manzillarni «Список сайтов — по одному в строке» maydoniga qo‘ying (yoniga kompaniya nomini yozsa ham bo‘ladi) va **«Проверить»** tugmasini bosing. Bir martada — 200 tagacha manzil; saytlar beshtadan, birin-ketin tekshiriladi — o‘ntasiga birdan murojaat qilmaslik uchun.",
            "Natija umumiy ro‘yxatga darhol saqlanadi. Hech qanday kamchiligi yo‘q saytlar saqlanmaydi: yozadigan narsa yo‘q, bahona o‘ylab topish kerak emas. Allaqachon kiritilgan sayt takrorlanmaydi.",
            "Saytsiz kompaniyalar: «У компании нет сайта» ni belgilang, nishani va nomlarni har qatorga bittadan yozing — «Добавить». Ularga xat nishadan kelib chiqib yoziladi, bog‘lanish esa telefon yoki Telegram orqali, agar ma’lum bo‘lsa.",
            "«Язык письма» faqat jadvaldagi qoralamaga ta’sir qiladi. «Связаться» tugmasi yozadigan xat sayt tilida bo‘ladi.",
          ],
        },
        {
          id: "skip",
          title: "«не пишем» va «✖ Не подходит»",
          body: [
            "Har bir topilmaga yozish shart emas: sayt davlatniki, kompaniya yopilgan, bu tanishingiz. «не пишем» tugmasini bosing va nima uchunligini qisqa tushuntiring — kartochka «пропущен» bo‘ladi va boshqa hech kimga tushmaydi.",
            "Kunlik to‘plamda ham xuddi shunday — Telegramdagi «✖ Не подходит» tugmasi. Bunday kompaniya «не сделано» emas, «не подошла» deb hisoblanadi.",
          ],
        },
        {
          id: "maps",
          title: "Xaritalar bo‘yicha kompaniyalarni avtoqidirish",
          roles: ["head", "admin"],
          body: {
            head: [
              "Kampaniyalarni siz va egasi ochasiz: **nisha va shahar** (masalan, «stomatologiya», «Toshkent») → «Искать». Studiyaga qaysi nishalar kerakligini hal qilish — sizning ishingiz: har bir kampaniya — pullik API’ga so‘rovlar va zaxirada yuzlab kompaniyalar. Bir shahardagi bir xil nisha ikkinchi marta ochilmaydi — panel allaqachon ochilganini ko‘rsatadi.",
              "Har kuni soat 06:00 da tizim Google Maps’da kompaniyalarni qidiradi — har kampaniyaga natijalarning uch sahifasigacha, Toshkent uchun yana tumanlar bo‘yicha ham. Topilganlar fonda bir o‘tishda beshta saytdan tekshiriladi: saytli kompaniya zaxiraga faqat saytda yozadigan narsa bo‘lsa tushadi; saytsiz — xaritadagi telefoni bilan. Yopilgan kompaniyalar va sayt o‘rniga ijtimoiy tarmoq ko‘rsatilganlar o‘tkazib yuboriladi.",
              "Kampaniya qatorida: «найдено N · в пуле M». «выдача исчерпана» — yangi nisha ochish vaqti keldi. «искать сейчас» — ertalabni kutmaslik; «пауза» / «возобновить».",
              "Chegara — kuniga 25 ta so‘rov, har birida 20 tadan kompaniya. Avtoqidiruvni egasi ulaydi: blokda «Не подключено» yozilgan bo‘lsa, unga ayting.",
            ],
            admin: [
              "Kampaniya — **nisha va shahar** → «Искать». Har kuni soat 06:00 da (dam olish kunlari ham) tizim Google Maps orqali kompaniyalarni qidiradi: har kampaniyaga uch sahifagacha, Toshkent uchun — butun shahardan keyin 12 ta tuman bo‘yicha. Topilganlar fonda tekshiriladi, bir o‘tishda beshta saytdan; zaxiraga yozadigan narsasi bor saytlar va saytsiz kompaniyalar — xaritadagi telefoni bilan tushadi. Bir shahardagi bir xil nisha ikkinchi marta ochilmaydi.",
              "Chegara — kuniga 25 ta so‘rov (`MAPS_DAILY_REQUESTS`), bu oyiga taxminan 750 ta — Google’ning bepul mingtaligi ichida. Bitta so‘rov — 20 tagacha kompaniya.",
              "Bir marta ulash: Google Cloud → «Places API (New)» ni yoqing va to‘lov kartasini bog‘lang → «Credentials» → faqat Places API (New) bilan cheklangan «API key» → `/opt/devuz/.env` fayliga `GOOGLE_PLACES_API_KEY=kalit` yozing va `docker compose up -d` (yoki keyingi yangilanish chiqishini kuting). Hozir kalit Supabase maxfiy ma’lumotlar omborida turibdi (Vault, nomi `app.GOOGLE_PLACES_API_KEY`): `.env`da kalit bo‘lmasa, panel uni o‘sha yerdan oladi.",
            ],
          },
        },
      ],
    },

    /* ── Надзор ───────────────────────────────────────────────────────── */
    "/admin/talks": {
      what: "Sovuq aloqalar bo‘yicha yozishmalar tahlili. Har bir tinchigan suhbatni ikkinchi model — uni olib borgani emas — o‘qiydi va javob beradi: mijozni nima qiziqtirdi, qanday e’tiroz bo‘ldi, nimada uzildi va bundan qanday saboq chiqadi. Saboq keyingi xatni yozadigan odamga kerak.",
      items: [
        {
          id: "when",
          title: "Tahlil qachon paydo bo‘ladi",
          body: [
            "Mijozning oxirgi javobidan taxminan bir soat o‘tib. Agar mijoz keyin yana yozsa — suhbat qaytadan tahlil qilinadi va eski tahlil yangisiga almashadi.",
            "Faqat mijoz kamida bir marta javob bergan aloqa yozishmalari tahlil qilinadi. Saytdagi va botdagi chatlar bu yerga tushmaydi.",
          ],
        },
        {
          id: "read",
          title: "Qatorni qanday o‘qish",
          body: [
            "Natija: «отказался», «позвал человека», «первичка закрыта», «разговор заглох» yoki «ещё идёт». «Разговор заглох» — qolgan hammasi: jimlik, fayl yuborish so‘rovi, tushunarsiz javob.",
            "Yashil rangda — saboq. Pastroqda — «Зацепило», «Возражение», «Сломалось». «Разговора мало — вывод слабый» mijoz ikkitadan kam xabar yozganini bildiradi: bitta replikadan xulosa chiqarilmaydi, u yerda saboq yo‘q.",
            "Tepadagi plitkalar: nechtasi tahlil qilingan, nechta saboq mijoz so‘zlariga tayangan, rad etishlar va o‘zbek tilidagi suhbatlar soni.",
          ],
        },
        {
          id: "use",
          title: "Bu bilan nima qilish kerak",
          body: {
            manager: [
              "To‘plamdagi xatlarni tuzatishdan oldin yangi saboqlarni o‘qing: odamlarni nima qiziqtiradi va suhbatlar nimada uziladi. Saboqlar hozircha xatlarga o‘zi qo‘shilmaydi — buni bir necha o‘nlab javob yig‘ilganda egasi hal qiladi.",
              "«лид →» bu suhbat bo‘yicha lidni ochadi, agar u sizniki bo‘lsa.",
            ],
            head: [
              "Saboqlarni jamoa bilan muhokama qiling: qaysi gaplar mijozni qiziqtiradi, qaysi e’tirozlarda suhbat uziladi. Xatlarga ular hozircha o‘zi qo‘shilmaydi — buni bir necha o‘nlab javob yig‘ilganda egasi hal qiladi.",
            ],
            admin: [
              "Saboqlar hozircha faqat to‘planadi va xatlarga qo‘shilmaydi. Ularni birinchi xat promptiga qo‘shish — sizning qaroringiz, uni bir necha o‘nlab javob yig‘ilganda qabul qilish kerak.",
            ],
          },
        },
      ],
    },

    /* ── Кандидаты ────────────────────────────────────────────────────── */
    "/admin/candidates": {
      what: "Suhbatdan oldin rezyumeni tahlil qilish. PDF yuklaysiz va qaysi ish uchun qarayotganimizni yozasiz — panel xulosa, kuchli tomonlar, to‘xtatuvchi belgilar va berish kerak bo‘lgan savollarni ko‘rsatadi. Faqat rahbarlar va egasi ko‘radi: tahlillarda begona odamlarning shaxsiy ma’lumotlari va odam haqidagi qaror bor.",
      items: [
        {
          id: "upload",
          title: "Rezyume yuklash",
          body: [
            "«На какую работу смотрим» maydoni — vakansiyani yozing (odatiy — sotuv menejeri). Keyin «Резюме в PDF» va **«Разобрать»**. Tahlil bir daqiqagacha davom etadi.",
            "Matni nusxalanadigan, 8 MB gacha PDF kerak; birinchi 12 sahifa o‘qiladi. Skan yoki rasmlar o‘qilmaydi — panel shunday deb aytadi.",
          ],
        },
        {
          id: "result",
          title: "Tahlilda nima bor",
          body: [
            "Xulosa: «брать», «брать с условием» yoki «не брать» — va nima uchun. Keyin: «Сильные стороны», «Стопы», «Что в резюме сказано прямо», «Спросить на собеседовании» (har bir to‘xtatuvchi belgiga savol) va «Как проверить делом» — bir kunlik pullik sinov kuni uchun topshiriq.",
            "Tahlil — suhbatga tayyorgarlik, hukm emas. Qaror sizniki.",
          ],
        },
        {
          id: "privacy",
          title: "Shaxsiy ma’lumotlar",
          body: [
            "Fayl hech qayerda saqlanmaydi — faqat ism, lavozim, xulosa va tahlilning o‘zi qoladi. «Убрать разбор» tugmasi uni butunlay o‘chiradi.",
            "Yosh, jins, oilaviy holat, millat, din, tashqi ko‘rinish va tug‘ilgan joy bahoda qatnashmaydi. Agar tahlil baribir ularga tayangan bo‘lsa, u saqlanmaydi: «Разбор опёрся на то, что к работе не относится… попробуйте ещё раз».",
            "Har bir tahlil va o‘chirish jurnalga yoziladi.",
          ],
        },
      ],
    },

    /* ── Проекты ──────────────────────────────────────────────────────── */
    "/admin/projects": {
      what: "Kelishib bo‘lingan ish: qaysi bosqichda, qaysi muddatgacha, qancha summaga, kim olib boradi va mijoz qancha to‘lagan. «Финансы» bo‘limidagi hisoblanmalar loyihaga bog‘liq: summasi bor loyiha bo‘lmasa, bitim uchun hech kim pul olmaydi.",
      items: [
        {
          id: "create",
          title: "Loyiha ochish",
          body: {
            manager: [
              "Mijoz ishlashga rozi bo‘ldi — loyiha oching: «Новый проект» bloki, nomi, mijoz, summa, muddat va «Создать».",
              "**Kim ochsa, o‘sha mas’ul bo‘ladi.** Hisoblanmalar mas’ulga yoziladi, uni esa faqat egasi almashtira oladi — shuning uchun o‘z loyihangizni o‘zingiz oching, hamkasbdan so‘ramang.",
              "Ro‘yxat: «N дн. на этой стадии», «ведёт …», «срок …» va muddat o‘tgan bo‘lsa «просрочен». «показать закрытые» — tugallangan va bekor qilinganlar.",
            ],
            head: [
              "Loyihani istalgan odam ochadi — va kim ochsa, o‘sha mas’ul bo‘ladi. Hisoblanmalar mas’ulga yoziladi (sizga esa jamoangiz loyihalaridan 5%), mas’ulni esa faqat egasi almashtira oladi. Menejerlar o‘z loyihalarini o‘zlari ochishini kuzating.",
              "Ro‘yxat hamma uchun umumiy: bosqich, undagi kunlar, mas’ul, muddat va «просрочен».",
            ],
            admin: [
              "Loyihani ochgan xodim o‘zi mas’ul bo‘ladi. Siz ochganingizda birinchi maydonda **kim olib borishini** tanlang: hisoblanmalar unga yoziladi. O‘zingizni tanlasangiz — loyiha bo‘yicha jamoaga hisoblanma bo‘lmaydi, egasi foiz emas, qoldiqni oladi. Mas’ulni istalgan paytda almashtirish mumkin: [«Данные проекта»](#projects-data) → «Ведёт»; siz olib borayotgan loyiha kartochkasida sariq eslatma turadi.",
              "Ro‘yxatda loyiha bosqichda necha kun turgani va muddati o‘tgan-o‘tmagani ko‘rinadi.",
            ],
          },
        },
        {
          id: "stages",
          title: "Bosqichlar",
          body: [
            "Tartib bilan: «бриф» → «договор» → «дизайн» → «разработка» → «приёмка» → «запуск» → «поддержка». Alohida: «на паузе», «закрыт», «отменён».",
            "Bosqichni faqat egasi o‘zgartiradi: bosqich — mijozga berilgan va’da, ijrochining kayfiyati haqidagi belgi emas. Har bir o‘zgarish jurnalga loyiha oldingi bosqichda necha kun turgani bilan birga yoziladi.",
            "Pulga faqat «отменён» ta’sir qiladi — unda hisoblanmalar «не начисляются». «Закрыт» va «отменён» yana mas’ulga summani tahrirlashni ham yopadi.",
          ],
        },
        {
          id: "card",
          title: "Loyiha kartochkasi",
          body: {
            manager: [
              "Tepadan pastga: «Стадия», «Смета», «Деньги», «Данные проекта», «Договор».",
              "**«Смета»** — toifani va muddatni haftalarda tanlang, panel «не ниже» (chegara), «до» va muddatni hisoblaydi. Chegara — bundan past summada loyiha o‘zini oqlamaydi; undan pastga faqat egasi tusha oladi.",
              "**«Деньги»**: «Вид сделки» — «новый клиент» yoki «допродажа» (foizingiz shunga bog‘liq, [«Финансы»](/admin/finance) bo‘limiga qarang) va «Сумма по договору». Butun dollarda yozing, «$» va sentlarsiz, aks holda maydon tozalanadi. Loyiha bo‘yicha birorta to‘lov bo‘lmaguncha summani siz tahrirlaysiz; keyin — faqat egasi.",
              "Soliq va tannarxni shartnomadan keyin egasi yozadi. Mijoz to‘lovlarini ham egasi yozadi — va faqat shundan keyin hisoblanmalaringiz muzdan chiqadi. Shartnoma hisobi bo‘yicha to‘lov egasi uni tasdiqlaganda bu yerga o‘zi tushadi; ungacha «Платежи клиента» blokida sariq qator turadi: «платёж ещё не подтверждён».",
              "**«Данные проекта»** — nomi, mijoz, muddat, izohlar; ularni siz mas’ul sifatida tahrirlaysiz. **«Договор»** — loyiha shartnomasiga havola va u hozir qayerda: qoralama, egasida imzoda, tasdiqlangan, imzolangan. Shartnoma yo‘q ekan — uni tayyorlash formasi; tayyorlanmasa, forma ustida nimani tuzatish kerakligi yoziladi. Batafsil — [shartnomalar](/admin/contracts).",
            ],
            head: [
              "Bloklar: «Стадия», «Смета», «Деньги», «Данные проекта», «Договор». Siz istalgan loyiha kartochkasini ko‘rasiz; pulni — o‘z loyihalaringiz va jamoa loyihalari bo‘yicha.",
              "Smeta va summani loyiha mas’uli va egasi tahrirlaydi — siz jamoa loyihalarida ularni faqat ko‘rasiz. Summa — butun dollarda; birinchi to‘lovdan keyin uni faqat egasi o‘zgartiradi.",
              "Hisoblanma qatorlari: daraja bo‘yicha mas’ul va siz — jamoa loyihalaridan «руководитель · 5%» (muassisda bu qator 0).",
            ],
            admin: [
              "Siz hammasini tahrirlaysiz: bosqich (10 ta tugma), smeta, summa va bitim turini istalgan paytda, **«Налог, %»** (odatiy 4) va **«Себестоимость разработки, $»** — faqat siz, hech kim tannarxni kamaytirib, o‘z hisoblanmasini oshirmasligi uchun.",
              "Hisoblanma qatorlarida — shu bitim uchun foiz: «задать» yoki «по грейду» ga qaytarish. **«Партнёр»** bloki: kim olib kelgan, hamkorga foiz («по ступени» — 20%, uchta to‘langan loyihadan keyin 25%) va «Не засчитывать, причина».",
              "**«Платежи клиента»** → «Записать платёж»: summa, sana, maqsad. Hammasi to‘langanda hisoblanmalar «заработано» bo‘ladi, hamkorga esa xabar ketadi. Shartnoma hisoblari bo‘yicha to‘lovlar bu yerga o‘zi yoziladi — sizning «Оплачен» belgingizdan yoki shartnomadagi «Подтвердить платёж» tugmasidan; to‘lov sizni kutayotgan paytda bu yerda shartnomaga havolali sariq qator turadi. Kartochkadagi «Остаётся владельцу» — hamkor ulushi ayirilmagan; aniq raqam — [«Финансы»](/admin/finance) bo‘limida.",
            ],
          },
        },
        {
          id: "data",
          title: "«Данные проекта»",
          body: [
            "Nomi, mijoz, muddat va izohlarni loyiha mas’uli, uning rahbari va egasi tahrirlaydi; qolganlar ularni formasiz ko‘radi. Mas’ulni faqat egasi almashtiradi — «Ведёт» maydoni: hisoblanmalar mas’ulga bog‘liq va xodim loyihani boshqa odamga yozib qo‘ya olmaydi.",
            "Summa endi bu yerda tahrirlanmaydi — u «Деньги» blokida.",
          ],
        },
      ],
    },

    /* ── Статистика ───────────────────────────────────────────────────── */
    "/admin/stats": {
      what: "Butun studiya bo‘yicha raqamlar: qancha murojaat keladi, qayerdan, qanday sifatda, qanchasini yutamiz va lidlarni qanchalik tez ishga olamiz. Haftada bir marta mijozlarni qayerda yo‘qotayotganimizni ko‘rish uchun kerak.",
      items: [
        {
          id: "tiles",
          title: "Asosiy raqamlar",
          body: [
            "**«всего лидов»**, **«взято в работу»** — hozir nechtasining mas’uli bor.",
            "**«доля выигранных»** — yutilganlar ÷ (yutilganlar + yutqazilganlar). Yopilgan bitimlardan hisoblanadi: hali ishdagisi yutqazilmagan. Shuning uchun lidni tashlab qo‘ymasdan, «проиграли» holatini qo‘yish muhim.",
            "**«медиана до взятия»** — murojaatdan «Взять себе» gacha odatda qancha vaqt o‘tadi. O‘rtacha emas, mediana: dam olish kunlari yotib qolgan bitta lid manzarani buzmaydi. Lidni berish bu vaqtni nolga tushiradi.",
          ],
        },
        {
          id: "panels",
          title: "Pastdagi panellar",
          body: [
            "«Приходит по неделям» — 12 hafta, hafta dushanbadan. «Качество лидов» — A–D harflari bo‘yicha. «Статусы». «Откуда приходят» — chat, forma, bot, vitrina, skaut, aloqalar. «Язык обращения». «Что спрашивают» — bitta lid bir necha qatorda bo‘lishi mumkin. «Скидка за несработавшую гарантию» — har bir shunday chegirma — chekning 30%.",
          ],
        },
        {
          id: "people",
          title: "Odamlar bo‘yicha jadval",
          body: {
            manager: [
              "Odamlar bo‘yicha jadvalni siz ko‘rmaysiz — uni rahbar va egasi ko‘radi. Hamkasb ismi yonidagi ochiq reyting natijadan oldin xulqni o‘zgartiradi: lidlarni muhimligiga qarab emas, osonligiga qarab olishni boshlashadi. O‘z raqamlaringizni [bosh sahifada](/admin) ko‘ring: plitkalar va «План и факт».",
            ],
            head: [
              "«По моей команде» — siz va menejerlaringiz: «В работе», «Выиграл», «Проиграл», «Всего» — butun vaqt uchun, lid hozir kimga biriktirilganiga qarab. Menejerlar bu jadvalni ko‘rmaydi.",
            ],
            admin: [
              "«По менеджерам» — barcha faol xodimlar, butun vaqt uchun, lid hozir kimga biriktirilganiga qarab. Rahbar faqat o‘zini va jamoasini ko‘radi, menejerlar jadvalni umuman ko‘rmaydi.",
            ],
          },
        },
        {
          id: "plans",
          title: "Rejalar qayerda",
          body: {
            manager: [
              "Bu yerda rejalar yo‘q. «План и факт» — [bosh sahifada](/admin), aloqalar rejasi — [«Касания»](/admin/prospect) bo‘limida.",
            ],
            head: [
              "Bu yerda rejalar yo‘q. «План и факт» — [bosh sahifada](/admin), jamoaga aloqalar rejasi [«Команда»](/admin/team) bo‘limida qo‘yiladi.",
            ],
            admin: [
              "Bu yerda rejalar yo‘q. «План и факт» — [bosh sahifaning](/admin) «Команда» varag‘ida, aloqalar rejasi — [«Команда»](/admin/team) bo‘limida.",
            ],
          },
        },
      ],
    },

    /* ── Трафик ───────────────────────────────────────────────────────── */
    "/admin/traffic": {
      what: "devuz.studio saytiga qancha odam kiradi, ular qayerdan keladi va qaysi sahifadan boshlaydi — Yandex Metrika va Google Analytics bo‘yicha. Reklama va e’lonlar ishlayaptimi, shuni ko‘rish uchun kerak: lidlar saytdan keladi, saytga kirish kamaysa, bir-ikki haftadan keyin lidlar ham kamayadi. Egasi va rahbarlar ko‘radi, menejerlar — yo‘q.",
      items: [
        {
          id: "numbers",
          title: "Raqamlar nimani bildiradi",
          body: [
            "O‘ng tepada — davr: **«7 дней»**, **«30 дней»** yoki **«90 дней»**. Har bir raqam yonidagi strelka — u oldingi xuddi shuncha kunga nisbatan qancha o‘sgani yoki tushgani: «30 дней»da — oldingi 30 kunga nisbatan. Yashil strelka — yaxshi, sariq — yomon, «новое» — oldin nol edi.",
            "**«визитов»** — saytga necha marta kirilgan: bitta odam ertalab va kechqurun — ikki tashrif. **«посетителей»** — nechta turli odam, aniqrog‘i turli brauzer: bitta odam telefondan va noutbukdan ikki marta hisoblanadi. **«просмотров»** — jami nechta sahifa ochilgan.",
            "**«отказов»** — odam bitta sahifani ochib, deyarli darhol chiqib ketgan tashriflar ulushi. Bu yerda teskari: rad etishlar o‘sishi — sariq strelka, bu yomon. **«ср. визит»** — tashrif o‘rtacha qancha davom etadi, daqiqa:soniya.",
            "Ustunlar — kunlar bo‘yicha tashriflar, ustunga sichqonchani olib borsangiz sana va son ko‘rinadi. **«Откуда приходят»** — qidiruvdan, ijtimoiy tarmoqlardan, reklamadan yoki to‘g‘ridan-to‘g‘ri havola orqali. Metrikada nomlar ruscha, Google’da inglizcha: «Organic Search» — qidiruv, «Direct» — to‘g‘ridan-to‘g‘ri kirish, «Referral» — boshqa saytlardan o‘tish, «Organic Social» va «Paid Social» — ijtimoiy tarmoqlar, «Paid Search» — qidiruvdagi reklama. **«Страницы входа»** — odam tashrifni qaysi sahifadan boshlagan.",
            "Raqamlar har 10 daqiqada yangilanadi: panel har ochilganda Metrika va Google’dan so‘ramaydi, shuning uchun hozirgina ishga tushirilgan reklama bu yerda darhol ko‘rinmaydi.",
          ],
        },
        {
          id: "two-sources",
          title: "Nega Metrika va Google har xil ko‘rsatadi",
          body: [
            "Metrika va Google Analytics yonma-yon turadi va qo‘shilmaydi. Har biri tashrifni o‘zicha hisoblaydi va robotlarni o‘zicha ajratadi, ba’zi odamlarning brauzerida esa ulardan biri bloklangan, ikkinchisi yo‘q. Shuning uchun raqamlar farq qiladi va bu normal: yig‘indi na u yerda, na bu yerda yo‘q raqam bo‘lardi.",
            "Aniq songa emas, yo‘nalishga qarang. Reklama ishga tushgandan keyin ikkalasi ham o‘sishni ko‘rsatsa — reklama odam olib kelyapti. Faqat bittasi o‘ssa — ehtimol gap odamlarda emas, hisoblashda.",
            "Saytga kirish — hali mijoz emas. Nechta odam yozgani [statistikada](/admin/stats), «Откуда приходят» blokida ko‘rinadi: u yerda murojaatlar, bu yerda tashriflar. Tashriflar ko‘paysa-yu, murojaatlar ko‘paymasa — odamlar keladi, lekin nima uchun kelganini topmaydi.",
          ],
        },
        {
          id: "connect",
          title: "Qanday ulanadi",
          body: {
            head: [
              "Egasi ulaydi: Metrika uchun serverda kalit, Google uchun — uning Google akkaunti bilan kirish kerak. Sizda ulash tugmalari yo‘q, faqat raqamlar — bu yerdan ulanishni buzib ham, almashtirib ham bo‘lmaydi.",
              "Kartochkada «Не подключено» yoki «Google перестал пускать по входу владельца» deb yozilgan bo‘lsa — egasiga ayting, unga bu bir daqiqalik ish. «Не ответил» — odatda vaqtinchalik: sahifani bir daqiqadan keyin yangilang, takrorlansa — yana egasiga.",
            ],
            admin: [
              "**Metrika** `YANDEX_METRIKA_TOKEN` tokeni bilan ulanadi (hisoblagich raqamini panel o‘zi biladi) — serverdagi `/opt/devuz/.env` faylida yoki Supabase maxfiy ma’lumotlar omborida (Vault) `app.YANDEX_METRIKA_TOKEN` nomi bilan: `.env`da kalit bo‘lmasa, panel uni o‘sha yerdan oladi.",
              "**Google Analytics** Google orqali kirish bilan ulanadi — kalitlarsiz va serverga kirmasdan. Google Cloud’da bir marta «mijoz» (client) yaratiladi — Google panelimizni taniydigan ruxsatnoma; qadamlari «Google Analytics» kartochkasining o‘zida yozilgan. Uning Client ID va Client secret qatorlari kartochkaga qo‘yiladi, keyin — **«Сохранить и войти через Google»**. Saytning Analytics’iga kirish huquqi bor Google akkaunti bilan kirish kerak va «See and download your Google Analytics data» belgisini olib tashlamaslik kerak. Resurs raqamini panel o‘zi topadi — sayt hisoblagichi `G-L52MCVNS0W` bo‘yicha. Olingan hamma narsa Supabase’ning shifrlangan maxfiy ma’lumotlar omborida saqlanadi, panelda esa faqat o‘qish huquqi bor: Analytics’da biror narsani o‘zgartira olmaydi. Har bir kirish [jurnalda](/admin/audit) ko‘rinadi.",
              "Agar Google kiritmay qo‘ysa — kartochkada «Google больше не пускает по сохранённому входу» deb yoziladi va bu **«Войти через Google»** tugmasi bilan hal bo‘ladi. Ko‘pincha sabab bitta: Google Cloud’dagi ilova e’lon qilinmagan — «Testing» rejimida Google kirishni 7 kundan keyin o‘chiradi, shuning uchun u yerda bir marta «Publish app» bosish kerak. Agar panel resurs raqamini o‘zi topa olmasa («Google Analytics Admin API» yoqilmagan yoki resurs boshqa akkauntda), uni yozishni so‘raydi: Google Analytics → «Администратор» → «Сведения о ресурсе», faqat raqamlar. Raqamlar ostidagi **«войти заново»** havolasi — Google akkauntini almashtirish uchun.",
              "Rahbarlar bu bo‘limni ko‘radi, lekin ulash qadamlarisiz, kirish tugmalarisiz va Google akkauntingiz pochtasisiz — ularning o‘rniga «Подключает владелец» deb yozilgan. Menejerlarga bo‘lim ko‘rinmaydi. Oldin «Трафик» bosh sahifadagi varaq edi — eski xatcho‘plar shu yerga olib keladi.",
            ],
          },
        },
      ],
    },

    /* ── Договоры ─────────────────────────────────────────────────────── */
    "/admin/contracts": {
      what: "YaTTimiz nomidan buyurtmachi bilan shartnoma. Jamoadagi har kim tayyorlaydi va tekshiradi, faqat egasi tasdiqlaydi — aynan shu paytda hujjatda uning imzosi paydo bo‘ladi. Keyin — bosqichlar bo‘yicha hisoblar va buyurtmachi uchun havola. Bu yerda shartnomalar ro‘yxati yo‘q: shartnoma loyiha kartochkasida turadi.",
      items: [
        {
          id: "prepare",
          title: "Shartnoma tayyorlash",
          body: [
            "[Loyihani](/admin/projects) oching → «Договор» bloki. To‘ldiring: sana, summa, buyurtmachining to‘liq nomi, manzili va kontakti, STIR yoki JShShIR, bank, hisob raqami (20 raqam), MFO (5 raqam), shartnoma predmeti va bosqichlar. **Bosqichlar ulushlari yig‘indisi — roppa-rosa 100%**. **«Подготовить договор»** tugmasini bosing.",
            "Natijada DU-2026-07 ko‘rinishidagi raqamli qoralama chiqadi. Qoralamada imzo hujjatda jismonan yo‘q — uni chop etib, imzolangan deb ko‘rsatib bo‘lmaydi.",
            "Smeta chegarasidan past summani tayyorlab bo‘lmaydi — buni faqat egasi hal qiladi. Bosgandan keyin hech narsa chiqmasa, maydonlarni tekshiring: panel hozircha qaysi biri noto‘g‘riligini yozmaydi.",
          ],
        },
        {
          id: "review",
          title: "Shartnoma sahifasi: smeta va imzoga yuborish",
          body: {
            manager: [
              "Shartnoma qoralama ekan: **«Загрузить смету»** va **«Срок»** («60 рабочих дней с даты аванса»). Smeta Excel (xlsx), CSV, TSV va matnli PDF dan qatorma-qator o‘qiladi: panel ustunlarni sarlavha bo‘yicha topadi («Наименование», «Кол-во», «Цена», «Сумма»), «Итого» qatorini o‘tkazib yuboradi, qatorlar yig‘indisi esa shartnoma summasiga aylanadi. PDF skan yoki Word’ni o‘qib bo‘lmaydi — unda **«Вставить строки сметы руками»**: qatorlarni Excel’dan nusxalang yoki har bir pozitsiyaga bitta qator yozing — nomi, soni, narxi «;» orqali. Smeta qatorlarisiz shartnomani imzoga yuborib bo‘lmaydi.",
              "**«Отправить на подпись»** — panel hammasi joyidami tekshiradi, bo‘lmasa «Не хватает: …» deb yozadi. Yubordingiz — egasiga Telegramda xabar bordi, shartnoma «Отправлен владельцу на подпись» holatida va boshqa tahrirlanmaydi.",
              "Egasi tasdiqlasa — «Подтверждён владельцем», yoki qayta ishlashga qaytaradi. Tasdiqlangandan keyin mijoz o‘z qismini imzolaydi, siz esa **«Загрузить подписанный»** tugmasini bosasiz (PDF yoki rasm) — shartnoma «Подписан обеими сторонами» bo‘ladi.",
              "Telegram bildirishnomani yetkazmasa, panel shuni aytadi — egasiga og‘zaki ayting.",
            ],
            head: [
              "Siz ham menejer qiladigan ishni qilasiz: smeta (Excel, CSV, matnli PDF yoki qo‘lda qatorlar — qatorlarsiz yuborib bo‘lmaydi), «Срок», «Отправить на подпись», «Загрузить подписанный», hisoblar va buyurtmachi uchun havola. Shartnomani faqat egasi tasdiqlaydi, qaytaradi va bekor qiladi — tasdiqlash uning imzosining o‘zi.",
            ],
            admin: [
              "Imzoga shartnoma sizga Telegramda keladi va «Сегодня» varag‘ida — «Договоры на подпись» blokida ko‘rinadi. Tugmalar: **«Подтвердить и подписать»** yoki **«Вернуть на доработку»**. Qaytarish — ishning oddiy qismi, xato emas.",
              "Tasdiqlash imzongizni qo‘yadi va **birinchi bosqichga darhol hisob chiqaradi**. Tasdiqlangan shartnomani bekor qilish — «Причина отмены» va «Отменить»: shartnomalar o‘chirilmaydi, faqat belgilanadi. Tasdiqlangani tahrirlanmaydi — tuzatish kerak bo‘lsa, yangisi tayyorlanadi.",
              "Imzolar bilan skan yuklangandan keyin shartnoma ekranida imzongiz boshqa ko‘rinmaydi — u allaqachon skanda bor.",
            ],
          },
        },
        {
          id: "invoices",
          title: "Bosqichlar bo‘yicha hisoblar va buyurtmachi uchun havola",
          body: {
            manager: [
              "Har bir bosqich oldindan, narxining 100% to‘lanadi. Birinchi bosqichga hisob tasdiqlashda o‘zi chiqadi, keyingilari — **«Выставить счёт»** tugmasi bilan. To‘lov muddati — 14 kun. Pul keldi — **«Оплачен»**: to‘lovni bankda ko‘rgan odam belgilaydi.",
              "Belgingizdan keyin egasiga Telegram’da xabar keladi. U «Подтвердить платёж» tugmasini bosadi — va to‘lov [loyihada](/admin/projects) to‘lov bo‘lib yoziladi: pulga tushadi va shu bo‘yicha hisoblanmalaringiz muzdan chiqadi. U tasdiqlamaguncha hisob yonida «ждёт подтверждения владельца» deb yozilgan, loyiha kartochkasida esa sariq qator turadi. Xato belgilagan bo‘lsangiz — egasiga ayting, belgini u olib tashlaydi.",
              "**«Ссылка для заказчика»** — mijoz shartnoma va hisoblarni ko‘radigan sahifa. Havola bir marta ko‘rsatiladi — darhol nusxalang. «Выпустить новую ссылку» eskisini o‘chiradi.",
            ],
            head: [
              "Har bir bosqich oldindan, narxining 100% to‘lanadi. Birinchi bosqichga hisob tasdiqlashda o‘zi chiqadi, keyingilari — **«Выставить счёт»** tugmasi bilan. To‘lov muddati — 14 kun. Pul keldi — **«Оплачен»**: to‘lovni bankda ko‘rgan odam belgilaydi.",
              "Belgidan keyin egasiga Telegram’da xabar keladi. U «Подтвердить платёж» tugmasini bosadi — va to‘lov [loyihada](/admin/projects) to‘lov bo‘lib yoziladi: pulga tushadi va shu bo‘yicha hisoblanmalar — sizniki ham, jamoaniki ham — muzdan chiqadi. U tasdiqlamaguncha hisob yonida «ждёт подтверждения владельца» deb yozilgan, loyiha kartochkasida esa sariq qator turadi. Xato belgilangan bo‘lsa — egasiga ayting, belgini u olib tashlaydi.",
              "**«Ссылка для заказчика»** — mijoz shartnoma va hisoblarni ko‘radigan sahifa. Havola bir marta ko‘rsatiladi — darhol nusxalang. «Выпустить новую ссылку» eskisini o‘chiradi.",
            ],
            admin: [
              "Har bir bosqich oldindan, narxining 100% to‘lanadi. Birinchi bosqichga hisob tasdiqlashda o‘zi chiqadi, keyingilari — **«Выставить счёт»** tugmasi bilan. To‘lov muddati — 14 kun. Pul keldi — **«Оплачен»**: to‘lovni bankda ko‘rgan odam belgilaydi.",
              "Sizning «Оплачен» belgingiz to‘lovni darhol loyihaga yozadi — loyiha kartochkasida uni ikkinchi marta yozish shart emas: hisob summasi, sana — bugun, maqsad — birinchi bosqichda avans, oxirgisida qoldiq, izohda «Счёт № … по договору № …». Agar to‘lovni xodim belgilagan bo‘lsa, sizga Telegram’da xabar keladi, hisob yonida esa — **«Подтвердить платёж»** va **«Оплаты не было»** (xato belgini olib tashlaydi). Tasdiqlangan to‘lov oddiy to‘lov kabi loyiha kartochkasida o‘chiriladi; shundan keyin hisob yana tasdiqni kutadi.",
              "**«Ссылка для заказчика»** — mijoz shartnoma va hisoblarni ko‘radigan sahifa. Havola bir marta ko‘rsatiladi — darhol nusxalang. «Выпустить новую ссылку» eskisini o‘chiradi.",
            ],
          },
        },
        {
          id: "signature",
          title: "Sizning imzongiz",
          roles: ["admin"],
          body: [
            "Shu sahifadagi «Подпись» bloki: shaffof fonli PNG, 2 MB gacha, barcha shartnomalar uchun bitta — «Загрузить» yoki «Заменить».",
            "Imzo faqat tasdiqlangan shartnomalarda va ularning hisoblarida ko‘rsatiladi. Imzo fayli bo‘lmasa, tasdiqlangan shartnoma usiz chop etiladi — panel ogohlantiradi.",
          ],
        },
        {
          id: "protects",
          title: "Shartnoma nimadan himoya qiladi",
          body: [
            "Nizolar — arbitrajda; javobgarlik — olingan summadan ko‘p emas; boy berilgan foyda qoplanmaydi; buyurtmachi bosqich topshirilgandan keyin 5 ish kuni jim tursa — bosqich qabul qilingan hisoblanadi; kodga huquqlar to‘liq to‘lovdan keyin o‘tadi.",
            "Hujjatni yurist tekshirmagan — murakkab holatni unga ko‘rsatgan ma’qul.",
          ],
        },
      ],
    },

    /* ── Расходы ──────────────────────────────────────────────────────── */
    "/admin/expenses": {
      what: "Studiyaning umumiy xarajatlari — reklama, servislar, pudratchilar, ofis — va har biridan har bir muassisga qanchasi to‘g‘ri kelishi. Yana yaqin ikki haftadagi soliq muddatlari. Ikkala muassis ham ko‘radi: xarajat har birining ulushini kamaytiradi.",
      items: [
        {
          id: "split",
          title: "Xarajat qanday bo‘linadi",
          body: [
            "Foyda bilan bir xil nisbatda — muassislar ulushlari bo‘yicha. Egasining misoli: $100 lik reklama — biriga 70, boshqasiga 30. Qismlar doim sentigacha mos kelishi uchun oxirgisiga qoldiq tushadi.",
            "Aniq loyihaning tannarxi bu yerga yozilmaydi: u loyihaning o‘zida ayirilgan va bu yerda ikkinchi marta ayirilardi.",
          ],
        },
        {
          id: "add",
          title: "Yozish va o‘chirish",
          body: {
            head: [
              "«Добавить расход»: sana, modda («реклама», «сервисы и подписки», «подрядчики», «офис и связь», «прочее»), summa va nimaga — «Записать». Siz va egasi yoza olasiz: o‘ylab topilgan xarajat sizning ulushingizni ham kamaytiradi, shuning uchun o‘zingizga foydali yolg‘on gapirib bo‘lmaydi.",
              "Faqat egasi o‘chiradi: o‘chirish orqali birovning xarajatini manzaradan olib tashlash mumkin bo‘lardi. Xato qildingiz — unga ayting.",
            ],
            admin: [
              "«Добавить расход» va har bir qatordagi «убрать». Muassis-rahbar yoza oladi, lekin o‘chira olmaydi: o‘chirish orqali birovning xarajatini manzaradan olib tashlash mumkin, o‘ylab topilgan xarajat esa uni yozganning ulushini ham kamaytiradi.",
              "Bu yerda [«Финансы»](/admin/finance) bo‘limidagi «Расходы студии» blokidagi xarajatlarning o‘zi.",
            ],
          },
        },
        {
          id: "taxes",
          title: "Soliq muddatlari",
          body: [
            "«Налоги: что подходит» bloki — 14 kun oldinga muddatlar: aylanmadan soliq va ijtimoiy soliq — har oyning 15-sanasigacha, yillik hisobot — 1-aprelgacha. 3 kun va undan kam qolsa — sariq.",
            "Har bir sana yonida «дата не подтверждена бухгалтером» belgisi bor: bu buxgalter bilan suhbat uchun qoralama, uning so‘zi emas. Kechikish uchun jarima bir marta va to‘liq keladi, shuning uchun blok birinchi turadi.",
          ],
        },
        {
          id: "no-profit",
          title: "Nega bu yerda foyda yo‘q",
          body: {
            head: [
              "Bu yerda faqat xarajatlar va ularning bo‘linishi ko‘rinadi. Foyda va undagi ulushlar — egasida: 30% ni ko‘rsatish qolgan 70% ni ham ko‘rsatish demak, biri ikkinchisidan xayolan hisoblanadi.",
            ],
            admin: [
              "Rahbarga bu yerda faqat xarajatlar ko‘rinadi: foyda va undagi ulushlar — faqat sizda, [«Финансы»](/admin/finance) bo‘limidagi «Доли соучредителей» blokida. Uning 30% ini ko‘rsatish sizning 70% ingizni ham ko‘rsatish bo‘lardi.",
            ],
          },
        },
      ],
    },

    /* ── Финансы ──────────────────────────────────────────────────────── */
    "/admin/finance": {
      what: "Jamoaning puli: har kim bitimlardan qancha ishlab topgani, mijoz qolganini to‘lashini qanchasi kutayotgani va qanchasi to‘lab berilgani. Maosh yo‘q — har kim o‘z bitimlarining sof foydasidan foiz oladi.",
      items: [
        {
          id: "how",
          title: "Foiz qanday hisoblanadi",
          body: [
            "**Bitimning sof foydasi** = shartnoma summasi − soliq − ishlab chiqish tannarxi. Foiz shartnoma summasidan emas, undan olinadi. Soliq va tannarxni egasi yozadi.",
            "Daraja bo‘yicha stavkalar: **kichik menejer** — yangi mijozdan 10% va qo‘shimcha sotuvdan 0; **menejer** — 15% va 5%; **rahbar** — 30% va 30%. Daraja va shaxsiy stavkani egasi «Команда» bo‘limida qo‘yadi. Shaxsiy stavka darajani faqat yangi mijozlar uchun almashtiradi.",
            "Rahbar qo‘shimcha ravishda o‘z jamoasi menejerlarining har bir bitimidan 5% oladi — ustiga, ularning ulushidan emas. Muassis-rahbarda bu qator 0: u baribir qolgan hamma narsadan ulush oladi.",
            "Egasi aniq bitim uchun foiz belgilashi mumkin — u daraja va shaxsiy stavkadan muhimroq. Hisoblanma loyihada summa va mas’ul bo‘lganda paydo bo‘ladi. Bitim minusga ketdi — hisoblanma 0: minus — egasining tashvishi.",
          ],
        },
        {
          id: "freeze",
          title: "Muzlatilgan, ishlab topilgan, to‘lanadigan",
          body: [
            "**«Заморожено»** — bitim bor, lekin mijoz hali butun summani to‘lamagan. **«Заработано»** — mijoz loyihani to‘liq to‘lagan (egasi to‘lovlarni loyiha kartochkasiga yozgan). **«Не начисляется»** — loyiha bekor qilingan.",
            "**«К выплате»** = ishlab topilgan − to‘lab berilgan. Manfiy bo‘lsa — «выплачено вперёд».",
            "Hisoblanmalar saqlanmaydi, har ochilganda qaytadan hisoblanadi — tannarxni o‘zgartirdingiz, raqam darhol boshqacha.",
          ],
        },
        {
          id: "page",
          title: "Sahifada nima bor",
          body: {
            manager: [
              "Siz bo‘yicha plitkalar: «Заработано», «Заморожено», «Выплачено», «К выплате». Pastda «По проектам» — loyihalaringiz: summa, to‘liq to‘langanmi va sizning hisoblanmangiz. Va sizga qilingan to‘lovlar ro‘yxati.",
              "Ko‘proq olishni xohlaysizmi — yangi mijozlar qidiring: yangi mijozdan foiz qo‘shimcha sotuvdagidan yuqori. Va o‘z [loyihalaringizni](/admin/projects) o‘zingiz oching — hisoblanma olib borayotgan odamga yoziladi.",
            ],
            head: [
              "Plitkalar — sizning balansingiz. «По людям» — siz va jamoangiz: daraja, loyihalar, muzlatilgan, ishlab topilgan, to‘lab berilgan, to‘lanadigan. «По проектам» — siznikilar va jamoanikilar, sizning doirangiz hisoblanmalari bilan. «Выплаты» — sizniki va jamoaniki.",
              "Studiya foydasidagi ulushlarni va uning qoldig‘ini faqat egasi ko‘radi.",
            ],
            admin: [
              "Studiya bo‘yicha plitkalar: «По договорам», «Оплачено клиентами», «Чистая прибыль» (nechta loyihada tannarx yo‘qligi belgisi bilan), «Начислено команде и партнёрам», «Остаётся владельцу».",
              "«По людям» va «По проектам» — soliq, tannarx, foyda va «Владельцу» (hamkorlar ayirilgan) ustunlari bilan. «Доли соучредителей» — kelgan pul minus xarajatlar va u qanday bo‘linadi. «Расходы студии» — [«Расходы»](/admin/expenses) bo‘limidagi ro‘yxatning o‘zi.",
            ],
          },
        },
        {
          id: "payouts",
          title: "To‘lovlar",
          body: {
            manager: [
              "To‘lovlarni egasi pulni o‘tkazgandan keyin yozadi. Ular «Выплаты» ro‘yxatida chiqadi va «К выплате» ni kamaytiradi.",
            ],
            head: [
              "To‘lovlarni faqat egasi yozadi. Siz o‘zingizga va jamoangizga qilingan to‘lovlarni ko‘rasiz.",
            ],
            admin: [
              "«Выплаты» → «Кому», «Сумма, $», «Дата» (bo‘sh — bugun), «Заметка» («avgust uchun») → «Записать выплату». Avval pulni o‘tkazing, keyin yozing. O‘zingizga to‘lov yozib bo‘lmaydi: sizga qoldiq qoladi.",
            ],
          },
        },
      ],
    },

    /* ── Релизы ───────────────────────────────────────────────────────── */
    "/admin/releases": {
      what: "«Заявки» bo‘limida to‘lovdan keyin xaridorlar oladigan tayyor mahsulot fayllari. Faylni joylash — allaqachon to‘lagan har bir kishi aynan nimani olishini hal qilish demak, shuning uchun bo‘lim faqat egasida.",
      items: [
        {
          id: "upload",
          title: "Versiyani joylash",
          body: [
            "Avval arxivni o‘z kompyuteringizdan Supabase’dagi yopiq bucket’ga yuklang — sayt katta fayllarni qabul qilmaydi. Keyin «Выложить релиз» formasi: mahsulot, versiya, bucket, bucket ichidagi yo‘l, sha256 (ixtiyoriy) va izoh — «Выложить».",
            "Panel fayl joyidami tekshiradi. Yangi versiya amaldagi bo‘ladi, oldingisi — yo‘q.",
          ],
        },
        {
          id: "downloads",
          title: "Xaridor nimani ko‘radi",
          body: [
            "To‘lovdan keyin — buyurtma sahifasida yuklab olish tugmasini: jami 20 tagacha va kuniga 10 tagacha yuklab olish, har bir havola 60 soniya yashaydi. Reliz bo‘lmaguncha — «файл готовим».",
            "Tepada `DOWNLOAD_SIGNING_SECRET` haqida ogohlantirish bo‘lsa — yuklab olish hech kimda ishlamaydi. Kirishni yopish — [«Заявки»](/admin/orders) bo‘limidagi buyurtma kartochkasidagi tugma bilan.",
          ],
        },
      ],
    },

    /* ── Команда ──────────────────────────────────────────────────────── */
    "/admin/team": {
      what: "Xodimlar: rollar, darajalar, kim kimning rahbari va aloqalar rejasi. Yangi odam shu yerda qo‘shiladi, ketgani o‘chiriladi. Panelga kirish — Telegramdagi raqamli id bo‘yicha: parol yo‘q, username’ni odam bir soniyada almashtiradi, id esa — hech qachon.",
      items: [
        {
          id: "invite",
          title: "Xodim qo‘shish",
          body: {
            head: [
              "«Завести сотрудника» bloki: Telegram id (raqamli — odam uni @userinfobot kabi istalgan botdan bilib, sizga yuboradi), paneldagi ism, username ixtiyoriy. Sizda rol bitta — «менеджер»: ikkinchi rahbarni egasi tayinlaydi. **«Завести»** tugmasini bosing.",
              "Siz qo‘shgan menejer **darhol sizniki** — egasiga bildirishnoma boradi. Odamga bot taklifnoma yuboradi: rol, unga nima ochiq va bir bosishda panelga kiritadigan «Открыть панель» tugmasi.",
              "«Бот не может написать первым» — odam hali botga yozmagan. U [botni](https://t.me/Devuz_studio_bot) ochib, «Старт» tugmasini bossin, siz esa uning qatorida «отправить приглашение» ni bosing.",
            ],
            admin: [
              "«Завести сотрудника»: Telegram id (raqamli, @userinfobot orqali), ism, username ixtiyoriy va rol — «руководитель проектов» yoki «менеджер». Siz qo‘shgan odam rahbarsiz bo‘ladi; uni «Руководитель» ustunida biriktiring.",
              "Bot «Открыть панель» tugmasi bilan taklifnoma yuboradi. Yetib bormadi — odam botda «Старт» tugmasini bosmagan; shundan keyin — uning qatorida «отправить приглашение». Bu id oldin bo‘lgan va o‘chirilgan bo‘lsa — odam butun tarixi bilan qaytadi.",
              "«обновить меню команд бота» — agar kimdadir botda /login ko‘rinmasa. Menyu baribir har bir yangilanish chiqqanda, xodim qo‘shilganda va o‘chirilganda yangilanadi.",
            ],
          },
        },
        {
          id: "claim",
          title: "Rahbar va uning jamoasi",
          body: {
            head: [
              "«Руководитель» ustunida rahbarsiz menejerda **«взять к себе»** tugmasi bor. Undan keyin u sizning jamoangizda: uning statistikasi va «План и факт» — sizda, aloqalar rejasini unga siz qo‘yasiz, sizga esa uning bitimlaridan 5% hisoblanadi. Egasiga bildirishnoma boradi.",
              "Ikki rahbar bir vaqtda bossa, menejer bittasiga tushadi.",
              "Menejerni ajratish yoki boshqa rahbarga berishni faqat egasi qila oladi — o‘zingizda «вы · открепляет владелец» yozuvini ko‘rasiz.",
            ],
            admin: [
              "«Руководитель» ustuni: rahbarni tanlang va «сохранить», yoki ajratish uchun «без руководителя». Odamga xabar boradi.",
              "Rahbar hech kimga biriktirilmagan menejerlarni «взять к себе» tugmasi bilan o‘zi oladi, o‘zi qo‘shganlari esa darhol uniki. Bu haqda sizga «Команда» tugmasi bilan xabar keladi. Faqat siz ajratasiz.",
              "«Jamoa» nimani anglatadi: menejerning statistikasi va «План и факт» — rahbarda, aloqalar rejasini u qo‘yadi, unga esa menejerning har bir bitimidan 5% (muassisda — 0).",
            ],
          },
        },
        {
          id: "plan",
          title: "Aloqalar rejasi",
          body: {
            head: [
              "O‘z menejerlaringizga — «План касаний» ustunida: «в неделю» soni va «сохранить». O‘zingizga reja qo‘ymaysiz — uni egasi qo‘yadi.",
              "Bo‘sh maydon — «без плана»: unda kunlik to‘plam 5 ta kompaniya. 0 — reja yo‘q va to‘plam ham yo‘q. [Kunlik to‘plam](/admin/prospect) hajmi rejaga bog‘liq: reja ÷ 5, kuniga 2 dan 15 gacha.",
            ],
            admin: [
              "«План касаний» ustuni — o‘zingizdan boshqa istalgan odamga. Rahbar faqat o‘z odamlariga qo‘yadi. Bo‘sh maydon — «без плана» (kuniga 5 tadan to‘plam), 0 — na reja, na to‘plam, ko‘pi bilan 500.",
            ],
          },
        },
        {
          id: "grade",
          title: "Daraja va stavka",
          body: {
            head: [
              "Daraja va shaxsiy stavkani egasi qo‘yadi — siz ularni ko‘rasiz, lekin tahrirlamaysiz. Daraja bitim sof foydasidan foizni belgilaydi: kichik menejer — yangi mijozdan 10%, menejer — 15%, rahbar — 30%. Batafsil — [«Финансы»](/admin/finance) bo‘limida.",
            ],
            admin: [
              "«младший менеджер» (yangi mijozdan 10%, qo‘shimcha sotuvdan 0), «менеджер» (15% va 5%), «руководитель» (30% va 30%). Shaxsiy stavka, % — darajani faqat yangi mijozlar uchun almashtiradi; bo‘sh — «по грейду».",
              "Rol almashganda daraja o‘zi almashadi: rahbarga — «руководитель», menejerga — «менеджер»; shaxsiy stavka qoladi.",
            ],
          },
        },
        {
          id: "role",
          title: "Rol",
          roles: ["admin"],
          body: [
            "«сделать руководителем» / «сделать менеджером». Administrator roli panel orqali hech kimga berilmaydi.",
            "Rahbarlikdan olsangiz, uning jamoasi ajraladi: panel nechta menejer rahbarsiz qolganini yozadi — ularni boshqasiga biriktiring. Menejerlarning o‘ziga bu haqda xabar berilmaydi.",
            "O‘zingizni va oxirgi administratorni lavozimdan tushirib bo‘lmaydi.",
          ],
        },
        {
          id: "disable",
          title: "Xodimni o‘chirish",
          roles: ["admin"],
          body: [
            "«Отключить» → nima bo‘lishini o‘qing → **«Понятно, отключить»**. Darhol: kirish yopiladi, barcha sessiyalar uziladi, kirish havolalari bekor bo‘ladi.",
            "Keyin tizim o‘zi: uning ishdagi lidlari navbatga qaytadi («↩️ Лид вернулся в очередь…»), navbatdagi yarim soatlari tugaydi, eslatmalar va berish so‘rovlari yopiladi, yuborilmagan aloqalar zaxiraga ketadi, davom etayotgan yozishmalar esa — uning rahbariga yoki sizga. Uning jamoasi (agar u rahbar bo‘lsa) ajraladi, Telegramidagi lid kartochkalari o‘chiriladi.",
            "Tizim bitta narsani qila olmaydi: **odamni qo‘lda chiqarib yuboring** — «Devuz Scout» kanalidan va sotuv chatidan.",
            "O‘chirilganlar butunlay yo‘q qilinmaydi — ular «Отключённые» ro‘yxatida. Qaytarish — o‘sha id bilan qaytadan qo‘shish.",
          ],
        },
      ],
    },

    /* ── Партнёры ─────────────────────────────────────────────────────── */
    "/admin/partners": {
      what: "O‘z havolasi bilan mijoz olib keladigan va loyiha foydasidan foiz oladigan odamlar. Bu yerda ularning havolalari, mijozlari, hisoblanmalari va to‘lov so‘rovlari. Bo‘lim faqat egasida: bu begona odamlarga beriladigan pul.",
      items: [
        {
          id: "join",
          title: "Hamkor qanday paydo bo‘ladi",
          body: [
            "O‘zi: botga /ref deb yozadi (yoki saytda «Получить ссылку» tugmasini bosadi) — va kod hamda «Основная ссылка» ni oladi. Har kim bo‘la oladi, jumladan xodim ham.",
            "Yoki siz: «Завести партнёра руками» — ism, kod (bo‘sh — o‘zimiz o‘ylab topamiz), Telegram id ixtiyoriy, izoh. Telegram id bo‘lmasa, bunday hamkor keyin bot orqali kelgan odam bilan birlashmaydi.",
            "Havolalar: saytga — `?ref=KOD`, botga — `start=ref_KOD`. Qo‘shimchalari — `/ref KOD belgi`, 20 tagacha. Sayt birinchi kodni 90 kun eslab qoladi.",
          ],
        },
        {
          id: "count",
          title: "Mijoz qachon hisobga olinadi",
          body: [
            "Havola orqali kelgan lid hamkorga hisoblanadi, agar bu uning o‘zi bo‘lmasa, mijoz oldin bizda bo‘lmagan bo‘lsa va hamkor bloklanmagan bo‘lsa. Hisoblandi — hamkorga «🤝 По вашей ссылке пришёл…» keladi.",
            "Bunday liddan ochilgan loyiha hamkorni meros oladi. Loyiha kartochkasida, «Партнёр» blokida kim olib kelganini, foizni va «Не засчитывать, причина» ni o‘zgartirish mumkin.",
            "Bloklash faqat yangi hisoblashlarni to‘xtatadi: eski hisoblanmalar va to‘lovlar qoladi.",
          ],
        },
        {
          id: "percent",
          title: "Foiz",
          body: [
            "Loyiha sof foydasining 20% (summa − soliq − tannarx), to‘liq to‘langan uchta loyihadan keyin — 25% («прокачанный»). Loyihadagi foiz hamkorning shaxsiy stavkasidan muhimroq, shaxsiysi — pog‘onadan.",
            "Mijoz loyihani to‘liq to‘lamaguncha hisoblanma muzlatilgan — xodimlardagi kabi.",
          ],
        },
        {
          id: "payout",
          title: "Hamkorga to‘lov",
          body: [
            "Hamkor botga /payout va rekvizitlarini yozadi (USDT TRC-20 yoki matn). Oyning birinchi ish kunidan boshlab, $50 dan, bitta ochiq so‘rov, doim butun mavjud summaga. Sizga «💸 Заявка на выплату» keladi.",
            "Avval pulni o‘zingiz o‘tkazing, keyin «Заявки на выплату» blokida **«Выплачено»** tugmasini bosing (izoh bilan ham bo‘ladi). Yoki «отклонить» — summa mavjud pulga qaytadi, hamkor sababini ko‘radi.",
          ],
        },
      ],
    },

    /* ── Прототипы ────────────────────────────────────────────────────── */
    "/admin/proto": {
      what: "Mijozning bo‘lajak saytining prototipi — birinchi suhbatdan keyin, u hali yodida turgan paytda havola qilib yuboriladigan sahifa: mijoz uni telefonidan ochadi va o‘z biznesini ko‘radi. Hozircha bo‘lim faqat egasida: yig‘ish — modelning eng qimmat chaqiruvi.",
      items: [
        {
          id: "build",
          title: "Yig‘ish",
          body: [
            "«Сайт клиента», nisha (shinomontaj, avtoservis, avtomoyka, barbershop, go‘zallik saloni, tirnoq studiyasi, deteyling) va sahifa tili. Nomi, tavsifi, telefoni, messenjerlari va logotipi uning saytidan o‘zi olinadi.",
            "Xizmatlar — har qatorga bittadan, uning so‘zlari bilan, 3 tadan 12 tagacha. Narx — ikki tomonida bo‘sh joy qoldirilgan tiredan keyin, va faqat mijoz o‘zi aytgani. «Перебить то, что нашлось на сайте» — agar sayt xato qilgan bo‘lsa. «Собрать прототип».",
          ],
        },
        {
          id: "check",
          title: "Tekshiruv va havola",
          body: [
            "Tayyor sahifani tekshiruv o‘qiydi: o‘ylab topilgan raqamlar, foizlar, maqtanish, kompaniya nomi yo‘q, ishlamaydigan tugma, mijoz aytmagan xizmatlar. Topsa — prototip «черновик» bo‘lib qoladi, havola 404 beradi, muammolar esa sanab o‘tiladi: tuzating va qaytadan yig‘ing.",
            "Toza — «готов», havola allaqachon ishlaydi: «Скопировать ссылку». Yubordingiz — «Отправил клиенту».",
          ],
        },
        {
          id: "opens",
          title: "Mijoz ochdimi",
          body: [
            "«открыл … заходов: N» yoki «ещё не открывал». Har bir ochilish hisoblanadi — sizning o‘z ko‘rishingiz ham.",
            "Ochib, ikkinchi marta qaytdi — bugun qo‘ng‘iroq qiling. Ikki kunda ochmadi — havola unga yetib bormagan. Prototipdagi «Записаться» tugmasi mijozning o‘z Telegrami yoki WhatsApp’ini ochadi — shunda u buning ishlashini ko‘radi.",
          ],
        },
      ],
    },

    /* ── Разборы ──────────────────────────────────────────────────────── */
    "/admin/razbor": {
      what: "Saytimiz uchun begona saytlar tahlili maqolalari: smena ularni har kuni ertalab o‘zi yozadi va sizga tekshirishga qoldiradi. Chop etilgan tahlil darhol saytda va qidiruvda chiqadi — u studiya nomidan begona saytni yomon deydi, shuning uchun faqat siz hal qilasiz.",
      items: [
        {
          id: "shift",
          title: "Tahlillar smenasi",
          body: [
            "Har kuni Toshkent vaqti bilan 08:03 da smena «Касания» bo‘limidagi hali yozilmagan saytlarni oladi, 12 tagachasini ko‘radi va 3 tagacha tahlil yozadi — ruscha va o‘zbekcha. «Смена разборов» hisoboti Telegramga keladi: nechtasi chiqdi va qolganlari nega olinmadi.",
            "Rad etish sabablari: sayt ochilmadi, sayt joyida yoki topilmalar kam, nisha yoki shahar aniqlanmadi, nishani tahlil qilmaymiz (tibbiyot), maqola tekshiruvdan o‘tmadi. 11:03 gacha hisobot bo‘lmasa — «Смена разборов — молчит» keladi.",
          ],
        },
        {
          id: "review",
          title: "Tahlilni tekshirish",
          body: [
            "«На проверке» blokida — ikkala maqola to‘liq. Ikkalasini o‘qing: ular bir-birining tarjimasi emas, turli so‘rovlar uchun turli sahifalar. Manba-sayt manzili faqat sizga ko‘rinadi — saytda u yo‘q.",
            "Kompaniya hech qayerda nomlanmaganini tekshiring — na nomi, na manzili, na rasmda, va har bir raqam topilmalarda borligini. «Править» faqat matnni o‘zgartiradi: sarlavha, tavsif, kirish, topilmalar va xulosa; manzil va so‘rov o‘zgarmaydi.",
          ],
        },
        {
          id: "publish",
          title: "Chop etish, olib tashlash, rad etish",
          body: [
            "**«Опубликовать»** — ikkala maqola kerak. Sahifa saytda darhol ochiladi, sayt xaritasi yangilanadi, Bing va Yandex signal oladi. **«Снять с публикации»** tahlilni «На проверке» ga qaytaradi.",
            "**«Не публикуем»** — sabab bilan yoki sababsiz. Smena bu saytga boshqa qaytmaydi. Saytni smena navbatiga qaytarish — faqat **«Удалить»** (maydonga «удалить» deb yozing).",
          ],
        },
      ],
    },

    /* ── Журнал ───────────────────────────────────────────────────────── */
    "/admin/audit": {
      what: "Panelda kim nima qilgani va qachon: kartochkani, kontaktni, yozishmani ochdi, lidni oldi, holatni o‘zgartirdi, berdi, to‘lovni tasdiqladi, xodim qo‘shdi yoki o‘chirdi. Yozuvlarni o‘zgartirib ham, o‘chirib ham bo‘lmaydi — na paneldan, na bazadan.",
      items: [
        {
          id: "filters",
          title: "Qanday qidirish",
          body: [
            "«Кто» filtri — xodim (o‘chirilganlar belgilangan) yoki «система» — taymer, bot yoki bot orqali hamkor qilgan hamma narsa. «Что» — 75 ga yaqin harakat turi. Har sahifada 100 ta yozuv.",
            "Tilla rang bilan sezgir harakatlar ajratilgan: kontakt, yozishma, pul, kirish huquqi. Lidlarda — kartochkaga havola.",
          ],
        },
        {
          id: "when",
          title: "Bu yerga qachon qarash kerak",
          body: [
            "Mijoz unga ikki kishi yozganidan shikoyat qilyapti. Lid «yo‘qolib qoldi». Summa yoki bosqichni kim o‘zgartirgani noma’lum. Mijoz raqobatchilarga ketishidan oldin kontaktni kim ochganini bilish kerak. Bu yerda bularning hammasi daqiqasigacha aniq ko‘rinadi.",
          ],
        },
      ],
    },

    /* ── Использование ────────────────────────────────────────────────── */
    "/admin/usage": {
      what: "Jamoa panelda nimadan foydalanadi: qaysi bo‘limlarni ochadi, qaysi funksiyalarni bosadi, kim nima bilan band. Jim kastdev: jamoa bu hisobot haqida bilmaydi, chunki hamma biladigan hisobot ishni emas, unda yaxshi ko‘rinishga urinishni o‘lchaydi.",
      items: [
        {
          id: "read",
          title: "Qanday o‘qish",
          body: [
            "Davr — 7, 30 yoki 90 kun, strelkalar — undan oldingi xuddi shunday davrga nisbatan. Rahbarlar va menejerlar hisoblanadi; siz yo‘qsiz, shaxsiy bo‘limlaringiz ham.",
            "Qator bo‘yicha xulosa: «ядро» — foydalanish huquqi borlarning kamida yarmi ishlatadi; «у единиц» — kamrog‘i; «никто — шум?» — hech kim. Faqat rahbarlar uchun funksiyalar rahbarlar bo‘yicha hisoblanadi.",
          ],
        },
        {
          id: "use",
          title: "Bu bilan nima qilish kerak",
          body: [
            "«Никто — шум?» — so‘rash uchun sabab: funksiya keraksizmi yoki u haqda bilishmaydimi. Ko‘pincha javob — ikkinchisi: unda yo‘riqnomadagi band va «?» tugmasi yordam beradi.",
            "Bo‘limlarni ko‘rishlar hisobot yoqilgan paytdan, harakatlar esa butun vaqt uchun jurnaldan hisoblanadi.",
          ],
        },
      ],
    },

    /* ── Инструкции ───────────────────────────────────────────────────── */
    "/admin/help": {
      what: "Shu sahifa. Bu yerda bo‘limlar bo‘yicha panel qanday ishlashi va nima nimaga bog‘liqligi yozilgan — faqat sizga ochiq narsalar haqida va siz ko‘rgandek.",
      items: [
        {
          id: "how",
          title: "Yo‘riqnomadan qanday foydalanish",
          body: [
            "Istalgan bo‘limning tepasida — «Как пользоваться разделом» tugmasi: u shu yerda o‘sha bo‘limning bandini ochadi. Bo‘limlar ichidagi murakkab bloklar yonida — kichik «?», u to‘g‘ri kerakli bandga olib boradi.",
            "Tepada — mundarija va tilni almashtirish. O‘zbek tili eslab qolinadi: bundan keyin «?» tugmalari yo‘riqnomani shu tilda ochadi.",
            "Biror narsa yetishmasa yoki ekrandagidan boshqacha yozilgan bo‘lsa — egasiga ayting, qo‘shib qo‘yamiz.",
          ],
        },
        {
          id: "first-day",
          title: "Birinchi kuni nima qilish kerak",
          body: [
            "[Studiya botini](https://t.me/Devuz_studio_bot) oching va «Старт» tugmasini bosing — busiz u sizga na lid, na eslatma yubora oladi. Panelga kirish — /login buyrug‘i bilan.",
            "«Devuz Scout» kanaliga qo‘shiling va bot hamda kanal ovozini yoqing: lid taklifi 30 daqiqa yashaydi, chatdagi post — bir-ikki soat.",
            "[Lidlar navbati](#leads-queue) va [lid kartochkasi](#leads-card) haqidagi bandlarni o‘qing — bu ishning asosi. Qolganini bo‘limni birinchi marta ochganingizda o‘qing: «Как пользоваться разделом» tugmasi doim tepada.",
          ],
        },
        {
          id: "owner-view",
          title: "Jamoa ko‘zi bilan ko‘rish",
          roles: ["admin"],
          body: [
            "«Kim sifatida ko‘rsatish: egasi / rahbar / menejer» — yo‘riqnoma aynan shu roldagi odam o‘qiydigan ko‘rinishda: sizning bo‘limlaringizsiz va uning matni bilan. Shunday qilib yangi odamga nima tushuntirilayotganini birovning akkauntiga kirmasdan tekshirasiz.",
            "Qo‘shimchalar uchun qoida: har bir yangi funksiya shu yerdagi o‘z bandi bilan birga keladi — rus va o‘zbek tillarida, rollar bo‘yicha. Bu har bir yangilanish chiqishida test bilan tekshiriladi.",
          ],
        },
      ],
    },
  },

  channelsTitle: "Telegram",
  channelsLead: "Deyarli hamma muhim narsa Telegramga keladi: lid kartochkalari, navbat, eslatmalar, kunlik to‘plam, aloqalar bo‘yicha javoblar.",
  channels: [
    {
      name: "Studiya boti",
      url: BOT_URL,
      what: "Asosiy kanal. U orqali panelga kirasiz, yangi lidlar kartochkalarini va navbat takliflarini, eslatmalarni, kunlik to‘plamni, aloqalar va lid berish bo‘yicha xabarlarni olasiz.",
      how: [
        "Botni oching va «Старт» tugmasini bosing — aks holda bot sizga birinchi bo‘lib yoza olmaydi.",
        "/login deb yozing — «🔓 Открыть панель» tugmasi va 15 daqiqalik bir martalik havola keladi. Xabarlar ostidagi «Открыть» tugmalari ham panelga o‘zi kiritadi.",
        "Ovozni o‘chirmang: navbat taklifi 30 daqiqa yashaydi, bildirishnoma jim tursa, lid keyingi odamga ketadi.",
        "Mijoz olib kelib foiz olmoqchi bo‘lsangiz, /ref deb yozing.",
      ],
    },
    {
      name: "«Devuz Scout» kanali",
      url: SCOUT_URL,
      what: "Skaut bu yerga ochiq chatlarda hozir dasturchi qidirayotgan odamlarni va ertalabki xulosani yuboradi. Batafsil — «Поиск» bo‘limida.",
      how: [
        "Havolani oching va kanalga qo‘shiling. Ovozni yoqing: bunday postlar bir-ikki soat yashaydi.",
        "«Сильный сигнал» belgisi bor signalga o‘zingiz yozmang — u navbat bo‘yicha lid bo‘lib keladi.",
      ],
    },
    {
      name: "Sotuv bo‘limi chati",
      url: null,
      roles: ["admin"],
      what: "Majburiy bo‘lmagan umumiy chat (`TELEGRAM_SALES_CHAT_ID`): unga ham, sizga kelgani kabi, har bir lid kartochkasining nusxasi keladi. Usiz ham hammasi ishlaydi — kartochkalar har kimga shaxsiy xabarda boradi.",
      how: [
        "«Взять в работу» va «Отклонить» tugmalari u yerda ham, shaxsiy xabarda ham ishlaydi. Studiyadan ketgan odamlarni chatdan qo‘lda chiqaring.",
      ],
    },
  ],

  rulesTitle: "Uchta qoida",
  rules: [
    "Lidni oldingizmi — olib boring: holat, eslatma, keyingi qadam. Olib borolmasangiz — «Вернуть в очередь» yoki «Попросить передать».",
    "Mijozga biror narsa yuborishni va’da qildingizmi — o‘sha kuni yuboring. Bajarilmagan va’da mijozni yomon saytdan ham tezroq yo‘qotadi.",
    "Biror narsa ishlamasa yoki g‘alati ko‘rinsa — kutmasdan darhol egasiga ayting.",
  ],

  askTitle: "Chiqmayaptimi?",
  ask: "Egasiga Telegramda yozing. Taxmin qilgandan ko‘ra so‘ragan yaxshi: deyarli hammasi besh daqiqada tuzatiladi.",
};
