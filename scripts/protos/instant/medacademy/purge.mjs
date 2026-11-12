// Стили макета MedAcademy B для шаблона «Учебный центр»: из собранных стилей
// витрины оставляет только то, чем пользуется шаблон.
//
// Макет живёт в другом репозитории (витрина, Next и Tailwind), поэтому его
// стили берутся собранными: файлы .css страницы
// cases.devuz.studio/medacademy/b. Скрипт собирает шаблон на нескольких
// примерах, выписывает классы разметки и оставляет правила только с ними,
// тему B и сброс Tailwind. Шрифты (@font-face) не берутся: шаблон
// подключает их сам. Запускать, когда поменялась разметка шаблона:
//
//   node --import ./tests/alias-hook.mjs --import ./tests/tsx-hook.mjs \
//     scripts/protos/instant/medacademy/purge.mjs <файлы .css витрины>
//   node scripts/protos/instant/medacademy-assets.mjs
//
// Пишет scripts/protos/instant/medacademy/style.css.
import { readFileSync, writeFileSync } from "node:fs";
import postcss from "postcss";
import { eduHtml } from "@/lib/proto/instant/edu";
import { EXAMPLE_EDU } from "../preview-data.mjs";

// Классы, которые ставит скрипт (client.js), в разметке их может не быть.
const BY_SCRIPT = ["is-in", "bg-ma-accent", "text-ma-accent-ink", "text-[#e5e4ee]", "hover:text-white", "ma-pop"];

const people = [
  { name: "Анна Петрова", role: "Английский язык" },
  { name: "Тимур Алиев", role: null },
];
const variants = [
  EXAMPLE_EDU,
  { ...EXAMPLE_EDU, locale: "uz", doctors: people, logo: "https://example.com/logo.png", color: null },
  { ...EXAMPLE_EDU, tagline: null, services: [{ name: "Химия", price: null }, { name: "Биология", price: "1" }, { name: "Физика", price: null }], doctors: people, photos: ["https://example.com/a.jpg"] },
  { ...EXAMPLE_EDU, services: Array.from({ length: 9 }, (_, i) => ({ name: `Курс ${i}`, price: null })), telegram: null, whatsapp: "998900000000" },
  { ...EXAMPLE_EDU, services: [], perks: [], telegram: null, instagram: null, address: null, hours: null, city: null },
];
const used = new Set(BY_SCRIPT);
for (const v of variants) {
  const html = eduHtml(v).replace(/<style[\s\S]*?<\/style>/g, "").replace(/<script[\s\S]*?<\/script>/g, "");
  for (const m of html.matchAll(/class="([^"]*)"/g)) for (const c of m[1].split(/\s+/)) if (c) used.add(c);
}

const unescape = (s) => s.replace(/\\([0-9a-f]{1,6}) ?/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/\\(.)/g, "$1");
const classesOf = (sel) => [...sel.matchAll(/\.((?:\\[0-9a-f]{1,6} ?|\\.|[\w-])+)/gi)].map((m) => unescape(m[1]));
// Без классов оставляем сброс Tailwind и тему мира B; остальное: чужие проекты витрины.
const BARE = /^(\*|html|body|:root|:host|::?[a-z-]+|h[1-6]|a|b|p|ol|ul|li|img|svg|video|canvas|button|input|select|textarea|table|hr|abbr|strong|small|sub|sup|code|kbd|samp|pre|summary|menu|progress|iframe|embed|object|audio|optgroup|label|legend|fieldset|dl|dd|blockquote|figure|\[hidden\]|\[data-ma\]|\[data-ma="?b"?\])/;
function keeps(sel) {
  const s = sel.trim();
  if (/\[data-ma="?[ac]"?\]|\[data-mv|\[data-ap|number-flow|\.dz-/.test(s)) return false;
  const cls = classesOf(s);
  if (cls.length) return cls.every((c) => used.has(c));
  return BARE.test(s) && !/\[data-(?!ma)/.test(s);
}

const out = postcss.root();
for (const file of process.argv.slice(2)) {
  const root = postcss.parse(readFileSync(file, "utf8"));
  root.walkAtRules("font-face", (r) => r.remove());
  root.walkRules((rule) => {
    if (rule.parent?.type === "atrule" && /keyframes$/.test(rule.parent.name)) return;
    const left = rule.selectors.filter(keeps);
    if (left.length) rule.selectors = left;
    else rule.remove();
  });
  const text = () => root.toString();
  // Кадры анимаций: только те, на которые ссылаются оставшиеся правила.
  root.walkAtRules(/keyframes$/, (r) => {
    const rest = text().replace(r.toString(), "");
    if (!new RegExp(`[\\s:,]${r.params}[\\s;,}]`).test(rest)) r.remove();
  });
  // Пустые обёртки.
  for (let pass = 0; pass < 4; pass += 1) root.walkAtRules((r) => { if (r.nodes && r.nodes.length === 0) r.remove(); });
  out.append(root.nodes);
}
const css = out.toString();
writeFileSync(new URL("./style.css", import.meta.url), `${css}\n`);
console.log(`style.css: ${css.length} знаков, классов в шаблоне ${used.size}`);
