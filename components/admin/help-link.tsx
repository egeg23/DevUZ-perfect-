"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { usePanelDict, usePanelLocale } from "@/components/admin/panel-locale";
import { isHelpLocale, type HelpLocale } from "@/content/admin-help";
import { shellDict } from "@/content/admin-panel/shell";
import { helpTopicFor } from "@/lib/admin/help";

/**
 * Ссылки из разделов в инструкцию — сразу на нужный пункт.
 *
 * Владелец: «в каждом разделе — как пользоваться разделом, после нажатия
 * переносит в инструкцию на нужный пункт». Кнопка раздела стоит в шапке
 * панели, а не на каждой странице: раздел, заведённый завтра, получит её
 * сам, без правки своей страницы.
 *
 * Инструкция открывается на языке панели сотрудника. Пока инструкции на
 * каком-то языке панели нет (польская пишется отдельным этапом), — на
 * русском: пустая страница объяснила бы меньше.
 */

function useHelpLang(): HelpLocale {
  const locale = usePanelLocale();
  return isHelpLocale(locale) ? locale : "ru";
}

function withLang(href: string, lang: HelpLocale): string {
  if (lang === "ru") return href;
  const [path, hash] = href.split("#");
  return `${path}?lang=${lang}${hash ? `#${hash}` : ""}`;
}

/** «Как пользоваться разделом» — в шапке, для раздела, который сейчас открыт. */
export function SectionHelpLink() {
  const pathname = usePathname();
  const lang = useHelpLang();
  const t = usePanelDict(shellDict);
  const href = pathname ? helpTopicFor(pathname) : null;
  if (!href) return null;
  return (
    <Link
      href={withLang(href, lang)}
      className="flex items-center gap-1.5 text-faint transition hover:text-green"
      title={t.sectionHelp}
    >
      <span
        aria-hidden
        className="grid h-5 w-5 place-items-center rounded-full border border-line text-[11px] leading-none"
      >
        ?
      </span>
      <span className="hidden md:inline">{t.sectionHelp}</span>
      <span className="sr-only md:hidden">{t.sectionHelp}</span>
    </Link>
  );
}

/**
 * «?» у отдельного блока — в его пункт инструкции.
 *
 * `topic` — якорь целиком, из helpAnchor(): так опечатка в нём ловится
 * тестом, который сверяет якоря в коде с пунктами инструкции.
 */
export function HelpHint({ topic, label }: { topic: string; label?: string }) {
  const lang = useHelpLang();
  const t = usePanelDict(shellDict);
  label ??= t.howItWorks;
  return (
    <Link
      href={withLang(`/admin/help#${topic}`, lang)}
      title={label}
      aria-label={label}
      className="inline-grid h-4 w-4 shrink-0 place-items-center rounded-full border border-line align-middle text-[10px] leading-none text-faint transition hover:border-green/50 hover:text-green"
    >
      ?
    </Link>
  );
}
