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
 *
 * Ещё раз в минуту — «работаю» (tick): для времени в панели в вечернем
 * отчёте (владелец, 13.10.2026). Только пока вкладка на экране и человек в
 * последние три минуты двигал мышью, печатал, листал или касался экрана:
 * забытая открытой вкладка — не рабочее время.
 */
/**
 * Под /admin — там живёт кука сессии. На прежний адрес под /api она не
 * приходила, и сервер не мог понять, чей это просмотр.
 */
const BEACON = "/admin/beacon";
const TICK_MS = 60_000;
const IDLE_MS = 3 * 60_000;

function send(payload: { path: string; tick?: boolean }) {
  const body = JSON.stringify(payload);
  try {
    if (navigator.sendBeacon?.(BEACON, new Blob([body], { type: "application/json" }))) return;
  } catch {
    // Ниже — запасной путь.
  }
  fetch(BEACON, {
    method: "POST",
    body,
    headers: { "content-type": "application/json" },
    keepalive: true,
  }).catch(() => undefined);
}

export function UsageBeacon() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    send({ path: pathname });
  }, [pathname]);

  useEffect(() => {
    let lastInput = Date.now();
    const seen = () => {
      lastInput = Date.now();
    };
    const events = ["pointermove", "pointerdown", "keydown", "scroll", "touchstart"] as const;
    for (const name of events) window.addEventListener(name, seen, { passive: true });
    const timer = window.setInterval(() => {
      if (document.visibilityState !== "visible" || Date.now() - lastInput > IDLE_MS) return;
      send({ path: window.location.pathname, tick: true });
    }, TICK_MS);
    return () => {
      window.clearInterval(timer);
      for (const name of events) window.removeEventListener(name, seen);
    };
  }, []);

  return null;
}
