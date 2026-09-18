#!/usr/bin/env node
/**
 * Заготовка фактов для прототипа — с сайта самого клиента.
 *
 *   node scripts/proto-facts.mjs <адрес> <ключ-ниши> > facts.json
 *
 * Скрипт достаёт то, что компания опубликовала о себе сама: название,
 * описание, контакты, адрес, логотип, крупные фотографии. Услуги он не
 * выдумывает — оставляет пустой список и складывает рядом заголовки со
 * страницы, из которых человек или модель выбирают настоящие. Список ниши
 * (`ask`) сюда не попадает намеренно: это вопросы для первички, а не текст
 * страницы.
 */
import { probe, enrich, decodeEntities } from "../lib/audit/fetch.ts";
import { extractContacts, mergeContacts, contactsPagePath } from "../lib/audit/contacts.ts";
import { protoNicheByKey } from "../content/proto/models.ts";
import { PHOTO_MIN_WIDTH } from "../lib/proto/facts.ts";
import { imageSize } from "../lib/proto/photo.ts";

const [target, nicheKey = "shinomontazh"] = process.argv.slice(2);
if (!target) {
  console.error("Нужен адрес: node scripts/proto-facts.mjs tirex.uz shinomontazh");
  process.exit(2);
}
if (!protoNicheByKey(nicheKey)) {
  console.error(`Ниша «${nicheKey}» не заведена в content/proto/models.ts`);
  process.exit(2);
}

const text = (html, tag) => {
  const match = html.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return match ? decodeEntities(match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()) : null;
};

const attr = (html, re) => {
  const match = html.match(re);
  return match ? decodeEntities(match[1].trim()) : null;
};

const page = await enrich(await probe(target));
if (page.status >= 400) {
  console.error(`${page.finalUrl} ответил ${page.status}`);
  process.exit(1);
}

const html = page.html;
const base = new URL(page.finalUrl);
const absolute = (src) => {
  try {
    return new URL(src, base).href;
  } catch {
    return null;
  }
};

let contacts = extractContacts(html);
const contactsPath = contactsPagePath(html);
if (contactsPath) {
  try {
    const extra = await probe(new URL(contactsPath, base).href);
    contacts = mergeContacts(contacts, extractContacts(extra.html), extra.finalUrl);
  } catch {
    // Страница контактов необязательна: чего нет, того на прототипе не будет.
  }
}

// Заголовки со страницы — сырьё для списка услуг, а не сам список. Решает
// человек: на сайте под <h2> лежит и «Наши услуги», и «Оставьте заявку».
const headings = [...html.matchAll(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/gi)]
  .map((match) => decodeEntities(match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()))
  .filter((value) => value.length > 2 && value.length < 60);

/*
 * Фотографии: только крупные, и ширина берётся из самого файла.
 *
 * Атрибуту `width` в вёрстке верить нельзя — он говорит, как картинку
 * показали, а не какая она, и у половины сайтов его нет. Поэтому качаем
 * первые килобайты и читаем заголовок. Снимок 700×452, растянутый на первый
 * экран, портит впечатление сильнее, чем его отсутствие.
 */
const candidates = [...html.matchAll(/<img\b[^>]*>/gi)]
  .map((tag) => attr(tag[0], /\bsrc\s*=\s*["']([^"']+)["']/i))
  .map((src) => (src ? absolute(src) : null))
  .filter((src) => src && !/\.svg($|\?)/i.test(src) && !/logo/i.test(src))
  .slice(0, 12);

const photos = [];
const rejected = [];
const wide = [];
for (const src of [...new Set(candidates)]) {
  if (photos.length >= 4) break;
  try {
    const response = await fetch(src, { headers: { range: "bytes=0-4095" } });
    if (!response.ok && response.status !== 206) continue;
    const size = imageSize(new Uint8Array(await response.arrayBuffer()));
    if (!size) continue;
    /*
     * Широкая картинка — это почти всегда логотип-надпись или баннер, а не
     * фотография: у снимка с телефона отношение сторон около 4:3 или 16:9.
     * Такую в блок фотографий ставить нельзя, а вот логотипом она годится.
     */
    if (size.height > 0 && size.width / size.height >= 2.5) wide.push({ url: src, ...size });
    else if (size.width >= PHOTO_MIN_WIDTH) photos.push(src);
    else rejected.push(`${src} — ${size.width}×${size.height}`);
  } catch {
    // Недоступная картинка на прототип не попадёт, и это правильный исход.
  }
}

const named =
  attr(html, /<img[^>]+(?:class|id)\s*=\s*["'][^"']*logo[^"']*["'][^>]*src\s*=\s*["']([^"']+)["']/i) ??
  attr(html, /<img[^>]+src\s*=\s*["']([^"']*logo[^"']*)["']/i);

// Логотип: сначала тот, что назван логотипом в вёрстке, иначе первая широкая
// картинка — у малого бизнеса это почти всегда надпись с названием.
let logoFact = wide[0] ?? null;
if (named) {
  const url = absolute(named);
  const found = wide.find((item) => item.url === url);
  if (found) logoFact = found;
  else if (url) {
    try {
      const response = await fetch(url, { headers: { range: "bytes=0-4095" } });
      const size = imageSize(new Uint8Array(await response.arrayBuffer()));
      if (size) logoFact = { url, ...size };
    } catch {
      // Логотип необязателен: без него в шапке встанут инициалы.
    }
  }
}

const facts = {
  name: (text(html, "title") ?? base.hostname).split(/[|—–-]/)[0].trim(),
  niche: nicheKey,
  locale: "ru",
  city: null,
  about: attr(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i),
  services: [],
  phone: contacts.phones[0] ?? null,
  telegram: contacts.telegram[0] ?? null,
  whatsapp: contacts.whatsapp[0] ?? null,
  instagram: contacts.instagram[0] ?? null,
  address: null,
  hours: null,
  logo: logoFact,
  photos,
  source: base.hostname,
};

console.log(JSON.stringify(facts, null, 2));
console.error(`\n--- ${page.finalUrl} (${page.status}, ${page.ttfbMs} мс) ---`);
console.error(`Заголовок: ${text(html, "title") ?? "—"}`);
console.error(`H1: ${text(html, "h1") ?? "—"}`);
console.error(`Телефоны: ${contacts.phones.join(", ") || "—"}`);
console.error(`Телеграм: ${contacts.telegram.join(", ") || "—"}  Ватсап: ${contacts.whatsapp.join(", ") || "—"}`);
if (rejected.length) {
  console.error(`Мелкие снимки, не взятые в прототип (порог ${PHOTO_MIN_WIDTH} px):`);
  for (const line of rejected) console.error(`  · ${line}`);
}
console.error(`Заголовки страницы (сырьё для услуг):`);
for (const heading of headings.slice(0, 30)) console.error(`  · ${heading}`);
