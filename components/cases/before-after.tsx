"use client";

import Image from "next/image";
import { useRef, useState, type PointerEvent } from "react";

import { cn } from "@/lib/cn";

type View = "desktop" | "mobile";

export type BeforeAfterLabels = {
  before: string;
  after: string;
  desktop: string;
  mobile: string;
  slider: string;
  /** Подписи кадров для скринридера; `{view}` — «компьютер» или «телефон». */
  altBefore: string;
  altAfter: string;
};

/**
 * Шторки «было / стало»: старый сайт заказчика и тот, что сделали мы —
 * раздел за разделом, ровно в тех же пунктах: первый экран против первого
 * экрана, каталог против каталога, контакты против контактов.
 *
 * Как у Namuna — два кадра друг на друге, верхний обрезан по ползунку. Но
 * тянуть здесь можно за любое место кадра, а не только за ручку: на iPhone
 * невидимый input[type=range] поверх картинки откликается лишь на касание
 * самого бегунка, и шторка «не двигалась» у половины людей. Поэтому палец и
 * мышь ведут pointer-события, а для клавиатуры и скринридера остаётся
 * настоящий ползунок — невидимый, но с фокусом.
 *
 * `touch-action: pan-y` — чтобы вертикальный свайп по высокому телефонному
 * кадру листал страницу, а не застревал в шторке.
 *
 * Компьютер и телефон — два набора снимков, переключатель один на все
 * шторки. Пока человек не выбрал сам, показывается тот, что подходит его
 * экрану (переключение по ширине в CSS — без мигания после загрузки).
 */
export function BeforeAfter({
  slug,
  parts,
  labels,
}: {
  slug: string;
  /** Разделы по порядку: ключ — часть имени файла, label — подпись на языке страницы. */
  parts: readonly { key: string; label: string }[];
  labels: BeforeAfterLabels;
}) {
  const [view, setView] = useState<View | null>(null);

  const tab = (value: View) => {
    // Выбран сам — подсвечен он; не выбран — тот, что сейчас на экране.
    const active =
      view === value
        ? "bg-surface-2 text-text"
        : view === null
          ? value === "desktop"
            ? "max-sm:text-faint sm:bg-surface-2 sm:text-text"
            : "sm:text-faint max-sm:bg-surface-2 max-sm:text-text"
          : "text-faint hover:text-text";
    return (
      <button
        type="button"
        onClick={() => setView(value)}
        aria-pressed={view === value}
        className={cn("rounded-lg px-3 py-1.5 text-[0.78rem] font-medium transition-colors", active)}
      >
        {value === "desktop" ? labels.desktop : labels.mobile}
      </button>
    );
  };

  // Компьютерные кадры — по два в ряд, первый экран во всю ширину.
  // Телефонные — узкие, поэтому по четыре.
  const phones = view === "mobile";

  return (
    <div>
      <div className="mb-6 inline-flex gap-1 rounded-xl border border-line bg-surface p-1">
        {tab("desktop")}
        {tab("mobile")}
      </div>

      <ol className={cn("grid gap-x-6 gap-y-10", phones ? "sm:grid-cols-2 lg:grid-cols-4" : "lg:grid-cols-2")}>
        {parts.map((part, index) => (
          <Part
            key={part.key}
            slug={slug}
            part={part.key}
            title={`${String(index + 1).padStart(2, "0")} · ${part.label}`}
            wide={index === 0 && !phones}
            view={view}
            labels={labels}
          />
        ))}
      </ol>
    </div>
  );
}

/** Один раздел: подпись и шторка — своя у каждого, ползунки независимы. */
function Part({
  slug,
  part,
  title,
  wide,
  view,
  labels,
}: {
  slug: string;
  part: string;
  title: string;
  wide: boolean;
  view: View | null;
  labels: BeforeAfterLabels;
}) {
  const [split, setSplit] = useState(50);
  const frame = { slug, part, split, onSplit: setSplit, labels, wide };

  return (
    <li className={cn("min-w-0", wide && "lg:col-span-2")}>
      <h3 className="mb-3 font-mono text-[0.72rem] uppercase tracking-[0.16em] text-muted">{title}</h3>
      <Frame {...frame} view="desktop" className={view === null ? "hidden sm:block" : view === "desktop" ? "" : "hidden"} />
      <Frame {...frame} view="mobile" className={view === null ? "sm:hidden" : view === "mobile" ? "" : "hidden"} />
    </li>
  );
}

function Frame({
  slug,
  part,
  view,
  split,
  onSplit,
  labels,
  wide,
  className,
}: {
  slug: string;
  part: string;
  wide: boolean;
  view: View;
  split: number;
  onSplit: (value: number) => void;
  labels: BeforeAfterLabels;
  className?: string;
}) {
  const dragging = useRef(false);
  const viewName = view === "desktop" ? labels.desktop : labels.mobile;
  const sizes =
    view === "mobile"
      ? "(max-width: 640px) 90vw, 320px"
      : wide
        ? "(max-width: 1280px) 100vw, 1200px"
        : "(max-width: 1024px) 100vw, 600px";

  const moveTo = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const share = ((event.clientX - box.left) / box.width) * 100;
    onSplit(Math.round(Math.min(100, Math.max(0, share)) * 10) / 10);
  };

  return (
    <div className={className}>
      <div
        className={cn(
          "relative cursor-ew-resize touch-pan-y select-none overflow-hidden rounded-2xl border border-line bg-surface",
          "has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-green",
          view === "desktop" ? "aspect-[16/10]" : "mx-auto aspect-[390/844] w-full max-w-[20rem]",
        )}
        onPointerDown={(event) => {
          dragging.current = true;
          event.currentTarget.setPointerCapture(event.pointerId);
          moveTo(event);
        }}
        onPointerMove={(event) => {
          if (dragging.current) moveTo(event);
        }}
        onPointerUp={() => {
          dragging.current = false;
        }}
        onPointerCancel={() => {
          dragging.current = false;
        }}
      >
        <Image
          src={`/cases/${slug}/${part}-before-${view}.webp`}
          alt={labels.altBefore.replace("{view}", viewName)}
          fill
          sizes={sizes}
          draggable={false}
          className="pointer-events-none object-cover object-top"
        />
        <div className="pointer-events-none absolute inset-0" style={{ clipPath: `inset(0 0 0 ${split}%)` }}>
          <Image
            src={`/cases/${slug}/${part}-after-${view}.webp`}
            alt={labels.altAfter.replace("{view}", viewName)}
            fill
            sizes={sizes}
            draggable={false}
            className="object-cover object-top"
          />
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_12px_rgba(0,0,0,.5)]"
          style={{ left: `${split}%` }}
        >
          <span className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink shadow-[0_6px_20px_rgba(0,0,0,.45)]">
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
              <path d="M9 6 4 12l5 6zM15 6l5 6-5 6z" />
            </svg>
          </span>
        </div>

        <span className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-ink/80 px-2.5 py-1 font-mono text-[0.7rem] uppercase tracking-wider text-white">
          {labels.before}
        </span>
        <span className="pointer-events-none absolute bottom-3 right-3 rounded-md bg-green px-2.5 py-1 font-mono text-[0.7rem] uppercase tracking-wider text-ink">
          {labels.after}
        </span>

        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={Math.round(split)}
          onChange={(event) => onSplit(Number(event.target.value))}
          aria-label={labels.slider}
          className="sr-only"
        />
      </div>
    </div>
  );
}
