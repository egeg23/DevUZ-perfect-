/**
 * Виджет хода сборки в боте — Telegram Bot API, sendWidget.
 *
 * Код виджета отправляется один раз и больше не меняется; бот двигает только
 * состояние (chat_data, editMessageWidgetData), виджет перерисовывается сам по
 * событию chatDataChanged. Шаги — настоящие этапы сборки
 * (lib/proto/instant/bot.ts зовёт `widgetState` после каждого), не анимация
 * на время.
 *
 * Пределы Telegram: код до 32 КБ и до 4 КБ после сжатия zlib, без сети,
 * картинки только data:, скрипт в QuickJS, шрифты системные. Состояние —
 * JSON до 1024 байт: {"k": номер текущего шага, "f": 1 — сборка не удалась}.
 */
import type { InstantLocale } from "@/lib/proto/instant/types";

export const STEPS = ["read", "brand", "services", "build", "check", "done"] as const;
export type BuildStep = (typeof STEPS)[number];

const LABELS: Record<InstantLocale, Record<BuildStep, string> & { title: string; fail: string }> = {
  ru: {
    title: "Собираем ваш макет",
    read: "Читаем сайт",
    brand: "Логотип и цвета",
    services: "Услуги и цены",
    build: "Собираем страницы",
    check: "Проверяем",
    done: "Готово",
    fail: "Не получилось, передали менеджеру",
  },
  uz: {
    title: "Maketingizni yig‘yapmiz",
    read: "Saytni o‘qiyapmiz",
    brand: "Logotip va ranglar",
    services: "Xizmatlar va narxlar",
    build: "Sahifalarni yig‘yapmiz",
    check: "Tekshiryapmiz",
    done: "Tayyor",
    fail: "Bo‘lmadi, menejerga topshirdik",
  },
};

/** Подпись под виджетом — запасной путь: её видит и клиент, у которого виджетов нет. */
export function stepCaption(locale: InstantLocale, step: BuildStep, failed = false): string {
  const l = LABELS[locale];
  if (failed) return `⚠️ ${l.fail}`;
  const at = STEPS.indexOf(step);
  return [
    `<b>${l.title}</b>`,
    ...STEPS.map((s, i) => `${i < at || step === "done" ? "✅" : i === at ? "⏳" : "▫️"} ${l[s]}`),
  ].join("\n");
}

export function widgetState(step: BuildStep, failed = false): string {
  return JSON.stringify({ k: STEPS.indexOf(step), f: failed ? 1 : 0 });
}

/** Код виджета на языке клиента. Тексты — наши, экранировать нечего. */
export function widgetHtml(locale: InstantLocale): string {
  const l = LABELS[locale];
  const names = JSON.stringify(STEPS.map((s) => l[s]));
  return `<style>
.w{padding:14px 16px 16px;font:15px/1.35 system-ui,sans-serif;color:var(--tg-theme-text-color)}
.t{font-weight:700;font-size:16px;margin:0 0 10px}
.r{display:flex;align-items:center;gap:10px;padding:5px 0;color:var(--tg-theme-hint-color)}
.r.on{color:var(--tg-theme-text-color);font-weight:700}
.r.ok{color:var(--tg-theme-text-color)}
.d{width:20px;height:20px;border-radius:50%;border:2px solid var(--tg-theme-hint-color);flex:none;box-sizing:border-box;display:flex;align-items:center;justify-content:center;font-size:12px;color:var(--tg-theme-button-text-color)}
.ok .d{background:var(--tg-theme-button-color);border-color:var(--tg-theme-button-color)}
.on .d{border-color:var(--tg-theme-button-color);border-top-color:transparent;animation:s .8s linear infinite}
@keyframes s{to{transform:rotate(360deg)}}
.b{height:4px;border-radius:2px;background:var(--tg-theme-secondary-bg-color);margin-top:12px;overflow:hidden}
.b i{display:block;height:4px;width:0;background:var(--tg-theme-button-color);transition:width .5s ease}
.f{color:var(--tg-theme-destructive-text-color);margin-top:10px;display:none}
.x .f{display:block}
@media (prefers-reduced-motion:reduce){.on .d{animation:none}.b i{transition:none}}
</style>
<div class="w" id="w"><div class="t">${l.title}</div><div id="l"></div><div class="b"><i id="p"></i></div><div class="f">${l.fail}</div></div>
<script>
var W=window.TelegramWidget,N=${names};
function st(){try{var s=JSON.parse(W&&W.chatData);if(s&&typeof s.k==='number')return s}catch(e){}return{k:0,f:0}}
function draw(){var s=st(),h='',last=N.length-1;for(var i=0;i<N.length;i++){var c=i<s.k||s.k===last?'ok':i===s.k&&!s.f?'on':'';h+='<div class="r '+c+'"><span class="d">'+(c==='ok'?'\\u2713':'')+'</span>'+N[i]+'</div>'}
document.getElementById('l').innerHTML=h;document.getElementById('p').style.width=Math.round(Math.min(s.k,last)/last*100)+'%';document.getElementById('w').className='w'+(s.f?' x':'');if(W&&W.ready)W.ready()}
if(W)W.onEvent('chatDataChanged',draw);
draw();
</script>`;
}
