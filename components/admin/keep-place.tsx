"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { usePanelDict } from "@/components/admin/panel-locale";
import { toastDict } from "@/content/admin-panel/toast";

/**
 * Экран остаётся на месте, результат — плашкой сверху на 2,5 секунды.
 *
 * Владелец, 03.11.2026: «когда мы что-то делаем с лидом в середине
 * страницы, можно чтобы экран после нажатия на статус клиента или любое
 * действие с ним не уносил экран наверх, а оставался на месте, а результат
 * нажатой кнопки высвечивался сверху экрана „успех“, „ошибка“ и тд на 2-3
 * секунды?»
 *
 * Кнопки панели — формы с server action, а он отвечает редиректом на ту же
 * страницу с результатом в адресе (`?r=ok`): Next после такого перехода
 * прокручивает наверх. Здесь — для всей панели сразу, без правки каждой
 * формы: перед отправкой формы запоминаем, где был экран; пришла та же
 * страница в течение 20 секунд — возвращаем экран туда же. Плашка берёт
 * текст из того, что страница и так рисует (`data-result="ok|warn"` у
 * строки результата), или из `?done=` (словарь toastDict).
 *
 * Только `transform` и `opacity`; при prefers-reduced-motion плашка просто
 * появляется и исчезает.
 */

const KEY = "admin-keep-place";
const FRESH_MS = 20_000;
const SHOW_MS = 2600;

type Saved = { path: string; y: number; at: number };

export function KeepPlace() {
  const t = usePanelDict(toastDict);
  // Словарь — через ref: объект новый на каждой отрисовке, а эффект ниже
  // должен срабатывать только на смену адреса, иначе плашка начиналась бы заново.
  const dict = useRef(t);
  dict.current = t;
  const pathname = usePathname();
  const search = useSearchParams();
  const [toast, setToast] = useState<{ text: string; ok: boolean; id: number } | null>(null);

  // Перед отправкой любой формы панели — где экран.
  useEffect(() => {
    const onSubmit = (e: SubmitEvent) => {
      const form = e.target as HTMLFormElement | null;
      if (!form || form.closest("[data-keep-place='off']")) return;
      try {
        sessionStorage.setItem(KEY, JSON.stringify({ path: location.pathname, y: window.scrollY, at: Date.now() } satisfies Saved));
      } catch {}
    };
    document.addEventListener("submit", onSubmit, true);
    return () => document.removeEventListener("submit", onSubmit, true);
  }, []);

  // Пришла страница после действия: экран — на место, результат — плашкой.
  const query = search?.toString() ?? "";
  useEffect(() => {
    let saved: Saved | null = null;
    try {
      const raw = sessionStorage.getItem(KEY);
      saved = raw ? (JSON.parse(raw) as Saved) : null;
    } catch {}
    const fresh = saved && Date.now() - saved.at < FRESH_MS;
    if (fresh && saved && saved.path === location.pathname) {
      const y = saved.y;
      // После прокрутки самого Next: два кадра.
      requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior })));
    }
    if (fresh) {
      try {
        sessionStorage.removeItem(KEY);
      } catch {}
    }

    const params = new URLSearchParams(query);
    const done = params.get("done");
    const d = dict.current;
    const fromDict = done && Object.hasOwn(d, `done_${done}`) ? (d[`done_${done}` as keyof typeof d] as string) : null;
    const banner = fresh ? document.querySelector<HTMLElement>("[data-result]") : null;
    const text = fromDict ?? banner?.textContent?.trim() ?? null;
    if (!text) return;
    const ok = fromDict ? !done?.startsWith("fail") && !done?.startsWith("no_") : banner?.dataset.result === "ok";
    const id = Date.now();
    setToast({ text, ok, id });
    const timer = setTimeout(() => setToast((cur) => (cur?.id === id ? null : cur)), SHOW_MS);
    return () => clearTimeout(timer);
  }, [pathname, query]);

  if (!toast) return null;
  return (
    <div className="os-toast-wrap" role="status" aria-live="polite">
      <div key={toast.id} className={`os-toast ${toast.ok ? "is-ok" : "is-warn"}`}>
        <span aria-hidden>{toast.ok ? "✓" : "!"}</span>
        <span>{toast.text}</span>
      </div>
    </div>
  );
}
