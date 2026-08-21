"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * Блок, который на глазах «пишется кодом».
 *
 * Пока строка печатается, блок закрыт полупрозрачной подложкой; когда строка
 * дописана, подложка гаснет и остаётся готовая секция. Полторы секунды на
 * блок — ровно столько, чтобы эффект успели заметить и не успели устать.
 *
 * Порядок здесь выбран ради поисковиков, а не ради удобства: в разметке
 * лежит настоящий контент, а накладка появляется только после монтирования.
 * Робот без JavaScript получает обычную секцию, и ни одного шанса, что текст
 * останется невидимым, попросту не возникает. Обратная схема — прятать
 * содержимое до конца анимации — красивее в коде и опаснее в индексе.
 */
export function CodeBoot({
  children,
  /** Строка, которая печатается. Своя на каждый блок — в этом весь смысл. */
  code,
  className,
}: {
  children: ReactNode;
  code: string;
  className?: string;
}) {
  /** null — ещё не начали, число — сколько символов уже напечатано. */
  const [typed, setTyped] = useState<number | null>(null);
  const [fading, setFading] = useState(false);
  const [done, setDone] = useState(false);
  const started = useRef(false);

  const attach = useCallback((node: HTMLElement | null) => {
    if (!node || started.current) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced || typeof IntersectionObserver === "undefined") {
      // В этом режиме анимация не нужна, а контент нужен. Ничего не делаем:
      // накладка так и не появится, блок останется обычным.
      started.current = true;
      setDone(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || started.current) continue;
          started.current = true;
          observer.disconnect();
          setTyped(0);
        }
      },
      // Запускаем чуть раньше, чем блок доедет до центра экрана: пока человек
      // доводит его до глаз, строка уже печатается, и он застаёт процесс, а
      // не его начало.
      { rootMargin: "0px 0px -15% 0px", threshold: 0.05 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (typed === null || done) return;

    if (typed >= code.length) {
      // Дописали: короткая пауза на «прочитать», потом гасим накладку.
      const hold = window.setTimeout(() => setFading(true), 260);
      const clear = window.setTimeout(() => setDone(true), 260 + 420);
      return () => {
        window.clearTimeout(hold);
        window.clearTimeout(clear);
      };
    }

    // Шаг подобран так, чтобы строка любой длины укладывалась примерно в
    // секунду: иначе длинная строка печатается вдвое дольше короткой, и
    // соседние блоки играют вразнобой.
    const step = Math.max(12, Math.round(900 / code.length));
    const timer = window.setTimeout(() => setTyped((n) => (n ?? 0) + 1), step);
    return () => window.clearTimeout(timer);
  }, [typed, code.length, done]);

  // Пока строка печатается, содержимое приспущено; как только накладка
  // начинает гаснуть, оно доезжает на место. Два движения идут внахлёст —
  // получается не «занавес открылся», а «блок собрался».
  const covered = typed !== null && !fading && !done;

  return (
    <div ref={attach} className={cn("relative", className)}>
      <div
        className={cn(
          "transition-[opacity,transform] duration-500 ease-out",
          covered ? "translate-y-2 opacity-0" : "translate-y-0 opacity-100",
        )}
      >
        {children}
      </div>

      {typed !== null && !done ? (
        <div
          aria-hidden="true"
          className={cn(
            // Строка стоит там, где вот-вот появится заголовок секции:
            // отступы повторяют вертикальный ритм секций и горизонтальный —
            // контейнера. Код буквально превращается в заголовок, а не
            // висит по центру пустого прямоугольника.
            "pointer-events-none absolute inset-0 z-10 overflow-hidden bg-ink pt-24 md:pt-32",
            "transition-opacity duration-[420ms] ease-out",
            fading ? "opacity-0" : "opacity-100",
          )}
        >
          <div className="mx-auto w-full max-w-[1320px] px-5 sm:px-8 lg:px-12">
            <pre className="overflow-hidden whitespace-pre font-mono text-[0.72rem] leading-relaxed text-green sm:text-[0.88rem]">
              <span className="text-faint">▸ </span>
              {code.slice(0, typed)}
              <span className="ml-0.5 inline-block h-[1em] w-[0.5em] animate-pulse bg-green align-text-bottom" />
            </pre>
          </div>
        </div>
      ) : null}
    </div>
  );
}
