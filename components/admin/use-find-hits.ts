"use client";

import { useEffect, useState } from "react";

import type { FindHit } from "@/lib/admin/find";

/**
 * Компании и лиды под набранное — с сервера (app/admin/find), через 250 мс
 * после последней буквы, чтобы не спрашивать базу на каждую. Короче двух
 * знаков — не ищем; ответ на старую строку не перебивает новую. Зовут
 * Ctrl+K (nav-menu.tsx) и выбор клиента в заказе макета (mockup-order-fields.tsx).
 */
export function useFindHits(query: string): { list: FindHit[]; loading: boolean } {
  const q = query.trim();
  const [state, setState] = useState<{ q: string; list: FindHit[] }>({ q: "", list: [] });
  useEffect(() => {
    if (q.length < 2) return;
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/admin/find?q=${encodeURIComponent(q)}`, { cache: "no-store", signal: ctrl.signal })
        .then((r) => (r.ok ? r.json() : { hits: [] }))
        .then((body: { hits?: FindHit[] }) => setState({ q, list: Array.isArray(body.hits) ? body.hits : [] }))
        .catch(() => {});
    }, 250);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [q]);
  if (q.length < 2) return { list: [], loading: false };
  return state.q === q ? { list: state.list, loading: false } : { list: [], loading: true };
}
