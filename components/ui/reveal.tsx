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
  const [visible, setVisible] = useState(false);

  const attach = useCallback((node: HTMLElement | null) => {
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      // Очень старый браузер: лучше показать контент, чем спрятать навсегда.
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
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
      className={cn("reveal", visible && "reveal-visible", className)}
      style={delay ? ({ "--reveal-delay": `${delay}ms` } as React.CSSProperties) : undefined}
    >
      {children}
    </Component>
  );
}
