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
  "«🕑 Перенести срок» quyidagilarni taklif qiladi: «+1 час», «Завтра 18:00», «+3 дня», «Неделя» va «✏️ Своя дата». «✏️ Своя дата» dan keyin botga muddatni bitta xabar bilan yozing — kun, oy va Toshkent vaqti bilan soat, masalan `05.10 15:00`. Bot bunday xabarni 30 daqiqa kutadi. Ko‘chirilgandan keyin — tugma, o‘z sanangiz yoki panel orqali — vazifa xabarining o‘zidagi muddat ham yangisiga almashadi.",
  "Vazifani qo‘ygan odamga bot har bir qadam haqida yozadi: ishga oldi, bajarildi, bajarilmadi, muddatni falon sana va vaqtga ko‘chirdi. Ijrochiga bot qo‘ygan odam muddatni ko‘chirsa, vazifani o‘zgartirsa (aynan nimani — nomi, tavsifi yoki loyihasi) yoki uni bekor qilsa yozadi. Vazifa boshqaga topshirilsa, avvalgi ijrochiga u olib tashlangani haqida xabar keladi, vazifa haqidagi xabari esa «↪️ Задача передана» ga almashadi: uning ostida endi tugmalar yo‘q.",
  "Eslatmalar: yangi vazifa bot xabaridan keyin 30 daqiqa ichida olinmasa — bot eslatadi; muddatga bir soat qolganda — yana eslatadi; muddat o‘tsa — bir marta ham ijrochiga, ham qo‘ygan odamga yozadi. Ko‘chirilgandan keyin «bir soat qoldi» va «muddati o‘tdi» qaytadan keladi — endi yangi muddatga.",
  "Amallar haqidagi xabarlar — yangi vazifa, oldi, bajarildi, ko‘chirish, bekor qilish — darhol, istalgan kuni keladi, faqat tunda emas: Toshkent vaqti bilan 21:00 dan 08:00 gacha bot jim turadi, tungi xabar 08:00 da keladi. Eslatmalar — «olinmadi», «bir soatdan keyin muddat», «muddati o‘tdi» — faqat ish kunlari 09:00 dan 19:00 gacha, kunlik portsiya kabi. Panelda hammasi darhol ko‘rinadi, bosilgan tugmaga javob — istalgan vaqtda.",
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
  granted: "Ega sizga ko‘rish uchun ochgan: bu yerda faqat rolingizga tegishli narsalarni o‘zgartira olasiz",
  search: {
    label: "Yo‘riqnomadan topish",
    placeholder: "O‘z so‘zlaringiz bilan so‘rang…",
    button: "Topish",
    searching: "Qidiryapman…",
    opened: "Band ochildi:",
    also: "Yana mos kelishi mumkin:",
    byWords: "So‘zlar mosligi bo‘yicha tanlandi — band o‘sha haqidami, tekshiring.",
    nothing: "Bunday band topilmadi. Boshqacha yozing yoki jamoa chatida so‘rang.",
    failed: "Topib bo‘lmadi — aloqani tekshirib, yana urinib ko‘ring.",
  },
  video: {
    introTitle: "Video: panel bir daqiqada",
    otherLanguage: "Video tili: {lang}",
    manageSection: "Bo‘lim videosi",
    manageIntro: "Kirish videosi",
    have: "Yuklangan:",
    remove: "Olib tashlash",
    removeConfirm: "Video ({lang}) olib tashlansinmi? Fayl serverdan o‘chiriladi.",
    removeFailed: "Videoni olib tashlab bo‘lmadi — sahifani yangilab, qayta urinib ko‘ring.",
    language: "Video tili",
    file: "Fayl: MP4, MOV yoki WebM, 500 MB gacha",
    upload: "Yuklash",
    busy: "Yuklanmoqda…",
    replaceNote: "Bu tilda video allaqachon bor — yangisi uning o‘rnini egallaydi.",
    done: "Video yuklandi.",
    chooseFile: "Faylni tanlang.",
    wrongType: "MP4, MOV yoki WebM video kerak.",
    tooBig: "Fayl 500 MB dan katta — uni siqing yoki qismlarga bo‘ling.",
  },

  sections: {
    /* ── Bosh sahifa ───────────────────────────────────────────────────── */
    "/admin/hq": {
      what: "Kirgandan keyin va «DevUz» logotipini bosganda birinchi «Bosh sahifa» ochiladi. Egasi va rahbar bu yerda butun kompaniyani ko‘radi: bugun nima bo‘lyapti, nima yonyapti va har kim nima bilan band. Menejer o‘z ish kunini ko‘radi: shoshilinch ishlar, lidlar (mijoz arizalari), kim bilan bog‘lanish, o‘z maketlari va raqamlari. Sahifa ochiq turganda o‘zi har 90 soniyada yangilanadi.",
      items: [
        {
          id: "desk",
          title: "Yuqori qator: «Kiruvchi» va «Bugun»",
          body: {
            manager: [
              "«Bosh sahifa» tepasida «Kiruvchi» bloki bor. Unda sizning javobingizni kutayotgan mijozlar turadi. Kim uzoqroq kutsa, o‘sha tepada. Qatorni bosing, yozishma [Kiruvchi](/admin/inbox) bo‘limida ochiladi. Javobni ham o‘sha yerda yozasiz.",
              "Blok bo‘shmi? Demak, hozir hech kimga javob berish shart emas: suhbatlarni bot o‘zi olib boryapti. Pastda kuningiz: nima yonyapti, kim bilan bog‘lanish, maketlaringiz va ishingiz.",
            ],
            head: [
              "Tepada ikki blok bor. «Kiruvchi» odam javobini kutayotgan oltitagacha mijozni ko‘rsatadi: jamoa aloqalaridan va botdan. Kim uzoqroq kutsa, o‘sha tepada. Qatorni bosing, yozishma [Kiruvchi](/admin/inbox) bo‘limida ochiladi.",
              "«Bugun» uchta raqamni ko‘rsatadi: 7 kundagi yangi lidlar, 7 kunda javob berganlar va bugungi aloqalar kunlik me’yorga nisbatan. Raqam yonidagi strelka oldingi 7 kun bilan solishtiradi. Pastda «Kunlar bo‘yicha aloqalar» grafigi: jamoa 7 kunning har birida nechta aloqa qilgani.",
            ],
            admin: [
              "Tepada ikki blok bor. «Kiruvchi» odam javobini kutayotgan oltitagacha mijozni ko‘rsatadi: jamoa aloqalaridan va botdan. Kim uzoqroq kutsa, o‘sha tepada. Qatorni bosing, yozishma [Kiruvchi](/admin/inbox) bo‘limida ochiladi.",
              "«Bugun» uchta raqamni ko‘rsatadi: 7 kundagi yangi lidlar, 7 kunda javob berganlar va bugungi aloqalar kunlik me’yorga nisbatan. Raqam yonidagi strelka oldingi 7 kun bilan solishtiradi. Pastda «Kunlar bo‘yicha aloqalar» grafigi: jamoa 7 kunning har birida nechta aloqa qilgani.",
            ],
          },
        },
        {
          id: "pulse",
          title: "Kompaniya pulsi: lidlar, aloqalar, maketlar, vazifalar",
          body: {
            head: [
              "Pastda to‘rtta karta: «Lidlar», «Aloqalar», «Maketlar» va «Vazifalar». Katta raqam asosiysi, ostidagi qatorlar aniqlashtiradi. Har qanday raqamni bosish mumkin, u qaysi ro‘yxatdan olingan bo‘lsa, o‘sha ochiladi.",
              "«Lidlar»: butun jamoada nechta lid ishda va nechta yangi. «issiq: hozir taklif qilinmoqda» qatori lidlar olinishini kutayotganini bildiradi (buning uchun 30 daqiqa). «egasiz issiq lidlar»ni hech kim olmagan, bu yerda aralashish kerak.",
              "«Aloqalar»: bugun nechta kompaniyaga kunlik me’yorga nisbatan yozildi. Odamlar va avtoyurish (kompaniyalarga o‘zi yozadigan bot) yozadi. Pastda mijozlar javoblari va «7 kunda rad etishlar». Rad etishlar haqida bot kartochka yubormaydi, ular faqat shu yerda ko‘rinadi.",
              "«Maketlar»: hozir nechta maket mijozlarda 48 soatlik aksiyada va kimning aksiyasi oldinroq tugaydi. «Vazifalar»: ochiq, muddati o‘tgan va 7 kunda bajarilganlar.",
              "Raqam yonidagi «▲ +3» 7 kunda undan oldingi 7 kunga qaraganda ko‘paygani, «▼ −2» esa kamaygani. Rahbar «Bosh sahifa»da pulni ko‘rmaydi.",
            ],
            admin: [
              "Pastda beshta karta: «Lidlar», «Aloqalar», «Maketlar», «Vazifalar» va «Pul». Katta raqam asosiysi, ostidagi qatorlar aniqlashtiradi. Har qanday raqamni bosish mumkin, u qaysi ro‘yxatdan olingan bo‘lsa, o‘sha ochiladi.",
              "«Lidlar»: butun jamoada nechta lid ishda va nechta yangi. «issiq: hozir taklif qilinmoqda» qatori lidlar olinishini kutayotganini bildiradi (buning uchun 30 daqiqa). «egasiz issiq lidlar»ni hech kim olmagan, bu yerda aralashish kerak.",
              "«Aloqalar»: bugun nechta kompaniyaga kunlik me’yorga nisbatan yozildi. Odamlar va avtoyurish (kompaniyalarga o‘zi yozadigan bot) yozadi. Pastda mijozlar javoblari va «7 kunda rad etishlar». Rad etishlar haqida bot kartochka yubormaydi, ular faqat shu yerda ko‘rinadi.",
              "«Maketlar»: hozir nechta maket mijozlarda 48 soatlik aksiyada va kimning aksiyasi oldinroq tugaydi. «Vazifalar»: ochiq, muddati o‘tgan va 7 kunda bajarilganlar.",
              "«Pul»ni faqat siz ko‘rasiz. Unda 7 kunda va oy boshidan tushgan pul, bosilsa [Moliya](/admin/finance) ochiladi. Imzo kutayotgan shartnomalar qatori [Shartnomalar](/admin/contracts)ga olib boradi.",
              "Raqam yonidagi «▲ +3» 7 kunda undan oldingi 7 kunga qaraganda ko‘paygani, «▼ −2» esa kamaygani.",
            ],
          },
        },
        {
          id: "stages",
          title: "«Sotuv bosqichlari»",
          body: {
            admin: [
              "«Sotuv bosqichlari» bloki mijozning to‘lovgacha yo‘lini ko‘rsatadi. Bosqichlar: «yozdik», «javob berdi», «qiziqish», «maket yuborildi», «maket ko‘rsatildi», «narx aytildi», «to‘lov». Raqamlar 7 va 30 kun uchun bor. Raqamni bosing, shu mijozlar ro‘yxati ochiladi.",
              "Deyarli barcha bosqichlarni dastur yozishma va baza bo‘yicha o‘zi qo‘yadi. Maket ko‘rsatilganini faqat menejer [lid kartochkasida](#leads-sales-marks) «Maketni ko‘rsatdim» tugmasi bilan belgilaydi. Xato belgilangan bosqich ham o‘sha yerda bosib olib tashlanadi.",
              "Pastda mijozlar 30 kunda qayerda tushib qolayotgani ko‘rinadi. Masalan: «javob bergan 188 tadan 12 tasi qiziqish bildirdi». Eng ko‘p tushib qolayotgan joyda sotuv to‘xtab qoladi.",
              "To‘langan bitimlar bo‘yicha pul summasini faqat siz ko‘rasiz. Menejerlar ko‘rsatishni belgilamasa, «maket ko‘rsatildi» bosqichi nol bo‘lib qoladi.",
            ],
            head: [
              "«Sotuv bosqichlari» bloki mijozning to‘lovgacha yo‘lini ko‘rsatadi. Bosqichlar: «yozdik», «javob berdi», «qiziqish», «maket yuborildi», «maket ko‘rsatildi», «narx aytildi», «to‘lov». Raqamlar 7 va 30 kun uchun bor. Raqamni bosing, shu mijozlar ro‘yxati ochiladi.",
              "Deyarli barcha bosqichlarni dastur yozishma va baza bo‘yicha o‘zi qo‘yadi. Maket ko‘rsatilganini faqat menejer [lid kartochkasida](#leads-sales-marks) «Maketni ko‘rsatdim» tugmasi bilan belgilaydi. Xato belgilangan bosqich ham o‘sha yerda bosib olib tashlanadi.",
              "Pastda mijozlar 30 kunda qayerda tushib qolayotgani ko‘rinadi. Masalan: «javob bergan 188 tadan 12 tasi qiziqish bildirdi». Eng ko‘p tushib qolayotgan joyda sotuv to‘xtab qoladi.",
              "Bu blokda rahbarga pul ko‘rinmaydi. Menejerlar ko‘rsatishni belgilamasa, «maket ko‘rsatildi» bosqichi nol bo‘lib qoladi.",
            ],
            manager: [
              "Sotuv bosqichlari mijozning birinchi xabardan to‘lovgacha yo‘lini ko‘rsatadi. «Haftalik bosqichlarim» blokida faqat sizning mijozlaringiz. Plitkani bosing, ro‘yxat ochiladi: kim va qachon bosqichga yetgan.",
              "Deyarli hammasini dastur o‘zi belgilaydi. Maketni ko‘rsatganingizni faqat siz «Maketni ko‘rsatdim» tugmasi bilan belgilaysiz. Belgilamasangiz, ko‘rsatish hech qayerda bo‘lmaydi: me’yoringizda ham, rahbar hisobotida ham.",
            ],
          },
        },
        {
          id: "attention",
          roles: ["admin", "head"],
          title: "«E’tibor talab qiladi»",
          body: [
            "Bu yerda hozir yonayotgan narsalar. Qizil nuqta nosozlik yoki egasiz mijozni bildiradi. Sariq nuqta bugun shug‘ullanmasangiz yonib ketishini bildiradi. Qatorni bosing, nima haqida bo‘lsa, o‘sha ochiladi: lid, vazifa, akkaunt yoki maket.",
            "Bu yerga nimalar tushadi: eslatmalar boti 30 daqiqadan ko‘p jim, avtoyurishda nosozlik, Telegram ishchi akkauntni cheklagan, «Избранное»da kruglyak yo‘q. Yana egasiz issiq lidlar, muddati o‘tgan vazifalar va 7 kun va undan ko‘p harakatsiz lidlar. Va tugashiga 6 soatdan kam qolgan aksiyalar.",
            "«Ism: N ta lid botga javobsiz» qatori bot odamdan osilib qolgan lidlari haqida so‘raganini, javob esa yo‘qligini bildiradi. Ro‘yxat bo‘shmi? Demak, o‘chiradigan yong‘in yo‘q.",
            "Egasiz issiq lidni shu yerning o‘zidan topshirish mumkin. «Issiq lidni xodimga topshirish» blokida kimga ekanini tanlang va «Topshirish»ni bosing. Odamga bot xabari va 4 soatdan keyin eslatma keladi.",
          ],
        },
        {
          id: "feed",
          roles: ["admin", "head"],
          title: "«So‘nggi sutka»",
          body: [
            "Bu yerda oxirgi 24 soatda bo‘lgan voqealar, yangisi tepada. Yangi lid, maket ketdi yoki tasdiqlandi, vazifa bajarildi, lid yutildi yoki yutqazildi. O‘n ikkitagacha qator ko‘rsatiladi.",
            "Har bir qatorni bosish mumkin. Lid kartochkada, maket [Maketlar](/admin/mockups)da, vazifa vazifalar tarixida ochiladi.",
          ],
        },
        {
          id: "people",
          roles: ["admin", "head"],
          title: "«Bugun jamoa»: jamoa kartalari",
          body: [
            "Har bir menejer va rahbarning o‘z kartasi bor. Yashil nuqta «onlayn» degani: odam oxirgi 30 daqiqada panelda yoki botda bo‘lgan. Aks holda qachon bo‘lgani yoziladi.",
            "Kartada bugungi aloqalar, ishdagi lidlar va ochiq vazifalar. Ustunchalar 7 kunning har biridagi aloqalarni ko‘rsatadi. Belgilar muammoni aytadi: muddat o‘tgan, yonib ketgan lidlar, harakatsiz lidlar, «botga javobsiz». Shunday belgili kartalar birinchi turadi.",
            "«Batafsil» tugmasi kartani ochadi: odam bugun qachon kirgan va panelda qancha bo‘lgan. O‘sha yerda «Vazifa qo‘yish» va «Uning lidlarini ochish» tugmalari bor.",
          ],
        },
        {
          id: "show-norm",
          title: "Me’yor: haftasiga 2 ta maket ko‘rsatish",
          roles: ["admin", "head"],
          body: [
            "Har bir menejer haftasiga mijozlarga 2 ta maket ko‘rsatishi kerak. Hafta dushanbadan hisoblanadi. Odam kartasida «ko‘rsatish 2 tadan N» belgisi bor, me’yor bajarilsa yashil bo‘ladi.",
            "Aloqalar faqat urinish. Pulga ko‘rsatish, aytilgan narx va to‘lov olib boradi. Shuning uchun bu uch raqam soat 18:00 dagi «Сотрудники за день» hisobotida bor.",
            "Dushanba kuni soat 10:00 da bot qator yuboradi: o‘tgan haftada kim mijozlariga maket ketgan bo‘lsa ham bitta ham ko‘rsatmagan. U sizda «Hisobotlar» belgisi turgan bo‘lsa keladi.",
          ],
        },
        {
          id: "levels",
          title: "Jamoa darajalari va grade",
          roles: ["admin", "head"],
          body: [
            "Har kimning kartasida unvonli daraja va shu oy uchun «bitimlar N/3» belgisi bor. Ochilgan kartada ballar va odamning foizi ko‘rinadi.",
            "Ballar pulga olib boradigan ishlar uchun beriladi. Aloqa 1 ball, maket ko‘rsatish 15, to‘lovli bitim 100. Panelda ishlash uchun ham biroz ball beriladi, lekin kunlik chegara bilan. Daraja baland, bitim esa nol? Vaqt nimaga ketayotganini ko‘rib chiqing.",
            "Grade (menejerning sotuvdan foizi) shunday. Asosiy 10%. Oyiga uchta bitim keyingi oyda 15% va har uchta bitim uchun $200 mukofot beradi. Mukofotlar [Moliya](/admin/finance)da ko‘rinadi.",
          ],
        },
        {
          id: "task",
          roles: ["admin", "head"],
          title: "«Tezkor vazifa»",
          body: [
            "Bu yerda «Bosh sahifa»dan chiqmasdan vazifa qo‘yish mumkin. Kimga ekanini belgilang (bir nechtasini ham), «Nima qilish kerak»ni yozing va «Muddat»ni tanlang. Keyin «Vazifa qo‘yish»ni bosing.",
            "Vazifa maketlarni yig‘adigan odamga bo‘lsa, forma «Maket buyurtmasi»ni so‘raydi. «Ha» deb javob bersangiz, mijozni tanlang va saytini kiriting.",
            "Bot ijrochiga darhol Telegramda yozadi. Tunda, 21:00 dan 08:00 gacha, xabar 08:00 da keladi. Odam kartasidagi «Vazifa qo‘yish» tugmasi bu formani u belgilangan holda ochadi.",
          ],
        },
        {
          id: "broadcast",
          roles: ["admin", "head"],
          title: "«Jamoaga botda xabar»",
          body: [
            "Bu studiya botidan Telegramga sizning xabaringiz. Blokda ikki vkladka bor. «Xodimlarga» butun jamoaga yoki uning bir qismiga ketadi. «Bot foydalanuvchilariga» botga o‘zi yozganlarga ketadi.",
            "Matnni yozing, kimga va qachon ekanini tanlang. Bot har besh daqiqada tarqatadi: soat 15:00 dagi qo‘ng‘iroq uchun 14:50 ni qo‘ying. Tunda, 21:00 dan 08:00 gacha, «Tunda ham yuborish» belgilanmasa, bot jim turadi.",
            "Yuborishdan oldin «Oldindan ko‘rish»ni bosing. U yerda xabar qanday ko‘rinishi va uni necha kishi olishi ko‘rinadi. O‘zingizga xabar kelmaydi.",
            "Pastda «Oxirgi xabarlar»: kimga ketdi va nechtasi yetdi. Xabar hali ketmagan bo‘lsa, uni «Bekor qilish» tugmasi bilan to‘xtatish mumkin. «Takrorlash» o‘sha matn va o‘sha odamlar bilan formani ochadi.",
            "«Bot foydalanuvchilariga» vkladkasida tanlang: «Hammaga», «Hamkorlarga», «Do‘kon xaridorlariga» yoki «Mijozlar va lidlarga». U yerda xodimlar yo‘q. Botni bloklaganga xabar ketmaydi. Mijozning xabarga javobi sizga «📩 Обращение в бота» bo‘lib keladi.",
          ],
        },
        {
          id: "bot-subs",
          roles: ["admin", "head"],
          title: "«Bot obunachilari»",
          body: [
            "Bu yerda [studiya botida](https://t.me/Devuz_studio_bot) necha kishi borligi ko‘rinadi. «hozir botda» katta raqami botga o‘zi yozgan va uni bloklamaganlarni sanaydi. Aynan ularga «Hammaga» xabari ketadi. Xodimlar sanalmaydi.",
            "«bugun obuna bo‘ldi» yashil qatori Toshkent vaqti bilan yarim tundan beri yangilarni sanaydi, yonida kechagi raqam. Jadval yangi kelganlarni va «Botda bo‘lganlar»ni 24 soat, 7 va 30 kun uchun ko‘rsatadi. Raqamlar har 5 daqiqada yangilanadi.",
            "«bugun maket yig‘di» oltin qatori nechta obunachi botda /maket buyrug‘i bilan o‘ziga maket yig‘ganini sanaydi. «Maket yig‘ganlar» qatori xuddi shuni 24 soat, 7 va 30 kun uchun ko‘rsatadi. Xodimlarning yig‘ganlari bu yerga kirmaydi. Har bir maket [Maketlar](/admin/mockups)da ko‘rinadi.",
            "Har kuni soat 20:00 da bot sizga «👥 Подписчики бота» xulosasini yuboradi. U sizda «Hisobotlar» belgisi turgan bo‘lsa keladi.",
          ],
        },
        {
          id: "voice",
          roles: ["admin", "head"],
          title: "Ovozli xabarni bot orqali matnga",
          body: [
            "Mijoz topshiriqni ovozli xabarda yubordimi? Uni [studiya botiga](https://t.me/Devuz_studio_bot) shaxsiy chatga yuboring. Ovozli xabar, audiofayl yoki diktofon yozuvi bo‘ladi.",
            "Bot «🎙 Получил голосовое» deb javob beradi, 10-20 daqiqadan keyin esa o‘sha chatga matn yuboradi. Raqamlar, narxlar va nomlarni yozuv bilan solishtiring. Dastur xato qilishi mumkin, ayniqsa ikki tilda gapirilsa.",
            "20 MB dan katta yoki bir soatdan uzun yozuvni bot olmaydi, qismlarga bo‘lib yuboring. Kruglyak bunga kirmaydi: bu [aloqalar uchun kruglyak](#accounts-circle).",
          ],
        },
        {
          id: "bot-helper",
          title: "Botdagi yordamchi: ish haqida savollar",
          body: {
            manager: [
              "[Studiya botiga](https://t.me/Devuz_studio_bot) shaxsiy chatda ish haqida savol yozing, u o‘zi javob beradi. Masalan: «mijoz qimmat desa nima deyish kerak». Javob qisqa, 500 belgigacha, savol tilida.",
              "Bot javoblarni shu qo‘llanmadan, «Ta’lim»dan, e’tirozlarga tayyor javoblardan va studiya keyslaridan oladi. Mijozlar ma’lumotlari va studiya pulini bermaydi. Javob bo‘lmasa, rahbardan so‘rang.",
              "Bot sizni «Jamoa»da bog‘langan Telegram orqali taniydi. Kuniga 30 ta savol berish mumkin.",
            ],
            head: [
              "[Studiya botiga](https://t.me/Devuz_studio_bot) shaxsiy chatda ish haqida savol yozing, u o‘zi javob beradi. Javob qisqa, 500 belgigacha, savol tilida. Yangilarga shunday oson: botdan so‘rash sizni kutishdan tezroq.",
              "Bot javoblarni qo‘llanmadan, «Ta’lim»dan, e’tirozlarga javoblardan va studiya keyslaridan oladi. Menejerga studiya puli haqida aytmaydi. Har kuni soat 18:00 da sizga «🤖 Помощник в боте» keladi: kim nechta savol bergan.",
              "Yordamchi faqat Telegrami [Jamoa](/admin/team)da bog‘langanlarga javob beradi. Odam «men sizning menejeringizman» deb yozsa-yu, «Jamoa»da bo‘lmasa, sizga uning niki bilan qator keladi. Bu bizning odammi? Uni qo‘shing.",
            ],
            admin: [
              "[Studiya botiga](https://t.me/Devuz_studio_bot) shaxsiy chatda ish haqida savol yozing, u o‘zi javob beradi. Javob qisqa, 500 belgigacha, savol tilida. Yangilarga shunday oson: botdan so‘rash rahbarni kutishdan tezroq.",
              "Bot javoblarni qo‘llanmadan, «Ta’lim»dan, e’tirozlarga javoblardan va studiya keyslaridan oladi. Menejerga studiya puli haqida aytmaydi. Har kuni soat 18:00 da sizga «🤖 Помощник в боте» keladi: kim nechta savol bergan.",
              "Yordamchi faqat Telegrami [Jamoa](/admin/team)da bog‘langanlarga javob beradi. Odam «men sizning menejeringizman» deb yozsa-yu, «Jamoa»da bo‘lmasa, sizga uning niki bilan qator keladi. Bu bizning odammi? Uni qo‘shing.",
            ],
          },
        },
        {
          id: "bot-contact",
          roles: ["admin", "head"],
          title: "Botda mijoz kontakti",
          body: {
            head: [
              "[Studiya botiga](https://t.me/Devuz_studio_bot) «kontakt» so‘zini va mijoz ismini, kompaniyani, saytni yoki ariza raqamini yozing. Masalan: «kontakt Samsa Haus». Bot telefon yoki nik va kartochkaga havola yuboradi.",
              "Ko‘rsatilgan har bir kontakt jurnalga yoziladi. Hech narsa topilmadimi? Ism yoki saytni boshqacha yozing. Menejerlarga bot kontakt qidirmaydi.",
            ],
            admin: [
              "[Studiya botiga](https://t.me/Devuz_studio_bot) «kontakt» so‘zini va mijoz ismini, kompaniyani, saytni yoki ariza raqamini yozing. Masalan: «kontakt Samsa Haus». Bot telefon yoki nik va kartochkaga havola yuboradi.",
              "Bu lidlar bo‘yicha brif keladigan bot bilan chatingizda ham ishlaydi. Briflarning buyruqlari va tugmalari u yerda odatdagidek ishlaydi.",
              "Ko‘rsatilgan har bir kontakt [Jurnal](/admin/audit)ga yoziladi. Hech narsa topilmadimi? Ism yoki saytni boshqacha yozing. Menejerlarga bot kontakt qidirmaydi.",
            ],
          },
        },
        {
          id: "my-day",
          title: "Sizning «Bosh sahifa»ngiz: ish kuni",
          roles: ["manager"],
          body: [
            "Bu bir ekranda sizning ish kuningiz: nima yonyapti, nima muddati o‘tgan, kim bilan bog‘lanish, maketlaringiz va raqamlaringiz. Bu yerda faqat sizniki. Boshqalarning lidlari va studiya puli yo‘q.",
            "Sahifa o‘zi har 90 soniyada yangilanadi. Har qanday qatorni bosish mumkin, lid, vazifa yoki maket ochiladi. Matn yonidagi yashil nuqta bosish yetib borganini va sahifa yuklanayotganini bildiradi.",
          ],
        },
        {
          id: "my-hot",
          title: "«Hozir yonmoqda»",
          roles: ["manager"],
          body: [
            "Bu yerda yaqin bir soatda shug‘ullanmasangiz yonib ketadigan narsalar. Qatorlar oltin rangda, eng shoshilinchlari qizg‘ish rangda yonadi.",
            "🔥 Sizga taklif qilingan issiq lid. «Olish»ni bosing, sizda 30 daqiqa bor, keyin lid keyingi odamga o‘tadi. 💬 Mijoz javob berdi va sizni kutyapti. 👀 Mijoz hozirgina maketingizni ochdi, yozish uchun ayni vaqt. ⏰ Maketingiz bo‘yicha aksiya bugun tugaydi. 📌 Bugungi vazifa.",
            "Bo‘shmi? Hech narsa yonmayapti, [aloqalar porsiyasini](/admin/prospect) olish mumkin.",
          ],
        },
        {
          id: "my-overdue",
          title: "«Muddati o‘tgan»",
          roles: ["manager"],
          body: [
            "Bu yerda allaqachon kechikkan narsalar. Bu muddati o‘tgan vazifalar va keyingi qadam kuni kelgan lidlar. Yana 7 kun va undan ko‘p harakat bo‘lmagan ishdagi lidlar.",
            "Harakat bu yozishma, holatni o‘zgartirish yoki lid bo‘yicha har qanday ish. Shunchaki kartochkani ochish hisoblanmaydi. 21 kun harakatsiz lid, botga uch kun javob bermasangiz, o‘zi «yutqazilgan»ga o‘tadi.",
            "Har bir lid ostida «🏆 Yutdik», «❌ Yutqazdik» va «⏳ Kutamiz» tugmalari bor. Keraklisini bosing, qator yo‘qoladi.",
          ],
        },
        {
          id: "my-status",
          title: "«🏆 Yutdik», «❌ Yutqazdik», «⏳ Kutamiz» tugmalari",
          roles: ["manager"],
          body: [
            "Bu bot soat 10:00 va 16:00 da osilib qolgan lidlar bo‘yicha yuboradigan tugmalarning o‘zi. Faqat o‘z lidingizni o‘zgartira olasiz.",
            "«🏆 Yutdik» lidni sotuv bilan yopadi va [Loyihalar](/admin/projects)ni ochadi. U yerda loyiha oching, shunda sotuv sizga yoziladi. «❌ Yutqazdik» lidni ishdan chiqaradi.",
            "«⏳ Kutamiz» keyingi qadam qachon ekanini so‘raydi: «Ertaga», «3 kundan keyin» yoki «Bir haftadan keyin». O‘sha kunga sizga «Связаться: …» vazifasi qo‘yiladi, unga qadar lid sizni bezovta qilmaydi. Ketma-ket uch marta qoldirish mumkin, keyin faqat «🏆» va «❌» qoladi.",
          ],
        },
        {
          id: "my-contacts",
          title: "«Bugun kim bilan bog‘lanish kerak»",
          roles: ["manager"],
          body: [
            "Bu yerda bugun yozish yoki qo‘ng‘iroq qilish kerak bo‘lganlar. Bu bugungi «Связаться: …» vazifalari, bugun qadami bor lidlar va sizga javob bergan mijozlar. Javob berganlar tepada turadi.",
            "«Yozish», «Qo‘ng‘iroq qilish» va «Xat» tugmalari mijoz kontaktini ochadi. Har bir ochish jurnalga yoziladi, shuning uchun haqiqatan bog‘langaningizda bosing. «Karta» lid yoki aloqani ochadi.",
          ],
        },
        {
          id: "my-mockups",
          title: "«Mening maketlarim»",
          roles: ["manager"],
          body: [
            "Bu yerda 14 kunda mijozlaringizga ketgan maketlar va aksiyasi hali davom etayotganlarning hammasi. Tepada aksiyasi oldinroq tugaydiganlar.",
            "Har biri bo‘yicha havola qachon ketgani va mijoz ochganmi, ko‘rinadi. Yana aksiya tugashiga qancha qolgani va maket parolsiz ochiqmi, ko‘rinadi. Mijoz hozir ko‘ryaptimi? Qator yonadi, yozish uchun ayni vaqt.",
            "«Parol yaratish» 24 soatlik parol beradi. U bir marta ko‘rsatiladi, yonida uni nusxalash tugmalari bor. Maket hali havola orqali ochiq bo‘lsa, birinchi parol uni yopadi.",
          ],
        },
        {
          id: "my-growth",
          title: "«Mening o‘sishim»: daraja va ballar",
          roles: ["manager"],
          body: [
            "«Mening o‘sishim» bloki o‘yindagidek darajangizni ko‘rsatadi. Ballar pulga olib boradigan ishlar uchun beriladi. To‘lovga qanchalik yaqin bo‘lsa, ball shuncha ko‘p.",
            "Aloqa 1 ball, mijoz javobi 2, qiziqish 5, maket ketdi 10, ko‘rsatish 15, narx aytildi 20, to‘lovli bitim 100. Panelda ishlash uchun ham biroz ball beriladi, lekin kunlik chegara bilan. To‘liq ro‘yxatni «Ballar nima uchun» ochadi.",
            "Har bir keyingi daraja qimmatroq, uzoq darajalar faqat bitimlar bilan olinadi. Ballar soatiga bir marta hisoblanadi. Darajangizni rahbar va egasi ko‘radi.",
          ],
        },
        {
          id: "grade",
          title: "«Bitimlar bo‘yicha grade»: 15% va $200 mukofot",
          roles: ["manager"],
          body: [
            "Bitim bu birinchi to‘lov kelgan loyihangiz. U shu to‘lov oyida hisobga olinadi.",
            "Yangi mijozdan foizingiz 10%. Oyiga uchta bitim yopsangiz, keyingi oyda 15% bo‘ladi. Egasi sizga o‘z stavkangizni qo‘ygan bo‘lsa, u pasaymaydi.",
            "Foizdan tashqari oyning har uchta bitimi uchun $200 mukofot bor: uchta bitim $200, oltita $400 beradi. Mukofot uchinchi bitim to‘langanidan keyin darhol [Moliya](/admin/finance)da ko‘rinadi.",
          ],
        },
        {
          id: "my-stages",
          title: "«Haftalik bosqichlarim» va ko‘rsatish me’yori",
          roles: ["manager"],
          body: [
            "«Haftalik bosqichlarim» bloki dushanbadan hisoblanadi. Tepada me’yor: haftasiga 2 ta maket ko‘rsatish. Jumagacha ko‘rsatish bo‘lmasa, qator yona boshlaydi.",
            "Ko‘rsatish bu mijoz maketni siz bilan birga ko‘rgani: uchrashuvda, qo‘ng‘iroqda yoki videongizda. Uni «Mening maketlarim»da yoki [lid kartochkasida](#leads-sales-marks) «Maketni ko‘rsatdim» tugmasi bilan belgilang.",
            "Rahbar ko‘rsatishlaringizni soat 18:00 dagi hisobotda ko‘radi. Dushanba kuni unga maketi bo‘lgan, lekin ko‘rsatmaganlar ro‘yxati keladi.",
          ],
        },
        {
          id: "my-work",
          title: "«Mening ishim»",
          roles: ["manager"],
          body: [
            "Tepada kunlik porsiya (bugun nechta kompaniyaga yozish kerak): nechtasi bajarilgani va chiziq. Bosing, [Sovuq aloqalar](/admin/prospect) ochiladi.",
            "Pastda ikki ustun, «Bugun» va «7 kun». Ularda aloqalar, mijozlar javoblari, olingan va yonib ketgan issiq lidlar, yuborilgan maketlar va yutilgan lidlar. Har bir raqamni bosish mumkin. Rahbar ham shu raqamlarni ko‘radi.",
          ],
        },
        {
          id: "week",
          title: "«Hafta: tavsiyalar, jamoa, reja»",
          body: {
            manager: [
              "«Bosh sahifa» pastida «Hafta: tavsiyalar, jamoa, reja» bloki bor. U yerda raqamlaringiz bo‘yicha [haftalik maslahatlar](#leads-coach) va sizga qo‘yilgan maqsadlar bilan [«Reja va fakt»](#leads-plan-fact).",
              "Qancha ishlaganingizni [Moliya](/admin/finance)da ko‘ring.",
            ],
            head: [
              "«Bosh sahifa» pastida «Hafta: tavsiyalar, jamoa, reja» bloki bor. Unda «Bugun uchun», [«Jamoa: shu hafta»](#leads-team-week), «Hafta yetakchilari» va [«Reja va fakt»](#leads-plan-fact).",
              "«Reja va fakt»da menejeringizga reja qo‘yasiz. «Reja qo‘yish»dan keyin sahifa shu blokka qaytadi.",
            ],
            admin: [
              "«Bosh sahifa» pastida «Hafta: tavsiyalar, jamoa, reja» bloki bor. Unda «Bugun uchun», «to‘lanadi» summasi bilan [«Jamoa: shu hafta»](#leads-team-week), «Hafta yetakchilari» va [«Reja va fakt»](#leads-plan-fact).",
              "«Reja va fakt»da rejalarni qo‘yasiz, o‘zgartirasiz va olib tashlaysiz. Kassa va kutilayotgan to‘lovlar [Moliya](/admin/finance) pastida.",
            ],
          },
        },
        {
          id: "app",
          title: "Telefondagi DevUz ilovasi va bildirishnomalar",
          body: [
            "Panelni telefonga ilova qilib o‘rnatish mumkin. U butun ekranga ochiladi va unga bildirishnomalar keladi. Bu bot sizga Telegramda yozadigan xabarlarning o‘zi.",
            "**iPhone.** iOS 16.4 yoki yangisi va **Safari** brauzeri kerak. devuz.studio/admin’ni oching, «Ulashish»ni (strelkali kvadrat) bosing, keyin «Asosiy ekranga» va «Qo‘shish» («Добавить»). iPhone’da bildirishnomalar faqat belgidagi ilovada keladi.",
            "**Android.** devuz.studio/admin’ni Chrome’da oching va «Bosh sahifa»da «Ilovani o‘rnatish»ni bosing. Tugma yo‘qmi? Chrome menyusini (uch nuqta) oching va «Ilovani o‘rnatish»ni tanlang.",
            "**Kirish.** Ilovada «Botdan kod olish»ni bosing. Bot 6 ta raqam yuboradi, ularni kiriting va «Kirish»ni bosing. Kod 5 daqiqa amal qiladi, uni hech kimga yubormang. Kod kelmadimi? Botga /code yuboring.",
            "Bir marta kirish kifoya. Keyin ilova sizni «Chiqish»ni bosmaguningizcha eslab qoladi. Ilovani 90 kun ochmasangizgina kod qayta so‘raladi.",
            "**Bildirishnomalar.** «Bosh sahifa»da «Bildirishnomalarni yoqish»ni bosing va ruxsat bering. «Tekshirish» sinov bildirishnomasini yuboradi. «Taqiqlash»ni bosdingizmi? Ularni telefon sozlamalarida, DevUz bildirishnomalari bo‘limida yoqing.",
            "Bot yuboradigan narsaning aynan o‘zi keladi, bot esa odatdagidek ishlayveradi. Kompyuterda bildirishnomalar «Bosh sahifa» tepasidagi qator bilan yoqiladi.",
          ],
        },
      ],
    },

    /* ── Задачи ──────────────────────────────────────────────────────── */
    "/admin/inbox": {
      what: "Odam javobini kutayotgan hammasi bitta navbatda: ko‘proq kutgani — tepada. Javobni shu yerdan, lid kartochkasidagi yo‘l bilan berish mumkin.",
      items: [
        {
          id: "queue",
          title: "Bu yerga nima tushadi",
          body: {
            manager: [
              "25.10.2026 dan — «Vazifalar» yonida **«Kiruvchi»**. Bu yerda mijoz javob bergan, javobni esa odam berishi kerak bo‘lgan aloqalaringiz: model suhbatni qo‘yib yuborgan yoki siz «O‘zim javob beraman» ni bosgansiz. Kimniki — [Bosh sahifa](/admin/hq) dagidek: lidli aloqa — lid kimda bo‘lsa, unga, lidsiz — aloqani olib borayotganga. Avtojavoblar («ish vaqtida javob beramiz») bu yerga tushmaydi.",
              "Tepada — hali hech kim olmagan yangi arizalar soni, [Lidlar](/admin) ga havola bilan. Bir soat va undan ko‘p kutayotgan qator sariq rangda. Model olib borayotgan suhbatlar bu yerda yo‘q: unga javob berish kerak emas.",
            ],
            head: [
              "25.10.2026 dan — «Vazifalar» yonida **«Kiruvchi»**. Bu yerda butun jamoaning mijoz javob bergan, javobni esa odam berishi kerak bo‘lgan aloqalari: model suhbatni qo‘yib yuborgan yoki uni «O‘zim javob beraman» bilan olishgan, — va **botga murojaatlar**: suhbatni odam olib boradi, mijoz esa uning javobidan keyin yozgan. Har bir qatorda — kim olib borayotgani. Avtojavoblar bu yerga tushmaydi.",
              "Tepada — hali hech kim olmagan yangi arizalar soni, [Lidlar](/admin) ga havola bilan. Bir soat va undan ko‘p kutayotgan qator sariq rangda. Model olib borayotgan suhbatlar bu yerda yo‘q: unga javob berish kerak emas. Mijozning botga har bir xabari avvalgidek sizga Telegramda «📩 Обращение в бота» bo‘lib keladi.",
            ],
            admin: [
              "25.10.2026 dan — «Vazifalar» yonida **«Kiruvchi»**. Bu yerda butun jamoaning mijoz javob bergan, javobni esa odam berishi kerak bo‘lgan aloqalari: model suhbatni qo‘yib yuborgan yoki uni «O‘zim javob beraman» bilan olishgan, — va **botga murojaatlar**: suhbatni odam olib boradi, mijoz esa uning javobidan keyin yozgan. Har bir qatorda — kim olib borayotgani. Avtojavoblar bu yerga tushmaydi.",
              "Tepada — hali hech kim olmagan yangi arizalar soni, [Lidlar](/admin) ga havola bilan. Bir soat va undan ko‘p kutayotgan qator sariq rangda. Model olib borayotgan suhbatlar bu yerda yo‘q: unga javob berish kerak emas. Mijozning botga har bir xabari avvalgidek sizga Telegramda «📩 Обращение в бота» bo‘lib keladi.",
            ],
          },
        },
        {
          id: "layout",
          title: "Uch ustun: yozishmalar, suhbat, mijoz",
          body: [
            "03.11.2026 dan «Kiruvchi» «DevUz Ofis» kabi tuzilgan. **Chapda** — sizni kutayotgan yozishmalar: ko‘proq kutgani — tepada, qator o‘ngida — mijoz qancha kutayotgani, sariq — bir soat va undan ko‘p. Havorang doira — ish akkauntidan aloqa, binafsha — studiya botiga murojaat. Qatorni bosing — **o‘rtada** suhbat ochiladi: mijoz so‘zlari chapda, bizniki o‘ngda ko‘k rangda, biznikida — kerak bo‘lsa «yuborilishini kutmoqda» yoki «ketmadi». Botda bu yerda faqat mijozning oxirgi xabari: butun yozishma — Telegramda.",
            "**O‘ngda** — mijoz: sayt, qaysi akkauntdan yozamiz va kim olib boradi, pastda — **«Bitim bosqichlari»**: [Bosh sahifa](/admin/hq) va lidlar doskasidagi o‘sha bosqichlar, o‘tilgani — sana bilan yashil belgi, keyingisi — ko‘k. Xato belgilangan o‘tilgan bosqich ustiga bosib olib tashlanadi ([qanday ishlaydi](#leads-sales-marks)). Javob maydoni ustida ba’zan **«Javob maslahati»** chiqadi: mijoz so‘zlarida e’tiroz tanilsa («qimmat», «qanaqa sayt?», «rahbarga beraman»), bu «E’tirozlarga javoblar»dan tayyor javob. «Javobga qo‘yish» matnni maydonga qo‘yadi — mijozga moslab, yuboring; o‘zi ketmaydi. Telefonda avval ro‘yxat, bosilganda suhbat ochiladi, «← Barcha yozishmalar» qaytaradi; mijoz kartochkasi — suhbat ostida.",
          ],
        },
        {
          id: "reply",
          title: "Qatordan javob berish",
          body: {
            manager: [
              "Javob maydoni suhbat ostida, darhol ochiq; Ctrl+Enter — yuborish. Aloqaga javob kartochkadagi [«Lenta»](#leads-timeline) ostidagi maydondan ketgandek, aloqaning ish akkauntidan ketadi, shundan keyin model jim turadi. Maket va loyihalarimiz havolalari yuborishdan oldin tekshiriladi.",
              "Butun suhbat kerak bo‘lsa — **«Kartochkani ochish»**: lenta yozishmada ochiladi. Lidsiz aloqa [Sovuq aloqalar](/admin/prospect) da ochiladi. Javob ketgach, qator yo‘qoladi: kiruvchiga javob berildi.",
            ],
            head: [
              "Javob maydoni suhbat ostida, darhol ochiq; Ctrl+Enter — yuborish. Aloqaga javob kartochkadagi [«Lenta»](#leads-timeline) ostidagi maydondan ketgandek, aloqaning ish akkauntidan ketadi; bot mijoziga — «📩 Обращение в бота» ga javobdek studiya botidan, model yana 7 kun jim turadi. Maket va loyihalarimiz havolalari yuborishdan oldin tekshiriladi.",
              "Butun suhbat kerak bo‘lsa — **«Kartochkani ochish»**: lenta yozishmada ochiladi. Lidsiz aloqa [Sovuq aloqalar](/admin/prospect) da ochiladi. Javob ketgach, qator yo‘qoladi: kiruvchiga javob berildi.",
            ],
            admin: [
              "Javob maydoni suhbat ostida, darhol ochiq; Ctrl+Enter — yuborish. Aloqaga javob kartochkadagi [«Lenta»](#leads-timeline) ostidagi maydondan ketgandek, aloqaning ish akkauntidan ketadi; bot mijoziga — «📩 Обращение в бота» ga javobdek studiya botidan, model yana 7 kun jim turadi. Maket va loyihalarimiz havolalari yuborishdan oldin tekshiriladi.",
              "Butun suhbat kerak bo‘lsa — **«Kartochkani ochish»**: lenta yozishmada ochiladi. Lidsiz aloqa [Sovuq aloqalar](/admin/prospect) da ochiladi. Javob ketgach, qator yo‘qoladi: kiruvchiga javob berildi.",
            ],
          },
        },
      ],
    },
    "/admin/tasks": {
      what: "Ichki CRM tizimimiz: mijozlarga va bir-birimizga bergan har bir va’da — muddati va mas’uli bor vazifa. Yuqorida — sizga qo‘yilgan vazifalar («Menga»), siz qo‘ygan vazifalar («Men qo‘yganlar») va «Vazifa qo‘yish» shakli. Shu sahifaning pastida — «Vazifalar tarixi»: nima bajarildi, nima bajarilmadi, nima bekor qilindi va muddat necha marta ko‘chirildi. Bo‘lim hammaga ochiq va belgilar bilan yopilmaydi: vazifani istalgan xodim olishi mumkin, botdagi vazifa tugmasi ham shu yerga olib keladi.",
      items: [
        {
          id: "board",
          title: "Vazifalar: qo‘yish, olish, yopish",
          body: [
            "Vazifalar — alohida bo‘lim: menyuda «Bosh sahifa»dan keyin **«Vazifalar»** tugmasi. **«Vazifalar»** bloki sahifaning yuqorisida, uning ostida — «Vazifalar tarixi». Vazifani istalgan xodim istalgan xodimga, jumladan o‘ziga ham qo‘yishi mumkin: menejer — rahbarga, rahbar — egasiga, kim bo‘lsa ham — kimga bo‘lsa ham. Vazifani uni qo‘ygan va kimga qo‘yilgan ko‘radi; agar u loyihaga tegishli bo‘lsa — o‘sha loyiha kartochkasini ochadigan hamma ham.",
            "**«Menga»** — sizga qo‘yilgan vazifalar: tepada eng yaqin muddat, pastroqda — uzoqroqlari, muddatsiz vazifalar — eng oxirida. Yangisi «yangi» deb belgilangan va **«Ishga olish»** tugmasini kutadi: shunda qo‘ygan odam vazifani ko‘rganingiz va qabul qilganingizni biladi. Olingani — «ishda», ostida **«Bajarildi»** va **«Bajarilmadi»**. Muddati o‘tgan vazifa qizil rang bilan ajratilgan va «muddati o‘tgan» deb belgilangan.",
            "**«Muddatni ko‘chirish»** variantlarni ochadi: «+1 soat», «Ertaga 18:00», «+3 kun», «Bir hafta» — yoki «Shu sanaga» tugmasi bilan o‘z sanangiz va vaqtingiz. «+1 soat», «+3 kun» va «Bir hafta» muddatdan hisoblanadi, agar u o‘tib ketgan yoki muddat bo‘lmagan bo‘lsa — hozirgi paytdan, toki yangi muddat o‘tmishda qolmasin. Muddatsiz vazifada bu joyda xuddi shu variantlar bilan **«Muddat belgilash»** turadi. Muddatni ijrochi ham, qo‘ygan odam ham ko‘chiradi — ikkinchi tomonga bot yangi muddatni darhol yozadi. Har bir ko‘chirish vazifa tarixida qoladi: eski muddat, yangisi va kim ko‘chirgani.",
            "**«Men qo‘yganlar»** — siz boshqalarga qo‘ygan vazifalar va ular hozir qanday holatda: «yangi» (hali olinmagan), «ishda», «bajarildi», «bajarilmadi», «muddati o‘tgan». Yopilganlari bu yerda yana bir hafta ko‘rinadi. «Bajarildi» va «Bajarilmadi» ni faqat vazifa kimda bo‘lsa, o‘sha bosadi — shuning uchun «bajarildi» doim ijrochining o‘zi bajarganini bildiradi. Siz muddatni ko‘chirishingiz yoki vazifa xato qo‘yilgan yoki endi kerak bo‘lmasa, **«Vazifani bekor qilish»** ni bosishingiz mumkin: vazifa «bekor qilingan» bo‘ladi, ijrochiga xabar boradi, uning Telegramidagi tugmalar «🚫 Задача отменена» ga almashadi.",
            "**«Vazifa qo‘yish»** — blok pastida: «Kimga» (belgilar: bir kishi yoki bir nechta), «Nima qilish kerak», «Batafsil (ixtiyoriy)», «Loyiha (ixtiyoriy)» va «Muddat» — «bugun 18:00 gacha», «ertaga» va «3 kundan keyin» (ikkalasi ham 18:00 gacha), «muddatsiz» yoki «boshqa sana». Vaqt hamma joyda Toshkent vaqti. Loyiha [«Loyihalar»](/admin/projects) bo‘limidagi ochiq loyihalardan tanlanadi: avval u yerda mijoz loyihasi qo‘shiladi, keyin unga vazifalarni biriktirish mumkin. Loyihani ham, muddatni ham ko‘rsatish shart emas. Bir nechta kishi belgilansa, har biriga xuddi shu matn, muddat va loyiha bilan o‘z vazifasi qo‘yiladi: har kim uni o‘zi ishga oladi va yopadi, muddat har biriniki alohida ko‘chiriladi, «Men qo‘yganlar» da esa kim boshlagani va kim hali boshlamagani ko‘rinadi. Ro‘yxatda o‘zingiz darhol belgilangansiz — vazifa sizga bo‘lmasa, belgini olib tashlang. Tugma ustida vazifa kimga ketishi ismlar bilan ko‘rinadi; siz ham, hamkasbingiz ham belgilangan bo‘lsa, o‘sha yerda sizga ham o‘z nusxasi ketishi haqida ogohlantirish chiqadi. Bitta vazifa sahifasida, unga bot tugmasi va telefondagi bildirishnoma olib boradi, ro‘yxatdagi tugmalarning o‘zi bor: «Ishga olish», «Bajarildi», «Bajarilmadi», muddatni ko‘chirish, vazifani qo‘ygan odamga esa — «Tahrirlash». Vazifa qo‘yilishi bilan bot ijrochiga darhol Telegramda yozadi — belgilanganlarning har biriga. O‘zingizga qo‘ygan vazifa darhol «ishda» — uni olish shart emas, bot ham u haqda yozmaydi. Kim nimani qo‘ygani, olgani, yopgani, ko‘chirgani va bekor qilgani amallar jurnaliga yoziladi.",
          ],
        },
        {
          id: "mockup-order",
          title: "Vazifadagi «Maket buyurtmasi»",
          body: {
            manager: [
              "**«Maket buyurtmasi»** — «Vazifa qo‘yish» formasidagi savol: «Ha» yoki «Yo‘q». Agar «Kimga» da maket yig‘uvchi (egasi) belgilangan bo‘lsa, javob majburiy — savol yonida «majburiy» chiqadi va javobsiz vazifa qo‘yilmaydi. Boshqa odamlarga vazifada savol kerak emas, uni o‘tkazib yuborish mumkin.",
              "«Ha» — siz maket buyurtma qilyapsiz. «Qaysi mijoz uchun» maydoniga kompaniya, ariza raqami, sayt yoki @nikni yoza boshlang va ro‘yxatdan lid yoki aloqani tanlang — qidiruv «Bo‘lim yoki kompaniyani topish» dagi bilan bir xil va faqat sizga ko‘rinadiganlarni ko‘rsatadi. «Mijoz sayti» aloqada o‘zi qo‘yiladi, lidda uni yozing, masalan tirex.uz. Ijrochi vazifa ostida «Maket buyurtmasi», kim uchun va saytni ko‘radi, bot esa vazifa haqidagi xabarda saytni yozadi.",
              "Maket yig‘ilib, buyurtmaga bog‘langach, [Maketlar](/admin/mockups) da uning mas’uli siz bo‘lasiz — «buyurtma bo‘yicha» belgisi bilan: shu maket bo‘yicha mijozni siz olib borasiz, maket parol bilan yopilganda bot sizga yozadi, u «Bosh sahifa» dagi maketlaringizda turadi. Vazifa «Bajarildi» bilan yopiladi, unda «Maket tayyor» havolasi chiqadi. Rahbar yoki egasi mas’ulni qo‘lda tayinlagan bo‘lsa, tayinlangan ustun.",
            ],
            head: [
              "**«Maket buyurtmasi»** — «Vazifa qo‘yish» formasida va «Bosh sahifa» dagi [tezkor vazifada](#hq-task) savol: «Ha» yoki «Yo‘q». Maket yig‘uvchi (egasi) belgilangan bo‘lsa, javob majburiy — javobsiz vazifa qo‘yilmaydi. Boshqa odamlarga vazifada savol kerak emas.",
              "«Ha» — maket buyurtmasi: «Qaysi mijoz uchun» da lid yoki aloqani qidiruv orqali tanlang («Bo‘lim yoki kompaniyani topish» dagi bilan bir xil), «Mijoz sayti» da — sayt, aloqada u o‘zi qo‘yiladi. Ijrochi vazifa ostida «Maket buyurtmasi», kim uchun va saytni ko‘radi; bot vazifa haqidagi xabarda saytni yozadi.",
              "Yig‘ilgan va buyurtmaga bog‘langan maketga «buyurtma bo‘yicha» mas’ul — vazifani qo‘ygan xodim tayinlanadi; vazifa «Bajarildi» bilan yopiladi, unda «Maket tayyor» chiqadi. Tayyor maketni istalgan ochiq buyurtmaga [Maketlar](/admin/mockups) da o‘zingiz bog‘lashingiz mumkin: maketdagi «Buyurtma» qatori, buyurtmani tanlash va «Bog‘lash». Siz qo‘lda tayinlagan mas’ul buyurtmadan ustun.",
            ],
            admin: [
              "**«Maket buyurtmasi»** — «Vazifa qo‘yish» formasida va «Bosh sahifa» dagi [tezkor vazifada](#hq-task) savol: «Ha» yoki «Yo‘q». «Kimga» orasida siz bo‘lsangiz (maketlarni siz yig‘asiz), javob majburiy — javobsiz vazifa sizga qo‘yilmaydi. Shunda har bir maket buyurtmasi sizga yozishmadagi iltimos emas, mijoz va sayt bilan keladi.",
              "Buyurtma «Menga» dagi vazifa ostida ko‘rinadi: «Maket buyurtmasi», kim uchun (lid yoki aloqaga havola) va sayt. **«Prototipni yig‘ish»** [Prototiplar](/admin/proto) ni sayt yozilgan va «Vazifadagi buyurtma bo‘yicha» maydonida buyurtma tanlangan holda ochadi. Yig‘dingiz — prototip buyurtmaga bog‘landi, vazifa «Bajarildi» bilan yopildi, buyurtma bergan xodimga bot yozdi. Qoralama buyurtmaga bog‘lanadi, lekin vazifa ochiq qoladi: mijoz uchun maket hali yo‘q.",
              "Qo‘lda yig‘ilgan maketni (vitrina) [Maketlar](/admin/mockups) da bog‘lang: maketda «Buyurtma» qatori — buyurtmani tanlang (sayti bir xil buyurtma darhol tanlangan bo‘ladi) va «Bog‘lash» ni bosing. Maket uchun mas’ul uni buyurtma qilgan xodim bo‘ladi, «buyurtma bo‘yicha» belgisi bilan. Qo‘lda tayinlangan mas’ul buyurtmadan ustun.",
            ],
          },
        },
        {
          id: "history",
          title: "Vazifani tahrirlash va vazifalar tarixi",
          body: {
            manager: [
              "**«Tahrirlash»** — siz qo‘ygan vazifa ostida, u ochiq ekan. «Nima qilish kerak», «Batafsil», «Ijrochi» va loyihani tuzatish mumkin, keyin **«Saqlash»**. Muddat bu yerda o‘zgarmaydi: buning uchun «Muddatni ko‘chirish» bor, uning o‘z ko‘chirishlar tarixi bor. Sizga qo‘yilgan vazifani siz tahrirlamaysiz: rozi bo‘lmasangiz — «Bajarilmadi» yoki muddatni ko‘chirish, qolgani — qo‘ygan odam bilan.",
              "Ijrochini almashtirdingiz — vazifa yangisida qaytadan boshlanadi: «yangi», bot unga uni yangi vazifa sifatida yuboradi, eslatmalar noldan boshlanadi. Avvalgisidan vazifa olib tashlanadi, unga bu haqda xabar keladi. Matn yoki loyihani o‘zgartirdingiz — bot ijrochiga aynan nima o‘zgarganini yozadi, uning Telegramidagi vazifa xabari esa yangilanadi.",
              "Biror narsa bo‘lgan vazifa pastida **«Tarix»** bor: kim qo‘ygan, kim olgan, qachon va qaysi muddatdan qaysi muddatga ko‘chirilgan, nima o‘zgartirilgan (edi → bo‘ldi), qanday tugagan. Vaqt — Toshkent vaqti. Muddat yonida u necha marta ko‘chirilgani ko‘rinadi.",
              "**«Vazifalar tarixi»** — shu sahifaning pastida (blok sarlavhasidagi «Vazifalar tarixi ↓» havolasi unga aylantiradi). U yerda davr ichida biror narsa bo‘lgan vazifalaringiz — siz qo‘yganlar ham, sizga qo‘yilganlar ham: bajarildi, bajarilmadi, bekor qilindi, muddat ko‘chirildi, o‘zgartirildi. «Nima» bitta turdagi qadamlarni qoldiradi, «Davr» — 7, 30 yoki 90 kun. Tepada — har bir turdan jami qanchaligi. Bu faqat ko‘rish uchun: vazifalarni o‘zgartirish — yuqorida, «Vazifalar» blokida.",
            ],
            head: [
              "**«Tahrirlash»** — siz qo‘ygan vazifa ostida, u ochiq ekan: «Nima qilish kerak», «Batafsil», «Ijrochi», loyiha, keyin **«Saqlash»**. Muddat — «Muddatni ko‘chirish» tugmasi bilan, uning o‘z tarixi bor. Boshqalarning vazifalarini faqat ularni qo‘ygan odam tahrirlaydi: shunda tarixda doim kim nimani topshirgani ko‘rinadi.",
              "Ijrochini almashtirdingiz — yangisida vazifa qaytadan boshlanadi: «yangi», bot uni yangi vazifa sifatida yuboradi, eslatmalar noldan; avvalgisiga vazifa undan olib tashlangani haqida xabar keladi. Matn yoki loyihani o‘zgartirdingiz — bot ijrochiga aynan nima o‘zgarganini yozadi va vazifa xabarini yangilaydi.",
              "Biror narsa bo‘lgan vazifa pastida **«Tarix»**: kim qo‘ygan, olgan, muddatni ko‘chirgan (qaysidan qaysiga), nima o‘zgartirilgan (edi → bo‘ldi), qanday tugagan. Muddat yonida — u necha marta ko‘chirilgani.",
              "**«Vazifalar tarixi»** — shu sahifaning pastida (blok sarlavhasidagi «Vazifalar tarixi ↓» havolasi unga aylantiradi). U yerda davr ichida biror narsa bo‘lgan butun jamoa vazifalari: bajarildi, bajarilmadi, bekor qilindi, muddat ko‘chirildi, o‘zgartirildi. Filtrlar: «Nima» — qadamlar turi, «Kimniki» — bitta odam (uning vazifalari va u qo‘yganlar), «Davr» — 7, 30 yoki 90 kun. Tepada — jamlar, pastda — **«Odamlar bo‘yicha»**: kimning nechta vazifasi bajarildi, bajarilmadi, bekor qilindi va ularning muddati necha marta ko‘chirildi; ijrochi bo‘yicha hisoblanadi, ism uning vazifalarini ochadi. Bir odamda tez-tez ko‘chirish va «bajarilmadi» — gaplashish uchun sabab. Ega o‘ziga qo‘ygan vazifalar bu yerga tushmaydi.",
            ],
            admin: [
              "**«Tahrirlash»** — siz qo‘ygan vazifa ostida, u ochiq ekan: «Nima qilish kerak», «Batafsil», «Ijrochi», loyiha, keyin **«Saqlash»**. Muddat — «Muddatni ko‘chirish» tugmasi bilan, uning o‘z tarixi bor. Boshqalarning vazifalarini faqat ularni qo‘ygan odam tahrirlaydi: shunda tarixda doim kim nimani topshirgani ko‘rinadi.",
              "Ijrochini almashtirdingiz — yangisida vazifa qaytadan boshlanadi: «yangi», bot uni yangi vazifa sifatida yuboradi, eslatmalar noldan; avvalgisiga vazifa undan olib tashlangani haqida xabar keladi. Matn yoki loyihani o‘zgartirdingiz — bot ijrochiga aynan nima o‘zgarganini yozadi va vazifa xabarini yangilaydi.",
              "Biror narsa bo‘lgan vazifa pastida **«Tarix»**: kim qo‘ygan, olgan, muddatni ko‘chirgan (qaysidan qaysiga), nima o‘zgartirilgan (edi → bo‘ldi), qanday tugagan. Muddat yonida — u necha marta ko‘chirilgani.",
              "**«Vazifalar tarixi»** — shu sahifaning pastida (blok sarlavhasidagi «Vazifalar tarixi ↓» havolasi unga aylantiradi). U yerda davr ichida biror narsa bo‘lgan studiyaning barcha vazifalari: bajarildi, bajarilmadi, bekor qilindi, muddat ko‘chirildi, o‘zgartirildi. Filtrlar: «Nima» — qadamlar turi, «Kimniki» — bitta odam (uning vazifalari va u qo‘yganlar), «Davr» — 7, 30 yoki 90 kun. Tepada — jamlar, pastda — **«Odamlar bo‘yicha»**: kimning nechta vazifasi bajarildi, bajarilmadi, bekor qilindi va ularning muddati necha marta ko‘chirildi; ijrochi bo‘yicha hisoblanadi, ism uning vazifalarini ochadi. Rahbar ham xuddi shuni ko‘radi, faqat siz o‘zingizga qo‘ygan vazifalardan tashqari.",
            ],
          },
        },
        {
          id: "filter",
          title: "Vazifalarda tartib, guruhlar va loyihalar",
          body: [
            "Sukut bo‘yicha vazifalar eng yaqin muddatdan eng uzog‘iga qarab boradi: nima yonayotgan bo‘lsa, o‘sha tepada. Muddatsiz vazifalar — oxirida, yangilari birinchi. «Men qo‘yganlar» da avval ochiqlari, pastroqda — hafta ichida yopilganlari.",
            "Ro‘yxatlar ustida — filtr. **«Guruhlash»**: «guruhlamaslik» (shunchaki muddat bo‘yicha), «muddat bo‘yicha» — «Muddat o‘tgan», «Muddat bugun», «Muddat ertaga», «Yaqin 7 kun ichida», «Keyinroq», «Muddatsiz» to‘plamlari; «loyiha bo‘yicha» — har bir loyihaning vazifalari birga, «Loyihasiz» oxirida; «odam bo‘yicha» — «Menga» da kim qo‘ygani bo‘yicha, «Men qo‘yganlar» da kimga qo‘yilgani bo‘yicha. Guruh ichida tartib o‘sha — eng yaqin muddatdan.",
            "**«Loyiha»** bitta loyihaning yoki «Loyihasiz» vazifalarni qoldiradi. Tanlang va **«Ko‘rsatish»** ni bosing. Tanlov sahifa manzilida saqlanadi: vazifalardagi tugmalar bosilgandan keyin u tushib qolmaydi, bu sahifani xatcho‘plarda ham saqlash mumkin.",
            "Loyihali vazifa qatorida loyiha nomi bor — bosing, loyiha kartochkasi ochiladi. Loyiha kartochkasida — uning barcha vazifalari va «Vazifa qo‘yish» havolasi: u [«Vazifalar»](/admin/tasks) bo‘limini formada loyiha allaqachon tanlangan holda ochadi.",
          ],
        },
        {
          id: "bot",
          title: "Vazifalar Telegramda va eslatmalar",
          body: {
            manager: [...TASKS_BOT, "Agar vazifalar haqidagi Telegram xabarlari sizga kerak bo‘lmasa, ularni rahbar yoki egasi o‘chiradi — bildirishnomalaringizdagi «Vazifalar» belgisi bilan. Vazifalar bunda «Vazifalar» bo‘limida qoladi, brauzerdagi ovoz esa avvalgidek ishlaydi."],
            head: [...TASKS_BOT, "Vazifalar haqidagi xabarlar odamning [bildirishnomalaridagi](#team-notices) «Vazifalar» belgisi bilan o‘chiriladi — o‘zingizda va menejerlaringizda ularni «Jamoa» bo‘limida o‘zgartirasiz. Vazifalar bunda «Vazifalar» bo‘limida qoladi, brauzerdagi ovoz ishlaydi."],
            admin: [...TASKS_BOT, "Vazifalar haqidagi xabarlar [bildirishnomalardagi](#team-notices) «Vazifalar» belgisi bilan o‘chiriladi — istalgan xodimda, «Jamoa» bo‘limida. Vazifalar bunda «Vazifalar» bo‘limida qoladi, brauzerdagi ovoz ishlaydi."],
          },
        },
        {
          id: "alerts",
          title: "Brauzerdagi ovoz va bildirishnomalar",
          body: [
            "Panel ochiq ekan — istalgan bo‘limda — u har 45 soniyada serverdan yangilik bor-yo‘qligini so‘raydi: sizga qo‘yilgan vazifa, vazifangizni qo‘ygan odam tomonidan ko‘chirish yoki bekor qilish, yoki siz qo‘ygan vazifa bo‘yicha qadam (oldi, bajarildi, bajarilmadi, muddat ko‘chirildi). Bo‘lsa — qisqa «din-don» chalinadi, o‘ng pastki burchakda «Vazifalarni ochish» tugmali plashka chiqadi, «Vazifalar» bo‘limi ochiq bo‘lsa, o‘zi yangilanadi.",
            "Tizim bildirishnomasi ham chiqishi uchun — hatto varaq yig‘ilgan bo‘lsa ham — vazifalar blokidagi **«Bildirishnomalarni yoqish»** ni bosing va brauzer oynasida ruxsat bering. Brauzer ruxsatni faqat bosilgandan keyin so‘raydi — shuning uchun tugma. Ruxsatdan keyin uning o‘rnida — «Bildirishnomalar yoqilgan».",
            "Agar brauzer taqiqlagan bo‘lsa, tugma o‘rnida maslahat chiqadi: bildirishnomalarga sayt sozlamalarida (manzil chap tomonidagi belgi) ruxsat berish mumkin. Ovozni brauzer paneldagi birinchi bosishdan keyin yoqadi — undan oldin sahifa ovoz chiqara olmaydi, barcha brauzerlar shunday ishlaydi. O‘z amallaringiz ovoz bilan belgilanmaydi. Panel yopiq bo‘lsa — brauzerda hech narsa yo‘q, Telegram qoladi.",
          ],
        },
      ],
    },

    /* ── Лиды ─────────────────────────────────────────────────────────── */
    "/admin": {
      what: "Lid (mijoz arizasi) bu studiyaga yozgan va javob kutayotgan odam. Bu yerda shunday arizalarning hammasi yig‘ilgan: saytdagi chat, forma, studiya boti, sizning aloqalaringiz va boshqa joylardan. Kim yozgani, unga nima kerakligi va u bilan kim ishlayotgani ko‘rinadi. Lid bilan har bir harakat jurnalga yoziladi: kim va qachon.",
      items: [
        {
          id: "home",
          title: "«Lidlar» sahifasida nima bor",
          body: {
            manager: [
              "Tepada [«Vazifalar»](/admin/tasks) bo‘limiga havola va [«Lidlarni saralash»](#leads-sort) tugmasi. Pastda «Lidni topish» qidiruvi. Kompaniya nomi, ism, ariza raqami yoki sohani yozing va «Topish»ni bosing. «Tozalash» qidiruvni tozalaydi.",
              "Keyin [«Ro‘yxat» / «Taxta»](#leads-board) almashtirgichi va filtrlar: «barcha lidlar», «bo‘sh lidlar», «meniki», ustuvorlik va holat. Ularning ostida [ro‘yxat](#leads-list)ning o‘zi.",
              "Mijoz sayt yoki bot orqali kelmadimi? Uni sahifaning eng pastidagi [«Lidni qo‘lda qo‘shish»](#leads-add) tugmasi bilan yozib qo‘ying.",
            ],
            head: [
              "Menejer lidni hamkasbga berishni so‘rasa, tepada «Qaroringizni kutmoqda» bloki chiqadi. Batafsil: [lidni berish](#leads-transfer) bandida.",
              "Pastda [«Vazifalar»](/admin/tasks) havolasi, [«Lidlarni saralash»](#leads-sort) tugmasi va «Lidni topish» qidiruvi. Yonida «Kimniki» maydoni: xodimni tanlang, faqat uning lidlari ko‘rinadi. Keyin [«Ro‘yxat» / «Taxta»](#leads-board) almashtirgichi, filtrlar va [ro‘yxat](#leads-list).",
              "Eng pastda [«Lidni qo‘lda qo‘shish»](#leads-add) tugmasi. Jamoaning haftalik raqamlari, reja va tavsiyalar [«Bosh sahifa»](#hq-week) pastida.",
            ],
            admin: [
              "Menejer lidni hamkasbga berishni so‘rasa, tepada «Qaroringizni kutmoqda» bloki chiqadi. Batafsil: [lidni berish](#leads-transfer) bandida.",
              "Pastda [«Vazifalar»](/admin/tasks) havolasi, [«Lidlarni saralash»](#leads-sort) tugmasi va «Lidni topish» qidiruvi. Yonida «Kimniki» maydoni: xodimni tanlang, faqat uning lidlari ko‘rinadi. Keyin [«Ro‘yxat» / «Taxta»](#leads-board) almashtirgichi, filtrlar va [ro‘yxat](#leads-list).",
              "Eng pastda [«Lidni qo‘lda qo‘shish»](#leads-add) tugmasi. Jamoaning haftalik raqamlari, reja va tavsiyalar [«Bosh sahifa»](#hq-week) pastida. Kassa va kutilayotgan to‘lovlar [«Moliya»](/admin/finance) bo‘limida.",
            ],
          },
        },
        {
          id: "tasks",
          title: "Vazifalar qayerda",
          body: ["Vazifalar alohida [«Vazifalar»](/admin/tasks) bo‘limida, u menyuda «Bosh sahifa»dan keyin turadi. «Lidlar»da faqat unga havola qoldi. Vazifa qo‘yish va tarixini ko‘rish [vazifalar](#tasks-board) bandida yozilgan."],
        },
        {
          id: "queue",
          title: "Lid odamga qanday yetadi: navbat",
          body: {
            manager: [
              "Yangi lidlar navbat bilan taqsimlanadi. Shunda har kimga teng tegadi, birinchi bosganga emas.",
              "**Ish kunlari Toshkent vaqti bilan 08:00-18:00** lid bitta odamga 30 daqiqaga taklif qilinadi. Sizga Telegramda kartochka keladi: «⏳ Лид ваш на 30 минут». Boshqalar uni hozircha ko‘rmaydi. «✅ Взять в работу»ni bosing, lid sizniki.",
              "Avval lid joyida bo‘lganlarga taklif qilinadi: oxirgi 30 daqiqada panelda bo‘lgan yoki bot tugmalarini bosganlarga. Ulardan lidni oy davomida lidi kamroq bo‘lgan oladi. Shuning uchun panelni ochiq tuting yoki botga javob bering.",
              "30 daqiqada olmadingizmi? Lid keyingisiga o‘tadi, sizga esa olingan deb hisoblanadi. Bir kunda ketma-ket uch marta o‘tkazib yuborsangiz, kechgacha navbat sizni chetlab o‘tadi. Lidni hech kim olmasa, u hammaga ochiladi: birinchi bosgan oladi.",
              "**Kechqurun, tunda va dam olish kunlari** lid navbatdagi hammaga darhol ochiq. Lekin oylik teng ulushingizdan ko‘p olib bo‘lmaydi. Lid 10 daqiqadan ko‘p kutsa yoki joyida boshqa hech kim bo‘lmasa, joyida bo‘lgan oladi.",
              "21:00 dan 08:00 gacha bot kartochka yubormaydi. Tunda kelgan lid ertalab «🌙 Лид пришёл ночью» belgisi bilan keladi.",
              "Qaysi lidlar kelishini o‘zingiz [Sozlamalar](#settings-leads)da tanlaysiz. Olib tashlagan turingiz sizga taklif qilinmaydi. Mijoz rad etdimi? Unda kartochka hech kimga kelmaydi.",
              "O‘zingizning [aloqalaringiz](/admin/prospect)dan kelgan lidlar navbatsiz: ular darhol sizniki. Hamkordan kelgan lid hammaga darhol ochiq, uni hech kim olmaguncha bot kartochkani har 15 daqiqada takrorlaydi. Bunday lidlarni birinchi oling.",
              "«🤖 Ответ на касание автопрогона» lidi mijoz bepul maketga rozi bo‘lganda, qo‘ng‘iroq qilishni yoki biror narsa yuborishni so‘raganda paydo bo‘ladi. Avtoyurish degani panel o‘zi yuboradigan aloqalar. Rozilikkacha mijoz bilan bot yozishadi.",
            ],
            head: [
              "Siz navbatda menejerlar bilan teng turasiz, qoidalar bir xil. Lidlar navbat bilan taqsimlanadi, birinchi bosganga emas.",
              "**Ish kunlari 08:00-18:00** lid bitta odamga 30 daqiqaga taklif qilinadi, avval oxirgi 30 daqiqada joyida bo‘lganlarga. Ulardan lidni oy davomida lidi kamroq bo‘lgan oladi. Olmasa, lid keyingisiga o‘tadi, aylanadan keyin esa hammaga ochiq.",
              "Bir kunda ketma-ket uch marta o‘tkazib yuborsa, odam kechgacha navbatdan chiqadi. Unga, sizga va egasiga «Hisobotlar» belgisi ostida «🧊 …» qatori keladi.",
              "**Kechqurun, tunda va dam olish kunlari** lid hammaga ochiq, lekin oylik teng ulushdan ko‘p olib bo‘lmaydi. Lid 10 daqiqadan ko‘p kutsa yoki joyida boshqa hech kim bo‘lmasa, joyida bo‘lgan oladi. 21:00 dan 08:00 gacha kartochka kelmaydi, tungi lid ertalab keladi.",
              "Lid bo‘sh turganda uning kontaktini siz ham ocholmaysiz: avval «O‘zimga olish». Odamning o‘z [aloqalari](/admin/prospect)dan kelgan lidlar navbatsiz. Hamkordan kelgan lid hammaga darhol ochiq: u osilib qolmasligini kuzating.",
              "«🤖 Ответ на касание автопрогона» lidi mijoz maketga rozi bo‘lganda, qo‘ng‘iroq qilishni yoki biror narsa yuborishni so‘raganda paydo bo‘ladi. Ungacha u bilan bot yozishadi ([avtoyurish](#prospect-autopilot)ga qarang).",
            ],
            admin: [
              "Siz navbatdan tashqaridasiz. Istalgan bo‘sh lidni istalgan paytda olishingiz mumkin, tungi ulush sizga ta’sir qilmaydi. Navbatda Telegrami ulangan menejerlar va rahbarlar turadi.",
              "**Ish kunlari 08:00-18:00** lid bitta odamga 30 daqiqaga taklif qilinadi, avval oxirgi 30 daqiqada joyida bo‘lganlarga. Sizga nusxa keladi: «👁 В очереди у @ник до 14:30». Olmasa, lid keyingisiga o‘tadi, aylanadan keyin esa hammaga ochiq.",
              "Bir kunda ketma-ket uch marta o‘tkazib yuborsa, odam kechgacha navbatdan chiqadi, sizga esa «🧊 …» qatori keladi. Boshqaga taklif qilingan lidni siz olsangiz, unga o‘tkazib yuborish hisoblanmaydi.",
              "**Kechqurun, tunda va dam olish kunlari** lid hammaga ochiq, lekin har kim oylik teng ulushdan ko‘p olmaydi. Lid 10 daqiqadan ko‘p kutsa yoki joyida boshqa hech kim bo‘lmasa, joyida bo‘lgan oladi. Odamning ulushini [Jamoa](/admin/team)da olib tashlash mumkin, batafsil: [lidlar cheklovi](#team-unlimited) bandida.",
              "21:00 dan 08:00 gacha bot kartochka yubormaydi, tungi lid ertalab keladi. Telegram bilan aloqa uzilib yetmagan kartochka keyinroq «⚠️ Досылка» belgisi bilan keladi. Lid turini hech kim tanlamagan bo‘lsa, lid hammaga ketadi, sizga esa «🧭 …» qatori keladi.",
              "Navbatsiz ketadi: aloqalardan kelgan lidlar (darhol yozgan odamga) va vitrinadan $10 000 dan qimmat arizalar (faqat sizga). Hamkordan kelgan lid hammaga darhol ochiq, bot kartochkani har 15 daqiqada takrorlaydi, lekin bir haftadan ko‘p emas. [Aloqalar avtoyurishi](#prospect-autopilot) lidlari umumiy navbatdan o‘tadi.",
            ],
          },
        },
        {
          id: "take",
          title: "Lidni olish va undan voz kechish",
          body: [
            "Lidni kartochkada «O‘zimga olish» tugmasi yoki Telegramda «✅ Взять в работу» tugmasi bilan olish mumkin. Lid sizniki bo‘ladi, holati «ishda»ga o‘zgaradi. Hamkasblarda Telegramdagi kartochka «✅ В работе у @ник»ga o‘zgaradi.",
            "4 soatdan keyin bot bu lid bo‘yicha keyin nima bo‘lishini so‘raydi. Mijoz botga yozishda davom etsa, sizga «💬 Клиент написал в бот» keladi. Tunda, 21:00 dan 08:00 gacha, bu qatorlar kelmaydi, lekin yozishma kartochkada saqlanadi.",
            "Hamkasb bilan bir vaqtda bosdingizmi? Lidni bittasi oladi, ikkinchisi «Лида уже взял кто-то другой»ni ko‘radi. Lid hozir boshqaga taklif qilingan bo‘lsa, «Не ваша очередь»ni ko‘rasiz.",
            "Telegramdagi «🗄 Отклонить» «mijoz bizga kerak emas» degani. Lid sizga yoziladi va «qoldirilgan» holatini oladi: shunda kim qaror qilgani ko‘rinadi. Oldingiz, lekin olib borolmaysizmi? Kartochkada «Navbatga qaytarish»ni bosing, lid yana bo‘sh bo‘ladi.",
          ],
        },
        {
          id: "trash",
          title: "«🗑 Мусор»: lid bo‘lmagan arizani o‘chirish",
          body: {
            manager: [
              "Bu tugma umuman lid bo‘lmagan arizalar uchun: spam, sinov, tasodifiy odam, xodim botga yozgan. Telegramda u «🗑 Мусор» deb ataladi, lid kartochkasida va [«Lidlarni saralash»](#leads-sort)da esa «🗑 Axlatga».",
              "O‘z lidingizni yoki umumiy navbatdagi hech kimniki bo‘lmagan lidni o‘chirish mumkin. O‘chirilgan lid butunlay yo‘qoladi, uni qaytarib bo‘lmaydi, shuning uchun panel qayta so‘raydi. Egasi va rahbar kim nimani o‘chirganini ko‘radi.",
              "Qiziqmagan haqiqiy mijoz bu «❌ Yutqazdik» yoki «🗄 Отклонить», axlat emas.",
            ],
            head: [
              "Bu tugma umuman lid bo‘lmagan arizalar uchun: spam, sinov, tasodifiy odam, xodim botga yozgan. Telegramda u «🗑 Мусор» deb ataladi, lid kartochkasida va [«Lidlarni saralash»](#leads-sort)da esa «🗑 Axlatga».",
              "Siz istalgan lidni o‘chirasiz, menejerlar faqat o‘zinikini va hech kimnikini. O‘chirilgan lid butunlay yo‘qoladi, qaytarib bo‘lmaydi. Menejer o‘chirsa, kunduzi sizga «🗑 @ник убрал лид как мусор» qatori keladi.",
              "Bizga kerak bo‘lmagan haqiqiy mijoz bu «🗄 Отклонить», axlat emas.",
            ],
            admin: [
              "Bu tugma umuman lid bo‘lmagan arizalar uchun: spam, sinov, tasodifiy odam, xodim botga yozgan. Telegramda u «🗑 Мусор» deb ataladi, lid kartochkasida va [«Lidlarni saralash»](#leads-sort)da esa «🗑 Axlatga».",
              "Siz istalgan lidni o‘chirasiz, menejerlar faqat o‘zinikini va hech kimnikini. O‘chirilgan lid butunlay yo‘qoladi, qaytarib bo‘lmaydi. Menejer o‘chirsa, kunduzi sizga «🗑 @ник убрал лид как мусор» qatori keladi, yozuv esa [jurnal](/admin/audit)da qoladi.",
              "Bizga kerak bo‘lmagan haqiqiy mijoz bu «🗄 Отклонить», axlat emas.",
            ],
          },
        },
        {
          id: "sort",
          title: "«Lidlarni saralash»: yig‘ilganini bittadan",
          body: [
            "«Lidlarni saralash» tugmasi qidiruv ustida turadi. U lidlarni bittadan, katta kartochkada ochadi. Qaror qildingiz, darhol keyingisi ochiladi.",
            "Avval 7 kun va undan ko‘p hech narsa bo‘lmagan «ishda»gi lidlaringiz keladi. Keyin umumiy navbatdagi hech kimniki bo‘lmagan yangilar, eskilari birinchi. Tepada qancha qolgani yozilgan.",
            "Hech kimniki bo‘lmagan lidda «Ishga olish», «🗑 Axlatga» va «O‘tkazib yuborish» tugmalari. O‘zingizdagisida «🏆 Yutdik», «❌ Yutqazdik», muddatli «⏳ Hali ishda», «🗑 Axlatga» va «O‘tkazib yuborish». «O‘tkazib yuborish» hech narsani o‘zgartirmaydi: lid keyingi safar qaytadi.",
            "Bosgandan keyin tepada bir-ikki soniya natija yozilgan lavha chiqadi. Ekran o‘sha joyda qoladi, butun panelda shunday.",
          ],
        },
        {
          id: "bot-inbox",
          roles: ["admin", "head"],
          title: "«📩 Обращение в бота»: mijozni ko‘rish va unga Telegramdan javob berish",
          body: [
            "Studiya botidagi mijozning har bir xabari sizga va rahbarga «📩 Обращение в бота» qatori bilan keladi. Unda kim yozyapti, uning so‘zlari, botning javobi va ariza bo‘lsa, unga havola. Ovozli xabar, rasm yoki fayl ortidan nusxa bo‘lib keladi.",
            "Javob berish uchun Telegramda shu xabarni bosib, javob qilib yozing. Javob mijozga sizning akkauntingizdan emas, studiya botidan ketadi. Ikkovingiz bir vaqtda javob bermasligingiz uchun ikkinchingizga «✍️ … ответил в боте» keladi.",
            "Javobingizdan keyin bot 7 kun jim turadi: suhbatni siz olib borasiz. Har bir javobingiz bu muddatni uzaytiradi. Bot o‘zi javob bera olmasa, qatorda «⚠️ Модель не ответила» bo‘ladi. Unda mijozga albatta javob bering, u kutyapti.",
            "Tunda, 21:00 dan 08:00 gacha, qatorlar kelmaydi. 08:00 da yozgan har bir mijoz bo‘yicha «🌙 Писал боту ночью» keladi, unga ham javob berish mumkin. Mijoz ruscha yozmasa, so‘zlari ostida «🇷🇺 Перевод» bo‘ladi. Qatorlarni [Jamoa](/admin/team)dagi «Botga murojaatlar» belgisi o‘chiradi.",
          ],
        },
        {
          id: "bot-write",
          title: "«Mijozga studiya botidan»: birinchi bo‘lib yozish",
          body: [
            "Mijoz o‘zi studiya botiga yozgan bo‘lsa, unga birinchi bo‘lib yozishingiz mumkin. [«Lenta»](#leads-timeline) ostidagi maydonda «Mijozga studiya botidan»ni tanlang, matnni yozing va «Yuborish»ni bosing. Xabar sizning akkauntingizdan emas, studiya botidan ketadi.",
            "Shunday qilib lid kimda bo‘lsa, o‘sha, rahbar va egasi yoza oladi. Mijoz botga yozmagan yoki uni bloklagan bo‘lsa, bunday tanlov yo‘q. Yuborgandan keyin bot 7 kun jim turadi, suhbatni siz olib borasiz. Mijozning javobi sizga Telegramda keladi.",
          ],
        },
        {
          id: "bot-card",
          title: "Telegramdagi lid kartochkasi",
          body: [
            "Telegramdagi yangi lid kartochkasi qisqa. Unda mijoz qanchalik iliqligi yozilgan: «🔥 Горячий», «🟡 Тёплый», «🌱 Присматривается» yoki «👤 Просит живого человека». Keyin ariza raqami, kim va qayerdan yozyapti, «Что хочет», mijoz aytgan bo‘lsa, byudjet va muddatlar.",
            "Pastda «Можно начать так»: mijozga tayyor birinchi xabar. Ustiga bosing, u nusxalanadi. Butun yozishma va tafsilotlar paneldagi kartochkada, «🔓 Открыть карточку» tugmasi.",
          ],
        },
        {
          id: "list",
          title: "Lidlar ro‘yxati: filtrlar va ustunlar",
          body: [
            "Menejer bo‘sh lidlarni va o‘zinikini ko‘radi, rahbar va egasi hammasini ko‘radi. Ularda holat ostida lidni olib borayotgan odamning niki yozilgan. Sahifada 50 ta lid.",
            "«Byudjet» bu summa emas, mijoz pul haqida qanday gapirishi: «aytilgan va tasdiqlangan», «bor, solishtirmoqda» yoki «aytilmagan». «Ball» degani 0 dan 100 gacha baho va harf: A 75 dan, B 55 dan, C 35 dan, D undan past.",
            "«Ustuvorlik» kimga birinchi yozishni ko‘rsatadi. «issiq» degani A baho yoki mijoz jonli odamni so‘rayapti, «iliq» degani B, «pishib yetiladi» degani qolganlari, «arxiv» degani mijoz rad etgan. «Keyingi qadam» degani lid bo‘yicha eng yaqin [eslatma](#leads-next-step).",
            "Ro‘yxatda kontaktlar yo‘q: kontakt [kartochka](#leads-card)da ochiladi va har bir ochilish yoziladi. Hamkordan kelgan lidlar sariq rangda. Bunday lid hech kimniki bo‘lmaguncha ro‘yxatda birinchi turadi.",
          ],
        },
        {
          id: "add",
          title: "«Lidni qo‘lda qo‘shish»: mijoz sayt va botsiz keldi",
          body: [
            "Mijoz qo‘ng‘iroq qildimi, tavsiya bilan keldimi yoki shaxsan uchrashdingizmi? Uni ro‘yxat ostidagi «Lidni qo‘lda qo‘shish» tugmasi bilan yozing. «Mijoz ismi» va «Telefon, Telegram yoki pochta» majburiy, qolgani ixtiyoriy.",
            "Lid darhol ishda, navbatsiz, 4 soatdan keyin bot keyin nima bo‘lishini so‘raydi. Menejer lidni o‘ziga qo‘shadi. Rahbar va egasi «Lid kimga»da istalgan xodimni tanlaydi, unga «Вам добавили лид» keladi.",
            "Forma tepasida «Bu kim» bor: «Mijoz», «Agentlik» yoki «Bloger». Agentlikni [«Agentliklar»](/admin/agencies) bo‘limida oching, uning 15% shu yerda hisoblanadi. Blogerni hamkor qilib rahbar va egasi ochadi.",
          ],
        },
        {
          id: "card",
          title: "Lid kartochkasi",
          body: {
            manager: [
              "Kartochka ro‘yxatdan, «Bosh sahifa»dan yoki Telegramdagi «🔓 Открыть карточку» tugmasi bilan ochiladi. Har bir ochilish jurnalga yoziladi.",
              "«Mas’ul» lid kimdaligini ko‘rsatadi. U yerda [«O‘zimga olish» va «Navbatga qaytarish»](#leads-take) hamda [«Berishni so‘rash»](#leads-transfer) tugmalari.",
              "«Holat»ni har bir suhbatdan keyin o‘zgartiring: «ishda», «qoldirilgan», «yutilgan» yoki «yutqazilgan». Statistika holatlar bo‘yicha hisoblanadi. «yutilgan», «yutqazilgan» va «qoldirilgan» avtoeslatmalarni bekor qiladi.",
              "«Kontaktni ko‘rsatish» mijozning telefoni yoki nikini ochadi. [«Lenta»](#leads-timeline)dagi «Yozishmani ko‘rsatish» mijoz botga yoki saytdagi chatga nima aytganini ko‘rsatadi. Ikkala tugma faqat olingan lid bo‘yicha ishlaydi va har bir bosish yoziladi.",
              "Ariza raqami yonidagi sariq belgi mijozda 30% chegirma borligini bildiradi. «birinchi daqiqada yozgan»: u saytda taymer ketayotganda yozgan. «20 soniyada ulgurmadik»: biz va’dadan kech javob berdik, bu yerda uzr so‘rash kerak. Chegirma va’da qilingan, narxda hisobga oling.",
              "Pastda brif, saytdagi smeta va izohlar. Mijozni hamkor olib keldimi? Uni [«Promokod yoki kim olib kelgan»](#leads-partner-code) maydoniga yozing.",
              "**Bot unutilgan lidlarni eslatadi.** Ish kunlari 10:00 va 16:00 da 7 kun hech narsa bo‘lmagan «ishda»gi lidlaringizni yuboradi. Har birida «🏆» (yutdik), «❌» (yutqazdik), «⏳» (hali ishda) va «🔓» (kartochkani ochish) tugmalari.",
              "«⏳» keyingi qadam qachonligini so‘raydi: «Завтра», «Через 3 дня» yoki «Через неделю». Bot shu kunga sizga bog‘lanish vazifasini qo‘yadi va ungacha so‘ramaydi. Uchinchi marta ketma-ket «⏳»ni bosib bo‘lmaydi, faqat «🏆» va «❌» qoladi.",
              "Bot javob bermaguningizcha savolni takrorlaydi. Ikki ish kuni javob bo‘lmasa, rahbar bilib qoladi. 21 kun harakatsiz va siz uch kun javob bermagan lidni bot o‘zi «yutqazilgan»ga o‘tkazadi. «ishda» holati bilan qaytarish mumkin.",
              "Botda «🏆 Выиграли» → «Завести проект»: loyiha formasi liddan to‘ladi va loyiha sizga yoziladi. Shunda bitim hisob-kitobingizga tushadi.",
            ],
            head: [
              "Siz istalgan kartochkani ochasiz va istalgan lidning holatini o‘zgartirasiz. Bo‘sh lidda [«O‘zimga olish»](#leads-take) tugmasi, olinganida «Navbatga qaytarish» va [«Berish»](#leads-transfer). Sizning berishingiz darhol ishlaydi.",
              "«Kontaktni ko‘rsatish» va «Yozishmani ko‘rsatish» istalgan olingan lid bo‘yicha ishlaydi. Bo‘sh lidni avval o‘zingizga oling: siz navbatda hamma bilan tengsiz. Har bir ochilish jurnalga yoziladi.",
              "Ariza raqami yonidagi sariq belgi mijozga 30% chegirma va’da qilinganini bildiradi, yonida sababi yozilgan. Pastda brif, smeta va [«Promokod yoki kim olib kelgan»](#leads-partner-code) maydoni.",
              "**Bot unutilgan lidlarni eslatadi.** Ish kunlari 10:00 va 16:00 da har kimga, sizga ham, 7 kun hech narsa bo‘lmagan «ishda»gi lidlarni yuboradi. Tugmalar: «🏆», «❌», muddatli «⏳» («Завтра», «Через 3 дня», «Через неделю») va kartochka uchun «🔓».",
              "Sizga va egasiga «Hisobotlar» belgisi ostida qatorlar keladi: lid uchinchi marta kechiktirildi, odam ikki ish kuni botga javob bermayapti, bot 21+ kun harakatsiz lidlarni o‘zi «yutqazilgan»ga o‘tkazdi. Kimda qancha lid botga javobsiz, [«Bosh sahifa»](/admin/hq)da ko‘rinadi.",
            ],
            admin: [
              "Siz istalgan kartochkani ochasiz va hammasini qila olasiz: olish, qaytarish, berish, holatni o‘zgartirish, kontakt va yozishmani ochish. Buni bo‘sh lidda ham, olishdan oldin qilish mumkin. Uning tepasida kimning navbatida turgani ko‘rinadi: «👁 В очереди у … до 14:30».",
              "Ariza raqami yonidagi sariq belgi mijozga 30% chegirma va’da qilinganini bildiradi, yonida sababi yozilgan. Bunday chegirmalar soni [Statistika](/admin/stats)da ko‘rinadi. Pastda brif, smeta va [«Promokod yoki kim olib kelgan»](#leads-partner-code) maydoni.",
              "**Bot unutilgan lidlarni eslatadi.** Ish kunlari 10:00 va 16:00 da odamga 7 kun hech narsa bo‘lmagan «ishda»gi lidlarini yuboradi. Tugmalar: «🏆», «❌», muddatli «⏳» («Завтра», «Через 3 дня», «Через неделю») va kartochka uchun «🔓».",
              "Sizga va rahbarlarga «Hisobotlar» belgisi ostida qatorlar keladi: lid uchinchi marta kechiktirildi, odam ikki ish kuni jim, bot 21+ kun harakatsiz lidlarni o‘zi «yutqazilgan»ga o‘tkazdi. Botga javobsiz lidlar beshtadan oshsa, «Bosh sahifa»da «E’tibor talab qiladi»da qator chiqadi.",
              "«🏆»dan keyin bot loyiha ochishni taklif qiladi, formada mas’ul sifatida lid kimda bo‘lsa, o‘sha tanlangan bo‘ladi. Shunda bitim kerakli odamning hisob-kitobiga tushadi.",
            ],
          },
        },
        {
          id: "partner-code",
          title: "«Promokod yoki kim olib kelgan»: hamkordan kelgan mijoz",
          body: [
            "Mijoz promokod aytdimi (lotincha so‘z, masalan AZIZ) yoki kim olib kelganini aytdimi? Buni kartochkadagi «Promokod yoki kim olib kelgan» maydoniga yozing va «Yozish»ni bosing. Hamkorning ismini ham yozish mumkin. Buni lid kimda bo‘lsa, o‘sha, rahbar va egasi qila oladi.",
            "Lid hamkorga yoziladi va unga Telegramda xabar ketadi. Mijoz loyihani to‘lasa, hamkorning foizi o‘zi hisoblanadi. Mijoz studiyada avval bo‘lgan bo‘lsa, lid «hisobga olinmadi» belgisi bilan yoziladi.",
            "Mijoz promokodni chat yoki botda o‘zi yozgan bo‘lsa, lid hamkorga sizsiz yoziladi. Panel «Bunday promokod yo‘q» dedimi? Mijozdan qanday yozilishini so‘rang yoki rahbardan so‘rang. Yozilgan lidning hamkorini faqat egasi o‘zgartira oladi.",
          ],
        },
        {
          id: "timeline",
          title: "«Lenta»: mijoz bilan hammasi bir joyda",
          body: [
            "Lid kartochkasidagi «Lenta» mijoz bo‘yicha hammasini vaqt bo‘yicha ko‘rsatadi, eskisi tepada. U yerda mijoz bilan yozishma, jamoa izohlari, o‘tilgan sotuv bosqichlari va eslatmalar.",
            "Aloqa yozishmasi va eslatmalarni lid kimda bo‘lsa, o‘sha ko‘radi. Izohlar va bosqichlarni kartochkani ochgan hamma ko‘radi. Saytdagi chat yoki botdagi yozishma «Yozishmani ko‘rsatish» tugmasi bilan ochiladi.",
            "Lenta ostida bitta javob maydoni. Uning ustida matn qayerga ketishini tanlang: «Mijozga „…“ akkauntidan» (yozishma ketgan o‘sha ish akkauntidan), «Mijozga studiya botidan» yoki «Jamoaga izoh». Izoh mijozga ketmaydi, lidni olib borayotganga esa Telegramda keladi.",
            "Mijozga o‘zingiz javob berdingiz, bot bu yozishmada jim bo‘ladi: suhbat endi sizniki. «E’tirozlarga javoblar» tayyor matn qo‘yadi, Ctrl+Enter yuboradi. Maket yoki loyihaga noto‘g‘ri havolani panel o‘tkazmaydi va to‘g‘risini aytadi.",
          ],
        },
        {
          id: "board",
          title: "«Taxta»: lidlar sotuv bosqichlari bo‘yicha",
          body: [
            "Ro‘yxat ustida «Ro‘yxat» / «Taxta» almashtirgichi bor. Taxtada 30 kunlik kompaniyalar ustunlarga joylangan: javob berdi, qiziqish, maket yuborildi, maket ko‘rsatildi, narx aytildi, to‘lov. Menejer o‘zinikini, rahbar va egasi butun jamoani va «Kimniki» maydonini ko‘radi.",
            "Kompaniya eng uzoq bosqich ustunida turadi. Nomi ostida u yerda necha kundan beri turgani yozilgan: kim qotib qolgani ko‘rinadi. Hali javob bermaganlar taxtada yo‘q, ular [«Sovuq aloqalar»](/admin/prospect) bo‘limida.",
            "Ustun ustida bot shu bosqichda o‘zi nima qilishi yozilgan. Qiziqish, ko‘rsatish va narxni kartochkadagi tugma bilan yoki kompyuterda ustunga olib o‘tib belgilashadi. «maket yuborildi» va «to‘lov» o‘zi belgilanadi.",
          ],
        },
        {
          id: "sales-marks",
          title: "Kartochkadagi sotuv bosqichlari: «Qiziqish bor», «Maketni ko‘rsatdim», «Narxni aytdim»",
          body: [
            "Lid kartochkasida «Sotuv bosqichlari» bloki bor. U mijoz qaysi bosqichga va qachon yetganini ko‘rsatadi. Ko‘p bosqichlar o‘zi belgilanadi.",
            "Uchta tugma panel o‘zi bilolmaydigan narsa uchun. «Qiziqish bor»: mijoz qiziqdi, lekin «+» yozmadi, masalan telefonda aytdi. «Maketni ko‘rsatdim»: «video orqali» yoki «yuzma-yuz»ni tanlang. «Narxni aytdim»: summani dollarda yozing.",
            "Darhol belgilang. Belgilanmagan ko‘rsatish hech qayerda hisoblanmaydi: «haftasiga 2 ta ko‘rsatish» me’yorida ham, 18:00 dagi hisobotda ham. Lid kimda bo‘lsa, o‘sha, rahbar va egasi belgilaydi. Aytilgan narx summasini faqat egasi ko‘radi.",
            "Xato belgiladingizmi? O‘tilgan bosqichni bosing (u punktir bilan tagiga chizilgan) va tasdiqlang. Bosqich va undan keyingi hammasi hisobdan chiqadi, jurnalda esa kim olib tashlagani qoladi. «yozdik» va «to‘lov»ni bunday olib tashlab bo‘lmaydi.",
          ],
        },
        {
          id: "reminders",
          title: "Eslatmalar",
          body: {
            manager: [
              "Eslatmalar Telegramda botdan «Открыть», «+2 часа» va «Готово» tugmalari bilan keladi. Bu har bir mijoz bo‘yicha xotirangiz.",
              "Lidni olganingizdan 4 soat keyin bot o‘zi lid bo‘yicha keyin nima bo‘lishini so‘raydi. Bu avtoeslatma. Uni kartochkadagi «Avtoeslatmalarni o‘chirish» tugmasi bilan o‘chirish mumkin. O‘zingiz qo‘ygan eslatmalar qoladi.",
              "O‘z eslatmangiz «Eslatmalar» blokida qo‘yiladi: «eslatish:» necha soatdan keyin, «nima haqida eslatish» va «Qo‘yish». Ishni qildingizmi? Kartochkada «bajarildi»ni yoki Telegramdagi tugmani bosing.",
              "«yetkazilmadi» bot sizga besh marta yoza olmaganini bildiradi. Botni bloklamaganingizni tekshiring va uni qayta ishga tushiring.",
            ],
            head: [
              "Eslatmalar Telegramda botdan «Открыть», «+2 часа» va «Готово» tugmalari bilan keladi.",
              "Avtoeslatma lid olingandan 4 soat keyin keladi. O‘zingiznikini «Eslatmalar» blokida qo‘yasiz: «eslatish:», «nima haqida eslatish» va «Qo‘yish».",
              "Siz istalgan lid bo‘yicha, jamoa lidlari bo‘yicha ham, eslatma qo‘yasiz va yopasiz.",
              "«yetkazilmadi» bot odamga besh marta yoza olmaganini bildiradi. U botni bloklamaganini tekshirsin.",
            ],
            admin: [
              "Eslatmalar Telegramda botdan «Открыть», «+2 часа» va «Готово» tugmalari bilan keladi. Ularni server har besh daqiqada yuboradi. Yarim soatdan ko‘p yubormasa, qizil [«Eslatmalar yetib bormayapti»](#leads-banner) lavhasi chiqadi.",
              "Avtoeslatma lid olingandan 4 soat keyin keladi, o‘zingiznikini «Eslatmalar» blokida qo‘yasiz. Siz istalgan lid bo‘yicha eslatma qo‘yasiz va yopasiz.",
              "«yetkazilmadi» bot odamga besh marta yoza olmaganini bildiradi: u botni bloklagan yoki uni hech qachon ishga tushirmagan.",
            ],
          },
        },
        {
          id: "next-step",
          title: "«Keyingi qadam»: har bir lid bo‘yicha keyin nima",
          body: [
            "«Keyingi qadam» degani lid bo‘yicha eng yaqin eslatma: qachon va nima qilish kerak. U ro‘yxatda ustun bo‘lib va kartochkadagi «Eslatmalar» bloki tepasida ko‘rinadi. Muddati o‘tgan qadam qizil.",
            "Eslatmasiz «ishda»gi lidda ro‘yxatda sariq «qadam yo‘q» turadi. Demak, mijoz unutilgan. Eslatma qo‘ying, qadam paydo bo‘ladi.",
            "Qadam oldinda ekan, bot 10:00 va 16:00 da bu lid haqida so‘ramaydi. Qadamni qildingizmi? «bajarildi»ni bosing va darhol keyingisini belgilang.",
          ],
        },
        {
          id: "transfer",
          title: "Lidni hamkasbga berish",
          body: {
            manager: [
              "Lidni olib borishga ulgurmayapsizmi yoki u hamkasbga ko‘proq to‘g‘ri keladimi? Kartochkadagi «Berish» blokida kimga ekanini tanlang, nega ekanini yozing va «Berishni so‘rash»ni bosing.",
              "Rahbar yoki egasi tasdiqlamaguncha lid sizda qoladi. Ularga Telegramda «Подтвердить» va «Отклонить» tugmalari bilan xabar keladi.",
              "Tasdiqlashdi, lid butun yozishma bilan hamkasbga o‘tadi. Unga xabar va 4 soatdan keyin eslatma keladi. Rad etishdi, sizga «Передачу лида не подтвердили» keladi.",
              "Bo‘sh lid berilmaydi. Uni «O‘zimga olish» tugmasi bilan olishadi.",
            ],
            head: [
              "Sizning tugmangiz «Berish»: lid darhol tanlangan odamga ketadi va unga «…передал вам лид» xabari keladi.",
              "Menejerlarning so‘rovlari sizga Telegramda «Подтвердить» va «Отклонить» tugmalari bilan keladi. To‘g‘ridan-to‘g‘ri o‘sha yerda hal qiling. Shu so‘rovlar «Lidlar»dagi «Qaroringizni kutmoqda» blokida va lid kartochkasida ham ko‘rinadi.",
              "Kim birinchi hal qilsa, boshqalarda tugmalar natijaga o‘zgaradi. Lid yozishma bilan birga ketadi. Oldingi mas’ulning eski eslatmalarini kerak bo‘lsa, o‘zingiz yoping.",
            ],
            admin: [
              "Sizning tugmangiz «Berish»: lid darhol ketadi. Menejerlarning so‘rovlari sizga va rahbarga Telegramda «Подтвердить» va «Отклонить» tugmalari bilan keladi. Ular «Lidlar»dagi «Qaroringizni kutmoqda» blokida ham ko‘rinadi.",
              "Kim birinchi hal qilsa, boshqalarda tugmalar natijaga o‘zgaradi. Qarorgacha lid oldingi mas’ulda qoladi. Lid yozishma bilan birga ketadi.",
            ],
          },
        },
        {
          id: "urgent",
          title: "Harakatsiz lidlar: bitta qoida",
          body: [
            "«Harakatsiz» lid degani «ishda» holatidagi, 7 kun va undan ko‘p hech narsa qilinmagan lid. Hech kim mijozga yozmagan, izoh qoldirmagan, holatni o‘zgartirmagan va eslatma qo‘ymagan.",
            "Shunchaki kartochkani ochish yoki botga «⏳ Ещё в работе» deb javob berish hisoblanmaydi. Ko‘rish shug‘ullanish degani emas.",
            "Qoida butun panel va bot uchun bitta. U bo‘yicha «Bosh sahifa»dagi «E’tibor talab qiladi» va «Muddati o‘tgan», jamoadagi «Harakatsiz» ustuni va botning 10:00 va 16:00 dagi savollari hisoblanadi. Lid hisobdan chiqishi uchun mijozga yozing, holatni o‘zgartiring yoki eslatma qo‘ying.",
          ],
        },
        {
          id: "plan-fact",
          title: "«Reja va fakt»",
          body: {
            manager: [
              "«Reja va fakt» bloki [«Bosh sahifa»](#hq-week) pastida turadi. Unda sizga qo‘yilgan hafta yoki oy maqsadlari. «tushumlar, $» degani loyihalaringiz bo‘yicha mijozlardan pul. «yutilgan lidlar» degani bitimlar. «birinchi bog‘lanishlar» degani «Kontaktni ko‘rsatish»ni necha marta bosganingiz.",
              "Chiziq qancha bajarilganini ko‘rsatadi: 100% dan yashil, 50% dan past oltin rang. Hafta dushanbadan hisoblanadi. Rejani rahbar yoki egasi qo‘yadi.",
            ],
            head: [
              "«Reja va fakt» bloki [«Bosh sahifa»](#hq-week) pastida turadi. Unda hafta yoki oy maqsadlari: «tushumlar, $», «yutilgan lidlar» va «birinchi bog‘lanishlar» («Kontaktni ko‘rsatish» bosishlari).",
              "Menejeringizga reja qo‘yishingiz mumkin: «Kimga», «Davr», «Ko‘rsatkich», «Maqsad» va «Reja qo‘yish». Rejani faqat egasi o‘zgartira va olib tashlay oladi. O‘ziga hech kim reja qo‘ymaydi.",
            ],
            admin: [
              "Blok [«Bosh sahifa»](#hq-week) pastida, «Hafta: tavsiyalar, jamoa, reja» qismida. Siz istalgan kishiga reja qo‘yasiz va istalganini «o‘zgartirish» yoki «olib tashlash» mumkin. Rahbar faqat o‘z menejerlariga reja qo‘shadi.",
              "Ko‘rsatkichlar: «tushumlar, $», «yutilgan lidlar» va «birinchi bog‘lanishlar» («Kontaktni ko‘rsatish» bosishlari). Davr: dushanbadan boshlangan shu hafta yoki shu oy.",
            ],
          },
        },
        {
          id: "coach",
          title: "Tavsiyalar",
          body: {
            manager: [
              "«Haftalik tavsiyalar» «Bosh sahifa» pastida. Ular har dushanba 06:00 dan o‘tgan haftadagi raqamlaringiz bo‘yicha tayyorlanadi: «Nimaga e’tibor berish kerak», «Nima qilish kerak», «Nimani o‘rganish kerak», «Nima yaxshi».",
              "Bu baho emas, maslahat. Bir haftadan keyin yangilari bo‘ladi.",
            ],
            head: [
              "«Bugun uchun» har kuni ertalab 07:00 dan tayyorlanadi: bugun sizning va jamoa lidlari bo‘yicha nima qilish kerak.",
              "«Haftalik tavsiyalar» har dushanba 06:00 dan sizga va jamoadagi har kimga keladi. Jamoaga maslahatlar «Jamoaga haftalik tavsiyalar» blokida yig‘ilgan, ularni majlisda ko‘rib chiqish qulay.",
            ],
            admin: [
              "Haftalik tavsiyalar har dushanba 06:00 dan sizdan boshqa hamma uchun tayyorlanadi. «Bugun uchun» har kuni ertalab 07:00 dan siz va rahbarlar uchun tayyorlanadi.",
              "«qayta tayyorlash» tugmasi faqat sizda. Har bir tayyorlash pul turadi, shuning uchun uni rostdan kerak bo‘lganda bosing.",
            ],
          },
        },
        {
          id: "team-week",
          title: "«Jamoa: shu hafta»",
          roles: ["head", "admin"],
          body: {
            head: [
              "Siz va jamoangiz bo‘yicha shu haftalik jadval. Strelka o‘tgan hafta bilan solishtiradi.",
              "«Ishda» degani «ishda» holatidagi lidlar. «Harakatsiz» degani ulardan qanchasi 7+ kun [qadamsiz](#leads-urgent) turibdi. «Aloqalar» degani hafta davomida lidlar bilan barcha harakatlar, sovuq aloqalar emas.",
              "«Bog‘lanishlar» degani «Kontaktni ko‘rsatish» bosishlari. «Tushumlar» degani odam loyihalari bo‘yicha pul. «Aloqalar rejasi» degani siz [Jamoa](/admin/team)da qo‘yadigan rejaga nisbatan sovuq aloqalar.",
              "«Hafta yetakchilari» jamoada ikki va undan ko‘p odam bo‘lganda chiqadi.",
            ],
            admin: [
              "Sizdan boshqa hamma bo‘yicha jadval. Strelka o‘tgan hafta bilan solishtiradi.",
              "«Aloqalar» degani lidlar bilan harakatlar, sovuq aloqalar esa «Aloqalar rejasi» ustunida. «Bog‘lanishlar» degani «Kontaktni ko‘rsatish» bosishlari. «To‘lanadi»ni faqat siz ko‘rasiz.",
            ],
          },
        },
        {
          id: "banner",
          title: "Qizil «Eslatmalar yetib bormayapti» lavhasi",
          body: {
            manager: [
              "Lavha «Bosh sahifa» va «Lidlar» tepasida chiqadi, agar eslatmalarni yarim soatdan ko‘p hech kim yubormagan bo‘lsa. Darhol egasiga ayting. Lavha turgan paytda eslatmalarni kartochkalarda o‘zingiz tekshiring.",
            ],
            head: [
              "Lavha server eslatmalarni yarim soatdan ko‘p yubormaganda chiqadi. Lavha turgan paytda eslatmalar hech kimga kelmaydi. Egasiga ayting.",
            ],
            admin: [
              "Server har besh daqiqada eslatmalarni yuboradi, lidlar navbatini suradi va aloqa porsiyalarini tarqatadi. Muvaffaqiyatli o‘tish 30 daqiqadan ko‘p bo‘lmasa, lavha chiqadi.",
              "Tez ko‘rik: GitHub, Actions, «Осмотр связи с сервером». Serverda nimani tekshirish kerakligi lavhaning o‘zida yozilgan.",
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
    /* ── Tenderlar ─────────────────────────────────────────────────── */
    "/admin/tenders": {
      what: "Skaut O‘zbekiston xarid maydonchalarini o‘qiydi va faqat studiya qiladigan ishlarni qoldiradi: sayt, ilova, bot, sun’iy intellekt, CRM, platforma, axborot tizimi. Har bir shunday lot botga lid bo‘lib keladi, bu yerda esa — ularning tasmasi ariza muddati, buyurtmachi aloqasi va tugmalar bilan. Bo‘lim barcha xodimlarga ochiq.",
      items: [
        {
          id: "how",
          title: "Skaut tenderlarni qanday qidiradi",
          body: [
            "Har 30 daqiqada skaut maydonchalardagi ochiq lotlar ro‘yxatini o‘qiydi: etender.uzex.uz, xarid.uzex.uz, Hayot Birja (XT-Xarid) va Tender.asia. Faqat maydoncha har qanday tashrif buyuruvchiga kirishsiz ko‘rsatadigan narsa: skautda login va ERI yo‘q, kapchani aylanib o‘tmaydi. Maydonchadagi va Tender.asia’dagi bir xil lot — bitta qator: Tender.asia’dagi aloqa maydoncha lotiga qo‘shiladi.",
            "Lot biznikimi — buni kod nomiga qarab, modelsiz hal qiladi: mavzu (sayt, ilova, bot, axborot tizimi, CRM, avtomatlashtirish, platforma, sun’iy intellekt) va ish (ishlab chiqish, yaratish, takomillashtirish, qo‘llab-quvvatlash) kerak. Maydonchaning IT toifasida ham mavzusiz lot olinmaydi. Hech qachon bizniki emas: kiberxavfsizlik, antiviruslar, 1C, litsenziyalar, serverlar va bulut, videokuzatuv, yong‘in tizimlari, kompyuter va kartrijlar.",
            "Har bir yangi lot lidga aylanadi va saytdagi ariza bilan bir xil [lidlar navbati](#leads-queue) bo‘yicha yuradi: kunduzi — navbat bilan, kechasi — ertalab. Botdagi kartada — maydoncha, muddat, lotga havola, buyurtmachining telefoni, pochtasi va mas’ul shaxsi (maydoncha ko‘rsatsa) hamda majburiy shart: «Перед подачей заявки — связаться с Егором или Александром и запросить цену». O‘sha lot skaut kanaliga ham qator bo‘lib ketadi, bir o‘tishda sakkiztadan ko‘p emas. O‘zbekcha nomga ruscha qisqa «nima xohlashadi» jumlasi qo‘shiladi (uni arzon model yozadi, yangi raqamlarsiz). Lot kartasida telefon bo‘lmasa — skaut uni o‘sha buyurtmachining boshqa xaridlaridan STIR bo‘yicha topadi.",
            "Yuqoridagi «Oxirgi o‘tish» qatori skaut maydonchalarni qachon o‘qiganini, har birida nechta lot va ulardan nechtasi bizniki ekanini ko‘rsatadi. Maydoncha javob bermasa — u ajratib ko‘rsatiladi, qolganlari odatdagidek o‘qiladi.",
          ],
        },
        {
          id: "work",
          title: "Lot bilan nima qilish kerak",
          body: [
            "**Kelishilgan narxsiz ariza topshirmaymiz**: lid-tenderni oldingiz — avval Yegor yoki Aleksandrga qaysi lot va qanday muddatda ekanini yozing va narxni oling. Bu shart bo‘lim tepasida, botdagi lid kartasida va uning izohlarining birinchi qatorida turadi. Lot yonidagi «Lid kartasi» undan yaratilgan lidga olib boradi.",
            "Lotni «Lotni ochish» tugmasi bilan oching — u yerda TZ, shartlar va hujjatlar. Mos kelsa — **«Olaman»** ni bosing: lot ismingiz bilan «Olaman» yorlig‘iga o‘tadi va hamkasblar u bilan shug‘ullanilayotganini ko‘radi. Maydonchada ariza topshirdingiz — **«Topshirildi»**. Mos kelmasa — **«Bizniki emas»**, lot yangilardan yo‘qoladi.",
            "Yangilar muddat bo‘yicha turadi: qaysi biriga ariza qabuli tezroq tugasa, o‘sha yuqorida. Ikki kun yoki kamroq qolgan bo‘lsa — muddat ajratiladi. Qabuli bir kundan ko‘proq oldin tugagan lotlar «Yangi» dan o‘zi chiqib ketadi.",
            "Ariza maydonchaning o‘zida, kompaniya ERI bilan topshiriladi — paneldan topshirib bo‘lmaydi. IT xaridi TZ’sini qanday o‘qish — studiya saytidagi tender tahlillarida.",
          ],
        },
      ],
    },

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
          id: "groups",
          title: "Skaut uchun guruhlar — o‘zingiznikini qo‘shing",
          body: [
            "«Skaut uchun guruhlar» bloki — skaut asosiylaridan tashqari o‘qiydigan Telegram guruh va kanallari. Har kim qo‘sha oladi: «Guruh manzili yoki taklif havolasi» maydoniga @group, t.me/group ko‘rinishidagi manzilni yoki t.me/+… havolasini qo‘ying, xohlasangiz — izoh (mamlakat, guruh nima haqida), va «Guruh qo‘shish» tugmasini bosing. Skaut bot va shaxsiy akkauntni o‘qimaydi — maydon bunday manzilni qabul qilmaydi. Bitta guruh ro‘yxatga bir marta tushadi.",
            "Keyin skaut guruhga ishchi akkauntdan o‘zi qo‘shiladi: kuniga 10 ta urinishdan ko‘p emas, urinishlar orasida bir-ikki soat va faqat Toshkent vaqti bilan 08:00 dan 22:00 gacha. Tirik odam shunday qo‘shiladi, tez-tez qo‘shilish esa Telegram uchun akkauntni cheklashga sabab bo‘ladi, biz esa shu akkauntdan mijozlar bilan ham yozishamiz. Guruhlar qo‘shilish tartibida boradi. Forma ostida bugun nechta urinish bo‘lgani, nechta guruh kutayotgani va keyingi qo‘shilish qachonligi ko‘rinadi; Telegram kutishni so‘rasa yoki ishchi akkauntni cheklasa — qo‘shilish bo‘lmaydi va qachongacha ekani ham o‘sha yerda yozilgan.",
            "Guruh holati: «qo‘shilishni kutmoqda»; «o‘qiyapmiz» — «skaut qo‘shildi» yoki «qo‘lda qo‘shilingan» belgisi bilan (skaut akkauntidan o‘zingiz qo‘shilsangiz — u buni sezadi); «ariza adminda» — guruh yopiq, tasdiqni kutyapmiz; «qo‘shilib bo‘lmaydi» — manzil yo‘q, havola eskirgan, akkaunt guruhda bloklangan yoki guruh bot tekshiruvidan o‘tishni so‘raydi, unda faqat qo‘lda qo‘shilish mumkin. Telegram ko‘rsatgan sabab holat ostida ko‘rinadi. Yangi guruhni skaut qo‘shilgandan keyin darhol, qayta ishga tushirmasdan o‘qiydi.",
            "«Olib tashlash» — siz qo‘shgan guruhlarda; rahbar va egasi istalganini olib tashlaydi. Olib tashlangan guruhga skaut qo‘shilmaydi va eng yaqin qayta ishga tushishdan keyin uni o‘qimay qo‘yadi; kim qo‘shgani va kim olib tashlagani amallar jurnalida yozilib qoladi.",
          ],
        },
        {
          id: "health",
          title: "Skaut ishlayaptimi",
          body: {
            manager: [
              "Tepadagi tilla rangli ogohlantirish — nimadir noto‘g‘ri: skaut jim, birorta chatni o‘qimayapti yoki model ishlamayapti. «Akkaunt berilgan 29 ta chatdan 12 tasini o‘qiyapti» ogohlantirishi — chatlarning bir qismi hozircha o‘qilmayapti: [«Skaut uchun guruhlar»](#scout-groups)dagi guruhlarga skaut o‘zi, bir-ikki soatda bittadan qo‘shiladi. Skaut jim, model ishlamayapti yoki ogohlantirish bir necha kun ketmasa — egasiga ayting: bu paneldan tuzatilmaydi.",
            ],
            head: [
              "Tepadagi tilla rangli ogohlantirish — nosozlik: «Skaut N daqiqadan beri jim» (jarayon to‘xtagan), «birorta ham chatni o‘qimayapti» yoki «Model ishlamayapti». «O‘qilmayapti» ro‘yxati bilan «Akkaunt berilgan Y ta chatdan X tasini o‘qiyapti» — ishchi akkaunt bu chatlarga hali qo‘shilmagan. [«Skaut uchun guruhlar»](#scout-groups)dagi guruhlarga u o‘zi, bir-ikki soatda bittadan qo‘shiladi; nosozliklarni va serverda berilgan chatlarni egasi tuzatadi.",
            ],
            admin: [
              "«Skaut N daqiqadan beri jim» — serverdagi jarayon yiqilgan yoki to‘xtatilgan: `systemctl status devuz-scout`. «Model ishlamayapti» — kalitda yoki undagi pulda muammo.",
              "«Akkaunt berilgan Y ta chatdan X tasini o‘qiyapti» va «O‘qilmayapti» ro‘yxati — ishchi akkaunt bu chatlarga qo‘shilmagan yoki manzil ochilmagan. [«Skaut uchun guruhlar»](#scout-groups)dagi guruhlarga u o‘zi, kuniga 10 tadan ko‘p emas qo‘shiladi; serverdagi SCOUT_CHATS chatlariga — ishchi akkauntdan qo‘lda.",
              "«Mexanizm butun: … Ishlab chiqish so‘rovlari hali bo‘lmagan» — bu chatlardagi jimlik, nosozlik emas.",
            ],
          },
        },
      ],
    },

    "/admin/markets": {
      what: "O‘zbekistondan tashqarida mijozlarni qayerdan qidirish kerak: har bir mamlakat bo‘yicha — frilans birjalari, studiyalar kataloglari, e’lonlar taxtalari, tenderlar, xaritalar va Telegram chatlari, havolalar bilan va har bir maydonda qanday ishlash kerakligi bilan. Studiya MDH va AQShga chiqyapti, bu bo‘lim esa har bir mamlakatda nimadan boshlash kerakligi haqida qisqacha ma’lumot.",
      items: [
        {
          id: "start",
          title: "Mamlakatni qanday tanlash kerak",
          body: [
            "«Bozorlar» bo‘limi menyudan ochiladi: yangi menyuda — «Yana» → «Bozorlar», bir qatorli menyuda — «Bozorlar» tugmasi; u [«Sovuq aloqalar»](/admin/prospect) bo‘limining yorlig‘i ham. Qidiruv (Ctrl+K) uni «davlatlar», «platformalar» so‘zlari bilan ham topadi. Birinchi sahifada — mamlakatlar kartochkalari: bayroq, nomi, belgi, u yerda dasturchini qanday qidirishlari va nechta maydon to‘plangani. Kartochkani bosing — mamlakat sahifasi ochiladi.",
            "Belgi — studiya birinchi navbatda qayerga chiqishini ko‘rsatadi: «asosiy bozor» (Rossiya, Qozog‘iston, AQSh) — asosiy kuch shu yerga; «sinab ko‘ramiz» — qidiramiz, lekin kamroq; «imkon bo‘lganda» — sabab bo‘lganda kiramiz. O‘zbekiston ham ro‘yxatda — «imkon bo‘lganda» belgisi bilan.",
            "Havolalar 06.11.2026 da tekshirilgan. Ba’zi saytlar (Upwork, Clutch, Avito, OLX) robotlarni kiritmaydi, odamga esa ochiladi. Maydon yopilgan yoki ko‘chgan bo‘lsa — rahbarga ayting: ro‘yxat kodda tuzatiladi va uni tuzatishadi.",
          ],
        },
        {
          id: "country",
          title: "Mamlakat sahifasi va «Skautga» tugmasi",
          body: [
            "Tepada — bu mamlakatda dasturchini qanday qidirishlari, qaysi tilda yozish kerakligi va Toshkent bilan vaqt farqi. Pastda — «Nimadan boshlash kerak»: boshlashga arziydigan uch-to‘rt qadam. Ro‘yxatga qaytmaslik uchun tepada mamlakatlar almashtirgichi bor.",
            "Keyin maydonlar turlari bo‘yicha: frilans birjalari, studiyalar kataloglari va reytinglari, e’lonlar taxtalari, tenderlar, xaritalar va kompaniyalar ma’lumotnomalari, Telegram chatlari, hamjamiyatlar. Har birida — havola, bu qanday maydon, unda mijozlarni qanday qidirish kerak va qancha turadi: «bepul», «qisman pullik» (joylashish bepul, takliflar yoki reklama — pullik) yoki «pullik». Pullik maydonlarda ro‘yxatdan o‘tish va to‘lash — faqat rahbar bilan kelishgandan keyin.",
            "Telegram chatlarida «Skautga» tugmasi bor: guruh [«Skaut signallari»](/admin/scout)dagi «Skaut uchun guruhlar»ga tushadi va skaut unga o‘zi, navbati kelganda qo‘shiladi — kuniga 10 ta guruhdan ko‘p emas. Undan signallar odatdagidek keladi. Guruh skautda allaqachon bo‘lsa, sahifa shuni aytadi.",
          ],
        },
        {
          id: "tour",
          title: "Ekrandagi o‘rgatish",
          body: {
            manager: [
              "**«Ekranda ko‘rsatish: «Bozorlar»dan qanday foydalanish»** tugmasi bo‘lim tepasida — sakkiz qadamli qisqa o‘rgatish: bo‘lim qayerda, mamlakatni qanday tanlash, mamlakat sahifasida nima bor (misol uchun — Rossiya), maydon va «Skautga» tugmasi. Kerakli joy yoritiladi, qolgani qorong‘ilashadi, sahifadan sahifaga o‘rgatish o‘zi o‘tadi. «O‘tkazib yuborish» yoki Esc — yopish.",
              "Sizga u bir marta o‘zi ko‘rsatiladi — yangi panel bilan tanishuvdan so‘ng darhol. Yana ko‘rish — shu tugma bilan yoki [«Sozlamalar»](/admin/settings) da.",
            ],
            head: [
              "**«Ekranda ko‘rsatish: «Bozorlar»dan qanday foydalanish»** tugmasi bo‘lim tepasida — sakkiz qadamli qisqa o‘rgatish: bo‘lim qayerda, mamlakatni qanday tanlash, mamlakat sahifasida nima bor (misol uchun — Rossiya), maydon va «Skautga» tugmasi. Kerakli joy yoritiladi, qolgani qorong‘ilashadi, sahifadan sahifaga o‘rgatish o‘zi o‘tadi. «O‘tkazib yuborish» yoki Esc — yopish.",
              "Menejerlarga u bir marta o‘zi ko‘rsatiladi — yangi panel bilan tanishuvdan so‘ng darhol; sizga — faqat tugma bilan, shu yerda yoki [«Sozlamalar»](/admin/settings) da.",
            ],
            admin: [
              "**«Ekranda ko‘rsatish: «Bozorlar»dan qanday foydalanish»** tugmasi bo‘lim tepasida — sakkiz qadamli qisqa o‘rgatish: bo‘lim qayerda, mamlakatni qanday tanlash, mamlakat sahifasida nima bor (misol uchun — Rossiya), maydon va «Skautga» tugmasi. Kerakli joy yoritiladi, qolgani qorong‘ilashadi, sahifadan sahifaga o‘rgatish o‘zi o‘tadi. «O‘tkazib yuborish» yoki Esc — yopish.",
              "Menejerlarga u bir marta o‘zi ko‘rsatiladi — yangi panel bilan tanishuvdan so‘ng darhol; sizga — faqat tugma bilan, shu yerda yoki [«Sozlamalar»](/admin/settings) da.",
            ],
          },
        },
      ],
    },

    /* ── Касания ──────────────────────────────────────────────────────── */
    "/admin/prospect": {
      what: "Sovuq aloqalar: kompaniyalarni topamiz, saytlarini tekshiramiz, birinchi bo‘lib salom yozamiz, javob berganga esa menejer yoki jamoa matni bo‘yicha qisqa xat ketadi: uning saytida nima noto‘g‘ri va shu sababli qancha yo‘qotishi haqida tezislar, agar bo‘lsa, uning nishasidagi loyihamiz va 12 soatda yangi sayt prototipini yig‘ib berish taklifi. Studiyaning ishchi akkaunti yuboradi, mijoz javoblarini model olib boradi, odam kerak bo‘lganda esa yozgan odamni chaqiradi. Aloqadan kelgan lid darhol sizniki, navbatsiz.",
      items: [
        {
          id: "portion",
          title: "Kunlik to‘plam",
          body: {
            manager: [
              "Ish kunlari soat 07:00 da tizim umumiy zaxiradagi kompaniyalarni teng tarqatadi — aylana bo‘yicha bittadan. Sizga qanchasi: haftalik aloqalar rejasi 5 ga bo‘linadi (kuniga 2 dan 15 gacha). Reja bo‘lmasa — kuniga 5 ta.",
              "09:00 ga kelib xatlar tayyor bo‘ladi va to‘plam sizga Telegramda keladi: har bir kompaniyada — kimga yozish, gapni nimadan boshlash va matn (matnni bossangiz — nusxalanadi). Tugmalar: **«📤 Отправить через бота»**, **«WhatsApp ↗»**, **«✋ Написал сам»**, **«✖ Не подходит»** va **«Открыть в панели»**.",
              "Xuddi shu to‘plam — bo‘lim tepasida, «Bugungi kunlik to‘plamingiz: 5 tadan 2 tasi bajarildi» blokida, «matn tayyor», «bajarildi», «mos kelmadi» holatlari bilan; o‘rniga berilgan kompaniyalar «almashtiruv» deb belgilangan. **12:00 da**, agar kun davomida hali birorta aloqa bo‘lmasa, panelga kirmagan va botda hech narsa bosmagan bo‘lsangiz, bot shaxsan eslatadi: «xayrli kun, to‘plam kutyapti» — «Kunlik to‘plamni ochish» tugmasi bilan. Kuniga bir marta, faqat ish kunlari. Bugun ulgurmasangiz — rahbarga yozing: soat 15:00 da u baribir sizning yo‘qligingizni ko‘radi.",
              "**18:00 da** bajarilmagani umumiy zaxiraga qaytadi, xat esa o‘chiriladi — u sizning ismingiz bilan imzolangan. Rahbar va egasi hisobot oladi: har kimning kun davomidagi aloqalari va to‘plamdan qanchasi bajarilgani. Xuddi shu hisobotda panelga kirganingiz va unda qancha ishlaganingiz ko‘rinadi: daqiqalar faqat panel oynasi ochiq turganda va siz unda nimadir qilayotganingizda (sichqonchani surish, yozish, varaqlash) hisoblanadi.",
              "Faqat aloqa bajarilgan deb hisoblanadi: «Yuborish» va «Написал сам» / «O‘zim bog‘landim» — Telegramdan ham, paneldan ham bir xil. To‘plam — aynan shuncha aloqa: «Не подходит» hisobga kirmaydi, lekin uning o‘rniga darhol zaxiradan **almashtiruvchi** keladi — Telegramga tayyor matnli «🔁 Замена» kartochkasi (matn bir daqiqagacha yoziladi) va to‘plam blokiga. Paneldagi kartochkadagi «yozmaymiz» uchun ham xuddi shunday. Kuniga almashtirishlar — ikki to‘plamdan oshmaydi: zaxira bo‘sh bo‘lsa yoki almashtirishlar tugasa, bot tugma ostida shuni aytadi, kechki hisobotda esa bu «без замены» bo‘ladi. To‘plamdan ko‘proq kerak bo‘lsa — [«Получать лиды» oqimini](#prospect-stream) yoqing: to‘plamdan tashqari kompaniyalar, limitsiz.",
            ],
            head: [
              "Siz ham to‘plam olasiz: ish kunlari soat 07:00 da zaxiradagi kompaniyalar navbatdagi hammaga — sizga va menejerlarga teng tarqatiladi. Hajmi — haftalik reja ÷ 5 (2 dan 15 gacha), reja bo‘lmasa — 5.",
              "09:00 da to‘plam Telegramga tayyor matnlar va «📤 Отправить через бота», «WhatsApp ↗», «✋ Написал сам», «✖ Не подходит», «Открыть в панели» tugmalari bilan keladi. Bo‘limda u «Bugungi kunlik to‘plamingiz» blokida turadi. **12:00 da** kun davomida birorta aloqasi, panelga kirishi va botda birorta amali bo‘lmagan odamga bot to‘plamni eslatadi — shunday bo‘lsa, sizga ham. **15:00 da**, agar odam hali ham hech narsa qilmagan bo‘lsa, sizga va egasiga «🔕 К 15:00 молчат: …» qatori keladi — qo‘ng‘iroq qilib, nima bo‘lganini bilish kerak. Aloqalar rejasi 0 bo‘lgan yoki «Navbat bo‘yicha yangi buyurtmalar» belgisi olib tashlangan (ta’til, kasallik) odamlarga bot tegmaydi. 15:00 dagi qator «Hisobotlar» belgisi ostida, 12:00 dagi eslatma — o‘z belgisi ostida: «Kun boshlanmagan bo‘lsa, 12:00 dagi eslatma».",
              "18:00 da bajarilmagani zaxiraga qaytadi, sizga esa Telegramga butun jamoa bo‘yicha hisobot keladi — egasiga boradigan xuddi o‘sha: «Имя — 7 касаний · порция 3 из 5, не подошло 2, без замены 1». Avval — odamning kun davomidagi barcha aloqalari: to‘plam, oqim va paneldan. Keyin — to‘plam: ertalabki taqsimotdan qanchasi bajarilgan. Pastda — hamma bo‘yicha jami. Faqat aloqalar hisoblanadi: «Не подходит» hisobga kirmaydi — uning uchun odamga darhol zaxiradan almashtiruvchi beriladi, kuniga ikki to‘plamgacha; «без замены» — zaxira bo‘sh edi yoki almashtirishlar tugagan. ⚠️ — to‘plam bo‘yicha birorta ham aloqa yo‘q, ✅ — to‘plam to‘liq bajarilgan. Odam [«Получать лиды» oqimini](#prospect-stream) yoqqan bo‘lsa, qavs ichida — nechta aloqa oqimdan kelgani: «7 касаний (поток 4)». 13.10 dan bu hisobot «📋 Сотрудники за день» deb ataladi va batafsilroq: har bir kishida — aloqalar va to‘plam, 🖥 panelda necha daqiqa bo‘lgani, qaysi vaqtdan qaysi vaqtgacha va qaysi bo‘limlarni ko‘proq ochgani, 🔥 nechta iliq lid olgani va panel hamda botdagi harakatlari soni. Faqat botdan ishlaganlar «работал из бота» deb belgilanadi. Pastda — «👀 На что смотреть» (jamoa bo‘yicha to‘plam, hech narsa qilmaganlar, «Не подходит» ko‘p bo‘lganlar) va odamlar bo‘yicha «💡 Рекомендации». Daqiqalar 14.10 dan hisoblanadi — panel oynasi ochiq va odam unda nimadir qilayotgan paytda. Bu hisobotni faqat siz va egasi olasiz.",
              "**Dushanba kunlari soat 10:00 da** sizga va egasiga «📅 Сотрудники за неделю» keladi — o‘tgan hafta, dushanbadan yakshanbagacha, har bir kishi bo‘yicha: ✉️ aloqalar va bir hafta oldin qancha bo‘lgani, 💬 uning aloqalariga qanchasi javob bergani, 🎯 maketlar, 2 talik me’yordan ko‘rsatishlar, narxlar va to‘lovlar, 🖥 panelda necha kun va soat bo‘lgani, 🔥 olingan va ⌛ yonib ketgan lidlar, 🗂 harakatsiz lidlar. Pastda — jamoa bo‘yicha «👀 На что смотреть» va odamlar bo‘yicha «💡 Рекомендации»: kim butun hafta jim bo‘ldi, kimning aloqalari 40% va undan ko‘p kamaydi, kimda maketlar ko‘rsatilmagan, kim ko‘rsatish me’yorini bajardi. Xulosalar — raqamlar bo‘yicha qoidalar, neyrotarmoqsiz: aloqalar odam yozgan kompaniyalar bo‘yicha hisoblanadi. Menejerlarga bu hisobot kelmaydi, uni «Hisobotlar» belgisi o‘chiradi.",
              "Zaxirani [xaritalar bo‘yicha avtoqidiruv](#prospect-maps) va saytlarni qo‘lda tekshirish to‘ldiradi. Zaxira bo‘sh — to‘plamlar ham bo‘sh.",
            ],
            admin: [
              "Siz to‘plam olmaysiz. Ish kunlari soat 07:00 da zaxiradagi kompaniyalar menejerlar va rahbarlarga teng tarqatiladi: haftalik reja ÷ 5 (2 dan 15 gacha), reja bo‘lmasa — 5. Avval — bahosi eng yomon saytlar.",
              "Xatlar fonda tayyorlanadi, 09:00 ga kelib to‘plam odamlarga Telegramda ketadi (matnlarning bir qismi tayyor bo‘lmasa ham, 10:00 dan kechikmay). To‘plam — aynan shuncha aloqa: botdagi har bir «Не подходит» yoki paneldagi «yozmaymiz» uchun odamga darhol zaxiradan tayyor xatli almashtiruvchi beriladi, kuniga ikki to‘plamgacha. 18:00 da bajarilmagani zaxiraga qaytadi, sizga va rahbarlarga butun jamoa bo‘yicha bir xil hisobot keladi: «Имя — 7 касаний (поток 4) · порция 3 из 5, не подошло 2, без замены 1». Aloqalar — kun davomidagi hammasi: to‘plam, «Получать лиды» oqimi va paneldan yozilgani; to‘plam — ertalabki taqsimotdan qanchasi bajarilgani. Pastda — jami: «Всего: 34 касания · порции: 21 из 45». 13.10 dan bu hisobot «📋 Сотрудники за день» deb ataladi: har kimning aloqalari va to‘plami, 🖥 paneldagi daqiqalar (14.10 dan — oyna ochiq va odam unda ishlayotganda), birinchi va oxirgi kirish, ko‘p ochiladigan bo‘limlar, 🔥 olingan lidlar va harakatlar, pastda esa — «👀 На что смотреть» va odamlar bo‘yicha «💡 Рекомендации». Xulosalar raqamlar bo‘yicha qoidalar bilan hisoblanadi, neyrotarmoqsiz. Menejerlarga bu hisobot kelmaydi. Ish kunlari soat 12:00 da bot kun davomida aloqasi, panelga kirishi va botda amali bo‘lmaganlarga to‘plamni o‘zi eslatadi (kirishlar hisobga olinmaydi). **15:00 da**, agar odam hali ham jim bo‘lsa, sizga va rahbarlarga «🔕 К 15:00 молчат: …» keladi. Aloqalar rejasi 0 bo‘lgan yoki «Navbat bo‘yicha yangi buyurtmalar» olib tashlanganlarga tegmaydi — «Jamoa»da ta’til va kasallik shunday belgilanadi. 15:00 dagi qator — «Hisobotlar» belgisi ostida.",
              "**Dushanba kunlari soat 10:00 da** sizga va rahbarga «📅 Сотрудники за неделю» keladi — o‘tgan hafta, dushanbadan yakshanbagacha, har bir kishi bo‘yicha: ✉️ aloqalar va bir hafta oldin qancha bo‘lgani, 💬 uning aloqalariga qanchasi javob bergani, 🎯 maketlar, 2 talik me’yordan ko‘rsatishlar, narxlar va to‘lovlar, 🖥 panelda necha kun va soat bo‘lgani, 🔥 olingan va ⌛ yonib ketgan lidlar, 🗂 harakatsiz lidlar. Pastda — jamoa bo‘yicha «👀 На что смотреть» va odamlar bo‘yicha «💡 Рекомендации»: kim butun hafta jim bo‘ldi, kimning aloqalari 40% va undan ko‘p kamaydi, kimda maketlar ko‘rsatilmagan, kim ko‘rsatish me’yorini bajardi. Xulosalar — raqamlar bo‘yicha qoidalar, neyrotarmoqsiz: aloqalar odam yozgan kompaniyalar bo‘yicha hisoblanadi. Menejerlarga bu hisobot kelmaydi, uni «Hisobotlar» belgisi o‘chiradi.",
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
          id: "autopilot",
          title: "Avtomatik aloqalar: kuniga 20 ta xabar, istalgan nishalar",
          roles: ["head", "admin"],
          body: {
            head: [
              "Avtomatik aloqalar birinchi xabarlarni menejersiz, o‘zi yozadi — bu egasining qarori: istalgan nishalarda kuniga kamida 20 ta xabar, ular haqiqatan Telegram’ga ketgan bo‘lishi kerak. Urinishlar xabar deb hisoblanmaydi: yigirmatasi ketmaguncha avtomatik aloqalar keyingi kompaniyani oladi. Bo‘lim tepasidagi «Avtomatik aloqalar» bloki bugun nechta xabar ketgani va nechtasi yuborishni kutayotganini, qaysi akkauntlardan ketganini, nechta mijoz javob bergani va nechta lid ishga olinganini ko‘rsatadi, pastroqda esa — bugun kompaniyalarni qidirishga Firecrawl’ning nechta krediti ketgani va bu nima bergani (batafsil — quyida, «Yuborish» bandida).",
              "**Qanday yozadi.** Har kuni Toshkent vaqti bilan 07:00 dan 17:30 gacha panel har besh daqiqada avtomatik aloqalardan nechta xabar ketgani va navbatda nechtasi turganini qaraydi va yetishmaganini tayyorlaydi: bir martada ikkitadan va navbatda bir vaqtda to‘rttadan ko‘p emas — menejerlarning xabarlari ularning orqasida kutib qolmasligi uchun. 17:30 da tugatadi: oxirgi xabarlar ish kuni tugaguncha ketadi va ularga javoblar menejerlar joyida bo‘lganda keladi. Har bir xabar «Bog‘lanish» bosilgandagi yo‘lning o‘zidan o‘tadi: [saytni haqiqiy tekshirish](#prospect-fact-check), oddiy inson tilidagi xabar, yuborishdan oldingi tekshiruv. Xabardagi imzo — «DevUz Studio»: mijoz javob bermaguncha aloqa hech kimniki emas va boshqa birovning ismi bilan imzolanmaydi. 10.10.2026 dan boshlab avtomatik aloqa sayt haqidagi xatni oldindan yozmaydi: tayyorlashda — faqat saytni haqiqatda tekshirish, birinchi bo‘lib «Assalomu alaykum» ketadi. Ruscha javob berishsa — dumaloq video ketadi va xat umuman kerak emas; boshqa tilda javob berishsa yoki dumaloq video ketmasa — panel bir necha daqiqada o‘sha tekshiruv bo‘yicha xat yozadi va uni yuborishdan oldingi o‘sha tekshiruvdan o‘tkazadi. Tekshiruvga uch kundan ko‘p bo‘lsa yoki xat yozilmasa — suhbat odamga o‘tadi. Sayti yo‘q kompaniyaga dumaloq video ketmaydi — unda sayt haqida gap boradi: unga nishasi bo‘yicha xat yoziladi, saytni tekshirishsiz. Bot qo‘yib yuborgan suhbat lidga aylanadi va iliq lidlar navbatiga tushadi: lidgacha aloqa hech kimniki emas, aks holda odamga xabar borish joyi yo‘q.",
              "**Dam olish kunlari — ko‘proq.** Shanba va yakshanba kunlari me’yor 20 emas, kamida 60 ta xabar: menejerlar yozmaydi, ishchi akkauntlar bo‘sh, biznes egalari esa dam olish kunlari Telegram’da o‘zlari ko‘proq javob beradi — egasi 17.10.2026 da shunday qaror qildi. Xabarlar 20:00 gacha tayyorlanadi, oxirgilari 20:30 gacha ketadi, dam olish kunlari hisobot 18:00 da emas, 20:30 da keladi — oldingi hisobotdan beri, shuning uchun hech bir javob tushib qolmaydi. Akkauntga «soatiga uchta yangi» chegarasi va 07:30 dan 20:30 gacha yuborish — ish kunlaridagidek. Dam olish kunlaridagi javoblarga model ish kunlaridagidek javob beradi, maketga rozi bo‘lgan mijoz esa odatdagidek [lidlar navbatiga](#leads-queue) o‘tadi.",
              "**Kimga yozadi.** Istalgan nishadagi umumiy ro‘yxatning bo‘sh kompaniyalariga — kimningdir [kunlik to‘plamida](#prospect-portion) bo‘lmagan va Telegram yetib boradiganlariga: avval saytida Telegram @manzili borlarga, keyin sayti va mobil raqami borlarga, keyin saytsizlarga; ular ichida — eng past bahoga ega saytlardan boshlab. Mobil raqam bo‘yicha ham yozadi: ishchi akkaunt raqamni kontaktlarga qo‘shadi va Telegram u bo‘yicha odamni o‘zi topadi — o‘nta raqamdan taxminan yettitasi shunday topiladi. Shahar raqamlariga yozmaydi — ularga faqat qo‘ng‘iroq qilinadi. Avtomatik aloqalar olgan kompaniyani kunlik to‘plam ham, oqim ham bermaydi; chiqmasa (tekshiruv hech narsani tasdiqlamadi, sayt ochilmadi) — u umumiy ro‘yxatga qaytadi va unga odam yozishi mumkin. Ro‘yxatda bunday aloqalar menejer ismi o‘rniga «avtomatik aloqa» deb imzolangan.",
              "**Yuborish.** Xabarlar ishchi akkauntlardan har bir akkauntga «soatiga uchta yangi» umumiy chegarasida va faqat 07:30 dan 20:30 gacha ketadi. Yigirmataga faqat Telegram’ga ketgani hisoblanadi: agar raqam bo‘yicha Telegram topilmasa, kartochka qo‘ng‘iroqqa o‘tadi («qo‘lda yozish»), avtomatik aloqalar esa o‘rniga yangisini tayyorlaydi — va shunday qilib yigirmatasi ketguncha. Undan oldin faqat bir kunda ikki yuzta urinish to‘plansa to‘xtaydi: bu xabarlar nosozlik sababli rad etilayotganini bildiradi va hisobot bu haqda aytadi. Ro‘yxat o‘zi to‘ldiriladi: [xaritalar bo‘yicha avtoqidiruv](#prospect-maps) ro‘yxatdagi har bir nisha bo‘yicha kompaniyalarni qidiradi — o‘quv markazlari, quruvchi kompaniyalar, stomatologiyalar, kiyim do‘konlari, xususiy maktablar va bog‘chalar, tibbiyot markazlari, avtoservislar, go‘zallik salonlari va hokazo, — Firecrawl esa (saytlarni brauzer kabi ochadigan va internetda qidiradigan xizmat) har kuni o‘z kredit ulushini sarflaydi: yozishga joyi bo‘lmagan kompaniyalarning Telegram yoki mobil raqamini topadi, ro‘yxatda yaroqli kompaniyalar yuztadan kam bo‘lsa — O‘zbekiston nishalari va shaharlari bo‘yicha yangilarini qidiradi. Firecrawl kreditlari (uning to‘lov birligi: saytni ochish — bitta, qidiruv — ikkita) to‘langan davr oxirigacha har kunga teng taqsimlanadi, kuniga taxminan 33 ta — shunday qilib butun oyga yetadi. Avtoprogon studiyaning asosiy akkauntidan yozmaydi (egasi, 05.11.2026): uning «Assalomu alaykum» xabarlari faqat qo‘shimcha ishchi akkauntlardan ketadi, menejerlar xabarlari va javob berganlar bilan yozishma esa avvalgidek asosiy akkauntdan. Barcha qo‘shimcha akkauntlar pauzada yoki cheklangan bo‘lsa, avtoprogon to‘xtaydi va xabar tayyorlamaydi: sayt tekshiruvi va kontakt qidiruvi oldindan sarflanmaydi.",
              "**Mijoz javob berdi** — lid darhol menejerlarga Telegram’da [lidlar navbati](#leads-queue) bo‘yicha ketadi: kunduzi navbat bilan bittasiga 30 daqiqaga, kechasi hammaga teng ulush bilan. Kartochka sarlavhasi — «🤖 Ответ на касание автопрогона», sayt, kompaniya nishasi va mijozning so‘zlari bilan. Kim olsa — lid ham, yozishma ham o‘shaniki: model keyin uning nomidan javob beradi, lid kartochkasidagi «O‘zim javob beraman» esa suhbatni odamga o‘tkazadi. Prototip so‘radi — «🔥 Нужен прототип» xabari tarqatiladi va lid birinchi bo‘lib «🛠 Беру прототип» tugmasini bosganniki bo‘ladi. Boshqa yozmaslikni so‘radi — lid ochilmaydi va unga boshqa hech kim yozmaydi. 13.10 dan lid birinchi javobda ochilmaydi: «Добрый вечер», savol yoki «ko‘rib chiqaman» ga model javob beradi va bosh sahifaning 12 soatlik bepul maketiga rozilikka olib boradi, narx aytmaydi. Lid navbatga mijoz rozi bo‘lganda («+», «ha», «давайте»), qo‘ng‘iroq yoki biror narsa yuborishni so‘raganda — yoki model suhbatni o‘zi topshirganda (12 tadan ortiq javobga cho‘zilsa yoki javobi tekshiruvdan o‘tmasa) ketadi. Lidgacha bo‘lgan butun yozishma — uning kartochkasida.",
              "Har kuni 18:00 da, ish kuni oxirida, sizga va egasiga Telegram’da «🤖 Автопрогон касаний — отчёт за …» hisoboti keladi — oldingi hisobotdan beri o‘tgan bir sutka uchun, shuning uchun kechki va tungi javoblar ham unga tushadi. Unda: nechta xabar yozilgani (Telegram’ga ketgani va qaysi akkauntlardan), nechta mijoz javob bergani va ulardan nechtasi ishga olingani, pastida esa — javob bergan har bir kompaniya va uning lidini kim olgani yoki «⏳ ещё ничей — в очереди лидов». Alohida — nechta raqam Telegram’da topilmagani va haqiqiy tekshiruvdan keyin nechta kompaniyaga yozilmagani. «🔎 Поиск лидов (Firecrawl)» qatori — bir sutkada nechta kredit ketgani, nechta kompaniyada Telegram yoki mobil raqam topilgani va tekshiruvga nechta yangi sayt ketgani. «⚠️» va «Не добрали» qatori ro‘yxatda Telegram yetib boradigan kompaniyalar tugaganini yoki akkauntlar to‘xtab turganini bildiradi: [Akkauntlar](/admin/accounts) bo‘limini va avtoqidiruv kampaniyasini tekshiring. Agar xabarlar dasturning o‘zidagi nosozlik sababli tayyorlanmagan bo‘lsa, hisobot buni to‘g‘ridan-to‘g‘ri yozadi — xato matni bilan «❗ Автопрогон сбоил» qatorida, «Не добрали» esa bu holda «kompaniyalar kam» emas, «nosozlik sababli» degani: bunday hisobotni dasturchiga yuboring. Avtomatik aloqalarni faqat egasi to‘xtatadi va ishga tushiradi.",
            ],
            admin: [
              "Avtomatik aloqalar birinchi xabarlarni menejersiz, o‘zi yozadi — bu egasining qarori: istalgan nishalarda kuniga kamida 20 ta xabar, ular haqiqatan Telegram’ga ketgan bo‘lishi kerak. Urinishlar xabar deb hisoblanmaydi: yigirmatasi ketmaguncha avtomatik aloqalar keyingi kompaniyani oladi. Bo‘lim tepasidagi «Avtomatik aloqalar» bloki bugun nechta xabar ketgani va nechtasi yuborishni kutayotganini, qaysi akkauntlardan ketganini, nechta mijoz javob bergani va nechta lid ishga olinganini ko‘rsatadi, pastroqda esa — bugun kompaniyalarni qidirishga Firecrawl’ning nechta krediti ketgani va bu nima bergani (batafsil — quyida, «Yuborish» bandida).",
              "**Qanday yozadi.** Har kuni Toshkent vaqti bilan 07:00 dan 17:30 gacha panel har besh daqiqada avtomatik aloqalardan nechta xabar ketgani va navbatda nechtasi turganini qaraydi va yetishmaganini tayyorlaydi: bir martada ikkitadan va navbatda bir vaqtda to‘rttadan ko‘p emas — menejerlarning xabarlari ularning orqasida kutib qolmasligi uchun. 17:30 da tugatadi: oxirgi xabarlar ish kuni tugaguncha ketadi va ularga javoblar menejerlar joyida bo‘lganda keladi. Har bir xabar «Bog‘lanish» bosilgandagi yo‘lning o‘zidan o‘tadi: [saytni haqiqiy tekshirish](#prospect-fact-check), oddiy inson tilidagi xabar, yuborishdan oldingi tekshiruv. Xabardagi imzo — «DevUz Studio»: mijoz javob bermaguncha aloqa hech kimniki emas va boshqa birovning ismi bilan imzolanmaydi. 10.10.2026 dan boshlab avtomatik aloqa sayt haqidagi xatni oldindan yozmaydi: tayyorlashda — faqat saytni haqiqatda tekshirish, birinchi bo‘lib «Assalomu alaykum» ketadi. Ruscha javob berishsa — dumaloq video ketadi va xat umuman kerak emas; boshqa tilda javob berishsa yoki dumaloq video ketmasa — panel bir necha daqiqada o‘sha tekshiruv bo‘yicha xat yozadi va uni yuborishdan oldingi o‘sha tekshiruvdan o‘tkazadi. Tekshiruvga uch kundan ko‘p bo‘lsa yoki xat yozilmasa — suhbat odamga o‘tadi. Sayti yo‘q kompaniyaga dumaloq video ketmaydi — unda sayt haqida gap boradi: unga nishasi bo‘yicha xat yoziladi, saytni tekshirishsiz. Bot qo‘yib yuborgan suhbat lidga aylanadi va iliq lidlar navbatiga tushadi: lidgacha aloqa hech kimniki emas, aks holda odamga xabar borish joyi yo‘q.",
              "**Dam olish kunlari — ko‘proq.** Shanba va yakshanba kunlari me’yor 20 emas, kamida 60 ta xabar: menejerlar yozmaydi, ishchi akkauntlar bo‘sh, biznes egalari esa dam olish kunlari Telegram’da o‘zlari ko‘proq javob beradi — egasi 17.10.2026 da shunday qaror qildi. Xabarlar 20:00 gacha tayyorlanadi, oxirgilari 20:30 gacha ketadi, dam olish kunlari hisobot 18:00 da emas, 20:30 da keladi — oldingi hisobotdan beri, shuning uchun hech bir javob tushib qolmaydi. Akkauntga «soatiga uchta yangi» chegarasi va 07:30 dan 20:30 gacha yuborish — ish kunlaridagidek. Dam olish kunlaridagi javoblarga model ish kunlaridagidek javob beradi, maketga rozi bo‘lgan mijoz esa odatdagidek [lidlar navbatiga](#leads-queue) o‘tadi.",
              "**Kimga yozadi.** Istalgan nishadagi umumiy ro‘yxatning bo‘sh kompaniyalariga — kimningdir [kunlik to‘plamida](#prospect-portion) bo‘lmagan va Telegram yetib boradiganlariga: avval saytida Telegram @manzili borlarga, keyin sayti va mobil raqami borlarga, keyin saytsizlarga; ular ichida — eng past bahoga ega saytlardan boshlab. Mobil raqam bo‘yicha ham yozadi: ishchi akkaunt raqamni kontaktlarga qo‘shadi va Telegram u bo‘yicha odamni o‘zi topadi — o‘nta raqamdan taxminan yettitasi shunday topiladi. Shahar raqamlariga yozmaydi — ularga faqat qo‘ng‘iroq qilinadi. Avtomatik aloqalar olgan kompaniyani kunlik to‘plam ham, oqim ham bermaydi; chiqmasa (tekshiruv hech narsani tasdiqlamadi, sayt ochilmadi) — u umumiy ro‘yxatga qaytadi va unga odam yozishi mumkin. Ro‘yxatda bunday aloqalar menejer ismi o‘rniga «avtomatik aloqa» deb imzolangan.",
              "**Yuborish.** Xabarlar ishchi akkauntlardan har bir akkauntga «soatiga uchta yangi» umumiy chegarasida va faqat 07:30 dan 20:30 gacha ketadi. Yigirmataga faqat Telegram’ga ketgani hisoblanadi: agar raqam bo‘yicha Telegram topilmasa, kartochka qo‘ng‘iroqqa o‘tadi («qo‘lda yozish»), avtomatik aloqalar esa o‘rniga yangisini tayyorlaydi — va shunday qilib yigirmatasi ketguncha. Undan oldin faqat bir kunda ikki yuzta urinish to‘plansa to‘xtaydi: bu xabarlar nosozlik sababli rad etilayotganini bildiradi va hisobot bu haqda aytadi. Ro‘yxat o‘zi to‘ldiriladi: [xaritalar bo‘yicha avtoqidiruv](#prospect-maps) ro‘yxatdagi har bir nisha bo‘yicha kompaniyalarni qidiradi — o‘quv markazlari, quruvchi kompaniyalar, stomatologiyalar, kiyim do‘konlari, xususiy maktablar va bog‘chalar, tibbiyot markazlari, avtoservislar, go‘zallik salonlari va hokazo, — Firecrawl esa (saytlarni brauzer kabi ochadigan va internetda qidiradigan xizmat) har kuni o‘z kredit ulushini sarflaydi: yozishga joyi bo‘lmagan kompaniyalarning Telegram yoki mobil raqamini topadi, ro‘yxatda yaroqli kompaniyalar yuztadan kam bo‘lsa — O‘zbekiston nishalari va shaharlari bo‘yicha yangilarini qidiradi. Firecrawl kreditlari (uning to‘lov birligi: saytni ochish — bitta, qidiruv — ikkita) to‘langan davr oxirigacha har kunga teng taqsimlanadi, kuniga taxminan 33 ta — shunday qilib butun oyga yetadi. Avtoprogon studiyaning asosiy akkauntidan yozmaydi (egasi, 05.11.2026): uning «Assalomu alaykum» xabarlari faqat qo‘shimcha ishchi akkauntlardan ketadi, menejerlar xabarlari va javob berganlar bilan yozishma esa avvalgidek asosiy akkauntdan. Barcha qo‘shimcha akkauntlar pauzada yoki cheklangan bo‘lsa, avtoprogon to‘xtaydi va xabar tayyorlamaydi: sayt tekshiruvi va kontakt qidiruvi oldindan sarflanmaydi.",
              "**Mijoz javob berdi** — lid darhol menejerlarga Telegram’da [lidlar navbati](#leads-queue) bo‘yicha ketadi: kunduzi navbat bilan bittasiga 30 daqiqaga, kechasi hammaga teng ulush bilan. Kartochka sarlavhasi — «🤖 Ответ на касание автопрогона», sayt, kompaniya nishasi va mijozning so‘zlari bilan. Kim olsa — lid ham, yozishma ham o‘shaniki: model keyin uning nomidan javob beradi, lid kartochkasidagi «O‘zim javob beraman» esa suhbatni odamga o‘tkazadi. Prototip so‘radi — «🔥 Нужен прототип» xabari tarqatiladi va lid birinchi bo‘lib «🛠 Беру прототип» tugmasini bosganniki bo‘ladi. Boshqa yozmaslikni so‘radi — lid ochilmaydi va unga boshqa hech kim yozmaydi. 13.10 dan lid birinchi javobda ochilmaydi: «Добрый вечер», savol yoki «ko‘rib chiqaman» ga model javob beradi va bosh sahifaning 12 soatlik bepul maketiga rozilikka olib boradi, narx aytmaydi. Lid navbatga mijoz rozi bo‘lganda («+», «ha», «давайте»), qo‘ng‘iroq yoki biror narsa yuborishni so‘raganda — yoki model suhbatni o‘zi topshirganda (12 tadan ortiq javobga cho‘zilsa yoki javobi tekshiruvdan o‘tmasa) ketadi. Lidgacha bo‘lgan butun yozishma — uning kartochkasida.",
              "Har kuni 18:00 da, ish kuni oxirida, sizga va rahbarga Telegram’da «🤖 Автопрогон касаний — отчёт за …» hisoboti keladi — oldingi hisobotdan beri o‘tgan bir sutka uchun, shuning uchun kechki va tungi javoblar ham unga tushadi. Unda: nechta xabar yozilgani (Telegram’ga ketgani va qaysi akkauntlardan), nechta mijoz javob bergani va ulardan nechtasi ishga olingani, pastida esa — javob bergan har bir kompaniya va uning lidini kim olgani yoki «⏳ ещё ничей — в очереди лидов». Alohida — nechta raqam Telegram’da topilmagani va haqiqiy tekshiruvdan keyin nechta kompaniyaga yozilmagani. «🔎 Поиск лидов (Firecrawl)» qatori — bir sutkada nechta kredit ketgani, nechta kompaniyada Telegram yoki mobil raqam topilgani va tekshiruvga nechta yangi sayt ketgani. «⚠️» va «Не добрали» qatori ro‘yxatda Telegram yetib boradigan kompaniyalar tugaganini yoki akkauntlar to‘xtab turganini bildiradi: [Akkauntlar](/admin/accounts) bo‘limini va avtoqidiruv kampaniyasini tekshiring. Agar xabarlar dasturning o‘zidagi nosozlik sababli tayyorlanmagan bo‘lsa, hisobot buni to‘g‘ridan-to‘g‘ri yozadi — xato matni bilan «❗ Автопрогон сбоил» qatorida, «Не добрали» esa bu holda «kompaniyalar kam» emas, «nosozlik sababli» degani: bunday hisobotni dasturchiga yuboring. Blokdagi «Avtomatik aloqalarni to‘xtatish» tugmasi yangi xabarlarni darhol to‘xtatadi, navbatdagilari esa ketadi; «Avtomatik aloqalarni ishga tushirish» qayta yoqadi. Ikkala bosish ham jurnalga yoziladi.",
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
            "Xat qisqa va salomsiz — salom alohida xabar bilan ketgan ([ikki bosqichli aloqa](#prospect-hello)). Xat matni sizniki: o‘z matningiz yoki A/B uchun ikkita, o‘z matningiz bo‘lmasa — jamoaning umumiy matnlari yoki avtoyurish yondashuvlari ([xat matnlari va A/B](#prospect-texts)). Sayt haqidagi faktlarni panel o‘zi tezislar bilan qo‘yadi: nima noto‘g‘ri va bu uning xaridorlari uchun nimaga olib keladi; bizning hisobimizcha, shu sababli qancha murojaat yo‘qotiladi; va agar uning nishasida loyihamiz bo‘lsa — buni allaqachon qilganimiz, havola bilan. Ko‘rinish ballari va ortiqcha raqamlar endi yo‘q: model xati uzun edi va menejerlar uni o‘zlari qisqartirardi. O‘zbekcha saytga xat o‘zbekcha ketadi: agar bo‘lsa, matningizning o‘zbekcha varianti, aks holda panel tarjima qiladi.",
            "Xatni o‘qing va odamga moslab tuzating. Keyin **«Yuborish: @manzil»** — xat ishchi akkaunt navbatiga turadi: birinchi bo‘lib salom ketadi, xatning o‘zi — mijoz javob berganda. Shu daqiqadan lid ochilgan va sizga biriktirilgan, aloqa esa hisobga olingan. Ketgach, tugma o‘rnida manzil, vaqt va qaysi akkauntdan ketgani bilan «Bog‘lanildi» chiqadi: «Sotuv 2» akkauntidan (@devuz_sales) yoki asosiy akkauntdan. Mijozga o‘zingiz javob bersangiz — faqat shu akkauntdan: mijoz uchun bu bitta suhbatdosh.",
            "Yuborishdan oldin panel xatni tekshiradi va nima noto‘g‘riligini yozadi: sayt uch kundan ko‘p bo‘lmagan vaqt oldin fakt bo‘yicha qayta tekshirilgan ([bu qanday ishlaydi](#prospect-fact-check)); texnik so‘zlar yo‘q; 12 dan 100 gacha so‘z (lotin yozuvidagi xat — 130 gacha: o‘sha xatning inglizcha tarjimasida so‘z ko‘proq); xat salom bilan boshlanmaydi; tezislarda yo‘q raqamlar yo‘q, 12 soatdan tashqari; «в топ», «гарантирую», «первое место», foizlar va emodzilar yo‘q; mijoz yozayotgan odamning ismi bilan salomlashuvni ko‘rmaydi; boshqa nishadagi loyihamiz aytilmagan; ikki alifboda birdan yozilgan so‘zlar yo‘q, masalan «raqibларга» — o‘zbekchaga tarjima shunday adashadi, va kirill harfi qolgan o‘zbekcha tarjimani panel qaytadan qiladi. Model 10.10.2026 gacha yozgan xatlar avvalgidek tekshiriladi: ball, yo‘qotishlar va 40–150 so‘z bilan.",
            "Har qanday xodim istalgan kartochkani tayyorlab, yubora oladi — kartochka bosgan odamga biriktiriladi. Shuning uchun [kunlik to‘plamdan](#prospect-portion) boshlang: u yerda kompaniyalar allaqachon bo‘lingan.",
          ],
        },
        {
          id: "texts",
          title: "Xat matnlari va A/B",
          body: {
            manager: [
              "Yashil **«Xat matnlari va A/B»** tugmasi — bo‘lim tavsifi ostidagi ramkada. U yerda mijozga uning salomga javobidan keyin ketadigan xatning o‘z matningizni yozasiz yoki ikkita matn: unda bu A/B, va aloqalaringiz ular orasida teng va tasodifiy bo‘linadi. Qo‘yiladigan joylar: {tezislar} — uning sayti haqidagi faktlar, majburiy; {sayt}; {kompaniya}; {ism} — sizning ismingiz; {kim} — ismingiz va studiya bilan tanishtiruv jumlasi; {prototip} — 12 soatda bepul prototip haqidagi jumla. O‘zingiz yozgandek yozing: qisqa, boshida salomsiz, texnik so‘zlarsiz va o‘zingizdan raqamlarsiz — raqamlar faqat tezislarda. Yomon matnni panel saqlamaydi va nimani tuzatish kerakligini aytadi, har bir matn ostida esa mijoz uni qanday ko‘rishini ko‘rsatadi. Shakl ustida — misol: qo‘yiladigan joylari bor matn qanday yoziladi (ular yashil rangda) va mijoz undan qanday xat oladi; «O‘zbekcha variant misoli» ichida — xuddi shu o‘zbekcha. Misoldagi kompaniya o‘ylab topilgan, keys esa haqiqiy; misolni nusxalab, o‘zingizga moslashtirish mumkin.",
              "Matn ostida — hisob: u bilan nechta xat ketgan, nechta mijoz javob bergan, nechtasi maket xohlaydi va nechtasi bitimgacha yetgan. Xat mijozga yetib borganda ketgan hisoblanadi: bot orqali — uning salomga javobidan keyin (ruscha javob berganlarga dumaloq video ketadi va bunday aloqa matn hisobiga kirmaydi), qo‘lda yo‘nalishda — o‘zi bog‘langani belgilanganda. Har bir matnga kamida 20 tadan xat ketmaguncha panel «xulosa qilishga erta» deb yozadi: o‘nta xatda istalgan matn tasodifan yutadi. Keyin — qaysi matnga ko‘proq javob berishadi va qanday ishonch bilan. «Shuni qoldirish, ikkinchisini olib tashlash» g‘olibni qoldiradi.",
              "O‘z matningiz yo‘q — xatlaringiz jamoaning umumiy matnlari bilan, ular ham bo‘lmasa avtoyurish yondashuvlari bilan ketadi. O‘zbekcha saytga xat o‘zbekcha ketadi: o‘zbekcha o‘z variantingizni to‘ldiring — aks holda model tarjima qiladi. Matnni tuzatish hisobni buzmaydi: oldingi matn o‘z statistikasi bilan arxivga ketadi, yangisi noldan hisoblanadi. Kartochkadagi xatni yuborishdan oldin avvalgidek qo‘lda tuzatish mumkin.",
            ],
            head: [
              "Yashil **«Xat matnlari va A/B»** tugmasi — bo‘lim tavsifi ostidagi ramkada. U yerda mijozga uning salomga javobidan keyin ketadigan xatning o‘z matningizni yozasiz yoki ikkita matn: unda bu A/B, va aloqalaringiz ular orasida teng va tasodifiy bo‘linadi. Qo‘yiladigan joylar: {tezislar} — uning sayti haqidagi faktlar, majburiy; {sayt}; {kompaniya}; {ism} — sizning ismingiz; {kim} — ismingiz va studiya bilan tanishtiruv jumlasi; {prototip} — 12 soatda bepul prototip haqidagi jumla. O‘zingiz yozgandek yozing: qisqa, boshida salomsiz, texnik so‘zlarsiz va o‘zingizdan raqamlarsiz — raqamlar faqat tezislarda. Yomon matnni panel saqlamaydi va nimani tuzatish kerakligini aytadi, har bir matn ostida esa mijoz uni qanday ko‘rishini ko‘rsatadi. Shakl ustida — misol: qo‘yiladigan joylari bor matn qanday yoziladi (ular yashil rangda) va mijoz undan qanday xat oladi; «O‘zbekcha variant misoli» ichida — xuddi shu o‘zbekcha. Misoldagi kompaniya o‘ylab topilgan, keys esa haqiqiy; misolni nusxalab, o‘zingizga moslashtirish mumkin.",
              "Matn ostida — hisob: u bilan nechta xat ketgan, nechta mijoz javob bergan, nechtasi maket xohlaydi va nechtasi bitimgacha yetgan. Xat mijozga yetib borganda ketgan hisoblanadi: bot orqali — uning salomga javobidan keyin (ruscha javob berganlarga dumaloq video ketadi va bunday aloqa matn hisobiga kirmaydi), qo‘lda yo‘nalishda — o‘zi bog‘langani belgilanganda. Har bir matnga kamida 20 tadan xat ketmaguncha panel «xulosa qilishga erta» deb yozadi: o‘nta xatda istalgan matn tasodifan yutadi. Keyin — qaysi matnga ko‘proq javob berishadi va qanday ishonch bilan. «Shuni qoldirish, ikkinchisini olib tashlash» g‘olibni qoldiradi.",
              "Siz barcha menejerlarning matnlarini hisobi bilan ko‘rasiz va eng yaxshisini umumiy qila olasiz: «Umumiy 1-matn qilish» yoki «Umumiy 2-matn qilish». Umumiy matnlar bilan o‘z matni yo‘qlarning hammasi yozadi; ularni siz va egasi «Jamoaning umumiy matnlari» blokida belgilaysiz va tuzatasiz. Pastda — «Avtoyurish yondashuvlari»: avtoyurish yozadigan matnlar, sotuv kurslaridan olingan usullar: «Og‘riq va yechim» (nima noto‘g‘ri, nima bilan tahdid soladi, yechim), «Savol» (uning yo‘qotishlari haqidagi savoldan) va «Nishadagi tajriba» (birinchi qatorda — uning nishasida ishlashimiz; faqat nishasi bo‘yicha loyihamiz borlarga ketadi). Har birining o‘z hisobi bor.",
            ],
            admin: [
              "Yashil **«Xat matnlari va A/B»** tugmasi — bo‘lim tavsifi ostidagi ramkada. U yerda mijozga uning salomga javobidan keyin ketadigan xatning o‘z matningizni yozasiz yoki ikkita matn: unda bu A/B, va aloqalaringiz ular orasida teng va tasodifiy bo‘linadi. Qo‘yiladigan joylar: {tezislar} — uning sayti haqidagi faktlar, majburiy; {sayt}; {kompaniya}; {ism} — sizning ismingiz; {kim} — ismingiz va studiya bilan tanishtiruv jumlasi; {prototip} — 12 soatda bepul prototip haqidagi jumla. O‘zingiz yozgandek yozing: qisqa, boshida salomsiz, texnik so‘zlarsiz va o‘zingizdan raqamlarsiz — raqamlar faqat tezislarda. Yomon matnni panel saqlamaydi va nimani tuzatish kerakligini aytadi, har bir matn ostida esa mijoz uni qanday ko‘rishini ko‘rsatadi. Shakl ustida — misol: qo‘yiladigan joylari bor matn qanday yoziladi (ular yashil rangda) va mijoz undan qanday xat oladi; «O‘zbekcha variant misoli» ichida — xuddi shu o‘zbekcha. Misoldagi kompaniya o‘ylab topilgan, keys esa haqiqiy; misolni nusxalab, o‘zingizga moslashtirish mumkin.",
              "Matn ostida — hisob: u bilan nechta xat ketgan, nechta mijoz javob bergan, nechtasi maket xohlaydi va nechtasi bitimgacha yetgan. Xat mijozga yetib borganda ketgan hisoblanadi: bot orqali — uning salomga javobidan keyin (ruscha javob berganlarga dumaloq video ketadi va bunday aloqa matn hisobiga kirmaydi), qo‘lda yo‘nalishda — o‘zi bog‘langani belgilanganda. Har bir matnga kamida 20 tadan xat ketmaguncha panel «xulosa qilishga erta» deb yozadi: o‘nta xatda istalgan matn tasodifan yutadi. Keyin — qaysi matnga ko‘proq javob berishadi va qanday ishonch bilan. «Shuni qoldirish, ikkinchisini olib tashlash» g‘olibni qoldiradi.",
              "Siz barcha menejerlarning matnlarini hisobi bilan ko‘rasiz va eng yaxshisini umumiy qila olasiz: «Umumiy 1-matn qilish» yoki «Umumiy 2-matn qilish». Umumiy matnlar bilan o‘z matni yo‘qlarning hammasi yozadi; ularni siz va rahbar «Jamoaning umumiy matnlari» blokida belgilaysiz va tuzatasiz. Pastda — «Avtoyurish yondashuvlari»: avtoyurish yozadigan matnlar, sotuv kurslaridan olingan usullar: «Og‘riq va yechim» (nima noto‘g‘ri, nima bilan tahdid soladi, yechim), «Savol» (uning yo‘qotishlari haqidagi savoldan) va «Nishadagi tajriba» (birinchi qatorda — uning nishasida ishlashimiz; faqat nishasi bo‘yicha loyihamiz borlarga ketadi). Har birining o‘z hisobi bor; juma kungi «oldin / keyin» o‘lchovi ham ularga qaraydi.",
            ],
          },
        },
        {
          id: "hello",
          title: "Ikki bosqichli aloqa: salom → dumaloq video yoki xat",
          body: [
            "Ishchi akkaunt notanish odamga birinchi bo‘lib faqat salom yozadi: o‘zbekcha saytga — «Assalomu alaykum», ruscha saytga — «Здравствуйте». Sayt haqidagi xatni odam faqat javob bersa oladi. Buni egasi 07.10.2026 da hal qildi: Telegram akkauntlarni «spam» shikoyatlari uchun cheklaydi, ular esa aynan notanishlarning uzun xatlariga qo‘yiladi. Salomga bunday shikoyat qilinmaydi — unga «ha?» deb javob berishadi yoki jim turishadi.",
            "Mijoz ruscha javob berdi («Здравствуйте», «да?», «кто это?») — ikki daqiqadan keyin bot unga ishchi akkauntning «Saqlangan xabarlar»idagi ruscha dumaloq videoni yuboradi; o‘zbekcha javob berdi («Assalomu alaykum», «Ha») — o‘zbekcha dumaloq videoni. Dumaloq videoda saytni ko‘rib, bir nechta xato topganimizni aytamiz va ularni yozib berishni va’da qilamiz: tahlil mijoz dumaloq videoga javob berganda ketadi (pastda). Boshqa tilda javob berdi — uch daqiqadan keyin kartochkadagi xat salomsiz va javob tilida ketadi: xat boshqa tilda bo‘lsa, bot uni tarjima qiladi. So‘zsiz javob — stiker, «+» — salom tilida hisoblanadi. «Saqlangan xabarlar»da kerakli tildagi dumaloq video bo‘lmasa yoki Telegram uni o‘tkazmasa (odam ovozli va video xabarlarni taqiqlagan) — dumaloq video o‘rniga mijoz javob bergan tilda xat ketadi. Egasi, 09.10.2026: «Ovozli xabar va dumaloq videolar taqiqlangan bo‘lsa, javob tilida yozamiz». Sayti yo‘q kompaniyaga dumaloq video umuman ketmaydi: unda sayt haqida gap boradi, uning esa sayti yo‘q, — unga nishasi bo‘yicha xat ketadi (egasi, 25.10.2026, dumaloq videoga «Какой сайт открыли?» javobidan keyin). SI bu daqiqalarda jim turadi, keyin yozishmani u odatdagidek olib boradi ([mijoz javob berdi](#prospect-replies)). Egasi, 08.10.2026: «ruscha javob berishsa — dumaloq video ketadi; boshqa tilda bo‘lsa — shu tilda, odatdagidek yozamiz»; 12.10.2026: «lid o‘zbekcha javob bersa — o‘zbekcha dumaloq video yuboramiz».",
            "«Yozmang» deb javob bersa yoki qo‘ng‘iroq qilishni so‘rasa — xat ketmaydi, bot sizni chaqiradi va mijoz faqat salomni olganini, sayt haqidagi xat ketmaganini yozadi. Sayt tekshiruviga uch kundan ko‘p bo‘lsa — xat ham ketmaydi: bot sizni chaqiradi, saytni tekshirib, o‘zingiz yozing. Umuman javob bermasa — boshqa hech narsa ketmaydi: bitta salomdan keyin [qayta eslatma](#prospect-followups) yo‘q.",
            "Dumaloq videoga «да», «+», «ha», «давайте», «ок», «какие ошибки?», «yuboring» deb javob berishadi — uch daqiqadan keyin bot tahlil yuboradi: sayt faktik tekshiruvi bo‘yicha kartochkadagi xat, saytda nima noto‘g‘ri va bu xaridorlar uchun nimaga olib keladi, oxirida esa maketni bepul tayyorlash taklifi. Buni egasi 22.10.2026 da hal qildi: odam xatolar qayerdaligini kutgan, bot esa darhol shartlar bilan «maket tayyorlayapmiz» deb javob bergan. Sayt tekshiruviga uch kundan ko‘p bo‘lsa — tahlil ketmaydi, bot sizni chaqiradi. Qisqa va tushunarsiz javobga («yo‘q», «keyinroq») tahlil ketmaydi: SI yoki siz javob berasiz. «Летс го», «поехали», «за дело», «ladno» kabi javoblar — «ha», ularga tahlil ketadi (26.10.2026 dan: «Летс го» javobida suhbat odamga o‘tib ketgan, mijoz bir soat kutgan). Bot suhbatni sizga «qisqa va tushunarsiz» deb bergan bo‘lsa-yu, mijoz ketidan aniq javob bersa va dumaloq videodan keyin unga hech kim yozmagan bo‘lsa, bot tahlilni o‘zi yuboradi va bu haqda sizga yozadi: ikki kishi bo‘lib javob bermaslik uchun kartochkada «O‘zim javob beraman» ni bosish mumkin. Tahlilning o‘ziga «+», «да», «ha», «qiling», «делайте» deb javob berishsa yoki mijoz maketni so‘z bilan so‘rasa, bot shartlar havolasi bilan «Qabul qilindi — siz uchun bepul maket tayyorlayapmiz» deb javob beradi, jamoaga esa «🔥 Нужен прототип» ketadi (prototip haqidagi har qanday so‘rovdagidek — [mijoz javob berdi](#prospect-replies)). Kartochkada bu ko‘rinadi: «Salom ketdi — mijoz javob berganda dumaloq video yoki xat ketadi», javobdan keyin esa — aynan nima ketgani. Aloqalar, kunlik to‘plam va «soatiga uch» hisobiga salomning o‘zi kiradi: notanishga birinchi xabar — Telegram hisoblaydigan narsa.",
          ],
        },
        {
          id: "edit-sent",
          title: "«Tuzatish»: yuborilgan xabarni to‘g‘rilash",
          body: [
            "Ishchi akkauntdan mijozga ketgan xat va javoblar ostida **«Tuzatish»** tugmasi bor: [Aloqalar](/admin/prospect) bo‘limidagi kompaniya kartochkasida — aloqa xati ostida, lid kartochkasida «Lenta» da — har bir xabarimiz ostida. Bosing, matnni tuzating va **«Tuzatishni saqlash»** tugmasini bosing. Egasi, 12.10.2026: xato yozuv, nishaga mos kelmagan misol yoki noqulay jumla shu joyning o‘zida tuzatiladi, ketidan yangi xabar bilan emas — notanish odamdan ketma-ket ikkinchi xabar ommaviy tarqatmaga o‘xshaydi.",
            "Xat hali salomga javobni kutayotgan bo‘lsa — u darhol tuzatiladi va mijozga yangi holda ketadi. Xabar hali navbatda turgan bo‘lsa — u ham darhol. Allaqachon ketgan bo‘lsa — uni bot o‘sha ishchi akkauntdan tuzatadi, odatda bir daqiqada: tugma ostida avval «Tuzatish botni kutmoqda», keyin «Tuzatildi» yoki sababi bilan «Tuzatib bo‘lmadi» ko‘rinadi (masalan, mijoz yozishmani o‘chirib yuborgan). Mijozda xabar yonida Telegramning «tahrirlangan» belgisi paydo bo‘ladi. Telegram o‘z xabarini yuborilganidan keyin 48 soat ichida tahrirlashga ruxsat beradi — keyin tugma yo‘q.",
            "Yangi matn yuborishdan oldingi kabi tekshiriladi: sayt haqidagi xat — [birinchi xat](#prospect-send) bilan bir xil qoidalar bo‘yicha (12 dan 100 so‘zgacha, lotin yozuvida — 130 gacha, salomsiz, texnik so‘zlarsiz va sayt tekshiruvida bo‘lmagan raqamlarsiz), yozishmadagi javob — bo‘sh emas va bitta xabarga sig‘adi. Salomning o‘zini va dumaloq videoni tuzatib bo‘lmaydi: mijoz javob bermaguncha unga faqat salom ketadi. Tugmani aloqani olib borayotgan xodim, lid kimga biriktirilgan bo‘lsa o‘sha, shuningdek rahbar va egasi ko‘radi; kim nimani tuzatgani — jurnalda.",
          ],
        },
        {
          id: "hello-text",
          title: "Odatiy salom o‘rniga o‘z salomingiz",
          body: {
            manager: [
              "Ishchi akkauntdan birinchi bo‘lib salom ketadi — odatda ruscha saytga «Здравствуйте», o‘zbekcha saytga «Assalomu alaykum». Rahbar va egasi uni o‘zinikiga almashtira oladi: «Xat matnlari va A/B», «Birinchi xabar» bloki — hozir nima ketayotgani ham o‘sha yerda yozilgan. Aloqa bundan o‘zgarmaydi: sayt haqidagi xat va dumaloq videoni hamon faqat javob bergan odam oladi ([ikki bosqichli aloqa](#prospect-hello)).",
            ],
            head: [
              "«Xat matnlari va A/B» tugmasi → **«Birinchi xabar»** bloki: bu yerda odatiy salom o‘rniga o‘z salomingizni berasiz — ruscha va o‘zbekcha, har birini alohida. **«Salomni saqlash»** tugmasini bosing — barcha menejerlar va avtoyurishning keyingi aloqalari shu salom bilan boshlanadi. Maydon bo‘sh bo‘lsa — odatiy salom ketadi: «Здравствуйте» yoki «Assalomu alaykum». Salomni siz va egasi o‘zgartira olasiz; menejerlar nima ketayotganini ko‘radi, lekin o‘zgartira olmaydi.",
              "Egasining qoidasi o‘z kuchida: birinchi bo‘lib xat emas, faqat salom ketadi — Telegram notanish odamlardan kelgan xatlarga «spam» shikoyatlari uchun akkauntlarni cheklaydi ([ikki bosqichli aloqa](#prospect-hello)). Shuning uchun panel 8 so‘zdan uzun matnni, salomlashuvdan boshlanmagan matnni («Assalomu alaykum», «Salom», «Xayrli kun» yoki ruscha salom) va havola, manzil, raqamlar, narx, foizlar, emoji yoki texnik so‘zlar bor matnni saqlamaydi. Ruscha salom kirill yozuvida, o‘zbekchasi lotin yozuvida yoziladi. Mijozga keyin qaysi tilda dumaloq video yoki xat ketishini salom matni emas, uning javobi hal qiladi. Salomni kim va qachon o‘zgartirgani — jurnalda.",
            ],
            admin: [
              "«Xat matnlari va A/B» tugmasi → **«Birinchi xabar»** bloki: bu yerda odatiy salom o‘rniga o‘z salomingizni berasiz — ruscha va o‘zbekcha, har birini alohida. **«Salomni saqlash»** tugmasini bosing — barcha menejerlar va avtoyurishning keyingi aloqalari shu salom bilan boshlanadi. Maydon bo‘sh bo‘lsa — odatiy salom ketadi: «Здравствуйте» yoki «Assalomu alaykum». Salomni siz va rahbar o‘zgartira olasiz; menejerlar nima ketayotganini ko‘radi, lekin o‘zgartira olmaydi.",
              "Sizning qoidangiz o‘z kuchida: birinchi bo‘lib xat emas, faqat salom ketadi — Telegram notanish odamlardan kelgan xatlarga «spam» shikoyatlari uchun akkauntlarni cheklaydi ([ikki bosqichli aloqa](#prospect-hello)). Shuning uchun panel 8 so‘zdan uzun matnni, salomlashuvdan boshlanmagan matnni («Assalomu alaykum», «Salom», «Xayrli kun» yoki ruscha salom) va havola, manzil, raqamlar, narx, foizlar, emoji yoki texnik so‘zlar bor matnni saqlamaydi. Ruscha salom kirill yozuvida, o‘zbekchasi lotin yozuvida yoziladi. Mijozga keyin qaysi tilda dumaloq video yoki xat ketishini salom matni emas, uning javobi hal qiladi. Salomni kim va qachon o‘zgartirgani — jurnalda.",
            ],
          },
        },
        {
          id: "after-reply",
          title: "Javobdan keyin nima ketadi: u haqida, narx oldinroq, e’tirozlarga javoblar",
          body: [
            "Egasi, 17.10.2026, sotuvlar tahlili bo‘yicha: dumaloq video olgan 188 kishidan 63 tasi javob berdi, qolganlari jim bo‘ldi; «+» ni 5 kishi yubordi; 30 kunda 41 ta maket, to‘lov 0. Videodan keyin «Какой сайт?», «Что значит прототип?» deb yozishdi, maketdan keyin «дорого», ko‘pincha esa «передам руководству». Shuning uchun «Здравствуйте» ga javobdan keyin aloqalarning yarmida yangi yondashuv, ikkinchi yarmida avvalgidek: yordam beradimi, shunda ko‘rinadi ([A/B](#prospect-sales-ab)).",
            "**Avtojavob javob emas.** «Мы отвечаем в рабочее время», «Ваше сообщение передано менеджеру», «Xabaringiz qabul qilindi» ni panel so‘zlardan taniydi: dumaloq video, xat va sun’iy intellekt ularga jim turadi, sizga qator kelmaydi, aloqa tirik javobni kutadi. Yozishmada bunday xabar ko‘rinadi, lekin «javob berdi» hisoblanmaydi. Bu yangi yarmigagina emas, barcha aloqalarga.",
            "**Videodan oldingi qator va soha videosi.** Dumaloq videodan bir necha soniya oldin bitta qator ketadi: «Это про ваш сайт clinic.uz, 40 секунд», o‘zbekchasi «Bu sizning saytingiz … haqida, 40 soniya». Manzil havolasiz va sayt rasmisiz, matn bilan. Sayt bo‘lmasa, bizda nima borligiga qarab xaritadagi kartochka yoki Instagramdagi sahifa haqida. Stomatologiyaga stomatologiya haqidagi video, mebelchiga mebel haqidagi video ketadi; soha videosi bo‘lmasa, umumiysi ketadi. Soha videolarini egasi va rahbar yozadi.",
            "**Narx oldinroq.** «+» dan so‘ng darhol, maket shartlari havolasi bilan birga bitta qator ketadi: «Maket bepul. Yoqsa, lending 500 $ dan, qismlarga bo‘lib to‘lash mumkin: yarmi boshlashda, yarmi ishga tushgandan keyin, hammasi ishlayotganda». Narx maketdan keyingi aksiyadagi bilan bir xil va faqat o‘sha yerda o‘zgaradi.",
            "**Sun’iy intellekt yozishmasida tayyor javoblar.** «Какой сайт?», «Бесплатно?», «Не перехожу по ссылкам», «Передам руководству», «Продаём через Инстаграм», «Сайт уже есть», «Дорого» ga sun’iy intellekt o‘zidan yozmaydi: tayyor matn ketadi. Shu matnlar sizda tugmalar bilan ham bor ([e’tirozlarga javoblar](#prospect-objections)).",
            "**2 kundan keyin savol.** «Передам руководству» deb yozib jim bo‘lishsa, ikki kundan keyin ish vaqtida (ish kunlari, 10:00–18:00) roppa-rosa bitta savol ketadi: «Rahbaringiz ko‘rib chiqishga ulgurdimi?». Mijoz javob bergan bo‘lsa yoki o‘zingiz yozgan bo‘lsangiz, savol ketmaydi. Bu «javob bermadi — hech narsa» qoidasidan yagona istisno: javobni odamning o‘zi va’da qilgan.",
            "**Sun’iy intellekt odamdek yozadi.** Uning javobi mijoz xabaridan kamida 40–120 soniyadan keyin ketadi, odam yozgandek. Maketgacha u bir-ikki qisqa gap, boshida «Отлично!» va «Конечно!» siz, ro‘yxatlarsiz. Bu tekshiruvdan o‘tmasa, ketmaydi va suhbat sizga o‘tadi. Bu barcha aloqalarga.",
            "**Havola o‘rniga ko‘rsatish.** Maket ketganda yangi yarmida aksiya shartlarida «15 daqiqada ko‘rsatib beraman: video orqali yoki oldingizga boraman» qatori bor. Rozi bo‘lsa, vaqtni siz kelishasiz.",
          ],
        },
        {
          id: "objections",
          title: "Lid kartochkasidagi «E’tirozlarga javoblar» tugmalari",
          body: [
            "Lid kartochkasi yozishmasidagi javob maydoni ostida **«E’tirozlarga javoblar»** bloki: «Qanday sayt? Bu nima?», «Bepulmi? Qayerda hiyla?», «Havola ochmayman», «Rahbarga yetkazaman», «Instagram orqali sotamiz», «Sayt bor», «Qimmat». Bosganingizda tayyor matn mijoz tilida (o‘zbekcha suhbatda o‘zbekcha), uning sayti manzili va sohasi so‘zlari bilan maydonga tushadi. Suhbatga moslab tuzating va «Yuborish» ni bosing. Tugmalar barcha aloqalarda bor.",
            "Matnlarda nima bor. «Дорого» ga: «Nima bilan solishtiryapsiz?» savoli, uning sohasida saytni nechta mijoz qoplashi va narxlar zinapoyasi: saytdagi 3 ta xatoni 2 kunda 150 $ ga tuzatamiz, sayt-vizitka 250 $, lending 500 $, korporativ sayt 1 000 $, to‘lov qismlarga: yarmi boshlashda, yarmi ishga tushgandan keyin. «Сайт уже есть» ga: 3 ta xatoni 150 $ ga tuzatish. «Передам руководству» ga: «Rahmat! Iltimos, unga yuborib qo‘ying» va yuborish qulay bo‘lgan uch qator. «Бесплатно?» ga: bu bizga nima uchun kerakligini ochiq aytamiz, ishni puldan oldin ko‘rsatish.",
            "Aloqalarning yangi yarmida yana **«Maket tayyor + ko‘rsatish»** tugmasi bor: «Maket tayyor:» (havolani qo‘ying) va «15 daqiqada ko‘rsatib beraman: video orqali yoki oldingizga boraman».",
          ],
        },
        {
          id: "sales-ab",
          title: "«Javobdan keyingi yangi yondashuv» bloki: A/B",
          body: [
            "«Xat matnlari va A/B» da **«Javobdan keyingi yangi yondashuv»** bloki aloqalarning ikki yarmini solishtiradi. Yarmi aloqaga birinchi salom paytida tasodifiy va teng beriladi: **«Avvalgidek»** — umumiy dumaloq video va avvalgi yozishma, **«Yangi yondashuv»** — [javobdan keyin nima ketadi](#prospect-after-reply) da yozilganlarning hammasi.",
            "Yarmilar bo‘yicha qatorlar: salom (nechta ketdi), tirik javob berdi (avtojavoblarsiz), videodan keyin javob berdi, «+», maket ketdi, to‘lov (lid «yutdik»). 17.10.2026 dan boshlab aloqalar hisoblanadi, oldingilari hisobga kirmaydi.",
            "Panel g‘olibni har bir yarmida kamida 100 ta salomdan keyin, «+» ulushi bo‘yicha aytadi: masalan, «Yangi yondashuv» «+» gacha ko‘proq olib boradi, ishonch 92%. Ungacha: aytishga erta. Yangi yondashuvni faqat kodda, bitta qator bilan o‘chirish mumkin; shunda blokda shunday yoziladi.",
          ],
        },
        {
          id: "fact-check",
          title: "Saytni fakt bo‘yicha tekshirish va oddiy til",
          body: [
            "Har bir xatdan oldin panel **saytni majburiy ravishda fakt bo‘yicha qayta tekshiradi** — bu egasining qoidasi. Avval u saytni xaridor telefondan qanday ochsa, xuddi shunday ochadi, keyingina odatdagi aylanib chiqishni bajaradi. Xatga faqat shu ikkinchi yuklashda takrorlangan narsa kiradi: «bosh sahifada telefon yo‘q», «pastki qismda eski yil», «bo‘limlar ochilmaydi». Buzilgan bo‘limlar va rasmlarni panel ularning manzillari bo‘yicha yana ochadi: ochilsa — topilma yo‘q. «Sayt ochilmaydi» faqat u ikki marta ham ochilmasa yoziladi. Shunday qilib xatga tasodifiy nosozlik yoki sayt robotga odamga qaraganda boshqacha ko‘rsatgan sahifa tushmaydi.",
            "Kartochkada xat ostida sana va vaqt bilan «Sayt xatdan oldin fakt bo‘yicha qayta tekshirildi: …» ko‘rinadi, biror narsa tasdiqlanmagan bo‘lsa — ro‘yxat bilan «Tasdiqlanmadi va xatga kirmadi:» qatori. Sayt ikkinchi marta umuman ochilmasa, xat bo‘lmaydi: panel saytni qayta tekshirib bo‘lmaganini yozadi — bir necha daqiqadan keyin «Bog‘lanish» tugmasini yana bosing. Hech narsa tasdiqlanmasa, egasiga yozadigan narsa yo‘q — kartochkani o‘tkazib yuborish yoki o‘zingiz yozish mumkin.",
            "Tekshiruv uch kun amal qiladi. Ilgari yoki bu qoidadan oldin yozilgan xatni panel yubormaydi: matn ostida «Sayt bu xatdan oldin fakt bo‘yicha qayta tekshirilmagan…» chiqadi, kartochkada esa yana «Bog‘lanish» paydo bo‘ladi — bosing, va xat saytdagi hozirgi holat bo‘yicha qaytadan yoziladi. Avvalgi matndagi tuzatishlaringiz saqlanmaydi — ularni qaytadan kiriting.",
            "Xat **oddiy, odamlar tilida** yoziladi: biznes egasi dasturchi emas. «500 xatosi» emas, «bo‘lim o‘rniga xato sahifasi ochiladi»; «sayt xaritasi yo‘q» emas, «Google barcha sahifalaringizni topmaydi». Xato kodlari, texnologiyalar nomlari (WordPress, Next.js va shunga o‘xshashlar), «server», «indeksatsiya», «sayt xaritasi», «SEO»ni tekshiruv xatda o‘tkazmaydi — matn ostida bu so‘zlar ro‘yxati chiqadi. Sahifa manzilini aytish mumkin: egasi u orqali o‘zi tekshiradi.",
          ],
        },
        {
          id: "proto-ahead",
          title: "Prototip oldindan: va’da o‘rniga xatda havola",
          body: [
            "**Hozir o‘chirilgan** (egasi, 07.10.2026: «hozircha faqat qo‘lda»): panel prototiplarni o‘zi yig‘maydi. Xat prototipni 12 soatda yig‘ishni va’da qiladi, uni esa odam yig‘adi — mijoz rozi bo‘lib, «🛠 Хотят прототип» kelganda ([mijozlar javoblari](#prospect-replies) bandi). Avval yig‘ilgan havolalar ham yangi xatlarga tushmaydi. Quyida — yig‘ish qayta yoqilganda qanday ishlashi. Xat tayyorlanayotganda — [kunlik to‘plam](#prospect-portion) bo‘yicha, «Получать лиды» oqimida yoki «Bog‘lanish» tugmasi bilan — panel kompaniyaga yangi sayt prototipini o‘zi yig‘adi. Nishalar: stomatologiya, o‘quv markazi, tibbiyot markazi, avtoservis, shinomontaj, avtomoyka, deteyling, barbershop, go‘zallik saloni, tirnoq studiyasi. Sahifadagi hamma narsa uning o‘z saytidan: nomi, tavsifi, telefoni, messenjerlari, logotipi, suratlari; xizmatlar — faqat uning saytida yozilganlari, har biri sayt bilan so‘zma-so‘z solishtirilgan. O‘zimizdan — birorta ham raqam, narx yoki xizmat yo‘q. Oldin yig‘ilganlari yopildi va olib tashlandi (egasi, 09.10.2026): eski havolada mijoz faqat parol so‘rovini ko‘radi, kartochkalarda ularning havolasi endi yo‘q. Mijozga prototip kerak bo‘lsa, uni odam yig‘adi.",
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
          title: "Ishchi akkaunt navbati: soatiga uch xat, 07:30 dan 20:30 gacha",
          body: {
            manager: [
              "Yangi kompaniyaga birinchi xatni ishchi akkaunt soatiga uchtadan ko‘p emas, 8–20 daqiqa tanaffus bilan va faqat Toshkent vaqti bilan 07:30 dan 20:30 gacha, har kuni yuboradi: tunda qo‘yilgan xat navbatda kutadi va ertalab birinchi bo‘lib ketadi. Javob berganlar bilan yozishma istalgan vaqtda va chegarasiz boradi. Aks holda Telegram bizni ommaviy tarqatma deb hisoblab, akkauntni cheklaydi — skaut esa chatlarni aynan shu akkaunt bilan o‘qiydi, va biz ikkala kanalni birdan yo‘qotardik.",
              "Ro‘yxat ustida: «Oxirgi soatda 3 tadan 1 tasi ketdi · navbatda 3 ta · oxirgisi bugun taxminan 15:40 da ketadi». Navbatdagi kartochkada — taxminan qachon ketishi (batafsil — quyida). Ishchi akkauntlar bir nechta bo‘lishi mumkin — har birining o‘z «soatiga uch»i bor, unda ikkinchi raqam kattaroq bo‘ladi: hammasidan birga soatiga shuncha birinchi xat ketadi. Xat qaysi akkauntda joy oldinroq bo‘shasa, o‘shandan ketadi; agar rahbar sizni ma’lum akkauntlarda belgilagan bo‘lsa — faqat ulardan: shunda mijozga ortida siz turgan raqamdan yoziladi. Javoblar va tuzatishlar — birinchi xat ketgan akkauntdan.",
              "**Xat qachon ketadi.** Navbatdagi kartochkada Toshkent vaqti bilan vaqt yozilgan: «bugun taxminan 14:20 da ketadi», «ertaga taxminan 08:10 da» va undan oldin nechta xat turgani. U ishchi akkaunt navbatni qanday olsa, xuddi shunday hisoblanadi: oldinda nechta xat turibdi, har bir akkaunt oxirgi soatda nechta yuborib bo‘ldi, xatlar orasidagi tanaffus, 07:30–20:30 oralig‘i va bu xatni qaysi akkauntlardan yuborish mumkin. Vaqt taxminiy, chorak soat u yoki bu yoqqa: xatlar orasidagi tanaffus har safar tasodifiy. Lekin tartib to‘g‘ri — xat yo‘qolmagan, o‘z daqiqasini kutmoqda. Ro‘yxat ustida — butun navbatning oxirgi xati qachon ketishi. «Yuborish: …» bosilgandan so‘ng darhol xuddi shu vaqt tepadagi yashil plashkada yoziladi, Telegramda esa — «📤 Отправить через бота»dan keyin kompaniya kartochkasi ostidagi tugmada: «📤 В очереди · уйдёт сегодня около 14:20». Ketdi — kartochkada «yuborildi» va vaqt paydo bo‘ladi.",
              "**«Telegram … gacha cheklagan».** Agar Telegram xat ketishi mumkin bo‘lgan ishchi akkauntni cheklagan bo‘lsa (odatda bir sutkaga — notanish odamlarga juda ko‘p birinchi xat uchun), xat endi navbatni emas, akkauntning o‘zini kutadi. Shunda kartochkada sariq rangda: «Bu xat ketishi mumkin bo‘lgan ishchi akkauntni Telegram Toshkent vaqti bilan 08.10 13:07 gacha cheklagan — undan oldin ketmaydi», yuborish vaqti esa — shu soatdan keyin. Telegramda «📤 Отправить через бота»dan keyin bu haqda alohida xabar keladi. Kutish shart emas — mijozga o‘zingiz yozing va **«O‘zim bog‘landim»** tugmasini bosing. «Bu xatni hozir birorta ishchi akkaunt olmaydi» deb yozilgan bo‘lsa — siz faqat o‘chirilgan akkauntlarda belgilangansiz: o‘zingiz yozing va rahbardan sizni ishlayotgan akkauntga qo‘shishni so‘rang. Tekshiruv har soatda o‘zi o‘tadi: har bir ishchi akkaunt @SpamBot’dan — akkaunt cheklanganmi va qachongacha, deb javob beradigan Telegram xizmatidan — so‘raydi. Hozir bu tekshiruv egasining so‘zi bilan o‘chirilgan (03.11.2026 dan): cheklov haqida faqat Telegram yuborishni rad etganda bilamiz. Cheklov topilsa, bot bu haqda butun jamoaga yozadi: qaysi akkaunt, soat nechagacha, nechta xat va kimning xatlari kutmoqda; cheklov olib tashlansa — «снова пишет» deb yozadi.",
              "Kutish shart emas: yozishmani o‘z akkauntingizdan oching, o‘sha matnni yuboring va **«O‘zim bog‘landim»** tugmasini bosing — bot o‘z nusxasini endi yubormaydi. Studiyaning ishchi akkauntidan yozgan bo‘lsangiz, mijoz javobini bot o‘zi ko‘radi va yozishmani shu akkauntdan davom ettiradi; shaxsiy akkauntdan yozgan bo‘lsangiz — javob shaxsan sizga keladi.",
              "**Egasining xatlari navbatsiz ketadi**: boshqalarning xatlarini ham, «soatiga uch»ni ham, 8–20 daqiqa tanaffusni ham kutmaydi — oldingi har qanday yuborishdan bir daqiqa o‘tib ketadi, lekin ular ham faqat 07:30 dan 20:30 gacha. «Soatiga uch»ga ular baribir kiradi: cheklov akkaunt haqida, va bunday xatdan keyin qolganlar kutishiga to‘g‘ri keladi. Bunday kartochkada «Egasining xati — navbatsiz» deb yozilgan.",
            ],
            head: [
              "Yangi kompaniyaga birinchi xatni ishchi akkaunt soatiga uchtadan ko‘p emas, 8–20 daqiqa tanaffus bilan va faqat Toshkent vaqti bilan 07:30 dan 20:30 gacha, har kuni yuboradi: tunda qo‘yilgan xat navbatda kutadi va ertalab birinchi bo‘lib ketadi. Javob berganlar bilan yozishma istalgan vaqtda va chegarasiz boradi. Aks holda Telegram bizni ommaviy tarqatma deb hisoblab, akkauntni cheklaydi — skaut esa chatlarni aynan shu akkaunt bilan o‘qiydi, va biz ikkala kanalni birdan yo‘qotardik.",
              "Ro‘yxat ustida: «Oxirgi soatda 3 tadan 1 tasi ketdi · navbatda 3 ta · oxirgisi bugun taxminan 15:40 da ketadi». Navbatdagi kartochkada — taxminan qachon ketishi (batafsil — quyida). Ishchi akkauntlar bir nechta bo‘lishi mumkin — har birining o‘z «soatiga uch»i bor, unda ikkinchi raqam kattaroq bo‘ladi: hammasidan birga soatiga shuncha birinchi xat ketadi. Xat qaysi akkauntda joy oldinroq bo‘shasa, o‘shandan ketadi. Kim qaysi akkauntlardan yozishini siz yoki egasi [Akkauntlar](/admin/accounts) bo‘limida belgilaysiz — [akkauntda kim ishlaydi](#accounts-staff) bandi: belgilangan menejer faqat o‘z akkauntlaridan yozadi, belgilanmagani — istalganidan. Sizning o‘z xatlaringiz ham shu qoidalar bo‘yicha ketadi. Javoblar va tuzatishlar — birinchi xat ketgan akkauntdan.",
              "**Xat qachon ketadi.** Navbatdagi kartochkada Toshkent vaqti bilan vaqt yozilgan: «bugun taxminan 14:20 da ketadi», «ertaga taxminan 08:10 da» va undan oldin nechta xat turgani. U ishchi akkaunt navbatni qanday olsa, xuddi shunday hisoblanadi: oldinda nechta xat turibdi, har bir akkaunt oxirgi soatda nechta yuborib bo‘ldi, xatlar orasidagi tanaffus, 07:30–20:30 oralig‘i va bu xatni qaysi akkauntlardan yuborish mumkin. Vaqt taxminiy, chorak soat u yoki bu yoqqa: xatlar orasidagi tanaffus har safar tasodifiy. Lekin tartib to‘g‘ri — xat yo‘qolmagan, o‘z daqiqasini kutmoqda. Ro‘yxat ustida — butun navbatning oxirgi xati qachon ketishi. «Yuborish: …» bosilgandan so‘ng darhol xuddi shu vaqt tepadagi yashil plashkada yoziladi, Telegramda esa — «📤 Отправить через бота»dan keyin kompaniya kartochkasi ostidagi tugmada: «📤 В очереди · уйдёт сегодня около 14:20». Ketdi — kartochkada «yuborildi» va vaqt paydo bo‘ladi.",
              "**«Telegram … gacha cheklagan».** Agar Telegram xat ketishi mumkin bo‘lgan ishchi akkauntni cheklagan bo‘lsa (odatda bir sutkaga — notanish odamlarga juda ko‘p birinchi xat uchun), xat endi navbatni emas, akkauntning o‘zini kutadi. Shunda kartochkada sariq rangda: «Bu xat ketishi mumkin bo‘lgan ishchi akkauntni Telegram Toshkent vaqti bilan 08.10 13:07 gacha cheklagan — undan oldin ketmaydi», yuborish vaqti esa — shu soatdan keyin. Telegramda «📤 Отправить через бота»dan keyin bu haqda alohida xabar keladi. Kutish shart emas — mijozga o‘zingiz yozing va **«O‘zim bog‘landim»** tugmasini bosing. «Bu xatni hozir birorta ishchi akkaunt olmaydi» deb yozilgan bo‘lsa — muallif faqat o‘chirilgan akkauntlarda belgilangan. Menejerning xatlari cheklangan akkauntni kutmasligi uchun uni yana bitta, ishlayotgan akkauntda [Akkauntlar](/admin/accounts) bo‘limida belgilang — [akkauntda kim ishlaydi](#accounts-staff) bandi: xat qaysi akkauntda joy oldinroq bo‘shasa, o‘shandan ketadi. Tekshiruv har soatda o‘zi o‘tadi: har bir ishchi akkaunt @SpamBot’dan — akkaunt cheklanganmi va qachongacha, deb javob beradigan Telegram xizmatidan — so‘raydi. Hozir bu tekshiruv egasining so‘zi bilan o‘chirilgan (03.11.2026 dan): cheklov haqida faqat Telegram yuborishni rad etganda bilamiz. Cheklov topilsa, bot bu haqda butun jamoaga yozadi: qaysi akkaunt, soat nechagacha, nechta xat va kimning xatlari kutmoqda; cheklov olib tashlansa — «снова пишет» deb yozadi.",
              "Kutish shart emas: yozishmani o‘z akkauntingizdan oching, o‘sha matnni yuboring va **«O‘zim bog‘landim»** tugmasini bosing — bot o‘z nusxasini endi yubormaydi. Studiyaning ishchi akkauntidan yozgan bo‘lsangiz, mijoz javobini bot o‘zi ko‘radi va yozishmani shu akkauntdan davom ettiradi; shaxsiy akkauntdan yozgan bo‘lsangiz — javob shaxsan sizga keladi.",
              "**Egasining xatlari navbatsiz ketadi**: boshqalarning xatlarini ham, «soatiga uch»ni ham, 8–20 daqiqa tanaffusni ham kutmaydi — oldingi har qanday yuborishdan bir daqiqa o‘tib ketadi, lekin ular ham faqat 07:30 dan 20:30 gacha. «Soatiga uch»ga ular baribir kiradi: cheklov akkaunt haqida, va bunday xatdan keyin qolganlar kutishiga to‘g‘ri keladi. Bunday kartochkada «Egasining xati — navbatsiz» deb yozilgan.",
            ],
            admin: [
              "Yangi kompaniyaga birinchi xatni ishchi akkaunt soatiga uchtadan ko‘p emas, 8–20 daqiqa tanaffus bilan va faqat Toshkent vaqti bilan 07:30 dan 20:30 gacha, har kuni yuboradi: tunda qo‘yilgan xat navbatda kutadi va ertalab birinchi bo‘lib ketadi. Javob berganlar bilan yozishma istalgan vaqtda va chegarasiz boradi. Aks holda Telegram bizni ommaviy tarqatma deb hisoblab, akkauntni cheklaydi — skaut esa chatlarni aynan shu akkaunt bilan o‘qiydi, va biz ikkala kanalni birdan yo‘qotardik.",
              "Ro‘yxat ustida: «Oxirgi soatda 3 tadan 1 tasi ketdi · navbatda 3 ta · oxirgisi bugun taxminan 15:40 da ketadi». Navbatdagi kartochkada — taxminan qachon ketishi (batafsil — quyida). Ishchi akkauntlar bir nechta bo‘lishi mumkin — har birining o‘z «soatiga uch»i bor, unda ikkinchi raqam kattaroq bo‘ladi: hammasidan birga soatiga shuncha birinchi xat ketadi. Xat qaysi akkauntda joy oldinroq bo‘shasa, o‘shandan ketadi. Kim qaysi akkauntlardan yozishini siz yoki rahbar [Akkauntlar](/admin/accounts) bo‘limida belgilaysiz — [akkauntda kim ishlaydi](#accounts-staff) bandi: belgilangan xodim faqat o‘z akkauntlaridan yozadi, belgilanmagani — istalganidan. Javoblar va tuzatishlar — birinchi xat ketgan akkauntdan.",
              "**Xat qachon ketadi.** Navbatdagi kartochkada Toshkent vaqti bilan vaqt yozilgan: «bugun taxminan 14:20 da ketadi», «ertaga taxminan 08:10 da» va undan oldin nechta xat turgani. U ishchi akkaunt navbatni qanday olsa, xuddi shunday hisoblanadi: oldinda nechta xat turibdi, har bir akkaunt oxirgi soatda nechta yuborib bo‘ldi, xatlar orasidagi tanaffus, 07:30–20:30 oralig‘i va bu xatni qaysi akkauntlardan yuborish mumkin. Vaqt taxminiy, chorak soat u yoki bu yoqqa: xatlar orasidagi tanaffus har safar tasodifiy. Lekin tartib to‘g‘ri — xat yo‘qolmagan, o‘z daqiqasini kutmoqda. Ro‘yxat ustida — butun navbatning oxirgi xati qachon ketishi. «Yuborish: …» bosilgandan so‘ng darhol xuddi shu vaqt tepadagi yashil plashkada yoziladi, Telegramda esa — «📤 Отправить через бота»dan keyin kompaniya kartochkasi ostidagi tugmada: «📤 В очереди · уйдёт сегодня около 14:20». Ketdi — kartochkada «yuborildi» va vaqt paydo bo‘ladi.",
              "**«Telegram … gacha cheklagan».** Agar Telegram xat ketishi mumkin bo‘lgan ishchi akkauntni cheklagan bo‘lsa (odatda bir sutkaga — notanish odamlarga juda ko‘p birinchi xat uchun), xat endi navbatni emas, akkauntning o‘zini kutadi. Shunda kartochkada sariq rangda: «Bu xat ketishi mumkin bo‘lgan ishchi akkauntni Telegram Toshkent vaqti bilan 08.10 13:07 gacha cheklagan — undan oldin ketmaydi», yuborish vaqti esa — shu soatdan keyin. Telegramda «📤 Отправить через бота»dan keyin bu haqda alohida xabar keladi. Kutish shart emas — mijozga o‘zingiz yozing va **«O‘zim bog‘landim»** tugmasini bosing. «Bu xatni hozir birorta ishchi akkaunt olmaydi» deb yozilgan bo‘lsa — muallif faqat o‘chirilgan akkauntlarda belgilangan. Menejerning xatlari cheklangan akkauntni kutmasligi uchun uni yana bitta, ishlayotgan akkauntda [Akkauntlar](/admin/accounts) bo‘limida belgilang — [akkauntda kim ishlaydi](#accounts-staff) bandi: xat qaysi akkauntda joy oldinroq bo‘shasa, o‘shandan ketadi. Tekshiruv har soatda o‘zi o‘tadi: har bir ishchi akkaunt @SpamBot’dan — akkaunt cheklanganmi va qachongacha, deb javob beradigan Telegram xizmatidan — so‘raydi. Hozir bu tekshiruv egasining so‘zi bilan o‘chirilgan (03.11.2026 dan): cheklov haqida faqat Telegram yuborishni rad etganda bilamiz. Cheklov topilsa, bot bu haqda butun jamoaga yozadi: qaysi akkaunt, soat nechagacha, nechta xat va kimning xatlari kutmoqda; cheklov olib tashlansa — «снова пишет» deb yozadi.",
              "Kutish shart emas: yozishmani o‘z akkauntingizdan oching, o‘sha matnni yuboring va **«O‘zim bog‘landim»** tugmasini bosing — bot o‘z nusxasini endi yubormaydi. Studiyaning ishchi akkauntidan yozgan bo‘lsangiz, mijoz javobini bot o‘zi ko‘radi va yozishmani shu akkauntdan davom ettiradi; shaxsiy akkauntdan yozgan bo‘lsangiz — javob shaxsan sizga keladi.",
              "**Sizning xatlaringiz navbatsiz ketadi**: jamoaning xatlarini ham, «soatiga uch»ni ham, 8–20 daqiqa tanaffusni ham kutmaydi — oldingi har qanday yuborishdan bir daqiqa o‘tib ketadi, lekin ular ham faqat 07:30 dan 20:30 gacha. «Soatiga uch»ga ular baribir kiradi: cheklov akkaunt haqida, va xatingizdan keyin jamoa kutishiga to‘g‘ri keladi. Bunday kartochkada «Egasining xati — navbatsiz» deb yozilgan.",
            ],
          },
        },
        {
          id: "self",
          title: "«O‘zim bog‘landim» (Telegramda — «Написал сам»)",
          body: [
            "O‘zingiz yozganingiz yoki qo‘ng‘iroq qilganingizda bosing — o‘z akkauntingizdan, WhatsApp orqali, telefonda. Maydonga qisqacha: nima orqali va qanday («shaxsiy Telegram», «qo‘ng‘iroq»).",
            "Nima bo‘ladi: aloqa sizga hisoblanadi, sizga lid ochiladi, kartochka «yuborildi» bo‘ladi va ikkinchi hamkasb o‘sha odamga endi yozmaydi. Belgisiz bularning hech biri yo‘q: panel uchun siz hech kimga yozmagansiz.",
            "Keyingisi qayerdan yozganingizga bog‘liq. **Studiyaning ishchi akkauntidan** (telefoningizdagi Telegramda ishlaydigan akkaunt): mijoz javob berishi bilan bot uni kartochkadagi @manzil yoki raqam bo‘yicha taniydi, yozishmani shu akkauntga o‘tkazadi va o‘sha yerdan davom ettiradi — oddiy aloqadagidek, sizga esa «Клиент ответил на рабочий аккаунт студии…» xabari keladi. Bot mijozni faqat kartochkadagi manzil yoki raqam uning Telegrami bilan mos kelsa taniy oladi: raqam bo‘yicha yozgan bo‘lsangiz, raqamni ishchi akkaunt kontaktlariga qo‘shing — shunda Telegram uni ko‘rsatadi. Yozishmani o‘zingizga olish — lid kartochkasidagi «O‘zim javob beraman». **Shaxsiy akkauntdan, WhatsApp’da yoki qo‘ng‘iroq orqali** bo‘lsa, yozishma siz orqali boradi: bot qayta yozmaydi va javoblarni ko‘rmaydi. Mijoz javobini kartochkaga ko‘chirish mumkin — [qo‘lda yozish](#prospect-manual) bandi.",
          ],
        },
        {
          id: "write-myself",
          title: "«O‘zim yozaman — yubormang»: xatlarni bot navbatidan olish",
          body: {
            manager: [
              "**Telegramda — kompaniya kartochkasi ostida.** «📤 Отправить через бота»dan keyin, xat navbatda kutib turganda, kartochka ostida «✋ Напишу сам — не отправлять» tugmasi turadi. Bosdingiz — bot bu xatni endi yubormaydi, tugmada «✋ Снято с очереди · пишете сами» paydo bo‘ladi, pastda esa xabar keladi: kimga yozish, xat matni (ustiga bosing — nusxalanadi) va Telegram yoki WhatsApp’da yozishmani tayyor matn bilan ochadigan tugma. Tugma ertasi kuni ham ishlaydi: cheklangan akkauntni kutayotgan xatni u ketmaguncha istalgan paytda olish mumkin. Kechikdingiz va bot yuborib ulgurdi — tugma «📤 Бот уже отправил это письмо» deydi: ikkinchi marta yozish shart emas.",
              "**Panelda — bir nechtasini birdan.** «Sovuq aloqalar»da ro‘yxat ustida «O‘zim yozaman — yubormang» va «Hammasini belgilash» tugmalari bilan sariq blok paydo bo‘ladi, navbatdagi har bir xatingizda esa — «O‘zim yozaman» belgisi. Keraklilarini belgilang va tugmani bosing: bot ulardan birortasini ham yubormaydi, yuqorida esa nechtasi olingani va nechtasini bot oldinroq yuborib ulgurgani chiqadi. Telegram ishchi akkauntni cheklab qo‘ygan va xatlaringiz uni ertagacha kutayotganda qulay (batafsil — [ishchi akkaunt navbati](#prospect-queue) bandida). Boshqalarning xatlarida belgi yo‘q: ularni muallif, rahbar yoki egasi oladi.",
              "Keyin hammasi [«O‘zim bog‘landim»](#prospect-self)dan keyingidek: kartochka «yuborildi» bo‘ladi, aloqa va lid — sizniki. Mijozga o‘zingiz yozasiz — o‘z akkauntingizdan, WhatsApp orqali yoki qo‘ng‘iroq bilan. Javob shaxsan sizga keladi: uni kartochkaga ko‘chiring — «Mijoz nima deb javob berdi» maydoniga, va SI nima deb javob berishni aytib beradi ([qo‘lda yozish](#prospect-manual) bandi).",
            ],
            head: [
              "**Telegramda — kompaniya kartochkasi ostida.** «📤 Отправить через бота»dan keyin, xat navbatda kutib turganda, kartochka ostida «✋ Напишу сам — не отправлять» tugmasi turadi. Bosdingiz — bot bu xatni endi yubormaydi, tugmada «✋ Снято с очереди · пишете сами» paydo bo‘ladi, pastda esa xabar keladi: kimga yozish, xat matni (ustiga bosing — nusxalanadi) va Telegram yoki WhatsApp’da yozishmani tayyor matn bilan ochadigan tugma. Tugma ertasi kuni ham ishlaydi: cheklangan akkauntni kutayotgan xatni u ketmaguncha istalgan paytda olish mumkin. Kechikdingiz va bot yuborib ulgurdi — tugma «📤 Бот уже отправил это письмо» deydi: ikkinchi marta yozish shart emas.",
              "**Panelda — bir nechtasini birdan.** «Sovuq aloqalar»da ro‘yxat ustida «O‘zim yozaman — yubormang» va «Hammasini belgilash» tugmalari bilan sariq blok paydo bo‘ladi, «O‘zim yozaman» belgisi esa navbatdagi har bir xatda turadi — sizniki, menejerlaringizniki va avtomatik aloqalarniki. Keraklilarini belgilang va tugmani bosing: bot ulardan birortasini ham yubormaydi, yuqorida esa nechtasi olingani va nechtasini bot oldinroq yuborib ulgurgani chiqadi. Aloqa tugmani bosgan odamga — mijozga yozadigan odamga yoziladi. Shuning uchun menejer xatini faqat o‘zingiz yozsangiz oling; uning xatlari cheklangan akkauntni kutmasligi uchun yaxshisi uni [Akkauntlar](/admin/accounts) bo‘limida yana bitta, ishlayotgan akkauntda belgilang.",
              "Keyin hammasi [«O‘zim bog‘landim»](#prospect-self)dan keyingidek: kartochka «yuborildi» bo‘ladi, aloqa — sizniki, lid esa xatni navbatga qo‘ygan odamda qoladi (avtomatik aloqalar xatida lid — sizniki). Mijozga o‘zingiz yozasiz — o‘z akkauntingizdan, WhatsApp orqali yoki qo‘ng‘iroq bilan. Javob shaxsan sizga keladi: uni kartochkaga ko‘chiring — «Mijoz nima deb javob berdi» maydoniga, va SI nima deb javob berishni aytib beradi ([qo‘lda yozish](#prospect-manual) bandi).",
            ],
            admin: [
              "**Telegramda — kompaniya kartochkasi ostida.** «📤 Отправить через бота»dan keyin, xat navbatda kutib turganda, kartochka ostida «✋ Напишу сам — не отправлять» tugmasi turadi. Bosdingiz — bot bu xatni endi yubormaydi, tugmada «✋ Снято с очереди · пишете сами» paydo bo‘ladi, pastda esa xabar keladi: kimga yozish, xat matni (ustiga bosing — nusxalanadi) va Telegram yoki WhatsApp’da yozishmani tayyor matn bilan ochadigan tugma. Tugma ertasi kuni ham ishlaydi: cheklangan akkauntni kutayotgan xatni u ketmaguncha istalgan paytda olish mumkin. Kechikdingiz va bot yuborib ulgurdi — tugma «📤 Бот уже отправил это письмо» deydi: ikkinchi marta yozish shart emas.",
              "**Panelda — bir nechtasini birdan.** «Sovuq aloqalar»da ro‘yxat ustida «O‘zim yozaman — yubormang» va «Hammasini belgilash» tugmalari bilan sariq blok paydo bo‘ladi, «O‘zim yozaman» belgisi esa navbatdagi har bir xatda turadi — sizniki, menejerlarniki va avtomatik aloqalarniki. Keraklilarini belgilang va tugmani bosing: bot ulardan birortasini ham yubormaydi, yuqorida esa nechtasi olingani va nechtasini bot oldinroq yuborib ulgurgani chiqadi. Aloqa tugmani bosgan odamga — mijozga yozadigan odamga yoziladi. Shuning uchun menejer xatini faqat o‘zingiz yozsangiz oling; uning xatlari cheklangan akkauntni kutmasligi uchun yaxshisi uni [Akkauntlar](/admin/accounts) bo‘limida yana bitta, ishlayotgan akkauntda belgilang.",
              "Keyin hammasi [«O‘zim bog‘landim»](#prospect-self)dan keyingidek: kartochka «yuborildi» bo‘ladi, aloqa — sizniki, lid esa xatni navbatga qo‘ygan odamda qoladi (avtomatik aloqalar xatida lid — sizniki). Mijozga o‘zingiz yozasiz — o‘z akkauntingizdan, WhatsApp orqali yoki qo‘ng‘iroq bilan. Javob shaxsan sizga keladi: uni kartochkaga ko‘chiring — «Mijoz nima deb javob berdi» maydoniga, va SI nima deb javob berishni aytib beradi ([qo‘lda yozish](#prospect-manual) bandi).",
            ],
          },
        },
        {
          id: "bot-edit",
          title: "«✏️ Изменить текст»: xatni to‘g‘ridan-to‘g‘ri botda tuzatish",
          body: {
            manager: [
              "Telegramdagi kompaniya kartochkasi ostida — [kunlik ulush](#prospect-portion)da ham, [oqim](#prospect-stream)da ham — kartochkada xat matni bo‘lsa, **«✏️ Изменить текст»** tugmasi bor. Bosing — bot hozirgi matnni yuboradi (ustiga bosing — nusxalanadi) va shu xabarga javob oynasini ochadi. Nusxani tuzating va uni **bot xabariga javob qilib** yuboring — alohida xabar emas: bot matn qaysi kartochkaga tegishli ekanini javobdan biladi. So‘rov bir sutka amal qiladi, keyin tugmani yana bosing.",
              "Bot matnni panel yuborishdan oldin tekshirgandek tekshiradi: sayt haqidagi xat — [birinchi xat](#prospect-send) qoidalari bo‘yicha (12 dan 100 tagacha so‘z, lotin yozuvida — 130 gacha, salomlashuvsiz, texnik so‘zlarsiz va sayt tekshiruvida bo‘lmagan raqamlarsiz), sayti yo‘q kompaniya xati — o‘z qoidalari bo‘yicha. O‘tdi — matn kartochkada saqlanadi va bot uni o‘sha tugmalar bilan qaytadan yuboradi: «📤 Отправить через бота» endi yangi matnni yuboradi. O‘tmadi — bot nimani tuzatish kerakligini sanab beradi, kartochka esa avvalgidek qoladi.",
              "Tugma «📤 Отправить через бота»dan keyin ham bor, xat mijozning «Здравствуйте»ga javobini kutib turganda: tuzatilgani endi yangi holda ketadi. Xat allaqachon mijozda bo‘lsa — bot uni o‘sha ishchi akkauntdan tuzatadi, [paneldagi «Tuzatish»](#prospect-edit-sent) kabi. «Здравствуйте»ning o‘zi tuzatilmaydi.",
              "O‘z kartochkangizni — bugungi ulush yoki oqimingizdagisini — va navbatdagi o‘z xatingizni tuzatish mumkin. Boshqa odamning so‘roviga yoki xati allaqachon ketgan yoki yopilgan kartochkaga javobni bot xushmuomalalik bilan qabul qilmaydi. Kim nimani tuzatgani — jurnalda.",
            ],
            head: [
              "Telegramdagi kompaniya kartochkasi ostida — [kunlik ulush](#prospect-portion)da ham, [oqim](#prospect-stream)da ham — kartochkada xat matni bo‘lsa, **«✏️ Изменить текст»** tugmasi bor. Bosing — bot hozirgi matnni yuboradi (ustiga bosing — nusxalanadi) va shu xabarga javob oynasini ochadi. Nusxani tuzating va uni **bot xabariga javob qilib** yuboring — alohida xabar emas: bot matn qaysi kartochkaga tegishli ekanini javobdan biladi. So‘rov bir sutka amal qiladi, keyin tugmani yana bosing.",
              "Bot matnni panel yuborishdan oldin tekshirgandek tekshiradi: sayt haqidagi xat — [birinchi xat](#prospect-send) qoidalari bo‘yicha (12 dan 100 tagacha so‘z, lotin yozuvida — 130 gacha, salomlashuvsiz, texnik so‘zlarsiz va sayt tekshiruvida bo‘lmagan raqamlarsiz), sayti yo‘q kompaniya xati — o‘z qoidalari bo‘yicha. O‘tdi — matn kartochkada saqlanadi va bot uni o‘sha tugmalar bilan qaytadan yuboradi: «📤 Отправить через бота» endi yangi matnni yuboradi. O‘tmadi — bot nimani tuzatish kerakligini sanab beradi, kartochka esa avvalgidek qoladi.",
              "Tugma «📤 Отправить через бота»dan keyin ham bor, xat mijozning «Здравствуйте»ga javobini kutib turganda: tuzatilgani endi yangi holda ketadi. Xat allaqachon mijozda bo‘lsa — bot uni o‘sha ishchi akkauntdan tuzatadi, [paneldagi «Tuzatish»](#prospect-edit-sent) kabi. «Здравствуйте»ning o‘zi tuzatilmaydi.",
              "Istalgan kartochkani va navbatdagi istalgan xatni — o‘zingiznikini, menejerlarnikini va avtomatik aloqalarnikini — tuzatish mumkin, xuddi uni navbatdan olish kabi. Boshqa odamning so‘roviga yoki xati allaqachon ketgan yoki yopilgan kartochkaga javobni bot xushmuomalalik bilan qabul qilmaydi. Kim nimani tuzatgani — jurnalda: avvalgi va yangi matn kartochkada saqlanadi.",
            ],
            admin: [
              "Telegramdagi kompaniya kartochkasi ostida — [kunlik ulush](#prospect-portion)da ham, oqimda ham — kartochkada xat matni bo‘lsa, **«✏️ Изменить текст»** tugmasi bor. Bosing — bot hozirgi matnni yuboradi (ustiga bosing — nusxalanadi) va shu xabarga javob oynasini ochadi. Nusxani tuzating va uni **bot xabariga javob qilib** yuboring — alohida xabar emas: bot matn qaysi kartochkaga tegishli ekanini javobdan biladi. So‘rov bir sutka amal qiladi, keyin tugmani yana bosing.",
              "Bot matnni panel yuborishdan oldin tekshirgandek tekshiradi: sayt haqidagi xat — [birinchi xat](#prospect-send) qoidalari bo‘yicha (12 dan 100 tagacha so‘z, lotin yozuvida — 130 gacha, salomlashuvsiz, texnik so‘zlarsiz va sayt tekshiruvida bo‘lmagan raqamlarsiz), sayti yo‘q kompaniya xati — o‘z qoidalari bo‘yicha. O‘tdi — matn kartochkada saqlanadi va bot uni o‘sha tugmalar bilan qaytadan yuboradi: «📤 Отправить через бота» endi yangi matnni yuboradi. O‘tmadi — bot nimani tuzatish kerakligini sanab beradi, kartochka esa avvalgidek qoladi.",
              "Tugma «📤 Отправить через бота»dan keyin ham bor, xat mijozning «Здравствуйте»ga javobini kutib turganda: tuzatilgani endi yangi holda ketadi. Xat allaqachon mijozda bo‘lsa — bot uni o‘sha ishchi akkauntdan tuzatadi, [paneldagi «Tuzatish»](#prospect-edit-sent) kabi. «Здравствуйте»ning o‘zi tuzatilmaydi.",
              "Istalgan kartochkani va navbatdagi istalgan xatni — o‘zingiznikini, menejerlarnikini va avtomatik aloqalarnikini — tuzatish mumkin, xuddi uni navbatdan olish kabi. Boshqa odamning so‘roviga yoki xati allaqachon ketgan yoki yopilgan kartochkaga javobni bot xushmuomalalik bilan qabul qilmaydi. Kim nimani tuzatgani — jurnalda: avvalgi va yangi matn kartochkada saqlanadi.",
            ],
          },
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
            "**Rad etishni** («yozmang», «qiziq emas», «yo‘q, rahmat») model muhokama qilmaydi va sizni chaqirmaydi: 23.10.2026 dan aloqa o‘zi «mijoz rad etdi» deb yopiladi, mijozga boshqa hech narsa ketmaydi, rad etish esa [Bosh sahifa](/admin/hq)da «7 kunda rad etishlar» qatorida hisoblanadi. Model **sizni chaqiradi**, agar mijoz: odam yoki qo‘ng‘iroq so‘rasa; **tahlil, tijoriy taklif, smeta yoki fayl yuborishni so‘rasa** — unda o‘sha kuniyoq o‘zingiz yuboring; **prototip istasa** («ha, yig‘ib bering», «да, соберите») — unda aloqa muallifiga «🛠 Беру прототип» tugmasi bilan «🛠 Хотят прототип» keladi: **birinchi 30 daqiqa** prototip faqat unda. Yarim soatda olmasa — **butun jamoaga** xuddi shu tugma bilan «🔥 Нужен прототип — бери срочно» ketadi (08:00 dan 21:00 gacha; tunda so‘rasa — 08:00 da ketadi): kim birinchi bossa, lid va yozishma o‘shaniki, boshqalarda tugma olgan odam ismi bilan o‘chadi; prototipni qo‘lda yig‘ib, mijozga havolani yuborish — 12 soat ichida, xatda va’da qilinganidek, muddatdan 2 soat oldin eslatma o‘zi qo‘yiladi; mijozga esa o‘zi «maket tayyorlayapmiz» javobi maketni taqdim etish shartlariga havola bilan (devuz.studio/uz/mockup-terms) ketadi — mijoz ularni yozishmani davom ettirib yoki maketni olib qabul qiladi, havolani qayta yuborish shart emas; yozishma Telegramda bo‘lmasa, bu javob aloqa kartochkasida kutadi — uni o‘zingiz yuboring; qisqa va tushunarsiz javob bersa. Yana — suhbat 12 replikadan beri davom etib, kelishuvga kelmasa yoki uning javobi tekshiruvdan o‘tmasa. Xatda allaqachon [oldindan yig‘ilgan prototipga](#prospect-proto-ahead) havola bo‘lgan bo‘lsa, javobdagi «прототип» so‘zi «ko‘rdim» degani: model sizni «ответил про прототип, который ушёл в письме» sababi bilan chaqiradi, butun jamoaga «Нужен прототип» ketmaydi. Tunda bot jim (23.10.2026 dan): model mijozlarga faqat Toshkent vaqti bilan 08:00 dan 21:00 gacha va faqat bir kundan eski bo‘lmagan xabarlarga javob beradi, mijozlar tunda aloqalaringiz bo‘yicha yozgani esa sizga 08:00 da bitta «🌙 Ночью ответили клиенты» xulosasi bilan keladi.",
            "Chaqirdi — sizga Telegramda sabab, mijoz so‘zlari va lid havolasi bilan «Касание · сайт» keladi, ostida esa «🙅 Клиент отказался» tugmasi: mijoz «qiziq emas» desa — bosing, aloqa [yopiladi](#prospect-close). Lid kartochkasida «Lenta» ustida: «SI javob beryapti» yoki «siz javob berasiz — sabab». **«O‘zim javob beraman»** tugmasi suhbatni istalgan paytda modeldan olib qo‘yadi: keyin model jim turadi, mijozning har bir yangi xabari esa sizga Telegramda keladi — «Клиент написал — отвечаете вы», lid havolasi bilan. Tugmani bosgan odamga keladi, hatto u rahbar yoki ega bo‘lsa ham. Lid har holda sizniki. Lidni berishdi yoki uni navbatdan boshqa odam oldi — suhbat u bilan birga o‘tadi: mijoz xabarlari, qayta yozish va model imzosi endi lidning yangi egasida, oldingi egasining «O‘zim javob beraman» belgisi esa olib tashlanadi. Yozishmadagi har bir «siz» va «SI bizning nomimizdan» yonida qaysi akkauntdan ketgani yozilgan, Telegramda esa «Касание · сайт» va iliq lid xabarida «Аккаунт: …» qatori bor. Mijozga faqat shu akkauntdan javob bering: boshqa raqamdan kelgan xabar mijoz uchun notanish odam.",
            "**Mijozga to‘g‘ridan-to‘g‘ri lid kartochkasidan javob berish mumkin** — telefonsiz va akkauntlarni almashtirmasdan. «Lenta» ostida javob maydoni bor: «Mijozga «…» akkauntidan» ni tanlang va **«Yuborish»** ni bosing (yoki Ctrl+Enter). Xabar mijozga yozilgan o‘sha ish akkauntidan ketadi — qaysi akkaunt ekani maydon ostida yozilgan. Bot uni yarim daqiqa ichida yuboradi, ungacha ostida «yuborilmoqda…» ko‘rinadi; ketmasa — sababi bilan «yuborilmadi», sizga esa Telegramda xabar keladi. Siz javob berishingiz bilan SI jim bo‘ladi, uning yuborilmagan javoblari olib tashlanadi: suhbat endi sizniki, xuddi «O‘zim javob beraman» dan keyingidek. Kartochkadagi yozishma sahifa ochiq turganda har 10 soniyada o‘zi yangilanadi. Agar mijozga o‘z telefoningizdan yozgan bo‘lsangiz va u hali ish akkauntiga javob bermagan bo‘lsa, maydon bo‘lmaydi — u holda o‘sha yerda javob bering. Rasm, ovozli xabar va fayllar hozircha faqat Telegramdan ketadi — yozishma ostidagi «Yozishmani Telegramda ochish» tugmasi.",
            "**Maket va loyihalarimiz havolalarini panel yuborishdan oldin tekshiradi** (25.10.2026 dan). Vitrina manzili (cases.devuz.studio/…) uning loyihasi bilan, loyiha manzili (devuz.studio/ru/cases/…) saytdagi «Loyihalar» bo‘limidagi loyiha bilan boshlanishi kerak. Bunday bo‘lmasa, xabar ketmaydi, maydon ostida esa qaysi havola ochilmasligi va, loyiha tanilsa, to‘g‘risi qaysi ekani yoziladi: «cases.devuz.studio/enotmebel: bunday sahifa yo‘q, to‘g‘ri havola devuz.studio/ru/cases/enotmebel». 25.10.2026 da YANGI KUN mebel shu tarzda bo‘sh sahifa oldi: Enotmebel — prototip, vitrinada u yo‘q. Xuddi shu tekshiruv «Tuzatish» va «Mijozga botda yozish» da ham bor. Maket havolasini qo‘lda yozmasdan, [Maketlar](/admin/mockups) dan nusxa olish ishonchliroq. Telefondan to‘g‘ridan-to‘g‘ri Telegramda yozgan xabarlaringizni panel ko‘rmaydi va tekshirmaydi.",
            "Model vazifa, byudjet va muddatlarni aniqlab olgach, xayrlashadi, sizga esa «Первичка по касанию · сайт» brifi keladi. Keyingi suhbat sizniki.",
            "⚠️ O‘zingiz javob berayotgan bo‘lsangiz, mijozning yangi oddiy xabarlari Telegramda sizga kelmaydi — yozishmaga o‘zingiz qarab turing.",
            "**«💬 Ваш лид ответил»** (22.10.2026 dan): model sizning aloqangiz bo‘yicha yozishmani olib borayotganda, mijozning har bir javobiga bot sizga uning so‘zlarini va «model 5 daqiqadan keyin o‘zi javob beradi» degan qatorni yuboradi. Ma’qul bo‘lsa, hech narsa bosmang: model javob beradi, siz esa ma’lumot ko‘paygach qo‘shilasiz, mijoz maketga yetganda yoki suhbat sizga kerak bo‘lganda bot o‘zi yozadi. O‘zingiz javob bermoqchi bo‘lsangiz, shu 5 daqiqada **«✋ Отвечу сам»** tugmasini bosing: model jim bo‘ladi, uning hali ketmagan javobi ketmaydi, javobni lid kartochkasida yozish mumkin. Avtoprogon aloqalari maketgacha hech kimniki emas, ular bo‘yicha bunday qator kelmaydi. «Mijozlarning aloqalarga javoblari» belgisi olib tashlangan bo‘lsa ham qator kelmaydi.",
          ],
        },
        {
          id: "close",
          title: "«🙅 Mijoz rad etdi» va «🔇 Javob bermayapti»: aloqa yopildi",
          body: [
            "Suhbat bo‘lmasligi aniq bo‘lganda, aloqani yoping. **«🙅 Mijoz rad etdi»** (Telegramda — «🙅 Клиент отказался») — «qiziq emas», «yozmang» deb javob berdi, telefonda rad etdi. **«🔇 Javob bermayapti»** (Telegramda — «🔇 Игнорирует») — o‘qidi-yu jim, trubkani olmaydi. Tugmalar «Tahlil qilingan saytlar» ro‘yxatidagi yuborilgan saytlar kartochkasida va Telegramda — to‘plam yoki oqimdagi kompaniya kartochkasi ostida, «📤 Отправить через бота» va «✋ Написал сам» dan keyin turadi. Botning mijoz javobi haqidagi «Касание · сайт» xabari ostida — faqat «🙅 Клиент отказался». Panelda tugmalarni aloqani olib borayotgan odam, rahbar va egasi ko‘radi. Yozishmadagi aniq rad etishni bot 23.10.2026 dan o‘zi yopadi — tugmani bosish shart emas va bu haqda hech kimga xabar kelmaydi; tugma telefondagi rad etish va bot tushunmagan holatlar uchun qoladi.",
            "Bosilgandan keyin nima bo‘ladi: bot mijozga boshqa qayta xabar yozmaydi ([qayta yozish](#prospect-followups)), navbatga qo‘yilgan xabar esa ketmaydi; model endi javob bermaydi; shu sayt bo‘yicha lid «yutqazilgan» holati bilan yopiladi va u bo‘yicha eslatmalar olib tashlanadi. Ro‘yxatda kartochka ishdagilar qatoridan chiqadi va «mijoz rad etdi» yoki «javob bermayapti» deb belgilanadi. Kim va qachon yopgani kartochkada ko‘rinadi.",
            "Aloqa bunda bajarilgan bo‘lib qoladi — [kunlik to‘plamda](#prospect-portion), haftalik rejada va «soatiga uch»da: mijozga haqiqatan yozilgan. Faqat aloqadan keyin yopish mumkin: xat hali «yuborish navbatida» bo‘lsa — bot «u ketganda belgilang» deb javob beradi; o‘zingiz qo‘ng‘iroq qilgan yoki yozgan bo‘lsangiz — avval «O‘zim bog‘landim».",
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
      what: "Aloqalarning birinchi xatlari ketadigan va mijozlar bilan yozishma boradigan Telegram ishchi akkauntlari. Asosiysi serverda ulangan va chatlarni ham o‘qiydi; bu yerda qo‘shimchalari ulanadi va kim qaysi birida ishlashi belgilanadi. Bo‘limni egasi va rahbar ko‘radi.",
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
            "Har bir akkauntning yangi odamlarga soatiga birinchi xatlar chegarasi o‘ziniki: asosiysida — 3, yangisida ham — 3. Yangi raqamga birinchi haftada «Soatiga xat» maydonida 1–2 qo‘ygan ma’qul: yangi akkauntni Telegram tezroq cheklaydi. Birinchi xatlar har kuni Toshkent vaqti bilan 07:30 dan 20:30 gacha ketadi — tunda qo‘yilgani kutadi va ertalab ketadi; javob berganlar bilan yozishma istalgan vaqtda va chegarasiz boradi. Bo‘lim tepasida — hammasidan birga qanchasi ketishi; xuddi shu raqam [Aloqalar](/admin/prospect)dagi ro‘yxat ustida turadi.",
            "Aloqalar navbati bitta: xat qaysi akkauntda joy oldinroq bo‘shasa, o‘shandan ketadi — menejer hech narsa tanlamaydi; agar odam akkauntlarda belgilangan bo‘lsa ([akkauntda kim ishlaydi](#accounts-staff) bandi), — faqat uning akkauntlaridan. Mijozga javoblar, model javoblari va xat tuzatishi birinchi xat ketgan akkauntdan boradi: odamga boshqa raqamdan yozish — uning yozishmasida begona bo‘lib paydo bo‘lish demak.",
            "Har bir akkaunt ostida — oxirgi soatda va bugun nechta birinchi xat ketgani, skaut uni ulangan holda ushlab turgan bo‘lsa «aloqada» (belgi har daqiqada). Belgi uch daqiqadan ko‘p bo‘lmasa — skaut bu akkaunt bilan ishlamayapti: serverni tekshiring yoki akkauntni qaytadan ulang.",
          ],
        },
        {
          id: "staff",
          title: "Akkauntda kim ishlaydi",
          body: [
            "Asosiy akkaunt ostida va har bir ulangan akkaunt ostida — **«Akkauntda kim ishlaydi»** bloki: studiyada ishlaydigan hammaning belgilari. Shu akkaunt odamlarini belgilang va **«Saqlash»** ni bosing. Bitta odam bir nechta akkauntda turishi mumkin — har birida belgilang; olib tashlangan belgi uni akkauntdan oladi.",
            "Nima uchun: belgilangan odamning birinchi xatlari faqat uning akkauntlaridan ketadi — «soatiga 3» chegarasida qaysi birida joy oldinroq bo‘shasa, o‘shandan. Shunda mijozga uning menejeri turgan raqamdan yoziladi. Odam hech bir akkauntda belgilanmagan bo‘lsa — uning xatlarini istalgan akkaunt oladi, avvalgidek: yangi menejer belgini kutmasdan darhol yozishi mumkin. Akkaunt o‘chirilsa — uning belgilari o‘zi olinadi va uning odamlari xatlarini qolganlari oladi. Kim kimni belgilagani amallar jurnaliga yoziladi.",
          ],
        },
        {
          id: "circle",
          title: "Aloqalar uchun dumaloq video",
          body: [
            "Salomga ruscha javob berganlarga ruscha dumaloq video, o‘zbekcha javob berganlarga o‘zbekchasi ketadi — studiyadan qisqa video: saytni ko‘rdik, bir nechta xato topdik, hozir yozib beramiz. Bepul maket taklifi bilan tahlilni bot mijoz dumaloq videoga javob berganda yuboradi ([ikki bosqichli aloqa](#prospect-hello)). Boshqa tilda javob berganlarga dumaloq videosiz, ularning tilidagi xat ketadi. Bot aloqa ketgan ishchi akkauntning «Saqlangan xabarlar»idan kerakli tildagi dumaloq videoni oladi va «uzatildi» belgisisiz nusxasini yuboradi.",
            "Dumaloq videolarni har bir akkauntning «Saqlangan xabarlar»iga qo‘lda qo‘yish shart emas: shu sahifaning tepasidagi **«Aloqalar uchun dumaloq video»** blokida ikki joy bor — **«Ruscha dumaloq video»** va **«O‘zbekcha dumaloq video»**. Har biriga fayl yuklang — MP4, bir daqiqagacha kvadrat video (Telegramdan saqlangan dumaloq video shundayligicha mos keladi) — va **«Dumaloq videoni yuklash»** tugmasini bosing. O‘n daqiqa ichida bot uni asosiy va har bir ulangan akkauntning «Saqlangan xabarlar»iga o‘zi saqlaydi. U yerda har bir tilda hozir qaysi dumaloq video ketayotgani, qachon va kim yuklagani ham ko‘rinadi; yangisi barcha akkauntlarda shu tildagi oldingisining o‘rnini oladi, boshqa tildagisi qoladi. Kim yuklagani — harakatlar jurnalida. Faylsiz ham bo‘ladi: dumaloq videoni studiya botiga shaxsiy chatda yuboring — bot tilni so‘raydi, «🇷🇺 Русский» yoki «🇺🇿 O‘zbekcha» ni bosing, u esa, masalan, «Узбекский кружок сохранён для касаний» deb javob beradi. Dumaloq videolarni egasi va rahbar almashtira oladi.",
            "Bu yerda har bir akkauntda ikki qator bor — ruscha dumaloq video haqida («Ruscha dumaloq video: bor, … da saqlangan» yoki «Ruscha dumaloq video yo‘q») va o‘zbekchasi haqida. Kerakligi bo‘lmasa — dumaloq video o‘rniga javob tilida xat ketadi. Bot «Saqlangan xabarlar»ga o‘n daqiqada bir marta qaraydi, shuning uchun qatorlar darhol yangilanmaydi. Ruscha dumaloq videoni «Saqlangan xabarlar»ga qo‘lda ham saqlash mumkin — bot oxirgisini oladi. O‘zbekchasini — faqat shu blok yoki bot orqali: videodan tilni bilib bo‘lmaydi va qo‘lda saqlanganini bot ruscha deb hisoblaydi. Dumaloq video yo‘qligi sababli ketmagan bo‘lsa, bu haqda soat 18:00 dagi avtoprogon hisobotida ham qator bor.",
          ],
        },
        {
          id: "circle-niches",
          title: "Sohalar bo‘yicha dumaloq videolar",
          body: [
            "Umumiy videolar ostida **«Sohalar bo‘yicha dumaloq videolar»**: soha va til uchun video. Sohalar: tibbiyot markazi, stomatologiya, mebel, restoran, go‘zallik saloni, turagentlik, o‘quv markazi, ko‘chmas mulk. Soha videosi aloqalarning yangi yarmida shu sohadagi kompaniyalarga ketadi ([A/B](/admin/prospect/texts#sales-ab)); kerakli tilda soha videosi bo‘lmasa, avvalgidek umumiysi ketadi. Kompaniya sohasini panel uning kartochkasidan, bo‘lmasa nomi va sayt manzilidan oladi.",
            "**«Yetishmaydi: …»** qatori: qaysi soha videolari na yuklanganlar orasida, na akkauntlarning «Saqlangan xabarlar»ida bor. Pastda har bir soha va til bo‘yicha: yuklangan sanasi bilan «bor» yoki «yo‘q, umumiysi ketadi».",
            "Yuklash: **«Soha»** va **«Video tili»** ni tanlang, fayl (MP4, kvadrat, bir daqiqagacha) va **«Soha videosini yuklash»** ni bosing. 10 daqiqa ichida bot uni har bir akkauntning «Saqlangan xabarlar»iga qo‘yadi. Yoki videoni studiya botiga yuboring: u avval tilni, keyin sohani tugmalar bilan so‘raydi.",
          ],
        },
        {
          id: "stop",
          title: "Pauza, cheklov va o‘chirish",
          body: [
            "**«Pauza»** — akkaunt birinchi xatlarni yozishni to‘xtatadi, lekin boshlangan suhbatlarda javob beradi. **«Ishga qaytarish»** — yana yozadi.",
            "Telegram akkauntni ommaviy tarqatma uchun cheklasa, u o‘zi bir sutkaga to‘xtaydi: birinchi xatlar qolganlaridan ketadi, yozishma davom etadi, akkauntda esa qachongacha turgani yoziladi. Shu holat yuz bergan xat navbatga qaytadi va boshqa akkauntdan ketadi. Yozadigan boshqa hech kim qolmasa, navbat avvalgidek butunlay olib tashlanadi. Har soatda har bir akkaunt, asosiysi ham, @SpamBot’dan o‘zi cheklanganmi-yo‘qmi deb so‘raydi. Hozir bu tekshiruv egasining so‘zi bilan o‘chirilgan (03.11.2026 dan): cheklov haqida faqat Telegram yuborishni rad etganda bilamiz. Telegram bir sutkadan uzoqroq muddat aytgan bo‘lsa — akkaunt shu muddatgacha to‘xtaydi. Cheklov haqida bot butun jamoaga yozadi: qaysi akkaunt soat nechagacha to‘xtagan, aynan uni nechta va kimning xatlari kutmoqda va nima qilish kerak — mijozlarga shaxsiy akkauntdan yoki boshqa ishchi akkauntdan yozish. Cheklov olib tashlansa — bot akkaunt yana yozayotganini aytadi. Menejerning xatlari cheklangan akkauntni kutmasligi uchun uni yana bitta akkauntda belgilang — [akkauntda kim ishlaydi](#accounts-staff) bandi.",
            "**«O‘chirish»** — skaut Telegramdagi seansni yopadi (u telefondagi qurilmalardan yo‘qoladi) va uni bizda o‘chiradi. Shu akkauntdan boshlangan suhbatlar «Sovuq aloqalar»da qoladi, lekin ularga keyin o‘zingiz javob berasiz: bu raqamdan yozadigan boshqa hech kim yo‘q.",
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
            "Mijozning oxirgi javobidan taxminan bir soat o‘tib. Agar mijoz keyin yana yozsa — suhbat qaytadan tahlil qilinadi va eski tahlil yangisiga almashadi. Aloqa «🙅 Mijoz rad etdi» yoki «🔇 Javob bermayapti» tugmasi bilan yopilsa ham tahlil qaytadan qilinadi: natija «rad etdi» yoki «suhbat to‘xtab qoldi» bo‘ladi.",
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

    /* ── Макеты ───────────────────────────────────────────────────────── */
    "/admin/mockups": {
      what: "Studiyaning barcha maketlari bitta ro‘yxatda: devuz.studio’dagi prototiplar va globalex vitrinasidagi loyihalar. Bu yerda maket kim uchun qilingani, qaysi nishada ekani va parol bilan yopilgan-yopilmagani ko‘rinadi. Mijoz o‘z maketini ochishi uchun bir sutkalik parol ham shu yerda beriladi.",
      items: [
        {
          id: "list",
          title: "Ro‘yxatda nima bor",
          body: [
            "devuz.studio’dagi prototiplar, aniq mijoz uchun qo‘lda yig‘ilganlari. Yangi prototip tayyor bo‘lishi bilan shu yerda o‘zi paydo bo‘ladi. Bot 07.10.2026 gacha [aloqalar](/admin/prospect) uchun o‘zi yig‘gan prototiplar bu yerda yo‘q, ular biznikilar bilan adashtirilmasin (egasi, 09.10.2026); mijoz bunday havolani oldinroq olgan bo‘lsa, u ochilaveradi. Qoralamalar ro‘yxatda yo‘q: ularning havolasida mijoz hech narsa ko‘rmaydi.",
            "globalex vitrinasidagi loyihalar, «vitrina» belgisi bilan. Ularning ko‘pchiligi hammaga, qidiruv tizimlariga ham ochiq: buni egasi hal qilgan, ularga parol qo‘yilmaydi va tugma o‘rniga «parol kerak emas» deb yozilgan. MAVERA, Golden House va Engelberg parol bilan yopilgan.",
            "Har bir maketda: nomi (kim uchun qilingan) va mijoz sayti, «Nisha», «Yaratilgan», kirish holati va mijozga yuboriladigan havola. «mijoz ochgan: 3 marta» maketni biz emas, boshqalar necha marta ochganini ko‘rsatadi: paneldan o‘zimiz ochganimiz va messenjerlardagi havola prevyusi hisoblanmaydi.",
            "Yangi maketlar tepada. Qidiruv maydoni nom, sayt, nisha, mas’ul va maket yuborilgan mijoz bo‘yicha qidiradi, «Hammasi», «Qo‘lda yig‘ilgan», «Yuborilmagan» va «Vitrina» tugmalari ro‘yxatda faqat o‘z maketlarini qoldiradi. Tugmadagi son u yerda nechta maket borligini bildiradi.",
          ],
        },
        {
          id: "bot-mockup",
          title: "Botdagi maket: mijoz o‘zi yig‘adi",
          body: [
            "10.11.2026 dan mijoz maketni o‘zi, studiya botining shaxsiy chatida yig‘ishi mumkin: /maket buyrug‘i yoki t.me/<bot>?start=maket havolasi. Tayyor shablonlar o‘n to‘rtta sohada bor: stomatologiya, tibbiyot markazi, mebel-ta’mir (12.11.2026 dan tugma shunday ataladi: shablon mebelga ham, ta’mir brigadalariga ham mos), restoran, go‘zallik saloni, turagentlik, o‘quv markazi, ko‘chmas mulk va 12.11.2026 dan avtoservis, avtosalon, internet-do‘kon, qurilish va ta’mir, logistika, biznes xizmatlari; har biri shu sohadagi tayyor maketimizdan yig‘ilgan. Dizayner 12 soat ichida qo‘lda faqat yig‘ish tekshiruvdan o‘tmasa yig‘adi. «Boshqa» tugmasi boshi berk emas (12.11.2026 dan): bot kompaniya nima bilan shug‘ullanishini ikki so‘zda yozishni so‘raydi, masalan «kvartira ta’miri», shu so‘zlardan sohani taniydi va eng yaqin maketimizni yig‘adi, tanimasa universal «Biznes xizmatlari» maketini yig‘adi; sohani tugma o‘rniga yozish ham mumkin. Avval bot tilni «🇷🇺 Русский» va «🇺🇿 O‘zbekcha» tugmalari bilan so‘raydi: tanlangan tilda u suhbatni davom ettiradi va maketni yig‘adi, mijozning Telegram ilovasi boshqa tilda bo‘lsa ham. Keyin mijoz sayt manzilini yuboradi (yoki «Sayt yo‘q» tugmasini bosib, to‘rtta savolga javob beradi), sohasini tugma bilan tanlaydi va bir-ikki daqiqada bot maket havolasini va qo‘shimchalari bilan sayt narxini yuboradi. Yig‘ish jarayonini mijoz qadamma-qadam ko‘radi: saytni o‘qiyapmiz, logotip va ranglar, xizmatlar va narxlar, yig‘yapmiz, tekshiryapmiz, tayyor.",
            "Dizayn va bloklar bizning sohaga mos tayyor shablonimiz, model faqat mijoz saytini o‘qiydi: nomi, logotipi, ranglari, xizmatlari, narxlari, shifokorlari, manzili. Uning saytida yo‘q narsa maketda paydo bo‘lmaydi. Shablonlar stomatologiya (bizning Nek maketimizdan), tibbiyot markazi (bizning Shox Hospital maketimizdan) va mebel (bizning vTashkente maketimizdan: oshxona varaqlaganda yig‘iladi, metr hisobi, o‘lchov arizasi) va restoran (bizning Agora maketimizdan: qidiruv va oldindan buyurtma bilan menyu, ikki bosishda stol bron, zal lentasi, «Qanday topish») va turagentlik (bizning SEM Travel maketimizdan: «dan» narxi bilan Toshkentdan yo‘nalish, tur tanlash, yo‘nalishlar xaritasi, Telegramda ariza; bizning Apollo Travel maketimizdan: «Turlar», «Aviachiptalar», «Mehmonxonalar» qidiruv varaqlari va parvoz yoyi hamda kartochkalari bor qidiruv ekrani, unda narx faqat agentlikniki, narx bo‘lmasa «narx so‘rov bo‘yicha»; xaritaga faqat agentlik o‘zida dollardagi narx bilan ko‘rsatgan davlatlar tushadi) va o‘quv markazi (MedAcademy maketimizdan, laym rangli to‘q variant: narxli kurslar yorliqlarda, o‘qituvchilar aylanadigan kartochkalarda, yuguruvchi satr va markaz Telegramida yozilish; maket doim binafsha va laym rangda, mijoz rangi uni o‘zgartirmaydi) va ko‘chmas mulk agentligi (MAVERA maketimizning «Premium» variantidan: suratli yorug‘ ekran, mijoz narxlari bilan xizmatlar lentasi, bosiladigan korpusli bosh reja va kvartiralar shaxmatkasi sayt ishining namunasi sifatida, begona narx va maydonlarsiz, bitim qadamlari va agentlik Telegramiga ariza) uchun bor. Stomatologiya, tibbiyot markazi, restoran, mebel va turagentlik maketi aylantirganda parvoz bilan ochiladi, kadrlar sohaga xos va neytral, barcha mijozlar uchun bir xil: restoranda kamera eshikdan kiradi, administrator yonidan oshxonaga o‘tadi, olovli plita ustidan uchadi va qorong‘ida muassasa nomi chiqadi; mebelda ishchilar eskisini olib chiqadi, ta’mir qiladi va yangi mebel qo‘yadi, nom divan ustida turadi; turagentlikda odam telefonda lentani varaqlaydi, orol rasmini bosadi va okean bo‘yidagi shezlongda bo‘ladi. Go‘zallik saloni alohida shablon bilan yig‘iladi: kamera salon nomi yozilgan peshtaxta ostidagi eshikdan kiradi, qabulxona, soch turmagi, manikyur va bo‘yashdan o‘tadi (yozuvlarda salonning o‘z xizmatlari va narxlari turadi, agar ular saytida bo‘lsa), keyin kadrni salon rangidagi tomchi yopadi va sayt shu rang bilan boshlanadi; so‘ng tomchi matnning o‘ng tomonidagi o‘z yo‘lagidan tushadi va qo‘l suratidagi tirnoqqa qo‘nadi, mehmon yozilishdan oldin rang va qoplamani tanlaydi (suratdagi tirnoqlar qayta bo‘yaladi); birinchi ekrandagi bo‘yoq aylantirganda sekin oqadi; saytda «Наши работы» («До и после» surgichi bilan) va «Отзывы гостей» bor: u yerdagi kadrlar va fikrlar namuna uchun va shunday yozilgan, ish saytida salonning o‘z suratlari va fikrlari turadi. O‘quv markazi va ko‘chmas mulkda parvoz yo‘q. Boshqa soha mijoziga bot maketni dizaynerimiz 12 soatda qo‘lda yig‘ishini halol yozadi va uning sohasidagi keyslarimizga havolalar beradi (keys bo‘lmasa — barcha keyslarga). Yig‘ish o‘tmaganda ham shunday.",
            "Narx bilan birga bot «📄 Tijorat taklifi» tugmasini yuboradi (11.11.2026 dan): maket yonidagi blankamizdagi sahifa, maket manzili va /kp. Unda tanlash uchun asos (1 700 $ o‘rniga 500 $ lending yoki 2 500 $ o‘rniga 1 000 $ korporativ sayt), sohaning qo‘shimchalari shu sohadagi oldingi maketlarimiz narxlaridan 30% arzon (12.11.2026 dan; hammasi birga 1 500 $ dan oshmaydi, butun sayt 2 500 $ dan oshmaydi), jami o‘zi hisoblanadi, va taymer: narx yig‘ilgandan 48 soatga qotirilgan. U yerda model yo‘q, faqat mijoz nomi va sana qo‘yiladi. «Shunday sayt kerak» tanlovni nusxalaydi, mijoz uni bot chatiga qo‘yadi va murojaat sizga keladi. Taklif maket bilan bir xil parol bilan ochiladi: 24 soatdan keyin mijoz parolni botdan so‘raydi.",
            "Maket havolasi ostida bot ikkinchi tugmani beradi, «🛠 Admin panel» (11.11.2026 dan): maket manzili va /admin orqali shu sohadagi oldingi maketimizning tayyor paneli mijoz ma’lumotlari bilan ochiladi. Stomatologiya va tibbiyot markazida bu klinika paneli (yozuvlar, shifokorlar jadvali, barcha kanallar xabarlari bitta oynada, ulanishlar, rollar), restoranda kod bilan kirish, bronlar, buyurtmalar, menyu va stop-list paneli, turagentlikda arizalar, band sanalar kalendari va turistlar paneli (Sunday maketimizdan), o‘quv markazida arizalar, o‘quvchilar, kurslar va o‘qituvchilar paneli (FinTax maketimizdan), mebelda buyurtmalar, foyda, yetkazish va yig‘ish, muddatli to‘lov va tashriflar bilan do‘kon paneli (Greenwell maketimizdan), ko‘chmas mulkda arizalar va bitimlar, ko‘rishlar, qavatlari bilan uylar, shartnomalar, hisoblar va egaga hisobot bilan agentlik paneli (Soffice maketimizdan). Undagi arizalar va raqamlar demo, belgi bilan. Mijoz o‘z maketida qilgan yozuv yoki bron uning admin panelida birinchi qatorda paydo bo‘ladi: shunda u qanday ishlashini ko‘radi. Panel qaytadan chizilmaydi, unda model yo‘q. Go‘zallik salonida admin panel kosmetologiya klinikasi saytimizdan olingan: bitta oynada sayt chati, Instagram Direct, WhatsApp, Telegram va VKontakte xabarlari yig‘iladi, javob o‘sha kanalga ketadi; yonida maqolalar (sayt, Telegram-kanal, Instagram), sayt boshqaruvi (xizmatlar, narxlar, aksiyalar, ustalar, matnlar), ulanishlar, jamoa va tarix. U o‘zbekcha maketda ham rus tilida. Hali o‘z paneli bo‘lmagan sohada tugma yo‘q.",
            "Bunday mijoz sizga «botdan qo‘lda maket» manbali lid bo‘lib keladi, kartochka «🔥 Нужен макет вручную» va soha bilan boshlanadi. Lidni olgan kishi maketni yig‘adi va havolani lid kartochkasidan, «Mijozga studiya botidan», 12 soat tugamasdan yuboradi: mijozga bu allaqachon va’da qilingan. Kechasi kartochka har qanday lid kabi ertalabni kutadi, mijoz esa javobni darhol oladi.",
            "Bunday maket bu ro‘yxatda o‘zi paydo bo‘ladi, darhol mijozga yuborilgan holatda, qoidalari o‘sha: shartlar, iz, havola bo‘yicha 24 soat, keyin parol. Lid issiq lidlar navbatiga «botdagi maket» manbasi bilan keladi, izohda soha, sayt va maket havolasi bor. Mijozga lid kartochkasidan javob berish mumkin.",
            "12.11.2026 dan jarayon hammaga ochiq (egasi: «Hammaga ochamiz»). Botga birinchi marta yozgan har bir kishiga avval til tanlovi, keyin «Saytingiz yoki Instagram manzilini yuboring — 2 daqiqada maket yig‘amiz» xabari keladi, «Maketni yig‘ish» va «Boshqa savolim bor» tugmalari bilan. Manzil o‘rniga oddiy savol va «Boshqa savolim bor» avvalgi suhbatga ketadi. Mijozga bitta Telegram akkauntga bitta maket: ikkinchi urinishda bot tayyor maketga havola beradi. Kunlik chegara yo‘q. Xodimlarga, menejerlarga ham, cheklovsiz: botga /maket yozing va o‘z mijozingiz uchun maket yig‘ing. Xodim yig‘gan maketdan lid ochilmaydi, bu ro‘yxatda esa «botdan, xodim yig‘gan» belgisi bilan turadi. Bitta odam bir nechta «🔥 Нужен макет вручную» kartochkasiga aylanmaydi: o‘sha akkauntdan 7 kun ichidagi takroriy so‘rov yangi kartochka ochmaydi.",
            "13.11.2026 dan xuddi shuni sayt bosh sahifasidagi «Собрать макет» oynasida ham qilish mumkin (egasi: «tgda qilganimizdek… natijani shu interaktiv oynaning o‘zida oladi»). Yig‘ish o‘sha: o‘sha sohalar, tekshiruvlar, iz va shartlar, oyna esa odam olgan maketning o‘zini ko‘rsatadi. Bunday maket bu ro‘yxatda «saytda yig‘ilgan» deb belgilanadi. Telegram akkauntisiz limit boshqacha: bitta brauzerga bitta maket, bitta manzildan sutkasiga uchtadan, hammaga kuniga saksontadan ko‘p emas; keyin odamga qo‘lda maket taklif qilinadi. Lid faqat odam maket ostida o‘zi Telegram yoki telefon qoldirsa keladi: «botdagi maket» manbasi bilan, izohda saytda yig‘ilgani yozilgan, javob shu kontakt bo‘yicha. Bunday maketlar «Bosh sahifa»dagi bot obunachilari maketlari soniga kirmaydi.",
            "16.11.2026 dan saytda ham, botdagidek, xodim maketlarni cheklovsiz yig‘adi (egasi: «Saytda ham xodimlar maketni cheklovsiz yig‘a oladi… Va faqat xodimlarda tugma bo‘lishi kerak: qaytadan yig‘ish»). Sayt sizni panelga kirganingizdan taniydi: kirgandan keyin o‘sha brauzerda panelni bir marta oching, shunda «Собрать макет» oynasi limitlarni sanamaydi. Tayyor maket ostida sizda «Qaytadan yig‘ish» chiqadi: oyna manzildan boshlanadi, oldingi maket shu ro‘yxatda qoladi. Mijozlarda bu tugma yo‘q. Sizning yig‘ishingiz «xodim yig‘di» deb belgilanadi, lidga aylanmaydi, uning ostida kontakt qoldirish lid ochmaydi va saytning kunlik chegarasiga kirmaydi. Panelda «Chiqish»ni bossangiz, sayt sizni yana tashrif buyuruvchi deb hisoblaydi.",
          ],
        },
        {
          id: "shown",
          title: "«Maketni ko‘rsatdim» — to‘g‘ridan-to‘g‘ri ro‘yxatda",
          body: [
            "«Kimga yuborilgan»dagi har bir yuborish yonida — **«Maketni ko‘rsatdim»** tugmasi: bosing va «video orqali» (maket bilan video yozib yubordingiz) yoki «yuzma-yuz» (uchrashuvda yoki ekranli qo‘ng‘iroqda ko‘rsatdingiz)ni tanlang. Belgi sana va ismingiz bilan qo‘yiladi, jurnalga yoziladi va darhol [sotuv bosqichlari](/admin/stages)ga hamda normaga — haftasiga 2 ta ko‘rsatish — kiradi.",
            "O‘z mijozingiz bo‘yicha ko‘rsatishni belgilashingiz mumkin; rahbar va egasi — istalganini. Yuborish na lid, na aloqa bilan bog‘lanmagan bo‘lsa (masalan, maket shaxsiy akkauntdan qo‘lda ketgan), tugma yo‘q — unda ko‘rsatishni [lid kartochkasida](#leads-sales-marks) belgilang. Xuddi shu tugma «Bosh sahifa»dagi «Mening maketlarim»da ham bor.",
          ],
        },
        {
          id: "owner",
          title: "Mas’ul va mijozga yuborish",
          body: {
            manager: [
              "Har bir maket ostida «Mas’ul» qatori va mijozga yuborilgani bor. Mas’ulni panel o‘zi topadi, tartib bilan: qo‘lda tayinlangan («tayinlangan»), keyin maketni vazifa orqali buyurtma qilgan xodim («buyurtma bo‘yicha», qarang: [maket buyurtmasi](#tasks-mockup-order)), keyin maket birinchi ketgan lid egasi («lid bo‘yicha»), keyin aloqa muallifi («aloqa bo‘yicha»), keyin maketni panelda yig‘gan kishi («yig‘gan»). Ulardan hech kim bo‘lmasa — «tayinlanmagan». Qo‘lda yig‘ilgan vitrina maketlarida «yig‘gan» bo‘lmaydi: u yerda mas’ul — qo‘lda tayinlangan, lid egasi yoki aloqa muallifi, vitrina hali ish akkauntlaridan yuborilmagan bo‘lsa — «ish akkauntlaridan yuborilmagan». Mas’ulni rahbar va egasi tayinlaydi yoki almashtiradi.",
              "«mijozga 14.10 17:27 da yuborilgan» — maket havolasi mijozga ishchi akkauntdan birinchi marta ketgan payt: lid kartochkasidan, model javobi bilan, Telegramda qo‘lda yoki 09:00 va 15:00 dagi [skan](#mockups-scan) topgan. «mijozga yuborilmagan» — bunday yuborish yo‘q. Shaxsiy akkauntdan ketgan havolani bot ko‘rmaydi va maket «yuborilmagan» bo‘lib qolaveradi: ishchi akkauntdan yuboring. «Yuborilmagan» tugmasi ro‘yxatda faqat shunday maketlarni qoldiradi. Pastda — «Kimga yuborilgan»: har bir yuborish alohida qatorda — mijoz (lidi borlarda uning kartochkasiga havola), qaysi ishchi akkauntdan va qachon. Birinchi uchtasi darhol ko‘rinadi, qolganlari «yana N ta» ostida. «akkaunt yozilmagan» — akkaunt hali eslab qolinmagan dastlabki yuborishlar. Qidiruv maketni mijoz bo‘yicha ham topadi.",
            ],
            head: [
              "Har bir maket ostida «Mas’ul» qatori va mijozga yuborilgani bor. Mas’ulni panel o‘zi topadi, tartib bilan: qo‘lda tayinlangan («tayinlangan»), keyin maketni vazifa orqali buyurtma qilgan xodim («buyurtma bo‘yicha», qarang: [maket buyurtmasi](#tasks-mockup-order)), keyin maket birinchi ketgan lid egasi («lid bo‘yicha»), keyin aloqa muallifi («aloqa bo‘yicha»), keyin maketni panelda yig‘gan kishi («yig‘gan»). Ulardan hech kim bo‘lmasa — «tayinlanmagan». Qo‘lda yig‘ilgan vitrina maketlarida «yig‘gan» bo‘lmaydi: u yerda mas’ul — qo‘lda tayinlangan, lid egasi yoki aloqa muallifi, vitrina hali ish akkauntlaridan yuborilmagan bo‘lsa — «ish akkauntlaridan yuborilmagan».",
              "Mas’ulni siz va egasi almashtira olasiz: «Mas’ul» qatorida ro‘yxatdan odamni tanlang. Ro‘yxatning birinchi bandi — panel o‘zi topgan kishi (masalan, «Арсений (lid bo‘yicha)») yoki «tayinlanmagan»: tayinlashni olib tashlash uchun uni tanlang. Har bir tayinlash jurnalga yoziladi. Maket [24 soatdan keyin parol bilan yopilganda](#mockups-auto-close) bot mas’ulga yozadi. Menejer mas’ulni ko‘radi, lekin almashtirmaydi.",
              "«mijozga 14.10 17:27 da yuborilgan» — maket havolasi mijozga ishchi akkauntdan birinchi marta ketgan payt: lid kartochkasidan, model javobi bilan, Telegramda qo‘lda yoki 09:00 va 15:00 dagi [skan](#mockups-scan) topgan. «mijozga yuborilmagan» — bunday yuborish yo‘q. Shaxsiy akkauntdan ketgan havolani bot ko‘rmaydi va maket «yuborilmagan» bo‘lib qolaveradi: ishchi akkauntdan yuboring. «Yuborilmagan» tugmasi ro‘yxatda faqat shunday maketlarni qoldiradi. Pastda — «Kimga yuborilgan»: har bir yuborish alohida qatorda — mijoz (lidi borlarda uning kartochkasiga havola), qaysi ishchi akkauntdan va qachon. Birinchi uchtasi darhol ko‘rinadi, qolganlari «yana N ta» ostida. «akkaunt yozilmagan» — akkaunt hali eslab qolinmagan dastlabki yuborishlar. Qidiruv maketni mijoz bo‘yicha ham topadi.",
            ],
            admin: [
              "Har bir maket ostida «Mas’ul» qatori va mijozga yuborilgani bor. Mas’ulni panel o‘zi topadi, tartib bilan: qo‘lda tayinlangan («tayinlangan»), keyin maketni vazifa orqali buyurtma qilgan xodim («buyurtma bo‘yicha», qarang: [maket buyurtmasi](#tasks-mockup-order)), keyin maket birinchi ketgan lid egasi («lid bo‘yicha»), keyin aloqa muallifi («aloqa bo‘yicha»), keyin maketni panelda yig‘gan kishi («yig‘gan»). Ulardan hech kim bo‘lmasa — «tayinlanmagan». Qo‘lda yig‘ilgan vitrina maketlarida «yig‘gan» bo‘lmaydi: u yerda mas’ul — qo‘lda tayinlangan, lid egasi yoki aloqa muallifi, vitrina hali ish akkauntlaridan yuborilmagan bo‘lsa — «ish akkauntlaridan yuborilmagan».",
              "Mas’ulni siz va rahbar almashtira olasiz: «Mas’ul» qatorida ro‘yxatdan odamni tanlang. Ro‘yxatning birinchi bandi — panel o‘zi topgan kishi (masalan, «Арсений (lid bo‘yicha)») yoki «tayinlanmagan»: tayinlashni olib tashlash uchun uni tanlang. Har bir tayinlash jurnalga yoziladi. Maket [24 soatdan keyin parol bilan yopilganda](#mockups-auto-close) bot mas’ulga yozadi. Menejer mas’ulni ko‘radi, lekin almashtirmaydi.",
              "«mijozga 14.10 17:27 da yuborilgan» — maket havolasi mijozga ishchi akkauntdan birinchi marta ketgan payt: lid kartochkasidan, model javobi bilan, Telegramda qo‘lda yoki 09:00 va 15:00 dagi [skan](#mockups-scan) topgan. «mijozga yuborilmagan» — bunday yuborish yo‘q. Shaxsiy akkauntdan ketgan havolani bot ko‘rmaydi va maket «yuborilmagan» bo‘lib qolaveradi: ishchi akkauntdan yuboring. «Yuborilmagan» tugmasi ro‘yxatda faqat shunday maketlarni qoldiradi. Pastda — «Kimga yuborilgan»: har bir yuborish alohida qatorda — mijoz (lidi borlarda uning kartochkasiga havola), qaysi ishchi akkauntdan va qachon. Birinchi uchtasi darhol ko‘rinadi, qolganlari «yana N ta» ostida. «akkaunt yozilmagan» — akkaunt hali eslab qolinmagan dastlabki yuborishlar. Qidiruv maketni mijoz bo‘yicha ham topadi.",
            ],
          },
        },
        {
          id: "password",
          title: "Bir sutkalik parol",
          body: [
            "**«Parol yaratish»** besh raqamli yangi parol beradi. U 24 soat ishlaydi, keyin yaramay qoladi. Mijozning kirishi parol bilan birga tugaydi: parolni allaqachon kiritgan kishi ham bir sutkadan keyin parol maydonini ko‘radi.",
            "Har bir bosish yangi parol beradi. Avval berilganlari bekor qilinmaydi va o‘z soatigacha ishlaydi, shuning uchun har bir mijozga o‘z parolini bergan ma’qul. Qatordagi «mijoz paroli … gacha» oxirgi berilgan parol qaysi soatgacha ishlashini ko‘rsatadi.",
            "Parol faqat bir marta, bosilgandan keyin darhol ko‘rsatiladi. Bizda faqat uning izi saqlanadi, parolni keyin o‘qib bo‘lmaydi. Yo‘qotib qo‘ysangiz, yangisini yarating.",
            "**«Mijoz uchun nusxalash»** maket tilidagi tayyor matnni nusxalaydi: havola, parol, u Toshkent vaqti bilan qaysi soatgacha ishlashi va maketdan foydalanish shartlari havolasi. Uni darhol mijozga yuborish mumkin. **«Parolni nusxalash»** faqat besh raqamni nusxalaydi.",
            "Studiya sayti keyslarda parolsiz ko‘rsatadigan maketni (hozir bu SamAuto) parol faqat to‘g‘ridan-to‘g‘ri havola bo‘yicha, ya’ni mijozga ketgan havola bo‘yicha yopadi. Keys sahifasida yoki bosh sahifadagi rolik ostida «Prototipni ochish» tugmasini bosgan sayt mehmoni maketni parolsiz ko‘radi, hatto parol allaqachon berilgan bo‘lsa ham: keys ishimizni hammaga ko‘rsatadi. Bunday ochilishlar ko‘rsatish jurnaliga yozilmaydi va «mijoz maketni ochdi» qatori kelmaydi: bu mijoz emas, sayt mehmoni.",
          ],
        },
        {
          id: "offer",
          title: "Maketdan keyin 48 soatlik aksiya",
          body: {
            manager: [
              "Maket havolasi mijozga ishchi akkauntdan ketishi bilan — lid kartochkasidan, model javobi bilan yoki Telegram’da qo‘lda — mijozda **48 soatlik maxsus shartlar** boshlanadi: shu maket bo‘yicha to‘liq funksionalli lending va tanlovga 3 ta qo‘shimcha — 1 700 $ o‘rniga 500 $, to‘liq korporativ sayt — 2 500 $ o‘rniga 1 000 $. Maketdan 3 daqiqa o‘tib bot o‘sha akkauntdan mijozga shartlar va muddatni o‘zi yozadi. Xuddi shu havolani qayta yuborish muddatni uzaytirmaydi.",
              "**Boshqa loyiha namunasi — mijozning maketi emas**, u bo‘yicha aksiya yo‘q (25.10.2026 dan). Namuna sifatida boshqa kompaniyaning vitrinasi yoki prototipi yuborilsa (mebel sexiga Comfort Mebel) — bot shartlarni yozmaydi va eslatmaydi: boshqa birovning maketiga «shu maket bo‘yicha lending» mijozni faqat chalg‘itadi. O‘z maketini bot aloqa, sayt va kompaniya nomi bo‘yicha taniydi: shu aloqa uchun yig‘ilgan, sayt bir xil yoki bir nom ikkinchisining ichida («Karomat» va «Karomat oilaviy restorani»). Havola aloqasiz @nikka ketgan bo‘lsa — solishtirishga narsa yo‘q, aksiya avvalgidek boshlanadi.",
              "Ba’zi maketlarda **aksiyaning o‘z narxi** bor — maketning o‘zida yozilgani (masalan, sayt va ilova — 4 800 $ o‘rniga 1 000 $). Unda bot mijozga shartlar va eslatmalarda faqat shu narxni yozadi, lending va korporativ saytning umumiy narxlarisiz, «Maketlar» ro‘yxatida esa bunday maketda «48 soatlik aksiya: … $ (odatda … $)» turadi. O‘z narxini maketni yig‘gan odam qo‘yadi; u bo‘lmasa, yuqoridagi umumiy narxlar amal qiladi.",
              "Keyin bot mijozga o‘zi eslatadi: har kuni Toshkent vaqti bilan 13:00 da — qancha qolgani, va tugashiga 2 soat qolganda yana bir bor (agar bu tun bo‘lsa — oldingi kuni 21:00 da). Tunda mijozga yozmaydi. Muddat tugadi — aksiya amal qilmaydi, narxlar odatiy; mijozga shunday ayting. Mijoz rad etdi yoki lid yutqazildi — eslatmalar to‘xtaydi.",
              "Shaxsiy akkauntdan yuborilgan havola hisobga olinmaydi: bot uni ko‘rmaydi. Maketni ishchi akkauntdan yuboring — aks holda mijozga na shartlar, na eslatmalar boradi.",
            ],
            head: [
              "Maket havolasi mijozga ishchi akkauntdan ketishi bilan — lid kartochkasidan, model javobi bilan yoki Telegram’da qo‘lda — mijozda **48 soatlik maxsus shartlar** boshlanadi: shu maket bo‘yicha to‘liq funksionalli lending va tanlovga 3 ta qo‘shimcha — 1 700 $ o‘rniga 500 $, to‘liq korporativ sayt — 2 500 $ o‘rniga 1 000 $. Maketdan 3 daqiqa o‘tib bot o‘sha akkauntdan mijozga shartlar va muddatni o‘zi yozadi. Xuddi shu havolani qayta yuborish muddatni uzaytirmaydi.",
              "**Boshqa loyiha namunasi — mijozning maketi emas**, u bo‘yicha aksiya yo‘q (25.10.2026 dan). Namuna sifatida boshqa kompaniyaning vitrinasi yoki prototipi yuborilsa (mebel sexiga Comfort Mebel) — bot shartlarni yozmaydi va eslatmaydi: boshqa birovning maketiga «shu maket bo‘yicha lending» mijozni faqat chalg‘itadi. O‘z maketini bot aloqa, sayt va kompaniya nomi bo‘yicha taniydi: shu aloqa uchun yig‘ilgan, sayt bir xil yoki bir nom ikkinchisining ichida («Karomat» va «Karomat oilaviy restorani»). Havola aloqasiz @nikka ketgan bo‘lsa — solishtirishga narsa yo‘q, aksiya avvalgidek boshlanadi.",
              "Ba’zi maketlarda **aksiyaning o‘z narxi** bor — maketning o‘zida yozilgani (masalan, sayt va ilova — 4 800 $ o‘rniga 1 000 $). Unda bot mijozga shartlar va eslatmalarda faqat shu narxni yozadi, lending va korporativ saytning umumiy narxlarisiz, «Maketlar» ro‘yxatida esa bunday maketda «48 soatlik aksiya: … $ (odatda … $)» turadi. O‘z narxini maketni yig‘gan odam qo‘yadi; u bo‘lmasa, yuqoridagi umumiy narxlar amal qiladi.",
              "Sizga va egasiga bot mijozga shartlar ketishi bilan maket kartochkasini, aksiya tugaganda bir qatorni va 13:00 da — kimdadir aksiya davom etayotgan bo‘lsa — «🎨 Макеты клиентов» ro‘yxatini yuboradi. Xuddi shu ro‘yxat — botda «Макеты клиентов» yoki /mockups buyrug‘i bilan: maket kimga ketgani, aksiyadan qancha qolgani, lid havolasi. Aloqalardan bo‘lmagan mijoz (u bo‘yicha aloqa yo‘q) ro‘yxatda ko‘rinadi, lekin bot unga eslatma yozmaydi.",
              "Har bir maket ostida ikkita tugma. **«🔒 Закрыть паролем»** — bir sutkalik parol, bu yerdagi «Parol yaratish» kabi: birinchi parol ochiq maketni yopadi, bot mijoz uchun tayyor matnni yuboradi. **«✅ Утверждён → Егору»** — mijoz maketni tasdiqladi: unga eslatmalar to‘xtaydi, Egorga maket va lid havolalari hamda maket aksiya muddatida tasdiqlanganmi degan belgi bilan «Сайт по макету» vazifasi qo‘yiladi.",
              "Eslatmalarni arzon model yozadi, narxlar, muddat va qancha qolganini esa kod qo‘yadi va tekshiradi: xabarda begona raqamlar, havolalar va aksiyani uzaytirish va’dasi bo‘lmaydi. Tekshiruvdan o‘tmasa — tayyor matn ketadi. Shartlarning o‘zi doim tayyor matn bilan boradi.",
            ],
            admin: [
              "Maket havolasi mijozga ishchi akkauntdan ketishi bilan — lid kartochkasidan, model javobi bilan yoki Telegram’da qo‘lda — mijozda **48 soatlik maxsus shartlar** boshlanadi: shu maket bo‘yicha to‘liq funksionalli lending va tanlovga 3 ta qo‘shimcha — 1 700 $ o‘rniga 500 $, to‘liq korporativ sayt — 2 500 $ o‘rniga 1 000 $. Maketdan 3 daqiqa o‘tib bot o‘sha akkauntdan mijozga shartlar va muddatni o‘zi yozadi. Xuddi shu havolani qayta yuborish muddatni uzaytirmaydi.",
              "**Boshqa loyiha namunasi — mijozning maketi emas**, u bo‘yicha aksiya yo‘q (25.10.2026 dan). Namuna sifatida boshqa kompaniyaning vitrinasi yoki prototipi yuborilsa (mebel sexiga Comfort Mebel) — bot shartlarni yozmaydi va eslatmaydi: boshqa birovning maketiga «shu maket bo‘yicha lending» mijozni faqat chalg‘itadi. O‘z maketini bot aloqa, sayt va kompaniya nomi bo‘yicha taniydi: shu aloqa uchun yig‘ilgan, sayt bir xil yoki bir nom ikkinchisining ichida («Karomat» va «Karomat oilaviy restorani»). Havola aloqasiz @nikka ketgan bo‘lsa — solishtirishga narsa yo‘q, aksiya avvalgidek boshlanadi.",
              "Ba’zi maketlarda **aksiyaning o‘z narxi** bor — maketning o‘zida yozilgani (masalan, sayt va ilova — 4 800 $ o‘rniga 1 000 $). Unda bot mijozga shartlar va eslatmalarda faqat shu narxni yozadi, lending va korporativ saytning umumiy narxlarisiz, «Maketlar» ro‘yxatida esa bunday maketda «48 soatlik aksiya: … $ (odatda … $)» turadi. O‘z narxini maketni yig‘gan odam qo‘yadi; u bo‘lmasa, yuqoridagi umumiy narxlar amal qiladi.",
              "Sizga va rahbarga bot mijozga shartlar ketishi bilan maket kartochkasini, aksiya tugaganda bir qatorni va 13:00 da — kimdadir aksiya davom etayotgan bo‘lsa — «🎨 Макеты клиентов» ro‘yxatini yuboradi. Xuddi shu ro‘yxat — botda «Макеты клиентов» yoki /mockups buyrug‘i bilan: maket kimga ketgani, aksiyadan qancha qolgani, lid havolasi. Aloqalardan bo‘lmagan mijoz (u bo‘yicha aloqa yo‘q) ro‘yxatda ko‘rinadi, lekin bot unga eslatma yozmaydi.",
              "Har bir maket ostida ikkita tugma. **«🔒 Закрыть паролем»** — bir sutkalik parol, bu yerdagi «Parol yaratish» kabi: birinchi parol ochiq maketni yopadi, bot mijoz uchun tayyor matnni yuboradi. **«✅ Утверждён → Егору»** — mijoz maketni tasdiqladi: unga eslatmalar to‘xtaydi, Egorga maket va lid havolalari hamda maket aksiya muddatida tasdiqlanganmi degan belgi bilan «Сайт по макету» vazifasi qo‘yiladi.",
              "Eslatmalarni arzon model yozadi, narxlar, muddat va qancha qolganini esa kod qo‘yadi va tekshiradi: xabarda begona raqamlar, havolalar va aksiyani uzaytirish va’dasi bo‘lmaydi. Tekshiruvdan o‘tmasa — tayyor matn ketadi. Shartlarning o‘zi doim tayyor matn bilan boradi.",
            ],
          },
        },
        {
          id: "scan",
          title: "Maketlar skani: e’tibordan chetda qolganlar",
          body: {
            manager: [
              "Kuniga ikki marta, Toshkent vaqti bilan 09:00 va 15:00 da, bot 14 kunlik yozishmalardan maketlarimiz havolalarini (devuz.studio/proto/… va cases.devuz.studio/…) o‘zi qidiradi: aloqalarning chiquvchi xabarlarida, paneldagi lid yozishmalarida va har bir ishchi Telegram akkauntining dialoglarida. Mijozga ketgan, lekin ro‘yxatga tushmagan hamma narsani (skaut qayta ishga tushgan, havola qo‘lda qo‘yilgan) o‘zi kiritadi. Bunda model ishtirok etmaydi, faqat qoidalar.",
              "Bot mijozga orqaga qarab yozmaydi: 48 soatdan oldin ketgan bo‘lsa — mijozda aksiya allaqachon tugagan, qator shunchaki tarixda qoladi; 48 soat ichida, lekin 3 soatdan oldin ketgan bo‘lsa — aksiya davom etadi, lekin mijozga na shartlar, na eslatmalar boradi: kerak bo‘lsa, o‘zingiz ayting. Yangisi (3 soatgacha) — odatdagidek, 3 daqiqadan keyin shartlar bilan. Shaxsiy akkauntdagi havolani bot skandan keyin ham ko‘rmaydi.",
            ],
            head: [
              "Kuniga ikki marta, Toshkent vaqti bilan 09:00 va 15:00 da, bot 14 kunlik yozishmalardan maketlarimiz havolalarini (devuz.studio/proto/… va cases.devuz.studio/…) o‘zi qidiradi: aloqalarning chiquvchi xabarlarida, paneldagi lid yozishmalarida va har bir ishchi Telegram akkauntining dialoglarida. Mijozga ketgan, lekin ro‘yxatga tushmagan hamma narsani (skaut qayta ishga tushgan, havola qo‘lda qo‘yilgan) o‘zi kiritadi. Bunda model ishtirok etmaydi, faqat qoidalar. Telegram cheklagan akkauntni skan o‘tkazib yuboradi; dialoglar bittadan, pauzalar bilan o‘qiladi.",
              "Bot mijozga orqaga qarab yozmaydi: 48 soatdan oldin ketgan bo‘lsa — mijozda aksiya allaqachon tugagan, qator shunchaki tarixda qoladi; 48 soat ichida, lekin 3 soatdan oldin ketgan bo‘lsa — aksiya davom etadi, lekin mijozga na shartlar, na eslatmalar boradi, sizga esa «🔎 Макет найден сканом» kartochkasi keladi; yangisi (3 soatgacha) — odatdagidek, 3 daqiqadan keyin shartlar bilan. Xuddi shu mijozga xuddi shu havola ikkinchi marta yozilmaydi va muddatni uzaytirmaydi.",
              "Skan biror narsa topsa, sizga va egasiga topilganlar ro‘yxati bilan bitta «🔎 Скан макетов» qatori keladi; hech narsa topmasa — bot jim turadi. «Макеты клиентов» ro‘yxatida bunday maketlarda «🔎 найдено сканом» belgisi bor, [Bosh sahifa](/admin/hq)da — maketlar kartochkasida «7 kunda skan topdi» qatori va lentada «Skan maketni topdi».",
            ],
            admin: [
              "Kuniga ikki marta, Toshkent vaqti bilan 09:00 va 15:00 da, bot 14 kunlik yozishmalardan maketlarimiz havolalarini (devuz.studio/proto/… va cases.devuz.studio/…) o‘zi qidiradi: aloqalarning chiquvchi xabarlarida, paneldagi lid yozishmalarida va har bir ishchi Telegram akkauntining dialoglarida. Mijozga ketgan, lekin ro‘yxatga tushmagan hamma narsani (skaut qayta ishga tushgan, havola qo‘lda qo‘yilgan) o‘zi kiritadi. Bunda model ishtirok etmaydi, faqat qoidalar. Telegram cheklagan akkauntni skan o‘tkazib yuboradi; dialoglar bittadan, pauzalar bilan o‘qiladi.",
              "Bot mijozga orqaga qarab yozmaydi: 48 soatdan oldin ketgan bo‘lsa — mijozda aksiya allaqachon tugagan, qator shunchaki tarixda qoladi; 48 soat ichida, lekin 3 soatdan oldin ketgan bo‘lsa — aksiya davom etadi, lekin mijozga na shartlar, na eslatmalar boradi, sizga esa «🔎 Макет найден сканом» kartochkasi keladi; yangisi (3 soatgacha) — odatdagidek, 3 daqiqadan keyin shartlar bilan. Xuddi shu mijozga xuddi shu havola ikkinchi marta yozilmaydi va muddatni uzaytirmaydi.",
              "Skan biror narsa topsa, sizga va rahbarga topilganlar ro‘yxati bilan bitta «🔎 Скан макетов» qatori keladi; hech narsa topmasa — bot jim turadi. «Макеты клиентов» ro‘yxatida bunday maketlarda «🔎 найдено сканом» belgisi bor, [Bosh sahifa](/admin/hq)da — maketlar kartochkasida «7 kunda skan topdi» qatori va lentada «Skan maketni topdi».",
            ],
          },
        },
        {
          id: "closed",
          title: "«havola orqali ochiq» va «parol bilan»",
          body: {
            manager: [
              "«havola orqali ochiq» degani, havolasi bor har qanday kishi maketni ochadi. Birinchi parol bilan u yopiladi: panel qayta so‘raydi, shundan keyin parolsiz havola faqat parol maydonini ko‘rsatadi. Bu havola oldinroq yuborilganlarga ham tegishli: ularga ham parol kerak bo‘ladi.",
              "«parol bilan» degani, maket allaqachon yopilgan. Maketda egasining doimiy paroli bo‘lsa, u avvalgidek, bir sutkalik parollar bilan birga ishlaydi. Maketni paneldan yana parolsiz havola orqali ochib bo‘lmaydi: kerak bo‘lsa, egasiga ayting.",
            ],
            head: [
              "«havola orqali ochiq» degani, havolasi bor har qanday kishi maketni ochadi. Birinchi parol bilan u yopiladi: panel qayta so‘raydi, shundan keyin parolsiz havola faqat parol maydonini ko‘rsatadi. Bu havola oldinroq yuborilganlarga ham tegishli: ularga ham parol kerak bo‘ladi.",
              "«parol bilan» degani, maket allaqachon yopilgan. Maketda egasining doimiy paroli bo‘lsa, u avvalgidek, bir sutkalik parollar bilan birga ishlaydi. Maketni paneldan yana parolsiz havola orqali ochib bo‘lmaydi: kerak bo‘lsa, egasiga ayting.",
            ],
            admin: [
              "«havola orqali ochiq» degani, havolasi bor har qanday kishi maketni ochadi. Birinchi parol bilan u yopiladi: panel qayta so‘raydi, shundan keyin parolsiz havola faqat parol maydonini ko‘rsatadi. Bu havola oldinroq yuborilganlarga ham tegishli: ularga ham parol kerak bo‘ladi.",
              "«parol bilan» degani, maket allaqachon yopilgan. Maketdagi doimiy parolingiz avvalgidek, bir sutkalik parollar bilan birga ishlaydi. Maketni yana parolsiz havola orqali ochadigan tugma yo‘q: bu bazada qilinadi, prototipda `closed_at` maydoni tozalanadi.",
            ],
          },
        },
        {
          id: "auto-close",
          title: "24 soat havola orqali, keyin parol bilan",
          body: [
            "Har bir maketimiz havola orqali 24 soat ochiq, keyin o‘zi yopiladi — xuddi birinchi parol berilgandek. Soatlar maket havolasi mijozga ishchi akkauntdan birinchi marta ketgan paytdan boshlanadi; yuborish haqida hech narsa ma’lum bo‘lmasa — biz emas, birinchi ochgan paytdan (paneldan ochishlarimiz hisobga olinmaydi); maketni hali hech kim ochmagan bo‘lsa — u ro‘yxatda paydo bo‘lgan daqiqadan. Bu model emas, qoida: uni kod har besh daqiqada hisoblaydi.",
            "Maket qatorida u bilan nima bo‘lgani ko‘rinadi: «yana 5 soat ochiq, keyin parol bilan» — shuncha qoldi; «14.10 15:00 dan parol bilan yopiq: 24 soat o‘tdi» — qoida yopdi; «… dan parol bilan yopiq» — birinchi berilgan parol yopdi. Allaqachon yopilgan maketga qoida tegmaydi. Agar maketda o‘z yoqilish vaqti bor egasining doimiy paroli bo‘lsa, maket 24 soatdan keyin emas, o‘sha vaqtda yopiladi. Egasi parolsiz ochiq turishini aytgan maketni (SamAuto kabi) qoida yopmaydi: unda «yana … soat ochiq» yozuvi yo‘q. Unga ham tugma bilan parol berish mumkin.",
            "Maket yopilganda, [mas’ulga](#mockups-owner) (qo‘lda tayinlangan, bo‘lmasa lid egasi yoki aloqa muallifi) bot yozadi: «🔒 Макет … закрылся паролем: прошло 24 часа. Нужен клиенту — нажмите „Сгенерировать пароль“» — «🔑 Сгенерировать пароль» tugmasi bilan, u darhol bir sutkalik parol va mijoz uchun tayyor matnni beradi. Mas’ul noma’lum bo‘lsa — qator egasi va rahbarga ketadi. cases.devuz.studio vitrinasi loyihalarini qoida yopmaydi: bu studiya sayti uchun ishlarimiz.",
          ],
        },
        {
          id: "open",
          title: "O‘zingiz ochish",
          body: [
            "**«Ochish»** maketni yangi oynada ochadi. devuz.studio’dagi prototip yopiq bo‘lsa ham parolsiz ochiladi: panel sizga 12 soatlik kirishni o‘zi beradi. Bunday ochish mijozning ochishi hisoblanmaydi va bot mijoz prototipni ochdi deb yozmaydi.",
            "Vitrina loyihasi vitrinaning o‘zida ochiladi. Yopig‘i kod so‘raydi: shu yerda yaratilgan bir sutkalik parol mos keladi.",
            "**«Havolani nusxalash»** maket havolasini parolsiz nusxalaydi. Maket yopiq bo‘lsa, mijozga «Mijoz uchun nusxalash» matnini yuboring: unda parol ham bor.",
          ],
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
            "Loyiha kartochkasida, nomining darhol ostida — **«Loyiha bo‘yicha vazifalar»**: unga biriktirilgan barcha vazifalar — kimdan, kimga, muddat va hozir ular qanday holatda. Ochiqlari tepada, eng yaqin muddatdan, yopilganlari pastda. Agar vazifa sizda bo‘lsa yoki uni siz qo‘ygan bo‘lsangiz, bu yerdagi tugmalar [«Vazifalar»](#tasks-board) bo‘limidagi bilan bir xil.",
            "Loyiha bo‘yicha vazifa qo‘yish uchun o‘ngdagi **«Vazifa qo‘yish»** ni bosing: «Vazifalar» bo‘limi forma bilan ochiladi, unda bu loyiha allaqachon tanlangan. Vazifani loyihaga faqat loyiha shu yerda, «Loyihalar» da qo‘shilgan bo‘lsa biriktirish mumkin — shuning uchun avval mijoz loyihasi qo‘shiladi. Vazifalar haqida batafsil — [vazifalar](#tasks-board) bandida.",
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
              "**«Loyiha ma’lumotlari»** — nomi, mijoz, muddat, izohlar; ularni siz mas’ul sifatida tahrirlaysiz. **«Shartnoma»** — shartnoma kartochkasi: raqami, u hozir qayerda (qoralama, egasida imzoda, tasdiqlangan, imzolangan), summa, qoralamada — imzogacha nima yetishmasligi va «Shartnomani ochish». Shartnoma yo‘q ekan — [«Maketdan tarkib»](#contracts-compose) va «Rekvizitlarni qo‘yish» bilan forma; tayyorlanmasa, forma ustida nimani tuzatish kerakligi yoziladi. Batafsil — [shartnomalar](/admin/contracts).",
            ],
            head: [
              "Bloklar: «Bosqich», «Smeta», «Pul», «Loyiha ma’lumotlari», «Shartnoma». Siz istalgan loyiha kartochkasini ko‘rasiz; pulni — o‘z loyihalaringiz va jamoa loyihalari bo‘yicha.",
              "Smeta va summani loyiha mas’uli va egasi tahrirlaydi — siz jamoa loyihalarida ularni faqat ko‘rasiz. Summa — butun dollarda; birinchi to‘lovdan keyin uni faqat egasi o‘zgartiradi.",
              "Hisoblanma qatorlari: daraja bo‘yicha mas’ul va siz — jamoa loyihalaridan «rahbar · 5 %» (muassisda bu qator 0).",
            ],
            admin: [
              "Siz hammasini tahrirlaysiz: bosqich (10 ta tugma), smeta, summa va bitim turini istalgan paytda, **«Soliq, %»** (odatiy 4) va **«Ishlab chiqish tannarxi, $»** — faqat siz, hech kim tannarxni kamaytirib, o‘z hisoblanmasini oshirmasligi uchun.",
              "Hisoblanma qatorlarida — shu bitim uchun foiz: «belgilash» yoki «daraja bo‘yicha»ga qaytarish. **«Hamkor»** bloki: kim olib kelgan, hamkorga foiz («pog‘ona bo‘yicha» — loyiha summasiga qarab: aylanmadan 6–20%, «foydadan» eski loyihada — 10–30%), «Agentlik buyurtmasi» — agar loyiha hamkor agentligidan bo‘lsa — va «Hisobga olmaslik sababi».",
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
      what: "Studiyaning barcha lidlari (mijoz buyurtmalari) bo‘yicha raqamlar: qancha keladi, qayerdan va qanchasini yutamiz. Mijozlar qayerda yo‘qolayotganini ko‘rish uchun bu yerga haftada bir marta kiring.",
      items: [
        {
          id: "tiles",
          title: "Asosiy raqamlar",
          body: [
            "**«jami lidlar»** bazada nechta buyurtma borligini ko‘rsatadi, **«ishga olingan»** esa ulardan nechtasida mas’ul menejer borligini.",
            "**«yutilganlar ulushi»** faqat yopilgan bitimlar bo‘yicha hisoblanadi: yutilganlarni yutilgan va yutqazilganlar yig‘indisiga bo‘lamiz. Ishdagi lid hali yutqazilmagan. Shuning uchun lidni indamay tashlab qo‘ymang, unga «yutqazilgan» holatini qo‘ying.",
            "**«olishgacha mediana»** buyurtmadan «O‘zimga olish» bosilguncha odatda qancha vaqt o‘tishini ko‘rsatadi. Dam olish kunlari unutilgan bitta lid bu raqamni deyarli o‘zgartirmaydi. Lid hamkasbga berilsa, vaqt qaytadan hisoblanadi.",
          ],
        },
        {
          id: "panels",
          title: "Pastdagi bloklar",
          body: [
            "«Haftalar bo‘yicha kelishi» 12 haftalik buyurtmalarni ko‘rsatadi, hafta dushanbadan boshlanadi. «Lidlar sifati» buyurtmalarni A, B, C va D harflariga bo‘ladi.",
            "«Nima so‘rashadi» blokida bitta lid bir nechta qatorda turishi mumkin, shuning uchun yig‘indi lidlar sonidan katta.",
            "«30% chegirma» chegirma olgan buyurtmalarni sanaydi. «birinchi daqiqa» mijoz saytda taymer ketayotganda chatga yozganini bildiradi. «20 soniya kafolati» biz 20 soniyada javob bermaganimizni bildiradi.",
          ],
        },
        {
          id: "people",
          title: "Odamlar bo‘yicha jadval",
          body: {
            manager: [
              "Odamlar bo‘yicha jadvalni faqat rahbar va egasi ko‘radi. O‘z raqamlaringizni «Bosh sahifa»da ko‘ring: «Mening ishim», «Haftalik bosqichlarim» va [«Reja va fakt»](#hq-week).",
            ],
            head: [
              "«Mening jamoam bo‘yicha» jadvali sizni va menejerlaringizni ko‘rsatadi: «Ishda», «Yutdi», «Yutqazdi» va «Jami», butun vaqt uchun. Lid hozir kimda bo‘lsa, o‘shaniki hisoblanadi. Menejerlar bu jadvalni ko‘rmaydi.",
            ],
            admin: [
              "«Menejerlar bo‘yicha» jadvali barcha faol xodimlarni butun vaqt uchun ko‘rsatadi. Lid hozir kimda bo‘lsa, o‘shaniki hisoblanadi. Rahbar faqat o‘zini va jamoasini ko‘radi, menejerlar jadvalni ko‘rmaydi.",
            ],
          },
        },
        {
          id: "plans",
          title: "Rejalar qayerda",
          body: {
            manager: [
              "Bu bo‘limda rejalar yo‘q. «Reja va fakt» [«Bosh sahifa»ning](#hq-week) pastida turadi. Aloqalar rejangizni [«Sovuq aloqalar»](/admin/prospect) bo‘limida ko‘rasiz.",
            ],
            head: [
              "Bu bo‘limda rejalar yo‘q. «Reja va fakt» [«Bosh sahifa»ning](#hq-week) pastida turadi. Menejerlarga aloqalar rejasini [«Jamoa»](/admin/team) bo‘limida qo‘yasiz.",
            ],
            admin: [
              "Bu bo‘limda rejalar yo‘q. «Reja va fakt» [«Bosh sahifa»ning](#hq-week) pastida turadi. Aloqalar rejasi [«Jamoa»](/admin/team) bo‘limida qo‘yiladi.",
            ],
          },
        },
      ],
    },

    /* ── Трафик ───────────────────────────────────────────────────────── */
    "/admin/stages": {
      what: "Kompaniyalar va lidlar sotuv bosqichlari bo‘yicha, birinchi xabardan to‘lovgacha. Bu yerda bitimlar qayerda to‘xtab qolayotgani va kimni oldinga surish vaqti kelgani ko‘rinadi.",
      items: [
        {
          id: "list",
          title: "Bosqich ro‘yxati: qanday o‘qish",
          body: {
            manager: [
              "Tepada bosqichni tanlang, «yozdik»dan «to‘lov»gacha, va davrni: «7 kunda», «undan oldingi 7 kun», «30 kunda» yoki «dushanbadan beri».",
              "Pastda shu bosqichga yetgan kompaniyalar chiqadi. Qatorda lid kimniki, qachon yetgani va keyingi bosqich bor-yo‘qligi ko‘rinadi (u yashil).",
              "Siz faqat o‘z bitimlaringizni ko‘rasiz: o‘zingiz yuritayotganlar va ko‘rsatish yoki narxni siz belgilaganlar. Qatorni bosing, kartochka ochiladi. Haftalik shu raqamlar «Bosh sahifa»dagi [«Haftalik bosqichlarim»](#hq-my-stages) blokida bor.",
            ],
            head: [
              "Tepada bosqichni tanlang, «yozdik»dan «to‘lov»gacha, va davrni: «7 kunda», «undan oldingi 7 kun», «30 kunda» yoki «dushanbadan beri».",
              "Pastda shu bosqichga yetgan kompaniyalar chiqadi. Qatorda lid kimniki, qachon yetgani va keyingi bosqich bor-yo‘qligi ko‘rinadi (u yashil).",
              "Siz butun jamoaning bitimlarini ko‘rasiz. Bu yerda pul summalari yo‘q. 7 va 30 kunlik shu raqamlar «Bosh sahifa»dagi [«Sotuv bosqichlari»](#hq-stages) blokida turadi.",
            ],
            admin: [
              "Tepada bosqichni tanlang, «yozdik»dan «to‘lov»gacha, va davrni: «7 kunda», «undan oldingi 7 kun», «30 kunda» yoki «dushanbadan beri».",
              "Pastda shu bosqichga yetgan kompaniyalar chiqadi. Qatorda lid kimniki, qachon yetgani va keyingi bosqich bor-yo‘qligi ko‘rinadi (u yashil).",
              "Siz butun jamoaning bitimlarini ko‘rasiz. Ro‘yxatda summalar yo‘q. To‘lovlar summasini faqat siz ko‘rasiz, «Bosh sahifa»dagi [«Sotuv bosqichlari»](#hq-stages) blokida.",
            ],
          },
        },
        {
          id: "marks",
          title: "Nega bosqich bo‘sh",
          body: [
            "Deyarli barcha bosqichlarni panel o‘zi qo‘yadi. Maket ko‘rsatilganini u ko‘rmaydi. Maketni video orqali yoki yuzma-yuz ko‘rsatdingizmi? [«Maketlar»](/admin/mockups) bo‘limida, «Bosh sahifa»dagi «Mening maketlarim»da yoki [lid kartochkasida](#leads-sales-marks) «Maketni ko‘rsatdim» tugmasini bosing.",
            "Bot narxni «+» dan keyin mijozga yuborganda, panel narxni o‘zi belgilaydi. Narxni o‘zingiz, yozishmada yoki telefonda aytdingizmi? Lid kartochkasida «Narxni aytdim» tugmasini bosib, summani yozing. Belgisiz bosqich bo‘sh qoladi va sotuvlar aslidagidan yomonroq ko‘rinadi.",
            "Qatorlar 200 dan ko‘p bo‘lsa, birinchi 200 tasi ko‘rsatiladi: qisqaroq davrni tanlang. O‘zi kelgan mijozlar (saytdan, chatdan yoki botdan buyurtma) «yozdik»ga kirmaydi. Ular darhol javob berganlar hisoblanadi.",
          ],
        },
      ],
    },

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

    /* ── Reklama ──────────────────────────────────────────────────────── */
    "/admin/outside": {
      what: "vc.ru, Dzen va Tenchat uchun maqola qoralamalari: haftada bir marta model har bir platformaga bittadan yozadi, odam ularni studiyaning platformadagi akkauntidan e’lon qiladi va havolani shu yerga qo‘yadi. Rossiya va MDHda biznes egalari o‘qiydigan joylarda studiya haqida yozilishi va shu maqolalardan saytimizga odamlar hamda havolalar kelishi uchun kerak.",
      items: [
        {
          id: "how",
          title: "Bu qanday ishlaydi",
          body: [
            "Haftada bir marta, Toshkent vaqti bilan kunduzi (11:00 dan), har bir platforma uchun qoralama tayyorlanadi. Mavzu — koddagi ro‘yxatdan, uning so‘rovi Rossiya bo‘yicha Wordstat va Google Trends bilan solishtiriladi: bu platformalarni asosan o‘sha yerda o‘qishadi. Arzon model yozadi, saytimizdagi keyslarimiz faktlari bo‘yicha.",
            "Qoralama shu yerda paydo bo‘lishidan oldin uni kod tekshiradi: so‘rov sarlavhada va birinchi xatboshida turadi, uzun tire va neyrotarmoq shtamplari yo‘q, narxlar, foizlar va keyslarda yo‘q raqamlar yo‘q, havolalar faqat saytimizga va keyslarimizga, ikkitadan ko‘p emas (Tenchatda — bitta). Uch urinishda o‘tmasa — qoralama bo‘lmaydi, egasiga nima chiqmagani haqida qator keladi.",
            "Qoralamalar to‘planib qolmaydi: platforma yangisini faqat avvalgisi e’lon qilingan yoki o‘tkazib yuborilgandan keyin oladi. Bir haftada uch platformada — uch xil mavzu, va bitta mavzu har bir platformada o‘z matni bilan yoziladi: vc.ru da tahlil, Dzenda oddiy tilda, Tenchatda qisqa post.",
            "Robot emas, odam e’lon qiladi: bu platformalarda dastur orqali e’lon qilishning ochiq yo‘li yo‘q, akkauntga o‘zi kiradigan robot esa ularning qoidalarini buzadi va akkaunt bloklanadi.",
          ],
        },
        {
          id: "publish",
          title: "Qanday e’lon qilish kerak",
          body: [
            "**«E’lon qilinishini kutmoqda»** blokida qoralama yonida — platforma, so‘rov va tugmalar. **«Sarlavhadan nusxa olish»** — muharrirdagi sarlavha maydoniga. **«Nusxa olish»** — butun matn: vc.ru va Dzen uchun bezagi bilan (sarlavhachalar, ro‘yxatlar va havolalar o‘zicha qo‘yiladi), Tenchat uchun — oddiy matn. Muharrir matnni noto‘g‘ri qo‘ysa — **«Bezaksiz nusxa olish»**.",
            "**«vc.runi ochish»** (yoki boshqa platforma) uni yangi oynada ochadi: studiya akkauntiga kiring, yangi nashrni boshlang, sarlavha va matnni qo‘ying, rasm qo‘shing va e’lon qiling. **«Matnni ko‘rsatish»** — qoralamani oldindan o‘qish; to‘g‘ridan-to‘g‘ri platforma muharririda tuzatish mumkin.",
            "E’londan keyin maqola manzilini brauzer qatoridan nusxa oling, **«E’lon qilingan maqola havolasi»** maydoniga qo‘ying va **«E’lon qildim»**ni bosing. Havola faqat shu platforma manzilidan va faqat https bilan qabul qilinadi. **«O‘tkazib yuborish»** — qoralama yaramasa: platforma keyingi hafta yangisini oladi.",
            "Matndagi havolalar saytimizga Metrika belgilari bilan olib boradi (belgida — platforma nomi): [Trafik](/admin/traffic)da har bir platformadan nechta odam kelgani ko‘rinadi.",
          ],
        },
        {
          id: "links",
          title: "E’lon qilinganlar va havola tekshiruvi",
          body: [
            "**«E’lon qilinganlar»** blokida — maqolalar havolasi bilan, kim va qachon e’lon qilgani. «E’lon qildim»dan 10 daqiqa o‘tib, keyin esa haftada bir marta kod maqola sahifasini o‘zi ochadi va unda devuz.studio ga havolani qidiradi.",
            "Maqola ostidagi qator: «qidiruvda vazn beradi» — oddiy havola, u saytga Google va Yandexda yordam beradi; «nofollow deb belgilagan» — platforma qidiruv tizimlaridan havolani hisobga olmaslikni so‘ragan: vazn yo‘q, lekin odamlar u orqali o‘tadi, bunday platformalar uchun bu odatiy hol; «havola topilmadi» — uni moderatsiyada olib tashlashgan yoki maqola faqat kirgandan keyin ko‘rinadi; «sahifa ochilmadi» — maqola o‘chirilgan yoki platforma tekshiruvni kiritmaydi.",
            "Bo‘lim tepasida — 30 kunda nechta maqola e’lon qilingani va nechta qoralama o‘tkazib yuborilgani.",
          ],
        },
        {
          id: "auto",
          title: "O‘zi e’lon qilinadi: Telegraph, VKontakte, Telegram-kanal",
          roles: ["admin", "head"],
          body: [
            "**«O‘zi e’lon qilinadi»** bloki — o‘z qoidalariga ko‘ra dastur orqali e’lon qilish mumkin bo‘lgan platformalar. Ular vc.ru kabi haftada bir marta qoralama oladi, kodning o‘sha tekshiruvidan o‘tadi va odamsiz chiqadi: maqola darhol **«E’lon qilinganlar»**da «o‘zi chiqdi» belgisi bilan paydo bo‘ladi, bizga havolani kod boshqalardagidek tekshiradi. Chiqmasa (platforma javob bermadi, kanal uzildi), qoralama sababi bilan **«E’lon qilinishini kutmoqda»**ga qaytadi va uni qo‘lda e’lon qilishadi.",
            "**Telegraph** (telegra.ph — Telegramning maqola sahifalari) ro‘yxatdan o‘tishni talab qilmaydi: studiya akkauntini kod birinchi maqola bilan o‘zi ochadi, uning kaliti sirlar omborida turadi. Hech narsa qilish shart emas.",
            "**VKontakte va Telegram-kanal** Postiz orqali chiqadi — bu platformalarga rasmiy ulanishi bor kechiktirilgan e’lonlar xizmati. Bir marta: postiz.com da ro‘yxatdan o‘tish, «Add Channel» tugmasini bosib studiyaning VKontakte hamjamiyatiga va Telegram-kanaliga kirish, keyin Settings → Developers → Public API → kalitdan nusxa olib, uni **«Postiz API kaliti»** maydoniga qo‘yish, **«Saqlash va tekshirish»** tugmasi. Kalit faqat Postiz uni qabul qilsa saqlanadi; panel qaytib faqat «kiritilgan» yoki «bo‘sh» ko‘rsatadi, harakatlar jurnaliga qiymatsiz yoziladi. Maydon ostidagi qator Postiz qaysi kanallarni ko‘rishini va bizning qaysi platformalarimiz o‘zi e’lon qilinishini aytadi. Postizda kanali yo‘q platforma qoralama olmaydi.",
          ],
        },
        {
          id: "publisher",
          title: "Kim e’lon qiladi",
          roles: ["admin", "head"],
          body: [
            "Pastda — **«Kim e’lon qiladi»**: qoralamalar tayyor bo‘lganda bot «📝 Статьи на площадки» kartochkasini kimga yuborishi. Hech kim tanlanmasa — kartochka egasi va rahbarga boradi, agar ularda «Jamoa»da «Hisobotlar» belgisi olib tashlanmagan bo‘lsa.",
            "Ro‘yxatda — shu bo‘lim ochiq bo‘lganlar. U egasi va rahbarga ochiq; e’lon qiladigan menejerga egasi uni [Jamoa](/admin/team) → «Bo‘limlar» belgisi bilan ochadi. Platformalardagi akkauntlar studiya nomiga ochiladi; login va parol — e’lon qiladigan odamda, panelga ular kiritilmaydi.",
          ],
        },
      ],
    },
    "/admin/ads": {
      what: "Google Ads va Yandex Direct’dagi reklama avtopiloti — studiyaning marketologlar va agentliklar uchun yangi xizmati. Kuniga bir marta u reklama kabinetining hisobotlarini olib, uchta narsani taklif qiladi: minus-so‘zlar, byudjetni qayta taqsimlash va e’lonlar testi, — har biri sababi va raqamlari bilan. Odatiy holatda o‘zi hech narsani o‘zgartirmaydi: «Qabul qilish» va «Rad etish» tugmalari bilan inson hal qiladi. Egasi va rahbarlar ko‘radi, menejerlar — yo‘q.",
      items: [
        {
          id: "what",
          title: "Avtopilot nima qiladi",
          body: [
            "**Minus-so‘zlar.** Reklama ko‘rsatilgan qidiruv so‘rovlari so‘z va so‘z juftlariga bo‘linadi, har biri bo‘yicha pul va arizalar qo‘shiladi. Odatdagi ariza narxidan kam bo‘lmagan pul sarflagan, klik yig‘gan va birorta ariza keltirmagan so‘z («bepul», «yuklab olish», «vakansiya») minusga taklif qilinadi. Qoidaga ko‘rinmaydigan, lekin aniq bu biznes haqida bo‘lmagan so‘rovlarni arzon model belgilaydi. Taklifdan oldin kod minus-so‘z kampaniyaning birorta kalit so‘ziga tegmasligini tekshiradi. Direct’da yana **kross-minuslash** bor: agar umumiy kalit so‘z («ingliz tili kurslari») va aniqlashtirilgani («bolalar uchun ingliz tili kurslari») turli guruhlarda bo‘lsa, umumiy guruhga «bolalar» minusi taklif qilinadi, shunda bunday so‘rov o‘z e’loniga boradi.",
            "**Byudjet.** Pul arizasi qimmat kampaniyadan arizasi arzon kampaniyaga o‘tadi, lekin faqat u har kuni o‘z byudjetiga tiralib qolsa. Ma’lumot kam bo‘lganda «ko‘z bilan» solishtirish aldaydi, shuning uchun avtopilot bitta kampaniya haqiqatan yaxshiroq ekanligi ehtimolini hisoblaydi va siljitishni faqat 90% va undan yuqorida taklif qiladi. Umumiy byudjet bunda o‘zgarmaydi.",
            "**E’lonlar testi.** Guruhda bitta e’lon bo‘lsa, model guruh tilida ikkinchi variantni yozadi, uzun tire, shtamp va «kafolat» yoki «eng yaxshi» kabi va’dalarsiz. 10–45 kundan keyin ko‘proq ariza keltirgani qoladi, ikkinchisi pauzaga qo‘yiladi.",
            "Kalit so‘zlar stavkalariga avtopilot tegmaydi: buni Google va Yandex o‘z strategiyalarida o‘zlari qiladi. Batafsil — `docs/ads-autopilot/design.md` da.",
          ],
        },
        {
          id: "setup",
          title: "Agentlik kabinetini qanday ochish",
          body: [
            "Chapda — kabinetlar ro‘yxati. **«Yangi kabinet»**: nomi, kimligi (studiya, agentlik yoki biznes) va tili — bot shu kabinet odamlariga shu tilda yozadi. **«Yaratish»** ni bosing, kabinet o‘ngda ochiladi.",
            "**«Odamlar»** blokiga agentlik tomonidan kabinetda ishlaydiganlarni qo‘shing: raqamli Telegram id va ism, **«Qo‘shish»** tugmasi. Ular devuz.studio/ads ga studiya boti orqali kiradi — «Telegram orqali kirish» tugmasi bir martalik havola yuboradi — va bildirishnomalar oladi. Odamni olib tashlasangiz, uning kirishi darhol ishlamay qoladi.",
            "**«Reklama kabinetini qo‘shish»**: platforma, nom, Direct’dagi mijoz logini (agentlik uchun) yoki 123-456-7890 ko‘rinishidagi Google akkaunt raqami. Keyin kabinetning o‘zida — **«Ulash»**: Yandex yoki Google sahifasi ochiladi, reklama egasi u yerda ruxsat beradi. Kalit shifrlangan holda saqlanadi, uni hech kim, studiya ham ko‘rmaydi. Ulangandan so‘ng avtopilot hisobotlarni darhol o‘zi oladi — takliflar bir-ikki daqiqada paydo bo‘ladi. Agar kabinet keyinchalik yangilanmay qolsa (ruxsat bekor qilingan, platforma rad etgan), kabinet odamlariga Telegram’da bitta xabar keladi va kabinetda sababi ko‘rinadi.",
          ],
        },
        {
          id: "proposals",
          title: "Takliflar: «Qabul qilish» va «Rad etish»",
          body: [
            "**«Takliflar»** blokida — avtopilot oxirgi 30 kunda topgan narsalar, har birining sababi oddiy so‘zlar va raqamlar bilan. **«Qabul qilish»** o‘zgarishni reklama kabinetida darhol qo‘llaydi, **«Rad etish»** taklifni olib tashlaydi. Hal qilinmagan taklif 14 kundan keyin eskiradi: undagi ma’lumotlar endi boshqa.",
            "Qo‘llashdan oldin avtopilot kabinetni hozirgi holatida yana bir bor ko‘radi. Agar byudjetni qo‘lda o‘zgartirishgan bo‘lsa, kampaniya o‘qitila boshlagan bo‘lsa yoki kalit so‘zlarga minusga tegadigan so‘z qo‘shilgan bo‘lsa, o‘zgarish qo‘llanmaydi va taklif ostida nima uchunligi yoziladi. Bu nosozlik emas, himoya.",
            "**«Hozir yangilash»** bir kunni kutmasdan hisobotlarni olib, takliflar yozadi — odatda 1–2 daqiqada, natija Telegram’ga ham keladi.",
          ],
        },
        {
          id: "limits",
          title: "Rejim, limitlar va stop-kran",
          body: [
            "**«Rejim va limitlar»** blokida ikki rejim bor. **«Taklif qilaman — siz tasdiqlaysiz»** odatiy: insonsiz hech narsa o‘zgarmaydi. **«O‘zim, limitlar doirasida»** — avtopilot takliflarni o‘zi qo‘llaydi va bu haqda Telegram’ga yozadi. Uni agentlik bir-ikki hafta takliflarni qabul qilib, ular bilan rozi bo‘lganda yoqish kerak.",
            "Limitlar: bitta kampaniya byudjetini bir martada necha foizga siljitish mumkin (odatda 20, 30 dan ortig‘i umuman mumkin emas) va avtopilot bir kunda o‘zi nechta o‘zgarish qila oladi. Minus-so‘zlar uchun chegaralar, o‘z ariza narxingiz, minus qilib bo‘lmaydigan so‘zlar (brend, shahar, xizmat) va biznes haqida bir-ikki jumla keraksiz so‘rovlarni aniqroq ajratishga yordam beradi.",
            "Hech qaysi rejimda o‘zgarmaydigan narsalar: umumiy byudjet oshmaydi, o‘qitilayotgan kampaniyalarga tegilmaydi, minus-so‘z kalit so‘zlarga tegmaydi, bitta kampaniya byudjeti 3 kunda bir martadan ko‘p o‘zgarmaydi, hech narsa o‘chirilmaydi — faqat pauza. **«Stop-kran: barcha o‘zgarishlarni to‘xtatish»** hammasini, «Qabul qilish» tugmasini ham to‘xtatadi; qilinganni u bosilganda ham qaytarish mumkin.",
          ],
        },
        {
          id: "journal",
          title: "Jurnal, qaytarish va hafta hisoboti",
          body: [
            "**«Jurnal»** da har bir o‘zgarish: qachon, kim (inson yoki avtopilot, «o‘zi» belgisi), nima bo‘lgan va nima uchun. **«Qaytarish»** bir bosishda avvalgi holatga qaytaradi: minus-so‘zlar — faqat biz qo‘shganlari, byudjet — faqat o‘shandan beri qo‘lda o‘zgartirilmagan bo‘lsa, e’lon — yana yoqiladi yoki pauzaga qo‘yiladi. Rejim almashishi va stop-kran ham jurnalga yoziladi.",
            "**«7 kun ichida»** bloki nechta o‘zgarish qo‘llanganini, minus-so‘zlar oyiga qancha pulni keraksiz so‘rovlarga yo‘l qo‘ymayotganini va nechta taklif qaror kutayotganini ko‘rsatadi. Hafta hisoboti kabinet odamlariga dushanba kunlari soat 09:00 dan keyin Telegram’ga keladi; **«Hafta hisobotini Telegram’ga yuborish»** uni sizga hozir yuboradi.",
          ],
        },
        {
          id: "alerts",
          title: "Ogohlantirishlar",
          body: [
            "Kuniga bir marta, yangilanish bilan birga, avtopilot kechagi kunni odatdagisi — undan oldingi yetti kunning o‘rtachasi bilan solishtiradi. Ogohlantirish chiqadi, agar kampaniya kecha odatda sarflasa ham hech narsa sarflamagan bo‘lsa; agar sarf ikki baravar oshib, arizalar ko‘paymagan bo‘lsa; agar odatdagi pulda birorta ham ariza kelmagan bo‘lsa (odatda bu buzilgan forma yoki Metrikadagi maqsad); agar platforma e’lonni rad etgan bo‘lsa; agar minus-so‘z kampaniya kalit so‘zini kesayotgan bo‘lsa.",
            "Har bir ogohlantirish kabinet odamlariga Telegram’ga bir marta keladi va kabinet tepasida sariq **«Ogohlantirishlar»** bloki sifatida ko‘rinadi. Sabab yo‘qolganda — masalan, kampaniya yana sarflay boshlasa — ogohlantirish o‘zi yo‘qoladi, hech narsa bosish shart emas. Avtopilotning o‘zi ogohlantirishlar bo‘yicha hech narsani o‘zgartirmaydi: bu insonga signal.",
          ],
        },
        {
          id: "stub",
          title: "Namuna: reklama kabinetisiz sinov",
          body: [
            "**«Namuna (sinov)»** platformasi — Toshkentdagi o‘quv markazi, so‘mda haqiqatga yaqin raqamlar bilan. Unda hammasi ko‘rinadi: takliflar, «Qabul qilish», jurnal va qaytarish, — va hech bir haqiqiy reklama kabinetida hech narsa sodir bo‘lmaydi. Agentlikka ulashdan oldin ko‘rsatish uchun qulay.",
            "**«7 kunni o‘tkazish»** faqat namunada va faqat panelda bor: e’lonlar testi ikki haftani kutmasdan natijaga yetishi uchun bir haftalik ko‘rsatishlarni qo‘shadi.",
          ],
        },
        {
          id: "keys",
          title: "Kalitlar va yoqish",
          roles: ["admin"],
          body: [
            "Fon rejimidagi yurishlarni `ADS_AUTOPILOT=1` yoqadi (`/opt/devuz/.env` da yoki maxfiy ma’lumotlar omborida `app.ADS_AUTOPILOT` sifatida); usiz faqat tugmalar ishlaydi. Mijozlar kalitlari `ADS_TOKEN_KEY` bilan shifrlanadi — base64 dagi 32 tasodifiy bayt; uni almashtirish barcha kabinetlarni qayta ulash demakdir.",
            "«Ulash» tugmasi uchun ilova kalitlari kerak: `YANDEX_DIRECT_CLIENT_ID` va `YANDEX_DIRECT_CLIENT_SECRET`, `GOOGLE_ADS_CLIENT_ID` va `GOOGLE_ADS_CLIENT_SECRET`. Ularni qanday olish va Yandex hamda Google’ga nima topshirish — `docs/ads-autopilot/api-access.md` da qadamma-qadam. Model sarfi `model_usage` da `ads-negatives` va `ads-copy` belgilari bilan ko‘rinadi.",
          ],
        },
        {
          id: "google",
          title: "Google: kalitlar va kalit so‘zlar rejalashtiruvchisi",
          roles: ["admin", "head"],
          body: [
            "Google Ads kalit so‘zlar rejalashtiruvchisi iborani Google’da oyiga necha marta qidirishlarini aytadi. 07.11.2026 dan u Trends va Wordstat bilan birga har bir maqola uchun uchinchi manba: sayt maqolalari o‘z tilining hududini ko‘radi (ruscha versiya — Rossiya, O‘zbekiston, Qozog‘iston, Belarus va Qirg‘izistonni birga, o‘zbekcha — O‘zbekistonni, inglizcha — AQSH, Buyuk Britaniya va Kanadani, polyakcha — Polshani), platformalardagi maqolalar Rossiyani ko‘radi. Eng ko‘p qidirilgan iboralarni model birinchi bo‘lib oladi. Ulanmagan bo‘lsa — maqolalar avvalgidek, usiz chiqadi.",
            "Google’da bir marta nima qilish kerak (egasi; xuddi shu qadamlar «1-qadam — …» so‘zlari bilan — **«Google ilovasi kalitlari»** blokining o‘zida, rejalashtiruvchi ishlamaguncha): console.cloud.google.com da — loyiha, unda «Google Ads API» → Enable. «OAuth consent screen»: turi External, holati In production, brending — nom, logotip, pochta, sayt https://devuz.studio, siyosat https://devuz.studio/ru/privacy, domen devuz.studio → «Verify branding». «Credentials» → «OAuth client ID» → Web application, Authorized redirect URI ga — **«Google ilovasi kalitlari»** blokidagi manzil (**«Nusxa olish»** tugmasi). Client ID va sirni shu blokka qo‘ying va **«Saqlash»**ni bosing.",
            "Kirish darajasi: «Google Ads API» → «Overview» → «Upgrade access level» → «Apply for access», avval Explorer, keyin Basic. Rejalashtiruvchini Google faqat Basic dan ochadi; daraja pastroq bo‘lsa, **«Tekshirish»** shuni aytadi. Brend tekshiruvidan keyin Basic odatda bir necha daqiqada beriladi.",
            "Kabinet: chapda kabinet yarating (studiya), 10 raqamli raqam bilan Google reklama kabinetini qo‘shing (u ads.google.com tepasida) va undagi «Ulash»ni bosing — shu kabinetga kirish huquqi bor akkaunt bilan kiring. Keyin **«Kalit so‘zlar rejalashtiruvchisi»** blokida uni tanlang (bittasi bo‘lsa, o‘zi olinadi) va **«Tekshirish»**ni bosing: «ishlaydi» deb javob berishi va eng ko‘p nima qidirilishini ko‘rsatishi kerak. Avtopilot bu kabinetda o‘zi hech narsani o‘zgartirmaydi, faqat taklif qiladi.",
          ],
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
            "[Loyihani](/admin/projects) oching → «Shartnoma» bloki. Tepada — [«Maketdan tarkib»](#contracts-compose): maketni tanlang, smeta, summa, predmet va muddat o‘zi qo‘yiladi. Buyurtmachi rekvizitlarini bitta matn bilan «Rekvizitlarni qo‘yish» maydoniga qo‘ying va «Maydonlarga taqsimlash» tugmasini bosing. Qolgani — sana va bosqichlar: **bosqichlar ulushlari yig‘indisi — roppa-rosa 100%**. **«Shartnomani tayyorlash»** tugmasini bosing — shartnoma tayyorlanayotganda tugma kulrang, ikkinchi bosish ketmaydi.",
            "Natijada DU-2026-07 ko‘rinishidagi raqamli qoralama chiqadi. Loyihada shartnoma allaqachon bo‘lsa, «Shartnomani tayyorlash» uni ochadi, ikkinchisi paydo bo‘lmaydi. Qoralamada imzo hujjatda jismonan yo‘q — uni chop etib, imzolangan deb ko‘rsatib bo‘lmaydi.",
            "Smeta chegarasidan past summani tayyorlab bo‘lmaydi — buni faqat egasi hal qiladi. Shartnomaga imzogacha nima yetishmasligi darhol ko‘rinadi: loyihadagi shartnoma kartochkasida va hujjat ustida, «Imzoga yuborish» yonida ro‘yxat bilan. Rekvizitlarni qoralamada to‘ldirish mumkin — «Buyurtmachi rekvizitlari» bloki, «Rekvizitlarni saqlash» tugmasi.",
          ],
        },
        {
          id: "compose",
          title: "«Maketdan tarkib» va «Rekvizitlarni qo‘yish»",
          body: [
            "«Maketdan tarkib» — loyihadagi shartnoma formasida va qoralamada. Maketni tanlang: pastda asos va narxlari bilan qo‘shimchalar — mijoz maketdagi narx konstruktorida ko‘rganining aynan o‘zi. ★ belgili qo‘shimchalar darhol kiritilgan (maket shular uchun), keraksizini olib tashlang va mijoz olganini belgilang. Pastda — uchtagacha o‘z qatorlaringiz «nomi + narx»: narx 0 — bu sovg‘a, qator smetaga «(в подарок)» bilan tushadi. Jami shu yerda hisoblanadi.",
            "«Shartnomani tayyorlash» bosilganda (qoralamada — «Shartnomaga qo‘yish») kod o‘zi smeta qatorlarini, shartnoma summasini, predmetni («… с дополнительными функциями: …») va maket rejasida bo‘lsa muddatni qo‘yadi — «до 5 недель с даты аванса»; siz yozib qo‘ygan muddat almashtirilmaydi. Bu yerda model yo‘q: narxlar maketdan shundayligicha olinadi. Maket ro‘yxatda bo‘lmasa — uning konstruktori boshqa shaklda yoki narxlari dollarda emas; unda smeta fayl bilan yoki qatorlar qo‘lda, avvalgidek.",
            "«Rekvizitlarni qo‘yish» — mijoz yuborgan matnni qo‘ying va «Maydonlarga taqsimlash» tugmasini bosing. Kod nomini (MChJ «…», YaTT …), manzilni, STIR (9 raqam) yoki JShShIR (14), hisob raqamini (20 raqam, bo‘shliqlarni olib tashlaydi), MFO (5), bankni topadi; QQS to‘lovchi kodi, IFUT va direktorni «Buyurtmachining manzili va kontakti» maydoniga yozadi. Topilmagani — maydon bo‘sh, tugma ostida nimani qo‘lda yozish kerakligi yoziladi. Hech narsa taxmin qilinmaydi: maydonlarni ko‘z bilan tekshiring.",
          ],
        },
        {
          id: "to-sign",
          title: "«Imzolanadigan shartnomalar»",
          roles: ["admin"],
          body: [
            "Sahifadagi birinchi blok — menejerlar sizga imzoga yuborgan shartnomalar: raqam, loyiha va summa. Qatorni bosing — «Tasdiqlash va imzolash» va «Qayta ishlashga qaytarish» tugmalari bilan shartnoma ochiladi. Bo‘sh bo‘lsa — «Imzo kutayotgan hech narsa yo‘q».",
            "Ilgari bu ro‘yxat «Lidlar»ning «Bugun» varag‘ida edi. Endi bo‘limda, boshqalar kabi, menyuli sarlavha bor; sarlavhasiz faqat shartnoma va hisobning o‘z sahifalari qoldi — bu chop etish uchun hujjatlar va buyurtmachiga havolalar.",
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
              "Loyiha kartochkasida imzoingizni kutayotgan shartnomada «Ochish va imzolash» tugmasi bor.",
              "Imzoga shartnoma sizga Telegramda keladi va «Bosh sahifa»dagi «E’tibor talab qiladi»da hamda [Shartnomalar](/admin/contracts) bo‘limida ko‘rinadi. Tugmalar: **«Tasdiqlash va imzolash»** yoki **«Qayta ishlashga qaytarish»**. Qaytarish — ishning oddiy qismi, xato emas.",
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
          id: "payer",
          title: "Kim to‘lagan",
          body: {
            head: [
              "Har bir xarajatda «Kim to‘lagan» bor. «Birgalikda, 70/30» — studiyaning umumiy pulidan to‘langan: xarajat bo‘linadigan summani kamaytiradi va ikkalangizga ulushlar bo‘yicha tushadi. Eski xarajatlar ham, boshqasi qo‘yilmaguncha, shunday turadi.",
              "Kimdir bitta o‘z pulidan to‘lagan bo‘lsa — uni yozishda yoki keyin xarajat qatorida tanlang va «Saqlash» ni bosing. Bu summa unga bo‘linishdan oldin kelgan puldan qaytariladi: qatorda «$… qaytarish», muassis kartasida «o‘zi to‘lagan: …» ko‘rinadi. Xarajatning o‘zi baribir ulushlar bo‘yicha bo‘linadi: to‘lagan odamga qaytarildi, qoldig‘i bo‘lindi.",
              "Har kim o‘z qismini o‘z pulidan to‘lagan bo‘lsa — xarajatni ikki qator qilib yozing, har birida o‘z ismi. Belgini siz va egasi qo‘yasiz; har bir o‘zgarishni egasi jurnalda ko‘radi: «o‘zi to‘lagan» odamga qaytarish qo‘shadi.",
            ],
            admin: [
              "Har bir xarajatda «Kim to‘lagan» bor. «Birgalikda, 70/30» — studiyaning umumiy pulidan to‘langan: xarajat bo‘linadigan summani kamaytiradi va ikkalangizga ulushlar bo‘yicha tushadi. Eski xarajatlar ham, boshqasi qo‘yilmaguncha, shunday turadi.",
              "Kimdir bitta o‘z pulidan to‘lagan bo‘lsa — uni yozishda yoki keyin xarajat qatorida tanlang va «Saqlash» ni bosing. Bu summa unga bo‘linishdan oldin kelgan puldan qaytariladi: qatorda «$… qaytarish», muassis kartasida «o‘zi to‘lagan: …», [«Moliya»](/admin/finance) bo‘limidagi «Hammuassislar ulushlari» da esa «ulush + xarajatlar uchun qaytarish = to‘lanadi» ko‘rinadi.",
              "Har kim o‘z qismini o‘z pulidan to‘lagan bo‘lsa — xarajatni ikki qator qilib yozing, har birida o‘z ismi. Belgini siz va muassis-rahbar qo‘yasiz; har bir o‘zgarish [«Jurnal»](/admin/audit) da avval nima edi va endi nima bo‘ldi, shu bilan yoziladi: «o‘zi to‘lagan» odamga qaytarish qo‘shadi.",
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
            "Rahbar qo‘shimcha ravishda o‘z jamoasi menejerlarining har bir bitimidan 5% oladi — ustiga, ularning ulushidan emas. Muassis-rahbarda bu qator 0: u baribir qolgan hamma narsadan ulush oladi. Agentlikni olib kelib, uni [Agentliklar](/admin/agencies) bo‘limida qo‘shgan odam esa 12 oy davomida shu agentlikning har bir loyihasi summasidan yana 5% oladi — «hamkorni olib kelgan» qatori, foydadan emas, shartnoma summasidan.",
            "Egasi aniq bitim uchun foiz belgilashi mumkin — u daraja va shaxsiy stavkadan muhimroq. Hisoblanma loyihada summa va mas’ul bo‘lganda paydo bo‘ladi. Bitim minusga ketdi — hisoblanma 0: minus — egasining tashvishi.",
          ],
        },
        {
          id: "grade",
          title: "Bitimlar bo‘yicha grade va «Bitimlar uchun mukofot»",
          body: [
            "2026-yil 1-noyabrdan menejerning yangi mijozdan foizi o‘tgan oy bitimlariga bog‘liq: 10%, o‘tgan kalendar oyida 3 ta va undan ko‘p bitim bo‘lsa — 15%. Bitim — birinchi to‘lovli loyiha, shu to‘lov oyiga hisoblanadi. Shaxsiy stavka asos bo‘lib qoladi, bitim bo‘yicha qo‘lda qo‘yilgan foizlar qoidadan kuchliroq, qo‘shimcha sotuvlar va rahbar — avvalgidek. 1-noyabrgacha hammasi grade bo‘yicha hisoblanadi.",
            "Foizdan tashqari — oyning har 3 ta bitimi uchun $200 mukofot (1-noyabrdan boshlab bitimlar uchun). U darhol topilgan va to‘lanadigan summaga kiradi, «Bitimlar uchun mukofot» bloki esa kimga, qaysi oy uchun va nechta bitim ekanini ko‘rsatadi. Mukofotni odamning hisob-kitoblarini ko‘radiganlar ko‘radi.",
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
              "Odamlar jadvali va «Loyihalar bo‘yicha» — soliq, tannarx, foyda va «Egasiga» (hamkorlar ayirilgan) ustunlari bilan. «Hammuassislar ulushlari» — kelgan pul minus hamkorlar va agentliklar ulushi va minus xarajatlar, u qanday bo‘linadi va xarajatni o‘z pulidan to‘laganga qancha qaytariladi (ulush + xarajatlar uchun qaytarish = to‘lanadi). «Studiya xarajatlari» — [«Xarajatlar»](/admin/expenses) bo‘limidagi ro‘yxatning o‘zi.",
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
        {
          id: "cash",
          title: "Kassa, kutilayotgan to‘lovlar va soliqlar",
          roles: ["admin"],
          body: [
            "Bo‘lim pastida — «Oylar bo‘yicha kassa»: yarim yillik tushumlar va xarajatlar, har oy ostida — farq. Yonida — «Kutilayotgan to‘lovlar»: faol loyihalar bo‘yicha yana qancha to‘lanishi kerakligi va ularni kim olib borayotgani, hamda «Yaqin ikki haftadagi soliqlar va hisobotlar». Ilgari bu «Lidlar»dagi «Pul» varag‘i edi.",
            "Raqamlar «Moliya»ning boshqa bloklari bilan bir xil yozuvlardan olinadi: tushumlar — loyihalar bo‘yicha mijoz to‘lovlari, xarajatlar — [Xarajatlar](/admin/expenses) bo‘limi yozuvlari. Ularni faqat siz ko‘rasiz.",
          ],
        },
      ],
    },

    /* ── Релизы ───────────────────────────────────────────────────────── */
    "/admin/releases": {
      what: "«Do‘kon buyurtmalari» bo‘limida to‘lovdan keyin xaridorlar oladigan tayyor mahsulot fayllari. Faylni joylash — allaqachon to‘lagan har bir kishi aynan nimani olishini hal qilish demak, shuning uchun bo‘lim faqat egasida.",
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
            "Tepada `DOWNLOAD_SIGNING_SECRET` haqida ogohlantirish bo‘lsa — yuklab olish hech kimda ishlamaydi. Kirishni yopish — [«Do‘kon buyurtmalari»](/admin/orders) bo‘limidagi buyurtma kartochkasidagi tugma bilan.",
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
              "Qolgan belgilar faqat Telegramdagi xabarni olib tashlaydi — ishning o‘zi panelda qoladi: eslatma lid kartochkasida ko‘rinadi, kunlik to‘plam — [«Sovuq aloqalar»](/admin/prospect)da, mijozning aloqaga javobi — o‘sha yerda. «Mijozlarning aloqalarga javoblari»ni olib tashlasangiz, menejer o‘zi «Sovuq aloqalar»ga kirmaguncha mijoz javob kutib qolishi mumkin — faqat javoblarni boshqa odam olib borsa, olib tashlang. **«Ertalabki salom 09:00 da»** — har kuni ertalab bot odamga ismi bilan, uning panel tilida xayrli kun tilaydi; agar bu unga kerak bo‘lmasa, olib tashlang. **«Kun boshlanmagan bo‘lsa, 12:00 dagi eslatma»** — tushda bot odamga, agar kun davomida hali aloqa va panel bo‘lmasa, to‘plamni eslatadi; olib tashlash shart emas — jimlik haqida soat 15:00 da baribir bilib olasiz.",
              "O‘chirilmaydi: panelga taklif, rol va rahbar almashishi, lidni berishni tasdiqlash so‘rovi — bu xabarlarsiz amal bajarilmaydi. Menejerlarga belgilarni siz va egasi o‘zgartirasiz; menejerlarning o‘zi ularni ko‘rmaydi. Kim va qachon o‘zgartirgani — jurnalda.",
            ],
            admin: [
              "Oxirgi ustunda har bir xodimda (va sizda) **«Bildirishnomalar»** qatori bor — yonida «hammasi keladi» yoki «o‘chirilgan: 8 tadan 2 tasi». Bosing: belgilar ochiladi, turgan bo‘lsa — bot yuboradi, olib tashlansa — yo‘q. **«Saqlash»**. Sukut bo‘yicha hammada hammasi turadi. Loyihalar rahbari ham belgilarni o‘zgartiradi — o‘z menejerlariga va o‘ziga, lekin boshqa rahbarga va sizga emas.",
              "Har bir rolning o‘z to‘plami bor. Menejerda — navbat bo‘yicha va hamma uchun arizalar, eslatmalar, lid chatidagi xabarlar, berishlar, aloqalarga javoblar, kunlik to‘plam, haftalik tavsiyalar, vazifalar va «Ertalabki salom 09:00 da» — har kuni ertalab, dam olish kunlari ham, ismi bilan xayrli kun tilagi. Rahbarda yana hisobotlar. Sizda — «Navbat takliflari nusxalari» (navbat lidni kimga va qachon taklif qilgani), hisobotlar va vazifalar, navbat va to‘plamsiz: siz navbatda turmaysiz. Ertalabki salom sizga kelmaydi — u xodimlar uchun. Menejer va rahbarda yana «Kun boshlanmagan bo‘lsa, 12:00 dagi eslatma» bor — tushgacha hech narsa qilmaganga to‘plam haqida shaxsiy eslatma. «🔕 К 15:00 молчат» qatori sizga va rahbarlarga «Hisobotlar» ostida keladi.",
              "Asosiy belgi — **«Navbat bo‘yicha yangi buyurtmalar»**: usiz odam [navbatdan](#leads-queue) chiqadi, lidlar keyingisiga ketadi. Qolganlari faqat Telegramdagi xabarni olib tashlaydi, ish panelda qoladi. Agar hammada «Hamma uchun buyurtmalar» olib tashlansa, tungi arizalarni va aloqalar bo‘yicha «🔥 Нужен прототип»ni Telegramda hech kim ko‘rmaydi — faqat panelda va sotuv chatida, agar u bo‘lsa. Aloqa muallifiga «🛠 Хотят прототип» har doim keladi — birinchi bo‘lib va 30 daqiqaga.",
              "O‘chirilmaydi: taklif, rol va rahbar almashishi, berishni tasdiqlash so‘rovi, sizga pul va shartnomalar haqidagi xabarlar. Belgilarni kim va qachon o‘zgartirgani — [jurnalda](/admin/audit).",
            ],
          },
        },
        {
          id: "lead-kinds",
          title: "Xodim uchun «Qaysi lidlarni yuborish»",
          roles: ["admin", "head"],
          body: [
            "Xodim ismi ostida, «Bildirishnomalar» yonida — **«Lidlar · barcha turlar»** yoki «Lidlar · 7 turdan 4 ta» qatori. Bosing: «Qaysi lidlarni yuborish» yettita belgisi ochiladi — «Sovuq aloqalar», «Tenderlar», «Guruhlardan signallar (skaut)», «Hamkorlar va agentliklar», «Sayt va botdan buyurtmalar», «Botdan maket», «SI bo‘yicha yordam (Claudery)». Ortiqchasini olib tashlang va **«Saqlash»** ni bosing. Xodimning o‘zi ham xuddi shu belgilarni [Sozlamalar](/admin/settings)da qo‘yadi, shuning uchun sizdan keyin ham o‘zgartirishi mumkin; kim va qachon o‘zgartirgani — jurnalda.",
            "Olib tashlangan tur xodimga kelmaydi va [navbat](#leads-queue) uni taklif qilmaydi: lid bu turni tanlaganlarga ketadi. Hech kim tanlamagan bo‘lsa — lid avvalgidek hammaga ketadi, sizga esa har bir lid uchun bir marta «🧭 … hech kim tanlamadi» qatori keladi («Hisobotlar» ostida). Tungi teng ulush va «Limitsiz lidlar» avvalgidek butun navbat bo‘yicha hisoblanadi.",
          ],
        },
        {
          id: "sections",
          title: "Bo‘limlarga kirish: egasining belgilari",
          roles: ["admin"],
          body: [
            "Oxirgi ustunda har bir rahbar va menejerda **«Bo‘limlar»** qatori bor — yonida «roldagidek» yoki roldan tashqari nechta bo‘lim ochganingiz va nechtasini yopganingiz yozilgan. Bosing — panelning barcha bo‘limlari belgilar bilan ochiladi: belgi odam hozir ko‘rayotgan bo‘limlarda turadi, «roldagidek emas» esa siz allaqachon o‘zgartirgan joyda. Belgi qo‘ydingiz — bo‘lim uning menyusida paydo bo‘ladi va ochiladi; olib tashladingiz — menyudan yo‘qoladi, to‘g‘ridan-to‘g‘ri havola bo‘yicha esa panel uni «Lidlar»ga olib boradi. **«Saqlash»** ni bosing: o‘zgarish darhol kuchga kiradi, odamga qayta kirish shart emas. Har bir saqlash [jurnal](/admin/audit)ga yoziladi.",
            "Belgi **ko‘rish** huquqini beradi: odam bo‘limni, undagi hamma narsani va unga yo‘riqnomani ko‘radi — bo‘lim unga ega tomonidan ochilgani haqidagi belgi bilan. Bo‘limda nimani o‘zgartira olishini avvalgidek rol hal qiladi. «Hamkorlar» ochib berilgan menejer hamkorlarni ko‘radi, lekin to‘lovlar, stavkalar va o‘chirish bo‘yicha qarorlar sizda qoladi; rolida yo‘q tugmani bossa — panel hech narsani o‘zgartirmaydi va uni «Lidlar»ga olib boradi. Odam bo‘limda to‘liq ishlashi uchun uning rolini o‘zgartiring.",
            "«Lidlar» va «Yo‘riqnoma» hammaga doim ochiq, shuning uchun ular ro‘yxatda yo‘q. Sizga hammasi ochiq. Faqat siz o‘zgartirgan narsa saqlanadi: keyin odamning rolini o‘zgartirsangiz, siz tegmagan bo‘limlar o‘zi yangi roldagidek bo‘ladi, belgilaringiz esa qoladi.",
          ],
        },
        {
          id: "unlimited",
          title: "Lidlar cheklovi: kimga tungi ulush kerak emas",
          roles: ["admin"],
          body: [
            "Menejer va rahbarlarda oxirgi ustunda **«Lidlar: kechasi teng ulush bo‘yicha»** qatori va **«Cheklovni olib tashlash»** tugmasi bor. Kechasi, 18:00 dan 08:00 gacha, lid navbatdagi hammaga ochiq, lekin har kim oyiga teng ulushdan ko‘p olmaydi: shunda bitta uxlamagan odam hammasini olib ketmaydi. «Cheklovni olib tashlash» ni bosdingiz — qator **«Lidlar: cheklovsiz»** bo‘ladi va bu odam kechasi lidlarni xohlagancha oladi. **«Cheklovni qaytarish»** ulushni qaytaradi. Sizning 23.10.2026 dagi qaroringiz: Dina va Aleksandr cheklovsiz ishlaydi.",
            "Kunduzi hech narsa o‘zgarmaydi: lid avvalgidek navbati kelgan odamga 30 daqiqaga taklif qilinadi va bu yarim soatda boshqaning lidini olib bo‘lmaydi. Cheklovsiz olingan lidlar oyning umumiy hisobiga kiradi, shuning uchun boshqalarning ulushi bundan faqat oshadi. O‘zgarish darhol ishlaydi, har bir bosish [jurnal](/admin/audit) ga «xodimga lidlar cheklovini olib tashladi yoki qaytardi» qatori bilan yoziladi. Tugmani faqat siz ko‘rasiz.",
          ],
        },
        {
          id: "details",
          title: "Xodim ma’lumotlari: F.I.Sh., paneldagi ism, username, telefon",
          roles: ["admin", "head"],
          body: {
            head: [
              "O‘zingizda ham, har bir menejerda ham oxirgi ustunda **«Ma’lumotlarni o‘zgartirish»** bor. U yerda to‘rtta maydon: **«F.I.Sh.»** — to‘liq, shartnomalar uchun; **«Paneldagi ism»** — qisqa, lidlar va vazifalar shu bilan imzolanadi, uni hamma ko‘radi; **«Username»** — Telegramdagi @; **«Telefon»**. To‘g‘rilang va **«Ma’lumotlarni saqlash»** tugmasini bosing. Shundan keyin F.I.Sh. va telefon xodim qatorida ism ostida va Telegram id ostida ko‘rinadi.",
              "Yangi ism yoki username xodimning barcha lidlarida darhol paydo bo‘ladi — lidlar ro‘yxatida holat ostida. Telegram id bu yerda o‘zgarmaydi: odam panelga bot orqali shu bilan kiradi. Ikkinchi rahbar va egasining ma’lumotlarini faqat egasi o‘zgartiradi; menejerlar o‘z ma’lumotlarini o‘zgartira olmaydi.",
            ],
            admin: [
              "Har bir xodimda, sizda ham, oxirgi ustunda **«Ma’lumotlarni o‘zgartirish»** bor: **«F.I.Sh.»** (to‘liq, shartnomalar uchun), **«Paneldagi ism»** (qisqa, lidlar va vazifalar shu bilan imzolanadi), **«Username»** (Telegramdagi @) va **«Telefon»**. To‘g‘rilang va **«Ma’lumotlarni saqlash»** tugmasini bosing; F.I.Sh. va telefon xodim qatorida ism ostida va Telegram id ostida ko‘rinadi.",
              "Yangi ism yoki username xodimning barcha lidlarida darhol paydo bo‘ladi — ro‘yxatda holat ostida. Telegram id o‘zgarmaydi: bot orqali kirish shu bilan. Rahbar ma’lumotlarni o‘ziga va menejerlarga o‘zgartiradi, menejerlar — hech kimga. Kim nimani o‘zgartirgani — [jurnalda](/admin/audit).",
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
        {
          id: "app-devices",
          title: "Ilova va bildirishnomalar: kimda yoqilgan",
          roles: ["admin", "head"],
          body: [
            "Har bir xodim ismi ostida — «📱 Ilova: N ta qurilma» yoki «📱 Ilova: yoqilmagan» qatori. Bu odam panel bildirishnomalarini yoqqan telefon va kompyuterlar soni; sichqonchani olib boring — qaysilari ekanini ko‘rasiz («iPhone · app», «Android · Chrome», «Windows · Chrome»). Ilovani qanday o‘rnatish va bildirishnomalarni yoqish — [«Bosh sahifa» yo‘riqnomasida](/admin/help#hq-app).",
            "Bildirishnomalar bot xabarlarini takrorlaydi, shuning uchun yuqoridagi belgilar ham ularga ta’sir qiladi: belgini olib tashladingiz — na Telegramga, na ilovaga keladi. [Bosh sahifa](/admin/hq)dagi «Xodimlarga» yorlig‘idagi xabaringiz ham ilovaga keladi; «Bot foydalanuvchilariga» xabari — yo‘q, u yerda xodimlar yo‘q.",
            "O‘zingizda oxirgi ustunda — «Shu qurilma: bildirishnomalar yoqilgan» yoki «o‘chirilgan», «Bildirishnomalarni yoqish», «Tekshirish» va «O‘chirish» tugmalari bilan. Bu siz hozir qarab turgan telefon yoki kompyuter haqida: boshqa odamga bu yerdan bildirishnomalarni yoqib bo‘lmaydi — faqat u o‘zi, o‘z qurilmasida. Obunani bekor qilgan yoki ilovani o‘chirgan qurilma birinchi bildirishnomadayoq hisobdan o‘zi chiqib ketadi.",
          ],
        },
      ],
    },

    /* ── Партнёры ─────────────────────────────────────────────────────── */
    "/admin/partners": {
      what: "O‘z havolasi yoki promokodi bilan mijoz olib keladigan va loyiha summasidan foiz oladigan odamlar. Bu yerda ularning havolalari, mijozlari, hisoblanmalari, to‘lov so‘rovlari va o‘zlarida joylaydigan promo materiallar. Bo‘lim egasi va rahbarda. To‘lov bo‘yicha qaror, hamkorning shaxsiy stavkasi va hamkorni o‘chirish — faqat egasida: bu begona odamlarga beriladigan pul.",
      items: [
        {
          id: "join",
          title: "Hamkor qanday paydo bo‘ladi",
          body: [
            "O‘zi: saytda «Зарабатывай с нами» menyusida «Стать партнёром» yoki «Войти в кабинет» ni bosadi — bot uni ro‘yxatga oladi va hamkor kabinetiga bir martalik kirish tugmasini yuboradi. Botdagi /ref va /cabinet buyruqlari ham shunday. Studiya xodimlaridan tashqari har kim bo‘la oladi: bot Telegramni xodimlar ro‘yxati bilan solishtiradi va ro‘yxatga olish o‘rniga dastur jamoa uchun yopiqligini aytadi — xodimlarning mijozlari panelda hisoblanadi. Avval qo‘shilgan yozuv ham xodimga hech narsa ochmaydi: na havolalar, na to‘lovlar, na kabinet.",
            "Yoki siz: «Hamkorni qo‘lda qo‘shish» — ism, kod (bo‘sh — o‘zimiz o‘ylab topamiz), Telegram id ixtiyoriy, izoh. Telegram id bo‘lmasa, bunday hamkor keyin bot orqali kelgan odam bilan birlashmaydi va kabinetga kira olmaydi. Xodimning Telegram id sini panel qabul qilmaydi. Telegrami xodimniki bo‘lgan hamkorlarni «Barcha hamkorlar» jadvali «studiya xodimi» deb belgilaydi.",
            "Havolalar: qisqa `devuz.studio/r/…` — hamkor aynan shuni e’lon qiladi, har bir kanal uchun alohida (kabinetda yoki `/ref KOD belgi`), 20 tagacha. Kabinetda hamkor havola qayerga olib borishini (bosh sahifa, xizmatlar, keyslar, bot) va auditoriya uchun bonusni — birinchi loyihaga 5/10/15% chegirmani tanlaydi. Eski `?ref=KOD` va `start=ref_KOD` avvalgidek ishlaydi. Havola orqali o‘tishni sayt brauzer cookie’sida 30 kun eslab qoladi (birinchi hamkor yutadi): shu vaqt ichidagi so‘rov — hamkorning mijozi, hatto odam keyin havolasiz qaytgan bo‘lsa ham. Lid kartochkasida «Hamkor» yonida o‘tish so‘rovdan necha kun oldin bo‘lgani ko‘rinadi. Botda ham xuddi shu 30 kun.",
            "O‘tishlar odamlar bo‘yicha hisoblanadi: messenjerdagi oldindan ko‘rish roboti va o‘sha kuni o‘sha odamning qayta ochishi hisoblanmaydi. Quyidagi jadvalda havolada — «o‘tishlar / so‘rovlar»; kod ustiga kursorni olib borsangiz — qisqa manzilni ko‘rasiz.",
          ],
        },
        {
          id: "count",
          title: "Mijoz qachon hisobga olinadi",
          body: {
            head: [
              "Havola orqali kelgan lid hamkorga hisoblanadi, agar bu uning o‘zi bo‘lmasa, mijoz oldin bizda bo‘lmagan bo‘lsa va hamkor bloklanmagan bo‘lsa. Hisoblandi — hamkorga «🤝 По вашей ссылке пришёл…» keladi. Mijoz saytga havola orqali kelib, keyin sayt chatidan botga yozsa ham, hamkor unga biriktirilgan bo‘lib qoladi.",
              "Bunday liddan ochilgan loyiha hamkorni meros oladi. Loyiha kartochkasida kim olib kelganini, foizni va «Hisobga olmaslik sababi»ni faqat egasi o‘zgartira oladi. Loyiha bo‘yicha imzolangan shartnoma skanini yuklashganda, hamkorga darhol «📝 С клиентом … подписан договор» keladi — summa va taxminiy ulush bilan.",
              "Bloklash faqat yangi hisoblashlarni to‘xtatadi: eski hisoblanmalar va to‘lovlar qoladi.",
            ],
            admin: [
              "Havola orqali kelgan lid hamkorga hisoblanadi, agar bu uning o‘zi bo‘lmasa, mijoz oldin bizda bo‘lmagan bo‘lsa va hamkor bloklanmagan bo‘lsa. Hisoblandi — hamkorga «🤝 По вашей ссылке пришёл…» keladi. Mijoz saytga havola orqali kelib, keyin sayt chatidan botga yozsa ham, hamkor unga biriktirilgan bo‘lib qoladi.",
              "Bunday liddan ochilgan loyiha hamkorni meros oladi. Loyiha kartochkasida, «Hamkor» blokida kim olib kelganini, foizni va «Hisobga olmaslik sababi»ni o‘zgartirish mumkin. Loyiha bo‘yicha imzolangan shartnoma skanini yuklashganda, hamkorga darhol «📝 С клиентом … подписан договор» keladi — summa va taxminiy ulush bilan.",
              "Bloklash faqat yangi hisoblashlarni to‘xtatadi: eski hisoblanmalar va to‘lovlar qoladi.",
            ],
          },
        },
        {
          id: "card",
          title: "Hamkor kartochkasi: uning mijozlari",
          body: [
            "«Barcha hamkorlar»da hamkor ismini (yoki «Mijozlar» ustunidagi raqamni) bosing — uning kartochkasi ochiladi. Tepada: uning barcha havolalari bo‘yicha o‘tishlar, nechta mijozi bor va nechta loyiha to‘langan, «Ishlab topilgan» va «Mavjud». Pastda — «Hamkor havolalari»: har bir havola o‘tishlar va arizalar bilan.",
            "Kartochkada asosiysi — **«Hamkor mijozlari»**: unga hisoblangan har bir ariza, yangilari tepada. Qatorda: qachon kelgan; mijoz — bosilsa [lid kartochkasi](#leads-card) ochiladi; qayerdan — havola belgisi, agentlik yoki biriktirilgan mijoz; «Hozir qayerda» — ariza, ishda, shartnoma, shartnoma imzolangan, to‘langan yoki bo‘lmadi, hamkor o‘z kabinetida ko‘radiganning aynan o‘zi; «Olib boradi» — jamoadan lidni kim olgan; «Loyiha» va «Hamkorga hisoblangan». Pastda — loyiha kartochkasida unga qo‘lda hisoblangan loyihalar, u biriktirgan mijozlar va agentliklari. Hamkor o‘z mijozlarining kontaktlarini ko‘rmaydi, siz esa odatdagidek lid kartochkasida ko‘rasiz.",
          ],
        },
        {
          id: "percent",
          title: "Foiz",
          body: [
            "Foiz — shartnoma summasidan, loyiha summasi pog‘onasi bo‘yicha: $2 500 gacha — 6%, $2 501–5 000 — 10%, $5 001–10 000 — 14%, $10 001–30 000 — 17%, $30 001 dan — 20%. Har bir loyihaning pog‘onasi o‘z summasiga qarab. 05.11.2026 dan model bitta: kabinetda «От чистой прибыли» tanlovi endi yo‘q, barcha hamkorlar «С оборота» ga o‘tkazildi (egasining qarori: hamkor qancha olishini darhol ko‘radi, tannarxni kutish shart emas). «Barcha hamkorlar» jadvalida, «Stavka» ustunida model va qachon o‘zgartirilgani ko‘rinadi.",
            "«Foydadan» modeli bo‘yicha ketayotgan loyiha shu model bo‘yicha oxirigacha hisoblanadi: model mijozga uning so‘rovi kunida biriktiriladi va uni o‘zgartirish ketayotgan loyihalarni qayta hisoblamaydi. Loyiha kartochkasida «Hamkor» yonida — «14 % aylanmadan», bunday eski loyihada — «20 % foydadan»: unga loyiha tannarxini kiriting, usiz ulush soliq ayirilgan summadan hisoblanadi. Loyihadagi foiz hamkorning shaxsiy stavkasidan muhimroq, shaxsiysi — pog‘onadan.",
            "Mijoz loyihani to‘liq to‘lamaguncha hisoblanma muzlatilgan — xodimlardagi kabi. Agentlikning stavkasi o‘ziga xos: loyiha summasidan 15%, modellarsiz va jamg‘armasiz, $50 000 buyurtmadan keyin esa umrbod 20%; u ro‘yxatda «agentlik · 15%» yoki «agentlik · 20%» belgisi bilan turadi, batafsil — [Agentliklar](/admin/agencies) bo‘limida.",
            "05.11.2026 dan jamg‘arma yo‘q: «Не забирать в автоматическом режиме» tugmasi kabinetdan olib tashlandi, u yoqilgan hamkorda o‘chirildi. Har bir loyiha o‘z pog‘onasi bo‘yicha hisoblanadi, to‘liq to‘langan loyiha uchun ulushni hamkor so‘rovsiz oladi ([to‘lov](#partners-payout) bandi). Jamg‘armani faqat egasi qaytara oladi.",
            "Umrbod +5. Hamkorning hamma vaqtdagi buyurtmalari summasi $50 000 ga yetganda, keyingi har bir loyiha stavkasiga 5 qo‘shiladi — umrbod, qayta ko‘rib chiqilmaydi: jadval pog‘onasiga. Shartnomalardagi loyiha summalari hisoblanadi, bekor qilingan va hisobga olinmaganlar kirmaydi; chegaradan o‘tgan loyiha hali eski stavkada. Loyihada qo‘lda berilgan foizga ustama tegmaydi; hamkorning shaxsiy stavkasi ham xuddi shunday oshadi, masalan 10% 15% bo‘ladi. Blogerning 12 oylik darajalari bilan (ularni egasi loyihadagi foiz bilan qo‘yadi) qo‘shilmaydi. Bunday hamkorda «Barcha hamkorlar» jadvalida «+5% umrbod» belgisi, loyiha kartochkasida — «50 000 $ buyurtma uchun umrbod +5». Chegaragacha qancha qolganini hamkor o‘z kabinetida ko‘radi. Egasining 05.11.2026 dagi qarori.",
          ],
        },
        {
          id: "agencies",
          title: "Hamkorlarning agentliklari",
          body: [
            "05.11.2026 dan hamkor agentlik ulamaydi: kabinetda bu blok endi yo‘q. Agentlikning o‘z shartlari bor — u o‘zi bizning hamkor-agentligimizga aylanadi va har bir loyiha summasidan 15% oladi ([Agentliklar](/admin/agencies)); uni topgan odam ochadi. Bu sahifadagi «Hamkorlar agentliklari» bloki faqat unda avval qilingan yozuvlar bo‘lsa ko‘rinadi; 05.11.2026 holatiga ular yo‘q.",
            "Bunday eski yozuv avvalgidek ishlaydi: tasdiqlangan agentlik — tasdiqlangandan keyin 12 oy davomida uning barcha buyurtmalari hamkorga, 30 kunlik oynasiz va «mijoz studiyada avval bo‘lgan» tekshiruvisiz. Muddat agentlik qatorida ko‘rinadi: «buyurtmalar hamkorga … gacha». U tugagach, agentlikning yangi buyurtmalari oddiy tartibda o‘tadi, bog‘langanlari esa hamkorda qoladi; **«12 oyga uzaytirish»** tugmasi bugundan boshlab yangi muddatni boshlaydi. Sayt va botdan kelgan so‘rovlar o‘zi taniladi — agentlik kontakti (@nik, telefon, pochta) yoki kompaniya nomi bo‘yicha. Qo‘ng‘iroq yoki menejer shaxsiy xabari orqali kelgan buyurtmani loyiha kartochkasida bog‘lang: «Hamkor» bloki → «Agentlik buyurtmasi».",
            "Bitta agentlik — bitta hamkorga: xuddi shu agentlikni ikkinchi marta ulab bo‘lmaydi. Ulanganida «o‘chirish» — agentlikning yangi buyurtmalari endi hamkorga bormaydi, bog‘langanlari qoladi. Loyiha kartochkasida «Agentlik buyurtmasi» faqat muddati tugamagan agentliklarni taklif qiladi.",
            "Hamkor kabinetida yuborish uchun ikkita taqdimot bor — «DevUz Studio» (jamoa, loyihalar, tillar, xizmatlar, boshlang‘ich narxlar, keyslar) va «Программа для агентств и компаний» (loyiha summasidan stavkalar, mijozni qanday olib kelish, tender subpudrati, agentlik shartlariga havola). Havola hamkor promokodini olib yuradi, shuning uchun taqdimotdan kelgan mijoz unga hisoblanadi.",
          ],
        },
        {
          id: "claims",
          title: "Qo‘lda biriktirilgan mijozlar",
          body: [
            "05.11.2026 dan hamkor kabinetda mijoz biriktirmaydi: «Mening mijozlarim» bloki olib tashlandi, uning o‘rniga — mijoz o‘zi aytadigan [promokod](#partners-code). Bu sahifadagi «Hamkorlar biriktirgan mijozlar» bloki faqat unda yozuvlar bo‘lsa ko‘rinadi; 05.11.2026 holatiga ular yo‘q.",
            "Eski biriktirish avvalgidek ishlaydi: 12 oy mijozning barcha buyurtmalari hamkorga hisoblanadi — «buyurtmalar … gacha hamkorga»; mijoz so‘rovi STIR, nom, telefon yoki Telegram bo‘yicha taniladi. Hamkorning havolasi va promokodi ishlagan bo‘lsa, ular biriktirishdan muhimroq. Bunday liddan ochilgan loyiha hamkorni meros oladi. 12 oy o‘tdi — «muddat tugadi»: yangi buyurtmalar oddiy tartibda o‘tadi, bog‘langanlari hamkorda qoladi.",
            "Kompaniya aslida bizniki ekanini ko‘rsangiz — u bilan paneldan tashqarida ishlaganmiz, studiya tanishlari, — sababini yozing va **«biriktirishni bekor qilish»** ni bosing. Sababsiz bekor bo‘lmaydi: uni hamkor botda oladi. Bekor qilingandan keyin mijozning yangi so‘rovlari hamkorga hisoblanmaydi; allaqachon bog‘langan lid yoki loyiha loyiha kartochkasida, «Hamkor» blokida o‘tkaziladi.",
          ],
        },
        {
          id: "code",
          title: "Hamkor promokodi — mijoz ovoz chiqarib aytadigan so‘z",
          body: [
            "Har bir hamkorning **promokodi** bor — AZIZ yoki MEDIAPRO kabi lotincha so‘z. U «Barcha hamkorlar» ro‘yxatida ism ostida turadi («Promokod: …»). Hamkor ismidan o‘zi yaratiladi (ism uch harfdan qisqa bo‘lsa, nikdan); yetti belgili eski kod va barcha havolalar avvalgidek ishlaydi. Egasining 05.11.2026 dagi qarori: mijoz menejerga yozsa yoki qo‘ng‘iroq qilsa, havola yo‘qoladi, so‘z esa yo‘qolmaydi.",
            "Qayerda ishlaydi: havolada (devuz.studio/?ref=AZIZ va botga havola), mijozning so‘zlarida — saytdagi chatda, botda va saytdagi so‘rovda «promokod AZIZ», — va lid kartochkasida, menejer uni «Promokod yoki kim olib kelgan» maydoniga yozganda ([qanday](#leads-partner-code)). Mijoz birinchi yozilgan odamniki; studiyada avval bo‘lgan mijoz hisobga olinmaydi.",
            "So‘zni o‘zgartirish — hamkor qatorida, **«Promokod»** maydoni, «saqlash» tugmasi: lotin harflari va raqamlar, 12 belgigacha, bitta so‘z — bitta hamkor. Band yoki xizmat so‘zi (ADMIN, DEVUZ va shunga o‘xshash) saqlanmaydi, panel sababini aytadi. O‘zgartirilgandan keyin eski promokod ishlamaydi. Promokod bo‘yicha mijozga chegirmani (birinchi loyihaga 5, 10 yoki 15%) hamkor kabinetda o‘zi tanlaydi: chegirmasiz mijozlar promokodni kamroq aytadi.",
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
          body: {
            head: [
              "Hamkor kabinetda «Запросить выплату» ni bosadi yoki botga /payout va rekvizitlarini yozadi (USDT TRC-20 yoki matn). Oyning birinchi ish kunidan boshlab, $50 dan, bitta ochiq so‘rov, doim butun mavjud summaga. Egasiga «💸 Заявка на выплату» keladi, bu yerda esa «To‘lov so‘rovlari» blokida qator paydo bo‘ladi.",
              "Egasi hal qiladi: u pulni o‘tkazadi va «To‘landi» yoki «rad etish» ni bosadi. Sizda qatorda hamkor, summa va rekvizitlar ko‘rinadi, tugmalar o‘rnida esa — «egasi hal qiladi»: to‘lov — begona odamlarga beriladigan pul, va u bo‘yicha qaror egasida.",
              "Aylanmadan ulush so‘rovni kutmaydi: loyiha bo‘yicha to‘lovlar uning summasiga yetishi bilan — to‘lov [Moliya](/admin/finance) bo‘limida yozilganda yoki shartnoma hisobida «To‘landi» bosilganda — to‘lov so‘rovi o‘zi yaratiladi, hamkorning shu loyihadagi butun ulushiga, oy boshini kutmasdan va $50 minimumisiz. Hamkorga — «✅ … выплата в обработке», egasiga — «💸 Выплата партнёру с оборота: выплатить … за …». «To‘lov so‘rovlari» blokida bunday qatorda «aylanmadan, «…» uchun — loyiha to‘liq to‘langanda o‘zi yaratildi» degan yozuv bor. «Foydadan» eski loyiha — hamkor so‘rovi bo‘yicha: uning ulushi tannarxga bog‘liq.",
              "05.11.2026 dan jamg‘arma yo‘q: aylanmadan ulush o‘zi ketadi, so‘rov bilan esa hamkor qolganini oladi — «foydadan» eski loyihalar bo‘yicha ulushlar va rad etilgan to‘lovdan keyin qaytgan summalar.",
            ],
            admin: [
              "Hamkor kabinetda «Запросить выплату» ni bosadi yoki botga /payout va rekvizitlarini yozadi (USDT TRC-20 yoki matn). Oyning birinchi ish kunidan boshlab, $50 dan, bitta ochiq so‘rov, doim butun mavjud summaga. Sizga «💸 Заявка на выплату» keladi.",
              "Avval pulni o‘zingiz o‘tkazing, keyin «To‘lov so‘rovlari» blokida **«To‘landi»** tugmasini bosing (izoh bilan ham bo‘ladi). Yoki «rad etish» — summa mavjud pulga qaytadi, hamkor sababini ko‘radi.",
              "Aylanmadan ulush so‘rovni kutmaydi: loyiha bo‘yicha to‘lovlar uning summasiga yetishi bilan — to‘lov [Moliya](/admin/finance) bo‘limida yozilganda yoki shartnoma hisobida «To‘landi» bosilganda — to‘lov so‘rovi o‘zi yaratiladi, hamkorning shu loyihadagi butun ulushiga, oy boshini kutmasdan va $50 minimumisiz. Hamkorga — «✅ … выплата в обработке» (rekvizitlari bo‘lmasa — ularni kabinetga kiritish iltimosi), sizga — «💸 Выплата партнёру с оборота: выплатить … за …». «To‘lov so‘rovlari» blokida bunday qatorda «aylanmadan, «…» uchun — loyiha to‘liq to‘langanda o‘zi yaratildi» degan yozuv bor; keyin oddiysidek: o‘tkazdingiz — **«To‘landi»**. Bitta loyiha bo‘yicha bunday so‘rov qat’iy bitta yaratiladi: rad etsangiz — summa hamkorning mavjud puliga qaytadi va u uni oddiy so‘rov bilan so‘raydi. To‘lovni yozish yarim yo‘lda uzilib qolsa, svip o‘tkazib yuborilganini bir necha daqiqada yaratadi. «Foydadan» eski loyiha — hamkor so‘rovi bo‘yicha: uning ulushi tannarxga bog‘liq.",
              "05.11.2026 dan jamg‘arma yo‘q: aylanmadan ulush o‘zi ketadi, so‘rov bilan esa hamkor qolganini oladi — «foydadan» eski loyihalar bo‘yicha ulushlar va rad etilgan to‘lovdan keyin qaytgan summalar.",
            ],
          },
        },
        {
          id: "delete",
          title: "Hamkorni o‘chirish",
          roles: ["admin"],
          body: [
            "«Barcha hamkorlar» jadvalida, «Tahrirlash» ustunida, «saqlash» ostida — «o‘chirish». Ogohlantirish ochiladi: hamkorning havolalari ishlamay qoladi, kabinet va bot orqali kirish yopiladi; uning loyihalari va buyurtmalaridan «kim olib kelgan» olib tashlanadi — ular bo‘yicha hisoblash bo‘lmaydi; agentliklar va biriktirilgan mijozlar o‘chiriladi. **«Butunlay o‘chirish»** tugmasi. Qaytarib bo‘lmaydi — faqat qaytadan qo‘shish mumkin. Hamkorga hech narsa yozilmaydi.",
            "To‘lovlari bor hamkorni o‘chirib bo‘lmaydi: to‘lov — allaqachon ketgan yoki qaror kutayotgan pul, uning tarixi yo‘qolmasligi kerak. Bunday hamkorda tugma o‘rnida tushuntirish bor; uni faqat bloklash mumkin. O‘chirish [Jurnal](/admin/audit)ga yoziladi. Telegrami xodimniki bo‘lgan hamkorlarni jadval «studiya xodimi» deb belgilaydi — ularni o‘chiring: xodim hamkor bo‘la olmaydi.",
          ],
        },
      ],
    },

    /* ── Агентства ──────────────────────────────────────────────────────── */
    "/admin/agencies": {
      what: "Agentliklar — studiya hamkorlari: agentlik bizga o‘z mijozlarining buyurtmalarini olib keladi va har bir shunday loyiha summasidan 15% oladi. Jamoadan kim agentlikni olib kelib, uni shu yerda qo‘shgan bo‘lsa, 12 oy davomida agentlik loyihalari summasidan 5% oladi. Agentlikni har kim qo‘sha oladi: bo‘lim «Hamkorlar» bo‘limi yonida turadi, bu bo‘lim yo‘q odamlarda esa menyuning o‘zida turadi.",
      items: [
        {
          id: "terms",
          title: "Shartlar: agentlikka 15%, olib kelganga 5%",
          body: [
            "Agentlikka — har bir loyihasi summasidan doim 15%: havola orqali keladigan hamkorlardagi kabi jadval bosqichlarisiz. Summa — loyihada, boshqacha aytganda shartnomada turgan summa.",
            "Agentlikni olib kelganga — agentlik shu yerda qo‘shilgan kundan boshlab 12 oy ichida ochilgan har bir loyihasi summasidan 5%. Keyinroq ochilgan loyiha endi 5% siz, muddat ichida ochilgani esa keyin ham unda qoladi. Agentlikdan oldin ochilgan loyiha ham 5% siz: u agentlik orqali kelmagan. Muddat jadvalda, «5% gacha» ustunida ko‘rinadi.",
            "5% hamma narsaning ustidan tushadi. Agentlik loyihasini o‘zingiz olib borsangiz, olib boruvchi foizingiz odatdagidek hisoblanadi, 5% esa alohida «hamkorni olib kelgan» qatori bo‘lib tushadi. Boshqa odam olib borsa, unda uning foizi, sizda sizning 5%.",
            "Ikkala ulush ham mijoz loyihani to‘liq to‘lamaguncha muzlatilgan, [Moliya](/admin/finance) bo‘limidagi hamma narsa kabi: qisman to‘lov — muzlatilgan, to‘liq — ishlab topilgan. Bekor qilingan loyiha hech narsa bermaydi.",
          ],
        },
        {
          id: "partners",
          title: "Bloger-hamkorlar: xuddi shu 5% va ular qancha olib kelgani",
          body: [
            "10.11.2026 dan boshlab xuddi shu 5% ni loyihalar summasidan 12 oy davomida faqat agentlikni emas, bloger-hamkorni olib kelgan ham oladi. Hamkorni kim olib kelganini egasi «Kim olib kelgan» ustunida belgilaydi; 12 oy hamkor qo‘shilgan kundan hisoblanadi. Hamkorni olib keldingiz, lekin u yerda yo‘qsiz — egasiga ayting.",
            "Jadvalda — siz olib kelgan barcha agentliklar va hamkorlar (rahbar va egada — hammasi): har biri nechta loyiha olib kelgani, shartnomalar bo‘yicha «Loyihalar summasi», «Mijozlar to‘lagan» — mijozlar allaqachon qancha to‘lagani va sizning 5% ingiz. Jadval ustida — hammasi bo‘yicha jami.",
          ],
        },
        {
          id: "lifetime",
          title: "Umrbod 20% — agentlik buyurtmalari $50 000 dan oshganda",
          body: [
            "Agentlikning hamma vaqtdagi buyurtmalari summasi $50 000 ga yetganda, uning stavkasi umrbod 20% bo‘ladi: keyingi har bir loyihaga +5, muddatsiz va qayta ko‘rib chiqilmaydi. Shartnomalardagi loyiha summalari hisoblanadi; bekor qilingan va hisobga olinmaganlar kirmaydi. Agentlik $50 000 dan o‘tgan loyiha hali 15% da, keyingisi — 20% da. Egasining 05.11.2026 dagi qarori.",
            "Qayerda ko‘rinadi: jadvalda, «Loyihalar summasi» ustunida summa ostida — «20% umrbod» yoki «20% gacha: yana …»; «Hamkorlar» bo‘limida agentlikda — «agentlik · 20%» belgisi; loyiha kartochkasida hamkor qatorida — «50 000 $ buyurtma uchun umrbod +5». Agentlik qancha qolganini o‘z kabinetida, saytdagi taqdimotda esa $50 000 buyurtmadan keyin 20% bo‘lishini ko‘radi. Pul o‘zi hisoblanadi: qo‘lda hech narsa qo‘yish shart emas.",
            "Agentlikni olib kelganning 5% i bundan o‘zgarmaydi: loyiha summasidan o‘sha 5% va o‘sha 12 oy. Agentlikka ustamani studiya o‘z ulushidan to‘laydi.",
          ],
        },
        {
          id: "deck",
          title: "«Qanday ishlaydi» sxemasi va agentlik uchun taqdimot",
          body: [
            "Bo‘lim tepasida — «Qanday ishlaydi — qisqacha»: buyurtmaning uch qadamli yo‘li va bitta loyihadan kim qancha olishi, $2 000 lik misol bilan: agentlikka $300, olib kelganga $100, qolgani — studiyaga, undan olib boruvchiga foydadan odatdagi foizi. Bu yerda hammasi, bizning 5% ham bor: bu jamoa uchun sxema. «20%» qatori ham shu yerda — $50 000 buyurtmadan keyingi agentlik stavkasi.",
            "«Taqdimotni ochish» — saytdagi olti tildagi (rus, ingliz, o‘zbek, xitoy, ukrain, polyak) sahifa, agentlikning o‘zi uchun: katta 15% raqami, uch qadam, chiziqli misol, qoidalar, nimalarni olib kelish mumkinligi va Telegram tugmasi. Olib kelgan odamning foizi u yerda yo‘q va bo‘lmaydi: bu ichki ma’lumot, agentlikka ko‘rsatmaymiz. Havolani yuboring yoki sahifani ochib, yuqoridagi PDF tugmasini bosing va faylni yuboring. Jadvalda har bir agentlikning o‘z «taqdimot» havolasi bor: u bilan sahifadagi Telegram tugmasi botga shu agentlik kodi bilan olib boradi.",
          ],
        },
        {
          id: "add",
          title: "Agentlikni qanday qo‘shish kerak",
          body: {
            manager: [
              "«Agentlik qo‘shish» bloki: «Agentlik nomi», «Bizga qanday yozadi: @telegram, telefon yoki pochta» — majburiy, «Sayt» va «Izoh» — ixtiyoriy. «Agentlik qo‘shish» tugmasi. Agentlikni siz olib keldingiz: u sizga yoziladi va shu kundan 12 oy davomida uning loyihalari summasidan 5% sizniki.",
              "Agentlik bilan kelishgan zahoti qo‘shing, birinchi buyurtma kelganda emas: muddat agentlik qo‘shilgan kundan boshlanadi, agentlikdan oldin ochilgan loyiha esa 5% ga kirmaydi.",
              "Bitta agentlik — bitta yozuv. Xuddi shu kontakt yoki nomdagi agentlikni siz, hamkasbingiz yoki hamkor allaqachon qo‘shgan bo‘lsa, panel «Bu agentlik allaqachon qo‘shilgan…» deb javob beradi va ikkinchi yozuv bo‘lmaydi. Agar bu xato bo‘lsa, egasiga yozing: kim olib kelganini faqat u o‘zgartira oladi.",
            ],
            head: [
              "«Agentlik qo‘shish» bloki: «Agentlik nomi», «Bizga qanday yozadi: @telegram, telefon yoki pochta» — majburiy, «Sayt» va «Izoh» — ixtiyoriy, hamda «Kim olib kelgan» — 5% kimga tushadi: odatda siz, xodimni yoki «Hech kim, o‘zi kelgan» variantini tanlash mumkin. «Agentlik qo‘shish» tugmasi.",
              "Agentlik bilan kelishgan zahoti qo‘shing, birinchi buyurtma kelganda emas: muddat agentlik qo‘shilgan kundan boshlanadi, agentlikdan oldin ochilgan loyiha esa 5% ga kirmaydi.",
              "Bitta agentlik — bitta yozuv: xuddi shu agentlik (kontakt yoki nom bir xil) ikkinchi marta qo‘shilmaydi, hamkor allaqachon ulagan agentlik ham. Keyin kim olib kelganini faqat ega o‘zgartiradi.",
            ],
            admin: [
              "«Agentlik qo‘shish» bloki: «Agentlik nomi», «Bizga qanday yozadi: @telegram, telefon yoki pochta» — majburiy, «Sayt» va «Izoh» — ixtiyoriy, hamda «Kim olib kelgan» — 5% kimga tushadi: odatda siz, xodimni yoki «Hech kim, o‘zi kelgan» variantini tanlash mumkin. «Agentlik qo‘shish» tugmasi.",
              "Agentlik bilan kelishgan zahoti qo‘shing, birinchi buyurtma kelganda emas: muddat agentlik qo‘shilgan kundan boshlanadi, agentlikdan oldin ochilgan loyiha esa 5% ga kirmaydi.",
              "Bitta agentlik — bitta yozuv: xuddi shu agentlik (kontakt yoki nom bir xil) ikkinchi marta qo‘shilmaydi, hamkor allaqachon ulagan agentlik ham. Kim olib kelganini jadvalning o‘zida o‘zgartirasiz: «Kim olib kelgan» ustunida odamni tanlang va «saqlash» tugmasini bosing. 12 oylik muddat bunda surilmaydi — u agentlik qo‘shilgan kundan. Har bir o‘zgarish — [Jurnal](/admin/audit) bo‘limida.",
            ],
          },
        },
        {
          id: "orders",
          title: "Agentlik buyurtmalari unga qanday yoziladi",
          body: {
            manager: [
              "Agentlik qo‘shilgan zahoti uning o‘z havolasi bor — jadvalda, «agentlik uchun havola». Uni agentlikka yuboring: shu havola orqali saytga yoki botga kelgan mijoz agentlikka yoziladi, havola orqali kelgan hamkor mijozi kabi.",
              "Agentlik o‘zi yuboradigan arizalarni — saytdan, chatdan yoki botdan — panel uning kontakti yoki nomi bo‘yicha taniydi va agentlikka yozadi, havolasiz va muddatsiz. Bunday arizadan ochilgan loyiha agentlikni meros qilib oladi, 15% va 5% loyihada o‘zi paydo bo‘ladi.",
              "Buyurtma qo‘ng‘iroq yoki menejerga shaxsiy xabar orqali kelgan bo‘lsa, egasidan loyihani agentlikka bog‘lashni so‘rang: buni u loyiha kartochkasida qiladi.",
            ],
            head: [
              "Agentlik qo‘shilgan zahoti uning o‘z havolasi bor — jadvalda, «agentlik uchun havola». Uni agentlikka yuboring: shu havola orqali saytga yoki botga kelgan mijoz agentlikka yoziladi, havola orqali kelgan hamkor mijozi kabi.",
              "Agentlik o‘zi yuboradigan arizalarni — saytdan, chatdan yoki botdan — panel uning kontakti yoki nomi bo‘yicha taniydi va agentlikka yozadi, havolasiz va muddatsiz. Bunday arizadan ochilgan loyiha agentlikni meros qilib oladi, 15% va 5% loyihada o‘zi paydo bo‘ladi.",
              "Buyurtma qo‘ng‘iroq yoki menejerga shaxsiy xabar orqali kelgan bo‘lsa, egasidan loyihani agentlikka bog‘lashni so‘rang: buni u loyiha kartochkasida qiladi.",
            ],
            admin: [
              "Agentlik qo‘shilgan zahoti uning o‘z havolasi bor — jadvalda, «agentlik uchun havola». Uni agentlikka yuboring: shu havola orqali saytga yoki botga kelgan mijoz agentlikka yoziladi, havola orqali kelgan hamkor mijozi kabi.",
              "Agentlik o‘zi yuboradigan arizalarni — saytdan, chatdan yoki botdan — panel uning kontakti yoki nomi bo‘yicha taniydi va agentlikka yozadi, havolasiz va muddatsiz. Bunday arizadan ochilgan loyiha agentlikni meros qilib oladi, 15% va 5% loyihada o‘zi paydo bo‘ladi.",
              "Buyurtma qo‘ng‘iroq yoki shaxsiy xabar orqali kelgan bo‘lsa, loyihani o‘zingiz bog‘lang: loyiha kartochkasi, «Hamkor» bloki, agentlikni tanlang. Hamkorlar ro‘yxatida agentlik yonida «agentlik · 15%» belgisi bor.",
            ],
          },
        },
        {
          id: "money",
          title: "Pul qayerda ko‘rinadi",
          body: {
            manager: [
              "«Mening agentliklarim va hamkorlarim — siz olib kelganlar» jadvalida — siz olib kelgan agentliklar: agentlikning nechta loyihasi bor, «Loyihalar summasi» va «Olib kelganga 5%» — qancha ishlab topilgan va qancha muzlatilgan. Xuddi shu 5% — [Moliya](/admin/finance) bo‘limida «hamkorni olib kelgan» qatori: ular balansingizga kiradi va qolgan pul bilan birga to‘lanadi.",
              "Agentlik qancha olishini ko‘rmaysiz: bu begona odamga pul, uni to‘lashni ega hal qiladi.",
            ],
            head: [
              "«Barcha agentliklar va hamkorlar» jadvalida — barcha agentliklar, har birini kim olib kelgani, nechta loyihasi bor, «Loyihalar summasi», «Olib kelganga 5%» va «Agentlikka 15%». Sizning 5% va jamoangizning 5% — [Moliya](/admin/finance) bo‘limida, «hamkorni olib kelgan» qatori.",
              "Agentlik [Hamkorlar](/admin/partners) umumiy ro‘yxatida ham bor, «agentlik · 15%» belgisi bilan: u yerda uning hisoblanmalari va to‘lov so‘rovlari, har qanday hamkordagi kabi. To‘lov bo‘yicha qaror — egada.",
            ],
            admin: [
              "«Barcha agentliklar va hamkorlar» jadvalida — barcha agentliklar, har birini kim olib kelgani, nechta loyihasi bor, «Loyihalar summasi», «Olib kelganga 5%» va «Agentlikka 15%». [Moliya](/admin/finance) bo‘limida 5% — olib kelgan odamda «hamkorni olib kelgan» qatori; ular jamoaga har qanday hisoblanma kabi studiyaga qoladigan puldan ayiriladi.",
              "Agentlik [Hamkorlar](/admin/partners) umumiy ro‘yxatida ham bor, «agentlik · 15%» belgisi bilan: u yerda uning hisoblanmalari, rekvizitlari va to‘lov so‘rovlari, har qanday hamkordagi kabi. To‘lovni siz hal qilasiz.",
            ],
          },
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
            "«o‘zi yig‘ildi, aloqa uchun» belgisi bor prototiplarni panel sizsiz, aloqa xatini tayyorlayotganda yig‘gan: eng yomon saytli kompaniyalarga, yig‘uvchi biladigan nishalarda. Nomi, kontaktlari, logotipi va suratlari — uning saytidan, xizmatlar — uning saytida yozilganlari, har biri so‘zma-so‘z solishtirilgan. Tekshiruv qo‘lda yig‘ilganlarniki bilan bir xil: e’tiroz bo‘lsa, prototip «qoralama» bo‘lib qoladi va xatga tushmaydi. Hozir bunday prototiplar ro‘yxatda yo‘q: 29 tasining hammasi parol bilan yopildi va bu yerdan ham, «Maketlar»dan ham olib tashlandi (egasi, 09.10.2026), qo‘lda yig‘ilganlar bilan adashtirilmasin.",
            "Bunday prototipning havolasi aloqa xatida o‘zi ketadi — «Mijozga yubordim» tugmasini bosish shart emas: xat ketganda prototip «yuborilgan» bo‘ladi. Menejerda bu qanday ko‘rinishi — [prototip oldindan](#prospect-proto-ahead).",
          ],
        },
        {
          id: "check",
          title: "Tekshiruv va havola",
          body: [
            "Tayyor sahifani tekshiruv o‘qiydi: o‘ylab topilgan raqamlar, foizlar, maqtanish, kompaniya nomi yo‘q, ishlamaydigan tugma, mijoz aytmagan xizmatlar; uzun tire va sun’iy intellekt matni shtamplari («shunchaki … emas», «… dunyosiga», «noyob»): biznes egasi ular orqali model yozgan matnni bir soniyada taniydi va maketga ishonmay qo‘yadi. Uning saytidan olingan ish vaqti va xizmat nomlaridagi tireni panel o‘zi almashtiradi, kompaniya o‘z saytida o‘zi haqida yozgan shtampni esa tekshiruv o‘tkazib yuboradi: bu uning o‘z so‘zlari. Topsa — prototip «qoralama» bo‘lib qoladi, havola 404 beradi, muammolar esa sanab o‘tiladi: tuzating va qaytadan yig‘ing.",
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
            "Tuzoq so‘zlar: 30.10.2026 dan keyin yig‘ilgan maketlarning demo-ma’lumotlarida har bir mijozga o‘ziga xos to‘qilgan nomlar bor: demo-dorixonalar, do‘konlar, ko‘chalar (xaritadagi «mavjud bo‘lmagan ko‘cha» kabi). Haqiqiy saytda ular paydo bo‘lishi mumkin emas: topildi — matn va ma’lumotlar maketimizdan olingan. Tekshiruv ularni «demo-ma’lumotlardagi tuzoq so‘zlar» qatorida ko‘rsatadi. Maketlarda skript raqamlari ham biroz siljitilgan (silliqlik, paydo bo‘lish chegaralari), panel ularni ham begona saytning skript fayllaridan qidiradi.",
            "Ko‘rsatish jurnali prototipni tirik odam har bir ochishini yozadi: vaqt, manzil va brauzer; messenjer prevyulari va sizning paneldan ochishlaringiz yozilmaydi. Bu mijoz maketni ko‘rgani va shartlarni qabul qilganining dalili. Da’vo uchun tekshiruv natijasini saqlang va saytni notarial ko‘rikdan o‘tkazishga buyurtma bering.",
          ],
        },
        {
          id: "trace-month",
          title: "Oyiga bir marta — mijozlar saytlari",
          roles: ["admin"],
          body: [
            "Har oy 1-sanadan boshlab Toshkent vaqti bilan 11:00 dan bot o‘zi maket qilgan barcha mijozlarimiz saytlarini tekshiradi (manzil prototip kartochkasidan; bot kasaniyalar uchun yig‘gan maketlar olinmaydi): «Saytni maketimizga tekshirish» bilan bir xil tekshiruv, faqat o‘ziniki bilan emas, barcha maketlarimiz bilan. Bir martada uchta sayt, shuning uchun butun ro‘yxat bir-ikki soatda o‘tadi.",
            "Hammasi tekshirilgach, sizga va rahbarga «Hisobotlar» belgisi ostida «🔎 Сайты клиентов» keladi: nechta tekshirildi, bizniki topilsa — mijoz, qaysi maket (ularga qilingani yoki boshqa mijoz maketi), nechta mos keldi, tuzoq so‘zlar va «Проверка в панели» havolasi. Topilmasa — «Нашего не нашли». Kechasi (21:00 dan) hisobot kelmaydi, ertasi kuni yuboradi. Da’vo uchun paneldagi tekshiruvni oching, natijani saqlang va saytni notarial ko‘rikdan o‘tkazishga buyurtma bering.",
          ],
        },
      ],
    },

    /* ── Разборы ──────────────────────────────────────────────────────── */
    "/admin/razbor": {
      what: "Saytimiz uchun begona saytlar tahlili maqolalari: smena ularni har kuni ertalab o‘zi yozadi va darhol e’lon qiladi — sizning tasdig‘ingizsiz, matnni odam o‘rniga kod tekshiradi. Chiqqan tahlil darhol saytda va qidiruvda. Bu yerda chiqqanlarning hammasi ko‘rinadi va istalgan tahlilni tuzatish, e’londan olish yoki o‘chirish mumkin.",
      items: [
        {
          id: "shift",
          title: "Tahlillar smenasi",
          body: [
            "Har kuni Toshkent vaqti bilan 08:03 da smena «Sovuq aloqalar» bo‘limidagi hali yozilmagan saytlarni oladi, 12 tagachasini ko‘radi va 3 tagacha tahlil yozadi — ruscha va o‘zbekcha — va ularni darhol e’lon qiladi. «Смена разборов» hisoboti Telegramga keladi: nechtasi chiqdi, chiqqan sahifalarga havolalar, ular sayt xaritasida bormi (smena uni qidiruv tizimi kabi ochadi va har bir tahlilning ikkala sahifasini qidiradi) va qolgan saytlar nega olinmadi.",
            "Rad etish sabablari: sayt ochilmadi, sayt joyida yoki topilmalar kam, nisha yoki shahar aniqlanmadi, nishani tahlil qilmaymiz (tibbiyot va boshqa taqiqlanganlar), so‘rov band (bunday tahlil allaqachon bor — bu model maqola yozishidan oldin tekshiriladi), maqola tekshiruvdan o‘tmadi. 11:03 gacha hisobot bo‘lmasa — «Смена разборов — молчит» keladi.",
          ],
        },
        {
          id: "tender",
          title: "Haftaning tender tahlili",
          body: [
            "Haftada bir marta, haftaning birinchi kuni Toshkent vaqti bilan 08:33 dan keyin, alohida smena tender tahlilini yozadi: begona saytni emas, IT-xaridning odatiy texnik topshirig‘ini — davlat tashkiloti sayti, CRM, elektron hujjat aylanishi, chat-bot va hokazo. Bunday texnik topshiriqda odatda nima e’tibordan chetda qoladi, qabulda bu nimaga olib keladi va qanday to‘g‘ri yozish kerak. Mavzu `content/razbor/tenders.ts` dagi ro‘yxatdan navbatdagisi olinadi; maqola buyurtmachilar, xaridlar va shartnoma summalarini nomlamaydi. Agar dushanba kuni server ishlamagan bo‘lsa, maqola u ko‘tarilgan kuni chiqadi.",
            "Maqola sayt tahlili kabi darhol chiqadi, «tenderlar va davlat shartnomalari» belgisi bilan — uning suratlari yo‘q va bo‘lmaydi, shunday rejalashtirilgan. Saytda u «Тендеры и госконтракты» xizmatiga va «Контакты» ga olib boradi. Hisobot Telegramga alohida «Тендерный разбор недели» qatori bilan, maqolaga havola bilan keladi. Rad etilgan mavzu ikkinchi marta yozilmaydi; mavzular tugaganda hisobot shuni aytadi — ro‘yxat kodda to‘ldiriladi.",
          ],
        },
        {
          id: "marketing-articles",
          title: "Marketing haqida maqolalar",
          body: [
            "Saytdagi «Marketing» sahifasi ostida (devuz.studio/ru/marketing va devuz.studio/uz/marketing) har kuni ikkita qisqa maqola chiqadi — Toshkent vaqti bilan 10:00 va 16:00 da, birdaniga rus va o‘zbek tillarida. Ularni arzon model `content/marketing-topics.ts` dagi mavzular ro‘yxati bo‘yicha yozadi: qidiriladigan narsa bo‘yicha tushuntirish («что такое SMM», «SMM nima», «Toshkentda reklama» — so‘rovlar Google Trends’dan olingan; har bir maqoladan oldin smena Google Trends va Vordstatdan uning so‘rovi versiya tilida o‘qiladigan joyda (ruscha — Rossiya, O‘zbekiston va MDH mamlakatlarida, o‘zbekcha — O‘zbekistonda) nima bilan birga qidirilishini yana so‘raydi va mosini matnga qo‘shadi; Vordstat serverda uning `WORDSTAT_TOKEN` tokeni bo‘lganda javob beradi), mashhur reklama keysi, keng tarqalgan xato, nishani kanalda targ‘ib qilish — navbat bilan. So‘rov sarlavhada, tavsifda va birinchi xatboshida turadi — busiz maqola chiqmaydi. Ular «Tekshiruvda»ga tushmaydi: o‘zi chiqadi, darhol sayt xaritasiga qo‘shiladi, Bing va Yandex esa signal oladi. Nima uchun: har bir maqola — bizni Google va Yandexda topadigan yana bitta sahifa, har birining oxirida esa «sayt + marketing» taklifi va kalkulyator.",
            "Inson tekshiruvi o‘rnida kod turadi: keys tahlilida mavzu faktlarida yo‘q birorta ham raqam bo‘lishi mumkin emas, qolgan maqolalarda — foizlar, summalar va yillar yo‘q, o‘zbekcha versiya — faqat lotin yozuvida. Tekshiruvdan ikki marta o‘tmasa — bu safar maqola chiqmaydi, Telegramga esa sababi bilan «Статьи о маркетинге» qatori keladi. Chiqqan maqola sayt xaritasida bo‘lmasa ham shu qator keladi: chiqqandan keyin server buni o‘zi tekshiradi. Mavzular tugaganda ham (taxminan ikki oydan keyin) shu qator xabar beradi — ro‘yxat kodda to‘ldiriladi. Chiqqan maqolani paneldan olib tashlab bo‘lmaydi: dasturchilar chatiga yozing, uni bazada yashirishadi.",
          ],
        },
        {
          id: "review",
          title: "Kod nimani tekshiradi",
          body: [
            "Chiqishdan oldin tahlilni endi odam o‘qimaydi (sizning qaroringiz, 19.10.2026): har bir maqolani kod tekshiradi, tekshiruvdan o‘tmagani chiqmaydi. Kompaniya nomlanmagan — na nomi, na manzili, na sayti sarlavhasidagi so‘z bilan; har bir raqam audit topilmalarida bor; o‘sish foizlari va «topga chiqaramiz» va’dalari yo‘q; topilmalar auditdan so‘zma-so‘z ko‘chirilmagan; tibbiyot va boshqa taqiqlangan nishalarni smena tahlil qilmaydi.",
            "Saytda xato ko‘rsangiz — tahlilni «E’lon qilingan» ro‘yxatidan toping: ikkala maqola u yerda to‘liq, manba-sayt manzili faqat sizga ko‘rinadi. **«Tahrirlash»** faqat matnni o‘zgartiradi: sarlavha, tavsif, kirish, topilmalar va xulosa; manzil va so‘rov o‘zgarmaydi.",
          ],
        },
        {
          id: "publish",
          title: "Chop etish, olib tashlash, rad etish",
          body: [
            "**«E’londan olish»** tahlilni saytdan olib, «Tekshiruvda»ga qo‘yadi — endi u yerda faqat siz olib qo‘ygan tahlillar turadi, smena ularni qaytarib chiqarmaydi. Saytga qaytarish — **«E’lon qilish»**: ikkala maqola kerak, sahifa darhol ochiladi, sayt xaritasi yangilanadi, Bing va Yandex signal oladi. Panel shu zahoti jonli sayt xaritasini ochadi va unda ikkala sahifa topildimi, yozadi; topilmasa — dasturchilar chatiga yozing.",
            "**«E’lon qilmaymiz»** — olib qo‘yilgan tahlil uchun, sabab bilan yoki sababsiz. Smena bu saytga boshqa qaytmaydi. Saytni smena navbatiga qaytarish — faqat **«O‘chirish»** (maydonga «o‘chirish» deb yozing).",
          ],
        },
        {
          id: "english",
          title: "Inglizcha va polyakcha versiyalar",
          body: [
            "E’lon qilingan tahlil bir soat ichida yana ikkita sahifa oladi — ingliz tilida (devuz.studio/en/razbor) va polyak tilida (devuz.studio/pl/razbor). Ularni server o‘zi yozadi, panelda tekshiruvsiz: chiqqan ruscha maqolani olib, shu tildagi so‘rov ostiga o‘tkazadi — «restaurant website in Tashkent», «strona internetowa dla restauracji w Taszkencie», — so‘rovni shu tilda o‘qiladigan joyda Google Trends va Google rejalashtiruvchisi bilan solishtirib: inglizcha versiyani — AQSH, Buyuk Britaniya va Kanadada, polyakchani — Polshada. Topilmalar, raqamlar va skrinshotlar o‘sha-o‘sha; yangi raqam, foiz va topilmalarni kod o‘tkazmaydi, bu versiyalarda kirill harflari bo‘lishi mumkin emas.",
            "Ikki marta tekshiruvdan o‘tmasa — server olti soatdan keyin yana urinadi, hozircha tahlilning shu tildagi sahifasi yo‘q: til almashtirgich undan shu tildagi tahlillar ro‘yxatiga olib boradi. **«Tahrirlash»** ikkala versiyani o‘chiradi: ular eski matndan yozilgan, server ularni tuzatilgan matn bo‘yicha qaytadan yozadi — sahifa manzillari o‘zgarmaydi. **«E’londan olish»** va **«O‘chirish»** ularni ham saytdan olib tashlaydi.",
          ],
        },
      ],
    },

    /* ── Журнал ───────────────────────────────────────────────────────── */
    "/admin/audit": {
      what: "Paneldagi barcha amallar jurnali: kim, nima va qachon qilgan. Masalan, mijoz kontaktini ochgan, lidni olgan, holatni o‘zgartirgan yoki to‘lovni tasdiqlagan. Yozuvlarni o‘zgartirib ham, o‘chirib ham bo‘lmaydi.",
      items: [
        {
          id: "filters",
          title: "Qanday qidirish",
          body: [
            "«Kim» filtri xodimni yoki «tizim»ni tanlaydi. «tizim» amalni bot, taymer yoki bot orqali hamkor qilganini bildiradi. «Nima» filtri amal turini tanlaydi. Sahifada 100 ta yozuv, keyingilarini «eskiroq →» va «← yangiroq» tugmalari bilan varaqlang.",
            "Muhimlari oltin rangda: mijoz kontakti, yozishma, pul va kirish huquqlari. Lid bilan bog‘liq amallarda uning kartochkasiga havola bor.",
          ],
        },
        {
          id: "when",
          title: "Bu yerga qachon qarash kerak",
          body: [
            "Mijoz unga ikki kishi yozganidan shikoyat qiladi. Lid yo‘qolib qoldi. Summani yoki holatni kim o‘zgartirgani tushunarsiz. Bularning hammasi bu yerda daqiqasigacha ko‘rinadi.",
          ],
        },
      ],
    },

    /* ── Использование ────────────────────────────────────────────────── */
    "/admin/usage": {
      what: "Jamoa aslida qaysi bo‘limlar va tugmalardan foydalanadi. Hisobotni faqat siz ko‘rasiz. Jamoa u haqida bilmaydi, shuning uchun raqamlar halol.",
      items: [
        {
          id: "read",
          title: "Qanday o‘qish",
          body: [
            "Tepada davr: 7, 30 yoki 90 kun. Strelkalar undan oldingi xuddi shunday davr bilan solishtiradi. Rahbarlar va menejerlar hisoblanadi, siz hisobotda yo‘qsiz.",
            "Har bir qatorda belgi bor. «asosiy» bu ochiq bo‘lganlarning kamida yarmi foydalanayotganini bildiradi. «bir-ikki kishida» bu oz kishi foydalanayotganini bildiradi. «ortiqchami?» so‘zli belgi hech kim foydalanmayotganini bildiradi.",
          ],
        },
        {
          id: "use",
          title: "Bu bilan nima qilish kerak",
          body: [
            "«ortiqchami?» belgisi hukm emas, savol. Jamoadan so‘rang: funksiya kerak emasmi yoki u haqda bilishmaydimi? Ko‘pincha bilishmaydi. Unda yo‘riqnomadagi band va «?» tugmasi yordam beradi.",
            "Bo‘limlarni ko‘rishlar hisobot yoqilgan kundan hisoblanadi. Amallar butun vaqt uchun [«Jurnal»](/admin/audit) bo‘limidan olinadi.",
          ],
        },
      ],
    },

    /* ── SI xodimlar ──────────────────────────────────────────────────── */
    "/admin/ai-staff": {
      what: "Studiyaning SI xodimlari bo‘limi: bu yerda bizning SI xodimlarimiz ishlaydi va ular nima qilgani ko‘rinadi. «Blogerlar» yorlig‘i hamkorlik dasturi uchun O‘zbekistondan blogerlarni topadigan, auditoriyasini baholaydigan va birinchi xabarni tayyorlaydigan SI xodim, odamlarga esa uni yuborish va kelishish qoladi.",
      items: [
        {
          id: "service",
          title: "Xizmat va xizmat boti",
          roles: ["admin"],
          body: [
            "Yuqorida xizmat yoqilganmi yoki yo‘qmi ko‘rinadi. U o‘chiq bo‘lsa, mijozlar kabineti, ularning saytlaridagi vidjet va xizmat boti hech kimga javob bermaydi, saytdagi xizmat sahifasi ochilmaydi. **«Xizmatni yoqish»** / **«Xizmatni o‘chirish»** tugmasi bir daqiqa ichida ishlaydi.",
            "Xizmatning Telegramda o‘z boti bor, studiya boti emas: u orqali mijozlar kabinetga kiradi, Telegram Business ni ulaydi va arizalarni oladi. Botni @BotFather da o‘zingiz yaratasiz, u yerda Business Mode ni yoqasiz, tokenni sirlar omboriga `AI_STAFF_BOT_TOKEN` sifatida qo‘yasiz, yoniga `AI_STAFF_WEBHOOK_SECRET` (istalgan uzun tasodifiy qator) va `AI_STAFF_KEY` (mijozlar botlari tokenlarini shifrlash kaliti). So‘ng **«Xizmat botini ulash»** ni bosing: server tokenni, Business Mode yoqilganini (@BotFather da u Secretary Mode deb ataladi) tekshiradi va botga /start buyrug‘ini yoqadi. Xabarlarni bot Telegramdan o‘zi oladi, studiya boti kabi serverdagi xizmat orqali: Telegram vebxuki serverimizga yetib bormaydi. Xizmat tokenni ombordan oladi va yangilanishda o‘rnatiladi, uni alohida ishga tushirish shart emas.",
          ],
        },
        {
          id: "ready",
          title: "Pilotga tayyorlik",
          roles: ["admin"],
          body: [
            "**«Pilotga tayyorlik»** bloki server ishlayotganda o‘zi tekshiradigan narsalarni ko‘rsatadi: xizmat boti tokeni, vebhuk siri va shifrlash kaliti bormi, Instagram ochiqmi, karta orqali to‘lov ulanganmi. Sirlarning qiymati bu yerda ko‘rinmaydi, faqat «tayyor» yoki «yo‘q». Bot tokenisiz mijozlarning arizalari ularning menejerlariga yetib bormaydi, hisobotlar ketmaydi, kabinetga kirib bo‘lmaydi, shuning uchun bu band boshqalaridan muhimroq.",
            "Meta ilovamizni tekshirmaguncha Instagram «kutilmoqda»: shungacha «Instagramni ulash» tugmasi faqat `AI_STAFF_IG_TESTERS` dagi kabinetlarga ko‘rinadi (id vergul bilan), boshqa mijozlarga ulash tez orada ochilishi yoziladi. Tekshiruvdan keyin `AI_STAFF_IG_PUBLIC=1` qo‘ying. Oxirgi qator bu oyda mijoz xodimlariga Telegramda yetib bormagan arizalarni sanaydi: token yo‘q yoki mijozda hech kimda «arizalarni oladi» belgisi yo‘q. Noldan katta son mijoz xaridorlarni yo‘qotayotganini bildiradi, mijoz kabinetidagi odamlari ro‘yxatini tekshiring.",
          ],
        },
            {
          id: "clients",
          title: "Mijozlar va raqamlar qayerdan",
          roles: ["admin"],
          body: [
            "Har bir kartochka xizmatning bitta mijozi. «Suhbatlar» SI shu oyda Toshkent vaqti bo‘yicha xaridorlar bilan nechta suhbat olib borganini tarif limitidan ko‘rsatadi: suhbat oyiga bir marta hisoblanadi, unda qancha xabar bo‘lishidan qat’i nazar. Limit tugasa, mijozning SI jim bo‘ladi, xaridor «menejer javob beradi» xabarini oladi, mijozning odamlariga xabar keladi.",
            "«Tannarx» mijoz oy davomida model sarfi bo‘yicha qancha turganini model narxlarida dollarda ko‘rsatadi: har bir chaqiruv mijoz belgisi bilan yoziladi. Yonida bir suhbat narxi va «Marja»: tarif narxi minus `AI_STAFF_UZS_PER_USD` kursi bo‘yicha so‘mdagi tannarx (odatiy 12 700). ProxyAPI orqali model qimmatroq, bu raqamda hisobga olinmagan. Yuqorida barcha mijozlar sarfi va to‘langan tariflar bo‘yicha tushum.",
          ],
        },
        {
          id: "pay",
          title: "To‘lov, sinov muddati va holat",
          roles: ["admin"],
          body: [
            "Hozircha to‘lov hisob orqali: mijoz bizga yozadi, siz hisob chiqarasiz, pul kelganda tarif, oylar soni, summa va usulni tanlab **«To‘lovni belgilash»** ni bosasiz. Agar to‘langan sana hali o‘tmagan bo‘lsa, muddat undan uzaytiriladi: oldindan to‘lov yonib ketmaydi. Summa bo‘sh bo‘lsa, tanlangan oylar uchun tarif narxi olinadi. «Pro» tarifi mijozning SI ni o‘zi eng kuchli modelga o‘tkazadi. Sirlar omborida Payme (`AI_STAFF_PAYME_MERCHANT_ID`, `AI_STAFF_PAYME_KEY`) yoki Click (`AI_STAFF_CLICK_SERVICE_ID`, `AI_STAFF_CLICK_MERCHANT_ID`, `AI_STAFF_CLICK_SECRET`) kalitlari paydo bo‘lganda, mijoz kabinetida karta bilan to‘lov paydo bo‘ladi: to‘langan hisob tarifni sizning belgingizsiz o‘zi uzaytiradi va uning to‘lovlar tarixiga tushadi.",
            "Yangi mijoz 14 kunlik sinov muddati va 100 suhbat oladi. **«Sinovni 7 kunga uzaytirish»** mijozga to‘lovgacha vaqt kerak bo‘lganda. **«Holatni o‘zgartirish»**: «pauza» va «bloklangan» mijozning SI ni darhol to‘xtatadi, xaridorlar «menejer javob beradi» xabarini oladi.",
          ],
        },
        {
          id: "cabinet",
          title: "Mijoz kabineti va demo",
          roles: ["admin"],
          body: [
            "**«Kabinetni ochish»** mijoz kabinetiga yordam xizmati nomidan 2 soatga kirish: bilimlar bazasi yoki kanalni sozlashga yordam berish uchun. Kabinet sarlavhasida yordam xizmati kirgani belgisi bo‘ladi.",
            "**«Demo sifatida ko‘rsatish»** shu mijozning chat-vidjetini saytdagi xizmat sahifasiga qo‘yadi: tashrif buyuruvchi SI ni jonli misolda sinab ko‘radi. Demo uchun o‘ylab topilgan kompaniya va to‘ldirilgan bilimlar bazasi bilan alohida mijoz ochgan ma’qul: tashrif buyuruvchining har bir savoli uning suhbatlari va model sarfini sarflaydi.",
          ],
        },
        {
          id: "scout",
          title: "Skaut: guruhlar va xabarlarni qanday saralashi",
          body: [
            "**«Skaut»** yorlig‘i — Telegram guruhlarini o‘qiydigan va ijrochi qidirilayotgan xabarlarni ushlaydigan skaut sozlamalari. Topilgani [Skaut signallari](/admin/scout)ga tushadi, kuchlisi lidga aylanadi. Yorliq pastida — **«Skaut uchun guruhlar»**, «Skaut signallari»dagi o‘sha blok: guruhni har kim qo‘sha oladi, olib tashlashni qo‘shgan odam, rahbar va egasi qiladi. Olib tashlangan guruhdan skaut chiqmaydi, faqat 20 daqiqa ichida undan xabar olishni to‘xtatadi.",
            "**«Xabarlarni qanday saralash»** blokida ikki rejim bor. **«Avtomatik»**: skaut mavzuni (sayt, do‘kon, ilova, bot, avtomatlashtirish) va «kerak, qidiryapman, kim qiladi» iltimosini rus, o‘zbek va ingliz tillarida o‘zi ko‘radi, ijrochilar reklamasini tashlab yuboradi. **«So‘zlar bo‘yicha»**: faqat ro‘yxatingizdagi kamida bitta so‘z bor xabarlar o‘tadi. So‘z boshidan ushlanadi, shuning uchun «sayt» «saytga» va «saytni»ni ham topadi. Ikkala rejimda ham keyin model buyurtmani reklamadan ajratadi, begona e’lonlar lentaga tushmaydi. Rejim va so‘zlarni egasi va rahbar o‘zgartiradi, skaut 5 daqiqa ichida qayta ishga tushmasdan yangisiga o‘tadi. Heshtegli xabarni (#sayt, #ish) skaut hech bir rejimda olmaydi: bunday qilib buyurtmachilar emas, e’lonlar va tarqatmalar yozadi.",
          ],
        },
        {
          id: "claudery",
          title: "Claudery: masofaviy yordam boti va konstruktor",
          body: [
            "**«Claudery»** varag‘i — neyrotarmoqlar bo‘yicha pullik yordam arizalarini qabul qiladigan bot. Mijoz tugmani bosadi, nima bo‘lganini yozadi (skrinshot bilan ham bo‘ladi) va arizani ochish tugmasini oladi: u saytimizdagi ariza sahifasiga olib boradi. Botning o‘zida to‘lov yo‘q va bot narx haqida yozmaydi: Telegram Stars’dan tashqari to‘lov qabul qiladigan botlarni bloklaydi. Narx va Platega to‘lov tugmasi ariza sahifasida turadi; har bir arizaning o‘z manzili bor, to‘lov mijoz bilan shu manzil orqali bog‘lanadi. Ariza darhol umumiy lidlar hovuziga tushadi, turi «SI bo‘yicha yordam (Claudery)», va «narx aytildi» bosqichi hisoblanadi: to‘lanmaganini menejer yakunlashi mumkin. To‘lovni Platega o‘zi tasdiqlaydi: sayt uni mijoz ariza sahifasiga qaytganda va har bir necha daqiqada ikki kun davomida so‘raydi. To‘langan bo‘lsa, bot o‘zi mijozga «To‘lovdan keyin» qadamidagi matnni yozadi, lidda «✅ ОПЛАЧЕНО» paydo bo‘ladi, lidni olib borgan xodimga hamda sizga va rahbarga qator keladi, tunda — ertalab. Mijoz skrinshoti kunduzi shu turdagi lidlarni oladiganlarga studiya botiga boradi.",
            "**«Kalitlar»** bloki: @BotFather’dan bot tokeni va ikkita Platega kaliti — SI-yuristniki bilan bir xil. **«Saqlash va tekshirish»** ni bosing: panel tokenni Telegramda tekshiradi, server uchun sirni o‘zi yaratadi va «Ulanish» da bot nomini ko‘rsatadi. **«Mijoz nimani ko‘radi»** bloki — mijoz yo‘li, u doim bitta: salomlashuv → «nima bo‘ldi» → arizaga havola (to‘lov saytda) → to‘lovdan keyingi xabar. Bot faqat rus tilida yozadi. Siz faqat so‘zlarni o‘zgartirasiz: salomlashuv matni va asosiy tugmadagi yozuv, savol, arizaga havola matni va summa, to‘lovdan keyingi matn. Bot matnlarida to‘lov va narx haqida yozmang: ular ariza sahifasida. Salomlashuv ostiga to‘rttagacha o‘z tugmangizni qo‘shish mumkin, masalan «Kafolat»: tugma yo sizning matningiz bilan javob beradi (orqaga qaytish tugmasi bilan), yo https havolani ochadi. «Shartlar va kafolat» maydoniga mijozga va’da qilganingizni yozing: bu matn ofertada turadi (**«Mijozlar uchun oferta»** tugmasi), ofertadagi YaTT rekvizitlari ombordan olinadi. **«Saqlash»** ni bosing: biror joy bo‘sh yoki xato bo‘lsa, panel qayerdaligini aytadi va saqlamaydi. **Qayta murojaat:** avval kamida bir marta to‘lagan mijozga (Platega tasdig‘i bo‘yicha, so‘ziga ko‘ra emas) ariza sahifasida «Avval to‘laganlarga chegirma, %» maydonidagi chegirma bilan narx turadi — odatda 30%, ya’ni 5 000 ₽ o‘rniga 3 500 ₽ — va chegirma haqida qator.",
            "**To‘langan ariza uchun pul.** Platega to‘lovni tasdiqlashi bilan bot o‘zi to‘lovli [loyiha](/admin/projects) «Claudery · помощь с ИИ» ochadi: summa to‘lov kunidagi Rossiya Markaziy banki kursi bo‘yicha dollarga o‘tkaziladi (kurs va rubl summasi loyiha izohida; Markaziy bank javob bermasa, oxirgi ma’lum kurs, u ham bo‘lmasa, zaxira kurs va izohda summani tekshirish so‘raladi). Shunday qilib to‘lov daromadga, «Moliya»ga va «to‘lov» bosqichiga tushadi. Lidni olib borgan xodimga summadan 40%, rahbar qatorisiz; qolgani ta’sischilarga ularning ulushida. Lidni hali hech kim olmagan bo‘lsa, loyiha olib boruvchisiz ochiladi va 40% lidni olgan xodimga tushadi. Bu bitimlar daraja va mukofot uchun «3 bitim» hisobiga kirmaydi: ularning o‘z stavkasi bor.",
          ],
        },
        {
          id: "bloggers-agent",
          title: "Blogerlar: agent o‘zi nima qiladi",
          body: [
            "Agent studiyaga mijoz olib kela oladigan O‘zbekistondagi blogerlarni qidiradi: tadbirkorlar, ekspertlar, marketologlar, IT-blogerlar. Internetda Firecrawl orqali **«Agent sozlamalari»** dagi so‘rovlar bo‘yicha navbat bilan qidiradi: har safar eng uzoq vaqt ishlatilmagan so‘rovni oladi. Natijalardan Instagram profillarini va blogerlar to‘plamlari maqolalaridan niklarni oladi. Firecrawl kreditlari aloqalar uchun kompaniyalarni qidirish bilan bir xil kunlik limitdan sarflanadi: agent o‘zining «Kuniga qidiruv kreditlari» ulushidan (odatiy 2) va umumiy limitdan qolganidan ko‘p sarflamaydi, shuning uchun kompaniyalar qidiruvi blogerlar sababli to‘xtamaydi.",
            "Yoqilgan agent (**«Agentni yoqish»**) Toshkent vaqti bilan 9:00 dan 20:00 gacha har besh daqiqada o‘zi ishlaydi: topilgan blogerlardan uchtagacha baholaydi, baholaydigan hech kim bo‘lmasa, bitta qidiruv qiladi. O‘chirilgan agent hech narsa qidirmaydi va sarflamaydi, lekin ikki tugma doim ishlaydi: **«Hozir topish»** shunday o‘tishni darhol, istalgan vaqtda qiladi, **«Bloger qo‘shish»** esa blogerni nik yoki profil havolasi bo‘yicha qo‘shadi va Firecrawlsiz darhol baholaydi.",
            "«Manbalar» qatori nima ulanganini ko‘rsatadi. «Internetda qidiruv» agent bugun o‘z ulushidan qancha kredit sarflaganini ko‘rsatadi. «Instagram raqamlari» Instagramning begona profillarga rasmiy kirishi (Business Discovery) bormi: usiz agent faqat qidiruv natijasidagi obunachilar sonini biladi, layklar, izohlar va postlar chastotasini bilmaydi. «Direct yozishmasi» agent studiya Directida blogerlarga o‘zi javob bera oladigan Instagram ilovasi ulanganmi. Ulanmaguncha yozishmani odam olib boradi.",
          ],
        },
        {
          id: "bloggers-score",
          title: "Agent blogerni qanday baholaydi",
          body: [
            "0 dan 100 gacha ballni model emas, kod hisoblaydi va u besh qismdan iborat. Auditoriya hajmi 20 gacha: eng yaxshisi 10 dan 100 minggacha obunachi, «Obunachilar dan» va «Obunachilar gacha» chegarasidan tashqaridagi bloger saralanmaydi. Faollik 30 gacha: oxirgi 12 postdagi o‘rtacha layk va izohlar obunachilarga nisbatan foizda. 3% dan yaxshi, 1% dan kam bo‘lsa auditoriya deyarli javob bermaydi, 10 mingdan katta blogda 25% dan ko‘p bo‘lsa sun’iy oshirishga o‘xshaydi. Faolligi 15 gacha: haftasiga nechta post, oxirgi post 45 kundan eski bo‘lsa nol. O‘zbekiston 15 gacha. Mavzu 20 gacha.",
            "Mavzular, til, shahar va auditoriya mos keladimi yo‘qligini profil sarlavhasi va postlar izohlari bo‘yicha arzon model (Haiku) o‘qiydi: yuqori biznes, marketing, IT, o‘z mijozlari bor ekspertlar; past hazil, o‘yinlar, maktab o‘quvchilari. Uning nima uchun shunday degan jumlasi kartochkada ko‘rinadi. Biror narsani bilmasak, agent shkalaning o‘rtasini qo‘yadi va aynan nima yetishmasligini sariq bilan yozadi; O‘zbekistondan bo‘lmagan bloger darhol saralanmaydi. «O‘tish bali» dan past (odatiy 55) bo‘lsa, bloger «Saralanmaganlar» ga tushadi: u yerda uni **«Qaytarish»** yoki **«Qayta baholash»** mumkin.",
            "Raqamlar yonida ular qayerdanligi yozilgan: «Instagram raqamlari» aniq, rasmiy kirishdan; «raqamlar qidiruvdan» faqat natijadagi obunachilar. Auditoriyaning shaharlari, yoshi va qamrovini faqat blogerning o‘zi statistikasida ko‘radi, shuning uchun u javob berganda undan statistika skrinshotlarini so‘rash kerak.",
          ],
        },
        {
          id: "bloggers-send",
          title: "Birinchi xabar: Telegram, Direct, pochta",
          body: [
            "Mos bloger tayyor matn bilan «Yuborishga» ga tushadi. Qayerga yozishni agent profil sarlavhasidagi va saytidagi kontaktlar bo‘yicha hal qiladi: Telegram bo‘lsa unga, pochta bo‘lsa pochtaga, ikkalasi ham bo‘lmasa Instagram Directiga. Matn model emas, shablon: biz kimmiz, nima taklif qilamiz va hamkorlik dasturi shartlari. Foizlar va eng kam to‘lov dastur qoidalaridan olinadi, [«Hamkorlar»](/admin/partners) va saytdagi dastur sahifasidagi bilan bir xil: agent o‘z raqamlarini o‘ylab topmaydi. Matn tili rus yoki o‘zbek, bloger blogini qaysi tilda yuritsa.",
            "Instagram o‘zining rasmiy kirishi orqali birinchi bo‘lib yozishga ruxsat bermaydi, studiya akkauntiga begona dastur bilan kirmaymiz: buning uchun Instagram akkauntni bloklaydi. Shuning uchun Direct va pochtaga odam o‘z telefonidan yuboradi: **«Nusxalash va Directni ochish»** matnni buferga qo‘yadi va Instagram ilovasida bloger bilan yozishmani ochadi, **«Nusxalash va pochtani ochish»** esa tayyor xatni ochadi. Qo‘ying, yuboring va **«Yubordim»** ni bosing, bloger «Yozdik, javob kutyapmiz» ga o‘tadi. Studiyaning Instagram akkauntidan yuboring: blogerning javobi o‘sha yerga keladi.",
            "Kuniga «Kuniga Direct va pochta» dan ko‘p emas (odatiy 10): bitta akkauntdan ko‘p bir xil birinchi xabarlarni Instagram spam deb hisoblaydi. Norma bajarilsa, yuborish tugmalari ertagacha yo‘qoladi. Telegrami bor blogerlarga, aloqalardagi kompaniyalar kabi, studiyaning ishchi akkauntidan birinchi bo‘lib faqat salom ketadi, blogerlarning esa o‘z «Kuniga Telegram» kvotasi bor (odatiy 3) va u kompaniyalar uchun 20 ta aloqa normasiga tegmaydi. **«Mos emas»** blogerni ro‘yxatdan olib tashlaydi. Menejer «Blogerlar» yorlig‘ini, agar egasi unga bo‘limni [«Jamoa»](/admin/team) da ochgan bo‘lsa, ko‘radi: u matnlarni yuboradi, javoblarni belgilaydi va suhbatni o‘zi olib borishi mumkin, agent sozlamalari, qidiruv, baholash, studiya Instagrami va hamkor ochish esa unga ko‘rinmaydi.",
          ],
        },
        {
          id: "bloggers-partner",
          title: "Bloger javob berdi: suhbat va hamkorlik",
          body: [
            "Bloger javob berdi, keyin yozishmani agent olib boradi. Telegramdagi javobni u o‘zi ko‘radi: blogerning birinchi xabariga o‘sha ishchi akkauntdan javob tilida dastur haqidagi matn ketadi, keyin agent javob beradi. Directda ham xuddi shunday, studiya Instagrami **«Studiya Instagramini ulash»** tugmasi bilan ulanganda: siz studiya akkauntidan yozgan bloger javob beradi va agent uni nik bo‘yicha topadi. Direct ulanmaguncha, Directdagi javobni o‘zingiz belgilaysiz, «Yozdik, javob kutyapmiz» da **«Javob berdi»**, va suhbatni telefondan olib borasiz.",
            "Agent arzon model (Haiku). Birinchi xabarida u studiyaning SI yordamchisi ekanini aytadi, faqat dastur qoidalaridagi shartlarni aytadi (qoidalarda yo‘q raqamlarni kod tekshiruvi o‘tkazmaydi) va blogerga qiziq bo‘lsa, statistika skrinshotlarini so‘raydi: shaharlar, yosh, 30 kunlik qamrov. Skrinshotlarni rasmli model o‘qiydi, auditoriya balini esa kod qo‘yadi: obunachilar qayerdan, 40 gacha; 25–44 yoshlilar ulushi, 30 gacha; qamrovning obunachilarga nisbati, 30 gacha. U kartochkada «Auditoriya» qatorida ko‘rinadi. Skrinshotlarning o‘zini saqlamaymiz, faqat xulosani.",
            "Rozi bo‘ldi va auditoriya bali 60 dan yuqori bo‘lsa, agent o‘zi [«Hamkorlar»](/admin/partners) da hamkor ochadi va blogerga havola yuboradi, egasi va rahbarga esa botga xabar keladi. Bal past yoki skrinshotlar yo‘q bo‘lsa, siz hal qilasiz: **«Hamkor qilish»** yoki **«Rad etdi»**. Odamni, maxsus shartlarni so‘rasa yoki javob tekshiruvdan o‘tmasa, agent 12 soatga jim bo‘ladi, sizga botga xabar keladi. Blogerga studiya akkauntidan o‘zingiz javob bersangiz yoki **«O‘zim olib boraman»** ni bossangiz, agent ham 12 soat jim turadi, **«Agentga qaytarish»** esa uni yana yoqadi. Hamkor Telegramsiz ochiladi: bloger botda balansini ko‘rmaydi, uni o‘zingiz ayting.",
          ],
        },
        {
          id: "bloggers-keys",
          title: "Instagram ulanishlari: qaysi kalitlar va ularni qayerdan olish",
          roles: ["admin", "head"],
          body: [
            "**«Instagram ulanishlari»** bloki — Meta (Facebook va Instagram kompaniyasi) kalitlari, ularsiz agent yarim kuch bilan ishlaydi. Kalitni maydonga qo‘ying va **«Saqlash va tekshirish»** ni bosing: server uni sirlar omboriga qo‘yadi, u yerda u shifrlangan. Kalit ekranga qaytib chiqmaydi, faqat «kiritilgan» yoki «bo‘sh» ko‘rinadi, saqlashda bo‘sh maydon esa kalitni o‘zgartirmaydi. Agar kalit serverdagi .env faylida turgan bo‘lsa, u ombordan ustun, maydon yonida shu yozib qo‘yiladi. Jurnalga faqat qaysi kalit kiritilgani tushadi, qiymatisiz.",
            "«1. Boshqa profillar raqamlari» — Facebook tokeni, u EA… bilan boshlanadi. U bilan agent blogerning aniq obunachilari, layklari, izohlari va qanchalik tez-tez yozishini ko‘radi (rasmiy Business Discovery kirishi); usiz — faqat qidiruv natijasidagi obunachilar soni. Token Graph API Explorer’da maslahatdagi huquqlar bilan olinadi va «Access Token Debugger» da 60 kungacha uzaytiriladi; havolali barcha qadamlar — «Qayerdan olish — qadamma-qadam» ostida. Studiya Instagram akkaunti raqamini yozish shart emas: tekshiruv uni token orqali o‘zi topadi va boshqa profil raqamlarini olishga urinib ko‘radi. Tekshiruvdan keyin blokda ishlayaptimi va token qaysi sanagacha amal qilishi yoziladi; tugashiga bir hafta qolganda qator sariq bo‘ladi — 3 va 4-qadamlarni takrorlang.",
            "«2. Directda blogerlarga javoblar» — Meta dasturchi kabinetidagi Instagram ilovasi ID va siri. Vebhuk tekshiruv tokeni birinchi saqlashda o‘zi yaratiladi: uni, vebhuk manzilini va ikkita qaytish manzilini ilova sozlamalariga «Nusxalash» tugmasi bilan qo‘yishadi. Keyin «Direct yozishmasi» qatoridagi **«Studiya Instagramini ulash»** ni bosing. Ko‘p uchraydigan xato — «Instagram app ID» o‘rniga ilovaning umumiy raqamini qo‘yish: unda ulashda Instagram «Invalid request» deb yozadi (kerakli raqam qayerdaligini 3-qadam aytadi). Meta kabinetida ilova holati «Unpublished» ekan, agent xabarlarni faqat tester akkauntlardan oladi. Unga barcha blogerlar yozishi uchun ilova o‘z «Dashboard» idagi talablar ro‘yxatidan o‘tadi: «testlar» (har bir ruxsat bo‘yicha Instagramga kamida bitta muvaffaqiyatli murojaat, ularni ulashning o‘zi qiladi), «Business verification» (YaTT hujjatlari, bir necha kundan bir necha haftagacha), «App Review» (ingliz tilida tavsif va ekran yozuvlari) va «Publish» — «Qayerdan olish — qadamma-qadam» ostidagi 9–12-qadamlar. Boshqa profillar raqamlari uchun bularning hammasi shart emas. Hammasi kiritilgan va tekshiruvdan o‘tgan bo‘lsa, blok bitta qatorga yig‘iladi.",
          ],
        },
        {
          id: "bloggers-access",
          title: "Bo‘lim kimga ochiq",
          roles: ["admin"],
          body: [
            "Varaqning pastida — **«Bo‘lim kimga ochiq»** bloki: belgilar bilan rahbarlar va menejerlar. Odatiy holatda bo‘lim sizga va rahbarga ochiq. Belgilangan menejerga «SI xodimlar» bo‘limi — «Blogerlar» varag‘i ochiladi: u birinchi xabarlarni yuboradi, javoblarni belgilaydi va suhbatni o‘zi olib borishi mumkin. Kalitlar, agent sozlamalari, qidiruv va hamkor qo‘shish menejerga ko‘rinmaydi.",
            "Bu har bir xodimdagi [«Jamoa»](/admin/team) → «Bo‘limlar» dagi o‘sha belgi: bu yerda qo‘yilsa — u yerda ham turadi, va aksincha. **«Kirishni saqlash»** dan keyin bo‘lim odamga paneldagi keyingi o‘tishda ochiladi, jurnalda esa «xodimga panelning qaysi bo‘limlari ochiqligini o‘zgartirdi» qatori qoladi.",
          ],
        },
        {
          id: "bloggers-invite",
          title: "Botdagi «Работа с блогерами» taklifi",
          body: [
            "Hozircha yuborilmaydi: taklif «Blogerlar» agenti ishga tushgach va egasi ruxsat berganda ketadi. Egasi 12.10.2026 da menejerlar va rahbarni blogerlar bilan ishlashga taklif qildi: ularni topish, birinchi bo‘lib yozish, «ha» degan javobgacha olib borish va hamkor qilib ro‘yxatdan o‘tkazish. Taklif studiya botidan Telegramga bir marta keldi, tunda emas: nima uchun (kontaktlar me’yoridan tashqari o‘z daromadingiz: olib kelingan bloger mijozlaridan studiya sof foydasining 5% i, birinchi yarim yil davomida), nima qilish kerak va qayerda. Uning ostida ikki tugma: «✅ Принять» va «✖ Отклонить».",
            "Javob bir marta yoziladi: bosgandan keyin tugmalar yo‘qoladi, taklif ostida javob qatori qoladi, qayta bosilsa «Ответ уже записан» deb javob beradi. «✅ Принять» darhol ishga ulaydi: menejerga shu bo‘lim, «Blogerlar» varag‘i, egasining belgisi kabi ochiladi va bot birinchi xabar matnlari hamda e’tirozlarga javoblar yozilgan PDF eslatmani yuboradi. Rahbarga bo‘lim baribir ochiq, unga faqat eslatma keladi. «✖ Отклонить» hech narsani ochmaydi; fikringiz o‘zgarsa, rahbar yoki egaga yozing.",
          ],
        },
        {
          id: "bloggers-invite-answers",
          title: "Taklifni kim qabul qildi",
          roles: ["admin", "head"],
          body: {
            admin: [
              "Har bir javob sizga botga «Ism qabul qildi / rad etdi» qatori bilan joriy natija bilan birga keladi: kim qabul qildi, kim rad etdi, kim jim. Yuborilgan kuni soat 18:00 da natija yana bir xabar bilan keladi. Yuborilgandan so‘ng darhol bot taklif nusxasini yuboradi: sizning nomingizdan menejerlarga ketgan matn.",
              "Qabul qilgan menejerga «SI xodimlar» bo‘limi [«Jamoa»](/admin/team) → «Bo‘limlar» dagi belgi bilan ochiladi. Bo‘limni qaytarib yopish kerak bo‘lsa, shu belgini olib tashlang: taklifdagi javob saqlanadi, taklif qayta ketmaydi. «Blogerlar» varag‘ida menejer belgi bo‘yicha qila oladigan ishlarni qiladi: birinchi xabarlarni yuboradi va javoblarni belgilaydi; agent sozlamalari, qidiruv va hamkor qo‘shish siz va rahbarda qoladi.",
            ],
            head: [
              "Menejerning har bir javobi sizga botga «Ism qabul qildi / rad etdi» qatori bilan keladi. Butun jamoa bo‘yicha natijani (kim qabul qildi, kim rad etdi, kim jim) egasi yuborilgan kuni soat 18:00 da oladi.",
              "Qabul qilgan menejerga «Blogerlar» varag‘i ochiladi: u birinchi xabarlarni yuboradi va javoblarni belgilaydi, agent sozlamalari, qidiruv va hamkor qo‘shish esa siz va egada qoladi. Bloger menejerga «ha» desa, hamkor kartasida uni kim olib kelganini belgilang: belgisiz menejerga bonus hisoblab bo‘lmaydi.",
            ],
          },
        },
      ],
    },

    /* ── Обучение ─────────────────────────────────────────────────────── */
    "/admin/learn": {
      what: "Sotuv kurslari va panel bo‘yicha test. Kurslar studiya kompaniyalarga aslida qanday yozishini tushuntiradi. Har bir kursda qisqa darslar va oxirida test bor.",
      items: [
        {
          id: "switch",
          title: "O‘chirgich: jamoa bo‘limni faqat siz tugmani bosgandan keyin ko‘radi",
          roles: ["admin"],
          body: [
            "Ta’lim o‘chirilgan paytda bo‘limni faqat siz ko‘rasiz. Jamoada u menyuda ham, yo‘riqnomada ham yo‘q, bot esa /learn ga ta’lim yoqilmaganini aytadi. O‘zingiz istalgan kursni topshirib, qanday ko‘rinishini tekshirishingiz mumkin.",
            "Bo‘lim tepasida sariq yozuv va **«Jamoa uchun ta’limni yoqish»** tugmasi bor. Bosgandan keyin bo‘lim hammada paydo bo‘ladi, /learn esa bot menyusiga qo‘shiladi. **«Ta’limni o‘chirish»** tugmasi bo‘limni yana yashiradi, natijalar saqlanib qoladi.",
            "To‘g‘ri javoblar 70% va undan ko‘p bo‘lsa, test topshirilgan hisoblanadi. Kurslar menejerlar uchun majburiy. Chegarani faqat kodda o‘zgartirish mumkin: dasturchiga ayting.",
          ],
        },
        {
          id: "courses",
          title: "Sotuv kurslari",
          body: [
            "Kurslar oltita va ular bizning haqiqiy jarayon haqida: birinchi «Здравствуйте», dumaloq video, mijozning «+» roziligi, e’tirozlar, xat matnlari va iliq lidlar. Xatlar haqidagi kursda [«Sovuq aloqalar»](/admin/prospect) bo‘limidagi matnlarning o‘zi turadi.",
            "**«Sotuv kurslari»** blokida kurs kartochkasini bosing. Ichida darslar tartib bilan, ularning ostida «Materiallar» va test. Kartochkada darslar va savollar soni hamda natijangiz ko‘rinadi: topshirilgan, topshirilmagan yoki «hali topshirilmagan».",
          ],
        },
        {
          id: "quiz",
          title: "Testni qanday topshirish",
          body: [
            "**«Testni boshlash»** tugmasini bosing. Savollar bittadan keladi. Javobdan keyin darhol to‘g‘ri yoki noto‘g‘ri ekani va nima uchunligi ko‘rinadi. Xato qildingizmi? Yonida **«Darsni qayta o‘qish»** havolasi bor, panel bo‘yicha testda esa **«Yo‘riqnoma bandini ochish»**.",
            "To‘g‘ri javoblar 70% va undan ko‘p bo‘lsa, test topshirilgan. Savolni o‘tkazib bo‘lmaydi, javobsiz savol xato hisoblanadi. **«Yana topshirish»** tugmasi bilan xohlagancha qayta topshirish mumkin, eng yaxshi natija hisobga olinadi.",
            "Shu testlar Telegramdagi studiya botida ham bor. Unga /learn deb yozing va testni tanlang. Botdagi natija paneldagi bilan bir joyga tushadi.",
          ],
        },
        {
          id: "panel-quiz",
          title: "Panel bo‘yicha test",
          body: [
            "**«Panel bo‘yicha test»** panelni qanchalik bilishingizni tekshiradi: lidlar navbati, [kunlik to‘plam](#prospect-portion), maketlar va boshqa bo‘limlar. Xato qilsangiz, yonida shu yo‘riqnomaning kerakli bandiga havola chiqadi.",
            "Savollar faqat sizga ochiq bo‘limlar haqida. Shuning uchun menejer va rahbarda ularning soni har xil.",
          ],
        },
        {
          id: "required",
          title: "Nima majburiy",
          body: {
            manager: [
              "Ta’lim menejerlar uchun majburiy: barcha kurslar va panel bo‘yicha test, kamida 70% to‘g‘ri javob. Bo‘lim tepasidagi **«Topshirish qoldi»** bloki hali nima topshirilmaganini ko‘rsatadi. Hammasi topshirilganda u yerda «Barcha majburiy testlar topshirildi.» deb yoziladi.",
              "Bu ishlashga xalaqit bermaydi: lidlar va kunlik to‘plam odatdagidek keladi. Lekin rahbar va egasi kim nimani topshirganini ko‘radi. Kurslarni birinchi kunlarda topshiring.",
            ],
            head: [
              "Kurslar menejerlar uchun majburiy: barcha kurslar va panel bo‘yicha test, kamida 70% to‘g‘ri javob. Siz uchun ixtiyoriy. Lekin menejerlaringizdan nima so‘ralishini bilish uchun panel bo‘yicha testni topshirish foydali.",
              "Kurslarsiz ham ishlash mumkin, majburiylik faqat ko‘rsatiladi. Menejerda bu «Topshirish qoldi» bloki, sizda esa [jamoa natijalaridagi](#learn-results) **«Topshirilmagan»** ustuni.",
            ],
            admin: [
              "Ta’lim yoqilgan paytda kurslar menejerlar uchun majburiy: barcha kurslar va panel bo‘yicha test, kamida 70% to‘g‘ri javob. Rahbar va siz uchun ixtiyoriy. Ta’lim o‘chirilganda majburiy narsa yo‘q, qarang: [o‘chirgich](#learn-switch).",
              "Kurslarsiz ham ishlash mumkin, majburiylik faqat ko‘rsatiladi. Menejerda bu «Topshirish qoldi» bloki, siz va rahbarda esa [jamoa natijalaridagi](#learn-results) **«Topshirilmagan»** ustuni.",
            ],
          },
        },
        {
          id: "results",
          title: "Jamoa natijalari",
          roles: ["admin", "head"],
          body: [
            "Bo‘lim pastida **«Jamoa natijalari»** jadvali. Qatorda xodim, ustunlarda kurslar va panel bo‘yicha test. Katakda eng yaxshi natija, masalan «5/6»: yashil topshirilgan, sariq hali yo‘q, nuqta topshirmagan degani.",
            "**«Topshirilmagan»** ustuni menejerga nima topshirish qolganini ko‘rsatadi. «yangi» belgisi ta’lim boshlangandan keyin qo‘shilgan menejerda turadi. Botdagi urinishlar ham shu yerda. Ortda qolganga shaxsan yozib, xatolarni birga ko‘rib chiqqan yaxshi.",
          ],
        },
        {
          id: "video-course",
          title: "Menejerlar uchun videokurs",
          body: {
            manager: [
              "**«Menejerlar uchun videokurs»** bloki bu 13 ta qisqa video, jami bir soatga yaqin. Ularda studiya nima sotishi, mijozning «Здравствуйте»dan shartnomagacha yo‘li va egalarning qo‘rquvlariga nima javob berish haqida. Nutq rus tilida, subtitrlar o‘zbekcha.",
              "Tartib bilan, bir vaqtda bitta videodan ko‘ring. Har birida topshiriq bor: pauza qiling, o‘zingiz javob bering, keyin tahlilni ko‘ring. «Video hali yuklanmagan.» yozuvi video hali joylanmaganini bildiradi.",
            ],
            head: [
              "**«Menejerlar uchun videokurs»** bloki bu 13 ta qisqa video, jami bir soatga yaqin: studiya nima sotadi, mijoz yo‘li va egalarning qo‘rquvlari. Nutq rus tilida, subtitrlar o‘zbekcha. Videoni «Ta’lim» ochiq bo‘lgan har kim ko‘radi.",
              "Har bir video ostida **«Videoni yuklash yoki almashtirish»** bloki bor. «Video tili»ni (kursda bu rus tili), MP4 faylni tanlang va «Yuklash»ni bosing. Yangi video shu tildagi eskisining o‘rnini egallaydi, «Olib tashlash» esa uni o‘chiradi.",
            ],
            admin: [
              "**«Menejerlar uchun videokurs»** bloki bu 13 ta qisqa video, jami bir soatga yaqin: studiya nima sotadi, mijoz yo‘li va egalarning qo‘rquvlari. Nutq rus tilida, subtitrlar o‘zbekcha. Bo‘lim o‘chirilgan paytda videoni faqat siz ko‘rasiz.",
              "Har bir video ostida **«Videoni yuklash yoki almashtirish»** bloki bor. «Video tili»ni (kursda bu rus tili), MP4 faylni tanlang va «Yuklash»ni bosing. Yangi video shu tildagi eskisining o‘rnini egallaydi, «Olib tashlash» esa uni o‘chiradi. Rahbar ham yuklay oladi.",
            ],
          },
        },
        {
          id: "materials",
          title: "Kurs materiallari",
          body: {
            manager: [
              "Kurs darslari ostida **«Materiallar»** bloki bor: videolar, muvaffaqiyatli suhbatlar yozuvlari, maqolalar. Havolalarni egasi qo‘shadi, ular yangi oynada ochiladi. Havola bo‘lmasa ham kursni topshirish mumkin.",
            ],
            head: [
              "Kurs darslari ostida **«Materiallar»** bloki bor: videolar, muvaffaqiyatli suhbatlar yozuvlari, maqolalar. Havolalarni egasi qo‘shadi. Jamoa uchun foydali narsa topdingizmi? Unga yuboring.",
            ],
            admin: [
              "Har bir kursda va panel bo‘yicha testda **«Materiallar»** bloki bor. «Nomi» va «Havola»ni (manzil https:// yoki http:// bilan boshlanadi) yozib, **«Material qo‘shish»**ni bosing. Havola darhol hammada paydo bo‘ladi, «Materialni olib tashlash» esa uni o‘chiradi. Qo‘shish va olib tashlashni faqat siz qila olasiz.",
            ],
          },
        },
      ],
    },

    /* ── Настройки ───────────────────────────────────────────────────── */
    "/admin/settings": {
      what: "Panelning barcha sozlamalari bitta sahifada. U tepada o‘ngda, ismingiz yonidagi ⚙ tishli g‘ildirak bilan ochiladi. O‘zingizniki shu yerda o‘zgaradi, qolgani havola orqali ochiladi.",
      items: [
        {
          id: "mine",
          title: "«Meniki»: til, menyu, telefon va bot",
          body: {
            manager: [
              "**«Meniki»** bloki faqat sizga tegishlisini o‘zgartiradi, darhol barcha qurilmalaringizda. **«Panel va yo‘riqnoma tili»** RU, UZ yoki PL ni almashtiradi. Bot xabarlari hozircha rus tilida keladi.",
              "**«Menyu ko‘rinishi»** chapda belgilar bilan «Yangi menyu»ni yoki bitta qatorli eski menyuni tanlaydi. Yonidagi tugmalar panel bilan tanishuvni va [«Bozorlar»](/admin/markets) bo‘limi bo‘yicha ta’limni qayta ko‘rsatadi.",
              "**«Shu qurilmadagi bildirishnomalar»** pushni (ekranda chiqadigan xabar) yoqadi, unda bot Telegramda yozadigan matnning o‘zi bo‘ladi. Har bir qurilmada alohida yoqing.",
              "**«Bot menga nimalarni yuboradi»** botning nechta turdagi xabari sizga kelishini ko‘rsatadi. Belgilarni rahbar yoki egasi «Jamoa»da qo‘yadi. Biror narsa ortiqcha yoki yetishmasa, ulardan so‘rang.",
            ],
            head: [
              "**«Meniki»** bloki faqat sizga tegishlisini o‘zgartiradi, darhol barcha qurilmalaringizda. **«Panel va yo‘riqnoma tili»** RU, UZ yoki PL ni almashtiradi. Bot xabarlari hozircha rus tilida keladi.",
              "**«Menyu ko‘rinishi»** chapda belgilar bilan «Yangi menyu»ni yoki bitta qatorli eski menyuni tanlaydi. Yonidagi tugmalar panel bilan tanishuvni va [«Bozorlar»](/admin/markets) bo‘limi bo‘yicha ta’limni qayta ko‘rsatadi.",
              "**«Shu qurilmadagi bildirishnomalar»** pushni (ekranda chiqadigan xabar) yoqadi, unda bot Telegramda yozadigan matnning o‘zi bo‘ladi. Har bir qurilmada alohida yoqing.",
              "**«Bot menga nimalarni yuboradi»** botning nechta turdagi xabari sizga kelishini ko‘rsatadi. Yonidagi havola [Jamoa](/admin/team) bo‘limiga, ismingiz ostidagi belgilarga olib boradi.",
            ],
            admin: [
              "**«Meniki»** bloki faqat sizga tegishlisini o‘zgartiradi, darhol barcha qurilmalaringizda. **«Panel va yo‘riqnoma tili»** RU, UZ yoki PL ni almashtiradi. Bot xabarlari hozircha rus tilida keladi.",
              "**«Menyu ko‘rinishi»** chapda belgilar bilan «Yangi menyu»ni yoki bitta qatorli eski menyuni tanlaydi. Yonidagi tugmalar panel bilan tanishuvni va [«Bozorlar»](/admin/markets) bo‘limi bo‘yicha ta’limni qayta ko‘rsatadi.",
              "**«Shu qurilmadagi bildirishnomalar»** pushni (ekranda chiqadigan xabar) yoqadi, unda bot Telegramda yozadigan matnning o‘zi bo‘ladi. Har bir qurilmada alohida yoqing.",
              "**«Bot menga nimalarni yuboradi»** botning nechta turdagi xabari sizga kelishini ko‘rsatadi. Yonidagi havola [Jamoa](/admin/team) bo‘limiga, ismingiz ostidagi belgilarga olib boradi.",
            ],
          },
        },
        {
          id: "leads",
          title: "«Qaysi lidlarni yuborish»: o‘zingiz tanlaysiz",
          body: [
            "«Meniki» blokida **«Qaysi lidlarni yuborish»** bor. Bu lid turlari bo‘yicha belgilar: «Sovuq aloqalar», «Tenderlar», «Guruhlardan signallar (skaut)», «Hamkorlar va agentliklar», «Sayt va botdan buyurtmalar», «Botdan maket» va «SI bo‘yicha yordam (Claudery)». Boshida hammasi belgilangan.",
            "Ortiqchasini olib tashlab, **«Saqlash»**ni bosing. Bot bunday lidlarni yubormaydi, [navbat](#leads-queue) ham ularni sizga taklif qilmaydi. Ular darhol belgisi turganlarga ketadi.",
            "Bu turni hech kim tanlamagan bo‘lsa, mijoz yo‘qolmasligi uchun lid baribir hammaga keladi. Rahbar va egasi bu belgilarni siz uchun «Jamoa»da qo‘ya oladi.",
          ],
        },
        {
          id: "links",
          title: "Aloqalar va jamoa: havolalar bilan",
          body: {
            manager: [
              "**«Aloqalar»** blokida sizda bitta qator: «Xat matnlari va A/B». U yerda sayt haqidagi xat matnlaringiz, jamoaning umumiy matnlari va qaysi matnga ko‘proq javob kelishi. **«Ochish»** to‘g‘ri o‘sha yerga olib boradi.",
              "Bu yerda faqat sizga ochiq narsalar. Salomlashuv, avtomatik aloqalar, dumaloq videolar va akkauntlarni rahbar va egasi sozlaydi.",
            ],
            head: [
              "**«Aloqalar»** blokida beshta qator: «Xat matnlari va A/B», «Birinchi xabar», «Avtomatik aloqalar», «Sohalar bo‘yicha dumaloq videolar» va «Ishchi akkauntlar». **«Jamoa va kirish»** blokida «Bot jamoaga nimalarni yuboradi» qatori. **«Ochish»** to‘g‘ri kerakli joyga olib boradi.",
              "Tugmalarning o‘zi o‘z bo‘limlarida qolgan, bu yerda faqat havolalar. Bo‘limlarga kirish, cheklovsiz lidlar va ta’limni egasi hal qiladi, shuning uchun bu qatorlar sizda yo‘q.",
            ],
            admin: [
              "**«Aloqalar»** blokida beshta qator: «Xat matnlari va A/B», «Birinchi xabar», «Avtomatik aloqalar», «Sohalar bo‘yicha dumaloq videolar» va «Ishchi akkauntlar». **«Jamoa va kirish»** blokida: «Bot jamoaga nimalarni yuboradi», «Bo‘limlarga kirish», «Cheklovsiz lidlar» va «Jamoa uchun ta’lim». **«Ochish»** to‘g‘ri kerakli joyga olib boradi.",
              "Rahbar bo‘limlarga kirish, cheklovsiz lidlar va ta’limdan boshqa hammasini ko‘radi. Menejerda faqat o‘z sozlamalari va «Xat matnlari va A/B». Odamga bo‘limni yopsangiz, uning qatorlari bu yerdan ham yo‘qoladi.",
            ],
          },
        },
      ],
    },

    /* ── Инструкции ───────────────────────────────────────────────────── */
    "/admin/help": {
      what: "Shu sahifa. Bu yerda bo‘limlar bo‘yicha panel qanday ishlashi tushuntirilgan. Siz faqat sizga ochiq narsalarni ko‘rasiz.",
      items: [
        {
          id: "how",
          title: "Yo‘riqnomadan qanday foydalanish",
          body: [
            "Panelning har bir bo‘limida tepada «Bo‘limdan qanday foydalanish» tugmasi bor. U shu yerda o‘sha bo‘lim haqidagi bandni ochadi. Murakkab bloklar yonida kichik «?» bor, u to‘g‘ri kerakli bandga olib boradi.",
            "Sahifa tepasida mundarija va yo‘riqnoma tilini tanlash. Tugma yoki havola orqali kelgan bandingiz besh soniya yashil ramka bilan yonib turadi.",
            "Biror narsa yetishmayaptimi yoki ekranda boshqacha? Egasiga ayting, qo‘shib qo‘yamiz.",
          ],
        },
        {
          id: "crash",
          title: "Sahifa yuklanmadi",
          body: [
            "Ba’zan bir soniyaga «Sahifa yangilanmoqda…» chiqadi. Bu aloqadagi qisqa uzilish, panel sahifani o‘zi qayta yuklaydi. Saqlagan hamma narsangiz joyida.",
            "Ikkinchi marta ham chiqmasa, «Sahifa yuklanmadi» va «Yangilash» tugmasi chiqadi. Uni bosing. Tez-tez takrorlanadimi? Rahbarga qaysi sahifada va soat nechada bo‘lganini yozing.",
          ],
        },
        {
          id: "menu",
          title: "Menyu: belgilar qatori, «Yana» va qidiruv",
          body: {
            manager: [
              "Har kungi bo‘limlar chapdagi belgilar qatorida: «Bosh sahifa», [«Kiruvchi»](/admin/inbox), «Lidlar», «Vazifalar», «Sovuq aloqalar», «Maketlar». Telefonda bu qator ekran pastida, «Maketlar» esa «Yana»da birinchi qatorda. «Vazifalar»dagi raqam ochiq vazifalaringizni ko‘rsatadi, qizil bo‘lsa muddati o‘tganlari bor.",
              "Qolgani qator pastidagi «Yana» tugmasi ostida, masalan «Loyihalar», «Statistika» va «Yo‘riqnoma». Kam ishlatiladigan bo‘limlar sahifa tepasida yorliqlar bo‘lib ochiladi: masalan «Statistika» va «Sotuv bosqichlari». Eski bir qatorli menyu qulaymi? «Yana»da yoki [«Sozlamalar»](/admin/settings) bo‘limida «Yangi menyu»ni o‘chiring.",
              "Tepada o‘ngda qo‘ng‘iroqcha 🔔. Unda bot sizga 14 kun ichida Telegramda yozgan hamma narsa: «✓ Bajarildi» qatorni hisobdan olib tashlaydi, «Hammasini belgilash» hammasini. Yonida ⚙ tishli g‘ildirak, u sozlamalarni ochadi. Til va «Chiqish» ism-sharifingiz bosh harflari yozilgan doiracha ostida.",
              "Eng tezi tepadagi qidiruv yoki Ctrl+K tugmalari (Mac’da ⌘K). Bo‘lim, kompaniya, ism, buyurtma raqami, telefon yoki @nikni yozing. Telefon va @nik bo‘yicha faqat o‘z lidlaringiz topiladi. Yashil «Onlayn» nuqtasi internet borligini bildiradi, «Aloqa yo‘q» bo‘lsa panel tugmalari ishlamaydi.",
            ],
            head: [
              "Har kungi bo‘limlar chapdagi belgilar qatorida: «Bosh sahifa», [«Kiruvchi»](/admin/inbox), «Lidlar», «Vazifalar», «Sovuq aloqalar», «Maketlar». Telefonda bu qator ekran pastida, «Maketlar» esa «Yana»da birinchi qatorda. «Vazifalar»dagi raqam ochiq vazifalaringizni ko‘rsatadi, qizil bo‘lsa muddati o‘tganlari bor.",
              "Qolgani qator pastidagi «Yana» tugmasi ostida, guruhlar bilan: «Pul», «Marketing», «Jamoa» va boshqalar. Kam ishlatiladigan bo‘limlar sahifa tepasida yorliqlar bo‘lib ochiladi: masalan «Jamoa» va «Nomzodlar». Eski bir qatorli menyu qulaymi? «Yana»da yoki [«Sozlamalar»](/admin/settings) bo‘limida «Yangi menyu»ni o‘chiring.",
              "Tepada o‘ngda qo‘ng‘iroqcha 🔔. Unda bot sizga 14 kun ichida Telegramda yozgan hamma narsa: «✓ Bajarildi» qatorni hisobdan olib tashlaydi, «Hammasini belgilash» hammasini. Yonida ⚙ tishli g‘ildirak, u sozlamalarni ochadi. Til va «Chiqish» ism-sharifingiz bosh harflari yozilgan doiracha ostida.",
              "Eng tezi tepadagi qidiruv yoki Ctrl+K tugmalari (Mac’da ⌘K). Bo‘lim, kompaniya, ism, buyurtma raqami, telefon yoki @nikni yozing, pastda «Kompaniyalar va lidlar» chiqadi. Yashil «Onlayn» nuqtasi internet borligini bildiradi, «Aloqa yo‘q» bo‘lsa panel tugmalari ishlamaydi.",
            ],
            admin: [
              "Har kungi bo‘limlar chapdagi belgilar qatorida: «Bosh sahifa», [«Kiruvchi»](/admin/inbox), «Lidlar», «Vazifalar», «Sovuq aloqalar», «Maketlar». Telefonda bu qator ekran pastida, «Maketlar» esa «Yana»da birinchi qatorda. «Vazifalar»dagi raqam ochiq vazifalaringizni ko‘rsatadi, qizil bo‘lsa muddati o‘tganlari bor.",
              "Qolgani qator pastidagi «Yana» tugmasi ostida, guruhlar bilan: «Pul», «Marketing», «Jamoa», «Hisobotlar» va boshqalar. Kam ishlatiladigan bo‘limlar sahifa tepasida yorliqlar bo‘lib ochiladi: masalan «Jurnal» va «Foydalanish». Eski bir qatorli menyu qulaymi? «Yana»da yoki [«Sozlamalar»](/admin/settings) bo‘limida «Yangi menyu»ni o‘chiring.",
              "Tepada o‘ngda qo‘ng‘iroqcha 🔔. Unda bot sizga 14 kun ichida Telegramda yozgan hamma narsa: «✓ Bajarildi» qatorni hisobdan olib tashlaydi, «Hammasini belgilash» hammasini. Yonida ⚙ tishli g‘ildirak, u sozlamalarni ochadi. Til va «Chiqish» ism-sharifingiz bosh harflari yozilgan doiracha ostida.",
              "Eng tezi tepadagi qidiruv yoki Ctrl+K tugmalari (Mac’da ⌘K). Bo‘lim, kompaniya, ism, buyurtma raqami, telefon yoki @nikni yozing, pastda «Kompaniyalar va lidlar» chiqadi. Yashil «Onlayn» nuqtasi internet borligini bildiradi, «Aloqa yo‘q» bo‘lsa panel tugmalari ishlamaydi.",
              "Menyu sizning [bo‘lim belgilaringizga](#team-sections) bo‘ysunadi. Odamga bo‘limni ochsangiz, u uning menyusida paydo bo‘ladi. Yopsangiz, bo‘lim menyudan ham, qidiruvdan ham yo‘qoladi.",
            ],
          },
        },
        {
          id: "search",
          title: "Qidiruv: o‘z so‘zlaringiz bilan so‘rang",
          body: {
            manager: [
              "Mundarija ustida **«Yo‘riqnomadan topish»** maydoni bor. Savolni hamkasbdan so‘ragandek yozing, masalan «lidni boshqa menejerga qanday berish», va **«Topish»**ni bosing. Rus, o‘zbek yoki polyak tilida, hatto xatolar bilan ham yozish mumkin.",
              "Dastur bandni ma’nosiga qarab tanlaydi. Sahifa unga aylanadi va u yashil ramka bilan yonadi. Boshqa bandlar ham mos kelsa, ular pastda, «Yana mos kelishi mumkin:» dan keyin bo‘ladi.",
              "Ba’zan maydon ostida band so‘zlar mosligi bo‘yicha tanlangani yoziladi. Bu qidiruv band bo‘lsa yoki 10 daqiqada 20 tadan ko‘p savol berilsa bo‘ladi: o‘sha band ekanini tekshiring. Hech narsa topilmadimi? Demak, bu yo‘riqnomada hali yo‘q, egasiga ayting.",
            ],
            head: [
              "Mundarija ustida **«Yo‘riqnomadan topish»** maydoni bor. Savolni hamkasbdan so‘ragandek yozing, masalan «lidni boshqa menejerga qanday berish», va **«Topish»**ni bosing. Rus, o‘zbek yoki polyak tilida, hatto xatolar bilan ham yozish mumkin.",
              "Dastur bandni ma’nosiga qarab tanlaydi. Sahifa unga aylanadi va u yashil ramka bilan yonadi. Boshqa bandlar ham mos kelsa, ular pastda, «Yana mos kelishi mumkin:» dan keyin bo‘ladi.",
              "Ba’zan maydon ostida band so‘zlar mosligi bo‘yicha tanlangani yoziladi. Bu qidiruv band bo‘lsa yoki 10 daqiqada 20 tadan ko‘p savol berilsa bo‘ladi: o‘sha band ekanini tekshiring. Hech narsa topilmadimi? Demak, bu yo‘riqnomada hali yo‘q, egasiga ayting.",
            ],
            admin: [
              "Mundarija ustida **«Yo‘riqnomadan topish»** maydoni bor. Savolni hamkasbdan so‘ragandek yozing, masalan «lidni boshqa menejerga qanday berish», va **«Topish»**ni bosing. Rus, o‘zbek yoki polyak tilida, hatto xatolar bilan ham yozish mumkin.",
              "Dastur bandni ma’nosiga qarab tanlaydi. Savol band sarlavhasiga mos kelsa, band darhol ochiladi. «Kim sifatida ko‘rsatish:» rejimida qidiruv tanlangan rol yo‘riqnomasi bo‘yicha boradi. O‘xshash bandlar pastda, «Yana mos kelishi mumkin:» dan keyin bo‘ladi.",
              "Qidiruv band bo‘lsa yoki odam 10 daqiqada 20 tadan ko‘p savol bersa, band so‘zlar mosligi bo‘yicha tanlanadi. Maydon ostida bu haqida yoziladi. Hech narsa topilmadimi? Demak, bunday band yo‘q va uni yozib qo‘yish kerak.",
            ],
          },
        },
        {
          id: "video",
          title: "Bo‘limlar videolari",
          body: {
            manager: [
              "Sahifa tepasida kirish videosi bor: panelga qanday kirish va birinchi kuni nima qilish. Bo‘limning ham o‘z videosi bo‘lishi mumkin, u matndan oldin turadi.",
              "Video yo‘riqnoma tilida ko‘rsatiladi. Bu tilda video bo‘lmasa, boshqa tildagisi chiqadi va video ostida bu yozilgan. Bo‘limga video yetishmayaptimi? Egasi yoki rahbarga ayting.",
            ],
            head: [
              "Sahifa tepasida kirish videosi bor: panelga qanday kirish va birinchi kuni nima qilish. Bo‘limning ham o‘z videosi bo‘lishi mumkin, u matndan oldin turadi.",
              "Videoni siz va egasi yuklay olasiz. Bo‘lim tavsifi ostidagi «Bo‘lim videosi» blokini yoki sahifa tepasidagi «Kirish videosi»ni oching. «Video tili»ni, 500 MB gacha MP4, MOV yoki WebM faylni tanlang va «Yuklash»ni bosing.",
              "Yuklash chizig‘i oxirigacha yetmaguncha sahifani yopmang. Shu tildagi yangi video eskisining o‘rnini egallaydi, «Olib tashlash» esa uni o‘chiradi. Hamma ko‘rishi uchun istalgan tilda bitta video yetarli.",
            ],
            admin: [
              "Sahifa tepasida kirish videosi bor: panelga qanday kirish va birinchi kuni nima qilish. Bo‘limning ham o‘z videosi bo‘lishi mumkin, u matndan oldin turadi.",
              "Videoni siz va rahbar yuklay olasiz. Bo‘lim tavsifi ostidagi «Bo‘lim videosi» blokini yoki sahifa tepasidagi «Kirish videosi»ni oching. «Video tili»ni, 500 MB gacha MP4, MOV yoki WebM faylni tanlang va «Yuklash»ni bosing.",
              "Yuklash chizig‘i oxirigacha yetmaguncha sahifani yopmang. Shu tildagi yangi video eskisining o‘rnini egallaydi, «Olib tashlash» esa uni o‘chiradi. Hamma ko‘rishi uchun istalgan tilda bitta video yetarli. Videoni kim yuklagan va olib tashlagani [«Jurnal»](/admin/audit) bo‘limida ko‘rinadi.",
            ],
          },
        },
        {
          id: "language",
          title: "Panel tili: RU, UZ, PL",
          body: [
            "Panel tili RU, UZ va PL tugmalari bilan almashtiriladi: rus, lotin yozuvidagi o‘zbek va polyak tili. Yangi menyuda ular tepada o‘ngdagi bosh harflaringiz yozilgan doiracha ostida, eski menyuda to‘g‘ri tepada. Tilni [«Sozlamalar»](/admin/settings) bo‘limida ham o‘zgartirish mumkin.",
            "Til brauzerga emas, sizga biriktiriladi. Telefondan ham panel shu tilda ochiladi. Sizning tanlovingiz hamkasblar tilini o‘zgartirmaydi.",
            "Rus tilida faqat Telegramdagi bot xabarlari va tugmalari, hamkor kabineti va buyurtmachi uchun shartnoma qoladi. Yo‘riqnoma panel tilida ochiladi, boshqa tilni shu sahifa tepasida tanlash mumkin.",
          ],
        },
        {
          id: "first-day",
          title: "Birinchi kuni nima qilish kerak",
          body: [
            "[Studiya botini](https://t.me/Devuz_studio_bot) oching va «Старт» tugmasini bosing. Busiz u sizga lid yoki eslatma yubora olmaydi. Panelga /login buyrug‘i bilan kirish mumkin.",
            "«Devuz Scout» kanaliga qo‘shiling va bot hamda kanal ovozini yoqing. Lid taklifi sizni 30 daqiqa kutadi, keyin keyingi odamga o‘tadi.",
            "[Lidlar navbati](#leads-queue) va [lid kartochkasi](#leads-card) haqidagi bandlarni o‘qing. Qolganini bo‘limni birinchi marta ochganda o‘qing. «Bo‘limdan qanday foydalanish» tugmasi doim tepada.",
          ],
        },
        {
          id: "owner-view",
          title: "Jamoa ko‘zi bilan ko‘rish",
          roles: ["admin"],
          body: [
            "Sahifa tepasida «Kim sifatida ko‘rsatish:» va uchta rol bor: «egasi», «rahbar», «menejer». Rolni tanlang, yo‘riqnoma shu roldagi odam ko‘rgandek ko‘rsatiladi. Shunday qilib yangi xodim nimani o‘qishini tekshirish mumkin.",
            "Har bir yangi funksiya shu yerdagi o‘z bandi bilan birga keladi, rus, o‘zbek va polyak tilida. Buni har bir panel yangilanishida test tekshiradi.",
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
        "/login deb yozing — «🔓 Открыть панель» tugmasi va 15 daqiqalik bir martalik havola keladi. Xabarlar ostidagi «Открыть» tugmalari ham panelga o‘zi kiritadi. Bot «Не смог проверить вход: база сейчас не отвечает» deb javob berdi — bu bizdagi nosozlik, sizning ruxsatingiz emas: bir daqiqa kuting va /login ni qayta yozing. «Такой команды у меня нет» javobi Telegramingiz xodimga bog‘lanmaganini yoki sizni o‘chirib qo‘yishganini bildiradi: rahbarga ayting.",
        "Ovozni o‘chirmang: navbat taklifi 30 daqiqa yashaydi, bildirishnoma jim tursa, lid keyingi odamga ketadi.",
        "Bot qaysi xabarlarni yuborishini egasi va loyihalar rahbari «Jamoa» sahifasidagi belgilar bilan tanlaydi. Nimadir kelmasa — ulardan so‘rang: ehtimol, o‘sha belgi olib tashlangan.",
        "Menejerlar va rahbarlarga: chat pastidagi «▶️ Получать лиды» tugmasi (yoki /leads) to‘plamdan tashqari kompaniyalar oqimini yoqadi, «⏸ Не получать лиды» — o‘chiradi. Batafsil — «Sovuq aloqalar» bo‘limida.",
        "Mijoz olib kelib foiz olmoqchi bo‘lsangiz, /ref deb yozing.",
      ],
    },
    {
      name: "«Devuz Scout» kanali",
      url: SCOUT_URL,
      what: "Skaut bu yerga ochiq chatlarda hozir dasturchi qidirayotgan odamlarni va ertalabki xulosani yuboradi. Batafsil — «Skaut signallari» bo‘limida.",
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
