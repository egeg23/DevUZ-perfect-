/**
 * Виджет хода сборки в боте — Telegram Bot API, sendWidget.
 *
 * Владелец, 10.11.2026: «показывай прям интерактивно через этот блок как ты
 * собираешь его, делая вид, что собираешь прямо сейчас». Виджет — мини-
 * браузер, в котором сайт клиента собирается на глазах: каркас страницы,
 * шапка с его названием, цвет бренда, его услуги по одной, кнопка записи,
 * проверка. Шаги двигает бот после настоящих шагов сборки
 * (lib/proto/instant/bot.ts → editMessageWidgetData), а между ними виджет
 * живёт сам: мерцание, печать, появление.
 *
 * Владелец, 12.11.2026: «сделать прям как будто сайт собирается в реальном
 * времени там, не просто текст, а сделать интерактивно и красиво, будто
 * сборка идёт здесь и сейчас того сайта, который увидит клиент». Мини-сайт —
 * в цветах и шрифте шаблона его сферы (SKIN): адрес печатается в строке
 * браузера, их сайт «читается» полосой, шапка с буквой-знаком и названием,
 * первый экран заливается фирменным цветом, курсор ставит кнопку и услуги с
 * ценами по одной, страница прокручивается к фото, форме записи и подвалу с
 * телефоном, окно сжимается до телефона (проверка) и в конце блик. Сцена —
 * на шаг бота; сколько она идёт, столько бот ждёт до следующего шага
 * (STEP_WAIT), иначе подпись убежит вперёд картинки. Бот ушёл на два шага
 * вперёд или виджет пересоздан (Telegram делает это, когда сообщение
 * уехало с экрана) — сцены ставятся сразу, без повтора.
 *
 * Пределы Telegram (core.telegram.org/bots/widgets, профиль 1): код до 32 КБ
 * и до 4 КБ после zlib, без сети, картинки только data: (в 4 КБ не влезают),
 * скрипт в QuickJS, шрифты только системные семейства. Нельзя clip-path,
 * text-shadow, color-mix, 3D; не больше 16 элементов сразу с opacity < 1,
 * размытой тенью или фильтром — иначе виджет останавливают, поэтому всё
 * появляется через transform, а не прозрачность. Чтение раскладки — только
 * getBoundingClientRect и не в каждом кадре. Состояние — JSON до 1024 байт:
 * {k: шаг, f: 1/2 — не удалось, n: название, c: цвет, s: до четырёх услуг,
 * r: их цены, g: строка под названием, p: телефон, u: адрес сайта}. Пишет
 * только бот, данные клиента виджет кладёт через textContent.
 */
import type { InstantLocale, InstantNiche } from "@/lib/proto/instant/types";

export const STEPS = ["read", "brand", "services", "build", "check", "done"] as const;
export type BuildStep = (typeof STEPS)[number];

/**
 * Почему сборка встала. «Передали менеджеру» говорим только там, где лид
 * правда ушёл (ручной путь); сайт не открылся — просим адрес ещё раз.
 */
export type BuildFail = "site" | "build";

const LABELS: Record<InstantLocale, Record<BuildStep, string> & { title: string; fail: Record<BuildFail, string>; book: string }> = {
  ru: {
    title: "Собираем ваш сайт",
    read: "Читаем сайт",
    brand: "Логотип и цвета",
    services: "Услуги и цены",
    build: "Собираем страницы",
    check: "Проверяем",
    done: "Готово",
    fail: { site: "Сайт не открылся", build: "Соберёт дизайнер вручную" },
    book: "Записаться",
  },
  uz: {
    title: "Saytingizni yig‘yapmiz",
    read: "Saytni o‘qiyapmiz",
    brand: "Logotip va ranglar",
    services: "Xizmatlar va narxlar",
    build: "Sahifalarni yig‘yapmiz",
    check: "Tekshiryapmiz",
    done: "Tayyor",
    fail: { site: "Sayt ochilmadi", build: "Dizayner qo‘lda yig‘adi" },
    book: "Yozilish",
  },
  en: {
    title: "Building your website",
    read: "Reading the website",
    brand: "Logo and colors",
    services: "Services and prices",
    build: "Building the pages",
    check: "Checking",
    done: "Done",
    fail: { site: "The website did not open", build: "A designer will build it by hand" },
    book: "Book now",
  },
  ar: {
    title: "نجهّز موقعكم",
    read: "نقرأ الموقع",
    brand: "الشعار والألوان",
    services: "الخدمات والأسعار",
    build: "نجمع الصفحات",
    check: "نتحقق",
    done: "تم",
    fail: { site: "لم يُفتح الموقع", build: "سيجهّزه المصمم يدويًا" },
    book: "احجزوا",
  },
  pl: {
    title: "Budujemy Twoją stronę",
    read: "Czytamy stronę",
    brand: "Logo i kolory",
    services: "Usługi i ceny",
    build: "Składamy strony",
    check: "Sprawdzamy",
    done: "Gotowe",
    fail: { site: "Strona się nie otworzyła", build: "Projektant zbuduje ją ręcznie" },
    book: "Zapisz się",
  },
};

/** Подпись под виджетом — запасной путь: её видит и клиент, у которого виджетов нет. */
export function stepCaption(locale: InstantLocale, step: BuildStep, failed: BuildFail | false = false): string {
  const l = LABELS[locale];
  const at = STEPS.indexOf(step);
  // Сбой — крестик на шаге, без отдельной строки: что делать дальше, бот
  // пишет следующим сообщением, и одно и то же клиент не читает трижды.
  return [
    `<b>${l.title}</b>`,
    ...STEPS.slice(0, failed ? at + 1 : STEPS.length).map((s, i) => `${i < at || step === "done" ? "✅" : i === at ? (failed ? "✖️" : "⏳") : "▫️"} ${l[s]}`),
  ].join("\n");
}

export type WidgetInfo = {
  name?: string;
  color?: string | null;
  services?: string[];
  /** Цены услуг, по порядку услуг; пусто — цены нет. */
  prices?: (string | null)[];
  /** Строка под названием на первом экране: слоган или город. */
  sub?: string | null;
  phone?: string | null;
  /** Адрес сайта клиента без https:// — печатается в строке браузера. */
  host?: string | null;
};

/**
 * Сколько бот ждёт перед шагом: столько идёт сцена прошлого шага в виджете.
 * Без виджета (приложение их не умеет) ждём по-старому, STEP_SHOW_MS.
 */
export const STEP_WAIT: Record<BuildStep, number> = { read: 0, brand: 1200, services: 2000, build: 3900, check: 3300, done: 2400 };

/** Состояние виджета: шаг и то, что уже узнали о клиенте. Всегда ≤ 1024 байт. */
export function widgetState(step: BuildStep, failed: BuildFail | false = false, info: WidgetInfo = {}): string {
  const cut = (s: string, n: number) => ([...s].length > n ? `${[...s].slice(0, n - 1).join("")}…` : s);
  const state: Record<string, unknown> = { k: STEPS.indexOf(step), f: failed === "site" ? 1 : failed === "build" ? 2 : 0 };
  if (info.name) state.n = cut(info.name, 40);
  if (info.color && /^#[0-9a-f]{6}$/i.test(info.color)) state.c = info.color.toLowerCase();
  if (info.host) state.u = cut(info.host, 40);
  if (info.phone) state.p = cut(info.phone, 22);
  if (info.sub) state.g = cut(info.sub.replace(/\s+/g, " ").trim(), 56);
  if (info.services?.length) {
    state.s = info.services.slice(0, 4).map((x) => cut(x, 34));
    const prices = (info.prices ?? []).slice(0, 4).map((x) => (x ? cut(x, 18) : ""));
    if (prices.some(Boolean)) state.r = prices;
  }
  let out = JSON.stringify(state);
  while (Buffer.byteLength(out) > 1024 && Array.isArray(state.s) && state.s.length) {
    (state.s as string[]).pop();
    if (Array.isArray(state.r)) (state.r as string[]).length = (state.s as string[]).length;
    out = JSON.stringify(state);
  }
  if (Buffer.byteLength(out) > 1024) {
    delete state.g;
    out = JSON.stringify(state);
  }
  return out;
}

/** Кнопка в мини-сайте виджета — как главная кнопка шаблона сферы: ресторан бронирует, а не «записывает». */
const BOOK: Partial<Record<InstantNiche, Partial<Record<InstantLocale, string>>>> = {
  mebel: { ru: "Заказать замер", uz: "O‘lchovga buyurtma" },
  restoran: { ru: "Забронировать", uz: "Stol band qilish", en: "Book a table", ar: "احجزوا طاولة", pl: "Zarezerwuj stolik" },
  turagentstvo: { ru: "Подобрать тур", uz: "Tur tanlash" },
  "uchebnyy-centr": { ru: "Записаться на курс", uz: "Kursga yozilish" },
  nedvizhimost: { ru: "Подобрать объект", uz: "Obyekt tanlash" },
  "salon-krasoty": { ru: "Записаться", uz: "Yozilish" },
  magazin: { ru: "В корзину", uz: "Savatga" },
  logistika: { ru: "Рассчитать доставку", uz: "Yetkazishni hisoblash" },
  stroitelstvo: { ru: "Рассчитать ремонт", uz: "Ta’mirni hisoblash" },
  uslugi: { ru: "Оставить заявку", uz: "Ariza qoldirish" },
  avtosalon: { ru: "Записаться на тест-драйв", uz: "Test-drayvga yozilish" },
};

/**
 * Вид мини-сайта — как у шаблона сферы (content/proto-instant/*-assets.json):
 * фон, текст, карточка, приглушённый, акцент по умолчанию и заголовки с
 * засечками или без. Цвет клиента, если нашёлся, заменяет акцент, как в
 * самом макете. Шрифты — только системные семейства: других Telegram не даёт.
 */
type Skin = { bg: string; fg: string; card: string; mute: string; accent: string; serif: boolean };
const SKIN: Record<InstantNiche, Skin> = {
  stomatologiya: { bg: "#f8f4ef", fg: "#2b1d33", card: "#fff", mute: "#b9aebb", accent: "#8d4a8b", serif: true },
  medcentr: { bg: "#f7f6fc", fg: "#19143f", card: "#fff", mute: "#b3b0cc", accent: "#312782", serif: false },
  mebel: { bg: "#121110", fg: "#f4efe7", card: "#24221f", mute: "#5e574d", accent: "#cf3d1c", serif: false },
  restoran: { bg: "#0c0908", fg: "#f5ede7", card: "#1d1613", mute: "#5a4a43", accent: "#d93a33", serif: true },
  turagentstvo: { bg: "#f6efe3", fg: "#0c2236", card: "#fffbf4", mute: "#b9c2c9", accent: "#f08a2c", serif: true },
  "uchebnyy-centr": { bg: "#f2f4fc", fg: "#0a0e33", card: "#fff", mute: "#b4b8d4", accent: "#1d22d8", serif: false },
  nedvizhimost: { bg: "#f9f7f3", fg: "#131f19", card: "#fff", mute: "#b9beb6", accent: "#4d6630", serif: false },
  "salon-krasoty": { bg: "#f7f2ec", fg: "#1a213b", card: "#fff", mute: "#bdb9c2", accent: "#dc4468", serif: true },
  magazin: { bg: "#f6f8f5", fg: "#0f1c15", card: "#fff", mute: "#c3d1c8", accent: "#00573a", serif: false },
  avtoservis: { bg: "#101217", fg: "#eef1f5", card: "#1a1d22", mute: "#5a606b", accent: "#d61f2c", serif: false },
  logistika: { bg: "#0c1329", fg: "#f4f6fc", card: "#16204a", mute: "#3a4570", accent: "#f08a24", serif: false },
  stroitelstvo: { bg: "#f2efe9", fg: "#141518", card: "#fbfaf7", mute: "#cfc9be", accent: "#d7262b", serif: false },
  uslugi: { bg: "#f5f2ea", fg: "#151a29", card: "#fffdf8", mute: "#b9bcc6", accent: "#161a28", serif: true },
  avtosalon: { bg: "#0b0c0e", fg: "#f3f4f6", card: "#1a1d22", mute: "#5c6068", accent: "#ec3237", serif: false },
};
/** Сфера не названа — мини-сайт в цветах чата. */
const PLAIN: Skin = {
  bg: "var(--tg-theme-secondary-bg-color)",
  fg: "var(--tg-theme-text-color)",
  card: "var(--tg-theme-bg-color)",
  mute: "var(--tg-theme-hint-color)",
  accent: "var(--tg-theme-button-color)",
  serif: false,
};

/** Высота окна мини-сайта: страница длиннее и прокручивается сама. */
const VIEW = 214;

/** Код виджета на языке клиента. Тексты шаблона — наши; данные клиента — только textContent. */
export function widgetHtml(locale: InstantLocale, niche?: InstantNiche): string {
  const l = { ...LABELS[locale], book: (niche && BOOK[niche]?.[locale]) || LABELS[locale].book };
  const k = (niche && SKIN[niche]) || PLAIN;
  const names = JSON.stringify(STEPS.map((s) => l[s]));
  const pop = "transition:transform .4s cubic-bezier(.3,1.5,.5,1)";
  return `<style>
.w{padding:12px 14px 14px;font:14px/1.35 system-ui,sans-serif;color:var(--tg-theme-text-color);--a:${k.accent}}
.t{font-weight:700;font-size:15px;margin:0 0 10px;display:flex;justify-content:space-between}
.t b{color:var(--tg-theme-hint-color);font-weight:400}
.br{border-radius:12px;overflow:hidden;border:1px solid var(--tg-theme-section-separator-color);margin:auto;max-width:100%;transition:max-width .5s cubic-bezier(.3,1,.4,1)}
.ph .br{max-width:158px;border-radius:20px}
.bb{display:flex;gap:5px;align-items:center;padding:6px 9px;background:var(--tg-theme-secondary-bg-color)}
.bb i{width:7px;height:7px;border-radius:50%;background:var(--tg-theme-hint-color);flex:none}
.ad{flex:1;height:16px;margin-left:5px;padding:0 8px;border-radius:8px;background:var(--tg-theme-bg-color);color:var(--tg-theme-hint-color);font-size:10px;line-height:16px;white-space:nowrap;overflow:hidden}
.vp{height:${VIEW}px;overflow:hidden;position:relative;background:${k.bg};color:${k.fg}}
.vp:after{content:"";position:absolute;top:0;left:0;width:40%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.4),transparent);transform:translateX(-110%)}
.ok .vp:after{transform:translateX(260%);transition:transform .9s ease-out}
.ok .br{box-shadow:0 0 0 2px var(--a)}
.pg{padding:10px;display:grid;grid-template-columns:minmax(0,1fr);gap:9px;transition:transform .55s cubic-bezier(.45,0,.2,1)}
.z{transform:scale(0);${pop}}
.z.on,.on>.z,.sv .on{transform:none}
.hd{display:flex;align-items:center;gap:7px;height:22px;font-size:12px}
.lg{width:20px;height:20px;border-radius:50%;background:var(--a);color:#fff;font:700 11px/20px system-ui;text-align:center;flex:none}
.nm{font-weight:700;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.nv{display:flex;gap:4px}
.nv i{width:16px;height:5px;border-radius:3px;background:${k.mute}}
.he{border-radius:10px;padding:12px;position:relative;overflow:hidden;background:${k.card};color:#fff}
.he:before{content:"";position:absolute;top:0;left:0;width:100%;height:100%;background:linear-gradient(135deg,transparent,rgba(0,0,0,.45)),var(--a);transform:scaleX(0);transform-origin:0 0;transition:transform .6s cubic-bezier(.6,0,.2,1)}
.he.pt:before{transform:none}
.he>*{position:relative}
.h1{display:block;font:700 18px/1.15 ${k.serif ? "serif" : "system-ui"};min-height:21px}
.h2{display:block;font-size:11px;margin:4px 0 9px;min-height:15px;color:rgba(255,255,255,.82)}
.bk{display:inline-block;padding:5px 12px;border-radius:99px;background:#fff;color:#111;font-weight:700;font-size:11px}
.ck{transform:scale(.88);transition:transform .15s}
.ty:after{content:"";display:inline-block;width:2px;height:.9em;margin-left:2px;vertical-align:-1px;background:currentColor;animation:b .6s steps(1) infinite}
@keyframes b{50%{background:transparent}}
.sv{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}
.ph .sv{grid-template-columns:minmax(0,1fr)}
.sv span{padding:7px 8px;border-radius:8px;background:${k.card};font-size:11px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transform:scale(0) rotate(-9deg);transform-origin:25% 45%;${pop}}
.sv b{display:block;font-weight:400;font-size:10px;color:var(--a);overflow:hidden;text-overflow:ellipsis}
.gl{display:grid;grid-template-columns:2fr 1fr 1fr;gap:6px;height:54px}
.gl i{border-radius:8px;background:linear-gradient(160deg,var(--a),${k.card} 140%)}
.gl i+i{background:${k.mute};transition-delay:.12s}
.gl i+i+i{background:linear-gradient(20deg,var(--a),${k.mute});transition-delay:.24s}
.fm{padding:10px;border-radius:10px;background:${k.card};display:grid;gap:6px;justify-items:start}
.fm i{height:15px;width:100%;border-radius:5px;background:${k.bg}}
.fm .bk{background:var(--a);color:#fff}
.ft{display:flex;flex-wrap:wrap;justify-content:space-between;gap:2px 8px;font-size:10px;padding-bottom:2px}
.rd{position:absolute;top:0;left:0;width:100%;height:100%;box-sizing:border-box;padding:12px;display:grid;gap:9px;align-content:start;background:${k.bg};transform-origin:0 0;transition:transform .5s cubic-bezier(.6,0,.2,1)}
.rd.on{transform:scaleY(0)}
.rd i{height:9px;border-radius:5px;background:${k.mute};transform-origin:0 0;animation:p 1.2s ease-in-out infinite}
.rd i+i{height:74px;animation:none}
.rd i+i+i{height:9px;width:70%;animation:p 1.2s .2s ease-in-out infinite}
.rd i+i+i+i{width:45%}
@keyframes p{50%{transform:scaleX(.72)}}
.rd u{position:absolute;left:0;top:0;width:100%;height:2px;background:var(--a);animation:s 1.5s ease-in-out infinite alternate}
@keyframes s{to{transform:translateY(${VIEW - 2}px)}}
.cu{position:absolute;left:0;top:0;width:13px;height:17px;transform:translate(340px,240px);transition:transform .38s cubic-bezier(.5,0,.2,1)}
.cu svg{display:block}
.st{margin-top:10px;display:flex;align-items:center;gap:8px}
.d{width:14px;height:14px;border-radius:50%;border:2px solid var(--tg-theme-button-color);border-top-color:transparent;animation:r .8s linear infinite;flex:none}
.ok .d{animation:none;border-color:var(--tg-theme-button-color);background:var(--tg-theme-button-color)}
.x .d{animation:none;border-color:var(--tg-theme-destructive-text-color)}
.x .rd *{animation:none}
@keyframes r{to{transform:rotate(360deg)}}
.bar{height:3px;border-radius:2px;background:var(--tg-theme-section-separator-color);margin-top:8px;overflow:hidden}
.bar i{display:block;height:3px;width:0;background:var(--tg-theme-button-color);transition:width .6s ease}
@media (prefers-reduced-motion:reduce){.rd *,.d,.ty:after{animation:none}}
</style>
<div class="w" id="w"${locale === "ar" ? ' dir="rtl"' : ""}><div class="t">${l.title}<b id="pc"></b></div>
<div class="br"><div class="bb"><i></i><i></i><i></i><span class="ad" id="ad"></span></div>
<div class="vp" id="vp"><div class="pg" id="pg">
<div class="hd"><span class="lg z" id="lg"></span><span class="nm" id="nm"></span><span class="nv" id="nv"><i class="z"></i><i class="z"></i><i class="z"></i></span></div>
<div class="he" id="he"><b class="h1" id="h1"></b><span class="h2" id="h2"></span><span class="bk z" id="bk">${l.book}</span></div>
<div class="sv" id="sv"></div>
<div class="gl" id="gl"><i class="z"></i><i class="z"></i><i class="z"></i></div>
<div class="fm z" id="fm"><i></i><i></i><span class="bk" id="b2">${l.book}</span></div>
<div class="ft" id="ft"><b id="f1"></b><span id="f2"></span></div>
</div><div class="rd" id="rd"><i style="width:38%"></i><i></i><i></i><i></i><u></u></div>
<span class="cu" id="cu"><svg viewBox="0 0 13 17"><path d="M1 1v13l3.5-3 2.6 5 2-1-2.6-5H11z" fill="#fff" stroke="#111" stroke-linejoin="round"/></svg></span></div></div>
<div class="st"><span class="d"></span><span id="sl"></span></div><div class="bar"><i id="p"></i></div></div>
<script>
var W=window.TelegramWidget,N=${names},F=${JSON.stringify(["", l.fail.site, l.fail.build])},D=document,$=function(i){return D.getElementById(i)},V=$('vp'),P=$('pg'),C=$('cu'),R=$('w'),L=N.length-1,M=matchMedia('(prefers-reduced-motion:reduce)').matches||st().k>=L,Q=M,i=0,B=0,X=0;
function st(){try{var s=JSON.parse(W&&W.chatData);if(s&&typeof s.k==='number')return s}catch(e){}return{k:0,f:0}}
function T(f,m){X||(Q?f():setTimeout(f,m))}
function on(e){e.className+=' on'}
function ty(e,t,c){t=t||'';if(Q){e.textContent=t;return c()}var a=Array.from(t),n=0;e.className+=' ty';(function k(){e.textContent=a.slice(0,n).join('');n++<a.length?setTimeout(k,Math.min(60,650/a.length)):(e.className=e.className.replace(' ty',''),c())})()}
function to(e,c){if(X)return;if(Q)return c();var r=e.getBoundingClientRect(),v=V.getBoundingClientRect();C.style.transform='translate('+(r.left-v.left+r.width*.3)+'px,'+(r.top-v.top+r.height*.5)+'px)';setTimeout(c,380)}
function sc(e,c){var r=e.getBoundingClientRect();P.style.transform='translateY(-'+Math.max(0,r.bottom-P.getBoundingClientRect().top+10-${VIEW})+'px)';T(c,560)}
var q=[function(s,d){ty($('ad'),s.u,d)},
function(s,d){on($('rd'));if(s.c)R.style.setProperty('--a',s.c);var n=s.n||'';$('lg').textContent=n.trim().charAt(0).toUpperCase();$('f1').textContent=n;s.u||($('ad').textContent=n);on($('lg'));ty($('nm'),n,function(){on($('nv'));to($('he'),function(){$('he').className+=' pt';T(d,600)})})},
function(s,d){ty($('h1'),s.n,function(){$('h2').textContent=s.g||'';to($('bk'),function(){on($('bk'));var r=s.r||[],k=[],n=0;(s.s||[]).forEach(function(t,j){var e=D.createElement('span');e.textContent=t;if(r[j]){var b=D.createElement('b');b.textContent=r[j];e.appendChild(b)}$('sv').appendChild(e);k.push(e)});sc($('sv'),function a(){var e=k[n++];e?to(e,function(){on(e);T(a,100)}):T(d,250)})})})},
function(s,d){$('f2').textContent=s.p||'';sc($('gl'),function(){on($('gl'));T(function(){sc($('ft'),function(){to($('fm'),function(){on($('fm'));T(function(){to($('b2'),function(){var b=$('b2');b.className+=' ck';T(function(){b.className='bk';T(d,300)},170)})},320)})})},520)})},
function(s,d){C.style.transform='';P.style.transform='';T(function(){R.className+=' ph';T(function(){R.className=R.className.replace(' ph','');T(d,560)},1150)},620)},
function(s,d){R.className+=' ok';d()}];
function nx(){var s=st(),k=Math.min(s.k,L),a=Math.min(i,k),pc=Math.round(a/L*100);
if(s.f){if(!X){X=1;R.className+=' x';C.style.transform=''}$('sl').textContent=F[s.f]||F[1];return}
$('sl').textContent=N[a];$('pc').textContent=pc+'%';$('p').style.width=pc+'%';
if(B||i>L||i>k)return;B=1;Q=M||k>i+1;q[i](s,function(){B=0;i++;nx()})}
if(W)W.onEvent('chatDataChanged',nx);nx();if(W&&W.ready)W.ready();
</script>`;
}
