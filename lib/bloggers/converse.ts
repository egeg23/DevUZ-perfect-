import { agentTurn, type AgentReply, type Line } from "@/lib/bloggers/agent";
import { audienceScore, readStats, type Audience, type Image } from "@/lib/bloggers/audience";
import { notifyDesk } from "@/lib/bloggers/notify";
import { pitchLang, type PitchLang } from "@/lib/bloggers/rules";
import * as store from "@/lib/bloggers/store";
import type { Staff } from "@/lib/admin/session";
import { linkUrl, shortUrl } from "@/lib/partners/rules";
import { createPartner, linksOf } from "@/lib/partners/store";
import { esc } from "@/lib/qualify/telegram";
import { siteUrl } from "@/lib/seo";
import { serviceClient } from "@/lib/supabase";
import { detectLang } from "@/lib/talk/language";

/**
 * Ход разговора агента с блогером — общий для Direct и Telegram.
 *
 * 1. Сообщение блогера ложится в переписку. Человек ведёт разговор сам
 *    (`human_until`) — агент молчит, команде строка в бот.
 * 2. Прислал скриншоты — модель с картинками переписывает цифры, код
 *    ставит балл аудитории (lib/bloggers/audience.ts).
 * 3. Агент отвечает (lib/bloggers/agent.ts) и говорит, чего хочет блогер.
 * 4. Согласен, аудитория проверена и подходит — партнёр заводится сам
 *    (createPartner) и ссылка уходит следом; не проверена — агент просит
 *    скриншоты; проверена, но слабая — решает человек.
 */

/** Аудитория по скриншотам не ниже — партнёр заводится без человека. */
export const AUTO_PARTNER_MIN = 60;
/** Человек ответил сам — агент молчит в этом разговоре столько. */
export const HUMAN_HOLD_MS = 12 * 3600_000;

export const DISCLOSURE: Record<PitchLang, string> = {
  ru: "Вам отвечает ИИ-помощник студии DevUz.",
  uz: "Sizga DevUz studiyasining SI yordamchisi javob bermoqda.",
};

const AGREED_WAIT: Record<PitchLang, string> = {
  ru: "Спасибо! Передаю команде, вернёмся со ссылкой в ближайшее время.",
  uz: "Rahmat! Jamoaga topshiraman, tez orada havola bilan qaytamiz.",
};

const LINK_TEXT: Record<PitchLang, (url: string) => string> = {
  ru: (url) => `Ваша партнёрская ссылка: ${url}\nКлиенты, которые перейдут по ней и оплатят проект, засчитаются вам.`,
  uz: (url) => `Sizning hamkorlik havolangiz: ${url}\nUnga o‘tib, loyihani to‘lagan mijozlar sizga hisoblanadi.`,
};

/** Агент назвал себя ИИ? Нет — фраза встаёт первой: это правило, а не просьба к модели. */
export function withDisclosure(text: string, lang: PitchLang, disclosed: boolean): string {
  if (disclosed || /ИИ|SI yordamchi|\bAI\b|искусствен|sun’iy/i.test(text)) return text;
  return `${DISCLOSURE[lang]} ${text}`;
}

export function audienceLine(a: Audience, score: number | null, notes: readonly string[]): string {
  const cities = a.topCities.map((c) => `${c.city} ${c.share}%`).join(", ");
  return [score !== null ? `балл аудитории ${score}` : null, ...notes, cities ? `города: ${cities}` : null, a.notes || null].filter(Boolean).join("; ");
}

export type Outcome = "reply" | "partner" | "agreed" | "declined" | "human" | "silent";

/** Что делать, когда блогер согласен. Чистая функция — её держит тест. */
export function onAgree(b: { audience_score: number | null; score: number | null; partner_id: string | null }, minScore: number): "partner" | "ask_stats" | "human" {
  if (b.partner_id) return "human";
  if (b.audience_score === null) return "ask_stats";
  return b.audience_score >= AUTO_PARTNER_MIN && (b.score === null || b.score >= minScore) ? "partner" : "human";
}

/** От чьего имени агент заводит партнёра: владелец студии — он же видит это в журнале. */
async function ownerActor(): Promise<Staff | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db
    .from("staff")
    .select("id, telegram_user_id, username, display_name, role, panel_locale")
    .eq("role", "admin")
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return (data as Staff | null) ?? null;
}

async function makePartner(b: store.Blogger): Promise<string | null> {
  const actor = await ownerActor();
  if (!actor) return null;
  const result = await createPartner(
    {
      name: (b.name || `@${b.handle}`).slice(0, 120),
      telegramUserId: null,
      code: null,
      note: `Блогер Instagram @${b.handle}: завёл ИИ-сотрудник «Блогеры», оценка ${b.score ?? "?"}, аудитория ${b.audience_score ?? "?"}.`,
    },
    actor,
    "",
  );
  if (!result.ok) {
    console.error("блогеры: партнёр не заведён —", result.reason);
    return null;
  }
  await store.updateBlogger(b.id, { status: "partner", partner_id: result.partner.id });
  const link = (await linksOf([result.partner.id]))[0];
  return link?.slug ? shortUrl(siteUrl, link.slug) : linkUrl(siteUrl, link?.code ?? result.partner.code);
}

export type Incoming = {
  blogger: store.Blogger;
  text: string;
  images: readonly Image[];
  via: "direct" | "telegram";
  /** Сообщение уже записано (Telegram: его записал скаут). */
  recorded?: boolean;
  now?: Date;
};

export type Turn = { outcome: Outcome; reply: string | null };

export async function handleBloggerMessage(input: Incoming, deps: { turn?: typeof agentTurn; stats?: typeof readStats } = {}): Promise<Turn> {
  const now = input.now ?? new Date();
  const at = now.toISOString();
  let b = input.blogger;
  const messages = [...b.messages];
  if (!input.recorded) {
    const marks = input.images.length ? `[скриншоты: ${input.images.length}]` : "";
    messages.push({ role: "blogger", text: [input.text, marks].filter(Boolean).join(" ").slice(0, 4000), at, via: input.via });
  }
  const patch: Partial<store.Blogger> = { messages, updated_at: at } as Partial<store.Blogger>;
  if (["ready", "queued", "contacted"].includes(b.status)) {
    patch.status = "replied";
    patch.replied_at = at;
  }

  if (b.human_until && Date.parse(b.human_until) > now.getTime()) {
    await store.updateBlogger(b.id, patch);
    await notifyDesk(`💬 @${esc(b.handle)} написал (${input.via === "direct" ? "Direct" : "Telegram"}), разговор ведёт человек: «${esc(input.text.slice(0, 300))}»`).catch(() => undefined);
    return { outcome: "silent", reply: null };
  }

  // Скриншоты — до ответа: агент должен знать, что статистика уже есть.
  let audienceText: string | null = b.audience_notes;
  if (input.images.length) {
    try {
      const a = await (deps.stats ?? readStats)(input.images);
      const scored = audienceScore(a, b.followers);
      audienceText = audienceLine(a, scored.score, scored.notes);
      Object.assign(patch, { audience: a, audience_score: scored.score, audience_notes: audienceText });
      if (!["partner", "declined"].includes(b.status)) patch.status = "stats";
      b = { ...b, audience_score: scored.score };
    } catch (error) {
      console.error("блогеры: скриншоты не разобраны —", (error as Error).message);
    }
  }

  const lang: PitchLang = /\p{L}/u.test(input.text) && detectLang(input.text) === "uz" ? "uz" : pitchLang(b.pitch_lang);
  const disclosed = messages.some((m) => m.role === "agent" && m.disclosed);
  const history: Line[] = messages.map((m) => ({ role: m.role, text: m.text }));
  let reply: AgentReply;
  try {
    reply = await (deps.turn ?? agentTurn)({ lang, name: b.name, history, disclosed, audience: audienceText, siteUrl });
  } catch (error) {
    await store.updateBlogger(b.id, patch);
    throw error;
  }

  let text = withDisclosure(reply.text, lang, disclosed);
  let outcome: Outcome = "reply";
  if (reply.intent === "decline") {
    patch.status = "declined";
    outcome = "declined";
  } else if (reply.intent === "human" || !reply.checked) {
    patch.human_until = new Date(now.getTime() + HUMAN_HOLD_MS).toISOString();
    outcome = "human";
  } else if (reply.intent === "agree") {
    const settings = await store.loadSettings();
    const next = onAgree(b, settings.minScore);
    if (next === "partner") {
      await store.updateBlogger(b.id, patch);
      const url = await makePartner({ ...b, ...patch } as store.Blogger);
      if (url) {
        text = `${text}\n\n${LINK_TEXT[lang](url)}`;
        outcome = "partner";
        delete patch.status;
      } else {
        patch.status = "agreed";
        text = `${text}\n\n${AGREED_WAIT[lang]}`;
        outcome = "agreed";
      }
    } else if (next === "human") {
      patch.status = "agreed";
      text = `${text}\n\n${AGREED_WAIT[lang]}`;
      outcome = "agreed";
    }
    // ask_stats: модель уже просит скриншоты (systemPrompt), статус не меняем.
  }

  patch.messages = [...messages, { role: "agent", text, at, via: input.via, disclosed: true }];
  await store.updateBlogger(b.id, patch);

  if (outcome !== "reply") {
    const what: Record<Exclude<Outcome, "reply" | "silent">, string> = {
      partner: "согласился, аудитория подходит — партнёр заведён, ссылка отправлена",
      agreed: "согласен — решите, заводить ли партнёром",
      declined: "отказался",
      human: "нужен человек — агент замолчал на 12 часов",
    };
    await notifyDesk(
      `🤝 <b>Блогер @${esc(b.handle)}</b>: ${what[outcome]}.\n«${esc(input.text.slice(0, 300))}»\n${esc(siteUrl)}/admin/ai-staff/bloggers`,
    ).catch(() => undefined);
  }
  return { outcome, reply: text };
}
