import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import { FAQ, QUOTES, bookingText, contactUrl } from "@/content/clients/maximova/facts";

/**
 * Сайт Дарьи Максимовой: правила proto-master, которые можно проверить
 * статикой. Горизонтальную прокрутку и плавность меряет браузер, не тест.
 */

const DIR = "components/clients/maximova";
const cssFiles = [
  ...readdirSync(DIR).filter((f) => f.endsWith(".css")).map((f) => join(DIR, f)),
  ...["a", "b", "c"].flatMap((sub) =>
    readdirSync(join(DIR, sub))
      .filter((f) => f.endsWith(".css"))
      .map((f) => join(DIR, sub, f)),
  ),
];
const read = (path: string) => readFileSync(path, "utf8");

/** Тело блока, начинающегося с `{` на позиции start. */
function block(css: string, start: number): string {
  let depth = 0;
  for (let i = start; i < css.length; i++) {
    if (css[i] === "{") depth++;
    if (css[i] === "}" && --depth === 0) return css.slice(start + 1, i);
  }
  return css.slice(start + 1);
}

test("у каждого прототипа свои стили, и все они выключаются при reduced-motion", () => {
  assert.equal(cssFiles.length, 4);
  for (const file of cssFiles) {
    assert.match(read(file), /@media \(prefers-reduced-motion: reduce\)/, file);
  }
});

test("в @keyframes только transform и opacity", () => {
  for (const file of cssFiles) {
    const css = read(file);
    for (const m of css.matchAll(/@keyframes\s+[\w-]+\s*\{/g)) {
      const body = block(css, m.index + m[0].length - 1);
      const props = [...body.matchAll(/([\w-]+)\s*:/g)].map((p) => p[1]);
      for (const prop of props) assert.ok(prop === "transform" || prop === "opacity", `${file}: ${prop} в кадрах`);
    }
  }
});

test("переходы тоже только по transform и opacity, и никогда не `all`", () => {
  for (const file of cssFiles) {
    for (const m of read(file).matchAll(/transition:\s*([^;]+);/g)) {
      const value = m[1].trim();
      if (value === "none" || value === "none !important") continue;
      // Запятые внутри cubic-bezier() и calc() — не разделители переходов.
      for (const part of value.split(/,(?![^(]*\))/)) {
        const prop = part.trim().split(/\s+/)[0];
        assert.ok(prop === "transform" || prop === "opacity", `${file}: переход по ${prop}`);
      }
    }
  }
});

test("скролл не перехватывается: ни scroll-behavior, ни preventDefault на прокрутке", () => {
  const all = [...cssFiles.map(read), read(join(DIR, "Motion.tsx"))].join("\n");
  assert.doesNotMatch(all, /scroll-behavior/);
  assert.doesNotMatch(all, /preventDefault/);
  assert.match(read(join(DIR, "Motion.tsx")), /passive: true/);
});

test("размеры шрифта — из шкалы", () => {
  const scale = new Set([12, 14, 16, 18, 20, 24, 30, 36, 48, 60, 72]);
  for (const file of cssFiles) {
    for (const m of read(file).matchAll(/font-size:\s*([^;]+);/g)) {
      const sizes = [...m[1].matchAll(/(\d+(?:\.\d+)?)px/g)].map((n) => Number(n[1]));
      // В clamp() средний член — наклон, а не размер: сверяем края.
      const edges = m[1].startsWith("clamp(") ? [sizes[0], sizes[sizes.length - 1]] : sizes;
      for (const size of edges) assert.ok(scale.has(size), `${file}: font-size ${size}px вне шкалы`);
    }
  }
});

test("веса — только 400 и 700", () => {
  for (const file of cssFiles) {
    for (const m of read(file).matchAll(/font-weight:\s*(\d+)/g)) {
      assert.ok(m[1] === "400" || m[1] === "700", `${file}: вес ${m[1]}`);
    }
  }
});

test("страницы закрыты от индексации — и мета-тегом, и заголовком", () => {
  assert.match(read("app/maximova/layout.tsx"), /robots:\s*\{\s*index:\s*false/);
  const config = read("next.config.ts");
  assert.match(config, /source: "\/maximova\/:path\*", headers: \[\{ key: "X-Robots-Tag", value: "noindex/);
  assert.match(config, /source: "\/maximova", headers: \[\{ key: "X-Robots-Tag", value: "noindex/);
});

test("сайт не уезжает в языковой редирект студии", () => {
  assert.match(read("middleware.ts"), /pathname\.startsWith\("\/maximova\/"\)\) return NextResponse\.next\(\)/);
});

test("сайт клиента не тянет ничего из внутренностей студии", () => {
  const files = [
    ...readdirSync(DIR).filter((f) => f.endsWith(".tsx") || f.endsWith(".ts")).map((f) => join(DIR, f)),
    ...["a", "b", "c"].flatMap((sub) =>
      readdirSync(join(DIR, sub))
        .filter((f) => f.endsWith(".tsx"))
        .map((f) => join(DIR, sub, f)),
    ),
    "content/clients/maximova/facts.ts",
    ...readdirSync("app/maximova", { recursive: true })
      .map(String)
      .filter((f) => f.endsWith(".tsx"))
      .map((f) => join("app/maximova", f)),
  ];
  for (const file of files) {
    for (const m of read(file).matchAll(/from "(@\/[^"]+)"/g)) {
      assert.ok(
        m[1].startsWith("@/components/clients/maximova") || m[1].startsWith("@/content/clients/maximova"),
        `${file} импортирует ${m[1]}`,
      );
    }
  }
});

test("обещание результата — только «рассчитана на», без гарантий", () => {
  assert.match(QUOTES.goal, /рассчитана на/);
  const text = [JSON.stringify(QUOTES), JSON.stringify(FAQ)].join(" ");
  assert.doesNotMatch(text, /гарант/i);
});

test("пока контакта нет, кнопка никуда не отправляет", () => {
  assert.equal(contactUrl(null, "x"), null);
  assert.equal(
    contactUrl({ kind: "telegram", handle: "daria" }, bookingText("Английский", "5–8 лет")),
    `https://t.me/daria?text=${encodeURIComponent(bookingText("Английский", "5–8 лет"))}`,
  );
  assert.match(bookingText("Французский", "8–17 лет"), /французский язык\. Возраст: 8–17 лет/);
});

test("слои параллакса не ловят нажатия и не читаются вслух", () => {
  const sky = read(join(DIR, "c/Skyline.tsx"));
  assert.match(sky, /aria-hidden="true"/);
  assert.match(read(join(DIR, "c/countries.module.css")), /\.scene \{[^}]*pointer-events: none/);
});
