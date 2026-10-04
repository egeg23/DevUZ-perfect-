"use client";

import { useEffect, useRef, useState } from "react";

import { searchHelpAction } from "@/app/admin/help/actions";
import type { HelpLocale, HelpSearchCopy } from "@/content/admin-help";
import type { HelpSearchResult } from "@/lib/admin/help-search";
import type { Role } from "@/lib/admin/roles";

/**
 * «Найти в инструкции» — вопрос своими словами, ответ — прыжок в пункт.
 *
 * Найденный пункт пять секунд мигает зелёной рамкой: страница длинная, и
 * без подсветки после прыжка глаз ищет, куда смотреть. Так же подсвечивается
 * пункт, в который пришли по «?» или «Как пользоваться разделом», и любой,
 * на который перешли ссылкой внутри страницы, — подсветка одна на всё.
 *
 * Переход — через `location.hash`, как у обычной ссылки «#…»: работает
 * «Назад», а у пункта включается та же отметка `:target`, что и при
 * переходе из раздела.
 */

export const FLASH_MS = 5000;
export const FLASH_CLASS = "help-flash";
/** Подсветить пункт ещё раз, когда адрес уже указывает на него: hashchange тогда не будет. */
const FLASH_EVENT = "devuz:help-flash";

export function HelpSearch({ copy, lang, as }: { copy: HelpSearchCopy; lang: HelpLocale; as?: Role }) {
  const [question, setQuestion] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<HelpSearchResult | null>(null);
  const [failed, setFailed] = useState(false);
  const lit = useRef<{ el: HTMLElement; timer: ReturnType<typeof setTimeout> } | null>(null);

  useEffect(() => {
    const light = (id: string) => {
      const el = id ? document.getElementById(id) : null;
      if (!el) return;
      if (lit.current) {
        clearTimeout(lit.current.timer);
        lit.current.el.classList.remove(FLASH_CLASS);
      }
      // Снять и поставить класс в одном кадре — анимация не перезапустится.
      void el.offsetWidth;
      el.classList.add(FLASH_CLASS);
      const timer = setTimeout(() => {
        el.classList.remove(FLASH_CLASS);
        if (lit.current?.el === el) lit.current = null;
      }, FLASH_MS);
      lit.current = { el, timer };
    };
    const fromHash = () => light(decodeURIComponent(location.hash.slice(1)));
    const again = (e: Event) => light((e as CustomEvent<string>).detail);
    fromHash();
    window.addEventListener("hashchange", fromHash);
    window.addEventListener(FLASH_EVENT, again);
    return () => {
      window.removeEventListener("hashchange", fromHash);
      window.removeEventListener(FLASH_EVENT, again);
      if (lit.current) clearTimeout(lit.current.timer);
    };
  }, []);

  const go = (anchor: string) => {
    if (location.hash === `#${anchor}`) {
      // Тот же пункт ещё раз — прокрутить и подсветить самим.
      document.getElementById(anchor)?.scrollIntoView({ block: "start" });
      window.dispatchEvent(new CustomEvent(FLASH_EVENT, { detail: anchor }));
    } else {
      location.hash = anchor;
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const text = question.trim();
    if (text.length < 2 || pending) return;
    setPending(true);
    setFailed(false);
    try {
      const found = await searchHelpAction(text, lang, as);
      setResult(found);
      if (found.hits[0]) go(found.hits[0].anchor);
    } catch {
      setFailed(true);
      setResult(null);
    } finally {
      setPending(false);
    }
  };

  const [first, ...more] = result?.hits ?? [];
  const label = (hit: { section: string; title: string }) =>
    hit.title === hit.section ? hit.section : `${hit.section} › ${hit.title}`;

  return (
    <form onSubmit={submit} role="search" className="mt-5 max-w-2xl">
      <label htmlFor="help-question" className="text-xs uppercase tracking-wider text-faint">
        {copy.label}
      </label>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input
          id="help-question"
          type="search"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          maxLength={300}
          placeholder={copy.placeholder}
          className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none transition focus:border-green/60"
        />
        <button
          type="submit"
          disabled={pending || question.trim().length < 2}
          className="rounded-lg border border-green/40 px-4 py-2 text-sm text-green transition hover:bg-green/10 disabled:opacity-50"
        >
          {pending ? copy.searching : copy.button}
        </button>
      </div>

      <div aria-live="polite" className="mt-2 text-sm">
        {failed ? <p className="text-muted">{copy.failed}</p> : null}
        {result && !first ? <p className="text-muted">{copy.nothing}</p> : null}
        {first ? (
          <p className="text-muted">
            {copy.opened}{" "}
            <a href={`#${first.anchor}`} onClick={(e) => (e.preventDefault(), go(first.anchor))} className="text-green hover:underline">
              {label(first)}
            </a>
          </p>
        ) : null}
        {first && result?.by === "words" ? <p className="mt-1 text-xs text-faint">{copy.byWords}</p> : null}
        {more.length ? (
          <p className="mt-1 text-muted">
            {copy.also}{" "}
            {more.map((hit, i) => (
              <span key={hit.anchor}>
                {i ? " · " : null}
                <a href={`#${hit.anchor}`} onClick={(e) => (e.preventDefault(), go(hit.anchor))} className="text-green hover:underline">
                  {label(hit)}
                </a>
              </span>
            ))}
          </p>
        ) : null}
      </div>
    </form>
  );
}
