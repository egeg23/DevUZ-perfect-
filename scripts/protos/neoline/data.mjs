// Факты Neoline — только с их сайта neoline.uz (uz и ru), снято 29.10.2026.
// Товары и цены — catalog.json (catalog.py, их открытый Store API), фото —
// photos.json (photos.py). Чего у них нет, здесь нет: ни отзывов, ни цифр
// продаж, ни сертификатов, ни сроков, которых они не называли.
import { readFileSync } from "node:fs";

const DIR = new URL(".", import.meta.url).pathname;
export const CATALOG = JSON.parse(readFileSync(DIR + "catalog.json", "utf8"));
export const PHOTOS = JSON.parse(readFileSync(DIR + "photos.json", "utf8"));

export const LANGS = ["uz", "ru"];

export const COMPANY = {
  name: "Neoline",
  shop: { ru: "Официальный магазин Neoline", uz: "Rasmiy Do‘kon Neoline" },
  phone: "+998 (94) 88879-43",
  tel: "+998948887943",
  tg: "neolinesupport",
  mail: "sales.uz@neoline.com",
  mail2: "al@neoline.com",
  site: "https://neoline.uz",
  legal: { ru: "ООО «Neoshop»", uz: "«Neoshop» MChJ" },
  address: { ru: "Ташкент, Мирзо-Улугбекский район, Улугбек МФЙ, посёлок Улугбек", uz: "Toshkent, Mirzo Ulug‘bek tumani, Ulug‘bek MFY, Ulug‘bek posyolkasi" },
  inn: "310831306",
};

/* Разделы каталога, как у них в меню. */
export const CATS = [
  { id: "radar", ru: "Радар-детекторы и гибриды", uz: "Radar detektorlari va gibridlar" },
  { id: "dvr", ru: "Видеорегистраторы", uz: "Videoregistratorlar" },
  { id: "audio", ru: "Акустика Ultera", uz: "Ultera akustikasi" },
  { id: "acc", ru: "Аксессуары", uz: "Aksessuarlar" },
  { id: "sale", ru: "Уценка", uz: "Arzonlashtirilgan" },
];

/* Акция с их главной: «Turbocam — sovg‘a sifatida!» у X-COP 8900 и 7900. */
export const GIFT = { ids: [1000458, 1000435], gift: 999441 };

/* Хуки со страниц «Доставка и оплата», «Гарантия и возврат», «О компании». */
export const HOOKS = {
  ru: [
    "Бесплатная доставка за 1-3 дня",
    "Рассрочка Uzum Nasiya без процентов",
    "Оплата UzCard и Humo",
    "Возврат 10 дней без объяснений",
    "Официальная гарантия в Узбекистане",
    "Озвучка на узбекском и русском",
    "База камер и радаров всего Узбекистана",
    "Два сервисных центра в Ташкенте",
  ],
  uz: [
    "1-3 kunda bepul yetkazib berish",
    "Uzum Nasiya foizsiz muddatli to‘lov",
    "UzCard va Humo orqali to‘lov",
    "10 kun ichida izohsiz qaytarish",
    "O‘zbekistonda rasmiy kafolat",
    "O‘zbek va rus tilida ovozli ogohlantirish",
    "Butun O‘zbekiston kameralari va radarlari bazasi",
    "Toshkentda ikkita servis markazi",
  ],
};

/* Радары, которые они сами перечисляют в описаниях X-COP 8800s и 9700s. */
export const RADARS = ["MultaRadar CD", "Cordon PRO", "Cordon BLACK", "AutoCon", "Скат", "Lochin", "Hikvision", "Traffistar", "Kaskad"];
export const RADARS_UZ = ["MultaRadar CD", "Cordon PRO", "Cordon BLACK", "AutoCon", "Skat", "Lochin", "Hikvision", "Traffistar", "Kaskad"];

/* Что показывает экран прибора: надписи с их же снимков экранов X-COP. */
export const ALERTS = [
  { k: "КОРДОН", kuz: "KORDON", d: 650, v: 60, z: { ru: "в спину", uz: "orqadan" } },
  { k: "АВТОКОН", kuz: "AVTOKON", d: 580, v: 70, z: { ru: "в спину", uz: "orqadan" } },
  { k: "КОРДОН", kuz: "KORDON", d: 750, v: 60, z: { ru: "перекрёсток", uz: "chorraha" } },
];

export const ABOUT = {
  ru: {
    since: "История NEOLINE началась в 2007 году с производства FM-трансмиттеров. Затем появились GPS-навигаторы, видеорегистраторы и радар-детекторы.",
    uz: "Инженеры NEOLINE проводят сотни часов на дорогах Узбекистана, чтобы тонко настроить модели. Команда следит за изменениями среди радаров и камер и при необходимости оперативно обновляет прошивки.",
    award: "NEOLINE до сих пор единственный производитель, чей гибридный видеорегистратор получил награду Red Dot Design Award.",
    brand: "Neoline среди лидеров премии «Бренд года 2022» Маркетинговой ассоциации Узбекистана.",
  },
  uz: {
    since: "NEOLINE tarixi 2007 yilda FM uzatgichlarini ishlab chiqarishdan boshlangan. Keyin GPS-navigatorlar, videoregistratorlar va radar detektorlari paydo bo‘ldi.",
    uz: "NEOLINE muhandislari modellarni nozik sozlash uchun O‘zbekiston yo‘llarida yuzlab soat vaqt sarflaydi. Jamoa radarlar va kameralardagi o‘zgarishlarni kuzatib boradi va kerak bo‘lsa proshivkani zudlik bilan yangilaydi.",
    award: "NEOLINE hali ham gibrid videoregistratori Red Dot Design Award mukofotiga sazovor bo‘lgan yagona ishlab chiqaruvchi.",
    brand: "Neoline O‘zbekiston Marketing Assotsiatsiyasining «Yil brendi 2022» mukofoti yetakchilaridan biri.",
  },
};

/* Гарантия: с их страницы «Гарантия и возврат». */
export const WARRANTY = {
  ru: [
    "Официальная гарантия только у устройств, предназначенных для продажи в Узбекистане.",
    "Устройства для других стран в официальных сервисах Узбекистана не обслуживаются.",
    "Повреждённая или снятая наклейка с моделью и серийным номером может лишить гарантии.",
  ],
  uz: [
    "Rasmiy kafolat faqat O‘zbekistonda sotish uchun mo‘ljallangan qurilmalarda bor.",
    "Boshqa mamlakatlar uchun qurilmalarga O‘zbekistondagi rasmiy servislarda xizmat ko‘rsatilmaydi.",
    "Model va seriya raqami yozilgan stikerning shikastlanishi yoki yo‘qligi kafolatdan mahrum qilishi mumkin.",
  ],
};

/* Сервисные центры со страницы «Поддержка устройств». */
export const SERVICE = [
  {
    name: "Smart Tech Service",
    ru: { addr: "Ташкент, Чиланзар, квартал Е, 1 (метро Новза)", hours: "Пн-Пт 09:00-19:00, Сб 09:00-18:00, Вс выходной" },
    uz: { addr: "Toshkent, Chilonzor, E kvartal, 1 (Novza metrosi)", hours: "Du-Ju 09:00-19:00, Sh 09:00-18:00, Ya dam olish" },
    phone: "+998 (97) 721-79-66", tel: "+998977217966",
  },
  {
    name: { ru: "Сервисный центр в Сергели", uz: "Sergelidagi servis markazi" },
    ru: { addr: "Ташкент, ул. Янги Сергели, 3А (авторынок, блок 5/4, магазин 20)", hours: "Пн выходной, Вт-Вс 09:00-17:00" },
    uz: { addr: "Toshkent, Yangi Sergeli ko‘chasi, 3A (avtobozor, 5/4 blok, 20-do‘kon)", hours: "Du dam olish, Se-Ya 09:00-17:00" },
    phone: "+998 (97) 742-34-50", tel: "+998977423450",
  },
];

export const SUPPORT = {
  ru: { hours: "Пн-Сб: 10:00-18:00", steps: [
    "Обновите устройство строго по инструкции и сверьте версию ПО в меню с той, что в разделе обновлений.",
    "Зависает или не отвечает на кнопки: извлеките карту памяти; не помогло, замените карту.",
    "Запись не идёт или ролики не сохраняются: отформатируйте карту в устройстве, отключите датчик движения и g-сенсор.",
    "Проверьте шнур питания и прикуриватель: подключать только оригинальными шнурами в разъёмы из инструкции.",
    "Не включается: проверьте предохранитель в адаптере кабеля питания, заменить можно на такой же, не больше 2А.",
    "Проверьте устройство в другой машине.",
  ] },
  uz: { hours: "Du-Sh: 10:00-18:00", steps: [
    "Qurilmani yo‘riqnomaga qat’iy rioya qilib yangilang va menyudagi dastur versiyasini yangilanishlar bo‘limidagi bilan solishtiring.",
    "Muzlab qolsa yoki tugmalarga javob bermasa: xotira kartasini chiqaring; yordam bermasa, kartani almashtiring.",
    "Yozuv ketmasa yoki videolar saqlanmasa: kartani qurilmada formatlang, harakat sensori va g-sensorni o‘chiring.",
    "Quvvat shnuri va sigaret chiroqni tekshiring: faqat original shnurlar bilan, yo‘riqnomadagi ulagichlarga.",
    "Yoqilmasa: quvvat kabeli adapteridagi sug‘urtani tekshiring, 2A dan oshmaydigan xuddi shunday bilan almashtirish mumkin.",
    "Qurilmani boshqa mashinada sinab ko‘ring.",
  ] },
};

/* Обновление устройств: их четыре шага со страницы «Обновление устройств». */
export const UPDATE_STEPS = {
  ru: ["Зарегистрируйтесь и войдите в личный кабинет.", "Откройте раздел «Обновления устройств».", "Выберите модель и нажмите «Добавить устройство». Для некоторых моделей нужен серийный номер.", "Обновите страницу и нажмите «Скачать» напротив нужных файлов."],
  uz: ["Ro‘yxatdan o‘ting va shaxsiy kabinetga kiring.", "«Qurilmalar yangilanishlari» bo‘limiga o‘ting.", "Modelni tanlab «Qurilmani qo‘shish» tugmasini bosing. Ayrim modellar uchun seriya raqami kerak.", "Sahifani yangilang va kerakli fayllar qarshisidagi «Yuklab olish» tugmasini bosing."],
};

export const PAY = {
  ru: ["Онлайн картой UzCard или Humo", "Беспроцентная рассрочка Uzum Nasiya", "Оплата на сайте через страницу эквайринга Payme"],
  uz: ["UzCard yoki Humo karta orqali onlayn", "Uzum Nasiya foizsiz muddatli to‘lov", "Saytda Payme ekvayring sahifasi orqali to‘lov"],
};
