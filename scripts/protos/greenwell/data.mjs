/*
 * Факты Greenwell — только то, что компания сказала о себе сама:
 *  - greenwell.uz (15.10.2026): названия, короткие описания на ru и uz,
 *    цены и старые цены, «Вся продукция изготавливается в США и ЕС, GMP»,
 *    дистрибутор ООО «Inso Farm Deluxe», Telegram, Instagram, Facebook;
 *  - их магазин на Uzum Market (https://uzum.uz/ru/shop/greenwell): оценка и
 *    число отзывов у каждого товара, число заказов, пункты «чем помогает»,
 *    фото, отзывы покупателей (как есть, с именем, как на Uzum).
 * Себестоимость, остатки, заказы, посещаемость — демо, и это сказано на
 * экранах. Пары «с этим покупают» — наш пример, в работе их считает панель
 * по заказам.
 */

export const BRAND = {
  name: "Greenwell",
  legal: "ООО «Inso Farm Deluxe»",
  site: "greenwell.uz",
  tg: "greenwell_uz",
  ig: "greenwell_uz",
  fb: "https://www.facebook.com/share/1CeGnZMs11/",
  uzum: "https://uzum.uz/ru/shop/greenwell",
  arzon: "https://arzonapteka.uz/",
  tagline: ["Биодобавки нового поколения", "Yangi avlod bioqo‘shimchalari"],
  made: ["Вся продукция изготавливается в США и ЕС, соответствует требованиям GMP и международным стандартам качества", "Barcha mahsulotlar AQSh va Yevropa Ittifoqida ishlab chiqariladi, GMP talablari va xalqaro sifat standartlariga javob beradi"],
  legalNote: ["Информация на сайте носит ознакомительный характер и не является медицинской рекомендацией. Биологически активные добавки не являются лекарственными средствами. Перед применением рекомендуется проконсультироваться со специалистом.", "Saytdagi ma’lumotlar tanishish uchun berilgan va tibbiy maslahat hisoblanmaydi. Biologik faol qo‘shimchalar dori vositasi emas. Qo‘llashdan oldin mutaxassis bilan maslahatlashish tavsiya etiladi."],
  dist: ["ООО «Inso Farm Deluxe», официальный дистрибутор бренда GREENWELL в Узбекистане", "«Inso Farm Deluxe» MChJ, GREENWELL brendining O‘zbekistondagi rasmiy distribyutori"],
  /* Цвета с их сайта и знака: тёмно-зелёная банка, красная и синяя полосы флага. */
  green: "#00573a",
  red: "#d2232a",
  blue: "#2e3092",
};

export const CATS = [
  { id: "nerv", i: "moon", n: ["Нервы и сон", "Asab va uyqu"] },
  { id: "imm", i: "shield", n: ["Иммунитет", "Immunitet"] },
  { id: "heart", i: "heart", n: ["Сердце и энергия", "Yurak va energiya"] },
  { id: "joint", i: "joint", n: ["Суставы", "Bo‘g‘imlar"] },
  { id: "beauty", i: "spark", n: ["Кожа, волосы, ногти", "Teri, soch, tirnoq"] },
  { id: "weight", i: "scale", n: ["Контроль веса", "Vazn nazorati"] },
];

/* g — сколько снимков в галерее (g-<id>-<n>.webp), c — есть ли заключение СЭС. */
export const PRODUCTS = [
  {
    id: "mgc", cat: "nerv", price: 162000, old: 220000, count: 60, form: "caps", rating: 4.9, reviews: 1263, orders: "4500+", g: 3, c: true,
    uzum: "https://uzum.uz/ru/product/magnij-citrat-podderzhka-1967925",
    ru: { n: "Магний Цитрат", s: "Поддержка сердца, мышц и снижения стресса", b: ["Улучшает качество сна", "Способствует снижению стресса и усталости", "Предотвращает мышечные судороги", "Поддерживает работу сердца и нервной системы"] },
    uz: { n: "Magniy Sitrat", s: "Yurak, mushaklarni qo‘llab-quvvatlash va stressni kamaytirish", b: ["Uyqu sifatini yaxshilaydi", "Stress va charchoqni kamaytirishga yordam beradi", "Mushak tortishishining oldini oladi", "Yurak va asab tizimi ishini qo‘llab-quvvatlaydi"] },
    /* Инструкция — с их страницы greenwell.uz/magnesium-citrate. */
    how: [
      "Принимать по 2 капсулы на ночь, запивая достаточным количеством воды, независимо от еды. Если эффект недостаточный, можно увеличить до 3 капсул на ночь. Не более 4 капсул в день. В одной банке 60 капсул, это курс на 1 месяц.",
      "Kechasi 2 kapsuladan, yetarli suv bilan, ovqatdan qat’i nazar qabul qiling. Ta’sir yetarli bo‘lmasa, kechasi 3 kapsulagacha oshirish mumkin. Kuniga 4 kapsuladan ko‘p emas. Bir bankada 60 kapsula, bu 1 oylik kurs.",
    ],
    comp: ["1 капсула: Tri-Magnesium dicitrate, anhydrous 666,67 mg (магний 100 mg), Thiamin mononitrate 2,1273 mg, оболочка из растительной гидроксипропилметилцеллюлозы 96 mg. Без глютена, без лактозы, веган, халяль.", "1 kapsula: Tri-Magnesium dicitrate, anhydrous 666,67 mg (magniy 100 mg), Thiamin mononitrate 2,1273 mg, o‘simlik gidroksipropilmetilsellyulozasidan qobiq 96 mg. Glyutensiz, laktozasiz, vegan, halol."],
    tags: ["halal", "vegan"],
  },
  {
    id: "mgb", cat: "nerv", price: 270000, old: 286000, count: 90, form: "caps", rating: 4.9, reviews: 109, orders: "300+", g: 2, c: false,
    uzum: "https://uzum.uz/ru/product/greenwell-magnij-b-1968010",
    ru: { n: "Магний + B комплекс", s: "Спокойствие, энергия и здоровье нервной системы", b: ["Поддерживает здоровье нервной системы", "Участвует в выработке мелатонина, гормона сна", "Уменьшает усталость и повышает работоспособность", "Способствует нормальной работе мышц"] },
    uz: { n: "Magniy + B kompleks", s: "Xotirjamlik, energiya va asab tizimi salomatligi", b: ["Asab tizimi salomatligini qo‘llab-quvvatlaydi", "Uyqu gormoni melatonin ishlab chiqarilishida qatnashadi", "Charchoqni kamaytiradi va ish qobiliyatini oshiradi", "Mushaklarning normal ishlashiga yordam beradi"] },
  },
  {
    id: "sleep", cat: "nerv", price: 233640, old: 236000, count: 60, form: "caps", rating: 4.9, reviews: 30, orders: "100+", g: 2, c: true,
    uzum: "https://uzum.uz/ru/product/bad-dlya-sna-1975091",
    ru: { n: "Relax & Sleep", s: "Натуральная поддержка сна и нервной системы", b: ["Способствует расслаблению и снижению стресса", "Поддерживает здоровый и полноценный сон", "Помогает при раздражительности и нервном перенапряжении", "Экстракты валерианы, пассифлоры и хмеля, магний и витамин B6"] },
    uz: { n: "Relax & Sleep", s: "Uyqu va asab tizimini tabiiy qo‘llab-quvvatlash", b: ["Bo‘shashish va stressni kamaytirishga yordam beradi", "Sog‘lom va to‘liq uyquni qo‘llab-quvvatlaydi", "Asabiylashish va asab zo‘riqishida yordam beradi", "Valeriana, passiflora va xmel ekstraktlari, magniy va B6 vitamini"] },
    tags: ["halal"],
  },
  {
    id: "se", cat: "imm", price: 270000, old: 280000, count: 60, form: "caps", rating: 5, reviews: 42, orders: "100+", g: 1, c: false,
    uzum: "https://uzum.uz/ru/product/greenwell-selenium-zinc-1975957",
    ru: { n: "Селен + Цинк", s: "Двойная защита иммунитета, здоровье кожи и ногтей", b: ["Усиливает защитные функции иммунной системы", "Обладает антиоксидантным действием", "Поддерживает здоровье кожи, волос и ногтей", "Поддерживает здоровье щитовидной железы"] },
    uz: { n: "Selen + Sink", s: "Kuchli immun himoya va antioksidant yordam", b: ["Immun tizimining himoya funksiyalarini kuchaytiradi", "Antioksidant ta’sirga ega", "Teri, soch va tirnoq salomatligini qo‘llab-quvvatlaydi", "Qalqonsimon bez salomatligini qo‘llab-quvvatlaydi"] },
  },
  {
    id: "q10", cat: "heart", price: 315000, old: 345000, count: 60, form: "tab", rating: 4.9, reviews: 80, orders: "300+", g: 4, c: false,
    uzum: "https://uzum.uz/ru/product/greenwell-coenzyme-q10-1975971",
    ru: { n: "Коэнзим Q10", s: "Для увеличения энергии и выносливости", b: ["Поддерживает здоровье сердечно-сосудистой системы", "Улучшает энергетический обмен в клетках", "Снижает утомляемость и повышает выносливость", "Обладает антиоксидантным действием"] },
    uz: { n: "Koenzim Q10", s: "Energiya va chidamlilikni oshirish uchun", b: ["Yurak-qon tomir tizimi salomatligini qo‘llab-quvvatlaydi", "Hujayralarda energiya almashinuvini yaxshilaydi", "Charchoqni kamaytiradi va chidamlilikni oshiradi", "Antioksidant ta’sirga ega"] },
  },
  {
    id: "om", cat: "heart", price: 243000, old: 270000, count: 60, form: "soft", rating: 5, reviews: 174, orders: "600+", g: 2, c: true,
    uzum: "https://uzum.uz/ru/product/greenwell-omega3-1000-1967805",
    ru: { n: "Омега-3, 1000 mg", s: "Защита сердца и сосудов, энергия и здоровье", b: ["Поддерживает работу сердца и нормальный уровень холестерина", "Улучшает эластичность сосудов и кровообращение", "Поддерживает здоровье мозга", "Поддерживает здоровье глаз"] },
    uz: { n: "Omega-3, 1000 mg", s: "Yurak va qon tomirlarini himoya qilish, energiya va salomatlik", b: ["Yurak ishini va xolesterinning normal darajasini qo‘llab-quvvatlaydi", "Qon tomirlari elastikligi va qon aylanishini yaxshilaydi", "Miya salomatligini qo‘llab-quvvatlaydi", "Ko‘z salomatligini qo‘llab-quvvatlaydi"] },
  },
  {
    id: "multi", cat: "imm", price: 212000, old: 236000, count: 60, form: "caps", rating: 4.9, reviews: 229, orders: "700+", g: 2, c: false,
    uzum: "https://uzum.uz/ru/product/greenwell-multicomplex-vp-1968084",
    ru: { n: "Мультикомплекс", s: "Витамины и минералы для энергии и иммунитета", b: ["Поддерживает иммунную систему", "Повышает уровень энергии и жизненный тонус", "Укрепляет волосы, кожу и ногти", "Поддерживает здоровье костей и зубов"] },
    uz: { n: "Multikompleks", s: "Energiya va immunitet uchun vitaminlar va minerallar majmuasi", b: ["Immun tizimini qo‘llab-quvvatlaydi", "Energiya va hayotiy tonusni oshiradi", "Soch, teri va tirnoqlarni mustahkamlaydi", "Suyak va tishlar salomatligini qo‘llab-quvvatlaydi"] },
  },
  {
    id: "zinc", cat: "imm", price: 188000, old: 200000, count: 60, form: "tab", rating: 4.9, reviews: 97, orders: "400+", g: 2, c: false,
    uzum: "https://uzum.uz/ru/product/greenwell-zinc-picolinate-1975099",
    ru: { n: "Цинк Пиколинат", s: "Поддержка иммунитета, кожи и мужского здоровья", b: ["Поддерживает нормальную работу иммунной системы", "Способствует здоровью кожи и волос", "Поддерживает репродуктивное и мужское здоровье", "Поддерживает здоровье ногтей"] },
    uz: { n: "Sink Pikolinat", s: "Immunitet, teri va erkaklar salomatligini qo‘llab-quvvatlash", b: ["Immun tizimining normal ishlashini qo‘llab-quvvatlaydi", "Teri va soch salomatligiga yordam beradi", "Reproduktiv va erkaklar salomatligini qo‘llab-quvvatlaydi", "Tirnoqlar salomatligini qo‘llab-quvvatlaydi"] },
  },
  {
    id: "glu", cat: "joint", price: 321000, old: 350000, count: 50, form: "tab", rating: 4.9, reviews: 151, orders: "400+", g: 3, c: true,
    uzum: "https://uzum.uz/ru/product/greenwell-glucosamine-chondroitin-1975989",
    ru: { n: "Глюкозамин Хондроитин MSM", s: "Поддержка суставов, хрящей и связок", b: ["Улучшает подвижность и гибкость суставов", "Способствует восстановлению хрящевой ткани", "Укрепляет связки и сухожилия", "Защищает суставы при спортивных нагрузках"] },
    uz: { n: "Glyukozamin Xondroitin MSM", s: "Bo‘g‘imlar salomatligi va harakatchanligi", b: ["Bo‘g‘imlar harakatchanligi va egiluvchanligini yaxshilaydi", "Tog‘ay to‘qimasining tiklanishiga yordam beradi", "Boylam va paylarni mustahkamlaydi", "Sport yuklamalarida bo‘g‘imlarni himoya qiladi"] },
  },
  {
    id: "wl", cat: "weight", price: 259000, old: 269000, count: 60, form: "caps", rating: 4.6, reviews: 77, orders: "200+", g: 2, c: true,
    uzum: "https://uzum.uz/ru/product/greenwell-weightloss-vp-1975898",
    ru: { n: "Weightloss", s: "Комплекс контроля веса и ускорения метаболизма", b: ["Поддерживает естественный процесс снижения веса", "Ускоряет обмен веществ", "Помогает контролировать аппетит", "Поддерживает уровень энергии при диете и тренировках"] },
    uz: { n: "Weightloss", s: "Vaznni nazorat qilish va metabolizmni tezlashtirish uchun kompleks", b: ["Vazn kamayishining tabiiy jarayonini qo‘llab-quvvatlaydi", "Moddalar almashinuvini tezlashtiradi", "Ishtahani nazorat qilishga yordam beradi", "Parhez va mashg‘ulotlarda energiya darajasini ushlab turadi"] },
  },
  {
    id: "d3", cat: "imm", price: 187000, old: 192000, count: 100, form: "soft", rating: 4.9, reviews: 85, orders: "200+", g: 2, c: true,
    uzum: "https://uzum.uz/ru/product/greenwell-vitamin-d3-1965095",
    ru: { n: "Витамин D3, 600 МЕ", s: "Для зубов, костей и иммунной системы", b: ["Поддерживает иммунную систему", "Регулирует усвоение кальция и фосфора", "Укрепляет кости и зубы", "Поддерживает здоровье мышц"] },
    uz: { n: "Vitamin D3, 600 IU", s: "Suyaklar, tishlar va immunitet salomatligi", b: ["Immun tizimini qo‘llab-quvvatlaydi", "Kalsiy va fosfor o‘zlashtirilishini boshqaradi", "Suyak va tishlarni mustahkamlaydi", "Mushaklar salomatligini qo‘llab-quvvatlaydi"] },
  },
  {
    id: "vc", cat: "imm", price: 175000, old: 185000, count: 60, form: "caps", rating: 5, reviews: 48, orders: "100+", g: 5, c: false,
    uzum: "https://uzum.uz/ru/product/greenwell-vitamin-s-2117560",
    ru: { n: "Витамин C + Шиповник", s: "Для укрепления сосудов и иммунитета", b: ["Повышает защитные силы организма", "Обладает антиоксидантным действием", "Укрепляет сосуды", "Улучшает усвоение железа"] },
    uz: { n: "Vitamin C + Na’matak", s: "Immunitet va antioksidant himoya uchun", b: ["Organizmning himoya kuchlarini oshiradi", "Antioksidant ta’sirga ega", "Qon tomirlarini mustahkamlaydi", "Temir o‘zlashtirilishini yaxshilaydi"] },
  },
  {
    id: "nails", cat: "beauty", price: 344000, old: 344000, count: 60, form: "caps", rating: 4.9, reviews: 35, orders: "100+", g: 2, c: true,
    uzum: "https://uzum.uz/ru/product/greenwell-nails-hair-1975106",
    ru: { n: "Ногти, Волосы и Кожа", s: "Комплекс для укрепления кожи, волос и ногтей", b: ["Укрепляет волосы, снижает ломкость", "Поддерживает эластичность и увлажнение кожи", "Снижает ломкость и расслаивание ногтей", "Стимулирует выработку собственного коллагена"] },
    uz: { n: "Tirnoq, Soch va Teri", s: "Teri, soch va tirnoqlar go‘zalligi va salomatligi", b: ["Sochni mustahkamlaydi, mo‘rtlikni kamaytiradi", "Teri elastikligi va namligini qo‘llab-quvvatlaydi", "Tirnoqlar mo‘rtligi va qatlanishini kamaytiradi", "O‘z kollageni ishlab chiqarilishini rag‘batlantiradi"] },
  },
];

/* Наш пример «с этим покупают»; в работе пары считает панель по заказам. */
export const PAIRS = {
  mgc: ["sleep", "mgb", "d3"], mgb: ["sleep", "mgc", "om"], sleep: ["mgc", "mgb", "om"],
  se: ["zinc", "vc", "d3"], zinc: ["se", "nails", "multi"], vc: ["d3", "zinc", "se"], d3: ["vc", "om", "multi"],
  multi: ["om", "d3", "q10"], om: ["q10", "d3", "multi"], q10: ["om", "mgc", "multi"],
  glu: ["d3", "om", "mgc"], nails: ["zinc", "se", "vc"], wl: ["multi", "om", "mgc"],
};

/* Отзывы покупателей с их витрины на Uzum Market, как есть. */
export const REVIEWS = {
  mgc: [
    { a: "Umida", d: "13.10", r: 5, t: "Assalomu aleykum buyurtmani oldim juda sifatli qadoqda keldi katta raxmat, hali endi ichishni boshladim natija bo'lsa yana izoh qoldiraman" },
    { a: "Покупатель", d: "02.10", r: 5, t: "Действительно качественный. Всем посоветую, я уже второй раз покупаю." },
    { a: "Покупатель", d: "27.09", r: 5, t: "Sifati yaxshi. Tavsiya qilaman, natijasi bor." },
  ],
  mgb: [
    { a: "Xumora", d: "14.08", r: 5, t: "Oldin ham Magniy sitratni olgandim. Ichdim foydasi bo'ldi. Shuning uchun ham yana buyurtma qildim. Olishni tavsiya qilaman." },
    { a: "Гузаль", d: "18.07", r: 5, t: "Очень хорошие витамины, рекомендую." },
  ],
  sleep: [
    { a: "Robert", d: "21.08", r: 5, t: "Купила вторую баночку и порекомендовала почти всем знакомым. День на 15-17 я уже стала намного активнее, почувствовала, что за то же время сна лучше высыпаюсь." },
    { a: "Ленара", d: "23.07", r: 5, t: "Уже не первый раз беру эти бады. Эффект очень хороший. Стала лучше спать." },
  ],
  se: [
    { a: "Mehribonu", d: "12.05", r: 5, t: "Zakaz qilsa arziydi, ham sifatli ham hamyonbop, sroklari ham yaxshi." },
    { a: "Feruza", d: "05.05", r: 5, t: "Judayam yaxshi holatda keldi, endi ichib boshliman." },
  ],
  q10: [
    { a: "YUSUF", d: "26.07", r: 5, t: "Всё пришло в отлично упакованной, в оригинальной упаковке. Качество превосходное! Буду заказывать ещё!" },
    { a: "Венера", d: "13.05", r: 5, t: "Отличный работающий препарат, самое главное без глютена. Беру уже второй раз." },
  ],
  om: [
    { a: "Покупатель", d: "03.08", r: 5, t: "Доставка супер. Соблюдены все нормы перевозки бьющихся товаров. Очень хороший, раньше принимала, заказала ещё." },
    { a: "Севара", d: "31.07", r: 5, t: "Жуда зор. Олиб ичишларингни тавсия киламан." },
  ],
  multi: [
    { a: "Зарина", d: "12.10", r: 5, t: "Пришёл в срок, хорошо упакован. Спасибо продавцу." },
    { a: "Азиз", d: "04.10", r: 5, t: "Juda ham zo‘r, original ekan. Inson organizmi uchun kerakli bo‘lgan hamma vitaminlar bor ekan." },
  ],
  zinc: [
    { a: "Go'zal", d: "25.07", r: 5, t: "Juda tez, sifatli. Sifati a’lo darajada, Greenwellga raxmat." },
    { a: "Покупатель", d: "11.09", r: 5, t: "Yuqori sifat. Asosiysi inson salomatligi uchun foydali." },
  ],
  glu: [
    { a: "Людмила", d: "12.08", r: 5, t: "Очень аккуратно упаковано. Продавец порядочный. Обещали скидку на следующую покупку. Сделано! Большое спасибо." },
    { a: "Покупатель", d: "21.07", r: 5, t: "Juda ajoyib ekan." },
  ],
  wl: [
    { a: "Сливакова", d: "30.07", r: 5, t: "Очень понравился данный продукт! Впервые приобрела в аптеке. Буду заказывать и другую продукцию этой же фирмы." },
    { a: "mir", d: "07.07", r: 5, t: "Эффективно. Эффект отличный." },
  ],
  d3: [
    { a: "Римма", d: "06.07", r: 5, t: "Действительно работает, рекомендую." },
    { a: "Nasiba", d: "31.07", r: 5, t: "Yaxshi ta’sir qiladi. Tavsiya qilaman." },
  ],
  vc: [
    { a: "Jamila", d: "04.09", r: 5, t: "Ta’sirini qisqa vaqtda sezdim, juda sifatli. Bu brendning boshqa mahsulotlarini ham ichganman, yaxshi foyda bergan." },
    { a: "Светлана", d: "07.06", r: 5, t: "Взяла этот продукт по хорошим отзывам. Начала пить." },
  ],
  nails: [
    { a: "shaxnoza", d: "03.08", r: 5, t: "Мои волосы и ногти быстро растут. Мне понравился." },
    { a: "Елена", d: "29.05", r: 5, t: "Оригинал, хорошее качество. Куплю ещё." },
  ],
};

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
  delivery: 20000, freeFrom: 400000, pointsRate: 0.03, pointsMaxShare: 0.3,
  reviewPts: 3000, reviewPhotoPts: 7000, welcome: 15000,
  promo: { GREEN10: 10, WELLNESS: 15 },
  levels: [{ id: "green", n: ["Green", "Green"], from: 0, k: 3 }, { id: "silver", n: ["Silver", "Silver"], from: 1500000, k: 5 }, { id: "gold", n: ["Gold", "Gold"], from: 4000000, k: 7 }],
};
