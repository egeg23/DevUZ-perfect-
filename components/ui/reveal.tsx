"use client";

import { useCallback, useState, type ElementType, type ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * Появление блока при первом попадании в зону видимости.
 *
 * Сам переход описан в globals.css — здесь только один IntersectionObserver
 * на элемент, который отключается сразу после срабатывания. Никакой
 * анимационной библиотеки на клиент не уезжает, и prefers-reduced-motion
 * обрабатывается стилями, а не JavaScript.
 *
 * Наблюдатель вешается из ref-колбэка, а не из эффекта: так он начинает
 * следить в тот момент, когда узел появился, и снимается, когда React его
 * отцепил.
 *
 * Блок виден с первого байта. Прячется только тот, что при запуске скрипта
 * лежит целиком ниже экрана, — его посетитель ещё не видел, и прятать его
 * незаметно. Раньше прятались все блоки сразу, стилями, до всякого скрипта:
 * пока на телефоне грузился JavaScript (а через мобильную сеть это секунды),
 * под первым экраном была чёрная пустота — калькулятор, кейсы, форма заявки.
 * Не загрузился скрипт вовсе — пустота навсегда. Владелец, 06.10.2026:
 * «Людей приходит нормально на сайт, но заявок нет почти».
 */
export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  /** Задержка каскада в миллисекундах. */
  delay?: number;
  as?: ElementType;
}) {
  // "shown" — как пришло с сервера: виден. "armed" — ниже экрана, спрятан
  // и ждёт прокрутки. "visible" — до него долистали.
  const [state, setState] = useState<"shown" | "armed" | "visible">("shown");

  const attach = useCallback((node: HTMLElement | null) => {
    if (!node) return;

    // Ref-колбэк срабатывает до первой отрисовки после гидратации, поэтому
    // блок, который уже на экране или выше него, не мигает: он просто
    // остаётся видимым, без анимации.
    if (typeof IntersectionObserver === "undefined") return;
    if (node.getBoundingClientRect().top < window.innerHeight) return;

    setState("armed");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setState("visible");
            observer.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.1 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const Component = Tag as ElementType;

  return (
    <Component
      ref={attach}
      className={cn("reveal", state === "armed" && "reveal-armed", state === "visible" && "reveal-visible", className)}
      style={delay ? ({ "--reveal-delay": `${delay}ms` } as React.CSSProperties) : undefined}
    >
      {children}
    </Component>
  );
}
