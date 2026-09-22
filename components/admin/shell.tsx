import Link from "next/link";
import type { ReactNode } from "react";

import { signOut } from "@/app/admin/actions";
import { ROLE_BADGE, navFor } from "@/lib/admin/roles";
import type { Staff } from "@/lib/admin/session";
import { UsageBeacon } from "@/components/admin/usage-beacon";

/**
 * Разделы приходят из матрицы ролей — одной на панель, уведомления и
 * действия. Здесь только раскладка: общие пункты ярче, административные
 * тише.
 */
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
    <div className="admin-panel min-h-screen">
      {/* Учёт просмотров для отчёта «Использование». Владельца не считаем —
          и маячок ему не ставим: лишний запрос на каждый переход ни к чему. */}
      {staff.role === "admin" ? null : <UsageBeacon />}
      {/* Шапка липкая: на телефоне список лидов длинный, и уходить наверх
          ради перехода в другой раздел — лишняя прокрутка в обе стороны. */}
      <header className="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-x-3 px-4 py-3 sm:px-5">
          <Link href="/admin" className="font-mono text-xs uppercase tracking-[0.2em] text-faint">
            DevUz<span className="hidden sm:inline"> · панель</span>
          </Link>

          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="flex items-center gap-2 text-muted">
              <span className="max-w-[7rem] truncate sm:max-w-none">{staff.display_name}</span>
              <span className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-faint">
                {ROLE_BADGE[staff.role]}
              </span>
            </span>
            <form action={signOut}>
              <button type="submit" className="text-faint transition hover:text-text">
                Выйти
              </button>
            </form>
          </div>
        </div>

        {/* Меню — одной строкой с прокруткой, а не переносом: двенадцать
            пунктов в четыре ряда занимали на телефоне треть экрана, и
            содержимое страницы начиналось за сгибом. */}
        <nav className="no-scrollbar mx-auto max-w-7xl overflow-x-auto px-4 pb-2.5 sm:px-5 sm:pb-3">
          <div className="flex w-max gap-4 text-sm sm:w-auto sm:flex-wrap">
            {navFor(staff.role).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap ${
                  item.roles.length === 1 ? "text-faint hover:text-text" : "text-muted hover:text-text"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-5 sm:py-8">{children}</main>
    </div>
  );
}
