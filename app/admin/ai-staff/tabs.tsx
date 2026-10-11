import Link from "next/link";

import { bloggersDict } from "@/content/admin-panel/ai-staff-bloggers";
import { pick, type PanelLocale } from "@/lib/admin/i18n";
import type { Role } from "@/lib/admin/roles";

/**
 * Вкладки раздела «ИИ-сотрудники». Клиенты сервиса — деньги и подписки —
 * только владельцу; «Блогеры» — всем, кто видит раздел.
 */
export function AiStaffTabs({ role, locale, current }: { role: Role; locale: PanelLocale; current: "clients" | "bloggers" }) {
  const t = pick(bloggersDict, locale);
  const tabs = [
    ...(role === "admin" ? [{ id: "clients" as const, href: "/admin/ai-staff", label: t.tabClients }] : []),
    { id: "bloggers" as const, href: "/admin/ai-staff/bloggers", label: t.tabBloggers },
  ];
  return (
    <nav className="flex gap-1 border-b border-line">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          className={`-mb-px border-b-2 px-3 py-2 text-sm ${tab.id === current ? "border-green text-text" : "border-transparent text-muted hover:text-text"}`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
