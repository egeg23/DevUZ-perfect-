import type { problemDict } from "@/content/admin-panel/prospect";
import type { Picked } from "@/lib/admin/i18n";
import type { ProblemRef } from "@/lib/admin/touch-errors";

/**
 * Проблема письма словами на языке панели: код — из messageProblems /
 * nositeProblems, числа и имена — из `args`. Русский `text` проблемы здесь
 * не нужен: его читает модель, а не сотрудник.
 */
export function problemText(p: ProblemRef, t: Picked<typeof problemDict>): string {
  const [a, b] = p.args;
  switch (p.code) {
    case "short":
      return t.short(Number(a ?? 40));
    case "long":
      return t.long(Number(a ?? 150));
    case "no_host":
      return t.no_host(String(a ?? ""));
    case "no_us":
      return t.no_us;
    case "greeting":
      return t.greeting;
    case "invented":
      return t.invented(String(a ?? ""));
    case "foreign_script":
      return t.foreign_script(String(a ?? ""));
    case "banned":
      return t.banned;
    case "no_seo_score":
      return t.no_seo_score(Number(a ?? 0));
    case "no_loss":
      return t.no_loss(Number(a ?? 0), Number(b ?? 0));
    case "foreign_reference":
      return t.foreign_reference(String(a ?? ""));
    case "no_reference":
      return t.no_reference(String(a ?? ""));
    case "no_proto_link":
      return t.no_proto_link(String(a ?? ""));
    case "no_prototype":
      return t.no_prototype(Number(a ?? 12));
    case "jargon":
      return t.jargon(String(a ?? ""));
    case "greets_sender":
      return t.greets_sender(String(a ?? ""));
    case "not_checked":
      return t.not_checked;
    default:
      return t.unknown;
  }
}
