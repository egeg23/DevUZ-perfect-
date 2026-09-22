"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    ym?: (id: number, action: string, ...rest: unknown[]) => void;
  }
}

/**
 * Просмотры страниц при переходах внутри сайта.
 *
 * Счётчик, вставленный по инструкции Яндекса, считает одну страницу — ту,
 * на которую человек пришёл. Дальше по сайту он ходит по `<Link>`, адрес
 * меняет история браузера, перезагрузки нет — и Метрика об этом не узнаёт.
 * В отчётах это выглядит как сайт из одной страницы с нулевой глубиной
 * просмотра: ровно то, что хотели измерить, и не измеряется.
 *
 * Первый переход пропускаем: его уже посчитал `init` с `url: location.href`,
 * и хит поверх него удвоил бы посещение входной страницы.
 *
 * Только `usePathname`. У `useSearchParams` есть цена: на заранее собранной
 * странице он переводит всё дерево до ближайшего Suspense в клиентский
 * рендер — то есть ради параметров адреса, которых на публичных страницах
 * нет, пришлось бы отдать статику всего сайта.
 */
export function MetrikaHits({ id }: { id: number }) {
  const pathname = usePathname();
  const counted = useRef(false);

  useEffect(() => {
    if (!counted.current) {
      counted.current = true;
      return;
    }
    // Скрипт грузится afterInteractive: до его загрузки `ym` ещё нет, и
    // очередь вызовов, которую заводит сниппет, живёт в том же `window`.
    window.ym?.(id, "hit", window.location.href);
  }, [pathname, id]);

  return null;
}
