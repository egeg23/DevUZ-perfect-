import { signIn } from "./actions";

export const dynamic = "force-dynamic";

/**
 * Вход в панель. Ни поля пароля, ни поля почты здесь нет и не появится:
 * пароли у небольшой команды заканчиваются одинаково — общим паролем в
 * закреплённом сообщении. Единственный вход — команда /login боту, который
 * уже знает, кто ему пишет.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string; e?: string }>;
}) {
  const { t: token, e: error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-faint">
        DevUz Studio
      </p>
      <h1 className="mt-3 text-2xl font-semibold">Вход в панель</h1>

      {error ? (
        <p className="mt-6 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-muted">
          {error === "2"
            ? "База недоступна — войти сейчас нельзя. Попробуйте через минуту."
            : "Ссылка не сработала: она одноразовая и живёт 15 минут. Запросите новую."}
        </p>
      ) : null}

      {token ? (
        <form action={signIn} className="mt-8">
          <input type="hidden" name="t" value={token} />
          <button
            type="submit"
            className="w-full rounded-xl bg-green px-5 py-3 text-sm font-semibold text-ink transition hover:bg-green-dim"
          >
            Войти
          </button>
          <p className="mt-3 text-xs text-faint">
            Ссылка сгорит после нажатия.
          </p>
        </form>
      ) : (
        <ol className="mt-8 space-y-3 text-sm text-muted">
          <li>1. Откройте чат с ботом студии.</li>
          <li>
            2. Отправьте{" "}
            <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-text">
              /login
            </code>
            .
          </li>
          <li>3. Нажмите на ссылку из ответа — она живёт 15 минут.</li>
        </ol>
      )}
    </main>
  );
}
