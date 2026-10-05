import { addStaff, assignHead, changeRole, claim, disable, refreshMenu, resend, saveDetails, saveNotices, setGrade, setPlan } from "./actions";
import { AdminShell } from "@/components/admin/shell";
import { HelpHint } from "@/components/admin/help-link";
import { when } from "@/components/admin/lead-table";
import { requireRole } from "@/lib/admin/guard";
import { helpAnchor } from "@/lib/admin/help";
import { teamDict } from "@/content/admin-panel/team";
import { GRADES, GRADE_TR } from "@/lib/admin/finance";
import { pick, type PanelLocale, type Picked } from "@/lib/admin/i18n";
import { NOTICES, kindsFor, offSummary, wants } from "@/lib/admin/notify-prefs";
import { ROLE_BADGE, ROLE_TITLE_TR, disables, editsStaff, hiredRoles, managesStaff, tunesNotices } from "@/lib/admin/roles";
import { listTeam, type TeamMember } from "@/lib/admin/team";
import { offboardingSummary } from "@/lib/admin/offboarding";
import { TOUCH_PLAN_MAX } from "@/lib/admin/touch-plan";

export const dynamic = "force-dynamic";

type T = Picked<typeof teamDict>;
type Tone = "ok" | "warn";

/**
 * Ответ действия (`?r=`) — код из app/admin/team/actions.ts, текст — из
 * словаря на языке того, кто смотрит. Незнакомый код не показывается.
 */
function resultOf(code: string, t: T): { text: string; tone: Tone } | null {
  const ok: Record<string, string> = {
    ok: t.r_ok,
    menu_ok: t.r_menu_ok,
    reactivated: t.r_reactivated,
    notices: t.r_notices,
    claimed: t.r_claimed,
    details: t.r_details,
  };
  const warn: Record<string, string> = {
    menu_failed: t.r_menu_failed,
    has_head: t.r_has_head,
    exists: t.r_exists,
    invalid: t.r_invalid,
    rate_invalid: t.r_rate_invalid,
    plan_nan: t.r_plan_nan,
    plan_big: t.r_plan_big(TOUCH_PLAN_MAX),
    self: t.r_self,
    last_admin: t.r_last_admin,
    owner: t.r_owner,
    not_head: t.r_not_head,
    forbidden: t.r_forbidden,
    name_empty: t.r_name_empty,
    username_bad: t.r_username_bad,
    phone_bad: t.r_phone_bad,
    gone: t.r_gone,
    offline: t.r_offline,
    failed: t.r_failed,
  };
  if (Object.hasOwn(ok, code)) return { text: ok[code], tone: "ok" };
  if (Object.hasOwn(warn, code)) return { text: warn[code], tone: "warn" };
  return null;
}

/**
 * Что стало с приглашением.
 *
 * Показывается отдельно от результата действия, потому что это отдельная
 * новость: сотрудник заведён в любом случае, но «он об этом знает» и «он об
 * этом не знает» требуют от вас разного.
 *
 * `blocked` — почти всегда не сбой, а правило Telegram: бот не может
 * написать первым тому, кто ему ни разу не писал. Обойти нечем, так
 * задумано.
 */
function inviteOf(code: string, t: T): { text: string; tone: Tone } | null {
  if (code === "sent") return { text: t.i_sent, tone: "ok" };
  if (code === "blocked") return { text: t.i_blocked(t.resend), tone: "warn" };
  if (code === "no_bot") return { text: t.i_no_bot, tone: "warn" };
  return null;
}

const INPUT =
  "w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-text outline-none focus:border-green/50";
const BUTTON =
  "rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs transition hover:border-green/40 hover:text-green";

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ r?: string; i?: string; o?: string; t?: string }>;
}) {
  // Страницу открывают двое: владелец и руководитель проектов. Видят они
  // один и тот же состав, но правит его только владелец — `manages` ниже
  // решает, что показать формой, а что просто текстом.
  const viewer = await requireRole("admin", "head");
  const manages = managesStaff(viewer.role);
  const canHire = hiredRoles(viewer.role);
  const { r, i, o, t: detachedRaw } = await searchParams;
  const locale = viewer.panel_locale;
  const t = pick(teamDict, locale);
  const team = await listTeam();

  const nameById = new Map(team.map((m) => [m.id, m.display_name]));
  const active = team.filter((m) => m.is_active);
  const gone = team.filter((m) => !m.is_active);
  const heads = active.filter((m) => m.role === "head");
  const notice = r ? resultOf(r, t) : null;
  const invite = i ? inviteOf(i, t) : null;
  // Итог отключения: семь чисел через дефис — см. back() в actions.
  const counts = o && /^\d+(-\d+){6}$/.test(o) ? o.split("-").map(Number) : null;
  const offboarded = counts
    ? offboardingSummary({
        leads: counts[0],
        talks: counts[1],
        pool: counts[2],
        team: counts[3],
        reminders: counts[4],
        transfers: counts[5],
        cards: counts[6],
      }, locale)
    : null;
  const detached = detachedRaw && /^\d+$/.test(detachedRaw) ? Number(detachedRaw) : 0;

  return (
    <AdminShell staff={viewer}>
      <h1 className="text-lg font-semibold">{t.title}</h1>
      <p className="mt-1 text-sm text-muted">{t.intro}</p>
      {manages ? null : <p className="mt-2 text-sm text-muted">{t.headIntro}</p>}

      {notice ? (
        <p
          className={`mt-4 rounded-xl border px-4 py-2.5 text-sm ${
            notice.tone === "ok"
              ? "border-green/30 bg-green/10 text-green"
              : "border-gold/30 bg-gold/10 text-gold"
          }`}
        >
          {notice.text}
        </p>
      ) : null}

      {offboarded ? (
        <p className="mt-2 rounded-xl border border-green/30 bg-green/10 px-4 py-2.5 text-sm leading-relaxed text-green">
          {t.offboarded(offboarded)}
        </p>
      ) : null}

      {detached ? (
        <p className="mt-2 rounded-xl border border-gold/30 bg-gold/10 px-4 py-2.5 text-sm leading-relaxed text-gold">
          {t.detached(detached)}
        </p>
      ) : null}

      {invite ? (
        <p
          className={`mt-2 rounded-xl border px-4 py-2.5 text-sm leading-relaxed ${
            invite.tone === "ok"
              ? "border-green/30 bg-green/10 text-green"
              : "border-gold/30 bg-gold/10 text-gold"
          }`}
        >
          {invite.text}
        </p>
      ) : null}

      {manages ? (
        <form action={refreshMenu} className="mt-4">
          <button type="submit" className="text-xs text-faint hover:text-green">
            {t.refreshMenu}
          </button>
        </form>
      ) : null}

      {/* ── Кто работает ────────────────────────────────────────────────── */}
      {/* overflow-x-auto, а не overflow-hidden: на телефоне пять колонок не
          помещаются, и спрятанными оказывались роль, дата и сама кнопка
          «Отключить» — то есть с телефона отключить сотрудника было нельзя
          вовсе. Так же устроены остальные таблицы панели. */}
      <section className="mt-6 overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="cards-on-phone w-full min-w-0 text-sm sm:min-w-[1180px]">
          <thead className="border-b border-line text-left text-xs uppercase tracking-wider text-faint">
            <tr>
              <th className="px-4 py-3 font-normal">{t.colWho}</th>
              <th className="px-4 py-3 font-normal">{t.colTelegram}</th>
              <th className="px-4 py-3 font-normal">{t.colRole}</th>
              <th className="px-4 py-3 font-normal">
                <span className="inline-flex items-center gap-1.5">
                  {t.colHead}
                  <HelpHint topic={helpAnchor("/admin/team", "claim")} label={t.helpHead} />
                </span>
              </th>
              <th className="px-4 py-3 font-normal">
                <span className="inline-flex items-center gap-1.5">
                  {t.colGrade}
                  <HelpHint topic={helpAnchor("/admin/team", "grade")} label={t.helpGrade} />
                </span>
              </th>
              <th className="px-4 py-3 font-normal">
                <span className="inline-flex items-center gap-1.5">
                  {t.colPlan}
                  <HelpHint topic={helpAnchor("/admin/team", "plan")} label={t.helpPlan} />
                </span>
              </th>
              <th className="px-4 py-3 font-normal">{t.colSince}</th>
              <th className="px-4 py-3 font-normal" />
            </tr>
          </thead>
          <tbody>
            {active.map((member) => (
              <tr key={member.id} className="border-b border-line-soft last:border-0 align-top">
                <td data-label={t.colWho} className="px-4 py-3">
                  {member.display_name}
                  {member.id === viewer.id ? (
                    <span className="ml-2 text-xs text-faint">{t.itsYou}</span>
                  ) : null}
                  {member.full_name ? <span className="block text-xs text-faint">{member.full_name}</span> : null}
                </td>
                <td data-label={t.colTelegram} className="px-4 py-3 font-mono text-xs text-muted">
                  {member.username ? `@${member.username}` : "—"}
                  <span className="block text-faint">id {member.telegram_user_id}</span>
                  {member.phone ? <span className="block text-faint">{member.phone}</span> : null}
                </td>
                <td data-label={t.colRole} className="px-4 py-3">
                  {!manages || (member.role === "admin" && member.id === viewer.id) ? (
                    // Себя не разжаловать: панель останется без хозяина.
                    // Назначить второго админа нельзя ни отсюда, ни с
                    // сервера; лишнего — можно перевести в руководители.
                    // Руководителю проектов роли показываются без кнопки.
                    <span className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-faint">
                      {ROLE_BADGE[member.role][viewer.panel_locale]}
                    </span>
                  ) : (
                    <form action={changeRole} className="flex items-center gap-2">
                      <input type="hidden" name="staff" value={member.id} />
                      <input
                        type="hidden"
                        name="role"
                        value={member.role === "head" ? "manager" : "head"}
                      />
                      <span className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-faint">
                        {ROLE_BADGE[member.role][viewer.panel_locale]}
                      </span>
                      <button type="submit" className="text-xs text-faint hover:text-green">
                        {member.role === "head" ? t.makeManager : t.makeHead}
                      </button>
                    </form>
                  )}
                </td>
                <td data-label={t.colHead} className="px-4 py-3">
                  {member.role === "admin" ? (
                    <span className="text-xs text-faint">—</span>
                  ) : !manages ? (
                    // Руководитель берёт к себе только ничьего менеджера.
                    // Своего — не отпускает: кнопки «открепить» у него нет,
                    // это решение владельца.
                    member.head_staff_id === viewer.id ? (
                      <span className="text-xs text-green">
                        {t.you}
                        <span className="block text-faint">{t.ownerDetaches}</span>
                      </span>
                    ) : member.head_staff_id ? (
                      <span className="text-xs text-muted">
                        {nameById.get(member.head_staff_id) ?? "—"}
                      </span>
                    ) : member.role === "manager" && viewer.role === "head" ? (
                      <form action={claim} className="flex items-center gap-2">
                        <input type="hidden" name="staff" value={member.id} />
                        <span className="text-xs text-muted">{t.noHead}</span>
                        <button type="submit" className="text-xs text-faint hover:text-green">
                          {t.claim}
                        </button>
                      </form>
                    ) : (
                      <span className="text-xs text-muted">{t.noHead}</span>
                    )
                  ) : (
                    // Кто чей: от этого зависит, чью статистику и финансы
                    // видит руководитель. Список — только активные
                    // руководители; себя назначить нельзя.
                    <form action={assignHead} className="flex items-center gap-2">
                      <input type="hidden" name="staff" value={member.id} />
                      <select
                        name="head"
                        defaultValue={member.head_staff_id ?? ""}
                        className="rounded-lg border border-line bg-ink px-2 py-1 text-xs text-text outline-none focus:border-green/50"
                      >
                        <option value="">{t.noHead}</option>
                        {heads
                          .filter((head) => head.id !== member.id)
                          .map((head) => (
                            <option key={head.id} value={head.id}>
                              {head.display_name}
                            </option>
                          ))}
                      </select>
                      <button type="submit" className="text-xs text-faint hover:text-green">
                        {t.save}
                      </button>
                    </form>
                  )}
                </td>
                <td data-label={t.colGrade} className="px-4 py-3">
                  {member.role === "admin" ? (
                    <span className="text-xs text-faint">—</span>
                  ) : !manages ? (
                    <span className="text-xs text-muted">
                      {GRADE_TR[member.grade][locale]}
                      {member.rate_percent === null ? null : (
                        <span className="ml-1 font-mono text-faint">{member.rate_percent} %</span>
                      )}
                    </span>
                  ) : (
                    // Грейд задаёт процент от прибыли; персональная ставка, если
                    // договорились отдельно, заменяет грейдовую на новых клиентах.
                    <form action={setGrade} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="staff" value={member.id} />
                      <select
                        name="grade"
                        defaultValue={member.grade}
                        className="rounded-lg border border-line bg-ink px-2 py-1 text-xs text-text outline-none focus:border-green/50"
                      >
                        {GRADES.map((grade) => (
                          <option key={grade} value={grade}>
                            {GRADE_TR[grade][locale]}
                          </option>
                        ))}
                      </select>
                      <input
                        name="rate"
                        inputMode="numeric"
                        placeholder={t.byGrade}
                        defaultValue={member.rate_percent ?? ""}
                        aria-label={t.rateAria}
                        className="w-24 rounded-lg border border-line bg-ink px-2 py-1 text-xs text-text outline-none focus:border-green/50"
                      />
                      <span className="text-xs text-faint">%</span>
                      <button type="submit" className="text-xs text-faint hover:text-green">
                        {t.save}
                      </button>
                    </form>
                  )}
                </td>
                {/* План на неделю. Ставит владелец — любому, руководитель —
                    своим: план, который человек ставит сам, это не план.
                    Пустое поле снимает план, и это не то же самое, что ноль:
                    «осталось 0 из 0» тому, кому план не ставили, — неправда. */}
                <td data-label={t.colPlan} className="px-4 py-3">
                  {member.role === "admin" ? (
                    <span className="text-xs text-faint">—</span>
                  ) : viewer.role === "admin" || member.head_staff_id === viewer.id ? (
                    <form action={setPlan} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="staff" value={member.id} />
                      <input
                        name="plan"
                        inputMode="numeric"
                        placeholder={t.noPlan}
                        defaultValue={member.touch_plan ?? ""}
                        aria-label={t.planAria}
                        className="w-24 rounded-lg border border-line bg-ink px-2 py-1 text-xs text-text outline-none focus:border-green/50"
                      />
                      <span className="text-xs text-faint">{t.perWeek}</span>
                      <button type="submit" className="text-xs text-faint hover:text-green">
                        {t.save}
                      </button>
                    </form>
                  ) : (
                    <span className="text-xs text-muted">
                      {member.touch_plan === null ? t.noPlan : t.planPerWeek(member.touch_plan)}
                    </span>
                  )}
                </td>
                <td data-label={t.colSince} className="px-4 py-3 text-xs text-faint">{when(member.created_at, locale)}</td>
                <td data-label="" className="px-4 py-3">
                  <div className="flex flex-col items-start gap-2">
                    {/* Доступна всегда, а не только после неудачи: прислать
                        приглашение заново тому, кто его потерял, дешевле,
                        чем объяснять по телефону, куда заходить. */}
                    <form action={resend}>
                      <input type="hidden" name="staff" value={member.id} />
                      <button type="submit" className="text-xs text-faint hover:text-green">
                        {t.resend}
                      </button>
                    </form>
                    {editsStaff(viewer.role, member.role, member.id === viewer.id) ? (
                      <DetailsBlock member={member} t={t} />
                    ) : null}
                    {tunesNotices(viewer.role, member.role, member.id === viewer.id) ? (
                      <NoticesBlock member={member} t={t} locale={locale} />
                    ) : null}
                    {member.id === viewer.id || !disables(viewer.role, member.role) ? null : (
                      <DisableBlock
                        id={member.id}
                        name={member.display_name}
                        handle={member.username}
                        t={t}
                      />
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {active.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-sm text-muted">
                  {t.empty}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>

      {/* ── Кто ушёл ────────────────────────────────────────────────────── */}
      {gone.length ? (
        <section className="mt-6 rounded-xl border border-line bg-surface px-5 py-4">
          <p className="text-xs uppercase tracking-wider text-faint">{t.goneTitle}</p>
          <p className="mt-1 text-xs text-faint">{t.goneNote}</p>
          <ul className="mt-3 flex flex-col gap-2">
            {gone.map((member) => (
              <li key={member.id} className="text-sm text-muted">
                {member.display_name}
                <span className="ml-2 font-mono text-xs text-faint">
                  {member.username ? `@${member.username}` : `id ${member.telegram_user_id}`}
                </span>
                {member.disabled_at ? (
                  <span className="ml-2 text-xs text-faint">
                    {t.disabledOn(when(member.disabled_at, locale))}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-faint">{t.goneReturn}</p>
        </section>
      ) : null}

      {/* ── Завести ─────────────────────────────────────────────────────── */}
      <section className="mt-6 max-w-2xl rounded-xl border border-line bg-surface px-5 py-4">
        <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-faint">
          {t.inviteTitle}
          <HelpHint topic={helpAnchor("/admin/team", "invite")} label={t.inviteHelp} />
        </p>
        <p className="mt-1 text-xs text-faint">
          {t.inviteNote}
          {viewer.role === "head" ? t.inviteNoteHead : null}
        </p>

        <form action={addStaff} className="mt-4 flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-faint">
              {t.fieldTelegramId}
              <input
                name="telegram_id"
                inputMode="numeric"
                pattern="[0-9]*"
                required
                placeholder="123456789"
                className={`mt-1 ${INPUT}`}
              />
            </label>
            <label className="text-xs text-faint">
              {t.fieldName}
              <input name="display_name" required placeholder={t.fieldNamePlaceholder} className={`mt-1 ${INPUT}`} />
            </label>
            <label className="text-xs text-faint">
              {t.fieldUsername} <span className="text-faint">{t.optional}</span>
              <input name="username" placeholder="ivan" className={`mt-1 ${INPUT}`} />
            </label>
            <label className="text-xs text-faint">
              {t.fieldRole}
              {canHire.length > 1 ? (
                <select name="role" defaultValue="manager" className={`mt-1 ${INPUT}`}>
                  {canHire.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_TITLE_TR[role][locale]}
                    </option>
                  ))}
                </select>
              ) : (
                // Выбора нет — и поля выбора тоже: раскрывающийся список с
                // единственным пунктом выглядит как поломка. Значение уходит
                // скрытым полем, но решает всё равно сервер.
                <>
                  <input type="hidden" name="role" value={canHire[0]} />
                  <p className="mt-1 rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-muted">
                    {ROLE_TITLE_TR[canHire[0]][locale]}
                  </p>
                </>
              )}
            </label>
          </div>
          <button type="submit" className={`self-start ${BUTTON}`}>
            {t.inviteSubmit}
          </button>
        </form>
      </section>
    </AdminShell>
  );
}

/**
 * Какие сообщения бота приходят этому человеку.
 *
 * Галочка стоит — приходит. По умолчанию стоят все: новому сотруднику
 * приходит всё, пока владелец или руководитель не снимет лишнее. Под каждой
 * галочкой — что будет без неё, потому что «Новые заявки по очереди»
 * снимают, не думая, что человек тем самым выходит из очереди.
 */
function NoticesBlock({ member, t, locale }: { member: TeamMember; t: T; locale: PanelLocale }) {
  return (
    <details className="group">
      <summary className="cursor-pointer list-none text-xs text-faint transition hover:text-green">
        {t.notices(offSummary(member.notify_off, member.role, locale))}
      </summary>
      <form action={saveNotices} className="mt-2 w-80 rounded-lg border border-line bg-surface-2 px-3 py-3">
        <input type="hidden" name="staff" value={member.id} />
        <p className="flex items-center gap-2 text-xs text-muted">
          {t.noticesFor(member.display_name)}
          <HelpHint topic={helpAnchor("/admin/team", "notices")} label={t.noticesHelp} />
        </p>
        <ul className="mt-2 flex flex-col gap-2">
          {kindsFor(member.role).map((kind) => (
            <li key={kind}>
              <label className="flex cursor-pointer items-start gap-2 text-xs">
                <input
                  type="checkbox"
                  name="on"
                  value={kind}
                  defaultChecked={wants(member.notify_off, kind)}
                  className="mt-0.5 accent-green"
                />
                <span>
                  <span className="text-text">{NOTICES[kind].title[locale]}</span>
                  <span className="block leading-snug text-faint">{t.withoutTick(NOTICES[kind].off[locale])}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs leading-snug text-faint">{t.noticesAlways}</p>
        <button type="submit" className={`${BUTTON} mt-3`}>
          {t.noticesSave}
        </button>
      </form>
    </details>
  );
}

/**
 * ФИО, имя в панели, @ и телефон — свёрнуто, как уведомления: правят это
 * редко, а строка сотрудника должна читаться с первого взгляда.
 */
function DetailsBlock({ member, t }: { member: TeamMember; t: T }) {
  return (
    <details className="group" data-staff-details>
      <summary className="cursor-pointer list-none text-xs text-faint transition hover:text-green">{t.editDetails}</summary>
      <form action={saveDetails} className="mt-2 w-80 rounded-lg border border-line bg-surface-2 px-3 py-3">
        <input type="hidden" name="staff" value={member.id} />
        <p className="flex items-center gap-2 text-xs text-muted">
          {t.detailsFor(member.display_name)}
          <HelpHint topic={helpAnchor("/admin/team", "details")} label={t.detailsHelp} />
        </p>
        <label className="mt-2 block text-xs text-faint">
          {t.fieldFullName} {t.optional}
          <input
            name="full_name"
            defaultValue={member.full_name ?? ""}
            maxLength={120}
            placeholder={t.fieldFullNamePlaceholder}
            className={`mt-1 ${INPUT}`}
          />
        </label>
        <label className="mt-2 block text-xs text-faint">
          {t.fieldName}
          <input name="display_name" required defaultValue={member.display_name} maxLength={80} className={`mt-1 ${INPUT}`} />
        </label>
        <label className="mt-2 block text-xs text-faint">
          {t.fieldUsername} {t.optional}
          <input name="username" defaultValue={member.username ? `@${member.username}` : ""} maxLength={40} className={`mt-1 ${INPUT}`} />
        </label>
        <label className="mt-2 block text-xs text-faint">
          {t.fieldPhone} {t.optional}
          <input
            name="phone"
            type="tel"
            defaultValue={member.phone ?? ""}
            maxLength={24}
            placeholder={t.fieldPhonePlaceholder}
            className={`mt-1 ${INPUT}`}
          />
        </label>
        <p className="mt-3 text-xs leading-snug text-faint">{t.detailsNote}</p>
        <button type="submit" className={`${BUTTON} mt-3`}>
          {t.detailsSave}
        </button>
      </form>
    </details>
  );
}

/**
 * Отключение с разворачивающимся предупреждением.
 *
 * `<details>`, а не окно подтверждения на JavaScript: страница серверная, и
 * тащить ради одной кнопки клиентский компонент — значит грузить его всем и
 * всегда. Но главное не в этом: `confirm()` показывает одну строку, которую
 * не читают, а здесь список последствий стоит прямо над кнопкой, и его
 * приходится проскроллить, чтобы до неё добраться.
 */
function DisableBlock({
  id,
  name,
  handle,
  t,
}: {
  id: string;
  name: string;
  handle: string | null;
  t: T;
}) {
  return (
    <details className="group">
      <summary className="cursor-pointer list-none text-xs text-faint transition hover:text-gold">
        {t.disable}
      </summary>
      <div className="mt-2 w-72 rounded-lg border border-gold/30 bg-gold/5 px-3 py-3">
        <p className="flex items-center gap-2 text-xs text-gold">
          {t.disableWhat(name)}
          <HelpHint topic={helpAnchor("/admin/team", "disable")} label={t.disableHelp} />
        </p>
        <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-4 text-xs text-muted">
          <li>{t.dSessions}</li>
          <li>{t.dNoLeads}</li>
          <li>
            {t.dRequeuePre}
            <b>{t.dRequeueBold}</b>
            {t.dRequeuePost}
          </li>
          <li>{t.dTalks}</li>
          <li>{t.dReminders}</li>
          <li>{t.dTeam}</li>
          <li>{t.dCards}</li>
          <li>{t.dHistory}</li>
        </ul>
        {/* Единственный пункт, который система выполнить не может, — и
            единственный, из-за которого «отключённый» человек продолжит
            видеть каждого нового клиента. Поэтому он отдельно и последним:
            последнее читают. */}
        <p className="mt-3 rounded border border-gold/40 bg-gold/10 px-2 py-2 text-xs text-gold">
          {t.dManualPre}
          <b>{handle ? `@${handle}` : name}</b>
          {t.dManualPost}
        </p>

        <form action={disable} className="mt-3">
          <input type="hidden" name="staff" value={id} />
          <button
            type="submit"
            className="rounded-lg border border-gold/40 bg-gold/10 px-3 py-1.5 text-xs text-gold transition hover:bg-gold/20"
          >
            {t.disableConfirm}
          </button>
        </form>
      </div>
    </details>
  );
}
