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

export function buildProto(facts: ProtoFacts): ProtoBuild | null {
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
