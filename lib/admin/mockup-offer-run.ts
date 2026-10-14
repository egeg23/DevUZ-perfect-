import Anthropic from "@anthropic-ai/sdk";

import {
  announceDue,
  announceText,
  dailyDue,
  expiredNow,
  fallbackReminder,
  finalDue,
  reminderProblems,
  reminderPrompt,
  tashkentDay,
  untilText,
  type OfferLang,
  type OfferState,
  type ReminderKind,
} from "@/lib/admin/mockup-offer";
import { offerCard, offerReaders, withOwnPromos, type OfferRow } from "@/lib/admin/mockup-offer-bot";
import { effortFor } from "@/lib/model-limits";
import { anthropic } from "@/lib/model-road";
import { modelTroubleSays } from "@/lib/model-trouble";
import { esc, sendMessage, sendWithRows } from "@/lib/qualify/telegram";
import { serviceClient } from "@/lib/supabase";

/**
 * Акция после макета — расписание (lib/admin/mockup-offer.ts), из свипа
 * раз в пять минут:
 * - условия клиенту через 3 минуты после макета, тем же аккаунтом, готовым
 *   текстом; владельцу и руководителю — карточка макета с кнопками;
 * - в 13:00 по Ташкенту — сколько осталось; за 2 часа до конца — последнее
 *   напоминание. Слова подбирает недорогая модель (PROMO_MODEL), числа
 *   проверяет код (reminderProblems); не прошло — готовый текст;
 * - срок вышел — акция закрыта, владельцу и руководителю строка;
 * - клиент отказался или лид проигран — напоминания прекращаются.
 *
 * Каждый шаг — с условной отметкой до отправки: два прохода свипа одно и то
 * же клиенту не пошлют.
 */

const MODEL = process.env.PROMO_MODEL || "claude-haiku-4-5";

type Row = OfferRow & OfferState & { lang: OfferLang };

const FIELDS =
  "id, mockup_ref, mockup_name, mockup_url, prospect_id, lead_id, client, peer, status, sent_at, expires_at, password_at, source, quiet, lang, announced_at, daily_on, final_at";

export type OfferRun = { announced: number; reminded: number; expired: number; stopped: number };

export async function runMockupOffers(now: Date = new Date()): Promise<OfferRun> {
  const run: OfferRun = { announced: 0, reminded: 0, expired: 0, stopped: 0 };
  const db = serviceClient();
  if (!db) return run;
  const { data } = await db.from("mockup_offers").select(FIELDS).eq("status", "active").limit(200);
  if (!data?.length) return run;
  // Своя цена макета (protos.facts.promo) — вместо общих PROMO во всех текстах клиенту.
  const rows = await withOwnPromos(data as Row[]);

  for (const o of rows) {
    try {
      if (expiredNow(o, now)) {
        if (await expire(o, now)) run.expired += 1;
        continue;
      }
      if (await clientSaidNo(o)) {
        await db.from("mockup_offers").update({ status: "declined" }).eq("id", o.id).eq("status", "active");
        run.stopped += 1;
        continue;
      }
      // Клиента нет среди касаний — писать ему нечем: акция только в списке,
      // а владельцу и руководителю — карточка, как и у остальных. Найденное
      // сканом давно ушедшее (quiet) — так же: задним числом клиенту не пишем.
      if (!o.prospect_id || o.quiet) {
        if (!o.announced_at && (await noteToTeam(o, now))) run.announced += 1;
        continue;
      }

      if (announceDue(o, now)) {
        if (await announce(o, now)) run.announced += 1;
      } else if (finalDue(o, now)) {
        if (await remind(o, "final", now)) run.reminded += 1;
      } else if (dailyDue(o, now)) {
        if (await remind(o, "daily", now)) run.reminded += 1;
      }
    } catch (error) {
      console.error("акция по макету:", o.id, error instanceof Error ? error.message : error);
    }
  }
  return run;
}

/** Отказ клиента или проигранный лид — напоминать больше нечего. */
async function clientSaidNo(o: Row): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  if (o.prospect_id) {
    const { data: p } = await db.from("prospects").select("closed_reason").eq("id", o.prospect_id).maybeSingle();
    if (p?.closed_reason === "refused") return true;
  }
  if (o.lead_id) {
    const { data: l } = await db.from("leads").select("status").eq("id", o.lead_id).maybeSingle();
    if (l?.status === "lost" || l?.status === "dropped") return true;
  }
  return false;
}

/** Сообщение клиенту — в ту же переписку, тем же аккаунтом (скаут, nextReply). */
async function queue(o: Row, body: string): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  await db.from("outreach_messages").insert({
    prospect_id: o.prospect_id,
    lead_id: o.lead_id,
    direction: "out",
    author: "ai",
    body: body.slice(0, 4000),
    status: "queued",
  });
}

async function announce(o: Row, now: Date): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const { data: claimed } = await db
    .from("mockup_offers")
    .update({ announced_at: now.toISOString() })
    .eq("id", o.id)
    .is("announced_at", null)
    .select("id");
  if (!claimed?.length) return false;
  await queue(o, announceText(o.lang, o.expires_at, o.own));

  // Владельцу и руководителю — сразу, с кнопками: макет ушёл, акция пошла.
  const card = offerCard(o, now);
  for (const reader of await offerReaders()) {
    await sendWithRows(reader.chat, `🎨 <b>Макет ушёл клиенту</b> — акция 48 часов\n\n${card.text}`, card.rows);
  }
  return true;
}

/** Макет ушёл тому, кого нет среди касаний: клиенту не пишем, команде — карточка. */
async function noteToTeam(o: Row, now: Date): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const { data: claimed } = await db
    .from("mockup_offers")
    .update({ announced_at: now.toISOString() })
    .eq("id", o.id)
    .is("announced_at", null)
    .select("id");
  if (!claimed?.length) return false;
  const card = offerCard(o, now);
  const head = o.quiet
    ? "🔎 <b>Макет найден сканом</b> — ушёл давно, клиенту бот не пишет: условия и сроки скажите ему сами"
    : "🎨 <b>Макет ушёл клиенту</b> — акция 48 часов, условия напишите ему сами";
  for (const reader of await offerReaders()) {
    await sendWithRows(reader.chat, `${head}\n\n${card.text}`, card.rows);
  }
  return true;
}

async function remind(o: Row, kind: ReminderKind, now: Date): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const claim =
    kind === "final"
      ? db.from("mockup_offers").update({ final_at: now.toISOString() }).eq("id", o.id).is("final_at", null)
      : db
          .from("mockup_offers")
          .update({ daily_on: tashkentDay(now.getTime()) })
          .eq("id", o.id)
          .or(`daily_on.is.null,daily_on.neq.${tashkentDay(now.getTime())}`);
  const { data: claimed } = await claim.select("id");
  if (!claimed?.length) return false;
  await queue(o, await reminderText(o, kind, now));
  return true;
}

/** Слова — от недорогой модели, числа — проверены; иначе готовый текст. */
async function reminderText(o: Row, kind: ReminderKind, now: Date): Promise<string> {
  const fallback = fallbackReminder(kind, o.lang, o.expires_at, now, o.own);
  if (!process.env.ANTHROPIC_API_KEY) return fallback;
  try {
    const prompt = reminderPrompt(kind, o.lang, o.expires_at, now, o.client, o.own);
    const response = await anthropic("mockup-offer").beta.messages.create({
      model: MODEL,
      max_tokens: 300,
      system: prompt.system,
      messages: [{ role: "user", content: prompt.user }],
      ...effortFor(MODEL, "low"),
    });
    const text = response.content
      .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim();
    const problems = reminderProblems(text, o.expires_at, now, o.lang, o.own);
    if (!problems.length) return text;
    console.error(`акция по макету ${o.id}: напоминание модели не прошло (${problems.join("; ")}) — готовый текст`);
  } catch (error) {
    console.error("акция по макету: модель не ответила —", modelTroubleSays(error));
  }
  return fallback;
}

async function expire(o: Row, now: Date): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;
  const { data: claimed } = await db
    .from("mockup_offers")
    .update({ status: "expired", expired_noted_at: now.toISOString() })
    .eq("id", o.id)
    .eq("status", "active")
    .select("id");
  if (!claimed?.length) return false;
  const text = `⌛ Акция по макету закончилась: ${esc(o.client || o.mockup_name)} (${untilText(o.expires_at)}). Дальше — обычные цены.`;
  for (const reader of await offerReaders()) await sendMessage(reader.chat, text);
  return true;
}
