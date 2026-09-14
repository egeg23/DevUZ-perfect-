import Link from "next/link";

import { AdminShell } from "@/components/admin/shell";
import {
  HELP_LOCALES,
  HELP_LOCALE_NAME,
  HELP_ORDER,
  helpCopy,
  isHelpLocale,
  type HelpLocale,
} from "@/content/admin-help";
import { requireStaff } from "@/lib/admin/guard";
import { SECTIONS, canSee } from "@/lib/admin/roles";

export const dynamic = "force-dynamic";

/**
 * Инструкции к панели.
 *
 * Видят все, но каждый — только про свои вкладки: описание раздела, куда
 * человека всё равно не пустят, вызывает вопросы, а не снимает их. Порядок
 * тот же, что в меню слева, чтобы читать можно было сверху вниз, сверяясь
 * с экраном.
 *
 * Язык переключается ссылкой, а не куком: страницу открывают редко, зато
 * ссылкой на узбекскую версию удобно поделиться с новым сотрудником.
 */

const CARD = "rounded-xl border border-line bg-surface px-5 py-4";

export default async function HelpPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const staff = await requireStaff();
  const { lang } = await searchParams;
  const locale: HelpLocale = isHelpLocale(lang) ? lang : "ru";
  const t = helpCopy(locale);

  const visible = HELP_ORDER.filter((href) => canSee(staff.role, href));
  const label = (href: string) => SECTIONS.find((s) => s.href === href)?.label ?? href;
  const adminOnly = (href: string) =>
    SECTIONS.find((s) => s.href === href)?.roles.length === 1;

  return (
    <AdminShell staff={staff}>
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
        <h1 className="text-lg font-semibold">{t.title}</h1>
        <div className="flex gap-2 text-sm">
          {HELP_LOCALES.map((code) => (
            <Link
              key={code}
              href={`/admin/help?lang=${code}`}
              className={code === locale ? "text-green" : "text-faint hover:text-text"}
            >
              {HELP_LOCALE_NAME[code]}
            </Link>
          ))}
        </div>
      </div>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{t.lead}</p>

      {/* ── Вкладки ───────────────────────────────────────────────────── */}
      <h2 className="mt-8 text-xs uppercase tracking-wider text-faint">{t.sectionsTitle}</h2>
      <ul className="mt-3 flex flex-col gap-3">
        {visible.map((href) => {
          const entry = t.sections[href];
          if (!entry) return null;
          return (
            <li key={href} className={CARD}>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <Link href={href} className="font-medium hover:text-green">
                  {label(href)}
                </Link>
                <span className="font-mono text-xs text-faint">{href}</span>
                {adminOnly(href) ? (
                  <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[11px] text-faint">
                    {t.ownerOnly}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted">{entry.what}</p>
              {entry.how.length ? (
                <ul className="mt-3 flex flex-col gap-1.5 text-sm leading-relaxed">
                  {entry.how.map((step) => (
                    <li key={step} className="flex gap-2">
                      <span aria-hidden className="text-green">
                        ·
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>

      {/* ── Telegram ──────────────────────────────────────────────────── */}
      <h2 className="mt-10 text-xs uppercase tracking-wider text-faint">{t.channelsTitle}</h2>
      <p className="mt-2 max-w-2xl text-sm text-muted">{t.channelsLead}</p>
      <ul className="mt-3 flex flex-col gap-3">
        {t.channels.map((channel) => (
          <li key={channel.name} className={CARD}>
            <div className="flex flex-wrap items-baseline gap-x-3">
              <span className="font-medium">{channel.name}</span>
              {channel.url ? (
                <a
                  href={channel.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="font-mono text-xs text-blue-soft hover:underline"
                >
                  {channel.url.replace("https://", "")}
                </a>
              ) : null}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted">{channel.what}</p>
            <ul className="mt-3 flex flex-col gap-1.5 text-sm leading-relaxed">
              {channel.how.map((step) => (
                <li key={step} className="flex gap-2">
                  <span aria-hidden className="text-green">
                    ·
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      {/* ── Правила ───────────────────────────────────────────────────── */}
      <h2 className="mt-10 text-xs uppercase tracking-wider text-faint">{t.rulesTitle}</h2>
      <ol className="mt-3 grid gap-3 sm:grid-cols-3">
        {t.rules.map((rule, index) => (
          <li key={rule} className={CARD}>
            <span className="font-mono text-sm text-green">0{index + 1}</span>
            <p className="mt-2 text-sm leading-relaxed">{rule}</p>
          </li>
        ))}
      </ol>

      <div className="mt-10 max-w-2xl rounded-xl border border-line-soft px-5 py-4">
        <p className="text-sm font-medium">{t.askTitle}</p>
        <p className="mt-1 text-sm leading-relaxed text-muted">{t.ask}</p>
      </div>
    </AdminShell>
  );
}
