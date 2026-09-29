import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { PromoUpload } from "@/components/admin/promo-upload";
import { PanelLocaleProvider } from "@/components/admin/panel-locale";
import { ShotState } from "@/components/admin/razbor-shots";
import { loginDict } from "@/content/admin-panel/login";
import {
  partnersDict,
  partnersResultDict,
  perkDict,
  promoDict,
  promoFailDict,
  promoFailText,
  promoLocaleDict,
  promoResultDict,
  promoUploadDict,
  usd,
} from "@/content/admin-panel/partners";
import { protoDict, protoResultDict, wheelToken } from "@/content/admin-panel/proto";
import { razborDict, razborResultDict } from "@/content/admin-panel/razbor";
import { releaseResultDict, releasesDict } from "@/content/admin-panel/releases";
import { PANEL_LOCALES, type PanelLocale, type Tr } from "@/lib/admin/i18n";
import { wheelIssues, wheelProblems } from "@/lib/proto/facts";

/**
 * Партнёры, промо-материалы, релизы, прототипы, разборы и вход — на трёх
 * языках.
 *
 * Страницы ходят в базу и без неё не рисуются, поэтому для них — проверка
 * исходника (вне комментариев русского нет, всё из словаря) и сверка кодов
 * ответов действий со словарём. Что рисуется из пропсов — форма загрузки
 * промо и строка снимков разбора — рисуется на каждом языке.
 */

const CYRILLIC = /[а-яё]/i;
const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

/* ── Словари ────────────────────────────────────────────────────────────── */

/** Строка словаря на языке: функции зовутся с образцовыми аргументами. */
function sample(value: unknown): string {
  return typeof value === "function" ? String((value as (...args: unknown[]) => string)("1", 2, 3)) : String(value);
}

const DICTS: Record<string, Record<string, Tr<unknown>>> = {
  partnersDict,
  partnersResultDict,
  perkDict,
  promoDict,
  promoResultDict,
  promoLocaleDict,
  promoUploadDict,
  promoFailDict,
  releasesDict,
  releaseResultDict,
  protoDict,
  protoResultDict,
  razborDict,
  razborResultDict,
  loginDict,
};

test("словари разделов: в узбекском и польском нет кириллицы, у каждого ключа три языка", () => {
  for (const [name, dict] of Object.entries(DICTS)) {
    for (const [key, entry] of Object.entries(dict)) {
      for (const locale of PANEL_LOCALES) assert.ok(entry[locale] !== undefined, `${name}.${key}: нет ${locale}`);
      assert.equal(typeof entry.uz, typeof entry.ru, `${name}.${key}: uz другого вида`);
      assert.equal(typeof entry.pl, typeof entry.ru, `${name}.${key}: pl другого вида`);
      for (const locale of ["uz", "pl"] as const) {
        const text = sample(entry[locale]);
        assert.ok(!CYRILLIC.test(text), `${name}.${key} ${locale}: русское «${text.match(/\S*[а-яё]\S*/i)}»`);
      }
    }
  }
});

test("узбекский — с o‘ и g‘ через ‘, а не через апостроф", () => {
  for (const [name, dict] of Object.entries(DICTS)) {
    for (const [key, entry] of Object.entries(dict)) {
      const text = sample(entry.uz);
      assert.doesNotMatch(text, /\b[oOgG]'/, `${name}.${key}: «o'»/«g'» вместо «o‘»/«g‘»: ${text}`);
    }
  }
});

test("русский текст прежний там, где на него ссылается инструкция", () => {
  assert.equal(partnersDict.extend.ru, "Продлить на 12 месяцев");
  assert.equal(partnersDict.markPaid.ru, "Выплачено");
  assert.equal(partnersDict.agenciesTitle.ru, "Агентства партнёров");
  assert.equal(promoDict.show.ru, "Показать партнёрам");
  assert.equal(promoDict.removeForever.ru, "Удалить насовсем");
  assert.equal(releasesDict.publishTitle.ru, "Выложить релиз");
  assert.equal(protoDict.build.ru, "Собрать прототип");
  assert.equal(protoDict.opened.ru("13.09.26, 18:04", 3), "открыл 13.09.26, 18:04, заходов: 3");
  assert.equal(razborDict.unpublish.ru, "Снять с публикации");
  assert.equal(razborDict.onReview.ru(2), "На проверке · 2");
  assert.equal(loginDict.title.ru, "Вход в панель");
});

test("суммы — в формате языка панели", () => {
  assert.equal(usd(null, "pl"), "—");
  for (const locale of PANEL_LOCALES) assert.match(usd(2500, locale), /^2\s?500 \$$/, locale);
  assert.equal(usd(12, "ru"), "12 $");
});

/* ── Ответы действий ───────────────────────────────────────────────────── */

/** Литералы-коды из вызовов `back(…)` / `redirect("…?r=…")` в действиях. */
function actionCodes(source: string): Set<string> {
  const codes = new Set<string>();
  for (const [, args] of source.matchAll(/\bback\(([^;]*?)\);?\n/g)) {
    // Код — литерал сам по себе или ветка тернарника; `=== "x"` — сравнение, не код.
    for (const [, code] of args.matchAll(/(?:^|\(|\? |: )"([a-z_]+)"/g)) codes.add(code);
  }
  for (const [, code] of source.matchAll(/\?r=([a-z_]+)/g)) codes.add(code);
  return codes;
}

/** Коды причин из объявления `reason: "a" | "b"` / `why: "a" | "b"` в функции lib. */
function reasonsOf(source: string, fn: string, field = "reason"): string[] {
  const at = source.indexOf(`export async function ${fn}(`);
  assert.ok(at >= 0, `нет ${fn}`);
  const head = source.slice(at, source.indexOf("{\n", source.indexOf("Promise<", at)));
  const union = head.match(new RegExp(`${field}: ((?:"[a-z_]+"(?: \\| )?)+)`));
  assert.ok(union, `${fn}: не нашёл ${field}`);
  return [...union[1].matchAll(/"([a-z_]+)"/g)].map((m) => m[1]);
}

test("партнёры: каждый код ответа действия есть в словаре", () => {
  const codes = actionCodes(read("app/admin/partners/actions.ts"));
  const store = read("lib/partners/store.ts");
  for (const fn of ["createPartner", "updatePartner", "decidePayout", "decideAgency"]) {
    for (const reason of reasonsOf(store, fn)) codes.add(reason);
  }
  for (const code of ["created", "paid", "rejected", "invalid", "agency_active", "agency_rejected", "offline"]) {
    assert.ok(codes.has(code), `регэксп не нашёл «${code}» — действия поменялись, поправьте тест`);
  }
  for (const code of codes) assert.ok(code in partnersResultDict, `нет текста для ?r=${code}`);
});

test("промо: коды ответов и причины загрузки — в словаре", () => {
  const codes = actionCodes(read("app/admin/partners/promo/actions.ts"));
  const store = read("lib/partners/promo.ts");
  for (const fn of ["updatePromo", "deletePromo"]) for (const reason of reasonsOf(store, fn)) codes.add(reason);
  for (const code of ["saved", "hidden", "shown", "deleted", "invalid", "gone"]) {
    assert.ok(codes.has(code), `регэксп не нашёл «${code}»`);
  }
  for (const code of codes) assert.ok(code in promoResultDict, `нет текста для ?r=${code}`);

  // Причины отказа загрузки: объявлены в promo-files.ts, текст — в словаре.
  const files = read("lib/partners/promo-files.ts");
  const union = files.slice(files.indexOf("export type PromoReason ="), files.indexOf("export type PromoFail"));
  const reasons = [...union.matchAll(/"([a-z_]+)"/g)].map((m) => m[1]);
  assert.ok(reasons.length >= 20, `причин: ${reasons.length}`);
  for (const reason of reasons) assert.ok(reason in promoFailDict, `нет текста для причины ${reason}`);
  const upload = store.slice(store.indexOf("export async function promoStart("), store.indexOf("export async function updatePromo("));
  for (const source of [files, upload, read("app/admin/partners/promo/actions.ts")]) {
    for (const [, reason] of source.matchAll(/reason: "([a-z_]+)"/g)) assert.ok(reasons.includes(reason), reason);
  }
  assert.equal(promoFailText({ reason: "no_space", detail: "1.5" }, "pl"), promoFailDict.no_space.pl("1.5"));
  assert.match(promoFailText({ reason: "network" }, "uz"), /aloqa uzildi/);
});

test("релизы: каждая причина из lib — в словаре, в адрес уходит код", () => {
  const lib = read("lib/store/releases.ts");
  const union = lib.slice(lib.indexOf("export type ReleaseFailure"), lib.indexOf("};", lib.indexOf("export type ReleaseFailure")));
  const reasons = [...union.matchAll(/"([a-z_]+)"/g)].map((m) => m[1]);
  assert.ok(reasons.length >= 6);
  for (const reason of [...reasons, "ok"]) assert.ok(reason in releaseResultDict, `нет текста для ?r=${reason}`);
  for (const [, reason] of lib.matchAll(/reason: "([a-z_]+)"/g)) assert.ok(reasons.includes(reason), reason);
  assert.match(read("app/admin/releases/actions.ts"), /\?r=\$\{result\.reason\}/);
});

test("прототипы: коды ответов в словаре, претензии к снимку — на языке панели", () => {
  const codes = actionCodes(read("app/admin/proto/actions.ts"));
  const store = read("lib/proto/store.ts");
  const failure = store.slice(store.indexOf("export type SaveFailure"));
  for (const [, reason] of failure.split(";")[0].matchAll(/"([a-z_]+)"/g)) codes.add(reason);
  for (const code of ["no_url", "wheel", "draft", "not_ready", "missing"]) assert.ok(codes.has(code), code);
  for (const code of codes) assert.ok(code in protoResultDict, `нет текста для ?r=${code}`);

  const image = { url: "https://devuz.studio/w.jpg", width: 600, height: 900 };
  const detail = wheelIssues(image).map(wheelToken).join(",");
  assert.equal(detail, "square:600x900,small:600,format");
  // Русский текст машинной проверки — прежний: он пишется в базу.
  assert.equal(protoResultDict.wheel.ru(detail), `Снимок для трюка: ${wheelProblems(image).join("; ")}.`);
  assert.match(protoResultDict.wheel.uz(detail), /600×900/);
  assert.equal(protoResultDict.missing.pl("name,action"), "Brakuje: nazwa firmy, Telegram, WhatsApp lub telefon do przycisku.");
});

test("разборы: коды ответов действий есть в словаре", () => {
  const codes = actionCodes(read("app/admin/razbor/actions.ts"));
  const store = read("lib/razbor/store.ts");
  const failure = store.slice(store.indexOf("export type RazborFailure"));
  for (const [, reason] of failure.slice(0, failure.indexOf("};")).matchAll(/"([a-z_]+)"/g)) codes.add(reason);
  for (const code of ["ok", "unpublished", "deleted", "saved", "confirm", "thin", "missing", "half"]) {
    assert.ok(codes.has(code), `регэксп не нашёл «${code}»`);
  }
  for (const code of codes) assert.ok(code in razborResultDict, `нет текста для ?r=${code}`);
  // Ни одного русского текста в адресе ответа.
  assert.doesNotMatch(read("app/admin/razbor/actions.ts"), /encodeURIComponent\("[^"]*[а-яё]/i);
});

/* ── Компоненты из пропсов ─────────────────────────────────────────────── */

/**
 * Форма загрузки зовёт useRouter — без контекста роутера Next он падает.
 * Контекст берётся через require: тот же модуль, что у next/navigation.
 */
const { AppRouterContext } = createRequire(import.meta.url)(
  "next/dist/shared/lib/app-router-context.shared-runtime",
) as typeof import("next/dist/shared/lib/app-router-context.shared-runtime");

const router = {
  back() {},
  forward() {},
  refresh() {},
  push() {},
  replace() {},
  prefetch() {},
};

function render(locale: PanelLocale, el: ReactElement): string {
  return renderToStaticMarkup(
    createElement(
      AppRouterContext.Provider,
      { value: router as never },
      createElement(PanelLocaleProvider, { locale, children: el }),
    ),
  );
}

function assertNoRussian(html: string, where: string) {
  const text = html.replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/g, " ");
  assert.ok(!CYRILLIC.test(text), `${where}: русское на экране: ${text.match(/\S*[а-яё]\S*/i)}`);
  for (const [, attr] of html.matchAll(/(?:title|aria-label|data-label|placeholder)="([^"]*)"/g)) {
    assert.ok(!CYRILLIC.test(attr), `${where}: русская подпись «${attr}»`);
  }
}

function parts(): Record<string, ReactElement> {
  const noop = async () => ({ ok: false as const, reason: "failed" as const });
  return {
    PromoUpload: createElement(PromoUpload, {
      start: noop,
      chunk: noop,
      discard: async () => undefined,
      register: noop,
      captionHint: "devuz.studio/r/…",
    }),
    "ShotState есть": createElement(ShotState, { shots: { before: true, after: true, findings: 3 } }),
    "ShotState нет": createElement(ShotState, { shots: { before: false, after: false, findings: 0 } }),
  };
}

test("форма загрузки промо и строка снимков: на узбекском и польском без русского", () => {
  for (const locale of ["uz", "pl"] as const) {
    for (const [name, el] of Object.entries(parts())) {
      const props = { ...(el.props as object), locale };
      assertNoRussian(render(locale, createElement(el.type, props)), `${locale} ${name}`);
    }
  }
});

test("форма загрузки промо и строка снимков: русский как был", () => {
  const html = Object.values(parts())
    .map((el) => render("ru", el))
    .join("\n");
  for (const text of [
    "Язык слов в ролике",
    "Сообщить партнёрам в Telegram, что появился новый материал",
    "без слов",
    "Загрузить",
    "снимки: есть, по находкам 3",
    "нет снимка «как есть» и макета",
  ]) {
    assert.ok(html.includes(text), `нет «${text}»`);
  }
  const uz = render("uz", createElement(ShotState, { shots: { before: false, after: true, findings: 0 }, locale: "uz" }));
  assert.match(uz, /«hozirgi holat» skrinshoti yo‘q/);
});

/* ── Страницы: весь текст из словаря ───────────────────────────────────── */

test("страницы раздела: русский текст только в комментариях, всё остальное — из словаря", () => {
  const files = [
    "app/admin/partners/page.tsx",
    "app/admin/partners/actions.ts",
    "app/admin/partners/promo/page.tsx",
    "app/admin/partners/promo/actions.ts",
    "components/admin/promo-upload.tsx",
    "app/admin/releases/page.tsx",
    "app/admin/releases/actions.ts",
    "app/admin/proto/page.tsx",
    "app/admin/proto/actions.ts",
    "app/admin/razbor/page.tsx",
    "app/admin/razbor/actions.ts",
    "app/admin/razbor/[id]/page.tsx",
    "components/admin/razbor-shots.tsx",
    "app/admin/login/page.tsx",
    "app/admin/login/actions.ts",
    "app/admin/enter/[[...to]]/route.ts",
    "lib/partners/promo-files.ts",
    "lib/store/releases.ts",
  ];
  // Сообщения партнёру в Telegram — продукт партнёра, не панель: они
  // остаются на его языке (сейчас русском), их тут не проверяем.
  const partnerMessages = /notifyPartner\([\s\S]*?\n\s*\);/g;
  for (const file of files) {
    const code = read(file)
      .replace(partnerMessages, "")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "")
      .replace(/\s\/\/ .*$/gm, "")
      // console.error — журнал сервера, а не экран.
      .replace(/console\.(?:error|warn|log)\([^;]*\);/g, "");
    const line = code.split("\n").find((l) => CYRILLIC.test(l));
    assert.equal(line, undefined, `${file}: русский текст мимо словаря: ${line?.trim()}`);
  }
  assert.match(read("app/admin/partners/page.tsx"), /const t = pick\(partnersDict, locale\)/);
  assert.match(read("app/admin/razbor/page.tsx"), /const t = pick\(razborDict, locale\)/);
  // Вход: сотрудника ещё нет — язык из куки-зеркала.
  assert.match(read("app/admin/login/page.tsx"), /panelLocale\(\(await cookies\(\)\)\.get\(PANEL_LANG_COOKIE\)\?\.value\)/);
});
