/**
 * Сборка прототипа: факты на вход, готовая страница и список претензий на
 * выход.
 *
 * Претензии возвращаются вместе со страницей, а не вместо неё, намеренно.
 * Смотреть на брак полезнее, чем на сообщение об ошибке: половина проблем
 * видна глазом за секунду, а по коду проверки их пришлось бы восстанавливать.
 * Отправлять наружу при непустом списке всё равно нельзя — это решает тот,
 * кто вызвал.
 */
import { protoNicheByKey, type ProtoNiche } from "@/content/proto/models";
import { bookingHtml } from "@/lib/proto/booking";
import { protoProblems, type ProtoProblem } from "@/lib/proto/check";
import { enoughToBuild, type ProtoFacts } from "@/lib/proto/facts";
import { withoutDashes } from "@/lib/proto/plain-text";

export type ProtoBuild = {
  html: string;
  niche: ProtoNiche;
  problems: ProtoProblem[];
  /** Чего не хватило, чтобы собирать вообще. Непустой список — html пустой. */
  missing: string[];
};

const MODELS = {
  booking: bookingHtml,
} as const;

/**
 * Факты компании без длинных тире: в макете их нет (CLAUDE.md, «Макеты — без
 * длинных тире и штампов ИИ»), а с её сайта они приходят как есть —
 * «Пн–Сб 9:00–19:00». Чинятся до сборки и до проверки, чтобы название на
 * странице и в проверке «есть ли имя» было одно и то же.
 */
export function plainFacts(facts: ProtoFacts): ProtoFacts {
  const plain = (value: string | null) => (value == null ? value : withoutDashes(value));
  return {
    ...facts,
    name: withoutDashes(facts.name),
    city: plain(facts.city),
    about: plain(facts.about),
    address: plain(facts.address),
    hours: plain(facts.hours),
    services: facts.services.map((service) => ({
      ...service,
      name: withoutDashes(service.name),
      ...(service.price ? { price: withoutDashes(service.price) } : {}),
    })),
  };
}

export function buildProto(raw: ProtoFacts): ProtoBuild | null {
  const facts = plainFacts(raw);
  const niche = protoNicheByKey(facts.niche);
  if (!niche) return null;

  const missing = enoughToBuild(facts);
  if (missing.length) return { html: "", niche, problems: [], missing };

  const html = MODELS[niche.model]({ facts, niche });
  return { html, niche, problems: protoProblems({ html, facts, niche }), missing: [] };
}

/** Готов ли прототип к отправке. */
export function sendable(build: ProtoBuild | null): boolean {
  return Boolean(build && !build.missing.length && !build.problems.length && build.html);
}
