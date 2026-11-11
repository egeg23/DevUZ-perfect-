/**
 * Настоящие зависимости потока «Макет в боте» (lib/proto/instant/bot.ts):
 * Telegram — через общую обёртку lib/qualify/telegram.ts, база —
 * lib/proto/instant/store.ts, лид — тем же путём, что форма на сайте:
 * saveLead + routeNewLead (очередь тёплых лидов, ночное правило — там).
 */
import { routeNewLead } from "@/lib/admin/lead-queue-store";
import { CIRCLE_NICHE_RU } from "@/lib/admin/sales-after-reply";
import { MOCKUP_BOT_OPEN } from "@/lib/proto/instant/limits";
import { readClientSite } from "@/lib/proto/instant/read";
import { claimBuild, dropFlow, flowOf, instantCounts, saveFlow, saveInstantProto, setProtoLead } from "@/lib/proto/instant/store";
import { MANUAL_HOURS, manualWhy, type Deps, type LeadInput } from "@/lib/proto/instant/bot";
import { esc } from "@/lib/proto/instant/safe";
import { protoUrl } from "@/lib/proto/store";
import { salesRecipients } from "@/lib/qualify/brief";
import { newRequestNo } from "@/lib/qualify/engine";
import { scoreLead } from "@/lib/qualify/scoring";
import { saveLead } from "@/lib/qualify/store";
import { editCaption, editText, editWidgetData, sendRowsForId, sendForId, sendWidget } from "@/lib/qualify/telegram";
import type { QualifyToolInput } from "@/lib/qualify/types";

/** Источник лида: «макет в боте» — отдельно, чтобы видеть в ступенях продажи. */
export const INSTANT_SOURCE = "mockup";
/** Макет соберут руками: сферы без шаблона, дневной потолок, сборка не прошла. */
export const MANUAL_SOURCE = "mockup-manual";

export const sourceOf = (why: LeadInput["why"]) => (manualWhy(why) ? MANUAL_SOURCE : INSTANT_SOURCE);

/**
 * Шапка карточки команде: «нужен макет вручную» — тот же сигнал, что
 * «🔥 Нужен прототип», с обещанным клиенту сроком. Ночью карточку держит
 * очередь (startQueue) до утра, как любую.
 */
export function manualHeading(input: Pick<LeadInput, "niche" | "site">): string {
  return `🔥 <b>Нужен макет вручную · ${esc(CIRCLE_NICHE_RU[input.niche])}</b>${input.site ? ` · ${esc(input.site)}` : ""}\nКлиенту в боте обещали макет за ${MANUAL_HOURS} часов: кто взял лид, собирает его в «Прототипах» и шлёт ссылку из карточки лида («Клиенту от бота студии»).`;
}

const WHY: Record<LeadInput["why"], string> = {
  built: "собрал себе макет в боте студии",
  soon: "хотел макет в боте, для его сферы шаблона пока нет: нужен макет вручную",
  failed: "хотел макет в боте, автоматически не собрался: нужен макет вручную",
  day: "хотел макет в боте, сегодня исчерпан дневной лимит: нужен макет вручную",
};

/** Лид без диалога — как у формы: грейды худшие, суть — в заметке. */
export function instantLeadInput(input: LeadInput): QualifyToolInput {
  const niche = CIRCLE_NICHE_RU[input.niche];
  const contact = input.ctx.username ? `@${input.ctx.username}` : (input.phone ?? `tg:${input.ctx.tgId}`);
  const request = [
    `Клиент ${WHY[input.why]}.`,
    `Сфера: ${niche}.`,
    input.site ? `Сайт: ${input.site}` : "Сайта нет.",
    input.link ? `Макет: ${input.link}` : "",
  ]
    .filter(Boolean)
    .join(" ");
  const unknown = "не выяснено: лид из «Макета в боте», без диалога";
  return {
    contact_name: "",
    company: input.name.startsWith("@") ? "" : input.name,
    contact_handle: contact,
    contact_kind: input.ctx.username ? "telegram" : input.phone ? "phone" : "telegram",
    niche: niche,
    niche_tier: 3,
    expertise: "low",
    services: ["website"],
    budget: "B3",
    authority: "A3",
    need: input.why === "built" ? "N2" : "N3",
    timing: "T3",
    intent: "needs_human",
    summary: {
      client: input.name || contact,
      request,
      niche,
      expertise: unknown,
      budget: unknown,
      authority: unknown,
      need: unknown,
      timing: unknown,
    },
    notes: `${request} Клиент пишет в личку бота студии: ответить можно из карточки лида («Клиенту от бота студии»).`,
    opening_line:
      input.why === "built"
        ? "Здравствуйте! Видел, вы собрали макет сайта в нашем боте. Как вам? Могу показать за 15 минут, что ещё добавить и сколько это будет стоить."
        : "Здравствуйте! Я из DevUz Studio, вы хотели макет сайта в нашем боте. Расскажите, чем занимается компания, и я соберу его для вас.",
    already_told: [],
    avoid_asking: [],
  };
}

async function lead(input: LeadInput): Promise<string | null> {
  const scored = scoreLead(instantLeadInput(input), input.ctx.locale);
  const requestNo = newRequestNo();
  const origin = { tgUsername: input.ctx.username ?? undefined, entryPath: "bot:/maket", entryRef: null };
  const source = sourceOf(input.why);
  let leadId: string | null = null;
  try {
    leadId = await saveLead(scored, [], source, { requestNo, origin });
  } catch (error) {
    console.error("макет в боте: лид не записался", error);
  }
  await routeNewLead({
    leadId: leadId ?? "unsaved",
    lead: scored,
    requestNo,
    origin: { ...origin, source },
    heading: manualWhy(input.why) ? manualHeading(input) : undefined,
    fallback: await salesRecipients(),
  }).catch((error) => console.error("макет в боте: лид не разослан", error));
  return leadId;
}

export function realDeps(): Deps {
  return {
    send: (chatId, html, rows) => (rows?.length ? sendRowsForId(chatId, html, rows) : sendForId(chatId, html)),
    edit: (chatId, id, html) => editText(chatId, id, html),
    sendWidget,
    editWidget: editWidgetData,
    editCaption,
    flowOf,
    saveFlow,
    dropFlow,
    claimBuild,
    counts: (tgId) => instantCounts(tgId),
    read: (url, niche, locale, onStep) => readClientSite(url, niche, locale, { onStep }),
    save: (build, ctx) => saveInstantProto(build, { tgId: ctx.tgId, username: ctx.username, staffId: ctx.staffId }),
    lead,
    setLead: setProtoLead,
    protoUrl,
    now: () => new Date(),
    open: MOCKUP_BOT_OPEN,
  };
}
