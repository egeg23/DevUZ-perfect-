"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { helpTopicFor } from "@/lib/admin/help";

/**
 * Ссылки из разделов в инструкцию — сразу на нужный пункт.
 *
 * Владелец: «в каждом разделе — как пользоваться разделом, после нажатия
 * переносит в инструкцию на нужный пункт». Кнопка раздела стоит в шапке
 * панели, а не на каждой странице: раздел, заведённый завтра, получит её
 * сам, без правки своей страницы.
 *
 * Язык инструкции запоминается в браузере: узбекоязычному менеджеру
 * переключать его заново при каждом «?» — повод больше не нажимать.
 */

const LANG_KEY = "devuz-help-lang";

function useHelpLang(): string | null {
  const [lang, setLang] = useState<string | null>(null);
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(LANG_KEY);
      if (saved === "uz") setLang(saved);
    } catch {
      // Хранилище закрыто — инструкция откроется по-русски.
    }
  }, []);
  return lang;
}

function withLang(href: string, lang: string | null): string {
  if (!lang) return href;
  const [path, hash] = href.split("#");
  return `${path}?lang=${lang}${hash ? `#${hash}` : ""}`;
}

/** «Как пользоваться разделом» — в шапке, для раздела, который сейчас открыт. */
export function SectionHelpLink() {
  const pathname = usePathname();
  const lang = useHelpLang();
  const href = pathname ? helpTopicFor(pathname) : null;
  if (!href) return null;
  return (
    <Link
      href={withLang(href, lang)}
      className="flex items-center gap-1.5 text-faint transition hover:text-green"
      title="Как пользоваться разделом"
    >
      <span
        aria-hidden
        className="grid h-5 w-5 place-items-center rounded-full border border-line text-[11px] leading-none"
      >
        ?
      </span>
      <span className="hidden md:inline">Как пользоваться разделом</span>
      <span className="sr-only md:hidden">Как пользоваться разделом</span>
    </Link>
  );
}

/**
 * «?» у отдельного блока — в его пункт инструкции.
 *
 * `topic` — якорь целиком, из helpAnchor(): так опечатка в нём ловится
 * тестом, который сверяет якоря в коде с пунктами инструкции.
 */
export function HelpHint({ topic, label = "Как это работает" }: { topic: string; label?: string }) {
  const lang = useHelpLang();
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

/** Страница инструкций запоминает выбранный язык для кнопок «?». */
export function RememberHelpLang({ lang }: { lang: string }) {
  useEffect(() => {
    try {
      if (lang === "ru") window.localStorage.removeItem(LANG_KEY);
      else window.localStorage.setItem(LANG_KEY, lang);
    } catch {
      // Не запомнили — не страшно, язык переключается ссылкой.
    }
  }, [lang]);
  return null;
}
