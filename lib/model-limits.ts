/**
 * Чего не умеет выбранная модель.
 *
 * Появилось при замере, когда переключение скаута на Хайку упало с
 * `400 This model does not support the effort parameter`. То есть выбрать
 * модель подешевле через .env было нельзя: параметр стоял в коде жёстко, и
 * узнать об этом можно было только попробовав.
 *
 * Здесь две разницы между семействами — усилие и принудительный
 * инструмент — и ни одной попытки собрать «таблицу возможностей»: остальное
 * у нас одинаково, а таблица, которую некому обновлять, врёт через полгода.
 */

export type Effort = "low" | "medium" | "high";

/** Хайку не знает output_config.effort — остальные модели знают. */
export function supportsEffort(model: string): boolean {
  return !/haiku/i.test(model);
}

/**
 * Кусок запроса с усилием — или пустой, если модель про него не знает.
 *
 * Разворачивается в вызов через spread, поэтому на стороне вызова не
 * появляется ни одного `if`: строка либо есть, либо её нет.
 */
export function effortFor(model: string, effort: Effort): { output_config?: { effort: Effort } } {
  return supportsEffort(model) ? { output_config: { effort } } : {};
}

/**
 * Модель сама решает, звать ли инструмент: `tool_choice` «tool» и «any» —
 * 400 «not supported for this model». Так у Sonnet 5.5 (с 26.10.2026 он
 * у нас вместо Sonnet 5), Opus 5.5, Fable 5.1 и Mythos 5.1.
 *
 * А у нас так зовут почти все узлы со схемой ответа: письма касаний,
 * отбор скаута, разборы, подсказки менеджеру, разбор резюме. Чинить каждый
 * вызов не нужно: запрос переписывает дорога к модели (`softToolChoice` в
 * lib/model-road.ts), вызывающий код тот же.
 */
export function rejectsForcedTool(model: string): boolean {
  return /claude-(?:sonnet-5-5|opus-5-5|fable-5-1|mythos-5-1)\b/.test(model);
}

type Body = Record<string, unknown>;
type Block = { type?: string; name?: string };

/** Какой инструмент ждём: имя или любой (`null` — было «any»). */
export type WantedTool = { name: string | null };

/**
 * Тот же запрос, но без принудительного инструмента: «auto» и строка в
 * системе, какой инструмент нужен. Модели, которой принуждение не мешает, —
 * `null`, запрос уходит как есть.
 *
 * Принудительный вызов шёл без размышлений, и узлы под это и считали
 * `max_tokens` (подсказки менеджеру — 2048, название разбора — 100). Чтобы
 * «auto» не съедал лимит на размышления, Sonnet 5.5 получает
 * `between_tools` — самая тихая его настройка, — если вызывающий сам не
 * выбрал `thinking`. При усилии xhigh и max её нельзя: там как есть.
 */
export function softenToolChoice(body: Body): { body: Body; want: WantedTool } | null {
  const model = typeof body.model === "string" ? body.model : "";
  const choice = body.tool_choice as { type?: string; name?: string; disable_parallel_tool_use?: boolean } | undefined;
  if (!rejectsForcedTool(model) || (choice?.type !== "tool" && choice?.type !== "any")) return null;

  const name = choice.type === "tool" && choice.name ? choice.name : null;
  const ask = name
    ? `Ответь вызовом инструмента ${name}: ответ читается только из него, текст вне инструмента не нужен.`
    : "Ответь вызовом одного из инструментов: ответ читается только из них, текст вне инструментов не нужен.";
  const system =
    typeof body.system === "string" ? [{ type: "text", text: body.system }] : Array.isArray(body.system) ? body.system : [];
  const effort = (body.output_config as { effort?: string } | undefined)?.effort;
  const quiet = /claude-sonnet-5-5\b/.test(model) && body.thinking === undefined && effort !== "xhigh" && effort !== "max";

  return {
    body: {
      ...body,
      tool_choice: { type: "auto", ...(choice.disable_parallel_tool_use ? { disable_parallel_tool_use: true } : {}) },
      system: [...system, { type: "text", text: ask }],
      ...(quiet ? { thinking: { type: "between_tools" } } : {}),
    },
    want: { name },
  };
}

/** Модель позвала тот инструмент, который ждали. */
export function calledTool(message: { content?: unknown }, want: WantedTool): boolean {
  const content = Array.isArray(message.content) ? (message.content as Block[]) : [];
  return content.some((b) => b.type === "tool_use" && (want.name === null || b.name === want.name));
}

/**
 * Второй заход, когда «auto» ответил текстом: тот же разговор, ответ модели
 * и замечание. Пустой ответ в историю не кладём — API такой не примет; ответ
 * с чужим инструментом тоже: без его результата это 400.
 */
export function nudgedBody(body: Body, message: { content?: unknown }, want: WantedTool): Body {
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const content = Array.isArray(message.content) ? (message.content as Block[]) : [];
  const keep = content.length > 0 && !content.some((b) => b.type === "tool_use");
  const said = keep ? [{ role: "assistant", content }] : [];
  const tool = want.name ? `инструмента ${want.name}` : "одного из инструментов";
  return {
    ...body,
    messages: [...messages, ...said, { role: "user", content: `Ответ не принят: он нужен вызовом ${tool}. Повтори ответ вызовом.` }],
  };
}
