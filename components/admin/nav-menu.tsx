"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { setNavClassic } from "@/app/admin/actions";
import { AdminNavLink } from "@/components/admin/nav-link";
import { usePanelDict } from "@/components/admin/panel-locale";
import { shellDict } from "@/content/admin-panel/shell";
import { sectionOfHref } from "@/lib/admin/help";
import { findSections, type Findable } from "@/lib/admin/nav";

/**
 * Меню панели: группы вместо двадцати с лишним пунктов в строку.
 *
 * Владелец, 12.10.2026: «вкладок куча, пока в каждую задаешь — с ума
 * пойдешь». На компьютере — строка групп, наведение показывает разделы
 * группы, щелчок закрепляет список. На телефоне — одна кнопка «Меню» со
 * всеми группами и полем поиска. Быстрый переход — «Найти раздел» или
 * Ctrl+K (⌘K): набрал «дог», Enter — «Договоры».
 *
 * Что показывать, решает сервер (`menuOf` в lib/admin/nav.ts — роль и
 * галочки владельца); здесь только раскладка и клавиши. Всё открытое
 * закрывается по Esc, щелчку мимо и переходу на другую страницу.
 */

export type NavMenuItem = Findable & { quiet: boolean };
export type NavMenuGroup = { id: string; label: string; items: NavMenuItem[] };

/** Что сейчас открыто и на какой странице. Перешёл на другую — всё закрыто само, без эффекта. */
type Opened = { kind: "group"; id: string; pinned: boolean; path: string } | { kind: "sheet" | "finder"; path: string };

export function NavMenu({ groups }: { groups: NavMenuGroup[] }) {
  const t = usePanelDict(shellDict);
  const pathname = usePathname() ?? "";
  const current = sectionOfHref(pathname);
  const [state, setState] = useState<Opened | null>(null);
  const opened = state && state.path === pathname ? state : null;
  const close = () => setState(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const items = groups.flatMap((g) => g.items);
  const currentItem = items.find((i) => i.href === current);

  // Ctrl+K / ⌘K — из любого места панели. По коду клавиши, а не по букве:
  // на русской раскладке та же клавиша — «л».
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.code === "KeyK") {
        e.preventDefault();
        setState({ kind: "finder", path: window.location.pathname });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Esc и щелчок мимо закрывают открытое.
  const isOpen = opened !== null;
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setState(null);
    };
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setState((s) => (s?.kind === "group" ? null : s));
      }
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [isOpen]);

  const hover = (id: string) => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    // Закреплённый список переезжает на соседнюю группу и остаётся закреплённым — как меню программы.
    setState((s) => {
      const pinned = s?.kind === "group" && s.pinned && s.path === pathname;
      return s?.kind === "group" && s.id === id && s.path === pathname ? s : { kind: "group", id, pinned, path: pathname };
    });
  };
  const leave = () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    leaveTimer.current = setTimeout(() => setState((s) => (s?.kind === "group" && !s.pinned ? null : s)), 180);
  };
  // Щелчок по группе: открытую наведением — закрепляет, закреплённую — закрывает.
  const toggle = (id: string) =>
    setState((s) =>
      s?.kind === "group" && s.id === id && s.path === pathname
        ? s.pinned
          ? null
          : { ...s, pinned: true }
        : { kind: "group", id, pinned: true, path: pathname },
    );

  return (
    <div ref={rootRef} className="mx-auto max-w-7xl px-4 pb-2.5 sm:px-5 sm:pb-3">
      {/* Компьютер: строка групп. */}
      <nav aria-label={t.nav} className="hidden items-center gap-x-4 text-sm md:flex lg:gap-x-5">
        {groups.map((group) => {
          if (group.items.length === 1) {
            const only = group.items[0];
            return (
              <AdminNavLink key={only.href} href={only.href} quiet={only.quiet}>
                {only.label}
              </AdminNavLink>
            );
          }
          const active = group.items.some((i) => i.href === current);
          const shown = opened?.kind === "group" && opened.id === group.id;
          const here = active ? group.items.find((i) => i.href === current) : undefined;
          return (
            <div key={group.id} className="relative" onMouseEnter={() => hover(group.id)} onMouseLeave={leave}>
              <button
                type="button"
                aria-expanded={shown}
                aria-haspopup="true"
                onClick={() => toggle(group.id)}
                className={`-mb-px flex items-center gap-1 whitespace-nowrap border-b-2 pb-1 transition-colors ${
                  active ? "border-green font-medium text-green" : `border-transparent hover:text-text ${shown ? "text-text" : "text-muted"}`
                }`}
              >
                {group.label}
                {here ? <span className="font-normal text-green/70">· {here.label}</span> : null}
                <Chevron up={shown} />
              </button>
              <div
                className={`absolute left-0 top-full z-30 pt-2 ${shown ? "" : "hidden"}`}
                // Список прямо под кнопкой: между ними нет щели, в которую
                // проваливается мышь по дороге вниз.
              >
                <div className="min-w-[13rem] rounded-lg border border-line bg-surface p-1.5 shadow-xl shadow-black/40">
                  {group.items.map((item) => (
                    <AdminNavLink key={item.href} href={item.href} quiet={item.quiet} variant="item" onClick={close}>
                      {item.label}
                    </AdminNavLink>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
        <NavToggle classic={false} className="ml-auto" />
        {/* На узком экране — только значок: длинные названия групп по-польски
            и по-узбекски иначе выталкивают кнопку за край. */}
        <button
          type="button"
          onClick={() => setState({ kind: "finder", path: pathname })}
          title={t.findSection}
          className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-md border border-line px-2.5 py-1.5 text-faint transition hover:border-muted hover:text-text lg:py-1"
        >
          <SearchIcon />
          <span className="hidden lg:inline">{t.findSection}</span>
          <kbd className="hidden rounded bg-surface-2 px-1.5 font-mono text-[11px] text-faint lg:inline">Ctrl K</kbd>
        </button>
      </nav>

      {/* Телефон: одна кнопка, рядом — где ты сейчас. */}
      <div className="flex items-center gap-3 text-sm md:hidden">
        <button
          type="button"
          aria-expanded={opened?.kind === "sheet"}
          onClick={() => setState({ kind: "sheet", path: pathname })}
          className="flex min-w-0 items-center gap-2 rounded-md border border-line px-3 py-1.5 text-text"
        >
          <MenuIcon />
          <span>{t.menu}</span>
          {currentItem ? <span className="truncate text-green">· {currentItem.label}</span> : null}
        </button>
        <NavToggle classic={false} className="ml-auto" />
      </div>

      {opened?.kind === "finder" ? (
        <Overlay onClose={close} label={t.findSection} top>
          <FindBox items={items} current={current} autoFocus onGo={close} />
        </Overlay>
      ) : null}

      {opened?.kind === "sheet" ? (
        <Overlay onClose={close} label={t.menu}>
          <FindBox items={items} current={current} autoFocus={false} onGo={close}>
            <div className="space-y-4">
              {groups.map((group) => (
                <section key={group.id}>
                  {group.items.length > 1 ? (
                    <h2 className="px-3 pb-1 font-mono text-[11px] uppercase tracking-[0.15em] text-faint">{group.label}</h2>
                  ) : null}
                  {group.items.map((item) => (
                    <AdminNavLink key={item.href} href={item.href} quiet={item.quiet} variant="item" onClick={close}>
                      {item.label}
                    </AdminNavLink>
                  ))}
                </section>
              ))}
            </div>
          </FindBox>
        </Overlay>
      ) : null}
    </div>
  );
}

/**
 * Тумблер «Новое меню». Владелец, 13.10.2026: новое меню — всем, «но также
 * сделай возможность оставить как сейчас тумблером». Выбор пишется в
 * `staff.nav_classic` — один на человека, на всех его устройствах.
 */
export function NavToggle({ classic, className = "" }: { classic: boolean; className?: string }) {
  const t = usePanelDict(shellDict);
  return (
    <form action={setNavClassic} className={`shrink-0 ${className}`}>
      <input type="hidden" name="classic" value={classic ? "0" : "1"} />
      <button
        type="submit"
        role="switch"
        aria-checked={!classic}
        title={t.navNewHint}
        className="flex items-center gap-2 whitespace-nowrap text-xs text-faint transition hover:text-text"
      >
        <span>{t.navNew}</span>
        <span
          aria-hidden
          className={`relative inline-block h-4 w-7 rounded-full transition-colors ${classic ? "bg-line" : "bg-green/70"}`}
        >
          <span
            className={`absolute top-0.5 h-3 w-3 rounded-full bg-text transition-all ${classic ? "left-0.5" : "left-[0.875rem]"}`}
          />
        </span>
      </button>
    </form>
  );
}

/**
 * Окно поверх страницы. Через портал в body: у шапки размытый фон
 * (backdrop-filter), а он делает её рамкой для fixed-потомков — окно
 * оказалось бы внутри шапки, а не поверх экрана.
 */
function Overlay({ onClose, label, top, children }: { onClose: () => void; label: string; top?: boolean; children: ReactNode }) {
  const t = usePanelDict(shellDict);
  return createPortal(
    <div className="admin-panel fixed inset-0 z-50 flex justify-center bg-ink/70 backdrop-blur-sm" onPointerDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onPointerDown={(e) => e.stopPropagation()}
        className={`flex max-h-[85vh] w-full flex-col overflow-hidden border-line bg-surface shadow-2xl shadow-black/50 ${
          top ? "mx-4 mt-[12vh] max-w-lg self-start rounded-xl border" : "self-start rounded-b-xl border-b"
        }`}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-faint">{label}</span>
          <button type="button" onClick={onClose} aria-label={t.closeMenu} className="px-1 text-lg leading-none text-faint hover:text-text">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

/**
 * Поле «Найти раздел» и то, что под ним: пока пусто — `children` (на
 * телефоне это группы) или все разделы, набрали — подходящие. Стрелки
 * выбирают, Enter открывает.
 */
function FindBox({
  items,
  current,
  autoFocus,
  onGo,
  children,
}: {
  items: NavMenuItem[];
  current: string | null;
  autoFocus: boolean;
  onGo: () => void;
  children?: ReactNode;
}) {
  const t = usePanelDict(shellDict);
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const found = findSections(query, items);
  const go = (href: string) => {
    onGo();
    router.push(href);
  };
  const onKey = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndex((i) => Math.min(i + 1, found.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && found[index]) {
      e.preventDefault();
      go(found[index].href);
    }
  };
  return (
    <>
      <div className="flex items-center gap-2 border-b border-line px-4 py-2">
        <SearchIcon />
        <input
          type="text"
          enterKeyHint="go"
          autoComplete="off"
          autoFocus={autoFocus}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIndex(0);
          }}
          onKeyDown={onKey}
          placeholder={t.findPlaceholder}
          aria-label={t.findSection}
          className="w-full border-0 bg-transparent py-1.5 text-text outline-none placeholder:text-faint"
        />
      </div>
      <div className="overflow-y-auto overscroll-contain p-1.5">
        {!query.trim() && children ? (
          children
        ) : found.length ? (
          <ul>
            {found.map((item, i) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onGo}
                  onMouseMove={() => setIndex(i)}
                  aria-current={item.href === current ? "page" : undefined}
                  className={`flex items-baseline justify-between gap-3 rounded-md px-3 py-2 ${i === index ? "bg-surface-2" : ""} ${
                    item.href === current ? "font-medium text-green" : "text-text"
                  }`}
                >
                  <span>{item.label}</span>
                  <span className="text-xs text-faint">{item.group}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-3 py-4 text-sm text-faint">{t.findNothing}</p>
        )}
      </div>
      <p className="hidden border-t border-line px-4 py-2 text-[11px] text-faint md:block">{t.findKeys}</p>
    </>
  );
}

function Chevron({ up }: { up: boolean }) {
  return (
    <svg aria-hidden width="10" height="10" viewBox="0 0 10 10" className={`opacity-60 transition-transform ${up ? "rotate-180" : ""}`}>
      <path d="M1.5 3.5 5 7l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden width="14" height="14" viewBox="0 0 16 16" className="shrink-0 text-faint">
      <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="m10.5 10.5 3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg aria-hidden width="14" height="14" viewBox="0 0 16 16" className="shrink-0">
      <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
