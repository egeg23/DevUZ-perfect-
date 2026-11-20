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
  "Sizga vazifa qo‘yishsa, bot «✅ Взять в работу» tugmasi bilan xabar yuboradi. Keyin «✅ Сделано», «✖ Не сделано» va «🕑 Перенести срок» chiqadi. Telegramda bosilgani panelda darhol ko‘rinadi.",
  "«🕑 Перенести срок» quyidagilarni taklif qiladi: «+1 час», «Завтра 18:00», «+3 дня», «Неделя» va «✏️ Своя дата». O‘z sanangizni botga bitta xabar bilan yozing, masalan `05.10 15:00`.",
  "Vazifa 30 daqiqada olinmasa, bot eslatadi, muddatdan bir soat oldin yana eslatadi. Muddat o‘tsa, sizga ham, qo‘ygan odamga ham yozadi.",
  "Kechasi, Toshkent vaqti bilan 21:00 dan 08:00 gacha, bot jim turadi. Eslatmalar faqat ish kunlari 09:00 dan 19:00 gacha keladi.",
];

export const uz: HelpCopy = {
  title: "Yo‘riqnoma",
  lead: "Bu yerda panel qanday tuzilgani va unda nimani bosish kerakligi yozilgan. Siz faqat sizga ochiq narsani ko‘rasiz. Istalgan bo‘lim tepasidagi «Bo‘limdan qanday foydalanish» tugmasi bu yerga olib keladi, blok yonidagi «?» esa kerakli bandni ochadi.",
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
            "Matnga 20 MB gacha rasm, GIF, video yoki fayl biriktirish mumkin: «📎 Rasm, GIF, video yoki fayl biriktirish» tugmasi. GIF animatsiya bo‘lib, mp4 pleerli video bo‘lib, 10 MB gacha jpg va png rasm bo‘lib, qolgani fayl bo‘lib boradi. Bunda matn shart emas, 1024 belgidan uzun matn esa ilovadan keyin alohida xabar bo‘lib keladi. Avval ilova sizga botda keladi: oluvchilar uni shunday ko‘radi. Buning uchun Telegramingiz «Jamoa»da ulangan bo‘lishi kerak. «Takrorlash» ilovani takrorlamaydi: uni qayta biriktiring.",
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
      what: "Bu yerda odamdan javob kutayotgan mijozlar. Kim uzoqroq kutsa, o‘sha yuqorida.",
      items: [
        {
          id: "queue",
          title: "Bu yerga nima tushadi",
          body: {
            manager: [
              "Bu yerda mijoz aynan sizdan javob kutayotgan yozishmalaringiz. Masalan, lid (mijoz arizasi) kartochkasida «O‘zim javob beraman» tugmasini bosgansiz. Bot o‘zi olib borayotgan suhbatlar bu yerga tushmaydi.",
              "Yuqorida hali hech kim olmagan yangi arizalar soni ko‘rinadi. Mijoz bir soat va undan ko‘p kutsa, qatordagi vaqt sariq rangda yonadi.",
            ],
            head: [
              "Bu yerda mijoz odamdan javob kutayotgan butun jamoaning yozishmalari. Har birida kim olib borayotgani yozilgan. Bot o‘zi olib borayotgan suhbatlar bu yerga tushmaydi.",
              "Bu yerda studiya botining mijozlari ham bor: biz ularga o‘zimiz javob berganmiz, ular esa yana yozgan. Mijoz bir soat va undan ko‘p kutsa, qatordagi vaqt sariq rangda yonadi.",
            ],
            admin: [
              "Bu yerda mijoz odamdan javob kutayotgan butun jamoaning yozishmalari. Har birida kim olib borayotgani yozilgan. Bot o‘zi olib borayotgan suhbatlar bu yerga tushmaydi.",
              "Bu yerda studiya botining mijozlari ham bor: biz ularga o‘zimiz javob berganmiz, ular esa yana yozgan. Mijoz bir soat va undan ko‘p kutsa, qatordagi vaqt sariq rangda yonadi.",
            ],
          },
        },
        {
          id: "layout",
          title: "Ekran qanday tuzilgan",
          body: [
            "Chapda yozishmalar ro‘yxati, o‘rtada suhbat. O‘ngda mijoz kartochkasi va «Bitim bosqichlari», ya’ni sotuvning o‘tilgan qadamlari.",
            "Ba’zan javob maydoni ustida «Javob maslahati» chiqadi. Bu mijozning ko‘p uchraydigan e’tiroziga tayyor matn, masalan «qimmat». «Javobga qo‘yish» uni maydonga qo‘yadi, yuborishni esa o‘zingiz qilasiz.",
            "Telefonda avval ro‘yxat ko‘rinadi. «← Barcha yozishmalar» unga qaytaradi.",
          ],
        },
        {
          id: "reply",
          title: "Qanday javob berish",
          body: {
            manager: [
              "Javobni suhbat ostidagi maydonga yozing va «Yuborish» yoki Ctrl+Enter bosing. U yozishma borgan ish akkauntidan ketadi. Shundan keyin bot bu suhbatda jim turadi.",
              "Butun tarix kerakmi? «Kartochkani ochish» tugmasini bosing. Javob ketgach, qator yo‘qoladi.",
            ],
            head: [
              "Javobni suhbat ostidagi maydonga yozing va «Yuborish» yoki Ctrl+Enter bosing. U yozishma borgan ish akkauntidan ketadi. Shundan keyin bot bu suhbatda jim turadi.",
              "Studiya botining mijoziga javob botning o‘zidan ketadi, va 7 kun bot unga o‘zi javob bermaydi. Butun tarix kerakmi? «Kartochkani ochish» tugmasini bosing.",
            ],
            admin: [
              "Javobni suhbat ostidagi maydonga yozing va «Yuborish» yoki Ctrl+Enter bosing. U yozishma borgan ish akkauntidan ketadi. Shundan keyin bot bu suhbatda jim turadi.",
              "Studiya botining mijoziga javob botning o‘zidan ketadi, va 7 kun bot unga o‘zi javob bermaydi. Butun tarix kerakmi? «Kartochkani ochish» tugmasini bosing.",
            ],
          },
        },
      ],
    },
    "/admin/tasks": {
      what: "Bu yerda jamoaning topshiriqlari: nima qilish kerak, kim qiladi va qaysi muddatgacha. Yuqorida sizga va sizdan berilgan vazifalar, pastda tarix.",
      items: [
        {
          id: "board",
          title: "Vazifa qo‘yish, olish va yopish",
          body: [
            "Vazifa bu muddatli topshiriq. Uni istalgan xodim istalgan xodimga, jumladan o‘ziga ham qo‘ya oladi. Vazifani ikki kishi ko‘radi: kim qo‘ygan va kimga.",
            "«Menga» blokida sizga berilgan vazifalar, eng shoshilinchi yuqorida. Yangisini «Ishga olish» bilan qabul qiling, shunda qo‘ygan odam buni ko‘radi. Tugatdingizmi? «Bajarildi» yoki «Bajarilmadi» ni bosing.",
            "Ulgurmayapsizmi? «Muddatni ko‘chirish» ni bosing va yangi muddatni tanlang. Muddati o‘tgan vazifa qizil rangda yonadi.",
            "«Men qo‘yganlar» blokida siz boshqalarga bergan vazifalar. Vazifa endi kerak bo‘lmasa, «Vazifani bekor qilish» ni bosing.",
            "Vazifa qo‘yish uchun «Vazifa qo‘yish» shaklini to‘ldiring: «Kimga», «Nima qilish kerak» va «Muddat». Bir nechta odamni belgilash mumkin, har biri o‘z nusxasini oladi. Panel sizni darhol belgilaydi, vazifa sizga bo‘lmasa, belgini olib tashlang.",
            "Bot vazifani ijrochiga darhol Telegramda yuboradi. Vaqt hamma joyda Toshkent vaqti.",
          ],
        },
        {
          id: "mockup-order",
          title: "Vazifadagi «Maket buyurtmasi»",
          body: {
            manager: [
              "Vazifa shaklida «Maket buyurtmasi» degan savol bor. Vazifa egasiga ketsa (u maketlarni yig‘adi), «Ha» yoki «Yo‘q» deb javob berish majburiy.",
              "«Ha» dedingizmi? «Qaysi mijoz uchun» maydonida lidni (arizani) yoki aloqani (biz birinchi yozgan kompaniyani) toping. Sayt o‘zi qo‘yilmasa, uni «Mijoz sayti» ga yozing.",
              "Maket yig‘ilgach, vazifa yopiladi. [«Maketlar»](/admin/mockups) bo‘limida maketga siz mas’ul bo‘lasiz.",
            ],
            head: [
              "Vazifa shaklida va «Bosh sahifa» dagi [tezkor vazifada](#hq-task) «Maket buyurtmasi» degan savol bor. Vazifa egasiga ketsa, javob majburiy.",
              "«Ha» maket buyurtmasini bildiradi: mijozni qidiruv orqali tanlang va «Mijoz sayti» ni tekshiring.",
              "Yig‘ilgan maket «buyurtma bo‘yicha» mas’ul oladi, ya’ni vazifani qo‘ygan odamni. Tayyor maketni buyurtmaga [«Maketlar»](/admin/mockups) bo‘limida ham bog‘lash mumkin: «Buyurtma» qatori, keyin «Bog‘lash».",
            ],
            admin: [
              "Vazifa shaklida va «Bosh sahifa» dagi [tezkor vazifada](#hq-task) «Maket buyurtmasi» degan savol bor. Vazifa sizga qo‘yilsa, javob majburiy, va buyurtma darhol mijoz va sayt bilan keladi.",
              "Vazifa ostidagi «Prototipni yig‘ish» tugmasi [«Prototiplar»](/admin/proto) bo‘limini shu sayt bilan ochadi. Prototip yig‘ilsa, vazifa o‘zi yopiladi. Qoralama uni yopmaydi.",
              "Qo‘lda yig‘ilgan maketni [«Maketlar»](/admin/mockups) bo‘limida bog‘lang: «Buyurtma» qatori, keyin «Bog‘lash». Buyurtma bergan odam mas’ul bo‘ladi.",
            ],
          },
        },
        {
          id: "history",
          title: "Vazifani o‘zgartirish va tarixni ko‘rish",
          body: {
            manager: [
              "O‘zingiz qo‘ygan vazifani «Tahrirlash» bilan tuzatish mumkin, keyin «Saqlash». Muddat «Muddatni ko‘chirish» bilan o‘zgaradi. Sizga berilgan vazifani o‘zgartirib bo‘lmaydi.",
              "Ijrochini almashtirdingizmi? Yangi odamga vazifa yangi bo‘lib keladi, avvalgisiga esa bot uni olib tashlashganini yozadi.",
              "Har bir vazifada «Tarix» bor: kim oldi, kim muddatni ko‘chirdi, nima o‘zgardi. Sahifaning pastida 7, 30 yoki 90 kunlik «Vazifalar tarixi» turadi.",
            ],
            head: [
              "O‘zingiz qo‘ygan vazifani «Tahrirlash» bilan tuzatish mumkin, keyin «Saqlash». Muddat «Muddatni ko‘chirish» bilan o‘zgaradi. Birovning vazifasini faqat uni qo‘ygan odam tahrirlaydi.",
              "Ijrochini almashtirdingizmi? Yangi odamga vazifa yangi bo‘lib keladi, avvalgisiga esa bot uni olib tashlashganini yozadi.",
              "Har bir vazifada «Tarix» bor. Sahifaning pastida butun jamoaning «Vazifalar tarixi» turadi, «Kimniki» filtri bitta odamni qoldiradi.",
              "«Odamlar bo‘yicha» jadvali kimda nechta vazifa bajarilgani, bajarilmagani va ko‘chirilganini ko‘rsatadi. Bir odamda tez-tez ko‘chirish u bilan gaplashishga sabab. Egasi o‘ziga qo‘ygan vazifalar bu yerga tushmaydi.",
            ],
            admin: [
              "O‘zingiz qo‘ygan vazifani «Tahrirlash» bilan tuzatish mumkin, keyin «Saqlash». Muddat «Muddatni ko‘chirish» bilan o‘zgaradi. Birovning vazifasini faqat uni qo‘ygan odam tahrirlaydi.",
              "Ijrochini almashtirdingizmi? Yangi odamga vazifa yangi bo‘lib keladi, avvalgisiga esa bot uni olib tashlashganini yozadi.",
              "Har bir vazifada «Tarix» bor. Sahifaning pastida butun studiyaning «Vazifalar tarixi» turadi, «Kimniki» filtri bitta odamni qoldiradi.",
              "«Odamlar bo‘yicha» jadvali kimda nechta vazifa bajarilgani, bajarilmagani va ko‘chirilganini ko‘rsatadi. Bir odamda tez-tez ko‘chirish u bilan gaplashishga sabab. Rahbar bu yerda faqat siz o‘zingizga qo‘ygan vazifalarni ko‘rmaydi.",
            ],
          },
        },
        {
          id: "filter",
          title: "Tartib, guruhlar va loyihalar",
          body: [
            "Vazifalar muddat bo‘yicha turadi: nima yonayotgan bo‘lsa, o‘sha yuqorida. Muddatsiz vazifalar oxirida.",
            "«Guruhlash» ularni «muddat bo‘yicha», «loyiha bo‘yicha» yoki «odam bo‘yicha» yig‘adi. «Loyiha» bitta loyihaning vazifalarini qoldiradi. Tanlang va «Ko‘rsatish» ni bosing.",
            "Vazifadagi loyiha nomi loyiha kartochkasini ochadi. U yerda «Vazifa qo‘yish» bor, va loyiha shaklda allaqachon tanlangan.",
          ],
        },
        {
          id: "bot",
          title: "Vazifalar Telegramda va eslatmalar",
          body: {
            manager: [...TASKS_BOT, "Bu xabarlarni rahbar yoki egasi «Vazifalar» belgisi bilan o‘chira oladi. Vazifalar panelda baribir qoladi."],
            head: [...TASKS_BOT, "Ularni «Jamoa» bo‘limida odamning [bildirishnomalaridagi](#team-notices) «Vazifalar» belgisi bilan o‘chirish mumkin. Vazifalar panelda baribir qoladi."],
            admin: [...TASKS_BOT, "Ularni «Jamoa» bo‘limida odamning [bildirishnomalaridagi](#team-notices) «Vazifalar» belgisi bilan o‘chirish mumkin. Vazifalar panelda baribir qoladi."],
          },
        },
        {
          id: "alerts",
          title: "Brauzerdagi ovoz va bildirishnomalar",
          body: [
            "Panel ochiq turganda u har 45 soniyada vazifalarni tekshiradi. Yangilik bo‘lsa, ovoz chiqadi va «Vazifalarni ochish» plashkasi paydo bo‘ladi.",
            "Yopilgan vkladkada ham bildirishnoma ko‘rish uchun «Bildirishnomalarni yoqish» ni bosing va brauzerda ruxsat bering. Adashib taqiqladingizmi? Sayt sozlamalarida ruxsat bering, bu manzil chapidagi belgi.",
            "Ovoz paneldagi birinchi bosishdan keyin ishlaydi. Panel yopiq bo‘lsa, vazifalar haqida faqat Telegram yozadi.",
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
      what: "Bu yerda saytdagi do‘kondan tayyor mahsulotlar buyurtmalari. Bu mijozlar loyihalari emas. Buyurtmani istalgan xodim olib borishi mumkin.",
      items: [
        {
          id: "flow",
          title: "Buyurtma yo‘li",
          body: [
            "Buyurtma holatlari: «yangi», «hisob-faktura chiqarilgan», «to‘langan», «topshirilgan» yoki «bekor qilingan». Yuqoridagi tugmalar kerakli holatdagi buyurtmalarni ko‘rsatadi.",
            "Xaridor kontakti darhol ko‘rinadi. «bot ulangan» belgisi hisob-faktura va to‘lov haqida unga botimiz yozishini bildiradi.",
            "Buyurtma qotib qoldimi, masalan hisob-faktura 14 kun to‘lanmadi? Bot sizga Telegramda eslatadi.",
          ],
        },
        {
          id: "invoice",
          title: "Summa va hisob-faktura",
          body: [
            "Buyurtma summasiz keldimi? Uni «summa, $» maydoniga yozing va **«kiritish»** tugmasini bosing. Hisob-fakturadan keyin summani o‘zgartirib bo‘lmaydi.",
            "Keyin **«hisob-faktura chiqarish»** tugmasini bosing. Xaridor hisob-fakturani buyurtma sahifasida ko‘radi va undagi rekvizitlar bo‘yicha to‘laydi.",
            "Yuqorida «Bank rekvizitlari sozlanmagan» turibdimi? Egasiga ayting: ularsiz xaridor qayerga to‘lashni ko‘rmaydi.",
          ],
        },
        {
          id: "paid",
          title: "To‘lov va fayllarni berish",
          body: [
            "Pul keldimi? «ko‘chirmadagi qator» maydoniga bank ko‘chirmasidagi qatorni yozing va **«to‘lov olindi»** tugmasini bosing. Qatorsiz tugma ishlamaydi.",
            "Endi xaridor fayllarni buyurtma sahifasidan yuklab olishi mumkin: jami 20 martagacha, kuniga 10 martadan ko‘p emas.",
            "Birinchi yuklab olish o‘zi «topshirilgan» holatini qo‘yadi. Kodni boshqacha berdingizmi? **«kod topshirildi»** tugmasini bosing.",
          ],
        },
        {
          id: "access",
          title: "Havolalar, kirish va bekor qilish",
          body: [
            "**«havolani qayta chiqarish»** buyurtmaga yangi havola beradi, eskisi esa o‘chadi. Yangisi bir marta ko‘rinadi, uni darhol xaridorga yuboring.",
            "**«fayllarga kirishni bekor qilish»** yuklab olishni yopadi, **«fayllarga kirishni qaytarish»** yana ochadi. Fayl havolasi begonalarga tushib qoldimi? Kirishni bekor qilib, qayta oching: eski havola o‘chadi.",
            "**«bekor qilish»** buyurtmani bekor qiladi, xaridorga xabar boradi. **«ishga qaytarish»** buyurtmani avvalgi holatiga qaytaradi.",
          ],
        },
      ],
    },

    /* ── Поиск ────────────────────────────────────────────────────────── */
    /* ── Tenderlar ─────────────────────────────────────────────────── */
    "/admin/tenders": {
      what: "Bu yerda studiyaga mos davlat xaridlari lotlari: saytlar, ilovalar, botlar, CRM. Har bir lot botga ham lid (mijoz arizasi) bo‘lib keladi.",
      items: [
        {
          id: "how",
          title: "Skaut tenderlarni qanday qidiradi",
          body: [
            "Skaut (studiya dasturi) har 30 daqiqada etender, xarid, Hayot Birja va Tender.asia maydonchalarini tekshiradi. U faqat bizning ishimizni oladi: sayt, ilova, bot va tizim yaratish. 1C, litsenziyalar, serverlar, videokuzatuv va texnika xaridlarini (noutbuk, jihozlar, «texnik baza», nomida «sun’iy intellekt» bo‘lsa ham) o‘tkazib yuboradi.",
            "Yangi lot saytdagi ariza kabi [lidlar navbati](#leads-queue)ga tushadi. Kartada muddat, havola, buyurtmachi kontakti va nomning ruscha tarjimasi bor.",
          ],
        },
        {
          id: "work",
          title: "Lot bilan nima qilish kerak",
          body: [
            "**Narx kelishilmasa, ariza topshirmaymiz.** Avval Egor yoki Aleksandrga lot va muddatlar haqida yozing.",
            "Mos keldimi? «Olaman» tugmasini bosing, hamkasblar lot sizniki ekanini ko‘radi. Ariza topshirdingiz, «Topshirildi»ni bosing. Mos kelmasa, «Bizniki emas»ni bosing.",
            "Tepada muddati eng yaqin lotlar turadi. Ariza maydonchaning o‘zida, kompaniya ERI (elektron imzosi) bilan topshiriladi.",
          ],
        },
      ],
    },

    "/admin/scout": {
      what: "Skaut (studiya dasturi) kechayu kunduz Telegramdagi ochiq chatlarni o‘qiydi va dasturchi qidirayotgan odamlarni topadi. Bu yerda u nima topgani ko‘rinadi.",
      items: [
        {
          id: "how",
          title: "Bu qanday ishlaydi",
          body: [
            "Skaut har bir xabarni 0 dan 100 gacha baholaydi: odam ijrochi qidiryaptimi. Xeshtegli xabarlarni o‘tkazib yuboradi, bu deyarli har doim reklama.",
            "60 dan signal «Devuz Scout» kanaliga keladi. 70 dan bir-ikki daqiqada undan o‘zi lid (mijoz arizasi) bo‘ladi. Har kuni ertalab kanalga «☀️ Скаут за сутки» xulosasi keladi.",
          ],
        },
        {
          id: "strong",
          title: "Kuchli signal (70+): o‘zingiz yozmang",
          body: [
            "Bunday signal navbati kelgan odamga tayyor birinchi xabar bilan lid bo‘lib keladi. Odamga oldinroq yozmang: studiyadan ikki kishi yozsa, spamga o‘xshaydi.",
            "Shunday lid keldimi? Darhol yozing, bunday xabarlar bir necha soat yashaydi.",
          ],
        },
        {
          id: "signals",
          title: "Oddiy signal: nima qilish kerak",
          body: [
            "70 dan past signallarni sizdan boshqa hech kim ko‘rib chiqmaydi. Mos keldimi? O‘z akkauntingizdan javob bering, chatda yoki muallifga shaxsiy xabarda.",
            "Keyin signalni belgilang: «javob berildi» yoki «mos emas». «O‘zi keldi» odam botimizga yozsa o‘zi qo‘yiladi. Signal 90 kun saqlanadi.",
          ],
        },
        {
          id: "groups",
          title: "Skaut uchun guruhlar: o‘zingiznikini qo‘shing",
          body: [
            "Ijrochi qidiradigan guruhni bilasizmi? Uning manzilini «Skaut uchun guruhlar» blokiga qo‘ying va «Guruh qo‘shish»ni bosing. @group, t.me/group yoki t.me/+… havola mos keladi.",
            "Skaut guruhga o‘zi qo‘shiladi: kuniga 10 tagacha, bir-ikki soat tanaffus bilan, 08:00-22:00 da. Shunda Telegram uni spamer deb hisoblamaydi.",
            "«Ariza adminda» guruh yopiq va ruxsat kutilayotganini bildiradi. «Qo‘shilib bo‘lmaydi» havola eskirgan yoki tekshiruv kerakligini bildiradi, unda qo‘lda qo‘shiladi. «Olib tashlash» sizning guruhlaringizda bor, rahbar va egasi istalganini olib tashlaydi.",
          ],
        },
        {
          id: "health",
          title: "Skaut ishlayaptimi",
          body: {
            manager: [
              "Tepadagi oltin plashka skaut bilan nimadir noto‘g‘ri ekanini bildiradi. Bir-ikki kun ketmasa, egasiga ayting.",
              "«Akkaunt berilgan 29 ta chatdan 12 tasini o‘qiyapti» plashkasi buzilish emas. Skaut qolgan guruhlarga o‘zi qo‘shiladi.",
            ],
            head: [
              "Tepadagi oltin plashka buzilishni bildiradi: skaut jim yoki chatlarni o‘qimayapti. Uni egasi tuzatadi.",
              "«Akkaunt berilgan 29 ta chatdan 12 tasini o‘qiyapti» plashkasi buzilish emas. [«Skaut uchun guruhlar»](#scout-groups)dagi guruhlarga skaut o‘zi qo‘shiladi.",
            ],
            admin: [
              "«Skaut N daqiqadan beri jim» serverdagi skaut jarayoni to‘xtaganini bildiradi: uni qayta ishga tushiring. «Model ishlamayapti» xabarlarni baholaydigan dastur kaliti ishlamayotganini bildiradi.",
              "«Akkaunt berilgan Y ta chatdan X tasini o‘qiyapti» akkaunt hamma chatlarga qo‘shilmaganini bildiradi. [«Skaut uchun guruhlar»](#scout-groups)dagi guruhlarga u o‘zi qo‘shiladi, serverdagi chatlarga qo‘lda qo‘shiladi.",
              "«Mexanizm butun: …» chatlarda jimlik ekanini bildiradi. Bu buzilish emas.",
            ],
          },
        },
      ],
    },

    "/admin/markets": {
      what: "Bu yerda boshqa mamlakatlarda mijozlarni qayerdan qidirish kerakligi jamlangan. Har bir mamlakat bo‘yicha havolalar va maslahatlar bilan maydonchalar bor.",
      items: [
        {
          id: "start",
          title: "Mamlakatni qanday tanlash",
          body: [
            "«Bozorlar» menyuda va [«Sovuq aloqalar»](/admin/prospect)da tab sifatida bor. Mamlakatni ochish uchun uning kartochkasini bosing.",
            "«asosiy bozor» belgisi bor mamlakatlardan boshlang: Rossiya, Qozog‘iston, AQSH. «sinab ko‘ramiz» ham mumkin, «imkon bo‘lganda» faqat sabab bo‘lsa.",
            "Maydoncha ochilmayaptimi yoki yopilganmi? Rahbarga ayting.",
          ],
        },
        {
          id: "country",
          title: "Mamlakat sahifasi va «Skautga» tugmasi",
          body: [
            "Tepada qisqacha: u yerda dasturchini qanday qidirishadi va qaysi tilda yozish kerak. «Nimadan boshlash kerak» blokida sizning rejangiz: qadamlarni tartib bilan bajaring.",
            "Pastda turlari bo‘yicha maydonchalar: birjalar, kataloglar, e’lonlar taxtalari, Telegram chatlari. Maydoncha uchun faqat rahbar bilan kelishib pul to‘lash mumkin.",
            "Telegram chatlarida «Skautga» tugmasi bor. Uni bosing, skaut guruhga o‘zi qo‘shiladi va u yerdan buyurtmalarni [«Skaut signallari»](/admin/scout)ga yuboradi.",
          ],
        },
        {
          id: "tour",
          title: "Ekrandagi o‘rgatish",
          body: {
            manager: [
              "Bo‘lim tepasidagi **«Ekranda ko‘rsatish: «Bozorlar»dan qanday foydalanish»** tugmasi sakkiz qadamli qisqa o‘rgatishni ochadi. Uni «O‘tkazib yuborish» tugmasi yoki Esc tugmasi bilan yopish mumkin.",
              "O‘rgatish sizga bir marta o‘zi ko‘rsatiladi. Uni yana shu tugma bilan yoki [«Sozlamalar»](/admin/settings)da ochish mumkin.",
            ],
            head: [
              "Bo‘lim tepasidagi **«Ekranda ko‘rsatish: «Bozorlar»dan qanday foydalanish»** tugmasi sakkiz qadamli qisqa o‘rgatishni ochadi. Uni «O‘tkazib yuborish» tugmasi yoki Esc tugmasi bilan yopish mumkin.",
              "Menejerlarga u bir marta o‘zi ko‘rsatiladi, sizga faqat tugma bilan. Tugma [«Sozlamalar»](/admin/settings)da ham bor.",
            ],
            admin: [
              "Bo‘lim tepasidagi **«Ekranda ko‘rsatish: «Bozorlar»dan qanday foydalanish»** tugmasi sakkiz qadamli qisqa o‘rgatishni ochadi. Uni «O‘tkazib yuborish» tugmasi yoki Esc tugmasi bilan yopish mumkin.",
              "Menejerlarga u bir marta o‘zi ko‘rsatiladi, sizga faqat tugma bilan. Tugma [«Sozlamalar»](/admin/settings)da ham bor.",
            ],
          },
        },
      ],
    },

    /* ── Касания ──────────────────────────────────────────────────────── */
    "/admin/prospect": {
      what: "Bu yerda bizni hali tanimaydigan kompaniyalarga birinchi bo‘lib yozamiz. Studiyaning ishchi akkaunti ularga faqat «Здравствуйте» yuboradi. Odam javob bersa, bot doiraviy video yoki uning sayti haqida qisqa xat yuboradi va bepul maket taklif qiladi. Keyin yozishmani bot olib boradi, odam kerak bo‘lsa, sizni chaqiradi. Sizning aloqangizdan kelgan lid (mijoz arizasi) darhol sizniki, navbatsiz.",
      items: [
        {
          id: "portion",
          title: "Kunlik to‘plam",
          body: {
            manager: [
              "Kunlik to‘plamda bugun yozishingiz kerak bo‘lgan kompaniyalar bor. Ish kunlari soat 07:00 da tizim ularni hammaga teng bo‘lib beradi. Sizning normangiz: haftalik aloqalar rejasi 5 ga bo‘lingani (kuniga 2 tadan 15 tagacha). Reja bo‘lmasa, to‘plamda 5 ta kompaniya.",
              "Soat 09:00 gacha to‘plam sizga Telegramda keladi. Har bir kompaniyada manzil, ilmoq va tayyor matn bor. Kartochka ostida «📤 Отправить через бота», «WhatsApp ↗», «✋ Написал сам», «✖ Не подходит» va «Открыть в панели» tugmalari. Shu to‘plam bo‘lim tepasida, «Bugungi kunlik to‘plamingiz» blokida ham ko‘rinadi.",
              "Faqat aloqa bajarilgan hisoblanadi: «Yuborish» yoki «O‘zim bog‘landim». «✖ Не подходит» ni bosdingizmi? O‘rniga darhol «almashtiruv» belgisi bilan boshqa kompaniya keladi. Kuniga almashtiruvlar ikki to‘plamdan oshmaydi.",
              "Soat 12:00 gacha hech narsa qilmagan va panelga kirmagan bo‘lsangiz, bot shaxsan eslatadi. Soat 15:00 da rahbar kim umuman boshlamaganini ko‘radi. Bugun ulgurmaysizmi? Rahbarni oldindan ogohlantiring.",
              "Soat 18:00 da bajarilmagan hamma narsa umumiy pulga qaytadi. Rahbar hisobot oladi: har kimda nechta aloqa va panelda necha daqiqa ishlagani. To‘plamdagidan ko‘proq kompaniya kerakmi? [«Получать лиды» oqimini](#prospect-stream) yoqing.",
            ],
            head: [
              "Siz ham menejerlar kabi kunlik to‘plam olasiz. Ish kunlari soat 07:00 da puldagi kompaniyalar navbatdagi hammaga teng bo‘linadi. Hajmi: haftalik reja 5 ga bo‘lingani (2 tadan 15 tagacha). Reja bo‘lmasa, kuniga 5 ta.",
              "Soat 09:00 da to‘plam tayyor matnlar bilan Telegramga keladi va bo‘lim tepasida ko‘rinadi. «✖ Не подходит» uchun odam darhol boshqa kompaniya oladi, lekin kuniga ikki to‘plamdan ko‘p emas.",
              "Soat 12:00 da bot kun davomida hech narsa qilmaganlarga to‘plamni eslatadi. Soat 15:00 da sizga va egaga «🔕 К 15:00 молчат: …» keladi. Qo‘ng‘iroq qilib, nima bo‘lganini bilgan ma’qul. Rejasi 0 yoki «Navbat bo‘yicha yangi buyurtmalar» belgisi olib tashlangan odamlarga (ta’til, kasallik) bot tegmaydi.",
              "Soat 18:00 da bajarilmagani pulga qaytadi. Sizga «📋 Сотрудники за день» hisoboti keladi: har kimning aloqalari va to‘plami, paneldagi daqiqalar, olingan lidlar. Pastda nimaga qarash kerakligi haqida maslahatlar.",
              "Dushanba kunlari soat 10:00 da o‘tgan hafta uchun, juma kunlari soat 16:00 da esa shu hafta (dushanbadan 16:00 gacha) uchun «📅 Сотрудники за неделю» keladi. Unda har kim bo‘yicha aloqalar, javoblar, maketlar, ko‘rsatishlar, paneldagi vaqt va harakatsiz lidlar. Menejerlarga bu hisobotlar kelmaydi.",
              "Pulga kompaniyalarni [xaritalar bo‘yicha avtoqidiruv](#prospect-maps) olib keladi. Pul bo‘sh bo‘lsa, to‘plamlar ham bo‘sh.",
            ],
            admin: [
              "Siz kunlik to‘plam olmaysiz. Ish kunlari soat 07:00 da puldagi kompaniyalar menejerlar va rahbarlar orasida teng bo‘linadi. Hajmi: haftalik reja 5 ga bo‘lingani (2 tadan 15 tagacha), reja bo‘lmasa 5 ta. Birinchi bo‘lib bahosi eng past saytlar ketadi.",
              "Soat 09:00 gacha to‘plam odamlarga Telegramda ketadi, eng kechi 10:00 da. «✖ Не подходит» uchun odam darhol boshqa kompaniya oladi, kuniga ikki to‘plamgacha.",
              "Soat 12:00 da bot hech narsa qilmaganlarga to‘plamni eslatadi. Soat 15:00 da sizga va rahbarga «🔕 К 15:00 молчат: …» keladi. Rejasi 0 yoki «Navbat bo‘yicha yangi buyurtmalar» belgisi olib tashlanganlarga bot tegmaydi. «Jamoa» bo‘limida ta’til shunday belgilanadi.",
              "Soat 18:00 da bajarilmagani pulga qaytadi va sizga «📋 Сотрудники за день» keladi. Dushanba kunlari soat 10:00 da o‘tgan hafta, juma kunlari soat 16:00 da shu hafta uchun «📅 Сотрудники за неделю» keladi. Ikkala hisobotni dastur raqamlar bo‘yicha hisoblaydi, menejerlarga ular kelmaydi.",
              "To‘plamlar bo‘shmi? Demak, pulda kompaniyalar tugagan. [Xaritalar bo‘yicha avtoqidiruvda](#prospect-maps) yangi kampaniya oching.",
            ],
          },
        },
        {
          id: "stream",
          title: "«Получать лиды» oqimi (Telegramda)",
          roles: ["manager", "head"],
          body: {
            manager: [
              "Kunlik to‘plam kamlik qilsa, oqim kerak. Bot chatining pastidagi «▶️ Получать лиды» tugmasini bosing yoki botga /leads yuboring. Kompaniyalar bittadan, tayyor matn va to‘plamdagi kabi tugmalar bilan kela boshlaydi.",
              "Kunlik limit yo‘q. Kompaniyani hal qildingiz, darhol keyingisi keladi. Bir vaqtda hal qilinmaganlari uchtadan oshmaydi. Har biriga matn bir daqiqagacha yoziladi, shuning uchun kartochka darhol kelmasligi mumkin.",
              "Oqim ish kunlari 09:00 dan 18:00 gacha ishlaydi. 18:00 gacha hal qilinmagani pulga qaytadi. Kechasi o‘chirish shart emas, ertalab o‘zi davom etadi. To‘xtatish uchun «⏸ Не получать лиды» ni bosing yoki yana /leads yuboring.",
              "Oqimdagi aloqalar haftalik rejaga kiradi, lekin to‘plamga kirmaydi. Oqimda «✖ Не подходит» uchun almashtiruv yo‘q. Bugun nima kelgani bo‘lim tepasidagi «Lidlar oqimi» blokida ko‘rinadi.",
            ],
            head: [
              "Kunlik to‘plam kamlik qilsa, oqim kerak. Bot chatining pastidagi «▶️ Получать лиды» tugmasini bosing yoki botga /leads yuboring. Kompaniyalar bittadan, tayyor matn va to‘plamdagi kabi tugmalar bilan kela boshlaydi. Menejerlar ham oqimni shunday yoqadi.",
              "Kunlik limit yo‘q. Kompaniyani hal qildingiz, darhol keyingisi keladi. Bir odamda bir vaqtda hal qilinmaganlari uchtadan oshmaydi. Har biriga matn bir daqiqagacha yoziladi, shuning uchun kartochka darhol kelmasligi mumkin.",
              "Oqim ish kunlari 09:00 dan 18:00 gacha ishlaydi. 18:00 gacha hal qilinmagani pulga qaytadi. Kechasi o‘chirish shart emas, ertalab o‘zi davom etadi. To‘xtatish uchun «⏸ Не получать лиды» ni bosing yoki yana /leads yuboring.",
              "Oqimdagi aloqalar haftalik rejaga kiradi, lekin to‘plamga kirmaydi. Oqimda «✖ Не подходит» uchun almashtiruv yo‘q. Bugun nima kelgani bo‘lim tepasidagi «Lidlar oqimi» blokida ko‘rinadi.",
              "Kechki hisobotda har kimda qavs ichida oqimdan nechta aloqa kelgani turadi, masalan «(поток 4)».",
            ],
          },
        },
        {
          id: "autopilot",
          title: "Avtomatik aloqalar: kuniga 20 ta, istalgan nishalar",
          roles: ["head", "admin"],
          body: {
            head: [
              "Avtomatik aloqalar kompaniyalarga birinchi xabarni menejersiz o‘zi yozadi. Norma: ish kunlari kamida 20 ta, dam olish kunlari 60 ta yuborilgan «Здравствуйте». Nishalar istalgan. Bo‘lim tepasidagi «Avtomatik aloqalar · istalgan nishalar» bloki bugun nechta ketgani, nechta javob kelgani va nechta lid olinganini ko‘rsatadi.",
              "Xatlar 07:00 dan 17:30 gacha, dam olish kunlari 20:00 gacha tayyorlanadi. Ular 07:30 dan 20:30 gacha ketadi, bitta akkauntdan soatiga uchtadan ko‘p emas. Birinchi xabardan oldin panel [saytni fakt bo‘yicha tekshiradi](#prospect-fact-check).",
              "Avtomatik aloqalar faqat qo‘shimcha ishchi akkauntlardan yozadi, asosiysidan yozmaydi. Qo‘shimchalarning hammasi pauzada yoki cheklangan bo‘lsa, u to‘xtab turadi va hech narsa tayyorlamaydi. [«Akkauntlar»](/admin/accounts) ni tekshiring.",
              "U puldagi bo‘sh kompaniyalarga yozadi, ya’ni hech kimning to‘plamida yo‘qlarga. Avval saytida Telegram borlarga, keyin mobil raqam bo‘yicha. Shahar raqamlariga yozmaydi. Pulni xaritalar bo‘yicha avtoqidiruv va Firecrawl (internetdan kompaniyalar va ularning kontaktlarini qidiradigan servis) to‘ldiradi.",
              "Mijoz javob berdi, keyin suhbatni bot olib boradi. Lid mijoz maketga rozi bo‘lganda, qo‘ng‘iroq qilishni so‘raganda yoki bot suhbatni odamga topshirganda paydo bo‘ladi. Shunda lid [lidlar navbatiga](#leads-queue) ketadi. Rad javobi aloqani o‘zi yopadi, hech kimga kartochka kelmaydi.",
              "Har kuni soat 18:00 da (dam olish kunlari 20:30 da) sizga va egaga «🤖 Автопрогон касаний» hisoboti keladi. Unda nechta ketgani, kim javob bergani va lidni kim olgani ko‘rinadi. «Не добрали» qatori kompaniyalar tugaganini yoki akkauntlar turib qolganini bildiradi. «❗ Автопрогон сбоил» qatori bor hisobotni dasturchiga yuboring.",
              "Avtomatik aloqalarni ega to‘xtatadi va ishga tushiradi.",
            ],
            admin: [
              "Avtomatik aloqalar kompaniyalarga birinchi xabarni menejersiz o‘zi yozadi. Norma: ish kunlari kamida 20 ta, dam olish kunlari 60 ta yuborilgan «Здравствуйте». Nishalar istalgan. Bo‘lim tepasidagi «Avtomatik aloqalar · istalgan nishalar» bloki bugun nechta ketgani, nechta javob kelgani va nechta lid olinganini ko‘rsatadi.",
              "Xatlar 07:00 dan 17:30 gacha, dam olish kunlari 20:00 gacha tayyorlanadi. Ular 07:30 dan 20:30 gacha ketadi, bitta akkauntdan soatiga uchtadan ko‘p emas. Birinchi xabardan oldin panel [saytni fakt bo‘yicha tekshiradi](#prospect-fact-check).",
              "Avtomatik aloqalar faqat qo‘shimcha ishchi akkauntlardan yozadi, asosiysidan yozmaydi. Qo‘shimchalarning hammasi pauzada yoki cheklangan bo‘lsa, u to‘xtab turadi va hech narsa tayyorlamaydi. [«Akkauntlar»](/admin/accounts) ni tekshiring.",
              "U puldagi bo‘sh kompaniyalarga yozadi, ya’ni hech kimning to‘plamida yo‘qlarga. Avval saytida Telegram borlarga, keyin mobil raqam bo‘yicha. Shahar raqamlariga yozmaydi. Pulni xaritalar bo‘yicha avtoqidiruv va Firecrawl (internetdan kompaniyalar va ularning kontaktlarini qidiradigan servis) to‘ldiradi.",
              "Mijoz javob berdi, keyin suhbatni bot olib boradi. Lid mijoz maketga rozi bo‘lganda, qo‘ng‘iroq qilishni so‘raganda yoki bot suhbatni odamga topshirganda paydo bo‘ladi. Shunda lid [lidlar navbatiga](#leads-queue) ketadi. Rad javobi aloqani o‘zi yopadi, hech kimga kartochka kelmaydi.",
              "Har kuni soat 18:00 da (dam olish kunlari 20:30 da) sizga va rahbarga «🤖 Автопрогон касаний» hisoboti keladi. Unda nechta ketgani, kim javob bergani va lidni kim olgani ko‘rinadi. «Не добрали» qatori kompaniyalar tugaganini yoki akkauntlar turib qolganini bildiradi. «❗ Автопрогон сбоил» qatori bor hisobotni dasturchiga yuboring.",
              "Blokdagi «Avtomatik aloqalarni to‘xtatish» tugmasi yangi xatlarni darhol to‘xtatadi. Navbatda turganlari baribir ketadi. «Avtomatik aloqalarni ishga tushirish» uni qayta yoqadi, ikkala bosish ham jurnalga yoziladi.",
            ],
          },
        },
        {
          id: "no-text",
          title: "Kartochka matnsiz keldi",
          body: {
            manager: [
              "Ba’zan kompaniya Telegramga xatsiz, «Текст ещё готовится» degan izoh bilan keladi. Matn yozadigan dastur vaqtincha javob bermasa, shunday bo‘ladi.",
              "Hech narsa bosish shart emas. Matn tayyor bo‘lishi bilan bot o‘sha kompaniyani «✍️ Текст готов» belgisi bilan yana yuboradi. Kutishni xohlamaysizmi? «✋ Написал сам» ni bosing va o‘z so‘zlaringiz bilan yozing.",
            ],
            head: [
              "Ba’zan kompaniya Telegramga xatsiz, «Текст ещё готовится» degan izoh bilan keladi. Matn yozadigan dastur vaqtincha javob bermasa, sizda ham, menejerlarda ham shunday bo‘ladi.",
              "Hech narsa bosish shart emas. Matn tayyor bo‘lishi bilan bot o‘sha kompaniyani «✍️ Текст готов» belgisi bilan yana yuboradi. Odam kutishni xohlamasa, «✋ Написал сам» ni bossin.",
              "Kechki hisobotda bunday kartochka odatdagidek hisoblanadi. U «mos kelmadi» ga aylanmaydi.",
            ],
            admin: [
              "Sun’iy intellekt hisobida pul tugasa yoki yetkazib beruvchida nosozlik bo‘lsa, to‘plamga matnlar yozilmaydi. To‘plam baribir odamlarga 10:00 dan kechikmay, «Текст ещё готовится» izohli kartochkalar bilan ketadi.",
              "Tizim har besh daqiqada qayta urinadi. Balansni to‘ldirdingiz, matnlar o‘zi yozib bo‘linadi. Har kimga o‘z kompaniyasi «✍️ Текст готов» belgisi bilan yana keladi.",
              "Agar xatning o‘zi chiqmasa (masalan, saytsiz kompaniyada nisha ko‘rsatilmagan), qayta urinish bo‘lmaydi. Bunday kompaniyaga odam o‘zi «Bog‘lanish» orqali yozadi.",
            ],
          },
        },
        {
          id: "plan",
          title: "Haftalik aloqalar rejasi",
          body: {
            manager: [
              "Aloqalar rejasi hafta davomida nechta kompaniyaga yozishingiz kerakligini ko‘rsatadi. Uni rahbar yoki ega qo‘yadi. Natija bo‘lim tepasida va «Bosh sahifa» da ko‘rinadi, masalan «30 tadan 18 tasi bajarildi».",
              "Dushanbadan beri yozgan kompaniyalaringiz hisoblanadi: «Yuborish» yoki «O‘zim bog‘landim» ni bosgansiz. Bitta kompaniya, bitta aloqa. «Bog‘lanish» hali aloqa emas, bu faqat xatni tayyorlash. Ketmagan xat ham hisoblanmaydi. «Lidni qo‘lda qo‘shish» orqali qo‘shilgan lid ham aloqa hisoblanadi: uni qo‘shgan odamga.",
            ],
            head: [
              "Menejerlaringizga rejani [«Jamoa»](/admin/team) bo‘limida, «Aloqalar rejasi» ustunida qo‘yasiz. Bo‘sh maydon «rejasiz» degani, unda to‘plam kuniga 5 ta. Nol esa to‘plam umuman bo‘lmasligini bildiradi. O‘z rejangizni ega qo‘yadi.",
              "Odam dushanbadan beri yozgan kompaniyalar hisoblanadi: «Yuborish» yoki «O‘zim bog‘landim». Ketmagan xat hisoblanmaydi. «Lidni qo‘lda qo‘shish» orqali qo‘shilgan lid ham aloqa hisoblanadi: uni qo‘shgan odamga.",
            ],
            admin: [
              "Reja [«Jamoa»](/admin/team) bo‘limida, «Aloqalar rejasi» ustunida qo‘yiladi. Siz uni istalgan odamga qo‘yasiz, rahbar faqat o‘z odamlariga. Bo‘sh maydon «rejasiz» degani, unda to‘plam kuniga 5 ta. Nol to‘plam yo‘qligini bildiradi.",
              "Odam dushanbadan beri yozgan kompaniyalar hisoblanadi: «Yuborish» yoki «O‘zim bog‘landim». Ketmagan xat hisoblanmaydi. «Lidni qo‘lda qo‘shish» orqali qo‘shilgan lid ham aloqa hisoblanadi: uni qo‘shgan odamga.",
            ],
          },
        },
        {
          id: "send",
          title: "Kompaniyaga yozish: «Bog‘lanish» va «Yuborish»",
          body: [
            "Kompaniyaga yozish uchun uning kartochkasida «Bog‘lanish» ni bosing. Panel saytni qaytadan ochadi (bir daqiqagacha) va xat tuzadi. Bu hali aloqa hisoblanmaydi.",
            "Xat qisqa va salomsiz. Matn sizning [xat matnlaringizdan](#prospect-texts) olinadi, sayt haqidagi faktlarni panel o‘zi qo‘yadi: nima noto‘g‘ri va bu xaridorlarga qanday xalaqit beradi. O‘zbekcha saytga xat o‘zbek tilida ketadi.",
            "Xatni o‘qing va kerak bo‘lsa tuzating. Keyin «Yuborish: @manzil» ni bosing. Avval «Здравствуйте» ketadi, xat esa faqat mijoz javob bergandan keyin ([ikki qadamli aloqa](#prospect-hello)). Shu daqiqadan aloqa hisoblanadi, lid esa sizniki.",
            "Xabar ketgach, tugma o‘rnida «Bog‘lanildi» va qaysi akkauntdan yozilgani paydo bo‘ladi. Mijozga o‘zingiz javob bersangiz, faqat shu akkauntdan yozing. Mijoz uchun suhbatdosh bitta bo‘lishi kerak.",
            "Yuborishdan oldin panel xatni tekshiradi: texnik so‘zlar, o‘zingizdan raqamlar, foizlar yoki «kafolat beraman» yo‘qmi. Uzunligi 12 dan 100 so‘zgacha. Biror narsa noto‘g‘ri bo‘lsa, panel nimani tuzatishni yozadi.",
            "«Bog‘lanish» ni istalgan xodim bosishi mumkin va kompaniya uniki bo‘ladi. Shuning uchun [kunlik to‘plamdan](#prospect-portion) boshlang: u yerda kompaniyalar allaqachon taqsimlangan.",
          ],
        },
        {
          id: "texts",
          title: "Xat matnlari va A/B",
          body: {
            manager: [
              "«Xat matnlari va A/B» tugmasi bo‘lim tavsifi ostida turadi. U yerda mijozga uning javobidan keyin ketadigan xatning o‘z matningizni yozasiz. Ikkita matn yozish mumkin. Unda bu A/B (ikki variantni solishtirish): aloqalaringiz ular orasida teng bo‘linadi.",
              "Matnda jingalak qavslarda qo‘yiladigan joylar bor. {tezislar} majburiy: uning o‘rniga mijoz sayti haqidagi faktlar turadi. Yana {sayt}, {kompaniya}, {ism}, {kim} va {prototip} bor. Qisqa yozing, «Здравствуйте» siz va o‘z raqamlaringizsiz. Forma ostida xatni mijoz qanday ko‘rishi ko‘rinadi.",
              "Har bir matn ostida hisob: nechta xat ketgani, nechta javob kelgani, nechtasi maket xohlayotgani. Matnga kamida 20 ta xat ketmaguncha, panel xulosa qilishga erta deb yozadi. Keyin qaysi matn yaxshiroq ekani ko‘rinadi. «Shuni qoldirish, ikkinchisini olib tashlash» g‘olibni qoldiradi.",
              "O‘z matningiz yo‘qmi? Unda xatlar jamoaning umumiy matnlari bo‘yicha ketadi. O‘zbekcha variantni o‘zingiz yozishingiz mumkin, aks holda panel tarjima qiladi. Tahrir hisobni buzmaydi: eski matn arxivga ketadi, yangisi noldan hisoblanadi.",
            ],
            head: [
              "«Xat matnlari va A/B» tugmasi bo‘lim tavsifi ostida turadi. U yerda mijozga uning javobidan keyin ketadigan xatning o‘z matningizni yozasiz. Ikkita matn yozish mumkin. Unda bu A/B (ikki variantni solishtirish): aloqalaringiz ular orasida teng bo‘linadi.",
              "Matnda jingalak qavslarda qo‘yiladigan joylar bor. {tezislar} majburiy: uning o‘rniga mijoz sayti haqidagi faktlar turadi. Yana {sayt}, {kompaniya}, {ism}, {kim} va {prototip} bor. Qisqa yozing, «Здравствуйте» siz va o‘z raqamlaringizsiz. Forma ostida xatni mijoz qanday ko‘rishi ko‘rinadi.",
              "Har bir matn ostida hisob: nechta xat ketgani, nechta javob kelgani, nechtasi maket xohlayotgani. Matnga kamida 20 ta xat ketmaguncha, panel xulosa qilishga erta deb yozadi. Keyin qaysi matn yaxshiroq ekani ko‘rinadi. «Shuni qoldirish, ikkinchisini olib tashlash» g‘olibni qoldiradi.",
              "O‘z matningiz yo‘qmi? Unda xatlar jamoaning umumiy matnlari bo‘yicha ketadi. O‘zbekcha variantni o‘zingiz yozishingiz mumkin, aks holda panel tarjima qiladi. Tahrir hisobni buzmaydi: eski matn arxivga ketadi, yangisi noldan hisoblanadi.",
              "Siz barcha menejerlarning matnlarini ko‘rasiz va eng yaxshisini umumiy qila olasiz: «Umumiy 1-matn qilish» yoki «Umumiy 2-matn qilish». Umumiy matnlarni siz va ega tahrirlaysiz. Pastda «Avtoyurish yondashuvlari»: «Og‘riq va yechim», «Savol» va «Nishadagi tajriba». Ular bilan avtomatik aloqalar yozadi, har birining o‘z hisobi bor.",
            ],
            admin: [
              "«Xat matnlari va A/B» tugmasi bo‘lim tavsifi ostida turadi. U yerda mijozga uning javobidan keyin ketadigan xatning o‘z matningizni yozasiz. Ikkita matn yozish mumkin. Unda bu A/B (ikki variantni solishtirish): aloqalaringiz ular orasida teng bo‘linadi.",
              "Matnda jingalak qavslarda qo‘yiladigan joylar bor. {tezislar} majburiy: uning o‘rniga mijoz sayti haqidagi faktlar turadi. Yana {sayt}, {kompaniya}, {ism}, {kim} va {prototip} bor. Qisqa yozing, «Здравствуйте» siz va o‘z raqamlaringizsiz. Forma ostida xatni mijoz qanday ko‘rishi ko‘rinadi.",
              "Har bir matn ostida hisob: nechta xat ketgani, nechta javob kelgani, nechtasi maket xohlayotgani. Matnga kamida 20 ta xat ketmaguncha, panel xulosa qilishga erta deb yozadi. Keyin qaysi matn yaxshiroq ekani ko‘rinadi. «Shuni qoldirish, ikkinchisini olib tashlash» g‘olibni qoldiradi.",
              "O‘z matningiz yo‘qmi? Unda xatlar jamoaning umumiy matnlari bo‘yicha ketadi. O‘zbekcha variantni o‘zingiz yozishingiz mumkin, aks holda panel tarjima qiladi. Tahrir hisobni buzmaydi: eski matn arxivga ketadi, yangisi noldan hisoblanadi.",
              "Siz barcha menejerlarning matnlarini ko‘rasiz va eng yaxshisini umumiy qila olasiz: «Umumiy 1-matn qilish» yoki «Umumiy 2-matn qilish». Umumiy matnlarni siz va rahbar tahrirlaysiz. Pastda «Avtoyurish yondashuvlari»: «Og‘riq va yechim», «Savol» va «Nishadagi tajriba». Ular bilan avtomatik aloqalar yozadi, har birining o‘z hisobi bor.",
            ],
          },
        },
        {
          id: "hello",
          title: "Ikki qadamli aloqa: «Здравствуйте», keyin doiraviy video yoki xat",
          body: [
            "Notanish odamga ishchi akkaunt avval faqat «Здравствуйте» yozadi, o‘zbekcha saytga «Assalomu alaykum». Notanishdan kelgan uzun xatni Telegram spam deb hisoblaydi va akkauntni cheklashi mumkin. Salomdan esa shikoyat qilishmaydi.",
            "19.11.2026 dan doiraviy videolar o‘chirilgan: har qanday javobga uch daqiqadan keyin mijoz tilida sayt tahlili bilan xat ketadi, keyin bot suhbatni SPIN savollari bilan olib boradi. Videolar qaytarilsa, shunday edi: mijoz ruscha javob berdi, ikki daqiqadan keyin bot unga doiraviy video yuborardi: saytingizni ko‘rdik va bir nechta xato topdik. O‘zbekcha javob berdi, o‘zbekcha video ketadi. Boshqa tilda javob berdi, uch daqiqadan keyin uning tilida xat ketadi.",
            "Video yo‘qmi yoki mijoz video xabarlarni taqiqlaganmi? Video o‘rniga xat ketadi. Saytsiz kompaniyaga video ketmaydi, unga nishasi haqida xat yozamiz.",
            "Mijoz videoga «ha», «+» yoki «qanday xatolar?» deb javob berdi. Uch daqiqadan keyin bot o‘zi tahlil yuboradi: saytda nima noto‘g‘ri va bepul maket taklifi. Tahlildan keyin «+» ga bot maket tayyorlayotganimizni yozadi, jamoaga esa «🔥 Нужен прототип» keladi.",
            "Mijoz qo‘ng‘iroq qilishni so‘radimi yoki tushunarsiz javob berdimi? Bot sizni chaqiradi. «Yozmang» deb yozsa, aloqa o‘zi yopiladi. Umuman javob bermasa, boshqa hech narsa ketmaydi. Aloqalar hisobiga «Здравствуйте» ning o‘zi kiradi.",
          ],
        },
        {
          id: "edit-sent",
          title: "«Tuzatish»: yuborilgan xabarni tuzatish",
          body: [
            "Yuborilgan xabarda xato bo‘lsa, uni tuzatish mumkin. «Tuzatish» tugmasi kompaniya kartochkasidagi xatda va lid kartochkasining «Lenta» sidagi bizning xabarlarimizda bor. Matnni tuzating va «Tuzatishni saqlash» ni bosing.",
            "Xat hali ketmaganmi? U darhol tuzatiladi. Ketgan bo‘lsa, uni o‘sha akkauntdan bot tuzatadi, odatda bir daqiqada. Mijozda «tahrirlangan» belgisi paydo bo‘ladi. Telegram xabarni 48 soat ichida tuzatishga ruxsat beradi.",
            "Yangi matn yuborishdan oldingi kabi tekshiriladi. Salom va doiraviy videoni tuzatib bo‘lmaydi. Tugmani aloqani yoki lidni olib borayotgan odam, rahbar va ega ko‘radi.",
          ],
        },
        {
          id: "hello-text",
          title: "«Здравствуйте» o‘rniga o‘z salomingiz",
          body: {
            manager: [
              "Birinchi bo‘lib salom ketadi, odatda «Здравствуйте». Rahbar va ega uni «Xat matnlari va A/B», «Birinchi xabar» blokida o‘z matni bilan almashtira oladi. U yerda hozir nima ketayotgani ham ko‘rinadi.",
            ],
            head: [
              "«Xat matnlari va A/B», «Birinchi xabar» blokida «Здравствуйте» o‘rniga o‘z salomingizni qo‘yishingiz mumkin. Ruscha va o‘zbekcha alohida qo‘yiladi. «Salomni saqlash» ni bosing, keyingi barcha aloqalar shu bilan boshlanadi. Bo‘sh maydon oddiy salom degani.",
              "Matn salomligicha qolishi kerak. Panel 8 so‘zdan uzun, havola, raqam, narx yoki emoji bor matnni saqlamaydi. U salom bilan boshlanishi kerak, masalan «Добрый день» yoki «Salom». Uni siz va ega o‘zgartira olasiz, o‘zgarish jurnalga yoziladi.",
            ],
            admin: [
              "«Xat matnlari va A/B», «Birinchi xabar» blokida «Здравствуйте» o‘rniga o‘z salomingizni qo‘yishingiz mumkin. Ruscha va o‘zbekcha alohida qo‘yiladi. «Salomni saqlash» ni bosing, keyingi barcha aloqalar shu bilan boshlanadi. Bo‘sh maydon oddiy salom degani.",
              "Matn salomligicha qolishi kerak. Panel 8 so‘zdan uzun, havola, raqam, narx yoki emoji bor matnni saqlamaydi. U salom bilan boshlanishi kerak, masalan «Добрый день» yoki «Salom». Uni siz va rahbar o‘zgartira olasiz, o‘zgarish jurnalga yoziladi.",
            ],
          },
        },
        {
          id: "after-reply",
          title: "Javobdan keyin nima ketadi: u haqida, narx oldinroq, e’tirozlarga javoblar",
          body: [
            "«Здравствуйте» ga javobdan keyin aloqalarning yarmi yangi stsenariy bo‘yicha, yarmi eskisi bo‘yicha ketadi. Shunda yangisi yordam beradimi, ko‘rinadi ([A/B](#prospect-sales-ab)). Yangi stsenariy mana nima qiladi.",
            "Doiraviy videodan oldin bitta qator ketadi: «Bu sizning saytingiz clinic.uz haqida, 40 soniya». Video nishaga qarab tanlanadi: stomatologiyaga stomatologiya haqida, mebelga mebel haqida. Nisha videosi bo‘lmasa, umumiysi ketadi.",
            "«+» dan keyin darhol maket shartlari havolasi bilan narx ketadi: maket bepul, yoqsa, lending 500 $ dan, bo‘lib to‘lash mumkin. Ko‘p uchraydigan e’tirozlarga («Qanday sayt?», «Qimmat», «Rahbarga yetkazaman») bot tayyor matn bilan javob beradi.",
            "«Rahbarga yetkazaman» deb jim qoldimi? Ikki kundan keyin, ish kunlari 10:00 dan 18:00 gacha, bitta savol ketadi: rahbar ko‘rishga ulgurdimi.",
            "Hamma aloqalar uchun: «Ish vaqtida javob beramiz» kabi avtojavob javob hisoblanmaydi. Bot 40-120 soniyadan oldin javob bermaydi, qisqa va ro‘yxatlarsiz. Javob tekshiruvdan o‘tmasa, suhbat sizga o‘tadi.",
            "21:00 dan 08:00 gacha bot mijozlarga yozmaydi. Tun bo‘yi kelgan javoblar sizga soat 08:00 da bitta «🌙 Ночью ответили клиенты» xulosasida keladi.",
          ],
        },
        {
          id: "objections",
          title: "Lid kartochkasidagi «E’tirozlarga javoblar» tugmalari",
          body: [
            "Lid kartochkasida javob maydoni ostida «E’tirozlarga javoblar» bloki bor. Tugmani bosing, tayyor matn maydonga mijoz tilida tushadi. Suhbatga moslab tuzating va yuboring.",
            "Tugmalar: «Qanday sayt? Bu nima?», «Bepulmi? Qayerda hiyla?», «Havola ochmayman», «Rahbarga yetkazaman», «Instagram orqali sotamiz», «Sayt bor», «Qimmat».",
            "«Qimmat» matnida narxlar zinapoyasi bor: 3 ta xatoni 150 $ ga tuzatish, vizitka 250 $, lending 500 $, korporativ sayt 1 000 $. Bo‘lib to‘lash: yarmi boshlanishda, yarmi ishga tushgandan keyin.",
            "Aloqalarning bir qismida yana «Maket tayyor + ko‘rsatish» tugmasi bor. U maketni 15 daqiqada, video orqali yoki uchrashuvda ko‘rsatishni taklif qiladi.",
          ],
        },
        {
          id: "sales-ab",
          title: "«Javobdan keyingi yangi yondashuv» bloki: A/B",
          body: [
            "«Xat matnlari va A/B» dagi «Javobdan keyingi yangi yondashuv» bloki ikki stsenariyni solishtiradi. Har bir aloqa tasodifan «Avvalgidek» yoki «Yangi yondashuv» ga tushadi. Yangisi nima qilishi [javobdan keyin nima ketadi](#prospect-after-reply) bandida yozilgan.",
            "Har bir yarmida nechta «Здравствуйте» ketgani, nechta javob kelgani, nechta «+» kelgani, maket olingani va to‘langani ko‘rinadi.",
            "Panel g‘olibni har bir yarmiga kamida 100 ta «Здравствуйте» ketgandan keyin aytadi. Ungacha aytishga erta deb yozadi.",
          ],
        },
        {
          id: "spin",
          title: "SPIN: savollar bilan sotish",
          body: [
            "SPIN — o‘zingiz haqingizda gapirish emas, savollar bilan sotish usuli. Savollar tartib bilan: vaziyat (mijozda hozir qanday, uning mijozlari qayerdan keladi), muammo (biz topgan narsani u sezadimi), oqibat (bu nimaga olib keladi: odam buyurtmagacha yetmadi va boshqalarga ketdi), foyda (tuzatilgani unga kerakligini o‘zi aytadi). «Foyda»dan keyin maket taklif qilamiz. Kerakligini o‘zi aytgan mijoz ko‘ndirilgan mijozdan ko‘ra osonroq rozi bo‘ladi.",
            "Lid kartochkasida javob maydoni ostida «SPIN savollari» bloki bor: «Vaziyat», «Muammo», «Oqibat», «Foyda» tugmalari. Bosing, savol mijoz tilida va uning sohasi so‘zlari bilan (bemorlar, mehmonlar, buyurtmachilar) maydonga tushadi. Bir martada bitta savol bering va avval mijoz so‘ragan narsaga javob bering. Oldinroq qiziqib qolsa, savollar kerak emas, darhol maket taklif qiling.",
            "Sun’iy intellekt maketgacha olib boradigan suhbatlarning yarmi SPIN bo‘yicha: har javobda keyingi bosqichning bitta savoli, «foyda»dan keyin «+ yuboring». Qolgan yarmi avvalgidek. Solishtirish [Xat matnlari va A/B](/admin/prospect/texts) dagi «Sun’iy intellekt yozishmasida SPIN» blokida: har yarmida nechta suhbat, «+» va maket. Panel g‘olibni har biriga kamida 30 ta suhbatdan keyin aytadi.",
          ],
        },
        {
          id: "fact-check",
          title: "Saytni fakt bo‘yicha tekshirish va oddiy til",
          body: [
            "Har bir xatdan oldin panel mijoz saytini telefondagi xaridor kabi qaytadan ochadi. Xatga faqat shu tekshiruvda takrorlangan narsa kiradi. Shunda tasodifiy nosozlik xatga tushmaydi.",
            "Kartochkada xat ostida sayt qachon qayta tekshirilgani va nima tasdiqlanmagani ko‘rinadi. Sayt ikkinchi marta ochilmadimi? Xat bo‘lmaydi. Bir necha daqiqadan keyin «Bog‘lanish» ni yana bosing.",
            "Tekshiruv uch kun amal qiladi. Bundan eski xatni panel yubormaydi va kartochkada yana «Bog‘lanish» paydo bo‘ladi. Eski matndagi tuzatishlaringiz bunda yo‘qoladi.",
            "Xat oddiy so‘zlar bilan yoziladi: biznes egasi dasturchi emas. «500 xatosi» emas, «bo‘lim o‘rniga xato sahifasi ochiladi». «Server», «SEO» yoki «indeksatsiya» kabi so‘zlarni tekshiruv o‘tkazmaydi.",
          ],
        },
        {
          id: "proto-ahead",
          title: "Oldindan prototip: va’da o‘rniga xatda havola",
          body: [
            "Hozir bu funksiya o‘chirilgan: panel prototiplarni o‘zi yig‘maydi. Xat 12 soatda prototip va’da qiladi, uni esa odam yig‘adi.",
            "Mijoz rozi bo‘lganda jamoaga «🛠 Хотят прототип» yoki «🔥 Нужен прототип» keladi. Kim birinchi bo‘lib «🛠 Беру прототип» ni bossa, lid o‘shaniki ([mijoz javoblari](#prospect-replies)).",
          ],
        },
        {
          id: "list",
          title: "«Tahlil qilingan saytlar» ro‘yxatida nima ko‘rsatiladi",
          body: [
            "Ro‘yxatda darhol ish ketayotgan saytlar ko‘rinadi. Bular matni tayyor kartochkalar, navbatdagi xatlar, «qo‘lda yozish» va oxirgi 7 kunda yuborilganlar. Shu yerda [kunlik portsiyangiz](#prospect-portion) va hozirgina ochgan kartochkangiz ham bor.",
            "Qolganlari yashirilgan: tegilmaganlar, o‘tkazib yuborilganlar, yopilganlar va bir haftadan oldin yuborilganlar. Ulardan birinchi 20 tasi ko‘rinadi, yangilari tepada. Ko‘proq kerakmi? Ro‘yxat ostidagi **«Yana 20 tasini ko‘rsatish»** tugmasini bosing.",
          ],
        },
        {
          id: "queue",
          title: "Ishchi akkaunt navbati: soatiga uchta xabar, 07:30 dan 20:30 gacha",
          body: {
            manager: [
              "Ishchi akkaunt (studiyaning Telegram raqami) yangi kompaniyalarga soatiga uch martadan ko‘p yozmaydi. Xabarlar orasida 8-20 daqiqa pauza bor, yuborish faqat Toshkent vaqti bilan 07:30 dan 20:30 gacha. Tezroq yozsak, Telegram bizni ommaviy xabar deb biladi va akkauntni cheklaydi.",
              "Kechasi qo‘yilgan xat ertalab ketadi. Javob berganlar bilan yozishma istalgan vaqtda va cheklovsiz davom etadi.",
              "Ro‘yxat ustida bir soatda nechta ketgani va nechtasi kutayotgani yozilgan: «Oxirgi soatda 3 tadan 1 tasi ketdi · navbatda 3 ta». Navbatdagi kartochkada taxminan qachon ketishi yozilgan, masalan «bugun taxminan 14:20 da». Vaqt 15 daqiqacha surilishi mumkin, lekin xat yo‘qolmagan.",
              "Ishchi akkauntlar bir nechta bo‘lishi mumkin. Xat qaysi akkauntda joy oldinroq bo‘shasa, o‘shandan ketadi. Lekin rahbar sizni ma’lum akkauntlarga belgilagan bo‘lsa, xat faqat o‘shalardan ketadi. Mijozga javoblar birinchi xabar ketgan akkauntdan boradi.",
              "Ba’zan Telegram akkauntni cheklaydi, odatda bir kunga. Unda kartochkadagi sariq qatorda akkaunt «… gacha cheklagan» deb yoziladi, xat shu vaqtni kutadi. Cheklov va uning olingani haqida bot butun jamoaga yozadi.",
              "Kutish shart emas. Mijozga o‘z akkauntingizdan yozing va **«O‘zim bog‘landim»** tugmasini bosing, shunda bot o‘z nusxasini yubormaydi. «Bu xatni hozir birorta ishchi akkaunt olmaydi» degan qator akkauntlaringiz o‘chirilganini bildiradi. Rahbardan sizni ishlayotgan akkauntga qo‘shishni so‘rang. Muallif belgilangan barcha akkauntlar o‘chirilgan bo‘lsa, «Yuborish: …» tugmasi umuman bo‘lmaydi. Uning o‘rnida «Bot hozir yubora olmaydi», «… ni Telegram’da ochish» va «Matnni nusxalash». Shunda xat navbatda qolib ketmaydi.",
              "Egasining xatlari navbatsiz ketadi, bunday kartochkalarda shu yozilgan. Ular bir daqiqada, boshqalarni kutmasdan ketadi, lekin ular ham faqat 07:30 dan 20:30 gacha.",
            ],
            head: [
              "Ishchi akkaunt (studiyaning Telegram raqami) yangi kompaniyalarga soatiga uch martadan ko‘p yozmaydi. Xabarlar orasida 8-20 daqiqa pauza bor, yuborish faqat Toshkent vaqti bilan 07:30 dan 20:30 gacha. Tezroq yozsak, Telegram bizni ommaviy xabar deb biladi va akkauntni cheklaydi.",
              "Kechasi qo‘yilgan xat ertalab ketadi. Javob berganlar bilan yozishma istalgan vaqtda va cheklovsiz davom etadi.",
              "Ro‘yxat ustida bir soatda nechta ketgani va nechtasi kutayotgani yozilgan: «Oxirgi soatda 3 tadan 1 tasi ketdi · navbatda 3 ta». Navbatdagi kartochkada taxminan qachon ketishi yozilgan, masalan «bugun taxminan 14:20 da». Vaqt 15 daqiqacha surilishi mumkin, lekin xat yo‘qolmagan.",
              "Xat qaysi akkauntda joy oldinroq bo‘shasa, o‘shandan ketadi. Kim qaysi akkauntlardan yozishini siz yoki egasi [«Akkauntlar»](/admin/accounts) bo‘limida belgilaysiz ([akkauntda kim ishlaydi](#accounts-staff) bandi). Belgilangan menejer faqat o‘z akkauntlaridan, belgilanmagani istalganidan yozadi.",
              "Ba’zan Telegram akkauntni cheklaydi, odatda bir kunga. Unda kartochkadagi sariq qatorda akkaunt «… gacha cheklagan» deb yoziladi, xat shu vaqtni kutadi. Cheklov va uning olingani haqida bot butun jamoaga yozadi.",
              "Kutish shart emas: mijozga o‘zingiz yozib, **«O‘zim bog‘landim»** tugmasini bosishingiz mumkin. «Bu xatni hozir birorta ishchi akkaunt olmaydi» degan qator muallif faqat o‘chirilgan akkauntlarga belgilanganini bildiradi. Uni yana bitta ishlayotgan akkauntga belgilang. Muallif belgilangan barcha akkauntlar o‘chirilgan bo‘lsa, «Yuborish: …» tugmasi umuman bo‘lmaydi. Uning o‘rnida «Bot hozir yubora olmaydi», «… ni Telegram’da ochish» va «Matnni nusxalash». Shunda xat navbatda qolib ketmaydi.",
              "Egasining xatlari navbatsiz ketadi, bunday kartochkalarda shu yozilgan. Ular bir daqiqada, boshqalarni kutmasdan ketadi, lekin ular ham faqat 07:30 dan 20:30 gacha.",
            ],
            admin: [
              "Ishchi akkaunt (studiyaning Telegram raqami) yangi kompaniyalarga soatiga uch martadan ko‘p yozmaydi. Xabarlar orasida 8-20 daqiqa pauza bor, yuborish faqat Toshkent vaqti bilan 07:30 dan 20:30 gacha. Tezroq yozsak, Telegram bizni ommaviy xabar deb biladi va akkauntni cheklaydi.",
              "Kechasi qo‘yilgan xat ertalab ketadi. Javob berganlar bilan yozishma istalgan vaqtda va cheklovsiz davom etadi.",
              "Ro‘yxat ustida bir soatda nechta ketgani va nechtasi kutayotgani yozilgan: «Oxirgi soatda 3 tadan 1 tasi ketdi · navbatda 3 ta». Navbatdagi kartochkada taxminan qachon ketishi yozilgan, masalan «bugun taxminan 14:20 da». Vaqt 15 daqiqacha surilishi mumkin, lekin xat yo‘qolmagan.",
              "Xat qaysi akkauntda joy oldinroq bo‘shasa, o‘shandan ketadi. Kim qaysi akkauntlardan yozishini siz yoki rahbar [«Akkauntlar»](/admin/accounts) bo‘limida belgilaysiz ([akkauntda kim ishlaydi](#accounts-staff) bandi). Belgilangan xodim faqat o‘z akkauntlaridan, belgilanmagani istalganidan yozadi.",
              "Ba’zan Telegram akkauntni cheklaydi, odatda bir kunga. Unda kartochkadagi sariq qatorda akkaunt «… gacha cheklagan» deb yoziladi, xat shu vaqtni kutadi. Cheklov va uning olingani haqida bot butun jamoaga yozadi.",
              "Kutish shart emas: mijozga o‘zingiz yozib, **«O‘zim bog‘landim»** tugmasini bosishingiz mumkin. «Bu xatni hozir birorta ishchi akkaunt olmaydi» degan qator muallif faqat o‘chirilgan akkauntlarga belgilanganini bildiradi. Uni yana bitta ishlayotgan akkauntga belgilang. Muallif belgilangan barcha akkauntlar o‘chirilgan bo‘lsa, «Yuborish: …» tugmasi umuman bo‘lmaydi. Uning o‘rnida «Bot hozir yubora olmaydi», «… ni Telegram’da ochish» va «Matnni nusxalash». Shunda xat navbatda qolib ketmaydi.",
              "Sizning xatlaringiz navbatsiz ketadi: bir daqiqada, jamoa xatlarini kutmasdan. Lekin ular ham faqat 07:30 dan 20:30 gacha va ular ham soatiga uchta limitiga kiradi.",
            ],
          },
        },
        {
          id: "self",
          title: "«O‘zim bog‘landim»: mijozga o‘zingiz yozdingiz",
          body: [
            "Mijozga o‘zingiz yozgan yoki qo‘ng‘iroq qilgan bo‘lsangiz, **«O‘zim bog‘landim»** tugmasini bosing: o‘z akkauntingizdan, WhatsApp’da yoki telefonda. Maydonga qisqacha qanday bog‘langaningizni yozing, masalan «qo‘ng‘iroq». Telegramda bu tugma «✋ Написал сам» deb ataladi.",
            "Bosgandan keyin aloqa sizga hisoblanadi, lid (mijoz arizasi) sizga biriktiriladi. Kartochka «yuborildi» bo‘ladi va hamkasbingiz bu mijozga endi yozmaydi. Belgilamasangiz, panel siz hech kimga yozmagan deb hisoblaydi.",
            "Studiyaning ishchi akkauntidan yozdingizmi? Mijoz javob berganda bot javobni o‘zi ko‘radi va yozishmani davom ettiradi. Raqam orqali yozgan bo‘lsangiz, raqamni ishchi akkaunt kontaktlariga qo‘shing, aks holda bot mijozni tanimaydi.",
            "Shaxsiy akkauntdan, WhatsApp’da yozdingizmi yoki qo‘ng‘iroq qildingizmi? Unda yozishmani siz olib borasiz, bot uni ko‘rmaydi. Mijoz javobini kartochkaga qo‘yish mumkin ([qo‘lda yozish](#prospect-manual) bandi).",
          ],
        },
        {
          id: "write-myself",
          title: "Xatni navbatdan olib, o‘zingiz yozish",
          body: {
            manager: [
              "Xat navbatda turibdi, siz esa kutmasdan mijozga o‘zingiz yozmoqchimisiz? Uni navbatdan oling, bot uni yubormaydi.",
              "**Telegramda.** Kompaniya kartochkasi ostida «✋ Напишу сам — не отправлять» tugmasini bosing. Bot xat matnini (bossangiz, nusxalanadi) va mijoz bilan yozishmani ochadigan tugmani yuboradi. Bot ulgurib yuborgan bo‘lsa, tugmada «📤 Бот уже отправил это письмо» chiqadi.",
              "**Panelda, bir nechtasini birdan.** Ro‘yxat ustida sariq blok bor. O‘z xatlaringizga «O‘zim yozaman» belgisini qo‘ying va **«O‘zim yozaman — yubormang»** tugmasini bosing. **«Hammasini belgilash»** tugmasi barcha xatlaringizni belgilaydi.",
              "Keyin hammasi [«O‘zim bog‘landim»](#prospect-self) dan keyingidek. Aloqa va lid sizniki, mijozga siz yozasiz. Uning javobini kartochkadagi «Mijoz nima deb javob berdi» maydoniga qo‘ying ([qo‘lda yozish](#prospect-manual) bandi).",
            ],
            head: [
              "Xat navbatda turibdi, siz esa kutmasdan mijozga o‘zingiz yozmoqchimisiz? Uni navbatdan oling, bot uni yubormaydi.",
              "**Telegramda.** Kompaniya kartochkasi ostida «✋ Напишу сам — не отправлять» tugmasini bosing. Bot xat matnini (bossangiz, nusxalanadi) va mijoz bilan yozishmani ochadigan tugmani yuboradi. Bot ulgurib yuborgan bo‘lsa, tugmada «📤 Бот уже отправил это письмо» chiqadi.",
              "**Panelda, bir nechtasini birdan.** Ro‘yxat ustida sariq blok bor, «O‘zim yozaman» belgisi navbatdagi har bir xatda turadi. Keraklilarini belgilang va **«O‘zim yozaman — yubormang»** tugmasini bosing. Aloqa sizga yoziladi, shuning uchun menejer xatini faqat o‘zingiz yozsangizgina oling.",
              "Keyin hammasi [«O‘zim bog‘landim»](#prospect-self) dan keyingidek. Aloqa sizniki, lid esa xatni navbatga qo‘ygan odamda qoladi. Mijoz javobini kartochkadagi «Mijoz nima deb javob berdi» maydoniga qo‘ying ([qo‘lda yozish](#prospect-manual) bandi).",
            ],
            admin: [
              "Xat navbatda turibdi, siz esa kutmasdan mijozga o‘zingiz yozmoqchimisiz? Uni navbatdan oling, bot uni yubormaydi.",
              "**Telegramda.** Kompaniya kartochkasi ostida «✋ Напишу сам — не отправлять» tugmasini bosing. Bot xat matnini (bossangiz, nusxalanadi) va mijoz bilan yozishmani ochadigan tugmani yuboradi. Bot ulgurib yuborgan bo‘lsa, tugmada «📤 Бот уже отправил это письмо» chiqadi.",
              "**Panelda, bir nechtasini birdan.** Ro‘yxat ustida sariq blok bor, «O‘zim yozaman» belgisi navbatdagi har bir xatda turadi. Keraklilarini belgilang va **«O‘zim yozaman — yubormang»** tugmasini bosing. Aloqa sizga yoziladi, shuning uchun menejer xatini faqat o‘zingiz yozsangizgina oling.",
              "Keyin hammasi [«O‘zim bog‘landim»](#prospect-self) dan keyingidek. Aloqa sizniki, lid esa xatni navbatga qo‘ygan odamda qoladi. Mijoz javobini kartochkadagi «Mijoz nima deb javob berdi» maydoniga qo‘ying ([qo‘lda yozish](#prospect-manual) bandi).",
            ],
          },
        },
        {
          id: "bot-edit",
          title: "«✏️ Изменить текст»: xatni to‘g‘ridan-to‘g‘ri botda tuzatish",
          body: {
            manager: [
              "Xatni to‘g‘ridan-to‘g‘ri Telegramda tuzatsa bo‘ladi. [Kunlik portsiya](#prospect-portion) va [oqim](#prospect-stream)dagi kompaniya kartochkasi ostida «✏️ Изменить текст» tugmasi bor.",
              "Uni bossangiz, bot joriy matnni yuboradi. Uni nusxalang, tuzating va **bot xabariga javob qilib** yuboring (Telegramda bu «Ответить»). Alohida xabarni bot tushunmaydi. Tugma bir kun ishlaydi, keyin yana bosing.",
              "Bot matnni panel yuborishdan oldin tekshirgandek tekshiradi: 12 tadan 100 tagacha so‘z, salomsiz va texnik so‘zlarsiz. Hammasi joyida bo‘lsa, bot yangi matnli kartochkani yuboradi. Bo‘lmasa, nimani tuzatishni yozadi.",
              "Mijoz salomga javob bermaguncha, yangi matn ketadi. Xat allaqachon mijozda bo‘lsa, bot uni o‘sha yerda tuzatadi, xuddi [paneldagi «Tuzatish»](#prospect-edit-sent) kabi. Faqat o‘z kartochkalaringiz va xatlaringizni tuzata olasiz.",
            ],
            head: [
              "Xatni to‘g‘ridan-to‘g‘ri Telegramda tuzatsa bo‘ladi. [Kunlik portsiya](#prospect-portion) va [oqim](#prospect-stream)dagi kompaniya kartochkasi ostida «✏️ Изменить текст» tugmasi bor.",
              "Uni bossangiz, bot joriy matnni yuboradi. Uni nusxalang, tuzating va **bot xabariga javob qilib** yuboring (Telegramda bu «Ответить»). Alohida xabarni bot tushunmaydi. Tugma bir kun ishlaydi, keyin yana bosing.",
              "Bot matnni panel yuborishdan oldin tekshirgandek tekshiradi: 12 tadan 100 tagacha so‘z, salomsiz va texnik so‘zlarsiz. Hammasi joyida bo‘lsa, bot yangi matnli kartochkani yuboradi. Bo‘lmasa, nimani tuzatishni yozadi.",
              "Mijoz salomga javob bermaguncha, yangi matn ketadi. Xat allaqachon mijozda bo‘lsa, bot uni o‘sha yerda tuzatadi, xuddi [paneldagi «Tuzatish»](#prospect-edit-sent) kabi. Siz istalgan kartochka va navbatdagi istalgan xatni tuzata olasiz, kim nimani tuzatgani jurnalda ko‘rinadi.",
            ],
            admin: [
              "Xatni to‘g‘ridan-to‘g‘ri Telegramda tuzatsa bo‘ladi. [Kunlik portsiya](#prospect-portion)dagi kompaniya kartochkasi ostida «✏️ Изменить текст» tugmasi bor.",
              "Uni bossangiz, bot joriy matnni yuboradi. Uni nusxalang, tuzating va **bot xabariga javob qilib** yuboring (Telegramda bu «Ответить»). Alohida xabarni bot tushunmaydi. Tugma bir kun ishlaydi, keyin yana bosing.",
              "Bot matnni panel yuborishdan oldin tekshirgandek tekshiradi: 12 tadan 100 tagacha so‘z, salomsiz va texnik so‘zlarsiz. Hammasi joyida bo‘lsa, bot yangi matnli kartochkani yuboradi. Bo‘lmasa, nimani tuzatishni yozadi.",
              "Mijoz salomga javob bermaguncha, yangi matn ketadi. Xat allaqachon mijozda bo‘lsa, bot uni o‘sha yerda tuzatadi, xuddi [paneldagi «Tuzatish»](#prospect-edit-sent) kabi. Siz istalgan kartochka va navbatdagi istalgan xatni tuzata olasiz, kim nimani tuzatgani jurnalda ko‘rinadi.",
            ],
          },
        },
        {
          id: "manual",
          title: "«Qo‘lda yozish»: Telegramsiz telefon",
          body: [
            "«Qo‘lda yozish» mijoz Telegramda topilmaganini bildiradi. Masalan, saytda faqat shahar raqami bor yoki havola kanalga olib boradi. Telegramga «только звонок или WhatsApp» degan qator keladi.",
            "Kartochkada **«WhatsApp’ni tayyor matn bilan ochish»**, **«Qo‘ng‘iroq qilish»** va **«Matnni nusxalash»** tugmalari bor. Yozdingiz yoki qo‘ng‘iroq qildingizmi? **«O‘zim bog‘landim»** tugmasini bosing.",
            "Mijoz WhatsApp’da javob berdimi? Uning javobini «Mijoz nima deb javob berdi» maydoniga qo‘ying va **«Javobni yozib qo‘yish»** tugmasini bosing. Bot keyingi javobni yozadi, uni nusxalash yoki darhol WhatsApp’da ochish mumkin.",
            "Yozmaysizmi? «yozmaymiz» tugmasini bosing va sababini yozing.",
          ],
        },
        {
          id: "replies",
          title: "Mijoz javob berdi: kim javob beradi",
          body: [
            "Mijoz ishchi akkauntga javob berganda, unga studiya nomidan bot javob beradi. Robotga o‘xshamaslik uchun u bir necha daqiqa kutadi. Salomdan keyin bot nima yozishi [ikki bosqichli aloqa](#prospect-hello) bandida yozilgan.",
            "Mijoz odam yoki qo‘ng‘iroq so‘rasa, bot sizni chaqiradi. Yoki tijorat taklifi, smeta yoki fayl yuborishni so‘rasa: unda o‘sha kuni o‘zingiz yuboring. Mijoz tushunarsiz javob bersa yoki suhbat cho‘zilib ketsa ham bot sizni chaqiradi.",
            "Mijoz maketga rozi bo‘ldimi («+», «ha»)? Bot o‘zi maket tayyorlanayotganini yozadi va shartlarni yuboradi. Aloqa muallifiga «🛠 Хотят прототип» xabari «🛠 Беру прототип» tugmasi bilan keladi. Birinchi 30 daqiqa maket faqat sizniki, keyin tugma butun jamoaga ketadi va maketni birinchi bosgan oladi.",
            "Maketni olgan odam uni yig‘adi va 12 soat ichida mijozga havolani yuboradi. Muddatdan 2 soat oldin eslatma o‘zi qo‘yiladi.",
            "Bot sizning aloqangiz bo‘yicha yozishayotganda, mijozning har bir javobiga «💬 Ваш лид ответил» keladi. Bot 5 daqiqadan keyin o‘zi javob beradi. O‘zingiz javob bermoqchi bo‘lsangiz, «✋ Отвечу сам» tugmasini bosing.",
            "Suhbatni istalgan payt lid kartochkasidagi **«O‘zim javob beraman»** tugmasi bilan botdan olish mumkin. Keyin bot jim turadi, mijozning yangi xabarlari esa sizga Telegramga keladi.",
            "To‘g‘ridan-to‘g‘ri lid kartochkasidan, «Lenta» ostidan javob berish mumkin. «Qayerga» maydonida mijozga yozilgan akkauntni tanlang va **«Yuborish»** tugmasini bosing. Maketlarimiz va keyslarimizga havolalarni panel tekshiradi: havola ochilmasa, xabar ketmaydi.",
            "Rad javobini («qiziq emas», «yo‘q, rahmat») bot o‘zi yopadi va sizni chaqirmaydi. 21:00 dan 08:00 gacha bot mijozlarga javob bermaydi. Mijozlar kechasi nima yozgani sizga 08:00 da bitta xabarda keladi.",
          ],
        },
        {
          id: "close",
          title: "«Mijoz rad etdi» va «Javob bermayapti»: aloqa yopildi",
          body: [
            "Suhbat bo‘lmasligi aniq bo‘lsa, aloqani yoping. **«🙅 Mijoz rad etdi»** tugmasini mijoz so‘z bilan yoki telefonda rad etganda bosasiz. **«🔇 Javob bermayapti»** tugmasini u jim turganda yoki telefonni olmaganda bosasiz.",
            "Tugmalar yuborilgan sayt kartochkasida va Telegramda kompaniya kartochkasi ostida bor (Telegramda ular ruscha: «🙅 Клиент отказался» va «🔇 Игнорирует»). Yozishmadagi aniq rad javobini bot o‘zi yopadi, unda hech narsa bosish shart emas.",
            "Yopilgandan keyin bot mijozga boshqa yozmaydi va javob bermaydi. Lid «yutqazilgan» holatini oladi, uning eslatmalari olib tashlanadi. Aloqa esa hisobda qoladi: mijozga axir yozilgan.",
            "Faqat aloqadan keyin yopish mumkin: xat hali navbatda bo‘lsa, yuborilishini kuting. Mijoz keyin o‘zi yozsa, bot aloqani olib borgan odamni chaqiradi. Unda lidga «ishda» holatini qaytaring.",
          ],
        },
        {
          id: "followups",
          title: "Eslatma: mijoz jim tursa",
          body: [
            "Mijoz salomga javob bermadimi? Bot unga boshqa hech narsa yozmaydi. Notanish odamdan takroriy xabarlar spam shikoyatlariga olib keladi va Telegram akkauntni cheklaydi.",
            "Bitta istisno bor. Mijoz «rahbarga yetkazaman» deb jim qolsa, 2 kundan keyin bot bir marta so‘rashi mumkin: «Rahbaringiz ko‘rib chiqishga ulgurdimi?». Bu faqat ish kunlari 10:00 dan 18:00 gacha bo‘ladi.",
            "«O‘zim bog‘landim» dan keyin va qo‘lda yozish yo‘lida o‘zingizni eslatishni faqat siz qila olasiz. «Mijoz rad etdi» va «Javob bermayapti» dan keyin bot mijozga umuman yozmaydi.",
          ],
        },
        {
          id: "numbers",
          title: "Kartochkadagi raqamlarni qanday o‘qish",
          body: [
            "**«qidiruv 84»** saytni Google va Yandexda topish qanchalik osonligini ko‘rsatadi, 0 dan 100 gacha. 80 va undan yuqori yaxshi, 50 dan past yomon, 10 gacha sayt qidiruvdan yopiq.",
            "**«−24…48»** bizning bahomiz: topilgan muammolar tufayli har yuz murojaatdan nechtasi yo‘qoladi. Masalan, narxlar yo‘q yoki telefon bosilmaydi. Bu mijozning statistikasi emas, unga shunday deb ayting.",
            "**Oxirgi raqam** saytning umumiy bahosi. Har bir muammo uchun ball ayiriladi. 60 dan past bo‘lsa raqam sariq, 0 esa sayt ochilmaganini bildiradi.",
            "Topilmalar ramkasi: qizil jiddiy xato, oltin rang muhim, kulrang mayda narsa. Suhbatni mijozlar va pul haqidagi topilmadan boshlang.",
            "Kartochka holatlari: «yozilmagan», «xabar tayyor», «yuborish navbatida», «yuborildi», «qo‘lda yozish», «yuborilmadi», «o‘tkazib yuborilgan». «yuborilmadi» bot xatni yetkaza olmaganini bildiradi, kartochkani oching. Xuddi shu yo‘riqnoma ro‘yxat ustidagi «Raqamlarni qanday o‘qish kerak» blokida ham bor.",
          ],
        },
        {
          id: "own-list",
          title: "O‘z saytlar ro‘yxatingizni tekshirish",
          body: [
            "O‘z saytlar ro‘yxatingizni tepadagi blokda tekshirsa bo‘ladi. Manzillarni har qatorda bittadan qo‘ying, yoniga kompaniya nomini yozsa ham bo‘ladi. **«Tekshirish»** tugmasini bosing, bir martada 200 tagacha manzil.",
            "Topilmali saytlar darhol umumiy ro‘yxatga tushadi. Muammosiz saytlar saqlanmaydi: ularga yozadigan narsa yo‘q. Ro‘yxatda bor sayt ikkinchi marta qo‘shilmaydi.",
            "Sayti yo‘q kompaniyalar: «Kompaniyaning sayti yo‘q» ni belgilang, nishani va nomlarni har qatorda bittadan yozing. «Qo‘shish» tugmasini bosing. Ularga xat nisha bo‘yicha yoziladi.",
            "«Xat tili» faqat jadvaldagi qoralamani o‘zgartiradi. «Bog‘lanish» dagi xat sayt tilida yoziladi.",
          ],
        },
        {
          id: "skip",
          title: "«yozmaymiz» va «✖ Не подходит»",
          body: [
            "Har kimga yozish shart emas. Masalan, sayt davlatniki, kompaniya yopilgan yoki bu sizning tanishingiz. «yozmaymiz» tugmasini bosing va sababini qisqacha yozing. Kartochka «o‘tkazib yuborilgan» bo‘ladi va boshqa hech kimga tushmaydi.",
            "Telegramda kunlik portsiyadagi «✖ Не подходит» tugmasi ham shuni qiladi. Bunday kompaniya bajarilmagan hisoblanmaydi, uning o‘rniga darhol boshqasi keladi.",
          ],
        },
        {
          id: "maps",
          title: "Xaritalar bo‘yicha kompaniyalarni avtoqidirish",
          roles: ["head", "admin"],
          body: {
            head: [
              "Avtoqidiruv Google xaritalaridan kompaniyalarni o‘zi topadi. Siz yoki egasi kampaniya ochasiz: nisha va shahar, masalan «stomatologiya» va «Toshkent». Keyin «Qidirish» tugmasini bosing.",
              "Har kuni ertalab 06:00 da tizim yangi kompaniyalarni qidiradi va saytlarini tekshiradi. Ro‘yxatga (aloqalar uchun kompaniyalar ro‘yxati) yozadigan narsasi borlar va sayti yo‘q, lekin telefoni bor kompaniyalar tushadi. Bitta shaharda bitta nishani ikkinchi marta ochib bo‘lmaydi.",
              "Kampaniya qatorida «topildi N · ro‘yxatda M» ko‘rinadi. «natijalar tugadi» yozuvi yangi kompaniyalar yo‘qligini va boshqa nisha ochish vaqti kelganini bildiradi. «hozir qidirish», «pauza» va «davom ettirish» tugmalari darhol ishlaydi.",
              "Kuniga 25 tadan ko‘p so‘rov yo‘q, har birida 20 tagacha kompaniya. So‘rovlar pullik, shuning uchun faqat studiyaga kerakli nishalarni oching. Blokda «Ulanmagan» yozilgan bo‘lsa, egasiga ayting.",
            ],
            admin: [
              "Avtoqidiruv Google xaritalaridan kompaniyalarni o‘zi topadi. Siz yoki rahbar kampaniya ochasiz: nisha va shahar, masalan «stomatologiya» va «Toshkent». Keyin «Qidirish» tugmasini bosing.",
              "Har kuni ertalab 06:00 da tizim yangi kompaniyalarni qidiradi va saytlarini tekshiradi. Ro‘yxatga (aloqalar uchun kompaniyalar ro‘yxati) yozadigan narsasi borlar va sayti yo‘q, lekin telefoni bor kompaniyalar tushadi. Bitta shaharda bitta nishani ikkinchi marta ochib bo‘lmaydi.",
              "Kampaniya qatorida «topildi N · ro‘yxatda M» ko‘rinadi. «natijalar tugadi» yozuvi yangi kompaniyalar yo‘qligini va boshqa nisha ochish vaqti kelganini bildiradi. «hozir qidirish», «pauza» va «davom ettirish» tugmalari darhol ishlaydi.",
              "Kuniga 25 tadan ko‘p so‘rov yo‘q, bu oyiga taxminan 750 ta: Google’ning bepul mingligi ichida. Blokda «Ulanmagan» yozilgan bo‘lsa, ulanish qadamlari o‘sha yerda ko‘rsatilgan. Kalit maxfiy ma’lumotlar omborida turadi, panel uni o‘zi oladi.",
            ],
          },
        },
      ],
    },

    /* ── Рабочие аккаунты ──────────────────────────────────────────────── */
    "/admin/accounts": {
      what: "Bu yerda ishchi Telegram akkauntlari. Ulardan studiya kompaniyalarga birinchi bo‘lib yozadi va mijozlar bilan yozishadi. Asosiy akkaunt allaqachon ulangan, bu yerda qo‘shimchalari qo‘shiladi.",
      items: [
        {
          id: "add",
          title: "Akkaunt ulash",
          body: [
            "Akkaunt nomi va telefon raqamini yozing, **«Kod yuborish»**ni bosing. Kod shu telefondagi Telegram ilovasiga keladi, odatda SMS emas. Uni yozing va **«Kirish»**ni bosing.",
            "Kodni hech kimga yubormang: yuborilgan kodni Telegram bekor qiladi. Ikki bosqichli himoya paroli so‘ralsa, yozing va yana **«Kirish»**ni bosing. Biz uni saqlamaymiz.",
            "Telefonda yangi seans paydo bo‘ladi. Uni tugatmang, aks holda akkaunt uziladi. Kirishda xato bo‘ldimi? «O‘chirish»ni bosing va qaytadan ulang.",
          ],
        },
        {
          id: "limits",
          title: "Qancha xat va qaysi akkauntdan",
          body: [
            "Har bir akkaunt yangi odamlarga soatiga uchtagacha birinchi xabar yozadi, 07:30-20:30 da. Yangi raqamga birinchi haftada «Soatiga xat» maydoniga 1-2 qo‘ying.",
            "Xabar joyi oldinroq bo‘shagan akkauntdan ketadi. Keyin mijozga o‘sha raqamdan yoziladi. Avtoyurish (kompaniyalarga o‘zi yozadigan bot) faqat qo‘shimcha akkauntlardan ishlaydi.",
            "«Aloqada» belgisi akkaunt ishlayotganini bildiradi. Uch daqiqadan ko‘proq yo‘qoldimi? Akkauntni qaytadan ulang.",
          ],
        },
        {
          id: "staff",
          title: "Akkauntda kim ishlaydi",
          body: [
            "**«Akkauntda kim ishlaydi»** blokida odamlarni belgilang va **«Saqlash»**ni bosing. Ularning birinchi xabarlari faqat ularning akkauntlaridan ketadi. Shunda mijozga uning menejeri raqamidan yoziladi.",
            "Odam hech qayerda belgilanmaganmi? Uning xabarlarini istalgan akkaunt oladi.",
          ],
        },
        {
          id: "circle",
          title: "Aloqalar uchun dumaloq video",
          body: [
            "Dumaloq video (qisqa video) «Здравствуйте»ga javob berganlarga ketadi. Ruscha javob berganlar ruschasini, o‘zbekcha javob berganlar o‘zbekchasini oladi. Mijoz javob bersa, bot sayt tahlilini yuboradi ([ikki bosqichli aloqa](#prospect-hello)).",
            "Ikkala videoni **«Aloqalar uchun dumaloq video»** blokiga yuklang: MP4 fayl, kvadrat, bir daqiqagacha. **«Dumaloq videoni yuklash»**ni bosing, o‘n daqiqada bot uni barcha akkauntlarning «Saqlangan xabarlar»iga qo‘yadi.",
            "Videoni studiya botiga yuborsa ham bo‘ladi, u tilni so‘raydi. Kerakli video yo‘qmi? Unda mijozga xat ketadi.",
          ],
        },
        {
          id: "circle-niches",
          title: "Sohalar bo‘yicha dumaloq videolar",
          body: [
            "**«Sohalar bo‘yicha dumaloq videolar»** blokida video sohaga qarab yoziladi: stomatologiyaga stomatologiya haqida, mebelchiga mebel haqida. Soha videosi bo‘lmasa, umumiysi ketadi.",
            "**«Soha»** va **«Video tili»**ni, faylni tanlang va **«Soha videosini yuklash»**ni bosing. «Yetishmaydi: …» qatori qaysi videolar yo‘qligini ko‘rsatadi.",
            "Soha videolarini aloqalarning yarmi oladi: shunday qilib ikki yondashuvni solishtiramiz ([A/B](#prospect-sales-ab)).",
          ],
        },
        {
          id: "stop",
          title: "Pauza, cheklov va o‘chirish",
          body: [
            "**«Pauza»** birinchi xabarlarni to‘xtatadi, boshlangan suhbatlarda javoblar ketaveradi. **«Ishga qaytarish»** akkauntni yana yoqadi.",
            "Telegram akkauntni cheklasa, u bir sutkaga yoki Telegram aytgan muddatga to‘xtaydi. Bot jamoani ogohlantiradi. Cheklov davomida boshqa akkauntdan yozing ([akkauntda kim ishlaydi](#accounts-staff)).",
            "Telegram akkauntni muzlatdimi? Bot qanday shikoyat qilishni aytadi. Muzlatish olingach, «Ishga qaytarish»ni bosing.",
            "**«O‘chirish»** seansni yopadi. Bu akkauntdagi suhbatlarni endi qo‘lda olib boring.",
          ],
        },
      ],
    },

    /* ── Надзор ───────────────────────────────────────────────────────── */
    "/admin/talks": {
      what: "Bu yerda sovuq aloqalar bo‘yicha yozishmalar tahlili: mijozni nima qiziqtirdi, suhbat qayerda uzildi va bundan qanday saboq chiqadi.",
      items: [
        {
          id: "when",
          title: "Tahlil qachon paydo bo‘ladi",
          body: [
            "Mijozning oxirgi javobidan taxminan bir soat o‘tib. Mijoz yana yozsa, suhbat qaytadan tahlil qilinadi.",
            "Bu yerga faqat mijoz kamida bir marta javob bergan aloqalar tushadi.",
          ],
        },
        {
          id: "read",
          title: "Qatorni qanday o‘qish kerak",
          body: [
            "Natija suhbat qanday tugaganini ko‘rsatadi: «rad etdi», «odamni chaqirdi», «suhbat to‘xtab qoldi» yoki «hali davom etyapti».",
            "Saboq yashil rangda. Pastda «E’tiborni tortdi», «E’tiroz» va «Buzildi». Mijoz ikkitadan kam xabar yozdimi? Unda saboq yo‘q.",
          ],
        },
        {
          id: "use",
          title: "Bu bilan nima qilish kerak",
          body: {
            manager: [
              "Xat yozishdan oldin saboqlarni o‘qing: odamlarni nima qiziqtiradi va ular qayerda jim bo‘lib qoladi.",
              "«lid →» havolasi shu suhbat bo‘yicha lidingizni ochadi.",
            ],
            head: [
              "Saboqlarni jamoa bilan muhokama qiling: qaysi ilgaklar ishlaydi va mijozlarni qayerda yo‘qotamiz.",
            ],
            admin: [
              "Saboqlar hozircha faqat to‘planadi va xatlarga qo‘shilmaydi. Ularni xatlarga qo‘shishni o‘nlab javoblar yig‘ilganda boshlash kerak.",
            ],
          },
        },
      ],
    },

    /* ── Макеты ───────────────────────────────────────────────────────── */
    "/admin/mockups": {
      what: "Bu yerda studiyaning barcha maketlari: devuz.studio’dagi prototiplar va vitrina loyihalari. Maket kim uchun qilingani va mijozga yuborilgan-yuborilmagani ko‘rinadi. Mijoz o‘z maketini ochishi uchun parol ham shu yerda beriladi.",
      items: [
        {
          id: "list",
          title: "Ro‘yxatda nima bor",
          body: [
            "Ro‘yxatda mijoz ko‘rishi mumkin bo‘lgan barcha maketlar bor. Yangi maket tayyor bo‘lishi bilan shu yerda o‘zi paydo bo‘ladi. Qoralamalar yo‘q: ularning havolasida mijoz hech narsa ko‘rmaydi.",
            "Belgilar maket qayerdan kelganini ko‘rsatadi. «vitrina» vitrina loyihasi degani, «botdagi maket» va «saytda yig‘ilgan» esa uni mijozning o‘zi yig‘gan degani. «botdan, xodim yig‘gan» maketni jamoadan kimdir o‘z mijozi uchun yig‘ganini bildiradi.",
            "Har bir maketda mijoz sayti, «Nisha», «Yaratilgan» va havola ko‘rinadi. «mijoz ochgan: 3 marta» maketni mijoz necha marta ochganini ko‘rsatadi. Paneldan o‘zingiz ochganingiz va messenjerdagi havola prevyusi bunga kirmaydi.",
            "Yangi maketlar tepada. Qidiruv nom, sayt, nisha, mas’ul va mijoz bo‘yicha ishlaydi. «Hammasi», «Qo‘lda yig‘ilgan», «Yuborilmagan» va «Vitrina» tugmalari ro‘yxatda faqat keraklisini qoldiradi.",
          ],
        },
        {
          id: "bot-mockup",
          title: "Botdagi maket: mijoz o‘zi yig‘adi",
          body: [
            "Mijoz o‘z sayti maketini studiya botining lichkasida /maket buyrug‘i bilan o‘zi yig‘ishi mumkin. Tayyor shablonlar o‘n to‘rtta sohada bor: stomatologiya, tibbiyot markazi, mebel-ta’mir, restoran, turagentlik, o‘quv markazi, ko‘chmas mulk, go‘zallik saloni, internet-do‘kon, avtoservis, logistika, qurilish va ta’mir, biznes xizmatlari, avtosalon. Har bir shablon shu sohadagi haqiqiy maketimizdan qilingan, lekin mijozga «shablon» so‘zini aytmaymiz.",
            "Avval bot tilni so‘raydi. Keyin mijoz sayt yoki Instagram manzilini yuboradi va sohani tugma bilan tanlaydi. Sayt yo‘qmi? U «Sayt yo‘q» tugmasini bosadi va to‘rtta savolga javob beradi. Bir-ikki daqiqada maket havolasi keladi.",
            "Saytdan bot nom, logotip, ranglar, xizmatlar, narxlar va manzilni oladi. Saytda yo‘q narsa maketda ham bo‘lmaydi. Soha ro‘yxatda yo‘qmi? Mijoz «Boshqa» tugmasini bosib, sohasini ikki so‘z bilan yozadi, bot esa eng yaqin maketni oladi.",
            "Maket bilan birga «📄 Tijorat taklifi» va «🛠 Admin panel» tugmalari keladi. Taklifda sayt narxi va qo‘shimchalar bor, narx 48 soat amal qiladi. Admin panel mijoz saytni qanday yuritishini ko‘rsatadi. Sohada admin panel bo‘lmasa, tugma ham bo‘lmaydi.",
            "Yig‘ish tekshiruvdan o‘tmadimi? Unda bot mijozga dizayner 12 soatda maket qilishini va’da qiladi. Mijoz ingliz, arab yoki polyak tilini tanlab, sohasi stomatologiya, tibbiyot markazi yoki restoran bo‘lmasa ham shunday bo‘ladi. Sizga «🔥 Нужен макет вручную» sarlavhali lid (mijoz arizasi) keladi.",
            "Bunday lidni olgan xodim maketni yig‘adi va lid kartasidan «Mijozga studiya botidan» kanali orqali yuboradi. 12 soatga ulguring: mijozga bu allaqachon va’da qilingan.",
            "Botdagi tayyor maket bu ro‘yxatda o‘zi paydo bo‘ladi va boshqa maketlarimiz kabi ishlaydi. Mijoz «botdagi maket» manbali lid bo‘lib keladi. Bitta Telegram akkauntga bitta maket beriladi, ikkinchi safar bot tayyor maket havolasini yuboradi.",
            "Xodimlarga cheklov yo‘q. Botga /maket deb yozing va o‘z mijozingiz uchun maket yig‘ing. Sizning maketingiz lid bo‘lmaydi.",
            "Xuddi shuni sayt bosh sahifasida, «Maketni yig‘ish» oynasida qilish mumkin. Bunday maketda «saytda yig‘ilgan» belgisi bor. Lid faqat odam maket ostida Telegram yoki telefonini o‘zi qoldirsa keladi.",
            "Saytda ham xodimga cheklov yo‘q, agar shu brauzerda panelga kirgan bo‘lsangiz. Tayyor maket ostida sizda «Qaytadan yig‘ish» tugmasi bor, mijozlarda u yo‘q. Paneldan «Chiqish» qilsangiz, sayt sizni yana oddiy tashrif buyuruvchi deb hisoblaydi.",
          ],
        },
        {
          id: "shown",
          title: "«Maketni ko‘rsatdim» to‘g‘ridan-to‘g‘ri ro‘yxatda",
          body: [
            "Maketni mijozga ko‘rsatdingizmi? Buni belgilang. «Kimga yuborilgan» blokida **«Maketni ko‘rsatdim»** tugmasini bosing va «video orqali» yoki «yuzma-yuz»ni tanlang. Belgi darhol [sotuv bosqichlari](/admin/stages)ga va normaga o‘tadi: haftasiga 2 ta ko‘rsatish.",
            "O‘z mijozingizga ko‘rsatishni belgilay olasiz, rahbar va egasi istalganini belgilaydi. Tugma bo‘lmasa, yuborish lid bilan bog‘lanmagan. Unda ko‘rsatishni [lid kartasida](#leads-sales-marks) belgilang.",
          ],
        },
        {
          id: "owner",
          title: "Mas’ul va mijozga yuborish",
          body: {
            manager: [
              "Har bir maket ostida «Mas’ul» qatori bor. Bu maketni mijoz bilan olib boradigan xodim. Panel uni o‘zi topadi: kim tayinlangan, kim maketni [vazifa](#tasks-mockup-order) bilan buyurtma qilgan, lid kimniki, mijozga kim yozgan yoki maketni kim yig‘gan. Mas’ulni rahbar va egasi o‘zgartiradi.",
              "«mijozga 14.10 17:27 da yuborilgan» havola mijozga ish akkauntidan birinchi marta qachon ketganini ko‘rsatadi. Shaxsiy akkauntdan yuborganingizni bot ko‘rmaydi, maket «mijozga yuborilmagan» bo‘lib qoladi. Shuning uchun ish akkauntidan yuboring.",
              "«Kimga yuborilgan» blokida har bir yuborish alohida qator: mijoz, akkaunt va vaqt. Mijozning lidi bo‘lsa, ismi uning kartasiga olib boradi.",
            ],
            head: [
              "Har bir maket ostida «Mas’ul» qatori bor. Bu maketni mijoz bilan olib boradigan xodim. Panel uni o‘zi topadi: kim tayinlangan, kim maketni [vazifa](#tasks-mockup-order) bilan buyurtma qilgan, lid kimniki, mijozga kim yozgan yoki maketni kim yig‘gan.",
              "Mas’ulni siz va egasi o‘zgartira olasiz: ro‘yxatdan xodimni tanlang. Ro‘yxatdagi birinchi band tayinlashni olib tashlaydi. Maket [parol bilan yopilganda](#mockups-auto-close) bot mas’ulga yozadi.",
              "«mijozga 14.10 17:27 da yuborilgan» havola mijozga ish akkauntidan birinchi marta qachon ketganini ko‘rsatadi. Shaxsiy akkauntdan yuborilganini bot ko‘rmaydi, maket «mijozga yuborilmagan» bo‘lib qoladi. «Kimga yuborilgan» blokida har bir yuborish alohida qator: mijoz, akkaunt va vaqt.",
            ],
            admin: [
              "Har bir maket ostida «Mas’ul» qatori bor. Bu maketni mijoz bilan olib boradigan xodim. Panel uni o‘zi topadi: kim tayinlangan, kim maketni [vazifa](#tasks-mockup-order) bilan buyurtma qilgan, lid kimniki, mijozga kim yozgan yoki maketni kim yig‘gan.",
              "Mas’ulni siz va rahbar o‘zgartira olasiz: ro‘yxatdan xodimni tanlang. Ro‘yxatdagi birinchi band tayinlashni olib tashlaydi. Maket [parol bilan yopilganda](#mockups-auto-close) bot mas’ulga yozadi.",
              "«mijozga 14.10 17:27 da yuborilgan» havola mijozga ish akkauntidan birinchi marta qachon ketganini ko‘rsatadi. Shaxsiy akkauntdan yuborilganini bot ko‘rmaydi, maket «mijozga yuborilmagan» bo‘lib qoladi. «Kimga yuborilgan» blokida har bir yuborish alohida qator: mijoz, akkaunt va vaqt.",
            ],
          },
        },
        {
          id: "password",
          title: "Bir sutkalik parol",
          body: [
            "**«Parol yaratish»** besh raqamli parol beradi. U 24 soat ishlaydi. Keyin mijoz yana parol maydonini ko‘radi.",
            "Har bir bosish yangi parol beradi, eskilari o‘z vaqtigacha ishlayveradi. Shuning uchun har bir mijozga alohida parol bergan ma’qul. Parol bir marta ko‘rsatiladi: yo‘qotsangiz, yangisini bering.",
            "**«Mijoz uchun nusxalash»** maket tilidagi tayyor matnni nusxalaydi: havola, parol, muddat va shartlar havolasi. Uni darhol yuborish mumkin. **«Parolni nusxalash»** faqat raqamlarni nusxalaydi.",
            "Ba’zi maketlarni studiya sayti keyslarda ko‘rsatadi. Sayt mehmoni ularni keys sahifasidagi tugma orqali parolsiz ochadi. Mijozga to‘g‘ridan-to‘g‘ri havola bo‘yicha baribir parol kerak.",
          ],
        },
        {
          id: "offer",
          title: "Maketdan keyin 48 soatlik aksiya",
          body: {
            manager: [
              "Maket havolasi mijozga ish akkauntidan ketdi, va unda 48 soatlik maxsus shartlar boshlanadi. Maket bo‘yicha lending 1 700 $ o‘rniga 500 $, korporativ sayt 2 500 $ o‘rniga 1 000 $ turadi. 3 daqiqadan keyin bot mijozga shartlarni o‘zi yozadi.",
              "Ba’zi maketlarning o‘z aksiya narxi bor, u maketning o‘zida yozilgan. Unda ro‘yxatda «48 soatlik aksiya: … $ (odatda … $)» turadi va bot mijozga faqat shu narxni aytadi.",
              "Har kuni soat 13:00 da bot mijozga qancha qolganini eslatadi, oxiriga 2 soat qolganda yana bir marta. Kechasi mijozga yozmaydi. Muddat tugadi, narxlar yana odatdagidek: mijozga shunday ayting.",
              "Mijozga namuna sifatida boshqa birovning loyihasini yubordingizmi? Aksiya bo‘lmaydi: bu uning maketi emas. Shaxsiy akkauntdan ketgan havolani bot ko‘rmaydi, unda mijoz na shartlarni, na eslatmalarni oladi.",
            ],
            head: [
              "Maket havolasi mijozga ish akkauntidan ketdi, va unda 48 soatlik maxsus shartlar boshlanadi. Maket bo‘yicha lending 1 700 $ o‘rniga 500 $, korporativ sayt 2 500 $ o‘rniga 1 000 $ turadi. 3 daqiqadan keyin bot mijozga shartlarni o‘zi yozadi.",
              "Ba’zi maketlarning o‘z aksiya narxi bor, u maketning o‘zida yozilgan. Unda ro‘yxatda «48 soatlik aksiya: … $ (odatda … $)» turadi va bot mijozga faqat shu narxni aytadi.",
              "Har kuni soat 13:00 da bot mijozga qancha qolganini eslatadi, oxiriga 2 soat qolganda yana bir marta. Kechasi mijozga yozmaydi. Eslatmalardagi narx va muddatni bot o‘zi tekshiradi, ortiqcha va’dalar bo‘lmaydi.",
              "Mijozga namuna sifatida boshqa birovning loyihasini yubordingizmi? Aksiya bo‘lmaydi: bu uning maketi emas. Shaxsiy akkauntdan ketgan havolani bot ko‘rmaydi, unda mijoz na shartlarni, na eslatmalarni oladi.",
              "Mijozga shartlar ketganda bot sizga va egasiga maket kartasini yuboradi. Soat 13:00 da «🎨 Макеты клиентов» ro‘yxati keladi. Shu ro‘yxatni botda /mockups buyrug‘i bilan ham ochish mumkin.",
              "Karta ostida ikkita tugma bor. «🔒 Закрыть паролем» bir sutkalik parol va mijoz uchun matn beradi. «✅ Утверждён → Егору» eslatmalarni to‘xtatadi va maket bo‘yicha sayt qilish vazifasini qo‘yadi.",
            ],
            admin: [
              "Maket havolasi mijozga ish akkauntidan ketdi, va unda 48 soatlik maxsus shartlar boshlanadi. Maket bo‘yicha lending 1 700 $ o‘rniga 500 $, korporativ sayt 2 500 $ o‘rniga 1 000 $ turadi. 3 daqiqadan keyin bot mijozga shartlarni o‘zi yozadi.",
              "Ba’zi maketlarning o‘z aksiya narxi bor, u maketning o‘zida yozilgan. Unda ro‘yxatda «48 soatlik aksiya: … $ (odatda … $)» turadi va bot mijozga faqat shu narxni aytadi.",
              "Har kuni soat 13:00 da bot mijozga qancha qolganini eslatadi, oxiriga 2 soat qolganda yana bir marta. Kechasi mijozga yozmaydi. Eslatmalardagi narx va muddatni bot o‘zi tekshiradi, ortiqcha va’dalar bo‘lmaydi.",
              "Mijozga namuna sifatida boshqa birovning loyihasini yubordingizmi? Aksiya bo‘lmaydi: bu uning maketi emas. Shaxsiy akkauntdan ketgan havolani bot ko‘rmaydi, unda mijoz na shartlarni, na eslatmalarni oladi.",
              "Mijozga shartlar ketganda bot sizga va rahbarga maket kartasini yuboradi. Soat 13:00 da «🎨 Макеты клиентов» ro‘yxati keladi. Shu ro‘yxatni botda /mockups buyrug‘i bilan ham ochish mumkin.",
              "Karta ostida ikkita tugma bor. «🔒 Закрыть паролем» bir sutkalik parol va mijoz uchun matn beradi. «✅ Утверждён → Егору» eslatmalarni to‘xtatadi va maket bo‘yicha sayt qilish vazifasini qo‘yadi.",
            ],
          },
        },
        {
          id: "scan",
          title: "Maketlar skani: e’tibordan chetda qolganlari",
          body: {
            manager: [
              "Kuniga ikki marta, 09:00 va 15:00 da, bot ish akkauntlari yozishmalaridan 14 kunlik maket havolalarimizni qidiradi. Havola mijozga ketgan-u, ro‘yxatda yo‘q bo‘lsa, bot uni qo‘shadi.",
              "Eski havola bo‘yicha bot mijozga yozmaydi. Havola 3 soatdan oldin ketganmi? Shartlar va eslatmalar bo‘lmaydi, mijozga o‘zingiz ayting. Shaxsiy akkauntdan yuborilganini skan ham ko‘rmaydi.",
            ],
            head: [
              "Kuniga ikki marta, 09:00 va 15:00 da, bot ish akkauntlari yozishmalaridan 14 kunlik maket havolalarimizni qidiradi. Havola mijozga ketgan-u, ro‘yxatda yo‘q bo‘lsa, bot uni qo‘shadi.",
              "Eski havola bo‘yicha bot mijozga yozmaydi. Havola 3 soatdan oldin ketganmi? Shartlar va eslatmalar bo‘lmaydi, sizga esa «🔎 Макет найден сканом» kartasi keladi. 48 soatdan oldin ketganmi? Aksiya allaqachon tugagan.",
              "Skan biror narsa topsa, sizga va egasiga «🔎 Скан макетов» qatori keladi. Hech narsa topmasa, bot jim turadi.",
            ],
            admin: [
              "Kuniga ikki marta, 09:00 va 15:00 da, bot ish akkauntlari yozishmalaridan 14 kunlik maket havolalarimizni qidiradi. Havola mijozga ketgan-u, ro‘yxatda yo‘q bo‘lsa, bot uni qo‘shadi.",
              "Eski havola bo‘yicha bot mijozga yozmaydi. Havola 3 soatdan oldin ketganmi? Shartlar va eslatmalar bo‘lmaydi, sizga esa «🔎 Макет найден сканом» kartasi keladi. 48 soatdan oldin ketganmi? Aksiya allaqachon tugagan.",
              "Skan biror narsa topsa, sizga va rahbarga «🔎 Скан макетов» qatori keladi. Hech narsa topmasa, bot jim turadi.",
            ],
          },
        },
        {
          id: "closed",
          title: "«havola orqali ochiq» va «parol bilan»",
          body: {
            manager: [
              "«havola orqali ochiq» maketni havolasi bor har kim ochadi degani. Birinchi parol uni yopadi. Shundan keyin parol hammaga kerak, havolani oldinroq olganlarga ham.",
              "«parol bilan» maket allaqachon yopilgan degani. Uni paneldan yana parolsiz ochib bo‘lmaydi. Kerak bo‘lsa, egasiga ayting.",
            ],
            head: [
              "«havola orqali ochiq» maketni havolasi bor har kim ochadi degani. Birinchi parol uni yopadi. Shundan keyin parol hammaga kerak, havolani oldinroq olganlarga ham.",
              "«parol bilan» maket allaqachon yopilgan degani. Uni paneldan yana parolsiz ochib bo‘lmaydi. Kerak bo‘lsa, egasiga ayting.",
            ],
            admin: [
              "«havola orqali ochiq» maketni havolasi bor har kim ochadi degani. Birinchi parol uni yopadi. Shundan keyin parol hammaga kerak, havolani oldinroq olganlarga ham.",
              "«parol bilan» maket allaqachon yopilgan degani. Maketdagi doimiy parolingiz bir sutkalik parollar bilan birga ishlaydi. Maketni yana parolsiz ochadigan tugma panelda yo‘q: buni dasturchi qiladi.",
            ],
          },
        },
        {
          id: "auto-close",
          title: "24 soat havola orqali, keyin parol bilan",
          body: [
            "Har bir maket 24 soat havola orqali ochiq, keyin o‘zi yopiladi. Vaqt mijozga birinchi yuborilgan paytdan hisoblanadi. Yuborish bo‘lmagan bo‘lsa, mijoz birinchi ochgan paytdan.",
            "Maket qatorida qancha qolgani ko‘rinadi: «yana 5 soat ochiq, keyin parol bilan». Yopilgandan keyin u yerda «… dan parol bilan yopiq: 24 soat o‘tdi» deb yoziladi. Egasi ochiq tursin degan maketlar va vitrina loyihalari o‘zi yopilmaydi.",
            "Maket yopilganda [mas’ulga](#mockups-owner) «🔑 Сгенерировать пароль» tugmasi bilan xabar keladi. Uni bosing, bot bir sutkalik parol va mijoz uchun tayyor matn yuboradi.",
          ],
        },
        {
          id: "open",
          title: "O‘zingiz ochish",
          body: [
            "**«Ochish»** maketni yangi oynada ochadi. devuz.studio’dagi prototip sizda yopiq bo‘lsa ham parolsiz ochiladi. Bu mijoz ochgani deb hisoblanmaydi.",
            "Yopiq vitrina loyihasi kod so‘raydi. Shu yerda berilgan bir sutkalik parol mos keladi.",
            "**«Havolani nusxalash»** havolani parolsiz nusxalaydi. Maket yopiq bo‘lsa, mijozga «Mijoz uchun nusxalash» matnini yuboring: unda parol ham bor.",
          ],
        },
      ],
    },

    /* ── Кандидаты ────────────────────────────────────────────────────── */
    "/admin/candidates": {
      what: "Bu yerda suhbatdan oldin rezyume tahlil qilinadi. Siz PDF yuklaysiz, panel odamni olish kerakmi va undan nima so‘rash kerakligini yozadi. Bo‘limni faqat rahbar va egasi ko‘radi, chunki unda boshqalarning shaxsiy ma’lumotlari bor.",
      items: [
        {
          id: "upload",
          title: "Rezyume yuklash",
          body: [
            "«Qaysi ishga qarayapmiz» maydoniga vakansiyani yozing. «PDF formatidagi rezyume» da faylni tanlang va **«Tahlil qilish»** ni bosing. Tahlil bir daqiqagacha davom etadi.",
            "Matnini nusxalab olish mumkin bo‘lgan PDF kerak, 8 MB gacha. Birinchi 12 sahifa o‘qiladi. Skan yoki rasm o‘qilmaydi, panel buni aytadi.",
          ],
        },
        {
          id: "result",
          title: "Tahlilda nima bor",
          body: [
            "Yuqorida xulosa: «olish», «shart bilan olish» yoki «olmaslik», va nima uchun. Pastda «Kuchli tomonlar», «To‘siqlar» (nimasi tashvishlantiradi), «Rezyumeda to‘g‘ridan-to‘g‘ri nima yozilgan» va «Suhbatda so‘rash». Oxirida «Ishda qanday tekshirish»: bir kunlik pullik sinov uchun topshiriq.",
            "Tahlil suhbatga tayyorlanishga yordam beradi. Qarorni siz qabul qilasiz.",
          ],
        },
        {
          id: "privacy",
          title: "Shaxsiy ma’lumotlar",
          body: [
            "Faylning o‘zi saqlanmaydi. Ism, lavozim, xulosa va tahlil qoladi. «Tahlilni olib tashlash» tugmasi uni butunlay o‘chiradi.",
            "Yosh, jins, oilaviy holat, millat, din, tashqi ko‘rinish va tug‘ilgan joy baholashda qatnashmaydi. Agar tahlil baribir ularga tayangan bo‘lsa, u saqlanmaydi. Panel yana bir bor urinib ko‘rishni so‘raydi.",
            "Har bir tahlil va har bir o‘chirish jurnalga yoziladi.",
          ],
        },
      ],
    },

    /* ── Проекты ──────────────────────────────────────────────────────── */
    "/admin/projects": {
      what: "Loyiha deb mijoz bilan kelishib olingan ishni aytamiz. Summasi bor loyiha bo‘lmasa, bitim uchun hech kim pul olmaydi.",
      items: [
        {
          id: "tasks",
          title: "Loyiha bo‘yicha vazifalar",
          body: [
            "Loyiha kartochkasida «Loyiha bo‘yicha vazifalar» bloki bor. Unda loyihaning barcha vazifalari: kim qo‘ygan, kimga va qaysi muddatgacha. Vazifalar haqida batafsil [vazifalar](#tasks-board) bandida.",
            "O‘ngdagi **«Vazifa qo‘yish»** tugmasi loyiha allaqachon tanlangan formani ochadi.",
          ],
        },
        {
          id: "create",
          title: "Loyiha ochish",
          body: {
            manager: [
              "Mijoz ishlashga rozi bo‘ldimi? Loyiha oching. «Yangi loyiha» blokida nomi, mijoz, summa va muddatni yozing va «Yaratish» tugmasini bosing.",
              "Loyihani uni ochgan xodim olib boradi va bitim puli unga tushadi. Olib boruvchini faqat egasi almashtira oladi. Shuning uchun loyihangizni o‘zingiz oching.",
              "Muddat o‘tdimi? Ro‘yxatda «muddati o‘tgan» belgisi chiqadi. «yopilganlarini ko‘rsatish» tugmasi tugagan va bekor qilingan loyihalarni ko‘rsatadi.",
            ],
            head: [
              "Loyihani uni ochgan xodim olib boradi va bitim puli unga tushadi. Siz jamoangiz loyihalaridan 5% olasiz.",
              "Menejerlar loyihalarini o‘zlari ochishini kuzating. Olib boruvchini faqat egasi almashtira oladi.",
            ],
            admin: [
              "Loyihani ochgan xodim o‘zi olib boruvchi bo‘ladi. Siz ochsangiz, kim olib borishini tanlang: bitim puli unga tushadi.",
              "O‘zingizni tanlasangiz, jamoa bu loyihadan hech narsa olmaydi. Olib boruvchini [«Loyiha ma’lumotlari»](#projects-data) blokidagi «Olib boradi» maydonida almashtirish mumkin.",
            ],
          },
        },
        {
          id: "stages",
          title: "Bosqichlar",
          body: [
            "Bosqichlar tartib bilan: «brif», «shartnoma», «dizayn», «ishlab chiqish», «qabul qilish», «ishga tushirish», «qo‘llab-quvvatlash». Yana «pauzada», «yopilgan» va «bekor qilingan» bor.",
            "Bosqichni faqat egasi o‘zgartiradi, chunki bu mijozga berilgan va’da. Har bir o‘zgarish jurnalga yoziladi.",
            "Pulga faqat «bekor qilingan» ta’sir qiladi: bunday loyihadan hech kim hech narsa olmaydi.",
          ],
        },
        {
          id: "card",
          title: "Loyiha kartochkasi",
          body: {
            manager: [
              "«Smeta» blokida toifa va muddatni haftalarda tanlang. Panel chegarani hisoblaydi: undan past summada loyiha o‘zini oqlamaydi. Undan pastga faqat egasi tusha oladi.",
              "«Pul» blokida «Bitim turi»ni tanlang: «yangi mijoz» yoki «qo‘shimcha sotuv». Foizingiz shunga bog‘liq. «Shartnoma summasi, $»ni butun dollarda yozing. Birinchi to‘lovdan keyin summani faqat egasi o‘zgartiradi.",
              "Soliq, tannarx va mijoz to‘lovlarini egasi yozadi. Mijoz hammasini to‘lamaguncha, loyiha bo‘yicha pulingiz muzlatilgan turadi.",
              "«Shartnoma» blokida shartnoma raqami, holati va summasi ko‘rinadi. Shartnoma bo‘lmasa, u yerda uni tayyorlash formasi turadi. Batafsil [«Shartnomalar»](/admin/contracts) bo‘limida.",
            ],
            head: [
              "Siz istalgan loyiha kartochkasini ko‘rasiz, pulni esa faqat o‘z loyihalaringiz va jamoa loyihalari bo‘yicha.",
              "Smeta va summani olib boruvchi va egasi o‘zgartiradi. Jamoa loyihalarida siz ularni faqat ko‘rasiz.",
              "Hisoblanmalarda sizning «rahbar» qatoringiz bor, jamoa loyihasidan 5%. Hammuassisda u nolga teng: u baribir butun foydadan ulush oladi.",
            ],
            admin: [
              "Siz hamma narsani istalgan vaqtda o‘zgartirasiz. «Soliq, %» va «Ishlab chiqish tannarxi, $»ni faqat siz yozasiz. Shunda hech kim o‘ziga hisoblanmani oshira olmaydi.",
              "Hisoblanma qatorida «belgilash» bu bitim uchun o‘z foizingizni qo‘yadi, «daraja bo‘yicha» esa xodim darajasidagi foizni qaytaradi. «Hamkor» blokida mijozni kim olib kelganini tanlang.",
              "Mijoz to‘lovini «To‘lovni yozish» tugmasi bilan yozing. Shartnoma hisob-fakturasi bo‘yicha to‘lov siz tasdiqlagandan keyin o‘zi yoziladi.",
              "Egasining aniq ulushi, hamkor ulushi ayirilgan holda, [«Moliya»](/admin/finance) bo‘limida ko‘rinadi.",
            ],
          },
        },
        {
          id: "data",
          title: "«Loyiha ma’lumotlari»",
          body: [
            "Nomi, mijoz, muddat va izohlarni olib boruvchi, uning rahbari va egasi o‘zgartiradi.",
            "Olib boruvchini faqat egasi «Olib boradi» maydonida almashtiradi. Summa «Pul» blokida o‘zgartiriladi.",
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
      what: "Bu yerda devuz.studio saytiga qancha odam kirishi va ular qayerdan kelishi ko‘rinadi. Raqamlar Yandex Metrika va Google Analytics’dan olinadi. Arizalar saytdan keladi: kirishlar kamaysa, bir-ikki haftadan keyin arizalar ham kamayadi. Bo‘limni egasi va rahbar ko‘radi.",
      items: [
        {
          id: "numbers",
          title: "Raqamlar nimani bildiradi",
          body: [
            "O‘ng tepada davrni tanlang: «7 kun», «30 kun» yoki «90 kun». Raqam yonidagi strelka uni oldingi xuddi shunday davr bilan solishtiradi. Yashil strelka yaxshiroq, sariq yomonroq, «yangi» esa oldin nol bo‘lganini bildiradi.",
            "«tashriflar» saytga necha marta kirilganini ko‘rsatadi. Bir odam ertalab va kechqurun kirsa, ikki tashrif bo‘ladi. «tashrif buyuruvchilar» turli odamlarni, aniqrog‘i turli brauzerlarni sanaydi. «ko‘rishlar» ochilgan barcha sahifalarni sanaydi.",
            "«rad etishlar» odam bitta sahifani ochib, darhol chiqib ketgan tashriflar ulushini ko‘rsatadi. Bu yerda o‘sish yomon, strelka sariq bo‘ladi. «o‘rtacha tashrif» tashrif o‘rtacha qancha davom etishini ko‘rsatadi.",
            "Pastda «Kunlar bo‘yicha tashriflar», «Qayerdan keladi» va «Kirish sahifalari» bor. Google’da manbalar inglizcha: «Organic Search» qidiruv, «Direct» to‘g‘ridan-to‘g‘ri kirish, «Referral» boshqa saytlardan o‘tish. Raqamlar har 10 daqiqada yangilanadi.",
          ],
        },
        {
          id: "two-sources",
          title: "Nega Metrika va Google har xil ko‘rsatadi",
          body: [
            "Metrika va Google tashriflarni o‘zicha sanaydi, shuning uchun raqamlar mos kelmaydi. Bu normal, ularni qo‘shish shart emas. Ikkalasi qayoqqa ketayotganiga qarang: birga o‘ssa, odamlar haqiqatan ko‘paygan.",
            "Saytga kirish hali mijoz emas. Necha kishi yozganini [«Statistika»](/admin/stats) bo‘limida ko‘ring. Kirish ko‘p, ariza yo‘qmi? Demak, odamlar saytda izlagan narsasini topmayapti.",
          ],
        },
        {
          id: "connect",
          title: "Qanday ulanadi",
          body: {
            head: [
              "Metrika va Google’ni egasi ulaydi. Sizda bu yerda faqat raqamlar bor, ulanishni bu yerdan buzib bo‘lmaydi.",
              "«Ulanmagan» yoki Google kiritmay qo‘ygani yozilganmi? Egasiga ayting, unga bir daqiqa kerak. «Javob bermadi» odatda o‘zi o‘tadi: sahifani bir daqiqadan keyin yangilang.",
            ],
            admin: [
              "Metrika Yandex tokeni bilan ulanadi. Ulanmaguncha qadamlar «Yandex Metrika» kartasining o‘zida yozilgan. Tokenni server sozlamalariga yoki maxfiy kalitlar omboriga qo‘yiladi.",
              "Google Analytics Google akkauntingiz orqali kirish bilan ulanadi. Bir marta kartadagi qadamlar bo‘yicha Google Cloud’da ilova yarating, Client ID va Client secret’ni qo‘ying va «Saqlash va Google orqali kirish» tugmasini bosing. «See and download your Google Analytics data» belgisini olib tashlamang: panel raqamlarni faqat o‘qiydi.",
              "Google kiritmay qo‘ydimi? «Google orqali kirish» tugmasini bosing. Ko‘pincha Google Cloud’dagi ilova «Testing» rejimida qolgan, u yerda kirish 7 kun yashaydi: «Publish app» tugmasini bosing. Akkauntni raqamlar ostidagi «qayta kirish» havolasi bilan almashtirish mumkin.",
            ],
          },
        },
      ],
    },

    /* ── Reklama ──────────────────────────────────────────────────────── */
    "/admin/outside": {
      what: "Bu yerda vc.ru, Dzen va Tenchat uchun studiya haqidagi maqolalar qoralamalari. Haftada bir marta dastur har bir platformaga bittadan yozadi. Siz uni studiya akkauntidan e’lon qilasiz va havolani bu yerga qo‘yasiz. Shunda Rossiya va MDHdagi biznes egalari bizni biladi, sayt esa havolalar oladi.",
      items: [
        {
          id: "how",
          title: "Qanday ishlaydi",
          body: [
            "Haftada bir marta, Toshkent vaqti bilan kunduzi, har bir platforma qoralama oladi. Mavzu Rossiyada nimani qidirishiga qarab tanlanadi. Faktlar saytdagi keyslarimizdan olinadi.",
            "Bu yerga tushishdan oldin qoralama tekshiruvdan o‘tadi. Unda narxlar, foizlar va o‘ylab topilgan raqamlar yo‘q, havolalar faqat bizning saytga olib boradi. To‘rt urinishda o‘tmadimi? Qoralama bo‘lmaydi, egasi va rahbarga hisobotda qator keladi.",
            "Platforma yangi qoralamani oldingisi e’lon qilingan yoki o‘tkazib yuborilganda oladi. E’lonni odam qiladi. Akkauntga o‘zi kiradigan robot platformalar qoidalarini buzadi va akkaunt bloklanadi.",
          ],
        },
        {
          id: "publish",
          title: "Qanday e’lon qilish",
          body: [
            "«E’lon qilinishini kutmoqda» blokida qoralama yonida tugmalar bor. «Sarlavhadan nusxa olish» va «Nusxa olish» matnni buferga qo‘yadi. Qiyshiq qo‘yildimi? «Bezaksiz nusxa olish» tugmasini bosing.",
            "«vc.runi ochish» tugmasi (yoki boshqa platformaniki) uni yangi oynada ochadi. Studiya akkauntiga kiring, sarlavha va matnni qo‘ying, rasm qo‘shing va e’lon qiling. Qoralamani oldindan «Matnni ko‘rsatish» tugmasi bilan o‘qish mumkin.",
            "Chiqqan maqola manzilidan nusxa oling, uni «E’lon qilingan maqola havolasi» maydoniga qo‘ying va «E’lon qildim» tugmasini bosing. Qoralama mos emasmi? «O‘tkazib yuborish» tugmasini bosing, bir haftadan keyin yangisi keladi.",
          ],
        },
        {
          id: "links",
          title: "E’lon qilinganlar va havolani tekshirish",
          body: [
            "«E’lon qilinganlar» blokida chiqqan maqolalar turadi. «E’lon qildim»dan 10 daqiqa keyin va keyin haftada bir marta panel maqolani o‘zi ochib, saytimizga havolani qidiradi. Bo‘lim tepasida 30 kunda nechta maqola chiqqani ko‘rinadi.",
            "Maqola ostida natija yoziladi. Qidiruvda vazn beradigan havola saytga Google va Yandex’da yordam beradi. nofollow belgisi vazn yo‘qligini bildiradi, lekin odamlar havoladan o‘tadi. Havola topilmadi yoki sahifa ochilmadimi? Maqola o‘chirilgan yoki kirish ortiga yashirilgan bo‘lishi mumkin.",
          ],
        },
        {
          id: "auto",
          title: "O‘zi e’lon qilinadi: Telegraph, VKontakte, Telegram-kanal",
          roles: ["admin", "head"],
          body: [
            "«O‘zi e’lon qilinadi» blokida maqola odamsiz chiqadigan platformalar. Qoralama xuddi shu tekshiruvdan o‘tadi va darhol «E’lon qilinganlar»da paydo bo‘ladi. Chiqmadimi? U sababi bilan «E’lon qilinishini kutmoqda»ga qaytadi va qo‘lda e’lon qilinadi.",
            "Telegraph hech narsa talab qilmaydi. Studiya akkaunti u yerda birinchi maqola bilan o‘zi ochiladi.",
            "VKontakte va Telegram-kanal Postiz xizmati orqali ishlaydi. Bir marta u yerda ro‘yxatdan o‘ting, kanallarni «Add Channel» tugmasi bilan ulang va kalitni Settings → Developers → Public API’dan oling. Uni «Postiz API kaliti» maydoniga qo‘ying va «Saqlash va tekshirish» tugmasini bosing: kalit faqat Postiz qabul qilsa saqlanadi.",
          ],
        },
        {
          id: "publisher",
          title: "Kim e’lon qiladi",
          roles: ["admin", "head"],
          body: [
            "«Kim e’lon qiladi» blokida bot tayyor qoralamalar haqidagi kartochkani kimga yuborishini tanlang. Hech kim tanlanmaganmi? Kartochka egasi va rahbarga keladi.",
            "Ro‘yxatda bu bo‘lim ochiq bo‘lganlar bor. Menejerga uni egasi [«Jamoa»](/admin/team) → «Bo‘limlar» belgisi bilan ochadi. Platformalar loginlari panelga kiritilmaydi, ular e’lon qiladigan odamda turadi.",
          ],
        },
      ],
    },
    "/admin/ads": {
      what: "Bu Google Ads va Yandex Direct’dagi reklama avtopiloti, agentliklar va marketologlar uchun. Kuniga bir marta u reklama kabinetining hisobotlarini ko‘rib, sababi va raqamlari bilan o‘zgarishlar taklif qiladi. Odam «Qabul qilish»ni bosmaguncha o‘zi hech narsani o‘zgartirmaydi. Bo‘limni egasi va rahbar ko‘radi.",
      items: [
        {
          id: "what",
          title: "Avtopilot nima qiladi",
          body: [
            "**Minus-so‘zlar.** Avtopilot pul ketgan, lekin ariza bo‘lmagan so‘rovlardagi so‘zlarni qidiradi: «bepul», «yuklab olish», «vakansiya». Bunday so‘zlarni taqiqlashni taklif qiladi. Kampaniya kalit so‘zlaridagi so‘zlarga tegmaydi.",
            "**Byudjet.** Pul arizasi qimmat kampaniyadan arizasi arzon kampaniyaga o‘tadi, agar u o‘z byudjetiga taqalib qolayotgan bo‘lsa. Taklif faqat farq deyarli aniq haqiqiy bo‘lganda chiqadi. Umumiy byudjet o‘zgarmaydi.",
            "**E’lonlar testi.** Guruhda bitta e’lon bo‘lsa, avtopilot ikkinchisini yozadi. 10-45 kundan keyin ko‘proq ariza beradigani qoladi, ikkinchisi pauzaga qo‘yiladi.",
            "Kalit so‘zlar stavkalariga avtopilot tegmaydi. Ularni Google va Yandex’ning o‘zi boshqaradi.",
          ],
        },
        {
          id: "setup",
          title: "Agentlik kabinetini qanday ochish",
          body: [
            "Chapda kabinetlar ro‘yxati. «Yangi kabinet» tugmasini bosing, nomini yozing, kimligini va tilni tanlang. Keyin «Yaratish» tugmasini bosing.",
            "«Odamlar» blokida agentlik xodimlarini qo‘shing: Telegram id, ism va «Qo‘shish» tugmasi. Ular devuz.studio/ads’ga studiya boti orqali kiradi va bildirishnomalar oladi. Odamni olib tashlasangiz, uning kirishi darhol ishlamay qoladi.",
            "«Reklama kabinetini qo‘shish» tugmasini bosing va platforma, nom hamda Direct’dagi login yoki Google akkaunt raqamini kiriting. Keyin «Ulash» tugmasini bosing: reklama egasi Yandex yoki Google sahifasida ruxsat beradi. Bir-ikki daqiqadan keyin birinchi takliflar chiqadi.",
          ],
        },
        {
          id: "proposals",
          title: "Takliflar: «Qabul qilish» va «Rad etish»",
          body: [
            "«Takliflar» blokida avtopilot 30 kunda topgan narsalar. «Qabul qilish» reklama kabinetini darhol o‘zgartiradi, «Rad etish» taklifni olib tashlaydi. Hal qilinmagan taklif 14 kundan keyin eskiradi.",
            "O‘zgartirishdan oldin avtopilot kabinetni yana bir bor ko‘radi. U yerda biror narsa qo‘lda o‘zgartirilgan bo‘lsa, o‘zgarish qo‘llanmaydi va ostida sababi yoziladi. Bu buzilish emas, himoya.",
            "«Hozir yangilash» hisobotlarni darhol oladi, odatda 1-2 daqiqada. Natija Telegram’ga ham keladi.",
          ],
        },
        {
          id: "limits",
          title: "Rejim, limitlar va stop-kran",
          body: [
            "«Rejim va limitlar» bloki. Avvaliga avtopilot faqat taklif qiladi, qarorni odam qabul qiladi. Ikkinchi rejim, «O‘zim, limitlar doirasida», takliflarni o‘zi qo‘llaydi va bu haqda Telegram’ga yozadi.",
            "Limitlar kampaniya byudjetini bir martada necha foizga surish mumkinligini (30 dan ko‘p emas) va avtopilot bir kunda o‘zi nechta o‘zgarish qilishini belgilaydi. U yerda minus qilib bo‘lmaydigan so‘zlar ham bor: brend, shahar, xizmat.",
            "Har qanday rejimda umumiy byudjet o‘smaydi, o‘chirish yo‘q, faqat pauza. «Stop-kran: barcha o‘zgarishlarni to‘xtatish» hammasini, hatto «Qabul qilish»ni ham to‘xtatadi. Qilinganini u yoqilganda ham qaytarish mumkin.",
          ],
        },
        {
          id: "journal",
          title: "Jurnal, qaytarish va hafta hisoboti",
          body: [
            "«Jurnal»da har bir o‘zgarish: qachon, kim, nima edi va nega. Avtopilot o‘zgarishlari «o‘zi» deb belgilangan. «Qaytarish» bir bosishda avvalgidek qiladi.",
            "«7 kun ichida» bloki nechta o‘zgarish qo‘llanganini va oyiga qancha pul endi keraksiz so‘rovlarga ketmasligini ko‘rsatadi. Dushanba kunlari 09:00 dan keyin kabinet odamlariga hafta hisoboti keladi. «Hafta hisobotini Telegram’ga yuborish» uni sizga hozir yuboradi.",
          ],
        },
        {
          id: "alerts",
          title: "Ogohlantirishlar",
          body: [
            "Kuniga bir marta avtopilot kechagi kunni oddiy kun bilan solishtiradi. Kampaniya hech narsa sarflamasa, xarajat yangi arizalarsiz ikki baravar o‘ssa, ariza umuman bo‘lmasa yoki platforma e’lonni rad etsa, ogohlantirish chiqadi. Odatiy xarajatda nol ariza ko‘pincha saytdagi forma buzilganini bildiradi.",
            "Ogohlantirish kabinet odamlariga Telegram’da bir marta keladi va tepada sariq «Ogohlantirishlar» blokida ko‘rinadi. Sabab yo‘qolsa, ogohlantirish o‘zi yo‘qoladi. Avtopilot ogohlantirish bo‘yicha hech narsani o‘zgartirmaydi.",
          ],
        },
        {
          id: "stub",
          title: "Namuna: reklama kabinetisiz sinov",
          body: [
            "«Namuna (sinov)» platformasi o‘ylab topilgan raqamlar bilan o‘quv kabineti. U yerda hammasi ishlaydi, lekin haqiqiy kabinetlar o‘zgarmaydi. Uni agentlikka ulanishdan oldin ko‘rsatish qulay.",
            "«7 kunni o‘tkazish» tugmasi faqat namunada bor. U bir hafta ko‘rsatishlar qo‘shadi, shunda e’lonlar testi tezroq natijaga yetadi.",
          ],
        },
        {
          id: "keys",
          title: "Kalitlar va yoqish",
          roles: ["admin"],
          body: [
            "Kundalik yangilanishlar serverdagi alohida sozlama bilan yoqiladi. Usiz faqat tugmalar ishlaydi.",
            "«Ulash» tugmasi uchun maxfiy kalitlar omborida Yandex Direct va Google Ads ilovalari kalitlari kerak. Mijozlar tokenlari shifrlangan holda saqlanadi. Shifrlash kaliti almashtirilsa, barcha kabinetlarni qaytadan ulashga to‘g‘ri keladi.",
          ],
        },
        {
          id: "google",
          title: "Google: kalitlar va kalit so‘zlar rejalashtiruvchisi",
          roles: ["admin", "head"],
          body: [
            "Google kalit so‘zlar rejalashtiruvchisi ibora oyiga necha marta qidirilishini ko‘rsatadi. Sayt va platformalar uchun maqola yozadigan dastur uning maslahatlarini Google Trends va Wordstat bilan birga oladi. Ulanmagan bo‘lsa, maqolalar usiz chiqadi.",
            "Egasi yoki rahbar bir marta ulaydi. Rejalashtiruvchi ishlamaguncha qadamlar «Google ilovasi kalitlari» blokida yozilgan. Client ID va secret’ni o‘sha yerga qo‘ying va «Saqlash» tugmasini bosing.",
            "Google rejalashtiruvchini Basic kirish darajasidagi loyihaga ochadi. Daraja pastroq bo‘lsa, «Tekshirish» tugmasi shuni aytadi.",
            "Keyin studiya kabinetini oching, 10 xonali raqamli Google reklama kabinetini qo‘shing va «Ulash» tugmasini bosing. «Kalit so‘zlar rejalashtiruvchisi» blokida uni tanlang va «Tekshirish» tugmasini bosing. «ishlayapti» javobi va tez-tez qidiriladigan so‘rovlar ro‘yxati hammasi tayyorligini bildiradi.",
          ],
        },
      ],
    },

    /* ── Договоры ─────────────────────────────────────────────────────── */
    "/admin/contracts": {
      what: "YaTTimizning mijoz bilan shartnomasi loyiha kartochkasida tayyorlanadi. Uni jamoadan istalgan kishi tayyorlay oladi, tasdiqlaydi esa faqat egasi. Shu paytda hujjatda uning imzosi paydo bo‘ladi.",
      items: [
        {
          id: "prepare",
          title: "Shartnomani tayyorlash",
          body: [
            "[Loyiha](/admin/projects)ni oching va «Shartnoma» blokini toping. [«Maketdan tarkib»](#contracts-compose) blokida maketni tanlang. Smeta, summa, predmet va muddat o‘zi qo‘yiladi.",
            "Mijoz rekvizitlarini «Rekvizitlarni qo‘yish» maydoniga qo‘ying va «Maydonlarga taqsimlash» tugmasini bosing. Sana va bosqichlarni yozing, bosqichlar ulushi jami 100% bo‘lsin. **«Shartnomani tayyorlash»** tugmasini bosing.",
            "Imzosiz qoralama chiqadi. Imzogacha nima yetishmasligi hujjat ustida ro‘yxat bilan yozilgan. Loyihada ikkinchi shartnoma paydo bo‘lmaydi: tugma birinchisini ochadi.",
          ],
        },
        {
          id: "compose",
          title: "«Maketdan tarkib» va «Rekvizitlarni qo‘yish»",
          body: [
            "Maketni tanlang, shunda maketda mijoz ko‘rgandek asos va narxli qo‘shimchalar chiqadi. ★ belgili qo‘shimchalar allaqachon belgilangan. Keraksizini olib tashlang.",
            "Narxi bilan uchtagacha o‘z qatoringizni qo‘shish mumkin. Narx 0 sovg‘a degani. Maket ro‘yxatda yo‘qmi? Smetani fayl bilan yuklang.",
            "«Rekvizitlarni qo‘yish»ga mijoz matnini qanday bo‘lsa shunday qo‘ying va «Maydonlarga taqsimlash» tugmasini bosing. Panel nomi, STIR, hisob raqami, MFO va bankni topadi. Maydonlarni ko‘z bilan tekshiring.",
          ],
        },
        {
          id: "to-sign",
          title: "«Imzolanadigan shartnomalar»",
          roles: ["admin"],
          body: [
            "Sahifada birinchi bo‘lib «Imzolanadigan shartnomalar» bloki turadi. Qatorni bosing, shartnoma ochiladi.",
            "Shartnomada ikki tugma bor: «Tasdiqlash va imzolash» va «Qayta ishlashga qaytarish».",
          ],
        },
        {
          id: "review",
          title: "Shartnoma sahifasi: smeta va imzoga yuborish",
          body: {
            manager: [
              "Qoralamada **«Smetani yuklash»** tugmasini bosing (Excel, CSV yoki matnli PDF) va **«Muddat»**ni ko‘rsating. Fayl o‘qilmadimi? **«Smeta qatorlarini qo‘lda kiritish»** tugmasini bosing: nomi, miqdori, narxi «;» bilan.",
              "**«Imzoga yuborish»** tugmasini bosing. Egasiga Telegramda xabar boradi, shartnoma esa endi o‘zgartirilmaydi.",
              "Egasi shartnomani tasdiqlaydi yoki qayta ishlashga qaytaradi. Mijoz imzolagach, skaner nusxasini **«Imzolanganini yuklash»** tugmasi bilan yuklang.",
            ],
            head: [
              "Siz menejer bilan bir xil ishlarni qilasiz. Shartnomani faqat egasi tasdiqlaydi va bekor qiladi.",
            ],
            admin: [
              "Imzoga shartnoma sizga Telegramda keladi va «Bosh sahifa»dagi «E’tibor talab qiladi» blokida ko‘rinadi. **«Tasdiqlash va imzolash»** yoki **«Qayta ishlashga qaytarish»** tugmasini bosing.",
              "Tasdiqlash imzongizni qo‘yadi va birinchi bosqich uchun darhol hisob-faktura chiqaradi. Tasdiqlangan shartnoma o‘zgartirilmaydi, tuzatish uchun yangisi tayyorlanadi.",
              "Shartnomani bekor qilish mumkin: «Bekor qilish sababi»ni yozing va «Bekor qilish» tugmasini bosing.",
            ],
          },
        },
        {
          id: "invoices",
          title: "Bosqichlar bo‘yicha hisob-fakturalar va buyurtmachi uchun havola",
          body: {
            manager: [
              "Har bir bosqichni mijoz oldindan to‘laydi. Birinchi bosqich hisob-fakturasi o‘zi chiqadi, keyingilarini **«Hisob-faktura berish»** tugmasi bilan chiqaring.",
              "Pul keldimi? **«To‘landi»** tugmasini bosing. Egasi to‘lovni tasdiqlagach, shu to‘lov bo‘yicha pulingiz muzdan chiqadi.",
              "**«Buyurtmachi uchun havola»** mijozga shartnoma va hisob-fakturalarni ochadi. Havola bir marta ko‘rinadi, uni darhol nusxalab oling.",
            ],
            head: [
              "Har bir bosqichni mijoz oldindan to‘laydi. Birinchi bosqich hisob-fakturasi o‘zi chiqadi, keyingilarini **«Hisob-faktura berish»** tugmasi bilan chiqaring.",
              "Pul keldimi? **«To‘landi»** tugmasini bosing. Egasi to‘lovni tasdiqlagach, shu to‘lov bo‘yicha jamoa puli muzdan chiqadi.",
              "**«Buyurtmachi uchun havola»** mijozga shartnoma va hisob-fakturalarni ochadi. Havola bir marta ko‘rinadi, uni darhol nusxalab oling.",
            ],
            admin: [
              "Har bir bosqichni mijoz oldindan to‘laydi. Birinchi bosqich hisob-fakturasi o‘zi chiqadi, keyingilarini **«Hisob-faktura berish»** tugmasi bilan chiqaring.",
              "Sizning «To‘landi» belgingiz to‘lovni darhol loyihaga yozadi. Xodim belgiladimi? **«To‘lovni tasdiqlash»** yoki **«To‘lov bo‘lmagan»** tugmasini bosing.",
              "**«Buyurtmachi uchun havola»** mijozga shartnoma va hisob-fakturalarni ochadi. Havola bir marta ko‘rinadi, uni darhol nusxalab oling.",
            ],
          },
        },
        {
          id: "signature",
          title: "Sizning imzoingiz",
          roles: ["admin"],
          body: [
            "«Imzo» blokida shaffof fonli PNG rasmni yuklang, 2 MB gacha. U barcha shartnomalar uchun bitta.",
            "Imzo faqat tasdiqlangan shartnomalar va ularning hisob-fakturalarida ko‘rinadi.",
          ],
        },
        {
          id: "protects",
          title: "Shartnoma nimani himoya qiladi",
          body: [
            "Nizolarni arbitraj hal qiladi. Olingan puldan ortiq javob bermaymiz, boy berilgan foydani qoplamaymiz.",
            "Bosqich topshirilgandan keyin mijoz 5 ish kuni jim turdimi? Bosqich qabul qilingan hisoblanadi. Kodga huquqlar mijozga to‘liq to‘lovdan keyin o‘tadi.",
            "Hujjatni yurist tekshirmagan. Murakkab holatni yuristga ko‘rsating.",
          ],
        },
      ],
    },

    /* ── Расходы ──────────────────────────────────────────────────────── */
    "/admin/expenses": {
      what: "Bu yerda studiyaning umumiy xarajatlari va har biridan har bir hammuassisga qancha to‘g‘ri kelishi. Yana ikki haftalik soliq muddatlari.",
      items: [
        {
          id: "split",
          title: "Xarajat qanday bo‘linadi",
          body: [
            "Xarajat hammuassislar ulushlari bo‘yicha bo‘linadi. Ulushlar 70 va 30 bo‘lsa, $100 lik reklama $70 va $30 ga bo‘linadi.",
            "Loyiha tannarxini bu yerga yozmang: u loyihaning o‘zida ayirilgan.",
          ],
        },
        {
          id: "add",
          title: "Yozish va o‘chirish",
          body: {
            head: [
              "«Xarajat qo‘shish» blokida sana, modda va summani to‘ldiring va «Yozish» tugmasini bosing.",
              "Xarajatlarni faqat egasi o‘chiradi. Xato qildingizmi? Unga ayting.",
            ],
            admin: [
              "«Xarajat qo‘shish» xarajatni yozadi, qatordagi «olib tashlash» uni o‘chiradi. Rahbar faqat yoza oladi.",
              "Shu xarajatlar [«Moliya»](/admin/finance) bo‘limida ham bor.",
            ],
          },
        },
        {
          id: "payer",
          title: "Kim to‘lagan",
          body: {
            head: [
              "«Kim to‘lagan» maydonidagi «Birgalikda» studiyaning umumiy pulidan to‘langanini bildiradi.",
              "Kimdir bitta o‘z pulidan to‘ladimi? Uni tanlang va «Saqlash» tugmasini bosing. Bu summa unga bo‘linishdan oldin qaytariladi.",
              "Har kim o‘z qismini to‘ladimi? Xarajatni ikki qator bilan yozing.",
            ],
            admin: [
              "«Kim to‘lagan» maydonidagi «Birgalikda» studiyaning umumiy pulidan to‘langanini bildiradi.",
              "Kimdir bitta o‘z pulidan to‘ladimi? Uni tanlang va «Saqlash» tugmasini bosing. Bu summa unga bo‘linishdan oldin qaytariladi, bu [«Moliya»](/admin/finance) bo‘limida ko‘rinadi.",
              "Har kim o‘z qismini to‘ladimi? Xarajatni ikki qator bilan yozing. Har bir o‘zgarish [«Jurnal»](/admin/audit) bo‘limiga yoziladi.",
            ],
          },
        },
        {
          id: "taxes",
          title: "Soliq muddatlari",
          body: [
            "«Soliqlar: muddati yaqinlashayotganlar» bloki 14 kun oldinga muddatlarni ko‘rsatadi. Muddatga 3 kun yoki kamroq qolsa, sana sariq bo‘ladi.",
            "Sanalar buxgalter tomonidan tasdiqlanmagan. Ularni buxgalter bilan solishtiring.",
          ],
        },
        {
          id: "no-profit",
          title: "Nega bu yerda foyda yo‘q",
          body: {
            head: [
              "Foyda va undan ulushlarni faqat egasi ko‘radi.",
            ],
            admin: [
              "Rahbar bu yerda faqat xarajatlarni ko‘radi. Foyda va ulushlar faqat sizga, [«Moliya»](/admin/finance) bo‘limida ko‘rinadi.",
            ],
          },
        },
      ],
    },

    /* ── Финансы ──────────────────────────────────────────────────────── */
    "/admin/finance": {
      what: "Bu yerda har kim bitimlardan qancha topgani, qanchasi mijoz to‘lovini kutayotgani va qanchasi to‘langani ko‘rinadi. Maosh yo‘q: har kim o‘z bitimlaridan foiz oladi.",
      items: [
        {
          id: "how",
          title: "Foiz qanday hisoblanadi",
          body: [
            "Foiz bitimning sof foydasidan hisoblanadi: shartnoma summasi minus soliq va tannarx. Soliq va tannarxni egasi yozadi.",
            "Yangi mijozdan menejer 10% oladi, o‘tgan oyda 3 ta bitim bo‘lsa, 15%. Qo‘shimcha sotuvdan (eski mijoz uchun yangi ish) 5%, kichik menejerda 0. Rahbar 30% oladi.",
            "Rahbar yana o‘z jamoasi bitimlaridan 5% oladi. Agentlik yoki hamkorni olib kelgan xodim 12 oy davomida uning loyihalari summasidan 5% oladi.",
            "Claudery buyurtmasi (botdagi sun’iy intellekt bo‘yicha yordam) uchun olib boruvchiga summadan 40%. Egasi istalgan bitimga o‘z foizini belgilashi mumkin.",
          ],
        },
        {
          id: "grade",
          title: "Bitimlar uchun daraja va «Bitimlar uchun mukofot»",
          body: [
            "Birinchi to‘lov kelgan loyiha bitim hisoblanadi, shu to‘lov oyida. Oyiga 3 ta bitim keyingi oyda 10% o‘rniga 15% beradi.",
            "Yana oyning har 3 ta bitimi uchun $200 mukofot bor. U «Bitimlar uchun mukofot» blokida ko‘rinadi va darhol «To‘lanadi»ga kiradi.",
          ],
        },
        {
          id: "freeze",
          title: "Muzlatilgan, ishlab topilgan, to‘lanadi",
          body: [
            "**«Muzlatilgan»** mijoz hali butun summani to‘lamaganini bildiradi. **«Ishlab topilgan»** mijoz hammasini to‘laganini bildiradi.",
            "**«To‘lanadi»** ishlab topilgan minus to‘langan pulga teng.",
            "Raqamlar sahifa har ochilganda qayta hisoblanadi.",
          ],
        },
        {
          id: "page",
          title: "Sahifada nima bor",
          body: {
            manager: [
              "Yuqorida sizning plitkalaringiz. Pastda «Loyihalar bo‘yicha»: summa, to‘liq to‘langanmi va hisoblanmangiz.",
              "Ko‘proq xohlaysizmi? Yangi mijozlar qidiring va [loyihalar](/admin/projects)ni o‘zingiz oching.",
            ],
            head: [
              "Siz o‘zingizni va jamoangizni ko‘rasiz: balans, loyihalar va to‘lovlar.",
              "Studiya foydasini faqat egasi ko‘radi.",
            ],
            admin: [
              "Plitkalar butun studiya bo‘yicha, «Shartnomalar bo‘yicha»dan «Egasiga qoladi»gacha.",
              "«Hammuassislar ulushlari» nima kelgani, nima ayirilgani (hamkorlar, agentliklar, xarajatlar) va kimga qancha to‘lashni ko‘rsatadi.",
            ],
          },
        },
        {
          id: "payouts",
          title: "To‘lovlar",
          body: {
            manager: [
              "To‘lovlarni egasi pulni o‘tkazgandan keyin yozadi. Ular «To‘lanadi»ni kamaytiradi.",
            ],
            head: [
              "To‘lovlarni faqat egasi yozadi.",
            ],
            admin: [
              "Avval pulni o‘tkazing, keyin «To‘lovlar» blokida «To‘lovni yozish» tugmasi bilan yozing. O‘zingizga to‘lov yozib bo‘lmaydi.",
            ],
          },
        },
        {
          id: "cash",
          title: "Kassa, kutilayotgan to‘lovlar va soliqlar",
          roles: ["admin"],
          body: [
            "Bo‘lim pastida yarim yillik «Oylar bo‘yicha kassa», kutilayotgan to‘lovlar va soliq muddatlari bor.",
            "Xarajatlar [«Xarajatlar»](/admin/expenses) bo‘limidan olinadi. Bu bloklarni faqat siz ko‘rasiz.",
          ],
        },
      ],
    },

    /* ── Релизы ───────────────────────────────────────────────────────── */
    "/admin/releases": {
      what: "Bu yerda xaridor to‘lovdan keyin yuklab oladigan tayyor mahsulotlar fayllari. Bo‘lim faqat sizda.",
      items: [
        {
          id: "upload",
          title: "Versiyani joylash",
          body: [
            "Arxivni kompyuteringizdan Supabase yopiq xotirasiga yuklang.",
            "«Relizni joylash»ni to‘ldiring: mahsulot, versiya, bucket va faylga yo‘l. «Joylash» tugmasini bosing. Panel fayl joyida ekanini tekshiradi va yangi versiya joriy bo‘ladi.",
          ],
        },
        {
          id: "downloads",
          title: "Xaridor nimani ko‘radi",
          body: [
            "Xaridor faylni buyurtma sahifasidan yuklab oladi: jami 20 martagacha va kuniga 10 marta. Har bir yuklab olish havolasi 60 soniya ishlaydi. Reliz bo‘lmaguncha u «fayl tayyorlanmoqda» yozuvini ko‘radi.",
            "Yuqorida «Berish o‘chirilgan» turibdimi? Hech kim yuklab ololmaydi. Bitta xaridorning kirishini [«Do‘kon buyurtmalari»](/admin/orders) bo‘limida yopishadi.",
          ],
        },
      ],
    },

    /* ── Команда ──────────────────────────────────────────────────────── */
    "/admin/team": {
      what: "Bu yerda studiyaning barcha xodimlari. Shu yerda yangi odam qo‘shiladi, unga rol, rahbar va aloqalar rejasi qo‘yiladi, bot unga nima yuborishi tanlanadi. Ketgan odam ham shu yerda o‘chiriladi.",
      items: [
        {
          id: "invite",
          title: "Xodim qo‘shish",
          body: {
            head: [
              "«Xodim qo‘shish» blokini to‘ldiring va **«Qo‘shish»** ni bosing. Telegram id va «Paneldagi ism» kerak. Telegram id bu raqam: odam uni @userinfobot botidan bilib, sizga yuboradi.",
              "Siz faqat menejer qo‘shasiz, ular darhol jamoangizga tushadi. Bot odamga kirish tugmasi bilan taklif yuboradi.",
              "Taklif yetib bormadimi? Demak, odam hali botga yozmagan. U [botni](https://t.me/Devuz_studio_bot) ochib, «Старт» ni bossin, siz esa uning qatorida «taklif yuborish» ni bosing.",
            ],
            admin: [
              "«Xodim qo‘shish» blokini to‘ldiring: Telegram id, «Paneldagi ism» va rol («loyiha rahbari» yoki «menejer»). **«Qo‘shish»** ni bosing. Telegram id ni odam @userinfobot botidan biladi.",
              "Yangi odam rahbarsiz keladi, uni «Rahbar» ustunida biriktiring. Taklif yetib bormadimi? Odam [botda](https://t.me/Devuz_studio_bot) «Старт» ni bossin, siz esa uning qatorida «taklif yuborish» ni bosing.",
              "«bot buyruqlari menyusini yangilash» tugmasi kimningdir botida /login buyrug‘i ko‘rinmasa kerak bo‘ladi.",
            ],
          },
        },
        {
          id: "claim",
          title: "Rahbar va uning jamoasi",
          body: {
            head: [
              "Rahbari yo‘q menejerning «Rahbar» ustunida **«o‘zimga olish»** tugmasi bor. Uni bosing, menejer jamoangizga o‘tadi.",
              "Menejerlaringiz statistikasi va «Reja va fakt» sizga ko‘rinadi, aloqalar rejasini siz qo‘yasiz. Ularning har bir bitimidan sizga 5% hisoblanadi.",
              "Menejerni faqat egasi ajrata oladi.",
            ],
            admin: [
              "«Rahbar» ustunida rahbarni tanlang va «saqlash» ni bosing. Menejerni ajratish uchun «rahbarsiz» ni tanlang. Odamga xabar boradi.",
              "Rahbar egasiz menejerni o‘zi «o‘zimga olish» tugmasi bilan olishi mumkin. U qo‘shgan menejerlar darhol uniki. Bu haqda sizga xabar keladi, ajratishni esa faqat siz qilasiz.",
              "Rahbar o‘z menejerlarining statistikasi va «Reja va fakt» ni ko‘radi, ularga aloqalar rejasini qo‘yadi. Menejerning har bir bitimidan unga 5% tushadi.",
            ],
          },
        },
        {
          id: "plan",
          title: "Aloqalar rejasi",
          body: {
            head: [
              "Aloqalar rejasi odam haftasiga nechta kompaniyaga yozishi kerakligini ko‘rsatadi. Menejerlaringizga uni «Aloqalar rejasi» ustunida qo‘yasiz: son va «saqlash». Sizning rejangizni egasi qo‘yadi.",
              "Rejaga [kunlik to‘plam](/admin/prospect) bog‘liq, ya’ni bugungi kompaniyalar ro‘yxati: kuniga 2 tadan 15 tagacha. Bo‘sh maydon «rejasiz» va kuniga 5 ta kompaniya degani, nol to‘plamni olib tashlaydi.",
            ],
            admin: [
              "Rejani «Aloqalar rejasi» ustunida o‘zingizdan boshqa har kimga qo‘ying. Bo‘sh maydon «rejasiz» va kuniga 5 ta kompaniya degani, nol rejani ham, to‘plamni ham olib tashlaydi.",
            ],
          },
        },
        {
          id: "grade",
          title: "Daraja va stavka",
          body: {
            head: [
              "Daraja (menejer darajasi) va shaxsiy stavkani egasi qo‘yadi, siz ularni faqat ko‘rasiz. Yangi mijozdan menejer 10% oladi. O‘tgan oyda uning 3 ta bitimi bo‘lgan bo‘lsa, 15%. Batafsil [Moliyada](/admin/finance).",
            ],
            admin: [
              "Yangi mijozdan menejer 10% oladi. O‘tgan oyda 3 ta bitim bo‘lsa, shu oyda 15%. Oyning har 3 ta bitimi uchun yana $200 mukofot. Bitim birinchi to‘lov oyida hisoblanadi.",
              "Daraja qo‘shimcha sotuvni hal qiladi: «kichik menejer» undan hech narsa olmaydi, «menejer» 5% oladi, «rahbar» barcha bitimlardan 30%. «Shaxsiy stavka, %» yangi mijozdan 10% o‘rniga ishlaydi, bo‘sh maydon «daraja bo‘yicha» degani.",
            ],
          },
        },
        {
          id: "role",
          title: "Rol",
          roles: ["admin"],
          body: [
            "«rahbar qilish» va «menejer qilish» tugmalari rolni o‘zgartiradi. Administrator roli panel orqali berilmaydi.",
            "Rahbarni olib tashlasangiz, uning menejerlari egasiz qoladi. Panel ular nechta ekanini aytadi. Ularni boshqa rahbarga biriktiring.",
            "O‘zingizni va oxirgi administratorni pasaytirib bo‘lmaydi.",
          ],
        },
        {
          id: "notices",
          title: "Botning qaysi xabarlari keladi",
          roles: ["admin", "head"],
          body: {
            head: [
              "Oxirgi ustunda sizda va menejerlaringizda **«Bildirishnomalar»** qatori bor. Uni bosing, keraksiz belgilarni oling va **«Saqlash»** ni bosing. Menejerlar o‘z belgilarini ko‘rmaydi.",
              "Bu yerda asosiy belgi **«Navbat bo‘yicha yangi buyurtmalar»**. Usiz odam [navbatdan](#leads-queue) chiqadi, lidlar (mijoz buyurtmalari) keyingisiga ketadi. Ta’til yoki kasallik vaqtida bu qulay.",
              "Qolgan belgilar faqat Telegramdagi xabarni olib tashlaydi, ish panelda qoladi. Javoblarni boshqa odam olib bormasa, «Mijozlarning aloqalarga javoblari» ni olmang: mijoz kutib qoladi.",
            ],
            admin: [
              "Oxirgi ustunda har bir xodimda va sizda **«Bildirishnomalar»** qatori bor. Uni bosing, keraksiz belgilarni oling va **«Saqlash»** ni bosing. Rahbar ham belgilarni o‘zgartiradi, lekin faqat o‘ziga va o‘z menejerlariga.",
              "Asosiy belgi **«Navbat bo‘yicha yangi buyurtmalar»**. Usiz odam [navbatdan](#leads-queue) chiqadi, lidlar (mijoz buyurtmalari) keyingisiga ketadi. Qolgan belgilar faqat Telegramdagi xabarni olib tashlaydi.",
              "Siz navbatda turmaysiz, lekin sizda «Navbat takliflari nusxalari» bor: lid kimga va qachon taklif qilingani. Belgilarni kim va qachon o‘zgartirgani [jurnalda](/admin/audit) ko‘rinadi.",
            ],
          },
        },
        {
          id: "lead-kinds",
          title: "Odam uchun «Qaysi lidlarni yuborish»",
          roles: ["admin", "head"],
          body: [
            "Odam ismi ostida **«Lidlar · barcha turlar»** yoki «Lidlar · 7 turdan 4 ta» qatori bor. Bosing, lid turlari bo‘yicha belgilar ochiladi: «Sovuq aloqalar», «Tenderlar», «Hamkorlar va agentliklar» va boshqalar. Keraksizini oling va **«Saqlash»** ni bosing.",
            "Olib tashlangan tur odamga kelmaydi, navbat ham uni taklif qilmaydi. Xodim bu belgilarni o‘zi [Sozlamalarda](/admin/settings) o‘zgartira oladi. Turni hech kim tanlamaganmi? Unda lid hammaga ketadi.",
          ],
        },
        {
          id: "sections",
          title: "Bo‘limlarga kirish: egasining belgilari",
          roles: ["admin"],
          body: [
            "Oxirgi ustunda rahbar va menejerlarda **«Bo‘limlar»** qatori bor. Bosing, kerakli bo‘limlarga belgi qo‘ying va **«Saqlash»** ni bosing. Bo‘lim odamning menyusida darhol paydo bo‘ladi.",
            "Belgi bo‘limni faqat ko‘rish uchun ochadi. Odam u yerda nimani o‘zgartira olishini uning roli hal qiladi. Masalan, «Hamkorlar» dagi menejer hamkorlarni ko‘radi, lekin to‘lovlar sizda qoladi.",
            "«Lidlar», «Vazifalar», «Tenderlar», «Sozlamalar» va «Yo‘riqnoma» hammaga ochiq, ular ro‘yxatda yo‘q. Har bir saqlash [jurnalga](/admin/audit) yoziladi.",
          ],
        },
        {
          id: "unlimited",
          title: "Lidlar cheklovi: kimga tungi ulush kerak emas",
          roles: ["admin"],
          body: [
            "Ishdan tashqari vaqtda har kim oyiga teng ulushdan ko‘p lid olmaydi, shunda bitta odam hammasini olib qo‘ymaydi. Ishdan tashqari vaqt bu 08:00 gacha, 18:00 dan keyin va dam olish kunlari. Ulushi kamroq hamkasblar joyida bo‘lmasa yoki lid 10 daqiqadan ko‘p kutsa, uni istalgan odam oladi.",
            "**«Cheklovni olib tashlash»** tugmasi odam uchun ulushni olib tashlaydi, qator «Lidlar: cheklovsiz» bo‘ladi. **«Cheklovni qaytarish»** uni qaytaradi. Tugmani faqat siz ko‘rasiz.",
          ],
        },
        {
          id: "details",
          title: "Xodim ma’lumotlari: F.I.Sh., paneldagi ism, username, telefon",
          roles: ["admin", "head"],
          body: {
            head: [
              "**«Ma’lumotlarni o‘zgartirish»** tugmasi sizda va har bir menejerda bor. Unda to‘rtta maydon: shartnomalar uchun «F.I.Sh.», «Paneldagi ism», «Username» va «Telefon». To‘g‘rilang va **«Ma’lumotlarni saqlash»** ni bosing.",
              "Paneldagi ismni hamma ko‘radi, lidlar va vazifalar shu ism bilan imzolangan. Ikkinchi rahbar va egasining ma’lumotlarini faqat egasi tahrirlaydi.",
            ],
            admin: [
              "**«Ma’lumotlarni o‘zgartirish»** tugmasi har bir xodimda, sizda ham bor. Unda to‘rtta maydon: shartnomalar uchun «F.I.Sh.», «Paneldagi ism», «Username» va «Telefon». To‘g‘rilang va **«Ma’lumotlarni saqlash»** ni bosing.",
              "Telegram id bu yerda o‘zgarmaydi. Rahbar o‘ziga va menejerlarga ma’lumotlarni tahrirlaydi. Kim nimani o‘zgartirgani [jurnalda](/admin/audit) ko‘rinadi.",
            ],
          },
        },
        {
          id: "disable",
          title: "Xodimni o‘chirish",
          roles: ["admin", "head"],
          body: {
            head: [
              "Ketgan menejerni oxirgi ustundagi «O‘chirish» tugmasi bilan o‘chiring. Nima bo‘lishini o‘qing va **«Tushunarli, o‘chirish»** ni bosing. Rahbar va egasini faqat egasi o‘chiradi.",
              "Kirish darhol yopiladi. Uning ishdagi lidlari navbatga qaytadi, yozishmalar esa uning rahbariga yoki egasiga o‘tadi.",
              "Odamni skaut signallari kanalidan va umumiy savdo chatidan o‘zingiz chiqaring, bot buni qila olmaydi. Odamni qaytarish mumkin: uni o‘sha Telegram id bilan qaytadan qo‘shing.",
            ],
            admin: [
              "Oxirgi ustunda «O‘chirish» ni bosing. Nima bo‘lishini o‘qing va **«Tushunarli, o‘chirish»** ni bosing. Menejerlarni rahbar ham o‘chira oladi.",
              "Kirish darhol yopiladi. Ishdagi lidlar navbatga qaytadi, yozishmalar uning rahbariga yoki sizga o‘tadi. Rahbar o‘chirilsa, uning menejerlari egasiz qoladi.",
              "Odamni skaut signallari kanalidan va umumiy savdo chatidan o‘zingiz chiqaring, bot buni qila olmaydi. Odamni qaytarish mumkin: uni o‘sha Telegram id bilan qaytadan qo‘shing.",
            ],
          },
        },
        {
          id: "app-devices",
          title: "Ilova va bildirishnomalar: kimda yoqilgan",
          roles: ["admin", "head"],
          body: [
            "Xodim ismi ostida «📱 Ilova: N ta qurilma» yoki «📱 Ilova: yoqilmagan» qatori bor. Bu odam panel bildirishnomalarini yoqqan telefon va kompyuterlar soni.",
            "Bildirishnomalar bot xabarlarini takrorlaydi, shuning uchun «Bildirishnomalar» belgilari ularga ham ta’sir qiladi. Bildirishnomalarni odam faqat o‘zi, o‘z qurilmasida yoqa oladi. Buni qanday qilish [«Bosh sahifa» yo‘riqnomasida](/admin/help#hq-app) yozilgan.",
          ],
        },
      ],
    },

    /* ── Партнёры ─────────────────────────────────────────────────────── */
    "/admin/partners": {
      what: "Hamkor o‘z havolasi yoki promokodi orqali mijoz olib keladi va loyiha summasidan foiz oladi. Bu yerda uning havolalari, mijozlari, hisob-kitoblari va to‘lov so‘rovlari. Bo‘limni egasi va rahbar ko‘radi. To‘lovlar, shaxsiy stavka va hamkorni o‘chirishni faqat egasi hal qiladi.",
      items: [
        {
          id: "join",
          title: "Hamkor qanday paydo bo‘ladi",
          body: [
            "Odatda hamkor o‘zi qo‘shiladi. Saytdagi «Зарабатывай с нами» bo‘limida u «Стать партнёром» ni bosadi, bot unga hamkor kabinetiga kirishni yuboradi. Botdagi /ref va /cabinet buyruqlari ham shuni qiladi. Studiya xodimi hamkor bo‘la olmaydi, bot unga rad javobini beradi.",
            "Hamkorni o‘zingiz ham «Hamkorni qo‘lda qo‘shish» blokida qo‘shishingiz mumkin: ism, kod, Telegram id va izoh. Kodni yozmasangiz ham bo‘ladi, panel uni o‘zi o‘ylab topadi. Telegram id siz hamkor kabinetga kira olmaydi.",
            "Hamkorda 20 tagacha qisqa havola bor, har bir maydonchaga alohida. Havola orqali o‘tishni sayt 30 kun eslab qoladi. Shu vaqt ichidagi buyurtma hamkorga hisoblanadi, hatto mijoz havolasiz qaytgan bo‘lsa ham.",
          ],
        },
        {
          id: "count",
          title: "Mijoz qachon hisoblanadi",
          body: {
            head: [
              "Mijoz hamkorning havolasi yoki promokodi bilan kelsa, buyurtma hamkorga hisoblanadi. Yana ikki shart: bu hamkorning o‘zi emas va mijoz avval bizda bo‘lmagan. Shunda hamkorga botda xabar boradi.",
              "Bunday buyurtmadan chiqqan loyiha ham hamkorga yoziladi. Kim olib kelgani va foizni faqat egasi o‘zgartira oladi. Imzolangan shartnoma yuklanganda hamkorga summa va taxminiy ulush bilan xabar boradi.",
              "Hamkorni bloklash faqat yangi hisoblashlarni to‘xtatadi. Eski hisob-kitoblar va to‘lovlar qoladi.",
            ],
            admin: [
              "Mijoz hamkorning havolasi yoki promokodi bilan kelsa, buyurtma hamkorga hisoblanadi. Yana ikki shart: bu hamkorning o‘zi emas va mijoz avval bizda bo‘lmagan. Shunda hamkorga botda xabar boradi.",
              "Bunday buyurtmadan chiqqan loyiha ham hamkorga yoziladi. Loyiha kartochkasidagi «Hamkor» blokida kim olib kelganini va foizni o‘zgartirish mumkin. O‘sha yerda sababini ko‘rsatib, loyihani hisobga olmaslik ham mumkin.",
              "Hamkorni bloklash faqat yangi hisoblashlarni to‘xtatadi. Eski hisob-kitoblar va to‘lovlar qoladi.",
            ],
          },
        },
        {
          id: "card",
          title: "Hamkor kartochkasi: uning mijozlari",
          body: [
            "«Barcha hamkorlar» da hamkor ismini yoki «Mijozlar» ustunidagi sonni bosing. Uning kartochkasi ochiladi: o‘tishlar, mijozlar, to‘langan loyihalar, «Ishlab topilgan» va «Mavjud».",
            "U yerda asosiysi «Hamkor mijozlari» bloki. Unda hamkorga hisoblangan har bir buyurtma: qachon kelgan, hozir qayerda, jamoadan kim olib boryapti va qancha hisoblangan. Mijozni bosing, [lid kartochkasi](#leads-card) ochiladi. Hamkor o‘z mijozlarining kontaktlarini ko‘rmaydi, siz esa ko‘rasiz.",
          ],
        },
        {
          id: "percent",
          title: "Foiz",
          body: [
            "Hamkor shartnoma summasidan foiz oladi. Loyiha qancha katta bo‘lsa, foiz shuncha yuqori: $2 500 gacha 6%, $5 000 gacha 10%, $10 000 gacha 14%, $30 000 gacha 17%, undan qimmat 20%.",
            "Loyihadagi foiz hamkorning shaxsiy stavkasidan muhimroq, shaxsiy stavka esa shu jadvaldan muhimroq. Mijoz loyihani to‘liq to‘lamaguncha pul muzlatilgan. Agentliklarning o‘z stavkasi bor, 15%, batafsil [Agentliklar](/admin/agencies) yorlig‘ida.",
            "Hamkorning butun vaqtdagi buyurtmalari $50 000 ga yetganda, har bir keyingi loyiha stavkasiga umrbod 5% qo‘shiladi. Bunday hamkorda ro‘yxatda «+5% umrbod» belgisi bor.",
            "«foydadan» belgili eski loyihalar eski qoidalar bo‘yicha hisoblanadi. Ular uchun loyiha kartochkasida tannarxni kiriting.",
          ],
        },
        {
          id: "agencies",
          title: "Hamkorlar agentliklari",
          body: [
            "Hamkor endi agentlik ulamaydi. Agentlik o‘zi bizning hamkorimiz bo‘ladi va 15% oladi. Uni [Agentliklar](/admin/agencies) yorlig‘ida qo‘shishadi.",
            "«Hamkorlar agentliklari» bloki faqat unda eski yozuvlar qolgan bo‘lsa ko‘rinadi. Bunday yozuv agentlik buyurtmalarini 12 oyga hamkorga beradi. **«12 oyga uzaytirish»** tugmasi muddatni qaytadan boshlaydi, «o‘chirish» yangi buyurtmalarni to‘xtatadi.",
          ],
        },
        {
          id: "claims",
          title: "Qo‘lda biriktirilgan mijozlar",
          body: [
            "Hamkor endi mijozlarni qo‘lda biriktirmaydi. Buning o‘rniga mijoz o‘zi [promokodni](#partners-code) aytadi.",
            "«Hamkorlar biriktirgan mijozlar» bloki faqat unda eski yozuvlar bo‘lsa ko‘rinadi. Bunday biriktirish 12 oy amal qiladi. Kompaniya aslida bizniki bo‘lsa, sababini yozing va **«biriktirishni bekor qilish»** ni bosing. Sababni hamkor oladi.",
          ],
        },
        {
          id: "code",
          title: "Hamkor promokodi: mijoz ovoz chiqarib aytadigan so‘z",
          body: [
            "Har bir hamkorning promokodi bor. Bu lotincha so‘z, masalan AZIZ, uni mijoz menejerga aytadi. U «Barcha hamkorlar» da hamkor ismi ostida turadi.",
            "Promokod havolada, mijozning chatdagi va botdagi so‘zlarida ishlaydi. Uni lid kartochkasidagi «Promokod yoki kim olib kelgan» maydoniga ham yozishadi ([qanday](#leads-partner-code)). Mijoz birinchi yozilgan hamkorga tegadi.",
            "So‘zni hamkor qatoridagi **«Promokod»** maydonida, «saqlash» tugmasi bilan almashtirish mumkin. Lotin harflari va raqamlar, 12 belgigacha. Almashgandan keyin eski promokod ishlamaydi.",
          ],
        },
        {
          id: "promo",
          title: "Promo-materiallar",
          body: [
            "Bu studiyaning roliklari va rasmlari, hamkorlar ularni o‘z sahifalariga joylaydi. Ularni sahifa tepasidagi «Promo-materiallar» havolasi orqali yoki darhol oching: [Promo-materiallar](/admin/partners/promo). Hamkor ularni kabinetda, o‘z havolasi bor izoh bilan birga yuklab oladi.",
            "Material qo‘shish uchun faylni tanlang: MP4, MOV, WebM rolik yoki rasm, 500 MB gacha. Nomini yozing va «Rolikdagi so‘zlar tili» ni tanlang. **«Yuklash»** ni bosing va yuklash tugaguncha sahifani yopmang.",
            "«Post uchun izoh» ga {link} yozing: shu joyga hamkorning havolasi qo‘yiladi. Bot hamkorlarga yangi material haqida xabar berishini xohlasangiz, belgi qo‘ying.",
            "Har bir materialda necha marta yuklab olingani ko‘rinadi. **«Hamkorlardan yashirish»** materialni kabinetdan olib tashlaydi, fayl qoladi. «o‘chirish» va **«Butunlay o‘chirish»** faylni serverdan o‘chiradi, shuning uchun asl fayllarni o‘zingizda saqlang.",
          ],
        },
        {
          id: "payout",
          title: "Hamkorga to‘lov",
          body: {
            head: [
              "Hamkor to‘lovni kabinetda yoki botda /payout buyrug‘i bilan so‘raydi. Oyning birinchi ish kunidan, $50 dan, darhol butun mavjud summaga so‘rash mumkin. So‘rov «To‘lov so‘rovlari» blokida paydo bo‘ladi.",
              "Egasi hal qiladi: u pulni o‘tkazadi va «To‘landi» yoki «rad etish» ni bosadi. Sizning qatoringizda hamkor, summa va rekvizitlar ko‘rinadi, tugmalar o‘rnida esa «egasi hal qiladi» yozilgan.",
              "Loyihadan ulushni hamkor so‘ramaydi. Mijoz loyihani to‘liq to‘laganda to‘lov so‘rovi o‘zi yaratiladi, minimumsiz va oy boshini kutmasdan.",
            ],
            admin: [
              "Hamkor to‘lovni kabinetda yoki botda /payout buyrug‘i bilan so‘raydi. Oyning birinchi ish kunidan, $50 dan, darhol butun mavjud summaga so‘rash mumkin. So‘rov «To‘lov so‘rovlari» blokida paydo bo‘ladi, sizga xabar keladi.",
              "Avval pulni o‘tkazing, keyin **«To‘landi»** ni bosing. Yoki «rad etish» ni bosing: summa hamkorga qaytadi va u sababni ko‘radi.",
              "Loyihadan ulushni hamkor so‘ramaydi. Mijoz loyihani to‘liq to‘laganda so‘rov o‘zi yaratiladi va sizga xabar keladi. Keyin hammasi odatdagidek: pulni o‘tkazdingiz va «To‘landi» ni bosdingiz.",
            ],
          },
        },
        {
          id: "delete",
          title: "Hamkorni o‘chirish",
          roles: ["admin"],
          body: [
            "«Barcha hamkorlar» jadvalida, «Tahrirlash» ustunida «o‘chirish» bor. Ogohlantirishni o‘qing va **«Butunlay o‘chirish»** ni bosing. Hamkor havolalari ishlamay qoladi, kabinet yopiladi, uning loyihalari bo‘yicha hisoblash boshqa bo‘lmaydi. Qaytarib bo‘lmaydi.",
            "To‘lovlari bor hamkorni o‘chirib bo‘lmaydi, uni faqat bloklash mumkin. O‘chirish [jurnalga](/admin/audit) yoziladi.",
          ],
        },
      ],
    },

    /* ── Агентства ──────────────────────────────────────────────────────── */
    "/admin/agencies": {
      what: "Agentlik bizga o‘z mijozlarining buyurtmalarini olib keladi va har bir loyiha summasidan 15% oladi. Agentlikni olib kelgan va shu yerda qo‘shgan jamoa a’zosi 12 oy davomida uning loyihalaridan 5% oladi. Agentlikni har kim qo‘sha oladi.",
      items: [
        {
          id: "terms",
          title: "Shartlar: agentlikka 15%, olib kelganga 5%",
          body: [
            "Agentlik har doim shartnoma bo‘yicha o‘z loyihasi summasidan 15% oladi. Oddiy hamkorlardagidek pog‘onalar yo‘q.",
            "Agentlikni olib kelgan odam uning 12 oy ichida qo‘shilgan har bir loyihasidan 5% oladi. Muddat agentlik shu yerda qo‘shilgan kundan hisoblanadi. U «5% gacha» ustunida ko‘rinadi.",
            "Agentlik loyihasini o‘zingiz olib borsangiz, 5% odatdagi foizingiz ustiga qo‘shiladi. Mijoz loyihani to‘liq to‘lamaguncha ikkala ulush ham muzlatilgan.",
          ],
        },
        {
          id: "partners",
          title: "Bloger-hamkorlar: o‘sha 5% va ular qancha olib kelgani",
          body: [
            "O‘sha 5% ni 12 oy davomida bloger-hamkorni olib kelgan odam ham oladi. Kim olib kelganini egasi «Kim olib kelgan» ustunida belgilaydi. Hamkorni olib keldingiz, lekin u yerda yo‘qmisiz? Egasiga ayting.",
            "Jadvalda har biri nechta loyiha olib kelgani, «Loyihalar summasi», «Mijozlar to‘lagan» va 5% ko‘rinadi. Menejer faqat o‘zi olib kelganlarni ko‘radi. Rahbar va egasi hammasini ko‘radi.",
          ],
        },
        {
          id: "lifetime",
          title: "Umrbod 20%: agentlik buyurtmalari $50 000 dan oshganda",
          body: [
            "Agentlikning butun vaqtdagi buyurtmalari $50 000 ga yetganda, uning stavkasi umrbod 20% bo‘ladi. Chegarani oshirgan loyiha hali 15% bo‘yicha, keyingisi esa 20% bo‘yicha.",
            "«Loyihalar summasi» ustunida «20% umrbod» yoki 20% gacha qancha qolgani yozilgan. Hammasi o‘zi hisoblanadi, qo‘lda hech narsa qo‘yish kerak emas. Sizning 5% ingiz bundan o‘zgarmaydi.",
          ],
        },
        {
          id: "deck",
          title: "«Qanday ishlaydi» sxemasi va agentlik uchun taqdimot",
          body: [
            "Yorliq tepasida bu qanday ishlashining qisqa sxemasi bor. $2 000 lik loyiha misolida: agentlikka $300, olib kelganga $100, qolgani studiyaga.",
            "«Taqdimotni ochish» tugmasi agentlikning o‘zi uchun olti tildagi sahifani ochadi. U yerda sizning 5% ingiz yo‘q. Agentlikka uning qatoridagi «taqdimot» havolasini yuboring: u bilan Telegram tugmasi agentlik kodi bilan botga olib boradi.",
          ],
        },
        {
          id: "add",
          title: "Agentlikni qanday qo‘shish",
          body: {
            manager: [
              "«Agentlik qo‘shish» blokini to‘ldiring: «Agentlik nomi» va «Bizga qanday yozadi: @telegram, telefon yoki pochta». «Agentlik qo‘shish» ni bosing, u sizga yoziladi.",
              "Kelishgan zahoti qo‘shing: 12 oy yozilgan kundan hisoblanadi. Bitta agentlik bir marta qo‘shiladi. Panel u allaqachon borligini aytsa-yu, bu xato bo‘lsa, egasiga yozing.",
            ],
            head: [
              "«Agentlik qo‘shish» blokini to‘ldiring: «Agentlik nomi» va «Bizga qanday yozadi: @telegram, telefon yoki pochta». «Kim olib kelgan» da o‘zingizni, boshqa xodimni yoki «Hech kim, o‘zi kelgan» ni tanlang.",
              "Kelishgan zahoti qo‘shing: 12 oy yozilgan kundan hisoblanadi. Bitta agentlik bir marta qo‘shiladi. Keyin kim olib kelganini faqat egasi o‘zgartira oladi.",
            ],
            admin: [
              "«Agentlik qo‘shish» blokini to‘ldiring: «Agentlik nomi» va «Bizga qanday yozadi: @telegram, telefon yoki pochta». «Kim olib kelgan» da o‘zingizni, boshqa xodimni yoki «Hech kim, o‘zi kelgan» ni tanlang.",
              "Kelishgan zahoti qo‘shing: 12 oy yozilgan kundan hisoblanadi. Kim olib kelganini siz jadvalda o‘zgartirasiz, muddat bunda surilmaydi. Almashtirish [jurnalga](/admin/audit) yoziladi.",
            ],
          },
        },
        {
          id: "orders",
          title: "Agentlik buyurtmalari unga qanday tushadi",
          body: {
            manager: [
              "Agentlikka jadvaldagi «agentlik uchun havola» sini yuboring. Shu havola bilan kelgan mijozlar va agentlik kontakti bilan kelgan buyurtmalar unga o‘zi yoziladi, 15% va 5% bilan birga.",
              "Buyurtma qo‘ng‘iroq yoki shaxsiy xabar orqali keldimi? Egasidan loyihani agentlikka bog‘lashni so‘rang.",
            ],
            head: [
              "Agentlikka jadvaldagi «agentlik uchun havola» sini yuboring. Shu havola bilan kelgan mijozlar va agentlik kontakti bilan kelgan buyurtmalar unga o‘zi yoziladi, 15% va 5% bilan birga.",
              "Buyurtma qo‘ng‘iroq yoki shaxsiy xabar orqali keldimi? Egasidan loyihani agentlikka bog‘lashni so‘rang.",
            ],
            admin: [
              "Agentlikka jadvaldagi «agentlik uchun havola» sini yuboring. Shu havola bilan kelgan mijozlar va agentlik kontakti bilan kelgan buyurtmalar unga o‘zi yoziladi, 15% va 5% bilan birga.",
              "Buyurtma qo‘ng‘iroq yoki shaxsiy xabar orqali keldimi? Loyihani o‘zingiz bog‘lang: loyiha kartochkasi, «Hamkor» bloki.",
            ],
          },
        },
        {
          id: "money",
          title: "Pul qayerda ko‘rinadi",
          body: {
            manager: [
              "Agentliklaringiz va hamkorlaringiz jadvalida sizning 5% ingiz ko‘rinadi: qancha ishlab topilgan va qancha muzlatilgan. O‘sha pul [Moliyangizda](/admin/finance) alohida qator bo‘lib turadi. U qolgan pul bilan birga to‘lanadi.",
              "Agentlik qancha olishi sizga ko‘rinmaydi. Uning to‘lovlarini egasi hal qiladi.",
            ],
            head: [
              "«Barcha agentliklar va hamkorlar» jadvalida barcha agentliklar va ularni kim olib kelgani ko‘rinadi. O‘sha yerda «Loyihalar summasi», «Olib kelganga 5%» va «Hamkor ulushi». Sizning 5% ingiz [Moliyada](/admin/finance) alohida qator bo‘lib turadi.",
              "Agentlik umumiy [Hamkorlar](/admin/partners) ro‘yxatida ham «agentlik · 15%» belgisi bilan bor. U yerda uning hisob-kitoblari va to‘lov so‘rovlari. To‘lovni egasi hal qiladi.",
            ],
            admin: [
              "«Barcha agentliklar va hamkorlar» jadvalida barcha agentliklar va ularni kim olib kelgani ko‘rinadi. O‘sha yerda «Loyihalar summasi», «Olib kelganga 5%» va «Hamkor ulushi». [Moliyada](/admin/finance) bu 5% jamoaga har qanday hisoblash kabi studiya ulushidan ayiriladi.",
              "Agentlik umumiy [Hamkorlar](/admin/partners) ro‘yxatida ham «agentlik · 15%» belgisi bilan bor. U yerda uning hisob-kitoblari, rekvizitlari va to‘lov so‘rovlari. To‘lovni siz hal qilasiz.",
            ],
          },
        },
      ],
    },

    /* ── Прототипы ────────────────────────────────────────────────────── */
    "/admin/proto": {
      what: "Bu yerda prototip yig‘iladi: mijozning bo‘lajak sayti sahifasi. Uni birinchi suhbatdan keyin havola qilib yuborishadi va mijoz o‘z biznesini telefonda ko‘radi. Bo‘lim faqat egasida bor.",
      items: [
        {
          id: "build",
          title: "Yig‘ish",
          body: [
            "«Mijoz sayti»ni yozing, «Nisha» va «Sahifa tili»ni tanlang. Nishalar: shinamontaj, avtoservis, avtomoyka, barbershop, go‘zallik saloni, tirnoq studiyasi, detailing, stomatologiya, o‘quv markazi, tibbiyot markazi. Nom, telefon, messenjerlar va logotipni panel uning saytidan o‘zi oladi.",
            "Xizmatlarni har qatorga bittadan, uning so‘zlari bilan, 3 tadan 12 tagacha yozing. Narxni tiredan keyin va faqat o‘zi aytganini qo‘ying. Sayt xato qilgan bo‘lsa, «Saytda topilganini almashtirish»ni oching.",
            "Prototipni vazifa bilan buyurtma qilishganmi? «Vazifadagi buyurtma bo‘yicha» maydonida vazifani tanlang. Unda buyurtma bergan xodim mas’ul bo‘ladi, vazifa esa o‘zi yopiladi. Keyin «Prototipni yig‘ish»ni bosing.",
          ],
        },
        {
          id: "auto",
          title: "O‘zi yig‘ilganlar, aloqalar uchun",
          body: [
            "Bot aloqalar uchun prototiplarni o‘zi yig‘maydi. «o‘zi yig‘ildi, aloqa uchun» belgili prototiplar avvaldan qolgan, ular parol bilan yopilgan va ro‘yxatda ko‘rinmaydi.",
            "Aloqa uchun prototipni shu yerda qo‘lda yig‘asiz. Menejerda bu qanday ko‘rinishi [oldindan prototip](#prospect-proto-ahead) bandida yozilgan.",
          ],
        },
        {
          id: "check",
          title: "Tekshiruv va havola",
          body: [
            "Tayyor sahifani dastur darhol tekshiradi. U o‘ylab topilgan raqamlarni, maqtanishni, mijoz aytmagan xizmatlarni va ishlamaydigan tugmani qidiradi. Yana uzun tirelar va «… dunyosiga sho‘ng‘ing» kabi andozalarni qidiradi: ular orqali biznes egasi neyrotarmoq matnini darhol taniydi.",
            "Muammo topildimi? Prototip «qoralama» bo‘lib qoladi, havola ishlamaydi, muammolar esa ro‘yxat qilib ko‘rsatiladi. Tuzating va qayta yig‘ing. Hammasi toza va prototip «tayyor» bo‘lsa, «Havolani nusxalash»ni, yuborgandan keyin esa «Mijozga yubordim»ni bosing.",
          ],
        },
        {
          id: "opens",
          title: "Mijoz ochdimi",
          body: [
            "Prototip qatorida mijoz uni ochgan-ochmagani va necha marta ochgani ko‘rinadi. Paneldan o‘zingiz ochganingiz va messenjerdagi havola prevyusi hisoblanmaydi.",
            "Ochib, ikkinchi marta qaytdimi? Bugun qo‘ng‘iroq qiling. Ikki kunda ochmadi, demak havola unga yetib bormagan. Prototipdagi «Yozilish» tugmasi mijozning o‘z Telegram yoki WhatsApp’ini ochadi: shunda u hammasi ishlashini ko‘radi.",
          ],
        },
        {
          id: "trace",
          title: "Yashirin iz va begona saytni tekshirish",
          body: [
            "Har bir prototipda yashirin iz bor. Ranglar, chekinishlar va boshqa mayda narsalar har bir mijozda o‘zicha biroz siljitilgan. Ko‘z bilan bu ko‘rinmaydi, panel esa o‘z maketini taniydi.",
            "Yana demo-ma’lumotlarda tuzoq-so‘zlar bor: o‘ylab topilgan ko‘cha va do‘kon nomlari. Begona saytda ular paydo bo‘lishi mumkin emas. Agar ular o‘sha yerda bo‘lsa, matn bizning maketimizdan olingan.",
            "Har bir prototip pastida shartlar havolasi bor: shartnomasiz maketdan foydalanib bo‘lmaydi, jarima narxning 200%. Mijoz shartlarni maketni ochishi yoki loyiha haqida suhbatni davom ettirishi bilan qabul qiladi.",
            "Begona saytni tekshirish uchun manzilni «Saytni maketimizga tekshirish»ga qo‘ying va «Tekshirish»ni bosing. Panel maket aniq bizniki deb yozsa, tasodif uchun juda ko‘p narsa mos kelgan. Da’vo uchun natijani saqlang va saytni notarial ko‘rikdan o‘tkazing.",
          ],
        },
        {
          id: "trace-month",
          title: "Oyiga bir marta mijozlar saytlari",
          roles: ["admin"],
          body: [
            "Har oy 1-sanadan boshlab bot biz maket qilgan barcha mijozlarning saytlarini o‘zi tekshiradi. Tekshiruv «Saytni maketimizga tekshirish» bilan bir xil. U saytlarni bir martada uchtadan oladi, shuning uchun butun ro‘yxat bir-ikki soat davom etadi.",
            "Keyin sizga va rahbarga «🔎 Сайты клиентов» hisoboti keladi: nechta tekshirilgani va maketimiz qayerda topilgani. Kechasi 21:00 dan keyin hisobot kelmaydi, u ertasi kuni keladi.",
          ],
        },
      ],
    },

    /* ── Разборы ──────────────────────────────────────────────────────── */
    "/admin/razbor": {
      what: "Tahlillar bu saytimizdagi boshqa saytlar haqidagi maqolalar: ularning mijozlariga nima xalaqit beradi va buni qanday tuzatish kerak. Smena ularni har kuni ertalab yozadi va darhol e’lon qiladi, sizning tasdig‘ingizsiz. Matnni dastur tekshiradi. Bu yerda istalgan tahlilni tahrirlash, saytdan olish yoki o‘chirish mumkin.",
      items: [
        {
          id: "shift",
          title: "Tahlillar smenasi",
          body: [
            "Har kuni Toshkent vaqti bilan 08:03 da smena «Sovuq aloqalar» bo‘limidan hali yozilmagan saytlarni oladi. U 12 tagacha saytni ko‘rib, rus va o‘zbek tillarida 3 tagacha tahlil yozadi. Hisobot Telegram’ga havolalar va sahifalar sayt xaritasida bor-yo‘qligi belgisi bilan keladi.",
            "Hisobotda qolgan saytlar nega olinmagani yozilgan: sayt ochilmadi, xato kam, soha yoki shahar noaniq, bunday tahlil allaqachon bor, maqola tekshiruvdan o‘tmadi. Tibbiyot va boshqa taqiqlangan sohalarni smena tahlil qilmaydi. 11:03 gacha hisobot yo‘qmi? Ogohlantirish keladi.",
          ],
        },
        {
          id: "tender",
          title: "Haftaning tender tahlili",
          body: [
            "Haftada bir marta, dushanba kuni 08:33 dan keyin, tender tahlili chiqadi. Bu boshqa sayt emas, IT-xaridning namunaviy texnik topshirig‘i: unda odatda nima unutiladi va qanday to‘g‘ri yozish kerak. Maqola buyurtmachilar va summalarni aytmaydi.",
            "Maqola darhol, «tenderlar va davlat shartnomalari» belgisi bilan va suratlarsiz chiqadi. Unga havola Telegram’ga alohida qator bo‘lib keladi. Mavzular tugasa, hisobot buni aytadi.",
          ],
        },
        {
          id: "marketing-articles",
          title: "Marketing haqidagi maqolalar",
          body: [
            "Saytning «Marketing» sahifasida har kuni ikkita qisqa maqola chiqadi, Toshkent vaqti bilan 10:00 va 16:00 da, rus va o‘zbek tillarida. Mavzular Google Trends va Wordstat’dagi jonli so‘rovlar bo‘yicha tanlanadi. Har bir maqola bizni qidiruvda topadigan yana bir sahifa beradi.",
            "Maqolalar o‘zi chiqadi va darhol sayt xaritasiga tushadi. Ularda foizlar, summalar va mavzu faktlarida yo‘q raqamlar bo‘lmaydi. Tekshiruvdan o‘tmadimi yoki sayt xaritasida topilmadimi? Telegram’ga sababi bilan qator keladi. Chiqqan maqolani paneldan olib bo‘lmaydi, ishlab chiqish chatiga yozing.",
          ],
        },
        {
          id: "review",
          title: "Dastur nimani tekshiradi",
          body: [
            "Har bir maqolani chiqishdan oldin dastur tekshiradi. Kompaniya na nomi, na manzili bilan aytilmaydi. Har bir raqam sayt tekshiruvi topilmalarida bor. O‘sish foizlari va «topga chiqarish» va’dalari yo‘q.",
            "Xato ko‘rdingizmi? Tahlilni «E’lon qilingan» ro‘yxatidan toping: u yerda ikkala maqola va faqat siz ko‘radigan sayt manzili bor. «Tahrirlash» faqat matnni o‘zgartiradi, sahifa manzili va so‘rov o‘zgarmaydi.",
          ],
        },
        {
          id: "publish",
          title: "E’lon qilish, olish, rad etish",
          body: [
            "«E’londan olish» tahlilni saytdan «Tekshiruvda» ro‘yxatiga oladi, smena uni qaytib qo‘ymaydi. «E’lon qilish» tahlilni saytga qaytaradi, ikkala maqola kerak. Panel darhol sayt xaritasini tekshiradi va sahifalar topilganini aytadi.",
            "«E’lon qilmaymiz» olingan tahlilni ro‘yxatda qoldiradi va smena bu saytga boshqa qaytmaydi. Saytni smena navbatiga faqat «O‘chirish» tugmasi bilan qaytarish mumkin: «o‘chirish» so‘zini yozing.",
          ],
        },
        {
          id: "english",
          title: "Inglizcha va polyakcha versiyalar",
          body: [
            "Chiqqanidan bir soat keyin tahlilning ingliz va polyak tilidagi versiyalari paydo bo‘ladi. Ularni server ruscha maqola bo‘yicha, shu tildagi so‘rovga moslab o‘zi yozadi. Topilmalar, raqamlar va suratlar o‘sha, yangi raqamlar bo‘lmaydi.",
            "Chiqmasa, server olti soatdan keyin yana urinadi. «Tahrirlash» ikkala versiyani bekor qiladi, ular yangi matn bo‘yicha qayta yoziladi. «E’londan olish» va «O‘chirish» ularni ham olib tashlaydi.",
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
      what: "Bu yerda studiyaning SI xodimlari, ya’ni ishning bir qismini o‘zi qiladigan dasturlar ishlaydi. «Blogerlar» hamkorlik dasturi uchun blogerlarni qidiradi. «Skaut» Telegram guruhlarini o‘qib, buyurtmalarni ushlaydi. «Claudery» SI bo‘yicha pullik yordam arizalarini qabul qiladi.",
      items: [
        {
          id: "service",
          title: "Xizmat va xizmat boti",
          roles: ["admin"],
          body: [
            "Tepada mijozlar uchun SI xodimlar xizmati yoqilgani ko‘rinadi. O‘chirilgan xizmat hech kimga javob bermaydi: na kabinet, na mijozlar saytidagi vidjet, na xizmat boti. «Xizmatni yoqish» va «Xizmatni o‘chirish» bir daqiqa ichida ishlaydi.",
            "Xizmatning o‘z Telegram boti bor, bu studiya boti emas. Uni @BotFather’da yaratiladi, u yerda Business Mode yoqiladi va token maxfiy kalitlar omboriga qo‘yiladi. Keyin «Xizmat botini ulash» tugmasini bosing, server token va Business Mode’ni tekshiradi.",
          ],
        },
        {
          id: "ready",
          title: "Pilotga tayyorlik",
          roles: ["admin"],
          body: [
            "«Pilotga tayyorlik» bloki nima sozlanganini ko‘rsatadi: bot tokeni, maxfiy kalitlar, Instagram, karta bilan to‘lov. Qiymatlar ko‘rinmaydi, faqat «tayyor» yoki «yo‘q». Eng muhimi bot tokeni: usiz mijozlar arizalari ularning odamlariga yetib bormaydi.",
            "Meta ilovamizni tekshirmaguncha Instagram «kutilmoqda» holatida turadi. Ungacha uni faqat test kabinetlari ulay oladi. Oxirgi qator oy davomida mijoz odamlariga yetib bormagan arizalarni sanaydi. Noldan ko‘pmi? Mijoz kabinetida arizalarni kim olishini tekshiring.",
          ],
        },
        {
          id: "clients",
          title: "Mijozlar va raqamlar qayerdan",
          roles: ["admin"],
          body: [
            "Har bir kartochka xizmatning bitta mijozi. «Suhbatlar» shu oyda SI tarif limitidan nechta suhbat olib borganini ko‘rsatadi. Limit tugasa, mijozning SI jim bo‘ladi, uning odamlariga xabar keladi.",
            "«Tannarx» oy davomida SI uchun xarajatni dollarda ko‘rsatadi. «Marja» bu tarif narxidan tannarx ayirilgani, server sozlamalaridagi kurs bo‘yicha so‘mda (odatda 12 700). Tepada umumiy xarajat va to‘langan tariflar bo‘yicha tushum.",
          ],
        },
        {
          id: "pay",
          title: "To‘lov, sinov muddati va holat",
          roles: ["admin"],
          body: [
            "Hozircha to‘lov hisob bo‘yicha. Pul keldimi? Tarif, oylar, summa va usulni tanlang va «To‘lovni belgilash» tugmasini bosing. Muddat allaqachon to‘langan sanadan uzaytiriladi. Payme yoki Click kalitlari paydo bo‘lganda mijoz karta bilan o‘zi to‘lay oladi.",
            "Yangi mijoz 14 kun va 100 suhbatni bepul oladi. «Sinovni 7 kunga uzaytirish» to‘lovgacha vaqt beradi. «Holatni o‘zgartirish» bilan «pauza» yoki «bloklangan» qo‘yilsa, mijozning SI darhol to‘xtaydi.",
          ],
        },
        {
          id: "cabinet",
          title: "Mijoz kabineti va demo",
          roles: ["admin"],
          body: [
            "«Kabinetni ochish» sizni mijoz kabinetiga qo‘llab-quvvatlash nomidan 2 soatga kiritadi. Kabinet sarlavhasida qo‘llab-quvvatlash kirgani belgisi bo‘ladi.",
            "«Demo sifatida ko‘rsatish» shu mijozning chatini saytdagi xizmat sahifasiga qo‘yadi. Demo uchun o‘ylab topilgan kompaniya ochgan ma’qul: tashrif buyuruvchining har bir savoli uning suhbatlarini sarflaydi.",
          ],
        },
        {
          id: "scout",
          title: "Skaut: guruhlar va xabarlarni qanday saralaydi",
          body: [
            "«Skaut» yorlig‘i Telegram guruhlarini o‘qib, ijrochi qidirilayotgan xabarlarni ushlaydigan dasturni sozlaydi. Topilganlar [«Skaut signallari»](/admin/scout)ga tushadi. «Skaut uchun guruhlar» blokida guruhni har kim qo‘sha oladi. Uni qo‘shgan odam, rahbar va egasi olib tashlay oladi.",
            "«Xabarlarni qanday saralash» blokida ikki rejim bor. «Avtomatik»: skaut sayt, bot yoki ilova qilish so‘rovlarini rus, o‘zbek va ingliz tillarida o‘zi taniydi. «So‘zlar bo‘yicha»: faqat ro‘yxatingizdagi so‘zlar bor xabarlar olinadi, «sayt» so‘zi «saytga»ni ham topadi.",
            "Rejim va so‘zlarni egasi va rahbar o‘zgartiradi, skaut ularga 5 daqiqada o‘tadi. Xeshtegli xabarlarni (#ish) u hech qachon olmaydi: bunday qilib reklama yoziladi, buyurtma emas.",
          ],
        },
        {
          id: "claudery",
          title: "Claudery: obuna sotadigan bot va konstruktor",
          body: [
            "Claudery neyrotarmoqlarga obuna sotadigan bot. Mijoz qaysi neyrotarmoq kerakligini yozadi va «Открыть заказ» tugmasini oladi. U saytimizdagi buyurtma sahifasiga olib boradi: mijoz o‘sha yerda ro‘yxatdan obunani tanlaydi va to‘laydi. Biz xizmat emas, tovar sotamiz: ulash va savollarga javob xaridorga bepul yordam sifatida beriladi, to‘lov tizimi bilan shunday kelishilgan.",
            "Botning o‘zida to‘lov va narx haqida bir og‘iz ham yo‘q: Telegram o‘z tizimini chetlab pul oladigan botlarni bloklaydi. Buyurtma darhol lidlarga (mijoz arizalariga) «SI bo‘yicha yordam (Claudery)» turi bilan tushadi. To‘lov tizimi to‘lovni tasdiqlaganda bot mijozga «4. To‘lovdan keyin» qadamidagi matnni yozadi.",
            "«Mijoz nimani ko‘radi» blokida bot qadamlari. Siz so‘zlarni va «Tovarlar: obunalar va narxlar» ro‘yxatini o‘zgartirasiz (oltitagacha qator: nom, nima kiradi, narx) va salomlashuv ostiga to‘rttagacha o‘z tugmangizni qo‘sha olasiz. Shu ro‘yxat vitrinada («Saytdagi vitrina») va ofertada ham ko‘rinadi. Avval to‘laganlarga istalgan obuna narxi «Avval to‘laganlarga chegirma, %» qadar past (odatda 30%).",
            "«Kalitlar» blokida bot tokeni va ikkita Platega kaliti, «Saqlash va tekshirish» tugmasi. Botni egasi va rahbar o‘zgartira oladi. To‘lovdan keyin [loyiha](/admin/projects) o‘zi ochiladi, lidni olib borganga summaning 40% tushadi.",
            "To‘lov tizimining banki hujjatlar va qo‘llab-quvvatlash kontaktini talab qiladi. «Foydalanuvchi kelishuvi» va «Maxfiylik siyosati» vitrina yonidagi tugmalar bilan ochiladi, Claudery har bir sahifasining pastida va botda tugma bo‘lib turadi. «6. Xaridorlarni qo‘llab-quvvatlash» qadamiga e-mail yoki Telegramdagi odamning @username yozing: guruh mos emas. Bo‘sh bo‘lsa, hujjatlarda botning o‘zi ko‘rsatiladi. Platega hisobiga xaridorning Telegramdagi raqami ketadi, shunda to‘lov tizimi takroriy xaridorni taniydi.",
            "Qo‘llab-quvvatlash kontaktlari bir nechta bo‘lishi mumkin, vergul bilan, masalan «@maximov_tech, @Siberian_2»: saytda ular yonma-yon turadi, botda esa har biriga alohida tugma. «7. Saytdagi vitrina» qadamida devuz.studio/claudery sahifasining barcha so‘zlari: sarlavha, tavsif, belgilar, obuna kartasidagi qatorlar, xarid qadamlari, ishonch kartalari, savollar va pastdagi chaqiruv. «Saqlash» bosilgach, o‘zgarish saytda darhol ko‘rinadi. Ro‘yxatdagi bo‘sh qator sahifada ko‘rsatilmaydi. Xizmat, yordam, maslahat, mutaxassis haqidagi so‘zlarni konstruktor saqlamaydi: to‘lov tizimi xizmatlarni emas, obunalar sotuvini kelishgan.",
          ],
        },
        {
          id: "bloggers-agent",
          title: "Blogerlar: agent o‘zi nima qiladi",
          body: [
            "Agent studiyaga mijoz olib kela oladigan O‘zbekiston blogerlarini qidiradi: tadbirkorlar, ekspertlar, marketologlar. U internetda «Agent sozlamalari»dagi so‘rovlar bo‘yicha qidiradi va Instagram profillarini oladi. Bunga kunlik qidiruv kreditlarining o‘z ulushi ketadi, aloqalar uchun kompaniya qidiruvi to‘xtamaydi.",
            "Yoqilgan agent («Agentni yoqish») Toshkent vaqti bilan 9:00 dan 20:00 gacha har besh daqiqada ishlaydi. U topilgan blogerlarni baholaydi yoki yangilarini qidiradi. «Hozir topish» va «Bloger qo‘shish» doim ishlaydi, agent o‘chirilgan bo‘lsa ham.",
            "«Manbalar» qatori nima ulanganini ko‘rsatadi. «Instagram raqamlari» aniq layk va izohlarni beradi, ularsiz agent faqat obunachilar sonini biladi. «Direct yozishmasi» agent blogerlarga o‘zi javob berishi uchun kerak.",
          ],
        },
        {
          id: "bloggers-score",
          title: "Agent blogerni qanday baholaydi",
          body: [
            "Agent blogerga 0 dan 100 gacha ball qo‘yadi. Unda besh qism bor: auditoriya hajmi, faollik darajasi (obunachiga qancha layk va izoh), post chastotasi, O‘zbekiston va mavzu.",
            "10-100 ming obunachisi, 3% dan yuqori faolligi va yangi postlari bor blogerning bali yuqori. Biznes, marketing va IT mavzulari mos keladi. Hazil, o‘yinlar va maktab o‘quvchilari past ball beradi.",
            "«O‘tish bali»dan (odatda 55) past bo‘lsa, bloger «Saralanmaganlar»ga o‘tadi. U yerda uni «Qaytarish» yoki «Qayta baholash» mumkin. Auditoriya shaharlari va yoshini faqat blogerning o‘zi ko‘radi, shuning uchun undan statistika skrinshotlarini so‘rang.",
          ],
        },
        {
          id: "bloggers-send",
          title: "Birinchi xabar: Telegram, Direct, pochta",
          body: [
            "Mos bloger tayyor matn bilan «Yuborishga» ro‘yxatiga tushadi. Unda Telegram bo‘lsa, birinchi bo‘lib studiya ish akkauntidan salom ketadi. Bo‘lmasa, pochtaga yoki Instagram Direct’ga yozamiz. Matndagi shartlar hamkorlik dasturi qoidalaridan olinadi.",
            "Direct va pochtaga odam yuboradi. «Nusxalash va Directni ochish» matnni buferga qo‘yib, yozishmani ochadi. Matnni qo‘ying, studiya akkauntidan yuboring va «Yubordim» tugmasini bosing, bloger «Yozdik, javob kutyapmiz»ga o‘tadi.",
            "Kuniga «Kuniga Direct va pochta»dan (odatda 10) ko‘p yuborib bo‘lmaydi, aks holda Instagram buni spam deb biladi. Norma bajarilsa, tugmalar ertagacha yo‘qoladi. «Mos emas» blogerni ro‘yxatdan olib tashlaydi.",
          ],
        },
        {
          id: "bloggers-partner",
          title: "Bloger javob berdi: suhbat va hamkorlik",
          body: [
            "Bloger javob berdi, endi yozishmani agent olib boradi. Telegram’da u javobni o‘zi ko‘radi, Direct’da ham, agar «Studiya Instagramini ulash» bosilgan bo‘lsa. Direct ulanmaguncha «Javob berdi» tugmasini bosing va suhbatni telefondan olib boring.",
            "Agent darhol o‘zi studiyaning SI yordamchisi ekanini aytadi. U faqat dastur shartlarini aytadi va statistika skrinshotlarini so‘raydi. Ular bo‘yicha auditoriya bali qo‘yiladi, u «Auditoriya» qatorida ko‘rinadi.",
            "Rozi bo‘ldi va auditoriya bali 60 dan yuqorimi? Agent o‘zi hamkor ochadi va blogerga havola yuboradi. Aks holda siz hal qilasiz: «Hamkor qilish» yoki «Rad etdi». «O‘zim olib boraman» agentni 12 soatga o‘chiradi, «Agentga qaytarish» yana yoqadi.",
          ],
        },
        {
          id: "bloggers-keys",
          title: "Instagram ulanishlari: qaysi kalitlar va ularni qayerdan olish",
          roles: ["admin", "head"],
          body: [
            "«Instagram ulanishlari» blokida Meta (Facebook va Instagram kompaniyasi) kalitlari. Ularsiz agent yarim kuch bilan ishlaydi. Kalitni qo‘ying va «Saqlash va tekshirish» tugmasini bosing. Kalit qaytib ko‘rsatilmaydi, faqat «kiritilgan» yoki «bo‘sh» ko‘rinadi.",
            "«1. Boshqa profillar raqamlari» bu Facebook tokeni, u EA bilan boshlanadi. U bilan agent blogerlarning aniq obunachilari, layklari va izohlarini ko‘radi. Token 60 kungacha yashaydi, tugashiga bir hafta qolganda qator sariq bo‘ladi.",
            "«2. Directda blogerlarga javoblar» bu Instagram ilovasining ID va secret’i. Havolali barcha qadamlar blokning o‘zida ochiladi. Meta’dagi ilova e’lon qilinmaguncha agentga faqat test akkauntlari yozadi.",
          ],
        },
        {
          id: "bloggers-access",
          title: "Bo‘lim kimga ochiq",
          roles: ["admin"],
          body: [
            "Yorliq pastida «Bo‘lim kimga ochiq» bloki. Dastlab bo‘lim sizga va rahbarga ochiq. Belgilangan menejer «Blogerlar» yorlig‘ini ko‘radi: xabar yuboradi, javoblarni belgilaydi va suhbat olib boradi, lekin kalitlar va agent sozlamalarini ko‘rmaydi.",
            "Bu [«Jamoa»](/admin/team) → «Bo‘limlar»dagi o‘sha belgi. «Kirishni saqlash» tugmasini bosing, bo‘lim odamga keyingi o‘tishda ochiladi.",
          ],
        },
        {
          id: "bloggers-invite",
          title: "Botdagi «Работа с блогерами» taklifi",
          body: [
            "Bu menejerlarga blogerlar bilan ishlash taklifi. Hozircha u yuborilmaydi, uni egasi yoqadi. Studiya botidan bir marta, kunduzi, «✅ Принять» va «✖ Отклонить» tugmalari bilan keladi.",
            "Javob bir marta yoziladi. «✅ Принять» sizga «Blogerlar» yorlig‘ini ochadi va bot matnlar hamda e’tirozlarga javoblar yozilgan eslatma yuboradi. Rad etib, fikringiz o‘zgardimi? Rahbar yoki egasiga yozing.",
          ],
        },
        {
          id: "bloggers-invite-answers",
          title: "Taklifni kim qabul qildi",
          roles: ["admin", "head"],
          body: {
            admin: [
              "Har bir javob sizga botda natija bilan qator bo‘lib keladi: kim qabul qildi, kim rad etdi, kim jim. Yuborilgan kuni 18:00 da natija bitta xabarda keladi.",
              "Qabul qilganga bo‘limni [«Jamoa»](/admin/team) → «Bo‘limlar» belgisi bilan yopish mumkin. Taklif unga qayta ketmaydi.",
            ],
            head: [
              "Menejerning har bir javobi sizga botda qator bo‘lib keladi. Butun jamoa bo‘yicha natijani 18:00 da egasi oladi.",
              "Qabul qilgan menejer «Blogerlar» yorlig‘ini ko‘radi. Bloger unga «ha» dedimi? Hamkor kartochkasida uni kim olib kelganini belgilang, aks holda bonus hisoblanmaydi.",
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
  channelsLead: "Deyarli hamma muhim narsani bot Telegramga yuboradi: yangi lidlar, vazifalar, eslatmalar, kunlik to‘plam va mijozlar javoblari.",
  channels: [
    {
      name: "Studiya boti",
      url: BOT_URL,
      what: "Asosiy kanal. Bot orqali panelga kirasiz. Yangi lidlar (mijoz arizalari), vazifalar, eslatmalar va mijozlar javoblari ham shu yerga keladi.",
      how: [
        "Botni oching va «Старт» ni bosing. Busiz bot sizga birinchi bo‘lib yoza olmaydi.",
        "Panelga kirish uchun botga /login deb yozing. «🔓 Открыть панель» tugmasi va zaxira havola keladi, havola 15 daqiqa ishlaydi. Bot xabarlari ostidagi qulf belgili «🔓» tugmalar ham panelni darhol ochadi.",
        "Bot «Не смог проверить вход: база сейчас не отвечает» deb javob berdimi? Bu bizdagi nosozlik, bir daqiqa kuting va /login ni qayta yozing. «Такой команды у меня нет» javobi Telegramingiz panelga bog‘lanmaganini bildiradi. Bu haqda rahbarga ayting.",
        "Ovozni o‘chirmang. Yangi lid sizni 30 daqiqa kutadi, keyin navbatdagi odamga ketadi.",
        "Bot qaysi xabarlarni yuborishini egasi va rahbar «Jamoa» bo‘limidagi belgilar bilan hal qiladi. Qaysi lidlarni yuborishni o‘zingiz ham tanlay olasiz: «Sozlamalar», keyin «Meniki». Nimadir kelmayaptimi? Rahbardan so‘rang.",
        "Menejerlar va rahbarlarga: chat pastidagi «▶️ Получать лиды» tugmasi (yoki /leads) kunlik to‘plamdan tashqari kompaniyalarni yuboradi, «⏸ Не получать лиды» o‘chiradi. Batafsil «Sovuq aloqalar» bo‘limida. Mijoz olib kelib foiz olmoqchimisiz? Botga /ref deb yozing.",
      ],
    },
    {
      name: "«Devuz Scout» kanali",
      url: SCOUT_URL,
      what: "Bu yerga skaut (Telegramdagi ochiq chatlarni o‘qiydigan dastur) hozir dasturchi qidirayotgan odamlarni yuboradi. Ertalab xulosa keladi. Batafsil «Skaut signallari» bo‘limida.",
      how: [
        "Havolani oching va kanalga qo‘shiling. Ovozni yoqing: bunday postlar bir-ikki soat yashaydi.",
        "«Сильный сигнал» belgisi bor postga o‘zingiz yozmang. Bir necha daqiqadan keyin u tayyor javob bilan navbat bo‘yicha lid bo‘lib keladi.",
      ],
    },
    {
      name: "Sotuv chati",
      url: null,
      roles: ["admin"],
      what: "Bu yerga har bir lid kartochkasining nusxasi keladi. Hozir sotuv chati bu sizning bot bilan shaxsiy chatingiz. Menejerlarga kartochkalar har biriga shaxsiy chatda keladi.",
      how: [
        "«✅ Взять в работу» va «🗄 Отклонить» tugmalari bu yerda ham, menejerlarda ham ishlaydi. Shaxsiy chat o‘rniga bo‘limning umumiy chatini dasturchi ulaydi.",
      ],
    },
  ],

  rulesTitle: "Uchta qoida",
  rules: [
    "Lidni oldingizmi, demak uni olib boring: status, eslatma, keyingi qadam. Olib bora olmaysizmi? «Navbatga qaytarish» yoki «Berishni so‘rash» ni bosing.",
    "Mijozga biror narsa yuborishga va’da berdingizmi, o‘sha kuni yuboring. Bajarilmagan va’da mijozni yomon saytdan ham tezroq yo‘qotadi.",
    "Nimadir ishlamayaptimi yoki g‘alati ko‘rinyaptimi? Darhol egasiga ayting, kutmang.",
  ],

  askTitle: "Chiqmayaptimi?",
  ask: "Egasiga Telegramda yozing. Taxmin qilgandan ko‘ra so‘ragan yaxshi: deyarli hammasi besh daqiqada tuzatiladi.",
};
