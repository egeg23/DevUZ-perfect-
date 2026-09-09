import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

/** Убирает комментарии: внутри них про smooth написано намеренно. */
function code(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "");
}

/**
 * Сторож за один-единственный объявленный стиль — и он того стоит.
 *
 * `scroll-behavior: smooth` на html выглядит безобидно и возвращается в код
 * при каждой попытке «сделать переходы плавнее». Цена измерена на сборке
 * prod: Next при смене маршрута зовёт scrollIntoView в момент, когда старая
 * разметка ещё в DOM, попадает в её нижнюю секцию и с плавной прокруткой
 * улетает туда через всю страницу. Человек, нажавший «Кейсы» с верха
 * главной, оказывался на 70% новой страницы — с точки зрения посетителя
 * меню просто швыряет вниз.
 *
 * Проверка смотрит на объявление, а не на поведение, потому что поведение
 * ловится только браузером на собранном приложении. Зато это объявление —
 * ровно та строка, которую придётся снова удалить.
 */
test("плавная прокрутка не включена глобально на html", () => {
  const declarations = [...code(css).matchAll(/scroll-behavior\s*:\s*([a-z-]+)/g)].map(
    (m) => m[1],
  );

  assert.deepEqual(
    declarations.filter((v) => v === "smooth"),
    [],
    "scroll-behavior: smooth снова в globals.css — меню начнёт выбрасывать вниз",
  );
});

/**
 * Обратная сторона той же настройки: отступ под липкую шапку.
 *
 * Без него якорь (#process в меню, «к содержимому» с клавиатуры) приводит
 * человека к заголовку, накрытому шапкой. Удаляется он так же незаметно,
 * как добавляется smooth, поэтому стоит рядом.
 */
test("якоря не заезжают под шапку", () => {
  const match = code(css).match(/scroll-padding-top\s*:\s*([0-9.]+)rem/);
  assert.ok(match, "scroll-padding-top пропал из globals.css");

  const header = 4.5; // высота шапки, components/layout/header.tsx: h-[4.5rem]
  assert.ok(
    Number(match[1]) >= header,
    `scroll-padding-top ${match[1]}rem меньше шапки в ${header}rem`,
  );
});
