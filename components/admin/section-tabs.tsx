"use client";

import { usePathname } from "next/navigation";

import { AdminNavLink } from "@/components/admin/nav-link";
import { usePanelDict } from "@/components/admin/panel-locale";
import { shellDict } from "@/content/admin-panel/shell";

/**
 * Вкладки над страницей раздела: «Холодные касания · Сигналы скаута ·
 * Разбор переписки · Аккаунты», «Проекты · Договоры» и так далее.
 *
 * Владелец, 25.10.2026, на «какие разделы можно объединить»: «Погнали по
 * порядку». Редкие разделы ушли из меню внутрь своих: 28 пунктов стали 17.
 * Что кому открыто, решает сервер (`tabsOf` в lib/admin/nav.ts: роль,
 * галочки, выключатели) — здесь только где мы. Строка — только на самой
 * странице раздела или вкладки, не в карточке проекта или договора: там
 * она отвлекала бы от одной записи.
 */
export function SectionTabs({ families }: { families: readonly (readonly { href: string; label: string }[])[] }) {
  const t = usePanelDict(shellDict);
  const pathname = (usePathname() ?? "").replace(/\/+$/, "") || "/admin";
  const family = families.find((f) => f.some((tab) => tab.href === pathname));
  if (!family) return null;
  return (
    <nav aria-label={t.sectionTabs} className="no-scrollbar -mt-1 mb-5 overflow-x-auto overflow-y-hidden border-b border-line pb-px sm:-mt-2">
      <div className="flex w-max gap-5 text-sm">
        {family.map((tab) => (
          <AdminNavLink key={tab.href} href={tab.href} quiet={false}>
            {tab.label}
          </AdminNavLink>
        ))}
      </div>
    </nav>
  );
}
