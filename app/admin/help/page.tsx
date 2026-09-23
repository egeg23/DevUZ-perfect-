import Link from "next/link";

import { AdminShell } from "@/components/admin/shell";
import { RememberHelpLang } from "@/components/admin/help-link";
import {
  HELP_LOCALES,
  HELP_LOCALE_NAME,
  HELP_ORDER,
  helpCopy,
  isHelpLocale,
  type HelpLocale,
} from "@/content/admin-help";
import { requireStaff } from "@/lib/admin/guard";
import { bodyFor, helpAnchor, parseInline, sectionOfHref, type Para } from "@/lib/admin/help";
import { ROLES, SECTIONS, canSee, isRole, type Role } from "@/lib/admin/roles";

export const dynamic = "force-dynamic";

/**
 * Инструкции к панели.
 *
 * Видят все, но каждый — только про свои разделы и своими словами: у пункта
 * может быть отдельный текст для менеджера, руководителя и владельца.
 * Описание раздела, куда человека всё равно не пустят, вызывает вопросы, а
 * не снимает их. Порядок тот же, что в меню, чтобы читать можно было сверху
 * вниз, сверяясь с экраном.
 *
 * У каждого раздела и пункта свой якорь: на него ведут кнопка «Как
 * пользоваться разделом» в шапке и «?» у блоков внутри разделов.
 *
 * Владелец может открыть инструкцию глазами руководителя или менеджера
 * (`?as=`): проверить, что команда читает, без чужого входа.
 *
 * Язык переключается ссылкой, а не куком: ссылкой на узбекскую версию
 * удобно поделиться с новым сотрудником.
 */

const CARD = "rounded-xl border border-line bg-surface px-5 py-4";

export default async function HelpPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string; as?: string }>;
}) {
  const staff = await requireStaff();
  const { lang, as } = await searchParams;
  const locale: HelpLocale = isHelpLocale(lang) ? lang : "ru";
  const t = helpCopy(locale);

  // Смотреть глазами другой роли может только владелец: у него и так видно всё.
  const role: Role = staff.role === "admin" && as && isRole(as) ? as : staff.role;

  const visible = HELP_ORDER.filter((href) => canSee(role, href));
  const sectionOf = (href: string) => SECTIONS.find((s) => s.href === href);
  const query = (next: { lang?: HelpLocale; as?: Role }) => {
    const params = new URLSearchParams();
    const l = next.lang ?? locale;
    const r = next.as ?? role;
    if (l !== "ru") params.set("lang", l);
    if (staff.role === "admin" && r !== "admin") params.set("as", r);
    const s = params.toString();
    return `/admin/help${s ? `?${s}` : ""}`;
  };

  const renderPara = (para: Para, key: number) => (
    <p key={key} className="leading-relaxed">
      {parseInline(para).map((part, i) => {
        if (part.kind === "text") return <span key={i}>{part.text}</span>;
        if (part.kind === "bold") return <b key={i} className="font-medium text-text">{part.text}</b>;
        if (part.href.startsWith("#")) {
          return (
            <a key={i} href={part.href} className="text-green underline-offset-2 hover:underline">
              {part.text}
            </a>
          );
        }
        // Ссылка в раздел, куда этой роли нельзя, — просто текст: редирект
        // на главную объяснил бы меньше, чем ничего.
        const target = sectionOfHref(part.href);
        if (part.href.startsWith("/admin") && (!target || !canSee(role, target))) {
          return <span key={i}>{part.text}</span>;
        }
        return (
          <Link key={i} href={part.href} className="text-green underline-offset-2 hover:underline">
            {part.text}
          </Link>
        );
      })}
    </p>
  );

  return (
    <AdminShell staff={staff}>
      <RememberHelpLang lang={locale} />
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
        <h1 className="text-lg font-semibold">{t.title}</h1>
        <div className="flex gap-2 text-sm">
          {HELP_LOCALES.map((code) => (
            <Link
              key={code}
              href={query({ lang: code })}
              className={code === locale ? "text-green" : "text-faint hover:text-text"}
            >
              {HELP_LOCALE_NAME[code]}
            </Link>
          ))}
        </div>
      </div>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{t.lead}</p>

      {staff.role === "admin" ? (
        <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
          <span className="text-faint">{t.viewAs}</span>
          {ROLES.map((r) => (
            <Link key={r} href={query({ as: r })} className={r === role ? "text-green" : "text-faint hover:text-text"}>
              {t.roleNames[r]}
            </Link>
          ))}
        </div>
      ) : null}

      {/* ── Оглавление ────────────────────────────────────────────────── */}
      <nav aria-label={t.contentsTitle} className={`mt-6 ${CARD}`}>
        <p className="text-xs uppercase tracking-wider text-faint">{t.contentsTitle}</p>
        <ul className="mt-3 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((href) => (
            <li key={href}>
              <a href={`#${helpAnchor(href)}`} className="text-muted hover:text-green">
                {sectionOf(href)?.label ?? href}
              </a>
            </li>
          ))}
          <li>
            <a href="#channels" className="text-muted hover:text-green">
              {t.channelsTitle}
            </a>
          </li>
          <li>
            <a href="#rules" className="text-muted hover:text-green">
              {t.rulesTitle}
            </a>
          </li>
        </ul>
      </nav>

      {/* ── Разделы ───────────────────────────────────────────────────── */}
      <h2 className="mt-8 text-xs uppercase tracking-wider text-faint">{t.sectionsTitle}</h2>
      <div className="mt-3 flex flex-col gap-4">
        {visible.map((href) => {
          const entry = t.sections[href];
          const section = sectionOf(href);
          if (!entry || !section) return null;
          const items = entry.items
            .map((item) => ({ item, body: bodyFor(item, role, section.roles) }))
            .filter((x): x is { item: typeof x.item; body: readonly Para[] } => x.body !== null);
          return (
            <section
              key={href}
              id={helpAnchor(href)}
              className={`scroll-mt-28 ${CARD} target:border-green/50`}
            >
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3 className="text-base font-semibold">{section.label}</h3>
                <Link href={href} className="text-xs text-faint hover:text-green">
                  {t.openSection} →
                </Link>
                {section.roles.length === 1 ? (
                  <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[11px] text-faint">{t.ownerOnly}</span>
                ) : null}
              </div>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">{entry.what}</p>

              {items.length ? (
                <ol className="mt-4 flex flex-col gap-3">
                  {items.map(({ item, body }) => (
                    <li
                      key={item.id}
                      id={helpAnchor(href, item.id)}
                      className="scroll-mt-28 rounded-lg border border-line-soft px-4 py-3 target:border-green/60 target:bg-green/5"
                    >
                      <h4 className="flex items-baseline gap-2 text-sm font-medium">
                        <a
                          href={`#${helpAnchor(href, item.id)}`}
                          aria-hidden
                          tabIndex={-1}
                          className="font-mono text-xs text-faint hover:text-green"
                        >
                          #
                        </a>
                        {item.title}
                      </h4>
                      <div className="mt-2 flex max-w-3xl flex-col gap-2 text-sm text-muted">
                        {body.map(renderPara)}
                      </div>
                    </li>
                  ))}
                </ol>
              ) : null}
            </section>
          );
        })}
      </div>

      {/* ── Telegram ──────────────────────────────────────────────────── */}
      <h2 id="channels" className="mt-10 scroll-mt-28 text-xs uppercase tracking-wider text-faint">
        {t.channelsTitle}
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-muted">{t.channelsLead}</p>
      <ul className="mt-3 flex flex-col gap-3">
        {t.channels
          .filter((channel) => !channel.roles || channel.roles.includes(role))
          .map((channel) => (
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
      <h2 id="rules" className="mt-10 scroll-mt-28 text-xs uppercase tracking-wider text-faint">
        {t.rulesTitle}
      </h2>
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
