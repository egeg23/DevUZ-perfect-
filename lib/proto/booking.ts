/**
 * Модель «запись на время» — каркас и все её блоки.
 *
 * Одна страница на шиномонтаж, СТО, автомойку, барбершоп, салон красоты,
 * ногтевую студию и детейлинг. У них общая работа: человек выбирает время и
 * приходит. Меняются слово в заголовке, палитра и рисунок трюка — устройство
 * не меняется.
 *
 * Про «медленный, прям супер плавный скролл», который просил владелец.
 * Соблазн — перехватить колесо и проматывать страницу самим. Так делать
 * нельзя: навязанная прокрутка ощущается как зависший телефон, и человек
 * закрывает вкладку раньше, чем успевает что-то рассмотреть.
 *
 * Плавность берётся иначе. Сцена с трюком — высотой в три с половиной
 * экрана, а внутри неё прилипшая картинка. Палец двигает страницу ровно на
 * столько, на сколько двинул, но колесо за это время проворачивается чуть-
 * чуть. Получается та самая тяжёлая, тягучая прокрутка — и при этом
 * страница слушается пальца, а не нас.
 *
 * Считает всё это видеокарта: трюк живёт на scroll-driven animations, то
 * есть на `animation-timeline`. Ни одного обработчика прокрутки на
 * странице нет. Браузер без такой поддержки получает ту же страницу без
 * анимации — все карточки просто стоят столбиком; ровно то же самое видит
 * человек с `prefers-reduced-motion`.
 */
import { CITIES } from "@/content/razbor/catalog";
import type { ProtoNiche } from "@/content/proto/models";
import { trickFor } from "@/content/proto/models";
import type { ProtoFacts } from "@/lib/proto/facts";
import { mainAction, wordmark } from "@/lib/proto/facts";
import { flingVars, motionCss, motionsFor } from "@/lib/proto/motion";
import { trick } from "@/lib/proto/tricks";

/** Сколько услуг выкидывает трюк. Дальше — списком, без театра. */
const STAGE_MAX = 6;

const COPY = {
  ru: {
    book: "Записаться",
    call: "Позвонить",
    write: "Написать",
    stage: "Что делаем",
    all: "Все услуги",
    how: "Как записаться",
    /*
     * Два набора шагов, потому что главная кнопка бывает двух видов.
     *
     * «Пишете в один клик» рядом с кнопкой, которая набирает номер, — это
     * ошибка, которую заметит первый же посетитель, и заметит он её ровно в
     * тот момент, когда собрался записаться.
     */
    steps: {
      chat: [
        { title: "Выбираете услугу", text: "Список выше — с ценами там, где они есть." },
        { title: "Пишете в один клик", text: "Кнопка открывает переписку с готовым текстом." },
        { title: "Приезжаете к назначенному времени", text: "Время подтверждают в ответном сообщении." },
      ],
      call: [
        { title: "Выбираете услугу", text: "Список выше — с ценами там, где они есть." },
        { title: "Звоните в один клик", text: "Кнопка набирает номер прямо с этой страницы." },
        { title: "Приезжаете к назначенному времени", text: "Время подтверждают по телефону." },
      ],
    },
    where: "Где и когда",
    address: "Адрес",
    hours: "Часы работы",
    phone: "Телефон",
    map: "Открыть на карте",
    photos: "Как у нас",
    heroSub: {
      chat: "Запись через переписку — без звонков и ожидания на линии",
      call: "Запись по телефону — назовите удобное время",
    },
    scroll: "Листайте",
    viaTelegram: "Запись в Telegram",
    viaWhatsapp: "Запись в WhatsApp",
    madeBy: "Прототип. Собран DevUz Studio по данным с сайта",
  },
  uz: {
    book: "Yozilish",
    call: "Qo‘ng‘iroq",
    write: "Yozish",
    stage: "Nima qilamiz",
    all: "Barcha xizmatlar",
    how: "Qanday yozilish kerak",
    steps: {
      chat: [
        { title: "Xizmatni tanlaysiz", text: "Yuqoridagi ro‘yxat — narxlari bor joyda narxi bilan." },
        { title: "Bir bosishda yozasiz", text: "Tugma tayyor matn bilan yozishmani ochadi." },
        { title: "Belgilangan vaqtda kelasiz", text: "Vaqt javob xabarida tasdiqlanadi." },
      ],
      call: [
        { title: "Xizmatni tanlaysiz", text: "Yuqoridagi ro‘yxat — narxlari bor joyda narxi bilan." },
        { title: "Bir bosishda qo‘ng‘iroq qilasiz", text: "Tugma shu sahifadan raqamni teradi." },
        { title: "Belgilangan vaqtda kelasiz", text: "Vaqt telefonda tasdiqlanadi." },
      ],
    },
    where: "Qayerda va qachon",
    address: "Manzil",
    hours: "Ish vaqti",
    phone: "Telefon",
    map: "Xaritada ochish",
    photos: "Bizda shunday",
    heroSub: {
      chat: "Yozishma orqali yozilish — qo‘ng‘iroqsiz va navbatsiz",
      call: "Telefon orqali yozilish — qulay vaqtni ayting",
    },
    scroll: "Pastga",
    viaTelegram: "Telegram orqali yozilish",
    viaWhatsapp: "WhatsApp orqali yozilish",
    madeBy: "Prototip. DevUz Studio sayt ma’lumotlari asosida yig‘di:",
  },
} as const;

export const esc = (text: string) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/** Две первые буквы названия — если логотипа нам не дали. */
function initials(name: string): string {
  const words = name.replace(/["«»']/g, " ").split(/\s+/).filter(Boolean);
  const letters = words.slice(0, 2).map((word) => word[0]?.toUpperCase() ?? "");
  return letters.join("") || name.slice(0, 2).toUpperCase();
}

/**
 * «в Ташкенте» — но только для города, падеж которого мы знаем.
 *
 * Русский предложный и узбекский местный падеж исключений имеют больше, чем
 * правил, и придумывать форму на лету значит рано или поздно написать в
 * заголовке «в Фергана». Формы лежат готовыми в каталоге разборов — там же,
 * где они и так поддерживаются. Города нет в каталоге — заголовок обходится
 * без города, а сам город остаётся плашкой на первом экране в именительном.
 */
export function inCity(city: string | null, locale: "ru" | "uz"): string {
  if (!city) return "";
  const found = CITIES.find(
    (item) => item.ru.toLowerCase() === city.trim().toLowerCase() || item.uz.toLowerCase() === city.trim().toLowerCase(),
  );
  if (!found) return "";
  return locale === "ru" ? ` в ${found.ruIn}` : ` ${found.uzIn}`;
}

function mapLink(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

/**
 * Окна карточек внутри сцены.
 *
 * Считаются здесь, а не пишутся руками, потому что услуг у клиента может
 * быть три, а может шесть, и шесть окон по шестнадцать процентов на трёх
 * карточках означали бы полсцены с пустым местом.
 */
function cardRanges(count: number): string {
  const span = 96 / Math.max(count, 1);
  return Array.from({ length: count }, (_, index) => {
    const start = 2 + index * span;
    return `.c${index + 1}{animation-range:contain ${start.toFixed(2)}% contain ${(start + span).toFixed(2)}%}`;
  }).join("");
}

function stylesheet(niche: ProtoNiche, cards: number, spinDeg: number, motions: readonly string[]): string {
  const p = niche.palette;
  return `
:root{
  --ink:${p.ink}; --surface:${p.surface}; --line:${p.line};
  --text:${p.text}; --muted:${p.muted}; --accent:${p.accent}; --accent-ink:${p.accentInk};
  --r:18px;
}
*,*::before,*::after{box-sizing:border-box}
html{overflow-x:clip}
body{
  margin:0; background:var(--ink); color:var(--text);
  font:17px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
  -webkit-font-smoothing:antialiased; text-rendering:optimizeLegibility;
  overflow-x:clip; padding-bottom:84px;
}
img{max-width:100%;height:auto;display:block}
a{color:inherit}
.wrap{width:100%;max-width:1160px;margin:0 auto;padding-inline:20px}
h1,h2,h3{margin:0;letter-spacing:-.025em;line-height:1.08}
h1{font-size:clamp(34px,8.4vw,74px);font-weight:800}
h2{font-size:clamp(26px,4.6vw,44px);font-weight:750}
h3{font-size:19px;font-weight:700;letter-spacing:-.01em}
p{margin:0}
.eyebrow{font-size:14px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);font-weight:600}

/* Шапка */
.top{position:sticky;top:0;z-index:30;background:color-mix(in srgb,var(--ink) 86%,transparent);backdrop-filter:blur(12px);border-bottom:1px solid var(--line)}
.top .wrap{display:flex;align-items:center;gap:14px;min-height:64px}
.brand{display:flex;align-items:center;gap:11px;font-weight:750;letter-spacing:-.015em;min-width:0}
.brand span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mark{width:34px;height:34px;flex:none;border-radius:11px;background:var(--accent);color:var(--accent-ink);display:grid;place-items:center;font-size:13px;font-weight:800;letter-spacing:.02em}
.mark img{width:100%;height:100%;object-fit:contain;border-radius:11px}
.word{height:32px;width:auto;max-width:min(58vw,190px);object-fit:contain;object-position:left center}
.top .tel{margin-left:auto;text-decoration:none;color:var(--muted);font-variant-numeric:tabular-nums;white-space:nowrap}
.top .btn{margin-left:auto}
.top .tel + .btn{margin-left:0}

.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:13px 22px;border-radius:999px;background:var(--accent);color:var(--accent-ink);font-weight:700;text-decoration:none;border:none;font-size:16px;white-space:nowrap;cursor:pointer}
.btn.ghost{background:transparent;color:var(--text);border:1px solid var(--line)}
.btn:focus-visible{outline:3px solid var(--accent);outline-offset:3px}

/* Первый экран */
.hero{position:relative;min-height:calc(100svh - 64px);display:grid;align-content:center;padding-block:clamp(40px,7vw,90px);overflow:clip}
/*
 * Параллакс: несколько слоёв, каждый едет со своей скоростью и в свою
 * сторону. Глубина задаётся переменными --a и --b прямо на слое — так один
 * механизм закрывает и подсветку на первом экране, и полосу за блоками, и
 * ореол за колесом, вместо трёх почти одинаковых правил.
 *
 * Слои не кликаются и лежат под содержимым: параллакс, перехватывающий
 * нажатие на кнопку, — это не украшение, а поломка.
 */
.par{position:absolute;inset:0;overflow:clip;pointer-events:none;z-index:0}
.par i{position:absolute;display:block;pointer-events:none;will-change:transform}
.hero .wrap,section .wrap,.stage-in{position:relative;z-index:1}
.glow{inset:-26% -14% auto auto;width:min(72vw,640px);aspect-ratio:1;border-radius:50%;background:radial-gradient(circle,var(--accent),transparent 62%);opacity:.16}
.mesh{inset:auto -20% -30% -20%;height:min(60vh,520px);background:radial-gradient(60% 100% at 30% 100%,var(--accent),transparent 70%);opacity:.07}
.band{inset:12% -30% auto -30%;height:clamp(180px,34vw,360px);background:linear-gradient(100deg,transparent,var(--accent),transparent);opacity:.05;transform:rotate(-4deg)}
.halo{inset:50% auto auto 50%;width:min(112vw,760px);aspect-ratio:1;margin:-0.5px 0 0 -0.5px;translate:-50% -50%;border-radius:50%;background:radial-gradient(circle,var(--accent),transparent 58%);opacity:.1}
.hero .sub{margin-top:18px;max-width:34ch;font-size:clamp(17px,2.1vw,21px);color:var(--muted)}
.row{display:flex;flex-wrap:wrap;gap:12px;margin-top:30px}
.chips{display:flex;flex-wrap:wrap;gap:9px;margin-top:26px;padding:0;list-style:none}
.chips li{padding:8px 15px;border:1px solid var(--line);border-radius:999px;color:var(--muted);font-size:15px}
.hint{margin-top:30px;display:inline-flex;align-items:center;gap:9px;color:var(--muted);font-size:13px;letter-spacing:.14em;text-transform:uppercase}
.hint i{width:1px;height:26px;background:linear-gradient(var(--muted),transparent);display:block}

/* Сцена с трюком */
.track{position:relative;height:340svh}
.stage{position:sticky;top:0;height:100svh;display:grid;align-content:center;overflow:clip}
.stage-in{display:grid;gap:clamp(18px,4vw,34px);justify-items:center;align-content:center}
.art{width:min(78vw,520px);aspect-ratio:1;position:relative}
.art svg,.art .shot{width:100%;height:100%;display:block}
.art .shot{object-fit:contain}
.spin{transform-origin:50% 50%;will-change:transform}
/* view-box — только для рисунка: у SVG проценты считаются от viewBox, а не
   от рамки элемента. На <img> это свойство не значит ничего. */
svg .spin{transform-box:view-box}
.bar{width:min(260px,62vw);height:3px;border-radius:2px;background:var(--line);overflow:hidden}
.bar i{display:block;height:100%;background:var(--accent);transform-origin:left center;transform:scaleX(0)}
.side{display:grid;gap:16px;width:100%;max-width:520px;min-width:0}
.cards{position:relative;display:grid;width:100%;min-height:170px;align-content:center}
.cards>*{grid-area:1/1}
.fly{--fx:0px;--fy:-30px;--fs:.93;--fr:0deg;border:1px solid var(--line);background:var(--surface);border-radius:var(--r);padding:22px 24px;will-change:transform,opacity}
.fly .n{font-size:12px;letter-spacing:.1em;color:var(--accent);font-weight:700}
.fly h3{margin-top:10px;font-size:clamp(23px,3.4vw,33px);font-weight:750;line-height:1.12}
.fly .price{margin-top:10px;color:var(--muted);font-size:17px}

/* Блоки */
section{position:relative;padding-block:clamp(44px,7vw,92px);overflow:clip}
.head{display:flex;flex-wrap:wrap;align-items:baseline;gap:12px 18px;margin-bottom:clamp(22px,3vw,38px)}
.grid{display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(min(100%,270px),1fr))}
.tile{border:1px solid var(--line);background:var(--surface);border-radius:var(--r);padding:22px;min-width:0}
.tile .price{margin-top:10px;color:var(--muted);font-size:15px}
.tile .n{font-size:12px;letter-spacing:.1em;color:var(--accent);font-weight:700;display:block;margin-bottom:10px}
.tile p{margin-top:9px;color:var(--muted);font-size:15px}
.shots{display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))}
.shots img{border-radius:var(--r);border:1px solid var(--line);width:100%;aspect-ratio:4/3;object-fit:cover}
.facts{display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr))}
.fact{border-top:1px solid var(--line);padding-top:16px;min-width:0}
.fact b{display:block;font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);font-weight:600}
.fact span{display:block;margin-top:9px;font-size:19px;font-weight:650;overflow-wrap:anywhere}
.fact a{color:inherit}

/* Подвал и нижняя кнопка */
footer{border-top:1px solid var(--line);padding-block:30px 40px;color:var(--muted);font-size:14px}
footer .wrap{display:flex;flex-wrap:wrap;gap:10px 22px}
.dock{position:fixed;inset:auto 0 0 0;z-index:40;padding:10px 16px calc(10px + env(safe-area-inset-bottom));background:color-mix(in srgb,var(--ink) 88%,transparent);backdrop-filter:blur(12px);border-top:1px solid var(--line)}
.dock .btn{width:100%;padding-block:15px}

@media (width >= 56rem){
  body{padding-bottom:0}
  .dock{display:none}
  .stage-in{grid-template-columns:minmax(0,1fr) minmax(0,1fr);align-items:center;justify-items:start;gap:44px}
  .art{justify-self:center}
}
@media (width < 56rem){
  .top .tel{display:none}
  .top .btn{display:none}
  .fly{padding:20px 22px}
}

/* Появление блоков. База — всё видно; анимация только там, где браузер её умеет. */
@keyframes spin{to{transform:rotate(${spinDeg}deg)}}
@keyframes par{from{transform:translate3d(0,var(--a,-36px),0)}to{transform:translate3d(0,var(--b,36px),0)}}
@keyframes grow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
/*
 * Кадры одни на все шесть карточек, а направление вылета — переменные на
 * самой карточке. Шесть почти одинаковых наборов кадров весили бы килобайт
 * и разошлись бы при первой же правке.
 */
@keyframes fling{
  0%,100%{opacity:0;transform:translate3d(var(--fx),var(--fy),0) scale(var(--fs)) rotate(var(--fr))}
  17%,83%{opacity:1;transform:translate3d(0,0,0) scale(1) rotate(0deg)}
}
@supports (animation-timeline:view()){
  .track{view-timeline-name:--track;view-timeline-axis:block}
  .par i{animation:par linear both;animation-timeline:view();animation-range:cover 0% cover 100%}
  /* Ореол за колесом живёт по прокрутке самой сцены: сцена прилипшая, и её
     собственное продвижение по экрану во время показа почти не меняется. */
  .halo{animation-timeline:--track;animation-range:contain 0% contain 100%}
  .spin{animation:spin linear both;animation-timeline:--track;animation-range:contain 0% contain 100%}
  .bar i{animation:grow linear both;animation-timeline:--track;animation-range:contain 0% contain 100%}
  .fly{opacity:0;animation:fling linear both;animation-timeline:--track}
  ${cardRanges(cards)}
}
${motionCss(motions)}

/* Браузер без scroll-driven animations: те же блоки, просто без театра. */
.no-sdt .track{height:auto}
.no-sdt .stage{position:static;height:auto;padding-block:clamp(44px,7vw,92px)}
.no-sdt .cards{display:grid;gap:12px;min-height:0}
.no-sdt .cards>*{grid-area:auto}
.no-sdt .fly{opacity:1;transform:none;animation:none}
.no-sdt .bar{display:none}
.no-sdt .spin{animation:spin 26s linear infinite}
.no-sdt .par{display:none}

/* Кого укачивает от параллакса — тому страница стоит на месте и остаётся целой. */
@media (prefers-reduced-motion:reduce){
  *,*::before,*::after{animation:none!important;transition:none!important}
  .track{height:auto}
  .stage{position:static;height:auto;padding-block:clamp(44px,7vw,92px)}
  .cards{display:grid;gap:12px;min-height:0}
  .cards>*{grid-area:auto}
  .fly{opacity:1;transform:none}
  .bar{display:none}
  .par{display:none}
}`;
}

export function bookingHtml(input: { facts: ProtoFacts; niche: ProtoNiche }): string {
  const { facts, niche } = input;
  const c = COPY[facts.locale];
  const art = trick(trickFor(niche), niche.palette, facts.wheel);
  const action = mainAction(facts);
  // Кнопка либо открывает переписку, либо набирает номер. От этого зависят
  // и подзаголовок первого экрана, и шаги записи.
  const voice = action.kind === "phone" ? "call" : "chat";
  const steps = c.steps[voice];
  const stage = facts.services.slice(0, STAGE_MAX);
  const rest = facts.services.slice(STAGE_MAX);
  /*
   * Своё движение каждому блоку — просьба владельца дословно. Услуги
   * получают его по смыслу названия: «кузовные работы» встают панелью,
   * «замена фильтров» въезжает вставкой, «ТО» щёлкает на место. Шаги записи
   * идут своим набором, чтобы три соседние карточки не появились одинаково.
   */
  const stageMotions = motionsFor(stage.map((service) => service.name));
  const restMotions = motionsFor(rest.map((service) => service.name));
  const stepMotions = motionsFor(steps.map((step) => step.title));
  const motions = ["rise", ...restMotions, ...stepMotions];
  const band = `<section><span class="par" aria-hidden="true"><i class="band" style="--a:-54px;--b:58px"></i></span>`;
  const where = inCity(facts.city, facts.locale);
  const title = `${facts.name} — ${niche.ru}${where}`;
  const description = facts.about ?? `${niche.ru}${where}. ${c.heroSub[voice]}.`;

  const logo = facts.logo
    ? wordmark(facts.logo)
      ? `<img class="word" src="${esc(facts.logo.url)}" alt="${esc(facts.name)}" width="${facts.logo.width}" height="${facts.logo.height}">`
      : `<span class="mark"><img src="${esc(facts.logo.url)}" alt="${esc(facts.name)}" width="${facts.logo.width}" height="${facts.logo.height}"></span><span>${esc(facts.name)}</span>`
    : `<span class="mark">${esc(initials(facts.name))}</span><span>${esc(facts.name)}</span>`;

  const price = (value: string | null | undefined) =>
    value ? `<p class="price">${esc(value)}</p>` : "";

  const flyCards = stage
    .map(
      (service, index) => `
        <article class="fly c${index + 1}" style="${flingVars(stageMotions[index])}">
          <span class="n">${String(index + 1).padStart(2, "0")}</span>
          <h3>${esc(service.name)}</h3>
          ${price(service.price)}
        </article>`,
    )
    .join("");

  const restTiles = rest
    .map(
      (service, index) => `
        <article class="tile mo m-${restMotions[index]}">
          <h3>${esc(service.name)}</h3>
          ${price(service.price)}
        </article>`,
    )
    .join("");

  const stepTiles = steps
    .map(
      (step, index) => `
        <article class="tile mo m-${stepMotions[index]}">
          <span class="n">${String(index + 1).padStart(2, "0")}</span>
          <h3>${esc(step.title)}</h3>
          <p>${esc(step.text)}</p>
        </article>`,
    )
    .join("");

  const shots = facts.photos
    .map((photo) => `<img src="${esc(photo)}" alt="${esc(facts.name)}" loading="lazy">`)
    .join("");

  const fact = (label: string, value: string, href?: string) =>
    `<div class="fact"><b>${esc(label)}</b><span>${
      href ? `<a href="${esc(href)}">${esc(value)}</a>` : esc(value)
    }</span></div>`;

  const contacts = [
    facts.address ? fact(c.address, facts.address, mapLink(facts.address)) : "",
    facts.hours ? fact(c.hours, facts.hours) : "",
    facts.phone ? fact(c.phone, facts.phone, `tel:${facts.phone.replace(/[^\d+]/g, "")}`) : "",
    facts.instagram
      ? fact("Instagram", `@${facts.instagram.replace(/^@/, "")}`, `https://instagram.com/${facts.instagram.replace(/^@/, "")}`)
      : "",
  ].join("");

  const chipText = [
    facts.hours,
    facts.address ?? facts.city,
    action.kind === "telegram" ? c.viaTelegram : action.kind === "whatsapp" ? c.viaWhatsapp : null,
  ].filter((value): value is string => Boolean(value));
  const chips = chipText.length
    ? `<ul class="chips">${chipText.map((value) => `<li>${esc(value)}</li>`).join("")}</ul>`
    : "";

  const cta = action.kind === "none" ? "" : `<a class="btn" href="${esc(action.href)}">${esc(c.book)}</a>`;
  const ctaGhost =
    facts.phone && action.kind !== "phone"
      ? `<a class="btn ghost" href="tel:${esc(facts.phone.replace(/[^\d+]/g, ""))}">${esc(c.call)}</a>`
      : "";

  return `<!doctype html>
<html lang="${facts.locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow,noarchive">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="theme-color" content="${niche.palette.ink}">
<style>${stylesheet(niche, stage.length, art.spinDeg, motions)}</style>
<script>if(!(window.CSS&&CSS.supports&&CSS.supports("animation-timeline:view()")))document.documentElement.className="no-sdt"</script>
</head>
<body>
<header class="top">
  <div class="wrap">
    <span class="brand">${logo}</span>
    ${facts.phone ? `<a class="tel" href="tel:${esc(facts.phone.replace(/[^\d+]/g, ""))}">${esc(facts.phone)}</a>` : ""}
    ${cta}
  </div>
</header>

<main>
  <div class="hero">
    <span class="par" aria-hidden="true">
      <i class="glow" style="--a:-70px;--b:80px"></i>
      <i class="mesh" style="--a:34px;--b:-46px"></i>
    </span>
    <div class="wrap">
      <p class="eyebrow">${esc(niche.ru)}${esc(where)}</p>
      <h1>${esc(facts.name)}</h1>
      <p class="sub">${esc(facts.about ?? c.heroSub[voice])}</p>
      <div class="row">${cta}${ctaGhost}</div>
      ${chips}
      <p class="hint"><i></i>${esc(c.scroll)}</p>
    </div>
  </div>

  <div class="track">
    <div class="stage">
      <span class="par" aria-hidden="true"><i class="halo" style="--a:60px;--b:-60px"></i></span>
      <div class="wrap stage-in">
        <div class="art">${art.html}</div>
        <div class="side">
          <p class="eyebrow">${esc(c.stage)}</p>
          <div class="cards">${flyCards}</div>
          <div class="bar"><i></i></div>
        </div>
      </div>
    </div>
  </div>

  ${
    restTiles
      ? `${band}
    <div class="wrap">
      <div class="head mo m-rise"><h2>${esc(c.all)}</h2></div>
      <div class="grid">${restTiles}</div>
    </div>
  </section>`
      : ""
  }

  ${
    shots
      ? `${band}
    <div class="wrap">
      <div class="head mo m-rise"><h2>${esc(c.photos)}</h2></div>
      <div class="shots">${shots}</div>
    </div>
  </section>`
      : ""
  }

  ${band}
    <div class="wrap">
      <div class="head mo m-rise"><h2>${esc(c.how)}</h2></div>
      <div class="grid">${stepTiles}</div>
      <div class="row mo m-rise">${cta}${ctaGhost}</div>
    </div>
  </section>

  ${
    contacts
      ? `${band}
    <div class="wrap">
      <div class="head mo m-rise"><h2>${esc(c.where)}</h2></div>
      <div class="facts mo m-rise">${contacts}</div>
      ${facts.address ? `<div class="row"><a class="btn ghost" href="${esc(mapLink(facts.address))}">${esc(c.map)}</a></div>` : ""}
    </div>
  </section>`
      : ""
  }
</main>

<footer>
  <div class="wrap">
    <span>${esc(facts.name)}</span>
    <span>${esc(c.madeBy)} ${esc(facts.source)}</span>
  </div>
</footer>

${cta ? `<div class="dock">${cta}</div>` : ""}
</body>
</html>`;
}
