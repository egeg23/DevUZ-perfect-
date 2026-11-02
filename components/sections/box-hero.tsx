"use client";

import Link from "next/link";
import { useRef } from "react";

import { BoxScene } from "@/components/box/scene";
import { ease, phase, useScrollProgress } from "@/components/hero/use-scroll-progress";
import { Container } from "@/components/ui/container";
import { BOX_NAME, BOX_PATH, named } from "@/content/box";
import type { Dictionary } from "@/content/dictionaries";
import { localeHref, type Locale } from "@/lib/i18n";

/**
 * DevUz Box на главной: хиро-секция сразу за «Делали для».
 *
 * Владелец, 02.11.2026: «Размести на главной, мол что планируется к запуску
 * в октябре 2027 года… Блок прям с вау переходами, анимациями… чтобы это была
 * красивая Хиро секция и кнопка посмотреть, а внутри уже промо страница».
 *
 * Секция высокая, внутри липкий экран: пока посетитель листает два с лишним
 * экрана, коробка собирается из деталей (components/box/scene.tsx), фон с
 * двумя пятнами света едет с параллаксом, а текст стоит на стекле. Движется
 * только `transform` и `opacity`. При prefers-reduced-motion сцена сразу
 * показывает собранную коробку и не двигается. Первый экран (CompileScene)
 * не трогаем: он LCP, а эта секция ниже и грузит картинки лениво.
 */
export function BoxHero({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const ref = useRef<HTMLElement | null>(null);
  const { progress, reduced } = useScrollProgress(ref);
  const p = reduced ? 1 : progress;
  const copy = dict.box.hero;
  const intro = ease(phase(p, 0, 0.22));

  return (
    <section ref={ref} id="box" aria-labelledby="box-title" className="box-hero relative h-[220vh] border-t border-line md:h-[240vh]">
      <div className="sticky top-0 h-svh overflow-hidden">
        <span aria-hidden="true" className="box-glow box-glow-a" style={{ transform: `translate3d(0, ${-10 + 26 * p}%, 0)` }} />
        <span aria-hidden="true" className="box-glow box-glow-b" style={{ transform: `translate3d(0, ${12 - 30 * p}%, 0)` }} />
        <span aria-hidden="true" className="box-grid" style={{ transform: `translate3d(0, ${-6 * p}%, 0)` }} />

        <Container className="relative flex h-full flex-col justify-center gap-5 pt-16 pb-10 md:grid md:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] md:items-center md:gap-10 md:pt-20">
          <div
            className="box-glass relative z-10 rounded-3xl p-5 sm:p-7 md:p-9"
            style={{ transform: `translate3d(0, ${(1 - intro) * 28}px, 0)`, opacity: 0.35 + 0.65 * intro }}
          >
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.3em] text-green">
              {"// "}
              {copy.kicker}
            </p>
            <h2 id="box-title" className="mt-3 font-display text-[clamp(2.2rem,6vw,4.2rem)] font-extrabold leading-[0.98] tracking-tight text-white">
              {BOX_NAME}
            </h2>
            <p className="mt-4 max-w-md text-[0.98rem] leading-relaxed text-white/80 md:text-[1.06rem]">{named(copy.tagline)}</p>
            <p className="mt-5 inline-flex items-center gap-2.5 rounded-full border border-green/35 bg-green/10 px-3.5 py-1.5 text-[0.82rem] font-medium text-green">
              <span aria-hidden="true" className="box-badge-dot inline-block h-2 w-2 rounded-full bg-green" />
              {copy.badge}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Link
                href={localeHref(locale, BOX_PATH)}
                className="box-cta inline-flex items-center gap-2 rounded-full px-6 py-3 text-[0.95rem] font-semibold text-ink transition active:scale-[0.98]"
              >
                {copy.button}
                <span aria-hidden="true">→</span>
              </Link>
              <span className="text-[0.78rem] text-white/50">{copy.plan}</span>
            </div>
          </div>

          <div className="relative mx-auto w-[min(100%,40svh)] md:w-full md:max-w-[640px]">
            <BoxScene model="pro" mode="assemble" progress={p} alt={named(copy.alt)} />
          </div>
        </Container>

        <p
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-4 text-center font-mono text-[0.68rem] uppercase tracking-[0.25em] text-white/45"
          style={{ opacity: 1 - phase(p, 0, 0.12) }}
        >
          {copy.scroll} ↓
        </p>
      </div>
    </section>
  );
}
