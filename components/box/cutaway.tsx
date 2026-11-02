"use client";

import { useRef, useState } from "react";

import { BoxScene, type CutModel } from "@/components/box/scene";
import { phase, useScrollProgress } from "@/components/hero/use-scroll-progress";
import { Container } from "@/components/ui/container";
import { boxLayerCount, named } from "@/content/box";
import type { Dictionary } from "@/content/dictionaries";
import { cn } from "@/lib/cn";

const MODELS: CutModel[] = ["lite", "pro", "jarvis"];

/**
 * «В разрезе» на промо-странице: коробка разлетается на детали по прокрутке,
 * у каждой загорается номер и подпись. Вкладки переключают модель, число
 * деталей считается из кадра (BOX_CUTS), а не пишется руками: сколько
 * слоёв в кадре, столько и подписей. Подписи для каждой модели: словарь.
 */
export function BoxCutaway({ dict }: { dict: Dictionary }) {
  const ref = useRef<HTMLElement | null>(null);
  const { progress, reduced } = useScrollProgress(ref);
  const p = reduced ? 1 : progress;
  const [model, setModel] = useState<CutModel>("pro");
  const copy = dict.box.cut;
  const layers = copy.layers[model];
  const n = boxLayerCount(model);

  return (
    <section ref={ref} id="cutaway" aria-labelledby="cutaway-title" className="relative h-[250vh] md:h-[300vh]">
      <div className="sticky top-0 flex h-svh flex-col justify-center overflow-hidden pt-16 pb-6 md:pt-20">
        <Container className="grid gap-4 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] md:items-center md:gap-12">
          <div>
            <div className="flex items-center justify-between gap-3">
              <div role="tablist" aria-label={copy.kicker} className="box-glass inline-flex rounded-full p-1">
                {MODELS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="tab"
                    aria-selected={m === model}
                    onClick={() => setModel(m)}
                    className={cn(
                      "rounded-full px-3.5 py-1.5 text-[0.82rem] font-medium transition",
                      m === model ? "bg-green text-ink" : "text-white/70 hover:text-white",
                    )}
                  >
                    {copy.models[m]}
                  </button>
                ))}
              </div>
              <p className="font-mono text-[0.72rem] uppercase tracking-[0.2em] text-muted">
                {copy.parts}: <span className="text-green">{n}</span>
              </p>
            </div>
            <div className="relative mx-auto mt-3 w-[min(100%,38svh)] md:mt-5 md:w-full md:max-w-[620px]">
              <BoxScene key={model} model={model} mode="explode" progress={p} numbered alt={named(dict.box.hero.alt)} />
            </div>
          </div>

          <div>
            <h2 id="cutaway-title" className="sr-only">
              {copy.title}
            </h2>
            <ol className="grid grid-cols-2 gap-x-4 gap-y-2 md:block md:space-y-3">
              {layers.map((layer, i) => {
                const on = p >= 0.42 + (i / n) * 0.5;
                return (
                  <li
                    key={layer.t}
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
