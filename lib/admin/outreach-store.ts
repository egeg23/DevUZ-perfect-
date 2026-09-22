import Anthropic from "@anthropic-ai/sdk";

import { record } from "@/lib/admin/audit";
import {
  OUTREACH_SYSTEM,
  OUTREACH_TOOL,
  canContact,
  isStopError,
  messageProblems,
  type MessageProblem,
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
import { BATCH_CAP, auditDeep, type ProspectRow, type Walked } from "@/lib/audit/batch";
import { newRequestNo } from "@/lib/qualify/engine";
import {
  NOSITE_SYSTEM,
  NOSITE_TOOL,
  nositeProblems,
  nositePrompt,
} from "@/lib/admin/outreach-nosite";
import { effortFor } from "@/lib/model-limits";
import { modelTroubleSays } from "@/lib/model-trouble";
import { serviceClient } from "@/lib/supabase";

/**
 * Проспекты: хранение, подготовка сообщения и очередь отправки.
 *
 * Отправляет не сайт, а процесс скаута: пользовательская сессия Telegram
 * живёт там. Сайт кладёт задание в очередь и на этом заканчивает свою
 * часть — так ни отправка не ждёт страницы, ни страница отправки.
 */

/**
 * Письма — Соннет, и это измеренное решение, а не догадка.
 *
 * Замер 21 сентября на шести настоящих находках: та же проверка, что стоит
 * перед отправкой, не нашла претензий ни к одному письму ни у Опуса, ни у
 * Соннета (6/6 против 6/6), при цене $0.0095 против $0.024 за письмо и
 * ответе быстрее на секунду. Хайку в том же замере провалил два письма из
 * шести — поэтому его здесь нет.
 *
 * Своя переменная, а не общая ANTHROPIC_MODEL: у чата на сайте задача
 * другая — там продажа, и менять его модель заодно с письмами нельзя.
 */
const MODEL = process.env.OUTREACH_MODEL || "claude-sonnet-5";

export type ProspectStatus = "new" | "contacting" | "sending" | "sent" | "failed" | "skipped" | "manual";

export type Prospect = {
  id: string;
  created_at: string;
  /**
   * Адрес и домен — только у тех, у кого сайт есть.
   *
   * Половина малого бизнеса в Ташкенте живёт в инстаграме, и именно ему наш
   * разговор нужнее всего. Разбирать у такой компании нечего, но написать
   * есть о чём — от ниши.
   */
  url: string | null;
  host: string | null;
  label: string | null;
  score: number | null;
  findings: Finding[];
  contacts: Contacts;
  draft: string | null;
  message: string | null;
  /** Ниша по классификатору — по ней подбирался наш пример в письме. */
  niche: string | null;
  /**
   * Обход сайта, по которому написано письмо.
   *
   * Хранится ради проверки перед отправкой: она пересобирает тот же промпт,
   * и без этих строк отбивала письмо за числа, которые сама же и велела
   * назвать — например, за номер в адресе страницы.
   */
  walked: Walked | null;
  status: ProspectStatus;
  target: string | null;
  target_kind: RouteKind | null;
  manual_note: string | null;
  claimed_by: string | null;
  claimed_name: string | null;
  /**
   * Кто на самом деле написал и когда.
   *
   * Отдельно от `claimed_by`: та ставится на подготовке письма и остаётся,
   * даже если письмо так и не ушло. По ней считать касания нельзя — она
   * отвечает на «кто взял», а не на «кто написал».
   */
  touched_by: string | null;
  touched_at: string | null;
  sent_at: string | null;
  /** Когда перечитали переписку и нашли там своё сообщение. */
  delivered_at: string | null;
  /** Почему подтвердить не вышло. Пусто — значит подтвердилось. */
  delivery_note: string | null;
  failure: string | null;
  lead_id: string | null;
};

const COLUMNS =
  "id, created_at, url, host, label, score, findings, contacts, draft, message, niche, walked, status, target, target_kind, manual_note, claimed_by, touched_by, touched_at, sent_at, delivered_at, delivery_note, failure, lead_id, staff:claimed_by (display_name)";

function shape(row: Record<string, unknown>): Prospect {
  const joined = row.staff as unknown;
  const person = (Array.isArray(joined) ? joined[0] : joined) as { display_name?: string } | null | undefined;
  return {
    id: String(row.id),
    created_at: String(row.created_at),
    url: (row.url as string | null) ?? null,
    host: (row.host as string | null) ?? null,
    label: (row.label as string | null) ?? null,
    score: (row.score as number | null) ?? null,
    findings: Array.isArray(row.findings) ? (row.findings as Finding[]) : [],
    contacts: { ...EMPTY_CONTACTS, ...((row.contacts as Partial<Contacts>) ?? {}) },
    draft: (row.draft as string | null) ?? null,
    message: (row.message as string | null) ?? null,
    niche: (row.niche as string | null) ?? null,
    walked: (row.walked as Walked | null) ?? null,
    status: (row.status as ProspectStatus) ?? "new",
    target: (row.target as string | null) ?? null,
    target_kind: (row.target_kind as RouteKind | null) ?? null,
    manual_note: (row.manual_note as string | null) ?? null,
    claimed_by: (row.claimed_by as string | null) ?? null,
    claimed_name: person?.display_name ?? null,
    touched_by: (row.touched_by as string | null) ?? null,
    touched_at: (row.touched_at as string | null) ?? null,
    sent_at: (row.sent_at as string | null) ?? null,
    delivered_at: (row.delivered_at as string | null) ?? null,
    delivery_note: (row.delivery_note as string | null) ?? null,
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

/**
 * Компании без сайта — списком названий и одной нишей на всех.
 *
 * Разбирать здесь нечего, поэтому и прогона нет: строки ложатся в базу
 * сразу, а письмо по каждой пишется потом, от ниши.
 *
 * Ниша одна на весь список намеренно. Менеджер добавляет их пачкой, найдя
 * десяток салонов в инстаграме, — и десять раз вписывать «барбершоп» он не
 * станет, а вписав однажды, не ошибётся в девяти оставшихся.
 */
export async function saveNoSite(
  names: readonly string[],
  niche: string,
): Promise<{ added: number; skipped: number }> {
  const db = serviceClient();
  if (!db) return { added: 0, skipped: 0 };

  const clean = [...new Set(names.map((n) => n.trim()).filter(Boolean))].slice(0, BATCH_CAP);
  const trade = niche.trim().slice(0, 120);
  if (!clean.length || !trade) return { added: 0, skipped: 0 };

  /**
   * Повтор не заводит вторую карточку.
   *
   * У сайта для этого есть домен и уникальный индекс по нему. У компании без
   * сайта уникального нет ничего: единственное, чем её узнать, — название в
   * той же нише. Сравниваем по нему, без учёта регистра и лишних пробелов, —
   * второе касание того же салона это рассылка ровно так же, как и у сайта.
   */
  const { data: seen } = await db
    .from("prospects")
    .select("label")
    .is("host", null)
    .eq("niche", trade)
    .limit(1000);
  const taken = new Set(
    (seen ?? []).map((r) => String(r.label ?? "").trim().replace(/\s+/g, " ").toLowerCase()),
  );

  const fresh = clean.filter((n) => !taken.has(n.replace(/\s+/g, " ").toLowerCase()));
  if (!fresh.length) return { added: 0, skipped: clean.length };

  const { data, error } = await db
    .from("prospects")
    .insert(fresh.map((label) => ({ url: null, host: null, label: label.slice(0, 200), niche: trade })))
    .select("id");
  if (error) {
    console.error("касания: не сохранил компании без сайта", error.message);
    return { added: 0, skipped: clean.length };
  }
  return { added: (data ?? []).length, skipped: clean.length - (data ?? []).length };
}

export async function listProspects(limit = 200): Promise<Prospect[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data } = await db.from("prospects").select(COLUMNS).order("created_at", { ascending: false }).limit(limit);
  return (data ?? []).map((row) => shape(row as Record<string, unknown>));
}

/** Несколько карточек разом — для порции дня: одним запросом, а не по одной. */
export async function prospectsByIds(ids: readonly string[]): Promise<Prospect[]> {
  if (!ids.length) return [];
  const db = serviceClient();
  if (!db) return [];
  const { data } = await db.from("prospects").select(COLUMNS).in("id", [...ids]);
  return (data ?? []).map((row) => shape(row as Record<string, unknown>));
}

export async function prospectById(id: string): Promise<Prospect | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db.from("prospects").select(COLUMNS).eq("id", id).maybeSingle();
  return data ? shape(data as Record<string, unknown>) : null;
}


/* ── Подготовка сообщения ──────────────────────────────────────────────── */

/**
 * Письмо компании, у которой сайта нет.
 *
 * Отдельной функцией, а не ветками внутри общей: общая держится на разборе
 * сайта — обход, находки, балл видимости, проверка чисел по анализу. Здесь
 * нет ничего из этого, и попытка провести такую карточку тем же путём
 * кончилась бы письмом про находки, которых никто не находил.
 *
 * Зацепка одна и она проверяемая: человек ищет нишу в Google и попадает к
 * конкурентам. Адресат проверяет это со своего телефона за минуту — то же
 * правило, что и в обычном касании.
 */
async function prepareNoSite(prospect: Prospect, staff: Staff): Promise<PrepareResult> {
  const db = serviceClient();
  if (!db) return { ok: false, why: "База недоступна." };

  const niche = (prospect.niche ?? "").trim();
  // Ниша — единственное, от чего здесь можно писать. Без неё письмо вышло бы
  // про «ваш бизнес», то есть про никого.
  if (!niche) return { ok: false, why: "Не записана ниша — писать не от чего." };

  const prompt = nositePrompt({ label: prospect.label, niche, sender: staff.display_name });

  const write = async (notes: string | null): Promise<string | null> => {
    const response = await new Anthropic().beta.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: [{ type: "text" as const, text: NOSITE_SYSTEM, cache_control: { type: "ephemeral" as const } }],
      messages: [
        {
          role: "user" as const,
          content: notes
            ? `${prompt}\n\nПредыдущая попытка не прошла проверку: ${notes}\nНапиши заново, исправив это.`
            : prompt,
        },
      ],
      tools: [NOSITE_TOOL as unknown as Anthropic.Beta.BetaToolUnion],
      tool_choice: { type: "tool", name: NOSITE_TOOL.name },
      ...effortFor(MODEL, "medium"),
    });
    const block = response.content.find((b) => b.type === "tool_use");
    const raw = block && block.type === "tool_use" ? (block.input as { message?: unknown }).message : null;
    return typeof raw === "string" && raw.trim() ? raw.trim() : null;
  };

  let message: string;
  try {
    const first = await write(null);
    if (!first) return { ok: false, why: "Модель не вернула сообщение." };
    // Вторая попытка и выбор лучшей — как в обычном касании: менеджер нажал
    // и должен получить письмо, а не отказ проверки на пустом поле.
    const missed = nositeProblems(first, prompt);
    const second = missed.length ? await write(missed.map((p) => p.text).join(" ")) : null;
    const secondMissed = second ? nositeProblems(second, prompt) : null;
    message = second && secondMissed && secondMissed.length <= missed.length ? second : first;
  } catch (error) {
    return { ok: false, why: modelTroubleSays(error) };
  }

  await db
    .from("prospects")
    .update({
      message,
      niche,
      status: "contacting",
      claimed_by: prospect.claimed_by ?? staff.id,
      claimed_at: new Date().toISOString(),
    })
    .eq("id", prospect.id);

  return { ok: true, message };
}

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

  if (!process.env.ANTHROPIC_API_KEY) return { ok: false, why: "Нет ключа модели — сообщение некому написать." };

  /**
   * Компания без сайта: разбирать нечего, пишем от ниши.
   *
   * Ветка стоит до `canContact`: та проверяет находки и контакты с сайта,
   * которых здесь не будет никогда, и отказала бы всем таким карточкам
   * разом.
   */
  if (!prospect.host || !prospect.url) return prepareNoSite(prospect, staff);

  const reason = canContact({
    contacts: prospect.contacts,
    findings: prospect.findings,
    status: prospect.status,
  });
  if (reason !== "ok") return { ok: false, why: "", reason };

  const url = prospect.url;
  const host = prospect.host;

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
  const deep = await auditDeep({ raw: url, url, label: prospect.label, problem: null });
  const findings = deep.row.report?.findings.length ? deep.row.report.findings : prospect.findings;
  // Ниша нужна, чтобы подобрать наш проект из его же ниши. Раньше сюда
  // передавался null, и подбирать было не по чему.
  const niche = deep.row.report?.facts.niche ?? null;
  const reference = outreachProof({
    niche,
    label: prospect.label,
    host,
    hints: deep.walked?.hints ?? [],
  }).reference;

  const prompt = outreachPrompt({
    host,
    label: prospect.label,
    niche,
    findings,
    draft: prospect.draft,
    sender: staff.display_name,
    walked: deep.walked,
    // Язык сайта снят при обходе. Не вышло обойти — пишем по-русски: это
    // не «мы решили», а «мы не знаем», и угадывать тут дороже.
    lang: deep.walked?.lang ?? "ru",
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
      ...effortFor(MODEL, "medium"),
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
    const missed = messageProblems(first, prompt, host, hooks);
    // Из двух попыток берём ту, к которой у проверки меньше претензий.
    //
    // Раньше вторая побеждала просто потому, что была второй. Так у
    // менеджера оказывалось письмо, которое отправка не пропустит никогда:
    // он жал «Отправить», получал отказ и говорил, что кнопка не работает.
    // Совсем без письма оставлять тоже нельзя — он нажал «Связаться» и
    // должен что-то получить, — поэтому письмо сохраняется, а претензии
    // видны на карточке до нажатия.
    const second = missed.length ? await write(missed.map((p) => p.text).join(" ")) : null;
    const secondMissed = second ? messageProblems(second, prompt, host, hooks) : null;
    message = second && secondMissed && secondMissed.length <= missed.length ? second : first;
  } catch (error) {
    // Отказ модели — не «что-то пошло не так»: менеджеру нужна фраза, по
    // которой понятно, идти к владельцу или нажать ещё раз через минуту.
    return { ok: false, why: modelTroubleSays(error) };
  }

  // Что не так — покажем сотруднику рядом с текстом: правит он, а не мы.
  // Находки обхода сохраняются вместе с сообщением: на них сослалось письмо,
  // и менеджер, открыв карточку, должен видеть то же, что читает адресат.
  await db
    .from("prospects")
    .update({
      message,
      findings,
      // Ниша сохраняется вместе с письмом: по ней подобран наш пример, и
      // по ней же проверка перед отправкой поймёт, тот ли проект назван.
      niche,
      // Обход — туда же и по той же причине: проверка перед отправкой
      // пересобирает промпт, и он обязан быть тем же самым.
      walked: deep.walked ?? null,
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
/**
 * На чём споткнётся отправка этого письма.
 *
 * Одна функция на два места: её же зовёт кнопка «Отправить» и она же
 * рисует предупреждение под текстом. Разъехавшиеся проверка и показ — это
 * ровно то, на что жаловались менеджеры: «кнопка не работает». Она
 * работала и отказывала, но узнать об этом было неоткуда.
 *
 * Имя отправителя на проверку не влияет — в нём нет чисел, — поэтому
 * карточка может звать её и не зная, кто сейчас смотрит.
 */
export function sendProblems(
  prospect: Pick<Prospect, "host" | "label" | "niche" | "findings" | "draft" | "walked" | "message">,
  sender = "менеджер",
): MessageProblem[] {
  const text = (prospect.message ?? "").trim();
  if (!text) return [];

  // Компания без сайта: письмо писалось от ниши, и проверка у него своя —
  // без домена, которого нет, и без баллов, которых не было.
  if (!prospect.host) {
    return nositeProblems(
      text,
      nositePrompt({ label: prospect.label, niche: prospect.niche ?? "", sender }),
    );
  }
  const host = prospect.host;

  return messageProblems(
    text,
    // Тот же промпт, каким письмо писалось: с нишей, обходом и языком.
    // Пересобранный «почти такой же» промпт — это проверка на другом
    // основании, и именно она отбивала письма за адрес страницы, который
    // сама же и просила назвать.
    outreachPrompt({
      host,
      label: prospect.label,
      niche: prospect.niche,
      findings: prospect.findings,
      draft: prospect.draft,
      sender,
      walked: prospect.walked,
      lang: prospect.walked?.lang ?? "ru",
    }),
    host,
    outreachHooks(
      prospect.findings,
      outreachProof({ niche: prospect.niche, label: prospect.label, host }).reference?.name ?? null,
    ),
  );
}

export async function queueOutreach(id: string, message: string, staff: Staff, ip: string): Promise<QueueResult> {
  const db = serviceClient();
  if (!db) return { ok: false, why: "База недоступна." };

  const prospect = await prospectById(id);
  if (!prospect) return { ok: false, why: "Такого сайта в списке уже нет." };

  const reason = canContact({
    contacts: prospect.contacts,
    findings: prospect.findings,
    status: prospect.status,
    noSite: !prospect.host,
  });
  if (reason !== "ok") return { ok: false, why: reason };

  // Компании без сайта отправлять некуда: контактов у нас нет, и скаут не
  // найдёт их сам. Такая карточка живёт отметкой «связался сам».
  const route = routeFor(prospect.contacts);
  if (!route) return { ok: false, why: "no_way" };

  const text = message.trim();
  const problems = sendProblems({ ...prospect, message: text }, staff.display_name);
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
      // Касание засчитывается здесь, а не когда сработает очередь: работу
      // сделал человек в эту минуту, а скаут только донесёт. Если донести
      // не выйдет, карточка станет failed — такие в недельный счёт не идут.
      touched_by: staff.id,
      touched_at: new Date().toISOString(),
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

/** Из каких состояний человек может отметить, что связался сам. */
const SELF_CONTACT_FROM = ["new", "contacting", "manual"] as const;

/**
 * «Связался сам» — касание, которое человек сделал в обход скаута.
 *
 * Подключить всех менеджеров к одной сессии Telegram физически нельзя, и
 * пишут они со своих аккаунтов. Для панели это значит, что отправки она не
 * видит вовсе: письмо ушло, а карточка так и висит «новой». Второй менеджер
 * пишет тому же человеку второй раз, а недельный план не считается ни у
 * кого — потому что считать нечего.
 *
 * Отсюда отметка. Она доступна из трёх состояний, а не только с ручного
 * маршрута: связаться можно и до того, как модель написала письмо. Наличие
 * контактов при этом не проверяется — человек уже написал, и спорить с
 * фактом, потому что аудитор не нашёл на сайте телефон, панели не по чину.
 *
 * С этой минуты разговор существует: лид заводится, первое сообщение ложится
 * в ленту, касание записывается на того, кто нажал.
 */
export async function markSelfContacted(
  id: string,
  staff: Staff,
  note: string,
  ip: string,
): Promise<{ ok: true } | { ok: false; why: string }> {
  const db = serviceClient();
  if (!db) return { ok: false, why: "База недоступна." };

  const prospect = await prospectById(id);
  if (!prospect) return { ok: false, why: "Такого сайта в списке уже нет." };
  if (!(SELF_CONTACT_FROM as readonly string[]).includes(prospect.status)) {
    return { ok: false, why: "По этой карточке касание уже отмечено." };
  }

  const when = new Date().toISOString();
  const comment = note.trim().slice(0, 500);
  // Что легло в ленту: письмо, если модель его написала, иначе строка
  // менеджера. Пустая лента — это разговор, начала которого никто не знает,
  // и модель, отвечая клиенту, сослалась бы на несказанное.
  const body = (prospect.message ?? "").trim() || comment;

  // Лид заводим, если его ещё нет: с ручного маршрута он приходит уже
  // созданным в `queueOutreach`, а из «нового» и «готов текст» — нет.
  let leadId = prospect.lead_id;
  let requestNo: string | null = null;
  if (!leadId) {
    requestNo = newRequestNo();
    const route = routeFor(prospect.contacts) ?? {
      kind: "manual" as const,
      target: prospect.target ?? "",
    };
    leadId = await createOutreachLead(prospect, staff, body, requestNo, route);
  }

  const { error } = await db
    .from("prospects")
    .update({
      status: "sent",
      sent_at: when,
      touched_by: staff.id,
      touched_at: when,
      // Маршрут становится ручным: отвечать по нему тоже будет человек, и
      // скаут не должен забирать эту переписку себе.
      target_kind: "manual",
      manual_note: comment || "Связался сам",
      claimed_by: prospect.claimed_by ?? staff.id,
      lead_id: leadId,
      ...(requestNo ? { request_no: requestNo } : {}),
      ai_handling: true,
      handover_reason: null,
      failure: null,
    })
    .eq("id", id)
    .in("status", [...SELF_CONTACT_FROM]);
  if (error) return { ok: false, why: "Не получилось отметить." };

  if (body) {
    await db.from("outreach_messages").insert({
      prospect_id: id,
      lead_id: leadId,
      direction: "out",
      author: "staff",
      body: body.slice(0, 4000),
      status: "sent",
      sent_at: when,
    });
  }

  await record("prospect.manual_sent", {
    actorStaffId: staff.id,
    targetType: "prospect",
    targetId: id,
    ip,
    meta: { host: prospect.host, target: prospect.target, note: comment.slice(0, 120) },
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
