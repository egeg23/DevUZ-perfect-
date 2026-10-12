import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

/*
 * Демо-макет Giftora: мини-приложение Telegram с игрой на подарках.
 * Клиент хочет аналог @epic_gift_bot. Копируем механики, а не бренд:
 * название, иллюстрации подарков и тексты свои, всё нарисовано кодом.
 * Механики сняты с публичной ленты t.me/s/epic_gift_official (11.10.2026):
 * боксы с рулеткой, FREE24 раз в сутки, FARM BOX с новыми коллекциями,
 * Upgrade, Rocket Mode с графикой High/Medium/Low, Dice с Higher/Lower,
 * PvP с банком по доле ставки, недельный рейтинг на 250 призов, розыгрыш
 * по билетам за задания, рефералка 10 процентов, фоны Black и Onyx Black
 * дороже обычных.
 *
 * Только игровая валюта: ни платежей, ни кошелька, ни сбора данных. Всё
 * состояние живёт в localStorage браузера.
 *
 * Две страницы: русская (главная) и английская (`en`). Общие стили и
 * скрипт кладутся в сборку один раз, в страницах вместо них @@S@@ и @@J@@.
 */

const DIR = new URL(".", import.meta.url).pathname;
const CSS = readFileSync(DIR + "style.css", "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\n\s*/g, "");
const JS = readFileSync(DIR + "app.js", "utf8");
const ACSS = readFileSync(DIR + "admin.css", "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\n\s*/g, "");
const AJS = readFileSync(DIR + "admin.js", "utf8");
const BASE = "__PROTO_BASE__";
const TERMS = (l) => `https://devuz.studio/${l}/mockup-terms`;

/* Иллюстрации подарков: свои, векторные, одним спрайтом на странице. */
const GRAD = {
  gold: ["#ffe39a", "#e09a1f"], pink: ["#ffb3cf", "#ff4f8b"], red: ["#ff8a8a", "#d81f3f"],
  green: ["#a6f0a0", "#2fa45a"], blue: ["#9fe0ff", "#2b7fff"], purple: ["#d9b3ff", "#7b3ff2"],
  orange: ["#ffd08a", "#ff7a2f"], brown: ["#d7a27a", "#8a5232"], steel: ["#f1f4fa", "#8d97ab"],
  white: ["#ffffff", "#dfe3f0"], navy: ["#5b6b9a", "#1d2645"], glass: ["#e6fbff", "#8fd6ff"],
};
const G = {
  peach: `<path d="M50 30c-20-8-38 6-36 28 2 20 18 32 36 32s34-12 36-32c2-22-16-36-36-28z" fill="url(#q-orange)"/><path d="M50 32c-4 14-4 34 0 56" stroke="#e0602a" stroke-width="3" fill="none" opacity=".45"/><path d="M52 30c4-14 16-20 28-18-4 12-14 18-28 18z" fill="url(#q-green)"/><ellipse cx="33" cy="50" rx="7" ry="11" fill="#fff" opacity=".35"/>`,
  rose: `<path d="M50 58v34" stroke="#2fa45a" stroke-width="5" stroke-linecap="round"/><path d="M50 78c-10-10-22-8-26-2 10 6 20 6 26 2z" fill="url(#q-green)"/><path d="M50 70c-18 0-26-14-24-30 8 4 14 4 24-8 10 12 16 12 24 8 2 16-6 30-24 30z" fill="url(#q-red)"/><path d="M50 24c-10 0-16 8-14 18 6-4 10-4 14 2 4-6 8-6 14-2 2-10-4-18-14-18z" fill="#ff6b81"/><path d="M44 42c4 6 8 6 12 0" stroke="#a3122e" stroke-width="2.5" fill="none"/>`,
  candle: `<ellipse cx="50" cy="88" rx="24" ry="6" fill="#000" opacity=".25"/><rect x="36" y="40" width="28" height="48" rx="6" fill="url(#q-pink)"/><path d="M36 52h28M36 64h28M36 76h28" stroke="#fff" stroke-width="3" opacity=".35"/><path d="M50 10c8 10 10 16 6 22-2 4-10 4-12 0-4-6-2-12 6-22z" fill="url(#q-orange)"/><path d="M50 22c3 4 3 7 1 9h-2c-2-2-2-5 1-9z" fill="#fff6c9"/><path d="M50 33v7" stroke="#333" stroke-width="2"/>`,
  lolli: `<path d="M50 58v34" stroke="url(#q-white)" stroke-width="6" stroke-linecap="round"/><circle cx="50" cy="38" r="27" fill="url(#q-pink)"/><path d="M50 38c0-4 6-4 6 0 0 8-12 8-12 0 0-12 18-12 18 0 0 16-24 16-24 0 0-20 30-20 30 0" stroke="#fff" stroke-width="4" fill="none" opacity=".85" stroke-linecap="round"/>`,
  clover: `<path d="M50 60c4 12 2 24-6 32" stroke="#2fa45a" stroke-width="4" fill="none" stroke-linecap="round"/><g fill="url(#q-green)"><circle cx="37" cy="37" r="15"/><circle cx="63" cy="37" r="15"/><circle cx="37" cy="61" r="15"/><circle cx="63" cy="61" r="15"/></g><circle cx="50" cy="49" r="6" fill="#bff5b0"/><circle cx="32" cy="32" r="4" fill="#fff" opacity=".5"/>`,
  bear: `<circle cx="27" cy="28" r="12" fill="url(#q-brown)"/><circle cx="73" cy="28" r="12" fill="url(#q-brown)"/><circle cx="27" cy="28" r="6" fill="#f2c9a5"/><circle cx="73" cy="28" r="6" fill="#f2c9a5"/><circle cx="50" cy="55" r="32" fill="url(#q-brown)"/><ellipse cx="50" cy="67" rx="15" ry="11" fill="#f2c9a5"/><circle cx="38" cy="50" r="4" fill="#2a1a12"/><circle cx="62" cy="50" r="4" fill="#2a1a12"/><ellipse cx="50" cy="62" rx="5" ry="3.5" fill="#2a1a12"/><path d="M45 71q5 4 10 0" stroke="#2a1a12" stroke-width="2" fill="none"/>`,
  frog: `<ellipse cx="50" cy="63" rx="34" ry="26" fill="url(#q-green)"/><circle cx="34" cy="40" r="12" fill="url(#q-green)"/><circle cx="66" cy="40" r="12" fill="url(#q-green)"/><circle cx="34" cy="40" r="7" fill="#fff"/><circle cx="66" cy="40" r="7" fill="#fff"/><circle cx="35" cy="41" r="3.5" fill="#1b2a1b"/><circle cx="67" cy="41" r="3.5" fill="#1b2a1b"/><path d="M36 68q14 10 28 0" stroke="#1b5a2b" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="29" cy="63" r="4" fill="#ff8fb1" opacity=".7"/><circle cx="71" cy="63" r="4" fill="#ff8fb1" opacity=".7"/><path d="M40 26l3-12 7 7 7-7 3 12z" fill="url(#q-gold)"/>`,
  gem: `<path d="M30 20h40l18 24-38 46-38-46z" fill="url(#q-blue)"/><path d="M12 44h76M30 20l8 24 12 46M70 20l-8 24-12 46M38 44l12-24 12 24" stroke="#e6f6ff" stroke-width="2" fill="none" opacity=".6"/><path d="M30 20h40l-8 24H38z" fill="#fff" opacity=".3"/>`,
  lamp: `<ellipse cx="50" cy="88" rx="26" ry="5" fill="#000" opacity=".25"/><path d="M14 56c10 0 16 8 26 12h24c10-4 14-16 26-22-8 0-12 2-16 6-4-10-14-14-26-14s-22 6-24 16c-4-2-6-2-10 2z" fill="url(#q-gold)"/><path d="M40 70h24l-4 14H44z" fill="url(#q-gold)"/><ellipse cx="52" cy="40" rx="12" ry="4" fill="#ffe7a8"/><path d="M52 36c0-6 4-8 4-12" stroke="url(#q-gold)" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M24 30c6-6 14-4 16 2s-6 8-10 4" stroke="#c9b6ff" stroke-width="3" fill="none" opacity=".8"/>`,
  flame: `<path d="M50 8c18 20 30 34 30 52 0 18-14 30-30 30S20 78 20 60c0-10 6-18 12-24 0 10 4 16 10 18-2-18 2-32 8-46z" fill="url(#q-blue)"/><path d="M50 44c10 10 14 18 14 26s-6 14-14 14-14-6-14-14 6-16 14-26z" fill="#e6f6ff"/>`,
  watch: `<rect x="38" y="6" width="24" height="24" rx="6" fill="url(#q-brown)"/><rect x="38" y="70" width="24" height="24" rx="6" fill="url(#q-brown)"/><circle cx="50" cy="50" r="27" fill="url(#q-gold)"/><circle cx="50" cy="50" r="21" fill="#fbf7ee"/><path d="M50 50V36M50 50l10 6" stroke="#2a2a2a" stroke-width="3" stroke-linecap="round"/><circle cx="50" cy="50" r="2.5" fill="#d33"/><rect x="77" y="46" width="6" height="8" rx="2" fill="url(#q-gold)"/>`,
  cap: `<path d="M14 54c0-22 16-34 36-34s36 12 36 34z" fill="url(#q-navy)"/><path d="M14 54h72v8H14z" fill="#141b33"/><path d="M20 62c10 10 50 10 60 0l6 8c-14 12-58 12-72 0z" fill="#0d1226"/><circle cx="50" cy="40" r="8" fill="url(#q-gold)"/><path d="M34 54c6-5 26-5 32 0" stroke="url(#q-gold)" stroke-width="3" fill="none"/><path d="M26 32c8-6 18-8 24-8" stroke="#fff" stroke-width="3" opacity=".25" fill="none"/>`,
  helmet: `<path d="M50 12c22 0 34 16 34 38v24c0 8-8 16-16 16H32c-8 0-16-8-16-16V50c0-22 12-38 34-38z" fill="url(#q-steel)"/><path d="M26 50h48v8H26zM46 58h8v26h-8z" fill="#2b3245"/><path d="M50 12v38" stroke="#fff" stroke-width="3" opacity=".5"/><path d="M50 12c-8-4-6-10 0-12 6 2 8 8 0 12z" fill="url(#q-red)"/>`,
  crown: `<path d="M14 70L10 30l22 18 18-28 18 28 22-18-4 40z" fill="url(#q-gold)"/><rect x="14" y="68" width="72" height="14" rx="4" fill="url(#q-gold)"/><circle cx="50" cy="56" r="7" fill="url(#q-red)"/><circle cx="30" cy="62" r="5" fill="url(#q-blue)"/><circle cx="70" cy="62" r="5" fill="url(#q-green)"/><circle cx="10" cy="30" r="4" fill="url(#q-gold)"/><circle cx="50" cy="20" r="4" fill="url(#q-gold)"/><circle cx="90" cy="30" r="4" fill="url(#q-gold)"/>`,
  locket: `<path d="M32 6q18 14 36 0" stroke="url(#q-gold)" stroke-width="3" fill="none"/><path d="M50 92C20 72 10 56 10 40c0-12 10-22 22-22 8 0 14 4 18 10 4-6 10-10 18-10 12 0 22 10 22 22 0 16-10 32-40 52z" fill="url(#q-gold)"/><path d="M50 82C28 66 18 53 18 41c0-8 6-15 15-15 7 0 12 5 17 12 5-7 10-12 17-12 9 0 15 7 15 15 0 12-10 25-32 41z" fill="url(#q-pink)"/><ellipse cx="33" cy="41" rx="5" ry="8" fill="#fff" opacity=".45"/>`,
  trophy: `<path d="M30 14h40v22c0 14-8 24-20 24s-20-10-20-24z" fill="url(#q-gold)"/><path d="M30 20H18c0 14 6 20 14 20M70 20h12c0 14-6 20-14 20" stroke="url(#q-gold)" stroke-width="5" fill="none"/><rect x="44" y="58" width="12" height="14" fill="url(#q-gold)"/><rect x="30" y="72" width="40" height="14" rx="4" fill="url(#q-brown)"/><path d="M38 20v14" stroke="#fff" stroke-width="4" opacity=".4" stroke-linecap="round"/>`,
  star: `<path d="M50 8l12 26 28 3-21 19 6 28-25-14-25 14 6-28L10 37l28-3z" fill="url(#q-gold)"/><path d="M50 22l6 14 15 2-11 10" stroke="#fff" stroke-width="3" fill="none" opacity=".5"/>`,
  cake: `<rect x="20" y="52" width="60" height="32" rx="8" fill="url(#q-brown)"/><rect x="26" y="34" width="48" height="22" rx="7" fill="url(#q-pink)"/><path d="M20 62c6 6 10 6 15 0s10 6 15 0 10 6 15 0 10 6 15 0" stroke="#fff3f8" stroke-width="5" fill="none"/><rect x="47" y="16" width="6" height="18" rx="2" fill="url(#q-blue)"/><path d="M50 4c4 4 4 8 0 10-4-2-4-6 0-10z" fill="url(#q-orange)"/><circle cx="36" cy="44" r="3" fill="url(#q-red)"/><circle cx="64" cy="44" r="3" fill="url(#q-red)"/>`,
  potion: `<rect x="42" y="8" width="16" height="10" rx="3" fill="url(#q-brown)"/><path d="M44 18h12v16c14 6 22 18 22 30 0 16-12 28-28 28S22 80 22 64c0-12 8-24 22-30z" fill="url(#q-glass)" opacity=".9"/><path d="M26 62c8-4 16 4 24 0s16-4 24 0c0 14-10 24-24 24S26 76 26 62z" fill="url(#q-purple)"/><circle cx="40" cy="72" r="3" fill="#fff" opacity=".7"/><circle cx="56" cy="66" r="2" fill="#fff" opacity=".7"/><path d="M32 46c2-4 6-6 8-7" stroke="#fff" stroke-width="3" opacity=".6" fill="none" stroke-linecap="round"/>`,
  ring: `<circle cx="50" cy="62" r="26" stroke="url(#q-gold)" stroke-width="9" fill="none"/><path d="M36 30l14-20 14 20-14 12z" fill="url(#q-blue)"/><path d="M36 30h28" stroke="#fff" stroke-width="2" opacity=".6"/>`,
  cat: `<path d="M20 42L16 10l26 16zM80 42l4-32-26 16z" fill="url(#q-purple)"/><circle cx="50" cy="56" r="34" fill="url(#q-purple)"/><ellipse cx="50" cy="67" rx="16" ry="12" fill="#f3e6ff"/><circle cx="37" cy="50" r="6" fill="#fff"/><circle cx="63" cy="50" r="6" fill="#fff"/><circle cx="38" cy="51" r="3.5" fill="#24133d"/><circle cx="64" cy="51" r="3.5" fill="#24133d"/><path d="M47 62h6l-3 4z" fill="#ff6fa0"/><path d="M12 60h20M12 68h20M68 60h20M68 68h20" stroke="#f3e6ff" stroke-width="2" opacity=".8"/><path d="M28 86c4 6 40 6 44 0" stroke="url(#q-gold)" stroke-width="5" fill="none"/>`,
  box: `<ellipse cx="50" cy="92" rx="34" ry="5" fill="#000" opacity=".3"/><rect x="16" y="44" width="68" height="46" rx="7" fill="var(--c1)"/><rect x="50" y="44" width="34" height="46" rx="7" fill="#000" opacity=".14"/><rect x="10" y="32" width="80" height="16" rx="6" fill="var(--c2)"/><rect x="44" y="32" width="12" height="58" fill="var(--c3)"/><path d="M50 32c-6-14-26-18-24-6 1 6 14 6 24 6zM50 32c6-14 26-18 24-6-1 6-14 6-24 6z" fill="var(--c3)"/><rect x="14" y="35" width="40" height="4" rx="2" fill="#fff" opacity=".3"/>`,
};
/* Значки интерфейса: линии цветом текста. */
const I = {
  ton: `<path d="M12 3h0c.6 0 1.1.3 1.4.8l7 11.4c.6 1-.1 2.3-1.3 2.3H4.9c-1.2 0-1.9-1.3-1.3-2.3l7-11.4c.3-.5.8-.8 1.4-.8z" fill="currentColor" opacity=".25"/><path d="M5 7h14l-7 13zM12 7v13" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>`,
  boxes: `<path d="M4 10h16v10H4zM3 6h18v4H3zM12 6v14M12 6C10 2 6 2 7 5M12 6c2-4 6-4 5-1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>`,
  games: `<path d="M7 8h10a5 5 0 0 1 4.8 6.4l-.9 3a2.5 2.5 0 0 1-4.2 1L15 17H9l-1.7 1.4a2.5 2.5 0 0 1-4.2-1l-.9-3A5 5 0 0 1 7 8z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M8 11v4M6 13h4M16 12h.01M18 14h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
  bag: `<path d="M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>`,
  cup: `<path d="M8 4h8v6a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 14v4M8 20h8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
  user: `<circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`,
  back: `<path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`,
  close: `<path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>`,
  plus: `<path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>`,
  rocket: `<path d="M12 2c4 3 6 7 6 11l-2 3H8l-2-3c0-4 2-8 6-11z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="12" cy="10" r="2" fill="currentColor"/><path d="M8 16l-3 3 1-5M16 16l3 3-1-5M10 19c0 2 1 3 2 3s2-1 2-3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>`,
  dice: `<rect x="4" y="4" width="16" height="16" rx="4" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="9" cy="9" r="1.4" fill="currentColor"/><circle cx="15" cy="15" r="1.4" fill="currentColor"/><circle cx="15" cy="9" r="1.4" fill="currentColor"/><circle cx="9" cy="15" r="1.4" fill="currentColor"/>`,
  up: `<path d="M12 19V6M6 11l6-6 6 6M5 21h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  pvp: `<path d="M4 4l9 9M4 4h4M4 4v4M20 4l-9 9M20 4h-4M20 4v4M7 14l3 3-3 3-3-3zM17 14l-3 3 3 3 3-3z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
  ticket: `<path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M10 6v12" stroke="currentColor" stroke-width="1.6" stroke-dasharray="2 2"/>`,
  star: `<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>`,
  copy: `<rect x="8" y="8" width="12" height="12" rx="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" fill="none" stroke="currentColor" stroke-width="1.8"/>`,
  sound: `<path d="M4 9h4l5-4v14l-5-4H4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`,
  mute: `<path d="M4 9h4l5-4v14l-5-4H4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M17 9l5 6M22 9l-5 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`,
  gift: `<path d="M4 11h16v9H4zM3 7h18v4H3zM12 7v13M12 7C10 3 6 3 7 6M12 7c2-4 6-4 5-1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>`,
  send: `<path d="M21 3L3 10.5l7 2.5 2.5 7z M21 3l-11 10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>`,
  check: `<path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`,
  users: `<circle cx="9" cy="8" r="3.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M2.5 20c1-3.5 3.5-5.5 6.5-5.5s5.5 2 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5c2 .6 3.2 2.4 3.8 5.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`,
  bolt: `<path d="M13 2L4 14h7l-1 8 9-12h-7z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>`,
  chart: `<path d="M4 20V10M10 20V4M16 20v-7M22 20H2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`,
  sliders: `<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="16" cy="6" r="2" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="10" cy="12" r="2" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="18" cy="18" r="2" fill="none" stroke="currentColor" stroke-width="1.8"/>`,
  tag: `<path d="M3 12V4h8l10 10-8 8z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="7.5" cy="8.5" r="1.5" fill="currentColor"/>`,
  link: `<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`,
  panel: `<rect x="3" y="4" width="18" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M9 4v16M13 9h5M13 13h5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`,
};
const SPRITE = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${Object.entries(GRAD)
  .map(([k, [a, b]]) => `<linearGradient id="q-${k}" x1="0" y1="0" x2=".4" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`)
  .join("")}${Object.entries(G).map(([k, v]) => `<symbol id="g-${k}" viewBox="0 0 100 100">${v}</symbol>`).join("")}${Object.entries(I)
  .map(([k, v]) => `<symbol id="i-${k}" viewBox="0 0 24 24">${v}</symbol>`)
  .join("")}</defs></svg>`;

const ic = (k) => `<svg class="ic"><use href="#i-${k}"/></svg>`;

function page(l) {
  const t = (ru, en) => (l === "ru" ? ru : en);
  const other = l === "ru" ? BASE + "/en" : BASE;
  const screens = [
    ["home", t("Боксы и FREE24", "Boxes and FREE24")],
    ["rocket", "Rocket"],
    ["dice", "Dice"],
    ["upgrade", "Upgrade"],
    ["pvp", "PvP"],
    ["inv", t("Инвентарь", "Inventory")],
    ["top", t("Рейтинг недели", "Weekly leaderboard")],
    ["tasks", t("Задания и розыгрыш", "Tasks and giveaway")],
    ["profile", t("Профиль и рефералка", "Profile and referrals")],
  ];
  const tabs = [
    ["home", "boxes", t("Боксы", "Boxes")],
    ["hub", "games", t("Игры", "Games")],
    ["inv", "bag", t("Инвентарь", "Inventory")],
    ["top", "cup", t("Рейтинг", "Top")],
    ["profile", "user", t("Профиль", "Profile")],
  ];
  return `<!doctype html><html lang="${l}" data-base="${BASE}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no"><meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#0c0b16"><title>${t("Giftora · демо мини-приложения Telegram", "Giftora · Telegram mini app demo")}</title><meta name="description" content="${t("Демо-макет мини-приложения: боксы, Rocket, Dice, Upgrade, PvP на игровой валюте.", "Mini app demo: boxes, Rocket, Dice, Upgrade, PvP on play money.")}">@@S@@</head><body>
<div class="stage">
<div class="orb o1"></div><div class="orb o2"></div><div class="orb o3"></div>
<aside class="side">
<div class="side-brand"><span class="logo"><svg viewBox="0 0 100 100"><use href="#g-box" style="--c1:hsl(268 85% 62%);--c2:hsl(276 90% 72%);--c3:hsl(42 96% 62%)"/></svg></span><b>Giftora</b><span class="chip demo">${t("Демо", "Demo")}</span></div>
<h1>${t("Мини-приложение Telegram с игрой на подарках", "Telegram mini app with gift games")}</h1>
<p>${t("Демо-макет от DevUz Studio. Все экраны рабочие, на игровой валюте: настоящих денег, кошелька и платежей здесь нет. Откройте на телефоне или нажимайте экраны ниже.", "A demo by DevUz Studio. Every screen works on play money: there is no real money, wallet or payment here. Open it on a phone or tap the screens below.")}</p>
<div class="side-nav">${screens.map(([k, n]) => `<button data-go="${k}">${n}</button>`).join("")}<a class="side-adm" href="${BASE}${l === "ru" ? "" : "/en"}/admin">${ic("panel")}${t("Панель оператора", "Operator panel")}</a></div>
<p class="side-legal">${t("Макет принадлежит DevUz Studio.", "The mock-up belongs to DevUz Studio.")} <a href="${TERMS(l)}" target="_blank" rel="noopener">${t("Условия использования макета", "Mock-up terms of use")}</a></p>
</aside>
<div class="phone"><div class="island"></div>
<div class="app" id="app">
<div class="demo-bar"><span class="chip demo">${t("Демо", "Demo")}</span><span>${t("игровая валюта, без настоящих денег", "play money, no real funds")}</span><a href="${TERMS(l)}" target="_blank" rel="noopener">${t("Условия", "Terms")}</a></div>
<header class="top">
<button class="me" data-go="profile"><span class="ava" id="me-ava">G</span><span class="me-t"><b id="me-name">${t("Гость", "Guest")}</b><small id="me-lvl">${t("Уровень 1", "Level 1")}</small></span></button>
<div class="top-r"><a class="lang" href="${other}" data-lang>${l === "ru" ? "EN" : "RU"}</a><button class="snd" data-act="sound" aria-label="${t("Звук", "Sound")}">${ic("mute")}</button><button class="bal" data-act="deposit">${ic("ton")}<b id="bal">25.00</b><i>${ic("plus")}</i></button></div>
</header>
<main class="view" id="view"><noscript><p class="pad">${t("Для демо нужен JavaScript.", "The demo needs JavaScript.")}</p></noscript></main>
<nav class="tabs" id="tabs">${tabs.map(([k, i, n]) => `<button data-go="${k}" data-tab="${k}">${ic(i)}<span>${n}</span></button>`).join("")}</nav>
<div class="flash" id="flash"></div>
<canvas class="fx" id="fx"></canvas>
<div id="layer"></div>
<div class="toast" id="toast"></div>
<div class="splash" id="splash"><div class="sp-logo"><svg viewBox="0 0 100 100"><use href="#g-box" style="--c1:hsl(268 85% 62%);--c2:hsl(276 90% 72%);--c3:hsl(42 96% 62%)"/></svg></div><b>Giftora</b><small>${t("демо · DevUz Studio", "demo · DevUz Studio")}</small></div>
</div></div>
</div>
${SPRITE}
@@J@@
</body></html>`;
}

/* Панель оператора: RTP, депозиты и выводы по дням, пользователи, промокоды, рефералы. */
function admin(l) {
  const t = (ru, en) => (l === "ru" ? ru : en);
  const app = BASE + (l === "ru" ? "" : "/en");
  const other = l === "ru" ? BASE + "/en/admin" : BASE + "/admin";
  const nav = [
    ["overview", "chart", t("Обзор", "Overview")],
    ["rtp", "sliders", t("RTP и шансы", "RTP and odds")],
    ["users", "users", t("Пользователи", "Users")],
    ["promo", "tag", t("Промокоды", "Promo codes")],
    ["refs", "link", t("Рефералы", "Referrals")],
  ];
  return `<!doctype html><html lang="${l}" data-base="${BASE}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#0c0b16"><title>${t("Панель оператора · Giftora демо", "Operator panel · Giftora demo")}</title>@@T@@</head><body>
<div class="adm">
<aside class="adm-side">
<div class="brand"><svg viewBox="0 0 100 100"><use href="#g-box" style="--c1:hsl(268 85% 62%);--c2:hsl(276 90% 72%);--c3:hsl(42 96% 62%)"/></svg><div><b>Giftora</b> <span class="chip">${t("Демо", "Demo")}</span><small>${t("панель оператора", "operator panel")}</small></div></div>
<nav class="nav">${nav.map(([k, i, n]) => `<button data-tab="${k}">${ic(i)}${n}</button>`).join("")}</nav>
<a class="back" href="${app}">${ic("back")}${t("В приложение", "To the app")}</a>
<a class="back" href="${other}">${l === "ru" ? "EN" : "RU"}</a>
<div class="side-f"><p>${t("Демо: цифры игровые, настройки хранятся только в этом браузере и сразу действуют в приложении.", "Demo: figures are made up, settings live only in this browser and apply to the app right away.")}</p></div>
</aside>
<main class="adm-main" id="adm-scroll"><div id="adm-main"></div><p class="adm-legal">${t("Демо-макет DevUz Studio.", "DevUz Studio demo.")} <a href="${TERMS(l)}" target="_blank" rel="noopener">${t("Условия использования макета", "Mock-up terms of use")}</a></p></main>
</div>
<div class="adm-toast" id="adm-toast"></div>
${SPRITE}
@@A@@
</body></html>`;
}

const out = { "": page("ru"), en: page("en"), admin: admin("ru"), "en/admin": admin("en") };
const parts = { S: `<style>${CSS}</style>`, J: `<script>\n${JS}\n</script>`, T: `<style>${ACSS}</style>`, A: `<script>\n${AJS}\n</script>` };

mkdirSync(DIR + "out", { recursive: true });
writeFileSync(
  DIR + "out/pages.json",
  JSON.stringify(Object.fromEntries(Object.entries(out).map(([k, v]) => [k, Object.entries(parts).reduce((p, [n, part]) => p.split(`@@${n}@@`).join(part), v)]))),
);
const bundleDir = new URL("../../../content/proto-bundles/", import.meta.url).pathname;
mkdirSync(bundleDir, { recursive: true });
writeFileSync(bundleDir + "giftora.json", JSON.stringify({ parts, pages: out }));
for (const [k, v] of Object.entries(out)) console.log((k || "(ru)").padEnd(9), Object.entries(parts).reduce((p, [n, part]) => p.split(`@@${n}@@`).join(part), v).length);
