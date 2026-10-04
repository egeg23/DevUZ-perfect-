"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

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
 * На телефоне меню прокручивается вбок, и открытый раздел мог оказаться за
 * краем, — активный пункт сам доезжает в видимую часть.
 */
export function AdminNavLink({ href, quiet, children }: { href: string; quiet: boolean; children: ReactNode }) {
  const pathname = usePathname();
  const active = sectionOfHref(pathname ?? "") === href;
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (active) ref.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [active]);

  return (
    <Link
      ref={ref}
      href={href}
      aria-current={active ? "page" : undefined}
      className={`-mb-px whitespace-nowrap border-b-2 pb-1 transition-colors ${
        active
          ? "border-green font-medium text-green"
          : `border-transparent hover:text-text ${quiet ? "text-faint" : "text-muted"}`
      }`}
    >
      {children}
    </Link>
  );
}
