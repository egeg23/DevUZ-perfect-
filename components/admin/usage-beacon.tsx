"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Маячок просмотров: при каждом переходе между разделами панели — один
 * запрос с адресом страницы.
 *
 * С клиента, а не при отрисовке на сервере: Next заранее подгружает
 * страницы, на которые ведут ссылки меню, и серверный счётчик засчитал бы
 * «просмотр» каждого пункта меню на каждом открытии панели. Здесь считается
 * то, что человек действительно открыл.
 *
 * sendBeacon — чтобы запрос не держал переход и не терялся, если вкладку
 * закрыли сразу после.
 */
export function UsageBeacon() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    const body = JSON.stringify({ path: pathname });
    try {
      if (navigator.sendBeacon?.("/api/usage", new Blob([body], { type: "application/json" }))) return;
    } catch {
      // Ниже — запасной путь.
    }
    fetch("/api/usage", {
      method: "POST",
      body,
      headers: { "content-type": "application/json" },
      keepalive: true,
    }).catch(() => undefined);
  }, [pathname]);

  return null;
}
