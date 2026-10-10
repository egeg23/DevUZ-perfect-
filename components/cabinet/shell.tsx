import Link from "next/link";
import type { ReactNode } from "react";

import type { CabKey, CabLocale } from "@/content/ai-staff/cabinet";

/**
 * Каркас кабинета: меню, язык, выход. Меню менеджера короче: настройки,
 * каналы, команду и тариф ведёт владелец (canConfigure в lib/ai-staff/auth.ts).
 */

const NAV: Array<{ href: string; key: CabKey; owner?: boolean }> = [
  { href: "/cabinet", key: "navHome" },
  { href: "/cabinet/knowledge", key: "navKnowledge", owner: true },
  { href: "/cabinet/channels", key: "navChannels", owner: true },
  { href: "/cabinet/test", key: "navTest" },
  { href: "/cabinet/talks", key: "navTalks" },
  { href: "/cabinet/leads", key: "navLeads" },
  { href: "/cabinet/settings", key: "navSettings", owner: true },
  { href: "/cabinet/team", key: "navTeam", owner: true },
  { href: "/cabinet/plan", key: "navPlan", owner: true },
];

export function CabinetShell(props: {
  t: (key: CabKey) => string;
  locale: CabLocale;
  company: string;
  current: string;
  configure: boolean;
  support?: boolean;
  children: ReactNode;
}) {
  const { t } = props;
  return (
    <div className="mx-auto max-w-5xl px-4 pb-16">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted">{t("title")}</div>
          <div className="text-lg font-semibold">{props.company}</div>
          {props.support ? <div className="text-xs text-gold">{t("support")}</div> : null}
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="flex overflow-hidden rounded-md border border-line">
            {(["ru", "uz"] as const).map((l) => (
              <a
                key={l}
                href={`/cabinet/lang?to=${l}&back=${encodeURIComponent(props.current)}`}
                className={`px-2 py-1 ${props.locale === l ? "bg-surface-2 text-text" : "text-muted"}`}
              >
                {l.toUpperCase()}
              </a>
            ))}
          </span>
          <a href="/cabinet/logout" className="text-muted hover:text-text">
            {t("logout")}
          </a>
        </div>
      </header>
      <nav className="flex gap-1 overflow-x-auto py-3 text-sm">
        {NAV.filter((n) => props.configure || !n.owner).map((n) => {
          const on = n.href === "/cabinet" ? props.current === "/cabinet" : props.current.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 ${on ? "bg-surface-2 text-text" : "text-muted hover:text-text"}`}
            >
              {t(n.key)}
            </Link>
          );
        })}
      </nav>
      <main className="space-y-6 pt-2">{props.children}</main>
    </div>
  );
}

export function Card({ title, children, hint }: { title?: string; hint?: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-surface p-5">
      {title ? <h2 className="mb-1 text-base font-semibold">{title}</h2> : null}
      {hint ? <p className="mb-4 whitespace-pre-line text-sm text-muted">{hint}</p> : null}
      {children}
    </section>
  );
}

export const input =
  "w-full rounded-md border border-line bg-ink px-3 py-2 text-sm text-text placeholder:text-faint focus:border-green-dim focus:outline-none";
export const button = "rounded-md bg-green-dim px-4 py-2 text-sm font-medium text-ink hover:bg-green disabled:opacity-50";
export const ghost = "rounded-md border border-line px-3 py-1.5 text-sm text-muted hover:text-text";

export function Notice({ text, tone = "ok" }: { text: string; tone?: "ok" | "warn" }) {
  return (
    <div className={`rounded-md border px-4 py-3 text-sm ${tone === "ok" ? "border-green-dim/40 text-green" : "border-gold/40 text-gold"}`}>{text}</div>
  );
}
