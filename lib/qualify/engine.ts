import Anthropic from "@anthropic-ai/sdk";

import { company } from "@/content/company";
import type { Locale } from "@/lib/i18n";
import { buildSystemPrompt } from "@/lib/qualify/prompt";
import { scoreLead } from "@/lib/qualify/scoring";
import { attributeAndNotify } from "@/lib/partners/attribute";
import { briefHeading, briefRecipients, briefSummary, briefTotal, type Brief } from "@/lib/qualify/brief";
import type { LeadOrigin } from "@/lib/qualify/origin";
import { ReplyGuard } from "@/lib/qualify/self-talk";
import { saveLead, updateLead } from "@/lib/qualify/store";
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
  /**
   * По чьей ссылке пришёл клиент — код партнёра и, для бота, Telegram id
   * клиента и чат, чтобы снять касание после привязки. Привязка идёт после
   * сохранения лида и его не роняет.
   */
  attribution?: { code: string | null; telegramId?: number | null; chatId?: number | null };
  /**
   * Бриф с витрины, по которому идёт разговор.
   *
   * Меняет три вещи: ассистент знает состав и цену заказа и не спрашивает
   * их заново; квалификация дописывается в лид с тем же номером заявки, а
   * не заводит второй; и уходит она тем же адресатам, что и бриф, — заказ
   * дороже порога владелец получает один, без общего чата.
   */
  brief?: Brief;
  /**
   * Разговор идёт по лиду, который уже заведён и уже за кем-то закреплён.
   *
   * Так приходит первичка по холодному касанию: лид создан в тот момент,
   * когда менеджер нажал «Отправить», и с тех пор принадлежит ему.
   * Квалификация дописывается в этот лид по номеру заявки — завести второй
   * значило бы отвязать разговор от человека, за которым он закреплён, и
   * ровно это владелец запретил: «лид фиксируется за тем, кто нажал кнопку».
   *
   * Уведомление тоже уходит не в общий чат отдела, а тем, кто здесь назван:
   * объявлять команде о чужом разговоре незачем.
   */
  existing?: { requestNo: string; notify: Array<string | number>; heading?: string };
  /**
   * Факты о том, откуда человек пишет: ник от Telegram, страница сайта,
   * первый переход.
   *
   * Заполняет канал, а не модель. Раньше ник добирался до лида только
   * через просьбу в системном промпте («подставь в contact_handle ровно
   * это значение») — то есть в девяти случаях из десяти. Десятый — лид, по
   * которому менеджеру некуда написать, хотя бот всё это время знал ник.
   */
  origin?: LeadOrigin;
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
  /**
   * Всё, что модель говорит клиенту, проходит через фильтр.
   *
   * Правило «не обсуждай, на чём ты работаешь» стоит в промпте, и обычно
   * его хватает. Но промпт — это просьба, а просьба исполняется не всегда;
   * не исполнилась она ровно один раз, и этот раз уехал клиенту. Машина
   * ошибается реже: см. lib/qualify/self-talk.ts.
   *
   * Фильтр один на всю реплику, включая её продолжение после инструмента,
   * и обязательно закрывается — иначе придержанный хвост ответа не дойдёт
   * до человека. Отсюда try/finally вокруг всего хода.
   */
  const guard = new ReplyGuard(options.locale, options.onText);
  try {
    return await qualifyTurn({ ...options, onText: (chunk) => guard.push(chunk) });
  } finally {
    guard.end();
  }
}

async function qualifyTurn(options: TurnOptions): Promise<TurnResult> {
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

  const systemText = [
    buildSystemPrompt(locale),
    options.channelNote,
    discountNote(options.discount),
    briefNote(options.brief),
  ]
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

  // Номер заявки у брифа с витрины уже есть — клиент его видел, менеджер
  // его получил. Второй номер на того же человека только запутает обоих.
  const brief = options.brief;
  const requestNo = options.existing?.requestNo ?? brief?.requestNo ?? newRequestNo();
  const lead = scoreLead(
    withBrief(
      withDiscount(sanitizeToolInput(toolUse.input as QualifyToolInput, truncated), options.discount),
      brief,
    ),
    locale,
  );

  // Сохранение и отправка не должны ронять диалог: если Supabase или
  // Telegram недоступны, посетитель всё равно получит внятный ответ,
  // а ошибка уйдёт в логи.
  let leadId: string | null = null;
  try {
    // Лид от брифа уже в базе — дописываем в него. Не нашёлся (база лежала,
    // когда бриф приходил) — заводим под тем же номером.
    if (brief?.requestNo) leadId = await updateLead(brief.requestNo, lead, history, options.origin);
    if (options.existing) {
      // Лид касания дописывается всегда и никогда не заводится заново.
      // Не нашёлся — значит его удалили руками, пока шёл разговор; новый
      // на его месте оказался бы ничей, а это хуже пропавшей квалификации.
      leadId = await updateLead(options.existing.requestNo, lead, history, options.origin);
      if (!leadId) console.error("касания: лид по заявке не нашёлся", options.existing.requestNo);
    } else if (!leadId) {
      leadId = await saveLead(lead, history, source, {
        requestNo,
        discount: options.discount,
        origin: options.origin,
      });
    }
  } catch (error) {
    console.error("saveLead", error);
  }

  if (leadId && options.attribution?.code) {
    try {
      await attributeAndNotify(leadId, options.attribution, lead);
    } catch (error) {
      console.error("partners: привязка лида", error);
    }
  }

  let delivered = false;
  try {
    if (options.existing) {
      delivered = await sendLead(lead, leadId ?? "unsaved", requestNo, {
        to: options.existing.notify,
        heading: options.existing.heading,
        origin: { ...options.origin, source },
      });
    } else if (brief) {
      const route = await briefRecipients(brief.totalUsd);
      delivered = await sendLead(lead, leadId ?? "unsaved", requestNo, {
        to: route.chatIds,
        heading: briefHeading(brief, route, "qualified"),
        origin: { ...options.origin, source },
      });
    } else {
      delivered = await sendLead(lead, leadId ?? "unsaved", requestNo, {
        origin: { ...options.origin, source },
      });
    }
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

/** Состав заказа — в заметки менеджеру: он и в брифе, но квалификация читается отдельно. */
function withBrief(input: QualifyToolInput, brief?: Brief): QualifyToolInput {
  if (!brief) return input;
  const contact = [brief.name, brief.contact].filter(Boolean).join(", ");
  return {
    ...input,
    notes: [
      `🧩 Заказ с витрины: ${briefSummary(brief)}`,
      contact ? `Контакт из формы витрины: ${contact}.` : "",
      input.notes,
    ]
      .filter(Boolean)
      .join(" "),
  };
}

/**
 * Контекст для ассистента, когда разговор идёт по брифу с витрины.
 *
 * Главное здесь — что ассистент не знакомится и не продаёт: сайт уже
 * выбран и посчитан, бриф уже у менеджера. Его дело — первичка: снять
 * то, чего в конфигураторе нет (сроки, контент, домен, кто решает), и
 * передать менеджеру человека, с которым уже можно говорить о договоре.
 */
function briefNote(brief?: Brief): string | null {
  if (!brief) return null;
  const paid = brief.addons.filter((addon) => !addon.included && addon.priceUsd > 0);
  const no = brief.requestNo ? ` под номером ${brief.requestNo}` : "";

  return `## Контекст: клиент пришёл с витрины, бриф уже отправлен

Клиент только что собрал на нашей витрине сайт. ${briefSummary(brief)}
Бриф с этим составом уже ушёл менеджеру${no}. Не отправляй его заново, не проси описать задачу с нуля и не предлагай другие услуги: задача известна.

Что делать — первичка, чтобы менеджер вошёл в разговор подготовленным:
- Первой репликой поздоровайся по имени (${brief.name ? `клиент представился как ${brief.name}` : "если оно есть в профиле"}), подтверди, что заявка${no} получена, и в одну строку назови состав: пакет «${brief.tier.label}»${paid.length ? ` и ${paid.map((addon) => `«${addon.label}»`).join(", ")}` : ""}, итого ${briefTotal(brief)}. Спроси, всё ли верно.
- Дальше по одному вопросу за раз выясни то, чего в брифе нет: когда хотят стартовать и есть ли дедлайн; есть ли готовые тексты, фотографии и логотип; есть ли домен и хостинг; кто принимает решение по договору; нужны ли ещё языки.
- Бюджет уже известен — ${briefTotal(brief)} по конфигуратору. Не спрашивай его заново; в avoid_asking напиши «бюджет — ${briefTotal(brief)}, собран в конфигураторе». Если клиент хочет дешевле — предложи убрать допники или взять пакет ниже, но новую цену не считай и скидок не обещай: это сделает менеджер.
- Цены с витрины уже названы — их можно повторять. Других цен не называй. Подписка (статьи) считается в месяц и в разовую сумму не входит; по позициям «от» и «по запросу» точную цену назовёт менеджер — не считай её сам.
- Вызови qualify_lead, когда узнал сроки, контент и кто решает, или если клиент просит менеджера, или после четырёх-пяти своих реплик. В summary.request перепиши состав заказа и итог, в already_told — пакет, допники и сумму, в services — что заказывают.`;
}

function discountNote(discount?: boolean): string | null {
  if (!discount) return null;
  return `## Скидка уже подтверждена

Мы не уложились в обещанные двадцать секунд, и сайт уже показал клиенту, что скидка 30% за ним. Это свершившийся факт, а не предмет обсуждения: пункт 2 жёстких ограничений в этой части не действует.

Упомяни скидку один раз, коротко и по-доброму — «извините за ожидание, скидка 30% за вами, менеджер её учтёт» — и возвращайся к задаче. Не торгуйся, не увеличивай и не уменьшай её, не ставь условий. В summary и notes ничего про скидку писать не нужно, менеджер увидит её отдельной строкой.`;
}
