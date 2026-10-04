import {
  addAccountAction,
  capAction,
  codeAction,
  passwordAction,
  pauseAction,
  removeAction,
  staffAction,
} from "@/app/admin/accounts/actions";
import { AdminShell } from "@/components/admin/shell";
import { SubmitButton } from "@/components/admin/submit-button";
import { accountsDict, accountsResultDict, loginErrorDict } from "@/content/admin-panel/accounts";
import { requireRole } from "@/lib/admin/guard";
import { pick } from "@/lib/admin/i18n";
import { HOURLY_CAP } from "@/lib/admin/outreach";
import { tashkentClock } from "@/lib/admin/prototype-claim";
import {
  LOGIN_ERRORS,
  MAIN_ACCOUNT,
  MAX_ACCOUNT_CAP,
  canSend,
  hourlyCapacity,
  maskedPhone,
  online,
  type LoginError,
  type WorkAccount,
} from "@/lib/admin/work-accounts";
import { accountPeople, accountStaff, accountsActivity, listAccounts } from "@/lib/admin/work-accounts-store";

export const dynamic = "force-dynamic";

const CARD = "rounded-xl border border-line bg-surface p-4";
const INPUT = "rounded-lg border border-line bg-ink px-3 py-2 text-sm text-text outline-none focus:border-green/50";
const BUTTON = "rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs transition hover:border-green/40 hover:text-green";

/** Шаги, которые сейчас делает скаут: страница обновляется сама, пока они идут. */
const WORKING = new Set(["code_requested", "code_submitted", "password_submitted"]);

function loginError(raw: string | null): LoginError | null {
  if (!raw) return null;
  const code = raw.split(":")[0];
  return (LOGIN_ERRORS as readonly string[]).includes(code) ? (code as LoginError) : "other";
}

/**
 * Кто работает на аккаунте — галочками. Список целиком: снятая галочка
 * снимает человека с аккаунта. Один человек может стоять на нескольких.
 */
function StaffForm({
  account,
  people,
  checked,
  t,
}: {
  account: string;
  people: { id: string; display_name: string }[];
  checked: readonly string[];
  t: ReturnType<typeof pick<typeof accountsDict>>;
}) {
  return (
    <form action={staffAction} className="mt-3 border-t border-line pt-3">
      <input type="hidden" name="account" value={account} />
      <p className="text-xs font-medium text-muted">{t.staffTitle}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {people.map((p) => (
          <label
            key={p.id}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-ink px-2.5 py-1 text-xs has-[:checked]:border-green/50 has-[:checked]:bg-green/5"
          >
            <input type="checkbox" name="staff" value={p.id} defaultChecked={checked.includes(p.id)} className="accent-green" />
            {p.display_name}
          </label>
        ))}
      </div>
      {checked.length ? null : <p className="mt-2 text-xs text-faint">{t.staffNone}</p>}
      <button className={`${BUTTON} mt-2`}>{t.save}</button>
    </form>
  );
}

/**
 * Рабочие аккаунты Telegram — владельцу и руководителю.
 *
 * Подключить, остановить, поставить предел в час. С Telegram говорит скаут,
 * панель только кладёт ввод — поэтому после «Отправить код» и «Войти»
 * страница несколько секунд обновляется сама, пока скаут не запишет итог.
 */
export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  // Владелец, 04.10.2026: «дай доступ к разделу „Аккаунты“ Александру, чтобы
  // он мог добавлять аккаунты для работы сам».
  const staff = await requireRole("admin", "head");
  const { r } = await searchParams;
  const locale = staff.panel_locale;
  const t = pick(accountsDict, locale);
  const results = pick(accountsResultDict, locale);
  const errors = pick(loginErrorDict, locale);
  const notice = r && Object.hasOwn(results, r) ? results[r as keyof typeof results] : null;

  const [accounts, activity, onAccount, people] = await Promise.all([
    listAccounts(),
    accountsActivity(),
    accountStaff(),
    accountPeople(),
  ]);
  const now = Date.now();
  const busy = accounts.some((a) => WORKING.has(a.status));
  const sentOf = (key: string, cap: number) => {
    const counts = activity.get(key) ?? { hour: 0, today: 0 };
    return t.sent(counts.hour, cap, counts.today);
  };
  const statusText = (a: WorkAccount) => t[`status_${a.status}` as const];

  return (
    <AdminShell staff={staff}>
      {/* Пока скаут делает шаг входа — обновляемся раз в пять секунд. */}
      {busy ? <meta httpEquiv="refresh" content="5" /> : null}
      <h1 className="text-lg font-semibold">{t.title}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{t.intro}</p>
      <p className="mt-2 text-sm text-text">{t.capacity(hourlyCapacity(accounts, now))}</p>
      <p className="mt-1 max-w-2xl text-xs leading-relaxed text-faint">{t.staffHint}</p>

      {notice ? (
        <p className="mt-4 rounded-xl border border-green/30 bg-green/5 px-4 py-3 text-sm text-green">{notice}</p>
      ) : null}

      <ul className="mt-6 space-y-3">
        <li className={CARD}>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-semibold">{t.mainTitle}</span>
            <span className="text-xs text-faint">{t.mainText(HOURLY_CAP)}</span>
          </div>
          <p className="mt-1 text-xs text-muted">{sentOf(MAIN_ACCOUNT, HOURLY_CAP)}</p>
          <StaffForm account={MAIN_ACCOUNT} people={people} checked={onAccount.get(MAIN_ACCOUNT) ?? []} t={t} />
        </li>

        {accounts.length ? null : <li className="text-sm text-faint">{t.empty}</li>}

        {accounts.map((a) => {
          const failure = loginError(a.login_error);
          const flooded = a.status === "active" && !canSend(a, now) && a.flood_until;
          return (
            <li key={a.id} className={CARD}>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-semibold">{a.label}</span>
                <span className="text-xs text-faint">
                  {[a.tg_username ? `@${a.tg_username}` : a.tg_name, maskedPhone(a.phone)].filter(Boolean).join(" · ")}
                </span>
                <span
                  className={`ml-auto rounded px-2 py-0.5 font-mono text-[11px] ${
                    a.status === "active" ? "bg-green/10 text-green" : a.status === "failed" ? "bg-red-500/10 text-red-300" : "bg-surface-2 text-faint"
                  }`}
                >
                  {statusText(a)}
                </span>
              </div>

              {a.status === "active" || a.status === "paused" ? (
                <p className="mt-1 text-xs text-muted">
                  {sentOf(a.id, a.hourly_cap)}
                  {" · "}
                  <span className={online(a, now) ? "text-green" : "text-gold"}>{online(a, now) ? t.online : t.offline}</span>
                </p>
              ) : null}
              {flooded ? <p className="mt-1 text-xs text-gold">{t.flood(tashkentClock(new Date(a.flood_until!)))}</p> : null}
              {failure ? <p className="mt-1 text-xs text-red-300">{errors[failure]}</p> : null}

              {a.status === "awaiting_code" ? (
                <form action={codeAction} className="mt-3 flex flex-wrap items-center gap-2">
                  <input type="hidden" name="account" value={a.id} />
                  <input name="code" inputMode="numeric" autoComplete="one-time-code" placeholder={t.fCode} className={INPUT} />
                  <SubmitButton pendingLabel={t.signingIn} base="rounded-lg px-3 py-2 text-xs">
                    {t.signIn}
                  </SubmitButton>
                </form>
              ) : null}

              {a.status === "awaiting_password" ? (
                <form action={passwordAction} className="mt-3 space-y-2">
                  <input type="hidden" name="account" value={a.id} />
                  <div className="flex flex-wrap items-center gap-2">
                    <input name="password" type="password" autoComplete="off" placeholder={t.fPassword} className={INPUT} />
                    <SubmitButton pendingLabel={t.signingIn} base="rounded-lg px-3 py-2 text-xs">
                      {t.signIn}
                    </SubmitButton>
                  </div>
                  <p className="text-xs text-faint">{t.passwordHint}</p>
                </form>
              ) : null}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {a.status === "active" || a.status === "paused" ? (
                  <form action={capAction} className="flex items-center gap-2">
                    <input type="hidden" name="account" value={a.id} />
                    <label className="text-xs text-faint">
                      {t.capLabel}{" "}
                      <select name="cap" defaultValue={String(a.hourly_cap)} className="rounded border border-line bg-ink px-2 py-1 text-xs">
                        {Array.from({ length: MAX_ACCOUNT_CAP }, (_, i) => String(i + 1)).map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button className={BUTTON}>{t.save}</button>
                  </form>
                ) : null}
                {a.status === "active" || a.status === "paused" ? (
                  <form action={pauseAction}>
                    <input type="hidden" name="account" value={a.id} />
                    <input type="hidden" name="paused" value={a.status === "active" ? "1" : "0"} />
                    <button className={BUTTON}>{a.status === "active" ? t.pause : t.resume}</button>
                  </form>
                ) : null}
                <form action={removeAction}>
                  <input type="hidden" name="account" value={a.id} />
                  <button className={`${BUTTON} hover:border-red-400/40 hover:text-red-300`}>{t.remove}</button>
                </form>
              </div>
              {a.status === "active" || a.status === "paused" ? <p className="mt-2 text-xs text-faint">{t.capHint}</p> : null}
              {a.status === "active" || a.status === "paused" ? (
                <StaffForm account={a.id} people={people} checked={onAccount.get(a.id) ?? []} t={t} />
              ) : null}
            </li>
          );
        })}
      </ul>

      <section className={`${CARD} mt-6 max-w-xl`}>
        <h2 className="text-sm font-semibold">{t.addTitle}</h2>
        <form action={addAccountAction} className="mt-3 space-y-3">
          <label className="block text-xs text-faint">
            {t.fLabel}
            <input name="label" placeholder={t.fLabelHint} className={`${INPUT} mt-1 w-full`} />
          </label>
          <label className="block text-xs text-faint">
            {t.fPhone}
            <input name="phone" inputMode="tel" placeholder="+998 90 123 45 67" className={`${INPUT} mt-1 w-full`} />
          </label>
          <SubmitButton pendingLabel={t.adding} base="rounded-lg px-3 py-2 text-xs">
            {t.addButton}
          </SubmitButton>
          <p className="text-xs leading-relaxed text-faint">{t.addHint}</p>
        </form>
      </section>
    </AdminShell>
  );
}
