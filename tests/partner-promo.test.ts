import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

import { cabinetCopy } from "@/content/partner-cabinet";
import { getDictionary } from "@/content/dictionaries";
import { AUDIT_ACTIONS } from "@/lib/admin/audit";
import { helpTopicFor } from "@/lib/admin/help";
import { ACTION_LABEL } from "@/lib/admin/journal";
import { locales } from "@/lib/i18n";
import {
  appendChunk,
  fileStream,
  finishUpload,
  parseRange,
  promoFilePath,
  signatureMatches,
  startUpload,
} from "@/lib/partners/promo-files";
import {
  PROMO_CHUNK_BYTES,
  PROMO_LOCALES,
  PROMO_MAX_BYTES,
  PROMO_MIME,
  isPromoPath,
  promoCaption,
  promoFileName,
  promoForLocale,
  promoKind,
  promoPath,
  promoAdminFileUrl,
  promoFileUrl,
  promoShape,
  promoSize,
} from "@/lib/partners/promo-rules";

/**
 * Промо-материалы партнёров.
 *
 * Владелец, 28.09: «давай сделаем раздел „промо материалы“ для реферальных
 * партнёров, чтобы они могли брать оттуда видео, например, для залива в
 * соцсети… что-то вроде хранилища внутри, пусть распространяют».
 * И 29.09: «зачем Supabase? Мы не можем просто разместить на сервере… там
 * же лимит 50 МБ» — файлы на диске нашего сервера.
 */

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const ID = "1a2b3c4d-0000-4000-8000-000000000000";

/* ── Файл и путь ────────────────────────────────────────────────────────── */

test("путь файла придумывает сервер, и зарегистрировать можно только такой путь", () => {
  const path = promoPath("video/mp4", ID, new Date("2026-09-28T12:00:00Z"));
  assert.equal(path, `2026/09/${ID}.mp4`);
  assert.ok(isPromoPath(path!));
  assert.equal(promoPath("video/quicktime", ID, new Date("2026-01-05T00:00:00Z")), `2026/01/${ID}.mov`);

  // Чужой тип, чужое имя, выход из папки — мимо.
  assert.equal(promoPath("application/pdf", ID), null);
  assert.equal(promoPath("video/mp4", "../../etc"), null);
  for (const bad of ["../2026/09/x.mp4", `private/${ID}.mp4`, `2026/09/${ID}.exe`, `2026/09/${ID}.mp4/../a`, "IMG_4411 (2).MOV"]) {
    assert.equal(isPromoPath(bad), false, bad);
  }
});

test("типы — те же, что в базе; предел — наш, кусок проходит nginx и server action", () => {
  const sql = read("supabase/migrations/0066_partner_promo.sql");
  for (const mime of Object.keys(PROMO_MIME)) assert.ok(sql.includes(`'${mime}'`), `${mime}: база не примет такую строку`);
  assert.match(sql, /locale in \('all', 'ru', 'uz', 'en', 'zh'\)/);
  assert.deepEqual([...PROMO_LOCALES], ["all", "ru", "uz", "en", "zh"]);

  // Не потолок бесплатного Supabase, а свой.
  assert.equal(PROMO_MAX_BYTES, 500 * 1024 * 1024);
  // Кусок меньше лимита server action (next.config) и nginx для /admin.
  const actionLimit = Number(/bodySizeLimit: "(\d+)mb"/.exec(read("next.config.ts"))![1]) * 1024 * 1024;
  const nginxAdmin = Number(/location \/admin \{\s*client_max_body_size (\d+)m;/.exec(read("deploy/nginx-devuz.conf"))![1]) * 1024 * 1024;
  assert.ok(PROMO_CHUNK_BYTES * 1.1 < actionLimit, "кусок не пройдёт server action");
  assert.ok(PROMO_CHUNK_BYTES * 1.1 < nginxAdmin, "кусок не пройдёт nginx");
});

/* ── Файлы на диске ─────────────────────────────────────────────────────── */

const MP4_HEAD = Uint8Array.from([0, 0, 0, 0x20, ...Buffer.from("ftypisom")]);

function withMedia<T>(fn: (root: string) => Promise<T>): Promise<T> {
  const root = mkdtempSync(path.join(tmpdir(), "promo-"));
  const before = process.env.MEDIA_DIR;
  process.env.MEDIA_DIR = root;
  return fn(root).finally(() => {
    if (before === undefined) delete process.env.MEDIA_DIR;
    else process.env.MEDIA_DIR = before;
    rmSync(root, { recursive: true, force: true });
  });
}

test("загрузка кусками: повтор принятого куска не портит файл, дыра отвергается, целый файл — в promo/", () =>
  withMedia(async (root) => {
    const uploadId = "0a1b2c3d-0000-4000-8000-000000000001";
    const storage = `2026/09/${ID}.mp4`;
    const body = new Uint8Array(40);
    body.set(MP4_HEAD);
    assert.deepEqual(await startUpload({ uploadId, path: storage, mime: "video/mp4", bytes: 40 }), { ok: true });

    assert.deepEqual(await appendChunk(uploadId, 0, body.subarray(0, 16)), { ok: true, received: 16 });
    // Ответ потерялся, браузер прислал тот же кусок снова.
    assert.deepEqual(await appendChunk(uploadId, 0, body.subarray(0, 16)), { ok: true, received: 16 });
    // Кусок из будущего — дыра в файле.
    assert.equal((await appendChunk(uploadId, 32, body.subarray(32))).ok, false);
    // Недокачанный файл не публикуется.
    assert.equal((await finishUpload(uploadId)).ok, false);

    assert.deepEqual(await appendChunk(uploadId, 16, body.subarray(16)), { ok: true, received: 40 });
    // Лишний байт сверх заявленного — нет.
    assert.equal((await appendChunk(uploadId, 40, Uint8Array.from([1]))).ok, false);

    const done = await finishUpload(uploadId);
    assert.deepEqual(done, { ok: true, path: storage, mime: "video/mp4", bytes: 40 });
    assert.deepEqual(readFileSync(promoFilePath(storage)!), Buffer.from(body));
    assert.deepEqual(readdirSync(path.join(root, "tmp")), [], "во временной папке остался мусор");
  }));

test("под видом ролика не ляжет чужой файл; путь с «../» — мимо", () =>
  withMedia(async (root) => {
    const uploadId = "0a1b2c3d-0000-4000-8000-000000000002";
    const html = Buffer.from("<!doctype html><script>alert(1)</script>");
    await startUpload({ uploadId, path: `2026/09/${ID}.mp4`, mime: "video/mp4", bytes: html.length });
    await appendChunk(uploadId, 0, html);
    const done = await finishUpload(uploadId);
    assert.equal(done.ok, false);
    assert.deepEqual(readdirSync(path.join(root, "promo")), []);

    assert.equal((await startUpload({ uploadId: "../../etc", path: `2026/09/${ID}.mp4`, mime: "video/mp4", bytes: 1 })).ok, false);
    assert.equal((await startUpload({ uploadId, path: "../../etc/passwd", mime: "video/mp4", bytes: 1 })).ok, false);
    assert.equal(promoFilePath("../../etc/passwd"), null);
    assert.equal((await startUpload({ uploadId, path: `2026/09/${ID}.mp4`, mime: "video/mp4", bytes: PROMO_MAX_BYTES + 1 })).ok, false);
  }));

test("сигнатуры: ролики и картинки узнаются по первым байтам", () => {
  assert.ok(signatureMatches("video/mp4", MP4_HEAD));
  assert.ok(signatureMatches("video/quicktime", Uint8Array.from([0, 0, 0, 0x14, ...Buffer.from("ftypqt  ")])));
  assert.ok(signatureMatches("video/webm", Uint8Array.from([0x1a, 0x45, 0xdf, 0xa3, 0, 0, 0, 0])));
  assert.ok(signatureMatches("image/png", Uint8Array.from([0x89, ...Buffer.from("PNG"), 0x0d, 0x0a])));
  assert.ok(signatureMatches("image/jpeg", Uint8Array.from([0xff, 0xd8, 0xff, 0xe0])));
  assert.ok(signatureMatches("image/webp", Uint8Array.from([...Buffer.from("RIFF"), 0, 0, 0, 0, ...Buffer.from("WEBP")])));
  assert.ok(signatureMatches("image/gif", Uint8Array.from(Buffer.from("GIF89a"))));
  assert.equal(signatureMatches("video/mp4", Uint8Array.from(Buffer.from("<!doctype html>"))), false);
  assert.equal(signatureMatches("image/png", MP4_HEAD), false);
});

test("поток отдаёт ровно запрошенный кусок файла", () =>
  withMedia(async (root) => {
    const file = path.join(root, "clip.bin");
    const bytes = Uint8Array.from({ length: 256 }, (_, i) => i);
    writeFileSync(file, bytes);
    const part = new Uint8Array(await new Response(fileStream(file, 10, 19)).arrayBuffer());
    assert.deepEqual([...part], [...bytes.subarray(10, 20)]);
    const whole = new Uint8Array(await new Response(fileStream(file, 0, 255)).arrayBuffer());
    assert.equal(whole.length, 256);
  }));

test("диапазоны: перемотка и докачка берут кусок файла, чужой диапазон — 416", () => {
  assert.equal(parseRange(null, 100), null);
  assert.deepEqual(parseRange("bytes=0-", 100), { start: 0, end: 99 });
  assert.deepEqual(parseRange("bytes=10-19", 100), { start: 10, end: 19 });
  assert.deepEqual(parseRange("bytes=90-500", 100), { start: 90, end: 99 });
  assert.deepEqual(parseRange("bytes=-10", 100), { start: 90, end: 99 });
  assert.equal(parseRange("bytes=100-", 100), "bad");
  assert.equal(parseRange("bytes=20-10", 100), "bad");
  assert.equal(parseRange("items=0-5", 100), null);
});

test("вид и форма кадра", () => {
  assert.equal(promoKind("video/mp4"), "video");
  assert.equal(promoKind("image/png"), "image");
  assert.equal(promoShape(1080, 1920), "vertical");
  assert.equal(promoShape(1080, 1350), "vertical");
  assert.equal(promoShape(1080, 1080), "square");
  assert.equal(promoShape(1920, 1080), "horizontal");
  assert.equal(promoShape(null, 1080), null);
});

test("имя скачанного файла — латиницей, с расширением и кусочком id", () => {
  assert.equal(promoFileName("Ролик «Кто мы» за 28 секунд", ID, "video/mp4"), "devuz-rolik-kto-my-za-28-sekund-1a2b3c.mp4");
  assert.equal(promoFileName("Орбита", ID, "video/quicktime"), "devuz-orbita-1a2b3c.mov");
  assert.equal(promoFileName("你好", ID, "image/png"), "devuz-1a2b3c.png");
  assert.match(promoFileName("x".repeat(200), ID, "image/jpeg"), /^devuz-x{40}-1a2b3c\.jpg$/);
});

test("размер: запятая по-русски и по-узбекски, точка — по-английски", () => {
  assert.equal(promoSize(12_700_000, "МБ"), "12,1 МБ");
  assert.equal(promoSize(12_700_000, "MB", false), "12.1 MB");
  assert.equal(promoSize(null, "МБ"), "");
});

/* ── Подпись со ссылкой партнёра ────────────────────────────────────────── */

test("подпись: {link} — ссылка партнёра; забыли {link} — ссылка последней строкой; пусто — по умолчанию", () => {
  const link = "https://devuz.studio/r/ivan";
  const fallback = (url: string) => `По умолчанию: ${url}`;
  assert.equal(promoCaption("Сайты под ключ: {link}. Ещё раз: {link}", fallback, link), `Сайты под ключ: ${link}. Ещё раз: ${link}`);
  assert.equal(promoCaption("Сайты под ключ", fallback, link), `Сайты под ключ\n\n${link}`);
  assert.equal(promoCaption("   ", fallback, link), `По умолчанию: ${link}`);
  assert.equal(promoCaption(null, fallback, link), `По умолчанию: ${link}`);

  for (const locale of locales) {
    const text = cabinetCopy(locale).mediaCaption(link);
    assert.ok(text.includes(link), `${locale}: подпись по умолчанию без ссылки`);
    assert.ok(text.length < 300, `${locale}: подпись длиннее, чем влезает в сторис`);
  }
});

test("порядок: сначала язык партнёра и «без слов», потом остальные — ничего не прячем", () => {
  const items = [
    { id: "a", locale: "ru" },
    { id: "b", locale: "uz" },
    { id: "c", locale: "all" },
    { id: "d", locale: "en" },
    { id: "e", locale: "uz" },
  ];
  assert.deepEqual(promoForLocale(items, "uz").map((i) => i.id), ["b", "c", "e", "a", "d"]);
  assert.deepEqual(promoForLocale(items, "ru").map((i) => i.id), ["a", "c", "b", "d", "e"]);
  assert.equal(promoForLocale(items, "zh").length, items.length);
});

/* ── Кабинет ────────────────────────────────────────────────────────────── */

test("кабинет: блок на всех языках, только открытые материалы, скачивание — через сервер", () => {
  for (const locale of locales) {
    const t = cabinetCopy(locale);
    for (const key of ["mediaTitle", "mediaLead", "mediaDownload", "mediaCopyCaption", "mediaCaptionTitle", "mediaGone"] as const) {
      assert.ok(t[key], `${locale}: нет ${key}`);
    }
    for (const locale2 of PROMO_LOCALES) assert.ok(t.mediaLang[locale2], `${locale}: язык ${locale2} без названия`);
    // Публичная страница программы рассказывает о материалах.
    assert.ok(getDictionary(locale).partners.cabinetPoints.some((p) => /Reels/.test(p)), `${locale}: на странице программы нет пункта`);
  }

  const page = read("app/[locale]/partners/cabinet/page.tsx");
  assert.match(page, /listPromo\(\{ withHidden: false \}\)/, "партнёр увидел бы скрытые материалы");
  assert.match(page, /promoForLocale\(promo, locale\)/);

  const view = read("components/partners/cabinet-view.tsx");
  // Пустой блок партнёру не показываем.
  assert.match(view, /\{media\.length \? \(\s*<section id="media"/);
  assert.match(view, /promoCaption\(material\.caption, t\.mediaCaption, mainUrl\)/, "подпись без ссылки партнёра");
  assert.match(view, /href=\{promoFileUrl\(material\.id, true, locale\)\}/);
  assert.equal(promoFileUrl(ID, true, "uz"), `/media/promo/${ID}?dl=1&l=uz`);
  assert.equal(promoFileUrl(ID), `/media/promo/${ID}`);
  assert.match(view, /code === "media_gone"/);
});

test("раздача: партнёру — открытое и после входа, владельцу — под /admin, скачивание — в журнал один раз", () => {
  const route = read("app/media/promo/[id]/route.ts");
  const authAt = route.indexOf("if (!partner)");
  const serveAt = route.indexOf("return servePromo(");
  assert.ok(authAt > 0 && serveAt > authAt, "файл отдаётся до проверки входа");
  assert.match(route, /if \(!material \|\| material\.hidden\)/, "партнёр скачал бы скрытый материал");
  assert.match(route, /onFirstByte: download \? \(\) => logPromoDownload\(material\.id, partner\) : undefined/);
  assert.match(route, /absoluteUrl\(`\$\{locale\}\/partners\/cabinet\$\{query\}`\)/);

  const serve = read("lib/partners/promo-serve.ts");
  assert.match(serve, /if \(!range \|\| range\.start === 0\) await options\.onFirstByte\?\.\(\);/);
  assert.match(serve, /status: range \? 206 : 200/);

  // Кука панели живёт только на /admin — превью владельца отдаётся там же.
  const cookie = read("app/admin/login/actions.ts");
  assert.match(cookie, /path: "\/admin"/);
  const admin = read("app/admin/partners/promo/file/[id]/route.ts");
  assert.match(admin, /if \(staff\?\.role !== "admin"\) return new NextResponse\(null, \{ status: 404 \}\);/);
  assert.equal(promoAdminFileUrl(ID), `/admin/partners/promo/file/${ID}`);
  assert.match(read("app/admin/partners/promo/page.tsx"), /const preview = promoAdminFileUrl\(m\.id\);/);

  // /media/ — не языковая страница и не /api/ с лимитом в запрос в секунду.
  assert.match(read("middleware.ts"), /if \(pathname\.startsWith\("\/media\/"\)\) return NextResponse\.next\(\);/);
  assert.match(read("deploy/nginx-devuz.conf"), /location \/api\/ \{\s*limit_req zone=devuz_api/);
});

test("выкатка: папка на диске хоста, смонтирована в контейнер и отдана его пользователю", () => {
  const compose = read("docker-compose.yml");
  assert.match(compose, /- \$\{MEDIA_HOST_DIR:-\/var\/lib\/devuz\/media\}:\/app\/media/);
  assert.match(compose, /MEDIA_DIR: \/app\/media/);
  const deploy = read("scripts/vps-deploy.sh");
  assert.match(deploy, /chown -R 1001:1001 "\$MEDIA_HOST_DIR"/);
  // set -euo pipefail: пустая переменная в .env не должна обрывать выкатку.
  assert.match(deploy, /^set -euo pipefail$/m);
  assert.match(deploy, /MEDIA_HOST_DIR="\$\(envval MEDIA_HOST_DIR \|\| true\)"/);
  assert.match(read("Dockerfile"), /adduser -u 1001 -S nextjs/, "uid пользователя контейнера разошёлся с chown в выкатке");
  assert.ok(deploy.indexOf("chown -R 1001:1001") < deploy.indexOf("docker compose up -d"), "папка создаётся после старта контейнера");
  assert.match(read(".env.example"), /^MEDIA_HOST_DIR=$/m);
});

/* ── Панель ─────────────────────────────────────────────────────────────── */

test("панель: только владелец, файл — кусками на наш сервер, материал — после проверки файла", () => {
  const actions = read("app/admin/partners/promo/actions.ts");
  const bodies = actions.split("export async function ").slice(1);
  assert.equal(bodies.length, 7);
  for (const body of bodies) {
    assert.match(body, /^\w+\([^)]*[\s\S]*?\{\s*(const admin = )?await requireAdmin\(\);/, `${body.slice(0, 30)}: без requireAdmin`);
  }
  assert.match(actions, /promoStartAction\(input: \{ mime: string; bytes: number \}\)/);

  const upload = read("components/admin/promo-upload.tsx");
  assert.match(upload, /file\.slice\(offset, Math\.min\(offset \+ PROMO_CHUNK_BYTES, file\.size\)\)/);
  assert.match(upload, /file\.size > PROMO_MAX_BYTES/, "форма не проверяет размер до загрузки");
  assert.doesNotMatch(upload, /XMLHttpRequest|supabase/i);

  const store = read("lib/partners/promo.ts");
  assert.doesNotMatch(store, /\.storage\b|createSigned/, "промо-материалы снова ходят в хранилище Supabase");
  const register = store.slice(store.indexOf("export async function registerPromo"));
  assert.ok(
    register.indexOf("await finishUpload(input.uploadId)") < register.indexOf('.from("partner_promo")'),
    "запись материала раньше проверки файла",
  );

  for (const action of ["partner.promo_added", "partner.promo_updated", "partner.promo_deleted"] as const) {
    assert.ok((AUDIT_ACTIONS as readonly string[]).includes(action), action);
    assert.ok(ACTION_LABEL[action], `${action}: нет подписи в журнале`);
  }

  // Кнопка «Как пользоваться разделом» со страницы материалов ведёт в их пункт.
  assert.equal(helpTopicFor("/admin/partners/promo"), "/admin/help#partners-promo");
  assert.equal(helpTopicFor("/admin/partners"), "/admin/help#partners");
  assert.match(read("app/admin/partners/page.tsx"), /href="\/admin\/partners\/promo"/);
});
