/**
 * Пролёт по прокрутке для шаблонов «Макета в боте», у которых своей сцены в
 * исходном макете нет: ресторан, мебель, турагентство (владелец, 11.11.2026:
 * «Давай по остальным тоже продукты сделаем нейтральные»).
 *
 * Движок — сцена первой страницы Nek (`nekAssets().scene`), стили — те же, что
 * у медцентра (`shox-assets.json`, `fly`), кадры — свои у ниши
 * (`scripts/protos/instant/scene.py`, только шифром). Здесь только разметка:
 * главы словами клиента и последняя глава — его название крупно в кадре.
 */
import nek from "@/content/proto-instant/nek-assets.json" with { type: "json" };
import shox from "@/content/proto-instant/shox-assets.json" with { type: "json" };
import { esc } from "@/lib/proto/instant/safe";
import { PROTO_BASE } from "@/lib/proto/pages";
import type { InstantLocale } from "@/lib/proto/instant/types";

/*
 * У шаблонов свои .hs, .cp, .calm и .kick (у мебели первый экран — тоже «.hs»),
 * поэтому сцена живёт под своими именами: стили и движок переименованы здесь.
 */
const rename = (css: string) =>
  css
    .replace(/\.hs(?![\w])/g, ".fz")
    .replace(/\.cp(?![\w])/g, ".fzc")
    .replace(/\.calm(?![\w-])/g, ".fzcalm")
    .replace(/\.kick(?![\w-])/g, ".fzk");
const FLY_CSS = rename(shox.fly);
const SCENE_JS = nek.scene.replace("$('.hs')", "$('.fz')").replace(/\$\$\('\.cp',/g, "$$$$('.fzc',");
if (!SCENE_JS.includes("$('.fz')") || !SCENE_JS.includes("$$('.fzc',")) throw new Error("сцена Nek изменилась: не нашлись .hs и .cp");

export type FlyMedia = { n: number; vn: number; fps: number };
export type FlyChapter = { at: number; a: string; b: string };

const T = {
  kick: { ru: "Макет DevUz Studio", uz: "DevUz Studio maketi" },
  see: { ru: "Смотреть сайт", uz: "Saytni ko‘rish" },
  note: { ru: "Кадры для примера: на сайте будут ваши фото.", uz: "Kadrlar namuna uchun: saytda sizning rasmlaringiz bo‘ladi." },
  scroll: { ru: "Листайте", uz: "Aylantiring" },
};

const ARROW = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`;

export type FlyOptions = {
  locale: InstantLocale;
  /** Папка кадров ниши: /protos/_niche/<ниша>. */
  img: string;
  media: FlyMedia;
  /** Подпись сцены для читалок. */
  label: string;
  /** Пять глав; последняя — название клиента, стоит в кадре до конца. */
  chapters: FlyChapter[];
  /** Где стоит последняя глава: по центру тёмного кадра или в верхней половине. */
  fin: "center" | "top";
  /** Табличка над дверью первого кадра (имя и знак клиента), уже экранированная. */
  sign?: string;
  /** Класс кнопки шаблона и его шрифты и цвет. */
  btn: string;
  accent: string;
  hd: string;
  tx: string;
  /** Якорь первого экрана шаблона: туда ведёт «Смотреть сайт». */
  to: string;
};

/** Сцена есть, только когда кадры ниши сняты: до этого шаблон идёт без пролёта. */
export const flyReady = (media: FlyMedia) => media.n > 1;

export function flyParts(o: FlyOptions): { section: string; css: string; script: string } {
  if (!flyReady(o.media)) return { section: "", css: "", script: "" };
  const t = (p: { ru: string; uz: string }) => p[o.locale];
  const last = o.chapters.length - 1;
  const pic = (k: number, lazy: boolean) =>
    `<picture><source media="(max-width: 899px)" srcset="${o.img}/k${k}-9.webp"><img src="${o.img}/k${k}-16.webp" width="1600" height="893" alt=""${lazy ? ' loading="lazy"' : ""}></picture>`;
  const section = `<section class="fz im-fly" id="fly" aria-label="${esc(o.label)}"><div class="fz-st">
<picture><source media="(max-width: 899px)" srcset="${o.img}/poster-9.webp"><img class="fz-a" src="${o.img}/poster-16.webp" width="1920" height="1080" alt="" fetchpriority="high"></picture>
<canvas aria-hidden="true"></canvas>
<video muted playsinline preload="none" disablepictureinpicture aria-hidden="true"></video>
<div class="fz-shade" aria-hidden="true"></div>
${o.sign ? `<div class="fz-sign" aria-hidden="true">${o.sign}</div>` : ""}
<div class="fz-ch">${o.chapters
    .map((c, i) =>
      i === 0
        ? `<div class="fzc first" data-cp="0"><span class="fzk"><i></i>${t(T.kick)}</span><h1>${esc(c.a)} <em>${esc(c.b)}</em></h1></div>`
        : i === last
          ? `<div class="fzc fin fin-${o.fin}" data-cp="${i}"><p class="fzc-h">${esc(c.a)}</p>${c.b ? `<span class="fin-sub">${esc(c.b)}</span>` : ""}</div>`
          : `<div class="fzc" data-cp="${i}"><span class="fzk"><i></i><span class="n">0${i + 1}</span></span><p class="fzc-h">${esc(c.a)} <em>${esc(c.b)}</em></p></div>`,
    )
    .join("")}</div>
<div class="fz-end"><a class="${o.btn}" href="#${o.to}">${t(T.see)}${ARROW}</a><small>${t(T.note)}</small></div>
<div class="fz-load" id="hs-load" aria-hidden="true"><span id="hs-n">0</span>%<i id="hs-b"></i></div>
<div class="fz-hint" aria-hidden="true"><span>${t(T.scroll)}</span><i></i></div>
</div></section>
<section class="fzcalm im-fly" aria-label="${esc(o.label)}"><div class="wrap">${o.chapters.map((c, i) => `<figure>${pic(i + 1, i > 0)}<figcaption>${esc(c.a)} ${esc(c.b)}</figcaption></figure>`).join("")}</div></section>`;
  const css = `<style>.im-fly{--ink:#0b0b0d;--ink-rgb:11 11 13;--peach:${o.accent};--hd:${o.hd};--tx:${o.tx};--r:16px}
${FLY_CSS}
.fz{padding:0;margin:0;max-width:none}
.fz h1,.fz .fzc-h{color:#fff;margin:0;font-family:var(--hd);line-height:1.06;letter-spacing:0;text-transform:none}
.fz h1{font-weight:700}
.fz .fzk{display:inline-flex;align-items:center;gap:12px;margin:0 0 16px;font:600 14px/1 var(--tx);letter-spacing:.14em;text-transform:uppercase}
.fz .fzk i{width:28px;height:1px;background:currentColor}
.fz-end a{display:inline-flex;align-items:center;gap:8px}
.fz-sign{position:absolute;left:50%;top:15%;transform:translateX(-50%);display:flex;align-items:center;gap:12px;color:#fff;font:700 clamp(16px,2vw,30px)/1 var(--hd);letter-spacing:.06em;white-space:nowrap;text-shadow:0 2px 18px rgb(0 0 0/.6);transition:opacity .5s,transform .8s;pointer-events:none}
.fz-sign img{height:clamp(24px,3vw,44px);width:auto}
.fz.moved .fz-sign{opacity:0;transform:translateX(-50%) scale(1.15)}
.fzc.fin{left:16px;right:16px;max-width:none;bottom:auto;top:50%;text-align:center;transform:translateY(calc(-50% + (1 - var(--o,0)) * 28px))}
.fz.end .fzc.fin{transform:translateY(calc(-50% + (1 - var(--o,0)) * 28px))}
.fzc.fin .fzc-h{font-size:clamp(40px,8vw,112px);overflow-wrap:anywhere;text-shadow:0 4px 40px rgb(0 0 0/.55)}
.fz h1,.fz .fzc-h{text-shadow:0 2px 24px rgb(0 0 0/.55)}
.fz h1 em,.fz .fzc-h em{color:color-mix(in srgb,var(--peach) 60%,#fff)}
.fzc.fin-top{top:27%}
.fz .fzc.fin-top .fzc-h{color:#1f1b17;text-shadow:0 1px 0 rgb(255 255 255/.5)}
.fzc.fin-top .fzc-h{font-size:clamp(34px,6vw,84px)}
.fin-sub{display:block;margin-top:16px;font:600 clamp(14px,1.4vw,18px)/1.3 var(--tx);letter-spacing:.16em;text-transform:uppercase;color:var(--peach)}
@media(max-width:899px){.fz-sign{top:25%;font-size:18px}.fzc.fin-top{top:24%}}
@media(prefers-reduced-motion:reduce){.fz{display:none}.fzcalm{display:block}}</style>`;
  const land = { root: PROTO_BASE, img: o.img, n: o.media.n, vn: o.media.vn, fps: o.media.fps, ch: o.chapters.map((c) => ({ at: c.at })) };
  const script = `<script type="application/json" id="im-land">${JSON.stringify(land).replace(/</g, "\\u003c")}</script>\n<script>\n${SCENE_JS}</script>`;
  return { section, css, script };
}
