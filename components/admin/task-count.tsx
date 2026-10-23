"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { usePanelDict } from "@/components/admin/panel-locale";
import { shellDict } from "@/content/admin-panel/shell";

/**
 * Число на кнопке «Задачи» в меню: открытые задачи на мне, красным — если
 * есть просроченные (владелец, 23.10.2026: «Делаем все сразу» на разбор
 * удобства). Спрашивает при открытии страницы, а не каждые полминуты:
 * звук и плашку о новом даёт TaskPulse (components/admin/task-alerts.tsx).
 * Нет задач или нет связи — ничего не рисует.
 */
export function TaskCount() {
  const t = usePanelDict(shellDict);
  const pathname = usePathname();
  const [counts, setCounts] = useState<{ open: number; overdue: number } | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/admin/tasks/count", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((body: { open?: unknown; overdue?: unknown } | null) => {
        if (!alive || !body) return;
        const open = Number(body.open) || 0;
        const overdue = Number(body.overdue) || 0;
        setCounts({ open, overdue });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [pathname]);

  if (!counts || counts.open === 0) return null;
  const late = counts.overdue > 0;
  return (
    <span
      title={late ? t.tasksCountLate(counts.open, counts.overdue) : t.tasksCount(counts.open)}
      className={`ml-1.5 rounded-full px-1.5 py-0.5 font-mono text-[10px] leading-none ${
        late ? "bg-red-500/15 text-red-300" : "bg-gold/15 text-gold"
      }`}
    >
      {counts.open}
    </span>
  );
}
