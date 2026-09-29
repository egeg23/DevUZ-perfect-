"use client";

import { useEffect } from "react";

/**
 * Движение на странице — один наблюдатель на всё, без библиотек.
 *
 * Три вещи, и ни одна не трогает сам скролл: страница листается ровно
 * настолько, насколько двинули палец.
 *
 * 1. `[data-reveal]` получает `data-shown`, когда показался на экране. Как
 *    именно он появляется, решает css прототипа: у каждого блока своё
 *    движение, и все они — только transform и opacity.
 * 2. `[data-speed]` сдвигается по вертикали медленнее или быстрее страницы —
 *    параллакс. Пишется transform в requestAnimationFrame, по одному разу за
 *    кадр, как бы часто ни приходили события прокрутки.
 * 3. `[data-dock]` — кнопка записи внизу телефона — показывается, когда
 *    первый экран с его собственной кнопкой уже пролистан, и прячется, пока
 *    на экране сама форма (`[data-dock-hide]`): кнопка поверх формы, которая
 *    ведёт на эту же форму, только закрывает поля.
 * 4. `[data-progress]` растягивается по ширине от 0 до 1 вместе с прочитанной
 *    долей страницы (scaleX, не width).
 *
 * При prefers-reduced-motion всё сразу видно и ничего не движется.
 */
export function Motion() {
  useEffect(() => {
    const root = document.documentElement;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const reveal = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));

    const docks = Array.from(document.querySelectorAll<HTMLElement>("[data-dock]"));

    if (!("IntersectionObserver" in window)) {
      reveal.forEach((el) => el.setAttribute("data-shown", ""));
      docks.forEach((el) => el.setAttribute("data-shown", ""));
      return;
    }
    // Без анимаций всё видно сразу, а слои стоят. Кнопка внизу при этом
    // живёт по тем же правилам: появиться и спрятаться — не анимация.
    if (still) reveal.forEach((el) => el.setAttribute("data-shown", ""));

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-shown", "");
          io.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
    );
    if (!still) reveal.forEach((el) => io.observe(el));

    // Пока форма записи на экране, нижняя кнопка не нужна.
    let formInView = false;
    const hideZones = Array.from(document.querySelectorAll<HTMLElement>("[data-dock-hide]"));
    const zoneIo = new IntersectionObserver(
      (entries) => {
        formInView = entries.some((e) => e.isIntersecting);
        for (const dock of docks) dock.toggleAttribute("data-shown", !formInView && window.scrollY > window.innerHeight * 0.7);
      },
      { threshold: 0 },
    );
    hideZones.forEach((el) => zoneIo.observe(el));

    const layers = still ? [] : Array.from(document.querySelectorAll<HTMLElement>("[data-speed]"));
    const bars = Array.from(document.querySelectorAll<HTMLElement>("[data-progress]"));
    let frame = 0;

    const paint = () => {
      frame = 0;
      const y = window.scrollY;
      const vh = window.innerHeight;
      for (const el of layers) {
        const speed = Number(el.dataset.speed) || 0;
        // Сдвиг считается от середины экрана до середины родителя, а не от
        // верха страницы: иначе слой внизу страницы уезжал бы на сотни
        // пикселей ещё до того, как его увидят.
        const host = el.parentElement ?? el;
        const box = host.getBoundingClientRect();
        if (box.bottom < -vh || box.top > vh * 2) continue;
        const offset = box.top + box.height / 2 - vh / 2;
        el.style.transform = `translate3d(0, ${(offset * speed).toFixed(1)}px, 0)`;
      }
      for (const dock of docks) dock.toggleAttribute("data-shown", !formInView && y > vh * 0.7);
      if (bars.length) {
        const max = root.scrollHeight - vh;
        const share = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
        for (const bar of bars) bar.style.transform = `scaleX(${share.toFixed(4)})`;
      }
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };

    paint();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      io.disconnect();
      zoneIo.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
