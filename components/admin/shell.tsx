import Link from "next/link";
import type { ReactNode } from "react";

import { signOut } from "@/app/admin/actions";
import type { Staff } from "@/lib/admin/session";

const NAV = [
  { href: "/admin", label: "Лиды" },
  { href: "/admin/orders", label: "Заявки" },
  { href: "/admin/projects", label: "Проекты" },
  { href: "/admin/stats", label: "Статистика" },
] as const;

/**
 * Каркас панели.
 *
 * Роль подписана рядом с именем намеренно: половина ошибок в таких панелях
 * начинается с «я думал, у меня нет прав это трогать».
 */
export function AdminShell({
  staff,
  children,
}: {
  staff: Staff;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3">
          <Link href="/admin" className="font-mono text-xs uppercase tracking-[0.2em] text-faint">
            DevUz · панель
          </Link>

          <nav className="flex gap-4 text-sm">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="text-muted hover:text-text">
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="text-muted">
              {staff.display_name}
              <span className="ml-2 rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-faint">
                {staff.role === "admin" ? "админ" : "менеджер"}
              </span>
            </span>
            <form action={signOut}>
              <button type="submit" className="text-faint transition hover:text-text">
                Выйти
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8">{children}</main>
    </div>
  );
}
