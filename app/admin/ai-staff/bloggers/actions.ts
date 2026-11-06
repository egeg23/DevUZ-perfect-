"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { record } from "@/lib/admin/audit";
import { requestIp, requireAdmin, requireRole, requireSection } from "@/lib/admin/guard";
import { opens, sectionAccess, withSection } from "@/lib/admin/roles";
import { listTeam, setSections } from "@/lib/admin/team";
import { keysToSave } from "@/lib/bloggers/keys";
import { checkKeys, ensureVerifyToken, saveKeysCheck } from "@/lib/bloggers/keys-store";
import { leftToday, normalizeHandle, settingsFrom } from "@/lib/bloggers/rules";
import { assess, bloggerPass } from "@/lib/bloggers/run";
import * as store from "@/lib/bloggers/store";
import { authorizeUrl, igConfig, signState } from "@/lib/ai-staff/instagram";
import { STUDIO_REDIRECT_PATH, STUDIO_STATE } from "@/lib/bloggers/direct";
import { createPartner } from "@/lib/partners/store";
import { appSecret, saveAppSecret } from "@/lib/secrets";

/**
 * Действия вкладки «Блогеры». Рабочие — отправить текст, отметить ответ или
 * отказ, вести разговор самому — всем, кому открыт раздел, в том числе
 * менеджеру по галочке владельца (решение владельца, 11.10.2026: менеджеры
 * по галочке тоже работают с блогерами). Настройки агента, поиск, оценка,
 * Instagram студии и заведение партнёра — владельцу и руководителю, по
 * роли. Деньги и клиенты сервиса здесь не трогаются: они в
 * app/admin/ai-staff/actions.ts, только у владельца.
 */

const PAGE = "/admin/ai-staff/bloggers";
const SECTION = "/admin/ai-staff";
const str = (form: FormData, name: string, max = 200) => String(form.get(name) ?? "").trim().slice(0, max);
const intOf = (form: FormData, name: string) => Number(str(form, name, 12).replace(/\s/g, ""));

export async function toggleAgent(form: FormData): Promise<void> {
  await requireRole("admin", "head");
  const settings = await store.loadSettings();
  await store.saveSettings({ ...settings, enabled: str(form, "on") === "on" });
  revalidatePath(PAGE);
}

export async function saveBloggerSettings(form: FormData): Promise<void> {
  await requireRole("admin", "head");
  const current = await store.loadSettings();
  const next = settingsFrom({
    enabled: current.enabled,
    tgDaily: intOf(form, "tgDaily"),
    directDaily: intOf(form, "directDaily"),
    firecrawlDaily: intOf(form, "firecrawlDaily"),
    minFollowers: intOf(form, "minFollowers"),
    maxFollowers: intOf(form, "maxFollowers"),
    minScore: intOf(form, "minScore"),
    queries: str(form, "queries", 4000).split("\n"),
  });
  await store.saveSettings(next);
  redirect(`${PAGE}?n=saved`);
}

/** Один проход агента сейчас — в том числе вне рабочих часов и при выключенном агенте. */
export async function findNow(): Promise<void> {
  await requireRole("admin", "head");
  const run = await bloggerPass(new Date(), { force: true });
  redirect(`${PAGE}?n=found&j=${run.judged}&a=${run.added}`);
}

export async function addBlogger(form: FormData): Promise<void> {
  await requireRole("admin", "head");
  const handle = normalizeHandle(str(form, "handle", 200));
  if (!handle) redirect(`${PAGE}?n=bad`);
  const blogger = await store.addManual(handle, str(form, "note", 500) || null);
  if (blogger && blogger.status === "found") {
    await assess(blogger, await store.loadSettings()).catch((error) => console.error("блогеры: оценка руками —", error));
  }
  revalidatePath(PAGE);
}

export async function reassess(form: FormData): Promise<void> {
  await requireRole("admin", "head");
  const blogger = await store.bloggerById(str(form, "id", 64));
  if (blogger) await assess(blogger, await store.loadSettings()).catch((error) => console.error("блогеры: оценка заново —", error));
  revalidatePath(PAGE);
}

/** Менеджер отправил текст в Direct или на почту со своего телефона. Сверх дневной нормы — не отмечаем. */
export async function markSent(form: FormData): Promise<void> {
  const staff = await requireSection(SECTION);
  const blogger = await store.bloggerById(str(form, "id", 64));
  if (!blogger || blogger.status !== "ready" || blogger.channel === "telegram") redirect(PAGE);
  const now = new Date();
  const [settings, sent] = await Promise.all([store.loadSettings(), store.sentToday(now)]);
  if (leftToday(settings.directDaily, sent.manual) <= 0) redirect(PAGE);
  await store.updateBlogger(blogger.id, {
    status: "contacted",
    contacted_at: now.toISOString(),
    contacted_by: staff.id,
    messages: [...blogger.messages, { role: "staff", text: blogger.pitch ?? "", at: now.toISOString(), via: blogger.channel ?? "direct" }],
  });
  revalidatePath(PAGE);
}

async function setStatus(form: FormData, status: store.BloggerStatus, from: readonly store.BloggerStatus[]): Promise<void> {
  const blogger = await store.bloggerById(str(form, "id", 64));
  if (!blogger || !from.includes(blogger.status)) return;
  await store.updateBlogger(blogger.id, {
    status,
    ...(status === "replied" ? { replied_at: new Date().toISOString() } : {}),
  });
}

export async function skipBlogger(form: FormData): Promise<void> {
  await requireSection(SECTION);
  await setStatus(form, "skipped", ["found", "ready", "queued"]);
  revalidatePath(PAGE);
}

export async function restoreBlogger(form: FormData): Promise<void> {
  await requireSection(SECTION);
  await setStatus(form, "ready", ["skipped", "unreachable"]);
  revalidatePath(PAGE);
}

export async function markReplied(form: FormData): Promise<void> {
  await requireSection(SECTION);
  await setStatus(form, "replied", ["contacted"]);
  revalidatePath(PAGE);
}

export async function markDeclined(form: FormData): Promise<void> {
  await requireSection(SECTION);
  await setStatus(form, "declined", ["contacted", "replied", "stats", "agreed"]);
  revalidatePath(PAGE);
}

/**
 * Блогер согласен — заводим партнёра со ссылкой (lib/partners/store.ts →
 * createPartner: основная ссылка partner_links заводится там же).
 * Telegram id блогера неизвестен — партнёр без него, как заведённый руками
 * в «Партнёрах».
 */
export async function makePartner(form: FormData): Promise<void> {
  const staff = await requireRole("admin", "head");
  const blogger = await store.bloggerById(str(form, "id", 64));
  if (!blogger || blogger.partner_id || !["contacted", "replied", "stats", "agreed"].includes(blogger.status)) redirect(PAGE);
  const result = await createPartner(
    {
      name: (blogger.name || `@${blogger.handle}`).slice(0, 120),
      telegramUserId: null,
      code: null,
      note: `Блогер Instagram @${blogger.handle}${blogger.score !== null ? `, оценка агента ${blogger.score}` : ""}${blogger.audience_score !== null ? `, аудитория ${blogger.audience_score}` : ""}.`,
    },
    staff,
    await requestIp(),
  );
  if (!result.ok) redirect(`${PAGE}?n=partner_fail&d=${result.reason}`);
  await store.updateBlogger(blogger.id, { status: "partner", partner_id: result.partner.id });
  revalidatePath(PAGE);
}

/** «Подключить Instagram студии»: вход через Instagram, возврат — instagram/callback. */
export async function connectStudioInstagram(): Promise<void> {
  await requireRole("admin", "head");
  const [cfg, key] = await Promise.all([igConfig(), appSecret("AI_STAFF_KEY")]);
  if (!cfg || !key) redirect(`${PAGE}?n=ig_off`);
  redirect(authorizeUrl(cfg.appId, signState(STUDIO_STATE, key), STUDIO_REDIRECT_PATH));
}

/** «Вести самому»: агент молчит в этом разговоре 12 часов; «Вернуть агенту» — снова отвечает. */
export async function holdAgent(form: FormData): Promise<void> {
  await requireSection(SECTION);
  const blogger = await store.bloggerById(str(form, "id", 64));
  if (blogger) {
    const on = str(form, "on") === "on";
    await store.updateBlogger(blogger.id, { human_until: on ? new Date(Date.now() + 12 * 3600_000).toISOString() : null });
  }
  revalidatePath(PAGE);
}

/**
 * «Подключения Instagram»: ключи Meta — в хранилище секретов
 * (lib/bloggers/keys.ts). Пустое поле — не менять; неверное — не пишется
 * ничего. Проверочный токен вебхука заводится сам. Есть токен — сразу
 * проверка у Meta, итог помнит вкладка. В журнал — только имена ключей.
 */
export async function saveBloggerKeys(form: FormData): Promise<void> {
  const staff = await requireRole("admin", "head");
  const parsed = keysToSave({
    fbToken: str(form, "fbToken", 2000),
    igUserId: str(form, "igUserId", 60),
    appId: str(form, "appId", 60),
    appSecret: str(form, "appSecret", 120),
  });
  if (!parsed.ok) redirect(`${PAGE}?k=bad&f=${parsed.field}&w=${parsed.why}#keys`);
  const saved: string[] = [];
  for (const { name, value } of parsed.save) if (await saveAppSecret(name, value)) saved.push(name);
  await ensureVerifyToken();
  if (saved.length) await record("ai_staff.key_saved", { actorStaffId: staff.id, ip: await requestIp(), meta: { keys: saved } });
  if (saved.length < parsed.save.length) redirect(`${PAGE}?k=failed#keys`);
  if (saved.includes("BLOGGERS_FB_TOKEN") || saved.includes("BLOGGERS_IG_USER_ID")) {
    const check = await checkKeys();
    await saveKeysCheck(check);
    redirect(`${PAGE}?k=${check.ok ? "ok" : "check"}#keys`);
  }
  redirect(`${PAGE}?k=${saved.length ? "saved" : "same"}#keys`);
}

/** «Проверить ещё раз» — то, что уже лежит в хранилище. */
export async function checkBloggerKeys(): Promise<void> {
  await requireRole("admin", "head");
  const check = await checkKeys();
  await saveKeysCheck(check);
  redirect(`${PAGE}?k=${check.ok ? "ok" : "check"}#keys`);
}

/**
 * «Кому открыт раздел»: та же галочка, что в «Команда» → «Разделы», только
 * по одному разделу и списком (setSections пишет staff.sections в журнал).
 * Только владелец — доступ к разделам выдаёт он.
 */
export async function saveBloggersAccess(form: FormData): Promise<void> {
  const owner = await requireAdmin();
  const shown = new Set(form.getAll("shown").map(String));
  const on = new Set(form.getAll("on").map(String));
  const ip = await requestIp();
  let failed = false;
  for (const member of await listTeam()) {
    if (!member.is_active || member.role === "admin" || !shown.has(member.id)) continue;
    const access = sectionAccess(member.section_access);
    const want = on.has(member.id);
    if (opens({ role: member.role, section_access: access }, SECTION) === want) continue;
    const result = await setSections(member.id, withSection(member.role, access, SECTION, want), owner, ip);
    if (!result.ok) failed = true;
  }
  revalidatePath(PAGE);
  redirect(`${PAGE}?k=${failed ? "access_failed" : "access"}#access`);
}
