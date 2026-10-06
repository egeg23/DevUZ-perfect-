"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthShell } from "@/components/AuthShell";
import { api } from "@/lib/api";
import { useSubmit } from "@/lib/useForm";

export default function RegisterPage() {
  const { busy, error, run } = useSubmit();
  const [done, setDone] = useState(false);
  const [agree, setAgree] = useState(false);

  return (
    <AuthShell title="Регистрация">
      {done ? (
        <p className="ok">
          Готово. Мы отправили письмо со ссылкой — откройте её, чтобы подтвердить почту.
        </p>
      ) : (
        <form
          className="form"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            run(async () => {
              await api("/auth/register", { email: f.get("email"), password: f.get("password") });
              setDone(true);
            });
          }}
        >
          <label>
            Почта
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            Пароль — не короче 10 символов
            <input name="password" type="password" autoComplete="new-password" minLength={10} required />
          </label>
          <label style={{ display: "flex", gap: 8, alignItems: "flex-start", color: "var(--text)" }}>
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              style={{ marginTop: 4 }}
            />
            <span>
              Понимаю: торговля деривативами — высокий риск, прибыль не гарантирована. Сейчас
              доступен только демо-счёт.
            </span>
          </label>
          {error ? <p className="err">{error}</p> : null}
          <button className="btn" disabled={busy || !agree}>
            Зарегистрироваться
          </button>
        </form>
      )}
      <div className="links">
        <Link href="/login">Уже есть аккаунт — войти</Link>
      </div>
    </AuthShell>
  );
}
