import Link from "next/link";
import { Suspense, type ReactNode } from "react";

import { signOut } from "@/app/admin/actions";
import { ROLE_BADGE, homeOf, navOf } from "@/lib/admin/roles";
import { findable, menuOf, parentsOf, tabsOf } from "@/lib/admin/nav";
import type { Staff } from "@/lib/admin/session";
import { pick } from "@/lib/admin/i18n";
import { navGroupDict, shellDict } from "@/content/admin-panel/shell";
import { SectionHelpLink } from "@/components/admin/help-link";
import { AdminNavLink } from "@/components/admin/nav-link";
import { NavMenu, NavToggle, type NavMenuGroup } from "@/components/admin/nav-menu";
import { LocaleSwitch } from "@/components/admin/locale-switch";
import { PanelLocaleProvider } from "@/components/admin/panel-locale";
import { UsageBeacon } from "@/components/admin/usage-beacon";
import { TaskPulse } from "@/components/admin/task-alerts";
import { NavProgress } from "@/components/admin/nav-progress";
import { SectionTabs } from "@/components/admin/section-tabs";

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
  // Вкладки разделов (lib/admin/nav.ts): в меню их нет, но «Найти раздел»
  // ищет и их — человек помнит «Договоры», а не то, что они теперь в «Проектах».
  const parents = parentsOf(staff);
  const find = navOf(staff).map((s) => ({ ...findable(s, groupName[s.group], locale), quiet: s.roles.length === 1 }));
  const tabs = tabsOf(staff).map((family) => family.map((s) => ({ href: s.href, label: s.label[locale] })));
  return (
    <PanelLocaleProvider locale={locale}>
      <div className="admin-panel min-h-screen">
        {/* Учёт просмотров для отчёта «Использование». Владельца не считаем —
            и маячок ему не ставим: лишний запрос на каждый переход ни к чему. */}
        {staff.role === "admin" ? null : <UsageBeacon />}
        {/* Задачи: пока панель открыта, новое приходит звуком и
            уведомлением браузера — в любом разделе, не только на главной. */}
        <TaskPulse />
        {/* Полоса загрузки — с момента нажатия на ссылку до новой страницы. */}
        <Suspense fallback={null}>
          <NavProgress />
        </Suspense>
        {/* Шапка липкая: на телефоне список лидов длинный, и уходить наверх
            ради перехода в другой раздел — лишняя прокрутка в обе стороны. */}
        <header className="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center gap-x-3 px-4 py-3 sm:px-5">
            <Link href={homeOf(staff)} className="font-mono text-xs uppercase tracking-[0.2em] text-faint">
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
                {/* На телефоне роль не влезала рядом с именем руководителя
                    («рук. проектов») и сдвигала шапку вбок — с планшета она есть. */}
                <span className="hidden rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-faint sm:inline">
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
              телефоне нет. Тумблер «Новое меню» возвращает меню как раньше
              (staff.nav_classic) — каждый выбирает себе сам. */}
          {staff.nav_classic ? (
            <div className="mx-auto flex max-w-7xl items-start gap-4 px-4 pb-2.5 sm:px-5 sm:pb-3">
              {/* Как раньше — одной строкой с прокруткой, а не переносом:
                  двенадцать пунктов в четыре ряда занимали на телефоне треть
                  экрана, и содержимое страницы начиналось за сгибом. */}
              {/* Только вбок: подчёркивание открытого пункта (-mb-px) выходило
                  на пиксель за строку, и на телефоне её можно было тянуть
                  вверх-вниз, обрезая буквы (владелец, 13.10.2026). pb-px
                  оставляет ему место, overflow-y-hidden — запрет на всякий случай. */}
              <nav aria-label={t.nav} className="no-scrollbar min-w-0 flex-1 overflow-x-auto overflow-y-hidden pb-px">
                <div className="flex w-max gap-4 text-sm sm:w-auto sm:flex-wrap">
                  {navOf(staff).map((item) => (
                    <AdminNavLink key={item.href} href={item.href} quiet={item.roles.length === 1}>
                      {item.label[locale]}
                    </AdminNavLink>
                  ))}
                </div>
              </nav>
              <NavToggle classic className="pt-0.5" />
            </div>
          ) : (
            <NavMenu groups={menu} find={find} parents={parents} />
          )}
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-5 sm:py-8">
          {/* В меню «как раньше» все разделы и так в строке — вкладки там не нужны. */}
          {staff.nav_classic ? null : <SectionTabs families={tabs} />}
          {children}
        </main>
      </div>
    </PanelLocaleProvider>
  );
}
