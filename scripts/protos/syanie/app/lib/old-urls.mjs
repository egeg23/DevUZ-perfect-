/* Старые адреса сайта клиники на siyaniye-severa.com (WordPress до переезда
   на этот сервер, 14.11.2026). С 16.11.2026 сайт снова многостраничный
   (владелец: «Разведи на несколько страниц: отдельно услуги, отдельно
   цены»): разделы прежнего сайта — те же адреса без «/» в конце (их отдаёт
   сервер сам), а страница отдельной услуги ведёт 301 на свой раздел. Список
   — меню и «Услуги» их сайта и выдача Google.
   Тот сайт был взломан: роботам и посетителям не из России он отдавал
   итальянский магазин, и в выдаче остались адреса вида
   /Cuscino-Allattamento-Grigio-1111253 или /beauty-uomo/. Они сюда не
   подходят: товары и служебные адреса WordPress (его карты сайта, wp-content,
   лента) отвечают 410 (hackedPage), остальное — 404, чтобы поисковики их
   выбросили. Список товаров из их карт сайта — gone-urls.txt: его отдаёт
   /sitemap-gone.xml, чтобы Google быстрее перепроверил их и увидел 410. */

/* Порядок важен: первое совпадение. «udalenie-zubnogo-kamnya» — гигиена,
   а не хирургия; «lechenie-kisty» — хирургия, а не лечение. */
const RULES = [
  [/^(implantatsiya-all-on-[46]|all-on-[46])(\/|$)/, "/"],
  [/^(implantatsiya|odnomomentnaya-implantatsiya|odnoetapnaya-implantatsiya|uslugi\/implantatsiya)/, "/implantatsiya-zubov"],
  [/^(udalenie-zubnogo-kamnya|ultrazvukovaya-|chistka-|gigiena|professionalnaya-gigiena)/, "/professionalnaya-gigiena"],
  [/^(khirurgiya|udalenie-|lechenie-kisty|kostnaya-plastika|sinus-lifting|naraschivanie-desny|giperplaziya-)/, "/khirurgiya"],
  [/^(protez|koronki-|bezmetallovye-koronki|keramicheskie-|tsirkonievye-koronki|kultevye-vkladki|syemnoe-|nesyemnoe-|byugelnye-|mostovidnye-|neylonovye-|cad-cam-)/, "/protezirovanie-zubov"],
  [/^(esteticheskaya-|ustanovka-|kompozitnye-viniry|viniry-|restavratsiya-zubov-kompozitom|ultraniry)/, "/esteticheskaya-stomatologiya"],
  [/^(lechenie-|plomba-|ekstrennoe-|restavratsiya-)/, "/lechenie-zubov"],
  [/^(diagnostika-|ortopantomografiya|kompyuternaya-tomografiya)/, "/diagnostika-zubov"],
  [/^akcii(\/|$)/, "/akcii"],
  [/^otzyvy(\/|$)/, "/otzyvy"],
  [/^o-klinike(\/|$)/, "/o-klinike"],
  [/^uslugi(\/|$)/, "/uslugi"],
  /* Прежний сайт клиники на Tilda (syanie-sewera.ru): Caddy ведёт его домен
     сюда тем же адресом (SY_ALIASES в выкатке), а здесь — на нужную страницу. */
  [/^conf$/, "/privacy"],
  [/^spasibo$/, "/"],
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
