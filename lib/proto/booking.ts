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
import { RADIUS, SHADOW, SPACE, TYPE, WEIGHT, fluid, fontsFor, skinFor } from "@/lib/proto/design";
import type { ProtoFacts } from "@/lib/proto/facts";
import { mainAction, wordmark } from "@/lib/proto/facts";
import { icon, iconFor } from "@/lib/proto/icons";
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

function stylesheet(input: {
  niche: ProtoNiche;
  cards: number;
  spinDeg: number;
  motions: readonly string[];
}): string {
  const { niche, cards, spinDeg, motions } = input;
  const s = skinFor(niche.tone, niche.accent);
  const f = fontsFor(niche.key);
  return `
:root{
  --ink:${s.ink}; --surface:${s.surface}; --surface-2:${s.surface2};
  --line:${s.line}; --line-strong:${s.lineStrong};
  --text:${s.text}; --muted:${s.muted}; --faint:${s.faint};
  --accent:${s.accent}; --accent-soft:${s.accentSoft}; --accent-ink:${s.accentInk};
  --r:${RADIUS}px;
  --display:"${f.display}",${niche.tone === "light" ? "Georgia,serif" : "system-ui,sans-serif"};
  --text-face:"${f.text}",system-ui,-apple-system,sans-serif;
  /* Отступы секций — две соседние ступени шкалы, между ними плавно. */
  --gap-section:clamp(${SPACE[7]}px,9vw,${SPACE[8]}px);
  --gap-block:${SPACE[5]}px;
}
*,*::before,*::after{box-sizing:border-box}
html{overflow-x:clip}
body{
  margin:0; background:var(--ink); color:var(--text);
  font:${WEIGHT.text} ${TYPE[2]}px/1.6 var(--text-face);
  -webkit-font-smoothing:antialiased; text-rendering:optimizeLegibility;
  overflow-x:clip; padding-bottom:${SPACE[8]}px;
}
img{max-width:100%;height:auto;display:block}
a{color:inherit}
.wrap{width:100%;max-width:1180px;margin:0 auto;padding-inline:${SPACE[4]}px}

/*
 * Два веса на всю страницу, и оба здесь. Шесть весов, которые были раньше,
 * это не богатство, а отсутствие решения; ослаблять надо цветом.
 */
h1,h2,h3,.display{
  margin:0; font-family:var(--display); font-weight:${f.displayWeight};
  line-height:1.05; letter-spacing:${f.tracking};
  ${f.caps ? "text-transform:uppercase;" : ""}
}
h1{font-size:${fluid(TYPE[6], TYPE[9])}}
h2{font-size:${fluid(TYPE[5], TYPE[8])}}
h3{font-size:${TYPE[3]}px;line-height:1.2}
p{margin:0}
.eyebrow{
  font-family:var(--text-face); font-size:${TYPE[1]}px; font-weight:${WEIGHT.strong};
  letter-spacing:.18em; text-transform:uppercase; color:var(--accent);
}

/* Шапка */
.top{position:sticky;top:0;z-index:30;background:color-mix(in srgb,var(--ink) 88%,transparent);backdrop-filter:blur(12px);border-bottom:1px solid var(--line)}
.top .wrap{display:flex;align-items:center;gap:${SPACE[3]}px;min-height:${SPACE[6]}px}
.brand{display:flex;align-items:center;gap:${SPACE[2]}px;font-family:var(--display);font-weight:${f.displayWeight};font-size:${TYPE[2]}px;letter-spacing:${f.tracking};min-width:0${f.caps ? ";text-transform:uppercase" : ""}}
.brand span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mark{width:${SPACE[4] + SPACE[3]}px;height:${SPACE[4] + SPACE[3]}px;flex:none;border-radius:${RADIUS - 4}px;background:var(--accent);color:var(--accent-ink);display:grid;place-items:center;font-size:${TYPE[0]}px;font-weight:${WEIGHT.strong}}
.mark img{width:100%;height:100%;object-fit:contain;border-radius:${RADIUS - 4}px}
.word{height:${SPACE[4] + SPACE[2]}px;width:auto;max-width:min(58vw,190px);object-fit:contain;object-position:left center}
.top .tel{margin-left:auto;text-decoration:none;color:var(--muted);font-variant-numeric:tabular-nums;white-space:nowrap;font-size:${TYPE[1]}px}
.top .btn{margin-left:auto}
.top .tel + .btn{margin-left:0}

.btn{
  display:inline-flex;align-items:center;justify-content:center;gap:${SPACE[1]}px;
  padding:${SPACE[2]}px ${SPACE[4]}px;border-radius:${RADIUS}px;
  background:var(--accent);color:var(--accent-ink);
  font-family:var(--text-face);font-weight:${WEIGHT.strong};font-size:${TYPE[2]}px;
  text-decoration:none;border:none;white-space:nowrap;cursor:pointer;
  box-shadow:${SHADOW.raised};
}
.btn.ghost{background:transparent;color:var(--text);border:1px solid var(--line-strong);box-shadow:none}
.btn:focus-visible{outline:3px solid var(--accent);outline-offset:3px}
.btn:active{box-shadow:none}

/* Первый экран: текст слева, плоскость цвета справа. */
.hero{position:relative;overflow:clip;border-bottom:1px solid var(--line)}
.hero .wrap{display:grid;gap:${SPACE[6]}px;align-items:center;min-height:calc(100svh - ${SPACE[6]}px);padding-block:${SPACE[6]}px}
.hero .sub{margin-top:${SPACE[3]}px;max-width:32ch;font-size:${TYPE[3]}px;color:var(--muted)}
.row{display:flex;flex-wrap:wrap;gap:${SPACE[2]}px;margin-top:${SPACE[5]}px}
.chips{display:flex;flex-wrap:wrap;gap:${SPACE[1]}px;margin-top:${SPACE[4]}px;padding:0;list-style:none}
.chips li{padding:${SPACE[1]}px ${SPACE[3]}px;border:1px solid var(--line);border-radius:${RADIUS}px;color:var(--muted);font-size:${TYPE[1]}px}
.hint{margin-top:${SPACE[5]}px;display:inline-flex;align-items:center;gap:${SPACE[2]}px;color:var(--faint);font-size:${TYPE[0]}px;letter-spacing:.16em;text-transform:uppercase}
.hint i{width:1px;height:${SPACE[4]}px;background:linear-gradient(var(--faint),transparent);display:block}

/*
 * Плоскость с названием ниши вместо мягкого свечения.
 *
 * Свечение — приём из шаблонов, и именно оно делало первый экран пустым. У
 * всех разобранных сайтов на его месте либо фотография, либо поле плотного
 * цвета с крупным словом поперёк. Фотография у клиента есть не всегда, а
 * поле — всегда.
 */
.plate{position:relative;container-type:inline-size;align-self:stretch;min-height:${SPACE[9]}px;border-radius:var(--r);background:var(--accent);color:var(--accent-ink);overflow:clip;display:grid;place-items:center;box-shadow:${SHADOW.card}}
/*
 * Слово подгоняется под ширину поля точно, а не переносится.
 *
 * Перенос рубит его посреди слога — «ШИН/ОМО/НТА/Ж», — и поле из плаката
 * превращается в ошибку вёрстки. Считать размер в процентах от ширины поля
 * тоже не выходит: ширина буквы у каждой гарнитуры своя, и множитель,
 * подобранный под Unbounded, вылезает за край на Oswald.
 *
 * Поэтому слово — текст внутри SVG с textLength: браузер сам подгоняет его
 * ровно под заданную ширину, какой бы ни была гарнитура. Заодно короткое
 * слово растягивается во всю плоскость, а это и есть приём с плаката.
 */
.plate .display{width:100%;height:auto;display:block;padding:${SPACE[3]}px}
.plate .display text{fill:currentColor;font-family:var(--display);font-weight:${f.displayWeight};font-size:${TYPE[10]}px}
.plate img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.plate.shot .display{display:none}

/* Сцена с трюком */
.track{position:relative;height:340svh}
.stage{position:sticky;top:0;height:100svh;display:grid;align-content:center;overflow:clip}
.stage-in{display:grid;gap:${SPACE[5]}px;justify-items:center;align-content:center}
.art{width:min(76vw,${SPACE[11] * 2}px);aspect-ratio:1;position:relative}
.art svg,.art .shot{width:100%;height:100%;display:block}
.art .shot{object-fit:contain}
.spin{transform-origin:50% 50%;will-change:transform}
/* view-box — только для рисунка: у SVG проценты считаются от viewBox, а не
   от рамки элемента. На <img> это свойство не значит ничего. */
svg .spin{transform-box:view-box}
.bar{width:min(260px,62vw);height:3px;border-radius:2px;background:var(--line);overflow:hidden}
.bar i{display:block;height:100%;background:var(--accent);transform-origin:left center;transform:scaleX(0)}
.side{display:grid;gap:${SPACE[3]}px;width:100%;max-width:520px;min-width:0}
.cards{position:relative;display:grid;width:100%;min-height:${SPACE[9] + SPACE[4]}px;align-content:center}
.cards>*{grid-area:1/1}
.fly{--fx:0px;--fy:-30px;--fs:.93;--fr:0deg;border:1px solid var(--line);background:var(--surface);border-radius:var(--r);padding:${SPACE[4]}px;box-shadow:${SHADOW.lifted};will-change:transform,opacity}
.fly .top-row,.tile .top-row{display:flex;align-items:center;gap:${SPACE[2]}px;margin-bottom:${SPACE[3]}px}
.fly .n{font-size:${TYPE[0]}px;letter-spacing:.12em;color:var(--accent);font-weight:${WEIGHT.strong}}
.fly h3{margin-top:0;font-size:${fluid(TYPE[5], TYPE[7])}}
.fly .price{margin-top:${SPACE[2]}px;color:var(--muted);font-size:${TYPE[2]}px}
.fly .ico{width:${SPACE[5]}px;height:${SPACE[5]}px;flex:none;color:var(--accent)}

/* Блоки */
section{position:relative;padding-block:var(--gap-section);overflow:clip}
.head{display:flex;flex-wrap:wrap;align-items:baseline;gap:${SPACE[2]}px ${SPACE[4]}px;margin-bottom:var(--gap-block)}
.grid{display:grid;gap:${SPACE[3]}px;grid-template-columns:repeat(auto-fit,minmax(min(100%,270px),1fr))}
.tile{border:1px solid var(--line);background:var(--surface);border-radius:var(--r);padding:${SPACE[4]}px;min-width:0;box-shadow:${SHADOW.card}}
.tile .ico{flex:none;color:var(--accent)}
.tile .price{margin-top:${SPACE[2]}px;color:var(--muted);font-size:${TYPE[1]}px}
.tile .n{font-size:${TYPE[0]}px;letter-spacing:.12em;color:var(--accent);font-weight:${WEIGHT.strong}}
.tile p{margin-top:${SPACE[1]}px;color:var(--muted);font-size:${TYPE[1]}px}
.shots{display:grid;gap:${SPACE[3]}px;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))}
.shots img{border-radius:var(--r);border:1px solid var(--line);width:100%;aspect-ratio:4/3;object-fit:cover}
.facts{display:grid;gap:${SPACE[3]}px;grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr))}
.fact{border-top:2px solid var(--accent);padding-top:${SPACE[3]}px;min-width:0}
.fact b{display:block;font-size:${TYPE[0]}px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);font-weight:${WEIGHT.strong}}
.fact span{display:block;margin-top:${SPACE[2]}px;font-size:${TYPE[3]}px;font-weight:${WEIGHT.strong};overflow-wrap:anywhere}
.fact a{color:inherit}

/* Подвал и нижняя кнопка */
footer{border-top:1px solid var(--line);padding-block:${SPACE[5]}px ${SPACE[6]}px;color:var(--faint);font-size:${TYPE[1]}px}
footer .wrap{display:flex;flex-wrap:wrap;gap:${SPACE[2]}px ${SPACE[4]}px}
.dock{position:fixed;inset:auto 0 0 0;z-index:40;padding:${SPACE[2]}px ${SPACE[3]}px calc(${SPACE[2]}px + env(safe-area-inset-bottom));background:color-mix(in srgb,var(--ink) 90%,transparent);backdrop-filter:blur(12px);border-top:1px solid var(--line)}
.dock .btn{width:100%;padding-block:${SPACE[3]}px}

@media (width >= 56rem){
  body{padding-bottom:0}
  .dock{display:none}
  .hero .wrap{grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr)}
  .stage-in{grid-template-columns:minmax(0,1fr) minmax(0,1fr);align-items:center;justify-items:start;gap:${SPACE[6]}px}
  .art{justify-self:center}
}
@media (width < 56rem){
  .top .tel{display:none}
  .top .btn{display:none}
  .plate{min-height:${SPACE[8]}px;order:2}
}

/* Появление блоков. База — всё видно; анимация только там, где браузер её умеет. */
@keyframes spin{to{transform:rotate(${spinDeg}deg)}}
@keyframes grow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes par{from{transform:translate3d(0,var(--a,-36px),0)}to{transform:translate3d(0,var(--b,36px),0)}}
/*
 * Кадры одни на все шесть карточек, а направление вылета — переменные на
 * самой карточке. Шесть почти одинаковых наборов кадров весили бы килобайт
 * и разошлись бы при первой же правке.
 */
@keyframes fling{
  0%,100%{opacity:0;transform:translate3d(var(--fx),var(--fy),0) scale(var(--fs)) rotate(var(--fr))}
  17%,83%{opacity:1;transform:translate3d(0,0,0) scale(1) rotate(0deg)}
}
.par{position:absolute;inset:0;overflow:clip;pointer-events:none;z-index:0}
.par i{position:absolute;display:block;pointer-events:none;will-change:transform}
/* Пятно внутри плоскости: глубина без градиента. Свечение разведка
   назвала приёмом из шаблонов, и правильно. */
.blot{inset:-20% auto auto -10%;width:70cqw;aspect-ratio:1;border-radius:50%;background:var(--accent-ink);opacity:.08}
.band{inset:12% -30% auto -30%;height:clamp(${SPACE[7]}px,34vw,${SPACE[9]}px);background:linear-gradient(100deg,transparent,var(--accent),transparent);opacity:.07;transform:rotate(-4deg)}
.halo{inset:50% auto auto 50%;width:min(112vw,760px);aspect-ratio:1;translate:-50% -50%;border-radius:50%;background:radial-gradient(circle,var(--accent),transparent 58%);opacity:.1}
.hero .wrap,section .wrap,.stage-in{position:relative;z-index:1}
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
.no-sdt .stage{position:static;height:auto;padding-block:var(--gap-section)}
.no-sdt .cards{display:grid;gap:${SPACE[2]}px;min-height:0}
.no-sdt .cards>*{grid-area:auto}
.no-sdt .fly{opacity:1;transform:none;animation:none}
.no-sdt .bar{display:none}
.no-sdt .spin{animation:spin 26s linear infinite}
.no-sdt .par{display:none}

/* Кого укачивает от параллакса — тому страница стоит на месте и остаётся целой. */
@media (prefers-reduced-motion:reduce){
  *,*::before,*::after{animation:none!important;transition:none!important}
  .track{height:auto}
  .stage{position:static;height:auto;padding-block:var(--gap-section)}
  .cards{display:grid;gap:${SPACE[2]}px;min-height:0}
  .cards>*{grid-area:auto}
  .fly{opacity:1;transform:none}
  .bar{display:none}
  .par{display:none}
}`;
}

export function bookingHtml(input: { facts: ProtoFacts; niche: ProtoNiche }): string {
  const { facts, niche } = input;
  const c = COPY[facts.locale];
  const skin = skinFor(niche.tone, niche.accent);
  const fonts = fontsFor(niche.key);
  const art = trick(trickFor(niche), skin, facts.wheel);
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
          <div class="top-row">${icon(iconFor(service.name))}<span class="n">${String(index + 1).padStart(2, "0")}</span></div>
          <h3>${esc(service.name)}</h3>
          ${price(service.price)}
        </article>`,
    )
    .join("");

  const restTiles = rest
    .map(
      (service, index) => `
        <article class="tile mo m-${restMotions[index]}">
          <div class="top-row">${icon(iconFor(service.name))}</div>
          <h3>${esc(service.name)}</h3>
          ${price(service.price)}
        </article>`,
    )
    .join("");

  const stepTiles = steps
    .map(
      (step, index) => `
        <article class="tile mo m-${stepMotions[index]}">
          <div class="top-row"><span class="n">${String(index + 1).padStart(2, "0")}</span></div>
          <h3>${esc(step.title)}</h3>
          <p>${esc(step.text)}</p>
        </article>`,
    )
    .join("");

  const shots = facts.photos
    .slice(1)
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

  /*
   * Плоскость на первом экране: либо его собственная фотография, либо поле
   * акцента с названием ниши поперёк.
   *
   * До разведки на этом месте было мягкое свечение, и именно оно делало
   * первый экран пустым: ни одного живого пикселя, тёмный фон и текст. У
   * всех десяти разобранных сайтов на первом экране либо снимок, либо
   * плотный цвет с крупным словом. Фотография у клиента есть не всегда —
   * поле есть всегда.
   *
   * Слово в поле — род занятий, а не название: название уже стоит
   * заголовком, и повторять его на одном экране незачем.
   */
  const plate = facts.photos[0]
    ? `<div class="plate shot"><img src="${esc(facts.photos[0])}" alt="${esc(facts.name)}"></div>`
    : `<div class="plate">
        <span class="par" aria-hidden="true"><i class="blot" style="--a:74px;--b:-66px"></i></span>
        <svg class="display" viewBox="0 0 1000 96" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
          <text x="500" y="76" text-anchor="middle" textLength="960" lengthAdjust="spacingAndGlyphs">${esc(
            niche.ru.toUpperCase(),
          )}</text>
        </svg>
      </div>`;

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
<meta name="theme-color" content="${skin.ink}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${esc(fonts.href)}">
<style>${stylesheet({ niche, cards: stage.length, spinDeg: art.spinDeg, motions })}</style>
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
    <span class="par" aria-hidden="true"><i class="band" style="--a:-40px;--b:44px"></i></span>
    <div class="wrap">
      <div>
        <p class="eyebrow">${esc(niche.ru)}${esc(where)}</p>
        <h1>${esc(facts.name)}</h1>
        <p class="sub">${esc(facts.about ?? c.heroSub[voice])}</p>
        <div class="row">${cta}${ctaGhost}</div>
        ${chips}
        <p class="hint"><i></i>${esc(c.scroll)}</p>
      </div>
      ${plate}
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
