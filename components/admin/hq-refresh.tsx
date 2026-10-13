"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Пульс «Главной» обновляется сам, пока страница открыта и видна.
 *
 * Скрытая вкладка не ходит в базу: телефон в кармане с открытой панелью не
 * должен каждые полторы минуты будить сервер. Вернулись на вкладку, а
 * числа старше периода — обновляем сразу, не дожидаясь таймера.
 */
export function HqRefresh({ everyMs }: { everyMs: number }) {
  const router = useRouter();
  useEffect(() => {
    let last = Date.now();
    const tick = () => {
      if (document.visibilityState !== "visible") return;
      last = Date.now();
      router.refresh();
    };
    const timer = window.setInterval(tick, everyMs);
    const onShow = () => {
      if (document.visibilityState === "visible" && Date.now() - last >= everyMs) tick();
    };
    document.addEventListener("visibilitychange", onShow);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onShow);
    };
  }, [router, everyMs]);
  return null;
}
