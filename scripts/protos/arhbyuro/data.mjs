/*
 * Данные макета архбюро: бренд, проекты, услуги, меню, подписи [ru, en].
 *
 * Название бюро в ТЗ не указано: LINIA — рабочее имя, меняется здесь, в
 * BRAND, и встаёт везде (шапка, заставка, подвал, заголовки вкладок).
 * Проекты — демо: три здания и интерьер собраны нами в Blender
 * (scripts/blender/arhbyuro), чужих фото и чужих зданий нет. В рабочем
 * сайте этот список отдаёт Strapi.
 */

export const BRAND = {
  name: "LINIA",
  kind: ["архитектурное бюро", "architecture studio"],
};

/* Услуги: проекты услуги находятся сами по полю cats у проекта. */
export const SERVICES = [
  { id: "dom", n: ["Жилые дома", "Houses and housing"], d: ["Частные дома и жилые комплексы: посадка на участке, планировки, фасады, рабочие чертежи.", "Private houses and housing: siting, plans, facades, working drawings."] },
  { id: "obsh", n: ["Общественные здания", "Public buildings"], d: ["Павильоны, кафе, офисы и выставочные залы.", "Pavilions, cafes, offices and exhibition halls."] },
  { id: "int", n: ["Интерьеры", "Interiors"], d: ["Планировка, материалы, свет и мебель. Интерьер ведём вместе с архитектурой дома.", "Layout, materials, light and furniture. We design the interior together with the house."] },
  { id: "gen", n: ["Генпланы и благоустройство", "Master plans and landscape"], d: ["Участок целиком: здания, дорожки, вода, деревья и свет вечером.", "The whole site: buildings, paths, water, trees and evening light."] },
];

/* Кадры галереи — номера рендеров stills (scene.py, STILLS). */
export const PROJECTS = [
  {
    slug: "dom-s-konsolyu",
    n: ["Дом с консолью", "Cantilever House"],
    city: ["Ташкент", "Tashkent"], at: [41.31, 69.28],
    cats: ["dom", "int", "gen"],
    cover: 2, shots: [2, 4, 1, 6, 3, 5],
    video: true,
    short: ["Жилой дом с садом. Бетонный второй этаж вынесен консолью над стеклянной гостиной и террасой с бассейном.", "A house with a garden. The concrete upper floor cantilevers over a glass living room and a pool terrace."],
    text: [
      ["Дом стоит на каменной террасе. С юга вдоль всей гостиной идёт стекло от пола до потолка, створки откатываются, и комната выходит к бассейну.", "The house sits on a stone terrace. Floor-to-ceiling glass runs along the whole south side of the living room; the panels slide away and the room opens onto the pool."],
      ["Второй этаж развёрнут поперёк первого и нависает над террасой. Под ним тень для уличной гостиной, а с дороги дом читается одной горизонтальной линией.", "The upper floor is turned across the ground floor and hangs over the terrace. Beneath it is shade for the outdoor lounge, and from the road the house reads as one horizontal line."],
      ["С севера гостиная смотрит во двор с деревом. Стены двора из песчаника закрывают его от соседей, свет в комнату приходит с двух сторон.", "To the north the living room looks into a courtyard with a tree. Sandstone walls shield it from the neighbours, and daylight reaches the room from both sides."],
      ["Сверху участок читается как план: дом, бассейн, газон, деревья по краю. Генплан и благоустройство сделаны вместе с домом.", "From above the site reads like a plan: house, pool, lawn, trees along the edge. The master plan and landscape were designed together with the house."],
    ],
  },
  {
    slug: "gostinaya-vo-dvor",
    n: ["Гостиная во двор", "Courtyard Living Room"],
    city: ["Ташкент", "Tashkent"], at: [41.31, 69.28],
    cats: ["int"],
    cover: 3, shots: [3, 5, 2],
    short: ["Интерьер гостиной в доме с консолью: дуб, бетон, лён и вид во двор с деревом.", "The living room of the Cantilever House: oak, concrete, linen and a view of the courtyard tree."],
    text: [
      ["Пол из дуба, потолок из бетона, стены под штукатурку. Мебель светлая и низкая, чтобы не спорить с видом за стеклом.", "Oak floor, concrete ceiling, plaster walls. The furniture is pale and low so it does not compete with the view."],
      ["Лестница из консольных ступеней идёт вдоль стены. Обеденный стол из массива стоит у стекла во двор, над ним два светильника-шара.", "A cantilevered stair runs along the wall. The solid oak dining table stands by the courtyard glass under two globe pendants."],
    ],
  },
  {
    slug: "bashnya-s-rebrami",
    n: ["Башня с рёбрами", "Ribbed Tower"],
    city: ["Алматы", "Almaty"], at: [43.24, 76.89],
    cats: ["dom", "gen"],
    cover: 7, shots: [7, 8, 9],
    short: ["Жилая башня на 18 этажей. Бетонные рёбра по всем фасадам, стеклянный холл и площадь с каналом воды.", "An 18-storey residential tower. Concrete fins on every facade, a glass lobby and a plaza with a water channel."],
    text: [
      ["Рёбра идут по всем четырём фасадам с шагом полтора метра. Днём они дают тень на стекле, вечером башню рисуют светлые полосы перекрытий.", "Fins run up all four facades every metre and a half. By day they shade the glass; in the evening the tower is drawn by the lit floor edges."],
      ["Внизу двухсветный холл из стекла и дуба. Площадь перед ним с каналом воды, аллеей деревьев и скамьями из камня.", "At the base is a double-height lobby in glass and oak, and in front of it a plaza with a water channel, an avenue of trees and stone benches."],
    ],
  },
  {
    slug: "pavilon-v-parke",
    n: ["Павильон в парке", "Park Pavilion"],
    city: ["Дубай", "Dubai"], at: [25.2, 55.27],
    cats: ["obsh", "gen"],
    cover: 10, shots: [10, 11, 12],
    short: ["Павильон для выставок и кафе. Тонкая кровля на стальных стойках, стекло со всех сторон, перед входом неглубокий пруд.", "A pavilion for exhibitions and a cafe. A thin roof on steel posts, glass on every side and a shallow pond at the entrance."],
    text: [
      ["Кровля выходит за стекло на три метра и закрывает зал от солнца. Снизу она подшита дубом, сверху гравий.", "The roof reaches three metres past the glass and keeps the sun off the hall. Its underside is lined with oak, the top is gravel."],
      ["Пруд перед входом отражает павильон целиком. Вокруг газон и деревья, дорожки сходятся к стеклянной двери.", "The pond at the entrance mirrors the whole pavilion. Around it are lawn and trees, and the paths meet at the glass door."],
    ],
  },
];

/* Пролёт: что подписано на каком отрезке прокрутки (доля 0…1). */
export const FLIGHT_STAGES = [
  { from: 0, to: 0.2, k: ["01 · Генплан", "01 · Master plan"], t: ["Участок сверху: дом, бассейн, сад", "The site from above: house, pool, garden"] },
  { from: 0.22, to: 0.46, k: ["02 · Объём", "02 · Massing"], t: ["Бетонная консоль над стеклянной гостиной", "A concrete cantilever over a glass living room"] },
  { from: 0.48, to: 0.78, k: ["03 · Терраса", "03 · Terrace"], t: ["Камень, вода и открытая створка", "Stone, water and an open glass panel"] },
  { from: 0.8, to: 1, k: ["04 · Интерьер", "04 · Interior"], t: ["Гостиная выходит во двор с деревом", "The living room opens to a courtyard tree"] },
];

/* Меню: пункт, куда ведёт, фон пункта (кадр stills или кадр пролёта). */
export const MENU = [
  { id: "proekty", n: ["Проекты", "Projects"], bg: "s-2" },
  { id: "prolet", n: ["Пролёт", "Fly-through"], bg: "f-0040" },
  { id: "uslugi", n: ["Услуги", "Services"], bg: "s-3" },
  { id: "geo", n: ["География", "Map"], bg: "s-8" },
  { id: "sayt", n: ["Что будет на сайте", "What the site gets"], bg: "s-11" },
];

/* Что войдёт в рабочий сайт — пункты из ТЗ заказчика. */
export const SPEC = [
  { n: ["CMS Strapi", "Strapi CMS"], d: ["Проекты, услуги, меню и общие настройки. Галерея сама сжимается в WebP и AVIF. Роли: супер-админ и контент-менеджер.", "Projects, services, menu and global settings. Gallery images are converted to WebP and AVIF automatically. Roles: super admin and content manager."] },
  { n: ["Next.js и GSAP", "Next.js and GSAP"], d: ["Страницы собираются заранее, переходы между ними, появление при прокрутке и пролёты управляются из одного места.", "Pages are prebuilt; page transitions, scroll reveals and fly-throughs are controlled from one place."] },
  { n: ["PageSpeed 90+", "PageSpeed 90+"], d: ["На ПК и телефоне. Картинки WebP и AVIF, ленивая загрузка, видео на главной с запасной картинкой для телефона и медленной сети.", "On desktop and mobile. WebP and AVIF images, lazy loading, a home video with an image fallback for phones and slow connections."] },
  { n: ["SEO", "SEO"], d: ["H1-H6 по порядку, понятные адреса, sitemap.xml, robots.txt, разметка Schema.org для бюро и каждого проекта.", "A proper H1-H6 order, readable URLs, sitemap.xml, robots.txt, Schema.org data for the studio and every project."] },
  { n: ["RU и EN", "RU and EN"], d: ["Два языка сразу, третий добавляется в CMS без программиста.", "Two languages from day one; a third is added in the CMS without a developer."] },
  { n: ["Сервер и сдача", "Server and handover"], d: ["VPS на Ubuntu, Nginx, PostgreSQL, Let's Encrypt, автодеплой. Тестовый сервер, код и доступы вам, видеоинструкция по CMS, гарантия 2 месяца.", "Ubuntu VPS, Nginx, PostgreSQL, Let's Encrypt, automatic deploys. A staging server, code and access handed over, a CMS video guide, a 2-month warranty."] },
];

/* Первый экран, как у референса: закреплённая сцена, кадры сменяют друг
   друга прокруткой. Первый кадр — видео (на телефоне картинка), дальше
   кадры галереи. Подпись внизу слева меняется вместе с кадром. */
export const HERO_SLIDES = [
  { video: true, p: "dom-s-konsolyu" },
  { still: 4, p: "dom-s-konsolyu" },
  { still: 7, p: "bashnya-s-rebrami" },
  { still: 10, p: "pavilon-v-parke" },
];

/* Заявление бюро: слова проявляются прокруткой (Text Reveal, Magic UI). */
export const STATEMENT = [
  "{B} проектирует дома, интерьеры и общественные здания. Начинаем с участка и света, заканчиваем рабочими чертежами и авторским надзором. Заказчик видит дом до стройки: в рендерах, пролёте и материалах.",
  "{B} designs houses, interiors and public buildings. We start with the site and the light and finish with working drawings and site supervision. The client sees the house before it is built: in renders, fly-throughs and materials.",
];

/* Бегущая строка, скорость зависит от прокрутки (Scroll Based Velocity, Magic UI). */
export const MARQUEE = [
  ["Архитектура", "Интерьеры", "Генпланы", "Благоустройство"],
  ["Architecture", "Interiors", "Master plans", "Landscape"],
];

/* География: заголовок в три строки, как у референса. */
export const GEO_HEAD = [["Где", "стоят наши", "проекты"], ["Where", "our projects", "stand"]];
