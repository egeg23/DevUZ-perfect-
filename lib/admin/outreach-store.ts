import Anthropic from "@anthropic-ai/sdk";

import { record } from "@/lib/admin/audit";
import {
  OUTREACH_SYSTEM,
  OUTREACH_TOOL,
  canContact,
  isStopError,
  messageProblems,
  outreachPrompt,
  outreachHooks,
  outreachProof,
  routeFor,
  type Reason,
  type Route,
  type RouteKind,
} from "@/lib/admin/outreach";
import { recordManualInbound } from "@/lib/admin/outreach-talk-store";
import type { Staff } from "@/lib/admin/session";
import type { Finding } from "@/lib/audit/checks";
import { EMPTY_CONTACTS, type Contacts } from "@/lib/audit/contacts";
import { hostOf } from "@/lib/audit/pitch";
import { auditDeep, type ProspectRow } from "@/lib/audit/batch";
import { newRequestNo } from "@/lib/qualify/engine";
import { serviceClient } from "@/lib/supabase";

/**
 * Проспекты: хранение, подготовка сообщения и очередь отправки.
 *
 * Отправляет не сайт, а процесс скаута: пользовательская сессия Telegram
 * живёт там. Сайт кладёт задание в очередь и на этом заканчивает свою
 * часть — так ни отправка не ждёт страницы, ни страница отправки.
 */

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5";

export type ProspectStatus = "new" | "contacting" | "sending" | "sent" | "failed" | "skipped" | "manual";

export type Prospect = {
  id: string;
  created_at: string;
  url: string;
  host: string;
  label: string | null;
  score: number | null;
  findings: Finding[];
  contacts: Contacts;
  draft: string | null;
  message: string | null;
  status: ProspectStatus;
  target: string | null;
  target_kind: RouteKind | null;
  manual_note: string | null;
  claimed_by: string | null;
  claimed_name: string | null;
  sent_at: string | null;
  failure: string | null;
  lead_id: string | null;
};

const COLUMNS =
  "id, created_at, url, host, label, score, findings, contacts, draft, message, status, target, target_kind, manual_note, claimed_by, sent_at, failure, lead_id, staff:claimed_by (display_name)";

function shape(row: Record<string, unknown>): Prospect {
  const joined = row.staff as unknown;
  const person = (Array.isArray(joined) ? joined[0] : joined) as { display_name?: string } | null | undefined;
  return {
    id: String(row.id),
    created_at: String(row.created_at),
    url: String(row.url),
    host: String(row.host),
    label: (row.label as string | null) ?? null,
    score: (row.score as number | null) ?? null,
    findings: Array.isArray(row.findings) ? (row.findings as Finding[]) : [],
    contacts: { ...EMPTY_CONTACTS, ...((row.contacts as Partial<Contacts>) ?? {}) },
    draft: (row.draft as string | null) ?? null,
    message: (row.message as string | null) ?? null,
    status: (row.status as ProspectStatus) ?? "new",
    target: (row.target as string | null) ?? null,
    target_kind: (row.target_kind as RouteKind | null) ?? null,
    manual_note: (row.manual_note as string | null) ?? null,
    claimed_by: (row.claimed_by as string | null) ?? null,
    claimed_name: person?.display_name ?? null,
    sent_at: (row.sent_at as string | null) ?? null,
    failure: (row.failure as string | null) ?? null,
    lead_id: (row.lead_id as string | null) ?? null,
  };
}

/* ── Сохранение прогона ────────────────────────────────────────────────── */

/**
 * Разобранные сайты — в базу. Повтор того же домена не заводит вторую
 * строку и не затирает уже начатое касание: писали один раз — значит,
 * писали, и новый прогон этого не отменяет.
 */
export async function saveProspects(rows: readonly ProspectRow[]): Promise<number> {
  const db = serviceClient();
  if (!db) return 0;

  const fresh = rows
    .filter((r) => r.url && r.findings.length)
    .map((r) => ({
      url: r.url as string,
      host: hostOf(r.url as string) ?? r.url!,
      label: r.label,
      score: r.score,
      findings: r.findings,
      contacts: r.contacts,
      draft: r.draft,
    }))
    .filter((r) => r.host);
  if (!fresh.length) return 0;

  const { data, error } = await db
    .from("prospects")
    .upsert(fresh, { onConflict: "host", ignoreDuplicates: true })
    .select("id");
  if (error) {
    console.error("касания: не сохранил прогон", error.message);
    return 0;
  }
  return (data ?? []).length;
}

export async function listProspects(limit = 200): Promise<Prospect[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data } = await db.from("prospects").select(COLUMNS).order("created_at", { ascending: false }).limit(limit);
  return (data ?? []).map((row) => shape(row as Record<string, unknown>));
}

export async function prospectById(id: string): Promise<Prospect | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db.from("prospects").select(COLUMNS).eq("id", id).maybeSingle();
  return data ? shape(data as Record<string, unknown>) : null;
}


/* ── Подготовка сообщения ──────────────────────────────────────────────── */

export type PrepareResult =
  | { ok: true; message: string }
  | { ok: false; why: string; reason?: Reason };

/**
 * Модель пишет первое сообщение, отталкиваясь от находок анализа.
 *
 * Сохраняется вместе с тем, кто нажал: дальше править и отправлять его
 * будет он, и лид закрепится за ним же.
 */
export async function prepareOutreach(id: string, staff: Staff): Promise<PrepareResult> {
  const db = serviceClient();
  if (!db) return { ok: false, why: "База недоступна." };

  const prospect = await prospectById(id);
  if (!prospect) return { ok: false, why: "Такого сайта в списке уже нет." };

  const reason = canContact({
    contacts: prospect.contacts,
    findings: prospect.findings,
    status: prospect.status,
  });
  if (reason !== "ok") return { ok: false, why: "", reason };

  if (!process.env.ANTHROPIC_API_KEY) return { ok: false, why: "Нет ключа модели — сообщение некому написать." };

  /**
   * Углублённый разбор — здесь, а не в пачке.
   *
   * Владелец: «можно чтобы на это уходило 30-60 секунд… главное, чтобы он был
   * прям как у топовых студий». Минута на один сайт, из которого сейчас
   * родится письмо, — это ровно та минута, которую в агентстве тратит живой
   * человек, прежде чем написать. Минута на каждый из пятидесяти сайтов в
   * пачке — это час, за который никто не сядет.
   *
   * Обход не обязателен: не вышел — пишем по тому, что было. Письмо по одной
   * главной лучше, чем отказ.
   */
  const deep = await auditDeep({ raw: prospect.url, url: prospect.url, label: prospect.label, problem: null });
  const findings = deep.row.report?.findings.length ? deep.row.report.findings : prospect.findings;
  // Ниша нужна, чтобы подобрать наш проект из его же ниши. Раньше сюда
  // передавался null, и подбирать было не по чему.
  const niche = deep.row.report?.facts.niche ?? null;
  const reference = outreachProof({
    niche,
    label: prospect.label,
    host: prospect.host,
    hints: deep.walked?.hints ?? [],
  }).reference;

  const prompt = outreachPrompt({
    host: prospect.host,
    label: prospect.label,
    niche,
    findings,
    draft: prospect.draft,
    sender: staff.display_name,
    walked: deep.walked,
  });

  const hooks = outreachHooks(findings, reference?.name ?? null);

  /**
   * Один ход модели.
   *
   * `notes` — её же промахи с прошлой попытки. Возвращать их обратно дешевле,
   * чем отдавать менеджеру письмо, которое проверка потом не пропустит: он
   * нажал «связаться», а получил отказ и пустое поле.
   */
  const write = async (notes: string | null): Promise<string | null> => {
    const response = await new Anthropic().beta.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: [{ type: "text" as const, text: OUTREACH_SYSTEM, cache_control: { type: "ephemeral" as const } }],
      messages: [
        {
          role: "user" as const,
          content: notes ? `${prompt}\n\nПредыдущая попытка не прошла проверку: ${notes}\nНапиши заново, исправив это.` : prompt,
        },
      ],
      tools: [OUTREACH_TOOL as unknown as Anthropic.Beta.BetaToolUnion],
      tool_choice: { type: "tool", name: OUTREACH_TOOL.name },
      output_config: { effort: "medium" as const },
    });
    const block = response.content.find((b) => b.type === "tool_use");
    const raw = block && block.type === "tool_use" ? (block.input as { message?: unknown }).message : null;
    return typeof raw === "string" && raw.trim() ? raw.trim() : null;
  };

  let message: string;
  try {
    const first = await write(null);
    if (!first) return { ok: false, why: "Модель не вернула сообщение." };

    // Вторая попытка на любой промах, а не только на потерянные крючки.
    // Живой прогон по aparto.uz показал почему: модель написала «созвонимся
    // на 20 минут», проверка отбила число, которого нет в анализе, — и
    // менеджер, нажав «Связаться», получил бы отказ вместо письма. Промах
    // здесь дешевле исправить, чем показать.
    const missed = messageProblems(first, prompt, prospect.host, hooks);
    message = (missed.length ? await write(missed.map((p) => p.text).join(" ")) : null) ?? first;
  } catch (error) {
    return { ok: false, why: error instanceof Error ? error.message : String(error) };
  }

  // Что не так — покажем сотруднику рядом с текстом: правит он, а не мы.
  // Находки обхода сохраняются вместе с сообщением: на них сослалось письмо,
  // и менеджер, открыв карточку, должен видеть то же, что читает адресат.
  await db
    .from("prospects")
    .update({
      message,
      findings,
      score: deep.row.report?.score ?? prospect.score,
      status: "contacting",
      claimed_by: staff.id,
      claimed_at: new Date().toISOString(),
    })
    .eq("id", id);

  return { ok: true, message };
}

/* ── Отправка ──────────────────────────────────────────────────────────── */

export type QueueResult = { ok: true; leadId: string | null } | { ok: false; why: string };

/**
 * Поставить сообщение в очередь и завести лид.
 *
 * Лид заводится здесь, а не после доставки: владелец просил, чтобы лид
 * закреплялся за тем, кто нажал отправить. Если Telegram потом откажет,
 * лид останется с пометкой о провале — это честнее, чем лид, появившийся
 * у кого-то другого через сутки.
 */
export async function queueOutreach(id: string, message: string, staff: Staff, ip: string): Promise<QueueResult> {
  const db = serviceClient();
  if (!db) return { ok: false, why: "База недоступна." };

  const prospect = await prospectById(id);
  if (!prospect) return { ok: false, why: "Такого сайта в списке уже нет." };

  const reason = canContact({
    contacts: prospect.contacts,
    findings: prospect.findings,
    status: prospect.status,
  });
  if (reason !== "ok") return { ok: false, why: reason };

  const route = routeFor(prospect.contacts);
  if (!route) return { ok: false, why: "no_way" };

  const text = message.trim();
  const problems = messageProblems(
    text,
    outreachPrompt({
      host: prospect.host,
      label: prospect.label,
      niche: null,
      findings: prospect.findings,
      draft: prospect.draft,
      sender: staff.display_name,
    }),
    prospect.host,
    outreachHooks(
      prospect.findings,
      outreachProof({ niche: null, label: prospect.label, host: prospect.host }).reference?.name ?? null,
    ),
  );
  if (problems.length) return { ok: false, why: problems.map((p) => p.text).join(" ") };

  // Номер заявки рождается здесь, а не в конце разговора: по нему модель
  // допишет первичку в этот самый лид, когда клиент ответит. Без номера
  // квалификация завела бы второй лид — уже ни за кем не закреплённый.
  const requestNo = newRequestNo();
  const leadId = await createOutreachLead(prospect, staff, text, requestNo, route);

  const { error } = await db
    .from("prospects")
    .update({
      message: text,
      target: route.target,
      target_kind: route.kind,
      // Городской номер в очередь не ставим: скаут по нему никого не найдёт,
      // а место в часовом пределе потратит. Такая карточка сразу уходит
      // человеку — звонить.
      status: route.kind === "manual" ? "manual" : "sending",
      claimed_by: staff.id,
      claimed_at: new Date().toISOString(),
      lead_id: leadId,
      request_no: requestNo,
      ai_handling: true,
      handover_reason: null,
      failure: null,
    })
    .eq("id", id)
    .in("status", ["new", "contacting"]);
  if (error) return { ok: false, why: "Не получилось поставить в очередь." };

  await record("prospect.queued", {
    actorStaffId: staff.id,
    targetType: "prospect",
    targetId: id,
    ip,
    meta: { host: prospect.host, target: route.target, kind: route.kind },
  });
  return { ok: true, leadId };
}

/* ── Ручной маршрут ────────────────────────────────────────────────────── */

/**
 * Ответы модели, которые по ручному маршруту отправляет человек.
 *
 * Скаут их не забирает — в телеграм по этому маршруту писать нечего, — и без
 * этого запроса они лежали бы в очереди невидимыми. Читается одним запросом
 * на всю страницу: карточек бывает полсотни, и запрос на каждую превратил бы
 * список в минуту ожидания.
 */
export async function manualReplies(): Promise<Record<string, string>> {
  const db = serviceClient();
  if (!db) return {};

  const { data: manual } = await db
    .from("prospects")
    .select("id")
    .eq("target_kind", "manual")
    .eq("status", "sent")
    .limit(200);
  const ids = (manual ?? []).map((row) => String(row.id));
  if (!ids.length) return {};

  const { data } = await db
    .from("outreach_messages")
    .select("prospect_id, body, created_at")
    .eq("direction", "out")
    .eq("status", "queued")
    .in("prospect_id", ids)
    .order("created_at", { ascending: true })
    .limit(200);

  const out: Record<string, string> = {};
  // Первый по времени, а не последний: отвечать надо по порядку, иначе
  // клиент получит ответ на свой второй вопрос раньше, чем на первый.
  for (const row of data ?? []) {
    const key = String(row.prospect_id);
    if (!out[key]) out[key] = String(row.body);
  }
  return out;
}

/**
 * «Написал руками» — отметка о касании, которое сделал человек.
 *
 * Владелец: «там где нет телеграм — пусть связываются через телефон /
 * вотсапп по номеру… И тут же подхватывает ИИ после написанного сообщения
 * пользователю до выяснения BANT».
 *
 * Отметка не украшение и не отчётность. С этой минуты разговор существует:
 * первое письмо ложится в ленту, модель считается ведущей, и ответ клиента,
 * который менеджер сюда перенесёт, ей будет с чем связать. Без отметки
 * карточка так и осталась бы «дальше руками» — и второй менеджер написал бы
 * тому же человеку второй раз.
 */
export async function markManualSent(
  id: string,
  staff: Staff,
  note: string,
  ip: string,
): Promise<{ ok: true } | { ok: false; why: string }> {
  const db = serviceClient();
  if (!db) return { ok: false, why: "База недоступна." };

  const prospect = await prospectById(id);
  if (!prospect) return { ok: false, why: "Такого сайта в списке уже нет." };
  if (prospect.status !== "manual") return { ok: false, why: "Эта карточка не на ручном маршруте." };

  const when = new Date().toISOString();
  const { error } = await db
    .from("prospects")
    .update({
      status: "sent",
      sent_at: when,
      // Маршрут остаётся ручным: по нему и дальше писать человеку. Скаут
      // читает его именно так и ответы модели по нему не забирает.
      manual_note: note.trim().slice(0, 500) || "Написал сам",
      claimed_by: prospect.claimed_by ?? staff.id,
      ai_handling: true,
      handover_reason: null,
      failure: null,
    })
    .eq("id", id)
    .eq("status", "manual");
  if (error) return { ok: false, why: "Не получилось отметить." };

  // Лента начинается с того, что человек отправил на самом деле. Без этой
  // записи модель, отвечая клиенту, ссылалась бы на несказанное.
  if (prospect.message) {
    await db.from("outreach_messages").insert({
      prospect_id: id,
      lead_id: prospect.lead_id,
      direction: "out",
      author: "staff",
      body: prospect.message.slice(0, 4000),
      status: "sent",
      sent_at: when,
    });
  }

  await record("prospect.manual_sent", {
    actorStaffId: staff.id,
    targetType: "prospect",
    targetId: id,
    ip,
    meta: { host: prospect.host, target: prospect.target, note: note.slice(0, 120) },
  });
  return { ok: true };
}

/**
 * «Что ответили» — ответ клиента, перенесённый руками.
 *
 * По ручному маршруту ответ приходит менеджеру на телефон и к нам не
 * попадает ничем. Перенёс — и дальше всё как в телеграме: свип увидит
 * неотвеченное входящее, модель напишет ответ, ответ ляжет в карточку.
 * Отправит его снова человек.
 */
export async function recordManualAnswer(
  id: string,
  body: string,
  staff: Staff,
  ip: string,
): Promise<{ ok: true } | { ok: false; why: string }> {
  const text = body.trim();
  if (!text) return { ok: false, why: "Пустой ответ записывать нечего." };

  const hit = await recordManualInbound(id, text);
  if (!hit.matched) return { ok: false, why: "Такого сайта в списке уже нет." };

  await record("prospect.manual_reply", {
    actorStaffId: staff.id,
    targetType: "prospect",
    targetId: id,
    ip,
    meta: { host: hit.host, verdict: hit.verdict },
  });
  return { ok: true };
}

/**
 * Лид из касания — сразу закреплён за отправившим.
 *
 * Пишется напрямую, а не через saveLead: там квалификация ассистента с
 * баллами и грейдами, а здесь ничего этого ещё нет — есть сайт, находки и
 * человек, которому написали. Выдуманные грейды в такой строке были бы
 * враньём, поэтому все неизвестные поля стоят в худшее.
 */
async function createOutreachLead(
  prospect: Prospect,
  staff: Staff,
  message: string,
  requestNo: string,
  route: Route,
): Promise<string | null> {
  const db = serviceClient();
  if (!db) return null;

  const findings = prospect.findings.slice(0, 4).map((f) => f.title).join("; ");
  const { data, error } = await db
    .from("leads")
    .insert({
      source: "outreach",
      request_no: requestNo,
      locale: "ru",
      contact_name: prospect.label ?? prospect.host,
      company: prospect.label,
      contact_handle: route.target,
      // Раньше здесь стояло «telegram» независимо от того, куда мы на самом
      // деле собирались писать. Менеджер, открыв такой лид, шёл искать
      // адресата в телеграме, которого там не было.
      contact_kind: route.kind === "handle" ? "telegram" : "phone",
      niche: prospect.label ?? prospect.host,
      niche_tier: 3,
      expertise: "medium",
      services: ["web-development"],
      budget: "B3",
      authority: "A3",
      need: "N3",
      timing: "T3",
      intent: "exploring",
      score: 0,
      grade: "D",
      priority: "nurture",
      breakdown: {},
      summary: {
        client: prospect.label ?? prospect.host,
        request: `Холодное касание по сайту ${prospect.host}. Нашли: ${findings}.`,
        niche: prospect.label ?? prospect.host,
        expertise: "не выяснено — разговора ещё не было",
        budget: "не выяснено — разговора ещё не было",
        authority: "не выяснено — разговора ещё не было",
        need: "не выяснено — пишем первыми, запроса от клиента не было",
        timing: "не выяснено — разговора ещё не было",
      },
      notes: `Первое сообщение отправлено ${staff.display_name} с рабочего аккаунта:\n\n${message}`,
      opening_line: message,
      already_told: [`Разобрали сайт ${prospect.host}`, ...prospect.findings.slice(0, 3).map((f) => f.title)],
      avoid_asking: [],
      transcript: [{ role: "assistant", content: message }],
      status: "taken",
      assigned_staff_id: staff.id,
      assigned_to: staff.username ? `@${staff.username}` : staff.display_name,
      assigned_at: new Date().toISOString(),
    })
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("касания: не завёл лид", error.message);
    return null;
  }
  return data ? String(data.id) : null;
}

/** Убрать сайт из очереди руками: не всякую находку стоит писать. */
export async function skipProspect(id: string, reason: string): Promise<void> {
  const db = serviceClient();
  if (!db) return;
  await db
    .from("prospects")
    .update({ status: "skipped", skip_reason: reason.trim().slice(0, 300) || null })
    .eq("id", id)
    .in("status", ["new", "contacting"]);
}
