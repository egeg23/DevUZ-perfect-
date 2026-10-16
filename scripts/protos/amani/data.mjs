/*
 * Факты Amani — только то, что магазин сказал о себе сам, в своём
 * Telegram-канале https://t.me/amani_uz (посты 5356-6427, 27.08-16.10.2026,
 * разбор — channel.json рядом):
 *  - цены, старые цены, ткань («Material»), размер («Razmer»), фото с
 *    поста; номер поста у каждого товара (post);
 *  - адрес, часы, «Safia» для такси, вывеска «AMÁNI BY WARDA», заказ через
 *    @Amani_uzadmin и +998 77 355 06 06;
 *  - заказы уезжают по Ташкенту и в регионы, бывает доставка с примеркой;
 *  - подарочные боксы, новая упаковка, видео о трёх ошибках с платком.
 * Названий моделей в канале нет: имя карточки — тип вещи из поста и то, что
 * видно на фото (цвет, пояс, принт). Мужского и ихрамов в канале нет: набор
 * «для него» показан как раздел на будущее и без цен. Заказы, себестоимость,
 * остатки, посещаемость, условия рассрочки и доставки — демо, так подписано.
 */

export const BRAND = {
  name: "Amani",
  mark: "AMÁNI",
  tg: "amani_uz",
  admin: "Amani_uzadmin",
  phone: "+998 77 355 06 06",
  phoneRaw: "+998773550606",
  subs: "10,2 тыс.",
  addr: ["Ташкент, Алмазарский район, Гулсарой 1 (Каракамыш)", "Toshkent sh., Olmazor tumani, Gulsaroy 1 (Qoraqamish)"],
  how: ["В такси Yandex ставьте «Safia». На машине: 1-й этаж здания «Katta Azza», вывеска «AMÁNI BY WARDA».", "Yandex taksida «Safia»ni belgilang. Mashinada: «Katta Azza» binosining 1-qavati, «AMÁNI BY WARDA» peshtaxtasi."],
  hours: ["Каждый день 9:00-22:00", "Har kuni 9:00-22:00"],
  map: "https://maps.google.com/maps?q=41.361663,69.238266",
  tagline: ["Закрытая женская одежда, платки и химары. Ташкент", "Yopiq ayollar kiyimi, ro‘mol va himorlar. Toshkent"],
};

export const CATS = [
  { id: "umra", i: "moon", n: ["Для умры и намаза", "Umra va namoz uchun"] },
  { id: "dress", i: "dress", n: ["Платья", "Ko‘ylaklar"] },
  { id: "set", i: "hanger", n: ["Двойки и кардиганы", "Ikkiliklar va kardiganlar"] },
  { id: "scarf", i: "scarf", n: ["Платки, шарфы, химары", "Ro‘mol, sharf, himor"] },
  { id: "outer", i: "coat", n: ["Верхняя одежда", "Ustki kiyim"] },
  { id: "acc", i: "bag", n: ["Сумки и очки", "Sumka va ko‘zoynak"] },
];

/*
 * f — фото с поста (src/<файл>.jpg); sz — размеры, как в посте; mat — ткань,
 * как в посте; tag: new — «New Collection», back — «Pavtor keldi» (снова в
 * наличии), few — «Sonlari kam qoldi»; occ — к какому случаю подходит
 * (подбор платка): day, umra, fest.
 */
export const PRODUCTS = [
  { id: "u5846", post: 5846, cat: "umra", price: 780000, sz: ["Standart"], mat: "Madal kupra", f: ["5846-1"], tag: "new",
    ru: { n: "Платье «Umra»", s: "Коллекция «Umra»: свободный крой, длина в пол" }, uz: { n: "«Umra» ko‘ylagi", s: "«Umra» kolleksiyasi: erkin bichim, uzunligi polgacha" } },
  { id: "u5525", post: 5525, cat: "umra", price: 590000, sz: ["Standart"], f: ["5523-1"], occ: ["umra"],
    ru: { n: "Намазник", s: "Одежда для намаза, надевается поверх платья" }, uz: { n: "Namoznik", s: "Namoz uchun kiyim, ko‘ylak ustidan kiyiladi" } },
  { id: "d5501", post: 5501, cat: "dress", price: 1000000, old: 1200000, sz: ["Standart"], mat: "Naturalniy kupra", f: ["5501-1", "5501-2"],
    ru: { n: "Платье из натуральной купры, оливковое", s: "Натуральная купра, пуговицы до талии" }, uz: { n: "Tabiiy kupra ko‘ylak, zaytun rang", s: "Tabiiy kupra, belgacha tugmalar" } },
  { id: "d5503", post: 5503, cat: "dress", price: 1000000, old: 1200000, sz: ["1", "2"], mat: "Naturalniy kupra", f: ["5503-1", "5503-2"],
    ru: { n: "Платье из натуральной купры, мокко", s: "Натуральная купра с блеском, сборка от кокетки" }, uz: { n: "Tabiiy kupra ko‘ylak, mokko", s: "Yaltiroq tabiiy kupra, koketkadan burma" } },
  { id: "d6370", post: 6370, cat: "dress", price: 800000, sz: ["Standart"], f: ["6370-1", "6370-2", "6370-3"], tag: "new",
    ru: { n: "Платье со сборкой, чёрное", s: "New Collection: сборка от груди, свободный рукав" }, uz: { n: "Burmali ko‘ylak, qora", s: "New Collection: ko‘krakdan burma, erkin yeng" } },
  { id: "d6264", post: 6264, cat: "dress", price: 600000, sz: ["Standart"], f: ["6264-1", "6264-2", "6264-3"],
    ru: { n: "Платье Exclusive, чёрное", s: "Exclusive Collection: широкий рукав, длина в пол" }, uz: { n: "Exclusive ko‘ylak, qora", s: "Exclusive Collection: keng yeng, uzunligi polgacha" } },
  { id: "d6329", post: 6329, cat: "dress", price: 500000, sz: ["Standart"], f: ["6329-2", "6329-1", "6329-3"], tag: "new",
    ru: { n: "Платье с объёмным рукавом, тёмно-синее", s: "Осенняя коллекция: рукав на манжете, отложной воротник" }, uz: { n: "Hajmli yengli ko‘ylak, to‘q ko‘k", s: "Kuzgi kolleksiya: manjetli yeng, yotiq yoqa" } },
  { id: "d6277", post: 6277, cat: "dress", price: 500000, sz: ["Standart"], f: ["6277-1", "6277-2", "6277-3"], tag: "new",
    ru: { n: "Платье в полоску, графит", s: "Осенняя коллекция: мягкая полоска, свободный силуэт" }, uz: { n: "Chiziqli ko‘ylak, grafit", s: "Kuzgi kolleksiya: yumshoq chiziq, erkin siluet" } },
  { id: "d6326", post: 6326, cat: "dress", price: 500000, sz: ["Standart"], f: ["6326-1", "6326-2"], tag: "new",
    ru: { n: "Платье осенней коллекции, графит", s: "Свободный крой, рукав на манжете" }, uz: { n: "Kuzgi kolleksiya ko‘ylagi, grafit", s: "Erkin bichim, manjetli yeng" } },
  { id: "d6426", post: 6426, cat: "dress", price: 580000, sz: ["Standart"], f: ["6426-1"], tag: "new", occ: ["fest"],
    ru: { n: "Платье на пуговицах, тёмно-зелёное", s: "New Collection: пуговицы и пояс, длина в пол" }, uz: { n: "Tugmali ko‘ylak, to‘q yashil", s: "New Collection: tugma va kamar, uzunligi polgacha" } },
  { id: "d6424", post: 6424, cat: "dress", price: 580000, sz: ["Standart"], f: ["6424-1"], tag: "back",
    ru: { n: "Платье с поясом", s: "Снова в наличии: несколько цветов, пояс в тон" }, uz: { n: "Kamarli ko‘ylak", s: "Yana sotuvda: bir necha rang, kamar rangiga mos" } },
  { id: "d6412", post: 6412, cat: "dress", price: 600000, sz: ["Standart"], mat: "Oysho", f: ["6412-1"],
    ru: { n: "Платье из ткани Oysho", s: "Осенняя коллекция, несколько цветов" }, uz: { n: "Oysho matosidan ko‘ylak", s: "Kuzgi kolleksiya, bir necha rang" } },
  { id: "d6342", post: 6342, cat: "dress", price: 500000, sz: ["Standart"], mat: "Trikotaj", f: ["6342-1"], tag: "new",
    ru: { n: "Трикотажное платье с поясом", s: "New Collection: пояс на талии, расклёшенный рукав" }, uz: { n: "Kamarli trikotaj ko‘ylak", s: "New Collection: belda kamar, keng yeng" } },
  { id: "d6407", post: 6407, cat: "dress", price: 450000, sz: ["Standart"], mat: "Kupra trikotaj", f: ["6407-1"], tag: "back",
    ru: { n: "Базовое платье из купры", s: "Купра-трикотаж, несколько цветов" }, uz: { n: "Kupra baza ko‘ylak", s: "Kupra trikotaj, bir necha rang" } },
  { id: "d6257", post: 6257, cat: "dress", price: 450000, sz: ["Standart"], mat: "Kupra trikotaj", f: ["6257-1"],
    ru: { n: "Осеннее базовое платье", s: "Купра-трикотаж: молочное, бордо, графит, чёрное" }, uz: { n: "Kuzgi baza ko‘ylak", s: "Kupra trikotaj: sutrang, bordo, grafit, qora" } },
  { id: "d6296", post: 6296, cat: "dress", price: 385000, old: 550000, sz: ["Standart"], f: ["6296-1"], tag: "few",
    ru: { n: "Платье с мелким принтом", s: "Осталось мало: специальная цена" }, uz: { n: "Mayda naqshli ko‘ylak", s: "Kam qoldi: maxsus narx" } },
  { id: "s5843", post: 5843, cat: "set", price: 500000, sz: ["Standart"], f: ["5843-1"],
    ru: { n: "Двойка с кюлотами", s: "Туника и широкие кюлоты, несколько цветов" }, uz: { n: "Kyulotli ikkilik", s: "Tunika va keng kyulot, bir necha rang" } },
  { id: "s6373", post: 6373, cat: "set", price: 550000, f: ["6373-1"],
    ru: { n: "Кардиган", s: "Длинный кардиган поверх базового платья" }, uz: { n: "Kardigan", s: "Baza ko‘ylak ustidan uzun kardigan" } },
  { id: "s6262", post: 6262, cat: "set", price: 580000, f: ["6262-1"],
    ru: { n: "Базовое платье под кардиган", s: "Пара к кардигану, носится и отдельно" }, uz: { n: "Kardigan ostiga baza ko‘ylak", s: "Kardiganga juft, alohida ham kiyiladi" } },
  { id: "s6343", post: 6343, cat: "set", price: 150000, sz: ["Standart"], f: ["6343-1"], occ: ["umra"],
    ru: { n: "Лонгслив", s: "Под платье и двойку: молочный, бежевый, шоколад, олива, серый" }, uz: { n: "Longsliv", s: "Ko‘ylak va ikkilik ostiga: sutrang, bej, shokolad, zaytun, kulrang" } },
  { id: "h6304", post: 6304, cat: "scarf", price: 165000, mat: "Kaliforniya", f: ["6304-1"], occ: ["umra", "day"],
    ru: { n: "Химар", s: "Ткань Kaliforniya: закрывает плечи и грудь" }, uz: { n: "Himor", s: "Kaliforniya matosi: yelka va ko‘krakni yopadi" } },
  { id: "h6391", post: 6391, cat: "scarf", price: 125000, f: ["6391-1"], occ: ["fest", "day"],
    ru: { n: "Шарф пашмина", s: "Пашмина с орнаментом по краю" }, uz: { n: "Pashmina sharf", s: "Cheti naqshli pashmina" } },
  { id: "h6404", post: 6404, cat: "scarf", price: 125000, f: ["6404-1"], occ: ["fest"],
    ru: { n: "Шарф с узором", s: "Крупный узор, тёплые цвета" }, uz: { n: "Naqshli sharf", s: "Yirik naqsh, iliq ranglar" } },
  { id: "h6297", post: 6297, cat: "scarf", price: 115000, f: ["6297-1"], occ: ["day", "umra"],
    ru: { n: "Шарф Aylin", s: "Однотонные, много цветов" }, uz: { n: "Aylin sharfi", s: "Bir rangli, ko‘p ranglar" } },
  { id: "h6062", post: 6062, cat: "scarf", price: 165000, f: ["6062-1"], occ: ["fest", "day"],
    ru: { n: "Платок с пейсли", s: "Ромол: узор пейсли, мягкий блеск" }, uz: { n: "Paysli naqshli ro‘mol", s: "Ro‘mol: paysli naqsh, yumshoq yaltiroq" } },
  { id: "h5814", post: 5814, cat: "scarf", price: 145000, f: ["5814-1"], occ: ["fest"],
    ru: { n: "Шарф в национальном стиле", s: "«Milliycha»: узор в национальном стиле" }, uz: { n: "Milliycha sharf", s: "Milliy uslubdagi naqsh" } },
  { id: "o6406", post: 6406, cat: "outer", price: 685000, sz: ["Standart"], f: ["6406-1", "6386-1"],
    ru: { n: "Стёганая куртка", s: "Удлинённая, поверх платья" }, uz: { n: "Qavima kurtka", s: "Uzaytirilgan, ko‘ylak ustidan" } },
  { id: "a5916", post: 5916, cat: "acc", price: 265000, f: ["5916-1"],
    ru: { n: "Сумка, карамель", s: "Стёганая, на цепочке" }, uz: { n: "Sumka, karamel", s: "Qavima, zanjirli" } },
  { id: "a5917", post: 5917, cat: "acc", price: 250000, f: ["5917-1"],
    ru: { n: "Сумка, вишня и чёрная", s: "Стёганая, два цвета" }, uz: { n: "Sumka, olcha va qora", s: "Qavima, ikki rang" } },
  { id: "a5401", post: 5401, cat: "acc", price: 130000, f: ["5401-1"],
    ru: { n: "Солнцезащитные очки", s: "Несколько оправ" }, uz: { n: "Quyosh ko‘zoynagi", s: "Bir necha gardish" } },
];

/* Наш пример «с этим берут»; в работе пары считает панель по заказам. */
export const PAIRS = {
  u5846: ["h6304", "u5525", "s6343"], u5525: ["u5846", "h6297", "h6304"],
  d5501: ["h6391", "a5916", "h6062"], d5503: ["h6062", "a5917", "h6391"], d6370: ["h6297", "a5917", "o6406"], d6264: ["a5401", "h6297", "o6406"],
  d6329: ["a5916", "h6297", "s6343"], d6277: ["a5401", "h6404", "o6406"], d6326: ["h6391", "s6343", "o6406"], d6426: ["h5814", "a5916", "h6391"],
  d6424: ["h6297", "s6343", "a5917"], d6412: ["h6404", "o6406", "a5916"], d6342: ["h6062", "a5917", "s6343"], d6407: ["h6297", "s6343", "s6373"],
  d6257: ["s6373", "h6391", "s6343"], d6296: ["h6297", "a5917", "s6343"],
  s5843: ["h6297", "a5916", "s6343"], s6373: ["s6262", "h6391", "a5916"], s6262: ["s6373", "h6404", "a5917"], s6343: ["d6407", "s5843", "h6297"],
  h6304: ["u5846", "u5525", "h6297"], h6391: ["d5501", "h6404", "a5916"], h6404: ["h6391", "d6412", "a5917"], h6297: ["h6304", "d6407", "s6343"],
  h6062: ["d5503", "h6391", "a5917"], h5814: ["d6426", "h6062", "a5916"],
  o6406: ["d6277", "h6404", "a5401"], a5916: ["d5501", "h6391", "a5401"], a5917: ["d5503", "h6062", "a5401"], a5401: ["a5916", "d6264", "o6406"],
};

/*
 * Наборы для умры. Для неё — вещи Amani с ценами из канала; то, чего в
 * канале нет, без цены и выключено. Для него — раздел на будущее: мужского
 * в канале нет, цены впишет магазин. Состав — по спискам «что взять в умру»
 * (docs/research/amani.md, раздел 4).
 */
export const KITS = {
  her: [
    { id: "u5846", on: 1, s: ["основа поездки", "safarning asosi"] },
    { id: "u5525", on: 1, s: ["для намаза в мечети", "masjidda namoz uchun"] },
    { id: "h6304", on: 1, s: ["закрывает плечи и грудь", "yelka va ko‘krakni yopadi"] },
    { id: "s6343", on: 1, s: ["под платье, рукав до запястья", "ko‘ylak ostiga, yeng bilakkacha"] },
    { id: "h6297", on: 1, s: ["запасной, однотонный", "zaxira, bir rangli"] },
    { id: "a5917", on: 0, s: ["документы и телефон под рукой", "hujjat va telefon qo‘l ostida"] },
    { ic: "sock", n: ["Носки, 3 пары", "Paypoq, 3 juft"], s: ["если добавите в ассортимент", "assortimentga qo‘shsangiz"] },
    { ic: "shoe", n: ["Мешок для обуви", "Poyabzal xaltasi"], s: ["если добавите в ассортимент", "assortimentga qo‘shsangiz"] },
  ],
  him: [
    { ic: "ihram", n: ["Ихрам, два полотна", "Ehrom, ikki mato"], s: ["изар и рида, хлопок", "izor va rido, paxta"] },
    { ic: "belt", n: ["Пояс с карманами", "Cho‘ntakli kamar"], s: ["на молнии, для денег и паспорта", "zamokli, pul va pasport uchun"] },
    { ic: "shoe", n: ["Сандалии", "Sandal"], s: ["пятка и подъём открыты", "tovon va oyoq usti ochiq"] },
    { ic: "bag", n: ["Мешок для обуви", "Poyabzal xaltasi"], s: ["для мечети", "masjid uchun"] },
    { ic: "beads", n: ["Тасбих", "Tasbeh"], s: ["в подарок к набору", "to‘plamga sovg‘a"] },
  ],
};

/*
 * Подбор платка. Советы по формам лица — общие правила, как в гидах Haute
 * Hijab и других (research, раздел 2): мы не обещаем, что «скроет» или
 * «исправит», только как лечь ткани.
 */
export const SHAPES = [
  { id: "oval", n: ["Овальное", "Oval"], face: "M60 34c-17 0-27 15-27 34 0 22 12 40 27 40s27-18 27-40c0-19-10-34-27-34z",
    wrap: ["Почти любой способ", "Deyarli har qanday usul"],
    why: ["Овальному лицу идут и классический химар, и свободная драпировка, и тюрбан.", "Oval yuzga klassik himor ham, erkin drapirovka ham, turban ham yarashadi."],
    tips: [["Пробуйте узоры: пашмину, пейсли, национальный", "Naqshlarni sinab ko‘ring: pashmina, paysli, milliy"], ["Подойдут и плотные, и лёгкие ткани", "Qalin ham, yengil ham matolar mos"]] },
  { id: "round", n: ["Круглое", "Dumaloq"], face: "M60 38c-20 0-29 14-29 32 0 20 12 34 29 34s29-14 29-34c0-18-9-32-29-32z",
    wrap: ["Объём сверху, складки вниз", "Tepada hajm, burmalar pastga"],
    why: ["Немного объёма над лбом и вертикальные складки по бокам вытягивают линию лица.", "Peshona ustida biroz hajm va yonlardagi tik burmalar yuz chizig‘ini cho‘zadi."],
    tips: [["Не стягивайте платок у щёк", "Ro‘molni yonoqda tortmang"], ["Длинный конец опускайте вниз, а не вокруг шеи", "Uzun uchini bo‘yin atrofiga emas, pastga tushiring"]] },
  { id: "long", n: ["Вытянутое", "Cho‘ziq"], face: "M60 28c-15 0-24 16-24 38 0 26 10 46 24 46s24-20 24-46c0-22-9-38-24-38z",
    wrap: ["Мягкий объём по бокам", "Yonlarda yumshoq hajm"],
    why: ["Складки у скул и платок ниже над лбом уравновешивают длину лица.", "Yonoq suyagidagi burmalar va peshonada pastroq ro‘mol yuz uzunligini muvozanatlaydi."],
    tips: [["Не поднимайте ткань высоко над лбом", "Matoni peshonadan baland ko‘tarmang"], ["Шарф Aylin в два оборота даёт объём", "Aylin sharfi ikki aylanada hajm beradi"]] },
  { id: "square", n: ["Квадратное", "Kvadrat"], face: "M60 36c-19 0-28 12-28 30 0 24 6 38 28 38s28-14 28-38c0-18-9-30-28-30z",
    wrap: ["Диагональные складки у подбородка", "Iyak yonida qiya burmalar"],
    why: ["Мягкие складки по диагонали смягчают углы челюсти, лучше в лёгкой ткани.", "Qiya yumshoq burmalar jag‘ burchaklarini yumshatadi, yengil matoda yaxshiroq."],
    tips: [["Лёгкие ткани: трикотаж, шифон", "Yengil matolar: trikotaj, shifon"], ["Закрепите булавкой сбоку, а не под подбородком", "To‘g‘nog‘ichni iyak ostida emas, yonda mahkamlang"]] },
  { id: "heart", n: ["Сердечком", "Yuraksimon"], face: "M60 36c-22 0-31 10-31 26 0 18 15 42 31 42s31-24 31-42c0-16-9-26-31-26z",
    wrap: ["Гладко у лба, объём у шеи", "Peshonada tekis, bo‘yinda hajm"],
    why: ["Платок гладко у лба и объём ниже, у подбородка, уравновешивают широкий лоб.", "Peshonada tekis ro‘mol va pastda, iyak yonida hajm keng peshonani muvozanatlaydi."],
    tips: [["Узор ближе к подбородку", "Naqsh iyakka yaqinroq"], ["Химар на плечи даёт объём внизу", "Yelkaga himor pastda hajm beradi"]] },
];
export const OCC = [
  { id: "day", n: ["Каждый день", "Har kuni"], c: "#c9b59c", tip: ["На каждый день: однотонный шарф или химар.", "Har kunga: bir rangli sharf yoki himor."] },
  { id: "umra", n: ["Умра и намаз", "Umra va namoz"], c: "#e9e1d4", tip: ["В умру: химар или однотонный шарф, без блеска, закрывает грудь.", "Umraga: himor yoki bir rangli sharf, yaltiroqsiz, ko‘krakni yopadi."] },
  { id: "fest", n: ["Праздник, той", "Bayram, to‘y"], c: "#9a5d43", tip: ["На праздник: пашмина, пейсли или шарф в национальном стиле.", "Bayramga: pashmina, paysli yoki milliy uslubdagi sharf."] },
];

/*
 * Длина изделия по росту. В канале размеров нет: почти всё «Standart».
 * Ориентир — таблица Amsons «рост → длина абайи» (research, раздел 4);
 * размер 52-60 — длина в дюймах, так абайи меряют в Персидском заливе.
 * Мерки Amani впишутся с их изделий, это сказано на экране.
 */
export const SIZES = [
  { from: 140, to: 158, len: 132, size: 52, h: "150-157" },
  { from: 158, to: 164, len: 137, size: 54, h: "158-163" },
  { from: 164, to: 169, len: 142, size: 56, h: "164-168" },
  { from: 169, to: 175, len: 147, size: 58, h: "169-174" },
  { from: 175, to: 191, len: 152, size: 60, h: "175-180" },
];

/* Отзывы #Otziv: скриншоты, которые Amani выкладывает в канале. */
export const OTZIV = ["6218-1", "6223-1", "6232-1", "6233-1", "6359-1", "6393-1"];

/* Партнёры рассрочки. Условия в макете демо: точные даст партнёр при подключении. */
export const NASIYA = [
  { id: "uzum", n: "Uzum Nasiya", c: "#7000ff", terms: { 3: 0, 6: 8, 12: 16 } },
  { id: "alif", n: "Alif Nasiya", c: "#00a651", terms: { 3: 0, 6: 9, 12: 18 } },
  { id: "anor", n: "Anorbank", c: "#c4161c", terms: { 3: 3, 6: 10, 12: 19 } },
];

export const PAYS = [
  { id: "click", n: "Click" },
  { id: "payme", n: "Payme" },
  { id: "uzumbank", n: "Uzum Bank" },
  { id: "card", n: "Uzcard / Humo" },
  { id: "cash", n: ["Наличными курьеру", "Kuryerga naqd"] },
  { id: "nasiya", n: ["Рассрочка", "Muddatli to‘lov"] },
];

/* Демо-настройки магазина: впишет владелец. */
export const SHOP = {
  delivery: 30000, freeFrom: 1000000, pointsRate: 0.03, pointsMaxShare: 0.3,
  reviewPts: 10000, reviewPhotoPts: 20000, welcome: 15000, gift: 30000,
  promo: { AMANI10: 10, UMRA: 15 },
  levels: [{ id: "silk", n: ["Silk", "Silk"], from: 0, k: 3 }, { id: "pearl", n: ["Pearl", "Pearl"], from: 3000000, k: 5 }, { id: "gold", n: ["Gold", "Gold"], from: 8000000, k: 7 }],
};
