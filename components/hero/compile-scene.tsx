"use client";

import Link from "next/link";
import { useRef } from "react";

import { CodeRain } from "@/components/hero/code-rain";
import { ease, phase, useScrollProgress } from "@/components/hero/use-scroll-progress";
import { Container } from "@/components/ui/container";
import type { Dictionary } from "@/content/dictionaries";
import { stats } from "@/content/company";
import { localeHref, t, type Locale } from "@/lib/i18n";

type Token = { c: string; v: string };

/**
 * Код, который собирается на глазах у посетителя.
 *
 * Это не декоративная заглушка: на экране действительно та функция, которая
 * квалифицирует лида и уходит в Telegram. Человек, который умеет читать код,
 * за пять секунд понимает, чем мы занимаемся.
 *
 * `slot` — место, на котором строка лежит в начале сцены. Разница между ним
 * и настоящим номером строки даёт вертикальный сдвиг: пока сцена не доиграла,
 * строки физически стоят в чужих слотах, а к концу съезжаются в свои.
 */
const CODE: Array<{ slot: number; jitter: number; tilt: number; tokens: Token[] }> = [
  {
    slot: 4,
    jitter: -34,
    tilt: 1.6,
    tokens: [
      { c: "tok-key", v: "export async function " },
      { c: "tok-fn", v: "qualifyLead" },
      { c: "tok-punc", v: "(" },
      { c: "tok-txt", v: "msg" },
      { c: "tok-punc", v: ") {" },
    ],
  },
  {
    slot: 0,
    jitter: 46,
    tilt: -1.1,
    tokens: [
      { c: "tok-key", v: "  const " },
      { c: "tok-txt", v: "icp = " },
      { c: "tok-fn", v: "scoreIcp" },
      { c: "tok-punc", v: "(msg.niche)" },
      { c: "tok-com", v: "      // Tier 1–3" },
    ],
  },
  {
    slot: 6,
    jitter: -18,
    tilt: 2.1,
    tokens: [
      { c: "tok-key", v: "  const " },
      { c: "tok-txt", v: "bant = " },
      { c: "tok-fn", v: "scoreBant" },
      { c: "tok-punc", v: "(msg.answers)" },
      { c: "tok-com", v: "  // B · A · N · T" },
    ],
  },
  {
    slot: 2,
    jitter: 28,
    tilt: -1.8,
    tokens: [
      { c: "tok-key", v: "  const " },
      { c: "tok-txt", v: "lead = { ...icp, ...bant, score: " },
      { c: "tok-fn", v: "total" },
      { c: "tok-punc", v: "() }" },
    ],
  },
  {
    slot: 5,
    jitter: -42,
    tilt: 1.2,
    tokens: [
      { c: "tok-key", v: "  await " },
      { c: "tok-fn", v: "telegram.send" },
      { c: "tok-punc", v: "(" },
      { c: "tok-str", v: "SALES_CHAT" },
      { c: "tok-punc", v: ", " },
      { c: "tok-fn", v: "card" },
      { c: "tok-punc", v: "(lead))" },
    ],
  },
  {
    slot: 1,
    jitter: 36,
    tilt: -2.3,
    tokens: [
      { c: "tok-key", v: "  return " },
      { c: "tok-punc", v: "{ tier, bant, score }" },
    ],
  },
  {
    slot: 3,
    jitter: -24,
    tilt: 0.9,
    tokens: [{ c: "tok-punc", v: "}" }],
  },
];

/** Высота строки в терминале, в em. Сдвиг слотов считается в тех же единицах. */
const LINE_EM = 1.95;

export function CompileScene({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const sceneRef = useRef<HTMLElement>(null);
  const { progress, reduced } = useScrollProgress(sceneRef);

  // ── Фазы сцены ────────────────────────────────────────────────────────────
  const cardsIn = phase(progress, 0.1, 0.34);
  const heroOut = ease(phase(progress, 0.44, 0.62));
  const order = ease(phase(progress, 0.44, 0.72)); // хаос → порядок
  const build = phase(progress, 0.72, 0.86); // прогресс сборки и галочка
  const settle = ease(phase(progress, 0.9, 1)); // терминал сжимается, сцена уходит

  const compiled = build > 0.55;

  return (
    <section
      ref={sceneRef}
      // Высота задаёт длину «плёнки». На мобильных сцена короче: листать
      // три с половиной экрана большим пальцем — испытание, а не эффект.
      className={reduced ? "relative" : "relative h-[280vh] md:h-[360vh]"}
      aria-label={dict.hero.eyebrow}
    >
      <div className="sticky top-0 flex h-svh min-h-[600px] flex-col overflow-hidden">
        {/* Подсветка фона */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-40 -top-56 h-[46rem] w-[46rem] rounded-full bg-blue opacity-25 blur-[130px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 top-24 h-[38rem] w-[38rem] rounded-full bg-green opacity-[0.14] blur-[130px]"
          style={{ opacity: 0.14 + build * 0.22 }}
        />

        <CodeRain progress={progress} reduced={reduced} />

        {/* ── Текст героя ──────────────────────────────────────────────────
            Обычная разметка, а не canvas: заголовок должен попадать в индекс
            и читаться скринридером вне зависимости от того, доиграла сцена
            или нет. */}
        {/* Затемнение под текстом: дождь идёт поверх всей ширины, и без
            этой подложки заголовок читался бы сквозь падающие строки. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 z-[5] w-full lg:w-3/5"
          style={{
            background:
              "radial-gradient(120% 75% at 8% 45%, rgba(5,7,11,.94) 0%, rgba(5,7,11,.86) 42%, rgba(5,7,11,0) 78%)",
          }}
        />

        <Container className="relative z-10 flex min-h-0 flex-1 flex-col justify-center pt-[5.5rem]">
          <div
            style={{
              opacity: 1 - heroOut,
              transform: `translate3d(0, ${-heroOut * 56}px, 0)`,
            }}
            className="max-w-3xl"
          >
            <p className="flex items-center gap-3 font-mono text-[0.7rem] uppercase tracking-[0.3em] text-green">
              <span aria-hidden="true" className="h-px w-8 bg-green" />
              {dict.hero.eyebrow}
            </p>

            <h1 className="mt-7 text-[clamp(2.1rem,4.9vw,4rem)] font-extrabold leading-[1.03]">
              {dict.hero.titleLead}
              <br />
              <span className="bg-gradient-to-r from-green to-blue-soft bg-clip-text text-transparent">
                {dict.hero.titleAccent}
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-[1.02rem] leading-relaxed text-muted">
              {dict.hero.lead}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href={localeHref(locale, "contact")}
                className="inline-flex items-center gap-2.5 rounded-xl bg-green px-7 py-4 font-semibold text-ink transition-all duration-300 hover:bg-white hover:shadow-[0_0_40px_-8px_var(--color-green)]"
              >
                {dict.cta.calculate}
                <span aria-hidden="true">→</span>
              </Link>
              <Link
                href={localeHref(locale, "cases")}
                className="rounded-xl border border-line px-6 py-4 font-medium text-text transition-colors hover:border-green hover:text-green"
              >
                {dict.cta.seeCases}
              </Link>
            </div>
          </div>
        </Container>

        {/* ── Карточки, прилетающие параллельно дождю ─────────────────────── */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 hidden lg:block">
          {stats.slice(0, 3).map((stat, i) => {
            const local = Math.min(1, Math.max(0, (cardsIn - i * 0.16) / 0.52));
            const eased = ease(local);
            const positions = [
              { right: "4%", top: "17%" },
              { right: "23%", top: "34%" },
              { right: "6%", top: "51%" },
            ];
            return (
              <div
                key={stat.label.ru}
                className="absolute w-56 rounded-2xl border border-line bg-surface-2/85 p-5 backdrop-blur-xl"
                style={{
                  ...positions[i],
                  opacity: eased * (1 - heroOut),
                  transform: `translate3d(${(1 - eased) * 70}px, ${-heroOut * 40}px, 0) scale(${0.94 + eased * 0.06})`,
                  boxShadow: "0 24px 60px rgba(0,0,0,.55)",
                }}
              >
                <p className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-faint">
                  {t(stat.label, locale)}
                </p>
                <p className="mt-2 font-display text-3xl font-extrabold leading-none text-green">
                  {stat.value}
                  <span className="text-lg text-gold">{stat.suffix}</span>
                </p>
              </div>
            );
          })}
        </div>

        {/* ── Итог сборки: галочка и надпись ─────────────────────────────── */}
        <div
          aria-hidden={!compiled}
          className="pointer-events-none absolute inset-x-0 top-[24%] z-20 flex flex-col items-center gap-5"
          style={{
            opacity: Math.min(build / 0.55, 1) * (1 - settle),
            transform: `scale(${0.86 + Math.min(build / 0.55, 1) * 0.14})`,
          }}
        >
          <svg width="92" height="92" viewBox="0 0 100 100" className="check-draw" style={{ ["--check-progress" as string]: build }}>
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="rgba(34,240,160,.10)"
              stroke="var(--color-green)"
              strokeWidth="3.5"
            />
            <path
              d="M29 51 L43 65 L71 35"
              stroke="var(--color-green)"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="font-display text-[clamp(1.4rem,3vw,2rem)] font-bold">
            {dict.build.success}
          </p>
          <p className="font-mono text-[0.78rem] text-muted">{dict.build.successNote}</p>
        </div>

        {/* ── Терминал: сюда съезжается весь падавший код ─────────────────── */}
        <div
          className="relative z-10 mt-auto shrink-0 px-4 pb-5 sm:px-8 lg:px-12"
          style={{
            transform: `translate3d(0, ${settle * 40}px, 0) scale(${1 - settle * 0.06})`,
            opacity: 1 - settle * 0.85,
          }}
        >
          <div className="overflow-hidden rounded-2xl border border-line bg-[#090d14]/95 shadow-[0_30px_90px_rgba(0,0,0,.7)] backdrop-blur-xl"
               style={{ borderColor: compiled ? "rgba(34,240,160,.35)" : undefined }}>
            <div className="flex items-center gap-2.5 border-b border-line bg-white/[0.02] px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
              <span className="ml-3 font-mono text-[0.68rem] text-faint">{dict.build.file}</span>
              <span
                className="ml-auto font-mono text-[0.68rem]"
                style={{ color: compiled ? "var(--color-green)" : "var(--color-gold)" }}
              >
                {compiled ? `✓ ${dict.build.passed}` : `◐ ${dict.build.compiling}`}
              </span>
            </div>

            <div className="relative overflow-hidden px-4 py-3 font-mono text-[0.7rem] leading-[1.95] sm:text-[0.78rem]"
                 style={{ height: `calc(${CODE.length + 1.6} * ${LINE_EM}em)` }}>
              {CODE.map((line, i) => {
                const shift = (line.slot - i) * LINE_EM * (1 - order);
                return (
                  <div
                    key={i}
                    className="grid grid-cols-[1.7rem_1fr] gap-3 whitespace-nowrap"
                    style={{
                      transform: `translate3d(${line.jitter * (1 - order)}px, ${shift}em, 0) rotate(${line.tilt * (1 - order)}deg)`,
                      opacity: 0.28 + order * 0.72,
                      filter: `blur(${(1 - order) * 1.6}px)`,
                    }}
                  >
                    <span className="text-right text-[#39424f]">{order > 0.55 ? i + 1 : ""}</span>
                    <span className="overflow-hidden text-ellipsis">
                      {line.tokens.map((token, j) => (
                        // Пока идёт сборка, подсветка ещё не «разобрала» строку —
                        // цвет проявляется вместе с порядком.
                        <span key={j} className={order > 0.62 ? token.c : "tok-txt"}>
                          {token.v}
                        </span>
                      ))}
                    </span>
                  </div>
                );
              })}

              <div
                className="grid grid-cols-[1.7rem_1fr] gap-3 pt-2 text-green"
                style={{ opacity: Math.min(build / 0.45, 1) }}
              >
                <span />
                <span>✓ {dict.build.success} · {dict.build.errors}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Подсказка «листайте вниз» — исчезает, как только начали листать. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-[24%] left-1/2 -translate-x-1/2 font-mono text-[0.62rem] uppercase tracking-[0.28em] text-faint"
          style={{ opacity: Math.max(0, 1 - progress * 14) }}
        >
          {dict.hero.scroll} ↓
        </div>
      </div>
    </section>
  );
}
