/**
 * Настоящие зависимости потока «Макет в боте» (lib/proto/instant/bot.ts):
 * Telegram — через общую обёртку lib/qualify/telegram.ts, база —
 * lib/proto/instant/store.ts, лид — тем же путём, что форма на сайте:
 * saveLead + routeNewLead (очередь тёплых лидов, ночное правило — там).
 */
import { broken, probe } from "@/lib/audit/fetch";
import { routeNewLead } from "@/lib/admin/lead-queue-store";
import { CIRCLE_NICHE_RU } from "@/lib/admin/sales-after-reply";
import { MOCKUP_BOT_OPEN } from "@/lib/proto/instant/limits";
import { failDetail, readClientSite } from "@/lib/proto/instant/read";
import { claimBuild, claimManual, dropFlow, flowOf, instantCounts, saveBotLang, saveFlow, saveInstantProto, setProtoLead } from "@/lib/proto/instant/store";
import { MANUAL_HOURS, manualWhy, type Deps, type LeadInput } from "@/lib/proto/instant/bot";
import { esc } from "@/lib/proto/instant/safe";
import { protoUrl } from "@/lib/proto/store";
import { salesRecipients } from "@/lib/qualify/brief";
import { newRequestNo } from "@/lib/qualify/engine";
import { saveSession, sessionFor, startSession } from "@/lib/qualify/handoff";
import { scoreLead } from "@/lib/qualify/scoring";
import { saveLead } from "@/lib/qualify/store";
import { editCaption, editText, editWidgetData, sendRowsForId, sendForId, sendWidget } from "@/lib/qualify/telegram";
import type { QualifyToolInput } from "@/lib/qualify/types";

/** Источник лида: «макет в боте» — отдельно, чтобы видеть в ступенях продажи. */
export const INSTANT_SOURCE = "mockup";
/** Макет соберут руками: сферы без шаблона или сборка не прошла. */
export const MANUAL_SOURCE = "mockup-manual";

export const sourceOf = (why: LeadInput["why"]) => (manualWhy(why) ? MANUAL_SOURCE : INSTANT_SOURCE);

/**
 * Шапка карточки команде: «нужен макет вручную» — тот же сигнал, что
 * «🔥 Нужен прототип», с обещанным клиенту сроком. Ночью карточку держит
 * очередь (startQueue) до утра, как любую.
 */
export function manualHeading(input: Pick<LeadInput, "niche" | "site">, where: "bot" | "site" = "bot"): string {
  const how =
    where === "site"
      ? `Клиенту на сайте обещали макет за ${MANUAL_HOURS} часов: кто взял лид, собирает его в «Прототипах» и пишет ему по контакту из карточки.`
      : `Клиенту в боте обещали макет за ${MANUAL_HOURS} часов: кто взял лид, собирает его в «Прототипах» и шлёт ссылку из карточки лида («Клиенту от бота студии»).`;
  return `🔥 <b>Нужен макет вручную · ${esc(CIRCLE_NICHE_RU[input.niche])}</b>${input.site ? ` · ${esc(input.site)}` : ""}\n${how}`;
}

const WHY: Record<LeadInput["why"], string> = {
  built: "собрал себе макет в боте студии",
  soon: "хотел макет в боте, для его сферы готового макета пока нет: нужен макет вручную",
  failed: "хотел макет в боте, автоматически не собрался: нужен макет вручную",
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
  // Один аккаунт — одна заявка «макет вручную» за MANUAL_HOLD_DAYS: повтор второй карточкой не становится.
  if (manualWhy(input.why) && !(await claimManual(input.ctx.tgId).catch(() => true))) return null;
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

/**
 * Сайт клиента открывается — тем же аудитором, что читает его потом
 * (lib/audit/fetch: проверенный адрес, каждый редирект заново). Не ответил,
 * нет такого имени или 4xx/5xx — нет. Одна главная, без стилей и картинок.
 */
export async function siteOpens(url: string): Promise<string | null> {
  try {
    const page = await probe(url);
    return broken(page.status) ? `ответ ${page.status}` : null;
  } catch (error) {
    return failDetail(error instanceof Error ? `${error.name}: ${error.message}` : String(error));
  }
}

/**
 * Сколько сайтов клиентов читаем одновременно. Поток открыт всем, и после
 * рассылки адреса придут разом: чтение сайта (несколько страниц и модель) —
 * самое тяжёлое в сборке, а сервер общий с сайтом и ботом. Остальные ждут
 * своей очереди на шаге «читаем сайт».
 */
export const READ_SLOTS = 4;
let reading = 0;
const queue: (() => void)[] = [];

export async function inSlot<T>(run: () => Promise<T>, slots = READ_SLOTS): Promise<T> {
  // Свободного места нет — ждём, пока закончивший передаст своё (счётчик он не уменьшает).
  if (reading >= slots) await new Promise<void>((go) => queue.push(go));
  else reading += 1;
  try {
    return await run();
  } finally {
    const next = queue.shift();
    if (next) next();
    else reading -= 1;
  }
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
    reachable: siteOpens,
    read: (url, niche, locale, onStep) => inSlot(() => readClientSite(url, niche, locale, { onStep })),
    save: (build, ctx) => saveInstantProto(build, { tgId: ctx.tgId, username: ctx.username, staffId: ctx.staffId }),
    lead,
    setLead: setProtoLead,
    protoUrl,
    now: () => new Date(),
    open: MOCKUP_BOT_OPEN,
    setLang: async (chatId, locale) => {
      // Сессия первички — в памяти: её язык меняем сразу, выбор кладём в базу.
      const session = sessionFor(chatId);
      if (session) saveSession(chatId, { ...session, locale });
      else startSession(chatId, locale);
      await saveBotLang(chatId, locale);
    },
  };
}
