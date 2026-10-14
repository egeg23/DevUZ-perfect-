"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Тонкая полоса загрузки сверху — с момента нажатия на ссылку панели до
 * открытия страницы.
 *
 * Владелец, 14.10.2026: «я не понимаю, нажал ли я на кнопку или нет:
 * кнопка начинает подсвечиваться только после перехода в раздел, а не во
 * время тапа». Страницы панели собираются на сервере, и до ответа экран
 * стоит как был. Полоса появляется в ту же секунду, что и нажатие, и
 * гаснет, когда адрес сменился (или через 15 секунд — на всякий случай).
 */
export function NavProgress() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [busy, setBusy] = useState(false);

  // Новый адрес — страница открылась.
  useEffect(() => {
    setBusy(false);
  }, [pathname, search]);

  useEffect(() => {
    if (!busy) return;
    const timer = window.setTimeout(() => setBusy(false), 15_000);
    return () => window.clearTimeout(timer);
  }, [busy]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      // Без проверки defaultPrevented: <Link> сам отменяет обычный переход
      // браузера и ведёт по-своему — это и есть наш случай.
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || !url.pathname.startsWith("/admin")) return;
      // Тот же адрес, только якорь, — переход без загрузки.
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      setBusy(true);
    };
    // Пустой обработчик касания: без него Safari на iPhone не показывает
    // :active у ссылок и кнопок — а это и есть «видно нажатие».
    const noop = () => {};
    // Перехват (capture): обработчик React у <Link> срабатывает раньше
    // всплытия до document и отменяет событие.
    document.addEventListener("click", onClick, true);
    document.addEventListener("touchstart", noop, { passive: true });
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("touchstart", noop);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      data-nav-progress={busy ? "on" : "off"}
      className={`pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden transition-opacity duration-150 ${busy ? "opacity-100" : "opacity-0"}`}
    >
      <div className="nav-progress-bar h-full w-1/3 rounded-full bg-green" />
    </div>
  );
}
