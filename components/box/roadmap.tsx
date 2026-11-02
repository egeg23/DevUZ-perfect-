import { Reveal } from "@/components/ui/reveal";
import type { Dictionary } from "@/content/dictionaries";
import { cn } from "@/lib/cn";

/**
 * Роадмап коробки: лента по этапам, как просил владелец («ОС > раунд
 * инвестирования и т.д.»). Этапы и сроки: план пилота из
 * docs/plans/future.md, раздел 2. Всё подписано как план; первый этап
 * помечен «идёт сейчас». На широком экране линия идёт слева направо и
 * заполняется, когда блок показался; на телефоне: сверху вниз.
 */
export function BoxRoadmap({ dict }: { dict: Dictionary }) {
  const copy = dict.box.roadmap;
  const last = copy.stages.length - 1;
  return (
    <Reveal className="box-road relative mt-12">
      <span aria-hidden="true" className="box-road-track" />
      <span aria-hidden="true" className="box-road-fill" />
      <ol className="relative grid gap-8 md:grid-cols-5 md:gap-5">
        {copy.stages.map((stage, i) => (
          <Reveal as="li" key={stage.t} delay={120 + i * 140} className="relative pl-9 md:pl-0 md:pt-9">
            <span
              aria-hidden="true"
              className={cn(
                "box-road-dot absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full border md:left-0 md:top-0",
                i === 0 ? "border-green bg-green/20" : i === last ? "border-gold bg-gold/15" : "border-white/25 bg-ink",
              )}
            >
              <span className={cn("h-2 w-2 rounded-full", i === 0 ? "box-badge-dot bg-green" : i === last ? "bg-gold" : "bg-white/40")} />
            </span>
            <p className={cn("font-mono text-[0.7rem] uppercase tracking-[0.2em]", i === last ? "text-gold" : "text-green")}>{stage.when}</p>
            <h3 className="mt-2 text-[1.05rem] font-semibold leading-snug text-white">{stage.t}</h3>
            <p className="mt-2 text-[0.9rem] leading-relaxed text-muted">{stage.d}</p>
            {i === 0 ? (
              <p className="mt-3 inline-flex rounded-full border border-green/35 bg-green/10 px-2.5 py-1 text-[0.72rem] font-medium text-green">{copy.now}</p>
            ) : null}
          </Reveal>
        ))}
      </ol>
    </Reveal>
  );
}
