"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { setNavClassic } from "@/app/admin/actions";
import { AdminNavLink } from "@/components/admin/nav-link";
import { TaskCount } from "@/components/admin/task-count";
import { useFindHits } from "@/components/admin/use-find-hits";
import { usePanelDict } from "@/components/admin/panel-locale";
import { shellDict } from "@/content/admin-panel/shell";
import { sectionOfHref } from "@/lib/admin/help";
import { findSections, type Findable } from "@/lib/admin/nav";

/**
 * Меню панели — полоса иконок, как в эталоне «DevUz Офис».
 *
 * Владелец, 03.11.2026: «у нас выглядит всё сложно и непонятно, а тут я за
 * 5 минут понял, что к чему». Слева — узкая полоса: шесть ежедневных
 * разделов (`railOf` в lib/admin/nav.ts — выбор владельца), подсказка при
 * наведении, число на «Задачах», открытый раздел подсвечен. Редкое — под
 * «Ещё» внизу полосы, группами, как раньше в выпадающих списках. На
 * телефоне полоса — внизу экрана: пять кнопок и «Ещё».
 *
 * Быстрый переход — поиск в верхней панели (`FindButton`) или Ctrl+K (⌘K):
 * набрал «дог», Enter — «Договоры». Что показывать, решает сервер (роль и
 * галочки владельца); здесь только раскладка и клавиши. Всё открытое
 * закрывается по Esc, щелчку мимо и переходу на другую страницу.
 */

export type NavMenuItem = Findable & { quiet: boolean };

/** У этого пункта — число открытых задач (components/admin/task-count.tsx). */
const TASKS_HREF = "/admin/tasks";
export type NavMenuGroup = { id: string; label: string; items: NavMenuItem[] };

/** Событие, которым кнопка поиска в верхней панели открывает «Найти раздел». */
const FIND_EVENT = "admin-find";

/** На телефоне в нижней полосе — столько кнопок, остальное — под «Ещё». */
const PHONE_RAIL = 5;

/** Что сейчас открыто и на какой странице. Перешёл на другую — всё закрыто само, без эффекта. */
type Opened = { kind: "more" | "finder"; path: string };

export function NavMenu({
  rail,
  more,
  find,
  parents = {},
}: {
  /** Ежедневное — кнопками полосы, по порядку. */
  rail: NavMenuItem[];
  /** Редкое — группами под «Ещё». */
  more: NavMenuGroup[];
  /** Все открытые разделы, вкладки тоже — для «Найти раздел». */
  find: NavMenuItem[];
  /** Вкладка → её раздел: открыты «Договоры» — горит «Проекты». */
  parents?: Readonly<Record<string, string>>;
}) {
  const t = usePanelDict(shellDict);
  const pathname = usePathname() ?? "";
  const section = sectionOfHref(pathname);
  // В меню вкладки нет — подсвечиваем её раздел.
  const current = section ? (parents[section] ?? section) : null;
  const tabsOf = (href: string) => Object.keys(parents).filter((tab) => parents[tab] === href);
  const [state, setState] = useState<Opened | null>(null);
  const opened = state && state.path === pathname ? state : null;
  const close = () => setState(null);
  const moreActive =
    more.some((g) => g.items.some((i) => i.href === current)) ||
    rail.slice(PHONE_RAIL).some((i) => i.href === current);

  // Ctrl+K / ⌘K — из любого места панели. По коду клавиши, а не по букве:
  // на русской раскладке та же клавиша — «л». Поиск в верхней панели шлёт событие.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.code === "KeyK") {
        e.preventDefault();
        setState({ kind: "finder", path: window.location.pathname });
      }
    };
    const onFind = () => setState({ kind: "finder", path: window.location.pathname });
    window.addEventListener("keydown", onKey);
    window.addEventListener(FIND_EVENT, onFind);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(FIND_EVENT, onFind);
    };
  }, []);

  // Esc закрывает открытое.
  const isOpen = opened !== null;
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setState(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  return (
    <>
      <nav aria-label={t.nav} className="os-rail" data-tour="rail">
        {rail.map((item, i) => (
          <RailLink key={item.href} item={item} also={tabsOf(item.href)} wide={i >= PHONE_RAIL}>
            {item.href === TASKS_HREF ? <TaskCount badge /> : null}
          </RailLink>
        ))}
        <span className="os-rail-gap" aria-hidden />
        {more.length || rail.length > PHONE_RAIL ? (
          <button
            type="button"
            aria-expanded={opened?.kind === "more"}
            aria-haspopup="true"
            aria-label={t.more}
            title={t.moreHint}
            data-active={moreActive || undefined}
            data-tour="more"
            onClick={() => setState((s) => (s?.kind === "more" && s.path === pathname ? null : { kind: "more", path: pathname }))}
            className="os-rail-item"
          >
            <RailIcon href="more" />
            <span className="os-rail-label">{t.more}</span>
            <span className="os-tip" aria-hidden>
              {t.more}
            </span>
          </button>
        ) : null}
      </nav>

      {opened?.kind === "finder" ? (
        <Overlay onClose={close} label={t.findSection} top>
          <FindBox items={find} current={section} autoFocus onGo={close} />
        </Overlay>
      ) : null}

      {opened?.kind === "more"
        ? createPortal(
            <div className="admin-panel fixed inset-0 z-40" onPointerDown={close}>
              <div
                role="dialog"
                aria-modal="true"
                aria-label={t.more}
                onPointerDown={(e) => e.stopPropagation()}
                className="os-more os-glass"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* На телефоне в нижней полосе пять кнопок: шестая — здесь, первой. */}
                  {rail.length > PHONE_RAIL ? (
                    <section className="md:hidden">
                      {rail.slice(PHONE_RAIL).map((item) => (
                        <AdminNavLink key={item.href} href={item.href} quiet={item.quiet} also={tabsOf(item.href)} variant="item" onClick={close}>
                          {item.label}
                        </AdminNavLink>
                      ))}
                    </section>
                  ) : null}
                  {more.map((group) => (
                    <section key={group.id}>
                      {group.items.length > 1 ? (
                        <h2 className="px-3 pb-1 font-mono text-[11px] uppercase tracking-[0.15em] text-faint">{group.label}</h2>
                      ) : null}
                      {group.items.map((item) => (
                        <AdminNavLink key={item.href} href={item.href} quiet={item.quiet} also={tabsOf(item.href)} variant="item" onClick={close}>
                          {item.label}
                        </AdminNavLink>
                      ))}
                    </section>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/10 pt-3">
                  <NavToggle classic={false} />
                  <button type="button" onClick={close} className="text-xs text-faint hover:text-text">
                    {t.closeMenu}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

/**
 * Кнопка полосы: значок, подсказка при наведении, на телефоне — подпись под
 * значком. Нажатая горит сразу, до ответа сервера, как пункт старого меню.
 */
function RailLink({ item, also, wide, children }: { item: NavMenuItem; also: readonly string[]; wide: boolean; children?: ReactNode }) {
  const t = usePanelDict(shellDict);
  const short: Record<string, string> = {
    "/admin/hq": t.shortHome,
    "/admin/inbox": t.shortInbox,
    "/admin": t.shortLeads,
    "/admin/tasks": t.shortTasks,
    "/admin/prospect": t.shortProspect,
  };
  const pathname = usePathname();
  const [pressedAt, setPressedAt] = useState<string | null>(null);
  const here = sectionOfHref(pathname ?? "");
  const active = here === item.href || (here !== null && also.includes(here)) || (pressedAt !== null && pressedAt === pathname);
  return (
    <Link
      href={item.href}
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
      onClick={() => setPressedAt(pathname)}
      className={`os-rail-item${wide ? " os-rail-wide" : ""}`}
    >
      <RailIcon href={item.href} />
      <span className="os-rail-label" aria-hidden>
        {short[item.href] ?? item.label}
      </span>
      <span className="os-tip" aria-hidden>
        {item.label}
      </span>
      {children}
    </Link>
  );
}

/** Поиск в верхней панели: открывает то же окно, что Ctrl+K. */
export function FindButton() {
  const t = usePanelDict(shellDict);
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(FIND_EVENT))}
      title={t.findSection}
      aria-label={t.findSection}
      className="os-search"
      data-tour="search"
    >
      <SearchIcon />
      <span className="hidden min-w-0 flex-1 truncate text-left md:inline">{t.search}</span>
      <kbd className="hidden rounded bg-white/5 px-1.5 font-mono text-[11px] text-faint lg:inline">Ctrl K</kbd>
    </button>
  );
}

/** Значки полосы — по адресу раздела. Новый раздел в полосе без своего значка получает общий. */
const RAIL_ICONS: Record<string, string> = {
  "/admin/hq": "M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  "/admin/inbox": "M4 5h16v11H8l-4 4z",
  "/admin": "M4 6h16M4 12h16M4 18h10",
  "/admin/tasks": "M4 5h16v14H4zM8 12l3 3 5-6",
  "/admin/prospect": "M21 3L10 14M21 3l-7 18-4-7-7-4z",
  "/admin/mockups": "M3 5h18v14H3zM3 9h18M9 9v10",
  more: "M5 12h.01M12 12h.01M19 12h.01",
};

function RailIcon({ href }: { href: string }) {
  const d = RAIL_ICONS[href] ?? "M4 4h16v16H4z";
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="os-rail-icon"
      fill="none"
      stroke="currentColor"
      strokeWidth={href === "more" ? 3.2 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}

/**
 * Тумблер «Новое меню». Владелец, 13.10.2026: новое меню — всем, «но также
 * сделай возможность оставить как сейчас тумблером». Выбор пишется в
 * `staff.nav_classic` — один на человека, на всех его устройствах.
 */
export function NavToggle({ classic, compact = false, className = "" }: { classic: boolean; compact?: boolean; className?: string }) {
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
        {/* В строке нового меню место занимают кнопки разделов: подпись — с самых широких экранов, смысл — в подсказке. */}
        <span className={compact ? "hidden 2xl:inline" : ""}>{t.navNew}</span>
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
  const hits = useFindHits(query);
  const found = findSections(query, items);
  // Разделы и найденные компании — одним списком для стрелок и Enter.
  const all: { href: string }[] = [...found, ...hits.list];
  const go = (href: string) => {
    onGo();
    router.push(href);
  };
  const onKey = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndex((i) => Math.min(i + 1, all.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && all[index]) {
      e.preventDefault();
      go(all[index].href);
    }
  };
  const kindLabel = { lead: t.findKindLead, prospect: t.findKindProspect, project: t.findKindProject };
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
        ) : (
          <>
            {found.length ? (
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
            ) : null}
            {hits.list.length ? (
              <section className={found.length ? "mt-2 border-t border-line pt-2" : ""}>
                <h2 className="px-3 pb-1 font-mono text-[11px] uppercase tracking-[0.15em] text-faint">{t.findHits}</h2>
                <ul>
                  {hits.list.map((hit, j) => {
                    const i = found.length + j;
                    return (
                      <li key={hit.href}>
                        <Link
                          href={hit.href}
                          onClick={onGo}
                          onMouseMove={() => setIndex(i)}
                          className={`flex items-baseline justify-between gap-3 rounded-md px-3 py-2 text-text ${i === index ? "bg-surface-2" : ""}`}
                        >
                          <span className="min-w-0">
                            <span className="block truncate">{hit.label}</span>
                            {hit.meta ? <span className="block truncate text-xs text-faint">{hit.meta}</span> : null}
                          </span>
                          <span className="shrink-0 text-xs text-faint">{kindLabel[hit.kind]}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ) : null}
            {hits.loading ? <p className="px-3 py-2 text-xs text-faint">{t.findSearching}</p> : null}
            {!found.length && !hits.list.length && !hits.loading ? <p className="px-3 py-4 text-sm text-faint">{t.findNothing}</p> : null}
          </>
        )}
      </div>
      <p className="hidden border-t border-line px-4 py-2 text-[11px] text-faint md:block">{t.findKeys}</p>
    </>
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

