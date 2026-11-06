"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";

import { usePanelDict } from "@/components/admin/panel-locale";
import { marketsTourDict } from "@/content/admin-panel/markets-tour";
import { tourDict } from "@/content/admin-panel/tour";
import { MARKETS_TOUR, TOUR_DONE_EVENT, TOUR_VERSION } from "@/lib/admin/panel-tour";

/**
 * Обучение по «Рынкам» — менеджерам один раз, остальным по кнопке.
 *
 * Владелец, 06.11.2026: «краткий туториал для менеджеров по новым странам
 * разделу сделай, прям очень простыми словами, подсвети нужные моменты в
 * дашборде». Восемь шагов на трёх экранах: где раздел (полоса слева),
 * список стран, страница страны (для примера — Россия). Шаг со своим
 * адресом сам переходит туда; номер шага живёт в sessionStorage, поэтому
 * обучение продолжается и после перехода. Подсветка — настоящие места
 * страницы (`data-tour` в components/admin/markets-view.tsx); места нет —
 * карточка по центру. Менеджеру стартует после знакомства с панелью
 * (TOUR_DONE_EVENT), «видел» — в базе (/admin/tour, MARKETS_TOUR).
 * Стили — те же `.os-tour*`, что у знакомства; при prefers-reduced-motion
 * без движения.
 */

export const MARKETS_TOUR_EVENT = "admin-markets-tour";
/** Страна для примера — первая из главных рынков. */
export const MARKET_DEMO = "/admin/markets/ru";

const LOCAL = `admin-tour:${MARKETS_TOUR}`;
const PANEL_LOCAL = `admin-tour:${TOUR_VERSION}`;
const SESSION = "admin-markets-tour-step";

type Key = "m1" | "m2" | "m3" | "m4" | "m5" | "m6" | "m7" | "m8";
type Step = { key: Key; path: string | null; target: string | null };

const STEPS: readonly Step[] = [
  { key: "m1", path: null, target: null },
  { key: "m2", path: null, target: ".os-rail a[href='/admin/prospect']" },
  { key: "m3", path: "/admin/markets", target: "[data-tour='market-main']" },
  { key: "m4", path: MARKET_DEMO, target: "[data-tour='market-why']" },
  { key: "m5", path: MARKET_DEMO, target: "[data-tour='market-start']" },
  { key: "m6", path: MARKET_DEMO, target: "[data-tour='market-place']" },
  { key: "m7", path: MARKET_DEMO, target: "[data-tour='market-scout']" },
  { key: "m8", path: null, target: null },
];

type Box = { top: number; left: number; width: number; height: number };
const PAD = 8;

function measure(el: HTMLElement): Box | null {
  const r = el.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return null;
  return { top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 };
}

function read(storage: () => Storage, key: string): string | null {
  try {
    return storage().getItem(key);
  } catch {
    return null;
  }
}
function write(storage: () => Storage, key: string, value: string | null): void {
  try {
    if (value === null) storage().removeItem(key);
    else storage().setItem(key, value);
  } catch {}
}

export function MarketsTour({ auto, classic, countries, places }: { auto: boolean; classic: boolean; countries: number; places: number }) {
  const t = usePanelDict(marketsTourDict);
  const c = usePanelDict(tourDict);
  const router = useRouter();
  const pathname = (usePathname() ?? "").replace(/\/+$/, "") || "/admin";
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  const [ready, setReady] = useState(false);
  const [vw, setVw] = useState(1280);

  // Старт: по кнопке; продолжение после перехода; менеджеру — сам, один раз.
  useEffect(() => {
    const start = () => {
      write(() => sessionStorage, SESSION, "0");
      setIndex(0);
      setOpen(true);
    };
    window.addEventListener(MARKETS_TOUR_EVENT, start);
    const resume = Number(read(() => sessionStorage, SESSION));
    const going = read(() => sessionStorage, SESSION) !== null && Number.isInteger(resume) && resume >= 0 && resume < STEPS.length;
    if (going) {
      setIndex(resume);
      setOpen(true);
    }
    let check: (() => void) | null = null;
    if (!going && auto && read(() => localStorage, LOCAL) !== "1") {
      check = () => {
        fetch("/admin/tour", { cache: "no-store" })
          .then((r) => (r.ok ? r.json() : { tours: { [MARKETS_TOUR]: true } }))
          .then((body: { tours?: Record<string, boolean> }) => {
            if (body.tours?.[MARKETS_TOUR] === false) start();
            else write(() => localStorage, LOCAL, "1");
          })
          .catch(() => {});
      };
      // Сначала знакомство с панелью: пока его не закрыли, не мешаем.
      if (classic || read(() => localStorage, PANEL_LOCAL) === "1") check();
      else window.addEventListener(TOUR_DONE_EVENT, check, { once: true });
    }
    return () => {
      window.removeEventListener(MARKETS_TOUR_EVENT, start);
      if (check) window.removeEventListener(TOUR_DONE_EVENT, check);
    };
  }, [auto, classic]);

  const step = STEPS[index];

  // Шаг с другим адресом — переходим; на месте — ищем подсветку (страница
  // может догружаться), прокручиваем к ней и меряем.
  useEffect(() => {
    if (!open) return;
    write(() => sessionStorage, SESSION, String(index));
    setReady(false);
    setBox(null);
    if (step.path && pathname !== step.path) {
      router.push(step.path);
      return;
    }
    if (!step.target) {
      setReady(true);
      return;
    }
    let tries = 0;
    let timer = 0;
    const find = () => {
      const el = document.querySelector<HTMLElement>(step.target!);
      if (!el) {
        if (++tries < 20) timer = window.setTimeout(find, 75);
        else setReady(true);
        return;
      }
      const r = el.getBoundingClientRect();
      if (r.top < 80 || r.bottom > window.innerHeight - 120) {
        const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        el.scrollIntoView({ block: "center", behavior: calm ? "auto" : "smooth" });
      }
      timer = window.setTimeout(() => {
        setBox(measure(el));
        setReady(true);
      }, 380);
    };
    find();
    return () => window.clearTimeout(timer);
  }, [open, index, pathname, step.path, step.target, router]);

  const place = useCallback(() => {
    setVw(window.innerWidth);
    if (!step.target) return;
    const el = document.querySelector<HTMLElement>(step.target);
    if (el) setBox(measure(el));
  }, [step.target]);

  useLayoutEffect(() => {
    if (!open || !ready) return;
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, ready, place]);

  const finish = useCallback(
    (skipped: boolean) => {
      setOpen(false);
      write(() => sessionStorage, SESSION, null);
      write(() => localStorage, LOCAL, "1");
      fetch("/admin/tour", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tour: MARKETS_TOUR, step: index + 1, skipped }),
      }).catch(() => {});
    },
    [index],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish(true);
      else if (e.key === "ArrowRight") setIndex((i) => Math.min(i + 1, STEPS.length - 1));
      else if (e.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, finish]);

  if (!open || !ready) return open ? createPortal(<div className="admin-panel os-tour" aria-hidden><div className="os-tour-dim" /></div>, document.body) : null;
  const last = index === STEPS.length - 1;
  const phone = vw < 768;

  // Карточка — рядом с подсветкой: справа от полосы слева; под местом, а
  // если внизу не помещается — над ним; на телефоне — сверху или снизу.
  let cardStyle: React.CSSProperties = {};
  let centered = !box;
  if (box && !phone) {
    const left = Math.max(16, Math.min(box.left, vw - 416));
    if (box.left < 120 && box.width < 140) {
      cardStyle = { left: box.left + box.width + 16, top: Math.max(72, Math.min(box.top, window.innerHeight - 360)) };
    } else if (box.top + box.height + 330 < window.innerHeight) {
      cardStyle = { top: box.top + box.height + 14, left };
    } else if (box.top > 330) {
      cardStyle = { bottom: window.innerHeight - box.top + 14, left };
    } else centered = true;
  } else if (box && phone) {
    const bottomHalf = box.top + box.height / 2 > window.innerHeight / 2;
    cardStyle = bottomHalf ? { left: 12, right: 12, top: 12 } : { left: 12, right: 12, bottom: 12 };
  } else centered = true;

  return createPortal(
    <div className="admin-panel os-tour" role="dialog" aria-modal="true" aria-label={t.label}>
      {box ? (
        <div className="os-tour-spot" style={{ top: box.top, left: box.left, width: box.width, height: box.height }} aria-hidden />
      ) : (
        <div className="os-tour-dim" aria-hidden />
      )}
      <section key={step.key} className={`os-tour-card os-glass ${centered ? "is-center" : ""}`} style={centered ? undefined : cardStyle}>
        <div className="flex items-center gap-2">
          <span className="os-pill os-pill-new">{c.step(index + 1, STEPS.length)}</span>
          <button type="button" onClick={() => finish(true)} className="ml-auto text-xs text-faint transition hover:text-text">
            {c.skip}
          </button>
        </div>
        {index === 0 ? (
          <div className="os-tour-hero" aria-hidden>
            <span>🌍</span>
          </div>
        ) : null}
        <h2 className="mt-3 font-display text-lg font-bold text-text">{t[`${step.key}_title`]}</h2>
        {step.key === "m8" ? (
          <>
            <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-muted">
              {[t.m8_1, t.m8_2, t.m8_3, t.m8_4].map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ol>
            <p className="mt-3 text-xs text-faint">{t.m8_ask}</p>
          </>
        ) : (
          <p className="mt-2 text-sm leading-relaxed text-muted">{t[`${step.key as Exclude<Key, "m8">}_body`]}</p>
        )}
        {index === 0 ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {[t.m1_countries(countries), t.m1_places(places), t.m1_easy].map((x, i) => (
              <li key={x} className={`os-pill ${i === 0 ? "os-pill-new" : i === 1 ? "os-pill-work" : "os-pill-wait"}`}>
                {x}
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-5 flex items-center gap-3">
          <div className="flex gap-1.5" aria-hidden>
            {STEPS.map((s, i) => (
              <i key={s.key} className={`os-tour-dot ${i === index ? "is-on" : i < index ? "is-done" : ""}`} />
            ))}
          </div>
          <div className="ml-auto flex gap-2">
            {index > 0 ? (
              <button type="button" onClick={() => setIndex(index - 1)} className="rounded-xl border border-white/10 px-3 py-2 text-sm text-muted transition hover:text-text">
                {c.back}
              </button>
            ) : null}
            <button
              type="button"
              autoFocus
              onClick={() => (last ? finish(false) : setIndex(index + 1))}
              className="rounded-xl bg-green px-4 py-2 text-sm font-semibold text-ink transition hover:bg-green-dim"
            >
              {last ? t.done : c.next}
            </button>
          </div>
        </div>
      </section>
    </div>,
    document.body,
  );
}

/** «Показать на экране, как пользоваться «Рынками»» — в «Рынках» и «Настройках». */
export function MarketsTourAgain() {
  const t = usePanelDict(marketsTourDict);
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(MARKETS_TOUR_EVENT))}
      className="rounded-lg border border-line px-3 py-1.5 text-sm text-text transition hover:border-green/50 hover:text-green"
    >
      {t.again}
    </button>
  );
}
