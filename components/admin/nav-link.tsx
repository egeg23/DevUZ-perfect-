"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { sectionOfHref } from "@/lib/admin/help";

/**
 * Пункт верхнего меню панели, который знает, открыт ли его раздел.
 *
 * Владелец, 04.10.2026: «когда я нажимаю на любой пункт в верхнем меню, он
 * не выделен цветом — сделай, чтобы активная вкладка выделялась». Меню
 * рисует сервер, а он не знает адреса страницы, — поэтому пункт клиентский:
 * раздел определяется по адресу так же, как для «Как пользоваться разделом»
 * (карточка лида — это раздел «Лиды», карточка проекта — «Проекты»).
 *
 * Тот же пункт — строкой в выпадающем списке группы и в меню телефона
 * (`variant="item"`, components/admin/nav-menu.tsx).
 */
export function AdminNavLink({
  href,
  quiet,
  variant = "tab",
  onClick,
  children,
}: {
  href: string;
  quiet: boolean;
  /** «tab» — в строке шапки, «item» — строкой в списке группы. */
  variant?: "tab" | "item";
  onClick?: () => void;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const active = sectionOfHref(pathname ?? "") === href;
  const tone = quiet ? "text-faint" : "text-muted";

  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={
        variant === "item"
          ? `block whitespace-nowrap rounded-md px-3 py-2 transition-colors ${
              active ? "bg-green/10 font-medium text-green" : `hover:bg-surface-2 hover:text-text ${tone}`
            }`
          : `-mb-px whitespace-nowrap border-b-2 pb-1 transition-colors ${
              active ? "border-green font-medium text-green" : `border-transparent hover:text-text ${tone}`
            }`
      }
    >
      {children}
    </Link>
  );
}
