/**
 * Шаблон «Стоматология» — лёгкая версия наших макетов Nek Dental Studio и
 * «Сияние Севера» (scripts/protos/nek, scripts/protos/syanie).
 *
 * От них — устройство и стиль: стеклянная шапка, которая прячется при
 * прокрутке и возвращается через 3 секунды, крупный заголовок с засечками,
 * карточки услуг с кнопкой записи, врачи, «как придёт запись», контакты,
 * кнопка под большим пальцем. Без сцены из кадров, роликов и панели: страница
 * собирается подстановкой строк за миллисекунды, на сервере без браузера.
 *
 * Ничего от прошлых клиентов: ни названий, ни телефонов, ни врачей, ни фото
 * (проверяет lib/proto/instant/check, «хвосты»). Фото — их собственные или
 * нейтральные фото ниши из public/protos/_niche/stomatologiya.
 *
 * Текст шаблона без цифр: каждое число на странице — из данных клиента
 * (lib/proto/instant/check, «числа»).
 */
import { dzIntroSolo } from "@/lib/proto/dz-video.mjs";
import { mockupTermsUrl } from "@/lib/proto/booking";
import { LIMITS, type InstantLocale, type InstantSite } from "@/lib/proto/instant/types";
import { brandColor, esc, handleOf, hexToHsl, imageUrl, telHref, waHref } from "@/lib/proto/instant/safe";

/** Нейтральные фото ниши: без людей и чужих брендов, сделаны один раз. */
export const DENTAL_PHOTOS = [
  "/protos/_niche/stomatologiya/n1.webp",
  "/protos/_niche/stomatologiya/n2.webp",
  "/protos/_niche/stomatologiya/n3.webp",
  "/protos/_niche/stomatologiya/n4.webp",
] as const;

const COPY = {
  ru: {
    kick: "Стоматология",
    nav: ["Услуги", "Врачи", "Контакты"],
    book: "Записаться",
    call: "Позвонить",
    svcKick: "Услуги",
    svcH: "С чем к нам <b>приходят</b>",
    ask: "Цену уточняйте при записи",
    bookThis: "Записаться",
    perksKick: "О клинике",
    perksH: "Почему выбирают <b>нас</b>",
    docKick: "Команда",
    docH: "Наши <b>врачи</b>",
    flowKick: "Запись с сайта",
    flowH: "Так запись придёт <b>вам в Telegram</b>",
    flowLead: "Пациент нажимает «Записаться», выбирает услугу и время. Клинике падает сообщение, отвечаете в один клик.",
    flow: ["Выбрал услугу", "Оставил номер", "Вам пришла заявка"],
    demo: "демо-данные",
    demoTitle: "Новая запись с сайта",
    demoRows: (svc: string) => [
      ["Пациент", "Мадина"],
      ["Услуга", svc],
      ["Район", "[[t:0]]"],
      ["Ориентир", "магазин «[[t:1]]»"],
    ],
    galKick: "Клиника",
    galH: "Как у нас <b>внутри</b>",
    galNote: "Фото с сайта клиники.",
    galStock: "Фото для примера: клиника добавит свои.",
    whereKick: "Контакты",
    whereH: "Ждём вас на <b>приём</b>",
    phone: "Телефон",
    addr: "Адрес",
    hours: "Часы работы",
    map: "Открыть на карте",
    write: "Написать",
    made: "Макет сайта собран DevUz Studio по данным:",
    rights: "Макет принадлежит DevUz Studio и используется только по договору. Подробно:",
    terms: "условия использования",
    skip: "К содержанию",
    title: (name: string) => `${name}: стоматология`,
    desc: (name: string) => `${name}. Услуги, врачи и запись на приём.`,
    greet: (name: string) => `Здравствуйте! Хочу записаться в «${name}». Подскажите свободное время?`,
  },
  uz: {
    kick: "Stomatologiya",
    nav: ["Xizmatlar", "Shifokorlar", "Kontaktlar"],
    book: "Yozilish",
    call: "Qo‘ng‘iroq",
    svcKick: "Xizmatlar",
    svcH: "Bizga nima bilan <b>kelishadi</b>",
    ask: "Narxini yozilishda aniqlang",
    bookThis: "Yozilish",
    perksKick: "Klinika haqida",
    perksH: "Nega <b>bizni</b> tanlashadi",
    docKick: "Jamoa",
    docH: "Bizning <b>shifokorlar</b>",
    flowKick: "Saytdan yozilish",
    flowH: "Yozuv sizga <b>Telegramda</b> shunday keladi",
    flowLead: "Bemor «Yozilish»ni bosadi, xizmat va vaqtni tanlaydi. Klinikaga xabar keladi, bir bosishda javob berasiz.",
    flow: ["Xizmatni tanladi", "Raqamini qoldirdi", "Sizga ariza keldi"],
    demo: "demo-ma’lumot",
    demoTitle: "Saytdan yangi yozuv",
    demoRows: (svc: string) => [
      ["Bemor", "Madina"],
      ["Xizmat", svc],
      ["Mahalla", "[[t:0]]"],
      ["Mo‘ljal", "«[[t:1]]» do‘koni"],
    ],
    galKick: "Klinika",
    galH: "Klinika <b>ichida</b>",
    galNote: "Rasmlar klinika saytidan.",
    galStock: "Rasmlar namuna uchun: klinika o‘zinikini qo‘yadi.",
    whereKick: "Kontaktlar",
    whereH: "Sizni <b>qabulda</b> kutamiz",
    phone: "Telefon",
    addr: "Manzil",
    hours: "Ish vaqti",
    map: "Xaritada ochish",
    write: "Yozish",
    made: "Sayt maketini DevUz Studio quyidagi ma’lumotlar asosida yig‘di:",
    rights: "Maket DevUz Studio’ga tegishli va faqat shartnoma asosida ishlatiladi. Batafsil:",
    terms: "foydalanish shartlari",
    skip: "Mazmunga o‘tish",
    title: (name: string) => `${name}: stomatologiya`,
    desc: (name: string) => `${name}. Xizmatlar, shifokorlar va qabulga yozilish.`,
    greet: (name: string) => `Assalomu alaykum! «${name}» ga yozilmoqchiman. Qaysi vaqt bo‘sh?`,
  },
} as const;

const ICON = {
  phone: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.6a1 1 0 0 1-.25 1z" fill="currentColor"/></svg>`,
  cal: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 2v3M17 2v3M3.5 9h17M5 5h14a1.5 1.5 0 0 1 1.5 1.5v12A1.5 1.5 0 0 1 19 20H5a1.5 1.5 0 0 1-1.5-1.5v-12A1.5 1.5 0 0 1 5 5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  pin: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="9.5" r="2.4" fill="currentColor"/></svg>`,
  clock: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 7.5V12l3 2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  tooth: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3c1.6 0 2.5.8 4 .8S14.4 3 16 3c2.6 0 4 2.1 4 4.6 0 2.8-1.2 4.6-1.7 7.4-.4 2.6-.9 6-2.6 6-1.6 0-1.8-4.4-3.7-4.4S10 21 8.3 21C6.6 21 6.1 17.6 5.7 15 5.2 12.2 4 10.4 4 7.6 4 5.1 5.4 3 8 3z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>`,
  check: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  arrow: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  tg: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21.5 4.2 2.9 11.4c-1 .4-1 1.5 0 1.8l4.7 1.5 1.8 5.6c.2.7 1.1.9 1.6.4l2.6-2.4 4.9 3.6c.6.4 1.4.1 1.6-.6l3-15.3c.2-.9-.7-1.6-1.6-1.3zM9.6 14.4l8.4-7.5-6.6 8.6-.3 3.3z" fill="currentColor"/></svg>`,
};

/** Действие главной кнопки: Telegram → WhatsApp → звонок. */
function mainHref(site: InstantSite, greet: string): string | null {
  const tg = handleOf(site.telegram);
  if (tg) return `https://t.me/${tg}?text=${encodeURIComponent(greet)}`;
  const wa = waHref(site.whatsapp);
  if (wa) return `${wa}?text=${encodeURIComponent(greet)}`;
  return telHref(site.phone);
}

/** Две буквы названия: знак, если логотип не нашёлся. */
function initials(name: string): string {
  const words = name.replace(/["«»'`]/g, " ").split(/\s+/).filter((w) => /\p{L}/u.test(w));
  return (words.slice(0, 2).map((w) => [...w][0]?.toUpperCase() ?? "").join("") || [...name][0] || "").slice(0, 2);
}

/** Палитра от фирменного цвета: кнопка остаётся читаемой с белыми буквами. */
function palette(color: string | null): string {
  const hex = brandColor(color);
  const [h, s0, l0] = hex ? hexToHsl(hex) : [186, 59, 28];
  const s = Math.min(Math.max(s0, 24), 78);
  const l = Math.min(Math.max(l0, 26), 44);
  return [
    `--ac:hsl(${h} ${s}% ${l}%)`,
    `--ac-d:hsl(${h} ${s}% ${Math.max(l - 9, 16)}%)`,
    `--ac-l:hsl(${h} ${Math.min(s, 60)}% 93%)`,
    `--ink:hsl(${h} 24% 14%)`,
    `--ink2:hsl(${h} 14% 30%)`,
    `--mu:hsl(${h} 8% 42%)`,
    `--paper:hsl(${h} 30% 98%)`,
    `--s2:hsl(${h} 24% 94%)`,
  ].join(";");
}

const CSS = `*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;overflow-x:clip;scroll-behavior:smooth}
body{margin:0;background:var(--paper);color:var(--ink);font:400 16px/1.6 "Manrope",system-ui,-apple-system,"Segoe UI",sans-serif;overflow-x:clip}
img{max-width:100%;height:auto;display:block}
a{color:inherit}
h1,h2,h3{margin:0;font-family:"Cormorant",Georgia,"Times New Roman",serif;font-weight:700;line-height:1.08;letter-spacing:-.01em}
.vh{position:absolute!important;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.vh:focus{position:fixed!important;left:16px;top:16px;width:auto;height:auto;clip:auto;z-index:99;padding:8px 16px;background:#fff;border-radius:999px}
.wrap{width:min(1200px,100% - 32px);margin:0 auto}
.sec{padding:clamp(64px,10vw,120px) 0}
.soft{background:var(--s2)}
.dark{background:var(--ink);color:#f4f1ee}
.dark .lead,.dark .mu{color:rgb(244 241 238/.74)}
.kick{display:inline-flex;align-items:center;gap:12px;margin:0 0 16px;font-size:14px;letter-spacing:.14em;text-transform:uppercase;color:var(--ac)}
.dark .kick{color:var(--ac-l)}
.kick i{width:28px;height:1px;background:currentColor}
.h2{font-size:clamp(36px,5vw,64px);max-width:18ch}
.h2 b{color:var(--ac);font-style:italic}
.dark .h2 b{color:var(--ac-l)}
.lead{font-size:18px;color:var(--ink2);max-width:56ch;margin:22px 0 0}
.mu{color:var(--mu)}
.small{font-size:14px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:48px;padding:12px 22px;border-radius:999px;border:1px solid transparent;font:700 16px/1.2 "Manrope",system-ui,sans-serif;text-decoration:none;cursor:pointer;transition:transform .25s,background-color .25s;white-space:nowrap}
.btn svg{width:20px;height:20px;flex:none}
.btn:active{transform:scale(.97)}
.btn-a{background:var(--ac);color:#fff}
.btn-a:hover{background:var(--ac-d)}
.btn-l{border-color:currentColor}
.btn-s{min-height:44px;padding:8px 16px;font-size:14px}
:focus-visible{outline:2px solid var(--ac);outline-offset:3px}
.glass{background:rgb(255 255 255/.7);border:1px solid rgb(255 255 255/.7);box-shadow:0 2px 8px rgb(0 0 0/.05),0 12px 32px rgb(0 0 0/.07)}
@supports (backdrop-filter:blur(1px)){.glass{backdrop-filter:blur(18px) saturate(1.4);-webkit-backdrop-filter:blur(18px) saturate(1.4)}}
.top{position:fixed;left:0;right:0;top:0;z-index:40;padding:12px 0 0;transition:transform .45s cubic-bezier(.2,.8,.2,1),opacity .35s}
.top.hide{transform:translateY(-130%);opacity:0;pointer-events:none}
.top-in{width:min(1200px,100% - 24px);margin:0 auto;display:flex;align-items:center;gap:16px;padding:8px 8px 8px 14px;border-radius:999px}
.logo{display:inline-flex;align-items:center;gap:10px;text-decoration:none;min-width:0}
.logo img{height:34px;width:auto;max-width:150px;object-fit:contain}
.logo b{font:700 16px/1.1 "Manrope",system-ui,sans-serif;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:46vw}
.mk{display:inline-grid;place-items:center;width:36px;height:36px;border-radius:50%;background:var(--ac);color:#fff;font:700 14px/1 "Manrope",system-ui,sans-serif;letter-spacing:.02em;flex:none}
.nav{display:none;gap:24px;margin:0 auto}
.nav a{text-decoration:none;font-size:14px;opacity:.8}
.nav a:hover{opacity:1}
.top .btn{margin-left:auto}
@media(min-width:960px){.nav{display:flex}.top .btn{margin-left:0}}
.hero{padding:132px 0 72px;background:linear-gradient(180deg,var(--paper) 0,var(--s2) 100%);overflow:hidden}
.hero-in{display:grid;gap:40px;align-items:center}
@media(min-width:960px){.hero-in{grid-template-columns:1.05fr .95fr}}
.hero h1{font-size:clamp(44px,7vw,88px);max-width:13ch;overflow-wrap:anywhere}
.hero h1 em{font-style:italic;color:var(--ac)}
.hsub{font-size:18px;color:var(--ink2);max-width:52ch;margin:22px 0 0}
.hact{display:flex;flex-wrap:wrap;gap:12px;margin:30px 0 0}
.hfacts{list-style:none;padding:0;margin:30px 0 0;display:grid;gap:10px;font-size:15px;color:var(--ink2)}
.hfacts li{display:flex;gap:10px;align-items:flex-start}
.hfacts svg{width:20px;height:20px;flex:none;color:var(--ac);margin-top:2px}
.hph{position:relative;border-radius:28px;overflow:hidden;aspect-ratio:4/5;background:var(--s2);box-shadow:0 24px 64px rgb(0 0 0/.16)}
.hph img{width:100%;height:100%;object-fit:cover}
.hcard{position:absolute;left:16px;right:16px;bottom:16px;display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:18px;font-size:14px}
.hcard svg{width:28px;height:28px;color:var(--ac);flex:none}
.svc{display:grid;gap:16px;margin:40px 0 0}
@media(min-width:700px){.svc{grid-template-columns:repeat(2,1fr)}}
@media(min-width:1040px){.svc{grid-template-columns:repeat(3,1fr)}}
.sv{display:flex;flex-direction:column;gap:12px;padding:24px;border-radius:22px;background:#fff;border:1px solid rgb(0 0 0/.06);transition:transform .3s,box-shadow .3s}
.sv:hover{transform:translateY(-4px);box-shadow:0 18px 40px rgb(0 0 0/.08)}
.sv-i{display:inline-grid;place-items:center;width:46px;height:46px;border-radius:14px;background:var(--ac-l);color:var(--ac)}
.sv-i svg{width:24px;height:24px}
.sv h3{font-size:26px;line-height:1.15;overflow-wrap:anywhere}
.sv-p{margin:auto 0 0;font-weight:700;font-size:18px;color:var(--ac-d)}
.sv-p.q{font-weight:400;font-size:14px;color:var(--mu)}
.sv-b{display:inline-flex;align-items:center;gap:8px;align-self:flex-start;padding:0;border:0;background:none;font:700 15px/1.4 "Manrope",system-ui,sans-serif;color:var(--ac);text-decoration:none;cursor:pointer}
.sv-b svg{width:18px;height:18px;transition:transform .25s}
.sv-b:hover svg{transform:translateX(4px)}
.perks{list-style:none;padding:0;margin:40px 0 0;display:grid;gap:14px}
@media(min-width:800px){.perks{grid-template-columns:repeat(2,1fr)}}
.perks li{display:flex;gap:14px;align-items:flex-start;padding:20px;border-radius:18px;background:rgb(255 255 255/.06);border:1px solid rgb(255 255 255/.12)}
.perks svg{width:24px;height:24px;flex:none;color:var(--ac-l)}
.team{display:grid;gap:16px;margin:40px 0 0;grid-template-columns:repeat(auto-fill,minmax(220px,1fr))}
.tm{display:flex;flex-direction:column;gap:8px;padding:22px;border-radius:20px;background:#fff;border:1px solid rgb(0 0 0/.06)}
.av{display:grid;place-items:center;width:64px;height:64px;border-radius:50%;background:var(--ac-l);color:var(--ac-d);font:700 22px/1 "Cormorant",Georgia,serif;margin-bottom:6px}
.tm b{font-size:18px;line-height:1.3}
.tm span{color:var(--mu);font-size:14px}
.flow{display:grid;gap:40px;align-items:center}
@media(min-width:960px){.flow{grid-template-columns:1fr 1fr}}
.steps{list-style:none;padding:0;margin:28px 0 0;display:grid;gap:12px}
.steps li{display:flex;gap:14px;align-items:center;font-size:17px}
.n{display:inline-grid;place-items:center;width:36px;height:36px;border-radius:50%;background:var(--ac);color:#fff;font-weight:700;font-size:14px;flex:none}
.tgc{max-width:420px;margin:0 auto;width:100%;border-radius:24px;padding:20px;background:#fff;color:var(--ink);box-shadow:0 24px 64px rgb(0 0 0/.18)}
.tgc-h{display:flex;align-items:center;gap:10px;font-weight:700}
.tgc-h svg{width:28px;height:28px;color:#2aa3df}
.tgc-h small{margin-left:auto;font-weight:400;font-size:12px;color:var(--mu);padding:4px 10px;border-radius:999px;background:var(--s2)}
.tgc dl{display:grid;grid-template-columns:auto 1fr;gap:8px 14px;margin:16px 0 0;font-size:15px}
.tgc dt{color:var(--mu)}
.tgc dd{margin:0;font-weight:700;overflow-wrap:anywhere}
.tgc-b{display:flex;gap:8px;margin:16px 0 0}
.tgc-b span{flex:1;text-align:center;padding:10px;border-radius:12px;background:var(--ac-l);color:var(--ac-d);font-weight:700;font-size:14px}
.gal{display:grid;gap:14px;margin:40px 0 18px;grid-template-columns:repeat(auto-fit,minmax(240px,1fr))}
.gal img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:20px;background:var(--s2)}
.where{display:grid;gap:16px;margin:40px 0 0;grid-template-columns:repeat(auto-fit,minmax(240px,1fr))}
.wc{display:flex;flex-direction:column;gap:8px;padding:24px;border-radius:20px;background:#fff;border:1px solid rgb(0 0 0/.06)}
.wc svg{width:24px;height:24px;color:var(--ac)}
.wc span{color:var(--mu);font-size:14px}
.wc b,.wc a{font-size:18px;overflow-wrap:anywhere}
.wact{display:flex;flex-wrap:wrap;gap:12px;margin:28px 0 0}
footer{padding:32px 0 112px;border-top:1px solid rgb(0 0 0/.08);color:var(--mu);font-size:14px}
footer .wrap{display:flex;flex-wrap:wrap;gap:8px 24px}
footer a{text-decoration:underline}
.dock{position:fixed;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom));z-index:30;display:flex;gap:8px}
.dock .btn{flex:1}
@media(min-width:960px){.dock{display:none}footer{padding-bottom:40px}}
.rise{opacity:0;transform:translateY(24px);transition:opacity .8s cubic-bezier(.2,.8,.2,1),transform .8s cubic-bezier(.2,.8,.2,1)}
.rise.on{opacity:1;transform:none}
@media (prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}.rise{opacity:1;transform:none;transition:none}.top{transition:none}.sv,.sv-b svg{transition:none}}`;

/*
 * Шапка: при любой прокрутке прячется сразу, возвращается через 3 секунды
 * после последнего события (CLAUDE.md «Шапка макета»). Фокус внутри шапки —
 * не прячется. Появление блоков — по пересечению с экраном.
 */
const JS = `(function(){var top=document.querySelector('.top'),t=0;
function show(){top.classList.remove('hide')}
addEventListener('scroll',function(){if(top.contains(document.activeElement)&&document.activeElement!==document.body)return;if(scrollY>40)top.classList.add('hide');clearTimeout(t);t=setTimeout(show,3000)},{passive:true});
top.addEventListener('focusin',show);
var els=document.querySelectorAll('.rise');
if(!('IntersectionObserver' in window)){for(var i=0;i<els.length;i++)els[i].classList.add('on');return}
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('on');io.unobserve(e.target)}})},{threshold:/*~*/0.12,rootMargin:'0px 0px -6% 0px'});
for(var j=0;j<els.length;j++)io.observe(els[j]);
})()`;

const LOCALE_TAG: Record<InstantLocale, string> = { ru: "ru", uz: "uz" };

/** Собрать страницу. Данные — уже очищенные (lib/proto/instant/normalize). */
export function dentalHtml(site: InstantSite): string {
  const c = COPY[site.locale];
  const name = esc(site.name);
  const book = mainHref(site, c.greet(site.name));
  const tel = telHref(site.phone);
  const tg = handleOf(site.telegram);
  const wa = waHref(site.whatsapp);
  const ig = handleOf(site.instagram);
  const logo = imageUrl(site.logo);
  const own = site.photos.map(imageUrl).filter((u): u is string => Boolean(u)).slice(0, LIMITS.photos);
  const photos = own.length ? own : [...DENTAL_PHOTOS];
  const bookBtn = (cls: string, label: string) =>
    book ? `<a class="btn btn-a ${cls}" href="${esc(book)}" rel="noopener">${ICON.cal}<span>${esc(label)}</span></a>` : "";
  const callBtn = (cls: string) =>
    tel ? `<a class="btn btn-l ${cls}" href="${esc(tel)}">${ICON.phone}<span>${esc(c.call)}</span></a>` : "";

  const mark = logo
    ? `<img src="${esc(logo)}" alt="${name}" referrerpolicy="no-referrer">`
    : `<span class="mk" aria-hidden="true">${esc(initials(site.name))}</span>`;
  const services = site.services.slice(0, LIMITS.services);
  const doctors = site.doctors.slice(0, LIMITS.doctors);
  const perks = site.perks.slice(0, LIMITS.perks);
  const nav = [
    services.length ? `<a href="#services">${esc(c.nav[0])}</a>` : "",
    doctors.length ? `<a href="#team">${esc(c.nav[1])}</a>` : "",
    `<a href="#where">${esc(c.nav[2])}</a>`,
  ].join("");

  const header = `<header class="top"><div class="top-in glass">
<a class="logo" href="#top" aria-label="${name}">${mark}${logo ? "" : `<b>${name}</b>`}</a>
<nav class="nav" aria-label="${esc(c.nav.join(", "))}">${nav}</nav>
${bookBtn("btn-s", c.book)}
</div></header>`;

  const hfacts = [
    site.address ? `<li>${ICON.pin}<span>${esc(site.address)}</span></li>` : "",
    site.hours ? `<li>${ICON.clock}<span>${esc(site.hours)}</span></li>` : "",
  ].join("");
  const hero = `<section class="hero" id="top" aria-label="${name}"><div class="wrap hero-in">
<div>
<p class="kick"><i></i>${esc(site.city ? `${c.kick} · ${site.city}` : c.kick)}</p>
<h1>${name}${site.tagline ? `<br><em>${esc(site.tagline)}</em>` : ""}</h1>
${site.about ? `<p class="hsub">${esc(site.about)}</p>` : ""}
<div class="hact">${bookBtn("", c.book)}${callBtn("")}</div>
${hfacts ? `<ul class="hfacts">${hfacts}</ul>` : ""}
</div>
<div class="hph"><img src="${esc(photos[0])}" width="1200" height="1500" alt="${name}" fetchpriority="high" referrerpolicy="no-referrer">
${services[0] ? `<div class="hcard glass">${ICON.tooth}<span>${esc(services[0].name)}</span></div>` : ""}</div>
</div></section>`;

  const svcSec = services.length
    ? `<section class="sec" id="services"><div class="wrap">
<p class="kick rise"><i></i>${esc(c.svcKick)}</p>
<h2 class="h2 rise">${c.svcH}</h2>
<div class="svc">${services
        .map(
          (s) =>
            `<article class="sv rise"><span class="sv-i">${ICON.tooth}</span><h3>${esc(s.name)}</h3>${
              s.price ? `<p class="sv-p">${esc(s.price)}</p>` : `<p class="sv-p q">${esc(c.ask)}</p>`
            }${book ? `<a class="sv-b" href="${esc(book)}" rel="noopener">${esc(c.bookThis)}${ICON.arrow}</a>` : ""}</article>`,
        )
        .join("")}</div>
</div></section>`
    : "";

  const perkSec = perks.length
    ? `<section class="sec dark" id="about"><div class="wrap">
<p class="kick rise"><i></i>${esc(c.perksKick)}</p>
<h2 class="h2 rise">${c.perksH}</h2>
<ul class="perks">${perks.map((p) => `<li class="rise">${ICON.check}<span>${esc(p)}</span></li>`).join("")}</ul>
</div></section>`
    : "";

  const teamSec = doctors.length
    ? `<section class="sec" id="team"><div class="wrap">
<p class="kick rise"><i></i>${esc(c.docKick)}</p>
<h2 class="h2 rise">${c.docH}</h2>
<div class="team">${doctors
        .map(
          (d) =>
            `<div class="tm rise"><span class="av" aria-hidden="true">${esc(initials(d.name))}</span><b>${esc(d.name)}</b>${
              d.role ? `<span>${esc(d.role)}</span>` : ""
            }</div>`,
        )
        .join("")}</div>
</div></section>`
    : "";

  const demoSvc = services[0]?.name ?? c.kick;
  const flowSec = `<section class="sec soft" id="flow"><div class="wrap flow">
<div><p class="kick rise"><i></i>${esc(c.flowKick)}</p>
<h2 class="h2 rise">${c.flowH}</h2>
<p class="lead rise">${esc(c.flowLead)}</p>
<ol class="steps">${c.flow.map((s, i) => `<li class="rise"><span class="n">0${i + 1}</span>${esc(s)}</li>`).join("")}</ol></div>
<div class="tgc rise" aria-label="${esc(c.demo)}"><div class="tgc-h">${ICON.tg}<span>${esc(c.demoTitle)}</span><small>${esc(c.demo)}</small></div>
<dl>${c.demoRows(demoSvc).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl>
<div class="tgc-b"><span>${esc(c.book)}</span><span>${esc(c.call)}</span></div></div>
</div></section>`;

  const galSec = photos.length > 1
    ? `<section class="sec" id="clinic"><div class="wrap">
<p class="kick rise"><i></i>${esc(c.galKick)}</p>
<h2 class="h2 rise">${c.galH}</h2>
<div class="gal">${photos
        .slice(1)
        .map((p) => `<img class="rise" src="${esc(p)}" width="1200" height="900" alt="${name}" loading="lazy" referrerpolicy="no-referrer">`)
        .join("")}</div>
<p class="mu small">${esc(own.length ? c.galNote : c.galStock)}</p>
</div></section>`
    : "";

  const cards = [
    tel ? `<div class="wc rise">${ICON.phone}<span>${esc(c.phone)}</span><a href="${esc(tel)}">${esc(site.phone ?? "")}</a></div>` : "",
    site.address ? `<div class="wc rise">${ICON.pin}<span>${esc(c.addr)}</span><b>${esc(site.address)}</b></div>` : "",
    site.hours ? `<div class="wc rise">${ICON.clock}<span>${esc(c.hours)}</span><b>${esc(site.hours)}</b></div>` : "",
  ].join("");
  const links = [
    tg ? `<a class="btn btn-a" href="https://t.me/${esc(tg)}" rel="noopener">${ICON.tg}<span>Telegram</span></a>` : "",
    wa ? `<a class="btn btn-l" href="${esc(wa)}" rel="noopener"><span>WhatsApp</span></a>` : "",
    ig ? `<a class="btn btn-l" href="https://instagram.com/${esc(ig)}" rel="noopener"><span>Instagram</span></a>` : "",
    site.address
      ? `<a class="btn btn-l" href="https://yandex.uz/maps/?text=${esc(encodeURIComponent(site.address))}" rel="noopener">${ICON.pin}<span>${esc(c.map)}</span></a>`
      : "",
  ].join("");
  const whereSec = `<section class="sec soft" id="where"><div class="wrap">
<p class="kick rise"><i></i>${esc(c.whereKick)}</p>
<h2 class="h2 rise">${c.whereH}</h2>
${cards ? `<div class="where">${cards}</div>` : ""}
${links ? `<div class="wact">${links}</div>` : ""}
</div></section>`;

  const footer = `<footer><div class="wrap">
<span>${name}</span>
<span>${esc(c.made)} ${esc(site.source)}</span>
<span>${esc(c.rights)} <a href="${esc(mockupTermsUrl(site.locale))}">${esc(c.terms)}</a></span>
</div></footer>`;

  const dock = book || tel ? `<div class="dock">${bookBtn("", c.book)}${book ? "" : callBtn("")}</div>` : "";

  return `<!doctype html>
<html lang="${LOCALE_TAG[site.locale]}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow">
<title>${esc(c.title(site.name))}</title>
<meta name="description" content="${esc(c.desc(site.name))}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,700;1,700&family=Manrope:wght@400;700&display=swap">
<style>:root{${palette(site.color)};--r:18px}
${CSS}</style>
</head>
<body>
${dzIntroSolo(site.locale)}
<a class="vh" href="#services">${esc(c.skip)}</a>
${header}
<main>
${hero}
${svcSec}
${perkSec}
${teamSec}
${flowSec}
${galSec}
${whereSec}
</main>
${footer}
${dock}
<script>${JS}</script>
</body>
</html>`;
}
