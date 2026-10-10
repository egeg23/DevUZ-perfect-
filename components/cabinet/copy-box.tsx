"use client";

import { useState } from "react";

/** Строка для копирования: код виджета, ссылка-приглашение. */
export function CopyBox({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <code className="block flex-1 overflow-x-auto whitespace-nowrap rounded-md border border-line bg-ink px-3 py-2 text-xs">{value}</code>
      <button
        type="button"
        className="rounded-md border border-line px-3 py-1.5 text-sm text-muted hover:text-text"
        onClick={() => {
          navigator.clipboard?.writeText(value).then(() => setDone(true));
        }}
      >
        {done ? "✓" : label}
      </button>
    </div>
  );
}
