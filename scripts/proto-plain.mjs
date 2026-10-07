// Где в макете длинные тире и штампы ИИ-текста — все места, по страницам.
// Правило владельца (CLAUDE.md, «Макеты — без длинных тире и штампов ИИ»):
// перед сдачей сборки из scripts/protos/<имя> прогнать и получить «чисто».
//
//   node --import ./tests/alias-hook.mjs --import ./tests/tsx-hook.mjs scripts/proto-plain.mjs <имя сборки>
//
// Без имени — все сборки из content/proto-bundles. Код выхода 1, если нашлось.
const { bundlePages, BUNDLE_NAMES } = await import("@/lib/proto/bundles");
const { readableText, dashSpots, aiMarkers, dashInCode, AI_MARKERS } = await import("@/lib/proto/plain-text");

const names = process.argv[2] ? [process.argv[2]] : BUNDLE_NAMES;
let total = 0;
for (const name of names) {
  const site = bundlePages(name);
  if (!site) { console.log(`${name}: нет такой сборки`); total += 1; continue; }
  const all = { "": site.html, ...site.pages };
  for (const [path, page] of Object.entries(all)) {
    if (!/<html|<body|<div|<p\b/i.test(page)) continue;
    const text = readableText(page);
    const spots = dashSpots(text, 10_000);
    const markers = AI_MARKERS.flatMap((m) => [...text.matchAll(new RegExp(m.re.source, m.re.flags.includes("g") ? m.re.flags : m.re.flags + "g"))].map((hit) => `${m.say}: «${text.slice(Math.max(0, hit.index - 30), hit.index + hit[0].length + 30).replace(/\s+/g, " ").trim()}»`));
    const code = !spots.length && dashInCode(page);
    if (!spots.length && !markers.length && !code) continue;
    total += spots.length + markers.length + (code ? 1 : 0);
    console.log(`\n== ${name} /${path}: тире ${spots.length}, штампов ${markers.length}${code ? ", тире в стилях или скрипте" : ""}`);
    for (const s of spots) console.log(`  тире: «${s}»`);
    for (const m of markers) console.log(`  штамп ${m}`);
  }
}
console.log(total ? `\nНайдено: ${total}` : "Чисто: ни тире, ни штампов.");
process.exit(total ? 1 : 0);
