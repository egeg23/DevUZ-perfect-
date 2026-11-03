"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";

import { usePanelDict } from "@/components/admin/panel-locale";
import { tourDict } from "@/content/admin-panel/tour";
import { TOUR_VERSION } from "@/lib/admin/panel-tour";

/**
 * Знакомство с новой панелью — 7 шагов при первом заходе (владелец,
 * 03.11.2026: «красивый туториал на 5-7 шагов, чтобы они поняли, что
 * поменялся визуал и стало удобнее, но функционал не трогали»).
 *
 * Шаг подсвечивает настоящее место на экране (`data-tour` у полосы, «Ещё»,
 * поиска, кружка; значки разделов — по адресу), остальное затемнено.
 * Места нет (раздел закрыт галочкой, другая ширина) — шаг карточкой по
 * центру. «Видел» — в базе (/admin/tour), браузер помнит, чтобы не
 * спрашивать на каждом переходе. «Пропустить», Esc и «Понятно» — больше не
 * показываем. Снова — кнопкой в «Настройках» (событие TOUR_EVENT).
 * Только `transform` и `opacity`; при prefers-reduced-motion — без движения.
 */

export const TOUR_EVENT = "admin-tour";
const LOCAL = `admin-tour:${TOUR_VERSION}`;

type Step = { key: "s1" | "s2" | "s3" | "s4" | "s5" | "s6" | "s7"; target: string | null };

const STEPS: readonly Step[] = [
  { key: "s1", target: null },
  { key: "s2", target: "[data-tour='rail']" },
  { key: "s3", target: "[data-tour='more']" },
  { key: "s4", target: "[data-tour='search']" },
  { key: "s5", target: ".os-rail a[href='/admin/inbox']" },
  { key: "s6", target: ".os-rail a[href='/admin']" },
  { key: "s7", target: "[data-tour='me']" },
];

type Box = { top: number; left: number; width: number; height: number };

const PAD = 8;

function boxOf(selector: string | null): Box | null {
  if (!selector) return null;
  const el = document.querySelector<HTMLElement>(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return null;
  return { top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 };
}

export function PanelTour() {
  const t = usePanelDict(tourDict);
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  const [vw, setVw] = useState(1280);

  // Первый заход: браузер помнит «видел» — не спрашиваем; иначе спросим сервер.
  useEffect(() => {
    let seen = false;
    try {
      seen = localStorage.getItem(LOCAL) === "1";
    } catch {}
    const again = () => {
      setIndex(0);
      setOpen(true);
    };
    window.addEventListener(TOUR_EVENT, again);
    if (!seen) {
      fetch("/admin/tour", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : { seen: true }))
        .then((body: { seen?: boolean }) => {
          if (body.seen) {
            try {
              localStorage.setItem(LOCAL, "1");
            } catch {}
          } else setOpen(true);
        })
        .catch(() => {});
    }
    return () => window.removeEventListener(TOUR_EVENT, again);
  }, []);

  const step = STEPS[index];
  const place = useCallback(() => {
    setVw(window.innerWidth);
    setBox(boxOf(step.target));
  }, [step.target]);

  useLayoutEffect(() => {
    if (!open) return;
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, place]);

  const finish = useCallback(
    (skipped: boolean) => {
      setOpen(false);
      try {
        localStorage.setItem(LOCAL, "1");
      } catch {}
      fetch("/admin/tour", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: index + 1, skipped }),
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

  if (!open) return null;
  const last = index === STEPS.length - 1;
  const phone = vw < 768;

  // Карточка — рядом с подсветкой: справа от полосы, под верхней панелью,
  // на телефоне — над нижней полосой или под верхней. Нет места — по центру.
  let cardStyle: React.CSSProperties = {};
  let centered = !box;
  if (box && !phone) {
    if (box.left < 120 && box.width < 140) {
      cardStyle = { left: box.left + box.width + 16, top: Math.max(72, Math.min(box.top, window.innerHeight - 360)) };
    } else {
      cardStyle = { top: box.top + box.height + 14, left: Math.max(16, Math.min(box.left, vw - 416)) };
    }
  } else if (box && phone) {
    const bottomHalf = box.top > window.innerHeight / 2;
    cardStyle = bottomHalf ? { left: 12, right: 12, bottom: window.innerHeight - box.top + 14 } : { left: 12, right: 12, top: box.top + box.height + 14 };
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
          <span className="os-pill os-pill-new">{t.step(index + 1, STEPS.length)}</span>
          <button type="button" onClick={() => finish(true)} className="ml-auto text-xs text-faint transition hover:text-text">
            {t.skip}
          </button>
        </div>
        {index === 0 ? (
          <div className="os-tour-hero" aria-hidden>
            <span>✓</span>
          </div>
        ) : null}
        <h2 className="mt-3 font-display text-lg font-bold text-text">{t[`${step.key}_title`]}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{t[`${step.key}_body`]}</p>
        {index === 0 ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {[t.s1_same, t.s1_new, t.s1_easy].map((x, i) => (
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
                {t.back}
              </button>
            ) : null}
            <button
              type="button"
              autoFocus
              onClick={() => (last ? finish(false) : setIndex(index + 1))}
              className="rounded-xl bg-green px-4 py-2 text-sm font-semibold text-ink transition hover:bg-green-dim"
            >
              {last ? t.done : t.next}
            </button>
          </div>
        </div>
      </section>
    </div>,
    document.body,
  );
}

/** «Показать знакомство ещё раз» — в «Настройках». */
export function TourAgain() {
  const t = usePanelDict(tourDict);
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(TOUR_EVENT))}
      className="rounded-lg border border-line px-3 py-1.5 text-sm text-text transition hover:border-green/50 hover:text-green"
    >
      {t.again}
    </button>
  );
}
