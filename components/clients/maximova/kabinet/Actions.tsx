"use client";

import { useState } from "react";

import s from "./kabinet.module.css";

export function Logout() {
  return (
    <button
      type="button"
      className={s.link}
      onClick={async () => {
        await fetch("/api/maximova/auth/logout", { method: "POST" }).catch(() => null);
        window.location.href = "/maximova";
      }}
    >
      Выйти
    </button>
  );
}

/** Дарья отмечает, что связалась с родителем. */
export function StatusToggle({ id, status }: { id: number; status: "new" | "contacted" }) {
  const [current, setCurrent] = useState(status);
  const [busy, setBusy] = useState(false);
  const next = current === "new" ? "contacted" : "new";
  return (
    <button
      type="button"
      className={current === "new" ? s.statusNew : s.statusDone}
      disabled={busy}
      aria-pressed={current === "contacted"}
      onClick={async () => {
        setBusy(true);
        const response = await fetch("/api/maximova/admin/booking", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id, status: next }),
        }).catch(() => null);
        if (response?.ok) setCurrent(next);
        setBusy(false);
      }}
    >
      {current === "new" ? "Новая — отметить «связалась»" : "Связалась ✓"}
    </button>
  );
}
