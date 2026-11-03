"use client";

import type { ReactNode } from "react";

/**
 * «🗑 Мусор» в панели: форма с вопросом «точно?» — лид удаляется целиком,
 * вернуть нельзя (lib/admin/lead-trash.ts). Права решает сервер (mayTrash).
 */
export function TrashButton({
  action,
  leadId,
  confirm,
  hidden = {},
  className,
  children,
}: {
  action: (formData: FormData) => Promise<void>;
  leadId: string;
  confirm: string;
  hidden?: Readonly<Record<string, string>>;
  className: string;
  children: ReactNode;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(confirm)) e.preventDefault();
      }}
    >
      <input type="hidden" name="lead" value={leadId} />
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <button type="submit" className={className}>
        {children}
      </button>
    </form>
  );
}
