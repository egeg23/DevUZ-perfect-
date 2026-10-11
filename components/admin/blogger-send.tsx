"use client";

import { useState } from "react";

import { usePanelDict } from "@/components/admin/panel-locale";
import { bloggersDict } from "@/content/admin-panel/ai-staff-bloggers";

/**
 * «Скопировать и открыть Direct» (или почту): текст — в буфер, следом
 * открывается переписка с блогером в Instagram (ig.me/m/<ник>) или письмо.
 * Менеджеру остаётся вставить и нажать «Отправить» — одно касание.
 * Instagram не даёт писать первым через API, поэтому отправляет человек.
 */
export function BloggerSend({ text, url, label }: { text: string; url: string; label: string }) {
  const t = usePanelDict(bloggersDict);
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        const open = () => window.open(url, "_blank", "noopener");
        navigator.clipboard?.writeText(text).then(
          () => {
            setCopied(true);
            open();
          },
          open,
        );
      }}
      className="rounded-md border border-green/40 px-2.5 py-1 text-xs text-green hover:bg-green/10"
    >
      {copied ? t.copied : label}
    </button>
  );
}
