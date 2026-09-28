import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { cabinetCopy } from "@/content/partner-cabinet";
import { getDictionary } from "@/content/dictionaries";
import { AUDIT_ACTIONS } from "@/lib/admin/audit";
import { helpTopicFor } from "@/lib/admin/help";
import { ACTION_LABEL } from "@/lib/admin/journal";
import { locales } from "@/lib/i18n";
import {
  PROMO_BUCKET,
  PROMO_LOCALES,
  PROMO_MAX_BYTES,
  PROMO_MIME,
  isPromoPath,
  promoCaption,
  promoFileName,
  promoForLocale,
  promoKind,
  promoPath,
  promoShape,
  promoSize,
} from "@/lib/partners/promo-rules";

/**
 * Промо-материалы партнёров.
 *
 * Владелец, 28.09: «давай сделаем раздел „промо материалы“ для реферальных
 * партнёров, чтобы они могли брать оттуда видео, например, для залива в
 * соцсети… что-то вроде хранилища внутри, пусть распространяют».
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

test("типы и предел файла — те же, что у бакета в миграции", () => {
  const sql = read("supabase/migrations/0066_partner_promo.sql");
  const bucket = /values \(\s*'partner-promo', 'partner-promo', false, (\d+),\s*array\[([^\]]+)\]/.exec(sql);
  assert.ok(bucket, "в миграции нет бакета partner-promo");
  assert.equal(PROMO_BUCKET, "partner-promo");
  assert.equal(Number(bucket[1]), PROMO_MAX_BYTES, "форма разрешит то, что бакет отвергнет");
  const mimes = bucket[2].split(",").map((m) => m.trim().replace(/'/g, ""));
  assert.deepEqual([...mimes].sort(), Object.keys(PROMO_MIME).sort());
  // И колонка mime в таблице — тот же список.
  for (const mime of Object.keys(PROMO_MIME)) assert.ok(sql.includes(`'${mime}'`), mime);
  // Бакет приватный: скрытый материал не должен жить по однажды скопированному адресу.
  assert.match(sql, /set public = false/);
  assert.match(sql, /locale in \('all', 'ru', 'uz', 'en', 'zh'\)/);
  assert.deepEqual([...PROMO_LOCALES], ["all", "ru", "uz", "en", "zh"]);
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
  assert.match(view, /href=\{`\/api\/partners\/promo\/\$\{material\.id\}\?l=\$\{locale\}`\}/);
  assert.match(view, /code === "media_gone"/);
});

test("скачивание: только вошедший партнёр, скрытое не отдаётся, каждое — в журнал", () => {
  const route = read("app/api/partners/promo/[id]/route.ts");
  const partnerAt = route.indexOf("await currentPartner()");
  const downloadAt = route.indexOf("await promoDownload(id, partner)");
  assert.ok(partnerAt > 0 && downloadAt > partnerAt, "файл отдаётся до проверки входа");
  assert.match(route, /if \(!partner\) return NextResponse\.redirect\(absoluteUrl\(/);
  assert.match(route, /absoluteUrl\(`\$\{locale\}\/partners\/cabinet\?r=media_gone#media`\)/);

  const store = read("lib/partners/promo.ts");
  const download = store.slice(store.indexOf("export async function promoDownload"));
  assert.match(download, /if \(!data \|\| data\.hidden\) return null;/);
  assert.match(download, /from\("partner_promo_downloads"\)\.insert\(\{ promo_id: id, partner_id: partner\.id \}\)/);
  assert.match(download, /createSignedUrl\(String\(data\.storage_path\), 120, \{/);
});

/* ── Панель ─────────────────────────────────────────────────────────────── */

test("панель: только владелец, файл идёт мимо сервера, регистрация — после проверки файла", () => {
  const actions = read("app/admin/partners/promo/actions.ts");
  const bodies = actions.split("export async function ").slice(1);
  assert.equal(bodies.length, 5);
  for (const body of bodies) {
    assert.match(body, /^\w+\([^)]*[\s\S]*?\{\s*(const admin = )?await requireAdmin\(\);/, `${body.slice(0, 30)}: без requireAdmin`);
  }
  // Сам файл через server action не идёт: nginx пустил бы в панель 25 МБ, action — 22.
  assert.match(actions, /promoTicketAction\(input: \{ mime: string; bytes: number \}\)/);

  const upload = read("components/admin/promo-upload.tsx");
  assert.match(upload, /xhr\.open\("PUT", url\)/);
  assert.match(upload, /file\.size > PROMO_MAX_BYTES/, "форма не проверяет размер до загрузки");

  const store = read("lib/partners/promo.ts");
  const register = store.slice(store.indexOf("export async function registerPromo"));
  assert.ok(
    register.indexOf("isPromoPath(input.path)") < register.indexOf("probeObject(PROMO_BUCKET, input.path)") &&
      register.indexOf("probeObject(PROMO_BUCKET, input.path)") < register.indexOf('.from("partner_promo")'),
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
