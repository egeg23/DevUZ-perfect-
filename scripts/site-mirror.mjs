/**
 * Зеркало чужой страницы на диск — чтобы её мог открыть браузер.
 *
 * Зачем такой крюк. Исходящий HTTPS в песочнице идёт через прокси, который
 * перевыпускает сертификаты своим корнем. Node этому корню доверяет,
 * а у Chromium своё хранилище, и менять там настройки доверия ради разведки
 * значило бы лечить не ту болезнь.
 *
 * Поэтому страницу качает тот стек, который корню доверяет: рядом
 * складываются её стили, шрифты и картинки, ссылки переписываются на
 * локальные, и браузер открывает `file://`. Стили статичны, поэтому
 * посчитанные браузером размеры, цвета и отступы получаются настоящими.
 *
 * Чего зеркало не даёт: скрипты снимаются намеренно. Чужой сборщик,
 * запущенный с `file://` без своих запросов, перерисовывает страницу в
 * пустоту чаще, чем оживляет её. Сайт, который без скриптов пуст, так и
 * отмечается — это честнее, чем снимок белого экрана, выданный за чужой
 * дизайн.
 */
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36";

async function grab(url) {
  const response = await fetch(url, { headers: { "user-agent": AGENT }, signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`ответил ${response.status}`);
  return response;
}

/** Имя файла: хвост адреса плюс отпечаток, чтобы два `style.css` не слиплись. */
function localName(url, fallback) {
  const tail = (new URL(url).pathname.split("/").pop() || fallback).split("?")[0].slice(-48) || fallback;
  return `${createHash("sha1").update(url).digest("hex").slice(0, 8)}-${tail}`;
}

/**
 * Переписать ссылки готовой разметки на локальные файлы.
 *
 * Отдельно от `mirrorSite`, потому что нужно и своей странице: в песочнице
 * браузер не может сходить за шрифтами на Google Fonts (тот же корневой
 * сертификат), и снимок выходил набранным системным шрифтом — то есть ровно
 * тем, от чего мы уходили. Снимок, на котором шрифт не тот, хуже отсутствия
 * снимка: по нему принимают решение о странице, которой не существует.
 */
export async function localizeHtml(html, baseUrl, dir) {
  return rewrite(html, new URL(baseUrl), dir, { stripScripts: false });
}

export async function mirrorSite(url, dir) {
  const page = await grab(url);
  const base = new URL(page.url);
  const html = await rewrite(await page.text(), base, dir, { stripScripts: true });

  const file = path.join(dir, "index.html");
  await writeFile(file, html, "utf8");
  return { file, finalUrl: page.url };
}

async function rewrite(source, base, dir, { stripScripts }) {
  await mkdir(path.join(dir, "a"), { recursive: true });
  let html = source;
  const done = new Map();
  const save = async (raw, from) => {
    let absolute;
    try {
      absolute = new URL(raw, from).href;
    } catch {
      return null;
    }
    if (!/^https?:/.test(absolute)) return null;
    if (done.has(absolute)) return done.get(absolute);
    try {
      const asset = await grab(absolute);
      const name = localName(absolute, "asset");
      await writeFile(path.join(dir, "a", name), Buffer.from(await asset.arrayBuffer()));
      done.set(absolute, `a/${name}`);
      return `a/${name}`;
    } catch {
      done.set(absolute, null);
      return null;
    }
  };

  // Скрипты снимаются первыми: иначе их адреса попадут в список ссылок и
  // будут скачаны зря. Своей странице скрипты нужны — там снимать нечего.
  if (stripScripts) {
    html = html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<noscript[\s\S]*?<\/noscript>/gi, "");
  }

  for (const tag of [...html.matchAll(/<link[^>]+rel=["']?stylesheet["']?[^>]*>/gi)].map((m) => m[0])) {
    const href = tag.match(/href\s*=\s*["']([^"']+)["']/i)?.[1];
    if (!href) continue;
    let cssUrl;
    try {
      cssUrl = new URL(href, base).href;
    } catch {
      continue;
    }
    try {
      const css = await (await grab(cssUrl)).text();
      const cssBase = new URL(cssUrl);
      let rewritten = css;
      const inner = [...new Set([...css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)].map((m) => m[1]))];
      for (const reference of inner.slice(0, 40)) {
        if (reference.startsWith("data:")) continue;
        const local = await save(reference, cssBase);
        // Стили лежат в той же папке `a/`, что и шрифты, поэтому путь без неё.
        if (local) rewritten = rewritten.split(reference).join(local.replace(/^a\//, ""));
      }
      const name = localName(cssUrl, "style.css");
      await writeFile(path.join(dir, "a", name), rewritten, "utf8");
      html = html.replace(tag, `<link rel="stylesheet" href="a/${name}">`);
    } catch {
      html = html.replace(tag, "");
    }
  }

  const images = [...new Set([...html.matchAll(/<img[^>]+src\s*=\s*["']([^"']+)["']/gi)].map((m) => m[1]))];
  for (const src of images.slice(0, 30)) {
    const local = await save(src, base);
    if (local) html = html.split(`"${src}"`).join(`"${local}"`);
  }

  return html;
}
