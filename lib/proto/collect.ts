/**
 * Заготовка фактов — с сайта самого клиента, нашим же аудитором.
 *
 * Достаётся только то, что компания опубликовала о себе сама: название,
 * описание, контакты, логотип, крупные фотографии. Услуги отсюда не берутся
 * вовсе, и это главное решение файла.
 *
 * Причина простая. Под `<h2>` на живом сайте лежит и «Наши услуги», и
 * «Оставьте заявку», и «шиномонтаж круглосуточно ташкент» — поисковый мусор,
 * набитый в заголовки. Списком услуг это становится только после того, как
 * его прочёл человек. Поэтому заголовки возвращаются отдельным полем как
 * сырьё, а услуги в прототип попадают из первички: менеджер их всё равно
 * спрашивает, и там они верные.
 */
import { extractContacts, contactsPagePath, mergeContacts } from "@/lib/audit/contacts";
import { decodeEntities, enrich, probe } from "@/lib/audit/fetch";
import { resolveSafely } from "@/lib/audit/guard";
import type { ProtoLocale } from "@/content/proto/models";
import { PHOTO_MIN_WIDTH, emptyFacts, type ProtoFacts, type ProtoLogo } from "@/lib/proto/facts";
import { imageSize } from "@/lib/proto/photo";

export type Collected = {
  facts: ProtoFacts;
  /** Заголовки со страницы: сырьё для списка услуг, а не сам список. */
  headings: string[];
  /** Снимки, не прошедшие по ширине, — чтобы было видно, что их не забыли. */
  small: string[];
  page: { url: string; status: number; ttfbMs: number };
};

const tag = (html: string, name: string): string | null => {
  const match = html.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return match ? decodeEntities(match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()) : null;
};

const attr = (html: string, re: RegExp): string | null => {
  const match = html.match(re);
  return match ? decodeEntities(match[1].trim()) : null;
};

/** Широкая картинка — это надпись или баннер, а не снимок: у снимка 4:3 или 16:9. */
const WIDE = 2.5;

/** Первые килобайты файла: заголовка хватает, чтобы узнать размер. */
async function measure(url: string): Promise<ProtoLogo | null> {
  try {
    const parsed = new URL(url);
    await resolveSafely(parsed);
    const response = await fetch(parsed, {
      headers: { range: "bytes=0-4095" },
      signal: AbortSignal.timeout(6000),
    });
    if (!response.ok && response.status !== 206) return null;
    const size = imageSize(new Uint8Array(await response.arrayBuffer()));
    return size ? { url, width: size.width, height: size.height } : null;
  } catch {
    return null;
  }
}

export async function collectFacts(input: {
  url: string;
  niche: string;
  locale?: ProtoLocale;
}): Promise<Collected | { error: string }> {
  let page;
  try {
    page = await enrich(await probe(input.url));
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Сайт не открылся" };
  }
  if (page.status >= 400) return { error: `${page.finalUrl} ответил ${page.status}` };

  const html = page.html;
  const base = new URL(page.finalUrl);
  const absolute = (src: string): string | null => {
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
      // Страницы контактов может не быть: чего нет, того не будет и в прототипе.
    }
  }

  const sources = [
    ...new Set(
      [...html.matchAll(/<img\b[^>]*>/gi)]
        .map((match) => attr(match[0], /\bsrc\s*=\s*["']([^"']+)["']/i))
        .map((src) => (src ? absolute(src) : null))
        .filter((src): src is string => Boolean(src) && !/\.svg($|\?)/i.test(src!)),
    ),
  ].slice(0, 12);

  const photos: string[] = [];
  const small: string[] = [];
  const wide: ProtoLogo[] = [];
  for (const src of sources) {
    if (photos.length >= 4) break;
    const size = await measure(src);
    if (!size) continue;
    if (size.height > 0 && size.width / size.height >= WIDE) wide.push(size);
    else if (size.width >= PHOTO_MIN_WIDTH) photos.push(src);
    else small.push(`${src} — ${size.width}×${size.height}`);
  }

  // Логотип: сначала тот, что назван логотипом в вёрстке, иначе первая широкая
  // картинка — у малого бизнеса это почти всегда надпись с названием.
  const named =
    attr(html, /<img[^>]+(?:class|id)\s*=\s*["'][^"']*logo[^"']*["'][^>]*src\s*=\s*["']([^"']+)["']/i) ??
    attr(html, /<img[^>]+src\s*=\s*["']([^"']*logo[^"']*)["']/i);
  const namedUrl = named ? absolute(named) : null;
  const logo = namedUrl ? (wide.find((item) => item.url === namedUrl) ?? (await measure(namedUrl))) : (wide[0] ?? null);

  const title = tag(html, "title");
  const facts: ProtoFacts = {
    ...emptyFacts((title ?? base.hostname).split(/[|—–-]/)[0].trim(), input.niche, base.hostname),
    locale: input.locale ?? "ru",
    about: attr(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i),
    phone: contacts.phones[0] ?? null,
    telegram: contacts.telegram[0] ?? null,
    whatsapp: contacts.whatsapp[0] ?? null,
    instagram: contacts.instagram[0] ?? null,
    logo,
    photos: photos.filter((src) => src !== logo?.url),
  };

  const headings = [
    ...new Set(
      [...html.matchAll(/<h[123][^>]*>([\s\S]*?)<\/h[123]>/gi)]
        .map((match) => decodeEntities(match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()))
        .filter((value) => value.length > 2 && value.length < 60),
    ),
  ].slice(0, 30);

  return { facts, headings, small, page: { url: page.finalUrl, status: page.status, ttfbMs: page.ttfbMs } };
}
