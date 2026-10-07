// Факты Shox International Hospital — только то, что клиника пишет о себе на
// shox.hospital. Сайт с 2026 года отвечает «402 Please renew your subscription»
// (Tilda), поэтому сняты страницы из кэша Firecrawl от 24.06.2026:
// главная, /vrachi/ru, /uslugi/ru, /robot-xirurg/ru. Фото врачей — с
// /vrachi/ru, обработаны photos.cjs. Латиница имён — паспортная
// транслитерация, одна для uz и en.

/** Направления: `ru/uz/en` — название, `d` — что клиника пишет о нём (если пишет). */
export const DIRS = [
  { id: "neurosurg", ic: "brain", ru: "Нейрохирургия", uz: "Neyroxirurgiya", en: "Neurosurgery",
    d: { ru: "Хирургическое лечение заболеваний головного мозга, спинного мозга и нервной системы. Лечение опухолей, кровоизлияний и травм.", uz: "Bosh miya, orqa miya va asab tizimi kasalliklarini jarrohlik yo‘li bilan davolash. O‘smalar, qon quyilishlari va jarohatlarni davolash.", en: "Surgical treatment of diseases of the brain, spinal cord and nervous system. Treatment of tumours, haemorrhages and injuries." } },
  { id: "ortho", ic: "bone", ru: "Ортопедия и травматология", uz: "Ortopediya va travmatologiya", en: "Orthopaedics and traumatology",
    d: { ru: "Заболевания костей, суставов и мышечной системы. Переломы, растяжения, протезирование и реабилитация.", uz: "Suyak, bo‘g‘im va mushak tizimi kasalliklari. Sinishlar, cho‘zilishlar, protezlash va reabilitatsiya.", en: "Diseases of bones, joints and muscles. Fractures, sprains, joint replacement and rehabilitation." } },
  { id: "checkup", ic: "clip", ru: "Комплексное обследование", uz: "Kompleks tekshiruv", en: "Comprehensive check-up",
    d: { ru: "Полное медицинское обследование и диагностика. Профилактические осмотры, скрининговые программы и оценка состояния здоровья.", uz: "To‘liq tibbiy tekshiruv va diagnostika. Profilaktik ko‘riklar, skrining dasturlari va salomatlik holatini baholash.", en: "Full medical examination and diagnostics. Preventive check-ups, screening programmes and health assessment." } },
  { id: "cardiosurg", ic: "heart", ru: "Кардиохирургия", uz: "Kardioxirurgiya", en: "Cardiac surgery",
    d: { ru: "Хирургическое лечение заболеваний сердца и сосудов: операции шунтирования и малоинвазивные методы.", uz: "Yurak va qon tomir kasalliklarini jarrohlik yo‘li bilan davolash: shuntlash operatsiyalari va kam invaziv usullar.", en: "Surgical treatment of heart and vascular diseases: bypass operations and minimally invasive methods." } },
  { id: "robot", ic: "robot", ru: "Роботохирургия", uz: "Robotlashtirilgan jarrohlik", en: "Robotic surgery" },
  { id: "surgery", ic: "scalpel", ru: "Хирургия", uz: "Jarrohlik", en: "Surgery" },
  { id: "cardio", ic: "heart", ru: "Кардиология", uz: "Kardiologiya", en: "Cardiology" },
  { id: "neuro", ic: "brain", ru: "Неврология", uz: "Nevrologiya", en: "Neurology" },
  { id: "gyn", ic: "venus", ru: "Гинекология", uz: "Ginekologiya", en: "Gynaecology" },
  { id: "uzi", ic: "wave", ru: "УЗИ, в том числе при беременности", uz: "UTT, shu jumladan homiladorlikda", en: "Ultrasound, including pregnancy" },
  { id: "mrt", ic: "scan", ru: "МРТ", uz: "MRT", en: "MRI" },
  { id: "mskt", ic: "scan", ru: "МСКТ", uz: "MSKT", en: "CT scan" },
  { id: "uro", ic: "kidney", ru: "Урология", uz: "Urologiya", en: "Urology" },
  { id: "pulmo", ic: "lungs", ru: "Пульмонология", uz: "Pulmonologiya", en: "Pulmonology" },
  { id: "endo", ic: "drop", ru: "Эндокринология", uz: "Endokrinologiya", en: "Endocrinology" },
  { id: "ped", ic: "child", ru: "Педиатрия", uz: "Pediatriya", en: "Paediatrics" },
  { id: "lor", ic: "ear", ru: "ЛОР", uz: "LOR", en: "ENT" },
  { id: "physio", ic: "hand", ru: "Физиотерапия", uz: "Fizioterapiya", en: "Physiotherapy" },
  { id: "rehab", ic: "walk", ru: "Реабилитация", uz: "Reabilitatsiya", en: "Rehabilitation" },
  { id: "onco", ic: "shield", ru: "Онкохирургия", uz: "Onkoxirurgiya", en: "Surgical oncology" },
  { id: "vascular", ic: "vein", ru: "Сосудистая хирургия", uz: "Qon tomir jarrohligi", en: "Vascular surgery" },
  { id: "gastro", ic: "drop", ru: "Гастроэнтерология", uz: "Gastroenterologiya", en: "Gastroenterology" },
  { id: "eye", ic: "eye", ru: "Офтальмология", uz: "Oftalmologiya", en: "Ophthalmology" },
];

const IV = { ru: "Интервенционный хирург", uz: "Intervension jarroh", en: "Interventional surgeon" };
const TO = { ru: "Травматолог-ортопед", uz: "Travmatolog-ortoped", en: "Orthopaedic trauma surgeon" };
const UZD = { ru: "Врач УЗИ", uz: "UTT shifokori", en: "Ultrasound doctor" };
const NEU = { ru: "Невролог", uz: "Nevrolog", en: "Neurologist" };

/**
 * Врачи — порядок и специальности как на /vrachi/ru. Пропущены двое:
 * Утешов А. Х. (фото на i.ibb.co не отдаётся) и Файзиев М. Ю. (вместо
 * специальности на сайте повторено отчество).
 */
export const DOCS = [
  { s: "kudratov", ru: "Кудратов Акмаль Абдурауфович", la: "Kudratov Akmal Abduraufovich", sp: { ru: "Общий хирург", uz: "Umumiy jarroh", en: "General surgeon" }, dir: "surgery" },
  { s: "ibragimova", ru: "Ибрагимова Эмине Таировна", la: "Ibragimova Emine Tairovna", sp: { ru: "Кардиолог-терапевт", uz: "Kardiolog-terapevt", en: "Cardiologist, internist" }, dir: "cardio" },
  { s: "kubaev", ru: "Кубаев Сардор Файзуллаевич", la: "Kubaev Sardor Fayzullaevich", sp: TO, dir: "ortho" },
  { s: "madaminova", ru: "Мадаминова Севара Алишеровна", la: "Madaminova Sevara Alisherovna", sp: { ru: "Невролог, нейрофизиолог", uz: "Nevrolog, neyrofiziolog", en: "Neurologist, neurophysiologist" }, dir: "neuro" },
  { s: "mansurov", ru: "Мансуров Шохрух Вафоевич", la: "Mansurov Shoxrux Vafoevich", sp: { ru: "Уролог", uz: "Urolog", en: "Urologist" }, dir: "uro" },
  { s: "rahmatova", ru: "Рахматова Шахноза Нигбаевна", la: "Raxmatova Shaxnoza Nigbaevna", sp: { ru: "Гинеколог", uz: "Ginekolog", en: "Gynaecologist" }, dir: "gyn" },
  { s: "nortojiev", ru: "Нортожиев Бердиер Нортожиевич", la: "Nortojiev Berdiyer Nortojievich", sp: { ru: "Сосудистый хирург", uz: "Qon tomir jarrohi", en: "Vascular surgeon" }, dir: "vascular" },
  { s: "yunusova", ru: "Юнусова Азиза Бахрамовна", la: "Yunusova Aziza Baxramovna", sp: { ru: "Эндокринолог", uz: "Endokrinolog", en: "Endocrinologist" }, dir: "endo" },
  { s: "normamatov", ru: "Нормаматов Азизбек Нормаматович", la: "Normamatov Azizbek Normamatovich", sp: { ru: "Врач МРТ", uz: "MRT shifokori", en: "MRI doctor" }, dir: "mrt" },
  { s: "hamdamova", ru: "Хамдамова Барно Буриевна", la: "Xamdamova Barno Burievna", sp: { ru: "Офтальмолог", uz: "Oftalmolog", en: "Ophthalmologist" }, dir: "eye" },
  { s: "abduganiev", ru: "Абдуганиев Саидазимхон Усмонходжаевич", la: "Abduganiev Saidazimxon Usmonxodjaevich", sp: { ru: "Аллерголог, пульмонолог", uz: "Allergolog, pulmonolog", en: "Allergist, pulmonologist" }, dir: "pulmo" },
  { s: "kutlieva", ru: "Кутлиева Ёдгора Шохназаровна", la: "Kutlieva Yodgora Shoxnazarovna", sp: { ru: "Гастроэнтеролог", uz: "Gastroenterolog", en: "Gastroenterologist" }, dir: "gastro" },
  { s: "marufxodjaev", ru: "Маьруфходжаев Маьруфхон Ильхомович", la: "Marufxodjaev Marufxon Ilxomovich", sp: IV, dir: "surgery" },
  { s: "akbarova", ru: "Акбарова Туйгуной Бахшиллаевна", la: "Akbarova Tuyg‘unoy Baxshillaevna", sp: { ru: "Врач МСКТ", uz: "MSKT shifokori", en: "CT doctor" }, dir: "mskt" },
  { s: "yusubbaev", ru: "Юсуббаев Ойбек Закиржанович", la: "Yusubbaev Oybek Zakirjanovich", sp: UZD, dir: "uzi" },
  { s: "ganiev", ru: "Ганиев Бегзод Бахрамович", la: "Ganiev Begzod Baxramovich", sp: IV, dir: "surgery" },
  { s: "ergasheva", ru: "Эргашева Гульноза Касымовна", la: "Ergasheva Gulnoza Kasimovna", sp: NEU, dir: "neuro" },
  { s: "ismatov", ru: "Исматов Муроджон Максудович", la: "Ismatov Murodjon Maksudovich", sp: TO, dir: "ortho" },
  { s: "nam", ru: "Нам Жанна Витальевна", la: "Nam Janna Vitalevna", sp: UZD, dir: "uzi" },
  { s: "ubaydullaev", ru: "Убайдуллаев Достон Хамидович", la: "Ubaydullaev Doston Xamidovich", sp: IV, dir: "surgery" },
  { s: "yakubova", ru: "Якубова Мархамат Миракрамовна", la: "Yakubova Marxamat Mirakramovna", sp: { ru: "Невропатолог", uz: "Nevropatolog", en: "Neurologist" }, dir: "neuro" },
  { s: "sagdullaev", ru: "Сагдуллаев Бекзод Файзуллаевич", la: "Sagdullaev Bekzod Fayzullaevich", sp: IV, dir: "surgery" },
  { s: "usmonov", ru: "Усмонов Журабек Дилмурадович", la: "Usmonov Jurabek Dilmuradovich", sp: IV, dir: "surgery" },
];

/** Филиалы — из всплывающего списка «Наши филиалы» и подвала. */
export const BRANCHES = [
  { id: "yakkasaroy", name: "Shox International Hospital", area: { ru: "Яккасарайский район", uz: "Yakkasaroy tumani", en: "Yakkasaray district" }, addr: { ru: "ул. Кичик халка йули, 70А", uz: "Kichik xalqa yo‘li ko‘chasi, 70A", en: "70A Kichik Khalka Yuli St." }, tel: "+998712070017", telh: "+998 71 207-00-17", map: "https://yandex.uz/maps/-/CCUK5SuakD", x: 38, y: 62 },
  { id: "oybek", name: "Shox Med Center · Oybek", area: { ru: "Мирабадский район", uz: "Mirobod tumani", en: "Mirabad district" }, addr: { ru: "ул. Ойбек, 34", uz: "Oybek ko‘chasi, 34", en: "34 Oybek St." }, tel: "+998712020212", telh: "+998 71 202-02-12", map: "https://yandex.uz/maps/-/CCUK5SQnSD", x: 56, y: 52 },
  { id: "chilonzor", name: "«Здоровая семья» · Chilonzor", area: { ru: "Учтепинский район", uz: "Uchtepa tumani", en: "Uchtepa district" }, addr: { ru: "ул. М. Шайхзода, 31А", uz: "M. Shayxzoda ko‘chasi, 31A", en: "31A M. Shaykhzoda St." }, tel: "+998712071051", telh: "+998 71 207-10-51", map: "https://yandex.uz/maps/-/CCUK5SRiGA", x: 22, y: 58 },
  { id: "maxtumquli", name: "Shox International Hospital · Maxtumquli", area: { ru: "Ташкент", uz: "Toshkent", en: "Tashkent" }, tel: "+998712020212", telh: "+998 71 202-02-12" },
  { id: "yunusobod", name: "Shox International Hospital · Yunusobod", area: { ru: "Юнусабадский район", uz: "Yunusobod tumani", en: "Yunusabad district" }, tel: "+998555191183", telh: "+998 55 519-11-83" },
  { id: "sergeli", name: "Shox International Hospital · Sergeli", area: { ru: "Сергелийский район", uz: "Sergeli tumani", en: "Sergeli district" }, tel: "+998555121183", telh: "+998 55 512-11-83" },
  { id: "andijon", name: "Shox International Hospital · Andijon", area: { ru: "Андижан", uz: "Andijon", en: "Andijan" }, addr: { ru: "ул. Ю. Отабекова, 5", uz: "Yu. Otabekov ko‘chasi, 5", en: "5 Yu. Otabekov St." }, tel: "+998552010300", telh: "+998 55 201-03-00", map: "https://yandex.uz/maps/-/CCUK5SrqWD" },
];

/** Роботохирургия — дословно со страницы /robot-xirurg/ru. */
export const ROBOT_OPS = {
  ru: ["Радикальная простатэктомия", "Парциальная нефрэктомия", "Радикальная нефрэктомия", "Радикальная цистэктомия", "Холецистэктомия", "Эхинококкэктомия", "Герниопластика", "Кистэктомия", "Тубэктомия"],
  uz: ["Radikal prostatektomiya", "Parsial nefrektomiya", "Radikal nefrektomiya", "Radikal sistektomiya", "Xolesistektomiya", "Exinokokkektomiya", "Gernioplastika", "Kistektomiya", "Tubektomiya"],
  en: ["Radical prostatectomy", "Partial nephrectomy", "Radical nephrectomy", "Radical cystectomy", "Cholecystectomy", "Echinococcectomy", "Hernioplasty", "Cystectomy", "Tubectomy"],
};
export const ROBOT_PLUS = {
  ru: ["Меньше травмы тканей", "Минимальная кровопотеря", "Ниже операционные и послеоперационные риски", "Без крупных разрезов", "Изображение, близкое к 3D, с увеличением почти в 10 раз"],
  uz: ["To‘qimalar kamroq shikastlanadi", "Qon yo‘qotish minimal", "Operatsiya va undan keyingi xavf past", "Katta kesiklarsiz", "3D ga yaqin tasvir, deyarli 10 barobar kattalashtirish"],
  en: ["Less tissue trauma", "Minimal blood loss", "Lower surgical and post-operative risk", "No large incisions", "Near-3D image magnified almost 10 times"],
};

export const SOCIAL = [
  ["Instagram · shox.hospital", "https://www.instagram.com/shox.hospital"],
  ["Instagram · shoxmedcenter", "https://www.instagram.com/shoxmedcenter"],
  ["Instagram · zd.semya", "https://www.instagram.com/zd.semya"],
  ["Instagram · shox_hospital_andijon", "https://www.instagram.com/shox_hospital_andijon"],
  ["Facebook · ShoxMedCenter", "https://www.facebook.com/ShoxMedCenter"],
  ["YouTube", "https://www.youtube.com/channel/UCzwuZXE51NaDgRGflVK8KHQ"],
];
export const BOT = "https://t.me/shoxgroupbot";
