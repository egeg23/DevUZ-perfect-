"use client";

import { useEffect } from "react";

import { rememberRef } from "@/lib/partners/client";

/**
 * Ловит `?ref=КОД` в адресе и запоминает его.
 *
 * Стоит в раскладке всех страниц: партнёр может дать ссылку на любую из
 * них, не только на главную. Клик считается один раз на вкладку — счётчик
 * ради статистики партнёра, а не ради денег, и перезагрузки его надувать
 * не должны.
 */
export function RefCapture() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("ref");
    if (!raw) return;

    const code = rememberRef(raw);
    if (!code) return;

    try {
      const marker = `devuz_ref_click:${code}`;
      if (window.sessionStorage.getItem(marker)) return;
      window.sessionStorage.setItem(marker, "1");
    } catch {
      // Без sessionStorage клик засчитается при каждой загрузке — переживём.
    }

    void fetch("/api/partners/click", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code }),
      keepalive: true,
    }).catch(() => undefined);
  }, []);

  return null;
}
