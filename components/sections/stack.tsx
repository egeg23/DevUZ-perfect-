import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import type { Dictionary } from "@/content/dictionaries";

const STACK = [
  "Next.js", "React", "TypeScript", "Tailwind CSS", "Flutter", "Dart",
  "Node.js", "Python", "FastAPI", "PostgreSQL", "Redis", "Supabase",
  "Docker", "BullMQ", "Celery", "pgvector", "LLM API", "Telegram Bot API",
];

export function StackSection({ dict }: { dict: Dictionary }) {
  return (
    <section className="border-t border-line py-20">
      <Container>
        <Reveal>
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.3em] text-green">
            {"// "}{dict.stack.kicker}
          </p>
          <h2 className="mt-3 text-[1.6rem] font-semibold">{dict.stack.title}</h2>
        </Reveal>
      </Container>

      <div className="marquee-mask mt-9 overflow-hidden">
        {/* Лента продублирована: вторая копия въезжает ровно в тот момент,
            когда первая уходит, поэтому шов не виден. */}
        <div className="marquee-track flex w-max gap-3">
          {[...STACK, ...STACK].map((item, i) => (
            <span
              key={`${item}-${i}`}
              className="whitespace-nowrap rounded-xl border border-line bg-surface px-5 py-3 font-mono text-[0.82rem] text-muted"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
