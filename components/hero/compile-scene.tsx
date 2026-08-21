"use client";

import Link from "next/link";
import { useRef } from "react";

import { CodeRain } from "@/components/hero/code-rain";
import { useNarrow } from "@/components/hero/use-narrow";
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
const CODE: Array<{
  slot: number;
  jitter: number;
  tilt: number;
  tokens: Token[];
  /**
   * Укороченный вариант для узких экранов.
   *
   * На телефоне полная строка не помещается и обрезается посреди слова —
   * получается не «идёт сборка», а «вёрстка поехала». Смысл кода тот же,
   * просто без длинных имён и комментариев.
   */
  short: Token[];
}> = [
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
    short: [
      { c: "tok-key", v: "function " },
      { c: "tok-fn", v: "qualifyLead" },
      { c: "tok-punc", v: "(msg) {" },
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
    short: [
      { c: "tok-key", v: "  const " },
      { c: "tok-txt", v: "icp = " },
      { c: "tok-fn", v: "scoreIcp" },
      { c: "tok-punc", v: "(niche)" },
    ]
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
    short: [
      { c: "tok-key", v: "  const " },
      { c: "tok-txt", v: "bant = " },
      { c: "tok-fn", v: "scoreBant" },
      { c: "tok-punc", v: "(ans)" },
    ]
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
    short: [
      { c: "tok-key", v: "  const " },
      { c: "tok-txt", v: "lead = " },
      { c: "tok-punc", v: "{ ...icp, ...bant }" },
    ]
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
    short: [
      { c: "tok-key", v: "  await " },
      { c: "tok-fn", v: "telegram.send" },
      { c: "tok-punc", v: "(" },
      { c: "tok-fn", v: "card" },
      { c: "tok-punc", v: "(lead))" },
    ]
  },
  {
    slot: 1,
    jitter: 36,
    tilt: -2.3,
    tokens: [
      { c: "tok-key", v: "  return " },
      { c: "tok-punc", v: "{ tier, bant, score }" },
    ],
    short: [
      { c: "tok-key", v: "  return " },
      { c: "tok-txt", v: "lead" },
    ]
  },
  {
    slot: 3,
    jitter: -24,
    tilt: 0.9,
    tokens: [{ c: "tok-punc", v: "}" }],
    short: [{ c: "tok-punc", v: "}" }],
  },
];

/** Высота строки в терминале, в em. Сдвиг слотов считается в тех же единицах. */
const LINE_EM = 1.95;

export function CompileScene({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const sceneRef = useRef<HTMLElement>(null);
  const { progress, reduced } = useScrollProgress(sceneRef);
  const narrow = useNarrow();

  // ── Фазы сцены ────────────────────────────────────────────────────────────
  //
  // Фазы идут внахлёст, без пауз между ними: раньше между «текст ушёл» и
  // «загорелась галочка» оставался промежуток, за который ничего не менялось.
  // На широком экране это просто затянуто, а на телефоне, где код прижат к
  // низу, полэкрана оставалось пустым — самое заметное место сцены.
  const cardsIn = phase(progress, 0.08, 0.32);
  const heroOut = ease(phase(progress, 0.42, 0.6));
  const order = ease(phase(progress, 0.42, 0.66)); // хаос → порядок
  const build = phase(progress, 0.64, 0.8); // прогресс сборки и галочка
  const settle = ease(phase(progress, 0.88, 1)); // терминал сжимается, сцена уходит

  /**
   * Насколько терминал утоплен за нижний край (1 — целиком, 0 — на месте).
   *
   * Только для телефона; на широком экране правило обнуляется медиазапросом
   * в globals.css. Выезд начинается чуть позже, чем гаснет текст героя, —
   * иначе на середине перехода терминал и кнопки видны одновременно и
   * наезжают друг на друга.
   */
  const peek = 0.74 * (1 - ease(phase(progress, 0.5, 0.64)));

  // Шапка терминала зеленеет вместе с галочкой, а не позже неё: иначе на
  // экране уже нарисована галка и надпись «Compiled successfully», а статус
  // рядом всё ещё показывает «сборка…».
  const compiled = build > 0.45;

  return (
    <section
      ref={sceneRef}
      data-hero-scene=""
      // Высота задаёт длину «плёнки». На телефоне сцена почти вдвое короче:
      // листать три экрана большим пальцем — испытание, а не эффект.
      className={reduced ? "relative" : "relative h-[190vh] md:h-[360vh]"}
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

        <CodeRain progress={progress} reduced={reduced} narrow={narrow} />

        {/* ── Текст героя ──────────────────────────────────────────────────
            Обычная разметка, а не canvas: заголовок должен попадать в индекс
            и читаться скринридером вне зависимости от того, доиграла сцена
            или нет. */}
        {/* Затемнение под текстом: дождь идёт поверх всей ширины, и без
            этой подложки заголовок читался бы сквозь падающие строки. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 z-[5] hidden w-full md:block lg:w-3/5"
          style={{
            background:
              "radial-gradient(120% 75% at 8% 45%, rgba(5,7,11,.94) 0%, rgba(5,7,11,.86) 42%, rgba(5,7,11,0) 78%)",
          }}
        />
        {/* На телефоне текст занимает всю ширину, поэтому пятно из центра не
            подходит — оно гасит дождь целиком. Здесь подложка идёт сверху
            вниз: под текстом плотная, а к нижней трети расходится, и именно
            там, где в первом кадре ещё нет терминала, дождь видно. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[5] md:hidden"
          style={{
            background:
              "linear-gradient(180deg, rgba(5,7,11,.93) 0%, rgba(5,7,11,.90) 46%, rgba(5,7,11,.58) 70%, rgba(5,7,11,.18) 88%, rgba(5,7,11,0) 100%)",
          }}
        />

        <Container className="relative z-10 flex min-h-0 flex-1 flex-col justify-center pt-[4.75rem] md:pt-[5.5rem]">
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

            <h1 className="mt-5 md:mt-7 text-[clamp(1.75rem,6.4vw,4rem)] font-extrabold leading-[1.05]">
              {dict.hero.titleLead}
              <br />
              <span className="bg-gradient-to-r from-green to-blue-soft bg-clip-text text-transparent">
                {dict.hero.titleAccent}
              </span>
            </h1>

            <p className="mt-4 max-w-xl text-[0.92rem] leading-relaxed text-muted md:mt-6 md:text-[1.02rem]">
              {dict.hero.lead}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2.5 md:mt-8 md:gap-3">
              <Link
                href={localeHref(locale, "contact")}
                className="inline-flex items-center gap-2.5 rounded-xl bg-green px-5 py-3 text-[0.92rem] font-semibold text-ink md:px-7 md:py-4 md:text-base transition-all duration-300 hover:bg-white hover:shadow-[0_0_40px_-8px_var(--color-green)]"
              >
                {dict.cta.calculate}
                <span aria-hidden="true">→</span>
              </Link>
              <Link
                href={localeHref(locale, "cases")}
                className="rounded-xl border border-line px-5 py-3 text-[0.92rem] font-medium text-text md:px-6 md:py-4 md:text-base transition-colors hover:border-green hover:text-green"
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
          className="pointer-events-none absolute inset-x-0 top-[27%] z-20 flex flex-col items-center gap-3 px-6 text-center md:top-[24%] md:gap-5"
          style={{
            opacity: Math.min(build / 0.55, 1) * (1 - settle),
            transform: `scale(${0.86 + Math.min(build / 0.55, 1) * 0.14})`,
          }}
        >
          <svg viewBox="0 0 100 100" className="check-draw h-16 w-16 md:h-[92px] md:w-[92px]" style={{ ["--check-progress" as string]: build }}>
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
        {/* На телефоне терминал выведен из потока: иначе его высота съедала бы
            место у текста героя, и заголовок с подзаголовком уезжали под
            шапку. С md он снова обычный блок в колонке. */}
        <div
          className="hero-terminal absolute inset-x-0 bottom-0 z-10 md:relative md:mt-auto md:shrink-0"
          style={{ ["--peek" as string]: peek }}
        >
        <div
          className="relative z-10 px-4 pb-5 sm:px-8 lg:px-12"
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

            <div className="relative overflow-hidden px-3 py-2.5 font-mono text-[0.6rem] leading-[1.95] sm:px-4 sm:py-3 sm:text-[0.78rem]"
                 // Запас в 2.5 строки, а не в одну: кроме итоговой строки
                 // «Compiled successfully» высота должна вместить ещё и
                 // вертикальные отступы самого блока — box-sizing здесь
                 // border-box, и padding входит в заданную height.
                 style={{ height: `calc(${CODE.length + 2.5} * ${LINE_EM}em)` }}>
              {CODE.map((line, i) => {
                const shift = (line.slot - i) * LINE_EM * (1 - order);
                // Разброс по горизонтали на телефоне вдвое меньше: там ширина
                // карточки 330 px, и полный сдвиг уносил бы строку за её край —
                // вместо хаоса получалась бы обрезка.
                const drift = line.jitter * (1 - order) * (narrow ? 0.45 : 1);
                return (
                  <div
                    key={i}
                    className="grid grid-cols-[1.3rem_1fr] gap-2 whitespace-nowrap sm:grid-cols-[1.7rem_1fr] sm:gap-3"
                    style={{
                      transform: `translate3d(${drift}px, ${shift}em, 0) rotate(${line.tilt * (1 - order)}deg)`,
                      opacity: 0.28 + order * 0.72,
                      filter: `blur(${(1 - order) * 1.6}px)`,
                    }}
                  >
                    <span className="text-right text-[#39424f]">{order > 0.55 ? i + 1 : ""}</span>
                    {/* Обе версии строки лежат в разметке, а нужная
                        показывается стилями: так вариант не меняется при
                        гидратации и не мигает на первом кадре. Скрытая
                        версия ничего не стоит — display:none не рисуется. */}
                    <span className="min-w-0 overflow-hidden text-ellipsis">
                      <span className="md:hidden">
                        {line.short.map((token, j) => (
                          <span key={j} className={order > 0.62 ? token.c : "tok-txt"}>
                            {token.v}
                          </span>
                        ))}
                      </span>
                      <span className="hidden md:inline">
                        {line.tokens.map((token, j) => (
                          // Пока идёт сборка, подсветка ещё не «разобрала»
                          // строку — цвет проявляется вместе с порядком.
                          <span key={j} className={order > 0.62 ? token.c : "tok-txt"}>
                            {token.v}
                          </span>
                        ))}
                      </span>
                    </span>
                  </div>
                );
              })}

              <div
                className="grid grid-cols-[1.3rem_1fr] gap-2 pt-2 text-green sm:grid-cols-[1.7rem_1fr] sm:gap-3"
                style={{ opacity: Math.min(build / 0.45, 1) }}
              >
                <span />
                {/* На телефоне обе половины в строку не влезают и переносятся
                    за нижний край карточки. «Compiled successfully» там и так
                    написано крупно над терминалом, поэтому остаётся только
                    счётчик ошибок — ради него строка и нужна. */}
                <span className="whitespace-nowrap">
                  ✓ <span className="hidden md:inline">{dict.build.success} · </span>
                  {dict.build.errors}
                </span>
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Подсказка «листайте вниз» — исчезает, как только начали листать. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-[11%] left-1/2 -translate-x-1/2 font-mono text-[0.62rem] uppercase tracking-[0.28em] text-faint md:bottom-[24%]"
          style={{ opacity: Math.max(0, 1 - progress * 14) }}
        >
          {dict.hero.scroll} ↓
        </div>
      </div>
    </section>
  );
}
