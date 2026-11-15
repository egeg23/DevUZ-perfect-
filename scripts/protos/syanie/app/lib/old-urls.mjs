/* Старые адреса сайта клиники на siyaniye-severa.com (WordPress до переезда
   на этот сервер, 14.11.2026): «Услуги», имплантация, протезирование, акции,
   отзывы, «О клинике». Их знают Яндекс и закладки пациентов, поэтому они
   ведут 301 на нужный блок новой страницы, а не в 404. Список — меню и
   «Услуги» их сайта и выдача Google.
   Тот сайт был взломан: роботам и посетителям не из России он отдавал
   итальянский магазин, и в выдаче остались адреса вида
   /Cuscino-Allattamento-Grigio-1111253 или /beauty-uomo/. Они сюда не
   подходят: товары и служебные адреса WordPress (его карты сайта, wp-content,
   лента) отвечают 410 (hackedPage), остальное — 404, чтобы поисковики их
   выбросили. Список товаров из их карт сайта — gone-urls.txt: его отдаёт
   /sitemap-gone.xml, чтобы Google быстрее перепроверил их и увидел 410. */

const RULES = [
  [/^(implantatsiya|odnomomentnaya-implantatsiya|odnoetapnaya-implantatsiya|uslugi\/implantatsiya|protezirovanie-na-implantakh|protezirovanie-pri-polnom-otsutstvii|kostnaya-plastika|sinus-lifting|naraschivanie-desny)/, "/#all-on-6"],
  [/^akcii(\/|$)/, "/#ceny"],
  [/^otzyvy$/, "/#otzyvy"],
  [/^o-klinike$/, "/#klinika"],
  /* Прежний сайт клиники на Tilda (syanie-sewera.ru): Caddy ведёт его домен
     сюда тем же адресом (SY_ALIASES в выкатке), а здесь — на нужный блок. */
  [/^all-on-[46](\/|$)/, "/#all-on-6"],
  [/^conf$/, "/privacy"],
  [/^spasibo$/, "/"],
  [/^(uslugi|protez|koronki-|bezmetallovye-koronki|keramicheskie-|tsirkonievye-koronki|kultevye-vkladki|syemnoe-|nesyemnoe-|byugelnye-|mostovidnye-|neylonovye-|cad-cam-|khirurgiya|udalenie-|lechenie-|giperplaziya-|esteticheskaya-|ustanovka-|kompozitnye-viniry|viniry-|restavratsiya-|ultraniry|plomba-|ekstrennoe-|ultrazvukovaya-|chistka-|diagnostika-|ortopantomografiya|kompyuternaya-tomografiya)/, "/"],
];

/** Куда ведёт старый адрес их сайта; null — такого у клиники не было. */
export function oldPage(pathname) {
  const p = String(pathname || "").replace(/^\/+|\/+$/g, "");
  if (!p || !/^[a-z0-9-]+(\/[a-z0-9-]+)*$/.test(p)) return null;
  for (const [re, to] of RULES) if (re.test(p)) return to;
  return null;
}

/** День переезда: с него адреса взломанного сайта отвечают 410 (lastmod в
    /sitemap-gone.xml). */
export const GONE_SINCE = "2026-11-15";

/* Служебные адреса WordPress: его карты сайта (в них и лежали товары), файлы,
   лента, вход. Наши карты сайта (OURS) сервер отдаёт раньше. */
const OURS = new Set(["sitemap.xml", "sitemap-gone.xml"]);
const WORDPRESS = /^(wp-(admin|content|includes|json|login\.php|cron\.php|signup\.php|sitemap[\w-]*\.xml)|xmlrpc\.php|feed|comments\/feed|sitemap_index\.xml|sitemap-[\w-]+\.xml|[\w-]+-sitemap\d*\.xml)(\/|$)/i;

/** Адрес взломанного сайта, которого больше нет: товар магазина (один сегмент
    и номер в конце; в их картах сайта 15.11.2026 — 1 891 такой адрес, номера
    из 6–7 цифр) или служебный адрес WordPress. Ответ 410 «удалено навсегда»:
    поисковик выбрасывает его быстрее, чем после 404. */
export function hackedPage(pathname) {
  const p = String(pathname || "").replace(/^\/+|\/+$/g, "");
  if (WORDPRESS.test(p)) return !OURS.has(p);
  return /^[A-Za-z0-9-]+-\d{6,7}$/.test(p) && !oldPage(pathname);
}
