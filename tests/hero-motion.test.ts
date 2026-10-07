import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const ROOT = new URL("../", import.meta.url);
const read = (file: string) => readFileSync(new URL(file, ROOT), "utf8");

/** Без комментариев: в них про размытие написано намеренно и подробно. */
function code(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

/** Тело правила по селектору — чтобы не ловить соседние. */
function rule(css: string, selector: string): string {
  const start = css.indexOf(`${selector} {`);
  assert.ok(start >= 0, `нет правила ${selector}`);
  return css.slice(start, css.indexOf("}", start));
}

/**
 * Что в первом экране нельзя анимировать.
 *
 * Правило одно на все три проверки: opacity и transform композитор крутит
 * на готовой текстуре, всё остальное заставляет браузер рисовать блок
 * заново на каждом кадре. Размытие — худший случай: и подложки, и самого
 * блока. На быстрой машине разницы не видно, на слабом телефоне сцена
 * встаёт колом, и именно так это к нам и пришло — жалобой на фризы при
 * появлении карточек со штатом и числом проектов.
 */

test("появление блока не размывает его двадцать раз подряд", () => {
  const css = code(read("app/globals.css"));
  const reveal = rule(css, ".reveal");

  assert.ok(!/filter/.test(reveal), "в .reveal вернулось размытие");
  assert.match(reveal, /opacity/, ".reveal перестал появляться вообще");
  assert.match(reveal, /transform/, ".reveal перестал выезжать");

  // Слой нужен, пока блок не показан. Держать его на всех блоках страницы
  // после появления — это десятки живых слоёв в памяти слабого телефона.
  assert.match(rule(css, ".reveal-visible"), /will-change:\s*auto/);
});

test("карточки первого экрана не размывают подложку", () => {
  const scene = code(read("components/hero/compile-scene.tsx"));

  // Под карточками идёт дождь из кода: backdrop-filter пересчитывал бы его
  // на каждом кадре, для каждой из трёх карточек.
  assert.ok(!/backdrop-blur|backdrop-filter/.test(scene), "вернулось размытие подложки");

  // Тень статична и живёт в классе. В покадровом style она переписывалась
  // бы вместе с ним — браузеру нечем понять, что она не менялась.
  assert.ok(!/boxShadow/.test(scene), "тень вернулась в покадровый style");
  assert.match(code(read("app/globals.css")), /\.hero-card/, "класс карточки пропал");
  assert.match(rule(code(read("app/globals.css")), ".hero-card"), /box-shadow/);

  // Подсветка фона — градиентом. Размытие на 130 px просили считать для
  // пятна в семьсот пикселей, дважды и на каждом кадре.
  assert.ok(!/blur-\[/.test(scene), "вернулось filter: blur на подсветке фона");
});

test("дождь понижает качество только когда устройство правда не тянет", () => {
  const rain = read("components/hero/code-rain.tsx");

  // Порог — не «ниже шестидесяти» и даже не «ниже тридцати»: тридцать
  // кадров на декоративном слое это нормальная работа, и устройство,
  // честно их держащее, от понижения ничего не выиграет.
  assert.match(rain, /const SLOW_FRAME_MS = (5[0-9]|[6-9][0-9])/, "порог опустили до нормальной частоты");

  // Первые кадры не в счёт: пока идёт гидратация, главный поток занят у
  // кого угодно, включая быструю машину. Без этой паузы дождь уходил в
  // половинное качество на любом устройстве — проверено измерением.
  assert.match(code(rain), /if \(warmup > 0\) warmup -= 1;/, "пропал прогрев");
  assert.match(code(rain), /warmup = WARMUP_FRAMES/);

  // Один раз и навсегда: второй порог развёл бы качелями.
  assert.match(code(rain), /if \(slow > SLOW_FRAMES_LIMIT && !degraded\)/);
  assert.match(code(rain), /degraded = true;/);

  // Возврат из фона всегда даёт «долгий» кадр: между ним и предыдущим
  // прошло сколько угодно времени.
  const visibility = code(rain).slice(code(rain).indexOf("onVisibility"));
  assert.match(visibility.slice(0, 200), /last = 0;/, "отсчёт не сбрасывается после фона");
});

/**
 * Владелец, 06.10.2026: «Людей приходит нормально на сайт, но заявок нет
 * почти». На телефоне всё под первым экраном — калькулятор, кейсы, форма
 * заявки — было чёрной пустотой, пока не загрузится JavaScript: .reveal
 * прятал блок стилями ещё до скрипта. Не загрузился скрипт — пустота
 * навсегда.
 */
test("контент виден до скриптов: прячется только блок ниже экрана", () => {
  const css = code(read("app/globals.css"));

  assert.ok(!/opacity:\s*0[;\s]/.test(rule(css, ".reveal")), ".reveal снова прячет блок до скрипта");
  assert.match(rule(css, ".reveal-armed"), /opacity:\s*0/, "прятать должен только .reveal-armed");

  const reveal = code(read("components/ui/reveal.tsx"));
  // Начальное состояние — видимый: так блок приходит с сервера.
  assert.match(reveal, /useState<[^>]*>\("shown"\)/);
  // Прячется только то, что целиком ниже экрана: то, что посетитель уже
  // видит, не мигает при запуске скрипта.
  assert.match(reveal, /getBoundingClientRect\(\)\.top < window\.innerHeight\) return/);
  assert.match(reveal, /"reveal-armed"/);
});
