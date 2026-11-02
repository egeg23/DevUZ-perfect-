"use client";

import { useEffect, useRef, useState } from "react";

import { BoxScene, type CutModel } from "@/components/box/scene";
import { phase, useScrollProgress } from "@/components/hero/use-scroll-progress";
import { Container } from "@/components/ui/container";
import { boxLayerCount, named } from "@/content/box";
import type { Dictionary } from "@/content/dictionaries";
import { cn } from "@/lib/cn";

/** Вкладки — четыре модели, как в сравнении ниже на странице. */
export const CUT_TABS = ["lite", "pro", "premium", "jarvis"] as const;
export type CutTab = (typeof CUT_TABS)[number];

/** Кадры разреза. У «Премиум» своего нет: он собирается в корпусе «Про». */
const FRAMES: CutModel[] = ["lite", "pro", "jarvis"];
export const frameOf = (tab: CutTab): CutModel => (tab === "premium" ? "pro" : tab);

/**
 * «В разрезе» на промо-странице: коробка разлетается на детали по прокрутке,
 * у каждой загорается номер и подпись. Вкладки переключают модель, число
 * деталей считается из кадра (BOX_CUTS), а не пишется руками: сколько
 * слоёв в кадре, столько и подписей. Подписи для каждой модели: словарь.
 *
 * Владелец, 02.11.2026: «кнопки через раз работают, а джарвис вообще не
 * открывается». Сцена пересоздавалась на каждую вкладку с ленивыми
 * картинками, и телефон внутри липкого блока их не всегда грузил. Теперь все
 * три кадра стоят друг на друге и грузятся сразу, как блок подходит к экрану;
 * вкладка только меняет, какой виден. «Моделей почему то 3, а потом идет
 * еще и про версия»: вкладок четыре, как моделей, «Премиум» показывает
 * корпус «Про» и говорит об этом подписью.
 */
export function BoxCutaway({ dict }: { dict: Dictionary }) {
  const ref = useRef<HTMLElement | null>(null);
  const { progress, reduced } = useScrollProgress(ref);
  const p = reduced ? 1 : progress;
  const [tab, setTab] = useState<CutTab>("pro");
  const near = useNear(ref);
  const copy = dict.box.cut;
  const frame = frameOf(tab);
  const layers = copy.layers[tab];
  const n = boxLayerCount(frame);

  return (
    <section ref={ref} id="cutaway" aria-labelledby="cutaway-title" className="relative h-[250vh] md:h-[300vh]">
      <div className="sticky top-0 flex h-svh flex-col justify-center overflow-hidden pt-20 pb-6 md:pt-24">
        <Container className="grid gap-4 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] md:items-center md:gap-12">
          <div>
            <div className="relative z-20 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <div role="tablist" aria-label={copy.kicker} className="box-glass grid w-full grid-cols-4 rounded-full p-1 sm:inline-flex sm:w-auto">
                {CUT_TABS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="tab"
                    aria-selected={m === tab}
                    onClick={() => setTab(m)}
                    className={cn(
                      "box-tab min-h-10 rounded-full px-2 py-2 text-[0.8rem] font-medium transition sm:px-3.5 sm:text-[0.84rem]",
                      m === tab ? "bg-green text-ink" : "text-white/70 hover:text-white",
                    )}
                  >
                    {copy.models[m]}
                  </button>
                ))}
              </div>
              <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted">
                {copy.parts}: <span className="text-green">{n}</span>
              </p>
            </div>
            <div className="relative mx-auto mt-3 grid w-[min(100%,32svh)] items-center md:mt-5 md:w-full md:max-w-[620px]">
              {FRAMES.map((f) =>
                f === frame || near ? (
                  <div
                    key={f}
                    aria-hidden={f !== frame}
                    className="[grid-area:1/1] transition-opacity duration-300"
                    style={{ opacity: f === frame ? 1 : 0, pointerEvents: f === frame ? undefined : "none" }}
                  >
                    <BoxScene model={f} mode="explode" progress={p} numbered eager={near} alt={named(dict.box.hero.alt)} />
                  </div>
                ) : null,
              )}
            </div>
          </div>

          <div>
            <h2 id="cutaway-title" className="sr-only">
              {copy.title}
            </h2>
            {tab === "premium" ? <p className="mb-3 text-[0.8rem] leading-snug text-gold md:mb-5 md:text-[0.88rem]">{copy.shared}</p> : null}
            <ol className="grid grid-cols-2 gap-x-4 gap-y-2 md:block md:space-y-3">
              {layers.map((layer, i) => {
                const on = p >= 0.42 + (i / n) * 0.5;
                return (
                  <li
                    key={`${tab}-${i}`}
                    className="box-label flex items-start gap-3"
                    style={{ opacity: on ? 1 : 0.18, transform: on ? "none" : "translate3d(12px, 0, 0)" }}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-mono text-[0.68rem]",
                        on ? "border-green/60 text-green" : "border-white/20 text-white/40",
                      )}
                    >
                      {i + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[0.86rem] font-semibold leading-snug text-white md:text-[0.98rem]">{layer.t}</span>
                      <span className="mt-0.5 hidden text-[0.88rem] leading-snug text-muted md:block">{layer.d}</span>
                    </span>
                  </li>
                );
              })}
            </ol>
            <p className="mt-4 text-[0.74rem] leading-snug text-faint md:mt-6">{copy.concept}</p>
          </div>
        </Container>
      </div>
    </section>
  );
}

/** Блок в пределах экрана от экрана: пора грузить все три кадра. */
function useNear(ref: React.RefObject<HTMLElement | null>) {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    if (typeof IntersectionObserver === "undefined") return void setNear(true);
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && setNear(true), { rootMargin: "100% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, near]);
  return near;
}
