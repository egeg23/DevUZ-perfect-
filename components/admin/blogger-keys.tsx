import { checkBloggerKeys, saveBloggerKeys, saveBloggersAccess } from "@/app/admin/ai-staff/bloggers/actions";
import { CopyMessage } from "@/components/admin/copy-message";
import { HelpHint } from "@/components/admin/help-link";
import { SubmitButton } from "@/components/admin/submit-button";
import { bloggerKeysDict } from "@/content/admin-panel/blogger-keys";
import { helpAnchor } from "@/lib/admin/help";
import { pick, type PanelLocale, type Picked } from "@/lib/admin/i18n";
import type { Role } from "@/lib/admin/roles";
import { IG_REDIRECT_PATH } from "@/lib/ai-staff/instagram";
import { STUDIO_REDIRECT_PATH } from "@/lib/bloggers/direct";
import { FB_SCOPES, KEY_FIELDS, VERIFY_NAME, expiresSoon, type KeyField, type KeyName, type KeysCheck } from "@/lib/bloggers/keys";
import type { KeyState } from "@/lib/bloggers/keys-store";
import { siteUrl } from "@/lib/seo";

const CARD = "rounded-xl border border-line bg-surface px-5 py-4";
const H2 = "text-xs uppercase tracking-wider text-faint";
const INPUT = "w-full rounded-md border border-line bg-ink px-2 py-1.5 font-mono text-sm text-text";
const LINK = "break-all text-blue-soft hover:underline";

/** Итог нажатия (?k=) → строка словаря; ok — зелёная. */
const RESULTS = { ok: "r_ok", check: "r_check", saved: "r_saved", same: "r_same", failed: "r_failed", access: "r_access", access_failed: "r_access_failed" } as const;
const GREEN: readonly string[] = ["ok", "saved", "access"];

/** «06.11 15:40» и «05.01.2027» по Ташкенту — цифрами, одинаково на всех языках. */
function when(iso: string): string {
  return new Intl.DateTimeFormat("ru-RU", { timeZone: "Asia/Tashkent", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}
function day(iso: string): string {
  return new Intl.DateTimeFormat("ru-RU", { timeZone: "Asia/Tashkent", day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(iso));
}

type T = Picked<typeof bloggerKeysDict>;

function Status({ s, t }: { s: KeyState; t: T }) {
  return (
    <>
      <span className={s.set ? "text-green" : "text-gold"}>{s.set ? t.set : t.empty}</span>
      {s.env ? <span className="text-gold">· {t.inEnv}</span> : null}
    </>
  );
}

function Copyable({ label, value, t }: { label: string; value: string; t: T }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-line-soft bg-ink px-2 py-1.5">
      <span className="text-xs text-faint">{label}</span>
      <code className="min-w-0 flex-1 break-all font-mono text-xs text-text">{value}</code>
      <CopyMessage text={value} label={t.copy} />
    </div>
  );
}

/**
 * «Подключения Instagram» во вкладке «Блогеры» — владельцу и руководителю.
 * Два дела: цифры чужих профилей (токен Facebook, Business Discovery) и
 * ответы блогерам в Direct (приложение Instagram). У каждого — что даёт,
 * «задано / пусто» и шаги, где взять ключ. Значения ключей сюда не приходят.
 */
export function BloggerKeys({
  locale,
  state,
  verify,
  check,
  result,
}: {
  locale: PanelLocale;
  state: Record<KeyName | typeof VERIFY_NAME, KeyState>;
  verify: string | null;
  check: KeysCheck | null;
  result: { k?: string; f?: string; w?: string };
}) {
  const t = pick(bloggerKeysDict, locale);
  const label: Record<KeyField, string> = { fbToken: t.fbToken, igUserId: t.igUserId, appId: t.appId, appSecret: t.appSecret };
  const nameOf = (field: KeyField) => KEY_FIELDS.find((f) => f.field === field)!.name;
  const partA = state.BLOGGERS_FB_TOKEN.set && state.BLOGGERS_IG_USER_ID.set;
  const partB = state.AI_STAFF_IG_APP_ID.set && state.AI_STAFF_IG_APP_SECRET.set && state[VERIFY_NAME].set;

  let banner: { ok: boolean; text: string } | null = null;
  if (result.k === "bad") {
    const field = KEY_FIELDS.find((f) => f.field === result.f)?.field;
    banner = { ok: false, text: result.w === "ig_token" ? t.r_igToken : t.r_bad(field ? label[field] : "?") };
  } else if (result.k && result.k in RESULTS && !result.k.startsWith("access")) {
    banner = { ok: GREEN.includes(result.k), text: t[RESULTS[result.k as keyof typeof RESULTS]] };
  }

  const field = (f: KeyField, type: "text" | "password" = "text") => (
    <label className="flex flex-col gap-1 text-xs text-faint">
      <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
        <span className="text-muted">{label[f]}</span>
        <Status s={state[nameOf(f)]} t={t} />
      </span>
      <input name={f} type={type} autoComplete="off" spellCheck={false} maxLength={2000} className={INPUT} />
    </label>
  );

  // «Шаг 1 — …» словами, а не номером списка: владелец пересказывает шаги
  // голосом и в переписке, номер должен быть в самом тексте.
  const step = (n: number, text: string, extra?: React.ReactNode) => (
    <li>
      <b className="font-semibold text-text">{t.stepNo(n)}</b> {text}
      {extra ? <div className="mt-1">{extra}</div> : null}
    </li>
  );
  const link = (href: string) => (
    <a href={href} target="_blank" rel="noreferrer" className={LINK}>
      {href.replace(/^https:\/\//, "")} ↗
    </a>
  );

  const head = (
    <>
      <h2 className={H2}>{t.title}</h2>
      <span className={partA && partB ? "text-xs text-green" : "text-xs text-gold"}>
        {t.partA}: {partA ? t.set : t.empty} · {t.partB}: {partB ? t.set : t.empty}
      </span>
      <HelpHint topic={helpAnchor("/admin/ai-staff", "bloggers-keys")} label={t.title} />
    </>
  );
  const body = (
    <>
      <p className="max-w-3xl text-sm text-muted">{t.lead}</p>

      {banner ? (
        <p
          data-result={banner.ok ? "ok" : "warn"}
          className={`rounded-lg border px-3 py-2 text-sm ${banner.ok ? "border-green/30 bg-green/10 text-green" : "border-gold/30 bg-gold/10 text-gold"}`}
        >
          {banner.text}
        </p>
      ) : null}

      <form action={saveBloggerKeys} className="space-y-5">
        {/* 1. Цифры чужих профилей — Business Discovery. */}
        <div className="space-y-2 rounded-lg border border-line-soft p-3">
          <h3 className="text-sm font-semibold">
            {t.partA} <span className={partA ? "text-green" : "text-gold"}>· {partA ? t.set : t.empty}</span>
          </h3>
          <p className="text-xs text-muted">{t.partAWhy}</p>
          {check ? (
            <div className="text-xs">
              {check.ok ? (
                <>
                  <p className="text-green">{t.checkedOk(when(check.at), `@${check.username}`)}</p>
                  {check.expiresAt ? (
                    <p className={expiresSoon(check) ? "text-gold" : "text-muted"}>
                      {expiresSoon(check) ? t.tokenSoon(day(check.expiresAt)) : t.tokenUntil(day(check.expiresAt))}
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="text-gold">
                  {t.checkedFail(when(check.at))} {t[`why_${check.reason}`]} {check.missing?.length ? t.missing(check.missing.join(", ")) : null}
                </p>
              )}
            </div>
          ) : null}
          <details open={!partA}>
            <summary className="cursor-pointer text-xs text-blue-soft">{t.howTo}</summary>
            <ol className="mt-2 space-y-2 text-xs leading-relaxed text-muted">
              {step(1, t.a1, link("https://business.facebook.com/"))}
              {step(2, t.a2, link("https://developers.facebook.com/apps/"))}
              {step(
                3,
                t.a3,
                <>
                  {link("https://developers.facebook.com/tools/explorer/")}
                  <span className="mt-1 block">
                    {t.scopesLine} <code className="font-mono text-text">{FB_SCOPES.join(", ")}</code>
                  </span>
                </>,
              )}
              {step(4, t.a4, link("https://developers.facebook.com/tools/debug/accesstoken/"))}
              {step(5, t.a5)}
              {step(6, t.a6)}
            </ol>
          </details>
          <div className="grid gap-3 sm:grid-cols-2">
            {field("fbToken", "password")}
            {field("igUserId")}
          </div>
        </div>

        {/* 2. Ответы в Direct — приложение Instagram (вход через Instagram). */}
        <div className="space-y-2 rounded-lg border border-line-soft p-3">
          <h3 className="text-sm font-semibold">
            {t.partB} <span className={partB ? "text-green" : "text-gold"}>· {partB ? t.set : t.empty}</span>
          </h3>
          <p className="text-xs text-muted">{t.partBWhy}</p>
          <details open={!partB}>
            <summary className="cursor-pointer text-xs text-blue-soft">{t.howTo}</summary>
            <ol className="mt-2 space-y-2 text-xs leading-relaxed text-muted">
              {step(1, t.b1, link("https://developers.facebook.com/apps/"))}
              {step(2, t.b2)}
              {step(3, t.b3)}
              {step(4, t.b4)}
              {step(
                5,
                t.b5,
                <div className="space-y-1">
                  <Copyable label={t.webhookUrl} value={`${siteUrl}/api/ai-staff/instagram`} t={t} />
                  {verify ? <Copyable label={t.verify} value={verify} t={t} /> : <p className="text-gold">{t.verify}: {t.verifyLater}</p>}
                </div>,
              )}
              {step(
                6,
                t.b6,
                <div className="space-y-1">
                  <Copyable label={t.redirectUrls} value={`${siteUrl}${STUDIO_REDIRECT_PATH}`} t={t} />
                  <Copyable label={t.redirectUrls} value={`${siteUrl}${IG_REDIRECT_PATH}`} t={t} />
                </div>,
              )}
              {step(7, t.b7)}
              {step(8, t.b8)}
              {step(9, t.b9)}
              {step(10, t.b10)}
              {step(11, t.b11)}
              {step(12, t.b12)}
            </ol>
          </details>
          <div className="grid gap-3 sm:grid-cols-2">
            {field("appId")}
            {field("appSecret", "password")}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SubmitButton base="rounded-lg px-4 py-2 text-sm" pendingLabel={t.saving}>
            {t.save}
          </SubmitButton>
          {state.BLOGGERS_FB_TOKEN.set ? (
            <SubmitButton base="rounded-lg px-3 py-2 text-sm" tone="quiet" formAction={checkBloggerKeys} pendingLabel={t.saving}>
              {t.checkAgain}
            </SubmitButton>
          ) : null}
        </div>
      </form>
    </>
  );

  // Всё задано и проверка не ругается — блок свёрнут: он нужен раз в 60 дней.
  const quiet = partA && partB && !banner && (!check || (check.ok && !expiresSoon(check)));
  return quiet ? (
    <details id="keys" className={CARD}>
      <summary className="flex cursor-pointer flex-wrap items-center gap-2">{head}</summary>
      <div className="mt-4 space-y-4">{body}</div>
    </details>
  ) : (
    <section id="keys" className={`${CARD} space-y-4`}>
      <div className="flex flex-wrap items-center gap-2">{head}</div>
      {body}
    </section>
  );
}

export type AccessMember = { id: string; name: string; role: Role; open: boolean };

/**
 * «Кому открыт раздел» — только владельцу: та же галочка, что в «Команда» →
 * «Разделы», списком по одному разделу (saveBloggersAccess).
 */
export function BloggersAccess({ locale, members, result }: { locale: PanelLocale; members: AccessMember[]; result?: string }) {
  const t = pick(bloggerKeysDict, locale);
  const shown = result === "access" || result === "access_failed" ? result : null;
  return (
    <section id="access" className={`${CARD} space-y-3`}>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className={H2}>{t.accessTitle}</h2>
        <HelpHint topic={helpAnchor("/admin/ai-staff", "bloggers-access")} label={t.accessTitle} />
      </div>
      <p className="max-w-3xl text-sm text-muted">{t.accessLead}</p>
      {shown ? (
        <p
          data-result={shown === "access" ? "ok" : "warn"}
          className={`rounded-lg border px-3 py-2 text-sm ${shown === "access" ? "border-green/30 bg-green/10 text-green" : "border-gold/30 bg-gold/10 text-gold"}`}
        >
          {t[shown === "access" ? "r_access" : "r_access_failed"]}
        </p>
      ) : null}
      <form action={saveBloggersAccess} className="space-y-3">
        <ul className="grid gap-x-4 gap-y-1.5 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <li className="flex items-center gap-2 text-muted">
            <input type="checkbox" checked disabled className="accent-green" aria-label={t.accessYou} />
            {t.accessYou}
          </li>
          {members.map((m) => (
            <li key={m.id}>
              <input type="hidden" name="shown" value={m.id} />
              <label className="flex cursor-pointer items-center gap-2">
                <input type="checkbox" name="on" value={m.id} defaultChecked={m.open} className="accent-green" />
                <span>{m.name}</span>
                <span className="text-xs text-faint">{m.role === "head" ? t.roleHead : t.roleManager}</span>
              </label>
            </li>
          ))}
        </ul>
        {members.some((m) => m.role === "manager") ? null : <p className="text-xs text-faint">{t.accessNone}</p>}
        <SubmitButton base="rounded-lg px-3 py-1.5 text-sm" tone="quiet">
          {t.accessSave}
        </SubmitButton>
      </form>
    </section>
  );
}
