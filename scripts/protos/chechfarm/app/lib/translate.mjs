/* Перевод в панели (владелец DevUz, 19.11.2026: «встроить переводчик…
   чтобы если они делают блок на 1 языке, он сразу делался на всех языках»;
   следом: «Бери наш ключ пока что, через 2 месяца убери его. 2 месяца пусть
   пользуются нашими хайку»). Ключа модели здесь нет: тексты уходят на
   devuz.studio с пропуском этого сервера (DEVUZ_TRANSLATE_TOKEN, его кладёт
   выкатка), переводит наш сервер, он же держит срок — до TR_UNTIL.

   Правило для текстов на нескольких языках ({ ru:{…}, uz:{…}, … , auto }):
   пустой язык и язык, переведённый раньше автоматически, заполняются
   переводом с того языка, который правили; язык, поправленный руками,
   перевод больше не трогает (auto[язык] = false). */
export const TR_UNTIL = "2027-01-19T00:00:00+05:00";
export const TR_LANGS = ["ru", "uz", "en", "ar"];
const URL_ = process.env.DEVUZ_TRANSLATE_URL || "https://devuz.studio/api/czechfarm/translate";

export function trState(env = process.env, now = Date.now()) {
  if (now >= Date.parse(TR_UNTIL)) return { on: false, why: "expired", until: TR_UNTIL };
  if (!env.DEVUZ_TRANSLATE_TOKEN) return { on: false, why: "no_token", until: TR_UNTIL };
  return { on: true, until: TR_UNTIL };
}

/* items: { ключ: текст } → { язык: { ключ: перевод } }; не вышло — null. */
export async function translate(from, to, items, { env = process.env, fetchFn = fetch } = {}) {
  const st = trState(env);
  if (!st.on || !to.length || !Object.keys(items).length) return null;
  try {
    const r = await fetchFn(URL_, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: "Bearer " + env.DEVUZ_TRANSLATE_TOKEN },
      body: JSON.stringify({ from, to, items }),
      signal: AbortSignal.timeout(45_000),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.ok) { console.error("перевод: devuz ответил", r.status, j.why || ""); return null; }
    return j.out || null;
  } catch (e) {
    console.error("перевод: devuz не ответил —", e?.name || e);
    return null;
  }
}

/* Какие столбцы таблицы партнёров что значат: заголовки и до 5 строк уходят
   на devuz.studio (тот же пропуск и срок, Haiku). Не вышло — null. */
export async function columns(headers, sample, { env = process.env, fetchFn = fetch } = {}) {
  if (!trState(env).on) return null;
  try {
    const r = await fetchFn(URL_.replace(/\/translate$/, "/columns"), {
      method: "POST",
      headers: { "content-type": "application/json", authorization: "Bearer " + env.DEVUZ_TRANSLATE_TOKEN },
      body: JSON.stringify({ headers, sample: sample.slice(0, 5) }),
      signal: AbortSignal.timeout(30_000),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.ok || !j.map) { console.error("столбцы: devuz ответил", r.status, j.why || ""); return null; }
    return j.map;
  } catch (e) {
    console.error("столбцы: devuz не ответил —", e?.name || e);
    return null;
  }
}

const same = (a, b) => JSON.stringify(a || {}) === JSON.stringify(b || {});
const filled = (o) => Object.values(o || {}).some((v) => String(v || "").trim());

/* Какие языки переводить и с какого. next, prev — { ru:{поле}, …, auto }.
   src — язык, который правили. Возвращает { targets, auto }. */
export function plan(next, prev, src) {
  const auto = { ...(prev?.auto || {}) };
  for (const l of TR_LANGS) if (l !== src && prev && !same(next[l], prev[l])) auto[l] = false;
  const srcChanged = !prev || !same(next[src], prev[src]);
  if (srcChanged && auto[src]) { auto[src] = false; return { targets: [], auto }; }
  if (!filled(next[src])) return { targets: [], auto };
  const targets = TR_LANGS.filter((l) => l !== src && (!filled(next[l]) || (auto[l] && srcChanged)));
  return { targets, auto };
}

/* Заполняет next переводом по plan. fields — какие поля переводить.
   Возвращает { langs: переведённые языки, failed }. */
export async function fillLangs(next, prev, src, fields, tr = translate) {
  const { targets, auto } = plan(next, prev, src);
  next.auto = auto;
  if (!targets.length) return { langs: [], failed: false };
  const items = {};
  for (const k of fields) { const v = String(next[src]?.[k] || "").trim(); if (v) items[k] = v; }
  const out = await tr(src, targets, items);
  if (!out) return { langs: [], failed: true };
  const langs = [];
  for (const l of targets) {
    const got = out[l] || {};
    if (!Object.keys(items).every((k) => got[k])) continue;
    next[l] = { ...(next[l] || {}) };
    for (const k of fields) next[l][k] = got[k] || "";
    auto[l] = true;
    langs.push(l);
  }
  return { langs, failed: langs.length < targets.length };
}

/* Продукт: русские поля в карточке, переводы — в o.tr ({ uz:{поле}, … }).
   Поле, которое правили, переводится заново; поле портфеля, которое не
   трогали, берёт готовый перевод catalog-tr.mjs и сюда не идёт (catTr). */
export const PRODUCT_TR = ["name", "inn", "form", "pack", "group", "doctors", "maker", "comp", "about"];
export function productPlan(o, prev, catTr) {
  const tr = JSON.parse(JSON.stringify(prev?.tr || {})), items = {};
  for (const k of PRODUCT_TR) {
    const v = String(o[k] || "").trim();
    if (!v || (prev && prev[k] !== o[k])) for (const l of TR_LANGS.slice(1)) if (tr[l]) delete tr[l][k];
    if (!v || catTr(k, v)) continue;
    if (TR_LANGS.slice(1).some((l) => !tr[l]?.[k])) items[k] = v;
  }
  return { tr, items };
}
export function cleanTr(tr) {
  const out = {};
  for (const l of TR_LANGS.slice(1)) {
    const one = {};
    for (const k of PRODUCT_TR) { const v = String(tr?.[l]?.[k] ?? "").replace(/\r/g, "").trim().slice(0, 4000); if (v) one[k] = v; }
    if (Object.keys(one).length) out[l] = one;
  }
  return out;
}
