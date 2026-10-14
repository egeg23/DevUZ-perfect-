"use client";

import { useLinkStatus } from "next/link";

/**
 * Точка «загружается» внутри ссылки — пока Next ждёт страницу после
 * нажатия (useLinkStatus). Место под неё есть всегда, меняется только
 * прозрачность: пункт меню не прыгает.
 */
export function LinkPending() {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden="true"
      className={`ml-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-green align-middle transition-opacity ${
        pending ? "animate-pulse opacity-100" : "opacity-0"
      }`}
    />
  );
}
