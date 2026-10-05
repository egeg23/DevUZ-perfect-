/**
 * Скрытый отпечаток макета — свой у каждого клиента.
 *
 * Владелец, 03.10.2026: «в коде прям делать маркеры, которые не будут видны,
 * но в случае разбирательств станут доказательствами нашей разработки».
 *
 * Метка живёт не в комментариях и не в именах — их первыми выбрасывает
 * нейросеть, которой «переписывают» чужой сайт, — а в числах оформления:
 * оттенки цветов, скругления, межбуквенные интервалы, высота строк, размытие.
 * Каждое значение сдвигается на величину, которую глаз не различает
 * (оттенок — на доли процента яркости, скругление — на четверть пикселя), а
 * набор сдвигов случаен и свой у каждого прототипа. Перерисовать чужой сайт,
 * не меняя внешнего вида, значит сохранить эти числа — вместе с меткой.
 *
 * Что именно сдвинуто, знаем только мы: набор лежит в базе рядом с
 * прототипом (protos.stamp), в самой странице нет ни слова о нём. По этому
 * набору «Проверить сайт» в панели находит наш макет на чужом сайте
 * (lib/proto/trace) — даже если цвета записаны там уже в hex или rgb.
 *
 * Размер шрифта не трогается: его сверяет со шкалой проверка прототипа
 * (lib/proto/check), и сдвинутый кегль она справедливо назвала бы браком.
 */
import { createHash, randomBytes } from "node:crypto";

/** Версия способа. Меняется — старые прототипы перерисовываются при открытии. */
export const STAMP_VERSION = 1;

export type Stamp = { v: number; seed: string; signals: string[] };

/** Поток чисел из зерна: одинаковое зерно — одинаковые сдвиги. */
function stream(seed: string) {
  let counter = 0;
  let pool: number[] = [];
  return (): number => {
    if (!pool.length) {
      pool = [...createHash("sha256").update(`${seed}:${counter++}`).digest()];
    }
    return pool.shift()! / 256;
  };
}

export function newSeed(): string {
  return randomBytes(16).toString("hex");
}

/* ── Цвет ──────────────────────────────────────────────────────────────── */

/** hsl → rgb, целые 0–255. Так цвет и сравнивается: hex, rgb и hsl сходятся. */
export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const sat = s / 100;
  const light = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sat * Math.min(light, 1 - light);
  const f = (n: number) => light - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

export const colorSignal = (rgb: readonly number[]) => `color:${rgb.join(",")}`;

const round = (value: number, digits: number) => Number(value.toFixed(digits));

/** «0.183» без лишних нулей и с ведущим нулём — как число и сравнивается. */
const num = (value: number) => String(Number(value.toFixed(4)));

/**
 * Поставить отпечаток в страницу. Возвращает страницу и признаки, по которым
 * её потом узнать.
 */
export function stampHtml(html: string, seed: string): { html: string; stamp: Stamp } {
  const next = stream(seed);
  const pick = <T,>(options: readonly T[]): T => options[Math.floor(next() * options.length)];
  const signals: string[] = [];
  /** Доли пикселя: от десятой до восьми десятых — на экране не различить. */
  const PX_STEP = () => pick([0.1, 0.15, 0.2, 0.3, 0.35, 0.4, 0.45, 0.55, 0.6, 0.65, 0.7, 0.8]);

  const stampCss = (css: string): string => {
    // Цвета переменных оформления: яркость на 0,6–1,2 процента — в rgb это
    // сдвиг на одну-три единицы, глазу не виден, а набор таких сдвигов
    // случайно не повторяется.
    let out = css.replace(
      /(--[a-z0-9-]+:\s*)hsl\(([\d.]+) ([\d.]+)% ([\d.]+)%\)/gi,
      (_all, head: string, h: string, s: string, l: string) => {
        const base = hslToRgb(Number(h), Number(s), Number(l));
        // Насыщенность тоже чуть-чуть: у каждого клиента свой оттенок, а не
        // один из четырёх — иначе два клиента совпадали бы через раз.
        const sat = Math.min(100, Math.max(0, round(Number(s) + pick([-1.5, -1, -0.5, 0, 0.5, 1, 1.5]), 2)));
        let light = Number(l);
        let rgb = base;
        for (const step of [pick([0.5, 0.7, 0.9, 1.1, 1.3]), 1.6, 2]) {
          const sign = Number(l) > 50 ? -1 : 1;
          light = round(Number(l) + sign * step, 2);
          rgb = hslToRgb(Number(h), sat, light);
          if (rgb.join() !== base.join()) break;
        }
        signals.push(colorSignal(rgb));
        return `${head}hsl(${h} ${num(sat)}% ${light}%)`;
      },
    );

    // Скругление по переменной и прямые скругления в пикселях.
    out = out.replace(/(--r:\s*)(\d+)px/g, (_all, head: string, px: string) => {
      const value = Number(px) + PX_STEP();
      signals.push(`px:${num(value)}`);
      return `${head}${num(value)}px`;
    });
    out = out.replace(/(border-radius:\s*)(\d+)px/g, (_all, head: string, px: string) => {
      if (Number(px) < 4) return `${head}${px}px`;
      const value = Number(px) + PX_STEP();
      signals.push(`px:${num(value)}`);
      return `${head}${num(value)}px`;
    });

    // Межбуквенный интервал: тысячные доли em.
    out = out.replace(/(letter-spacing:\s*)(-?[\d]*\.?\d+)em/g, (_all, head: string, em: string) => {
      const value = round(Number(em) + pick([0.001, 0.002, 0.003, 0.004, 0.005, 0.006, 0.007]), 4);
      signals.push(`em:${num(value)}`);
      return `${head}${num(value)}em`;
    });

    // Высота строки (без единиц): сотые.
    out = out.replace(/(line-height:\s*)(\d+(?:\.\d+)?)(?=[;}\s])/g, (_all, head: string, lh: string) => {
      const value = round(Number(lh) + pick([0.01, 0.015, 0.02, 0.025, 0.03, 0.035]), 3);
      signals.push(`lh:${num(value)}`);
      return `${head}${num(value)}`;
    });

    // Размытие подложки.
    out = out.replace(/blur\((\d+)px\)/g, (_all, px: string) => {
      const value = Number(px) + PX_STEP();
      signals.push(`px:${num(value)}`);
      return `blur(${num(value)}px)`;
    });
    return out;
  };

  const stamped = html.replace(/<style([^>]*)>([\s\S]*?)<\/style>/gi, (_all, attrs: string, css: string) => {
    return `<style${attrs}>${stampCss(css)}</style>`;
  });

  return { html: stamped, stamp: { v: STAMP_VERSION, seed, signals: [...new Set(signals)] } };
}

/**
 * Отпечаток на прототип из нескольких страниц — одним зерном.
 *
 * У страниц одного прототипа общие стили, и сдвиги у них обязаны совпадать:
 * иначе главная и страница курса различались бы на пиксель-другой, а набор
 * признаков рос бы с каждой страницей. Одно зерно даёт один поток чисел — и
 * одинаковые стили получают одинаковые сдвиги. Признаки — общий набор.
 */
export function stampPages(
  html: string,
  pages: Readonly<Record<string, string>>,
  seed: string,
): { html: string; pages: Record<string, string>; stamp: Stamp } {
  const main = stampHtml(html, seed);
  const signals = new Set(main.stamp.signals);
  const out: Record<string, string> = {};
  for (const [path, page] of Object.entries(pages)) {
    const stamped = stampHtml(page, seed);
    out[path] = stamped.html;
    for (const signal of stamped.stamp.signals) signals.add(signal);
  }
  return { html: main.html, pages: out, stamp: { v: STAMP_VERSION, seed, signals: [...signals] } };
}
