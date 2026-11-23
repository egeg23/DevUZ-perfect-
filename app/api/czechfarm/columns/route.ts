import type Anthropic from "@anthropic-ai/sdk";

import { bearerOf } from "@/lib/admin/github-oidc";
import { CF_COLUMNS_MODEL, CF_FIELDS, cfColumnsRequestOf, cfColumnsSystem, cfMapOf } from "@/lib/czechfarm/columns";
import { CF_DAILY, CF_TRANSLATE_UNTIL, cfToken, cfTranslateOpen } from "@/lib/czechfarm/translate";
import { cfDayCount, cfNoteUse } from "@/lib/czechfarm/translate-run";
import { anthropic } from "@/lib/model-road";
import { modelTroubleSays } from "@/lib/model-trouble";
import { secretOk } from "@/lib/secret-ok";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Какие столбцы таблицы партнёров что значат (lib/czechfarm/columns.ts):
 * пропуск сервера CZECHFARM, срок и дневной предел — как у перевода.
 */
export async function POST(request: Request) {
  if (!secretOk(bearerOf(request.headers.get("authorization")), cfToken())) {
    return Response.json({ ok: false, why: "forbidden" }, { status: 403 });
  }
  if (!cfTranslateOpen()) return Response.json({ ok: false, why: "expired", until: CF_TRANSLATE_UNTIL }, { status: 410 });
  const { day, n } = cfDayCount();
  if (n >= CF_DAILY) return Response.json({ ok: false, why: "daily" }, { status: 429 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, why: "json" }, { status: 400 });
  }
  const req = cfColumnsRequestOf(body);
  if (typeof req === "string") return Response.json({ ok: false, why: req }, { status: 400 });
  if (!process.env.ANTHROPIC_API_KEY) return Response.json({ ok: false, why: "no_key" }, { status: 503 });
  cfNoteUse(day);
  const tool = {
    name: "columns",
    description: "Column index for every field, -1 when the table has no such column.",
    input_schema: {
      type: "object",
      properties: Object.fromEntries(CF_FIELDS.map((f) => [f, { type: "integer" }])),
      required: [...CF_FIELDS],
    },
  };
  const table = [req.headers, ...req.sample].map((r) => r.map((c, i) => `${i}: ${c}`).join(" | ")).join("\n");
  try {
    const response = await anthropic("czechfarm-columns").messages.create({
      model: CF_COLUMNS_MODEL,
      max_tokens: 400,
      system: cfColumnsSystem(),
      tools: [tool as unknown as Anthropic.Tool],
      tool_choice: { type: "tool", name: tool.name },
      messages: [{ role: "user", content: `<table>\n${table}\n</table>` }],
    });
    const call = response.content.find((b) => b.type === "tool_use");
    return Response.json({ ok: true, until: CF_TRANSLATE_UNTIL, map: cfMapOf(call?.input, req.headers.length) });
  } catch (error) {
    console.error("czechfarm-columns: модель не ответила —", modelTroubleSays(error));
    return Response.json({ ok: false, why: "model" }, { status: 503 });
  }
}
