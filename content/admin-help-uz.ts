import type { HelpCopy } from "./admin-help";

/**
 * Инструкция по-узбекски, латиницей.
 *
 * Перевод admin-help-ru.ts абзац в абзац: те же пункты, роли и число
 * абзацев — это сверяет тест. Названия кнопок, блоков и статусов — в
 * «ёлочках» и ровно так, как они написаны на узбекской панели: человек ищет
 * их глазами на экране. Пока раздел панели не переведён, его кнопки здесь
 * по-русски — как у него на экране; сообщения бота тоже по-русски, пока бот
 * не пишет на языке панели. Всё остальное — по-узбекски, с ‘ в o‘/g‘ и ’ в
 * тутук белгиси.
 */

const BOT_URL = "https://t.me/Devuz_studio_bot";
/** Канал закрытый, публичного имени у него нет — только ссылка-приглашение. */
const SCOUT_URL = "https://t.me/+puC_Ns-kCbQ5NzJi";

/** Vazifalar Telegramda — barcha rollar uchun umumiy; oxirgi xatboshi har birida o‘ziniki. */
const TASKS_BOT = [
  "Sizga vazifa qo‘yilganda, bot xabar yuboradi: kimdan, nima qilish kerak, muddat — va **«✅ Взять в работу»** tugmasi. Bosdingiz — o‘sha xabarning o‘zida **«✅ Сделано»**, **«✖ Не сделано»** va **«🕑 Перенести срок»** paydo bo‘ladi. Telegramda bosilgani darhol panelda ko‘rinadi va aksincha: vazifani panelda olsangiz — Telegramdagi tugmalar o‘zi almashadi.",
  "«🕑 Перенести срок» quyidagilarni taklif qiladi: «+1 час», «Завтра 18:00», «+3 дня», «Неделя» va «✏️ Своя дата». «✏️ Своя дата» dan keyin botga muddatni bitta xabar bilan yozing — kun, oy va Toshkent vaqti bilan soat, masalan `05.10 15:00`. Bot bunday xabarni 30 daqiqa kutadi.",
  "Vazifani qo‘ygan odamga bot har bir qadam haqida yozadi: ishga oldi, bajarildi, bajarilmadi, muddatni falon sana va vaqtga ko‘chirdi. Ijrochiga bot qo‘ygan odam muddatni ko‘chirsa yoki vazifani bekor qilsa yozadi.",
  "Eslatmalar: yangi vazifa bot xabaridan keyin 30 daqiqa ichida olinmasa — bot eslatadi; muddatga bir soat qolganda — yana eslatadi; muddat o‘tsa — bir marta ham ijrochiga, ham qo‘ygan odamga yozadi. Ko‘chirilgandan keyin «bir soat qoldi» va «muddati o‘tdi» qaytadan keladi — endi yangi muddatga.",
  "Amallar haqidagi xabarlar — yangi vazifa, oldi, bajarildi, ko‘chirish, bekor qilish — darhol, istalgan kuni keladi, faqat tunda emas: Toshkent vaqti bilan 23:00 dan 07:00 gacha bot jim turadi, tungi xabar 07:00 da keladi. Eslatmalar — «olinmadi», «bir soatdan keyin muddat», «muddati o‘tdi» — faqat ish kunlari 09:00 dan 19:00 gacha, kunlik portsiya kabi. Panelda hammasi darhol ko‘rinadi, bosilgan tugmaga javob — istalgan vaqtda.",
];

export const uz: HelpCopy = {
  title: "Yo‘riqnoma",
  lead: "Panel qanday tuzilgani va undan qanday foydalanish — bo‘limlar bo‘yicha, oddiy so‘zlar bilan. Bu yerda faqat sizga ochiq narsalar yozilgan. Istalgan bo‘limdan bu yerga sahifa tepasidagi «Bo‘limdan qanday foydalanish» tugmasi olib keladi, bloklar yonidagi «?» esa kerakli bandni ochadi.",
  contentsTitle: "Mundarija",
  sectionsTitle: "Bo‘limlar",
  openSection: "bo‘limni ochish",
  viewAs: "Kim sifatida ko‘rsatish:",
  roleNames: { admin: "egasi", head: "rahbar", manager: "menejer" },
  ownerOnly: "Faqat egasi ko‘radi",

  sections: {
    /* ── Лиды ─────────────────────────────────────────────────────────── */
    "/admin": {
      what: "Panelning bosh sahifasi va mijozlarning barcha murojaatlari: saytdagi chat, forma, Telegram-bot, vitrina, «Qidiruv» va sizning aloqalaringizdan. Bu yerda kim yozgani, unga nima kerakligi, qanchalik shoshilinchligi va u bilan kim ishlayotgani ko‘rinadi. Lid bilan har bir harakat — olish, kontaktni ochish, holatni o‘zgartirish — jurnalga ism va vaqt bilan yoziladi.",
      items: [
        {
          id: "home",
          title: "Bosh sahifada nima bor",
          body: {
            manager: [
              "Bosh sahifada birinchi — [«Vazifalar»](#leads-tasks) bloki: sizga nima topshirilgan, siz nima topshirgansiz va «Vazifa qo‘yish» formasi. Pastroqda — plitkalar: **«to‘lanadi»** — qancha ishlab topganingiz va hali olmaganingiz (pastda mayda harf bilan — mijoz qolganini to‘lashini qanchasi kutayotgani), **«ishdagi lidlar»**, **«zudlik bilan bog‘lanish»** va loyihalaringiz bo‘yicha **«oylik tushumlar»**.",
              "Agar rahbar sizga aloqalar rejasini qo‘ygan bo‘lsa, plitkalar ustida shunday qator chiqadi: «Rejagacha 12 ta qoldi — bu hafta 30 tadan 18 tasi bajarildi». Batafsil — [aloqalar rejasi](#prospect-plan) bandida.",
              "Pastroqda: [«Zudlik bilan bog‘lanish»](#leads-urgent) — uzoq vaqt harakatsiz turgan lidlaringiz; «Haftalik tavsiyalar» — nimani yaxshilash kerak ([tavsiyalar](#leads-coach) bandiga qarang); [«Reja va fakt»](#leads-plan-fact) — sizga qo‘yilgan maqsadlar; eng pastda esa — [lidlar ro‘yxati](#leads-list).",
            ],
            head: [
              "Birinchi bo‘lib — **«Qaroringizni kutmoqda»**: menejerlarning lidni hamkasbga berish haqidagi so‘rovlari. Buni siz yoki egasi hal qiladi — batafsil [lidni berish](#leads-transfer) bandida. Ularning ostida — [«Vazifalar»](#leads-tasks) bloki: sizga nima topshirilgan va siz nima topshirgansiz.",
              "Plitkalar sizni va jamoangizni birga hisoblaydi: **«to‘lanadi»** — faqat sizning balansingiz, **«jamoadagi ishdagi lidlar»**, **«zudlik bilan bog‘lanish»**, **«haftalik tushumlar»**.",
              "Keyin: «Bugun uchun» — lidlaringiz bo‘yicha ertalabki maslahatlar, siz va jamoa bo‘yicha ismlar bilan [«Zudlik bilan bog‘lanish»](#leads-urgent), [«Jamoa: shu hafta»](#leads-team-week), jamoaga va sizga tavsiyalar, «Hafta yetakchilari», [«Reja va fakt»](#leads-plan-fact) va [lidlar ro‘yxati](#leads-list).",
              "Jamoa — bu [«Jamoa»](/admin/team) bo‘limida sizga biriktirilgan menejerlar. Jamoa bo‘lmaguncha, bosh sahifada uning bloklari chiqmaydi.",
            ],
            admin: [
              "Sizda bosh sahifa varaqlarga bo‘lingan — bitta uzun lentani aylantirib o‘tirmaslik uchun. Varaq manzilda saqlanadi, uni xatcho‘plarga qo‘yib qo‘ysa bo‘ladi.",
              "**«Bugun»** — kunni nimadan boshlash: «Qaroringizni kutmoqda» (lidni berish so‘rovlari), [«Vazifalar»](#leads-tasks) bloki, imzoga kelgan shartnomalar, pul plitkalari, «Bugun uchun» maslahatlari («qayta tayyorlash» tugmasi modelga bitta so‘rov sarflaydi), butun studiya bo‘yicha «Zudlik bilan bog‘lanish» va ikki haftalik soliq muddatlari.",
              "**«Lidlar»** — barcha filtrlari bilan [lidlar ro‘yxati](#leads-list). Varaqdagi tilla rangli raqam — hozir nechta lid bo‘shligi.",
              "**«Pul»** — «Oylar bo‘yicha kassa» (yarim yillik tushum va xarajatlar, har oy ostida — farqi) va «Kutilayotgan to‘lovlar»: faol loyihalar bo‘yicha yana qancha to‘lanishi kerak.",
              "**«Jamoa»** — [haftalik jadval](#leads-team-week), eng yaxshilar, har biriga tavsiyalar va [«Reja va fakt»](#leads-plan-fact) — u yerda maqsadlarni qo‘yasiz va o‘zgartirasiz.",
              "Metrika va Google Analytics bo‘yicha saytga tashriflar — varaq emas, alohida [Trafik](/admin/traffic) bo‘limi: uni siz va rahbarlar ko‘rasiz. Varaqqa eski xatcho‘plar ham o‘sha yerga olib boradi.",
            ],
          },
        },
        {
          id: "tasks",
          title: "Vazifalar: qo‘yish, olish, yopish",
          body: [
            "**«Vazifalar»** bloki bosh sahifada hammasidan yuqorida turadi (egasida — «Bugun» varag‘ida). Vazifani istalgan xodim istalgan xodimga, jumladan o‘ziga ham qo‘yishi mumkin: menejer — rahbarga, rahbar — egasiga, kim bo‘lsa ham — kimga bo‘lsa ham. Vazifani uni qo‘ygan va kimga qo‘yilgan ko‘radi; agar u loyihaga tegishli bo‘lsa — o‘sha loyiha kartochkasini ochadigan hamma ham.",
            "**«Menga»** — sizga qo‘yilgan vazifalar: tepada eng yaqin muddat, pastroqda — uzoqroqlari, muddatsiz vazifalar — eng oxirida. Yangisi «yangi» deb belgilangan va **«Ishga olish»** tugmasini kutadi: shunda qo‘ygan odam vazifani ko‘rganingiz va qabul qilganingizni biladi. Olingani — «ishda», ostida **«Bajarildi»** va **«Bajarilmadi»**. Muddati o‘tgan vazifa qizil rang bilan ajratilgan va «muddati o‘tgan» deb belgilangan.",
            "**«Muddatni ko‘chirish»** variantlarni ochadi: «+1 soat», «Ertaga 18:00», «+3 kun», «Bir hafta» — yoki «Shu sanaga» tugmasi bilan o‘z sanangiz va vaqtingiz. «+1 soat», «+3 kun» va «Bir hafta» muddatdan hisoblanadi, agar u o‘tib ketgan yoki muddat bo‘lmagan bo‘lsa — hozirgi paytdan, toki yangi muddat o‘tmishda qolmasin. Muddatsiz vazifada bu joyda xuddi shu variantlar bilan **«Muddat belgilash»** turadi. Muddatni ijrochi ham, qo‘ygan odam ham ko‘chiradi — ikkinchi tomonga bot yangi muddatni darhol yozadi. Har bir ko‘chirish vazifa tarixida qoladi: eski muddat, yangisi va kim ko‘chirgani.",
            "**«Men qo‘yganlar»** — siz boshqalarga qo‘ygan vazifalar va ular hozir qanday holatda: «yangi» (hali olinmagan), «ishda», «bajarildi», «bajarilmadi», «muddati o‘tgan». Yopilganlari bu yerda yana bir hafta ko‘rinadi. «Bajarildi» va «Bajarilmadi» ni faqat vazifa kimda bo‘lsa, o‘sha bosadi — shuning uchun «bajarildi» doim ijrochining o‘zi bajarganini bildiradi. Siz muddatni ko‘chirishingiz yoki vazifa xato qo‘yilgan yoki endi kerak bo‘lmasa, **«Vazifani bekor qilish»** ni bosishingiz mumkin: vazifa «bekor qilingan» bo‘ladi, ijrochiga xabar boradi, uning Telegramidagi tugmalar «🚫 Задача отменена» ga almashadi.",
            "**«Vazifa qo‘yish»** — blok pastida: «Kimga» (belgilar: bir kishi yoki bir nechta), «Nima qilish kerak», «Batafsil (ixtiyoriy)», «Loyiha (ixtiyoriy)» va «Muddat» — «bugun 18:00 gacha», «ertaga» va «3 kundan keyin» (ikkalasi ham 18:00 gacha), «muddatsiz» yoki «boshqa sana». Vaqt hamma joyda Toshkent vaqti. Loyiha [«Loyihalar»](/admin/projects) bo‘limidagi ochiq loyihalardan tanlanadi: avval u yerda mijoz loyihasi qo‘shiladi, keyin unga vazifalarni biriktirish mumkin. Loyihani ham, muddatni ham ko‘rsatish shart emas. Bir nechta kishi belgilansa, har biriga xuddi shu matn, muddat va loyiha bilan o‘z vazifasi qo‘yiladi: har kim uni o‘zi ishga oladi va yopadi, muddat har biriniki alohida ko‘chiriladi, «Men qo‘yganlar» da esa kim boshlagani va kim hali boshlamagani ko‘rinadi. Ro‘yxatda o‘zingiz darhol belgilangansiz — vazifa sizga bo‘lmasa, belgini olib tashlang. Vazifa qo‘yilishi bilan bot ijrochiga darhol Telegramda yozadi — belgilanganlarning har biriga. O‘zingizga qo‘ygan vazifa darhol «ishda» — uni olish shart emas, bot ham u haqda yozmaydi. Kim nimani qo‘ygani, olgani, yopgani, ko‘chirgani va bekor qilgani amallar jurnaliga yoziladi.",
          ],
        },
        {
          id: "tasks-filter",
          title: "Vazifalarda tartib, guruhlar va loyihalar",
          body: [
            "Sukut bo‘yicha vazifalar eng yaqin muddatdan eng uzog‘iga qarab boradi: nima yonayotgan bo‘lsa, o‘sha tepada. Muddatsiz vazifalar — oxirida, yangilari birinchi. «Men qo‘yganlar» da avval ochiqlari, pastroqda — hafta ichida yopilganlari.",
            "Ro‘yxatlar ustida — filtr. **«Guruhlash»**: «guruhlamaslik» (shunchaki muddat bo‘yicha), «muddat bo‘yicha» — «Muddat o‘tgan», «Muddat bugun», «Muddat ertaga», «Yaqin 7 kun ichida», «Keyinroq», «Muddatsiz» to‘plamlari; «loyiha bo‘yicha» — har bir loyihaning vazifalari birga, «Loyihasiz» oxirida; «odam bo‘yicha» — «Menga» da kim qo‘ygani bo‘yicha, «Men qo‘yganlar» da kimga qo‘yilgani bo‘yicha. Guruh ichida tartib o‘sha — eng yaqin muddatdan.",
            "**«Loyiha»** bitta loyihaning yoki «Loyihasiz» vazifalarni qoldiradi. Tanlang va **«Ko‘rsatish»** ni bosing. Tanlov sahifa manzilida saqlanadi: vazifalardagi tugmalar bosilgandan keyin u tushib qolmaydi, bu sahifani xatcho‘plarda ham saqlash mumkin.",
            "Loyihali vazifa qatorida loyiha nomi bor — bosing, loyiha kartochkasi ochiladi. Loyiha kartochkasida — uning barcha vazifalari va «Vazifa qo‘yish» havolasi: u bosh sahifaga, formada loyiha allaqachon tanlangan holda olib boradi.",
          ],
        },
        {
          id: "tasks-bot",
          title: "Vazifalar Telegramda va eslatmalar",
          body: {
            manager: [...TASKS_BOT, "Agar vazifalar haqidagi Telegram xabarlari sizga kerak bo‘lmasa, ularni rahbar yoki egasi o‘chiradi — bildirishnomalaringizdagi «Vazifalar» belgisi bilan. Vazifalar bunda bosh sahifada qoladi, brauzerdagi ovoz esa avvalgidek ishlaydi."],
            head: [...TASKS_BOT, "Vazifalar haqidagi xabarlar odamning [bildirishnomalaridagi](#team-notices) «Vazifalar» belgisi bilan o‘chiriladi — o‘zingizda va menejerlaringizda ularni «Jamoa» bo‘limida o‘zgartirasiz. Vazifalar bunda bosh sahifada qoladi, brauzerdagi ovoz ishlaydi."],
            admin: [...TASKS_BOT, "Vazifalar haqidagi xabarlar [bildirishnomalardagi](#team-notices) «Vazifalar» belgisi bilan o‘chiriladi — istalgan xodimda, «Jamoa» bo‘limida. Vazifalar bunda bosh sahifada qoladi, brauzerdagi ovoz ishlaydi."],
          },
        },
        {
          id: "tasks-alerts",
          title: "Brauzerdagi ovoz va bildirishnomalar",
          body: [
            "Panel ochiq ekan — istalgan bo‘limda — u har 45 soniyada serverdan yangilik bor-yo‘qligini so‘raydi: sizga qo‘yilgan vazifa, vazifangizni qo‘ygan odam tomonidan ko‘chirish yoki bekor qilish, yoki siz qo‘ygan vazifa bo‘yicha qadam (oldi, bajarildi, bajarilmadi, muddat ko‘chirildi). Bo‘lsa — qisqa «din-don» chalinadi, o‘ng pastki burchakda «Vazifalarni ochish» tugmali plashka chiqadi, bosh sahifa esa o‘zi yangilanadi.",
            "Tizim bildirishnomasi ham chiqishi uchun — hatto varaq yig‘ilgan bo‘lsa ham — vazifalar blokidagi **«Bildirishnomalarni yoqish»** ni bosing va brauzer oynasida ruxsat bering. Brauzer ruxsatni faqat bosilgandan keyin so‘raydi — shuning uchun tugma. Ruxsatdan keyin uning o‘rnida — «Bildirishnomalar yoqilgan».",
            "Agar brauzer taqiqlagan bo‘lsa, tugma o‘rnida maslahat chiqadi: bildirishnomalarga sayt sozlamalarida (manzil chap tomonidagi belgi) ruxsat berish mumkin. Ovozni brauzer paneldagi birinchi bosishdan keyin yoqadi — undan oldin sahifa ovoz chiqara olmaydi, barcha brauzerlar shunday ishlaydi. O‘z amallaringiz ovoz bilan belgilanmaydi. Panel yopiq bo‘lsa — brauzerda hech narsa yo‘q, Telegram qoladi.",
          ],
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
              "**Kechasi, 18:00 dan 08:00 gacha**, yarim soat qoidasi ishlamaydi — lid darhol navbatdagi hammaga ochiq. Lekin oyiga teng ulushdan ko‘p olib bo‘lmaydi: ulushingizni olib bo‘lgan bo‘lsangiz, «🌙 …Oylik ulushingizni allaqachon oldingiz — u kamroq olganlar uchun» yozuvini ko‘rasiz. Aks holda kechasi lidlarni yana uxlamay o‘tirgan odam olib ketardi.",
              "Lid boshqa odamning navbatida turganda, kartochkada mijozning niki yashirin — «yashirilgan — lid hozir sizniki emas». O‘zingizning [aloqalaringizdan](/admin/prospect) kelgan lidlar navbatga tushmaydi: ular darhol sizniki.",
              "Agar kartochka hech kimga yetib bormagan bo‘lsa — masalan, server bir muddat Telegram bilan aloqani yo‘qotgan bo‘lsa, — aloqa tiklangach, u «⚠️ Досылка: карточка не дошла из-за сбоя связи» belgisi bilan keyinroq keladi. Bunda lid qayta yuborilgan paytdagi qoidalar bo‘yicha yangidan tarqatiladi: kunduzi — navbat bilan, kechasi — hammaga. Uch sutkadan eski lidlar qayta yuborilmaydi.",
              "**«Hamkordan» lid — navbatdan tashqari.** Bu hamkor o‘z kabinetida biriktirgan kompaniya: u mijoz uchun kafil bo‘lgan va unga birinchi bo‘lib qo‘ng‘iroq qilish kerak. Bunday lid darhol hammaga ochiq — «✅ Взять в работу» ni birinchi bosgan oladi, yarim soatsiz va tungi ulushsiz. Kartochka barcha menejerlarga «🤝 Приоритет: клиента привёл партнёр» sarlavhasi bilan keladi va uni hech kim olmaguncha bot har 15 daqiqada 08:00 dan 18:00 gacha uni qayta yuboradi: «⏰ Клиент от партнёра всё ещё ничей». Kimdir lidni olishi bilan eslatmalar to‘xtaydi, hech kim olmasa — bir haftadan keyin.",
            ],
            head: [
              "Siz navbatda menejerlar bilan teng turasiz — qoidalar bir xil. Lidlar navbat bilan tarqatiladi, tezroq bosganga emas.",
              "**Kunduzi, Toshkent vaqti bilan 08:00 dan 18:00 gacha** (dam olish kunlari ham), yangi lid bitta odamga taklif qilinadi — shu oyda «oldi + o‘tkazib yubordi» soni eng kam bo‘lganiga. U Telegramda «⏳ Лид ваш на 30 минут» xabarini oladi. Qolganlar bu kartochkani ko‘rmaydi.",
              "30 daqiqada olmadi — lid navbatdagi odamga o‘tadi. O‘tkazib yuborish olingan imkoniyat sifatida hisoblanadi. Aylana davomida hech kim olmasa, lid hammaga ochiladi: birinchi bosgan oladi.",
              "**Kechasi, 18:00 dan 08:00 gacha**, lid darhol navbatdagi hammaga ochiq, lekin har kim oyiga teng ulushdan ko‘p ololmaydi.",
              "Lid bo‘sh turganda uning kontakti va yozishmasini siz ham ocholmaysiz — avval «O‘zimga olish». Mijozning niki navbati kelmagan hammadan yashirin. Aks holda navbatni bitta tugma bilan aylanib o‘tish mumkin bo‘lardi.",
              "Navbatda faqat Telegrami ulangan odamlar turadi: usiz odamga lid uniki ekanini aytib bo‘lmaydi.",
              "Serverning Telegram bilan aloqasi uzilgani sababli hech kimga yetib bormagan kartochka aloqa tiklanganda o‘zi qayta yuboriladi — «⚠️ Досылка: карточка не дошла из-за сбоя связи» belgisi bilan va joriy soat qoidalari bo‘yicha. Uch sutkadan eski lidlar qayta yuborilmaydi.",
              "**«Hamkordan» lid — navbatdan tashqari**: hamkor biriktirgan kompaniya. Darhol hammaga ochiq, birinchi bosgan oladi; «🤝 Приоритет: клиента привёл партнёр» kartochkasi barcha menejerlarga va sizga ketadi, lid hech kimniki bo‘lmaguncha bot uni har 15 daqiqada 08:00 dan 18:00 gacha takrorlaydi («⏰ Клиент от партнёра всё ещё ничей»). Bunday lidlar osilib qolmasligini kuzating: ularni studiya foiz to‘laydigan odamlar olib keladi.",
            ],
            admin: [
              "Siz **navbatdan tashqaridasiz**: istalgan bo‘sh lidni istalgan paytda olishingiz mumkin, tungi ulush cheklovi sizga ta’sir qilmaydi. Navbatda Telegrami ulangan menejerlar va rahbarlar turadi.",
              "Kunduzi (Toshkent vaqti bilan 08:00–18:00, har kuni) lid bitta odamga 30 daqiqaga taklif qilinadi — oy davomida «oldi + o‘tkazib yubordi» soni eng kam bo‘lganiga. Sizga va sotuv chatiga nusxa keladi: «👁 В очереди у @ник до 14:30. Вы вне очереди — можете взять сами». Lid kartochkasida ham u hozir kimdaligini ko‘rasiz; boshqalarga bu ism ko‘rsatilmaydi — tortishuv boshlanmasin.",
              "30 daqiqada olmadi — navbatdagiga; aylana tugadi — lid hammaga ochiq. Agar siz hozir kimgadir taklif qilingan lidni olsangiz, uning taklifi yopiladi va unga o‘tkazib yuborish deb hisoblanmaydi.",
              "Kechasi (18:00–08:00) lid darhol hammaga ochiq, lekin har kim oyiga teng ulushdan ko‘p olmaydi: «oy boshidan olinganlar ÷ navbatdagi odamlar soni», yuqoriga yaxlitlanadi.",
              "Navbatni chetlab o‘tadi: aloqalardan kelgan lidlar (darhol yozgan odamga biriktiriladi) va vitrinadan kelgan $10 000 dan qimmat buyurtmalar — ular faqat sizga keladi.",
              "Agar lid kartochkasi hech kimga yetib bormagan bo‘lsa — server Telegram bilan aloqani yo‘qotgan, — svip Telegram yana javob berganda uni qayta yuboradi: «⚠️ Досылка: карточка не дошла из-за сбоя связи» belgisi bilan va joriy soat qoidalari bo‘yicha. Tekshiruv har besh daqiqada; uch sutkadan eski lidlar qayta yuborilmaydi. 26 sentyabrda bir sutka hech kimniki bo‘lmay yotgan formadan kelgan tungi lid shunday yetib bordi.",
              "**«Hamkordan» lid — navbatdan tashqari**: uni hamkorning mijozni biriktirishi o‘zi ochadi ([Hamkorlar](/admin/partners)). Darhol hammaga ochiq, yarim soatsiz va tungi ulushsiz. Birinchi kartochka «🤝 Приоритет: клиента привёл партнёр» — menejerlar, rahbarlar va sizga; «⏰ Клиент от партнёра всё ещё ничей» eslatmalari — menejer va rahbarlarga har 15 daqiqada 08:00 dan 18:00 gacha, lidni olmaguncha, lekin bir haftadan ko‘p emas. Xodimning bildirishnoma belgilari bu kartochkalarga ta’sir qilmaydi — bu ustuvorlik.",
            ],
          },
        },
        {
          id: "take",
          title: "Lidni olish va undan voz kechish",
          body: [
            "Lidni kartochkadagi **«O‘zimga olish»** tugmasi bilan yoki to‘g‘ridan-to‘g‘ri Telegramda kartochka ostidagi **«✅ Взять в работу»** tugmasi bilan olasiz. Shundan keyin lid sizniki: holati «ishda», 4 soatdan keyin «Взят в работу — что дальше?» avtoeslatmasi keladi, kartochka kelgan hammada esa u «✅ В работе у @ник» ga almashadi.",
            "Ikki kishi bir vaqtda bossa, lid bittasiga tushadi, ikkinchisi «Лида уже взял кто-то другой» yozuvini ko‘radi. Hozir navbat sizniki bo‘lmasa — «Не ваша очередь: лид сейчас предложен другому». Aynan kimga — ataylab aytilmaydi.",
            "Telegramdagi **«🗄 Отклонить»** — bu «mijoz bizga kerak emas» degan qaror. Lid avval bosgan odamga biriktiriladi, keyin «qoldirilgan» holatini oladi: rad etishning muallifi bo‘lishi kerak, jurnalda kim qaror qilgani ko‘rinadi.",
            "Oldingiz, lekin olib borolmaysiz — kartochkada **«Navbatga qaytarish»** tugmasini bosing. Lid yana bo‘sh bo‘ladi va hammaga ochiladi, u bo‘yicha avtoeslatmalaringiz bekor qilinadi. U navbat aylanasini qaytadan boshlamaydi: har bir odamga yarim soatdan — allaqachon ish boshlangan lid uchun juda uzoq.",
          ],
        },
        {
          id: "list",
          title: "Lidlar ro‘yxati: filtrlar va ustunlar",
          body: {
            manager: [
              "Siz **bo‘sh lidlarni va o‘zingiznikini** ko‘rasiz. Hamkasb olgan lid sizga na ro‘yxatda, na to‘g‘ridan-to‘g‘ri havola orqali ko‘rsatiladi — egasi shunday qaror qilgan. Shuning uchun sizdagi «jami» plitkasi — bo‘shlar va sizniki birgalikda.",
              "Tepadagi filtrlar: «barcha lidlar / bo‘sh lidlar / meniki», ustuvorlik va holat. Ro‘yxatda har sahifada 50 ta lid.",
              "**«Qachon»** — Toshkent vaqti. **«Byudjet»** — summa emas, mijoz pul haqida qanday gapirayotgani: «aytilgan va tasdiqlangan», «bor, solishtirmoqda» yoki «aytilmagan». Formadan va aloqalardan kelgan murojaatlarda byudjet deyarli doim «aytilmagan» — pul haqida gap hali bo‘lmagan.",
              "**«Ball»** — lidning 0 dan 100 gacha bahosi va harf: A — 75 dan, B — 55 dan, C — 35 dan, D — undan past. **«Ustuvorlik»**: «issiq» — A baho yoki mijoz tirik odam so‘ragan; «iliq» — B; «pishib yetiladi» — qolganlari; «arxiv» — mijoz rad etgan.",
              "Ro‘yxatda kontaktlar ataylab yo‘q: kontakt [kartochkada](#leads-card) ochiladi va har bir ochilish yozib qo‘yiladi.",
              "«Hamkordan» lidlar sariq rang bilan ajratilgan va «hamkordan» deb belgilangan. Bunday lid hech kimniki bo‘lmaguncha, istalgan filtrda **ro‘yxatda birinchi** turadi, «ustuvor — birinchi bo‘lib oling» belgisi bilan; olinganda vaqti bo‘yicha o‘z joyiga o‘tadi, lekin ajratilgan holda qoladi.",
            ],
            head: [
              "Siz **studiyaning barcha lidlarini** ko‘rasiz — bo‘shlarini, o‘zingiznikini va boshqalarnikini. Filtrlar: «barcha lidlar / bo‘sh lidlar / meniki», ustuvorlik va holat; har sahifada 50 ta.",
              "**«Byudjet»** — summa emas, mijoz pul haqida qanday gapirayotgani: «aytilgan va tasdiqlangan», «bor, solishtirmoqda» yoki «aytilmagan». **«Ball»** — 0 dan 100 gacha baho va harf: A — 75 dan, B — 55 dan, C — 35 dan, D — undan past. **«Ustuvorlik»**: «issiq» — A yoki tirik odam so‘ragan, «iliq» — B, «pishib yetiladi» — qolganlari, «arxiv» — rad etgan.",
              "Holat ostida lidni olib borayotgan odamning niki ko‘rinadi. Ro‘yxatda kontaktlar yo‘q — ular [kartochkada](#leads-card) ochiladi va jurnalga yoziladi.",
              "«Hamkordan» lidlar sariq rang bilan ajratilgan. Hech kimniki bo‘lmaguncha — ro‘yxatda birinchi, «ustuvor — birinchi bo‘lib oling» belgisi bilan; olinganda vaqti bo‘yicha joyiga o‘tadi, ajratish qoladi.",
            ],
            admin: [
              "Ro‘yxat — «Lidlar» varag‘ida. Siz barcha lidlarni ko‘rasiz. Filtrlar: «barcha lidlar / bo‘sh lidlar / meniki», ustuvorlik va holat; har sahifada 50 ta.",
              "**«Byudjet»** — summa emas, mijoz pul haqida qanday gapirayotgani («aytilgan va tasdiqlangan», «bor, solishtirmoqda», «aytilmagan»). **«Ball»**: A — 75 dan, B — 55 dan, C — 35 dan, D — undan past. **«Ustuvorlik»**: «issiq» — A yoki odam so‘ragan, «iliq» — B, «pishib yetiladi» — qolganlari, «arxiv» — rad etgan.",
              "Ro‘yxatda kontaktlar ataylab yo‘q: aks holda «kontaktlarni kim ko‘rgan» degani «panelni ochgan hamma» degani bo‘lardi. Kartochkada kontaktning har bir ochilishi — [jurnalda](/admin/audit) bitta qator.",
              "«Hamkordan» lidlar sariq rang bilan ajratilgan; hech kimniki bo‘lgani ro‘yxatda birinchi turadi, «ustuvor — birinchi bo‘lib oling» belgisi bilan. Bunday lid kartochkasida hamkor bergan hamma narsa bor (nom, STIR, kontakt, sayt, nima kerak), «Qayerdan yozgan» esa — «mijozni hamkor kabinetda biriktirgan».",
            ],
          },
        },
        {
          id: "card",
          title: "Lid kartochkasi",
          body: {
            manager: [
              "Ro‘yxatdan, «Zudlik bilan bog‘lanish» blokidan va Telegramdagi «🔓 Открыть карточку» tugmasi bilan ochiladi — bu tugma panelga o‘zi kiritadi. Har bir ochilish yozib qo‘yiladi.",
              "**«Mas’ul»** — lid kimga biriktirilgan. Shu yerda [«O‘zimga olish» va «Navbatga qaytarish»](#leads-take) hamda [«Berishni so‘rash»](#leads-transfer) tugmalari bor.",
              "**«Holat»** — «yangi», «ishda», «qoldirilgan», «yutilgan», «yutqazilgan». Har bir suhbatdan keyin o‘zgartiring: [statistika](/admin/stats) va «Zudlik bilan bog‘lanish» holatlar bo‘yicha hisoblanadi. «Yutilgan», «yutqazilgan» va «qoldirilgan» avtoeslatmalarni bekor qiladi. «Yangi» faqat bo‘sh lidda bor: sizning lidingizda u yo‘q, lidni qo‘yib yuborish — «Navbatga qaytarish».",
              "**«Mijoz kontakti»** → «Kontaktni ko‘rsatish». Faqat olingan lid bo‘yicha ochiladi: avval «O‘zimga olish». Har bir ochilish jurnalga tushadi, shuning uchun yozmoqchi bo‘lganingizda oching.",
              "**«Mijoz bilan yozishma»** → «Yozishmani ko‘rsatish»: mijoz saytdagi yoki botdagi assistentga vazifa, pul va muddatlar haqida aytgan hamma narsa. Bu ham faqat olgandan keyin ochiladi va bu ham yoziladi. Formadan kelgan murojaatlarda yozishma yo‘q.",
              "**«Muhokama»** — mijoz haqida butun jamoa uchun izohlar; lidni olib borayotgan odamga Telegramda xabar keladi. Mijoz kontaktini u yerga yozmang. Pastroqda — brif, saytdan kelgan smeta va izohlar. Aloqalardan kelgan lidlar haqida — [aloqa bo‘yicha birlamchi suhbat](#prospect-replies) bandi.",
              "Ariza raqami yonidagi sariq belgi — mijozda 30% chegirma bor va nima uchun ekani yozilgan: **«birinchi daqiqada yozgan»** — u saytda birinchi daqiqa taymeri ishlayotganda yordamchiga saytda yoki Telegramda yozgan; **«20 soniyada ulgurmadik»** — javob kafolati ishlagan. Chegirma mijozga allaqachon ko‘rsatilgan, u muhokama qilinmaydi — uni hisob-kitobda inobatga oling. Kutish uchun uzr so‘rash faqat ikkinchi holatda kerak.",
              "**«Kompaniya STIRi»** — mijoz o‘z STIRini (INN) aytgan bo‘lsa yoki u rekvizitlarida bo‘lsa, 9–12 raqamni yozing va **«STIRni saqlash»** ni bosing. Bu kompaniyani oldin hamkor o‘ziga biriktirgan bo‘lsa, lid uning mijoziga aylanadi: «Hamkor» maydonida «… hamkorining mijozi (… biriktirilgan)» paydo bo‘ladi, hamkorga mijoz kontaktlarisiz xabar ketadi. Lidni avvalgidek siz olib borasiz; hamkorga shunchaki buyurtma hisoblanadi. STIRni faqat o‘z lidingizga yozish mumkin.",
            ],
            head: [
              "Siz istalgan kartochkani ochasiz. Har bir ochilish yozib qo‘yiladi.",
              "**«Mas’ul»**: bo‘sh lid uchun [«O‘zimga olish»](#leads-take), olingan har qanday lid uchun «Navbatga qaytarish» va [«Berish»](#leads-transfer) — siz bergan lid darhol o‘tadi, tasdiqsiz.",
              "**«Holat»** istalgan lidda o‘zgartiriladi: «yangi», «ishda», «qoldirilgan», «yutilgan», «yutqazilgan». «Yutilgan», «yutqazilgan» va «qoldirilgan» avtoeslatmalarni bekor qiladi. «Yangi» — faqat bo‘sh lidda; biriktirilgan lidda u yo‘q, lidni «Navbatga qaytarish» bo‘shatadi.",
              "**«Kontaktni ko‘rsatish»** va **«Yozishmani ko‘rsatish»** olingan har qanday lid bo‘yicha ishlaydi. Bo‘sh lid bo‘yicha — faqat «O‘zimga olish» bosilgandan keyin: siz navbatda hamma bilan teng turasiz. Har bir ochilish jurnalga tushadi.",
              "**«Muhokama»** — butun jamoa uchun izohlar, lidni olib borayotgan odamga ular Telegramda keladi. Pastroqda — brif, smeta va izohlar.",
              "Ariza raqami yonidagi sariq belgi — mijozda 30% chegirma bor va nima uchun ekani yozilgan: **«birinchi daqiqada yozgan»** — u saytda birinchi daqiqa taymeri ishlayotganda yordamchiga saytda yoki Telegramda yozgan; **«20 soniyada ulgurmadik»** — javob kafolati ishlagan. Chegirma mijozga allaqachon ko‘rsatilgan, u muhokama qilinmaydi — uni hisob-kitobda inobatga oling. Kutish uchun uzr so‘rash faqat ikkinchi holatda kerak.",
              "**«Kompaniya STIRi»** → **«STIRni saqlash»** — istalgan lidda, 9–12 raqam. Kompaniyani hamkor biriktirgan bo‘lsa, lid uning mijoziga aylanadi: «Hamkor» maydonida — «… hamkorining mijozi (… biriktirilgan)», hamkorga — mijoz kontaktlarisiz xabar. Lidni kim olib borishi bundan o‘zgarmaydi.",
            ],
            admin: [
              "Siz istalgan kartochkani ochasiz va hamma narsani qila olasiz: olish, navbatga qaytarish, berish, holatni o‘zgartirish, kontakt va yozishmani ochish — bo‘sh lidda ham, olmasdan oldin. Har bir harakat jurnalga ismingiz bilan tushadi.",
              "Bo‘sh lidda tepada u hozir kimning navbatida turgani ko‘rinadi: «👁 В очереди у … до 14:30». Boshqalarga bu ism ko‘rsatilmaydi.",
              "**«Holat»**: «yutilgan», «yutqazilgan» va «qoldirilgan» avtoeslatmalarni bekor qiladi; «yangi» faqat bo‘sh lidda bor, biriktirilganda yo‘q — lidni «Navbatga qaytarish» bo‘shatadi.",
              "**«Muhokama»** butun jamoaga ko‘rinadi, lidni olib borayotgan odamga Telegramda keladi. Pastroqda — brif, smeta va assistent izohlari.",
              "Ariza raqami yonidagi sariq belgi — mijozda 30% chegirma bor va nima uchun ekani yozilgan: **«birinchi daqiqada yozgan»** — u saytda birinchi daqiqa taymeri ishlayotganda yordamchiga saytda yoki Telegramda yozgan; **«20 soniyada ulgurmadik»** — javob kafolati ishlagan. Chegirma mijozga allaqachon ko‘rsatilgan, u muhokama qilinmaydi — uni hisob-kitobda inobatga oling. Kutish uchun uzr so‘rash faqat ikkinchi holatda kerak. Bunday chegirmalar soni va sababi — [statistikada](/admin/stats), daqiqa uzunligi — serverdagi `FIRST_MINUTE_SECONDS` (odatda 60, 0 o‘chiradi).",
              "**«Kompaniya STIRi»** → **«STIRni saqlash»** — istalgan lidda. STIR bo‘yicha lid [hamkor biriktirgan mijoz](#partners-claims) sifatida taniladi: «Hamkor» maydonida — «… hamkorining mijozi (… biriktirilgan)», hamkorga xabar ketadi, liddan ochilgan loyiha hamkorni meros oladi.",
            ],
          },
        },
        {
          id: "reminders",
          title: "Eslatmalar",
          body: {
            manager: [
              "Eslatmalar — sizning xotirangiz: ular Telegramda botdan keladi, darhol **«Открыть»**, **«+2 часа»** va **«Готово»** tugmalari bilan.",
              "**Avtoeslatma** lidni olganingizdan 4 soat keyin o‘zi qo‘yiladi: «Взят в работу — что дальше?». Bir sutkadan keyin emas — ertalab kelib, kechgacha tegilmagan lid allaqachon sovib qolgan. Kartochkadagi «Avtoeslatmalarni o‘chirish» tugmasi bilan o‘chiriladi; qo‘lda qo‘ygan eslatmalaringiz esa qoladi.",
              "**O‘z eslatmangiz**: «Eslatmalar» blokida — «eslatish: 24 soatdan keyin» (0,5 soat va undan ko‘p bo‘lishi mumkin), «nima haqida eslatish» izohi va «Qo‘yish».",
              "Ro‘yxatdagi holatlar: «yuborildi», «muddati o‘tdi» (vaqt o‘tdi, bot hali urinib ko‘ryapti) va «yetkazilmadi» — besh urinishdan keyin. Bu bot sizga yozolmayotganini bildiradi: uni bloklamaganingizni tekshiring va botda «Старт» tugmasini bosing. Agar server Telegram bilan aloqani vaqtincha yo‘qotsa, urinishlar hisoblanmaydi: eslatma aloqani kutadi va keyinroq keladi.",
              "Bajardingizmi — kartochkada «bajarildi» yoki Telegramda «Готово» tugmasini bosing. Faqat o‘z eslatmangizni yopish mumkin.",
            ],
            head: [
              "Eslatmalar Telegramda **«Открыть»**, **«+2 часа»** va **«Готово»** tugmalari bilan keladi.",
              "**Avtoeslatma** — lid olingandan 4 soat keyin. Kartochkada o‘chiriladi, qo‘lda qo‘yilganlari esa qoladi.",
              "**O‘z eslatmangiz**: «eslatish: N soatdan keyin», izoh va «Qo‘yish». Siz istalgan lid bo‘yicha, jumladan jamoa lidlari bo‘yicha ham eslatma qo‘yishingiz va yopishingiz mumkin.",
              "Besh urinishdan keyingi «yetkazilmadi» — bot odamga yozolmayotganini bildiradi: u botni bloklamaganini tekshirib ko‘rsin. Serverning Telegram bilan aloqasi uzilishi urinish hisoblanmaydi — eslatma aloqa tiklanganda keladi.",
            ],
            admin: [
              "Eslatmalar Telegramda «Открыть», «+2 часа» va «Готово» tugmalari bilan keladi. Ularni svip yuboradi — jadval bo‘yicha har besh daqiqada bir marta ishga tushadigan jarayon. Agar u yarim soatdan ko‘p ishlamagan bo‘lsa, hammada bosh sahifada qizil [«Eslatmalar yetib bormayapti»](#leads-banner) ogohlantirishi chiqadi.",
              "Avtoeslatma — lid olingandan 4 soat keyin; qo‘lda — «eslatish: N soatdan keyin» va «Qo‘yish». Siz istalgan lid bo‘yicha eslatma qo‘yasiz va yopasiz.",
              "Besh urinishdan keyingi «yetkazilmadi» — bot odamga yozolmayapti: bot bloklangan yoki odam bir marta ham «Старт» tugmasini bosmagan. Urinishlar faqat Telegram javob berganda hisoblanadi: server Telegramni umuman ko‘rmasa, eslatma tashlab yuborilmaydi, kutadi.",
            ],
          },
        },
        {
          id: "transfer",
          title: "Lidni hamkasbga berish",
          body: {
            manager: [
              "Lidni uddalay olmayapsiz yoki mijoz hamkasbingizga ko‘proq mos — kartochkadagi «Berish» blokida, ro‘yxatda kimga ekanini tanlang, sababini yozing, keyin **«Berishni so‘rash»** tugmasini bosing.",
              "Rahbaringiz yoki egasi so‘rovni tasdiqlamaguncha lid sizda qoladi: ularga Telegramda «Подтвердить» va «Отклонить» tugmalari bilan xabar boradi — ular panelsiz, shu yerning o‘zida hal qilishadi. Qaror kutilayotganda lid ikki odam o‘rtasida osilib qolmaydi.",
              "Tasdiqlashdi — lid hamkasbda, unga xabar va 4 soatdan keyin yangi eslatma keladi. Aloqadan kelgan lid yozishma bilan birga o‘tadi: mijoz javoblari, qayta yozish va model imzosi endi hamkasbda. Rad etishdi — sizga «Передачу не подтвердили. Лид остаётся у вас» keladi.",
              "Bo‘sh lid berilmaydi — uni «O‘zimga olish» tugmasi bilan olishadi.",
            ],
            head: [
              "Sizning tugmangiz — **«Berish»**: lid tanlangan odamga darhol o‘tadi, unga «…передал вам лид. Он уже ваш» xabari keladi.",
              "Jamoangiz menejerlarining so‘rovlari («Berishni so‘rash») sizga Telegramda **«✅ Подтвердить»** va **«✖ Отклонить»** tugmalari bilan keladi — xabarning o‘zida hal qiling; avval ko‘rmoqchi bo‘lsangiz, «Открыть лид» kartochkaga olib boradi. Xuddi shu so‘rovlar bosh sahifadagi «Qaroringizni kutmoqda» blokida va lid kartochkasida ham bor. Kimdir bittasi hal qilsa — qolganlarda tugmalar «Подтвердил …» yoki «Отклонил …» ga almashadi. Studiyadagi istalgan so‘rovni hal qila olasiz, faqat o‘z jamoangiznikini emas.",
              "Tasdiqlangan lidga 4 soatdan keyin yangi eslatma qo‘yiladi. Aloqadan kelgan lid yozishma bilan birga o‘tadi: mijoz xabarlari, qayta yozish va model imzosi — yangi mas’ulga. Oldingi mas’ulning eski eslatmalari o‘zi yopilmaydi — kerak bo‘lsa, ularni yoping.",
            ],
            admin: [
              "Sizning tugmangiz — **«Berish»**: lid darhol o‘tadi. Menejerlarning so‘rovlari sizga Telegramda **«✅ Подтвердить»** va **«✖ Отклонить»** tugmalari bilan keladi — xabarning o‘zida hal qilasiz, — shuningdek «Bugun» varag‘idagi «Qaroringizni kutmoqda» blokiga va lid kartochkasiga. Ularni rahbar ham hal qila oladi: u o‘z jamoasining so‘rovlarini xuddi shu tugmalar bilan oladi. Kim birinchi hal qilsa — qolganlarda tugmalar natijaga almashadi va hal qilingan so‘rovni qayta bosib bo‘lmaydi.",
              "Bu sizning qoidangiz bo‘yicha shunday qilingan: lid rahbar yoki sizning tasdig‘ingiz bilan beriladi va qaror chiqquncha oldingi mas’ulda qoladi. Aloqadan kelgan lid yozishma bilan birga o‘tadi — lid kimda bo‘lsa, mijoz bilan suhbat ham o‘shanda.",
            ],
          },
        },
        {
          id: "urgent",
          title: "«Zudlik bilan bog‘lanish»",
          body: [
            "Bu yerda «ishda» holatidagi, juda uzoq harakatsiz turgan lidlar: «issiq» — 2 kun va undan ko‘p, «iliq» — 3, «pishib yetiladi» — 5, «arxiv» — 14.",
            "Harakat — bu panelda lid bilan har qanday ish (hatto kartochkani ochish ham) yoki «Muhokama» blokidagi xabar. Shuning uchun lid bilan shug‘ullanishingiz bilan u ro‘yxatdan chiqadi. Lekin halolroq yo‘li — qadam qo‘yish: mijozga yozish, holatni o‘zgartirish, eslatma qo‘yish.",
            "Tepada — eng eskilari. Bo‘sh bo‘lsa — «Ishdagi barcha lidlarda yaqinda harakat bo‘lgan».",
          ],
        },
        {
          id: "plan-fact",
          title: "«Reja va fakt»",
          body: {
            manager: [
              "Sizga hafta yoki oyga qo‘yilgan maqsadlar: **«tushumlar, $»** (loyihalaringiz bo‘yicha mijozlardan kelgan pul), **«yutilgan lidlar»** va **«birinchi bog‘lanishlar»** — «Kontaktni ko‘rsatish» tugmasini necha marta bosganingiz.",
              "Chiziq qancha bajarilganini ko‘rsatadi: 100% dan — yashil, 50% dan past — tilla rang. Hafta Toshkent vaqti bilan dushanbadan hisoblanadi.",
              "Rejani rahbar yoki egasi qo‘yadi — odam o‘ziga o‘zi reja qo‘ymaydi.",
            ],
            head: [
              "Hafta yoki oyga maqsadlar: «tushumlar, $», «yutilgan lidlar», «birinchi bog‘lanishlar» («Kontaktni ko‘rsatish» bosilishlari).",
              "Siz menejeringizga **yangi reja qo‘yishingiz** mumkin: «Kimga», «Davr», «Ko‘rsatkich», «Maqsad» va «Reja qo‘yish». Qo‘yilgan rejani o‘zgartirish va olib tashlashni faqat egasi qila oladi, o‘ziga esa hech kim reja qo‘ymaydi.",
              "Chiziq: 100% dan — yashil, 50% dan past — tilla rang.",
            ],
            admin: [
              "«Jamoa» varag‘ida. Siz istalgan odamga reja qo‘yasiz, yana «o‘zgartirish» va «olib tashlash» bilan istalgan rejani o‘zgartira va olib tashlay olasiz. Rahbar faqat o‘z menejeriga reja qo‘sha oladi — siz shunday qaror qilgansiz.",
              "Ko‘rsatkichlar: «tushumlar, $», «yutilgan lidlar», «birinchi bog‘lanishlar» (bu «Kontaktni ko‘rsatish» bosilishlari). Davrlar: dushanbadan boshlanadigan joriy hafta va joriy oy.",
            ],
          },
        },
        {
          id: "coach",
          title: "Tavsiyalar",
          body: {
            manager: [
              "**«Haftalik tavsiyalar»** har dushanba Toshkent vaqti bilan 06:00 dan boshlab o‘tgan haftadagi raqamlaringiz bo‘yicha tuziladi: «O‘tgan davr», «Nimaga e’tibor berish kerak», «Nima qilish kerak», «Nimani o‘rganish kerak», «Nima yaxshi».",
              "Bu baho emas, maslahat. Bir haftadan keyin — yangi o‘lchov va yangi reja.",
            ],
            head: [
              "**«Bugun uchun»** — har kuni ertalab 07:00 dan: bugun lidlaringiz va jamoa lidlari bo‘yicha nima qilish kerak.",
              "**«Haftalik tavsiyalar»** — har dushanba 06:00 dan, sizga va jamoadagi har bir kishiga. Jamoaga tavsiyalar sizga «Jamoaga haftalik tavsiyalar» blokida ko‘rinadi — ularni yig‘ilishda muhokama qilish qulay.",
            ],
            admin: [
              "Haftalik tavsiyalar har dushanba 06:00 dan sizdan boshqa hamma uchun tuziladi; «Bugun uchun» — har kuni ertalab 07:00 dan siz va rahbarlar uchun.",
              "«qayta tayyorlash» tugmasi faqat sizda bor: har bir yig‘ish — modelga so‘rovlar, ya’ni pul.",
            ],
          },
        },
        {
          id: "team-week",
          title: "«Jamoa: shu hafta»",
          roles: ["head", "admin"],
          body: {
            head: [
              "Siz va jamoangiz bo‘yicha jadval, strelka — o‘tgan haftaga nisbatan.",
              "**«Ishda»** — «ishda» holatidagi lidlar. **«Shoshilinch»** — ulardan nechtasi [uzoq vaqt harakatsiz](#leads-urgent). **«Aloqalar»** — odamning hafta davomida lidlar bilan barcha harakatlari: kartochkani, kontaktni ochdi, eslatma, holat, muhokamadagi xabar. Bu lidlar bilan ish, sovuq aloqalar emas. **«Bog‘lanishlar»** — «Kontaktni ko‘rsatish» bosilishlari. **«Yutilgan»**, **«Tushumlar»** — hafta davomida uning loyihalari bo‘yicha kelgan pul. **«Aloqalar rejasi»** — sovuq aloqalar siz [«Jamoa»](/admin/team) bo‘limida qo‘yadigan rejaga nisbatan.",
              "«Hafta yetakchilari» jamoada ikki va undan ko‘p odam bo‘lganda chiqadi.",
            ],
            admin: [
              "Sizdan boshqa hamma bo‘yicha jadval; strelka — o‘tgan haftaga nisbatan.",
              "**«Aloqalar»** — odamning hafta davomida lidlar bilan barcha harakatlari (ochdi, kontakt, eslatma, holat, muhokama), sovuq aloqalar emas; sovuq aloqalar — **«Aloqalar rejasi»** ustunida. **«Bog‘lanishlar»** — «Kontaktni ko‘rsatish» bosilishlari. **«To‘lanadi»** ustunini faqat siz ko‘rasiz.",
            ],
          },
        },
        {
          id: "banner",
          title: "Qizil ogohlantirish «Eslatmalar yetib bormayapti»",
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
      what: "Saytdagi do‘kondan tayyor mahsulotlarga buyurtmalar — mijozlar loyihalari emas. Xaridor rekvizitlari bilan buyurtma qoldiradi, biz hisob chiqaramiz, u naqd pulsiz to‘laydi va fayllarni oladi. Barcha xodimlar barcha buyurtmalarni ko‘radi va istalganini olib bora oladi; kim oxirgi bosgan bo‘lsa, buyurtmada o‘sha «mas’ul: …» bo‘ladi.",
      items: [
        {
          id: "flow",
          title: "Buyurtma yo‘li",
          body: [
            "«yangi» → «hisob-faktura chiqarilgan» → «to‘langan» → «topshirilgan». Yoki «bekor qilingan». Tepadagi filtrlar — shu holatlar bo‘yicha.",
            "Xaridor kontakti darhol ko‘rinadi: hisob chiqarilishi uchun rekvizitlarni o‘zi qoldirgan. Kontakt yonidagi «bot ulangan» xaridor botimizni ulaganini bildiradi — hisob va to‘lov haqidagi bildirishnomalar unga o‘sha yerga boradi.",
            "Buyurtma qotib qolsa, Telegramga eslatma keladi: 2 kun hisobsiz, hisob 14 va 30 kun to‘lanmagan, to‘langan, lekin beriladigan fayl yo‘q.",
          ],
        },
        {
          id: "invoice",
          title: "Summa va hisob",
          body: [
            "Ba’zi mahsulotlarning narxi — oraliq, va buyurtma summasiz keladi. Uni «summa, $» maydoniga yozing va **«kiritish»** tugmasini bosing. Hisobdan keyin summani o‘zgartirib bo‘lmaydi.",
            "**«hisob-faktura chiqarish»** — summa kerak. Hisob raqami o‘zi beriladi; qayta bosish raqamni o‘zgartirmaydi. Xaridor hisobni o‘z buyurtmasi sahifasida ko‘radi (havolani u buyurtma berayotganda olgan), bot ulangan bo‘lsa — yana xabar ham oladi. Xabarda to‘lov havolasi ataylab yo‘q: hisobdagi rekvizitlar bo‘yicha to‘lashadi.",
            "Tepada «Bank rekvizitlari sozlanmagan» turgan bo‘lsa — hisob chiqadi, lekin xaridor qayerga to‘lashni ko‘rmaydi. Egasiga ayting.",
          ],
        },
        {
          id: "paid",
          title: "To‘lov va fayllarni berish",
          body: [
            "Pul hisob raqamga tushdi — **«ko‘chirmadagi qator»** maydoniga bank ko‘chirmasidagi qatorni yozing va **«to‘lov olindi»** tugmasini bosing. Qatorsiz bo‘lmaydi: aks holda bir oydan keyin to‘lov bo‘lganini isbotlab bo‘lmaydi.",
            "Shu daqiqadan xaridorga fayllar ochiladi — agar egasi ularni «Relizlar» bo‘limiga joylagan bo‘lsa. Yuklab olish — jami 20 tagacha va kuniga 10 tagacha, o‘sha faylni 10 daqiqa ichida qayta yuklash hisoblanmaydi.",
            "Birinchi yuklab olish o‘zi «topshirilgan» qo‘yadi. **«kod topshirildi»** tugmasi — boshqacha berganingizda, masalan, repozitoriyga kirish huquqi bilan. To‘lovdan oldin u ishlamaydi: kodni berish — bekor qilib bo‘lmaydigan yagona qadam.",
          ],
        },
        {
          id: "access",
          title: "Havolalar, kirish va bekor qilish",
          body: [
            "**«havolani qayta chiqarish»** — buyurtma sahifasiga yangi havola, eskisi ishlamay qoladi. Yangisi bir marta ko‘rsatiladi — uni darhol xaridorga yuboring.",
            "**«fayllarga kirishni bekor qilish»** yuklab olishni butunlay yopadi: berilgan havolalar ishlamay qoladi, buyurtma sahifasida esa tugma o‘rniga xaridor «Fayllarga kirish yopildi» deb ko‘radi. Sahifa va hisob saqlanadi — u o‘z hujjatlarini yo‘qotmaydi. Buyurtmada «Kirish: … dan yopiq» paydo bo‘ladi. **«fayllarga kirishni qaytarish»** yuklab olishni qayta ochadi, lekin eski havolalar o‘lik qoladi — shuning uchun havola sizib chiqqan bo‘lsa, «fayllarga kirishni bekor qilish», keyin «fayllarga kirishni qaytarish» tugmasini bosing: sizib chiqqani o‘chadi, xaridor esa o‘z sahifasidan yangisini yuklab oladi.",
            "**«bekor qilish»** — xaridorga bildirishnoma boradi. **«ishga qaytarish»** holatni tanlab emas, sanalar bo‘yicha tiklaydi: hisob chiqarilgan bo‘lsa — «hisob-faktura chiqarilgan» qaytadi.",
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
            "**20 dan past** — darhol «mos emas», lentada xalaqit bermaydi. **60 dan** — Telegramdagi «Devuz Scout» kanaliga keladi. **70 dan** — kuchli signal: bir-ikki daqiqadan keyin svip undan tayyor birinchi xabar bilan lid ochadi va [lidlar navbati](#leads-queue) bo‘yicha yuboradi. «субподряд» toifasi har qanday bahoda kanalga ketadi.",
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
            "Keyin signal kartochkasida belgilang: **«javob berildi»** yoki **«mos emas»**. «o‘zi keldi» avtomatik qo‘yiladi — odam botimizga yozganda yoki signal lidga aylanganda.",
            "Plitkalar: «signallar» — jami, «ochilmagan» — qaror kutayotganlar, «o‘zlari kelgan», «bizgacha yetib keladi» — ko‘rib chiqilganlarning qancha qismi bizgacha yetib kelgani. Signal lidning bir qismiga aylanmasa, 90 kun saqlanadi.",
          ],
        },
        {
          id: "health",
          title: "Skaut ishlayaptimi",
          body: {
            manager: [
              "Tepadagi tilla rangli ogohlantirish — nimadir noto‘g‘ri: skaut jim, birorta chatni o‘qimayapti yoki model ishlamayapti. «Akkaunt berilgan 29 ta chatdan 12 tasini o‘qiyapti» ogohlantirishi — chatlarning bir qismi o‘qilmayapti. Ikkala holatda ham egasiga ayting: bu paneldan tuzatilmaydi.",
            ],
            head: [
              "Tepadagi tilla rangli ogohlantirish — nosozlik: «Skaut N daqiqadan beri jim» (jarayon to‘xtagan), «birorta ham chatni o‘qimayapti» yoki «Model ishlamayapti». «O‘qilmayapti» ro‘yxati bilan «Akkaunt berilgan Y ta chatdan X tasini o‘qiyapti» — ishchi akkaunt bu chatlarga qo‘shilmagan. Egasi tuzatadi.",
            ],
            admin: [
              "«Skaut N daqiqadan beri jim» — serverdagi jarayon yiqilgan yoki to‘xtatilgan: `systemctl status devuz-scout`. «Model ishlamayapti» — kalitda yoki undagi pulda muammo.",
              "«Akkaunt berilgan Y ta chatdan X tasini o‘qiyapti» va «O‘qilmayapti» ro‘yxati — ishchi akkaunt bu chatlarga qo‘shilmagan yoki manzil ochilmagan. Ishchi akkauntdan qo‘lda qo‘shilish kerak: paneldan bu qilinmaydi.",
              "«Mexanizm butun: … Ishlab chiqish so‘rovlari hali bo‘lmagan» — bu chatlardagi jimlik, nosozlik emas.",
            ],
          },
        },
      ],
    },

    /* ── Касания ──────────────────────────────────────────────────────── */
    "/admin/prospect": {
      what: "Sovuq aloqalar: kompaniyalarni topamiz, saytlarini tekshiramiz, model esa qisqa birinchi xabar yozadi: saytdagi odam o‘zi tekshira oladigan ikki-uchta haqiqiy muammo va 12 soatda yangi sayt prototipini yig‘ib berish taklifi — yoki panel uning sayti ma’lumotlari bo‘yicha allaqachon yig‘gan prototipga darhol havola. Studiyaning ishchi akkaunti yuboradi, mijoz javoblarini model olib boradi, odam kerak bo‘lganda esa yozgan odamni chaqiradi. Aloqadan kelgan lid darhol sizniki, navbatsiz.",
      items: [
        {
          id: "portion",
          title: "Kunlik to‘plam",
          body: {
            manager: [
              "Ish kunlari soat 07:00 da tizim umumiy zaxiradagi kompaniyalarni teng tarqatadi — aylana bo‘yicha bittadan. Sizga qanchasi: haftalik aloqalar rejasi 5 ga bo‘linadi (kuniga 2 dan 15 gacha). Reja bo‘lmasa — kuniga 5 ta.",
              "09:00 ga kelib xatlar tayyor bo‘ladi va to‘plam sizga Telegramda keladi: har bir kompaniyada — kimga yozish, gapni nimadan boshlash va matn (matnni bossangiz — nusxalanadi). Tugmalar: **«📤 Отправить через бота»**, **«WhatsApp ↗»**, **«✋ Написал сам»**, **«✖ Не подходит»** va **«Открыть в панели»**.",
              "Xuddi shu to‘plam — bo‘lim tepasida, «Bugungi kunlik to‘plamingiz: 5 tadan 2 tasi bajarildi» blokida, «matn tayyor», «bajarildi», «mos kelmadi» holatlari bilan; o‘rniga berilgan kompaniyalar «almashtiruv» deb belgilangan.",
              "**18:00 da** bajarilmagani umumiy zaxiraga qaytadi, xat esa o‘chiriladi — u sizning ismingiz bilan imzolangan. Rahbar va egasi hisobot oladi: har kimning kun davomidagi aloqalari va to‘plamdan qanchasi bajarilgani.",
              "Faqat aloqa bajarilgan deb hisoblanadi: «Yuborish» va «Написал сам» / «O‘zim bog‘landim» — Telegramdan ham, paneldan ham bir xil. To‘plam — aynan shuncha aloqa: «Не подходит» hisobga kirmaydi, lekin uning o‘rniga darhol zaxiradan **almashtiruvchi** keladi — Telegramga tayyor matnli «🔁 Замена» kartochkasi (matn bir daqiqagacha yoziladi) va to‘plam blokiga. Paneldagi kartochkadagi «yozmaymiz» uchun ham xuddi shunday. Kuniga almashtirishlar — ikki to‘plamdan oshmaydi: zaxira bo‘sh bo‘lsa yoki almashtirishlar tugasa, bot tugma ostida shuni aytadi, kechki hisobotda esa bu «без замены» bo‘ladi. To‘plamdan ko‘proq kerak bo‘lsa — [«Получать лиды» oqimini](#prospect-stream) yoqing: to‘plamdan tashqari kompaniyalar, limitsiz.",
            ],
            head: [
              "Siz ham to‘plam olasiz: ish kunlari soat 07:00 da zaxiradagi kompaniyalar navbatdagi hammaga — sizga va menejerlarga teng tarqatiladi. Hajmi — haftalik reja ÷ 5 (2 dan 15 gacha), reja bo‘lmasa — 5.",
              "09:00 da to‘plam Telegramga tayyor matnlar va «📤 Отправить через бота», «WhatsApp ↗», «✋ Написал сам», «✖ Не подходит», «Открыть в панели» tugmalari bilan keladi. Bo‘limda u «Bugungi kunlik to‘plamingiz» blokida turadi.",
              "18:00 da bajarilmagani zaxiraga qaytadi, sizga esa Telegramga butun jamoa bo‘yicha hisobot keladi — egasiga boradigan xuddi o‘sha: «Имя — 7 касаний · порция 3 из 5, не подошло 2, без замены 1». Avval — odamning kun davomidagi barcha aloqalari: to‘plam, oqim va paneldan. Keyin — to‘plam: ertalabki taqsimotdan qanchasi bajarilgan. Pastda — hamma bo‘yicha jami. Faqat aloqalar hisoblanadi: «Не подходит» hisobga kirmaydi — uning uchun odamga darhol zaxiradan almashtiruvchi beriladi, kuniga ikki to‘plamgacha; «без замены» — zaxira bo‘sh edi yoki almashtirishlar tugagan. ⚠️ — to‘plam bo‘yicha birorta ham aloqa yo‘q, ✅ — to‘plam to‘liq bajarilgan. Odam [«Получать лиды» oqimini](#prospect-stream) yoqqan bo‘lsa, qavs ichida — nechta aloqa oqimdan kelgani: «7 касаний (поток 4)».",
              "Zaxirani [xaritalar bo‘yicha avtoqidiruv](#prospect-maps) va saytlarni qo‘lda tekshirish to‘ldiradi. Zaxira bo‘sh — to‘plamlar ham bo‘sh.",
            ],
            admin: [
              "Siz to‘plam olmaysiz. Ish kunlari soat 07:00 da zaxiradagi kompaniyalar menejerlar va rahbarlarga teng tarqatiladi: haftalik reja ÷ 5 (2 dan 15 gacha), reja bo‘lmasa — 5. Avval — bahosi eng yomon saytlar.",
              "Xatlar fonda tayyorlanadi, 09:00 ga kelib to‘plam odamlarga Telegramda ketadi (matnlarning bir qismi tayyor bo‘lmasa ham, 10:00 dan kechikmay). To‘plam — aynan shuncha aloqa: botdagi har bir «Не подходит» yoki paneldagi «yozmaymiz» uchun odamga darhol zaxiradan tayyor xatli almashtiruvchi beriladi, kuniga ikki to‘plamgacha. 18:00 da bajarilmagani zaxiraga qaytadi, sizga va rahbarlarga butun jamoa bo‘yicha bir xil hisobot keladi: «Имя — 7 касаний (поток 4) · порция 3 из 5, не подошло 2, без замены 1». Aloqalar — kun davomidagi hammasi: to‘plam, «Получать лиды» oqimi va paneldan yozilgani; to‘plam — ertalabki taqsimotdan qanchasi bajarilgani. Pastda — jami: «Всего: 34 касания · порции: 21 из 45».",
              "Zaxirani [xaritalar bo‘yicha avtoqidiruv](#prospect-maps) va qo‘lda tekshiruvlar to‘ldiradi. Hisobotda bo‘sh to‘plamlar ko‘rinsa — zaxirada kompaniyalar tugagan: yangi kampaniya oching.",
            ],
          },
        },
        {
          id: "stream",
          title: "«Получать лиды» oqimi (Telegramda)",
          roles: ["manager", "head"],
          body: {
            manager: [
              "**«▶️ Получать лиды»** tugmasi — bot bilan chat pastida, yozish maydoni ostida; u yerda bo‘lmasa, botga /leads yuboring (buyruq bot menyusida bor). Bosdingiz — umumiy zaxiradagi kompaniyalar sizga Telegramda bittadan, tayyor matn va [kunlik to‘plamdagi](#prospect-portion) kabi tugmalar bilan kela boshlaydi: «📤 Отправить через бота», «WhatsApp ↗», «✋ Написал сам», «✖ Не подходит». Bunday kartochka tepasida — «▶️ Поток».",
              "Kunlik limit yo‘q: kompaniyani ko‘rib chiqdingiz — darhol keyingisi keladi. Ko‘rib chiqish — «Отправить через бота», «Написал сам» yoki «Не подходит» ni bosish (Telegramda yoki panelda). Bir vaqtda ko‘rib chiqilmaganlari uchtadan oshmaydi: shunda zaxira bitta odamga ketib, kechqurun tegilmagan holda qaytmaydi. Har bir kompaniyaga xatni model bir daqiqagacha yozadi, shuning uchun keyingi kartochka darhol kelmasligi mumkin.",
              "Oqim ish kunlari 9:00 dan 18:00 gacha ishlaydi va ertalabki to‘plamdan keyin boshlanadi. 18:00 gacha ko‘rib chiqilmagani umumiy zaxiraga qaytadi. Oqimni tunga o‘chirish shart emas: u o‘zi ertalabni kutadi va keyingi ish kunida davom etadi — toki **«⏸ Не получать лиды»** ni (chat pastida yoki istalgan oqim kartochkasi ostida) bosmaguningizcha. /leads almashtiradi: yoqilgan bo‘lsa — o‘chiradi, o‘chirilgan bo‘lsa — yoqadi.",
              "Oqim — to‘plamdan tashqari: «5 tadan N tasi bajarildi» ga kirmaydi, «Не подходит» uchun almashtiruvchi ham yo‘q — keyingi kompaniya baribir keladi. Haftalik rejaga oqimdagi aloqalar hisoblanadi. Bugun nima kelgani va nima bilan tugagani — bo‘lim tepasidagi «Lidlar oqimi» blokida. Zaxirada kompaniyalar tugasa — bot bu haqda kuniga bir marta aytadi va yangilari paydo bo‘lganda yuboradi.",
            ],
            head: [
              "**«▶️ Получать лиды»** tugmasi — bot bilan chat pastida, yozish maydoni ostida; u yerda bo‘lmasa, botga /leads yuboring (buyruq bot menyusida bor). Bosdingiz — umumiy zaxiradagi kompaniyalar sizga Telegramda bittadan, tayyor matn va [kunlik to‘plamdagi](#prospect-portion) kabi tugmalar bilan kela boshlaydi: «📤 Отправить через бота», «WhatsApp ↗», «✋ Написал сам», «✖ Не подходит». Bunday kartochka tepasida — «▶️ Поток». Menejerlaringiz ham oqimni xuddi shu tugma bilan yoqadi.",
              "Kunlik limit yo‘q: kompaniyani ko‘rib chiqdingiz — darhol keyingisi keladi. Ko‘rib chiqish — «Отправить через бота», «Написал сам» yoki «Не подходит» ni bosish (Telegramda yoki panelda). Bir odamda bir vaqtda ko‘rib chiqilmaganlari uchtadan oshmaydi: shunda zaxira bitta odamga ketib, kechqurun tegilmagan holda qaytmaydi. Har bir kompaniyaga xatni model bir daqiqagacha yozadi, shuning uchun keyingi kartochka darhol kelmasligi mumkin.",
              "Oqim ish kunlari 9:00 dan 18:00 gacha ishlaydi va ertalabki to‘plamdan keyin boshlanadi. 18:00 gacha ko‘rib chiqilmagani umumiy zaxiraga qaytadi. Oqimni tunga o‘chirish shart emas: u o‘zi ertalabni kutadi va keyingi ish kunida davom etadi — toki odam **«⏸ Не получать лиды»** ni (chat pastida yoki istalgan oqim kartochkasi ostida) bosmaguncha. /leads almashtiradi: yoqilgan bo‘lsa — o‘chiradi, o‘chirilgan bo‘lsa — yoqadi.",
              "Oqim — to‘plamdan tashqari: «5 tadan N tasi bajarildi» ga kirmaydi, «Не подходит» uchun almashtiruvchi ham yo‘q — keyingi kompaniya baribir keladi. Haftalik rejaga oqimdagi aloqalar hisoblanadi. Bugun sizga nima kelgani va nima bilan tugagani — bo‘lim tepasidagi «Lidlar oqimi» blokida. Zaxirada kompaniyalar tugasa — bot bu haqda kuniga bir marta aytadi va yangilari paydo bo‘lganda yuboradi.",
              "Kechki hisobotda har kimda qavs ichida — kun davomidagi aloqalaridan nechtasi oqimdan kelgani: «Имя — 7 касаний (поток 4) · порция 3 из 5». To‘plami bo‘lmagan, lekin oqimi bo‘lgan odamda — «Имя — 4 касания (поток 4) · порции не было».",
            ],
          },
        },
        {
          id: "no-text",
          title: "Kartochka matnsiz keldi",
          body: {
            manager: [
              "Ba’zan [kunlik to‘plamdagi](#prospect-portion) yoki [oqimdagi](#prospect-stream) kompaniya Telegramga xatsiz — «Текст ещё готовится» degan izoh bilan keladi. Bu xatlarni yozadigan model javob bermaganda bo‘ladi: uning hisobida pul tugagan yoki ta’minotchida nosozlik. To‘plam baribir 10:00 dan kechikmay keladi — kompaniyalar allaqachon sizniki.",
              "Hech narsa bosish shart emas. Tizim xatni har besh daqiqada qayta yozib ko‘radi va u tayyor bo‘lishi bilan bot o‘sha kompaniyani yana yuboradi — tepasida «✍️ Текст готов», matn va «📤 Отправить через бота» tugmasi bilan. Birinchi kartochkaga tegmasangiz ham bo‘ladi: tugmalar ikkalasida ham ishlaydi.",
              "Kutishni istamasangiz — o‘z so‘zlaringiz bilan yozsangiz «✋ Написал сам» ni bosing yoki kartochkani panelda ochib «Bog‘lanish» ni bosing. Kompaniya allaqachon ko‘rib chiqilgan bo‘lsa, ikkinchi kartochka kelmaydi. 18:00 da bajarilmagani zaxiraga qaytadi va qayta yuborish to‘xtaydi.",
            ],
            head: [
              "Ba’zan [kunlik to‘plamdagi](#prospect-portion) yoki [oqimdagi](#prospect-stream) kompaniya Telegramga xatsiz — «Текст ещё готовится» degan izoh bilan keladi. Bu sizda ham, menejerlaringizda ham xatlarni yozadigan model javob bermaganda bo‘ladi: uning hisobida pul tugagan yoki ta’minotchida nosozlik. To‘plam baribir 10:00 dan kechikmay keladi.",
              "Hech narsa bosish shart emas. Tizim xatni har besh daqiqada qayta yozib ko‘radi va u tayyor bo‘lishi bilan bot o‘sha kompaniyani yana yuboradi — tepasida «✍️ Текст готов», matn va «📤 Отправить через бота» tugmasi bilan. Birinchi kartochkaga tegmasangiz ham bo‘ladi: tugmalar ikkalasida ham ishlaydi.",
              "Odam kutishni istamasa — «✋ Написал сам» yoki paneldagi «Bog‘lanish». Kechki hisobot aloqalarni odatdagidek hisoblaydi: matnsiz kartochka «не подошло» ga aylanmaydi. 18:00 da bajarilmagani zaxiraga qaytadi va qayta yuborish to‘xtaydi.",
            ],
            admin: [
              "Model javob bermasa — Anthropic kalitida pul tugagan, kalit qabul qilinmagan yoki ta’minotchida nosozlik bo‘lsa, — [to‘plam](#prospect-portion) va oqim uchun xatlar yozilmaydi. To‘plam baribir odamlarga 10:00 dan kechikmay ketadi: matnsiz kartochkalar, «Текст ещё готовится» izohi bilan.",
              "Modelning rad javobi hech narsa turmaydi, shuning uchun tizim har besh daqiqada qayta urinadi. Balansni to‘ldirdingiz — xatlar o‘zi yozib bo‘linadi, besh daqiqada ikki-uchtadan, va har kimga o‘z kompaniyasi yana, endi matn bilan keladi: «✍️ Текст готов». Hech narsani chiqarish yoki bosish shart emas.",
              "Boshqa holat — xatning o‘zi chiqmaganda: model bo‘sh javob qaytargan, saytsiz kompaniyaning sohasi yozilmagan. Unda ikkinchi urinish yo‘q — takrorlash tuzatmaydi, pulni esa yechadi. Bunday kompaniyaga odam o‘zi yozadi: paneldagi «Bog‘lanish».",
            ],
          },
        },
        {
          id: "plan",
          title: "Haftalik aloqalar rejasi",
          body: {
            manager: [
              "Rejani rahbaringiz yoki egasi qo‘yadi — odam o‘ziga reja qo‘ymaydi. U bo‘lim tepasida va bosh sahifada qator bo‘lib ko‘rinadi: «Rejagacha 12 ta qoldi — bu hafta 30 tadan 18 tasi bajarildi».",
              "Dushanbadan (Toshkent vaqti bilan 00:00) beri siz yozgan kompaniyalar hisoblanadi: panelda «Yuborish: …» yoki Telegramda «📤 Отправить через бота» tugmasini bosgansiz yoki «O‘zim bog‘landim» (Telegramda — «✋ Написал сам») deb belgilagansiz. Bitta kompaniya — bitta aloqa. Bot xati ketmagan bo‘lsa («yuborilmadi»), aloqa hisobga olinmaydi.",
              "«Bog‘lanish» — hali aloqa emas: bu faqat xatni tayyorlash.",
            ],
            head: [
              "Menejerlaringizga rejani [«Jamoa»](/admin/team) bo‘limida, «Aloqalar rejasi» ustunida qo‘yasiz: haftasiga son va «saqlash». Bo‘sh maydon — «rejasiz», bu 0 bilan bir xil emas: 0 bo‘lsa, to‘plam umuman bo‘lmaydi. 500 dan ko‘p emas.",
              "Odam dushanbadan beri yozgan kompaniyalar hisoblanadi: «Yuborish: …» yoki «O‘zim bog‘landim» (Telegramda — «📤 Отправить через бота» yoki «✋ Написал сам»); ketmagan xatlar hisoblanmaydi.",
              "Sizning o‘z rejangizni egasi qo‘yadi.",
            ],
            admin: [
              "Reja [«Jamoa»](/admin/team) bo‘limida, «Aloqalar rejasi» ustunida qo‘yiladi: siz — istalgan odamga, rahbar — faqat o‘z odamlariga. Bo‘sh maydon — «rejasiz» (kuniga 5 tadan to‘plam), 0 — reja ham, to‘plam ham yo‘q.",
              "Odam dushanbadan beri yozgan kompaniyalar hisoblanadi: «Yuborish: …» yoki «O‘zim bog‘landim» (Telegramda — «📤 Отправить через бота» yoki «✋ Написал сам»); ketmagan xatlar hisoblanmaydi.",
            ],
          },
        },
        {
          id: "send",
          title: "Kompaniyaga yozish: «Bog‘lanish» va «Yuborish»",
          body: [
            "Sayt kartochkasida **«Bog‘lanish»** tugmasini bosing: panel saytni qaytadan ko‘rib chiqadi (bir daqiqagacha) va xat yozadi. Bu hali aloqa hisoblanmaydi.",
            "Xat qisqa, 50–100 so‘z: kim yozayapti; uning saytidan ikki-uchta topilma — har biri joyi bilan (sahifa, ularning o‘z sarlavhasi) va mijoz shu sababli nima qilishi; qidiruvda ko‘rinish va yo‘qotishlar; agar bo‘lsa, uning nishasidagi loyihamiz; va savol — unga 12 soatda yangi sayt prototipini yig‘ib beraylikmi. Studiya hajmi va «2–4 barobar o‘sish» birinchi xatga yozilmaydi: har bir xatdagi bir xil iboralardan ommaviy tarqatmani taniydilar. Kimligimizni so‘rashsa — bu yozishmadagi javob. Panel [prototipni oldindan](#prospect-proto-ahead) yig‘ib ulgurgan bo‘lsa, xatda yig‘ib beraylikmi degan savol o‘rniga tayyor prototipga havola va bu variant unga qanday degan savol bo‘ladi.",
            "Xatni o‘qing va odamga moslab tuzating. Keyin **«Yuborish: @manzil»** — xat ishchi akkaunt navbatiga turadi. Shu daqiqadan lid ochilgan va sizga biriktirilgan, aloqa esa hisobga olingan.",
            "Yuborishdan oldin panel xatni tekshiradi va nima noto‘g‘riligini yozadi: 40–150 so‘z; sayt manzili va devuz.studio bor; tekshiruvda yo‘q raqamlar yo‘q; «в топ», «гарантирую», «первое место», foizlar va emodzilar yo‘q; qidiruvda ko‘rinish va yo‘qotishlar, agar bo‘lsa, aytilgan; 12 soatlik prototip taklifi bor, prototip oldindan yig‘ilgan bo‘lsa esa — unga havola, harfma-harf.",
            "Har qanday xodim istalgan kartochkani tayyorlab, yubora oladi — kartochka bosgan odamga biriktiriladi. Shuning uchun [kunlik to‘plamdan](#prospect-portion) boshlang: u yerda kompaniyalar allaqachon bo‘lingan.",
          ],
        },
        {
          id: "proto-ahead",
          title: "Prototip oldindan: va’da o‘rniga xatda havola",
          body: [
            "Xat tayyorlanayotganda — [kunlik to‘plam](#prospect-portion) bo‘yicha, «Получать лиды» oqimida yoki «Bog‘lanish» tugmasi bilan — panel kompaniyaga yangi sayt prototipini o‘zi yig‘adi. Nishalar: stomatologiya, o‘quv markazi, tibbiyot markazi, avtoservis, shinomontaj, avtomoyka, deteyling, barbershop, go‘zallik saloni, tirnoq studiyasi. Sahifadagi hamma narsa uning o‘z saytidan: nomi, tavsifi, telefoni, messenjerlari, logotipi, suratlari; xizmatlar — faqat uning saytida yozilganlari, har biri sayt bilan so‘zma-so‘z solishtirilgan. O‘zimizdan — birorta ham raqam, narx yoki xizmat yo‘q.",
            "Yig‘ilsa — xatda 12 soatda yig‘ib berish va’dasi o‘rniga tayyor sahifaga havola turadi, oxirgi qator esa bu variant unga qanday ekanini so‘raydi. Sayt kartochkasida — «Prototip oldindan yig‘ilgan →» va mijoz uni ochganmi. Yuborishdan oldingi tekshiruv havolani harfma-harf talab qiladi: yo‘qolgan bitta harf — mijozda «sahifa topilmadi».",
            "Mijoz havolani ochdi — sizga Telegramda «Касание · сайт» va «👀 Клиент открыл прототип» keladi: u hozir o‘zining yangi saytiga qarab turibdi, yozish uchun eng yaxshi payt. Bir marta keladi — birinchi ochilishda, aloqani olib borayotgan odamga, agar unda «Mijozlarning aloqalarga javoblari» belgisi turgan bo‘lsa. Telegram o‘zi chizadigan havola prevyusi va sizning paneldan o‘z ochishlaringiz hisoblanmaydi.",
            "Mijoz prototip haqida javob berdi («ko‘rdim», «buni o‘zgartirsa bo‘ladimi…») — model javob bermaydi, sizni chaqiradi: «ответил про прототип, который ушёл в письме, — дальше вы». Bunday aloqa bo‘yicha butun jamoaga «🔥 Нужен прототип» tarqatmasi ketmaydi: prototip allaqachon mijozda.",
            "Yig‘ilmasa — kartochkada kulrang bilan «Prototip oldindan yig‘ilmadi:» va sababi (bu nishani hozircha bilmaymiz, saytda so‘z bilan yozilgan uchta xizmat yo‘q, tugma uchun telefon yoki messenjer yo‘q va h.k.), xat esa avvalgidek — 12 soatda yig‘ib berish va’dasi bilan. Quruvchilarga oldindan yig‘ilmaydi: ularga yozilish emas, kvartira tanlash sahifasi kerak.",
          ],
        },
        {
          id: "list",
          title: "«Tahlil qilingan saytlar» ro‘yxatida nima ko‘rsatiladi",
          body: [
            "Birdaniga barcha tahlil qilingan saytlar emas, balki ular bilan ishlanayotganlari ko‘rinadi: tayyor matnli («matn tayyor»), yuborish navbatidagilar, «qo‘lda yozish», oxirgi 7 kunda yuborilganlar («mijoz rad etdi» va «javob bermayapti» deb yopilganlardan tashqari), sizning [kunlik portsiyangiz](#prospect-portion) va hozirgina qaytgan kartochkangiz. Qolganlaridan — tegilmagan, o‘tkazib yuborilgan va bir haftadan oldin yuborilganlardan — birinchi 20 tasi, yangilari tepada.",
            "Ro‘yxat ostida — **«Yana 20 tasini ko‘rsatish»**: sahifa qo‘shilgan kartochkalarning birinchisida ochiladi, kerakli marta bosing. Nega shunday: ilgari sahifa 200 ta kartochkani birdaniga chizardi — taxminan 2 MB, — va kuchsiz kompyuterlarda har ochilganda va har «Bog‘lanish»dan keyin bir necha soniyaga qotib qolardi; brauzer shu paytda «Страница не отвечает» deb yozardi, matnni nusxalash esa ishlamasdi.",
          ],
        },
        {
          id: "queue",
          title: "Ishchi akkaunt navbati: soatiga ikki xat",
          body: [
            "Yangi kompaniyaga birinchi xatni ishchi akkaunt soatiga ikkitadan ko‘p emas va 8–20 daqiqa tanaffus bilan yuboradi. Aks holda Telegram bizni ommaviy tarqatma deb hisoblab, akkauntni cheklaydi — skaut esa chatlarni aynan shu akkaunt bilan o‘qiydi, va biz ikkala kanalni birdan yo‘qotardik.",
            "Ro‘yxat ustida: «Oxirgi soatda 2 tadan 1 tasi ketdi · navbatda 3 ta». Navbatdagi kartochkada — taxminan necha daqiqadan keyin ketishi. Ishchi akkauntlar bir nechta bo‘lishi mumkin — har birining o‘z «soatiga ikki»si bor, unda ikkinchi raqam kattaroq bo‘ladi: hammasidan birga soatiga shuncha birinchi xat ketadi. Xat qaysi akkauntda joy oldinroq bo‘shasa, o‘shandan ketadi; javoblar va tuzatishlar — birinchi xat ketgan akkauntdan.",
            "Kutish shart emas: yozishmani o‘z akkauntingizdan oching, o‘sha matnni yuboring va **«O‘zim bog‘landim»** tugmasini bosing — bot o‘z nusxasini endi yubormaydi, mijoz javobi esa shaxsan sizga keladi.",
            "**Egasining xatlari navbatsiz ketadi**: boshqalarning xatlarini ham, «soatiga ikki»ni ham, 8–20 daqiqa tanaffusni ham kutmaydi — oldingi har qanday yuborishdan bir daqiqa o‘tib ketadi. «Soatiga ikki»ga ular baribir kiradi: cheklov akkaunt haqida, va bunday xatdan keyin qolganlar kutishiga to‘g‘ri keladi. Bunday kartochkada «Egasining xati — navbatsiz» deb yozilgan.",
          ],
        },
        {
          id: "self",
          title: "«O‘zim bog‘landim» (Telegramda — «Написал сам»)",
          body: [
            "O‘zingiz yozganingiz yoki qo‘ng‘iroq qilganingizda bosing — o‘z akkauntingizdan, WhatsApp orqali, telefonda. Maydonga qisqacha: nima orqali va qanday («shaxsiy Telegram», «qo‘ng‘iroq»).",
            "Nima bo‘ladi: aloqa sizga hisoblanadi, sizga lid ochiladi, kartochka «yuborildi» bo‘ladi va ikkinchi hamkasb o‘sha odamga endi yozmaydi. Belgisiz bularning hech biri yo‘q: panel uchun siz hech kimga yozmagansiz.",
            "«O‘zim bog‘landim» bosilgandan keyin yozishma siz orqali boradi: bot qayta yozmaydi va javoblarni ko‘rmaydi. Mijoz javobini kartochkaga ko‘chirish mumkin — [qo‘lda yozish](#prospect-manual) bandi.",
          ],
        },
        {
          id: "manual",
          title: "«Qo‘lda yozish»: Telegramsiz telefon",
          body: [
            "Saytdagi Telegram havolasi kanalga yoki botga olib borsa, ishchi akkaunt avval o‘sha saytdagi mobil raqam bo‘yicha odamni qidiradi — Telegram odamlarni manzildan ko‘ra raqam bo‘yicha ko‘proq topadi. Topmasa yoki raqam statsionar bo‘lsa, kartochka «qo‘lda yozish» bo‘ladi, Telegramga esa «Кому: … — только звонок или WhatsApp» keladi.",
            "Tugmalar: **«WhatsApp’ni tayyor matn bilan ochish»**, **«Qo‘ng‘iroq qilish»**, **«Matnni nusxalash»**. Yozdingiz yoki qo‘ng‘iroq qildingiz — **«O‘zim bog‘landim»** deb belgilang.",
            "Mijoz WhatsApp’da javob berdi — uning javobini «Mijoz nima deb javob berdi» maydoniga qo‘ying va **«Javobni yozib qo‘yish»** tugmasini bosing. Model keyingi javobni yozadi, u kartochkada «Javobni nusxalash» va «WhatsApp’ni javob bilan ochish» tugmalari bilan chiqadi. O‘zimizning xatimizni u yerga qo‘yib bo‘lmaydi — panel buni sezadi.",
            "Yozmaydigan bo‘lsangiz — sababi bilan «yozmaymiz».",
          ],
        },
        {
          id: "replies",
          title: "Mijoz javob berdi: kim javob beradi",
          body: [
            "Ishchi akkaunt xatlariga model javob beradi — bir necha daqiqadan keyin, darhol emas (darhol javob robotga o‘xshaydi), studiya nomidan, «biz» deb. Uning har bir javobi bitta aniq qadam bilan tugaydi; biror narsa yuborishni va’da qilish unga taqiqlangan.",
            "Model **sizni chaqiradi**, agar mijoz: rad etsa («yozmang», «qiziq emas»); odam yoki qo‘ng‘iroq so‘rasa; **tahlil, tijoriy taklif, smeta yoki fayl yuborishni so‘rasa** — unda o‘sha kuniyoq o‘zingiz yuboring; **prototip istasa** («ha, yig‘ib bering», «да, соберите») — unda aloqa muallifiga «🛠 Беру прототип» tugmasi bilan «🛠 Хотят прототип» keladi: **birinchi 30 daqiqa** prototip faqat unda. Yarim soatda olmasa — **butun jamoaga** xuddi shu tugma bilan «🔥 Нужен прототип — бери срочно» ketadi (07:00 dan 23:00 gacha; tunda so‘rasa — 07:00 da ketadi): kim birinchi bossa, lid va yozishma o‘shaniki, boshqalarda tugma olgan odam ismi bilan o‘chadi; prototipni qo‘lda yig‘ib, mijozga havolani yuborish — 12 soat ichida, xatda va’da qilinganidek, muddatdan 2 soat oldin eslatma o‘zi qo‘yiladi; mijozga esa o‘zi «maket tayyorlayapmiz» javobi maketni taqdim etish shartlariga havola bilan (devuz.studio/uz/mockup-terms) ketadi — mijoz ularni yozishmani davom ettirib yoki maketni olib qabul qiladi, havolani qayta yuborish shart emas; yozishma Telegramda bo‘lmasa, bu javob aloqa kartochkasida kutadi — uni o‘zingiz yuboring; qisqa va tushunarsiz javob bersa. Yana — suhbat 12 replikadan beri davom etib, kelishuvga kelmasa yoki uning javobi tekshiruvdan o‘tmasa. Xatda allaqachon [oldindan yig‘ilgan prototipga](#prospect-proto-ahead) havola bo‘lgan bo‘lsa, javobdagi «прототип» so‘zi «ko‘rdim» degani: model sizni «ответил про прототип, который ушёл в письме» sababi bilan chaqiradi, butun jamoaga «Нужен прототип» ketmaydi.",
            "Chaqirdi — sizga Telegramda sabab, mijoz so‘zlari va lid havolasi bilan «Касание · сайт» keladi, ostida esa «🙅 Клиент отказался» tugmasi: mijoz «qiziq emas» desa — bosing, aloqa [yopiladi](#prospect-close). Lid kartochkasida «Aloqa bo‘yicha birlamchi suhbat» bloki: «SI javob beryapti» yoki «siz javob berasiz — sabab». **«O‘zim javob beraman»** tugmasi suhbatni istalgan paytda modeldan olib qo‘yadi: keyin model jim turadi, mijozning har bir yangi xabari esa sizga Telegramda keladi — «Клиент написал — отвечаете вы», lid havolasi bilan. Tugmani bosgan odamga keladi, hatto u rahbar yoki ega bo‘lsa ham. Lid har holda sizniki. Lidni berishdi yoki uni navbatdan boshqa odam oldi — suhbat u bilan birga o‘tadi: mijoz xabarlari, qayta yozish va model imzosi endi lidning yangi egasida, oldingi egasining «O‘zim javob beraman» belgisi esa olib tashlanadi.",
            "Model vazifa, byudjet va muddatlarni aniqlab olgach, xayrlashadi, sizga esa «Первичка по касанию · сайт» brifi keladi. Keyingi suhbat sizniki.",
            "⚠️ O‘zingiz javob berayotgan bo‘lsangiz, mijozning yangi oddiy xabarlari Telegramda sizga kelmaydi — yozishmaga o‘zingiz qarab turing.",
          ],
        },
        {
          id: "close",
          title: "«🙅 Mijoz rad etdi» va «🔇 Javob bermayapti»: aloqa yopildi",
          body: [
            "Suhbat bo‘lmasligi aniq bo‘lganda, aloqani yoping. **«🙅 Mijoz rad etdi»** (Telegramda — «🙅 Клиент отказался») — «qiziq emas», «yozmang» deb javob berdi, telefonda rad etdi. **«🔇 Javob bermayapti»** (Telegramda — «🔇 Игнорирует») — o‘qidi-yu jim, trubkani olmaydi. Tugmalar «Tahlil qilingan saytlar» ro‘yxatidagi yuborilgan saytlar kartochkasida va Telegramda — to‘plam yoki oqimdagi kompaniya kartochkasi ostida, «📤 Отправить через бота» va «✋ Написал сам» dan keyin turadi. Botning mijoz javobi haqidagi «Касание · сайт» xabari ostida — faqat «🙅 Клиент отказался». Panelda tugmalarni aloqani olib borayotgan odam, rahbar va egasi ko‘radi.",
            "Bosilgandan keyin nima bo‘ladi: bot mijozga boshqa qayta xabar yozmaydi ([qayta yozish](#prospect-followups)), navbatga qo‘yilgan xabar esa ketmaydi; model endi javob bermaydi; shu sayt bo‘yicha lid «yutqazilgan» holati bilan yopiladi va u bo‘yicha eslatmalar olib tashlanadi. Ro‘yxatda kartochka ishdagilar qatoridan chiqadi va «mijoz rad etdi» yoki «javob bermayapti» deb belgilanadi. Kim va qachon yopgani kartochkada ko‘rinadi.",
            "Aloqa bunda bajarilgan bo‘lib qoladi — [kunlik to‘plamda](#prospect-portion), haftalik rejada va «soatiga ikki»da: mijozga haqiqatan yozilgan. Faqat aloqadan keyin yopish mumkin: xat hali «yuborish navbatida» bo‘lsa — bot «u ketganda belgilang» deb javob beradi; o‘zingiz qo‘ng‘iroq qilgan yoki yozgan bo‘lsangiz — avval «O‘zim bog‘landim».",
            "Yopishni tugma bilan bekor qilib bo‘lmaydi va kerak ham emas: mijoz keyin o‘zi yozsa, bot aloqani olib borgan odamni chaqiradi — «Клиент, которого отметили …, написал снова». Havola orqali lidni oching va suhbat boshlangan bo‘lsa, unga «ishda» holatini qaytaring.",
          ],
        },
        {
          id: "followups",
          title: "Qayta yozish: mijoz jim bo‘lsa",
          body: [
            "Ishchi akkaunt xatiga javob berilmasa, bot o‘zi 3 kundan keyin ikkinchi xabarni (boshqa topilma va «Siz uchun dolzarbmi?» savoli), 7 kundan keyin esa uchinchi, oxirgisini yozadi — suhbatni xushmuomalalik bilan yopadi. Undan keyin yozmaymiz.",
            "Faqat ish kunlari Toshkent vaqti bilan 10:00 dan 17:00 gacha: notanish studiyadan soat 23:00 da kelgan xabar — shikoyat qilishga sabab. Bir oydan eski aloqalarga qayta yozilmaydi.",
            "Qayta yozish faqat bot orqali ketgan xatlar uchun ishlaydi. «O‘zim bog‘landim» bosilgandan keyin va qo‘lda yoziladigan kartochkalarda o‘zingizni eslatib turish — sizning ishingiz. Aloqani «🙅 Mijoz rad etdi» yoki «🔇 Javob bermayapti» tugmasi bilan yopdingiz — u bo‘yicha qayta yozish endi ketmaydi, navbatga qo‘yilgani ham.",
          ],
        },
        {
          id: "numbers",
          title: "Kartochkadagi raqamlarni qanday o‘qish",
          body: [
            "**«qidiruv 84»** — saytni Google va Yandexda topish qanchalik oson, 0 dan 100 gacha. 80 va undan yuqori — joyida, 50–79 — tuzatadigan joyi bor, 50 dan past — yomon topiladi, 10 gacha — sayt qidiruvdan yopilgan.",
            "**«−24…48»** — saytni allaqachon ochgan va yozish yoki qo‘ng‘iroq qilishga tayyor bo‘lgan har yuz kishidan nechta murojaat yo‘qolishi. Bu topilgan muammolar bo‘yicha bizning bahomiz (narxlar yo‘q, telefon bosilmaydi, telefondan o‘qilmaydi), mijozning statistikasi emas — shunday deb ayting. Qidiruvga aloqasi yo‘q.",
            "**Oxirgi raqam** — umumiy baho: yuzdan har bir o‘ta jiddiy topilma uchun 25, jiddiy uchun 12 va mayda uchun 5 ayriladi. 60 dan past — sariq, 0 — sayt ochilmagan.",
            "**Topilma belgilari**: qizil ramka — o‘ta jiddiy, tilla rang — jiddiy, kulrang — mayda. Suhbatni texnik topilmadan emas, mijozlar va pul haqidagi topilmadan boshlang.",
            "**Holatlar**: «yozilmagan», «xabar tayyor», «yuborish navbatida», «yuborildi», «qo‘lda yozish», «yuborilmadi» (bot yetkazmadi — kartochkani oching), «o‘tkazib yuborilgan». Yopilganlarda «yuborildi»ga «mijoz rad etdi» yoki «javob bermayapti» qo‘shiladi. Xuddi shu narsa — ro‘yxat ustidagi yig‘ilgan «Raqamlarni qanday o‘qish kerak» blokida.",
          ],
        },
        {
          id: "own-list",
          title: "O‘z saytlar ro‘yxatingizni tekshirish",
          body: [
            "Tepadagi blok: manzillarni «Saytlar ro‘yxati — har qatorda bittadan» maydoniga qo‘ying (yoniga kompaniya nomini yozsa ham bo‘ladi) va **«N tasini tekshirish»** tugmasini bosing. Bir martada — 200 tagacha manzil; saytlar beshtadan, birin-ketin tekshiriladi — o‘ntasiga birdan murojaat qilmaslik uchun.",
            "Natija umumiy ro‘yxatga darhol saqlanadi. Hech qanday kamchiligi yo‘q saytlar saqlanmaydi: yozadigan narsa yo‘q, bahona o‘ylab topish kerak emas. Allaqachon kiritilgan sayt takrorlanmaydi.",
            "Saytsiz kompaniyalar: «Kompaniyaning sayti yo‘q»ni belgilang, nishani va nomlarni har qatorga bittadan yozing — «N tasini qo‘shish». Ularga xat nishadan kelib chiqib yoziladi, bog‘lanish esa telefon yoki Telegram orqali, agar ma’lum bo‘lsa.",
            "«Xat tili» faqat jadvaldagi qoralamaga ta’sir qiladi. «Bog‘lanish» tugmasi yozadigan xat sayt tilida bo‘ladi.",
          ],
        },
        {
          id: "skip",
          title: "«yozmaymiz» va «✖ Не подходит»",
          body: [
            "Har bir topilmaga yozish shart emas: sayt davlatniki, kompaniya yopilgan, bu tanishingiz. «yozmaymiz» tugmasini bosing va nima uchunligini qisqa tushuntiring — kartochka «o‘tkazib yuborilgan» bo‘ladi va boshqa hech kimga tushmaydi.",
            "Kunlik to‘plamda ham xuddi shunday — Telegramdagi «✖ Не подходит» tugmasi. Bunday kompaniya «не сделано» emas, «mos kelmadi» deb hisoblanadi.",
          ],
        },
        {
          id: "maps",
          title: "Xaritalar bo‘yicha kompaniyalarni avtoqidirish",
          roles: ["head", "admin"],
          body: {
            head: [
              "Kampaniyalarni siz va egasi ochasiz: **nisha va shahar** (masalan, «stomatologiya», «Toshkent») → «Qidirish». Studiyaga qaysi nishalar kerakligini hal qilish — sizning ishingiz: har bir kampaniya — pullik API’ga so‘rovlar va zaxirada yuzlab kompaniyalar. Bir shahardagi bir xil nisha ikkinchi marta ochilmaydi — panel allaqachon ochilganini ko‘rsatadi.",
              "Har kuni soat 06:00 da tizim Google Maps’da kompaniyalarni qidiradi — har kampaniyaga natijalarning uch sahifasigacha, Toshkent uchun yana tumanlar bo‘yicha ham. Topilganlar fonda bir o‘tishda beshta saytdan tekshiriladi: saytli kompaniya zaxiraga faqat saytda yozadigan narsa bo‘lsa tushadi; saytsiz — xaritadagi telefoni bilan. Yopilgan kompaniyalar va sayt o‘rniga ijtimoiy tarmoq ko‘rsatilganlar o‘tkazib yuboriladi.",
              "Kampaniya qatorida: «topildi N · ro‘yxatda M». «natijalar tugadi» — yangi nisha ochish vaqti keldi. «hozir qidirish» — ertalabni kutmaslik; «pauza» / «davom ettirish».",
              "Chegara — kuniga 25 ta so‘rov, har birida 20 tadan kompaniya. Avtoqidiruvni egasi ulaydi: blokda «Ulanmagan» yozilgan bo‘lsa, unga ayting.",
            ],
            admin: [
              "Kampaniya — **nisha va shahar** → «Qidirish». Har kuni soat 06:00 da (dam olish kunlari ham) tizim Google Maps orqali kompaniyalarni qidiradi: har kampaniyaga uch sahifagacha, Toshkent uchun — butun shahardan keyin 12 ta tuman bo‘yicha. Topilganlar fonda tekshiriladi, bir o‘tishda beshta saytdan; zaxiraga yozadigan narsasi bor saytlar va saytsiz kompaniyalar — xaritadagi telefoni bilan tushadi. Bir shahardagi bir xil nisha ikkinchi marta ochilmaydi.",
              "Chegara — kuniga 25 ta so‘rov (`MAPS_DAILY_REQUESTS`), bu oyiga taxminan 750 ta — Google’ning bepul mingtaligi ichida. Bitta so‘rov — 20 tagacha kompaniya.",
              "Bir marta ulash: Google Cloud → «Places API (New)» ni yoqing va to‘lov kartasini bog‘lang → «Credentials» → faqat Places API (New) bilan cheklangan «API key» → `/opt/devuz/.env` fayliga `GOOGLE_PLACES_API_KEY=kalit` yozing va `docker compose up -d` (yoki keyingi yangilanish chiqishini kuting). Hozir kalit Supabase maxfiy ma’lumotlar omborida turibdi (Vault, nomi `app.GOOGLE_PLACES_API_KEY`): `.env`da kalit bo‘lmasa, panel uni o‘sha yerdan oladi.",
            ],
          },
        },
      ],
    },

    /* ── Рабочие аккаунты ──────────────────────────────────────────────── */
    "/admin/accounts": {
      what: "Aloqalarning birinchi xatlari ketadigan va mijozlar bilan yozishma boradigan Telegram ishchi akkauntlari. Asosiysi serverda ulangan va chatlarni ham o‘qiydi; bu yerda qo‘shimchalarini ulaysiz. Bo‘limni faqat siz ko‘rasiz.",
      items: [
        {
          id: "add",
          title: "Akkaunt ulash",
          body: [
            "Akkaunt nomini (masalan, «Dilnoza akkaunti») va uning telefon raqamini yozing — +998… yoki mamlakat kodisiz 9 ta raqam. **«Kod yuborish»** tugmasini bosing. Bir necha soniyadan keyin skaut Telegramdan kod so‘raydi va akkauntda «Telegramdan kelgan kod» maydoni paydo bo‘ladi; kirish davom etayotganda sahifa o‘zi yangilanadi.",
            "Kod shu akkaunt telefonidagi Telegram ilovasiga keladi — Telegramdan xabar bilan, odatda SMS emas. Uni yozing va **«Kirish»** tugmasini bosing. Kodni hech kimga jo‘natmang va chatga yubormang: xabar bilan jo‘natilgan kodni Telegram bekor qiladi va kirishni qaytadan boshlashga to‘g‘ri keladi.",
            "Ikki bosqichli himoya yoqilgan bo‘lsa, «Ikki bosqichli himoya paroli» maydoni chiqadi: parolni yozing va yana **«Kirish»**. Parolni saqlamaymiz: skaut uni tekshiradi va darhol o‘chiradi. Bo‘ldi — holat «ishlamoqda» va yonida akkaunt nomi. Akkaunt telefonidagi qurilmalar ro‘yxatida yangi seans paydo bo‘ladi — bu biz; uni yakunlamang, aks holda akkaunt uziladi.",
            "«kod mos kelmadi» — kodni qaytadan yozing; «kodning muddati o‘tgan» yoki boshqa xato — **«O‘chirish»** tugmasini bosing va o‘sha raqam bilan qaytadan ulang.",
          ],
        },
        {
          id: "limits",
          title: "Qancha xat va qaysi akkauntdan",
          body: [
            "Har bir akkauntning soatiga birinchi xatlar chegarasi o‘ziniki: asosiysida — 2, yangisida — 1. Bir hafta tinch ishlagandan keyin yangisini «Soatiga xat» maydonida 2 gacha ko‘tarish mumkin: yangi raqamni Telegram tezroq cheklaydi. Bo‘lim tepasida — hammasidan birga qanchasi ketishi; xuddi shu raqam [Aloqalar](/admin/prospect)dagi ro‘yxat ustida turadi.",
            "Aloqalar navbati bitta: xat qaysi akkauntda joy oldinroq bo‘shasa, o‘shandan ketadi — menejer hech narsa tanlamaydi. Mijozga javoblar, model javoblari va xat tuzatishi birinchi xat ketgan akkauntdan boradi: odamga boshqa raqamdan yozish — uning yozishmasida begona bo‘lib paydo bo‘lish demak.",
            "Har bir akkaunt ostida — oxirgi soatda va bugun nechta birinchi xat ketgani, skaut uni ulangan holda ushlab turgan bo‘lsa «aloqada» (belgi har daqiqada). Belgi uch daqiqadan ko‘p bo‘lmasa — skaut bu akkaunt bilan ishlamayapti: serverni tekshiring yoki akkauntni qaytadan ulang.",
          ],
        },
        {
          id: "stop",
          title: "Pauza, cheklov va o‘chirish",
          body: [
            "**«Pauza»** — akkaunt birinchi xatlarni yozishni to‘xtatadi, lekin boshlangan suhbatlarda javob beradi. **«Ishga qaytarish»** — yana yozadi.",
            "Telegram akkauntni ommaviy tarqatma uchun cheklasa, u o‘zi bir sutkaga to‘xtaydi: birinchi xatlar qolganlaridan ketadi, yozishma davom etadi, akkauntda esa qachongacha turgani yoziladi. Shu holat yuz bergan xat navbatga qaytadi va boshqa akkauntdan ketadi. Yozadigan boshqa hech kim qolmasa, navbat avvalgidek butunlay olib tashlanadi.",
            "**«O‘chirish»** — skaut Telegramdagi seansni yopadi (u telefondagi qurilmalardan yo‘qoladi) va uni bizda o‘chiradi. Shu akkauntdan boshlangan suhbatlar «Aloqalar»da qoladi, lekin ularga keyin o‘zingiz javob berasiz: bu raqamdan yozadigan boshqa hech kim yo‘q.",
          ],
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
            "Natija: «rad etdi», «odamni chaqirdi», «dastlabki suhbat yakunlandi», «suhbat to‘xtab qoldi» yoki «hali davom etyapti». «Suhbat to‘xtab qoldi» — qolgan hammasi: jimlik, fayl yuborish so‘rovi, tushunarsiz javob.",
            "Yashil rangda — saboq. Pastroqda — «E’tiborni tortdi», «E’tiroz», «Buzildi». «Suhbat kam — xulosa zaif» mijoz ikkitadan kam xabar yozganini bildiradi: bitta replikadan xulosa chiqarilmaydi, u yerda saboq yo‘q.",
            "Tepadagi plitkalar: nechtasi tahlil qilingan, nechta saboq mijoz so‘zlariga tayangan, rad etishlar va o‘zbek tilidagi suhbatlar soni.",
          ],
        },
        {
          id: "use",
          title: "Bu bilan nima qilish kerak",
          body: {
            manager: [
              "To‘plamdagi xatlarni tuzatishdan oldin yangi saboqlarni o‘qing: odamlarni nima qiziqtiradi va suhbatlar nimada uziladi. Saboqlar hozircha xatlarga o‘zi qo‘shilmaydi — buni bir necha o‘nlab javob yig‘ilganda egasi hal qiladi.",
              "«lid →» bu suhbat bo‘yicha lidni ochadi, agar u sizniki bo‘lsa.",
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
            "«Qaysi ishga qarayapmiz» maydoni — vakansiyani yozing (odatiy — sotuv menejeri). Keyin «PDF formatidagi rezyume» va **«Tahlil qilish»**. Tahlil bir daqiqagacha davom etadi.",
            "Matni nusxalanadigan, 8 MB gacha PDF kerak; birinchi 12 sahifa o‘qiladi. Skan yoki rasmlar o‘qilmaydi — panel shunday deb aytadi.",
          ],
        },
        {
          id: "result",
          title: "Tahlilda nima bor",
          body: [
            "Xulosa: «olish», «shart bilan olish» yoki «olmaslik» — va nima uchun. Keyin: «Kuchli tomonlar», «To‘siqlar», «Rezyumeda to‘g‘ridan-to‘g‘ri nima yozilgan», «Suhbatda so‘rash» (har bir to‘xtatuvchi belgiga savol) va «Ishda qanday tekshirish» — bir kunlik pullik sinov kuni uchun topshiriq.",
            "Tahlil — suhbatga tayyorgarlik, hukm emas. Qaror sizniki.",
          ],
        },
        {
          id: "privacy",
          title: "Shaxsiy ma’lumotlar",
          body: [
            "Fayl hech qayerda saqlanmaydi — faqat ism, lavozim, xulosa va tahlilning o‘zi qoladi. «Tahlilni olib tashlash» tugmasi uni butunlay o‘chiradi.",
            "Yosh, jins, oilaviy holat, millat, din, tashqi ko‘rinish va tug‘ilgan joy bahoda qatnashmaydi. Agar tahlil baribir ularga tayangan bo‘lsa, u saqlanmaydi: «Tahlil ishga aloqasi yo‘q narsaga tayandi… yana bir bor urinib ko‘ring».",
            "Har bir tahlil va o‘chirish jurnalga yoziladi.",
          ],
        },
      ],
    },

    /* ── Проекты ──────────────────────────────────────────────────────── */
    "/admin/projects": {
      what: "Kelishib bo‘lingan ish: qaysi bosqichda, qaysi muddatgacha, qancha summaga, kim olib boradi va mijoz qancha to‘lagan. «Moliya» bo‘limidagi hisoblanmalar loyihaga bog‘liq: summasi bor loyiha bo‘lmasa, bitim uchun hech kim pul olmaydi.",
      items: [
        {
          id: "tasks",
          title: "Loyiha bo‘yicha vazifalar",
          body: [
            "Loyiha kartochkasida, nomining darhol ostida — **«Loyiha bo‘yicha vazifalar»**: unga biriktirilgan barcha vazifalar — kimdan, kimga, muddat va hozir ular qanday holatda. Ochiqlari tepada, eng yaqin muddatdan, yopilganlari pastda. Agar vazifa sizda bo‘lsa yoki uni siz qo‘ygan bo‘lsangiz, bu yerdagi tugmalar bosh sahifadagi bilan bir xil.",
            "Loyiha bo‘yicha vazifa qo‘yish uchun o‘ngdagi **«Vazifa qo‘yish»** ni bosing: bosh sahifa forma bilan ochiladi, unda bu loyiha allaqachon tanlangan. Vazifani loyihaga faqat loyiha shu yerda, «Loyihalar» da qo‘shilgan bo‘lsa biriktirish mumkin — shuning uchun avval mijoz loyihasi qo‘shiladi. Vazifalar haqida batafsil — [vazifalar](#leads-tasks) bandida.",
          ],
        },
        {
          id: "create",
          title: "Loyiha ochish",
          body: {
            manager: [
              "Mijoz ishlashga rozi bo‘ldi — loyiha oching: «Yangi loyiha» bloki, nomi, mijoz, summa, muddat va «Yaratish».",
              "**Kim ochsa, o‘sha mas’ul bo‘ladi.** Hisoblanmalar mas’ulga yoziladi, uni esa faqat egasi almashtira oladi — shuning uchun o‘z loyihangizni o‘zingiz oching, hamkasbdan so‘ramang.",
              "Ro‘yxat: «shu bosqichda N kun», «olib boruvchi: …», «muddat …» va muddat o‘tgan bo‘lsa «muddati o‘tgan». «yopilganlarini ko‘rsatish» — tugallangan va bekor qilinganlar.",
            ],
            head: [
              "Loyihani istalgan odam ochadi — va kim ochsa, o‘sha mas’ul bo‘ladi. Hisoblanmalar mas’ulga yoziladi (sizga esa jamoangiz loyihalaridan 5%), mas’ulni esa faqat egasi almashtira oladi. Menejerlar o‘z loyihalarini o‘zlari ochishini kuzating.",
              "Ro‘yxat hamma uchun umumiy: bosqich, undagi kunlar, mas’ul, muddat va «muddati o‘tgan».",
            ],
            admin: [
              "Loyihani ochgan xodim o‘zi mas’ul bo‘ladi. Siz ochganingizda birinchi maydonda **kim olib borishini** tanlang: hisoblanmalar unga yoziladi. O‘zingizni tanlasangiz — loyiha bo‘yicha jamoaga hisoblanma bo‘lmaydi, egasi foiz emas, qoldiqni oladi. Mas’ulni istalgan paytda almashtirish mumkin: [«Loyiha ma’lumotlari»](#projects-data) → «Olib boradi»; siz olib borayotgan loyiha kartochkasida sariq eslatma turadi.",
              "Ro‘yxatda loyiha bosqichda necha kun turgani va muddati o‘tgan-o‘tmagani ko‘rinadi.",
            ],
          },
        },
        {
          id: "stages",
          title: "Bosqichlar",
          body: [
            "Tartib bilan: «brif» → «shartnoma» → «dizayn» → «ishlab chiqish» → «qabul qilish» → «ishga tushirish» → «qo‘llab-quvvatlash». Alohida: «pauzada», «yopilgan», «bekor qilingan».",
            "Bosqichni faqat egasi o‘zgartiradi: bosqich — mijozga berilgan va’da, ijrochining kayfiyati haqidagi belgi emas. Har bir o‘zgarish jurnalga loyiha oldingi bosqichda necha kun turgani bilan birga yoziladi.",
            "Pulga faqat «bekor qilingan» ta’sir qiladi — unda hisoblanmalar «hisoblanmaydi» bo‘ladi. «Yopilgan» va «bekor qilingan» yana mas’ulga summani tahrirlashni ham yopadi.",
          ],
        },
        {
          id: "card",
          title: "Loyiha kartochkasi",
          body: {
            manager: [
              "Tepadan pastga: «Bosqich», «Smeta», «Pul», «Loyiha ma’lumotlari», «Shartnoma».",
              "**«Smeta»** — toifani va muddatni haftalarda tanlang, panel «kamida» (chegara), «ko‘pi bilan» va muddatni hisoblaydi. Chegara — bundan past summada loyiha o‘zini oqlamaydi; undan pastga faqat egasi tusha oladi.",
              "**«Pul»**: «Bitim turi» — «yangi mijoz» yoki «qo‘shimcha sotuv» (foizingiz shunga bog‘liq, [«Moliya»](/admin/finance) bo‘limiga qarang) va «Shartnoma summasi, $». Butun dollarda yozing, «$» va sentlarsiz, aks holda maydon tozalanadi. Loyiha bo‘yicha birorta to‘lov bo‘lmaguncha summani siz tahrirlaysiz; keyin — faqat egasi.",
              "Soliq va tannarxni shartnomadan keyin egasi yozadi. Mijoz to‘lovlarini ham egasi yozadi — va faqat shundan keyin hisoblanmalaringiz muzdan chiqadi. Shartnoma hisobi bo‘yicha to‘lov egasi uni tasdiqlaganda bu yerga o‘zi tushadi; ungacha «Mijoz to‘lovlari» blokida sariq qator turadi: «to‘lov hali tasdiqlanmagan».",
              "**«Loyiha ma’lumotlari»** — nomi, mijoz, muddat, izohlar; ularni siz mas’ul sifatida tahrirlaysiz. **«Shartnoma»** — loyiha shartnomasiga havola va u hozir qayerda: qoralama, egasida imzoda, tasdiqlangan, imzolangan. Shartnoma yo‘q ekan — uni tayyorlash formasi; tayyorlanmasa, forma ustida nimani tuzatish kerakligi yoziladi. Batafsil — [shartnomalar](/admin/contracts).",
            ],
            head: [
              "Bloklar: «Bosqich», «Smeta», «Pul», «Loyiha ma’lumotlari», «Shartnoma». Siz istalgan loyiha kartochkasini ko‘rasiz; pulni — o‘z loyihalaringiz va jamoa loyihalari bo‘yicha.",
              "Smeta va summani loyiha mas’uli va egasi tahrirlaydi — siz jamoa loyihalarida ularni faqat ko‘rasiz. Summa — butun dollarda; birinchi to‘lovdan keyin uni faqat egasi o‘zgartiradi.",
              "Hisoblanma qatorlari: daraja bo‘yicha mas’ul va siz — jamoa loyihalaridan «rahbar · 5 %» (muassisda bu qator 0).",
            ],
            admin: [
              "Siz hammasini tahrirlaysiz: bosqich (10 ta tugma), smeta, summa va bitim turini istalgan paytda, **«Soliq, %»** (odatiy 4) va **«Ishlab chiqish tannarxi, $»** — faqat siz, hech kim tannarxni kamaytirib, o‘z hisoblanmasini oshirmasligi uchun.",
              "Hisoblanma qatorlarida — shu bitim uchun foiz: «belgilash» yoki «daraja bo‘yicha»ga qaytarish. **«Hamkor»** bloki: kim olib kelgan, hamkorga foiz («pog‘ona bo‘yicha» — loyiha summasi va hamkor modeliga qarab: foydadan 10–30% yoki aylanmadan 6–20%), «Agentlik buyurtmasi» — agar loyiha hamkor agentligidan bo‘lsa — va «Hisobga olmaslik sababi».",
              "**«Mijoz to‘lovlari»** → «To‘lovni yozish»: summa, sana, maqsad. Hammasi to‘langanda hisoblanmalar «ishlab topilgan» bo‘ladi, hamkorga esa xabar ketadi. Shartnoma hisoblari bo‘yicha to‘lovlar bu yerga o‘zi yoziladi — sizning «To‘landi» belgingizdan yoki shartnomadagi «To‘lovni tasdiqlash» tugmasidan; to‘lov sizni kutayotgan paytda bu yerda shartnomaga havolali sariq qator turadi. Kartochkadagi «Egasiga qoladi» — hamkor ulushi ayirilmagan; aniq raqam — [«Moliya»](/admin/finance) bo‘limida.",
            ],
          },
        },
        {
          id: "data",
          title: "«Loyiha ma’lumotlari»",
          body: [
            "Nomi, mijoz, muddat va izohlarni loyiha mas’uli, uning rahbari va egasi tahrirlaydi; qolganlar ularni formasiz ko‘radi. Mas’ulni faqat egasi almashtiradi — «Olib boradi» maydoni: hisoblanmalar mas’ulga bog‘liq va xodim loyihani boshqa odamga yozib qo‘ya olmaydi.",
            "Summa endi bu yerda tahrirlanmaydi — u «Pul» blokida.",
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
            "**«jami lidlar»**, **«ishga olingan»** — hozir nechtasining mas’uli bor.",
            "**«yutilganlar ulushi»** — yutilganlar ÷ (yutilganlar + yutqazilganlar). Yopilgan bitimlardan hisoblanadi: hali ishdagisi yutqazilmagan. Shuning uchun lidni tashlab qo‘ymasdan, «yutqazilgan» holatini qo‘yish muhim.",
            "**«olishgacha mediana»** — murojaatdan «O‘zimga olish»gacha odatda qancha vaqt o‘tadi. O‘rtacha emas, mediana: dam olish kunlari yotib qolgan bitta lid manzarani buzmaydi. Lidni berish bu vaqtni nolga tushiradi.",
          ],
        },
        {
          id: "panels",
          title: "Pastdagi panellar",
          body: [
            "«Haftalar bo‘yicha kelishi» — 12 hafta, hafta dushanbadan. «Lidlar sifati» — A–D harflari bo‘yicha. «Holatlar». «Qayerdan keladi» — chat, forma, bot, vitrina, skaut, aloqalar. «Murojaat tili». «Nima so‘rashadi» — bitta lid bir necha qatorda bo‘lishi mumkin. «30% chegirma» — nechta murojaat chegirma olgani va nima uchun: «birinchi daqiqa» — saytda birinchi daqiqa taymeri ishlayotganda mijoz yordamchiga yozgan; «20 soniya kafolati» — javobga ulgurmaganmiz. Har bir shunday chegirma — chekning 30%.",
          ],
        },
        {
          id: "people",
          title: "Odamlar bo‘yicha jadval",
          body: {
            manager: [
              "Odamlar bo‘yicha jadvalni siz ko‘rmaysiz — uni rahbar va egasi ko‘radi. Hamkasb ismi yonidagi ochiq reyting natijadan oldin xulqni o‘zgartiradi: lidlarni muhimligiga qarab emas, osonligiga qarab olishni boshlashadi. O‘z raqamlaringizni [bosh sahifada](/admin) ko‘ring: plitkalar va «Reja va fakt».",
            ],
            head: [
              "«Mening jamoam bo‘yicha» — siz va menejerlaringiz: «Ishda», «Yutdi», «Yutqazdi», «Jami» — butun vaqt uchun, lid hozir kimga biriktirilganiga qarab. Menejerlar bu jadvalni ko‘rmaydi.",
            ],
            admin: [
              "«Menejerlar bo‘yicha» — barcha faol xodimlar, butun vaqt uchun, lid hozir kimga biriktirilganiga qarab. Rahbar faqat o‘zini va jamoasini ko‘radi, menejerlar jadvalni umuman ko‘rmaydi.",
            ],
          },
        },
        {
          id: "plans",
          title: "Rejalar qayerda",
          body: {
            manager: [
              "Bu yerda rejalar yo‘q. «Reja va fakt» — [bosh sahifada](/admin), aloqalar rejasi — [«Aloqalar»](/admin/prospect) bo‘limida.",
            ],
            head: [
              "Bu yerda rejalar yo‘q. «Reja va fakt» — [bosh sahifada](/admin), jamoaga aloqalar rejasi [«Jamoa»](/admin/team) bo‘limida qo‘yiladi.",
            ],
            admin: [
              "Bu yerda rejalar yo‘q. «Reja va fakt» — [bosh sahifaning](/admin) «Jamoa» varag‘ida, aloqalar rejasi — [«Jamoa»](/admin/team) bo‘limida.",
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
            "O‘ng tepada — davr: **«7 kun»**, **«30 kun»** yoki **«90 kun»**. Har bir raqam yonidagi strelka — u oldingi xuddi shuncha kunga nisbatan qancha o‘sgani yoki tushgani: «30 kun»da — oldingi 30 kunga nisbatan. Yashil strelka — yaxshi, sariq — yomon, «yangi» — oldin nol edi.",
            "**«tashriflar»** — saytga necha marta kirilgan: bitta odam ertalab va kechqurun — ikki tashrif. **«tashrif buyuruvchilar»** — nechta turli odam, aniqrog‘i turli brauzer: bitta odam telefondan va noutbukdan ikki marta hisoblanadi. **«ko‘rishlar»** — jami nechta sahifa ochilgan.",
            "**«rad etishlar»** — odam bitta sahifani ochib, deyarli darhol chiqib ketgan tashriflar ulushi. Bu yerda teskari: rad etishlar o‘sishi — sariq strelka, bu yomon. **«o‘rtacha tashrif»** — tashrif o‘rtacha qancha davom etadi, daqiqa:soniya.",
            "Ustunlar — kunlar bo‘yicha tashriflar, ustunga sichqonchani olib borsangiz sana va son ko‘rinadi. **«Qayerdan keladi»** — qidiruvdan, ijtimoiy tarmoqlardan, reklamadan yoki to‘g‘ridan-to‘g‘ri havola orqali. Metrikada nomlar ruscha, Google’da inglizcha: «Organic Search» — qidiruv, «Direct» — to‘g‘ridan-to‘g‘ri kirish, «Referral» — boshqa saytlardan o‘tish, «Organic Social» va «Paid Social» — ijtimoiy tarmoqlar, «Paid Search» — qidiruvdagi reklama. **«Kirish sahifalari»** — odam tashrifni qaysi sahifadan boshlagan.",
            "Raqamlar har 10 daqiqada yangilanadi: panel har ochilganda Metrika va Google’dan so‘ramaydi, shuning uchun hozirgina ishga tushirilgan reklama bu yerda darhol ko‘rinmaydi.",
          ],
        },
        {
          id: "two-sources",
          title: "Nega Metrika va Google har xil ko‘rsatadi",
          body: [
            "Metrika va Google Analytics yonma-yon turadi va qo‘shilmaydi. Har biri tashrifni o‘zicha hisoblaydi va robotlarni o‘zicha ajratadi, ba’zi odamlarning brauzerida esa ulardan biri bloklangan, ikkinchisi yo‘q. Shuning uchun raqamlar farq qiladi va bu normal: yig‘indi na u yerda, na bu yerda yo‘q raqam bo‘lardi.",
            "Aniq songa emas, yo‘nalishga qarang. Reklama ishga tushgandan keyin ikkalasi ham o‘sishni ko‘rsatsa — reklama odam olib kelyapti. Faqat bittasi o‘ssa — ehtimol gap odamlarda emas, hisoblashda.",
            "Saytga kirish — hali mijoz emas. Nechta odam yozgani [statistikada](/admin/stats), «Qayerdan keladi» blokida ko‘rinadi: u yerda murojaatlar, bu yerda tashriflar. Tashriflar ko‘paysa-yu, murojaatlar ko‘paymasa — odamlar keladi, lekin nima uchun kelganini topmaydi.",
          ],
        },
        {
          id: "connect",
          title: "Qanday ulanadi",
          body: {
            head: [
              "Egasi ulaydi: Metrika uchun serverda kalit, Google uchun — uning Google akkaunti bilan kirish kerak. Sizda ulash tugmalari yo‘q, faqat raqamlar — bu yerdan ulanishni buzib ham, almashtirib ham bo‘lmaydi.",
              "Kartochkada «Ulanmagan» yoki «Google egasining kirishi bo‘yicha ruxsat bermay qo‘ydi» deb yozilgan bo‘lsa — egasiga ayting, unga bu bir daqiqalik ish. «Javob bermadi» — odatda vaqtinchalik: sahifani bir daqiqadan keyin yangilang, takrorlansa — yana egasiga.",
            ],
            admin: [
              "**Metrika** `YANDEX_METRIKA_TOKEN` tokeni bilan ulanadi (hisoblagich raqamini panel o‘zi biladi) — serverdagi `/opt/devuz/.env` faylida yoki Supabase maxfiy ma’lumotlar omborida (Vault) `app.YANDEX_METRIKA_TOKEN` nomi bilan: `.env`da kalit bo‘lmasa, panel uni o‘sha yerdan oladi.",
              "**Google Analytics** Google orqali kirish bilan ulanadi — kalitlarsiz va serverga kirmasdan. Google Cloud’da bir marta «mijoz» (client) yaratiladi — Google panelimizni taniydigan ruxsatnoma; qadamlari «Google Analytics» kartochkasining o‘zida yozilgan. Uning Client ID va Client secret qatorlari kartochkaga qo‘yiladi, keyin — **«Saqlash va Google orqali kirish»**. Saytning Analytics’iga kirish huquqi bor Google akkaunti bilan kirish kerak va «See and download your Google Analytics data» belgisini olib tashlamaslik kerak. Resurs raqamini panel o‘zi topadi — sayt hisoblagichi `G-L52MCVNS0W` bo‘yicha. Olingan hamma narsa Supabase’ning shifrlangan maxfiy ma’lumotlar omborida saqlanadi, panelda esa faqat o‘qish huquqi bor: Analytics’da biror narsani o‘zgartira olmaydi. Har bir kirish [jurnalda](/admin/audit) ko‘rinadi.",
              "Agar Google kiritmay qo‘ysa — kartochkada «Google saqlangan kirish bo‘yicha endi ruxsat bermayapti» deb yoziladi va bu **«Google orqali kirish»** tugmasi bilan hal bo‘ladi. Ko‘pincha sabab bitta: Google Cloud’dagi ilova e’lon qilinmagan — «Testing» rejimida Google kirishni 7 kundan keyin o‘chiradi, shuning uchun u yerda bir marta «Publish app» bosish kerak. Agar panel resurs raqamini o‘zi topa olmasa («Google Analytics Admin API» yoqilmagan yoki resurs boshqa akkauntda), uni yozishni so‘raydi: Google Analytics → «Admin» → «Property details», faqat raqamlar. Raqamlar ostidagi **«qayta kirish»** havolasi — Google akkauntini almashtirish uchun.",
              "Rahbarlar bu bo‘limni ko‘radi, lekin ulash qadamlarisiz, kirish tugmalarisiz va Google akkauntingiz pochtasisiz — ularning o‘rniga «Egasi ulaydi» deb yozilgan. Menejerlarga bo‘lim ko‘rinmaydi. Oldin «Trafik» bosh sahifadagi varaq edi — eski xatcho‘plar shu yerga olib keladi.",
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
            "[Loyihani](/admin/projects) oching → «Shartnoma» bloki. To‘ldiring: sana, summa, buyurtmachining to‘liq nomi, manzili va kontakti, STIR yoki JShShIR, bank, hisob raqami (20 raqam), MFO (5 raqam), shartnoma predmeti va bosqichlar. **Bosqichlar ulushlari yig‘indisi — roppa-rosa 100%**. **«Shartnomani tayyorlash»** tugmasini bosing.",
            "Natijada DU-2026-07 ko‘rinishidagi raqamli qoralama chiqadi. Qoralamada imzo hujjatda jismonan yo‘q — uni chop etib, imzolangan deb ko‘rsatib bo‘lmaydi.",
            "Smeta chegarasidan past summani tayyorlab bo‘lmaydi — buni faqat egasi hal qiladi. Bosgandan keyin hech narsa chiqmasa, maydonlarni tekshiring: panel hozircha qaysi biri noto‘g‘riligini yozmaydi.",
          ],
        },
        {
          id: "review",
          title: "Shartnoma sahifasi: smeta va imzoga yuborish",
          body: {
            manager: [
              "Shartnoma qoralama ekan: **«Smetani yuklash»** va **«Muddat»** («60 рабочих дней с даты аванса»). Smeta Excel (xlsx), CSV, TSV va matnli PDF dan qatorma-qator o‘qiladi: panel ustunlarni sarlavha bo‘yicha topadi («Nomi», «Miqdori», «Narxi», «Summa»; ruscha sarlavhalar ham tushuniladi), «Jami» qatorini o‘tkazib yuboradi, qatorlar yig‘indisi esa shartnoma summasiga aylanadi. PDF skan yoki Word’ni o‘qib bo‘lmaydi — unda **«Smeta qatorlarini qo‘lda kiritish»**: qatorlarni Excel’dan nusxalang yoki har bir pozitsiyaga bitta qator yozing — nomi, soni, narxi «;» orqali. Smeta qatorlarisiz shartnomani imzoga yuborib bo‘lmaydi.",
              "**«Imzoga yuborish»** — panel hammasi joyidami tekshiradi, bo‘lmasa «Yetishmayapti: …» deb yozadi. Yubordingiz — egasiga Telegramda xabar bordi, shartnoma «Imzo uchun egasiga yuborilgan» holatida va boshqa tahrirlanmaydi.",
              "Egasi tasdiqlasa — «Egasi tasdiqlagan», yoki qayta ishlashga qaytaradi. Tasdiqlangandan keyin mijoz o‘z qismini imzolaydi, siz esa **«Imzolanganini yuklash»** tugmasini bosasiz (PDF yoki rasm) — shartnoma «Ikki tomon imzolagan» bo‘ladi.",
              "Telegram bildirishnomani yetkazmasa, panel shuni aytadi — egasiga og‘zaki ayting.",
            ],
            head: [
              "Siz ham menejer qiladigan ishni qilasiz: smeta (Excel, CSV, matnli PDF yoki qo‘lda qatorlar — qatorlarsiz yuborib bo‘lmaydi), «Muddat», «Imzoga yuborish», «Imzolanganini yuklash», hisoblar va buyurtmachi uchun havola. Shartnomani faqat egasi tasdiqlaydi, qaytaradi va bekor qiladi — tasdiqlash uning imzosining o‘zi.",
            ],
            admin: [
              "Imzoga shartnoma sizga Telegramda keladi va «Bugun» varag‘ida — «Imzolanadigan shartnomalar» blokida ko‘rinadi. Tugmalar: **«Tasdiqlash va imzolash»** yoki **«Qayta ishlashga qaytarish»**. Qaytarish — ishning oddiy qismi, xato emas.",
              "Tasdiqlash imzongizni qo‘yadi va **birinchi bosqichga darhol hisob chiqaradi**. Tasdiqlangan shartnomani bekor qilish — «Bekor qilish sababi» va «Bekor qilish»: shartnomalar o‘chirilmaydi, faqat belgilanadi. Tasdiqlangani tahrirlanmaydi — tuzatish kerak bo‘lsa, yangisi tayyorlanadi.",
              "Imzolar bilan skan yuklangandan keyin shartnoma ekranida imzongiz boshqa ko‘rinmaydi — u allaqachon skanda bor.",
            ],
          },
        },
        {
          id: "invoices",
          title: "Bosqichlar bo‘yicha hisoblar va buyurtmachi uchun havola",
          body: {
            manager: [
              "Har bir bosqich oldindan, narxining 100% to‘lanadi. Birinchi bosqichga hisob tasdiqlashda o‘zi chiqadi, keyingilari — **«Hisob-faktura berish»** tugmasi bilan. To‘lov muddati — 14 kun. Pul keldi — **«To‘landi»**: to‘lovni bankda ko‘rgan odam belgilaydi.",
              "Belgingizdan keyin egasiga Telegram’da xabar keladi. U «To‘lovni tasdiqlash» tugmasini bosadi — va to‘lov [loyihada](/admin/projects) to‘lov bo‘lib yoziladi: pulga tushadi va shu bo‘yicha hisoblanmalaringiz muzdan chiqadi. U tasdiqlamaguncha hisob yonida «egasining tasdig‘ini kutmoqda» deb yozilgan, loyiha kartochkasida esa sariq qator turadi. Xato belgilagan bo‘lsangiz — egasiga ayting, belgini u olib tashlaydi.",
              "**«Buyurtmachi uchun havola»** — mijoz shartnoma va hisoblarni ko‘radigan sahifa. Havola bir marta ko‘rsatiladi — darhol nusxalang. «Yangi havola yaratish» eskisini o‘chiradi.",
            ],
            head: [
              "Har bir bosqich oldindan, narxining 100% to‘lanadi. Birinchi bosqichga hisob tasdiqlashda o‘zi chiqadi, keyingilari — **«Hisob-faktura berish»** tugmasi bilan. To‘lov muddati — 14 kun. Pul keldi — **«To‘landi»**: to‘lovni bankda ko‘rgan odam belgilaydi.",
              "Belgidan keyin egasiga Telegram’da xabar keladi. U «To‘lovni tasdiqlash» tugmasini bosadi — va to‘lov [loyihada](/admin/projects) to‘lov bo‘lib yoziladi: pulga tushadi va shu bo‘yicha hisoblanmalar — sizniki ham, jamoaniki ham — muzdan chiqadi. U tasdiqlamaguncha hisob yonida «egasining tasdig‘ini kutmoqda» deb yozilgan, loyiha kartochkasida esa sariq qator turadi. Xato belgilangan bo‘lsa — egasiga ayting, belgini u olib tashlaydi.",
              "**«Buyurtmachi uchun havola»** — mijoz shartnoma va hisoblarni ko‘radigan sahifa. Havola bir marta ko‘rsatiladi — darhol nusxalang. «Yangi havola yaratish» eskisini o‘chiradi.",
            ],
            admin: [
              "Har bir bosqich oldindan, narxining 100% to‘lanadi. Birinchi bosqichga hisob tasdiqlashda o‘zi chiqadi, keyingilari — **«Hisob-faktura berish»** tugmasi bilan. To‘lov muddati — 14 kun. Pul keldi — **«To‘landi»**: to‘lovni bankda ko‘rgan odam belgilaydi.",
              "Sizning «To‘landi» belgingiz to‘lovni darhol loyihaga yozadi — loyiha kartochkasida uni ikkinchi marta yozish shart emas: hisob summasi, sana — bugun, maqsad — birinchi bosqichda avans, oxirgisida qoldiq, izohda «Счёт № … по договору № …». Agar to‘lovni xodim belgilagan bo‘lsa, sizga Telegram’da xabar keladi, hisob yonida esa — **«To‘lovni tasdiqlash»** va **«To‘lov bo‘lmagan»** (xato belgini olib tashlaydi). Tasdiqlangan to‘lov oddiy to‘lov kabi loyiha kartochkasida o‘chiriladi; shundan keyin hisob yana tasdiqni kutadi.",
              "**«Buyurtmachi uchun havola»** — mijoz shartnoma va hisoblarni ko‘radigan sahifa. Havola bir marta ko‘rsatiladi — darhol nusxalang. «Yangi havola yaratish» eskisini o‘chiradi.",
            ],
          },
        },
        {
          id: "signature",
          title: "Sizning imzongiz",
          roles: ["admin"],
          body: [
            "Shu sahifadagi «Imzo» bloki: shaffof fonli PNG, 2 MB gacha, barcha shartnomalar uchun bitta — «Yuklash» yoki «Almashtirish».",
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
              "«Xarajat qo‘shish»: sana, modda («reklama», «servislar va obunalar», «pudratchilar», «ofis va aloqa», «boshqalar»), summa va nimaga — «Yozish». Siz va egasi yoza olasiz: o‘ylab topilgan xarajat sizning ulushingizni ham kamaytiradi, shuning uchun o‘zingizga foydali yolg‘on gapirib bo‘lmaydi.",
              "Faqat egasi o‘chiradi: o‘chirish orqali birovning xarajatini manzaradan olib tashlash mumkin bo‘lardi. Xato qildingiz — unga ayting.",
            ],
            admin: [
              "«Xarajat qo‘shish» va har bir qatordagi «olib tashlash». Muassis-rahbar yoza oladi, lekin o‘chira olmaydi: o‘chirish orqali birovning xarajatini manzaradan olib tashlash mumkin, o‘ylab topilgan xarajat esa uni yozganning ulushini ham kamaytiradi.",
              "Bu yerda [«Moliya»](/admin/finance) bo‘limidagi «Studiya xarajatlari» blokidagi xarajatlarning o‘zi.",
            ],
          },
        },
        {
          id: "taxes",
          title: "Soliq muddatlari",
          body: [
            "«Soliqlar: muddati yaqinlashayotganlar» bloki — 14 kun oldinga muddatlar: aylanmadan soliq va ijtimoiy soliq — har oyning 15-sanasigacha, yillik hisobot — 1-aprelgacha. 3 kun va undan kam qolsa — sariq.",
            "Har bir sana yonida «sana buxgalter tomonidan tasdiqlanmagan» belgisi bor: bu buxgalter bilan suhbat uchun qoralama, uning so‘zi emas. Kechikish uchun jarima bir marta va to‘liq keladi, shuning uchun blok birinchi turadi.",
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
              "Rahbarga bu yerda faqat xarajatlar ko‘rinadi: foyda va undagi ulushlar — faqat sizda, [«Moliya»](/admin/finance) bo‘limidagi «Hammuassislar ulushlari» blokida. Uning 30% ini ko‘rsatish sizning 70% ingizni ham ko‘rsatish bo‘lardi.",
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
            "Daraja bo‘yicha stavkalar: **kichik menejer** — yangi mijozdan 10% va qo‘shimcha sotuvdan 0; **menejer** — 15% va 5%; **rahbar** — 30% va 30%. Daraja va shaxsiy stavkani egasi «Jamoa» bo‘limida qo‘yadi. Shaxsiy stavka darajani faqat yangi mijozlar uchun almashtiradi.",
            "Rahbar qo‘shimcha ravishda o‘z jamoasi menejerlarining har bir bitimidan 5% oladi — ustiga, ularning ulushidan emas. Muassis-rahbarda bu qator 0: u baribir qolgan hamma narsadan ulush oladi.",
            "Egasi aniq bitim uchun foiz belgilashi mumkin — u daraja va shaxsiy stavkadan muhimroq. Hisoblanma loyihada summa va mas’ul bo‘lganda paydo bo‘ladi. Bitim minusga ketdi — hisoblanma 0: minus — egasining tashvishi.",
          ],
        },
        {
          id: "freeze",
          title: "Muzlatilgan, ishlab topilgan, to‘lanadigan",
          body: [
            "**«Muzlatilgan»** — bitim bor, lekin mijoz hali butun summani to‘lamagan. **«Ishlab topilgan»** — mijoz loyihani to‘liq to‘lagan (egasi to‘lovlarni loyiha kartochkasiga yozgan). **«hisoblanmaydi»** — loyiha bekor qilingan.",
            "**«To‘lanadi»** = ishlab topilgan − to‘lab berilgan. Manfiy bo‘lsa — «oldindan to‘langan».",
            "Hisoblanmalar saqlanmaydi, har ochilganda qaytadan hisoblanadi — tannarxni o‘zgartirdingiz, raqam darhol boshqacha.",
          ],
        },
        {
          id: "page",
          title: "Sahifada nima bor",
          body: {
            manager: [
              "Siz bo‘yicha plitkalar: «Ishlab topilgan», «Muzlatilgan», «To‘langan», «To‘lanadi». Pastda «Loyihalar bo‘yicha» — loyihalaringiz: summa, to‘liq to‘langanmi va sizning hisoblanmangiz. Va sizga qilingan to‘lovlar ro‘yxati.",
              "Ko‘proq olishni xohlaysizmi — yangi mijozlar qidiring: yangi mijozdan foiz qo‘shimcha sotuvdagidan yuqori. Va o‘z [loyihalaringizni](/admin/projects) o‘zingiz oching — hisoblanma olib borayotgan odamga yoziladi.",
            ],
            head: [
              "Plitkalar — sizning balansingiz. Odamlar jadvali — siz va jamoangiz: daraja, loyihalar, muzlatilgan, ishlab topilgan, to‘lab berilgan, to‘lanadigan. «Loyihalar bo‘yicha» — siznikilar va jamoanikilar, sizning doirangiz hisoblanmalari bilan. «To‘lovlar» — sizniki va jamoaniki.",
              "Studiya foydasidagi ulushlarni va uning qoldig‘ini faqat egasi ko‘radi.",
            ],
            admin: [
              "Studiya bo‘yicha plitkalar: «Shartnomalar bo‘yicha», «Mijozlar to‘lagan», «Sof foyda» (nechta loyihada tannarx yo‘qligi belgisi bilan), «Jamoa va hamkorlarga hisoblangan», «Egasiga qoladi».",
              "Odamlar jadvali va «Loyihalar bo‘yicha» — soliq, tannarx, foyda va «Egasiga» (hamkorlar ayirilgan) ustunlari bilan. «Hammuassislar ulushlari» — kelgan pul minus xarajatlar va u qanday bo‘linadi. «Studiya xarajatlari» — [«Xarajatlar»](/admin/expenses) bo‘limidagi ro‘yxatning o‘zi.",
            ],
          },
        },
        {
          id: "payouts",
          title: "To‘lovlar",
          body: {
            manager: [
              "To‘lovlarni egasi pulni o‘tkazgandan keyin yozadi. Ular «To‘lovlar» ro‘yxatida chiqadi va «To‘lanadi»ni kamaytiradi.",
            ],
            head: [
              "To‘lovlarni faqat egasi yozadi. Siz o‘zingizga va jamoangizga qilingan to‘lovlarni ko‘rasiz.",
            ],
            admin: [
              "«To‘lovlar» → «Kimga», «Summa, $», «Sana» (bo‘sh — bugun), «Izoh» («avgust uchun») → «To‘lovni yozish». Avval pulni o‘tkazing, keyin yozing. O‘zingizga to‘lov yozib bo‘lmaydi: sizga qoldiq qoladi.",
            ],
          },
        },
      ],
    },

    /* ── Релизы ───────────────────────────────────────────────────────── */
    "/admin/releases": {
      what: "«Buyurtmalar» bo‘limida to‘lovdan keyin xaridorlar oladigan tayyor mahsulot fayllari. Faylni joylash — allaqachon to‘lagan har bir kishi aynan nimani olishini hal qilish demak, shuning uchun bo‘lim faqat egasida.",
      items: [
        {
          id: "upload",
          title: "Versiyani joylash",
          body: [
            "Avval arxivni o‘z kompyuteringizdan Supabase’dagi yopiq bucket’ga yuklang — sayt katta fayllarni qabul qilmaydi. Keyin «Relizni joylash» formasi: mahsulot, versiya, bucket, bucket ichidagi yo‘l, sha256 (ixtiyoriy) va izoh — «Joylash».",
            "Panel fayl joyidami tekshiradi. Yangi versiya amaldagi bo‘ladi, oldingisi — yo‘q.",
          ],
        },
        {
          id: "downloads",
          title: "Xaridor nimani ko‘radi",
          body: [
            "To‘lovdan keyin — buyurtma sahifasida yuklab olish tugmasini: jami 20 tagacha va kuniga 10 tagacha yuklab olish, har bir havola 60 soniya yashaydi. Reliz bo‘lmaguncha — «fayl tayyorlanmoqda».",
            "Tepada `DOWNLOAD_SIGNING_SECRET` haqida ogohlantirish bo‘lsa — yuklab olish hech kimda ishlamaydi. Kirishni yopish — [«Buyurtmalar»](/admin/orders) bo‘limidagi buyurtma kartochkasidagi tugma bilan.",
          ],
        },
      ],
    },

    /* ── Команда ──────────────────────────────────────────────────────── */
    "/admin/team": {
      what: "Xodimlar: rollar, darajalar, kim kimning rahbari, aloqalar rejasi va botning qaysi xabarlari kimga keladi. Yangi odam shu yerda qo‘shiladi, ketgani o‘chiriladi. Panelga kirish — Telegramdagi raqamli id bo‘yicha: parol yo‘q, username’ni odam bir soniyada almashtiradi, id esa — hech qachon.",
      items: [
        {
          id: "invite",
          title: "Xodim qo‘shish",
          body: {
            head: [
              "«Xodim qo‘shish» bloki: Telegram id (raqamli — odam uni @userinfobot kabi istalgan botdan bilib, sizga yuboradi), paneldagi ism, username ixtiyoriy. Sizda rol bitta — «menejer»: ikkinchi rahbarni egasi tayinlaydi. **«Qo‘shish»** tugmasini bosing.",
              "Siz qo‘shgan menejer **darhol sizniki** — egasiga bildirishnoma boradi. Odamga bot taklifnoma yuboradi: rol, unga nima ochiq va bir bosishda panelga kiritadigan «Открыть панель» tugmasi.",
              "«Taklif yetkazilmadi: bot unga hali yozmagan odamga birinchi bo‘lib yoza olmaydi» — odam hali botga yozmagan. U [botni](https://t.me/Devuz_studio_bot) ochib, «Старт» tugmasini bossin, siz esa uning qatorida «taklif yuborish»ni bosing.",
            ],
            admin: [
              "«Xodim qo‘shish»: Telegram id (raqamli, @userinfobot orqali), ism, username ixtiyoriy va rol — «loyiha rahbari» yoki «menejer». Siz qo‘shgan odam rahbarsiz bo‘ladi; uni «Rahbar» ustunida biriktiring.",
              "Bot «Открыть панель» tugmasi bilan taklifnoma yuboradi. Yetib bormadi — odam botda «Старт» tugmasini bosmagan; shundan keyin — uning qatorida «taklif yuborish». Bu id oldin bo‘lgan va o‘chirilgan bo‘lsa — odam butun tarixi bilan qaytadi.",
              "«bot buyruqlari menyusini yangilash» — agar kimdadir botda /login ko‘rinmasa. Menyu baribir har bir yangilanish chiqqanda, xodim qo‘shilganda va o‘chirilganda yangilanadi.",
            ],
          },
        },
        {
          id: "claim",
          title: "Rahbar va uning jamoasi",
          body: {
            head: [
              "«Rahbar» ustunida rahbarsiz menejerda **«o‘zimga olish»** tugmasi bor. Undan keyin u sizning jamoangizda: uning statistikasi va «Reja va fakt» — sizda, aloqalar rejasini unga siz qo‘yasiz, sizga esa uning bitimlaridan 5% hisoblanadi. Egasiga bildirishnoma boradi.",
              "Ikki rahbar bir vaqtda bossa, menejer bittasiga tushadi.",
              "Menejerni ajratish yoki boshqa rahbarga berishni faqat egasi qila oladi — o‘zingizda «siz · egasi ajratadi» yozuvini ko‘rasiz.",
            ],
            admin: [
              "«Rahbar» ustuni: rahbarni tanlang va «saqlash», yoki ajratish uchun «rahbarsiz». Odamga xabar boradi.",
              "Rahbar hech kimga biriktirilmagan menejerlarni «o‘zimga olish» tugmasi bilan o‘zi oladi, o‘zi qo‘shganlari esa darhol uniki. Bu haqda sizga «Команда» tugmasi bilan xabar keladi. Faqat siz ajratasiz.",
              "«Jamoa» nimani anglatadi: menejerning statistikasi va «Reja va fakt» — rahbarda, aloqalar rejasini u qo‘yadi, unga esa menejerning har bir bitimidan 5% (muassisda — 0).",
            ],
          },
        },
        {
          id: "plan",
          title: "Aloqalar rejasi",
          body: {
            head: [
              "O‘z menejerlaringizga — «Aloqalar rejasi» ustunida: «haftasiga» soni va «saqlash». O‘zingizga reja qo‘ymaysiz — uni egasi qo‘yadi.",
              "Bo‘sh maydon — «rejasiz»: unda kunlik to‘plam 5 ta kompaniya. 0 — reja yo‘q va to‘plam ham yo‘q. [Kunlik to‘plam](/admin/prospect) hajmi rejaga bog‘liq: reja ÷ 5, kuniga 2 dan 15 gacha.",
            ],
            admin: [
              "«Aloqalar rejasi» ustuni — o‘zingizdan boshqa istalgan odamga. Rahbar faqat o‘z odamlariga qo‘yadi. Bo‘sh maydon — «rejasiz» (kuniga 5 tadan to‘plam), 0 — na reja, na to‘plam, ko‘pi bilan 500.",
            ],
          },
        },
        {
          id: "grade",
          title: "Daraja va stavka",
          body: {
            head: [
              "Daraja va shaxsiy stavkani egasi qo‘yadi — siz ularni ko‘rasiz, lekin tahrirlamaysiz. Daraja bitim sof foydasidan foizni belgilaydi: kichik menejer — yangi mijozdan 10%, menejer — 15%, rahbar — 30%. Batafsil — [«Moliya»](/admin/finance) bo‘limida.",
            ],
            admin: [
              "«kichik menejer» (yangi mijozdan 10%, qo‘shimcha sotuvdan 0), «menejer» (15% va 5%), «rahbar» (30% va 30%). Shaxsiy stavka, % — darajani faqat yangi mijozlar uchun almashtiradi; bo‘sh — «daraja bo‘yicha».",
              "Rol almashganda daraja o‘zi almashadi: rahbarga — «rahbar», menejerga — «menejer»; shaxsiy stavka qoladi.",
            ],
          },
        },
        {
          id: "role",
          title: "Rol",
          roles: ["admin"],
          body: [
            "«rahbar qilish» / «menejer qilish». Administrator roli panel orqali hech kimga berilmaydi.",
            "Rahbarlikdan olsangiz, uning jamoasi ajraladi: panel nechta menejer rahbarsiz qolganini yozadi — ularni boshqasiga biriktiring. Menejerlarning o‘ziga bu haqda xabar berilmaydi.",
            "O‘zingizni va oxirgi administratorni lavozimdan tushirib bo‘lmaydi.",
          ],
        },
        {
          id: "notices",
          title: "Botning qaysi xabarlari keladi",
          roles: ["admin", "head"],
          body: {
            head: [
              "Oxirgi ustunda har bir menejeringizda va o‘zingizda **«Bildirishnomalar»** qatori bor — yonida «hammasi keladi» yoki «o‘chirilgan: 8 tadan 2 tasi» deb yozilgan. Uni bosing: belgilar ochiladi. Belgi turgan bo‘lsa — bot buni yuboradi, olib tashlansa — yo‘q. Keraklisini belgilab, **«Saqlash»**ni bosing. Yangi xodimlarda sukut bo‘yicha barcha belgilar turadi.",
              "Har bir belgi ostida usiz nima bo‘lishi yozilgan — olib tashlashdan oldin o‘qing. Asosiysi: **«Navbat bo‘yicha yangi buyurtmalar»**. Usiz odam [navbatdan](#leads-queue) chiqadi — lidlar unga taklif qilinmaydi va darhol keyingisiga ketadi. Bu ta’til yoki kasallik vaqtida qulay: kirish qoladi, arizalar esa yarim soatdan turib qolmaydi.",
              "Qolgan belgilar faqat Telegramdagi xabarni olib tashlaydi — ishning o‘zi panelda qoladi: eslatma lid kartochkasida ko‘rinadi, kunlik to‘plam — [«Aloqalar»](/admin/prospect)da, mijozning aloqaga javobi — o‘sha yerda. «Mijozlarning aloqalarga javoblari»ni olib tashlasangiz, menejer o‘zi «Aloqalar»ga kirmaguncha mijoz javob kutib qolishi mumkin — faqat javoblarni boshqa odam olib borsa, olib tashlang.",
              "O‘chirilmaydi: panelga taklif, rol va rahbar almashishi, lidni berishni tasdiqlash so‘rovi — bu xabarlarsiz amal bajarilmaydi. Menejerlarga belgilarni siz va egasi o‘zgartirasiz; menejerlarning o‘zi ularni ko‘rmaydi. Kim va qachon o‘zgartirgani — jurnalda.",
            ],
            admin: [
              "Oxirgi ustunda har bir xodimda (va sizda) **«Bildirishnomalar»** qatori bor — yonida «hammasi keladi» yoki «o‘chirilgan: 8 tadan 2 tasi». Bosing: belgilar ochiladi, turgan bo‘lsa — bot yuboradi, olib tashlansa — yo‘q. **«Saqlash»**. Sukut bo‘yicha hammada hammasi turadi. Loyihalar rahbari ham belgilarni o‘zgartiradi — o‘z menejerlariga va o‘ziga, lekin boshqa rahbarga va sizga emas.",
              "Har bir rolning o‘z to‘plami bor. Menejerda — navbat bo‘yicha va hamma uchun arizalar, eslatmalar, lid chatidagi xabarlar, berishlar, aloqalarga javoblar, kunlik to‘plam, haftalik tavsiyalar, vazifalar. Rahbarda yana hisobotlar. Sizda — «Navbat takliflari nusxalari» (navbat lidni kimga va qachon taklif qilgani), hisobotlar va vazifalar, navbat va to‘plamsiz: siz navbatda turmaysiz.",
              "Asosiy belgi — **«Navbat bo‘yicha yangi buyurtmalar»**: usiz odam [navbatdan](#leads-queue) chiqadi, lidlar keyingisiga ketadi. Qolganlari faqat Telegramdagi xabarni olib tashlaydi, ish panelda qoladi. Agar hammada «Hamma uchun buyurtmalar» olib tashlansa, tungi arizalarni va aloqalar bo‘yicha «🔥 Нужен прототип»ni Telegramda hech kim ko‘rmaydi — faqat panelda va sotuv chatida, agar u bo‘lsa. Aloqa muallifiga «🛠 Хотят прототип» har doim keladi — birinchi bo‘lib va 30 daqiqaga.",
              "O‘chirilmaydi: taklif, rol va rahbar almashishi, berishni tasdiqlash so‘rovi, sizga pul va shartnomalar haqidagi xabarlar. Belgilarni kim va qachon o‘zgartirgani — [jurnalda](/admin/audit).",
            ],
          },
        },
        {
          id: "disable",
          title: "Xodimni o‘chirish",
          roles: ["admin", "head"],
          body: {
            head: [
              "O‘zingizning va boshqalarning **menejerlarini** o‘zingiz o‘chira olasiz: oxirgi ustunda «O‘chirish» → nima bo‘lishini o‘qing → **«Tushunarli, o‘chirish»**. Rahbarni va egasini faqat egasi o‘chiradi, o‘zini — hech kim.",
              "Darhol: kirish yopiladi, barcha sessiyalar uziladi, kirish havolalari bekor bo‘ladi. Keyin tizim o‘zi: ishdagi lidlar navbatga qaytadi, eslatmalar va berish so‘rovlari yopiladi, yuborilmagan aloqalar zaxiraga ketadi, davom etayotgan yozishmalar esa — o‘chirilganning rahbariga (agar u sizniki bo‘lsa — sizga) yoki egasiga.",
              "Tizim bitta narsani qila olmaydi: **odamni qo‘lda chiqarib yuboring** — «Devuz Scout» kanalidan va sotuv chatidan: bot kanaldan chiqarib yubora olmaydi.",
              "O‘chirilganlar butunlay yo‘q qilinmaydi — ular sanasi bilan «O‘chirilganlar» ro‘yxatida: ularda yopilgan lidlar, hisoblanmalar va jurnal qoladi. Qaytarish — o‘sha Telegram id bilan qaytadan qo‘shish, avvalgi yozuv yoqiladi.",
            ],
            admin: [
              "«O‘chirish» → nima bo‘lishini o‘qing → **«Tushunarli, o‘chirish»**. Darhol: kirish yopiladi, barcha sessiyalar uziladi, kirish havolalari bekor bo‘ladi. Menejerlarni loyihalar rahbari ham o‘chira oladi; rahbarni — faqat siz.",
              "Keyin tizim o‘zi: uning ishdagi lidlari navbatga qaytadi («↩️ Лид вернулся в очередь…»), navbatdagi yarim soatlari tugaydi, eslatmalar va berish so‘rovlari yopiladi, yuborilmagan aloqalar zaxiraga ketadi, davom etayotgan yozishmalar esa — uning rahbariga yoki sizga. Bunday yozishmadagi lidni navbatdan kimdir olsa, yozishma olgan odamga o‘tadi. Uning jamoasi (agar u rahbar bo‘lsa) ajraladi, Telegramidagi lid kartochkalari o‘chiriladi.",
              "Tizim bitta narsani qila olmaydi: **odamni qo‘lda chiqarib yuboring** — «Devuz Scout» kanalidan va sotuv chatidan.",
              "O‘chirilganlar butunlay yo‘q qilinmaydi — ular «O‘chirilganlar» ro‘yxatida. Qaytarish — o‘sha id bilan qaytadan qo‘shish.",
            ],
          },
        },
      ],
    },

    /* ── Партнёры ─────────────────────────────────────────────────────── */
    "/admin/partners": {
      what: "O‘z havolasi bilan mijoz olib keladigan va loyiha foydasidan foiz oladigan odamlar. Bu yerda ularning havolalari, mijozlari, hisoblanmalari, to‘lov so‘rovlari va o‘zlarida joylaydigan promo materiallar. Bo‘lim faqat egasida: bu begona odamlarga beriladigan pul.",
      items: [
        {
          id: "join",
          title: "Hamkor qanday paydo bo‘ladi",
          body: [
            "O‘zi: saytda «Зарабатывай с нами» menyusida «Стать партнёром» yoki «Войти в кабинет» ni bosadi — bot uni ro‘yxatga oladi va hamkor kabinetiga bir martalik kirish tugmasini yuboradi. Botdagi /ref va /cabinet buyruqlari ham shunday. Har kim bo‘la oladi, jumladan xodim ham.",
            "Yoki siz: «Hamkorni qo‘lda qo‘shish» — ism, kod (bo‘sh — o‘zimiz o‘ylab topamiz), Telegram id ixtiyoriy, izoh. Telegram id bo‘lmasa, bunday hamkor keyin bot orqali kelgan odam bilan birlashmaydi va kabinetga kira olmaydi.",
            "Havolalar: qisqa `devuz.studio/r/…` — hamkor aynan shuni e’lon qiladi, har bir kanal uchun alohida (kabinetda yoki `/ref KOD belgi`), 20 tagacha. Kabinetda hamkor havola qayerga olib borishini (bosh sahifa, xizmatlar, keyslar, bot) va auditoriya uchun bonusni — birinchi loyihaga 5/10/15% chegirmani tanlaydi. Eski `?ref=KOD` va `start=ref_KOD` avvalgidek ishlaydi. Havola orqali o‘tishni sayt brauzer cookie’sida 30 kun eslab qoladi (birinchi hamkor yutadi): shu vaqt ichidagi so‘rov — hamkorning mijozi, hatto odam keyin havolasiz qaytgan bo‘lsa ham. Lid kartochkasida «Hamkor» yonida o‘tish so‘rovdan necha kun oldin bo‘lgani ko‘rinadi. Botda ham xuddi shu 30 kun.",
            "O‘tishlar odamlar bo‘yicha hisoblanadi: messenjerdagi oldindan ko‘rish roboti va o‘sha kuni o‘sha odamning qayta ochishi hisoblanmaydi. Quyidagi jadvalda havolada — «o‘tishlar / so‘rovlar»; kod ustiga kursorni olib borsangiz — qisqa manzilni ko‘rasiz.",
          ],
        },
        {
          id: "count",
          title: "Mijoz qachon hisobga olinadi",
          body: [
            "Havola orqali kelgan lid hamkorga hisoblanadi, agar bu uning o‘zi bo‘lmasa, mijoz oldin bizda bo‘lmagan bo‘lsa va hamkor bloklanmagan bo‘lsa. Hisoblandi — hamkorga «🤝 По вашей ссылке пришёл…» keladi. Mijoz saytga havola orqali kelib, keyin sayt chatidan botga yozsa ham, hamkor unga biriktirilgan bo‘lib qoladi.",
            "Bunday liddan ochilgan loyiha hamkorni meros oladi. Loyiha kartochkasida, «Hamkor» blokida kim olib kelganini, foizni va «Hisobga olmaslik sababi»ni o‘zgartirish mumkin. Loyiha bo‘yicha imzolangan shartnoma skanini yuklashganda, hamkorga darhol «📝 С клиентом … подписан договор» keladi — summa va taxminiy ulush bilan.",
            "Bloklash faqat yangi hisoblashlarni to‘xtatadi: eski hisoblanmalar va to‘lovlar qoladi.",
          ],
        },
        {
          id: "percent",
          title: "Foiz",
          body: [
            "Ikki model, hamkor o‘zi kabinetda tanlaydi. «От чистой прибыли» (summa − soliq − tannarx): $2 500 gacha — 10%, $2 501–5 000 — 15%, $5 001–10 000 — 20%, $10 001–30 000 — 25%, $30 001 dan — 30%. «С оборота» (butun shartnoma summasi) xuddi shu chegaralarda: 6, 10, 14, 17, 20%. Har bir loyihaning pog‘onasi o‘z summasiga qarab. «Barcha hamkorlar» jadvalida, «Stavka» ustunida model va qachon o‘zgartirilgani ko‘rinadi.",
            "Model haftasiga bir martadan ko‘p o‘zgarmaydi, mijozga esa uning so‘rovi kunidagi model biriktiriladi: o‘zgartirish ketayotgan loyihalarni qayta hisoblamaydi. Loyiha kartochkasida «Hamkor» yonida — «20 % foydadan» yoki «14 % aylanmadan». Loyihadagi foiz hamkorning shaxsiy stavkasidan muhimroq, shaxsiysi — pog‘onadan. «foydadan» modeli uchun loyiha tannarxini kiriting — usiz ulush soliq ayirilgan summadan hisoblanadi.",
            "Mijoz loyihani to‘liq to‘lamaguncha hisoblanma muzlatilgan — xodimlardagi kabi.",
            "Jamg‘arma. Hamkor kabinetida tugma bor: o‘zbekcha kabinetda — «Avtomatik rejimda olmaslik», ruscha kabinetda — «Не забирать в автоматическом режиме». U yoqilgan paytda to‘langan loyihalar uchun pul hamkorga darhol ketmaydi: aylanmadan avtoto‘lovlar bo‘lmaydi, to‘langan va hali to‘lanmagan barcha loyihalar bo‘yicha stavka esa ularning umumiy summasi bo‘yicha — o‘sha jadval bo‘yicha hisoblanadi. $2 000 lik uchta loyiha — bu $6 000, va uchalasi bo‘yicha 10% (6%) emas, foydadan 20% (aylanmadan 14%). Studiya pulni o‘zida uzoqroq ushlab, rivojlanishga yo‘naltiradi, hamkor esa oxirida ko‘proq oladi. Stavka oddiysidan past bo‘lmaydi; qo‘lda foiz berilgan loyiha va shaxsiy stavkali hamkor jamg‘armada qatnashmaydi. «Barcha hamkorlar» jadvalida, «Stavka» ustunida bunday hamkorda yashil «jamg‘arma: $… · stavka …%» qatori bor. Tugmani o‘chirsa — oshirish yo‘qoladi, to‘lanmagani har bir loyihaning oddiy pog‘onasi bo‘yicha hisoblanadi, aylanmadan avtoto‘lovlar qaytadi.",
          ],
        },
        {
          id: "agencies",
          title: "Hamkorlarning agentliklari",
          body: [
            "Hamkor kabinetda ishlab chiqish bo‘yicha buyurtmalari muntazam bo‘ladigan har qanday agentlik yoki kompaniyani ulashi mumkin: IT-kompaniya, veb-studiya, marketing agentligi, integrator, IT-tenderlardagi bosh pudratchi (biz unda — subpudratchi). U bizga o‘z mijozlarining buyurtmalarini subpudratga beradi. Sizga «🏢 Партнёр подключает агентство» keladi, bu sahifada esa «Hamkorlar agentliklari» blokida — «qaror kutmoqda» qatori. **«Tasdiqlash»** — agar agentlik biz bilan hali ishlamagan bo‘lsa; sabab bilan **«rad etish»** — agar ishlagan bo‘lsa yoki bu agentlik bo‘lmasa. Ikkala holatda ham bot hamkorga yozadi.",
            "Tasdiqlangan agentlik — tasdiqlangandan keyin 12 oy davomida uning barcha buyurtmalari hamkorga, 30 kunlik oynasiz va «mijoz studiyada avval bo‘lgan» tekshiruvisiz: agentlikning takroriy buyurtmalari — asosiy maqsad. Muddat agentlik qatorida ko‘rinadi: «buyurtmalar hamkorga … gacha». U tugagach, agentlikning yangi buyurtmalari oddiy tartibda o‘tadi, bog‘langanlari esa hamkorda qoladi; **«12 oyga uzaytirish»** tugmasi bugundan boshlab yangi muddatni boshlaydi. O‘chirilgan agentlikda qayta «Tasdiqlash» ham muddatni yangidan boshlaydi. Sayt va botdan kelgan so‘rovlar o‘zi taniladi — agentlik kontakti (@nik, telefon, pochta) yoki kompaniya nomi bo‘yicha. Qo‘ng‘iroq yoki menejer shaxsiy xabari orqali kelgan buyurtmani loyiha kartochkasida bog‘lang: «Hamkor» bloki → «Agentlik buyurtmasi».",
            "Bitta agentlik — bitta hamkorga: xuddi shu agentlikni ikkinchi marta ulab bo‘lmaydi. Ulanganida «o‘chirish» — agentlikning yangi buyurtmalari endi hamkorga bormaydi, bog‘langanlari qoladi. Loyiha kartochkasida «Agentlik buyurtmasi» faqat muddati tugamagan agentliklarni taklif qiladi.",
            "Hamkor kabinetida yuborish uchun ikkita taqdimot bor — «DevUz Studio» (jamoa, loyihalar, tillar, xizmatlar, boshlang‘ich narxlar, keyslar) va «Программа для агентств и компаний» (modellar, agentlik misoli, tender subpudrati). Havola hamkor kodini olib yuradi, shuning uchun taqdimotdan kelgan mijoz unga hisoblanadi.",
          ],
        },
        {
          id: "claims",
          title: "Qo‘lda biriktirilgan mijozlar",
          body: [
            "Kompaniyani o‘zi — havolasiz — olib keladigan hamkor uni saytdagi kabinetda, «Mening mijozlarim» blokida biriktiradi: nomi, STIR (INN, 9–12 raqam) — hamkor bilsa, mas’ul shaxs, telefon yoki Telegram (kamida bittasi), sayt va mijozga nima kerakligi. Tasdiqlash shart emas — biriktirish darhol kuchga kiradi, kim oldin biriktirsa, mijoz o‘shaniki. Buning o‘rniga so‘rov paytida baza o‘zi tekshiradi: bu kompaniya lidlar, loyihalar, shartnomalar va [Aloqalar](/admin/prospect) orasida yo‘qmi — STIR, nom, telefon, Telegram va sayt bo‘yicha — va uni boshqa hamkor yoki uning agentligi biriktirmaganmi. Qanday solishtiriladi: STIR, telefon, Telegram yoki sayt mos kelsa — bu o‘sha kompaniya. Faqat nom mos kelsa — STIR hal qiladi: ikkala tomonda ma’lum va har xil bo‘lsa, bu bir xil nomli ikki xil kompaniya, biriktirish mumkin. Hamkor STIRni ko‘rsatmagan, bizda esa shunday STIRli kompaniya bo‘lsa — u «Bunday nomli kompaniya bizda allaqachon bor. STIRni kiriting…» ni ko‘radi. Bizda STIR bo‘lmasa (STIRsiz lid yoki aloqa) — ajratishga hech narsa yo‘q va bu bizning kompaniyamiz hisoblanadi. Tekshiruvdan o‘tmasa — hamkor sababi bilan rad javobini ko‘radi («studiyada allaqachon bor», «boshqa hamkor biriktirgan»), biriktirish bo‘lmaydi. Shunday qilib biz allaqachon ishlayotgan yoki yozgan kompaniyalarni «egallab olish» mumkin emas. Bitta hamkordan oyiga 20 tadan ortiq biriktirish qabul qilinmaydi.",
            "Sizga STIR va kontakt bilan «🧾 Партнёр закрепил клиента» keladi, bu yerda esa «Hamkorlar biriktirgan mijozlar» blokida qator paydo bo‘ladi. Biriktirishdan darhol hamkor bergan hamma narsa bilan «hamkordan» ustuvor lid ochiladi — uni barcha menejerlar ko‘radi (qanday tarqatilishi — [navbat](#leads-queue) bandida). Shu daqiqadan 12 oy mijozning barcha buyurtmalari hamkorga hisoblanadi — «buyurtmalar … gacha hamkorga», hamkorga esa «🧾 Клиент … закреплён за вами и передан менеджерам» ketadi. Mijoz keyin o‘zi yozsa, uning so‘rovi ham taniladi: saytdagi formadan, chat va botdan — STIR, nom, telefon yoki Telegram mos kelsa; keyinroq ham — menejer lid kartochkasiga STIRni yozganda. Hamkorning havolasi yoki agentligi ishlagan bo‘lsa, ular biriktirishdan muhimroq. Bunday liddan ochilgan loyiha hamkorni meros oladi. 12 oy o‘tsa — «muddat tugadi»: yangi buyurtmalar oddiydek ketadi, allaqachon bog‘langanlari hamkorda qoladi, kompaniyani esa yana biriktirish mumkin.",
            "Kompaniya aslida bizniki ekanini ko‘rsangiz — u bilan paneldan tashqarida ishlaganmiz, studiya tanishlari, — sababini yozing va **«biriktirishni bekor qilish»** ni bosing. Sababsiz bekor bo‘lmaydi: uni hamkor botda oladi. Bekor qilingandan keyin mijozning yangi so‘rovlari hamkorga hisoblanmaydi; allaqachon bog‘langan lid yoki loyiha loyiha kartochkasida, «Hamkor» blokida o‘tkaziladi.",
          ],
        },
        {
          id: "promo",
          title: "Promo materiallar",
          body: [
            "Hamkorlar o‘zlarida joylaydigan studiya roliklari va rasmlari ombori: Reels, Shorts, TikTok, stories, kanallar. Bu sahifa tepasidagi «Promo-materiallar» havolasi orqali ochiladi — yoki to‘g‘ridan-to‘g‘ri: [«Promo-materiallar»](/admin/partners/promo). Hamkor ularni saytdagi kabinetida, «Промо-материалы» blokida ko‘radi: prevyu, «Скачать» va «Подпись к посту», yonida «Скопировать подпись» tugmasi. Izohda aynan shu hamkorning qisqa havolasi allaqachon turadi, shuning uchun uning postidan kelgan mijoz unga hisoblanadi — uning har qanday havolasidagi kabi. Materiallar bo‘lmaguncha hamkor bu blokni umuman ko‘rmaydi.",
            "Yuklash: faylni tanlang — MP4, MOV, WebM rolik yoki PNG, JPG, WebP, GIF rasm, 500 MB gacha. Fayllar Supabase’da emas, bizning serverimiz diskida turadi: u yerda bepul tarifda bitta fayl 50 MB dan, oylik yuklab olish 5 GB dan oshmaydi. Yuklashdan keyin diskda 2 GB dan kam joy qolsa ham server rad etadi — va qancha bo‘sh joy borligini aytadi. Nomni hamkorlar ko‘radi. «Rolikdagi so‘zlar tili» tartibni hal qiladi: hamkorga avval uning tilidagi va «so‘zsiz» materiallar, keyin qolganlari ko‘rsatiladi — boshqa tillarni yashirish shart emas, Toshkentdagi hamkor rus va o‘zbek rolikni ham joylaydi. **«Yuklash»**ni bosing: fayl serverga 4 MB lik bo‘laklar bilan ketadi, chiziq qancha ketganini ko‘rsatadi; aloqa uzilgan bo‘lak o‘zi qayta yuboriladi. «Tayyor» chiqmaguncha sahifani yopmang — tashlab ketilgan yuklash bir kundan keyin serverdan o‘chiriladi.",
            "Post izohi: matndagi `{link}` har bir hamkorning qisqa havolasiga aylanadi; `{link}` ni unutsangiz — havola oxirgi qatorga qo‘yiladi, havolasiz post hamkorga hech narsa bermaydi. Maydonni bo‘sh qoldirsangiz — hamkor o‘z tilidagi standart izohni oladi (u bo‘sh maydonda kulrang ko‘rinadi). «Hamkorlarga Telegramda yangi material paydo bo‘lgani haqida xabar berish» belgisi — bot barcha faol hamkorlarga yangi material paydo bo‘lganini yozadi. Bir nechta faylni ketma-ket yuklasangiz — belgini faqat oxirgisida qoldiring, aks holda hamkor ketma-ket bir nechta xabar oladi.",
            "Har bir materialda necha marta yuklab olingani va nechta turli hamkor olgani ko‘rinadi: shundan ularga nima kerakligi, nima bekor yotgani tushunarli. Nom, til va izoh shu yerning o‘zida tahrirlanadi — «saqlash». **«Hamkorlardan yashirish»** materialni kabinetdan olib tashlaydi va yuklab olishni darhol yopadi, lekin fayl qoladi — «Hamkorlarga ko‘rsatish» tugmasi bilan qaytariladi. «o‘chirish» → **«Butunlay o‘chirish»** faylni serverdan ham o‘chiradi; hamkorlar allaqachon yuklab olgan nusxalar ularda qoladi. Rolik fayllari bazaning tungi zaxira nusxasiga kirmaydi — asl fayllarni o‘zingizda saqlang.",
          ],
        },
        {
          id: "payout",
          title: "Hamkorga to‘lov",
          body: [
            "Hamkor kabinetda «Запросить выплату» ni bosadi yoki botga /payout va rekvizitlarini yozadi (USDT TRC-20 yoki matn). Oyning birinchi ish kunidan boshlab, $50 dan, bitta ochiq so‘rov, doim butun mavjud summaga. Sizga «💸 Заявка на выплату» keladi.",
            "Avval pulni o‘zingiz o‘tkazing, keyin «To‘lov so‘rovlari» blokida **«To‘landi»** tugmasini bosing (izoh bilan ham bo‘ladi). Yoki «rad etish» — summa mavjud pulga qaytadi, hamkor sababini ko‘radi.",
            "«Aylanmadan» modeli so‘rovni kutmaydi: loyiha bo‘yicha to‘lovlar uning summasiga yetishi bilan — to‘lov [Moliya](/admin/finance) bo‘limida yozilganda yoki shartnoma hisobida «To‘landi» bosilganda — to‘lov so‘rovi o‘zi yaratiladi, hamkorning shu loyihadagi butun ulushiga, oy boshini kutmasdan va $50 minimumisiz. Hamkorga — «✅ … выплата в обработке» (rekvizitlari bo‘lmasa — ularni kabinetga kiritish iltimosi), sizga — «💸 Выплата партнёру с оборота: выплатить … за …». «To‘lov so‘rovlari» blokida bunday qatorda «aylanmadan, «…» uchun — loyiha to‘liq to‘langanda o‘zi yaratildi» degan yozuv bor; keyin oddiysidek: o‘tkazdingiz — **«To‘landi»**. Bitta loyiha bo‘yicha bunday so‘rov qat’iy bitta yaratiladi: rad etsangiz — summa hamkorning mavjud puliga qaytadi va u uni oddiy so‘rov bilan so‘raydi. To‘lovni yozish yarim yo‘lda uzilib qolsa, svip o‘tkazib yuborilganini bir necha daqiqada yaratadi. «Foydadan» modeli — avvalgidek hamkor so‘rovi bo‘yicha: uning ulushi tannarxga bog‘liq.",
            "Jamg‘armasi yoqilgan hamkor pulni o‘zi xohlagan paytda oladi — o‘sha so‘rov bilan (kabinetda to‘lov so‘rash tugmasi yoki /payout), oyning birinchi ish kunidan boshlab va $50 minimum bilan. So‘rov jamg‘armadagi barcha loyihalarni uning stavkasi bo‘yicha yopadi: bu stavka ularga mahkamlanadi, keyingi jamg‘arma esa noldan boshlanadi. So‘rovni rad etsangiz — loyihalar jamg‘armaga qaytadi.",
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
            "«Mijoz sayti», nisha (shinomontaj, avtoservis, avtomoyka, barbershop, go‘zallik saloni, tirnoq studiyasi, deteyling, stomatologiya, o‘quv markazi, tibbiyot markazi) va sahifa tili. Nomi, tavsifi, telefoni, messenjerlari va logotipi uning saytidan o‘zi olinadi.",
            "Xizmatlar — har qatorga bittadan, uning so‘zlari bilan, 3 tadan 12 tagacha. Narx — ikki tomonida bo‘sh joy qoldirilgan tiredan keyin, va faqat mijoz o‘zi aytgani. «Saytda topilganini almashtirish» — agar sayt xato qilgan bo‘lsa. «Prototipni yig‘ish».",
          ],
        },
        {
          id: "auto",
          title: "O‘zi yig‘ilganlar — aloqalar uchun",
          body: [
            "«o‘zi yig‘ildi, aloqa uchun» belgisi bor prototiplarni panel sizsiz, aloqa xatini tayyorlayotganda yig‘gan: eng yomon saytli kompaniyalarga, yig‘uvchi biladigan nishalarda. Nomi, kontaktlari, logotipi va suratlari — uning saytidan, xizmatlar — uning saytida yozilganlari, har biri so‘zma-so‘z solishtirilgan. Tekshiruv qo‘lda yig‘ilganlarniki bilan bir xil: e’tiroz bo‘lsa, prototip «qoralama» bo‘lib qoladi va xatga tushmaydi.",
            "Bunday prototipning havolasi aloqa xatida o‘zi ketadi — «Mijozga yubordim» tugmasini bosish shart emas: xat ketganda prototip «yuborilgan» bo‘ladi. Menejerda bu qanday ko‘rinishi — [prototip oldindan](#prospect-proto-ahead).",
          ],
        },
        {
          id: "check",
          title: "Tekshiruv va havola",
          body: [
            "Tayyor sahifani tekshiruv o‘qiydi: o‘ylab topilgan raqamlar, foizlar, maqtanish, kompaniya nomi yo‘q, ishlamaydigan tugma, mijoz aytmagan xizmatlar. Topsa — prototip «qoralama» bo‘lib qoladi, havola 404 beradi, muammolar esa sanab o‘tiladi: tuzating va qaytadan yig‘ing.",
            "Toza — «tayyor», havola allaqachon ishlaydi: «Havolani nusxalash». Yubordingiz — «Mijozga yubordim».",
          ],
        },
        {
          id: "opens",
          title: "Mijoz ochdimi",
          body: [
            "«… da ochgan, kirishlar: N» yoki «hali ochmagan». Odamning har bir ochilishi hisoblanadi; sizning paneldan o‘z ochishlaringiz (shu brauzerda panelga kirgansiz) va messenjer o‘zi chizadigan havola prevyusi hisoblanmaydi.",
            "Ochib, ikkinchi marta qaytdi — bugun qo‘ng‘iroq qiling. Ikki kunda ochmadi — havola unga yetib bormagan. Prototipdagi «Yozilish» (rus tilidagi sahifada «Записаться») tugmasi mijozning o‘z Telegrami yoki WhatsApp’ini ochadi — shunda u buning ishlashini ko‘radi.",
          ],
        },
        {
          id: "trace",
          title: "Yashirin iz va begona saytni tekshirish",
          body: [
            "Har bir prototipga yig‘ishda yashirin iz joylanadi: ranglar tuslari, burchak yumaloqligi, harflar oralig‘i va qator balandligi ko‘z ajrata olmaydigan miqdorga siljitiladi, siljishlar to‘plami esa har bir prototipda o‘ziniki. Sahifada bu haqda bir so‘z ham yo‘q, nima siljitilganini faqat panel biladi. Avval yig‘ilgan prototiplar izni va shartlar haqidagi qatorni o‘zi oladi — mijoz birinchi marta ochganda yoki siz shu bo‘limga kirganingizda.",
            "Har bir prototipning pastki qismida maketlarni taqdim etish shartlariga (devuz.studio/uz/mockup-terms) havola bilan «Prototip DevUz Studio’ga tegishli. Undan faqat shartnoma asosida foydalanish mumkin» qatori bor: jarima mijozga e’lon qilingan narxning 200%, agar narx aytilmagan bo‘lsa — shunday ishlar uchun narxlarimizning 200%. Mijoz bepul maketga rozi bo‘lganda, shartlarga havola unga o‘sha yozishmada o‘zi ketadi — tanishib chiqish uchun, alohida «roziman» kerak emas: shartlar undan keyingi harakatlari bilan qabul qilinadi — loyiha haqida javob yozdi, maketni oldi yoki ochdi. So‘ralmasdan yuborilgan prototip ochilishi bilan qabul qilinadi — havola uning o‘zida turibdi. Rozi bo‘lmasa — maketni olishdan oldin aytishi kerak, unda maket qilmaymiz.",
            "«Saytni maketimizga tekshirish»: begona sayt manzilini kiriting va «Tekshirish» tugmasini bosing. Panel uning uslublarini o‘qiydi va barcha prototiplar izlari bilan solishtiradi. «bizning maket — aniq» — yashirin qiymatlarning yarmidan ko‘pi mos keldi, tasodifan bunday bo‘lmaydi; «maketimizga o‘xshaydi» — bir nechtasi mos keldi, ular orasida rang ham bor. Iz bitta prototipga ishora qilsa, panel shuni yozadi — u shu mijozga ko‘rsatilgan — va yonida ochilgan sanalar va manzillar.",
            "Ko‘rsatish jurnali prototipni tirik odam har bir ochishini yozadi: vaqt, manzil va brauzer; messenjer prevyulari va sizning paneldan ochishlaringiz yozilmaydi. Bu mijoz maketni ko‘rgani va shartlarni qabul qilganining dalili. Da’vo uchun tekshiruv natijasini saqlang va saytni notarial ko‘rikdan o‘tkazishga buyurtma bering.",
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
            "Har kuni Toshkent vaqti bilan 08:03 da smena «Aloqalar» bo‘limidagi hali yozilmagan saytlarni oladi, 12 tagachasini ko‘radi va 3 tagacha tahlil yozadi — ruscha va o‘zbekcha. «Смена разборов» hisoboti Telegramga keladi: nechtasi chiqdi va qolganlari nega olinmadi.",
            "Rad etish sabablari: sayt ochilmadi, sayt joyida yoki topilmalar kam, nisha yoki shahar aniqlanmadi, nishani tahlil qilmaymiz (tibbiyot), maqola tekshiruvdan o‘tmadi. 11:03 gacha hisobot bo‘lmasa — «Смена разборов — молчит» keladi.",
          ],
        },
        {
          id: "tender",
          title: "Haftaning tender tahlili",
          body: [
            "Haftada bir marta, haftaning birinchi kuni Toshkent vaqti bilan 08:33 dan keyin, alohida smena tender tahlilini yozadi: begona saytni emas, IT-xaridning odatiy texnik topshirig‘ini — davlat tashkiloti sayti, CRM, elektron hujjat aylanishi, chat-bot va hokazo. Bunday texnik topshiriqda odatda nima e’tibordan chetda qoladi, qabulda bu nimaga olib keladi va qanday to‘g‘ri yozish kerak. Mavzu `content/razbor/tenders.ts` dagi ro‘yxatdan navbatdagisi olinadi; maqola buyurtmachilar, xaridlar va shartnoma summalarini nomlamaydi. Agar dushanba kuni server ishlamagan bo‘lsa, maqola u ko‘tarilgan kuni chiqadi.",
            "Maqola shu yerga, «Tekshiruvda»ga «tenderlar va davlat shartnomalari» belgisi bilan tushadi — uning suratlari yo‘q va bo‘lmaydi, shunday rejalashtirilgan. Sayt tahlili kabi tekshirasiz va nashr qilasiz; saytda u «Тендеры и госконтракты» xizmatiga va «Контакты» ga olib boradi. Hisobot Telegramga alohida «Тендерный разбор недели» qatori bilan keladi. Rad etilgan mavzu ikkinchi marta yozilmaydi; mavzular tugaganda hisobot shuni aytadi — ro‘yxat kodda to‘ldiriladi.",
          ],
        },
        {
          id: "marketing-articles",
          title: "Marketing haqida maqolalar",
          body: [
            "Saytdagi «Marketing» sahifasi ostida (devuz.studio/ru/marketing va devuz.studio/uz/marketing) har kuni ikkita qisqa maqola chiqadi — Toshkent vaqti bilan 10:00 va 16:00 da, birdaniga rus va o‘zbek tillarida. Ularni arzon model `content/marketing-topics.ts` dagi mavzular ro‘yxati bo‘yicha yozadi: O‘zbekistonda qidiriladigan narsa bo‘yicha tushuntirish («что такое SMM», «SMM nima», «Toshkentda reklama» — so‘rovlar Google Trends’dan olingan), mashhur reklama keysi, keng tarqalgan xato, nishani kanalda targ‘ib qilish — navbat bilan. So‘rov sarlavhada, tavsifda va birinchi xatboshida turadi — busiz maqola chiqmaydi. Ular «Tekshiruvda»ga tushmaydi: o‘zi chiqadi, darhol sayt xaritasiga qo‘shiladi, Bing va Yandex esa signal oladi. Nima uchun: har bir maqola — bizni Google va Yandexda topadigan yana bitta sahifa, har birining oxirida esa «sayt + marketing» taklifi va kalkulyator.",
            "Inson tekshiruvi o‘rnida kod turadi: keys tahlilida mavzu faktlarida yo‘q birorta ham raqam bo‘lishi mumkin emas, qolgan maqolalarda — foizlar, summalar va yillar yo‘q, o‘zbekcha versiya — faqat lotin yozuvida. Tekshiruvdan ikki marta o‘tmasa — bu safar maqola chiqmaydi, Telegramga esa sababi bilan «Статьи о маркетинге» qatori keladi. Mavzular tugaganda ham (taxminan ikki oydan keyin) shu qator xabar beradi — ro‘yxat kodda to‘ldiriladi. Chiqqan maqolani paneldan olib tashlab bo‘lmaydi: dasturchilar chatiga yozing, uni bazada yashirishadi.",
          ],
        },
        {
          id: "review",
          title: "Tahlilni tekshirish",
          body: [
            "«Tekshiruvda» blokida — ikkala maqola to‘liq. Ikkalasini o‘qing: ular bir-birining tarjimasi emas, turli so‘rovlar uchun turli sahifalar. Manba-sayt manzili faqat sizga ko‘rinadi — saytda u yo‘q.",
            "Kompaniya hech qayerda nomlanmaganini tekshiring — na nomi, na manzili, na rasmda, va har bir raqam topilmalarda borligini. «Tahrirlash» faqat matnni o‘zgartiradi: sarlavha, tavsif, kirish, topilmalar va xulosa; manzil va so‘rov o‘zgarmaydi.",
          ],
        },
        {
          id: "publish",
          title: "Chop etish, olib tashlash, rad etish",
          body: [
            "**«E’lon qilish»** — ikkala maqola kerak. Sahifa saytda darhol ochiladi, sayt xaritasi yangilanadi, Bing va Yandex signal oladi. **«E’londan olish»** tahlilni «Tekshiruvda»ga qaytaradi.",
            "**«E’lon qilmaymiz»** — sabab bilan yoki sababsiz. Smena bu saytga boshqa qaytmaydi. Saytni smena navbatiga qaytarish — faqat **«O‘chirish»** (maydonga «o‘chirish» deb yozing).",
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
            "«Kim» filtri — xodim (o‘chirilganlar belgilangan) yoki «tizim» — taymer, bot yoki bot orqali hamkor qilgan hamma narsa. «Nima» — 75 ga yaqin harakat turi. Har sahifada 100 ta yozuv.",
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
            "Qator bo‘yicha xulosa: «asosiy» — foydalanish huquqi borlarning kamida yarmi ishlatadi; «bir-ikki kishida» — kamrog‘i; «hech kim — ortiqchami?» — hech kim. Faqat rahbarlar uchun funksiyalar rahbarlar bo‘yicha hisoblanadi.",
          ],
        },
        {
          id: "use",
          title: "Bu bilan nima qilish kerak",
          body: [
            "«Hech kim — ortiqchami?» — so‘rash uchun sabab: funksiya keraksizmi yoki u haqda bilishmaydimi. Ko‘pincha javob — ikkinchisi: unda yo‘riqnomadagi band va «?» tugmasi yordam beradi.",
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
            "Istalgan bo‘limning tepasida — «Bo‘limdan qanday foydalanish» tugmasi: u shu yerda o‘sha bo‘limning bandini ochadi. Bo‘limlar ichidagi murakkab bloklar yonida — kichik «?», u to‘g‘ri kerakli bandga olib boradi.",
            "Tepada — mundarija va yo‘riqnoma tilini almashtirish. Yo‘riqnomaning o‘zi — bo‘lim tugmasidan ham, «?» dan ham — [panel tilida](#help-language) ochiladi.",
            "Biror narsa yetishmasa yoki ekrandagidan boshqacha yozilgan bo‘lsa — egasiga ayting, qo‘shib qo‘yamiz.",
          ],
        },
        {
          id: "language",
          title: "Panel tili: RU / UZ / PL",
          body: [
            "Panel tepasida, «Bo‘limdan qanday foydalanish» yonida — **RU / UZ / PL** tanlagichi: ruscha, o‘zbekcha (lotin yozuvida) va polyakcha. Keraklisini bosing — sahifa darhol shu tilda qayta ochiladi, manzil va ochiq bo‘lim o‘zgarmaydi.",
            "Til brauzerga emas, sizga saqlanadi: telefondan yoki boshqa kompyuterdan kirsangiz ham, panel o‘sha tilda ochiladi. Tilni faqat o‘zingizga o‘zgartira olasiz — hamkasblaringizda u o‘zgarmaydi. Til tanlanmaguncha panel ruscha.",
            "Panel to‘liq tarjima qilingan: tugmalar, yozuvlar va maslahatlar — tanlangan tilda. Ruscha faqat Telegramdagi bot xabarlari va tugmalari (bot hozircha ruscha yozadi), hamkor kabineti va buyurtmachi uchun shartnoma matni qoladi — yo‘riqnomada ular ruscha nomlangan, ekranda ko‘z bilan topishingiz uchun.",
            "Yo‘riqnoma panel tilida ochiladi: ruscha, o‘zbekcha yoki polyakcha. Yo‘riqnomaning boshqa tilini shu sahifaning tepasida tanlash mumkin — bu panel tiliga ta’sir qilmaydi.",
          ],
        },
        {
          id: "first-day",
          title: "Birinchi kuni nima qilish kerak",
          body: [
            "[Studiya botini](https://t.me/Devuz_studio_bot) oching va «Старт» tugmasini bosing — busiz u sizga na lid, na eslatma yubora oladi. Panelga kirish — /login buyrug‘i bilan.",
            "«Devuz Scout» kanaliga qo‘shiling va bot hamda kanal ovozini yoqing: lid taklifi 30 daqiqa yashaydi, chatdagi post — bir-ikki soat.",
            "[Lidlar navbati](#leads-queue) va [lid kartochkasi](#leads-card) haqidagi bandlarni o‘qing — bu ishning asosi. Qolganini bo‘limni birinchi marta ochganingizda o‘qing: «Bo‘limdan qanday foydalanish» tugmasi doim tepada.",
          ],
        },
        {
          id: "owner-view",
          title: "Jamoa ko‘zi bilan ko‘rish",
          roles: ["admin"],
          body: [
            "«Kim sifatida ko‘rsatish: egasi / rahbar / menejer» — yo‘riqnoma aynan shu roldagi odam o‘qiydigan ko‘rinishda: sizning bo‘limlaringizsiz va uning matni bilan. Shunday qilib yangi odamga nima tushuntirilayotganini birovning akkauntiga kirmasdan tekshirasiz.",
            "Qo‘shimchalar uchun qoida: har bir yangi funksiya shu yerdagi o‘z bandi bilan birga keladi — rus, o‘zbek va polyak tillarida, rollar bo‘yicha. Bu har bir yangilanish chiqishida test bilan tekshiriladi.",
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
        "Bot qaysi xabarlarni yuborishini egasi va loyihalar rahbari «Jamoa» sahifasidagi belgilar bilan tanlaydi. Nimadir kelmasa — ulardan so‘rang: ehtimol, o‘sha belgi olib tashlangan.",
        "Menejerlar va rahbarlarga: chat pastidagi «▶️ Получать лиды» tugmasi (yoki /leads) to‘plamdan tashqari kompaniyalar oqimini yoqadi, «⏸ Не получать лиды» — o‘chiradi. Batafsil — «Aloqalar» bo‘limida.",
        "Mijoz olib kelib foiz olmoqchi bo‘lsangiz, /ref deb yozing.",
      ],
    },
    {
      name: "«Devuz Scout» kanali",
      url: SCOUT_URL,
      what: "Skaut bu yerga ochiq chatlarda hozir dasturchi qidirayotgan odamlarni va ertalabki xulosani yuboradi. Batafsil — «Qidiruv» bo‘limida.",
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
    "Lidni oldingizmi — olib boring: holat, eslatma, keyingi qadam. Olib borolmasangiz — «Navbatga qaytarish» yoki «Berishni so‘rash».",
    "Mijozga biror narsa yuborishni va’da qildingizmi — o‘sha kuni yuboring. Bajarilmagan va’da mijozni yomon saytdan ham tezroq yo‘qotadi.",
    "Biror narsa ishlamasa yoki g‘alati ko‘rinsa — kutmasdan darhol egasiga ayting.",
  ],

  askTitle: "Chiqmayaptimi?",
  ask: "Egasiga Telegramda yozing. Taxmin qilgandan ko‘ra so‘ragan yaxshi: deyarli hammasi besh daqiqada tuzatiladi.",
};
