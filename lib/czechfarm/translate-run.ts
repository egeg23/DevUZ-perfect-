import type Anthropic from "@anthropic-ai/sdk";

import { anthropic } from "@/lib/model-road";
import { modelTroubleSays } from "@/lib/model-trouble";
import { CF_TRANSLATE_MODEL, cfProblem, cfSystem, type CfLang, type CfRequest } from "@/lib/czechfarm/translate";

/** Сутки по Ташкенту → сколько переводов уже было (память процесса). */
const used = new Map<string, number>();
export function cfDayCount(nowMs = Date.now()): { day: string; n: number } {
  const day = new Date(nowMs + 5 * 3600_000).toISOString().slice(0, 10);
  return { day, n: used.get(day) ?? 0 };
}
export function cfNoteUse(day: string) {
  const n = (used.get(day) ?? 0) + 1;
  used.clear();
  used.set(day, n);
}

type Out = Partial<Record<CfLang, Record<string, string>>>;

/** Переводит; чего не прошло проверку — того в ответе нет (панель оставит поле как было). */
export async function cfTranslate(req: CfRequest): Promise<{ out: Out; failed: number } | { error: string }> {
  if (!process.env.ANTHROPIC_API_KEY) return { error: "no_key" };
  const keys = Object.keys(req.items);
  const props: Record<string, unknown> = {};
  for (const l of req.to) {
    props[l] = { type: "object", properties: Object.fromEntries(keys.map((k) => [k, { type: "string" }])), required: keys };
  }
  const tool = {
    name: "translations",
    description: "Translations of every item, by language code and item key.",
    input_schema: { type: "object", properties: props, required: req.to },
  };
  try {
    const response = await anthropic("czechfarm-translate").messages.create({
      model: CF_TRANSLATE_MODEL,
      max_tokens: 16000,
      system: cfSystem(req.from, req.to),
      tools: [tool as unknown as Anthropic.Tool],
      tool_choice: { type: "tool", name: tool.name },
      messages: [{ role: "user", content: `<items>\n${JSON.stringify(req.items)}\n</items>` }],
    });
    const call = response.content.find((b) => b.type === "tool_use");
    const input = (call?.input ?? {}) as Record<string, Record<string, unknown>>;
    const out: Out = {};
    let failed = 0;
    for (const l of req.to) {
      const got: Record<string, string> = {};
      for (const k of keys) {
        const v = input[l]?.[k];
        const text = typeof v === "string" ? v.replace(/\r/g, "").trim() : "";
        if (text && !cfProblem(req.items[k], text, l)) got[k] = text;
        else failed++;
      }
      out[l] = got;
    }
    return { out, failed };
  } catch (error) {
    console.error("czechfarm-translate: модель не ответила —", modelTroubleSays(error));
    return { error: "model" };
  }
}
