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
 * Пределы Telegram: код до 32 КБ и до 4 КБ после сжатия zlib, без сети,
 * картинок нет вовсе, скрипт в QuickJS, шрифты системные. Состояние —
 * JSON до 1024 байт: {k: шаг, f: 1 — не удалось, n: название, c: цвет,
 * s: до четырёх услуг}. Пишет только бот, данные клиента виджет кладёт
 * через textContent.
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

export type WidgetInfo = { name?: string; color?: string | null; services?: string[] };

/** Состояние виджета: шаг и то, что уже узнали о клиенте. Всегда ≤ 1024 байт. */
export function widgetState(step: BuildStep, failed: BuildFail | false = false, info: WidgetInfo = {}): string {
  const cut = (s: string, n: number) => ([...s].length > n ? `${[...s].slice(0, n - 1).join("")}…` : s);
  const state: Record<string, unknown> = { k: STEPS.indexOf(step), f: failed === "site" ? 1 : failed === "build" ? 2 : 0 };
  if (info.name) state.n = cut(info.name, 40);
  if (info.color && /^#[0-9a-f]{6}$/i.test(info.color)) state.c = info.color.toLowerCase();
  if (info.services?.length) state.s = info.services.slice(0, 4).map((x) => cut(x, 34));
  let out = JSON.stringify(state);
  while (Buffer.byteLength(out) > 1024 && Array.isArray(state.s) && state.s.length) {
    (state.s as string[]).pop();
    out = JSON.stringify(state);
  }
  return out;
}

/** Код виджета на языке клиента. Тексты шаблона — наши; данные клиента — только textContent. */
/** Кнопка в мини-сайте виджета — как главная кнопка шаблона сферы: ресторан бронирует, а не «записывает». */
const BOOK: Partial<Record<InstantNiche, Record<InstantLocale, string>>> = {
  mebel: { ru: "Заказать замер", uz: "O‘lchovga buyurtma" },
  restoran: { ru: "Забронировать", uz: "Stol band qilish" },
  turagentstvo: { ru: "Подобрать тур", uz: "Tur tanlash" },
  "uchebnyy-centr": { ru: "Записаться на курс", uz: "Kursga yozilish" },
  nedvizhimost: { ru: "Подобрать объект", uz: "Obyekt tanlash" },
  "salon-krasoty": { ru: "Записаться", uz: "Yozilish" },
};

export function widgetHtml(locale: InstantLocale, niche?: InstantNiche): string {
  const l = { ...LABELS[locale], book: (niche && BOOK[niche]?.[locale]) || LABELS[locale].book };
  const names = JSON.stringify(STEPS.map((s) => l[s]));
  return `<style>
.w{padding:12px 14px 14px;font:14px/1.35 system-ui,sans-serif;color:var(--tg-theme-text-color);--a:var(--tg-theme-button-color)}
.t{font-weight:700;font-size:15px;margin:0 0 10px;display:flex;justify-content:space-between}
.t b{color:var(--tg-theme-hint-color);font-weight:400}
.br{border-radius:12px;overflow:hidden;background:var(--tg-theme-secondary-bg-color);border:1px solid var(--tg-theme-section-separator-color)}
.bb{display:flex;gap:5px;padding:7px 9px}
.bb i{width:7px;height:7px;border-radius:50%;background:var(--tg-theme-hint-color)}
.pg{padding:10px;display:grid;gap:8px;min-height:150px}
.hd{display:flex;align-items:center;gap:8px;height:22px}
.lg{width:18px;height:18px;border-radius:50%;background:var(--a);transform:scale(0);transition:transform .5s cubic-bezier(.3,1.6,.5,1)}
.nm{font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sk{height:9px;border-radius:5px;background:var(--tg-theme-hint-color);animation:p 1.2s ease-in-out infinite}
@keyframes p{50%{opacity:.35}}
.hero{border-radius:9px;padding:10px;background:var(--a);color:var(--tg-theme-button-text-color);transform:scaleY(0);transform-origin:0 0;transition:transform .5s ease}
.hero .sk{background:var(--tg-theme-button-text-color);margin-top:6px}
.sv{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.sv span{padding:6px 8px;border-radius:8px;background:var(--tg-theme-bg-color);font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transform:translateY(8px);opacity:0;transition:transform .4s,opacity .4s}
.sv span.on{transform:none;opacity:1}
.bk{justify-self:start;padding:6px 14px;border-radius:999px;background:var(--a);color:var(--tg-theme-button-text-color);font-weight:700;font-size:12px;transform:scale(0);transition:transform .45s cubic-bezier(.3,1.6,.5,1)}
.on1 .lg,.on3 .bk{transform:scale(1)}
.on2 .hero{transform:scaleY(1)}
.ok .br{box-shadow:0 0 0 2px var(--a)}
.st{margin-top:10px;display:flex;align-items:center;gap:8px}
.d{width:14px;height:14px;border-radius:50%;border:2px solid var(--a);border-top-color:transparent;animation:s .8s linear infinite;flex:none}
.ok .d{animation:none;border-color:var(--a);background:var(--a)}
.x .d{animation:none;border-color:var(--tg-theme-destructive-text-color)}
@keyframes s{to{transform:rotate(360deg)}}
.bar{height:3px;border-radius:2px;background:var(--tg-theme-section-separator-color);margin-top:8px;overflow:hidden}
.bar i{display:block;height:3px;width:0;background:var(--a);transition:width .6s ease}
@media (prefers-reduced-motion:reduce){.sk,.d{animation:none}}
</style>
<div class="w" id="w"><div class="t">${l.title}<b id="pc"></b></div>
<div class="br"><div class="bb"><i></i><i></i><i></i></div><div class="pg">
<div class="hd"><span class="lg"></span><span class="nm" id="nm"></span><span class="sk" id="ns" style="width:40%"></span></div>
<div class="hero"><div class="sk" style="width:70%"></div><div class="sk" style="width:45%"></div></div>
<div class="sv" id="sv"></div>
<span class="bk">${l.book}</span>
</div></div>
<div class="st"><span class="d"></span><span id="sl"></span></div><div class="bar"><i id="p"></i></div></div>
<script>
var W=window.TelegramWidget,N=${names},F=${JSON.stringify(["", l.fail.site, l.fail.build])},$=function(i){return document.getElementById(i)},shown=0,tm=0;
function st(){try{var s=JSON.parse(W&&W.chatData);if(s&&typeof s.k==='number')return s}catch(e){}return{k:0,f:0}}
function draw(){var s=st(),last=N.length-1,w=$('w'),c='w';
if(s.c)w.style.setProperty('--a',s.c);
if(s.k>=1)c+=' on1';if(s.k>=3)c+=' on2';if(s.k>=4)c+=' on3';if(s.k>=last)c+=' ok';if(s.f)c+=' x';w.className=c;
if(s.n){$('nm').textContent=s.n;$('ns').style.display='none'}
var sv=$('sv'),list=s.s||[];
while(sv.children.length<list.length){var e=document.createElement('span');e.textContent=list[sv.children.length];sv.appendChild(e)}
clearTimeout(tm);(function pop(){var k=sv.children;if(shown<k.length&&s.k>=2){k[shown].className='on';shown++;tm=setTimeout(pop,450)}})();
$('sl').textContent=s.f?F[s.f]||F[1]:N[Math.min(s.k,last)];var pc=Math.round(Math.min(s.k,last)/last*100);$('pc').textContent=pc+'%';$('p').style.width=pc+'%';
if(W&&W.ready)W.ready()}
if(W)W.onEvent('chatDataChanged',draw);
draw();
</script>`;
}
