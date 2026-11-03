"use client";

import { useEffect, useState } from "react";

import { usePanelDict } from "@/components/admin/panel-locale";
import { shellDict } from "@/content/admin-panel/shell";

/**
 * «В сети» и часы в верхней панели, как в эталоне «DevUz Офис».
 *
 * «В сети» — правда о связи этого устройства (`navigator.onLine`): панель
 * живёт приложением на телефоне, и без связи кнопки молча не сработают.
 * Часы — время Ташкента, в нём работает вся команда и все правила бота
 * (ночное окно, отчёты). До первого кадра браузера время не рисуется: сервер
 * и браузер насчитали бы разные минуты.
 */
export function OsStatus() {
  const t = usePanelDict(shellDict);
  const [online, setOnline] = useState(true);
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    const tick = () =>
      setTime(new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tashkent" }));
    sync();
    tick();
    const timer = setInterval(tick, 20_000);
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      clearInterval(timer);
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  return (
    <>
      <span className={`os-online ${online ? "" : "is-off"}`}>
        <i aria-hidden />
        <span className="hidden lg:inline">{online ? t.online : t.offline}</span>
        <span className="sr-only lg:hidden">{online ? t.online : t.offline}</span>
      </span>
      <time title={t.clock} className="os-clock hidden sm:inline">
        {time ?? "--:--"}
      </time>
    </>
  );
}
