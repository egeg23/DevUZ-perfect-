import type { ReactNode } from "react";

import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/cn";

export function SectionHeading({
  kicker,
  title,
  description,
  className,
  children,
}: {
  kicker: string;
  title: ReactNode;
  description?: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cn("max-w-3xl", className)}>
      <Reveal>
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.3em] text-green">
          {"// "}
          {kicker}
        </p>
      </Reveal>
      <Reveal delay={80}>
        <h2 className="mt-4 text-[clamp(2rem,4.4vw,3.1rem)] font-bold leading-[1.08]">
          {title}
        </h2>
      </Reveal>
      {description ? (
        <Reveal delay={150}>
          <p className="mt-5 text-[1.02rem] leading-relaxed text-muted">{description}</p>
        </Reveal>
      ) : null}
      {children}
    </div>
  );
}
