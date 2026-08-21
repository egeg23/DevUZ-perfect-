"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

/**
 * Прогресс прокрутки закреплённой секции — число от 0 до 1.
 *
 * Секция высокая, внутри неё липкий экран: пока пользователь листает эти
 * несколько экранов высоты, картинка стоит на месте и меняется покадрово.
 * Отсюда берётся вся хореография сцены сборки.
 *
 * Считаем вручную, а не через ScrollTimeline или анимационную библиотеку.
 * Причина простая: `animation-timeline` до сих пор не во всех браузерах, а
 * GSAP с ScrollTrigger — это лишние полсотни килобайт на странице, у которой
 * LCP является рабочим SEO-показателем. Один пассивный слушатель с rAF даёт
 * ровно то же, что нам нужно, и ничего сверх.
 */
export function useScrollProgress(ref: RefObject<HTMLElement | null>) {
  const [progress, setProgress] = useState(0);
  const [reduced, setReduced] = useState(false);
  const frame = useRef(0);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");

    const applyPreference = () => {
      setReduced(media.matches);
      // В режиме пониженной анимации показываем финальный кадр сразу:
      // застывший на середине хаос читался бы как поломка, а не как эффект.
      if (media.matches) setProgress(1);
    };

    applyPreference();
    media.addEventListener("change", applyPreference);

    const measure = () => {
      frame.current = 0;
      const el = ref.current;
      if (!el || media.matches) return;

      const rect = el.getBoundingClientRect();
      const travel = el.offsetHeight - window.innerHeight;
      if (travel <= 0) {
        setProgress(0);
        return;
      }

      const value = -rect.top / travel;
      setProgress(value < 0 ? 0 : value > 1 ? 1 : value);
    };

    const onScroll = () => {
      // Пересчёт не чаще кадра: скролл-события прилетают пачками, а каждый
      // setState тянет за собой перерисовку сцены целиком.
      if (frame.current) return;
      frame.current = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      media.removeEventListener("change", applyPreference);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [ref]);

  return { progress, reduced };
}

/**
 * Нормализует прогресс внутри отрезка [from, to] в диапазон 0..1.
 * Так каждая фаза сцены описывается своими границами и не зависит от соседних.
 */
export function phase(progress: number, from: number, to: number): number {
  if (to <= from) return progress >= to ? 1 : 0;
  const value = (progress - from) / (to - from);
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

/** Сглаживание: убирает рывок на границах фазы. */
export function ease(value: number): number {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2;
}
