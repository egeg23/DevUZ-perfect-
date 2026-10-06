"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthShell } from "@/components/AuthShell";
import { api } from "@/lib/api";
import { useSubmit } from "@/lib/useForm";

export default function ForgotPage() {
  const { busy, error, run } = useSubmit();
  const [done, setDone] = useState(false);
  return (
    <AuthShell title="Сброс пароля">
      {done ? (
        <p className="ok">Если такая почта зарегистрирована, на неё пришла ссылка. Она действует 1 час.</p>
      ) : (
        <form
          className="form"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            run(async () => {
              await api("/auth/password/forgot", { email: f.get("email") });
              setDone(true);
            });
          }}
        >
          <label>
            Почта
            <input name="email" type="email" autoComplete="email" required />
          </label>
          {error ? <p className="err">{error}</p> : null}
          <button className="btn" disabled={busy}>
            Прислать ссылку
          </button>
        </form>
      )}
      <div className="links">
        <Link href="/login">Вход</Link>
      </div>
    </AuthShell>
  );
}
