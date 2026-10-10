import Link from "next/link";

import { addAccountAction } from "@/app/ads/actions";
import { BTN, CARD, H2, INPUT, platformLabel, resultLine, statusLabel } from "@/components/ads/board";
import { adsDict } from "@/content/admin-panel/ads";
import { company } from "@/content/company";
import { pick } from "@/lib/admin/i18n";
import { currentAdsViewer } from "@/lib/ads/session";
import { accountsOf, proposalsOf } from "@/lib/ads/store";

export const dynamic = "force-dynamic";

/**
 * Кабинет агентства: его рекламные кабинеты и кнопка «добавить». Без входа —
 * кнопка «Войти через Telegram»: бот пришлёт одноразовую ссылку.
 */
export default async function AdsHome({ searchParams }: { searchParams: Promise<{ e?: string; r?: string }> }) {
  const { e, r } = await searchParams;
  const viewer = await currentAdsViewer();
  if (!viewer) return <SignedOut expired={e === "expired" || e === "offline"} />;

  const locale = viewer.workspace.locale;
  const t = pick(adsDict, locale);
  const accounts = await accountsOf(viewer.workspace.id);
  const waiting = await Promise.all(accounts.map(async (a) => (await proposalsOf(a.id, ["new"])).length));
  const result = resultLine(t, r, undefined);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-green">{t.title}</p>
          <h1 className="mt-1 text-xl font-semibold">{viewer.workspace.name}</h1>
        </div>
        <form action="/api/ads/logout" method="post">
          <button className="text-sm text-faint hover:text-text">{t.signOut}</button>
        </form>
      </div>
      <p className="max-w-3xl text-sm text-muted">{t.intro}</p>
      {result ? <p className="text-sm text-gold">{result.text}</p> : null}

      <section className={CARD}>
        <p className={H2}>{t.accountsTitle}</p>
        {accounts.length === 0 ? <p className="mt-2 text-sm text-muted">{t.accountsEmpty}</p> : null}
        <ul className="mt-3 space-y-2">
          {accounts.map((a, i) => (
            <li key={a.id} className="flex flex-wrap items-baseline justify-between gap-2 border-t border-line-soft pt-2">
              <Link href={`/ads/${a.id}`} className="font-medium hover:text-green">
                {a.name || a.external_id}
              </Link>
              <span className="text-xs text-faint">
                {platformLabel(t, a.platform)} · {statusLabel(t, a.status)} · {t.waiting(waiting[i])}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className={CARD}>
        <p className={H2}>{t.addAccount}</p>
        <form action={addAccountAction} className="mt-3 grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="workspace" value={viewer.workspace.id} />
          <label className="text-sm">
            <span className="text-muted">{t.platform}</span>
            <select name="platform" className={`mt-1 ${INPUT}`}>
              <option value="yandex">{t.platformYandex}</option>
              <option value="google">{t.platformGoogle}</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="text-muted">{t.accName}</span>
            <input name="name" className={`mt-1 ${INPUT}`} />
          </label>
          <label className="text-sm">
            <span className="text-muted">{t.externalId}</span>
            <input name="externalId" className={`mt-1 ${INPUT}`} />
          </label>
          <label className="text-sm">
            <span className="text-muted">{t.currency}</span>
            <select name="currency" className={`mt-1 ${INPUT}`}>
              {["UZS", "USD", "RUB", "KZT", "EUR"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <p className="text-xs text-faint sm:col-span-2">{t.externalIdNote}</p>
          <div className="sm:col-span-2">
            <button className={`${BTN} bg-green/90 text-ink hover:bg-green`}>{t.add}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function SignedOut({ expired }: { expired: boolean }) {
  // Языка ещё не знаем: человек не вошёл. Обе строки — русская и узбекская.
  const ru = pick(adsDict, "ru");
  const uz = pick(adsDict, "uz");
  return (
    <div className="mx-auto max-w-xl pt-16 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-green">{ru.title} · {uz.title}</p>
      <h1 className="mt-3 text-3xl font-semibold">{ru.signInTitle}</h1>
      <p className="mt-1 text-lg text-muted">{uz.signInTitle}</p>
      <p className="mt-5 leading-relaxed text-muted">{ru.signInLead}</p>
      <p className="mt-2 text-sm leading-relaxed text-faint">{uz.signInLead}</p>
      {expired ? <p className="mt-6 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">{ru.expired}</p> : null}
      <a href={`https://t.me/${company.telegram}?start=ads`} className="mt-8 inline-block rounded-xl bg-green px-7 py-4 font-semibold text-ink hover:bg-white">
        {ru.signIn} · {uz.signIn}
      </a>
    </div>
  );
}
