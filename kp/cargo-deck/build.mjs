// Презентация для карго-компаний: с ней менеджер выходит на логистов.
//
//   node kp/cargo-deck/build.mjs            → kp/cargo-deck/cargo-ru.html, cargo-uz.html
//   node kp/cargo-deck/pdf.mjs              → kp/cargo-ru.pdf, kp/cargo-uz.pdf
//
// Владелец, 03.11.2026: «Сделай презентацию в пдф на узбекском и русском
// языке, с которой менеджер будет выходить на компании cargo, чтобы они
// офигели от функционала. Покажи удобство, выгоду, почему сейчас надо делать,
// почему важен не только внешний вид, но и автоматизация. Презентуй макет».
//
// Экраны — макет scripts/protos/cargopro без бренда клиента: имя, логотип,
// домен и телефоны заменены на «YOUR CARGO» (чужой знак в нашей рекламе без
// договора не ставим, proto-master §5). Цены — из plan.mjs макета, чтобы
// презентация и макет не разошлись. Числа выгоды — демо-рейсы макета и
// примеры с подписанными допущениями, не обещания.
import { writeFileSync } from "node:fs";
import { ADDONS, BASE, MODULES } from "../../scripts/protos/cargopro/plan.mjs";

const DIR = new URL(".", import.meta.url).pathname;
const money = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " $";
const tms = MODULES.find((m) => m.id === "tms");
const ltl = MODULES.find((m) => m.id === "ltl");
const addonsSum = ADDONS.reduce((s, a) => s + a.price, 0);
const siteAll = BASE.promo + addonsSum;

function deck(L) {
  const t = (ru, uz) => (L === "uz" ? uz : ru);
  const img = (n) => `img/${L}/${n}.jpg`;
  const browser = (n, cls = "") => `<figure class="br ${cls}"><i></i><img src="${img(n)}" alt=""></figure>`;
  const phone = (n, cls = "") => `<figure class="ph ${cls}"><img src="${img(n + "-m")}" alt=""></figure>`;
  const li = (a) => `<ul class="pts">${a.map((x) => `<li>${x}</li>`).join("")}</ul>`;
  const foot = (n) => `<footer><b>DevUz Studio</b><span>devuz.studio · t.me/Devuz_studio_bot</span><span class="n">${n}</span></footer>`;
  let n = 0;
  const slide = (cls, body) => `<section class="slide ${cls}">${body}${foot(++n)}</section>`;
  const kick = (s) => `<p class="kick">${s}</p>`;

  const S = [];

  /* 1. Обложка */
  S.push(slide("cover", `
<div class="cv-l">
  ${kick(t("Для карго и логистических компаний", "Kargo va logistika kompaniyalari uchun"))}
  <h1>${t("Сайт, который сам считает и&nbsp;продаёт перевозку.<br><em>Система, которая сама ею управляет.</em>", "Tashishni o‘zi hisoblaydigan va sotadigan sayt.<br><em>Uni o‘zi boshqaradigan tizim.</em>")}</h1>
  <p class="lead">${t("Готовый макет: сайт с расчётом доставки, личный кабинет клиента с Telegram и супер-админка для диспетчеров, водителей и документов.", "Tayyor maket: yetkazish hisobli sayt, Telegram bilan mijoz kabineti hamda dispetcherlar, haydovchilar va hujjatlar uchun super admin panel.")}</p>
  <p class="tag">${t("Покажем на вашем логотипе и ваших направлениях. Макет бесплатно.", "Sizning logotipingiz va yo‘nalishlaringizda ko‘rsatamiz. Maket bepul.")}</p>
</div>
<div class="cv-r">${browser("hero", "cv-br")}${phone("client-map", "cv-ph")}</div>`));

  /* 2. Как сейчас */
  S.push(slide("pain", `
${kick(t("Как сейчас работает большинство карго-компаний", "Ko‘pchilik kargo kompaniyalari hozir qanday ishlaydi"))}
<h2>${t("Деньги теряются не на дорогах, а&nbsp;между звонками", "Pul yo‘lda emas, qo‘ng‘iroqlar orasida yo‘qoladi")}</h2>
<div class="grid3">
  <div class="card"><b>01</b><h3>${t("«Сколько стоит?» = звонок", "«Qancha turadi?» = qo‘ng‘iroq")}</h3><p>${t("Клиент не видит цену на сайте, пишет в мессенджер и ждёт, пока менеджер посчитает. Пока ждёт, пишет конкуренту.", "Mijoz saytda narxni ko‘rmaydi, messenjerga yozib, menejer hisoblashini kutadi. Kutayotganda raqobatchiga yozadi.")}</p></div>
  <div class="card"><b>02</b><h3>${t("«Где мой груз?» весь день", "Kun bo‘yi «Yukim qayerda?»")}</h3><p>${t("Диспетчер вместо работы отвечает клиентам, звонит водителям и пересылает статусы руками.", "Dispetcher ishlash o‘rniga mijozlarga javob beradi, haydovchilarga qo‘ng‘iroq qiladi va holatni qo‘lda yuboradi.")}</p></div>
  <div class="card"><b>03</b><h3>${t("Машины грузят на глаз", "Mashinalar taxminan yuklanadi")}</h3><p>${t("Кто куда поедет, решают в Excel и чатах. Машина уходит полупустой, водитель делает крюк по городу.", "Kim qayerga borishini Excel va chatlarda hal qilishadi. Mashina yarim bo‘sh ketadi, haydovchi shahar bo‘ylab aylanib yuradi.")}</p></div>
  <div class="card"><b>04</b><h3>${t("Простой не выставлен в счёт", "Turib qolish hisobga yozilmaydi")}</h3><p>${t("Машина 6 часов стоит на погрузке. Норму никто не считал, доплату с клиента не взяли.", "Mashina yuklashda 6 soat turadi. Me’yorni hech kim hisoblamagan, mijozdan qo‘shimcha haq olinmagan.")}</p></div>
  <div class="card"><b>05</b><h3>${t("Документы для границы с ошибкой", "Chegara hujjatlarida xato")}</h3><p>${t("Номер прицепа, паспорт водителя, книжка МДП собираются из переписки. Одна ошибка, и машина стоит на посту.", "Tirkama raqami, haydovchi pasporti, TIR daftarchasi yozishmalardan yig‘iladi. Bitta xato va mashina postda turadi.")}</p></div>
  <div class="card"><b>06</b><h3>${t("Заявка ночью потерялась", "Tunda kelgan ariza yo‘qoldi")}</h3><p>${t("Клиент написал вечером в Instagram, утром его никто не нашёл. В 1С и Битрикс всё вносят второй раз руками.", "Mijoz kechqurun Instagram’ga yozdi, ertalab uni hech kim topmadi. 1C va Bitrix’ga hammasi ikkinchi marta qo‘lda kiritiladi.")}</p></div>
</div>`));

  /* 3. Что получает компания */
  S.push(slide("three", `
${kick(t("Одна система, три экрана", "Bitta tizim, uchta ekran"))}
<h2>${t("Всё, что видит клиент, менеджер и диспетчер, связано между собой", "Mijoz, menejer va dispetcher ko‘radigan hamma narsa o‘zaro bog‘langan")}</h2>
<div class="grid3 tall">
  <div class="card"><h3>${t("Сайт", "Sayt")}</h3><p>${t("Клиент сам считает цену, отправляет заявку и смотрит, где груз. На русском и узбекском, сначала под телефон.", "Mijoz narxni o‘zi hisoblaydi, ariza yuboradi va yuk qayerdaligini ko‘radi. Rus va o‘zbek tilida, avvalo telefon uchun.")}</p>${browser("calc", "mini")}</div>
  <div class="card"><h3>${t("Кабинет клиента", "Mijoz kabineti")}</h3><p>${t("Вход через Telegram, все грузы, документы, водитель на карте, статусы приходят в бот.", "Telegram orqali kirish, barcha yuklar, hujjatlar, xaritada haydovchi, holatlar botga keladi.")}</p>${browser("client-orders", "mini")}</div>
  <div class="card"><h3>${t("Супер-админка", "Super admin panel")}</h3><p>${t("Распределение по машинам, маршруты, водители, автопарк, документы для брокера, 1С, Битрикс24, Telegram.", "Mashinalarga taqsimlash, marshrutlar, haydovchilar, avtopark, broker hujjatlari, 1C, Bitrix24, Telegram.")}</p>${browser("dispatch-plan", "mini")}</div>
</div>
<p class="note">${t("Статус, который диспетчер поставил в системе, клиент сразу видит на сайте и получает в Telegram. Никто ничего не пересылает руками.", "Dispetcher tizimda qo‘ygan holatni mijoz darhol saytda ko‘radi va Telegram’da oladi. Hech kim hech narsani qo‘lda yubormaydi.")}</p>`));

  /* 4. Сайт и расчёт */
  S.push(slide("split", `
<div class="txt">
  ${kick(t("Сайт", "Sayt"))}
  <h2>${t("Цена за 10 секунд, а&nbsp;не после звонка", "Narx qo‘ng‘iroqdan keyin emas, 10 soniyada")}</h2>
  ${li([
    t("Направление, транспорт, вес и объём: сумма и срок считаются сразу, в UZS, USD, EUR или AED", "Yo‘nalish, transport, og‘irlik va hajm: summa va muddat darhol hisoblanadi, UZS, USD, EUR yoki AED’da"),
    t("Объёмный вес, тип груза, страховка, таможня и доставка до двери входят в расчёт", "Hajmiy og‘irlik, yuk turi, sug‘urta, bojxona va eshikkacha yetkazish hisobga kiradi"),
    t("Заявка падает в админку первой строкой, ночью тоже", "Ariza admin panelga birinchi qatorda tushadi, tunda ham"),
    t("Ставки компания меняет сама в «Настройках», сайт пересчитывает сразу", "Stavkalarni kompaniya «Sozlamalar»da o‘zi o‘zgartiradi, sayt darhol qayta hisoblaydi"),
  ])}
</div>
<div class="pic">${browser("calc")}${phone("hero", "over")}</div>`));

  /* 5. Отслеживание и кабинет */
  S.push(slide("split rev", `
<div class="pic">${browser("client-map")}${phone("client-bot", "over")}</div>
<div class="txt">
  ${kick(t("Кабинет клиента", "Mijoz kabineti"))}
  <h2>${t("«Где мой груз?» клиент смотрит сам", "«Yukim qayerda?»ni mijoz o‘zi ko‘radi")}</h2>
  ${li([
    t("Вход через Telegram в одно нажатие или по номеру телефона", "Telegram orqali bir bosishda yoki telefon raqami bilan kirish"),
    t("Машина на карте, пройденные точки и время прибытия", "Xaritada mashina, o‘tilgan nuqtalar va yetib kelish vaqti"),
    t("Заказ привязывается к Telegram: выезд, таможня, прибытие, документы готовы", "Buyurtma Telegram’ga bog‘lanadi: jo‘nash, bojxona, yetib kelish, hujjatlar tayyor"),
    t("CMR, счёт и акт там же, «Повторить заказ» в одно нажатие", "CMR, hisob va dalolatnoma shu yerda, «Buyurtmani takrorlash» bir bosishda"),
  ])}
</div>`));

  /* 6. Обычная админка */
  S.push(slide("split", `
<div class="txt">
  ${kick(t("Обычная админка", "Oddiy admin panel"))}
  <h2>${t("Заявки и грузы в одном месте, а&nbsp;не в пяти чатах", "Arizalar va yuklar beshta chatda emas, bir joyda")}</h2>
  ${li([
    t("Заявки с сайта первой строкой, статус меняется в два нажатия", "Saytdan arizalar birinchi qatorda, holat ikki bosishda o‘zgaradi"),
    t("Клиенты, грузы, сводка по выручке и направлениям", "Mijozlar, yuklar, tushum va yo‘nalishlar bo‘yicha xulosa"),
    t("Роли: менеджер не видит маржу и выручку", "Rollar: menejer marja va tushumni ko‘rmaydi"),
    t("История: кто, что и когда поменял", "Tarix: kim, nimani va qachon o‘zgartirdi"),
  ])}
  <p class="price">${t("Входит в сайт с допами", "Qo‘shimchalar bilan saytga kiradi")}</p>
</div>
<div class="pic">${browser("panel-reqs")}</div>`));

  /* 7. Супер-админка: распределение */
  S.push(slide("split rev", `
<div class="pic">${browser("dispatch-plan")}${phone("dispatch-bad", "over")}</div>
<div class="txt">
  ${kick(t("Супер-админка · распределение", "Super admin panel · taqsimlash"))}
  <h2>${t("Грузы сами ложатся по машинам", "Yuklar mashinalarga o‘zi tushadi")}</h2>
  ${li([
    t("Кнопка «Распределить»: тип кузова, вес и объём сразу. Опасный груз только в машину с ADR", "«Taqsimlash» tugmasi: kuzov turi, og‘irlik va hajm birdaniga. Xavfli yuk faqat ADR ruxsatli mashinaga"),
    t("Загрузка каждой машины в кг и м³, что не поместилось и почему", "Har bir mashinaning kg va m³ dagi yuklanishi, nima sig‘madi va nega"),
    t("Перенесли груз в чужой кузов или с перегрузом: машина горит красным", "Yukni noto‘g‘ri kuzovga yoki ortiqcha yuk bilan o‘tkazdingiz: mashina qizil yonadi"),
    t("Новая машина из автопарка сразу участвует в распределении", "Avtoparkdagi yangi mashina darhol taqsimlashda qatnashadi"),
  ])}
</div>`));

  /* 8. Водители на карте */
  S.push(slide("split", `
<div class="txt">
  ${kick(t("Супер-админка · водители", "Super admin panel · haydovchilar"))}
  <h2>${t("Все машины на одной карте", "Barcha mashinalar bitta xaritada")}</h2>
  ${li([
    t("Статус каждой машины: в пути, погрузка, простой, опаздывает", "Har bir mashina holati: yo‘lda, yuklash, turib qolish, kechikmoqda"),
    t("Тревоги сами: «свернул с маршрута», «стоит дольше 40 минут»", "Ogohlantirishlar o‘zi: «marshrutdan chiqdi», «40 daqiqadan ko‘p turibdi»"),
    t("Карточка водителя: маршрут, скорость, топливо, звонок и Telegram", "Haydovchi kartochkasi: marshrut, tezlik, yoqilg‘i, qo‘ng‘iroq va Telegram"),
    t("Выбор перевозчика по рейтингу и цене", "Tashuvchini reyting va narx bo‘yicha tanlash"),
  ])}
</div>
<div class="pic">${browser("dispatch-map")}</div>`));

  /* 9. Сборные грузы и маршрут */
  S.push(slide("split rev", `
<div class="pic">${browser("route")}<div class="badge"><b>−31,9 ${t("км", "km")}</b><span>${t("на демо-рейсе с 6 адресами: 88,5 → 56,5 км, −36%, −7,7 л дизеля, без опозданий", "6 manzilli demo-reysda: 88,5 → 56,5 km, −36%, −7,7 l dizel, kechikishsiz")}</span></div></div>
<div class="txt">
  ${kick(t("Модуль «Сборные грузы»", "«Yig‘ma yuklar» moduli"))}
  <h2>${t("Забор с нескольких адресов по короткому маршруту", "Bir nechta manzildan qisqa marshrut bo‘yicha olib ketish")}</h2>
  ${li([
    t("Мелкие заказы разных отправителей собираются в один рейс по весу, объёму и совместимости", "Turli jo‘natuvchilarning kichik buyurtmalari og‘irlik, hajm va moslik bo‘yicha bitta reysga yig‘iladi"),
    t("Порядок адресов считается сам, с окнами забора и временем погрузки", "Manzillar tartibi olib ketish oynalari va yuklash vaqti bilan o‘zi hisoblanadi"),
    t("Рядом «по порядку заявок» и «оптимальный»: км, часы, литры, деньги", "Yonma-yon «arizalar tartibida» va «optimal»: km, soat, litr, pul"),
    t("Попутный забор встаёт туда, где добавит меньше всего километров", "Yo‘l-yo‘lakay olib ketish eng kam kilometr qo‘shadigan joyga qo‘yiladi"),
  ])}
</div>`));

  /* 10. Автопарк и пакет для брокера */
  S.push(slide("split", `
<div class="txt">
  ${kick(t("Супер-админка · автопарк и таможня", "Super admin panel · avtopark va bojxona"))}
  <h2>${t("Документы для брокера собираются сами", "Broker uchun hujjatlar o‘zi yig‘iladi")}</h2>
  ${li([
    t("Машины: госномера с проверкой, тип борта, VIN, ADR, книжка МДП, страховки", "Mashinalar: tekshiruvli davlat raqamlari, kuzov turi, VIN, ADR, TIR daftarchasi, sug‘urtalar"),
    t("Водители: ФИО латиницей как в паспорте, паспорт, ПИНФЛ, права, медсправка", "Haydovchilar: pasportdagidek lotincha F.I.Sh., pasport, JShShIR, guvohnoma, tibbiy ma’lumotnoma"),
    t("Срок документа подходит: строка жёлтая, просрочен: красная, напоминание в Telegram", "Hujjat muddati yaqinlashsa: qator sariq, o‘tib ketsa: qizil, Telegram’da eslatma"),
    t("«Пакет для брокера»: CMR, МДП, пломбы, пункт пропуска. Чего не хватает, видно до отправки", "«Broker uchun paket»: CMR, TIR, plombalar, o‘tkazish punkti. Nima yetishmasligi yuborishdan oldin ko‘rinadi"),
  ])}
</div>
<div class="pic">${browser("super-fleet")}${browser("super-broker", "over2")}</div>`));

  /* 11. Интеграции */
  S.push(slide("split rev", `
<div class="pic">${browser("super-int")}</div>
<div class="txt">
  ${kick(t("Интеграции · бесплатно в супер-админке", "Integratsiyalar · super admin panelda bepul"))}
  <h2>${t("1С, Битрикс24 и Telegram без двойного ввода", "1C, Bitrix24 va Telegram ikki marta kiritmasdan")}</h2>
  ${li([
    t("1С: рейс уходит реализацией, счётом и актом, ЭСФ через Didox или Faktura.uz", "1C: reys sotuv, hisob va dalolatnoma bo‘lib ketadi, ESF Didox yoki Faktura.uz orqali"),
    t("Битрикс24: заявка с сайта становится сделкой, стадии повторяют статус рейса", "Bitrix24: saytdagi ariza bitimga aylanadi, bosqichlar reys holatini takrorlaydi"),
    t("Telegram: бот водителю («прибыл, загрузился, выехал», фото CMR), бот клиенту, группа диспетчеров", "Telegram: haydovchi uchun bot («yetib keldim, yukladim, chiqdim», CMR surati), mijoz uchun bot, dispetcherlar guruhi"),
    t("Журнал обмена: видно, что и куда ушло", "Almashish jurnali: nima qayerga ketgani ko‘rinadi"),
  ])}
</div>`));

  /* 12. Настройки */
  S.push(slide("split", `
<div class="txt">
  ${kick(t("Супер-админка · настройки", "Super admin panel · sozlamalar"))}
  <h2>${t("Простой теперь в счёте, а&nbsp;не в убытке", "Turib qolish endi zararda emas, hisobda")}</h2>
  ${li([
    t("Тарифы по категории груза, плотности и объёму, минимум, топливная надбавка", "Yuk toifasi, zichlik va hajm bo‘yicha tariflar, minimum, yoqilg‘i ustamasi"),
    t("Ожидание: сколько заложено в цену, сколько бесплатно, ставка в час сверх нормы", "Kutish: narxga qancha kiritilgan, qancha bepul, me’yordan ortig‘i uchun soatlik stavka"),
    t("В рейсе и у клиента одна строка: «норма 5 ч, факт 6 ч 20 мин, сверх 1 ч 20 мин × 15 $ = 20 $»", "Reysda va mijozda bitta qator: «me’yor 5 soat, fakt 6 soat 20 daqiqa, ortig‘i 1 soat 20 daqiqa × 15 $ = 20 $»"),
    t("Пользователи и роли: кто что видит и меняет, от владельца до брокера", "Foydalanuvchilar va rollar: egasidan brokergacha kim nimani ko‘radi va o‘zgartiradi"),
  ])}
</div>
<div class="pic">${browser("settings-waiting")}${browser("settings-matrix", "over2")}</div>`));

  /* 13. Не только внешний вид */
  S.push(slide("vs", `
${kick(t("Почему важен не только внешний вид", "Nega faqat tashqi ko‘rinish muhim emas"))}
<h2>${t("Красивый сайт приводит клиента. Автоматизация не даёт его потерять и&nbsp;зарабатывает на каждом рейсе", "Chiroyli sayt mijozni olib keladi. Avtomatlashtirish uni yo‘qotmaydi va har bir reysda daromad keltiradi")}</h2>
<table class="cmp">
  <thead><tr><th></th><th>${t("Просто красивый сайт", "Shunchaki chiroyli sayt")}</th><th class="hi">${t("Сайт + автоматизация", "Sayt + avtomatlashtirish")}</th></tr></thead>
  <tbody>
    ${[
      [t("Цена", "Narx"), t("«Напишите менеджеру»", "«Menejerga yozing»"), t("Клиент считает сам за 10 секунд", "Mijoz 10 soniyada o‘zi hisoblaydi")],
      [t("Заявка ночью", "Tungi ariza"), t("Ждёт до утра в почте", "Ertalabgacha pochtada kutadi"), t("Сразу в админке и в Битрикс24", "Darhol admin panelda va Bitrix24’da")],
      [t("«Где груз?»", "«Yuk qayerda?»"), t("Звонок диспетчеру", "Dispetcherga qo‘ng‘iroq"), t("Карта в кабинете и бот в Telegram", "Kabinetda xarita va Telegram’da bot")],
      [t("Загрузка машин", "Mashinalarni yuklash"), t("Excel и чат", "Excel va chat"), t("Распределение по весу, объёму и кузову", "Og‘irlik, hajm va kuzov bo‘yicha taqsimlash")],
      [t("Километры", "Kilometrlar"), t("Как водитель решит", "Haydovchi qanday hal qilsa"), t("Короткий маршрут забора", "Olib ketishning qisqa marshruti")],
      [t("Простой", "Turib qolish"), t("Забыли выставить", "Hisobga yozishni unutishdi"), t("Считается сам и попадает в счёт", "O‘zi hisoblanadi va hisobga tushadi")],
      [t("Документы на границу", "Chegara hujjatlari"), t("Собирают из переписки", "Yozishmalardan yig‘ishadi"), t("Пакет для брокера за минуту", "Broker uchun paket bir daqiqada")],
      [t("1С и учёт", "1C va hisob"), t("Вбивают второй раз", "Ikkinchi marta kiritishadi"), t("Уходит само", "O‘zi ketadi")],
    ].map(([a, b, c]) => `<tr><td>${a}</td><td class="no">${b}</td><td class="hi">${c}</td></tr>`).join("")}
  </tbody>
</table>`));

  /* 14. Выгода в цифрах */
  S.push(slide("money", `
${kick(t("Выгода: посчитайте на своих цифрах", "Foyda: o‘z raqamlaringizda hisoblang"))}
<h2>${t("Система окупается не дизайном, а&nbsp;тем, что перестаёт теряться", "Tizim dizayn bilan emas, yo‘qolishi to‘xtagan narsa bilan o‘zini oqlaydi")}</h2>
<div class="grid3">
  <div class="card big"><p class="k">${t("Простой в счёт", "Turib qolish hisobga")}</p><p class="v">1&nbsp;500&nbsp;$</p><p>${t("в месяц, если 100 рейсов и в каждом в среднем 1 час неоплаченного простоя по 15 $", "oyiga, agar 100 ta reys bo‘lsa va har birida o‘rtacha 1 soat 15 $ dan to‘lanmagan turib qolish bo‘lsa")}</p></div>
  <div class="card big"><p class="k">${t("Километры", "Kilometrlar")}</p><p class="v">−36%</p><p>${t("пробега на заборе с 6 адресов в демо-рейсе макета: 88,5 → 56,5 км", "maketdagi demo-reysda 6 manzildan olib ketishda yurish: 88,5 → 56,5 km")}</p></div>
  <div class="card big"><p class="k">${t("Время диспетчера", "Dispetcher vaqti")}</p><p class="v">${t("2 часа", "2 soat")}</p><p>${t("в день, если 40 звонков «где груз?» по 3 минуты уходят в кабинет и бот", "kuniga, agar 3 daqiqadan 40 ta «yuk qayerda?» qo‘ng‘irog‘i kabinet va botga o‘tsa")}</p></div>
</div>
<p class="note">${t("Это примеры с подписанными допущениями, а не обещания. На встрече подставим ваши рейсы, ставки и число звонков.", "Bu taxminlari yozilgan misollar, va’da emas. Uchrashuvda sizning reyslaringiz, stavkalaringiz va qo‘ng‘iroqlar sonini qo‘yamiz.")}</p>`));

  /* 15. Почему сейчас */
  S.push(slide("why", `
${kick(t("Почему сейчас", "Nega hozir"))}
<h2>${t("Клиент сравнивает перевозчиков за минуту. Побеждает тот, у кого цена и&nbsp;статус видны сразу", "Mijoz tashuvchilarni bir daqiqada solishtiradi. Narxi va holati darhol ko‘rinadigan yutadi")}</h2>
<div class="grid2">
  <div class="card"><h3>${t("Рынок уже онлайн", "Bozor allaqachon onlayn")}</h3><p>${t("Грузовые сервисы и биржи приучили клиентов к расчёту онлайн и отслеживанию машины. Кто отвечает «перезвоним», тот теряет заявку.", "Yuk servislari va birjalar mijozlarni onlayn hisob va mashinani kuzatishga o‘rgatdi. «Qayta qo‘ng‘iroq qilamiz» degan arizani yo‘qotadi.")}</p></div>
  <div class="card"><h3>${t("Документы уже цифровые", "Hujjatlar allaqachon raqamli")}</h3><p>${t("ЭСФ идут через Didox и Faktura.uz. Система встраивается в то, что бухгалтерия и так делает, а не добавляет работу.", "ESF Didox va Faktura.uz orqali o‘tadi. Tizim buxgalteriya baribir qiladigan ishga qo‘shiladi, ish qo‘shmaydi.")}</p></div>
  <div class="card"><h3>${t("Данные копятся с первого дня", "Ma’lumotlar birinchi kundan to‘planadi")}</h3><p>${t("Чем раньше рейсы, простои и километры попадают в систему, тем раньше видно, где компания теряет деньги.", "Reyslar, turib qolishlar va kilometrlar tizimga qanchalik erta tushsa, kompaniya pulni qayerda yo‘qotayotgani shunchalik erta ko‘rinadi.")}</p></div>
  <div class="card"><h3>${t("Начать можно с сайта", "Saytdan boshlash mumkin")}</h3><p>${t("Сначала сайт с расчётом и заявками, потом супер-админка. Всё уже связано, переделывать не придётся.", "Avval hisobli va arizali sayt, keyin super admin panel. Hammasi allaqachon bog‘langan, qayta qilish kerak bo‘lmaydi.")}</p></div>
</div>`));

  /* 16. Уже делали */
  S.push(slide("done", `
<div class="txt">
  ${kick(t("Уже делали", "Allaqachon qilganmiz"))}
  <h2>${t("Для Lider Cargo: приложение водителя LBM Driver", "Lider Cargo uchun: LBM Driver haydovchi ilovasi")}</h2>
  ${li([
    t("Отслеживание водителя на карте", "Haydovchini xaritada kuzatish"),
    t("Выбор водителя по рейтингу и цене", "Haydovchini reyting va narx bo‘yicha tanlash"),
    t("Приложение опубликовано в App Store и Google Play", "Ilova App Store va Google Play’da chop etilgan"),
  ])}
  <p class="lead">${t("Опыт этого проекта лёг в супер-админку: те же водители, карта и рейтинг, но вместе с сайтом, кабинетом клиента и документами.", "Shu loyiha tajribasi super admin panelga kirdi: o‘sha haydovchilar, xarita va reyting, lekin sayt, mijoz kabineti va hujjatlar bilan birga.")}</p>
</div>
<div class="pic">${browser("super-compare")}</div>`));

  /* 17. Цена */
  const addonRows = ADDONS.map((a) => `<tr><td>${a[L].t}</td><td>${money(a.price)}</td></tr>`).join("");
  S.push(slide("prices", `
${kick(t("Стоимость", "Narxi"))}
<h2>${t("Начните с сайта, добавляйте по мере роста", "Saytdan boshlang, o‘sgan sari qo‘shing")}</h2>
<div class="pr">
  <div class="card"><p class="k">${t("Сайт по макету", "Maket bo‘yicha sayt")}</p><p class="v">${money(BASE.promo)}</p><p class="was">${t("обычная цена", "odatiy narx")} ${money(BASE.price)}</p><p>${t("Расчёт доставки, заявки, услуги, таможня, склады, ru и uz", "Yetkazish hisobi, arizalar, xizmatlar, bojxona, omborlar, ru va uz")}</p>
  <table class="ad">${addonRows}<tr class="sum"><td>${t("Сайт со всеми допами", "Barcha qo‘shimchalar bilan sayt")}</td><td>${money(siteAll)}</td></tr></table></div>
  <div class="card hi"><p class="k">${t("Супер-админка", "Super admin panel")}</p><p class="v">${money(tms.price)}</p><p class="was">${tms.market[L]}</p>
  ${li([
    t("Распределение по машинам, водители на карте, рейсы", "Mashinalarga taqsimlash, xaritada haydovchilar, reyslar"),
    t("Бесплатно внутри: 1С, Битрикс24, Telegram, автопарк, пакет для брокера, настройки, роли", "Ichida bepul: 1C, Bitrix24, Telegram, avtopark, broker paketi, sozlamalar, rollar"),
  ])}
  <p class="k2">+ ${ltl[L].t}</p><p class="v2">${money(ltl.price)}</p></div>
</div>
<p class="note">${t("Цены как в макете. Точную смету и сроки даём после короткого брифа.", "Narxlar maketdagidek. Aniq smeta va muddatlarni qisqa brifdan keyin beramiz.")}</p>`));

  /* 18. Как начать */
  S.push(slide("cta", `
${kick(t("Как начать", "Qanday boshlash"))}
<h2>${t("Покажем ваш будущий сайт и систему на&nbsp;вашем логотипе", "Kelajakdagi saytingiz va tizimni logotipingizda ko‘rsatamiz")}</h2>
<ol class="steps">
  <li><b>1</b><span>${t("15 минут: покажем макет по видео или вживую", "15 daqiqa: maketni video orqali yoki jonli ko‘rsatamiz")}</span></li>
  <li><b>2</b><span>${t("Бесплатный макет под вашу компанию: ваш логотип, направления и тарифы", "Kompaniyangiz uchun bepul maket: logotipingiz, yo‘nalishlar va tariflar")}</span></li>
  <li><b>3</b><span>${t("Смета и сроки по этапам: сайт, кабинет, супер-админка", "Bosqichlar bo‘yicha smeta va muddatlar: sayt, kabinet, super admin panel")}</span></li>
  <li><b>4</b><span>${t("Запуск, подключение 1С, Битрикс24 и Telegram, обучение команды", "Ishga tushirish, 1C, Bitrix24 va Telegram’ni ulash, jamoani o‘qitish")}</span></li>
</ol>
<div class="ct"><p><b>devuz.studio</b></p><p>t.me/Devuz_studio_bot</p><p>+998 90 912-05-78</p></div>`));

  return `<!doctype html><html lang="${L}"><head><meta charset="utf-8"><title>${t("DevUz Studio · сайт и система для карго-компании", "DevUz Studio · kargo kompaniyasi uchun sayt va tizim")}</title>
<link rel="stylesheet" href="../fonts-cargo.css"><link rel="stylesheet" href="deck.css"></head><body>${S.join("\n")}</body></html>`;
}

for (const L of ["ru", "uz"]) writeFileSync(`${DIR}cargo-${L}.html`, deck(L));
console.log("ok: cargo-ru.html, cargo-uz.html");
