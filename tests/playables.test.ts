/**
 * Играбельная реклама в кейсах — игры на экране айфона.
 *
 * Владелец, 09.10.2026: «Можем ли мы сделать такую игру и сделать её как
 * пример у нас в проектах? Даже лучше 2 игры… попадая на эту страницу в
 * наших кейсах открывается экран айфона и внутри экрана появляется эта
 * игра со всем чем надо».
 *
 * Игра в кейсе — тот же файл, что ушёл бы в рекламную сеть, поэтому и
 * правила у него сетевые: один HTML без внешних файлов, вес с запасом до
 * лимита в 5 МБ, кнопка, которая знает MRAID, Meta и Google. Плюс наши:
 * текст на шести языках сайта, без длинных тире и штампов ИИ (как у
 * макетов), и честная пометка «демо» — заказчика у этих игр нет.
 *
 * Запуск: npm test
 */
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { test } from "node:test";

import { cases, casesByDate, showcaseSlug } from "@/content/cases";
import { getDictionary } from "@/content/dictionaries";
import { locales } from "@/lib/i18n";
import { plainTextProblems } from "@/lib/proto/plain-text";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const playables = cases.filter((c) => c.playable);

/** Строки игры: объект `const T = {…};` из её HTML. */
function gameText(html: string): Record<string, Record<string, string>> {
  const m = html.match(/const T = (\{[\s\S]*?\n {2}\});/);
  assert.ok(m, "в игре нет словаря T");
  return new Function(`return ${m[1]}`)() as Record<string, Record<string, string>>;
}

test("две игры: «скачай приложение» и скидки с подарками", () => {
  assert.deepEqual(playables.map((c) => c.slug).sort(), ["gift-rush", "karvon-run"]);
});

test("игра — демо студии: без примера для писем и не на главной", () => {
  for (const item of playables) {
    assert.equal(item.demo, true, `${item.slug}: не помечен как демо`);
    assert.deepEqual([...item.forNiches], [], `${item.slug}: демо не пример ниши в письме клиенту`);
    assert.equal(item.url, undefined, `${item.slug}: у демо нет «живого сайта»`);
  }
  const home = casesByDate.filter((c) => c.slug !== showcaseSlug && !c.demo).slice(0, 6);
  assert.ok(home.every((c) => !c.playable), "игра попала в шестёрку главной");
  assert.match(read("app/[locale]/partners/deck/studio/page.tsx"), /!c\.demo/);
});

test("один файл без внешних ресурсов, вес — с запасом до лимита сетей", () => {
  for (const item of playables) {
    const src = item.playable!.src;
    assert.match(src, /^\/playables\/[a-z0-9-]+\/index\.html$/);
    const file = `public${src}`;
    const html = read(file);
    const bytes = statSync(new URL(`../${file}`, import.meta.url)).size;
    // Лимит сетей — 5 МБ; в описании кейса сказано «около 50 КБ».
    assert.ok(bytes < 80_000, `${item.slug}: ${bytes} байт — описание обещает около 50 КБ`);
    assert.doesNotMatch(html, /<(script|link|img|iframe)[^>]+(src|href)=/i, `${item.slug}: внешний файл в игре`);
    assert.doesNotMatch(html, /url\(\s*['"]?https?:/i, `${item.slug}: внешний ресурс в стилях`);
    assert.match(html, /<meta name="robots" content="noindex">/, `${item.slug}: голая игра без кейса в поиске не нужна`);
  }
});

test("кнопка рекламы знает MRAID, Meta и Google, на сайте — сообщает странице", () => {
  for (const item of playables) {
    const html = read(`public${item.playable!.src}`);
    for (const api of ["mraid.open", "FbPlayableAd.onCTAClick", "ExitApi.exit", 'mraid.getState() === "loading"']) {
      assert.ok(html.includes(api), `${item.slug}: нет ${api}`);
    }
    assert.match(html, /source: "devuz-playable", type: "cta"/);
    assert.match(html, /source: "devuz-playable", type: "event"/);
  }
  // Страница слушает только свою игру и только со своего сайта.
  const phone = read("components/cases/playable-phone.tsx");
  assert.match(phone, /event\.origin !== window\.location\.origin/);
  assert.match(phone, /event\.source !== frame\.current\?\.contentWindow/);
  assert.match(phone, /goal\("playable_cta"\)/);
});

test("тексты игры — на шести языках сайта, без тире и штампов ИИ", () => {
  for (const item of playables) {
    const T = gameText(read(`public${item.playable!.src}`));
    const keys = Object.keys(T.ru);
    for (const locale of locales) {
      assert.ok(T[locale], `${item.slug}: нет языка ${locale}`);
      assert.deepEqual(Object.keys(T[locale]).sort(), [...keys].sort(), `${item.slug} (${locale}): не те строки`);
      if (locale === "en" || locale === "uz" || locale === "pl") {
        for (const [key, text] of Object.entries(T[locale])) assert.ok(!/[а-яё]/i.test(text), `${item.slug} (${locale}.${key}): кириллица`);
      }
      const problems = plainTextProblems({ text: Object.values(T[locale]).join("\n") });
      assert.deepEqual(problems, [], `${item.slug} (${locale}): ${problems.map((p) => p.text).join("; ")}`);
    }
  }
});

test("страница кейса показывает игру на её языке, подписи — из словаря", () => {
  const page = read("app/[locale]/cases/[slug]/page.tsx");
  assert.match(page, /src=\{`\$\{item\.playable\.src\}\?lang=\$\{locale\}`\}/);
  // Владелец, 09.10.2026: строку «Демо-проект студии…» под описанием убрать,
  // а ссылку «Условия использования макетов» оставить: игра — тоже макет.
  assert.doesNotMatch(page, /playDemo/);
  assert.match(page, /localeHref\(locale, MOCKUP_TERMS_PATH\)/);
  for (const locale of locales) {
    const d = getDictionary(locale).cases;
    for (const key of ["playBadge", "playScreen", "playRestart", "playOpen", "playHint", "playCtaTitle", "playCtaText", "playCtaButton", "playClose"] as const) {
      assert.ok(d[key]?.trim(), `${locale}: нет cases.${key}`);
    }
  }
});
