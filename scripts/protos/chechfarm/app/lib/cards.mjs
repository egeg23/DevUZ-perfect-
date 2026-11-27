/* Электронные визитки сотрудников: страница /card/<адрес>, на неё ведёт QR с
   бумажной визитки. Всё кодом, без модели: сотрудник заполняет поля в панели,
   выбирает фон, анимацию и цвет из готовых, после «Сохранить» страница сразу
   открывается по адресу. Страница без скриптов: анимации только CSS
   (transform и opacity), при «меньше движения» стоят. */

export const CARD_LANGS = ["ru", "uz", "en", "ar"];

/* Фоны. light — тёмный текст на светлом. */
export const THEMES = {
  emerald: { name: "Изумруд", light: false, bg: "#04100f", g1: "rgb(11 90 83 / .62)", g2: "rgb(25 36 107 / .5)" },
  night: { name: "Ночь", light: false, bg: "#060a1c", g1: "rgb(48 66 190 / .5)", g2: "rgb(122 54 170 / .38)" },
  graphite: { name: "Графит", light: false, bg: "#0f1113", g1: "rgb(120 128 140 / .22)", g2: "rgb(60 66 76 / .35)" },
  bordeaux: { name: "Бордо", light: false, bg: "#14060a", g1: "rgb(150 22 40 / .45)", g2: "rgb(90 40 20 / .4)" },
  ivory: { name: "Слоновая кость", light: true, bg: "#f4efe4", g1: "rgb(217 180 106 / .35)", g2: "rgb(11 90 83 / .14)" },
  pearl: { name: "Жемчуг", light: true, bg: "#eef3f2", g1: "rgb(18 165 143 / .2)", g2: "rgb(47 107 255 / .14)" },
  photo: { name: "Своё фото", light: false, bg: "#04100f", g1: "rgb(0 0 0 / 0)", g2: "rgb(0 0 0 / 0)" },
};
export const ANIMS = {
  none: "Без анимации",
  drift: "Плывущее свечение",
  eagle: "Орёл CZECHFARM",
  molecules: "Молекулы",
  waves: "Волны от фото",
  shine: "Блик по карточке",
};
export const ACCENTS = {
  red: { name: "Красный CZECHFARM", c: "#f61116", on: "#fff" },
  gold: { name: "Золото", c: "#d9b46a", on: "#1b1406" },
  emerald: { name: "Изумруд", c: "#12a58f", on: "#fff" },
  blue: { name: "Синий", c: "#2f6bff", on: "#fff" },
  violet: { name: "Фиолетовый", c: "#7c4dff", on: "#fff" },
  silver: { name: "Серебро", c: "#c9d1d6", on: "#10161a" },
};

const T = {
  ru: { call: "Позвонить", site: "Перейти на сайт", save: "Сохранить контакт", mail: "Написать", tg: "Telegram", wa: "WhatsApp", phone: "Телефон", email: "Почта", addr: "Адрес", about: "О себе", gone: "Визитка больше не действует", goneP: "Свяжитесь с компанией через сайт.", home: "Сайт компании" },
  uz: { call: "Qo‘ng‘iroq qilish", site: "Saytga o‘tish", save: "Kontaktni saqlash", mail: "Yozish", tg: "Telegram", wa: "WhatsApp", phone: "Telefon", email: "Pochta", addr: "Manzil", about: "O‘zim haqimda", gone: "Vizitka endi ishlamaydi", goneP: "Kompaniya bilan sayt orqali bog‘laning.", home: "Kompaniya sayti" },
  en: { call: "Call", site: "Visit website", save: "Save contact", mail: "Email", tg: "Telegram", wa: "WhatsApp", phone: "Phone", email: "Email", addr: "Address", about: "About", gone: "This card is no longer active", goneP: "Please contact the company through its website.", home: "Company website" },
  ar: { call: "اتصال", site: "زيارة الموقع", save: "حفظ جهة الاتصال", mail: "مراسلة", tg: "تيليغرام", wa: "واتساب", phone: "الهاتف", email: "البريد", addr: "العنوان", about: "نبذة", gone: "هذه البطاقة لم تعد فعالة", goneP: "يرجى التواصل مع الشركة عبر موقعها.", home: "موقع الشركة" },
};

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const line = (s, max) => String(s ?? "").replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
const text = (s, max) => String(s ?? "").replace(/\r\n?/g, "\n").replace(/[\u0000-\u0009\u000b-\u001f\u007f]+/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, max);

/* Адрес визитки: латиница, цифры и дефис, 3–40 знаков. */
const TR = { а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya", ў: "o", қ: "q", ғ: "g", ҳ: "h" };
export const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,38})[a-z0-9]$/;
export function slugify(s) {
  const out = String(s || "").toLowerCase().replace(/[‘’ʻʼ`']/g, "").split("").map((ch) => (ch in TR ? TR[ch] : ch)).join("")
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").replace(/-{2,}/g, "-").slice(0, 40).replace(/-+$/, "");
  return out.length >= 3 ? out : "";
}

/* Телефон для ссылки tel: — только «+» и цифры. */
export function telHref(p) { const d = String(p || "").replace(/[^\d+]/g, "").replace(/(?!^)\+/g, ""); return d.replace(/\D/g, "").length >= 5 ? d : ""; }
function webUrl(u) {
  let s = line(u, 300); if (!s) return "";
  if (!/^https?:\/\//i.test(s)) s = "https://" + s.replace(/^\/+/, "");
  try { const x = new URL(s); return /^https?:$/.test(x.protocol) && x.hostname.includes(".") ? x.href : ""; } catch { return ""; }
}
function tgUrl(v) {
  const s = line(v, 120); if (!s) return "";
  const m = /^(?:https?:\/\/)?(?:t\.me|telegram\.me)\/([A-Za-z0-9_]{4,32})\/?$/i.exec(s) || /^@?([A-Za-z0-9_]{4,32})$/.exec(s);
  return m ? "https://t.me/" + m[1] : "";
}
function waUrl(v) { const d = String(v || "").replace(/\D/g, ""); return d.length >= 7 && d.length <= 15 ? "https://wa.me/" + d : ""; }
function mailOk(v) { const s = line(v, 120); return /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(s) ? s : ""; }
const upl = (u) => (/^\/uploads\/[0-9a-f]{32}\.(jpg|png|webp)$/.test(String(u || "")) ? u : "");

/* Значение доп. поля: ссылка, почта или телефон становятся нажимаемыми. */
function extraHref(v) {
  if (/^https?:\/\//i.test(v)) return webUrl(v);
  if (mailOk(v)) return "mailto:" + v;
  if (/^\+?[\d\s()-]{7,}$/.test(v)) return telHref(v) ? "tel:" + telHref(v) : "";
  return "";
}

/* Проверка и чистка того, что пришло из панели. Ошибка — текстом для человека. */
export function normCard(b, { site = "" } = {}) {
  const d = {
    lang: CARD_LANGS.includes(b?.lang) ? b.lang : "ru",
    name: line(b?.name, 80), title: line(b?.title, 100), company: line(b?.company, 80) || "CZECHFARM Alliance",
    phones: (Array.isArray(b?.phones) ? b.phones : []).map((p) => ({ label: line(p?.label, 30), value: line(p?.value, 30) })).filter((p) => p.value).slice(0, 3),
    email: line(b?.email, 120), site: line(b?.site, 300) || site, tg: line(b?.tg, 120), wa: line(b?.wa, 30),
    address: line(b?.address, 200), about: text(b?.about, 500),
    extra: (Array.isArray(b?.extra) ? b.extra : []).map((x) => ({ label: line(x?.label, 40), value: line(x?.value, 200) })).filter((x) => x.label && x.value).slice(0, 6),
    photo: upl(b?.photo), bg: upl(b?.bg),
    theme: b?.theme in THEMES ? b.theme : "emerald", anim: b?.anim in ANIMS ? b.anim : "drift", accent: b?.accent in ACCENTS ? b.accent : "red",
    logo: b?.logo !== false,
  };
  if (!d.name) throw new Error("Впишите имя на визитке");
  for (const p of d.phones) if (!telHref(p.value)) throw new Error(`Телефон «${p.value}» не похож на номер: нужны цифры, можно с «+»`);
  if (d.email && !mailOk(d.email)) throw new Error("Почта не похожа на адрес, проверьте");
  if (d.site && !webUrl(d.site)) throw new Error("Адрес сайта не открывается как ссылка, проверьте");
  if (d.tg && !tgUrl(d.tg)) throw new Error("Telegram: впишите @ник или ссылку t.me/ник");
  if (d.wa && !waUrl(d.wa)) throw new Error("WhatsApp: впишите номер цифрами");
  if (d.theme === "photo" && !d.bg) throw new Error("Для фона «Своё фото» загрузите фото фона");
  if (!d.phones.length && !d.email && !d.tg && !d.wa) throw new Error("Добавьте хотя бы один способ связи: телефон, почту, Telegram или WhatsApp");
  return d;
}

/* vCard 3.0 — «Сохранить контакт» в телефоне. */
const vEsc = (s) => String(s ?? "").replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([,;])/g, "\\$1");
export function vcard(d, { url = "", photoUrl = "" } = {}) {
  const parts = d.name.split(" "), last = parts.length > 1 ? parts.slice(-1)[0] : "", first = parts.length > 1 ? parts.slice(0, -1).join(" ") : d.name;
  const L = ["BEGIN:VCARD", "VERSION:3.0", `N:${vEsc(last)};${vEsc(first)};;;`, `FN:${vEsc(d.name)}`];
  if (d.company) L.push(`ORG:${vEsc(d.company)}`);
  if (d.title) L.push(`TITLE:${vEsc(d.title)}`);
  d.phones.forEach((p, i) => L.push(`TEL;TYPE=${i ? "WORK" : "CELL"},VOICE:${telHref(p.value)}`));
  if (d.email) L.push(`EMAIL;TYPE=INTERNET:${d.email}`);
  if (d.site) L.push(`URL:${webUrl(d.site)}`);
  if (url) L.push(`URL:${url}`);
  if (d.address) L.push(`ADR;TYPE=WORK:;;${vEsc(d.address)};;;;`);
  if (photoUrl) L.push(`PHOTO;VALUE=URI:${photoUrl}`);
  if (d.about) L.push(`NOTE:${vEsc(d.about)}`);
  L.push("END:VCARD");
  return L.join("\r\n") + "\r\n";
}

const IC = {
  call: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
  site: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.7 5.6 3.7 9s-1.2 6.4-3.7 9c-2.5-2.6-3.7-5.6-3.7-9S9.5 5.6 12 3z"/>',
  save: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  tg: '<path d="M21 4L3 11l6 2 2 6 3-4 5 4z"/><path d="M9 13l9-7"/>',
  wa: '<path d="M4 20l1.3-4A8 8 0 1 1 8 18.7z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 1a4 4 0 0 1-2-2l1-1-1-2z"/>',
  addr: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  dot: '<circle cx="12" cy="12" r="3"/>',
};
const ic = (k) => `<svg viewBox="0 0 24 24" aria-hidden="true">${IC[k] || IC.dot}</svg>`;

function initials(name) { return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase(); }

/* Страница визитки. abs(u) — полный адрес для превью в мессенджерах. */
export function cardHtml(d, { slug = "", abs = (u) => u, eagle = "/admin/eagle.svg" } = {}) {
  const L = T[d.lang] || T.ru, th = THEMES[d.theme] || THEMES.emerald, ac = ACCENTS[d.accent] || ACCENTS.red, rtl = d.lang === "ar";
  const main = d.phones[0], site = webUrl(d.site), tg = tgUrl(d.tg), wa = waUrl(d.wa), mail = mailOk(d.email);
  const fg = th.light ? "#10201e" : "#f3f7f6", mut = th.light ? "rgb(16 32 30 / .62)" : "rgb(243 247 246 / .66)";
  const glass = th.light ? "rgb(255 255 255 / .62)" : "rgb(10 24 24 / .5)", lineC = th.light ? "rgb(16 32 30 / .12)" : "rgb(255 255 255 / .13)";
  const bgImg = d.theme === "photo" && d.bg ? `url("${esc(d.bg)}")` : "none";
  const title = [d.name, d.title, d.company].filter(Boolean).join(" · ");
  const desc = [d.title, d.company].filter(Boolean).join(", ");
  const btn2 = [site ? `<a class="b2" href="${esc(site)}" target="_blank" rel="noopener">${ic("site")}<span>${L.site}</span></a>` : "", slug ? `<a class="b2" href="/card/${esc(slug)}.vcf">${ic("save")}<span>${L.save}</span></a>` : ""].filter(Boolean);
  const chips = [tg ? `<a class="ch" href="${esc(tg)}" target="_blank" rel="noopener" aria-label="${L.tg}">${ic("tg")}</a>` : "", wa ? `<a class="ch" href="${esc(wa)}" target="_blank" rel="noopener" aria-label="${L.wa}">${ic("wa")}</a>` : "", mail ? `<a class="ch" href="mailto:${esc(mail)}" aria-label="${L.mail}">${ic("mail")}</a>` : ""].filter(Boolean);
  const rows = [
    ...d.phones.map((p) => `<a class="row" href="tel:${esc(telHref(p.value))}">${ic("call")}<span><small>${esc(p.label || L.phone)}</small><b dir="ltr">${esc(p.value)}</b></span></a>`),
    mail ? `<a class="row" href="mailto:${esc(mail)}">${ic("mail")}<span><small>${L.email}</small><b dir="ltr">${esc(mail)}</b></span></a>` : "",
    d.address ? `<a class="row" href="https://www.google.com/maps/search/?api=1&amp;query=${encodeURIComponent(d.address)}" target="_blank" rel="noopener">${ic("addr")}<span><small>${L.addr}</small><b>${esc(d.address)}</b></span></a>` : "",
    ...d.extra.map((x) => { const href = extraHref(x.value); const inner = `${ic("dot")}<span><small>${esc(x.label)}</small><b>${esc(x.value)}</b></span>`; return href ? `<a class="row" href="${esc(href)}"${/^https?:/.test(href) ? ' target="_blank" rel="noopener"' : ""}>${inner}</a>` : `<div class="row">${inner}</div>`; }),
  ].filter(Boolean);
  const dots = d.anim === "molecules" ? `<div class="mol">${Array.from({ length: 16 }, (_, i) => `<i style="--x:${(i * 37) % 100}%;--s:${6 + ((i * 5) % 12)}px;--t:${14 + ((i * 7) % 13)}s;--d:-${(i * 3) % 17}s"></i>`).join("")}</div>` : "";
  const av = d.photo ? `<img src="${esc(d.photo)}" alt="${esc(d.name)}" width="120" height="120">` : `<span>${esc(initials(d.name))}</span>`;

  return `<!doctype html><html lang="${d.lang}"${rtl ? ' dir="rtl"' : ""}><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow"><title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><meta name="theme-color" content="${th.bg}">
<meta property="og:type" content="profile"><meta property="og:title" content="${esc(d.name)}"><meta property="og:description" content="${esc(desc)}">${d.photo ? `<meta property="og:image" content="${esc(abs(d.photo))}">` : ""}
<link rel="icon" href="/protos/chechfarm/icon.svg"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Literata:opsz,wght@7..72,400;7..72,600&family=Onest:wght@400;500;600&display=swap">
<style>
:root{--bg:${th.bg};--g1:${th.g1};--g2:${th.g2};--fg:${fg};--mut:${mut};--glass:${glass};--line:${lineC};--ac:${ac.c};--on:${ac.on};--img:${bgImg}}
*{box-sizing:border-box}html,body{margin:0}body{min-height:100vh;min-height:100svh;font:16px/1.5 Onest,system-ui,-apple-system,"Segoe UI",sans-serif;color:var(--fg);background:var(--bg);overflow-x:hidden;-webkit-font-smoothing:antialiased}
.bg{position:fixed;inset:0;overflow:hidden;pointer-events:none}.bg::before,.bg::after{content:"";position:absolute;width:90vmax;height:90vmax;border-radius:50%;filter:blur(60px)}
.bg::before{left:-35vmax;top:-40vmax;background:radial-gradient(closest-side,var(--g1),transparent)}.bg::after{right:-40vmax;bottom:-45vmax;background:radial-gradient(closest-side,var(--g2),transparent)}
.ph{position:absolute;inset:-4%;background:var(--img) center/cover no-repeat;transform:scale(1.04)}.ph::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgb(0 0 0/.35),rgb(0 0 0/.6))}
.eg{position:absolute;left:50%;top:46%;width:min(118vmin,980px);translate:-50% -50%;opacity:${th.light ? ".07" : ".09"}}
.mol i{position:absolute;left:var(--x);bottom:-20px;width:var(--s);height:var(--s);border-radius:50%;background:var(--ac);opacity:0;box-shadow:0 0 18px var(--ac)}
main{position:relative;min-height:100vh;min-height:100svh;display:grid;place-items:center;padding:max(28px,env(safe-area-inset-top)) 16px max(28px,env(safe-area-inset-bottom))}
.card{position:relative;width:100%;max-width:440px;padding:34px 24px 22px;border:1px solid var(--line);border-radius:30px;background:var(--glass);-webkit-backdrop-filter:blur(26px) saturate(1.3);backdrop-filter:blur(26px) saturate(1.3);box-shadow:0 30px 70px rgb(0 0 0/${th.light ? ".12" : ".38"});overflow:hidden;animation:up .8s cubic-bezier(.2,.8,.2,1) both}
.top{display:grid;justify-items:center;text-align:center;gap:6px}
.av{position:relative;width:120px;height:120px;margin-bottom:12px}.av>img,.av>span{position:relative;z-index:1;width:120px;height:120px;border-radius:50%;object-fit:cover;display:grid;place-items:center;border:3px solid var(--ac);background:var(--glass);font:600 40px/1 Literata,Georgia,serif;color:var(--fg)}
.av b{position:absolute;inset:0;border-radius:50%;border:2px solid var(--ac);opacity:0}
h1{margin:0;font:600 clamp(26px,7vw,32px)/1.15 Literata,Georgia,serif;letter-spacing:-.01em}.ttl{margin:0;color:var(--mut);font-size:16px}
.co{display:inline-flex;align-items:center;gap:8px;margin-top:6px;font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:var(--mut)}.co img{width:22px;height:22px}
.cta{display:flex;align-items:center;justify-content:center;gap:10px;margin:24px 0 10px;padding:16px;border-radius:999px;background:var(--ac);color:var(--on);font-weight:600;font-size:17px;text-decoration:none;box-shadow:0 14px 30px -10px var(--ac)}
.cta svg,.b2 svg,.ch svg,.row svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;flex:none}
.b2s{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}.b2{display:flex;align-items:center;justify-content:center;gap:8px;padding:13px 12px;border-radius:999px;border:1px solid var(--line);color:var(--fg);text-decoration:none;font-weight:500;font-size:15px;background:rgb(255 255 255/${th.light ? ".5" : ".05"})}
.chs{display:flex;justify-content:center;gap:12px;margin-top:16px}.ch{width:48px;height:48px;display:grid;place-items:center;border-radius:50%;border:1px solid var(--line);color:var(--fg);background:rgb(255 255 255/${th.light ? ".5" : ".05"})}
.rows{display:grid;gap:2px;margin-top:22px;border-top:1px solid var(--line);padding-top:14px}.row{display:flex;align-items:center;gap:14px;padding:10px 6px;border-radius:14px;color:var(--fg);text-decoration:none}.row svg{color:var(--ac)}.row span{display:grid;min-width:0}.row small{color:var(--mut);font-size:12px}.row b{font-weight:500;overflow-wrap:anywhere}a.row:hover,.b2:hover,.ch:hover{background:rgb(127 127 127/.12)}
.ab{margin:16px 6px 0;color:var(--mut);font-size:15px;white-space:pre-line}.ft{margin-top:20px;text-align:center;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--mut)}.ft a{color:inherit}
a:focus-visible{outline:2px solid var(--ac);outline-offset:3px}
@keyframes up{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
@keyframes drA{to{transform:translate(18vmax,14vmax) scale(1.1)}}@keyframes drB{to{transform:translate(-16vmax,-12vmax) scale(1.15)}}
@keyframes eg{0%,100%{transform:scale(1) rotate(-2deg);opacity:.8}50%{transform:scale(1.06) rotate(2deg);opacity:1}}
@keyframes mol{0%{transform:translateY(0);opacity:0}10%{opacity:.55}90%{opacity:.4}100%{transform:translateY(-110vh);opacity:0}}
@keyframes wv{0%{transform:scale(1);opacity:.7}100%{transform:scale(1.9);opacity:0}}
@keyframes sh{0%,70%{transform:translateX(-120%) skewX(-18deg)}100%{transform:translateX(320%) skewX(-18deg)}}
.a-drift .bg::before{animation:drA 18s ease-in-out infinite alternate}.a-drift .bg::after{animation:drB 22s ease-in-out infinite alternate}
.a-eagle .eg{animation:eg 9s ease-in-out infinite}
.a-molecules .mol i{animation:mol var(--t) linear var(--d) infinite}
.a-waves .av b{animation:wv 3s ease-out infinite}.a-waves .av b:nth-of-type(2){animation-delay:1s}.a-waves .av b:nth-of-type(3){animation-delay:2s}
.a-shine .card::after{content:"";position:absolute;top:0;bottom:0;left:0;width:40%;background:linear-gradient(90deg,transparent,rgb(255 255 255/${th.light ? ".55" : ".14"}),transparent);animation:sh 6s ease-in-out infinite;pointer-events:none}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important}.mol{display:none}}
</style></head><body class="a-${d.anim}">
<div class="bg" aria-hidden="true">${d.theme === "photo" && d.bg ? '<div class="ph"></div>' : ""}${d.anim === "eagle" ? `<img class="eg" src="${eagle}" alt="">` : ""}${dots}</div>
<main><article class="card"><div class="top"><div class="av">${av}<b></b><b></b><b></b></div><h1>${esc(d.name)}</h1>${d.title ? `<p class="ttl">${esc(d.title)}</p>` : ""}<p class="co">${d.logo ? `<img src="${eagle}" alt="">` : ""}${esc(d.company)}</p></div>
${main ? `<a class="cta" href="tel:${esc(telHref(main.value))}">${ic("call")}<span>${L.call}</span></a>` : ""}${btn2.length ? `<div class="b2s">${btn2.join("")}</div>` : ""}${chips.length ? `<div class="chs">${chips.join("")}</div>` : ""}
${rows.length ? `<div class="rows">${rows.join("")}</div>` : ""}${d.about ? `<p class="ab">${esc(d.about)}</p>` : ""}
${site ? `<p class="ft"><a href="${esc(site)}" target="_blank" rel="noopener">${esc(new URL(site).hostname.replace(/^www\./, ""))}</a></p>` : ""}</article></main></body></html>`;
}

export function goneHtml(lang, site) {
  const L = T[lang] || T.ru;
  return `<!doctype html><html lang="${lang}"${lang === "ar" ? ' dir="rtl"' : ""}><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${L.gone}</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;font:16px/1.5 system-ui,sans-serif;background:#04100f;color:#f1f7f5;text-align:center;padding:16px}a{color:#e5c98f}</style></head><body><main><img src="/admin/eagle.svg" alt="" width="64" height="64"><h1>${L.gone}</h1><p>${L.goneP}</p>${site ? `<p><a href="${esc(site)}">${L.home}</a></p>` : ""}</main></body></html>`;
}

/* Хранение: таблица cards. Менеджер правит свои, руководитель и владелец — любые. */
export function makeCards({ db, note, now = () => Date.now(), publicUrl = "" }) {
  const site = publicUrl || "https://czechfarm.org";
  const row = (r) => r && { id: r.id, slug: r.slug, data: JSON.parse(r.data), user_id: r.user_id, owner: r.owner || "", off: !!r.off, views: r.views, last_view: r.last_view, created_at: r.created_at, at: r.at, url: `${site}/card/${r.slug}` };
  const SEL = "select c.*, u.name as owner from cards c left join users u on u.id = c.user_id";
  const may = (user, c) => { if (user.role === "manager" && c.user_id !== user.id) throw Object.assign(new Error("Эту визитку правит её автор, руководитель или владелец"), { code: 403 }); };
  function freeSlug(base, id = 0) {
    let s = base, i = 2;
    while (db.get("select id from cards where slug = ? and id != ?", s, id)) s = `${base.slice(0, 36)}-${i++}`;
    return s;
  }
  return {
    site,
    list: () => db.all(SEL + " order by c.at desc").map(row),
    get: (id) => row(db.get(SEL + " where c.id = ?", id)),
    bySlug: (slug) => row(db.get(SEL + " where c.slug = ?", slug)),
    slugFor(base, id = 0) { const b = slugify(base); return b ? freeSlug(b, id) : ""; },
    save(user, id, b) {
      const d = normCard(b, { site });
      if (id) {
        const c = row(db.get(SEL + " where c.id = ?", id)); if (!c) throw new Error("Нет такой визитки");
        may(user, c);
        db.run("update cards set data = ?, at = ? where id = ?", JSON.stringify(d), now(), id);
        note(user.name, `Визитка «${d.name}» изменена`);
        return id;
      }
      /* Адрес выбирается при создании и больше не меняется: он напечатан в QR. */
      let slug = String(b?.slug || "").trim().toLowerCase();
      if (slug && !SLUG_RE.test(slug)) throw new Error("Адрес визитки: латиница, цифры и дефис, от 3 до 40 знаков");
      if (!slug) slug = slugify(d.name) || "card-" + now().toString(36);
      if (db.get("select id from cards where slug = ?", slug)) throw new Error(`Адрес «${slug}» уже занят, выберите другой`);
      const t = now();
      const r = db.run("insert into cards(slug, data, user_id, created_at, at) values(?, ?, ?, ?, ?)", slug, JSON.stringify(d), user.id, t, t);
      note(user.name, `Визитка «${d.name}» создана: /card/${slug}`);
      return Number(r.lastInsertRowid);
    },
    setOff(user, id, off) { const c = row(db.get(SEL + " where c.id = ?", id)); if (!c) throw new Error("Нет такой визитки"); may(user, c); db.run("update cards set off = ? where id = ?", off ? 1 : 0, id); note(user.name, `Визитка «${c.data.name}» ${off ? "выключена" : "включена"}`); },
    remove(user, id) { const c = row(db.get(SEL + " where c.id = ?", id)); if (!c) throw new Error("Нет такой визитки"); may(user, c); db.run("delete from cards where id = ?", id); note(user.name, `Визитка «${c.data.name}» удалена, адрес /card/${c.slug} освободился`); },
    seen(id) { db.run("update cards set views = views + 1, last_view = ? where id = ?", now(), id); },
  };
}
