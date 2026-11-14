/* Старые адреса сайта клиники на siyaniye-severa.com (WordPress до переезда
   на этот сервер, 14.11.2026): «Услуги», имплантация, протезирование, акции,
   отзывы, «О клинике». Их знают Яндекс и закладки пациентов, поэтому они
   ведут 301 на нужный блок новой страницы, а не в 404. Список — меню и
   «Услуги» их сайта и выдача Google.
   Тот сайт был взломан: роботам и посетителям не из России он отдавал
   итальянский магазин, и в выдаче остались адреса вида
   /Cuscino-Allattamento-Grigio-1111253 или /beauty-uomo/. Они сюда не
   подходят и отвечают 404, чтобы поисковики их выбросили. */

const RULES = [
  [/^(implantatsiya|odnomomentnaya-implantatsiya|odnoetapnaya-implantatsiya|uslugi\/implantatsiya|protezirovanie-na-implantakh|protezirovanie-pri-polnom-otsutstvii|kostnaya-plastika|sinus-lifting|naraschivanie-desny)/, "/#all-on-6"],
  [/^akcii(\/|$)/, "/#ceny"],
  [/^otzyvy$/, "/#otzyvy"],
  [/^o-klinike$/, "/#klinika"],
  [/^(uslugi|protez|koronki-|bezmetallovye-koronki|keramicheskie-|tsirkonievye-koronki|kultevye-vkladki|syemnoe-|nesyemnoe-|byugelnye-|mostovidnye-|neylonovye-|cad-cam-|khirurgiya|udalenie-|lechenie-|giperplaziya-|esteticheskaya-|ustanovka-|kompozitnye-viniry|viniry-|restavratsiya-|ultraniry|plomba-|ekstrennoe-|ultrazvukovaya-|chistka-|diagnostika-|ortopantomografiya|kompyuternaya-tomografiya)/, "/"],
];

/** Куда ведёт старый адрес их сайта; null — такого у клиники не было. */
export function oldPage(pathname) {
  const p = String(pathname || "").replace(/^\/+|\/+$/g, "");
  if (!p || !/^[a-z0-9-]+(\/[a-z0-9-]+)*$/.test(p)) return null;
  for (const [re, to] of RULES) if (re.test(p)) return to;
  return null;
}
