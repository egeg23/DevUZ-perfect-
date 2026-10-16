import type { LearnCopy } from "@/content/learn";

/**
 * Ta’lim — o‘zbekcha (lotin). ru.ts bilan bir xil kalitlar, darslar,
 * abzaslar va variantlar: buni tests/learn.test.ts tekshiradi. Kirill
 * faqat «» ichida: mijoz ruscha yozadigan so‘zlar va bot xabarlari (bot
 * hozircha ruscha yozadi). Birinchi variant — har doim to‘g‘ri javob.
 */
export const uz: LearnCopy = {
  courses: {
    /* ── 1. Ikki qadamli aloqa ─────────────────────────────────────────── */
    hello: {
      title: "Ikki qadamli aloqa",
      summary: "Nega birinchi bo‘lib faqat «Здравствуйте» ketadi, javobdan keyin nima bo‘ladi va javob bo‘lmasa nega boshqa yozmaymiz.",
      lessons: {
        why: {
          title: "Nega avval faqat salom",
          paras: [
            "Notanish odamga ishchi akkaunt birinchi bo‘lib faqat bitta so‘z yozadi: «Здравствуйте». O‘zbek saytiga — «Assalomu alaykum». Buni egasi 07.10.2026 da hal qilgan.",
            "Sababi oddiy. Telegram akkauntga «spam» deb shikoyat qilinsa, uni cheklaydi. Shikoyatni notanish odamdan kelgan uzun xatlarga qilishadi. Salomga bunday shikoyat qilinmaydi: unga «да?» deb javob berishadi yoki jim turishadi.",
            "Cheklangan akkaunt bir kun hech kimga yoza olmaydi. Yangi aloqalar ham, shu raqamdan ketayotgan suhbatlar ham yo‘qoladi. Shuning uchun bitta qisqa so‘z har qanday chiroyli xatdan qimmatroq.",
          ],
        },
        how: {
          title: "Sizda bu qanday ko‘rinadi",
          paras: [
            "Aloqani odatdagidek tayyorlaysiz: «Bog‘lanish», xatni o‘qiysiz, «Yuborish». Birinchi bo‘lib salom ketadi. Xatning o‘zi mijoz javob berguncha kartochkada kutib turadi. Kartochkada salom ketgani va dumaloq video yoki xat mijoz javob berganda ketishi yozilgan bo‘ladi.",
            "Aloqalar soni, kunlik to‘plam va «soatiga uchta» hisobiga salomning o‘zi kiradi. Telegram uchun notanish odamga birinchi xabar — bu aloqa.",
            "Birinchi xabarlar bitta akkauntdan soatiga uchtadan ko‘p emas va faqat Toshkent vaqti bilan 07:30 dan 20:30 gacha ketadi. Javob berganlar bilan yozishma istalgan vaqtda davom etadi.",
          ],
        },
        after: {
          title: "Javobdan keyin nima bo‘ladi",
          paras: [
            "Ruscha javob berdi («Здравствуйте», «да?», «кто это?») — ikki daqiqadan keyin ruscha dumaloq video ketadi. O‘zbekcha javob berdi — o‘zbekcha dumaloq video. Boshqa tilda javob berdi — uch daqiqadan keyin uning tilida, salomsiz xat ketadi.",
            "«Не пишите» yoki «позвоните» deb javob berdi — hech narsa ketmaydi. Bot sizni chaqiradi va mijoz faqat salomni ko‘rganini yozadi. Keyin o‘zingiz hal qilasiz.",
            "Javob bermadi — boshqa hech narsa ketmaydi. Bitta salomdan keyin qayta yozish yo‘q. Sayt tekshiruviga uch kundan ko‘p bo‘lsa, xat ham ketmaydi: bot sizni chaqiradi, saytni tekshirib, o‘zingiz yozing.",
          ],
        },
        dont: {
          title: "Nima qilmaslik kerak",
          paras: [
            "Ketidan ikkinchi salom, «siz shu yerdamisiz?» yoki «javob bering, iltimos» deb yozmang. Shikoyat aynan shunga bo‘ladi.",
            "Mijoz javob bermaguncha sayt haqidagi xatni qo‘lda yubormang. Xatni salom bilan boshlamang: salom alohida xabar bo‘lib allaqachon ketgan.",
            "Notanish odamlarga kechasi va shaxsiy raqamdan navbatni chetlab yozmang. Navbat uzun bo‘lsa, o‘sha ishchi akkauntdan o‘zingiz yozing va «O‘zim bog‘landim» tugmasini bosing.",
          ],
        },
      },
      quiz: {
        first: {
          q: "Notanish kompaniyaga ishchi akkauntdan birinchi bo‘lib nima ketadi?",
          options: ["Faqat «Здравствуйте» (o‘zbek saytiga — «Assalomu alaykum»)", "Tezislar bilan sayt haqidagi xat", "Maket taklifi bilan dumaloq video", "Maket shartlariga havola"],
          why: "Birinchi bo‘lib faqat salom ketadi. Xat va dumaloq video — javobdan keyin.",
        },
        spam: {
          q: "Nega darhol uzun xat yozmaymiz?",
          options: ["Telegram «spam» shikoyatlari uchun akkauntni cheklaydi, shikoyatni esa notanishlarning uzun xatlariga qilishadi", "Uzun xat qimmatroq turadi", "Mijozlar ruscha o‘qimaydi"],
          why: "Cheklangan akkaunt bir kun hech kimga yozmaydi, shuning uchun birinchi bo‘lib bitta so‘z ketadi.",
        },
        silent: {
          q: "Mijoz uch kundan beri salomga javob bermayapti. Nima qilamiz?",
          options: ["Hech narsa: bitta salomdan keyin qayta yozish yo‘q", "«Siz shu yerdamisiz?» deb yozamiz", "Javobsiz sayt haqidagi xatni yuboramiz"],
          why: "Javobsiz boshqa hech narsa ketmaydi — na xat, na eslatma.",
        },
        who: {
          q: "Mijoz ruscha javob berdi: «Кто это?». Nima ketadi?",
          options: ["Ikki daqiqadan keyin ruscha dumaloq video", "Darhol tezislar bilan xat", "Hech narsa, suhbat odamga beriladi"],
          why: "«да?», «кто это?» — salomga oddiy javob. Ruscha javobga dumaloq video ketadi.",
        },
        call: {
          q: "Salomga «Позвоните мне» deb javob berishdi. Nima bo‘ladi?",
          options: ["Xat ketmaydi, bot sizni chaqiradi va mijoz faqat salomni ko‘rganini yozadi", "Dumaloq video ketadi", "Sayt haqidagi xat ketadi"],
          why: "Qo‘ng‘iroq so‘rovi va rad javobi — har doim odamga, xatsiz.",
        },
        count: {
          q: "Aloqalar soni va kunlik to‘plam hisobiga nima kiradi?",
          options: ["Salomning o‘zi", "Faqat javobdan keyingi xat", "Faqat mijozning javobi"],
          why: "Telegram uchun aloqa — notanish odamga birinchi xabar, ya’ni salom.",
        },
      },
    },

    /* ── 2. Dumaloq video ──────────────────────────────────────────────── */
    circle: {
      title: "Dumaloq video",
      summary: "Dumaloq videoda nima bor, kimga qaysi til ketadi, bot uni qayerdan oladi va qachon uning o‘rniga xat ketadi.",
      lessons: {
        what: {
          title: "Dumaloq video nima",
          paras: [
            "Dumaloq video — studiyadan Telegramdagi qisqa video. Unda o‘zimizni tanishtiramiz va 12 soat ichida ularning sayti bosh sahifasining ishlaydigan maketini bepul tayyorlashni taklif qilamiz. Bu hech narsaga majburlamaydi. Oxirida iltimos: qiziq bo‘lsa, «+» yuboring.",
            "Dumaloq videoning o‘zi taklif. Uning ketidan xat ketmaydi. Mijoz «+» yoki «ha» deb javob beradi — biz maket tayyorlaymiz.",
            "Egasi, 07.10.2026: javobdan keyin — dumaloq video va qisqa matn. Tirik yuz va ovoz notanish odamning matnidan ko‘ra ko‘proq ishonch uyg‘otadi.",
          ],
        },
        lang: {
          title: "Qaysi dumaloq video ketadi",
          paras: [
            "Ruscha javob berdi — ruscha dumaloq video ketadi. O‘zbekcha — o‘zbekcha. So‘zsiz javob (stiker, «+») salom tilida hisoblanadi. Boshqa tilda javob berdi — uch daqiqadan keyin uning tilida xat.",
            "Dumaloq video javobdan ikki daqiqa keyin, o‘sha ishchi akkauntning «Saqlangan xabarlar»idan nusxa sifatida ketadi, uzatish emas. Bir soniyada kelgan javob robotga o‘xshaydi.",
            "Ruscha dumaloq video — «Saqlangan xabarlar»dagi oxirgisi. O‘zbekchasi — faqat botning o‘zi qo‘ygan va eslab qolgani. Videodan tilni bilib bo‘lmaydi, shuning uchun o‘zbekcha dumaloq video ishga faqat «Akkauntlar» bo‘limi yoki tilni tugmalar bilan so‘raydigan studiya boti orqali tushadi.",
          ],
        },
        fail: {
          title: "Qachon dumaloq video o‘rniga xat ketadi",
          paras: [
            "«Saqlangan xabarlar»da kerakli tildagi dumaloq video yo‘q — uning o‘rniga xat ketadi. Qabul qiluvchi ovozli va video xabarlarni taqiqlagan — yana xat, uning javobi tilida. Egasi, 09.10.2026: ovozli va dumaloq videolar taqiqlanganlarga javob tilida yozamiz.",
            "Soat 18:00 dagi hisobot kun davomida dumaloq video necha marta ketmaganini aytadi. 08.10.2026 da butun kun shunday sezilmay o‘tgan — shuning uchun bu son endi hisobotda.",
            "Dumaloq videolarni rahbar va egasi yuklaydi: «Akkauntlar» → «Aloqalar uchun dumaloq video» → «Ruscha dumaloq video» yoki «O‘zbekcha dumaloq video», bir daqiqagacha MP4 fayl, «Dumaloq videoni yuklash». Yoki videoni studiya botiga uzatishadi — bot tilni so‘raydi. O‘n daqiqa ichida bot uni har bir akkauntning «Saqlangan xabarlar»iga o‘zi qo‘yadi.",
          ],
        },
        record: {
          title: "Yaxshi dumaloq videoni qanday yozish kerak",
          paras: [
            "Bir daqiqagacha. Yuz kadrda, yorug‘, jim joy. Diktor kabi emas, ofisdagi hamkasb bilan gaplashgandek xotirjam gapiring.",
            "Bitta fikr: kimsiz, ularning saytini ko‘rganingiz va 12 soatda bosh sahifa maketini bepul tayyorlashingiz. Oxirida bitta iltimos: qiziq bo‘lsa, plyus yuboring.",
            "Narxsiz, «kafolat beramiz»siz, «topga chiqaramiz»siz, texnik so‘zlarsiz. 12 soatdan boshqa muddat aytmang: studiya boshqasini va’da qilmagan.",
          ],
        },
      },
      quiz: {
        offer: {
          q: "Dumaloq video nimani taklif qiladi?",
          options: ["12 soatda bosh sahifaning bepul ishlaydigan maketi va «+» yuborish iltimosi", "Saytga chegirma", "Menejer bilan qo‘ng‘iroq"],
          why: "Dumaloq video — bitta taklif va bitta iltimos: 12 soatda maket, javobga «+».",
        },
        uz: {
          q: "Mijoz «Assalomu alaykum» deb javob berdi. Nima ketadi?",
          options: ["O‘zbekcha dumaloq video", "Ruscha dumaloq video", "Ruscha xat"],
          why: "Dumaloq video tili — javob tili: o‘zbekcha javobga o‘zbekcha video ketadi.",
        },
        other: {
          q: "Mijoz inglizcha javob berdi. Nima ketadi?",
          options: ["Uch daqiqadan keyin inglizcha, salomsiz xat", "Ruscha dumaloq video", "Hech narsa"],
          why: "Dumaloq video faqat ruscha va o‘zbekcha bor. Boshqa til — shu tilda xat.",
        },
        forbidden: {
          q: "Qabul qiluvchi ovozli va video xabarlarni taqiqlagan. Nima bo‘ladi?",
          options: ["Dumaloq video o‘rniga uning javobi tilida xat ketadi", "Dumaloq video bir soatdan keyin qayta yuboriladi", "Aloqa yopiladi"],
          why: "Dumaloq video o‘tmadi — o‘rniga mijoz tilida xat.",
        },
        letter: {
          q: "Dumaloq videodan keyin xat yuborish kerakmi?",
          options: ["Yo‘q: dumaloq videoning o‘zi taklif", "Ha, har doim tezislar bilan xat", "Ha, bir kundan keyin"],
          why: "Dumaloq videodan keyin xat ketmaydi — mijoz «+» yuboradi yoki savol beradi.",
        },
        upload: {
          q: "O‘zbekcha dumaloq video ishga qanday tushadi?",
          options: ["«Akkauntlar» → «O‘zbekcha dumaloq video» orqali yoki tilni so‘raydigan studiya boti orqali", "«Saqlangan xabarlar»ga qo‘lda qo‘yish — bot tilni videodan biladi", "Mijozga o‘zingiz yuborish"],
          why: "Videodan tilni bilib bo‘lmaydi, shuning uchun bot faqat o‘zi qo‘ygan o‘zbekcha videoni oladi.",
        },
      },
    },

    /* ── 3. «+» — maketga rozilik ──────────────────────────────────────── */
    plus: {
      title: "«+» — maketga rozilik",
      summary: "Qaysi javoblar «ha, maket kerak» degani, bot o‘zi nima qiladi, prototipni kim oladi va maket shartlari qanday ishlaydi.",
      lessons: {
        yes: {
          title: "Nima rozilik hisoblanadi",
          paras: [
            "«+», «plyus» — har doim ha. Dumaloq videoga javoban «ha» ham shu ma’noda: «да», «давайте», «делайте», «хорошо, жду», «хочу», «ок», «ha», «mayli», «qiling».",
            "Maket yoki prototip haqida har qanday gap ham rozilik: «да, соберите», «хочу макет», «prototip yig‘ib bering».",
            "Savol belgisi bilan «да?» — rozilik emas, savol. Uni odam ko‘rib chiqadi. Qisqa va tushunarsiz javobga model ham tegmaydi — sizni chaqiradi.",
          ],
        },
        after: {
          title: "Darhol nima bo‘ladi",
          paras: [
            "Mijozga o‘zi javob ketadi: bepul maket tayyorlanayotgani va tayyor bo‘lishi bilan havola yuborilishi haqida — va uning tilida maket shartlariga havola.",
            "Aloqa muallifiga «🛠 Хотят прототип» xabari «🛠 Беру прототип» tugmasi bilan keladi. Birinchi 30 daqiqa prototip faqat unda.",
            "Yarim soatda olmasa — butun jamoaga «🔥 Нужен прототип — бери срочно» ketadi. Kim birinchi bossa, lid va yozishma o‘shaniki. Kechasi xabar 07:00 gacha kutadi.",
          ],
        },
        terms: {
          title: "Shartlar: «roziman»siz havola",
          paras: [
            "Shartlarga havola tanishib chiqish uchun o‘zi ketadi. Javobda rozilik so‘ramaymiz. Shartlar harakat bilan qabul qilinadi: mijoz loyiha haqida yozishmani davom ettiradi, maketni oladi yoki ochadi.",
            "Shartlardan faqat maketni olgunga qadar voz kechish mumkin. Havolani takrorlash shart emas — u allaqachon ketgan. Yozishma Telegramda bo‘lmasa, bu javob aloqa kartochkasida kutadi: uni o‘zingiz yuboring.",
            "Shartlardagi javobgarlik bandini yumshatmaymiz va og‘zaki muhokama qilmaymiz: shartnoma bo‘lmaguncha bu ishimizning himoyasi.",
          ],
        },
        deadline: {
          title: "12 soat va parol",
          paras: [
            "Maketni odam yig‘adi, bot ularni o‘zi tayyorlamaydi. Mijozga havola — va’da qilinganidek 12 soat ichida. Muddatdan 2 soat oldin eslatma o‘zi qo‘yiladi.",
            "Maket parol bilan yopiladi: «Maketlar» → «Parol yaratish». Besh raqam, 24 soat amal qiladi. «Mijoz uchun nusxalash» tayyor matn beradi: havola, parol, u qaysi soatgacha amal qilishi va shartlarga havola.",
            "Har bir mijozga — o‘z paroli. Parol bir marta ko‘rsatiladi: yo‘qotsangiz, yangisini yarating.",
          ],
        },
      },
      quiz: {
        go: {
          q: "Mijoz dumaloq videoga «давайте» deb javob berdi. Bu nima?",
          options: ["Maketga rozilik: bot shartlarga havola bilan «maket tayyorlayapmiz» deb javob beradi", "Tushunarsiz javob, uni odam ko‘radi", "Rad javobi"],
          why: "Dumaloq videoga «давайте», «да», «делайте» — «+» bilan bir xil.",
        },
        agree: {
          q: "Mijozdan «shartlarga rozimisiz?» deb so‘rash kerakmi?",
          options: ["Yo‘q: shartlar harakat bilan qabul qilinadi — loyiha haqida yozishma, maketni olish yoki ochish", "Ha, «roziman»siz maket qilmaymiz", "Ha, pochta orqali yozma ravishda"],
          why: "Qabul — harakat bilan. «Rozimisiz?» deb so‘rash mijozni foydasiz to‘xtatadi.",
        },
        minutes: {
          q: "Prototip necha daqiqa faqat aloqa muallifida bo‘ladi?",
          options: ["30 daqiqa", "12 soat", "5 daqiqa"],
          why: "Yarim soat muallifda, keyin butun jamoaga «🔥 Нужен прототип».",
        },
        hours: {
          q: "Maketni qancha muddatda va’da qilamiz?",
          options: ["12 soat", "3 kun", "Bir hafta"],
          why: "Dumaloq video va xatda — 12 soat. Studiya boshqa muddat va’da qilmaydi.",
        },
        question: {
          q: "Dumaloq videoga savol belgisi bilan «да?» deb javob berishdi. Bu nima?",
          options: ["Savol — uni odam ko‘rib chiqadi", "Maketga rozilik", "Rad javobi"],
          why: "Savol belgisi bilan bu allaqachon savol, «ha» emas.",
        },
        refuse: {
          q: "Mijoz maket shartlaridan qachongacha voz kecha oladi?",
          options: ["Faqat maketni olgunga qadar", "Istalgan vaqtda, keyin ham", "Voz kechib bo‘lmaydi"],
          why: "Maketni oldi yoki ochdi — shartlar qabul qilingan.",
        },
      },
    },

    /* ── 4. E’tirozlar ─────────────────────────────────────────────────── */
    objections: {
      title: "E’tirozlar",
      summary: "«Qimmat», «vaqt yo‘q», «saytimiz bor», «kimsiz», «tijoriy taklif yuboring», «qo‘ng‘iroq qiling» va rad javobiga tayyor javoblar.",
      lessons: {
        rules: {
          title: "Umumiy qoidalar",
          paras: [
            "Qisqa va oddiy tilda javob bering. Avval aytilganni tan oling, keyin mijoz uchun foydaga va bitta yengil qadamga — 12 soatda bepul maketga qaytaring.",
            "Aloqada narx yo‘q: na xatda, na qayta yozishda narx aytmaymiz. Mijozlar saytida narxlar odatda rasm ko‘rinishida, bot ularni ko‘rmaydi. Narx — vazifa tushunarli bo‘lganda odamning suhbati.",
            "Mumkin emas: bahslashish, bosim o‘tkazish, «kafolat beramiz», «topga chiqaramiz», foizlar. Texnik so‘zlar ham mumkin emas: «server», «indeksatsiya», «SEO», xato kodlari. Mijoz ularni bilmaydi.",
          ],
        },
        price: {
          title: "«Qimmat» va «vaqt yo‘q»",
          paras: [
            "«Qancha turadi?» yoki «Qimmat». Javob: «Tushunaman. Narx vazifaga bog‘liq. Bosh sahifa maketini bepul tayyorlaymiz — ko‘rib, davom ettirish kerakmi, o‘zingiz hal qilasiz. Tayyorlab beraylikmi?» Raqamni darhol aytmang: vazifasiz u doim katta ko‘rinadi.",
            "«Vaqt yo‘q». Javob: «Sizdan hech narsa kerak emas: maketni 12 soatda o‘zimiz tayyorlaymiz, bo‘sh daqiqangizda ko‘rasiz. Tayyor bo‘lganda yuboraymi?»",
            "Ikkala javobning ma’nosi bitta: tavakkalni olib tashlaymiz. Bepul, tez va hech narsaga majburlamaydi.",
          ],
        },
        site: {
          title: "«Saytimiz bor» va «kimsiz?»",
          paras: [
            "«Saytimiz bor». Javob: «Ha, aynan uni ko‘rdik. Masalan, bosh sahifada telefon raqamini topib bo‘lmaydi va xaridorlarning bir qismi ketib qoladi. Maket buni boshqacha qanday ko‘rinishini ko‘rsatadi. Ko‘rsataymi?» Faktni faqat haqiqiy tekshiruvdan oling, o‘zingizdan topilma o‘ylab topmang.",
            "Ularning sayti «yomon» yoki «eskirgan» demang. Odam uni buyurtma qilgan va pul to‘lagan. Xaridorlar haqida gapiring: ular nimani topa olmaydi va qayerga ketadi.",
            "«Kimsiz?» yoki «Raqamimni qayerdan oldingiz?». Javob: «Bu DevUz studiyasidan [ism], biz sayt qilamiz. Kontaktni saytingizdan oldik. Uni ko‘rib, murojaatlar qayerda yo‘qolayotganini topdik». Rost va qisqa.",
          ],
        },
        stop: {
          title: "«Taklif yuboring», «qo‘ng‘iroq qiling», rad javobi",
          paras: [
            "«Tijoriy taklif yuboring», «pochtaga tashlang». Model taklifni o‘zi yubormaydi va sizni chaqiradi. O‘sha kuni o‘zingiz yuboring. Avval vazifa haqida bitta narsani aniqlasangiz yaxshi: vazifasiz taklif — bu narxlar ro‘yxati, uni esa faqat narx bo‘yicha solishtirishadi.",
            "«Qo‘ng‘iroq qiling». Imkon qadar tez o‘zingiz qo‘ng‘iroq qiling: model qo‘ng‘iroq qilmaydi, u sizni allaqachon chaqirgan. Qo‘ng‘iroqdan oldin kartochkani oching: sayt, tezislar, mijoz nima yozgan.",
            "«Qiziq emas», «yozmang». Boshqa hech narsa yozmang: bunday iltimosdan keyingi xabar — akkauntni bloklashga sabab. «🙅 Клиент отказался» tugmasini bosing — aloqa yopiladi, qayta yozish ketmaydi.",
          ],
        },
      },
      quiz: {
        price: {
          q: "Mijoz birinchi javobida «Qancha turadi?» deb so‘radi. Nima deyish kerak?",
          options: ["Raqamni darhol aytmaslik: narx vazifaga bog‘liq, bepul maketni taklif qilish", "Darhol eng arzon narxni aytish", "Chegirma va’da qilish"],
          why: "Vazifasiz har qanday raqam katta ko‘rinadi. Avval foyda va bepul qadam.",
        },
        stop: {
          q: "Mijoz «Не пишите больше» deb yozdi. Nima qilish kerak?",
          options: ["Hech narsa yozmaslik va «🙅 Клиент отказался» tugmasini bosish", "Kechirim so‘rab, dumaloq video yuborish", "Uch kundan keyin yana yozish"],
          why: "«Yozmang»dan keyingi xabar — shikoyat va akkaunt cheklovi uchun sabab.",
        },
        kp: {
          q: "«Taklifni pochtaga yuboring». Kim va qachon yuboradi?",
          options: ["O‘zingiz, o‘sha kuni: model faqat sizni chaqiradi", "Model o‘zi yuboradi", "Hech kim, bu bahona"],
          why: "Modelga biror narsa yuborishni va’da qilish taqiqlangan. Bu sizning ishingiz, bugunoq.",
        },
        site: {
          q: "«Saytimiz bor». Eng yaxshi javob qaysi?",
          options: ["Rozi bo‘lish, haqiqiy tekshiruvdan bitta topilmani aytish va bepul maketni taklif qilish", "Ularning sayti yomon deyish", "Saytni «topga» chiqarishni va’da qilish"],
          why: "Xaridorlar va bitta fakt haqida gapiramiz, sayt yomonligi haqida emas.",
        },
        jargon: {
          q: "Mijozga qaysi so‘zlarni yozib bo‘lmaydi?",
          options: ["Texnik so‘zlar: «server», «indeksatsiya», «SEO», xato kodlari", "«maket» va «bepul»", "Uning kompaniyasi nomi"],
          why: "Mijoz texnik tilni bilmaydi. Xaridor nimani ko‘rishi va qilishini yozamiz.",
        },
        call: {
          q: "Mijoz «Qo‘ng‘iroq qiling» deb so‘radi. Nima qilish kerak?",
          options: ["Imkon qadar tez o‘zingiz qo‘ng‘iroq qilish: model qo‘ng‘iroq qilmaydi va sizni allaqachon chaqirgan", "Dumaloq video bilan javob berish", "Sayt haqidagi xatni yuborish"],
          why: "Qo‘ng‘iroq so‘rovi — har doim odamga. Qo‘ng‘iroq qanchalik tez bo‘lsa, suhbat shunchalik iliq.",
        },
      },
    },

    /* ── 5. Xat yondashuvlari ──────────────────────────────────────────── */
    letters: {
      title: "Xat yondashuvlari: PAS, savol, «o‘z sohasida»",
      summary: "Javobdan keyingi xat qanday tuzilgan, sotuv kurslaridan uchta yondashuv avtoaloqaning haqiqiy matnlarida va matnlarni qanday halol solishtirish.",
      lessons: {
        texts: {
          title: "Xatni model emas, matn yozadi",
          paras: [
            "Sayt haqidagi xat matndan yig‘iladi: o‘z matningiz (ikkitagacha — bu A/B) → jamoaning umumiy matnlari → avtoaloqa yondashuvlari. Sayt haqidagi faktlar tezis bo‘lib o‘zi qo‘yiladi: nima noto‘g‘ri, bu nimaga olib keladi va, bo‘lsa, uning sohasidagi loyihamiz.",
            "O‘rniga qo‘yiladiganlar: {kim} — «Bu DevUz studiyasidan [ism]», {sayt}, {tezislar}, {prototip} — 12 soatda bepul prototip haqidagi ibora.",
            "Tekshiruv qoidalari: 12 dan 100 so‘zgacha (lotin yozuvida — 130 gacha), boshida salomsiz, texnik so‘zlarsiz, foizlarsiz va «topga»siz. Raqamlar — faqat tezislardan va «12 soat». Uning sohasidan bo‘lmagan boshqa loyihani aytish mumkin emas.",
          ],
        },
        pas: {
          title: "PAS: muammo → nimaga olib keladi → yechim",
          paras: [
            "PAS — muammo, kuchaytirish, yechim. Avval uning sayti haqida fakt, keyin bu xaridorlar uchun nimaga olib kelishi, keyin yechim va bitta yengil savol.",
            "Mana avtoaloqadagi «Og‘riq va yechim» yondashuvining haqiqiy matni (ruscha shablon). Tezislar birinchi ikki qadamni qiladi, {prototip} — uchinchisini, oxiridagi savol esa «ha» deyish oson bo‘lgan yengil savol.",
          ],
        },
        spin: {
          title: "SPIN savoli",
          paras: [
            "SPIN — savollar bilan sotish. Eng kuchlisi — uning yo‘qotishlari haqidagi chiqaruvchi savol. Uning puli haqidagi savol biz haqimizdagi hikoyadan ko‘ra diqqatni uzoqroq ushlab turadi.",
            "Mana «Savol» yondashuvining matni. U savol bilan ochiladi, keyin faktlar, keyin taklif. Oxiridagi savol yana javob berishga chaqiradi.",
          ],
        },
        rival: {
          title: "«O‘z sohasida»",
          paras: [
            "Birinchi qatordayoq ijtimoiy isbot: biz allaqachon uning sohasida ishlaymiz. Biznes egasi o‘xshash kompaniyalar uchun qilingan ishga ishonadi.",
            "Bu yondashuv faqat uning sohasida bizda haqiqatan loyiha bo‘lsa olinadi — unda tezislarda unga havola bo‘ladi. O‘ylab topilgan keysni mijoz bitta o‘tish bilan tekshiradi. Mana yondashuv matni:",
          ],
        },
        ab: {
          title: "A/B: halol va shoshilmasdan",
          paras: [
            "Ikkita o‘z matningiz — bu A/B: aloqalar ular orasida tasodifiy va teng bo‘linadi. Aloqa qaysi matn bilan ketganini eslab qoladi.",
            "Har bir matnga kamida 20 tadan xat ketmaguncha, panel xulosa qilishga erta deb yozadi. O‘nta xatda istalgan matn tasodifan yutadi.",
            "Matnni tahrirlash hisobni buzmaydi: eskisi o‘z statistikasi bilan arxivga ketadi, yangisi noldan hisoblanadi. «Aloqalar» → «Xat matnlari va A/B» bo‘limida yozing.",
          ],
        },
      },
      quiz: {
        pas: {
          q: "PAS nima degani?",
          options: ["Muammo → nimaga olib keladi → yechim va bitta yengil savol", "Narx → chegirma → muddat", "Salom → studiya haqida → narxlar"],
          why: "PAS: Problem, Agitate, Solve — fakt, oqibat, yechim.",
        },
        rival: {
          q: "«O‘z sohasida» yondashuvi bilan qachon yozish mumkin?",
          options: ["Faqat mijoz sohasida bizda haqiqatan loyiha bo‘lsa", "Har doim", "Faqat o‘zbek saytlariga"],
          why: "Havolali haqiqiy loyihasiz bu bo‘sh va’da.",
        },
        words: {
          q: "Xatda nechta so‘z bo‘lishi mumkin?",
          options: ["12 dan 100 gacha", "40 dan 300 gacha", "Xohlagancha"],
          why: "Bu yozishmadagi replika: telefonda uzun matn oxirigacha o‘qilmaydi.",
        },
        numbers: {
          q: "Matnda o‘zingizdan qaysi raqamni yozish mumkin?",
          options: ["Faqat «12 soat» — qolgan raqamlar tezislardan olinadi", "Sotuv o‘sishining istalgan foizi", "«3 kunda qilamiz»"],
          why: "Tekshiruvda yo‘q raqam — studiya bermagan va’da.",
        },
        ab: {
          q: "A/B da qaysi matn yaxshiroq ekanini qachon aytish mumkin?",
          options: ["Har bir matnga kamida 20 ta xat ketgandan keyin", "Birinchi uchta javobdan keyin", "Tahrirdan darhol keyin"],
          why: "Kam xatda istalgan matn tasodifan yutishi mumkin.",
        },
        spin: {
          q: "«Savol» yondashuvi nima bilan ochiladi?",
          options: ["Uning yo‘qotishlari haqidagi savol bilan: sayt qancha murojaat yo‘qotishini bilasizmi?", "Studiya haqidagi hikoya bilan", "Narx bilan"],
          why: "SPIN dan chiqaruvchi savol — mijozning puli haqida, biz haqimizda emas.",
        },
      },
    },

    /* ── 6. Iliq lidlar ────────────────────────────────────────────────── */
    warm: {
      title: "Iliq lidlar",
      summary: "Iliq lidlar navbati qanday ishlaydi, lidni qanday olish kerak, tezlik nega muhim va lidni hamkasbga qanday berish kerak.",
      lessons: {
        queue: {
          title: "Iliq lidlar navbati",
          paras: [
            "Lidlar tezroq bosganga emas, navbat bilan beriladi. Kunduzi, 08:00 dan 18:00 gacha, yangi lid bir odamga 30 daqiqaga taklif qilinadi — oy davomida «oldi + o‘tkazib yubordi» eng kam bo‘lganga. Kartochka: «⏳ Лид ваш на 30 минут».",
            "Yarim soatda olinmasa — lid keyingisiga ketadi, o‘tkazib yuborish esa olingan imkoniyat hisoblanadi. Butun aylanada hech kim olmasa — lid hammaga ochiladi.",
            "Kechasi, 18:00 dan 08:00 gacha, lid darhol hammaga ochiq, lekin oyiga teng ulushdan ko‘p olib bo‘lmaydi.",
            "Avtoaloqaga javob «🤖 Ответ на касание автопрогона» sarlavhasi bilan keladi va o‘sha navbat bilan boradi. O‘z aloqalaringizdan kelgan lidlar navbatga kirmaydi — ular darhol sizniki.",
          ],
        },
        take: {
          title: "Lidni qanday olish kerak",
          paras: [
            "Telegramda «✅ Взять в работу» yoki kartochkada «O‘zimga olish». Shundan keyin lid sizniki, holati «ishda», 4 soatdan keyin «nima keyin?» eslatmasi keladi.",
            "Mijoz kontakti va yozishma faqat olgandan keyin ochiladi. Har bir ochilish jurnalga yoziladi — yozmoqchi bo‘lganingizda oching.",
            "Oldingiz, lekin yurita olmaysiz — «Navbatga qaytarish». Telegramdagi «🗄 Отклонить» «mijoz bizga kerak emas» degani: lid «qoldirilgan» bo‘ladi va jurnalda kim hal qilgani ko‘rinadi.",
          ],
        },
        speed: {
          title: "Tezlik va ohang",
          paras: [
            "Mijoz hozirgina yozdi. Bir soatdan keyin u boshqa studiya bilan gaplashayotgan bo‘ladi. Birinchi daqiqalarda javob bering.",
            "«O‘zim javob beraman»ni bosmaguningizcha model sizning nomingizdan javob beradi. Mijozga faqat aloqa ketgan ishchi akkauntdan javob bering: boshqa raqamdan xabar u uchun notanish odam.",
            "Har bir suhbatdan keyin holatni o‘zgartiring. Harakatsiz lid «Zudlik bilan bog‘lanish»ga tushadi: issiq — 2 kundan, iliq — 3 kundan keyin. Chiqmadi — tashlab qo‘ymang, «yutqazilgan» qo‘ying.",
          ],
        },
        handover: {
          title: "Lidni hamkasbga berish",
          paras: [
            "Kartochkada «Berish»: kimga va nega, keyin «Berishni so‘rash». Rahbar yoki egasi Telegramda tugmalar bilan tasdiqlamaguncha lid sizda qoladi.",
            "Aloqadan kelgan lid yozishma bilan birga ketadi: mijoz javoblari, qayta yozish va model imzosi endi hamkasbda. Bo‘sh lid berilmaydi — uni olishadi.",
            "Hamkordan kelgan lid navbatni chetlab o‘tadi: darhol hammaga, hech kim olmaguncha bot har 15 daqiqada eslatadi. Hamkor mijoz uchun kafil bo‘lgan — birinchi bo‘lib qo‘ng‘iroq qiling.",
          ],
        },
      },
      quiz: {
        day: {
          q: "Kunduzi iliq lid keldi. U kimga taklif qilinadi?",
          options: ["Bir odamga 30 daqiqaga — oy davomida «oldi + o‘tkazib yubordi» eng kam bo‘lganga", "Hammaga: birinchi bosgan oladi", "Faqat rahbarga"],
          why: "Kunduzi — navbat bilan, har kimga yarim soatdan.",
        },
        missed: {
          q: "Lidni 30 daqiqada olmadingiz. Keyin nima?",
          options: ["Lid keyingisiga ketadi, o‘tkazib yuborish olingan imkoniyat hisoblanadi", "Lid sizni kechgacha kutadi", "Lid o‘chiriladi"],
          why: "Aks holda ta’tildagi odam har bir lidni yarim soat ushlab turardi.",
        },
        contact: {
          q: "Mijoz kontaktini qachon ochish mumkin?",
          options: ["Faqat «O‘zimga olish»dan keyin; har bir ochilish jurnalga yoziladi", "Darhol, hammaga", "Faqat rahbarga"],
          why: "Kontakt — faqat lid egasiga va jurnalga yozuv bilan.",
        },
        transfer: {
          q: "Lidni hamkasbga bermoqchisiz. Qanday?",
          options: ["Sabab bilan «Berishni so‘rash» — rahbar yoki egasi tasdiqlaydi", "Hamkasbga kontaktni shaxsiy xabarda tashlash", "«🗄 Отклонить»ni bosish"],
          why: "Berish tasdiq orqali boradi: lid ikki odam orasida osilib qolmaydi.",
        },
        account: {
          q: "Aloqadan kelgan mijozga qaysi akkauntdan javob berish kerak?",
          options: ["Faqat aloqa ketgan ishchi akkauntdan", "Istalgan shaxsiy akkauntdan", "Har doim asosiy akkauntdan"],
          why: "Mijoz uchun bu bitta suhbatdosh. Boshqa raqam — notanish.",
        },
        release: {
          q: "Lidni oldingiz, lekin yurita olmaysiz. Nimani bosish kerak?",
          options: ["«Navbatga qaytarish»", "«yutqazilgan»", "Hech narsa, lid o‘zi ketadi"],
          why: "«Navbatga qaytarish» lidni hammaga ochadi va eslatmalaringizni olib tashlaydi.",
        },
      },
    },
  },

  /* ── Panel bo‘yicha test ──────────────────────────────────────────────── */
  panel: {
    title: "Panel bo‘yicha test",
    summary: "Sizga ochiq bo‘limlar bo‘yicha savollar. Xato qilsangiz — yonida yo‘riqnomaning kerakli bandiga havola.",
    questions: {
      "lead-queue": {
        q: "Kunduzi navbatdagi lid sizga taklif qilindi. U qancha vaqt faqat sizniki?",
        options: ["30 daqiqa", "4 soat", "Kun oxirigacha"],
        why: "Kunduzi lid bir odamda yarim soat turadi, keyin keyingisiga ketadi.",
      },
      "lead-reject": {
        q: "Telegramda lid kartochkasi ostidagi «🗄 Отклонить» nima degani?",
        options: ["«Mijoz bizga kerak emas»: lid bosgan odamga biriktiriladi va «qoldirilgan» bo‘ladi", "Lid navbatdagi keyingi odamga ketadi", "Lid izsiz o‘chiriladi"],
        why: "Rad javobining muallifi bo‘lishi kerak — shuning uchun lid avval sizga biriktiriladi.",
      },
      "lead-contact": {
        q: "Kartochkada «Kontaktni ko‘rsatish» qachon ochiladi?",
        options: ["Faqat olingan lid bo‘yicha va har bir ochilish jurnalga yoziladi", "Lidni ko‘rgan hammaga darhol", "Faqat egasiga"],
        why: "Kontakt — «O‘zimga olish»dan keyin, jurnalga yozuv bilan.",
      },
      "lead-reminder": {
        q: "Lidni olgandan keyin avtoeslatma qachon keladi?",
        options: ["4 soatdan keyin", "Bir kundan keyin", "Bir haftadan keyin"],
        why: "Ertalabdan kechgacha tegilmagan lid allaqachon soviydi — shuning uchun 4 soat.",
      },
      "lead-transfer": {
        q: "Lidni hamkasbga berishni kim tasdiqlaydi?",
        options: ["Rahbaringiz yoki egasi", "Lid beriladigan hamkasb", "Hech kim, lid darhol ketadi"],
        why: "Ularga tasdiqlash va rad etish tugmalari bilan xabar keladi.",
      },
      "lead-urgent": {
        q: "«Ishda»gi issiq lid qachon «Zudlik bilan bog‘lanish»ga tushadi?",
        options: ["2 kun harakatsizlikdan keyin", "Bir soatdan keyin", "14 kundan keyin"],
        why: "Issiq — 2 kun, iliq — 3, pishib yetiladi — 5, arxiv — 14.",
      },
      portion: {
        q: "Soat 18:00 da kunlik to‘plamning bajarilmagan qismi bilan nima bo‘ladi?",
        options: ["Umumiy pulga qaytadi, xat o‘chiriladi", "Ertaga yana sizga o‘tkaziladi", "Botning o‘zi yuboradi"],
        why: "Xat sizning nomingiz bilan imzolangan, shuning uchun o‘chiriladi, kompaniya esa pulga qaytadi.",
      },
      "hello-count": {
        q: "Ikki qadamli aloqada «soatiga uchta» va kunlik to‘plam hisobiga nima kiradi?",
        options: ["Salomning o‘zi", "Faqat javobdan keyingi xat", "Dumaloq video"],
        why: "Notanish odamga birinchi xabar — Telegram hisoblaydigan narsa.",
      },
      "fact-check": {
        q: "Xatdan oldingi saytni haqiqiy tekshirish qancha amal qiladi?",
        options: ["Uch kun", "Bir oy", "Bir soat"],
        why: "Uch kundan eski bo‘lsa — xat ketmaydi, «Bog‘lanish»ni qayta bosing.",
      },
      "account-queue": {
        q: "Ishchi akkaunt yangi kompaniyalarga birinchi xabarlarni qanday yuboradi?",
        options: ["Soatiga uchtadan ko‘p emas va faqat Toshkent vaqti bilan 07:30 dan 20:30 gacha", "Hammasini darhol, pauzasiz", "Faqat kechasi"],
        why: "Aks holda Telegram bizni ommaviy jo‘natma deb hisoblab, akkauntni cheklaydi.",
      },
      self: {
        q: "«O‘zim bog‘landim»ni nega bosish kerak?",
        options: ["Aloqa sizga hisoblanadi, lid sizga ochiladi va hamkasb o‘sha odamga yozmaydi", "Bot xatni yana yuborishi uchun", "Aloqani yopish uchun"],
        why: "Belgisiz panel uchun siz hech kimga yozmagansiz.",
      },
      ignore: {
        q: "«🔇 Игнорирует» nima qiladi?",
        options: ["Aloqani yopadi: qayta yozish ketmaydi, lid «yutqazilgan», lekin aloqa bajarilgan bo‘lib qoladi", "Mijozga eslatma yuboradi", "Kompaniyani bazadan o‘chiradi"],
        why: "Mijozga haqiqatan yozilgan — shuning uchun aloqa hisoblangan.",
      },
      followups: {
        q: "Bot jim turgan mijozga qachon qayta yozadi?",
        options: ["Bot xatidan 3 va 7 kun keyin, ish kunlari 10:00 dan 17:00 gacha; bitta salomdan keyin qayta yozish yo‘q", "Javob bermaguncha har kuni", "Salomdan bir soat keyin"],
        why: "Qayta yozish — faqat bot yuborgan xatlar uchun va faqat ikki marta.",
      },
      texts: {
        q: "O‘z xat matningiz yoki A/B uchun ikkita matn qayerda yoziladi?",
        options: ["«Aloqalar» → «Xat matnlari va A/B»", "«Jamoa»da", "Lid kartochkasida"],
        why: "U yerda har bir matn bo‘yicha hisob ham bor va 20 ta xatgacha xulosa qilishga erta.",
      },
      "reply-myself": {
        q: "Lid kartochkasidagi «O‘zim javob beraman» nima qiladi?",
        options: ["Suhbatni modeldan oladi: keyin mijoz xabarlari sizga keladi", "Mijozga dumaloq video yuboradi", "Lidni hamkasbga beradi"],
        why: "Bosgandan keyin model jim turadi, suhbat sizniki.",
      },
      autopilot: {
        q: "Avtoaloqa kuniga nechta xat yuborishi kerak?",
        options: ["Telegramga haqiqatan ketgan kamida 20 ta", "Roppa-rosa 20 ta urinish", "Menejerlar tekshirib ulgurgancha"],
        why: "Urinishlar hisobga kirmaydi: yigirmatasi ketmaguncha avtoaloqa keyingi kompaniyani oladi.",
      },
      "mockup-password": {
        q: "«Maketlar»dagi «Parol yaratish» bergan parol qancha yashaydi?",
        options: ["24 soat, besh raqam", "Bir hafta", "Doimiy"],
        why: "Mijoz kirishi parol bilan birga tugaydi.",
      },
      "mockup-closed": {
        q: "Havola orqali ochiq maketga birinchi parol nima qiladi?",
        options: ["Uni yopadi: keyin parolsiz faqat parol maydoni ko‘rinadi", "Hech narsa, havola avvalgidek ishlaydi", "Maketni o‘chiradi"],
        why: "Bu havolani avval olganlarga ham tegishli.",
      },
      "project-lead": {
        q: "Loyiha yetakchisi kim bo‘ladi?",
        options: ["Loyihani ochgan odam", "Jamoa rahbari", "Kartochkani birinchi ochgan odam"],
        why: "Hisoblanmalar yetakchiga boradi — o‘z loyihangizni o‘zingiz oching.",
      },
      "project-stage": {
        q: "Loyiha bosqichini kim o‘zgartiradi?",
        options: ["Faqat egasi", "Yetakchi menejer", "Mijoz"],
        why: "Bosqich — mijozga va’da, bajaruvchining belgisi emas.",
      },
      "finance-base": {
        q: "Bitim bo‘yicha foizingiz nimadan hisoblanadi?",
        options: ["Sof foydadan: shartnoma summasi minus soliq va tannarx", "Butun shartnoma summasidan", "Birinchi to‘lovdan"],
        why: "Soliq va tannarxni egasi kiritadi.",
      },
      "finance-frozen": {
        q: "«Moliya»da «muzlatilgan» nima degani?",
        options: ["Bitim bor, lekin mijoz hali butun summani to‘lamagan", "To‘lov rad etilgan", "Loyiha bekor qilingan"],
        why: "«Ishlab topilgan» — mijoz loyihani to‘liq to‘laganda.",
      },
      "stats-lost": {
        q: "Lidni tashlab qo‘ymasdan «yutqazilgan» qo‘yish nega muhim?",
        options: ["Yutilganlar ulushi faqat yopilgan bitimlardan hisoblanadi", "Aks holda lid o‘chiriladi", "Aks holda to‘plam kelmaydi"],
        why: "Yutilgan ÷ (yutilgan + yutqazilgan): tashlab qo‘yilgan lid manzarani buzadi.",
      },
      "scout-strong": {
        q: "«Qidiruv»da kuchli signal (70+) keldi. Nima qilish kerak?",
        options: ["O‘zingiz yozmang: bir-ikki daqiqada u tayyor javob bilan lidlar navbatiga keladi", "Darhol muallifga shaxsiy xabar yozish", "Jamoa chatiga uzatish"],
        why: "Odamga ikki kishi yozsa, biz spamga o‘xshaymiz.",
      },
      "orders-flow": {
        q: "«Buyurtmalar»da buyurtmaning yo‘li qanday?",
        options: ["yangi → hisob-faktura chiqarilgan → to‘langan → topshirilgan", "yangi → ishda → yutilgan", "brif → dizayn → ishga tushirish"],
        why: "Yoki «bekor qilingan» — istalgan qadamda.",
      },
      "help-language": {
        q: "RU / UZ / PL panel tili qayerda eslab qolinadi?",
        options: ["Sizda: istalgan qurilmada panel o‘sha tilda ochiladi", "Faqat shu brauzerda", "Butun jamoa uchun birdaniga"],
        why: "Til faqat o‘zingizga o‘zgaradi va sizning yozuvingizda saqlanadi.",
      },
      "team-plan": {
        q: "Haftalik aloqalar rejasi kunlik to‘plamga qanday aylanadi?",
        options: ["Reja ÷ 5, kuniga 2 dan 15 tagacha kompaniya", "Butun reja dushanba kuni", "To‘plam har doim 20 ta"],
        why: "Rejasiz — kuniga 5, 0 — to‘plam yo‘q.",
      },
      "partner-count": {
        q: "Havola orqali kelgan lid hamkorga qachon hisoblanadi?",
        options: ["Bu uning o‘zi bo‘lmasa, mijoz avval bizda bo‘lmagan bo‘lsa va hamkor bloklanmagan bo‘lsa", "Har doim, shartsiz", "Faqat to‘lovdan keyin"],
        why: "Hisoblangach hamkorga «🤝 По вашей ссылке пришёл…» xabari keladi.",
      },
      "partner-payout": {
        q: "Hamkorning to‘lov so‘roviga kim qaror qiladi?",
        options: ["Faqat egasi", "Rahbar", "Hamkorning o‘zi"],
        why: "Bu begona odamlarga pul — qaror egasida.",
      },
      "accounts-circle": {
        q: "Bot dumaloq video uchun ishchi akkauntlarning «Saqlangan xabarlar»iga qanchalik tez-tez qaraydi?",
        options: ["O‘n daqiqada bir marta", "Kuniga bir marta", "Faqat qayta ishga tushirilganda"],
        why: "Shuning uchun dumaloq video haqidagi qatorlar darhol yangilanmaydi.",
      },
    },
  },
};
