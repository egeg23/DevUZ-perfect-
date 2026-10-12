import Link from "next/link";
import type { ReactNode } from "react";

import { signOut } from "@/app/admin/actions";
import { ROLE_BADGE } from "@/lib/admin/roles";
import { findable, menuOf } from "@/lib/admin/nav";
import type { Staff } from "@/lib/admin/session";
import { pick } from "@/lib/admin/i18n";
import { navGroupDict, shellDict } from "@/content/admin-panel/shell";
import { SectionHelpLink } from "@/components/admin/help-link";
import { NavMenu, type NavMenuGroup } from "@/components/admin/nav-menu";
import { LocaleSwitch } from "@/components/admin/locale-switch";
import { PanelLocaleProvider } from "@/components/admin/panel-locale";
import { UsageBeacon } from "@/components/admin/usage-beacon";
import { TaskPulse } from "@/components/admin/task-alerts";

/**
 * Каркас панели.
 *
 * Роль подписана рядом с именем намеренно: половина ошибок в таких панелях
 * начинается с «я думал, у меня нет прав это трогать».
 *
 * Язык — сотрудника (`staff.panel_locale`). Каркас отдаёт его клиентским
 * компонентам через провайдер: страницы, которые рисуются внутри, берут его
 * так же из `staff`, а их клиентские части — через usePanelLocale().
 */
export function AdminShell({
  staff,
  children,
}: {
  staff: Staff;
  children: ReactNode;
}) {
  const locale = staff.panel_locale;
  const t = pick(shellDict, locale);
  // Разделы приходят из матрицы ролей с галочками владельца (menuOf → navOf),
  // уже разложенные по группам. Общие пункты ярче, административные тише.
  const groupName = pick(navGroupDict, locale);
  const menu: NavMenuGroup[] = menuOf(staff).map(({ group, sections }) => ({
    id: group,
    label: groupName[group],
    items: sections.map((s) => ({ ...findable(s, groupName[group], locale), quiet: s.roles.length === 1 })),
  }));
  return (
    <PanelLocaleProvider locale={locale}>
      <div className="admin-panel min-h-screen">
        {/* Учёт просмотров для отчёта «Использование». Владельца не считаем —
            и маячок ему не ставим: лишний запрос на каждый переход ни к чему. */}
        {staff.role === "admin" ? null : <UsageBeacon />}
        {/* Задачи: пока панель открыта, новое приходит звуком и
            уведомлением браузера — в любом разделе, не только на главной. */}
        <TaskPulse />
        {/* Шапка липкая: на телефоне список лидов длинный, и уходить наверх
            ради перехода в другой раздел — лишняя прокрутка в обе стороны. */}
        <header className="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center gap-x-3 px-4 py-3 sm:px-5">
            <Link href="/admin" className="font-mono text-xs uppercase tracking-[0.2em] text-faint">
              DevUz<span className="hidden sm:inline"> · {t.panel}</span>
            </Link>

            <div className="ml-auto flex items-center gap-3 text-sm">
              {/* В шапке, а не на каждой странице: новый раздел получает
                  кнопку сам, и ведёт она в его пункт инструкции. */}
              <SectionHelpLink />
              {/* Рядом с инструкцией: язык выбирают, когда что-то непонятно. */}
              <LocaleSwitch />
              <span className="flex items-center gap-2 text-muted">
                <span className="max-w-[7rem] truncate sm:max-w-none">{staff.display_name}</span>
                <span className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-faint">
                  {ROLE_BADGE[staff.role][locale]}
                </span>
              </span>
              <form action={signOut}>
                <button type="submit" className="text-faint transition hover:text-text">
                  {t.signOut}
                </button>
              </form>
            </div>
          </div>

          {/* Меню группами: двадцать с лишним пунктов в строку владелец
              называл «с ума пойдешь». Открытая группа и раздел подсвечены —
              по адресу видно, где ты, только в строке браузера, а её на
              телефоне нет. */}
          <NavMenu groups={menu} />
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-5 sm:py-8">{children}</main>
      </div>
    </PanelLocaleProvider>
  );
}
