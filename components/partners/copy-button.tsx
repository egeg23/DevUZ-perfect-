"use client";

import { useState } from "react";

/**
 * Скопировать ссылку или готовый текст одним нажатием.
 *
 * Партнёр делится ссылкой с телефона: выделять адрес пальцем в таблице —
 * ровно то место, где он бросит. Нет доступа к буферу (старый браузер,
 * встроенный в мессенджер) — выделяем текст, чтобы скопировать руками.
 */
export function CopyButton({
  text,
  label,
  done,
  targetId,
}: {
  text: string;
  label: string;
  done: string;
  /** Элемент с текстом — выделить, если буфер недоступен. */
  targetId?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      const node = targetId ? document.getElementById(targetId) : null;
      if (node) {
        const range = document.createRange();
        range.selectNodeContents(node);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="shrink-0 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-muted transition-colors hover:border-green/50 hover:text-green"
      aria-live="polite"
    >
      {copied ? done : label}
    </button>
  );
}
