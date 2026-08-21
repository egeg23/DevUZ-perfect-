import Anthropic from "@anthropic-ai/sdk";

import { company } from "@/content/company";
import type { Locale } from "@/lib/i18n";
import { buildSystemPrompt } from "@/lib/qualify/prompt";
import { scoreLead } from "@/lib/qualify/scoring";
import { saveLead } from "@/lib/qualify/store";
import { sendLead } from "@/lib/qualify/telegram";
import { qualifyLeadTool } from "@/lib/qualify/tool";
import type { ChatMessage, QualifyToolInput, ScoredLead } from "@/lib/qualify/types";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5";

/** Запасной канал, который ассистент называет, если доставка не удалась. */
const SUPPORT_TELEGRAM = company.telegram;

/**
 * Потолок на ответ.
 *
 * Короткие реплики обеспечивает промпт, а не этот лимит: платим мы за
 * сгенерированное, а не за потолок, поэтому занижать его нечем оправдать.
 * Раньше здесь стояла тысяча — и это ломало продукт. Реплика в неё влезала,
 * а вызов инструмента квалификации — нет: пятнадцать полей, резюме из
 * восьми пунктов, заготовка первой фразы и два списка. Кириллица к тому же
 * стоит втрое дороже латиницы в токенах. Вызов обрывался на середине, в
 * поля попадали куски служебной разметки, и менеджер получал бриф с мусором
 * вместо имени.
 */
const MAX_TOKENS = 8192;

export const MAX_MESSAGE_CHARS = 2000;
/** Диалог, который не сошёлся за столько реплик, не сойдётся и дальше. */
export const MAX_TURNS = 22;

/**
 * Номер заявки.
 *
 * Дата в начале даёт менеджеру возраст заявки без похода в базу, четыре
 * знака в конце — различимость. Алфавит без нуля, единицы, I и O: номер
 * диктуют по телефону и переписывают руками, а «0» и «O» в моноширинном
 * шрифте различает не каждый.
 */
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function newRequestNo(now = new Date()): string {
  const day = `${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(now.getUTCDate()).padStart(2, "0")}`;
  let tail = "";
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  for (const byte of bytes) tail += ALPHABET[byte % ALPHABET.length];
  return `DZ-${day}-${tail}`;
}

/**
 * Вычищает то, что модель дописать не успела.
 *
 * При обрыве генерации в строковые поля попадают обрывки служебной разметки
 * вызова инструмента. Отправлять их менеджеру нельзя: он увидит вместо имени
 * клиента фрагмент внутреннего формата и решит, что сломан весь бриф.
 * Подозрительное поле лучше очистить — пустое место читается как «не
 * выяснено», а это правда.
 */
function sanitizeToolInput(input: QualifyToolInput, truncated: boolean): QualifyToolInput {
  const broken = (value: unknown): boolean =>
    typeof value === "string" && /<\/?(antml|parameter)|<parameter\s/i.test(value);

  const clean = (value: string | undefined): string =>
    !value || broken(value) ? "" : value;

  const cleanList = (list: string[] | undefined): string[] =>
    (list ?? []).filter((item) => typeof item === "string" && item.trim() && !broken(item));

  const summary = { ...input.summary };
  for (const key of Object.keys(summary) as Array<keyof typeof summary>) {
    summary[key] = clean(summary[key]);
  }

  const notes = [clean(input.notes)];
  if (truncated) {
    // Менеджер должен знать, что картина может быть неполной, — иначе он
    // поедет к клиенту с ложной уверенностью.
    notes.push(
      "⚠️ Квалификация оборвалась на середине: часть полей может быть пустой. Уточните недостающее в первом же сообщении.",
    );
  }

  return {
    ...input,
    contact_name: clean(input.contact_name),
    company: clean(input.company),
    contact_handle: clean(input.contact_handle),
    niche: clean(input.niche),
    summary,
    notes: notes.filter(Boolean).join(" "),
    opening_line: clean(input.opening_line),
    already_told: cleanList(input.already_told),
    avoid_asking: cleanList(input.avoid_asking),
  };
}

/**
 * Недавно отправленные лиды — защита от повторной отправки.
 *
 * Флаг от клиента ловит обычный случай, но не переживает перезагрузку
 * страницы: человек обновит вкладку, продолжит разговор, и менеджер получит
 * второй бриф. Ключ — контакт, потому что именно по нему менеджер и пишет:
 * два брифа с одним контактом означают, что клиенту напишут дважды.
 *
 * Память процесса, как и у лимитера частоты: на нескольких инстансах защита
 * получается мягкой, но дублей от одного посетителя это не пропускает.
 */
const recentLeads = new Map<string, number>();
const DEDUPE_WINDOW_MS = 30 * 60 * 1000;

function isDuplicate(input: QualifyToolInput): boolean {
  const handle = (input.contact_handle || "").trim().toLowerCase();
  if (!handle) return false;

  const now = Date.now();
  const seen = recentLeads.get(handle);
  if (seen && now - seen < DEDUPE_WINDOW_MS) return true;

  recentLeads.set(handle, now);
  if (recentLeads.size > 2000) {
    for (const [key, at] of recentLeads) {
      if (now - at >= DEDUPE_WINDOW_MS) recentLeads.delete(key);
    }
  }
  return false;
}

export type TurnEvent =
  | { type: "refusal" }
  | { type: "qualified"; lead: ScoredLead; requestNo: string; delivered: boolean }
  | { type: "closing_failed" }
  | { type: "error" };

export type TurnResult = {
  qualified: boolean;
  lead?: ScoredLead;
  requestNo?: string;
  delivered?: boolean;
};

export type TurnOptions = {
  history: ChatMessage[];
  locale: Locale;
  /** Откуда пришёл разговор — попадает в базу лидов. */
  source: string;
  /** Бриф по этому диалогу уже ушёл: второй отправлять нельзя. */
  alreadyQualified: boolean;
  /**
   * Гарантия двадцати секунд не сработала, скидка уже у клиента.
   *
   * Это меняет поведение модели: обычно ей запрещено обсуждать скидки, но
   * здесь скидка — уже свершившийся факт, и делать вид, что её нет, значит
   * заставить клиента доказывать своё право на неё.
   */
  discount?: boolean;
  /** Добавка к системному промпту под конкретный канал. */
  channelNote?: string;
  onText: (chunk: string) => void;
  onEvent?: (event: TurnEvent) => void;
};

/**
 * Одна реплика ассистента — от запроса к модели до отправленного брифа.
 *
 * Логика одна на два канала: сайт отдаёт текст потоком в SSE, бот собирает
 * его и шлёт одним сообщением. Разница только в том, что делает `onText`,
 * поэтому и разошлись здесь именно колбэки, а не две копии одного
 * двухпроходного разговора с инструментом.
 */
export async function runQualifyTurn(options: TurnOptions): Promise<TurnResult> {
  const { history, locale, source, alreadyQualified, onText, onEvent } = options;
  const emit = (event: TurnEvent) => onEvent?.(event);

  const client = new Anthropic();

  // Ответ модели может складываться из двух запросов подряд. Между ними
  // нужен разрыв абзаца, иначе фразы склеиваются без пробела и выглядят
  // как сбой вёрстки: «…под вашу ситуацию.Ваш запрос уже у менеджера».
  let emittedText = false;
  const pushText = (value: string) => {
    onText(value);
    if (value.trim()) emittedText = true;
  };

  // Разрыв вставляется один раз на продолжение, а не на каждую порцию
  // текста: поток приходит десятками мелких кусков, и общий флаг здесь
  // не годится — он поднимается обратно первым же куском.
  const continuation = () => {
    let inserted = false;
    return (value: string) => {
      if (!inserted) {
        inserted = true;
        if (emittedText && value.trim()) onText("\n\n");
      }
      pushText(value);
    };
  };

  const systemText = [buildSystemPrompt(locale), options.channelNote, discountNote(options.discount)]
    .filter(Boolean)
    .join("\n\n");

  const messages: Anthropic.Beta.BetaMessageParam[] = history.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const shared = {
    model: MODEL,
    max_tokens: MAX_TOKENS,
    // Системный промпт неизменен между репликами, поэтому кэшируется:
    // это самая тяжёлая часть запроса, и платить за неё на каждой
    // реплике диалога незачем.
    system: [
      {
        type: "text" as const,
        text: systemText,
        cache_control: { type: "ephemeral" as const },
      },
    ],
    tools: [qualifyLeadTool as unknown as Anthropic.Beta.BetaToolUnion],
    // Разговор с посетителем не требует глубоких размышлений, а вот
    // задержка в нём видна сразу — отсюда пониженный уровень усилий.
    output_config: { effort: "low" as const },
    // Если запрос упрётся в отказ классификатора, ответ доиграет
    // резервная модель, а не оборвётся посреди диалога с клиентом.
    betas: ["server-side-fallback-2026-07-01" as const],
    fallbacks: "default" as const,
  };

  const first = client.beta.messages.stream({ ...shared, messages });
  first.on("text", pushText);
  const firstMessage = await first.finalMessage();

  if (firstMessage.stop_reason === "refusal") {
    emit({ type: "refusal" });
    return { qualified: false };
  }

  const toolUse = firstMessage.content.find(
    (block): block is Anthropic.Beta.BetaToolUseBlock =>
      block.type === "tool_use" && block.name === qualifyLeadTool.name,
  );

  if (!toolUse) return { qualified: false };

  // Модель иногда вызывает инструмент повторно — например, когда
  // следующая реплика клиента почти дублирует предыдущую. Отправить
  // второй бриф по тому же человеку хуже, чем не отправить ничего:
  // двое менеджеров возьмут одного клиента и напишут ему оба.
  if (alreadyQualified || isDuplicate(toolUse.input as QualifyToolInput)) {
    await secondPass({
      client,
      shared,
      messages,
      firstMessage,
      toolUseId: toolUse.id,
      onText: continuation(),
      onFailure: () => emit({ type: "closing_failed" }),
      toolResult: "Этот лид уже передан менеджеру ранее в этом же разговоре. Повторно ничего не отправляй. Просто подтверди коротко, что запрос у менеджера, и при необходимости ответь на вопрос клиента.",
    });
    return { qualified: true };
  }

  // Обрыв по лимиту токенов означает, что аргументы инструмента
  // дописаны не полностью. Строгая схема тут не спасает: она следит за
  // формой, а не за тем, что генерация доехала до конца.
  const truncated = firstMessage.stop_reason === "max_tokens";
  if (truncated) console.error("qualify_lead обрезан по max_tokens", { locale, source });

  const requestNo = newRequestNo();
  const lead = scoreLead(
    withDiscount(sanitizeToolInput(toolUse.input as QualifyToolInput, truncated), options.discount),
    locale,
  );

  // Сохранение и отправка не должны ронять диалог: если Supabase или
  // Telegram недоступны, посетитель всё равно получит внятный ответ,
  // а ошибка уйдёт в логи.
  let leadId: string | null = null;
  try {
    leadId = await saveLead(lead, history, source);
  } catch (error) {
    console.error("saveLead", error);
  }

  let delivered = false;
  try {
    delivered = await sendLead(lead, history, leadId ?? "unsaved", requestNo);
  } catch (error) {
    console.error("sendLead", error);
  }

  // Лид потерян, только если не сработало ни одно из двух: в базе его
  // найдут даже без уведомления, а уведомление дойдёт даже без базы.
  const lost = !delivered && !leadId;
  if (lost) {
    console.error("lead lost: neither stored nor delivered", {
      grade: lead.grade,
      contact: lead.contact_handle,
    });
  }

  emit({ type: "qualified", lead, requestNo, delivered: !lost });

  // Второй проход: отдаём модели результат инструмента, чтобы она
  // закрыла разговор человеческой фразой, а не оборвала его на вызове.
  // Модели сообщается фактический исход, а не желаемый: сказать «передал
  // менеджеру», когда доставка не удалась, значит отпустить клиента в
  // уверенности, что им займутся, — и потерять его молча.
  const outcome = lost
    ? `Заявку не удалось ни сохранить, ни доставить менеджеру. Не утверждай, что она передана, и не называй номер заявки. Коротко извинись и попроси написать напрямую в Telegram @${SUPPORT_TELEGRAM} — так запрос точно не потеряется.`
    : delivered
      ? `Лид сохранён и передан менеджеру отдела продаж. Номер заявки — ${requestNo}. Обязательно назови его клиенту: по нему менеджер найдёт разговор, и человек видит, что заявка не растворилась.`
      : `Лид сохранён под номером ${requestNo}, но уведомление менеджеру сейчас не ушло. Скажи, что заявку принял, назови номер и на всякий случай дай наш Telegram @${SUPPORT_TELEGRAM} для прямой связи.`;

  await secondPass({
    client,
    shared,
    messages,
    firstMessage,
    toolUseId: toolUse.id,
    onText: continuation(),
    onFailure: () => emit({ type: "closing_failed" }),
    toolResult: outcome,
  });

  return { qualified: true, lead, requestNo, delivered: !lost };
}

/**
 * Второй проход после инструмента.
 *
 * Заявка на этот момент уже у менеджера. Показывать посетителю ошибку значит
 * сообщить, что всё сломалось, когда сломалась лишь прощальная фраза, —
 * человек уйдёт и напишет второй раз или не напишет вовсе.
 */
async function secondPass({
  client,
  shared,
  messages,
  firstMessage,
  toolUseId,
  onText,
  onFailure,
  toolResult,
}: {
  client: Anthropic;
  shared: Record<string, unknown>;
  messages: Anthropic.Beta.BetaMessageParam[];
  firstMessage: Anthropic.Beta.BetaMessage;
  toolUseId: string;
  onText: (value: string) => void;
  onFailure: () => void;
  toolResult: string;
}): Promise<void> {
  const stream = client.beta.messages.stream({
    ...(shared as object),
    messages: [
      ...messages,
      { role: "assistant", content: firstMessage.content },
      {
        role: "user",
        content: [{ type: "tool_result" as const, tool_use_id: toolUseId, content: toolResult }],
      },
    ],
  } as Parameters<typeof client.beta.messages.stream>[0]);

  stream.on("text", onText);

  try {
    await stream.finalMessage();
  } catch (error) {
    console.error("closing message", error);
    onFailure();
  }
}

/** Сработавшая гарантия — факт для менеджера, а не пометка в переписке. */
function withDiscount(input: QualifyToolInput, discount?: boolean): QualifyToolInput {
  if (!discount) return input;
  return {
    ...input,
    notes: [
      "🎁 Сработала гарантия 20 секунд: клиенту уже подтверждена скидка 30%. Она не обсуждается — просто учтите её в расчёте.",
      input.notes,
    ]
      .filter(Boolean)
      .join(" "),
  };
}

function discountNote(discount?: boolean): string | null {
  if (!discount) return null;
  return `## Скидка уже подтверждена

Мы не уложились в обещанные двадцать секунд, и сайт уже показал клиенту, что скидка 30% за ним. Это свершившийся факт, а не предмет обсуждения: пункт 2 жёстких ограничений в этой части не действует.

Упомяни скидку один раз, коротко и по-доброму — «извините за ожидание, скидка 30% за вами, менеджер её учтёт» — и возвращайся к задаче. Не торгуйся, не увеличивай и не уменьшай её, не ставь условий. В summary и notes ничего про скидку писать не нужно, менеджер увидит её отдельной строкой.`;
}
