import Anthropic from "@anthropic-ai/sdk";

import { routeNewLead } from "@/lib/admin/lead-queue-store";
import { effortFor } from "@/lib/model-limits";
import { modelTroubleSays } from "@/lib/model-trouble";
import { salesRecipients } from "@/lib/qualify/brief";
import { newRequestNo } from "@/lib/qualify/engine";
import { scoreLead } from "@/lib/qualify/scoring";
import { saveLead } from "@/lib/qualify/store";
import { esc } from "@/lib/qualify/telegram";
import type { QualifyToolInput } from "@/lib/qualify/types";
import { STRONG_SCORE } from "@/lib/scout/store";
import { serviceClient } from "@/lib/supabase";

/**
 * Сильный сигнал скаута — сразу в очередь тёплых лидов.
 *
 * Раньше сильный сигнал уходил в канал оператора и ждал, пока кто-нибудь
 * его откроет. Из девяти сигналов с оценкой 70+ ответили на один, а такие
 * посты живут часы: модератор сносит их раньше, чем до них доходят руки.
 * Теперь сильный сигнал становится лидом и идёт по тем же правилам, что лид
 * с сайта: днём — тому, у кого меньше, на полчаса, ночью — всем по равной
 * доле. С готовым текстом ответа в карточке, чтобы писать сразу.
 *
 * Делает это свип, а не сам скаут: у свипа есть всё — база, модель, очередь,
 * бот, — и выкатывается он вместе с сайтом.
 */
/** Старше — не продвигаем: пост в чате за полдня обычно уже снесён или отвечен. */
export const PROMOTE_WINDOW_HOURS = 12;
/** За один проход — не больше: лента, куда разом падает десяток, перестаёт читаться. */
const PER_PASS = 5;

const MODEL = process.env.SCOUT_MODEL || "claude-sonnet-5";

export type SignalRow = {
  id: string;
  chat_title: string | null;
  message_link: string | null;
  author_username: string | null;
  excerpt: string;
  score: number;
  category: string;
  rationale: string | null;
};

/** Услуга по категории скаута — теми же слагами, что у квалификации. */
export function serviceOf(category: string): string {
  const c = category.toLowerCase();
  if (c.includes("прилож")) return "mobile-apps";
  if (c.includes("автомат") || c.includes("бот") || c.includes("учёт") || c.includes("учет")) {
    return "integrations-automation";
  }
  if (c.includes("магазин")) return "marketplace-delivery";
  return "web-development";
}

/**
 * Запасной ответ, если модель недоступна.
 *
 * Простой и честный: откуда мы знаем о человеке, что делаем, один вопрос.
 * Лучше такой, чем карточка без заготовки — менеджер пишет быстрее, когда
 * первая фраза уже есть.
 */
export function fallbackReply(signal: Pick<SignalRow, "chat_title" | "category">): string {
  const where = signal.chat_title ? ` в «${signal.chat_title}»` : " в чате";
  return (
    `Здравствуйте! Увидел ваше сообщение${where} — мы студия DevUz, как раз делаем ${signal.category}. ` +
    "Подскажите, что сейчас важнее всего: сроки, бюджет или конкретные функции? Пришлю пару похожих работ и прикину стоимость."
  );
}

const REPLY_SYSTEM = `Ты менеджер веб-студии DevUz из Ташкента. Человек в публичном чате
ищет исполнителя. Напиши первое сообщение ему в личку.

Правила:
— 2–4 коротких предложения, на языке его сообщения (русский или узбекский);
— первой фразой — откуда ты о нём знаешь («увидел ваше сообщение в чате …»);
— покажи, что понял задачу: назови её его словами, без пересказа всего поста;
— один конкретный вопрос, который двигает к созвону или смете;
— без эмодзи, без «лучшие на рынке», без прайса и без списка услуг;
— не обещай сроки и цену, которых не знаешь.

Ответь только текстом сообщения.`;

export async function draftReply(signal: SignalRow): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) return fallbackReply(signal);
  try {
    const client = new Anthropic();
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 700,
      system: REPLY_SYSTEM,
      messages: [
        {
          role: "user",
          content: [
            ...(signal.chat_title ? [`Чат: ${signal.chat_title}`] : []),
            `Что ему нужно (по оценке отбора): ${signal.category}`,
            ...(signal.rationale ? [`Почему это запрос: ${signal.rationale}`] : []),
            "",
            "Сообщение:",
            signal.excerpt,
          ].join("\n"),
        },
      ],
      ...effortFor(MODEL, "low"),
    });
    const text = response.content
      .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim();
    return text && text.length <= 900 ? text : fallbackReply(signal);
  } catch (error) {
    console.error("scout: не собрал ответ на сигнал —", modelTroubleSays(error));
    return fallbackReply(signal);
  }
}

/**
 * Лид из сигнала.
 *
 * Квалификации не было — был пост в чате. Известно, что человек ищет
 * исполнителя сейчас; остальное не выдумывается и стоит в «не выяснено».
 */
export function leadFromSignal(signal: SignalRow, reply: string): QualifyToolInput {
  const handle = signal.author_username ? `@${signal.author_username}` : "";
  const unknown = "не выяснено — пост в чате, разговора ещё не было";
  return {
    contact_name: handle || "автор сообщения в чате",
    company: "",
    contact_handle: handle || signal.message_link || "",
    contact_kind: handle ? "telegram" : "none",
    niche: signal.category,
    niche_tier: 3,
    expertise: "medium",
    services: [serviceOf(signal.category)],
    budget: "B3",
    authority: "A2",
    // Ищет исполнителя прямо сейчас — это и есть потребность.
    need: "N1",
    timing: "T2",
    intent: "interested",
    summary: {
      client: handle || "автор сообщения в чате",
      request: signal.excerpt.slice(0, 400),
      niche: signal.category,
      expertise: unknown,
      budget: unknown,
      authority: unknown,
      need: `ищет исполнителя прямо сейчас${signal.chat_title ? ` — пост в «${signal.chat_title}»` : ""}`,
      timing: unknown,
    },
    notes: [
      `Сигнал скаута, оценка ${signal.score}/100. ${signal.rationale ?? ""}`.trim(),
      signal.message_link ? `Сообщение: ${signal.message_link}` : "",
      handle
        ? "Писать в личку сейчас: такие посты живут часы."
        : "Username у автора нет — ответить можно только в самом чате, пока пост не удалили.",
    ]
      .filter(Boolean)
      .join("\n"),
    opening_line: reply,
    already_told: [],
    avoid_asking: [],
  };
}

export type PromoteReport = { promoted: number; errors: string[] };

export async function promoteStrongSignals(now: Date = new Date()): Promise<PromoteReport> {
  const report: PromoteReport = { promoted: 0, errors: [] };
  const db = serviceClient();
  if (!db) return report;

  const since = new Date(now.getTime() - PROMOTE_WINDOW_HOURS * 3600_000).toISOString();
  const { data, error } = await db
    .from("scout_signals")
    .select("id, chat_title, message_link, author_username, excerpt, score, category, rationale")
    .eq("status", "new")
    .is("lead_id", null)
    .gte("score", STRONG_SCORE)
    .gte("created_at", since)
    .order("created_at", { ascending: true })
    .limit(PER_PASS);
  if (error) {
    report.errors.push(error.message);
    return report;
  }

  for (const raw of data ?? []) {
    const signal = raw as SignalRow;
    // Забираем условным обновлением: два прохода свипа подряд не сделают
    // из одного сигнала два лида.
    const { data: claimed } = await db
      .from("scout_signals")
      .update({ status: "converted" })
      .eq("id", signal.id)
      .eq("status", "new")
      .is("lead_id", null)
      .select("id");
    if (!claimed?.length) continue;

    try {
      const reply = await draftReply(signal);
      const lead = scoreLead(leadFromSignal(signal, reply), "ru");
      const requestNo = newRequestNo(now);
      const leadId = await saveLead(lead, [], "scout", { requestNo, origin: { source: "scout" } });
      if (!leadId) throw new Error("лид не записался");

      await db.from("scout_signals").update({ lead_id: leadId }).eq("id", signal.id);

      const heading = [
        `🔎 <b>Сигнал из чата</b>${signal.chat_title ? ` «${esc(signal.chat_title)}»` : ""} · ${signal.score}/100`,
        "Пост живёт часы — писать сейчас. Готовый текст первого сообщения — ниже.",
        signal.message_link ? `Сообщение: ${esc(signal.message_link)}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      await routeNewLead({
        leadId,
        lead,
        requestNo,
        heading,
        origin: { source: "scout" },
        fallback: await salesRecipients(),
      });
      report.promoted += 1;
    } catch (err) {
      // Не вышло — сигнал возвращается в ленту оператора, а не пропадает.
      await db.from("scout_signals").update({ status: "new" }).eq("id", signal.id).is("lead_id", null);
      report.errors.push(`${signal.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  return report;
}
